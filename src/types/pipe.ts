import { StatusAssessment, AuditStep } from './common';

export type PipeMaterialType =
  | 'carbon_steel' // ASTM A106 Gr. B / A53 (CS)
  | 'stainless_steel' // ASTM A312 TP304 / TP316 (Austenitic SS)
  | 'alloy_steel' // ASTM A335 P11 / P22 (Cr-Mo)
  | 'custom'; // User-defined E, alpha, allowable stress

export type AnchorCondition =
  | 'anchored_both_ends' // Fixed-fixed straight run
  | 'one_end_fixed_one_end_free' // Cantilever / free expansion
  | 'guided' // Axial guides with anchor
  | 'expansion_loop'; // Symmetrical expansion U-loop

export type ConstraintFactorType =
  | 'free_expansion' // 0% restraint
  | 'partially_restrained' // Partial constraint (e.g. 50%)
  | 'fully_restrained'; // 100% rigid axial constraint

export type PipeSizePreset =
  | 'DN50' // 2" (60.3 mm OD)
  | 'DN80' // 3" (88.9 mm OD)
  | 'DN100' // 4" (114.3 mm OD)
  | 'DN150' // 6" (168.3 mm OD)
  | 'DN200' // 8" (219.1 mm OD)
  | 'custom';

export interface PipeInputs {
  // Scenario selector
  scenarioId?: string;

  // Basic inputs
  materialType: PipeMaterialType;
  pipeSizePreset?: PipeSizePreset;
  customMaterialName?: string;
  pipeLengthM: number; // Straight run length L (m)
  pipeOuterDiameterMm: number; // Outside diameter Do (mm)
  pipeWallThicknessMm: number; // Wall thickness t (mm)
  installationTempC: number; // Installation / ambient temperature (°C)
  operatingTempC: number; // Operating / design temperature (°C)
  operatingPressureBar: number; // Operating internal pressure (bar)
  anchorCondition: AnchorCondition;
  constraintFactorType: ConstraintFactorType;
  restraintPercent: number; // 0% to 100%

  // Advanced inputs
  modulusOfElasticityGPa: number; // E (GPa)
  thermalExpansionCoeff_1e6PerC: number; // alpha (x10^-6 /°C)
  allowableStressMPa: number; // Allowable stress Sa / Sh (MPa)
  expansionLoopWidthM: number; // Loop width W (m)
  expansionLoopHeightM: number; // Loop height H (m)
  numberOfBends: number; // Number of elbows (typically 4 for U-loop, 2 for L-bend)
  jointFactor_Ej: number; // Pressure design joint quality factor (e.g., 1.0 seamless, 0.85 ERW)
  corrosionAllowanceMm: number; // Mill tolerance / corrosion allowance (mm)
  nozzleLoadLimitKN: number; // API 610 / NEMA Allowable Nozzle Load limit (kN)

  // Failure & Special Mode Flags
  isAnchorFailed?: boolean;
  isSupportFailed?: boolean;
  isThermalShock?: boolean;
  isNozzleOverloadScenario?: boolean;

  // Compatibility / Helpers
  npsNominalDiameterInches?: number;
  schedule?: '10' | '40' | '80' | '160';
  materialId?: string;
  configType?: string;
  leg1LengthM?: number;
  leg2LengthM?: number;
  leg3LengthM?: number;
  designTempC?: number;
  ambientTempC?: number;
  internalPressureKPag?: number;
  stressRangeReductionFactor_f?: number;
  anchorRigidity?: 'rigid' | 'flexible_nozzle';
}

export interface PipeOutputs {
  // Geometry
  outerDiameterMm: number;
  wallThicknessMm: number;
  effectiveWallThicknessMm: number;
  innerDiameterMm: number;
  metalCrossSectionAreaMm2: number;
  metalCrossSectionAreaCm2: number;
  momentOfInertiaCm4: number;
  sectionModulusCm3: number;
  linearWeightKgM: number;

  // Thermal Kinematics
  deltaTempC: number; // delta T = T_op - T_install
  thermalExpansionMm: number; // delta L = alpha * L * delta T
  thermalExpansionM: number;
  effectiveRestraintFactor: number; // 0 to 1.0

  // Stress & Forces
  axialStressMPa: number; // sigma_axial = restraint * E * alpha * delta T
  axialForceN: number; // F = sigma_axial * metal area
  axialForceKN: number;
  hoopStressMPa: number; // sigma_hoop = (P * Do) / (2 * t * Ej)
  combinedStressVonMisesMPa: number; // sqrt(sigma_a^2 + sigma_h^2 - sigma_a*sigma_h)
  combinedStressTrescaMPa: number; // max(|s_a|, |s_h|, |s_a - s_h|)
  allowableStressMPa: number;
  stressRatioPercent: number; // (sigma_combined / allowableStress) * 100%
  stressState: 'safe' | 'warning' | 'critical';

  // Nozzle Reactions & Limits
  nozzleLoadKN: number;
  nozzleLoadLimitKN: number;
  nozzleLoadRatioPercent: number;
  isNozzleOverloaded: boolean;

  // Failure & Special Mode Results
  isAnchorFailed: boolean;
  isSupportFailed: boolean;
  isThermalShock: boolean;

  // Expansion Loop Check
  expansionLoopRequiredHeightM: number; // Minimum loop height H_min
  expansionLoopAdequacyPercent: number; // (H_actual / H_min) * 100%
  isExpansionLoopAdequate: boolean;
  expansionLoopWarning?: string;
  bendingStressMPa: number;
  stressIntensificationFactor_i: number;

  // Anchor reactions
  anchorReactionForceX_kN: number;
  anchorReactionMomentZ_kNm: number;

  // Material summary
  materialDetails: {
    name: string;
    spec: string;
    E_GPa: number;
    alpha_1e6: number;
    allowable_MPa: number;
  };

  // Status & Recommendations
  recommendedActions: string[];
  status: StatusAssessment;
  auditTrail: AuditStep[];
  dynamicLiveInsights: Array<{ text: string; type: 'safe' | 'warning' | 'critical' }>;

  // Legacy Aliases for seamless backward compatibility
  thermalGrowthLeg1Mm: number;
  expansionStressRangeS_E_MPa: number;
  allowableStressRangeSa_MPa: number;
  hoopStressPressureMPa: number;
  elasticModulusE_GPa: number;
  meanThermalCoeffAlpha_1e6PerC: number;
  minimumFlexibleLegLengthM: number;
  basicAllowableColdSc_MPa: number;
  basicAllowableHotSh_MPa: number;
}

