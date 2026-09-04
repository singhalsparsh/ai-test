import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Smartphone, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ANDROID_CONFIG } from '../utils/androidDetect';

/**
 * Lightweight bottom-left toast that periodically nags the visitor
 * about the Android app — on ALL devices, not just Android.
 *
 * - Shows immediately on first load (~1.5 s delay)
 * - Repeats at random intervals (25-45 s)
 * - Auto-dismisses after 7 s
 * - Max 5 impressions per session (resets on reload)
 * - Dismissable; once closed it won't reappear for the rest of the session
 */

const MAX_IMPRESSIONS = 5;
const INITIAL_DELAY = 1_500; // first show after 1.5 s
const MIN_DELAY = 25_000; // 25 s
const MAX_DELAY = 45_000; // 45 s
const DISPLAY_DURATION = 7_000; // 7 s

export const AppMiniPopup: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [impressions, setImpressions] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAndroid =
    typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

  const scheduleNext = useCallback(
    (delay: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setVisible(true);
        setImpressions((prev) => prev + 1);
      }, delay);
    },
    [],
  );

  // Show once immediately on page load, then at random intervals
  useEffect(() => {
    scheduleNext(INITIAL_DELAY);
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
        const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
        scheduleNext(delay);
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
                Real-time deepfake detection powered by cloud AI.
              </p>
              <a
                href={ANDROID_CONFIG.apkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A1A1A] hover:bg-black dark:bg-[#F1BE38] dark:hover:bg-[#FFD25E] text-white dark:text-[#0B0B0E] text-[11px] font-bold transition-all shadow-xs dark:shadow-[0_0_16px_rgba(241,190,56,0.18)]"
              >
                <Download className="w-3 h-3" />
                Download App
              </a>
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
