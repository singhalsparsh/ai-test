import React, { useState, useEffect } from 'react';
import { Shield, Menu, X, Wifi, WifiOff, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  isOffline: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onNavigate,
  isOffline,
  theme,
  onToggleTheme,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: 'HOME' },
    { id: 'features', label: 'FEATURES' },
    { id: 'contact', label: 'CONTACT US' },
    { id: 'privacy', label: 'PRIVACY POLICY' },
    { id: 'terms', label: 'TERMS OF SERVICE' },
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isDark = theme === 'dark';

  return (
    <>
      <header
        id="main-navbar"
        className={`fixed top-0 left-0 right-0 z-50 flex justify-center px-4 transition-all duration-300 ${
          isScrolled ? 'pt-2.5' : 'pt-4'
        }`}
      >
        {/* 5-6% Liquid Glass Container with Ultra-Refined Specular Borders */}
        <div
          className={`flex items-center justify-between gap-1 sm:gap-2 rounded-full px-2.5 py-1.5 transition-all duration-300 relative overflow-hidden ${
            isScrolled
              ? isDark
                ? 'bg-[#18181D]/85 shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/15'
                : 'bg-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] border border-black/10'
              : isDark
                ? 'bg-[#141418]/75 shadow-[0_4px_24px_rgba(0,0,0,0.3)] border border-white/10'
                : 'bg-white/65 shadow-[0_4px_20px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] border border-black/8'
          } backdrop-blur-[24px] saturate-[190%] max-w-4xl w-full sm:w-auto`}
          style={{
            background: isDark
              ? isScrolled
                ? 'linear-gradient(135deg, rgba(28,28,34,0.92) 0%, rgba(18,18,22,0.88) 100%)'
                : 'linear-gradient(135deg, rgba(28,28,34,0.80) 0%, rgba(18,18,22,0.70) 100%)'
              : isScrolled
                ? 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(250,246,238,0.75) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(247,242,234,0.60) 100%)',
            boxShadow: isDark
              ? 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.15), 0 8px 32px -2px rgba(0, 0, 0, 0.5)'
              : 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.8), 0 4px 24px -1px rgba(0, 0, 0, 0.05)',
          }}
        >
          {/* Subtle Liquid Glass Specular Top Highlight */}
          <div
            aria-hidden="true"
            className={`absolute top-0 left-0 right-0 h-[1px] pointer-events-none ${
              isDark
                ? 'bg-gradient-to-r from-transparent via-white/25 to-transparent'
                : 'bg-gradient-to-r from-transparent via-white/80 to-transparent'
            }`}
          />

          {/* Brand Logo & Name */}
          <button
            id="nav-logo-btn"
            onClick={() => handleItemClick('home')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-[#D4A017] group cursor-pointer ${
              isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-[#F0EBE0]/60 text-[#1A1A1A]'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-[#1A1A1A] dark:bg-[#282832] dark:border dark:border-white/10 flex items-center justify-center text-[#D4A017] transition-transform duration-200 group-hover:scale-105 shadow-xs">
              <Shield className="w-4 h-4 fill-current" />
            </div>
            <span className={`font-semibold text-sm tracking-tight hidden xs:inline ${
              isDark ? 'text-white' : 'text-[#1A1A1A]'
            }`}>
              Deepfake<span className="text-[#D4A017]">Guard</span>
            </span>
          </button>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => handleItemClick(item.id)}
                  className={`relative px-4 py-2 rounded-full text-xs uppercase tracking-wider font-medium transition-all duration-250 cursor-pointer ${
                    isActive
                      ? isDark
                        ? 'bg-[#2E2E38] text-white shadow-xs font-semibold'
                        : 'bg-[#1A1A1A] text-white shadow-xs font-semibold'
                      : isDark
                        ? 'text-[#A2A09A] hover:text-white hover:bg-white/10'
                        : 'text-[#5A5852] hover:text-[#1A1A1A] hover:bg-[#F0EBE0]/70'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="activeNavUnderline"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-[#D4A017] rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Actions Area: Network Status + Light/Dark Mode Toggle + Mobile Hamburger */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto sm:ml-2">
            {/* Automatic Live Network Status Indicator (No Click) */}
            <div
              id="live-status-indicator"
              title={
                isOffline
                  ? 'Offline: Reconnecting to network automatically...'
                  : 'Live: Real-time network sync active'
              }
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium border select-none transition-all duration-300 ${
                isOffline
                  ? 'bg-[#6B6B6B] text-white border-transparent shadow-xs'
                  : isDark
                    ? 'bg-[#14261C] text-[#34A853] border-[#34A853]/30 shadow-2xs'
                    : 'bg-white/80 text-[#2D8A4E] border-[#2D8A4E]/20 shadow-2xs'
              }`}
            >
              {isOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-white animate-pulse" />
                  <span className="text-[11px] font-semibold">Offline</span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2D8A4E] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2D8A4E]" />
                  </span>
                  <span className="text-[11px] font-semibold tracking-wide text-[#2D8A4E] dark:text-[#34A853]">
                    LIVE
                  </span>
                </>
              )}
            </div>

            {/* Light / Dark Mode Toggle Button */}
            <button
              id="theme-toggle-btn"
              type="button"
              onClick={onToggleTheme}
              aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-250 cursor-pointer shadow-xs border ${
                isDark
                  ? 'bg-[#22222A] hover:bg-[#2D2D36] text-[#E5B229] border-white/15 hover:border-[#E5B229]/40'
                  : 'bg-white/80 hover:bg-[#F0EBE0] text-[#1A1A1A] border-black/10 hover:border-black/20'
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={theme}
                  initial={{ opacity: 0, rotate: -70, scale: 0.7 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 70, scale: 0.7 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="flex items-center justify-center"
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-[#E5B229] stroke-[2.2]" />
                  ) : (
                    <Moon className="w-4 h-4 text-[#2A2A2A] stroke-[2.2]" />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>

            {/* Mobile Menu Button */}
            <button
              id="mobile-hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className={`md:hidden w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isDark
                  ? 'text-white hover:bg-white/10'
                  : 'text-[#1A1A1A] hover:bg-[#F0EBE0]'
              }`}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Full-Screen Overlay Menu with Motion */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-nav-overlay"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed inset-0 z-40 backdrop-blur-2xl flex flex-col justify-center items-center px-6 ${
              isDark ? 'bg-[#121216]/98 text-white' : 'bg-[#F5F0E8]/98 text-[#1A1A1A]'
            }`}
          >
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-full bg-[#1A1A1A] dark:bg-[#282832] flex items-center justify-center text-[#D4A017]">
                <Shield className="w-6 h-6 fill-current" />
              </div>
              <span className={`font-bold text-2xl tracking-tight ${isDark ? 'text-white' : 'text-[#1A1A1A]'}`}>
                Deepfake<span className="text-[#D4A017]">Guard</span>
              </span>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs text-center">
              {navItems.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    id={`mobile-nav-item-${item.id}`}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full py-3.5 rounded-2xl text-base font-semibold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? isDark
                          ? 'bg-[#2E2E38] text-white shadow-md'
                          : 'bg-[#1A1A1A] text-white shadow-md'
                        : isDark
                          ? 'text-[#B8B5AE] hover:bg-white/10 hover:text-white'
                          : 'text-[#4A4A48] hover:bg-[#E8E3D7] hover:text-[#1A1A1A]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Mobile Theme Toggle Button */}
            <div className="w-full max-w-xs mt-4">
              <button
                id="mobile-theme-toggle-btn"
                type="button"
                onClick={onToggleTheme}
                className={`w-full flex items-center justify-between py-3 px-4 rounded-2xl font-semibold text-sm transition-all duration-200 cursor-pointer border ${
                  isDark
                    ? 'bg-[#22222A] text-[#E5B229] border-white/15 hover:bg-[#2B2B34]'
                    : 'bg-white/90 text-[#1A1A1A] border-black/10 hover:bg-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  {isDark ? (
                    <Sun className="w-4 h-4 text-[#E5B229]" />
                  ) : (
                    <Moon className="w-4 h-4 text-[#1A1A1A]" />
                  )}
                  <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
                </span>
                <span className="text-xs uppercase tracking-wider font-bold opacity-75">
                  {isDark ? 'Switch to Light' : 'Switch to Dark'}
                </span>
              </button>
            </div>

            <div className={`mt-6 pt-6 border-t w-full max-w-xs flex justify-center ${
              isDark ? 'border-white/10' : 'border-[#D9D4C8]'
            }`}>
              <div className={`flex items-center gap-2 text-xs ${
                isDark ? 'text-[#A09D96]' : 'text-[#7A7875]'
              }`}>
                {isOffline ? (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span>Currently Offline</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span>Real-time Network Connected</span>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

