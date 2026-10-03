/**
 * Advanced Rotor Dynamics & Bearing Tribology Physics
 * 
 * Implements:
 * 1. Anisotropic 2-DOF Jeffcott Rotor with Hydrodynamic Cross-Coupling (kxx != kyy, kxy != kyx)
 * 2. Tilted Elliptical Orbit Geometry (Major/Minor axes, tilt angle, forward/reverse precession)
 * 3. Fluid-Film Bearing Sommerfeld Number, Attitude Angle, Oil Whirl & Whip Instability
 * 4. Multi-Mode Spatial Shaft Deflection Shapes (1st Flexural, 2nd Conical, 3rd Bending) & Bending Fiber Stress
 * 5. Rolling Element Epicyclic Kinematics, Characteristic Defect Frequencies (BPFO, BPFI, BSF, FTF),
 *    and Hertzian Contact Stress Field
 */

export interface AnisotropicRotorParams {
  operatingRpm: number;
  rotorMassKg: number;
  unbalanceMassGrams: number;
  unbalanceRadiusMm: number;
  criticalSpeedRpm: number;
  dampingRatio: number;
  bearingType: 'rolling_element' | 'hydrodynamic_sleeve' | 'tilting_pad';
  shaftLengthMm: number;
  shaftDiameterMm: number;
  numBalls?: number;
  ballDiameterMm?: number;
  pitchDiameterMm?: number;
  contactAngleDeg?: number;
  radialLoadN: number;
  bearingDefect?: 'none' | 'bpfo' | 'bpfi' | 'bsf' | 'ftf';
}

export interface AnisotropicOrbitResult {
  semiMajorAxisUm: number;
  semiMinorAxisUm: number;
  tiltAngleDeg: number;
  ellipticity: number; // 0 (circle) to 1 (line)
  precessionDirection: 'forward' | 'reverse';
  kxxKNmm: number;
  kyyKNmm: number;
  kxyKNmm: number;
  kyxKNmm: number;
  sommerfeldNumber: number;
  attitudeAngleDeg: number;
  minOilFilmThicknessUm: number;
  isOilWhirlActive: boolean;
  isOilWhipActive: boolean;
  whirlFrequencyHz: number;
  whirlRatio: number; // ~0.43 - 0.48
}

export interface ShaftModeShapeResult {
  modeNumber: 1 | 2 | 3;
  modeName: string;
  criticalSpeedRpm: number;
  peakDeflectionUm: number;
  maxBendingStressMPa: number;
  // Discrete points along shaft span (0 to 1)
  points: Array<{
    normalizedZ: number; // 0 to 1
    deflectionNorm: number; // -1 to +1
    bendingStressNorm: number; // -1 to +1
    fiberStressMPa: number;
  }>;
}

export interface BearingFaultFrequencies {
  speed1XHz: number;
  ftfHz: number;   // Fundamental Train Frequency (Cage)
  bpfoHz: number;  // Ball Pass Frequency Outer Race
  bpfiHz: number;  // Ball Pass Frequency Inner Race
  bsfHz: number;   // Ball Spin Frequency
  hertzMaxContactStressGPa: number;
  hertzEllipseAMm: number;
  hertzEllipseBMm: number;
  ballLoadDistribution: number[]; // Load per ball around circumference (N)
}

/**
 * Solves 2-DOF Anisotropic Jeffcott Rotor with Hydrodynamic Bearing Cross-Coupling
 */
export function calculateAnisotropicOrbit(params: AnisotropicRotorParams): AnisotropicOrbitResult {
  const omega = (2 * Math.PI * params.operatingRpm) / 60;
  const omegaCrit = (2 * Math.PI * params.criticalSpeedRpm) / 60;
  const m = Math.max(1, params.rotorMassKg);
  const me = (params.unbalanceMassGrams / 1000) * (params.unbalanceRadiusMm / 1000); // kg·m

  // Base isotropic stiffness
  const k0 = m * omegaCrit * omegaCrit; // N/m

  let kxx = k0;
  let kyy = k0;
  let kxy = 0;
  let kyx = 0;
  let cxx = 2 * params.dampingRatio * m * omegaCrit;
  let cyy = cxx;

  let sommerfeld = 0.25;
  let attitudeAngleDeg = 42;
  let minFilmThicknessUm = 18;
  let isOilWhirl = false;
  let isOilWhip = false;
  const whirlRatio = 0.46; // Classic 0.43 - 0.48 subsynchronous ratio
  const whirlFreqHz = (params.operatingRpm / 60) * whirlRatio;

  if (params.bearingType === 'hydrodynamic_sleeve') {
    // Hydrodynamic sleeve bearing has strong anisotropy & cross-coupling
    // kxx (horizontal) is typically softer than kyy (vertical gravity loaded)
    kxx = k0 * 0.72;
    kyy = k0 * 1.35;
    // Cross-coupling destabilizing stiffness terms (from oil wedge shearing)
    kxy = k0 * 0.38;
    kyx = -k0 * 0.34;

    // Sommerfeld Number S = (R/C)^2 * (mu * N) / P
    const clearanceRatio = 0.0015;
    const oilViscosityPaS = 0.032; // ISO VG 46 at 50°C
    const projPressurePa = Math.max(50000, params.radialLoadN / ((params.shaftDiameterMm / 1000) * 0.04));
    sommerfeld = Math.pow(1 / clearanceRatio, 2) * ((oilViscosityPaS * (params.operatingRpm / 60)) / projPressurePa);
    
    // Attitude angle phi ~ arctan(pi/4 * sqrt(1 - eps^2) / eps)
    const eccentricityRatio = Math.max(0.05, Math.min(0.95, 1 / (1 + 2.5 * sommerfeld)));
    attitudeAngleDeg = Math.min(85, Math.max(15, (1 - eccentricityRatio) * 75 + 15));
    const radialClearanceUm = (params.shaftDiameterMm * 1000 * clearanceRatio) / 2;
    minFilmThicknessUm = Math.max(1.5, radialClearanceUm * (1 - eccentricityRatio));

    // Oil Whirl onset: occurs when operating speed exceeds ~ 2.0 to 2.2 x 1st critical speed
    if (params.operatingRpm > params.criticalSpeedRpm * 1.95) {
      isOilWhirl = true;
      // Oil Whip occurs when whirl frequency coincides with 1st critical speed
      if (Math.abs(whirlFreqHz * 60 - params.criticalSpeedRpm) / params.criticalSpeedRpm < 0.2) {
        isOilWhip = true;
      }
    }
  } else if (params.bearingType === 'tilting_pad') {
    // Tilting-pad journal bearings inherently eliminate cross-coupling (kxy ~ 0, kyx ~ 0)
    kxx = k0 * 0.88;
    kyy = k0 * 1.12;
    kxy = 0;
    kyx = 0;
    sommerfeld = 0.35;
    attitudeAngleDeg = 12;
    minFilmThicknessUm = 24;
  } else {
    // Rolling element bearing: pedestal horizontal compliance makes kxx softer than kyy
    kxx = k0 * 0.82;
    kyy = k0 * 1.18;
    kxy = 0;
    kyx = 0;
  }

  // Unbalance excitation force
  const F_unbal = me * omega * omega; // N

  // Dynamic response amplitudes in X and Y
  // X(omega) = F / sqrt((kxx - m*omega^2)^2 + (cxx*omega)^2)
  const denomX = Math.sqrt(Math.pow(kxx - m * omega * omega, 2) + Math.pow(cxx * omega, 2));
  const denomY = Math.sqrt(Math.pow(kyy - m * omega * omega, 2) + Math.pow(cyy * omega, 2));

  let ampXUm = (F_unbal / Math.max(1000, denomX)) * 1e6;
  let ampYUm = (F_unbal / Math.max(1000, denomY)) * 1e6;

  // Additional whirl modulation if oil whirl or oil whip active
  if (isOilWhip) {
    ampXUm *= 3.8;
    ampYUm *= 3.8;
  } else if (isOilWhirl) {
    ampXUm *= 1.9;
    ampYUm *= 1.9;
  }

  // Ellipse properties
  const semiMajorUm = Math.max(ampXUm, ampYUm);
  const semiMinorUm = Math.min(ampXUm, ampYUm);
  const ellipticity = Math.sqrt(1 - Math.pow(semiMinorUm / Math.max(0.1, semiMajorUm), 2));
  const tiltDeg = ampXUm > ampYUm ? (params.bearingType === 'hydrodynamic_sleeve' ? 24 : 0) : 90;

  return {
    semiMajorAxisUm: semiMajorUm,
    semiMinorAxisUm: semiMinorUm,
    tiltAngleDeg: tiltDeg,
    ellipticity: Math.min(0.98, Math.max(0, ellipticity)),
    precessionDirection: 'forward',
    kxxKNmm: kxx / 1e6,
    kyyKNmm: kyy / 1e6,
    kxyKNmm: kxy / 1e6,
    kyxKNmm: kyx / 1e6,
    sommerfeldNumber: sommerfeld,
    attitudeAngleDeg,
    minOilFilmThicknessUm: minFilmThicknessUm,
    isOilWhirlActive: isOilWhirl,
    isOilWhipActive: isOilWhip,
    whirlFrequencyHz: whirlFreqHz,
    whirlRatio,
  };
}

/**
 * Calculates Multi-Mode Spatial Shaft Deflection Shapes (1st Flexural, 2nd Conical, 3rd Bending)
 */
export function calculateShaftModeShapes(
  mode: 1 | 2 | 3,
  shaftLengthMm: number,
  shaftDiameterMm: number,
  criticalSpeedRpm: number,
  peakDisplacementUm: number
): ShaftModeShapeResult {
  const numPts = 50;
  const points: ShaftModeShapeResult['points'] = [];

  const modeNames = {
    1: '1st Flexural Mode (Translatory / Bounce)',
    2: '2nd Conical Mode (Rocking / Pivoting)',
    3: '3rd Flexural Mode (S-Bend Double Node)',
  };

  const modeCritMultiplier = {
    1: 1.0,
    2: 2.75,
    3: 5.4,
  };

  const E = 205e9; // Steel Young's Modulus (Pa)
  const r = (shaftDiameterMm / 2) / 1000; // Radius (m)
  const L = shaftLengthMm / 1000; // Length (m)
  const peakDefM = (peakDisplacementUm * 1e-6);

  for (let i = 0; i <= numPts; i++) {
    const zNorm = i / numPts; // 0 to 1
    let yNorm = 0;
    let d2yNorm = 0;

    if (mode === 1) {
      // Half-sine: Y(z) = sin(pi * z / L)
      yNorm = Math.sin(Math.PI * zNorm);
      d2yNorm = -Math.PI * Math.PI * Math.sin(Math.PI * zNorm);
    } else if (mode === 2) {
      // Full-sine: Y(z) = sin(2 * pi * z / L)
      yNorm = Math.sin(2 * Math.PI * zNorm);
      d2yNorm = -4 * Math.PI * Math.PI * Math.sin(2 * Math.PI * zNorm);
    } else {
      // 3 half-sines: Y(z) = sin(3 * pi * z / L)
      yNorm = Math.sin(3 * Math.PI * zNorm);
      d2yNorm = -9 * Math.PI * Math.PI * Math.sin(3 * Math.PI * zNorm);
    }

    // Fiber bending stress: sigma = E * r * (d2Y/dz2)
    const curvature = (d2yNorm * peakDefM) / (L * L);
    const fiberStressMPa = (E * r * Math.abs(curvature)) / 1e6;

    points.push({
      normalizedZ: zNorm,
      deflectionNorm: yNorm,
      bendingStressNorm: Math.abs(d2yNorm) / (mode === 1 ? Math.PI * Math.PI : mode === 2 ? 4 * Math.PI * Math.PI : 9 * Math.PI * Math.PI),
      fiberStressMPa,
    });
  }

  const maxBendingStress = Math.max(...points.map((p) => p.fiberStressMPa));

  return {
    modeNumber: mode,
    modeName: modeNames[mode],
    criticalSpeedRpm: Math.round(criticalSpeedRpm * modeCritMultiplier[mode]),
    peakDeflectionUm: peakDisplacementUm,
    maxBendingStressMPa: maxBendingStress,
    points,
  };
}

/**
 * Calculates Rolling Element Epicyclic Kinematics, Characteristic Defect Frequencies & Hertzian Contact Stress
 */
export function calculateBearingDefectFrequencies(params: {
  operatingRpm: number;
  boreDiameterMm: number;
  outerDiameterMm: number;
  radialLoadN: number;
  numBalls?: number;
  contactAngleDeg?: number;
}): BearingFaultFrequencies {
  const N = params.operatingRpm;
  const f0 = N / 60; // 1X Shaft fundamental frequency in Hz
  const d = (params.outerDiameterMm - params.boreDiameterMm) * 0.28; // ball diameter mm approx
  const Dm = (params.outerDiameterMm + params.boreDiameterMm) / 2; // pitch diameter mm
  const z = params.numBalls || 8; // number of balls
  const alphaRad = ((params.contactAngleDeg || 0) * Math.PI) / 180;

  const ratio = (d / Dm) * Math.cos(alphaRad);

  // Fundamental Train Frequency (Cage)
  const ftf = f0 * 0.5 * (1 - ratio);

  // Ball Pass Frequency Outer Race
  const bpfo = f0 * (z / 2) * (1 - ratio);

  // Ball Pass Frequency Inner Race
  const bpfi = f0 * (z / 2) * (1 + ratio);

  // Ball Spin Frequency
  const bsf = f0 * (Dm / (2 * d)) * (1 - Math.pow(ratio, 2));

  // Ball load distribution under static/dynamic radial load Fr (Stribeck distribution)
  // Max load on bottom-most ball F_max = 4.37 * Fr / z
  const F_max = Math.max(10, (4.37 * params.radialLoadN) / z);

  // Calculate ball load for each ball around the circumference
  const ballLoads: number[] = [];
  for (let i = 0; i < z; i++) {
    const angle = (i * 2 * Math.PI) / z;
    // Load zone is bottom half (cos(angle) > 0)
    const loadFactor = Math.max(0, Math.cos(angle));
    const ballLoad = F_max * Math.pow(loadFactor, 1.5);
    ballLoads.push(ballLoad);
  }

  // Hertzian Contact Stress Field
  // Point contact between sphere and cylindrical raceway
  // P0 = (6 * F * E*^2 / (pi^3 * R*^2))^(1/3)
  const E_star = 115e9; // Equivalent Young's modulus for steel-on-steel (Pa)
  const R_sphere = (d / 2) / 1000; // m
  const R_star = R_sphere * 0.65; // Effective relative radius of curvature (m)

  const maxP0Pa = Math.pow((6 * F_max * Math.pow(E_star, 2)) / (Math.pow(Math.PI, 3) * Math.pow(R_star, 2)), 1 / 3);
  const maxP0GPa = maxP0Pa / 1e9;

  // Contact ellipse semi-axes (mm)
  const a_hertz = Math.pow((3 * F_max * R_star) / (2 * E_star), 1 / 3) * 1000 * 1.5;
  const b_hertz = a_hertz * 0.45;

  return {
    speed1XHz: f0,
    ftfHz: ftf,
    bpfoHz: bpfo,
    bpfiHz: bpfi,
    bsfHz: bsf,
    hertzMaxContactStressGPa: maxP0GPa,
    hertzEllipseAMm: a_hertz,
    hertzEllipseBMm: b_hertz,
    ballLoadDistribution: ballLoads,
  };
}
