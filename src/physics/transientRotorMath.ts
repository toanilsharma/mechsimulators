/**
 * Transient Machinery Run-Up & Coastdown Dynamic Simulator
 * Closed-Form Jeffcott Rotor with Speed-Dependent Damping & Resonant Dwell
 *
 * Nominative Benchmark Reference: ISO 13373 / API 684 (Educational Citation Only)
 * Independent computational modeling - not affiliated with or approved by standards bodies.
 */

export interface BodePoint {
  rpm: number;
  freqHz: number;
  amplitudeUm: number;
  phaseDeg: number;
  realUm: number;
  imagUm: number;
  unbalanceForceN: number;
  isResonant: boolean;
}

export interface TransientRotorInputs {
  rotorMassKg: number;
  shaftStiffnessN_m: number;
  dampingRatio: number; // zeta (typically 0.03 to 0.15)
  unbalanceGramMm: number; // unbalance U in g·mm
  slowRollRunoutUm: number; // Slow-roll electrical/mechanical runout vector
  slowRollPhaseDeg: number;
  nominalRpm: number;
  maxSweepRpm: number;
  accelRateRpmPerSec: number; // e.g. 50 rpm/s
  thermalBowUm?: number; // Rotor thermal sag vector
  thermalBowPhaseDeg?: number;
}

export interface TransientRotorOutputs {
  criticalSpeedRpm: number;
  criticalSpeedHz: number;
  amplificationFactorQ: number;
  peakResonantAmplitudeUm: number;
  peakResonantPhaseDeg: number;
  nominalAmplitudeUm: number;
  nominalPhaseDeg: number;
  separationMarginPercent: number;
  isSeparationCompliant: boolean; // Reference benchmark >= 16% (API 684 benchmark)
  bodeProfile: BodePoint[];
  nyquistProfile: { real: number; imag: number; rpm: number; amplitudeUm: number; phaseDeg: number }[];
  dwellTimeSeconds: number; // time spent in resonance band (within -3dB or ±10% critical speed)
  resonanceBandRpm: [number, number];
  slowRollCompensated: boolean;
  benchmarkNotes: string[];
}

/**
 * Calculates complete Bode and Nyquist vibration trajectories during machine run-up or coastdown.
 */
export function calculateTransientRotorDynamics(inputs: TransientRotorInputs): TransientRotorOutputs {
  const {
    rotorMassKg,
    shaftStiffnessN_m,
    dampingRatio,
    unbalanceGramMm,
    slowRollRunoutUm,
    slowRollPhaseDeg,
    nominalRpm,
    maxSweepRpm,
    accelRateRpmPerSec,
    thermalBowUm = 0,
    thermalBowPhaseDeg = 0,
  } = inputs;

  // 1. Undamped natural frequency
  const omegaN = Math.sqrt(shaftStiffnessN_m / rotorMassKg); // rad/s
  const criticalSpeedRpm = (omegaN * 60) / (2 * Math.PI);
  const criticalSpeedHz = omegaN / (2 * Math.PI);

  // 2. Amplification factor Q = 1 / (2 * zeta)
  const amplificationFactorQ = 1 / (2 * Math.max(0.005, dampingRatio));

  // 3. Unbalance mass eccentricity: e = U / m (m in grams: rotorMassKg * 1000)
  const massGrams = rotorMassKg * 1000;
  const eccentricityMm = unbalanceGramMm / massGrams;
  const eccentricityUm = eccentricityMm * 1000;

  // 4. Slow roll runout vector in Cartesian components
  const srRad = (slowRollPhaseDeg * Math.PI) / 180;
  const srReal = slowRollRunoutUm * Math.cos(srRad);
  const srImag = slowRollRunoutUm * Math.sin(srRad);

  // 5. Thermal bow vector in Cartesian components
  const tbRad = (thermalBowPhaseDeg * Math.PI) / 180;
  const tbReal = thermalBowUm * Math.cos(tbRad);
  const tbImag = thermalBowUm * Math.sin(tbRad);

  const stepRpm = Math.max(10, Math.round(maxSweepRpm / 250));
  const bodeProfile: BodePoint[] = [];
  const nyquistProfile: { real: number; imag: number; rpm: number; amplitudeUm: number; phaseDeg: number }[] = [];

  let peakResonantAmplitudeUm = 0;
  let peakResonantPhaseDeg = 90;

  for (let rpm = 100; rpm <= maxSweepRpm; rpm += stepRpm) {
    const omega = (rpm * 2 * Math.PI) / 60;
    const r = omega / omegaN; // frequency ratio
    const freqHz = rpm / 60;

    // Steady-state Jeffcott rotor dynamic response:
    // X_dyn = e * r^2 / sqrt((1 - r^2)^2 + (2*zeta*r)^2)
    const denom = Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * dampingRatio * r, 2));
    const dynamicAmpUm = (eccentricityUm * r * r) / Math.max(1e-6, denom);

    // Phase angle lag: phi = atan2(2*zeta*r, 1 - r^2)
    let dynamicPhaseRad = Math.atan2(2 * dampingRatio * r, 1 - r * r);
    if (dynamicPhaseRad < 0) dynamicPhaseRad += 2 * Math.PI;

    // Dynamic Cartesian vector
    const dynReal = dynamicAmpUm * Math.cos(dynamicPhaseRad);
    const dynImag = dynamicAmpUm * Math.sin(dynamicPhaseRad);

    // Total vector = dynamic unbalance + slow roll runout + thermal bow
    const totReal = dynReal + srReal + tbReal;
    const totImag = dynImag + srImag + tbImag;

    const totalAmpUm = Math.sqrt(totReal * totReal + totImag * totImag);
    let totalPhaseDeg = (Math.atan2(totImag, totReal) * 180) / Math.PI;
    if (totalPhaseDeg < 0) totalPhaseDeg += 360;

    // Dynamic unbalance centrifugal force: F = m * e * omega^2 [N]
    const unbalanceForceN = (rotorMassKg * (eccentricityUm * 1e-6) * omega * omega);

    const isResonant = Math.abs(rpm - criticalSpeedRpm) <= criticalSpeedRpm * 0.08;

    if (totalAmpUm > peakResonantAmplitudeUm) {
      peakResonantAmplitudeUm = totalAmpUm;
      peakResonantPhaseDeg = totalPhaseDeg;
    }

    bodeProfile.push({
      rpm,
      freqHz: Number(freqHz.toFixed(1)),
      amplitudeUm: Number(totalAmpUm.toFixed(2)),
      phaseDeg: Number(totalPhaseDeg.toFixed(1)),
      realUm: Number(totReal.toFixed(2)),
      imagUm: Number(totImag.toFixed(2)),
      unbalanceForceN: Number(unbalanceForceN.toFixed(1)),
      isResonant,
    });

    nyquistProfile.push({
      real: Number(totReal.toFixed(2)),
      imag: Number(totImag.toFixed(2)),
      rpm,
      amplitudeUm: Number(totalAmpUm.toFixed(2)),
      phaseDeg: Number(totalPhaseDeg.toFixed(1)),
    });
  }

  // Nominal operating point response
  const rNom = nominalRpm / criticalSpeedRpm;
  const denomNom = Math.sqrt(Math.pow(1 - rNom * rNom, 2) + Math.pow(2 * dampingRatio * rNom, 2));
  const dynAmpNom = (eccentricityUm * rNom * rNom) / Math.max(1e-6, denomNom);
  let dynPhaseNom = Math.atan2(2 * dampingRatio * rNom, 1 - rNom * rNom);
  if (dynPhaseNom < 0) dynPhaseNom += 2 * Math.PI;

  const totRealNom = dynAmpNom * Math.cos(dynPhaseNom) + srReal + tbReal;
  const totImagNom = dynAmpNom * Math.sin(dynPhaseNom) + srImag + tbImag;
  const nominalAmplitudeUm = Math.sqrt(totRealNom * totRealNom + totImagNom * totImagNom);
  let nominalPhaseDeg = (Math.atan2(totImagNom, totRealNom) * 180) / Math.PI;
  if (nominalPhaseDeg < 0) nominalPhaseDeg += 360;

  // Separation Margin
  const separationMarginPercent = (Math.abs(nominalRpm - criticalSpeedRpm) / criticalSpeedRpm) * 100;
  // API 684 nominative guideline: SM >= 16% if Q > 2.5
  const isSeparationCompliant = amplificationFactorQ <= 2.5 || separationMarginPercent >= 16;

  // Half-power bandwidth (-3dB) resonance band
  const bandHalfWidth = criticalSpeedRpm / (2 * amplificationFactorQ);
  const resonanceBandRpm: [number, number] = [
    Math.max(0, Math.round(criticalSpeedRpm - bandHalfWidth)),
    Math.round(criticalSpeedRpm + bandHalfWidth),
  ];

  // Dwell time in resonance band during startup
  const bandRpmSpan = resonanceBandRpm[1] - resonanceBandRpm[0];
  const dwellTimeSeconds = accelRateRpmPerSec > 0 ? bandRpmSpan / accelRateRpmPerSec : 0;

  const benchmarkNotes: string[] = [
    `Undamped Critical Speed at ${Math.round(criticalSpeedRpm)} RPM (${criticalSpeedHz.toFixed(1)} Hz).`,
    `Amplification Factor Q = ${amplificationFactorQ.toFixed(2)} (${dampingRatio < 0.05 ? 'Under-damped, sharp peak' : 'Well-damped envelope'}).`,
    `Separation Margin: ${separationMarginPercent.toFixed(1)}% vs. reference benchmark minimum of 16.0%.`,
    `Resonance dwell window: ${dwellTimeSeconds.toFixed(1)}s at ${accelRateRpmPerSec} RPM/sec acceleration rate.`,
    'Notice: Values are theoretical Jeffcott dynamic simulations for educational screening under nominative benchmark guidelines.',
  ];

  return {
    criticalSpeedRpm: Math.round(criticalSpeedRpm),
    criticalSpeedHz: Number(criticalSpeedHz.toFixed(1)),
    amplificationFactorQ: Number(amplificationFactorQ.toFixed(2)),
    peakResonantAmplitudeUm: Number(peakResonantAmplitudeUm.toFixed(2)),
    peakResonantPhaseDeg: Number(peakResonantPhaseDeg.toFixed(1)),
    nominalAmplitudeUm: Number(nominalAmplitudeUm.toFixed(2)),
    nominalPhaseDeg: Number(nominalPhaseDeg.toFixed(1)),
    separationMarginPercent: Number(separationMarginPercent.toFixed(1)),
    isSeparationCompliant,
    bodeProfile,
    nyquistProfile,
    dwellTimeSeconds: Number(dwellTimeSeconds.toFixed(2)),
    resonanceBandRpm,
    slowRollCompensated: slowRollRunoutUm > 0,
    benchmarkNotes,
  };
}
