import { PipeInputs, PipeOutputs, PipeMaterialType } from '../types/pipe';
import { MATERIAL_DATABASE, PIPE_SIZE_DATABASE, getPipeDimensions } from './pipeData';
import { AuditStep, StatusAssessment } from '../types/common';

export function calculatePipeStress(inputs: PipeInputs): PipeOutputs {
  const auditTrail: AuditStep[] = [];

  // 1. Resolve Pipe Geometry & Temperature-Dependent Material Properties (ASME B31.3 App C)
  const matType: PipeMaterialType = inputs.materialType || 'carbon_steel';
  const matPreset = MATERIAL_DATABASE[matType] || MATERIAL_DATABASE.carbon_steel;

  const matName = inputs.customMaterialName || matPreset.name;
  const matSpec = matPreset.spec;

  const T_op = inputs.operatingTempC;
  const T_install = inputs.installationTempC;
  const T_mean = (T_op + T_install) / 2;

  // Temperature-dependent elastic modulus E(T) & thermal expansion alpha(T) per ASME B31.3 App C
  let baseE_GPa = matPreset.modulusOfElasticityGPa;
  let baseAlpha_1e6 = matPreset.thermalExpansionCoeff_1e6PerC;

  if (matType === 'carbon_steel') {
    // E drops from 203 GPa at 20°C to ~172 GPa at 400°C (Table C-6)
    baseE_GPa = Math.max(140, 203 - 0.052 * (T_op - 20) - 0.000065 * Math.pow(Math.max(0, T_op - 20), 2));
    // Mean coefficient of thermal expansion alpha increases with temp (Table C-1)
    baseAlpha_1e6 = 11.5 * (1 + 0.00055 * (T_mean - 20));
  } else if (matType === 'stainless_steel') {
    baseE_GPa = Math.max(130, 195 - 0.068 * (T_op - 20));
    baseAlpha_1e6 = 16.0 * (1 + 0.00042 * (T_mean - 20));
  } else if (matType === 'alloy_steel') {
    baseE_GPa = Math.max(140, 210 - 0.055 * (T_op - 20));
    baseAlpha_1e6 = 12.0 * (1 + 0.00050 * (T_mean - 20));
  }

  const E_GPa = inputs.modulusOfElasticityGPa > 0 ? inputs.modulusOfElasticityGPa : baseE_GPa;
  const E_MPa = E_GPa * 1000;
  const alpha_1e6 = inputs.thermalExpansionCoeff_1e6PerC > 0 ? inputs.thermalExpansionCoeff_1e6PerC : baseAlpha_1e6;
  const alpha_val = alpha_1e6 * 1e-6; // mm/mm/°C or m/m/°C

  // Basic allowable stresses: Sc (cold) and Sh (hot) per ASME B31.3 Table A-1
  const S_c = matPreset.allowableStressMPa;
  let S_h = S_c;
  if (T_op > 100) {
    if (matType === 'carbon_steel') {
      S_h = Math.max(85, S_c * (1 - 0.00075 * (T_op - 100)));
    } else if (matType === 'stainless_steel') {
      S_h = Math.max(75, S_c * (1 - 0.0011 * (T_op - 100)));
    } else {
      S_h = Math.max(90, S_c * (1 - 0.0006 * (T_op - 100)));
    }
  }
  const allowableStress_MPa = inputs.allowableStressMPa > 0 ? inputs.allowableStressMPa : S_h;

  // Geometry
  const Do_mm = inputs.pipeOuterDiameterMm > 0 ? inputs.pipeOuterDiameterMm : 168.3; // Default 6"
  const tn_mm = inputs.pipeWallThicknessMm > 0 ? inputs.pipeWallThicknessMm : 7.11; // Default Sch 40
  const corrosionAllowanceMm = inputs.corrosionAllowanceMm || 0;
  const effectiveWallMm = Math.max(0.5, tn_mm - corrosionAllowanceMm);
  const Di_mm = Math.max(1.0, Do_mm - 2 * effectiveWallMm);

  // Pipe Cross-Sectional Properties
  const area_mm2 = (Math.PI / 4) * (Math.pow(Do_mm, 2) - Math.pow(Di_mm, 2));
  const area_cm2 = area_mm2 / 100;
  const I_mm4 = (Math.PI / 64) * (Math.pow(Do_mm, 4) - Math.pow(Di_mm, 4));
  const I_cm4 = I_mm4 / 10000;
  const Z_mm3 = I_mm4 / (Do_mm / 2);
  const Z_cm3 = Z_mm3 / 1000;
  const linearWeightKgM = (area_mm2 / 1000000) * matPreset.densityKgM3;

  auditTrail.push({
    title: '1. Pipe Cross-Sectional Geometry & Metal Area (ASME B36.10M)',
    standardRef: 'ASME B36.10M / ASME B31.3 §304',
    formula: 'A_{metal} = \\frac{\\pi}{4}(D_o^2 - D_i^2), \\quad I = \\frac{\\pi}{64}(D_o^4 - D_i^4), \\quad Z = \\frac{2I}{D_o}',
    substituted: `D_o = ${Do_mm.toFixed(1)} mm, t = ${tn_mm.toFixed(2)} mm (t_{eff} = ${effectiveWallMm.toFixed(2)} mm), D_i = ${Di_mm.toFixed(1)} mm`,
    result: `A = ${area_mm2.toFixed(1)} mm² (${area_cm2.toFixed(1)} cm²), I = ${I_cm4.toFixed(1)} cm⁴, Z = ${Z_cm3.toFixed(1)} cm³`,
    unit: 'Cross-Section Properties',
  });

  // 2. Temperature Differential & Thermal Linear Expansion
  const deltaTempC = Math.max(0, inputs.operatingTempC - inputs.installationTempC);
  const pipeLengthM = Math.max(0.5, inputs.pipeLengthM || 10);

  // deltaL = alpha * L * deltaT
  const thermalExpansionM = alpha_val * pipeLengthM * deltaTempC;
  const thermalExpansionMm = thermalExpansionM * 1000;

  auditTrail.push({
    title: '2. Free Thermal Linear Expansion (ΔL)',
    standardRef: 'ASME B31.3 §319.3.1 / Table C-1',
    formula: '\\Delta L = \\alpha \\cdot L \\cdot \\Delta T = \\alpha \\cdot L \\cdot (T_{op} - T_{install})',
    substituted: `α = ${alpha_1e6.toFixed(1)}×10⁻⁶ /°C, L = ${pipeLengthM} m, ΔT = ${inputs.operatingTempC}°C - ${inputs.installationTempC}°C = ${deltaTempC}°C`,
    result: `ΔL = ${thermalExpansionMm.toFixed(2)} mm (${thermalExpansionM.toFixed(4)} m)`,
    unit: 'mm',
  });

  // 3. Anchor Restraint & Effective Constraint Factor
  const isAnchorFailed = inputs.isAnchorFailed || inputs.scenarioId === 'failed_anchor';
  const isSupportFailed = inputs.isSupportFailed || inputs.scenarioId === 'failed_support';
  const isThermalShock = inputs.isThermalShock || inputs.scenarioId === 'thermal_shock';
  const isNozzleOverloadScenario = inputs.isNozzleOverloadScenario || inputs.scenarioId === 'nozzle_overload_on_pump';

  let restraintFactor = 1.0;
  if (isAnchorFailed) {
    restraintFactor = 0.05; // Anchor failed; pipe displaces freely / unconstrained
  } else if (inputs.anchorCondition === 'one_end_fixed_one_end_free' || inputs.constraintFactorType === 'free_expansion') {
    restraintFactor = 0.0;
  } else if (inputs.constraintFactorType === 'partially_restrained') {
    restraintFactor = Math.min(1.0, Math.max(0.0, (inputs.restraintPercent ?? 50) / 100));
  } else if (inputs.anchorCondition === 'expansion_loop') {
    restraintFactor = 0.05; // Loop absorbs expansion; residual axial thrust is minimal
  } else if (inputs.anchorCondition === 'guided') {
    restraintFactor = Math.min(1.0, Math.max(0.2, (inputs.restraintPercent ?? 90) / 100));
  } else {
    // anchored_both_ends / fully_restrained
    restraintFactor = Math.min(1.0, Math.max(0.0, (inputs.restraintPercent ?? 100) / 100));
  }

  // 4. Axial Thermal Stress & Anchor Force
  // sigma_thermal = restraintFactor * E * alpha * deltaT
  const axialStressDirect_MPa = restraintFactor * E_MPa * alpha_val * deltaTempC;

  // Expansion Loop Calculations
  const loopWidthM = Math.max(0.5, inputs.expansionLoopWidthM || 3.0);
  const loopHeightM = Math.max(0.5, inputs.expansionLoopHeightM || 3.5);
  const loopHeightMm = loopHeightM * 1000;

  // SIF for 90° elbows per ASME B31.3 App D
  const Rbend_mm = 1.5 * Do_mm;
  const meanRadius_mm = (Do_mm - effectiveWallMm) / 2;
  const h_char = (effectiveWallMm * Rbend_mm) / Math.pow(meanRadius_mm, 2);
  const sif_i = Math.min(4.5, Math.max(1.0, 0.9 / Math.pow(Math.max(0.05, h_char), 2 / 3)));

  let bendingStress_MPa = 0;
  let expansionLoopRequiredHeightM = 0;
  let expansionLoopAdequacyPercent = 100;
  let isExpansionLoopAdequate = true;
  let expansionLoopWarning: string | undefined = undefined;

  if (inputs.anchorCondition === 'expansion_loop') {
    const K_loop = 1.8;
    const reqHeightMm = Math.sqrt((3 * E_MPa * Do_mm * Math.max(0.1, thermalExpansionMm)) / (allowableStress_MPa * K_loop));
    expansionLoopRequiredHeightM = reqHeightMm / 1000;
    expansionLoopAdequacyPercent = (loopHeightM / Math.max(0.1, expansionLoopRequiredHeightM)) * 100;
    isExpansionLoopAdequate = loopHeightM >= expansionLoopRequiredHeightM;

    const absorbingLegMm = loopHeightMm * 2;
    bendingStress_MPa = ((3 * E_MPa * Do_mm * thermalExpansionMm) / Math.pow(absorbingLegMm, 2)) * sif_i * 0.55;

    const aspectRatio = loopWidthM / loopHeightM;
    if (aspectRatio < 0.25 || aspectRatio > 2.5) {
      expansionLoopWarning = `Loop aspect ratio W/H = ${aspectRatio.toFixed(2)} is outside recommended range (0.4 to 1.8).`;
    }
  }

  // Net axial stress in pipe
  const totalAxialStress_MPa = inputs.anchorCondition === 'expansion_loop'
    ? axialStressDirect_MPa + bendingStress_MPa
    : axialStressDirect_MPa;

  // Axial Force F = sigma_axial * A_metal (in N and kN)
  const axialForceN = totalAxialStress_MPa * area_mm2;
  const axialForceKN = axialForceN / 1000;

  auditTrail.push({
    title: '3. Axial Thermal Stress & Anchor Restraint Force',
    standardRef: 'ASME B31.3 §319.4 / Roark Formulas for Stress and Strain',
    formula: '\\sigma_{axial} = C_{restraint} \\cdot E \\cdot \\alpha \\cdot \\Delta T, \\quad F_{axial} = \\sigma_{axial} \\cdot A_{metal}',
    substituted: `Restraint = ${(restraintFactor * 100).toFixed(0)}%, E = ${E_GPa} GPa, α = ${alpha_1e6.toFixed(1)}×10⁻⁶ /°C, ΔT = ${deltaTempC}°C, A = ${area_mm2.toFixed(1)} mm²`,
    result: `σ_axial = ${totalAxialStress_MPa.toFixed(1)} MPa, F_axial = ${axialForceKN.toFixed(2)} kN (${(axialForceKN * 224.809).toFixed(0)} lbf)`,
    unit: 'MPa / kN',
  });

  // 5. Hoop Stress Approximation
  const pressureBar = Math.max(0, inputs.operatingPressureBar || 0);
  const pressureMPa = pressureBar * 0.1;
  const jointFactor_Ej = inputs.jointFactor_Ej > 0 ? inputs.jointFactor_Ej : 1.0;
  const hoopStressMPa = (pressureMPa * Do_mm) / (2 * effectiveWallMm * jointFactor_Ej);

  auditTrail.push({
    title: '4. Internal Pressure Hoop Stress',
    standardRef: 'ASME B31.3 Eq. 3a (§304.1.2)',
    formula: '\\sigma_{hoop} = \\frac{P \\cdot D_o}{2 \\cdot t_{eff} \\cdot E_j}',
    substituted: `P = ${pressureBar.toFixed(1)} bar (${pressureMPa.toFixed(3)} MPa), D_o = ${Do_mm.toFixed(1)} mm, t_eff = ${effectiveWallMm.toFixed(2)} mm, E_j = ${jointFactor_Ej.toFixed(2)}`,
    result: `σ_hoop = ${hoopStressMPa.toFixed(1)} MPa`,
    unit: 'MPa',
  });

  // 5. Sustained Longitudinal Stress (SL) & Allowable Displacement Stress Range (SA)
  // Longitudinal pressure stress sigma_L_pressure = (P * Di^2) / (Do^2 - Di^2)
  const Di_calc = Math.max(1.0, Do_mm - 2 * effectiveWallMm);
  const longitudinalPressureStressMPa = area_mm2 > 0 ? (pressureMPa * Math.PI * Math.pow(Di_calc, 2) / 4) / area_mm2 : 0;
  
  // Longitudinal weight bending stress approximation for standard support spans (L_span <= 6m)
  const spanLengthM = Math.min(pipeLengthM, 6.0);
  const weightPerMM_N = (linearWeightKgM * 9.80665) / 1000;
  const weightBendingStressMPa = Z_mm3 > 0 ? (weightPerMM_N * Math.pow(spanLengthM * 1000, 2)) / (10 * Z_mm3) : 0;
  const sustainedLongitudinalStress_SL_MPa = longitudinalPressureStressMPa + weightBendingStressMPa;

  // Allowable displacement stress range SA per ASME B31.3 Eq. 1a (§302.3.5)
  // SA = f * [ 1.25(Sc + Sh) - SL ]
  const stressRangeFactor_f = inputs.stressRangeReductionFactor_f || 1.0;
  const allowableStressRange_SA_MPa = stressRangeFactor_f * Math.max(S_h, 1.25 * (S_c + S_h) - sustainedLongitudinalStress_SL_MPa);

  // Secondary thermal displacement stress range SE per ASME B31.3 §319.4.4
  const displacementStressRange_SE_MPa = totalAxialStress_MPa;

  // 6. Combined Stress Estimate (von Mises & Tresca)
  const combinedStressVonMisesMPa = Math.sqrt(
    Math.pow(totalAxialStress_MPa, 2) +
    Math.pow(hoopStressMPa, 2) -
    (totalAxialStress_MPa * hoopStressMPa)
  );

  const combinedStressTrescaMPa = Math.max(
    Math.abs(totalAxialStress_MPa),
    Math.abs(hoopStressMPa),
    Math.abs(totalAxialStress_MPa - hoopStressMPa)
  );

  // Governing stress ratio: Secondary displacement stress SE vs SA (thermal expansion)
  const expansionStressRatioPercent = (displacementStressRange_SE_MPa / allowableStressRange_SA_MPa) * 100;
  const sustainedStressRatioPercent = (sustainedLongitudinalStress_SL_MPa / S_h) * 100;
  const hoopStressRatioPercent = (hoopStressMPa / (S_h * jointFactor_Ej)) * 100;
  const stressRatioPercent = Math.max(expansionStressRatioPercent, hoopStressRatioPercent);

  auditTrail.push({
    title: '5. ASME B31.3 Displacement Stress Range (SA) & Flexibility Evaluation',
    standardRef: 'ASME B31.3 §302.3.5 (Eq. 1a) & §319.4.4',
    formula: 'S_A = f \\left[ 1.25(S_c + S_h) - S_L \\right], \\quad S_E = \\sigma_{thermal} \\le S_A',
    substituted: `f = ${stressRangeFactor_f.toFixed(2)}, S_c = ${S_c.toFixed(0)} MPa, S_h = ${S_h.toFixed(0)} MPa, S_L = ${sustainedLongitudinalStress_SL_MPa.toFixed(1)} MPa, S_E = ${displacementStressRange_SE_MPa.toFixed(1)} MPa`,
    result: `S_A = ${allowableStressRange_SA_MPa.toFixed(1)} MPa, S_E = ${displacementStressRange_SE_MPa.toFixed(1)} MPa (Utilization = ${expansionStressRatioPercent.toFixed(1)}%, Sustained S_L/S_h = ${sustainedStressRatioPercent.toFixed(1)}%)`,
    unit: 'MPa',
    isCompliant: displacementStressRange_SE_MPa <= allowableStressRange_SA_MPa && sustainedLongitudinalStress_SL_MPa <= S_h,
    note: 'ASME B31.3 recognizes self-limiting thermal displacement stress as secondary, permitting higher allowable range SA than primary sustained stress Sh.',
  });

  // 7. Nozzle Load Calculation & Assessment
  const nozzleLimitKN = inputs.nozzleLoadLimitKN > 0 ? inputs.nozzleLoadLimitKN : 18.0;
  let nozzleLoadKN = 0;
  if (inputs.anchorCondition === 'expansion_loop') {
    nozzleLoadKN = Math.max(0.5, axialForceKN * 0.15 + (bendingStress_MPa * area_mm2) / 20000);
  } else if (inputs.anchorCondition === 'one_end_fixed_one_end_free') {
    nozzleLoadKN = 0.2; // minimal friction
  } else if (isAnchorFailed) {
    nozzleLoadKN = Math.max(1.0, axialForceKN * 0.1);
  } else {
    // Rigid run connecting to pump nozzle
    nozzleLoadKN = Math.abs(axialForceKN);
  }

  if (isNozzleOverloadScenario) {
    nozzleLoadKN = Math.max(nozzleLoadKN, nozzleLimitKN * 1.85);
  }

  const nozzleLoadRatioPercent = (nozzleLoadKN / nozzleLimitKN) * 100;
  const isNozzleOverloaded = nozzleLoadKN > nozzleLimitKN;

  // 8. Reaction Moment and Anchor Force
  const anchorReactionForceX_kN = isAnchorFailed ? 0.5 : axialForceKN;
  const anchorReactionMomentZ_kNm = (anchorReactionForceX_kN * (Do_mm / 1000) * 0.5);

  // 9. Status Logic & Recommendations
  let stressState: 'safe' | 'warning' | 'critical' = 'safe';
  let statusLabel = 'Safe - Operating Within Code Limits';
  let statusMessage = `Combined stress σ_combined = ${combinedStressVonMisesMPa.toFixed(1)} MPa is within the allowable limit (${stressRatioPercent.toFixed(0)}% utilization).`;
  let healthScore = 95;

  if (isAnchorFailed) {
    stressState = 'critical';
    statusLabel = 'Critical - Anchor Structural Failure';
    statusMessage = 'Anchor failure detected! Pipe has lost structural constraint, causing excessive uncontrolled thermal movement.';
    healthScore = 15;
  } else if (isNozzleOverloaded) {
    stressState = 'critical';
    statusLabel = 'Critical - Equipment Nozzle Overload';
    statusMessage = `Connected pump nozzle load (${nozzleLoadKN.toFixed(1)} kN) exceeds allowable limit (${nozzleLimitKN.toFixed(1)} kN) by ${(nozzleLoadRatioPercent - 100).toFixed(0)}%. Risk of pump casing distortion.`;
    healthScore = 25;
  } else if (stressRatioPercent > 100) {
    stressState = 'critical';
    statusLabel = 'Critical - Stress Exceeds Code Allowable';
    statusMessage = `Combined stress (${combinedStressVonMisesMPa.toFixed(1)} MPa) exceeds allowable S_A (${allowableStress_MPa.toFixed(1)} MPa). High risk of yield and anchor failure.`;
    healthScore = 30;
  } else if (stressRatioPercent >= 80 || isSupportFailed) {
    stressState = 'warning';
    statusLabel = isSupportFailed ? 'Warning - Support Guide Displaced' : 'Warning - Stress Near Code Limit';
    statusMessage = isSupportFailed
      ? 'Intermediate guide support compromised; pipe subject to gravitational sag and thermal bowing.'
      : `Combined stress is at ${stressRatioPercent.toFixed(0)}% of allowable limit (${combinedStressVonMisesMPa.toFixed(1)} / ${allowableStress_MPa.toFixed(1)} MPa).`;
    healthScore = 65;
  }

  // 10. Dynamic Live Engineering Insights Engine
  const liveInsights: Array<{ text: string; type: 'safe' | 'warning' | 'critical' }> = [];

  if (isAnchorFailed) {
    liveInsights.push({
      text: 'Anchor failure is causing excessive uncontrolled movement and load redistribution across adjacent supports.',
      type: 'critical',
    });
  } else if (isNozzleOverloaded) {
    liveInsights.push({
      text: `Nozzle load (${nozzleLoadKN.toFixed(1)} kN) exceeds equipment limits (${nozzleLimitKN.toFixed(1)} kN per API 610) — risk of pump shaft misalignment and casing ovalization.`,
      type: 'critical',
    });
  } else if (inputs.anchorCondition === 'anchored_both_ends' && restraintFactor > 0.8 && deltaTempC > 30) {
    liveInsights.push({
      text: `Axial stress is high (${totalAxialStress_MPa.toFixed(0)} MPa) because the pipe is fully restrained between rigid terminal anchors.`,
      type: stressRatioPercent > 100 ? 'critical' : 'warning',
    });
  } else if (inputs.anchorCondition === 'expansion_loop') {
    if (isExpansionLoopAdequate) {
      liveInsights.push({
        text: `Expansion loop is actively reducing stress, absorbing ${thermalExpansionMm.toFixed(1)} mm thermal growth (Loop flexibility adequacy: ${expansionLoopAdequacyPercent.toFixed(0)}%).`,
        type: 'safe',
      });
    } else {
      liveInsights.push({
        text: `Expansion loop height (${loopHeightM} m) is insufficient for ${thermalExpansionMm.toFixed(1)} mm growth (Min required: ${expansionLoopRequiredHeightM.toFixed(2)} m).`,
        type: 'warning',
      });
    }
  } else if (inputs.anchorCondition === 'one_end_fixed_one_end_free' || restraintFactor === 0) {
    liveInsights.push({
      text: `Free expansion active: thermal growth (ΔL = ${thermalExpansionMm.toFixed(1)} mm) occurs unrestricted with zero axial thermal stress.`,
      type: 'safe',
    });
  } else {
    liveInsights.push({
      text: `Thermal growth (ΔL = ${thermalExpansionMm.toFixed(1)} mm) is within acceptable range for the current layout.`,
      type: 'safe',
    });
  }

  if (isSupportFailed) {
    liveInsights.push({
      text: 'Failed intermediate support increases unsupported span length, inducing combined bending deflection.',
      type: 'warning',
    });
  }

  if (isThermalShock) {
    liveInsights.push({
      text: 'Thermal shock condition: steep through-wall temperature gradient generates elevated transient thermal skin stresses.',
      type: 'warning',
    });
  }

  if (stressRatioPercent < 60 && !isNozzleOverloaded && !isAnchorFailed) {
    liveInsights.push({
      text: 'Piping flexibility and pressure containment comply comfortably with ASME B31.3 allowable limits.',
      type: 'safe',
    });
  }

  const recommendedActions: string[] = [];
  if (stressRatioPercent > 100 || isNozzleOverloaded) {
    recommendedActions.push('Install an expansion U-loop or flexible bellows to reduce thermal thrust.');
    recommendedActions.push('Verify anchor and pump nozzle allowable load ratings per API 610 / NEMA SM 23.');
    recommendedActions.push('Adjust pipe routing or support arrangement to lower axial constraint factor.');
  }

  const status: StatusAssessment = {
    level: stressState,
    score: healthScore,
    label: statusLabel,
    message: statusMessage,
    recommendations: recommendedActions,
  };

  return {
    outerDiameterMm: Do_mm,
    wallThicknessMm: tn_mm,
    effectiveWallThicknessMm: effectiveWallMm,
    innerDiameterMm: Di_mm,
    metalCrossSectionAreaMm2: area_mm2,
    metalCrossSectionAreaCm2: area_cm2,
    momentOfInertiaCm4: I_cm4,
    sectionModulusCm3: Z_cm3,
    linearWeightKgM,
    deltaTempC,
    thermalExpansionMm,
    thermalExpansionM,
    effectiveRestraintFactor: restraintFactor,
    axialStressMPa: totalAxialStress_MPa,
    axialForceN,
    axialForceKN,
    hoopStressMPa,
    combinedStressVonMisesMPa,
    combinedStressTrescaMPa,
    allowableStressMPa: allowableStress_MPa,
    stressRatioPercent,
    stressState,
    nozzleLoadKN,
    nozzleLoadLimitKN: nozzleLimitKN,
    nozzleLoadRatioPercent,
    isNozzleOverloaded,
    isAnchorFailed,
    isSupportFailed,
    isThermalShock,
    expansionLoopRequiredHeightM,
    expansionLoopAdequacyPercent,
    isExpansionLoopAdequate,
    expansionLoopWarning,
    bendingStressMPa: bendingStress_MPa,
    stressIntensificationFactor_i: sif_i,
    anchorReactionForceX_kN,
    anchorReactionMomentZ_kNm,
    materialDetails: {
      name: matName,
      spec: matSpec,
      E_GPa,
      alpha_1e6,
      allowable_MPa: allowableStress_MPa,
    },
    recommendedActions,
    status,
    auditTrail,
    dynamicLiveInsights: liveInsights,

    // Legacy Aliases
    thermalGrowthLeg1Mm: thermalExpansionMm,
    expansionStressRangeS_E_MPa: displacementStressRange_SE_MPa,
    allowableStressRangeSa_MPa: allowableStressRange_SA_MPa,
    hoopStressPressureMPa: hoopStressMPa,
    elasticModulusE_GPa: E_GPa,
    meanThermalCoeffAlpha_1e6PerC: alpha_1e6,
    minimumFlexibleLegLengthM: expansionLoopRequiredHeightM,
    basicAllowableColdSc_MPa: S_c,
    basicAllowableHotSh_MPa: S_h,
  };
}
