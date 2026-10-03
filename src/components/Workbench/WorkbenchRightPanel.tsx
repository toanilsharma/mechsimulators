import React, { useMemo } from 'react';
import { UnitSystem, StatusLevel } from '../../types/common';
import { ResultSchema } from './types';
import { Activity, ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';
import { ResultsPanel, ResultKPI, ResultGauge } from '../Shared/ResultsPanel';

interface WorkbenchRightPanelProps<TOutputs extends Record<string, any>, TInputs extends Record<string, any>> {
  outputs: TOutputs;
  inputs: TInputs;
  unitSystem: UnitSystem;
  resultSchema?: ResultSchema<TOutputs, TInputs>;
  customResults?: (props: {
    outputs: TOutputs;
    inputs: TInputs;
    unitSystem: UnitSystem;
    eventLogs: Array<{ id: string; timestamp: string; message: string; type: 'info' | 'warning' | 'alert' | 'success' }>;
  }) => React.ReactNode;
  status: {
    level: StatusLevel;
    label: string;
    message: string;
  };
  simulatorId?: string;
}

export function WorkbenchRightPanel<TOutputs extends Record<string, any>, TInputs extends Record<string, any>>({
  outputs,
  inputs,
  unitSystem,
  resultSchema,
  customResults,
  status,
  simulatorId,
}: WorkbenchRightPanelProps<TOutputs, TInputs>) {
  const getStatusBadge = () => {
    switch (status.level) {
      case 'safe':
        return {
          bg: 'bg-emerald-950/80 border-emerald-700/60 text-emerald-400',
          icon: <ShieldCheck size={13} className="text-emerald-400 shrink-0" />,
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/80 border-amber-700/60 text-amber-400',
          icon: <AlertTriangle size={13} className="text-amber-400 shrink-0" />,
        };
      case 'critical':
        return {
          bg: 'bg-rose-950/80 border-rose-700/60 text-rose-400 animate-pulse',
          icon: <AlertOctagon size={13} className="text-rose-400 shrink-0" />,
        };
    }
  };

  const banner = getStatusBadge();

  // If fallback resultSchema is used
  const liveInsight = resultSchema?.liveInsightGetter
    ? resultSchema.liveInsightGetter(outputs, inputs)
    : status.message || 'Telemetry and governing criteria nominal.';

  const recommendedActions = resultSchema?.recommendedActionGetter
    ? resultSchema.recommendedActionGetter(outputs, inputs)
    : 'Maintain standard operating procedures.';
  const shortAction = Array.isArray(recommendedActions) ? recommendedActions[0] : recommendedActions;

  // Convert schema KPIs to ResultKPI
  const schemaKpis: ResultKPI[] = useMemo(() => {
    return (resultSchema?.kpis || []).map((k) => {
      const rawVal = k.valueGetter(outputs);
      return {
        id: k.id,
        label: k.label,
        value: rawVal,
        unit: k.unit,
        status:
          k.criticalThreshold !== undefined && Number(rawVal) >= k.criticalThreshold
            ? 'critical'
            : k.warningThreshold !== undefined && Number(rawVal) >= k.warningThreshold
            ? 'warning'
            : 'safe',
        helperText: k.subtitle,
      };
    });
  }, [resultSchema, outputs]);

  const schemaGauges: ResultGauge[] = useMemo(() => {
    return (resultSchema?.kpis || [])
      .filter((k) => k.type === 'gauge')
      .slice(0, 2)
      .map((k) => {
        const rawVal = Number(k.valueGetter(outputs)) || 0;
        return {
          id: k.id,
          title: k.label,
          value: rawVal,
          min: 0,
          max: k.criticalThreshold ? k.criticalThreshold * 1.5 : 100,
          unit: k.unit || '',
          warningThreshold: k.warningThreshold,
          criticalThreshold: k.criticalThreshold,
          inverseZones: k.inverseZones,
          targetValue: k.targetValue,
          targetLabel: k.targetLabel,
        };
      });
  }, [resultSchema, outputs]);

  return (
    <div className="w-full h-full flex flex-col bg-[#0d1117] text-[#c9d1d9] select-none">
      {/* Top SCADA Results Header */}
      <div className="py-1.5 px-2.5 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white uppercase tracking-wider">
          <Activity size={13} className="text-[#3fb950]" />
          <span>Results & Diagnostics</span>
        </div>

        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold ${banner.bg}`}>
          {banner.icon}
          <span>{status.label.toUpperCase()}</span>
        </div>
      </div>

      {/* Scrollable Results Body */}
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {customResults ? (
          customResults({
            outputs,
            inputs,
            unitSystem,
            eventLogs: [],
          })
        ) : (
          <ResultsPanel
            status={status}
            simulatorId={simulatorId}
            inputs={inputs}
            outputs={outputs}
            unitSystem={unitSystem}
            mainResult={{
              label: schemaKpis[0]?.label || 'Primary Criterion',
              value: schemaKpis[0]?.value || 0,
              unit: schemaKpis[0]?.unit,
              status: status.level,
            }}
            liveInsight={liveInsight}
            kpis={schemaKpis.slice(0, 6)}
            gauges={schemaGauges}
            recommendedAction={shortAction}
          />
        )}
      </div>
    </div>
  );
}
