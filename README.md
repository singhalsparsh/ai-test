# DeepfakeGuard — AI Voice Authenticity Detection Platform

DeepfakeGuard is an acoustic forensics and voice authenticity detection platform that identifies generative AI voice clones, scam calls, and synthetic audio clips in real-time.

A React/Vite frontend captures or uploads audio and posts it to a Python backend (FastAPI + a fine-tuned Wav2Vec2 model), which runs a multi-stage gated pipeline before the audio is ever scored. The frontend never invents a verdict: if the backend cannot be reached for a real recording, it reports the outage instead of falling back to filename heuristics.

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

## Python Backend

The detector lives in `backend/main.py`: a FastAPI service that loads a fine-tuned Wav2Vec2 audio-classification model (`garystafford/wav2vec2-deepfake-voice-detector`) and answers `POST /api/detect`.

Audio is never scored on first contact. It first runs through a **multi-stage gated pipeline** (`backend/audio_gatekeeper.py`) that validates and cleans the signal:

- **Gate 1 — Acoustic preflight (librosa)**: duration, silence, energy and spectral sanity checks. Dependency-free, so it always runs.
- **Gate 2 — Speech validity**: Silero VAD (with a webrtcvad fallback) confirms real speech, Whisper provides an ASR sanity transcript, and pyannote.audio flags overlapping speakers.
- **Gate 3 — Audio event classification**: YAMNet (TensorFlow Hub) decides what the clip actually contains, falling back to a dependency-free librosa heuristic when TensorFlow is absent.
- **Gate 4 — Wav2Vec2 inference**: only reached if the gates pass, and run on the *cleaned* audio.

Every gate library is probed at runtime. If one is missing that specific sub-check is skipped with a warning rather than crashing — Gate 1 always runs and Gate 3 always has a fallback (see `backend/requirements.txt`).

If a gate rejects the clip, the backend returns HTTP **200** with `status: "REJECTED"` and never touches the model. This is deliberate: a non-2xx would look like an outage to the frontend. A rejected clip carries **no verdict** (`confidence: 0`), because unusable audio is not evidence of a scam call.

### Endpoint

- **Method**: `POST`
- **Path**: `/api/detect` (proxied in dev and on Vercel; direct at `http://localhost:8000/api/detect`)
- **Body**: `multipart/form-data` with field `audio` (`.wav`, `.mp3`, `.m4a`, `.flac`, `.ogg`)

### Response contract

```json
{
  "is_ai": false,
  "isAuthentic": true,
  "confidence": 96.8,
  "metrics": {
    "spectral_centroid": 1420.5,
    "pitch_anomaly": 0.03,
    "mfcc_variance": 31.2,
    "zero_crossing_rate": 0.045,
    "spectral_rolloff": 2100.0,
    "spectral_bandwidth": 1800.0,
    "rms_energy": 0.06
  },
  "filename": "caller-recording.wav",
  "duration_seconds": 4.5,
  "model_used": "garystafford/wav2vec2-deepfake-voice-detector",
  "status": "SUCCESS",
  "reason": null,
  "gate": null,
  "transcript": "hi mom, it's me, I need help",
  "audio_event": "Speech",
  "speech_ms": 4100,
  "gates": []
}
```

`status` is the field that matters most:

| `status`       | Meaning                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------- |
| `SUCCESS`      | Gates passed; `is_ai` and `confidence` are real model output.                                  |
| `REJECTED`     | A gate rejected the audio (silence, no speech, music, overlapping talk). No verdict — do not read `is_ai`. |
| `INCONCLUSIVE` | Gates passed but the model could not commit to a confident answer.                             |

The gate fields (`reason`, `gate`, `transcript`, `audio_event`, `speech_ms`, `gates`) are optional with defaults, so clients that ignore them keep working.

### Frontend behaviour

`analyzeAudioClip()` in `src/utils/audioEngine.ts` maps this response to the UI's forensic fields. For a real recording or upload it **requires** the backend: a 30s timeout, a proxy `502/504`, or an unreadable body raises an error that surfaces as an "Analysis Unavailable" banner naming the cause. The client-side forensic engine is reserved for the demo sample cards (`ceo` / `family` / `bank` / `clone`), which are scripted previews that never touch a server.

### Backend configuration

Environment variables are read by `backend/main.py` (see `.env.example`):

- `DEEPFAKE_GATE_ENABLED` — `1` runs the gated pipeline, `0` bypasses it for debugging.
- `HF_TOKEN` — HuggingFace token for Gate 2's pyannote overlap check. Optional; without it that sub-check is skipped, never fatal.
- `CORS_ORIGINS` — comma-separated allowed origins. Usually unnecessary, since the Vercel rewrite keeps requests same-origin.

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

You need both the frontend and the Python backend running. Real audio analysis is served by the backend; without it, uploads and live recordings fail with an explicit "Analysis Unavailable" message rather than a guess.

### 1. Frontend

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build production bundle
npm run build
```

The dev server proxies `/api/*` to the backend (see `vite.config.ts`), so the frontend talks to it over the same origin with no CORS to configure.

### 2. Backend

```bash
cd backend
python -m venv .venb
.venb\Scripts\activate          # macOS/Linux: source .venb/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

This serves `POST /api/detect` on port 8000. The model downloads from HuggingFace on first launch, so the first request is slow.

### 3. Tunnel (optional, for mobile/testing off localhost)

```bash
npm run tunnel
```

`npm run tunnel` starts an ngrok HTTP tunnel to port 8000 using `ngrok.yml`. The authtoken is **not** stored in the repo — put it in `.ngrok.authtoken.yml` (gitignored) or export `NGROK_AUTHTOKEN`. See `.ngrok.authtoken.yml.example` for the format.

### Demo sample cards

The `ceo` / `family` / `bank` / `clone` sample cards on the Home page run entirely in the browser and need no backend. They are scripted previews for demonstrating the report UI, not real detections.
