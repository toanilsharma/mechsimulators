import React from 'react';
import { PipeOutputs, PipeInputs } from '../../types/pipe';
import { UnitSystem } from '../../types/common';
import { ResultsPanel, ResultKPI, ResultGauge } from '../../components/Shared/ResultsPanel';
import { convertLengthMm, convertForceKn } from '../../utils/units';

interface PipeStressResultsProps {
  outputs: PipeOutputs;
  inputs: PipeInputs;
  unitSystem: UnitSystem;
}

export const PipeStressResults: React.FC<PipeStressResultsProps> = ({
  outputs,
  inputs,
  unitSystem,
}) => {
  const growthConv = convertLengthMm(outputs.thermalExpansionMm, unitSystem);
  const forceConv = convertForceKn(outputs.axialForceKN, unitSystem);
  const nozzleConv = convertForceKn(outputs.nozzleLoadKN, unitSystem);

  const isSafe = outputs.stressState === 'safe';
  const isWarning = outputs.stressState === 'warning';
  const isCritical = outputs.stressState === 'critical';

  // 1. One-line live insight
  let liveInsight = `Thermal expansion (${growthConv.val.toFixed(1)} ${growthConv.unit}) safely absorbed by pipe routing. Code compliant.`;
  if (isCritical) {
    liveInsight = `Thermal expansion stress (${(outputs.combinedStressVonMisesMPa ?? outputs.axialStressMPa ?? 0).toFixed(0)} MPa) exceeds ASME B31.3 allowable limit SA (${(outputs.allowableStressMPa ?? 0).toFixed(0)} MPa).`;
  } else if (outputs.nozzleLoadRatioPercent > 100) {
    liveInsight = `Pump nozzle reaction (${nozzleConv.val.toFixed(1)} ${nozzleConv.unit}) exceeds API 610 allowable casing limits.`;
  } else if (isWarning) {
    liveInsight = `Thermal stress ratio is ${(outputs.stressRatioPercent ?? 0).toFixed(0)}% of code limit. Verification of guide clearances recommended.`;
  } else if (inputs.constraintFactorType === 'fully_restrained' || inputs.anchorCondition === 'anchored_both_ends') {
    liveInsight = `Fully restrained pipeline: high axial thermal thrust (${forceConv.val.toFixed(1)} ${forceConv.unit}) on end anchors.`;
  }

  // 2. Recommended action (single short line)
  let recommendedAction = 'Piping flexibility verified compliant with ASME B31.3 allowable displacement stress range.';
  if (isCritical) {
    recommendedAction = 'Install larger expansion U-loop or flexible bellows to reduce thermal moments on equipment nozzles.';
  } else if (isWarning) {
    recommendedAction = 'Check pipe support sliding shoes for binding and ensure spring hanger travel range is adequate.';
  }

  // 3. Key KPIs (4 to 6)
  const kpis: ResultKPI[] = [
    {
      id: 'thermalGrowth',
      label: 'Thermal Growth (ΔL)',
      value: growthConv.val,
      unit: growthConv.unit,
      decimals: 1,
      status: 'neutral',
      helperText: `T_op: ${inputs.operatingTempC}°C`,
    },
    {
      id: 'expansionStress',
      label: 'Combined Stress (σ)',
      value: outputs.combinedStressVonMisesMPa ?? outputs.axialStressMPa ?? 0,
      unit: 'MPa',
      decimals: 1,
      status: (outputs.combinedStressVonMisesMPa ?? outputs.axialStressMPa ?? 0) > (outputs.allowableStressMPa ?? 0) ? 'critical' : 'safe',
      helperText: 'Von Mises displacement stress',
    },
    {
      id: 'allowableStress',
      label: 'Allowable Stress (SA)',
      value: outputs.allowableStressMPa ?? 0,
      unit: 'MPa',
      decimals: 1,
      status: 'neutral',
      helperText: 'ASME B31.3 Code Limit',
    },
    {
      id: 'axialForce',
      label: 'Axial Anchor Thrust',
      value: forceConv.val,
      unit: forceConv.unit,
      decimals: 1,
      status: outputs.axialForceKN > 150 ? 'warning' : 'neutral',
      helperText: 'Thermal anchor reaction',
    },
    {
      id: 'nozzleLoad',
      label: 'Nozzle Reaction Load',
      value: nozzleConv.val,
      unit: nozzleConv.unit,
      decimals: 1,
      status: outputs.nozzleLoadRatioPercent > 100 ? 'critical' : outputs.nozzleLoadRatioPercent > 80 ? 'warning' : 'safe',
      helperText: `${(outputs.nozzleLoadRatioPercent ?? 0).toFixed(0)}% API 610 Limit`,
    },
    {
      id: 'codeMargin',
      label: 'Flexibility Margin',
      value: Math.max(0, 100 - outputs.stressRatioPercent),
      unit: '%',
      decimals: 0,
      status: outputs.stressRatioPercent > 100 ? 'critical' : outputs.stressRatioPercent > 80 ? 'warning' : 'safe',
      helperText: 'Remaining stress capacity',
    },
  ];

  // 4. Circular Gauges (1 or 2)
  const gauges: ResultGauge[] = [
    {
      id: 'stressRatio',
      title: 'ASME Stress Ratio (SE/SA)',
      value: outputs.stressRatioPercent,
      min: 0,
      max: 180,
      unit: '%',
      warningThreshold: 80,
      criticalThreshold: 100,
      inverseZones: false,
      targetValue: 100,
      targetLabel: 'Limit',
    },
    {
      id: 'nozzleLoadRatio',
      title: 'Nozzle Reaction Ratio',
      value: Math.abs(outputs.nozzleLoadRatioPercent),
      min: 0,
      max: 180,
      unit: '%',
      warningThreshold: 80,
      criticalThreshold: 100,
      inverseZones: false,
      targetValue: 100,
      targetLabel: 'API Limit',
    },
  ];

  const statusLevel = isCritical ? 'critical' : isWarning ? 'warning' : 'safe';

  return (
    <ResultsPanel
      status={{
        level: statusLevel,
        label: outputs.status.label,
        message: outputs.status.message,
      }}
      simulatorId="pipe"
      inputs={inputs}
      outputs={outputs}
      unitSystem={unitSystem}
      mainResult={{
        label: 'ASME B31.3 Stress Ratio',
        value: outputs.stressRatioPercent,
        rawNumericValue: outputs.stressRatioPercent,
        unit: '%',
        decimals: 0,
        status: statusLevel,
      }}
      liveInsight={liveInsight}
      kpis={kpis}
      gauges={gauges}
      trendLabel="Stress Ratio Trend (%)"
      recommendedAction={recommendedAction}
    />
  );
};
