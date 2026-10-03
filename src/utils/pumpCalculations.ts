import { PumpInputs, PumpOutputs } from '../types/pump';
import { getFluidDensityKgM3, getVaporPressureKPa, getFluidViscosityCP, FLUID_DATABASE } from './fluidProperties';
import { AuditStep, StatusAssessment } from '../types/common';

const G = 9.80665; // m/s^2

export function calculatePump(inputs: PumpInputs): PumpOutputs {
  const auditTrail: AuditStep[] = [];

  // 1. Fluid Physical Properties
  const density = inputs.customDensityKgM3 && inputs.customDensityKgM3 > 0
    ? inputs.customDensityKgM3
    : getFluidDensityKgM3(inputs.fluidId, inputs.fluidTempC);

  const vaporPressureKPa = inputs.customVaporPressureKPa !== undefined && inputs.customVaporPressureKPa >= 0
    ? inputs.customVaporPressureKPa
    : getVaporPressureKPa(inputs.fluidId, inputs.fluidTempC);

  const viscosityCP = inputs.customViscosityCP && inputs.customViscosityCP > 0
    ? inputs.customViscosityCP
    : getFluidViscosityCP(inputs.fluidId, inputs.fluidTempC);
  const viscosityPaS = viscosityCP * 0.001; // Pa·s = kg/(m·s)

  auditTrail.push({
    title: 'Fluid Thermodynamic State',
    standardRef: 'IAPWS / Antoine Correlation / Hydraulic Institute',
    formula: 'P_{vap} = f(T), \\; \\rho = f(T), \\; \\mu = f(T)',
    substituted: `Fluid: ${FLUID_DATABASE[inputs.fluidId]?.name || 'Custom Fluid'}, Temp = ${inputs.fluidTempC}°C`,
    result: `ρ = ${density.toFixed(1)} kg/m³, P_vap = ${vaporPressureKPa.toFixed(2)} kPa abs, µ = ${viscosityCP.toFixed(2)} cP`,
    unit: 'Thermodynamics',
  });

  // 2. Suction Piping Velocity and Flow
  const diameterM = Math.max(0.01, inputs.pipeDiameterMm / 1000);
  const flowM3s = Math.max(0, inputs.flowRateM3h) / 3600;
  const pipeAreaM2 = (Math.PI / 4) * Math.pow(diameterM, 2);
  const velocityMs = pipeAreaM2 > 0 ? flowM3s / pipeAreaM2 : 0;

  auditTrail.push({
    title: 'Suction Line Fluid Velocity',
    standardRef: 'API 610 §6.1.13 / Hydraulic Institute',
    formula: 'V = \\frac{Q}{A} = \\frac{Q / 3600}{\\pi \\cdot D^2 / 4}',
    substituted: `Q = ${inputs.flowRateM3h.toFixed(1)} m³/h, D = ${inputs.pipeDiameterMm} mm (${diameterM.toFixed(3)} m)`,
    result: `${velocityMs.toFixed(2)}`,
    unit: 'm/s',
    note: velocityMs > 2.2 ? 'Warning: Suction velocity exceeds recommended API 610 1.0-2.0 m/s limit.' : undefined,
  });

  // 3. Reynolds Number and Darcy-Weisbach Friction Factor
  const reynoldsNumber = viscosityPaS > 0 ? (density * velocityMs * diameterM) / viscosityPaS : 1e6;
  const relativeRoughness = (inputs.pipeRoughnessMm / 1000) / diameterM;

  let frictionFactor = 0.02;
  if (reynoldsNumber < 2300) {
    frictionFactor = reynoldsNumber > 0 ? 64 / reynoldsNumber : 0.04;
  } else {
    // Swamee-Jain explicit equation for Darcy friction factor
    const term1 = relativeRoughness / 3.7;
    const term2 = 5.74 / Math.pow(Math.max(1, reynoldsNumber), 0.9);
    frictionFactor = 0.25 / Math.pow(Math.log10(term1 + term2), 2);
  }

  // 4. Suction Line Head Losses
  const velocityHeadM = Math.pow(velocityMs, 2) / (2 * G);
  const foulingMultiplier = Math.max(1.0, inputs.foulingFactor || 1.0);
  const pipeFrictionHeadLossM = frictionFactor * (inputs.pipeLengthM / diameterM) * velocityHeadM * foulingMultiplier;

  // Minor Loss Coefficients Sum
  let fittingsMinorLossM = 0;
  let sumK = 0;

  if (inputs.useSimplifiedEquivLength && inputs.equivalentLengthM && inputs.equivalentLengthM > 0) {
    fittingsMinorLossM = frictionFactor * (inputs.equivalentLengthM / diameterM) * velocityHeadM * foulingMultiplier;
    sumK = frictionFactor * (inputs.equivalentLengthM / diameterM);
  } else {
    const f = inputs.fittings;
    sumK += (f.standard90Elbow || 0) * 0.75;
    sumK += (f.longRadius90Elbow || 0) * 0.45;
    const valveOpening = inputs.valveOpeningPercent !== undefined ? Math.max(5, Math.min(100, inputs.valveOpeningPercent)) : 100;
    // Valve throttling K: Crane TP 410 approximation for gate/butterfly valve throttling
    let valveK = 0.17;
    if (valveOpening < 100) {
      // Exponential rise in K as valve throttles: 100% -> 0.17, 50% -> 3.5, 25% -> 24, 10% -> 95
      valveK = 0.17 + 85 * Math.pow((100 - valveOpening) / 90, 2.5);
    }
    sumK += (f.gateValveOpen || 1) * valveK;
    sumK += (f.butterflyValve || 0) * (valveOpening < 100 ? valveK * 1.5 : 0.60);
    sumK += (f.swingCheckValve || 0) * 2.00;
    
    // Strainer fouling K: clean basket K=1.5, fouled K can reach 8-25 depending on fouling factor
    const strainerBaseK = 1.50 * (inputs.foulingFactor ? Math.pow(inputs.foulingFactor, 2.2) : 1.0);
    sumK += (f.suctionStrainer || 1) * strainerBaseK;
    sumK += (f.teeFlowThrough || 0) * 0.40;
    sumK += (f.teeBranchFlow || 0) * 1.20;

    if (f.entranceLoss === 'sharp') sumK += 0.50;
    else if (f.entranceLoss === 'radiused') sumK += 0.05;
    else if (f.entranceLoss === 'reentrant') sumK += 0.80;

    // Reducer loss if diameter change at pump suction flange
    if (inputs.pipeDiameterChangeMm && inputs.pipeDiameterChangeMm > 0 && inputs.pipeDiameterChangeMm < inputs.pipeDiameterMm) {
      const dRatio = inputs.pipeDiameterChangeMm / inputs.pipeDiameterMm;
      const kReducer = 0.5 * (1 - Math.pow(dRatio, 2));
      sumK += kReducer;
    }

    fittingsMinorLossM = sumK * velocityHeadM;
  }

  const totalSuctionHeadLossM = pipeFrictionHeadLossM + fittingsMinorLossM;

  auditTrail.push({
    title: 'Suction Head Loss (Darcy-Weisbach + Minor Losses)',
    standardRef: 'Hydraulic Institute Engineering Data Book / Crane TP 410',
    formula: 'h_{loss} = \\left(f \\cdot \\frac{L}{D} \\cdot FF + \\sum K\\right) \\cdot \\frac{V^2}{2g}',
    substituted: `f = ${frictionFactor.toFixed(4)}, Re = ${reynoldsNumber.toFixed(0)}, L = ${inputs.pipeLengthM}m, FF = ${foulingMultiplier.toFixed(2)}, ΣK = ${sumK.toFixed(2)}, V²/2g = ${velocityHeadM.toFixed(3)}m`,
    result: `${totalSuctionHeadLossM.toFixed(2)} m (Pipe: ${pipeFrictionHeadLossM.toFixed(2)}m + Fittings: ${fittingsMinorLossM.toFixed(2)}m)`,
    unit: 'm',
  });

  // 5. Suction Vessel Pressure & Static Head
  const atmosphericPressureKPa = inputs.atmosphericPressureKPa || 101.325;
  const atmosphericHeadM = (atmosphericPressureKPa * 1000) / (density * G);

  let vesselGaugeKPa = 0;
  if (inputs.suctionSourceType === 'pressurized_vessel') {
    vesselGaugeKPa = inputs.tankPressureKPag || 0;
  } else if (inputs.suctionSourceType === 'open_tank' || inputs.suctionSourceType === 'suction_lift' || inputs.suctionSourceType === 'flooded_suction') {
    vesselGaugeKPa = 0;
  }

  const vesselPressureHeadM = (vesselGaugeKPa * 1000) / (density * G);
  const absoluteSourceHeadM = atmosphericHeadM + vesselPressureHeadM;
  const staticSuctionHeadM = inputs.staticHeadM;
  const vaporPressureHeadM = (vaporPressureKPa * 1000) / (density * G);

  // 6. Net Positive Suction Head Available (NPSHa)
  // NPSHa = (P_source,abs - P_vap)/(rho*g) + Z_static - h_loss
  const npshaM = Math.max(0, absoluteSourceHeadM + staticSuctionHeadM - totalSuctionHeadLossM - vaporPressureHeadM);

  // Pressure at suction flange (gauge)
  const suctionFlangeHeadM = absoluteSourceHeadM + staticSuctionHeadM - totalSuctionHeadLossM;
  const suctionFlangeAbsKPa = (suctionFlangeHeadM * density * G) / 1000;
  const suctionFlangePressureKPag = suctionFlangeAbsKPa - atmosphericPressureKPa;
  const absoluteSuctionHeadM = suctionFlangeHeadM;

  auditTrail.push({
    title: 'Net Positive Suction Head Available (NPSHa)',
    standardRef: 'API 610 12th Ed §6.1.8 / HI 9.6.1',
    formula: 'NPSHa = \\frac{P_{source,abs} - P_{vap}}{\\rho \\cdot g} + Z_{static} - h_{loss}',
    substituted: `P_source,abs = ${(atmosphericPressureKPa + vesselGaugeKPa).toFixed(1)} kPa (${absoluteSourceHeadM.toFixed(2)}m), P_vap = ${vaporPressureKPa.toFixed(2)} kPa (${vaporPressureHeadM.toFixed(2)}m), Z = ${staticSuctionHeadM.toFixed(2)}m, h_loss = ${totalSuctionHeadLossM.toFixed(2)}m`,
    result: `${npshaM.toFixed(2)}`,
    unit: 'm',
  });

  // 7. NPSHr Calculation (Single value or curve interpolation)
  const flowRatio = inputs.bepFlowM3h > 0 ? inputs.flowRateM3h / inputs.bepFlowM3h : 1;
  let npshrM = 3.0;

  if (inputs.npshrInputMode === 'curve_table' && inputs.npshrCurvePoints && inputs.npshrCurvePoints.length >= 2) {
    const sorted = [...inputs.npshrCurvePoints].sort((a, b) => a.flowM3h - b.flowM3h);
    const q = inputs.flowRateM3h;
    if (q <= sorted[0].flowM3h) {
      npshrM = sorted[0].npshrM;
    } else if (q >= sorted[sorted.length - 1].flowM3h) {
      npshrM = sorted[sorted.length - 1].npshrM;
    } else {
      // Piecewise linear interpolation
      for (let i = 0; i < sorted.length - 1; i++) {
        if (q >= sorted[i].flowM3h && q <= sorted[i + 1].flowM3h) {
          const frac = (q - sorted[i].flowM3h) / (sorted[i + 1].flowM3h - sorted[i].flowM3h);
          npshrM = sorted[i].npshrM + frac * (sorted[i + 1].npshrM - sorted[i].npshrM);
          break;
        }
      }
    }
  } else {
    // Standard Hydraulic Institute power law curve
    npshrM = Math.max(0.5, inputs.npshr3percentM * (0.4 + 0.6 * Math.pow(Math.max(0.01, flowRatio), 1.8)));
  }

  // 8. Safety Margin & Margins Logic
  // Default: larger of 1.0 m or 10% of NPSHr
  let requiredSafetyMarginM = Math.max(1.0, npshrM * 0.10);
  let recommendedMarginRatio = 1 + requiredSafetyMarginM / Math.max(0.1, npshrM);

  if (inputs.safetyMarginType === 'conservative') {
    requiredSafetyMarginM = Math.max(1.5, npshrM * 0.30);
    recommendedMarginRatio = 1.30;
  } else if (inputs.safetyMarginType === 'custom' && inputs.customSafetyMarginM !== undefined) {
    requiredSafetyMarginM = Math.max(0.1, inputs.customSafetyMarginM);
    recommendedMarginRatio = 1 + requiredSafetyMarginM / Math.max(0.1, npshrM);
  }

  const recommendedExcessHeadM = requiredSafetyMarginM;
  const npshMarginM = npshaM - npshrM;
  const npshExcessM = npshMarginM;
  const npshMarginRatio = npshrM > 0 ? npshaM / npshrM : 0;

  // 9. Suction Specific Speed (Nss)
  const bepFlowM3s = inputs.bepFlowM3h / 3600;
  const bepFlowGpm = inputs.bepFlowM3h * 4.40287;
  const npshrBepFt = inputs.npshr3percentM * 3.28084;

  const nssMetric = inputs.npshr3percentM > 0
    ? (inputs.pumpSpeedRpm * Math.sqrt(bepFlowM3s)) / Math.pow(inputs.npshr3percentM, 0.75)
    : 150;
  const nssUS = npshrBepFt > 0
    ? (inputs.pumpSpeedRpm * Math.sqrt(bepFlowGpm)) / Math.pow(npshrBepFt, 0.75)
    : 8000;

  // 10. Head Curve Point Calculation with ANSI/HI 9.6.7 Viscous Correction
  const shutOffHeadM = inputs.shutOffHeadM || (inputs.ratedHeadM * 1.2);
  const uncorrectedOperatingHeadM = Math.max(0, shutOffHeadM - (shutOffHeadM - inputs.ratedHeadM) * Math.pow(flowRatio, 2));

  // Kinematic Viscosity ν = µ / SG (cSt)
  const specificGravity = Math.max(0.6, density / 1000);
  const kinematicViscosityCSt = viscosityCP / specificGravity;
  
  // ANSI/HI 9.6.7 generalized viscous derating parameter B
  // B = 16.5 * (nu^0.5 * H_bep^0.25) / (Q_bep^0.5 * N^0.25) [with Q in gpm, H in ft, N in rpm]
  const bepFlowGpmForVisc = Math.max(10, (inputs.bepFlowM3h || 100) * 4.40287);
  const bepHeadFtForVisc = Math.max(5, (inputs.ratedHeadM || 50) * 3.28084);
  const speedForVisc = Math.max(500, inputs.pumpSpeedRpm || 2950);

  let paramB = (16.5 * Math.sqrt(Math.max(1, kinematicViscosityCSt)) * Math.pow(bepHeadFtForVisc, 0.25)) /
               (Math.sqrt(bepFlowGpmForVisc) * Math.pow(speedForVisc, 0.25));

  let CH = 1.0;
  let CQ = 1.0;
  let Ceta = 1.0;
  const isViscousCorrected = kinematicViscosityCSt > 5.0 && paramB > 1.0;

  if (isViscousCorrected) {
    const logB = Math.log10(paramB);
    CQ = Math.max(0.35, Math.min(1.0, Math.exp(-0.165 * Math.pow(logB, 3.15))));
    CH = Math.max(0.40, Math.min(1.0, Math.exp(-0.080 * Math.pow(logB, 3.15))));
    Ceta = Math.max(0.20, Math.min(1.0, Math.exp(-0.250 * Math.pow(logB, 2.80))));

    auditTrail.push({
      title: 'Viscous Liquid Performance Derating (ANSI/HI 9.6.7)',
      standardRef: 'ANSI/HI 9.6.7-2021 §4.2 (Viscous Effects on Rotodynamic Pumps)',
      formula: 'B = \\frac{16.5 \\cdot \\nu^{0.5} \\cdot H_{BEP}^{0.25}}{Q_{BEP}^{0.5} \\cdot N^{0.25}}, \\quad C_H = e^{-0.080(\\log B)^{3.15}}, \\quad C_Q = e^{-0.165(\\log B)^{3.15}}',
      substituted: `ν = ${kinematicViscosityCSt.toFixed(1)} cSt (µ = ${viscosityCP.toFixed(1)} cP), Parameter B = ${paramB.toFixed(2)}, Q_BEP = ${bepFlowGpmForVisc.toFixed(0)} GPM, H_BEP = ${bepHeadFtForVisc.toFixed(1)} ft`,
      result: `C_H = ${CH.toFixed(3)} (${((1 - CH) * 100).toFixed(1)}% Head Derate), C_Q = ${CQ.toFixed(3)}, C_η = ${Ceta.toFixed(3)}`,
      unit: 'Correction Factors',
      note: 'Impeller hydraulic friction reduces developed head and flow for viscous media per Hydraulic Institute standards.',
    });
  }

  const operatingHeadM = uncorrectedOperatingHeadM * CH;

  // 11. Recirculation & Bubble Intensity
  const operatingPercentBEP = flowRatio * 100;
  const suctionRecirculationRisk = (operatingPercentBEP < 65 || operatingPercentBEP > 125) && nssUS > 10000;
  const dischargeRecirculationRisk = operatingPercentBEP < 50;

  // Cavitation risk score (0 - 100%)
  let cavitationRiskPercent = 0;
  if (npshMarginRatio < 0.95) {
    cavitationRiskPercent = 100;
  } else if (npshMarginRatio < 1.0) {
    cavitationRiskPercent = 90;
  } else if (npshMarginRatio < 1.0 + (requiredSafetyMarginM / npshrM) * 0.5) {
    cavitationRiskPercent = 65;
  } else if (npshMarginRatio < 1.0 + (requiredSafetyMarginM / npshrM)) {
    cavitationRiskPercent = 40;
  } else if (npshMarginRatio < 1.4) {
    cavitationRiskPercent = 15;
  } else {
    cavitationRiskPercent = 5;
  }

  const headTerm = Math.max(10, inputs.ratedHeadM) / 50;
  const deficitTerm = Math.max(0, 1.3 - npshMarginRatio);
  const bubbleCollapseIntensityScore = Math.min(100, Math.round(deficitTerm * 70 * headTerm + (cavitationRiskPercent > 60 ? 30 : 0)));

  // 12. Engineering Warnings & Recommendations
  const specificWarnings: string[] = [];
  const recommendedActions: string[] = [];

  if (npshaM <= npshrM) {
    specificWarnings.push('NPSHa is below NPSHr. Cavitation damage is likely.');
  } else if (npshaM < npshrM + requiredSafetyMarginM) {
    specificWarnings.push('Margin is below recommended safety margin.');
  }

  if (totalSuctionHeadLossM > 1.2 || velocityMs > 2.0) {
    specificWarnings.push('High suction friction loss detected.');
  }

  if (vaporPressureHeadM > absoluteSourceHeadM * 0.45 || (absoluteSourceHeadM - vaporPressureHeadM) < 2.0) {
    specificWarnings.push('Fluid vapor pressure is high relative to suction pressure.');
  }

  // Recommended actions tailored to root causes
  if (npshaM < npshrM + requiredSafetyMarginM) {
    if (staticSuctionHeadM < 3.0) {
      recommendedActions.push('Increase suction level / static liquid height above pump.');
    }
    if (totalSuctionHeadLossM > 0.4) {
      recommendedActions.push('Reduce suction pipe friction by shortening pipe run and cleaning lines.');
      recommendedActions.push('Increase pipe diameter to reduce fluid velocity and frictional head loss.');
    }
    if (sumK > 1.5) {
      recommendedActions.push('Reduce elbows/valves and install full-port isolation valves.');
    }
    if (inputs.fluidTempC > 40 || vaporPressureHeadM > 1.0) {
      recommendedActions.push('Reduce fluid temperature to suppress vapor pressure.');
    }
    if (inputs.suctionSourceType === 'pressurized_vessel' || vesselGaugeKPa < 100) {
      recommendedActions.push('Increase vessel pressure / pad gas pressure.');
    }
    if (npshrM > 3.0) {
      recommendedActions.push('Select pump with lower NPSHr or fit an impeller inducer.');
    }
    if (operatingPercentBEP > 105) {
      recommendedActions.push('Reduce flow rate closer to Best Efficiency Point (BEP).');
    }
  }

  // Fallback recommendations if list is empty
  if (recommendedActions.length === 0) {
    recommendedActions.push('Maintain clean suction strainers and monitor suction pressure transmitters.');
    recommendedActions.push('Ensure operating flow stays within the Preferred Operating Region (70% - 120% BEP).');
  }

  // 13. Status Logic
  let statusLevel: 'safe' | 'warning' | 'critical' = 'safe';
  let statusLabel = 'Safe — Within Hydraulic Margin';
  let statusMessage = `NPSHa (${npshaM.toFixed(2)}m) exceeds NPSHr (${npshrM.toFixed(2)}m) + safety margin (${requiredSafetyMarginM.toFixed(2)}m). Margin ratio is ${npshMarginRatio.toFixed(2)}x.`;
  let healthScore = 95;

  if (npshaM <= npshrM) {
    statusLevel = 'critical';
    statusLabel = 'Critical — Active Cavitation Imminent (NPSHa ≤ NPSHr)';
    statusMessage = `NPSHa (${npshaM.toFixed(2)}m) is less than or equal to NPSHr (${npshrM.toFixed(2)}m). Fluid is flashing to vapor at the impeller eye, causing severe cavitation pitting, vibration, and head drop.`;
    healthScore = 15;
  } else if (npshaM < npshrM + requiredSafetyMarginM) {
    statusLevel = 'warning';
    statusLabel = 'Warning — Narrow NPSH Margin';
    statusMessage = `NPSHa (${npshaM.toFixed(2)}m) exceeds NPSHr (${npshrM.toFixed(2)}m) by only ${npshMarginM.toFixed(2)}m, which is below the required safety margin of ${requiredSafetyMarginM.toFixed(2)}m. Incipient cavitation and long-term acoustic erosion risk.`;
    healthScore = 55;
  }

  const status: StatusAssessment = {
    level: statusLevel,
    score: healthScore,
    label: statusLabel,
    message: statusMessage,
    recommendations: recommendedActions,
  };

  // 14. Generate H-Q and NPSH Curve data points for interactive charts
  const maxFlowForChart = Math.max(inputs.bepFlowM3h * 1.5, inputs.flowRateM3h * 1.3, 10);
  const headCurveData: { flowM3h: number; headM: number }[] = [];
  const npshCurveData: {
    flowM3h: number;
    npshrM: number;
    npshaM: number;
    safeThresholdM: number;
  }[] = [];

  const steps = 30;
  for (let i = 0; i <= steps; i++) {
    const q = (maxFlowForChart * i) / steps;
    const qRatio = inputs.bepFlowM3h > 0 ? q / inputs.bepFlowM3h : 1;
    
    // Head curve (derated with CH if viscous)
    const h = Math.max(0, shutOffHeadM - (shutOffHeadM - inputs.ratedHeadM) * Math.pow(qRatio, 2)) * CH;
    headCurveData.push({ flowM3h: q, headM: h });

    // NPSHr at flow q
    const r = Math.max(0.5, inputs.npshr3percentM * (0.4 + 0.6 * Math.pow(Math.max(0.01, qRatio), 1.8)));

    // Friction loss scales with q^2
    const flowScale = inputs.flowRateM3h > 0 ? q / inputs.flowRateM3h : 0;
    const hLossAtQ = totalSuctionHeadLossM * Math.pow(flowScale, 2);
    const a = Math.max(0, absoluteSourceHeadM + staticSuctionHeadM - hLossAtQ - vaporPressureHeadM);

    const safeThresh = r + requiredSafetyMarginM;
    npshCurveData.push({
      flowM3h: q,
      npshrM: r,
      npshaM: a,
      safeThresholdM: safeThresh,
    });
  }

  return {
    fluidDensityKgM3: density,
    vaporPressureKPa,
    fluidViscosityCP: viscosityCP,
    fluidVelocityMs: velocityMs,
    reynoldsNumber,
    frictionFactor,
    pipeFrictionHeadLossM,
    fittingsMinorLossM,
    totalSuctionHeadLossM,
    suctionFlangePressureKPag,
    absoluteSuctionHeadM,
    atmosphericHeadM,
    vesselPressureHeadM,
    staticSuctionHeadM,
    vaporPressureHeadM,
    npshaM,
    npshrM,
    npshMarginM,
    npshMarginRatio,
    npshExcessM,
    requiredSafetyMarginM,
    recommendedMarginRatio,
    recommendedExcessHeadM,
    suctionSpecificSpeedMetric: nssMetric,
    suctionSpecificSpeedUS: nssUS,
    operatingPercentBEP,
    operatingHeadM,
    cavitationRiskPercent,
    bubbleCollapseIntensityScore,
    suctionRecirculationRisk,
    dischargeRecirculationRisk,
    viscousDeratingFactorHead_CH: CH,
    viscousDeratingFactorFlow_CQ: CQ,
    viscousDeratingFactorEfficiency_Ceta: Ceta,
    isViscousCorrected,
    specificWarnings,
    recommendedActions,
    headCurveData,
    npshCurveData,
    status,
    auditTrail,
  };
}
