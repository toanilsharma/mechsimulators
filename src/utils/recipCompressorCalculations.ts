import {
  RecipCompressorInputs,
  RecipCompressorOutputs,
  PVDataPoint,
  HarmonicOrder,
  GasType,
} from '../types/recipCompressor';

// Gas thermodynamic properties constants
const GAS_PROPERTIES: Record<
  GasType,
  { name: string; mw: number; k: number; z: number }
> = {
  natural_gas_methane: { name: 'Methane (Natural Gas)', mw: 16.043, k: 1.30, z: 0.96 },
  hydrogen_h2: { name: 'Hydrogen (H₂)', mw: 2.016, k: 1.405, z: 1.01 },
  nitrogen_air: { name: 'Nitrogen / Air', mw: 28.96, k: 1.40, z: 0.99 },
  carbon_dioxide_co2: { name: 'Carbon Dioxide (CO₂)', mw: 44.01, k: 1.28, z: 0.94 },
  propane_c3h8: { name: 'Propane (LPG)', mw: 44.1, k: 1.13, z: 0.90 },
};

export function calculateRecipCompressor(inputs: RecipCompressorInputs): RecipCompressorOutputs {
  const {
    cylinderBoreMm,
    strokeMm,
    connectingRodLengthMm,
    pistonRodDiameterMm,
    crankSpeedRpm,
    cylinderAction,
    heClearancePercent,
    ceClearancePercent,
    reciprocatingMassKg,
    rodLoadTensionLimitKn,
    rodLoadCompressionLimitKn,
    gasType,
    suctionPressureBarA,
    suctionTempC,
    dischargePressureBarA,
    suctionValveFault,
    dischargeValveFault,
    pistonRingCondition,
    hasPulsationBottles,
    damperVolumeLiters,
    chokeTubeDiameterMm,
    chokeTubeLengthMm,
    pipingLengthToFirstElbowM,
  } = inputs;

  const gas = GAS_PROPERTIES[gasType];
  const pressureRatio = dischargePressureBarA / Math.max(0.1, suctionPressureBarA);

  // Geometric Areas (m^2)
  const boreM = cylinderBoreMm / 1000;
  const strokeM = strokeMm / 1000;
  const rodDiamM = pistonRodDiameterMm / 1000;
  const connRodM = connectingRodLengthMm / 1000;
  const crankRadiusM = strokeM / 2;
  const lambda = crankRadiusM / Math.max(0.001, connRodM); // r / L

  const areaHE = (Math.PI / 4) * Math.pow(boreM, 2);
  const areaRod = (Math.PI / 4) * Math.pow(rodDiamM, 2);
  const areaCE = areaHE - areaRod;

  // Swept Volumes (m^3 and Liters)
  const sweptVolHE_m3 = areaHE * strokeM;
  const sweptVolCE_m3 = areaCE * strokeM;
  const sweptVolHE_L = sweptVolHE_m3 * 1000;
  const sweptVolCE_L = sweptVolCE_m3 * 1000;

  // Clearance Volumes (m^3 and Liters)
  const cHE = heClearancePercent / 100;
  const cCE = ceClearancePercent / 100;
  const clearVolHE_m3 = cHE * sweptVolHE_m3;
  const clearVolCE_m3 = cCE * sweptVolCE_m3;
  const clearVolHE_L = clearVolHE_m3 * 1000;
  const clearVolCE_L = clearVolCE_m3 * 1000;

  // Kinematics: Angular velocity omega (rad/s)
  const omega = (2 * Math.PI * crankSpeedRpm) / 60;
  const runningFreqHz = crankSpeedRpm / 60;

  // Acoustic speed of sound in gas (m/s)
  // c = sqrt(k * Z * R_u * T / M_w)
  const Ru = 8314.46; // J / (kmol * K)
  const R_specific = Ru / gas.mw;
  const T_suct_K = suctionTempC + 273.15;
  const acousticSpeedOfSoundMs = Math.sqrt(
    gas.k * gas.z * R_specific * T_suct_K
  );

  // Theoretical Discharge Temperature (isentropic)
  const theoreticalDischargeTempK = T_suct_K * Math.pow(pressureRatio, (gas.k - 1) / gas.k);
  let deltaTempFault = 0;
  if (suctionValveFault === 'minor_leak') deltaTempFault += 12;
  if (suctionValveFault === 'severe_leak') deltaTempFault += 32;
  if (dischargeValveFault === 'minor_leak') deltaTempFault += 18;
  if (dischargeValveFault === 'severe_leak') deltaTempFault += 45;
  if (pistonRingCondition === 'worn_blowby') deltaTempFault += 14;
  if (pistonRingCondition === 'severe_blowby') deltaTempFault += 30;

  const actualDischargeTempC = theoreticalDischargeTempK - 273.15 + deltaTempFault;

  // Pressure losses across valves
  let deltaPsuct = 0.15; // standard ~0.15 bar drop
  let deltaPdisch = 0.35; // standard ~0.35 bar drop
  if (suctionValveFault === 'late_opening') deltaPsuct += 0.5;
  if (dischargeValveFault === 'sticking_overpressure' as any) deltaPdisch += 1.8;

  // Generate PV Data Points across 360 degrees
  const pvPoints: PVDataPoint[] = [];
  const totalSteps = 72; // 5 degree steps
  const stepDeg = 360 / totalSteps;

  let totalIndicatedWorkJoules = 0;
  let intakeVolumeLitersHE = 0;
  let intakeVolumeLitersCE = 0;

  let maxTensionRodLoadKn = -Infinity;
  let maxCompressionRodLoadKn = Infinity;
  let positiveLoadAngleCount = 0;
  let negativeLoadAngleCount = 0;

  // Simulate cylinder cycle
  for (let i = 0; i <= totalSteps; i++) {
    const thetaDeg = (i % totalSteps) * stepDeg;
    const thetaRad = (thetaDeg * Math.PI) / 180;

    // Piston position from Head End TDC (x = 0 at theta = 0)
    // x(theta) = r * [ (1 - cos theta) + (1/lambda) * (1 - sqrt(1 - lambda^2 * sin^2 theta)) ]
    const cosT = Math.cos(thetaRad);
    const sinT = Math.sin(thetaRad);
    const sqrtTerm = Math.sqrt(Math.max(0, 1 - Math.pow(lambda * sinT, 2)));
    const pistonPosM = crankRadiusM * ((1 - cosT) + (1 / lambda) * (1 - sqrtTerm));
    const pistonPosMm = pistonPosM * 1000;

    // Instantaneous Cylinder Volumes (Liters)
    const volHE_L = clearVolHE_L + areaHE * pistonPosM * 1000;
    const volCE_L = clearVolCE_L + areaCE * (strokeM - pistonPosM) * 1000;

    // --- Head End Thermodynamic Cycle ---
    // 0 to 180°: Expansion & Suction stroke (Piston moving from TDC to BDC, x increasing, vol increasing)
    // 180 to 360°: Compression & Discharge stroke (Piston moving from BDC to TDC, x decreasing, vol decreasing)
    let p_HE = suctionPressureBarA;
    let p_ideal_HE = suctionPressureBarA;

    // Polytropic expansion volume cutoff
    const volReExpCutoffHE_L = clearVolHE_L * Math.pow(dischargePressureBarA / suctionPressureBarA, 1 / gas.k);

    if (thetaDeg >= 0 && thetaDeg <= 180) {
      // Stroke: Piston moving down (0 to 180°)
      if (volHE_L < volReExpCutoffHE_L) {
        // Re-expansion phase
        p_ideal_HE = dischargePressureBarA * Math.pow(clearVolHE_L / volHE_L, gas.k);
        p_HE = p_ideal_HE;
        if (dischargeValveFault === 'minor_leak') {
          p_HE += (dischargePressureBarA - p_HE) * 0.25;
        } else if (dischargeValveFault === 'severe_leak') {
          p_HE += (dischargePressureBarA - p_HE) * 0.65;
        }
      } else {
        // Suction phase
        p_ideal_HE = Math.max(0.1, suctionPressureBarA - deltaPsuct);
        p_HE = p_ideal_HE;
        if (suctionValveFault === 'flutter') {
          p_HE += 0.25 * Math.sin(thetaRad * 8);
        }
        if (suctionValveFault === 'late_opening' && volHE_L < volReExpCutoffHE_L * 1.3) {
          p_HE -= 0.6; // drawn down deeper before valve opens
        }
      }
    } else {
      // Stroke: Piston moving up / compressing (180 to 360°)
      // Compression phase until pressure reaches discharge
      const volAtBDC_HE = clearVolHE_L + sweptVolHE_L;
      p_ideal_HE = (suctionPressureBarA - deltaPsuct) * Math.pow(volAtBDC_HE / volHE_L, gas.k);

      if (p_ideal_HE >= dischargePressureBarA + deltaPdisch) {
        // Discharge phase
        p_ideal_HE = dischargePressureBarA + deltaPdisch;
        p_HE = p_ideal_HE;
        if (dischargeValveFault === 'flutter') {
          p_HE += 0.45 * Math.sin(thetaRad * 10);
        }
      } else {
        // Active compression phase
        p_HE = p_ideal_HE;
        if (suctionValveFault === 'minor_leak') {
          p_HE *= 0.88; // pressure bleed back into suction
        } else if (suctionValveFault === 'severe_leak') {
          p_HE *= 0.68;
        }
        if (pistonRingCondition === 'worn_blowby') {
          p_HE *= 0.92;
        } else if (pistonRingCondition === 'severe_blowby') {
          p_HE *= 0.80;
        }
      }
    }

    // --- Crank End Thermodynamic Cycle (180° out of phase) ---
    let p_CE = suctionPressureBarA;
    if (cylinderAction === 'double_acting') {
      const thetaCE_Deg = (thetaDeg + 180) % 360;
      const thetaCE_Rad = (thetaCE_Deg * Math.PI) / 180;
      const volReExpCutoffCE_L = clearVolCE_L * Math.pow(dischargePressureBarA / suctionPressureBarA, 1 / gas.k);

      if (thetaCE_Deg >= 0 && thetaCE_Deg <= 180) {
        if (volCE_L < volReExpCutoffCE_L) {
          p_CE = dischargePressureBarA * Math.pow(clearVolCE_L / volCE_L, gas.k);
        } else {
          p_CE = Math.max(0.1, suctionPressureBarA - deltaPsuct);
        }
      } else {
        const volAtBDC_CE = clearVolCE_L + sweptVolCE_L;
        const p_comp_CE = (suctionPressureBarA - deltaPsuct) * Math.pow(volAtBDC_CE / volCE_L, gas.k);
        if (p_comp_CE >= dischargePressureBarA + deltaPdisch) {
          p_CE = dischargePressureBarA + deltaPdisch;
        } else {
          p_CE = p_comp_CE;
        }
      }
    } else if (cylinderAction === 'single_acting_ce') {
      // CE only
      p_HE = 1.013; // Atmospheric open Head End
    } else {
      // HE only
      p_CE = 1.013; // Atmospheric open Crank End
    }

    // Dynamic Inertia Load of Reciprocating Components (Crosshead + Rod + Piston)
    // F_inertia = - m_recip * r * omega^2 * (cos theta + lambda * cos 2*theta)
    const inertiaForceN =
      -reciprocatingMassKg *
      crankRadiusM *
      Math.pow(omega, 2) *
      (cosT + lambda * Math.cos(2 * thetaRad));
    const inertiaLoadKn = inertiaForceN / 1000;

    // Gas Load on Rod:
    // F_gas = P_HE * A_HE - P_CE * A_CE - P_atm * A_rod
    // Tension is positive, Compression is negative
    const pHePa = p_HE * 1e5;
    const pCePa = p_CE * 1e5;
    const pAtmPa = 1.01325 * 1e5;
    const gasForceN = pHePa * areaHE - pCePa * areaCE - pAtmPa * areaRod;
    const gasLoadKn = gasForceN / 1000;

    // Combined Rod Load
    const combinedRodLoadKn = gasLoadKn + inertiaLoadKn;

    if (combinedRodLoadKn > maxTensionRodLoadKn) maxTensionRodLoadKn = combinedRodLoadKn;
    if (combinedRodLoadKn < maxCompressionRodLoadKn) maxCompressionRodLoadKn = combinedRodLoadKn;

    if (combinedRodLoadKn > 0) positiveLoadAngleCount++;
    if (combinedRodLoadKn < 0) negativeLoadAngleCount++;

    pvPoints.push({
      crankAngleDeg: Math.round(thetaDeg),
      pistonPositionMm: Number(pistonPosMm.toFixed(2)),
      sweptVolumeLitersHE: Number(volHE_L.toFixed(3)),
      sweptVolumeLitersCE: Number(volCE_L.toFixed(3)),
      cylinderPressureBarAHE: Number(p_HE.toFixed(2)),
      cylinderPressureBarACE: Number(p_CE.toFixed(2)),
      idealPressureBarAHE: Number(p_ideal_HE.toFixed(2)),
      gasLoadKn: Number(gasLoadKn.toFixed(2)),
      inertiaLoadKn: Number(inertiaLoadKn.toFixed(2)),
      combinedRodLoadKn: Number(combinedRodLoadKn.toFixed(2)),
    });
  }

  // Work Integration across PV loop (Head End)
  for (let i = 0; i < pvPoints.length - 1; i++) {
    const pAvgPa = ((pvPoints[i].cylinderPressureBarAHE + pvPoints[i + 1].cylinderPressureBarAHE) / 2) * 1e5;
    const dV_m3 = (pvPoints[i + 1].sweptVolumeLitersHE - pvPoints[i].sweptVolumeLitersHE) * 0.001;
    totalIndicatedWorkJoules += pAvgPa * dV_m3;
  }
  if (cylinderAction === 'double_acting') {
    totalIndicatedWorkJoules *= 1.88; // include CE work
  }

  const indicatedPowerKw = Math.abs((totalIndicatedWorkJoules * (crankSpeedRpm / 60)) / 1000);
  const mechanicalEfficiency = 0.94;
  const brakePowerKw = indicatedPowerKw / mechanicalEfficiency;

  // Volumetric Efficiency calculation
  // eta_v = 1 - c * [ (P_d / P_s)^(1/k) - 1 ] - losses
  const theoreticalEtaV_HE =
    100 * (1 - cHE * (Math.pow(pressureRatio, 1 / gas.k) - 1));
  const theoreticalEtaV_CE =
    100 * (1 - cCE * (Math.pow(pressureRatio, 1 / gas.k) - 1));

  let leakPenaltyHE = 0;
  if (suctionValveFault === 'minor_leak') leakPenaltyHE += 14;
  if (suctionValveFault === 'severe_leak') leakPenaltyHE += 38;
  if (dischargeValveFault === 'minor_leak') leakPenaltyHE += 18;
  if (dischargeValveFault === 'severe_leak') leakPenaltyHE += 44;
  if (pistonRingCondition === 'worn_blowby') leakPenaltyHE += 12;
  if (pistonRingCondition === 'severe_blowby') leakPenaltyHE += 26;

  const headEndVolumetricEfficiencyPercent = Math.max(
    5,
    Math.min(96, theoreticalEtaV_HE - leakPenaltyHE)
  );
  const crankEndVolumetricEfficiencyPercent = Math.max(
    5,
    Math.min(96, theoreticalEtaV_CE - leakPenaltyHE * 0.9)
  );

  const effectiveVolumetricEfficiencyPercent =
    cylinderAction === 'double_acting'
      ? (headEndVolumetricEfficiencyPercent + crankEndVolumetricEfficiencyPercent) / 2
      : cylinderAction === 'single_acting_ce'
      ? crankEndVolumetricEfficiencyPercent
      : headEndVolumetricEfficiencyPercent;

  // Mass Flow Rate (kg/h) and Standard Flow (Nm3/h)
  // Suction density rho = (P_s * M_w) / (Z * R_u * T)
  const rhoSuctKgM3 =
    (suctionPressureBarA * 1e5 * (gas.mw / 1000)) /
    (gas.z * 8.314 * T_suct_K);

  const totalSweptVolM3Rev =
    cylinderAction === 'double_acting'
      ? sweptVolHE_m3 + sweptVolCE_m3
      : cylinderAction === 'single_acting_ce'
      ? sweptVolCE_m3
      : sweptVolHE_m3;

  const actualIntakeM3Hr =
    totalSweptVolM3Rev *
    (crankSpeedRpm * 60) *
    (effectiveVolumetricEfficiencyPercent / 100);

  const massFlowRateKgHr = actualIntakeM3Hr * rhoSuctKgM3;
  // Standard condition: 1.01325 bar, 0 °C (273.15 K), rho_std = (101325 * mw / 1000) / (8.314 * 273.15)
  const rhoStdKgM3 = (101325 * (gas.mw / 1000)) / (8.314 * 273.15);
  const standardVolumeFlowNm3Hr = massFlowRateKgHr / Math.max(0.01, rhoStdKgM3);

  // Rod Load Reversal API 618 Analysis
  // API 618 5th Ed 6.1.3: Continuous rod load reversal of >= 15° crank angle and >= 3% peak load
  const angleStep = 360 / totalSteps;
  const reversalDegreesTension = positiveLoadAngleCount * angleStep;
  const reversalDegreesCompression = negativeLoadAngleCount * angleStep;
  const rodLoadReversalDegrees = Math.min(reversalDegreesTension, reversalDegreesCompression);

  const peakSpanKn = Math.abs(maxTensionRodLoadKn) + Math.abs(maxCompressionRodLoadKn);
  const minLoadMagnitudeKn = Math.min(Math.abs(maxTensionRodLoadKn), Math.abs(maxCompressionRodLoadKn));
  const reversalPercentOfPeak = peakSpanKn > 0 ? (minLoadMagnitudeKn / peakSpanKn) * 100 : 0;

  const hasAdequateRodLoadReversal =
    rodLoadReversalDegrees >= 15 && reversalPercentOfPeak >= 3.0;

  const tensionLoadUtilizationPercent = Math.min(
    150,
    (Math.abs(maxTensionRodLoadKn) / Math.max(1, rodLoadTensionLimitKn)) * 100
  );
  const compressionLoadUtilizationPercent = Math.min(
    150,
    (Math.abs(maxCompressionRodLoadKn) / Math.max(1, rodLoadCompressionLimitKn)) * 100
  );

  // API 688 Acoustic Pulsation & Surge Bottles Calculation
  // Helmholtz bottle natural frequency:
  // f_h = (c / (2*pi)) * sqrt( A_choke / (V_bottle * L_effective) )
  const bottleVolM3 = damperVolumeLiters / 1000;
  const chokeAreaM2 = (Math.PI / 4) * Math.pow(chokeTubeDiameterMm / 1000, 2);
  const chokeLenEffectiveM = (chokeTubeLengthMm / 1000) + 0.8 * (chokeTubeDiameterMm / 1000);

  const helmholtzResonanceHz = hasPulsationBottles
    ? (acousticSpeedOfSoundMs / (2 * Math.PI)) *
      Math.sqrt(chokeAreaM2 / Math.max(0.001, bottleVolM3 * chokeLenEffectiveM))
    : 0;

  // Quarter-wave piping acoustic resonance to first elbow / boundary: f = c / (4 * L)
  const pipingAcousticResonanceHz =
    acousticSpeedOfSoundMs / Math.max(0.1, 4 * pipingLengthToFirstElbowM);

  // API 618 Design Approach 3 Allowable Peak-to-Peak Pulsation:
  // P1_allowable (%) = 300 / sqrt( P_line_bar * D_pipe_id_mm * f )
  const pipeIdMm = 150; // typical 6" Sch 40
  const f_dominant = runningFreqHz * 2; // 2X is primary harmonic for double acting
  const api618AllowablePulsationPercent = Math.min(
    7.0,
    Math.max(1.2, 300 / Math.sqrt(dischargePressureBarA * pipeIdMm * f_dominant))
  );

  // Calculate Harmonics (1X to 6X)
  const harmonics: HarmonicOrder[] = [];
  let maxPulsationPercentOfLine = 0;

  for (let order = 1; order <= 6; order++) {
    const f_hz = runningFreqHz * order;
    const apiLimit = Math.min(
      8.0,
      Math.max(1.0, 300 / Math.sqrt(dischargePressureBarA * pipeIdMm * f_hz))
    );

    // Base pulse amplitude generated by cylinder slug ejection
    // For double-acting cylinders, 180° phase opposition between HE and CE cancels odd harmonics (1X, 3X, 5X),
    // leaving primarily 2X and even harmonic pulses with only residual odd harmonic asymmetry from the rod area.
    let baseRaw = 10;
    if (cylinderAction === 'double_acting') {
      baseRaw = order % 2 === 0 ? 14 : 3.5;
    } else {
      baseRaw = order === 1 ? 12 : 8;
    }
    let rawPulse = baseRaw / Math.pow(order, 0.75);

    if (hasPulsationBottles) {
      // Attenuation by low-pass acoustic bottle filter
      // Transmission loss: TL ~ (f / f_h)^2
      const acousticFreqRatio = f_hz / Math.max(1, helmholtzResonanceHz);
      const attenuation = Math.max(1.5, Math.pow(acousticFreqRatio, 1.8));
      rawPulse /= attenuation;

      // Resonance check: if f_hz matches Helmholtz bottle frequency within 15%
      if (Math.abs(f_hz - helmholtzResonanceHz) / helmholtzResonanceHz < 0.15) {
        rawPulse *= 2.8; // Acoustic amplification!
      }
    } else {
      // Without bottles, severe pulsation throughout piping
      rawPulse *= 1.8;
    }

    // Check piping acoustic resonance overlap
    if (Math.abs(f_hz - pipingAcousticResonanceHz) / pipingAcousticResonanceHz < 0.12) {
      rawPulse *= 2.5; // Standing wave acoustic magnification
    }

    const pulsePercent = Number(rawPulse.toFixed(2));
    if (pulsePercent > maxPulsationPercentOfLine) maxPulsationPercentOfLine = pulsePercent;

    harmonics.push({
      order,
      frequencyHz: Number(f_hz.toFixed(1)),
      pressurePulsationPercent: pulsePercent,
      api618AllowablePercent: Number(apiLimit.toFixed(2)),
      isExceeded: pulsePercent > apiLimit,
    });
  }

  const isAcousticPulsationCompliant = maxPulsationPercentOfLine <= api618AllowablePulsationPercent;

  // Fault Diagnostics and Health Status
  const detectedFaults: string[] = [];
  const recommendations: string[] = [];

  if (suctionValveFault !== 'normal') {
    detectedFaults.push(`Suction Valve Degradation: ${suctionValveFault.toUpperCase().replace(/_/g, ' ')}`);
    recommendations.push('Inspect suction valve plate, springs, and seat for unloader fatigue or broken elements.');
  }

  if (dischargeValveFault !== 'normal') {
    detectedFaults.push(`Discharge Valve Degradation: ${dischargeValveFault.toUpperCase().replace(/_/g, ' ')}`);
    recommendations.push('Replace discharge valve assembly; check for high-temperature carbonization and spring guide wear.');
  }

  if (pistonRingCondition !== 'good') {
    detectedFaults.push(`Piston Ring Blow-By: ${pistonRingCondition.toUpperCase().replace(/_/g, ' ')}`);
    recommendations.push('Inspect cylinder liner for bore out-of-roundness and replace PTFE / PEEK piston rings and rider bands.');
  }

  if (!hasAdequateRodLoadReversal) {
    detectedFaults.push('API 618 Rod Load Reversal Failure (< 15° crank reversal or < 3% load reversal)');
    recommendations.push('DANGER: Wrist pin bushing oil film starvation imminent! Adjust suction/discharge pressures or clearance pockets.');
  }

  if (tensionLoadUtilizationPercent > 100 || compressionLoadUtilizationPercent > 100) {
    detectedFaults.push('API 618 Combined Rod Load Rating Exceeded');
    recommendations.push('DANGER: Risk of fatigue fracture of crosshead extension or piston rod thread! Reduce differential pressure.');
  }

  if (!isAcousticPulsationCompliant) {
    detectedFaults.push(`Acoustic Pulsation Exceeds API 618 Limit (${maxPulsationPercentOfLine.toFixed(1)}% vs ${api618AllowablePulsationPercent.toFixed(1)}% allowable)`);
    recommendations.push('Optimize surge bottle internal baffle choke tube dimensions per API 688 Acoustic Study.');
  }

  let healthScore = 100;
  if (!hasAdequateRodLoadReversal) healthScore -= 35;
  if (tensionLoadUtilizationPercent > 100 || compressionLoadUtilizationPercent > 100) healthScore -= 30;
  if (suctionValveFault === 'severe_leak' || dischargeValveFault === 'severe_leak') healthScore -= 25;
  else if (suctionValveFault !== 'normal' || dischargeValveFault !== 'normal') healthScore -= 12;
  if (pistonRingCondition === 'severe_blowby') healthScore -= 20;
  else if (pistonRingCondition !== 'good') healthScore -= 10;
  if (!isAcousticPulsationCompliant) healthScore -= 15;
  healthScore = Math.max(10, Math.min(100, healthScore));

  let statusLevel: 'safe' | 'warning' | 'critical' = 'safe';
  let statusLabel = 'HEALTHY & WITHIN CRITERIA';
  let statusMessage = 'Cylinder thermodynamic cycle, valve sealing, rod load reversal, and pulsation dampers are fully satisfactory.';

  if (healthScore < 50 || !hasAdequateRodLoadReversal || tensionLoadUtilizationPercent > 100 || compressionLoadUtilizationPercent > 100) {
    statusLevel = 'critical';
    statusLabel = 'CRITICAL LIMIT EXCEEDED';
    statusMessage = 'Machine is operating in a high-risk regime with danger of rod fracture, crosshead pin seizure, or severe valve breakdown.';
  } else if (healthScore < 80) {
    statusLevel = 'warning';
    statusLabel = 'PERFORMANCE DEGRADATION / ALARM';
    statusMessage = 'Internal leakage or elevated acoustic pulsations detected on indicator card. Maintenance intervention advised.';
  }

  const auditTrail = [
    {
      parameter: 'API 618 Crank Angle of Rod Load Reversal',
      equation: 'θ_rev = count(F_combined > 0) × Δθ ≥ 15°',
      calculatedValue: `${rodLoadReversalDegrees.toFixed(1)}° (${reversalPercentOfPeak.toFixed(1)}% peak span)`,
      referenceStandard: 'API 618 Clause 6.1.3 (Crosshead Pin Lubrication)',
      status: hasAdequateRodLoadReversal ? ('pass' as const) : ('fail' as const),
    },
    {
      parameter: 'Combined Piston Rod Tension Load',
      equation: 'F_comb = F_gas(θ) + F_inertia(θ) ≤ F_rod_limit',
      calculatedValue: `${maxTensionRodLoadKn.toFixed(1)} kN (${tensionLoadUtilizationPercent.toFixed(1)}% limit)`,
      referenceStandard: 'API 618 Clause 6.1.2 (Piston Rod Load Rating)',
      status: tensionLoadUtilizationPercent <= 100 ? ('pass' as const) : ('fail' as const),
    },
    {
      parameter: 'API 688 Piping Peak-to-Peak Acoustic Pulsation',
      equation: 'P_1(%) ≤ 300 / sqrt(P_line × D_id × f)',
      calculatedValue: `${maxPulsationPercentOfLine.toFixed(2)}% (Allowable: ${api618AllowablePulsationPercent.toFixed(2)}%)`,
      referenceStandard: 'API 618 Clause 7.9.4.2.5.2.2 / API 688 Design Approach 3',
      status: isAcousticPulsationCompliant ? ('pass' as const) : ('fail' as const),
    },
    {
      parameter: 'Effective Volumetric Efficiency & Flow Delivery',
      equation: 'η_v = 1 - c·[(P_d/P_s)^(1/k) - 1] - Δ_leak',
      calculatedValue: `${effectiveVolumetricEfficiencyPercent.toFixed(1)}% (Delivery: ${Math.round(massFlowRateKgHr)} kg/h)`,
      referenceStandard: 'ASME PTC 10 / ISO 13631 Reciprocating Gas Compressors',
      status: effectiveVolumetricEfficiencyPercent > 50 ? ('pass' as const) : ('warning' as const),
    },
    {
      parameter: 'Discharge Gas Temperature',
      equation: 'T_d = T_s·(P_d/P_s)^((k-1)/k) + ΔT_valve_churn',
      calculatedValue: `${actualDischargeTempC.toFixed(1)} °C (Theo: ${theoreticalDischargeTempK - 273.15 > 0 ? (theoreticalDischargeTempK - 273.15).toFixed(1) : 0} °C)`,
      referenceStandard: 'API 618 Maximum Discharge Temperature Limit (150°C)',
      status: actualDischargeTempC <= 150 ? ('pass' as const) : ('fail' as const),
    },
  ];

  return {
    pressureRatio: Number(pressureRatio.toFixed(2)),
    headEndVolumetricEfficiencyPercent: Number(headEndVolumetricEfficiencyPercent.toFixed(1)),
    crankEndVolumetricEfficiencyPercent: Number(crankEndVolumetricEfficiencyPercent.toFixed(1)),
    effectiveVolumetricEfficiencyPercent: Number(effectiveVolumetricEfficiencyPercent.toFixed(1)),
    theoreticalDischargeTempC: Number((theoreticalDischargeTempK - 273.15).toFixed(1)),
    actualDischargeTempC: Number(actualDischargeTempC.toFixed(1)),
    massFlowRateKgHr: Number(massFlowRateKgHr.toFixed(1)),
    standardVolumeFlowNm3Hr: Number(standardVolumeFlowNm3Hr.toFixed(1)),
    indicatedPowerKw: Number(indicatedPowerKw.toFixed(1)),
    brakePowerKw: Number(brakePowerKw.toFixed(1)),

    maxTensionRodLoadKn: Number(maxTensionRodLoadKn.toFixed(1)),
    maxCompressionRodLoadKn: Number(maxCompressionRodLoadKn.toFixed(1)),
    tensionLoadUtilizationPercent: Number(tensionLoadUtilizationPercent.toFixed(1)),
    compressionLoadUtilizationPercent: Number(compressionLoadUtilizationPercent.toFixed(1)),
    rodLoadReversalDegrees: Number(rodLoadReversalDegrees.toFixed(1)),
    reversalPercentOfPeak: Number(reversalPercentOfPeak.toFixed(1)),
    hasAdequateRodLoadReversal,

    acousticSpeedOfSoundMs: Number(acousticSpeedOfSoundMs.toFixed(1)),
    helmholtzResonanceHz: Number(helmholtzResonanceHz.toFixed(1)),
    pipingAcousticResonanceHz: Number(pipingAcousticResonanceHz.toFixed(1)),
    maxPulsationPercentOfLine: Number(maxPulsationPercentOfLine.toFixed(2)),
    api618AllowablePulsationPercent: Number(api618AllowablePulsationPercent.toFixed(2)),
    isAcousticPulsationCompliant,
    harmonics,

    pvCurvePoints: pvPoints,

    status: {
      level: statusLevel,
      label: statusLabel,
      message: statusMessage,
      score: healthScore,
    },
    detectedFaults,
    recommendations,
    auditTrail,
  };
}
