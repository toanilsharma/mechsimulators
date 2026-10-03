import React from 'react';
import { RecipCompressorInputs, RecipCompressorOutputs } from '../../types/recipCompressor';
import { RECIP_COMPRESSOR_SCENARIOS } from '../../utils/recipCompressorPresets';
import { calculateRecipCompressor } from '../../utils/recipCompressorCalculations';
import { SimulatorWorkbench } from '../../components/Workbench/SimulatorWorkbench';
import { RecipVisualizer } from './RecipVisualizer';
import { RecipCharts } from './RecipCharts';
import { RecipControls } from './RecipControls';
import { RecipResults } from './RecipResults';
import { UnitSystem } from '../../types/common';

interface RecipSimulatorProps {
  initialInputs?: Partial<RecipCompressorInputs>;
  onReportRequested?: (data: any) => void;
  onOpenInfo?: () => void;
  onAuditRequested?: () => void;
  unitSystem?: UnitSystem;
}

const buildRecipReport = (
  inputs: RecipCompressorInputs,
  outputs: RecipCompressorOutputs,
  currentUnit: UnitSystem
) => {
  return {
    title: 'Reciprocating Compressor PV Indicator Card & API 618/688 Audit',
    subtitle: 'Thermodynamic Indicator Card, Rod Load Reversal, Valve Degradation, and API 688 Acoustic Pulsations',
    standards: [
      'API 618 5th Edition (Reciprocating Compressors for Petroleum, Chemical, and Gas Industry Services)',
      'API 688 1st Edition (Pulsation and Vibration Control in Positive Displacement Machinery)',
      'ASME PTC 10 / ISO 13631 (Reciprocating Gas Compressors)',
    ],
    status: outputs.status,
    auditTrail: outputs.auditTrail,
    inputSummary: [
      { label: 'Cylinder Action', value: inputs.cylinderAction.replace(/_/g, ' ').toUpperCase() },
      { label: 'Bore & Stroke', value: `${inputs.cylinderBoreMm} mm bore × ${inputs.strokeMm} mm stroke` },
      { label: 'Crank Speed', value: `${inputs.crankSpeedRpm} RPM (${(inputs.crankSpeedRpm / 60).toFixed(1)} Hz)` },
      { label: 'Working Gas', value: inputs.gasType.replace(/_/g, ' ').toUpperCase() },
      { label: 'Pressures', value: `${inputs.suctionPressureBarA} bar(a) suction → ${inputs.dischargePressureBarA} bar(a) discharge` },
      { label: 'Valves Condition', value: `Suction: ${inputs.suctionValveFault} | Discharge: ${inputs.dischargeValveFault}` },
      { label: 'Acoustic Dampers', value: inputs.hasPulsationBottles ? `${inputs.damperVolumeLiters} L Damper Active` : 'No Bottles' },
    ],
    keyResults: [
      {
        label: 'API 618 Rod Reversal',
        value: `${outputs.rodLoadReversalDegrees}° crank span (Min: 15°)`,
        status: (outputs.hasAdequateRodLoadReversal ? 'safe' : 'critical') as 'safe' | 'warning' | 'critical',
      },
      {
        label: 'Max Combined Rod Load',
        value: `+${outputs.maxTensionRodLoadKn} kN Tension / ${outputs.maxCompressionRodLoadKn} kN Comp`,
        status: (outputs.tensionLoadUtilizationPercent > 100 || outputs.compressionLoadUtilizationPercent > 100 ? 'critical' : 'safe') as 'safe' | 'warning' | 'critical',
      },
      {
        label: 'Volumetric Efficiency',
        value: `${outputs.effectiveVolumetricEfficiencyPercent}% (Mass Flow: ${Math.round(outputs.massFlowRateKgHr)} kg/h)`,
        status: (outputs.effectiveVolumetricEfficiencyPercent < 50 ? 'warning' : 'safe') as 'safe' | 'warning' | 'critical',
      },
      {
        label: 'Discharge Gas Temp',
        value: `${outputs.actualDischargeTempC} °C (API 618 Limit: 150 °C)`,
        status: (outputs.actualDischargeTempC > 150 ? 'critical' : 'safe') as 'safe' | 'warning' | 'critical',
      },
      {
        label: 'Indicated Power',
        value: `${outputs.indicatedPowerKw} kW (${outputs.brakePowerKw} kW Brake)`,
      },
      {
        label: 'API 688 Piping Pulsation',
        value: `${outputs.maxPulsationPercentOfLine}% of Line P (API 618 Allowable: ${outputs.api618AllowablePulsationPercent}%)`,
        status: (outputs.isAcousticPulsationCompliant ? 'safe' : 'critical') as 'safe' | 'warning' | 'critical',
      },
    ],
  };
};

export const RecipSimulator: React.FC<RecipSimulatorProps> = ({
  initialInputs,
  onReportRequested,
  onOpenInfo,
  onAuditRequested,
  unitSystem = 'metric',
}) => {
  const baseInputs = RECIP_COMPRESSOR_SCENARIOS[0].inputs;
  const mergedInputs: RecipCompressorInputs = { ...baseInputs, ...initialInputs };

  return (
    <SimulatorWorkbench<RecipCompressorInputs, RecipCompressorOutputs>
      title="Reciprocating Compressor PV & API 618/688 Simulator"
      subtitle="Thermodynamic Indicator Card, Rod Load Reversal, Valve Fault Injections, and Acoustic Pulsation Dampers"
      defaultInputs={mergedInputs}
      calculateFn={calculateRecipCompressor}
      VisualComponent={RecipVisualizer}
      chartComponent={(props) => (
        <RecipCharts inputs={props.inputs} outputs={props.outputs} unitSystem={props.unitSystem} />
      )}
      chartTabLabel="PV Card & Rod Load Dynamics"
      visualTabLabel="Cylinder & Kinematic Twin"
      simulatorType="recip-compressor"
      simulatorId="recip"
      scenarios={RECIP_COMPRESSOR_SCENARIOS}
      customControls={({ inputs, onChange }) => (
        <RecipControls
          inputs={inputs}
          onChange={(field, val) => onChange({ [field]: val } as any)}
        />
      )}
      customResults={({ inputs, outputs, unitSystem: uSys }) => (
        <RecipResults inputs={inputs} outputs={outputs} unitSystem={uSys} />
      )}
      buildReportData={buildRecipReport}
      onReportRequested={onReportRequested}
      onOpenInfo={onOpenInfo}
    />
  );
};
