import { StatusAssessment, AuditItem } from './common';

export type TurbineType = 'back_pressure' | 'condensing' | 'extraction_condensing';
export type StageDesign = 'impulse_curtis' | 'impulse_rateau' | 'reaction_parsons';
export type GoverningMode = 'throttle_governing' | 'nozzle_governing';

export interface SteamTurbineInputs {
  // Thermodynamic Inlet Conditions
  turbineType: TurbineType;
  stageDesign: StageDesign;
  inletPressureBar: number;         // 5 to 140 bar(a)
  inletTemperatureC: number;        // 180 to 560 °C
  exhaustPressureBar: number;       // 0.05 to 25 bar(a) (e.g., 0.10 for condensing, 3.5 for back-pressure)

  // Mechanical & Aerodynamic Rating
  ratedPowerKw: number;             // 100 to 25,000 kW
  ratedSpeedRpm: number;            // 1,500 to 14,000 RPM
  numberOfStages: number;           // 1 to 16 stages
  meanBladeDiameterMm: number;      // 300 to 1,200 mm
  lastStageBladeLengthMm: number;   // 50 to 450 mm

  // Governing & Control
  governingMode: GoverningMode;
  governorDroopPercent: number;     // 2% to 8% (API 612 standard: 3% to 5%)
  operatingSpeedRpm: number;        // actual running speed
  throttleValveOpeningPercent: number; // 20% to 100%

  // Rotor Dynamics & Blade Mechanics
  firstCriticalSpeedRpm: number;    // lateral critical speed (e.g. 2,400 RPM)
  secondCriticalSpeedRpm: number;   // second critical (e.g. 6,800 RPM)
  bladeMaterial: 'martensitic_stainless_12cr' | 'titanium_ti6al4v' | 'nickel_alloy_inconel';
  bladeNaturalFrequencyHz: number;  // fundamental blade bending frequency
  nozzlePassFrequencyCount: number; // number of stator nozzles (e.g. 24 to 72)
  stelliteErosionShieldInstalled: boolean;

  // Bearing & Auxiliary Operating State
  thrustBearingPadTempC: number;    // 50 to 130 °C
  lubeOilInletPressureBar: number;  // 1.0 to 3.5 bar
  condenserVacuumKpa: number;       // 5 to 101.3 kPa (abs)
  casingWarmUpDifferentialMm: number; // rotor-casing differential expansion (-0.5 to +2.0 mm)
}

export interface MollierPoint {
  entropy: number;       // kJ/(kg·K)
  enthalpy: number;      // kJ/kg
  label: string;
  pressureBar: number;
  temperatureC: number;
  quality?: number;      // dryness fraction x
}

export interface CampbellLine {
  orderName: string;     // '1X', '2X', 'NPF', etc.
  slope: number;         // frequency per RPM
  isHarmonicOfNozzle: boolean;
}

export interface SteamTurbineOutputs {
  // Thermodynamic Properties
  inletEnthalpyKjKg: number;
  inletEntropyKjKgK: number;
  inletSuperheatC: number;
  saturationTempInletC: number;

  // Expansion & Enthalpy Drop
  exhaustSaturationTempC: number;
  isentropicExhaustEnthalpyKjKg: number;
  isentropicEnthalpyDropKjKg: number;
  actualEnthalpyDropKjKg: number;
  actualExhaustEnthalpyKjKg: number;
  actualExhaustTempC: number;
  isentropicEfficiencyPercent: number;

  // Exhaust Steam Quality & Erosion Risk
  exhaustSteamQualityX: number;     // 0.80 - 1.05 (>1 is superheated)
  exhaustMoisturePercent: number;   // (1 - x) * 100%
  wilsonLineCrossed: boolean;
  moistureErosionRiskLevel: 'safe' | 'warning' | 'critical';
  maxAllowableMoisturePercent: number; // 12% per API 612 / EPRI
  bladeTipVelocityMs: number;
  dropletImpactVelocityMs: number;

  // Mass Flow & Steam Consumption (Willans Line)
  theoreticalSteamRateTsrKgKwh: number; // TSR = 3600 / Δhs
  actualSteamRateAsrKgKwh: number;      // ASR = TSR / ηs
  steamMassFlowKgS: number;
  steamMassFlowTonnesHr: number;
  noLoadSteamFlowTonnesHr: number;      // Willans line intercept
  mechanicalLossesKw: number;
  netInternalPowerKw: number;

  // Kinematics & Velocity Ratio
  bladePitchLineVelocityMs: number;    // U = π·D·N / 60
  isentropicSpoutingVelocityMs: number;// C0 = √(2000·Δhs)
  velocityRatioUOverC0: number;        // optimal is ~0.45-0.50 for impulse, ~0.70 for reaction
  optimalVelocityRatio: number;

  // Rotor Dynamics & Speed Control
  criticalSpeedSeparationMarginPercent: number;
  isNearCriticalSpeed: boolean;
  governorSpeedDeviationPercent: number;
  overspeedTripThresholdRpm: number;   // 110% of rated speed
  overspeedTripMarginRpm: number;
  isOverspeedTripTriggered: boolean;

  // Blade Resonance & Campbell Analysis
  nozzlePassFrequencyHz: number;       // NPF = z_nozzle * (N / 60)
  bladeResonanceMarginPercent: number; // margin from NPF or 2X to natural frequency
  isBladeResonant: boolean;

  // Mechanical & Thrust Integrity
  calculatedAxialThrustKn: number;
  thrustBearingLoadPercent: number;
  shaftRelativeVibrationUmPkPk: number; // API 670 proximity probe displacement
  iso20816VibrationZone: 'A' | 'B' | 'C' | 'D';
  differentialExpansionStatus: 'normal' | 'warning' | 'trip';

  // Overall Health Assessment
  status: StatusAssessment;
  auditTrail: AuditItem[];
  mollierPoints: MollierPoint[];
}

export interface SteamTurbineScenario {
  id: string;
  name: string;
  category: 'normal' | 'abnormal';
  event?: string;
  consequence?: string;
  recommendedAction?: string;
  description: string;
  inputs: SteamTurbineInputs;
}
