import React from 'react';
import { BearingFaultInputs, BearingFaultOutputs } from '../../types/bearing';
import { BEARING_SCENARIOS } from '../../utils/bearingPresets';
import { calculateBearingFaults } from '../../utils/bearingCalculations';
import { SimulatorWorkbench } from '../../components/Workbench/SimulatorWorkbench';
import { BearingVisualizer } from './BearingVisualizer';
import { BearingCharts } from './BearingCharts';
import { BearingControls } from './BearingControls';
import { BearingResults } from './BearingResults';
import { UnitSystem } from '../../types/common';
import { STANDARD_BEARINGS } from '../../utils/spectralCalculations';

interface BearingSimulatorProps {
  initialInputs?: Partial<BearingFaultInputs>;
  onReportRequested?: (data: any) => void;
  onOpenInfo?: () => void;
}

const buildBearingReport = (
  inputs: BearingFaultInputs,
  outputs: BearingFaultOutputs,
  currentUnit: UnitSystem
) => {
  const geom = STANDARD_BEARINGS.find((b) => b.id === inputs.bearingId) || STANDARD_BEARINGS[0];

  return {
    title: 'Rolling Element Bearing Fault Diagnostics & Life Assessment',
    subtitle: 'Harris Kinematic Equations, ISO 281 L10h Rating Life, and ISO 15243 Degradation Stages',
    standards: ['ISO 281 (Bearing Dynamic Rating Life)', 'ISO 15243 (Bearing Damage Modes)', 'Harris Rolling Bearing Analysis', 'ISO 10816-3'],
    status: outputs.status,
    auditTrail: outputs.auditTrail,
    inputSummary: [
      { label: 'Bearing Model', value: geom.name },
      { label: 'Shaft Speed', value: `${inputs.shaftSpeedRpm.toLocaleString()} RPM` },
      { label: 'Radial Load Fr', value: `${inputs.radialLoadKn} kN` },
      { label: 'Axial Load Fa', value: `${inputs.axialLoadKn} kN` },
      { label: 'Fault Location', value: inputs.faultLocation.replace('_', ' ').toUpperCase() },
      { label: 'Fault Severity', value: `${inputs.faultSeverityPercent}% (${inputs.defectSizeMicrons} µm)` },
    ],
    keyResults: [
      { label: 'Fault Stage', value: outputs.stage.toUpperCase(), status: (outputs.status.level as 'safe' | 'warning' | 'critical') },
      { label: 'Dominant Defect Peak', value: outputs.dominantHarmonicLabel, status: (outputs.status.level as 'safe' | 'warning' | 'critical') },
      { label: 'Overall Vibration', value: `${outputs.overallVelocityRmsMmS} mm/s RMS (Zone ${outputs.iso10816Zone})`, status: (outputs.status.level as 'safe' | 'warning' | 'critical') },
      { label: 'Statistical Kurtosis', value: `${outputs.kurtosis} (Base ~3.0)`, status: (outputs.kurtosis > 4.5 ? 'warning' : 'safe') as 'safe' | 'warning' | 'critical' },
      { label: 'Lube Kappa (κ)', value: `${outputs.lubricationKappaRatio}x`, status: (outputs.lubricationKappaRatio < 0.4 ? 'critical' : 'safe') as 'safe' | 'warning' | 'critical' },
      { label: 'Remaining Fatigue Life', value: `${Math.round(outputs.l10hFatigueHoursRemaining).toLocaleString()} hrs` },
    ],
  };
};

export const BearingSimulator: React.FC<BearingSimulatorProps> = ({
  initialInputs,
  onReportRequested,
  onOpenInfo,
}) => {
  const baseInputs = BEARING_SCENARIOS[0].inputs;
  const mergedInputs: BearingFaultInputs = { ...baseInputs, ...initialInputs };

  return (
    <SimulatorWorkbench<BearingFaultInputs, BearingFaultOutputs>
      title="Rolling Element Bearing Fault Simulator"
      subtitle="Kinematic Frequencies (BPFO/BPFI/BSF/FTF), 4-Stage Degradation, and ISO 281 L10h Life"
      defaultInputs={mergedInputs}
      calculateFn={calculateBearingFaults}
      VisualComponent={BearingVisualizer}
      chartComponent={(props) => (
        <BearingCharts inputs={props.inputs} outputs={props.outputs} unitSystem={props.unitSystem} />
      )}
      chartTabLabel="FFT Spectrum & Waveform"
      visualTabLabel="Kinematic Bearing Twin"
      simulatorType="bearing-fault"
      simulatorId="bearing"
      scenarios={BEARING_SCENARIOS}
      customControls={({ inputs, onChange }) => (
        <BearingControls
          inputs={inputs}
          onChange={(field, val) => onChange({ [field]: val } as any)}
        />
      )}
      customResults={({ inputs, outputs, unitSystem }) => (
        <BearingResults inputs={inputs} outputs={outputs} unitSystem={unitSystem} />
      )}
      buildReportData={buildBearingReport}
      onReportRequested={onReportRequested}
      onOpenInfo={onOpenInfo}
    />
  );
};
