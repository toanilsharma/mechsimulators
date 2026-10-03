import { PhysicsAnimationParams, PhysicsAnimationMappingItem, AnimationIntensity } from './types';
import { PumpInputs, PumpOutputs } from '../types/pump';
import { RotorInputs, RotorOutputs } from '../types/rotor';
import { PipeInputs, PipeOutputs } from '../types/pipe';
import { SealInputs, SealOutputs } from '../types/seal';

/**
 * Master Physics-to-Animation Mapping Table.
 * Every animation effect in the app is mapped directly to an engineering calculation.
 * No arbitrary/decorative animations are permitted.
 */
export const PHYSICS_ANIMATION_MAPPING_TABLE: PhysicsAnimationMappingItem[] = [
  // 1. Centrifugal Pump Cavitation & NPSH
  {
    simulator: 'pump',
    effectName: 'Fluid Flow Streamline Speed',
    visualProperty: 'Particle velocity along suction & discharge paths',
    governingVariable: 'outputs.fluidVelocityMs & inputs.flowRateM3h',
    formulaOrRule: 'v = Q / A (scaled: 1.5 m/s = 1.0x baseline animation speed)',
    unitOrScale: 'm/s (0.1x to 4.0x speed)',
  },
  {
    simulator: 'pump',
    effectName: 'Cavitation Vapor Bubbles',
    visualProperty: 'Bubble spawn rate, radius & cloud density at impeller eye',
    governingVariable: 'outputs.npshaM, outputs.npshrM, outputs.npshMarginRatio',
    formulaOrRule: 'Active when NPSHa <= NPSHr (Severity = (NPSHr - NPSHa) * 0.2 + 0.6)',
    faultThreshold: 'NPSH Margin < 0 m (Severe Flashing)',
    unitOrScale: '0.0 to 1.0 intensity',
  },
  {
    simulator: 'pump',
    effectName: 'Casing Structural Shake & Vibration',
    visualProperty: 'High-frequency micro-oscillation of pump volute',
    governingVariable: 'outputs.bubbleCollapseIntensityScore & blade pass frequency',
    formulaOrRule: 'Acoustic shock wave amplitude from micro-jet collapse score / 100',
    faultThreshold: 'Bubble Collapse Score > 40',
    unitOrScale: '0.0 to 1.0 amplitude',
  },
  {
    simulator: 'pump',
    effectName: 'Impeller Eye Thermal / Erosion Glow',
    visualProperty: 'Radial luminance & pitting aura at blade leading edges',
    governingVariable: 'outputs.cavitationRiskPercent & inputs.fluidTempC',
    formulaOrRule: 'Glow alpha & color mapped to fluid temp and cavitation risk > 25%',
    faultThreshold: 'Cavitation Risk > 30%',
    unitOrScale: 'RGB(A) spectrum',
  },
  {
    simulator: 'pump',
    effectName: 'Suction Tank Liquid Level',
    visualProperty: 'Static suction supply liquid height on inlet vessel',
    governingVariable: 'inputs.staticHeadM',
    formulaOrRule: 'Physical geometric height Z_s relative to pump centerline (0 m)',
    unitOrScale: 'Meters (-6m to +10m)',
  },
  {
    simulator: 'pump',
    effectName: 'Critical Status Warning Pulse',
    visualProperty: 'Pulsing crimson glow on pump volute & warning badge',
    governingVariable: 'outputs.status.level === "critical"',
    formulaOrRule: 'Triggers when NPSHa <= NPSHr or Flow < Minimum Continuous Flow',
    faultThreshold: 'Status = Critical',
    unitOrScale: '1.5 Hz pulse',
  },

  // 2. Rotor Dynamics & ISO 281 Bearing Life
  {
    simulator: 'rotor',
    effectName: 'Shaft Rotation Speed',
    visualProperty: 'Continuous angular velocity of rotor shaft & unbalance phasor',
    governingVariable: 'inputs.operatingRpm & outputs.angularVelocityRadS',
    formulaOrRule: 'ω = 2π * RPM / 60 (Normalized 1500 RPM = 1.0x rotation speed)',
    unitOrScale: 'rad/s (RPM / 60 Hz)',
  },
  {
    simulator: 'rotor',
    effectName: 'Shaft Orbit Whirl Radius',
    visualProperty: '1X synchronous lateral whirling orbit circle radius in journal',
    governingVariable: 'outputs.vibrationDisplacementPkPkMicrons',
    formulaOrRule: 'r_orbit = S_(p-p) * 0.45 px (Strictly ISO 7919 peak-to-peak shaft displacement)',
    faultThreshold: 'Displacement > 45 μm (ISO Zone C/D)',
    unitOrScale: 'Micrometers peak-to-peak (μm)',
  },
  {
    simulator: 'rotor',
    effectName: 'Centrifugal Unbalance Force Vector',
    visualProperty: 'Directional radial arrow extending from heavy spot',
    governingVariable: 'outputs.dynamicUnbalanceForceN',
    formulaOrRule: 'F_c = m_unbalance * r_radius * ω^2',
    unitOrScale: 'Newtons (N)',
  },
  {
    simulator: 'rotor',
    effectName: 'Bearing Infrared Thermal Glow',
    visualProperty: 'Radial thermal luminance around DE and NDE bearing housings',
    governingVariable: 'inputs.bearingOperatingTempC & outputs.bearingLifeStatus',
    formulaOrRule: 'Color gradient based on ISO thermal limits (<50°C Safe -> >95°C Critical)',
    faultThreshold: 'Temp > 80°C or L10mh < 25,000 hrs',
    unitOrScale: '°C (30°C to 120°C)',
  },
  {
    simulator: 'rotor',
    effectName: 'Resonance Critical Speed Halo',
    visualProperty: 'Intense pulsing halo when operating near critical resonance',
    governingVariable: 'outputs.speedRatioLambda (ω / ω_cr)',
    formulaOrRule: 'Active when 0.90 <= λ <= 1.10 (Magnification Q = 1 / (2 * ζ))',
    faultThreshold: '|λ - 1.0| < 0.08',
    unitOrScale: 'Dimensionless ratio λ',
  },
  {
    simulator: 'rotor',
    effectName: 'ISO 10816-3 Zone Color Code',
    visualProperty: 'Journal outline & telemetry badge color',
    governingVariable: 'outputs.iso10816Zone & outputs.vibrationVelocityRmsMmS',
    formulaOrRule: 'Zone A (#10b981) -> B (#34d399) -> C (#f59e0b) -> D (#ef4444)',
    faultThreshold: 'Vibration RMS > 4.5 mm/s (Zone C/D)',
    unitOrScale: 'mm/s RMS',
  },

  // 3. Piping Thermal Expansion & ASME B31.3 Stress
  {
    simulator: 'pipe',
    effectName: 'Thermal Expansion Elongation',
    visualProperty: 'Physical axial elongation and lateral expansion loop bending',
    governingVariable: 'outputs.thermalExpansionMm',
    formulaOrRule: 'ΔL = α(T) * L_nominal * (T_operating - T_ambient)',
    unitOrScale: 'Millimeters (mm)',
  },
  {
    simulator: 'pipe',
    effectName: 'ASME B31.3 Combined Stress Color Map',
    visualProperty: 'Stress gradient contour color along straight pipe and 90° elbows',
    governingVariable: 'outputs.stressRatioPercent (σ_comb / S_allowable)',
    formulaOrRule: 'Color: <=50% (#10b981) -> 75% (#34d399) -> 90% (#fbbf24) -> 100% (#f59e0b) -> >100% (#ef4444)',
    faultThreshold: 'Stress Ratio > 100% (Yield/Overstress Violation)',
    unitOrScale: 'Percent of Allowable Stress (%)',
  },
  {
    simulator: 'pipe',
    effectName: 'Expansion U-Loop Flexure Displacement',
    visualProperty: 'Curvature deformation of expansion loop elbows and leg span',
    governingVariable: 'outputs.thermalExpansionMm & inputs.loopWidthM',
    formulaOrRule: 'Deflection δ = ΔL_total absorbed across flexural leg spring compliance',
    unitOrScale: 'Millimeters (mm)',
  },
  {
    simulator: 'pipe',
    effectName: 'Pump Nozzle Thrust Reaction Vector',
    visualProperty: 'Force vector arrow and warning highlight at equipment terminal flange',
    governingVariable: 'outputs.axialForceKN & outputs.nozzleLoadKN',
    formulaOrRule: 'F_anchor = E * A * α * ΔT (Rigid) or Flexure Reaction Force (Loop)',
    faultThreshold: 'Nozzle Force > Allowable API 610 Limit (35 kN)',
    unitOrScale: 'Kilonewtons (kN)',
  },
  {
    simulator: 'pipe',
    effectName: 'Anchor Shear Fracture Animation',
    visualProperty: 'Shear displacement crack line at terminal anchor point',
    governingVariable: 'inputs.isAnchorFailed || outputs.axialForceKN > 50',
    formulaOrRule: 'Displayed ONLY if anchor failure scenario is active or force exceeds anchor capacity',
    faultThreshold: 'Anchor Failed = true',
    unitOrScale: 'Fault State (Boolean)',
  },

  // 4. API 682 Mechanical Seal Flush Plans
  {
    simulator: 'seal',
    effectName: 'Flush Flow Dash & Streamline Velocity',
    visualProperty: 'Animated dash velocity through flush tubing & restriction orifice',
    governingVariable: 'outputs.actualFlushFlowLpm & outputs.requiredFlushFlowLpm',
    formulaOrRule: 'Dash Speed = (Q_act / Q_req) * 1.5 (Plan-specific hydrodynamic flow)',
    unitOrScale: 'Liters per minute (L/min)',
  },
  {
    simulator: 'seal',
    effectName: 'Seal Chamber Thermal Glow',
    visualProperty: 'Stuffing box cavity fluid background color and heat haze glow',
    governingVariable: 'outputs.sealChamberOperatingTempC',
    formulaOrRule: 'T_box = T_process + (Q_gen - Q_flush) / (m_dot * C_p) (<40°C blue -> >100°C red)',
    faultThreshold: 'Chamber Temp > 95°C',
    unitOrScale: '°C (20°C to 160°C)',
  },
  {
    simulator: 'seal',
    effectName: 'API 682 Vaporization Flashing Effect',
    visualProperty: 'Pulsing flashing bubble cloud and warning callout at seal faces',
    governingVariable: 'outputs.vaporPressureMarginKPa & outputs.api682VaporMarginCompliant',
    formulaOrRule: 'Active when Vapor Margin = P_box - P_vapour < 140 kPa (Flashing)',
    faultThreshold: 'Vapor Margin < 140 kPa (API 682 Minimum)',
    unitOrScale: 'kPa Margin Deficit (0.0 to 1.0 intensity)',
  },
  {
    simulator: 'seal',
    effectName: 'Dual Seal Barrier Deficit Alarm',
    visualProperty: 'Warning box and barrier fluid color degradation in secondary cavity',
    governingVariable: 'outputs.barrierPressureDifferentialKPa (P_barrier - P_box)',
    formulaOrRule: 'Active when Plan 53/54 ΔP < 140 kPa (Risk of process inward migration)',
    faultThreshold: 'ΔP_barrier < 140 kPa',
    unitOrScale: 'kPa Differential',
  },
  {
    simulator: 'seal',
    effectName: 'Seal Face Microscopic Gap Lubrication Color',
    visualProperty: 'Color line at primary rotating vs stationary contact interface',
    governingVariable: 'outputs.pvValueMPaMs & outputs.pvLimitCompliant',
    formulaOrRule: 'Safe green film (#2dd4bf) -> Amber heavy PV (#fbbf24) -> Red vapor dry-run (#f43f5e)',
    faultThreshold: 'PV > PV_allowable or Vapor Margin < 140 kPa',
    unitOrScale: 'MPa·m/s & Compliance',
  },
];

/**
 * Returns the numeric intensity scaling multiplier for physics animation.
 */
export function getIntensityMultiplier(intensity: AnimationIntensity = 'high'): number {
  if (intensity === 'low') return 0.35;
  if (intensity === 'medium') return 0.65;
  return 1.0;
}

/**
 * Maps an ASME / General Stress ratio percentage (0 - 150%) to an optical color string.
 * Green (<67%) -> Amber (67-100%) -> Red (>100%) -> High-contrast Crimson Pulsing (>130%)
 */
export function computeStressColor(stressRatioPercent: number): string {
  if (stressRatioPercent <= 50) return '#10b981'; // Emerald Safe
  if (stressRatioPercent <= 75) return '#34d399'; // Light Green
  if (stressRatioPercent <= 90) return '#fbbf24'; // Warning Yellow
  if (stressRatioPercent <= 100) return '#f59e0b'; // Amber Marginal
  if (stressRatioPercent <= 125) return '#ef4444'; // Red Overstressed
  return '#b91c1c'; // Critical Danger Overload
}

/**
 * Computes fluid / metal thermal glow color based on operating temperature.
 */
export function computeTemperatureGlow(tempC: number, maxExpectedC: number = 350): string {
  if (tempC <= 25) return 'rgba(56, 189, 248, 0.2)'; // Ambient cyan-blue
  if (tempC <= 70) return 'rgba(56, 189, 248, 0.4)'; // Warm cyan
  if (tempC <= 120) return 'rgba(251, 191, 36, 0.45)'; // Amber
  if (tempC <= 200) return 'rgba(249, 115, 22, 0.6)'; // Orange
  if (tempC <= 300) return 'rgba(239, 68, 68, 0.75)'; // Red hot
  return 'rgba(244, 63, 94, 0.9)'; // Incandescent crimson
}

/**
 * Computes seal chamber temperature color gradient (API 682 thermal limits).
 */
export function computeSealTempColor(tempC: number): string {
  if (tempC < 40) return '#38bdf8'; // Optimal cool
  if (tempC < 65) return '#34d399'; // Normal operating
  if (tempC < 85) return '#fbbf24'; // Warm chamber
  if (tempC < 110) return '#f97316'; // Warning threshold
  return '#ef4444'; // Extreme thermal risk (face dry run)
}

/**
 * Physics Animation Derivation: Centrifugal Pump Cavitation & NPSH
 */
export function derivePumpAnimation(
  inputs: PumpInputs,
  outputs: PumpOutputs,
  intensity: AnimationIntensity = 'high'
): PhysicsAnimationParams {
  const mult = getIntensityMultiplier(intensity);

  // 1. Flow velocity normalized: ~1.5 m/s is nominal 1.0x speed
  const baseFlowSpeed = Math.max(0.1, Math.min(4.0, (outputs.fluidVelocityMs || 1.5) / 1.5));
  const flowSpeed = baseFlowSpeed * mult;

  // 2. Bubble & Cavitation intensity strictly derived from NPSH margin deficit & collapse index
  let rawBubbleIntensity = 0;
  if (outputs.npshaM <= outputs.npshrM) {
    // Severe active cavitation
    const deficit = outputs.npshrM - outputs.npshaM;
    rawBubbleIntensity = Math.min(1.0, 0.6 + deficit * 0.2);
  } else if (outputs.npshMarginRatio < 1.1) {
    // Marginal threshold
    rawBubbleIntensity = Math.min(0.5, (1.1 - outputs.npshMarginRatio) * 3.0);
  }
  const bubbleIntensity = rawBubbleIntensity * mult;

  // 3. Structural vibration from acoustic collapse energy
  const vibrationIntensity = Math.min(1.0, ((outputs.bubbleCollapseIntensityScore || 0) / 100) * mult);

  // 4. Impeller deflection whirl radius from asymmetric vapor pockets
  const orbitRadius = Math.max(0, bubbleIntensity * 6 * mult);

  // 5. Temperature glow & vapor flash
  const temperatureGlow = computeTemperatureGlow(inputs.fluidTempC, 150);

  // 6. Fluid kinetic color
  const stressColor =
    outputs.status.level === 'safe'
      ? '#38bdf8'
      : outputs.status.level === 'warning'
      ? '#fbbf24'
      : '#ef4444';

  // 7. Pressure pulse derived from pump rotational blade pass frequency (Z = 5 to 7 vanes)
  const vaneCount = 5;
  const rpm = inputs.pumpSpeedRpm || 1450;
  const bladePassHz = (rpm / 60) * vaneCount;
  const pressurePulse = {
    frequencyHz: bladePassHz,
    amplitude: Math.min(1.0, (0.15 + (outputs.cavitationRiskPercent || 0) / 150) * mult),
  };

  // 8. Leak / suction vortex intensity if suction lift is deep
  const leakIntensity = inputs.staticHeadM < -2.5 ? Math.min(1.0, Math.abs(inputs.staticHeadM + 2.5) * 0.3 * mult) : 0;

  // 9. Vaporization intensity
  const vaporizationIntensity = Math.max(
    0,
    Math.min(1.0, ((outputs.npshrM * 1.1 - outputs.npshaM) / Math.max(1, outputs.npshrM)) * mult)
  );

  // 10. Damage level (cavitation erosion index) - Only shown if cavitation risk is present
  const damageLevel = Math.min(100, Math.max(0, outputs.cavitationRiskPercent || 0));
  const bearingHealth = Math.max(0, 100 - damageLevel);

  return {
    flowSpeed,
    bubbleIntensity,
    vibrationIntensity,
    orbitRadius,
    temperatureGlow,
    stressColor,
    pressurePulse,
    leakIntensity,
    vaporizationIntensity,
    damageLevel,
    bearingHealth,
    sealChamberTempColor: computeSealTempColor(inputs.fluidTempC),
  };
}

/**
 * Physics Animation Derivation: Rotor Dynamics & Bearing Life
 */
export function deriveRotorAnimation(
  inputs: RotorInputs,
  outputs: RotorOutputs,
  intensity: AnimationIntensity = 'high'
): PhysicsAnimationParams {
  const mult = getIntensityMultiplier(intensity);

  // 1. Angular speed normalized
  const rpm = inputs.operatingRpm || 1800;
  const baseFlowSpeed = Math.max(0.2, Math.min(5.0, rpm / 1500));
  const flowSpeed = baseFlowSpeed * mult;

  // 2. Vibration intensity derived from ISO 10816-3 RMS velocity (Trip threshold is ~7.1 mm/s)
  const vibRms = outputs.vibrationVelocityRmsMmS || 0;
  const vibrationIntensity = Math.min(1.0, Math.max(0.05, (vibRms / 8.0) * mult));

  // 3. Orbit whirling radius strictly derived from actual peak-to-peak displacement microns
  const dispMicrons = outputs.vibrationDisplacementPkPkMicrons || 5;
  const orbitRadius = Math.max(1.5, Math.min(32, dispMicrons * 0.45 * mult));

  // 4. Bearing operating temperature glow
  const bearingTemp = inputs.bearingOperatingTempC || 50;
  const temperatureGlow = computeTemperatureGlow(bearingTemp, 120);

  // 5. Stress / ISO zone color
  let stressColor = '#10b981'; // Zone A
  if (outputs.iso10816Zone === 'B') stressColor = '#34d399';
  else if (outputs.iso10816Zone === 'C') stressColor = '#f59e0b';
  else if (outputs.iso10816Zone === 'D') stressColor = '#ef4444';

  // 6. 1X Synchronous shaft pulse
  const sync1XHz = rpm / 60;
  const dynamicForceRatio = Math.min(1.0, (outputs.forceToRotorWeightRatio || 0.1) * 0.5 * mult);
  const pressurePulse = {
    frequencyHz: sync1XHz,
    amplitude: dynamicForceRatio,
  };

  // 7. Bearing health and fatigue damage level from ISO 281 L10mh
  const targetLifeHrs = 80000;
  const actualLifeHrs = outputs.modifiedLifeL10mhHours || 50000;
  const bearingHealth = Math.min(100, Math.max(0, Math.round((actualLifeHrs / targetLifeHrs) * 100)));
  const damageLevel = Math.max(0, 100 - bearingHealth);

  return {
    flowSpeed,
    bubbleIntensity: 0,
    vibrationIntensity,
    orbitRadius,
    temperatureGlow,
    stressColor,
    pressurePulse,
    leakIntensity: 0,
    vaporizationIntensity: 0,
    damageLevel,
    bearingHealth,
    sealChamberTempColor: '#38bdf8',
  };
}

/**
 * Physics Animation Derivation: Piping Thermal Expansion & ASME B31.3 Stress
 */
export function derivePipeAnimation(
  inputs: PipeInputs,
  outputs: PipeOutputs,
  intensity: AnimationIntensity = 'high'
): PhysicsAnimationParams {
  const mult = getIntensityMultiplier(intensity);

  // 1. Process kinetic flow rate
  const flowSpeed = 1.2 * mult;

  // 2. Thermal glow strictly derived from pipe operating temperature
  const temperatureGlow = computeTemperatureGlow(inputs.operatingTempC, 500);

  // 3. ASME combined stress ratio color
  const stressRatio = outputs.stressRatioPercent || 0;
  const stressColor = computeStressColor(stressRatio);

  // 4. Expansion displacement / thermal deflection
  const thermalMm = outputs.thermalExpansionMm || 0;
  const orbitRadius = Math.max(0, Math.min(20, Math.abs(thermalMm) * 0.6 * mult));

  // 5. Internal pressure pulse
  const pressureBar = inputs.operatingPressureBar || 5;
  const pressurePulse = {
    frequencyHz: 1.0,
    amplitude: Math.min(1.0, (pressureBar / 50) * mult),
  };

  // 6. Anchor nozzle leak / yield risk - only if nozzle load exceeds 35 kN
  const isNozzleOverloaded = outputs.axialForceKN > 35;
  const leakIntensity = isNozzleOverloaded ? Math.min(1.0, ((outputs.axialForceKN - 35) / 30) * mult) : 0;

  // 7. Structural damage level
  const damageLevel = Math.min(100, Math.max(0, stressRatio > 100 ? (stressRatio - 100) * 2 : 0));
  const bearingHealth = Math.max(0, 100 - damageLevel);

  return {
    flowSpeed,
    bubbleIntensity: 0,
    vibrationIntensity: (stressRatio > 100 ? 0.4 : 0.05) * mult,
    orbitRadius,
    temperatureGlow,
    stressColor,
    pressurePulse,
    leakIntensity,
    vaporizationIntensity: 0,
    damageLevel,
    bearingHealth,
    sealChamberTempColor: computeSealTempColor(inputs.operatingTempC),
  };
}

/**
 * Physics Animation Derivation: API 682 Mechanical Seal Flush Plans
 */
export function deriveSealAnimation(
  inputs: SealInputs,
  outputs: SealOutputs,
  intensity: AnimationIntensity = 'high'
): PhysicsAnimationParams {
  const mult = getIntensityMultiplier(intensity);

  // 1. Flush flow velocity derived from actual flush flow vs required
  const reqFlow = outputs.requiredFlushFlowLpm || 4.0;
  const actFlow = outputs.actualFlushFlowLpm || 4.0;
  const flowSpeed = Math.max(0.1, Math.min(4.0, (actFlow / Math.max(1, reqFlow)) * 1.5 * mult));

  // 2. Vapor margin & flashing bubble intensity
  const vaporMarginKPa = outputs.vaporPressureMarginKPa || 150;
  let bubbleIntensity = 0;
  let vaporizationIntensity = 0;
  if (vaporMarginKPa < 140) {
    // Below API 682 140 kPa margin threshold
    vaporizationIntensity = Math.min(1.0, Math.max(0.1, ((140 - vaporMarginKPa) / 140) * mult));
    bubbleIntensity = vaporizationIntensity;
  }

  // 3. Frictional heat power glow
  const temperatureGlow = computeTemperatureGlow(inputs.processFluidTempC, 250);

  // 4. Seal chamber thermal color
  const chamberTemp = outputs.sealChamberOperatingTempC || inputs.processFluidTempC || 30;
  const sealChamberTempColor = computeSealTempColor(chamberTemp);

  // 5. Barrier pressure differential compliance & leakage intensity
  let leakIntensity = 0;
  if (
    inputs.planId.startsWith('plan_53') ||
    inputs.planId === 'plan_54'
  ) {
    const diff = outputs.barrierPressureDifferentialKPa || 0;
    if (diff < 140) {
      leakIntensity = Math.min(1.0, ((140 - diff) / 140) * mult);
    }
  }

  // 6. Sliding face PV stress status color
  const pvCompliant = outputs.pvLimitCompliant;
  const vaporCompliant = outputs.api682VaporMarginCompliant;
  const stressColor =
    pvCompliant && vaporCompliant
      ? '#10b981'
      : !vaporCompliant
      ? '#ef4444'
      : '#f59e0b';

  // 7. Rotary balance orbit
  const rpm = inputs.shaftSpeedRpm || 2950;
  const orbitRadius = Math.max(1.0, Math.min(10, (rpm / 3000) * 3 * mult));

  // 8. Seal face damage level & residual life index
  const faceWearRisk = Math.min(
    100,
    (outputs.pvValueMPaMs > 15 ? 40 : 0) +
      (vaporMarginKPa < 140 ? 50 : 0) +
      (!outputs.coolingAdequate ? 30 : 0)
  );
  const damageLevel = Math.min(100, faceWearRisk);
  const bearingHealth = Math.max(0, 100 - damageLevel);

  return {
    flowSpeed,
    bubbleIntensity,
    vibrationIntensity: (bubbleIntensity > 0 ? 0.5 : 0.1) * mult,
    orbitRadius,
    temperatureGlow,
    stressColor,
    pressurePulse: {
      frequencyHz: rpm / 60,
      amplitude: Math.min(1.0, ((outputs.sealFaceHeatGenKW || 0.5) / 5) * mult),
    },
    leakIntensity,
    vaporizationIntensity,
    damageLevel,
    bearingHealth,
    sealChamberTempColor,
  };
}
