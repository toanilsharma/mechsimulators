import {
  GearboxInputs,
  GearboxOutputs,
  GmfHarmonicPoint,
  StressCurvePoint,
} from '../types/gearbox';
import { StatusAssessment, AuditItem } from '../types/common';

// Greatest Common Divisor helper
function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

// Calculate oil viscosity at temperature via Walther equation
function calculateOilViscosity(lubricant: string, tempC: number): number {
  let baseViscosity40C = 220;
  let baseViscosity100C = 19;

  switch (lubricant) {
    case 'iso_vg_150':
      baseViscosity40C = 150;
      baseViscosity100C = 14.5;
      break;
    case 'iso_vg_220':
      baseViscosity40C = 220;
      baseViscosity100C = 19.2;
      break;
    case 'iso_vg_320':
      baseViscosity40C = 320;
      baseViscosity100C = 24.5;
      break;
    case 'iso_vg_460':
      baseViscosity40C = 460;
      baseViscosity100C = 31.0;
      break;
    case 'synthetic_pao_220':
      baseViscosity40C = 220;
      baseViscosity100C = 26.5; // High VI synthetic
      break;
  }

  // Walther interpolation/extrapolation
  const clampedTemp = Math.max(20, Math.min(120, tempC));
  const tKelvin = clampedTemp + 273.15;
  const t40 = 313.15;
  const t100 = 373.15;

  // Approximate exponent b
  const b = Math.log(baseViscosity40C / baseViscosity100C) / Math.log(t100 / t40);
  const visc = baseViscosity40C * Math.pow(t40 / tKelvin, b);
  return Math.max(8, Number(visc.toFixed(1)));
}

export function calculateGearbox(inputs: GearboxInputs): GearboxOutputs {
  const {
    gearType,
    ratedPowerKw,
    inputSpeedRpm,
    pinionTeeth,
    gearTeeth,
    normalModuleMm,
    faceWidthMm,
    pressureAngleDeg,
    helixAngleDeg,
    materialGrade,
    isoQualityGrade,
    pinionHardnessHrc,
    gearHardnessHrc,
    lubricant,
    oilOperatingTempC,
    surfaceRoughnessRaUm,
    toothFault,
    pinionEccentricityUm,
    applicationServiceFactor,
  } = inputs;

  // 1. Kinematics
  const u = gearTeeth / pinionTeeth; // Gear ratio
  const outputSpeedRpm = inputSpeedRpm / u;
  const pinionSpeedHz = inputSpeedRpm / 60;
  const gearSpeedHz = outputSpeedRpm / 60;
  const gearMeshFrequencyHz = pinionSpeedHz * pinionTeeth; // GMF
  const commonFactorsGcd = gcd(pinionTeeth, gearTeeth);
  const huntingToothFrequencyHz = (gearMeshFrequencyHz * commonFactorsGcd) / (pinionTeeth * gearTeeth);

  // 2. Geometry
  const betaRad = (helixAngleDeg * Math.PI) / 180;
  const alphaNRad = (pressureAngleDeg * Math.PI) / 180;
  // Transverse module and pressure angle
  const isHelical = gearType === 'helical' || gearType === 'double_helical';
  const cosBeta = isHelical ? Math.cos(betaRad) : 1.0;
  const transverseModuleMm = normalModuleMm / cosBeta;
  const tanAlphaT = Math.tan(alphaNRad) / cosBeta;
  const alphaTRad = Math.atan(tanAlphaT);

  // Pitch diameters
  const pinionPitchDiameterMm = pinionTeeth * transverseModuleMm;
  const gearPitchDiameterMm = gearTeeth * transverseModuleMm;
  const centerDistanceMm = (pinionPitchDiameterMm + gearPitchDiameterMm) / 2;

  // Pitch line velocity
  const pitchLineVelocityMs = (Math.PI * (pinionPitchDiameterMm / 1000) * inputSpeedRpm) / 60;

  // Contact ratios
  // Approximate standard addendum: ha = mn
  const d_ap = pinionPitchDiameterMm + 2 * normalModuleMm;
  const d_ag = gearPitchDiameterMm + 2 * normalModuleMm;
  const d_bp = pinionPitchDiameterMm * Math.cos(alphaTRad);
  const d_bg = gearPitchDiameterMm * Math.cos(alphaTRad);

  const termP = Math.sqrt(Math.max(0, Math.pow(d_ap / 2, 2) - Math.pow(d_bp / 2, 2)));
  const termG = Math.sqrt(Math.max(0, Math.pow(d_ag / 2, 2) - Math.pow(d_bg / 2, 2)));
  const termC = centerDistanceMm * Math.sin(alphaTRad);
  const p_b = Math.PI * transverseModuleMm * Math.cos(alphaTRad);

  const transverseContactRatio = Math.max(1.1, (termP + termG - termC) / p_b);
  const overlapContactRatio = isHelical ? (faceWidthMm * Math.sin(betaRad)) / (Math.PI * normalModuleMm) : 0;
  const totalContactRatio = transverseContactRatio + overlapContactRatio;

  // 3. Torque & Forces
  const inputTorqueNm = (ratedPowerKw * 9548.8) / Math.max(1, inputSpeedRpm);
  const efficiency = isHelical ? 0.985 : 0.98;
  const outputTorqueNm = inputTorqueNm * u * efficiency;

  // Tangential force Wt
  const tangentialForceN = (2000 * inputTorqueNm) / pinionPitchDiameterMm;
  const tangentialForceKn = tangentialForceN / 1000;

  // Radial force Wr
  const radialForceKn = tangentialForceKn * (Math.tan(alphaNRad) / cosBeta);

  // Axial thrust force Wa (for single helical; double helical balances out)
  const axialThrustForceKn = gearType === 'helical' ? tangentialForceKn * Math.tan(betaRad) : 0;

  // Normal force Wn
  const normalForceKn = tangentialForceKn / (Math.cos(alphaNRad) * cosBeta);

  // 4. AGMA 2001 Stress Analysis Factors
  // Dynamic factor Kv (AGMA method based on Qv)
  const B = 0.25 * Math.pow(12 - isoQualityGrade, 0.667);
  const A = 50 + 56 * (1 - B);
  const termV = Math.sqrt(Math.max(0.1, 196.85 * pitchLineVelocityMs * 3.28084)); // ft/min
  const Kv = Math.min(1.8, Math.max(1.05, Math.pow((A + termV) / A, B)));

  const Ko = applicationServiceFactor; // Overload factor
  const Ks = normalModuleMm > 5 ? 1.05 : 1.0; // Size factor

  // Load distribution factor KH
  const b_d_ratio = faceWidthMm / pinionPitchDiameterMm;
  const KH = Math.min(1.6, 1.15 + 0.15 * b_d_ratio + 0.003 * faceWidthMm);

  // Geometry factor YJ (bending)
  const YJ = isHelical ? 0.48 : 0.35 + 0.002 * pinionTeeth;

  // Bending stress sigma_b (MPa)
  // sigma_b = (Wt * Ko * Kv * Ks * KH) / (b * mn * YJ)
  let bendingStressMpa = (tangentialForceN * Ko * Kv * Ks * KH) / (faceWidthMm * normalModuleMm * YJ);

  // Geometry factor ZI (contact)
  const ZI = isHelical
    ? (Math.cos(alphaTRad) * Math.sin(alphaTRad) * u) / (2 * (u + 1) * 0.95)
    : (Math.cos(alphaTRad) * Math.sin(alphaTRad) * u) / (2 * (u + 1));

  // Elastic coefficient ZE = 189.8 sqrt(MPa) for steel/steel
  const ZE = materialGrade === 'cast_iron' ? 155 : 189.8;

  // Contact stress sigma_c (MPa)
  // sigma_c = ZE * sqrt((Wt * Ko * Kv * Ks * KH) / (dp * b * ZI))
  let contactStressMpa =
    ZE *
    Math.sqrt(
      (tangentialForceN * Ko * Kv * Ks * KH) /
        (pinionPitchDiameterMm * faceWidthMm * Math.max(0.05, ZI))
    );

  // Allowable stresses based on material and hardness
  let allowableBendingBase = 320;
  let allowableContactBase = 1200;

  switch (materialGrade) {
    case 'carburized_case_hardened':
      allowableBendingBase = 420 + (pinionHardnessHrc - 58) * 15;
      allowableContactBase = 1500 + (pinionHardnessHrc - 58) * 40;
      break;
    case 'through_hardened_steel':
      allowableBendingBase = 240 + (pinionHardnessHrc - 35) * 8;
      allowableContactBase = 950 + (pinionHardnessHrc - 35) * 25;
      break;
    case 'nitrided_steel':
      allowableBendingBase = 340 + (pinionHardnessHrc - 50) * 10;
      allowableContactBase = 1250 + (pinionHardnessHrc - 50) * 30;
      break;
    case 'cast_iron':
      allowableBendingBase = 140;
      allowableContactBase = 500;
      break;
  }

  // Adjust for fault injections
  if (toothFault === 'pitch_line_pitting') {
    contactStressMpa *= 1.35; // Stress concentration on pitted craters
  } else if (toothFault === 'root_bending_fatigue_crack') {
    bendingStressMpa *= 1.75; // Notch stress concentration at root
  } else if (toothFault === 'broken_tooth') {
    bendingStressMpa *= 2.2;
    contactStressMpa *= 1.5;
  } else if (toothFault === 'scuffing_scoring') {
    contactStressMpa *= 1.25;
  }

  const allowableBendingStressMpa = Number(allowableBendingBase.toFixed(1));
  const allowableContactStressMpa = Number(allowableContactBase.toFixed(1));
  bendingStressMpa = Number(bendingStressMpa.toFixed(1));
  contactStressMpa = Number(contactStressMpa.toFixed(1));

  const bendingSafetyFactorSF = Number((allowableBendingStressMpa / Math.max(1, bendingStressMpa)).toFixed(2));
  const contactSafetyFactorSH = Number((allowableContactStressMpa / Math.max(1, contactStressMpa)).toFixed(2));

  // 5. Tribology & EHL Lubrication (AGMA 9005 & Dowson-Higginson)
  const operatingViscosityCSt = calculateOilViscosity(lubricant, oilOperatingTempC);
  const oilDensityKgM3 = lubricant.includes('synthetic') ? 840 : 880;
  const eta0 = (operatingViscosityCSt * 1e-6) * oilDensityKgM3; // Pa·s

  // Entrainment velocity um
  const um = pitchLineVelocityMs * Math.cos(alphaTRad);

  // Equivalent curvature radius Rx
  const r1 = (pinionPitchDiameterMm * Math.sin(alphaTRad)) / 2000; // meters
  const r2 = (gearPitchDiameterMm * Math.sin(alphaTRad)) / 2000;
  const Rx = (r1 * r2) / Math.max(0.001, r1 + r2); // meters

  // Dowson-Higginson minimum EHL film thickness
  // h_min approx = 2.65 * Rx * (alpha_p * E')^0.54 * (eta0 * um / (E' * Rx))^0.70 * (w' / (E' * Rx))^-0.13
  const alpha_p = 2.2e-8; // pressure-viscosity coefficient Pa^-1
  const E_prime = 2.3e11; // Pa
  const w_prime = (tangentialForceN / (faceWidthMm / 1000)); // N/m

  const G_param = alpha_p * E_prime;
  const U_param = (eta0 * Math.max(0.1, um)) / (E_prime * Rx);
  const W_param = w_prime / (E_prime * Rx);

  let ehlFilmThicknessUm =
    2.65 * Rx * Math.pow(G_param, 0.54) * Math.pow(Math.max(1e-15, U_param), 0.7) * Math.pow(Math.max(1e-10, W_param), -0.13) * 1e6; // to um
  ehlFilmThicknessUm = Math.max(0.05, Math.min(5.0, Number(ehlFilmThicknessUm.toFixed(2))));

  // Specific film thickness ratio Lambda
  const compositeRoughness = Math.sqrt(Math.pow(surfaceRoughnessRaUm, 2) + Math.pow(surfaceRoughnessRaUm * 1.2, 2));
  const specificFilmThicknessLambda = Number((ehlFilmThicknessUm / compositeRoughness).toFixed(2));

  let lubricationRegime: GearboxOutputs['lubricationRegime'] = 'Full Elastohydrodynamic (EHL)';
  if (specificFilmThicknessLambda < 1.0) {
    lubricationRegime = 'Boundary';
  } else if (specificFilmThicknessLambda < 2.2) {
    lubricationRegime = 'Mixed / Thin Film';
  }

  // 6. Vibration Spectrum & GMF Harmonics
  // Baseline vibration mm/s RMS
  let baseVib = 1.2 + (pitchLineVelocityMs / 15) * 0.8 + (isoQualityGrade - 5) * 0.4;
  let sidebandPercent = 5 + (pinionEccentricityUm / 10) * 4;

  if (toothFault === 'pitch_line_pitting') {
    baseVib += 2.8;
    sidebandPercent += 35;
  } else if (toothFault === 'root_bending_fatigue_crack') {
    baseVib += 3.5;
    sidebandPercent += 45;
  } else if (toothFault === 'broken_tooth') {
    baseVib += 7.2;
    sidebandPercent += 85;
  } else if (toothFault === 'scuffing_scoring') {
    baseVib += 3.1;
    sidebandPercent += 20;
  } else if (toothFault === 'excessive_backlash') {
    baseVib += 2.0;
    sidebandPercent += 15;
  }

  const overallVibrationMmSRms = Number(baseVib.toFixed(2));
  const sidebandSeverityPercent = Math.min(100, Number(sidebandPercent.toFixed(1)));

  // GMF Harmonic points (1X, 2X, 3X, 4X GMF)
  const gmfHarmonics: GmfHarmonicPoint[] = [
    {
      order: 1,
      frequencyHz: Number(gearMeshFrequencyHz.toFixed(1)),
      label: '1X GMF',
      amplitudeMmS: Number((overallVibrationMmSRms * 0.65).toFixed(2)),
      sidebandAmpMmS: Number((overallVibrationMmSRms * 0.65 * (sidebandSeverityPercent / 100)).toFixed(2)),
      isHigh: overallVibrationMmSRms * 0.65 > 4.5,
    },
    {
      order: 2,
      frequencyHz: Number((gearMeshFrequencyHz * 2).toFixed(1)),
      label: '2X GMF',
      amplitudeMmS: Number((overallVibrationMmSRms * 0.35).toFixed(2)),
      sidebandAmpMmS: Number((overallVibrationMmSRms * 0.35 * (sidebandSeverityPercent / 100) * 0.8).toFixed(2)),
      isHigh: overallVibrationMmSRms * 0.35 > 3.0,
    },
    {
      order: 3,
      frequencyHz: Number((gearMeshFrequencyHz * 3).toFixed(1)),
      label: '3X GMF',
      amplitudeMmS: Number((overallVibrationMmSRms * 0.18).toFixed(2)),
      sidebandAmpMmS: Number((overallVibrationMmSRms * 0.18 * (sidebandSeverityPercent / 100) * 0.6).toFixed(2)),
      isHigh: overallVibrationMmSRms * 0.18 > 2.0,
    },
    {
      order: 4,
      frequencyHz: Number((gearMeshFrequencyHz * 4).toFixed(1)),
      label: '4X GMF',
      amplitudeMmS: Number((overallVibrationMmSRms * 0.09).toFixed(2)),
      sidebandAmpMmS: Number((overallVibrationMmSRms * 0.09 * (sidebandSeverityPercent / 100) * 0.4).toFixed(2)),
      isHigh: false,
    },
  ];

  // ISO 10816-3 Zone evaluation for gearboxes
  let iso10816Zone: GearboxOutputs['iso10816Zone'] = 'A';
  let iso10816ZoneLabel = 'Zone A: Good / Newly Commissioned';

  if (overallVibrationMmSRms < 2.8) {
    iso10816Zone = 'A';
    iso10816ZoneLabel = 'Zone A: Good / Newly Commissioned';
  } else if (overallVibrationMmSRms < 4.5) {
    iso10816Zone = 'B';
    iso10816ZoneLabel = 'Zone B: Acceptable for Unrestricted Long-Term Operation';
  } else if (overallVibrationMmSRms < 7.1) {
    iso10816Zone = 'C';
    iso10816ZoneLabel = 'Zone C: Unsatisfactory / Restricted Operation (Maintenance Required)';
  } else {
    iso10816Zone = 'D';
    iso10816ZoneLabel = 'Zone D: Unacceptable / Danger (Mandatory Emergency Trip)';
  }

  // 7. Parametric Stress Curves (20% to 150% Load)
  const stressCurves: StressCurvePoint[] = [];
  const loadSteps = [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.5];
  for (const step of loadSteps) {
    const pwr = ratedPowerKw * step;
    const tq = (pwr * 9548.8) / Math.max(1, inputSpeedRpm);
    const wT = (2000 * tq) / pinionPitchDiameterMm;
    const bStress = (wT * Ko * Kv * Ks * KH) / (faceWidthMm * normalModuleMm * YJ);
    const cStress = ZE * Math.sqrt((wT * Ko * Kv * Ks * KH) / (pinionPitchDiameterMm * faceWidthMm * Math.max(0.05, ZI)));
    stressCurves.push({
      powerPercent: Math.round(step * 100),
      torqueNm: Number(tq.toFixed(1)),
      bendingStressMpa: Number(bStress.toFixed(1)),
      contactStressMpa: Number(cStress.toFixed(1)),
      bendingSafetyFactor: Number((allowableBendingStressMpa / Math.max(1, bStress)).toFixed(2)),
      contactSafetyFactor: Number((allowableContactStressMpa / Math.max(1, cStress)).toFixed(2)),
    });
  }

  // 8. Audit Trail Generation
  const auditTrail: AuditItem[] = [
    {
      parameter: 'Gear Mesh Frequency (GMF)',
      equation: 'GMF = f_pinion × Z_pinion = f_gear × Z_gear',
      calculatedValue: `${gearMeshFrequencyHz.toFixed(1)} Hz (Order: ${pinionTeeth}X Pinion, ${(gearMeshFrequencyHz / gearSpeedHz).toFixed(0)}X Gear)`,
      referenceStandard: 'ISO 10816-3 & API 613 Clause 6.1',
      status: 'pass',
    },
    {
      parameter: 'Hunting Tooth Frequency (f_HT)',
      equation: 'f_HT = GMF × GCD(Z_p, Z_g) / (Z_p × Z_g)',
      calculatedValue: `${huntingToothFrequencyHz.toFixed(3)} Hz (Common Divisor GCD = ${commonFactorsGcd})`,
      referenceStandard: 'AGMA 2001 Hunting Tooth Principle',
      status: commonFactorsGcd === 1 ? 'pass' : 'warning',
    },
    {
      parameter: 'AGMA 2001 Bending Safety Factor (S_F)',
      equation: 'S_F = σ_FP / σ_b = σ_FP / [(W_t·K_o·K_v·K_s·K_H) / (b·m_n·Y_J)]',
      calculatedValue: `S_F = ${bendingSafetyFactorSF} (Actual: ${bendingStressMpa} MPa, Allowable: ${allowableBendingStressMpa} MPa)`,
      referenceStandard: 'AGMA 2001-D04 Standard Criterion (Min S_F ≥ 1.40, API 613: ≥ 1.60)',
      status: bendingSafetyFactorSF >= 1.4 ? 'pass' : bendingSafetyFactorSF >= 1.15 ? 'warning' : 'fail',
    },
    {
      parameter: 'AGMA 2001 Contact Pitting Safety Factor (S_H)',
      equation: 'S_H = σ_HP / σ_c = σ_HP / [Z_E · √((W_t·K_o·K_v·K_s·K_H) / (d_p·b·Z_I))]',
      calculatedValue: `S_H = ${contactSafetyFactorSH} (Actual: ${contactStressMpa} MPa, Allowable: ${allowableContactStressMpa} MPa)`,
      referenceStandard: 'AGMA 2001-D04 Standard Criterion (Min S_H ≥ 1.25, API 613: ≥ 1.35)',
      status: contactSafetyFactorSH >= 1.25 ? 'pass' : contactSafetyFactorSH >= 1.05 ? 'warning' : 'fail',
    },
    {
      parameter: 'Elastohydrodynamic Film Ratio (λ)',
      equation: 'λ = h_min / √(Ra_pinion² + Ra_gear²)',
      calculatedValue: `λ = ${specificFilmThicknessLambda} (${lubricationRegime}, h_min = ${ehlFilmThicknessUm} µm)`,
      referenceStandard: 'AGMA 9005-F16 Industrial Gear Lubrication (Target λ ≥ 2.0)',
      status: specificFilmThicknessLambda >= 2.0 ? 'pass' : specificFilmThicknessLambda >= 1.0 ? 'warning' : 'fail',
    },
    {
      parameter: 'Overall Casing Vibration (ISO 10816-3)',
      equation: 'V_rms = √(Σ v_i²)',
      calculatedValue: `${overallVibrationMmSRms} mm/s RMS (${iso10816ZoneLabel})`,
      referenceStandard: 'ISO 10816-3 Category 2 & API 613 Casing Vibration',
      status: iso10816Zone === 'A' || iso10816Zone === 'B' ? 'pass' : iso10816Zone === 'C' ? 'warning' : 'fail',
    },
  ];

  // 9. Status Assessment
  let statusLevel: StatusAssessment['level'] = 'safe';
  let healthScore = 95;
  let statusLabel = 'Gearbox Operating Normally';
  let statusMessage = 'Safety factors and vibration levels are within normal guideline limits.';

  if (bendingSafetyFactorSF < 1.15 || contactSafetyFactorSH < 1.05 || iso10816Zone === 'D') {
    statusLevel = 'critical';
    healthScore = Math.min(45, Math.round(Math.min(bendingSafetyFactorSF / 1.4, contactSafetyFactorSH / 1.25) * 50));
    statusLabel = 'Critical Gearbox Overload / Imminent Failure';
    statusMessage = `Stress safety factor depleted (S_F=${bendingSafetyFactorSF}, S_H=${contactSafetyFactorSH}). Immediate shutdown required.`;
  } else if (bendingSafetyFactorSF < 1.4 || contactSafetyFactorSH < 1.25 || iso10816Zone === 'C' || specificFilmThicknessLambda < 1.0) {
    statusLevel = 'warning';
    healthScore = 70;
    statusLabel = 'Restricted Operation / Gear Degradation Detected';
    statusMessage = 'AGMA safety margins eroded or thin lubrication film present. Schedule inspection.';
  }

  // 10. Diagnosis & Recommendations
  let primaryDiagnosis = 'Normal Gear Mesh Operation';
  const recommendations: string[] = [];

  if (toothFault === 'broken_tooth') {
    primaryDiagnosis = 'Severe Broken Tooth Impact Shock & Heavy Sideband Modulation';
    recommendations.push('Immediate emergency stop. Perform borescope inspection of pinion and gear teeth for missing tooth segments.');
    recommendations.push('Inspect magnetic drain plugs and lube filter for steel chip debris.');
  } else if (toothFault === 'pitch_line_pitting') {
    primaryDiagnosis = 'Surface Pitting Along Pitch Line (Contact Fatigue Failure)';
    recommendations.push('Upgrade to higher ISO VG viscosity or synthetic PAO gear oil to increase EHL film ratio λ > 2.0.');
    recommendations.push('Verify tooth contact pattern using Prussian blue dye across full face width.');
  } else if (toothFault === 'root_bending_fatigue_crack') {
    primaryDiagnosis = 'Tooth Root Bending Fatigue Crack Propagation';
    recommendations.push('De-rate transmitted torque immediately to prevent catastrophic tooth shearing.');
    recommendations.push('Conduct ultrasonic and magnetic particle non-destructive examination (NDE) of tooth roots.');
  } else if (specificFilmThicknessLambda < 1.0) {
    primaryDiagnosis = 'Boundary Lubrication & High Scuffing / Adhesive Wear Risk';
    recommendations.push('Operating oil temperature is too high for the current lubricant viscosity. Clean oil cooler or increase coolant flow.');
    recommendations.push('Upgrade from ISO VG 150/220 to ISO VG 320/460 or high-VI synthetic formulation.');
  } else if (commonFactorsGcd > 1) {
    primaryDiagnosis = 'Non-Hunting Tooth Combination (Harmonic Repeat Wear)';
    recommendations.push(`Pinion (${pinionTeeth}) and gear (${gearTeeth}) share a common divisor (${commonFactorsGcd}). Individual teeth repeatedly mesh with the exact same counterpart teeth, concentrating localized wear.`);
  } else {
    recommendations.push('Continue routine oil analysis (spectrometric wear metals Fe, Cr, Cu) every 500 operating hours.');
    recommendations.push('Maintain clean ISO 4406 oil cleanliness code 16/14/11 via 6-micron offline filtration.');
  }

  return {
    status: {
      level: statusLevel,
      score: healthScore,
      label: statusLabel,
      message: statusMessage,
      recommendations,
    },
    auditTrail,
    outputSpeedRpm: Number(outputSpeedRpm.toFixed(1)),
    gearRatio: Number(u.toFixed(2)),
    pinionSpeedHz: Number(pinionSpeedHz.toFixed(2)),
    gearSpeedHz: Number(gearSpeedHz.toFixed(2)),
    gearMeshFrequencyHz: Number(gearMeshFrequencyHz.toFixed(1)),
    huntingToothFrequencyHz: Number(huntingToothFrequencyHz.toFixed(3)),
    commonFactorsGcd,
    pinionPitchDiameterMm: Number(pinionPitchDiameterMm.toFixed(1)),
    gearPitchDiameterMm: Number(gearPitchDiameterMm.toFixed(1)),
    centerDistanceMm: Number(centerDistanceMm.toFixed(1)),
    pitchLineVelocityMs: Number(pitchLineVelocityMs.toFixed(2)),
    transverseContactRatio: Number(transverseContactRatio.toFixed(2)),
    overlapContactRatio: Number(overlapContactRatio.toFixed(2)),
    totalContactRatio: Number(totalContactRatio.toFixed(2)),
    inputTorqueNm: Number(inputTorqueNm.toFixed(1)),
    outputTorqueNm: Number(outputTorqueNm.toFixed(1)),
    tangentialForceKn: Number(tangentialForceKn.toFixed(2)),
    radialForceKn: Number(radialForceKn.toFixed(2)),
    axialThrustForceKn: Number(axialThrustForceKn.toFixed(2)),
    normalForceKn: Number(normalForceKn.toFixed(2)),
    bendingStressMpa,
    allowableBendingStressMpa,
    bendingSafetyFactorSF,
    contactStressMpa,
    allowableContactStressMpa,
    contactSafetyFactorSH,
    operatingViscosityCSt,
    ehlFilmThicknessUm,
    specificFilmThicknessLambda,
    lubricationRegime,
    gmfHarmonics,
    overallVibrationMmSRms,
    iso10816Zone,
    iso10816ZoneLabel,
    sidebandSeverityPercent,
    stressCurves,
    primaryDiagnosis,
    recommendations,
  };
}
