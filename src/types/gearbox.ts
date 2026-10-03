import { StatusAssessment, AuditItem } from './common';

export type GearType = 'spur' | 'helical' | 'double_helical' | 'planetary';
export type GearMaterialGrade = 'through_hardened_steel' | 'carburized_case_hardened' | 'nitrided_steel' | 'cast_iron';
export type GearLubricantType = 'iso_vg_150' | 'iso_vg_220' | 'iso_vg_320' | 'iso_vg_460' | 'synthetic_pao_220';
export type ToothFaultType = 'none' | 'pitch_line_pitting' | 'root_bending_fatigue_crack' | 'broken_tooth' | 'scuffing_scoring' | 'excessive_backlash';

export interface GearboxInputs {
  // Machinery & Duty
  gearType: GearType;
  ratedPowerKw: number;
  inputSpeedRpm: number;
  pinionTeeth: number;
  gearTeeth: number;

  // Geometry
  normalModuleMm: number; // Module mn (mm)
  faceWidthMm: number; // Facewidth b (mm)
  pressureAngleDeg: number; // Normal pressure angle (usually 20 deg)
  helixAngleDeg: number; // Helix angle beta (0 for spur, 10-30 for helical)
  backlashMm: number; // Backlash between teeth (mm)

  // Material & Quality
  materialGrade: GearMaterialGrade;
  isoQualityGrade: number; // ISO 1328 / AGMA grade (e.g. 5 = precision aerospace, 7 = commercial API, 10 = rough)
  pinionHardnessHrc: number; // Hardness Rockwell C (e.g. 58-62 for case carburized)
  gearHardnessHrc: number;

  // Lubrication
  lubricant: GearLubricantType;
  oilOperatingTempC: number;
  surfaceRoughnessRaUm: number; // Composite arithmetic surface roughness (µm)

  // Fault Injections
  toothFault: ToothFaultType;
  pinionEccentricityUm: number; // Shaft runout creating 1X sideband modulation
  applicationServiceFactor: number; // AGMA Ko overload factor (1.0 - 2.0)
}

export interface GmfHarmonicPoint {
  order: number; // 1X, 2X, 3X GMF
  frequencyHz: number;
  label: string;
  amplitudeMmS: number;
  sidebandAmpMmS: number;
  isHigh: boolean;
}

export interface StressCurvePoint {
  powerPercent: number; // 20% to 150%
  torqueNm: number;
  bendingStressMpa: number;
  contactStressMpa: number;
  bendingSafetyFactor: number;
  contactSafetyFactor: number;
}

export interface GearboxOutputs {
  status: StatusAssessment;
  auditTrail: AuditItem[];

  // Kinematic Frequencies
  outputSpeedRpm: number;
  gearRatio: number;
  pinionSpeedHz: number;
  gearSpeedHz: number;
  gearMeshFrequencyHz: number; // GMF = N_p * Z_p
  huntingToothFrequencyHz: number; // f_HT
  commonFactorsGcd: number;

  // Geometry Derived
  pinionPitchDiameterMm: number;
  gearPitchDiameterMm: number;
  centerDistanceMm: number;
  pitchLineVelocityMs: number;
  transverseContactRatio: number; // epsilon_alpha
  overlapContactRatio: number; // epsilon_beta (for helical)
  totalContactRatio: number; // epsilon_gamma

  // Loading & Forces
  inputTorqueNm: number;
  outputTorqueNm: number;
  tangentialForceKn: number; // W_t
  radialForceKn: number; // W_r
  axialThrustForceKn: number; // W_a (0 for spur)
  normalForceKn: number; // W_n

  // AGMA 2001 / ISO 6336 Stress Analysis
  bendingStressMpa: number; // sigma_b
  allowableBendingStressMpa: number; // sigma_FP / SF
  bendingSafetyFactorSF: number; // S_F >= 1.4 target

  contactStressMpa: number; // sigma_c (Hertz contact)
  allowableContactStressMpa: number; // sigma_HP / SH
  contactSafetyFactorSH: number; // S_H >= 1.25 target

  // Tribology & EHL Lubrication (AGMA 9005)
  operatingViscosityCSt: number;
  ehlFilmThicknessUm: number; // h_min
  specificFilmThicknessLambda: number; // Lambda = h_min / composite roughness
  lubricationRegime: 'Boundary' | 'Mixed / Thin Film' | 'Full Elastohydrodynamic (EHL)';

  // Vibration & Fault Spectrum
  gmfHarmonics: GmfHarmonicPoint[];
  overallVibrationMmSRms: number;
  iso10816Zone: 'A' | 'B' | 'C' | 'D';
  iso10816ZoneLabel: string;
  sidebandSeverityPercent: number; // Modulation depth %

  // Stress curves for plots
  stressCurves: StressCurvePoint[];

  // Diagnoses
  primaryDiagnosis: string;
  recommendations: string[];
}
