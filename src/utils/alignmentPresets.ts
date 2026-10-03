import { AlignmentInputs } from '../types/alignment';
import { ValidationPreset } from '../types/common';

export const BASELINE_ALIGNMENT_INPUTS: AlignmentInputs = {
  motorRpm: 2950,
  couplingSpacerLengthMm: 140,
  couplingHubDiameterMm: 160,
  distCouplingToMotorFrontFootMm: 220,
  distMotorFrontToRearFootMm: 380,
  distCouplingToPumpFrontFootMm: 200,
  distPumpFrontToRearFootMm: 320,
  motorCenterlineHeightMm: 280,
  pumpCenterlineHeightMm: 280,

  ambientInstallationTempC: 20,
  motorOperatingTempC: 65,
  pumpFluidTempC: 85,
  pumpCasingMaterial: 'carbon_steel',
  thermalGrowthMode: 'auto_calculated',
  manualTargetVerticalOffsetMm: 0,
  manualTargetAngularOffsetMrad: 0,

  measurementMethod: 'dual_laser',
  measuredVerticalOffsetMm: -0.11, // Cold target intentionally lower
  measuredVerticalAngleMrad: -0.15,
  measuredHorizontalOffsetMm: 0.02,
  measuredHorizontalAngleMrad: 0.04,
  indicatorBracketSagMm: 0.03,

  softFootFrontLeftMm: 0.02,
  softFootFrontRightMm: 0.03,
  softFootRearLeftMm: 0.02,
  softFootRearRightMm: 0.03,

  couplingType: 'metallic_disc_pack',
  angularStiffnessNmPerMrad: 450,
  radialStiffnessNPerMm: 1800,
  maxAllowableContinuousAngleDeg: 0.5,

  pipingInducedNozzleMomentKnm: 0.2,
};

export const ALIGNMENT_PRESETS: ValidationPreset<AlignmentInputs>[] = [
  {
    id: 'api686-baseline',
    name: 'API 686 Standard Motor-Pump (Cold Target Set)',
    description: 'Precision alignment with intentional cold thermal offset. Arrives at coaxial running alignment.',
    industry: 'Petrochemical Refining / API 610 Process Pump',
    source: 'API 686 2nd Ed Chapter 7 Section 7.3 Benchmark Example',
    inputs: {
      ...BASELINE_ALIGNMENT_INPUTS,
      measuredVerticalOffsetMm: -0.11,
      measuredVerticalAngleMrad: -0.15,
      measuredHorizontalOffsetMm: 0.02,
      measuredHorizontalAngleMrad: 0.04,
    },
    expectedOutputs: [
      { key: 'hotResultantOffsetMm', label: 'Hot Resultant Offset', expected: '< 0.05', unit: 'mm' },
      { key: 'api686HotRunningCompliant', label: 'Thermal Offset Within Limit', expected: 'true', unit: '' },
      { key: 'iso10816Zone', label: 'ISO Vibration Zone', expected: 'Zone A/B', unit: '' },
    ],
  },
  {
    id: 'thermal-mismatch-hot-pump',
    name: 'Hot Process Fluid Thermal Lift (Zero Cold Target)',
    description: '160°C fluid creates +0.38 mm pump thermal rise. Neglected cold target causes severe hot misalignment.',
    industry: 'Power Generation / Boiler Feedwater',
    source: 'EPRI Rotating Machinery Failure Case Study RP-4412',
    inputs: {
      ...BASELINE_ALIGNMENT_INPUTS,
      pumpFluidTempC: 165,
      motorOperatingTempC: 60,
      measuredVerticalOffsetMm: 0.02, // Set near 0 cold, disastrous hot!
      measuredVerticalAngleMrad: 0.02,
      measuredHorizontalOffsetMm: 0.03,
      measuredHorizontalAngleMrad: 0.05,
    },
    expectedOutputs: [
      { key: 'hotResultantOffsetMm', label: 'Hot Resultant Offset', expected: '> 0.25', unit: 'mm' },
      { key: 'iso10816Zone', label: 'ISO Vibration Zone', expected: 'Zone D', unit: '' },
      { key: 'toleranceUtilizationPercent', label: 'API 686 Utilization', expected: '> 400%', unit: '%' },
    ],
  },
  {
    id: 'severe-angular-cocking',
    name: 'Severe Angular Cocking & 2X Harmonics',
    description: '1.5 mrad angular cocking produces extreme cyclic disc pack flexure and 2X RPM vibration.',
    industry: 'Heavy Chemical / Continuous Process',
    source: 'ISO 20816-3 Misalignment Diagnostic Case 104',
    inputs: {
      ...BASELINE_ALIGNMENT_INPUTS,
      measuredVerticalAngleMrad: 1.45,
      measuredHorizontalAngleMrad: 0.85,
      measuredVerticalOffsetMm: 0.04,
      measuredHorizontalOffsetMm: 0.03,
    },
    expectedOutputs: [
      { key: 'vibration2XRmsMmS', label: '2X Vibration Harmonic', expected: '> 8.0', unit: 'mm/s' },
      { key: 'couplingDiscStressMPa', label: 'Disc Pack Stress', expected: '> 350', unit: 'MPa' },
      { key: 'couplingFatigueSafetyFactor', label: 'Fatigue Safety Factor', expected: '< 1.0', unit: '' },
    ],
  },
  {
    id: 'excessive-soft-foot',
    name: 'Excessive Diagonal Soft Foot (0.22 mm)',
    description: 'Twisted baseplate with 0.22 mm soft foot on rear-right anchor foot violating API 686 0.05 mm limit.',
    industry: 'Offshore Platform / Compact Skid',
    source: 'API 686 Chapter 7 Section 7.2 Soft Foot Protocol',
    inputs: {
      ...BASELINE_ALIGNMENT_INPUTS,
      softFootFrontLeftMm: 0.02,
      softFootFrontRightMm: 0.04,
      softFootRearLeftMm: 0.03,
      softFootRearRightMm: 0.22,
    },
    expectedOutputs: [
      { key: 'maxSoftFootMm', label: 'Max Soft Foot', expected: '0.22', unit: 'mm' },
      { key: 'softFootCompliant', label: 'Soft Foot Tolerable', expected: 'false', unit: '' },
    ],
  },
  {
    id: 'piping-strain-distortion',
    name: 'Piping Nozzle Load Cross-Coupling Strain',
    description: 'High thermal expansion from connected piping imposes 3.8 kN·m moment on pump casing.',
    industry: 'Refining Hydrotreater / High Temperature Feed',
    source: 'ASME B31.3 / API 686 §7.5 Piping Alignment Protocol',
    inputs: {
      ...BASELINE_ALIGNMENT_INPUTS,
      pipingInducedNozzleMomentKnm: 3.8,
      measuredVerticalOffsetMm: -0.11,
      measuredVerticalAngleMrad: -0.15,
    },
    expectedOutputs: [
      { key: 'hotResultantOffsetMm', label: 'Hot Offset with Piping Strain', expected: '> 0.12', unit: 'mm' },
      { key: 'api686HotRunningCompliant', label: 'Thermal Offset Within Limit', expected: 'false', unit: '' },
    ],
  },
];
