import React, { useState } from 'react';
import { SimulatorId } from '../../types/common';
import {
  GraduationCap,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  BookOpen,
  Cpu,
  Layers,
  Award,
  FileText,
  Play,
  ShieldAlert,
  Search,
  Check,
  X,
  AlertTriangle,
  Workflow,
  Compass,
  TrendingUp,
  RotateCw,
  Wind,
  Disc,
  Network,
  Scale,
  Flame,
  Activity,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface PlatformValueShowcaseProps {
  onLaunchSim: (id: SimulatorId) => void;
  onOpenAudit: () => void;
  onOpenTrainStudio: () => void;
  onOpenReport?: () => void;
}

type ActiveTab = 'engineers' | 'students' | 'offerings' | 'standards';

export const PlatformValueShowcase: React.FC<PlatformValueShowcaseProps> = ({
  onLaunchSim,
  onOpenAudit,
  onOpenTrainStudio,
  onOpenReport,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('engineers');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  return (
    <section
      id="platform-value-showcase"
      className="border-b border-[#1b253b] bg-gradient-to-b from-[#060a12] via-[#080d19] to-[#04060a] px-4 sm:px-8 py-12 sm:py-16 text-slate-200"
    >
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Flagship Magnet Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-sky-500/15 via-indigo-500/15 to-emerald-500/15 border border-sky-500/30 text-sky-400 text-xs font-mono font-bold tracking-wider uppercase shadow-lg shadow-sky-500/10">
            <Sparkles size={13} className="text-sky-400" />
            <span>THE RELIABILITY & TURBOMACHINERY INTELLIGENCE PLATFORM</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Why Reliability Engineers & Mechanical Students Choose{' '}
            <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Mechanical Lab Pro
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
            Static textbook diagrams cannot rotate, and physical plant machinery is too costly to break.
            Mechanical Lab Pro delivers <strong>11 full-field deterministic Float64 digital twins</strong> and{' '}
            <strong>7 diagnostic verification studios</strong>—giving engineers a safe failure sandbox and students
            an interactive 60 FPS physics laboratory.
          </p>

          {/* Quick Magnet Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 text-xs font-mono">
            <span className="px-3 py-1 rounded-full bg-[#0a1222] border border-sky-500/30 text-sky-300 flex items-center gap-1.5 shadow-sm">
              <Zap size={13} className="text-sky-400" />
              <span>100% In-Browser Float64 Math</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-[#091612] border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5 shadow-sm">
              <ShieldCheck size={13} className="text-emerald-400" />
              <span>API • ISO • ASME • AGMA Calibrated</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-[#181206] border border-amber-500/30 text-amber-300 flex items-center gap-1.5 shadow-sm">
              <BookOpen size={13} className="text-amber-400" />
              <span>Zero Black-Box Math • Transparent Proofs</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-[#160a1d] border border-purple-500/30 text-purple-300 flex items-center gap-1.5 shadow-sm">
              <Cpu size={13} className="text-purple-400" />
              <span>Free • No Install • Instant Access</span>
            </span>
          </div>
        </div>

        {/* Interactive Master Selector Tabs */}
        <div className="flex items-center justify-center">
          <div className="p-1.5 bg-[#090f1d] border border-[#1d2d4a] rounded-2xl flex flex-wrap items-center justify-center gap-1.5 font-mono text-xs sm:text-sm shadow-xl max-w-4xl w-full">
            <button
              onClick={() => setActiveTab('engineers')}
              className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'engineers'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-[#121c32]'
              }`}
            >
              <Wrench size={16} />
              <span>For Reliability Engineers</span>
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'students'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-slate-950 shadow-lg shadow-sky-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-[#121c32]'
              }`}
            >
              <GraduationCap size={16} />
              <span>For Students & Academia</span>
            </button>

            <button
              onClick={() => setActiveTab('offerings')}
              className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'offerings'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-lg shadow-amber-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-[#121c32]'
              }`}
            >
              <Workflow size={16} />
              <span>Integrated Reliability Workflow</span>
            </button>

            <button
              onClick={() => setActiveTab('standards')}
              className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'standards'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-[#121c32]'
              }`}
            >
              <Award size={16} />
              <span>Approved Standards Matrix</span>
            </button>
          </div>
        </div>

        {/* TAB 1: FOR PRACTICING RELIABILITY ENGINEERS */}
        {activeTab === 'engineers' && (
          <div className="space-y-8 animate-fadeIn">
            {/* 4 Core Pillars for Engineers */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Pillar 1 */}
              <div className="p-5 rounded-2xl bg-[#081213] border border-emerald-500/25 flex flex-col justify-between group hover:border-emerald-400 transition-all shadow-md">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
                    <ShieldAlert size={20} />
                  </div>
                  <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Zero-Risk Failure Incursion
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Trigger aerodynamic surge, sub-synchronous oil whirl, cavitation pitting, and soft-foot thermal distortion. Validate anti-surge valve (ASV) response times and bypass line geometries without plant trips.
                  </p>
                </div>
                <div className="pt-3 mt-4 border-t border-emerald-900/40 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={12} />
                  <span>API 617 & API 670 Trip Setpoints</span>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="p-5 rounded-2xl bg-[#081213] border border-emerald-500/25 flex flex-col justify-between group hover:border-emerald-400 transition-all shadow-md">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
                    <RotateCw size={20} />
                  </div>
                  <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Fast Turnaround Calculations
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Calculate front-foot and back-foot shim adjustments for rim-and-face and reverse indicator laser setups (API 686). Compensate for thermal growth differences between driver and driven machines instantaneously.
                  </p>
                </div>
                <div className="pt-3 mt-4 border-t border-emerald-900/40 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={12} />
                  <span>Sub-mil Precision & DBSE Limits</span>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="p-5 rounded-2xl bg-[#081213] border border-emerald-500/25 flex flex-col justify-between group hover:border-emerald-400 transition-all shadow-md">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
                    <Workflow size={20} />
                  </div>
                  <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Forensic RCA & Weibull Life
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Conduct structured 5-Why root cause analysis calibrated to IEC 62740. Fit two-parameter Weibull distributions (slope $\beta$, characteristic life $\eta$) to distinguish infant mortality from fatigue wear-out.
                  </p>
                </div>
                <div className="pt-3 mt-4 border-t border-emerald-900/40 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={12} />
                  <span>IEC 62740 & ISO 14224 Structure</span>
                </div>
              </div>

              {/* Pillar 4 */}
              <div className="p-5 rounded-2xl bg-[#081213] border border-emerald-500/25 flex flex-col justify-between group hover:border-emerald-400 transition-all shadow-md">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
                    <FileText size={20} />
                  </div>
                  <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Auditable Engineering Reports
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Generate printable calculation records complete with input parameters, governing code formulas, pass/fail safety margins, and engineering notes. Hand them directly to plant managers and auditors.
                  </p>
                </div>
                <div className="pt-3 mt-4 border-t border-emerald-900/40 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={12} />
                  <span>Verifiable Timestamped Records</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FOR ENGINEERING STUDENTS & ACADEMIA */}
        {activeTab === 'students' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Student Value Proposition Hero Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0c182b] via-[#071120] to-[#040a14] border border-sky-500/30 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-3xl space-y-3 relative z-10">
                <div className="flex items-center gap-2 text-xs font-mono text-sky-400 font-bold uppercase tracking-wider">
                  <GraduationCap size={15} />
                  <span>UNDERGRADUATE, GRADUATE & RESEARCH MASTERY</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Equations Brought to Life in 60 FPS Dynamic Motion
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-sans">
                  Staring at textbook equations in fluid mechanics, thermodynamics, and machine design only gets you so far. Mechanical Lab Pro translates the differential equations of Navier-Stokes, the 2D Reynolds lubrication equation, IAPWS-IF97 steam enthalpy expansions, and Campbell interference lines into live, interactive visual physics right in your browser.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => onLaunchSim('turbine')}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-sky-500/20 cursor-pointer"
                  >
                    <Play size={13} className="fill-current" />
                    <span>Simulate Steam Turbine Mollier Expansion</span>
                  </button>
                  <button
                    onClick={() => onLaunchSim('journal')}
                    className="px-4 py-2 bg-[#0e1a2f] hover:bg-[#152747] border border-sky-500/40 text-sky-300 font-mono font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Activity size={13} />
                    <span>Visualize 2D Reynolds Oil Pressure Hill</span>
                  </button>
                  <button
                    onClick={onOpenAudit}
                    className="px-4 py-2 bg-[#0e1a2f] hover:bg-[#152747] border border-sky-500/40 text-sky-300 font-mono font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <BookOpen size={13} />
                    <span>View Formula Derivation Proofs</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4 Core Pillars for Students */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Student Pillar 1 */}
              <div className="p-5 rounded-2xl bg-[#091322] border border-sky-500/25 flex flex-col justify-between group hover:border-sky-400 transition-all shadow-md">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center font-bold">
                    <Activity size={20} />
                  </div>
                  <h4 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                    Dynamic Visual Intuition
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Watch how adjusting viscosity $\mu$ shifts the Sommerfeld number, how closing an anti-surge valve steers operating flow back from the surge line, and how unbalance shifts shaft orbital trajectories.
                  </p>
                </div>
                <div className="pt-3 mt-4 border-t border-sky-900/40 text-[11px] font-mono text-sky-400 flex items-center gap-1.5">
                  <CheckCircle2 size={12} />
                  <span>Real-Time Kinetic SVG Rendering</span>
                </div>
              </div>

              {/* Student Pillar 2 */}
              <div className="p-5 rounded-2xl bg-[#091322] border border-sky-500/25 flex flex-col justify-between group hover:border-sky-400 transition-all shadow-md">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center font-bold">
                    <Cpu size={20} />
                  </div>
                  <h4 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                    100% Deterministic Solvers
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    No canned animations, pre-rendered videos, or generic AI text. Every number is calculated on-the-fly using 64-bit floating point precision Runge-Kutta numerical integration and thermodynamic equations.
                  </p>
                </div>
                <div className="pt-3 mt-4 border-t border-sky-900/40 text-[11px] font-mono text-sky-400 flex items-center gap-1.5">
                  <CheckCircle2 size={12} />
                  <span>IEEE-754 64-Bit Float Precision</span>
                </div>
              </div>

              {/* Student Pillar 3 */}
              <div className="p-5 rounded-2xl bg-[#091322] border border-sky-500/25 flex flex-col justify-between group hover:border-sky-400 transition-all shadow-md">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center font-bold">
                    <Award size={20} />
                  </div>
                  <h4 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                    FE / PE Exam & Interview Edge
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Build rock-solid mental models for the NCEES FE/PE Mechanical exam and turbomachinery job interviews. Understand why cavitation occurs, how Campbell diagrams prevent resonance, and what causes gear pitting.
                  </p>
                </div>
                <div className="pt-3 mt-4 border-t border-sky-900/40 text-[11px] font-mono text-sky-400 flex items-center gap-1.5">
                  <CheckCircle2 size={12} />
                  <span>Aligned with ISO 18436 CAT I-IV</span>
                </div>
              </div>

              {/* Student Pillar 4 */}
              <div className="p-5 rounded-2xl bg-[#091322] border border-sky-500/25 flex flex-col justify-between group hover:border-sky-400 transition-all shadow-md">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center font-bold">
                    <BookOpen size={20} />
                  </div>
                  <h4 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                    Transparent Math Proofs
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Every simulator is backed by an open calculation audit sheet showing the governing formula, dimensional units, variable descriptions, and references to standard academic textbooks and codes.
                  </p>
                </div>
                <div className="pt-3 mt-4 border-t border-sky-900/40 text-[11px] font-mono text-sky-400 flex items-center gap-1.5">
                  <CheckCircle2 size={12} />
                  <span>Audit Trail with Derivations</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INTEGRATED RELIABILITY WORKFLOW */}
        {activeTab === 'offerings' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Workflow Overview Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#201507] via-[#140c04] to-[#0a0602] border border-amber-500/30 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-3xl space-y-3 relative z-10">
                <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
                  <Workflow size={15} />
                  <span>END-TO-END PLANT RELIABILITY WORKFLOW</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  How Multi-Physics Modeling Connects to Forensic Reliability
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-sans">
                  Rotating machinery physics does not exist in isolation. Mechanical Lab Pro connects deterministic ODE physics solvers, safe failure incursion testing, multi-body plant drivetrain cascading, and IEC 62740 forensic root cause analysis into a single continuous engineering workflow.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={onOpenTrainStudio}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    <Network size={14} />
                    <span>Explore Machinery Train Coupling</span>
                  </button>
                  <button
                    onClick={onOpenAudit}
                    className="px-4 py-2 bg-[#1c1206] hover:bg-[#281b0a] border border-amber-500/40 text-amber-300 font-mono font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <FileText size={14} />
                    <span>Review Calculation Proofs</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4-Phase Integrated Workflow Architecture Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Phase 1 */}
              <div className="p-6 rounded-2xl bg-[#0c111d] border border-sky-500/30 space-y-4 shadow-lg flex flex-col justify-between hover:border-sky-400/50 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
                      PHASE 01 // FIRST-PRINCIPLES SOLVERS
                    </span>
                    <span className="text-xs font-mono text-slate-400">Deterministic</span>
                  </div>
                  <h4 className="text-lg font-bold text-white">Real-Time Multi-Physics Parametric Engine</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Rather than relying on pre-rendered lookups, every simulation integrates closed-form differential equations in real time using 64-bit IEEE-754 precision:
                  </p>
                  <ul className="space-y-2 text-xs font-sans text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-sky-400 shrink-0 mt-0.5" />
                      <span><strong>Runge-Kutta 4th-Order ODEs:</strong> Continuous thermodynamic Mollier steam expansion, gas polytropic compression, and rotor orbits computed at 60 FPS.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-sky-400 shrink-0 mt-0.5" />
                      <span><strong>Hydrodynamic Lubrication:</strong> 2D Reynolds boundary integration solving oil wedge pressure profiles and Sommerfeld numbers dynamically.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-sky-400 shrink-0 mt-0.5" />
                      <span><strong>Instant Sensitivity Sweeps:</strong> Modify RPM, suction pressure, gas molecular weight, or ambient temperature with zero server roundtrip latency.</span>
                    </li>
                  </ul>
                  <div className="p-2.5 rounded-lg bg-[#070b14] border border-[#17243b] text-[11px] font-mono text-sky-300 flex items-center justify-between">
                    <span>Governing Standards:</span>
                    <span className="font-bold text-slate-200">API 610 • API 617 • API 612</span>
                  </div>
                </div>
                <button
                  onClick={() => onLaunchSim('pump')}
                  className="w-full py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/40 text-sky-300 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-3"
                >
                  <span>Launch Centrifugal Pump ODE Model</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* Phase 2 */}
              <div className="p-6 rounded-2xl bg-[#0c111d] border border-rose-500/30 space-y-4 shadow-lg flex flex-col justify-between hover:border-rose-400/50 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      PHASE 02 // FAULT INCURSION
                    </span>
                    <span className="text-xs font-mono text-slate-400">Zero Hardware Risk</span>
                  </div>
                  <h4 className="text-lg font-bold text-white">Safe Boundary Excursions & Trip Testing</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Safely push virtual machinery beyond standard operating envelopes without risking millions of dollars in mechanical damage or plant downtime:
                  </p>
                  <ul className="space-y-2 text-xs font-sans text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-rose-400 shrink-0 mt-0.5" />
                      <span><strong>Aerodynamic Compressor Surge:</strong> Throttle discharge flow past the Surge Limit Line (SLL) and observe violent flow reversal and ASV response.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-rose-400 shrink-0 mt-0.5" />
                      <span><strong>Sub-Synchronous Oil Whip:</strong> Cross instability speed thresholds to watch oil whirl lock onto rotor natural frequencies at 0.43X–0.48X.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-rose-400 shrink-0 mt-0.5" />
                      <span><strong>Automated Protection Tripping:</strong> Dynamic safety factor calculation triggers real-time API 670 alarm thresholds and trip interlocks.</span>
                    </li>
                  </ul>
                  <div className="p-2.5 rounded-lg bg-[#070b14] border border-[#17243b] text-[11px] font-mono text-rose-300 flex items-center justify-between">
                    <span>Governing Standards:</span>
                    <span className="font-bold text-slate-200">API 670 • ISO 10816 • API 682</span>
                  </div>
                </div>
                <button
                  onClick={() => onLaunchSim('compressor')}
                  className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-3"
                >
                  <span>Test Centrifugal Compressor Surge</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* Phase 3 */}
              <div className="p-6 rounded-2xl bg-[#0c111d] border border-amber-500/30 space-y-4 shadow-lg flex flex-col justify-between hover:border-amber-400/50 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      PHASE 03 // TRAIN COUPLING & SPECTRA
                    </span>
                    <span className="text-xs font-mono text-slate-400">Cross-Asset</span>
                  </div>
                  <h4 className="text-lg font-bold text-white">Drivetrain Cascading & Spectral Isolation</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Trace how upstream driver upsets impact downstream gearboxes, couplings, and driven compressors in real time:
                  </p>
                  <ul className="space-y-2 text-xs font-sans text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-amber-400 shrink-0 mt-0.5" />
                      <span><strong>Dynamic Torque & Trip Propagation:</strong> Coupling stiffness and inertia transfer torsional oscillations across multi-asset drivelines.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-amber-400 shrink-0 mt-0.5" />
                      <span><strong>3D FFT Spectral Waterfalls:</strong> Decompose live vibration into discrete harmonic orders—1X unbalance, 2X misalignment, and gear mesh harmonics (f_mesh).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-amber-400 shrink-0 mt-0.5" />
                      <span><strong>Shaft Orbit Trajectories:</strong> Visualize elliptical center-of-mass orbits to distinguish between precessional whirl and bearing pre-load.</span>
                    </li>
                  </ul>
                  <div className="p-2.5 rounded-lg bg-[#070b14] border border-[#17243b] text-[11px] font-mono text-amber-300 flex items-center justify-between">
                    <span>Governing Standards:</span>
                    <span className="font-bold text-slate-200">API 686 • ISO 1940 • AGMA 2001</span>
                  </div>
                </div>
                <button
                  onClick={onOpenTrainStudio}
                  className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-3"
                >
                  <span>Launch Machinery Train Cascade Studio</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* Phase 4 */}
              <div className="p-6 rounded-2xl bg-[#0c111d] border border-emerald-500/30 space-y-4 shadow-lg flex flex-col justify-between hover:border-emerald-400/50 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      PHASE 04 // FORENSICS & AUDITING
                    </span>
                    <span className="text-xs font-mono text-slate-400">Verifiable</span>
                  </div>
                  <h4 className="text-lg font-bold text-white">Forensic RCA, Weibull Life & Math Proofs</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Transform physical telemetry into verified failure root causes, probabilistic life estimations, and defensible audit records:
                  </p>
                  <ul className="space-y-2 text-xs font-sans text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Structured RCA (IEC 62740):</strong> Formulate 5-Why Ishikawa fault trees directly tied to physical telemetry evidence and preventive barriers.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Weibull Hazard Modeling:</strong> 2-parameter MLE fitting ($\beta, \eta$) to determine B10 life expectancy and optimize turnaround intervals.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>100% Transparent Math Proofs:</strong> Inspect open LaTeX calculation sheets with variable inputs, conversion steps, and printable PDF reports.</span>
                    </li>
                  </ul>
                  <div className="p-2.5 rounded-lg bg-[#070b14] border border-[#17243b] text-[11px] font-mono text-emerald-300 flex items-center justify-between">
                    <span>Governing Standards:</span>
                    <span className="font-bold text-slate-200">IEC 62740 • ISO 281 • JCGM 100 GUM</span>
                  </div>
                </div>
                <button
                  onClick={onOpenAudit}
                  className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-3"
                >
                  <span>Open Formula Derivations & Audits</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: APPROVED STANDARDS REFERENCES */}
        {activeTab === 'standards' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Standards Overview Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#1a0e28] via-[#100919] to-[#08050e] border border-purple-500/30 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-3xl space-y-3 relative z-10">
                <div className="flex items-center gap-2 text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">
                  <Award size={15} />
                  <span>CALIBRATED TO RECOGNIZED ENGINEERING CODES</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Approved Standard References & Governed Criteria
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-sans">
                  The mathematical boundary formulations, allowable stress envelopes, and vibration alarm limits across Mechanical Lab Pro reference recognized international standards published by API, ISO, ASME, AGMA, and IEC. Every criterion is mapped directly to its governing equation for diagnostic verification and academic evaluation.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={onOpenAudit}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 font-mono font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20 cursor-pointer"
                  >
                    <FileText size={14} />
                    <span>Open Calculation Verification Sheets</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Governed Standards Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Card 1: API Standards */}
              <div className="p-5 rounded-2xl bg-[#0d101a] border border-sky-500/30 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono font-bold text-xs border border-sky-500/30">
                    API STANDARDS
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Petroleum & Gas</span>
                </div>
                <h4 className="text-base font-bold text-white">American Petroleum Institute</h4>
                <div className="space-y-2 text-xs text-slate-300 font-sans">
                  <div className="p-2 rounded-lg bg-[#070b13] border border-[#172338]">
                    <div className="flex items-center justify-between font-mono text-sky-400 font-bold">
                      <button
                        onClick={() => handleCopyCode('API 610 / ISO 13709')}
                        className="hover:underline flex items-center gap-1"
                        title="Click to copy"
                      >
                        <span>API 610 / ISO 13709</span>
                        {copiedCode === 'API 610 / ISO 13709' ? <Check size={11} className="text-emerald-400" /> : null}
                      </button>
                      <span className="text-[10px] text-slate-400">Centrifugal Pumps</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">NPSHa safety margin ≥ 1.0 m (or 1.2x NPSH3), minimum continuous stable flow (MCSF).</p>
                  </div>

                  <div className="p-2 rounded-lg bg-[#070b13] border border-[#172338]">
                    <div className="flex items-center justify-between font-mono text-sky-400 font-bold">
                      <button
                        onClick={() => handleCopyCode('API 617 / ASME PTC 10')}
                        className="hover:underline flex items-center gap-1"
                        title="Click to copy"
                      >
                        <span>API 617 / ASME PTC 10</span>
                        {copiedCode === 'API 617 / ASME PTC 10' ? <Check size={11} className="text-emerald-400" /> : null}
                      </button>
                      <span className="text-[10px] text-slate-400">Centrifugal Compressors</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">Surge Control Line (SCL) buffer ≥ 10% flow margin, ASV recycle response, thrust reversal equilibrium.</p>
                  </div>

                  <div className="p-2 rounded-lg bg-[#070b13] border border-[#172338]">
                    <div className="flex items-center justify-between font-mono text-sky-400 font-bold">
                      <button
                        onClick={() => handleCopyCode('API 682 / ISO 21049')}
                        className="hover:underline flex items-center gap-1"
                        title="Click to copy"
                      >
                        <span>API 682 / ISO 21049</span>
                        {copiedCode === 'API 682 / ISO 21049' ? <Check size={11} className="text-emerald-400" /> : null}
                      </button>
                      <span className="text-[10px] text-slate-400">Shaft Sealing Systems</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">Plan 11/53 flush vapor suppression margin ≥ 200 kPa, seal chamber heat dissipation balance.</p>
                  </div>

                  <div className="p-2 rounded-lg bg-[#070b13] border border-[#172338]">
                    <div className="flex items-center justify-between font-mono text-sky-400 font-bold">
                      <button
                        onClick={() => handleCopyCode('API 686 Chapter 7')}
                        className="hover:underline flex items-center gap-1"
                        title="Click to copy"
                      >
                        <span>API 686 Chapter 7</span>
                        {copiedCode === 'API 686 Chapter 7' ? <Check size={11} className="text-emerald-400" /> : null}
                      </button>
                      <span className="text-[10px] text-slate-400">Shaft Alignment</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">Dynamic hot offset corrections, reverse indicator rim/face shims, and DBSE coupling gap tolerances.</p>
                  </div>
                </div>
              </div>

              {/* Card 2: ISO Standards */}
              <div className="p-5 rounded-2xl bg-[#0d101a] border border-emerald-500/30 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/30">
                    ISO STANDARDS
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">International Norms</span>
                </div>
                <h4 className="text-base font-bold text-white">Vibration, Balancing & Life</h4>
                <div className="space-y-2 text-xs text-slate-300 font-sans">
                  <div className="p-2 rounded-lg bg-[#070b13] border border-[#172338]">
                    <div className="flex items-center justify-between font-mono text-emerald-400 font-bold">
                      <button
                        onClick={() => handleCopyCode('ISO 10816 / ISO 20816')}
                        className="hover:underline flex items-center gap-1"
                        title="Click to copy"
                      >
                        <span>ISO 10816 / ISO 20816</span>
                        {copiedCode === 'ISO 10816 / ISO 20816' ? <Check size={11} className="text-emerald-400" /> : null}
                      </button>
                      <span className="text-[10px] text-slate-400">Vibration Severity</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">Evaluation zones: Zone A (new), Zone B (unrestricted), Zone C (warning), Zone D (trip damage limit).</p>
                  </div>

                  <div className="p-2 rounded-lg bg-[#070b13] border border-[#172338]">
                    <div className="flex items-center justify-between font-mono text-emerald-400 font-bold">
                      <button
                        onClick={() => handleCopyCode('ISO 1940-1 Grade G2.5')}
                        className="hover:underline flex items-center gap-1"
                        title="Click to copy"
                      >
                        <span>ISO 1940-1 Grade G2.5</span>
                        {copiedCode === 'ISO 1940-1 Grade G2.5' ? <Check size={11} className="text-emerald-400" /> : null}
                      </button>
                      <span className="text-[10px] text-slate-400">Rotor Dynamic Balance</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">Permissible residual unbalance U_per = 1000 · (G · M) / ω, polar balance correction vectors.</p>
                  </div>

                  <div className="p-2 rounded-lg bg-[#070b13] border border-[#172338]">
                    <div className="flex items-center justify-between font-mono text-emerald-400 font-bold">
                      <button
                        onClick={() => handleCopyCode('ISO 281 / ISO 15243')}
                        className="hover:underline flex items-center gap-1"
                        title="Click to copy"
                      >
                        <span>ISO 281 / ISO 15243</span>
                        {copiedCode === 'ISO 281 / ISO 15243' ? <Check size={11} className="text-emerald-400" /> : null}
                      </button>
                      <span className="text-[10px] text-slate-400">Rolling Bearings</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">Modified L10mh fatigue life rating with lubrication factor a_ISO and defect frequencies (BPFO/BPFI).</p>
                  </div>

                  <div className="p-2 rounded-lg bg-[#070b13] border border-[#172338]">
                    <div className="flex items-center justify-between font-mono text-emerald-400 font-bold">
                      <button
                        onClick={() => handleCopyCode('ISO 4406 / ISO 18436')}
                        className="hover:underline flex items-center gap-1"
                        title="Click to copy"
                      >
                        <span>ISO 4406 / ISO 18436</span>
                        {copiedCode === 'ISO 4406 / ISO 18436' ? <Check size={11} className="text-emerald-400" /> : null}
                      </button>
                      <span className="text-[10px] text-slate-400">Oil Cleanliness & Vibe</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">3-tier solid particle contamination codes (R4 / R6 / R14) and CAT I-IV condition monitoring.</p>
                  </div>
                </div>
              </div>

              {/* Card 3: ASME, AGMA & IEC */}
              <div className="p-5 rounded-2xl bg-[#0d101a] border border-amber-500/30 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-xs border border-amber-500/30">
                    ASME • AGMA • IEC
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Piping & Power</span>
                </div>
                <h4 className="text-base font-bold text-white">Pressure, Gearing & RCA</h4>
                <div className="space-y-2 text-xs text-slate-300 font-sans">
                  <div className="p-2 rounded-lg bg-[#070b13] border border-[#172338]">
                    <div className="flex items-center justify-between font-mono text-amber-400 font-bold">
                      <button
                        onClick={() => handleCopyCode('ASME B31.3 §319')}
                        className="hover:underline flex items-center gap-1"
                        title="Click to copy"
                      >
                        <span>ASME B31.3 §319</span>
                        {copiedCode === 'ASME B31.3 §319' ? <Check size={11} className="text-emerald-400" /> : null}
                      </button>
                      <span className="text-[10px] text-slate-400">Piping Flexibility</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">Thermal expansion displacement stress range $S_A = f[1.25(S_c + S_h) - S_L]$ and pump nozzle loads.</p>
                  </div>

                  <div className="p-2 rounded-lg bg-[#070b13] border border-[#172338]">
                    <div className="flex items-center justify-between font-mono text-amber-400 font-bold">
                      <button
                        onClick={() => handleCopyCode('AGMA 2001-D04 / ISO 6336')}
                        className="hover:underline flex items-center gap-1"
                        title="Click to copy"
                      >
                        <span>AGMA 2001-D04 / ISO 6336</span>
                        {copiedCode === 'AGMA 2001-D04 / ISO 6336' ? <Check size={11} className="text-emerald-400" /> : null}
                      </button>
                      <span className="text-[10px] text-slate-400">Gear Rating</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">Hertzian contact stress pitting factor $S_H \ge 1.25$, tooth bending strength $S_F \ge 1.40$, scuffing risk.</p>
                  </div>

                  <div className="p-2 rounded-lg bg-[#070b13] border border-[#172338]">
                    <div className="flex items-center justify-between font-mono text-amber-400 font-bold">
                      <button
                        onClick={() => handleCopyCode('IEC 62740')}
                        className="hover:underline flex items-center gap-1"
                        title="Click to copy"
                      >
                        <span>IEC 62740</span>
                        {copiedCode === 'IEC 62740' ? <Check size={11} className="text-emerald-400" /> : null}
                      </button>
                      <span className="text-[10px] text-slate-400">Root Cause Analysis</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">5-Why investigative discipline, failure tree logic, barrier effectiveness, and corrective action validation.</p>
                  </div>

                  <div className="p-2 rounded-lg bg-[#070b13] border border-[#172338]">
                    <div className="flex items-center justify-between font-mono text-amber-400 font-bold">
                      <button
                        onClick={() => handleCopyCode('API 612 / ASME PTC 6')}
                        className="hover:underline flex items-center gap-1"
                        title="Click to copy"
                      >
                        <span>API 612 / ASME PTC 6</span>
                        {copiedCode === 'API 612 / ASME PTC 6' ? <Check size={11} className="text-emerald-400" /> : null}
                      </button>
                      <span className="text-[10px] text-slate-400">Steam Turbines</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">Campbell resonance safety margin $\ge 10\%$ from nozzle pass frequencies, exhaust steam wetness $\le 12\%$.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal Notice */}
            <div className="p-4 rounded-xl bg-[#080d17] border border-[#1b253b] text-[11px] text-slate-400 leading-relaxed space-y-1">
              <div className="font-semibold text-slate-300 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-sky-400" />
                <span>Notice Regarding Nominative Fair Use of Engineering Standards</span>
              </div>
              <p>
                References to international standard codes (API, ISO, ASME, AGMA, IEC) and publication editions are for nominative fair use to describe recognized mathematical principles and educational benchmark methods. Mechanical Lab Pro is an independent educational and diagnostic tool with no affiliation, endorsement, sponsorship, or certification by any standards organization or regulatory agency.
              </p>
            </div>
          </div>
        )}

        {/* The "Why Mechanical Lab Pro" Comparison Matrix with Ticks & Crosses */}
        <div className="space-y-6 pt-4">
          <div className="text-center space-y-2">
            <div className="text-[10px] font-mono text-sky-400 font-bold uppercase tracking-wider">
              HOW WE COMPARE • HEAD-TO-HEAD AUDIT
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Why Engineers & Students Prefer Mechanical Lab Pro
            </h3>
            <p className="text-xs text-slate-400 max-w-xl mx-auto font-sans">
              From classrooms to refineries: the modern way to understand rotating machinery physics.
            </p>
          </div>

          {/* Quick Scorecard Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#090d16] border border-[#1b253b] flex flex-col items-center justify-center text-center space-y-1">
              <span className="text-[11px] font-mono text-slate-400 font-medium">Textbooks</span>
              <div className="flex items-center gap-1 text-rose-400 font-mono font-bold text-sm">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-500/20 border border-rose-500/40">
                  <X size={10} strokeWidth={3} />
                </span>
                <span>1 / 7 Met</span>
              </div>
              <span className="text-[10px] text-slate-400">Static & Abstract</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#090d16] border border-[#1b253b] flex flex-col items-center justify-center text-center space-y-1">
              <span className="text-[11px] font-mono text-slate-400 font-medium">Industrial CFD/FEA</span>
              <div className="flex items-center gap-1 text-amber-400 font-mono font-bold text-sm">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/40">
                  <AlertTriangle size={9} strokeWidth={2.5} />
                </span>
                <span>2 / 7 Met</span>
              </div>
              <span className="text-[10px] text-slate-400">$25k+ & Hours to Solve</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#090d16] border border-[#1b253b] flex flex-col items-center justify-center text-center space-y-1">
              <span className="text-[11px] font-mono text-slate-400 font-medium">Generative AI LLMs</span>
              <div className="flex items-center gap-1 text-rose-400 font-mono font-bold text-sm">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-500/20 border border-rose-500/40">
                  <X size={10} strokeWidth={3} />
                </span>
                <span>0 / 7 Met</span>
              </div>
              <span className="text-[10px] text-slate-400">Hallucination Hazard</span>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-b from-emerald-950/30 to-[#07130e] border border-emerald-500/50 flex flex-col items-center justify-center text-center space-y-1 shadow-lg shadow-emerald-950/20">
              <span className="text-[11px] font-mono text-emerald-300 font-bold">Mechanical Lab Pro</span>
              <div className="flex items-center gap-1 text-emerald-400 font-mono font-bold text-sm">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/25 border border-emerald-400">
                  <Check size={10} strokeWidth={3} />
                </span>
                <span>7 / 7 Met (100%)</span>
              </div>
              <span className="text-[10px] text-emerald-300/80 font-mono">Instant • Free • Verifiable</span>
            </div>
          </div>

          {/* High-Impact Comparison Table */}
          <div className="overflow-x-auto custom-scrollbar border border-[#1b253b] rounded-2xl bg-[#090d16] shadow-2xl font-mono text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#0b101c] text-slate-300 border-b border-[#1b253b]">
                <tr>
                  <th className="py-4 px-4 font-bold text-white w-[22%]">Capability Dimension</th>
                  <th className="py-4 px-4 text-slate-400 w-[19%]">Traditional Textbooks</th>
                  <th className="py-4 px-4 text-slate-400 w-[19%]">Heavy CFD / FEA</th>
                  <th className="py-4 px-4 text-slate-400 w-[19%]">Generative AI LLMs</th>
                  <th className="py-4 px-4 text-emerald-300 font-bold bg-emerald-950/30 border-l border-r border-emerald-500/30 w-[21%]">
                    <div className="flex items-center justify-between">
                      <span>Mechanical Lab Pro</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                        OPTIMAL
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#172033] text-slate-300">
                {/* Row 1: Dynamics & Motion */}
                <tr className="hover:bg-[#101726]/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white">
                    <div className="font-semibold text-slate-200">Real-Time Dynamics</div>
                    <div className="text-[10px] text-slate-400 font-normal">Kinetic machinery motion</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0 mt-0.5">
                        <X size={12} strokeWidth={3} />
                      </span>
                      <div>
                        <div className="font-bold text-rose-300">Static 2D</div>
                        <div className="text-[11px] text-slate-400 font-sans">Print diagrams only</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0 mt-0.5">
                        <AlertTriangle size={11} strokeWidth={2.5} />
                      </span>
                      <div>
                        <div className="font-bold text-amber-300">Pre-Rendered</div>
                        <div className="text-[11px] text-slate-400 font-sans">Requires 3D post-op</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0 mt-0.5">
                        <X size={12} strokeWidth={3} />
                      </span>
                      <div>
                        <div className="font-bold text-rose-300">Text Only</div>
                        <div className="text-[11px] text-slate-400 font-sans">Zero kinetic graphics</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 bg-emerald-950/20 border-l border-r border-emerald-500/30">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-400 border border-emerald-400 shrink-0 mt-0.5 shadow-sm shadow-emerald-500/40">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <div>
                        <div className="font-bold text-emerald-300">60 FPS Kinetic</div>
                        <div className="text-[11px] text-emerald-200/90 font-sans">Live vector ODE physics</div>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Row 2: Solve Latency */}
                <tr className="hover:bg-[#101726]/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white">
                    <div className="font-semibold text-slate-200">Solve Latency</div>
                    <div className="text-[10px] text-slate-400 font-normal">Time to responsive result</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0 mt-0.5">
                        <X size={12} strokeWidth={3} />
                      </span>
                      <div>
                        <div className="font-bold text-rose-300">Hours</div>
                        <div className="text-[11px] text-slate-400 font-sans">Manual hand algebra</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0 mt-0.5">
                        <X size={12} strokeWidth={3} />
                      </span>
                      <div>
                        <div className="font-bold text-rose-300">Hours to Days</div>
                        <div className="text-[11px] text-slate-400 font-sans">Server cluster compute</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0 mt-0.5">
                        <AlertTriangle size={11} strokeWidth={2.5} />
                      </span>
                      <div>
                        <div className="font-bold text-amber-300">Fast, Unverified</div>
                        <div className="text-[11px] text-slate-400 font-sans">Math errors frequent</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 bg-emerald-950/20 border-l border-r border-emerald-500/30">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-400 border border-emerald-400 shrink-0 mt-0.5 shadow-sm shadow-emerald-500/40">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <div>
                        <div className="font-bold text-emerald-300">&lt; 16 ms Real-Time</div>
                        <div className="text-[11px] text-emerald-200/90 font-sans">Reactive browser solve</div>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Row 3: Cost & Accessibility */}
                <tr className="hover:bg-[#101726]/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white">
                    <div className="font-semibold text-slate-200">Cost & Accessibility</div>
                    <div className="text-[10px] text-slate-400 font-normal">Barrier to entry</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0 mt-0.5">
                        <X size={12} strokeWidth={3} />
                      </span>
                      <div>
                        <div className="font-bold text-rose-300">$200+ / Course</div>
                        <div className="text-[11px] text-slate-400 font-sans">Hardcopy textbook cost</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0 mt-0.5">
                        <X size={12} strokeWidth={3} />
                      </span>
                      <div>
                        <div className="font-bold text-rose-300">$25,000+ / Seat</div>
                        <div className="text-[11px] text-slate-400 font-sans">Proprietary licenses</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0 mt-0.5">
                        <AlertTriangle size={11} strokeWidth={2.5} />
                      </span>
                      <div>
                        <div className="font-bold text-amber-300">Subscription</div>
                        <div className="text-[11px] text-slate-400 font-sans">$20–$200/mo API fees</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 bg-emerald-950/20 border-l border-r border-emerald-500/30">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-400 border border-emerald-400 shrink-0 mt-0.5 shadow-sm shadow-emerald-500/40">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <div>
                        <div className="font-bold text-emerald-300">100% Free • Open</div>
                        <div className="text-[11px] text-emerald-200/90 font-sans">Zero install, all devices</div>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Row 4: Catastrophic Fault Sandbox */}
                <tr className="hover:bg-[#101726]/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white">
                    <div className="font-semibold text-slate-200">Fault Sandbox</div>
                    <div className="text-[10px] text-slate-400 font-normal">Failure incursion testing</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0 mt-0.5">
                        <X size={12} strokeWidth={3} />
                      </span>
                      <div>
                        <div className="font-bold text-rose-300">Paper Only</div>
                        <div className="text-[11px] text-slate-400 font-sans">Hypothetical end problems</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0 mt-0.5">
                        <X size={12} strokeWidth={3} />
                      </span>
                      <div>
                        <div className="font-bold text-rose-300">Crashes / Diverges</div>
                        <div className="text-[11px] text-slate-400 font-sans">Surge/cavitation fails</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0 mt-0.5">
                        <X size={12} strokeWidth={3} />
                      </span>
                      <div>
                        <div className="font-bold text-rose-300">Hallucinated</div>
                        <div className="text-[11px] text-slate-400 font-sans">No physical stability</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 bg-emerald-950/20 border-l border-r border-emerald-500/30">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-400 border border-emerald-400 shrink-0 mt-0.5 shadow-sm shadow-emerald-500/40">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <div>
                        <div className="font-bold text-emerald-300">30+ 1-Click Faults</div>
                        <div className="text-[11px] text-emerald-200/90 font-sans">Safe surge, whip & shock</div>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Row 5: Governed Standards Compliance */}
                <tr className="hover:bg-[#101726]/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white">
                    <div className="font-semibold text-slate-200">Industry Standards</div>
                    <div className="text-[10px] text-slate-400 font-normal">API, ISO, ASME & AGMA</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0 mt-0.5">
                        <X size={12} strokeWidth={3} />
                      </span>
                      <div>
                        <div className="font-bold text-rose-300">Rarely Included</div>
                        <div className="text-[11px] text-slate-400 font-sans">Omits plant threshold limits</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0 mt-0.5">
                        <AlertTriangle size={11} strokeWidth={2.5} />
                      </span>
                      <div>
                        <div className="font-bold text-amber-300">Manual Mapping</div>
                        <div className="text-[11px] text-slate-400 font-sans">Raw stress post-process</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0 mt-0.5">
                        <X size={12} strokeWidth={3} />
                      </span>
                      <div>
                        <div className="font-bold text-rose-300">Severe Hazard</div>
                        <div className="text-[11px] text-slate-400 font-sans">Frequently cites wrong codes</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 bg-emerald-950/20 border-l border-r border-emerald-500/30">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-400 border border-emerald-400 shrink-0 mt-0.5 shadow-sm shadow-emerald-500/40">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <div>
                        <div className="font-bold text-emerald-300">Native Boundaries</div>
                        <div className="text-[11px] text-emerald-200/90 font-sans">API 610/617, ISO 10816</div>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Row 6: Mathematical Audit Trail */}
                <tr className="hover:bg-[#101726]/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white">
                    <div className="font-semibold text-slate-200">Calculation Audit</div>
                    <div className="text-[10px] text-slate-400 font-normal">Formula & derivation proofs</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0 mt-0.5">
                        <AlertTriangle size={11} strokeWidth={2.5} />
                      </span>
                      <div>
                        <div className="font-bold text-amber-300">Static Theory</div>
                        <div className="text-[11px] text-slate-400 font-sans">No live parameter sync</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0 mt-0.5">
                        <X size={12} strokeWidth={3} />
                      </span>
                      <div>
                        <div className="font-bold text-rose-300">Black-Box</div>
                        <div className="text-[11px] text-slate-400 font-sans">Closed proprietary solver</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0 mt-0.5">
                        <X size={12} strokeWidth={3} />
                      </span>
                      <div>
                        <div className="font-bold text-rose-300">Token Guessing</div>
                        <div className="text-[11px] text-slate-400 font-sans">Probabilistic black-box</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 bg-emerald-950/20 border-l border-r border-emerald-500/30">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-400 border border-emerald-400 shrink-0 mt-0.5 shadow-sm shadow-emerald-500/40">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <div>
                        <div className="font-bold text-emerald-300">Open Proof Sheets</div>
                        <div className="text-[11px] text-emerald-200/90 font-sans">LaTeX equations & units</div>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Row 7: Multi-Machine Plant Coupling */}
                <tr className="hover:bg-[#101726]/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white">
                    <div className="font-semibold text-slate-200">Plant Train Coupling</div>
                    <div className="text-[10px] text-slate-400 font-normal">Multi-shaft trip cascade</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0 mt-0.5">
                        <X size={12} strokeWidth={3} />
                      </span>
                      <div>
                        <div className="font-bold text-rose-300">Isolated Assets</div>
                        <div className="text-[11px] text-slate-400 font-sans">Single machine chapters</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0 mt-0.5">
                        <X size={12} strokeWidth={3} />
                      </span>
                      <div>
                        <div className="font-bold text-rose-300">Too Heavy</div>
                        <div className="text-[11px] text-slate-400 font-sans">Full trains exceed memory</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0 mt-0.5">
                        <X size={12} strokeWidth={3} />
                      </span>
                      <div>
                        <div className="font-bold text-rose-300">No Coupling</div>
                        <div className="text-[11px] text-slate-400 font-sans">Cannot track torque balance</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 bg-emerald-950/20 border-l border-r border-emerald-500/30">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-400 border border-emerald-400 shrink-0 mt-0.5 shadow-sm shadow-emerald-500/40">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <div>
                        <div className="font-bold text-emerald-300">4-Unit Cascade</div>
                        <div className="text-[11px] text-emerald-200/90 font-sans">Turbine-Coupling-Gear-Comp</div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4 Direct Test-Drive Scenario Buttons */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0a1426] via-[#09101f] to-[#070c18] border border-sky-500/30 space-y-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-mono text-sky-400 font-bold uppercase tracking-wider">
                LIVE INTERACTIVE TEST DRIVES
              </div>
              <h4 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Try a Flagship Physics Scenario in 1-Click
              </h4>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Instant load • No registration required
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => onLaunchSim('compressor')}
              className="p-4 rounded-xl bg-[#070e1b] border border-sky-500/30 hover:border-sky-400 hover:bg-[#0c182e] transition-all text-left group cursor-pointer shadow-md"
            >
              <div className="flex items-center justify-between text-xs font-mono text-sky-400 mb-2">
                <span className="font-bold">API 617 SURGE</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                Compressor Surge Trip
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Simulate flow reversal and acoustic plenum oscillations.
              </p>
            </button>

            <button
              onClick={() => onLaunchSim('pump')}
              className="p-4 rounded-xl bg-[#070e1b] border border-emerald-500/30 hover:border-emerald-400 hover:bg-[#091b15] transition-all text-left group cursor-pointer shadow-md"
            >
              <div className="flex items-center justify-between text-xs font-mono text-emerald-400 mb-2">
                <span className="font-bold">API 610 CAVITATION</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                Pump Cavitation Incursion
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Drop NPSHa below vapor pressure and observe bubble collapse shock.
              </p>
            </button>

            <button
              onClick={() => onLaunchSim('journal')}
              className="p-4 rounded-xl bg-[#070e1b] border border-amber-500/30 hover:border-amber-400 hover:bg-[#1a1206] transition-all text-left group cursor-pointer shadow-md"
            >
              <div className="flex items-center justify-between text-xs font-mono text-amber-400 mb-2">
                <span className="font-bold">API 670 WHIRL</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                0.43X Oil Whirl Instability
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Accelerate through critical speeds and view precessing orbital rings.
              </p>
            </button>

            <button
              onClick={onOpenTrainStudio}
              className="p-4 rounded-xl bg-[#070e1b] border border-purple-500/30 hover:border-purple-400 hover:bg-[#180e28] transition-all text-left group cursor-pointer shadow-md"
            >
              <div className="flex items-center justify-between text-xs font-mono text-purple-400 mb-2">
                <span className="font-bold">TRAIN CASCADE</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                Multi-Asset Driveline
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Inspect dynamic torque continuity and cross-machine trip cascades.
              </p>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
