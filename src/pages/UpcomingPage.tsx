import React from 'react';
import {
  Smartphone,
  Monitor,
  AppWindow,
  Terminal,
  MessageCircle,
  Clock,
  Sparkles,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'motion/react';

interface UpcomingPageProps {
  onNavigateHome: () => void;
}

const PLATFORMS = [
  {
    icon: Smartphone,
    name: 'iOS',
    tagline: 'Native iPhone & iPad App',
    description:
      'Full on-device deepfake voice detection with Siri Shortcuts integration and Live Voicemail real-time protection.',
    status: 'In Development',
    color: 'from-[#1A1A1A] to-[#2A2A34]',
    lightColor: 'bg-[#1A1A1A] text-white',
    darkColor: 'dark:bg-[#1E1E28] dark:text-white',
    accent: 'text-[#D4A017] dark:text-[#F1BE38]',
    borderAccent: 'border-[#D4A017]/30 dark:border-[#F1BE38]/30',
  },
  {
    icon: Monitor,
    name: 'macOS',
    tagline: 'Mac Desktop Application',
    description:
      'System-wide microphone interception on macOS with Apple Silicon neural engine acceleration for real-time call screening.',
    status: 'In Development',
    color: 'from-[#2A2A34] to-[#1A1A1A]',
    lightColor: 'bg-[#2A2A34] text-white',
    darkColor: 'dark:bg-[#282834] dark:text-white',
    accent: 'text-[#D4A017] dark:text-[#F1BE38]',
    borderAccent: 'border-[#D4A017]/30 dark:border-[#F1BE38]/30',
  },
  {
    icon: Terminal,
    name: 'Linux',
    tagline: 'Open-Source Desktop Client',
    description:
      'Community-driven Linux build with PipeWire integration, CLI detection engine, and full open-source transparency.',
    status: 'Planned',
    lightColor: 'bg-[#1A1A1A] text-white',
    darkColor: 'dark:bg-[#1E1E28] dark:text-white',
    accent: 'text-[#2D8A4E] dark:text-[#2ECC71]',
    borderAccent: 'border-[#2D8A4E]/30 dark:border-[#2ECC71]/30',
  },
  {
    icon: AppWindow,
    name: 'Windows',
    tagline: 'Windows Desktop App',
    description:
      'Native Windows application with system audio capture, VoIP call protection, and Windows Hello biometric confirmation.',
    status: 'Planned',
    lightColor: 'bg-[#2A2A34] text-white',
    darkColor: 'dark:bg-[#282834] dark:text-white',
    accent: 'text-[#2D8A4E] dark:text-[#2ECC71]',
    borderAccent: 'border-[#2D8A4E]/30 dark:border-[#2ECC71]/30',
  },
];

const FEATURED_UPCOMING = [
  {
    icon: MessageCircle,
    title: 'WhatsApp Call Protection',
    description:
      'Real-time deepfake detection on incoming WhatsApp voice and video calls. Intercept live audio streams before you even pick up, with instant scam alerts pushed directly to your lock screen.',
    status: 'High Priority',
  },
];

export const UpcomingPage: React.FC<UpcomingPageProps> = ({ onNavigateHome }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto px-4 pt-6 pb-20 space-y-12"
    >
      {/* ─── Header ─── */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A1A1A] dark:bg-[#1E1E28] text-white text-xs font-semibold border border-transparent dark:border-white/10 shadow-xs">
          <Clock className="w-3.5 h-3.5 text-[#D4A017] dark:text-[#F1BE38]" />
          <span>ROADMAP & UPCOMING RELEASES</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] dark:text-white tracking-tight">
          Coming Soon to{' '}
          <span className="text-[#D4A017] dark:text-[#F1BE38]">Every Platform</span>
        </h1>
        <p className="text-sm sm:text-base text-[#5A5852] dark:text-[#B8B4AA]">
          DeepfakeGuard is expanding beyond the web. Native desktop and mobile apps are in
          active development to bring offline, real-time voice protection everywhere you need it.
        </p>
      </div>

      {/* ─── Featured: WhatsApp Call Processing ─── */}
      <div className="rounded-3xl bg-white dark:bg-[#131319] border border-[#D9D4C8] dark:border-white/10 p-6 sm:p-8 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden relative">
        {/* Glow accent */}
        <div
          aria-hidden="true"
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-15 dark:opacity-10 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(212,160,23,0.4) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-[#1A1A1A] dark:bg-[#F1BE38] text-[#D4A017] dark:text-[#0B0B0E] flex items-center justify-center shrink-0 shadow-md">
            <MessageCircle className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg sm:text-xl font-bold text-[#1A1A1A] dark:text-white">
                WhatsApp Call Protection
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D4A017]/15 dark:bg-[#F1BE38]/20 text-[#D4A017] dark:text-[#F1BE38]">
                High Priority
              </span>
            </div>
            <p className="text-sm text-[#5A5852] dark:text-[#B8B4AA] leading-relaxed mb-4">
              {FEATURED_UPCOMING[0].description}
            </p>
            <div className="flex flex-wrap gap-2">
              {['Live Call Screening', 'Pre-Pickup Detection', 'Lock Screen Alerts', 'Offline AI Model'].map(
                (tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-semibold px-3 py-1 rounded-full bg-[#FAF6EE] dark:bg-[#1A1A24] border border-[#EAE5DA] dark:border-white/10 text-[#7A7875] dark:text-[#A8A49C]"
                  >
                    {tag}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Platform Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLATFORMS.map((platform, idx) => {
          const Icon = platform.icon;
          return (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 + idx * 0.08 }}
              className={`rounded-2xl border p-5 transition-all duration-200 ${platform.lightColor} ${platform.darkColor} ${platform.borderAccent} hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_6px_24px_rgba(0,0,0,0.4)]`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-white/10 flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${platform.accent}`} />
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    platform.status === 'In Development'
                      ? 'bg-[#D4A017]/10 dark:bg-[#F1BE38]/15 text-[#D4A017] dark:text-[#F1BE38] border-[#D4A017]/25 dark:border-[#F1BE38]/30'
                      : 'bg-[#2D8A4E]/10 dark:bg-[#2ECC71]/15 text-[#2D8A4E] dark:text-[#2ECC71] border-[#2D8A4E]/25 dark:border-[#2ECC71]/30'
                  }`}
                >
                  {platform.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-0.5">{platform.name}</h3>
              <p className={`text-xs font-medium ${platform.accent} mb-2`}>{platform.tagline}</p>
              <p className="text-xs text-white/65 dark:text-white/55 leading-relaxed">
                {platform.description}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* ─── Feature Matrix ─── */}
      <div className="rounded-3xl bg-white dark:bg-[#131319] border border-[#D9D4C8] dark:border-white/10 p-6 sm:p-8 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-5 h-5 text-[#D4A017] dark:text-[#F1BE38]" />
          <h2 className="text-lg font-bold text-[#1A1A1A] dark:text-white">
            What Every Platform Gets
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'On-device AI model (no cloud needed)', icon: Shield },
            { label: 'Real-time call screening & alerts', icon: Clock },
            { label: 'Offline deepfake detection', icon: Terminal },
            { label: 'Zero data retention guarantee', icon: Shield },
            { label: 'WhatsApp voice call interception', icon: MessageCircle },
            { label: 'Cross-platform voice analysis', icon: Smartphone },
          ].map((feat) => {
            const FeatIcon = feat.icon;
            return (
              <div
                key={feat.label}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FAF6EE] dark:bg-[#1A1A24] border border-[#EAE5DA] dark:border-white/10"
              >
                <FeatIcon className="w-4 h-4 text-[#2D8A4E] dark:text-[#2ECC71] shrink-0" />
                <span className="text-xs font-medium text-[#4A4A48] dark:text-[#C5C2BA]">
                  {feat.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── CTA ─── */}
      <div className="text-center">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1A1A1A] hover:bg-black dark:bg-[#F1BE38] dark:hover:bg-[#FFD25E] text-white dark:text-[#0B0B0E] text-sm font-bold transition-all shadow-md dark:shadow-[0_0_24px_rgba(241,190,56,0.25)] cursor-pointer group active:scale-95"
        >
          <span>Try DeepfakeGuard on the Web Now</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};
