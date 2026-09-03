import React, { useState, useEffect } from 'react';
import { Smartphone, Download, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  isAndroid,
  detectAppInstalled,
  ANDROID_CONFIG,
} from '../utils/androidDetect';

const BANNER_DISMISS_KEY = 'deepfakeguard_android_banner_dismissed';

/**
 * Subtle full-width banner shown to Android visitors below the navbar.
 * Dismissible; reappears on each new visit.
 * Matches the existing pill / stat-badge aesthetic.
 */
export const AppBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [appInstalled, setAppInstalled] = useState(false);

  useEffect(() => {
    if (!isAndroid()) return;
    setVisible(true);
    detectAppInstalled().then(setAppInstalled);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(BANNER_DISMISS_KEY, 'true');
    } catch {
      /* swallow */
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          id="android-app-banner"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-[68px] left-0 right-0 z-45 flex justify-center px-4 pointer-events-none"
        >
          <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#FAF6EE]/90 dark:bg-[#14141B]/90 border border-[#D9D4C8] dark:border-white/15 shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-md max-w-lg w-full">
            {/* Icon */}
            <div className="w-7 h-7 rounded-full bg-[#1A1A1A] dark:bg-[#282834] dark:border dark:border-white/10 flex items-center justify-center text-[#D4A017] dark:text-[#F1BE38] shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>

            {/* Text */}
            <span className="text-xs font-semibold text-[#1A1A1A] dark:text-white flex-1 min-w-0 truncate">
              DeepfakeGuard is available as an Android app
            </span>

            {/* Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Open in App — only when detected */}
              {appInstalled && (
                <a
                  id="android-banner-open-app-btn"
                  href={ANDROID_CONFIG.directLink}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#2D8A4E] dark:bg-[#2ECC71] text-white dark:text-[#0B0B0E] text-[11px] font-bold transition-colors hover:bg-[#236B3E] dark:hover:bg-[#3DE884]"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open
                </a>
              )}

              {/* Download */}
              <a
                id="android-banner-download-btn"
                href={ANDROID_CONFIG.apkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1A1A1A] dark:bg-[#F1BE38] text-white dark:text-[#0B0B0E] text-[11px] font-bold transition-colors hover:bg-black dark:hover:bg-[#FFD25E]"
              >
                <Download className="w-3 h-3" />
                APK
              </a>

              {/* Dismiss */}
              <button
                id="android-banner-dismiss-btn"
                onClick={dismiss}
                aria-label="Dismiss banner"
                className="w-6 h-6 rounded-full flex items-center justify-center text-[#9A9895] dark:text-[#686560] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-[#EAE5DA] dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
