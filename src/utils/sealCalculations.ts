import { SealInputs, SealOutputs, SealPlanId, PressureDropBreakdown } from '../types/seal';
import { AuditStep, StatusAssessment } from '../types/common';
import { SEAL_PLAN_MATRIX } from './sealPlanMatrix';

export const SEAL_PLAN_INFO: Record<SealPlanId, { name: string; title: string; category: string; description: string; typicalService: string }> = {
  plan_11: {
    name: 'Plan 11',
    title: 'Discharge Recirculation Flush via Orifice',
    category: 'Single Seal (Internal Flush)',
    description: 'Process fluid from pump discharge is routed through a restriction orifice directly to the seal chamber. Default standard flush for clean, non-polymerizing fluids.',
    typicalService: 'General hydrocarbons, light oils, clean ambient water below 80°C.',
  },
  plan_13: {
    name: 'Plan 13',
    title: 'Recirculation from Seal Chamber to Suction via Orifice',
    category: 'Single Seal (Internal Flush to Suction)',
    description: 'Flow recirculates from the seal chamber back to pump suction through an orifice. Self-venting configuration ideal for vertical pumps.',
    typicalService: 'Vertical in-line pumps, moderate vapor pressure fluids, clean liquids.',
  },
  plan_21: {
    name: 'Plan 21',
    title: 'Discharge Recirculation with Heat Exchanger (Cooler)',
    category: 'Single Seal (Cooled Flush)',
    description: 'Process fluid from pump discharge passes through a restriction orifice and a heat exchanger before entering the seal chamber to cool the seal faces.',
    typicalService: 'Hot clean services, hot hydrocarbons, boiler feed water up to 150°C.',
  },
  plan_23: {
    name: 'Plan 23',
    title: 'Closed Loop Recirculation with Pumping Ring & Cooler',
    category: 'Single Seal (Energy-Efficient Cooling)',
    description: 'An internal pumping ring circulates fluid only from the seal chamber through a heat exchanger and back. Highly efficient as it does not continuously cool fresh process stream.',
    typicalService: 'High temperature boiler feedwater, hot hydrocarbons > 150°C.',
  },
  plan_31: {
    name: 'Plan 31',
    title: 'Discharge Recirculation via Cyclone Separator',
    category: 'Single Seal (Solids Separation)',
    description: 'Process fluid passes through a hydrocyclone separator. Clean liquid flows to the seal chamber; abrasive solids/slurry are returned to pump suction.',
    typicalService: 'Dirty fluids with solids, abrasive slurry, sand-bearing crude oil.',
  },
  plan_32: {
    name: 'Plan 32',
    title: 'External Clean Flush Injection',
    category: 'Single Seal (External Source)',
    description: 'A clean, compatible external fluid is injected into the seal chamber at higher pressure than the seal chamber to isolate the seal from abrasive or polymerizing process fluid.',
    typicalService: 'Slurries, polymerizing fluids, highly corrosive or toxic chemicals.',
  },
  plan_52: {
    name: 'Plan 52',
    title: 'Dual Unpressurized Seal with Buffer Fluid Reservoir',
    category: 'Dual Unpressurized Seal (Arrangement 2)',
    description: 'Buffer fluid circulates between inner and outer seals via thermosiphon or pumping ring. Buffer reservoir is vented to flare/vapor recovery at lower pressure than seal chamber.',
    typicalService: 'Volatile hazardous fluids, light hydrocarbons, VOC emissions control.',
  },
  plan_53a: {
    name: 'Plan 53A',
    title: 'Dual Pressurized Seal with Nitrogen-Pressurized Reservoir',
    category: 'Dual Pressurized Seal (Arrangement 3)',
    description: 'Barrier fluid is pressurized above seal chamber pressure using a plant nitrogen blanket. Zero process emission to atmosphere; clean barrier lubricates both seal faces.',
    typicalService: 'Toxic, hazardous, flammable, carcinogens, sour crude, zero-emission services.',
  },
  plan_53b: {
    name: 'Plan 53B',
    title: 'Dual Pressurized Seal with Bladder Accumulator',
    category: 'Dual Pressurized Seal (Arrangement 3)',
    description: 'Barrier fluid is pressurized by a pre-charged bladder accumulator. Prevents direct N2 contact with barrier fluid, eliminating gas absorption in high-pressure systems.',
    typicalService: 'High pressure pipelines, offshore platforms, toxic hydrocarbons.',
  },
  plan_53c: {
    name: 'Plan 53C',
    title: 'Dual Pressurized Seal with Piston Accumulator (Tracking)',
    category: 'Dual Pressurized Seal (Arrangement 3)',
    description: 'A differential piston accumulator uses stuffing box pressure to automatically maintain barrier pressure at a fixed differential above fluctuating process pressure.',
    typicalService: 'Variable suction pressure systems, multi-product pipelines.',
  },
  plan_54: {
    name: 'Plan 54',
    title: 'Dual Pressurized Seal with External Circulating Skid',
    category: 'Dual Pressurized Seal (Arrangement 3)',
    description: 'An external dedicated lubrication and pumping unit supplies pressurized clean barrier fluid to multiple mechanical seals simultaneously.',
    typicalService: 'Large critical pumps, high heat generation seals, offshore plants.',
  },
  plan_62: {
    name: 'Plan 62',
    title: 'External Atmospheric Quench (Steam / N2 / Water)',
    category: 'Single Seal (Atmospheric Side)',
    description: 'A low-pressure quench fluid is introduced on the atmospheric side of the seal to prevent crystallization, coking, icing, or atmospheric oxidation.',
    typicalService: 'Caustic soda, hot heavy oil (prevents coking), cryogenic service (prevents icing).',
  },
};

/**
 * Calculates fluid properties based on process fluid type and operating temperature
 */
export function getFluidProperties(fluidType: string, tempC: number): { density: number; cp: number; pVapKPa: number; tBoilAt1AtmC: number } {
  switch (fluidType) {
    case 'crude_oil': {
      const rho = Math.max(780, 860 - 0.7 * (tempC - 20));
      const cp = 1.9 + 0.003 * tempC;
      // Reid Vapor Pressure approximation
      const pVap = Math.max(5, 25 * Math.exp(0.025 * (tempC - 37.8)));
      return { density: rho, cp, pVapKPa: pVap, tBoilAt1AtmC: 220 };
    }
    case 'gasoline': {
      const rho = Math.max(700, 740 - 0.85 * (tempC - 20));
      const cp = 2.1 + 0.003 * tempC;
      // High RVP
      const pVap = Math.max(15, 60 * Math.exp(0.038 * (tempC - 37.8)));
      return { density: rho, cp, pVapKPa: pVap, tBoilAt1AtmC: 85 };
    }
    case 'propane_lpg': {
      const rho = Math.max(480, 510 - 1.2 * (tempC + 20));
      const cp = 2.5;
      // High vapor pressure Antoine
      const T_K = tempC + 273.15;
      const pVapBar = Math.pow(10, 4.0 - 813.2 / (T_K - 25.0));
      return { density: rho, cp, pVapKPa: Math.max(100, pVapBar * 100), tBoilAt1AtmC: -42 };
    }
    case 'hot_hydrocarbon': {
      const rho = Math.max(720, 820 - 0.75 * (tempC - 20));
      const cp = 2.3 + 0.0035 * tempC;
      const pVap = Math.max(10, 40 * Math.exp(0.03 * (tempC - 50)));
      return { density: rho, cp, pVapKPa: pVap, tBoilAt1AtmC: 260 };
    }
    case 'sour_water':
    case 'boiler_feedwater':
    case 'water':
    default: {
      // Pure / process water
      const rho = Math.max(880, 1000 - 0.45 * Math.max(0, tempC - 20));
      const cp = 4.184; // kJ/kg·K
      // Antoine equation for water vapor pressure in kPa
      const T_K = Math.max(0.1, tempC) + 273.15;
      const pVapKPa = 100 * Math.pow(10, 5.20389 - 1733.926 / (T_K - 39.485));
      return { density: rho, cp, pVapKPa, tBoilAt1AtmC: 100 };
    }
  }
}

export function calculateSeal(inputs: SealInputs): SealOutputs {
  const auditTrail: AuditStep[] = [];
  const planSpecificWarnings: string[] = [];

  // Fluid physical properties
  const fluidProps = getFluidProperties(inputs.processFluidType, inputs.processFluidTempC);
  const fluidDensity = inputs.fluidDensityKgM3 > 0 ? inputs.fluidDensityKgM3 : fluidProps.density;
  const fluidCp = inputs.fluidSpecificHeatCp > 0 ? inputs.fluidSpecificHeatCp : fluidProps.cp;

  // 1. Seal Face Kinematics & Geometry
  // Sliding velocity V = pi * D * RPM / 60
  const d_seal_mm = inputs.sealSizeMm;
  const d_seal_m = d_seal_mm / 1000;
  const faceWidth_mm = 3.5; // Standard API 682 face contact radial width
  const faceWidth_m = faceWidth_mm / 1000;
  const meanRadius_m = (d_seal_m - faceWidth_m) / 2;
  const meanRadius_mm = meanRadius_m * 1000;
  const faceArea_mm2 = Math.PI * d_seal_mm * faceWidth_mm;
  const faceArea_m2 = faceArea_mm2 / 1000000;

  const slidingVelocityMs = (Math.PI * d_seal_m * inputs.shaftSpeedRpm) / 60;

  auditTrail.push({
    title: '1. Seal Face Sliding Velocity (V_face)',
    standardRef: 'API 682 4th Ed §6.1 / Annex C',
    formula: 'V = \\frac{\\pi \\cdot D \\cdot \\text{RPM}}{60}',
    substituted: `D = ${d_seal_mm} mm (${d_seal_m} m), RPM = ${inputs.shaftSpeedRpm}`,
    result: `${slidingVelocityMs.toFixed(2)}`,
    unit: 'm/s',
    note: slidingVelocityMs > 25 ? 'High face sliding speed (> 25 m/s): Recommended hard-face combination (SiC vs SiC).' : undefined,
  });

  // 2. Differential Pressure and Face Closing Force
  const isDualPressurized = ['plan_53a', 'plan_53b', 'plan_53c', 'plan_54'].includes(inputs.planId);
  const isDualUnpressurized = inputs.planId === 'plan_52';
  const isQuench = inputs.planId === 'plan_62';
  const isExternalFlush = inputs.planId === 'plan_32';

  let sealedDeltaPKPa = inputs.sealChamberPressureKPag; // relative to atm
  if (isDualPressurized) {
    sealedDeltaPKPa = Math.max(10, inputs.barrierBufferPressureKPag - inputs.sealChamberPressureKPag);
  }

  const sealedDeltaPMPa = sealedDeltaPKPa / 1000;
  const balanceRatioK = inputs.balanceRatioK || 0.75;
  const springPressureMPa = 0.15; // Standard 1.5 bar mechanical spring preload

  // Net face closing pressure: P_net = deltaP * (K - 0.5) + P_spring
  const netFacePressureMPa = Math.max(0.08, sealedDeltaPMPa * (balanceRatioK - 0.5) + springPressureMPa);
  const netFacePressureKPa = netFacePressureMPa * 1000;

  // PV value: P_net * V in MPa·m/s
  const pvValueMPaMs = netFacePressureMPa * slidingVelocityMs;

  auditTrail.push({
    title: '2. Net Seal Face Closing Pressure & PV Factor',
    standardRef: 'API 682 4th Ed Annex C PV Model',
    formula: 'P_{net} = \\Delta P_{sealed} \\cdot (K - 0.5) + P_{spring}, \\quad PV = P_{net} \\cdot V',
    substituted: `ΔP = ${sealedDeltaPMPa.toFixed(2)} MPa, K = ${balanceRatioK}, P_spring = ${springPressureMPa} MPa, V = ${slidingVelocityMs.toFixed(2)} m/s`,
    result: `P_net = ${netFacePressureMPa.toFixed(2)} MPa, PV = ${pvValueMPaMs.toFixed(2)} MPa·m/s`,
    unit: 'MPa / MPa·m/s',
  });

  // 3. Seal Face Heat Generation (Q_face)
  // Q_face = f_c * P_net (Pa) * Area (m2) * V (m/s) in Watts -> / 1000 for kW
  const fc = inputs.faceFrictionCoeff || 0.06;
  const Q_face_W = fc * (netFacePressureMPa * 1e6) * faceArea_m2 * slidingVelocityMs;
  const Q_face_KW = Q_face_W / 1000;

  // Heat soak from pump casing Q_soak
  const tempDiffToAmbient = Math.max(0, inputs.processFluidTempC - 25);
  let heatSoakKW = 0.15;
  if (tempDiffToAmbient > 50) heatSoakKW = 0.35 + 0.003 * (tempDiffToAmbient - 50);
  if (tempDiffToAmbient > 150) heatSoakKW = 0.85 + 0.0045 * (tempDiffToAmbient - 150);

  // Plan 23 has close-clearance throat bushing reducing soak by 85%
  if (inputs.planId === 'plan_23') {
    heatSoakKW *= 0.15;
  }

  const totalHeatToDissipateKW = Q_face_KW + heatSoakKW;

  auditTrail.push({
    title: '3. Seal Face & Chamber Heat Generation (PV Model)',
    standardRef: 'API 682 Annex C Heat Transfer Models',
    formula: 'Q_{total} = Q_{face} + Q_{soak} = (f_c \\cdot P_{net} \\cdot A_{face} \\cdot V) + Q_{soak}',
    substituted: `f_c = ${fc}, Area = ${faceArea_mm2.toFixed(1)} mm², Q_face = ${Q_face_KW.toFixed(2)} kW, Q_soak = ${heatSoakKW.toFixed(2)} kW`,
    result: `${totalHeatToDissipateKW.toFixed(2)}`,
    unit: 'kW',
  });

  // 4. Required Flush Flow Rate (API 682 Energy Balance)
  // Heat removed = m_dot * Cp * deltaT_allow -> Q_flush = Q_total / (rho * Cp * deltaT_allow)
  const allowableDeltaTC = Math.max(2, inputs.allowableFlushTempRiseC || 10);
  const requiredMassFlowKgS = totalHeatToDissipateKW / (fluidCp * allowableDeltaTC);
  const requiredFlushFlowLpm = (requiredMassFlowKgS / fluidDensity) * 60000;

  // 5. Orifice Hydraulic Flow and Pressure Drops
  // Q = Cd * A * sqrt(2 * deltaP / rho)
  const Cd = 0.60; // Discharge coefficient per API benchmark
  const orfDiaMm = inputs.flushOrificeDiameterMm || 3.0;
  const orfDiaM = Math.max(0.0005, orfDiaMm / 1000);
  const orificeAreaM2 = (Math.PI / 4) * Math.pow(orfDiaM, 2);

  // Driving delta P depends on flush plan
  let drivingDeltaPKPa = 100;
  if (inputs.planId === 'plan_11' || inputs.planId === 'plan_21' || inputs.planId === 'plan_31') {
    drivingDeltaPKPa = Math.max(10, inputs.pumpDischargePressureKPag - inputs.sealChamberPressureKPag);
  } else if (inputs.planId === 'plan_13') {
    drivingDeltaPKPa = Math.max(10, inputs.sealChamberPressureKPag - inputs.pumpSuctionPressureKPag);
  } else if (inputs.planId === 'plan_32') {
    drivingDeltaPKPa = Math.max(10, inputs.externalFlushPressureKPag - inputs.sealChamberPressureKPag);
  } else if (inputs.planId === 'plan_23') {
    // Pumping ring head ~ 35-70 kPa depending on speed
    drivingDeltaPKPa = 35 + (inputs.shaftSpeedRpm / 3000) * 25;
  }

  const drivingDeltaPPa = drivingDeltaPKPa * 1000;
  const rawOrificeVelocity = Math.sqrt(Math.max(0, (2 * drivingDeltaPPa) / fluidDensity));
  const actualOrificeFlowM3s = Cd * orificeAreaM2 * rawOrificeVelocity;
  const actualOrificeFlowLpm = actualOrificeFlowM3s * 60000;

  // Pressure drop breakdown across components
  // Orifice, Throttle Bushing, Cooler, Piping
  let orificeDeltaPKPa = 0;
  let coolerDeltaPKPa = 0;
  let pipingDeltaPKPa = 0;
  let throttleBushingDeltaPKPa = 0;

  if (inputs.planId === 'plan_11') {
    orificeDeltaPKPa = drivingDeltaPKPa * 0.85;
    pipingDeltaPKPa = drivingDeltaPKPa * 0.15;
    throttleBushingDeltaPKPa = inputs.sealChamberPressureKPag - inputs.pumpSuctionPressureKPag;
  } else if (inputs.planId === 'plan_13') {
    orificeDeltaPKPa = drivingDeltaPKPa * 0.85;
    pipingDeltaPKPa = drivingDeltaPKPa * 0.15;
    throttleBushingDeltaPKPa = inputs.pumpDischargePressureKPag - inputs.sealChamberPressureKPag;
  } else if (inputs.planId === 'plan_21') {
    orificeDeltaPKPa = drivingDeltaPKPa * 0.65;
    coolerDeltaPKPa = drivingDeltaPKPa * 0.25;
    pipingDeltaPKPa = drivingDeltaPKPa * 0.10;
    throttleBushingDeltaPKPa = inputs.sealChamberPressureKPag - inputs.pumpSuctionPressureKPag;
  } else if (inputs.planId === 'plan_23') {
    coolerDeltaPKPa = drivingDeltaPKPa * 0.55;
    pipingDeltaPKPa = drivingDeltaPKPa * 0.45;
    throttleBushingDeltaPKPa = inputs.processFluidTempC > 100 ? 50 : 25;
  } else if (inputs.planId === 'plan_32') {
    orificeDeltaPKPa = drivingDeltaPKPa * 0.30;
    pipingDeltaPKPa = drivingDeltaPKPa * 0.10;
    throttleBushingDeltaPKPa = drivingDeltaPKPa * 0.60;
  } else {
    orificeDeltaPKPa = 0;
    coolerDeltaPKPa = isDualPressurized ? 25 : 0;
    pipingDeltaPKPa = 15;
    throttleBushingDeltaPKPa = 30;
  }

  const totalSystemDeltaPKPa = orificeDeltaPKPa + coolerDeltaPKPa + pipingDeltaPKPa;

  const pressureDrops: PressureDropBreakdown = {
    orificeDeltaPKPa,
    throttleBushingDeltaPKPa,
    coolerDeltaPKPa,
    pipingDeltaPKPa,
    totalSystemDeltaPKPa,
  };

  // Circulation flow determination
  let actualFlushFlowLpm = actualOrificeFlowLpm;
  if (inputs.planId === 'plan_23') {
    // Pumping ring flow ~ 8-18 L/min
    actualFlushFlowLpm = 8.5 * (inputs.shaftSpeedRpm / 2950) * (d_seal_mm / 65);
  } else if (inputs.planId === 'plan_32') {
    actualFlushFlowLpm = inputs.externalFlushFlowLpm > 0 ? inputs.externalFlushFlowLpm : actualOrificeFlowLpm;
  } else if (isDualPressurized || isDualUnpressurized) {
    actualFlushFlowLpm = 6.0 * (inputs.shaftSpeedRpm / 2950);
  }

  auditTrail.push({
    title: '4. Flush Flow & Restriction Orifice Hydraulics',
    standardRef: 'API 682 §6.1.2.14 / API Benchmark (Cd=0.6)',
    formula: 'Q = C_d \\cdot A \\cdot \\sqrt{\\frac{2 \\Delta P}{\\rho}}, \\quad \\text{where } A = \\frac{\\pi d^2}{4}',
    substituted: `d = ${orfDiaMm} mm, ΔP = ${drivingDeltaPKPa.toFixed(1)} kPa, ρ = ${fluidDensity.toFixed(0)} kg/m³, Cd = ${Cd}`,
    result: `Flow = ${actualOrificeFlowLpm.toFixed(2)} L/min (Req: ${requiredFlushFlowLpm.toFixed(2)} L/min)`,
    unit: 'L/min',
  });

  // 6. Seal Chamber Temperature & Cooler Duty
  let sealChamberOperatingTempC = inputs.processFluidTempC;
  let coolerDutyRequiredKW = 0;
  let actualCoolerHeatRemovalKW = 0;
  let coolerCoolingWaterFlowLpm = 0;
  let coolingAdequate = true;

  if (inputs.planId === 'plan_21') {
    // Plan 21 cools full discharge flush stream
    const coolerCapacity = inputs.coolerCapacityKW > 0 ? inputs.coolerCapacityKW : 8.0;
    coolerDutyRequiredKW = totalHeatToDissipateKW * 1.25;
    actualCoolerHeatRemovalKW = Math.min(coolerCapacity, coolerDutyRequiredKW);
    const flushMassKgS = (actualFlushFlowLpm / 60000) * fluidDensity;
    const tempDropC = flushMassKgS > 0 ? actualCoolerHeatRemovalKW / (flushMassKgS * fluidCp) : 0;
    sealChamberOperatingTempC = Math.max(inputs.coolingWaterSupplyTempC + 10, inputs.processFluidTempC - tempDropC);
    coolerCoolingWaterFlowLpm = (actualCoolerHeatRemovalKW / (4.184 * 5)) * 60;
    coolingAdequate = actualCoolerHeatRemovalKW >= coolerDutyRequiredKW * 0.9;
  } else if (inputs.planId === 'plan_23') {
    // Plan 23 cools only the local seal chamber recirculation loop (high efficiency)
    coolerDutyRequiredKW = totalHeatToDissipateKW * 1.15;
    const coolerCapacity = inputs.coolerCapacityKW > 0 ? inputs.coolerCapacityKW : 4.0;
    actualCoolerHeatRemovalKW = Math.min(coolerCapacity, coolerDutyRequiredKW);
    sealChamberOperatingTempC = Math.max(inputs.coolingWaterSupplyTempC + 8, inputs.coolingWaterSupplyTempC + 15 + (totalHeatToDissipateKW / (actualCoolerHeatRemovalKW + 0.1)) * 10);
    coolerCoolingWaterFlowLpm = (actualCoolerHeatRemovalKW / (4.184 * 5)) * 60;
    coolingAdequate = actualCoolerHeatRemovalKW >= coolerDutyRequiredKW * 0.9;
  } else if (inputs.planId === 'plan_32') {
    // Clean external flush at ambient or supply temp
    sealChamberOperatingTempC = 35 + (totalHeatToDissipateKW / (fluidCp * (actualFlushFlowLpm / 60000) * fluidDensity + 0.01));
  } else if (inputs.planId === 'plan_11' || inputs.planId === 'plan_13' || inputs.planId === 'plan_31') {
    const deltaTRise = actualFlushFlowLpm > 0 ? totalHeatToDissipateKW / (fluidCp * (actualFlushFlowLpm / 60000) * fluidDensity) : 25;
    sealChamberOperatingTempC = inputs.processFluidTempC + deltaTRise;
  } else {
    // Dual seals
    sealChamberOperatingTempC = inputs.processFluidTempC + 5;
    if (isDualPressurized) {
      coolerDutyRequiredKW = totalHeatToDissipateKW * 1.1;
      actualCoolerHeatRemovalKW = coolerDutyRequiredKW;
      coolerCoolingWaterFlowLpm = (coolerDutyRequiredKW / (4.184 * 5)) * 60;
    }
  }

  // 7. Vapor Pressure Margin Assessment
  const chamberFluidProps = getFluidProperties(inputs.processFluidType, sealChamberOperatingTempC);
  const pVapKPa = inputs.fluidVaporPressureOverrideKPa !== undefined && inputs.fluidVaporPressureOverrideKPa > 0
    ? inputs.fluidVaporPressureOverrideKPa
    : chamberFluidProps.pVapKPa;

  const chamberAbsPressureKPa = inputs.sealChamberPressureKPag + 101.325;
  const vaporPressureMarginKPa = chamberAbsPressureKPa - pVapKPa;
  
  // Approximate boiling temperature at chamber pressure
  const tBoilC = chamberFluidProps.tBoilAt1AtmC + (inputs.sealChamberPressureKPag / 100) * 28;
  const vaporPressureTempMarginC = Math.max(0, tBoilC - sealChamberOperatingTempC);

  // API 682 Criterion: Vapor pressure margin >= 140 kPa (20 psi) OR temp margin >= 10°C
  const api682VaporMarginCompliant = vaporPressureMarginKPa >= 140 || vaporPressureTempMarginC >= 10;

  auditTrail.push({
    title: '5. Seal Chamber Temperature & Vapor Margin',
    standardRef: 'API 682 4th Ed §6.1.2.19 / ISO 21049',
    formula: '\\text{Vapor Margin } \\Delta P_{vap} = P_{chamber,abs} - P_{vap}(T_{box}) \\ge 140\\text{ kPa}',
    substituted: `P_box = ${chamberAbsPressureKPa.toFixed(1)} kPa abs, T_box = ${sealChamberOperatingTempC.toFixed(1)}°C, P_vap = ${pVapKPa.toFixed(1)} kPa`,
    result: `Margin = ${vaporPressureMarginKPa.toFixed(1)} kPa (Temp Margin = ${vaporPressureTempMarginC.toFixed(1)}°C)`,
    unit: 'kPa / °C',
    isCompliant: api682VaporMarginCompliant,
  });

  // 8. Barrier / Buffer System Pressure Polarity & Margin Checks (API 682 4th Ed)
  const barrierPressureDifferentialKPa = inputs.barrierBufferPressureKPag - inputs.sealChamberPressureKPag;
  const requiredMinBarrierPressureKPag = inputs.sealChamberPressureKPag + 140; // API 682 minimum 140 kPa (20 psi) margin

  let api682BarrierMarginCompliant = true;
  let isPressureDifferentialInverted = false;
  let differentialStateDescription = 'Normal';

  if (isDualPressurized) {
    if (barrierPressureDifferentialKPa < 0) {
      isPressureDifferentialInverted = true;
      api682BarrierMarginCompliant = false;
      differentialStateDescription = `Negative Barrier Differential (${barrierPressureDifferentialKPa.toFixed(0)} kPa) - Inverted!`;
      planSpecificWarnings.push(
        `CRITICAL: Plan ${inputs.planId.toUpperCase()} barrier fluid pressure (${inputs.barrierBufferPressureKPag} kPag) is LOWER than seal chamber pressure (${inputs.sealChamberPressureKPag} kPag). Dual barrier containment inverted: toxic process fluid will migrate into barrier loop.`
      );
    } else if (barrierPressureDifferentialKPa < 140) {
      api682BarrierMarginCompliant = false;
      differentialStateDescription = `Deficient Barrier Margin (+${barrierPressureDifferentialKPa.toFixed(0)} kPa < 140 kPa guideline minimum)`;
      planSpecificWarnings.push(
        `Barrier pressure differential (+${barrierPressureDifferentialKPa.toFixed(0)} kPa) is below the typical benchmark minimum of 140 kPa (20 psi).`
      );
    } else {
      differentialStateDescription = `Adequate Overpressure (+${barrierPressureDifferentialKPa.toFixed(0)} kPa differential)`;
    }
  } else if (isDualUnpressurized) {
    // For Plan 52: Buffer fluid MUST be lower than seal chamber pressure
    if (inputs.barrierBufferPressureKPag >= inputs.sealChamberPressureKPag) {
      isPressureDifferentialInverted = true;
      api682BarrierMarginCompliant = false;
      differentialStateDescription = `Buffer Overpressurization (${inputs.barrierBufferPressureKPag} kPag >= ${inputs.sealChamberPressureKPag} kPag) - Inverted!`;
      planSpecificWarnings.push(
        `CRITICAL: Plan 52 buffer tank pressure (${inputs.barrierBufferPressureKPag} kPag) is HIGHER than or equal to seal chamber pressure (${inputs.sealChamberPressureKPag} kPag). Inner seal faces are improperly reverse-pressurized and may blow open.`
      );
    } else {
      differentialStateDescription = `Adequate Buffer Underpressure (${inputs.barrierBufferPressureKPag} kPag < ${inputs.sealChamberPressureKPag} kPag)`;
    }
  }

  // Accumulator check for Plan 53B
  let accumulatorMarginKPa: number | undefined;
  if (inputs.planId === 'plan_53b') {
    accumulatorMarginKPa = inputs.barrierBufferPressureKPag - inputs.accumulatorPrechargeKPag;
  }

  // 9. PV Limit Check
  let maxAllowablePV = 35;
  if (inputs.faceMaterials === 'sic_vs_sic') maxAllowablePV = 45;
  if (inputs.faceMaterials === 'tc_vs_tc') maxAllowablePV = 50;
  const pvLimitCompliant = pvValueMPaMs <= maxAllowablePV;

  // 10. Specific Plan Warnings & Logic
  if (inputs.planId === 'plan_21' && !coolingAdequate) {
    planSpecificWarnings.push('Cooler heat removal capacity is insufficient for the process flush duty. High risk of cooler heat saturation.');
  }

  if (inputs.planId === 'plan_32') {
    planSpecificWarnings.push('Plan 32 uses external flush: Verify that flush fluid is chemically compatible with process fluid and that downstream process can tolerate dilution.');
    if (inputs.externalFlushPressureKPag < inputs.sealChamberPressureKPag + 100) {
      planSpecificWarnings.push('External flush pressure is too low (< P_chamber + 100 kPa); process slurry may backflow into seal chamber.');
    }
  }

  if (inputs.planId === 'plan_62') {
    planSpecificWarnings.push('Plan 62 Quench Service: Ensure quench supply pressure does not exceed 35 kPag (5 psig) to prevent dislodging the throttle bushing or lip seal. Verify open quench drain piping.');
  }

  if (isDualPressurized && inputs.barrierBufferPressureKPag > inputs.sealChamberPressureKPag + 3500) {
    planSpecificWarnings.push('Barrier pressure is excessively high relative to seal chamber (> 3.5 MPa diff). Risk of inner seal face distortion or reverse pressure over-stress.');
  }

  // 11. Status Assessment & Recommendations
  const recommendations: string[] = [];
  let statusLevel: 'safe' | 'warning' | 'critical' = 'safe';
  let statusLabel = `${SEAL_PLAN_INFO[inputs.planId].name} Operating Envelope Normal`;
  let statusMessage = `Seal face heat generation (${totalHeatToDissipateKW.toFixed(2)} kW) is safely dissipated. Seal chamber fluid vapor margin (${vaporPressureMarginKPa.toFixed(0)} kPa) satisfies standard reliability benchmarks.`;
  let healthScore = 96;

  if (isPressureDifferentialInverted) {
    statusLevel = 'critical';
    statusLabel = isDualPressurized ? 'Barrier Pressure Inversion (Process Contamination Risk)' : 'Buffer Tank Overpressure (Seal Face Inversion)';
    statusMessage = isDualPressurized
      ? `Barrier pressure (${inputs.barrierBufferPressureKPag} kPag) is LOWER than chamber pressure (${inputs.sealChamberPressureKPag} kPag). Barrier containment is broken; process fluid will cross inner faces into barrier loop.`
      : `Buffer tank pressure (${inputs.barrierBufferPressureKPag} kPag) is higher than chamber pressure (${inputs.sealChamberPressureKPag} kPag). Plan 52 unpressurized buffer is inverted, blowing inner faces open.`;
    healthScore = 10;
    recommendations.push(isDualPressurized ? `Increase barrier supply pressure to at least ${requiredMinBarrierPressureKPag.toFixed(0)} kPag (P_box + 140 kPa).` : 'Vent buffer tank to flare to restore unpressurized atmospheric buffer condition.');
  } else if (isDualPressurized && barrierPressureDifferentialKPa < 140) {
    statusLevel = 'critical';
    statusLabel = 'Barrier Pressure Deficit (Risk of Process Migration)';
    statusMessage = `Barrier pressure differential (${barrierPressureDifferentialKPa.toFixed(0)} kPa) is below the mandatory API 682 minimum of 140 kPa (20 psi) above seal chamber pressure (${inputs.sealChamberPressureKPag} kPag). Toxic or hazardous process fluid may migrate across inner faces.`;
    healthScore = 18;
    recommendations.push(`Increase barrier supply pressure to at least ${(requiredMinBarrierPressureKPag).toFixed(0)} kPag.`);
    recommendations.push('Inspect nitrogen supply regulator, check bladder pre-charge (Plan 53B), or verify piston stroke (Plan 53C).');
  } else if (!api682VaporMarginCompliant) {
    statusLevel = 'critical';
    statusLabel = 'Fluid Vaporization / Flashing at Seal Faces';
    statusMessage = `Vapor pressure margin (${vaporPressureMarginKPa.toFixed(0)} kPa / ${vaporPressureTempMarginC.toFixed(1)}°C) is inadequate. Fluid will boil and flash across seal faces, leading to dry running, thermal shock, and rapid seal destruction.`;
    healthScore = 25;
    recommendations.push('Switch to Plan 21 or Plan 23 with heat exchanger to cool seal chamber below fluid boiling point.');
    recommendations.push(`Increase flush orifice diameter from ${orfDiaMm} mm to increase cooling circulation flow.`);
    recommendations.push('Increase seal chamber pressure with a close-clearance throat bushing.');
  } else if (['plan_11', 'plan_13', 'plan_21'].includes(inputs.planId) && actualOrificeFlowLpm < requiredFlushFlowLpm) {
    statusLevel = 'warning';
    statusLabel = 'Insufficient Flush Flow Rate';
    statusMessage = `Calculated flush flow (${actualOrificeFlowLpm.toFixed(2)} L/min) is below required ${requiredFlushFlowLpm.toFixed(2)} L/min to keep seal chamber temperature rise within ${allowableDeltaTC}°C.`;
    healthScore = 62;
    const recommendedDia = (orfDiaMm * Math.sqrt(requiredFlushFlowLpm / Math.max(0.1, actualOrificeFlowLpm))).toFixed(1);
    recommendations.push(`Increase restriction orifice diameter from ${orfDiaMm} mm to at least ${recommendedDia} mm.`);
    recommendations.push('Verify piping friction loss and check for strainer clogging.');
  } else if (!coolingAdequate) {
    statusLevel = 'warning';
    statusLabel = 'Cooler Capacity Margin Deficit';
    statusMessage = `Required cooler heat duty (${coolerDutyRequiredKW.toFixed(2)} kW) exceeds heat exchanger capacity. Seal chamber will run hotter than design target.`;
    healthScore = 65;
    recommendations.push('Increase cooling water flow rate or lower cooling water supply temperature.');
    recommendations.push('Select higher capacity heat exchanger or clean fouled cooler tubing.');
  } else if (!pvLimitCompliant) {
    statusLevel = 'warning';
    statusLabel = 'High PV Severity Factor';
    statusMessage = `Operating PV factor (${pvValueMPaMs.toFixed(1)} MPa·m/s) exceeds recommended limit for ${inputs.faceMaterials}. Accelerated face wear expected.`;
    healthScore = 68;
    recommendations.push('Upgrade seal face material combination to Silicon Carbide vs Silicon Carbide (SiC vs SiC) or Tungsten Carbide.');
    recommendations.push('Review seal balance ratio K (recommend 0.72 - 0.76).');
  }

  const status: StatusAssessment = {
    level: statusLevel,
    score: healthScore,
    label: statusLabel,
    message: statusMessage,
    recommendations,
  };

  return {
    sealFaceAreaMm2: faceArea_mm2,
    meanFaceRadiusMm: meanRadius_mm,
    slidingVelocityMs,
    netFaceClosingPressureKPa: netFacePressureKPa,
    pvValueMPaMs,
    sealFaceHeatGenKW: Q_face_KW,
    heatSoakFromPumpKW: heatSoakKW,
    totalHeatToDissipateKW,
    requiredFlushFlowLpm,
    actualFlushFlowLpm,
    actualOrificeFlowLpm,
    pressureDrops,
    sealChamberOperatingTempC,
    fluidVaporPressureAtChamberTempKPa: pVapKPa,
    vaporPressureMarginKPa,
    vaporPressureTempMarginC,
    barrierPressureDifferentialKPa,
    requiredMinBarrierPressureKPag,
    coolerDutyRequiredKW,
    actualCoolerHeatRemovalKW,
    coolerCoolingWaterFlowLpm,
    accumulatorMarginKPa,
    api682VaporMarginCompliant,
    api682BarrierMarginCompliant,
    isPressureDifferentialInverted,
    differentialStateDescription,
    pvLimitCompliant,
    coolingAdequate,
    planSpecificWarnings,
    status,
    auditTrail,
  };
}

export const calculateSealPlan = calculateSeal;
