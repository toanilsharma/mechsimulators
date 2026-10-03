import { StatusLevel } from './common';

export type CylinderCrankAction = 'double_acting' | 'single_acting_he' | 'single_acting_ce';

export type GasType =
  | 'natural_gas_methane'
  | 'hydrogen_h2'
  | 'nitrogen_air'
  | 'carbon_dioxide_co2'
  | 'propane_c3h8';

export type ValveFaultCondition =
  | 'normal'
  | 'minor_leak'
  | 'severe_leak'
  | 'late_opening'
  | 'flutter';

export type RingCondition = 'good' | 'worn_blowby' | 'severe_blowby';

export interface RecipCompressorInputs {
  // 1. Machine Geometry & Kinematics
  cylinderBoreMm: number; // e.g. 280 mm
  strokeMm: number; // e.g. 200 mm
  connectingRodLengthMm: number; // e.g. 600 mm
  pistonRodDiameterMm: number; // e.g. 65 mm
  crankSpeedRpm: number; // e.g. 600 RPM
  cylinderAction: CylinderCrankAction;
  heClearancePercent: number; // e.g. 12%
  ceClearancePercent: number; // e.g. 14%
  reciprocatingMassKg: number; // e.g. 160 kg (piston + rod + crosshead)
  rodLoadTensionLimitKn: number; // e.g. 140 kN
  rodLoadCompressionLimitKn: number; // e.g. 150 kN

  // 2. Gas & Process Thermodynamics
  gasType: GasType;
  suctionPressureBarA: number; // e.g. 4.5 bar(a)
  suctionTempC: number; // e.g. 35 °C
  dischargePressureBarA: number; // e.g. 18.0 bar(a)

  // 3. Cylinder Valves & Component Integrity
  suctionValveFault: ValveFaultCondition;
  dischargeValveFault: ValveFaultCondition;
  pistonRingCondition: RingCondition;

  // 4. API 688 Acoustic Pulsation Damper System
  hasPulsationBottles: boolean;
  damperVolumeLiters: number; // e.g. 450 L
  chokeTubeDiameterMm: number; // e.g. 100 mm
  chokeTubeLengthMm: number; // e.g. 600 mm
  pipingLengthToFirstElbowM: number; // e.g. 4.2 m
}

export interface PVDataPoint {
  crankAngleDeg: number; // 0 to 360°
  pistonPositionMm: number; // 0 to stroke
  sweptVolumeLitersHE: number;
  sweptVolumeLitersCE: number;
  cylinderPressureBarAHE: number;
  cylinderPressureBarACE: number;
  idealPressureBarAHE: number;
  gasLoadKn: number;
  inertiaLoadKn: number;
  combinedRodLoadKn: number;
}

export interface HarmonicOrder {
  order: number; // 1X, 2X, 3X, 4X, ...
  frequencyHz: number;
  pressurePulsationPercent: number; // % of line pressure
  api618AllowablePercent: number; // % API 618 limit
  isExceeded: boolean;
}

export interface RecipCompressorOutputs {
  // Thermodynamic performance
  pressureRatio: number;
  headEndVolumetricEfficiencyPercent: number;
  crankEndVolumetricEfficiencyPercent: number;
  effectiveVolumetricEfficiencyPercent: number;
  theoreticalDischargeTempC: number;
  actualDischargeTempC: number;
  massFlowRateKgHr: number;
  standardVolumeFlowNm3Hr: number;
  indicatedPowerKw: number;
  brakePowerKw: number; // with mechanical efficiency

  // Kinematic & Rod Load Reversal per API 618
  maxTensionRodLoadKn: number;
  maxCompressionRodLoadKn: number;
  tensionLoadUtilizationPercent: number;
  compressionLoadUtilizationPercent: number;
  rodLoadReversalDegrees: number; // API 618 requires >= 15°
  reversalPercentOfPeak: number; // API 618 requires >= 3%
  hasAdequateRodLoadReversal: boolean;

  // API 688 Acoustic Pulsation & Surge Bottles
  acousticSpeedOfSoundMs: number;
  helmholtzResonanceHz: number;
  pipingAcousticResonanceHz: number;
  maxPulsationPercentOfLine: number;
  api618AllowablePulsationPercent: number;
  isAcousticPulsationCompliant: boolean;
  harmonics: HarmonicOrder[];

  // Waveform & PV Curves
  pvCurvePoints: PVDataPoint[];

  // Diagnostics & Status
  status: {
    level: StatusLevel;
    label: string;
    message: string;
    score: number;
  };
  detectedFaults: string[];
  recommendations: string[];
  auditTrail: Array<{
    parameter: string;
    equation: string;
    calculatedValue: string;
    referenceStandard: string;
    status: 'pass' | 'warning' | 'fail';
  }>;
}
