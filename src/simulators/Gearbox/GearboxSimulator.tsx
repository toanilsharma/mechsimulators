import React from 'react';
import { GearboxInputs, GearboxOutputs } from '../../types/gearbox';
import { GEARBOX_SCENARIOS } from '../../utils/gearboxPresets';
import { calculateGearbox } from '../../utils/gearboxCalculations';
import { SimulatorWorkbench } from '../../components/Workbench/SimulatorWorkbench';
import { GearboxVisualizer } from './GearboxVisualizer';
import { GearboxCharts } from './GearboxCharts';
import { GearboxControls } from './GearboxControls';
import { GearboxResults } from './GearboxResults';
import { UnitSystem } from '../../types/common';

interface GearboxSimulatorProps {
  initialInputs?: Partial<GearboxInputs>;
  onReportRequested?: (data: any) => void;
  onOpenInfo?: () => void;
  onAuditRequested?: () => void;
  unitSystem?: UnitSystem;
}

const buildGearboxReport = (
  inputs: GearboxInputs,
  outputs: GearboxOutputs,
  currentUnit: UnitSystem
) => {
  return {
    title: 'Industrial Gearbox & AGMA 2001 / ISO 6336 Reliability Audit',
    subtitle: 'Gear Mesh Frequencies, Hunting Tooth Dynamics, Contact & Bending Safety Factors, EHL Film, and Vibration Severity',
    standards: [
      'AGMA 2001-D04 / ANSI/AGMA 2101-D04 (Fundamental Rating Factors and Calculation Methods for Involute Spur and Helical Gear Teeth)',
      'ISO 6336 (Calculation of Load Capacity of Spur and Helical Gears)',
      'ISO 10816-3 (Mechanical Vibration — Evaluation of Machine Vibration on Non-Rotating Parts - Industrial Gearboxes)',
      'AGMA 9005-F16 (Industrial Gear Lubrication)',
      'API 613 5th Edition (Special Purpose Gear Units for Petroleum, Chemical and Gas Industry Services)',
    ],
    status: outputs.status,
    auditTrail: outputs.auditTrail,
    inputSummary: [
      { label: 'Gear Type', value: inputs.gearType.replace(/_/g, ' ').toUpperCase() },
      { label: 'Transmitted Power', value: `${inputs.ratedPowerKw} kW (${Math.round(inputs.ratedPowerKw * 1.341)} HP)` },
      { label: 'Speeds', value: `${inputs.inputSpeedRpm} RPM Pinion → ${outputs.outputSpeedRpm} RPM Gear (Ratio ${outputs.gearRatio}:1)` },
      { label: 'Tooth Counts', value: `Z_p = ${inputs.pinionTeeth} | Z_g = ${inputs.gearTeeth}` },
      { label: 'Module & Face', value: `m_n = ${inputs.normalModuleMm} mm | Face = ${inputs.faceWidthMm} mm` },
      { label: 'Material & Hardness', value: `${inputs.materialGrade.replace(/_/g, ' ')} (${inputs.pinionHardnessHrc} / ${inputs.gearHardnessHrc} HRC)` },
      { label: 'Lubricant & Temp', value: `${inputs.lubricant.toUpperCase()} at ${inputs.oilOperatingTempC}°C (${outputs.operatingViscosityCSt} cSt)` },
      { label: 'Fault Simulated', value: inputs.toothFault.replace(/_/g, ' ').toUpperCase() },
    ],
    keyResults: [
      {
        label: 'AGMA Bending Safety Factor (S_F)',
        value: `S_F = ${outputs.bendingSafetyFactorSF} (Min: 1.40, Stress: ${outputs.bendingStressMpa} MPa)`,
        status: (outputs.bendingSafetyFactorSF >= 1.4 ? 'safe' : outputs.bendingSafetyFactorSF >= 1.15 ? 'warning' : 'critical') as 'safe' | 'warning' | 'critical',
      },
      {
        label: 'AGMA Contact Safety Factor (S_H)',
        value: `S_H = ${outputs.contactSafetyFactorSH} (Min: 1.25, Stress: ${outputs.contactStressMpa} MPa)`,
        status: (outputs.contactSafetyFactorSH >= 1.25 ? 'safe' : outputs.contactSafetyFactorSH >= 1.05 ? 'warning' : 'critical') as 'safe' | 'warning' | 'critical',
      },
      {
        label: 'Gear Mesh Frequency (GMF)',
        value: `${outputs.gearMeshFrequencyHz} Hz (${inputs.pinionTeeth}X Pinion Speed)`,
        status: 'safe' as 'safe' | 'warning' | 'critical',
      },
      {
        label: 'Hunting Tooth Frequency (f_HT)',
        value: `${outputs.huntingToothFrequencyHz} Hz ${outputs.commonFactorsGcd === 1 ? '(Prime Hunting Tooth)' : `(GCD = ${outputs.commonFactorsGcd})`}`,
        status: (outputs.commonFactorsGcd === 1 ? 'safe' : 'warning') as 'safe' | 'warning' | 'critical',
      },
      {
        label: 'EHL Specific Film Ratio (λ)',
        value: `λ = ${outputs.specificFilmThicknessLambda} (${outputs.lubricationRegime}, h_min = ${outputs.ehlFilmThicknessUm} µm)`,
        status: (outputs.specificFilmThicknessLambda >= 2.0 ? 'safe' : outputs.specificFilmThicknessLambda >= 1.0 ? 'warning' : 'critical') as 'safe' | 'warning' | 'critical',
      },
      {
        label: 'ISO 10816-3 Casing Vibration',
        value: `${outputs.overallVibrationMmSRms} mm/s RMS (${outputs.iso10816ZoneLabel})`,
        status: (outputs.iso10816Zone === 'A' || outputs.iso10816Zone === 'B' ? 'safe' : outputs.iso10816Zone === 'C' ? 'warning' : 'critical') as 'safe' | 'warning' | 'critical',
      },
    ],
    recommendations: outputs.recommendations,
  };
};

export const GearboxSimulator: React.FC<GearboxSimulatorProps> = ({
  initialInputs,
  onReportRequested,
  onOpenInfo,
  onAuditRequested,
  unitSystem = 'metric',
}) => {
  const baseInputs = GEARBOX_SCENARIOS[0].inputs;
  const mergedInputs: GearboxInputs = { ...baseInputs, ...initialInputs };

  return (
    <SimulatorWorkbench<GearboxInputs, GearboxOutputs>
      title="Industrial Gearbox & Gear Mesh Diagnostics Simulator"
      subtitle="AGMA 2001 & ISO 6336 Rating, Hunting Tooth Dynamics, Contact Pitting & Bending Fatigue, EHL Tribology, and FFT Sideband Modulation"
      defaultInputs={mergedInputs}
      calculateFn={calculateGearbox}
      VisualComponent={GearboxVisualizer}
      chartComponent={(props) => (
        <GearboxCharts inputs={props.inputs} outputs={props.outputs} unitSystem={props.unitSystem} />
      )}
      chartTabLabel="AGMA Stress & GMF Spectrum"
      visualTabLabel="Gear Mesh & Digital Twin"
      simulatorType="gearbox"
      simulatorId="gearbox"
      scenarios={GEARBOX_SCENARIOS}
      customControls={({ inputs, onChange }) => (
        <GearboxControls
          inputs={inputs}
          onChange={(newInputs) => onChange(newInputs)}
          unitSystem={unitSystem}
        />
      )}
      customResults={({ inputs, outputs, unitSystem: uSys }) => (
        <GearboxResults inputs={inputs} outputs={outputs} unitSystem={uSys} />
      )}
      buildReportData={buildGearboxReport}
      onReportRequested={onReportRequested}
      onOpenInfo={onOpenInfo}
      onAuditRequested={onAuditRequested}
    />
  );
};
