import React from 'react';
import { GearboxInputs, GearboxOutputs } from '../../types/gearbox';
import { UnitSystem } from '../../types/common';
import { ResultsPanel, ResultKPI, ResultGauge } from '../../components/Shared/ResultsPanel';

interface GearboxResultsProps {
  inputs: GearboxInputs;
  outputs: GearboxOutputs;
  unitSystem?: UnitSystem;
}

export const GearboxResults: React.FC<GearboxResultsProps> = ({
  inputs,
  outputs,
  unitSystem = 'metric',
}) => {
  const {
    status,
    bendingStressMpa,
    allowableBendingStressMpa,
    bendingSafetyFactorSF,
    contactStressMpa,
    allowableContactStressMpa,
    contactSafetyFactorSH,
    gearMeshFrequencyHz,
    huntingToothFrequencyHz,
    commonFactorsGcd,
    ehlFilmThicknessUm,
    specificFilmThicknessLambda,
    overallVibrationMmSRms,
    iso10816Zone,
    primaryDiagnosis,
    recommendations,
  } = outputs;

  const kpis: ResultKPI[] = [
    {
      id: 'sf',
      label: 'AGMA Bending SF',
      value: bendingSafetyFactorSF,
      rawNumericValue: bendingSafetyFactorSF,
      unit: '',
      decimals: 2,
      status: bendingSafetyFactorSF < 1.15 ? 'critical' : bendingSafetyFactorSF < 1.4 ? 'warning' : 'safe',
      helperText: `${bendingStressMpa} / ${allowableBendingStressMpa} MPa`,
    },
    {
      id: 'sh',
      label: 'AGMA Pitting SH',
      value: contactSafetyFactorSH,
      rawNumericValue: contactSafetyFactorSH,
      unit: '',
      decimals: 2,
      status: contactSafetyFactorSH < 1.05 ? 'critical' : contactSafetyFactorSH < 1.25 ? 'warning' : 'safe',
      helperText: `${contactStressMpa} / ${allowableContactStressMpa} MPa`,
    },
    {
      id: 'gmf',
      label: 'Gear Mesh (GMF)',
      value: gearMeshFrequencyHz,
      rawNumericValue: gearMeshFrequencyHz,
      unit: 'Hz',
      decimals: 1,
      status: 'neutral',
      helperText: `${inputs.pinionTeeth}T × ${inputs.pinionSpeedRpm} RPM`,
    },
    {
      id: 'lambda',
      label: 'EHL Film Lambda (λ)',
      value: specificFilmThicknessLambda,
      rawNumericValue: specificFilmThicknessLambda,
      unit: '',
      decimals: 2,
      status: specificFilmThicknessLambda < 1.0 ? 'critical' : specificFilmThicknessLambda < 2.0 ? 'warning' : 'safe',
      helperText: `h_min = ${ehlFilmThicknessUm} µm`,
    },
    {
      id: 'vib',
      label: 'ISO 10816 Vibration',
      value: overallVibrationMmSRms,
      rawNumericValue: overallVibrationMmSRms,
      unit: 'mm/s RMS',
      decimals: 2,
      status: overallVibrationMmSRms > 4.5 ? 'critical' : overallVibrationMmSRms > 2.8 ? 'warning' : 'safe',
      helperText: `Zone ${iso10816Zone}`,
    },
    {
      id: 'htf',
      label: 'Hunting Tooth (f_HT)',
      value: huntingToothFrequencyHz,
      rawNumericValue: huntingToothFrequencyHz,
      unit: 'Hz',
      decimals: 2,
      status: commonFactorsGcd > 1 ? 'warning' : 'safe',
      helperText: commonFactorsGcd === 1 ? 'Mutually prime (Optimal)' : `GCD = ${commonFactorsGcd} (Uneven wear)`,
    },
  ];

  const gauges: ResultGauge[] = [
    {
      id: 'sfGauge',
      title: 'Bending Margin (SF)',
      value: bendingSafetyFactorSF,
      min: 0.5,
      max: 2.5,
      unit: '',
      warningThreshold: 1.4,
      criticalThreshold: 1.15,
      inverseZones: true,
      targetValue: 1.4,
      targetLabel: 'AGMA Min',
    },
    {
      id: 'shGauge',
      title: 'Pitting Margin (SH)',
      value: contactSafetyFactorSH,
      min: 0.5,
      max: 2.2,
      unit: '',
      warningThreshold: 1.25,
      criticalThreshold: 1.05,
      inverseZones: true,
      targetValue: 1.25,
      targetLabel: 'AGMA Min',
    },
  ];

  return (
    <ResultsPanel
      status={status}
      simulatorId="gearbox"
      inputs={inputs}
      outputs={outputs}
      unitSystem={unitSystem}
      mainResult={{
        label: 'AGMA Bending Safety Factor (SF)',
        value: bendingSafetyFactorSF,
        rawNumericValue: bendingSafetyFactorSF,
        unit: '',
        decimals: 2,
        status: status.level,
      }}
      liveInsight={primaryDiagnosis || status.message}
      kpis={kpis}
      gauges={gauges}
      recommendedAction={recommendations?.[0] || 'Maintain torque and lubricant viscosity within AGMA rating limits.'}
      trendLabel="Bending Safety Factor (SF)"
    />
  );
};
