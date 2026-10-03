import { SimulatorDocSectionProps } from '../components/Shared/SimulatorDocSection';

export const PUMP_DOC_DATA: Omit<SimulatorDocSectionProps, 'simulatorId'> = {
  h1Title: 'Centrifugal Pump Cavitation & NPSH Simulator',
  summary:
    'Calculate Net Positive Suction Head Available (NPSHa), compare against vendor NPSHr (3% head reduction) curves, assess suction specific speed (Nss), identify vapor bubble inception risk, and ensure compliance with API 610 12th Edition and Hydraulic Institute (HI) 9.6.1 standards.',
  howItWorks: [
    'Static & Surface Head Resolution: Converts absolute suction vessel pressure (Patm or tank blanket pressure) and fluid elevation into absolute liquid column head (h_sp + h_s).',
    'Hydraulic Friction Loss Calculation: Solves Darcy-Weisbach friction head loss (h_f) using the Colebrook-White friction factor across equivalent pipe lengths and fittings.',
    'Vapor Pressure Head Deduction: Evaluates operating fluid temperature against Antoine vapor pressure relationships to subtract vapor head (h_vp).',
    'API 610 & HI 9.6.1 Margin Verification: Evaluates NPSHa against NPSHr across flow regimes to determine margin ratios and check suction specific speed (Nss) stability limits.',
  ],
  inputs: [
    {
      name: 'Process Fluid',
      symbol: 'Fluid',
      unit: 'Name / API',
      description: 'Physical process medium determining density, vapor pressure curve, and acoustic energy factor.',
    },
    {
      name: 'Operating Flow Rate',
      symbol: 'Q',
      unit: 'm³/h or GPM',
      description: 'Flow rate pumped through the system, compared against Best Efficiency Point (BEP).',
    },
    {
      name: 'Best Efficiency Flow (BEP)',
      symbol: 'Q_BEP',
      unit: 'm³/h or GPM',
      description: 'Manufacturer design flow rate where impeller inlet blade angle matches fluid approach vector.',
    },
    {
      name: 'Shaft Rotational Speed',
      symbol: 'N',
      unit: 'RPM',
      description: 'Rotational speed of the pump shaft, directly scaling NPSHr by affine affinity laws (N^2).',
    },
    {
      name: 'Static Suction Liquid Head',
      symbol: 'Z_s / h_s',
      unit: 'm or ft',
      description: 'Elevation of suction liquid surface relative to the pump impeller centerline (flooded vs suction lift).',
    },
    {
      name: 'Suction Vessel Pressure',
      symbol: 'P_suct / P_atm',
      unit: 'kPag or psig',
      description: 'Absolute or gauge pressure acting on the surface of the suction liquid supply.',
    },
    {
      name: 'Suction Line Diameter & Length',
      symbol: 'D_pipe, L_pipe',
      unit: 'mm, m (in, ft)',
      description: 'Internal pipe bore and equivalent developed length including valves, elbows, and strainers.',
    },
    {
      name: 'Fluid Operating Temperature',
      symbol: 'T_fluid',
      unit: '°C or °F',
      description: 'Operating temperature governing fluid vapor pressure (P_vap) and density (rho).',
    },
  ],
  outputs: [
    {
      name: 'NPSH Available (NPSHa)',
      symbol: 'NPSHa',
      unit: 'm or ft',
      threshold: 'NPSHa > NPSHr · Margin',
      description: 'Total absolute suction head available at the pump suction nozzle centerline above fluid vapor pressure.',
    },
    {
      name: 'NPSH Required (NPSHr / NPSH3)',
      symbol: 'NPSH3',
      unit: 'm or ft',
      threshold: 'Vendor Certified 3% Drop',
      description: 'Minimum suction head required by impeller inlet eye to limit head degradation to 3%.',
    },
    {
      name: 'NPSH Margin Ratio',
      symbol: 'Margin',
      unit: 'Ratio (x)',
      threshold: '≥ 1.10x to 1.30x (HI 9.6.1)',
      description: 'Ratio of NPSHa to NPSHr. Ratios below 1.0 indicate full cavitation; 1.0 to 1.2 indicate inception noise and erosion risk.',
    },
    {
      name: 'Suction Specific Speed',
      symbol: 'Nss (S)',
      unit: 'US / Metric',
      threshold: '< 11,000 US (< 8,500 Metric)',
      description: 'Dimensionless index describing suction impeller geometry. Values > 11,000 suffer narrow operating windows and suction recirculation.',
    },
    {
      name: 'Suction Line Velocity',
      symbol: 'V_suct',
      unit: 'm/s or ft/s',
      threshold: '1.0 to 2.5 m/s (3 to 8 ft/s)',
      description: 'Bulk liquid velocity inside the suction pipe. Excessive velocity induces vortexing and friction.',
    },
  ],
  equations: [
    {
      title: 'Net Positive Suction Head Available (NPSHa)',
      formula: 'NPSHa = (P_surface / (ρ · g)) + Z_s - h_f - (P_vap / (ρ · g))',
      variables: 'P_surface = Absolute pressure on liquid surface, ρ = Liquid density (kg/m³), g = Gravitational acceleration (9.81 m/s²), Z_s = Static elevation relative to centerline (m), h_f = Total suction friction loss (m), P_vap = True vapor pressure at operating temp (Pa).',
      standardRef: 'API 610 12th Ed §6.1.8 / HI 9.6.1',
    },
    {
      title: 'Darcy-Weisbach Friction Head Loss',
      formula: 'h_f = f · (L_eq / D_hyd) · (v² / (2 · g))',
      variables: 'f = Darcy friction factor (Colebrook-White solver), L_eq = Total equivalent pipe length including fittings (m), D_hyd = Hydraulic inside diameter (m), v = Mean bulk fluid velocity (m/s).',
      standardRef: 'Hydraulic Institute Engineering Data Book',
    },
    {
      title: 'Suction Specific Speed (Nss / S)',
      formula: 'Nss = (N · √Q) / (NPSHr)^0.75',
      variables: 'N = Pump rotational speed (RPM), Q = Flow rate at BEP per impeller eye (GPM in US units, m³/s in SI), NPSHr = Net positive suction head required at BEP (ft in US, m in SI).',
      standardRef: 'API 610 §6.1.11 / Hydraulic Institute 9.6.1',
    },
    {
      title: 'Recommended NPSH Margin Ratio',
      formula: 'Margin_req = max(1.10, 1.0 + 0.000015 · P_disch_head + K_fluid)',
      variables: 'K_fluid = Fluid vapor hydrocarbon correction factor (0.05 for cold water, 0.15 for light hydrocarbons near bubble point). Higher energy pumps mandate 1.2x to 1.5x margins.',
      standardRef: 'Hydraulic Institute 9.6.1-2017',
    },
  ],
  standards: [
    {
      code: 'API 610 12th Edition',
      title: 'Centrifugal Pumps for Petroleum, Petrochemical and Natural Gas Industries',
      relevantSection: 'Section 6.1.8 (NPSH Requirements) & Section 6.1.11 (Suction Specific Speed limits)',
    },
    {
      code: 'ANSI / HI 9.6.1-2017',
      title: 'Rotodynamic Pumps - Guideline for NPSH Margin',
      relevantSection: 'Tables 9.6.1.2.1 (Recommended NPSH margins by pump type, power rating, and fluid service)',
    },
    {
      code: 'ISO 5199',
      title: 'Technical specifications for centrifugal pumps - Class II',
      relevantSection: 'Clause 4.1.3 (Suction conditions and hydraulic performance limits)',
    },
  ],
  limitations: [
    'Vendor NPSHr represents a 3% head drop (NPSH3) under standard factory water testing; incipient cavitation bubbles form before 3% head reduction occurs.',
    'Assumes single-phase Newtonian liquid flow without entrained non-condensable gases or foaming.',
    'Suction line fittings use standard equivalent-length hydraulic approximations (Darcy K-method).',
    'Reciprocating acceleration head is not included (this simulator focuses on rotodynamic centrifugal equipment).',
  ],
  exampleCalculation: {
    title: 'Benchmark Verification: Refinery Heavy Gas Oil Booster Pump',
    scenario:
      'Evaluate NPSHa and margin for an API 610 OH2 process pump handling crude bottoms at 65°C from a vessel with 4.5 m flooded head.',
    given: [
      { label: 'Flow Rate Q', value: '280 m³/h (93% BEP)' },
      { label: 'Shaft Speed N', value: '2950 RPM' },
      { label: 'Fluid Density ρ', value: '865 kg/m³' },
      { label: 'Fluid Vapor Press P_vap', value: '31.2 kPa abs' },
      { label: 'Static Head Z_s', value: '+4.50 m (Flooded)' },
      { label: 'Suction Line', value: '200 mm Sch 40, L=15m' },
      { label: 'Vendor NPSHr', value: '3.80 m' },
    ],
    steps: [
      {
        step: 'Atmospheric Surface Head (h_sp)',
        formula: 'h_sp = P_atm / (ρ · g)',
        substitution: '101325 Pa / (865 kg/m³ · 9.81 m/s²)',
        result: '11.94 m',
      },
      {
        step: 'Vapor Pressure Head (h_vp)',
        formula: 'h_vp = P_vap / (ρ · g)',
        substitution: '31200 Pa / (865 kg/m³ · 9.81 m/s²)',
        result: '3.68 m',
      },
      {
        step: 'Suction Pipe Velocity & Friction Loss (h_f)',
        formula: 'v = 4Q / (π·D²), h_f = f·(L/D)·(v²/2g)',
        substitution: 'v = 2.48 m/s, f = 0.0165, h_f = 0.0165 · (15/0.2027) · (2.48² / 19.62)',
        result: '0.38 m',
      },
      {
        step: 'Net Positive Suction Head Available (NPSHa)',
        formula: 'NPSHa = h_sp + Z_s - h_f - h_vp',
        substitution: '11.94 m + 4.50 m - 0.38 m - 3.68 m',
        result: '12.38 m',
      },
      {
        step: 'NPSH Margin Ratio Assessment',
        formula: 'Margin = NPSHa / NPSHr',
        substitution: '12.38 m / 3.80 m',
        result: '3.26x (HI 9.6.1 Required: ≥ 1.20x)',
      },
    ],
    conclusion:
      'The system provides a 3.26x NPSH margin, well exceeding the API 610 / HI 9.6.1 minimum threshold of 1.20x. Suction specific speed is 8,450 US (< 11,000 limit), confirming safe continuous operation without cavitation erosion.',
  },
  faqs: [
    {
      question: 'What causes centrifugal pump cavitation?',
      answer:
        'Cavitation occurs when local static pressure inside the pump impeller eye drops below the vapor pressure of the pumped liquid at operating temperature. Microscopic vapor bubbles form, travel to higher-pressure regions along the vane surfaces, and violently implode. These shock waves produce acoustic noise (gravel sound), severe pitting erosion, and seal/bearing vibration.',
    },
    {
      question: 'How is the NPSH margin calculated?',
      answer:
        'The NPSH margin is calculated as the ratio NPSHa / NPSHr (or the absolute difference NPSHa - NPSHr). NPSHa is determined by the suction system hydraulics (surface pressure + elevation - friction - vapor pressure), while NPSHr is certified by the pump manufacturer during 3% head reduction water testing.',
    },
    {
      question: 'Why is Suction Specific Speed (Nss) limited to 11,000 in API 610?',
      answer:
        'Pumps with Nss > 11,000 (US units) feature oversized impeller eye inlets designed for low NPSHr at design point. However, at partial flow rates (< 80% BEP), high Nss impellers generate severe suction recirculation, high blade pass pressure pulsations, and shaft deflection that severely damages mechanical seals.',
    },
    {
      question: 'Does increasing the suction pipe diameter always improve NPSHa?',
      answer:
        'Yes, increasing suction pipe diameter reduces fluid velocity (v = 4Q / πD²), which quadratically reduces Darcy-Weisbach friction head loss (h_f ∝ v²). However, the pipe must not be so oversized that suspended solids settle or air pockets form in non-eccentric reducers.',
    },
  ],
  relatedTools: [
    {
      id: 'seal',
      title: 'API Mechanical Seal Flush Plan Simulator',
      description: 'Model seal chamber pressure and thermal flush balance to prevent seal face vaporization.',
      standard: 'API 682 4th Ed',
    },
    {
      id: 'rotor',
      title: 'Rotor Unbalance and Bearing Life Simulator',
      description: 'Calculate centrifugal unbalance forces and ISO 281 L10mh bearing fatigue life.',
      standard: 'ISO 1940 / 281',
    },
    {
      id: 'pipe',
      title: 'Pipe Thermal Expansion and Stress Visualizer',
      description: 'Verify thermal expansion growth and nozzle reaction loads connecting to the pump.',
      standard: 'ASME B31.3',
    },
  ],
};
