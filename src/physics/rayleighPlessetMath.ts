/**
 * Rayleigh-Plesset Bubble Dynamics & Cloud Cavitation Pitting Mechanics
 * 
 * Complies with classic cavitation bubble dynamics (Rayleigh 1917, Plesset 1949, Brennen 1995).
 * Simulates:
 * 1. Bubble nucleation when local static pressure P_local(s) < P_vapor(T)
 * 2. Rapid bubble inflation in the suction eye / blade leading edge minimum pressure zone
 * 3. Violent violent asymmetric collapse as fluid sweeps bubbles into higher static pressure
 * 4. High-velocity micro-jet formation (v_jet > 800-1400 m/s)
 * 5. Water-hammer impact pressure on the blade wall (P_impact = ρ * c_L * v_jet in GPa)
 * 6. Cumulative pitting damage rate and surface erosion depth
 */

export interface CavitationBubble {
  id: number;
  vaneIndex: number;
  progress: number;       // 0 (impeller eye leading edge) to 1 (blade trailing edge/discharge)
  angleRad: number;       // Angular position on the rotating blade
  radiusMm: number;       // Instantaneous bubble radius R(t) in mm
  maxRadiusMm: number;    // Peak radius achieved at minimum pressure point
  phase: 'nucleating' | 'growing' | 'collapsing' | 'imploded';
  localPressureKPa: number;
  jetVelocityMs: number;  // Micro-jet velocity upon collapse (m/s)
  impactPressureGPa: number; // Water-hammer impact shockwave (GPa)
  isNearBladeWall: boolean;
  distanceToWallMm: number;
  pittedBlade: boolean;
  lifeTimeS: number;
}

export interface RayleighPlessetState {
  minPressureKPa: number;
  vaporPressureKPa: number;
  pressureDeficitKPa: number;
  maxTheoreticalRadiusMm: number;
  collapseTimeMicroSec: number;
  microJetVelocityMs: number;
  impactPressureGPa: number;
  pittingRatePitsPerSec: number;
  cumulativePits: number;
  cumulativeErosionDepthUm: number;
  materialYieldStrengthMPa: number;
  willPittingOccur: boolean;
}

/**
 * Calculate dynamic Rayleigh-Plesset parameters for current pump operating state
 */
export function calculateRayleighPlessetState(params: {
  suctionFlangePressureKPa: number;
  vaporPressureKPa: number;
  fluidDensityKgM3: number;
  fluidVelocityMs: number;
  impellerSpeedRpm: number;
  npshaM: number;
  npshrM: number;
  incidenceAngleDeg: number;
  cumulativeTimeSeconds?: number;
}): RayleighPlessetState {
  const rho = Math.max(700, params.fluidDensityKgM3);
  const cL = 1480; // Speed of sound in liquid (water ~1480 m/s)

  // Local pressure at impeller eye blade leading edge:
  // Pressure drops due to blade acceleration and incidence loss:
  // P_min = P_suction - 0.5 * rho * (w1^2 - vm1^2) - DeltaP_inc
  const dynamicPressureDropKPa = (0.5 * rho * Math.pow(Math.max(1, params.fluidVelocityMs), 2) * 2.8) / 1000;
  const incidenceLossKPa = (Math.abs(params.incidenceAngleDeg) * 4.2 * rho) / 1000;

  // Static pressure at inception location
  const minPressureKPa = Math.max(
    0.1,
    params.suctionFlangePressureKPa - dynamicPressureDropKPa - incidenceLossKPa
  );

  const pressureDeficitKPa = Math.max(0, params.vaporPressureKPa - minPressureKPa);

  // Classic Rayleigh maximum bubble radius:
  // R_max = R_0 + 2 * sqrt(2/3 * (P_v - P_min) / rho) * t_residence
  const tResidence = 0.003; // ~3 milliseconds in blade low pressure trough
  const maxGrowthVelocity = pressureDeficitKPa > 0
    ? Math.sqrt((2 / 3) * ((pressureDeficitKPa * 1000) / rho))
    : 0;

  const maxTheoreticalRadiusMm = pressureDeficitKPa > 0
    ? Math.min(6.5, Math.max(0.5, (0.01 + maxGrowthVelocity * tResidence) * 1000))
    : 0.05;

  // Rayleigh collapse time:
  // t_c = 0.915 * R_max * sqrt(rho / (P_collapse - P_v))
  const deltaPCollapseKPa = Math.max(10, params.suctionFlangePressureKPa + 150 - params.vaporPressureKPa);
  const collapseTimeMicroSec = maxTheoreticalRadiusMm > 0.1
    ? 0.915 * (maxTheoreticalRadiusMm / 1000) * Math.sqrt(rho / (deltaPCollapseKPa * 1000)) * 1e6
    : 10;

  // Asymmetric collapse micro-jet velocity (Blake & Gibson / Plesset & Chapman):
  // v_jet ≈ 8.9 * sqrt(deltaP / rho)
  const microJetVelocityMs = pressureDeficitKPa > 0
    ? Math.min(1800, Math.max(350, 8.9 * Math.sqrt((deltaPCollapseKPa * 1000) / rho)))
    : 0;

  // Water hammer impact shockwave pressure:
  // P_impact = rho * c_L * v_jet (in GPa)
  const impactPressureGPa = microJetVelocityMs > 0
    ? (rho * cL * microJetVelocityMs) / 1e9
    : 0;

  // Material: 316 Stainless Steel (yield ~240 MPa, ultimate ~550 MPa, pitting threshold ~0.65 GPa)
  const materialYieldStrengthMPa = 240;
  const willPittingOccur = impactPressureGPa > 0.65 && params.npshaM <= params.npshrM;

  // Pitting frequency (pits/second)
  const severityRatio = Math.max(0, (params.npshrM - params.npshaM) / Math.max(0.5, params.npshrM));
  const pittingRatePitsPerSec = willPittingOccur
    ? Math.round(15 + severityRatio * 280)
    : 0;

  // Cumulative erosion over active simulation session
  const simSeconds = params.cumulativeTimeSeconds || 1;
  const cumulativePits = Math.round(pittingRatePitsPerSec * simSeconds);
  // Each high-energy pit removes ~0.0002 µm of metal surface equivalent
  const cumulativeErosionDepthUm = Math.min(120, cumulativePits * 0.00035);

  return {
    minPressureKPa,
    vaporPressureKPa: params.vaporPressureKPa,
    pressureDeficitKPa,
    maxTheoreticalRadiusMm,
    collapseTimeMicroSec,
    microJetVelocityMs,
    impactPressureGPa,
    pittingRatePitsPerSec,
    cumulativePits,
    cumulativeErosionDepthUm,
    materialYieldStrengthMPa,
    willPittingOccur,
  };
}
