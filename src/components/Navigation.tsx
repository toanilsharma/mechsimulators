import React, { useState, useRef, useEffect } from 'react';
import { RouteId, SimulatorId } from '../types/common';
import { useApp } from '../context/AppContext';
import { machineryAcoustics } from '../utils/machineryAcoustics';
import {
  Sparkles,
  Activity,
  RotateCw,
  Maximize2,
  ShieldCheck,
  FileText,
  RotateCcw,
  Info,
  Layers,
  Cpu,
  Target,
  Wrench,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Network,
  Wind,
  Disc,
  Compass,
  Cog,
  Flame,
  Search,
  ChevronDown,
  ExternalLink,
  Volume2,
  VolumeX,
  Menu,
  X,
  Globe,
  Sliders,
  Radio,
  ArrowRight,
} from 'lucide-react';

interface NavigationProps {
  onOpenAudit: () => void;
  onOpenReport: () => void;
  onOpenInfo: () => void;
  onOpenCommandPalette?: () => void;
  onResetDefaults?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  onOpenAudit,
  onOpenReport,
  onOpenInfo,
  onOpenCommandPalette,
  onResetDefaults,
}) => {
  const {
    activeRoute,
    setActiveRoute,
    unitSystem,
    toggleUnitSystem,
    isLearningMode,
    toggleLearningMode,
    setIsDiagnosticModalOpen,
    setIsCaseStudiesModalOpen,
    setIsReliabilityStudioOpen,
    setIsMachineryTrainStudioOpen,
    setIsSpectralLabOpen,
    setIsTransientModalOpen,
    setIsKineticCutawayOpen,
    setIsFleetMatrixOpen,
    setIsRcaStudioOpen,
    setIsTribologyLabOpen,
    setIsMonteCarloOpen,
    setIsExergyCarbonOpen,
    setIsComparatorOpen,
  } = useApp();

  // Dropdown states
  const [isDisciplinesOpen, setIsDisciplinesOpen] = useState(false);
  const [isLabsOpen, setIsLabsOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Audio FX state matching parent website
  const [isFxMuted, setIsFxMuted] = useState<boolean>(machineryAcoustics.getIsMuted());
  const [fxVolume, setFxVolume] = useState<number>(machineryAcoustics.getVolume());
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);

  const disciplinesRef = useRef<HTMLDivElement>(null);
  const labsRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (disciplinesRef.current && !disciplinesRef.current.contains(e.target as Node)) {
        setIsDisciplinesOpen(false);
      }
      if (labsRef.current && !labsRef.current.contains(e.target as Node)) {
        setIsLabsOpen(false);
      }
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const disciplines = [
    { name: 'Electrical Engineering', code: 'EE-200', href: 'https://livesimulators.com/department/electrical', desc: 'Circuits, RF Lines, 3-Phase Grids' },
    { name: 'Mechanical Systems', code: 'ME-400', href: 'https://livesimulators.com/department/mechanical', desc: 'Vibrations, Gears, Cycles & Turbomachinery', isCurrent: true },
    { name: 'Control & Signals', code: 'CS-300', href: 'https://livesimulators.com/department/control', desc: 'PID Tuning, Bode, Nyquist & Root Locus' },
    { name: 'Chemical & Process', code: 'CH-250', href: 'https://livesimulators.com/department/chemical', desc: 'CSTR Kinetics, Distillation, Exchangers' },
    { name: 'Civil & Structural', code: 'CE-320', href: 'https://livesimulators.com/department/civil', desc: 'Beam Bending, Trusses & Seismic Drift' },
    { name: 'Quantum & Physics', code: 'PH-500', href: 'https://livesimulators.com/department/physics', desc: 'P-N Band Bending, SiC MOSFETs, Photoelectric' },
  ];

  const parentLabs = [
    { name: 'Power Electronics Lab', href: 'https://livesimulators.com/lab/power-electronics-lab', desc: '8 Switching Topologies & PWM' },
    { name: 'Power Systems Lab', href: 'https://livesimulators.com/lab/power-systems-lab', desc: '25 Grid Flow & Swing Stability Solvers' },
    { name: 'SafeOps UPS Lab', href: 'https://livesimulators.com/lab/safeops-ups', desc: 'Double-Conversion & Static Bypass' },
    { name: 'ElectroLive Electrical Safety', href: 'https://livesimulators.com/lab/electrolive-electrical-safety', desc: 'NFPA 70E Arc Flash Boundary' },
    { name: 'Mechanical Reliability Lab', href: '#', isCurrent: true, desc: '11 Digital Twins • Turbomachinery' },
  ];

  const primarySimulators: {
    id: SimulatorId;
    name: string;
    shortName: string;
    icon: React.ElementType;
    standard: string;
  }[] = [
    {
      id: 'pump',
      name: 'Pump Cavitation & NPSH',
      shortName: 'Pump NPSH',
      icon: Activity,
      standard: 'API 610',
    },
    {
      id: 'compressor',
      name: 'Centrifugal Compressor Surge',
      shortName: 'Compressor Surge',
      icon: Wind,
      standard: 'API 617',
    },
    {
      id: 'recip',
      name: 'Reciprocating Compressor PV & Pulsation',
      shortName: 'Recip PV',
      icon: Cpu,
      standard: 'API 618',
    },
    {
      id: 'gearbox',
      name: 'Industrial Gearbox & Gear Mesh Diagnostics',
      shortName: 'Gearbox Mesh',
      icon: Cog,
      standard: 'AGMA 2001',
    },
    {
      id: 'turbine',
      name: 'Steam Turbine Thermodynamics & Dynamics',
      shortName: 'Steam Turbine',
      icon: Flame,
      standard: 'API 612',
    },
    {
      id: 'bearing',
      name: 'Rolling Element Bearing Faults',
      shortName: 'Bearing Faults',
      icon: Disc,
      standard: 'ISO 281',
    },
    {
      id: 'journal',
      name: 'Hydrodynamic Journal Bearings & Whirl',
      shortName: 'Journal Bearing',
      icon: Compass,
      standard: 'API 684',
    },
    {
      id: 'rotor',
      name: 'Rotor Dynamics & Bearings',
      shortName: 'Rotor Dynamics',
      icon: RotateCw,
      standard: 'ISO 1940',
    },
    {
      id: 'pipe',
      name: 'Pipe Thermal Stress',
      shortName: 'Pipe Stress',
      icon: Maximize2,
      standard: 'ASME B31.3',
    },
    {
      id: 'seal',
      name: 'API 682 Seal Flush',
      shortName: 'Seal Flush',
      icon: ShieldCheck,
      standard: 'API 682',
    },
    {
      id: 'alignment',
      name: 'Shaft Alignment & Coupling',
      shortName: 'Shaft Alignment',
      icon: Target,
      standard: 'API 686',
    },
  ];

  return (
    <header
      id="app-header"
      className="sticky top-0 h-[54px] min-h-[54px] max-h-[54px] bg-[#0A1222]/95 backdrop-blur-xl border-b border-[#1E3A5F]/80 shadow-[0_4px_24px_rgba(0,0,0,0.7),0_1px_0_rgba(6,182,212,0.15)] text-slate-200 px-3 sm:px-5 md:px-6 lg:px-8 flex items-center justify-between gap-2 select-none shrink-0 z-40 pt-safe pl-safe pr-safe font-sans relative"
    >
      {/* Top subtle cyber-accent edge highlight line */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/70 to-transparent pointer-events-none" />

      {/* 1. Exact Parent Brand & Department Pill */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => {
            setActiveRoute('home');
            setIsMobileMenuOpen(false);
          }}
          className="flex items-center gap-2 group cursor-pointer text-left"
          title="Go to LiveSimulators Mechanical Home"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.18)] group-hover:scale-105 transition-transform shrink-0">
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-base sm:text-lg font-bold text-white tracking-tight">
              LiveSimulators<span className="text-cyan-400">.com</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              MECH LAB
            </span>
          </div>
        </button>

        {/* Disciplines Dropdown */}
        <div className="relative hidden xl:block" ref={disciplinesRef}>
          <button
            onClick={() => setIsDisciplinesOpen(!isDisciplinesOpen)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <span>Disciplines</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDisciplinesOpen ? 'rotate-180 text-cyan-400' : ''}`} />
          </button>

          {isDisciplinesOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-64 bg-[#0d1322] border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-2 py-1 border-b border-slate-800">
                LiveSimulators Departments
              </div>
              <div className="mt-1 space-y-1">
                {disciplines.map((d) => (
                  <a
                    key={d.code}
                    href={d.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      d.isCurrent
                        ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{d.name}</span>
                      <span className="text-[9px] font-mono text-cyan-400">{d.code}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{d.desc}</div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Specialized Labs Dropdown */}
        <div className="relative hidden xl:block" ref={labsRef}>
          <button
            onClick={() => setIsLabsOpen(!isLabsOpen)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <span>Labs</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isLabsOpen ? 'rotate-180 text-cyan-400' : ''}`} />
          </button>

          {isLabsOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-64 bg-[#0d1322] border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-2 py-1 border-b border-slate-800">
                Interactive Engineering Labs
              </div>
              <div className="mt-1 space-y-1">
                {parentLabs.map((lab, i) => (
                  <a
                    key={i}
                    href={lab.href}
                    target={lab.isCurrent ? undefined : '_blank'}
                    rel={lab.isCurrent ? undefined : 'noopener noreferrer'}
                    onClick={(e) => {
                      if (lab.isCurrent) {
                        e.preventDefault();
                        setActiveRoute('home');
                        setIsLabsOpen(false);
                      }
                    }}
                    className={`block px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      lab.isCurrent
                        ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{lab.name}</span>
                      {lab.isCurrent ? (
                        <span className="text-[9px] font-mono px-1 py-0.2 bg-cyan-500/20 text-cyan-300 rounded">Active</span>
                      ) : (
                        <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{lab.desc}</div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Simulator Cockpit Tabs */}
      <nav className="flex items-center gap-1 bg-[#0f172a]/80 p-0.5 rounded-lg border border-slate-800/90 overflow-x-auto max-w-[50vw] sm:max-w-none custom-scrollbar">
        {/* Home / Directory Landing Button */}
        <button
          onClick={() => setActiveRoute('home')}
          className={`flex items-center gap-1.5 px-2.5 py-1 min-h-[30px] rounded-md text-xs font-mono transition-all whitespace-nowrap touch-manipulation cursor-pointer ${
            activeRoute === 'home' || activeRoute === 'portal'
              ? 'bg-cyan-400 text-slate-950 font-bold shadow-sm shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Mechanical Simulators Directory"
        >
          <Globe size={13} className={activeRoute === 'home' || activeRoute === 'portal' ? 'text-slate-950' : 'text-cyan-400'} />
          <span>Home</span>
        </button>

        {/* Mission Control Workbench Button */}
        <button
          onClick={() => setActiveRoute('workbench')}
          className={`flex items-center gap-1.5 px-2.5 py-1 min-h-[30px] rounded-md text-xs font-mono transition-all whitespace-nowrap touch-manipulation cursor-pointer ${
            activeRoute === 'workbench'
              ? 'bg-cyan-400 text-slate-950 font-bold shadow-sm shadow-cyan-500/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Mission Control Simulator Workbench"
        >
          <Sliders size={13} className={activeRoute === 'workbench' ? 'text-slate-950' : 'text-cyan-400'} />
          <span>Workbench</span>
        </button>

        {primarySimulators.map((sim) => {
          const Icon = sim.icon;
          const isActive = activeRoute === sim.id;
          return (
            <button
              key={sim.id}
              onClick={() => setActiveRoute(sim.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 min-h-[30px] rounded-md text-xs font-mono transition-all whitespace-nowrap touch-manipulation cursor-pointer ${
                isActive
                  ? 'bg-cyan-400 text-slate-950 font-bold shadow-sm shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon size={13} className={isActive ? 'text-slate-950' : 'text-cyan-400'} />
              <span className="hidden sm:inline">{sim.shortName}</span>
              <span className="sm:hidden">{sim.shortName.split(' ')[0]}</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-mono hidden xl:inline ${
                  isActive ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
                }`}
              >
                {sim.standard}
              </span>
            </button>
          );
        })}
      </nav>

      {/* 3. Right Utility Cluster Matching livesimulators.com */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Audio FX Toggle (Exact match to livesimulators.com) */}
        <div
          className="relative"
          onMouseEnter={() => setShowVolumeSlider(true)}
          onMouseLeave={() => setShowVolumeSlider(false)}
        >
          <button
            onClick={handleToggleFx}
            className={`flex items-center gap-1.5 px-2.5 py-1 min-h-[30px] rounded-lg border transition-all text-xs font-mono group cursor-pointer ${
              isFxMuted
                ? 'border-slate-800 bg-slate-900/60 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                : 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
            }`}
            title={isFxMuted ? 'Unmute physics sound effects' : 'Mute physics sound effects'}
            aria-label={isFxMuted ? 'Unmute audio' : 'Mute audio'}
            id="nav-audio-toggle-btn"
          >
            {isFxMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            )}
            <span className="hidden md:inline text-[11px] font-bold">
              {isFxMuted ? 'FX OFF' : 'FX ON'}
            </span>
          </button>

          {/* Volume Slider Popover on Hover */}
          {showVolumeSlider && (
            <div className="absolute top-full mt-1 right-0 w-44 bg-[#0d1322] border border-slate-700 p-2.5 rounded-xl shadow-2xl z-50 text-xs font-mono space-y-1.5">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Sound FX Volume</span>
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
              <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-800">
                Vapor collapse & 1X shaft harmonics
              </div>
            </div>
          )}
        </div>

        {/* Search Command Palette Trigger (Cmd+K or /) */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            title="Search all simulators (Ctrl+K or /)"
            id="nav-search-btn"
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1 min-h-[30px] rounded-lg border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono transition-all group cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] text-slate-400 bg-slate-800 border border-slate-700 rounded font-mono">
              /
            </kbd>
          </button>
        )}

        {/* Guided Learning Mode Toggle */}
        <button
          onClick={toggleLearningMode}
          title={
            isLearningMode
              ? 'Guided Learning Mode Active (Click to switch to Expert Mode)'
              : 'Click to enable Guided Learning Mode'
          }
          className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 min-h-[30px] rounded-lg text-xs font-mono transition-colors cursor-pointer border ${
            isLearningMode
              ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 font-bold shadow-sm'
              : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 text-slate-400 hover:text-white'
          }`}
        >
          <GraduationCap size={13} className={isLearningMode ? 'text-amber-400' : 'text-slate-400'} />
          <span className="text-[11px]">{isLearningMode ? 'Guide: ON' : 'Guide: OFF'}</span>
        </button>

        {/* Advanced Engineering Tools Dropdown */}
        <div className="relative hidden md:block" ref={toolsRef}>
          <button
            onClick={() => setIsToolsOpen(!isToolsOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 min-h-[30px] rounded-lg border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono transition-all cursor-pointer"
            title="Advanced Engineering Studios & Calculators"
          >
            <Sliders size={13} className="text-cyan-400" />
            <span className="hidden lg:inline text-[11px]">Studios</span>
            <ChevronDown size={12} className={`text-slate-400 transition-transform ${isToolsOpen ? 'rotate-180 text-cyan-400' : ''}`} />
          </button>

          {isToolsOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-72 bg-[#0d1322] border border-slate-700/80 rounded-xl shadow-2xl p-2.5 z-50 text-xs font-mono space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider px-2 py-0.5 border-b border-slate-800">
                Engineering Verification & Studios
              </div>
              <div className="grid grid-cols-2 gap-1 pt-1">
                <button
                  onClick={() => { onOpenAudit(); setIsToolsOpen(false); }}
                  className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-slate-800 text-left text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <FileText size={13} className="text-cyan-400 shrink-0" />
                  <span className="text-[11px]">Audit Trail</span>
                </button>
                <button
                  onClick={() => { onOpenReport(); setIsToolsOpen(false); }}
                  className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-slate-800 text-left text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <FileText size={13} className="text-emerald-400 shrink-0" />
                  <span className="text-[11px]">Print Report</span>
                </button>
                <button
                  onClick={() => { setIsDiagnosticModalOpen(true); setIsToolsOpen(false); }}
                  className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-slate-800 text-left text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <Wrench size={13} className="text-amber-400 shrink-0" />
                  <span className="text-[11px]">Diagnostics</span>
                </button>
                <button
                  onClick={() => { setIsCaseStudiesModalOpen(true); setIsToolsOpen(false); }}
                  className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-slate-800 text-left text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <BookOpen size={13} className="text-rose-400 shrink-0" />
                  <span className="text-[11px]">Case Studies</span>
                </button>
                <button
                  onClick={() => { setIsReliabilityStudioOpen(true); setIsToolsOpen(false); }}
                  className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-slate-800 text-left text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <TrendingUp size={13} className="text-emerald-400 shrink-0" />
                  <span className="text-[11px]">Reliability β</span>
                </button>
                <button
                  onClick={() => { setIsMachineryTrainStudioOpen(true); setIsToolsOpen(false); }}
                  className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-slate-800 text-left text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <Network size={13} className="text-blue-400 shrink-0" />
                  <span className="text-[11px]">Train Cascade</span>
                </button>
                <button
                  onClick={() => { setIsSpectralLabOpen(true); setIsToolsOpen(false); }}
                  className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-slate-800 text-left text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <Activity size={13} className="text-indigo-400 shrink-0" />
                  <span className="text-[11px]">Spectral Lab</span>
                </button>
                <button
                  onClick={() => { setIsFleetMatrixOpen(true); setIsToolsOpen(false); }}
                  className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-slate-800 text-left text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <Layers size={13} className="text-teal-400 shrink-0" />
                  <span className="text-[11px]">Fleet Matrix</span>
                </button>
                <button
                  onClick={() => { setIsRcaStudioOpen(true); setIsToolsOpen(false); }}
                  className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-slate-800 text-left text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <Wrench size={13} className="text-amber-400 shrink-0" />
                  <span className="text-[11px]">RCA 5-Whys</span>
                </button>
                <button
                  onClick={() => { setIsKineticCutawayOpen(true); setIsToolsOpen(false); }}
                  className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-slate-800 text-left text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <Disc size={13} className="text-sky-400 shrink-0" />
                  <span className="text-[11px]">3D Cutaway</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Explore Simulators CTA (Matches livesimulators.com button) */}
        <button
          onClick={() => setActiveRoute('home')}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-1 min-h-[30px] text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-500 rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] font-display shrink-0 cursor-pointer"
          id="nav-explore-simulators-cta"
        >
          <span>Explore Simulators</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        {/* Mobile menu hamburger */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white rounded-lg border border-slate-800 bg-slate-900 active:bg-slate-800 cursor-pointer"
          aria-label="Toggle navigation"
          id="mobile-menu-toggle"
        >
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-[52px] left-0 right-0 border-b border-slate-800 bg-[#080d17] px-4 pt-3 pb-6 space-y-4 font-sans shadow-2xl max-h-[85vh] overflow-y-auto z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            All 11 Mechanical Simulators
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {primarySimulators.map((sim) => (
              <button
                key={sim.id}
                onClick={() => {
                  setActiveRoute(sim.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-left text-xs font-mono transition-all ${
                  activeRoute === sim.id
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <sim.icon size={14} className={activeRoute === sim.id ? 'text-cyan-400' : 'text-slate-400'} />
                  <span>{sim.name}</span>
                </div>
                <span className="text-[9px] px-1 py-0.5 rounded bg-slate-800 text-slate-400">
                  {sim.standard}
                </span>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Engineering Disciplines
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {disciplines.map((d) => (
                <a
                  key={d.code}
                  href={d.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-slate-300 hover:text-cyan-300 flex items-center justify-between"
                >
                  <span>{d.name}</span>
                  <span className="text-[9px] font-mono text-cyan-400">{d.code}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
