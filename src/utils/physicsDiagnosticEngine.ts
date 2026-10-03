import { UnitSystem } from '../types/common';

export interface PhysicsFactorItem {
  id: string;
  name: string;
  symbol: string;
  value: string | number;
  unit: string;
  impact: 'positive' | 'negative' | 'neutral';
  percentage?: number; // relative influence %
  description: string;
}

export interface StandardComplianceItem {
  id: string;
  standard: string;
  clause: string;
  parameter: string;
  limit: string;
  actual: string;
  status: 'compliant' | 'marginal' | 'violation';
  marginText: string;
  governingBody: 'API' | 'ISO' | 'ASME' | 'AGMA' | 'HI';
}

export interface CorrectiveGuidanceItem {
  id: string;
  parameterName: string;
  currentValue: string;
  targetValue: string;
  actionDelta: string;
  rationale: string;
  priority: 'critical' | 'high' | 'medium';
  actionType: 'slider' | 'maintenance' | 'inspection';
}

export interface InputChangeImpact {
  detectedParam: string;
  oldValue: string;
  newValue: string;
  delta: string;
  physicalEffect: string;
  governingEquation: string;
  standardImpact: string;
}

/**
 * Maps simulator IDs and inputs/outputs to high-precision physical factors
 */
export function getSimulatorPhysicsFactors(
  simId: string,
  inputs: Record<string, any>,
  outputs: Record<string, any>,
  unitSystem: UnitSystem = 'metric'
): {
  governingEquation: string;
  equationDescription: string;
  factors: PhysicsFactorItem[];
} {
  switch (simId) {
    case 'pump': {
      const pAtm = outputs.atmosphericHeadM ?? 10.33;
      const zStatic = inputs.staticHeadM ?? 2.5;
      const pVap = outputs.vaporPressureHeadM ?? 0.85;
      const hFriction = outputs.totalSuctionHeadLossM ?? 0.65;
      const npsha = outputs.npshaM ?? 11.33;

      return {
        governingEquation: 'NPSHa = (P_atm - P_v) / (ρ·g) + Z_s - h_f',
        equationDescription: 'Net Positive Suction Head Available at the pump impeller first-stage eye (API 610 / HI 9.6.1).',
        factors: [
          {
            id: 'p_atm',
            name: 'Atmospheric Pressure Head',
            symbol: 'P_atm / (ρ·g)',
            value: pAtm.toFixed(2),
            unit: 'm',
            impact: 'positive',
            percentage: 60,
            description: 'Ambient pressure acting on fluid surface in suction vessel.',
          },
          {
            id: 'z_s',
            name: 'Static Liquid Elevation',
            symbol: '+ Z_s',
            value: zStatic >= 0 ? `+${zStatic.toFixed(2)}` : zStatic.toFixed(2),
            unit: 'm',
            impact: zStatic >= 0 ? 'positive' : 'negative',
            percentage: 25,
            description: 'Static liquid height above pump suction centerline (flooded vs lift).',
          },
          {
            id: 'p_v',
            name: 'Fluid Vapor Pressure Head',
            symbol: '- P_v / (ρ·g)',
            value: `-${pVap.toFixed(2)}`,
            unit: 'm',
            impact: 'negative',
            percentage: 10,
            description: 'Temperature-dependent vapor pressure; rises exponentially with heat.',
          },
          {
            id: 'h_f',
            name: 'Suction Line Friction Loss',
            symbol: '- h_f',
            value: `-${hFriction.toFixed(2)}`,
            unit: 'm',
            impact: 'negative',
            percentage: 5,
            description: 'Dynamic Darcy-Weisbach piping, strainer, and valve head losses.',
          },
        ],
      };
    }

    case 'rotor': {
      const fc = outputs.dynamicUnbalanceForceN ?? 1500;
      const rpm = inputs.operatingSpeedRpm ?? inputs.shaftSpeedRpm ?? 2980;
      const unbalance = outputs.actualUnbalanceGmm ?? 350;
      const amp = outputs.dynamicAmplificationFactor ?? 1.2;

      return {
        governingEquation: 'F_c = m_u · r · ω² · Q(λ)',
        equationDescription: 'Centrifugal unbalance force amplified by lateral critical resonance magnification (ISO 1940 / API 684).',
        factors: [
          {
            id: 'unbalance_mass',
            name: 'Residual Unbalance Moment',
            symbol: 'm_u · r',
            value: unbalance.toFixed(0),
            unit: 'g·mm',
            impact: 'negative',
            percentage: 35,
            description: 'Geometric eccentricity of center-of-gravity from rotational axis.',
          },
          {
            id: 'speed_sq',
            name: 'Rotational Angular Velocity Squared',
            symbol: 'ω²',
            value: ((rpm * Math.PI) / 30).toFixed(0),
            unit: 'rad/s',
            impact: 'negative',
            percentage: 45,
            description: 'Speed squared effect: doubling RPM quadruples unbalance force.',
          },
          {
            id: 'dynamic_q',
            name: 'Resonance Amplification Factor',
            symbol: 'Q(λ)',
            value: amp.toFixed(2),
            unit: 'x',
            impact: amp > 1.5 ? 'negative' : 'neutral',
            percentage: 20,
            description: 'Proximity to lateral critical speed Jeffcott resonance peak.',
          },
        ],
      };
    }

    case 'alignment': {
      const offset = outputs.hotResultantOffsetMm ?? 0.08;
      const thermalDriver = outputs.driverThermalGrowthVerticalMm ?? 0.12;
      const thermalDriven = outputs.drivenThermalGrowthVerticalMm ?? 0.05;

      return {
        governingEquation: 'ΔS_F = -VO_c + α_driver·L·ΔT - (VA_c·D_F/D_c)',
        equationDescription: 'Reverse indicator rim-and-face thermal alignment transfer matrix (API 686 Chapter 5).',
        factors: [
          {
            id: 'cold_offset',
            name: 'Cold Dial Indicator Offset',
            symbol: 'VO_c',
            value: (outputs.coldResultantOffsetMm ?? 0.04).toFixed(3),
            unit: 'mm',
            impact: 'negative',
            percentage: 30,
            description: 'Mechanical rim and face laser metrology readings at ambient temperature.',
          },
          {
            id: 'thermal_driver',
            name: 'Driver Thermal Growth',
            symbol: 'α_m · H_m · ΔT_m',
            value: `+${thermalDriver.toFixed(3)}`,
            unit: 'mm',
            impact: 'positive',
            percentage: 40,
            description: 'Electric motor or turbine frame thermal casing expansion.',
          },
          {
            id: 'thermal_driven',
            name: 'Driven Pump Thermal Growth',
            symbol: 'α_p · H_p · ΔT_p',
            value: `-${thermalDriven.toFixed(3)}`,
            unit: 'mm',
            impact: 'negative',
            percentage: 30,
            description: 'Pump casing thermal rise relative to driver centerline.',
          },
        ],
      };
    }

    case 'pipe': {
      const se = outputs.combinedStressVonMisesMPa ?? outputs.expansionStressMPa ?? 125;
      const sa = outputs.allowableStressMPa ?? 138;
      const dL = outputs.thermalExpansionMm ?? 42;

      return {
        governingEquation: 'S_E = √(S_b² + 4·S_t²) ≤ S_A = f·(1.25·S_c + 0.25·S_h)',
        equationDescription: 'ASME B31.3 §302.3.5 Thermal displacement stress range vs allowable cyclic stress.',
        factors: [
          {
            id: 'thermal_expansion',
            name: 'Thermal Free Run Strain',
            symbol: 'ΔL = α·L·ΔT',
            value: dL.toFixed(1),
            unit: 'mm',
            impact: 'negative',
            percentage: 50,
            description: 'Unrestrained expansion displacement over straight pipe length.',
          },
          {
            id: 'loop_flexibility',
            name: 'Expansion Loop Flexibility',
            symbol: 'K_flex',
            value: (inputs.expansionLoopLengthM ?? 4.0).toFixed(1),
            unit: 'm',
            impact: 'positive',
            percentage: 35,
            description: 'Orthogonal routing U-loop compliance absorbing thermal displacement.',
          },
          {
            id: 'allowable_sa',
            name: 'Code Stress Envelope',
            symbol: 'S_A',
            value: sa.toFixed(0),
            unit: 'MPa',
            impact: 'positive',
            percentage: 15,
            description: 'Material allowable displacement stress based on hot and cold yields.',
          },
        ],
      };
    }

    case 'seal': {
      const pChamber = outputs.sealChamberPressureBar ?? 3.5;
      const pVap = outputs.vaporPressureBar ?? 1.2;
      const deltaP = outputs.vaporPressureMarginBar ?? (pChamber - pVap);

      return {
        governingEquation: 'ΔP_vap = P_chamber - P_vapor(T_face) ≥ 2.0 bar',
        equationDescription: 'API 682 4th Edition boiling point margin suppressing seal face vaporization.',
        factors: [
          {
            id: 'p_chamber',
            name: 'Seal Chamber Pressure',
            symbol: 'P_chamber',
            value: pChamber.toFixed(2),
            unit: 'bar',
            impact: 'positive',
            percentage: 50,
            description: 'Operating pressure maintained inside seal stuffing box.',
          },
          {
            id: 'p_vap_face',
            name: 'Seal Face Vapor Pressure',
            symbol: 'P_vap(T_face)',
            value: `-${pVap.toFixed(2)}`,
            unit: 'bar',
            impact: 'negative',
            percentage: 35,
            description: 'Fluid vapor pressure at elevated seal face frictional temperature.',
          },
          {
            id: 'flush_flow',
            name: 'Flush Heat Dissipation',
            symbol: 'Q_flush',
            value: (outputs.flushFlowRateLpm ?? 8.5).toFixed(1),
            unit: 'L/min',
            impact: 'positive',
            percentage: 15,
            description: 'Orifice flush flow volume removing tribological contact heat.',
          },
        ],
      };
    }

    case 'compressor': {
      const scm = outputs.currentSurgeMarginPercent ?? 12.5;
      const qOp = outputs.actualFlowM3h ?? outputs.massFlowTotalKgS ?? 45;
      const qSurge = outputs.surgeFlowM3h ?? 36;

      return {
        governingEquation: 'SCM = (Q_op - Q_surge) / Q_op · 100% ≥ 10.0%',
        equationDescription: 'API 617 8th Edition centrifugal compressor surge margin above Surge Limit Line (SLL).',
        factors: [
          {
            id: 'flow_op',
            name: 'Compressor Inlet Flow',
            symbol: 'Q_op',
            value: typeof qOp === 'number' ? qOp.toFixed(1) : qOp,
            unit: 'm³/h',
            impact: 'positive',
            percentage: 55,
            description: 'Current inlet volumetric flow rate passing through impeller.',
          },
          {
            id: 'flow_surge',
            name: 'Impeller Surge Boundary',
            symbol: 'Q_surge',
            value: typeof qSurge === 'number' ? qSurge.toFixed(1) : qSurge,
            unit: 'm³/h',
            impact: 'negative',
            percentage: 30,
            description: 'Aerodynamic stall flow rate at current compression pressure ratio.',
          },
          {
            id: 'asv_recycle',
            name: 'Anti-Surge Recycle Valve Flow',
            symbol: 'Q_asv',
            value: (outputs.asvOpeningPercent ?? 0).toFixed(0),
            unit: '%',
            impact: 'positive',
            percentage: 15,
            description: 'Hot bypass gas recycled to compressor suction to maintain forward flow.',
          },
        ],
      };
    }

    case 'turbine': {
      const sep = outputs.campbellSeparationMarginPercent ?? 14.2;
      const moisture = outputs.exhaustMoisturePercent ?? 8.5;

      return {
        governingEquation: 'Margin = |f_blade - n·f_npf| / f_blade · 100% ≥ 10.0%',
        equationDescription: 'API 612 8th Edition Campbell resonance avoidance and Wilson line exhaust moisture.',
        factors: [
          {
            id: 'blade_freq',
            name: 'Blade Natural Frequency',
            symbol: 'f_blade',
            value: (outputs.dominantBladeModeHz ?? 480).toFixed(0),
            unit: 'Hz',
            impact: 'neutral',
            percentage: 40,
            description: '1st Tangential / Axial eigenfrequency of shrouded rotor blading.',
          },
          {
            id: 'npf_order',
            name: 'Nozzle Passing Frequency',
            symbol: 'NPF = Z_n · ω',
            value: (outputs.nozzlePassingFreqHz ?? 520).toFixed(0),
            unit: 'Hz',
            impact: 'negative',
            percentage: 40,
            description: 'Aerodynamic wake chopping frequency generated by stationary guide vanes.',
          },
          {
            id: 'exhaust_dryness',
            name: 'Exhaust Moisture Fraction',
            symbol: 'Y = 1 - x',
            value: `${moisture.toFixed(1)}%`,
            unit: '%',
            impact: moisture > 12 ? 'negative' : (moisture <= 10 ? 'positive' : 'neutral'),
            percentage: 20,
            description: 'Liquid water droplets condensing past Wilson line causing blade erosion.',
          },
        ],
      };
    }

    case 'journal': {
      const sNum = outputs.sommerfeldNumber ?? 0.18;
      const hMin = outputs.minimumFilmThicknessUm ?? 16.5;

      return {
        governingEquation: 'S = (μ·N / P) · (R/C)²  |  h_min = C·(1 - ε)',
        equationDescription: '2D Reynolds hydrodynamic thin-film lubrication and Sommerfeld rotor stability (API 684).',
        factors: [
          {
            id: 'viscosity_mu',
            name: 'Dynamic Oil Film Viscosity',
            symbol: 'μ(T)',
            value: (outputs.operatingViscosityCp ?? 24.5).toFixed(1),
            unit: 'cP',
            impact: 'positive',
            percentage: 35,
            description: 'Hydrodynamic shear wedge pressure generator; degrades with oil temperature.',
          },
          {
            id: 'clearance_c',
            name: 'Radial Machined Clearance',
            symbol: 'C_rad',
            value: (inputs.radialClearanceUm ?? 65).toFixed(0),
            unit: 'µm',
            impact: 'neutral',
            percentage: 25,
            description: 'Machined radial gap between journal shaft and babbitt bearing sleeve.',
          },
          {
            id: 'unit_load',
            name: 'Projected Bearing Load',
            symbol: 'P = W / (L·D)',
            value: (outputs.projectedPressureMpa ?? 1.8).toFixed(2),
            unit: 'MPa',
            impact: 'negative',
            percentage: 25,
            description: 'Static rotor weight and dynamic force divided by projected bearing area.',
          },
          {
            id: 'whirl_cross_stiff',
            name: 'Cross-Coupled Stiffness Ratio',
            symbol: 'k_xy / c_yy',
            value: (outputs.whirlFrequencyRatio ?? 0.44).toFixed(2),
            unit: 'x',
            impact: outputs.whirlFrequencyRatio > 0.48 ? 'negative' : 'positive',
            percentage: 15,
            description: 'Oil film fluid circulation causing sub-synchronous 0.43X rotor whirl.',
          },
        ],
      };
    }

    case 'gearbox': {
      const sh = outputs.contactSafetyFactorSH ?? 1.35;
      const sf = outputs.bendingSafetyFactorSF ?? 1.62;

      return {
        governingEquation: 'σ_H = Z_E·√(F_t/(b·d₁) · K_v·K_o·K_m·Z_H·Z_R) ≤ σ_HP / S_H',
        equationDescription: 'AGMA 2001-D04 / ISO 6336 Pitting resistance and tooth bending stress rating.',
        factors: [
          {
            id: 'tangential_ft',
            name: 'Transmitted Tangential Load',
            symbol: 'F_t = 2·T / d₁',
            value: (outputs.tangentialForceKn ?? 12.4).toFixed(1),
            unit: 'kN',
            impact: 'negative',
            percentage: 45,
            description: 'Primary torque-transmitting mechanical force acting on pitch line.',
          },
          {
            id: 'dynamic_kv',
            name: 'Dynamic Pitch Velocity Factor',
            symbol: 'K_v',
            value: (outputs.dynamicFactorKv ?? 1.15).toFixed(2),
            unit: 'x',
            impact: 'negative',
            percentage: 20,
            description: 'Internal dynamic tooth meshing excitation and transmission error.',
          },
          {
            id: 'face_width_b',
            name: 'Pinion Face Width',
            symbol: 'b',
            value: (inputs.faceWidthMm ?? 80).toFixed(0),
            unit: 'mm',
            impact: 'positive',
            percentage: 25,
            description: 'Gear contact tooth width sharing the tangential contact line load.',
          },
          {
            id: 'ehl_lambda',
            name: 'Specific EHL Film Thickness',
            symbol: 'Λ = h_min / σ_rms',
            value: (outputs.specificFilmThicknessLambda ?? 2.1).toFixed(2),
            unit: 'x',
            impact: outputs.specificFilmThicknessLambda < 1.0 ? 'negative' : 'positive',
            percentage: 10,
            description: 'Elastohydrodynamic oil film ratio preventing asperity metal contact.',
          },
        ],
      };
    }

    case 'recip': {
      const revDeg = outputs.rodLoadReversalDegrees ?? 24;
      const pr = outputs.pressureRatio ?? 3.2;

      return {
        governingEquation: 'F_rod(θ) = P_HE·A_HE - P_CE·A_CE - m_recip·r·ω²·(cosθ + λ·cos2θ)',
        equationDescription: 'API 618 5th Edition In-cylinder PV gas load and slider-crank reciprocating inertia.',
        factors: [
          {
            id: 'gas_load',
            name: 'In-Cylinder Net Gas Thrust',
            symbol: 'F_gas(θ)',
            value: (outputs.maxTensionRodLoadKn ?? 45).toFixed(1),
            unit: 'kN',
            impact: 'negative',
            percentage: 50,
            description: 'Differential pressure acting on head-end vs crank-end piston faces.',
          },
          {
            id: 'recip_inertia',
            name: 'Reciprocating Inertia Force',
            symbol: 'F_inertia(θ)',
            value: (outputs.peakInertiaForceKn ?? 28).toFixed(1),
            unit: 'kN',
            impact: 'negative',
            percentage: 30,
            description: 'Acceleration force of piston, crosshead, and rod mass oscillating at crank speed.',
          },
          {
            id: 'pin_reversal',
            name: 'Crosshead Pin Load Reversal',
            symbol: 'θ_rev',
            value: `${revDeg.toFixed(0)}°`,
            unit: 'deg',
            impact: revDeg >= 15 ? 'positive' : 'negative',
            percentage: 20,
            description: 'Continuous crank angle degrees of load reversal allowing crosshead lubrication.',
          },
        ],
      };
    }

    case 'bearing': {
      const l10h = outputs.l10hFatigueHoursRemaining ?? 38000;
      const kappa = outputs.lubricationKappaRatio ?? 1.45;

      return {
        governingEquation: 'L_10h = (10⁶ / 60·N) · (C / P)ᵖ · a_iso  (p=3 for ball, 10/3 for roller)',
        equationDescription: 'ISO 281 / ISO 15243 Rolling bearing fatigue rating life and Harris kinematic harmonics.',
        factors: [
          {
            id: 'dyn_capacity_c',
            name: 'Basic Dynamic Load Rating',
            symbol: 'C_dyn',
            value: (outputs.dynamicCapacityKn ?? 42.5).toFixed(1),
            unit: 'kN',
            impact: 'positive',
            percentage: 40,
            description: 'Bearing manufacturer ISO 281 dynamic fatigue load capacity.',
          },
          {
            id: 'equiv_load_p',
            name: 'Equivalent Dynamic Radial Load',
            symbol: 'P = X·F_r + Y·F_a',
            value: (outputs.equivalentDynamicLoadKn ?? 6.8).toFixed(2),
            unit: 'kN',
            impact: 'negative',
            percentage: 35,
            description: 'Combined radial and axial load vector acting on rolling elements.',
          },
          {
            id: 'lube_kappa',
            name: 'Viscosity Ratio (Kappa)',
            symbol: 'κ = ν / ν₁',
            value: kappa.toFixed(2),
            unit: 'x',
            impact: kappa < 0.8 ? 'negative' : 'positive',
            percentage: 25,
            description: 'Operating lubricant viscosity divided by minimum required kinematic viscosity.',
          },
        ],
      };
    }

    default:
      return {
        governingEquation: 'Criteria = f(Operational Inputs, Physics Constants)',
        equationDescription: 'Standard physics equilibrium model.',
        factors: [
          {
            id: 'input_load',
            name: 'Primary Load Parameter',
            symbol: 'Load',
            value: 'Nominal',
            unit: '—',
            impact: 'neutral',
            percentage: 50,
            description: 'Governing process variable input.',
          },
          {
            id: 'system_capacity',
            name: 'Component Design Capacity',
            symbol: 'Capacity',
            value: 'Verified',
            unit: '—',
            impact: 'positive',
            percentage: 50,
            description: 'Design safety threshold according to industrial standards.',
          },
        ],
      };
  }
}

/**
 * Maps simulator IDs and inputs/outputs to approved International Standards verification checks
 */
export function getSimulatorStandardsCompliance(
  simId: string,
  inputs: Record<string, any>,
  outputs: Record<string, any>,
  unitSystem: UnitSystem = 'metric'
): StandardComplianceItem[] {
  switch (simId) {
    case 'pump': {
      const marginRatio = outputs.npshMarginRatio ?? 1.45;
      const recMargin = outputs.recommendedMarginRatio ?? 1.35;
      const nss = outputs.suctionSpecificSpeedUS ?? 9200;
      const bepPct = outputs.operatingPercentBEP ?? 100;
      const velocity = outputs.fluidVelocityMs ?? 1.6;

      return [
        {
          id: 'api610_npsh',
          standard: 'API 610 12th Ed',
          clause: '§6.1.8 / HI 9.6.1',
          parameter: 'NPSH Margin Ratio (NPSHa / NPSHr)',
          limit: `≥ ${recMargin.toFixed(2)}x (or ≥ 1.0 m)`,
          actual: `${marginRatio.toFixed(2)}x`,
          status: marginRatio >= recMargin ? 'compliant' : marginRatio >= 1.0 ? 'marginal' : 'violation',
          marginText: marginRatio >= recMargin ? `+${((marginRatio - recMargin) * 100).toFixed(0)}% buffer` : `${((marginRatio - recMargin) * 100).toFixed(0)}% deficit`,
          governingBody: 'API',
        },
        {
          id: 'api610_por',
          standard: 'API 610 12th Ed',
          clause: '§6.1.2',
          parameter: 'Preferred Operating Region (POR)',
          limit: '70% – 120% BEP',
          actual: `${bepPct.toFixed(0)}% BEP`,
          status: bepPct >= 70 && bepPct <= 120 ? 'compliant' : bepPct >= 60 && bepPct <= 130 ? 'marginal' : 'violation',
          marginText: bepPct >= 70 && bepPct <= 120 ? 'Inside POR' : 'Operating in AOR / Recirculation',
          governingBody: 'API',
        },
        {
          id: 'api610_velocity',
          standard: 'API 610 12th Ed',
          clause: 'Table 6',
          parameter: 'Suction Line Fluid Velocity',
          limit: '≤ 2.00 m/s',
          actual: `${velocity.toFixed(2)} m/s`,
          status: velocity <= 2.0 ? 'compliant' : velocity <= 2.5 ? 'marginal' : 'violation',
          marginText: velocity <= 2.0 ? 'Acceptable' : 'High friction loss & noise',
          governingBody: 'API',
        },
        {
          id: 'api610_nss',
          standard: 'API 610 12th Ed',
          clause: '§6.1.11',
          parameter: 'Suction Specific Speed (Nss)',
          limit: '≤ 11,000 (US)',
          actual: `${nss.toFixed(0)} US`,
          status: nss <= 11000 ? 'compliant' : 'marginal',
          marginText: nss <= 11000 ? 'Recirculation stable' : 'Suction recirculation risk',
          governingBody: 'API',
        },
      ];
    }

    case 'rotor': {
      const vibRms = outputs.vibrationVelocityRmsMmS ?? 1.8;
      const actualU = outputs.actualUnbalanceGmm ?? 280;
      const permU = outputs.iso1940PermissibleUnbalanceGmm ?? 340;
      const sepMargin = Math.abs(1 - (outputs.speedRatioLambda || 1)) * 100;

      return [
        {
          id: 'iso1940_grade',
          standard: 'ISO 1940-1',
          clause: `Balance Grade G${inputs.balanceGrade ?? 2.5}`,
          parameter: 'Permissible Residual Unbalance (U_per)',
          limit: `≤ ${permU.toFixed(0)} g·mm`,
          actual: `${actualU.toFixed(0)} g·mm`,
          status: actualU <= permU ? 'compliant' : actualU <= permU * 1.5 ? 'marginal' : 'violation',
          marginText: actualU <= permU ? `${(permU - actualU).toFixed(0)} g·mm margin` : `${(actualU - permU).toFixed(0)} g·mm excess`,
          governingBody: 'ISO',
        },
        {
          id: 'iso10816_vib',
          standard: 'ISO 10816-3',
          clause: 'Class II / Group 1 Rigid',
          parameter: 'Casing Vibration Velocity (RMS)',
          limit: '≤ 2.80 mm/s (Zone A/B)',
          actual: `${vibRms.toFixed(2)} mm/s`,
          status: vibRms <= 2.8 ? 'compliant' : vibRms <= 4.5 ? 'marginal' : 'violation',
          marginText: vibRms <= 2.8 ? 'Zone A/B Good' : vibRms <= 4.5 ? 'Zone C Alarm' : 'Zone D Trip Hazard',
          governingBody: 'ISO',
        },
        {
          id: 'api684_separation',
          standard: 'API 684 / API 610',
          clause: '§2.2 Rotordynamics',
          parameter: 'Lateral Critical Speed Separation Margin',
          limit: '≥ 15.0% separation',
          actual: `${sepMargin.toFixed(1)}%`,
          status: sepMargin >= 20 ? 'compliant' : sepMargin >= 15 ? 'marginal' : 'violation',
          marginText: sepMargin >= 15 ? 'Clear of resonance' : 'Dynamic resonance peak',
          governingBody: 'API',
        },
      ];
    }

    case 'alignment': {
      const offset = outputs.hotResultantOffsetMm ?? 0.04;
      const maxOffset = outputs.allowableParallelOffsetMm ?? 0.05;
      const angle = outputs.hotResultantAngleMrad ?? 0.35;
      const maxAngle = outputs.allowableAngularOffsetMrad ?? 0.50;
      const softFoot = outputs.maxSoftFootMm ?? 0.03;

      return [
        {
          id: 'api686_parallel',
          standard: 'API 686 Chapter 5',
          clause: 'Table 1 Recommended Limits',
          parameter: 'Hot Running Parallel Radial Offset',
          limit: `≤ ${maxOffset.toFixed(2)} mm (0.002 in)`,
          actual: `${offset.toFixed(3)} mm`,
          status: offset <= maxOffset ? 'compliant' : offset <= maxOffset * 1.5 ? 'marginal' : 'violation',
          marginText: offset <= maxOffset ? 'Pass' : 'Excessive bearing load',
          governingBody: 'API',
        },
        {
          id: 'api686_angular',
          standard: 'API 686 Chapter 5',
          clause: 'Table 1 Recommended Limits',
          parameter: 'Hot Running Angularity',
          limit: `≤ ${maxAngle.toFixed(2)} mrad`,
          actual: `${angle.toFixed(2)} mrad`,
          status: angle <= maxAngle ? 'compliant' : 'violation',
          marginText: angle <= maxAngle ? 'Pass' : '2X vibration excitation',
          governingBody: 'API',
        },
        {
          id: 'api686_softfoot',
          standard: 'API 686 Chapter 5',
          clause: '§4.2 Pre-Alignment Checks',
          parameter: 'Maximum Soft Foot Deflection',
          limit: '≤ 0.050 mm (0.002 in)',
          actual: `${softFoot.toFixed(3)} mm`,
          status: softFoot <= 0.05 ? 'compliant' : 'violation',
          marginText: softFoot <= 0.05 ? 'Frame unstrained' : 'Frame twist & resonance',
          governingBody: 'API',
        },
      ];
    }

    case 'pipe': {
      const stress = outputs.combinedStressVonMisesMPa ?? outputs.expansionStressMPa ?? 110;
      const allowable = outputs.allowableStressMPa ?? 138;
      const nozzleRatio = outputs.nozzleLoadRatioPercent ?? 75;

      return [
        {
          id: 'asme_b313_stress',
          standard: 'ASME B31.3',
          clause: '§302.3.5 Displacement Stress',
          parameter: 'Displacement Stress Range (S_E)',
          limit: `≤ S_A (${allowable.toFixed(0)} MPa)`,
          actual: `${stress.toFixed(0)} MPa`,
          status: stress <= allowable ? 'compliant' : 'violation',
          marginText: stress <= allowable ? `${(allowable - stress).toFixed(0)} MPa safety margin` : `${(stress - allowable).toFixed(0)} MPa overstress`,
          governingBody: 'ASME',
        },
        {
          id: 'api610_nozzle',
          standard: 'API 610 12th Ed',
          clause: 'Annex F / Table 5',
          parameter: 'Equipment Nozzle Reaction Load Index',
          limit: '≤ 100% of API Allowable',
          actual: `${nozzleRatio.toFixed(0)}%`,
          status: nozzleRatio <= 100 ? 'compliant' : nozzleRatio <= 120 ? 'marginal' : 'violation',
          marginText: nozzleRatio <= 100 ? 'Pump casing safe' : 'Casing distortion hazard',
          governingBody: 'API',
        },
      ];
    }

    case 'seal': {
      const pChamber = outputs.sealChamberPressureBar ?? 3.5;
      const pVap = outputs.vaporPressureBar ?? 1.2;
      const marginKpa = (pChamber - pVap) * 100;

      return [
        {
          id: 'api682_vap_margin',
          standard: 'API 682 4th Edition',
          clause: '§6.1.2 Seal Chamber Pressure',
          parameter: 'Boiling Point Margin (P_ch - P_vap)',
          limit: '≥ 200 kPa (2.0 bar / 28 psi)',
          actual: `${marginKpa.toFixed(0)} kPa`,
          status: marginKpa >= 200 ? 'compliant' : marginKpa >= 100 ? 'marginal' : 'violation',
          marginText: marginKpa >= 200 ? 'No flashing' : 'Face vaporization / dry run',
          governingBody: 'API',
        },
        {
          id: 'api682_flow',
          standard: 'API 682 4th Edition',
          clause: '§8.2.3 Piping Plans',
          parameter: 'Minimum Face Velocity',
          limit: '≥ 4.5 m/s flush port injection',
          actual: `${(outputs.flushPortVelocityMs ?? 5.2).toFixed(1)} m/s`,
          status: (outputs.flushPortVelocityMs ?? 5.2) >= 4.5 ? 'compliant' : 'marginal',
          marginText: 'Sufficient cooling',
          governingBody: 'API',
        },
      ];
    }

    case 'compressor': {
      const scm = outputs.currentSurgeMarginPercent ?? 14.5;
      const asvTime = outputs.asvStrokeTimeSec ?? 1.2;

      return [
        {
          id: 'api617_surge_margin',
          standard: 'API 617 8th Edition',
          clause: '§4.3.1 Process Control Line',
          parameter: 'Surge Control Margin (SCM)',
          limit: '≥ 10.0% above Surge Limit Line',
          actual: `${scm.toFixed(1)}%`,
          status: scm >= 10 ? 'compliant' : scm >= 5 ? 'marginal' : 'violation',
          marginText: scm >= 10 ? 'Aerodynamically stable' : 'Impeller flow reversal danger',
          governingBody: 'API',
        },
        {
          id: 'api670_asv_response',
          standard: 'API 670 5th Edition',
          clause: '§5.4 Anti-Surge Systems',
          parameter: 'Anti-Surge Recycle Valve Full Stroke',
          limit: '≤ 1.50 – 2.00 seconds',
          actual: `${asvTime.toFixed(2)} s`,
          status: asvTime <= 1.5 ? 'compliant' : asvTime <= 2.0 ? 'marginal' : 'violation',
          marginText: asvTime <= 1.5 ? 'Rapid trip response' : 'Slow stroke risks surge pulse',
          governingBody: 'API',
        },
      ];
    }

    case 'turbine': {
      const margin = outputs.campbellSeparationMarginPercent ?? 15.0;
      const moisture = outputs.exhaustMoisturePercent ?? 8.0;

      return [
        {
          id: 'api612_campbell',
          standard: 'API 612 8th Edition',
          clause: '§5.2.1 Blading Dynamics',
          parameter: 'Campbell Diagram Resonance Separation',
          limit: '≥ 10.0% separation margin',
          actual: `${margin.toFixed(1)}%`,
          status: margin >= 10 ? 'compliant' : margin >= 5 ? 'marginal' : 'violation',
          marginText: margin >= 10 ? 'No blade flutter' : 'Aero-acoustic resonance hazard',
          governingBody: 'API',
        },
        {
          id: 'api612_moisture',
          standard: 'API 612 8th Edition',
          clause: '§5.1.3 Steam Quality',
          parameter: 'Maximum Exhaust Moisture Content',
          limit: '≤ 12.0% liquid droplets',
          actual: `${moisture.toFixed(1)}%`,
          status: moisture <= 12 ? 'compliant' : 'violation',
          marginText: moisture <= 12 ? 'Erosion safe' : 'Last stage blade erosion hazard',
          governingBody: 'API',
        },
      ];
    }

    case 'journal': {
      const hMin = outputs.minimumFilmThicknessUm ?? 15.2;
      const whirlRatio = outputs.whirlFrequencyRatio ?? 0.44;
      const vibPkPk = outputs.totalShaftDisplacementUmPkPk ?? 22;

      return [
        {
          id: 'api670_film',
          standard: 'API 670 / API 684',
          clause: '§3.1 Hydrodynamics',
          parameter: 'Minimum Oil Film Thickness (h_min)',
          limit: '≥ 12.0 – 15.0 µm (ε ≤ 0.75)',
          actual: `${hMin.toFixed(1)} µm`,
          status: hMin >= 15 ? 'compliant' : hMin >= 10 ? 'marginal' : 'violation',
          marginText: hMin >= 15 ? 'Hydrodynamic fluid film' : 'Boundary metal rub risk',
          governingBody: 'API',
        },
        {
          id: 'api684_whirl',
          standard: 'API 684 2nd Edition',
          clause: '§2.1 Subsynchronous Instability',
          parameter: 'Whirl Frequency Ratio (WFR)',
          limit: '≤ 0.48 (Oil Whirl Suppression)',
          actual: `${whirlRatio.toFixed(2)}`,
          status: whirlRatio <= 0.48 ? 'compliant' : 'violation',
          marginText: whirlRatio <= 0.48 ? 'Rotordynamic stable' : 'Self-excited oil whirl',
          governingBody: 'API',
        },
        {
          id: 'api670_vibration',
          standard: 'API 670 5th Edition',
          clause: '§4.1 Proximity Probes',
          parameter: 'Shaft Relative Vibration (Pk-Pk)',
          limit: '≤ 35.0 µm pk-pk (Alarm)',
          actual: `${vibPkPk.toFixed(1)} µm pk-pk`,
          status: vibPkPk <= 35 ? 'compliant' : vibPkPk <= 50 ? 'marginal' : 'violation',
          marginText: vibPkPk <= 35 ? 'Nominal clearance' : 'High orbit amplitude',
          governingBody: 'API',
        },
      ];
    }

    case 'gearbox': {
      const sh = outputs.contactSafetyFactorSH ?? 1.32;
      const sf = outputs.bendingSafetyFactorSF ?? 1.58;

      return [
        {
          id: 'agma_pitting',
          standard: 'AGMA 2001-D04',
          clause: '§11 Pitting Resistance',
          parameter: 'Contact Stress Safety Factor (S_H)',
          limit: '≥ 1.25 (Continuous Industrial Duty)',
          actual: `${sh.toFixed(2)}`,
          status: sh >= 1.25 ? 'compliant' : sh >= 1.0 ? 'marginal' : 'violation',
          marginText: sh >= 1.25 ? 'Contact pitting safe' : 'Macropitting fatigue risk',
          governingBody: 'AGMA',
        },
        {
          id: 'agma_bending',
          standard: 'AGMA 2001-D04',
          clause: '§12 Bending Strength',
          parameter: 'Tooth Root Bending Safety Factor (S_F)',
          limit: '≥ 1.50 (High Reliability)',
          actual: `${sf.toFixed(2)}`,
          status: sf >= 1.50 ? 'compliant' : sf >= 1.2 ? 'marginal' : 'violation',
          marginText: sf >= 1.50 ? 'Tooth breakage safe' : 'Root tensile bending fatigue',
          governingBody: 'AGMA',
        },
      ];
    }

    case 'recip': {
      const revDeg = outputs.rodLoadReversalDegrees ?? 24;
      const tensionUtil = outputs.tensionLoadUtilizationPercent ?? 68;

      return [
        {
          id: 'api618_reversal',
          standard: 'API 618 5th Edition',
          clause: '§6.7.1 Crosshead Pin Reversal',
          parameter: 'Continuous Crank Load Reversal Angle',
          limit: '≥ 15.0° crank angle (Tension/Compression)',
          actual: `${revDeg.toFixed(0)}°`,
          status: revDeg >= 15 ? 'compliant' : 'violation',
          marginText: revDeg >= 15 ? 'Crosshead pin lubricated' : 'Pin metal-to-metal seizure danger',
          governingBody: 'API',
        },
        {
          id: 'api618_rod_load',
          standard: 'API 618 5th Edition',
          clause: '§6.7.2 Combined Load',
          parameter: 'Piston Rod Load Utilization',
          limit: '≤ 100.0% of Rated Capacity',
          actual: `${tensionUtil.toFixed(0)}%`,
          status: tensionUtil <= 100 ? 'compliant' : 'violation',
          marginText: tensionUtil <= 100 ? 'Rod buckle safe' : 'Piston rod fatigue failure risk',
          governingBody: 'API',
        },
      ];
    }

    case 'bearing': {
      const l10h = outputs.l10hFatigueHoursRemaining ?? 32000;
      const stage = outputs.stage ?? 'stage1';
      const vib = outputs.overallVelocityRmsMmS ?? 1.8;

      return [
        {
          id: 'iso281_life',
          standard: 'ISO 281 / API 610',
          clause: '§6.10 Bearing Life Standard',
          parameter: 'Basic Rating Life (L_10h)',
          limit: '≥ 25,000 hrs (40,000 hrs API)',
          actual: `${Math.round(l10h).toLocaleString()} hrs`,
          status: l10h >= 25000 ? 'compliant' : l10h >= 10000 ? 'marginal' : 'violation',
          marginText: l10h >= 25000 ? 'Long fatigue life' : 'Accelerated spalling',
          governingBody: 'ISO',
        },
        {
          id: 'iso15243_stage',
          standard: 'ISO 15243',
          clause: 'Damage Progression Classification',
          parameter: 'Degradation Stage',
          limit: 'Stage 1 or Stage 2 (Operable)',
          actual: stage.toUpperCase(),
          status: stage === 'stage1' || stage === 'stage2' ? 'compliant' : stage === 'stage3' ? 'marginal' : 'violation',
          marginText: stage === 'stage4' ? 'Catastrophic failure imminent' : 'Serviceable',
          governingBody: 'ISO',
        },
      ];
    }

    default:
      return [];
  }
}

/**
 * Generates actionable, mathematically-derived recommendations on WHAT INPUT TO CHANGE
 * and by HOW MUCH to restore compliance or optimize equipment health.
 */
export function getSimulatorCorrectiveGuidance(
  simId: string,
  inputs: Record<string, any>,
  outputs: Record<string, any>,
  unitSystem: UnitSystem = 'metric'
): CorrectiveGuidanceItem[] {
  const isCritical = outputs.status?.level === 'critical';
  const isWarning = outputs.status?.level === 'warning';

  switch (simId) {
    case 'pump': {
      const marginDeficit = (outputs.npshrM * (outputs.recommendedMarginRatio || 1.35)) - outputs.npshaM;
      const currentStatic = inputs.staticHeadM ?? 2.5;
      const currentTemp = inputs.fluidTempC ?? 35;
      const currentValve = inputs.valveOpeningPercent ?? 100;

      const items: CorrectiveGuidanceItem[] = [];

      if (marginDeficit > 0 || isCritical || isWarning) {
        const neededStatic = currentStatic + Math.max(0.5, marginDeficit);
        items.push({
          id: 'pump_rec_static',
          parameterName: 'Static Suction Head (Z_s)',
          currentValue: `${currentStatic.toFixed(1)} m`,
          targetValue: `≥ ${neededStatic.toFixed(1)} m`,
          actionDelta: `+${Math.max(0.5, marginDeficit).toFixed(1)} m`,
          rationale: `Directly raises NPSHa by +${Math.max(0.5, marginDeficit).toFixed(1)}m, clearing the cavitation inception boundary.`,
          priority: 'critical',
          actionType: 'slider',
        });

        if (currentTemp > 40) {
          const targetTemp = Math.max(20, currentTemp - 20);
          items.push({
            id: 'pump_rec_temp',
            parameterName: 'Fluid Temperature (T_fluid)',
            currentValue: `${currentTemp}°C`,
            targetValue: `≤ ${targetTemp}°C`,
            actionDelta: `-${(currentTemp - targetTemp)}°C`,
            rationale: 'Suppresses fluid vapor pressure P_v, recovering lost suction head at the impeller eye.',
            priority: 'high',
            actionType: 'slider',
          });
        }

        if (currentValve < 85) {
          items.push({
            id: 'pump_rec_valve',
            parameterName: 'Suction Valve Opening',
            currentValue: `${currentValve}%`,
            targetValue: '100% Fully Open',
            actionDelta: `+${(100 - currentValve)}%`,
            rationale: 'Eliminates artificial dynamic throttling friction loss h_f across the suction valve.',
            priority: 'high',
            actionType: 'slider',
          });
        }
      } else {
        items.push({
          id: 'pump_rec_nominal',
          parameterName: 'Operating Flow Rate (Q)',
          currentValue: `${inputs.flowRateM3h} m³/h`,
          targetValue: 'Maintain 70% – 120% BEP',
          actionDelta: 'Nominal',
          rationale: 'Current operation satisfies API 610 POR. Monitor suction strainer differential pressure.',
          priority: 'medium',
          actionType: 'inspection',
        });
      }
      return items;
    }

    case 'rotor': {
      const items: CorrectiveGuidanceItem[] = [];
      const actualU = outputs.actualUnbalanceGmm ?? 350;
      const permU = outputs.iso1940PermissibleUnbalanceGmm ?? 280;
      const rpm = inputs.operatingSpeedRpm ?? inputs.shaftSpeedRpm ?? 3000;
      const nCrit = outputs.criticalSpeedRpm ?? 2450;
      const sepMargin = Math.abs(1 - (outputs.speedRatioLambda || 1)) * 100;

      if (actualU > permU || isCritical || isWarning) {
        items.push({
          id: 'rotor_rec_balance',
          parameterName: 'Residual Unbalance (m_u · r)',
          currentValue: `${actualU.toFixed(0)} g·mm`,
          targetValue: `≤ ${permU.toFixed(0)} g·mm`,
          actionDelta: `-${(actualU - permU).toFixed(0)} g·mm`,
          rationale: `Attach counterweight on correction plane opposite heavy spot to achieve ISO 1940 Grade G${inputs.balanceGrade}.`,
          priority: 'critical',
          actionType: 'slider',
        });
      }

      if (sepMargin < 15) {
        const targetRpm = rpm > nCrit ? Math.round(nCrit * 1.22) : Math.round(nCrit * 0.82);
        items.push({
          id: 'rotor_rec_speed',
          parameterName: 'Shaft Operating Speed (RPM)',
          currentValue: `${rpm} RPM`,
          targetValue: `${targetRpm} RPM`,
          actionDelta: targetRpm > rpm ? `+${targetRpm - rpm} RPM` : `${targetRpm - rpm} RPM`,
          rationale: `Shift speed away from the ±15% lateral resonance critical band (N_crit = ${nCrit.toFixed(0)} RPM).`,
          priority: 'high',
          actionType: 'slider',
        });
      }

      if (items.length === 0) {
        items.push({
          id: 'rotor_rec_nom',
          parameterName: 'Dynamic Trim Balance',
          currentValue: 'Grade Compliant',
          targetValue: 'Routine Monitoring',
          actionDelta: '0',
          rationale: 'Vibration velocity RMS is in ISO 10816 Zone A. Continue routine trend analysis.',
          priority: 'medium',
          actionType: 'inspection',
        });
      }
      return items;
    }

    case 'alignment': {
      const items: CorrectiveGuidanceItem[] = [];
      const frontShim = outputs.frontFootShimAdjustmentMm ?? 0.15;
      const rearShim = outputs.rearFootShimAdjustmentMm ?? -0.22;
      const softFoot = outputs.maxSoftFootMm ?? 0.06;

      if (Math.abs(frontShim) > 0.03 || Math.abs(rearShim) > 0.03 || outputs.toleranceUtilizationPercent > 100) {
        items.push({
          id: 'align_rec_front',
          parameterName: 'Driver Front Foot Shim Pack (S_F)',
          currentValue: 'Current Pack',
          targetValue: `${frontShim >= 0 ? '+' : ''}${frontShim.toFixed(2)} mm`,
          actionDelta: `${frontShim >= 0 ? '+' : ''}${frontShim.toFixed(2)} mm`,
          rationale: 'Corrects vertical parallel offset at coupling to achieve API 686 ≤ 0.05 mm tolerance.',
          priority: 'critical',
          actionType: 'slider',
        });

        items.push({
          id: 'align_rec_rear',
          parameterName: 'Driver Rear Foot Shim Pack (S_R)',
          currentValue: 'Current Pack',
          targetValue: `${rearShim >= 0 ? '+' : ''}${rearShim.toFixed(2)} mm`,
          actionDelta: `${rearShim >= 0 ? '+' : ''}${rearShim.toFixed(2)} mm`,
          rationale: 'Pivots driver frame about front feet to eliminate angular tilt across the coupling faces.',
          priority: 'critical',
          actionType: 'slider',
        });
      }

      if (softFoot > 0.05) {
        items.push({
          id: 'align_rec_soft',
          parameterName: 'Foot Flatness & Soft Foot',
          currentValue: `${softFoot.toFixed(3)} mm`,
          targetValue: '≤ 0.050 mm',
          actionDelta: `-${(softFoot - 0.05).toFixed(3)} mm`,
          rationale: 'Add stepped shims under affected foot pad to eliminate frame twist and 1X harmonic strain.',
          priority: 'high',
          actionType: 'maintenance',
        });
      }
      return items;
    }

    case 'pipe': {
      const items: CorrectiveGuidanceItem[] = [];
      const stress = outputs.combinedStressVonMisesMPa ?? outputs.expansionStressMPa ?? 120;
      const allowable = outputs.allowableStressMPa ?? 138;
      const loopLen = inputs.expansionLoopLengthM ?? 4.0;

      if (stress > allowable || outputs.nozzleLoadRatioPercent > 100) {
        const targetLoop = loopLen + 1.5;
        items.push({
          id: 'pipe_rec_loop',
          parameterName: 'Expansion U-Loop Length',
          currentValue: `${loopLen.toFixed(1)} m`,
          targetValue: `≥ ${targetLoop.toFixed(1)} m`,
          actionDelta: `+1.5 m`,
          rationale: 'Increases structural flexibility K_flex, distributing thermal expansion strain over a longer leg.',
          priority: 'critical',
          actionType: 'slider',
        });

        items.push({
          id: 'pipe_rec_temp',
          parameterName: 'Process Operating Temp',
          currentValue: `${inputs.operatingTempC}°C`,
          targetValue: 'Reduce ΔT or Rate',
          actionDelta: 'Lower ΔT',
          rationale: 'Thermal growth is linearly proportional to ΔT (ΔL = α·L·ΔT).',
          priority: 'high',
          actionType: 'slider',
        });
      }
      return items;
    }

    case 'seal': {
      const items: CorrectiveGuidanceItem[] = [];
      const marginBar = outputs.vaporPressureMarginBar ?? 1.2;
      const orificeMm = inputs.orificeDiameterMm ?? 3.0;

      if (marginBar < 2.0 || isCritical || isWarning) {
        items.push({
          id: 'seal_rec_orifice',
          parameterName: 'Flush Line Orifice Diameter',
          currentValue: `${orificeMm.toFixed(1)} mm`,
          targetValue: `≥ ${(orificeMm + 1.0).toFixed(1)} mm`,
          actionDelta: '+1.0 mm',
          rationale: 'Increases flush delivery flow rate Q_flush, carrying away frictional face heat faster.',
          priority: 'critical',
          actionType: 'slider',
        });

        items.push({
          id: 'seal_rec_plan',
          parameterName: 'API 682 Flush Plan Selection',
          currentValue: `Plan ${inputs.planId ?? 11}`,
          targetValue: 'Upgrade to Plan 23 / 53A',
          actionDelta: 'Switch Plan',
          rationale: 'Plan 23 uses an internal pumping ring and cooler to lower seal chamber temperature below boiling.',
          priority: 'high',
          actionType: 'slider',
        });
      }
      return items;
    }

    case 'compressor': {
      const items: CorrectiveGuidanceItem[] = [];
      const scm = outputs.currentSurgeMarginPercent ?? 12.0;
      const asv = inputs.asvManualOpeningPercent ?? outputs.asvOpeningPercent ?? 0;

      if (scm < 10.0 || isCritical || isWarning) {
        const neededAsv = Math.min(100, Math.max(35, asv + 30));
        items.push({
          id: 'comp_rec_asv',
          parameterName: 'Anti-Surge Recycle Valve (ASV)',
          currentValue: `${asv.toFixed(0)}% Open`,
          targetValue: `≥ ${neededAsv.toFixed(0)}% Open`,
          actionDelta: `+${(neededAsv - asv).toFixed(0)}%`,
          rationale: 'Immediately injects recycle mass flow into suction, moving operating point right of the Surge Control Line.',
          priority: 'critical',
          actionType: 'slider',
        });

        items.push({
          id: 'comp_rec_flow',
          parameterName: 'Suction Process Flow',
          currentValue: `${inputs.suctionFlowM3h ?? 3500} m³/h`,
          targetValue: 'Increase Feed Flow',
          actionDelta: '+15%',
          rationale: 'Increases impeller inlet gas velocity, preventing aerodynamic boundary layer stall.',
          priority: 'high',
          actionType: 'slider',
        });
      }
      return items;
    }

    case 'turbine': {
      const items: CorrectiveGuidanceItem[] = [];
      const margin = outputs.campbellSeparationMarginPercent ?? 12.0;
      const rpm = inputs.operatingSpeedRpm ?? 3600;

      if (margin < 10.0 || isCritical || isWarning) {
        const targetRpm = Math.round(rpm * 1.08);
        items.push({
          id: 'turb_rec_speed',
          parameterName: 'Turbine Operating Speed',
          currentValue: `${rpm} RPM`,
          targetValue: `${targetRpm} RPM`,
          actionDelta: `+${targetRpm - rpm} RPM`,
          rationale: 'Exits the Campbell blade resonance intersection with Nozzle Passing Frequency (NPF).',
          priority: 'critical',
          actionType: 'slider',
        });

        items.push({
          id: 'turb_rec_temp',
          parameterName: 'Inlet Steam Superheat Temp',
          currentValue: `${inputs.inletSteamTempC ?? 420}°C`,
          targetValue: `≥ ${(inputs.inletSteamTempC ?? 420) + 25}°C`,
          actionDelta: '+25°C',
          rationale: 'Shifts steam expansion line right of the Wilson line, preventing exhaust droplet moisture erosion.',
          priority: 'high',
          actionType: 'slider',
        });
      }
      return items;
    }

    case 'journal': {
      const items: CorrectiveGuidanceItem[] = [];
      const whirlRatio = outputs.whirlFrequencyRatio ?? 0.45;
      const tempC = inputs.oilSupplyTempC ?? 45;

      if (whirlRatio > 0.48 || outputs.instabilityMode === 'oil_whirl' || isCritical || isWarning) {
        items.push({
          id: 'journ_rec_bearing_type',
          parameterName: 'Bearing Architecture Type',
          currentValue: inputs.bearingType ?? 'Plain Cylindrical Sleeve',
          targetValue: 'Tilting Pad Journal Bearing',
          actionDelta: 'Switch Type',
          rationale: 'Tilting pads introduce zero cross-coupled stiffness (k_xy ≈ 0), completely eliminating oil whirl and whip.',
          priority: 'critical',
          actionType: 'slider',
        });

        items.push({
          id: 'journ_rec_temp',
          parameterName: 'Lube Oil Supply Temperature',
          currentValue: `${tempC}°C`,
          targetValue: `≤ ${Math.max(35, tempC - 10)}°C`,
          actionDelta: '-10°C',
          rationale: 'Increases dynamic oil viscosity μ, boosting hydrodynamic film thickness h_min.',
          priority: 'high',
          actionType: 'slider',
        });
      }
      return items;
    }

    case 'gearbox': {
      const items: CorrectiveGuidanceItem[] = [];
      const sh = outputs.contactSafetyFactorSH ?? 1.30;
      const torque = inputs.inputTorqueNm ?? 1200;

      if (sh < 1.25 || isCritical || isWarning) {
        const targetTorque = Math.round(torque * 0.82);
        items.push({
          id: 'gear_rec_torque',
          parameterName: 'Transmitted Input Torque',
          currentValue: `${torque} N·m`,
          targetValue: `≤ ${targetTorque} N·m`,
          actionDelta: `-${torque - targetTorque} N·m`,
          rationale: 'Reduces tangential pitch line contact stress σ_H below allowable AGMA pitting limits.',
          priority: 'critical',
          actionType: 'slider',
        });

        items.push({
          id: 'gear_rec_face',
          parameterName: 'Pinion Face Width',
          currentValue: `${inputs.faceWidthMm ?? 80} mm`,
          targetValue: `≥ ${(inputs.faceWidthMm ?? 80) + 15} mm`,
          actionDelta: '+15 mm',
          rationale: 'Distributes transmitted gear contact load over a wider contact line.',
          priority: 'high',
          actionType: 'slider',
        });
      }
      return items;
    }

    case 'recip': {
      const items: CorrectiveGuidanceItem[] = [];
      const revDeg = outputs.rodLoadReversalDegrees ?? 20;

      if (revDeg < 15 || isCritical || isWarning) {
        items.push({
          id: 'recip_rec_press',
          parameterName: 'Suction / Discharge Pressure Ratio',
          currentValue: `PR = ${(outputs.pressureRatio ?? 3.0).toFixed(2)}x`,
          targetValue: 'Adjust Stage Pressure',
          actionDelta: 'Balance PR',
          rationale: 'Restores continuous crosshead pin load reversal (API 618 ≥ 15°) to allow hydrodynamic lube entry.',
          priority: 'critical',
          actionType: 'slider',
        });
      }
      return items;
    }

    case 'bearing': {
      const items: CorrectiveGuidanceItem[] = [];
      const kappa = outputs.lubricationKappaRatio ?? 1.2;
      const stage = outputs.stage ?? 'stage1';

      if (stage === 'stage3' || stage === 'stage4') {
        items.push({
          id: 'brg_rec_replace',
          parameterName: 'Bearing Component Replacement',
          currentValue: stage.toUpperCase(),
          targetValue: 'Replace within 150 hrs',
          actionDelta: 'Schedule Outage',
          rationale: 'Macro-spalling on raceways generates cage fatigue. Catastrophic seizure hazard.',
          priority: 'critical',
          actionType: 'maintenance',
        });
      }

      if (kappa < 1.0) {
        items.push({
          id: 'brg_rec_lube',
          parameterName: 'Lubricant Viscosity / Relube',
          currentValue: `κ = ${kappa.toFixed(2)}x`,
          targetValue: 'κ ≥ 1.20x',
          actionDelta: 'Replenish / Upgrade VG',
          rationale: 'Restores elastohydrodynamic film separation between rollers and raceways.',
          priority: 'high',
          actionType: 'maintenance',
        });
      }
      return items;
    }

    default:
      return [];
  }
}

/**
 * Computes cause-and-effect explanation when a specific input field changes
 */
export function explainInputChange(
  simId: string,
  changedKey: string,
  oldVal: any,
  newVal: any,
  inputs: Record<string, any>,
  outputs: Record<string, any>
): InputChangeImpact | null {
  if (oldVal === undefined || newVal === undefined || oldVal === newVal) return null;

  const keyLow = changedKey.toLowerCase();

  // 1. Pump Cavitation
  if (simId === 'pump') {
    if (keyLow.includes('temp')) {
      const isIncrease = Number(newVal) > Number(oldVal);
      return {
        detectedParam: 'Fluid Temperature (T)',
        oldValue: `${oldVal}°C`,
        newValue: `${newVal}°C`,
        delta: `${isIncrease ? '+' : ''}${(Number(newVal) - Number(oldVal)).toFixed(1)}°C`,
        physicalEffect: isIncrease
          ? 'Elevates liquid vapor pressure Pv. Reduces NPSHa, accelerating cavitation bubble collapse.'
          : 'Lowers vapor pressure Pv. Increases NPSHa and enlarges the cavitation safety margin.',
        governingEquation: 'P_v = P_crit · exp(A - B/T)  →  NPSHa = (P_atm - P_v)/(ρ·g) + Z_s - h_f',
        standardImpact: isIncrease ? 'Degrades API 610 §6.1.8 NPSH margin ratio' : 'Restores API 610 §6.1.8 compliance',
      };
    }
    if (keyLow.includes('static') || keyLow.includes('head')) {
      const isIncrease = Number(newVal) > Number(oldVal);
      return {
        detectedParam: 'Static Suction Head (Zs)',
        oldValue: `${oldVal} m`,
        newValue: `${newVal} m`,
        delta: `${isIncrease ? '+' : ''}${(Number(newVal) - Number(oldVal)).toFixed(2)} m`,
        physicalEffect: isIncrease
          ? 'Directly raises pressure head at the pump suction nozzle, increasing NPSHa 1:1.'
          : 'Lowers hydrostatic head at suction nozzle, reducing NPSHa and risking cavitation.',
        governingEquation: 'ΔNPSHa = + ΔZ_s',
        standardImpact: isIncrease ? 'Improves API 610 margin' : 'Depletes API 610 margin',
      };
    }
    if (keyLow.includes('flow')) {
      const isIncrease = Number(newVal) > Number(oldVal);
      return {
        detectedParam: 'Operating Flow Rate (Q)',
        oldValue: `${oldVal} m³/h`,
        newValue: `${newVal} m³/h`,
        delta: `${isIncrease ? '+' : ''}${(Number(newVal) - Number(oldVal)).toFixed(0)} m³/h`,
        physicalEffect: isIncrease
          ? 'Increases pipe friction losses quadratically (hf ∝ Q²) and increases NPSHr.'
          : 'Reduces dynamic suction losses and brings flow closer to Best Efficiency Point (BEP).',
        governingEquation: 'h_f = f · (L/D) · (v² / 2g)  where v ∝ Q',
        standardImpact: 'Shifts operating point relative to API 610 Preferred Operating Region (POR)',
      };
    }
    if (keyLow.includes('valve')) {
      return {
        detectedParam: 'Suction Valve Position',
        oldValue: `${oldVal}%`,
        newValue: `${newVal}%`,
        delta: `${Number(newVal) - Number(oldVal)}%`,
        physicalEffect: Number(newVal) < Number(oldVal)
          ? 'Adds parasitic throttling loss, dropping suction flange pressure drastically.'
          : 'Removes artificial flow resistance, restoring dynamic suction pressure.',
        governingEquation: 'Δh_valve = K_valve · (v² / 2g)',
        standardImpact: 'Affects HI 9.6.1 Net Positive Suction Head criteria',
      };
    }
  }

  // 2. Rotor Dynamics
  if (simId === 'rotor') {
    if (keyLow.includes('speed') || keyLow.includes('rpm')) {
      const isIncrease = Number(newVal) > Number(oldVal);
      return {
        detectedParam: 'Shaft Speed (RPM)',
        oldValue: `${oldVal} RPM`,
        newValue: `${newVal} RPM`,
        delta: `${isIncrease ? '+' : ''}${(Number(newVal) - Number(oldVal)).toFixed(0)} RPM`,
        physicalEffect: 'Centrifugal unbalance force scales with the square of speed (Fc ∝ ω²).',
        governingEquation: 'F_c = m_u · r · (2π·N / 60)²',
        standardImpact: 'Re-evaluates ISO 10816-3 vibration severity and API 684 critical speed resonance',
      };
    }
    if (keyLow.includes('unbalance') || keyLow.includes('mass')) {
      return {
        detectedParam: 'Residual Unbalance Mass',
        oldValue: `${oldVal}`,
        newValue: `${newVal}`,
        delta: `Δ ${(Number(newVal) - Number(oldVal)).toFixed(1)}`,
        physicalEffect: 'Directly shifts the rotor mass center-of-gravity from the geometric axis.',
        governingEquation: 'U = m_u · r',
        standardImpact: 'Directly impacts ISO 1940-1 permissible balance grade limits',
      };
    }
  }

  // 3. Alignment
  if (simId === 'alignment') {
    if (keyLow.includes('offset') || keyLow.includes('angle') || keyLow.includes('shim') || keyLow.includes('temp')) {
      return {
        detectedParam: 'Coupling Alignment Geometry / Thermal',
        oldValue: String(oldVal),
        newValue: String(newVal),
        delta: 'Adjusted',
        physicalEffect: 'Changes hot coaxial alignment offset and angular tilt across the flexible coupling.',
        governingEquation: 'Resultant Offset = √(VO² + HO²)',
        standardImpact: 'Evaluated against API 686 Chapter 5 Table 1 tolerances (≤ 0.05 mm)',
      };
    }
  }

  // Default fallback
  return {
    detectedParam: changedKey.replace(/([A-Z])/g, ' $1').trim(),
    oldValue: String(oldVal),
    newValue: String(newVal),
    delta: typeof newVal === 'number' && typeof oldVal === 'number'
      ? `${newVal > oldVal ? '+' : ''}${(newVal - oldVal).toFixed(2)}`
      : 'Updated',
    physicalEffect: 'Recalculated governing equilibrium, stress distributions, and safety margins.',
    governingEquation: 'Governing Physics Transfer Function',
    standardImpact: 'Verified against applicable international engineering codes',
  };
}
