/**
 * Rolling Element Bearing Rating Life Calculations
 * 
 * Implements ISO 281:2007 basic (L10) and modified (L10m / aISO) rating life standards,
 * viscosity ratio (kappa) calculations, reliability factors, and API 610 compliance rules.
 */

export type BearingType = 'ball' | 'roller';

export interface BearingGeometry {
  designation: string;
  type: BearingType;
  boreMm: number;
  outerDiameterMm: number;
  pitchDiameterMm?: number; // dm = (d + D) / 2
  dynamicLoadRatingC_kN: number; // C in kN
  staticLoadRatingC0_kN: number; // C0 in kN
  limitingSpeedRpm: number;
}

export interface BearingLifeResults {
  equivalentLoadP_kN: number;
  lifeExponent: number; // 3 for ball, 10/3 for roller
  l10MillionRevolutions: number;
  l10OperatingHours: number;
  viscosityRatioKappa: number;
  referenceViscosityNu1: number; // cSt
  reliabilityFactorA1: number;
  modifiedLifeHoursL10m: number;
  api610Pass: boolean; // Requires L10h >= 25,000 hrs
  status: 'safe' | 'warning' | 'critical';
  warnings: string[];
}

/**
 * Standard ISO 281 a1 Reliability Factors
 */
export const ISO_281_RELIABILITY_A1: Record<number, number> = {
  90: 1.0,   // Standard 90% reliability (L10)
  95: 0.64,  // 95% reliability (L5)
  96: 0.55,
  97: 0.47,
  98: 0.37,
  99: 0.21,  // 99% reliability (L1)
};

/**
 * Calculate ISO 281 Reference Kinematic Viscosity (nu1)
 * Formula:
 * nu1 = 45000 * (n^-0.83) * (dm^-0.5) for n < 1000 RPM
 * nu1 = 45000 * (n^-0.83) * (dm^-0.5) (cSt)
 *
 * @param speedRpm - Shaft rotational speed in RPM
 * @param pitchDiameterMm - Bearing pitch diameter dm = (d + D)/2 in mm
 */
export function calculateReferenceViscosityNu1(speedRpm: number, pitchDiameterMm: number): number {
  if (speedRpm <= 0 || pitchDiameterMm <= 0) return 20.0;
  const n = Math.max(10, speedRpm);
  const dm = Math.max(10, pitchDiameterMm);
  return 45000.0 * Math.pow(n, -0.83) * Math.pow(dm, -0.5);
}

/**
 * Calculate Bearing Viscosity Ratio (kappa)
 * Formula: kappa = nu / nu1
 *
 * @param actualViscosityCSt - Lubricant operating kinematic viscosity at temp (cSt)
 * @param refViscosityNu1 - Reference kinematic viscosity (cSt)
 */
export function calculateViscosityRatioKappa(
  actualViscosityCSt: number,
  refViscosityNu1: number
): number {
  if (refViscosityNu1 <= 0) return 1.0;
  return Math.max(0.01, actualViscosityCSt / refViscosityNu1);
}

/**
 * Calculate ISO 281 aISO Lubrication / Contamination Factor
 * Simplified ISO 281 / DIN ISO 281 Annex A approximation:
 * 
 * e_C: Contamination factor (0.1 = severe, 0.5 = normal, 0.8 = high cleanliness)
 * kappa: Viscosity ratio
 * Pu / P: Fatigue load limit ratio
 */
export function calculateAISO(
  kappa: number,
  contaminationFactorEc = 0.5,
  loadRatioPuOverP = 0.1
): number {
  const k = Math.max(0.1, Math.min(4.0, kappa));
  const ec = Math.max(0.1, Math.min(1.0, contaminationFactorEc));

  // ISO 281 curve polynomial fit for aISO
  let aIso = 0.1 + (ec * Math.pow(k, 0.4) * (1.0 + 2.0 * loadRatioPuOverP));
  return Math.max(0.1, Math.min(50.0, aIso));
}

/**
 * Calculate Equivalent Dynamic Radial Load P
 * Formula: P = X * F_r + Y * F_a
 *
 * @param radialLoadFr_kN - Applied radial load in kN
 * @param axialLoadFa_kN - Applied axial load in kN
 * @param xFactor - Radial load factor X (default 1.0 for pure radial)
 * @param yFactor - Axial load factor Y (default 0.0 for pure radial)
 */
export function calculateEquivalentLoad(
  radialLoadFr_kN: number,
  axialLoadFa_kN: number,
  xFactor = 1.0,
  yFactor = 0.0
): number {
  const p = xFactor * Math.max(0, radialLoadFr_kN) + yFactor * Math.max(0, axialLoadFa_kN);
  return Math.max(0.001, p);
}

/**
 * Calculate Basic Rating Life L10 (Million Revolutions & Operating Hours)
 * 
 * Formula:
 * L10 = (C / P)^p  [Million revolutions]
 * L10h = (10^6 / (60 * RPM)) * L10  [Operating hours]
 * 
 * Life exponent p:
 * p = 3 for Ball Bearings (point contact)
 * p = 10/3 (~3.3333) for Roller Bearings (line contact)
 */
export function calculateBasicRatingLife(
  dynamicLoadRatingC_kN: number,
  equivalentLoadP_kN: number,
  speedRpm: number,
  bearingType: BearingType = 'ball'
): { l10MillionRev: number; l10Hours: number; exponent: number } {
  const p = bearingType === 'ball' ? 3.0 : 10.0 / 3.0;
  const loadRatio = Math.max(0.001, dynamicLoadRatingC_kN) / Math.max(0.001, equivalentLoadP_kN);
  const l10MillionRev = Math.pow(loadRatio, p);

  const l10Hours = speedRpm > 0 ? (1e6 / (60.0 * speedRpm)) * l10MillionRev : 0;

  return { l10MillionRev, l10Hours, exponent: p };
}

/**
 * Comprehensive ISO 281 & API 610 Bearing Life Evaluation
 */
export function evaluateBearingLife(params: {
  bearing: BearingGeometry;
  radialLoadFr_kN: number;
  axialLoadFa_kN: number;
  speedRpm: number;
  oilViscosityAtOperatingTempCSt?: number;
  reliabilityPercent?: number; // 90, 95, 99
  contaminationFactorEc?: number; // 0.1 to 1.0
  xFactor?: number;
  yFactor?: number;
}): BearingLifeResults {
  const warnings: string[] = [];
  const { bearing, radialLoadFr_kN, axialLoadFa_kN, speedRpm } = params;

  const pitchDia = bearing.pitchDiameterMm || (bearing.boreMm + bearing.outerDiameterMm) / 2.0;
  const pLoad = calculateEquivalentLoad(
    radialLoadFr_kN,
    axialLoadFa_kN,
    params.xFactor ?? 1.0,
    params.yFactor ?? 0.0
  );

  const { l10MillionRev, l10Hours, exponent } = calculateBasicRatingLife(
    bearing.dynamicLoadRatingC_kN,
    pLoad,
    speedRpm,
    bearing.type
  );

  const nu1 = calculateReferenceViscosityNu1(speedRpm, pitchDia);
  const actualVisc = params.oilViscosityAtOperatingTempCSt ?? nu1; // Default to ideal if not specified
  const kappa = calculateViscosityRatioKappa(actualVisc, nu1);

  const relPct = params.reliabilityPercent || 90;
  const a1 = ISO_281_RELIABILITY_A1[relPct] || 1.0;
  const aIso = calculateAISO(kappa, params.contaminationFactorEc || 0.5);

  const modifiedLifeHoursL10m = l10Hours * a1 * aIso;

  // API 610 Clause 6.10.1.1 Requirement: Minimum L10h >= 25,000 hours continuous
  const api610Pass = l10Hours >= 25000.0;

  let status: 'safe' | 'warning' | 'critical' = 'safe';

  if (l10Hours < 16000.0) {
    status = 'critical';
    warnings.push(
      `PREMATURE BEARING FATIGUE: Calculated L10h (${Math.round(l10Hours).toLocaleString()} hrs) is far below industrial standards (< 16,000 hrs). Reduce radial/axial loads or upsize bearing.`
    );
  } else if (!api610Pass) {
    status = 'warning';
    warnings.push(
      `API 610 NON-COMPLIANCE: L10h (${Math.round(l10Hours).toLocaleString()} hrs) is below the API 610 minimum continuous requirement of 25,000 operating hours.`
    );
  }

  if (kappa < 0.4) {
    warnings.push(
      `INSUFFICIENT LUBRICANT FILM: Viscosity ratio kappa (${kappa.toFixed(2)}) is < 0.4. Severe boundary lubrication with metal-to-metal contact and adhesive wear will occur.`
    );
  } else if (kappa > 4.0) {
    warnings.push(
      `EXCESSIVE VISCOSITY: Viscosity ratio kappa (${kappa.toFixed(2)}) is > 4.0. High fluid churning, viscous shear friction, and elevated bearing operating temperatures expected.`
    );
  }

  if (speedRpm > bearing.limitingSpeedRpm) {
    warnings.push(
      `OVERSPEED: Operating speed (${speedRpm} RPM) exceeds manufacturer limiting speed (${bearing.limitingSpeedRpm} RPM). Risk of cage fracture and thermal runaway.`
    );
  }

  return {
    equivalentLoadP_kN: pLoad,
    lifeExponent: exponent,
    l10MillionRevolutions: l10MillionRev,
    l10OperatingHours: l10Hours,
    viscosityRatioKappa: kappa,
    referenceViscosityNu1: nu1,
    reliabilityFactorA1: a1,
    modifiedLifeHoursL10m,
    api610Pass,
    status,
    warnings,
  };
}
