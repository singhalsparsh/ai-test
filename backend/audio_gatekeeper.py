"""
audio_gatekeeper.py -- Multi-Stage Gated Pipeline for DeepfakeGuard.

Validates and pre-processes uploaded audio BEFORE it reaches the Wav2Vec2
deepfake model. Each gate can reject early (skipping Wav2Vec2 inference
entirely) or, if its optional dependency is unavailable, fail *open* with a
warning so the server never crashes and existing behaviour is preserved.

Gates run strictly in order:
  Gate 1  File Integrity & Technical Checks   (soundfile / librosa)
  Gate 2  Voice Activity & Speech Validity     (silero-vad / webrtcvad, whisper, pyannote)
  Gate 3  Audio Event Classification           (YAMNet via tensorflow_hub, librosa heuristic fallback)

Gate 4 (Wav2Vec2 inference) lives in main.py -- this module only supplies the
`band_confidence()` helper that implements the ">80% decisive / 50-80%
inconclusive" rule. The Wav2Vec2 weights and architecture are never touched.

Design rules honored here:
  * Every gate is wrapped so one failure cannot take down the server.
  * Optional-heavy deps (whisper, pyannote, tensorflow_hub) are lazy-loaded
    and cached on first use, keeping startup fast.
  * If a gate's model is missing/unavailable, the gate is SKIPPED with a note
    rather than rejecting the audio. Only Gate 1 (which needs nothing more than
    a decoder already required by the project) is fail-closed.

CLI (useful for testing without the server):
    python audio_gatekeeper.py path/to/audio.wav
"""

from __future__ import annotations

import os
import sys
import threading
import urllib.request
import warnings
from dataclasses import dataclass, field
from typing import List, Optional, Tuple

import numpy as np

warnings.filterwarnings("ignore")

# ---------------------------------------------------------------------------
# Constants & tunable thresholds (every one is env-overridable)
# ---------------------------------------------------------------------------

SAMPLE_RATE = 16000

def _env_float(name: str, default: float) -> float:
    try:
        return float(os.environ.get(name, str(default)))
    except (TypeError, ValueError):
        return default

def _env_bool(name: str, default: bool = True) -> bool:
    raw = os.environ.get(name, str(default)).strip().lower()
    return raw in ("1", "true", "yes", "on")

# Master switch. Set DEEPFAKE_GATE_ENABLED=0 to bypass the whole pipeline
# (keeps the legacy behaviour available for debugging / A-B testing).
GATE_ENABLED = _env_bool("DEEPFAKE_GATE_ENABLED", True)

# Gate 1
MIN_DURATION_S = _env_float("GATE_MIN_DURATION_S", 1.5)       # < -> "Extremely short utterance."
TRIM_TOP_DB = _env_float("GATE_TRIM_TOP_DB", 30.0)            # librosa.effects.trim silence pad removal
CLIP_RATIO_MAX = _env_float("GATE_CLIP_RATIO_MAX", 0.02)      # 2% clipped samples -> distortion
DC_OFFSET_MAX = _env_float("GATE_DC_OFFSET_MAX", 0.05)        # severe DC offset -> technical defect

# Gate 2
MIN_SPEECH_MS = _env_float("GATE_MIN_SPEECH_MS", 1500.0)      # < -> "Blank audio or no speech detected."

# Gate 3 -- YAMNet
YAMNET_MODEL_URL = "https://tfhub.dev/google/yamnet/1"
YAMNET_CLASS_MAP_URL = (
    "https://raw.githubusercontent.com/tensorflow/models/master/"
    "research/audioset/yamnet/yamnet_class_map.csv"
)
# Narrow "this counts as speech" set. Kept tight on purpose: cough, sneeze,
# breathing, animal sounds and music are NOT in here and should be rejected.
SPEECH_LIKE_LABELS = {
    "Speech",
    "Male speech, man speaking",
    "Female speech, woman speaking",
    "Child speech, kid speaking",
    "Conversation",
    "Narration, monologue",
    "Speech synthesizer",  # TTS -- synthetic, but still speech; let Gate 4 judge it
}

# Gate 4 (confidence banding, applied in main.py)
DECISIVE_CONFIDENCE = _env_float("GATE_DECISIVE_CONFIDENCE", 80.0)
INCONCLUSIVE_FLOOR = 50.0  # softmax max-prob can never go below 50% for 2 classes

# ---------------------------------------------------------------------------
# Optional dependency probing (never fatal)
# ---------------------------------------------------------------------------

def _try_import(module_names: List[str]):
    """Import the first available module from `module_names`. Returns module or None."""
    for name in module_names:
        try:
            return __import__(name)
        except Exception:
            continue
    return None

librosa = _try_import(["librosa"])
soundfile = _try_import(["soundfile"])
torch = _try_import(["torch"])

_HAS_LIBROSA = librosa is not None
_HAS_SOUNDFILE = soundfile is not None
_HAS_TORCH = torch is not None

if not _HAS_LIBROSA and not _HAS_SOUNDFILE:
    print("[gatekeeper] WARNING: neither librosa nor soundfile available; "
          "Gate 1 will be unable to decode audio.")

# ---------------------------------------------------------------------------
# Result containers
# ---------------------------------------------------------------------------

@dataclass
class GateEvent:
    """Outcome of a single gate."""
    gate: str
    passed: bool
    reason: Optional[str] = None       # exact rejection string when passed=False
    detail: Optional[str] = None       # human readable diagnostic (always safe to show)

@dataclass
class GateReport:
    """Full result of the gated pipeline."""
    status: str                        # "SUCCESS" | "REJECTED"
    reason: Optional[str] = None       # rejection reason (None on success)
    gate: Optional[str] = None         # which gate rejected
    audio: Optional[np.ndarray] = None  # validated, silence-trimmed, 16 kHz mono float32
    sr: int = SAMPLE_RATE
    duration_seconds: float = 0.0      # post-trim duration (what Gate 4 sees)
    original_duration_seconds: float = 0.0
    speech_ms: float = 0.0             # measured speech energy (Gate 2)
    transcript: Optional[str] = None   # Whisper transcript (Gate 2)
    audio_event: Optional[str] = None  # winning audio event class (Gate 3)
    events: List[GateEvent] = field(default_factory=list)
    notes: List[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "status": self.status,
            "reason": self.reason,
            "gate": self.gate,
            "duration_seconds": round(self.duration_seconds, 2),
            "original_duration_seconds": round(self.original_duration_seconds, 2),
            "speech_ms": round(self.speech_ms, 0),
            "transcript": self.transcript,
            "audio_event": self.audio_event,
            "notes": self.notes,
            "gates": [
                {
                    "gate": e.gate,
                    "passed": e.passed,
                    "reason": e.reason,
                    "detail": e.detail,
                }
                for e in self.events
            ],
        }


def _pass(gate: str, detail: Optional[str] = None) -> GateEvent:
    return GateEvent(gate=gate, passed=True, detail=detail)

def _reject(gate: str, reason: str, detail: Optional[str] = None) -> GateEvent:
    return GateEvent(gate=gate, passed=False, reason=reason, detail=detail)

def _rejected(gate: str, reason: str, notes: List[str], events: List[GateEvent]) -> GateReport:
    return GateReport(
        status="REJECTED",
        reason=reason,
        gate=gate,
        events=events,
        notes=notes,
    )

# ---------------------------------------------------------------------------
# Audio loading
# ---------------------------------------------------------------------------

def _resample_linear(data: np.ndarray, sr_in: int, sr_out: int) -> np.ndarray:
    """Crude linear-interpolation resample (fallback only, when librosa is absent)."""
    if sr_in == sr_out or data.size == 0:
        return data
    ratio = sr_out / sr_in
    n_out = int(round(data.size * ratio))
    idx = np.linspace(0, data.size - 1, n_out)
    return np.interp(idx, np.arange(data.size), data).astype(np.float32)

def load_audio(path: str) -> Tuple[np.ndarray, int]:
    """
    Decode `path` to (float32 mono, SAMPLE_RATE).

    Raises Exception if the file is corrupted/undecodable -- Gate 1 turns that
    into "Corrupted or empty file."
    """
    if _HAS_LIBROSA:
        audio, _sr = librosa.load(path, sr=SAMPLE_RATE, mono=True)
    elif _HAS_SOUNDFILE:
        data, sr_in = soundfile.read(path, dtype="float32", always_2d=False)
        if data.ndim > 1:
            data = data.mean(axis=1)
        audio = _resample_linear(np.asarray(data, dtype=np.float32), sr_in, SAMPLE_RATE)
    else:
        raise RuntimeError("No audio decoder available (need librosa or soundfile).")

    audio = np.ascontiguousarray(audio, dtype=np.float32)
    if audio.size == 0:
        raise ValueError("Decoded buffer is empty")
    return audio, SAMPLE_RATE

# ---------------------------------------------------------------------------
# GATE 1 -- File integrity & technical checks
# ---------------------------------------------------------------------------

GATE1 = "Gate 1: File Integrity"

def _quality_defects(audio: np.ndarray) -> Tuple[List[str], List[str]]:
    """
    Detect distortion / clipping / technical defects with librosa.

    Returns (rejecting_defects, informational_notes). Only defects that cannot
    plausibly occur on clean human speech cause a rejection; spectral "low
    bitrate" hints are recorded as explainability notes so recall is never hurt.

    Clipping detection note: proximity to the signal's own peak is NOT
    clipping -- any tonal content has many samples near its peak by
    construction. Genuine hard clipping leaves a *plateau*: consecutive
    samples pinned to one identical value at the rail. We therefore require
    exact repeated values near the peak, which avoids false-positives on
    peak-normalized tones and synthesized waveforms while still catching
    real clipped captures.
    """
    rejects: List[str] = []
    notes: List[str] = []

    peak = float(np.max(np.abs(audio))) if audio.size else 0.0
    if peak <= 0.0:
        return ["digital silence"], []

    if not np.isfinite(audio).all():
        rejects.append("non-finite samples (NaN/Inf)")
        return rejects, notes  # nothing else is meaningful on a broken buffer

    # --- Clipping: identical-value plateaus at the signal peak ---------
    at_peak = np.abs(audio) >= (peak * 0.995)
    equal_prev = np.zeros(at_peak.shape, dtype=bool)
    equal_prev[1:] = np.isclose(audio[1:], audio[:-1], rtol=0.0, atol=1e-6)
    equal_next = np.zeros(at_peak.shape, dtype=bool)
    equal_next[:-1] = np.isclose(audio[:-1], audio[1:], rtol=0.0, atol=1e-6)
    plateau = at_peak & (equal_prev | equal_next)
    clip_ratio = float(np.mean(plateau))
    if clip_ratio > CLIP_RATIO_MAX:
        rejects.append(f"clipping on {clip_ratio * 100:.1f}% of samples")

    # Severe DC offset (technical defect, typical of broken captures).
    dc = float(np.mean(audio))
    if abs(dc) > DC_OFFSET_MAX:
        rejects.append(f"severe DC offset ({dc:.3f})")

    # --- Informational only (explainability, never a hard rejection) ---
    rms = float(np.sqrt(np.mean(audio ** 2)))
    notes.append(f"peak={peak:.3f} rms={rms:.4f} clip_plateau={clip_ratio * 100:.2f}%")

    if _HAS_LIBROSA:
        try:
            rolloff = float(np.mean(librosa.feature.spectral_rolloff(
                y=audio, sr=SAMPLE_RATE, roll_percent=0.99)))
            flatness = float(np.mean(librosa.feature.spectral_flatness(y=audio)))
            centroid = float(np.mean(librosa.feature.spectral_centroid(
                y=audio, sr=SAMPLE_RATE)))
            notes.append(
                f"spectral_rolloff99={rolloff:.0f}Hz "
                f"flatness={flatness:.3f} centroid={centroid:.0f}Hz"
            )
            # Extremely low spectral cutoff hints at a very low bitrate codec.
            if rolloff < 300.0:
                notes.append(
                    "possible low-bitrate / heavily band-limited codec "
                    "(informational, not rejected)"
                )
        except Exception as exc:  # noqa: BLE001 - metrics must never break the gate
            notes.append(f"spectral probe failed: {type(exc).__name__}")

    return rejects, notes

def gate_file_integrity(audio: np.ndarray, sr: int) -> Tuple[GateEvent, List[str], np.ndarray]:
    """
    Gate 1. Returns (event, notes, trimmed_audio).

    Silence padding is removed with librosa.effects.trim so downstream gates
    and Gate 4 only ever see real content.
    """
    notes: List[str] = []

    if audio is None or audio.size == 0:
        return _reject(GATE1, "Corrupted or empty file.", "decoded buffer is empty"), notes, audio

    if not np.isfinite(audio).all():
        return _reject(GATE1, "Corrupted or empty file.", "NaN/Inf samples in buffer"), notes, audio

    peak = float(np.max(np.abs(audio)))
    if peak <= 0.0:
        return _reject(GATE1, "Corrupted or empty file.", "buffer is digital silence"), notes, audio

    duration = len(audio) / sr
    if duration < MIN_DURATION_S:
        return _reject(
            GATE1, "Extremely short utterance.",
            f"{duration:.2f}s < {MIN_DURATION_S:.1f}s minimum",
        ), notes, audio

    rejects, q_notes = _quality_defects(audio)
    notes.extend(q_notes)
    if rejects:
        return _reject(
            GATE1, "Poor audio quality.", "; ".join(rejects),
        ), notes, audio

    # Silence-padding removal (leading/trailing), done on a copy.
    trimmed = audio
    if _HAS_LIBROSA:
        try:
            t, _ = librosa.effects.trim(
                np.copy(audio), top_db=TRIM_TOP_DB, frame_length=2048, hop_length=512
            )
            if t.size > 0:
                trimmed = np.ascontiguousarray(t, dtype=np.float32)
                pad_ms = max(0.0, (len(audio) - len(trimmed)) / sr) * 1000
                if pad_ms > 50:
                    notes.append(f"removed {pad_ms:.0f}ms of leading/trailing silence padding")
        except Exception as exc:  # noqa: BLE001
            notes.append(f"silence trim failed ({type(exc).__name__}); using untrimmed audio")

    return _pass(GATE1, f"duration={duration:.2f}s peak={peak:.3f}"), notes, trimmed

# ---------------------------------------------------------------------------
# GATE 2 -- Voice activity & speech validity
# ---------------------------------------------------------------------------

GATE2 = "Gate 2: Voice Activity & Speech"

# --- lazy, cached, thread-safe model accessors ------------------------------

_model_lock = threading.Lock()
_silero_model = None
_silero_loaded = False
_whisper_model = None
_whisper_loaded = False
_pyannote_pipeline = None
_pyannote_loaded = False
_yamnet_model = None
_yamnet_loaded = False
_yamnet_classes: Optional[List[str]] = None

def _silero():
    """Return a silero VAD model, or None if unavailable."""
    global _silero_model, _silero_loaded
    if _silero_loaded:
        return _silero_model
    with _model_lock:
        if _silero_loaded:
            return _silero_model
        _silero_loaded = True  # attempt once
        try:
            from silero_vad import load_silero_vad  # pip package (bundles weights)
            _silero_model = load_silero_vad()
            return _silero_model
        except Exception:
            pass
        if not _HAS_TORCH:
            return None
        try:
            _silero_model, _ = torch.hub.load(  # type: ignore[attr-defined]
                "snakers4/silero-vad", "silero_vad", trust_repo=True, force_reload=False
            )
            return _silero_model
        except Exception:
            return None

def _whisper():
    """Return a whisper `base` model, or None if unavailable."""
    global _whisper_model, _whisper_loaded
    if _whisper_loaded:
        return _whisper_model
    with _model_lock:
        if _whisper_loaded:
            return _whisper_model
        _whisper_loaded = True
        try:
            import whisper
            _whisper_model = whisper.load_model("base")
            return _whisper_model
        except Exception:
            return None

def _pyannote():
    """Return a pyannote speaker-diarization pipeline, or None if unavailable."""
    global _pyannote_pipeline, _pyannote_loaded
    if _pyannote_loaded:
        return _pyannote_pipeline
    with _model_lock:
        if _pyannote_loaded:
            return _pyannote_pipeline
        _pyannote_loaded = True
        token = os.environ.get("HF_TOKEN") or os.environ.get("PYANNOTE_TOKEN")
        try:
            from pyannote.audio import Pipeline
            _pyannote_pipeline = Pipeline.from_pretrained(
                "pyannote/speaker-diarization-3.1",
                use_auth_token=token,
            )
            return _pyannote_pipeline
        except Exception:
            if not token:
                pass  # expected: pyannote models require an accepted HF license + token
            return None

# --- VAD ------------------------------------------------------------------

def _speech_ms_silero(audio: np.ndarray) -> Optional[float]:
    model = _silero()
    if model is None:
        return None
    from silero_vad import get_speech_timestamps
    peak = float(np.max(np.abs(audio))) or 1.0
    x = audio / max(1.0, peak)  # keep within [-1, 1]
    tensor = torch.from_numpy(np.ascontiguousarray(x)) if _HAS_TORCH else None
    if tensor is None:
        return None
    stamps = get_speech_timestamps(tensor, model, sampling_rate=SAMPLE_RATE)
    total = sum(int(s.get("end", 0)) - int(s.get("start", 0)) for s in stamps)
    return total / SAMPLE_RATE * 1000.0

def _speech_ms_webrtc(audio: np.ndarray) -> Optional[float]:
    try:
        import webrtcvad
    except Exception:
        return None
    peak = float(np.max(np.abs(audio))) or 1.0
    x = np.clip(audio / max(1.0, peak), -1.0, 1.0)
    frame_ms, frame_len = 30, int(SAMPLE_RATE * 0.03)
    vad = webrtcvad.Vad(2)
    n_frames = len(x) // frame_len
    voiced = 0
    for i in range(n_frames):
        frame = x[i * frame_len:(i + 1) * frame_len]
        pcm = (np.clip(frame, -1.0, 1.0) * 32767.0).astype("<i2").tobytes()
        try:
            if vad.is_speech(pcm, SAMPLE_RATE):
                voiced += 1
        except Exception:
            continue
    return voiced * frame_ms

def _measure_speech_ms(audio: np.ndarray) -> Tuple[float, Optional[str]]:
    """Returns (speech_ms, method). method=None means VAD unavailable."""
    for fn, name in ((_speech_ms_silero, "silero-vad"), (_speech_ms_webrtc, "webrtcvad")):
        try:
            ms = fn(audio)
            if ms is not None:
                return float(ms), name
        except Exception:
            continue
    return 0.0, None

# --- ASR sanity check ------------------------------------------------------

_ASR_NOISE_TAGS = (
    "[music]", "[noise]", "[silence]", "[blank_audio]", "[sound]",
    "[applause]", "[laughter]", "[cough]", "[breathing]", "[wind]",
    "(music)", "(noise)", "(silence)",
)

def _clean_transcript(text: Optional[str]) -> str:
    if not text:
        return ""
    cleaned = (text or "").strip().lower()
    for tag in _ASR_NOISE_TAGS:
        cleaned = cleaned.replace(tag, " ")
    for ch in "[]()<>":
        cleaned = cleaned.replace(ch, " ")
    return " ".join(cleaned.split())

def _transcribe(audio: np.ndarray) -> Optional[str]:
    model = _whisper()
    if model is None:
        return None
    peak = float(np.max(np.abs(audio))) or 1.0
    x = audio / max(1.0, peak)
    fp16 = bool(getattr(torch, "cuda", None) and torch.cuda.is_available()) if _HAS_TORCH else False
    result = model.transcribe(x, language=None, fp16=fp16, temperature=0.0)
    return (result or {}).get("text", "")

# --- Overlapping speech ----------------------------------------------------

def _has_overlapping_speakers(audio: np.ndarray) -> Optional[bool]:
    """
    True if two different speaker turns overlap in time, False if single
    speaker / no overlap, None if diarization is unavailable.
    """
    pipeline = _pyannote()
    if pipeline is None:
        return None
    try:
        tensor = torch.from_numpy(np.ascontiguousarray(audio)).unsqueeze(0)
        diarization = pipeline({"waveform": tensor, "sample_rate": SAMPLE_RATE})
    except Exception:
        return None

    turns = []
    speakers = set()
    for turn, _, label in diarization.itertracks(yield_label=True):
        speakers.add(label)
        turns.append((turn.start, turn.end, label))

    if len(speakers) < 2:
        return False

    # Any time-overlap between two distinct speaker turns => overlapping speech.
    for i in range(len(turns)):
        for j in range(i + 1, len(turns)):
            a, b = turns[i], turns[j]
            if a[2] == b[2]:
                continue
            if min(a[1], b[1]) - max(a[0], b[0]) > 0.05:  # 50ms tolerance
                return True
    return False

def gate_voice_activity(audio: np.ndarray) -> Tuple[GateEvent, float, Optional[str], List[str]]:
    """Gate 2. Returns (event, speech_ms, transcript, notes)."""
    notes: List[str] = []

    # 2a. VAD / blank audio
    speech_ms, method = _measure_speech_ms(audio)
    if method is None:
        notes.append("VAD unavailable (install silero-vad or webrtcvad); skipping blank-audio check")
    else:
        notes.append(f"speech={speech_ms:.0f}ms via {method}")
        if speech_ms < MIN_SPEECH_MS:
            return _reject(
                GATE2, "Blank audio or no speech detected.",
                f"{speech_ms:.0f}ms speech < {MIN_SPEECH_MS:.0f}ms minimum ({method})",
            ), speech_ms, None, notes

    # 2b. ASR sanity check (do this before diarization -- cheaper and catches
    #     music / noise / cough / breathing that VAD may still count as speech)
    transcript = _transcribe(audio)
    if transcript is None:
        notes.append("Whisper unavailable (pip install openai-whisper); skipping ASR sanity check")
    else:
        cleaned = _clean_transcript(transcript)
        notes.append(f"transcript={cleaned[:80]!r}")
        if not cleaned:
            return _reject(
                GATE2, "No intelligible speech found.",
                f"transcript empty or only audio-event tags ({transcript.strip()[:60]!r})",
            ), speech_ms, transcript, notes

    # 2c. Overlapping speech
    overlap = _has_overlapping_speakers(audio)
    if overlap is None:
        notes.append("pyannote.audio unavailable (needs HF token); skipping overlap check")
    elif overlap:
        return _reject(
            GATE2, "Multiple overlapping speakers detected.",
            "two distinct speaker turns overlap in time",
        ), speech_ms, transcript, notes
    else:
        notes.append("single-speaker / no overlap")

    return _pass(GATE2, f"speech={speech_ms:.0f}ms transcript={_clean_transcript(transcript)[:40]!r}"), \
        speech_ms, transcript, notes

# ---------------------------------------------------------------------------
# GATE 3 -- Audio event classification
# ---------------------------------------------------------------------------

GATE3 = "Gate 3: Audio Event Classification"

def _yamnet_classes() -> Optional[List[str]]:
    """Load YAMNet's 521-class display names; None if the map can't be fetched."""
    global _yamnet_classes
    if _yamnet_classes is not None:
        return _yamnet_classes
    try:
        with urllib.request.urlopen(YAMNET_CLASS_MAP_URL, timeout=8) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
        names: List[str] = []
        for line in raw.splitlines()[1:]:
            if not line.strip():
                continue
            parts = line.split(",", 2)
            if len(parts) == 3:
                names.append(parts[2].strip().strip('"'))
        if names:
            _yamnet_classes = names
            return names
    except Exception:
        pass
    return None

def _classify_yamnet(audio: np.ndarray) -> Optional[Tuple[str, float]]:
    """YAMNet classification -> (class_name, probability). None if unavailable."""
    global _yamnet_model, _yamnet_loaded
    if not _yamnet_loaded:
        with _model_lock:
            if not _yamnet_loaded:
                _yamnet_loaded = True
                try:
                    import tensorflow as tf
                    import tensorflow_hub as hub
                    tf.get_logger().setLevel("ERROR")
                    os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
                    _yamnet_model = hub.load(YAMNET_MODEL_URL)
                except Exception:
                    _yamnet_model = None
    model = _yamnet_model
    if model is None:
        return None

    import tensorflow as tf
    peak = float(np.max(np.abs(audio))) or 1.0
    waveform = tf.convert_to_tensor(audio / max(1.0, peak), dtype=tf.float32)
    scores, _, _ = model(waveform)
    scores = tf.reduce_mean(scores, axis=0)  # frame scores -> clip-level
    top = int(tf.argmax(scores).numpy())
    prob = float(scores[top].numpy())

    classes = _yamnet_classes()
    name = classes[top] if classes and top < len(classes) else (
        "Speech" if top == 0 else f"Audio class #{top}"
    )
    return name, prob

def _classify_heuristic(audio: np.ndarray) -> Optional[Tuple[str, float]]:
    """
    Dependency-free fallback classifier using librosa descriptors.

    Deliberately conservative: it only rejects clear non-speech (broadband
    noise or strongly sustained tonal/music-like content). When unsure it
    returns "Speech" so Gate 4 still gets the chance to run -- a false
    rejection of real speech is the worse failure mode.
    """
    if not _HAS_LIBROSA:
        return None
    try:
        flatness = float(np.mean(librosa.feature.spectral_flatness(y=audio)))
        centroid = float(np.mean(librosa.feature.spectral_centroid(y=audio, sr=SAMPLE_RATE)))
        rolloff = float(np.mean(librosa.feature.spectral_rolloff(y=audio, sr=SAMPLE_RATE,
                                                                 roll_percent=0.85)))
        harmonic, percussive = librosa.effects.hpss(np.copy(audio))
        h_energy = float(np.sqrt(np.mean(harmonic ** 2)) + 1e-9)
        p_energy = float(np.sqrt(np.mean(percussive ** 2)) + 1e-9)
        harmonic_ratio = h_energy / (h_energy + p_energy)
    except Exception:
        return None

    # Broadband / white noise: flat spectrum, no clear harmonic structure.
    if flatness > 0.45:
        return "White noise", 0.70
    # Music-like: strongly tonal & sustained, energy concentrated in steady pitches.
    if harmonic_ratio > 0.80 and flatness < 0.15 and rolloff < 6000.0 and centroid > 180.0:
        return "Music", 0.60
    return "Speech", 0.60

def gate_audio_event(audio: np.ndarray) -> Tuple[GateEvent, Optional[str]]:
    """Gate 3. Returns (event, winning_class_name)."""
    result = _classify_yamnet(audio)
    method = "YAMNet"
    if result is None:
        result = _classify_heuristic(audio)
        method = "librosa-heuristic"
    if result is None:
        return _pass(GATE3, "no audio-event classifier available; skipping"), None

    class_name, prob = result
    is_speech = class_name in SPEECH_LIKE_LABELS
    detail = f"top={class_name} ({prob * 100:.0f}%) via {method}"

    if is_speech:
        return _pass(GATE3, detail), class_name
    return _reject(
        GATE3, f"Non-speech audio detected: {class_name}.", detail,
    ), class_name

# ---------------------------------------------------------------------------
# Capability reporting (cheap: import checks only, never triggers downloads)
# ---------------------------------------------------------------------------

def gate_availability() -> dict:
    """
    Report which gate backends are importable.

    Deliberately checks *importability only* -- this never loads a model or
    hits the network, so it is safe to call on every /health check and in the
    startup banner. A library can still fail later at load time (e.g. missing
    HF token for pyannote); that is handled per-gate at run time.
    """
    def _ok(name: str) -> bool:
        try:
            __import__(name)
            return True
        except Exception:
            return False

    return {
        "gate1_integrity": _HAS_LIBROSA or _HAS_SOUNDFILE,
        "gate1_silence_trim": _HAS_LIBROSA,
        "gate2_vad_silero": _ok("silero_vad") or _HAS_TORCH,
        "gate2_vad_webrtc": _ok("webrtcvad"),
        "gate2_asr_whisper": _ok("whisper"),
        "gate2_overlap_pyannote": _ok("pyannote.audio"),
        "gate3_yamnet": _ok("tensorflow_hub"),
        "gate3_heuristic_fallback": _HAS_LIBROSA,
    }


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def run_gates(path: str) -> GateReport:
    """
    Run Gates 1-3 over `path`.

    On success, `report.audio` holds the validated, silence-trimmed 16 kHz mono
    waveform that Gate 4 (Wav2Vec2) should consume.
    """
    events: List[GateEvent] = []
    notes: List[str] = []

    if not GATE_ENABLED:
        try:
            audio, sr = load_audio(path)
            report = GateReport(
                status="SUCCESS",
                audio=audio,
                sr=sr,
                duration_seconds=len(audio) / sr,
                original_duration_seconds=len(audio) / sr,
                notes=["gate pipeline disabled (DEEPFAKE_GATE_ENABLED=0)"],
            )
            return report
        except Exception as exc:  # noqa: BLE001
            return _rejected(GATE1, "Corrupted or empty file.",
                             [f"decode failed: {type(exc).__name__}"], [])

    # ---- decode (Gate 1 prelude: undecodable == corrupted) ----
    try:
        audio, sr = load_audio(path)
    except Exception as exc:  # noqa: BLE001
        events.append(_reject(GATE1, "Corrupted or empty file.",
                              f"decode failed: {type(exc).__name__}: {exc}"))
        return _rejected(GATE1, "Corrupted or empty file.", notes, events)

    original_duration = len(audio) / sr

    # ---- Gate 1 ----
    try:
        ev1, notes1, trimmed = gate_file_integrity(audio, sr)
        events.append(ev1)
        notes.extend(notes1)
        if not ev1.passed:
            return _rejected(GATE1, ev1.reason, notes, events)
    except Exception as exc:  # noqa: BLE001 - a gate bug must never kill the request
        notes.append(f"Gate 1 crashed ({type(exc).__name__}: {exc}); continuing")
        trimmed = audio

    # ---- Gate 2 ----
    speech_ms: float = 0.0
    transcript: Optional[str] = None
    try:
        ev2, speech_ms, transcript, notes2 = gate_voice_activity(trimmed)
        events.append(ev2)
        notes.extend(notes2)
        if not ev2.passed:
            return _rejected(GATE2, ev2.reason, notes, events)
    except Exception as exc:  # noqa: BLE001
        notes.append(f"Gate 2 crashed ({type(exc).__name__}: {exc}); continuing")

    # ---- Gate 3 ----
    audio_event: Optional[str] = None
    try:
        ev3, audio_event = gate_audio_event(trimmed)
        events.append(ev3)
        if not ev3.passed:
            return _rejected(GATE3, ev3.reason, notes, events)
    except Exception as exc:  # noqa: BLE001
        notes.append(f"Gate 3 crashed ({type(exc).__name__}: {exc}); continuing")

    return GateReport(
        status="SUCCESS",
        audio=trimmed,
        sr=sr,
        duration_seconds=len(trimmed) / sr,
        original_duration_seconds=original_duration,
        speech_ms=speech_ms,
        transcript=transcript,
        audio_event=audio_event,
        events=events,
        notes=notes,
    )

# ---------------------------------------------------------------------------
# Gate 4 helper -- confidence banding (used by main.py)
# ---------------------------------------------------------------------------

CONF_DECISIVE = "DECISIVE"
CONF_INCONCLUSIVE = "INCONCLUSIVE"

def band_confidence(confidence_pct: float) -> str:
    """
    Implements the Gate 4 confidence rule.

    >80%            -> DECISIVE (a Real/Fake verdict is returned)
    50% .. 80%      -> INCONCLUSIVE ("Inconclusive / Low Confidence")

    A 2-class softmax can never report max-prob < 50%, so there is no third band.
    """
    if confidence_pct >= DECISIVE_CONFIDENCE:
        return CONF_DECISIVE
    if confidence_pct < INCONCLUSIVE_FLOOR:
        return CONF_INCONCLUSIVE  # defensive; mathematically unreachable
    return CONF_INCONCLUSIVE

# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _main(argv: List[str]) -> int:
    if len(argv) < 2:
        print("usage: python audio_gatekeeper.py <audio-file> [<audio-file> ...]")
        return 2

    for path in argv[1:]:
        print("=" * 70)
        print(f"File: {path}")
        try:
            report = run_gates(path)
        except Exception as exc:  # noqa: BLE001
            print(f"  FATAL: {type(exc).__name__}: {exc}")
            continue

        print(f"  status     : {report.status}")
        print(f"  reason     : {report.reason or '-'}")
        print(f"  gate       : {report.gate or '-'}")
        print(f"  duration   : {report.original_duration_seconds:.2f}s "
              f"-> {report.duration_seconds:.2f}s (after trim)")
        print(f"  speech_ms  : {report.speech_ms:.0f}")
        print(f"  transcript : {report.transcript!r}")
        print(f"  audio_event: {report.audio_event}")
        for e in report.events:
            state = "PASS" if e.passed else "REJECT"
            print(f"  [{state}] {e.gate}"
                  + (f" -> {e.reason}" if e.reason else "")
                  + (f" | {e.detail}" if e.detail else ""))
        if report.notes:
            print("  notes:")
            for n in report.notes:
                print(f"    - {n}")
    return 0

if __name__ == "__main__":
    sys.exit(_main(sys.argv))
