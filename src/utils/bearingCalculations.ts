import { BearingFaultInputs, BearingFaultOutputs, BearingFaultFrequencies, BearingSpectralLine } from '../types/bearing';
import { STANDARD_BEARINGS, calculateBearingFrequencies } from './spectralCalculations';
import { StatusAssessment, AuditStep } from '../types/common';

/**
 * ISO 281 Lubricant Reference Viscosity nu1 (cSt)
 * Approximated based on pitch diameter dm and shaft speed n
 * nu1 = 45000 * n^(-0.83) * dm^(-0.5) (for n < 1000) or standard ISO 281 chart
 */
export function calculateReferenceViscosityNu1(pitchDiameterMm: number, speedRpm: number): number {
  const n = Math.max(10, speedRpm);
  const dm = Math.max(10, pitchDiameterMm);
  return Math.max(4.0, 45000 * Math.pow(n, -0.83) * Math.pow(dm, -0.5));
}

/**
 * Kinematic Viscosity at Operating Temp T (°C) from 40°C rated viscosity
 * ASTM D341 Walther formula approximation
 */
export function calculateOperatingViscosity(viscosity40C: number, tempC: number): number {
  const t = Math.max(10, tempC);
  // Power-law temperature degradation exponent
  return Math.max(2.0, viscosity40C * Math.pow(40 / t, 1.45));
}

export function calculateBearingFaults(inputs: BearingFaultInputs): BearingFaultOutputs {
  const geom = STANDARD_BEARINGS.find((b) => b.id === inputs.bearingId) || STANDARD_BEARINGS[0];
  const shaftRpm = Math.max(60, inputs.shaftSpeedRpm);
  const frHz = shaftRpm / 60;

  // 1. Fundamental Kinematic Bearing Frequencies per Harris & ISO 15243
  const rawFreqs = calculateBearingFrequencies(geom, shaftRpm);
  const frequencies: BearingFaultFrequencies = {
    runningSpeedHz: Number(frHz.toFixed(2)),
    bpfoHz: rawFreqs.bpfoHz,
    bpfiHz: rawFreqs.bpfiHz,
    bsfHz: rawFreqs.bsfHz,
    ftfHz: rawFreqs.ftfHz,
    bpfoOrder: rawFreqs.bpfoOrder,
    bpfiOrder: rawFreqs.bpfiOrder,
    bsfOrder: rawFreqs.bsfOrder,
    ftfOrder: rawFreqs.ftfOrder,
  };

  // 2. Lubrication Film (ISO 281 kappa ratio)
  const nu1 = calculateReferenceViscosityNu1(geom.pitchDiameterMm, shaftRpm);
  const nuOperating = calculateOperatingViscosity(inputs.oilViscosityCSt, inputs.bearingTempC);
  const kappa = Math.max(0.1, Number((nuOperating / nu1).toFixed(2)));

  // 3. Fault Stage Determination (Technical 4-Stage Bearing Degradation Model)
  // Stage 1: Micro-surface subsurface fatigue, ultrasonic/gE active (no velocity peak)
  // Stage 2: Natural frequency resonance ringing (500Hz - 2kHz) with low defect peaks
  // Stage 3: Clear BPFO/BPFI/BSF fundamental + 2X, 3X harmonics + 1X modulation sidebands
  // Stage 4: Broadband random floor noise / grass, 1X dominates, loss of discrete harmonics (catastrophic spall)
  const sev = inputs.faultSeverityPercent;
  let stage: BearingFaultOutputs['stage'] = 'stage1_incipient';
  let stageDescription = 'Stage 1 (Incipient): Subsurface micro-fissuring. High frequency stress waves detectable only via HF Envelope / Ultrasonic peak.';
  if (inputs.faultLocation === 'none' || sev <= 5) {
    stage = 'stage1_incipient';
    stageDescription = 'Normal Nominal State: Clean raceway and rolling element surfaces. No active spalling.';
  } else if (sev <= 30) {
    stage = 'stage2_resonance';
    stageDescription = 'Stage 2 (Incipient Spall / Ringing): Defect excites bearing component natural frequencies. Minor fault peaks emerging.';
  } else if (sev <= 75) {
    stage = 'stage3_defect_harmonics';
    stageDescription = 'Stage 3 (Advanced Flaking / Harmonics): Distinct fault peaks + sidebands in velocity spectrum. High crest factor & kurtosis.';
  } else {
    stage = 'stage4_catastrophic';
    stageDescription = 'Stage 4 (Terminal Breakdown): Massive spalling and raceway peeling. Broadband friction grass, discrete peaks washed out, high 1X/2X looseness.';
  }

  // 4. Statistical Metrics (Crest Factor, Kurtosis, Shock Pulse)
  let baseKurtosis = 2.95; // Gaussian random noise floor ~ 3.0
  let crestFactor = 3.2;
  let impactPulseDb = 12 + Math.min(20, (inputs.radialLoadKn + inputs.axialLoadKn * 0.5) * 2);

  if (stage === 'stage1_incipient') {
    baseKurtosis = 3.2 + (sev / 10) * 0.5;
    crestFactor = 3.4;
    impactPulseDb += sev * 0.2;
  } else if (stage === 'stage2_resonance') {
    baseKurtosis = 4.5 + (sev - 5) * 0.15;
    crestFactor = 4.8 + (sev - 5) * 0.08;
    impactPulseDb += 10 + sev * 0.4;
  } else if (stage === 'stage3_defect_harmonics') {
    // Peak spikiness occurs in Stage 3 where distinct sharp impacts stand out from low background
    baseKurtosis = 8.0 + (sev - 30) * 0.25;
    crestFactor = 7.0 + (sev - 30) * 0.12;
    impactPulseDb += 25 + sev * 0.5;
  } else {
    // In Stage 4, continuous rubbing and churning of debris reduces the crest factor & kurtosis back down
    baseKurtosis = 4.2;
    crestFactor = 3.8;
    impactPulseDb += 55;
  }

  // 5. Vibration Spectral Peak Synthesis (g and mm/s)
  const spectralPeaks: BearingSpectralLine[] = [];
  const loadFactor = (inputs.radialLoadKn + inputs.axialLoadKn * 0.6) / 10.0;
  
  // 1X Running speed baseline peak
  const amp1X = 0.8 * (shaftRpm / 1800) * (stage === 'stage4_catastrophic' ? 3.5 : 1.0);
  spectralPeaks.push({
    freqHz: Number(frHz.toFixed(1)),
    order: 1.0,
    amplitudeG: Number((amp1X * 0.25).toFixed(2)),
    label: '1X Running Speed',
    type: '1x',
  });

  // 2X Harmonic peak
  const amp2X = amp1X * (stage === 'stage4_catastrophic' ? 0.7 : 0.25);
  spectralPeaks.push({
    freqHz: Number((frHz * 2).toFixed(1)),
    order: 2.0,
    amplitudeG: Number((amp2X * 0.25).toFixed(2)),
    label: '2X Harmonic',
    type: '2x',
  });

  let peakDefectFreqHz = 0;
  let peakDefectOrder = 0;
  let dominantHarmonicLabel = 'None';
  let sidebandModulationHz = 0;

  if (inputs.faultLocation !== 'none' && sev > 5) {
    let targetOrder = 0;
    let targetHz = 0;
    let baseLabel = '';

    if (inputs.faultLocation === 'outer_race') {
      targetOrder = rawFreqs.bpfoOrder;
      targetHz = rawFreqs.bpfoHz;
      baseLabel = 'BPFO';
      dominantHarmonicLabel = `BPFO (${targetHz} Hz)`;
      // Outer race stationary: NO rotating sidebands usually, only sharp harmonics
      sidebandModulationHz = 0;
    } else if (inputs.faultLocation === 'inner_race') {
      targetOrder = rawFreqs.bpfiOrder;
      targetHz = rawFreqs.bpfiHz;
      baseLabel = 'BPFI';
      dominantHarmonicLabel = `BPFI (${targetHz} Hz) ± 1X Sidebands`;
      // Inner race defect moves through the load zone once per shaft rotation -> 1X sidebands!
      sidebandModulationHz = frHz;
    } else if (inputs.faultLocation === 'ball_spin') {
      targetOrder = rawFreqs.bsfOrder;
      targetHz = rawFreqs.bsfHz;
      baseLabel = 'BSF (2x Spin)';
      dominantHarmonicLabel = `2X BSF (${(targetHz * 2).toFixed(1)} Hz) ± FTF Sidebands`;
      // Ball defect strikes both inner and outer raceway every revolution -> 2X BSF + FTF sidebands
      sidebandModulationHz = rawFreqs.ftfHz;
    } else if (inputs.faultLocation === 'cage') {
      targetOrder = rawFreqs.ftfOrder;
      targetHz = rawFreqs.ftfHz;
      baseLabel = 'FTF';
      dominantHarmonicLabel = `FTF Cage (${targetHz} Hz)`;
      sidebandModulationHz = rawFreqs.ftfHz;
    }

    peakDefectFreqHz = targetHz;
    peakDefectOrder = targetOrder;

    // Amplitude calculation based on defect size, load, and stage
    const defectImpactMultiplier = (inputs.defectSizeMicrons / 500) * (sev / 50) * loadFactor;
    const fundamentalG = Math.max(0.1, 0.45 * defectImpactMultiplier);

    // Fundamental fault frequency peak
    spectralPeaks.push({
      freqHz: Number(targetHz.toFixed(1)),
      order: Number(targetOrder.toFixed(2)),
      amplitudeG: Number(fundamentalG.toFixed(2)),
      label: `1x ${baseLabel}`,
      type: inputs.faultLocation === 'outer_race' ? 'bpfo' : inputs.faultLocation === 'inner_race' ? 'bpfi' : 'bsf',
    });

    // 2x and 3x Harmonics in Stage 2/3
    if (stage === 'stage2_resonance' || stage === 'stage3_defect_harmonics') {
      spectralPeaks.push({
        freqHz: Number((targetHz * 2).toFixed(1)),
        order: Number((targetOrder * 2).toFixed(2)),
        amplitudeG: Number((fundamentalG * 0.65).toFixed(2)),
        label: `2x ${baseLabel}`,
        type: 'sideband',
      });
      spectralPeaks.push({
        freqHz: Number((targetHz * 3).toFixed(1)),
        order: Number((targetOrder * 3).toFixed(2)),
        amplitudeG: Number((fundamentalG * 0.35).toFixed(2)),
        label: `3x ${baseLabel}`,
        type: 'sideband',
      });

      // Sideband generation for inner race / ball spin defects
      if (sidebandModulationHz > 0) {
        spectralPeaks.push({
          freqHz: Number((targetHz - sidebandModulationHz).toFixed(1)),
          order: Number((targetOrder - sidebandModulationHz / frHz).toFixed(2)),
          amplitudeG: Number((fundamentalG * 0.4).toFixed(2)),
          label: `${baseLabel} - 1X Sideband`,
          type: 'sideband',
        });
        spectralPeaks.push({
          freqHz: Number((targetHz + sidebandModulationHz).toFixed(1)),
          order: Number((targetOrder + sidebandModulationHz / frHz).toFixed(2)),
          amplitudeG: Number((fundamentalG * 0.42).toFixed(2)),
          label: `${baseLabel} + 1X Sideband`,
          type: 'sideband',
        });
      }
    }
  }

  // 6. Overall Velocity (mm/s RMS) and ISO 10816 Zone
  let overallVelocityRmsMmS = 1.2 * (shaftRpm / 1800);
  if (stage === 'stage2_resonance') overallVelocityRmsMmS += sev * 0.04;
  if (stage === 'stage3_defect_harmonics') overallVelocityRmsMmS += 1.8 + sev * 0.08;
  if (stage === 'stage4_catastrophic') overallVelocityRmsMmS += 6.5 + sev * 0.12;

  overallVelocityRmsMmS = Number(overallVelocityRmsMmS.toFixed(2));
  const overallPeakG = Number((overallVelocityRmsMmS * (crestFactor / 3.0) * 0.25).toFixed(2));
  const highFreqEnvelopeG = Number(
    (stage === 'stage1_incipient' ? 1.5 + (sev / 5) * 1.2 : stage === 'stage2_resonance' ? 6.5 + sev * 0.15 : stage === 'stage3_defect_harmonics' ? 12.0 + sev * 0.2 : 25.0).toFixed(1)
  );

  let iso10816Zone: 'A' | 'B' | 'C' | 'D' = 'A';
  if (overallVelocityRmsMmS < 2.3) iso10816Zone = 'A';
  else if (overallVelocityRmsMmS < 4.5) iso10816Zone = 'B';
  else if (overallVelocityRmsMmS < 7.1) iso10816Zone = 'C';
  else iso10816Zone = 'D';

  // 7. L10h Fatigue Life Degradation
  const basicDynamicLoadKn = 61.8; // Standard 6309 / heavy ball reference
  const equivalentP = Math.max(1.0, inputs.radialLoadKn + 0.55 * inputs.axialLoadKn);
  const baseL10MillionRev = Math.pow(basicDynamicLoadKn / equivalentP, 3);
  let l10hFatigueHoursRemaining = (baseL10MillionRev * 1e6) / (60 * shaftRpm);

  // Severe defect damage penalty
  if (stage === 'stage2_resonance') l10hFatigueHoursRemaining *= 0.45;
  else if (stage === 'stage3_defect_harmonics') l10hFatigueHoursRemaining *= 0.15;
  else if (stage === 'stage4_catastrophic') l10hFatigueHoursRemaining *= 0.02;

  // Kappa lubrication multiplier
  if (kappa < 0.4) l10hFatigueHoursRemaining *= 0.3;
  else if (kappa < 0.8) l10hFatigueHoursRemaining *= 0.7;

  l10hFatigueHoursRemaining = Math.max(24, Math.round(l10hFatigueHoursRemaining));

  // 8. Engineering Status Assessment
  let statusLevel: 'safe' | 'warning' | 'critical' = 'safe';
  let statusLabel = 'NOMINAL KINEMATICS';
  let statusMessage = 'Bearing rolling element and raceway contact surfaces are in sound structural condition.';
  const recommendations: string[] = [];

  if (stage === 'stage4_catastrophic' || iso10816Zone === 'D') {
    statusLevel = 'critical';
    statusLabel = 'TERMINAL FAULT - SHUTDOWN';
    statusMessage = `Stage 4 degradation active. Severe raceway spalling and thermal friction breakdown with broadband vibration velocity at ${overallVelocityRmsMmS} mm/s RMS (ISO Zone D).`;
    recommendations.push('Immediate planned machine isolation and bearing replacement to prevent shaft seizure or housing damage.');
    recommendations.push('Audit lube oil filter for metallic spall particulate flaking.');
  } else if (stage === 'stage3_defect_harmonics' || iso10816Zone === 'C') {
    statusLevel = 'warning';
    statusLabel = 'DEFECT HARMONICS DETECTED';
    statusMessage = `Defect harmonics identified at ${dominantHarmonicLabel} with Kurtosis ${baseKurtosis.toFixed(1)} (Alert > 4.5).`;
    recommendations.push(`Plan bearing exchange within next scheduled maintenance window (${Math.round(l10hFatigueHoursRemaining / 24)} days remaining).`);
    recommendations.push('Increase spectral logging interval and monitor 1X sideband amplitude rise.');
  } else if (kappa < 0.4) {
    statusLevel = 'warning';
    statusLabel = 'LUBRICATION BOUNDARY REGIME';
    statusMessage = `Viscosity ratio kappa (${kappa}) is below minimum 0.4. Severe metal-to-metal asperity contact occurs.`;
    recommendations.push('Upgrade lubricant ISO VG grade or decrease bearing operating temperature.');
  } else {
    recommendations.push('Baseline kinematic frequencies healthy per ISO 10816-3 Zone A/B.');
  }

  const status: StatusAssessment = {
    level: statusLevel,
    score: stage === 'stage4_catastrophic' ? 18 : stage === 'stage3_defect_harmonics' ? 52 : stage === 'stage2_resonance' ? 78 : 96,
    label: statusLabel,
    message: statusMessage,
    recommendations,
  };

  // 9. Rigorous Calculation Audit Trail
  const auditTrail: AuditStep[] = [
    {
      title: 'Ball Pass Frequency Outer Race (BPFO)',
      standardRef: 'Harris Rolling Bearing Analysis 5th Ed §12.3',
      formula: 'BPFO = \\frac{Z}{2} \\left(1 - \\frac{D_w}{d_m} \\cos\\alpha\\right) \\cdot f_r',
      substituted: `(${geom.numberOfBalls}/2) × (1 - (${geom.ballDiameterMm}/${geom.pitchDiameterMm}) × cos(${geom.contactAngleDeg}°)) × ${frHz.toFixed(1)} Hz`,
      result: `${frequencies.bpfoHz.toFixed(1)} Hz (${frequencies.bpfoOrder.toFixed(2)}X)`,
      unit: 'Hz',
      isCompliant: true,
      note: 'Outer raceway stationary, inner ring rotating.',
    },
    {
      title: 'Ball Pass Frequency Inner Race (BPFI)',
      standardRef: 'Harris Rolling Bearing Analysis 5th Ed §12.4',
      formula: 'BPFI = \\frac{Z}{2} \\left(1 + \\frac{D_w}{d_m} \\cos\\alpha\\right) \\cdot f_r',
      substituted: `(${geom.numberOfBalls}/2) × (1 + (${geom.ballDiameterMm}/${geom.pitchDiameterMm}) × cos(${geom.contactAngleDeg}°)) × ${frHz.toFixed(1)} Hz`,
      result: `${frequencies.bpfiHz.toFixed(1)} Hz (${frequencies.bpfiOrder.toFixed(2)}X)`,
      unit: 'Hz',
      isCompliant: true,
      note: 'Generates 1X rotating load zone sidebands.',
    },
    {
      title: 'Ball Spin Frequency (BSF)',
      standardRef: 'ISO 15243:2017 Machinery Diagnostics',
      formula: 'BSF = \\frac{d_m}{2 D_w} \\left[1 - \\left(\\frac{D_w}{d_m} \\cos\\alpha\\right)^2\\right] \\cdot f_r',
      substituted: `(${geom.pitchDiameterMm}/(2×${geom.ballDiameterMm})) × [1 - (${geom.ballDiameterMm}/${geom.pitchDiameterMm})²] × ${frHz.toFixed(1)} Hz`,
      result: `${frequencies.bsfHz.toFixed(1)} Hz (${frequencies.bsfOrder.toFixed(2)}X)`,
      unit: 'Hz',
      isCompliant: true,
      note: 'Fault impacts raceway twice per ball revolution (2x BSF).',
    },
    {
      title: 'ISO 281 Viscosity Ratio (Kappa κ)',
      standardRef: 'ISO 281:2007 Clause 8',
      formula: '\\kappa = \\frac{\\nu(T)}{\\nu_1(n, d_m)}',
      substituted: `${nuOperating.toFixed(1)} cSt / ${nu1.toFixed(1)} cSt`,
      result: `${kappa.toFixed(2)}x (Min: ≥ 1.0, Boundary: < 0.4)`,
      unit: 'ratio',
      isCompliant: kappa >= 0.8,
      note: kappa < 0.4 ? 'Critical boundary lubrication risk.' : 'Full elastohydrodynamic film.',
    },
    {
      title: 'Vibration Statistical Kurtosis (Spikiness)',
      standardRef: 'ISO 13373-1 Condition Monitoring',
      formula: 'Kurtosis = \\frac{1}{N} \\sum \\left[\\frac{x_i - \\mu}{\\sigma}\\right]^4',
      substituted: `Statistical 4th moment calculation (Base normal = 3.0)`,
      result: `${baseKurtosis.toFixed(1)} (Alert Threshold: > 4.5)`,
      unit: 'dimensionless',
      isCompliant: baseKurtosis <= 4.5,
      note: 'Spikes during Stage 2 & 3 localized spalling impacts.',
    },
  ];

  return {
    frequencies,
    peakDefectFreqHz,
    peakDefectOrder,
    dominantHarmonicLabel,
    stage,
    stageDescription,
    overallVelocityRmsMmS,
    overallPeakG,
    crestFactor: Number(crestFactor.toFixed(2)),
    kurtosis: Number(baseKurtosis.toFixed(2)),
    iso10816Zone,
    l10hFatigueHoursRemaining,
    lubricationKappaRatio: kappa,
    highFreqEnvelopeG,
    sidebandModulationHz: Number(sidebandModulationHz.toFixed(1)),
    spectralPeaks,
    impactPulseDecibels: Math.round(impactPulseDb),
    status,
    auditTrail,
  };
}
