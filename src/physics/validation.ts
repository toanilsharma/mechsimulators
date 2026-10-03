/**
 * Built-in Engineering Test Cases, Unit Consistency Verification, and Boundary Checks
 * 
 * Provides automated verification functions and physical validation rules for all
 * mechanical, hydraulic, rotordynamic, and thermodynamic models.
 */

import * as Units from './units';
import { calculateWaterVaporPressure, calculateWaterDensity, FLUID_PRESETS, createFluidProperties } from './fluids';
import { calculateReynoldsNumber, calculateDarcyFrictionFactor, calculatePipeVelocity, evaluatePipeHydraulics } from './pipeFlow';
import { fitQuadraticPumpCurves, calculateNPSHa, assessCavitationMargin } from './pumpMath';
import { calculateUnbalanceForce, calculatePermissibleUnbalance, classifyVibrationSeverity } from './rotorMath';
import { calculateBasicRatingLife, calculateReferenceViscosityNu1, evaluateBearingLife } from './bearingMath';
import { calculateThermalExpansion, calculateRestrainedAxialStress, calculateHoopStress } from './pipeStressMath';
import { calculateOrificeFlowLpm, calculateSealFaceHeatKw } from './sealMath';
import { calculateSeal } from '../utils/sealCalculations';
import { calculateCompressorSurge } from '../utils/compressorCalculations';
import { calculateRecipCompressor } from '../utils/recipCompressorCalculations';
import { calculateGearbox } from '../utils/gearboxCalculations';
import { calculateSteamTurbine } from '../utils/steamTurbineCalculations';
import { calculateJournalBearing } from '../utils/journalBearingCalculations';
import { calculateShaftAlignment } from './alignmentMath';
import { calculateBearingFaults } from '../utils/bearingCalculations';


export interface ValidationTestResult {
  module: string;
  testName: string;
  passed: boolean;
  actual: number | string | boolean;
  expected: string;
  tolerancePct?: number;
  message?: string;
}

export interface SystemValidationReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  isAllPassed: boolean;
  results: ValidationTestResult[];
}

/**
 * Execute full verification suite for physics calculations
 */
export function runPhysicsValidationSuite(): SystemValidationReport {
  const results: ValidationTestResult[] = [];

  const checkNumber = (
    module: string,
    testName: string,
    actual: number,
    expected: number,
    toleranceFraction = 0.05
  ) => {
    const error = Math.abs(actual - expected);
    const maxAllowedError = Math.abs(expected) * toleranceFraction;
    const passed = error <= maxAllowedError || (expected === 0 && actual === 0);
    results.push({
      module,
      testName,
      passed,
      actual: Number(actual.toFixed(4)),
      expected: `${expected} (±${(toleranceFraction * 100).toFixed(1)}%)`,
      tolerancePct: toleranceFraction * 100,
      message: passed ? 'Passed verification benchmark' : `Deviation: ${(error / (expected || 1) * 100).toFixed(2)}%`,
    });
  };

  const checkBoolean = (
    module: string,
    testName: string,
    actual: boolean,
    expected: boolean
  ) => {
    const passed = actual === expected;
    results.push({
      module,
      testName,
      passed,
      actual,
      expected: String(expected),
      message: passed ? 'Passed logic assertion' : 'Failed logic assertion',
    });
  };

  // 1. Units Verification
  checkNumber('Units', 'm to ft (10 m)', Units.mToFt(10), 32.8084, 0.001);
  checkNumber('Units', 'kPa to psi (100 kPa)', Units.kpaToPsi(100), 14.5038, 0.001);
  checkNumber('Units', 'm³/h to US gpm (100 m³/h)', Units.m3hToUsGpm(100), 440.287, 0.001);
  checkNumber('Units', 'kW to hp (75 kW)', Units.kwToHp(75), 100.579, 0.002);
  checkNumber('Units', 'RPM to rad/s (3000 RPM)', Units.rpmToRadS(3000), 314.159, 0.001);
  checkNumber('Units', 'g·mm to kg·m (1000 g·mm)', Units.gMmToKgM(1000), 0.001, 0.001);

  // 2. Fluids Verification (Water Properties @ 20°C and 90°C)
  // Water @ 20°C vapor pressure ~ 2.34 kPa abs
  const vap20 = calculateWaterVaporPressure(20);
  checkNumber('Fluids', 'Water 20°C Vapor Pressure (kPa abs)', vap20, 2.34, 0.05);

  // Water @ 90°C vapor pressure ~ 70.1 kPa abs
  const vap90 = calculateWaterVaporPressure(90);
  checkNumber('Fluids', 'Water 90°C Vapor Pressure (kPa abs)', vap90, 70.1, 0.05);

  // Water density @ 20°C ~ 998.2 kg/m³
  const rho20 = calculateWaterDensity(20);
  checkNumber('Fluids', 'Water 20°C Density (kg/m³)', rho20, 998.2, 0.01);

  // 3. Pipe Flow Verification
  // Velocity in DN100 (102.3 mm) @ 100 m³/h -> v = Q / A = (100/3600) / (pi/4 * 0.1023^2) ~ 3.38 m/s
  const vPipe = calculatePipeVelocity(100, 102.3);
  checkNumber('PipeFlow', 'DN100 Velocity @ 100 m³/h (m/s)', vPipe, 3.38, 0.02);

  // Reynolds @ v=3.38 m/s, D=102.3 mm, nu=1.004 cSt -> Re ~ 3.44 x 10^5
  const re = calculateReynoldsNumber(vPipe, 102.3, 1.004);
  checkNumber('PipeFlow', 'Reynolds Number in DN100', re, 344500, 0.05);

  // Darcy f for turbulent commercial steel (roughness 0.045 mm, D=102.3 mm, Re=3.44e5) -> f ~ 0.0185
  const f = calculateDarcyFrictionFactor(re, 0.045, 102.3);
  checkNumber('PipeFlow', 'Darcy Friction Factor (Swamee-Jain/Colebrook)', f, 0.0185, 0.08);

  // 4. Pump Math Verification
  // NPSHa with atmospheric vessel (101.3 kPa abs), 2 m liquid level, 0.5 m friction loss, 20°C water (2.34 kPa)
  // Head = (101.3 - 2.34)*1000/(998.2 * 9.80665) + 2.0 - 0.5 ~ 10.11 + 1.5 = 11.61 m
  const npsha = calculateNPSHa({
    suctionVesselPressureKPa: 101.325,
    isSuctionPressureGauge: false,
    liquidLevelElevationM: 2.0,
    suctionLineLossesM: 0.5,
    vaporPressureKPaAbs: 2.34,
    densityKgM3: 998.2,
  });
  checkNumber('PumpMath', 'NPSHa Calculation Flooded Suction (m)', npsha, 11.61, 0.02);

  // Cavitation check: NPSHa = 11.61 m vs NPSHr = 3.2 m -> safe (Ratio ~ 3.6)
  const cav = assessCavitationMargin(npsha, 3.2);
  checkBoolean('PumpMath', 'Cavitation Margin Status Safe', cav.status === 'safe', true);

  // 5. Rotor Math Verification
  // Unbalance Force: 50 g·mm @ 3000 RPM (omega=314.16 rad/s)
  // F = 50e-6 * 314.16^2 = 4.935 N
  const fUnbalance = calculateUnbalanceForce(50, 3000);
  checkNumber('RotorMath', 'Unbalance Force (50 g·mm @ 3000 RPM)', fUnbalance, 4.935, 0.02);

  // ISO 1940-1 G2.5 permissible for 25 kg rotor @ 3000 RPM:
  // e_per = (2.5 * 1000) / 314.16 = 7.96 g·mm/kg -> U_per = 7.96 * 25 = 198.9 g·mm
  const uPerm = calculatePermissibleUnbalance('G2.5', 3000, 25);
  checkNumber('RotorMath', 'ISO 1940-1 G2.5 Permissible (g·mm)', uPerm.permissibleUnbalanceGMm, 198.9, 0.02);

  // ISO 10816 Zone check: 1.2 mm/s RMS -> Zone A (Safe)
  const vibClass = classifyVibrationSeverity(1.2, 'rigid', 'group2');
  checkBoolean('RotorMath', 'ISO 10816 Zone A Classification', vibClass.zone === 'A', true);

  // 6. Bearing Math Verification
  // 6309 Ball Bearing: C = 55 kN, P = 5 kN, 1450 RPM
  // L10 = (55/5)^3 = 1331 million revs
  // L10h = (1e6 / (60 * 1450)) * 1331 = 15,300 hrs
  const bLife = calculateBasicRatingLife(55, 5, 1450, 'ball');
  checkNumber('BearingMath', 'Basic L10 (Million Revs)', bLife.l10MillionRev, 1331, 0.01);
  checkNumber('BearingMath', 'Basic L10h (Operating Hours)', bLife.l10Hours, 15300, 0.02);

  // 7. Pipe Stress Math Verification
  // Thermal expansion: Carbon Steel (alpha=11.7e-6), L=50 m, deltaT=120°C
  // deltaL = 50 * 11.7e-6 * 120 * 1000 = 70.2 mm
  const deltaL = calculateThermalExpansion(50, 120, 11.7);
  checkNumber('PipeStress', 'Thermal Elongation (50 m @ 120°C deltaT)', deltaL, 70.2, 0.01);

  // Restrained Stress: E=200 GPa, alpha=11.7e-6, deltaT=120°C -> sigma = 200000 * 11.7e-6 * 120 = 280.8 MPa
  const sigmaAxial = calculateRestrainedAxialStress(120, 200, 11.7);
  checkNumber('PipeStress', 'Restrained Thermal Stress (MPa)', sigmaAxial, 280.8, 0.01);

  // Hoop Stress: P=2000 kPa (2 MPa), Do=168.3 mm (6" Sch 40, t=7.11 mm)
  // sigma_hoop = (2 * 168.3) / (2 * 7.11) = 23.67 MPa
  const hoop = calculateHoopStress(2000, 168.3, 7.11);
  checkNumber('PipeStress', 'Internal Pressure Hoop Stress (MPa)', hoop, 23.67, 0.02);

  // 8. Seal Math Verification
  // Orifice flow: 3.5 mm orifice, deltaP = 600 kPa, water density 1000 kg/m³, Cd = 0.62
  // Area = pi/4 * 0.0035^2 = 9.62e-6 m2
  // Q = 0.62 * 9.62e-6 * sqrt(2 * 600000 / 1000) = 0.62 * 9.62e-6 * 34.64 = 2.066e-4 m3/s = 12.4 L/min
  const qOrifice = calculateOrificeFlowLpm(600, 3.5, 1000, 0.62);
  checkNumber('SealMath', 'Orifice Flow Rate (3.5 mm @ 600 kPa)', qOrifice, 12.4, 0.05);

  // 9. Specific Requested Validation Benchmarks (4 Core Test Cases)
  // Benchmark 1: Pump Validation - Water 20°C, Open Tank (101.325 kPa), 2m suction lift (Z = -2.0m), 0.5m friction loss, 20°C water (2.34 kPa)
  // NPSHa = (101.325 - 2.34)*1000/(998.2*9.80665) - 2.0 - 0.5 = 10.11 - 2.5 = 7.61 m (≈ 7.6 m)
  const pumpBenchmarkNpsha = calculateNPSHa({
    suctionVesselPressureKPa: 101.325,
    isSuctionPressureGauge: false,
    liquidLevelElevationM: -2.0,
    suctionLineLossesM: 0.5,
    vaporPressureKPaAbs: 2.34,
    densityKgM3: 998.2,
  });
  checkNumber('Benchmark - Pump', 'Water 20°C Open Tank (Expected NPSHa ≈ 7.6 m)', pumpBenchmarkNpsha, 7.61, 0.02);

  // Benchmark 2: Rotor Validation - Ball Bearing C/P = 8 at 1800 RPM
  // L10 = (8)^3 = 512 M revs, L10h = 512 * 10^6 / (60 * 1800) = 4,740.74 hrs (≈ 4,740 hrs)
  const rotorBenchmarkLife = calculateBasicRatingLife(64, 8, 1800, 'ball'); // C=64 kN, P=8 kN -> C/P = 8.0
  checkNumber('Benchmark - Rotor', 'Ball Bearing C/P = 8 @ 1800 RPM (Expected Life ≈ 4,740 hrs)', rotorBenchmarkLife.l10Hours, 4740.7, 0.01);

  // Benchmark 3: Pipe Validation - Carbon Steel 10 m, ΔT = 100°C (alpha = 12.0×10⁻⁶/°C)
  // ΔL = 10.0 * 100 * 12.0×10⁻⁶ * 1000 = 12.0 mm (≈ 12 mm)
  const pipeBenchmarkExpansion = calculateThermalExpansion(10.0, 100, 12.0);
  checkNumber('Benchmark - Pipe', 'Carbon Steel 10 m, ΔT 100°C (Expected Expansion ≈ 12 mm)', pipeBenchmarkExpansion, 12.0, 0.01);

  // Benchmark 4: Seal Validation
  // 4a: Orifice flow positive and physically reasonable (3.0 mm orifice, 100 kPa ΔP, Cd=0.6, water) -> Q = 3.60 L/min
  const sealBenchmarkOrificeQ = calculateOrificeFlowLpm(100, 3.0, 1000, 0.60);
  checkNumber('Benchmark - Seal', 'Plan 11 Orifice Flow (3mm, 100 kPa ΔP > 0)', sealBenchmarkOrificeQ, 3.60, 0.02);
  checkBoolean('Benchmark - Seal', 'Orifice Flow is Positive and Non-Zero', sealBenchmarkOrificeQ > 0, true);

  // 4b: Dual pressurized barrier pressure warning activates when barrier pressure < seal chamber pressure
  // If barrier = 300 kPag and chamber = 400 kPag -> barrierDelta = -100 kPa (< 140 kPa minimum) -> warning active
  const barrierCheck = calculateSeal({
    planId: 'plan_53a',
    processFluidType: 'sour_water',
    processFluidTempC: 50,
    pumpDischargePressureKPag: 800,
    sealChamberPressureKPag: 400,
    pumpSuctionPressureKPag: 150,
    shaftSpeedRpm: 2950,
    sealSizeMm: 65,
    balanceRatioK: 0.75,
    faceMaterials: 'sic_vs_sic',
    faceFrictionCoeff: 0.08,
    flushOrificeDiameterMm: 3.0,
    allowableFlushTempRiseC: 10,
    fluidDensityKgM3: 998,
    fluidSpecificHeatCp: 4.184,
    barrierBufferPressureKPag: 300, // Below chamber pressure 400 kPag -> Critical defect!
    barrierFluid: 'water_glycol_50_50',
    barrierFluidVolumeL: 20,
    coolerCapacityKW: 5.0,
    coolingWaterSupplyTempC: 25,
    coolingWaterFlowLpm: 15,
    externalFlushPressureKPag: 600,
    externalFlushFlowLpm: 10,
    quenchFluidType: 'nitrogen',
    accumulatorPrechargeKPag: 200,
    pressureControlMethod: 'fixed_n2_regulator',
  });
  checkBoolean('Benchmark - Seal', 'Barrier Warning Active when Barrier Pressure < Seal Chamber Pressure', barrierCheck.api682BarrierMarginCompliant === false && barrierCheck.status.level === 'critical', true);

  // Benchmark 5: Centrifugal Compressor Validation (API 617 / ASME PTC 10)
  // Air at 1.013 bar, 20°C: rho = 1.013e5 / (1.0 * (8314.46 / 28.97) * 293.15) ≈ 1.204 kg/m³
  const compBenchmark = calculateCompressorSurge({
    gasType: 'air',
    suctionPressureBar: 1.01325,
    suctionTempC: 20,
    massFlowKgS: 25.0,
    speedRpm: 10500,
    designSpeedRpm: 10500,
    impellerDiameterMm: 450,
    polytropicEfficiency: 0.82,
    asvCv: 120,
    asvOpeningPercent: 0,
    surgeMarginTargetPercent: 12,
    recycleCoolerTempC: 35,
  });
  checkNumber('Benchmark - Compressor', 'Air Suction Density (kg/m³)', compBenchmark.densitySuctionKgM3, 1.204, 0.02);
  checkBoolean('Benchmark - Compressor', 'Operating State is Normal at Design Flow', compBenchmark.operatingState === 'normal', true);
  checkBoolean('Benchmark - Compressor', 'Surge Margin Exceeds API 617 Target (12%)', compBenchmark.currentSurgeMarginPercent >= 12, true);

  // Benchmark 6: Reciprocating Compressor Validation (API 618 5th Ed)
  // Double-acting cylinder must have >= 15° rod load reversal
  const recipBenchmark = calculateRecipCompressor({
    cylinderBoreMm: 250,
    strokeMm: 180,
    connectingRodLengthMm: 540,
    pistonRodDiameterMm: 55,
    crankSpeedRpm: 600,
    cylinderAction: 'double_acting',
    heClearancePercent: 12,
    ceClearancePercent: 14,
    reciprocatingMassKg: 42,
    rodLoadTensionLimitKn: 120,
    rodLoadCompressionLimitKn: 130,
    gasType: 'natural_gas_methane',
    suctionPressureBarA: 4.5,
    suctionTempC: 30,
    dischargePressureBarA: 14.0,
    suctionValveFault: 'normal',
    dischargeValveFault: 'normal',
    pistonRingCondition: 'good',
    hasPulsationBottles: true,
    damperVolumeLiters: 450,
    chokeTubeDiameterMm: 45,
    chokeTubeLengthMm: 750,
    pipingLengthToFirstElbowM: 2.2,
  });
  checkBoolean('Benchmark - Recip Compressor', 'API 618 Rod Load Reversal Compliant (>= 15°)', recipBenchmark.hasAdequateRodLoadReversal, true);
  checkBoolean('Benchmark - Recip Compressor', 'Acoustic Pulsation Compliant with Dampers', recipBenchmark.isAcousticPulsationCompliant, true);

  // Benchmark 7: Industrial Gearbox Mesh Dynamics (AGMA 2001 / ISO 6336)
  // Pinion 25T, Gear 75T -> u = 3.0. Speed 1500 RPM (25 Hz) -> GMF = 25 * 25 = 625 Hz
  const gearboxBenchmark = calculateGearbox({
    gearType: 'helical',
    ratedPowerKw: 75,
    inputSpeedRpm: 1500,
    pinionTeeth: 25,
    gearTeeth: 75,
    normalModuleMm: 4.0,
    faceWidthMm: 60,
    pressureAngleDeg: 20,
    helixAngleDeg: 15,
    materialGrade: 'carburized_case_hardened',
    isoQualityGrade: 6,
    pinionHardnessHrc: 60,
    gearHardnessHrc: 58,
    lubricant: 'iso_vg_220',
    oilOperatingTempC: 60,
    surfaceRoughnessRaUm: 0.8,
    toothFault: 'none',
    pinionEccentricityUm: 5,
    applicationServiceFactor: 1.25,
    backlashMm: 0.15,
  });
  checkNumber('Benchmark - Gearbox', 'Gear Mesh Frequency GMF (Hz)', gearboxBenchmark.gearMeshFrequencyHz, 625.0, 0.001);
  checkNumber('Benchmark - Gearbox', 'Hunting Tooth Frequency HTF (Hz)', gearboxBenchmark.huntingToothFrequencyHz, 8.333, 0.02);
  checkBoolean('Benchmark - Gearbox', 'AGMA Bending Safety Factor SF >= 1.3', gearboxBenchmark.bendingSafetyFactorSF >= 1.3, true);
  checkBoolean('Benchmark - Gearbox', 'Full/Mixed EHL Lubrication (Lambda >= 1.0)', gearboxBenchmark.specificFilmThicknessLambda >= 1.0, true);

  // Benchmark 8: Steam Turbine Expansion (API 612 / ASME PTC 6)
  // Inlet: 40 bar, 400°C -> Superheated steam. Exhaust: 0.1 bar condensing
  const turbineBenchmark = calculateSteamTurbine({
    turbineType: 'condensing',
    inletPressureBar: 40.0,
    inletTemperatureC: 400.0,
    exhaustPressureBar: 0.10,
    ratedPowerKw: 2500,
    ratedSpeedRpm: 6000,
    operatingSpeedRpm: 6000,
    numberOfStages: 6,
    meanBladeDiameterMm: 550,
    lastStageBladeLengthMm: 120,
    firstCriticalSpeedRpm: 3800,
    secondCriticalSpeedRpm: 8500,
    bladeNaturalFrequencyHz: 420,
    nozzlePassFrequencyCount: 24,
    stageDesign: 'impulse_rateau',
    governingMode: 'throttle_governing',
    governorDroopPercent: 4.0,
    throttleValveOpeningPercent: 100,
    bladeMaterial: 'martensitic_stainless_12cr',
    stelliteErosionShieldInstalled: true,
    thrustBearingPadTempC: 72,
    lubeOilInletPressureBar: 2.5,
    condenserVacuumKpa: 90,
    casingWarmUpDifferentialMm: 0.2,
  });
  checkBoolean('Benchmark - Steam Turbine', 'Inlet Superheat Positive (> 100°C)', turbineBenchmark.inletSuperheatC > 100, true);
  checkBoolean('Benchmark - Steam Turbine', 'Isentropic Enthalpy Drop > 800 kJ/kg', turbineBenchmark.isentropicEnthalpyDropKjKg > 800, true);
  checkBoolean('Benchmark - Steam Turbine', 'Operating Speed Separated from 1st Critical (>= 15%)', turbineBenchmark.criticalSpeedSeparationMarginPercent >= 15.0, true);
  checkBoolean('Benchmark - Steam Turbine', 'No Overspeed Trip at Rated Speed', turbineBenchmark.isOverspeedTripTriggered === false, true);

  // Benchmark 9: Hydrodynamic Journal Bearing (API 684 / DIN 31652)
  // 100 mm journal, 15 kN load, 3000 RPM, ISO VG 46 oil @ 50°C
  const journalBenchmark = calculateJournalBearing({
    bearingType: 'tilt_pad_4pad_lop',
    journalDiameterMm: 100,
    bearingLengthMm: 100,
    radialClearanceUm: 80,
    shaftSpeedRpm: 3000,
    staticRadialLoadKn: 15,
    oilGrade: 'ISO_VG_46',
    oilSupplyTempC: 45,
    oilSupplyPressureBar: 1.5,
    rotorFirstCriticalSpeedRpm: 1800,
    unbalanceGmm: 20,
  });
  checkBoolean('Benchmark - Journal Bearing', 'Tilting Pad Bearing Eliminates Cross-Coupling (< 5 kN/mm)', Math.abs(journalBenchmark.dynamicCoefficients.kxyKnMm) < 5.0, true);
  checkBoolean('Benchmark - Journal Bearing', 'Minimum Film Thickness Safe (h_min >= 8 µm)', journalBenchmark.minimumFilmThicknessUm >= 8.0, true);
  checkBoolean('Benchmark - Journal Bearing', 'Stable Hydrodynamic Operation (API 684 log dec > 0.1)', journalBenchmark.logarithmicDecrement >= 0.10, true);

  // Benchmark 10: Laser Shaft Alignment (API 686 / ANSI S2.75)
  // Pump centerline 300 mm, Carbon Steel (alpha=11.7e-6), deltaT=100°C
  // Thermal expansion ~ 300 * 11.7e-6 * 100 * 0.85 ≈ 0.298 mm
  const alignBenchmark = calculateShaftAlignment({
    pumpCenterlineHeightMm: 300,
    motorCenterlineHeightMm: 300,
    pumpCasingMaterial: 'carbon_steel',
    pumpFluidTempC: 120,
    motorOperatingTempC: 40,
    ambientInstallationTempC: 20,
    thermalGrowthMode: 'auto_calculated',
    manualTargetVerticalOffsetMm: 0,
    manualTargetAngularOffsetMrad: 0,
    distCouplingToMotorFrontFootMm: 200,
    distMotorFrontToRearFootMm: 400,
    distCouplingToPumpFrontFootMm: 150,
    distPumpFrontToRearFootMm: 350,
    couplingSpacerLengthMm: 140,
    couplingHubDiameterMm: 120,
    couplingType: 'metallic_disc_pack',
    measuredVerticalOffsetMm: -0.25,
    measuredVerticalAngleMrad: -0.1,
    measuredHorizontalOffsetMm: 0.02,
    measuredHorizontalAngleMrad: 0.05,
    motorRpm: 2950,
    softFootFrontLeftMm: 0.02,
    softFootFrontRightMm: 0.01,
    softFootRearLeftMm: 0.03,
    softFootRearRightMm: 0.02,
    pipingInducedNozzleMomentKnm: 0,
    measurementMethod: 'dual_laser',
    indicatorBracketSagMm: 0,
    angularStiffnessNmPerMrad: 400,
    radialStiffnessNPerMm: 1500,
    maxAllowableContinuousAngleDeg: 0.5,
  });
  checkBoolean('Benchmark - Shaft Alignment', 'Pump Thermal Growth is Positive', alignBenchmark.pumpThermalGrowthMm > 0.20, true);
  checkBoolean('Benchmark - Shaft Alignment', 'Soft Foot Meets API 686 Limit (<= 0.05 mm)', alignBenchmark.softFootCompliant, true);

  // Benchmark 11: Bearing Pass Frequencies (SKF 6309 @ 1500 RPM -> fr = 25 Hz)
  // SKF 6309: Z=8, Dw=17.46 mm, dm=72.5 mm, alpha=0°
  // ratio = 17.46 / 72.5 = 0.24083
  // BPFO = (8/2) * (1 - 0.24083) * 25 = 4 * 0.75917 * 25 = 75.92 Hz
  // BPFI = (8/2) * (1 + 0.24083) * 25 = 4 * 1.24083 * 25 = 124.08 Hz
  const bearingFreqBenchmark = calculateBearingFaults({
    bearingId: 'skf_6309',
    shaftSpeedRpm: 1500,
    radialLoadKn: 4.5,
    axialLoadKn: 1.0,
    oilViscosityCSt: 68,
    bearingTempC: 55,
    faultLocation: 'outer_race',
    defectSizeMicrons: 250,
    faultSeverityPercent: 20,
    sensorType: 'accelerometer',
    noiseLevelPercent: 5,
  });
  checkNumber('Benchmark - Bearing Faults', 'BPFO Frequency (Hz)', bearingFreqBenchmark.frequencies.bpfoHz, 75.92, 0.02);
  checkNumber('Benchmark - Bearing Faults', 'BPFI Frequency (Hz)', bearingFreqBenchmark.frequencies.bpfiHz, 124.08, 0.02);


  const passedTests = results.filter((r) => r.passed).length;
  const totalTests = results.length;

  return {
    timestamp: new Date().toISOString(),
    totalTests,
    passedTests,
    failedTests: totalTests - passedTests,
    isAllPassed: passedTests === totalTests,
    results,
  };
}

/**
 * Validate user input parameters against physical boundaries
 */
export function validateEngineeringInputs(inputs: {
  speedRpm?: number;
  flowM3h?: number;
  pressureKPa?: number;
  temperatureC?: number;
  pipeDiameterMm?: number;
  densityKgM3?: number;
}): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (inputs.speedRpm !== undefined) {
    if (inputs.speedRpm <= 0) errors.push('Rotational speed must be positive and non-zero.');
    if (inputs.speedRpm > 20000) warnings.push('Speed exceeds 20,000 RPM; verify ultra-high speed rotordynamic stability.');
  }

  if (inputs.flowM3h !== undefined) {
    if (inputs.flowM3h < 0) errors.push('Flow rate cannot be negative.');
  }

  if (inputs.temperatureC !== undefined) {
    if (inputs.temperatureC < -273.15) errors.push('Temperature cannot be below absolute zero (-273.15°C).');
    if (inputs.temperatureC > 600) warnings.push('Temperature exceeds 600°C; material creep and oxidation limits apply.');
  }

  if (inputs.pipeDiameterMm !== undefined) {
    if (inputs.pipeDiameterMm <= 0) errors.push('Pipe diameter must be greater than 0 mm.');
  }

  if (inputs.densityKgM3 !== undefined) {
    if (inputs.densityKgM3 <= 0) errors.push('Liquid density must be greater than 0 kg/m³.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
