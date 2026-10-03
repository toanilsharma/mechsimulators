/**
 * Rotor Dynamics, Unbalance Forces, Critical Speeds, and ISO 10816 Vibration Severity
 * 
 * Complies with ISO 1940-1 (Balance Quality Grades) and ISO 10816-3 / ISO 20816-3
 * standards for vibration limits of rotating machinery.
 */

import { rpmToRadS } from './units';

export type BalanceGrade = 'G0.4' | 'G1.0' | 'G2.5' | 'G6.3' | 'G16';
export type FoundationType = 'rigid' | 'flexible';
export type MachineGroup = 'group1' | 'group2'; // Group 1: >300 kW, Group 2: 15-300 kW
export type VibrationZone = 'A' | 'B' | 'C' | 'D'; // A: Good, B: Satisfactory, C: Unsatisfactory, D: Unacceptable

export interface RotorDynamicsResult {
  angularVelocityRadS: number;
  unbalanceForceN: number;
  specificUnbalanceGmmKg: number; // e_per in g·mm/kg (or µm)
  permissibleUnbalanceGmm: number;
  unbalanceRatio: number; // Actual / Permissible
  staticEccentricityUm: number;
  dynamicMagnificationFactor: number;
  peakToPeakDisplacementUm: number;
  vibrationVelocityRmsMmS: number;
  vibrationZone: VibrationZone;
  vibrationStatus: 'safe' | 'warning' | 'critical';
  criticalSpeedRpm?: number;
  criticalSpeedSeparationPercent?: number;
  warnings: string[];
}

/**
 * ISO 1940-1 Balance Grade Numerical Values (G in mm/s)
 */
export const ISO_1940_GRADES: Record<BalanceGrade, { gValue: number; description: string }> = {
  'G0.4': { gValue: 0.4, description: 'Gyroscopes, precision spindle drives' },
  'G1.0': { gValue: 1.0, description: 'Gas/Steam turbines, turbo-generators, high-speed pumps' },
  'G2.5': { gValue: 2.5, description: 'Standard process pumps (API 610), electric motors, compressors' },
  'G6.3': { gValue: 6.3, description: 'General machinery, fans, standard industrial rotors' },
  'G16': { gValue: 16.0, description: 'Agricultural machinery, crushers, drive shafts' },
};

/**
 * Calculate dynamic unbalance centrifugal force
 * Formula: F = m * r * omega^2 = (U_gmm * 1e-6) * omega^2
 *
 * @param unbalanceGMm - Unbalance in g·mm (gram-millimeters)
 * @param speedRpm - Shaft speed in RPM
 * @returns Centrifugal force in Newtons (N)
 */
export function calculateUnbalanceForce(unbalanceGMm: number, speedRpm: number): number {
  if (unbalanceGMm <= 0 || speedRpm <= 0) return 0;
  const omega = rpmToRadS(speedRpm);
  // 1 g*mm = 1e-6 kg*m
  const uKgM = unbalanceGMm * 1e-6;
  return uKgM * Math.pow(omega, 2);
}

/**
 * Calculate ISO 1940-1 Permissible Residual Unbalance
 * Formula:
 * e_per (g·mm/kg or µm) = (G * 1000) / omega = (G * 1000 * 60) / (2 * pi * RPM)
 * U_per (g·mm) = e_per * rotorMassKg
 *
 * @param grade - Balance quality grade (e.g. 'G2.5')
 * @param speedRpm - Operating speed in RPM
 * @param rotorMassKg - Total rotor mass in kg
 */
export function calculatePermissibleUnbalance(
  grade: BalanceGrade,
  speedRpm: number,
  rotorMassKg: number
): { permissibleUnbalanceGMm: number; specificUnbalanceGmmKg: number } {
  if (speedRpm <= 0 || rotorMassKg <= 0) {
    return { permissibleUnbalanceGMm: 0, specificUnbalanceGmmKg: 0 };
  }
  const G = ISO_1940_GRADES[grade].gValue;
  const omega = rpmToRadS(speedRpm);
  // e_per in µm (g·mm/kg) = (G * 1000) / omega
  const ePer = (G * 1000.0) / omega;
  const uPerGMm = ePer * rotorMassKg;

  return {
    permissibleUnbalanceGMm: uPerGMm,
    specificUnbalanceGmmKg: ePer,
  };
}

/**
 * Estimate 1st Lateral Bending Critical Speed for a Jeffcott Rotor
 * 
 * Shaft Stiffess (midspan concentrated mass):
 * k = (48 * E * I) / L^3
 * I = (pi * d^4) / 64
 * omega_crit = sqrt(k / m_rotor)
 * N_crit (RPM) = (omega_crit * 60) / (2 * pi)
 *
 * @param shaftDiameterMm - Shaft diameter in mm
 * @param bearingSpanMm - Distance between bearing centers in mm
 * @param rotorMassKg - Concentrated rotor mass in kg
 * @param youngsModulusGpa - Steel modulus, default 206 GPa
 */
export function calculateCriticalSpeed(
  shaftDiameterMm: number,
  bearingSpanMm: number,
  rotorMassKg: number,
  youngsModulusGpa = 206
): { criticalSpeedRpm: number; shaftStiffnessNPerM: number } {
  if (shaftDiameterMm <= 0 || bearingSpanMm <= 0 || rotorMassKg <= 0) {
    return { criticalSpeedRpm: 0, shaftStiffnessNPerM: 0 };
  }
  const dM = shaftDiameterMm / 1000.0;
  const lM = bearingSpanMm / 1000.0;
  const E = youngsModulusGpa * 1e9; // Pa

  // Area moment of inertia I = pi * d^4 / 64 (m^4)
  const I = (Math.PI * Math.pow(dM, 4)) / 64.0;

  // Midspan stiffness k = 48 * E * I / L^3 (N/m)
  const k = (48.0 * E * I) / Math.pow(lM, 3);

  // Natural frequency omega_n = sqrt(k / m) (rad/s)
  const omegaCrit = Math.sqrt(k / rotorMassKg);
  const nCritRpm = (omegaCrit * 60.0) / (2.0 * Math.PI);

  return { criticalSpeedRpm: nCritRpm, shaftStiffnessNPerM: k };
}

/**
 * Classify Vibration Velocity (RMS mm/s) according to ISO 10816-3 / ISO 20816-3
 * 
 * Zone Thresholds (RMS mm/s):
 * Group 1 (Large Machines > 300 kW):
 *   Rigid:    A <= 2.3 | B <= 4.5 | C <= 7.1 | D > 7.1
 *   Flexible: A <= 3.5 | B <= 7.1 | C <= 11.0| D > 11.0
 * Group 2 (Medium Machines 15 - 300 kW):
 *   Rigid:    A <= 1.4 | B <= 2.8 | C <= 4.5 | D > 4.5
 *   Flexible: A <= 2.3 | B <= 4.5 | C <= 7.1 | D > 7.1
 */
export function classifyVibrationSeverity(
  velocityRmsMmS: number,
  foundation: FoundationType = 'rigid',
  machineGroup: MachineGroup = 'group2'
): { zone: VibrationZone; status: 'safe' | 'warning' | 'critical'; description: string } {
  let limits: [number, number, number]; // [A/B boundary, B/C boundary, C/D boundary]

  if (machineGroup === 'group1') {
    limits = foundation === 'rigid' ? [2.3, 4.5, 7.1] : [3.5, 7.1, 11.0];
  } else {
    // group2
    limits = foundation === 'rigid' ? [1.4, 2.8, 4.5] : [2.3, 4.5, 7.1];
  }

  const [limA, limB, limC] = limits;

  if (velocityRmsMmS <= limA) {
    return {
      zone: 'A',
      status: 'safe',
      description: 'Zone A: Newly commissioned machinery condition (Good).',
    };
  } else if (velocityRmsMmS <= limB) {
    return {
      zone: 'B',
      status: 'safe',
      description: 'Zone B: Acceptable for unrestricted continuous long-term operation.',
    };
  } else if (velocityRmsMmS <= limC) {
    return {
      zone: 'C',
      status: 'warning',
      description: 'Zone C: Unsatisfactory; restricted operation only until remedial balancing/alignment.',
    };
  } else {
    return {
      zone: 'D',
      status: 'critical',
      description: 'Zone D: Danger / Immediate Trip Threshold. High risk of catastrophic bearing/seal failure.',
    };
  }
}

/**
 * Full Rotor Assessment
 */
export function evaluateRotorSystem(params: {
  speedRpm: number;
  rotorMassKg: number;
  actualUnbalanceGMm: number;
  balanceGrade?: BalanceGrade;
  dampingRatio?: number; // zeta (default 0.05 for typical hydrodynamic/oil film)
  foundation?: FoundationType;
  machineGroup?: MachineGroup;
  shaftDiameterMm?: number;
  bearingSpanMm?: number;
}): RotorDynamicsResult {
  const warnings: string[] = [];
  const {
    speedRpm,
    rotorMassKg,
    actualUnbalanceGMm,
    balanceGrade = 'G2.5',
    dampingRatio = 0.05,
    foundation = 'rigid',
    machineGroup = 'group2',
  } = params;

  const omega = rpmToRadS(speedRpm);
  const unbalanceForceN = calculateUnbalanceForce(actualUnbalanceGMm, speedRpm);
  const { permissibleUnbalanceGMm, specificUnbalanceGmmKg } = calculatePermissibleUnbalance(
    balanceGrade,
    speedRpm,
    rotorMassKg
  );

  const unbalanceRatio = permissibleUnbalanceGMm > 0 ? actualUnbalanceGMm / permissibleUnbalanceGMm : 1;

  // Eccentricity e = U / M (in µm)
  const staticEccentricityUm = rotorMassKg > 0 ? actualUnbalanceGMm / rotorMassKg : 0;

  // Critical speed check if shaft geometry is provided
  let criticalSpeedRpm: number | undefined;
  let criticalSpeedSeparationPercent: number | undefined;
  let dynMagFactor = 1.0;

  if (params.shaftDiameterMm && params.bearingSpanMm) {
    const crit = calculateCriticalSpeed(params.shaftDiameterMm, params.bearingSpanMm, rotorMassKg);
    criticalSpeedRpm = crit.criticalSpeedRpm;
    if (criticalSpeedRpm > 0) {
      const freqRatio = speedRpm / criticalSpeedRpm;
      // Magnification factor Q = 1 / sqrt((1 - r^2)^2 + (2 * zeta * r)^2)
      dynMagFactor = 1.0 / Math.sqrt(Math.pow(1 - Math.pow(freqRatio, 2), 2) + Math.pow(2 * dampingRatio * freqRatio, 2));

      criticalSpeedSeparationPercent = Math.abs(speedRpm - criticalSpeedRpm) / criticalSpeedRpm * 100.0;

      // API 610 separation margin requires operating speed to be >= 20% below or >= 15% above 1st critical
      if (criticalSpeedSeparationPercent < 15.0) {
        warnings.push(
          `RESONANCE DANGER: Operating speed (${speedRpm} RPM) is within ${criticalSpeedSeparationPercent.toFixed(1)}% of 1st critical speed (${Math.round(criticalSpeedRpm)} RPM). Severe resonance amplification expected.`
        );
      }
    }
  }

  // Peak-to-peak displacement = 2 * dynamic amplitude (µm)
  const peakToPeakDisplacementUm = 2.0 * staticEccentricityUm * dynMagFactor;

  // Approximate vibration velocity RMS (mm/s): v_rms = (omega * X_pk) / (sqrt(2) * 1000)
  // where X_pk in µm -> /1000 = mm
  const xPkMm = (peakToPeakDisplacementUm / 2.0) / 1000.0;
  const vibrationVelocityRmsMmS = (omega * xPkMm) / Math.SQRT2;

  const vibSeverity = classifyVibrationSeverity(vibrationVelocityRmsMmS, foundation, machineGroup);

  if (unbalanceRatio > 1.0) {
    warnings.push(
      `Residual unbalance (${actualUnbalanceGMm.toFixed(1)} g·mm) exceeds ISO 1940-1 ${balanceGrade} allowable limit (${permissibleUnbalanceGMm.toFixed(1)} g·mm) by ${(unbalanceRatio * 100 - 100).toFixed(0)}%.`
    );
  }

  return {
    angularVelocityRadS: omega,
    unbalanceForceN,
    specificUnbalanceGmmKg,
    permissibleUnbalanceGmm: permissibleUnbalanceGMm,
    unbalanceRatio,
    staticEccentricityUm,
    dynamicMagnificationFactor: dynMagFactor,
    peakToPeakDisplacementUm,
    vibrationVelocityRmsMmS,
    vibrationZone: vibSeverity.zone,
    vibrationStatus: vibSeverity.status,
    criticalSpeedRpm,
    criticalSpeedSeparationPercent,
    warnings,
  };
}
