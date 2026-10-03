/**
 * Piping Flexibility, Thermal Growth, Restraint Stress, and ASME B31.3 Compliance
 * 
 * Implements thermal elongation (deltaL = alpha * L * deltaT), restrained thermal stress,
 * internal pressure hoop stress (Barlow / ASME B31.3 Clause 304), and expansion loop sizing.
 */

export interface PipeMaterial {
  name: string;
  youngsModulusGpa: number; // E in GPa (e.g. 200 GPa for Carbon Steel)
  thermalExpansionAlpha: number; // alpha in 1e-6 / °C (e.g. 11.7 for Carbon Steel @ 100°C)
  allowableStressS_MPa: number; // Allowable stress S at operating temp (MPa)
  yieldStrengthMPa: number;
}

export interface PipeGeometryStress {
  outerDiameterMm: number; // Do in mm
  wallThicknessMm: number; // t in mm
  straightLengthM: number; // Unanchored length L in meters
  corrosionAllowanceMm?: number; // c in mm (default 1.5 mm for CS)
}

export interface PipeStressResults {
  innerDiameterMm: number;
  metalCrossSectionAreaMm2: number;
  temperatureDeltaC: number;
  freeThermalExpansionMm: number; // deltaL in mm
  restrainedAxialStressMPa: number; // sigma = E * alpha * deltaT
  restrainedAxialForceKn: number; // F = sigma * A
  hoopStressMPa: number; // sigma_hoop = (P * D) / (2 * t)
  longitudinalPressureStressMPa: number; // sigma_p = (P * D) / (4 * t)
  combinedRestrainedStressMPa: number; // Tresca or von Mises combination
  stressRatioPercent: number; // (Combined / Allowable) * 100
  requiredExpansionLoopLegM: number; // Guided cantilever loop sizing
  asmeB313Pass: boolean;
  status: 'safe' | 'warning' | 'critical';
  warnings: string[];
}

/**
 * Standard Pipe Material Properties (ASME B31.3 Table A-1)
 */
export const PIPE_MATERIAL_PRESETS: Record<string, PipeMaterial> = {
  carbonSteelA106B: {
    name: 'Carbon Steel (ASTM A106 Gr. B)',
    youngsModulusGpa: 200.0,
    thermalExpansionAlpha: 11.7, // 11.7 x 10^-6 m/(m·°C)
    allowableStressS_MPa: 138.0, // ~20.0 ksi @ up to 200°C
    yieldStrengthMPa: 240.0,
  },
  stainlessSteel316: {
    name: 'Austenitic Stainless Steel (ASTM A312 TP316)',
    youngsModulusGpa: 193.0,
    thermalExpansionAlpha: 16.5, // 16.5 x 10^-6 m/(m·°C)
    allowableStressS_MPa: 115.0, // ~16.7 ksi
    yieldStrengthMPa: 205.0,
  },
  lowAlloyChromeMoly: {
    name: 'Low Alloy Chrome-Moly (ASTM A335 P11)',
    youngsModulusGpa: 205.0,
    thermalExpansionAlpha: 12.5,
    allowableStressS_MPa: 145.0,
    yieldStrengthMPa: 275.0,
  },
  duplex2205: {
    name: 'Duplex Stainless Steel (UNS S31803)',
    youngsModulusGpa: 200.0,
    thermalExpansionAlpha: 13.0,
    allowableStressS_MPa: 175.0,
    yieldStrengthMPa: 450.0,
  },
};

/**
 * Calculate free linear thermal expansion of piping
 * Formula: deltaL = alpha * L * deltaT
 *
 * @param lengthM - Piping straight length in meters
 * @param deltaTempC - Temperature difference (T_operating - T_ambient) in °C
 * @param thermalExpansionAlpha_1e6 - Thermal expansion coefficient (x 10^-6 1/°C)
 * @returns Elongation deltaL in mm
 */
export function calculateThermalExpansion(
  lengthM: number,
  deltaTempC: number,
  thermalExpansionAlpha_1e6: number
): number {
  if (lengthM <= 0 || deltaTempC === 0) return 0;
  // deltaL (m) = L (m) * (alpha * 1e-6) * deltaT (°C)
  // deltaL (mm) = deltaL (m) * 1000
  const alphaSI = thermalExpansionAlpha_1e6 * 1e-6;
  return lengthM * alphaSI * deltaTempC * 1000.0;
}

/**
 * Calculate theoretical axial stress if pipe is 100% rigidly anchored
 * Formula: sigma_axial = E * alpha * deltaT (MPa)
 *
 * @param deltaTempC - Temperature delta in °C
 * @param youngsModulusGpa - Elastic Modulus E in GPa
 * @param thermalExpansionAlpha_1e6 - Thermal expansion coefficient (x 10^-6 1/°C)
 */
export function calculateRestrainedAxialStress(
  deltaTempC: number,
  youngsModulusGpa: number,
  thermalExpansionAlpha_1e6: number
): number {
  const E_MPa = youngsModulusGpa * 1000.0; // GPa to MPa (N/mm²)
  const alphaSI = thermalExpansionAlpha_1e6 * 1e-6;
  return E_MPa * alphaSI * Math.abs(deltaTempC);
}

/**
 * Calculate pipe metal cross-sectional area
 * Formula: A_metal = (pi / 4) * (Do^2 - Di^2)
 */
export function calculateMetalCrossSectionArea(
  outerDiameterMm: number,
  wallThicknessMm: number
): { areaMm2: number; innerDiameterMm: number } {
  const diMm = Math.max(1, outerDiameterMm - 2.0 * wallThicknessMm);
  const areaMm2 = (Math.PI / 4.0) * (Math.pow(outerDiameterMm, 2) - Math.pow(diMm, 2));
  return { areaMm2, innerDiameterMm: diMm };
}

/**
 * Calculate hoop (circumferential) stress from internal pressure (ASME B31.3 / Barlow equation)
 * Formula: sigma_hoop = (P * Do) / (2 * (t - c))
 *
 * @param pressureKPa - Internal design/operating pressure in kPa
 * @param outerDiameterMm - Pipe outer diameter in mm
 * @param wallThicknessMm - Nominal wall thickness in mm
 * @param corrosionAllowanceMm - Corrosion allowance in mm (default 0)
 * @returns Hoop stress in MPa
 */
export function calculateHoopStress(
  pressureKPa: number,
  outerDiameterMm: number,
  wallThicknessMm: number,
  corrosionAllowanceMm = 0
): number {
  const pMPa = pressureKPa / 1000.0; // kPa to MPa (N/mm²)
  const effThicknessMm = Math.max(0.5, wallThicknessMm - corrosionAllowanceMm);
  return (pMPa * outerDiameterMm) / (2.0 * effThicknessMm);
}

/**
 * Calculate minimum required expansion loop leg length (Guided Cantilever Method)
 * Formula: L_leg = sqrt( (3 * E * Do * deltaL) / S_allowable )
 *
 * @param deltaLMm - Total thermal expansion to be absorbed (mm)
 * @param outerDiameterMm - Pipe outer diameter (mm)
 * @param youngsModulusGpa - Elastic Modulus (GPa)
 * @param allowableStressMPa - Allowable displacement stress range (MPa)
 * @returns Minimum perpendicular leg length in meters
 */
export function calculateExpansionLoopLeg(
  deltaLMm: number,
  outerDiameterMm: number,
  youngsModulusGpa: number,
  allowableStressMPa: number
): number {
  if (deltaLMm <= 0 || outerDiameterMm <= 0 || allowableStressMPa <= 0) return 0;
  const E_MPa = youngsModulusGpa * 1000.0;
  // L_mm = sqrt( (3 * E * Do * deltaL) / S_A )
  const legMm = Math.sqrt((3.0 * E_MPa * outerDiameterMm * deltaLMm) / allowableStressMPa);
  return legMm / 1000.0; // convert to meters
}

/**
 * Comprehensive Piping Stress and Flexibility Evaluation
 */
export function evaluatePipeStress(params: {
  geometry: PipeGeometryStress;
  material: PipeMaterial;
  operatingTempC: number;
  ambientTempC?: number;
  internalPressureKPa: number;
  isFullyRestrained?: boolean;
}): PipeStressResults {
  const warnings: string[] = [];
  const { geometry, material, operatingTempC, internalPressureKPa } = params;
  const ambientTempC = params.ambientTempC ?? 20.0;
  const deltaT = operatingTempC - ambientTempC;

  const { areaMm2, innerDiameterMm } = calculateMetalCrossSectionArea(
    geometry.outerDiameterMm,
    geometry.wallThicknessMm
  );

  const deltaLMm = calculateThermalExpansion(
    geometry.straightLengthM,
    deltaT,
    material.thermalExpansionAlpha
  );

  const restrainedStressMPa = calculateRestrainedAxialStress(
    deltaT,
    material.youngsModulusGpa,
    material.thermalExpansionAlpha
  );

  // Restrained axial force F = sigma * A (N) -> / 1000 = kN
  const restrainedForceKn = (restrainedStressMPa * areaMm2) / 1000.0;

  const hoopStressMPa = calculateHoopStress(
    internalPressureKPa,
    geometry.outerDiameterMm,
    geometry.wallThicknessMm,
    geometry.corrosionAllowanceMm || 0
  );

  // Longitudinal pressure stress sigma_L = hoop / 2
  const longPressStressMPa = hoopStressMPa / 2.0;

  // Combined Von Mises stress when rigidly restrained:
  // sigma_vm = sqrt(sigma_hoop^2 - sigma_hoop*sigma_axial + sigma_axial^2)
  const combinedRestrainedStressMPa = Math.sqrt(
    Math.pow(hoopStressMPa, 2) -
      hoopStressMPa * restrainedStressMPa +
      Math.pow(restrainedStressMPa, 2)
  );

  const activeStress = params.isFullyRestrained ? combinedRestrainedStressMPa : hoopStressMPa;
  const stressRatioPercent = (activeStress / material.allowableStressS_MPa) * 100.0;

  const reqLoopLegM = calculateExpansionLoopLeg(
    Math.abs(deltaLMm),
    geometry.outerDiameterMm,
    material.youngsModulusGpa,
    material.allowableStressS_MPa
  );

  const asmeB313Pass = activeStress <= material.allowableStressS_MPa;

  let status: 'safe' | 'warning' | 'critical' = 'safe';

  if (stressRatioPercent > 100.0) {
    status = 'critical';
    warnings.push(
      `ASME B31.3 OVERSTRESS VIOLATION: Combined pipe stress (${activeStress.toFixed(1)} MPa) exceeds code allowable limit (${material.allowableStressS_MPa.toFixed(1)} MPa) by ${(stressRatioPercent - 100).toFixed(0)}%. Risk of plastic deformation, flange leakage, or nozzle overload.`
    );
  } else if (stressRatioPercent > 80.0) {
    status = 'warning';
    warnings.push(
      `HIGH THERMAL STRESS: Stress utilization (${stressRatioPercent.toFixed(1)}%) is approaching design allowable limit. Expansion loop or flexible routing recommended.`
    );
  }

  if (params.isFullyRestrained && restrainedForceKn > 50.0) {
    warnings.push(
      `EXCESSIVE NOZZLE LOAD: Restrained thermal anchor reaction force (${restrainedForceKn.toFixed(1)} kN) will transmit severe bending moments onto equipment nozzles exceeding API 610 Table 5 limits.`
    );
  }

  return {
    innerDiameterMm,
    metalCrossSectionAreaMm2: areaMm2,
    temperatureDeltaC: deltaT,
    freeThermalExpansionMm: deltaLMm,
    restrainedAxialStressMPa: restrainedStressMPa,
    restrainedAxialForceKn: restrainedForceKn,
    hoopStressMPa: hoopStressMPa,
    longitudinalPressureStressMPa: longPressStressMPa,
    combinedRestrainedStressMPa,
    stressRatioPercent,
    requiredExpansionLoopLegM: reqLoopLegM,
    asmeB313Pass,
    status,
    warnings,
  };
}
