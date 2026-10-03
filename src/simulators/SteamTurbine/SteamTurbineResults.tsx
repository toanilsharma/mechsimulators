import React from 'react';
import { SteamTurbineInputs, SteamTurbineOutputs } from '../../types/steamTurbine';
import { UnitSystem } from '../../types/common';
import { ResultsPanel, ResultKPI, ResultGauge } from '../../components/Shared/ResultsPanel';

interface SteamTurbineResultsProps {
  inputs: SteamTurbineInputs;
  outputs: SteamTurbineOutputs;
  unitSystem?: UnitSystem;
}

export const SteamTurbineResults: React.FC<SteamTurbineResultsProps> = ({
  inputs,
  outputs,
  unitSystem = 'metric',
}) => {
  const isMoistureCritical = outputs.exhaustMoisturePercent > outputs.maxAllowableMoisturePercent;
  const isVibCritical = outputs.rotor1XUnbalanceVibrationUm > outputs.api612AllowableVibrationUm;

  const kpis: ResultKPI[] = [
    {
      id: 'eff',
      label: 'Isentropic Efficiency (η_s)',
      value: outputs.isentropicEfficiencyPercent,
      rawNumericValue: outputs.isentropicEfficiencyPercent,
      unit: '%',
      decimals: 1,
      status: outputs.isentropicEfficiencyPercent < 65 ? 'critical' : outputs.isentropicEfficiencyPercent < 75 ? 'warning' : 'safe',
      helperText: 'ASME PTC 6 Rankine expansion',
    },
    {
      id: 'moisture',
      label: 'Exhaust Moisture (y)',
      value: outputs.exhaustMoisturePercent,
      rawNumericValue: outputs.exhaustMoisturePercent,
      unit: '%',
      decimals: 1,
      status: isMoistureCritical ? 'critical' : outputs.exhaustMoisturePercent > 10 ? 'warning' : 'safe',
      helperText: `API 612 limit: ${outputs.maxAllowableMoisturePercent}%`,
    },
    {
      id: 'dryness',
      label: 'Exhaust Dryness (x)',
      value: outputs.exhaustDrynessFraction,
      rawNumericValue: outputs.exhaustDrynessFraction,
      unit: '',
      decimals: 3,
      status: outputs.exhaustDrynessFraction < 0.88 ? 'critical' : outputs.exhaustDrynessFraction < 0.92 ? 'warning' : 'safe',
      helperText: outputs.wilsonLineCrossed ? 'Wilson line crossed' : 'Superheated/Dry',
    },
    {
      id: 'power',
      label: 'Internal Shaft Power',
      value: outputs.powerOutputKw,
      rawNumericValue: outputs.powerOutputKw,
      unit: 'kW',
      decimals: 0,
      status: 'neutral',
      helperText: `${(outputs.powerOutputKw / 1000).toFixed(2)} MW gross`,
    },
    {
      id: 'asr',
      label: 'Actual Steam Rate (ASR)',
      value: outputs.actualSteamRateAsrKgKwh,
      rawNumericValue: outputs.actualSteamRateAsrKgKwh,
      unit: 'kg/kWh',
      decimals: 2,
      status: 'neutral',
      helperText: `TSR: ${outputs.theoreticalSteamRateTsrKgKwh} kg/kWh`,
    },
    {
      id: 'vib',
      label: 'API 612 Rotor Vibration',
      value: outputs.rotor1XUnbalanceVibrationUm,
      rawNumericValue: outputs.rotor1XUnbalanceVibrationUm,
      unit: 'µm pk-pk',
      decimals: 1,
      status: isVibCritical ? 'critical' : 'safe',
      helperText: `Allowable: ${outputs.api612AllowableVibrationUm.toFixed(1)} µm`,
    },
  ];

  const gauges: ResultGauge[] = [
    {
      id: 'effGauge',
      title: 'Isentropic Efficiency (η_s)',
      value: outputs.isentropicEfficiencyPercent,
      min: 40,
      max: 100,
      unit: '%',
      warningThreshold: 72,
      criticalThreshold: 60,
      inverseZones: true,
      targetValue: 80,
      targetLabel: 'Design',
    },
    {
      id: 'moistGauge',
      title: 'Exhaust Moisture (y)',
      value: outputs.exhaustMoisturePercent,
      min: 0,
      max: 20,
      unit: '%',
      warningThreshold: 10,
      criticalThreshold: outputs.maxAllowableMoisturePercent,
      targetValue: 6,
      targetLabel: 'API Max',
    },
  ];

  return (
    <ResultsPanel
      status={outputs.status}
      simulatorId="turbine"
      inputs={inputs}
      outputs={outputs}
      unitSystem={unitSystem}
      mainResult={{
        label: 'Isentropic Expansion Efficiency',
        value: outputs.isentropicEfficiencyPercent,
        rawNumericValue: outputs.isentropicEfficiencyPercent,
        unit: '%',
        decimals: 1,
        status: outputs.status.level,
      }}
      liveInsight={outputs.status.message || 'ASME PTC 6 thermodynamic expansion cycle active.'}
      kpis={kpis}
      gauges={gauges}
      recommendedAction={outputs.status.recommendations?.[0] || 'Monitor throttle valve pressure drops and ensure exhaust moisture stays below API 612 limit.'}
      trendLabel="Isentropic Efficiency Trend (%)"
    />
  );
};
