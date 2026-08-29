import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Square,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileText,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Volume2,
  ChevronDown,
  ChevronUp,
  Clock,
  Radio,
  Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnalysisResult, analyzeAudioClip, generateFallbackWaveform } from '../utils/audioEngine';
import { generateForensicPdfReport } from '../utils/pdfExport';
import {
  requestMicrophoneAccess,
  startRecording,
  stopRecording,
  isRecordingSupported,
  releaseAllResources,
  MIN_DURATION_SECONDS,
  MAX_DURATION_SECONDS,
} from '../utils/audioCapture';

interface LiveDetectionProps {
  onAnalyzeComplete: (result: AnalysisResult, fileName: string) => void;
}

/** Recording phase types */
type RecordingPhase = 'idle' | 'requesting' | 'recording' | 'analyzing' | 'result' | 'error';

export const LiveDetection: React.FC<LiveDetectionProps> = ({ onAnalyzeComplete }) => {
  const [phase, setPhase] = useState<RecordingPhase>('idle');
  const [waveformData, setWaveformData] = useState<number[]>(() => generateFallbackWaveform(44, 7));
  const [audioLevel, setAudioLevel] = useState(0);
  const [duration, setDuration] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showAdvancedForensics, setShowAdvancedForensics] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      releaseAllResources();
    };
  }, []);

  /** Format seconds to MM:SS */
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  /** Start the recording timer */
  const startTimer = useCallback(() => {
    setDuration(0);
    timerRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      setDuration((prev) => {
        const next = prev + 0.1;
        // Auto-stop at max duration
        if (next >= MAX_DURATION_SECONDS) {
          handleStop();
        }
        return next;
      });
    }, 100);
  }, []);

  /** Stop the timer */
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
  }, []);

  /** Handle the "Start Recording" action */
  const handleStart = useCallback(async () => {
    if (!isRecordingSupported()) {
      setPhase('error');
      setErrorMessage('Your browser does not support microphone recording. Please use Chrome, Firefox, or Safari.');
      return;
    }

    setPhase('requesting');
    setErrorMessage('');

    try {
      await requestMicrophoneAccess();
      if (!mountedRef.current) return;

      setPhase('recording');
      startRecording(
        (level) => {
          if (mountedRef.current) setAudioLevel(level);
        },
        (bars) => {
          if (mountedRef.current) setWaveformData(bars);
        }
      );
      startTimer();
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        setErrorMessage('Microphone permission denied. Please allow microphone access in your browser settings and try again.');
      } else if (msg.includes('NotFoundError')) {
        setErrorMessage('No microphone found. Please connect a microphone and try again.');
      } else {
        setErrorMessage(`Could not access microphone: ${msg}`);
      }
      setPhase('error');
    }
  }, [startTimer]);

  /** Handle the "Stop & Analyze" action */
  const handleStop = useCallback(async () => {
    if (phase !== 'recording') return;
    stopTimer();
    setPhase('analyzing');

    try {
      const audioBlob = await stopRecording();
      if (!mountedRef.current) return;

      const recordingDuration = duration;

      if (recordingDuration < MIN_DURATION_SECONDS) {
        setPhase('error');
        setErrorMessage(`Recording too short (${recordingDuration.toFixed(1)}s). Please speak for at least ${MIN_DURATION_SECONDS} seconds for reliable detection.`);
        return;
      }

      // Create a File from the blob for the analysis pipeline
      const file = new File([audioBlob], `live-recording-${Date.now()}.wav`, { type: 'audio/wav' });

      const analysisResult = await analyzeAudioClip(file, (pct, msg) => {
        // Progress updates during analysis
        if (mountedRef.current) setDuration(recordingDuration); // Keep the timer display
      });

      if (!mountedRef.current) return;

      setResult(analysisResult);
      setPhase('result');
      onAnalyzeComplete(analysisResult, file.name);
    } catch (err) {
      if (!mountedRef.current) return;
      setErrorMessage(`Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
      setPhase('error');
    }
  }, [phase, duration, stopTimer, onAnalyzeComplete]);

  /** Reset to idle state for a new recording */
  const handleReset = useCallback(() => {
    stopTimer();
    releaseAllResources();
    setPhase('idle');
    setResult(null);
    setErrorMessage('');
    setDuration(0);
    setAudioLevel(0);
    setWaveformData(generateFallbackWaveform(44, 7));
    setShowAdvancedForensics(false);
  }, [stopTimer]);

  /** Export results as PDF */
  const handleDownloadPdf = useCallback(() => {
    if (!result) return;
    try {
      generateForensicPdfReport('live-recording.wav', result, undefined);
      setExportNotice('Forensic PDF Report downloaded successfully!');
      setTimeout(() => setExportNotice(null), 4000);
    } catch (e) {
      console.error('PDF export failed:', e);
    }
  }, [result]);

  /** Export results as JSON */
  const handleDownloadJson = useCallback(() => {
    if (!result) return;
    const exportData = {
      app: 'DeepfakeGuard AI',
      version: '2.4.0',
      timestamp: new Date().toISOString(),
      source: 'live-recording',
      verdict: {
        isAuthentic: result.isAuthentic,
        confidencePercent: result.confidence,
        riskLevel: result.riskLevel,
        humanSummary: result.summary,
      },
      humanAcousticIndicators: {
        naturalBreathScore: result.humanBreathScore,
        vocalTremorScore: result.vocalTremorScore,
        robotGlitchScore: result.robotGlitchScore,
        roomAcousticsScore: result.roomAcousticScore,
      },
      engineeringMetrics: {
        spectralArtifactsScore: result.spectralArtifactsScore,
        pitchConsistencyScore: result.pitchConsistencyScore,
        formantJitterScore: result.formantJitterScore,
        acousticCoherenceScore: result.acousticCoherenceScore,
        durationSeconds: result.duration,
        sampleRateHz: result.sampleRate,
        anomalies: result.detectedAnomalies,
        timestamps: result.forensicTimestamps,
      },
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deepfakeguard-live-analysis.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportNotice('JSON Telemetry exported successfully!');
    setTimeout(() => setExportNotice(null), 4000);
  }, [result]);

  const isRecording = phase === 'recording';
  const isAnalyzing = phase === 'analyzing';
  const isRequesting = phase === 'requesting';
  const isIdle = phase === 'idle' || phase === 'error';

  return (
    <div id="live-detection-zone" className="w-full max-w-4xl mx-auto px-4">
      {/* ─── Main Container ─── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={`rounded-3xl p-6 sm:p-10 border shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 ${
          isRecording
            ? 'bg-white dark:bg-[#121217] border-[#C0392B]/40 dark:border-[#EF4444]/40'
            : 'bg-white/70 dark:bg-[#14141A]/90 border-[#D9D4C8] dark:border-white/15'
        }`}
      >
        {/* ─── Header ─── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#F0EBE0] dark:bg-[#1F1F2B] flex items-center justify-center">
            <Radio className="w-5 h-5 text-[#1A1A1A] dark:text-[#F1BE38]" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-[#1A1A1A] dark:text-white tracking-tight">
              Real-Time Voice Detection
            </h3>
            <p className="text-xs text-[#7A7875] dark:text-[#9A968F]">
              Speak directly into your microphone for instant deepfake analysis
            </p>
          </div>
        </div>

        {/* ─── Waveform Visualization ─── */}
        <div className="relative bg-[#1A1A1A] dark:bg-[#0A0A0E] p-4 sm:p-5 rounded-2xl text-white border border-white/5 dark:border-white/10 mb-6">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-semibold text-[#D4A017] dark:text-[#F1BE38] flex items-center gap-1.5">
              <Volume2 className="w-4 h-4" /> Live Waveform
            </span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-white/60 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(duration)}
              </span>
              {isRecording && (
                <span className="flex items-center gap-1.5 text-[#EF4444] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-recording-pulse" />
                  LIVE
                </span>
              )}
              {isAnalyzing && (
                <span className="flex items-center gap-1.5 text-[#F1BE38] font-bold">
                  <Activity className="w-3 h-3 animate-pulse" />
                  PROCESSING
                </span>
              )}
              {phase === 'idle' && (
                <span className="text-[#2ECC71] font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2ECC71]" />
                  READY
                </span>
              )}
            </div>
          </div>

          {/* 44-bar live waveform */}
          <div className="flex items-center justify-end gap-[3px] h-16 sm:h-20 w-full bg-black/40 rounded-xl px-2">
            {waveformData.map((bar, i) => {
              const isActive = isRecording && bar > 0.15;
              return (
                <motion.div
                  key={i}
                  className="w-full rounded-full"
                  animate={{
                    height: `${Math.max(6, bar * 100)}%`,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  style={{
                    background: isActive
                      ? `linear-gradient(to top, #D4A017, #F1BE38)`
                      : isRecording
                        ? `linear-gradient(to top, #D4A017aa, #F1BE38aa)`
                        : `linear-gradient(to top, #4A4A4855, #7A787555)`,
                    minHeight: '4px',
                  }}
                />
              );
            })}
          </div>

          {/* Audio level meter */}
          {isRecording && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] text-white/40 uppercase tracking-wider">Level</span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  animate={{ width: `${Math.min(100, audioLevel * 150)}%` }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  style={{
                    background: audioLevel > 0.7
                      ? 'linear-gradient(90deg, #F1BE38, #EF4444)'
                      : 'linear-gradient(90deg, #D4A017, #F1BE38)',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ─── Recording Controls ─── */}
        <div className="flex items-center justify-center gap-4 mb-2">
          {!isRecording && !isAnalyzing && (
            <motion.button
              id="start-recording-btn"
              onClick={handleStart}
              disabled={isRequesting}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#1A1A1A] hover:bg-black dark:bg-[#F1BE38] dark:hover:bg-[#FFD25E] text-white dark:text-[#0B0B0E] text-sm font-bold transition-all shadow-xs dark:shadow-[0_0_20px_rgba(241,190,56,0.25)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mic className="w-5 h-5 text-[#D4A017] dark:text-[#0B0B0E]" />
              {isRequesting ? 'Requesting Microphone...' : 'Start Recording'}
            </motion.button>
          )}

          {isRecording && (
            <motion.button
              id="stop-recording-btn"
              onClick={handleStop}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#C0392B] hover:bg-[#A93226] dark:bg-[#EF4444] dark:hover:bg-[#DC2626] text-white text-sm font-bold transition-all shadow-[0_0_24px_rgba(192,57,43,0.25)] dark:shadow-[0_0_24px_rgba(239,68,68,0.3)] cursor-pointer animate-recording-glow"
            >
              <Square className="w-4 h-4 fill-current" />
              Stop &amp; Analyze
            </motion.button>
          )}

          {(isIdle && result) || phase === 'error' ? (
            <motion.button
              id="new-recording-btn"
              onClick={handleReset}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-[#EAE5DA] hover:bg-[#DDD8CC] dark:bg-[#23232F] dark:hover:bg-[#2D2D3B] text-[#1A1A1A] dark:text-white text-sm font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Record Again
            </motion.button>
          ) : null}
        </div>

        {/* Duration hint */}
        {isRecording && (
          <p className="text-center text-xs text-[#7A7875] dark:text-[#9A968F] mt-2">
            Recording... auto-stops at {MAX_DURATION_SECONDS}s. Minimum {MIN_DURATION_SECONDS}s for accurate detection.
          </p>
        )}

        {/* Error message */}
        <AnimatePresence>
          {phase === 'error' && errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-4 rounded-2xl bg-[#FCF2F2] dark:bg-[#260E0E] border border-[#C0392B]/20 dark:border-[#EF4444]/30 text-[#8B1E14] dark:text-[#FCA5A5] text-sm flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-[#C0392B] dark:text-[#EF4444] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Recording Issue</p>
                <p className="text-xs leading-relaxed opacity-90">{errorMessage}</p>
                <button
                  onClick={handleReset}
                  className="mt-3 text-xs font-bold underline underline-offset-2 cursor-pointer hover:opacity-80"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analyzing progress */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 p-6 rounded-2xl bg-[#FAF6EE] dark:bg-[#191922] border border-[#EAE5DA] dark:border-white/10 text-center"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-[#F0EBE0] dark:bg-[#211A0E] border-2 border-[#D4A017] dark:border-[#F1BE38] flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(241,190,56,0.15)]">
                <Activity className="w-6 h-6 text-[#D4A017] dark:text-[#F1BE38] animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-[#1A1A1A] dark:text-white mb-1">
                Running Wav2Vec2 Forensic Analysis
              </h4>
              <p className="text-xs text-[#7A7875] dark:text-[#9A968F]">
                Analyzing {duration.toFixed(1)}s recording — this typically takes 2–4 seconds
              </p>
              <div className="flex items-center justify-center gap-1 h-8 max-w-[200px] mx-auto mt-4">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-[#1A1A1A] dark:bg-[#F1BE38] rounded-full"
                    animate={{ height: [6, Math.random() * 28 + 8, 6] }}
                    transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.035 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ─── Result Display ─── */}
      <AnimatePresence>
        {result && phase === 'result' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-6 space-y-6"
          >
            {/* Main Verdict Card */}
            <div
              className={`rounded-3xl p-6 sm:p-8 border shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-all duration-300 relative overflow-hidden ${
                result.isAuthentic
                  ? 'bg-white dark:bg-[#121217] border-[#2D8A4E]/30 dark:border-[#2ECC71]/35'
                  : 'bg-white dark:bg-[#121217] border-[#C0392B]/30 dark:border-[#EF4444]/35'
              }`}
            >
              {/* Top Accent Bar */}
              <div
                className={`absolute top-0 left-0 right-0 h-2 ${
                  result.isAuthentic ? 'bg-[#2D8A4E] dark:bg-[#2ECC71]' : 'bg-[#C0392B] dark:bg-[#EF4444]'
                }`}
              />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#EAE5DA] dark:border-white/10">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                      result.isAuthentic
                        ? 'bg-[#2D8A4E]/10 dark:bg-[#2ECC71]/15 text-[#2D8A4E] dark:text-[#2ECC71]'
                        : 'bg-[#C0392B]/10 dark:bg-[#EF4444]/15 text-[#C0392B] dark:text-[#EF4444]'
                    }`}
                  >
                    {result.isAuthentic ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                          result.isAuthentic
                            ? 'bg-[#2D8A4E]/15 dark:bg-[#2ECC71]/20 text-[#2D8A4E] dark:text-[#3DE884]'
                            : 'bg-[#C0392B]/15 dark:bg-[#EF4444]/20 text-[#C0392B] dark:text-[#F87171]'
                        }`}
                      >
                        {result.isAuthentic ? 'Verified Authentic' : 'Critical Scam Alert'}
                      </span>
                      <span className="text-xs text-[#7A7875] dark:text-[#8E8B84] font-mono">live-recording.wav</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] dark:text-white tracking-tight">
                      {result.isAuthentic ? 'Human Voice Verified' : 'Synthetic AI Voice Detected'}
                    </h2>
                    <p className="text-sm sm:text-base text-[#5A5852] dark:text-[#C5C2BA] mt-1">{result.summary}</p>
                  </div>
                </div>

                {/* Confidence */}
                <div className="flex flex-col items-center md:items-end justify-center bg-[#FAF6EE] dark:bg-[#191922] px-6 py-4 rounded-2xl border border-[#EAE5DA] dark:border-white/10">
                  <span className="text-xs uppercase tracking-wider font-bold text-[#7A7875] dark:text-[#9A968F]">
                    Certainty
                  </span>
                  <span
                    className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                      result.isAuthentic ? 'text-[#2D8A4E] dark:text-[#2ECC71]' : 'text-[#C0392B] dark:text-[#EF4444]'
                    }`}
                  >
                    {result.confidence.toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-[#7A7875] dark:text-[#9A968F]">Forensic Match</span>
                </div>
              </div>

              {/* Advice Box */}
              <div
                className={`mt-6 p-4 sm:p-5 rounded-2xl border ${
                  result.isAuthentic
                    ? 'bg-[#F2F9F4] dark:bg-[#0D2418] border-[#2D8A4E]/20 dark:border-[#2ECC71]/30 text-[#1E5631] dark:text-[#68D391]'
                    : 'bg-[#FCF2F2] dark:bg-[#260E0E] border-[#C0392B]/20 dark:border-[#EF4444]/30 text-[#8B1E14] dark:text-[#FCA5A5]'
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.isAuthentic ? (
                    <CheckCircle2 className="w-5 h-5 text-[#2D8A4E] dark:text-[#2ECC71] shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-[#C0392B] dark:text-[#EF4444] shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="font-bold text-sm sm:text-base mb-1">
                      {result.isAuthentic
                        ? 'Action Advice: Safe to Proceed'
                        : 'Immediate Action Required: Do Not Comply With Requests'}
                    </h4>
                    <p className="text-xs sm:text-sm leading-relaxed opacity-90">{result.plainAdvice}</p>
                  </div>
                </div>
              </div>

              {/* 4 Human-Friendly Metric Cards */}
              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A7875] dark:text-[#9A968F] mb-3">
                  Key Acoustic Authenticity Indicators
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-[#FAF6EE] dark:bg-[#181822] p-3.5 rounded-2xl border border-[#EAE5DA] dark:border-white/10">
                    <div className="text-[11px] font-bold text-[#7A7875] dark:text-[#8E8B84] mb-1">Natural Breathing</div>
                    <div className={`text-xl font-bold ${result.isAuthentic ? 'text-[#2D8A4E] dark:text-[#2ECC71]' : 'text-[#C0392B] dark:text-[#EF4444]'}`}>
                      {result.humanBreathScore}%
                    </div>
                    <div className="text-[11px] text-[#5A5852] dark:text-[#B0ACA4] mt-0.5">
                      {result.isAuthentic ? 'Organic lung pauses' : 'Missing natural breaths'}
                    </div>
                  </div>
                  <div className="bg-[#FAF6EE] dark:bg-[#181822] p-3.5 rounded-2xl border border-[#EAE5DA] dark:border-white/10">
                    <div className="text-[11px] font-bold text-[#7A7875] dark:text-[#8E8B84] mb-1">Vocal Micro-Jitter</div>
                    <div className={`text-xl font-bold ${result.isAuthentic ? 'text-[#2D8A4E] dark:text-[#2ECC71]' : 'text-[#C0392B] dark:text-[#EF4444]'}`}>
                      {result.vocalTremorScore}%
                    </div>
                    <div className="text-[11px] text-[#5A5852] dark:text-[#B0ACA4] mt-0.5">
                      {result.isAuthentic ? 'Biological vocal cords' : 'Robotic flatline tone'}
                    </div>
                  </div>
                  <div className="bg-[#FAF6EE] dark:bg-[#181822] p-3.5 rounded-2xl border border-[#EAE5DA] dark:border-white/10">
                    <div className="text-[11px] font-bold text-[#7A7875] dark:text-[#8E8B84] mb-1">AI Glitch Index</div>
                    <div className={`text-xl font-bold ${!result.isAuthentic ? 'text-[#C0392B] dark:text-[#EF4444]' : 'text-[#2D8A4E] dark:text-[#2ECC71]'}`}>
                      {result.robotGlitchScore}%
                    </div>
                    <div className="text-[11px] text-[#5A5852] dark:text-[#B0ACA4] mt-0.5">
                      {result.isAuthentic ? 'No vocoder artifacts' : 'Neural synth artifacts'}
                    </div>
                  </div>
                  <div className="bg-[#FAF6EE] dark:bg-[#181822] p-3.5 rounded-2xl border border-[#EAE5DA] dark:border-white/10">
                    <div className="text-[11px] font-bold text-[#7A7875] dark:text-[#8E8B84] mb-1">Physical Space Acoustics</div>
                    <div className={`text-xl font-bold ${result.isAuthentic ? 'text-[#2D8A4E] dark:text-[#2ECC71]' : 'text-[#C0392B] dark:text-[#EF4444]'}`}>
                      {result.roomAcousticScore}%
                    </div>
                    <div className="text-[11px] text-[#5A5852] dark:text-[#B0ACA4] mt-0.5">
                      {result.isAuthentic ? 'Real 3D room echo' : 'Sterile digital cuts'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Waveform Preview */}
              <div className="mt-6 bg-[#1A1A1A] dark:bg-[#0A0A0E] p-4 sm:p-5 rounded-2xl text-white border border-white/5 dark:border-white/10">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-semibold text-[#D4A017] dark:text-[#F1BE38] flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4" /> Recorded Acoustic Waveform
                  </span>
                  <span className="font-mono text-white/60">
                    {result.duration.toFixed(1)}s • {result.sampleRate} Hz
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1 h-16 w-full px-2 bg-black/40 rounded-xl">
                  {result.waveformBars.map((bar, i) => (
                    <div
                      key={i}
                      className={`w-full rounded-full transition-all duration-300 ${
                        !result.isAuthentic && i > 12 && i < 28
                          ? 'bg-[#E74C3C] dark:bg-[#EF4444]'
                          : 'bg-[#D4A017] dark:bg-[#F1BE38]'
                      }`}
                      style={{ height: `${Math.max(12, bar * 100)}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-[#EAE5DA] dark:border-white/10">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    id="live-download-pdf-btn"
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1A1A1A] hover:bg-black dark:bg-[#F1BE38] dark:hover:bg-[#FFD25E] text-white dark:text-[#0B0B0E] text-xs sm:text-sm font-semibold transition-all shadow-xs dark:shadow-[0_0_20px_rgba(241,190,56,0.2)] cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4 text-[#D4A017] dark:text-[#0B0B0E]" />
                    <span>Download Forensic PDF</span>
                  </button>
                  <button
                    id="live-download-json-btn"
                    onClick={handleDownloadJson}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#FAF6EE] hover:bg-[#F0EBE0] dark:bg-[#1B1B25] dark:hover:bg-[#232330] text-[#1A1A1A] dark:text-white text-xs sm:text-sm font-semibold border border-[#D9D4C8] dark:border-white/10 transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-[#7A7875] dark:text-[#A09D96]" />
                    <span>Export JSON</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="live-toggle-advanced-btn"
                    onClick={() => setShowAdvancedForensics(!showAdvancedForensics)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-[#5A5852] dark:text-[#C5C2BA] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-[#FAF6EE] dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <span>{showAdvancedForensics ? 'Hide Technical Data' : 'View Engineering Forensics'}</span>
                    {showAdvancedForensics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button
                    id="live-analyze-another-btn"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#EAE5DA] hover:bg-[#DDD8CC] dark:bg-[#23232F] dark:hover:bg-[#2D2D3B] text-[#1A1A1A] dark:text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Record Again</span>
                  </button>
                </div>
              </div>

              {/* Export Notice */}
              <AnimatePresence>
                {exportNotice && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 p-3 rounded-xl bg-[#2D8A4E]/10 dark:bg-[#2ECC71]/15 border border-[#2D8A4E]/30 dark:border-[#2ECC71]/35 text-[#2D8A4E] dark:text-[#3DE884] text-xs font-bold flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{exportNotice}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Advanced Forensics Panel */}
            <AnimatePresence>
              {showAdvancedForensics && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-3xl bg-white dark:bg-[#131318] p-6 sm:p-8 border border-[#D9D4C8] dark:border-white/10 shadow-xs dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-[#1A1A1A] dark:text-white">
                          Acoustic Signal &amp; Neural Vocoder Telemetry
                        </h3>
                        <p className="text-xs text-[#7A7875] dark:text-[#8E8B84]">
                          Detailed measurements from the live speech spectrogram
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#FAF6EE] dark:bg-[#1D1D28] border border-[#EAE5DA] dark:border-white/10 text-[11px] font-mono text-[#5A5852] dark:text-[#C5C2BA]">
                        Wav2Vec2 + Spectral
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 rounded-2xl bg-[#FAF6EE] dark:bg-[#1A1A24] border border-[#EAE5DA] dark:border-white/10">
                        <div className="text-xs text-[#7A7875] dark:text-[#8E8B84] font-medium mb-1">Spectral Phase Glitch</div>
                        <div className="text-2xl font-bold font-mono text-[#1A1A1A] dark:text-white">{result.spectralArtifactsScore.toFixed(1)} dB</div>
                        <p className="text-[11px] text-[#7A7875] dark:text-[#7A7770] mt-1">Neural model synthesis flaws</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#FAF6EE] dark:bg-[#1A1A24] border border-[#EAE5DA] dark:border-white/10">
                        <div className="text-xs text-[#7A7875] dark:text-[#8E8B84] font-medium mb-1">Pitch Naturalness Index</div>
                        <div className="text-2xl font-bold font-mono text-[#1A1A1A] dark:text-white">{result.pitchConsistencyScore.toFixed(1)}%</div>
                        <p className="text-[11px] text-[#7A7875] dark:text-[#7A7770] mt-1">Natural pitch fluctuation tracking</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#FAF6EE] dark:bg-[#1A1A24] border border-[#EAE5DA] dark:border-white/10">
                        <div className="text-xs text-[#7A7875] dark:text-[#8E8B84] font-medium mb-1">Formant Phase Jitter</div>
                        <div className="text-2xl font-bold font-mono text-[#1A1A1A] dark:text-white">{result.formantJitterScore.toFixed(1)}%</div>
                        <p className="text-[11px] text-[#7A7875] dark:text-[#7A7770] mt-1">Vocal tract resonance tracking</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#FAF6EE] dark:bg-[#1A1A24] border border-[#EAE5DA] dark:border-white/10">
                        <div className="text-xs text-[#7A7875] dark:text-[#8E8B84] font-medium mb-1">Acoustic Coherence</div>
                        <div className="text-2xl font-bold font-mono text-[#1A1A1A] dark:text-white">{result.acousticCoherenceScore.toFixed(1)}%</div>
                        <p className="text-[11px] text-[#7A7875] dark:text-[#7A7770] mt-1">Temporal waveform consistency</p>
                      </div>
                    </div>
                    {result.detectedAnomalies.length > 0 && (
                      <div className="p-4 rounded-2xl bg-[#FAF6EE] dark:bg-[#1A1A24] border border-[#EAE5DA] dark:border-white/10">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] dark:text-white mb-3">
                          Forensic Observations Log
                        </h4>
                        <ul className="space-y-2">
                          {result.detectedAnomalies.map((item, idx) => (
                            <li key={idx} className="text-xs sm:text-sm text-[#4A4A48] dark:text-[#C5C2BA] flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017] dark:bg-[#F1BE38] shrink-0 mt-2" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
