/**
 * Centrifugal Pump Performance, Cavitation, and System Operating Point Calculations
 * 
 * Complies with Hydraulic Institute HI 9.6.1 and API 610 11th/12th Edition guidelines
 * for NPSHa, NPSHr cavitation margins, head interpolation, and operating point equilibrium.
 */

export interface PumpCurvePoint {
  flowM3h: number;
  headM: number;
  efficiencyPercent?: number;
  npshrM?: number;
}

export interface PumpCurveCoefficients {
  h0: number; // Shutoff head at Q=0 (m)
  a: number;  // Head drop coefficient (H = H0 - a * Q^2)
  npshr0: number; // NPSHr at minimum flow (m)
  b: number;      // NPSHr rise coefficient (NPSHr = NPSHr0 + b * Q^2)
}

export interface NPSHaParameters {
  suctionVesselPressureKPa: number; // Vessel surface pressure
  isSuctionPressureGauge?: boolean; // If true, atmospheric pressure is added
  atmosphericPressureKPa?: number; // Default 101.325 kPa
  liquidLevelElevationM: number; // Elevation of liquid surface above pump centerline (+ for flooded, - for lift)
  suctionLineLossesM: number; // Total head loss in suction piping (major + minor)
  vaporPressureKPaAbs: number; // Liquid vapor pressure in absolute kPa
  densityKgM3: number; // Liquid density in kg/m³
  g?: number; // Default 9.80665 m/s²
}

export interface CavitationMarginAssessment {
  npshaM: number;
  npshrM: number;
  marginRatio: number; // NPSHa / NPSHr
  marginDeltaM: number; // NPSHa - NPSHr (m)
  status: 'safe' | 'warning' | 'critical';
  standardCompliance: {
    api610Pass: boolean; // API 610 requires margin ratio >= 1.1 - 1.2 or delta >= 1.0 m
    hi961RecommendedMarginM: number;
  };
  warnings: string[];
}

export interface OperatingPointResult {
  flowM3h: number;
  headM: number;
  npshaM: number;
  npshrM: number;
  hydraulicPowerKw: number;
  brakePowerKw?: number;
  efficiencyPercent?: number;
  cavitationStatus: CavitationMarginAssessment;
}

/**
 * Fit quadratic pump curve coefficients:
 * Head: H(Q) = H0 - a * Q^2
 * NPSHr: NPSHr(Q) = NPSHr0 + b * Q^2
 */
export function fitQuadraticPumpCurves(
  bepPoint: { flowM3h: number; headM: number; npshrM: number },
  shutoffHeadM: number,
  npshr0M = 1.5
): PumpCurveCoefficients {
  const Qbep = Math.max(1, bepPoint.flowM3h);
  const H0 = Math.max(bepPoint.headM * 1.05, shutoffHeadM);
  // a = (H0 - H_bep) / (Q_bep^2)
  const a = Math.max(1e-6, (H0 - bepPoint.headM) / Math.pow(Qbep, 2));

  // b = (NPSHr_bep - NPSHr0) / (Q_bep^2)
  const b = Math.max(1e-7, (bepPoint.npshrM - npshr0M) / Math.pow(Qbep, 2));

  return { h0: H0, a, npshr0: npshr0M, b };
}

/**
 * Interpolate / calculate Pump Total Dynamic Head (TDH) at any flow rate
 * Formula: H(Q) = max(0, H0 - a * Q^2)
 */
export function calculatePumpHead(flowM3h: number, coeffs: PumpCurveCoefficients): number {
  if (flowM3h < 0) return coeffs.h0;
  const head = coeffs.h0 - coeffs.a * Math.pow(flowM3h, 2);
  return Math.max(0, head);
}

/**
 * Interpolate / calculate NPSHr (Net Positive Suction Head Required) at any flow rate
 * Formula: NPSHr(Q) = NPSHr0 + b * Q^2
 */
export function calculateNPSHr(flowM3h: number, coeffs: PumpCurveCoefficients): number {
  if (flowM3h <= 0) return coeffs.npshr0;
  return coeffs.npshr0 + coeffs.b * Math.pow(flowM3h, 2);
}

/**
 * Calculate Net Positive Suction Head Available (NPSHa)
 * 
 * Formula:
 * NPSHa = (P_surface_abs / (rho * g)) + z_elevation - h_suction_friction - (P_vapor_abs / (rho * g))
 * 
 * Units:
 * Pressures in kPa (1 kPa = 1000 Pa = 1000 N/m²)
 * Head = (P * 1000) / (rho * g) meters
 * 
 * Assumptions:
 * - Datum is the pump centerline / impeller eye level.
 * - Pressure is converted to absolute head.
 * - Liquid velocity head in suction vessel is negligible.
 */
export function calculateNPSHa(params: NPSHaParameters): number {
  const g = params.g || 9.80665;
  const atm = params.atmosphericPressureKPa ?? 101.325;
  const density = Math.max(1, params.densityKgM3);

  // Convert surface pressure to absolute kPa
  const pSurfaceAbsKPa = params.isSuctionPressureGauge
    ? params.suctionVesselPressureKPa + atm
    : params.suctionVesselPressureKPa;

  // Pressure head in meters: (P_kPa * 1000) / (rho * g)
  const surfaceHeadM = (pSurfaceAbsKPa * 1000.0) / (density * g);
  const vaporHeadM = (params.vaporPressureKPaAbs * 1000.0) / (density * g);

  // NPSHa = H_surface + z - h_loss - H_vapor
  const npsha = surfaceHeadM + params.liquidLevelElevationM - params.suctionLineLossesM - vaporHeadM;

  return Math.max(0, npsha);
}

/**
 * Assess Cavitation Risk and Margin Compliance (API 610 & HI 9.6.1)
 * 
 * Standard Criteria:
 * - API 610: NPSHa >= 1.1 * NPSHr AND (NPSHa - NPSHr >= 1.0 m) for hydrocarbons / boiler feed
 * - General Industrial Safe: Ratio >= 1.25 or Delta >= 1.5 m
 * - Incipient Cavitation: 1.0 <= Ratio < 1.2
 * - Severe Cavitation / Bubble Collapse / Head Drop: Ratio < 1.0
 */
export function assessCavitationMargin(npshaM: number, npshrM: number): CavitationMarginAssessment {
  const warnings: string[] = [];
  const safeNpshr = Math.max(0.1, npshrM);
  const marginRatio = npshaM / safeNpshr;
  const marginDeltaM = npshaM - npshrM;

  // Recommended minimum margin per HI 9.6.1 (typical 1.0 - 1.5 m for continuous industrial service)
  const hi961RecommendedMarginM = Math.max(1.0, 0.2 * npshrM);
  const api610Pass = marginRatio >= 1.1 && marginDeltaM >= 1.0;

  let status: 'safe' | 'warning' | 'critical' = 'safe';

  if (marginDeltaM < 0 || marginRatio < 1.0) {
    status = 'critical';
    warnings.push(
      `CRITICAL CAVITATION: NPSHa (${npshaM.toFixed(2)} m) is LESS than NPSHr (${npshrM.toFixed(2)} m). Impeller eye will suffer severe vapor cavitation, acoustic noise, surging, and rapid erosion damage.`
    );
  } else if (marginRatio < 1.2 || marginDeltaM < 0.6) {
    status = 'warning';
    warnings.push(
      `LOW CAVITATION MARGIN: NPSH margin (${marginDeltaM.toFixed(2)} m, ratio ${marginRatio.toFixed(2)}) is below the recommended 1.2 margin ratio. Incipient cavitation noise and accelerated seal wear possible.`
    );
  }

  return {
    npshaM,
    npshrM,
    marginRatio,
    marginDeltaM,
    status,
    standardCompliance: {
      api610Pass,
      hi961RecommendedMarginM,
    },
    warnings,
  };
}

/**
 * Calculate Hydraulic Power and Brake Power
 * P_hyd = (rho * g * Q_m3s * H) / 1000 (kW)
 * P_brake = P_hyd / (efficiency / 100) (kW)
 */
export function calculatePumpPower(
  flowM3h: number,
  headM: number,
  densityKgM3: number,
  efficiencyPercent = 75,
  g = 9.80665
): { hydraulicPowerKw: number; brakePowerKw: number } {
  const flowM3s = Math.max(0, flowM3h) / 3600.0;
  const hydraulicPowerKw = (densityKgM3 * g * flowM3s * Math.max(0, headM)) / 1000.0;
  const eff = Math.max(5, Math.min(98, efficiencyPercent)) / 100.0;
  const brakePowerKw = hydraulicPowerKw / eff;

  return { hydraulicPowerKw, brakePowerKw };
}

/**
 * Solve for System-Pump Operating Point Intersection
 * Pump Curve: H_pump(Q) = H0 - a * Q^2
 * System Curve: H_sys(Q) = H_static + k_sys * Q^2
 * 
 * Equilibrium:
 * H0 - a * Q^2 = H_static + k_sys * Q^2
 * Q_op = sqrt( (H0 - H_static) / (a + k_sys) )
 */
export function findPumpOperatingPoint(
  coeffs: PumpCurveCoefficients,
  staticHeadM: number,
  systemResistanceK: number // K factor such that H_friction = K * Q^2
): { flowM3h: number; headM: number } {
  const deltaHead = coeffs.h0 - staticHeadM;
  if (deltaHead <= 0) {
    // Pump shutoff head cannot overcome static head
    return { flowM3h: 0, headM: coeffs.h0 };
  }

  const denominator = coeffs.a + Math.max(0, systemResistanceK);
  if (denominator <= 0) {
    return { flowM3h: 0, headM: coeffs.h0 };
  }

  const flowM3h = Math.sqrt(deltaHead / denominator);
  const headM = calculatePumpHead(flowM3h, coeffs);

  return { flowM3h, headM };
}
