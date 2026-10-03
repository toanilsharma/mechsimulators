import { SimulatorId } from './common';

export interface DiagnosticStep {
  stepNumber: number;
  title: string;
  question: string;
  ruleOfThumb: string;
  physicalMechanism: string;
  checkFormula: string;
  keyMetric: string;
  fieldThreshold: string;
}

export interface DiagnosticIssue {
  id: string;
  simulatorId: SimulatorId;
  title: string;
  symptom: string;
  fieldObservation: string;
  standardRef: string;
  governingPhysics: string;
  steps: DiagnosticStep[];
  solutionSummary: string;
  applyFixActionTitle: string;
  applyFixInputs: Record<string, any>;
}

export interface IncidentCaseStudy {
  id: string;
  simulatorId: SimulatorId;
  title: string;
  facility: string;
  equipmentType: string;
  incidentSummary: string;
  failureMode: string;
  consequence: string;
  rootCausePhysics: string;
  lessonLearned: string;
  standardCitation: string;
  initialInputs: Record<string, any>;
  correctedInputs: Record<string, any>;
}
