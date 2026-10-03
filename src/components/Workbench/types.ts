import React from 'react';
import { UnitSystem, StatusLevel, SimulatorId } from '../../types/common';

export interface ScenarioItem<TInputs> {
  id: string;
  name: string;
  category?: 'normal' | 'abnormal' | string;
  event?: string;
  consequence?: string;
  recommendedAction?: string;
  description?: string;
  inputs: TInputs;
}

export type WorkbenchScenario<TInputs> = ScenarioItem<TInputs>;

export interface InputFieldSchema<TInputs> {
  key: keyof TInputs;
  label: string;
  type: 'slider' | 'select' | 'toggle' | 'number';
  group?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: { value: string | number; label: string }[];
  helper?: string;
  disabled?: boolean;
}

export interface InputGroupSchema<TInputs> {
  id: string;
  title: string;
  icon?: React.ReactNode;
  badge?: string;
  fields: InputFieldSchema<TInputs>[];
}

export interface ResultKpiSchema<TOutputs> {
  id: string;
  label: string;
  valueGetter: (outputs: TOutputs) => number | string;
  unit?: string;
  format?: (val: any) => string;
  warningThreshold?: number;
  criticalThreshold?: number;
  inverseZones?: boolean; // if true, lower is worse (e.g. NPSH margin)
  targetValue?: number;
  targetLabel?: string;
  type?: 'gauge' | 'number' | 'sparkline' | 'badge';
  sparklineDataGetter?: (outputs: TOutputs) => number[];
  subtitle?: string;
}

export interface ResultSchema<TOutputs, TInputs> {
  statusGetter: (outputs: TOutputs, inputs: TInputs) => {
    level: StatusLevel;
    label: string;
    message: string;
  };
  liveInsightGetter?: (outputs: TOutputs, inputs: TInputs) => string;
  recommendedActionGetter?: (outputs: TOutputs, inputs: TInputs) => string | string[];
  kpis: ResultKpiSchema<TOutputs>[];
  eventLogGetter?: (outputs: TOutputs, inputs: TInputs) => Array<{
    id: string;
    timestamp: string;
    message: string;
    type: 'info' | 'warning' | 'alert' | 'success';
  }>;
}

export interface SimulatorWorkbenchProps<TInputs extends Record<string, any>, TOutputs extends Record<string, any>> {
  title: string;
  subtitle?: string;
  scenarios: ScenarioItem<TInputs>[];
  defaultInputs?: TInputs;
  inputSchema?: InputGroupSchema<TInputs>[];
  resultSchema?: ResultSchema<TOutputs, TInputs>;
  VisualComponent: React.ComponentType<{
    inputs: TInputs;
    outputs: TOutputs;
    isRunning: boolean;
    unitSystem: UnitSystem;
    [key: string]: any;
  }>;
  calculateFn?: (inputs: TInputs) => TOutputs;
  disclaimerText?: string;

  // Custom overrides (optional for full flexibility)
  customControls?: (props: {
    inputs: TInputs;
    onChange: (patch: Partial<TInputs> | TInputs) => void;
    unitSystem: UnitSystem;
    isRunning: boolean;
    onToggleRunning: () => void;
    onReset: () => void;
    scenarios?: ScenarioItem<TInputs>[];
    activeScenarioId?: string;
    onSelectScenario?: (id: string) => void;
  }) => React.ReactNode;
  customResults?: (props: {
    outputs: TOutputs;
    inputs: TInputs;
    unitSystem: UnitSystem;
    eventLogs: Array<{ id: string; timestamp: string; message: string; type: 'info' | 'warning' | 'alert' | 'success' }>;
  }) => React.ReactNode;
  chartComponent?: React.ReactNode | ((props: { inputs: TInputs; outputs: TOutputs; unitSystem: UnitSystem }) => React.ReactNode);
  chartTabLabel?: string;
  visualTabLabel?: string;
  simulatorType?: 'pump-cavitation' | 'compressor-surge' | 'bearing-fault' | 'journal-bearing' | 'recip-compressor' | 'rotor-unbalance' | 'pipe-stress' | 'seal-flush-plan' | 'alignment' | 'gearbox' | 'steam-turbine';
  simulatorId?: SimulatorId;
  buildReportData?: (inputs: TInputs, outputs: TOutputs, unitSystem: UnitSystem) => {
    title: string;
    subtitle: string;
    standards: string[];
    status: any;
    auditTrail: any[];
    inputSummary: Array<{ label: string; value: string }>;
    keyResults: Array<{ label: string; value: string; status?: 'safe' | 'warning' | 'critical' }>;
  };

  // Global Context Props
  unitSystem?: UnitSystem;
  onUnitSystemChange?: (units: UnitSystem) => void;
  onAuditRequested?: (trail: any) => void;
  onReportRequested?: (data: any) => void;
  onOpenInfo?: () => void;
  telemetryItems?: Array<{
    label: string;
    value: string | number;
    highlight?: 'default' | 'primary' | 'safe' | 'warning' | 'critical';
  }>;
}
