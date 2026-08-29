import React, { useState } from 'react';
import { Briefcase, Users, Landmark, Bot, Play, Square, Sparkles } from 'lucide-react';
import { playSynthesizedVoiceSample } from '../utils/audioEngine';

interface SampleVoicesProps {
  onSelectSample: (sample: { name: string; size: number; type: string; sampleType: 'ceo' | 'family' | 'bank' | 'clone' }) => void;
}

export const SampleVoices: React.FC<SampleVoicesProps> = ({ onSelectSample }) => {
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);
  const [activeStopFn, setActiveStopFn] = useState<(() => void) | null>(null);

  const samples = [
    {
      id: 'ceo',
      name: 'CEO Earnings Call',
      sampleType: 'ceo' as const,
      icon: Briefcase,
      isFakeHint: false,
      tag: 'Authentic Vocal',
      fileSize: 1842000,
    },
    {
      id: 'family',
      name: 'Family Member Voice',
      sampleType: 'family' as const,
      icon: Users,
      isFakeHint: false,
      tag: 'Authentic Vocal',
      fileSize: 1420000,
    },
    {
      id: 'bank',
      name: 'Bank Representative',
      sampleType: 'bank' as const,
      icon: Landmark,
      isFakeHint: true,
      tag: 'Scam Audio Clone',
      fileSize: 1650000,
    },
    {
      id: 'clone',
      name: 'AI Generated Clone',
      sampleType: 'clone' as const,
      icon: Bot,
      isFakeHint: true,
      tag: 'Neural Synthesis',
      fileSize: 1980000,
    },
  ];

  const handleTogglePreviewAudio = (e: React.MouseEvent, sample: (typeof samples)[0]) => {
    e.stopPropagation();

    if (playingSampleId === sample.id) {
      if (activeStopFn) activeStopFn();
      setPlayingSampleId(null);
      setActiveStopFn(null);
    } else {
      if (activeStopFn) activeStopFn();
      setPlayingSampleId(sample.id);

      const playback = playSynthesizedVoiceSample(sample.sampleType, () => {
        setPlayingSampleId(null);
        setActiveStopFn(null);
      });
      setActiveStopFn(() => playback.stop);
    }
  };

  const handleCardClick = (sample: (typeof samples)[0]) => {
    if (activeStopFn) activeStopFn();
    setPlayingSampleId(null);

    // Smooth scroll up to upload zone
    const dropzone = document.getElementById('upload-zone-wrapper');
    if (dropzone) {
      dropzone.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    onSelectSample({
      name: `${sample.name.replace(/\s+/g, '_')}_Sample.wav`,
      size: sample.fileSize,
      type: 'audio/wav',
      sampleType: sample.sampleType,
    });
  };

  return (
    <section id="sample-voices-section" className="w-full max-w-[560px] mx-auto mt-10 px-4 sm:px-0">
      {/* Section Divider & Label */}
      <div className="flex items-center w-full mb-4">
        <div className="flex-1 h-[1px] bg-[#E0DBD0] dark:bg-white/10" />
        <span className="px-4 text-xs sm:text-[15px] font-medium text-[#5A5852] dark:text-[#A8A49C] text-center">
          No audio? Try with example voices:
        </span>
        <div className="flex-1 h-[1px] bg-[#E0DBD0] dark:bg-white/10" />
      </div>

      {/* Sample Voice Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {samples.map((sample) => {
          const Icon = sample.icon;
          const isPlayingThis = playingSampleId === sample.id;

          return (
            <div
              key={sample.id}
              id={`sample-badge-${sample.id}`}
              onClick={() => handleCardClick(sample)}
              className={`group relative flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer shadow-2xs ${
                sample.isFakeHint
                  ? 'bg-[#FDF0EE]/85 hover:bg-[#FDF0EE] dark:bg-[#1D1113] dark:hover:bg-[#261518] border-[#F0D0CC] hover:border-[#E8B0AA] dark:border-[#EF4444]/30 dark:hover:border-[#EF4444]/60'
                  : 'bg-white/80 hover:bg-[#F5F0E8] dark:bg-[#14141B] dark:hover:bg-[#191924] border-[#E0DBD0] hover:border-[#D4A017]/50 dark:border-white/10 dark:hover:border-[#F1BE38]/40'
              } hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)] active:scale-97`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    sample.isFakeHint
                      ? 'bg-[#FBE4E0] dark:bg-[#321417] text-[#C0392B] dark:text-[#EF4444]'
                      : 'bg-[#F0EBE0] dark:bg-[#1F1F2B] text-[#7A7875] dark:text-[#A09D96] group-hover:text-[#D4A017] dark:group-hover:text-[#F1BE38]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="text-left truncate">
                  <span className="text-xs sm:text-sm font-medium text-[#4A4A48] dark:text-[#EDEDEE] group-hover:text-[#1A1A1A] dark:group-hover:text-white block truncate">
                    {sample.name}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-semibold tracking-wider ${
                      sample.isFakeHint ? 'text-[#C0392B] dark:text-[#F87171]' : 'text-[#2D8A4E] dark:text-[#3DE884]'
                    }`}
                  >
                    {sample.tag}
                  </span>
                </div>
              </div>

              {/* Play / Preview Audio Trigger */}
              <button
                type="button"
                id={`preview-sample-btn-${sample.id}`}
                onClick={(e) => handleTogglePreviewAudio(e, sample)}
                title={isPlayingThis ? 'Stop Audio Preview' : 'Listen to Acoustic Sample Preview'}
                className={`p-1.5 rounded-full transition-all duration-150 shrink-0 ${
                  isPlayingThis
                    ? 'bg-[#1A1A1A] dark:bg-[#F1BE38] text-white dark:text-[#0B0B0E]'
                    : 'text-[#9A9690] dark:text-[#7A7770] group-hover:text-[#1A1A1A] dark:group-hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                {isPlayingThis ? (
                  <Square className="w-3 h-3 fill-current" />
                ) : (
                  <Play className="w-3 h-3 fill-current transition-transform group-hover:scale-110" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
