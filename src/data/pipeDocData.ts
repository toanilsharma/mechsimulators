import { SimulatorDocSectionProps } from '../components/Shared/SimulatorDocSection';

export const PIPE_DOC_DATA: Omit<SimulatorDocSectionProps, 'simulatorId'> = {
  h1Title: 'Pipe Thermal Expansion and Stress Visualizer',
  summary:
    'Evaluate piping thermal expansion growth (ΔL), Kellogg guided cantilever flexibility, ASME B31.3 allowable displacement stress range (SA), combined von Mises stress, and fixed anchor nozzle thrust reactions across carbon steel, stainless steel, and Cr-Mo alloy materials.',
  howItWorks: [
    'Thermal Elongation Solver: Multiplies pipe developed length by temperature-dependent mean coefficient of thermal expansion (alpha) and thermal difference (T_design - T_install).',
    'Restraint Condition Assessment: Evaluates whether thermal strain is absorbed through flexible expansion loops/legs or transformed into compressive axial thrust in fully restrained anchor configurations.',
    'Displacement Stress Range (SE): Solves combined bending stress (Sb) incorporating ASME B31.3 stress intensification factors (SIF, i-factors) and torsional shear stress (St).',
    'ASME Allowable Limit (SA) & Margin: Calculates SA = f · [1.25 · Sc + 0.25 · Sh] to verify code compliance and prevent cyclic thermal fatigue failure.',
  ],
  inputs: [
    {
      name: 'Pipe Material',
      symbol: 'Material',
      unit: 'ASTM Grade',
      description: 'Piping alloy (ASTM A106 Gr. B, ASTM A312 TP316, ASTM A335 P11/P22) governing Young modulus E and thermal expansion coefficient α.',
    },
    {
      name: 'Nominal Pipe Size (NPS)',
      symbol: 'OD / Sch',
      unit: 'inch / mm',
      description: 'Outside diameter and wall thickness schedule (ASME B36.10M / B36.19M) defining pipe cross-sectional metal area and moment of inertia I.',
    },
    {
      name: 'Pipe Run Length',
      symbol: 'L',
      unit: 'm or ft',
      description: 'Straight linear distance between major fixed anchor supports or structural bulkheads.',
    },
    {
      name: 'Operating / Design Temperature',
      symbol: 'T_op',
      unit: '°C or °F',
      description: 'Maximum process temperature during regular operation or steam-out cleaning.',
    },
    {
      name: 'Installation Ambient Temperature',
      symbol: 'T_install',
      unit: '°C or °F',
      description: 'Reference ambient temperature when pipe was welded, flanged, and tied into supports (default 20°C / 70°F).',
    },
    {
      name: 'Internal Operating Pressure',
      symbol: 'P_int',
      unit: 'bar or psig',
      description: 'Fluid operating pressure generating longitudinal hoop stress and Bourdon elongation effects.',
    },
    {
      name: 'Anchor & Flexibility Configuration',
      symbol: 'Boundary',
      unit: 'Type',
      description: 'Support boundary condition: Anchored Both Ends, Guided Cantilever, or Symmetrical Expansion Loop.',
    },
  ],
  outputs: [
    {
      name: 'Thermal Growth / Elongation',
      symbol: 'ΔL',
      unit: 'mm or in',
      threshold: 'Kinematic expansion',
      description: 'Unrestrained linear expansion of the pipe run resulting from thermal differential (T_op - T_install).',
    },
    {
      name: 'Direct Axial Stress',
      symbol: 'σ_axial',
      unit: 'MPa or psi',
      threshold: 'In restrained mode: E · α · ΔT',
      description: 'Compressive stress generated when anchors restrict free thermal growth.',
    },
    {
      name: 'Combined Displacement Stress (SE)',
      symbol: 'SE',
      unit: 'MPa or psi',
      threshold: 'SE ≤ SA (ASME B31.3)',
      description: 'Equivalent displacement stress range combining bending, torsion, and axial intensification.',
    },
    {
      name: 'ASME B31.3 Allowable Limit (SA)',
      symbol: 'SA',
      unit: 'MPa or psi',
      threshold: 'f · [1.25 · Sc + 0.25 · Sh]',
      description: 'Allowable displacement stress range limit considering cold (Sc) and hot (Sh) material stress ratings.',
    },
    {
      name: 'Anchor Thrust Reaction Force',
      symbol: 'F_axial',
      unit: 'kN or lbf',
      threshold: 'Check against equipment nozzle limits',
      description: 'Axial compressive force exerted onto fixed anchors, pump nozzles, or vessel flanged connections.',
    },
  ],
  equations: [
    {
      title: 'Thermal Linear Elongation (ΔL)',
      formula: 'ΔL = α(T) · L · (T_op - T_install)',
      variables: 'α(T) = Mean coefficient of thermal expansion (mm/m/°C or in/in/°F), L = Pipe length (m or ft), T_op = Operating temperature, T_install = Cold ambient temperature.',
      standardRef: 'ASME B31.3:2022 §319.3.1',
    },
    {
      title: 'ASME B31.3 Allowable Stress Range (SA)',
      formula: 'SA = f · [1.25 · Sc + 0.25 · Sh + (Sh - SL)]',
      variables: 'Sc = Basic allowable stress at minimum metal temp, Sh = Basic allowable stress at maximum metal temp, f = Stress range factor for design cycle life (1.0 for ≤ 7000 thermal cycles), SL = Sustained longitudinal stress.',
      standardRef: 'ASME B31.3 Equation (1a) / §302.3.5',
    },
    {
      title: 'Kellogg Guided Cantilever Bending Stress',
      formula: 'σ_bend = (3 · E · D_o · ΔL) / L_flex²',
      variables: 'E = Modulus of elasticity at operating temp (MPa), D_o = Pipe outside diameter (mm), ΔL = Thermal growth absorbed by flex leg (mm), L_flex = Perpendicular flexible expansion leg length (m).',
      standardRef: 'M.W. Kellogg Design of Piping Systems',
    },
    {
      title: 'Restrained Axial Compressive Force',
      formula: 'F_anchor = E · A_metal · α · ΔT + P_int · A_flow · (1 - 2ν)',
      variables: 'A_metal = Pipe wall cross-sectional metal area, A_flow = Internal bore area, ν = Poisson ratio (0.30 for steel), P_int = Internal operating pressure.',
      standardRef: 'ASME B31.3 Appendix P',
    },
  ],
  standards: [
    {
      code: 'ASME B31.3:2022',
      title: 'Process Piping - Code for Pressure Piping',
      relevantSection: 'Chapter II, Part 5, Section 319 (Piping Flexibility and Stress Range)',
    },
    {
      code: 'ASME B36.10M',
      title: 'Welded and Seamless Wrought Steel Pipe',
      relevantSection: 'Dimensions, schedules, and metal cross-sectional properties for carbon and alloy steel pipes',
    },
    {
      code: 'API Standard 610 Annex F',
      title: 'Centrifugal Pumps - Criteria for Piping Design',
      relevantSection: 'Allowable nozzle forces and moments (Fx, Fy, Fz, Mx, My, Mz) on pump casings',
    },
  ],
  limitations: [
    'One-dimensional flexibility modeling: Solves single-plane cantilever and expansion loop geometry; for complex 3D piping networks with multi-plane bends, a comprehensive finite element code (e.g., CAESAR II, AutoPIPE) must be utilized.',
    'Assumes elastic behavior within code-permitted shakedown limits; does not model high-temperature plastic creep rupture.',
    'Frictional support shoe sliding friction is modeled with standard Coulomb coefficients (μ = 0.3 for steel-on-steel, 0.1 for PTFE slide plates).',
  ],
  exampleCalculation: {
    title: 'Benchmark Verification: 6-inch Sch 40 Hot Oil Header Anchor Thrust',
    scenario:
      'Calculate thermal elongation, direct axial stress, and anchor force for a 10.0 m ASTM A106 Gr. B carbon steel line (6" Sch 40, OD = 168.3 mm, Wall = 7.11 mm, Area = 3,600 mm²) heating from 20°C to 120°C (ΔT = 100°C) with rigid fixed anchors.',
    given: [
      { label: 'Material', value: 'ASTM A106 Gr. B' },
      { label: 'Pipe Size', value: '6" Sch 40 (OD 168.3 mm)' },
      { label: 'Pipe Length L', value: '10.0 m' },
      { label: 'Metal Area A', value: '3,600 mm²' },
      { label: 'Temperature ΔT', value: '100.0 °C (20°C to 120°C)' },
      { label: 'Expansion Coeff α', value: '12.1 × 10⁻⁶ m/m/°C' },
      { label: 'Young Modulus E', value: '200,000 MPa' },
      { label: 'ASME Allowable SA', value: '207.0 MPa' },
    ],
    steps: [
      {
        step: 'Unrestrained Thermal Growth (ΔL)',
        formula: 'ΔL = α · L · ΔT',
        substitution: '(12.1 × 10⁻⁶ / °C) · 10,000 mm · 100 °C',
        result: '12.10 mm',
      },
      {
        step: 'Fully Restrained Compressive Axial Stress (σ_axial)',
        formula: 'σ_axial = E · α · ΔT',
        substitution: '200,000 MPa · (12.1 × 10⁻⁶) · 100 °C',
        result: '242.0 MPa',
      },
      {
        step: 'ASME Allowable Stress Comparison',
        formula: 'Stress Ratio = σ_axial / SA',
        substitution: '242.0 MPa / 207.0 MPa',
        result: '1.17x (Overstressed! Exceeds Code Limit)',
      },
      {
        step: 'Total Compressive Anchor Thrust Force (F_anchor)',
        formula: 'F_anchor = σ_axial · A_metal',
        substitution: '242.0 N/mm² · 3,600 mm²',
        result: '871.2 kN (195,850 lbf / 97.9 tons)',
      },
      {
        step: 'Flexible Expansion Loop Mitigation (Width W=2m, Height H=2m)',
        formula: 'SE_loop = (3 · E · OD · ΔL) / L_flex²',
        substitution: '(3 · 200,000 · 168.3 · 12.10) / (4000)²',
        result: '76.4 MPa (Safe! 37% of ASME SA)',
      },
    ],
    conclusion:
      'Rigidly anchoring the 6" line generates 242.0 MPa thermal stress (117% of ASME allowable) and an immense 871.2 kN anchor thrust that would buckle structural supports. Incorporating a 2m × 2m expansion loop drops stress to 76.4 MPa (safe) and mitigates anchor reaction by over 90%.',
  },
  faqs: [
    {
      question: 'How is thermal expansion stress calculated in piping?',
      answer:
        'When a pipe is heated, it attempts to expand linearly by ΔL = α · L · ΔT. If anchors prevent this growth, thermal strain (ε = α · ΔT) is converted into direct compressive axial stress (σ = E · α · ΔT). When flexible legs or expansion loops are provided, thermal growth is absorbed through lateral bending of perpendicular legs, dramatically reducing stress to code-compliant levels.',
    },
    {
      question: 'Why use expansion loops instead of rigid piping?',
      answer:
        'Expansion loops convert rigid compressive axial growth into low-stress flexural bending across U-shaped or Z-shaped piping legs. Without expansion loops or flexible offsets, thermal expansion generates massive axial thrust forces (hundreds of kilonewtons) that distort pump nozzles, shear anchor bolts, bow pipe racks, and cause cyclic low-cycle fatigue cracks.',
    },
    {
      question: 'What is the allowable displacement stress range SA in ASME B31.3?',
      answer:
        'Under ASME B31.3 Section 319, SA = f · [1.25 · Sc + 0.25 · Sh], where Sc is the basic allowable stress at cold ambient temperature, Sh is allowable stress at hot operating temperature, and f is the cyclic life factor (1.0 for up to 7,000 thermal cycles). This formula is based on the principle of elastic shakedown.',
    },
    {
      question: 'What are stress intensification factors (SIF / i-factors)?',
      answer:
        'Stress Intensification Factors (i-factors) account for localized stress concentrations in piping components (such as forged elbows, tees, reducers, and branch connections) compared to standard straight seamless pipe. ASME B31.3 Appendix D defines in-plane (i_i) and out-of-plane (i_o) factors that multiply nominal bending stresses.',
    },
  ],
  relatedTools: [
    {
      id: 'pump',
      title: 'Centrifugal Pump Cavitation & NPSH Simulator',
      description: 'Verify suction hydraulics while checking nozzle thermal loading.',
      standard: 'API 610 12th Ed',
    },
    {
      id: 'rotor',
      title: 'Rotor Unbalance and Bearing Life Simulator',
      description: 'Model machine vibration and bearing fatigue life under casing alignment distortion.',
      standard: 'ISO 1940 / 281',
    },
    {
      id: 'seal',
      title: 'API Mechanical Seal Flush Plan Simulator',
      description: 'Simulate seal chamber thermal conditions and auxiliary flush piping flexibility.',
      standard: 'API 682 4th Ed',
    },
  ],
};
