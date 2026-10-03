/**
 * Pipe Hydraulics, Friction Factor, and Loss Calculations Module
 * 
 * Implements rigorous Darcy-Weisbach equations, Reynolds regime determination,
 * Swamee-Jain and Colebrook-White friction factor calculations, and fitting K-factor losses.
 */

export interface PipeGeometry {
  diameterMm: number; // Inside diameter in mm
  lengthM: number; // Length in meters
  roughnessMm: number; // Absolute pipe roughness in mm (e.g. 0.045 mm for Commercial Carbon Steel)
}

export type FlowRegime = 'laminar' | 'transitional' | 'turbulent';

export interface PipeHydraulicResults {
  crossSectionalAreaM2: number;
  velocityMs: number;
  reynoldsNumber: number;
  flowRegime: FlowRegime;
  frictionFactor: number;
  pipeFrictionHeadLossM: number;
  fittingHeadLossM: number;
  totalHeadLossM: number;
  totalPressureDropKPa: number;
  warnings: string[];
}

/**
 * Standard Pipe Absolute Roughness Values (mm)
 */
export const PIPE_ROUGHNESS_PRESETS: Record<string, { name: string; roughnessMm: number }> = {
  drawnTubing: { name: 'Drawn Copper / Brass / Plastic / Glass', roughnessMm: 0.0015 },
  commercialSteel: { name: 'Commercial Carbon Steel (New)', roughnessMm: 0.045 },
  stainlessSteel: { name: 'Stainless Steel (Commercial Clean)', roughnessMm: 0.015 },
  castIron: { name: 'Cast Iron (Asphalt coated / standard)', roughnessMm: 0.12 },
  galvanizedIron: { name: 'Galvanized Iron', roughnessMm: 0.15 },
  corrodedSteel: { name: 'Moderately Corroded / Scaled Steel', roughnessMm: 0.5 },
};

/**
 * Standard Loss Coefficients (K-factors) for Pipe Fittings
 */
export const FITTING_K_FACTORS: Record<string, { name: string; k: number }> = {
  elbow90Standard: { name: '90° Standard Elbow (R/D=1)', k: 0.75 },
  elbow90LongRadius: { name: '90° Long Radius Elbow (R/D=1.5)', k: 0.45 },
  elbow45Standard: { name: '45° Standard Elbow', k: 0.35 },
  teeFlowThrough: { name: 'Standard Tee (Flow-through)', k: 0.4 },
  teeBranchFlow: { name: 'Standard Tee (Branch flow)', k: 1.5 },
  gateValveFullOpen: { name: 'Gate Valve (Fully open)', k: 0.15 },
  globeValveFullOpen: { name: 'Globe Valve (Fully open)', k: 6.0 },
  butterflyValveFullOpen: { name: 'Butterfly Valve (Fully open)', k: 0.6 },
  swingCheckValve: { name: 'Swing Check Valve', k: 2.0 },
  ballValveFullPort: { name: 'Ball Valve (Full port)', k: 0.05 },
  pipeEntranceSharp: { name: 'Sharp-edged Pipe Entrance', k: 0.5 },
  pipeEntranceRounded: { name: 'Well-rounded Pipe Entrance', k: 0.04 },
  pipeExit: { name: 'Pipe Exit to Vessel/Atmosphere', k: 1.0 },
};

/**
 * Calculate pipe cross-sectional flow area
 * Area = pi * (D_m)^2 / 4
 *
 * @param diameterMm - Inside pipe diameter in mm
 */
export function calculatePipeArea(diameterMm: number): number {
  const dM = diameterMm / 1000.0;
  return (Math.PI * Math.pow(dM, 2)) / 4.0;
}

/**
 * Calculate mean fluid velocity inside pipe
 * v = Q / Area
 *
 * @param flowM3h - Volumetric flow rate in m³/h
 * @param diameterMm - Inside pipe diameter in mm
 * @returns Velocity in m/s
 */
export function calculatePipeVelocity(flowM3h: number, diameterMm: number): number {
  if (diameterMm <= 0) return 0;
  const area = calculatePipeArea(diameterMm);
  const flowM3s = flowM3h / 3600.0;
  return flowM3s / area;
}

/**
 * Calculate Reynolds Number
 * Re = (v * D) / nu = (rho * v * D) / mu
 *
 * @param velocityMs - Mean velocity in m/s
 * @param diameterMm - Inside diameter in mm
 * @param kinematicViscosityCSt - Kinematic viscosity in cSt (mm²/s)
 */
export function calculateReynoldsNumber(
  velocityMs: number,
  diameterMm: number,
  kinematicViscosityCSt: number
): number {
  if (kinematicViscosityCSt <= 0 || diameterMm <= 0 || velocityMs <= 0) {
    return 0;
  }
  // Convert mm²/s to m²/s: 1 cSt = 1e-6 m²/s
  const nuM2s = kinematicViscosityCSt * 1e-6;
  const dM = diameterMm / 1000.0;
  return (velocityMs * dM) / nuM2s;
}

/**
 * Determine Flow Regime
 * Re < 2300: Laminar
 * 2300 <= Re <= 4000: Transitional
 * Re > 4000: Turbulent
 */
export function getFlowRegime(reynolds: number): FlowRegime {
  if (reynolds < 2300) return 'laminar';
  if (reynolds <= 4000) return 'transitional';
  return 'turbulent';
}

/**
 * Calculate Darcy Friction Factor using Swamee-Jain & Colebrook-White
 *
 * 1. Laminar Flow (Re < 2300):
 *    f = 64 / Re (Hagen-Poiseuille)
 *
 * 2. Turbulent Flow (Re > 4000):
 *    Colebrook-White equation:
 *    1 / sqrt(f) = -2 * log10( (epsilon / (3.7 * D)) + (2.51 / (Re * sqrt(f))) )
 *    Solved via initial Swamee-Jain explicit seed followed by Newton-Raphson iterations.
 *
 * 3. Transitional Flow (2300 <= Re <= 4000):
 *    Linear interpolation between Laminar @ 2300 and Turbulent @ 4000 to avoid numerical discontinuities.
 *
 * @param reynolds - Reynolds number
 * @param roughnessMm - Absolute roughness in mm
 * @param diameterMm - Inside pipe diameter in mm
 */
export function calculateDarcyFrictionFactor(
  reynolds: number,
  roughnessMm: number,
  diameterMm: number
): number {
  if (reynolds <= 0 || diameterMm <= 0) return 0.02;

  // Laminar regime
  if (reynolds < 2300) {
    return 64.0 / Math.max(reynolds, 1);
  }

  const relRoughness = Math.max(1e-7, roughnessMm / diameterMm);

  // Swamee-Jain explicit equation for turbulent seed:
  // f = 0.25 / [log10( (epsilon/(3.7*D)) + (5.74 / Re^0.9) )]^2
  const swameeJain = (re: number) => {
    const term = relRoughness / 3.7 + 5.74 / Math.pow(re, 0.9);
    return 0.25 / Math.pow(Math.log10(term), 2);
  };

  if (reynolds >= 4000) {
    // Colebrook-White solver with Newton-Raphson refinement
    let f = swameeJain(reynolds);
    for (let iter = 0; iter < 5; iter++) {
      const sqrtF = Math.sqrt(f);
      const arg = relRoughness / 3.7 + 2.51 / (reynolds * sqrtF);
      if (arg <= 0) break;
      const gVal = 1.0 / sqrtF + 2.0 * Math.log10(arg);
      // derivative of g with respect to f:
      const gPrime =
        -0.5 * Math.pow(f, -1.5) -
        (2.0 / (Math.LN10 * arg)) * (2.51 / reynolds) * (-0.5 * Math.pow(f, -1.5));
      const nextF = f - gVal / gPrime;
      if (Math.abs(nextF - f) < 1e-7) {
        f = nextF;
        break;
      }
      f = Math.max(0.005, Math.min(0.1, nextF));
    }
    return f;
  }

  // Transitional regime (2300 <= Re < 4000): Cubic/Linear spline interpolation
  const fLaminar2300 = 64.0 / 2300.0; // ~0.0278
  const fTurbulent4000 = swameeJain(4000.0);
  const frac = (reynolds - 2300.0) / (4000.0 - 2300.0);
  return fLaminar2300 + frac * (fTurbulent4000 - fLaminar2300);
}

/**
 * Calculate Darcy-Weisbach major friction head loss through straight pipe
 * Formula: h_f = f * (L / D) * (v^2 / (2 * g))
 *
 * @param frictionFactor - Darcy friction factor
 * @param lengthM - Pipe length in meters
 * @param diameterMm - Inside pipe diameter in mm
 * @param velocityMs - Fluid velocity in m/s
 * @param g - Gravitational acceleration (default 9.80665 m/s²)
 * @returns Friction head loss in meters of liquid column
 */
export function calculateMajorHeadLoss(
  frictionFactor: number,
  lengthM: number,
  diameterMm: number,
  velocityMs: number,
  g = 9.80665
): number {
  if (diameterMm <= 0 || lengthM <= 0 || velocityMs <= 0) return 0;
  const dM = diameterMm / 1000.0;
  const velocityHead = Math.pow(velocityMs, 2) / (2.0 * g);
  return frictionFactor * (lengthM / dM) * velocityHead;
}

/**
 * Calculate minor head loss for fittings and valves
 * Formula: h_m = sum(K) * (v^2 / (2 * g))
 *
 * @param totalK - Sum of resistance coefficients K
 * @param velocityMs - Fluid velocity in m/s
 * @param g - Acceleration due to gravity
 * @returns Minor head loss in meters
 */
export function calculateMinorHeadLoss(
  totalK: number,
  velocityMs: number,
  g = 9.80665
): number {
  if (totalK <= 0 || velocityMs <= 0) return 0;
  const velocityHead = Math.pow(velocityMs, 2) / (2.0 * g);
  return totalK * velocityHead;
}

/**
 * Comprehensive Pipe Flow Assessment
 */
export function evaluatePipeHydraulics(params: {
  flowM3h: number;
  pipe: PipeGeometry;
  kinematicViscosityCSt: number;
  densityKgM3: number;
  fittingKs?: number[] | number; // Array of individual K factors or sum
  isSuctionLine?: boolean;
}): PipeHydraulicResults {
  const warnings: string[] = [];
  const { flowM3h, pipe, kinematicViscosityCSt, densityKgM3, isSuctionLine } = params;
  const g = 9.80665;

  const totalK = Array.isArray(params.fittingKs)
    ? params.fittingKs.reduce((sum, k) => sum + k, 0)
    : params.fittingKs || 0;

  const area = calculatePipeArea(pipe.diameterMm);
  const velocity = calculatePipeVelocity(flowM3h, pipe.diameterMm);
  const reynolds = calculateReynoldsNumber(velocity, pipe.diameterMm, kinematicViscosityCSt);
  const regime = getFlowRegime(reynolds);
  const f = calculateDarcyFrictionFactor(reynolds, pipe.roughnessMm, pipe.diameterMm);

  const majorLoss = calculateMajorHeadLoss(f, pipe.lengthM, pipe.diameterMm, velocity, g);
  const minorLoss = calculateMinorHeadLoss(totalK, velocity, g);
  const totalHeadLoss = majorLoss + minorLoss;

  // Total pressure drop in kPa: DeltaP = rho * g * h_loss / 1000
  const totalPressureDropKPa = (densityKgM3 * g * totalHeadLoss) / 1000.0;

  // Industrial Engineering Rule-of-Thumb Velocity Checks (API 610 / HI standards)
  if (isSuctionLine) {
    if (velocity > 2.0) {
      warnings.push(
        `Suction line velocity (${velocity.toFixed(2)} m/s) exceeds recommended maximum (1.5 - 2.0 m/s), increasing friction loss and reducing NPSHa.`
      );
    } else if (velocity < 0.6 && flowM3h > 0) {
      warnings.push(
        `Suction line velocity (${velocity.toFixed(2)} m/s) is low (< 0.6 m/s); risk of particulate settling or thermal stratification.`
      );
    }
  } else {
    // Discharge line
    if (velocity > 4.5) {
      warnings.push(
        `Discharge line velocity (${velocity.toFixed(2)} m/s) exceeds standard industrial limits (3.0 - 4.5 m/s); expect high friction losses and potential water hammer.`
      );
    }
  }

  if (regime === 'transitional') {
    warnings.push(
      `Flow is in the critical transitional zone (Re = ${Math.round(reynolds)}), where friction factors and flow stability can fluctuate.`
    );
  }

  return {
    crossSectionalAreaM2: area,
    velocityMs: velocity,
    reynoldsNumber: reynolds,
    flowRegime: regime,
    frictionFactor: f,
    pipeFrictionHeadLossM: majorLoss,
    fittingHeadLossM: minorLoss,
    totalHeadLossM: totalHeadLoss,
    totalPressureDropKPa: totalPressureDropKPa,
    warnings,
  };
}
