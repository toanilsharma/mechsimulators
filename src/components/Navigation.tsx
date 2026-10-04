import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Calculator,
  BarChart3,
  SlidersHorizontal,
  Zap,
  Home,
} from 'lucide-react';

interface NavigationProps {
  onOpenAudit: () => void;
  onOpenReport: () => void;
  onOpenInfo: () => void;
  onOpenCommandPalette?: () => void;
  onResetDefaults?: () => void;
}

type DropdownKey = 'classes' | 'domains' | 'labs' | 'studios' | 'ecosystem' | null;

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

  // Active mega dropdown state
  const [activeDropdown, setActiveDropdown] = useState<DropdownKey>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Audio FX state matching parent website
  const [isFxMuted, setIsFxMuted] = useState<boolean>(machineryAcoustics.getIsMuted());
  const [fxVolume, setFxVolume] = useState<number>(machineryAcoustics.getVolume());
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);

  // Smooth hover open / close management
  const handleMouseEnterNav = (key: DropdownKey) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveDropdown(key);
  };

  const handleMouseLeaveNav = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 180);
  };

  const handleDropdownContentEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleDropdownContentLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 180);
  };

  // Close on ESC key or outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  const navigateAndClose = (route: RouteId | SimulatorId) => {
    setActiveRoute(route as any);
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 11 Simulators metadata
  const simulatorsList: {
    id: SimulatorId;
    name: string;
    shortName: string;
    standard: string;
    category: string;
    desc: string;
    icon: React.ElementType;
  }[] = [
    {
      id: 'pump',
      name: 'Pump Cavitation & NPSH',
      shortName: 'Pump NPSH',
      standard: 'API 610',
      category: 'Turbomachinery',
      desc: 'NPSHa vs NPSHr margin, bubble collapse & impeller pitting.',
      icon: Activity,
    },
    {
      id: 'compressor',
      name: 'Compressor Surge Dynamics',
      shortName: 'Compressor Surge',
      standard: 'API 617',
      category: 'Turbomachinery',
      desc: 'SLL / SCL safety limits, ASV modulation & flow reversal.',
      icon: Wind,
    },
    {
      id: 'turbine',
      name: 'Steam Turbine Thermodynamics',
      shortName: 'Steam Turbine',
      standard: 'API 612',
      category: 'Turbomachinery',
      desc: 'Mollier isentropic expansion, Willans line & blade erosion.',
      icon: Flame,
    },
    {
      id: 'bearing',
      name: 'Bearing Fault Vibration',
      shortName: 'Bearing Faults',
      standard: 'ISO 281',
      category: 'Vibration & Dynamics',
      desc: 'BPFO, BPFI, BSF, FTF ball pass frequencies & L10 rating life.',
      icon: Disc,
    },
    {
      id: 'journal',
      name: 'Journal Bearing Oil Whirl',
      shortName: 'Journal Bearing',
      standard: 'API 684',
      category: 'Vibration & Dynamics',
      desc: '2D Reynolds lubrication, Sommerfeld number & whip stability.',
      icon: Compass,
    },
    {
      id: 'rotor',
      name: 'Rotor Resonant Balancing',
      shortName: 'Rotor Balancing',
      standard: 'ISO 1940',
      category: 'Vibration & Dynamics',
      desc: 'Grade G2.5 permissible unbalance & 1X centrifugal forces.',
      icon: RotateCw,
    },
    {
      id: 'gearbox',
      name: 'Gearbox Mesh & Safety',
      shortName: 'Gearbox Mesh',
      standard: 'AGMA 2001',
      category: 'Drivetrain',
      desc: 'Gear mesh frequencies (GMF), bending & contact pitting safety.',
      icon: Cog,
    },
    {
      id: 'alignment',
      name: 'Shaft Laser Alignment',
      shortName: 'Laser Alignment',
      standard: 'API 686',
      category: 'Drivetrain',
      desc: 'Cold offset compensation, thermal growth & shim corrections.',
      icon: Target,
    },
    {
      id: 'pipe',
      name: 'Piping Thermal Stress',
      shortName: 'Pipe Stress',
      standard: 'ASME B31.3',
      category: 'Piping & Pressure',
      desc: 'Thermal flexibility, displacement stress range & anchor loads.',
      icon: Maximize2,
    },
    {
      id: 'seal',
      name: 'Mechanical Seal Flush',
      shortName: 'Seal Flush',
      standard: 'API 682',
      category: 'Piping & Pressure',
      desc: 'Piping Plans 11-62, face heat dissipation & vapor margin.',
      icon: ShieldCheck,
    },
    {
      id: 'recip',
      name: 'Reciprocating Compressor PV',
      shortName: 'Recip Compressor',
      standard: 'API 618',
      category: 'Reciprocating',
      desc: 'Cylinder indicator PV card, rod load reversal & pulsation.',
      icon: Cpu,
    },
  ];

  const parentDisciplines = [
    { name: 'Electrical Engineering', code: 'EE-200', href: 'https://livesimulators.com/department/electrical', desc: 'Circuits, RF Transmission, 3-Phase Grids' },
    { name: 'Mechanical Systems', code: 'ME-400', href: 'https://mech.livesimulators.com', desc: 'Turbomachinery, Vibrations, Bearings & Piping', isCurrent: true },
    { name: 'Control & Signals', code: 'CS-300', href: 'https://livesimulators.com/department/control', desc: 'PID Loop Tuning, Bode, Nyquist & Root Locus' },
    { name: 'Chemical & Process', code: 'CH-250', href: 'https://livesimulators.com/department/chemical', desc: 'CSTR Kinetics, Distillation & Heat Exchangers' },
    { name: 'Civil & Structural', code: 'CE-320', href: 'https://livesimulators.com/department/civil', desc: 'Beam Shear, Trusses & Earthquake Drift' },
    { name: 'Quantum & Physics', code: 'PH-500', href: 'https://livesimulators.com/department/physics', desc: 'Semiconductors, Band Gaps & Photoelectric' },
  ];

  return (
    <div className="w-full select-none z-50 sticky top-0 font-sans" onMouseLeave={handleMouseLeaveNav}>
      {/* ========================================================
          1. TOP NOTIFICATION RIBBON (Matches mathtimelab.netlify.app)
          ======================================================== */}
      <div className="w-full bg-[#050A14] border-b border-[#142238] py-1 px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
            API • ASME • AGMA • ISO Referencing
          </span>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="hidden md:inline text-slate-400">11 Physics-Verified Digital Twins</span>
          <span className="text-slate-600 hidden lg:inline">|</span>
          <span className="hidden lg:inline text-cyan-400 font-medium">Zero Sign-Up • 100% Free Open Educational Access</span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-emerald-400 font-bold hidden sm:inline">FLOAT64 ODE SOLVER</span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-300 hidden md:inline">11 LABS ACTIVE</span>
          <span className="text-slate-600 hidden md:inline">|</span>
          <button
            onClick={() => navigateAndClose('standards')}
            className="text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer transition-colors"
          >
            Standards &amp; Codes &rarr;
          </button>
          <span className="text-slate-600">|</span>
          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            LIVE
          </span>
        </div>
      </div>

      {/* ========================================================
          2. MAIN HEADER BAR (Premium Dark Obsidian Theme)
          ======================================================== */}
      <header
        id="app-header"
        className="h-[58px] min-h-[58px] bg-[#070D1A]/95 backdrop-blur-xl border-b border-[#1A2E4C] text-slate-200 px-3 sm:px-5 md:px-6 lg:px-8 flex items-center justify-between gap-3 shadow-[0_4px_30px_rgba(0,0,0,0.85)] relative z-40"
      >
        {/* Left Side Header Cluster: Big Home Page Button + Small LiveSimulators.com Parent Link */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Big Home Page Button */}
          <button
            onClick={() => navigateAndClose('home')}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer text-left group ${
              activeRoute === 'home'
                ? 'bg-gradient-to-r from-cyan-950/90 to-blue-950/70 border-cyan-400 text-white shadow-[0_0_18px_rgba(6,182,212,0.35)]'
                : 'bg-slate-900/80 border-slate-700/80 hover:border-cyan-400 text-slate-200 hover:bg-slate-800 hover:shadow-[0_0_14px_rgba(6,182,212,0.2)]'
            }`}
            title="Return to Mechanical Engineering Twins Homepage from anywhere"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-slate-950 shadow-[0_0_14px_rgba(6,182,212,0.4)] group-hover:scale-105 transition-transform shrink-0">
              <Home className="w-4.5 h-4.5 text-slate-950 stroke-[2.2]" />
            </div>
            <div className="flex flex-col text-left leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-sm font-extrabold text-white tracking-wide group-hover:text-cyan-300 transition-colors">
                  HOME
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-950 border border-cyan-500/60 text-cyan-300 tracking-wider">
                  MECH LAB
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-300">
                11 Digital Twins
              </span>
            </div>
          </button>

          {/* Small Parent Website Link */}
          <a
            href="https://livesimulators.com"
            target="_blank"
            rel="noopener noreferrer"
            title="Visit parent ecosystem website: LiveSimulators.com"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-slate-400 hover:text-cyan-300 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 transition-all shrink-0 group no-underline"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
            <span className="font-semibold">LiveSimulators<span className="text-cyan-400">.com</span></span>
            <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </a>
        </div>

        {/* Center Mega-Dropdown Navigation Triggers (Hover-Activated) */}
        <nav className="hidden lg:flex items-center gap-1.5">
          {/* Dropdown 1: Equipment Classes */}
          <button
            onMouseEnter={() => handleMouseEnterNav('classes')}
            onClick={() => setActiveDropdown(activeDropdown === 'classes' ? null : 'classes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-display tracking-wide transition-all cursor-pointer border ${
              activeDropdown === 'classes'
                ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Equipment Classes</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${activeDropdown === 'classes' ? 'rotate-180 text-cyan-400' : ''}`} />
          </button>

          {/* Dropdown 2: Engineering Domains */}
          <button
            onMouseEnter={() => handleMouseEnterNav('domains')}
            onClick={() => setActiveDropdown(activeDropdown === 'domains' ? null : 'domains')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-display tracking-wide transition-all cursor-pointer border ${
              activeDropdown === 'domains'
                ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Engineering Domains</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${activeDropdown === 'domains' ? 'rotate-180 text-emerald-400' : ''}`} />
          </button>

          {/* Dropdown 3: All 11 Digital Twins (strictly 2 lines: All 11 / Digital Twins) */}
          <button
            onMouseEnter={() => handleMouseEnterNav('labs')}
            onClick={() => setActiveDropdown(activeDropdown === 'labs' ? null : 'labs')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-display tracking-wide transition-all cursor-pointer border shrink-0 ${
              activeDropdown === 'labs'
                ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <div className="flex flex-col text-left leading-none">
              <span className="text-[10px] font-mono font-bold text-cyan-400 whitespace-nowrap">All 11</span>
              <span className="text-xs font-semibold whitespace-nowrap text-slate-200 mt-0.5">Digital Twins</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${activeDropdown === 'labs' ? 'rotate-180 text-sky-400' : ''}`} />
          </button>

          {/* Dropdown 4: Studios & Verification */}
          <button
            onMouseEnter={() => handleMouseEnterNav('studios')}
            onClick={() => setActiveDropdown(activeDropdown === 'studios' ? null : 'studios')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-display tracking-wide transition-all cursor-pointer border ${
              activeDropdown === 'studios'
                ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Studios &amp; Tools</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${activeDropdown === 'studios' ? 'rotate-180 text-amber-400' : ''}`} />
          </button>

          {/* Dropdown 5: Ecosystem & Portals */}
          <button
            onMouseEnter={() => handleMouseEnterNav('ecosystem')}
            onClick={() => setActiveDropdown(activeDropdown === 'ecosystem' ? null : 'ecosystem')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-display tracking-wide transition-all cursor-pointer border ${
              activeDropdown === 'ecosystem'
                ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-purple-400" />
            <span>Ecosystem</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${activeDropdown === 'ecosystem' ? 'rotate-180 text-purple-400' : ''}`} />
          </button>

          {/* Direct Link: Mission Control */}
          <button
            onClick={() => navigateAndClose('workbench')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold font-display tracking-wide transition-all cursor-pointer ${
              activeRoute === 'workbench'
                ? 'bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>Workbench</span>
          </button>
        </nav>

        {/* Right Utility Cluster: Search, Audio FX, Units & CTA */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search Button (Triggers Command Palette) */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              title="Search all 11 simulators (Ctrl+K or /)"
              id="nav-search-btn"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700/80 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono transition-all group cursor-pointer shadow-inner"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              <span className="hidden xl:inline text-slate-300 font-sans">Search 11 Digital Twins...</span>
              <span className="xl:hidden hidden sm:inline text-slate-400">Search</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] text-cyan-400 bg-slate-950 border border-slate-700 rounded font-mono font-bold">
                Ctrl+K
              </kbd>
            </button>
          )}

          {/* Audio FX Acoustics Toggle with Volume Popover on Hover */}
          <div
            className="relative"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <button
              onClick={handleToggleFx}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all text-xs font-mono group cursor-pointer ${
                isFxMuted
                  ? 'border-slate-800 bg-slate-900/60 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                  : 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
              }`}
              title={isFxMuted ? 'Unmute physics sound effects' : 'Mute physics sound effects'}
              aria-label={isFxMuted ? 'Unmute audio' : 'Mute audio'}
            >
              {isFxMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              )}
              <span className="hidden 2xl:inline text-[10px] font-bold">
                {isFxMuted ? 'FX OFF' : 'FX ON'}
              </span>
            </button>

            {showVolumeSlider && (
              <div className="absolute top-full mt-1 right-0 w-44 bg-[#0A111F] border border-slate-700 p-2.5 rounded-xl shadow-2xl z-50 text-xs font-mono space-y-1.5 animate-in fade-in duration-100">
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
                  Cavitation &amp; shaft acoustics
                </div>
              </div>
            )}
          </div>

          {/* Explore Simulators CTA Button */}
          <button
            onClick={() => navigateAndClose('home')}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 active:from-cyan-500 active:to-cyan-400 rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] font-display shrink-0 cursor-pointer"
          >
            <span>Explore 11 Simulators</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden w-9 h-9 flex items-center justify-center text-slate-300 hover:text-white rounded-lg border border-slate-800 bg-slate-900 active:bg-slate-800 cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ========================================================
          3. COMPACT MEGA DROPDOWN PANELS (Smart, Small & Cardless)
          Refined header sub-section matching mathtimelab.netlify.app
          ======================================================== */}
      {activeDropdown && (
        <div
          onMouseEnter={handleDropdownContentEnter}
          onMouseLeave={handleDropdownContentLeave}
          className="w-full bg-white text-slate-900 border-b border-slate-300 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.35)] animate-in fade-in slide-in-from-top-1 duration-150 relative z-50 font-sans"
        >
          {/* Top Divider Cyan Laser Strip */}
          <div className="w-full h-[2px] bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500" />

          {/* Ultra-Thin Header Banner */}
          <div className="border-b border-slate-200 bg-slate-50/90 px-6 sm:px-10 lg:px-12 py-1.5 flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                {activeDropdown === 'classes' && 'Equipment Classes & Governing Standards'}
                {activeDropdown === 'domains' && 'Subject Domains & Engineering Branches'}
                {activeDropdown === 'labs' && 'All 11 Mechanical Digital Twin Simulators'}
                {activeDropdown === 'studios' && 'Engineering Studios & Verification Tools'}
                {activeDropdown === 'ecosystem' && 'LiveSimulators Multi-Department Ecosystem'}
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-cyan-100 text-cyan-800 border border-cyan-300">
                {activeDropdown === 'classes' && 'API • ASME • AGMA • ISO'}
                {activeDropdown === 'domains' && '6 Engineering Branches'}
                {activeDropdown === 'labs' && '11 Models'}
                {activeDropdown === 'studios' && 'Audit Ready'}
                {activeDropdown === 'ecosystem' && 'Companion Portals'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-500 text-[10px]">
              <span className="hidden md:inline font-sans text-slate-500">
                Click any model to launch instantly
              </span>
              <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono font-medium">
                ESC to close
              </span>
            </div>
          </div>

          {/* ========================================================
              PANEL 1: EQUIPMENT CLASSES (5 Clean, Cardless Columns)
              ======================================================== */}
          {activeDropdown === 'classes' && (
            <div className="px-6 sm:px-10 lg:px-12 py-3.5 max-w-[1720px] mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* Column 1: Turbomachinery */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <span className="text-[10px] font-mono font-bold text-cyan-700 uppercase tracking-wider">
                      Turbomachinery
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">3 Models</span>
                  </div>
                  <ul className="space-y-1 text-xs">
                    <li>
                      <button
                        onClick={() => navigateAndClose('pump')}
                        className="w-full text-left flex items-center justify-between group py-0.5 hover:text-cyan-700 transition-colors cursor-pointer"
                      >
                        <span className="text-slate-800 group-hover:text-cyan-600 font-medium group-hover:translate-x-0.5 transition-all text-xs truncate">
                          • Pump Cavitation &amp; NPSH
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 ml-1">API 610</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateAndClose('compressor')}
                        className="w-full text-left flex items-center justify-between group py-0.5 hover:text-cyan-700 transition-colors cursor-pointer"
                      >
                        <span className="text-slate-800 group-hover:text-cyan-600 font-medium group-hover:translate-x-0.5 transition-all text-xs truncate">
                          • Compressor Surge Dynamics
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 ml-1">API 617</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateAndClose('turbine')}
                        className="w-full text-left flex items-center justify-between group py-0.5 hover:text-cyan-700 transition-colors cursor-pointer"
                      >
                        <span className="text-slate-800 group-hover:text-cyan-600 font-medium group-hover:translate-x-0.5 transition-all text-xs truncate">
                          • Steam Turbine Enthalpy
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 ml-1">API 612</span>
                      </button>
                    </li>
                  </ul>
                  <button
                    onClick={() => navigateAndClose('pump')}
                    className="text-[11px] font-semibold text-cyan-600 hover:text-cyan-800 flex items-center gap-1 pt-1 group cursor-pointer"
                  >
                    <span>Explore Turbomachinery</span>
                    <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {/* Column 2: Vibration & Bearings */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <span className="text-[10px] font-mono font-bold text-blue-700 uppercase tracking-wider">
                      Vibration &amp; Bearings
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">3 Models</span>
                  </div>
                  <ul className="space-y-1 text-xs">
                    <li>
                      <button
                        onClick={() => navigateAndClose('bearing')}
                        className="w-full text-left flex items-center justify-between group py-0.5 hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        <span className="text-slate-800 group-hover:text-blue-600 font-medium group-hover:translate-x-0.5 transition-all text-xs truncate">
                          • Bearing Fault Vibration
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 ml-1">ISO 281</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateAndClose('journal')}
                        className="w-full text-left flex items-center justify-between group py-0.5 hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        <span className="text-slate-800 group-hover:text-blue-600 font-medium group-hover:translate-x-0.5 transition-all text-xs truncate">
                          • Journal Bearing Oil Whirl
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 ml-1">API 684</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateAndClose('rotor')}
                        className="w-full text-left flex items-center justify-between group py-0.5 hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        <span className="text-slate-800 group-hover:text-blue-600 font-medium group-hover:translate-x-0.5 transition-all text-xs truncate">
                          • Rotor Resonant Balancing
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 ml-1">ISO 1940</span>
                      </button>
                    </li>
                  </ul>
                  <button
                    onClick={() => navigateAndClose('rotor')}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 pt-1 group cursor-pointer"
                  >
                    <span>Explore Vibration</span>
                    <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {/* Column 3: Drivetrain */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <span className="text-[10px] font-mono font-bold text-amber-700 uppercase tracking-wider">
                      Drivetrain &amp; Gearing
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">2 Models</span>
                  </div>
                  <ul className="space-y-1 text-xs">
                    <li>
                      <button
                        onClick={() => navigateAndClose('gearbox')}
                        className="w-full text-left flex items-center justify-between group py-0.5 hover:text-amber-700 transition-colors cursor-pointer"
                      >
                        <span className="text-slate-800 group-hover:text-amber-600 font-medium group-hover:translate-x-0.5 transition-all text-xs truncate">
                          • Gearbox Mesh &amp; AGMA
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 ml-1">AGMA 2001</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateAndClose('alignment')}
                        className="w-full text-left flex items-center justify-between group py-0.5 hover:text-amber-700 transition-colors cursor-pointer"
                      >
                        <span className="text-slate-800 group-hover:text-amber-600 font-medium group-hover:translate-x-0.5 transition-all text-xs truncate">
                          • Shaft Laser Alignment
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 ml-1">API 686</span>
                      </button>
                    </li>
                  </ul>
                  <button
                    onClick={() => navigateAndClose('gearbox')}
                    className="text-[11px] font-semibold text-amber-600 hover:text-amber-800 flex items-center gap-1 pt-1 group cursor-pointer"
                  >
                    <span>Explore Drivetrain</span>
                    <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {/* Column 4: Piping & Seals */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-wider">
                      Piping &amp; Pressure
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">2 Models</span>
                  </div>
                  <ul className="space-y-1 text-xs">
                    <li>
                      <button
                        onClick={() => navigateAndClose('pipe')}
                        className="w-full text-left flex items-center justify-between group py-0.5 hover:text-emerald-700 transition-colors cursor-pointer"
                      >
                        <span className="text-slate-800 group-hover:text-emerald-600 font-medium group-hover:translate-x-0.5 transition-all text-xs truncate">
                          • Piping Thermal Stress
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 ml-1">ASME B31.3</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateAndClose('seal')}
                        className="w-full text-left flex items-center justify-between group py-0.5 hover:text-emerald-700 transition-colors cursor-pointer"
                      >
                        <span className="text-slate-800 group-hover:text-emerald-600 font-medium group-hover:translate-x-0.5 transition-all text-xs truncate">
                          • Mechanical Seal Flush
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 ml-1">API 682</span>
                      </button>
                    </li>
                  </ul>
                  <button
                    onClick={() => navigateAndClose('pipe')}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 pt-1 group cursor-pointer"
                  >
                    <span>Explore Piping</span>
                    <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {/* Column 5: Reciprocating */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <span className="text-[10px] font-mono font-bold text-rose-700 uppercase tracking-wider">
                      Reciprocating
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">1 Model</span>
                  </div>
                  <ul className="space-y-1 text-xs">
                    <li>
                      <button
                        onClick={() => navigateAndClose('recip')}
                        className="w-full text-left flex items-center justify-between group py-0.5 hover:text-rose-700 transition-colors cursor-pointer"
                      >
                        <span className="text-slate-800 group-hover:text-rose-600 font-medium group-hover:translate-x-0.5 transition-all text-xs truncate">
                          • Reciprocating PV Cycle
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 ml-1">API 618</span>
                      </button>
                    </li>
                  </ul>
                  <button
                    onClick={() => navigateAndClose('recip')}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 pt-1 group cursor-pointer"
                  >
                    <span>Explore Recip</span>
                    <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              PANEL 2: ENGINEERING DOMAINS (6 Clean, Cardless Columns)
              ======================================================== */}
          {activeDropdown === 'domains' && (
            <div className="px-6 sm:px-10 lg:px-12 py-3.5 max-w-[1720px] mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5">
                {/* Domain 1: Fluid Dynamics */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200">
                    <Activity className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span className="font-bold text-xs text-slate-900 truncate">Fluid Dynamics</span>
                  </div>
                  <div className="text-[10px] font-mono text-cyan-700">API 610 • HI 9.6.1</div>
                  <ul className="space-y-1 text-xs pt-0.5">
                    <li>
                      <button
                        onClick={() => navigateAndClose('pump')}
                        className="w-full text-left text-slate-700 hover:text-cyan-700 transition-colors py-0.5 cursor-pointer truncate"
                      >
                        • Pump Cavitation NPSH
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateAndClose('pump')}
                        className="w-full text-left text-slate-500 hover:text-cyan-700 transition-colors py-0.5 cursor-pointer truncate"
                      >
                        • Suction Velocity Limits
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Domain 2: Aerodynamics */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200">
                    <Wind className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span className="font-bold text-xs text-slate-900 truncate">Aerodynamics</span>
                  </div>
                  <div className="text-[10px] font-mono text-sky-700">API 617 • PTC 10</div>
                  <ul className="space-y-1 text-xs pt-0.5">
                    <li>
                      <button
                        onClick={() => navigateAndClose('compressor')}
                        className="w-full text-left text-slate-700 hover:text-sky-700 transition-colors py-0.5 cursor-pointer truncate"
                      >
                        • Compressor Surge SLL
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateAndClose('compressor')}
                        className="w-full text-left text-slate-500 hover:text-sky-700 transition-colors py-0.5 cursor-pointer truncate"
                      >
                        • ASV Control Margins
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Domain 3: Thermodynamics */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200">
                    <Flame className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="font-bold text-xs text-slate-900 truncate">Thermodynamics</span>
                  </div>
                  <div className="text-[10px] font-mono text-rose-700">API 612 • API 618</div>
                  <ul className="space-y-1 text-xs pt-0.5">
                    <li>
                      <button
                        onClick={() => navigateAndClose('turbine')}
                        className="w-full text-left text-slate-700 hover:text-rose-700 transition-colors py-0.5 cursor-pointer truncate"
                      >
                        • Steam Turbine Enthalpy
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateAndClose('recip')}
                        className="w-full text-left text-slate-500 hover:text-rose-700 transition-colors py-0.5 cursor-pointer truncate"
                      >
                        • Reciprocating PV Cycle
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Domain 4: Rotordynamics */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200">
                    <RotateCw className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="font-bold text-xs text-slate-900 truncate">Rotordynamics</span>
                  </div>
                  <div className="text-[10px] font-mono text-indigo-700">ISO 1940 • API 684</div>
                  <ul className="space-y-1 text-xs pt-0.5">
                    <li>
                      <button
                        onClick={() => navigateAndClose('rotor')}
                        className="w-full text-left text-slate-700 hover:text-indigo-700 transition-colors py-0.5 cursor-pointer truncate"
                      >
                        • Rotor Balancing G2.5
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateAndClose('journal')}
                        className="w-full text-left text-slate-500 hover:text-indigo-700 transition-colors py-0.5 cursor-pointer truncate"
                      >
                        • Hydrodynamic Oil Whirl
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Domain 5: Tribology */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200">
                    <Disc className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-bold text-xs text-slate-900 truncate">Tribology</span>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-700">ISO 281 • AGMA 2001</div>
                  <ul className="space-y-1 text-xs pt-0.5">
                    <li>
                      <button
                        onClick={() => navigateAndClose('bearing')}
                        className="w-full text-left text-slate-700 hover:text-emerald-700 transition-colors py-0.5 cursor-pointer truncate"
                      >
                        • Bearing Fault Vibration
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateAndClose('gearbox')}
                        className="w-full text-left text-slate-500 hover:text-emerald-700 transition-colors py-0.5 cursor-pointer truncate"
                      >
                        • Gearbox Mesh Diagnostics
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Domain 6: Stress & Alignment */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200">
                    <Maximize2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="font-bold text-xs text-slate-900 truncate">Stress &amp; Alignment</span>
                  </div>
                  <div className="text-[10px] font-mono text-purple-700">ASME B31.3 • API 686</div>
                  <ul className="space-y-1 text-xs pt-0.5">
                    <li>
                      <button
                        onClick={() => navigateAndClose('pipe')}
                        className="w-full text-left text-slate-700 hover:text-purple-700 transition-colors py-0.5 cursor-pointer truncate"
                      >
                        • Piping Thermal Stress
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateAndClose('alignment')}
                        className="w-full text-left text-slate-500 hover:text-purple-700 transition-colors py-0.5 cursor-pointer truncate"
                      >
                        • Shaft Laser Alignment
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              PANEL 3: ALL 11 DIGITAL TWINS (Smart, Compact 4 Columns, Cardless)
              ======================================================== */}
          {activeDropdown === 'labs' && (
            <div className="px-6 sm:px-10 lg:px-12 py-3.5 max-w-[1720px] mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Column 1: Turbomachinery */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <span className="text-[10px] font-mono font-bold text-cyan-700 uppercase tracking-wider">
                      Turbomachinery
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">3 Models</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">Centrifugal pumps, compressors &amp; steam turbines</div>
                  <ul className="space-y-1 text-xs pt-0.5">
                    <li>
                      <button
                        onClick={() => navigateAndClose('pump')}
                        className="w-full text-left flex items-center justify-between group py-0.5 hover:text-cyan-700 transition-colors cursor-pointer"
                      >
                        <span className="text-slate-800 group-hover:text-cyan-600 font-medium group-hover:translate-x-0.5 transition-all text-xs truncate">
                          • Pump Cavitation &amp; NPSH
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 group-hover:text-cyan-700 ml-1">API 610</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateAndClose('compressor')}
                        className="w-full text-left flex items-center justify-between group py-0.5 hover:text-cyan-700 transition-colors cursor-pointer"
                      >
                        <span className="text-slate-800 group-hover:text-cyan-600 font-medium group-hover:translate-x-0.5 transition-all text-xs truncate">
                          • Compressor Surge Dynamics
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 group-hover:text-cyan-700 ml-1">API 617</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateAndClose('turbine')}
                        className="w-full text-left flex items-center justify-between group py-0.5 hover:text-cyan-700 transition-colors cursor-pointer"
                      >
                        <span className="text-slate-800 group-hover:text-cyan-600 font-medium group-hover:translate-x-0.5 transition-all text-xs truncate">
                          • Steam Turbine Enthalpy
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 group-hover:text-cyan-700 ml-1">API 612</span>
                      </button>
                    </li>
                  </ul>
                  <button
                    onClick={() => navigateAndClose('pump')}
                    className="text-[11px] font-semibold text-cyan-600 hover:text-cyan-800 flex items-center gap-1 pt-1 group cursor-pointer"
                  >
                    <span>Explore Turbomachinery</span>
                    <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {/* Column 2: Vibration & Bearings */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <span className="text-[10px] font-mono font-bold text-blue-700 uppercase tracking-wider">
                      Vibration &amp; Dynamics
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">3 Models</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">Demodulation, oil whirl &amp; dynamic balancing</div>
                  <ul className="space-y-1 text-xs pt-0.5">
                    <li>
                      <button
                        onClick={() => navigateAndClose('bearing')}
                        className="w-full text-left flex items-center justify-between group py-0.5 hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        <span className="text-slate-800 group-hover:text-blue-600 font-medium group-hover:translate-x-0.5 transition-all text-xs truncate">
                          • Bearing Fault Vibration
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 group-hover:text-blue-700 ml-1">ISO 281</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateAndClose('journal')}
                        className="w-full text-left flex items-center justify-between group py-0.5 hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        <span className="text-slate-800 group-hover:text-blue-600 font-medium group-hover:translate-x-0.5 transition-all text-xs truncate">
                          • Journal Bearing Oil Whirl
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 group-hover:text-blue-700 ml-1">API 684</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateAndClose('rotor')}
                        className="w-full text-left flex items-center justify-between group py-0.5 hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        <span className="text-slate-800 group-hover:text-blue-600 font-medium group-hover:translate-x-0.5 transition-all text-xs truncate">
                          • Rotor Resonant Balancing
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 group-hover:text-blue-700 ml-1">ISO 1940</span>
                      </button>
                    </li>
                  </ul>
                  <button
                    onClick={() => navigateAndClose('bearing')}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 pt-1 group cursor-pointer"
                  >
                    <span>Explore Vibration Labs</span>
                    <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {/* Column 3: Drivetrain & Piping */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <span className="text-[10px] font-mono font-bold text-amber-700 uppercase tracking-wider">
                      Drivetrain &amp; Piping
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">3 Models</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">Contact pitting, alignment &amp; pipe flexibility</div>
                  <ul className="space-y-1 text-xs pt-0.5">
                    <li>
                      <button
                        onClick={() => navigateAndClose('gearbox')}
                        className="w-full text-left flex items-center justify-between group py-0.5 hover:text-amber-700 transition-colors cursor-pointer"
                      >
                        <span className="text-slate-800 group-hover:text-amber-600 font-medium group-hover:translate-x-0.5 transition-all text-xs truncate">
                          • Gearbox Mesh &amp; AGMA
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 group-hover:text-amber-700 ml-1">AGMA 2001</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateAndClose('alignment')}
                        className="w-full text-left flex items-center justify-between group py-0.5 hover:text-amber-700 transition-colors cursor-pointer"
                      >
                        <span className="text-slate-800 group-hover:text-amber-600 font-medium group-hover:translate-x-0.5 transition-all text-xs truncate">
                          • Shaft Laser Alignment
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 group-hover:text-amber-700 ml-1">API 686</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateAndClose('pipe')}
                        className="w-full text-left flex items-center justify-between group py-0.5 hover:text-amber-700 transition-colors cursor-pointer"
                      >
                        <span className="text-slate-800 group-hover:text-amber-600 font-medium group-hover:translate-x-0.5 transition-all text-xs truncate">
                          • Piping Thermal Stress
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 group-hover:text-amber-700 ml-1">ASME B31.3</span>
                      </button>
                    </li>
                  </ul>
                  <button
                    onClick={() => navigateAndClose('gearbox')}
                    className="text-[11px] font-semibold text-amber-600 hover:text-amber-800 flex items-center gap-1 pt-1 group cursor-pointer"
                  >
                    <span>Explore Drivetrain</span>
                    <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {/* Column 4: Seals & Reciprocating */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-wider">
                      Seals &amp; Recip
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">2 Models</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">Piping Plan 11-52 flush &amp; cylinder PV work</div>
                  <ul className="space-y-1 text-xs pt-0.5">
                    <li>
                      <button
                        onClick={() => navigateAndClose('seal')}
                        className="w-full text-left flex items-center justify-between group py-0.5 hover:text-emerald-700 transition-colors cursor-pointer"
                      >
                        <span className="text-slate-800 group-hover:text-emerald-600 font-medium group-hover:translate-x-0.5 transition-all text-xs truncate">
                          • Mechanical Seal Flush
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 group-hover:text-emerald-700 ml-1">API 682</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateAndClose('recip')}
                        className="w-full text-left flex items-center justify-between group py-0.5 hover:text-emerald-700 transition-colors cursor-pointer"
                      >
                        <span className="text-slate-800 group-hover:text-emerald-600 font-medium group-hover:translate-x-0.5 transition-all text-xs truncate">
                          • Reciprocating PV Cycle
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 group-hover:text-emerald-700 ml-1">API 618</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateAndClose('workbench')}
                        className="w-full text-left flex items-center justify-between group py-0.5 hover:text-cyan-700 transition-colors cursor-pointer"
                      >
                        <span className="text-cyan-700 group-hover:text-cyan-900 font-bold group-hover:translate-x-0.5 transition-all text-xs truncate">
                          ★ Mission Control Workbench
                        </span>
                        <span className="text-[9px] font-mono text-cyan-600 font-bold ml-1">11-IN-1</span>
                      </button>
                    </li>
                  </ul>
                  <button
                    onClick={() => navigateAndClose('seal')}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 pt-1 group cursor-pointer"
                  >
                    <span>Explore Reliability Systems</span>
                    <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              PANEL 4: STUDIOS & TOOLS (Smart, Compact 4-Column List)
              ZERO BULKY SUB-CARDS!
              ======================================================== */}
          {activeDropdown === 'studios' && (
            <div className="px-6 sm:px-10 lg:px-12 py-3.5 max-w-[1720px] mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Column 1: Auditing */}
                <div className="space-y-1">
                  <div className="text-[10px] font-mono font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-200">
                    Auditing &amp; Reports
                  </div>
                  <ul className="space-y-1 text-xs">
                    <li>
                      <button
                        onClick={() => { onOpenAudit(); setActiveDropdown(null); }}
                        className="w-full text-left flex items-center gap-2 py-1 px-1.5 rounded hover:bg-slate-100 text-slate-700 hover:text-cyan-700 transition-colors cursor-pointer"
                      >
                        <FileText size={13} className="text-cyan-600 shrink-0" />
                        <span className="font-medium">Calculation Audit Trail</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => { onOpenReport(); setActiveDropdown(null); }}
                        className="w-full text-left flex items-center gap-2 py-1 px-1.5 rounded hover:bg-slate-100 text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
                      >
                        <FileText size={13} className="text-emerald-600 shrink-0" />
                        <span className="font-medium">Print Assessment Report</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateAndClose('standards')}
                        className="w-full text-left flex items-center gap-2 py-1 px-1.5 rounded hover:bg-slate-100 text-slate-700 hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        <ShieldCheck size={13} className="text-blue-600 shrink-0" />
                        <span className="font-medium">Governing Standards Reference</span>
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Column 2: Troubleshooting */}
                <div className="space-y-1">
                  <div className="text-[10px] font-mono font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-200">
                    Troubleshooting &amp; RCA
                  </div>
                  <ul className="space-y-1 text-xs">
                    <li>
                      <button
                        onClick={() => { setIsDiagnosticModalOpen(true); setActiveDropdown(null); }}
                        className="w-full text-left flex items-center gap-2 py-1 px-1.5 rounded hover:bg-slate-100 text-slate-700 hover:text-amber-700 transition-colors cursor-pointer"
                      >
                        <Wrench size={13} className="text-amber-600 shrink-0" />
                        <span className="font-medium">Diagnostic Wizard</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => { setIsCaseStudiesModalOpen(true); setActiveDropdown(null); }}
                        className="w-full text-left flex items-center gap-2 py-1 px-1.5 rounded hover:bg-slate-100 text-slate-700 hover:text-rose-700 transition-colors cursor-pointer"
                      >
                        <BookOpen size={13} className="text-rose-600 shrink-0" />
                        <span className="font-medium">Industrial Case Studies</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => { setIsRcaStudioOpen(true); setActiveDropdown(null); }}
                        className="w-full text-left flex items-center gap-2 py-1 px-1.5 rounded hover:bg-slate-100 text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer"
                      >
                        <Target size={13} className="text-indigo-600 shrink-0" />
                        <span className="font-medium">RCA 5-Whys Studio</span>
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Column 3: Dynamic Visualizers */}
                <div className="space-y-1">
                  <div className="text-[10px] font-mono font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-200">
                    Dynamic Machinery Visualizers
                  </div>
                  <ul className="space-y-1 text-xs">
                    <li>
                      <button
                        onClick={() => { setIsKineticCutawayOpen(true); setActiveDropdown(null); }}
                        className="w-full text-left flex items-center gap-2 py-1 px-1.5 rounded hover:bg-slate-100 text-slate-700 hover:text-cyan-700 transition-colors cursor-pointer"
                      >
                        <Disc size={13} className="text-cyan-600 shrink-0" />
                        <span className="font-medium">3D Kinetic Cutaway</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => { setIsSpectralLabOpen(true); setActiveDropdown(null); }}
                        className="w-full text-left flex items-center gap-2 py-1 px-1.5 rounded hover:bg-slate-100 text-slate-700 hover:text-violet-700 transition-colors cursor-pointer"
                      >
                        <Activity size={13} className="text-violet-600 shrink-0" />
                        <span className="font-medium">Spectral FFT Lab</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => { setIsMachineryTrainStudioOpen(true); setActiveDropdown(null); }}
                        className="w-full text-left flex items-center gap-2 py-1 px-1.5 rounded hover:bg-slate-100 text-slate-700 hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        <Network size={13} className="text-blue-600 shrink-0" />
                        <span className="font-medium">Machinery Train Studio</span>
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Column 4: Reliability & Analytics */}
                <div className="space-y-1">
                  <div className="text-[10px] font-mono font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-200">
                    Reliability &amp; Analytics
                  </div>
                  <ul className="space-y-1 text-xs">
                    <li>
                      <button
                        onClick={() => { setIsReliabilityStudioOpen(true); setActiveDropdown(null); }}
                        className="w-full text-left flex items-center gap-2 py-1 px-1.5 rounded hover:bg-slate-100 text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
                      >
                        <TrendingUp size={13} className="text-emerald-600 shrink-0" />
                        <span className="font-medium">Reliability Studio (Weibull &beta;)</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => { setIsMonteCarloOpen(true); setActiveDropdown(null); }}
                        className="w-full text-left flex items-center gap-2 py-1 px-1.5 rounded hover:bg-slate-100 text-slate-700 hover:text-purple-700 transition-colors cursor-pointer"
                      >
                        <SlidersHorizontal size={13} className="text-purple-600 shrink-0" />
                        <span className="font-medium">Monte Carlo Uncertainty</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => { setIsExergyCarbonOpen(true); setActiveDropdown(null); }}
                        className="w-full text-left flex items-center gap-2 py-1 px-1.5 rounded hover:bg-slate-100 text-slate-700 hover:text-teal-700 transition-colors cursor-pointer"
                      >
                        <Zap size={13} className="text-teal-600 shrink-0" />
                        <span className="font-medium">Exergy &amp; Carbon Footprint</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              PANEL 5: ECOSYSTEM & COMPANION PORTALS (Compact 3-Column List)
              ZERO BULKY SUB-CARDS!
              ======================================================== */}
          {activeDropdown === 'ecosystem' && (
            <div className="px-6 sm:px-10 lg:px-12 py-3.5 max-w-[1720px] mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                    <Calculator className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-bold text-xs text-slate-900">DesignCalculators.co.in</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                    Free engineering calculators for cable sizing, pressure vessels, pipe hydraulics &amp; control valves.
                  </p>
                  <a
                    href="https://designcalculators.co.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 mt-1.5 group"
                  >
                    <span>Visit Free Calculator Portal</span>
                    <ExternalLink size={10} className="group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>

                <div>
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                    <BarChart3 className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                    <span className="font-bold text-xs text-slate-900">ReliabilityTools.co.in</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                    Weibull 2P/3P analysis, MTBF/MTTR metrics, Root Cause Analysis &amp; IEC 61508/61511 SIL verification.
                  </p>
                  <a
                    href="https://reliabilitytools.co.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-violet-600 hover:text-violet-800 flex items-center gap-1 mt-1.5 group"
                  >
                    <span>Visit Reliability Portal</span>
                    <ExternalLink size={10} className="group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>

                <div>
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                    <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="font-bold text-xs text-slate-900">LiveSimulators Departments</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1 text-[11px]">
                    {parentDisciplines.map((d) => (
                      <a
                        key={d.code}
                        href={d.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-700 hover:text-cyan-700 truncate py-0.5 flex items-center justify-between"
                      >
                        <span className="truncate">{d.name.split(' ')[0]}</span>
                        <span className="text-[9px] font-mono text-slate-400">{d.code}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          4. MOBILE DRAWER MENU
          ======================================================== */}
      {isMobileMenuOpen && (
        <div className="lg:hidden w-full bg-[#080E1C] border-b border-slate-800 px-4 py-5 space-y-4 max-h-[85vh] overflow-y-auto font-sans shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
              11 Mechanical Digital Twins
            </span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {simulatorsList.map((sim) => (
              <button
                key={sim.id}
                onClick={() => navigateAndClose(sim.id)}
                className={`p-2.5 rounded-lg border text-left text-xs font-mono transition-all flex items-center justify-between ${
                  activeRoute === sim.id
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <span>{sim.name}</span>
                <span className="text-[9px] px-1 py-0.5 rounded bg-slate-800 text-slate-400">
                  {sim.standard}
                </span>
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
            <button
              onClick={() => navigateAndClose('workbench')}
              className="flex-1 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold text-center"
            >
              Mission Control Workbench
            </button>
            <button
              onClick={() => navigateAndClose('standards')}
              className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs text-center"
            >
              Standards Matrix
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
