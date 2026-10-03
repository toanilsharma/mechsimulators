import React, { useState, useMemo } from 'react';
import { RouteId, SimulatorId, UnitSystem } from '../../types/common';
import { useApp } from '../../context/AppContext';
import { SimulatorDiagnosticVisual } from './SimulatorDiagnosticVisual';
import { HeroLiveTelemetryConsole } from './HeroLiveTelemetryConsole';
import { LiveSimulatorsFooter } from '../Footer/LiveSimulatorsFooter';
import {
  ALL_SIMULATORS,
  SimulatorCategory,
  SimulatorItem,
} from '../../data/simulatorRegistry';
import {
  RotateCw,
  Wind,
  Flame,
  Activity,
  Cog,
  Compass,
  Disc,
  Layers,
  ShieldCheck,
  Target,
  Maximize2,
  FileText,
  Wrench,
  BookOpen,
  TrendingUp,
  Network,
  Droplets,
  Radio,
  Gauge,
  ExternalLink,
  Search,
  Sliders,
  Table as TableIcon,
  LayoutGrid,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Cpu,
  Zap,
  Globe,
  Filter,
  AlertTriangle,
  HelpCircle,
  FolderOpen,
} from 'lucide-react';

interface MechanicalLandingPageProps {
  unitSystem: UnitSystem;
  onOpenAudit?: () => void;
  onOpenReport?: () => void;
  onOpenInfo?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenDiagnostics?: () => void;
  onOpenCaseStudies?: () => void;
  onOpenReliabilityStudio?: () => void;
  onOpenMachineryTrainStudio?: () => void;
  onOpenSpectralLab?: () => void;
  onOpenTransientLab?: () => void;
  onOpenKineticCutaway?: () => void;
  onOpenFleetMatrix?: () => void;
  onOpenRcaStudio?: () => void;
  onOpenTribologyLab?: () => void;
  onOpenMonteCarlo?: () => void;
  onOpenExergyCarbon?: () => void;
}

// Distinct, professional dark visual identities for all 11 simulators matching livesimulators.com
interface SimTheme {
  name: string;
  category: string;
  standardShort: string;
  governingLaw: string;
  governingLawShort: string;
  equation: string;
  cleanFormula: string;
  solverMethod: string;
  failureMode: string;
  failureModeShort: string;
  criticalLimit: string;
  criticalLimitShort: string;
  cardBg: string;
  borderColor: string;
  topStripe: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  titleColor: string;
  btnBg: string;
  btnText: string;
}

const SIMULATOR_THEMES: Record<SimulatorId, SimTheme> = {
  pump: {
    name: 'Centrifugal Pump Cavitation & NPSH',
    category: 'Centrifugal Turbomachinery',
    standardShort: 'API 610 12th Ed / HI 9.6.1',
    governingLaw: 'Euler Turbomachinery Equation & Net Positive Suction Head',
    governingLawShort: 'Euler & NPSH Margin',
    equation: 'NPSH_a - NPSH_r \\ge 1.0\\text{ m}',
    cleanFormula: 'NPSHa - NPSHr ≥ 1.0 m',
    solverMethod: 'Thoma Cavitation Parameter & Rayleigh-Plesset ODE',
    failureMode: 'Impeller Eye Pitting & High Suction Vane Pass Shock',
    failureModeShort: 'Impeller Eye Cavitation Guard',
    criticalLimit: 'NPSH Margin < 0.5 m / Nss > 12,000',
    criticalLimitShort: 'NPSH Margin > 0.5 m',
    cardBg: 'bg-[#0A101D]',
    borderColor: 'border-slate-800/80 hover:border-cyan-500/60',
    topStripe: 'bg-cyan-500',
    iconBg: 'bg-cyan-500/15 border-cyan-500/30',
    iconColor: 'text-cyan-400',
    badgeBg: 'bg-cyan-950/80',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-500/40',
    titleColor: 'text-white',
    btnBg: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold',
    btnText: 'text-slate-950',
  },
  compressor: {
    name: 'Centrifugal Compressor Surge & Anti-Surge',
    category: 'Dynamic Turbomachinery',
    standardShort: 'API 617 8th Ed / ASME PTC 10',
    governingLaw: 'Polytropic Gas Compression & Dimensionless Surge Map',
    governingLawShort: 'Polytropic Surge Map',
    equation: '\\text{SLL Margin} = \\frac{Q - Q_{\\text{surge}}}{Q} \\ge 10\\%',
    cleanFormula: 'SLL Margin ≥ 10%',
    solverMethod: 'B-Parameter Acoustic Resonance & SLL Control PID',
    failureMode: 'Violent Reverse Flow Flashing & Dynamic Blade Stall',
    failureModeShort: 'Reverse Flow Flashing Guard',
    criticalLimit: 'Surge Margin < 10% / Pressure Oscillation > 5 Hz',
    criticalLimitShort: 'Trip Margin ≥ 10%',
    cardBg: 'bg-[#0A101D]',
    borderColor: 'border-slate-800/80 hover:border-amber-500/60',
    topStripe: 'bg-amber-500',
    iconBg: 'bg-amber-500/15 border-amber-500/30',
    iconColor: 'text-amber-400',
    badgeBg: 'bg-amber-950/80',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/40',
    titleColor: 'text-white',
    btnBg: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold',
    btnText: 'text-slate-950',
  },
  recip: {
    name: 'Reciprocating Compressor Cylinder Dynamics',
    category: 'Positive Displacement',
    standardShort: 'API 618 5th Ed / ISO 13631',
    governingLaw: 'Polytropic Cylinder PV Indicator & Kinematic Crankslider',
    governingLawShort: 'Cylinder P-V Indicator',
    equation: 'F_{\\text{rod}} = A_p(P_{\\text{he}} - P_{\\text{ce}})',
    cleanFormula: 'F_rod = Ap(Phe - Pce)',
    solverMethod: 'Crank-Angle Time-Stepping ODE & Acoustic Pulsation',
    failureMode: 'Piston Rod Buckling & Suction/Discharge Valve Flutter',
    failureModeShort: 'Piston Rod Buckling Guard',
    criticalLimit: 'Rod Reversal Duration < 15° / Load > 95% Rated',
    criticalLimitShort: 'Rod Reversal > 15°',
    cardBg: 'bg-[#0A101D]',
    borderColor: 'border-slate-800/80 hover:border-emerald-500/60',
    topStripe: 'bg-emerald-500',
    iconBg: 'bg-emerald-500/15 border-emerald-500/30',
    iconColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/80',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/40',
    titleColor: 'text-white',
    btnBg: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold',
    btnText: 'text-slate-950',
  },
  gearbox: {
    name: 'Industrial Gearbox Mesh Dynamics & Rating',
    category: 'Mechanical Transmission',
    standardShort: 'AGMA 6011-J14 / ISO 6336',
    governingLaw: 'Hertzian Contact Stress & Lewis Tooth Bending Formula',
    governingLawShort: 'Hertzian Contact & GMF',
    equation: 'f_{\\text{gmf}} = N_{\\text{pinion}} \\times Z_{\\text{pinion}}',
    cleanFormula: 'fgmf = Npinion × Zpinion',
    solverMethod: 'AGMA Geometry Factor Analysis & Dynamic Mesh Factor (Kv)',
    failureMode: 'Tooth Flank Macropitting, Scuffing & Root Fatigue',
    failureModeShort: 'Tooth Flank Scuffing Guard',
    criticalLimit: 'Contact Safety Factor < 1.0 / Scuffing Risk High',
    criticalLimitShort: 'Safety Factor SH ≥ 1.25',
    cardBg: 'bg-[#0A101D]',
    borderColor: 'border-slate-800/80 hover:border-orange-500/60',
    topStripe: 'bg-orange-500',
    iconBg: 'bg-orange-500/15 border-orange-500/30',
    iconColor: 'text-orange-400',
    badgeBg: 'bg-orange-950/80',
    badgeText: 'text-orange-300',
    badgeBorder: 'border-orange-500/40',
    titleColor: 'text-white',
    btnBg: 'bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold',
    btnText: 'text-slate-950',
  },
  turbine: {
    name: 'Multi-Stage Steam Turbine Expansion',
    category: 'Thermal Power Generation',
    standardShort: 'API 612 8th Ed / ASME PTC 6',
    governingLaw: 'Steam Mollier Enthalpy Drop & Willans Line Thermal Rating',
    governingLawShort: 'Steam Mollier Enthalpy',
    equation: 'P = \\dot{m}(h_1 - h_2)\\eta_{\\text{isen}}',
    cleanFormula: 'Power = ṁ · Δh_isen',
    solverMethod: 'IAPWS-IF97 Formulation & Stage Reheat Factor Calculation',
    failureMode: 'Exhaust Blade Water Droplet Erosion & Thermal Distortion',
    failureModeShort: 'Exhaust Blade Droplet Guard',
    criticalLimit: 'Exhaust Wetness > 12% / Thermal Stress Spike',
    criticalLimitShort: 'Exhaust Wetness < 12%',
    cardBg: 'bg-[#0A101D]',
    borderColor: 'border-slate-800/80 hover:border-rose-500/60',
    topStripe: 'bg-rose-500',
    iconBg: 'bg-rose-500/15 border-rose-500/30',
    iconColor: 'text-rose-400',
    badgeBg: 'bg-rose-950/80',
    badgeText: 'text-rose-300',
    badgeBorder: 'border-rose-500/40',
    titleColor: 'text-white',
    btnBg: 'bg-rose-500 hover:bg-rose-400 text-white font-bold',
    btnText: 'text-white',
  },
  bearing: {
    name: 'Rolling Element Bearing Defect Enveloping',
    category: 'Tribology & Condition Monitoring',
    standardShort: 'ISO 10816-3 / ISO 15243',
    governingLaw: 'Kinematic Defect Pass Frequencies (BPFO, BPFI, BSF, FTF)',
    governingLawShort: 'Kinematic Defect Pass (BPFO)',
    equation: 'BPFO = \\frac{n}{2}f_r\\left(1 - \\frac{d}{D}\\cos\\alpha\\right)',
    cleanFormula: 'BPFO = (n/2)·fr(1 - d/D·cosα)',
    solverMethod: 'High-Frequency Shock Pulse Enveloping & Demodulation',
    failureMode: 'Outer/Inner Race Flaking, Sub-Surface Spall & Cage Failure',
    failureModeShort: 'Raceway Flaking & Spall Guard',
    criticalLimit: 'Overall Velocity > 7.1 mm/s (ISO Zone D Trip)',
    criticalLimitShort: 'ISO Zone D Trip > 7.1 mm/s',
    cardBg: 'bg-[#0A101D]',
    borderColor: 'border-slate-800/80 hover:border-violet-500/60',
    topStripe: 'bg-violet-500',
    iconBg: 'bg-violet-500/15 border-violet-500/30',
    iconColor: 'text-violet-400',
    badgeBg: 'bg-violet-950/80',
    badgeText: 'text-violet-300',
    badgeBorder: 'border-violet-500/40',
    titleColor: 'text-white',
    btnBg: 'bg-violet-500 hover:bg-violet-400 text-white font-bold',
    btnText: 'text-white',
  },
  journal: {
    name: 'Hydrodynamic Journal Bearing Lubrication',
    category: 'Fluid Film Tribology',
    standardShort: 'API 684 2nd Ed / DIN 31652',
    governingLaw: '2D Steady-State Reynolds Hydrodynamic Lubrication PDE',
    governingLawShort: '2D Reynolds Lubrication PDE',
    equation: 'S = \\left(\\frac{r}{c}\\right)^2 \\frac{\\mu N}{P}',
    cleanFormula: 'Sommerfeld S = (r/c)²(μN/P)',
    solverMethod: 'Finite Difference Mesh & Half-Sommerfeld Boundary Solution',
    failureMode: 'Sub-Synchronous Oil Whirl (0.43X–0.48X) & Metal Wipe',
    failureModeShort: '0.45X Oil Whirl & Metal Wipe Guard',
    criticalLimit: 'Min Film Thickness < 12 µm / Peak Temp > 115 °C',
    criticalLimitShort: 'Min Film Thickness > 12 µm',
    cardBg: 'bg-[#0A101D]',
    borderColor: 'border-slate-800/80 hover:border-teal-500/60',
    topStripe: 'bg-teal-500',
    iconBg: 'bg-teal-500/15 border-teal-500/30',
    iconColor: 'text-teal-400',
    badgeBg: 'bg-teal-950/80',
    badgeText: 'text-teal-300',
    badgeBorder: 'border-teal-500/40',
    titleColor: 'text-white',
    btnBg: 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold',
    btnText: 'text-slate-950',
  },
  rotor: {
    name: 'Rotor Dynamics & Resonant Balancing',
    category: 'Rotordynamics & Resonance',
    standardShort: 'ISO 1940-1 Grade G2.5 / API 684',
    governingLaw: 'Jeffcott Rotor Dynamics & 4-Quadrant Influence Coefficients',
    governingLawShort: 'Jeffcott Rotor & 1X Orbit',
    equation: 'U_{\\text{per}} = 1000 \\times \\frac{G \\times M}{\\omega}',
    cleanFormula: 'U_per = 1000·(G·M)/ω',
    solverMethod: 'Complex Eigenvalue Damped Critical Speed Analysis',
    failureMode: 'Resonant Shaft Deflection, Mass Bow & Bearing Destruction',
    failureModeShort: 'Resonant Shaft Bow Guard',
    criticalLimit: '1X Peak > ISO Trip / Residual Unbalance > U_per',
    criticalLimitShort: 'Residual Unbalance ≤ U_per',
    cardBg: 'bg-[#0A101D]',
    borderColor: 'border-slate-800/80 hover:border-emerald-500/60',
    topStripe: 'bg-emerald-500',
    iconBg: 'bg-emerald-500/15 border-emerald-500/30',
    iconColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/80',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/40',
    titleColor: 'text-white',
    btnBg: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold',
    btnText: 'text-slate-950',
  },
  pipe: {
    name: 'Process Piping Stress & Thermal Flexibility',
    category: 'Piping & Structural Flexibility',
    standardShort: 'ASME B31.3 2022 Chapter II',
    governingLaw: 'Guided Cantilever Flexibility & Allowable Displacement Stress',
    governingLawShort: 'Guided Cantilever Flexure',
    equation: 'S_E = \\sqrt{S_b^2 + 4 S_t^2} \\le S_A',
    cleanFormula: 'SE = √(Sb² + 4St²) ≤ SA',
    solverMethod: '3D Beam Stiffness Discretization & Thermal Strain Integration',
    failureMode: 'Flange Joint Leaking, Thermal Fatigue Cracking & Nozzle Load Trip',
    failureModeShort: 'Flange Joint Thermal Leak Guard',
    criticalLimit: 'Stress Ratio SE / SA > 1.0 / API 610 Nozzle Load Exceeded',
    criticalLimitShort: 'Stress Ratio SE / SA ≤ 1.0',
    cardBg: 'bg-[#0A101D]',
    borderColor: 'border-slate-800/80 hover:border-slate-500/60',
    topStripe: 'bg-slate-400',
    iconBg: 'bg-slate-800 border-slate-700',
    iconColor: 'text-slate-300',
    badgeBg: 'bg-slate-900',
    badgeText: 'text-slate-300',
    badgeBorder: 'border-slate-700',
    titleColor: 'text-white',
    btnBg: 'bg-slate-700 hover:bg-slate-600 text-white font-bold',
    btnText: 'text-white',
  },
  seal: {
    name: 'Mechanical Seal Flush Plan Thermodynamics',
    category: 'Auxiliary Fluid Systems',
    standardShort: 'API 682 4th Ed / ISO 21049',
    governingLaw: 'Seal Chamber Thermal Dissipation & Vapor Margin Calculation',
    governingLawShort: 'Flush Plan 53A Vapor Margin',
    equation: 'P_{\\text{barrier}} - P_{\\text{process}} \\ge 1.4\\text{ bar}',
    cleanFormula: 'P_barrier - P_process ≥ 1.4 bar',
    solverMethod: 'Thermal Equilibrium Balance & Heat Exchanger Loop Formulation',
    failureMode: 'Seal Face Vaporization, Dry Running & Hazardous Fluid Release',
    failureModeShort: 'Seal Face Dry-Running Guard',
    criticalLimit: 'Vapor Temperature Margin < 11 °C (API 682 Trip)',
    criticalLimitShort: 'Vapor Margin ΔTvap > 11 °C',
    cardBg: 'bg-[#0A101D]',
    borderColor: 'border-slate-800/80 hover:border-blue-500/60',
    topStripe: 'bg-blue-500',
    iconBg: 'bg-blue-500/15 border-blue-500/30',
    iconColor: 'text-blue-400',
    badgeBg: 'bg-blue-950/80',
    badgeText: 'text-blue-300',
    badgeBorder: 'border-blue-500/40',
    titleColor: 'text-white',
    btnBg: 'bg-blue-500 hover:bg-blue-400 text-white font-bold',
    btnText: 'text-white',
  },
  alignment: {
    name: 'Laser Shaft Alignment & Thermal Growth',
    category: 'Precision Maintenance',
    standardShort: 'ANSI/ASA S2.75 / API 686 Ch. 7',
    governingLaw: 'Reverse Indicator Matrix & Thermal Foot Growth Equation',
    governingLawShort: 'Reverse Indicator Dial Matrix',
    equation: '\\text{Shim} = \\text{Offset} + \\theta \\times \\frac{D_{\\text{foot}}}{D_{\\text{cpl}}}',
    cleanFormula: 'Shim = Offset + θ·(Dfoot/Dcpl)',
    solverMethod: 'Rigid Body Geometric Triangulation & Thermal Expansion (α·L·ΔT)',
    failureMode: '2X Dynamic Misalignment Preload, Coupling Wear & Bearing Spalling',
    failureModeShort: '2X Misalignment Preload Guard',
    criticalLimit: 'Angular > 0.05 mm/100mm / Parallel Offset > 0.05 mm',
    criticalLimitShort: 'Collinear Offset < 0.05 mm',
    cardBg: 'bg-[#0A101D]',
    borderColor: 'border-slate-800/80 hover:border-lime-500/60',
    topStripe: 'bg-lime-500',
    iconBg: 'bg-lime-500/15 border-lime-500/30',
    iconColor: 'text-lime-400',
    badgeBg: 'bg-lime-950/80',
    badgeText: 'text-lime-300',
    badgeBorder: 'border-lime-500/40',
    titleColor: 'text-white',
    btnBg: 'bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold',
    btnText: 'text-slate-950',
  },
};

export const MechanicalLandingPage: React.FC<MechanicalLandingPageProps> = ({
  unitSystem,
  onOpenAudit,
  onOpenReport,
  onOpenInfo,
  onOpenCommandPalette,
  onOpenDiagnostics,
  onOpenCaseStudies,
  onOpenReliabilityStudio,
  onOpenMachineryTrainStudio,
  onOpenSpectralLab,
  onOpenTransientLab,
  onOpenKineticCutaway,
  onOpenFleetMatrix,
  onOpenRcaStudio,
  onOpenTribologyLab,
  onOpenMonteCarlo,
  onOpenExergyCarbon,
}) => {
  const {
    setActiveRoute,
    setIsAuditModalOpen,
    setIsReportModalOpen,
    setIsDiagnosticModalOpen,
    setIsCaseStudiesModalOpen,
    setIsReliabilityStudioOpen,
    setIsMachineryTrainStudioOpen,
    setIsSpectralLabOpen,
    setIsFleetMatrixOpen,
    setIsRcaStudioOpen,
  } = useApp();

  const handleAudit = onOpenAudit || (() => setIsAuditModalOpen(true));
  const handleReport = onOpenReport || (() => setIsReportModalOpen(true));
  const handleDiagnostics = onOpenDiagnostics || (() => setIsDiagnosticModalOpen(true));
  const handleCaseStudies = onOpenCaseStudies || (() => setIsCaseStudiesModalOpen(true));
  const handleMachineryTrain = onOpenMachineryTrainStudio || (() => setIsMachineryTrainStudioOpen(true));
  const handleReliability = onOpenReliabilityStudio || (() => setIsReliabilityStudioOpen(true));
  const handleSpectral = onOpenSpectralLab || (() => setIsSpectralLabOpen(true));
  const handleFleet = onOpenFleetMatrix || (() => setIsFleetMatrixOpen(true));
  const handleRca = onOpenRcaStudio || (() => setIsRcaStudioOpen(true));

  // Search & Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filter simulators
  const filteredSimulators = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return ALL_SIMULATORS.filter((s) => {
      const matchCat = selectedCategory === 'All' || s.category === selectedCategory;
      if (!matchCat) return false;
      if (!q) return true;
      const theme = SIMULATOR_THEMES[s.id];
      return (
        s.name.toLowerCase().includes(q) ||
        s.standard.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q) ||
        s.equationHint.toLowerCase().includes(q) ||
        s.assetTag.toLowerCase().includes(q) ||
        (theme && theme.failureMode.toLowerCase().includes(q))
      );
    });
  }, [selectedCategory, searchQuery]);

  const categories = ['All', 'Pumps & Compressors', 'Turbomachinery & Power', 'Vibration & Bearings', 'Piping & Reliability'];

  return (
    <div
      id="mechanical-landing-page"
      className="w-full min-h-full bg-[#050B14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/25 selection:text-cyan-300"
      style={{
        backgroundImage: 'radial-gradient(rgba(56, 189, 248, 0.1) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
      {/* Edge-to-edge screen-to-fit container */}
      <div className="w-full px-3 sm:px-5 md:px-6 lg:px-8 xl:px-10 py-4 space-y-5 flex-1">
        
        {/* Parent Portal Breadcrumb & Cross-Department Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400 pb-0.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <a
              href="https://livesimulators.com"
              className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 group font-bold text-slate-300"
              title="Return to LiveSimulators.com Homepage"
            >
              <span className="text-cyan-400 group-hover:-translate-x-0.5 transition-transform">←</span>
              <span>Parent Portal: <strong className="text-white">LiveSimulators.com</strong></span>
            </a>
            <span className="text-slate-600">/</span>
            <span className="text-cyan-300 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
              Mechanical Systems &amp; Reliability (ME-400)
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2.5 text-[11px]">
            <span className="text-slate-500">Other Labs:</span>
            <a href="https://livesimulators.com/department/electrical" className="text-slate-400 hover:text-cyan-300 transition-colors">⚡ Electrical</a>
            <span className="text-slate-700">•</span>
            <a href="https://livesimulators.com/department/control" className="text-slate-400 hover:text-cyan-300 transition-colors">📈 Control</a>
            <span className="text-slate-700">•</span>
            <a href="https://livesimulators.com/department/chemical" className="text-slate-400 hover:text-cyan-300 transition-colors">🧪 Chemical</a>
            <span className="text-slate-700">•</span>
            <a href="https://livesimulators.com/department/civil" className="text-slate-400 hover:text-cyan-300 transition-colors">🏗️ Civil</a>
            <span className="text-slate-700">•</span>
            <a href="https://livesimulators.com/department/physics" className="text-slate-400 hover:text-cyan-300 transition-colors">⚛️ Physics</a>
          </div>
        </div>

        {/* 1. Interactive Command Banner with Live Telemetry Console (Zero Wasted Space) */}
        <div className="w-full p-5 sm:p-6 rounded-2xl bg-[#081220]/95 border border-cyan-500/25 shadow-2xl grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
          {/* Left Column (7 cols): Headline, Value Prop, CTAs & Capability Stats */}
          <div className="xl:col-span-7 space-y-3.5">
            {/* Top glowing solver pill */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-xs font-mono text-cyan-300 font-bold shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>REAL-TIME 60 FPS ODE SOLVER</span>
              </span>
              <span className="text-xs font-mono text-cyan-400 font-bold tracking-wider">
                LIVESIMULATORS • INTERACTIVE ENGINEERING SIMULATIONS
              </span>
            </div>

            {/* Big Headline */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-white font-display tracking-tight leading-tight">
              Don't Just Read <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-300">Engineering.</span> See It Happen.
            </h1>

            <p className="text-sm sm:text-base text-slate-300 font-sans leading-relaxed max-w-2xl">
              Bridge the gap between textbook theory and plant reality with interactive digital twins powered by real-time transient physics—running natively in your browser with zero installation. Calibrated to international IEEE, ASME, and API codes, our sandbox simulators allow students to master dynamic machine behavior while giving EPC consultants a rapid, audit-ready verification suite.
            </p>

            {/* Action-Oriented Hero CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex flex-col gap-1">
                <a
                  href="#simulator-directory"
                  className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#06B6D4] hover:bg-[#0891b2] text-slate-950 text-sm font-bold shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all group cursor-pointer"
                >
                  <Sparkles size={16} className="text-slate-950" />
                  <span>Launch Free Sandbox</span>
                  <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
                <span className="text-[11px] font-mono text-slate-400 pl-1">
                  No signup required • 100% browser-native
                </span>
              </div>

              <a
                href="#simulator-directory"
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-[#1E293B] hover:border-cyan-400 text-slate-200 text-sm font-semibold transition-all group cursor-pointer self-start"
              >
                <ShieldCheck size={16} className="text-cyan-400" />
                <span>Explore Industry-Standard Twins →</span>
              </a>
            </div>

            {/* Integrated 4 Capabilities Ribbon directly below the copy */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-[#050b14]/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Machinery Twins</span>
                <span className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                  <Cpu size={14} className="text-cyan-400" />
                  <span>11 Assets</span>
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#050b14]/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Failure Studios</span>
                <span className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>8 Studios</span>
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#050b14]/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Precision Kernel</span>
                <span className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                  <Sparkles size={14} className="text-amber-400" />
                  <span>Float64 ODE</span>
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#050b14]/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Codes &amp; Standards</span>
                <span className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                  <Globe size={14} className="text-teal-400" />
                  <span>API / ISO / ASME</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): The Interactive Live Telemetry Console (Zero Blank Space!) */}
          <div className="xl:col-span-5 w-full">
            <HeroLiveTelemetryConsole onLaunchSimulator={setActiveRoute} />
          </div>
        </div>

        {/* 2. Category Filter & Simulator Explorer (Cards Grid or Technical Matrix) */}
        <section id="simulator-directory" className="space-y-4 w-full" aria-label="Simulator Directory">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#081220]/90 p-3 rounded-2xl border border-slate-800">
            {/* Category Navigation Pills */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/25'
                        : 'bg-[#040914] text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{cat}</span>
                    {cat === 'All' && <span className="ml-1.5 text-[10px] opacity-70">({ALL_SIMULATORS.length})</span>}
                  </button>
                );
              })}
            </div>

            {/* View Mode Switcher & Quick Search */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Grid / Table View Toggles */}
              <div className="flex items-center p-1 rounded-xl bg-[#040914] border border-slate-800 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-slate-800 text-white font-bold border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="High-Density Card Grid"
                >
                  <LayoutGrid size={13} />
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-slate-800 text-white font-bold border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Master Technical Matrix View (Zero Scrolling)"
                >
                  <TableIcon size={13} />
                  <span className="hidden sm:inline">Matrix View</span>
                </button>
              </div>

              {/* Quick Search */}
              <div className="relative min-w-[200px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter simulators, codes, equations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#040914] border border-slate-700 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:bg-[#07111e]"
                />
              </div>
            </div>
          </div>

          {/* VIEW MODE A: HIGH-DENSITY CARD GRID (Clean, Uncluttered, Easy to Understand) */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 w-full">
              {filteredSimulators.map((sim) => {
                const theme = SIMULATOR_THEMES[sim.id];
                const IconComponent = sim.icon;

                return (
                  <div
                    key={sim.id}
                    className={`w-full rounded-2xl border ${theme.borderColor} bg-[#0A101D] overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl cursor-pointer`}
                    onClick={() => setActiveRoute(sim.id)}
                  >
                    {/* Discipline Color Top Stripe */}
                    <div className={`w-full h-[2px] ${theme.topStripe}`} />

                    <div className="p-4 sm:p-5 flex flex-col h-full justify-between space-y-3">
                      <div className="space-y-3">
                        {/* Top Header: Icon, Standard Badge, Category */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-xs ${theme.iconBg} ${theme.iconColor}`}>
                              <IconComponent size={18} />
                            </div>
                            <div>
                              <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wide">
                                {sim.category}
                              </span>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}>
                                {theme.standardShort}
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono text-slate-400 bg-[#040914] px-2 py-0.5 rounded border border-slate-800 shrink-0">
                            {sim.assetTag}
                          </span>
                        </div>

                        {/* Title & Concise Plain-English Description */}
                        <div>
                          <h3 className="text-[15px] font-bold font-display leading-snug text-white hover:text-cyan-400 transition-colors">
                            {sim.name}
                          </h3>
                          <p className="text-xs text-slate-400 font-sans mt-1 line-clamp-2 leading-relaxed">
                            {sim.description}
                          </p>
                        </div>

                        {/* Unique Dynamic Engineering Visualizer for this Machine */}
                        <SimulatorDiagnosticVisual id={sim.id} />

                        {/* Clean, Human-Readable Primary Physics & Protection Strip (No Clutter, Easy to Read) */}
                        <div className="p-2.5 rounded-xl bg-[#040814] border border-slate-800/80 space-y-2">
                          {/* Primary Governing Metric / Law */}
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Activity size={12} className={theme.iconColor} />
                              <span className="font-semibold text-slate-300">{theme.governingLawShort}</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`}>
                              {theme.cleanFormula}
                            </span>
                          </div>

                          {/* Safeguard & Trip Threshold */}
                          <div className="flex items-center justify-between text-[10.5px] font-mono pt-1.5 border-t border-slate-800/60">
                            <span className="text-slate-400 flex items-center gap-1 truncate mr-2" title={theme.failureMode}>
                              <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
                              <span className="truncate">{theme.failureModeShort}</span>
                            </span>
                            <span className="text-slate-300 font-medium shrink-0 text-[10px]">
                              {theme.criticalLimitShort}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAudit();
                          }}
                          className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                          title="View mathematical calculation audit trail"
                        >
                          <FileText size={12} />
                          <span>Formulas</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveRoute(sim.id);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${theme.btnBg} ${theme.btnText}`}
                        >
                          <span>Launch Twin</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE B: MASTER ENGINEERING MATRIX TABLE (Zero-Scroll Master View for Engineers) */}
          {viewMode === 'table' && (
            <div className="w-full rounded-2xl bg-[#081220] border border-slate-800 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="bg-[#050b14] border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Digital Twin Simulator</th>
                      <th className="py-3 px-3">Governing Standard</th>
                      <th className="py-3 px-3">Primary Equation</th>
                      <th className="py-3 px-3">Numerical Solver Engine</th>
                      <th className="py-3 px-3">Primary Failure Prevention</th>
                      <th className="py-3 px-3">Trip Limit Threshold</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-slate-300">
                    {filteredSimulators.map((sim) => {
                      const theme = SIMULATOR_THEMES[sim.id];
                      const IconComponent = sim.icon;

                      return (
                        <tr
                          key={sim.id}
                          className="hover:bg-[#0c1a2d] transition-colors cursor-pointer group"
                          onClick={() => setActiveRoute(sim.id)}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-xs shrink-0 ${theme.iconBg} ${theme.iconColor}`}>
                                <IconComponent size={16} />
                              </div>
                              <div>
                                <span className="font-bold text-white group-hover:text-cyan-400 transition-colors block text-xs">
                                  {sim.name}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {sim.assetTag} • {sim.category}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}>
                              {theme.standardShort}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <code className="text-[11px] text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                              {theme.cleanFormula}
                            </code>
                          </td>

                          <td className="py-3 px-3 text-[11px]">
                            <span className="text-slate-200">{theme.solverMethod}</span>
                          </td>

                          <td className="py-3 px-3 text-[11px]">
                            <span className="text-slate-300">{theme.failureMode}</span>
                          </td>

                          <td className="py-3 px-3 text-[11px]">
                            <span className="text-rose-400 font-semibold">{theme.criticalLimit}</span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveRoute(sim.id);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1 shadow-sm transition-all cursor-pointer ${theme.btnBg} ${theme.btnText}`}
                            >
                              <span>Launch</span>
                              <ArrowRight size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* 4. Integrated 8 Forensic Failure & Diagnostic Studios Strip */}
        <section className="space-y-3 w-full" aria-label="Failure Analysis Studios">
          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <h2 className="text-lg sm:text-xl font-bold font-display text-white tracking-tight">
                  8 Failure Analysis &amp; Diagnostic Engineering Studios
                </h2>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Cross-asset diagnostic tools, forensic failure investigation, reliability modeling, and condition monitoring labs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 w-full">
            {/* Studio 1: Troubleshooter */}
            <button
              type="button"
              onClick={handleDiagnostics}
              className="p-3 rounded-xl bg-[#081220]/90 border border-slate-800 hover:border-cyan-400 hover:shadow-lg transition-all text-left group flex flex-col justify-between cursor-pointer min-h-[90px]"
            >
              <div className="w-7 h-7 rounded-lg bg-cyan-950/80 text-cyan-400 flex items-center justify-center border border-cyan-500/30 mb-2">
                <Wrench size={14} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block group-hover:text-cyan-400">Diagnostic Wizard</span>
                <span className="text-[10px] text-slate-400 font-mono">Failure Trees</span>
              </div>
            </button>

            {/* Studio 2: Real-World Case Studies */}
            <button
              type="button"
              onClick={handleCaseStudies}
              className="p-3 rounded-xl bg-[#081220]/90 border border-slate-800 hover:border-amber-400 hover:shadow-lg transition-all text-left group flex flex-col justify-between cursor-pointer min-h-[90px]"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-950/80 text-amber-400 flex items-center justify-center border border-amber-500/30 mb-2">
                <BookOpen size={14} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block group-hover:text-amber-400">Incident Archive</span>
                <span className="text-[10px] text-slate-400 font-mono">11 Forensics</span>
              </div>
            </button>

            {/* Studio 3: Reliability & Weibull */}
            <button
              type="button"
              onClick={handleReliability}
              className="p-3 rounded-xl bg-[#081220]/90 border border-slate-800 hover:border-emerald-400 hover:shadow-lg transition-all text-left group flex flex-col justify-between cursor-pointer min-h-[90px]"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-950/80 text-emerald-400 flex items-center justify-center border border-emerald-500/30 mb-2">
                <TrendingUp size={14} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block group-hover:text-emerald-400">Weibull Reliability</span>
                <span className="text-[10px] text-slate-400 font-mono">L10h &amp; MTTF</span>
              </div>
            </button>

            {/* Studio 4: Coupled Train Cascade */}
            <button
              type="button"
              onClick={handleMachineryTrain}
              className="p-3 rounded-xl bg-[#081220]/90 border border-slate-800 hover:border-purple-400 hover:shadow-lg transition-all text-left group flex flex-col justify-between cursor-pointer min-h-[90px]"
            >
              <div className="w-7 h-7 rounded-lg bg-purple-950/80 text-purple-400 flex items-center justify-center border border-purple-500/30 mb-2">
                <Network size={14} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block group-hover:text-purple-400">Train Cascade</span>
                <span className="text-[10px] text-slate-400 font-mono">Trip Cascades</span>
              </div>
            </button>

            {/* Studio 5: Spectral FFT Lab */}
            <button
              type="button"
              onClick={handleSpectral}
              className="p-3 rounded-xl bg-[#081220]/90 border border-slate-800 hover:border-indigo-400 hover:shadow-lg transition-all text-left group flex flex-col justify-between cursor-pointer min-h-[90px]"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-950/80 text-indigo-400 flex items-center justify-center border border-indigo-500/30 mb-2">
                <Radio size={14} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block group-hover:text-indigo-400">Spectral FFT Lab</span>
                <span className="text-[10px] text-slate-400 font-mono">Harmonics &amp; Orders</span>
              </div>
            </button>

            {/* Studio 6: Transient Dynamics */}
            <button
              type="button"
              onClick={onOpenTransientLab}
              className="p-3 rounded-xl bg-[#081220]/90 border border-slate-800 hover:border-rose-400 hover:shadow-lg transition-all text-left group flex flex-col justify-between cursor-pointer min-h-[90px]"
            >
              <div className="w-7 h-7 rounded-lg bg-rose-950/80 text-rose-400 flex items-center justify-center border border-rose-500/30 mb-2">
                <Gauge size={14} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block group-hover:text-rose-400">Transient Run-Up</span>
                <span className="text-[10px] text-slate-400 font-mono">Bode &amp; Polar</span>
              </div>
            </button>

            {/* Studio 7: Fleet Health Matrix */}
            <button
              type="button"
              onClick={handleFleet}
              className="p-3 rounded-xl bg-[#081220]/90 border border-slate-800 hover:border-teal-400 hover:shadow-lg transition-all text-left group flex flex-col justify-between cursor-pointer min-h-[90px]"
            >
              <div className="w-7 h-7 rounded-lg bg-teal-950/80 text-teal-400 flex items-center justify-center border border-teal-500/30 mb-2">
                <Layers size={14} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block group-hover:text-teal-400">Fleet Matrix</span>
                <span className="text-[10px] text-slate-400 font-mono">ISO Severity</span>
              </div>
            </button>

            {/* Studio 8: RCA Studio */}
            <button
              type="button"
              onClick={handleRca}
              className="p-3 rounded-xl bg-[#081220]/90 border border-slate-800 hover:border-amber-400 hover:shadow-lg transition-all text-left group flex flex-col justify-between cursor-pointer min-h-[90px]"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-950/80 text-amber-400 flex items-center justify-center border border-amber-500/30 mb-2">
                <AlertTriangle size={14} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block group-hover:text-amber-400">RCA Studio</span>
                <span className="text-[10px] text-slate-400 font-mono">Ishikawa &amp; 5-Why</span>
              </div>
            </button>
          </div>
        </section>

      </div>

      {/* 5. Authentic LiveSimulators Dark Footer */}
      <LiveSimulatorsFooter onOpenAudit={handleAudit} onOpenReport={handleReport} />
    </div>
  );
};
