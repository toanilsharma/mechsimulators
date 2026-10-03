import React from 'react';
import { BearingFaultInputs, BearingFaultOutputs } from '../../types/bearing';
import { UnitSystem } from '../../types/common';
import { ResultsPanel, ResultKPI, ResultGauge } from '../../components/Shared/ResultsPanel';

interface BearingResultsProps {
  inputs: BearingFaultInputs;
  outputs: BearingFaultOutputs;
  unitSystem?: UnitSystem;
}

export const BearingResults: React.FC<BearingResultsProps> = ({
  inputs,
  outputs,
  unitSystem = 'metric',
}) => {
  const isVibCritical = outputs.overallVelocityRmsMmS > 4.5;
  const isVibWarning = outputs.overallVelocityRmsMmS > 2.8;

  const kpis: ResultKPI[] = [
    {
      id: 'isoVib',
      label: 'ISO 10816 Vibration',
      value: outputs.overallVelocityRmsMmS,
      rawNumericValue: outputs.overallVelocityRmsMmS,
      unit: 'mm/s RMS',
      decimals: 2,
      status: isVibCritical ? 'critical' : isVibWarning ? 'warning' : 'safe',
      helperText: `Zone ${outputs.iso10816Zone} Severity`,
    },
    {
      id: 'kurtosis',
      label: 'Statistical Kurtosis',
      value: outputs.kurtosis,
      rawNumericValue: outputs.kurtosis,
      unit: '',
      decimals: 1,
      status: outputs.kurtosis > 6 ? 'critical' : outputs.kurtosis > 4.5 ? 'warning' : 'safe',
      helperText: 'Baseline Gaussian: 3.0',
    },
    {
      id: 'kappa',
      label: 'Lube Film Ratio (κ)',
      value: outputs.lubricationKappaRatio,
      rawNumericValue: outputs.lubricationKappaRatio,
      unit: 'x',
      decimals: 2,
      status: outputs.lubricationKappaRatio < 0.4 ? 'critical' : outputs.lubricationKappaRatio < 1.0 ? 'warning' : 'safe',
      helperText: 'ISO 281 minimum 1.0x',
    },
    {
      id: 'l10h',
      label: 'Remaining Life L10h',
      value: Math.round(outputs.l10hFatigueHoursRemaining),
      rawNumericValue: outputs.l10hFatigueHoursRemaining,
      unit: 'hrs',
      decimals: 0,
      status: 'neutral',
      helperText: `≈ ${Math.round(outputs.l10hFatigueHoursRemaining / 24)} days`,
    },
    {
      id: 'bpfo',
      label: 'BPFO (Outer Race)',
      value: outputs.frequencies.bpfoHz,
      rawNumericValue: outputs.frequencies.bpfoHz,
      unit: 'Hz',
      decimals: 1,
      status: inputs.faultLocation === 'outer_race' ? 'warning' : 'neutral',
      helperText: `${outputs.frequencies.bpfoOrder}X order`,
    },
    {
      id: 'bpfi',
      label: 'BPFI (Inner Race)',
      value: outputs.frequencies.bpfiHz,
      rawNumericValue: outputs.frequencies.bpfiHz,
      unit: 'Hz',
      decimals: 1,
      status: inputs.faultLocation === 'inner_race' ? 'warning' : 'neutral',
      helperText: `${outputs.frequencies.bpfiOrder}X order`,
    },
  ];

  const gauges: ResultGauge[] = [
    {
      id: 'vibGauge',
      title: 'ISO 10816 Vibration',
      value: outputs.overallVelocityRmsMmS,
      min: 0,
      max: 12,
      unit: 'mm/s',
      warningThreshold: 2.8,
      criticalThreshold: 4.5,
      targetValue: 1.8,
      targetLabel: 'Zone A',
    },
    {
      id: 'kappaGauge',
      title: 'Lubrication Kappa (κ)',
      value: outputs.lubricationKappaRatio,
      min: 0,
      max: 3.5,
      unit: 'x',
      warningThreshold: 1.0,
      criticalThreshold: 0.4,
      inverseZones: true,
      targetValue: 1.5,
      targetLabel: 'Min Rec',
    },
  ];

  return (
    <ResultsPanel
      status={outputs.status}
      simulatorId="bearing"
      inputs={inputs}
      outputs={outputs}
      unitSystem={unitSystem}
      mainResult={{
        label: 'Overall Vibration ISO 10816',
        value: outputs.overallVelocityRmsMmS,
        rawNumericValue: outputs.overallVelocityRmsMmS,
        unit: 'mm/s RMS',
        decimals: 2,
        status: outputs.status.level,
      }}
      liveInsight={outputs.stageDescription || outputs.status.message}
      kpis={kpis}
      gauges={gauges}
      recommendedAction={outputs.status.recommendations?.[0] || 'Inspect lubrication and evaluate defect harmonic growth in Spectral Lab.'}
      trendLabel="ISO Vibration Trend (mm/s)"
    />
  );
};
