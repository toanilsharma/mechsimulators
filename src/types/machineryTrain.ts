import { StatusLevel } from './common';

export type TrainNodeId = 'motor' | 'coupling' | 'pump' | 'seal' | 'pipe' | 'rotor';

export interface TrainMetric {
  label: string;
  value: string;
  unit: string;
  status?: StatusLevel;
}

export interface TransferForce {
  name: string;
  value: string;
  unit: string;
  direction: string;
  sourceNode: TrainNodeId;
  targetNode: TrainNodeId;
  mechanism: string;
  isActive: boolean;
}

export interface TrainComponentState {
  nodeId: TrainNodeId;
  name: string;
  tag: string;
  standard: string;
  status: StatusLevel;
  healthIndex: number; // 0 - 100
  primaryMetric: TrainMetric;
  secondaryMetrics: TrainMetric[];
  operatingConditions: string[];
  activeAlarms: string[];
  vibrationRMS?: number; // mm/s
  temperatureC?: number;
}

export interface CouplingTransferLink {
  id: string;
  source: TrainNodeId;
  target: TrainNodeId;
  sourceLabel: string;
  targetLabel: string;
  physicalMechanism: string;
  governingFormula: string;
  standardRef: string;
  transferCoefficient: string;
  currentEffect: string;
  isExceeded: boolean;
  severity: StatusLevel;
}

export interface CascadeStep {
  timeSeconds: number;
  phaseTitle: string;
  triggerNode: TrainNodeId;
  headline: string;
  physicsDescription: string;
  nodeStatuses: Record<TrainNodeId, StatusLevel>;
  metricsSnapshot: {
    nozzleStressPercent: number;
    couplingOffsetMm: number;
    vibrationRMS: number;
    sealLeakageMlHr: number;
    sealTempC: number;
    npshMarginRatio: number;
    bearingL10h: number;
  };
  interlockTrips: string[];
}

export interface CascadeScenario {
  id: string;
  title: string;
  subtitle: string;
  industry: string;
  governingStandards: string[];
  rootCauseNode: TrainNodeId;
  rootCauseDescription: string;
  terminalOutcome: string;
  steps: CascadeStep[];
  recommendedMitigation: string[];
  preventiveDesignAction: string;
}

export interface SISInterlockSensor {
  tag: string;
  description: string;
  nodeId: TrainNodeId;
  currentValue: number;
  unit: string;
  warningThreshold: number;
  tripSetpoint: number;
  votingLogic: '1oo1' | '1oo2' | '2oo3';
  isWarning: boolean;
  isTripped: boolean;
  bypassed: boolean;
}

export interface CoupledTrainSimulationResult {
  overallTrainHealth: number; // 0 - 100
  trainStatus: StatusLevel;
  components: Record<TrainNodeId, TrainComponentState>;
  transferLinks: CouplingTransferLink[];
  sisSensors: SISInterlockSensor[];
  isTrainTripped: boolean;
  activeTripReason: string | null;
  couplingLossKW: number;
  hydraulicEfficiency: number;
  totalVibrationSumMmS: number;
}
