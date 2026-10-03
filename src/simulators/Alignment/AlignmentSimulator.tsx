import React from 'react';
import { AlignmentInputs, AlignmentOutputs } from '../../types/alignment';
import { UnitSystem } from '../../types/common';
import { calculateAlignment } from '../../utils/alignmentCalculations';
import { ALIGNMENT_SCENARIOS } from '../../engine/scenarios';
import { AlignmentVisualizer } from './AlignmentVisualizer';
import { AlignmentCharts } from './AlignmentCharts';
import { AlignmentControls } from './AlignmentControls';
import { AlignmentResults } from './AlignmentResults';
import { SimulatorWorkbench } from '../../components/Workbench';

interface AlignmentSimulatorProps {
  unitSystem: UnitSystem;
  onAuditRequested: (trail: any) => void;
  onReportRequested: (data: any) => void;
  onOpenInfo?: () => void;
}

const buildAlignmentReport = (inputs: AlignmentInputs, outputs: AlignmentOutputs, currentUnit: UnitSystem) => ({
  title: 'Shaft Alignment, Thermal Offset & API 686 Compliance',
  subtitle: 'Hot-Running Dynamic Offset, Shim Corrections & ISO 20816 2X Harmonics',
  standards: ['API 686 2nd Ed Chapter 7', 'ISO 20816-3:2022', 'AGMA 9000-D11'],
  status: outputs.status || { level: 'safe' as const, label: 'NOMINAL' },
  auditTrail: outputs.auditTrail || [],
  inputSummary: [
    { label: 'Operating Speed', value: `${inputs.motorRpm} RPM` },
    { label: 'Coupling Spacer DBSE', value: `${inputs.couplingSpacerLengthMm} mm` },
    { label: 'Ambient / Fluid Temp', value: `${inputs.ambientInstallationTempC}°C / ${inputs.pumpFluidTempC}°C` },
    { label: 'Motor Foot Distance B / C', value: `${inputs.distCouplingToMotorFrontFootMm} mm / ${inputs.distMotorFrontToRearFootMm} mm` },
    { label: 'Coupling Type', value: 'Metallic Disc Pack (API 671)' },
  ],
  keyResults: [
    { label: 'Hot Resultant Parallel Offset', value: `${outputs.hotResultantOffsetMm?.toFixed(3)} mm (Max: ${outputs.allowableParallelOffsetMm} mm)`, status: outputs.status?.level },
    { label: 'Hot Resultant Angular Tilt', value: `${outputs.hotResultantAngleMrad?.toFixed(2)} mrad (Max: ${outputs.allowableAngularOffsetMrad} mrad)`, status: outputs.status?.level },
    { label: 'API 686 Tolerance Utilization', value: `${outputs.toleranceUtilizationPercent?.toFixed(0)}% (${outputs.alignmentClassification})`, status: outputs.status?.level },
    { label: 'Front / Rear Foot Shims', value: `F: ${outputs.frontFootShimAdjustmentMm >= 0 ? '+' : ''}${outputs.frontFootShimAdjustmentMm?.toFixed(2)} mm | R: ${outputs.rearFootShimAdjustmentMm >= 0 ? '+' : ''}${outputs.rearFootShimAdjustmentMm?.toFixed(2)} mm` },
    { label: 'Transmitted Shear Reaction', value: `${outputs.transmittedRadialShearN?.toFixed(0)} N (DE Bearing +${outputs.motorBearingAdditionalRadialLoadN?.toFixed(0)} N)` },
    { label: 'ISO 10816-3 Vibration', value: `Zone ${outputs.iso10816Zone} (${outputs.totalVibrationRmsMmS?.toFixed(2)} mm/s RMS, 2X: ${outputs.vibration2XRmsMmS?.toFixed(2)} mm/s)`, status: outputs.status?.level },
  ],
});

export const AlignmentSimulator: React.FC<AlignmentSimulatorProps> = ({
  unitSystem,
  onAuditRequested,
  onReportRequested,
  onOpenInfo,
}) => {
  return (
    <SimulatorWorkbench<AlignmentInputs, AlignmentOutputs>
      title="Shaft Alignment & Thermal Growth"
      subtitle="API 686 / ISO 20816"
      scenarios={ALIGNMENT_SCENARIOS}
      defaultInputs={ALIGNMENT_SCENARIOS[0].inputs}
      calculateFn={calculateAlignment}
      VisualComponent={AlignmentVisualizer}
      unitSystem={unitSystem}
      onOpenInfo={onOpenInfo}
      disclaimerText="API 686 Machinery Installation & ISO 20816-3 Alignment Criteria"
      chartTabLabel="Tolerance & Vibration FFT"
      visualTabLabel="Digital Twin"
      simulatorType="alignment"
      simulatorId="alignment"
      onAuditRequested={onAuditRequested}
      onReportRequested={onReportRequested}
      buildReportData={buildAlignmentReport}
      customControls={({ inputs, onChange, unitSystem: currentUnit, scenarios: s, activeScenarioId: aId, onSelectScenario: onSel }) => (
        <AlignmentControls
          inputs={inputs}
          onChange={onChange}
          unitSystem={currentUnit}
          scenarios={s}
          activeScenarioId={aId}
          onSelectScenario={onSel}
        />
      )}
      customResults={({ outputs, inputs, unitSystem: currentUnit }) => (
        <AlignmentResults
          outputs={outputs}
          inputs={inputs}
          unitSystem={currentUnit}
        />
      )}
      chartComponent={({ inputs, outputs, unitSystem: currentUnit }) => (
        <div className="w-full h-full">
          <AlignmentCharts
            inputs={inputs}
            outputs={outputs}
            unitSystem={currentUnit}
          />
        </div>
      )}
    />
  );
};
