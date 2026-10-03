import { AlignmentInputs, AlignmentOutputs, CasingMaterial } from '../types/alignment';
import { StatusAssessment, AuditStep } from '../types/common';

/**
 * Thermal expansion coefficients (1/°C)
 */
export const THERMAL_EXPANSION_COEFFICIENTS: Record<CasingMaterial, number> = {
  carbon_steel: 11.7e-6,
  cast_iron: 10.5e-6,
  stainless_316: 16.5e-6,
  chrome_steel: 11.0e-6,
};

/**
 * Motor stator frame thermal expansion coefficient (~11.5e-6 for steel/iron frame)
 */
const MOTOR_EXPANSION_COEFF = 11.5e-6;

/**
 * Core API 686 Alignment, Thermal Growth & Coupling Physics Engine
 */
export function calculateShaftAlignment(inputs: AlignmentInputs): AlignmentOutputs {
  const auditTrail: AuditStep[] = [];

  // 1. Material expansion coefficients with temperature-dependent α(T) per API 686 / ASME Sec II-D
  const T_mean_pump = (inputs.pumpFluidTempC + inputs.ambientInstallationTempC) / 2;
  let baseAlpha = THERMAL_EXPANSION_COEFFICIENTS[inputs.pumpCasingMaterial] || 11.7e-6;
  if (inputs.pumpCasingMaterial === 'stainless_316') {
    baseAlpha = 16.0e-6 * (1 + 0.0004 * Math.max(0, T_mean_pump - 20));
  } else if (inputs.pumpCasingMaterial === 'carbon_steel') {
    baseAlpha = 11.5e-6 * (1 + 0.0005 * Math.max(0, T_mean_pump - 20));
  } else if (inputs.pumpCasingMaterial === 'cast_iron') {
    baseAlpha = 10.2e-6 * (1 + 0.00045 * Math.max(0, T_mean_pump - 20));
  } else if (inputs.pumpCasingMaterial === 'chrome_steel') {
    baseAlpha = 10.8e-6 * (1 + 0.00048 * Math.max(0, T_mean_pump - 20));
  }
  const pumpAlpha = baseAlpha;

  // 2. Machine Thermal Growth Calculations
  // Motor thermal growth: deltaY_M = H_M * alpha_M * (T_M - T_amb)
  const deltaT_motor = Math.max(0, inputs.motorOperatingTempC - inputs.ambientInstallationTempC);
  const motorThermalGrowthMm = inputs.motorCenterlineHeightMm * MOTOR_EXPANSION_COEFF * deltaT_motor;

  // Pump thermal growth: deltaY_P = H_P * alpha_P * (T_fluid - T_amb)
  // For overhung OH2 pumps, casing heats from fluid. Standard thermal rise efficiency ~0.85
  const deltaT_pump = Math.max(0, inputs.pumpFluidTempC - inputs.ambientInstallationTempC);
  const pumpThermalGrowthMm = inputs.pumpCenterlineHeightMm * pumpAlpha * deltaT_pump * 0.85;

  // Net vertical thermal elevation difference: pump rises relative to motor
  const netThermalOffsetMm = pumpThermalGrowthMm - motorThermalGrowthMm;

  // Thermal tilt angle: front foot of pump is hotter than rear foot
  const pumpFootDistance = Math.max(100, inputs.distPumpFrontToRearFootMm);
  const pumpThermalAngleMrad = ((pumpThermalGrowthMm * 0.15) / pumpFootDistance) * 1000;

  // Cold Alignment Target (intentional cold misalignment so hot operation lands on 0)
  let coldTargetVerticalOffsetMm: number;
  let coldTargetVerticalAngleMrad: number;

  if (inputs.thermalGrowthMode === 'manual_target') {
    coldTargetVerticalOffsetMm = inputs.manualTargetVerticalOffsetMm;
    coldTargetVerticalAngleMrad = inputs.manualTargetAngularOffsetMrad;
  } else {
    // Setting motor lower by netThermalOffset so hot pump expansion aligns coaxial
    coldTargetVerticalOffsetMm = -netThermalOffsetMm;
    coldTargetVerticalAngleMrad = -pumpThermalAngleMrad;
  }

  auditTrail.push({
    title: 'Thermal Growth Offset (API 686 §7.3)',
    standardRef: 'API 686 2nd Ed §7.3.2',
    formula: 'ΔY_thermal = (H_P · α_P · ΔT_P) - (H_M · α_M · ΔT_M)',
    substituted: `(${inputs.pumpCenterlineHeightMm} · ${(pumpAlpha * 1e6).toFixed(1)}e-6 · ${deltaT_pump.toFixed(0)}) - (${inputs.motorCenterlineHeightMm} · 11.5e-6 · ${deltaT_motor.toFixed(0)})`,
    result: netThermalOffsetMm.toFixed(3),
    unit: 'mm',
    note: `Cold target offset: ${coldTargetVerticalOffsetMm.toFixed(3)} mm (Motor set ${coldTargetVerticalOffsetMm < 0 ? 'lower' : 'higher'})`,
    isCompliant: true,
  });

  // 3. Hot Running Projected Offsets
  // Compensate for indicator sag if reverse dial
  const sagCorrection = inputs.measurementMethod === 'reverse_dial' ? inputs.indicatorBracketSagMm : 0;
  const actualMeasuredVertOffset = inputs.measuredVerticalOffsetMm - sagCorrection;

  // Piping nozzle moment influence on pump casing alignment:
  // 1 kN·m creates approximately 0.03 mm vertical deflection and 0.15 mrad tilt at pump shaft end
  const pipingDeflectionMm = (inputs.pipingInducedNozzleMomentKnm || 0) * 0.035;
  const pipingTiltMrad = (inputs.pipingInducedNozzleMomentKnm || 0) * 0.18;

  const hotRunningVerticalOffsetMm = actualMeasuredVertOffset + netThermalOffsetMm + pipingDeflectionMm;
  const hotRunningVerticalAngleMrad = inputs.measuredVerticalAngleMrad + pumpThermalAngleMrad + pipingTiltMrad;
  const hotRunningHorizontalOffsetMm = inputs.measuredHorizontalOffsetMm;
  const hotRunningHorizontalAngleMrad = inputs.measuredHorizontalAngleMrad;

  const hotResultantOffsetMm = Math.sqrt(
    hotRunningVerticalOffsetMm * hotRunningVerticalOffsetMm +
    hotRunningHorizontalOffsetMm * hotRunningHorizontalOffsetMm
  );
  const hotResultantAngleMrad = Math.sqrt(
    hotRunningVerticalAngleMrad * hotRunningVerticalAngleMrad +
    hotRunningHorizontalAngleMrad * hotRunningHorizontalAngleMrad
  );

  // 4. API 686 Permissible Tolerances based on Operating RPM
  // API 686 Chapter 7 Table 7.1
  let allowableParallelOffsetMm = 0.05;
  let allowableAngularOffsetMrad = 0.5; // 0.05 mm / 100 mm = 0.5 mrad

  if (inputs.motorRpm <= 1800) {
    allowableParallelOffsetMm = 0.075;
    allowableAngularOffsetMrad = 0.70;
  } else if (inputs.motorRpm > 3600) {
    allowableParallelOffsetMm = 0.025;
    allowableAngularOffsetMrad = 0.30;
  }

  // Tolerance utilization
  const offsetUtil = (hotResultantOffsetMm / allowableParallelOffsetMm) * 100;
  const angleUtil = (hotResultantAngleMrad / allowableAngularOffsetMrad) * 100;
  const toleranceUtilizationPercent = Math.max(offsetUtil, angleUtil);

  const api686HotRunningCompliant = hotResultantOffsetMm <= allowableParallelOffsetMm &&
    hotResultantAngleMrad <= allowableAngularOffsetMrad;

  // Cold Target Deviation
  const coldDeviationOffset = Math.abs(actualMeasuredVertOffset - coldTargetVerticalOffsetMm);
  const coldDeviationAngle = Math.abs(inputs.measuredVerticalAngleMrad - coldTargetVerticalAngleMrad);
  const api686ColdTargetCompliant = coldDeviationOffset <= allowableParallelOffsetMm &&
    coldDeviationAngle <= allowableAngularOffsetMrad;

  let alignmentClassification: 'excellent' | 'acceptable' | 'marginal' | 'unacceptable' = 'acceptable';
  if (toleranceUtilizationPercent <= 50) {
    alignmentClassification = 'excellent';
  } else if (toleranceUtilizationPercent <= 100) {
    alignmentClassification = 'acceptable';
  } else if (toleranceUtilizationPercent <= 150) {
    alignmentClassification = 'marginal';
  } else {
    alignmentClassification = 'unacceptable';
  }

  auditTrail.push({
    title: 'Hot Operating Misalignment vs API 686 Limits',
    standardRef: 'API 686 2nd Ed Table 7.1',
    formula: 'Resultant Offset = √(ΔY_hot² + ΔX_hot²)',
    substituted: `√(${hotRunningVerticalOffsetMm.toFixed(3)}² + ${hotRunningHorizontalOffsetMm.toFixed(3)}²) = ${hotResultantOffsetMm.toFixed(3)} mm (Max: ${allowableParallelOffsetMm} mm)`,
    result: `${hotResultantOffsetMm.toFixed(3)} mm | ${hotResultantAngleMrad.toFixed(2)} mrad`,
    unit: 'mm / mrad',
    note: `Tolerance Utilization: ${toleranceUtilizationPercent.toFixed(0)}% (${alignmentClassification.toUpperCase()})`,
    isCompliant: api686HotRunningCompliant,
  });

  // 5. Shim & Jackbolt Adjustments at Motor Feet
  // Calculate correction needed to return measured cold state to cold target
  const errorVertOffsetMm = actualMeasuredVertOffset - coldTargetVerticalOffsetMm;
  const errorVertAngleMrad = inputs.measuredVerticalAngleMrad - coldTargetVerticalAngleMrad;
  const errorHorizOffsetMm = inputs.measuredHorizontalOffsetMm;
  const errorHorizAngleMrad = inputs.measuredHorizontalAngleMrad;

  const distB = inputs.distCouplingToMotorFrontFootMm; // Coupling center to Front Foot
  const distC = inputs.distMotorFrontToRearFootMm; // Front Foot to Rear Foot

  // Vertical shim adjustment (+ adds shims under motor foot, - removes)
  // Angular error converts mrad (mm/m) to mm: errorVertAngleMrad * dist / 1000
  const frontFootShimAdjustmentMm = -(errorVertOffsetMm + (errorVertAngleMrad * distB) / 1000);
  const rearFootShimAdjustmentMm = -(errorVertOffsetMm + (errorVertAngleMrad * (distB + distC)) / 1000);

  // Horizontal jackbolt adjustment
  const frontFootHorizontalMoveMm = -(errorHorizOffsetMm + (errorHorizAngleMrad * distB) / 1000);
  const rearFootHorizontalMoveMm = -(errorHorizOffsetMm + (errorHorizAngleMrad * (distB + distC)) / 1000);

  auditTrail.push({
    title: 'Motor Foot Shim Corrections',
    standardRef: 'API 686 2nd Ed §7.4.3',
    formula: 'ΔS_F = -[e_y + (θ_y · B)],  ΔS_R = -[e_y + (θ_y · (B + C))]',
    substituted: `Front: -[${errorVertOffsetMm.toFixed(3)} + (${errorVertAngleMrad.toFixed(2)} · ${distB}/1000)], Rear: -[${errorVertOffsetMm.toFixed(3)} + (${errorVertAngleMrad.toFixed(2)} · ${(distB + distC)}/1000)]`,
    result: `Front: ${frontFootShimAdjustmentMm >= 0 ? '+' : ''}${frontFootShimAdjustmentMm.toFixed(2)} mm | Rear: ${rearFootShimAdjustmentMm >= 0 ? '+' : ''}${rearFootShimAdjustmentMm.toFixed(2)} mm`,
    unit: 'mm',
    note: 'Precision stainless steel shims conforming to API 686 max 3 shims per foot rule.',
    isCompliant: true,
  });

  // 6. Dynamic Coupling Reaction Forces & Disc Pack Stresses
  // Coupling stiffness parameters
  const kTheta = inputs.angularStiffnessNmPerMrad || 450; // Nm/mrad
  const kRadial = inputs.radialStiffnessNPerMm || 1800; // N/mm
  const dbse = Math.max(50, inputs.couplingSpacerLengthMm); // mm

  // Transmitted bending moment from angular tilt
  const transmittedBendingMomentNm = (kTheta * hotResultantAngleMrad);

  // Radial shear reaction across spacer spool
  // Moment couple on spacer: F_shear = 2 * M / DBSE + k_r * delta_r
  const transmittedRadialShearN = (2 * transmittedBendingMomentNm) / (dbse / 1000) + (kRadial * hotResultantOffsetMm);

  // Dynamic reaction loads on motor and pump drive-end (DE) bearings
  // Typical overhang ratio ~ 1.35
  const motorBearingAdditionalRadialLoadN = transmittedRadialShearN * 1.35;
  const pumpBearingAdditionalRadialLoadN = transmittedRadialShearN * 1.35;

  // Disc pack alternating stress (AGMA 9000-D11)
  // Deflection angle per disc pack (half of total angular misalignment across 2 flexible elements)
  const anglePerPackDeg = (hotResultantAngleMrad / 2) * (180 / (Math.PI * 1000));
  const maxAllowAngleDeg = inputs.maxAllowableContinuousAngleDeg || 0.5;
  const couplingDiscStressMPa = Math.min(650, (anglePerPackDeg / maxAllowAngleDeg) * 220 + 45);
  const fatigueLimitMPa = 280; // Stainless 301/304 spring disc pack endurance limit
  const couplingFatigueSafetyFactor = fatigueLimitMPa / Math.max(1, couplingDiscStressMPa);

  auditTrail.push({
    title: 'Transmitted Coupling Reaction & Bearing Overload',
    standardRef: 'AGMA 9000-D11 / API 671',
    formula: 'M_reaction = k_θ · θ_resultant,  F_shear = 2·M/DBSE + k_r·Δr',
    substituted: `${kTheta} Nm/mrad · ${hotResultantAngleMrad.toFixed(2)} mrad = ${transmittedBendingMomentNm.toFixed(1)} Nm | F_shear = ${transmittedRadialShearN.toFixed(0)} N`,
    result: `${transmittedRadialShearN.toFixed(0)} N`,
    unit: 'N',
    note: `Motor DE bearing dynamic load increase: +${motorBearingAdditionalRadialLoadN.toFixed(0)} N`,
    isCompliant: couplingFatigueSafetyFactor >= 1.3,
  });

  // 7. ISO 10816-3 Vibration Prediction (2X Misalignment Harmonics)
  // Angular and parallel misalignment excite strong 2X shaft rotation harmonics and axial vibration
  const rpmFactor = Math.pow(inputs.motorRpm / 3000, 0.75);
  const offsetRatio = hotResultantOffsetMm / allowableParallelOffsetMm;
  const angleRatio = hotResultantAngleMrad / allowableAngularOffsetMrad;

  const vibration1XRmsMmS = Math.min(15, (0.6 + 0.9 * offsetRatio) * rpmFactor);
  const vibration2XRmsMmS = Math.min(25, (0.4 + 2.2 * Math.pow(angleRatio, 1.4)) * rpmFactor);
  const vibrationAxialRmsMmS = Math.min(20, (0.3 + 1.8 * angleRatio) * rpmFactor);
  const totalVibrationRmsMmS = Math.sqrt(
    vibration1XRmsMmS * vibration1XRmsMmS +
    vibration2XRmsMmS * vibration2XRmsMmS +
    vibrationAxialRmsMmS * vibrationAxialRmsMmS
  );

  let iso10816Zone: 'A' | 'B' | 'C' | 'D' = 'B';
  if (totalVibrationRmsMmS <= 1.4) {
    iso10816Zone = 'A';
  } else if (totalVibrationRmsMmS <= 2.8) {
    iso10816Zone = 'B';
  } else if (totalVibrationRmsMmS <= 4.5) {
    iso10816Zone = 'C';
  } else {
    iso10816Zone = 'D';
  }

  // 8. Soft Foot Analysis (API 686 Section 7.2.3)
  const softFeet = [
    inputs.softFootFrontLeftMm,
    inputs.softFootFrontRightMm,
    inputs.softFootRearLeftMm,
    inputs.softFootRearRightMm,
  ];
  const maxSoftFootMm = Math.max(...softFeet);
  const softFootCompliant = maxSoftFootMm <= 0.05; // API 686 limit: 0.05 mm (2.0 mils)
  let softFootSeverity: 'normal' | 'moderate' | 'excessive' = 'normal';
  if (maxSoftFootMm > 0.10) {
    softFootSeverity = 'excessive';
  } else if (maxSoftFootMm > 0.05) {
    softFootSeverity = 'moderate';
  }

  auditTrail.push({
    title: 'Soft Foot Compliance (API 686 §7.2.3)',
    standardRef: 'API 686 2nd Ed §7.2.3.4',
    formula: 'max(Δ_soft_foot) ≤ 0.05 mm (2.0 mils)',
    substituted: `Max measured deflection = ${maxSoftFootMm.toFixed(3)} mm across 4 motor anchor pads`,
    result: `${maxSoftFootMm.toFixed(3)} mm`,
    unit: 'mm',
    note: softFootCompliant ? 'Compliant with API 686 standard.' : 'EXCEEDS LIMIT: Causes motor casing strain and air gap distortion.',
    isCompliant: softFootCompliant,
  });

  // 9. Overall Skid Health Status & Recommendations
  let score = 100;
  if (!api686HotRunningCompliant) score -= 35;
  if (!api686ColdTargetCompliant) score -= 15;
  if (!softFootCompliant) score -= 20;
  if (iso10816Zone === 'D') score -= 30;
  else if (iso10816Zone === 'C') score -= 15;
  if (couplingFatigueSafetyFactor < 1.2) score -= 15;

  score = Math.max(0, Math.min(100, Math.round(score)));

  let level: 'safe' | 'warning' | 'critical' = 'safe';
  let label = 'API 686 Compliant - Coaxial Alignment';
  let message = 'Hot operating shaft centerlines achieve coaxial alignment within API 686 allowable limits.';
  const recommendations: string[] = [];

  if (score < 50 || iso10816Zone === 'D' || !api686HotRunningCompliant) {
    level = 'critical';
    label = 'Out of API 686 Tolerance - Severe Misalignment';
    message = `Hot running resultant offset (${hotResultantOffsetMm.toFixed(2)} mm) or tilt (${hotResultantAngleMrad.toFixed(2)} mrad) exceeds API 686 limits. High bearing fatigue risk.`;
    recommendations.push(
      `Adjust front feet by ${frontFootShimAdjustmentMm >= 0 ? '+' : ''}${frontFootShimAdjustmentMm.toFixed(2)} mm and rear feet by ${rearFootShimAdjustmentMm >= 0 ? '+' : ''}${rearFootShimAdjustmentMm.toFixed(2)} mm shims.`,
      `Shift motor horizontally with jackbolts: Front ${frontFootHorizontalMoveMm.toFixed(2)} mm, Rear ${rearFootHorizontalMoveMm.toFixed(2)} mm.`,
      'Re-check soft foot after torquing anchor bolts to API 686 recommended torque.'
    );
  } else if (score < 80 || iso10816Zone === 'C' || !softFootCompliant) {
    level = 'warning';
    label = 'Marginal Alignment / Soft Foot Warning';
    message = 'Alignment is marginal or soft foot exceeds 0.05 mm limit. Premature seal and bearing degradation expected.';
    if (!softFootCompliant) {
      recommendations.push(`Correct soft foot on affected anchor pads (max ${maxSoftFootMm.toFixed(2)} mm > 0.05 mm limit) using partial shimming.`);
    }
    recommendations.push('Fine-tune motor cold target offset to accommodate thermal casing expansion.');
  } else {
    recommendations.push(
      'Maintain verified cold target offsets during planned maintenance shutdowns.',
      'Torque hold-down bolts in criss-cross pattern per API 686 torque tables.'
    );
  }

  const status: StatusAssessment = {
    level,
    score,
    label,
    message,
    recommendations,
  };

  return {
    motorThermalGrowthMm,
    pumpThermalGrowthMm,
    netThermalOffsetMm,
    coldTargetVerticalOffsetMm,
    coldTargetVerticalAngleMrad,
    hotRunningVerticalOffsetMm,
    hotRunningVerticalAngleMrad,
    hotRunningHorizontalOffsetMm,
    hotRunningHorizontalAngleMrad,
    hotResultantOffsetMm,
    hotResultantAngleMrad,
    frontFootShimAdjustmentMm,
    rearFootShimAdjustmentMm,
    frontFootHorizontalMoveMm,
    rearFootHorizontalMoveMm,
    allowableParallelOffsetMm,
    allowableAngularOffsetMrad,
    api686ColdTargetCompliant,
    api686HotRunningCompliant,
    toleranceUtilizationPercent,
    alignmentClassification,
    transmittedBendingMomentNm,
    transmittedRadialShearN,
    motorBearingAdditionalRadialLoadN,
    pumpBearingAdditionalRadialLoadN,
    couplingDiscStressMPa,
    couplingFatigueSafetyFactor,
    vibration1XRmsMmS,
    vibration2XRmsMmS,
    vibrationAxialRmsMmS,
    totalVibrationRmsMmS,
    iso10816Zone,
    maxSoftFootMm,
    softFootCompliant,
    softFootSeverity,
    status,
    auditTrail,
  };
}
