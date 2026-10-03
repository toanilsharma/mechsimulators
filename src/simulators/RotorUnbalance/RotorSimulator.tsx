import React from 'react';
import { RotorInputs, RotorOutputs } from '../../types/rotor';
import { UnitSystem } from '../../types/common';
import { calculateRotor } from '../../utils/rotorCalculations';
import { ROTOR_SCENARIOS } from '../../engine/scenarios';
import { RotorVisualizer } from './RotorVisualizer';
import { RotorCharts } from './RotorCharts';
import { RotorControls } from './RotorControls';
import { RotorResults } from './RotorResults';
import { SimulatorWorkbench } from '../../components/Workbench';

interface RotorSimulatorProps {
  unitSystem: UnitSystem;
  onAuditRequested: (trail: any) => void;
  onReportRequested: (data: any) => void;
  onOpenInfo?: () => void;
}

const buildRotorReport = (inputs: RotorInputs, outputs: RotorOutputs, currentUnit: UnitSystem) => ({
  title: 'Rotor Dynamic Balance & ISO 281 Bearing Rating Life',
  subtitle: 'ISO 1940-1 Balancing Grade & ISO 10816-3 Vibration Severity Assessment',
  standards: [`ISO 1940-1:2003 Grade G${inputs.balanceGrade}`, 'ISO 281:2007 Modified Rating Life', 'ISO 10816-3 Class II/III'],
  status: outputs.status || { level: 'safe' as const, label: 'NOMINAL' },
  auditTrail: outputs.auditTrail || [],
  inputSummary: [
    { label: 'Rotor Assembly Mass', value: currentUnit === 'metric' ? `${inputs.rotorMassKg} kg` : `${(inputs.rotorMassKg * 2.20462).toFixed(1)} lb` },
    { label: 'Operating Speed', value: `${inputs.operatingRpm} RPM` },
    { label: 'ISO Balance Quality', value: `Grade G${inputs.balanceGrade}` },
    { label: 'Bearing Type', value: `${inputs.bearingModelId}` },
    { label: 'Static Radial Load', value: `${inputs.staticRadialLoadN} N` },
  ],
  keyResults: [
    { label: 'Permissible Unbalance U_per', value: `${outputs.iso1940PermissibleUnbalanceGmm?.toFixed(0)} g·mm`, status: 'safe' as const },
    { label: 'Actual Residual Unbalance', value: `${outputs.actualUnbalanceGmm?.toFixed(0)} g·mm`, status: outputs.status?.level },
    { label: '1X Centrifugal Unbalance Force', value: `${outputs.dynamicUnbalanceForceN?.toFixed(0)} N` },
    { label: 'ISO 10816 Vibration Severity', value: `Zone ${outputs.iso10816Zone ?? 'A'} (${outputs.vibrationVelocityRmsMmS?.toFixed(2)} mm/s RMS)`, status: outputs.status?.level },
    { label: 'ISO 281 Modified Life L10mh', value: `${Math.round(outputs.modifiedLifeL10mhHours ?? 0).toLocaleString()} hrs (~${((outputs.modifiedLifeL10mhHours ?? 0) / 8760).toFixed(0)} yrs)`, status: outputs.status?.level },
  ],
});

export const RotorSimulator: React.FC<RotorSimulatorProps> = ({
  unitSystem,
  onAuditRequested,
  onReportRequested,
  onOpenInfo,
}) => {
  return (
    <SimulatorWorkbench<RotorInputs, RotorOutputs>
      title="Rotor Dynamics & Bearing Life"
      subtitle="ISO 1940 / ISO 281"
      scenarios={ROTOR_SCENARIOS}
      defaultInputs={ROTOR_SCENARIOS[0].inputs}
      calculateFn={calculateRotor}
      VisualComponent={RotorVisualizer}
      unitSystem={unitSystem}
      onOpenInfo={onOpenInfo}
      disclaimerText="ISO 1940 & ISO 281 Bearing Life Standard"
      chartTabLabel="Vibration Spectrum"
      visualTabLabel="Digital Twin"
      simulatorType="rotor-unbalance"
      simulatorId="rotor"
      onAuditRequested={onAuditRequested}
      onReportRequested={onReportRequested}
      buildReportData={buildRotorReport}
      customControls={({ inputs, onChange, unitSystem: currentUnit, scenarios: s, activeScenarioId: aId, onSelectScenario: onSel }) => (
        <RotorControls
          inputs={inputs}
          onChange={onChange}
          unitSystem={currentUnit}
          scenarios={s}
          activeScenarioId={aId}
          onSelectScenario={onSel}
        />
      )}
      customResults={({ outputs, inputs, unitSystem: currentUnit }) => (
        <RotorResults
          outputs={outputs}
          inputs={inputs}
          unitSystem={currentUnit}
        />
      )}
      chartComponent={({ inputs, outputs, unitSystem: currentUnit }) => (
        <div className="w-full h-full">
          <RotorCharts
            inputs={inputs}
            outputs={outputs}
            unitSystem={currentUnit}
          />
        </div>
      )}
    />
  );
};
