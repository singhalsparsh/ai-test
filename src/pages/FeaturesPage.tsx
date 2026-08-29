import React, { useState } from 'react';
import {
  Shield,
  Zap,
  Activity,
  Cpu,
  Lock,
  Radio,
  FileCheck,
  CheckCircle,
  AlertOctagon,
  Play,
  Square,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import { playSynthesizedVoiceSample } from '../utils/audioEngine';

interface FeaturesPageProps {
  onNavigateHome: () => void;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({ onNavigateHome }) => {
  const [activeVoiceDemo, setActiveVoiceDemo] = useState<'real' | 'fake' | null>(null);
  const [stopFn, setStopFn] = useState<(() => void) | null>(null);

  const handleToggleDemo = (type: 'real' | 'fake') => {
    if (activeVoiceDemo === type) {
      if (stopFn) stopFn();
      setActiveVoiceDemo(null);
      setStopFn(null);
      return;
    }

    if (stopFn) stopFn();

    const sampleType = type === 'real' ? 'family' : 'clone';
    const player = playSynthesizedVoiceSample(sampleType, () => {
      setActiveVoiceDemo(null);
      setStopFn(null);
    });

    setActiveVoiceDemo(type);
    setStopFn(() => player.stop);
  };

  const featureCards = [
    {
      icon: Activity,
      title: 'Wav2Vec2 Latent Representation',
      badge: 'Neural Core',
      desc: 'Transforms continuous audio streams into 512-dimensional acoustic embeddings, exposing subtle phase discontinuities and unnatural statistical distributions produced by generative AI voice synthesizers.',
    },
    {
      icon: Radio,
      title: 'Formant & Jitter Acoustic Analysis',
      badge: 'Physiology',
      desc: 'Measures biological micro-variations of human vocal cords. Real human speech features continuous involuntary pitch jitter (0.8–2.2%), whereas deepfake models frequently exhibit sterile mathematical flatlines.',
    },
    {
      icon: Cpu,
      title: 'Neural Vocoder Artifact Detection',
      badge: 'Spectral DSP',
      desc: 'Pinpoints high-frequency comb filtering, phase cancellation, and zero-crossing anomalies specific to modern diffusion and auto-regressive vocoders (HiFi-GAN, WaveGlow, BigVGAN).',
    },
    {
      icon: Lock,
      title: 'Zero Data Retention (ZDR)',
      badge: 'Privacy Shield',
      desc: 'All audio signals are processed strictly in-memory or transiently piped to secure self-hosted endpoints. No raw audio clips, transcripts, or biometric fingerprints are ever saved to disk.',
    },
    {
      icon: Zap,
      title: 'Sub-300ms Low Latency Pipeline',
      badge: 'Real-Time Ready',
      desc: 'Engineered for integration into live call centers, banking fraud prevention switches, and executive communication relays to flag deepfake voice impersonations mid-sentence.',
    },
    {
      icon: FileCheck,
      title: 'Forensic PDF Export System',
      badge: 'Evidence Ready',
      desc: 'Generate timestamped, tamper-evident forensic PDF audit reports with plain-language risk evaluations, acoustic metric charts, and technical spectrogram telemetry.',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto px-4 pt-6 pb-20 space-y-16"
    >
      {/* Hero Intro */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A1A1A] dark:bg-[#1E1E28] text-white text-xs font-semibold border border-transparent dark:border-white/10 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#D4A017] dark:text-[#F1BE38]" />
          <span>DEEPFAKE DETECTION ENGINE SPECIFICATIONS</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1A1A1A] dark:text-white tracking-tight">
          Acoustic Forensics Designed to Counter Synthetic Voice Clones
        </h1>
        <p className="text-base sm:text-lg text-[#5A5852] dark:text-[#B8B4AA] leading-relaxed">
          DeepfakeGuard combines biological voice tract physiology with deep neural speech representations to reliably isolate AI-generated audio from human speech.
        </p>
      </div>

      {/* Interactive Harmonic Comparison Studio */}
      <div className="rounded-3xl bg-white dark:bg-[#131319] border border-[#D9D4C8] dark:border-white/10 p-6 sm:p-10 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EAE5DA] dark:border-white/10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] dark:text-white">
              Live Acoustic Comparison: Human vs AI Clone
            </h2>
            <p className="text-xs sm:text-sm text-[#7A7875] dark:text-[#9A968F]">
              Listen to synthetic acoustic artifacts and compare spectrogram behavior in real-time.
            </p>
          </div>
          <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-[#FAF6EE] dark:bg-[#1C1C26] border border-[#D9D4C8] dark:border-white/10 text-xs font-mono text-[#1A1A1A] dark:text-white">
            Interactive Audio Lab
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Real Human Voice Box */}
          <div className="p-6 rounded-2xl bg-[#FAF6EE] dark:bg-[#102018] border border-[#2D8A4E]/30 dark:border-[#2ECC71]/35 space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold text-[#2D8A4E] dark:text-[#2ECC71]">
                <CheckCircle className="w-5 h-5" /> Authentic Human Speech
              </span>
              <button
                onClick={() => handleToggleDemo('real')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2D8A4E] dark:bg-[#2ECC71] text-white dark:text-[#0B0B0E] text-xs font-bold hover:bg-[#236c3d] dark:hover:bg-[#3DE884] transition-colors cursor-pointer"
              >
                {activeVoiceDemo === 'real' ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" /> Stop
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" /> Play Real Voice
                  </>
                )}
              </button>
            </div>

            <div className="h-14 bg-white dark:bg-[#0A1610] rounded-xl flex items-center justify-around px-4 border border-[#EAE5DA] dark:border-[#2ECC71]/20">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-300 ${
                    activeVoiceDemo === 'real' ? 'bg-[#2D8A4E] dark:bg-[#2ECC71]' : 'bg-[#D9D4C8] dark:bg-white/20'
                  }`}
                  style={{
                    height: `${Math.sin(i * 0.45) * 30 + 40}%`,
                  }}
                />
              ))}
            </div>

            <ul className="space-y-1.5 text-xs text-[#5A5852] dark:text-[#A8C8B5]">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D8A4E] dark:bg-[#2ECC71]" />
                Involuntary diaphragm breaths between phrases
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D8A4E] dark:bg-[#2ECC71]" />
                Natural 3D room impulse response and physical reflections
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D8A4E] dark:bg-[#2ECC71]" />
                Micro-pitch drift matching biological vocal cords
              </li>
            </ul>
          </div>

          {/* AI Synthesized Voice Box */}
          <div className="p-6 rounded-2xl bg-[#FAF6EE] dark:bg-[#220E10] border border-[#C0392B]/30 dark:border-[#EF4444]/35 space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold text-[#C0392B] dark:text-[#EF4444]">
                <AlertOctagon className="w-5 h-5" /> Synthetic AI Voice Clone
              </span>
              <button
                onClick={() => handleToggleDemo('fake')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C0392B] dark:bg-[#EF4444] text-white dark:text-[#0B0B0E] text-xs font-bold hover:bg-[#962d22] dark:hover:bg-[#F87171] transition-colors cursor-pointer"
              >
                {activeVoiceDemo === 'fake' ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" /> Stop
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" /> Play AI Clone
                  </>
                )}
              </button>
            </div>

            <div className="h-14 bg-white dark:bg-[#160809] rounded-xl flex items-center justify-around px-4 border border-[#EAE5DA] dark:border-[#EF4444]/20">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-300 ${
                    activeVoiceDemo === 'fake' ? 'bg-[#C0392B] dark:bg-[#EF4444]' : 'bg-[#D9D4C8] dark:bg-white/20'
                  }`}
                  style={{
                    height: `${(i % 3 === 0 ? 80 : 30)}%`,
                  }}
                />
              ))}
            </div>

            <ul className="space-y-1.5 text-xs text-[#5A5852] dark:text-[#E8B0B2]">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C0392B] dark:bg-[#EF4444]" />
                Robotic pitch quantization without physical breath pauses
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C0392B] dark:bg-[#EF4444]" />
                Neural vocoder phase discontinuities in 2–4 kHz range
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C0392B] dark:bg-[#EF4444]" />
                Abrupt audio onset and sterile, un-reverberated acoustic profile
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] dark:text-white">
            Complete Forensic Detection Pipeline
          </h2>
          <p className="text-sm text-[#7A7875] dark:text-[#9A968F] mt-1">
            Engineered for enterprise security teams, fraud analysts, and everyday callers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-[#131319] rounded-3xl p-6 sm:p-8 border border-[#D9D4C8] dark:border-white/10 shadow-xs hover:shadow-md dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#FAF6EE] dark:bg-[#1D1D28] border border-[#EAE5DA] dark:border-white/10 flex items-center justify-center text-[#1A1A1A] dark:text-[#F1BE38]">
                      <Icon className="w-6 h-6 text-[#1A1A1A] dark:text-[#F1BE38]" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FAF6EE] dark:bg-[#1D1D28] text-[#7A7875] dark:text-[#B5B2AA] border border-[#EAE5DA] dark:border-white/10">
                      {card.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#1A1A1A] dark:text-white mb-2">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5A5852] dark:text-[#A8A49C] leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA to Test Audio */}
      <div className="rounded-3xl bg-[#1A1A1A] dark:bg-[#14141C] text-white p-8 sm:p-12 text-center space-y-6 border border-transparent dark:border-white/10 shadow-lg dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        <div className="w-12 h-12 rounded-full bg-[#D4A017] dark:bg-[#F1BE38] text-[#1A1A1A] dark:text-[#0B0B0E] mx-auto flex items-center justify-center font-bold">
          <Shield className="w-6 h-6 fill-current" />
        </div>
        <div className="max-w-xl mx-auto space-y-2">
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Ready to test your audio recordings?
          </h3>
          <p className="text-sm text-white/70 dark:text-[#A8A49C]">
            Upload any suspicious voicemail or phone call now to generate a full forensic verdict.
          </p>
        </div>
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#D4A017] dark:bg-[#F1BE38] text-[#1A1A1A] dark:text-[#0B0B0E] font-bold text-sm hover:bg-[#e6b12a] dark:hover:bg-[#FFD25E] transition-all shadow-md dark:shadow-[0_0_24px_rgba(241,190,56,0.3)] cursor-pointer active:scale-95"
        >
          <span>Launch Audio Scanner</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
