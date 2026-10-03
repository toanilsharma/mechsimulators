import React from 'react';
import { AlignmentOutputs, AlignmentInputs } from '../../types/alignment';
import { UnitSystem } from '../../types/common';
import { ResultsPanel, ResultKPI, ResultGauge, ResultEventItem } from '../../components/Shared/ResultsPanel';

interface AlignmentResultsProps {
  outputs: AlignmentOutputs;
  inputs: AlignmentInputs;
  unitSystem: UnitSystem;
}

export const AlignmentResults: React.FC<AlignmentResultsProps> = ({
  outputs,
  inputs,
  unitSystem,
}) => {
  const isSafe = outputs.status.level === 'safe';
  const isCritical = outputs.status.level === 'critical';

  // 1. Live Engineering Insight
  let liveInsight = `Coaxial running alignment maintained: Resultant offset ${outputs.hotResultantOffsetMm.toFixed(3)} mm (API 686 limit: ${outputs.allowableParallelOffsetMm} mm).`;
  if (isCritical) {
    liveInsight = `Severe misalignment: Hot offset ${outputs.hotResultantOffsetMm.toFixed(2)} mm (${outputs.toleranceUtilizationPercent.toFixed(0)}% of API 686 limit). High 2X vibration harmonic (${outputs.vibration2XRmsMmS.toFixed(1)} mm/s RMS, Zone ${outputs.iso10816Zone}).`;
  } else if (!outputs.softFootCompliant) {
    liveInsight = `Soft foot violation on anchor pads (max ${outputs.maxSoftFootMm.toFixed(2)} mm > 0.05 mm limit), causing motor frame twist and elevated 1X vibration.`;
  } else if (outputs.toleranceUtilizationPercent > 100) {
    liveInsight = `Out of API 686 tolerance (${outputs.toleranceUtilizationPercent.toFixed(0)}% utilization). Bearing dynamic reaction overload: +${outputs.motorBearingAdditionalRadialLoadN.toFixed(0)} N.`;
  }

  // 2. Recommended Action
  let recommendedAction = 'Maintain current verified shim packs and hold-down bolt torque.';
  if (isCritical || outputs.toleranceUtilizationPercent > 100) {
    recommendedAction = `Install shims: Front Feet ${outputs.frontFootShimAdjustmentMm >= 0 ? '+' : ''}${outputs.frontFootShimAdjustmentMm.toFixed(2)} mm, Rear Feet ${outputs.rearFootShimAdjustmentMm >= 0 ? '+' : ''}${outputs.rearFootShimAdjustmentMm.toFixed(2)} mm.`;
  } else if (!outputs.softFootCompliant) {
    recommendedAction = 'Clean foot pads, dress burrs, and install partial shims to reduce soft foot below 0.05 mm.';
  }

  // 3. 6 Key Industrial KPIs
  const kpis: ResultKPI[] = [
    {
      id: 'hotOffset',
      label: 'Hot Parallel Offset',
      value: outputs.hotResultantOffsetMm,
      unit: 'mm',
      decimals: 3,
      status: outputs.hotResultantOffsetMm > outputs.allowableParallelOffsetMm ? 'critical' : outputs.hotResultantOffsetMm > outputs.allowableParallelOffsetMm * 0.7 ? 'warning' : 'safe',
      helperText: `API 686 Max: ${outputs.allowableParallelOffsetMm} mm`,
    },
    {
      id: 'hotAngle',
      label: 'Hot Angular Tilt',
      value: outputs.hotResultantAngleMrad,
      unit: 'mrad',
      decimals: 2,
      status: outputs.hotResultantAngleMrad > outputs.allowableAngularOffsetMrad ? 'critical' : outputs.hotResultantAngleMrad > outputs.allowableAngularOffsetMrad * 0.7 ? 'warning' : 'safe',
      helperText: `API 686 Max: ${outputs.allowableAngularOffsetMrad} mrad`,
    },
    {
      id: 'frontShim',
      label: 'Front Foot Shim ΔS_F',
      value: outputs.frontFootShimAdjustmentMm,
      unit: 'mm',
      decimals: 2,
      status: 'neutral',
      helperText: outputs.frontFootShimAdjustmentMm >= 0 ? 'Add Shims' : 'Remove Shims',
    },
    {
      id: 'rearShim',
      label: 'Rear Foot Shim ΔS_R',
      value: outputs.rearFootShimAdjustmentMm,
      unit: 'mm',
      decimals: 2,
      status: 'neutral',
      helperText: outputs.rearFootShimAdjustmentMm >= 0 ? 'Add Shims' : 'Remove Shims',
    },
    {
      id: 'shearReaction',
      label: 'Coupling Shear Reaction',
      value: outputs.transmittedRadialShearN,
      unit: 'N',
      decimals: 0,
      status: outputs.transmittedRadialShearN > 1500 ? 'warning' : 'safe',
      helperText: `Bearing: +${outputs.motorBearingAdditionalRadialLoadN.toFixed(0)} N`,
    },
    {
      id: 'vibrationTotal',
      label: 'Vibration Severity',
      value: outputs.totalVibrationRmsMmS,
      unit: 'mm/s',
      decimals: 2,
      status: outputs.iso10816Zone === 'D' ? 'critical' : outputs.iso10816Zone === 'C' ? 'warning' : 'safe',
      helperText: `ISO 10816 Zone ${outputs.iso10816Zone}`,
    },
  ];

  // 4. Circular Gauges
  const gauges: ResultGauge[] = [
    {
      id: 'toleranceGauge',
      title: 'API 686 Utilization',
      value: Math.min(200, outputs.toleranceUtilizationPercent),
      min: 0,
      max: 200,
      unit: '%',
      warningThreshold: 70,
      criticalThreshold: 100,
      targetValue: 50,
      targetLabel: 'API 686 (≤50%)',
    },
    {
      id: 'fatigueGauge',
      title: 'Disc Pack Safety Factor',
      value: Math.min(4.0, outputs.couplingFatigueSafetyFactor),
      min: 0,
      max: 4.0,
      unit: 'SF',
      warningThreshold: 1.8,
      criticalThreshold: 1.3,
      inverseZones: true,
      targetValue: 2.0,
      targetLabel: 'AGMA 9000 Rec',
    },
  ];

  // 5. Diagnostics Event Log (Max 5 events)
  const events: ResultEventItem[] = [
    {
      id: 'ev-1',
      level: outputs.api686HotRunningCompliant ? 'safe' : 'critical',
      message: outputs.api686HotRunningCompliant
        ? `Hot operating alignment within recommended tolerance at ${inputs.motorRpm} RPM.`
        : `TOLERANCE EXCEEDED: Hot offset (${outputs.hotResultantOffsetMm.toFixed(3)} mm) exceeds allowable ${outputs.allowableParallelOffsetMm} mm limit.`,
    },
    {
      id: 'ev-2',
      level: outputs.softFootCompliant ? 'safe' : 'critical',
      message: outputs.softFootCompliant
        ? `Soft foot check within limits: Maximum deflection ${outputs.maxSoftFootMm.toFixed(3)} mm (≤ 0.05 mm limit).`
        : `SOFT FOOT DEFECT: Anchor deflection ${outputs.maxSoftFootMm.toFixed(3)} mm exceeds 0.05 mm guideline criterion.`,
    },
    {
      id: 'ev-3',
      level: outputs.api686ColdTargetCompliant ? 'safe' : 'warning',
      message: `Cold target vertical offset: ${outputs.coldTargetVerticalOffsetMm.toFixed(3)} mm (Net thermal growth: +${outputs.netThermalOffsetMm.toFixed(3)} mm).`,
    },
    {
      id: 'ev-4',
      level: outputs.iso10816Zone === 'D' ? 'critical' : outputs.iso10816Zone === 'C' ? 'warning' : 'safe',
      message: `2X RPM vibration harmonic: ${outputs.vibration2XRmsMmS.toFixed(2)} mm/s RMS (Total RMS: ${outputs.totalVibrationRmsMmS.toFixed(2)} mm/s, Zone ${outputs.iso10816Zone}).`,
    },
  ];

  if ((inputs.pipingInducedNozzleMomentKnm || 0) > 1.5) {
    events.push({
      id: 'ev-5',
      level: 'warning',
      message: `Piping nozzle strain: ${inputs.pipingInducedNozzleMomentKnm} kN·m external moment tilting pump shaft end by ${(inputs.pipingInducedNozzleMomentKnm * 0.18).toFixed(2)} mrad.`,
    });
  }

  return (
    <ResultsPanel
      status={outputs.status}
      unitSystem={unitSystem}
      simulatorId="alignment"
      inputs={inputs}
      outputs={outputs}
      mainResult={{
        label: 'API 686 Tolerance Utilization',
        value: Math.round(outputs.toleranceUtilizationPercent),
        rawNumericValue: outputs.toleranceUtilizationPercent,
        unit: '%',
        decimals: 0,
        status: outputs.status.level,
      }}
      liveInsight={liveInsight}
      kpis={kpis}
      gauges={gauges}
      events={events}
      trendLabel="API 686 Tolerance Utilization (%)"
      recommendedAction={recommendedAction}
    />
  );
};
