import { RotorInputs, RotorOutputs, BalanceGrade } from '../types/rotor';
import { getBearing } from './bearingData';
import { AuditStep, StatusAssessment } from '../types/common';

const GRADE_VALUES: Record<BalanceGrade, number> = {
  'G0.4': 0.4,
  'G1.0': 1.0,
  'G2.5': 2.5,
  'G6.3': 6.3,
  'G16': 16.0,
  'G40': 40.0,
  'custom': 2.5,
};

const RELIABILITY_A1: Record<number, number> = {
  0.90: 1.00,
  0.95: 0.64,
  0.98: 0.37,
  0.99: 0.25,
};

const LUBE_FACTORS = {
  good: 1.50,
  normal: 1.00,
  poor: 0.50,
};

const CONTAM_FACTORS = {
  clean: 1.00,
  normal: 0.80,
  contaminated: 0.40,
};

export function calculateRotor(inputs: RotorInputs): RotorOutputs {
  const auditTrail: AuditStep[] = [];
  const specificWarnings: string[] = [];
  const recommendedActions: string[] = [];

  // 1. Kinematics & Angular Velocity
  const safeRpm = Math.max(1, inputs.operatingRpm);
  const omega = (2 * Math.PI * safeRpm) / 60; // rad/s

  auditTrail.push({
    title: 'Rotational Angular Velocity (ω)',
    standardRef: 'Rotor Dynamics Fundamental Kinematics',
    formula: '\\omega = \\frac{2 \\pi \\cdot N}{60}',
    substituted: `N = ${safeRpm} RPM`,
    result: `${omega.toFixed(2)}`,
    unit: 'rad/s',
  });

  // 2. Unbalance Amount (U = m * r) & Two-Plane Static/Couple Decomposition (ISO 1940-1)
  let actualUnbalanceGmm = inputs.unbalanceMassGrams * inputs.unbalanceRadiusMm;
  if (inputs.overrideActualUnbalance && inputs.manualUnbalanceGmm !== undefined) {
    actualUnbalanceGmm = inputs.manualUnbalanceGmm;
  }

  // Plane 1 vector U1
  const u1_gmm = actualUnbalanceGmm;
  let staticUnbalanceGmm = u1_gmm;
  let coupleUnbalanceGmmMm = 0;

  const isTwoPlane = inputs.balancingMode === 'two_plane';
  if (isTwoPlane) {
    const m2_g = inputs.plane2UnbalanceMassGrams !== undefined ? inputs.plane2UnbalanceMassGrams : inputs.unbalanceMassGrams;
    const r2_mm = inputs.plane2UnbalanceRadiusMm !== undefined ? inputs.plane2UnbalanceRadiusMm : inputs.unbalanceRadiusMm;
    const theta2_deg = inputs.plane2PhaseAngleDeg !== undefined ? inputs.plane2PhaseAngleDeg : 180;
    const theta2_rad = (theta2_deg * Math.PI) / 180;

    const u2_gmm = m2_g * r2_mm;
    // Vector decomposition: U1 = (u1, 0), U2 = (u2 * cos(θ), u2 * sin(θ))
    const uStaticX = u1_gmm + u2_gmm * Math.cos(theta2_rad);
    const uStaticY = u2_gmm * Math.sin(theta2_rad);
    staticUnbalanceGmm = Math.sqrt(Math.pow(uStaticX, 2) + Math.pow(uStaticY, 2));

    // Couple vector: ΔU = U1 - U2
    const uCoupleX = u1_gmm - u2_gmm * Math.cos(theta2_rad);
    const uCoupleY = -u2_gmm * Math.sin(theta2_rad);
    const uCoupleDelta = Math.sqrt(Math.pow(uCoupleX, 2) + Math.pow(uCoupleY, 2));
    
    // Couple moment arm is plane separation (span L)
    const planeSpanMm = Math.max(50, inputs.bearingSpanMm || 350);
    coupleUnbalanceGmmMm = uCoupleDelta * (planeSpanMm / 2);

    actualUnbalanceGmm = Math.max(staticUnbalanceGmm, coupleUnbalanceGmmMm / (planeSpanMm / 2));

    auditTrail.push({
      title: 'Two-Plane Dynamic Unbalance Vector Decomposition (ISO 1940)',
      standardRef: 'ISO 1940-1 §5.2 (Static and Couple Unbalance Decomposition)',
      formula: '\\vec{U}_{static} = \\vec{U}_1 + \\vec{U}_2, \\quad \\vec{C}_{couple} = \\frac{L}{2}(\\vec{U}_1 - \\vec{U}_2)',
      substituted: `Plane 1: ${u1_gmm.toFixed(1)} g·mm @ 0°, Plane 2: ${u2_gmm.toFixed(1)} g·mm @ ${theta2_deg}°, Span L = ${planeSpanMm} mm`,
      result: `Static Unbalance = ${staticUnbalanceGmm.toFixed(1)} g·mm, Couple Moment = ${coupleUnbalanceGmmMm.toFixed(0)} g·mm²`,
      unit: 'Vector Sum',
      note: theta2_deg === 180 ? 'Pure couple unbalance: static force cancels, creating pure rotational rock-and-tilt moment.' : 'Combined dynamic unbalance creates both net radial force and angular moment.',
    });
  }

  const actualUnbalanceGcm = actualUnbalanceGmm / 10;
  const actualUnbalanceKgM = actualUnbalanceGmm * 1e-6;
  const actualUnbalanceOzIn = actualUnbalanceGmm * 0.00138874;

  const actualEccentricityMicrons = inputs.rotorMassKg > 0
    ? actualUnbalanceGmm / inputs.rotorMassKg
    : 0;

  auditTrail.push({
    title: 'Rotor Residual Unbalance Amount (U)',
    standardRef: 'ISO 1940-1 §3.2 (U = m × r)',
    formula: 'U = m_u \\cdot r_u',
    substituted: `m_u = ${inputs.unbalanceMassGrams.toFixed(2)} g, r_u = ${inputs.unbalanceRadiusMm.toFixed(1)} mm`,
    result: `${actualUnbalanceGmm.toFixed(1)} g·mm (${actualUnbalanceGcm.toFixed(2)} g·cm, ${actualUnbalanceOzIn.toFixed(2)} oz·in)`,
    unit: 'g·mm',
  });

  // 3. Dynamic Centrifugal Unbalance Force (F = m * r * omega^2 = U * omega^2)
  const dynamicUnbalanceForceN = actualUnbalanceKgM * Math.pow(omega, 2);
  const dynamicUnbalanceForceLbf = dynamicUnbalanceForceN * 0.224809;
  const rotorWeightN = inputs.rotorMassKg * 9.80665;
  const forceToRotorWeightRatio = rotorWeightN > 0 ? dynamicUnbalanceForceN / rotorWeightN : 0;

  auditTrail.push({
    title: 'Centrifugal Dynamic Unbalance Force (F_unbal)',
    standardRef: 'Newton\'s Second Law / Rotating Reference Frame',
    formula: 'F = m_u \\cdot r_u \\cdot \\omega^2 = U_{kg\\cdot m} \\cdot \\omega^2',
    substituted: `U = ${actualUnbalanceKgM.toExponential(3)} kg·m, ω = ${omega.toFixed(2)} rad/s`,
    result: `${dynamicUnbalanceForceN.toFixed(1)} N (${dynamicUnbalanceForceLbf.toFixed(1)} lbf, ${(forceToRotorWeightRatio * 100).toFixed(1)}% of rotor weight)`,
    unit: 'N',
  });

  // 4. ISO 1940-1 Permissible Unbalance Estimate
  const gradeValue = inputs.balanceGrade === 'custom'
    ? (inputs.customGradeValue || 2.5)
    : (GRADE_VALUES[inputs.balanceGrade] || 2.5);

  // e_per in µm = (G [mm/s] * 1000) / omega [rad/s]
  const e_per_microns = omega > 0 ? (gradeValue * 1000) / omega : 0;
  const u_per_gmm = e_per_microns * inputs.rotorMassKg;
  const unbalanceRatio = u_per_gmm > 0 ? actualUnbalanceGmm / u_per_gmm : 1.0;
  const isBalanceCompliant = unbalanceRatio <= 1.0;

  auditTrail.push({
    title: 'ISO 1940-1 Permissible Residual Unbalance (U_per)',
    standardRef: `ISO 1940-1 Estimate (Grade ${inputs.balanceGrade === 'custom' ? `Custom G${gradeValue}` : inputs.balanceGrade})`,
    formula: 'e_{per} = \\frac{1000 \\cdot G}{\\omega}, \\quad U_{per} = M_{rotor} \\cdot e_{per}',
    substituted: `G = ${gradeValue} mm/s, M = ${inputs.rotorMassKg} kg, ω = ${omega.toFixed(2)} rad/s`,
    result: `U_per = ${u_per_gmm.toFixed(1)} g·mm (e_per = ${e_per_microns.toFixed(2)} µm)`,
    unit: 'g·mm',
    isCompliant: isBalanceCompliant,
  });

  if (!isBalanceCompliant) {
    specificWarnings.push(
      `Residual unbalance (${actualUnbalanceGmm.toFixed(1)} g·mm) exceeds ISO 1940 Grade ${inputs.balanceGrade} limit of ${u_per_gmm.toFixed(1)} g·mm (${(unbalanceRatio * 100).toFixed(0)}% of allowable).`
    );
    recommendedActions.push(
      `Perform precision trim dynamic balancing to reduce unbalance below ${u_per_gmm.toFixed(1)} g·mm (Grade ${inputs.balanceGrade}).`
    );
  }

  // 5. Rotor Dynamics, Critical Speed & SDOF Vibration Response
  // Stiffness in N/m
  const stiffnessKNmm = Math.max(1, inputs.rotorStiffnessKNmm || 50);
  const stiffnessNm = stiffnessKNmm * 1e6; // e.g. 50 kN/mm -> 50,000,000 N/m
  const rotorMass = Math.max(1, inputs.rotorMassKg);

  // Critical angular velocity omega_n = sqrt(k / m)
  const criticalOmega = Math.sqrt(stiffnessNm / rotorMass); // rad/s
  const criticalSpeedRpm = (criticalOmega * 60) / (2 * Math.PI); // RPM
  const speedRatioLambda = criticalSpeedRpm > 0 ? safeRpm / criticalSpeedRpm : 1.0;

  const isNearCriticalSpeed = speedRatioLambda >= 0.85 && speedRatioLambda <= 1.15;
  let criticalSpeedZone: 'subcritical' | 'resonance' | 'supercritical' = 'subcritical';
  if (speedRatioLambda > 1.15) {
    criticalSpeedZone = 'supercritical';
  } else if (speedRatioLambda >= 0.85) {
    criticalSpeedZone = 'resonance';
  }

  if (isNearCriticalSpeed) {
    specificWarnings.push(
      `Operating speed (${safeRpm} RPM) is within ±15% of first critical speed (${criticalSpeedRpm.toFixed(0)} RPM, λ = ${speedRatioLambda.toFixed(2)}). Severe dynamic amplification occurs in this resonance band.`
    );
    recommendedActions.push(
      `Avoid continuous operation between ${(criticalSpeedRpm * 0.85).toFixed(0)} and ${(criticalSpeedRpm * 1.15).toFixed(0)} RPM. Increase shaft stiffness or adjust speed away from critical resonance.`
    );
  }

  // Damping coefficient c
  const zeta = Math.max(0.01, Math.min(0.5, inputs.dampingRatio || 0.05));
  const criticalDampingCc = 2 * Math.sqrt(stiffnessNm * rotorMass);
  const dampingC = inputs.dampingCoefficientNsM !== undefined && inputs.dampingCoefficientNsM > 0
    ? inputs.dampingCoefficientNsM
    : zeta * criticalDampingCc;

  // SDOF vibration displacement amplitude X = F / sqrt((k - m*omega^2)^2 + (c*omega)^2)
  const dynamicDenominator = Math.sqrt(
    Math.pow(stiffnessNm - rotorMass * Math.pow(omega, 2), 2) +
    Math.pow(dampingC * omega, 2)
  );

  const dispPeakM = dynamicDenominator > 0 ? dynamicUnbalanceForceN / dynamicDenominator : 0;
  const dispPkPkMicrons = dispPeakM * 2 * 1e6; // Peak-to-peak in µm
  const dispPkPkMils = dispPkPkMicrons / 25.4; // pk-pk mils

  // Vibration velocity: v_pk = X_pk * omega (m/s), v_rms = v_pk / sqrt(2) in mm/s
  const velPkMmS = dispPeakM * omega * 1000;
  const velRmsMmS = velPkMmS / Math.SQRT2;
  const velRmsInS = velRmsMmS / 25.4;

  auditTrail.push({
    title: 'Rotor SDOF Critical Speed & Vibration Amplitude Response',
    standardRef: 'API 684 / SDOF Rotor Dynamics',
    formula: '\\omega_n = \\sqrt{\\frac{k}{m}}, \\quad X = \\frac{F}{\\sqrt{(k - m \\omega^2)^2 + (c \\omega)^2}}, \\quad v_{rms} = \\frac{\\omega \\cdot X}{\\sqrt{2}}',
    substituted: `k = ${(stiffnessNm / 1e6).toFixed(1)} MN/m, m = ${rotorMass} kg, c = ${dampingC.toFixed(1)} N·s/m, F = ${dynamicUnbalanceForceN.toFixed(1)} N`,
    result: `N_crit = ${criticalSpeedRpm.toFixed(0)} RPM (λ = ${speedRatioLambda.toFixed(2)}), X_pk-pk = ${dispPkPkMicrons.toFixed(1)} µm (${dispPkPkMils.toFixed(2)} mils), v_rms = ${velRmsMmS.toFixed(2)} mm/s`,
    unit: 'mm/s RMS',
    isCompliant: !isNearCriticalSpeed,
  });

  // 6. ISO 10816 / ISO 20816 Vibration Severity Evaluation
  let limits = { zoneALimit: 1.12, zoneBLimit: 2.80, zoneCLimit: 7.10 };
  if (inputs.machineClass === 'class_1_small') {
    limits = { zoneALimit: 0.71, zoneBLimit: 1.80, zoneCLimit: 4.50 };
  } else if (inputs.machineClass === 'class_3_large_rigid') {
    limits = { zoneALimit: 1.80, zoneBLimit: 4.50, zoneCLimit: 11.20 };
  } else if (inputs.machineClass === 'class_4_large_flexible') {
    limits = { zoneALimit: 2.80, zoneBLimit: 7.10, zoneCLimit: 18.00 };
  }

  let isoZone: 'A' | 'B' | 'C' | 'D' = 'A';
  let zoneDesc = 'Zone A: Newly commissioned / Excellent machinery condition';
  if (velRmsMmS > limits.zoneCLimit) {
    isoZone = 'D';
    zoneDesc = 'Zone D: Danger (High vibration severity; immediate trip/shutdown recommended)';
    specificWarnings.push(
      `Vibration velocity (${velRmsMmS.toFixed(2)} mm/s RMS) is in ISO 10816 Zone D (Danger > ${limits.zoneCLimit} mm/s). Risk of rapid bearing fatigue and catastrophic shaft damage.`
    );
    recommendedActions.push('Shut down equipment for balance correction and shaft alignment inspection.');
  } else if (velRmsMmS > limits.zoneBLimit) {
    isoZone = 'C';
    zoneDesc = 'Zone C: Unsatisfactory (Continuous operation restricted; schedule corrective maintenance)';
    specificWarnings.push(
      `Vibration velocity (${velRmsMmS.toFixed(2)} mm/s RMS) is in ISO 10816 Zone C (Alarm > ${limits.zoneBLimit} mm/s).`
    );
    recommendedActions.push('Schedule trim balancing and vibration monitoring at 1X synchronous frequency.');
  } else if (velRmsMmS > limits.zoneALimit) {
    isoZone = 'B';
    zoneDesc = 'Zone B: Acceptable (Machinery normally acceptable for unrestricted long-term operation)';
  }

  auditTrail.push({
    title: 'ISO 10816 / ISO 20816 Vibration Severity Zone',
    standardRef: `ISO 10816-3 (${inputs.machineClass})`,
    formula: 'v_{rms} \\gtrless \\text{Zone Thresholds}',
    substituted: `v_rms = ${velRmsMmS.toFixed(2)} mm/s (Zone A < ${limits.zoneALimit}, B < ${limits.zoneBLimit}, C < ${limits.zoneCLimit} mm/s)`,
    result: `Zone ${isoZone} (${zoneDesc.split(':')[0]})`,
    unit: 'Zone',
    isCompliant: isoZone === 'A' || isoZone === 'B',
  });

  // 7. Bearing Life Calculation (ISO 281)
  const bearing = getBearing(inputs.bearingModelId);
  const isRoller = inputs.bearingType === 'roller' || bearing.bearingCategory === 'roller';
  const exponentP = isRoller ? (10 / 3) : 3.0;

  const dynamicCapacityCrN = (inputs.basicDynamicLoadC_kN && inputs.basicDynamicLoadC_kN > 0)
    ? inputs.basicDynamicLoadC_kN * 1000
    : bearing.dynamicCapacityCrN;

  // Equivalent Dynamic Load P with OH2 Overhung vs BB2 Between-Bearings Analysis
  const bearingSpanM = Math.max(0.05, (inputs.bearingSpanMm || 350) / 1000);
  const overhungLengthM = Math.max(0.0, (inputs.overhungLengthMm || 250) / 1000);
  const isOverhung = inputs.bearingPosition === 'overhung';

  let inboardDynamicForceN = 0;
  let outboardDynamicForceN = 0;
  let inboardStaticLoadN = 0;
  let outboardStaticLoadN = 0;
  let overhungMomentNm = 0;

  if (isOverhung) {
    // OH2 Overhung: Inboard bearing experiences magnified reaction: (1 + a / L)
    const overhangRatio = overhungLengthM / bearingSpanM;
    inboardDynamicForceN = dynamicUnbalanceForceN * (1 + overhangRatio);
    outboardDynamicForceN = dynamicUnbalanceForceN * overhangRatio;

    inboardStaticLoadN = Math.max(50, rotorWeightN * (1 + overhangRatio));
    outboardStaticLoadN = Math.max(10, rotorWeightN * overhangRatio);
    overhungMomentNm = (dynamicUnbalanceForceN + rotorWeightN) * overhungLengthM;

    auditTrail.push({
      title: 'API 610 OH2 Overhung Rotor Bearing Load Reactions',
      standardRef: 'API 610 12th Ed. §6.8 (Bearing Housing and Load Analysis)',
      formula: 'F_{inboard} = F_{unbal} \\left(1 + \\frac{a}{L}\\right), \\quad F_{outboard} = F_{unbal} \\left(\\frac{a}{L}\\right), \\quad M_{overhang} = F \\cdot a',
      substituted: `Overhang a = ${(overhungLengthM * 1000).toFixed(0)} mm, Span L = ${(bearingSpanM * 1000).toFixed(0)} mm, Overhang Ratio a/L = ${overhangRatio.toFixed(2)}`,
      result: `Inboard Bearing Load = ${inboardDynamicForceN.toFixed(1)} N (${((1 + overhangRatio) * 100).toFixed(0)}% of F_unbal), Outboard Reaction = ${outboardDynamicForceN.toFixed(1)} N, Overhung Moment = ${overhungMomentNm.toFixed(1)} N·m`,
      unit: 'N / N·m',
      note: 'Inboard pump bearing experiences substantial dynamic amplification due to cantilever impeller overhang.',
    });
  } else {
    // BB2 Between Bearings:
    const distFactor = Math.max(0.1, Math.min(0.9, inputs.loadDistributionFactor || 0.5));
    inboardDynamicForceN = dynamicUnbalanceForceN * distFactor;
    outboardDynamicForceN = dynamicUnbalanceForceN * (1 - distFactor);

    inboardStaticLoadN = Math.max(50, rotorWeightN * distFactor);
    outboardStaticLoadN = Math.max(50, rotorWeightN * (1 - distFactor));
    overhungMomentNm = 0;

    auditTrail.push({
      title: 'API 610 BB2 Between-Bearings Load Distribution',
      standardRef: 'API 610 §6.8 / ISO 281 Load Allocation',
      formula: 'F_{inboard} = k_{dist} \\cdot F_{unbal}, \\quad F_{outboard} = (1 - k_{dist}) \\cdot F_{unbal}',
      substituted: `Distribution k = ${(distFactor * 100).toFixed(0)}% / ${((1 - distFactor) * 100).toFixed(0)}%, Rotor Weight = ${rotorWeightN.toFixed(1)} N`,
      result: `Inboard = ${inboardDynamicForceN.toFixed(1)} N dynamic, Outboard = ${outboardDynamicForceN.toFixed(1)} N dynamic`,
      unit: 'N',
    });
  }

  let equivalentLoadP = 0;
  if (inputs.useDirectLoadP && inputs.equivalentLoadP_kN > 0) {
    equivalentLoadP = inputs.equivalentLoadP_kN * 1000;
  } else {
    const radialP = inboardStaticLoadN + inboardDynamicForceN;

    let axialContrib = 0;
    if (inputs.axialLoadN && inputs.axialLoadN > 0) {
      if (bearing.type === 'deep_groove') {
        const faFr = inputs.axialLoadN / Math.max(1, radialP);
        if (faFr > 0.25) axialContrib = 1.4 * inputs.axialLoadN;
      } else if (bearing.type === 'angular_contact') {
        axialContrib = 0.57 * inputs.axialLoadN;
      } else if (bearing.type === 'spherical_roller') {
        axialContrib = 2.5 * inputs.axialLoadN;
      }
    }
    equivalentLoadP = radialP + axialContrib;
  }

  equivalentLoadP = Math.max(10, equivalentLoadP);
  const loadRatioCP = dynamicCapacityCrN / equivalentLoadP;

  // Basic Rating Life L10
  // L10 = (C / P)^p in million revolutions
  const l10MillionRevs = Math.pow(loadRatioCP, exponentP);
  // L10h = (L10 * 10^6) / (N * 60) in hours
  const l10hHours = (l10MillionRevs * 1e6) / (safeRpm * 60);

  // Modified Life Factors
  const a1 = RELIABILITY_A1[inputs.reliabilityTarget] || 1.0;
  const aLube = LUBE_FACTORS[inputs.lubricationCondition] || 1.0;
  const aContam = CONTAM_FACTORS[inputs.contaminationLevel] || 0.80;
  const aMod = a1 * aLube * aContam;

  const l10mhHours = l10hHours * aMod;
  const operatingYears24x7 = l10mhHours / (24 * 365.25);

  let bearingLifeStatus: 'safe' | 'warning' | 'critical' = 'safe';
  if (l10mhHours < 8000 || loadRatioCP < 4.0) {
    bearingLifeStatus = 'critical';
    specificWarnings.push(
      `Bearing modified rating life L10mh (${Math.round(l10mhHours).toLocaleString()} hours / ${operatingYears24x7.toFixed(1)} years) is critically low (< 8,000 hrs). C/P load ratio is ${loadRatioCP.toFixed(2)}x.`
    );
    recommendedActions.push('Select a higher dynamic capacity bearing (higher C rating).');
    recommendedActions.push('Reduce static/dynamic radial load P.');
  } else if (l10mhHours < 25000 || loadRatioCP < 6.5) {
    bearingLifeStatus = 'warning';
    specificWarnings.push(
      `Bearing rating life L10mh (${Math.round(l10mhHours).toLocaleString()} hours) is below typical API 610 industrial target (25,000 hrs / ~3 years).`
    );
  }

  if (inputs.lubricationCondition === 'poor') {
    specificWarnings.push('Poor lubrication condition reduces bearing fatigue life by 50% (a_lube = 0.50).');
    recommendedActions.push('Improve lubrication: inspect lubricant viscosity, flow rate, and relubrication intervals.');
  }

  if (inputs.contaminationLevel === 'contaminated') {
    specificWarnings.push('High particle contamination reduces bearing life by 60% (a_contam = 0.40).');
    recommendedActions.push('Reduce contamination: upgrade bearing isolators / labyrinth seals and improve oil filtration.');
  }

  auditTrail.push({
    title: 'ISO 281 Rolling Bearing Rating Life (L10h & Modified L10mh)',
    standardRef: 'ISO 281:2007 (Basic & Modified Rating Life)',
    formula: 'L_{10} = \\left(\\frac{C}{P}\\right)^p, \\quad L_{10h} = \\frac{L_{10} \\cdot 10^6}{60 \\cdot N}, \\quad L_{10mh} = a_1 \\cdot a_{lube} \\cdot a_{contam} \\cdot L_{10h}',
    substituted: `Bearing Type: ${isRoller ? 'Roller (p=10/3)' : 'Ball (p=3)'}, C = ${(dynamicCapacityCrN / 1000).toFixed(1)} kN, P = ${(equivalentLoadP / 1000).toFixed(2)} kN (C/P = ${loadRatioCP.toFixed(2)}), a1 = ${a1.toFixed(2)} (${((inputs.reliabilityTarget || 0.90) * 100).toFixed(0)}% Rel), a_lube = ${aLube.toFixed(2)}, a_contam = ${aContam.toFixed(2)}, a_mod = ${aMod.toFixed(3)}`,
    result: `L10 = ${l10MillionRevs.toFixed(1)} M revs | L10h = ${Math.round(l10hHours).toLocaleString()} hrs | L10mh = ${Math.round(l10mhHours).toLocaleString()} hrs (${operatingYears24x7.toFixed(1)} yrs)`,
    unit: 'hours',
    isCompliant: bearingLifeStatus === 'safe',
  });

  // Overall Health Status Assessment
  let overallLevel: 'safe' | 'warning' | 'critical' = 'safe';
  let overallLabel = 'Rotor & Bearing Operating Within Design Envelope';
  let overallMessage = `Vibration is in ISO 10816 Zone ${isoZone} (${velRmsMmS.toFixed(2)} mm/s RMS). Residual unbalance is within ISO Grade ${inputs.balanceGrade}. Bearing L10mh modified life is ${Math.round(l10mhHours).toLocaleString()} hrs (${operatingYears24x7.toFixed(1)} yrs).`;
  let healthScore = 95;

  if (isoZone === 'D' || isNearCriticalSpeed || bearingLifeStatus === 'critical' || unbalanceRatio > 3.0) {
    overallLevel = 'critical';
    overallLabel = isNearCriticalSpeed
      ? 'Critical Speed Resonance / High Vibration Alert'
      : 'Critical Dynamic Unbalance / Bearing Overload';
    overallMessage = isNearCriticalSpeed
      ? `Operating speed (${safeRpm} RPM) is in the critical resonance zone (N_crit = ${criticalSpeedRpm.toFixed(0)} RPM). Severe dynamic unbalance amplification.`
      : `Excessive unbalance (${actualUnbalanceGmm.toFixed(0)} g·mm, ${unbalanceRatio.toFixed(1)}x limit) or low bearing life (${Math.round(l10mhHours).toLocaleString()} hrs). Vibration in Zone ${isoZone}.`;
    healthScore = isNearCriticalSpeed ? 25 : 35;
  } else if (isoZone === 'C' || !isBalanceCompliant || bearingLifeStatus === 'warning' || inputs.lubricationCondition === 'poor') {
    overallLevel = 'warning';
    overallLabel = 'Elevated Unbalance / Reduced Bearing Fatigue Margin';
    overallMessage = `Unbalance ratio is ${unbalanceRatio.toFixed(2)}x allowable limit (Grade ${inputs.balanceGrade}). Vibration velocity is ${velRmsMmS.toFixed(2)} mm/s (Zone ${isoZone}).`;
    healthScore = 65;
  }

  const status: StatusAssessment = {
    level: overallLevel,
    score: healthScore,
    label: overallLabel,
    message: overallMessage,
    recommendations: recommendedActions,
  };

  return {
    angularVelocityRadS: omega,
    actualUnbalanceGmm,
    actualUnbalanceGcm,
    actualUnbalanceKgM,
    actualUnbalanceOzIn,
    iso1940PermissibleUnbalanceGmm: u_per_gmm,
    iso1940PermissibleEperMicrons: e_per_microns,
    actualEccentricityMicrons,
    unbalanceRatio,
    isBalanceCompliant,
    dynamicUnbalanceForceN,
    dynamicUnbalanceForceLbf,
    forceToRotorWeightRatio,
    inboardBearingDynamicForceN: inboardDynamicForceN,
    outboardBearingDynamicForceN: outboardDynamicForceN,
    inboardBearingStaticLoadN: inboardStaticLoadN,
    outboardBearingStaticLoadN: outboardStaticLoadN,
    overhungMomentNm,
    staticUnbalanceGmm,
    coupleUnbalanceGmmMm,
    criticalSpeedRpm,
    criticalAngularSpeedRadS: criticalOmega,
    speedRatioLambda,
    isNearCriticalSpeed,
    criticalSpeedZone,
    stiffnessNm,
    dampingC,
    vibrationDisplacementPeakM: dispPeakM,
    vibrationDisplacementPkPkMicrons: dispPkPkMicrons,
    vibrationDisplacementPkPkMils: dispPkPkMils,
    vibrationVelocityPkMmS: velPkMmS,
    vibrationVelocityRmsMmS: velRmsMmS,
    vibrationVelocityRmsInS: velRmsInS,
    iso10816Zone: isoZone,
    iso10816ZoneDescription: zoneDesc,
    iso10816Limits: limits,
    bearingExponentP: exponentP,
    bearingDynamicCapacityCrN: dynamicCapacityCrN,
    equivalentDynamicLoadP_N: equivalentLoadP,
    loadRatioCP,
    basicLifeL10MillionRevs: l10MillionRevs,
    basicLifeL10hHours: l10hHours,
    reliabilityFactorA1: a1,
    lubricationFactorAlube: aLube,
    contaminationFactorAcontam: aContam,
    combinedLifeFactorAmod: aMod,
    modifiedLifeL10mhHours: l10mhHours,
    operatingYears24x7,
    bearingLifeStatus,
    status,
    specificWarnings,
    recommendedActions,
    auditTrail,
  };
}
