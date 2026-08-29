# DeepfakeGuard — Complete Technical Architecture & Frontend Blueprint

> **Document Version:** 2.0.0  
> **Target Runtime:** React 19 (TypeScript) • Vite 6 • Tailwind CSS v4 • Web Audio API • jsPDF • Motion Engine  
> **Status:** Production Architecture Blueprint  
> **Classification:** Comprehensive Technical Documentation & Design Specification

---

## 1. Executive Summary & Core Philosophy

**DeepfakeGuard** is an engineering-grade, human-centric acoustic forensics platform designed to detect and neutralize synthetic AI voice clones, deepfake audio impersonations, and telecom fraud.

The platform bridges the gap between deep academic forensic science (e.g. Wav2Vec2 representations, vocoder phase anomalies, harmonic jitter) and immediate human safety (e.g. emergency wire transfer protection, elderly scam defense, corporate executive verification).

### Key Architectural Pillars
1. **Zero Data Retention by Design:** Audio files are decoded in volatile browser memory (`AudioBuffer`) or securely streamed to ephemeral memory buffers. No persistent storage, audio harvesting, or biometric database logging is permitted.
2. **Dual-Tier Forensic Telemetry:**
   - **Tier 1 (Plain-Language Verdict):** High-contrast, unambiguous risk statuses (`Safe Human Voice`, `Critical Scam Alert`) paired with concrete, actionable advice.
   - **Tier 2 (Engineering & Forensics):** Quantitative metrics including Natural Breath Rhythm, Vocal Cord Jitter, Robotic Flaw Index, and 3D Room Acoustics, plus frequency anomaly timestamps.
3. **Zero-Dependency Local Simulation:** Features a built-in Web Audio synthesis engine capable of reproducing physical vocal cord formants, room reverberations, and vocoder glitches client-side without requiring cloud servers.
4. **Instant Forensic PDF Export:** Generates standardized, timestamped audit reports via `jsPDF` for compliance, incident reporting, and law enforcement escalation.

---

## 2. Technology Stack & Runtime Environment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DeepfakeGuard Client Architecture                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  UI Framework         │ React 19.0.1 + TypeScript ~5.8.2                    │
│  Build Tooling        │ Vite 6.2.3 + @vitejs/plugin-react                   │
│  Styling Engine       │ Tailwind CSS v4.1.14 (@tailwindcss/vite)            │
│  Animation Pipeline   │ Motion 12.23.24 (`motion/react`) + CSS3 Keyframes   │
│  Audio Processing     │ Web Audio API (AudioContext, BiquadFilter, Decode)  │
│  Document Generation  │ jsPDF 4.2.1 (Vector-drawn A4 forensic PDF audits)   │
│  Iconography          │ Lucide React 0.546.0                                │
│  Server Fallback      │ Optional Python FastAPI / PyTorch (`/api/detect`)   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Dependency Breakdown (`package.json`)
- **`motion` (`motion/react`)**: Powers physical spring transitions, layout animations, exit animations, and collapsible telemetry panels.
- **`jspdf`**: Generates vector-rendered A4 forensic PDF reports with embedded color themes, risk badges, and timestamp IDs.
- **`lucide-react`**: Vector icons for security badges, audio waveforms, volume meters, upload controls, and warning indicators.
- **`@tailwindcss/vite`**: Direct Vite integration of Tailwind CSS v4 without legacy PostCSS overhead.

---

## 3. Directory Structure & File Map

```
/
├── index.html                     # Entry HTML with SEO meta tags & font imports
├── metadata.json                  # AI Studio manifest (Permissions & capabilities)
├── package.json                   # Project manifest, scripts & dependencies
├── vite.config.ts                 # Vite 6 config with React & Tailwind plugins
├── blueprint.md                   # Complete architectural specification (This document)
├── README.md                      # Deployment guide & Python backend instructions
└── src/
    ├── main.tsx                   # React root entry point
    ├── App.tsx                    # Top-level state coordinator, router & theme manager
    ├── index.css                  # Global styles, noise overlay, animations & dark theme
    ├── components/
    │   ├── Navbar.tsx             # 5-6% Liquid glass navbar with live network sync
    │   ├── HeroSection.tsx        # Editorial display header & security statistics
    │   ├── UploadZone.tsx         # Primary forensic audio analyzer & telemetry dashboard
    │   ├── SampleVoices.tsx       # Interactive voice sandbox with Web Audio synthesis
    │   ├── ContributeModelBox.tsx # Floating dataset contribution modal
    │   ├── Footer.tsx             # Security charter, legal links & zero-retention seal
    │   └── Toasts.tsx             # Motion-animated notification toast stack
    ├── pages/
    │   ├── HomePage.tsx           # Home scanner, sandbox & interactive comparison CTA
    │   ├── FeaturesPage.tsx       # Live Acoustic Comparison Studio & pipeline cards
    │   ├── ContactPage.tsx        # Incident reporting & urgent triage ticketing form
    │   ├── PrivacyPage.tsx        # Zero data retention policy & downloadable PDF charter
    │   └── TermsPage.tsx          # Forensic evidentiary charter & service terms
    └── utils/
        ├── audioEngine.ts         # Web Audio decoding, synthesis & acoustic analysis
        └── pdfExport.ts           # jsPDF forensic audit document generation engine
```

---

## 4. Design System & Visual Language

DeepfakeGuard implements a high-contrast **Warm Editorial & Obsidian Dark Mode** aesthetic, rejecting generic AI templates in favor of mathematically disciplined spacing and deliberate optical hierarchy.

### 4.1 Color Palette Specifications

| Semantic Token | Light Mode Hex | Dark Mode Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#F5F0E8` (Editorial Parchment) | `#0B0B0E` (Obsidian Base) | Full-screen background with subtle noise overlay |
| **Surface Card** | `#FFFFFF` | `#131319` / `#181820` | Container cards, forensic scorecards, modal bodies |
| **Surface Secondary** | `#FAF6EE` | `#1A1A24` / `#1E1E28` | Inner input wells, sample voice cards, badges |
| **Primary Accent** | `#D4A017` (Warm Gold/Amber) | `#F1BE38` (Luminous Amber) | Hero highlights, action buttons, active audio nodes |
| **Foreground Text** | `#1A1A1A` (Deep Charcoal) | `#FFFFFF` (Pure White) | Primary headings, titles, high-contrast labels |
| **Secondary Text** | `#5A5852` / `#7A7875` | `#C8C5BD` / `#9A968F` | Body paragraphs, metadata, sub-labels |
| **Verdict Safe** | `#2D8A4E` (Forest Green) | `#2ECC71` / `#3DE884` | Authentic human voice badges, safe scores |
| **Verdict Danger** | `#C0392B` (Deep Crimson) | `#EF4444` / `#F87171` | Deepfake voice clone alerts, critical scam warnings |
| **Glass Border** | `rgba(217, 212, 200, 0.8)` | `rgba(255, 255, 255, 0.12)` | Container borders, subtle dividers |

### 4.2 Noise Grain Overlay Architecture
To prevent sterile flat surfaces, a hardware-accelerated SVG noise grain filter is rendered across the entire viewport:
```css
.noise-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}
```

### 4.3 Liquid Glass Navigation (`Navbar.tsx`)
The navigation bar employs an ultra-translucent specular glass formula:
- **Opacity / Tint:** 5–6% light tint (`bg-white/80` light, `bg-[#101015]/80` dark).
- **Backdrop Filter:** `backdrop-blur: 24px` + `saturate: 190%`.
- **Specular Border:** Subtle 1px translucent border with top specular highlight (`border-white/40` light, `border-white/12` dark).
- **Box Shadow:** `0 8px 32px 0 rgba(0, 0, 0, 0.05)` (light) / `0 12px 40px 0 rgba(0, 0, 0, 0.45)` (dark).

---

## 5. State Management & Component Architecture

```
                               ┌───────────────────┐
                               │     App.tsx       │
                               │ (Global State)    │
                               └─────────┬─────────┘
                                         │
        ┌──────────────────┬─────────────┼─────────────┬──────────────────┐
        ▼                  ▼             ▼             ▼                  ▼
  ┌───────────┐      ┌───────────┐ ┌───────────┐ ┌───────────┐      ┌───────────┐
  │Navbar.tsx │      │ Active    │ │Toasts.tsx │ │Contribute │      │Footer.tsx │
  │- Theme    │      │ Page View │ │- Queue    │ │ModelBox   │      │- Charter  │
  │- NetState │      │ (Router)  │ │- Dismiss  │ │- Feedback │      │- SLA      │
  └───────────┘      └─────┬─────┘ └───────────┘ └───────────┘      └───────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
      ┌─────────────┐             ┌──────────────┐
      │HomePage.tsx │             │Other Pages   │
      └──────┬──────┘             │- Features    │
             │                    │- Contact     │
     ┌───────┴───────┐            │- Privacy     │
     ▼               ▼            │- Terms       │
┌───────────┐ ┌─────────────┐     └──────────────┘
│UploadZone │ │SampleVoices │
│- Analyzer │ │- WebAudio   │
│- jsPDF    │ │  Synthesizer│
└───────────┘ └─────────────┘
```

### 5.1 Global State Inventory (`App.tsx`)

| State Key | Type | Description |
| :--- | :--- | :--- |
| `activeTab` | `'home' \| 'features' \| 'contact' \| 'privacy' \| 'terms'` | Client-side view routing state |
| `isDark` | `boolean` | Dark mode toggle (persisted in `localStorage`, synced to HTML class) |
| `isOnline` | `boolean` | Native browser connection state (`navigator.onLine`) |
| `externalAudioTrigger`| `{ name, sampleType, size, type } \| null` | Allows `SampleVoices` to dispatch audio into `UploadZone` |
| `toasts` | `Array<{ id, type, title, message }>` | Global notification stack with auto-dismiss timers |
| `analysisHistory` | `Array<{ id, fileName, result, date }>` | Transient session audit trail for fast recall |

### 5.2 Network Synchronization Mechanism
The app continuously monitors real-time browser connectivity without external polling:
```typescript
useEffect(() => {
  const handleOnline = () => {
    setIsOnline(true);
    addToast('success', 'Connected to Live Network', 'Forensic scoring engine operating in live sync mode.');
  };
  const handleOffline = () => {
    setIsOnline(false);
    addToast('info', 'Offline Mode Activated', 'Acoustic analysis operating via client-side Web Audio engine.');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);
```

---

## 6. Acoustic Engine & Audio Synthesis Subsystem (`audioEngine.ts`)

The acoustic engine delivers a zero-cloud simulation environment powered by the Web Audio API (`AudioContext`).

```
                              Audio Input Stream
                          (File or ArrayBuffer)
                                    │
                                    ▼
                     ┌──────────────────────────────┐
                     │ getAudioContext().decode()   │
                     └──────────────┬───────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
      ┌───────────────────────┐           ┌────────────────────────┐
      │ extractWaveform()     │           │ analyzeAudioClip()     │
      │ - 44 Block Energy RMS │           │ - Multi-Phase Timeline │
      │ - Normalized [0.18-   │           │ - Python API Probe     │
      │   0.95] Envelope      │           │ - Client-Side Scoring  │
      └───────────┬───────────┘           └───────────┬────────────┘
                  │                                   │
                  └─────────────────┬─────────────────┘
                                    ▼
                         ┌────────────────────┐
                         │   AnalysisResult   │
                         │   Telemetry Object │
                         └────────────────────┘
```

### 6.1 `AnalysisResult` Data Contract
```typescript
export interface AnalysisResult {
  isAuthentic: boolean;
  confidence: number;
  label: string;
  summary: string;
  
  // Tier 1: Human-Friendly Verdict
  riskLevel: 'LOW_RISK_SAFE' | 'MEDIUM_SUSPICIOUS' | 'CRITICAL_SCAM_ALERT';
  riskTitle: string;
  plainAdvice: string;
  humanBreathScore: number;       // 0-100 (Higher = organic diaphragm breathing)
  vocalTremorScore: number;       // 0-100 (Higher = natural vocal fold jitter)
  robotGlitchScore: number;       // 0-100 (Higher = synthetic vocoder flaws)
  roomAcousticScore: number;      // 0-100 (Higher = 3D physical impulse response)
  
  // Tier 2: Engineering & Forensic Metrics
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

### 6.2 Real-Time Vocal Formant Synthesizer
`playSynthesizedVoiceSample(type, onEnded)` synthesizes acoustic waveforms directly using oscillator graphs and Biquad filters:

1. **`'ceo'` (Authoritative Human Voice):**
   - **Oscillator:** Sawtooth at fundamental $f_0 = 115\text{ Hz}$ with organic micro-ramping ($115 \to 124 \to 109 \to 120\text{ Hz}$).
   - **Formants:** Double Bandpass cascade ($F_1 = 500\text{ Hz}, Q=4.0$; $F_2 = 1500\text{ Hz}, Q=5.0$) reproducing vocal tract resonance.
2. **`'family'` (Loved Relative / Warm Tone):**
   - **Oscillator:** Triangle wave at $f_0 = 195\text{ Hz}$ with dynamic pitch cadence.
   - **Formant:** Lowpass filter at $1800\text{ Hz}$ simulating natural high-frequency roll-off.
3. **`'bank'` (Telecom / Scammer Voice):**
   - **Oscillator:** Square wave at $140\text{ Hz}$ with abrupt pitch step shifts ($140 \to 165 \to 135\text{ Hz}$).
   - **Formant:** Bandpass filter ($1000\text{ Hz}, Q=1.8$) simulating 8kHz telecom narrowband frequency limits.
4. **`'clone'` (AI Neural Vocoder Deepfake):**
   - **Oscillators:** Dual detuned oscillators (Sawtooth $160\text{ Hz}$ + Square $320\text{ Hz}$) with randomized step quantizations.
   - **Formants:** High-gain Peaking comb filter ($2400\text{ Hz}, \text{Gain} = +8\text{ dB}$) reproducing metallic vocoder phase distortion.

### 6.3 Waveform Bar Extraction Algorithm
```typescript
export async function extractWaveformFromAudio(
  fileOrBuffer: File | ArrayBuffer,
  barCount: number = 44
): Promise<{ bars: number[]; duration: number; sampleRate: number }> {
  const ctx = getAudioContext();
  const arrayBuffer = fileOrBuffer instanceof File ? await fileOrBuffer.arrayBuffer() : fileOrBuffer;
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));

  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / barCount);
  const bars: number[] = [];

  for (let i = 0; i < barCount; i++) {
    let blockSum = 0;
    const start = i * blockSize;
    for (let j = 0; j < blockSize; j += 4) {
      blockSum += Math.abs(channelData[start + j] || 0);
    }
    const avg = blockSum / (blockSize / 4);
    const height = Math.min(0.95, Math.max(0.18, avg * 3.8));
    bars.push(parseFloat(height.toFixed(3)));
  }

  return { bars, duration: audioBuffer.duration, sampleRate: audioBuffer.sampleRate };
}
```

---

## 7. Forensic PDF Export Engine (`pdfExport.ts`)

The PDF export system creates an official, vector-drawn A4 forensic audit report using `jsPDF`.

### Document Layout Geometry
```
┌─────────────────────────────────────────────────────────────────┐ ◄── Margin: 16mm
│  DEEPFAKEGUARD FORENSIC AUDIT REPORT          [Case # DFG-XXXX] │ ◄── Height: 24mm
├─────────────────────────────────────────────────────────────────┤
│  VERDICT: [AUTHENTIC HUMAN VOICE / DEEPFAKE CLONE DETECTED]     │ ◄── Height: 34mm
│  Confidence: 98.2%   |  Risk Level: [SAFE / CRITICAL]           │
├─────────────────────────────────────────────────────────────────┤
│  AUDIO EVIDENCE FILE: recording_sample.wav                      │ ◄── Height: 22mm
│  Duration: 4.2s  |  Sample Rate: 44.1kHz  |  Size: 182.4 KB     │
├─────────────────────────────────────────────────────────────────┤
│  PLAIN-LANGUAGE SUMMARY & HUMAN GUIDANCE                        │ ◄── Height: 32mm
│  Clear explanation of what the findings mean for user safety    │
├─────────────────────────────────────────────────────────────────┤
│  ACOUSTIC INDICATOR SCORECARDS (4 Metric Columns)               │ ◄── Height: 25mm
│  [Breath: 96%]  [Jitter: 94%]  [AI Glitch: 6%]  [Room: 98%]     │
├─────────────────────────────────────────────────────────────────┤
│  ACTIONABLE SECURITY ADVICE (Colored Guidance Box)              │ ◄── Height: 26mm
│  Recommended next steps (e.g. Call back on verified line)       │
├─────────────────────────────────────────────────────────────────┤
│  KEY FORENSIC OBSERVATIONS & FREQUENCY ANOMALIES                │
│  • Natural pulmonary breathing intervals detected at 00:02.1s   │
├─────────────────────────────────────────────────────────────────┤
│  Disclaimer: Processed with Zero Data Retention Policy          │ ◄── Footer
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Animation & Motion Orchestration (`motion/react`)

All interface transitions leverage physics-based spring mechanics with consistent cubic-bezier timing curves.

### 8.1 Motion Constants & Standard Curves
```typescript
export const springTransition = {
  duration: 0.35,
  ease: [0.22, 1, 0.36, 1], // Smooth organic deceleration
};

export const modalVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: springTransition },
  exit: { opacity: 0, y: 20, scale: 0.96, transition: { duration: 0.2 } },
};

export const tabViewVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};
```

### 8.2 Real-Time Waveform Animation Keyframes
Waveform bars utilize dynamic height calculations with CSS transition smoothing during audio playback:
```tsx
<motion.div
  className="w-1.5 rounded-full transition-all duration-150"
  style={{
    height: `${Math.max(15, bar * 100)}%`,
    backgroundColor: isPlaying ? '#D4A017' : '#D9D4C8',
  }}
/>
```

---

## 9. Comprehensive Component Directory

### 9.1 `UploadZone.tsx`
- **Responsibilities:** Drag-and-drop file ingestion, validation of MIME types (`.wav`, `.mp3`, `.m4a`, `.ogg`, `.flac`), multi-step progress bar simulation (`0% -> 100%`), interactive waveform visualizer, collapsible advanced telemetry drawers, and PDF report triggering.
- **Key Interactivity:**
  - Dynamic Anomaly Tooltips across playback timeline.
  - Quick Reset button restoring drag target without page reloads.
  - One-click PDF download with filename sanitization.

### 9.2 `SampleVoices.tsx`
- **Responsibilities:** Provides four pre-configured voice profiles for sandbox testing (`Authoritative CEO`, `Loved Family Member`, `Bank Security Alert`, `AI Synthesized Clone`).
- **Audio Integration:** Directly calls `playSynthesizedVoiceSample()` with play/pause state synchronization and instantaneous "Scan This Voice" triggers.

### 9.3 `Navbar.tsx`
- **Responsibilities:** View navigation tabs (`Home`, `Features`, `Contact Us`, `Privacy`, `Terms`), live online network badge, dark/light theme switch, and responsive mobile sliding drawer.

### 9.4 `FeaturesPage.tsx`
- **Responsibilities:** Interactive "Live Acoustic Comparison" studio with side-by-side Real Human vs AI Clone audio players, alongside 6 technical architecture breakdown cards.

### 9.5 `ContactPage.tsx`
- **Responsibilities:** Incident reporting form with urgency triage (`Critical (1hr)`, `Standard (24hr)`, `General`), optional audio evidence drag-and-drop, and simulated incident ticket generation with case ID.

### 9.6 `PrivacyPage.tsx` & `TermsPage.tsx`
- **Responsibilities:** Full legal & compliance disclosures regarding zero-retention ephemeral memory processing, biometric privacy, and downloadable legal policy PDFs.

### 9.7 `ContributeModelBox.tsx`
- **Responsibilities:** Floating widget allowing users to voluntarily donate anonymized audio samples to improve open-source scam detection models, featuring an affirmative consent verification toggle.

---

## 10. Backend Integration Specification (Optional Python Service)

For organizations seeking to connect DeepfakeGuard to self-hosted deep learning models (e.g. PyTorch Wav2Vec2-based classifier), the frontend automatically attempts to POST to `/api/detect`.

### API Request Specification
- **Endpoint:** `POST /api/detect`
- **Content-Type:** `multipart/form-data`
- **Payload:** `audio: <Binary Audio File>`

### API Response Contract (JSON)
```json
{
  "isAuthentic": false,
  "confidence": 98.4,
  "label": "Deepfake Voice Detected",
  "summary": "Phase discontinuities in 2.4kHz vocoder band and absent breathing intervals.",
  "spectralArtifactsScore": 89.2,
  "pitchConsistencyScore": 28.4,
  "formantJitterScore": 84.1,
  "acousticCoherenceScore": 21.8,
  "duration": 4.5,
  "sampleRate": 44100,
  "detectedAnomalies": [
    "Phase glitch detected in 2.2kHz–4.0kHz frequency spectrum",
    "Artificial zero-crossing pitch quantization",
    "Missing natural breathing pauses"
  ],
  "forensicTimestamps": [
    { "time": 1.2, "label": "Formant phase jump", "severity": "high" },
    { "time": 2.4, "label": "Harmonic vocoder artifact", "severity": "medium" }
  ]
}
```

---

## 11. Verification, Testing & Quality Assurance

1. **TypeScript Type Integrity:** Verified with `tsc --noEmit` across all modules.
2. **Vite Production Compilation:** Passed full static build via `vite build`.
3. **Cross-Theme Legibility:** High-contrast WCAG AA conformance verified in both Light Editorial (`#F5F0E8`) and Obsidian Dark (`#0B0B0E`) palettes.
4. **Offline Resilience:** Tested in severed network states; audio synthesis and analysis fallback operate client-side without runtime exceptions.

---

*Authored by Senior Software Architect • DeepfakeGuard Core Engineering*
