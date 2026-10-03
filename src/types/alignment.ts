import { StatusAssessment, AuditStep } from './common';

export type AlignmentMethod = 'reverse_dial' | 'rim_and_face' | 'dual_laser';
export type CasingMaterial = 'carbon_steel' | 'cast_iron' | 'stainless_316' | 'chrome_steel';
export type CouplingType = 'metallic_disc_pack' | 'elastomeric_jaw' | 'gear_coupling' | 'diaphragm';

export interface AlignmentInputs {
  // Machine Geometry
  motorRpm: number;
  couplingSpacerLengthMm: number; // DBSE (Distance Between Shaft Ends)
  couplingHubDiameterMm: number;
  distCouplingToMotorFrontFootMm: number; // Dimension B
  distMotorFrontToRearFootMm: number; // Dimension C
  distCouplingToPumpFrontFootMm: number;
  distPumpFrontToRearFootMm: number;
  motorCenterlineHeightMm: number; // Baseplate to shaft center
  pumpCenterlineHeightMm: number;

  // Thermal Properties
  ambientInstallationTempC: number;
  motorOperatingTempC: number;
  pumpFluidTempC: number;
  pumpCasingMaterial: CasingMaterial;
  thermalGrowthMode: 'auto_calculated' | 'manual_target';
  manualTargetVerticalOffsetMm: number;
  manualTargetAngularOffsetMrad: number;

  // Current Cold Measured Offsets
  measurementMethod: AlignmentMethod;
  measuredVerticalOffsetMm: number; // Parallel offset at coupling center
  measuredVerticalAngleMrad: number; // Angular misalignment
  measuredHorizontalOffsetMm: number;
  measuredHorizontalAngleMrad: number;
  indicatorBracketSagMm: number; // Deflection correction for dial indicators

  // Soft Foot Measurements (at 4 motor bolt pads)
  softFootFrontLeftMm: number;
  softFootFrontRightMm: number;
  softFootRearLeftMm: number;
  softFootRearRightMm: number;

  // Coupling Properties
  couplingType: CouplingType;
  angularStiffnessNmPerMrad: number; // Flexible element angular stiffness
  radialStiffnessNPerMm: number;
  maxAllowableContinuousAngleDeg: number;

  // Piping Cross-Coupling Interaction
  pipingInducedNozzleMomentKnm: number; // From connected piping stress
}

export interface AlignmentOutputs {
  // Thermal Growth Calculations
  motorThermalGrowthMm: number;
  pumpThermalGrowthMm: number;
  netThermalOffsetMm: number;
  coldTargetVerticalOffsetMm: number;
  coldTargetVerticalAngleMrad: number;

  // Hot Running Projected Offsets
  hotRunningVerticalOffsetMm: number;
  hotRunningVerticalAngleMrad: number;
  hotRunningHorizontalOffsetMm: number;
  hotRunningHorizontalAngleMrad: number;
  hotResultantOffsetMm: number;
  hotResultantAngleMrad: number;

  // Machine Shim & Horizontal Adjustments (Motor Feet)
  frontFootShimAdjustmentMm: number;
  rearFootShimAdjustmentMm: number;
  frontFootHorizontalMoveMm: number;
  rearFootHorizontalMoveMm: number;

  // API 686 Standard Limits & Criteria
  allowableParallelOffsetMm: number;
  allowableAngularOffsetMrad: number;
  api686ColdTargetCompliant: boolean;
  api686HotRunningCompliant: boolean;
  toleranceUtilizationPercent: number;
  alignmentClassification: 'excellent' | 'acceptable' | 'marginal' | 'unacceptable';

  // Dynamic Coupling Reactions & Bearing Loading
  transmittedBendingMomentNm: number;
  transmittedRadialShearN: number;
  motorBearingAdditionalRadialLoadN: number;
  pumpBearingAdditionalRadialLoadN: number;
  couplingDiscStressMPa: number;
  couplingFatigueSafetyFactor: number;

  // ISO 10816-3 Vibration Prediction
  vibration1XRmsMmS: number;
  vibration2XRmsMmS: number; // Classic 2X unbalance/misalignment harmonic
  vibrationAxialRmsMmS: number;
  totalVibrationRmsMmS: number;
  iso10816Zone: 'A' | 'B' | 'C' | 'D';

  // Soft Foot Analysis
  maxSoftFootMm: number;
  softFootCompliant: boolean;
  softFootSeverity: 'normal' | 'moderate' | 'excessive';

  // Overall Skid Assessment & Audit Trail
  status: StatusAssessment;
  auditTrail: AuditStep[];
}
