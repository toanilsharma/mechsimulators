import React from 'react';
import { PumpOutputs, PumpInputs } from '../../types/pump';
import { UnitSystem } from '../../types/common';
import { ResultsPanel, ResultKPI, ResultGauge } from '../../components/Shared/ResultsPanel';
import { convertHead, convertPressureGauge } from '../../utils/units';

interface PumpResultsProps {
  outputs: PumpOutputs;
  inputs: PumpInputs;
  unitSystem: UnitSystem;
}

export const PumpResults: React.FC<PumpResultsProps> = ({
  outputs,
  inputs,
  unitSystem,
}) => {
  const npshaConv = convertHead(outputs.npshaM, unitSystem);
  const npshrConv = convertHead(outputs.npshrM, unitSystem);
  const marginConv = convertHead(outputs.npshMarginM, unitSystem);
  const lossConv = convertHead(outputs.totalSuctionHeadLossM, unitSystem);
  const pumpHeadConv = convertHead(outputs.operatingHeadM, unitSystem);
  const suctionPConv = convertPressureGauge(outputs.suctionFlangePressureKPag, unitSystem);

  const isCritical = outputs.status.level === 'critical';
  const isWarning = outputs.status.level === 'warning';

  // 1. One-line live insight
  let liveInsight = `NPSHa exceeds NPSHr by ${outputs.npshMarginRatio.toFixed(2)}x with zero cavitation risk.`;
  if (isCritical) {
    liveInsight = 'NPSHa fell below NPSHr3%. Severe vapor bubble cavitation and impeller pitting damage occurring.';
  } else if (isWarning) {
    liveInsight = `NPSH margin (${marginConv.val.toFixed(2)} ${marginConv.unit}) is below standard safety threshold. Cavitation risk rising.`;
  } else if (outputs.isViscousCorrected && !isCritical) {
    liveInsight = `ANSI/HI 9.6.7 Viscous Derating: Head derated by ${((1 - outputs.viscousDeratingFactorHead_CH) * 100).toFixed(1)}% (CH=${outputs.viscousDeratingFactorHead_CH.toFixed(2)}) due to fluid viscosity.`;
  } else if (inputs.valveOpeningPercent && inputs.valveOpeningPercent < 60) {
    liveInsight = `Suction valve throttled to ${inputs.valveOpeningPercent}%, adding unnecessary dynamic head loss.`;
  } else if (inputs.foulingFactor > 1.3) {
    liveInsight = `Strainer fouling is ${inputs.foulingFactor.toFixed(2)}x baseline. High friction drop in suction line.`;
  }

  // 2. Recommended action (single short line)
  let recommendedAction = 'Maintain operating point within API 610 Preferred Operating Region (POR).';
  if (isCritical) {
    recommendedAction = 'Increase suction vessel level or open throttled suction valves immediately to stop cavitation.';
  } else if (isWarning) {
    recommendedAction = 'Reduce pump flow towards BEP or lower fluid temperature to restore minimum NPSH margin.';
  }

  // 3. Key KPIs (4 to 6)
  const kpis: ResultKPI[] = [
    {
      id: 'npsha',
      label: 'NPSH Available (NPSHa)',
      value: npshaConv.val,
      unit: npshaConv.unit,
      decimals: 2,
      status: outputs.npshaM < outputs.npshrM ? 'critical' : outputs.npshaM < outputs.npshrM + 1 ? 'warning' : 'safe',
      helperText: 'At impeller eye',
    },
    {
      id: 'npshr',
      label: 'NPSH Required (NPSHr)',
      value: npshrConv.val,
      unit: npshrConv.unit,
      decimals: 2,
      status: 'neutral',
      helperText: '3% head drop criterion',
    },
    {
      id: 'suctionLoss',
      label: 'Suction Head Loss',
      value: lossConv.val,
      unit: lossConv.unit,
      decimals: 2,
      status: outputs.totalSuctionHeadLossM > 1.5 ? 'warning' : 'neutral',
      helperText: 'Piping & fittings loss',
    },
    {
      id: 'suctionP',
      label: 'Suction Pressure',
      value: suctionPConv.val,
      unit: suctionPConv.unit,
      decimals: 1,
      status: outputs.suctionFlangePressureKPag < 0 ? 'warning' : 'safe',
      helperText: 'Flange gauge pressure',
    },
    {
      id: 'pumpHead',
      label: 'Operating Head (H)',
      value: pumpHeadConv.val,
      unit: pumpHeadConv.unit,
      decimals: 1,
      status: 'neutral',
      helperText: 'Total dynamic head',
    },
    {
      id: 'operatingFlow',
      label: 'Operating Flow (Q)',
      value: inputs.flowRateM3h,
      unit: 'm³/h',
      decimals: 0,
      status: 'neutral',
      helperText: `${outputs.operatingPercentBEP.toFixed(0)}% BEP (${inputs.bepFlowM3h} m³/h)`,
    },
  ];

  // 4. Circular Gauges (1 or 2)
  const gauges: ResultGauge[] = [
    {
      id: 'npshMarginRatio',
      title: 'NPSH Margin Ratio',
      value: outputs.npshMarginRatio,
      min: 0.5,
      max: 3.0,
      unit: 'x',
      warningThreshold: outputs.recommendedMarginRatio || 1.35,
      criticalThreshold: 1.0,
      inverseZones: true,
      targetValue: outputs.recommendedMarginRatio || 1.35,
      targetLabel: 'Req Min',
    },
    {
      id: 'cavitationRisk',
      title: 'Cavitation Severity',
      value: outputs.cavitationRiskPercent,
      min: 0,
      max: 100,
      unit: '%',
      warningThreshold: 35,
      criticalThreshold: 70,
      inverseZones: false,
      targetValue: 0,
      targetLabel: 'Target',
    },
  ];

  return (
    <ResultsPanel
      status={outputs.status}
      mainResult={{
        label: 'NPSH Margin (ΔNPSH)',
        value: marginConv.val,
        rawNumericValue: marginConv.val,
        unit: marginConv.unit,
        decimals: 2,
        status: outputs.status.level,
      }}
      liveInsight={liveInsight}
      kpis={kpis}
      gauges={gauges}
      trendLabel={`NPSH Margin (${marginConv.unit})`}
      recommendedAction={recommendedAction}
      simulatorId="pump"
      inputs={inputs}
      outputs={outputs}
      unitSystem={unitSystem}
    />
  );
};
