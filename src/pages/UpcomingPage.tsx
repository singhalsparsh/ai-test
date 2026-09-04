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
  Download,
  CheckCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ANDROID_CONFIG } from '../utils/androidDetect';

interface UpcomingPageProps {
  onNavigateHome: () => void;
}

const PLATFORMS = [
  {
    icon: Smartphone,
    name: 'Android',
    tagline: 'Native Android App',
    description:
      'Cloud-powered deepfake voice detection with real-time call screening and instant forensic analysis. Available now as a free APK download.',
    status: 'Available Now' as const,
    lightColor: 'bg-[#14261C] text-white',
    darkColor: 'dark:bg-[#0F2A1C] dark:text-white',
    accent: 'text-[#2D8A4E] dark:text-[#2ECC71]',
    borderAccent: 'border-[#2D8A4E]/40 dark:border-[#2ECC71]/40',
    downloadUrl: ANDROID_CONFIG.apkUrl,
  },
  {
    icon: Smartphone,
    name: 'iOS',
    tagline: 'Native iPhone & iPad App',
    description:
      'Native iPhone and iPad app with cloud-based deepfake voice detection and real-time forensic alerts.',
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
      'Native Mac desktop app with cloud-based deepfake detection and real-time voice analysis.',
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
      'Native Linux desktop client with cloud-powered deepfake detection and command-line interface.',
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
      'Native Windows desktop app with cloud-based deepfake detection and real-time voice analysis.',
    status: 'Planned',
    lightColor: 'bg-[#2A2A34] text-white',
    darkColor: 'dark:bg-[#282834] dark:text-white',
    accent: 'text-[#2D8A4E] dark:text-[#2ECC71]',
    borderAccent: 'border-[#2D8A4E]/30 dark:border-[#2ECC71]/30',
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
          active development to bring cloud-powered, real-time voice protection everywhere you need it.
        </p>
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
              {'downloadUrl' in platform && platform.downloadUrl && (
                <a
                  href={platform.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download APK
                </a>
              )}
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
            { label: 'Cloud-powered AI detection engine', icon: Shield },
            { label: 'Real-time voice analysis & alerts', icon: Clock },
            { label: 'Cross-platform forensic analysis', icon: Terminal },
            { label: 'Zero data retention guarantee', icon: Shield },
            { label: 'Multi-format audio support', icon: MessageCircle },
            { label: 'Available on every platform', icon: Smartphone },
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
