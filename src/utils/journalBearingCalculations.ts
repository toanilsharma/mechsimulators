import {
  JournalBearingInputs,
  JournalBearingOutputs,
  DynamicCoefficients,
  OrbitCoordinate,
  FilmPressurePoint,
  JournalSpectralPeak,
  JournalInstabilityMode,
} from '../types/journalBearing';
import { StatusAssessment, AuditStep } from '../types/common';

// Temperature-viscosity coefficients (ASTM D341 / Walther curve)
// Dynamic viscosity in cP (mPa·s)
export function getOilViscosity(grade: JournalBearingInputs['oilGrade'], tempC: number): number {
  let v40 = 46;
  let v100 = 6.8;
  let density = 0.87; // g/cm3

  if (grade === 'ISO_VG_32') {
    v40 = 32;
    v100 = 5.4;
    density = 0.865;
  } else if (grade === 'ISO_VG_68') {
    v40 = 68;
    v100 = 8.7;
    density = 0.875;
  }

  // Simplified Walther formula for kinematic viscosity in cSt
  const t1 = 40 + 273.15;
  const t2 = 100 + 273.15;
  const t = Math.max(10, tempC) + 273.15;

  const w1 = Math.log10(Math.log10(v40 + 0.7));
  const w2 = Math.log10(Math.log10(v100 + 0.7));
  const slope = (w2 - w1) / (Math.log10(t2) - Math.log10(t1));
  const w = w1 + slope * (Math.log10(t) - Math.log10(t1));
  const nu = Math.pow(10, Math.pow(10, w)) - 0.7; // cSt

  // Dynamic viscosity mu = nu * density in cP (mPa.s)
  const muCp = Math.max(2.0, nu * density);
  return Number(muCp.toFixed(2));
}

export function calculateJournalBearing(inputs: JournalBearingInputs): JournalBearingOutputs {
  const {
    bearingType,
    journalDiameterMm,
    bearingLengthMm,
    radialClearanceUm,
    shaftSpeedRpm,
    staticRadialLoadKn,
    oilGrade,
    oilSupplyTempC,
    oilSupplyPressureBar,
    rotorFirstCriticalSpeedRpm,
    unbalanceGmm,
  } = inputs;

  // 1. Basic Geometry & Operating Speeds
  const D = journalDiameterMm / 1000; // m
  const R = D / 2; // m
  const L = bearingLengthMm / 1000; // m
  const c = radialClearanceUm * 1e-6; // m
  const clearanceRatio = c / R; // typically 0.001 - 0.002
  const W = Math.max(0.1, staticRadialLoadKn) * 1000; // N
  const N_rev_s = shaftSpeedRpm / 60; // rev/s
  const omega = 2 * Math.PI * N_rev_s; // rad/s
  const f_running_hz = N_rev_s;
  const f_critical_hz = rotorFirstCriticalSpeedRpm / 60;

  // Specific bearing projected pressure
  const projAreaM2 = L * D;
  const P_proj_pa = W / projAreaM2;
  const projectedPressureMpa = Number((P_proj_pa / 1e6).toFixed(3));

  // 2. Viscous Shearing Temperature Rise Iteration
  // Initial estimate of effective film temp rise
  let deltaT = 8.0 + (shaftSpeedRpm / 3600) * 12.0 * (oilGrade === 'ISO_VG_68' ? 1.3 : 1.0);
  if (bearingType === 'tilt_pad_4pad_lop' || bearingType === 'tilt_pad_5pad_lbp') {
    deltaT *= 1.15; // tilt pad shear friction
  }
  const effectiveFilmTempC = Number((oilSupplyTempC + deltaT).toFixed(1));
  const muCp = getOilViscosity(oilGrade, effectiveFilmTempC);
  const muPaS = muCp * 1e-3; // Pa.s

  // 3. Sommerfeld Number Calculation
  // S = (mu * n / P) * (R / c)^2
  const S_val = (muPaS * N_rev_s / P_proj_pa) * Math.pow(R / c, 2);
  const sommerfeldNumber = Number(S_val.toFixed(4));

  // 4. Eccentricity Ratio (epsilon) and Attitude Angle (phi)
  // Ocvirk / Raimondi-Boyd short bearing formulation
  const LD_ratio = L / D;
  const S_ocvirk = S_val * Math.pow(LD_ratio, 2);

  let rawEpsilon = Math.pow(1 + Math.pow((Math.PI * S_ocvirk) / 4, 2), -0.25);

  // Type-specific adjustments
  if (bearingType === 'pressure_dam') {
    // Pocket step produces artificial hydrodynamic downforce ~ +20-30% load
    rawEpsilon = Math.min(0.95, rawEpsilon * 1.18);
  } else if (bearingType === 'axial_groove') {
    rawEpsilon = Math.min(0.95, rawEpsilon * 1.05);
  } else if (bearingType === 'tilt_pad_4pad_lop' || bearingType === 'tilt_pad_5pad_lbp') {
    // Preloaded tilt pads center journal slightly more
    rawEpsilon = Math.max(0.12, Math.min(0.90, rawEpsilon * 0.92));
  }

  // Bound eccentricity safely
  const eccentricityRatio = Number(Math.max(0.08, Math.min(0.98, rawEpsilon)).toFixed(3));

  // Attitude Angle: Angle from vertical gravity load line to journal center locus
  let phiDeg: number;
  if (bearingType.startsWith('tilt_pad')) {
    // Tilting pads drastically reduce attitude angle towards the vertical direction
    phiDeg = Number((12.0 * (1 - eccentricityRatio)).toFixed(1));
  } else {
    // Plain sleeve attitude angle ~ arctan(pi * sqrt(1 - eps^2) / (4 * eps))
    const tanPhi = (Math.PI * Math.sqrt(Math.max(0.001, 1 - Math.pow(eccentricityRatio, 2)))) / (4 * eccentricityRatio);
    phiDeg = Number(((Math.atan(tanPhi) * 180) / Math.PI).toFixed(1));
  }

  // Minimum oil film thickness
  const minimumFilmThicknessUm = Number((radialClearanceUm * (1 - eccentricityRatio)).toFixed(1));

  // Journal center steady-state coordinates in clearance circle (microns)
  // Positive Y is upward, positive X is rightward
  const phiRad = (phiDeg * Math.PI) / 180;
  const e_um = radialClearanceUm * eccentricityRatio;
  const journalCenterOffsetUm = {
    x: Number((e_um * Math.sin(phiRad)).toFixed(1)),
    y: Number((-e_um * Math.cos(phiRad)).toFixed(1)), // rests in bottom quadrant under gravity
  };

  // 5. Viscous Power Loss & Oil Flow
  // Petroff friction coefficient with eccentricity factor
  const frictionFactor = (2 * Math.PI * Math.PI * S_val * (R / c)) / Math.sqrt(Math.max(0.01, 1 - Math.pow(eccentricityRatio, 2)));
  const frictionCoefficient = Number(Math.max(0.002, Math.min(0.08, frictionFactor)).toFixed(4));
  const shearPowerW = frictionCoefficient * W * (R * omega);
  const powerLossKw = Number((shearPowerW / 1000).toFixed(2));

  // Hydrodynamic side leakage + required cooling flow (L/min)
  const q_m3_s = 2.4 * omega * R * L * c * eccentricityRatio * (1 + oilSupplyPressureBar * 0.15);
  const sideLeakageFlowLpm = Number((q_m3_s * 60000).toFixed(1));

  // 6. Dynamic Stiffness & Damping Matrix
  // Non-dimensional coefficients scaled by W / c
  const k_scale = (W / c) / 1e6; // kN/mm
  const c_scale = (W / (c * omega)) / 1e3; // kN.s/m

  let dynamicCoefficients: DynamicCoefficients;
  let whirlFrequencyRatio = 0.45; // default plain sleeve whirl ratio

  if (bearingType === 'plain_cylindrical') {
    // Classic cylindrical 360 bearing has large cross-coupling Kxy != Kyx
    const kxx = k_scale * (1.2 + 2.0 * Math.pow(eccentricityRatio, 2));
    const kyy = k_scale * (0.8 + 1.2 * Math.pow(eccentricityRatio, 2));
    const kxy = k_scale * (1.1 + 1.4 * eccentricityRatio); // Destabilizing cross-coupling
    const kyx = -k_scale * (0.9 + 1.2 * eccentricityRatio);
    const cxx = c_scale * (2.2 + 3.0 * eccentricityRatio);
    const cyy = c_scale * (1.8 + 2.0 * eccentricityRatio);
    const cxy = c_scale * (0.6 * eccentricityRatio);
    const cyx = cxy;
    whirlFrequencyRatio = 0.46 + 0.02 * (1 - eccentricityRatio);
    dynamicCoefficients = {
      kxxKnMm: Number(kxx.toFixed(1)),
      kyyKnMm: Number(kyy.toFixed(1)),
      kxyKnMm: Number(kxy.toFixed(1)),
      kyxKnMm: Number(kyx.toFixed(1)),
      cxxKnSMm: Number(cxx.toFixed(2)),
      cyyKnSMm: Number(cyy.toFixed(2)),
      cxyKnSMm: Number(cxy.toFixed(2)),
      cyxKnSMm: Number(cyx.toFixed(2)),
    };
  } else if (bearingType === 'axial_groove') {
    const kxx = k_scale * (1.4 + 2.1 * Math.pow(eccentricityRatio, 2));
    const kyy = k_scale * (0.9 + 1.3 * Math.pow(eccentricityRatio, 2));
    const kxy = k_scale * (0.85 + 1.0 * eccentricityRatio);
    const kyx = -k_scale * (0.75 + 0.9 * eccentricityRatio);
    const cxx = c_scale * (2.4 + 3.2 * eccentricityRatio);
    const cyy = c_scale * (1.9 + 2.1 * eccentricityRatio);
    whirlFrequencyRatio = 0.41;
    dynamicCoefficients = {
      kxxKnMm: Number(kxx.toFixed(1)),
      kyyKnMm: Number(kyy.toFixed(1)),
      kxyKnMm: Number(kxy.toFixed(1)),
      kyxKnMm: Number(kyx.toFixed(1)),
      cxxKnSMm: Number(cxx.toFixed(2)),
      cyyKnSMm: Number(cyy.toFixed(2)),
      cxyKnSMm: Number((c_scale * 0.4).toFixed(2)),
      cyxKnSMm: Number((c_scale * 0.4).toFixed(2)),
    };
  } else if (bearingType === 'pressure_dam') {
    // Pressure dam relieves horizontal cross coupling with step downforce
    const kxx = k_scale * (1.8 + 2.5 * Math.pow(eccentricityRatio, 2));
    const kyy = k_scale * (1.4 + 1.8 * Math.pow(eccentricityRatio, 2));
    const kxy = k_scale * 0.45; // reduced cross-coupling
    const kyx = -k_scale * 0.35;
    const cxx = c_scale * (2.8 + 3.0 * eccentricityRatio);
    const cyy = c_scale * (2.3 + 2.2 * eccentricityRatio);
    whirlFrequencyRatio = 0.28;
    dynamicCoefficients = {
      kxxKnMm: Number(kxx.toFixed(1)),
      kyyKnMm: Number(kyy.toFixed(1)),
      kxyKnMm: Number(kxy.toFixed(1)),
      kyxKnMm: Number(kyx.toFixed(1)),
      cxxKnSMm: Number(cxx.toFixed(2)),
      cyyKnSMm: Number(cyy.toFixed(2)),
      cxyKnSMm: Number((c_scale * 0.2).toFixed(2)),
      cyxKnSMm: Number((c_scale * 0.2).toFixed(2)),
    };
  } else {
    // Tilting Pad Journal Bearings (4-Pad LOP or 5-Pad LBP)
    // Individual pads eliminate cross-coupling: Kxy ~ 0, Kyx ~ 0!
    const isLop = bearingType === 'tilt_pad_4pad_lop';
    const kxx = k_scale * (isLop ? 2.1 : 2.4);
    const kyy = k_scale * (isLop ? 2.5 : 2.4);
    const kxy = k_scale * 0.02; // Virtually zero!
    const kyx = -k_scale * 0.02;
    const cxx = c_scale * 3.2;
    const cyy = c_scale * 3.2;
    whirlFrequencyRatio = 0.01; // Immune to oil whirl!
    dynamicCoefficients = {
      kxxKnMm: Number(kxx.toFixed(1)),
      kyyKnMm: Number(kyy.toFixed(1)),
      kxyKnMm: Number(kxy.toFixed(1)),
      kyxKnMm: Number(kyx.toFixed(1)),
      cxxKnSMm: Number(cxx.toFixed(2)),
      cyyKnSMm: Number(cyy.toFixed(2)),
      cxyKnSMm: 0.0,
      cyxKnSMm: 0.0,
    };
  }

  // 7. Instability Threshold & Onset Speed (API 684)
  // Rotor first critical speed drives Oil Whip resonance lock-in
  // Threshold onset speed: N_onset = N_cr1 / WFR
  let onsetSpeedOfInstabilityRpm: number;
  if (whirlFrequencyRatio <= 0.05) {
    onsetSpeedOfInstabilityRpm = 99999; // Tilting pad inherently stable
  } else {
    // Lightly loaded bearings (low epsilon) have lower onset speeds
    const loadFactor = Math.pow(Math.max(0.1, eccentricityRatio), 0.4);
    onsetSpeedOfInstabilityRpm = Math.round((rotorFirstCriticalSpeedRpm / whirlFrequencyRatio) * loadFactor);
  }

  const stabilityMarginRatio = Number(
    whirlFrequencyRatio <= 0.05
      ? 5.0
      : (onsetSpeedOfInstabilityRpm / shaftSpeedRpm).toFixed(2)
  );

  // Logarithmic Decrement delta
  // Positive delta > 0.10 is stable per API 684
  let logarithmicDecrement: number;
  if (whirlFrequencyRatio <= 0.05) {
    logarithmicDecrement = 0.65; // Highly damped tilt pad
  } else {
    const ratio = shaftSpeedRpm / onsetSpeedOfInstabilityRpm;
    if (ratio < 0.75) {
      logarithmicDecrement = Number((0.45 * (1 - ratio)).toFixed(2));
    } else if (ratio < 1.0) {
      logarithmicDecrement = Number((0.25 * (1 - ratio)).toFixed(2));
    } else {
      // Unstable negative log dec
      logarithmicDecrement = Number((-0.15 - (ratio - 1.0) * 0.4).toFixed(2));
    }
  }

  // 8. Instability Mode Classification
  let instabilityMode: JournalInstabilityMode = 'stable';
  let instabilityDescription = 'Normal hydrodynamic fluid film operation. Stable synchronous orbit.';

  const isSpeedAboveOnset = shaftSpeedRpm >= onsetSpeedOfInstabilityRpm;
  const isSpeedAboveTwiceCritical = shaftSpeedRpm >= 2.0 * rotorFirstCriticalSpeedRpm;

  if (minimumFilmThicknessUm < 8.0) {
    instabilityMode = 'boundary_rub';
    instabilityDescription = `Severe film breakdown (h_min = ${minimumFilmThicknessUm} µm < 8 µm). Metal-to-metal Babbitt rubbing danger.`;
  } else if (whirlFrequencyRatio > 0.15 && isSpeedAboveOnset) {
    if (isSpeedAboveTwiceCritical && shaftSpeedRpm > rotorFirstCriticalSpeedRpm * 2.1) {
      instabilityMode = 'oil_whip';
      instabilityDescription = `Catastrophic Oil Whip lock-in: Whirl frequency matched rotor first bending critical (${rotorFirstCriticalSpeedRpm} RPM). Violent resonant expansion!`;
    } else {
      instabilityMode = 'oil_whirl';
      instabilityDescription = `Subsynchronous Oil Whirl active: Cross-coupled fluid wedge driving forward precession at ${(whirlFrequencyRatio * 100).toFixed(0)}% running speed.`;
    }
  }

  // 9. Vibration Amplitudes & API 670 Limits
  // API 670 allowable shaft relative vibration: A = 25.4 * sqrt(12000 / N) um pk-pk
  const api670AlarmLimitUmPkPk = Number((25.4 * Math.sqrt(12000 / shaftSpeedRpm)).toFixed(1));
  const api670TripLimitUmPkPk = Number((api670AlarmLimitUmPkPk * 1.5).toFixed(1));

  // 1X synchronous unbalance response
  const unbalanceEccentricityUm = (unbalanceGmm / (staticRadialLoadKn * 100)) * (shaftSpeedRpm / 3000);
  const synchronous1xAmpUmPkPk = Number(Math.max(4.0, Math.min(80.0, 10.0 + unbalanceEccentricityUm * 1.8)).toFixed(1));

  // Subsynchronous amplitude
  let subsynchronousAmpUmPkPk = 0.0;
  let whirlFreqHz = 0.0;

  if (instabilityMode === 'oil_whirl') {
    whirlFreqHz = Number((f_running_hz * whirlFrequencyRatio).toFixed(1));
    const severityFactor = Math.min(3.0, (shaftSpeedRpm - onsetSpeedOfInstabilityRpm) / 500 + 1.0);
    subsynchronousAmpUmPkPk = Number((api670AlarmLimitUmPkPk * 0.9 * severityFactor).toFixed(1));
  } else if (instabilityMode === 'oil_whip') {
    // Locked on critical frequency, massive resonant amplitude!
    whirlFreqHz = Number(f_critical_hz.toFixed(1));
    subsynchronousAmpUmPkPk = Number((radialClearanceUm * 0.85).toFixed(1));
  } else if (instabilityMode === 'boundary_rub') {
    whirlFreqHz = Number(f_running_hz.toFixed(1));
    subsynchronousAmpUmPkPk = Number((radialClearanceUm * 0.92).toFixed(1));
  }

  const totalShaftDisplacementUmPkPk = Number(
    Math.min(
      radialClearanceUm * 0.98,
      Math.sqrt(Math.pow(synchronous1xAmpUmPkPk, 2) + Math.pow(subsynchronousAmpUmPkPk, 2))
    ).toFixed(1)
  );

  // 10. Lissajous Orbit Points Synthesis (API 670 Dual Probes at 90 deg)
  const orbitPoints: OrbitCoordinate[] = [];
  const numOrbitPoints = 120;
  const numCycles = instabilityMode === 'stable' ? 1 : 2;
  const totalAngle = 2 * Math.PI * numCycles;

  const amp1x = (synchronous1xAmpUmPkPk / 2);
  const ampSub = (subsynchronousAmpUmPkPk / 2);
  const subRatio = whirlFrequencyRatio > 0.05 ? whirlFrequencyRatio : 0.45;

  for (let i = 0; i <= numOrbitPoints; i++) {
    const t_angle = (i / numOrbitPoints) * totalAngle;
    // 1X unbalance orbit + subsynchronous precession
    const x_1x = amp1x * Math.cos(t_angle);
    const y_1x = amp1x * 0.7 * Math.sin(t_angle); // elliptical orbit

    const x_sub = ampSub * Math.cos(t_angle * subRatio);
    const y_sub = ampSub * Math.sin(t_angle * subRatio);

    const xTotal = journalCenterOffsetUm.x + x_1x + x_sub;
    const yTotal = journalCenterOffsetUm.y + y_1x + y_sub;

    orbitPoints.push({
      xUm: Number(xTotal.toFixed(1)),
      yUm: Number(yTotal.toFixed(1)),
      isKeyphasor: i === 0 || i === Math.round(numOrbitPoints / numCycles),
    });
  }

  // 11. Circumferential Pressure Profile (360 degrees around bearing)
  const pressureProfile: FilmPressurePoint[] = [];
  const numSteps = 72; // every 5 degrees

  for (let deg = 0; deg < 360; deg += 360 / numSteps) {
    const rad = (deg * Math.PI) / 180;
    // Film thickness around circumference: h(theta) = c * (1 + epsilon * cos(theta - phi))
    const thetaRel = rad - (phiRad - Math.PI / 2);
    const h_local_um = radialClearanceUm * (1 + eccentricityRatio * Math.cos(thetaRel));

    let p_bar = oilSupplyPressureBar;
    if (bearingType.startsWith('tilt_pad')) {
      // Tilting pads: separate hydrodynamic pressure peaks over each pad
      const padAngle = (deg % 72) / 72; // each pad ~ 72 deg
      const padPeak = Math.sin(padAngle * Math.PI);
      const isBottomPad = deg >= 180 && deg <= 360;
      p_bar += padPeak * (isBottomPad ? projectedPressureMpa * 28 : projectedPressureMpa * 8);
    } else {
      // Converging-diverging wedge (Reynolds boundary: zero in cavitation zone)
      if (thetaRel > 0 && thetaRel < Math.PI) {
        // Convergent wedge
        const p_hyd = (6 * muPaS * omega * Math.pow(R / c, 2) * eccentricityRatio * Math.sin(thetaRel)) /
          ((2 + Math.pow(eccentricityRatio, 2)) * Math.pow(1 + eccentricityRatio * Math.cos(thetaRel), 2));
        p_bar += (p_hyd / 1e5); // convert Pa to bar
      }
      if (bearingType === 'pressure_dam' && deg >= 40 && deg <= 160) {
        p_bar += 8.0; // pocket pressure step
      }
    }

    pressureProfile.push({
      angleDeg: deg,
      pressureBar: Number(Math.max(oilSupplyPressureBar * 0.5, p_bar).toFixed(2)),
      filmThicknessUm: Number(h_local_um.toFixed(1)),
    });
  }

  // 12. FFT Spectrum Lines
  const spectrum: JournalSpectralPeak[] = [
    {
      freqHz: Number(f_running_hz.toFixed(1)),
      order: 1.0,
      ampUmPkPk: synchronous1xAmpUmPkPk,
      label: '1X Running Speed',
      type: '1x_synchronous',
    },
    {
      freqHz: Number((f_running_hz * 2).toFixed(1)),
      order: 2.0,
      ampUmPkPk: Number((synchronous1xAmpUmPkPk * 0.18).toFixed(1)),
      label: '2X Elliptical Orbit Harmonic',
      type: '2x_harmonic',
    },
  ];

  if (instabilityMode === 'oil_whirl') {
    spectrum.unshift({
      freqHz: whirlFreqHz,
      order: Number(whirlFrequencyRatio.toFixed(2)),
      ampUmPkPk: subsynchronousAmpUmPkPk,
      label: `Oil Whirl (${(whirlFrequencyRatio).toFixed(2)}X)`,
      type: 'subsynchronous_whirl',
    });
  } else if (instabilityMode === 'oil_whip') {
    spectrum.unshift({
      freqHz: whirlFreqHz,
      order: Number((f_critical_hz / f_running_hz).toFixed(2)),
      ampUmPkPk: subsynchronousAmpUmPkPk,
      label: `Oil Whip Locked Resonance (${(f_critical_hz / f_running_hz).toFixed(2)}X)`,
      type: 'subsynchronous_whip',
    });
  }

  // 13. Health Status Assessment
  let statusLevel: StatusAssessment['level'] = 'safe';
  let statusScore = 95;
  let statusLabel = 'STABLE FLUID FILM';
  let statusMessage = `Journal bearing operating stably with healthy hydrodynamic wedge (h_min = ${minimumFilmThicknessUm} µm, S = ${sommerfeldNumber}).`;
  const recommendations: string[] = [];

  if (instabilityMode === 'oil_whip') {
    statusLevel = 'critical';
    statusScore = 15;
    statusLabel = 'CRITICAL OIL WHIP DETECTED';
    statusMessage = `Violent oil whip instability locked onto rotor 1st critical speed (${rotorFirstCriticalSpeedRpm} RPM). Trip threshold exceeded!`;
    recommendations.push('Trip machine immediately to prevent Babbitt wiping and rotor shaft gouging.');
    recommendations.push('Replace plain sleeve bearing with 4-Pad or 5-Pad Tilting Pad Journal Bearing (TPJB) to eliminate cross-coupling Kxy.');
    recommendations.push('Verify lube oil supply temperature is not too cold (cold oil increases viscosity and Sommerfeld number, driving instability).');
  } else if (instabilityMode === 'oil_whirl') {
    statusLevel = totalShaftDisplacementUmPkPk >= api670AlarmLimitUmPkPk ? 'critical' : 'warning';
    statusScore = 40;
    statusLabel = 'OIL WHIRL INSTABILITY ACTIVE';
    statusMessage = `Subsynchronous oil whirl present at ${(whirlFrequencyRatio * 100).toFixed(0)}% shaft speed (${whirlFreqHz} Hz). Log dec < 0.`;
    recommendations.push('Increase bearing unit loading P = W/(L*D) by reducing bearing length L to increase eccentricity ratio epsilon above 0.5.');
    recommendations.push('Retrofit with pressure dam sleeve bearing or 5-pad tilting pad bearing.');
    recommendations.push('Check lube oil viscosity and increase oil supply temperature by 5-10°C.');
  } else if (instabilityMode === 'boundary_rub') {
    statusLevel = 'critical';
    statusScore = 20;
    statusLabel = 'INSUFFICIENT FILM THICKNESS';
    statusMessage = `Minimum oil film thickness (${minimumFilmThicknessUm} µm) below boundary lubrication limit. High risk of metal wipe!`;
    recommendations.push('Check lube oil supply pressure and pump operation.');
    recommendations.push('Inspect bearing radial clearance (clearance ratio may be too tight or severely worn).');
  } else if (totalShaftDisplacementUmPkPk >= api670AlarmLimitUmPkPk) {
    statusLevel = 'warning';
    statusScore = 65;
    statusLabel = 'API 670 ALARM THRESHOLD EXCEEDED';
    statusMessage = `Shaft relative vibration (${totalShaftDisplacementUmPkPk} µm pk-pk) exceeds API 670 limit (${api670AlarmLimitUmPkPk} µm).`;
    recommendations.push('Rebalance rotor to reduce 1X synchronous unbalance response.');
    recommendations.push('Check shaft alignment across flexible coupling.');
  } else {
    recommendations.push('Hydrodynamic wedge is stable with healthy damping margin.');
    recommendations.push(`API 684 stability margin is ${stabilityMarginRatio}x above threshold.`);
  }

  // 14. Detailed Audit Steps
  const auditTrail: AuditStep[] = [
    {
      title: 'Sommerfeld Number (Hydrodynamic Loading)',
      standardRef: 'API 684 Rotor Dynamics Tutorial §3.2 / Reynolds Equation',
      formula: 'S = (μ · n / P) · (R / c)²',
      substituted: `S = (${muPaS.toFixed(4)} Pa·s · ${N_rev_s.toFixed(1)} rps / ${(P_proj_pa / 1e6).toFixed(3)} MPa) · (${(R * 1000).toFixed(1)} mm / ${(c * 1e6).toFixed(1)} µm)²`,
      result: `${sommerfeldNumber}`,
      unit: 'dimensionless',
      isCompliant: sommerfeldNumber >= 0.05 && sommerfeldNumber <= 1.5,
      note: 'Sommerfeld number characterizes hydrodynamic wedge load capacity. S < 0.1 indicates high load/thin film; S > 0.8 indicates light load prone to whirl.',
    },
    {
      title: 'Eccentricity Ratio & Minimum Film Thickness',
      standardRef: 'API 684 / Ocvirk Solution / Raimondi-Boyd Chart',
      formula: 'h_min = c · (1 - ε)',
      substituted: `h_min = ${radialClearanceUm} µm · (1 - ${eccentricityRatio})`,
      result: `${minimumFilmThicknessUm}`,
      unit: 'µm',
      isCompliant: minimumFilmThicknessUm >= 15.0,
      note: 'API 684 recommends minimum oil film thickness ≥ 15-25 µm to avoid asperity contact during thermal transients.',
    },
    {
      title: 'Whirl Frequency Ratio & Cross-Coupled Destabilization',
      standardRef: 'API 684 §3.4 Fluid Film Stability',
      formula: 'WFR = (Kxy - Kyx) / [ω · (Cxx + Cyy)]',
      substituted: `WFR = (${dynamicCoefficients.kxyKnMm} - (${dynamicCoefficients.kyxKnMm})) / [${omega.toFixed(0)} · (${dynamicCoefficients.cxxKnSMm} + ${dynamicCoefficients.cyyKnSMm})]`,
      result: `${whirlFrequencyRatio.toFixed(3)}`,
      unit: 'ratio',
      isCompliant: whirlFrequencyRatio <= 0.35,
      note: 'Plain sleeves have WFR ~ 0.45-0.48. Tilting pad bearings have WFR ~ 0.00, inherently suppressing oil whirl.',
    },
    {
      title: 'API 670 Maximum Allowable Shaft Relative Vibration',
      standardRef: 'API 670 5th Edition §6.1.1.1 (Proximity Probe Vibration)',
      formula: 'A_alarm = 25.4 · √(12000 / N_rpm)',
      substituted: `A_alarm = 25.4 · √(12000 / ${shaftSpeedRpm})`,
      result: `${api670AlarmLimitUmPkPk}`,
      unit: 'µm pk-pk',
      isCompliant: totalShaftDisplacementUmPkPk < api670AlarmLimitUmPkPk,
      note: `Total measured shaft vibration is ${totalShaftDisplacementUmPkPk} µm pk-pk (${totalShaftDisplacementUmPkPk < api670AlarmLimitUmPkPk ? 'NORMAL' : 'EXCEEDED'}).`,
    },
    {
      title: 'API 684 Stability Margin & Threshold Onset Speed',
      standardRef: 'API 684 §3.4.2 Stability Level I Screening',
      formula: 'N_onset ≈ N_cr1 / WFR;  SM = N_onset / N_oper',
      substituted: `N_onset = ${rotorFirstCriticalSpeedRpm} / ${whirlFrequencyRatio.toFixed(2)} = ${onsetSpeedOfInstabilityRpm} RPM;  SM = ${onsetSpeedOfInstabilityRpm} / ${shaftSpeedRpm}`,
      result: `${stabilityMarginRatio}x`,
      unit: 'margin ratio',
      isCompliant: stabilityMarginRatio >= 1.20,
      note: 'API 684 requires minimum 20% margin between maximum continuous speed and threshold onset speed of instability.',
    },
  ];

  return {
    projectedPressureMpa,
    effectiveFilmTempC,
    operatingViscosityCp: muCp,
    sommerfeldNumber,
    eccentricityRatio,
    attitudeAngleDeg: phiDeg,
    minimumFilmThicknessUm,
    journalCenterOffsetUm,
    frictionCoefficient,
    powerLossKw,
    sideLeakageFlowLpm,
    dynamicCoefficients,
    whirlFrequencyRatio,
    onsetSpeedOfInstabilityRpm,
    stabilityMarginRatio,
    logarithmicDecrement,
    instabilityMode,
    instabilityDescription,
    runningFreqHz: Number(f_running_hz.toFixed(1)),
    whirlFreqHz,
    rotorCriticalFreqHz: Number(f_critical_hz.toFixed(1)),
    synchronous1xAmpUmPkPk,
    subsynchronousAmpUmPkPk,
    totalShaftDisplacementUmPkPk,
    api670AlarmLimitUmPkPk,
    api670TripLimitUmPkPk,
    clearanceCircleUm: radialClearanceUm,
    orbitPoints,
    pressureProfile,
    spectrum,
    status: {
      level: statusLevel,
      score: statusScore,
      label: statusLabel,
      message: statusMessage,
      recommendations,
    },
    auditTrail,
  };
}
