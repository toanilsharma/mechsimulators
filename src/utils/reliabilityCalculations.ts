import { SimulatorId, UnitSystem } from '../types/common';
import {
  SweepConfig,
  SweepPoint,
  PFStage,
  AssetHealthScore,
  LCCBreakdown,
  EquipmentDatasheet,
} from '../types/reliability';

import { calculatePump } from './pumpCalculations';
import { calculateRotor } from './rotorCalculations';
import { calculatePipeStress } from './pipeCalculations';
import { calculateSealPlan } from './sealCalculations';
import { calculateAlignment } from './alignmentCalculations';
import { calculateCompressorSurge } from './compressorCalculations';
import { calculateBearingFaults } from './bearingCalculations';
import { calculateJournalBearing } from './journalBearingCalculations';
import { calculateRecipCompressor } from './recipCompressorCalculations';
import { calculateGearbox } from './gearboxCalculations';
import { calculateSteamTurbine } from './steamTurbineCalculations';

import { PUMP_PRESETS } from './pumpPresets';
import { ROTOR_PRESETS } from './rotorPresets';
import { PIPE_PRESETS } from './pipePresets';
import { SEAL_PRESETS } from './sealPresets';
import { ALIGNMENT_PRESETS } from './alignmentPresets';
import { COMPRESSOR_SCENARIOS } from './compressorPresets';
import { BEARING_SCENARIOS } from './bearingPresets';
import { JOURNAL_BEARING_SCENARIOS } from './journalBearingPresets';
import { GEARBOX_SCENARIOS } from './gearboxPresets';
import { STEAM_TURBINE_SCENARIOS } from './steamTurbinePresets';

// ==========================================
// 1. PARAMETRIC SWEEP CONFIGURATIONS
// ==========================================

export const SWEEP_CONFIGS: Record<SimulatorId, SweepConfig[]> = {
  pump: [
    {
      id: 'pump-flow',
      label: 'Flow Rate vs NPSHa / NPSHr & Cavitation Margin',
      simulatorId: 'pump',
      parameterKey: 'flowRateM3h',
      unit: 'm³/h',
      min: 40,
      max: 180,
      steps: 15,
      description: 'Sweeps pump operating throughput to map the API 610 Preferred Operating Region (POR) and determine exact cavitation inception flow.',
      primaryOutputName: 'NPSHa',
      primaryOutputUnit: 'm',
      secondaryOutputName: 'NPSHr (3%)',
      secondaryOutputUnit: 'm',
      thresholdWarning: 1.25, // margin ratio
      thresholdCritical: 1.0,
      thresholdDirection: 'below',
    },
    {
      id: 'pump-temp',
      label: 'Fluid Temperature vs Vapor Pressure & NPSHa Degradation',
      simulatorId: 'pump',
      parameterKey: 'fluidTempC',
      unit: '°C',
      min: 15,
      max: 95,
      steps: 15,
      description: 'Maps boiling curve exponential rise and shows how seasonal or process temperature surges vaporize fluid at the impeller eye.',
      primaryOutputName: 'NPSH Margin Ratio',
      primaryOutputUnit: 'x',
      secondaryOutputName: 'Vapor Head Loss',
      secondaryOutputUnit: 'm',
      thresholdWarning: 1.2,
      thresholdCritical: 1.0,
      thresholdDirection: 'below',
    },
    {
      id: 'pump-speed',
      label: 'Impeller Shaft Speed vs Affinity Head & NPSHr',
      simulatorId: 'pump',
      parameterKey: 'pumpSpeedRpm',
      unit: 'RPM',
      min: 1450,
      max: 3550,
      steps: 12,
      description: 'Evaluates Affinity Laws where Head scales as N² and NPSHr scales as N², identifying overspeed cavitation limits.',
      primaryOutputName: 'NPSH Margin Ratio',
      primaryOutputUnit: 'x',
      secondaryOutputName: 'Operating Head',
      secondaryOutputUnit: 'm',
      thresholdWarning: 1.25,
      thresholdCritical: 1.0,
      thresholdDirection: 'below',
    },
  ],
  rotor: [
    {
      id: 'rotor-speed',
      label: 'Shaft Speed vs 1X Centrifugal Force & ISO Vibration',
      simulatorId: 'rotor',
      parameterKey: 'operatingRpm',
      unit: 'RPM',
      min: 900,
      max: 4200,
      steps: 16,
      description: 'Centrifugal force escalates quadratically with speed (Fc = m·r·ω²), rapidly cutting bearing fatigue life.',
      primaryOutputName: '1X Dynamic Force',
      primaryOutputUnit: 'N',
      secondaryOutputName: 'Vibration Velocity RMS',
      secondaryOutputUnit: 'mm/s',
      thresholdWarning: 4.5, // mm/s ISO 10816 Zone C
      thresholdCritical: 7.1, // mm/s ISO 10816 Zone D
      thresholdDirection: 'above',
    },
    {
      id: 'rotor-unbalance',
      label: 'Residual Unbalance vs Bearing Rating Life L10mh',
      simulatorId: 'rotor',
      parameterKey: 'actualUnbalanceGmm',
      unit: 'g·mm',
      min: 5,
      max: 180,
      steps: 15,
      description: 'Shows how progressive rotor erosion, fouling, or mass loss drastically degrades ISO 281 rolling element bearing fatigue hours.',
      primaryOutputName: 'L10mh Rating Life',
      primaryOutputUnit: 'k-hours',
      secondaryOutputName: 'Radial Dynamic Load',
      secondaryOutputUnit: 'N',
      thresholdWarning: 25, // 25,000 hrs API 610 minimum
      thresholdCritical: 8.76, // 1 year
      thresholdDirection: 'below',
    },
  ],
  pipe: [
    {
      id: 'pipe-temp',
      label: 'Operating Temperature vs ASME B31.3 Stress & Anchor Thrust',
      simulatorId: 'pipe',
      parameterKey: 'operatingTempC',
      unit: '°C',
      min: 20,
      max: 380,
      steps: 15,
      description: 'Calculates thermal elongation ΔL and resultant anchor reaction thrust on stationary pump nozzles under ASME B31.3 Section 319.',
      primaryOutputName: 'ASME Stress Ratio',
      primaryOutputUnit: '%',
      secondaryOutputName: 'Anchor Thrust Force',
      secondaryOutputUnit: 'kN',
      thresholdWarning: 80, // 80% of SA
      thresholdCritical: 100, // 100% of SA
      thresholdDirection: 'above',
    },
    {
      id: 'pipe-length',
      label: 'Unconstrained Pipe Run Length vs Thermal Elongation',
      simulatorId: 'pipe',
      parameterKey: 'pipeLengthM',
      unit: 'm',
      min: 4,
      max: 50,
      steps: 14,
      description: 'Long straight runs without guided flexible loops generate massive cantilever bending moments at connection flanges.',
      primaryOutputName: 'Thermal Growth ΔL',
      primaryOutputUnit: 'mm',
      secondaryOutputName: 'Combined Stress SE',
      secondaryOutputUnit: 'MPa',
      thresholdWarning: 150,
      thresholdCritical: 220,
      thresholdDirection: 'above',
    },
  ],
  seal: [
    {
      id: 'seal-pressure',
      label: 'Chamber Pressure vs Face Heat & Vapor Suppression Margin',
      simulatorId: 'seal',
      parameterKey: 'sealChamberPressureKPag',
      unit: 'kPag',
      min: 100,
      max: 2400,
      steps: 15,
      description: 'Higher seal chamber pressures suppress fluid boiling at the faces but intensify hydrodynamic frictional shear heat.',
      primaryOutputName: 'Vapor Margin',
      primaryOutputUnit: 'kPa',
      secondaryOutputName: 'Face Heat Generation',
      secondaryOutputUnit: 'kW',
      thresholdWarning: 200, // 200 kPa minimum per API 682
      thresholdCritical: 140,
      thresholdDirection: 'below',
    },
    {
      id: 'seal-orifice',
      label: 'Restriction Orifice Diameter vs Flush Flow Delivery',
      simulatorId: 'seal',
      parameterKey: 'orificeDiameterMm',
      unit: 'mm',
      min: 2.0,
      max: 8.0,
      steps: 13,
      description: 'Sizes the Plan 11 restriction orifice to guarantee adequate circulation without drawing excessive pump head bypass.',
      primaryOutputName: 'Delivered Flush Flow',
      primaryOutputUnit: 'L/min',
      secondaryOutputName: 'Required Flush Flow',
      secondaryOutputUnit: 'L/min',
      thresholdWarning: 6.0,
      thresholdCritical: 4.0,
      thresholdDirection: 'below',
    },
  ],
  alignment: [
    {
      id: 'alignment-offset',
      label: 'Parallel Offset vs API 686 Tolerance & 2X Harmonic Vibration',
      simulatorId: 'alignment',
      parameterKey: 'parallelOffsetRadialMm',
      unit: 'mm',
      min: 0.01,
      max: 0.80,
      steps: 16,
      description: 'Maps the coupling shear force, transmitted bearing moment, and 2X rotational frequency excitation against API 686 limits.',
      primaryOutputName: 'API 686 Tolerance Used',
      primaryOutputUnit: '%',
      secondaryOutputName: 'Transmitted Shear Force',
      secondaryOutputUnit: 'N',
      thresholdWarning: 100, // 100% of API 686 limit
      thresholdCritical: 150,
      thresholdDirection: 'above',
    },
    {
      id: 'alignment-temp-diff',
      label: 'Pump Fluid Temperature vs Dynamic Hot Thermal Rise',
      simulatorId: 'alignment',
      parameterKey: 'pumpFluidTempC',
      unit: '°C',
      min: 20,
      max: 260,
      steps: 14,
      description: 'Calculates casing centerline thermal growth (ΔH = α · L · ΔT) to determine cold intentional pre-alignment drop offsets.',
      primaryOutputName: 'Thermal Centerline Rise',
      primaryOutputUnit: 'mm',
      secondaryOutputName: 'Required Front Foot Shim',
      secondaryOutputUnit: 'mm',
      thresholdWarning: 0.25,
      thresholdCritical: 0.50,
      thresholdDirection: 'above',
    },
  ],
  compressor: [
    {
      id: 'compressor-flow',
      label: 'Process Feed Flow Rate vs Surge Margin & Thrust Bearing Load',
      simulatorId: 'compressor',
      parameterKey: 'massFlowKgS',
      unit: 'kg/s',
      min: 10.0,
      max: 35.0,
      steps: 16,
      description: 'Maps the compressor aerodynamic operating trajectory across the Surge Control Line (SCL) and Surge Limit Line (SLL) per API 617.',
      primaryOutputName: 'Surge Margin',
      primaryOutputUnit: '%',
      secondaryOutputName: 'Thrust Pad Load',
      secondaryOutputUnit: '%',
      thresholdWarning: 12, // 12% SCL minimum buffer
      thresholdCritical: 0, // Surge boundary
      thresholdDirection: 'below',
    },
    {
      id: 'compressor-asv',
      label: 'Anti-Surge Valve (ASV) Opening vs Surge Margin Recovery',
      simulatorId: 'compressor',
      parameterKey: 'asvOpeningPercent',
      unit: '%',
      min: 0,
      max: 100,
      steps: 15,
      description: 'Demonstrates how rapid opening of the hot/cold bypass recycle loop restores positive forward flow during turndown.',
      primaryOutputName: 'Surge Margin',
      primaryOutputUnit: '%',
      secondaryOutputName: 'Recycle Mass Flow',
      secondaryOutputUnit: 'kg/s',
      thresholdWarning: 12,
      thresholdCritical: 0,
      thresholdDirection: 'below',
    },
  ],
  bearing: [
    {
      id: 'bearing-severity',
      label: 'Fault Severity (%) vs Vibration Velocity & Kurtosis',
      simulatorId: 'bearing',
      parameterKey: 'faultSeverityPercent',
      unit: '%',
      min: 0,
      max: 100,
      steps: 16,
      description: 'Simulates bearing raceway spall degradation across Stages 1-4, showing acceleration of velocity RMS and kurtosis.',
      primaryOutputName: 'Overall Vibration',
      primaryOutputUnit: 'mm/s RMS',
      secondaryOutputName: 'Kurtosis',
      secondaryOutputUnit: 'dim',
      thresholdWarning: 4.5,
      thresholdCritical: 7.1,
      thresholdDirection: 'above',
    },
    {
      id: 'bearing-speed',
      label: 'Shaft Speed vs Kinematic BPFO Frequency & Fatigue Hours',
      simulatorId: 'bearing',
      parameterKey: 'shaftSpeedRpm',
      unit: 'RPM',
      min: 600,
      max: 3600,
      steps: 16,
      description: 'Calculates the linear scaling of ball pass fault frequencies and inverse speed reduction on ISO 281 L10h rating life.',
      primaryOutputName: 'BPFO Frequency',
      primaryOutputUnit: 'Hz',
      secondaryOutputName: 'L10h Life',
      secondaryOutputUnit: 'hrs',
      thresholdWarning: 200,
      thresholdCritical: 300,
      thresholdDirection: 'above',
    },
  ],
  journal: [
    {
      id: 'journal-speed',
      label: 'Shaft Speed vs Vibration & API 684 Log Decrement',
      simulatorId: 'journal',
      parameterKey: 'shaftSpeedRpm',
      unit: 'RPM',
      min: 1000,
      max: 12000,
      steps: 16,
      description: 'Simulates rotor acceleration into subsynchronous Oil Whirl / Whip and monitors API 684 log decrement crossing zero.',
      primaryOutputName: 'Shaft Vibration',
      primaryOutputUnit: 'µm pk-pk',
      secondaryOutputName: 'Log Decrement δ',
      secondaryOutputUnit: 'dim',
      thresholdWarning: 45,
      thresholdCritical: 68,
      thresholdDirection: 'above',
    },
    {
      id: 'journal-temp',
      label: 'Oil Supply Temp vs Sommerfeld Number & Min Film Thickness',
      simulatorId: 'journal',
      parameterKey: 'oilSupplyTempC',
      unit: '°C',
      min: 25,
      max: 75,
      steps: 16,
      description: 'Evaluates lube oil temperature effect on dynamic viscosity, Sommerfeld number, and fluid film minimum thickness h_min.',
      primaryOutputName: 'Sommerfeld Number',
      primaryOutputUnit: 'dim',
      secondaryOutputName: 'Min Film h_min',
      secondaryOutputUnit: 'µm',
      thresholdWarning: 15,
      thresholdCritical: 8,
      thresholdDirection: 'below',
    },
  ],
  recip: [
    {
      id: 'recip-speed',
      label: 'Crank Speed vs Rod Load Reversal & Indicated Power',
      simulatorId: 'recip',
      parameterKey: 'crankSpeedRpm',
      unit: 'RPM',
      min: 300,
      max: 1200,
      steps: 16,
      description: 'Sweeps compressor shaft speed to evaluate API 618 rod load reversal margin (≥15° crank angle) and indicated brake power scaling.',
      primaryOutputName: 'Rod Reversal',
      primaryOutputUnit: 'deg',
      secondaryOutputName: 'Indicated Power',
      secondaryOutputUnit: 'kW',
      thresholdWarning: 20,
      thresholdCritical: 15,
      thresholdDirection: 'below',
    },
    {
      id: 'recip-discharge-p',
      label: 'Discharge Pressure vs Peak Compression Rod Load & Volumetric Efficiency',
      simulatorId: 'recip',
      parameterKey: 'dischargePressureBarA',
      unit: 'bar(a)',
      min: 8,
      max: 35,
      steps: 15,
      description: 'Simulates high head discharge pressures and examines frame compression overload and clearance re-expansion loss.',
      primaryOutputName: 'Compression Load',
      primaryOutputUnit: 'kN',
      secondaryOutputName: 'Volumetric Eff',
      secondaryOutputUnit: '%',
      thresholdWarning: 120,
      thresholdCritical: 150,
      thresholdDirection: 'above',
    },
  ],
  gearbox: [
    {
      id: 'gearbox-power',
      label: 'Transmitted Duty Power vs AGMA Bending & Contact Safety Factors',
      simulatorId: 'gearbox',
      parameterKey: 'ratedPowerKw',
      unit: 'kW',
      min: 50,
      max: 1000,
      steps: 16,
      description: 'Simulates mechanical torque loading and maps the decay of tooth root bending fatigue and pitch-line contact pitting safety factors per AGMA 2001.',
      primaryOutputName: 'Contact Safety (S_H)',
      primaryOutputUnit: 'x',
      secondaryOutputName: 'Bending Safety (S_F)',
      secondaryOutputUnit: 'x',
      thresholdWarning: 1.25,
      thresholdCritical: 1.0,
      thresholdDirection: 'below',
    },
    {
      id: 'gearbox-lube-temp',
      label: 'Sump Operating Temperature vs EHL Film Ratio (Lambda) & Contact Stress',
      simulatorId: 'gearbox',
      parameterKey: 'oilOperatingTempC',
      unit: '°C',
      min: 35,
      max: 105,
      steps: 15,
      description: 'Evaluates oil viscosity thermal thinning, collapse of Dowson-Higginson elastohydrodynamic (EHL) film thickness, and micro-pitting risk.',
      primaryOutputName: 'Lambda Film Ratio (λ)',
      primaryOutputUnit: 'x',
      secondaryOutputName: 'Contact Stress σ_H',
      secondaryOutputUnit: 'MPa',
      thresholdWarning: 1.4,
      thresholdCritical: 1.0,
      thresholdDirection: 'below',
    },
  ],
  turbine: [
    {
      id: 'turbine-speed',
      label: 'Operating Speed vs Campbell Blade Resonance Margin & Shaft Vibration',
      simulatorId: 'turbine',
      parameterKey: 'operatingSpeedRpm',
      unit: 'RPM',
      min: 3000,
      max: 6500,
      steps: 18,
      description: 'Evaluates turbine rotor speed sweep through critical speeds and stator Nozzle Pass Frequency (NPF) Campbell resonance intersections.',
      primaryOutputName: 'Campbell Resonance Margin',
      primaryOutputUnit: '%',
      secondaryOutputName: 'Shaft Vibration S(p-p)',
      secondaryOutputUnit: 'µm',
      thresholdWarning: 15.0,
      thresholdCritical: 5.0,
      thresholdDirection: 'below',
    },
    {
      id: 'turbine-inlet-temp',
      label: 'Inlet Steam Temperature vs Exhaust Moisture Content & Isentropic Efficiency',
      simulatorId: 'turbine',
      parameterKey: 'inletTemperatureC',
      unit: '°C',
      min: 240,
      max: 480,
      steps: 16,
      description: 'Simulates inlet superheat drop, expansion path shift across the Wilson line, and liquid droplet impingement erosion (LDIE) risk.',
      primaryOutputName: 'Exhaust Moisture (y)',
      primaryOutputUnit: '%',
      secondaryOutputName: 'Isentropic Efficiency η_s',
      secondaryOutputUnit: '%',
      thresholdWarning: 10.0,
      thresholdCritical: 12.0,
      thresholdDirection: 'above',
    },
  ],
};

// ==========================================
// 2. RUN DETERMINISTIC PARAMETRIC SWEEP
// ==========================================

export function runParametricSweep(
  config: SweepConfig,
  currentInputs: Record<string, any>,
  unitSystem: UnitSystem
): SweepPoint[] {
  const points: SweepPoint[] = [];
  const stepSize = (config.max - config.min) / (config.steps - 1);

  for (let i = 0; i < config.steps; i++) {
    const sweepVal = Number((config.min + i * stepSize).toFixed(2));
    const patchedInputs = { ...currentInputs, [config.parameterKey]: sweepVal };

    let y1 = 0;
    let y2: number | undefined = undefined;
    let status: 'safe' | 'warning' | 'critical' = 'safe';
    let insight = '';

    if (config.simulatorId === 'pump') {
      const res = calculatePump(patchedInputs as any);
      if (config.id === 'pump-flow') {
        y1 = Number(res.npshaM.toFixed(2));
        y2 = Number(res.npshrM.toFixed(2));
        status = res.status.level;
        insight = `Margin: ${res.npshMarginRatio.toFixed(2)}x. Flow: ${sweepVal} m³/h.`;
      } else if (config.id === 'pump-temp') {
        y1 = Number(res.npshMarginRatio.toFixed(2));
        y2 = Number((res.vaporPressureKPa / (res.fluidDensityKgM3 * 0.00981)).toFixed(2));
        status = y1 < 1.0 ? 'critical' : y1 < 1.25 ? 'warning' : 'safe';
        insight = `NPSH Margin: ${y1.toFixed(2)}x at ${sweepVal}°C.`;
      } else if (config.id === 'pump-speed') {
        y1 = Number(res.npshMarginRatio.toFixed(2));
        y2 = Number(res.operatingHeadM.toFixed(1));
        status = y1 < 1.0 ? 'critical' : y1 < 1.25 ? 'warning' : 'safe';
        insight = `Head: ${y2}m, Margin: ${y1.toFixed(2)}x at ${sweepVal} RPM.`;
      }
    } else if (config.simulatorId === 'rotor') {
      const res = calculateRotor(patchedInputs as any);
      if (config.id === 'rotor-speed') {
        y1 = Number(res.dynamicUnbalanceForceN.toFixed(0));
        y2 = Number(res.vibrationVelocityRmsMmS.toFixed(2));
        status = (res.vibrationVelocityRmsMmS > 7.1) ? 'critical' : (res.vibrationVelocityRmsMmS > 4.5) ? 'warning' : 'safe';
        insight = `1X Force: ${y1} N, ISO RMS: ${y2} mm/s at ${sweepVal} RPM.`;
      } else if (config.id === 'rotor-unbalance') {
        y1 = Number(((res.modifiedLifeL10mhHours ?? 50000) / 1000).toFixed(1));
        y2 = Number(res.dynamicUnbalanceForceN.toFixed(0));
        status = y1 < 10 ? 'critical' : y1 < 25 ? 'warning' : 'safe';
        insight = `L10mh: ${y1}k hrs, Dyn Load: ${y2} N with ${sweepVal} g·mm unbalance.`;
      }
    } else if (config.simulatorId === 'pipe') {
      const res = calculatePipeStress(patchedInputs as any);
      if (config.id === 'pipe-temp') {
        y1 = Number(res.stressRatioPercent.toFixed(1));
        y2 = Number(res.axialForceKN.toFixed(1));
        status = y1 > 100 ? 'critical' : y1 > 80 ? 'warning' : 'safe';
        insight = `Stress Ratio: ${y1}%, Anchor Thrust: ${y2} kN at ${sweepVal}°C.`;
      } else if (config.id === 'pipe-length') {
        y1 = Number(res.thermalExpansionMm.toFixed(1));
        y2 = Number(res.combinedStressVonMisesMPa.toFixed(1));
        status = y2 > 200 ? 'critical' : y2 > 140 ? 'warning' : 'safe';
        insight = `Elongation: ${y1} mm, SE Stress: ${y2} MPa for ${sweepVal}m pipe run.`;
      }
    } else if (config.simulatorId === 'seal') {
      const res = calculateSealPlan(patchedInputs as any);
      if (config.id === 'seal-pressure') {
        y1 = Number(res.vaporPressureMarginKPa.toFixed(0));
        y2 = Number(res.sealFaceHeatGenKW.toFixed(2));
        status = y1 < 140 ? 'critical' : y1 < 200 ? 'warning' : 'safe';
        insight = `Vapor Margin: ${y1} kPa, Face Heat: ${y2} kW at ${sweepVal} kPag.`;
      } else if (config.id === 'seal-orifice') {
        y1 = Number(res.actualOrificeFlowLpm.toFixed(1));
        y2 = Number(res.requiredFlushFlowLpm.toFixed(1));
        status = y1 < y2 ? 'critical' : y1 < y2 * 1.2 ? 'warning' : 'safe';
        insight = `Delivered: ${y1} L/min vs Req: ${y2} L/min (Orifice ${sweepVal} mm).`;
      }
    } else if (config.simulatorId === 'alignment') {
      const res = calculateAlignment(patchedInputs as any);
      if (config.id === 'alignment-offset') {
        y1 = Number(res.toleranceUtilizationPercent.toFixed(0));
        y2 = Number(res.transmittedRadialShearN.toFixed(0));
        status = y1 > 150 ? 'critical' : y1 > 100 ? 'warning' : 'safe';
        insight = `API 686 Used: ${y1}%, Transmitted Shear: ${y2} N at ${sweepVal} mm offset.`;
      } else if (config.id === 'alignment-temp-diff') {
        y1 = Number(res.hotResultantOffsetMm.toFixed(3));
        y2 = Number(Math.abs(res.frontFootShimAdjustmentMm).toFixed(2));
        status = y1 > 0.4 ? 'critical' : y1 > 0.25 ? 'warning' : 'safe';
        insight = `Hot Offset: ${y1} mm, Front Shim: ${y2} mm at ${sweepVal}°C.`;
      }
    } else if (config.simulatorId === 'compressor') {
      const res = calculateCompressorSurge(patchedInputs as any);
      if (config.id === 'compressor-flow') {
        y1 = Number(res.currentSurgeMarginPercent.toFixed(1));
        y2 = Number(res.thrustBearingLoadPercent.toFixed(0));
        status = y1 < 0 ? 'critical' : y1 < 12 ? 'warning' : 'safe';
        insight = `Surge Margin: ${y1}%, Thrust Load: ${y2}% at ${sweepVal} kg/s.`;
      } else if (config.id === 'compressor-asv') {
        y1 = Number(res.currentSurgeMarginPercent.toFixed(1));
        y2 = Number(res.asvRecycleMassFlowKgS.toFixed(1));
        status = y1 < 0 ? 'critical' : y1 < 12 ? 'warning' : 'safe';
        insight = `Surge Margin: ${y1}%, Recycle Flow: ${y2} kg/s at ${sweepVal}% ASV.`;
      }
    } else if (config.simulatorId === 'bearing') {
      const res = calculateBearingFaults(patchedInputs as any);
      if (config.id === 'bearing-severity') {
        y1 = Number(res.overallVelocityRmsMmS.toFixed(2));
        y2 = Number(res.kurtosis.toFixed(1));
        status = y1 > 7.1 ? 'critical' : y1 > 4.5 ? 'warning' : 'safe';
        insight = `Vibration: ${y1} mm/s RMS (Zone ${res.iso10816Zone}), Kurtosis: ${y2} at ${sweepVal}% defect.`;
      } else if (config.id === 'bearing-speed') {
        y1 = Number(res.frequencies.bpfoHz.toFixed(1));
        y2 = Math.round(res.l10hFatigueHoursRemaining);
        status = y1 > 300 ? 'critical' : y1 > 200 ? 'warning' : 'safe';
        insight = `BPFO: ${y1} Hz, L10h Remaining Life: ${y2.toLocaleString()} hrs at ${sweepVal} RPM.`;
      }
    } else if (config.simulatorId === 'journal') {
      const res = calculateJournalBearing(patchedInputs as any);
      if (config.id === 'journal-speed') {
        y1 = Number(res.totalShaftDisplacementUmPkPk.toFixed(1));
        y2 = Number(res.logarithmicDecrement.toFixed(2));
        status = y1 >= res.api670AlarmLimitUmPkPk ? 'critical' : y2 < 0.1 ? 'warning' : 'safe';
        insight = `S(p-p): ${y1} µm (API 670 Limit: ${res.api670AlarmLimitUmPkPk} µm), Log Dec: ${y2} at ${sweepVal} RPM.`;
      } else if (config.id === 'journal-temp') {
        y1 = Number(res.sommerfeldNumber.toFixed(3));
        y2 = Number(res.minimumFilmThicknessUm.toFixed(1));
        status = y2 < 8 ? 'critical' : y2 < 15 ? 'warning' : 'safe';
        insight = `Sommerfeld: ${y1}, h_min: ${y2} µm at ${sweepVal} °C supply oil.`;
      }
    } else if (config.simulatorId === 'recip') {
      const res = calculateRecipCompressor(patchedInputs as any);
      if (config.id === 'recip-speed') {
        y1 = Number(res.rodLoadReversalDegrees.toFixed(1));
        y2 = Number(res.indicatedPowerKw.toFixed(1));
        status = !res.hasAdequateRodLoadReversal ? 'critical' : y1 < 20 ? 'warning' : 'safe';
        insight = `Reversal: ${y1}° (API 618 min 15°), Indicated Power: ${y2} kW at ${sweepVal} RPM.`;
      } else if (config.id === 'recip-discharge-p') {
        y1 = Number(res.maxCompressionRodLoadKn.toFixed(1));
        y2 = Number(res.effectiveVolumetricEfficiencyPercent.toFixed(1));
        status = res.compressionLoadUtilizationPercent > 100 ? 'critical' : res.compressionLoadUtilizationPercent > 80 ? 'warning' : 'safe';
        insight = `Compression Load: ${y1} kN (${res.compressionLoadUtilizationPercent}%), VE: ${y2}% at ${sweepVal} bar(a).`;
      }
    } else if (config.simulatorId === 'gearbox') {
      const res = calculateGearbox(patchedInputs as any);
      if (config.id === 'gearbox-power') {
        y1 = Number(res.contactSafetyFactorSH.toFixed(2));
        y2 = Number(res.bendingSafetyFactorSF.toFixed(2));
        status = y1 < 1.0 || y2 < 1.0 ? 'critical' : y1 < 1.25 || y2 < 1.4 ? 'warning' : 'safe';
        insight = `Contact S_H: ${y1} (AGMA min 1.25), Bending S_F: ${y2} (min 1.4) at ${sweepVal} kW.`;
      } else if (config.id === 'gearbox-lube-temp') {
        y1 = Number(res.specificFilmThicknessLambda.toFixed(2));
        y2 = Number(res.contactStressMpa.toFixed(0));
        status = y1 < 1.0 ? 'critical' : y1 < 1.4 ? 'warning' : 'safe';
        insight = `EHL Lambda λ: ${y1} (${y1 < 1.0 ? 'Boundary' : y1 < 2.0 ? 'Mixed' : 'Full EHL'}), Contact σ_H: ${y2} MPa at ${sweepVal} °C.`;
      }
    } else if (config.simulatorId === 'turbine') {
      const res = calculateSteamTurbine(patchedInputs as any);
      if (config.id === 'turbine-speed') {
        y1 = Number(res.bladeResonanceMarginPercent.toFixed(1));
        y2 = Number(res.shaftRelativeVibrationUmPkPk.toFixed(1));
        status = res.isBladeResonant || res.isNearCriticalSpeed ? 'critical' : y1 < 15 ? 'warning' : 'safe';
        insight = `Blade Margin: ${y1}%, Shaft S(p-p): ${y2} µm (Zone ${res.iso20816VibrationZone}) at ${sweepVal} RPM.`;
      } else if (config.id === 'turbine-inlet-temp') {
        y1 = Number(res.exhaustMoisturePercent.toFixed(1));
        y2 = Number(res.isentropicEfficiencyPercent.toFixed(1));
        status = res.moistureErosionRiskLevel === 'critical' ? 'critical' : res.moistureErosionRiskLevel === 'warning' ? 'warning' : 'safe';
        insight = `Moisture: ${y1}% (Wilson line: ${res.wilsonLineCrossed ? 'Crossed' : 'Dry'}), η_s: ${y2}% at ${sweepVal} °C.`;
      }
    }

    points.push({
      xValue: sweepVal,
      xLabel: `${sweepVal} ${config.unit}`,
      yValuePrimary: y1,
      yLabelPrimary: `${y1} ${config.primaryOutputUnit}`,
      yValueSecondary: y2,
      yLabelSecondary: y2 !== undefined ? `${y2} ${config.secondaryOutputUnit}` : undefined,
      status,
      insight,
      patchInputs: { [config.parameterKey]: sweepVal },
    });
  }

  return points;
}

// ==========================================
// 3. P-F INTERVAL DEGRADATION STAGES
// ==========================================

export const PF_STAGES: PFStage[] = [
  {
    id: 'stage-p',
    name: 'Point P: Early Ultrasonic & Acoustic Emission',
    detectionTechnology: 'High-Frequency Ultrasound (>20 kHz) / Acoustic Emission',
    pToFRemainingPercent: 100,
    typicalTimeRemainingDays: 180,
    description: 'Subsurface micro-fissures in bearing raceway or incipient microscopic vapor bubble collapse. Undetectable by touch or standard overall vibration.',
    symptomSeverity: 'early',
    vibrationMultiplier: 1.0,
  },
  {
    id: 'stage-vib',
    name: 'Vibration Spectral Excursions (1X / 2X / BPF / Demodulation)',
    detectionTechnology: 'Accelerometer Spectrum & High-Frequency PeakVue/HFE',
    pToFRemainingPercent: 70,
    typicalTimeRemainingDays: 60,
    description: 'Defect frequencies become visible on FFT spectrum (1X unbalance, 2X misalignment, or bearing defect harmonics BPFO/BPFI).',
    symptomSeverity: 'moderate',
    vibrationMultiplier: 1.8,
  },
  {
    id: 'stage-oil',
    name: 'Lubricant Contamination & Wear Debris',
    detectionTechnology: 'Oil Spectrometry & Wear Particle Count (ISO 4406)',
    pToFRemainingPercent: 45,
    typicalTimeRemainingDays: 25,
    description: 'Microscopic metallic flakes accumulate in oil reservoir. Lubricant viscosity degrades and thermal friction begins rising.',
    symptomSeverity: 'moderate',
    vibrationMultiplier: 2.4,
  },
  {
    id: 'stage-audible',
    name: 'Audible Noise & Casing Chattering',
    detectionTechnology: 'Human Ear (Audible Rumble, Pumping Gravel, Coupling Clatter)',
    pToFRemainingPercent: 20,
    typicalTimeRemainingDays: 7,
    description: 'Operators notice audible gravel sound, clatter, or shaking foundation. Macroscopic surface spalling and severe hydraulic cavitation.',
    symptomSeverity: 'severe',
    vibrationMultiplier: 3.8,
  },
  {
    id: 'stage-thermal',
    name: 'Thermal Runaway & Seal Leakage',
    detectionTechnology: 'Infrared Thermography (>85°C) & Mechanical Seal Drip',
    pToFRemainingPercent: 5,
    typicalTimeRemainingDays: 2,
    description: 'Rapid temperature spike, smoking gland packing, vapor plume, or bearing cage collapse. Permanent structural damage underway.',
    symptomSeverity: 'severe',
    vibrationMultiplier: 6.0,
  },
  {
    id: 'stage-f',
    name: 'Point F: Functional Failure & Catastrophic Breakdown',
    detectionTechnology: 'Machine Trip / Motor Overload Breaker / Seal Blowout',
    pToFRemainingPercent: 0,
    typicalTimeRemainingDays: 0,
    description: 'Shaft seizure, impeller disintegration, blown mechanical seal, or severed coupling bolts. Forced unplanned emergency plant shutdown.',
    symptomSeverity: 'catastrophic',
    vibrationMultiplier: 10.0,
  },
];

// ==========================================
// 4. ASSET HEALTH INDEX (AHI) CALCULATOR
// ==========================================

export function calculateAssetHealth(
  simulatorId: SimulatorId,
  inputs: Record<string, any>,
  outputs: any
): AssetHealthScore {
  let score = 95;
  let governingFailureMode = 'Normal wear within design life';
  let pfCurrentStageIndex = 0;
  const factors: AssetHealthScore['reliabilityFactors'] = [];

  if (simulatorId === 'pump') {
    const margin = outputs.npshMarginRatio ?? 1.35;
    const isCritical = outputs.status.level === 'critical';
    const isWarning = outputs.status.level === 'warning';

    if (isCritical) {
      score = 22;
      governingFailureMode = 'Severe hydraulic cavitation & impeller eye erosion';
      pfCurrentStageIndex = 4; // audible/thermal runaway
    } else if (isWarning) {
      score = 58;
      governingFailureMode = 'Insufficient NPSH margin (<1.25x); incipient bubble pitting';
      pfCurrentStageIndex = 2; // vibration / oil debris
    } else {
      score = 92;
      pfCurrentStageIndex = 0;
    }

    factors.push({
      name: 'NPSH Margin Factor',
      score: isCritical ? 20 : isWarning ? 60 : 98,
      weight: 0.4,
      detail: `Margin ratio is ${margin.toFixed(2)}x (Recommended: ≥ 1.35x per HI 9.6.1)`,
      status: isCritical ? 'critical' : isWarning ? 'warning' : 'safe',
    });

    factors.push({
      name: 'Flow Recirculation Risk',
      score: (inputs.flowRateM3h < inputs.bepFlowRateM3h * 0.6) ? 45 : 95,
      weight: 0.3,
      detail: `Operating at ${((inputs.flowRateM3h / inputs.bepFlowRateM3h) * 100).toFixed(0)}% BEP (Min flow: 60%)`,
      status: (inputs.flowRateM3h < inputs.bepFlowRateM3h * 0.6) ? 'warning' : 'safe',
    });

    factors.push({
      name: 'Suction Velocity & Head Loss',
      score: (outputs.fluidVelocityMs > 2.5) ? 60 : 92,
      weight: 0.3,
      detail: `Suction velocity is ${outputs.fluidVelocityMs?.toFixed(2) ?? '1.5'} m/s (Max rec: 2.0 m/s)`,
      status: (outputs.fluidVelocityMs > 2.5) ? 'warning' : 'safe',
    });
  } else if (simulatorId === 'rotor') {
    const vRms = outputs.vibrationVelocityRmsMmS ?? 1.8;
    const l10h = outputs.modifiedLifeL10mhHours ?? 45000;
    const isCritical = outputs.status.level === 'critical';
    const isWarning = outputs.status.level === 'warning';

    if (isCritical) {
      score = 28;
      governingFailureMode = 'Excessive ISO 10816 Zone D vibration & bearing spalling';
      pfCurrentStageIndex = 4;
    } else if (isWarning) {
      score = 62;
      governingFailureMode = 'Elevated 1X dynamic load accelerating bearing fatigue';
      pfCurrentStageIndex = 1;
    } else {
      score = 94;
      pfCurrentStageIndex = 0;
    }

    factors.push({
      name: 'ISO 10816-3 Vibration Severity',
      score: vRms > 7.1 ? 25 : vRms > 4.5 ? 60 : 96,
      weight: 0.45,
      detail: `RMS Velocity: ${vRms.toFixed(2)} mm/s (${outputs.iso10816ZoneDescription ?? 'Zone A'})`,
      status: vRms > 7.1 ? 'critical' : vRms > 4.5 ? 'warning' : 'safe',
    });

    factors.push({
      name: 'ISO 281 Bearing Life L10mh',
      score: l10h < 15000 ? 30 : l10h < 25000 ? 65 : 94,
      weight: 0.35,
      detail: `Modified rating life: ${Math.round(l10h).toLocaleString()} hours (~${(l10h / 8760).toFixed(1)} yrs)`,
      status: l10h < 15000 ? 'critical' : l10h < 25000 ? 'warning' : 'safe',
    });

    factors.push({
      name: 'Lubrication Viscosity Ratio (κ)',
      score: (outputs.viscosityRatioKappa ?? 2.0) < 1.0 ? 50 : 92,
      weight: 0.2,
      detail: `Viscosity ratio κ = ${(outputs.viscosityRatioKappa ?? 2.0).toFixed(2)} (Full elastohydrodynamic film: ≥ 1.0)`,
      status: (outputs.viscosityRatioKappa ?? 2.0) < 1.0 ? 'warning' : 'safe',
    });
  } else if (simulatorId === 'pipe') {
    const stressRatio = outputs.stressRatioPercent ?? 50;
    const isCritical = stressRatio > 100;
    const isWarning = stressRatio > 80;

    if (isCritical) {
      score = 18;
      governingFailureMode = 'ASME B31.3 thermal overstress & nozzle flange deformation';
      pfCurrentStageIndex = 4;
    } else if (isWarning) {
      score = 55;
      governingFailureMode = 'High thermal expansion thrust on pump nozzle flanges';
      pfCurrentStageIndex = 2;
    } else {
      score = 91;
      pfCurrentStageIndex = 0;
    }

    factors.push({
      name: 'ASME B31.3 Stress Utilization',
      score: isCritical ? 20 : isWarning ? 60 : 95,
      weight: 0.5,
      detail: `Displacement stress is ${stressRatio.toFixed(0)}% of allowable limit SA`,
      status: isCritical ? 'critical' : isWarning ? 'warning' : 'safe',
    });

    factors.push({
      name: 'Pump Nozzle Anchor Force',
      score: (outputs.axialForceKN ?? 10) > 40 ? 30 : 90,
      weight: 0.3,
      detail: `Axial thrust on connection: ${(outputs.axialForceKN ?? 10).toFixed(1)} kN`,
      status: (outputs.axialForceKN ?? 10) > 40 ? 'warning' : 'safe',
    });

    factors.push({
      name: 'Thermal Expansion Elongation',
      score: 88,
      weight: 0.2,
      detail: `Free thermal growth ΔL: ${(outputs.thermalExpansionMm ?? 5).toFixed(1)} mm`,
      status: 'safe',
    });
  } else if (simulatorId === 'seal') {
    const vaporMargin = outputs.vaporPressureMarginKPa ?? 300;
    const isCritical = vaporMargin < 140;
    const isWarning = vaporMargin < 200;

    if (isCritical) {
      score = 25;
      governingFailureMode = 'Seal chamber boiling, vapor pocketing & face dry running';
      pfCurrentStageIndex = 4;
    } else if (isWarning) {
      score = 64;
      governingFailureMode = 'Borderline vapor suppression margin (<200 kPa)';
      pfCurrentStageIndex = 1;
    } else {
      score = 93;
      pfCurrentStageIndex = 0;
    }

    factors.push({
      name: 'Vapor Suppression Margin',
      score: isCritical ? 25 : isWarning ? 65 : 96,
      weight: 0.45,
      detail: `Chamber margin: ${vaporMargin.toFixed(0)} kPa (API 682 requirement: ≥ 200 kPa)`,
      status: isCritical ? 'critical' : isWarning ? 'warning' : 'safe',
    });

    factors.push({
      name: 'Flush Heat Removal Balance',
      score: (outputs.actualOrificeFlowLpm < outputs.requiredFlushFlowLpm) ? 40 : 92,
      weight: 0.35,
      detail: `Delivered flush ${(outputs.actualOrificeFlowLpm ?? 8).toFixed(1)} L/min vs Req ${(outputs.requiredFlushFlowLpm ?? 6).toFixed(1)} L/min`,
      status: (outputs.actualOrificeFlowLpm < outputs.requiredFlushFlowLpm) ? 'critical' : 'safe',
    });

    factors.push({
      name: 'Seal Chamber Temperature',
      score: 90,
      weight: 0.2,
      detail: `Chamber temp: ${(outputs.sealChamberOperatingTempC ?? 45).toFixed(1)}°C (Rise: ${(outputs.temperatureRiseC ?? 4).toFixed(1)}°C)`,
      status: 'safe',
    });
  } else if (simulatorId === 'alignment') {
    const tolUsed = outputs.toleranceUtilizationPercent ?? 45;
    const isCritical = tolUsed > 150;
    const isWarning = tolUsed > 100;

    if (isCritical) {
      score = 26;
      governingFailureMode = 'Severe angular & parallel misalignment driving 2X bearing destruction';
      pfCurrentStageIndex = 4;
    } else if (isWarning) {
      score = 60;
      governingFailureMode = 'Exceeding API 686 alignment envelope; coupling reaction elevated';
      pfCurrentStageIndex = 2;
    } else {
      score = 95;
      pfCurrentStageIndex = 0;
    }

    factors.push({
      name: 'API 686 Tolerance Compliance',
      score: isCritical ? 25 : isWarning ? 60 : 97,
      weight: 0.45,
      detail: `Tolerance utilization: ${tolUsed.toFixed(0)}% of API 686 limit`,
      status: isCritical ? 'critical' : isWarning ? 'warning' : 'safe',
    });

    factors.push({
      name: 'Transmitted Shear Reaction',
      score: (outputs.transmittedRadialShearN ?? 100) > 400 ? 50 : 93,
      weight: 0.3,
      detail: `Radial shear: ${(outputs.transmittedRadialShearN ?? 100).toFixed(0)} N on drive-end bearing`,
      status: (outputs.transmittedRadialShearN ?? 100) > 400 ? 'warning' : 'safe',
    });

    factors.push({
      name: '2X Harmonic Vibration Excursion',
      score: (outputs.vibration2XRmsMmS ?? 1.0) > 3.0 ? 40 : 92,
      weight: 0.25,
      detail: `2X harmonic velocity: ${(outputs.vibration2XRmsMmS ?? 1.0).toFixed(2)} mm/s RMS`,
      status: (outputs.vibration2XRmsMmS ?? 1.0) > 3.0 ? 'warning' : 'safe',
    });
  } else if (simulatorId === 'gearbox') {
    const isCritical = outputs.status?.level === 'critical';
    const isWarning = outputs.status?.level === 'warning';
    const sh = outputs.contactSafetyFactorSH ?? 1.3;
    const sf = outputs.bendingSafetyFactorSF ?? 1.5;
    const lambda = outputs.specificFilmThicknessLambda ?? 2.1;

    if (isCritical) {
      score = 24;
      governingFailureMode = 'Severe tooth flank fatigue / broken tooth risk';
      pfCurrentStageIndex = 4;
    } else if (isWarning) {
      score = 62;
      governingFailureMode = 'Micro-pitting initiation / inadequate EHL film thickness';
      pfCurrentStageIndex = 2;
    } else {
      score = 94;
      pfCurrentStageIndex = 0;
    }

    factors.push({
      name: 'AGMA 2001 Contact Safety Factor (S_H)',
      score: sh < 1.0 ? 20 : sh < 1.25 ? 60 : 96,
      weight: 0.4,
      detail: `Pitting resistance S_H: ${sh.toFixed(2)} (AGMA minimum: 1.25)`,
      status: sh < 1.0 ? 'critical' : sh < 1.25 ? 'warning' : 'safe',
    });

    factors.push({
      name: 'AGMA 2001 Bending Safety Factor (S_F)',
      score: sf < 1.0 ? 15 : sf < 1.4 ? 65 : 98,
      weight: 0.35,
      detail: `Tooth root bending S_F: ${sf.toFixed(2)} (AGMA minimum: 1.40)`,
      status: sf < 1.0 ? 'critical' : sf < 1.4 ? 'warning' : 'safe',
    });

    factors.push({
      name: 'EHL Oil Film Thickness Ratio (λ)',
      score: lambda < 1.0 ? 30 : lambda < 1.4 ? 65 : 94,
      weight: 0.25,
      detail: `Specific film λ = ${lambda.toFixed(2)} (${lambda < 1.0 ? 'Boundary' : lambda < 2.0 ? 'Mixed' : 'Full EHL'})`,
      status: lambda < 1.0 ? 'critical' : lambda < 1.4 ? 'warning' : 'safe',
    });
  } else if (simulatorId === 'turbine') {
    const isCritical = outputs.status?.level === 'critical';
    const isWarning = outputs.status?.level === 'warning';
    const resMargin = outputs.bladeResonanceMarginPercent ?? 20;
    const moisture = outputs.exhaustMoisturePercent ?? 8;
    const vib = outputs.shaftRelativeVibrationUmPkPk ?? 30;

    if (isCritical) {
      score = 22;
      governingFailureMode = outputs.status?.message || 'Acoustic blade resonance / severe droplet erosion';
      pfCurrentStageIndex = 4;
    } else if (isWarning) {
      score = 63;
      governingFailureMode = outputs.status?.message || 'Elevated wetness condensation / narrow resonance margin';
      pfCurrentStageIndex = 2;
    } else {
      score = 95;
      pfCurrentStageIndex = 0;
    }

    factors.push({
      name: 'Campbell Blade Resonance & Critical Speed Margin',
      score: resMargin < 5 ? 15 : resMargin < 15 ? 60 : 96,
      weight: 0.4,
      detail: `Separation margin: ${resMargin.toFixed(1)}% (API 612 requirement: ≥ 10% on blading, ≥ 15% on rotor)`,
      status: resMargin < 5 ? 'critical' : resMargin < 15 ? 'warning' : 'safe',
    });

    factors.push({
      name: 'Exhaust Moisture & Droplet Impingement (LDIE)',
      score: moisture > 12 ? 20 : moisture > 9 ? 65 : 95,
      weight: 0.35,
      detail: `Exhaust wetness: ${moisture.toFixed(1)}% (Limit: ${outputs.maxAllowableMoisturePercent ?? 12}%)`,
      status: moisture > 12 ? 'critical' : moisture > 9 ? 'warning' : 'safe',
    });

    factors.push({
      name: 'ISO 20816 Shaft Relative Displacement & Bearing Temp',
      score: vib > 70 ? 25 : vib > 45 ? 65 : 94,
      weight: 0.25,
      detail: `Shaft S(p-p): ${vib.toFixed(1)} µm (ISO Zone ${outputs.iso20816VibrationZone ?? 'A'}), Thrust Temp: ${(outputs.status?.message?.includes('Thrust') ? 115 : 82)}°C`,
      status: vib > 70 ? 'critical' : vib > 45 ? 'warning' : 'safe',
    });
  } else if (simulatorId === 'compressor') {
    const isCritical = outputs.status?.level === 'critical';
    const isWarning = outputs.status?.level === 'warning';
    const surgeMargin = outputs.surgeMarginPercent ?? 15;
    const thrustLoad = outputs.thrustBearingLoadPercent ?? 55;
    const dischTemp = outputs.dischargeTemperatureC ?? 110;

    if (isCritical) {
      score = 20;
      governingFailureMode = outputs.status?.message || 'Aerodynamic flow reversal & surge shockwave damage';
      pfCurrentStageIndex = 4;
    } else if (isWarning) {
      score = 60;
      governingFailureMode = outputs.status?.message || 'Proximity to Surge Control Line (SCL); ASV recycle required';
      pfCurrentStageIndex = 2;
    } else {
      score = 94;
      pfCurrentStageIndex = 0;
    }

    factors.push({
      name: 'API 617 Aerodynamic Surge Margin',
      score: surgeMargin <= 0 ? 10 : surgeMargin < 12 ? 55 : 98,
      weight: 0.45,
      detail: `Operating margin: ${surgeMargin.toFixed(1)}% (API 617 SCL threshold: ≥ 10-12%)`,
      status: surgeMargin <= 0 ? 'critical' : surgeMargin < 12 ? 'warning' : 'safe',
    });

    factors.push({
      name: 'Hydrodynamic Thrust Bearing Capacity',
      score: thrustLoad > 90 ? 25 : thrustLoad > 75 ? 65 : 95,
      weight: 0.35,
      detail: `Active thrust pad loading: ${thrustLoad.toFixed(0)}% of maximum rated allowable`,
      status: thrustLoad > 90 ? 'critical' : thrustLoad > 75 ? 'warning' : 'safe',
    });

    factors.push({
      name: 'Polytropic Discharge Gas Temperature',
      score: dischTemp > 165 ? 30 : dischTemp > 140 ? 65 : 92,
      weight: 0.2,
      detail: `Discharge gas temp: ${dischTemp.toFixed(1)}°C (API 617 ceiling: 150-175°C)`,
      status: dischTemp > 165 ? 'critical' : dischTemp > 140 ? 'warning' : 'safe',
    });
  } else if (simulatorId === 'bearing') {
    const isCritical = outputs.status?.level === 'critical';
    const isWarning = outputs.status?.level === 'warning';
    const vRms = outputs.overallVelocityRmsMmS ?? 1.8;
    const l10h = outputs.l10hFatigueHoursRemaining ?? 35000;
    const kurtosis = outputs.kurtosis ?? 3.0;

    if (isCritical) {
      score = 18;
      governingFailureMode = outputs.status?.message || 'Severe raceway spalling / imminent cage failure';
      pfCurrentStageIndex = 4;
    } else if (isWarning) {
      score = 58;
      governingFailureMode = outputs.status?.message || 'Subsurface micro-cracking & demodulated impact spikes';
      pfCurrentStageIndex = 2;
    } else {
      score = 96;
      pfCurrentStageIndex = 0;
    }

    factors.push({
      name: 'ISO 10816-3 Overall Vibration Velocity',
      score: vRms > 7.1 ? 15 : vRms > 4.5 ? 55 : 97,
      weight: 0.4,
      detail: `RMS Velocity: ${vRms.toFixed(2)} mm/s (${vRms > 7.1 ? 'Zone D' : vRms > 4.5 ? 'Zone C' : 'Zone A/B'})`,
      status: vRms > 7.1 ? 'critical' : vRms > 4.5 ? 'warning' : 'safe',
    });

    factors.push({
      name: 'ISO 281 L10h Rating Fatigue Life',
      score: l10h < 5000 ? 20 : l10h < 18000 ? 60 : 95,
      weight: 0.35,
      detail: `L10h remaining: ${Math.round(l10h).toLocaleString()} hrs (Design target: ≥ 25,000 hrs)`,
      status: l10h < 5000 ? 'critical' : l10h < 18000 ? 'warning' : 'safe',
    });

    factors.push({
      name: 'High Frequency Demodulation Kurtosis',
      score: kurtosis > 6.0 ? 30 : kurtosis > 4.0 ? 65 : 94,
      weight: 0.25,
      detail: `Acceleration Kurtosis: ${kurtosis.toFixed(2)} (Gaussian baseline = 3.0)`,
      status: kurtosis > 6.0 ? 'critical' : kurtosis > 4.0 ? 'warning' : 'safe',
    });
  } else if (simulatorId === 'journal') {
    const isCritical = outputs.status?.level === 'critical';
    const isWarning = outputs.status?.level === 'warning';
    const hMin = outputs.minimumFilmThicknessUm ?? 25;
    const vib = outputs.totalShaftDisplacementUmPkPk ?? 28;
    const stab = outputs.stabilityMarginRatio ?? 1.8;

    if (isCritical) {
      score = 20;
      governingFailureMode = outputs.status?.message || 'Subsynchronous Oil Whip / Babbitt wipe';
      pfCurrentStageIndex = 4;
    } else if (isWarning) {
      score = 62;
      governingFailureMode = outputs.status?.message || 'Thin fluid film lubrication / low Sommerfeld margin';
      pfCurrentStageIndex = 2;
    } else {
      score = 95;
      pfCurrentStageIndex = 0;
    }

    factors.push({
      name: 'Hydrodynamic Minimum Film Thickness (h_min)',
      score: hMin < 10 ? 15 : hMin < 18 ? 60 : 98,
      weight: 0.4,
      detail: `Minimum film thickness: ${hMin.toFixed(1)} µm (Safe limit: ≥ 15 µm)`,
      status: hMin < 10 ? 'critical' : hMin < 18 ? 'warning' : 'safe',
    });

    factors.push({
      name: 'API 670 Shaft Relative Vibration Displacement',
      score: vib > 65 ? 20 : vib > 45 ? 60 : 96,
      weight: 0.35,
      detail: `Shaft displacement: ${vib.toFixed(1)} µm pk-pk (API 670 trip: 65 µm)`,
      status: vib > 65 ? 'critical' : vib > 45 ? 'warning' : 'safe',
    });

    factors.push({
      name: 'API 684 Rotor Dynamic Stability Margin',
      score: stab < 1.0 ? 25 : stab < 1.3 ? 65 : 92,
      weight: 0.25,
      detail: `Stability ratio: ${stab.toFixed(2)}x (Log decrement δ > 0 required)`,
      status: stab < 1.0 ? 'critical' : stab < 1.3 ? 'warning' : 'safe',
    });
  } else if (simulatorId === 'recip') {
    const isCritical = outputs.status?.level === 'critical';
    const isWarning = outputs.status?.level === 'warning';
    const revDeg = outputs.rodLoadReversalDegrees ?? 28;
    const dischT = outputs.actualDischargeTempC ?? 115;
    const puls = outputs.maxPulsationPercentOfLine ?? 1.8;

    if (isCritical) {
      score = 24;
      governingFailureMode = outputs.status?.message || 'Absence of API 618 rod reversal / pin starvation';
      pfCurrentStageIndex = 4;
    } else if (isWarning) {
      score = 62;
      governingFailureMode = outputs.status?.message || 'Elevated valve leakage & acoustic pulsation excursion';
      pfCurrentStageIndex = 2;
    } else {
      score = 93;
      pfCurrentStageIndex = 0;
    }

    factors.push({
      name: 'API 618 Crosshead Pin Rod Load Reversal',
      score: revDeg < 15 ? 15 : revDeg < 22 ? 65 : 98,
      weight: 0.45,
      detail: `Reversal span: ${revDeg.toFixed(1)}° crank angle (API 618 mandatory minimum: ≥ 15°)`,
      status: revDeg < 15 ? 'critical' : revDeg < 22 ? 'warning' : 'safe',
    });

    factors.push({
      name: 'Discharge Valve Temperature & Sealing',
      score: dischT > 150 ? 20 : dischT > 135 ? 65 : 94,
      weight: 0.3,
      detail: `Discharge temperature: ${dischT.toFixed(1)}°C (API 618 ceiling: 150°C)`,
      status: dischT > 150 ? 'critical' : dischT > 135 ? 'warning' : 'safe',
    });

    factors.push({
      name: 'API 688 Cylinder Nozzle Acoustic Pulsation',
      score: puls > 3.0 ? 30 : puls > 2.0 ? 65 : 92,
      weight: 0.25,
      detail: `Line pulsation: ${puls.toFixed(1)}% of line pressure (API 618 limit: ≤ 2.0%)`,
      status: puls > 3.0 ? 'critical' : puls > 2.0 ? 'warning' : 'safe',
    });
  }

  const rating: AssetHealthScore['rating'] =
    score >= 85 ? 'Pristine' :
    score >= 70 ? 'Acceptable' :
    score >= 50 ? 'Caution' :
    score >= 30 ? 'High Risk' : 'Imminent Failure';

  const mtbfHours = Math.round((score / 100) * 35000 + 4000);
  const estimatedRulDays = Math.round((score / 100) * 720);

  return {
    overallScore: score,
    rating,
    mtbfHours,
    estimatedRulDays,
    governingFailureMode,
    pfCurrentStageIndex,
    reliabilityFactors: factors,
  };
}

// ==========================================
// 5. ISO 15663 LIFE CYCLE COST (LCC)
// ==========================================

export function calculateLifeCycleCost(
  simulatorId: SimulatorId,
  healthScore: AssetHealthScore,
  operatingPowerKW: number = 45
): LCCBreakdown {
  const lifetimeYears = 15;
  const annualOperatingHours = 8000;
  const electricityRatePerKWh = 0.11; // $/kWh industrial average

  const initialCapitalCost = 35000;
  const annualEnergyKwh = operatingPowerKW * annualOperatingHours;
  const annualEnergyCost = annualEnergyKwh * electricityRatePerKWh;

  // If equipment is degraded (cavitation, unbalance, misalignment), hydraulic & mechanical friction adds 6-14% wasted power
  const degradationMultiplier = (100 - healthScore.overallScore) / 100;
  const excessEnergyPenalty = annualEnergyCost * (0.08 * degradationMultiplier);

  const annualRoutineMaintenanceCost = 2500;
  
  // Unmitigated vs mitigated parts replacement frequency:
  // Pristine machine: Seal overhaul every 4 years ($4,000 / 4 = $1,000/yr), bearing overhaul every 6 years ($6,000 / 6 = $1,000/yr) -> $2,000/yr
  // High risk / failing machine: Seal fails every 9 months ($5,300/yr), bearing fails every 18 months ($4,000/yr) -> $9,300/yr
  const annualPartsOverhaulCost = 2000 + 7500 * Math.pow(degradationMultiplier, 1.4);

  // Unplanned outage risk: Cost of 1 day downtime in refinery/chemical unit = $25,000
  // Failure probability per year:
  const annualFailureProbability = degradationMultiplier * 0.85;
  const annualUnplannedDowntimeRiskCost = annualFailureProbability * 25000;

  const annualTotalUnmitigated =
    annualEnergyCost + excessEnergyPenalty + annualRoutineMaintenanceCost + annualPartsOverhaulCost + annualUnplannedDowntimeRiskCost;

  const annualTotalMitigated =
    annualEnergyCost + annualRoutineMaintenanceCost + 1800 + (0.04 * 25000); // minimal risk

  const totalLifetimeCostUnmitigated = initialCapitalCost + annualTotalUnmitigated * lifetimeYears;
  const totalLifetimeCostMitigated = initialCapitalCost + annualTotalMitigated * lifetimeYears;
  const potentialLifetimeSavings = Math.max(0, totalLifetimeCostUnmitigated - totalLifetimeCostMitigated);

  return {
    initialCapitalCost,
    annualEnergyKwh,
    annualEnergyCost: Math.round(annualEnergyCost),
    annualRoutineMaintenanceCost,
    annualPartsOverhaulCost: Math.round(annualPartsOverhaulCost),
    annualUnplannedDowntimeRiskCost: Math.round(annualUnplannedDowntimeRiskCost),
    lifetimeYears,
    totalLifetimeCostUnmitigated: Math.round(totalLifetimeCostUnmitigated),
    totalLifetimeCostMitigated: Math.round(totalLifetimeCostMitigated),
    potentialLifetimeSavings: Math.round(potentialLifetimeSavings),
    energySavingsAnnual: Math.round(excessEnergyPenalty),
    downtimeReductionAnnual: Math.round(annualUnplannedDowntimeRiskCost - (0.04 * 25000)),
  };
}

// ==========================================
// 6. API / ISO EQUIPMENT DATASHEET GENERATOR
// ==========================================

export function generateEquipmentDatasheet(
  simulatorId: SimulatorId,
  inputs: Record<string, any>,
  outputs: any,
  unitSystem: UnitSystem
): EquipmentDatasheet {
  const dateStr = new Date().toISOString().split('T')[0];

  if (simulatorId === 'pump') {
    return {
      tagNumber: 'P-101A/B',
      serviceDescription: 'Process Hydrocarbon Charge Pump (API 610 Type OH2)',
      governingStandard: 'API 610 12th Edition / ISO 13709 / HI 9.6.1',
      manufacturer: 'Sulzer / Flowserve Process Machinery Ltd.',
      serialNumber: `AP610-${dateStr.replace(/-/g, '')}-7701`,
      designCode: 'API 610 Centrifugal Overhung End-Suction OH2',
      operatingConditions: [
        { label: 'Rated Flow Rate', value: `${inputs.flowRateM3h}`, unit: 'm³/h' },
        { label: 'BEP Flow Rate', value: `${inputs.bepFlowRateM3h ?? 120}`, unit: 'm³/h' },
        { label: 'Shaft Speed', value: `${inputs.pumpSpeedRpm}`, unit: 'RPM' },
        { label: 'Fluid Temperature', value: `${inputs.fluidTempC}`, unit: '°C' },
        { label: 'Suction Static Head', value: `${inputs.staticHeadM}`, unit: 'm' },
        { label: 'Suction Pipe ID', value: `${inputs.pipeDiameterMm}`, unit: 'mm' },
      ],
      performanceMetrics: [
        { label: 'NPSH Available (NPSHa)', value: `${outputs.npshaM?.toFixed(2)}`, unit: 'm', status: 'Optimal' },
        { label: 'NPSH Required (NPSHr 3%)', value: `${outputs.npshrM?.toFixed(2)}`, unit: 'm' },
        { label: 'NPSH Margin Ratio', value: `${outputs.npshMarginRatio?.toFixed(2)}x`, status: outputs.npshMarginRatio > 1.25 ? 'Safe' : 'Deficient' },
        { label: 'Total Dynamic Head', value: `${outputs.operatingHeadM?.toFixed(1)}`, unit: 'm' },
        { label: 'Suction Line Velocity', value: `${outputs.fluidVelocityMs?.toFixed(2)}`, unit: 'm/s' },
        { label: 'Suction Specific Speed Nss', value: `${outputs.suctionSpecificSpeedUS?.toFixed(0)}`, unit: 'US' },
      ],
      materialsAndSpecs: [
        { label: 'Casing Material', value: 'ASTM A216 Gr. WCB Carbon Steel' },
        { label: 'Impeller Material', value: 'ASTM A743 Gr. CA15 (13Cr Stainless)' },
        { label: 'Shaft Material', value: 'AISI 4140 Quenched & Tempered Alloy' },
        { label: 'Nozzle Rating', value: 'Suction: 6" ANSI 300# RF | Disch: 4" ANSI 300# RF' },
      ],
      designLimitsAndSafety: [
        { label: 'Min Continuous Stable Flow', value: `${((inputs.bepFlowRateM3h ?? 120) * 0.45).toFixed(0)} m³/h` },
        { label: 'Max Allowable Working Pressure (MAWP)', value: '34.5 bar @ 120°C' },
        { label: 'Hydrostatic Test Pressure', value: '51.8 bar (1.5x MAWP)' },
        { label: 'Vibration Acceptance Limit', value: '3.0 mm/s RMS (API 610 Table 8)' },
      ],
    };
  } else if (simulatorId === 'rotor') {
    return {
      tagNumber: 'RTR-204',
      serviceDescription: 'High-Speed Overhung Process Rotor & Bearing Housing Assembly',
      governingStandard: 'ISO 1940-1:2003 / ISO 281:2007 / API 610 §6.9',
      manufacturer: 'SKF / Bently Nevada Asset Protection',
      serialNumber: `ISO1940-${dateStr.replace(/-/g, '')}-9402`,
      designCode: 'API 610 Table 14 Bearing System (Double Row Angular Contact + Cylindrical Roller)',
      operatingConditions: [
        { label: 'Total Rotor Mass', value: `${inputs.rotorMassKg}`, unit: 'kg' },
        { label: 'Operating Speed', value: `${inputs.operatingRpm}`, unit: 'RPM' },
        { label: 'Target Balance Quality Grade', value: `ISO Grade ${inputs.balanceGrade}` },
        { label: 'Static Radial Preload', value: `${inputs.staticRadialLoadN}`, unit: 'N' },
        { label: 'Bearing Type ID', value: `${inputs.bearingModelId}` },
      ],
      performanceMetrics: [
        { label: 'ISO 1940 Permissible Unbalance', value: `${outputs.iso1940PermissibleUnbalanceGmm?.toFixed(1)}`, unit: 'g·mm' },
        { label: 'Actual Residual Unbalance', value: `${outputs.actualUnbalanceGmm?.toFixed(1)}`, unit: 'g·mm' },
        { label: '1X Dynamic Centrifugal Force', value: `${outputs.dynamicUnbalanceForceN?.toFixed(0)}`, unit: 'N' },
        { label: 'ISO 10816 Vibration Severity', value: `${outputs.vibrationVelocityRmsMmS?.toFixed(2)} mm/s RMS (${outputs.iso10816Zone})` },
        { label: 'ISO 281 Modified Life L10mh', value: `${Math.round(outputs.modifiedLifeL10mhHours ?? 0).toLocaleString()}`, unit: 'hours' },
      ],
      materialsAndSpecs: [
        { label: 'Bearing Steel', value: 'High Carbon Chromium 100Cr6 (AISI 52100)' },
        { label: 'Cage Material', value: 'Machined Brass (MB) Window Type' },
        { label: 'Lubricant Specification', value: 'ISO VG 46 Mineral Turbine Oil' },
      ],
      designLimitsAndSafety: [
        { label: 'Min L10h Life Requirement', value: '25,000 operating hours (API 610 §6.9.1)' },
        { label: 'Max Operating Oil Temperature', value: '82°C (Alarm: 70°C, Trip: 85°C)' },
        { label: 'Unbalance Force Ratio Fc/W', value: `${((outputs.dynamicUnbalanceForceN ?? 0) / (inputs.rotorMassKg * 9.81)).toFixed(2)} (Limit: < 0.20)` },
      ],
    };
  } else if (simulatorId === 'pipe') {
    return {
      tagNumber: 'LINE-06-P-3012-A1',
      serviceDescription: 'Hot Heavy Gas Oil Pump Suction Piping System',
      governingStandard: 'ASME B31.3:2022 Section 319 / API 610 Annex F',
      manufacturer: 'Process Piping EPC Fabrication Group',
      serialNumber: `B313-${dateStr.replace(/-/g, '')}-3191`,
      designCode: 'ASME B31.3 Process Piping Flexibility Code',
      operatingConditions: [
        { label: 'Nominal Pipe Size & Schedule', value: '6" NPS / Sch 40' },
        { label: 'Total Unconstrained Run Length', value: `${inputs.pipeLengthM}`, unit: 'm' },
        { label: 'Operating / Ambient Temp', value: `${inputs.operatingTempC} / ${inputs.installationTempC}`, unit: '°C' },
        { label: 'Internal Pressure', value: `${inputs.operatingPressureBar}`, unit: 'bar' },
      ],
      performanceMetrics: [
        { label: 'Free Thermal Elongation ΔL', value: `${outputs.thermalExpansionMm?.toFixed(1)}`, unit: 'mm' },
        { label: 'Combined Stress (Von Mises)', value: `${outputs.combinedStressVonMisesMPa?.toFixed(1)}`, unit: 'MPa' },
        { label: 'ASME Allowable Stress SA', value: `${outputs.allowableStressMPa?.toFixed(1)}`, unit: 'MPa' },
        { label: 'Stress Utilization Ratio', value: `${outputs.stressRatioPercent?.toFixed(0)}%`, status: outputs.stressRatioPercent <= 100 ? 'Pass' : 'Overstressed' },
        { label: 'Resultant Anchor Thrust', value: `${outputs.axialForceKN?.toFixed(1)}`, unit: 'kN' },
      ],
      materialsAndSpecs: [
        { label: 'Piping Material', value: 'ASTM A106 Gr. B Seamless Carbon Steel' },
        { label: 'Specified Min Yield Strength', value: '241 MPa (35,000 psi)' },
        { label: 'Thermal Expansion Coefficient α', value: '1.25 × 10⁻⁵ mm/(mm·°C)' },
      ],
      designLimitsAndSafety: [
        { label: 'Allowable Pump Nozzle Force Fz', value: 'API 610 Table 5 Limit: 16.5 kN' },
        { label: 'Fatigue Cycle Exemption', value: 'f = 1.0 (N ≤ 7,000 thermal cycles)' },
        { label: 'Hydrostatic Shop Test Pressure', value: '1.5 × Design Gauge Pressure' },
      ],
    };
  } else if (simulatorId === 'alignment') {
    return {
      tagNumber: 'MTR-P-101-CPL',
      serviceDescription: 'Motor-to-Pump Flexible Metallic Spacer Coupling Train',
      governingStandard: 'API 686 2nd Edition Chapter 7 / AGMA 9000-D11',
      manufacturer: 'Rexnord Thomas / John Crane Power Transmission',
      serialNumber: `AP686-${dateStr.replace(/-/g, '')}-6867`,
      designCode: 'API 671 / ISO 10441 High Performance Disc Pack Coupling',
      operatingConditions: [
        { label: 'Operating Shaft Speed', value: `${inputs.motorRpm}`, unit: 'RPM' },
        { label: 'DBSE Spacer Length', value: `${inputs.couplingSpacerLengthMm}`, unit: 'mm' },
        { label: 'Motor Foot Distance B / C', value: `${inputs.distCouplingToMotorFrontFootMm} / ${inputs.distMotorFrontToRearFootMm}`, unit: 'mm' },
        { label: 'Operating Fluid Temperature', value: `${inputs.pumpFluidTempC}`, unit: '°C' },
      ],
      performanceMetrics: [
        { label: 'Hot Resultant Parallel Offset', value: `${outputs.hotResultantOffsetMm?.toFixed(3)}`, unit: 'mm' },
        { label: 'Hot Resultant Angular Offset', value: `${outputs.hotResultantAngleMrad?.toFixed(2)}`, unit: 'mrad' },
        { label: 'API 686 Tolerance Utilization', value: `${outputs.toleranceUtilizationPercent?.toFixed(0)}%`, status: outputs.toleranceUtilizationPercent <= 100 ? 'Within Limits' : 'Exceeded' },
        { label: 'Front / Rear Foot Shims', value: `F: ${outputs.frontFootShimAdjustmentMm?.toFixed(2)} mm | R: ${outputs.rearFootShimAdjustmentMm?.toFixed(2)} mm` },
        { label: 'Transmitted Shear Reaction', value: `${outputs.transmittedRadialShearN?.toFixed(0)}`, unit: 'N' },
        { label: '2X Harmonic Vibration Velocity', value: `${outputs.vibration2XRmsMmS?.toFixed(2)}`, unit: 'mm/s RMS' },
      ],
      materialsAndSpecs: [
        { label: 'Coupling Disc Element', value: 'AISI 301 High Tensile Stainless Disc Pack' },
        { label: 'Spacer Material', value: 'AISI 4140 Dynamic Balanced Alloy' },
        { label: 'Shimming Stock Material', value: 'Pre-cut 304 Stainless Steel Shims (Burr-Free)' },
      ],
      designLimitsAndSafety: [
        { label: 'Max Soft Foot Distortion', value: '0.05 mm (0.002 in) per foot' },
        { label: 'Max Spacer Bolt Torque', value: '185 N·m (Calibrated torque wrench)' },
        { label: 'Coupling Guard Design', value: 'API 610 §6.12 Spark-Proof Non-Contact Guard' },
      ],
    };
  } else if (simulatorId === 'gearbox') {
    return {
      tagNumber: 'GBX-301',
      serviceDescription: 'Heavy-Duty Industrial Parallel-Shaft Reduction Gearbox',
      governingStandard: 'AGMA 2001-D04 / ISO 6336 / API 613 5th Edition',
      manufacturer: 'Flender / Hansen Industrial Transmissions',
      serialNumber: `AGMA-${dateStr.replace(/-/g, '')}-5531`,
      designCode: 'API 613 Special Purpose Single/Double Reduction Helical Gear Unit',
      operatingConditions: [
        { label: 'Input Power Rating', value: `${inputs.ratedPowerKw}`, unit: 'kW' },
        { label: 'Input Shaft Speed', value: `${inputs.inputSpeedRpm}`, unit: 'RPM' },
        { label: 'Output Shaft Speed', value: `${outputs.outputSpeedRpm?.toFixed(1)}`, unit: 'RPM' },
        { label: 'Gear Ratio (i)', value: `${outputs.gearRatio?.toFixed(2)}:1` },
        { label: 'Pinion / Gear Teeth', value: `${inputs.pinionTeeth} / ${inputs.gearTeeth}` },
        { label: 'Sump Oil Temperature', value: `${inputs.oilOperatingTempC}`, unit: '°C' },
      ],
      performanceMetrics: [
        { label: 'AGMA Contact Safety Factor S_H', value: `${outputs.contactSafetyFactorSH?.toFixed(2)}`, status: outputs.contactSafetyFactorSH >= 1.25 ? 'Adequate' : 'Deficient' },
        { label: 'AGMA Bending Safety Factor S_F', value: `${outputs.bendingSafetyFactorSF?.toFixed(2)}`, status: outputs.bendingSafetyFactorSF >= 1.4 ? 'Adequate' : 'Deficient' },
        { label: 'Gear Mesh Frequency (GMF)', value: `${outputs.gearMeshFrequencyHz?.toFixed(1)}`, unit: 'Hz' },
        { label: 'Specific Film Thickness (λ)', value: `${outputs.specificFilmThicknessLambda?.toFixed(2)}x`, status: outputs.specificFilmThicknessLambda >= 1.4 ? 'Safe' : 'Boundary' },
        { label: 'Pitch Line Velocity (v_t)', value: `${outputs.pitchLineVelocityMs?.toFixed(1)}`, unit: 'm/s' },
        { label: 'ISO 10816-3 Casing Vibration', value: `${outputs.overallVibrationMmSRms?.toFixed(2)}`, unit: 'mm/s RMS' },
      ],
      materialsAndSpecs: [
        { label: 'Gear Tooth Material', value: '18CrNiMo7-6 Carburized Case-Hardened Alloy Steel' },
        { label: 'Surface Hardness (Pinion/Gear)', value: '60 HRC / 58 HRC' },
        { label: 'Core Hardness', value: '30-35 HRC' },
        { label: 'Lubricant Specification', value: `${inputs.lubricant?.replace(/_/g, ' ').toUpperCase()}` },
      ],
      designLimitsAndSafety: [
        { label: 'Min AGMA Contact Safety S_H', value: '≥ 1.25 (API 613 §2.3.2)' },
        { label: 'Min AGMA Bending Safety S_F', value: '≥ 1.40 (API 613 §2.3.1)' },
        { label: 'Hunting Tooth Condition', value: outputs.commonFactorsGcd === 1 ? 'True Hunting Tooth (GCD=1)' : `Harmonic Repeat (GCD=${outputs.commonFactorsGcd})` },
        { label: 'Vibration Trip Threshold', value: '7.1 mm/s RMS (ISO 10816-3 Zone C boundary)' },
      ],
    };
  } else if (simulatorId === 'turbine') {
    return {
      tagNumber: 'ST-201',
      serviceDescription: 'Multi-Stage Special-Purpose Mechanical Drive Steam Turbine',
      governingStandard: 'API 612 8th Edition / ASME PTC 6 / ISO 20816-2',
      manufacturer: 'Siemens Energy / Elliott Group / GE Vernova',
      serialNumber: `API612-${dateStr.replace(/-/g, '')}-8842`,
      designCode: 'API 612 Special Purpose Mechanical Drive Steam Turbine (Horizontal Casing)',
      operatingConditions: [
        { label: 'Rated Shaft Power', value: `${inputs.ratedPowerKw}`, unit: 'kW' },
        { label: 'Operating Speed', value: `${inputs.operatingSpeedRpm}`, unit: 'RPM' },
        { label: 'Inlet Steam Pressure', value: `${inputs.inletPressureBar}`, unit: 'bar(a)' },
        { label: 'Inlet Steam Temperature', value: `${inputs.inletTemperatureC}`, unit: '°C' },
        { label: 'Exhaust Pressure', value: `${inputs.exhaustPressureBar}`, unit: 'bar(a)' },
        { label: 'Number of Stages', value: `${inputs.numberOfStages}`, unit: 'Stages' },
      ],
      performanceMetrics: [
        { label: 'Isentropic Efficiency η_s', value: `${outputs.isentropicEfficiencyPercent?.toFixed(1)}%`, status: outputs.isentropicEfficiencyPercent >= 75 ? 'Optimal' : 'Sub-Optimal' },
        { label: 'Actual Steam Rate (ASR)', value: `${outputs.actualSteamRateAsrKgKwh?.toFixed(2)}`, unit: 'kg/kWh' },
        { label: 'Exhaust Moisture Content (y)', value: `${outputs.exhaustMoisturePercent?.toFixed(1)}%`, status: outputs.moistureErosionRiskLevel === 'safe' ? 'Safe' : 'Erosion Risk' },
        { label: 'Critical Speed Separation Margin', value: `${outputs.criticalSpeedSeparationMarginPercent?.toFixed(1)}%`, status: outputs.criticalSpeedSeparationMarginPercent >= 15 ? 'Safe' : 'Deficient' },
        { label: 'Campbell Blade Resonance Margin', value: `${outputs.bladeResonanceMarginPercent?.toFixed(1)}%`, status: outputs.bladeResonanceMarginPercent >= 10 ? 'Safe' : 'Resonant' },
        { label: 'Shaft Relative Vibration S(p-p)', value: `${outputs.shaftRelativeVibrationUmPkPk?.toFixed(1)}`, unit: 'µm' },
      ],
      materialsAndSpecs: [
        { label: 'Rotor Shaft Forging', value: 'ASTM A470 Class 8 NiCrMoV Vacuum Degassed Alloy Steel' },
        { label: 'Last Stage (L-0) Blades', value: '17-4PH / X12CrNiMoV12-3 Martensitic Stainless' },
        { label: 'Erosion Shielding', value: inputs.stelliteErosionShieldInstalled ? 'Stellite 6 Brazed Leading Edge Shield' : 'Unshielded' },
        { label: 'Bearing Type', value: '5-Pad Tilting Pad Radial Journal Bearings & Double-Acting Kingsbury Thrust' },
      ],
      designLimitsAndSafety: [
        { label: 'Overspeed Bolt Trip Setting', value: `${outputs.overspeedTripThresholdRpm} RPM (110% of rated speed)` },
        { label: 'Min API 612 Critical Margin', value: '≥ 15.0% separation above and below operating speed' },
        { label: 'Max Exhaust Wetness Limit', value: `${outputs.maxAllowableMoisturePercent}% moisture without erosion damage` },
        { label: 'API 670 Vibration Trip Limit', value: '65 µm peak-to-peak shaft relative displacement' },
      ],
    };
  } else if (simulatorId === 'compressor') {
    return {
      tagNumber: 'K-101',
      serviceDescription: 'Centrifugal Process Gas Compressor Train',
      governingStandard: 'API 617 8th Edition / ASME PTC 10 / ISO 10439',
      manufacturer: 'Siemens Energy / Baker Hughes / Solar Turbines',
      serialNumber: `API617-${dateStr.replace(/-/g, '')}-7712`,
      designCode: 'API 617 Special Purpose Horizontally/Vertically Split Centrifugal Compressor',
      operatingConditions: [
        { label: 'Process Gas Medium', value: `${inputs.gasType?.toUpperCase() || 'HYDROCARBON MIX'}` },
        { label: 'Suction Pressure / Temp', value: `${inputs.suctionPressureBarA} bar(a) / ${inputs.suctionTempC}°C` },
        { label: 'Mass Flow Throughput', value: `${inputs.massFlowKgS}`, unit: 'kg/s' },
        { label: 'Compressor Shaft Speed', value: `${inputs.compressorRpm}`, unit: 'RPM' },
        { label: 'Anti-Surge Valve (ASV)', value: `${inputs.asvOpeningPercent}% Open` },
      ],
      performanceMetrics: [
        { label: 'Aerodynamic Surge Margin', value: `${outputs.surgeMarginPercent?.toFixed(1)}%`, status: outputs.surgeMarginPercent >= 10 ? 'Safe Margin' : 'Near Surge' },
        { label: 'Discharge Pressure', value: `${outputs.dischargePressureBarA?.toFixed(2)}`, unit: 'bar(a)' },
        { label: 'Discharge Gas Temp', value: `${outputs.dischargeTemperatureC?.toFixed(1)}`, unit: '°C' },
        { label: 'Polytropic Head', value: `${outputs.polytropicHeadKjKg?.toFixed(1)}`, unit: 'kJ/kg' },
        { label: 'Shaft Gas Power', value: `${outputs.gasPowerKw?.toFixed(0)}`, unit: 'kW' },
        { label: 'Thrust Pad Loading', value: `${outputs.thrustBearingLoadPercent?.toFixed(0)}%`, status: outputs.thrustBearingLoadPercent <= 75 ? 'Safe' : 'High Load' },
      ],
      materialsAndSpecs: [
        { label: 'Impeller Material', value: '17-4PH Precipitation Hardened Stainless Steel' },
        { label: 'Shaft Forging', value: 'AISI 4340 Quenched and Tempered Alloy Steel' },
        { label: 'Shaft End Seals', value: 'Tandem Dry Gas Seals (API 692 Plan 11/72/76)' },
      ],
      designLimitsAndSafety: [
        { label: 'API 617 SCL Safety Line', value: '≥ 10.0% mass flow buffer above surge limit line' },
        { label: 'Max Discharge Gas Temp', value: '150°C continuous allowable' },
        { label: 'ASV Full-Stroke Speed', value: '< 1.5 seconds for complete trip-open response' },
      ],
    };
  } else if (simulatorId === 'bearing') {
    return {
      tagNumber: 'BRG-DE-101',
      serviceDescription: 'Rolling Element Bearing Vibration & Fault Diagnostic Assembly',
      governingStandard: 'ISO 281:2007 / ISO 15243 / ABMA Std 9 / ISO 10816-3',
      manufacturer: 'SKF / Schaeffler FAG / NSK Motion & Control',
      serialNumber: `ISO281-${dateStr.replace(/-/g, '')}-4421`,
      designCode: 'Precision Anti-Friction Rolling Element Bearing',
      operatingConditions: [
        { label: 'Bearing Model / Type', value: `${inputs.bearingModel || 'SKF 6309 Deep Groove'}` },
        { label: 'Operating Shaft Speed', value: `${inputs.shaftSpeedRpm}`, unit: 'RPM' },
        { label: 'Radial / Axial Load', value: `${inputs.radialLoadKn} kN / ${inputs.axialLoadKn} kN` },
        { label: 'Lubricant Viscosity', value: `${inputs.lubricantViscosityCst || 46}`, unit: 'cSt @ 40°C' },
      ],
      performanceMetrics: [
        { label: 'ISO 281 Basic Life L10h', value: `${Math.round(outputs.l10hHours || 35000).toLocaleString()}`, unit: 'hrs' },
        { label: 'Modified Rating Life L10mh', value: `${Math.round(outputs.l10hFatigueHoursRemaining || 40000).toLocaleString()}`, unit: 'hrs' },
        { label: 'Overall Vibration Velocity', value: `${outputs.overallVelocityRmsMmS?.toFixed(2)}`, unit: 'mm/s RMS' },
        { label: 'Acceleration Kurtosis', value: `${outputs.kurtosis?.toFixed(2)}`, status: outputs.kurtosis <= 3.5 ? 'Normal' : 'Peaked' },
        { label: 'Ball Pass Outer (BPFO)', value: `${outputs.bpfoHz?.toFixed(1)}`, unit: 'Hz' },
        { label: 'Ball Pass Inner (BPFI)', value: `${outputs.bpfiHz?.toFixed(1)}`, unit: 'Hz' },
      ],
      materialsAndSpecs: [
        { label: 'Ring & Rolling Element Alloy', value: '100Cr6 / SAE 52100 High Carbon Chromium Steel' },
        { label: 'Cage Material', value: 'Machined Brass / Polyamide 66 Cage' },
        { label: 'Cleanliness Factor eC', value: '0.6 (Normal Industrial Cleanliness)' },
      ],
      designLimitsAndSafety: [
        { label: 'API 610 Minimum Bearing Life', value: '≥ 25,000 continuous hours at rated conditions' },
        { label: 'ISO 10816-3 Alarm / Trip', value: 'Alarm: 4.5 mm/s | Trip: 7.1 mm/s RMS' },
        { label: 'Max Operating Temperature', value: '95°C bearing housing metal temperature' },
      ],
    };
  } else if (simulatorId === 'journal') {
    return {
      tagNumber: 'JB-NDE-201',
      serviceDescription: 'Tilting-Pad Hydrodynamic Fluid Film Journal Bearing',
      governingStandard: 'API 670 5th Edition / API 684 / DIN 31657',
      manufacturer: 'Waukesha Bearings / Kingsbury / Miba Bearings',
      serialNumber: `API670-${dateStr.replace(/-/g, '')}-9011`,
      designCode: '5-Pad Tilting Pad Rocker-Pivot Radial Hydrodynamic Bearing',
      operatingConditions: [
        { label: 'Journal Shaft Diameter', value: `${inputs.journalDiameterMm}`, unit: 'mm' },
        { label: 'Bearing Length (L/D)', value: `${inputs.bearingLengthMm} mm (L/D = ${(inputs.bearingLengthMm / inputs.journalDiameterMm).toFixed(2)})` },
        { label: 'Diametral Clearance', value: `${(inputs.radialClearanceUm * 2).toFixed(0)}`, unit: 'µm' },
        { label: 'Operating Speed', value: `${inputs.shaftSpeedRpm}`, unit: 'RPM' },
        { label: 'Static Gravity Load', value: `${inputs.radialStaticLoadN}`, unit: 'N' },
      ],
      performanceMetrics: [
        { label: 'Minimum Film Thickness (h_min)', value: `${outputs.minimumFilmThicknessUm?.toFixed(1)}`, unit: 'µm', status: outputs.minimumFilmThicknessUm >= 15 ? 'Safe' : 'Critical Film' },
        { label: 'Hydrodynamic Sommerfeld No.', value: `${outputs.sommerfeldNumber?.toFixed(3)}` },
        { label: 'Shaft Relative Vibration', value: `${outputs.totalShaftDisplacementUmPkPk?.toFixed(1)}`, unit: 'µm pk-pk' },
        { label: 'Peak Babbitt Metal Temp', value: `${outputs.peakBabbittTemperatureC?.toFixed(1)}`, unit: '°C' },
        { label: 'Rotor Dynamic Stability Margin', value: `${outputs.stabilityMarginRatio?.toFixed(2)}x`, status: outputs.stabilityMarginRatio >= 1.2 ? 'Stable' : 'Unstable' },
      ],
      materialsAndSpecs: [
        { label: 'Babbitt Lining Material', value: 'ASTM B23 Grade 2 Tin-Based Babbitt (89% Sn, 7.5% Sb, 3.5% Cu)' },
        { label: 'Pad Backing Material', value: 'Low Carbon Steel / Copper-Chromium Alloy' },
        { label: 'Lube Oil Grade', value: 'ISO VG 32 / VG 46 Turbine Lube Oil (Turbinol)' },
      ],
      designLimitsAndSafety: [
        { label: 'API 670 Vibration Alarm/Trip', value: 'Alarm: 45 µm | Trip: 65 µm pk-pk' },
        { label: 'Max Allowable Babbitt Temp', value: '100°C maximum continuous (API 670)' },
        { label: 'Minimum Film Thickness', value: '≥ 15.0 µm to prevent asperity contact' },
      ],
    };
  } else if (simulatorId === 'recip') {
    return {
      tagNumber: 'C-201',
      serviceDescription: 'API 618 Process Reciprocating Gas Compressor Cylinder',
      governingStandard: 'API 618 5th Edition / API 688 / ISO 13631',
      manufacturer: 'Ariel Corporation / Burckhardt Compression / Dresser-Rand',
      serialNumber: `API618-${dateStr.replace(/-/g, '')}-6182`,
      designCode: 'API 618 Balanced-Opposed Horizontal Reciprocating Compressor Frame',
      operatingConditions: [
        { label: 'Crankshaft Speed', value: `${inputs.crankSpeedRpm}`, unit: 'RPM' },
        { label: 'Cylinder Bore × Stroke', value: `${inputs.cylinderBoreMm} mm × ${inputs.pistonStrokeMm} mm` },
        { label: 'Suction / Discharge Pressure', value: `${inputs.suctionPressureBarA} / ${inputs.dischargePressureBarA}`, unit: 'bar(a)' },
        { label: 'Clearance Volume', value: `${inputs.clearanceVolumePercent || 12}%` },
      ],
      performanceMetrics: [
        { label: 'Rod Load Reversal Span', value: `${outputs.rodLoadReversalDegrees?.toFixed(1)}°`, status: outputs.rodLoadReversalDegrees >= 15 ? 'Safe Reversal' : 'Non-Reversal' },
        { label: 'Peak Compression Rod Load', value: `${outputs.peakCompressionLoadKn?.toFixed(1)}`, unit: 'kN' },
        { label: 'Peak Tension Rod Load', value: `${outputs.peakTensionLoadKn?.toFixed(1)}`, unit: 'kN' },
        { label: 'Actual Discharge Temp', value: `${outputs.actualDischargeTempC?.toFixed(1)}`, unit: '°C' },
        { label: 'Nozzle Acoustic Pulsation', value: `${outputs.maxPulsationPercentOfLine?.toFixed(1)}%`, status: outputs.maxPulsationPercentOfLine <= 2.0 ? 'Acceptable' : 'Excessive' },
        { label: 'Indicated Power', value: `${outputs.indicatedPowerKw?.toFixed(1)}`, unit: 'kW' },
      ],
      materialsAndSpecs: [
        { label: 'Piston Rod Material', value: 'AISI 4140 Induction-Hardened Rolled Threads' },
        { label: 'Cylinder Liner', value: 'Centrifugally Cast Ni-Resist Ductile Iron' },
        { label: 'Valve Plates', value: 'PEEK (Polyetheretherketone) Non-Metallic Plates' },
      ],
      designLimitsAndSafety: [
        { label: 'API 618 Mandatory Rod Reversal', value: '≥ 15.0° crank angle with ≥ 3% load reversal' },
        { label: 'Max Discharge Temperature', value: '150°C (API 618 §6.1.1 limit)' },
        { label: 'Max Permissible Pulsation', value: '≤ 2.0% of line pressure per API 688 design approach 3' },
      ],
    };
  } else {
    return {
      tagNumber: 'SEAL-P-101',
      serviceDescription: 'Mechanical Seal Flush Piping Auxiliary System',
      governingStandard: 'API 682 4th Edition / ISO 21049 / API 610 §6.8',
      manufacturer: 'John Crane / EagleBurgmann Mechanical Seals',
      serialNumber: `AP682-${dateStr.replace(/-/g, '')}-6824`,
      designCode: 'API 682 Category 1/2 Arrangement 1/2/3 Cartridge Seal',
      operatingConditions: [
        { label: 'Selected Flush Plan', value: `${inputs.planId}` },
        { label: 'Seal Balance Diameter', value: `${inputs.sealSizeMm}`, unit: 'mm' },
        { label: 'Seal Chamber Pressure P_box', value: `${inputs.sealChamberPressureKPag}`, unit: 'kPag' },
        { label: 'Discharge Pressure P_disch', value: `${inputs.pumpDischargePressureKPag}`, unit: 'kPag' },
        { label: 'Shaft Speed', value: `${inputs.shaftSpeedRpm}`, unit: 'RPM' },
      ],
      performanceMetrics: [
        { label: 'Frictional Face Heat Q_face', value: `${outputs.sealFaceHeatGenKW?.toFixed(2)}`, unit: 'kW' },
        { label: 'Required Flush Flow Rate', value: `${outputs.requiredFlushFlowLpm?.toFixed(1)}`, unit: 'L/min' },
        { label: 'Actual Orifice Flow Delivery', value: `${outputs.actualOrificeFlowLpm?.toFixed(1)}`, unit: 'L/min' },
        { label: 'Vapor Pressure Suppression Margin', value: `${outputs.vaporPressureMarginKPa?.toFixed(0)}`, unit: 'kPa' },
        { label: 'Chamber Operating Temperature', value: `${outputs.sealChamberOperatingTempC?.toFixed(1)}`, unit: '°C' },
      ],
      materialsAndSpecs: [
        { label: 'Rotating Seal Face', value: 'Reaction Bonded Silicon Carbide (SiC)' },
        { label: 'Stationary Seal Face', value: 'Premium Resin-Impregnated Carbon Graphite' },
        { label: 'Secondary Elastomers', value: 'Fluoroelastomer (FKM / Kalrez Perfluoroelastomer)' },
        { label: 'Flush Piping Material', value: '1/2" OD × 0.065" W.T. 316L Stainless Steel Tubing' },
      ],
      designLimitsAndSafety: [
        { label: 'Min Vapor Margin Requirement', value: '≥ 200 kPa (or 10°C boiling margin)' },
        { label: 'Max Allowable Temp Rise ΔT', value: '5.0°C across seal faces' },
        { label: 'Min Orifice Bore Diameter', value: '3.0 mm (API 682 §8.6 anti-clogging rule)' },
      ],
    };
  }
}
