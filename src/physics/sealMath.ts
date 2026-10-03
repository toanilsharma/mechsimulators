/**
 * Mechanical Seal Hydraulics, Thermodynamics, and API 682 Flush Plan Analysis
 * 
 * Implements orifice flow metering, face frictional heat generation,
 * seal chamber temperature rise, vapor pressure margin (deltaP_vap), and API 682 plan selection logic.
 */

import { rpmToRadS } from './units';

export type APISealPlan =
  | 'Plan11'
  | 'Plan13'
  | 'Plan21'
  | 'Plan23'
  | 'Plan31'
  | 'Plan32'
  | 'Plan52'
  | 'Plan53A'
  | 'Plan54';

export interface MechanicalSealFaceGeometry {
  shaftDiameterMm: number;
  faceMeanDiameterMm: number;
  faceWidthMm: number;
  faceAreaMm2: number;
  frictionCoefficient: number; // typical 0.05 to 0.12 (Carbon vs SiC/TC)
  balanceRatio: number; // typical 0.70 to 0.85 for balanced seals
  springPressureKPa: number; // typical 150 to 250 kPa
}

export interface SealThermodynamicsResult {
  sealFaceSpeedMs: number;
  frictionalHeatGeneratedKw: number;
  flushFlowLpm: number;
  chamberTemperatureRiseC: number;
  sealChamberTempC: number;
  vaporPressureAtChamberTempKPa: number;
  vaporPressureMarginKPa: number; // P_box - P_vap
  vaporPressureRatio: number; // P_box / P_vap
  api682VaporMarginPass: boolean; // Requires P_box >= P_vap + 200 kPa or 1.3 * P_vap
  recommendedFlushFlowLpm: number;
  status: 'safe' | 'warning' | 'critical';
  warnings: string[];
}

/**
 * API 682 Standard Flush Plan Database and Suitability Matrix
 */
export const API_682_PLANS: Record<
  APISealPlan,
  {
    plan: APISealPlan;
    name: string;
    description: string;
    suitableServices: string[];
    coolingMethod: 'none' | 'product_cooler' | 'pumping_ring_cooler' | 'barrier_cooler' | 'external';
    requiresExternalSupply: boolean;
  }
> = {
  Plan11: {
    plan: 'Plan11',
    name: 'Plan 11: Discharge Recirculation via Orifice',
    description: 'Clean product flush from pump discharge through flow orifice into seal chamber.',
    suitableServices: ['Clean fluids', 'Moderate temperatures (< 80°C)', 'General water/hydrocarbon'],
    coolingMethod: 'none',
    requiresExternalSupply: false,
  },
  Plan13: {
    plan: 'Plan13',
    name: 'Plan 13: Recirculation from Chamber to Suction',
    description: 'Continuous venting/recirculation from seal chamber back to pump suction. Ideal for vertical pumps.',
    suitableServices: ['Vertical pumps', 'Submerged pumps', 'Self-venting applications'],
    coolingMethod: 'none',
    requiresExternalSupply: false,
  },
  Plan21: {
    plan: 'Plan21',
    name: 'Plan 21: Cooled Discharge Flush',
    description: 'Flush from pump discharge through heat exchanger cooler and orifice into seal chamber.',
    suitableServices: ['Hot fluids (> 80°C)', 'Boiler feed water', 'Light hydrocarbons needing vapor suppression'],
    coolingMethod: 'product_cooler',
    requiresExternalSupply: false,
  },
  Plan23: {
    plan: 'Plan23',
    name: 'Plan 23: Closed Loop with Pumping Ring & Cooler',
    description: 'High-efficiency closed loop: internal pumping ring circulates fluid from chamber through cooler and back.',
    suitableServices: ['Hot water / Boiler feed (> 80°C)', 'High duty thermal services (Lowest utility consumption)'],
    coolingMethod: 'pumping_ring_cooler',
    requiresExternalSupply: false,
  },
  Plan31: {
    plan: 'Plan31',
    name: 'Plan 31: Cyclone Separator Recirculation',
    description: 'Discharge stream passes through cyclone separator; clean liquid flushes seal, solids return to suction.',
    suitableServices: ['Fluids with abrasive solid particulates (specific gravity >= 2x fluid)'],
    coolingMethod: 'none',
    requiresExternalSupply: false,
  },
  Plan32: {
    plan: 'Plan32',
    name: 'Plan 32: External Clean Flush Injection',
    description: 'Injection of clean, cool, compatible external fluid into seal chamber.',
    suitableServices: ['Dirty slurries', 'Polymerizing/crystallizing liquids', 'High temperature slurries'],
    coolingMethod: 'external',
    requiresExternalSupply: true,
  },
  Plan52: {
    plan: 'Plan52',
    name: 'Plan 52: Dual Unpressurized Buffer Fluid',
    description: 'Dual seal with unpressurized external buffer reservoir. Zero process emissions to atmosphere.',
    suitableServices: ['Hazardous / Volatile Organic Compounds (VOCs)', 'Flashing hydrocarbons'],
    coolingMethod: 'barrier_cooler',
    requiresExternalSupply: true,
  },
  Plan53A: {
    plan: 'Plan53A',
    name: 'Plan 53A: Dual Pressurized Barrier Fluid (Nitrogen Bladder)',
    description: 'Dual pressurized seal with barrier pressure higher than seal chamber (P_barrier > P_box + 1.5 bar).',
    suitableServices: ['Toxic / Lethal fluids', 'Abrasive slurries with zero leakage tolerance'],
    coolingMethod: 'barrier_cooler',
    requiresExternalSupply: true,
  },
  Plan54: {
    plan: 'Plan54',
    name: 'Plan 54: External Pressurized Barrier System',
    description: 'Centralized pressurized barrier fluid circulation system for multiple dual seals.',
    suitableServices: ['Large refinery/petrochemical plant complexes with dedicated lube/seal skids'],
    coolingMethod: 'external',
    requiresExternalSupply: true,
  },
};

/**
 * Calculate flow through a square-edge restriction orifice (ISO 5167 / Crane TP 410)
 * Formula: Q = C_d * A * sqrt( (2 * deltaP) / rho )
 *
 * @param deltaPKPa - Differential pressure across orifice (P_in - P_out) in kPa
 * @param orificeDiameterMm - Orifice bore diameter in mm (typical 2.5 - 6.0 mm)
 * @param densityKgM3 - Fluid density in kg/m³
 * @param dischargeCoeff - Discharge coefficient C_d (default 0.62 for sharp edge)
 * @returns Flow rate in Liters/min (L/min)
 */
export function calculateOrificeFlowLpm(
  deltaPKPa: number,
  orificeDiameterMm: number,
  densityKgM3: number,
  dischargeCoeff = 0.62
): number {
  if (deltaPKPa <= 0 || orificeDiameterMm <= 0 || densityKgM3 <= 0) return 0;

  // d in meters
  const dM = orificeDiameterMm / 1000.0;
  const areaM2 = (Math.PI * Math.pow(dM, 2)) / 4.0;
  const deltaP_Pa = deltaPKPa * 1000.0;

  // Velocity v = C_d * sqrt(2 * deltaP / rho)
  // Volumetric flow Q (m³/s) = C_d * Area * sqrt(2 * deltaP / rho)
  const qM3s = dischargeCoeff * areaM2 * Math.sqrt((2.0 * deltaP_Pa) / densityKgM3);

  // Convert m³/s to L/min (1 m³ = 1000 L, 1 s = 1/60 min -> * 60,000)
  return qM3s * 60000.0;
}

/**
 * Calculate mechanical seal face frictional heat generation
 * 
 * Formula:
 * Q_heat = M_torque * omega
 * M_torque = mu_f * F_net * r_mean
 * F_net = (P_box * (1 - B) + P_spring) * A_face (Balanced seal closure force)
 *
 * @param shaftSpeedRpm - Rotational speed in RPM
 * @param chamberPressureKPa - Seal chamber pressure in kPa gauge
 * @param face - Seal geometry and material parameters
 * @returns Frictional heat generation in kW
 */
export function calculateSealFaceHeatKw(
  shaftSpeedRpm: number,
  chamberPressureKPa: number,
  face: MechanicalSealFaceGeometry
): { heatKw: number; faceSpeedMs: number } {
  if (shaftSpeedRpm <= 0) return { heatKw: 0, faceSpeedMs: 0 };

  const omega = rpmToRadS(shaftSpeedRpm);
  const rMeanM = (face.faceMeanDiameterMm / 2.0) / 1000.0;
  const faceSpeedMs = omega * rMeanM;

  // Net closing pressure on seal face (Pa):
  // P_net = P_spring + P_chamber * (1 - BalanceRatio)
  const pChamberPa = Math.max(0, chamberPressureKPa) * 1000.0;
  const pSpringPa = face.springPressureKPa * 1000.0;
  const pNetClosingPa = pSpringPa + pChamberPa * (1.0 - face.balanceRatio);

  // Closing force F = P_net * Area (N)
  const aFaceM2 = face.faceAreaMm2 * 1e-6;
  const fNetN = pNetClosingPa * aFaceM2;

  // Frictional torque M = mu * F * r_mean (N·m)
  const torqueNm = face.frictionCoefficient * fNetN * rMeanM;

  // Power = Torque * omega (Watts) -> / 1000 = kW
  const heatKw = (torqueNm * omega) / 1000.0;

  return { heatKw, faceSpeedMs };
}

/**
 * Calculate Seal Chamber Temperature Rise from Flush Flow
 * Formula: DeltaT = Q_heat / (m_dot * C_p)
 * m_dot = (flow_Lpm * density) / 60000 (kg/s)
 *
 * @param heatKw - Frictional heat generation in kW
 * @param flushFlowLpm - Seal flush flow rate in L/min
 * @param fluidDensityKgM3 - Fluid density in kg/m³
 * @param fluidSpecificHeatCp - Specific heat Cp in kJ/(kg·K)
 * @returns Temperature rise DeltaT in °C
 */
export function calculateChamberTemperatureRise(
  heatKw: number,
  flushFlowLpm: number,
  fluidDensityKgM3: number,
  fluidSpecificHeatCp = 4.184
): number {
  if (flushFlowLpm <= 0 || fluidDensityKgM3 <= 0 || fluidSpecificHeatCp <= 0) {
    return 50.0; // Assume severe overheating if no flush flow
  }

  // Mass flow rate in kg/s: (L/min * 1e-3 m³/L * density) / 60
  const mDotKgS = (flushFlowLpm * 1e-3 * fluidDensityKgM3) / 60.0;

  // DeltaT = Q_kW / (m_dot_kg_s * Cp_kJ_kgK)
  return heatKw / (mDotKgS * fluidSpecificHeatCp);
}

/**
 * Calculate Required API 682 Minimum Flush Flow to maintain chamber DeltaT <= 10°C
 * Formula: Q_rec (L/min) = (Q_kW * 60000) / (density * Cp * DeltaT_target)
 */
export function calculateRecommendedFlushFlow(
  heatKw: number,
  fluidDensityKgM3: number,
  fluidSpecificHeatCp = 4.184,
  targetDeltaTC = 8.0
): number {
  if (heatKw <= 0 || fluidDensityKgM3 <= 0) return 4.0;
  const targetDt = Math.max(2.0, targetDeltaTC);
  // Q (m³/s) = Q_kW / (density * Cp * targetDt)
  const qM3s = heatKw / (fluidDensityKgM3 * fluidSpecificHeatCp * targetDt);
  return Math.max(3.8, qM3s * 60000.0); // API 682 recommends minimum 1.0 GPM (~3.8 L/min)
}

/**
 * Comprehensive Mechanical Seal Thermohydraulic Evaluation
 */
export function evaluateSealSystem(params: {
  shaftSpeedRpm: number;
  chamberPressureKPaGauge: number;
  flushInletTempC: number;
  flushFlowLpm: number;
  fluidDensityKgM3: number;
  fluidSpecificHeatCp?: number;
  faceGeometry?: Partial<MechanicalSealFaceGeometry>;
  calculateVaporPressureFn: (tempC: number) => number; // Saturated vapor pressure function
}): SealThermodynamicsResult {
  const warnings: string[] = [];
  const {
    shaftSpeedRpm,
    chamberPressureKPaGauge,
    flushInletTempC,
    flushFlowLpm,
    fluidDensityKgM3,
    fluidSpecificHeatCp = 4.184,
    calculateVaporPressureFn,
  } = params;

  const defaultFace: MechanicalSealFaceGeometry = {
    shaftDiameterMm: 50.0,
    faceMeanDiameterMm: 58.0,
    faceWidthMm: 4.0,
    faceAreaMm2: 728.0, // pi * 58 * 4
    frictionCoefficient: 0.08,
    balanceRatio: 0.75,
    springPressureKPa: 200.0,
    ...params.faceGeometry,
  };

  const { heatKw, faceSpeedMs } = calculateSealFaceHeatKw(
    shaftSpeedRpm,
    chamberPressureKPaGauge,
    defaultFace
  );

  const deltaTC = calculateChamberTemperatureRise(
    heatKw,
    flushFlowLpm,
    fluidDensityKgM3,
    fluidSpecificHeatCp
  );

  const sealChamberTempC = flushInletTempC + deltaTC;
  const pVapKPaAbs = calculateVaporPressureFn(sealChamberTempC);

  // Absolute chamber pressure: P_box_abs = P_gauge + 101.325 kPa
  const pChamberAbsKPa = chamberPressureKPaGauge + 101.325;
  const vaporMarginKPa = pChamberAbsKPa - pVapKPaAbs;
  const vaporMarginRatio = pVapKPaAbs > 0 ? pChamberAbsKPa / pVapKPaAbs : 10.0;

  // API 682 Clause 6.1.2.14: Vapor pressure margin shall be at least 200 kPa (2.0 bar) or P_box >= 1.3 * P_vap
  const api682VaporMarginPass = vaporMarginKPa >= 200.0 || vaporMarginRatio >= 1.3;

  const recFlowLpm = calculateRecommendedFlushFlow(
    heatKw,
    fluidDensityKgM3,
    fluidSpecificHeatCp,
    8.0
  );

  let status: 'safe' | 'warning' | 'critical' = 'safe';

  if (vaporMarginKPa <= 0) {
    status = 'critical';
    warnings.push(
      `SEAL FACE FLASHING / DRY RUNNING: Vapor pressure at chamber temp (${pVapKPaAbs.toFixed(1)} kPa abs @ ${sealChamberTempC.toFixed(1)}°C) EXCEEDS chamber pressure (${pChamberAbsKPa.toFixed(1)} kPa abs). Fluid will flash into vapor across faces, causing acoustic chatter, face blistering, and immediate seal failure.`
    );
  } else if (!api682VaporMarginPass) {
    status = 'warning';
    warnings.push(
      `LOW VAPOR MARGIN: Vapor margin (${vaporMarginKPa.toFixed(1)} kPa) is below the API 682 minimum margin (200 kPa / 2.0 bar). Upgrade to Plan 21/23 cooler or increase flush flow rate.`
    );
  }

  if (flushFlowLpm < recFlowLpm * 0.75) {
    warnings.push(
      `INSUFFICIENT FLUSH FLOW: Current flush flow (${flushFlowLpm.toFixed(1)} L/min) is below the recommended minimum (${recFlowLpm.toFixed(1)} L/min), causing elevated seal chamber deltaT (+${deltaTC.toFixed(1)}°C).`
    );
  }

  if (faceSpeedMs > 25.0) {
    warnings.push(
      `HIGH SEAL FACE VELOCITY: Face sliding velocity (${faceSpeedMs.toFixed(1)} m/s) is high; verify seal face hydrodynamic groove design and heat dissipation.`
    );
  }

  return {
    sealFaceSpeedMs: faceSpeedMs,
    frictionalHeatGeneratedKw: heatKw,
    flushFlowLpm,
    chamberTemperatureRiseC: deltaTC,
    sealChamberTempC,
    vaporPressureAtChamberTempKPa: pVapKPaAbs,
    vaporPressureMarginKPa: vaporMarginKPa,
    vaporPressureRatio: vaporMarginRatio,
    api682VaporMarginPass,
    recommendedFlushFlowLpm: recFlowLpm,
    status,
    warnings,
  };
}
