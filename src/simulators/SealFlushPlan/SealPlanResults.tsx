import React, { useMemo } from 'react';
import { SealOutputs, SealInputs } from '../../types/seal';
import { UnitSystem } from '../../types/common';
import { ResultsPanel, ResultKPI, ResultGauge, ResultEventItem } from '../../components/Shared/ResultsPanel';
import { calculateSealFaceTribology } from '../../physics/sealTribologyMath';

interface SealPlanResultsProps {
  outputs: SealOutputs;
  inputs: SealInputs;
  unitSystem: UnitSystem;
}

export const SealPlanResults: React.FC<SealPlanResultsProps> = ({
  outputs,
  inputs,
  unitSystem,
}) => {
  const tribology = useMemo(() => {
    return calculateSealFaceTribology({ inputs, outputs });
  }, [inputs, outputs]);

  const isSafe = outputs.status.level === 'safe';
  const isWarning = outputs.status.level === 'warning';
  const isCritical = outputs.status.level === 'critical' || tribology.hasVaporFlash;

  const tempRise = Math.max(0, outputs.sealChamberOperatingTempC - inputs.processFluidTempC);

  // 1. One-line live insight
  let liveInsight = `Stable hydrodynamic liquid film (h=${tribology.meanFilmThicknessUm.toFixed(2)} µm) with ${outputs.vaporPressureMarginKPa.toFixed(0)} kPa vapor margin.`;
  if (outputs.isPressureDifferentialInverted) {
    liveInsight = inputs.planId === 'plan_52'
      ? `CRITICAL INVERSION: Plan 52 Buffer pressure (${inputs.barrierBufferPressureKPag} kPag) exceeds chamber pressure. Inner faces blown open!`
      : `CRITICAL INVERSION: Barrier pressure (${inputs.barrierBufferPressureKPag} kPag) is LOWER than chamber pressure (${inputs.sealChamberPressureKPag} kPag). Dual barrier containment lost!`;
  } else if (tribology.hasVaporFlash) {
    liveInsight = `Sub-micron vapor flash at r=${tribology.boilingRadiusMm?.toFixed(1)}mm (${tribology.puffingFrequencyHz} Hz chatter, ${tribology.acousticChatterDb.toFixed(0)} dB). Face puffing active.`;
  } else if (isCritical) {
    liveInsight = 'Vapor margin collapsed below 140 kPa (20 psi). High risk of explosive face vaporization and dry blistering.';
  } else if (outputs.actualFlushFlowLpm < outputs.requiredFlushFlowLpm) {
    liveInsight = `Flush flow (${outputs.actualFlushFlowLpm.toFixed(1)} L/min) is insufficient to remove frictional face heat (${outputs.sealFaceHeatGenKW.toFixed(1)} kW).`;
  } else if (isWarning) {
    liveInsight = `Elevated chamber temperature (+${tempRise.toFixed(1)}°C rise) eroding vapor pressure margin.`;
  } else if (inputs.planId.startsWith('plan_5') && outputs.barrierPressureDifferentialKPa < 140) {
    liveInsight = 'Barrier fluid differential pressure below API 682 140 kPa minimum over seal chamber pressure.';
  }

  // 2. Recommended action (single short line)
  let recommendedAction = 'Mechanical seal operating in stable liquid lubrication regime per API 682 standard.';
  if (tribology.hasVaporFlash) {
    recommendedAction = 'Increase flush flow rate or upgrade to Plan 23 closed loop cooler immediately to suppress face vapor flash.';
  } else if (isCritical) {
    recommendedAction = 'Increase flush orifice diameter or switch to cooled Plan 23 loop immediately to prevent face blowout.';
  } else if (isWarning) {
    recommendedAction = 'Verify cooling water flow rate to Plan 21/23 heat exchanger and check orifice for clogging.';
  }

  // 3. Key KPIs (6 items)
  const kpis: ResultKPI[] = [
    {
      id: 'actualFlush',
      label: 'Actual Flush Flow',
      value: outputs.actualFlushFlowLpm,
      unit: 'L/min',
      decimals: 2,
      status: outputs.actualFlushFlowLpm < outputs.requiredFlushFlowLpm ? 'critical' : 'safe',
      helperText: `Req: ≥ ${outputs.requiredFlushFlowLpm.toFixed(1)} L/min`,
    },
    {
      id: 'filmGap',
      label: 'Mean Film Gap (h)',
      value: tribology.meanFilmThicknessUm,
      unit: 'µm',
      decimals: 2,
      status: tribology.meanFilmThicknessUm < 0.5 ? 'critical' : tribology.meanFilmThicknessUm < 0.8 ? 'warning' : 'safe',
      helperText: `Coning: ${tribology.coningAngleUrad.toFixed(1)} µrad`,
    },
    {
      id: 'chamberTemp',
      label: 'Chamber Temp (T_box)',
      value: outputs.sealChamberOperatingTempC,
      unit: '°C',
      decimals: 1,
      status: outputs.sealChamberOperatingTempC > 140 ? 'critical' : outputs.sealChamberOperatingTempC > 100 ? 'warning' : 'safe',
      helperText: `Process: ${inputs.processFluidTempC}°C`,
    },
    {
      id: 'faceHeat',
      label: 'Frictional Face Heat',
      value: outputs.sealFaceHeatGenKW,
      unit: 'kW',
      decimals: 2,
      status: 'neutral',
      helperText: `Peak T: ${tribology.maxFaceTempC.toFixed(0)}°C`,
    },
    {
      id: 'chatterEmissions',
      label: 'Acoustic Emission',
      value: tribology.acousticChatterDb,
      unit: 'dB',
      decimals: 0,
      status: tribology.hasVaporFlash ? 'critical' : 'safe',
      helperText: tribology.hasVaporFlash ? `${tribology.puffingFrequencyHz} Hz Chatter` : 'Quiet (< 45 dB)',
    },
    {
      id: 'leakageEst',
      label: 'Laminar Leakage',
      value: tribology.estimatedLeakageMlPerHour,
      unit: 'mL/h',
      decimals: 1,
      status: tribology.estimatedLeakageMlPerHour > 5.0 ? 'warning' : 'safe',
      helperText: 'API 682 Standard',
    },
  ];

  // 4. Circular Gauges
  const gauges: ResultGauge[] = [
    {
      id: 'vaporMargin',
      title: 'Vapor Suppression Margin',
      value: Math.max(0, outputs.vaporPressureMarginKPa),
      min: 0,
      max: 600,
      unit: 'kPa',
      warningThreshold: 250,
      criticalThreshold: 140,
      inverseZones: true,
      targetValue: 140,
      targetLabel: 'API 682 Min',
    },
    {
      id: 'chamberTempGauge',
      title: 'Chamber Operating Temp',
      value: outputs.sealChamberOperatingTempC,
      min: 10,
      max: 200,
      unit: '°C',
      warningThreshold: 100,
      criticalThreshold: 140,
      inverseZones: false,
      targetValue: inputs.processFluidTempC,
      targetLabel: 'Process T',
    },
  ];

  // 5. Diagnostics Event Log (Max 5 items)
  const events: ResultEventItem[] = [
    {
      id: 'ev-1',
      level: tribology.hasVaporFlash ? 'critical' : 'safe',
      message: tribology.hasVaporFlash
        ? `Vapor flash active: boiling at r=${tribology.boilingRadiusMm?.toFixed(1)}mm across ${tribology.vaporZoneWidthPercent.toFixed(0)}% of contact face.`
        : 'Hydrodynamic fluid film intact without micro-boiling or cavitation.',
    },
    {
      id: 'ev-2',
      level: tribology.coningClassification === 'diverging_pinch' ? 'warning' : 'info',
      message: `Thermal coning angle β = ${tribology.coningAngleUrad.toFixed(1)} µrad (${tribology.coningClassification.replace('_', ' ')}).`,
    },
    {
      id: 'ev-3',
      level: outputs.api682VaporMarginCompliant ? 'safe' : 'critical',
      message: `Vapor margin: ${outputs.vaporPressureMarginKPa.toFixed(0)} kPa (${outputs.api682VaporMarginCompliant ? 'Within Guideline' : 'Deficient'}).`,
    },
  ];

  if (tribology.hasVaporFlash) {
    events.push({
      id: 'ev-4',
      level: 'critical',
      message: `Acoustic puffing detected at ${tribology.puffingFrequencyHz} Hz (${tribology.acousticChatterDb.toFixed(0)} dB). Blistering index: ${tribology.blisteringRiskIndex}%.`,
    });
  }

  return (
    <ResultsPanel
      status={outputs.status}
      mainResult={{
        label: 'Vapor Suppression Margin',
        value: outputs.vaporPressureMarginKPa,
        rawNumericValue: outputs.vaporPressureMarginKPa,
        unit: 'kPa',
        decimals: 0,
        status: outputs.status.level,
      }}
      simulatorId="seal"
      inputs={inputs}
      outputs={outputs}
      unitSystem={unitSystem}
      liveInsight={liveInsight}
      kpis={kpis}
      gauges={gauges}
      events={events}
      trendLabel="Vapor Margin Trend (kPa)"
      recommendedAction={recommendedAction}
    />
  );
};
