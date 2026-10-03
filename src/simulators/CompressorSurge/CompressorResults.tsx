import React from 'react';
import { CompressorInputs, CompressorOutputs } from '../../types/compressor';
import { UnitSystem } from '../../types/common';
import { ResultsPanel, ResultKPI, ResultGauge } from '../../components/Shared/ResultsPanel';

interface CompressorResultsProps {
  inputs: CompressorInputs;
  outputs: CompressorOutputs;
  unitSystem?: UnitSystem;
  onAuditRequested?: (trail: any) => void;
  onReportRequested?: (data: any) => void;
}

export const CompressorResults: React.FC<CompressorResultsProps> = ({
  inputs,
  outputs,
  unitSystem = 'metric',
  onAuditRequested,
  onReportRequested,
}) => {
  // Main Governing KPI: Current Surge Margin %
  const mainResult = {
    label: 'SURGE MARGIN (SM)',
    value: `${outputs.currentSurgeMarginPercent.toFixed(1)}%`,
    rawNumericValue: outputs.currentSurgeMarginPercent,
    unit: '%',
    target: `≥ ${inputs.surgeMarginTargetPercent}% target`,
    status: outputs.status.level,
  };

  const kpis: ResultKPI[] = [
    {
      id: 'flow_total',
      label: 'TOTAL COMPRESSOR FLOW',
      value: `${outputs.massFlowTotalKgS.toFixed(1)} kg/s`,
      rawNumericValue: outputs.massFlowTotalKgS,
      unit: 'kg/s',
      status: outputs.operatingState === 'deep_surge' ? 'critical' : outputs.operatingState === 'surge_warning' ? 'warning' : 'safe',
      helperText: `Process: ${outputs.processMassFlowKgS.toFixed(1)} + Recycle: ${outputs.asvRecycleMassFlowKgS.toFixed(1)} kg/s`,
    },
    {
      id: 'pressure_ratio',
      label: 'PRESSURE RATIO (P2/P1)',
      value: `${outputs.pressureRatioRc.toFixed(2)}x`,
      rawNumericValue: outputs.pressureRatioRc,
      unit: 'Rc',
      status: 'neutral',
      helperText: `Discharge P2: ${outputs.dischargePressureBar.toFixed(2)} bar(a)`,
    },
    {
      id: 'thrust_bearing',
      label: 'THRUST BEARING LOAD',
      value: `${outputs.thrustBearingLoadPercent.toFixed(0)}%`,
      rawNumericValue: outputs.thrustBearingLoadPercent,
      unit: '%',
      status: outputs.thrustBearingLoadPercent > 100 ? 'critical' : outputs.thrustBearingLoadPercent > 80 ? 'warning' : 'safe',
      helperText: outputs.reverseFlowDetected ? '⚠ DANGEROUS AXIAL REVERSAL' : 'Normal forward thrust pad',
    },
    {
      id: 'discharge_temp',
      label: 'DISCHARGE TEMP (T2)',
      value: `${outputs.dischargeTempC.toFixed(1)}°C`,
      rawNumericValue: outputs.dischargeTempC,
      unit: '°C',
      status: outputs.dischargeTempC > 150 ? 'warning' : 'safe',
      helperText: `Poly Head: ${outputs.polytropicHeadKjKg.toFixed(1)} kJ/kg`,
    },
    {
      id: 'shaft_power',
      label: 'SHAFT COMPRESSION POWER',
      value: `${Math.round(outputs.shaftPowerKw).toLocaleString()} kW`,
      rawNumericValue: outputs.shaftPowerKw,
      unit: 'kW',
      status: 'neutral',
      helperText: `Polytropic η: ${(inputs.polytropicEfficiency * 100).toFixed(0)}%`,
    },
    {
      id: 'acoustic_noise',
      label: 'ACOUSTIC NOISE LEVEL',
      value: `${outputs.acousticNoiseDba.toFixed(0)} dBA`,
      rawNumericValue: outputs.acousticNoiseDba,
      unit: 'dBA',
      status: outputs.acousticNoiseDba > 100 ? 'critical' : outputs.acousticNoiseDba > 85 ? 'warning' : 'safe',
      helperText: outputs.operatingState === 'deep_surge' ? 'Cyclic Shock Wave Bangs' : 'Normal casing sound envelope',
    },
  ];

  const gauges: ResultGauge[] = [
    {
      id: 'surge_margin_gauge',
      title: 'SURGE MARGIN vs SCL/SLL',
      value: Number(outputs.currentSurgeMarginPercent.toFixed(1)),
      min: -30,
      max: 40,
      unit: '%',
      warningThreshold: inputs.surgeMarginTargetPercent,
      criticalThreshold: 0,
      inverseZones: true, // Lower is dangerous
      targetValue: inputs.surgeMarginTargetPercent,
      targetLabel: 'SCL',
    },
    {
      id: 'thrust_load_gauge',
      title: 'AXIAL THRUST BEARING CAPACITY',
      value: Number(outputs.thrustBearingLoadPercent.toFixed(0)),
      min: 0,
      max: 200,
      unit: '%',
      warningThreshold: 85,
      criticalThreshold: 100,
      targetValue: 50,
      targetLabel: 'Design',
    },
  ];

  const trendData = [
    outputs.currentSurgeMarginPercent + 4,
    outputs.currentSurgeMarginPercent + 2,
    outputs.currentSurgeMarginPercent + 1,
    outputs.currentSurgeMarginPercent,
  ];

  return (
    <ResultsPanel
      status={outputs.status}
      mainResult={mainResult}
      simulatorId="compressor"
      inputs={inputs}
      outputs={outputs}
      unitSystem={unitSystem}
      liveInsight={
        outputs.operatingState === 'deep_surge'
          ? 'Compressor has crossed left of the Surge Limit Line (SLL). Gas velocity in diffusers has reversed, setting up high-amplitude cyclic pressure shocks across the rotor train.'
          : outputs.operatingState === 'surge_warning'
          ? 'Compressor mass flow has entered the Anti-Surge Control Line (SCL) safety margin zone. Controller must stroke ASV open to maintain minimum aerodynamic stability.'
          : 'Compressor is operating in continuous stable aerodynamic flow regime with positive slope pressure head.'
      }
      recommendedAction={
        outputs.operatingState === 'deep_surge'
          ? 'Trip unit immediately or command ASV 100% full open with recycle blow-off.'
          : outputs.operatingState === 'surge_warning'
          ? 'Increase recycle valve opening or reduce discharge throttle valve restriction.'
          : 'Maintain process flow within API 617 stable operating envelope.'
      }
      kpis={kpis}
      gauges={gauges}
      trendData={trendData}
    />
  );
};
