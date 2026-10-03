import React from 'react';
import { SteamTurbineInputs, SteamTurbineOutputs } from '../../types/steamTurbine';
import { STEAM_TURBINE_SCENARIOS } from '../../utils/steamTurbinePresets';
import { calculateSteamTurbine } from '../../utils/steamTurbineCalculations';
import { SimulatorWorkbench } from '../../components/Workbench/SimulatorWorkbench';
import { SteamTurbineVisualizer } from './SteamTurbineVisualizer';
import { SteamTurbineCharts } from './SteamTurbineCharts';
import { SteamTurbineControls } from './SteamTurbineControls';
import { SteamTurbineResults } from './SteamTurbineResults';
import { UnitSystem } from '../../types/common';

interface SteamTurbineSimulatorProps {
  initialInputs?: Partial<SteamTurbineInputs>;
  onReportRequested?: (data: any) => void;
  onOpenInfo?: () => void;
  onAuditRequested?: () => void;
  unitSystem?: UnitSystem;
}

const buildSteamTurbineReport = (
  inputs: SteamTurbineInputs,
  outputs: SteamTurbineOutputs,
  currentUnit: UnitSystem
) => {
  return {
    title: 'API 611 / API 612 Industrial Steam Turbine Reliability & Thermodynamics Audit',
    subtitle: 'Mollier Expansion Dynamics, Willans Steam Consumption, Wilson Line Droplet Erosion, Campbell Blade Resonance, and Speed Governing',
    standards: [
      'API 612 8th Edition (Petroleum, Petrochemical and Natural Gas Industries — Steam Turbines — Special-purpose Applications)',
      'API 611 5th Edition (General-purpose Steam Turbines for Petroleum, Chemical, and Gas Industry Services)',
      'ASME PTC 6 (Steam Turbines Performance Test Codes)',
      'ISO 20816-2 (Mechanical vibration — Measurement and evaluation of machine vibration — Part 2: Land-based gas turbines, steam turbines and generators)',
      'NEMA SM 23 / API 612 §2.4 (Steam Turbine Governors and Speed Control Systems)',
    ],
    status: outputs.status,
    auditTrail: outputs.auditTrail,
    inputSummary: [
      { label: 'Turbine Configuration', value: `${inputs.turbineType.replace(/_/g, ' ').toUpperCase()} (${inputs.stageDesign.replace(/_/g, ' ').toUpperCase()})` },
      { label: 'Shaft Power & Speed', value: `${inputs.ratedPowerKw} kW at ${inputs.operatingSpeedRpm} RPM (Rated: ${inputs.ratedSpeedRpm} RPM)` },
      { label: 'Inlet Steam State', value: `${inputs.inletPressureBar} bar(a), ${inputs.inletTemperatureC}°C (Superheat: ${outputs.inletSuperheatC}°C)` },
      { label: 'Exhaust Condition', value: `${inputs.exhaustPressureBar} bar(a) (${inputs.turbineType === 'condensing' ? 'Surface Condenser' : 'Process Header'})` },
      { label: 'Stages & Mean Diameter', value: `${inputs.numberOfStages} Stages, D_mean = ${inputs.meanBladeDiameterMm} mm, L_last = ${inputs.lastStageBladeLengthMm} mm` },
      { label: 'Governing Mode', value: `${inputs.governingMode.replace(/_/g, ' ').toUpperCase()} (${inputs.throttleValveOpeningPercent}% Open, ${inputs.governorDroopPercent}% Droop)` },
      { label: 'Critical Speeds', value: `N_c1 = ${inputs.firstCriticalSpeedRpm} RPM | N_c2 = ${inputs.secondCriticalSpeedRpm} RPM` },
      { label: 'Stellite Erosion Shield', value: inputs.stelliteErosionShieldInstalled ? 'INSTALLED on L-0' : 'NONE' },
    ],
    keyResults: [
      {
        label: 'Isentropic Efficiency (η_s)',
        value: `${outputs.isentropicEfficiencyPercent}% (ASR: ${outputs.actualSteamRateAsrKgKwh} kg/kWh, TSR: ${outputs.theoreticalSteamRateTsrKgKwh} kg/kWh)`,
        status: (outputs.isentropicEfficiencyPercent >= 75 ? 'safe' : outputs.isentropicEfficiencyPercent >= 65 ? 'warning' : 'critical') as 'safe' | 'warning' | 'critical',
      },
      {
        label: 'Exhaust Moisture & Wilson Line',
        value: `${outputs.exhaustMoisturePercent}% Moisture (Quality x = ${outputs.exhaustSteamQualityX}, Limit: ${outputs.maxAllowableMoisturePercent}%)`,
        status: (outputs.moistureErosionRiskLevel === 'safe' ? 'safe' : outputs.moistureErosionRiskLevel === 'warning' ? 'warning' : 'critical') as 'safe' | 'warning' | 'critical',
      },
      {
        label: 'Steam Mass Flow Rate',
        value: `${outputs.steamMassFlowTonnesHr} t/h (${outputs.steamMassFlowKgS} kg/s, No-load: ${outputs.noLoadSteamFlowTonnesHr} t/h)`,
        status: 'safe' as 'safe' | 'warning' | 'critical',
      },
      {
        label: 'API 612 Critical Speed Separation Margin',
        value: `${outputs.criticalSpeedSeparationMarginPercent}% from nearest critical (API 612 min: ≥ 15%)`,
        status: (outputs.isNearCriticalSpeed ? 'critical' : outputs.criticalSpeedSeparationMarginPercent < 20 ? 'warning' : 'safe') as 'safe' | 'warning' | 'critical',
      },
      {
        label: 'Campbell Blade Resonance Margin',
        value: `${outputs.bladeResonanceMarginPercent}% from NPF (${outputs.nozzlePassFrequencyHz} Hz vs f_b ${inputs.bladeNaturalFrequencyHz} Hz)`,
        status: (outputs.isBladeResonant ? 'critical' : outputs.bladeResonanceMarginPercent < 15 ? 'warning' : 'safe') as 'safe' | 'warning' | 'critical',
      },
      {
        label: 'Overspeed Trip Margin',
        value: `${outputs.overspeedTripMarginRpm} RPM remaining to 110% Trip Bolt (${outputs.overspeedTripThresholdRpm} RPM)`,
        status: (outputs.isOverspeedTripTriggered ? 'critical' : outputs.overspeedTripMarginRpm < 200 ? 'warning' : 'safe') as 'safe' | 'warning' | 'critical',
      },
      {
        label: 'ISO 20816 Shaft Relative Displacement',
        value: `${outputs.shaftRelativeVibrationUmPkPk} μm peak-to-peak (Zone ${outputs.iso20816VibrationZone})`,
        status: (outputs.iso20816VibrationZone === 'A' || outputs.iso20816VibrationZone === 'B' ? 'safe' : outputs.iso20816VibrationZone === 'C' ? 'warning' : 'critical') as 'safe' | 'warning' | 'critical',
      },
    ],
    recommendations: outputs.status.recommendations,
  };
};

export const SteamTurbineSimulator: React.FC<SteamTurbineSimulatorProps> = ({
  initialInputs,
  onReportRequested,
  onOpenInfo,
  onAuditRequested,
  unitSystem = 'metric',
}) => {
  const baseInputs = STEAM_TURBINE_SCENARIOS[0].inputs;
  const mergedInputs: SteamTurbineInputs = { ...baseInputs, ...initialInputs };

  return (
    <SimulatorWorkbench<SteamTurbineInputs, SteamTurbineOutputs>
      title="API 611 / API 612 Industrial Steam Turbine Simulator"
      subtitle="Thermodynamic Mollier Expansion, Willans Steam Rate, Wilson Line Moisture Erosion, Campbell Blade Resonance, and Speed Governing"
      defaultInputs={mergedInputs}
      calculateFn={calculateSteamTurbine}
      VisualComponent={SteamTurbineVisualizer}
      chartComponent={(props) => (
        <SteamTurbineCharts inputs={props.inputs} outputs={props.outputs} unitSystem={props.unitSystem} />
      )}
      chartTabLabel="Mollier, Willans & Campbell"
      visualTabLabel="Steam Turbine Digital Twin"
      simulatorType="steam-turbine"
      simulatorId="turbine"
      scenarios={STEAM_TURBINE_SCENARIOS}
      customControls={({ inputs, onChange }) => (
        <SteamTurbineControls
          inputs={inputs}
          onChange={(newInputs) => onChange(newInputs)}
          unitSystem={unitSystem}
        />
      )}
      customResults={({ inputs, outputs, unitSystem: uSys }) => (
        <SteamTurbineResults inputs={inputs} outputs={outputs} unitSystem={uSys} />
      )}
      buildReportData={buildSteamTurbineReport}
      onReportRequested={onReportRequested}
      onOpenInfo={onOpenInfo}
      onAuditRequested={onAuditRequested}
    />
  );
};
