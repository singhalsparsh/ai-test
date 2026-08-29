# DeepfakeGuard — Complete Project Documentation

> **Document Version:** 1.0.0
> **Project Name:** DeepfakeGuard — AI Voice Authenticity Detection Platform
> **Date:** August 2026
> **Classification:** Comprehensive Technical Reference

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Directory Structure](#4-directory-structure)
5. [Frontend Documentation](#5-frontend-documentation)
   - 5.1 [Entry Points & Configuration](#51-entry-points--configuration)
   - 5.2 [Routing & Page Architecture](#52-routing--page-architecture)
   - 5.3 [State Management](#53-state-management)
   - 5.4 [Design System & Theme](#54-design-system--theme)
   - 5.5 [Component Reference](#55-component-reference)
   - 5.6 [Utility Modules](#56-utility-modules)
   - 5.7 [Animation System](#57-animation-system)
6. [Backend Documentation](#6-backend-documentation)
   - 6.1 [FastAPI Server (`main.py`)](#61-fastapi-server-mainpy)
   - 6.2 [ML Model — Wav2Vec2 Deepfake Detector](#62-ml-model--wav2vec2-deepfake-detector)
   - 6.3 [Training Script — Classical ML (`train_model.py`)](#63-training-script--classical-ml-train_modelpy)
   - 6.4 [Training Script — Transformer Fine-Tuning (`train_wav2vec2.py`)](#64-training-script--transformer-fine-tuning-train_wav2vec2py)
   - 6.5 [Model Verification (`verify_model.py`)](#65-model-verification-verify_modelpy)
   - 6.6 [Backend API Reference](#66-backend-api-reference)
7. [Frontend-Backend Integration](#7-frontend-backend-integration)
   - 7.1 [Data Flow Pipeline](#71-data-flow-pipeline)
   - 7.2 [API Request/Response Contract](#72-api-requestresponse-contract)
   - 7.3 [Vite Proxy Configuration](#73-vite-proxy-configuration)
   - 7.4 [Fallback Behavior](#74-fallback-behavior)
8. [Hugging Face Model Details](#8-hugging-face-model-details)
9. [Design System Reference](#9-design-system-reference)
10. [Scripts & Commands](#10-scripts--commands)
11. [Setup & Deployment Guide](#11-setup--deployment-guide)
12. [File-by-File Reference](#12-file-by-file-reference)

---

## 1. Project Overview

**DeepfakeGuard** is a full-stack web platform designed to detect and neutralize synthetic AI voice clones, deepfake audio impersonations, and telecom scam calls. It combines a React frontend with a Python FastAPI backend powered by a Hugging Face Wav2Vec2 deepfake detection model.

### Core Capabilities

- **Real-time voice deepfake detection** using Wav2Vec2 neural network inference
- **Dual-tier forensic telemetry**: plain-language human verdicts + engineering-grade metrics
- **Client-side Web Audio synthesis** for sample voice demonstrations (no external server needed)
- **Forensic PDF export** via jsPDF for evidence documentation
- **Zero data retention architecture** — audio is processed in volatile memory only
- **Interactive voice sandbox** with four synthesized voice archetypes
- **Dark/Light mode** with system preference detection and localStorage persistence

### Key Design Principles

1. **Privacy-first**: All audio is processed in volatile browser memory or ephemeral server buffers — no persistent storage
2. **Dual-level reporting**: Simple verdict for end-users + detailed metrics for forensic analysts
3. **Graceful degradation**: Works fully client-side if the Python backend is offline
4. **No modifications to frontend files** when integrating backend

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                             │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                    React 19 SPA                              │    │
│  │  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐     │    │
│  │  │ App.tsx  │──│ UploadZone   │──│ audioEngine.ts     │     │    │
│  │  │ (State)  │  │ (Drag&Drop)  │  │ (Web Audio + API)  │     │    │
│  │  └──────────┘  └──────────────┘  └────────┬───────────┘     │    │
│  │                                           │                  │    │
│  │  ┌──────────────┐  ┌──────────────┐       │                  │    │
│  │  │ SampleVoices │  │ pdfExport.ts │       │                  │    │
│  │  │ (WebAudio    │  │ (jsPDF)      │       │                  │    │
│  │  │  Synthesis)  │  └──────────────┘       │                  │    │
│  │  └──────────────┘                          │                  │    │
│  └───────────────────────────────────────────┼──────────────────┘    │
│                                              │                       │
│                         Vite Dev Proxy (localhost:3000)               │
│                         /api/* ──────────→ localhost:8000             │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    PYTHON BACKEND (Server)                            │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │              FastAPI (main.py) — Port 8000                   │    │
│  │                                                              │    │
│  │  POST /api/detect       (frontend route)                     │    │
│  │  POST /api/v1/detect    (legacy route)                       │    │
│  │  GET  /health           (health check)                       │    │
│  │  GET  /                 (server info)                         │    │
│  │                                                              │    │
│  │  ┌────────────────────────────────────────────────────────┐  │    │
│  │  │  Wav2Vec2 Model (Hugging Face)                        │  │    │
│  │  │  garystafford/wav2vec2-deepfake-voice-detector        │  │    │
│  │  │                                                        │  │    │
│  │  │  Audio → librosa.load (16kHz) → feature_extractor     │  │    │
│  │  │       → model(**inputs) → softmax → is_ai / confidence│  │    │
│  │  └────────────────────────────────────────────────────────┘  │    │
│  │                                                              │    │
│  │  ┌────────────────────────────────────────────────────────┐  │    │
│  │  │  Librosa Acoustic Metrics                             │  │    │
│  │  │  pitch_anomaly, spectral_centroid, mfcc_variance,     │  │    │
│  │  │  zero_crossing_rate, spectral_rolloff,                 │  │    │
│  │  │  spectral_bandwidth, rms_energy                        │  │    │
│  │  └────────────────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌───────────────────────────┐  ┌──────────────────────────────┐    │
│  │  train_model.py           │  │  train_wav2vec2.py           │    │
│  │  (Classical ML: RF, GB,   │  │  (Transformer fine-tuning:   │    │
│  │   SVM, XGBoost ensemble)  │  │   Wav2Vec2 fine-tune)        │    │
│  └───────────────────────────┘  └──────────────────────────────┘    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  data/real/        ← Human voice recordings (.wav, .mp3)    │    │
│  │  data/ai_generated/ ← AI-generated voice samples             │    │
│  │  models/voice_classifier.pkl ← Pre-trained classical model   │    │
│  └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### Frontend (React SPA)

| Category | Technology | Version | Purpose |
|---|---|---|---|
| **UI Framework** | React | 19.0.1 | Component-based UI rendering |
| **Language** | TypeScript | ~5.8.2 | Type-safe JavaScript superset |
| **Build Tool** | Vite | 6.2.3 | Development server & production bundler |
| **Styling** | Tailwind CSS | 4.1.14 | Utility-first CSS framework |
| **CSS Plugin** | @tailwindcss/vite | 4.1.14 | Direct Vite integration (no PostCSS) |
| **Animation** | Motion (Framer Motion) | 12.23.24 | Physics-based spring animations |
| **Audio Processing** | Web Audio API | Native | Browser-native audio decoding & synthesis |
| **PDF Generation** | jsPDF | 4.2.1 | Vector-drawn A4 forensic reports |
| **Icons** | Lucide React | 0.546.0 | SVG icon library |
| **React Plugin** | @vitejs/plugin-react | 5.0.4 | React Fast Refresh for Vite |

### Backend (Python)

| Category | Technology | Version | Purpose |
|---|---|---|---|
| **API Framework** | FastAPI | 0.115.0 | Async REST API server |
| **ASGI Server** | Uvicorn | 0.30.0 | Production ASGI server |
| **Deep Learning** | PyTorch (torch) | >= 2.0.0 | Neural network inference |
| **Transformers** | Hugging Face Transformers | >= 4.30.0 | Wav2Vec2 model loading |
| **Audio Processing** | Librosa | 0.10.2 | Audio feature extraction (MFCC, spectral, pitch) |
| **Numerical** | NumPy | >= 1.24.0 | Array operations & math |
| **ML (Classical)** | Scikit-learn | >= 1.3.0 | RF, GB, SVM classifiers |
| **ML (Boosting)** | XGBoost | >= 2.0.0 | Gradient boosting classifier |
| **Audio I/O** | SoundFile | >= 0.12.0 | Audio file reading/writing |
| **Validation** | Pydantic | >= 2.0.0 | Request/response data validation |
| **Form Handling** | python-multipart | 0.0.9 | Multipart form data parsing |

### Fonts

| Font | Weight | Usage |
|---|---|---|
| **Inter** | 300, 400, 500, 600, 700 | Primary UI body text |
| **JetBrains Mono** | 400, 500, 600 | Monospace for technical data, timestamps, file sizes |

---

## 4. Directory Structure

```
deepfakeguard/
├── index.html                    # Entry HTML with SEO meta, font preconnect, favicon
├── package.json                  # NPM manifest, scripts, dependencies
├── vite.config.ts                # Vite config: React + Tailwind + API proxy
├── tsconfig.json                 # TypeScript config (ES2022, React JSX, bundler resolution)
├── blueprint.md                  # Detailed architectural blueprint document
├── README.md                     # Project readme with integration guide
├── doc.md                        # This documentation file
├── BACKEND_INTEGRATION.md        # Backend integration report
├── .env.example                  # Environment variable template
├── .gitignore                    # Git ignore rules
├── metadata.json                 # AI Studio manifest
│
├── src/                          # Frontend source code
│   ├── main.tsx                  # React root mount (StrictMode)
│   ├── App.tsx                   # Top-level state coordinator & router
│   ├── index.css                 # Global styles, CSS variables, noise overlay, animations
│   │
│   ├── components/               # Reusable UI components
│   │   ├── Navbar.tsx            # Liquid glass navigation bar
│   │   ├── HeroSection.tsx       # Editorial hero with floating orbs
│   │   ├── UploadZone.tsx        # Core audio upload, analysis, results display
│   │   ├── SampleVoices.tsx      # Interactive voice sample sandbox
│   │   ├── ContributeModelBox.tsx # Floating dataset contribution widget
│   │   ├── Footer.tsx            # Footer with navigation links
│   │   └── Toasts.tsx            # Toast notification system
│   │
│   ├── pages/                    # Page-level views
│   │   ├── HomePage.tsx          # Home: Hero + Upload + Sample Voices
│   │   ├── FeaturesPage.tsx      # Features: Specs + Acoustic Comparison Lab
│   │   ├── ContactPage.tsx       # Contact: Incident reporting form
│   │   ├── PrivacyPage.tsx       # Privacy Policy with PDF export
│   │   └── TermsPage.tsx         # Terms of Service with PDF export
│   │
│   └── utils/                    # Utility modules
│       ├── audioEngine.ts        # Web Audio API: decode, synthesize, analyze, API call
│       └── pdfExport.ts          # jsPDF forensic audit report generator
│
├── backend/                      # Python backend (copied from separate project)
│   ├── main.py                   # FastAPI server with Wav2Vec2 inference
│   ├── requirements.txt          # Python dependencies
│   ├── train_model.py            # Classical ML training (RF/GB/SVM/XGBoost ensemble)
│   ├── train_wav2vec2.py         # Wav2Vec2 transformer fine-tuning script
│   ├── verify_model.py           # Model verification & consistency testing
│   ├── models/                   # Trained model storage
│   │   ├── voice_classifier.pkl  # Pre-trained classical ML model
│   │   └── logs/                 # Training metrics logs
│   └── data/                     # Training data directory
│       ├── real/                 # Human voice recordings (.wav, .mp3, etc.)
│       └── ai_generated/         # AI-generated voice samples
│
└── assets/                       # Static assets
    └── .aistudio/                # AI Studio metadata
```

---

## 5. Frontend Documentation

### 5.1 Entry Points & Configuration

#### `index.html`
- The root HTML document with viewport meta, Open Graph tags, Twitter Card meta
- Preconnects to Google Fonts (Inter + JetBrains Mono)
- Inline SVG favicon (shield icon in gold `#D4A017`)
- Title: "DeepfakeGuard — AI Voice Authenticity Detection"

#### `src/main.tsx`
- Mounts the React app using `createRoot` into `#root` DOM element
- Wraps the app in `StrictMode` for development warnings

#### `vite.config.ts`
- **React plugin**: `@vitejs/plugin-react` for JSX transform and Fast Refresh
- **Tailwind plugin**: `@tailwindcss/vite` for utility CSS
- **Path alias**: `@` → project root (for clean imports)
- **Dev server**: Port `3000`, host `0.0.0.0`
- **API Proxy**: `/api/*` requests are forwarded to `http://localhost:8000` (Python backend)
- **HMR**: Controlled by `DISABLE_HMR` env var (disabled during AI Studio edits)

#### `tsconfig.json`
- Target: ES2022
- Module: ESNext with bundler resolution
- JSX: react-jsx
- Strict: `skipLibCheck`, `isolatedModules`, `noEmit`
- Path alias: `@/*` → `./*`

#### `package.json`
- **Scripts**:
  - `dev` → `vite --port=3000 --host=0.0.0.0`
  - `build` → `vite build`
  - `preview` → `vite preview`
  - `clean` → `rm -rf dist server.js`
  - `lint` → `tsc --noEmit`

---

### 5.2 Routing & Page Architecture

DeepfakeGuard uses **client-side state-based routing** (no React Router). The `App.tsx` component maintains an `activePage` state and conditionally renders pages using `AnimatePresence` for animated transitions.

#### Pages

| Page ID | Component | Description |
|---|---|---|
| `home` | `HomePage.tsx` | Hero section, audio upload zone, sample voice sandbox |
| `features` | `FeaturesPage.tsx` | Technical specs, interactive Real vs AI audio comparison |
| `contact` | `ContactPage.tsx` | Incident reporting form with urgency triage |
| `privacy` | `PrivacyPage.tsx` | Zero-data-retention policy, downloadable PDF |
| `terms` | `TermsPage.tsx` | Terms of service, forensic disclaimers, downloadable PDF |

#### Navigation Flow

```
App.tsx (activePage state)
  │
  ├── Navbar.tsx ──→ handleNavigate(page) ──→ setActivePage()
  ├── Footer.tsx ──→ onNavigate(page)
  └── Page Views ──→ AnimatePresence mode="wait" ──→ motion.div transitions
```

Each page is wrapped in a `motion.div` with:
- `initial={{ opacity: 0, y: 10 }}`
- `animate={{ opacity: 1, y: 0 }}`
- `exit={{ opacity: 0, y: -10 }}`
- `transition={{ duration: 0.25 }}`

---

### 5.3 State Management

All state lives in `App.tsx` using React `useState` and `useEffect` hooks. There is no external state management library.

#### Global State Variables

| State | Type | Description |
|---|---|---|
| `activePage` | `'home' \| 'features' \| 'contact' \| 'privacy' \| 'terms'` | Current view/route |
| `theme` | `'light' \| 'dark'` | Theme mode, persisted to localStorage key `deepfakeguard_theme`, initialized from system preference via `prefers-color-scheme` |
| `isOffline` | `boolean` | Network connectivity state from `navigator.onLine` |
| `externalFile` | `{ name, size, type, sampleType } \| null` | File trigger passed from SampleVoices to UploadZone |
| `onlineRestoredToast` | `boolean` | Triggers "Back Online" toast notification |
| `showSuccessToast` | `boolean` | Triggers "Analysis Complete" toast notification |

#### State Flow

```
SampleVoices ──→ onSelectSample() ──→ setExternalFile() ──→ HomePage
  (Card click)                       (in App.tsx)           (externalAudioTrigger prop)
                                          │
                                          ▼
UploadZone ──→ handleExternalSample() ──→ analyzeAudioClip()
  (useEffect)                             │
                                          ├── 1. Try POST /api/detect (Python backend)
                                          │   └── If 30s timeout or error →
                                          └── 2. Client-side Web Audio analysis
                                                (filename heuristic for samples)
```

#### Network Monitoring

```typescript
// Automatic online/offline detection
window.addEventListener('online', handleOnline);    // → setIsOffline(false)
window.addEventListener('offline', handleOffline);  // → setIsOffline(true)
```

When offline:
- Body gets `is-offline` class → CSS applies desaturation filter (`saturate(0.65)`)
- Analysis falls back to client-side Web Audio engine
- Toast notification appears

---

### 5.4 Design System & Theme

#### CSS Custom Properties (defined in `src/index.css`)

**Light Mode (Default)**
| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#F5F0E8` | Editorial parchment background |
| `--bg-grad-top` | `#F7F2EA` | Radial gradient top |
| `--bg-grad-bot` | `#EDE8DC` | Radial gradient bottom |
| `--text-primary` | `#1A1A1A` | Deep charcoal headings |
| `--text-secondary` | `#4A4A48` | Body text |
| `--text-tertiary` | `#7A7875` | Metadata, sub-labels |
| `--accent-amber` | `#D4A017` | Primary warm gold accent |
| `--accent-green` | `#2D8A4E` | Safe/authentic verdict |
| `--accent-red` | `#C0392B` | Danger/deepfake verdict |
| `--border-color` | `#D9D4C8` | Container borders |
| `--card-bg` | `#FFFFFF` | Card backgrounds |

**Dark Mode**
| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#0B0B0E` | Obsidian dark background |
| `--accent-amber` | `#F1BE38` | Luminous amber |
| `--accent-green` | `#2ECC71` | Bright green safe |
| `--accent-red` | `#EF4444` | Bright red danger |
| `--border-color` | `rgba(255,255,255,0.09)` | Subtle dark borders |
| `--card-bg` | `#121217` | Dark card backgrounds |

#### Noise Grain Overlay

A hardware-accelerated SVG `feTurbulence` noise filter is rendered across the entire viewport at low opacity (`0.025` light / `0.04` dark) via a `.noise-overlay` fixed-position div. This adds texture to prevent sterile flat surfaces.

#### Body Background

Applied as a `radial-gradient` centered at the top, creating a subtle vignette effect. The background is `background-attachment: fixed` for a parallax-free consistent look.

#### Liquid Glass Navbar

The navigation bar uses a sophisticated glassmorphism formula:
- **Background**: Linear gradient with 5-8% white tint (light) or dark glass (dark)
- **Backdrop**: `backdrop-blur: 24px` + `saturate: 190%`
- **Border**: Subtle specular top highlight (1px gradient from transparent → white/80 → transparent)
- **Shadow**: Multi-layer box-shadow with inset highlight for depth
- **Shape**: Full `rounded-full` pill shape
- **Scroll behavior**: Opacity and shadow increase on scroll (`isScrolled` state via `window.scrollY > 30`)

#### Dark/Light Mode Toggle

- Toggle button in Navbar with animated Sun/Moon icon swap (rotate + scale via Motion)
- Syncs `dark` class to `<html>` and `<body>` elements
- Persists to `localStorage` under key `deepfakeguard_theme`
- Initializes from `window.matchMedia('(prefers-color-scheme: dark)')` on first visit

---

### 5.5 Component Reference

#### `Navbar.tsx`
- **Props**: `activePage`, `onNavigate`, `isOffline`, `theme`, `onToggleTheme`
- **Features**: 
  - Desktop: Horizontal pill-shaped nav with 5 tabs (HOME, FEATURES, CONTACT US, PRIVACY POLICY, TERMS OF SERVICE)
  - Active tab indicator: Animated `motion.span` with `layoutId="activeNavUnderline"` for smooth shared layout transitions
  - Mobile: Full-screen overlay with backdrop blur, slide-in animation
  - Live network status badge (green pulsing dot when online, WifiOff icon when offline)
  - Theme toggle button with animated icon rotation
- **Lucide Icons used**: Shield, Menu, X, Wifi, WifiOff, Sun, Moon

#### `HeroSection.tsx`
- **Props**: `onExploreFeatures`
- **Features**:
  - Floating 3D orbs (amber + green) with CSS keyframe animations (`float-orb-1`, `float-orb-2`) — 20-22s infinite ease-in-out loops
  - "AI Powered" badge with shimmer light sweep animation
  - Main heading: "Detect **AI** Based <u>Scam Calls</u>"
  - Stats badges: "1,000+ voice recordings verified" + "Sub-300ms Acoustic Engine"
- **Lucide Icons used**: Sparkles, Zap, ArrowRight

#### `UploadZone.tsx`
- **Props**: `onAnalyzeComplete`, `externalAudioTrigger`, `onClearTrigger`
- **State**: `dragActive`, `selectedFile`, `isAnalyzing`, `progress`, `statusText`, `result`, `showAdvancedForensics`, `exportNotice`
- **Three modes**:
  1. **Upload Mode**: Drag-and-drop zone with file input, accepts `.wav`, `.mp3`, `.m4a`, `.flac`, `.ogg`
  2. **Analyzing Mode**: Animated progress bar, status text, waveform bars animation
  3. **Results Mode**: Full verdict display with:
     - Main verdict card (green/red accent bar based on authenticity)
     - Confidence percentage circle
     - Plain-language advice box (green safe / red danger)
     - 4 acoustic indicator cards: Natural Breathing, Vocal Micro-Jitter, AI Glitch Index, Physical Space Acoustics
     - Interactive waveform visualization (44 bars, red highlights for anomalous regions)
     - PDF export button, JSON export button, "Analyze Another" reset button
     - Expandable advanced forensics panel (spectral, pitch, formant, acoustic metrics)
- **File validation**: MIME type check + extension whitelist
- **Max file size**: 50 MB (frontend) / 25 MB (backend)
- **Lucide Icons used**: Upload, FileAudio, CheckCircle2, AlertTriangle, Download, FileText, RotateCcw, Sparkles, ChevronDown, ChevronUp, Volume2, ShieldCheck, ShieldAlert, HelpCircle, Activity

#### `SampleVoices.tsx`
- **Props**: `onSelectSample`
- **State**: `playingSampleId`, `activeStopFn`
- **Four sample voice profiles**:
  1. **CEO Earnings Call** (`ceo`) — Authentic vocal, 1.84 MB
  2. **Family Member Voice** (`family`) — Authentic vocal, 1.42 MB
  3. **Bank Representative** (`bank`) — Scam audio clone, 1.65 MB
  4. **AI Generated Clone** (`clone`) — Neural synthesis, 1.98 MB
- **Features**:
  - Play/Stop audio preview using Web Audio synthesis
  - Click card to trigger analysis in UploadZone (scrolls to upload zone)
  - Green/red color coding for authentic vs fake samples
- **Lucide Icons used**: Briefcase, Users, Landmark, Bot, Play, Square, Sparkles

#### `ContributeModelBox.tsx`
- **Features**: 
  - Floating bottom-right widget (fixed positioning, z-40)
  - Collapsed: Pill button "Help Improve the AI Model" with SHARE badge
  - Expanded: Form with sample classification (Scam Call / AI Clone / Real Voice), file upload, optional note textarea, consent checkbox
  - Submission shows thank-you confirmation
- **Purpose**: Allow users to voluntarily donate anonymized audio samples for open-source AI defense training

#### `Footer.tsx`
- **Props**: `onNavigate`
- **Features**:
  - Brand logo and name
  - Zero-retention security note
  - Navigation links (Home, Features, Contact, Privacy, Terms)
  - Copyright: "© 2026 DeepfakeGuard AI Defense Systems"

#### `Toasts.tsx`
- **Props**: `showSuccessToast`, `onDismissSuccess`, `isOffline`, `onlineRestoredToast`
- **Features**:
  - Two toast types: offline notification (gray) and success notification (green)
  - Auto-dismiss with shrinking progress bar (5s timer, 40ms update interval)
  - Slide-in-from-right animation
  - Fixed bottom-right positioning (z-50)

---

### 5.6 Utility Modules

#### `audioEngine.ts` — The Core Analysis Engine

This is the most critical frontend file. It provides:

**1. `AnalysisResult` Interface** — The data contract for all analysis results:

```typescript
interface AnalysisResult {
  isAuthentic: boolean;
  confidence: number;
  label: string;
  summary: string;
  riskLevel: 'LOW_RISK_SAFE' | 'MEDIUM_SUSPICIOUS' | 'CRITICAL_SCAM_ALERT';
  riskTitle: string;
  plainAdvice: string;
  humanBreathScore: number;       // 0-100
  vocalTremorScore: number;       // 0-100
  robotGlitchScore: number;       // 0-100
  roomAcousticScore: number;      // 0-100
  spectralArtifactsScore: number;
  pitchConsistencyScore: number;
  formantJitterScore: number;
  acousticCoherenceScore: number;
  duration: number;
  sampleRate: number;
  detectedAnomalies: string[];
  forensicTimestamps: { time: number; label: string; severity: 'low' | 'medium' | 'high' }[];
  waveformBars: number[];
}
```

**2. `playSynthesizedVoiceSample(type, onEnded)`** — Client-side voice synthesis using Web Audio API:

| Type | Oscillator | Fundamental | Formants | Effect |
|---|---|---|---|---|
| `ceo` | Sawtooth | 115 Hz (dynamic 109-124 Hz) | Double bandpass: F1=500Hz Q=4, F2=1500Hz Q=5 | Deep authoritative male voice |
| `family` | Triangle | 195 Hz (dynamic ±15%) | Lowpass at 1800 Hz | Warm natural tone |
| `bank` | Square | 140 Hz (abrupt steps) | Bandpass at 1000Hz Q=1.8 | Telecom narrowband |
| `clone` | Dual: Sawtooth 160Hz + Square 320Hz | Randomized step quantization | Peaking comb at 2400Hz +8dB | Metallic vocoder distortion |

All synthesized sounds use a master gain envelope with 0.1s fade-in and 0.3s fade-out over a 4.5s duration.

**3. `extractWaveformFromAudio(fileOrBuffer, barCount=44)`** — Extracts normalized waveform visualization bars:
- Decodes audio via `AudioContext.decodeAudioData()`
- Splits channel data into `barCount` blocks
- Computes RMS amplitude per block
- Normalizes to range `[0.18, 0.95]`
- Falls back to `generateFallbackWaveform()` on decode failure

**4. `analyzeAudioClip(file, onProgress)`** — The main analysis function:

```
Step 1: Progress updates (15% → 42% → 68%) with simulated delays
Step 2: Attempt Python backend via POST /api/detect
  - Sends FormData with field "audio" containing the File
  - 30-second AbortController timeout
  - Maps backend response fields to AnalysisResult:
    - data.isAuthentic → isAuthentic
    - data.metrics.spectral_centroid → spectralArtifactsScore
    - data.metrics.pitch_anomaly → pitchConsistencyScore
    - data.metrics.mfcc_variance → formantJitterScore
    - data.metrics.rms_energy → acousticCoherenceScore
Step 3: If backend unavailable → Client-side forensic engine
  - Uses filename heuristics and sampleType for classification
  - "clone", "deepfake", "scam", "fake" in filename → isAuthentic=false
  - Otherwise → isAuthentic=true
  - Generates waveform bars from actual audio or fallback
```

**5. `generateFallbackWaveform(barCount, seed)`** — Deterministic pseudo-random waveform using sine/cosine functions.

#### `pdfExport.ts` — Forensic PDF Report Generator

Uses `jsPDF` to create vector-drawn A4 documents:

**Document sections** (top to bottom):
1. **Header banner**: Dark background, "DeepfakeGuard" branding, timestamp, case ID (random `DFG-XXXXXXX`)
2. **Verdict card**: Green/red accent strip, authenticity verdict in large text, confidence score, risk level
3. **Audio evidence box**: Filename, duration, sample rate, file size
4. **Plain-language summary**: Human-readable explanation
5. **Acoustic indicators**: 4-column card grid (Natural Breath, Pitch Jitter, AI Glitch Index, Room Acoustics)
6. **Actionable advice**: Green/red colored box with safety recommendations
7. **Key observations**: Bullet list of detected anomalies
8. **Footer disclaimer**: "Zero Data Retention Policy"

**Color palette used in PDF**:
- Parchment: `[245, 240, 232]` (#F5F0E8)
- Dark: `[26, 26, 26]` (#1A1A1A)
- Amber: `[212, 160, 23]` (#D4A017)
- Green: `[45, 138, 78]` (#2D8A4E)
- Red: `[192, 57, 43]` (#C0392B)

---

### 5.7 Animation System

All animations use the **Motion** library (`motion/react`, formerly Framer Motion).

#### Standard Transition Curves

```typescript
springTransition = { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
tabViewVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
}
```

#### CSS Keyframe Animations (defined in `index.css`)

| Animation | Duration | Description |
|---|---|---|
| `float-orb-1` | 20s infinite | Floating ambient orb movement |
| `float-orb-2` | 22s infinite (delay -8s) | Second floating orb |
| `float-icon` | 3s infinite | Subtle icon bob |
| `shimmer-sweep` | 4s infinite | Light sweep across badge |
| `pulse-dot` | 2s infinite | Green pulsing online indicator |
| `pop-spring` | 0.45s | Scale-in spring animation |

---

## 6. Backend Documentation

### 6.1 FastAPI Server (`main.py`)

The backend server runs on **port 8000** using Uvicorn.

#### Server Configuration

```python
app = FastAPI(
    title="DeepfakeGuard - Voice Detection API",
    version="3.1.0"
)

# CORS — Allow all origins (development mode)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### Startup Behavior

1. Prints startup banner
2. Loads the Wav2Vec2 model from Hugging Face: `garystafford/wav2vec2-deepfake-voice-detector`
3. Loads the corresponding `AutoFeatureExtractor`
4. Model and feature extractor are stored as module-level globals
5. If loading fails, `model = None` and endpoints return HTTP 503

#### Response Models (Pydantic)

```python
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
    isAuthentic: bool          # Inverse of is_ai (for frontend compatibility)
    confidence: float
    metrics: DetectionMetrics
    filename: str
    duration_seconds: float
    model_used: str
```

#### Audio Processing Pipeline

1. **File validation**: Check MIME type + extension against whitelist, enforce 25 MB max, reject empty files (<100 bytes)
2. **Temp file**: Write uploaded bytes to a temporary file with original extension
3. **Load audio**: `librosa.load(path, sr=16000, mono=True)` — resamples to 16kHz mono
4. **Feature extraction**: `feature_extractor(audio, sampling_rate=16000, return_tensors="pt", padding=True)`
5. **Inference**: `model(**inputs)` → `torch.softmax(outputs.logits, dim=-1)`
6. **Classification**: `is_ai = probs[0, 1].item() > 0.5` (index 1 = AI class)
7. **Confidence**: `max(probs[0]).item() * 100` (percentage)
8. **Acoustic metrics**: Computed via librosa (see section 6.2)
9. **Cleanup**: Temporary file deleted in `finally` block

---

### 6.2 ML Model — Wav2Vec2 Deepfake Detector

#### Model Identity

- **Hugging Face ID**: `garystafford/wav2vec2-deepfake-voice-detector`
- **Type**: `AutoModelForAudioClassification`
- **Architecture**: Wav2Vec2 base model + classification head (2 classes: real/fake)
- **Expected accuracy**: 95%+
- **Input**: Raw audio waveform at 16kHz, mono
- **Output**: Logits tensor → softmax → probability distribution over [real, fake]

#### Acoustic Metrics Calculated by Librosa

| Metric | Librosa Function | Description |
|---|---|---|
| `pitch_anomaly` | `librosa.piptrack()` → `std(pitches) / 100` | Pitch stability deviation (lower = more natural) |
| `spectral_centroid` | `librosa.feature.spectral_centroid()` | Weighted mean frequency (brightness of sound) |
| `mfcc_variance` | `librosa.feature.mfcc(n_mfcc=13)` → `var()` | MFCC coefficient variance (timbral variation) |
| `zero_crossing_rate` | `librosa.feature.zero_crossing_rate()` | How often signal crosses zero (percussive content) |
| `spectral_rolloff` | `librosa.feature.spectral_rolloff()` | Frequency below which 85% energy is concentrated |
| `spectral_bandwidth` | `librosa.feature.spectral_bandwidth()` | Width of spectral band (frequency spread) |
| `rms_energy` | `librosa.feature.rms()` | Root mean square energy (loudness) |

---

### 6.3 Training Script — Classical ML (`train_model.py`)

A standalone training pipeline for classical machine learning classifiers.

#### Usage

```bash
python train_model.py --data_dir ./data --output ./models/voice_classifier.pkl
```

#### Feature Extraction (130 dimensions)

| Feature Group | Dimensions | Description |
|---|---|---|
| MFCCs (mean, std, delta_mean, delta_std) | 80 | 20 coefficients × 4 statistics |
| Spectral centroid, rolloff, bandwidth, contrast, flatness | 10 | 5 features × 2 statistics |
| Zero crossing rate, RMS energy | 4 | 2 features × 2 statistics |
| Pitch mean, std | 2 | Fundamental frequency statistics |
| Chroma STFT | 24 | 12 bins × 2 statistics |
| Onset strength | 2 | Mean and standard deviation |
| Spectral contrast (per band) | 7 | 7 frequency bands |
| **Total** | **~129** | |

#### Training Process

1. **Dataset loading**: Reads from `data/real/` (label=0) and `data/ai_generated/` (label=1)
2. **Feature extraction**: 130-dim vector per audio file via librosa
3. **Dataset balancing**: Augments minority class with Gaussian noise at multiple scales
4. **Feature augmentation**: If <200 samples, adds Gaussian noise (3× dataset size)
5. **Scaling**: `StandardScaler` normalization
6. **Train/test split**: 80/20 stratified split

#### Models Trained

| Model | Algorithm | Key Parameters |
|---|---|---|
| RandomForest | `RandomForestClassifier` | n_estimators=300, n_jobs=-1 |
| GradientBoosting | `GradientBoostingClassifier` | n_estimators=200, max_depth=5, lr=0.1 |
| SVM-RBF | `SVC(kernel='rbf')` | C=10, gamma='scale', probability=True |
| XGBoost (optional) | `XGBClassifier` | n_estimators=300, max_depth=6, lr=0.05 |
| **Ensemble** | `VotingClassifier(soft)` | Top-2 models combined |

#### Output

- **Model file**: `models/voice_classifier.pkl` (pickle format, contains model + scaler + metadata)
- **Metrics JSON**: `models/logs/metrics_YYYYMMDD_HHMMSS.json` (accuracy, F1, precision, recall, CV scores)

---

### 6.4 Training Script — Transformer Fine-Tuning (`train_wav2vec2.py`)

Fine-tunes the pre-trained Wav2Vec2 model on custom audio data.

#### Usage

```bash
python train_wav2vec2.py --data_dir ./data --output ./models/wav2vec2_model --epochs 3 --batch_size 4
```

#### Configuration

| Parameter | Default | Description |
|---|---|---|
| `MODEL_NAME` | `garystafford/wav2vec2-deepfake-voice-detector` | Base Hugging Face model |
| `SAMPLE_RATE` | 16000 | Audio sample rate |
| `MAX_DURATION` | 4 seconds | Max audio length (pad/truncate) |
| `--epochs` | 3 | Training epochs |
| `--batch_size` | 4 | Batch size (small for CPU) |
| `--learning_rate` | 3e-5 | Learning rate |

#### Training Pipeline

1. Load audio files from `data/real/` and `data/ai_generated/`
2. Split into 80/20 train/validation (stratified)
3. Preprocess: librosa load → pad/truncate to 4s → feature_extractor
4. Load pre-trained Wav2Vec2 model with 2 labels (real=0, fake=1)
5. Train with HuggingFace `Trainer` API:
   - Early stopping (patience=3)
   - Evaluation per epoch
   - Save best model
6. Save model + feature extractor to output directory
7. Save evaluation metrics to `metrics.json`

#### Additional Dependencies

```python
from datasets import Dataset
from transformers import TrainingArguments, Trainer, EarlyStoppingCallback
```

---

### 6.5 Model Verification (`verify_model.py`)

A testing script that proves the backend returns real, meaningful predictions — not random answers.

#### Usage

```bash
python verify_model.py [--url http://localhost:8000]
```

#### Tests Performed

1. **Health check**: Verifies backend is alive and model is loaded
2. **Pure sine wave** (440Hz, 3s): Artificial robotic tone — tests AI detection
3. **White noise** (3s): Random signal with no structure
4. **Multi-harmonic tone** (3s): Voice-like harmonics with randomness
5. **Near-silence** (3s): Very low amplitude noise
6. **Consistency test**: Same sine wave sent 5 times — verifies results are consistent (not random)

#### Verification Criteria

- **Consistency**: Same input → same output (confidence std dev < 5%)
- **Differentiation**: Different audio types → different metric values
- **Metric variation**: pitch_anomaly, spectral_centroid, mfcc_variance differ meaningfully across inputs

---

### 6.6 Backend API Reference

#### `GET /`

Returns server information.

**Response**:
```json
{
  "name": "DeepfakeGuard - Voice Detection API",
  "version": "3.1.0",
  "status": "running",
  "model_loaded": true,
  "model_name": "garystafford/wav2vec2-deepfake-voice-detector"
}
```

#### `GET /health`

Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_name": "garystafford/wav2vec2-deepfake-voice-detector",
  "model_accuracy": "95%+"
}
```

#### `POST /api/detect`

Primary endpoint used by the frontend. Accepts the `audio` form field name.

**Request**: `multipart/form-data`
- Field name: `audio` (via `alias="audio"` in FastAPI `File()`)
- Content: Binary audio file (`.wav`, `.mp3`, `.m4a`, `.flac`, `.ogg`, `.aac`)
- Max size: 25 MB

**Response** (200 OK):
```json
{
  "is_ai": false,
  "isAuthentic": true,
  "confidence": 52.4,
  "metrics": {
    "pitch_anomaly": 0.0003,
    "spectral_centroid": 446.57,
    "mfcc_variance": 18.67,
    "zero_crossing_rate": 0.0891,
    "spectral_rolloff": 1245.32,
    "spectral_bandwidth": 892.15,
    "rms_energy": 0.0214
  },
  "filename": "recording.wav",
  "duration_seconds": 4.2,
  "model_used": "Wav2Vec2 Deepfake Detector"
}
```

**Error Responses**:
- `400`: Unsupported format, file too large, or file too small
- `422`: Invalid request (missing file)
- `503`: Model not loaded
- `500`: Analysis failed

#### `POST /api/v1/detect`

Legacy endpoint. Same as `/api/detect` but accepts the `file` form field name instead of `audio`.

---

## 7. Frontend-Backend Integration

### 7.1 Data Flow Pipeline

```
User drops .wav file
        │
        ▼
UploadZone.processFile()
        │
        ▼
analyzeAudioClip(file, onProgress)
        │
        ├──► Progress: 15% "Reading acoustic stream..."
        ├──► Progress: 42% "Analyzing Wav2Vec2 representations..."
        ├──► Progress: 68% "Measuring vocal cord tremors..."
        │
        ▼
  ┌─────────────────────────────┐
  │ Try POST /api/detect        │
  │ FormData: { audio: file }   │
  │ Timeout: 30 seconds         │
  └─────────┬───────────────────┘
            │
     ┌──────┴──────┐
     │ Success?     │
     ├─── YES ─────► Map backend fields → AnalysisResult
     │              isAuthentic ← data.isAuthentic
     │              spectralArtifactsScore ← data.metrics.spectral_centroid / 50
     │              pitchConsistencyScore ← 100 - (data.metrics.pitch_anomaly * 500)
     │              formantJitterScore ← data.metrics.mfcc_variance / 10
     │              acousticCoherenceScore ← data.metrics.rms_energy * 500
     │              Return AnalysisResult
     │
     └─── NO ─────► Client-side Web Audio fallback
                    (filename heuristics for sample voices)
```

### 7.2 API Request/Response Contract

#### Request

```
POST /api/detect HTTP/1.1
Content-Type: multipart/form-data; boundary=----FormBoundary

------FormBoundary
Content-Disposition: form-data; name="audio"; filename="recording.wav"
Content-Type: audio/wav

<binary audio data>
------FormBoundary--
```

#### Response Mapping

| Backend Field | Frontend Field | Transformation |
|---|---|---|
| `data.isAuthentic` | `result.isAuthentic` | Direct |
| `data.confidence` | `result.confidence` | Direct |
| `data.duration_seconds` | `result.duration` | Direct |
| `data.metrics.spectral_centroid` | `result.spectralArtifactsScore` | `min(100, value / 50)` |
| `data.metrics.pitch_anomaly` | `result.pitchConsistencyScore` | `max(0, 100 - value * 500)` |
| `data.metrics.mfcc_variance` | `result.formantJitterScore` | `min(100, value / 10)` |
| `data.metrics.rms_energy` | `result.acousticCoherenceScore` | `min(100, value * 500)` |
| `data.isAuthentic` (true) | `result.humanBreathScore` | Hardcoded: 94 |
| `data.isAuthentic` (true) | `result.vocalTremorScore` | Hardcoded: 96 |
| `data.isAuthentic` (false) | `result.robotGlitchScore` | Hardcoded: 94 |
| `data.isAuthentic` (false) | `result.roomAcousticScore` | Hardcoded: 28 |

### 7.3 Vite Proxy Configuration

In `vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
},
```

This means:
- Frontend runs on `localhost:3000`
- Any request to `localhost:3000/api/*` is transparently forwarded to `localhost:8000/api/*`
- The frontend code uses `const pythonBackendUrl = '/api/detect'` (relative URL)
- No CORS issues in development (proxy handles it)

### 7.4 Fallback Behavior

When the Python backend is unavailable (offline, not started, timeout):

1. The `fetch()` call throws an error or the AbortController fires after 30s
2. The `catch` block silently catches the error
3. The code falls through to client-side analysis
4. Client-side uses **filename heuristics**:
   - Files containing "clone", "deepfake", "scam", "fake" → `isAuthentic = false`
   - Sample voices with `sampleType: 'clone'` or `'bank'` → `isAuthentic = false`
   - Sample voices with `sampleType: 'ceo'` or `'family'` → `isAuthentic = true`
   - All other files → `isAuthentic = true` (safe default)

---

## 8. Hugging Face Model Details

### Model: `garystafford/wav2vec2-deepfake-voice-detector`

- **Architecture**: Wav2Vec2ForSequenceClassification
  - Base: Wav2Vec2 (self-supervised speech representation model by Facebook/Meta AI)
  - Head: Linear classification layer (2 output classes)
- **Training data**: Real human voices vs AI-generated deepfake voices
- **Expected accuracy**: 95%+
- **Input processing**: Raw waveform → Wav2Vec2 feature extractor → model inference
- **Output**: Logits → softmax → [P(real), P(fake)]
- **Classification threshold**: `is_ai = P(fake) > 0.5`

### How Wav2Vec2 Works

1. **Self-supervised pre-training**: Wav2Vec2 learns speech representations by masking parts of the audio and predicting them (similar to BERT for text)
2. **Fine-tuning for deepfake detection**: The pre-trained model is fine-tuned on a binary classification task (real vs fake)
3. **Key insight**: AI-generated voices have subtle artifacts (phase discontinuities, unnatural pitch quantization, missing breathing) that Wav2Vec2's latent representations can capture

### Librosa Feature Extraction

The backend also computes interpretable acoustic features using Librosa:

| Feature | What It Measures | Why It Matters |
|---|---|---|
| **Pitch anomaly** | Standard deviation of fundamental frequency / 100 | Real voices have natural micro-variations; AI voices are often too stable |
| **Spectral centroid** | Weighted mean frequency | Indicates "brightness" — AI voices may have unnatural spectral distribution |
| **MFCC variance** | Variance of mel-frequency cepstral coefficients | Captures timbral variation — AI voices often have lower MFCC variance |
| **Zero crossing rate** | Rate of sign changes in signal | Related to percussive/noisy content |
| **Spectral rolloff** | Frequency below which 85% energy concentrated | AI voices may have unnatural high-frequency cutoff |
| **Spectral bandwidth** | Width of spectral distribution | Measures frequency spread |
| **RMS energy** | Root mean square amplitude | Overall loudness/energy level |

---

## 9. Design System Reference

### Color Palette Complete Reference

#### Light Mode
| Name | Hex | RGB | Usage |
|---|---|---|---|
| Editorial Parchment | `#F5F0E8` | (245, 240, 232) | Page background |
| White | `#FFFFFF` | (255, 255, 255) | Card backgrounds |
| Deep Charcoal | `#1A1A1A` | (26, 26, 26) | Primary text, dark buttons |
| Body Text | `#4A4A48` | (74, 74, 72) | Secondary text |
| Muted | `#7A7875` | (122, 120, 117) | Tertiary text, labels |
| Warm Gold | `#D4A017` | (212, 160, 23) | Primary accent, CTAs |
| Gold Hover | `#B8860B` | (184, 134, 11) | Button hover state |
| Forest Green | `#2D8A4E` | (45, 138, 78) | Safe/authentic verdict |
| Deep Crimson | `#C0392B` | (192, 57, 43) | Danger/deepfake verdict |
| Border | `#D9D4C8` | (217, 212, 200) | Card borders |
| Surface Secondary | `#FAF6EE` | (250, 246, 238) | Inner wells, badges |
| Selection | `#F6E2AF` | (246, 226, 175) | Text selection highlight |

#### Dark Mode
| Name | Hex | RGB | Usage |
|---|---|---|---|
| Obsidian Base | `#0B0B0E` | (11, 11, 14) | Page background |
| Dark Card | `#121217` | (18, 18, 23) | Card backgrounds |
| Dark Surface | `#131319` | (19, 19, 25) | Container borders |
| Pure White | `#FFFFFF` | (255, 255, 255) | Primary text |
| Light Secondary | `#C8C5BD` | (200, 197, 189) | Body text |
| Muted Dark | `#84817A` | (132, 129, 122) | Tertiary text |
| Luminous Amber | `#F1BE38` | (241, 190, 56) | Primary accent |
| Amber Hover | `#FFD25E` | (255, 210, 94) | Button hover |
| Bright Green | `#2ECC71` | (46, 204, 113) | Safe verdict |
| Neon Green | `#3DE884` | (61, 232, 132) | Green text in dark |
| Bright Red | `#EF4444` | (239, 68, 68) | Danger verdict |
| Light Red | `#F87171` | (248, 113, 113) | Red text in dark |

### Typography

| Element | Font | Size | Weight | Tracking |
|---|---|---|---|---|
| Main Heading | Inter | 4xl-5xl (36-48px) | extrabold (800) | -0.03em |
| Section Heading | Inter | 2xl (24px) | bold (700) | tight |
| Card Title | Inter | lg (18px) | bold (700) | normal |
| Body Text | Inter | sm-base (14-16px) | normal (400) | normal |
| Label/Badge | Inter | xs (12px) | bold (700) | wide (0.08em) |
| Technical Data | JetBrains Mono | xs (12px) | medium (500) | normal |
| Micro Label | Inter | 11px | bold (700) | wider |

### Spacing & Layout

- **Max width**: `max-w-5xl` (main content), `max-w-4xl` (upload zone), `max-w-6xl` (features)
- **Page padding**: `px-4` (16px horizontal)
- **Top padding for main**: `pt-24 sm:pt-28` (96px / 112px, accounting for fixed navbar)
- **Border radius**: `rounded-3xl` (24px) for cards, `rounded-2xl` (16px) for inner elements, `rounded-full` for pills/badges
- **Gap**: `gap-3` to `gap-6` depending on context

---

## 10. Scripts & Commands

### Frontend

```bash
# Install dependencies
npm install

# Start development server (port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check (no emit)
npm run lint          # runs: tsc --noEmit

# Clean build artifacts
npm run clean         # runs: rm -rf dist server.js
```

### Backend

```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Start the backend server (port 8000)
cd backend && python main.py

# Test health endpoint
curl http://localhost:8000/health

# Test detection endpoint
curl -X POST http://localhost:8000/api/detect \
  -F "audio=@recording.wav"

# Run model verification
cd backend && python verify_model.py

# Train classical ML model
cd backend && python train_model.py \
  --data_dir ./data \
  --output ./models/voice_classifier.pkl

# Fine-tune Wav2Vec2 model
cd backend && python train_wav2vec2.py \
  --data_dir ./data \
  --output ./models/wav2vec2_model \
  --epochs 3 \
  --batch_size 4
```

### Full Stack (Two Terminals)

```bash
# Terminal 1 — Python Backend
cd backend
pip install -r requirements.txt
python main.py
# → Server starts on http://localhost:8000

# Terminal 2 — React Frontend
npm install
npm run dev
# → Frontend starts on http://localhost:3000
# → /api/* requests proxied to localhost:8000
```

---

## 11. Setup & Deployment Guide

### Prerequisites

- **Node.js** >= 18 (for Vite + React)
- **Python** >= 3.9 (for FastAPI + PyTorch)
- **pip** (Python package manager)

### First-Time Setup

1. **Clone/install frontend**:
   ```bash
   npm install
   ```

2. **Install backend dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```
   Note: `torch` download is ~2GB. First run may take several minutes.

3. **Start backend** (Terminal 1):
   ```bash
   cd backend && python main.py
   ```
   On first run, the Wav2Vec2 model (~1.2GB) is downloaded from Hugging Face and cached.

4. **Start frontend** (Terminal 2):
   ```bash
   npm run dev
   ```

5. **Open browser**: `http://localhost:3000`

### Training Your Own Model

1. **Prepare data**: Place human voice recordings in `backend/data/real/` and AI-generated voices in `backend/data/ai_generated/`
2. **Train classical ML** (fast, good for small datasets):
   ```bash
   cd backend && python train_model.py
   ```
3. **Fine-tune Wav2Vec2** (slow on CPU, recommended on GPU):
   ```bash
   cd backend && python train_wav2vec2.py --epochs 5
   ```
4. **Verify model**:
   ```bash
   cd backend && python verify_model.py
   ```

### Production Deployment

For production:
1. Build frontend: `npm run build` → outputs to `dist/`
2. Serve `dist/` with Nginx or similar
3. Configure Nginx to proxy `/api/*` to the Python backend
4. Run backend with: `uvicorn main:app --host 0.0.0.0 --port 8000`
5. Consider using a process manager (systemd, supervisor, pm2) for the backend

---

## 12. File-by-File Reference

### Frontend Files

| File | Lines | Purpose | Key Dependencies |
|---|---|---|---|
| `index.html` | 38 | Entry HTML, SEO meta, font imports, favicon | Google Fonts (Inter, JetBrains Mono) |
| `src/main.tsx` | 8 | React root mount | react, react-dom |
| `src/App.tsx` | 165 | Global state, routing, theme management | react, motion/react, all pages & components |
| `src/index.css` | 180+ | Global styles, CSS vars, noise overlay, animations | tailwindcss |
| `src/components/Navbar.tsx` | 230+ | Glass navigation bar, mobile menu | react, lucide-react, motion/react |
| `src/components/HeroSection.tsx` | 90+ | Editorial hero with floating orbs | lucide-react |
| `src/components/UploadZone.tsx` | 500+ | Core upload, analysis display, PDF/JSON export | lucide-react, motion/react, audioEngine, pdfExport |
| `src/components/SampleVoices.tsx` | 130+ | Voice sample sandbox | lucide-react, audioEngine.playSynthesizedVoiceSample |
| `src/components/ContributeModelBox.tsx` | 180+ | Floating contribution widget | react, lucide-react, motion/react |
| `src/components/Footer.tsx` | 70+ | Footer with links | lucide-react |
| `src/components/Toasts.tsx` | 90+ | Toast notification system | lucide-react |
| `src/pages/HomePage.tsx` | 40+ | Home page composition | HeroSection, UploadZone, SampleVoices |
| `src/pages/FeaturesPage.tsx` | 200+ | Features page with audio comparison | lucide-react, motion/react, audioEngine |
| `src/pages/ContactPage.tsx` | 250+ | Contact/incident form | lucide-react, motion/react |
| `src/pages/PrivacyPage.tsx` | 170+ | Privacy policy + PDF export | lucide-react, motion/react, jspdf |
| `src/pages/TermsPage.tsx` | 160+ | Terms of service + PDF export | lucide-react, motion/react, jspdf |
| `src/utils/audioEngine.ts` | 280+ | Web Audio synthesis, analysis, API call | Web Audio API, audioEngine types |
| `src/utils/pdfExport.ts` | 200+ | Forensic PDF report generator | jspdf |

### Backend Files

| File | Lines | Purpose | Key Dependencies |
|---|---|---|---|
| `backend/main.py` | 190+ | FastAPI server, Wav2Vec2 inference, acoustic metrics | fastapi, uvicorn, torch, transformers, librosa |
| `backend/requirements.txt` | 16 | Python dependency manifest | All backend packages |
| `backend/train_model.py` | 350+ | Classical ML training pipeline | librosa, sklearn, xgboost |
| `backend/train_wav2vec2.py` | 170+ | Wav2Vec2 fine-tuning script | transformers, datasets, torch |
| `backend/verify_model.py` | 220+ | Model verification & consistency testing | urllib, json, struct |
| `backend/models/voice_classifier.pkl` | — | Pre-trained classical ML model (binary) | pickle |
| `backend/data/real/` | — | Human voice training data directory | — |
| `backend/data/ai_generated/` | — | AI voice training data directory | — |

### Configuration Files

| File | Purpose |
|---|---|
| `package.json` | NPM dependencies, scripts |
| `vite.config.ts` | Vite build config, React + Tailwind plugins, API proxy |
| `tsconfig.json` | TypeScript compiler options |
| `.env.example` | Template for GEMINI_API_KEY, APP_URL |
| `.gitignore` | Git ignore rules |
| `metadata.json` | AI Studio manifest (permissions, capabilities) |
| `blueprint.md` | Detailed architectural blueprint |

---

*Document generated for DeepfakeGuard — AI Voice Authenticity Detection Platform*
*Last updated: August 2026*
