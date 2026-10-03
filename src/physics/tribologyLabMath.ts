/**
 * Lubrication Tribology, ISO 4406 Cleanliness, ASTM D341 Viscosity,
 * Karl Fischer Water Ingress, Ferrography & Relubrication Engine
 *
 * Governing Reference Frameworks:
 * - ISO 4406:2021 (Hydraulic fluid power — Fluids — Method for coding the level of contamination by solid particles)
 * - ASTM D341-20 (Standard Practice for Viscosity-Temperature Charts for Liquid Petroleum Products)
 * - ASTM D2270 (Standard Practice for Calculating Viscosity Index from Kinematic Viscosity at 40 and 100°C)
 * - AGMA 9005-F16 / ISO 12925-1 (Industrial Gear Lubrication)
 * - DIN 51825 / SKF Relubrication Standard
 *
 * Academic reference benchmark for rotating equipment condition monitoring.
 */

export interface Iso4406Assessment {
  count4um: number;
  count6um: number;
  count14um: number;
  code4um: number;
  code6um: number;
  code14um: number;
  codeString: string; // e.g. "18/16/13"
  cleanlinessClass: 'Ultra Clean' | 'Clean' | 'Acceptable' | 'Contaminated' | 'Critical Failure Risk';
  targetCodeForMachine: string;
  isCompliantWithTarget: boolean;
  lifeExtensionFactor: number; // e.g. 2.4x
  filterRecommendation: {
    micronRating: string;
    targetBetaRatio: number;
    recommendedOfflineFiltration: boolean;
  };
}

export interface IsoVgGrade {
  name: string;
  cStAt40C: number;
  cStAt100C: number;
  approxVI: number;
  typicalDensity: number; // kg/m³
}

export const STANDARD_ISO_VG_GRADES: Record<string, IsoVgGrade> = {
  'VG 32': { name: 'ISO VG 32 (Light Turbine/Spindle)', cStAt40C: 32.0, cStAt100C: 5.4, approxVI: 102, typicalDensity: 855 },
  'VG 46': { name: 'ISO VG 46 (Heavy Turbine/Centrifugal Comp)', cStAt40C: 46.0, cStAt100C: 6.8, approxVI: 101, typicalDensity: 865 },
  'VG 68': { name: 'ISO VG 68 (Centrifugal Pump / Blower)', cStAt40C: 68.0, cStAt100C: 8.7, approxVI: 98, typicalDensity: 875 },
  'VG 100': { name: 'ISO VG 100 (Reciprocating Compressor/Fan)', cStAt40C: 100.0, cStAt100C: 11.4, approxVI: 96, typicalDensity: 882 },
  'VG 150': { name: 'ISO VG 150 (Medium Duty Helical Gear)', cStAt40C: 150.0, cStAt100C: 15.0, approxVI: 95, typicalDensity: 888 },
  'VG 220': { name: 'ISO VG 220 (Standard Industrial Gearbox)', cStAt40C: 220.0, cStAt100C: 19.4, approxVI: 95, typicalDensity: 893 },
  'VG 320': { name: 'ISO VG 320 (Heavy Duty Worm/Planetary)', cStAt40C: 320.0, cStAt100C: 24.5, approxVI: 94, typicalDensity: 898 },
  'VG 460': { name: 'ISO VG 460 (Extreme Load / Kiln Drive)', cStAt40C: 460.0, cStAt100C: 31.0, approxVI: 93, typicalDensity: 904 },
};

/**
 * Convert particle count per mL to ISO 4406 scale number (1 to 28)
 */
export function getIso4406Code(countPerMl: number): number {
  if (countPerMl <= 0.01) return 1;
  // ISO 4406 table steps double every code level:
  // Code 24: >80,000 to 160,000
  // Code 18: >1,300 to 2,500
  // Formula: R = ceil( log2(count / 0.01) )
  const code = Math.ceil(Math.log2(Math.max(countPerMl, 0.01) / 0.01));
  return Math.min(Math.max(code, 1), 28);
}

/**
 * Calculate ISO 4406 Particle Contamination Assessment
 */
export function calculateIso4406Assessment(params: {
  count4um: number;
  count6um: number;
  count14um: number;
  machineType: 'turbine' | 'compressor' | 'pump' | 'gearbox' | 'bearing';
}): Iso4406Assessment {
  const { count4um, count6um, count14um, machineType } = params;

  const code4 = getIso4406Code(count4um);
  const code6 = getIso4406Code(count6um);
  const code14 = getIso4406Code(count14um);
  const codeString = `${code4}/${code6}/${code14}`;

  // Standard target limits per EPRI / ISO recommendations
  let targetCode = '17/15/12';
  let targetMax4 = 17;
  let targetMax6 = 15;
  let targetMax14 = 12;

  switch (machineType) {
    case 'turbine':
      targetCode = '16/14/11';
      targetMax4 = 16;
      targetMax6 = 14;
      targetMax14 = 11;
      break;
    case 'compressor':
      targetCode = '17/15/12';
      targetMax4 = 17;
      targetMax6 = 15;
      targetMax14 = 12;
      break;
    case 'pump':
      targetCode = '18/16/13';
      targetMax4 = 18;
      targetMax6 = 16;
      targetMax14 = 13;
      break;
    case 'gearbox':
      targetCode = '18/16/13';
      targetMax4 = 18;
      targetMax6 = 16;
      targetMax14 = 13;
      break;
    case 'bearing':
      targetCode = '16/14/11';
      targetMax4 = 16;
      targetMax6 = 14;
      targetMax14 = 11;
      break;
  }

  const isCompliant = code4 <= targetMax4 && code6 <= targetMax6 && code14 <= targetMax14;

  let cleanlinessClass: Iso4406Assessment['cleanlinessClass'] = 'Clean';
  if (code4 <= 14) cleanlinessClass = 'Ultra Clean';
  else if (code4 <= 17) cleanlinessClass = 'Clean';
  else if (code4 <= 19) cleanlinessClass = 'Acceptable';
  else if (code4 <= 21) cleanlinessClass = 'Contaminated';
  else cleanlinessClass = 'Critical Failure Risk';

  // Noria / Fitch Life Extension Factor (LEF) empirical multiplier
  // Cleaning up from e.g. 21/18/15 to 16/14/11 gives ~2.5x - 3.2x life extension
  const codeDelta = Math.max(0, code6 - targetMax6);
  let lifeExtensionFactor = 1.0;
  if (codeDelta === 0) {
    lifeExtensionFactor = 1.5;
  } else {
    // If current is dirty, cleaning up grants massive life extension
    lifeExtensionFactor = Math.min(4.5, 1.0 + codeDelta * 0.45);
  }

  return {
    count4um,
    count6um,
    count14um,
    code4um: code4,
    code6um: code6,
    code14um: code14,
    codeString,
    cleanlinessClass,
    targetCodeForMachine: targetCode,
    isCompliantWithTarget: isCompliant,
    lifeExtensionFactor: Number(lifeExtensionFactor.toFixed(2)),
    filterRecommendation: {
      micronRating: code6 > 17 ? '3 µm Absolute' : '6 µm Absolute',
      targetBetaRatio: 1000,
      recommendedOfflineFiltration: code4 > 19,
    },
  };
}

/**
 * ASTM D341 Walther Equation Solver for Viscosity-Temperature
 * log10(log10(Z)) = A - B * log10(T_Kelvin)
 * where Z = nu + 0.7 (standard ASTM formulation for nu > 2 cSt)
 */
export function calculateViscosityAtTemp(
  cStAt40C: number,
  cStAt100C: number,
  targetTempC: number
): {
  viscosityAtTemp: number;
  viscosityIndex: number;
  filmParameterKappa: number;
  regime: 'Boundary' | 'Mixed' | 'Full Fluid EHL' | 'Excessive Viscous Drag';
} {
  const t1_K = 40 + 273.15; // 313.15 K
  const t2_K = 100 + 273.15; // 373.15 K
  const tTarget_K = Math.max(targetTempC + 273.15, 220);

  // ASTM D341 Z parameter
  const z1 = cStAt40C + 0.7;
  const z2 = cStAt100C + 0.7;

  const w1 = Math.log10(Math.log10(Math.max(z1, 1.01)));
  const w2 = Math.log10(Math.log10(Math.max(z2, 1.01)));

  // Slope B = (w1 - w2) / (log10(T2) - log10(T1))
  const slopeB = (w1 - w2) / (Math.log10(t2_K) - Math.log10(t1_K));
  // Intercept A = w1 + B * log10(T1)
  const interceptA = w1 + slopeB * Math.log10(t1_K);

  // Evaluate at target temp
  const wTarget = interceptA - slopeB * Math.log10(tTarget_K);
  const zTarget = Math.pow(10, Math.pow(10, wTarget));
  const nuTarget = Math.max(0.5, zTarget - 0.7);

  // Approximate ASTM D2270 Viscosity Index (VI)
  const vi = Math.round(
    Math.max(
      40,
      100 +
        ((Math.pow(10, (Math.log10(cStAt40C) - 1.5) / 0.5) - cStAt100C) /
          (cStAt100C * 0.0075))
    )
  );

  // EHL reference viscosity nu_1 (approx for standard 1500 RPM, 65 mm bearing)
  const nu1_reference = 14.5; // cSt
  const kappa = nuTarget / nu1_reference;

  let regime: 'Boundary' | 'Mixed' | 'Full Fluid EHL' | 'Excessive Viscous Drag' = 'Full Fluid EHL';
  if (kappa < 0.4) regime = 'Boundary';
  else if (kappa < 1.0) regime = 'Mixed';
  else if (kappa <= 3.8) regime = 'Full Fluid EHL';
  else regime = 'Excessive Viscous Drag';

  return {
    viscosityAtTemp: Number(nuTarget.toFixed(1)),
    viscosityIndex: vi,
    filmParameterKappa: Number(kappa.toFixed(2)),
    regime,
  };
}

/**
 * Karl Fischer Water Ingress & Saturation Threshold
 */
export function calculateWaterContamination(params: {
  waterPpm: number;
  tempC: number;
  oilBase: 'mineral' | 'synthetic_pao' | 'ester';
}): {
  saturationLimitPpm: number;
  state: 'Dissolved Water (Clear)' | 'Emulsified Micro-Droplets (Hazy/Milky)' | 'Free Water Pooling';
  bearingLifeDeratingFactor: number;
  corrosionRisk: 'Negligible' | 'Moderate' | 'Severe / Hydrogen Embrittlement';
} {
  const { waterPpm, tempC, oilBase } = params;

  // Empirical moisture saturation curves (Arrhenius relation)
  // At 40°C: Mineral ~ 200 ppm, PAO ~ 300 ppm, Ester ~ 1200 ppm
  let baseAt40 = 200;
  if (oilBase === 'synthetic_pao') baseAt40 = 300;
  if (oilBase === 'ester') baseAt40 = 1200;

  // Temp sensitivity: Saturation roughly doubles every 20°C
  const saturationLimit = Math.round(baseAt40 * Math.pow(1.035, tempC - 40));

  let state: 'Dissolved Water (Clear)' | 'Emulsified Micro-Droplets (Hazy/Milky)' | 'Free Water Pooling' =
    'Dissolved Water (Clear)';
  if (waterPpm <= saturationLimit) {
    state = 'Dissolved Water (Clear)';
  } else if (waterPpm <= saturationLimit * 2.2) {
    state = 'Emulsified Micro-Droplets (Hazy/Milky)';
  } else {
    state = 'Free Water Pooling';
  }

  // Bearing fatigue life reduction factor a_water = (100 / max(100, ppm))^0.6
  // E.g. 100 ppm -> 1.0; 400 ppm -> 0.43 (57% life reduction); 1000 ppm -> 0.25 (75% life reduction)
  const lifeFactor = Math.min(1.0, Math.pow(100 / Math.max(100, waterPpm), 0.6));

  let corrosionRisk: 'Negligible' | 'Moderate' | 'Severe / Hydrogen Embrittlement' = 'Negligible';
  if (waterPpm > 600) corrosionRisk = 'Severe / Hydrogen Embrittlement';
  else if (waterPpm > saturationLimit) corrosionRisk = 'Moderate';

  return {
    saturationLimitPpm: saturationLimit,
    state,
    bearingLifeDeratingFactor: Number(lifeFactor.toFixed(2)),
    corrosionRisk,
  };
}

/**
 * Wear Particle Morphology & Analytical Ferrography Guide
 */
export interface WearDebrisMorphology {
  id: string;
  name: string;
  typicalSizeMicrons: string;
  microscopeAppearance: string;
  rootCauseMechanism: string;
  severityLevel: 'normal' | 'caution' | 'critical';
  recommendedAction: string;
}

export const WEAR_DEBRIS_LIBRARY: WearDebrisMorphology[] = [
  {
    id: 'rubbing-wear',
    name: 'Normal Rubbing Wear Platelets',
    typicalSizeMicrons: '0.5 to 15 µm',
    microscopeAppearance: 'Flat, smooth, thin plates with aspect ratio > 10:1',
    rootCauseMechanism: 'Benign benign shear polishing during normal hydrodynamic/EHL running.',
    severityLevel: 'normal',
    recommendedAction: 'Routine oil drain and scheduled filter sampling.',
  },
  {
    id: 'cutting-wear',
    name: 'Cutting & Machining Curls',
    typicalSizeMicrons: '10 to 100 µm',
    microscopeAppearance: 'Spiral, curved lathe-like turnings and ribbons with sharp jagged edges',
    rootCauseMechanism: 'Three-body abrasive grit contamination embedding in softer surface and gouging harder counterpart.',
    severityLevel: 'critical',
    recommendedAction: 'Immediate offline 3-micron filtration; inspect breather seals and desiccant caps for silica dust ingress.',
  },
  {
    id: 'rolling-fatigue',
    name: 'Rolling Fatigue Spall Flakes',
    typicalSizeMicrons: '20 to 120 µm',
    microscopeAppearance: 'Chunky, thick metallic fragments with irregular micro-cracked borders and rough fracture surfaces',
    rootCauseMechanism: 'Sub-surface shear stress exceeding fatigue endurance limit, causing micro-pit crater spallation.',
    severityLevel: 'critical',
    recommendedAction: 'Plan bearing replacement at earliest planned outage; sample lubrication oil for metallic wear debris (ISO 4406).',
  },
  {
    id: 'severe-sliding',
    name: 'Severe Sliding & Scuffing Shards',
    typicalSizeMicrons: '15 to 80 µm',
    microscopeAppearance: 'Parallel striations and micro-grooves along sliding direction; darkened tempered borders',
    rootCauseMechanism: 'High load or low viscosity causing EHL breakdown, asperity micro-welding, and tearing.',
    severityLevel: 'caution',
    recommendedAction: 'Upgrade lubricant to higher ISO VG grade or synthetic formulation; inspect gearbox cooling loop.',
  },
  {
    id: 'spherical-debris',
    name: 'Spherical Micro-Debris',
    typicalSizeMicrons: '1 to 5 µm',
    microscopeAppearance: 'Perfect, glossy micro-spheres formed by molten metal quenching',
    rootCauseMechanism: 'Fatigue micro-crack propagation producing high flash friction temperatures, melting microscopic steel droplets.',
    severityLevel: 'caution',
    recommendedAction: 'Indicator of rolling element micro-cracking; monitor high-frequency acceleration envelope.',
  },
  {
    id: 'non-ferrous-smear',
    name: 'Bronze / Babbitt Alloy Wear Smear',
    typicalSizeMicrons: '5 to 60 µm',
    microscopeAppearance: 'Golden/bronze or dull silver malleable sheets with feathered edges',
    rootCauseMechanism: 'Bearing retainer/cage pocket rubbing or journal tilting-pad babbitt wiping.',
    severityLevel: 'critical',
    recommendedAction: 'Audit lube oil supply pressure, jacking oil pump lift, and bearing temperature alarms.',
  },
];

/**
 * SKF / DIN 51825 Grease Relubrication Interval Calculator
 */
export function calculateGreaseRelubeInterval(params: {
  bearingBoreMm: number;
  outerDiameterMm: number;
  bearingWidthMm: number;
  rpm: number;
  bearingType: 'deep_groove_ball' | 'cylindrical_roller' | 'spherical_roller' | 'tapered_roller';
  tempC: number;
  environment: 'clean' | 'dusty' | 'severe_water';
  vibration: 'low' | 'moderate' | 'high';
}): {
  relubeIntervalHours: number;
  relubeIntervalDays: number;
  greaseQuantityGrams: number;
  pitchDiameterMm: number;
  ndmFactor: number;
} {
  const {
    bearingBoreMm,
    outerDiameterMm,
    bearingWidthMm,
    rpm,
    bearingType,
    tempC,
    environment,
    vibration,
  } = params;

  // Pitch diameter d_m = 0.5 * (d + D)
  const dm = 0.5 * (bearingBoreMm + outerDiameterMm);
  const ndm = rpm * dm;

  // Bearing type kinematic factor k
  let k = 1.0;
  if (bearingType === 'deep_groove_ball') k = 1.0;
  if (bearingType === 'cylindrical_roller') k = 0.5;
  if (bearingType === 'spherical_roller') k = 0.25;
  if (bearingType === 'tapered_roller') k = 0.2;

  // Base hours t_f formula (DIN 51825 approximation)
  // t_f0 = k * (14 * 10^6 / (rpm * sqrt(dm)) - 4 * dm)
  const denom = Math.max(rpm * Math.sqrt(Math.max(dm, 10)), 100);
  let baseHours = k * (14000000 / denom - 4 * dm);
  if (baseHours < 100) baseHours = 100;

  // Temperature correction factor f_temp (halves every 15°C above 70°C)
  let fTemp = 1.0;
  if (tempC > 70) {
    fTemp = Math.pow(0.5, (tempC - 70) / 15);
  }

  // Environmental dust/moisture correction
  let fEnv = 1.0;
  if (environment === 'dusty') fEnv = 0.6;
  if (environment === 'severe_water') fEnv = 0.3;

  // Vibration correction
  let fVib = 1.0;
  if (vibration === 'moderate') fVib = 0.7;
  if (vibration === 'high') fVib = 0.4;

  const finalHours = Math.max(48, Math.round(baseHours * fTemp * fEnv * fVib));
  const finalDays = Math.round(finalHours / 24);

  // Relubrication quantity G_q = 0.005 * D * B (grams) per DIN 51825
  const greaseGrams = Number((0.005 * outerDiameterMm * bearingWidthMm).toFixed(1));

  return {
    relubeIntervalHours: finalHours,
    relubeIntervalDays: finalDays,
    greaseQuantityGrams: Math.max(greaseGrams, 2.0),
    pitchDiameterMm: Number(dm.toFixed(1)),
    ndmFactor: Math.round(ndm),
  };
}
