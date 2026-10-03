import { StatusAssessment, AuditStep } from './common';

export type BalanceGrade = 'G0.4' | 'G1.0' | 'G2.5' | 'G6.3' | 'G16' | 'G40' | 'custom';

export type MachineClassISO10816 =
  | 'class_1_small' // <15 kW
  | 'class_2_medium' // 15-75 kW or 75-300 kW rigid
  | 'class_3_large_rigid' // >300 kW rigid foundation
  | 'class_4_large_flexible'; // >300 kW flexible foundation

export type MachineType = 'pump' | 'fan' | 'compressor' | 'motor';

export type BearingType = 'ball' | 'roller';

export type LubricationCondition = 'good' | 'normal' | 'poor';

export type ContaminationLevel = 'clean' | 'normal' | 'contaminated';

export type ReliabilityTarget = 0.90 | 0.95 | 0.98 | 0.99;

export type BearingPosition = 'between_bearings' | 'overhung';

export interface BearingSpec {
  id: string;
  model: string;
  type: 'deep_groove' | 'angular_contact' | 'spherical_roller' | 'cylindrical_roller';
  bearingCategory: BearingType;
  boreMm: number;
  outerDiameterMm: number;
  widthMm: number;
  dynamicCapacityCrN: number; // C (N)
  staticCapacityC0rN: number; // C0 (N)
  limitingSpeedRpm: number;
  exponentP: number; // 3 for ball bearings, 10/3 (~3.333) for roller bearings
  dmMm: number; // Pitch diameter (d + D)/2
}

export type ScenarioId =
  | 'balanced_rotor'
  | 'mild_unbalance'
  | 'heavy_unbalance'
  | 'blade_loss_event'
  | 'near_critical_speed'
  | 'lubrication_loss'
  | 'bearing_overload'
  | 'high_temp_degradation'
  | 'validation_benchmark';

export interface RotorInputs {
  // Scenario Preset
  scenarioId?: ScenarioId;
  scenarioName?: string;

  // Basic inputs
  rotorMassKg: number;
  operatingRpm: number;
  unbalanceMassGrams: number;
  unbalanceRadiusMm: number;
  balanceGrade: BalanceGrade;
  customGradeValue?: number; // Used when balanceGrade === 'custom'
  bearingType: BearingType;
  bearingCategorySelect?: 'ball' | 'roller' | 'high_capacity' | 'custom';
  bearingModelId: string;
  basicDynamicLoadC_kN: number; // C in kN
  useDirectLoadP: boolean;
  equivalentLoadP_kN: number; // P in kN (when direct)
  staticRadialLoadN: number; // Static load (when calculated)
  axialLoadN: number;
  lubricationCondition: LubricationCondition;
  contaminationLevel: ContaminationLevel;
  reliabilityTarget: ReliabilityTarget;

  // Advanced inputs
  machineType: MachineType;
  machineClass: MachineClassISO10816;
  rotorStiffnessKNmm: number; // k in kN/mm (e.g. 20 - 100 kN/mm)
  dampingRatio: number; // zeta, typically 0.03 - 0.10
  dampingCoefficientNsM?: number; // c in N·s/m (optional direct)
  bearingPosition: BearingPosition;
  bearingSpanMm: number;
  overhungLengthMm: number;
  loadDistributionFactor: number; // fraction on critical bearing (e.g. 0.5 to 0.85)
  balancingMode?: 'single_plane' | 'two_plane';
  plane2UnbalanceMassGrams?: number;
  plane2UnbalanceRadiusMm?: number;
  plane2PhaseAngleDeg?: number;
  overrideActualUnbalance?: boolean;
  manualUnbalanceGmm?: number;
  lubeViscosity40CcSt?: number;
  bearingOperatingTempC?: number;
  customVibrationLimitMmS?: number;
}

export interface RotorOutputs {
  // Kinematics & Unbalance
  angularVelocityRadS: number;
  actualUnbalanceGmm: number;
  actualUnbalanceGcm: number;
  actualUnbalanceKgM: number;
  actualUnbalanceOzIn: number;
  iso1940PermissibleUnbalanceGmm: number;
  iso1940PermissibleEperMicrons: number;
  actualEccentricityMicrons: number;
  unbalanceRatio: number; // actual / permissible
  isBalanceCompliant: boolean;

  // Dynamic Forces
  dynamicUnbalanceForceN: number;
  dynamicUnbalanceForceLbf: number;
  forceToRotorWeightRatio: number;

  // Bearing Reactions (OH2 Overhung vs BB2 Between-Bearings)
  inboardBearingDynamicForceN: number;
  outboardBearingDynamicForceN: number;
  inboardBearingStaticLoadN: number;
  outboardBearingStaticLoadN: number;
  overhungMomentNm: number;

  // Two-Plane Balancing Decomposition
  staticUnbalanceGmm: number;
  coupleUnbalanceGmmMm: number;

  // Rotor Dynamics & SDOF Vibration Response
  criticalSpeedRpm: number;
  criticalAngularSpeedRadS: number;
  speedRatioLambda: number; // operatingRpm / criticalSpeedRpm
  isNearCriticalSpeed: boolean; // 0.85 <= lambda <= 1.15
  criticalSpeedZone: 'subcritical' | 'resonance' | 'supercritical';
  stiffnessNm: number;
  dampingC: number;
  vibrationDisplacementPeakM: number;
  vibrationDisplacementPkPkMicrons: number;
  vibrationDisplacementPkPkMils: number;
  vibrationVelocityPkMmS: number;
  vibrationVelocityRmsMmS: number;
  vibrationVelocityRmsInS: number;
  
  // ISO 10816 / ISO 20816 Vibration Severity
  iso10816Zone: 'A' | 'B' | 'C' | 'D';
  iso10816ZoneDescription: string;
  iso10816Limits: {
    zoneALimit: number;
    zoneBLimit: number;
    zoneCLimit: number;
  };

  // Bearing Life (ISO 281)
  bearingExponentP: number;
  bearingDynamicCapacityCrN: number;
  equivalentDynamicLoadP_N: number;
  loadRatioCP: number; // C / P
  basicLifeL10MillionRevs: number;
  basicLifeL10hHours: number;
  reliabilityFactorA1: number;
  lubricationFactorAlube: number;
  contaminationFactorAcontam: number;
  combinedLifeFactorAmod: number;
  modifiedLifeL10mhHours: number;
  operatingYears24x7: number;
  bearingLifeStatus: 'safe' | 'warning' | 'critical';

  // Overall Health & Audit
  status: StatusAssessment;
  specificWarnings: string[];
  recommendedActions: string[];
  auditTrail: AuditStep[];
}
