import React from 'react';
import { Sparkles, Zap, ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onExploreFeatures?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreFeatures }) => {
  return (
    <section id="hero-section" className="relative pt-6 sm:pt-10 pb-6 px-4 text-center overflow-hidden">
      {/* 3D Floating Amber Orb (Top-Right) */}
      <div
        id="floating-orb-1"
        aria-hidden="true"
        className="hidden md:block absolute -top-10 right-[5%] w-96 h-96 rounded-full pointer-events-none -z-10 animate-orb-1 opacity-60 dark:opacity-40"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(212, 160, 23, 0.25) 0%, rgba(212, 160, 23, 0.05) 50%, transparent 70%)',
        }}
      />

      {/* 3D Floating Green Orb (Bottom-Left) */}
      <div
        id="floating-orb-2"
        aria-hidden="true"
        className="hidden md:block absolute top-72 -left-12 w-64 h-64 rounded-full pointer-events-none -z-10 animate-orb-2 opacity-50 dark:opacity-30"
        style={{
          background: 'radial-gradient(circle at 40% 40%, rgba(45, 138, 78, 0.22) 0%, rgba(45, 138, 78, 0.04) 60%, transparent 75%)',
        }}
      />

      <div className="max-w-2xl mx-auto flex flex-col items-center">
        {/* AI Badge with Shimmer Light Sweep */}
        <button
          id="ai-powered-badge"
          onClick={onExploreFeatures}
          className="relative overflow-hidden inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FDF6E3] to-[#FBF0D4] dark:from-[#211A0E] dark:to-[#17130A] border border-[#E8D5A0] dark:border-[#F1BE38]/40 shadow-xs dark:shadow-[0_0_24px_rgba(241,190,56,0.12)] mb-6 cursor-pointer transition-transform duration-300 hover:scale-102 group"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/50 dark:via-[#F1BE38]/30 to-transparent animate-shimmer pointer-events-none"
          />
          <Sparkles className="w-3.5 h-3.5 text-[#D4A017] dark:text-[#F1BE38] fill-[#D4A017]/20 dark:fill-[#F1BE38]/30" />
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.08em] text-[#B8860B] dark:text-[#F1BE38]">
            AI Powered Deepfake Voice Detection
          </span>
          <ArrowRight className="w-3 h-3 text-[#B8860B] dark:text-[#F1BE38] group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Main Heading */}
        <div className="relative mb-5 w-full">
          <h1
            id="hero-main-title"
            className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-[#1A1A1A] dark:text-white tracking-[-0.03em] leading-[1.1] max-w-xl mx-auto"
          >
            Detect <span className="text-[#D4A017] dark:text-[#F1BE38] inline-block font-extrabold">AI</span> Based{' '}
            <span className="relative inline-block underline decoration-[#D4A017]/60 dark:decoration-[#F1BE38]/70 underline-offset-6 decoration-[3px]">
              Scam Calls
            </span>
          </h1>
        </div>

        {/* Subtitle */}
        <p
          id="hero-subtitle"
          className="text-base sm:text-lg text-[#4A4A48] dark:text-[#C5C2BA] font-normal leading-relaxed max-w-[540px] mx-auto mb-7"
        >
          Wondering if that voice clip or phone call is real?{' '}
          <strong className="font-semibold text-[#1A1A1A] dark:text-white">Upload it now.</strong> DeepfakeGuard isolates neural vocoder glitches and biological vocal cord jitter.
        </p>

        {/* Stats Badges */}
        <div
          id="stats-badges-container"
          className="flex flex-wrap items-center justify-center gap-3 w-full"
        >
          <div
            id="badge-verified-count"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0EBE0] dark:bg-[#15151C] border border-[#D9D4C8] dark:border-white/10 text-[#5A5852] dark:text-[#B0ACA4] text-xs sm:text-[13px] font-medium shadow-2xs"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2D8A4E] dark:bg-[#2ECC71] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2D8A4E] dark:bg-[#2ECC71]" />
            </span>
            <span>1,000+ voice recordings verified</span>
          </div>

          <div
            id="badge-realtime-detection"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F0EBE0] dark:bg-[#15151C] border border-[#D9D4C8] dark:border-white/10 text-[#5A5852] dark:text-[#B0ACA4] text-xs sm:text-[13px] font-medium shadow-2xs"
          >
            <Zap className="w-3.5 h-3.5 text-[#D4A017] dark:text-[#F1BE38] fill-[#D4A017]/30 dark:fill-[#F1BE38]/40" />
            <span>Sub-300ms Acoustic Engine</span>
          </div>
        </div>
      </div>
    </section>
  );
};

