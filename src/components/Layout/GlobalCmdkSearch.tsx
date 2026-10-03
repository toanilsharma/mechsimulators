import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Search, X, ArrowRight, CornerDownLeft, Sparkles, ExternalLink } from 'lucide-react';
import { MechanicalSimulatorMeta, SimulatorDifficulty } from '../../data/mechanicalSims';

export interface GlobalCmdkSearchProps {
  isOpen: boolean;
  onClose: () => void;
  mechanicalSims: MechanicalSimulatorMeta[];
  onNavigate?: (route: string) => void;
  currentRoute?: string;
}

const getDifficultyBadge = (difficulty: SimulatorDifficulty) => {
  switch (difficulty) {
    case 'Beginner':
      return {
        label: 'Beginner',
        className: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
        dot: 'bg-emerald-400',
      };
    case 'Intermediate':
      return {
        label: 'Intermediate',
        className: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
        dot: 'bg-cyan-400',
      };
    case 'Advanced':
      return {
        label: 'Advanced',
        className: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
        dot: 'bg-amber-400',
      };
    case 'Expert':
      return {
        label: 'Expert',
        className: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
        dot: 'bg-rose-400',
      };
    default:
      return {
        label: difficulty,
        className: 'bg-slate-800 text-slate-300 border-slate-700',
        dot: 'bg-slate-400',
      };
  }
};

export const GlobalCmdkSearch: React.FC<GlobalCmdkSearchProps> = ({
  isOpen,
  onClose,
  mechanicalSims,
  onNavigate,
  currentRoute,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Global keydown listener for Ctrl+K and Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or state
        }
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelectSimulator = (sim: MechanicalSimulatorMeta) => {
    onClose();
    if (onNavigate) {
      onNavigate(sim.route);
    } else {
      // In a Next.js / browser environment, navigate directly
      window.location.href = sim.route;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Simulator Quick Search"
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-3 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150 select-none motion-reduce:animate-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-[#090e18] border border-[#1E293B] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col">
        <Command
          filter={(value, search) => {
            if (value.toLowerCase().includes(search.toLowerCase())) return 1;
            return 0;
          }}
          className="w-full flex flex-col"
        >
          {/* Search Header Bar */}
          <div className="flex items-center px-4 py-3.5 border-b border-[#1E293B] bg-[#0d1526]/80 gap-3">
            <Search className="w-4 h-4 text-[#06B6D4] shrink-0 animate-pulse motion-reduce:animate-none" />
            <Command.Input
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder="Search by Simulator ID, API/ISO code, equipment name, or physics..."
              className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder:text-slate-500 font-sans outline-none focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer shrink-0"
              title="Close search (Esc)"
              aria-label="Close search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Filter Sub-bar */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-[#060A13] border-b border-[#152033] text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
              <span className="font-semibold text-slate-300">MECHANICAL ENGINEERING FLEET</span>
              <span className="text-slate-600">|</span>
              <span className="text-[#06B6D4]">{mechanicalSims.length} SIMULATORS</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500">
              <kbd className="px-1 py-0.5 bg-[#0F172A] border border-[#1E293B] rounded text-slate-400">↑↓</kbd>
              <span>to navigate</span>
              <kbd className="ml-1 px-1.5 py-0.5 bg-[#0F172A] border border-[#1E293B] rounded text-slate-400">↵</kbd>
              <span>to select</span>
              <kbd className="ml-1 px-1 py-0.5 bg-[#0F172A] border border-[#1E293B] rounded text-slate-400">esc</kbd>
              <span>to exit</span>
            </div>
          </div>

          {/* Search Results List */}
          <Command.List className="max-h-[60vh] sm:max-h-[420px] overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            <Command.Empty className="py-12 text-center text-slate-400 text-xs font-mono space-y-1">
              <p className="text-slate-300 text-sm font-semibold">No matching mechanical simulators found.</p>
              <p className="text-slate-500">
                Try searching for <span className="text-[#06B6D4]">API 610</span>, <span className="text-[#06B6D4]">Compressor</span>, <span className="text-[#06B6D4]">Surge</span>, or <span className="text-[#06B6D4]">Vibration</span>.
              </p>
            </Command.Empty>

            <Command.Group heading="" className="space-y-1">
              {mechanicalSims.map((sim) => {
                const diffBadge = getDifficultyBadge(sim.difficulty);
                const IconComponent = sim.icon;
                const isSelected = currentRoute === sim.route;

                // Search indexing string
                const searchKeywords = `${sim.simulatorId} ${sim.name} ${sim.standardTag} ${sim.isoApiCode} ${sim.category} ${sim.subCategory} ${sim.difficulty} ${sim.tagline} ${sim.description} ${sim.keyOutputs.join(' ')}`;

                return (
                  <Command.Item
                    key={sim.id}
                    value={searchKeywords}
                    onSelect={() => handleSelectSimulator(sim)}
                    className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-[#0B1220]/70 hover:bg-[#111C30] hover:border-[#06B6D4]/50 data-[selected=true]:bg-[#111C30] data-[selected=true]:border-[#06B6D4] transition-all cursor-pointer gap-2 sm:gap-3"
                  >
                    {/* Left: Icon & Main Identity */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#0F172A] border border-[#1E293B] group-hover:border-[#06B6D4]/60 group-data-[selected=true]:border-[#06B6D4] flex items-center justify-center text-[#06B6D4] shrink-0 shadow-sm transition-colors">
                        {IconComponent ? (
                          <IconComponent className="w-4 h-4" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        {/* Row 1: Simulator ID, API/ISO Standard Tag, Difficulty Chip */}
                        <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
                          {/* 1. Simulator ID (Prominent Monospace) */}
                          <span className="font-mono text-[11px] font-extrabold text-[#06B6D4] tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                            {sim.simulatorId}
                          </span>

                          {/* 2. API / ISO Code Tag */}
                          <span className="font-mono text-[10px] font-semibold text-slate-300 px-1.5 py-0.5 rounded bg-[#162238] border border-[#233554]">
                            {sim.standardTag}
                          </span>

                          {/* 3. Difficulty Chip */}
                          <span
                            className={`inline-flex items-center gap-1 text-[9.5px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${diffBadge.className}`}
                          >
                            <span className={`w-1 h-1 rounded-full ${diffBadge.dot}`} />
                            {diffBadge.label}
                          </span>

                          {isSelected && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                              Current Lab
                            </span>
                          )}
                        </div>

                        {/* Row 2: Equipment Name */}
                        <div className="text-xs sm:text-[13px] font-bold text-slate-100 group-hover:text-white group-data-[selected=true]:text-[#22D3EE] transition-colors truncate">
                          {sim.name}
                        </div>

                        {/* Row 3: Tagline */}
                        <div className="text-[11px] text-slate-400 group-hover:text-slate-300 truncate">
                          {sim.tagline}
                        </div>
                      </div>
                    </div>

                    {/* Right: Route Link & Action Badge */}
                    <div className="flex sm:flex-col items-end justify-between sm:justify-center shrink-0 text-right pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                      <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 group-hover:text-cyan-300 font-semibold">
                        <span className="hidden sm:inline">Launch Lab</span>
                        <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <span className="text-[9.5px] font-mono text-slate-500 group-hover:text-slate-400 truncate max-w-[150px]">
                        {sim.route}
                      </span>
                    </div>
                  </Command.Item>
                );
              })}
            </Command.Group>
          </Command.List>

          {/* Footer Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#060A13] border-t border-[#1E293B] text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <CornerDownLeft className="w-3 h-3 text-[#06B6D4]" />
              <span>Press <strong className="text-slate-200">Enter</strong> to open route</span>
            </div>
            <div className="text-slate-500 text-[10px]">
              Direct route: <code className="text-[#06B6D4]">/mechanical/lab/[id]</code>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
};
