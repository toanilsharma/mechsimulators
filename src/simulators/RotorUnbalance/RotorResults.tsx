import React from 'react';
import { RotorOutputs, RotorInputs } from '../../types/rotor';
import { UnitSystem } from '../../types/common';
import { ResultsPanel, ResultKPI, ResultGauge } from '../../components/Shared/ResultsPanel';
import { convertForce } from '../../utils/units';

interface RotorResultsProps {
  outputs: RotorOutputs;
  inputs: RotorInputs;
  unitSystem: UnitSystem;
}

export const RotorResults: React.FC<RotorResultsProps> = ({
  outputs,
  inputs,
  unitSystem,
}) => {
  const forceConv = convertForce(outputs.dynamicUnbalanceForceN, unitSystem);
  const isSafe = outputs.status.level === 'safe';
  const isWarning = outputs.status.level === 'warning';
  const isCritical = outputs.status.level === 'critical';

  const separationMargin = Math.abs(1 - (outputs.speedRatioLambda || 1)) * 100;
  const isResonance = outputs.isNearCriticalSpeed;
  const isLubePoor = inputs.lubricationCondition === 'poor';

  // 1. One-line live insight
  let liveInsight = `Operating in ISO 10816 Zone ${outputs.iso10816Zone} with ${separationMargin.toFixed(0)}% resonance margin.`;
  if (isResonance) {
    liveInsight = `CRITICAL RESONANCE: Operating near lateral critical speed (λ ≈ ${outputs.speedRatioLambda.toFixed(2)}). Dynamic whirl magnification.`;
  } else if (inputs.bearingPosition === 'overhung') {
    liveInsight = `OH2 Overhung Design: Inboard bearing load amplified to ${outputs.inboardBearingDynamicForceN.toFixed(0)} N (${((outputs.inboardBearingDynamicForceN / Math.max(1, outputs.dynamicUnbalanceForceN)) * 100).toFixed(0)}% Fc) by cantilever overhang.`;
  } else if (outputs.dynamicUnbalanceForceN > 2500) {
    liveInsight = `Unbalance force is ${outputs.dynamicUnbalanceForceN.toFixed(0)} N (${(outputs.forceToRotorWeightRatio * 100).toFixed(0)}% rotor weight), stressing bearing raceways.`;
  } else if (isLubePoor) {
    liveInsight = 'Bearing life is falling rapidly due to poor lubrication (a_lube = 0.50). Micro-spalling risk.';
  } else if (isCritical) {
    liveInsight = 'Vibration velocity exceeds ISO 10816 Zone D trip threshold. High danger of fatigue damage.';
  } else if (isWarning) {
    liveInsight = `Actual unbalance (${outputs.actualUnbalanceGmm.toFixed(0)} g·mm) exceeds ISO 1940 Grade ${inputs.balanceGrade} limit.`;
  }

  // 2. Recommended action (single short line)
  let recommendedAction = 'Continue routine condition-based monitoring and bearing vibration tracking.';
  if (isCritical) {
    recommendedAction = 'Perform emergency stop: dynamic balancing required or shift speed away from lateral resonance.';
  } else if (isWarning) {
    recommendedAction = 'Plan dynamic trim balancing during next maintenance outage; replenish lubricant.';
  }

  // 3. Key KPIs (4 to 6)
  const kpis: ResultKPI[] = [
    {
      id: 'dynamicForce',
      label: 'Dynamic Unbalance (Fc)',
      value: forceConv.val,
      unit: forceConv.unit,
      decimals: 0,
      status: outputs.dynamicUnbalanceForceN > 2500 ? 'critical' : outputs.dynamicUnbalanceForceN > 1200 ? 'warning' : 'safe',
      helperText: `${(outputs.forceToRotorWeightRatio * 100).toFixed(0)}% rotor weight`,
    },
    {
      id: 'vibrationRms',
      label: 'Vibration Velocity RMS',
      value: outputs.vibrationVelocityRmsMmS,
      unit: 'mm/s',
      decimals: 2,
      status: outputs.vibrationVelocityRmsMmS > 4.5 ? 'critical' : outputs.vibrationVelocityRmsMmS > 2.8 ? 'warning' : 'safe',
      helperText: `ISO 10816 Zone ${outputs.iso10816Zone}`,
    },
    {
      id: 'isoPermissible',
      label: 'ISO 1940 Limit (Uper)',
      value: outputs.iso1940PermissibleUnbalanceGmm,
      unit: 'g·mm',
      decimals: 0,
      status: outputs.actualUnbalanceGmm > outputs.iso1940PermissibleUnbalanceGmm ? 'warning' : 'safe',
      helperText: `Grade G${inputs.balanceGrade}`,
    },
    {
      id: 'critSpeedMargin',
      label: 'Critical Speed Margin',
      value: separationMargin,
      unit: '%',
      decimals: 1,
      status: separationMargin < 15 ? 'critical' : separationMargin < 25 ? 'warning' : 'safe',
      helperText: `Ncrit: ${outputs.criticalSpeedRpm.toFixed(0)} RPM`,
    },
    {
      id: 'bearingLoadRatio',
      label: 'Load Capacity Ratio (C/P)',
      value: outputs.loadRatioCP,
      unit: 'x',
      decimals: 2,
      status: outputs.loadRatioCP < 4.0 ? 'critical' : outputs.loadRatioCP < 6.0 ? 'warning' : 'safe',
      helperText: `Dynamic P: ${outputs.equivalentDynamicLoadP_N.toFixed(0)} N`,
    },
    {
      id: 'basicLife',
      label: 'Basic Rating Life L10h',
      value: Math.round(outputs.basicLifeL10hHours),
      unit: 'hrs',
      decimals: 0,
      status: outputs.basicLifeL10hHours < 10000 ? 'critical' : outputs.basicLifeL10hHours < 25000 ? 'warning' : 'safe',
      helperText: 'Unmodified catalog life',
    },
  ];

  // 4. Circular Gauges (1 or 2)
  const gauges: ResultGauge[] = [
    {
      id: 'vibrationSeverity',
      title: 'Vibration Severity',
      value: outputs.vibrationVelocityRmsMmS,
      min: 0,
      max: 10.0,
      unit: 'mm/s',
      warningThreshold: 2.8,
      criticalThreshold: 4.5,
      inverseZones: false,
      targetValue: 1.4,
      targetLabel: 'Zone A',
    },
    {
      id: 'bearingLifeRating',
      title: 'L10mh Life Rating',
      value: Math.min(100, (outputs.modifiedLifeL10mhHours / 25000) * 100),
      min: 0,
      max: 100,
      unit: '%',
      warningThreshold: 60,
      criticalThreshold: 30,
      inverseZones: true,
      targetValue: 100,
      targetLabel: 'API Target',
    },
  ];

  return (
    <ResultsPanel
      status={outputs.status}
      mainResult={{
        label: 'ISO 281 L10mh Rating Life',
        value: Math.round(outputs.modifiedLifeL10mhHours),
        rawNumericValue: outputs.modifiedLifeL10mhHours,
        unit: 'hrs',
        decimals: 0,
        status: outputs.status.level,
      }}
      simulatorId="rotor"
      inputs={inputs}
      outputs={outputs}
      unitSystem={unitSystem}
      liveInsight={liveInsight}
      kpis={kpis}
      gauges={gauges}
      trendLabel="L10mh Life Trend (hrs)"
      recommendedAction={recommendedAction}
    />
  );
};
