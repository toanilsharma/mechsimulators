import {
  BearingGeometry,
  BearingFrequencies,
  SpectralPeak,
  OrbitPoint,
  OrbitDiagnostics,
  WaterfallSlice,
  SpectralDiagnosis,
  SpectralPreset,
  VibrationUnit,
  MachineryClass,
  ISOZone,
} from '../types/spectralLab';

// ============================================================================
// 1. STANDARD ROLLER & BALL BEARING DATABASE
// ============================================================================
export const STANDARD_BEARINGS: BearingGeometry[] = [
  {
    id: 'skf_6205',
    name: 'SKF 6205 Deep Groove Ball (Electric Motor DE)',
    manufacturer: 'SKF',
    type: 'Deep Groove Ball Bearing',
    numberOfBalls: 9,
    ballDiameterMm: 7.94,
    pitchDiameterMm: 38.5,
    contactAngleDeg: 0,
  },
  {
    id: 'skf_6309',
    name: 'SKF 6309 Heavy-Duty Ball (Pump Radial Bearing)',
    manufacturer: 'SKF',
    type: 'Deep Groove Ball Bearing',
    numberOfBalls: 8,
    ballDiameterMm: 17.46,
    pitchDiameterMm: 72.5,
    contactAngleDeg: 0,
  },
  {
    id: 'skf_7312',
    name: 'SKF 7312 BECBM 40° Angular Contact (API 610 Thrust Pair)',
    manufacturer: 'SKF',
    type: 'Angular Contact Ball Bearing',
    numberOfBalls: 12,
    ballDiameterMm: 22.22,
    pitchDiameterMm: 95.0,
    contactAngleDeg: 40,
  },
  {
    id: 'skf_22218',
    name: 'SKF 22218 CC/W33 Spherical Roller (Heavy Overhung Fan)',
    manufacturer: 'SKF',
    type: 'Spherical Roller Bearing',
    numberOfBalls: 17,
    ballDiameterMm: 19.0,
    pitchDiameterMm: 125.0,
    contactAngleDeg: 10,
  },
  {
    id: 'nu_210',
    name: 'SKF NU 210 ECP Cylindrical Roller (High Radial Load Drive)',
    manufacturer: 'SKF',
    type: 'Cylindrical Roller Bearing',
    numberOfBalls: 14,
    ballDiameterMm: 11.0,
    pitchDiameterMm: 65.0,
    contactAngleDeg: 0,
  },
  {
    id: 'custom',
    name: 'Custom User-Defined Bearing Kinematics',
    manufacturer: 'Generic / Custom',
    type: 'User Configurable',
    numberOfBalls: 10,
    ballDiameterMm: 12.0,
    pitchDiameterMm: 60.0,
    contactAngleDeg: 0,
  },
];

// ============================================================================
// 2. BEARING KINEMATIC FREQUENCY FORMULAS (HARRIS & ISO 15243)
// ============================================================================
export function calculateBearingFrequencies(
  geometry: BearingGeometry,
  shaftRpm: number
): BearingFrequencies {
  const fr = shaftRpm / 60; // Shaft speed in Hz (1X)
  const Z = geometry.numberOfBalls;
  const Dw = geometry.ballDiameterMm;
  const dm = geometry.pitchDiameterMm;
  const alphaRad = (geometry.contactAngleDeg * Math.PI) / 180;
  const ratio = (Dw / dm) * Math.cos(alphaRad);

  // Orders (multiples of 1X running speed)
  const bpfoOrder = (Z / 2) * (1 - ratio);
  const bpfiOrder = (Z / 2) * (1 + ratio);
  const bsfOrder = (dm / (2 * Dw)) * (1 - Math.pow(ratio, 2));
  const ftfOrder = (1 / 2) * (1 - ratio);

  return {
    bpfoOrder: Number(bpfoOrder.toFixed(3)),
    bpfiOrder: Number(bpfiOrder.toFixed(3)),
    bsfOrder: Number(bsfOrder.toFixed(3)),
    ftfOrder: Number(ftfOrder.toFixed(3)),
    bpfoHz: Number((bpfoOrder * fr).toFixed(2)),
    bpfiHz: Number((bpfiOrder * fr).toFixed(2)),
    bsfHz: Number((bsfOrder * fr).toFixed(2)),
    ftfHz: Number((ftfOrder * fr).toFixed(2)),
  };
}

// ============================================================================
// 3. UNIT CONVERSIONS (VELOCITY, DISPLACEMENT, ACCELERATION)
// ============================================================================
export function convertVibrationAmplitude(
  velocityMmSRms: number,
  frequencyHz: number,
  targetUnit: VibrationUnit
): number {
  const f = Math.max(frequencyHz, 0.5); // avoid divide by zero
  switch (targetUnit) {
    case 'mm/s_rms':
      return velocityMmSRms;
    case 'in/s_pk':
      // 1 mm/s RMS = (1 / 25.4) * sqrt(2) in/s pk = 0.05566 in/s pk
      return velocityMmSRms * (Math.SQRT2 / 25.4);
    case 'um_pkpk': {
      // D_pkpk (um) = (V_rms * sqrt(2) * 1000) / (pi * f)
      return (velocityMmSRms * Math.SQRT2 * 1000) / (Math.PI * f);
    }
    case 'mil_pkpk': {
      // um to mils (1 mil = 25.4 um)
      const um = (velocityMmSRms * Math.SQRT2 * 1000) / (Math.PI * f);
      return um / 25.4;
    }
    case 'g_rms': {
      // a = (2 * pi * f * V_rms / 1000) / 9.80665
      return (2 * Math.PI * f * (velocityMmSRms / 1000)) / 9.80665;
    }
    default:
      return velocityMmSRms;
  }
}

// ============================================================================
// 4. ISO 10816-3 & ISO 7919 EVALUATION CRITERIA
// ============================================================================
export interface ISOThresholds {
  zoneA_B: number; // Border between Good and Acceptable (mm/s RMS)
  zoneB_C: number; // Border between Acceptable and Alert (mm/s RMS)
  zoneC_D: number; // Border between Alert and Danger/Trip (mm/s RMS)
}

export function getISO10816Thresholds(
  machineryClass: MachineryClass,
  isRigidFoundation: boolean
): ISOThresholds {
  switch (machineryClass) {
    case 'Class_I': // Small machines < 15kW
      return { zoneA_B: 0.71, zoneB_C: 1.8, zoneC_D: 4.5 };
    case 'Class_II': // Medium machines 15 - 75 kW
      return isRigidFoundation
        ? { zoneA_B: 1.4, zoneB_C: 2.8, zoneC_D: 4.5 }
        : { zoneA_B: 1.8, zoneB_C: 4.5, zoneC_D: 7.1 };
    case 'Class_III': // Large machines > 300kW rigid
      return isRigidFoundation
        ? { zoneA_B: 2.3, zoneB_C: 4.5, zoneC_D: 7.1 }
        : { zoneA_B: 3.5, zoneB_C: 7.1, zoneC_D: 11.0 };
    case 'Class_IV': // Large machines flexible
    default:
      return { zoneA_B: 3.5, zoneB_C: 7.1, zoneC_D: 11.0 };
  }
}

export function evaluateISOZone(
  velocityMmSRms: number,
  thresholds: ISOThresholds
): { zone: ISOZone; label: string; color: string } {
  if (velocityMmSRms < thresholds.zoneA_B) {
    return { zone: 'A', label: 'Zone A: Good / Newly Commissioned', color: '#10b981' };
  } else if (velocityMmSRms < thresholds.zoneB_C) {
    return { zone: 'B', label: 'Zone B: Acceptable for Unrestricted Long-Term Operation', color: '#38bdf8' };
  } else if (velocityMmSRms < thresholds.zoneC_D) {
    return { zone: 'C', label: 'Zone C: Unsatisfactory / Restricted Operation (Maintenance Required)', color: '#f59e0b' };
  } else {
    return { zone: 'D', label: 'Zone D: Unacceptable / Danger (Mandatory Emergency Trip)', color: '#ef4444' };
  }
}

// ============================================================================
// 5. HIGH-FIDELITY FFT SPECTRUM SYNTHESIZER
// ============================================================================
export function generateSynthesizedSpectrum(
  params: SpectralPreset,
  bearingGeo: BearingGeometry,
  targetUnit: VibrationUnit,
  maxOrder: number = 10,
  resolutionBins: number = 512
): {
  spectrumPoints: { order: number; freqHz: number; amp: number }[];
  discretePeaks: SpectralPeak[];
  bearingFrequencies: BearingFrequencies;
} {
  const shaftRpm = params.shaftRpm;
  const f1X = shaftRpm / 60; // 1X in Hz
  const bearingFreqs = calculateBearingFrequencies(bearingGeo, shaftRpm);

  // Peak list
  const peaks: SpectralPeak[] = [];

  // 1X Unbalance
  if (params.unbalance1XAmp > 0.05) {
    peaks.push({
      freqHz: Number(f1X.toFixed(2)),
      order: 1.0,
      amplitude: params.unbalance1XAmp,
      phaseDeg: 45,
      label: '1X Running Speed (Unbalance)',
    });
  }

  // 2X Misalignment
  if (params.misalignment2XAmp > 0.05) {
    peaks.push({
      freqHz: Number((f1X * 2).toFixed(2)),
      order: 2.0,
      amplitude: params.misalignment2XAmp,
      phaseDeg: 180,
      label: '2X Harmonics (Coupling Misalignment)',
      isHarmonic: true,
    });
  }

  // 3X Misalignment / Cocked Bearing
  if (params.misalignment3XAmp > 0.05) {
    peaks.push({
      freqHz: Number((f1X * 3).toFixed(2)),
      order: 3.0,
      amplitude: params.misalignment3XAmp,
      phaseDeg: 270,
      label: '3X Harmonics (Angular Misalignment / Cocked Bearing)',
      isHarmonic: true,
    });
  }

  // Sub-harmonic: Oil Whirl or Mechanical Looseness
  if (params.subharmonicType === 'oil_whirl_0_45X' && params.subharmonicAmp > 0.05) {
    peaks.push({
      freqHz: Number((f1X * 0.43).toFixed(2)),
      order: 0.43,
      amplitude: params.subharmonicAmp,
      phaseDeg: 120,
      label: '0.43X Fluid Film Oil Whirl (Hydrodynamic Instability)',
      isSubharmonic: true,
    });
  } else if (params.subharmonicType === 'looseness_0_5X' && params.subharmonicAmp > 0.05) {
    peaks.push({
      freqHz: Number((f1X * 0.5).toFixed(2)),
      order: 0.5,
      amplitude: params.subharmonicAmp,
      phaseDeg: 90,
      label: '0.5X Sub-Harmonic (Mechanical Looseness / Rotating Rub)',
      isSubharmonic: true,
    });
    // Add 1.5X and 2.5X for mechanical looseness
    peaks.push({
      freqHz: Number((f1X * 1.5).toFixed(2)),
      order: 1.5,
      amplitude: params.subharmonicAmp * 0.55,
      phaseDeg: 135,
      label: '1.5X Fractional Order (Looseness Harmonics)',
      isSubharmonic: true,
    });
  }

  // Vane Pass Frequency (Z_impeller * 1X)
  if (params.vanePassAmp > 0.05 && params.vanePassVaneCount > 0) {
    const vpfOrder = params.vanePassVaneCount;
    peaks.push({
      freqHz: Number((f1X * vpfOrder).toFixed(2)),
      order: vpfOrder,
      amplitude: params.vanePassAmp,
      phaseDeg: 60,
      label: `VPF (${vpfOrder}X Vane Pass Frequency - Hydraulic Pulse)`,
    });
  }

  // Bearing Defect Frequencies
  if (params.bearingDefectType !== 'none' && params.bearingDefectAmp > 0.05) {
    let defectOrder = bearingFreqs.bpfoOrder;
    let defectLabel = 'BPFO (Ball Pass Outer Race Flaking)';

    if (params.bearingDefectType === 'inner_race') {
      defectOrder = bearingFreqs.bpfiOrder;
      defectLabel = 'BPFI (Ball Pass Inner Race Spall)';
    } else if (params.bearingDefectType === 'ball_spin') {
      defectOrder = bearingFreqs.bsfOrder;
      defectLabel = 'BSF (Ball / Roller Spin Element Defect)';
    } else if (params.bearingDefectType === 'cage') {
      defectOrder = bearingFreqs.ftfOrder;
      defectLabel = 'FTF (Cage / Fundamental Train Pocket Wear)';
    }

    // Fundamental defect peak
    peaks.push({
      freqHz: Number((f1X * defectOrder).toFixed(2)),
      order: Number(defectOrder.toFixed(2)),
      amplitude: params.bearingDefectAmp,
      phaseDeg: 210,
      label: defectLabel,
      isBearingDefect: true,
    });

    // 2X Defect Harmonic
    if (defectOrder * 2 <= maxOrder) {
      peaks.push({
        freqHz: Number((f1X * defectOrder * 2).toFixed(2)),
        order: Number((defectOrder * 2).toFixed(2)),
        amplitude: params.bearingDefectAmp * 0.45,
        phaseDeg: 30,
        label: `2x ${defectLabel}`,
        isBearingDefect: true,
        isHarmonic: true,
      });
    }

    // Sidebands: For BPFI, modulation by 1X shaft rotation creates sidebands (BPFI +/- 1X)
    if (params.bearingDefectType === 'inner_race') {
      if (defectOrder - 1.0 > 0) {
        peaks.push({
          freqHz: Number((f1X * (defectOrder - 1.0)).toFixed(2)),
          order: Number((defectOrder - 1.0).toFixed(2)),
          amplitude: params.bearingDefectAmp * 0.32,
          phaseDeg: 190,
          label: 'BPFI - 1X Sideband (Shaft Modulation)',
          isBearingDefect: true,
        });
      }
      if (defectOrder + 1.0 <= maxOrder) {
        peaks.push({
          freqHz: Number((f1X * (defectOrder + 1.0)).toFixed(2)),
          order: Number((defectOrder + 1.0).toFixed(2)),
          amplitude: params.bearingDefectAmp * 0.35,
          phaseDeg: 230,
          label: 'BPFI + 1X Sideband (Shaft Modulation)',
          isBearingDefect: true,
        });
      }
    }
  }

  // Convert discrete peaks to target unit
  const convertedPeaks: SpectralPeak[] = peaks.map((p) => ({
    ...p,
    amplitude: Number(convertVibrationAmplitude(p.amplitude, p.freqHz, targetUnit).toFixed(3)),
  }));

  // Generate continuous synthetic spectrum curve (resolutionBins points from 0 to maxOrder)
  const spectrumPoints: { order: number; freqHz: number; amp: number }[] = [];
  const deltaOrder = maxOrder / resolutionBins;

  // Background noise floor (cavitation broadband noise raises floor at higher frequencies)
  const baseNoise = 0.08 + (params.cavitationNoiseAmp > 0 ? params.cavitationNoiseAmp * 0.4 : 0.0);

  for (let i = 0; i <= resolutionBins; i++) {
    const order = i * deltaOrder;
    const freqHz = order * f1X;

    // Base noise with random micro-ripples + cavitation acoustic floor
    let valMmS = baseNoise * (0.8 + 0.4 * Math.sin(order * 17.3 + 1.2));
    if (params.cavitationNoiseAmp > 0) {
      // Cavitation creates broadband elevated high-frequency floor ("grass")
      const highFreqFactor = Math.min(1.0, Math.max(0.1, (order - 2.5) / 5.0));
      valMmS += params.cavitationNoiseAmp * 0.6 * highFreqFactor * (0.8 + 0.4 * Math.cos(order * 31.7));
    }

    // Add resonance skirts around discrete peaks (Lorentzian/Gaussian distribution)
    for (const peak of peaks) {
      const dist = Math.abs(order - peak.order);
      const halfWidth = 0.05; // sharp spectral resolution
      if (dist < 0.45) {
        const shape = peak.amplitude / (1 + Math.pow(dist / halfWidth, 2));
        valMmS += shape;
      }
    }

    // Convert amplitude to target unit
    const convertedAmp = convertVibrationAmplitude(valMmS, Math.max(freqHz, 2), targetUnit);
    spectrumPoints.push({
      order: Number(order.toFixed(3)),
      freqHz: Number(freqHz.toFixed(1)),
      amp: Number(Math.max(0.001, convertedAmp).toFixed(4)),
    });
  }

  return {
    spectrumPoints,
    discretePeaks: convertedPeaks,
    bearingFrequencies: bearingFreqs,
  };
}

// ============================================================================
// 6. X-Y ORBIT GENERATOR & LISSAJOUS DIAGNOSTICS (API 670 BENTLY STYLE)
// ============================================================================
export function generateShaftOrbit(
  params: SpectralPreset,
  totalPoints: number = 256
): {
  orbitPoints: OrbitPoint[];
  diagnostics: OrbitDiagnostics;
} {
  const points: OrbitPoint[] = [];
  const clearance = params.radialClearanceUm; // e.g. 60-120 um

  // 1X Unbalance amplitude (um)
  const amp1X = Math.min(clearance * 0.85, (params.unbalance1XAmp / 4.5) * clearance * 0.5);
  // 2X Misalignment amplitude (um)
  const amp2X = Math.min(clearance * 0.6, (params.misalignment2XAmp / 4.5) * clearance * 0.45);
  // Subharmonic (0.43X or 0.5X)
  const ampSub = (params.subharmonicAmp / 4.5) * clearance * 0.35;
  const subRatio = params.subharmonicType === 'oil_whirl_0_45X' ? 0.43 : 0.5;

  let maxR = 0;
  let minR = Infinity;
  let maxCross = 0;

  for (let i = 0; i < totalPoints; i++) {
    const theta = (2 * Math.PI * i) / totalPoints;

    // Orthogonal 90 deg displacement (X at 45 deg, Y at 135 deg)
    // 1X unbalance: Elliptical orbit with phase lag
    let x = amp1X * Math.cos(theta);
    let y = amp1X * 0.75 * Math.sin(theta + Math.PI / 6);

    // 2X misalignment: Introduces secondary loop / figure-8
    if (amp2X > 1.0) {
      x += amp2X * Math.cos(2 * theta + Math.PI / 4);
      y += amp2X * Math.sin(2 * theta + Math.PI / 2);
    }

    // Sub-harmonic: precession inner loops
    if (ampSub > 1.0) {
      x += ampSub * Math.cos(subRatio * theta * 4);
      y += ampSub * Math.sin(subRatio * theta * 4);
    }

    // Mechanical Rub: Truncation if radial position exceeds bearing clearance
    const r = Math.sqrt(x * x + y * y);
    if (params.rubSeverity > 0.1 && r > clearance * 0.8) {
      const clipFactor = Math.pow(clearance * 0.8 / r, params.rubSeverity * 2.0);
      x *= clipFactor;
      y *= clipFactor;
    }

    // Filtered 1X only component (Bently 1X vector)
    const xFiltered = amp1X * Math.cos(theta);
    const yFiltered = amp1X * 0.75 * Math.sin(theta + Math.PI / 6);

    // Keyphasor trigger: Once per 1X revolution at theta ~ 0
    const keyphasor = i === 0;

    points.push({
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      keyphasor,
      xFiltered: Number(xFiltered.toFixed(2)),
      yFiltered: Number(yFiltered.toFixed(2)),
    });

    const curR = Math.sqrt(x * x + y * y);
    if (curR > maxR) maxR = curR;
    if (curR < minR) minR = curR;
    if (Math.abs(x * y) > maxCross) maxCross = Math.abs(x * y);
  }

  // Diagnose Orbit Pattern
  let patternShape: OrbitDiagnostics['patternShape'] = 'Elliptical';
  let precession: OrbitDiagnostics['orbitPrecession'] = 'Forward';
  let summary = 'Normal elliptical orbit dominated by 1X unbalance synchronous vector.';

  if (params.rubSeverity > 0.3) {
    patternShape = 'Clipped / Truncated';
    summary = 'Flattened outer boundary indicating severe shaft-to-seal/bearing mechanical rub.';
  } else if (params.misalignment2XAmp > 2.5) {
    patternShape = 'Figure-8 (Double Loop)';
    summary = 'Distinct double loop / figure-8 pattern diagnostic of severe coupling angular & offset misalignment.';
  } else if (params.subharmonicAmp > 2.0) {
    patternShape = 'Precession Loop';
    precession = 'Mixed';
    summary = 'Internal precessing sub-harmonic loop characteristic of hydrodynamic oil whirl / fluid film instability.';
  } else if (maxR < clearance * 0.2) {
    patternShape = 'Circular';
    summary = 'Well-centered, low-amplitude orbit within normal API 670 operating tolerances.';
  }

  const diagnostics: OrbitDiagnostics = {
    peakToPeakX: Number((maxR * 2).toFixed(1)),
    peakToPeakY: Number((maxR * 1.6).toFixed(1)),
    eccentricityRatio: Number(Math.min(1.0, maxR / clearance).toFixed(2)),
    orbitPrecession: precession,
    patternShape,
    summaryDescription: summary,
  };

  return { orbitPoints: points, diagnostics };
}

// ============================================================================
// 7. WATERFALL / CASCADE MULTI-SPEED RUN-UP GENERATOR
// ============================================================================
export function generateWaterfallCascade(
  baseParams: SpectralPreset,
  bearingGeo: BearingGeometry,
  targetUnit: VibrationUnit,
  rpmSteps: number[] = [800, 1200, 1500, 1800, 2100, 2400, 2700, 3000, 3300, 3600]
): WaterfallSlice[] {
  // Model 1st critical bending resonance at 1800 RPM
  const criticalRpm = 1800;
  const dampingRatio = 0.08; // Q ~ 6.25

  return rpmSteps.map((rpm) => {
    // Critical speed amplification factor
    const ratio = rpm / criticalRpm;
    const amplification = 1 / Math.sqrt(Math.pow(1 - ratio * ratio, 2) + Math.pow(2 * dampingRatio * ratio, 2));

    const scaledParams: SpectralPreset = {
      ...baseParams,
      shaftRpm: rpm,
      unbalance1XAmp: baseParams.unbalance1XAmp * Math.min(3.5, 0.4 + 0.6 * amplification),
      misalignment2XAmp: baseParams.misalignment2XAmp * (rpm / 3000),
    };

    const synth = generateSynthesizedSpectrum(scaledParams, bearingGeo, targetUnit, 6.0, 128);

    return {
      rpm,
      spectrum: synth.spectrumPoints,
    };
  });
}

// ============================================================================
// 8. DIAGNOSTIC EVALUATION ENGINE
// ============================================================================
export function evaluateSpectralCondition(
  params: SpectralPreset,
  bearingGeo: BearingGeometry,
  machineryClass: MachineryClass = 'Class_II',
  isRigidFoundation: boolean = true
): SpectralDiagnosis {
  const f1X = params.shaftRpm / 60;
  const bearingFreqs = calculateBearingFrequencies(bearingGeo, params.shaftRpm);
  const thresholds = getISO10816Thresholds(machineryClass, isRigidFoundation);

  // Calculate RMS Velocity via RSS sum of components
  const v1X = params.unbalance1XAmp;
  const v2X = params.misalignment2XAmp;
  const v3X = params.misalignment3XAmp;
  const vSub = params.subharmonicAmp;
  const vBear = params.bearingDefectAmp;
  const vVane = params.vanePassAmp;
  const vCav = params.cavitationNoiseAmp * 1.5;

  const totalVelocityRms = Math.sqrt(
    Math.pow(v1X, 2) +
    Math.pow(v2X, 2) +
    Math.pow(v3X, 2) +
    Math.pow(vSub, 2) +
    Math.pow(vBear, 2) +
    Math.pow(vVane, 2) +
    Math.pow(vCav, 2) +
    0.15
  );

  const isoEval = evaluateISOZone(totalVelocityRms, thresholds);

  // Peak-to-peak displacement (um) at dominant frequency
  const dispUm = convertVibrationAmplitude(totalVelocityRms, f1X, 'um_pkpk');
  // Acceleration (g)
  const accelG = convertVibrationAmplitude(totalVelocityRms, f1X * 2, 'g_rms');

  const findings: SpectralDiagnosis['faultFindings'] = [];
  const recommendations: string[] = [];

  // Determine dominant fault
  let dominantFault = 'Normal Synchronous Baseline';
  let maxComponent = v1X;
  let dominantOrder = '1X';
  let dominantFreq = f1X;

  if (v2X > maxComponent) {
    dominantFault = 'Severe Shaft / Coupling Misalignment';
    maxComponent = v2X;
    dominantOrder = '2X';
    dominantFreq = f1X * 2;
  }
  if (vSub > maxComponent) {
    dominantFault = params.subharmonicType === 'oil_whirl_0_45X' ? 'Fluid Film Oil Whirl' : 'Mechanical Looseness';
    maxComponent = vSub;
    dominantOrder = params.subharmonicType === 'oil_whirl_0_45X' ? '0.43X' : '0.5X';
    dominantFreq = f1X * (params.subharmonicType === 'oil_whirl_0_45X' ? 0.43 : 0.5);
  }
  if (vBear > maxComponent) {
    dominantFault = `Rolling Element Bearing Defect (${params.bearingDefectType.replace('_', ' ').toUpperCase()})`;
    maxComponent = vBear;
    dominantOrder = `${bearingFreqs.bpfoOrder}X`;
    dominantFreq = bearingFreqs.bpfoHz;
  }
  if (vCav > maxComponent && params.cavitationNoiseAmp > 2.0) {
    dominantFault = 'Acoustic Cavitation & Suction Recirculation';
    maxComponent = vCav;
    dominantOrder = 'Broadband High Frequency (1-10 kHz)';
    dominantFreq = 2500;
  }

  // Construct Fault Findings
  if (v1X > 4.5) {
    findings.push({
      title: 'High 1X Synchronous Unbalance',
      description: `1X vibration amplitude is ${v1X.toFixed(1)} mm/s RMS. Indicates mass eccentricity or accumulated debris on rotating elements.`,
      severity: v1X > 7.1 ? 'critical' : 'warning',
      standardRef: 'ISO 1940 / ISO 10816-3',
    });
    recommendations.push('Perform single- or two-plane dynamic balancing per ISO 1940 Grade G2.5.');
  }

  if (v2X > 3.0) {
    findings.push({
      title: 'Dominant 2X Coupling Misalignment',
      description: `2X harmonic peak at ${v2X.toFixed(1)} mm/s RMS with phase opposition across coupling hubs.`,
      severity: v2X > 6.0 ? 'critical' : 'warning',
      standardRef: 'API 686 Chapter 5 (Reverse Indicator / Laser Alignment)',
    });
    recommendations.push('Perform precision optical laser alignment under thermal equilibrium to < 0.05 mm/100 mm offset/angularity.');
  }

  if (vBear > 1.5) {
    findings.push({
      title: `Active Bearing Defect Frequency (${bearingGeo.name})`,
      description: `Detected harmonic spikes corresponding to calculated kinematic fault order. Flaking or micro-spalling in race track.`,
      severity: vBear > 3.5 ? 'critical' : 'caution',
      standardRef: 'ISO 15243 Bearing Failure Modes',
    });
    recommendations.push('Schedule bearing replacement at earliest planned outage; sample lubrication oil for metallic wear debris (ISO 4406).');
  }

  if (params.rubSeverity > 0.2) {
    findings.push({
      title: 'Shaft-to-Casing Contact / Mechanical Rub',
      description: 'Orbit truncation and multiple integer harmonics detected. High risk of thermal shaft bow and catastrophic seal seizure.',
      severity: 'critical',
      standardRef: 'API 670 Machinery Protection Systems',
    });
    recommendations.push('Immediately inspect internal labyrinth/seal clearances and inspect for rotor thermal bowing.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Machine vibration profile conforms to ISO 10816 Zone A/B. Continue routine predictive condition monitoring schedule.');
  }

  const confidence = Math.min(98, 65 + (maxComponent / (totalVelocityRms || 1)) * 30);

  return {
    overallVelocityRms: Number(totalVelocityRms.toFixed(2)),
    overallDisplacementPkPk: Number(dispUm.toFixed(1)),
    overallAccelerationG: Number(accelG.toFixed(2)),
    dominantOrder,
    dominantFreqHz: Number(dominantFreq.toFixed(1)),
    isoZone: isoEval.zone,
    isoZoneLabel: isoEval.label,
    primaryDefect: dominantFault,
    confidenceScore: Number(confidence.toFixed(1)),
    confidencePercent: Math.round(confidence),
    faultFindings: findings,
    maintenanceRecommendations: recommendations,
  };
}

// ============================================================================
// 9. PRE-LOADED INDUSTRIAL BENCHMARKS & CASE SIGNATURES
// ============================================================================
export const SPECTRAL_PRESETS: SpectralPreset[] = [
  {
    id: 'pristine_baseline',
    title: 'Pristine Commissioning Baseline (API 610 BB2 Pump)',
    machineType: 'API 610 Centrifugal Pump (Motor Driven)',
    description: 'Freshly laser-aligned train with dynamically balanced impeller (ISO G2.5). Vibration resides in pristine ISO Zone A.',
    shaftRpm: 2980,
    bearingId: 'skf_6309',
    unbalance1XAmp: 0.8,
    misalignment2XAmp: 0.3,
    misalignment3XAmp: 0.1,
    cavitationNoiseAmp: 0.1,
    vanePassVaneCount: 5,
    vanePassAmp: 0.2,
    bearingDefectType: 'none',
    bearingDefectAmp: 0.0,
    subharmonicType: 'none',
    subharmonicAmp: 0.0,
    rubSeverity: 0.0,
    radialClearanceUm: 80,
  },
  {
    id: 'heavy_unbalance',
    title: 'Severe Centrifugal Rotor Unbalance (1X Dominant)',
    machineType: 'Overhung Process Fan / Pump Impeller',
    description: 'Significant 1X sinusoidal peak caused by lost balancing clip or severe uneven particulate deposition. Pure elliptical orbit.',
    shaftRpm: 2950,
    bearingId: 'skf_6309',
    unbalance1XAmp: 8.4,
    misalignment2XAmp: 0.9,
    misalignment3XAmp: 0.3,
    cavitationNoiseAmp: 0.2,
    vanePassVaneCount: 6,
    vanePassAmp: 0.4,
    bearingDefectType: 'none',
    bearingDefectAmp: 0.0,
    subharmonicType: 'none',
    subharmonicAmp: 0.0,
    rubSeverity: 0.0,
    radialClearanceUm: 90,
  },
  {
    id: 'coupling_misalignment',
    title: 'Coupling Misalignment (2X Dominant & Figure-8 Orbit)',
    machineType: 'Centrifugal Compressor Train with Flexible Disc Coupling',
    description: 'Pronounced 2X peak with 180° phase shift across spacer. Orbit exhibits classic Bently Nevada figure-8 peanut shape.',
    shaftRpm: 3000,
    bearingId: 'skf_7312',
    unbalance1XAmp: 2.2,
    misalignment2XAmp: 7.8,
    misalignment3XAmp: 2.8,
    cavitationNoiseAmp: 0.2,
    vanePassVaneCount: 7,
    vanePassAmp: 0.5,
    bearingDefectType: 'none',
    bearingDefectAmp: 0.0,
    subharmonicType: 'none',
    subharmonicAmp: 0.0,
    rubSeverity: 0.0,
    radialClearanceUm: 100,
  },
  {
    id: 'bearing_bpfo_flaking',
    title: 'Bearing Outer Race Flaking (BPFO Harmonics & Sidebands)',
    machineType: 'Motor NDE Spherical Roller Bearing',
    description: 'Subsurface fatigue spalling on outer ring track producing synchronous impact trains at BPFO with 1X sideband modulation.',
    shaftRpm: 1780,
    bearingId: 'skf_22218',
    unbalance1XAmp: 1.4,
    misalignment2XAmp: 0.8,
    misalignment3XAmp: 0.2,
    cavitationNoiseAmp: 0.4,
    vanePassVaneCount: 5,
    vanePassAmp: 0.3,
    bearingDefectType: 'outer_race',
    bearingDefectAmp: 4.6,
    subharmonicType: 'none',
    subharmonicAmp: 0.0,
    rubSeverity: 0.0,
    radialClearanceUm: 85,
  },
  {
    id: 'oil_whirl_instability',
    title: 'Hydrodynamic Fluid Film Oil Whirl (0.43X Sub-synchronous)',
    machineType: 'High-Speed Multistage Feed Pump (Tilt-Pad / Sleeve Bearings)',
    description: 'Lightly loaded journal bearing unstable fluid wedge precession at 43% of running speed. Unstable forward precession orbit loop.',
    shaftRpm: 3550,
    bearingId: 'skf_6205',
    unbalance1XAmp: 1.8,
    misalignment2XAmp: 0.6,
    misalignment3XAmp: 0.2,
    cavitationNoiseAmp: 0.3,
    vanePassVaneCount: 6,
    vanePassAmp: 0.4,
    bearingDefectType: 'none',
    bearingDefectAmp: 0.0,
    subharmonicType: 'oil_whirl_0_45X',
    subharmonicAmp: 6.2,
    rubSeverity: 0.0,
    radialClearanceUm: 120,
  },
  {
    id: 'severe_rub_looseness',
    title: 'Severe Mechanical Rub & Foundation Looseness (Clipped Orbit)',
    machineType: 'API 610 Refinery Process Pump in Casing Bind',
    description: 'Rotor contacting casing throat bushing. Truncated flat-edge orbit with 0.5X, 1.5X, 2.5X fractional sub-harmonics.',
    shaftRpm: 2950,
    bearingId: 'skf_6309',
    unbalance1XAmp: 3.8,
    misalignment2XAmp: 3.2,
    misalignment3XAmp: 2.1,
    cavitationNoiseAmp: 1.2,
    vanePassVaneCount: 5,
    vanePassAmp: 0.8,
    bearingDefectType: 'none',
    bearingDefectAmp: 0.0,
    subharmonicType: 'looseness_0_5X',
    subharmonicAmp: 5.4,
    rubSeverity: 0.75,
    radialClearanceUm: 70,
  },
];
