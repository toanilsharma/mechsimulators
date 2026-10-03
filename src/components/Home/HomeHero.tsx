import React from 'react';
import {
  Search,
  X,
  Flame,
  Network,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  GraduationCap,
  Wrench,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  Activity,
  Factory,
  Layers,
  BookOpen,
  Award,
} from 'lucide-react';
import { SimulatorId } from '../../types/common';
import { HeroSimulationBench } from './HeroSimulationBench';

export type ViewMode = 'learning' | 'applicability' | 'domain';
export type DomainFilter = 'all' | 'turbomachinery' | 'pumping' | 'transmission';
export type HealthFilter = 'all' | 'compliant' | 'advisory' | 'critical';
export type LearningFilter = 'all' | 'level1' | 'level2' | 'level3';
export type ApplicabilityFilter = 'all' | 'tier1' | 'tier2' | 'tier3';

interface HomeHeroProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  domainFilter: DomainFilter;
  onDomainFilterChange: (domain: DomainFilter) => void;
  learningFilter: LearningFilter;
  onLearningFilterChange: (l: LearningFilter) => void;
  applicabilityFilter: ApplicabilityFilter;
  onApplicabilityFilterChange: (a: ApplicabilityFilter) => void;
  healthFilter: HealthFilter;
  onHealthFilterChange: (h: HealthFilter) => void;
  onLaunchSim: (id: SimulatorId) => void;
  onOpenTrainStudio: () => void;
  onOpenAudit: () => void;
  totalCounts: {
    all: number;
    turbomachinery: number;
    pumping: number;
    transmission: number;
  };
  learningCounts: {
    all: number;
    level1: number;
    level2: number;
    level3: number;
  };
  applicabilityCounts: {
    all: number;
    tier1: number;
    tier2: number;
    tier3: number;
  };
}

export const HomeHero: React.FC<HomeHeroProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  domainFilter,
  onDomainFilterChange,
  learningFilter,
  onLearningFilterChange,
  applicabilityFilter,
  onApplicabilityFilterChange,
  healthFilter,
  onHealthFilterChange,
  onLaunchSim,
  onOpenTrainStudio,
  onOpenAudit,
  totalCounts,
  learningCounts,
  applicabilityCounts,
}) => {
  const scrollToSimulators = () => {
    const el = document.getElementById('simulator-directory-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="home-hero-section"
      className="relative border-b border-[#1e2638] bg-gradient-to-b from-[#0e1628] via-[#090d18] to-[#060810] px-4 sm:px-8 py-8 sm:py-12 overflow-hidden"
    >
      {/* Subtle Engineering Grid Backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d0a_1px,transparent_1px),linear-gradient(to_bottom,#1f293d0a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Top Ticker / System Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono border-b border-[#1e2638]/70 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-white font-bold tracking-wider">MECHANICAL LAB PRO</span>
            <span className="text-slate-500">•</span>
            <span className="text-sky-400 font-semibold">Multi-Physics Digital Twin Workbench</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="px-2.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>SOLVER KERNEL: ACTIVE</span>
            </span>
            <span className="px-2.5 py-0.5 rounded bg-sky-950/60 border border-sky-500/30 text-sky-300 font-semibold hidden sm:inline">
              IEEE-754 64-BIT PRECISION
            </span>
            <span className="px-2.5 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-300 font-semibold hidden md:inline">
              ZERO CLOUD QUEUING
            </span>
          </div>
        </div>

        {/* Hero Main Grid: Left Headline & Benefits, Right Interactive Simulator Rig */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Bold Value Proposition & Benefits */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-sky-500/20 via-sky-500/10 to-transparent border border-sky-500/40 text-sky-300 text-xs font-mono">
                <Sparkles size={13} className="text-sky-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Zero Server Latency • Deterministic Engineering Physics</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
                Simulate. Predict. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-emerald-300 to-amber-300">
                  Master Plant Reliability.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans max-w-xl">
                Real-time digital twins for industrial rotating machinery and high-pressure piping. Test catastrophic operating limits, eliminate destructive vibration trips, and verify compliance with recognized standards—all in your browser.
              </p>
            </div>

            {/* Who Benefits: 3 Target Persona Value Cards with Interactive Quick-Filtering */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div 
                onClick={() => {
                  onViewModeChange('learning');
                  onLearningFilterChange('level1');
                  scrollToSimulators();
                }}
                className={`p-3 rounded-xl bg-[#090f1a] border transition-all duration-200 cursor-pointer group ${
                  viewMode === 'learning' && learningFilter === 'level1'
                    ? 'border-sky-400 bg-sky-950/30 shadow-lg shadow-sky-500/20'
                    : 'border-sky-500/20 hover:border-sky-400/80 hover:bg-[#0c1527]'
                }`}
                title="Click to filter curriculum: Core engineering principles & visual fundamentals"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <GraduationCap size={15} />
                  </div>
                  <span className="text-[9px] font-mono text-sky-400 group-hover:text-sky-300 font-bold flex items-center gap-0.5">
                    <span>Explore</span>
                    <ArrowRight size={10} />
                  </span>
                </div>
                <div className="text-xs font-bold text-white font-mono flex items-center gap-1">
                  <span>For Students</span>
                  <span className="text-[10px] text-sky-400 font-normal">(Level 1)</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  See Navier-Stokes, Campbell & PV indicator diagrams in live motion.
                </div>
              </div>

              <div 
                onClick={() => {
                  onViewModeChange('applicability');
                  onApplicabilityFilterChange('tier1');
                  scrollToSimulators();
                }}
                className={`p-3 rounded-xl bg-[#091512] border transition-all duration-200 cursor-pointer group ${
                  viewMode === 'applicability' && applicabilityFilter === 'tier1'
                    ? 'border-emerald-400 bg-emerald-950/30 shadow-lg shadow-emerald-500/20'
                    : 'border-emerald-500/20 hover:border-emerald-400/80 hover:bg-[#0b1c17]'
                }`}
                title="Click to filter: High-prevalence plant-wide rotating equipment"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Wrench size={15} />
                  </div>
                  <span className="text-[9px] font-mono text-emerald-400 group-hover:text-emerald-300 font-bold flex items-center gap-0.5">
                    <span>Explore</span>
                    <ArrowRight size={10} />
                  </span>
                </div>
                <div className="text-xs font-bold text-white font-mono flex items-center gap-1">
                  <span>For Engineers</span>
                  <span className="text-[10px] text-emerald-400 font-normal">(Tier 1)</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  Calculate surge margins, NPSHa, and 2X alignment shims in seconds.
                </div>
              </div>

              <div 
                onClick={() => {
                  onViewModeChange('domain');
                  onDomainFilterChange('turbomachinery');
                  scrollToSimulators();
                }}
                className={`p-3 rounded-xl bg-[#191309] border transition-all duration-200 cursor-pointer group ${
                  viewMode === 'domain' && domainFilter === 'turbomachinery'
                    ? 'border-amber-400 bg-amber-950/30 shadow-lg shadow-amber-500/20'
                    : 'border-amber-500/20 hover:border-amber-400/80 hover:bg-[#21190b]'
                }`}
                title="Click to filter: Critical turbomachinery & unspared fault dynamics"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShieldCheck size={15} />
                  </div>
                  <span className="text-[9px] font-mono text-amber-400 group-hover:text-amber-300 font-bold flex items-center gap-0.5">
                    <span>Explore</span>
                    <ArrowRight size={10} />
                  </span>
                </div>
                <div className="text-xs font-bold text-white font-mono flex items-center gap-1">
                  <span>For RCA Teams</span>
                  <span className="text-[10px] text-amber-400 font-normal">(Critical)</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  Simulate severe fault incursions without risking real equipment.
                </div>
              </div>
            </div>

            {/* Quick CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id="hero-cta-explore-twins"
                onClick={scrollToSimulators}
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-sky-500/25 cursor-pointer transform hover:-translate-y-0.5"
              >
                <Zap size={16} />
                <span>Explore 11 Live Simulators</span>
                <ArrowRight size={14} />
              </button>

              <button
                id="hero-cta-train-studio"
                onClick={onOpenTrainStudio}
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#111929] hover:bg-[#182338] border border-sky-500/30 text-sky-300 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer"
              >
                <Network size={16} className="text-sky-400" />
                <span>Coupled Train Studio</span>
              </button>

              <button
                id="hero-cta-audit-trail"
                onClick={onOpenAudit}
                className="inline-flex items-center gap-1.5 px-3.5 py-3 bg-[#0d121c] hover:bg-[#151c2c] border border-slate-800 text-slate-300 text-xs sm:text-sm rounded-xl transition-all cursor-pointer font-mono"
                title="View verified formulas and mathematical derivations"
              >
                <FileText size={15} className="text-amber-400" />
                <span>Audit Formulas</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Interactive Digital Twin Cockpit */}
          <div className="lg:col-span-6">
            <HeroSimulationBench onLaunchSim={onLaunchSim} />
          </div>
        </div>

        {/* Unified Search & Category Filtering Dock */}
        <div className="bg-[#0a0f1b]/90 backdrop-blur-md border border-[#1e2638] rounded-2xl p-4 space-y-3.5 shadow-xl">
          {/* Search Row */}
          <div className="relative">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by equipment, code (e.g. API 610, ASME B31.3), tag (e.g. COMP-CENT), or failure (surge, cavitation, whirl)..."
              className="w-full bg-[#0f1626] border border-[#202c42] focus:border-sky-400 focus:outline-none rounded-xl pl-10 pr-10 py-3 text-xs sm:text-sm text-white placeholder-slate-500 transition-colors font-sans shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* View Organization Mode Selector Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#182236]">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider hidden sm:inline mr-1">
                Show Tools By:
              </span>
              <div className="inline-flex p-1 rounded-xl bg-[#090e18] border border-[#1d273a] gap-1">
                <button
                  onClick={() => onViewModeChange('learning')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    viewMode === 'learning'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="Curriculum order: Foundation -> Intermediate Systems -> Advanced Turbomachinery"
                >
                  <GraduationCap size={14} className={viewMode === 'learning' ? 'text-slate-950' : 'text-emerald-400'} />
                  <span>Learning Importance</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-black/30 font-semibold">Curriculum</span>
                </button>

                <button
                  onClick={() => onViewModeChange('applicability')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    viewMode === 'applicability'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-400 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="Industrial criticality tiers: Plant-Wide Ubiquitous -> Process Units -> Unspared Capital"
                >
                  <Factory size={14} className={viewMode === 'applicability' ? 'text-slate-950' : 'text-amber-400'} />
                  <span>Applicability Levels</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-black/30 font-semibold">Tiers</span>
                </button>

                <button
                  onClick={() => onViewModeChange('domain')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    viewMode === 'domain'
                      ? 'bg-gradient-to-r from-sky-500 to-blue-400 text-slate-950 shadow-md shadow-sky-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="Grouped by equipment domain: Turbomachinery, Pumps & Piping, Power Transmission"
                >
                  <Layers size={14} className={viewMode === 'domain' ? 'text-slate-950' : 'text-sky-400'} />
                  <span>Engineering Domains</span>
                </button>
              </div>
            </div>

            {/* Health Compliance Filter */}
            <div className="flex items-center gap-1.5 font-mono text-[11px] self-end sm:self-auto">
              <span className="text-slate-400 mr-1 hidden md:inline">State:</span>
              <button
                onClick={() => onHealthFilterChange('all')}
                className={`px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                  healthFilter === 'all'
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All States
              </button>
              <button
                onClick={() => onHealthFilterChange('compliant')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                  healthFilter === 'compliant'
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/50 font-bold'
                    : 'text-slate-400 hover:text-emerald-400'
                }`}
              >
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span>Normal</span>
              </button>
              <button
                onClick={() => onHealthFilterChange('advisory')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                  healthFilter === 'advisory'
                    ? 'bg-amber-900/60 text-amber-300 border border-amber-500/50 font-bold'
                    : 'text-slate-400 hover:text-amber-400'
                }`}
              >
                <AlertTriangle size={12} className="text-amber-400" />
                <span>Advisory</span>
              </button>
              <button
                onClick={() => onHealthFilterChange('critical')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                  healthFilter === 'critical'
                    ? 'bg-red-900/60 text-red-300 border border-red-500/50 font-bold'
                    : 'text-slate-400 hover:text-red-400'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                <span>Trip</span>
              </button>
            </div>
          </div>

          {/* Sub-Filters Row based on active View Mode */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {viewMode === 'learning' && (
              <>
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider hidden sm:inline mr-1 flex items-center gap-1">
                  <GraduationCap size={12} />
                  <span>Learning Level:</span>
                </span>
                <button
                  onClick={() => onLearningFilterChange('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                    learningFilter === 'all'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-[#121927] text-slate-300 hover:text-white hover:bg-[#182236] border border-[#202c42]'
                  }`}
                >
                  All 11 Digital Twins
                </button>
                <button
                  onClick={() => onLearningFilterChange('level1')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                    learningFilter === 'level1'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-950/70 border border-emerald-500/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Level 1: Foundational Core ({learningCounts.level1})</span>
                </button>
                <button
                  onClick={() => onLearningFilterChange('level2')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                    learningFilter === 'level2'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-amber-950/40 text-amber-300 hover:bg-amber-950/70 border border-amber-500/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>Level 2: Industrial Systems ({learningCounts.level2})</span>
                </button>
                <button
                  onClick={() => onLearningFilterChange('level3')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                    learningFilter === 'level3'
                      ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-sky-950/40 text-sky-300 hover:bg-sky-950/70 border border-sky-500/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  <span>Level 3: Advanced Turbomachinery ({learningCounts.level3})</span>
                </button>
              </>
            )}

            {viewMode === 'applicability' && (
              <>
                <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider hidden sm:inline mr-1 flex items-center gap-1">
                  <Factory size={12} />
                  <span>Applicability Tier:</span>
                </span>
                <button
                  onClick={() => onApplicabilityFilterChange('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                    applicabilityFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-[#121927] text-slate-300 hover:text-white hover:bg-[#182236] border border-[#202c42]'
                  }`}
                >
                  All 11 Digital Twins
                </button>
                <button
                  onClick={() => onApplicabilityFilterChange('tier1')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                    applicabilityFilter === 'tier1'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-950/70 border border-emerald-500/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Tier 1: Plant-Wide Ubiquitous ({applicabilityCounts.tier1})</span>
                </button>
                <button
                  onClick={() => onApplicabilityFilterChange('tier2')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                    applicabilityFilter === 'tier2'
                      ? 'bg-orange-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-orange-950/40 text-orange-300 hover:bg-orange-950/70 border border-orange-500/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                  <span>Tier 2: Specialized Process Units ({applicabilityCounts.tier2})</span>
                </button>
                <button
                  onClick={() => onApplicabilityFilterChange('tier3')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                    applicabilityFilter === 'tier3'
                      ? 'bg-purple-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-purple-950/40 text-purple-300 hover:bg-purple-950/70 border border-purple-500/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  <span>Tier 3: Unspared Capital Turbomachinery ({applicabilityCounts.tier3})</span>
                </button>
              </>
            )}

            {viewMode === 'domain' && (
              <>
                <span className="text-[11px] font-mono text-sky-400 uppercase tracking-wider hidden sm:inline mr-1 flex items-center gap-1">
                  <Layers size={12} />
                  <span>Domain Category:</span>
                </span>
                <button
                  onClick={() => onDomainFilterChange('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                    domainFilter === 'all'
                      ? 'bg-white text-slate-950 shadow-md font-bold'
                      : 'bg-[#121927] text-slate-300 hover:text-white hover:bg-[#182236] border border-[#202c42]'
                  }`}
                >
                  All Digital Twins ({totalCounts.all})
                </button>
                <button
                  onClick={() => onDomainFilterChange('turbomachinery')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                    domainFilter === 'turbomachinery'
                      ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                      : 'bg-sky-950/40 text-sky-300 hover:bg-sky-950/70 border border-sky-500/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  <span>Turbomachinery & Gas ({totalCounts.turbomachinery})</span>
                </button>
                <button
                  onClick={() => onDomainFilterChange('pumping')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                    domainFilter === 'pumping'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                      : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-950/70 border border-emerald-500/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Pumps & Piping ({totalCounts.pumping})</span>
                </button>
                <button
                  onClick={() => onDomainFilterChange('transmission')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                    domainFilter === 'transmission'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-amber-950/40 text-amber-300 hover:bg-amber-950/70 border border-amber-500/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>Transmission & Dynamics ({totalCounts.transmission})</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

