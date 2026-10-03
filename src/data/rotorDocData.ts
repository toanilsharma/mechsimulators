import { SimulatorDocSectionProps } from '../components/Shared/SimulatorDocSection';

export const ROTOR_DOC_DATA: Omit<SimulatorDocSectionProps, 'simulatorId'> = {
  h1Title: 'Rotor Unbalance & Bearing Life Simulator',
  summary:
    'Calculate ISO 1940 permissible residual unbalance, 1X synchronous centrifugal unbalance force, shaft orbit whirl kinematics, ISO 10816-3 vibration severity zones, and ISO 281 modified rating life (L10mh) with lubrication viscosity ratio (kappa) and contamination factor (eC).',
  howItWorks: [
    'ISO 1940 Balance Quality Grading: Computes maximum permissible residual unbalance (U_per) based on rotor mass, rotational speed, and selected grade (G0.4 to G6.3).',
    'Centrifugal Dynamic Force Resolution: Solves 1X synchronous rotating force (Fc = m · r · ω²) transmitted directly through the shaft to supporting bearing housings.',
    'Vibration Severity Mapping: Converts dynamic force and support stiffness into root-mean-square (RMS) vibration velocity (mm/s) to classify ISO 10816-3 zones (A=New, B=Acceptable, C=Restricted, D=Danger).',
    'ISO 281 Modified Rating Life (L10mh): Combines static gravity weight and rotating centrifugal load into equivalent dynamic load P, solving ISO 281 L10mh bearing fatigue life with lubrication factor aISO.',
  ],
  inputs: [
    {
      name: 'Rotor Assembly Mass',
      symbol: 'm_rotor',
      unit: 'kg or lb',
      description: 'Total weight of rotating assembly including shaft, impellers/disks, and coupling half.',
    },
    {
      name: 'Operating Speed',
      symbol: 'N',
      unit: 'RPM',
      description: 'Running speed of the machine; angular velocity ω = 2π·N / 60.',
    },
    {
      name: 'ISO Balance Quality Grade',
      symbol: 'G',
      unit: 'mm/s',
      description: 'ISO 1940 tolerance grade (e.g., G1.0 for precision turbines, G2.5 for pumps/motors, G6.3 for fans).',
    },
    {
      name: 'Actual Residual Unbalance',
      symbol: 'U_actual',
      unit: 'g·mm or oz·in',
      description: 'Physical unbalance mass multiplied by radial distance from rotational centerline.',
    },
    {
      name: 'Bearing Type & Rating',
      symbol: 'Bearing / C_dyn',
      unit: 'Type / kN',
      description: 'Anti-friction bearing selection (Deep Groove Ball, Spherical Roller, Cylindrical Roller) and basic dynamic load rating.',
    },
    {
      name: 'Lubricant Viscosity @ 40°C',
      symbol: 'ν_40',
      unit: 'cSt (mm²/s)',
      description: 'Base oil ISO viscosity grade (e.g., ISO VG 32, 46, 68) for determining operating viscosity ratio (κ).',
    },
    {
      name: 'Bearing Operating Temperature',
      symbol: 'T_bearing',
      unit: '°C or °F',
      description: 'Steady-state bearing housing temperature determining actual operating oil film viscosity.',
    },
    {
      name: 'Contamination Level',
      symbol: 'eC',
      unit: 'Factor (0.1 - 1.0)',
      description: 'Lubrication cleanliness factor per ISO 281 (0.1 for high contamination, 0.8 for clean plant filtration).',
    },
  ],
  outputs: [
    {
      name: 'Permissible Unbalance (U_per)',
      symbol: 'U_per',
      unit: 'g·mm or oz·in',
      threshold: 'U_actual ≤ U_per (ISO 1940)',
      description: 'Maximum allowable unbalance tolerance for the specified ISO grade at operating speed.',
    },
    {
      name: '1X Centrifugal Unbalance Force',
      symbol: 'F_c',
      unit: 'N or lbf',
      threshold: 'F_c < 0.20 · W_static',
      description: 'Rotating dynamic force transmitted to bearing journals at 1X shaft rotational frequency.',
    },
    {
      name: 'Vibration Velocity RMS',
      symbol: 'V_rms',
      unit: 'mm/s or in/s RMS',
      threshold: 'Zone A/B: < 2.8 - 4.5 mm/s',
      description: '10 Hz to 1000 Hz broadband vibration velocity categorized per ISO 10816-3 machine groups.',
    },
    {
      name: 'Basic L10 Rating Life',
      symbol: 'L10h',
      unit: 'Hours',
      threshold: '> 25,000 hrs (API minimum)',
      description: 'Standard bearing fatigue life with 90% survival probability under static + dynamic loading.',
    },
    {
      name: 'ISO 281 Modified Life (L10mh)',
      symbol: 'L10mh',
      unit: 'Hours',
      threshold: '> 50,000 hrs (Refinery target)',
      description: 'Enhanced rating life accounting for lubrication elastohydrodynamic oil film (kappa) and contamination factor (eC).',
    },
  ],
  equations: [
    {
      title: 'ISO 1940 Permissible Residual Unbalance',
      formula: 'U_per = (1000 · G · m_rotor) / ω',
      variables: 'G = Balance grade (mm/s), m_rotor = Rotor mass (kg), ω = Angular velocity in rad/s (2π · N / 60). U_per is expressed in g·mm.',
      standardRef: 'ISO 1940-1:2003 §5.2',
    },
    {
      title: '1X Centrifugal Unbalance Force (Fc)',
      formula: 'F_c = (U_actual / 1000) · ω² = m_unbal · r · (2π·N / 60)²',
      variables: 'U_actual = Residual unbalance in g·mm, ω = Shaft rotational speed in rad/s. Resulting force F_c is in Newtons (N).',
      standardRef: 'ISO 1940 / Machinery Dynamics',
    },
    {
      title: 'ISO 281 Modified Bearing Rating Life',
      formula: 'L10mh = a1 · aISO · (C / P)^p · (10⁶ / (60 · n))',
      variables: 'a1 = Reliability factor (1.0 for 90%), aISO = Life modification factor f(κ, eC, Cu/P), C = Basic dynamic load rating (N), P = Combined equivalent load (N), p = Exponent (3 for ball, 10/3 for roller), n = Speed (RPM).',
      standardRef: 'ISO 281:2007 Clause 8',
    },
    {
      title: 'Lubrication Viscosity Ratio (Kappa κ)',
      formula: 'κ = ν / ν1',
      variables: 'ν = Actual kinematic viscosity of lubricant at operating temp (cSt), ν1 = Rated reference kinematic viscosity required for adequate film thickness based on pitch diameter (dm) and speed (n).',
      standardRef: 'ISO 281:2007 Annex A',
    },
  ],
  standards: [
    {
      code: 'ISO 1940-1:2003',
      title: 'Mechanical vibration - Balance quality requirements for rotors in a constant (rigid) state',
      relevantSection: 'Clause 5 (Determination of permissible residual unbalance)',
    },
    {
      code: 'ISO 281:2007',
      title: 'Rolling bearings - Dynamic load ratings and rating life',
      relevantSection: 'Clause 8 (Modified rating life calculation method including aISO factor)',
    },
    {
      code: 'ISO 10816-3:2009',
      title: 'Mechanical vibration - Evaluation of machine vibration by measurements on non-rotating parts',
      relevantSection: 'Group 1 & 2 Industrial Machines (Vibration velocity severity zones A, B, C, D)',
    },
  ],
  limitations: [
    'Rigid rotor assumption: Assumes operating speed is safely below the first flexible shaft bending critical speed (N < 0.70 · N_crit).',
    'Single-plane unbalance simplification: For long rotors with length-to-diameter ratio L/D > 2.0, dynamic two-plane balancing (static + couple unbalance) is required.',
    'Assumes standard ISO mineral lubricant elastohydrodynamic (EHD) lubrication film behavior without severe water contamination.',
  ],
  exampleCalculation: {
    title: 'Benchmark Verification: 1200 kg Overhung Boiler Feed Booster Rotor',
    scenario:
      'Determine ISO 1940 Grade G2.5 permissible unbalance, centrifugal force at 3000 RPM with 45 g·mm unbalance, and bearing life on spherical roller bearings (C = 285 kN, Static load = 6.0 kN).',
    given: [
      { label: 'Rotor Mass m', value: '1200 kg' },
      { label: 'Speed N', value: '3000 RPM (ω = 314.16 rad/s)' },
      { label: 'Balance Grade', value: 'ISO Grade G2.5' },
      { label: 'Actual Unbalance', value: '45.0 g·mm' },
      { label: 'Bearing Type', value: 'Spherical Roller (C=285 kN)' },
      { label: 'Static Radial Load', value: '6.0 kN' },
      { label: 'Lubricant', value: 'ISO VG 46 @ 60°C' },
    ],
    steps: [
      {
        step: 'ISO 1940 Permissible Unbalance (U_per)',
        formula: 'U_per = (1000 · G · m) / ω',
        substitution: '(1000 · 2.5 mm/s · 1200 kg) / 314.16 rad/s',
        result: '9,549 g·mm (or 4,775 g·mm per plane)',
      },
      {
        step: 'Centrifugal Unbalance Force (Fc)',
        formula: 'Fc = (U_actual / 1000) · ω²',
        substitution: '(45.0 / 1000) · (314.16)²',
        result: '4,441 N (4.44 kN)',
      },
      {
        step: 'Combined Equivalent Dynamic Bearing Load (P)',
        formula: 'P = W_static + Fc / 2',
        substitution: '6,000 N + (4,441 N / 2)',
        result: '8,221 N (8.22 kN)',
      },
      {
        step: 'Basic L10 Rating Life (L10h)',
        formula: 'L10h = (C / P)^(10/3) · (10⁶ / (60 · n))',
        substitution: '(285,000 / 8,221)^(3.333) · (10⁶ / (60 · 3000))',
        result: '694,000 hrs',
      },
      {
        step: 'ISO 281 Modified Life with aISO = 1.82 (κ = 1.45, eC = 0.65)',
        formula: 'L10mh = aISO · L10h',
        substitution: '1.82 · 694,000 hrs',
        result: '1,263,000 hrs (~144 years fatigue life)',
      },
    ],
    conclusion:
      'Actual residual unbalance (45 g·mm) is well within ISO G2.5 limits (9,549 g·mm). Centrifugal excitation is 4.44 kN. ISO 281 modified life exceeds 100,000 operating hours, confirming optimal reliability.',
  },
  faqs: [
    {
      question: 'What causes rotor unbalance in rotating machinery?',
      answer:
        'Rotor unbalance occurs when the mass center of gravity (principal inertia axis) does not coincide with the geometric rotational centerline. Root causes include manufacturing tolerances, uneven casting porosity, keyway asymmetry, thermal bowing, solid particle deposition/fouling on impellers, and uneven blade erosion over operating service.',
    },
    {
      question: 'How does dynamic unbalance reduce bearing life?',
      answer:
        'Centrifugal unbalance force scales with the square of shaft rotational speed (Fc ∝ ω²). This synchronous 1X dynamic load adds vectorially to the static weight load, increasing the equivalent bearing load P. Because bearing fatigue life scales inversely with the cube or 10/3 power of load (L10 ∝ (C/P)^p), doubling unbalance force can reduce bearing fatigue life by a factor of 8 to 10.',
    },
    {
      question: 'What is the physical meaning of the viscosity ratio kappa (κ) in ISO 281?',
      answer:
        'Kappa (κ = ν / ν1) represents the ratio of actual operating oil viscosity to the minimum rated viscosity needed to maintain full elastohydrodynamic (EHD) fluid separation between rolling elements and raceways. When κ < 1.0, boundary metal-to-metal contact occurs, causing micro-spalling and premature wear; when κ > 1.2 to 2.5, full fluid film separation yields maximum fatigue life.',
    },
    {
      question: 'What is the difference between ISO 1940 Grade G1.0, G2.5, and G6.3?',
      answer:
        'The grade number represents the permissible specific unbalance product (e_per · ω in mm/s). G1.0 is specified for high-speed gas turbines and machine tool spindles; G2.5 is the standard for API process pumps, electric motors, and steam turbines; G6.3 is standard for industrial process fans and general agricultural machinery.',
    },
  ],
  relatedTools: [
    {
      id: 'pump',
      title: 'Centrifugal Pump Cavitation & NPSH Simulator',
      description: 'Ensure adequate NPSH margin to prevent impeller blade cavitation erosion.',
      standard: 'API 610 / HI 9.6.1',
    },
    {
      id: 'pipe',
      title: 'Pipe Thermal Expansion and Stress Visualizer',
      description: 'Check piping nozzle loads to prevent machine casing distortion and shaft misalignment.',
      standard: 'ASME B31.3',
    },
    {
      id: 'seal',
      title: 'API Mechanical Seal Flush Plan Simulator',
      description: 'Verify seal face thermal hydraulics to prevent premature seal ring failure.',
      standard: 'API 682 4th Ed',
    },
  ],
};
