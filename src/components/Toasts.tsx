import React, { useEffect, useState } from 'react';
import { CheckCircle2, WifiOff, Wifi, X } from 'lucide-react';

interface ToastProps {
  showSuccessToast: boolean;
  onDismissSuccess: () => void;
  isOffline: boolean;
  onlineRestoredToast: boolean;
}

export const ToastContainer: React.FC<ToastProps> = ({
  showSuccessToast,
  onDismissSuccess,
  isOffline,
  onlineRestoredToast,
}) => {
  const [successTimerProgress, setSuccessTimerProgress] = useState(100);

  // 5-second auto dismiss timer with shrinking progress line for success toast
  useEffect(() => {
    if (!showSuccessToast) {
      setSuccessTimerProgress(100);
      return;
    }

    const startTime = Date.now();
    const duration = 5000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / duration) * 100);
      setSuccessTimerProgress(remainingPct);

      if (elapsed >= duration) {
        clearInterval(interval);
        onDismissSuccess();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [showSuccessToast, onDismissSuccess]);

  return (
    <div
      id="toast-notifications-container"
      className="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-[340px] w-full pointer-events-none"
    >
      {/* 1. Offline Toast / Online Restored Toast */}
      {(isOffline || onlineRestoredToast) && (
        <div
          id="offline-toast-notification"
          role="alert"
          aria-live="assertive"
          className={`pointer-events-auto w-full p-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.06)] text-white flex items-start gap-3 transition-all duration-400 ease-out transform ${
            onlineRestoredToast ? 'bg-[#2D8A4E]' : 'bg-[#6B6B6B]'
          } animate-in slide-in-from-right-8 duration-300`}
        >
          <div className="p-1 rounded-full bg-white/15 shrink-0 mt-0.5">
            {onlineRestoredToast ? (
              <Wifi className="w-5 h-5 text-white" />
            ) : (
              <WifiOff className="w-5 h-5 text-white animate-pulse" />
            )}
          </div>

          <div className="flex-1 text-left">
            <h4 className="text-sm font-semibold text-white tracking-tight">
              {onlineRestoredToast ? 'Back Online!' : "You're Disconnected"}
            </h4>
            <p className="text-xs text-[#E0E0E0] mt-0.5 leading-snug">
              {onlineRestoredToast
                ? 'Network connection re-established.'
                : 'Check your internet connection and try again.'}
            </p>
          </div>
        </div>
      )}

      {/* 2. Upload Success Toast */}
      {showSuccessToast && (
        <div
          id="upload-success-toast"
          role="status"
          aria-live="polite"
          className="pointer-events-auto relative overflow-hidden w-full p-4 rounded-2xl bg-[#2D8A4E] shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] text-white flex items-start gap-3 transition-all duration-400 ease-out animate-in slide-in-from-right-8"
        >
          <div className="p-1 rounded-full bg-white/15 shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 text-left pr-4">
            <h4 className="text-sm font-semibold text-white tracking-tight">Analysis Complete!</h4>
            <p className="text-xs text-[#D4F5E0] mt-0.5 leading-snug">
              Your audio file has been analyzed successfully.
            </p>
          </div>

          <button
            type="button"
            id="close-success-toast-btn"
            onClick={onDismissSuccess}
            aria-label="Dismiss toast"
            className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>

          {/* Shrinking 3px countdown line */}
          <div
            className="absolute bottom-0 left-0 h-[3px] bg-white/35 transition-all linear"
            style={{ width: `${successTimerProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};
