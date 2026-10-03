import { StatusAssessment, AuditStep } from './common';

export type GasType = 'natural_gas' | 'air' | 'hydrogen_mix' | 'co2' | 'propane';

export interface GasProperties {
  id: GasType;
  name: string;
  molecularWeight: number; // kg/kmol or g/mol
  k: number; // Specific heat ratio Cp/Cv (isentropic exponent gamma)
  zAverage: number; // Compressibility factor Z
  criticalPressureBar: number;
  criticalTempK: number;
}

export interface CompressorInputs {
  // Scenario Preset
  scenarioId?: string;
  scenarioName?: string;

  // Gas Properties
  gasType: GasType;
  suctionPressureBar: number; // P1 (bar absolute)
  suctionTempC: number; // T1 (°C)

  // Operating Point
  massFlowKgS: number; // Actual mass flow (kg/s)
  speedRpm: number; // Impeller rotational speed (RPM)
  designSpeedRpm: number; // Design speed (default 10,500 RPM)

  // System & Valve Controls
  asvOpeningPercent: number; // Anti-Surge Valve (ASV) opening percentage (0 - 100%)
  asvCv: number; // Valve flow coefficient rating
  recycleCoolerTempC: number; // Cooled recycle gas return temp (°C)

  // Process Geometry & Ratings
  polytropicEfficiency: number; // 0.70 to 0.88
  impellerDiameterMm: number; // Impeller tip diameter (e.g. 450 mm)
  surgeMarginTargetPercent: number; // Standard target margin, e.g. 10% or 15%
}

export type CompressorOperatingState = 'choke' | 'normal' | 'surge_warning' | 'incipient_surge' | 'deep_surge';

export interface CompressorOutputs {
  // Gas & Thermodynamics
  gasProperties: GasProperties;
  densitySuctionKgM3: number;
  volumetricFlowActualM3h: number;
  massFlowTotalKgS: number; // through compressor (process + recycle)
  processMassFlowKgS: number;
  asvRecycleMassFlowKgS: number;

  // Aerodynamics & Compression
  pressureRatioRc: number; // P2 / P1
  dischargePressureBar: number; // P2 (bar absolute)
  polytropicHeadKjKg: number; // H_p (kJ/kg)
  polytropicHeadM: number; // H_p in meters of fluid column
  dischargeTempC: number; // T2 (°C)
  shaftPowerKw: number; // Gas compression power required (kW)

  // Surge Dynamics & Boundaries
  surgeLimitMassFlowKgS: number; // SLL flow for current speed & pressure ratio
  surgeControlMassFlowKgS: number; // SCL flow (with safety margin)
  currentSurgeMarginPercent: number; // ((Flow - SLL) / SLL) * 100
  distanceToSclPercent: number; // distance relative to SCL
  chokeLimitMassFlowKgS: number; // Stonewall limit

  // Operating Assessment
  operatingState: CompressorOperatingState;
  pressureOscillationBar: number; // Dynamic peak-to-peak pressure oscillation if surging
  surgeCycleFrequencyHz: number; // Surge oscillation frequency (0.5 to 3.0 Hz typical)
  reverseFlowDetected: boolean;
  thrustBearingLoadPercent: number; // Axial thrust load (rises drastically during surge reversals)
  acousticNoiseDba: number; // dBA estimate (surges create violent > 105 dBA bangs)

  // Standards Compliance & Audit Trail
  status: StatusAssessment;
  auditTrail: AuditStep[];
}
