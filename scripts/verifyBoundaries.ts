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

console.log('=== RUNNING BOUNDARY & EXTREME VALUES STABILITY TESTS ===');

let boundaryFailures = 0;

function assertFinite(val: number, name: string) {
  if (!Number.isFinite(val)) {
    console.error(`❌ FAILED: ${name} is ${val}`);
    boundaryFailures++;
  }
}

// 1. Steam Turbine Extreme Bounds
console.log('Testing Steam Turbine boundary cases...');
const stBase = STEAM_TURBINE_SCENARIOS[0].inputs;
[
  { ...stBase, operatingSpeedRpm: 500 },
  { ...stBase, operatingSpeedRpm: 18000 },
  { ...stBase, inletPressureBar: 140, inletTemperatureC: 560, exhaustPressureBar: 0.05 },
  { ...stBase, inletPressureBar: 6, inletTemperatureC: 190, exhaustPressureBar: 5.5 },
  { ...stBase, throttleValveOpeningPercent: 10 },
  { ...stBase, throttleValveOpeningPercent: 100 },
  { ...stBase, ratedPowerKw: 100 },
  { ...stBase, ratedPowerKw: 50000 },
].forEach((inp, idx) => {
  try {
    const res = calculateSteamTurbine(inp);
    assertFinite(res.actualEnthalpyDropKjKg, `ST boundary ${idx} actualEnthalpyDropKjKg`);
    assertFinite(res.steamMassFlowTonnesHr, `ST boundary ${idx} steamMassFlowTonnesHr`);
    assertFinite(res.isentropicEfficiencyPercent, `ST boundary ${idx} isentropicEfficiencyPercent`);
    assertFinite(res.bladeTipVelocityMs, `ST boundary ${idx} bladeTipVelocityMs`);
  } catch (e: any) {
    console.error(`❌ ST crash at boundary ${idx}:`, e.message);
    boundaryFailures++;
  }
});

// 2. Recip Compressor Extreme Bounds
console.log('Testing Reciprocating Compressor boundary cases...');
const rcBase = RECIP_COMPRESSOR_SCENARIOS[0].inputs;
[
  { ...rcBase, crankSpeedRpm: 100 },
  { ...rcBase, crankSpeedRpm: 1800 },
  { ...rcBase, suctionPressureBarA: 1.0, dischargePressureBarA: 35.0 },
  { ...rcBase, suctionPressureBarA: 50.0, dischargePressureBarA: 55.0 },
  { ...rcBase, reciprocatingMassKg: 10 },
  { ...rcBase, reciprocatingMassKg: 500 },
  { ...rcBase, cylinderAction: 'single_acting_he' as const },
  { ...rcBase, cylinderAction: 'single_acting_ce' as const },
].forEach((inp, idx) => {
  try {
    const res = calculateRecipCompressor(inp);
    assertFinite(res.indicatedPowerKw, `RC boundary ${idx} indicatedPowerKw`);
    assertFinite(res.effectiveVolumetricEfficiencyPercent, `RC boundary ${idx} volEff`);
    assertFinite(res.rodLoadReversalDegrees, `RC boundary ${idx} reversalDeg`);
    assertFinite(res.standardVolumeFlowNm3Hr, `RC boundary ${idx} flow`);
  } catch (e: any) {
    console.error(`❌ RC crash at boundary ${idx}:`, e.message);
    boundaryFailures++;
  }
});

// 3. Gearbox Extreme Bounds
console.log('Testing Gearbox boundary cases...');
const gbBase = GEARBOX_SCENARIOS[0].inputs;
[
  { ...gbBase, inputPowerKw: 10, inputSpeedRpm: 300 },
  { ...gbBase, inputPowerKw: 15000, inputSpeedRpm: 12000 },
  { ...gbBase, helixAngleDeg: 0 }, // Spur gear edge case
  { ...gbBase, helixAngleDeg: 35 }, // High helix
  { ...gbBase, oilInletTempC: 20 }, // Cold oil
  { ...gbBase, oilInletTempC: 95 }, // Hot oil
].forEach((inp, idx) => {
  try {
    const res = calculateGearbox(inp);
    assertFinite(res.contactStressMpa, `GB boundary ${idx} contactStress`);
    assertFinite(res.bendingStressMpa, `GB boundary ${idx} bendingStress`);
    assertFinite(res.contactSafetyFactorSH, `GB boundary ${idx} sH`);
    assertFinite(res.bendingSafetyFactorSF, `GB boundary ${idx} sF`);
    assertFinite(res.ehlFilmThicknessUm, `GB boundary ${idx} ehlFilm`);
  } catch (e: any) {
    console.error(`❌ GB crash at boundary ${idx}:`, e.message);
    boundaryFailures++;
  }
});

// 4. Journal Bearing Extreme Bounds
console.log('Testing Journal Bearing boundary cases...');
const jbBase = JOURNAL_BEARING_SCENARIOS[0].inputs;
[
  { ...jbBase, shaftSpeedRpm: 300, staticRadialLoadN: 500 },
  { ...jbBase, shaftSpeedRpm: 18000, staticRadialLoadN: 150000 },
  { ...jbBase, oilInletTempC: 20 },
  { ...jbBase, oilInletTempC: 85 },
  { ...jbBase, radialClearanceUm: 20 },
  { ...jbBase, radialClearanceUm: 250 },
].forEach((inp, idx) => {
  try {
    const res = calculateJournalBearing(inp);
    assertFinite(res.sommerfeldNumber, `JB boundary ${idx} Sommerfeld`);
    assertFinite(res.minimumFilmThicknessUm, `JB boundary ${idx} minFilm`);
    assertFinite(res.eccentricityRatio, `JB boundary ${idx} eccentricity`);
    assertFinite(res.powerLossKw, `JB boundary ${idx} powerLoss`);
  } catch (e: any) {
    console.error(`❌ JB crash at boundary ${idx}:`, e.message);
    boundaryFailures++;
  }
});

// 5. Compressor Surge Extreme Bounds
console.log('Testing Compressor Surge boundary cases...');
const csBase = COMPRESSOR_SCENARIOS[0].inputs;
[
  { ...csBase, massFlowProcessKgS: 0.5 }, // Deep surge
  { ...csBase, massFlowProcessKgS: 40.0 }, // Choke / stonewall
  { ...csBase, compressorSpeedRpm: 3000 },
  { ...csBase, compressorSpeedRpm: 16000 },
  { ...csBase, suctionPressureBar: 1.0 },
  { ...csBase, suctionPressureBar: 40.0 },
].forEach((inp, idx) => {
  try {
    const res = calculateCompressorSurge(inp);
    assertFinite(res.pressureRatioRc, `CS boundary ${idx} pRatio`);
    assertFinite(res.polytropicHeadKjKg, `CS boundary ${idx} head`);
    assertFinite(res.currentSurgeMarginPercent, `CS boundary ${idx} surgeMargin`);
    assertFinite(res.shaftPowerKw, `CS boundary ${idx} power`);
  } catch (e: any) {
    console.error(`❌ CS crash at boundary ${idx}:`, e.message);
    boundaryFailures++;
  }
});

if (boundaryFailures === 0) {
  console.log('\n🎉 ALL BOUNDARY & EXTREME RANGE TESTS PASSED WITH 100% NUMERICAL STABILITY!');
  process.exit(0);
} else {
  console.error(`\n❌ Total boundary failures: ${boundaryFailures}`);
  process.exit(1);
}
