import { StatusAssessment, AuditStep } from './common';

export type JournalBearingType =
  | 'plain_cylindrical'
  | 'axial_groove'
  | 'pressure_dam'
  | 'tilt_pad_4pad_lop'
  | 'tilt_pad_5pad_lbp';

export type OilIsoGrade = 'ISO_VG_32' | 'ISO_VG_46' | 'ISO_VG_68';

export type JournalInstabilityMode =
  | 'stable'
  | 'oil_whirl'
  | 'oil_whip'
  | 'boundary_rub';

export interface JournalBearingInputs {
  bearingType: JournalBearingType;
  journalDiameterMm: number; // 50 to 250 mm
  bearingLengthMm: number; // 25 to 250 mm (L/D ~ 0.4 to 1.2)
  radialClearanceUm: number; // 20 to 250 um (clearance ratio ~ 0.001 - 0.0025)
  shaftSpeedRpm: number; // 600 to 15,000 RPM
  staticRadialLoadKn: number; // 1 to 60 kN
  oilGrade: OilIsoGrade;
  oilSupplyTempC: number; // 30 to 80 °C
  oilSupplyPressureBar: number; // 0.5 to 3.5 bar
  rotorFirstCriticalSpeedRpm: number; // 1000 to 8000 RPM (rotor bending natural mode)
  unbalanceGmm: number; // residual unbalance 0 to 400 g-mm
}

export interface DynamicCoefficients {
  kxxKnMm: number; // Direct stiffness X
  kyyKnMm: number; // Direct stiffness Y
  kxyKnMm: number; // Cross-coupled destabilizing stiffness XY
  kyxKnMm: number; // Cross-coupled destabilizing stiffness YX
  cxxKnSMm: number; // Direct damping X
  cyyKnSMm: number; // Direct damping Y
  cxyKnSMm: number; // Cross damping XY
  cyxKnSMm: number; // Cross damping YX
}

export interface OrbitCoordinate {
  xUm: number;
  yUm: number;
  isKeyphasor?: boolean;
}

export interface FilmPressurePoint {
  angleDeg: number;
  pressureBar: number;
  filmThicknessUm: number;
}

export interface JournalSpectralPeak {
  freqHz: number;
  order: number;
  ampUmPkPk: number;
  label: string;
  type: 'subsynchronous_whirl' | '1x_synchronous' | '2x_harmonic' | 'subsynchronous_whip';
}

export interface JournalBearingOutputs {
  projectedPressureMpa: number; // W / (L * D)
  effectiveFilmTempC: number;
  operatingViscosityCp: number; // dynamic viscosity at film temp
  sommerfeldNumber: number; // S = (mu * N / P) * (R / c)^2
  eccentricityRatio: number; // epsilon = e / c (0 to 1)
  attitudeAngleDeg: number; // phi in degrees (angle of minimum film relative to load vector)
  minimumFilmThicknessUm: number; // h_min = c * (1 - epsilon)
  journalCenterOffsetUm: { x: number; y: number };
  frictionCoefficient: number;
  powerLossKw: number; // viscous shearing power loss
  sideLeakageFlowLpm: number; // required lube oil flow
  dynamicCoefficients: DynamicCoefficients;
  whirlFrequencyRatio: number; // WFR = (kxy - kyx) / (omega * (cxx + cyy))
  onsetSpeedOfInstabilityRpm: number; // threshold speed where log dec crosses zero
  stabilityMarginRatio: number; // N_onset / N_oper
  logarithmicDecrement: number; // delta: > 0.1 stable (API 684), < 0 unstable
  instabilityMode: JournalInstabilityMode;
  instabilityDescription: string;
  runningFreqHz: number;
  whirlFreqHz: number;
  rotorCriticalFreqHz: number;
  synchronous1xAmpUmPkPk: number;
  subsynchronousAmpUmPkPk: number;
  totalShaftDisplacementUmPkPk: number;
  api670AlarmLimitUmPkPk: number; // API 670 alarm threshold
  api670TripLimitUmPkPk: number; // API 670 shutdown trip threshold
  clearanceCircleUm: number; // radial clearance boundary
  orbitPoints: OrbitCoordinate[];
  pressureProfile: FilmPressurePoint[];
  spectrum: JournalSpectralPeak[];
  status: StatusAssessment;
  auditTrail: AuditStep[];
}
