import React, { useState } from 'react';
import { Sparkles, X, Upload, Check, ChevronUp, ChevronDown, HeartHandshake } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ContributeModelBox: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [sampleType, setSampleType] = useState<'real_voice' | 'ai_clone' | 'scam_call'>('scam_call');
  const [consentAgreed, setConsentAgreed] = useState(true);
  const [contributorNote, setContributorNote] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentAgreed) {
      alert('Please accept the voluntary data contribution terms.');
      return;
    }
    // Simulate model training contribution pipeline
    setIsSubmitted(true);
    setTimeout(() => {
      // Keep state clean
    }, 1000);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setAttachedFile(null);
    setContributorNote('');
    setIsOpen(false);
  };

  return (
    <div
      id="model-contribution-widget"
      className="fixed bottom-4 right-4 z-40 max-w-sm w-[calc(100vw-2rem)] sm:w-88"
    >
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#FAF6EE] dark:bg-[#14141B] border border-[#D9D4C8] dark:border-white/15 rounded-3xl p-5 shadow-[0_12px_36px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] text-[#1A1A1A] dark:text-white relative overflow-hidden"
          >
            {/* Header banner */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE5DA] dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#1A1A1A] dark:bg-[#282834] dark:border dark:border-white/10 flex items-center justify-center text-[#D4A017] dark:text-[#F1BE38]">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-[#1A1A1A] dark:text-white">
                  Help Improve the Model
                </h4>
              </div>
              <button
                id="close-contribute-box-btn"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-[#EAE5DA] dark:hover:bg-white/10 flex items-center justify-center text-[#7A7875] dark:text-[#9A968F] hover:text-[#1A1A1A] dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isSubmitted ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#2D8A4E]/15 dark:bg-[#2ECC71]/20 text-[#2D8A4E] dark:text-[#2ECC71] mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <h5 className="font-bold text-base text-[#1A1A1A] dark:text-white">
                  Thank You for Strengthening Voice Safety!
                </h5>
                <p className="text-xs text-[#5A5852] dark:text-[#A8A49C] leading-relaxed">
                  Your audio signature has been scrubbed of metadata and queued for open benchmark training to stop scam calls.
                </p>
                <button
                  id="submit-another-contribution-btn"
                  onClick={handleReset}
                  className="mt-2 text-xs font-bold text-[#1A1A1A] dark:text-[#F1BE38] underline hover:text-[#D4A017] dark:hover:text-[#FFD25E] cursor-pointer"
                >
                  Contribute another sample
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-3 space-y-3">
                <p className="text-xs text-[#5A5852] dark:text-[#A8A49C] leading-relaxed">
                  Share anonymous voice samples or detected AI scams with our research lab to fortify detection against the next generation of voice clones.
                </p>

                {/* Sample Category */}
                <div>
                  <label className="block text-[11px] font-bold text-[#7A7875] dark:text-[#8E8B84] uppercase tracking-wider mb-1.5">
                    Sample Classification
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setSampleType('scam_call')}
                      className={`py-1.5 px-2 rounded-xl text-center font-medium border transition-colors cursor-pointer ${
                        sampleType === 'scam_call'
                          ? 'bg-[#1A1A1A] dark:bg-[#F1BE38] text-white dark:text-[#0B0B0E] border-[#1A1A1A] dark:border-[#F1BE38] font-bold'
                          : 'bg-white dark:bg-[#1E1E28] text-[#5A5852] dark:text-[#C5C2BA] border-[#D9D4C8] dark:border-white/10 hover:bg-[#F0EBE0] dark:hover:bg-[#252532]'
                      }`}
                    >
                      Scam Call
                    </button>
                    <button
                      type="button"
                      onClick={() => setSampleType('ai_clone')}
                      className={`py-1.5 px-2 rounded-xl text-center font-medium border transition-colors cursor-pointer ${
                        sampleType === 'ai_clone'
                          ? 'bg-[#1A1A1A] dark:bg-[#F1BE38] text-white dark:text-[#0B0B0E] border-[#1A1A1A] dark:border-[#F1BE38] font-bold'
                          : 'bg-white dark:bg-[#1E1E28] text-[#5A5852] dark:text-[#C5C2BA] border-[#D9D4C8] dark:border-white/10 hover:bg-[#F0EBE0] dark:hover:bg-[#252532]'
                      }`}
                    >
                      AI Clone
                    </button>
                    <button
                      type="button"
                      onClick={() => setSampleType('real_voice')}
                      className={`py-1.5 px-2 rounded-xl text-center font-medium border transition-colors cursor-pointer ${
                        sampleType === 'real_voice'
                          ? 'bg-[#1A1A1A] dark:bg-[#F1BE38] text-white dark:text-[#0B0B0E] border-[#1A1A1A] dark:border-[#F1BE38] font-bold'
                          : 'bg-white dark:bg-[#1E1E28] text-[#5A5852] dark:text-[#C5C2BA] border-[#D9D4C8] dark:border-white/10 hover:bg-[#F0EBE0] dark:hover:bg-[#252532]'
                      }`}
                    >
                      Real Voice
                    </button>
                  </div>
                </div>

                {/* File Upload / Drag Box */}
                <div>
                  <label className="block text-[11px] font-bold text-[#7A7875] dark:text-[#8E8B84] uppercase tracking-wider mb-1">
                    Audio Clip
                  </label>
                  <label
                    htmlFor="contribute-file-input"
                    className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-[#D9D4C8] dark:border-white/15 bg-white dark:bg-[#1A1A24] hover:bg-[#FAF6EE] dark:hover:bg-[#20202D] text-[#5A5852] dark:text-[#C5C2BA] text-xs cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4 text-[#D4A017] dark:text-[#F1BE38]" />
                    <span className="truncate max-w-[200px]">
                      {attachedFile ? attachedFile.name : 'Select or drop audio clip'}
                    </span>
                    <input
                      id="contribute-file-input"
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setAttachedFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Optional Note */}
                <div>
                  <textarea
                    value={contributorNote}
                    onChange={(e) => setContributorNote(e.target.value)}
                    placeholder="Optional details (e.g. ElevenLabs clone, Telegram scam, family voice note)..."
                    rows={2}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#D9D4C8] dark:border-white/15 bg-white dark:bg-[#1A1A24] text-[#1A1A1A] dark:text-white placeholder-[#9A9895] dark:placeholder-[#6E6B65] focus:outline-hidden focus:ring-1 focus:ring-[#D4A017] dark:focus:ring-[#F1BE38]"
                  />
                </div>

                {/* Consent Checkbox */}
                <label className="flex items-start gap-2 text-[11px] text-[#5A5852] dark:text-[#A8A49C] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentAgreed}
                    onChange={(e) => setConsentAgreed(e.target.checked)}
                    className="mt-0.5 rounded text-[#D4A017] focus:ring-[#D4A017]"
                  />
                  <span>
                    I confirm this audio is anonymized and grant permission for open-source AI defense benchmark training.
                  </span>
                </label>

                <button
                  type="submit"
                  id="submit-model-contribution-btn"
                  className="w-full py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-black dark:bg-[#F1BE38] dark:hover:bg-[#FFD25E] text-white dark:text-[#0B0B0E] text-xs font-bold transition-all shadow-xs dark:shadow-[0_0_20px_rgba(241,190,56,0.2)] cursor-pointer"
                >
                  Submit Audio to Training Lab
                </button>
              </form>
            )}
          </motion.div>
        ) : (
          <motion.button
            id="open-contribute-box-btn"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsOpen(true)}
            className="w-full sm:w-auto ml-auto flex items-center justify-between sm:justify-start gap-2.5 px-4 py-3 rounded-full bg-[#1A1A1A] dark:bg-[#161620] text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:bg-black dark:hover:bg-[#1C1C28] border border-white/10 dark:border-white/15 transition-all cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-full bg-[#D4A017] dark:bg-[#F1BE38] text-[#1A1A1A] dark:text-[#0B0B0E] flex items-center justify-center font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                <span>Help Improve the AI Model</span>
                <span className="text-[10px] bg-[#D4A017] dark:bg-[#F1BE38] text-[#1A1A1A] dark:text-[#0B0B0E] font-extrabold px-1.5 py-0.2 rounded-full">
                  SHARE
                </span>
              </div>
              <div className="text-[10px] text-white/70 dark:text-[#A8A49C]">
                Donate voice samples to stop deepfake scams
              </div>
            </div>
            <ChevronUp className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
