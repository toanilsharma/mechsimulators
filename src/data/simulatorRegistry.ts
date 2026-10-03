import React from 'react';
import {
  RotateCw,
  Wind,
  Flame,
  Activity,
  Cog,
  Compass,
  Disc,
  Layers,
  Wrench,
  ShieldCheck,
  Target,
  Droplets,
  Zap,
  Radio,
  Gauge,
} from 'lucide-react';
import { SimulatorId } from '../types/common';

export type SimulatorCategory =
  | 'Pumps & Compressors'
  | 'Turbomachinery & Power'
  | 'Vibration & Bearings'
  | 'Piping & Reliability';

export interface CategoryTheme {
  id: SimulatorCategory;
  shortName: string;
  badgeLabel: string;
  count: number;
  icon: React.ElementType;
  tagline: string;
  description: string;
  governingCodes: string[];
  primaryFailureModes: string[];
  industrialAssets: string[];
  bannerGradient: string;
  tabActive: string;
  tabInactive: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  cardBg: string;
  cardBorder: string;
  cardBorderHover: string;
  cardGlow: string;
  topStripe: string;
  signalBadge: string;
  standardBadge: string;
  outputChip: string;
  launchBtn: string;
  copyBtn: string;
  linkAccent: string;
  dotColor: string;
}

export const CATEGORY_THEMES: Record<SimulatorCategory, CategoryTheme> = {
  'Pumps & Compressors': {
    id: 'Pumps & Compressors',
    shortName: 'Pumps & Compressors',
    badgeLabel: 'FLUID MACHINERY',
    count: 3,
    icon: Droplets,
    tagline: 'Continuous & Positive Displacement Dynamic Pressure Elevation',
    description:
      'Simulates compressible and incompressible aerodynamic fluid transfer across industrial operating envelopes. Solves cavitation inception margins, aerodynamic surge & stall boundaries, acoustic pipe pulsation harmonics, and impeller trim affinity laws for refinery, petrochemical, and power generation units.',
    governingCodes: ['API 610 12th Ed', 'HI 9.6.1', 'API 617 8th Ed', 'ASME PTC 10', 'API 618 5th Ed'],
    primaryFailureModes: ['NPSHa Cavitation Pitting', 'Centrifugal Violent Surge', 'Acoustic Pulsation Fatigue', 'Rod Load Reversal Stress'],
    industrialAssets: ['API 610 Process & Boiler Feed Pumps', 'Multi-Stage Centrifugal Compressors', 'Heavy Reciprocating Gas Compressors'],
    bannerGradient: 'from-cyan-950/50 via-[#071526]/40 to-transparent border-cyan-500/30',
    tabActive: 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/25 border-cyan-400',
    tabInactive: 'text-cyan-300 hover:text-white hover:bg-cyan-950/40 border-cyan-500/30',
    accentText: 'text-cyan-400',
    accentBg: 'bg-cyan-500/15',
    accentBorder: 'border-cyan-500/30',
    cardBg: 'bg-gradient-to-b from-[#081a2e] via-[#081220] to-[#050a14]',
    cardBorder: 'border-cyan-500/35',
    cardBorderHover: 'hover:border-cyan-400',
    cardGlow: 'hover:shadow-2xl hover:shadow-cyan-950/70',
    topStripe: 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500',
    signalBadge: 'bg-cyan-950/90 border-cyan-500/40 text-cyan-200',
    standardBadge: 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300',
    outputChip: 'bg-cyan-950/40 border-cyan-500/25 text-cyan-200',
    launchBtn: 'bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-slate-950 font-black shadow-md shadow-cyan-500/25',
    copyBtn: 'border-cyan-500/30 text-cyan-200 hover:bg-cyan-950/40',
    linkAccent: 'text-cyan-300',
    dotColor: 'bg-cyan-400',
  },
  'Turbomachinery & Power': {
    id: 'Turbomachinery & Power',
    shortName: 'Turbomachinery & Power',
    badgeLabel: 'THERMAL & POWER',
    count: 2,
    icon: Flame,
    tagline: 'Enthalpy Conversion, Expander Thermodynamics & Heavy Drive Trains',
    description:
      'Evaluates thermodynamic energy conversion, isentropic stage expansion, and high-torque mechanical power transmission. Solves multi-stage steam expansion Mollier trajectories, exhaust droplet erosion thresholds, and AGMA contact pitting durability and tooth root bending limits.',
    governingCodes: ['API 612 8th Ed', 'ASME PTC 6', 'AGMA 2001-D04', 'ISO 6336'],
    primaryFailureModes: ['Wet Steam Blade Droplet Erosion', 'Gear Tooth Root Bending Fatigue', 'Contact Pitting & Subsurface Shear', 'Thermal Scuffing'],
    industrialAssets: ['Multistage Industrial Steam Turbines', 'Heavy Industrial Parallel Shaft Gearboxes', 'Cogeneration Power Expander Trains'],
    bannerGradient: 'from-amber-950/50 via-[#211206]/40 to-transparent border-amber-500/30',
    tabActive: 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 border-amber-400',
    tabInactive: 'text-amber-300 hover:text-white hover:bg-amber-950/40 border-amber-500/30',
    accentText: 'text-amber-400',
    accentBg: 'bg-amber-500/15',
    accentBorder: 'border-amber-500/30',
    cardBg: 'bg-gradient-to-b from-[#241407] via-[#150d06] to-[#0a0604]',
    cardBorder: 'border-amber-500/35',
    cardBorderHover: 'hover:border-amber-400',
    cardGlow: 'hover:shadow-2xl hover:shadow-amber-950/70',
    topStripe: 'bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-500',
    signalBadge: 'bg-amber-950/90 border-amber-500/40 text-amber-200',
    standardBadge: 'bg-amber-950/80 border-amber-500/40 text-amber-300',
    outputChip: 'bg-amber-950/40 border-amber-500/25 text-amber-200',
    launchBtn: 'bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black shadow-md shadow-amber-500/25',
    copyBtn: 'border-amber-500/30 text-amber-200 hover:bg-amber-950/40',
    linkAccent: 'text-amber-300',
    dotColor: 'bg-amber-400',
  },
  'Vibration & Bearings': {
    id: 'Vibration & Bearings',
    shortName: 'Vibration & Bearings',
    badgeLabel: 'DYNAMICS & TRIBOLOGY',
    count: 3,
    icon: Activity,
    tagline: 'Hydrodynamic Film Stability, Critical Speeds & Bearing Tribology',
    description:
      'Analyzes structural dynamic response, rotor unbalance resonance, and hydrodynamic/rolling contact tribology. Solves Reynolds 2D lubrication pressure profiles, Sommerfeld numbers, oil whirl/whip stability margins, Jeffcott critical speeds, and ISO 281 modified dynamic L10h fatigue life.',
    governingCodes: ['API 684 2nd Ed', 'ISO 1940-1', 'ISO 20816-1', 'ISO 281 / ABMA Std 9'],
    primaryFailureModes: ['Subharmonic Oil Whirl / Whip', 'Unbalance Resonance Amplification', 'Rolling Element Fatigue Spalling', 'Fluid Film Thermohydrodynamic Collapse'],
    industrialAssets: ['High-Speed Turbomachinery Shafts', 'Tilting-Pad & Sleeve Journal Bearings', 'Deep-Groove & Spherical Roller Bearings'],
    bannerGradient: 'from-violet-950/50 via-[#18082e]/40 to-transparent border-violet-500/30',
    tabActive: 'bg-violet-500 text-white font-black shadow-lg shadow-violet-500/25 border-violet-400',
    tabInactive: 'text-violet-300 hover:text-white hover:bg-violet-950/40 border-violet-500/30',
    accentText: 'text-violet-300',
    accentBg: 'bg-violet-500/15',
    accentBorder: 'border-violet-500/30',
    cardBg: 'bg-gradient-to-b from-[#1d0d33] via-[#11071e] to-[#08040f]',
    cardBorder: 'border-violet-500/35',
    cardBorderHover: 'hover:border-violet-400',
    cardGlow: 'hover:shadow-2xl hover:shadow-violet-950/70',
    topStripe: 'bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-500',
    signalBadge: 'bg-violet-950/90 border-violet-500/40 text-violet-200',
    standardBadge: 'bg-violet-950/80 border-violet-500/40 text-violet-300',
    outputChip: 'bg-violet-950/40 border-violet-500/25 text-violet-200',
    launchBtn: 'bg-gradient-to-r from-violet-400 to-purple-400 hover:from-violet-300 hover:to-purple-300 text-slate-950 font-black shadow-md shadow-violet-500/25',
    copyBtn: 'border-violet-500/30 text-violet-200 hover:bg-violet-950/40',
    linkAccent: 'text-violet-300',
    dotColor: 'bg-violet-400',
  },
  'Piping & Reliability': {
    id: 'Piping & Reliability',
    shortName: 'Piping & Reliability',
    badgeLabel: 'ASSET INTEGRITY',
    count: 3,
    icon: ShieldCheck,
    tagline: 'Thermal Flexibility, Shaft Coaxiality & Mechanical Seal Fluid Systems',
    description:
      'Safeguards static piping infrastructure and rotating machinery interfaces against thermal expansion overload, shaft angular/offset misalignment, and hazardous fluid containment loss. Solves ASME B31.3 thermal expansion stresses, API 682 seal chamber thermal margins, and API 686 reverse-dial shim moves.',
    governingCodes: ['ASME B31.3', 'API 686 Ch. 5 / RP 686', 'API 682 4th Ed', 'ISO 21049'],
    primaryFailureModes: ['Excessive Pump Nozzle Flange Moments', 'Mechanical Seal Face Vaporization', 'Shaft Angular & Radial Misalignment', 'Pipe Span Sag & Resonant Vibration'],
    industrialAssets: ['High-Temperature Process Piping Systems', 'API 682 Cartridge Mechanical Seals', 'Direct-Coupled Driver-Pump Skid Trains'],
    bannerGradient: 'from-emerald-950/50 via-[#061811]/40 to-transparent border-emerald-500/30',
    tabActive: 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/25 border-emerald-400',
    tabInactive: 'text-emerald-300 hover:text-white hover:bg-emerald-950/40 border-emerald-500/30',
    accentText: 'text-emerald-400',
    accentBg: 'bg-emerald-500/15',
    accentBorder: 'border-emerald-500/30',
    cardBg: 'bg-gradient-to-b from-[#082218] via-[#06140f] to-[#040806]',
    cardBorder: 'border-emerald-500/35',
    cardBorderHover: 'hover:border-emerald-400',
    cardGlow: 'hover:shadow-2xl hover:shadow-emerald-950/70',
    topStripe: 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500',
    signalBadge: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200',
    standardBadge: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300',
    outputChip: 'bg-emerald-950/40 border-emerald-500/25 text-emerald-200',
    launchBtn: 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black shadow-md shadow-emerald-500/25',
    copyBtn: 'border-emerald-500/30 text-emerald-200 hover:bg-emerald-950/40',
    linkAccent: 'text-emerald-300',
    dotColor: 'bg-emerald-400',
  },
};

export interface SimulatorItem {
  id: SimulatorId;
  assetTag: string;
  name: string;
  tagline: string;
  category: SimulatorCategory;
  standard: string;
  standardOrg: string;
  description: string;
  keyOutputs: string[];
  equationHint: string;
  icon: React.ElementType;
  signalIcon: React.ElementType;
  signalLabel: string;
  signalTarget: string;
}

export const ALL_SIMULATORS: SimulatorItem[] = [
  {
    id: 'pump',
    assetTag: 'PUMP-01',
    name: 'Centrifugal Pump & Cavitation',
    tagline: 'API 610 / HI 9.6.1 Cavitation Severity & NPSH Margin',
    category: 'Pumps & Compressors',
    standard: 'API 610 12th Ed / HI 9.6.1',
    standardOrg: 'API / HI',
    description: 'Calculate NPSHa vs NPSHr margin, cavitation inception risk, suction specific speed (Nss), and impeller diameter trimming curves.',
    keyOutputs: ['NPSH Margin Ratio', 'Cavitation Severity', 'Impeller Trim Curve', 'Suction Specific Speed Nss'],
    equationHint: 'NPSHa = (P_atm - P_vap)/(ρg) + Z_s - h_f',
    icon: RotateCw,
    signalIcon: Droplets,
    signalLabel: 'NPSH Cavitation Margin',
    signalTarget: 'NPSHa > 1.35x NPSHr Margin',
  },
  {
    id: 'compressor',
    assetTag: 'COMP-02',
    name: 'Centrifugal Compressor & Surge',
    tagline: 'API 617 / ASME PTC 10 Dynamic Surge Margin & Polytropic Head',
    category: 'Pumps & Compressors',
    standard: 'API 617 8th Ed / ASME PTC 10',
    standardOrg: 'API / ASME',
    description: 'Evaluate polytropic compression efficiency, discharge temperature, and real-time distance from the aerodynamic surge limit line (SLL).',
    keyOutputs: ['Surge Margin %', 'Polytropic Head (kJ/kg)', 'Discharge Temp (T2)', 'Power Requirement (kW)'],
    equationHint: 'H_p = [Z_avg R T1 / (n-1/n)] * [(P2/P1)^((n-1)/n) - 1]',
    icon: Wind,
    signalIcon: Gauge,
    signalLabel: 'Surge Line Distance',
    signalTarget: 'Surge Margin ≥ 10.0% SLL',
  },
  {
    id: 'recip',
    assetTag: 'RECIP-03',
    name: 'Reciprocating Compressor Pulsation',
    tagline: 'API 618 5th Ed Acoustic Resonance & Cylinder Loading',
    category: 'Pumps & Compressors',
    standard: 'API 618 / ISO 13631',
    standardOrg: 'API / ISO',
    description: 'Model acoustic pipe pulsation, cylinder rod load reversals, pulsation dampener volume sizing, and nozzle pressure drops.',
    keyOutputs: ['Acoustic Resonance Freq', 'Combined Rod Load (kN)', 'Pulsation Peak-to-Peak %', 'Dampener Volume (L)'],
    equationHint: 'f_n = (2n - 1) * c / (4L)',
    icon: Activity,
    signalIcon: Radio,
    signalLabel: 'Pipe Acoustic Resonance',
    signalTarget: 'Peak Pulsation < 3.0% Line P',
  },
  {
    id: 'turbine',
    assetTag: 'TURB-04',
    name: 'Industrial Steam Turbine',
    tagline: 'API 612 / ASME PTC 6 Isentropic Expansion & Rankine Stage',
    category: 'Turbomachinery & Power',
    standard: 'API 612 / ASME PTC 6',
    standardOrg: 'API / ASME',
    description: 'Analyze inlet and exhaust enthalpy, isentropic efficiency, steam consumption rate, and thermodynamic electrical shaft power.',
    keyOutputs: ['Shaft Output Power', 'Steam Rate (kg/kWh)', 'Exhaust Quality (x)', 'Isentropic Efficiency'],
    equationHint: 'W_shaft = ṁ * (h_in - h_out) * η_mech',
    icon: Flame,
    signalIcon: Zap,
    signalLabel: 'Rankine Enthalpy Drop',
    signalTarget: 'Isentropic η ≥ 82% • Expansion Δh',
  },
  {
    id: 'gearbox',
    assetTag: 'GEAR-05',
    name: 'Parallel Shaft Industrial Gearbox',
    tagline: 'AGMA 2001-D04 / ISO 6336 Contact Pitting & Bending Stress',
    category: 'Turbomachinery & Power',
    standard: 'AGMA 2001-D04 / ISO 6336',
    standardOrg: 'AGMA / ISO',
    description: 'Verify gear tooth bending strength, contact surface durability, flash temperature scuffing safety, and lubrication requirements.',
    keyOutputs: ['Pitting Safety Factor SH', 'Bending Safety Factor SF', 'Flash Temp Scuffing Index', 'Mesh Efficiency %'],
    equationHint: 'σ_H = Z_E * sqrt((W_t / (b * d_1)) * (u+1)/u * K_A * K_V)',
    icon: Cog,
    signalIcon: Cog,
    signalLabel: 'AGMA Pitting & Bending SF',
    signalTarget: 'SF ≥ 1.40 Bending • SH ≥ 1.25 Pitting',
  },
  {
    id: 'journal',
    assetTag: 'BRG-06',
    name: 'Hydrodynamic Journal Bearing',
    tagline: 'API 684 Reynolds 2D Lubrication & Sommerfeld Number',
    category: 'Vibration & Bearings',
    standard: 'API 684 / DIN 31652',
    standardOrg: 'API / DIN',
    description: 'Solve fluid film pressure profile, minimum oil film thickness (h_min), oil whirl stability threshold, and power loss in sleeve bearings.',
    keyOutputs: ['Sommerfeld Number (S)', 'Min Film Thickness (h_min)', 'Oil Temperature Rise', 'Whirl Stability Threshold'],
    equationHint: 'S = (μ * N / P) * (R / C)^2',
    icon: Compass,
    signalIcon: Droplets,
    signalLabel: 'Sommerfeld Oil Film',
    signalTarget: 'S = 0.08–0.25 • Stable Wedge',
  },
  {
    id: 'rotor',
    assetTag: 'ROTOR-07',
    name: 'Rotor Dynamics & Critical Speeds',
    tagline: 'API 684 / ISO 1940 Jeffcott Critical Speeds & Unbalance Orbit',
    category: 'Vibration & Bearings',
    standard: 'API 684 / ISO 1940 / ISO 20816',
    standardOrg: 'API / ISO',
    description: 'Map undamped critical speeds, separation margins from running speed, dynamic unbalance orbit response, and Campbell diagrams.',
    keyOutputs: ['1st & 2nd Critical Speeds', 'Separation Margin (SM %)', 'Amplification Factor (AF)', 'ISO 1940 Residual Unbalance'],
    equationHint: 'ω_cr = sqrt(k_eff / m_rotor)',
    icon: Disc,
    signalIcon: Radio,
    signalLabel: 'Campbell Critical Resonance',
    signalTarget: 'Separation Margin SM ≥ 20.0%',
  },
  {
    id: 'bearing',
    assetTag: 'ROLL-08',
    name: 'Rolling Element Bearing Life',
    tagline: 'ISO 281 / Lundberg-Palmgren Dynamic L10h Life Rating',
    category: 'Vibration & Bearings',
    standard: 'ISO 281 / ABMA Std 9',
    standardOrg: 'ISO / ABMA',
    description: 'Calculate equivalent dynamic radial/axial load, basic rating life L10h, lubrication viscosity ratio (kappa), and ISO 281 modification factors.',
    keyOutputs: ['L10h Nominal Life (hrs)', 'ISO a_iso Modified Life', 'Viscosity Ratio (kappa)', 'Fatigue Load Limit Cu'],
    equationHint: 'L10h = (10^6 / (60 * n)) * (C / P)^p',
    icon: Disc,
    signalIcon: Disc,
    signalLabel: 'ISO 281 L10h Life Rating',
    signalTarget: 'L10h ≥ 50,000 hrs • κ ≥ 1.0',
  },
  {
    id: 'pipe',
    assetTag: 'PIPE-09',
    name: 'Process Piping Thermal Span & Stress',
    tagline: 'ASME B31.3 / API 686 Thermal Expansion & Allowable Spans',
    category: 'Piping & Reliability',
    standard: 'ASME B31.3 / API 686',
    standardOrg: 'ASME / API',
    description: 'Determine maximum allowable pipe support spans, thermal expansion deflections, and pump nozzle allowable reaction forces.',
    keyOutputs: ['Max Support Span (m)', 'B31.3 Expansion Stress (MPa)', 'Allowable Stress SA', 'Nozzle Load Margin %'],
    equationHint: 'S_E = sqrt(S_b^2 + 4 * S_t^2) ≤ S_A',
    icon: Layers,
    signalIcon: Layers,
    signalLabel: 'B31.3 Thermal Stress & Nozzle',
    signalTarget: 'S_E ≤ S_A Allowable Stress',
  },
  {
    id: 'seal',
    assetTag: 'SEAL-10',
    name: 'Mechanical Seal Flush Systems',
    tagline: 'API 682 4th Ed Plan 11/21/31/53 Thermal Vapor Margin',
    category: 'Piping & Reliability',
    standard: 'API 682 4th Ed / ISO 21049',
    standardOrg: 'API / ISO',
    description: 'Model seal chamber fluid temperature, flush circulation flow rate, seal face frictional heat, and vapor pressure margin.',
    keyOutputs: ['Vapor Pressure Margin ΔT', 'Flush Flow Rate (L/min)', 'Face Heat Generation (W)', 'API 682 Temperature Class'],
    equationHint: 'Q_flush = H_gen / (ρ * C_p * ΔT_allowable)',
    icon: Wrench,
    signalIcon: ShieldCheck,
    signalLabel: 'API 682 Vapor Margin ΔT',
    signalTarget: 'ΔT Margin > 15.0°C In-Chamber',
  },
  {
    id: 'alignment',
    assetTag: 'ALIGN-11',
    name: 'Shaft Alignment & Thermal Growth',
    tagline: 'API 686 Recommended Practice Reverse Rim & Face Shims',
    category: 'Piping & Reliability',
    standard: 'API 686 Chapter 5 / RP 686',
    standardOrg: 'API 686',
    description: 'Calculate reverse dial indicator or dual laser alignment corrections, front/back foot shim additions, and thermal growth offsets.',
    keyOutputs: ['Front Foot Correction (mm)', 'Rear Foot Correction (mm)', 'Thermal Growth Offset (ΔY)', 'Tolerance Envelope Status'],
    equationHint: 'Shim_rear = (D2 / D1) * Total_Offset + Angularity_Corr',
    icon: Target,
    signalIcon: Target,
    signalLabel: 'Reverse Rim-Face Shims',
    signalTarget: 'Coupling Offset < 0.05 mm (2 mil)',
  },
];
