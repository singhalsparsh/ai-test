import React from 'react';
import { Shield } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleNav = (page: string) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="main-footer" className="w-full mt-24 sm:mt-32 pb-14 px-4 text-center border-t border-[#D9D4C8] dark:border-white/10 pt-10">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
        {/* Brand */}
        <button
          onClick={() => handleNav('home')}
          className="flex items-center gap-2 text-sm font-bold text-[#1A1A1A] dark:text-white hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-[#1A1A1A] dark:bg-[#282834] dark:border dark:border-white/15 flex items-center justify-center text-[#D4A017] dark:text-[#F1BE38]">
            <Shield className="w-3.5 h-3.5 fill-current" />
          </div>
          <span>
            Deepfake<span className="text-[#D4A017] dark:text-[#F1BE38]">Guard</span> Forensics
          </span>
        </button>

        {/* Security Note */}
        <p className="text-xs sm:text-[13px] font-normal text-[#7A7875] dark:text-[#9A968F] max-w-md mx-auto">
          State-of-the-art voice authenticity detection. Ephemeral in-memory audio extraction with strict Zero Data Retention.
        </p>

        {/* Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-semibold text-[#5A5852] dark:text-[#A8A49C]">
          <button
            id="footer-home-btn"
            onClick={() => handleNav('home')}
            className="hover:text-[#1A1A1A] dark:hover:text-white transition-colors cursor-pointer"
          >
            Home
          </button>
          <span className="text-[#D9D4C8] dark:text-white/15">•</span>
          <button
            id="footer-features-btn"
            onClick={() => handleNav('features')}
            className="hover:text-[#1A1A1A] dark:hover:text-white transition-colors cursor-pointer"
          >
            Features
          </button>
          <span className="text-[#D9D4C8] dark:text-white/15">•</span>
          <button
            id="footer-contact-btn"
            onClick={() => handleNav('contact')}
            className="hover:text-[#1A1A1A] dark:hover:text-white transition-colors cursor-pointer"
          >
            Contact & Incident Report
          </button>
          <span className="text-[#D9D4C8] dark:text-white/15">•</span>
          <button
            id="footer-privacy-btn"
            onClick={() => handleNav('privacy')}
            className="hover:text-[#1A1A1A] dark:hover:text-white transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <span className="text-[#D9D4C8] dark:text-white/15">•</span>
          <button
            id="footer-terms-btn"
            onClick={() => handleNav('terms')}
            className="hover:text-[#1A1A1A] dark:hover:text-white transition-colors cursor-pointer"
          >
            Terms of Service
          </button>
        </div>

        {/* Copyright */}
        <p className="text-[11px] text-[#9A9895] dark:text-[#686560] font-normal tracking-tight">
          © 2026 DeepfakeGuard AI Defense Systems. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
