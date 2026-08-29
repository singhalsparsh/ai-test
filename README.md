# DeepfakeGuard — AI Voice Authenticity Detection Platform

DeepfakeGuard is a frontend acoustic forensics and voice authenticity detection system designed to identify generative AI voice clones, scam calls, and synthetic audio clips in real-time.

---

## 🌟 Key Features & Architecture

- **Human-Centric & Engineering-Grade Telemetry**: Clear risk classifications (`Safe Human Voice` vs `Critical Scam Alert`), plain-language safety recommendations, alongside acoustic indicators (Natural Breathing Rhythm, Vocal Cord Jitter, Robotic Flaw Index, 3D Room Acoustics).
- **Forensic PDF Export System**: Built-in `jsPDF` reporting engine that produces timestamped, forensic audit PDF reports with risk summaries and metric badges.
- **5-6% Liquid Glass Navigation Bar**: Translucent glass navigation (`backdrop-blur: 24px`, specular liquid border, `saturate: 190%`).
- **Dark / Light Mode System**: Custom obsidian (`#0B0B0E`) background with warm amber (`#F1BE38`) accents in dark mode, and warm editorial parchment (`#F5F0E8`) in light mode, with automatic system preference detection and localStorage persistence.
- **Autonomous Network Sync**: Automatically monitors network connection status (`LIVE` when online, smooth desaturation when disconnected).
- **Multi-Page Architecture with Framer Motion**:
  - `Home`: Drag-and-drop audio scanner with sample voice sandbox.
  - `Features`: Acoustic engine specifications and interactive Real vs Clone harmonic lab.
  - `Contact Us`: Complete forensic incident triage form with audio attachment and case number generation.
  - `Privacy Policy`: Zero-Data-Retention commitment with official PDF download.
  - `Terms of Service`: Forensic disclaimers and legal terms with official PDF download.
- **Help Improve the Model Widget**: Docked bottom-right dataset contribution tool with opt-in consent and tagging.

---

## Python Backend Integration Guide

The frontend is ready to communicate with your custom Python model (`FastAPI`, `Flask`, `PyTorch`, `HuggingFace Wav2Vec2`).

### 1. Expected Endpoint Specification

- **Method**: `POST`
- **Path**: `/api/detect` (or `http://localhost:8000/api/detect`)
- **Body**: `multipart/form-data` with field `audio` (file binary: `.wav`, `.mp3`, `.m4a`, `.flac`)

### 2. JSON Response Contract

When your Python model finishes analyzing the audio, return the following JSON structure:

```json
{
  "isAuthentic": false,
  "confidence": 97.4,
  "label": "Deepfake Voice Detected",
  "summary": "Synthetic vocoder harmonics and abrupt pitch quantization detected.",
  "riskLevel": "CRITICAL_SCAM_ALERT",
  "plainAdvice": "Do not transfer funds, share OTPs, or give passwords. Contact the caller via verified channels.",
  "humanBreathScore": 14,
  "vocalTremorScore": 22,
  "robotGlitchScore": 92,
  "roomAcousticScore": 31,
  "spectralArtifactsScore": 88.5,
  "pitchConsistencyScore": 26.2,
  "formantJitterScore": 83.1,
  "acousticCoherenceScore": 24.0,
  "duration": 4.5,
  "sampleRate": 44100,
  "detectedAnomalies": [
    "Phase glitch detected in 2.4kHz–4.0kHz frequency spectrum",
    "Missing natural breathing pauses and organic vocal fold tremor",
    "Synthetic vocoder comb-filter artifacts"
  ],
  "waveformBars": [0.22, 0.45, 0.78, 0.91, 0.65, 0.32, 0.18, 0.44]
}
```

---

## Python Backend Starter Code (`main.py`)

Here is an example `main.py` using **FastAPI** and **PyTorch / Transformers** (`Wav2Vec2ForSequenceClassification` / custom acoustic model):

```python
# main.py
import uvicorn
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import torch
import torchaudio
import numpy as np
import io

app = FastAPI(title="DeepfakeGuard Python Acoustic Engine")

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load your custom deepfake detection model (e.g., fine-tuned Wav2Vec2 or ResNet Spectrogram)
# model = torch.load("models/deepfake_voice_detector.pt", map_location="cpu")
# model.eval()

@app.post("/api/detect")
async def detect_audio(audio: UploadFile = File(...)):
    # 1. Read binary audio
    contents = await audio.read()
    waveform, sample_rate = torchaudio.load(io.BytesIO(contents))
    
    # Convert to mono if multi-channel
    if waveform.shape[0] > 1:
        waveform = torch.mean(waveform, dim=0, keepdim=True)
    
    duration = float(waveform.shape[1] / sample_rate)
    
    # 2. Extract Acoustic Metrics & Run Inference
    # (Replace with your model's forward pass)
    # with torch.no_grad():
    #     logits = model(waveform)
    #     probabilities = torch.softmax(logits, dim=-1)
    
    # Example logic:
    is_authentic = False  # Calculated from model output
    confidence = 96.8
    
    # 3. Generate Waveform visualization bars
    waveform_np = waveform.squeeze().numpy()
    bar_count = 44
    chunk_size = len(waveform_np) // bar_count
    bars = []
    for i in range(bar_count):
        chunk = waveform_np[i * chunk_size : (i + 1) * chunk_size]
        avg_amp = float(np.mean(np.abs(chunk))) if len(chunk) > 0 else 0.1
        normalized_bar = min(0.95, max(0.15, avg_amp * 4.0))
        bars.append(round(normalized_bar, 3))

    return {
        "isAuthentic": is_authentic,
        "confidence": confidence,
        "label": "Authentic Human Voice" if is_authentic else "Deepfake Voice Detected",
        "summary": "Natural respiratory cadence verified." if is_authentic else "Neural vocoder artifacts and pitch quantization detected.",
        "riskLevel": "LOW_RISK_SAFE" if is_authentic else "CRITICAL_SCAM_ALERT",
        "plainAdvice": "Recording is consistent with human voice." if is_authentic else "Do not comply with demands for money or sensitive data.",
        "humanBreathScore": 95 if is_authentic else 12,
        "vocalTremorScore": 92 if is_authentic else 24,
        "robotGlitchScore": 6 if is_authentic else 93,
        "roomAcousticScore": 96 if is_authentic else 30,
        "spectralArtifactsScore": 7.4 if is_authentic else 87.6,
        "pitchConsistencyScore": 95.8 if is_authentic else 28.1,
        "formantJitterScore": 6.1 if is_authentic else 84.0,
        "acousticCoherenceScore": 96.0 if is_authentic else 22.5,
        "duration": round(duration, 2),
        "sampleRate": sample_rate,
        "detectedAnomalies": [
            "Neural vocoder phase cancellation detected in high frequencies",
            "Missing physiological vocal tract micro-tremor",
        ] if not is_authentic else ["Natural room impulse resonance"],
        "waveformBars": bars
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

---

## 🛠️ How Another AI or Developer Can Extend This Project

### 1. Adding a New Page or View
1. Create your component in `src/pages/YourNewPage.tsx`.
2. Add the page ID to the `activePage` union in `src/App.tsx`.
3. Add the navigation link into `navItems` in `src/components/Navbar.tsx` and `src/components/Footer.tsx`.
4. Wrap with `motion.div` in `src/App.tsx` for animated page entrance.

### 2. Modifying Theming & Aesthetics
- **Color Tokens**: Defined in `src/index.css` under `:root` (`--bg-base: #F5F0E8`, `--accent-amber: #D4A017`, `--accent-green: #2D8A4E`, `--accent-red: #C0392B`).
- **Liquid Glass**: Configured in `src/components/Navbar.tsx` with specular highlights and `backdrop-filter: blur(24px) saturate(190%)`.
- **Desaturation Shift**: Body class `.is-offline` in `src/index.css` triggers subtle ambient grayscale transition when disconnected.

### 3. Customizing the PDF Forensic Export
- Open `src/utils/pdfExport.ts`.
- Adjust font sizes, margins, color palettes, or company header watermarks using standard `jsPDF` drawing primitives (`doc.roundedRect`, `doc.text`, `doc.save`).

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build production bundle
npm run build
```
