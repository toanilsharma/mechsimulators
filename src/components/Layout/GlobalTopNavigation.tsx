import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Volume2,
  VolumeX,
  Menu,
  X,
  LogIn,
  GraduationCap,
  Zap,
  RotateCw,
  Home,
  Sliders,
} from 'lucide-react';
import { machineryAcoustics } from '../../utils/machineryAcoustics';

export interface GlobalTopNavigationProps {
  onOpenSearch: () => void;
  onNavigate?: (path: string) => void;
  className?: string;
}

export const GlobalTopNavigation: React.FC<GlobalTopNavigationProps> = ({
  onOpenSearch,
  onNavigate,
  className = '',
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFxMuted, setIsFxMuted] = useState<boolean>(machineryAcoustics.getIsMuted());
  const [fxVolume, setFxVolume] = useState<number>(machineryAcoustics.getVolume());
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);

  const handleToggleFx = () => {
    const nextMuted = machineryAcoustics.toggleMute();
    setIsFxMuted(nextMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setFxVolume(val);
    machineryAcoustics.setVolume(val);
    if (isFxMuted && val > 0) {
      machineryAcoustics.toggleMute();
      setIsFxMuted(false);
    }
  };

  const navLinks = [
    {
      name: 'Home',
      href: 'https://livesimulators.com',
      isExternal: true,
      icon: Home,
    },
    {
      name: 'Electrical',
      href: 'https://livesimulators.com/department/electrical',
      isExternal: true,
      icon: Zap,
    },
    {
      name: 'Mechanical',
      href: '/mechanical',
      isActive: true,
      badge: 'Active',
      icon: RotateCw,
    },
    {
      name: 'Faculty',
      href: 'https://livesimulators.com/faculty',
      isExternal: true,
      icon: GraduationCap,
    },
  ];

  return (
    <header
      id="global-livesimulators-nav"
      className={`sticky top-0 h-[54px] min-h-[54px] max-h-[54px] bg-[#0A1222]/95 backdrop-blur-xl border-b border-[#1E3A5F]/80 shadow-[0_4px_24px_rgba(0,0,0,0.7),0_1px_0_rgba(6,182,212,0.15)] text-slate-200 px-3 sm:px-5 md:px-6 lg:px-8 flex items-center justify-between gap-3 select-none shrink-0 z-40 font-sans relative ${className}`}
    >
      {/* Top subtle cyber-accent edge highlight line */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/70 to-transparent pointer-events-none" />

      {/* 1. Global LiveSimulators Brand Identity */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="https://livesimulators.com"
          className="flex items-center gap-2 group cursor-pointer text-left"
          title="Return to LiveSimulators.com Hub"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.18)] group-hover:scale-105 transition-transform shrink-0">
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-base sm:text-lg font-bold text-white tracking-tight">
              LiveSimulators<span className="text-cyan-400">.com</span>
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse motion-reduce:animate-none" />
              MECHANICAL
            </span>
          </div>
        </a>
      </div>

      {/* 2. Global LiveSimulators Top Navigation Bar: Home, Electrical, Mechanical [Active], Faculty */}
      <nav
        aria-label="Global Primary Navigation"
        className="hidden md:flex items-center gap-1 bg-[#0F172A]/80 p-0.5 rounded-lg border border-slate-800/90"
      >
        {navLinks.map((link) => {
          const Icon = link.icon;
          if (link.isActive) {
            return (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  if (onNavigate) {
                    e.preventDefault();
                    onNavigate(link.href);
                  }
                }}
                aria-current="page"
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-cyan-400 text-slate-950 shadow-sm shadow-cyan-500/25 transition-all cursor-pointer"
              >
                <Icon className="w-3.5 h-3.5 text-slate-950" />
                <span>{link.name}</span>
                <span className="text-[9px] font-mono uppercase bg-slate-950/20 px-1 py-0.2 rounded font-bold">
                  Active
                </span>
              </a>
            );
          }

          return (
            <a
              key={link.name}
              href={link.href}
              target={link.isExternal ? '_blank' : undefined}
              rel={link.isExternal ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <Icon className="w-3.5 h-3.5 text-slate-400" />
              <span>{link.name}</span>
            </a>
          );
        })}
      </nav>

      {/* 3. Utility Controls: Global Ctrl+K Search Trigger, Sound FX, Login */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Global Ctrl+K Search Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          title="Global simulator quick search (Ctrl+K)"
          aria-label="Global quick search"
          id="global-search-trigger"
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1 min-h-[30px] rounded-lg border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono transition-all group cursor-pointer shadow-sm"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-slate-300 bg-slate-800 border border-slate-700 rounded font-mono">
            <span className="text-[9px]">Ctrl</span>+<span>K</span>
          </kbd>
        </button>

        {/* Audio Sound FX Toggle */}
        <div
          className="relative hidden sm:block"
          onMouseEnter={() => setShowVolumeSlider(true)}
          onMouseLeave={() => setShowVolumeSlider(false)}
        >
          <button
            type="button"
            onClick={handleToggleFx}
            className={`flex items-center gap-1.5 px-2.5 py-1 min-h-[30px] rounded-lg border transition-all text-xs font-mono group cursor-pointer ${
              isFxMuted
                ? 'border-slate-800 bg-slate-900/60 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                : 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
            }`}
            title={isFxMuted ? 'Unmute physics acoustics' : 'Mute physics acoustics'}
          >
            {isFxMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse motion-reduce:animate-none" />
            )}
            <span className="hidden lg:inline text-[11px] font-bold">
              {isFxMuted ? 'FX OFF' : 'FX ON'}
            </span>
          </button>

          {showVolumeSlider && (
            <div className="absolute top-full mt-1 right-0 w-44 bg-[#0d1322] border border-slate-700 p-2.5 rounded-xl shadow-2xl z-50 text-xs font-mono space-y-1.5 animate-in fade-in duration-100">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Machinery Volume</span>
                <span className="text-cyan-400 font-bold">{(fxVolume * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={fxVolume}
                onChange={handleVolumeChange}
                className="w-full h-1.5 bg-slate-900 rounded accent-cyan-400 cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Global Login Link (Directly required: Home, Electrical, Mechanical [Active], Faculty, Login) */}
        <a
          href="https://livesimulators.com/login"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1 min-h-[30px] rounded-lg border border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-300 hover:text-cyan-100 text-xs font-medium transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)] cursor-pointer"
          title="Sign in to LiveSimulators Account"
        >
          <LogIn className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Login</span>
        </a>

        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 md:hidden text-slate-300 hover:text-white cursor-pointer"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-[54px] left-0 right-0 bg-[#090e18] border-b border-[#1E293B] p-4 shadow-2xl z-50 flex flex-col gap-2 md:hidden animate-in slide-in-from-top-2 duration-150 font-sans">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-1 pb-1 border-b border-slate-800">
            LiveSimulators Navigation
          </div>
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.name}
                href={link.href}
                target={link.isExternal ? '_blank' : undefined}
                rel={link.isExternal ? 'noopener noreferrer' : undefined}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  link.isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span>{link.name}</span>
                </div>
                {link.isActive && (
                  <span className="text-[10px] font-mono bg-cyan-400 text-slate-950 font-bold px-1.5 py-0.2 rounded">
                    ACTIVE
                  </span>
                )}
              </a>
            );
          })}

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenSearch();
              }}
              className="flex items-center gap-2 text-xs font-mono text-cyan-400 p-2"
            >
              <Search className="w-4 h-4" />
              <span>Open Search (Ctrl+K)</span>
            </button>
            <a
              href="https://livesimulators.com/login"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-200 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700"
            >
              <LogIn className="w-3.5 h-3.5 text-cyan-400" />
              <span>Login</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
