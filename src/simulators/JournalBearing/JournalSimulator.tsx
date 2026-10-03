import React from 'react';
import { JournalBearingInputs, JournalBearingOutputs } from '../../types/journalBearing';
import { JOURNAL_BEARING_SCENARIOS } from '../../utils/journalBearingPresets';
import { calculateJournalBearing } from '../../utils/journalBearingCalculations';
import { SimulatorWorkbench } from '../../components/Workbench/SimulatorWorkbench';
import { JournalVisualizer } from './JournalVisualizer';
import { JournalCharts } from './JournalCharts';
import { JournalControls } from './JournalControls';
import { JournalResults } from './JournalResults';
import { UnitSystem } from '../../types/common';

interface JournalSimulatorProps {
  initialInputs?: Partial<JournalBearingInputs>;
  onReportRequested?: (data: any) => void;
  onOpenInfo?: () => void;
  onAuditRequested?: () => void;
  unitSystem?: UnitSystem;
}

const buildJournalReport = (
  inputs: JournalBearingInputs,
  outputs: JournalBearingOutputs,
  currentUnit: UnitSystem
) => {
  return {
    title: 'Hydrodynamic Fluid Film Bearing & Rotor Dynamics Audit',
    subtitle: 'Reynolds Lubrication, Sommerfeld Number, Cross-Coupled Stiffness, and API 684/670 Stability Analysis',
    standards: [
      'API 684 2nd Edition (Rotor Dynamics Tutorial)',
      'API 670 5th Edition (Machinery Protection Systems)',
      'ISO 7919-2 (Shaft Relative Vibration Evaluation)',
    ],
    status: outputs.status,
    auditTrail: outputs.auditTrail,
    inputSummary: [
      { label: 'Bearing Type', value: inputs.bearingType.replace(/_/g, ' ').toUpperCase() },
      { label: 'Journal Diameter', value: `${inputs.journalDiameterMm} mm (Length: ${inputs.bearingLengthMm} mm)` },
      { label: 'Radial Clearance', value: `${inputs.radialClearanceUm} µm` },
      { label: 'Shaft Speed', value: `${inputs.shaftSpeedRpm.toLocaleString()} RPM` },
      { label: 'Static Load', value: `${inputs.staticRadialLoadKn} kN` },
      { label: 'Lube Oil Grade', value: `${inputs.oilGrade} @ ${inputs.oilSupplyTempC}°C` },
    ],
    keyResults: [
      {
        label: 'Dynamic State',
        value: outputs.instabilityMode.replace(/_/g, ' ').toUpperCase(),
        status: outputs.status.level as 'safe' | 'warning' | 'critical',
      },
      { label: 'Sommerfeld Number', value: `${outputs.sommerfeldNumber}` },
      {
        label: 'Min Film Thickness',
        value: `${outputs.minimumFilmThicknessUm} µm`,
        status: (outputs.minimumFilmThicknessUm < 15 ? 'warning' : 'safe') as 'safe' | 'warning' | 'critical',
      },
      {
        label: 'Total Shaft Vib',
        value: `${outputs.totalShaftDisplacementUmPkPk} µm pk-pk (Alarm: ${outputs.api670AlarmLimitUmPkPk} µm)`,
        status: (outputs.totalShaftDisplacementUmPkPk > outputs.api670AlarmLimitUmPkPk ? 'critical' : 'safe') as 'safe' | 'warning' | 'critical',
      },
      {
        label: 'API 684 Stability Margin',
        value: `${outputs.stabilityMarginRatio}x (Log Dec δ = ${outputs.logarithmicDecrement})`,
        status: (outputs.stabilityMarginRatio < 1.2 ? 'warning' : 'safe') as 'safe' | 'warning' | 'critical',
      },
      { label: 'Viscous Power Loss', value: `${outputs.powerLossKw} kW (Flow: ${outputs.sideLeakageFlowLpm} L/min)` },
    ],
  };
};

export const JournalSimulator: React.FC<JournalSimulatorProps> = ({
  initialInputs,
  onReportRequested,
  onOpenInfo,
  onAuditRequested,
  unitSystem = 'metric',
}) => {
  const baseInputs = JOURNAL_BEARING_SCENARIOS[0].inputs;
  const mergedInputs: JournalBearingInputs = { ...baseInputs, ...initialInputs };

  return (
    <SimulatorWorkbench<JournalBearingInputs, JournalBearingOutputs>
      title="Hydrodynamic Journal Bearing Simulator"
      subtitle="Reynolds Lubrication, Sommerfeld Locus, Subsynchronous Oil Whirl & Whip, and API 684/670 Dynamics"
      defaultInputs={mergedInputs}
      calculateFn={calculateJournalBearing}
      VisualComponent={JournalVisualizer}
      chartComponent={(props) => (
        <JournalCharts inputs={props.inputs} outputs={props.outputs} unitSystem={props.unitSystem} />
      )}
      chartTabLabel="Proximity Orbits & Spectrum"
      visualTabLabel="Hydrodynamic Film Twin"
      simulatorType="journal-bearing"
      simulatorId="journal"
      scenarios={JOURNAL_BEARING_SCENARIOS}
      customControls={({ inputs, onChange }) => (
        <JournalControls
          inputs={inputs}
          onChange={(field, val) => onChange({ [field]: val } as any)}
        />
      )}
      customResults={({ inputs, outputs, unitSystem: uSys }) => (
        <JournalResults inputs={inputs} outputs={outputs} unitSystem={uSys} />
      )}
      buildReportData={buildJournalReport}
      onReportRequested={onReportRequested}
      onOpenInfo={onOpenInfo}
    />
  );
};
