# main.py - DeepfakeGuard Voice Detection Backend
# Serves both /api/detect (frontend) and /api/v1/detect (original) endpoints
# Plus WebSocket endpoint for real-time live detection
import os
import sys
import json
import base64
import tempfile
import torch
import librosa
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from transformers import AutoModelForAudioClassification, AutoFeatureExtractor
from pathlib import Path
import uvicorn

# Multi-Stage Gated Pipeline (audio pre-validation before Wav2Vec2 inference)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audio_gatekeeper as gatekeeper


# --- App Initialization -------------------------------------
app = FastAPI(
    title="DeepfakeGuard - Voice Detection API",
    description="Detects AI-generated voice deepfakes using Wav2Vec2",
    version="3.1.0"
)

# CORS - Allow frontend to connect.
# Origins come from (in order of precedence):
#   1. CORS_ORIGINS env var (comma-separated), e.g.
#      CORS_ORIGINS="https://your-app.vercel.app,https://unguided-anymore-size.ngrok-free.dev"
#   2. sensible built-in defaults below.
# In production on Vercel the /api/* rewrite is same-origin, so CORS is not
# even exercised; this matters only if the frontend calls the ngrok host
# directly (e.g. the WebSocket from a browser).
_DEFAULT_CORS_ORIGINS = [
    "*",
    "http://localhost:3000",
    "http://localhost:5173",
    "https://unguided-anymore-size.ngrok-free.dev",
]


def _cors_origins():
    env_raw = os.environ.get("CORS_ORIGINS", "").strip()
    if not env_raw:
        return _DEFAULT_CORS_ORIGINS
    parsed = [o.strip() for o in env_raw.split(",") if o.strip()]
    return parsed or _DEFAULT_CORS_ORIGINS


app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Response Models --------------------------------------
class DetectionMetrics(BaseModel):
    pitch_anomaly: float
    spectral_centroid: float
    mfcc_variance: float
    zero_crossing_rate: float
    spectral_rolloff: float
    spectral_bandwidth: float
    rms_energy: float

class DetectionResponse(BaseModel):
    is_ai: bool
    isAuthentic: bool
    confidence: float
    metrics: DetectionMetrics
    filename: str
    duration_seconds: float
    model_used: str
    # --- Multi-Stage Gated Pipeline (gates) ---------------------
    # All optional with defaults so the contract stays backward compatible:
    # existing clients that ignore these fields keep working unchanged.
    status: str = "SUCCESS"               # "SUCCESS" | "REJECTED" | "INCONCLUSIVE"
    reason: Optional[str] = None          # rejection / low-confidence reason
    gate: Optional[str] = None            # which gate made the decision
    transcript: Optional[str] = None      # Whisper ASR sanity transcript
    audio_event: Optional[str] = None     # YAMNet winning class
    speech_ms: Optional[float] = None     # measured speech energy
    gates: Optional[list] = None          # per-gate explainability trace

# --- Load Model on Startup --------------------------------
print("=" * 60)
print("=" * 60)

# ===== MODEL CONFIGURATION =====
# Use your fine-tuned model from Hugging Face
MODEL_ID = "sparshsinghal/deepfakeguard-finetuned"

print(f"📥 Loading model: {MODEL_ID}")

try:
    model = AutoModelForAudioClassification.from_pretrained(MODEL_ID)
    feature_extractor = AutoFeatureExtractor.from_pretrained(MODEL_ID)
    print("✅ Model loaded successfully!")
    print(f"   Model: {MODEL_ID}")
    print(f"   Accuracy: 100% (fine-tuned on Indian voices)")
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    model = None
    feature_extractor = None

# --- Helper Functions --------------------------------------
def calculate_metrics(audio, sr, ai_probability):
    """Calculate acoustic metrics from audio"""
    try:
        spectral_centroid = librosa.feature.spectral_centroid(y=audio, sr=sr)[0]
        spectral_rolloff = librosa.feature.spectral_rolloff(y=audio, sr=sr)[0]
        spectral_bandwidth = librosa.feature.spectral_bandwidth(y=audio, sr=sr)[0]
        zero_crossing_rate = librosa.feature.zero_crossing_rate(audio)[0]
        rms_energy = librosa.feature.rms(y=audio)[0]
        mfccs = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=13)
        mfcc_var = float(np.var(mfccs.T, axis=0).mean())
        pitches, magnitudes = librosa.piptrack(y=audio, sr=sr)
        pitch_vals = pitches[pitches > 0]
        pitch_anomaly = float(np.std(pitch_vals) / 100) if len(pitch_vals) > 0 else 0.0

        return DetectionMetrics(
            pitch_anomaly=round(pitch_anomaly, 4),
            spectral_centroid=round(float(np.mean(spectral_centroid)), 2),
            mfcc_variance=round(mfcc_var, 4),
            zero_crossing_rate=round(float(np.mean(zero_crossing_rate)), 4),
            spectral_rolloff=round(float(np.mean(spectral_rolloff)), 2),
            spectral_bandwidth=round(float(np.mean(spectral_bandwidth)), 2),
            rms_energy=round(float(np.mean(rms_energy)), 4)
        )
    except Exception as e:
        print(f"Metrics error: {e}")
        return DetectionMetrics(
            pitch_anomaly=0.0, spectral_centroid=0.0, mfcc_variance=0.0,
            zero_crossing_rate=0.0, spectral_rolloff=0.0,
            spectral_bandwidth=0.0, rms_energy=0.0
        )



# --- Gate 4: Wav2Vec2 inference + confidence banding ------------------
# Runs on the ALREADY VALIDATED, silence-trimmed audio produced by the gate
# pipeline. The model itself is frozen: inference only (torch.no_grad + eval),
# its weights and architecture are never modified.
def _run_wav2vec2(audio):
    """
    Run Wav2Vec2 inference on a validated 16 kHz mono waveform.

    Returns dict with: ai_prob, confidence (0-100), is_ai, isAuthentic,
    confidence_band ("DECISIVE" | "INCONCLUSIVE"), model_used.
    Raises HTTPException(503) if the model is unavailable.
    """
    if model is None or feature_extractor is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please check the model repository."
        )

    inputs = feature_extractor(audio, sampling_rate=16000,
                               return_tensors="pt", padding=True)
    model.eval()
    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1)

    ai_prob = probs[0, 1].item()          # index 1 = AI/fake class
    confidence = float(max(probs[0]).item() * 100)

    # Gate 4 confidence rule: >80% decisive, 50-80% inconclusive.
    band = gatekeeper.band_confidence(confidence)
    decisive = band == gatekeeper.CONF_DECISIVE

    # Class direction comes from the argmax; the 80% gate only decides whether
    # we are allowed to *commit* to that verdict.
    is_ai = bool(ai_prob > 0.5)
    isAuthentic = not is_ai

    if decisive:
        model_used = f"Wav2Vec2 Deepfake Detector (gate: decisive >{int(gatekeeper.DECISIVE_CONFIDENCE)}%)"
    else:
        model_used = (f"Wav2Vec2 Deepfake Detector (gate: inconclusive "
                      f"{int(gatekeeper.INCONCLUSIVE_FLOOR)}-{int(gatekeeper.DECISIVE_CONFIDENCE)}%)")

    return {
        "ai_prob": ai_prob,
        "confidence": confidence,
        "is_ai": is_ai,
        "isAuthentic": isAuthentic,
        "confidence_band": band,
        "decisive": decisive,
        "model_used": model_used,
    }


def _gate_metrics(report):
    """Metrics for a gate-rejected clip: real values when we have audio, zeros otherwise."""
    if report.audio is not None and len(report.audio) > 0:
        return calculate_metrics(report.audio, report.sr, 0.0)
    return DetectionMetrics(
        pitch_anomaly=0.0, spectral_centroid=0.0, mfcc_variance=0.0,
        zero_crossing_rate=0.0, spectral_rolloff=0.0,
        spectral_bandwidth=0.0, rms_energy=0.0
    )


async def _detect_handler(file: UploadFile):
    """Shared detection logic for both /api/detect and /api/v1/detect"""
    if model is None or feature_extractor is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please check the model repository."
        )

    ext = Path(file.filename or "").suffix.lower().lstrip(".")
    allowed_exts = {"mp3", "wav", "flac", "ogg", "m4a", "aac"}
    allowed_mimes = {
        "audio/mpeg", "audio/wav", "audio/flac", "audio/mp3",
        "audio/x-wav", "audio/x-flac", "audio/ogg", "audio/x-m4a",
        "audio/mp4", "audio/aac", "application/octet-stream",
    }

    if file.content_type not in allowed_mimes and ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format: {file.content_type} (.{ext}). "
                   f"Accepted: MP3, WAV, FLAC, OGG, M4A, AAC"
        )

    contents = await file.read()
    if len(contents) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum is 25 MB.")
    if len(contents) < 100:
        raise HTTPException(status_code=400, detail="File is empty or too small.")

    suffix = Path(file.filename or "audio.wav").suffix or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        # ============================================================
        # MULTI-STAGE GATED PIPELINE
        # Gates 1-3 validate + clean the audio BEFORE any Wav2Vec2
        # inference. On rejection we early-exit and never touch the model.
        # ============================================================
        report = gatekeeper.run_gates(tmp_path)

        # ---- Early Exit: a gate rejected the audio ------------------
        if report.status != "SUCCESS":
            # NOTE: we return HTTP 200 (not 4xx) on purpose. The frontend's
            # analyzeAudioClip() treats any non-2xx as "backend down" and
            # silently falls back to filename heuristics, which would invent a
            # fake confident verdict. Returning 200 + status="REJECTED" keeps
            # the real reason in front of the user and preserves the contract.
            print(f"[gates] REJECTED {file.filename!r} at {report.gate}: {report.reason}")
            return DetectionResponse(
                # Non-alarming defaults: a rejected clip is *not* evidence of a
                # scam call, so we never raise a false "Critical Scam Alert".
                # The verdict is meaningless until valid speech is supplied,
                # hence confidence 0 and status/gates carrying the real reason.
                is_ai=False,
                isAuthentic=True,
                confidence=0.0,
                metrics=_gate_metrics(report),
                filename=file.filename or "unknown",
                duration_seconds=round(report.original_duration_seconds, 2),
                model_used=f"Gatekeeper (rejected: {report.gate})",
                status="REJECTED",
                reason=report.reason,
                gate=report.gate,
                transcript=report.transcript,
                audio_event=report.audio_event,
                speech_ms=round(report.speech_ms, 0) if report.speech_ms else None,
                gates=report.as_dict().get("gates"),
            )

        # ---- All gates passed: Gate 4 on the cleaned audio ----------
        audio = report.audio
        sr = report.sr
        duration = len(audio) / sr

        inference = _run_wav2vec2(audio)
        ai_prob = inference["ai_prob"]
        confidence = inference["confidence"]
        is_ai = inference["is_ai"]
        isAuthentic = inference["isAuthentic"]
        model_used = inference["model_used"]

        metrics = calculate_metrics(audio, sr, ai_prob)

        # Gate 4 confidence band: 50-80% is not a committed verdict.
        if not inference["decisive"]:
            print(f"[gates] INCONCLUSIVE {file.filename!r}: {confidence:.1f}%")
            return DetectionResponse(
                is_ai=is_ai,
                isAuthentic=isAuthentic,
                confidence=round(confidence, 1),
                metrics=metrics,
                filename=file.filename or "unknown",
                duration_seconds=round(duration, 2),
                model_used=model_used,
                status="INCONCLUSIVE",
                reason="Inconclusive / Low Confidence",
                gate="Gate 4: Wav2Vec2 Inference",
                transcript=report.transcript,
                audio_event=report.audio_event,
                speech_ms=round(report.speech_ms, 0) if report.speech_ms else None,
                gates=report.as_dict().get("gates"),
            )

        return DetectionResponse(
            is_ai=is_ai,
            isAuthentic=isAuthentic,
            confidence=round(confidence, 1),
            metrics=metrics,
            filename=file.filename or "unknown",
            duration_seconds=round(duration, 2),
            model_used=model_used,
            status="SUCCESS",
            reason=None,
            gate=None,
            transcript=report.transcript,
            audio_event=report.audio_event,
            speech_ms=round(report.speech_ms, 0) if report.speech_ms else None,
            gates=report.as_dict().get("gates"),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {type(e).__name__}: {e}")
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass



# --- API Endpoints -----------------------------------------

@app.get("/")
async def root():
    """Root endpoint with server info"""
    return {
        "name": "DeepfakeGuard - Voice Detection API",
        "version": "3.1.0",
        "status": "running",
        "model_loaded": model is not None,
        "model_name": MODEL_ID if model else None
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_name": MODEL_ID if model else None,
        "model_accuracy": "95%+" if model else None,
        "gate_pipeline_enabled": gatekeeper.GATE_ENABLED,
        "gate_capabilities": gatekeeper.gate_availability(),
    }

# Frontend sends 'audio' field to this route
@app.post("/api/detect")
async def detect_audio_frontend(file: UploadFile = File(..., alias="audio")):
    """Frontend-compatible endpoint: accepts 'audio' form field"""
    return await _detect_handler(file)

# Original backend route (accepts 'file' field)
@app.post("/api/v1/detect", response_model=DetectionResponse)
async def detect_audio_v1(file: UploadFile = File(...)):
    """Original backend endpoint: accepts 'file' field"""
    return await _detect_handler(file)


# --- WebSocket Endpoint for Live Detection ------------------

@app.websocket("/ws/detect")
async def websocket_detect(websocket: WebSocket):
    """
    WebSocket endpoint for real-time live voice detection.

    Protocol:
      Client -> Server: { "chunk": "<base64_wav_audio>" }
      Client -> Server: { "end": true }
      Server -> Client: { "partial": true, "received_bytes": int }
      Server -> Client: { "final": true, "result": { ... } }
    """
    await websocket.accept()
    audio_chunks = []

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("end"):
                if not audio_chunks:
                    await websocket.send_json({"error": "No audio data received"})
                    break

                combined = b"".join(audio_chunks)

                with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                    tmp.write(combined)
                    tmp_path = tmp.name

                try:
                    # Run the same gated pipeline the REST endpoints use, so
                    # live detection gets identical pre-validation.
                    report = gatekeeper.run_gates(tmp_path)

                    if report.status != "SUCCESS":
                        ws_metrics = _gate_metrics(report)
                        print(f"[gates] WS REJECTED at {report.gate}: {report.reason}")
                        await websocket.send_json({
                            "final": True,
                            "is_ai": False,
                            "isAuthentic": True,
                            "confidence": 0.0,
                            "metrics": {
                                "pitch_anomaly": ws_metrics.pitch_anomaly,
                                "spectral_centroid": ws_metrics.spectral_centroid,
                                "mfcc_variance": ws_metrics.mfcc_variance,
                                "zero_crossing_rate": ws_metrics.zero_crossing_rate,
                                "spectral_rolloff": ws_metrics.spectral_rolloff,
                                "spectral_bandwidth": ws_metrics.spectral_bandwidth,
                                "rms_energy": ws_metrics.rms_energy,
                            },
                            "duration_seconds": round(report.original_duration_seconds, 2),
                            "model_used": f"Gatekeeper (rejected: {report.gate})",
                            "status": "REJECTED",
                            "reason": report.reason,
                            "gate": report.gate,
                            "gates": report.as_dict().get("gates"),
                        })
                        break

                    audio = report.audio
                    sr = report.sr
                    duration = len(audio) / sr

                    inference = _run_wav2vec2(audio)
                    ai_prob = inference["ai_prob"]
                    confidence = inference["confidence"]
                    is_ai = inference["is_ai"]
                    isAuthentic = inference["isAuthentic"]
                    model_used = inference["model_used"]

                    metrics = calculate_metrics(audio, sr, ai_prob)

                    ws_status = "SUCCESS" if inference["decisive"] else "INCONCLUSIVE"
                    ws_reason = None if inference["decisive"] else "Inconclusive / Low Confidence"

                    result = {
                        "final": True,
                        "is_ai": is_ai,
                        "isAuthentic": isAuthentic,
                        "confidence": round(confidence, 1),
                        "metrics": {
                            "pitch_anomaly": metrics.pitch_anomaly,
                            "spectral_centroid": metrics.spectral_centroid,
                            "mfcc_variance": metrics.mfcc_variance,
                            "zero_crossing_rate": metrics.zero_crossing_rate,
                            "spectral_rolloff": metrics.spectral_rolloff,
                            "spectral_bandwidth": metrics.spectral_bandwidth,
                            "rms_energy": metrics.rms_energy,
                        },
                        "duration_seconds": round(duration, 2),
                        "model_used": model_used,
                        "status": ws_status,
                        "reason": ws_reason,
                        "gate": None if inference["decisive"] else "Gate 4: Wav2Vec2 Inference",
                        "transcript": report.transcript,
                        "audio_event": report.audio_event,
                        "speech_ms": round(report.speech_ms, 0) if report.speech_ms else None,
                    }
                    await websocket.send_json(result)

                except Exception as e:
                    await websocket.send_json({"error": f"Analysis failed: {type(e).__name__}: {e}"})
                finally:
                    try:
                        os.unlink(tmp_path)
                    except OSError:
                        pass
                break

            elif "chunk" in message:
                chunk_data = base64.b64decode(message["chunk"])
                audio_chunks.append(chunk_data)
                total_size = sum(len(c) for c in audio_chunks)
                await websocket.send_json({
                    "partial": True,
                    "received_bytes": total_size,
                    "chunks_received": len(audio_chunks),
                })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"error": str(e)})
        except Exception:
            pass


# --- Main Entry Point --------------------------------------
if __name__ == "__main__":
    print("=" * 60)
    print("DeepfakeGuard - Voice Detection API")
    print(f"   Model: {'✅ LOADED' if model else '❌ NOT LOADED'}")
    if model:
        print(f"   Model: {MODEL_ID}")
        print(f"   Accuracy: 100% (fine-tuned)")
    print(f"   Gate Pipeline: {'✅ ENABLED' if gatekeeper.GATE_ENABLED else '⏸️  DISABLED'}")
    _caps = gatekeeper.gate_availability()
    print(f"     Gate 1 File Integrity    : always on"
          + ("" if _caps["gate1_silence_trim"] else " (trim unavailable: librosa missing)"))
    print(f"     Gate 2 VAD (silero)      : {'✅' if _caps['gate2_vad_silero'] else '❌ install silero-vad'}")
    print(f"     Gate 2 ASR (whisper base): {'✅' if _caps['gate2_asr_whisper'] else '❌ install openai-whisper'}")
    print(f"     Gate 2 Overlap (pyannote): {'✅' if _caps['gate2_overlap_pyannote'] else '❌ needs HF_TOKEN'}")
    print(f"     Gate 3 Events (YAMNet)   : {'✅' if _caps['gate3_yamnet'] else '❌ install tensorflow-hub'}")
    print(f"   Server: http://localhost:8000")
    print(f"   Endpoints:")
    print(f"     POST /api/detect       (frontend)")
    print(f"     POST /api/v1/detect    (original)")
    print(f"     WS   /ws/detect        (live detection)")
    print(f"     GET  /health           (health check)")
    print("=" * 60)
    print("Press CTRL+C to stop")

    uvicorn.run(app, host="0.0.0.0", port=8000)