/**
 * Audio Capture Module
 * Handles microphone access, real-time audio level monitoring,
 * recording with MediaRecorder API, and WAV format conversion.
 */

export interface RecordingState {
  stream: MediaStream | null;
  mediaRecorder: MediaRecorder | null;
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  chunks: Blob[];
  isRecording: boolean;
  startTime: number;
}

/** Configurable recording constraints */
const AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 16000,
    channelCount: 1,
  },
};

/** Minimum and maximum recording durations (in seconds) */
export const MIN_DURATION_SECONDS = 2;
export const MAX_DURATION_SECONDS = 10;

/** Singleton state for the active recording session */
let activeState: RecordingState = {
  stream: null,
  mediaRecorder: null,
  audioContext: null,
  analyser: null,
  chunks: [],
  isRecording: false,
  startTime: 0,
};

/** Animation frame ID for the level monitor */
let levelAnimFrame: number | null = null;

/** Callback for live audio level updates (0.0 to 1.0) */
let levelCallback: ((level: number) => void) | null = null;

/** Callback for live waveform frequency data */
let waveformCallback: ((bars: number[]) => void) | null = null;

/**
 * Request microphone access and set up audio analysis nodes.
 * Returns the active MediaStream on success.
 */
export async function requestMicrophoneAccess(): Promise<MediaStream> {
  if (activeState.stream) {
    stopRecording();
  }

  const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.8;
  source.connect(analyser);

  activeState.stream = stream;
  activeState.audioContext = audioContext;
  activeState.analyser = analyser;
  activeState.chunks = [];

  return stream;
}

/**
 * Start recording audio from the microphone.
 * MediaRecorder captures chunks; an analyser node provides live levels.
 */
export function startRecording(onLevel?: (level: number) => void, onWaveform?: (bars: number[]) => void): void {
  if (!activeState.stream) {
    throw new Error('Microphone access not granted. Call requestMicrophoneAccess first.');
  }

  levelCallback = onLevel ?? null;
  waveformCallback = onWaveform ?? null;
  activeState.chunks = [];

  // Determine supported MIME type
  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : 'audio/mp4';

  const recorder = new MediaRecorder(activeState.stream, { mimeType });

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      activeState.chunks.push(event.data);
    }
  };

  activeState.mediaRecorder = recorder;
  activeState.isRecording = true;
  activeState.startTime = Date.now();

  recorder.start(200); // Collect data every 200ms for responsiveness

  // Start the live level monitoring loop
  startLevelMonitor();
}

/**
 * Stop recording and return the recorded audio as a WAV Blob.
 */
export async function stopRecording(): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    // Stop the level monitor
    if (levelAnimFrame !== null) {
      cancelAnimationFrame(levelAnimFrame);
      levelAnimFrame = null;
    }
    levelCallback = null;
    waveformCallback = null;

    const recorder = activeState.mediaRecorder;

    if (!recorder || recorder.state === 'inactive') {
      // If no recorder or already stopped, assemble from existing chunks
      const blob = new Blob(activeState.chunks, { type: recorder?.mimeType || 'audio/webm' });
      cleanup();
      resolve(blob);
      return;
    }

    recorder.onstop = async () => {
      const blob = new Blob(activeState.chunks, { type: recorder.mimeType });

      try {
        // Convert to WAV for backend compatibility
        const wavBlob = await convertToWav(blob);
        cleanup();
        resolve(wavBlob);
      } catch (err) {
        // Fallback: return raw blob if WAV conversion fails
        cleanup();
        resolve(blob);
      }
    };

    recorder.onerror = (event) => {
      cleanup();
      reject(new Error(`Recording error: ${(event as ErrorEvent).message || 'Unknown error'}`));
    };

    recorder.stop();
  });
}

/**
 * Convert any audio blob to WAV format (PCM 16-bit, mono, 16kHz).
 */
async function convertToWav(audioBlob: Blob): Promise<Blob> {
  const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

  // Resample to 16kHz mono if needed
  const targetSampleRate = 16000;
  const numChannels = 1;
  const resampledBuffer = await resampleAudioBuffer(audioBuffer, targetSampleRate, numChannels);

  // Encode as WAV
  const wavBuffer = encodeWav(resampledBuffer, targetSampleRate, numChannels);
  ctx.close();

  return new Blob([wavBuffer], { type: 'audio/wav' });
}

/**
 * Resample an AudioBuffer to the target sample rate and channel count.
 */
async function resampleAudioBuffer(
  buffer: AudioBuffer,
  targetSampleRate: number,
  targetChannels: number
): Promise<AudioBuffer> {
  if (buffer.sampleRate === targetSampleRate && buffer.numberOfChannels === targetChannels) {
    return buffer;
  }

  const offlineCtx = new OfflineAudioContext(
    targetChannels,
    Math.ceil(buffer.duration * targetSampleRate),
    targetSampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(offlineCtx.destination);
  source.start(0);

  return offlineCtx.startRendering();
}

/**
 * Encode an AudioBuffer to a WAV ArrayBuffer (PCM 16-bit).
 */
function encodeWav(buffer: AudioBuffer, sampleRate: number, numChannels: number): ArrayBuffer {
  const samples = buffer.length;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = samples * blockAlign;
  const headerSize = 44;
  const arrayBuffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(arrayBuffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // PCM format chunk size
  view.setUint16(20, 1, true);  // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Interleave and write samples
  const channelData: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channelData.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < samples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return arrayBuffer;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Start the animation loop that reads audio levels and frequency data
 * from the AnalyserNode and dispatches to registered callbacks.
 */
function startLevelMonitor(): void {
  const analyser = activeState.analyser;
  if (!analyser) return;

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  const barCount = 44;

  const tick = () => {
    if (!activeState.isRecording) return;

    analyser.getByteFrequencyData(dataArray);

    // Compute RMS level (0.0 – 1.0)
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length) / 255;
    if (levelCallback) {
      levelCallback(rms);
    }

    // Compute 44-bar waveform from frequency bins
    if (waveformCallback) {
      const binSize = Math.floor(dataArray.length / barCount);
      const bars: number[] = [];
      for (let i = 0; i < barCount; i++) {
        let blockSum = 0;
        for (let j = 0; j < binSize; j++) {
          blockSum += dataArray[i * binSize + j];
        }
        const avg = blockSum / binSize / 255;
        bars.push(parseFloat(Math.min(1, Math.max(0.08, avg * 2.2)).toFixed(3)));
      }
      waveformCallback(bars);
    }

    levelAnimFrame = requestAnimationFrame(tick);
  };

  levelAnimFrame = requestAnimationFrame(tick);
}

/**
 * Get the current recording duration in seconds.
 */
export function getRecordingDuration(): number {
  if (!activeState.isRecording) return 0;
  return (Date.now() - activeState.startTime) / 1000;
}

/**
 * Check if the browser supports MediaRecorder and getUserMedia.
 */
export function isRecordingSupported(): boolean {
  return !!(
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined'
  );
}

/**
 * Clean up all recording resources.
 */
function cleanup(): void {
  activeState.isRecording = false;
  if (activeState.stream) {
    activeState.stream.getTracks().forEach((track) => track.stop());
    activeState.stream = null;
  }
  if (activeState.audioContext && activeState.audioContext.state !== 'closed') {
    activeState.audioContext.close().catch(() => {});
  }
  activeState.audioContext = null;
  activeState.analyser = null;
  activeState.mediaRecorder = null;
  activeState.chunks = [];
}

/**
 * Full cleanup — call on unmount or page unload.
 */
export function releaseAllResources(): void {
  if (levelAnimFrame !== null) {
    cancelAnimationFrame(levelAnimFrame);
    levelAnimFrame = null;
  }
  levelCallback = null;
  waveformCallback = null;
  cleanup();
}
