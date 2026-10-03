import { SimulatorId, UnitSystem } from './common';

export interface SweepPoint {
  xValue: number;
  xLabel: string;
  yValuePrimary: number;
  yLabelPrimary: string;
  yValueSecondary?: number;
  yLabelSecondary?: string;
  status: 'safe' | 'warning' | 'critical';
  insight?: string;
  patchInputs?: Record<string, any>;
}

export interface SweepConfig {
  id: string;
  label: string;
  simulatorId: SimulatorId;
  parameterKey: string;
  unit: string;
  min: number;
  max: number;
  steps: number;
  description: string;
  primaryOutputName: string;
  primaryOutputUnit: string;
  secondaryOutputName?: string;
  secondaryOutputUnit?: string;
  thresholdWarning: number;
  thresholdCritical: number;
  thresholdDirection: 'above' | 'below'; // whether 'above' threshold is dangerous or 'below'
}

export interface PFStage {
  id: string;
  name: string;
  detectionTechnology: string;
  pToFRemainingPercent: number; // 100% is Point P, 0% is Point F
  typicalTimeRemainingDays: number;
  description: string;
  symptomSeverity: 'normal' | 'early' | 'moderate' | 'severe' | 'catastrophic';
  vibrationMultiplier: number;
}

export interface AssetHealthScore {
  overallScore: number; // 0 to 100
  rating: 'Pristine' | 'Acceptable' | 'Caution' | 'High Risk' | 'Imminent Failure';
  mtbfHours: number;
  estimatedRulDays: number;
  governingFailureMode: string;
  pfCurrentStageIndex: number;
  reliabilityFactors: {
    name: string;
    score: number;
    weight: number;
    detail: string;
    status: 'safe' | 'warning' | 'critical';
  }[];
}

export interface LCCBreakdown {
  initialCapitalCost: number; // $
  annualEnergyKwh: number;
  annualEnergyCost: number; // $
  annualRoutineMaintenanceCost: number; // $
  annualPartsOverhaulCost: number; // $
  annualUnplannedDowntimeRiskCost: number; // $
  lifetimeYears: number;
  totalLifetimeCostUnmitigated: number;
  totalLifetimeCostMitigated: number;
  potentialLifetimeSavings: number;
  energySavingsAnnual: number;
  downtimeReductionAnnual: number;
}

export interface EquipmentDatasheet {
  tagNumber: string;
  serviceDescription: string;
  governingStandard: string;
  manufacturer: string;
  serialNumber: string;
  designCode: string;
  operatingConditions: { label: string; value: string; unit?: string }[];
  performanceMetrics: { label: string; value: string; unit?: string; status?: string }[];
  materialsAndSpecs: { label: string; value: string }[];
  designLimitsAndSafety: { label: string; value: string }[];
}
