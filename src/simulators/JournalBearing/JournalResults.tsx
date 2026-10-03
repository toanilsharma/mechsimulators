import React from 'react';
import { JournalBearingInputs, JournalBearingOutputs } from '../../types/journalBearing';
import { UnitSystem } from '../../types/common';
import { ResultsPanel, ResultKPI, ResultGauge } from '../../components/Shared/ResultsPanel';

interface JournalResultsProps {
  inputs: JournalBearingInputs;
  outputs: JournalBearingOutputs;
  unitSystem?: UnitSystem;
}

export const JournalResults: React.FC<JournalResultsProps> = ({
  inputs,
  outputs,
  unitSystem = 'metric',
}) => {
  const {
    sommerfeldNumber,
    eccentricityRatio,
    minimumFilmThicknessUm,
    effectiveFilmTempC,
    stabilityMarginRatio,
    totalShaftDisplacementUmPkPk,
    api670AlarmLimitUmPkPk,
    api670TripLimitUmPkPk,
    status,
    recommendations,
  } = outputs;

  const isVibCritical = totalShaftDisplacementUmPkPk >= api670TripLimitUmPkPk;
  const isVibWarning = totalShaftDisplacementUmPkPk >= api670AlarmLimitUmPkPk;

  const kpis: ResultKPI[] = [
    {
      id: 'hmin',
      label: 'Min Film Thickness (h_min)',
      value: minimumFilmThicknessUm,
      rawNumericValue: minimumFilmThicknessUm,
      unit: 'µm',
      decimals: 1,
      status: minimumFilmThicknessUm < 12 ? 'critical' : minimumFilmThicknessUm < 20 ? 'warning' : 'safe',
      helperText: 'API 670 minimum 15-20 µm',
    },
    {
      id: 'sommerfeld',
      label: 'Sommerfeld Number (S)',
      value: sommerfeldNumber,
      rawNumericValue: sommerfeldNumber,
      unit: '',
      decimals: 3,
      status: sommerfeldNumber < 0.08 ? 'warning' : 'safe',
      helperText: 'Hydrodynamic load parameter',
    },
    {
      id: 'eccentricity',
      label: 'Eccentricity Ratio (ε)',
      value: eccentricityRatio,
      rawNumericValue: eccentricityRatio,
      unit: '',
      decimals: 2,
      status: eccentricityRatio > 0.85 ? 'critical' : eccentricityRatio > 0.75 ? 'warning' : 'safe',
      helperText: 'e / c journal offset',
    },
    {
      id: 'displacement',
      label: 'Shaft Vibration (API 670)',
      value: totalShaftDisplacementUmPkPk,
      rawNumericValue: totalShaftDisplacementUmPkPk,
      unit: 'µm pk-pk',
      decimals: 1,
      status: isVibCritical ? 'critical' : isVibWarning ? 'warning' : 'safe',
      helperText: `Alarm: ${api670AlarmLimitUmPkPk} | Trip: ${api670TripLimitUmPkPk}`,
    },
    {
      id: 'filmTemp',
      label: 'Babbitt / Film Temp',
      value: effectiveFilmTempC,
      rawNumericValue: effectiveFilmTempC,
      unit: '°C',
      decimals: 1,
      status: effectiveFilmTempC > 115 ? 'critical' : effectiveFilmTempC > 100 ? 'warning' : 'safe',
      helperText: 'API 670 max 115°C',
    },
    {
      id: 'stability',
      label: 'Whirl Stability Margin',
      value: stabilityMarginRatio,
      rawNumericValue: stabilityMarginRatio,
      unit: 'x',
      decimals: 2,
      status: stabilityMarginRatio < 1.0 ? 'critical' : stabilityMarginRatio < 1.2 ? 'warning' : 'safe',
      helperText: 'Speed onset ratio',
    },
  ];

  const gauges: ResultGauge[] = [
    {
      id: 'filmGauge',
      title: 'Min Film (h_min)',
      value: minimumFilmThicknessUm,
      min: 0,
      max: 60,
      unit: 'µm',
      warningThreshold: 20,
      criticalThreshold: 12,
      inverseZones: true,
      targetValue: 25,
      targetLabel: 'API Min',
    },
    {
      id: 'vibGauge',
      title: 'Shaft Vibration',
      value: totalShaftDisplacementUmPkPk,
      min: 0,
      max: Math.max(api670TripLimitUmPkPk * 1.3, 100),
      unit: 'µm',
      warningThreshold: api670AlarmLimitUmPkPk,
      criticalThreshold: api670TripLimitUmPkPk,
      targetValue: api670AlarmLimitUmPkPk * 0.7,
      targetLabel: 'Normal',
    },
  ];

  return (
    <ResultsPanel
      status={status}
      simulatorId="journal"
      inputs={inputs}
      outputs={outputs}
      unitSystem={unitSystem}
      mainResult={{
        label: 'Min Oil Film Thickness (h_min)',
        value: minimumFilmThicknessUm,
        rawNumericValue: minimumFilmThicknessUm,
        unit: 'µm',
        decimals: 1,
        status: status.level,
      }}
      liveInsight={status.message || 'Hydrodynamic oil wedge operating in equilibrium.'}
      kpis={kpis}
      gauges={gauges}
      recommendedAction={recommendations?.[0] || 'Maintain oil inlet temperature and viscosity to prevent hydrodynamic instability.'}
      trendLabel="Oil Film Thickness Trend (µm)"
    />
  );
};
