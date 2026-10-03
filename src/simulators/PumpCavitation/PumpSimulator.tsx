import React from 'react';
import { PumpInputs, PumpOutputs } from '../../types/pump';
import { UnitSystem } from '../../types/common';
import { calculatePump } from '../../utils/pumpCalculations';
import { PUMP_SCENARIOS } from '../../engine/scenarios';
import { PumpVisualizer } from './PumpVisualizer';
import { PumpCurvesChart } from './PumpCurvesChart';
import { PumpControls } from './PumpControls';
import { PumpResults } from './PumpResults';
import { SimulatorWorkbench } from '../../components/Workbench';

interface PumpSimulatorProps {
  unitSystem: UnitSystem;
  onAuditRequested: (trail: any) => void;
  onReportRequested: (data: any) => void;
  onOpenInfo?: () => void;
}

const buildPumpReport = (inputs: PumpInputs, outputs: PumpOutputs, currentUnit: UnitSystem) => ({
  title: 'Centrifugal Pump Cavitation & NPSH Assessment',
  subtitle: 'API 610 12th Ed / Hydraulic Institute HI 9.6.1 Operating Equilibrium',
  standards: ['API 610 12th Ed §6.1.8', 'HI 9.6.1 NPSH Margin Standard', 'ISO 5199'],
  status: outputs.status || { level: 'safe' as const, label: 'NOMINAL' },
  auditTrail: outputs.auditTrail || [],
  inputSummary: [
    { label: 'Process Fluid', value: inputs.fluidId },
    { label: 'Operating Flow Rate', value: currentUnit === 'metric' ? `${inputs.flowRateM3h} m³/h` : `${(inputs.flowRateM3h * 4.40287).toFixed(1)} GPM` },
    { label: 'Shaft Speed', value: `${inputs.pumpSpeedRpm} RPM` },
    { label: 'Static Suction Head', value: currentUnit === 'metric' ? `${inputs.staticHeadM} m` : `${(inputs.staticHeadM * 3.28084).toFixed(1)} ft` },
    { label: 'Suction Line Diameter', value: currentUnit === 'metric' ? `${inputs.pipeDiameterMm} mm` : `${(inputs.pipeDiameterMm / 25.4).toFixed(2)} in` },
    { label: 'Fluid Temperature', value: currentUnit === 'metric' ? `${inputs.fluidTempC}°C` : `${(inputs.fluidTempC * 1.8 + 32).toFixed(1)}°F` },
  ],
  keyResults: [
    { label: 'NPSH Available (NPSHa)', value: currentUnit === 'metric' ? `${outputs.npshaM?.toFixed(2)} m` : `${(outputs.npshaM * 3.28084)?.toFixed(2)} ft`, status: outputs.status?.level },
    { label: 'NPSH Required (NPSHr)', value: currentUnit === 'metric' ? `${outputs.npshrM?.toFixed(2)} m` : `${(outputs.npshrM * 3.28084)?.toFixed(2)} ft` },
    { label: 'NPSH Margin Ratio', value: `${outputs.npshMarginRatio?.toFixed(2)}x (Rec: ≥ ${outputs.recommendedMarginRatio?.toFixed(2)}x)`, status: outputs.status?.level },
    { label: 'Suction Specific Speed Nss', value: `${outputs.suctionSpecificSpeedUS?.toFixed(0)} US`, status: 'safe' as const },
    { label: 'Suction Line Velocity', value: currentUnit === 'metric' ? `${outputs.fluidVelocityMs?.toFixed(2)} m/s` : `${(outputs.fluidVelocityMs * 3.28084)?.toFixed(2)} ft/s` },
  ],
});

export const PumpSimulator: React.FC<PumpSimulatorProps> = ({
  unitSystem,
  onAuditRequested,
  onReportRequested,
  onOpenInfo,
}) => {
  return (
    <SimulatorWorkbench<PumpInputs, PumpOutputs>
      title="Centrifugal Pump & Cavitation"
      subtitle="Master NPSH margins in real time to prevent vapor bubble collapse, impeller erosion, and catastrophic plant downtime."
      scenarios={PUMP_SCENARIOS}
      defaultInputs={PUMP_SCENARIOS[0].inputs}
      calculateFn={calculatePump}
      VisualComponent={PumpVisualizer}
      unitSystem={unitSystem}
      onOpenInfo={onOpenInfo}
      disclaimerText="API 610 & HI 9.6.1 Cavitation Standard"
      chartTabLabel="H-Q & NPSH Curves"
      visualTabLabel="Digital Twin"
      simulatorType="pump-cavitation"
      simulatorId="pump"
      onAuditRequested={onAuditRequested}
      onReportRequested={onReportRequested}
      buildReportData={buildPumpReport}
      customControls={({ inputs, onChange, unitSystem: currentUnit, scenarios: s, activeScenarioId: aId, onSelectScenario: onSel }) => (
        <PumpControls
          inputs={inputs}
          onChange={onChange}
          unitSystem={currentUnit}
          scenarios={s}
          activeScenarioId={aId}
          onSelectScenario={onSel}
        />
      )}
      customResults={({ outputs, inputs, unitSystem: currentUnit }) => (
        <PumpResults
          outputs={outputs}
          inputs={inputs}
          unitSystem={currentUnit}
        />
      )}
      chartComponent={({ inputs, outputs, unitSystem: currentUnit }) => (
        <div className="w-full h-full">
          <PumpCurvesChart
            inputs={inputs}
            outputs={outputs}
            unitSystem={currentUnit}
          />
        </div>
      )}
    />
  );
};
