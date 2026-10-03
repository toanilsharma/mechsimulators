export type UnitSystem = 'metric' | 'us';

export type RouteId =
  | 'home'
  | 'workbench'
  | 'portal'
  | 'pump'
  | 'compressor'
  | 'recip'
  | 'gearbox'
  | 'turbine'
  | 'bearing'
  | 'journal'
  | 'rotor'
  | 'pipe'
  | 'seal'
  | 'alignment'
  | 'methodology'
  | 'standards'
  | 'faq'
  | 'disclaimer'
  | 'about';

export type SimulatorId = 'pump' | 'compressor' | 'recip' | 'gearbox' | 'turbine' | 'bearing' | 'journal' | 'rotor' | 'pipe' | 'seal' | 'alignment';

export type ThemeMode = 'dark' | 'light';

export type StatusLevel = 'safe' | 'warning' | 'critical';
export type SeverityLevel = StatusLevel;

export interface StatusAssessment {
  level: StatusLevel;
  score: number; // 0 to 100 health score
  label: string;
  message: string;
  recommendations: string[];
}

export interface AuditStep {
  title: string;
  standardRef: string;
  formula: string;
  substituted: string;
  result: string;
  unit: string;
  note?: string;
  isCompliant?: boolean;
}

export interface AuditItem {
  parameter: string;
  equation: string;
  calculatedValue: string;
  referenceStandard: string;
  status: 'pass' | 'warning' | 'fail';
}

export interface ValidationPreset<T> {
  id: string;
  name: string;
  description: string;
  industry: string;
  source: string; // e.g. "API 610 Annex A Example 3"
  inputs: T;
  expectedOutputs: {
    key: string;
    label: string;
    expected: string;
    unit: string;
  }[];
}
