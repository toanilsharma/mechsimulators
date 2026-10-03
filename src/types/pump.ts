import { StatusAssessment, AuditStep } from './common';

export type PumpFluidType =
  | 'water'
  | 'boiler_feed'
  | 'gasoline'
  | 'diesel'
  | 'crude_oil'
  | 'lpg_propane'
  | 'methanol'
  | 'thermal_oil'
  | 'custom';

export type SuctionSourceType =
  | 'open_tank'
  | 'pressurized_vessel'
  | 'suction_lift'
  | 'flooded_suction';

export type SafetyMarginType = 'normal' | 'conservative' | 'custom';

export type NpshrInputMode = 'single_value' | 'curve_table';

export interface NpshrPoint {
  flowM3h: number;
  npshrM: number;
}

export interface HeadCurvePoint {
  flowM3h: number;
  headM: number;
}

export interface SuctionFittings {
  standard90Elbow: number;
  longRadius90Elbow: number;
  gateValveOpen: number;
  butterflyValve: number;
  swingCheckValve: number;
  suctionStrainer: number; // clean basket or Y
  teeFlowThrough: number;
  teeBranchFlow: number;
  entranceLoss: 'sharp' | 'radiused' | 'reentrant';
}

export interface PumpInputs {
  fluidId: PumpFluidType;
  fluidTempC: number;
  customDensityKgM3?: number;
  customVaporPressureKPa?: number;
  suctionSourceType: SuctionSourceType;
  tankPressureKPag: number; // Vessel/tank gauge pressure (can be vacuum/negative or positive)
  atmosphericPressureKPa: number; // e.g. 101.325 kPa (1 atm)
  staticHeadM: number; // Liquid level above/below pump centerline (+ flooded, - lift)
  pipeLengthM: number; // Length of suction line
  pipeDiameterMm: number; // Inner diameter of suction piping
  pipeRoughnessMm: number; // e.g. 0.045 mm commercial carbon steel
  useSimplifiedEquivLength?: boolean;
  equivalentLengthM?: number;
  fittings: SuctionFittings;
  foulingFactor: number; // 1.0 = clean, 1.25 = moderate aging, 1.5 = fouled
  valveOpeningPercent?: number; // 10% to 100% open
  gasEntrainmentPercent?: number; // 0% to 10% free gas/air
  pumpPresetModel?: 'low_npshr' | 'standard' | 'high_flow' | 'oem_curve';
  scenarioId?: string;
  customViscosityCP?: number;
  pipeDiameterChangeMm: number; // Suction reducer at pump flange (e.g. 0 if no change)
  flowRateM3h: number; // Operating flow rate
  bepFlowM3h: number; // Best Efficiency Point flow rate
  ratedHeadM: number; // Total Dynamic Head (TDH) at BEP
  shutOffHeadM: number; // Head at zero flow
  pumpSpeedRpm: number; // Shaft speed
  impellerEyeDiameterMm: number;
  npshrInputMode: NpshrInputMode;
  npshr3percentM: number; // NPSH required (at 3% head reduction) at duty point
  npshrCurvePoints?: NpshrPoint[];
  safetyMarginType: SafetyMarginType;
  customSafetyMarginM?: number;
  pumpType: 'overhung_oh2' | 'between_bearing_bb2' | 'vertical_vs4' | 'ansi_chemical';
  serviceStandard: 'api610' | 'hydraulic_institute' | 'iso5199';
}

export interface PumpOutputs {
  fluidDensityKgM3: number;
  vaporPressureKPa: number;
  fluidViscosityCP: number;
  fluidVelocityMs: number;
  reynoldsNumber: number;
  frictionFactor: number;
  pipeFrictionHeadLossM: number;
  fittingsMinorLossM: number;
  totalSuctionHeadLossM: number;
  suctionFlangePressureKPag: number;
  absoluteSuctionHeadM: number;
  atmosphericHeadM: number;
  vesselPressureHeadM: number;
  staticSuctionHeadM: number;
  vaporPressureHeadM: number;
  npshaM: number;
  npshrM: number;
  npshMarginM: number; // NPSHa - NPSHr
  npshMarginRatio: number; // NPSHa / NPSHr
  npshExcessM: number; // NPSHa - NPSHr
  requiredSafetyMarginM: number;
  recommendedMarginRatio: number;
  recommendedExcessHeadM: number;
  suctionSpecificSpeedMetric: number;
  suctionSpecificSpeedUS: number;
  operatingPercentBEP: number;
  operatingHeadM: number;
  cavitationRiskPercent: number;
  bubbleCollapseIntensityScore: number; // 0-100 index of acoustic energy / damage potential
  suctionRecirculationRisk: boolean;
  dischargeRecirculationRisk: boolean;
  viscousDeratingFactorHead_CH: number;
  viscousDeratingFactorFlow_CQ: number;
  viscousDeratingFactorEfficiency_Ceta: number;
  isViscousCorrected: boolean;
  specificWarnings: string[];
  recommendedActions: string[];
  headCurveData: { flowM3h: number; headM: number }[];
  npshCurveData: {
    flowM3h: number;
    npshrM: number;
    npshaM: number;
    safeThresholdM: number;
  }[];
  status: StatusAssessment;
  auditTrail: AuditStep[];
}
