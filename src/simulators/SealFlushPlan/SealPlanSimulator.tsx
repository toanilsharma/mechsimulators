import React from 'react';
import { SealInputs, SealOutputs } from '../../types/seal';
import { UnitSystem } from '../../types/common';
import { calculateSealPlan } from '../../utils/sealCalculations';
import { SEAL_SCENARIOS } from '../../engine/scenarios';
import { SealPlanVisualizer } from './SealPlanVisualizer';
import { SealPlanCharts } from './SealPlanCharts';
import { SealPlanControls } from './SealPlanControls';
import { SealPlanResults } from './SealPlanResults';
import { SimulatorWorkbench } from '../../components/Workbench';

interface SealPlanSimulatorProps {
  unitSystem: UnitSystem;
  onAuditRequested: (trail: any) => void;
  onReportRequested: (data: any) => void;
  onOpenInfo?: () => void;
}

const buildSealReport = (inputs: SealInputs, outputs: SealOutputs, currentUnit: UnitSystem) => ({
  title: 'API 682 Mechanical Seal Flush Plan & Thermal Hydraulics',
  subtitle: 'Frictional Face Heat Generation, Flush Orifice Flow, and Vapor Suppression Margin',
  standards: ['API 682 4th Edition Annex C', `API 682 ${inputs.planId.toUpperCase().replace('_', ' ')} Standard`, 'ISO 21049'],
  status: outputs.status || { level: 'safe' as const, label: 'NOMINAL' },
  auditTrail: outputs.auditTrail || [],
  inputSummary: [
    { label: 'Flush Piping Arrangement', value: inputs.planId.toUpperCase().replace('_', ' ') },
    { label: 'Seal Size', value: `${inputs.sealSizeMm} mm` },
    { label: 'Shaft Speed', value: `${inputs.shaftSpeedRpm} RPM` },
    { label: 'Seal Chamber Pressure', value: `${inputs.sealChamberPressureKPag} kPag` },
    { label: 'Discharge Pressure', value: `${inputs.pumpDischargePressureKPag} kPag` },
  ],
  keyResults: [
    { label: 'Seal Face Heat Power Q_face', value: `${outputs.sealFaceHeatGenKW?.toFixed(2)} kW` },
    { label: 'Required Flush Flow Rate', value: `${outputs.requiredFlushFlowLpm?.toFixed(1)} L/min`, status: outputs.status?.level },
    { label: 'Actual Orifice Flush Flow', value: `${outputs.actualOrificeFlowLpm?.toFixed(1)} L/min`, status: outputs.status?.level },
    { label: 'Vapor Suppression Margin', value: `${outputs.vaporPressureMarginKPa?.toFixed(0)} kPa`, status: outputs.status?.level },
    { label: 'Seal Chamber Operating Temp', value: `${outputs.sealChamberOperatingTempC?.toFixed(1)}°C` },
  ],
});

export const SealPlanSimulator: React.FC<SealPlanSimulatorProps> = ({
  unitSystem,
  onAuditRequested,
  onReportRequested,
  onOpenInfo,
}) => {
  return (
    <SimulatorWorkbench<SealInputs, SealOutputs>
      title="API 682 Seal Flush Plan"
      subtitle="API 682 4th Ed"
      scenarios={SEAL_SCENARIOS}
      defaultInputs={SEAL_SCENARIOS[0].inputs}
      calculateFn={calculateSealPlan}
      VisualComponent={SealPlanVisualizer}
      unitSystem={unitSystem}
      onOpenInfo={onOpenInfo}
      disclaimerText="API 682 / ISO 21049 Mechanical Seal Standard"
      chartTabLabel="Thermal & Margin Curves"
      visualTabLabel="Digital Twin"
      simulatorType="seal-flush-plan"
      simulatorId="seal"
      onAuditRequested={onAuditRequested}
      onReportRequested={onReportRequested}
      buildReportData={buildSealReport}
      customControls={({ inputs, onChange, unitSystem: currentUnit, scenarios: s, activeScenarioId: aId, onSelectScenario: onSel }) => (
        <SealPlanControls
          inputs={inputs}
          onChange={onChange}
          unitSystem={currentUnit}
          scenarios={s}
          activeScenarioId={aId}
          onSelectScenario={onSel}
        />
      )}
      customResults={({ outputs, inputs, unitSystem: currentUnit }) => (
        <SealPlanResults
          outputs={outputs}
          inputs={inputs}
          unitSystem={currentUnit}
        />
      )}
      chartComponent={({ inputs, outputs, unitSystem: currentUnit }) => (
        <div className="w-full h-full">
          <SealPlanCharts
            inputs={inputs}
            outputs={outputs}
            unitSystem={currentUnit}
          />
        </div>
      )}
    />
  );
};
