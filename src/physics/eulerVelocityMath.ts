/**
 * Euler Velocity Triangles, Impeller Kinematics & Suction Recirculation
 * 
 * Complies with Hydraulic Institute (HI) standards, Stepanoff, and Pfleiderer turbomachinery equations.
 * Calculates velocity vector triangles at impeller eye inlet (1) and discharge tip (2),
 * incidence angles, blade slip factors, and Fraser suction recirculation onset.
 */

export interface EulerVelocityTriangle {
  // Inlet Triangle (Section 1: Impeller Eye Blade Leading Edge)
  r1M: number;               // Inlet radius (m)
  u1Ms: number;              // Tangential blade velocity U1 = ω * r1 (m/s)
  vm1Ms: number;             // Meridional through-flow velocity Vm1 = Q / A1 (m/s)
  vu1Ms: number;             // Inlet tangential whirl velocity Vu1 (m/s) - typically 0 without inlet guide vanes
  v1Ms: number;              // Absolute fluid velocity V1 = sqrt(Vu1² + Vm1²) (m/s)
  w1Ms: number;              // Relative fluid velocity W1 = sqrt((U1 - Vu1)² + Vm1²) (m/s)
  alpha1Deg: number;         // Absolute fluid angle α1 (deg) - 90° for radial entry
  beta1FlowDeg: number;      // Fluid flow angle β1 = atan(Vm1 / (U1 - Vu1)) (deg)
  beta1BladeDeg: number;     // Design blade inlet angle at BEP (deg)
  incidenceAngleDeg: number; // Incidence angle i = β1Flow - β1Blade (deg)
  incidenceState: 'shockless' | 'positive_stall' | 'negative_stall';

  // Discharge Triangle (Section 2: Impeller Outer Diameter Tip)
  r2M: number;               // Discharge outer radius (m)
  u2Ms: number;              // Tangential tip velocity U2 = ω * r2 (m/s)
  vm2Ms: number;             // Exit meridional velocity Vm2 = Q / A2 (m/s)
  beta2BladeDeg: number;     // Blade backward exit angle (deg) - typically 22° - 27°
  w2Ms: number;              // Relative exit velocity W2 = Vm2 / sin(β2) (m/s)
  slipFactor: number;        // Wiesner / Stodola slip factor σ
  vu2Ms: number;             // Exit whirl velocity Vu2 (m/s)
  v2Ms: number;              // Absolute discharge velocity V2 = sqrt(Vm2² + Vu2²) (m/s)
  alpha2Deg: number;         // Absolute discharge angle α2 (deg)
  eulerHeadM: number;        // Theoretical Euler Head H_euler = (U2*Vu2 - U1*Vu1) / g (m)

  // Suction Recirculation Mechanics (Fraser / HI Criteria)
  qRecirculationM3h: number; // Critical flow below which suction recirculation initiates (m³/h)
  recirculationRatio: number;// Q / Q_rec
  isRecirculating: boolean;  // True if operating flow < Q_rec
  recirculationIntensity: number; // 0 to 1 index of backflow vortex energy
}

/**
 * Compute full Euler velocity triangles and suction recirculation threshold
 */
export function calculateEulerTriangles(params: {
  flowRateM3h: number;
  bepFlowM3h: number;
  pumpSpeedRpm: number;
  impellerEyeDiameterMm: number;
  ratedHeadM: number;
  suctionSpecificSpeedUS?: number;
  numBlades?: number;
}): EulerVelocityTriangle {
  const g = 9.80665;
  const numBlades = params.numBlades || 6;
  const omega = (2 * Math.PI * params.pumpSpeedRpm) / 60; // rad/s

  // 1. INLET GEOMETRY & KINEMATICS (Section 1)
  const dEyeM = Math.max(0.02, params.impellerEyeDiameterMm / 1000);
  const r1M = dEyeM / 2;
  const u1Ms = omega * r1M; // Blade speed at eye tip

  // Inlet eye through-flow area
  // Subtract 15% for shaft hub obstruction
  const a1M2 = (Math.PI / 4) * Math.pow(dEyeM, 2) * 0.85;
  const qM3s = Math.max(0.1, params.flowRateM3h) / 3600;
  const qBepM3s = Math.max(0.1, params.bepFlowM3h) / 3600;

  const vm1Ms = Math.max(0.2, qM3s / a1M2);
  const vm1BepMs = Math.max(0.2, qBepM3s / a1M2);

  // Radial inlet assumption (no pre-whirl: Vu1 = 0, α1 = 90°)
  const vu1Ms = 0;
  const v1Ms = vm1Ms;
  const w1Ms = Math.sqrt(Math.pow(u1Ms - vu1Ms, 2) + Math.pow(vm1Ms, 2));

  // Angles in degrees
  const alpha1Deg = 90;
  const beta1FlowDeg = (Math.atan2(vm1Ms, u1Ms - vu1Ms) * 180) / Math.PI;
  const beta1BladeDeg = (Math.atan2(vm1BepMs, u1Ms) * 180) / Math.PI;
  const incidenceAngleDeg = beta1FlowDeg - beta1BladeDeg;

  let incidenceState: 'shockless' | 'positive_stall' | 'negative_stall' = 'shockless';
  if (incidenceAngleDeg > 3.5) {
    incidenceState = 'positive_stall'; // Low flow: high incidence, separation on blade suction face
  } else if (incidenceAngleDeg < -3.5) {
    incidenceState = 'negative_stall'; // Over-capacity: separation on blade pressure face
  }

  // 2. DISCHARGE GEOMETRY & KINEMATICS (Section 2)
  // Estimate impeller outer diameter D2 from Euler head relation or rated head
  // H_rated ≈ η_hyd * σ * U2² / g -> U2 ≈ sqrt(g * H / (0.85 * 0.82))
  const estU2 = Math.max(u1Ms * 1.5, Math.sqrt((g * Math.max(10, params.ratedHeadM)) / 0.70));
  const r2M = Math.max(r1M * 1.6, estU2 / omega);
  const u2Ms = omega * r2M;

  // Typical backward curved vane exit angle β2 = 24°
  const beta2BladeDeg = 24;
  const beta2Rad = (beta2BladeDeg * Math.PI) / 180;

  // Exit passage area (typically A2 ≈ 0.85 * A1)
  const a2M2 = a1M2 * 0.85;
  const vm2Ms = Math.max(0.2, qM3s / a2M2);

  // Wiesner Slip Factor: σ = 1 - sqrt(sin(β2)) / (z^0.7)
  const slipFactor = Math.max(0.65, Math.min(0.92, 1 - Math.sqrt(Math.sin(beta2Rad)) / Math.pow(numBlades, 0.7)));

  // Whirl velocity with slip
  const vu2Ideal = u2Ms - vm2Ms / Math.tan(beta2Rad);
  const vu2Ms = Math.max(0.5, vu2Ideal * slipFactor);
  const w2Ms = vm2Ms / Math.sin(beta2Rad);
  const v2Ms = Math.sqrt(Math.pow(vu2Ms, 2) + Math.pow(vm2Ms, 2));
  const alpha2Deg = (Math.atan2(vm2Ms, vu2Ms) * 180) / Math.PI;

  // Euler Head: H_E = (U2 * Vu2 - U1 * Vu1) / g
  const eulerHeadM = (u2Ms * vu2Ms - u1Ms * vu1Ms) / g;

  // 3. SUCTION RECIRCULATION CRITICAL FLOW (Fraser / Hydraulic Institute)
  // Higher Suction Specific Speed (Nss) raises recirculation onset flow
  const nssUS = params.suctionSpecificSpeedUS || 9500;
  // Fraser empirical formula: Q_rec ≈ Q_BEP * (1 - 0.35 * (Nss / 8500)^0.6)
  const nssFactor = Math.min(1.4, Math.pow(nssUS / 8500, 0.65));
  const recOnsetRatio = Math.max(0.45, Math.min(0.85, 0.50 + 0.22 * nssFactor));
  const qRecirculationM3h = params.bepFlowM3h * recOnsetRatio;

  const recirculationRatio = params.flowRateM3h / qRecirculationM3h;
  const isRecirculating = params.flowRateM3h < qRecirculationM3h;
  const recirculationIntensity = isRecirculating
    ? Math.min(1.0, Math.max(0.0, (qRecirculationM3h - params.flowRateM3h) / (qRecirculationM3h * 0.7)))
    : 0.0;

  return {
    r1M,
    u1Ms,
    vm1Ms,
    vu1Ms,
    v1Ms,
    w1Ms,
    alpha1Deg,
    beta1FlowDeg,
    beta1BladeDeg,
    incidenceAngleDeg,
    incidenceState,

    r2M,
    u2Ms,
    vm2Ms,
    beta2BladeDeg,
    w2Ms,
    slipFactor,
    vu2Ms,
    v2Ms,
    alpha2Deg,
    eulerHeadM,

    qRecirculationM3h,
    recirculationRatio,
    isRecirculating,
    recirculationIntensity,
  };
}
