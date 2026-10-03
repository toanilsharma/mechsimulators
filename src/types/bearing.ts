import { StatusAssessment, AuditStep } from './common';

export type BearingFaultLocation = 'none' | 'outer_race' | 'inner_race' | 'ball_spin' | 'cage';
export type BearingStage = 'stage1_incipient' | 'stage2_resonance' | 'stage3_defect_harmonics' | 'stage4_catastrophic';
export type LubricationCondition = 'optimal' | 'marginal' | 'starved' | 'contaminated';

export interface BearingFaultInputs {
  bearingId: string;
  shaftSpeedRpm: number;
  radialLoadKn: number;
  axialLoadKn: number;
  bearingTempC: number;
  oilViscosityCSt: number; // Kinematic viscosity at 40°C
  faultLocation: BearingFaultLocation;
  faultSeverityPercent: number; // 0% to 100% defect depth / spall width
  defectSizeMicrons: number; // 10 um to 3000 um
  sensorType: 'accelerometer' | 'velocity_sensor' | 'high_freq_envelope';
  noiseLevelPercent: number;
}

export interface BearingFaultFrequencies {
  bpfoHz: number;
  bpfiHz: number;
  bsfHz: number;
  ftfHz: number;
  bpfoOrder: number;
  bpfiOrder: number;
  bsfOrder: number;
  ftfOrder: number;
  runningSpeedHz: number;
}

export interface BearingSpectralLine {
  freqHz: number;
  order: number;
  amplitudeG: number;
  label: string;
  type: '1x' | '2x' | 'bpfo' | 'bpfi' | 'bsf' | 'ftf' | 'sideband' | 'hfem_floor';
}

export interface BearingFaultOutputs {
  frequencies: BearingFaultFrequencies;
  peakDefectFreqHz: number;
  peakDefectOrder: number;
  dominantHarmonicLabel: string;
  stage: BearingStage;
  stageDescription: string;
  overallVelocityRmsMmS: number;
  overallPeakG: number;
  crestFactor: number; // Peak / RMS ratio (surges in Stage 2/3, drops in Stage 4)
  kurtosis: number; // Statistical spikiness (normal ~3.0, damaged >6.0 to 20+)
  iso10816Zone: 'A' | 'B' | 'C' | 'D';
  l10hFatigueHoursRemaining: number;
  lubricationKappaRatio: number; // Viscosity ratio kappa = nu / nu1 per ISO 281
  highFreqEnvelopeG: number; // Demodulated gE / HFE energy
  sidebandModulationHz: number; // 1X sideband spacing for inner race / cage
  spectralPeaks: BearingSpectralLine[];
  impactPulseDecibels: number; // Shock Pulse Method (dBm / dBc)
  status: StatusAssessment;
  auditTrail: AuditStep[];
}
