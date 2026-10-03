import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SimulatorId, UnitSystem } from '../../types/common';
import { SimulatorSparkline } from '../Shared/SimulatorSparkline';
import {
  X,
  GitCompare,
  ArrowRight,
  Flame,
  Wind,
  Cpu,
  Activity,
  Cog,
  Compass,
  Disc,
  RotateCw,
  Target,
  Maximize2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Layers,
  ArrowLeftRight,
  ExternalLink,
  Info,
  Sliders,
  Network,
} from 'lucide-react';

interface TwinComparisonData {
  id: SimulatorId;
  name: string;
  tag: string;
  domain: string;
  standard: string;
  standardOrg: string;
  standardClause: string;
  icon: React.ElementType;
  operatingSpeed: string;
  powerOrLoad: string;
  governingEquation: string;
  equationDescription: string;
  primaryFailureMode: string;
  warningSymptom: string;
  spectralFingerprint: string;
  acceptanceCriteria: string;
  safetyMarginTarget: string;
  typicalAlarmThreshold: string;
  couplingCascadeRole: string;
  physicsHighlights: string[];
}

const COMPARISON_TWINS_DATA: Record<SimulatorId, TwinComparisonData> = {
  turbine: {
    id: 'turbine',
    name: 'Industrial Steam Turbine',
    tag: 'TURB-ST',
    domain: 'Primary Turbomachinery Driver',
    standard: 'API 612 8th Ed / ASME PTC 6',
    standardOrg: 'API / ASME',
    standardClause: 'API 612 §2.4 (Governing) & §3.2 (Campbell Blade Dynamics)',
    icon: Flame,
    operatingSpeed: '3,000 - 14,000 RPM',
    powerOrLoad: '1.5 MW - 65 MW Shaft Power',
    governingEquation: 'W_sh = \\dot{m} \\cdot (h_{in} - h_{ex}) \\cdot \\eta_s',
    equationDescription: 'IAPWS-IF97 isentropic enthalpy expansion drop across stator nozzles & rotor blade cascades.',
    primaryFailureMode: 'Last-Stage Blade Moisture Droplet Erosion (LDIE) & Nozzle Pass Campbell Resonance',
    warningSymptom: 'Sub-harmonic blade flutter, high stage differential ΔP, and exhaust wetness elevation above 12%.',
    spectralFingerprint: '1X Rotor Unbalance, Harmonic NPF (Nozzle Passing Frequency = Z × 1X), and Blade Natural Frequencies f_n.',
    acceptanceCriteria: 'Campbell resonance separation margin ≥ 10%; critical speed separation ≥ 15% per API 612.',
    safetyMarginTarget: 'Campbell Margin ≥ 10% • Exhaust Quality x ≥ 88%',
    typicalAlarmThreshold: 'Shaft relative vibration: 25.4 µm pk-pk (Alarm: 38 µm, Trip: 50 µm per API 670).',
    couplingCascadeRole: 'Primary Driver: Transfers high shaft torque and axial thermal expansion thrust across flexible coupling.',
    physicsHighlights: [
      'Willans line steam rate consumption vs MW load curve',
      'Wilson line moisture condensation threshold detection',
      'Campbell diagram blade natural frequency interference check',
      'NEMA SM 23 governor speed droop transient regulation',
    ],
  },
  compressor: {
    id: 'compressor',
    name: 'Centrifugal Compressor Surge & Dynamics',
    tag: 'COMP-CENT',
    domain: 'Heavy Process Gas Compression',
    standard: 'API 617 8th Ed / ASME PTC 10',
    standardOrg: 'API / ASME',
    standardClause: 'API 617 §4.2 (Aerodynamic Stability & Surge Margin)',
    icon: Wind,
    operatingSpeed: '4,500 - 18,500 RPM',
    powerOrLoad: '2.0 MW - 45 MW Absorbed Power',
    governingEquation: 'H_{poly} = \\frac{Z_{avg} R T_1}{\\frac{n-1}{n}} \\left[ \\left(\\frac{P_2}{P_1}\\right)^{\\frac{n-1}{n}} - 1 \\right]',
    equationDescription: 'Polytropic head integration with Lee-Kesler compressibility Z and Greitzer B-parameter surge onset.',
    primaryFailureMode: 'Deep Aerodynamic Flow Reversal Surge & Transient Thrust Bearing Unloading',
    warningSymptom: 'Rapid suction pressure oscillation, high-frequency acoustic whistle, and instantaneous thrust pad temperature spikes.',
    spectralFingerprint: 'Sub-synchronous broad-band pulsation (0.2X - 0.5X surge cycling) + 1X synchronous imbalance.',
    acceptanceCriteria: 'Surge Control Line (SCL) buffer margin ≥ 10% mass flow away from Surge Limit Line (SLL).',
    safetyMarginTarget: 'Surge Margin SM ≥ 10.0% • ASV Stroke Time < 1.5 s',
    typicalAlarmThreshold: 'Thrust pad temperature: 95°C (Alarm), 110°C (Trip); Shaft vibration: 30 µm pk-pk.',
    couplingCascadeRole: 'Primary Driven Unit: Gas torque fluctuations and surge pressure waves inject transient torsional shock into train.',
    physicsHighlights: [
      'Greitzer B-parameter instability boundary evaluation',
      'Surge control line (SCL) safety envelope tracking',
      'ASV anti-surge recycle valve bypass trip stroke sizing',
      'Active/inactive thrust bearing load reversal calculation',
    ],
  },
  recip: {
    id: 'recip',
    name: 'Reciprocating Compressor P-V & Pulsation',
    tag: 'RECIP-GAS',
    domain: 'Positive Displacement Compression',
    standard: 'API 618 5th Ed / API 688',
    standardOrg: 'API',
    standardClause: 'API 618 §6.3 (Rod Load Reversal) & Design Approach 3 Pulsation',
    icon: Cpu,
    operatingSpeed: '300 - 1,200 RPM',
    powerOrLoad: '250 kW - 8,500 kW',
    governingEquation: 'F_{rod}(\\theta) = A_{HE} P_{HE}(\\theta) - A_{CE} P_{CE}(\\theta) - m_{recip} r \\omega^2 \\left(\\cos\\theta + \\frac{r}{L}\\cos 2\\theta\\right)',
    equationDescription: 'Combined gas cylinder differential pressure and reciprocating inertia force acting along the piston rod.',
    primaryFailureMode: 'Crosshead Pin Non-Reversal Seizure & Interstage Acoustic Dampener Resonance',
    warningSymptom: 'Abnormal crosshead guide temperature rise, valve pocket cover bolt loosening, and piping cyclical vibration.',
    spectralFingerprint: 'Dominant 1X, 2X, and high-order crank harmonics (up to 16X) with acoustic Helmholtz resonance spikes.',
    acceptanceCriteria: 'Continuous rod load reversal over minimum 15° crank angle; line pulsation ≤ 1.0% line pressure.',
    safetyMarginTarget: 'Rod Load Reversal ≥ 15.0° • Line Pulsation ≤ API 618 Limit',
    typicalAlarmThreshold: 'Frame velocity: 4.5 mm/s RMS (Alarm); Rod drop: ±0.25 mm (Trip).',
    couplingCascadeRole: 'Reciprocating Driver/Driven: Highly cyclical torque demand creates alternating cyclic load on motor and couplings.',
    physicsHighlights: [
      'Closed-loop indicator P-V thermodynamic card generation',
      'Combined gas + inertia crosshead pin reversal span calculation',
      'Suction and discharge valve slip, flutter, and impact velocity',
      'Helmholtz acoustic pulsation damper resonance suppression',
    ],
  },
  gearbox: {
    id: 'gearbox',
    name: 'Industrial Gearbox & Mesh Diagnostics',
    tag: 'GBX-PAR',
    domain: 'Power Transmission & Speed Reduction',
    standard: 'AGMA 2001-D04 / ISO 6336',
    standardOrg: 'AGMA / ISO',
    standardClause: 'AGMA 2001 §8 (Contact Stress) & §9 (Bending Fatigue)',
    icon: Cog,
    operatingSpeed: 'Input: 3,000 - 14,000 RPM | Output: 1,500 - 6,000 RPM',
    powerOrLoad: '500 kW - 35 MW Rated Power',
    governingEquation: 'S_H = \\frac{\\sigma_{HP} \\cdot Z_N \\cdot Z_W / (S_T \\cdot K_T \\cdot K_R)}{\\sigma_H} \\ge 1.25',
    equationDescription: 'AGMA pitting resistance contact safety factor with elastic coefficient Z_E and dynamic load factor K_v.',
    primaryFailureMode: 'Tooth Flank Macropitting (Contact Fatigue) & High-Speed Pinion Root Bending Fracture',
    warningSymptom: 'Elevation in Gear Mesh Frequency (GMF) sideband amplitudes and lubricant iron debris PPM.',
    spectralFingerprint: 'GMF = Z_pinion × 1X, 2×GMF, 3×GMF with 1X modulation sidebands (indicating eccentricity/pitch error).',
    acceptanceCriteria: 'AGMA contact safety factor S_H ≥ 1.25; root bending safety factor S_F ≥ 1.40.',
    safetyMarginTarget: 'S_H ≥ 1.25 • S_F ≥ 1.40 • EHL Film Ratio λ ≥ 2.0',
    typicalAlarmThreshold: 'Housing vibration: Zone C trip at 7.1 mm/s RMS (ISO 10816-3); Sump temp: 85°C.',
    couplingCascadeRole: 'Transmission Bridge: Couples driver speed to driven speed; magnifies torque by gear ratio and transmits mesh vibrations.',
    physicsHighlights: [
      'GMF harmonic spectrum and hunting tooth recurrence period',
      'AGMA 2001 tooth flank contact macropitting safety margin',
      'Dowson-Higginson elastohydrodynamic (EHL) oil film ratio λ',
      'AGMA 9005-F16 lubricant viscosity and thermal heat balance',
    ],
  },
  pump: {
    id: 'pump',
    name: 'Centrifugal Pump Cavitation & NPSH',
    tag: 'PUMP-CENT',
    domain: 'Process Liquid Transport',
    standard: 'API 610 12th Ed / HI 9.6.1',
    standardOrg: 'API / HI',
    standardClause: 'API 610 §6.1.8 (NPSH Margin) & HI 9.6.1-2017 Guidelines',
    icon: Activity,
    operatingSpeed: '1,450 - 3,550 RPM',
    powerOrLoad: '15 kW - 4,500 kW',
    governingEquation: 'NPSHa = \\frac{P_{surface} - P_{vap}}{\\rho g} + Z_s - h_{friction}',
    equationDescription: 'Net positive suction head available calculation using Colebrook-White friction and fluid vapor pressure curves.',
    primaryFailureMode: 'Impeller Eye Cavitation Pitting Erosion & Suction Recirculation Damage',
    warningSymptom: 'Gravel-rattling acoustic noise in suction nozzle, flow head break-off, and high-frequency demodulation acceleration.',
    spectralFingerprint: 'Broadband cavitation acoustic floor elevation (1 kHz - 20 kHz) + Vane Pass Frequency (VPF = Z_impeller × 1X).',
    acceptanceCriteria: 'NPSH margin ratio NPSHa / NPSHr ≥ 1.35x (or NPSHa - NPSHr ≥ 1.0 m for hydrocarbon per API 610).',
    safetyMarginTarget: 'NPSH Margin Ratio ≥ 1.35x • N_ss ≤ 11,000 (US)',
    typicalAlarmThreshold: 'Overall bearing housing vibration: 4.5 mm/s RMS (Alarm), 7.1 mm/s (Trip per ISO 10816-3).',
    couplingCascadeRole: 'Liquid Driven Unit: Flow fluctuations modulate driver motor amperage and generate axial seal chamber pressure.',
    physicsHighlights: [
      'NPSHa vs vendor NPSHr (NPSH3) margin ratio verification',
      'Suction specific speed (N_ss) internal recirculation onset',
      'Minimum Continuous Stable Flow (MCSF) thermal limit',
      'Rayleigh-Plesset vapor bubble collapse energy density',
    ],
  },
  journal: {
    id: 'journal',
    name: 'Hydrodynamic Journal Bearing & Whirl',
    tag: 'BRG-JOUR',
    domain: 'Turbomachinery Rotor Support',
    standard: 'API 684 2nd Ed / API 670 5th Ed',
    standardOrg: 'API',
    standardClause: 'API 684 §2.5 (Subsynchronous Rotor Dynamics) & API 670 §4',
    icon: Compass,
    operatingSpeed: '3,000 - 30,000 RPM',
    powerOrLoad: '5 kN - 250 kN Radial Static Load',
    governingEquation: 'S = \\left(\\frac{R}{C}\\right)^2 \\frac{\\mu N}{P_{unit}}',
    equationDescription: 'Sommerfeld number governing hydrodynamic fluid film pressure wedge equilibrium and attitude angle.',
    primaryFailureMode: 'Oil Whirl / Oil Whip Instability & Babbitt Lining Thermal Wipe',
    warningSymptom: 'Sudden emergence of sub-synchronous vibration spike around 0.43X-0.48X and Babbitt thermocouple climb.',
    spectralFingerprint: 'Severe sub-synchronous peak at 0.43X - 0.48X shaft speed with circular orbit precession.',
    acceptanceCriteria: 'API 684 logarithmic decrement δ > 0.1 (positive damping); total shaft vibration within API 670 limit.',
    safetyMarginTarget: 'Stability Margin Ratio ≥ 1.5x • Babbitt Temp ≤ 100°C',
    typicalAlarmThreshold: 'Shaft relative displacement: A = 25.4 × √(12,000/N) µm; Babbitt temperature: 105°C (Alarm), 115°C (Trip).',
    couplingCascadeRole: 'Rotordynamic Pivot: Fluid film damping controls whole-rotor lateral critical speeds and train vibration transmission.',
    physicsHighlights: [
      'Sommerfeld hydrodynamic lubrication equilibrium',
      'Cross-coupled stiffness (k_xy, k_yx) destabilizing forces',
      'Tilting pad vs fixed geometry oil whirl suppression',
      'API 670 proximity probe orbit and centerline eccentricity tracking',
    ],
  },
  bearing: {
    id: 'bearing',
    name: 'Rolling Element Bearing Kinematics & Faults',
    tag: 'BRG-ROLL',
    domain: 'General Industrial Machinery Support',
    standard: 'ISO 281:2007 / ISO 15243:2017',
    standardOrg: 'ISO',
    standardClause: 'ISO 281 (Modified Rating Life L10mh) & ISO 15243 (Damage Types)',
    icon: Disc,
    operatingSpeed: '600 - 6,000 RPM',
    powerOrLoad: '1 kN - 120 kN Dynamic Load Rating',
    governingEquation: 'L_{10mh} = a_1 \\cdot a_{ISO} \\cdot \\left(\\frac{C}{P}\\right)^p \\cdot \\frac{10^6}{60 N}',
    equationDescription: 'ISO 281 modified rating life with lubrication parameter a_ISO, viscosity ratio κ, and contamination factor e_C.',
    primaryFailureMode: 'Sub-Surface Contact Fatigue Spalling (BPFO / BPFI) & Lubrication Starvation',
    warningSymptom: 'Elevated peak crest factor, high shock pulse kurtosis (> 3.0), and ultrasonic noise burst.',
    spectralFingerprint: 'Non-synchronous impact harmonics: BPFO (Outer Race), BPFI (Inner Race), BSF (Ball Spin), FTF (Cage).',
    acceptanceCriteria: 'L10mh rating life ≥ 25,000 operating hours for continuous process plants; Kurtosis ≤ 3.0.',
    safetyMarginTarget: 'L10mh ≥ 25,000 hrs • Viscosity Ratio κ ≥ 1.2 • Kurtosis ≤ 3.0',
    typicalAlarmThreshold: 'Peak overall velocity: 4.5 mm/s RMS; Enveloped acceleration: 1.5 gE (Alarm), 3.0 gE (Trip).',
    couplingCascadeRole: 'Drive Train Foundation: Transmits rotational radial and thrust loads from motor/pump to ground structure.',
    physicsHighlights: [
      'Harris bearing kinematics formulas (BPFO, BPFI, BSF, FTF)',
      'ISO 281 modified life L10mh with lubrication factor a_ISO',
      'High-frequency demodulated shock pulse enveloping (HFE)',
      'Kurtosis, Crest Factor, and 4-stage bearing degradation model',
    ],
  },
  rotor: {
    id: 'rotor',
    name: 'Rotor Dynamics & ISO 1940 Balancing',
    tag: 'ROTOR-DYN',
    domain: 'Rotordynamic Balancing & Vibration',
    standard: 'ISO 1940-1:2003 / ISO 20816-3',
    standardOrg: 'ISO',
    standardClause: 'ISO 1940 Grade G1.0 / G2.5 & ISO 20816-3 Severity Zones',
    icon: RotateCw,
    operatingSpeed: '900 - 15,000 RPM',
    powerOrLoad: 'Rotor Mass: 5 kg - 5,000 kg',
    governingEquation: 'U_{per} = \\frac{1000 \\cdot G \\cdot m_{rotor}}{\\omega} = \\frac{9549 \\cdot G \\cdot m_{rotor}}{N}',
    equationDescription: 'ISO 1940 permissible residual unbalance based on quality grade G, rotor mass, and angular frequency ω.',
    primaryFailureMode: 'Excessive 1X Centrifugal Force Dynamic Overload & Bearing Premature Fatigue',
    warningSymptom: 'Strong 1X synchronous radial vibration with steady phase angle, proportional to RPM squared.',
    spectralFingerprint: 'Pure 1X synchronous sinusoidal peak dominates velocity spectrum (> 85% of total RMS).',
    acceptanceCriteria: 'Residual unbalance below ISO 1940 Grade G2.5 limit; overall vibration in ISO 20816-3 Zone A or B.',
    safetyMarginTarget: 'Residual Unbalance ≤ U_per • Vibration Zone A/B',
    typicalAlarmThreshold: 'ISO 20816-3 Zone B limit: 2.8 mm/s RMS (Group 1 Rigid), Zone C Alarm at 4.5 mm/s RMS.',
    couplingCascadeRole: 'Rotational Core: Imbalance produces rotating radial shear force transferred directly into bearings and coupling.',
    physicsHighlights: [
      'ISO 1940 permissible unbalance limit U_per formula',
      '1X synchronous centrifugal dynamic unbalance force F_c',
      'ISO 20816-3 vibration severity zone classification (A, B, C, D)',
      'Static vs Couple unbalance two-plane vector decomposition',
    ],
  },
  alignment: {
    id: 'alignment',
    name: 'Shaft Alignment & API 686 Thermal Growth',
    tag: 'ALIGN-SHAFT',
    domain: 'Coupled Machine Geometric Alignment',
    standard: 'API 686 Chapter 7 / AGMA 9000',
    standardOrg: 'API / AGMA',
    standardClause: 'API 686 Recommended Practice §7 (Machinery Alignment)',
    icon: Target,
    operatingSpeed: '900 - 7,200 RPM',
    powerOrLoad: 'Centerline Height: 150 mm - 800 mm',
    governingEquation: '\\Delta Y_{thermal} = \\alpha \\cdot L_{foot-cl} \\cdot (T_{case} - T_{ambient})',
    equationDescription: 'Thermal growth vertical and lateral expansion offset vector based on casing material expansion coefficient α.',
    primaryFailureMode: 'Coupling Fatigue Failure, Drive-End Bearing Cyclic Overload & 2X Vibration',
    warningSymptom: 'High 2X harmonic axial/radial vibration, elevated coupling temperature, and rapid drive-end bearing grease degradation.',
    spectralFingerprint: 'Dominant 2X rotational harmonic alongside 1X; 180° phase shift across coupling flexible element.',
    acceptanceCriteria: 'Cold-aligned offset cancels thermal expansion so hot-running condition is within API 686 tolerance (≤ 0.05 mm).',
    safetyMarginTarget: 'Hot Offset ≤ 0.05 mm • Hot Angular Tilt ≤ 0.5 mrad',
    typicalAlarmThreshold: '2X vibration amplitude > 50% of 1X; coupling cover temperature > 75°C.',
    couplingCascadeRole: 'Train Connection Interface: Misalignment forces drive-end bearings into continuous pre-loaded fatigue.',
    physicsHighlights: [
      'Reverse indicator and rim-face alignment mathematical matrix',
      'Casing thermal growth compensation (ΔY and ΔX expansion)',
      'Front and rear motor foot shim calculation with soft-foot check',
      'Coupling disc pack restoring moment and shear reaction',
    ],
  },
  pipe: {
    id: 'pipe',
    name: 'Piping Thermal Stress & Expansion',
    tag: 'PIPE-STR',
    domain: 'Process Piping & Nozzle Integrity',
    standard: 'ASME B31.3:2022 §319 / API 610 Annex F',
    standardOrg: 'ASME / API',
    standardClause: 'ASME B31.3 Section 319 (Piping Flexibility) & Annex F Nozzle Limits',
    icon: Maximize2,
    operatingSpeed: 'Static System (Process Flow Driven)',
    powerOrLoad: 'NPS 2" to NPS 36" (Sch 10 to XXS)',
    governingEquation: 'S_A = f \\left[ 1.25(S_c + S_h) - S_L \\right]',
    equationDescription: 'ASME B31.3 allowable displacement stress range with cyclic fatigue reduction factor f and basic allowable stresses.',
    primaryFailureMode: 'Excessive Nozzle Load Rotating Machine Casing Distortion & Fatigue Cracking at Elbows',
    warningSymptom: 'Coupling misalignment re-emergence when piping is bolted up (pipe strain), flange leaks, and casing deflection.',
    spectralFingerprint: 'Induces severe 1X and 2X machine vibration by warping machinery bearing housing centerlines.',
    acceptanceCriteria: 'Thermal displacement stress S_E ≤ S_A; nozzle forces and moments within API 610 Table 5 envelope.',
    safetyMarginTarget: 'Stress Ratio S_E / S_A ≤ 100% • Nozzle Load Ratio ≤ 1.0x',
    typicalAlarmThreshold: 'Pipe stress utilization > 90%; nozzle force ratio > 1.2x allowable API 610 limit.',
    couplingCascadeRole: 'Boundary Restraint: Excess piping thermal thrust warps machine casing and destroys shaft alignment.',
    physicsHighlights: [
      'Linear thermal growth elongation ΔL = α · L · ΔT',
      'ASME B31.3 allowable displacement stress range S_A calculation',
      'Kellogg guided cantilever and U-loop flexibility factors',
      'Rigid anchor compressive reaction force and nozzle moments',
    ],
  },
  seal: {
    id: 'seal',
    name: 'API 682 Mechanical Seal Flush Plans',
    tag: 'SEAL-FLUSH',
    domain: 'Process Containment & Tribology',
    standard: 'API 682 4th Ed / ISO 21049',
    standardOrg: 'API / ISO',
    standardClause: 'API 682 Annex A, Annex C, and Specific Flush Plan Standard P&IDs',
    icon: ShieldCheck,
    operatingSpeed: '1,450 - 3,600 RPM',
    powerOrLoad: 'Shaft Diameter: 25 mm - 120 mm',
    governingEquation: 'Q_{face} = f_{fric} \\cdot P_{net} \\cdot A_{face} \\cdot V_{mean}',
    equationDescription: 'Mechanical seal face frictional heat power generation and restriction orifice hydraulics.',
    primaryFailureMode: 'Seal Face Vaporization (Dry Running Flash), Coking, and Barrier Fluid Pressure Loss',
    warningSymptom: 'Seal chamber temperature spike, squealing face noise, and barrier fluid reservoir level drop.',
    spectralFingerprint: 'High-frequency acoustic emission (> 50 kHz) from boundary contact friction dry rubbing.',
    acceptanceCriteria: 'Seal chamber vapor pressure suppression margin ΔP_vap ≥ 200 kPa (or ΔT ≥ 15°C subcooled).',
    safetyMarginTarget: 'Vapor Margin ≥ 200 kPa • Barrier Overpressure ≥ 1.4 bar',
    typicalAlarmThreshold: 'Seal chamber temp > 80°C; barrier reservoir low-level switch trip; buffer pressure drop.',
    couplingCascadeRole: 'Fluid Barrier: Pump hydraulic cavity isolation; relies on clean pump discharge pressure for flush flow.',
    physicsHighlights: [
      'Seal face frictional heat power Q_face generation (kW)',
      'Restriction orifice Bernoulli flow sizing with discharge ΔP',
      'Vapor pressure margin suppression to prevent explosive flash',
      'API Plans 11, 23, 31, 52, 53A, 53B, and 54 hydraulic balance',
    ],
  },
};

const CURATED_PAIRS: Array<{ id: string; label: string; tagA: SimulatorId; tagB: SimulatorId; description: string }> = [
  {
    id: 'turb-comp',
    label: 'High-Speed Turbomachinery Train',
    tagA: 'turbine',
    tagB: 'compressor',
    description: 'API 612 Steam Turbine Driver directly coupled to API 617 Centrifugal Compressor. Compares driver MW power & Campbell margins against compressor surge buffer & gas torque load.',
  },
  {
    id: 'turb-gbx',
    label: 'High-Speed Geared Turbine Train',
    tagA: 'turbine',
    tagB: 'gearbox',
    description: 'API 612 Steam Turbine stepped down through an AGMA 2001 Industrial Gearbox. Analyzes speed ratio, GMF mesh harmonics vs turbine blade natural frequencies, and torsional reactions.',
  },
  {
    id: 'pump-seal',
    label: 'Centrifugal Pump & Seal Interface',
    tagA: 'pump',
    tagB: 'seal',
    description: 'API 610 Pump coupled with API 682 Mechanical Seal. Evaluates pump suction NPSHa margin alongside seal chamber vapor suppression margin and frictional face heat dissipation.',
  },
  {
    id: 'journal-bearing',
    label: 'Fluid Film vs Rolling Element Tribology',
    tagA: 'journal',
    tagB: 'bearing',
    description: 'API 684 Hydrodynamic Babbitt Sleeve bearing compared with ISO 281 Rolling Element Bearing. Evaluates Sommerfeld hydrodynamic film vs Harris rolling contact fatigue life and failure physics.',
  },
  {
    id: 'align-rotor',
    label: 'Coupled Alignment & Dynamic Balancing',
    tagA: 'alignment',
    tagB: 'rotor',
    description: 'API 686 Shaft Alignment compared with ISO 1940 Rotor Dynamics. Inspects 2X misalignment harmonics and coupling disc shear vs 1X centrifugal synchronous unbalance vectors.',
  },
  {
    id: 'recip-pipe',
    label: 'Reciprocating Pulsation & Pipe Stress',
    tagA: 'recip',
    tagB: 'pipe',
    description: 'API 618 Reciprocating Compressor interstage piping coupled to ASME B31.3 Piping Stress. Analyzes gas acoustic pulsation pressure waves vs piping thermal expansion and anchor reactions.',
  },
];

export const CrossAssetComparatorModal: React.FC = () => {
  const {
    isComparatorOpen,
    setIsComparatorOpen,
    comparatorPair,
    setComparatorPair,
    setActiveRoute,
    setIsMachineryTrainStudioOpen,
  } = useApp();

  const [twinAId, setTwinAId] = useState<SimulatorId>(comparatorPair[0] || 'turbine');
  const [twinBId, setTwinBId] = useState<SimulatorId>(comparatorPair[1] || 'compressor');

  // Keep in sync when context comparatorPair changes
  React.useEffect(() => {
    if (comparatorPair && comparatorPair.length === 2) {
      setTwinAId(comparatorPair[0]);
      setTwinBId(comparatorPair[1]);
    }
  }, [comparatorPair]);

  const twinA = useMemo(() => COMPARISON_TWINS_DATA[twinAId], [twinAId]);
  const twinB = useMemo(() => COMPARISON_TWINS_DATA[twinBId], [twinBId]);

  if (!isComparatorOpen) return null;

  const handleSwap = () => {
    const temp = twinAId;
    setTwinAId(twinBId);
    setTwinBId(temp);
    setComparatorPair([twinBId, temp]);
  };

  const selectPreset = (a: SimulatorId, b: SimulatorId) => {
    setTwinAId(a);
    setTwinBId(b);
    setComparatorPair([a, b]);
  };

  const allSimIds: SimulatorId[] = [
    'turbine',
    'compressor',
    'recip',
    'gearbox',
    'pump',
    'journal',
    'bearing',
    'rotor',
    'alignment',
    'pipe',
    'seal',
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparator-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-fadeIn"
      onClick={() => setIsComparatorOpen(false)}
    >
      <div
        className="w-full max-w-6xl max-h-[92vh] bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl flex flex-col font-sans overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#21262d] bg-[#161b22] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#f27d26]/20 border border-[#f27d26]/50 flex items-center justify-center text-[#f27d26] shrink-0">
              <GitCompare size={17} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="comparator-modal-title" className="text-sm sm:text-base font-bold text-white font-mono uppercase tracking-wider">
                  Cross-Asset Digital Twin Comparator
                </h2>
                <span className="px-2 py-0.5 bg-[#f27d26]/10 border border-[#f27d26]/30 text-[#f27d26] rounded text-[10px] font-mono font-bold">
                  SIDE-BY-SIDE PHYSICS
                </span>
              </div>
              <p className="text-[11px] text-[#8b949e] font-mono">
                Compare mechanical physics, governing API/ISO standards, failure cascades & spectral fingerprints across coupled machines.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsComparatorOpen(false)}
            className="p-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white transition-colors cursor-pointer"
            title="Close Comparator"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick Pair Presets Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#111620] border-b border-[#21262d] flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0 text-xs font-mono">
          <span className="text-[10px] text-[#8b949e] uppercase font-bold shrink-0 flex items-center gap-1">
            <Sliders size={11} className="text-[#f27d26]" />
            TRAIN PAIRS:
          </span>
          {CURATED_PAIRS.map((pair) => {
            const isSelected = (twinAId === pair.tagA && twinBId === pair.tagB) || (twinAId === pair.tagB && twinBId === pair.tagA);
            return (
              <button
                key={pair.id}
                onClick={() => selectPreset(pair.tagA, pair.tagB)}
                className={`px-2.5 py-1 rounded text-[11px] whitespace-nowrap transition-all cursor-pointer select-none font-medium ${
                  isSelected
                    ? 'bg-[#f27d26] text-black font-bold shadow-sm'
                    : 'bg-[#161b22] text-[#8b949e] hover:text-white hover:bg-[#21262d] border border-[#21262d]'
                }`}
                title={pair.description}
              >
                {pair.label}
              </button>
            );
          })}
        </div>

        {/* Twin Selector Control Strip */}
        <div className="px-4 sm:px-6 py-3 bg-[#0d1117] border-b border-[#21262d] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 font-mono text-xs">
          {/* Twin A Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[10px] uppercase font-bold text-[#38bdf8] shrink-0">ASSET A:</span>
            <select
              value={twinAId}
              onChange={(e) => {
                const newId = e.target.value as SimulatorId;
                setTwinAId(newId);
                setComparatorPair([newId, twinBId]);
              }}
              className="bg-[#161b22] text-white border border-[#30363d] focus:border-[#38bdf8] rounded px-3 py-1.5 text-xs font-mono outline-none cursor-pointer w-full sm:w-64"
            >
              {allSimIds.map((id) => (
                <option key={id} value={id} disabled={id === twinBId}>
                  {COMPARISON_TWINS_DATA[id].tag} • {COMPARISON_TWINS_DATA[id].name}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            className="p-1.5 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] rounded text-[#8b949e] hover:text-[#f27d26] transition-colors cursor-pointer shrink-0"
            title="Swap Asset A and Asset B"
          >
            <ArrowLeftRight size={14} />
          </button>

          {/* Twin B Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[10px] uppercase font-bold text-emerald-400 shrink-0">ASSET B:</span>
            <select
              value={twinBId}
              onChange={(e) => {
                const newId = e.target.value as SimulatorId;
                setTwinBId(newId);
                setComparatorPair([twinAId, newId]);
              }}
              className="bg-[#161b22] text-white border border-[#30363d] focus:border-emerald-400 rounded px-3 py-1.5 text-xs font-mono outline-none cursor-pointer w-full sm:w-64"
            >
              {allSimIds.map((id) => (
                <option key={id} value={id} disabled={id === twinAId}>
                  {COMPARISON_TWINS_DATA[id].tag} • {COMPARISON_TWINS_DATA[id].name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scrollable Comparison Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6">
          {/* Top Visual Cards: 2 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Card A */}
            <div className="bg-[#111620] border border-[#38bdf8]/40 rounded-lg p-4 space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-[#38bdf8]/20 text-[#38bdf8] flex items-center justify-center font-bold">
                    <twinA.icon size={15} />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">{twinA.name}</div>
                    <div className="text-[10px] text-[#38bdf8]">{twinA.domain}</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-black/40 border border-[#30363d] text-[10px] text-white font-bold">
                  {twinA.standard}
                </span>
              </div>

              {/* Sparkline */}
              <div className="bg-[#080b0f] border border-[#1f2633] rounded p-2">
                <SimulatorSparkline id={twinA.id} className="w-full h-16" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#21262d]">
                <div>
                  <div className="text-[10px] text-[#8b949e]">SPEED RANGE</div>
                  <div className="text-white font-bold text-[11px]">{twinA.operatingSpeed}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#8b949e]">RATED LOAD / POWER</div>
                  <div className="text-white font-bold text-[11px]">{twinA.powerOrLoad}</div>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveRoute(twinA.id);
                  setIsComparatorOpen(false);
                }}
                className="w-full py-2 bg-[#161b22] hover:bg-[#38bdf8] hover:text-black border border-[#30363d] hover:border-[#38bdf8] text-white font-bold text-xs rounded transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Launch {twinA.name.split(' ')[0]} Twin Cockpit</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Card B */}
            <div className="bg-[#111620] border border-emerald-500/40 rounded-lg p-4 space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <twinB.icon size={15} />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">{twinB.name}</div>
                    <div className="text-[10px] text-emerald-400">{twinB.domain}</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-black/40 border border-[#30363d] text-[10px] text-white font-bold">
                  {twinB.standard}
                </span>
              </div>

              {/* Sparkline */}
              <div className="bg-[#080b0f] border border-[#1f2633] rounded p-2">
                <SimulatorSparkline id={twinB.id} className="w-full h-16" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#21262d]">
                <div>
                  <div className="text-[10px] text-[#8b949e]">SPEED RANGE</div>
                  <div className="text-white font-bold text-[11px]">{twinB.operatingSpeed}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#8b949e]">RATED LOAD / POWER</div>
                  <div className="text-white font-bold text-[11px]">{twinB.powerOrLoad}</div>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveRoute(twinB.id);
                  setIsComparatorOpen(false);
                }}
                className="w-full py-2 bg-[#161b22] hover:bg-emerald-400 hover:text-black border border-[#30363d] hover:border-emerald-400 text-white font-bold text-xs rounded transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Launch {twinB.name.split(' ')[0]} Twin Cockpit</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Deep Engineering Comparison Rows */}
          <div className="border border-[#21262d] rounded-lg overflow-hidden bg-[#0d1117] font-mono text-xs divide-y divide-[#21262d]">
            {/* Row 1: Governing Standard & Specific Clause */}
            <div className="grid grid-cols-1 md:grid-cols-12 p-3.5 gap-2 items-center bg-[#161b22]/50">
              <div className="md:col-span-3 text-[11px] font-bold text-[#8b949e] uppercase">
                Governing Standard & Clause
              </div>
              <div className="md:col-span-4 text-white">
                <div className="font-bold text-[#38bdf8]">{twinA.standard}</div>
                <div className="text-[10px] text-[#8b949e] mt-0.5">{twinA.standardClause}</div>
              </div>
              <div className="md:col-span-1 hidden md:flex justify-center text-[#484f58]">
                <span>vs</span>
              </div>
              <div className="md:col-span-4 text-white">
                <div className="font-bold text-emerald-400">{twinB.standard}</div>
                <div className="text-[10px] text-[#8b949e] mt-0.5">{twinB.standardClause}</div>
              </div>
            </div>

            {/* Row 2: Mathematical Physics Formulation */}
            <div className="grid grid-cols-1 md:grid-cols-12 p-3.5 gap-2 items-start">
              <div className="md:col-span-3 text-[11px] font-bold text-[#8b949e] uppercase">
                Governing Equation & Physics
              </div>
              <div className="md:col-span-4 space-y-1">
                <div className="px-2.5 py-1.5 bg-[#080b0f] border border-[#21262d] rounded text-[#38bdf8] font-bold text-[11px]">
                  <code>{twinA.governingEquation}</code>
                </div>
                <p className="text-[10px] text-[#8b949e] leading-snug">{twinA.equationDescription}</p>
              </div>
              <div className="md:col-span-1 hidden md:flex justify-center text-[#484f58] pt-2">
                <span>vs</span>
              </div>
              <div className="md:col-span-4 space-y-1">
                <div className="px-2.5 py-1.5 bg-[#080b0f] border border-[#21262d] rounded text-emerald-400 font-bold text-[11px]">
                  <code>{twinB.governingEquation}</code>
                </div>
                <p className="text-[10px] text-[#8b949e] leading-snug">{twinB.equationDescription}</p>
              </div>
            </div>

            {/* Row 3: Primary Failure Mode & Early Warning */}
            <div className="grid grid-cols-1 md:grid-cols-12 p-3.5 gap-2 items-start bg-[#161b22]/30">
              <div className="md:col-span-3 text-[11px] font-bold text-red-400 uppercase flex items-center gap-1.5">
                <AlertTriangle size={13} />
                <span>Primary Failure Mode</span>
              </div>
              <div className="md:col-span-4 space-y-1">
                <div className="text-white font-bold text-[11px]">{twinA.primaryFailureMode}</div>
                <div className="text-[10px] text-[#8b949e] leading-snug">
                  <span className="text-[#38bdf8] font-semibold">Warning:</span> {twinA.warningSymptom}
                </div>
              </div>
              <div className="md:col-span-1 hidden md:flex justify-center text-[#484f58]">
                <span>vs</span>
              </div>
              <div className="md:col-span-4 space-y-1">
                <div className="text-white font-bold text-[11px]">{twinB.primaryFailureMode}</div>
                <div className="text-[10px] text-[#8b949e] leading-snug">
                  <span className="text-emerald-400 font-semibold">Warning:</span> {twinB.warningSymptom}
                </div>
              </div>
            </div>

            {/* Row 4: Condition Monitoring Spectral Fingerprint */}
            <div className="grid grid-cols-1 md:grid-cols-12 p-3.5 gap-2 items-start">
              <div className="md:col-span-3 text-[11px] font-bold text-[#8b949e] uppercase flex items-center gap-1.5">
                <Activity size={13} className="text-[#f27d26]" />
                <span>Spectral Signature (FFT)</span>
              </div>
              <div className="md:col-span-4 text-[#c9d1d9] text-[11px] leading-snug">
                {twinA.spectralFingerprint}
              </div>
              <div className="md:col-span-1 hidden md:flex justify-center text-[#484f58]">
                <span>vs</span>
              </div>
              <div className="md:col-span-4 text-[#c9d1d9] text-[11px] leading-snug">
                {twinB.spectralFingerprint}
              </div>
            </div>

            {/* Row 5: Deterministic Acceptance & Safety Margins */}
            <div className="grid grid-cols-1 md:grid-cols-12 p-3.5 gap-2 items-start bg-[#161b22]/30">
              <div className="md:col-span-3 text-[11px] font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                <span>Deterministic Criteria</span>
              </div>
              <div className="md:col-span-4 space-y-1">
                <div className="text-white font-bold text-[11px]">{twinA.safetyMarginTarget}</div>
                <div className="text-[10px] text-[#8b949e] leading-snug">{twinA.acceptanceCriteria}</div>
              </div>
              <div className="md:col-span-1 hidden md:flex justify-center text-[#484f58]">
                <span>vs</span>
              </div>
              <div className="md:col-span-4 space-y-1">
                <div className="text-white font-bold text-[11px]">{twinB.safetyMarginTarget}</div>
                <div className="text-[10px] text-[#8b949e] leading-snug">{twinB.acceptanceCriteria}</div>
              </div>
            </div>

            {/* Row 6: Coupling Cascade Interaction */}
            <div className="grid grid-cols-1 md:grid-cols-12 p-3.5 gap-2 items-start">
              <div className="md:col-span-3 text-[11px] font-bold text-amber-400 uppercase flex items-center gap-1.5">
                <Network size={13} />
                <span>Coupled Drive Train Role</span>
              </div>
              <div className="md:col-span-4 text-[#c9d1d9] text-[10px] leading-snug">
                {twinA.couplingCascadeRole}
              </div>
              <div className="md:col-span-1 hidden md:flex justify-center text-[#484f58]">
                <span>↔</span>
              </div>
              <div className="md:col-span-4 text-[#c9d1d9] text-[10px] leading-snug">
                {twinB.couplingCascadeRole}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="px-4 sm:px-6 py-3 border-t border-[#21262d] bg-[#161b22] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 font-mono text-xs">
          <div className="text-[#8b949e] text-[11px]">
            Coupled Train Verification • ASTM / ASME / API / ISO Benchmark Verified
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setIsMachineryTrainStudioOpen(true);
                setIsComparatorOpen(false);
              }}
              className="flex-1 sm:flex-initial px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Network size={13} className="text-blue-400" />
              <span>Open in Cascade Studio</span>
            </button>
            <button
              onClick={() => setIsComparatorOpen(false)}
              className="flex-1 sm:flex-initial px-4 py-1.5 bg-[#f27d26] hover:bg-[#ff8f3d] text-black font-bold rounded transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
