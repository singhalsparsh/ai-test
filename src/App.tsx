/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/Toasts';
import { HomePage } from './pages/HomePage';
import { FeaturesPage } from './pages/FeaturesPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { ContributeModelBox } from './components/ContributeModelBox';
import { AnalysisResult } from './utils/audioEngine';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [activePage, setActivePage] = useState<'home' | 'features' | 'contact' | 'privacy' | 'terms'>('home');

  // Theme state with localStorage persistence & system preference detection
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('deepfakeguard_theme');
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  // Automatic internet network detection
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [onlineRestoredToast, setOnlineRestoredToast] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Sync theme class to html/body & persist
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('deepfakeguard_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // External sample trigger passed to upload zone
  const [externalFile, setExternalFile] = useState<{
    name: string;
    size: number;
    type: string;
    sampleType?: 'ceo' | 'family' | 'bank' | 'clone';
  } | null>(null);

  // Sync offline class on body for the atmospheric desaturation shift
  useEffect(() => {
    if (isOffline) {
      document.body.classList.add('is-offline');
    } else {
      document.body.classList.remove('is-offline');
    }
  }, [isOffline]);

  // Real browser online/offline events (automatic only, no click needed)
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setOnlineRestoredToast(true);
      setTimeout(() => {
        setOnlineRestoredToast(false);
      }, 2600);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleNavigate = (page: string) => {
    setActivePage(page as 'home' | 'features' | 'contact' | 'privacy' | 'terms');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnalysisComplete = (_result: AnalysisResult, _fileName: string) => {
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3500);
  };

  const handleSampleSelected = (sample: {
    name: string;
    size: number;
    type: string;
    sampleType: 'ceo' | 'family' | 'bank' | 'clone';
  }) => {
    setExternalFile(sample);
    if (activePage !== 'home') {
      setActivePage('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between selection:bg-[#F5E5BE] selection:text-[#1A1A1A] dark:selection:bg-[#F1BE38] dark:selection:text-[#0B0B0E] text-[#1A1A1A] dark:text-[#F3F3F1] transition-colors duration-300">
      {/* Warm noise grain texture overlay */}
      <div className="noise-overlay" aria-hidden="true" />

      {/* Floating 5-6% Liquid Glass Navigation Bar with Light/Dark Mode Switch */}
      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        isOffline={isOffline}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Page Area with Framer Motion Page Transition */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pt-24 sm:pt-28">
        <AnimatePresence mode="wait">
          {activePage === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <HomePage
                onAnalyzeComplete={handleAnalysisComplete}
                externalAudioTrigger={externalFile}
                onSelectSample={handleSampleSelected}
                onClearTrigger={() => setExternalFile(null)}
                onNavigateToFeatures={() => handleNavigate('features')}
              />
            </motion.div>
          )}

          {activePage === 'features' && (
            <motion.div
              key="features"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <FeaturesPage onNavigateHome={() => handleNavigate('home')} />
            </motion.div>
          )}

          {activePage === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <ContactPage />
            </motion.div>
          )}

          {activePage === 'privacy' && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <PrivacyPage />
            </motion.div>
          )}

          {activePage === 'terms' && (
            <motion.div
              key="terms"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <TermsPage />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Bottom-Right "Help Improve the Model" Widget */}
      <ContributeModelBox />

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Toast Notifications */}
      <ToastContainer
        showSuccessToast={showSuccessToast}
        onDismissSuccess={() => setShowSuccessToast(false)}
        isOffline={isOffline}
        onlineRestoredToast={onlineRestoredToast}
      />
    </div>
  );
}
