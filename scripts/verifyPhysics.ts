import { calculateSteamTurbine } from '../src/utils/steamTurbineCalculations';
import { STEAM_TURBINE_SCENARIOS } from '../src/utils/steamTurbinePresets';

import { calculateRecipCompressor } from '../src/utils/recipCompressorCalculations';
import { RECIP_COMPRESSOR_SCENARIOS } from '../src/utils/recipCompressorPresets';

import { calculateGearbox } from '../src/utils/gearboxCalculations';
import { GEARBOX_SCENARIOS } from '../src/utils/gearboxPresets';

import { calculateJournalBearing } from '../src/utils/journalBearingCalculations';
import { JOURNAL_BEARING_SCENARIOS } from '../src/utils/journalBearingPresets';

import { calculateCompressorSurge } from '../src/utils/compressorCalculations';
import { COMPRESSOR_SCENARIOS } from '../src/utils/compressorPresets';

import { calculateBearingFaults } from '../src/utils/bearingCalculations';
import { BEARING_SCENARIOS } from '../src/utils/bearingPresets';

import { calculatePump } from '../src/utils/pumpCalculations';
import { PUMP_PRESETS } from '../src/utils/pumpPresets';

import { calculateRotor } from '../src/utils/rotorCalculations';
import { ROTOR_PRESETS } from '../src/utils/rotorPresets';

import { calculatePipeStress } from '../src/utils/pipeCalculations';
import { PIPE_PRESETS } from '../src/utils/pipePresets';

import { calculateAlignment } from '../src/utils/alignmentCalculations';
import { ALIGNMENT_PRESETS } from '../src/utils/alignmentPresets';

import { calculateSeal } from '../src/utils/sealCalculations';
import { SEAL_PRESETS } from '../src/utils/sealPresets';

interface TestResult {
  simulator: string;
  scenario: string;
  passed: boolean;
  errors: string[];
  metrics: Record<string, any>;
}

const allResults: TestResult[] = [];

function checkFinite(obj: any, path = ''): string[] {
  const errors: string[] = [];
  if (obj === null || obj === undefined) return errors;

  if (typeof obj === 'number') {
    if (!Number.isFinite(obj)) {
      errors.push(`${path} is ${obj}`);
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, idx) => {
      errors.push(...checkFinite(item, `${path}[${idx}]`));
    });
  } else if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      errors.push(...checkFinite(obj[key], path ? `${path}.${key}` : key));
    }
  }
  return errors;
}

console.log('=== STARTING 100% PHYSICS AUDIT ACROSS ALL 11 ROTATING MACHINERY SIMULATORS ===\n');

// 1. STEAM TURBINE AUDIT (API 612 / ASME PTC 6 / IAPWS-IF97)
console.log('--- 1. Testing Steam Turbine Simulator ---');
for (const scen of STEAM_TURBINE_SCENARIOS) {
  const errors: string[] = [];
  try {
    const out = calculateSteamTurbine(scen.inputs);
    errors.push(...checkFinite(out));

    if (out.isentropicEnthalpyDropKjKg <= 0) errors.push(`Isentropic enthalpy drop must be > 0 (got ${out.isentropicEnthalpyDropKjKg})`);
    if (out.actualEnthalpyDropKjKg <= 0) errors.push(`Actual enthalpy drop must be > 0 (got ${out.actualEnthalpyDropKjKg})`);
    if (out.isentropicEfficiencyPercent <= 30 || out.isentropicEfficiencyPercent > 100) errors.push(`Turbine efficiency out of range [30-100%] (got ${out.isentropicEfficiencyPercent})`);
    if (out.steamMassFlowTonnesHr <= 0) errors.push(`Steam mass flow must be positive (got ${out.steamMassFlowTonnesHr})`);
    if (out.bladeTipVelocityMs <= 0) errors.push(`Blade tip velocity must be positive (got ${out.bladeTipVelocityMs})`);
    if (out.exhaustMoisturePercent < 0 || out.exhaustMoisturePercent > 35) errors.push(`Moisture percent unrealistic (got ${out.exhaustMoisturePercent}%)`);
    if (out.nozzlePassFrequencyHz <= 0) errors.push('Nozzle pass frequency must be positive');
    if (out.bladeResonanceMarginPercent === undefined) errors.push('Blade resonance margin missing');
    if (!out.mollierPoints || out.mollierPoints.length === 0) errors.push('Mollier points missing');
    if (!out.auditTrail || out.auditTrail.length === 0) errors.push('Audit trail missing');

    allResults.push({
      simulator: 'Steam Turbine',
      scenario: scen.name,
      passed: errors.length === 0,
      errors,
      metrics: {
        powerKw: scen.inputs.ratedPowerKw,
        enthalpyDrop: out.actualEnthalpyDropKjKg.toFixed(1) + ' kJ/kg',
        efficiency: out.isentropicEfficiencyPercent.toFixed(1) + '%',
        moisture: out.exhaustMoisturePercent.toFixed(1) + '%',
        steamFlow: out.steamMassFlowTonnesHr.toFixed(1) + ' t/h',
        status: out.status.level,
      },
    });
  } catch (err: any) {
    allResults.push({
      simulator: 'Steam Turbine',
      scenario: scen.name,
      passed: false,
      errors: [err.message || String(err)],
      metrics: {},
    });
  }
}

// 2. RECIPROCATING COMPRESSOR AUDIT (API 618 / API 688 / PV Indicator)
console.log('--- 2. Testing Reciprocating Compressor Simulator ---');
for (const scen of RECIP_COMPRESSOR_SCENARIOS) {
  const errors: string[] = [];
  try {
    const out = calculateRecipCompressor(scen.inputs);
    errors.push(...checkFinite(out));

    if (out.effectiveVolumetricEfficiencyPercent <= 0 || out.effectiveVolumetricEfficiencyPercent > 120) {
      errors.push(`Volumetric efficiency out of realistic range [0 - 120%] (got ${out.effectiveVolumetricEfficiencyPercent}%)`);
    }
    if (out.indicatedPowerKw <= 0) errors.push(`Indicated power must be > 0 (got ${out.indicatedPowerKw})`);
    if (out.brakePowerKw <= 0) errors.push(`Brake power must be > 0 (got ${out.brakePowerKw})`);
    if (out.standardVolumeFlowNm3Hr <= 0) errors.push(`Standard volume flow must be > 0 (got ${out.standardVolumeFlowNm3Hr})`);
    if (out.rodLoadReversalDegrees < 0 || out.rodLoadReversalDegrees > 360) {
      errors.push(`Rod load reversal degrees must be [0 - 360] (got ${out.rodLoadReversalDegrees})`);
    }
    if (!out.pvCurvePoints || out.pvCurvePoints.length < 50) errors.push(`PV curve points insufficient (got ${out.pvCurvePoints?.length})`);
    if (out.acousticSpeedOfSoundMs <= 0) errors.push(`Speed of sound must be positive (got ${out.acousticSpeedOfSoundMs})`);

    allResults.push({
      simulator: 'Reciprocating Compressor',
      scenario: scen.name,
      passed: errors.length === 0,
      errors,
      metrics: {
        gas: scen.inputs.gasType,
        volEff: out.effectiveVolumetricEfficiencyPercent.toFixed(1) + '%',
        powerBrake: out.brakePowerKw.toFixed(1) + ' kW',
        reversalDeg: out.rodLoadReversalDegrees.toFixed(1) + '°',
        reversalMet: out.hasAdequateRodLoadReversal ? 'YES' : 'NO',
        status: out.status.level,
      },
    });
  } catch (err: any) {
    allResults.push({
      simulator: 'Reciprocating Compressor',
      scenario: scen.name,
      passed: false,
      errors: [err.message || String(err)],
      metrics: {},
    });
  }
}

// 3. GEARBOX AUDIT (AGMA 2001-D04 / ISO 6336 / EHL)
console.log('--- 3. Testing Industrial Gearbox Simulator ---');
for (const scen of GEARBOX_SCENARIOS) {
  const errors: string[] = [];
  try {
    const out = calculateGearbox(scen.inputs);
    errors.push(...checkFinite(out));

    if (out.pitchLineVelocityMs <= 0) errors.push(`Pitch line velocity must be positive (got ${out.pitchLineVelocityMs})`);
    if (out.inputTorqueNm <= 0) errors.push(`Input torque must be positive (got ${out.inputTorqueNm})`);
    if (out.gearMeshFrequencyHz <= 0) errors.push(`Gear mesh frequency must be positive (got ${out.gearMeshFrequencyHz})`);
    if (out.contactStressMpa <= 0) errors.push(`Contact stress must be positive (got ${out.contactStressMpa})`);
    if (out.bendingStressMpa <= 0) errors.push(`Bending stress must be positive (got ${out.bendingStressMpa})`);
    if (out.ehlFilmThicknessUm <= 0) errors.push(`EHL film thickness must be positive (got ${out.ehlFilmThicknessUm})`);
    if (out.specificFilmThicknessLambda <= 0) errors.push(`Lambda ratio must be positive (got ${out.specificFilmThicknessLambda})`);
    if (out.contactSafetyFactorSH <= 0) errors.push(`Contact safety factor must be positive (got ${out.contactSafetyFactorSH})`);
    if (out.bendingSafetyFactorSF <= 0) errors.push(`Bending safety factor must be positive (got ${out.bendingSafetyFactorSF})`);

    allResults.push({
      simulator: 'Gearbox',
      scenario: scen.name,
      passed: errors.length === 0,
      errors,
      metrics: {
        ratio: (scen.inputs.gearTeeth / scen.inputs.pinionTeeth).toFixed(2),
        gmf: out.gearMeshFrequencyHz.toFixed(1) + ' Hz',
        sH: out.contactSafetyFactorSH.toFixed(2),
        sF: out.bendingSafetyFactorSF.toFixed(2),
        lambda: out.specificFilmThicknessLambda.toFixed(2),
        status: out.status.level,
      },
    });
  } catch (err: any) {
    allResults.push({
      simulator: 'Gearbox',
      scenario: scen.name,
      passed: false,
      errors: [err.message || String(err)],
      metrics: {},
    });
  }
}

// 4. HYDRODYNAMIC JOURNAL BEARING AUDIT (2D Reynolds / Sommerfeld / API 684)
console.log('--- 4. Testing Hydrodynamic Journal Bearing Simulator ---');
for (const scen of JOURNAL_BEARING_SCENARIOS) {
  const errors: string[] = [];
  try {
    const out = calculateJournalBearing(scen.inputs);
    errors.push(...checkFinite(out));

    if (out.sommerfeldNumber <= 0) errors.push(`Sommerfeld number must be > 0 (got ${out.sommerfeldNumber})`);
    if (out.minimumFilmThicknessUm <= 0) errors.push(`Minimum film thickness must be > 0 (got ${out.minimumFilmThicknessUm})`);
    if (out.eccentricityRatio < 0 || out.eccentricityRatio >= 1.0) errors.push(`Eccentricity ratio must be [0, 1) (got ${out.eccentricityRatio})`);
    if (out.powerLossKw <= 0) errors.push(`Power loss must be positive (got ${out.powerLossKw})`);
    if (out.effectiveFilmTempC <= 0) errors.push(`Effective film temp must be positive (got ${out.effectiveFilmTempC})`);
    if (out.whirlFrequencyRatio <= 0 || out.whirlFrequencyRatio > 1.0) errors.push(`Whirl ratio out of bounds (got ${out.whirlFrequencyRatio})`);

    allResults.push({
      simulator: 'Journal Bearing',
      scenario: scen.name,
      passed: errors.length === 0,
      errors,
      metrics: {
        sommerfeld: out.sommerfeldNumber.toFixed(3),
        hMin: out.minimumFilmThicknessUm.toFixed(1) + ' µm',
        eccentricity: out.eccentricityRatio.toFixed(2),
        filmTemp: out.effectiveFilmTempC.toFixed(1) + ' °C',
        instability: out.instabilityMode,
        status: out.status.level,
      },
    });
  } catch (err: any) {
    allResults.push({
      simulator: 'Journal Bearing',
      scenario: scen.name,
      passed: false,
      errors: [err.message || String(err)],
      metrics: {},
    });
  }
}

// 5. CENTRIFUGAL COMPRESSOR SURGE AUDIT (API 617 / ASME PTC 10 / Greitzer B)
console.log('--- 5. Testing Centrifugal Compressor Simulator ---');
for (const scen of COMPRESSOR_SCENARIOS) {
  const errors: string[] = [];
  try {
    const out = calculateCompressorSurge(scen.inputs);
    errors.push(...checkFinite(out));

    if (out.pressureRatioRc <= 1.0) errors.push(`Pressure ratio must be > 1.0 (got ${out.pressureRatioRc})`);
    if (out.polytropicHeadKjKg <= 0) errors.push(`Polytropic head must be > 0 (got ${out.polytropicHeadKjKg})`);
    if (out.shaftPowerKw <= 0) errors.push(`Shaft power must be > 0 (got ${out.shaftPowerKw})`);
    if (out.surgeLimitMassFlowKgS <= 0) errors.push(`Surge limit flow must be positive (got ${out.surgeLimitMassFlowKgS})`);

    allResults.push({
      simulator: 'Compressor Surge',
      scenario: scen.name,
      passed: errors.length === 0,
      errors,
      metrics: {
        flow: scen.inputs.massFlowKgS + ' kg/s',
        pRatio: out.pressureRatioRc.toFixed(2),
        surgeMargin: out.currentSurgeMarginPercent.toFixed(1) + '%',
        state: out.operatingState,
        status: out.status.level,
      },
    });
  } catch (err: any) {
    allResults.push({
      simulator: 'Compressor Surge',
      scenario: scen.name,
      passed: false,
      errors: [err.message || String(err)],
      metrics: {},
    });
  }
}

// 6. ROLLING ELEMENT BEARING AUDIT (ISO 281 / ISO 15243)
console.log('--- 6. Testing Rolling Element Bearing Simulator ---');
for (const scen of BEARING_SCENARIOS) {
  const errors: string[] = [];
  try {
    const out = calculateBearingFaults(scen.inputs);
    errors.push(...checkFinite(out));

    if (out.frequencies.bpfoHz <= 0) errors.push(`BPFO must be positive (got ${out.frequencies.bpfoHz})`);
    if (out.frequencies.bpfiHz <= 0) errors.push(`BPFI must be positive (got ${out.frequencies.bpfiHz})`);
    if (out.frequencies.bsfHz <= 0) errors.push(`BSF must be positive (got ${out.frequencies.bsfHz})`);
    if (out.frequencies.ftfHz <= 0) errors.push(`FTF must be positive (got ${out.frequencies.ftfHz})`);
    if (out.l10hFatigueHoursRemaining <= 0) errors.push(`L10h life must be positive (got ${out.l10hFatigueHoursRemaining})`);
    if (out.overallVelocityRmsMmS < 0) errors.push(`Vibration velocity cannot be negative (got ${out.overallVelocityRmsMmS})`);

    allResults.push({
      simulator: 'Rolling Bearing',
      scenario: scen.name,
      passed: errors.length === 0,
      errors,
      metrics: {
        model: scen.inputs.bearingId,
        bpfo: out.frequencies.bpfoHz.toFixed(1) + ' Hz',
        bpfi: out.frequencies.bpfiHz.toFixed(1) + ' Hz',
        l10h: Math.round(out.l10hFatigueHoursRemaining) + ' hrs',
        stage: out.stage,
        status: out.status.level,
      },
    });
  } catch (err: any) {
    allResults.push({
      simulator: 'Rolling Bearing',
      scenario: scen.name,
      passed: false,
      errors: [err.message || String(err)],
      metrics: {},
    });
  }
}

// 7. CENTRIFUGAL PUMP CAVITATION AUDIT (API 610 / HI 9.6.1 / Rayleigh-Plesset)
console.log('--- 7. Testing Centrifugal Pump Simulator ---');
for (const scen of PUMP_PRESETS) {
  const errors: string[] = [];
  try {
    const out = calculatePump(scen.inputs);
    errors.push(...checkFinite(out));

    // In severe cavitation/throttled state, NPSHa can reach 0 (flash point). Must not be negative.
    if (out.npshaM < 0) errors.push(`NPSHa cannot be negative (got ${out.npshaM})`);
    if (out.npshrM <= 0) errors.push(`NPSHr must be positive (got ${out.npshrM})`);
    if (out.npshMarginRatio < 0) errors.push(`NPSH margin ratio cannot be negative (got ${out.npshMarginRatio})`);
    if (out.operatingHeadM <= 0) errors.push(`Pump total head must be positive (got ${out.operatingHeadM})`);
    if (out.suctionSpecificSpeedUS <= 0) errors.push(`Suction specific speed must be positive (got ${out.suctionSpecificSpeedUS})`);

    allResults.push({
      simulator: 'Centrifugal Pump',
      scenario: scen.name,
      passed: errors.length === 0,
      errors,
      metrics: {
        npsha: out.npshaM.toFixed(2) + ' m',
        npshr: out.npshrM.toFixed(2) + ' m',
        marginRatio: out.npshMarginRatio.toFixed(2) + 'x',
        nss: out.suctionSpecificSpeedUS.toFixed(0),
        status: out.status.level,
      },
    });
  } catch (err: any) {
    allResults.push({
      simulator: 'Centrifugal Pump',
      scenario: scen.name,
      passed: false,
      errors: [err.message || String(err)],
      metrics: {},
    });
  }
}

// 8. ROTOR DYNAMICS & UNBALANCE AUDIT (ISO 1940-1 / ISO 20816 / Jeffcott)
console.log('--- 8. Testing Rotor Dynamics Simulator ---');
for (const scen of ROTOR_PRESETS) {
  const errors: string[] = [];
  try {
    const out = calculateRotor(scen.inputs);
    errors.push(...checkFinite(out));

    if (out.iso1940PermissibleUnbalanceGmm <= 0) errors.push(`Permissible unbalance must be positive (got ${out.iso1940PermissibleUnbalanceGmm})`);
    if (out.dynamicUnbalanceForceN < 0) errors.push(`Dynamic unbalance force cannot be negative (got ${out.dynamicUnbalanceForceN})`);
    if (out.vibrationVelocityRmsMmS < 0) errors.push(`Vibration velocity cannot be negative (got ${out.vibrationVelocityRmsMmS})`);

    allResults.push({
      simulator: 'Rotor Unbalance',
      scenario: scen.name,
      passed: errors.length === 0,
      errors,
      metrics: {
        uPerm: out.iso1940PermissibleUnbalanceGmm.toFixed(0) + ' g·mm',
        uAct: out.actualUnbalanceGmm.toFixed(0) + ' g·mm',
        force1X: out.dynamicUnbalanceForceN.toFixed(0) + ' N',
        vibRms: out.vibrationVelocityRmsMmS.toFixed(2) + ' mm/s',
        zone: out.iso10816Zone,
        status: out.status.level,
      },
    });
  } catch (err: any) {
    allResults.push({
      simulator: 'Rotor Unbalance',
      scenario: scen.name,
      passed: false,
      errors: [err.message || String(err)],
      metrics: {},
    });
  }
}

// 9. PIPE STRESS & THERMAL EXPANSION AUDIT (ASME B31.3 §319 / B36.10M)
console.log('--- 9. Testing Pipe Thermal Stress Simulator ---');
for (const scen of PIPE_PRESETS) {
  const errors: string[] = [];
  try {
    const out = calculatePipeStress(scen.inputs);
    errors.push(...checkFinite(out));

    const deltaT = scen.inputs.operatingTempC - scen.inputs.installationTempC;
    if (deltaT > 0 && out.thermalExpansionMm <= 0) {
      errors.push(`Thermal expansion should be positive for positive deltaT (got ${out.thermalExpansionMm})`);
    }
    if (out.allowableStressMPa <= 0) errors.push(`Allowable stress must be positive (got ${out.allowableStressMPa})`);
    if (out.stressRatioPercent < 0) errors.push(`Stress ratio cannot be negative (got ${out.stressRatioPercent})`);

    allResults.push({
      simulator: 'Pipe Stress',
      scenario: scen.name,
      passed: errors.length === 0,
      errors,
      metrics: {
        deltaL: out.thermalExpansionMm.toFixed(1) + ' mm',
        axialStress: out.axialStressMPa.toFixed(1) + ' MPa',
        allowableStress: out.allowableStressMPa.toFixed(1) + ' MPa',
        ratio: out.stressRatioPercent.toFixed(0) + '%',
        status: out.stressState,
      },
    });
  } catch (err: any) {
    allResults.push({
      simulator: 'Pipe Stress',
      scenario: scen.name,
      passed: false,
      errors: [err.message || String(err)],
      metrics: {},
    });
  }
}

// 10. SHAFT ALIGNMENT & THERMAL GROWTH AUDIT (API 686 / AGMA 9000 / Reverse Dial)
console.log('--- 10. Testing Shaft Alignment Simulator ---');
for (const scen of ALIGNMENT_PRESETS) {
  const errors: string[] = [];
  try {
    const out = calculateAlignment(scen.inputs);
    errors.push(...checkFinite(out));

    if (out.frontFootShimAdjustmentMm === undefined || out.rearFootShimAdjustmentMm === undefined) {
      errors.push('Shim adjustments undefined');
    }
    if (out.hotResultantAngleMrad === undefined || out.hotResultantAngleMrad < 0) {
      errors.push('Hot resultant angle invalid');
    }

    allResults.push({
      simulator: 'Shaft Alignment',
      scenario: scen.name,
      passed: errors.length === 0,
      errors,
      metrics: {
        frontShim: out.frontFootShimAdjustmentMm.toFixed(3) + ' mm',
        rearShim: out.rearFootShimAdjustmentMm.toFixed(3) + ' mm',
        couplingAngle: out.hotResultantAngleMrad.toFixed(3) + ' mrad',
        classification: out.alignmentClassification,
        status: out.status.level,
      },
    });
  } catch (err: any) {
    allResults.push({
      simulator: 'Shaft Alignment',
      scenario: scen.name,
      passed: false,
      errors: [err.message || String(err)],
      metrics: {},
    });
  }
}

// 11. MECHANICAL SEAL FLUSH PLAN AUDIT (API 682 4th Ed / ISO 21049)
console.log('--- 11. Testing Mechanical Seal Flush Simulator ---');
for (const scen of SEAL_PRESETS) {
  const errors: string[] = [];
  try {
    const out = calculateSeal(scen.inputs);
    errors.push(...checkFinite(out));

    if (out.sealFaceHeatGenKW <= 0) errors.push(`Seal face heat must be positive (got ${out.sealFaceHeatGenKW})`);
    if (out.requiredFlushFlowLpm <= 0) errors.push(`Required flush flow must be positive (got ${out.requiredFlushFlowLpm})`);
    if (out.vaporPressureTempMarginC === undefined) errors.push('Vapor pressure temperature margin undefined');

    allResults.push({
      simulator: 'Mechanical Seal',
      scenario: scen.name,
      passed: errors.length === 0,
      errors,
      metrics: {
        plan: scen.inputs.planId,
        heatKw: out.sealFaceHeatGenKW.toFixed(2) + ' kW',
        flowLpm: out.requiredFlushFlowLpm.toFixed(1) + ' L/min',
        vaporMarginC: out.vaporPressureTempMarginC.toFixed(1) + ' °C',
        status: out.status.level,
      },
    });
  } catch (err: any) {
    allResults.push({
      simulator: 'Mechanical Seal',
      scenario: scen.name,
      passed: false,
      errors: [err.message || String(err)],
      metrics: {},
    });
  }
}

console.log('\n================ AUDIT SUMMARY ================');
const totalCases = allResults.length;
const passedCases = allResults.filter((r) => r.passed).length;
const failedCases = allResults.filter((r) => !r.passed);

console.log(`Total Scenarios Tested Across 11 Twins: ${totalCases}`);
console.log(`Passed: ${passedCases} / ${totalCases} (${((passedCases / totalCases) * 100).toFixed(1)}%)`);

if (failedCases.length > 0) {
  console.error(`\nFAILED CASES (${failedCases.length}):`);
  failedCases.forEach((f) => {
    console.error(`❌ [${f.simulator}] Scenario: "${f.scenario}"`);
    f.errors.forEach((e) => console.error(`   - ${e}`));
  });
  process.exit(1);
} else {
  console.log('\n🎉 ALL 11 SIMULATORS PASSED 100% OF PHYSICS INVARIANTS & PRESETS WITH 0 FAILURES OR NON-FINITE NUMBERS!');
  allResults.forEach((r) => {
    console.log(`  ✓ [${r.simulator}] "${r.scenario}": ${JSON.stringify(r.metrics)}`);
  });
  process.exit(0);
}
