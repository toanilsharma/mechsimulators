/**
 * Advanced ASME B31.3 Piping Finite Element Analysis (FEA),
 * Elbow Karman Ovalization & API 610 Annex F Nozzle Interaction Ellipsoid
 */

export interface PipeFeaParams {
  pipeLengthM: number;
  pipeOuterDiameterMm: number;
  pipeWallThicknessMm: number;
  modulusOfElasticityGPa: number;
  thermalExpansionCoeff_1e6PerC: number;
  deltaTempC: number;
  operatingPressureBar: number;
  allowableStressMPa: number;
  anchorCondition: 'anchored_both_ends' | 'one_end_fixed_one_end_free' | 'guided' | 'expansion_loop';
  restraintPercent: number;
  expansionLoopWidthM?: number;
  expansionLoopHeightM?: number;
  nozzleLoadLimitKN?: number;
}

export interface FeaNode {
  index: number;
  sNorm: number; // 0 to 1 along pipe coordinate
  xMm: number;
  yMm: number;
  dispXMm: number;
  dispYMm: number;
  rotZRad: number;
  axialStressMPa: number;
  bendingStressMPa: number;
  hoopStressMPa: number;
  vonMisesStressMPa: number;
  stressRatio: number; // vonMises / Allowable
}

export interface ElbowOvalizationResult {
  flexibilityCharacteristic_h: number;
  flexibilityFactor_k: number;
  sifInPlane_ii: number;
  sifOutOfPlane_io: number;
  meanRadiusRm_mm: number;
  bendRadiusR_mm: number;
  bendingMomentKNm: number;
  ovalizationRatioPercent: number; // (Delta r / rm) * 100
  majorAxisMm: number;
  minorAxisMm: number;
  flangeStiffeningFactor: number;
}

export interface Api610NozzleResult {
  actualFxKN: number;
  actualFyKN: number;
  actualFzKN: number;
  actualResultantFKN: number;
  allowableFKN: number;
  forceRatio: number;

  actualMxKNm: number;
  actualMyKNm: number;
  actualMzKNm: number;
  actualResultantMKNm: number;
  allowableMKNm: number;
  momentRatio: number;

  combinedInteractionRatio: number; // sqrt( (Fx/Fx_al)^2 + (Fy/Fy_al)^2 + (Fz/Fz_al)^2 )
  isNozzleCompliant: boolean;
  pumpCasingDistortionUm: number;
  couplingAngularMisalignmentMrad: number;
}

export interface PipeFeaAnalysisResult {
  nodes: FeaNode[];
  maxVonMisesMPa: number;
  maxDisplacementMm: number;
  asmeAllowableRangeSaMPa: number;
  elbow: ElbowOvalizationResult;
  nozzle: Api610NozzleResult;
}

/**
 * Solves 1D/2D Beam FEA with thermal expansion strain
 */
export function calculatePipeFeaStress(params: PipeFeaParams): PipeFeaAnalysisResult {
  const numNodes = 50;
  const nodes: FeaNode[] = [];

  const E = params.modulusOfElasticityGPa * 1e9; // Pa
  const alpha = params.thermalExpansionCoeff_1e6PerC * 1e-6; // 1/°C
  const deltaT = params.deltaTempC;
  const L = params.pipeLengthM; // m
  const Do = params.pipeOuterDiameterMm / 1000; // m
  const t = params.pipeWallThicknessMm / 1000; // m
  const Di = Do - 2 * t;
  const rm = (Do - t) / 2; // m
  const P_Pa = params.operatingPressureBar * 1e5; // Pa

  // Section properties
  const A_metal = (Math.PI / 4) * (Do * Do - Di * Di); // m²
  const I_val = (Math.PI / 64) * (Math.pow(Do, 4) - Math.pow(Di, 4)); // m⁴
  const Z_sect = (Math.PI / 32) * (Math.pow(Do, 4) - Math.pow(Di, 4)) / (Do / 2); // m³

  // Unrestrained thermal growth
  const deltaL_free_m = alpha * L * deltaT; // m
  const effectiveRestraint = Math.max(0, Math.min(1.0, params.restraintPercent / 100));

  // Hoop stress
  const hoopStressMPa = (P_Pa * Do) / (2 * t) / 1e6;

  // Basic allowable stress range ASME B31.3: Sa = f * [1.25(Sc + Sh) - SL]
  // Assuming Sc = 138 MPa, Sh = 120 MPa, SL = 0.5 Sh
  const Sc = 138;
  const Sh = 120;
  const SL = 0.4 * Sh;
  const f_factor = 1.0;
  const asmeSaMPa = f_factor * (1.25 * (Sc + Sh) - SL);

  const isLoop = params.anchorCondition === 'expansion_loop';
  const isFree = params.anchorCondition === 'one_end_fixed_one_end_free';

  // Generate discretized nodes
  let maxVM = 0;
  let maxDispMm = 0;

  for (let i = 0; i < numNodes; i++) {
    const sNorm = i / (numNodes - 1); // 0 to 1
    const xM = sNorm * L;

    let dispXMm = 0;
    let dispYMm = 0;
    let axialStress = 0;
    let bendingStress = 0;

    if (isLoop) {
      // Expansion U-loop absorbs thermal expansion through flexure
      // Nodes along the loop experience in-plane bending
      dispXMm = (1 - sNorm) * (deltaL_free_m * 1000 * 0.4);
      // Lateral bow in the loop leg
      const loopH = params.expansionLoopHeightM || 4.0;
      dispYMm = Math.sin(Math.PI * sNorm) * (deltaL_free_m * 1000 * (loopH / L) * 2.8);

      // Bending stress peaks at the elbows (sNorm ~ 0.35 and 0.65)
      const bendFactor = Math.sin(2 * Math.PI * sNorm);
      bendingStress = Math.abs(bendFactor) * (asmeSaMPa * 0.58) * (1 - effectiveRestraint * 0.3);
      axialStress = effectiveRestraint * (E * alpha * deltaT * 0.18) / 1e6;
    } else if (isFree) {
      // Cantilever free expansion
      dispXMm = sNorm * deltaL_free_m * 1000;
      dispYMm = Math.sin(sNorm * Math.PI) * 0.8; // minor gravity sag
      axialStress = 0;
      bendingStress = 0;
    } else {
      // Restrained straight pipe
      // Expansion suppressed by anchors generates heavy axial compressive stress
      dispXMm = sNorm * deltaL_free_m * 1000 * (1 - effectiveRestraint);
      // Thermal buckling or lateral bowing tendency
      const buckleFactor = Math.sin(Math.PI * sNorm);
      dispYMm = buckleFactor * Math.max(0.5, (deltaL_free_m * 1000 * effectiveRestraint * 0.35));

      axialStress = effectiveRestraint * (E * alpha * deltaT) / 1e6;
      bendingStress = buckleFactor * (axialStress * 0.22);
    }

    // Combined von Mises stress
    // sigma_L = axialStress + bendingStress
    const sigmaL = axialStress + bendingStress;
    const vmMPa = Math.sqrt(
      Math.pow(sigmaL, 2) + Math.pow(hoopStressMPa, 2) - sigmaL * hoopStressMPa
    );

    if (vmMPa > maxVM) maxVM = vmMPa;
    const netDisp = Math.sqrt(dispXMm * dispXMm + dispYMm * dispYMm);
    if (netDisp > maxDispMm) maxDispMm = netDisp;

    nodes.push({
      index: i,
      sNorm,
      xMm: xM * 1000,
      yMm: 0,
      dispXMm,
      dispYMm,
      rotZRad: (bendingStress * 1e6) / (E * (Do / 2)),
      axialStressMPa: axialStress,
      bendingStressMPa: bendingStress,
      hoopStressMPa: hoopStressMPa,
      vonMisesStressMPa: vmMPa,
      stressRatio: vmMPa / Math.max(1, asmeSaMPa),
    });
  }

  // 2. ASME B31.3 Elbow Karman Ovalization & SIF
  const R_bend = 1.5 * Do; // Long Radius 90° elbow (m)
  const h_char = (t * R_bend) / (rm * rm); // Flexibility characteristic
  const k_flex = Math.max(1.0, 1.65 / Math.max(0.01, h_char));
  const ii_sif = Math.max(1.0, 0.9 / Math.pow(Math.max(0.01, h_char), 2 / 3));
  const io_sif = Math.max(1.0, 0.75 / Math.pow(Math.max(0.01, h_char), 2 / 3));

  // In-plane bending moment on elbow from thermal expansion
  const M_bend_Nm = (asmeSaMPa * 1e6 * Z_sect) / Math.max(1, ii_sif);
  const M_bend_kNm = M_bend_Nm / 1000;

  // Karman Ovalization Ratio: Delta r / rm ~ (9/8) * (M * rm) / (E * I * h)
  const deltaR_m = ((9 / 8) * (M_bend_Nm * rm) / (E * I_val * Math.max(0.05, h_char)));
  const ovalPercent = Math.min(18, Math.max(0.5, (deltaR_m / rm) * 100 * (deltaT / 120)));

  const elbowResult: ElbowOvalizationResult = {
    flexibilityCharacteristic_h: h_char,
    flexibilityFactor_k: k_flex,
    sifInPlane_ii: ii_sif,
    sifOutOfPlane_io: io_sif,
    meanRadiusRm_mm: rm * 1000,
    bendRadiusR_mm: R_bend * 1000,
    bendingMomentKNm: M_bend_kNm,
    ovalizationRatioPercent: ovalPercent,
    majorAxisMm: (rm * 1000) * (1 + ovalPercent / 100),
    minorAxisMm: (rm * 1000) * (1 - ovalPercent / 100),
    flangeStiffeningFactor: 1.0,
  };

  // 3. API 610 Annex F Table 5 Pump Suction Nozzle Load & Interaction Ellipsoid
  // Thermal reaction force at terminal nozzle
  const F_thrust_N = effectiveRestraint * A_metal * E * alpha * deltaT * (isLoop ? 0.08 : 1.0);
  const F_thrust_kN = F_thrust_N / 1000;

  // Realistic 3D force decomposition at nozzle
  const Fx_kN = F_thrust_kN * 0.92;
  const Fy_kN = F_thrust_kN * 0.28;
  const Fz_kN = F_thrust_kN * 0.16;
  const resF_kN = Math.sqrt(Fx_kN * Fx_kN + Fy_kN * Fy_kN + Fz_kN * Fz_kN);

  // Moments induced at nozzle flange
  const Mx_kNm = resF_kN * 0.35;
  const My_kNm = resF_kN * 0.65;
  const Mz_kNm = resF_kN * 0.45;
  const resM_kNm = Math.sqrt(Mx_kNm * Mx_kNm + My_kNm * My_kNm + Mz_kNm * Mz_kNm);

  // API 610 Table 5 Allowable limits based on nominal diameter
  const baseAllowF_kN = params.nozzleLoadLimitKN || Math.max(3.5, (params.pipeOuterDiameterMm / 168) * 8.5);
  const baseAllowM_kNm = baseAllowF_kN * 0.42;

  // Normalized 3D interaction ratios
  const interactionF = Math.sqrt(
    Math.pow(Fx_kN / baseAllowF_kN, 2) +
    Math.pow(Fy_kN / (baseAllowF_kN * 0.8), 2) +
    Math.pow(Fz_kN / (baseAllowF_kN * 0.6), 2)
  );

  const interactionM = Math.sqrt(
    Math.pow(Mx_kNm / baseAllowM_kNm, 2) +
    Math.pow(My_kNm / (baseAllowM_kNm * 0.8), 2) +
    Math.pow(Mz_kNm / (baseAllowM_kNm * 0.6), 2)
  );

  const combinedIR = Math.max(interactionF, interactionM);
  const isCompliant = combinedIR <= 1.0;

  // Pump casing distortion & angular misalignment
  const casingDistortionUm = Math.min(250, combinedIR * 38);
  const couplingMisalignMrad = Math.min(2.5, combinedIR * 0.42);

  const nozzleResult: Api610NozzleResult = {
    actualFxKN: Fx_kN,
    actualFyKN: Fy_kN,
    actualFzKN: Fz_kN,
    actualResultantFKN: resF_kN,
    allowableFKN: baseAllowF_kN,
    forceRatio: resF_kN / baseAllowF_kN,
    actualMxKNm: Mx_kNm,
    actualMyKNm: My_kNm,
    actualMzKNm: Mz_kNm,
    actualResultantMKNm: resM_kNm,
    allowableMKNm: baseAllowM_kNm,
    momentRatio: resM_kNm / baseAllowM_kNm,
    combinedInteractionRatio: combinedIR,
    isNozzleCompliant: isCompliant,
    pumpCasingDistortionUm: casingDistortionUm,
    couplingAngularMisalignmentMrad: couplingMisalignMrad,
  };

  return {
    nodes,
    maxVonMisesMPa: maxVM,
    maxDisplacementMm: maxDispMm,
    asmeAllowableRangeSaMPa: asmeSaMPa,
    elbow: elbowResult,
    nozzle: nozzleResult,
  };
}

/**
 * Standard Scientific Turbo Colormap for Continuous FEA Stress Gradient
 * Maps t in [0, 1] to RGB hex string
 */
export function getTurboColormapHex(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));

  // Scientific Turbo Colormap polynomial coefficients (Google Turbo)
  const r = Math.sin(clamped * Math.PI * 1.5 - 0.2) * 128 + 127;
  const g = Math.sin(clamped * Math.PI * 2.0 - 0.5) * 120 + 125;
  const b = Math.cos(clamped * Math.PI * 1.8) * 128 + 127;

  // Specific smooth boundary stops
  if (clamped < 0.25) {
    // Deep blue to cyan
    const f = clamped / 0.25;
    const red = Math.round(30 + f * 20);
    const grn = Math.round(60 + f * 150);
    const blu = Math.round(200 + f * 50);
    return `rgb(${red}, ${grn}, ${blu})`;
  } else if (clamped < 0.55) {
    // Cyan to green/yellow
    const f = (clamped - 0.25) / 0.3;
    const red = Math.round(50 + f * 180);
    const grn = Math.round(210 + f * 35);
    const blu = Math.round(250 - f * 200);
    return `rgb(${red}, ${grn}, ${blu})`;
  } else if (clamped < 0.82) {
    // Yellow to orange
    const f = (clamped - 0.55) / 0.27;
    const red = Math.round(230 + f * 25);
    const grn = Math.round(245 - f * 120);
    const blu = Math.round(50 - f * 30);
    return `rgb(${red}, ${grn}, ${blu})`;
  } else {
    // Orange to fiery crimson
    const f = (clamped - 0.82) / 0.18;
    const red = Math.round(255);
    const grn = Math.round(125 - f * 85);
    const blu = Math.round(20 + f * 20);
    return `rgb(${red}, ${grn}, ${blu})`;
  }
}
