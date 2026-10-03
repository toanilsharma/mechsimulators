/**
 * API 682 Mechanical Seal Sub-Micron Face Tribology, Phase-Change Vaporization,
 * Thermal Coning/Waviness & Multi-Plan System Dynamics
 * 
 * References:
 * - API 682 4th Edition / ISO 21049 (Piping Plans & Limits)
 * - Lebeck, A.O., "Principles and Design of Mechanical Face Seals"
 * - Salant, R.F., "Numerical Analysis of Mechanical Face Seals"
 * - Tournerie et al., "Two-Phase Flow and Vaporization in Mechanical Seals"
 */

import { SealInputs, SealOutputs, SealPlanId } from '../types/seal';
import { getFluidProperties } from '../utils/sealCalculations';

export interface FaceRadialNode {
  radiusMm: number;
  radiusNorm: number; // 0 = inner diameter (ID), 1 = outer diameter (OD)
  filmThicknessUm: number; // h(r) in micrometers (0.3 - 5.0 um)
  pressureKPa: number; // Local fluid film pressure P(r)
  tempC: number; // Local face surface temperature T(r)
  vaporPressureKPa: number; // Saturated vapor pressure Psat(T(r))
  isVaporized: boolean; // True if T(r) >= Tsat(P(r)) or P(r) <= Psat
  shearStressKPa: number; // Viscous shear stress tau = mu * U / h
}

export interface SealTribologyAnalysisResult {
  // Face Geometry & Kinematics
  innerRadiusMm: number;
  outerRadiusMm: number;
  meanRadiusMm: number;
  faceWidthMm: number;
  faceAreaMm2: number;
  slidingVelocityMs: number;

  // Sub-Micron Film Tribology
  meanFilmThicknessUm: number;
  minFilmThicknessUm: number;
  maxFilmThicknessUm: number;
  radialNodes: FaceRadialNode[];

  // Hydrodynamic vs Closing Equilibrium
  openingForceN: number;
  closingForceN: number;
  netClosingForceN: number;
  hydraulicBalanceRatio: number;
  filmStiffnessNPerUm: number;

  // Thermal Coning & Distortion (ASME / API 682)
  coningAngleUrad: number; // micro-radians (positive = converging, negative = diverging)
  coningClassification: 'converging_stable' | 'parallel_neutral' | 'diverging_pinch';
  radialDeltaTempC: number;
  maxFaceTempC: number;

  // Phase-Change Boiling & Vaporization Dynamics
  hasVaporFlash: boolean;
  boilingRadiusMm: number | null;
  boilingRadiusNorm: number | null; // Fraction of face width from ID (0 to 1)
  vaporZoneWidthPercent: number;
  puffingSeverityPercent: number; // 0 to 100%
  puffingFrequencyHz: number; // Acoustic emission chatter frequency
  acousticChatterDb: number;
  faceSeparationAmplitudeUm: number;

  // Wear & Lubrication Regime
  lubricationRegime: 'full_fluid_hydrodynamic' | 'mixed_lubrication' | 'boundary_dry_rubbing';
  frictionCoefficient: number;
  estimatedLeakageMlPerHour: number;
  blisteringRiskIndex: number; // 0 to 100%

  // Multi-Plan Auxiliary System Dynamics
  pumpingRingHeadM: number;
  pumpingRingFlowLpm: number;
  orificePressureDropKPa: number;
  coolerInletTempC: number;
  coolerOutletTempC: number;
  barrierPressureDifferentialKPa: number;
  accumulatorUsableVolumeL: number;
  accumulatorAlarmMarginKPa: number;
}

/**
 * Calculates dynamic viscosity in Pa·s as a function of temperature
 */
export function getFluidDynamicViscosityPaS(fluidType: string, tempC: number): number {
  const tK = Math.max(1, tempC + 273.15);
  switch (fluidType) {
    case 'crude_oil':
      return Math.max(0.0015, 0.035 * Math.exp(-0.022 * (tempC - 20)));
    case 'gasoline':
      return Math.max(0.0003, 0.0006 * Math.exp(-0.01 * (tempC - 20)));
    case 'propane_lpg':
      return Math.max(0.0001, 0.00025 * Math.exp(-0.008 * (tempC - 20)));
    case 'hot_hydrocarbon':
      return Math.max(0.0008, 0.012 * Math.exp(-0.018 * (tempC - 20)));
    case 'water':
    case 'boiler_feedwater':
    case 'sour_water':
    default:
      // Vogel-Fulcher-Tammann equation for water viscosity
      return 0.02414 * Math.pow(10, 247.8 / (tK - 140));
  }
}

/**
 * Material Thermal Expansion Coefficients & Elastic Modulus
 */
export function getMaterialProperties(material: string): {
  alpha1e6PerC: number;
  elasticModulusGPa: number;
  thermalConductivityW_mK: number;
  pvLimitMPaMs: number;
} {
  switch (material) {
    case 'carbon_vs_sic':
      return { alpha1e6PerC: 4.5, elasticModulusGPa: 390, thermalConductivityW_mK: 120, pvLimitMPaMs: 35.0 };
    case 'carbon_vs_tc':
      return { alpha1e6PerC: 5.2, elasticModulusGPa: 600, thermalConductivityW_mK: 80, pvLimitMPaMs: 28.0 };
    case 'sic_vs_sic':
      return { alpha1e6PerC: 4.0, elasticModulusGPa: 410, thermalConductivityW_mK: 130, pvLimitMPaMs: 22.0 };
    case 'tc_vs_tc':
      return { alpha1e6PerC: 5.0, elasticModulusGPa: 620, thermalConductivityW_mK: 85, pvLimitMPaMs: 18.0 };
    default:
      return { alpha1e6PerC: 4.5, elasticModulusGPa: 400, thermalConductivityW_mK: 120, pvLimitMPaMs: 30.0 };
  }
}

/**
 * Comprehensive API 682 Sub-Micron Face Tribology, Vapor Phase-Change & Multi-Plan Physics
 */
export function calculateSealFaceTribology(params: {
  inputs: SealInputs;
  outputs: SealOutputs;
  forcedConingMode?: 'auto' | 'converging' | 'diverging';
}): SealTribologyAnalysisResult {
  const { inputs, outputs, forcedConingMode = 'auto' } = params;

  // Geometry
  const shaftDiaMm = inputs.sealSizeMm;
  const faceWidthMm = 4.0; // standard API 682 face width (mm)
  const outerRadiusMm = shaftDiaMm / 2 + faceWidthMm;
  const innerRadiusMm = shaftDiaMm / 2;
  const meanRadiusMm = (outerRadiusMm + innerRadiusMm) / 2;
  const outerRadiusM = outerRadiusMm / 1000;
  const innerRadiusM = innerRadiusMm / 1000;
  const meanRadiusM = meanRadiusMm / 1000;
  const faceWidthM = faceWidthMm / 1000;
  const faceAreaMm2 = Math.PI * (Math.pow(outerRadiusMm, 2) - Math.pow(innerRadiusMm, 2));
  const faceAreaM2 = faceAreaMm2 * 1e-6;

  // Kinematics
  const omegaRadS = (inputs.shaftSpeedRpm * 2 * Math.PI) / 60;
  const slidingVelocityMs = omegaRadS * meanRadiusM;

  // Pressures (kPa gauge -> kPa abs)
  const isDualPressurized = ['plan_53a', 'plan_53b', 'plan_53c', 'plan_54'].includes(inputs.planId);
  const pBoxAbsKPa = inputs.sealChamberPressureKPag + 101.325;
  const pAtmAbsKPa = 101.325;
  const pBarrierAbsKPa = inputs.barrierBufferPressureKPag + 101.325;

  // Outside diameter pressure (P_o) vs Inside diameter pressure (P_i)
  const pODAbsKPa = isDualPressurized ? Math.max(pBoxAbsKPa, pBarrierAbsKPa) : pBoxAbsKPa;
  const pIDAbsKPa = pAtmAbsKPa;

  // Fluid Properties
  const chamberTempC = outputs.sealChamberOperatingTempC || inputs.processFluidTempC;
  const fluidProps = getFluidProperties(inputs.processFluidType, chamberTempC);
  const matProps = getMaterialProperties(inputs.faceMaterials);

  // -------------------------------------------------------------
  // 1. Thermal Coning & Radial Temperature Profile
  // -------------------------------------------------------------
  // Frictional heat in kW dissipated across the face
  const qFaceKW = outputs.sealFaceHeatGenKW || 1.2;
  const qFaceW = qFaceKW * 1000;

  // Approximate face peak temperature from frictional dissipation & conduction
  // deltaT_face = Q / (2 * pi * r_m * w_face * h_conv)
  const hConvW_m2K = 1800 + inputs.shaftSpeedRpm * 0.8;
  const maxFaceTempC = chamberTempC + qFaceW / (faceAreaM2 * hConvW_m2K);
  const radialDeltaTempC = maxFaceTempC - chamberTempC;

  // Natural thermal coning angle (in micro-radians)
  // beta_thermal = alpha * deltaT_rad / L_ring (typically 5 to 50 urad)
  const ringAxialLengthM = 0.020; // 20 mm typical ring thickness
  let coningAngleUrad = (matProps.alpha1e6PerC * radialDeltaTempC) / (ringAxialLengthM * 1000);

  // Pressure moment correction: high box pressure pushes OD inwards
  const pressureTiltUrad = (pODAbsKPa / 1000) * 1.5; // ~1.5 urad per bar
  coningAngleUrad = coningAngleUrad - pressureTiltUrad;

  if (forcedConingMode === 'converging') {
    coningAngleUrad = Math.max(30, Math.abs(coningAngleUrad) + 15);
  } else if (forcedConingMode === 'diverging') {
    coningAngleUrad = -Math.max(25, Math.abs(coningAngleUrad) + 15);
  }

  let coningClassification: 'converging_stable' | 'parallel_neutral' | 'diverging_pinch' = 'parallel_neutral';
  if (coningAngleUrad > 8) coningClassification = 'converging_stable';
  else if (coningAngleUrad < -8) coningClassification = 'diverging_pinch';

  // -------------------------------------------------------------
  // 2. 40-Node Sub-Micron Gap & Radial Pressure Profile
  // -------------------------------------------------------------
  const numNodes = 40;
  const radialNodes: FaceRadialNode[] = [];

  // Equilibrium base film thickness (typically 0.8 - 2.5 um)
  // Diverging gap pinches at OD, while converging gap lifts at OD
  const nominalGapUm = Math.max(0.6, Math.min(2.8, 1.2 + (inputs.balanceRatioK - 0.75) * -1.5));
  const tiltSlopeUm = (coningAngleUrad * faceWidthMm) / 1000.0; // delta_h from ID to OD in um

  let h_ID_um = nominalGapUm;
  let h_OD_um = nominalGapUm;

  if (coningClassification === 'converging_stable') {
    h_ID_um = Math.max(0.4, nominalGapUm - tiltSlopeUm * 0.4);
    h_OD_um = h_ID_um + Math.abs(tiltSlopeUm);
  } else if (coningClassification === 'diverging_pinch') {
    h_OD_um = Math.max(0.25, nominalGapUm - Math.abs(tiltSlopeUm) * 0.6);
    h_ID_um = h_OD_um + Math.abs(tiltSlopeUm);
  }

  // Pre-calculate denominator for Reynolds logarithmic radial integration
  let integralDenom = 0;
  for (let i = 0; i < numNodes - 1; i++) {
    const s = (i + 0.5) / (numNodes - 1);
    const rM = innerRadiusM + s * faceWidthM;
    const hUm = h_ID_um + s * (h_OD_um - h_ID_um);
    const hM = hUm * 1e-6;
    integralDenom += (faceWidthM / (numNodes - 1)) / (rM * Math.pow(hM, 3));
  }

  let runningIntegral = 0;
  let hasVaporFlash = false;
  let boilingRadiusMm: number | null = null;
  let boilingRadiusNorm: number | null = null;
  let vaporNodeCount = 0;

  for (let i = 0; i < numNodes; i++) {
    const s = i / (numNodes - 1); // 0 at ID, 1 at OD
    const radiusMm = innerRadiusMm + s * faceWidthMm;
    const radiusM = radiusMm / 1000;
    const filmThicknessUm = h_ID_um + s * (h_OD_um - h_ID_um);

    // Integrate Reynolds pressure
    if (i > 0) {
      const prevS = (i - 0.5) / (numNodes - 1);
      const midRM = innerRadiusM + prevS * faceWidthM;
      const midH_Um = h_ID_um + prevS * (h_OD_um - h_ID_um);
      runningIntegral += (faceWidthM / (numNodes - 1)) / (midRM * Math.pow(midH_Um * 1e-6, 3));
    }

    const pressureRatio = integralDenom > 0 ? runningIntegral / integralDenom : s;
    const pressureKPa = pIDAbsKPa + (pODAbsKPa - pIDAbsKPa) * pressureRatio;

    // Temperature distribution along face (parabolic, peak near mid-radius / inner edge)
    const localTempC = chamberTempC + radialDeltaTempC * Math.sin(s * Math.PI * 0.85 + 0.15);

    // Saturated Vapor Pressure at local node temperature
    const nodeFluidProps = getFluidProperties(inputs.processFluidType, localTempC);
    const vaporPressureKPa = nodeFluidProps.pVapKPa;

    // Vaporization condition: local fluid film pressure falls below saturation vapor pressure
    const isVaporized = pressureKPa <= vaporPressureKPa;
    if (isVaporized) {
      hasVaporFlash = true;
      vaporNodeCount++;
      if (boilingRadiusMm === null) {
        boilingRadiusMm = radiusMm;
        boilingRadiusNorm = s;
      }
    }

    // Viscous shear stress: tau = mu * omega * r / h
    const nodeViscosityPaS = getFluidDynamicViscosityPaS(inputs.processFluidType, localTempC);
    const shearStressKPa = ((nodeViscosityPaS * omegaRadS * radiusM) / (filmThicknessUm * 1e-6)) / 1000;

    radialNodes.push({
      radiusMm,
      radiusNorm: s,
      filmThicknessUm,
      pressureKPa,
      tempC: localTempC,
      vaporPressureKPa,
      isVaporized,
      shearStressKPa,
    });
  }

  // -------------------------------------------------------------
  // 3. Opening Force vs Closing Force Equilibrium
  // -------------------------------------------------------------
  let openingForceN = 0;
  for (let i = 0; i < numNodes - 1; i++) {
    const n1 = radialNodes[i];
    const n2 = radialNodes[i + 1];
    const midR_M = ((n1.radiusMm + n2.radiusMm) / 2) / 1000;
    const midP_Pa = ((n1.pressureKPa + n2.pressureKPa) / 2) * 1000;
    const dAreaM2 = 2 * Math.PI * midR_M * (faceWidthM / (numNodes - 1));
    openingForceN += midP_Pa * dAreaM2;
  }

  // Closing force: F_close = [B * (P_box - P_atm) + P_spring + P_atm] * A_face
  const balanceB = inputs.balanceRatioK;
  const springPressureKPa = 200.0; // standard 2.0 bar spring load
  const closingPressureKPa = (pODAbsKPa - pAtmAbsKPa) * balanceB + springPressureKPa + pAtmAbsKPa;
  const closingForceN = (closingPressureKPa * 1000) * faceAreaM2;
  const netClosingForceN = closingForceN - openingForceN;
  const hydraulicBalanceRatio = openingForceN > 0 ? closingForceN / openingForceN : 1.0;

  // Film stiffness: dF_open / dh
  const filmStiffnessNPerUm = Math.max(150, (openingForceN * 0.45) / nominalGapUm);

  // -------------------------------------------------------------
  // 4. Vapor Flash "Puffing" & Acoustic Chatter Dynamics
  // -------------------------------------------------------------
  const vaporZoneWidthPercent = (vaporNodeCount / numNodes) * 100;
  let puffingSeverityPercent = 0;
  let puffingFrequencyHz = 0;
  let acousticChatterDb = 35;
  let faceSeparationAmplitudeUm = 0.05;

  if (hasVaporFlash) {
    // Vapor expansion ratio (~150x to 1200x) drives explosive cyclic puffing
    puffingSeverityPercent = Math.min(100, Math.max(10, vaporZoneWidthPercent * 1.6));
    // Mechanical seal resonant chatter frequency: sqrt(k_film / m_ring) / (2*pi)
    const ringMassKg = 0.35; // typical carbon/SiC primary ring
    puffingFrequencyHz = Math.round((Math.sqrt((filmStiffnessNPerUm * 1e6) / ringMassKg) / (2 * Math.PI)) * 0.4);
    acousticChatterDb = Math.min(95, 55 + puffingSeverityPercent * 0.4);
    faceSeparationAmplitudeUm = Math.min(12.0, 0.5 + (puffingSeverityPercent / 100) * 8.5);
  }

  // -------------------------------------------------------------
  // 5. Lubrication Regime & Friction
  // -------------------------------------------------------------
  const minFilmThicknessUm = Math.min(...radialNodes.map((n) => n.filmThicknessUm));
  const maxFilmThicknessUm = Math.max(...radialNodes.map((n) => n.filmThicknessUm));
  const meanFilmThicknessUm = (minFilmThicknessUm + maxFilmThicknessUm) / 2;

  let lubricationRegime: 'full_fluid_hydrodynamic' | 'mixed_lubrication' | 'boundary_dry_rubbing';
  let frictionCoefficient = 0.05;

  if (hasVaporFlash || minFilmThicknessUm < 0.35 || coningClassification === 'diverging_pinch') {
    lubricationRegime = 'boundary_dry_rubbing';
    frictionCoefficient = Math.min(0.28, 0.12 + (puffingSeverityPercent / 100) * 0.15);
  } else if (minFilmThicknessUm < 0.8) {
    lubricationRegime = 'mixed_lubrication';
    frictionCoefficient = 0.08;
  } else {
    lubricationRegime = 'full_fluid_hydrodynamic';
    frictionCoefficient = 0.04;
  }

  // Laminar Poiseuille leakage rate: Q = (pi * r_m * h^3 * deltaP) / (6 * mu * w)
  const meanViscosityPaS = getFluidDynamicViscosityPaS(inputs.processFluidType, (chamberTempC + maxFaceTempC) / 2);
  const deltaP_Pa = (pODAbsKPa - pIDAbsKPa) * 1000;
  const qLeakM3PerS = (Math.PI * meanRadiusM * Math.pow(meanFilmThicknessUm * 1e-6, 3) * deltaP_Pa) / (6 * meanViscosityPaS * faceWidthM);
  // Convert m³/s to mL/hour (1 m³ = 1e6 mL, 1 hr = 3600 s)
  const estimatedLeakageMlPerHour = Math.max(0.1, qLeakM3PerS * 1e6 * 3600);

  // Blistering risk index (Carbon/SiC thermal fatigue)
  const blisteringRiskIndex = Math.min(
    100,
    (hasVaporFlash ? 45 : 0) +
      (coningClassification === 'diverging_pinch' ? 35 : 0) +
      (radialDeltaTempC > 40 ? 20 : (radialDeltaTempC / 40) * 20)
  );

  // -------------------------------------------------------------
  // 6. Multi-Plan Auxiliary System Dynamics (Plan 11, 23, 53A/B/C, etc.)
  // -------------------------------------------------------------
  // Plan 23 Internal Pumping Ring head & circulation flow
  // Head H_ring = k_ring * (N/1000)^2 (meters)
  const kRing = 0.85; // head constant for bi-directional pumping ring
  const pumpingRingHeadM = kRing * Math.pow(inputs.shaftSpeedRpm / 1000, 2);
  const pumpingRingFlowLpm = Math.max(1.5, pumpingRingHeadM * 3.2);

  // Orifice Pressure drop (Plan 11/13/21)
  const orificePressureDropKPa = Math.abs(inputs.pumpDischargePressureKPag - inputs.sealChamberPressureKPag);

  // Heat Exchanger cooler thermal drop
  const coolerInletTempC = chamberTempC;
  const coolerDutyKW = outputs.coolerDutyRequiredKW || 3.5;
  const coolerOutletTempC = Math.max(
    inputs.coolingWaterSupplyTempC + 5,
    coolerInletTempC - (coolerDutyKW / (Math.max(1.0, outputs.actualFlushFlowLpm) * 0.07))
  );

  // Barrier Differential for Dual Pressurized (53A/B/C/54)
  const barrierPressureDifferentialKPa = inputs.barrierBufferPressureKPag - inputs.sealChamberPressureKPag;

  // Plan 53B Accumulator Usable Volume & Alarm Margin
  const pPrechargeKPa = inputs.accumulatorPrechargeKPag || 1800;
  const pMaxKPa = inputs.barrierBufferPressureKPag || 2200;
  const accumulatorUsableVolumeL = Math.max(0.5, (inputs.barrierFluidVolumeL || 20) * (1 - pPrechargeKPa / Math.max(pPrechargeKPa + 50, pMaxKPa)));
  const accumulatorAlarmMarginKPa = Math.max(0, pMaxKPa - (pPrechargeKPa + 150));

  return {
    innerRadiusMm,
    outerRadiusMm,
    meanRadiusMm,
    faceWidthMm,
    faceAreaMm2,
    slidingVelocityMs,
    meanFilmThicknessUm,
    minFilmThicknessUm,
    maxFilmThicknessUm,
    radialNodes,
    openingForceN,
    closingForceN,
    netClosingForceN,
    hydraulicBalanceRatio,
    filmStiffnessNPerUm,
    coningAngleUrad,
    coningClassification,
    radialDeltaTempC,
    maxFaceTempC,
    hasVaporFlash,
    boilingRadiusMm,
    boilingRadiusNorm,
    vaporZoneWidthPercent,
    puffingSeverityPercent,
    puffingFrequencyHz,
    acousticChatterDb,
    faceSeparationAmplitudeUm,
    lubricationRegime,
    frictionCoefficient,
    estimatedLeakageMlPerHour,
    blisteringRiskIndex,
    pumpingRingHeadM,
    pumpingRingFlowLpm,
    orificePressureDropKPa,
    coolerInletTempC,
    coolerOutletTempC,
    barrierPressureDifferentialKPa,
    accumulatorUsableVolumeL,
    accumulatorAlarmMarginKPa,
  };
}
