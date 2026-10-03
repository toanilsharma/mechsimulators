/**
 * Plant-Wide Machinery Fleet Health Matrix & FMEA / RPN Predictive Maintenance
 * Holistic asset integrity scoring across multi-machine rotating equipment trains
 *
 * Nominative Benchmark Reference: ISO 17359 / ISO 55000 (Educational Citation Only)
 * Independent computational analysis - zero official endorsement or affiliation.
 */

import { SimulatorId } from '../types/common';

export interface FleetAssetHealthRecord {
  assetId: SimulatorId;
  assetTag: string;
  name: string;
  category: string;
  nominalRating: string;
  healthScore: number; // 0 to 100
  statusLevel: 'safe' | 'warning' | 'critical';
  primaryFailureMode: string;
  leadingIndicatorMetric: string;
  severity: number; // 1 to 10
  occurrence: number; // 1 to 10
  detection: number; // 1 to 10
  rpn: number; // Risk Priority Number = S * O * D (1 to 1000)
  mtbfHours: number;
  maintenanceAction: string;
  nextInspectionDays: number;
}

export interface FleetAuditSummary {
  fleetOverallHealth: number; // 0 to 100
  criticalAssetCount: number;
  warningAssetCount: number;
  healthyAssetCount: number;
  highestRpnAsset: string;
  highestRpnValue: number;
  records: FleetAssetHealthRecord[];
  fleetAvailabilityForecastPercent: number;
  benchmarkNotes: string[];
}

/**
 * Computes plant-wide fleet health and FMEA RPN matrix based on active simulation states.
 */
export function calculateFleetHealthMatrix(simulationOutputs: Record<string, any>): FleetAuditSummary {
  const records: FleetAssetHealthRecord[] = [
    {
      assetId: 'pump',
      assetTag: 'P-101A',
      name: 'Boiler Feed Water Pump',
      category: 'Centrifugal Turbopump',
      nominalRating: '180 kW / 45 m Head',
      healthScore: 88,
      statusLevel: 'safe',
      primaryFailureMode: 'Impeller Suction Eye Cavitation & Recirculation',
      leadingIndicatorMetric: 'NPSH Margin: 1.48x',
      severity: 8,
      occurrence: 3,
      detection: 3,
      rpn: 72,
      mtbfHours: 24000,
      maintenanceAction: 'Maintain suction strainer differential pressure < 0.2 bar.',
      nextInspectionDays: 90,
    },
    {
      assetId: 'compressor',
      assetTag: 'K-201',
      name: 'Natural Gas Recycle Compressor',
      category: 'Centrifugal Compressor',
      nominalRating: '450 kW / 3.4 Pressure Ratio',
      healthScore: 76,
      statusLevel: 'warning',
      primaryFailureMode: 'Aerodynamic Surge & Rotating Stall Buffeting',
      leadingIndicatorMetric: 'Surge Margin: 11.2%',
      severity: 9,
      occurrence: 5,
      detection: 4,
      rpn: 180,
      mtbfHours: 16000,
      maintenanceAction: 'Tune anti-surge valve opening response and monitor inlet guide vane angle.',
      nextInspectionDays: 30,
    },
    {
      assetId: 'rotor',
      assetTag: 'M-301',
      name: 'High-Speed Turbomachine Shaft',
      category: 'Rotor Dynamics System',
      nominalRating: '6200 RPM / Rigid Bearing Supports',
      healthScore: 92,
      statusLevel: 'safe',
      primaryFailureMode: '1X Synchronous Unbalance & Critical Speed Dwell',
      leadingIndicatorMetric: 'Vibration: 22.4 µm pk-pk',
      severity: 7,
      occurrence: 2,
      detection: 2,
      rpn: 28,
      mtbfHours: 32000,
      maintenanceAction: 'Inspect balance weights during next scheduled turnaround.',
      nextInspectionDays: 180,
    },
    {
      assetId: 'pipe',
      assetTag: 'PL-401',
      name: 'Turbine Discharge Piping Spool',
      category: 'High-Pressure Acoustic Piping',
      nominalRating: '24" Sch 40 / 42 bar Design',
      healthScore: 84,
      statusLevel: 'safe',
      primaryFailureMode: 'Acoustic Fatigue & Flow-Induced Pressure Pulsation',
      leadingIndicatorMetric: 'Stress: 64% of Allowable',
      severity: 8,
      occurrence: 3,
      detection: 3,
      rpn: 72,
      mtbfHours: 45000,
      maintenanceAction: 'Perform ultrasonic wall thickness and hanger spring check.',
      nextInspectionDays: 120,
    },
    {
      assetId: 'seal',
      assetTag: 'MS-101',
      name: 'Pump Cartridge Mechanical Seal',
      category: 'API Plan 53A Dual Seal',
      nominalRating: '75 mm Shaft / SiC vs Carbon',
      healthScore: 79,
      statusLevel: 'warning',
      primaryFailureMode: 'Barrier Fluid Vaporization & Face Thermal Grooving',
      leadingIndicatorMetric: 'Film Thickness: 0.85 µm',
      severity: 7,
      occurrence: 5,
      detection: 4,
      rpn: 140,
      mtbfHours: 14000,
      maintenanceAction: 'Top up Plan 53A accumulator barrier oil and inspect cooler fin tubes.',
      nextInspectionDays: 45,
    },
    {
      assetId: 'alignment',
      assetTag: 'CP-102',
      name: 'Driver-Pump Flexible Coupling',
      category: 'Shaft Alignment Skid',
      nominalRating: 'Spacer Membrane Coupling',
      healthScore: 90,
      statusLevel: 'safe',
      primaryFailureMode: 'Thermal Growth Misalignment & 2X Radial Reaction Force',
      leadingIndicatorMetric: 'Parallel Offset: 0.04 mm',
      severity: 6,
      occurrence: 3,
      detection: 2,
      rpn: 36,
      mtbfHours: 28000,
      maintenanceAction: 'Confirm cold shimming targets accommodate casing thermal growth.',
      nextInspectionDays: 180,
    },
    {
      assetId: 'turbine',
      assetTag: 'ST-501',
      name: 'Mechanical Drive Steam Turbine',
      category: 'API 612 Multi-Stage Turbine',
      nominalRating: '1.2 MW / 42 bar Steam',
      healthScore: 82,
      statusLevel: 'safe',
      primaryFailureMode: 'Last-Stage Blade Moisture Erosion & Governor Hunting',
      leadingIndicatorMetric: 'Exhaust Wetness: 7.8%',
      severity: 9,
      occurrence: 3,
      detection: 3,
      rpn: 81,
      mtbfHours: 26000,
      maintenanceAction: 'Test emergency overspeed trip valve mechanism and inspect drain traps.',
      nextInspectionDays: 60,
    },
    {
      assetId: 'recip',
      assetTag: 'RC-601',
      name: 'Hydrogen Makeup Reciprocating Compressor',
      category: 'API 618 Multi-Crank Compressor',
      nominalRating: '350 kW / 180 bar Discharge',
      healthScore: 74,
      statusLevel: 'warning',
      primaryFailureMode: 'Compressor Suction Valve Leakage & Piston Rod Reversal Loss',
      leadingIndicatorMetric: 'Valve Temp: +14°C Delta',
      severity: 8,
      occurrence: 6,
      detection: 4,
      rpn: 192,
      mtbfHours: 12000,
      maintenanceAction: 'Perform thermal imaging and pressure-volume (PV) card diagnostic.',
      nextInspectionDays: 21,
    },
    {
      assetId: 'gearbox',
      assetTag: 'GB-701',
      name: 'Heavy-Duty Parallel Shaft Gearbox',
      category: 'Helical Speed Reducer',
      nominalRating: '4:1 Ratio / AGMA Rating 8',
      healthScore: 86,
      statusLevel: 'safe',
      primaryFailureMode: 'Tooth Root Bending Fatigue & Scuffing Scoring',
      leadingIndicatorMetric: 'Mesh Frequency: 1.2 mm/s',
      severity: 8,
      occurrence: 3,
      detection: 3,
      rpn: 72,
      mtbfHours: 35000,
      maintenanceAction: 'Sample oil for wear particle spectrography (Fe, Cr, Cu limits).',
      nextInspectionDays: 90,
    },
    {
      assetId: 'journal',
      assetTag: 'TB-801',
      name: 'Turbine Tilting Pad Journal Bearing',
      category: 'Hydrodynamic Fluid Film Bearing',
      nominalRating: '120 mm Bore / 5-Pad Rocker',
      healthScore: 89,
      statusLevel: 'safe',
      primaryFailureMode: 'Subsynchronous Oil Whirl & Babbitt Hotspot Smearing',
      leadingIndicatorMetric: 'Min Film: 24 µm',
      severity: 9,
      occurrence: 2,
      detection: 3,
      rpn: 54,
      mtbfHours: 40000,
      maintenanceAction: 'Verify lube oil supply header pressure and filter cleanliness code.',
      nextInspectionDays: 120,
    },
  ];

  // Adjust scores dynamically if simulationOutputs are provided
  if (simulationOutputs.pump?.npshMargin) {
    const margin = simulationOutputs.pump.npshMargin;
    if (margin < 1.1) {
      records[0].healthScore = 52;
      records[0].statusLevel = 'critical';
      records[0].occurrence = 9;
      records[0].rpn = 8 * 9 * 3; // 216
    }
  }

  if (simulationOutputs.compressor?.surgeMargin) {
    const sm = simulationOutputs.compressor.surgeMargin;
    if (sm < 5) {
      records[1].healthScore = 48;
      records[1].statusLevel = 'critical';
      records[1].occurrence = 9;
      records[1].rpn = 9 * 9 * 4; // 324
    }
  }

  // Calculate fleet aggregate stats
  const totalScore = records.reduce((sum, r) => sum + r.healthScore, 0);
  const fleetOverallHealth = Math.round(totalScore / records.length);

  const criticalAssetCount = records.filter((r) => r.statusLevel === 'critical' || r.rpn >= 250).length;
  const warningAssetCount = records.filter((r) => r.statusLevel === 'warning' || (r.rpn >= 100 && r.rpn < 250)).length;
  const healthyAssetCount = records.filter((r) => r.statusLevel === 'safe' && r.rpn < 100).length;

  let highestRpnAsset = records[0].name;
  let highestRpnValue = records[0].rpn;
  records.forEach((r) => {
    if (r.rpn > highestRpnValue) {
      highestRpnValue = r.rpn;
      highestRpnAsset = `${r.assetTag} (${r.name})`;
    }
  });

  // Sort records by RPN descending (priority queue)
  records.sort((a, b) => b.rpn - a.rpn);

  const fleetAvailabilityForecastPercent = Number((100 - (criticalAssetCount * 3.5 + warningAssetCount * 0.8)).toFixed(1));

  const benchmarkNotes = [
    'Risk Priority Number (RPN) = Severity (1-10) × Occurrence (1-10) × Detection (1-10).',
    'RPN thresholds: < 100 Low Risk (Routine Monitor), 100-249 Moderate (Action Item), >= 250 Critical (Immediate Intervention).',
    'Condition indicators map to nominative reference criteria (ISO 17359 / ISO 55000 educational benchmarks).',
    'Notice: Independent simulation modeling; plant turnarounds and safety-critical decisions require certified on-site engineering review.',
  ];

  return {
    fleetOverallHealth,
    criticalAssetCount,
    warningAssetCount,
    healthyAssetCount,
    highestRpnAsset,
    highestRpnValue,
    records,
    fleetAvailabilityForecastPercent,
    benchmarkNotes,
  };
}
