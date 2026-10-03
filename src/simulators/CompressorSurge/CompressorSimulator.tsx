import React from 'react';
import { CompressorInputs, CompressorOutputs } from '../../types/compressor';
import { UnitSystem } from '../../types/common';
import { calculateCompressorSurge } from '../../utils/compressorCalculations';
import { COMPRESSOR_SCENARIOS } from '../../utils/compressorPresets';
import { CompressorVisualizer } from './CompressorVisualizer';
import { CompressorCharts } from './CompressorCharts';
import { CompressorControls } from './CompressorControls';
import { CompressorResults } from './CompressorResults';
import { SimulatorWorkbench } from '../../components/Workbench';

interface CompressorSimulatorProps {
  unitSystem: UnitSystem;
  onAuditRequested: (trail: any) => void;
  onReportRequested: (data: any) => void;
  onOpenInfo?: () => void;
}

const buildCompressorReport = (
  inputs: CompressorInputs,
  outputs: CompressorOutputs,
  currentUnit: UnitSystem
) => ({
  title: 'Centrifugal Compressor Surge & Anti-Surge Control Assessment',
  subtitle: 'API 617 8th/9th Ed / ASME PTC 10 Performance Map & Dynamic SCL Envelope',
  standards: ['API 617 8th Ed (Axial/Centrifugal Compressors)', 'API 670 5th Ed (Machinery Protection Systems)', 'ASME PTC 10'],
  status: outputs.status || { level: 'safe' as const, label: 'NOMINAL' },
  auditTrail: outputs.auditTrail || [],
  inputSummary: [
    { label: 'Process Gas', value: outputs.gasProperties.name },
    { label: 'Suction Pressure P1', value: `${inputs.suctionPressureBar} bar(a)` },
    { label: 'Suction Temp T1', value: `${inputs.suctionTempC}°C` },
    { label: 'Process Feed Flow', value: `${inputs.massFlowKgS.toFixed(1)} kg/s` },
    { label: 'Shaft Speed', value: `${inputs.speedRpm.toLocaleString()} RPM` },
    { label: 'ASV Opening', value: `${inputs.asvOpeningPercent}%` },
  ],
  keyResults: [
    { label: 'Surge Margin SM', value: `${outputs.currentSurgeMarginPercent.toFixed(1)}% (Target: ≥ ${inputs.surgeMarginTargetPercent}%)`, status: outputs.status?.level as ('safe' | 'warning' | 'critical') },
    { label: 'Pressure Ratio Rc', value: `${outputs.pressureRatioRc.toFixed(2)}x (${outputs.dischargePressureBar.toFixed(2)} bar)` },
    { label: 'Total Compressor Flow', value: `${outputs.massFlowTotalKgS.toFixed(1)} kg/s (Process: ${outputs.processMassFlowKgS.toFixed(1)} + Recycle: ${outputs.asvRecycleMassFlowKgS.toFixed(1)})` },
    { label: 'Thrust Bearing Load', value: `${outputs.thrustBearingLoadPercent.toFixed(0)}%`, status: (outputs.thrustBearingLoadPercent > 100 ? 'critical' : 'safe') as ('safe' | 'warning' | 'critical') },
    { label: 'Operating State', value: outputs.operatingState.toUpperCase(), status: outputs.status?.level as ('safe' | 'warning' | 'critical') },
    { label: 'Gas Shaft Power', value: `${Math.round(outputs.shaftPowerKw).toLocaleString()} kW` },
  ],
});

export const CompressorSimulator: React.FC<CompressorSimulatorProps> = ({
  unitSystem,
  onAuditRequested,
  onReportRequested,
  onOpenInfo,
}) => {
  return (
    <SimulatorWorkbench<CompressorInputs, CompressorOutputs>
      title="Centrifugal Compressor Surge"
      subtitle="API 617 / API 670"
      scenarios={COMPRESSOR_SCENARIOS}
      defaultInputs={COMPRESSOR_SCENARIOS[0].inputs}
      calculateFn={calculateCompressorSurge}
      VisualComponent={CompressorVisualizer}
      unitSystem={unitSystem}
      onOpenInfo={onOpenInfo}
      disclaimerText="API 617 Process Centrifugal Compressor Aerodynamic & API 670 Surge Protection Standard"
      chartTabLabel="Performance Map & SLL"
      visualTabLabel="Digital Twin"
      simulatorId="compressor"
      chartComponent={({ inputs: liveInputs, outputs: liveOutputs }) => (
        <CompressorCharts inputs={liveInputs} outputs={liveOutputs} unitSystem={unitSystem} />
      )}
      customControls={({ inputs: liveInputs, onChange: onLiveChange }) => (
        <CompressorControls inputs={liveInputs} onChange={onLiveChange} unitSystem={unitSystem} />
      )}
      customResults={({ inputs: liveInputs, outputs: liveOutputs }) => (
        <CompressorResults
          inputs={liveInputs}
          outputs={liveOutputs}
          unitSystem={unitSystem}
          onAuditRequested={onAuditRequested}
          onReportRequested={() =>
            onReportRequested(buildCompressorReport(liveInputs, liveOutputs, unitSystem))
          }
        />
      )}
      buildReportData={(liveInputs, liveOutputs) =>
        buildCompressorReport(liveInputs, liveOutputs, unitSystem)
      }
    />
  );
};
