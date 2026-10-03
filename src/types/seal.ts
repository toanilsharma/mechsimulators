import { StatusAssessment, AuditStep } from './common';

export type SealPlanId =
  | 'plan_11'
  | 'plan_13'
  | 'plan_21'
  | 'plan_23'
  | 'plan_31'
  | 'plan_32'
  | 'plan_52'
  | 'plan_53a'
  | 'plan_53b'
  | 'plan_53c'
  | 'plan_54'
  | 'plan_62';

export type SealFaceMaterial =
  | 'carbon_vs_sic' // Carbon vs Silicon Carbide
  | 'carbon_vs_tc' // Carbon vs Tungsten Carbide
  | 'sic_vs_sic' // Silicon Carbide vs Silicon Carbide (Hard vs Hard)
  | 'tc_vs_tc'; // Tungsten Carbide vs Tungsten Carbide

export type BarrierFluidType =
  | 'water_glycol_50_50'
  | 'iso_vg_5_synthetic'
  | 'iso_vg_10_mineral'
  | 'white_oil'
  | 'heat_transfer_oil'
  | 'methanol';

export type PressureControlMethod =
  | 'fixed_n2_regulator'
  | 'bladder_accumulator'
  | 'piston_differential_tracking'
  | 'external_lube_skid';

export interface SealInputs {
  planId: SealPlanId;
  sealSizeMm: number; // Shaft sleeve / seal balance diameter (25 - 150 mm)
  shaftSpeedRpm: number;
  sealChamberPressureKPag: number;
  pumpDischargePressureKPag: number;
  pumpSuctionPressureKPag: number;
  barrierBufferPressureKPag: number; // Pressure in barrier system (53A/B/C/54) or buffer tank (52)
  processFluidTempC: number;
  processFluidType: 'water' | 'crude_oil' | 'gasoline' | 'hot_hydrocarbon' | 'sour_water' | 'propane_lpg' | 'caustic_soda' | 'boiler_feedwater';
  fluidDensityKgM3: number; // User override or derived from fluid type
  fluidSpecificHeatCp: number; // kJ/kg·K
  fluidVaporPressureOverrideKPa?: number; // Optional user override
  faceMaterials: SealFaceMaterial;
  balanceRatioK: number; // Typically 0.70 to 0.80 for balanced seals
  faceFrictionCoeff: number; // 0.04 (hydrodynamic) to 0.12 (boundary)
  allowableFlushTempRiseC: number; // Typically 5°C to 15°C per API 682
  coolingWaterSupplyTempC: number;
  coolingWaterFlowLpm: number;
  coolerCapacityKW: number;
  barrierFluid: BarrierFluidType;
  barrierFluidVolumeL: number;
  accumulatorPrechargeKPag: number; // For Plan 53B
  pressureControlMethod: PressureControlMethod;
  flushOrificeDiameterMm: number;
  externalFlushPressureKPag: number; // For Plan 32
  externalFlushFlowLpm: number; // For Plan 32
  quenchFluidType: 'steam' | 'nitrogen' | 'water'; // For Plan 62
}

export interface PressureDropBreakdown {
  orificeDeltaPKPa: number;
  throttleBushingDeltaPKPa: number;
  coolerDeltaPKPa: number;
  pipingDeltaPKPa: number;
  totalSystemDeltaPKPa: number;
}

export interface SealOutputs {
  sealFaceAreaMm2: number;
  meanFaceRadiusMm: number;
  slidingVelocityMs: number;
  netFaceClosingPressureKPa: number;
  pvValueMPaMs: number; // PV factor
  sealFaceHeatGenKW: number; // Q_face
  heatSoakFromPumpKW: number; // Q_soak
  totalHeatToDissipateKW: number; // Q_total
  requiredFlushFlowLpm: number; // Required flush flow rate in L/min
  actualFlushFlowLpm: number; // Actual circulation flow rate
  actualOrificeFlowLpm: number; // Flow through restriction orifice
  pressureDrops: PressureDropBreakdown;
  sealChamberOperatingTempC: number;
  fluidVaporPressureAtChamberTempKPa: number;
  vaporPressureMarginKPa: number; // P_chamber - P_vapor
  vaporPressureTempMarginC: number; // T_boil - T_chamber
  barrierPressureDifferentialKPa: number; // P_barrier - P_chamber
  requiredMinBarrierPressureKPag: number;
  coolerDutyRequiredKW: number;
  actualCoolerHeatRemovalKW: number;
  coolerCoolingWaterFlowLpm: number;
  accumulatorMarginKPa?: number;
  api682VaporMarginCompliant: boolean;
  api682BarrierMarginCompliant: boolean;
  isPressureDifferentialInverted?: boolean;
  differentialStateDescription?: string;
  pvLimitCompliant: boolean;
  coolingAdequate: boolean;
  planSpecificWarnings: string[];
  status: StatusAssessment;
  auditTrail: AuditStep[];
}
