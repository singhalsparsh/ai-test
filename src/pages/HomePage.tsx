import React, { useState } from 'react';
import { HeroSection } from '../components/HeroSection';
import { UploadZone } from '../components/UploadZone';
import { LiveDetection } from '../components/LiveDetection';
import { SampleVoices } from '../components/SampleVoices';
import { AnalysisResult } from '../utils/audioEngine';
import { motion } from 'motion/react';
import { Upload, Radio, Mic } from 'lucide-react';

type Tab = 'upload' | 'live' | 'voice';

interface HomePageProps {
  onAnalyzeComplete: (result: AnalysisResult, fileName: string) => void;
  externalAudioTrigger?: {
    name: string;
    sampleType?: 'ceo' | 'family' | 'bank' | 'clone';
    size: number;
    type: string;
  } | null;
  onSelectSample: (sample: {
    name: string;
    sampleType: 'ceo' | 'family' | 'bank' | 'clone';
    size: number;
    type: string;
  }) => void;
  onClearTrigger?: () => void;
  onNavigateToFeatures: () => void;
}

const TABS: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'upload', label: 'Upload File', icon: Upload },
  { id: 'live', label: 'Live Detect', icon: Radio },
  { id: 'voice', label: 'Sample Voices', icon: Mic },
];

export const HomePage: React.FC<HomePageProps> = ({
  onAnalyzeComplete,
  externalAudioTrigger,
  onSelectSample,
  onClearTrigger,
  onNavigateToFeatures,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('upload');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
      className="space-y-8 pb-16"
    >
      <HeroSection onExploreFeatures={onNavigateToFeatures} />

      {/* ─── Tab Navigation ─── */}
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-center gap-1 p-1.5 rounded-2xl bg-white/70 dark:bg-[#14141A]/80 border border-[#D9D4C8] dark:border-white/10 shadow-xs dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-sm">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'text-white dark:text-[#0B0B0E]'
                    : 'text-[#7A7875] dark:text-[#8E8B84] hover:text-[#1A1A1A] dark:hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-tab-bg"
                    className="absolute inset-0 rounded-xl bg-[#1A1A1A] dark:bg-[#F1BE38] shadow-sm"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#F1BE38] dark:text-[#0B0B0E]' : ''}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Tab Content ─── */}
      {activeTab === 'upload' && (
        <motion.div
          key="tab-upload"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <UploadZone
            onAnalyzeComplete={onAnalyzeComplete}
            externalAudioTrigger={externalAudioTrigger}
            onClearTrigger={onClearTrigger}
          />
        </motion.div>
      )}

      {activeTab === 'live' && (
        <motion.div
          key="tab-live"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <LiveDetection onAnalyzeComplete={onAnalyzeComplete} />
        </motion.div>
      )}

      {activeTab === 'voice' && (
        <motion.div
          key="tab-voice"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <SampleVoices onSelectSample={onSelectSample} />
        </motion.div>
      )}
    </motion.div>
  );
};
