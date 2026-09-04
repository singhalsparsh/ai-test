import React, { useState, useEffect } from 'react';
import { Smartphone, Download, ShieldCheck, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  isAndroid,
  detectAppInstalled,
  ANDROID_CONFIG,
} from '../utils/androidDetect';

const DISMISS_KEY = 'deepfakeguard_android_popup_dismissed';

/**
 * Full-screen modal popup for Android visitors.
 * Shown on every page load unless the user taps "Got it" (dismissed via localStorage).
 *
 * Matches the site's existing card theme:
 *   rounded-3xl, bg-[#FAF6EE] / dark:bg-[#14141B], border-[#D9D4C8], amber accent.
 */
export const AndroidAppPopup: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [appInstalled, setAppInstalled] = useState(false);

  useEffect(() => {
    if (!isAndroid()) return;

    // Show popup on every visit (localStorage key is only set after dismiss)
    setVisible(true);

    // Probe whether the app is already installed
    detectAppInstalled().then(setAppInstalled);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      /* localStorage may be unavailable */
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          id="android-app-popup-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Download the DeepfakeGuard Android app"
        >
          {/* ── Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#FAF6EE] dark:bg-[#14141B] border border-[#D9D4C8] dark:border-white/15 rounded-3xl p-5 sm:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] text-[#1A1A1A] dark:text-white relative overflow-hidden w-full max-w-sm"
          >
            {/* ── Header banner (mirrors ContributeModelBox) ── */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE5DA] dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#1A1A1A] dark:bg-[#282834] dark:border dark:border-white/10 flex items-center justify-center text-[#D4A017] dark:text-[#F1BE38]">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-[#1A1A1A] dark:text-white">
                  Get DeepfakeGuard for Android
                </h4>
              </div>
              <button
                id="close-android-popup-btn"
                onClick={dismiss}
                aria-label="Close popup"
                className="w-7 h-7 rounded-full hover:bg-[#EAE5DA] dark:hover:bg-white/10 flex items-center justify-center text-[#7A7875] dark:text-[#9A968F] hover:text-[#1A1A1A] dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Body ── */}
            <p className="mt-3 text-xs text-[#5A5852] dark:text-[#A8A49C] leading-relaxed">
              Detect deepfake scam calls directly on your phone with cloud-based AI analysis.
            </p>

            {/* ── Download / Open in App ── */}
            <div className="mt-4 space-y-2.5">
              {/* Primary CTA: Download APK */}
              <a
                id="android-popup-download-btn"
                href={ANDROID_CONFIG.apkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-black dark:bg-[#F1BE38] dark:hover:bg-[#FFD25E] text-white dark:text-[#0B0B0E] text-xs font-bold transition-all shadow-xs dark:shadow-[0_0_20px_rgba(241,190,56,0.2)]"
              >
                <Download className="w-4 h-4" />
                Download APK
              </a>

              {/* Secondary: Open in App (only shown when app is detected) */}
              {appInstalled && (
                <a
                  id="android-popup-open-app-btn"
                  href={ANDROID_CONFIG.directLink}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-[#2D8A4E] dark:border-[#2ECC71] bg-[#2D8A4E]/10 dark:bg-[#2ECC71]/15 text-[#2D8A4E] dark:text-[#2ECC71] text-xs font-bold transition-colors hover:bg-[#2D8A4E]/20 dark:hover:bg-[#2ECC71]/25"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in App
                </a>
              )}
            </div>

            {/* ── VirusTotal trust note ── */}
            <div className="mt-3 p-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-[#D9D4C8] dark:border-white/10">
              <p className="text-[11px] text-[#7A7875] dark:text-[#9A968F] leading-relaxed flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2D8A4E] dark:text-[#2ECC71] mt-0.5 shrink-0" />
                <span>
                  Have trust issues? Verify the APK yourself on{' '}
                  <a
                    id="android-popup-virustotal-link"
                    href={ANDROID_CONFIG.virustotalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#2D8A4E] dark:text-[#2ECC71] underline underline-offset-2 hover:text-[#236B3E] dark:hover:text-[#3DE884] transition-colors"
                  >
                    VirusTotal
                  </a>
                  .
                </span>
              </p>
            </div>

            {/* ── Dismiss footer ── */}
            <button
              id="android-popup-got-it-btn"
              onClick={dismiss}
              className="mt-3 w-full text-center text-[11px] font-semibold text-[#9A9895] dark:text-[#686560] hover:text-[#5A5852] dark:hover:text-[#A8A49C] transition-colors cursor-pointer py-1"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
