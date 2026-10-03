export type VibrationUnit = 'mm/s_rms' | 'in/s_pk' | 'um_pkpk' | 'mil_pkpk' | 'g_rms';

export type MachineryClass = 
  | 'Class_I'   // Small machines up to 15 kW
  | 'Class_II'  // Medium machines 15-75 kW or rigid foundation up to 300 kW
  | 'Class_III' // Large machines > 300 kW on rigid foundation
  | 'Class_IV'; // Large machines > 300 kW on flexible foundation

export type ISOZone = 'A' | 'B' | 'C' | 'D';

export interface BearingGeometry {
  id: string;
  name: string;
  manufacturer: string;
  type: string;
  numberOfBalls: number;      // Z
  ballDiameterMm: number;     // Dw
  pitchDiameterMm: number;    // dm
  contactAngleDeg: number;    // alpha
}

export interface BearingFrequencies {
  bpfoOrder: number; // Ball Pass Frequency Outer
  bpfiOrder: number; // Ball Pass Frequency Inner
  bsfOrder: number;  // Ball Spin Frequency
  ftfOrder: number;  // Fundamental Train (Cage) Frequency
  bpfoHz: number;
  bpfiHz: number;
  bsfHz: number;
  ftfHz: number;
}

export interface SpectralPeak {
  freqHz: number;
  order: number;
  amplitude: number; // in current unit
  phaseDeg: number;
  label: string;
  isHarmonic?: boolean;
  isBearingDefect?: boolean;
  isSubharmonic?: boolean;
}

export interface OrbitPoint {
  x: number;          // microns or mils
  y: number;
  keyphasor: boolean; // True when keyphasor triggers
  xFiltered: number;
  yFiltered: number;
}

export interface OrbitDiagnostics {
  peakToPeakX: number;
  peakToPeakY: number;
  eccentricityRatio: number;
  orbitPrecession: 'Forward' | 'Reverse' | 'Mixed';
  patternShape: 'Circular' | 'Elliptical' | 'Figure-8 (Double Loop)' | 'Precession Loop' | 'Clipped / Truncated';
  summaryDescription: string;
}

export interface WaterfallSlice {
  rpm: number;
  spectrum: { order: number; freqHz: number; amp: number }[];
}

export interface SpectralDiagnosis {
  overallVelocityRms: number; // mm/s
  overallDisplacementPkPk: number; // um
  overallAccelerationG: number; // g
  dominantOrder: string;
  dominantFreqHz: number;
  isoZone: ISOZone;
  isoZoneLabel: string;
  primaryDefect: string;
  confidenceScore: number;
  confidencePercent: number;
  faultFindings: {
    title: string;
    description: string;
    severity: 'normal' | 'caution' | 'warning' | 'critical';
    standardRef: string;
  }[];
  maintenanceRecommendations: string[];
}

export interface SpectralPreset {
  id: string;
  title: string;
  machineType: string;
  description: string;
  shaftRpm: number;
  bearingId: string;
  unbalance1XAmp: number;
  misalignment2XAmp: number;
  misalignment3XAmp: number;
  cavitationNoiseAmp: number;
  vanePassVaneCount: number;
  vanePassAmp: number;
  bearingDefectType: 'none' | 'outer_race' | 'inner_race' | 'ball_spin' | 'cage';
  bearingDefectAmp: number;
  subharmonicType: 'none' | 'oil_whirl_0_45X' | 'looseness_0_5X';
  subharmonicAmp: number;
  rubSeverity: number; // 0 to 1
  radialClearanceUm: number;
}
