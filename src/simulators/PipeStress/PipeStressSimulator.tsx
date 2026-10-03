import React from 'react';
import { PipeInputs, PipeOutputs } from '../../types/pipe';
import { UnitSystem } from '../../types/common';
import { calculatePipeStress } from '../../utils/pipeCalculations';
import { PIPE_SCENARIOS } from '../../engine/scenarios';
import { PipeStressVisualizer } from './PipeStressVisualizer';
import { PipeStressCharts } from './PipeStressCharts';
import { PipeStressControls } from './PipeStressControls';
import { PipeStressResults } from './PipeStressResults';
import { SimulatorWorkbench } from '../../components/Workbench';

interface PipeStressSimulatorProps {
  unitSystem: UnitSystem;
  onAuditRequested: (trail: any) => void;
  onReportRequested: (data: any) => void;
  onOpenInfo?: () => void;
}

const buildPipeReport = (inputs: PipeInputs, outputs: PipeOutputs, currentUnit: UnitSystem) => ({
  title: 'ASME B31.3 Piping Flexibility & Thermal Expansion Stress',
  subtitle: 'Thermal Growth, Combined von Mises Stress, and Anchor Thrust Reactions',
  standards: ['ASME B31.3:2022 §319', 'ASME B36.10M', 'Kellogg Flexibility'],
  status: outputs.status || { level: 'safe' as const, label: 'NOMINAL' },
  auditTrail: outputs.auditTrail || [],
  inputSummary: [
    { label: 'Pipe Material', value: inputs.customMaterialName || inputs.materialType },
    { label: 'Pipe Geometry', value: `${inputs.pipeLengthM} m | OD ${inputs.pipeOuterDiameterMm} mm (t=${inputs.pipeWallThicknessMm} mm)` },
    { label: 'Operating / Install Temp', value: `${inputs.operatingTempC}°C / ${inputs.installationTempC}°C` },
    { label: 'Operating Pressure', value: `${inputs.operatingPressureBar} bar` },
    { label: 'Anchor Condition', value: inputs.anchorCondition.replace(/_/g, ' ') },
  ],
  keyResults: [
    { label: 'Thermal Growth ΔL', value: `${outputs.thermalExpansionMm?.toFixed(1)} mm` },
    { label: 'Direct Axial Stress σ_axial', value: `${outputs.axialStressMPa?.toFixed(1)} MPa`, status: outputs.status?.level },
    { label: 'ASME Stress Ratio', value: `${outputs.stressRatioPercent?.toFixed(0)}%`, status: outputs.status?.level },
    { label: 'Anchor Thrust F_axial', value: `${outputs.axialForceKN?.toFixed(1)} kN` },
  ],
});

export const PipeStressSimulator: React.FC<PipeStressSimulatorProps> = ({
  unitSystem,
  onAuditRequested,
  onReportRequested,
  onOpenInfo,
}) => {
  return (
    <SimulatorWorkbench<PipeInputs, PipeOutputs>
      title="Thermal Expansion & Pipe Stress"
      subtitle="ASME B31.3"
      scenarios={PIPE_SCENARIOS}
      defaultInputs={PIPE_SCENARIOS[0].inputs}
      calculateFn={calculatePipeStress}
      VisualComponent={PipeStressVisualizer}
      unitSystem={unitSystem}
      onOpenInfo={onOpenInfo}
      disclaimerText="ASME B31.3 Process Piping Standard"
      chartTabLabel="Stress vs Temp Curve"
      visualTabLabel="Digital Twin"
      simulatorType="pipe-stress"
      simulatorId="pipe"
      onAuditRequested={onAuditRequested}
      onReportRequested={onReportRequested}
      buildReportData={buildPipeReport}
      customControls={({ inputs, onChange, unitSystem: currentUnit, scenarios: s, activeScenarioId: aId, onSelectScenario: onSel }) => (
        <PipeStressControls
          inputs={inputs}
          onChange={onChange}
          unitSystem={currentUnit}
          scenarios={s}
          activeScenarioId={aId}
          onSelectScenario={onSel}
        />
      )}
      customResults={({ outputs, inputs, unitSystem: currentUnit }) => (
        <PipeStressResults
          outputs={outputs}
          inputs={inputs}
          unitSystem={currentUnit}
        />
      )}
      chartComponent={({ inputs, outputs, unitSystem: currentUnit }) => (
        <div className="w-full h-full">
          <PipeStressCharts
            inputs={inputs}
            outputs={outputs}
            unitSystem={currentUnit}
          />
        </div>
      )}
    />
  );
};
