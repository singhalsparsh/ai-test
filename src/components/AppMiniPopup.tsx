import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Smartphone, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ANDROID_CONFIG } from '../utils/androidDetect';

/**
 * Lightweight bottom-left toast that periodically nags the visitor
 * about the Android app — on ALL devices, not just Android.
 *
 * - Shows at random intervals (45-90 s)
 * - Auto-dismisses after 8 s
 * - Max 3 impressions per session (resets on reload)
 * - Dismissable; once closed it won't reappear for the rest of the session
 */

const MAX_IMPRESSIONS = 3;
const MIN_DELAY = 45_000; // 45 s
const MAX_DELAY = 90_000; // 90 s
const DISPLAY_DURATION = 8_000; // 8 s

export const AppMiniPopup: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [impressions, setImpressions] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAndroid =
    typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
    timerRef.current = setTimeout(() => {
      setVisible(true);
      setImpressions((prev) => prev + 1);
    }, delay);
  }, []);

  // Kick off the first random delay on mount
  useEffect(() => {
    scheduleNext();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleNext]);

  // Auto-dismiss after DISPLAY_DURATION
  useEffect(() => {
    if (!visible) return;
    const id = setTimeout(() => {
      setVisible(false);
      if (impressions < MAX_IMPRESSIONS) {
        scheduleNext();
      }
    }, DISPLAY_DURATION);
    return () => clearTimeout(id);
  }, [visible, impressions, scheduleNext]);

  const dismiss = () => {
    setVisible(false);
    // Stop future popups for this session
    if (timerRef.current) clearTimeout(timerRef.current);
    setImpressions(MAX_IMPRESSIONS);
  };

  // Don't render anything once we've hit the cap
  if (impressions >= MAX_IMPRESSIONS && !visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          id="app-mini-popup"
          initial={{ opacity: 0, y: 20, x: 0 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 left-4 z-50 max-w-xs w-[calc(100vw-2rem)] sm:w-72 pointer-events-auto"
        >
          <div className="bg-[#FAF6EE] dark:bg-[#14141B] border border-[#D9D4C8] dark:border-white/15 rounded-2xl p-3.5 shadow-[0_8px_28px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#1A1A1A] dark:text-white flex items-start gap-3 relative overflow-hidden">
            {/* Icon */}
            <div className="w-9 h-9 rounded-full bg-[#1A1A1A] dark:bg-[#282834] dark:border dark:border-white/10 flex items-center justify-center text-[#D4A017] dark:text-[#F1BE38] shrink-0">
              <Smartphone className="w-4.5 h-4.5" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#1A1A1A] dark:text-white leading-tight">
                {isAndroid
                  ? 'Get DeepfakeGuard on your phone'
                  : 'DeepfakeGuard is also on Android'}
              </p>
              <p className="text-[11px] text-[#7A7875] dark:text-[#9A968F] mt-0.5 leading-snug">
                Detect scam calls offline —{' '}
                <a
                  href={ANDROID_CONFIG.apkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#D4A017] dark:text-[#F1BE38] underline underline-offset-2 hover:text-[#B8860B] dark:hover:text-[#FFD25E] transition-colors"
                >
                  download the APK
                </a>
              </p>
            </div>

            {/* Close */}
            <button
              id="app-mini-popup-close"
              onClick={dismiss}
              aria-label="Dismiss"
              className="w-6 h-6 rounded-full flex items-center justify-center text-[#9A9895] dark:text-[#686560] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-[#EAE5DA] dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
