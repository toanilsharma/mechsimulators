import React from 'react';
import { RecipCompressorInputs, RecipCompressorOutputs } from '../../types/recipCompressor';
import { UnitSystem } from '../../types/common';
import { ResultsPanel, ResultKPI, ResultGauge } from '../../components/Shared/ResultsPanel';

interface RecipResultsProps {
  inputs: RecipCompressorInputs;
  outputs: RecipCompressorOutputs;
  unitSystem?: UnitSystem;
}

export const RecipResults: React.FC<RecipResultsProps> = ({
  inputs,
  outputs,
  unitSystem = 'metric',
}) => {
  const {
    effectiveVolumetricEfficiencyPercent,
    actualDischargeTempC,
    tensionLoadUtilizationPercent,
    compressionLoadUtilizationPercent,
    rodLoadReversalDegrees,
    maxPulsationPercentOfLine,
    api618AllowablePulsationPercent,
    status,
    recommendations,
  } = outputs;

  const isTempCritical = actualDischargeTempC > 150;
  const isTempWarning = actualDischargeTempC > 135;
  const isReversalCritical = rodLoadReversalDegrees < 15;

  const kpis: ResultKPI[] = [
    {
      id: 'dischTemp',
      label: 'Discharge Temp (T_d)',
      value: actualDischargeTempC,
      rawNumericValue: actualDischargeTempC,
      unit: '°C',
      decimals: 1,
      status: isTempCritical ? 'critical' : isTempWarning ? 'warning' : 'safe',
      helperText: 'API 618 limit: 150°C',
    },
    {
      id: 'rodReversal',
      label: 'Rod Pin Reversal',
      value: rodLoadReversalDegrees,
      rawNumericValue: rodLoadReversalDegrees,
      unit: 'deg',
      decimals: 1,
      status: isReversalCritical ? 'critical' : rodLoadReversalDegrees < 20 ? 'warning' : 'safe',
      helperText: 'API 618 minimum 15° crank',
    },
    {
      id: 'tensionLoad',
      label: 'Tension Load Util.',
      value: tensionLoadUtilizationPercent,
      rawNumericValue: tensionLoadUtilizationPercent,
      unit: '%',
      decimals: 1,
      status: tensionLoadUtilizationPercent > 100 ? 'critical' : tensionLoadUtilizationPercent > 90 ? 'warning' : 'safe',
      helperText: 'Max allowable rod tension',
    },
    {
      id: 'compLoad',
      label: 'Compression Load Util.',
      value: compressionLoadUtilizationPercent,
      rawNumericValue: compressionLoadUtilizationPercent,
      unit: '%',
      decimals: 1,
      status: compressionLoadUtilizationPercent > 100 ? 'critical' : compressionLoadUtilizationPercent > 90 ? 'warning' : 'safe',
      helperText: 'Max allowable rod compression',
    },
    {
      id: 'volEff',
      label: 'Volumetric Efficiency',
      value: effectiveVolumetricEfficiencyPercent,
      rawNumericValue: effectiveVolumetricEfficiencyPercent,
      unit: '%',
      decimals: 1,
      status: effectiveVolumetricEfficiencyPercent < 60 ? 'warning' : 'safe',
      helperText: 'Cylinder delivery ratio',
    },
    {
      id: 'pulsation',
      label: 'Acoustic Pulsation',
      value: maxPulsationPercentOfLine,
      rawNumericValue: maxPulsationPercentOfLine,
      unit: '%',
      decimals: 2,
      status: maxPulsationPercentOfLine > api618AllowablePulsationPercent ? 'critical' : 'safe',
      helperText: `API 618 Limit: ${api618AllowablePulsationPercent.toFixed(2)}%`,
    },
  ];

  const gauges: ResultGauge[] = [
    {
      id: 'tempGauge',
      title: 'Discharge Temp (T_d)',
      value: actualDischargeTempC,
      min: 30,
      max: 180,
      unit: '°C',
      warningThreshold: 135,
      criticalThreshold: 150,
      targetValue: 105,
      targetLabel: 'Normal',
    },
    {
      id: 'reversalGauge',
      title: 'Rod Pin Reversal',
      value: rodLoadReversalDegrees,
      min: 0,
      max: 60,
      unit: 'deg',
      warningThreshold: 20,
      criticalThreshold: 15,
      inverseZones: true,
      targetValue: 30,
      targetLabel: 'API Min',
    },
  ];

  return (
    <ResultsPanel
      status={status}
      simulatorId="recip"
      inputs={inputs}
      outputs={outputs}
      unitSystem={unitSystem}
      mainResult={{
        label: 'Discharge Temperature (API 618)',
        value: actualDischargeTempC,
        rawNumericValue: actualDischargeTempC,
        unit: '°C',
        decimals: 1,
        status: status.level,
      }}
      liveInsight={status.message || 'Reciprocating cylinder thermodynamics and valve dynamics active.'}
      kpis={kpis}
      gauges={gauges}
      recommendedAction={recommendations?.[0] || 'Verify interstage cooling, valve sealing, and rod pin reversal crank angle.'}
      trendLabel="Discharge Temp Trend (°C)"
    />
  );
};
