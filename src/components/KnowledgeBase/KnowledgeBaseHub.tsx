import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { RouteId, SimulatorId, UnitSystem } from '../../types/common';
import { LiveSimulatorsFooter } from '../Footer/LiveSimulatorsFooter';
import {
  BookOpen,
  Search,
  ArrowLeft,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Layers,
  Cpu,
  Flame,
  Wind,
  Cog,
  Activity,
  Compass,
  Disc,
  RotateCw,
  Target,
  Maximize2,
  Check,
  Sparkles,
  Info,
  Scale,
  BarChart3,
  Leaf,
  Droplet,
} from 'lucide-react';

interface KnowledgeBaseHubProps {
  initialTab?: 'standards' | 'methodology' | 'faq' | 'about';
}

interface StandardItem {
  code: string;
  title: string;
  edition: string;
  domain: string;
  simulatorId: SimulatorId;
  keyClauses: string[];
  deterministicCriteria: string;
  governingFormula: string;
  summary: string;
}

const STANDARDS_LIST: StandardItem[] = [
  {
    code: 'API 610 (12th Ed.)',
    title: 'Centrifugal Pumps for Petroleum, Petrochemical and Natural Gas Industries',
    edition: '12th Edition, 2021',
    domain: 'Centrifugal Pumps & Hydraulics',
    simulatorId: 'pump',
    keyClauses: [
      '§6.1.8 - NPSH margin evaluation: NPSHa must exceed vendor NPSHr by ≥ 1.0 m or a 1.35x safety ratio.',
      '§6.1.15 - Suction Specific Speed (N_ss): values above 11,000 (US) / 213 (metric) trigger suction recirculation risk.',
      'Annex F - Permissible nozzle forces and moments on pump casings to prevent internal rotor binding.',
    ],
    deterministicCriteria: 'NPSHa / NPSHr ≥ 1.35x (Hydrocarbons ≥ 1.0 m margin) • N_ss ≤ 11,000',
    governingFormula: 'NPSHa = (P_surface - P_vap) / (\\rho g) + Z_s - h_friction',
    summary: 'Establishes minimum requirements for centrifugal pumps in critical hydrocarbon services, covering cavitation margin, hydraulic operating envelopes, and casing nozzle stiffness.',
  },
  {
    code: 'API 612 (8th Ed.) / API 611',
    title: 'Petroleum, Petrochemical and Natural Gas Industries — Steam Turbines — Special-purpose',
    edition: '8th Edition / 5th Edition',
    domain: 'Industrial Steam Turbines',
    simulatorId: 'turbine',
    keyClauses: [
      '§2.4 - Speed control systems and governing droop limits (NEMA Class D 0.5% droop regulation).',
      '§3.2 - Blade natural frequency verification on Campbell diagrams (≥ 10% separation from nozzle passing).',
      '§4.1 - Critical speed lateral margin: First lateral critical must maintain ≥ 15% separation from operating speed.',
    ],
    deterministicCriteria: 'Campbell Margin ≥ 10% • Critical Speed Margin ≥ 15% • Exhaust Moisture ≤ 12%',
    governingFormula: 'W_sh = \\dot{m} (h_{in} - h_{ex}) \\cdot \\eta_s',
    summary: 'Governs high-reliability steam turbine drivers, requiring rigorous Campbell resonance auditing, isentropic enthalpy tracking, and moisture droplet erosion suppression.',
  },
  {
    code: 'API 617 (8th Ed.)',
    title: 'Axial and Centrifugal Compressors and Expander-compressors',
    edition: '8th Edition',
    domain: 'Centrifugal Compressors',
    simulatorId: 'compressor',
    keyClauses: [
      '§4.2 - Aerodynamic performance testing and surge limit definition per ASME PTC 10.',
      '§4.8 - Anti-surge control line (SCL) safety margin: minimum 10% volumetric buffer from Surge Limit Line (SLL).',
      '§5.3 - Dynamic thrust bearing load reversal under emergency depressurization conditions.',
    ],
    deterministicCriteria: 'Surge Safety Margin ≥ 10.0% mass flow • Recycle Valve Full-Stroke < 1.5s',
    governingFormula: 'SM = [(Q_{operating} - Q_{surge}) / Q_{operating}] \\times 100%',
    summary: 'Defines compressor aerodynamic operating envelope, stage polytropic head integration, and emergency anti-surge bypass valve trip dynamics.',
  },
  {
    code: 'API 618 (5th Ed.) / API 688',
    title: 'Reciprocating Compressors for Petroleum, Chemical, and Gas Industry Services',
    edition: '5th Edition / 1st Edition',
    domain: 'Reciprocating Compressors',
    simulatorId: 'recip',
    keyClauses: [
      '§6.3 - Rod load reversal requirement: Combined gas and inertia load must reverse sign for ≥ 15° of crank angle.',
      '§7.9 - Design Approach 3 acoustic pulsation simulation and mechanical piping resonance control.',
      'API 688 - Pulsation dampener sizing to limit peak-to-peak pressure pulses to ≤ 1.0% line pressure.',
    ],
    deterministicCriteria: 'Rod Load Reversal ≥ 15.0° crank angle • Peak Line Pulsation ≤ API 618 Formula',
    governingFormula: 'F_{rod}(\\theta) = A_{HE} P_{HE}(\\theta) - A_{CE} P_{CE}(\\theta) - m_{recip} r \\omega^2 [\\cos\\theta + (r/L)\\cos 2\\theta]',
    summary: 'Mandates crosshead pin lubrication reversal, indicator card P-V thermodynamics, interstage damper Helmholtz acoustic modeling, and cyclic fatigue integrity.',
  },
  {
    code: 'AGMA 2001-D04 / ISO 6336',
    title: 'Fundamental Rating Factors and Calculation Methods for Involute Spur and Helical Gear Teeth',
    edition: 'AGMA 2001-D04 / ISO 6336:2019',
    domain: 'Industrial Gearboxes',
    simulatorId: 'gearbox',
    keyClauses: [
      'AGMA 2001 §8 - Pitting resistance contact stress calculation with dynamic factor K_v and load distribution K_m.',
      'AGMA 2001 §9 - Root bending fatigue stress calculation with Lewis geometry factor J.',
      'AGMA 9005-F16 - Industrial gear lubrication regimes and minimum elastohydrodynamic film ratio λ.',
    ],
    deterministicCriteria: 'Contact Margin S_H ≥ 1.25 • Bending Margin S_F ≥ 1.40 • EHL Film Ratio λ ≥ 2.0',
    governingFormula: 'S_H = [\\sigma_{HP} Z_N Z_W / (S_T K_T K_R)] / \\sigma_H \\ge 1.25',
    summary: 'Standard for high-power industrial gear drives, establishing tooth surface contact pitting and root bending fatigue safety limits, hunting tooth recurrence, and mesh vibration harmonics.',
  },
  {
    code: 'API 684 (2nd Ed.) / API 670',
    title: 'API Standard Paragraphs Rotordynamics Tutorial & Machinery Protection Systems',
    edition: '2nd Edition / 5th Edition',
    domain: 'Hydrodynamic Journal Bearings',
    simulatorId: 'journal',
    keyClauses: [
      'API 684 §2.5 - Rotordynamic stability analysis: Subsynchronous oil whirl & oil whip onset verification.',
      'API 684 §3.1 - Minimum logarithmic decrement δ > 0.1 for lateral damped critical speeds.',
      'API 670 §4.2 - Eddy current proximity probe installation and displacement alarm limits: A = 25.4 × √(12000/N) µm.',
    ],
    deterministicCriteria: 'Logarithmic Decrement δ > 0.10 • Stability Ratio ≥ 1.5x • Babbitt Temp ≤ 100°C',
    governingFormula: 'S = (R/C)^2 \\cdot (\\mu N / P_{unit})',
    summary: 'Defines hydrodynamic sleeve and tilting-pad bearing lubrication stability, Sommerfeld number equilibrium, cross-coupled stiffness destabilization, and proximity probe displacement limits.',
  },
  {
    code: 'ISO 281:2007 / ISO 15243',
    title: 'Rolling Bearings — Dynamic Load Ratings and Rating Life / Damage & Failures',
    edition: 'ISO 281:2007 / ISO 15243:2017',
    domain: 'Rolling Element Bearings',
    simulatorId: 'bearing',
    keyClauses: [
      'ISO 281 §8 - Modified reference rating life L10mh incorporating lubrication factor a_ISO and contamination e_C.',
      'Harris Kinematics - Fundamental fault frequency orders: BPFO, BPFI, BSF, and FTF.',
      'ISO 15243 - Six damage mechanisms: Fatigue, Wear, Corrosion, Electrical Erosion, Plastic Deformation, and Cracking.',
    ],
    deterministicCriteria: 'L10mh ≥ 25,000 operating hours • Viscosity Ratio κ ≥ 1.2 • Shock Kurtosis ≤ 3.0',
    governingFormula: 'L_{10mh} = a_1 \\cdot a_{ISO} \\cdot (C/P)^p \\cdot [10^6 / (60 N)]',
    summary: 'Governs rolling element bearing fatigue life under elastohydrodynamic lubrication, non-synchronous kinematic impact frequencies, and 4-stage high-frequency demodulated degradation.',
  },
  {
    code: 'ISO 1940-1:2003 / ISO 20816-3',
    title: 'Mechanical Vibration — Balance Quality Requirements / Machinery Vibration Evaluation',
    edition: 'ISO 1940-1:2003 / ISO 20816-3:2018',
    domain: 'Rotor Dynamics & Balancing',
    simulatorId: 'rotor',
    keyClauses: [
      'ISO 1940 §5 - Balance quality grade G (e.g. G2.5 for general turbomachinery, G1.0 for high precision).',
      'ISO 1940 §6 - Permissible residual unbalance U_per = 1000 × G × m_rotor / ω.',
      'ISO 20816-3 - Vibration severity evaluation zones: Zone A (Newly commissioned), Zone B (Unrestricted), Zone C (Alarm), Zone D (Trip).',
    ],
    deterministicCriteria: 'Residual Unbalance ≤ U_per (Grade G2.5) • Vibration in ISO 20816-3 Zone A or B',
    governingFormula: 'U_{per} = 9549 \\cdot G \\cdot m_{rotor} / N',
    summary: 'Specifies permissible centrifugal unbalance for rigid and flexible rotors, static vs couple unbalance vector decomposition, and vibration velocity severity zones.',
  },
  {
    code: 'API 686 (2nd Ed.) / AGMA 9000',
    title: 'Recommended Practice for Machinery Installation and Installation Design - Chapter 7 Alignment',
    edition: '2nd Edition',
    domain: 'Shaft Alignment & Coupling',
    simulatorId: 'alignment',
    keyClauses: [
      'Chapter 7 §4.2 - Cold alignment offset compensation for operating thermal casing growth.',
      'Chapter 7 §5.1 - Permissible residual hot operating offset: ≤ 0.05 mm (0.002 in) parallel and ≤ 0.5 mrad angular.',
      'Chapter 5 §3.1 - Soft foot verification: Maximum 0.05 mm deflection when any single anchor bolt is loosened.',
    ],
    deterministicCriteria: 'Hot Running Offset ≤ 0.05 mm • Angular Tilt ≤ 0.5 mrad • Soft Foot ≤ 0.05 mm',
    governingFormula: '\\Delta Y_{thermal} = \\alpha \\cdot L_{foot-cl} \\cdot (T_{case} - T_{ambient})',
    summary: 'Field guidelines for rotating machinery shaft alignment, reverse indicator dial setups, thermal growth vector compensation, and soft-foot prevention.',
  },
  {
    code: 'ASME B31.3:2022 §319 / API 610 Annex F',
    title: 'Process Piping Code — Section 319 Piping Flexibility and Thermal Expansion Stress',
    edition: '2022 Edition',
    domain: 'Piping Thermal Stress',
    simulatorId: 'pipe',
    keyClauses: [
      '§319.4.4 - Allowable displacement stress range S_A = f [1.25(S_c + S_h) - S_L] for cyclic thermal expansion.',
      '§319.3.6 - Stress Intensification Factors (i-factors) for forged elbows, tees, and welded branch connections.',
      'API 610 Annex F - Machinery nozzle load envelope checks to prevent casing distortion and bearing misalignment.',
    ],
    deterministicCriteria: 'Expansion Stress S_E ≤ S_A • Nozzle Forces & Moments ≤ API 610 Table 5 Limits',
    governingFormula: 'S_A = f [1.25(S_c + S_h) - S_L]',
    summary: 'Governs thermal expansion flexibility in process piping systems, calculating anchor reaction forces, expansion loop sizing, and machinery nozzle load limits.',
  },
  {
    code: 'API 682 (4th Ed.) / ISO 21049',
    title: 'Pumps — Shaft Sealing Systems for Centrifugal and Rotary Pumps',
    edition: '4th Edition',
    domain: 'Mechanical Seal Flush Plans',
    simulatorId: 'seal',
    keyClauses: [
      'Annex A - Seal piping plan selection logic (Plan 11, 23, 31, 52, 53A, 53B, 54).',
      'Annex C - Minimum vapor pressure margin: Seal chamber pressure must exceed fluid bubble point by ≥ 200 kPa.',
      '§6.1 - Barrier fluid reservoir overpressure: Minimum 1.4 bar (20 psi) over maximum seal chamber pressure.',
    ],
    deterministicCriteria: 'Vapor Pressure Margin ΔP_vap ≥ 200 kPa • Barrier Overpressure ≥ 1.4 bar (Plan 53)',
    governingFormula: 'Q_{face} = f_{fric} \\cdot P_{net} \\cdot A_{face} \\cdot V_{mean}',
    summary: 'Defines mechanical seal piping plans, seal face frictional heat balance, flush flow orifice hydraulic sizing, and barrier fluid containment reliability.',
  },
  {
    code: 'IEC 62740:2015 / ISO 18436-2',
    title: 'Root Cause Analysis (RCA) & Condition Monitoring and Diagnostics of Machine Systems',
    edition: 'IEC 62740:2015 / ISO 18436-2:2014',
    domain: 'Forensic Failure Analysis & RCA',
    simulatorId: 'rotor',
    keyClauses: [
      'IEC 62740 §6 - 5-Whys and Ishikawa causality verification: Distinguish physical mechanisms from latent systemic faults.',
      'ISO 18436-2 §7 - Vibration diagnostic severity mapping and cross-channel orbit phase correlation.',
      'API 691 §5 - Risk-based machinery execution and failure mode effect criticality analysis (FMECA).',
    ],
    deterministicCriteria: 'Causal Chain Completeness 100% • High-RPN Risk Mitigation Verification',
    governingFormula: '\\text{RPN} = S \\times O \\times D \\quad (\\text{Severity} \\times \\text{Occurrence} \\times \\text{Detection})',
    summary: 'Governs systematic engineering incident investigations, Ishikawa 6M classification, 5-Whys causal chaining, and prioritized CAPA tracking.',
  },
  {
    code: 'ISO 4406:2021 / ASTM D341',
    title: 'Hydraulic Fluid Power — Contamination Coding / Standard Practice for Viscosity-Temperature Charts',
    edition: 'ISO 4406:2021 / ASTM D341-20e1',
    domain: 'Lubrication Tribology & Fluid Health',
    simulatorId: 'bearing',
    keyClauses: [
      'ISO 4406 §4 - Multi-scale solid particle classification (>4 µm / >6 µm / >14 µm scale codes).',
      'ASTM D341 Walther Equation - Kinematic viscosity log-log transformation over operating temperature.',
      'DIN 51825 - Industrial grease relubrication intervals based on speed factor n·dm and temperature derating.',
    ],
    deterministicCriteria: 'ISO 4406 Target ≤ 16/14/11 • Viscosity Ratio κ ≥ 1.5 • Moisture ≤ 200 ppm',
    governingFormula: '\\log_{10}(\\log_{10}(\\nu + 0.7)) = A - B \\cdot \\log_{10}(T_K)',
    summary: 'Standardizes particulate contamination grading, ASTM Walther temperature-viscosity curves, Noria wear life extension factors, and Karl Fischer moisture saturation limits.',
  },
  {
    code: 'ISO/IEC Guide 98-3 (GUM) / ASME B89.7',
    title: 'Uncertainty of Measurement — Part 3: Guide to the Expression of Uncertainty in Measurement',
    edition: 'JCGM 100:2008 / ASME B89.7.3.1',
    domain: 'Probabilistic Tolerance & Risk',
    simulatorId: 'pump',
    keyClauses: [
      'GUM §4 - Type A statistical evaluation vs Type B systematic tolerance variance propagation.',
      'GUM §5 - Combined standard uncertainty uc(y) and sensitivity coefficients via partial derivatives.',
      'ASME B89.7.3.1 - Decision rules for proving conformance to specifications with guard-banding.',
    ],
    deterministicCriteria: '90% Confidence Interval P5-P95 • Defect/Violation Probability < 2.5%',
    governingFormula: 'u_c^2(y) = \\sum_{i=1}^N \\left( \\frac{\\partial f}{\\partial x_i} \\right)^2 u^2(x_i)',
    summary: 'Guides stochastic Monte Carlo tolerance stack-up and probabilistic risk simulation, calculating cumulative density functions and tornado parameter sensitivities.',
  },
  {
    code: 'ISO 14040:2006 / ISO 15663',
    title: 'Environmental Management — Life Cycle Assessment / Petroleum Industries — Life Cycle Costing',
    edition: 'ISO 14040:2006 / ISO 15663:2021',
    domain: 'Exergy Destruction & Decarbonization',
    simulatorId: 'compressor',
    keyClauses: [
      'ISO 14040 §5 - Scope 2 GHG accounting from rotating machinery electricity consumption.',
      'ISO 15663 §4 - 10-year and 20-year net present value (NPV) life-cycle cost modeling.',
      'ASME PTC 10 §5 - Second-law exergy analysis separating useful thermodynamic fluid work from dissipative friction.',
    ],
    deterministicCriteria: '2nd-Law Exergy Efficiency ≥ 75% • Decarbonization Payback < 24 Months',
    governingFormula: '\\dot{E}x_{dest} = T_0 \\cdot \\dot{S}_{gen} = W_{in} - \\Delta \\dot{E}x_{fluid}',
    summary: 'Specifies second-law exergy destruction quantification, continuous carbon emission rates (kg CO2e/hr), and ISO 15663 decarbonization abatement paybacks.',
  },
];

interface FAQItem {
  id: string;
  category: 'Turbomachinery' | 'Tribology' | 'Piping & Dynamics' | 'Diagnostics';
  question: string;
  answer: string;
  standardsRef: string;
  recommendedSimulator: SimulatorId;
}

const FAQS_LIST: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Turbomachinery',
    question: 'Why does my pump experience cavitation damage even though NPSHa exceeds catalog NPSHr by 0.5 meters?',
    answer: 'Catalog NPSHr is typically measured at 3% head reduction (NPSH3). At this operating point, millions of microscopic vapor bubbles are already collapsing against the impeller eye, producing localized micro-jets up to 1,000 MPa. API 610 §6.1.8 mandates that NPSHa must exceed NPSHr by at least 1.0 m or a margin ratio of 1.35x (higher for water near boiling point). Furthermore, operating far from BEP triggers suction recirculation, causing cavitation regardless of bulk NPSH.',
    standardsRef: 'API 610 12th Ed §6.1.8 & Hydraulic Institute HI 9.6.1',
    recommendedSimulator: 'pump',
  },
  {
    id: 'faq-2',
    category: 'Turbomachinery',
    question: 'How do I differentiate between centrifugal compressor surge and aerodynamic rotating stall on spectral plots?',
    answer: 'Rotating stall is a localized flow separation that rotates at 20% - 70% of rotor speed, manifesting as discrete subsynchronous peaks without catastrophic bulk flow reversal. Surge is a global system instability where the entire gas column oscillates back through the compressor. Surge produces severe broadband low-frequency pressure pulsations (0.2X - 0.5X), massive axial thrust reversals, and rapid temperature spikes on inactive thrust pads.',
    standardsRef: 'API 617 8th Ed §4.2 & ASME PTC 10',
    recommendedSimulator: 'compressor',
  },
  {
    id: 'faq-3',
    category: 'Turbomachinery',
    question: 'What causes last-stage blade erosion in condensing steam turbines, and how can it be detected early?',
    answer: 'As steam expands through a condensing turbine into the wet region past the Wilson line, microscopic moisture droplets nucleate. In the last stages (L-0, L-1), high peripheral blade tip speeds (often > 400 m/s) cause high-velocity impact with slow-moving liquid droplets, causing liquid droplet impingement erosion (LDIE). Early symptoms include subtle drops in stage isentropic efficiency, elevated casing drain temperatures, and blade resonance shifts detectable on Campbell diagrams.',
    standardsRef: 'API 612 8th Ed §3.2 & ASME PTC 6',
    recommendedSimulator: 'turbine',
  },
  {
    id: 'faq-4',
    category: 'Tribology',
    question: 'How can I distinguish oil whirl from oil whip in a hydrodynamic journal bearing?',
    answer: 'Both produce subsynchronous shaft vibration in the 0.43X - 0.48X frequency range. Oil whirl is an unstable fluid wedge precession that tracks shaft speed (it remains at ~0.45X of running speed as RPM increases). When shaft speed increases to twice the rotor lateral critical frequency, the oil whirl frequency locks onto the rotor critical speed (ω_whirl = ω_critical). At this point, it becomes Oil Whip—a violent self-excited resonance that does not increase with higher RPM and can cause immediate babbitt wipe.',
    standardsRef: 'API 684 Rotordynamics Tutorial §2.5',
    recommendedSimulator: 'journal',
  },
  {
    id: 'faq-5',
    category: 'Tribology',
    question: 'When should an engineer select API Plan 53A vs Plan 53B vs Plan 54 for a dual mechanical seal?',
    answer: 'Plan 53A uses an external pressurized reservoir with nitrogen blanketing (ideal for pressures < 10 bar). Plan 53B uses an internal bladder accumulator, avoiding nitrogen gas absorption into the barrier fluid (essential for high pressures up to 40 bar or fluctuating temperatures). Plan 54 circulates clean barrier fluid from an external centralized closed-loop lubrication system, best suited for extreme heat, polymerizing fluids, or multiple pump installations.',
    standardsRef: 'API 682 4th Ed Annex A & Annex C',
    recommendedSimulator: 'seal',
  },
  {
    id: 'faq-6',
    category: 'Diagnostics',
    question: 'How do I distinguish 1X unbalance from 1X bent shaft or angular shaft misalignment?',
    answer: 'A pure unbalance produces dominant 1X radial vibration that is 90° out of phase between horizontal and vertical directions, with very low axial vibration. Angular misalignment produces significant 1X and 2X axial vibration with a 180° phase shift across the coupling. A bent shaft produces high 1X axial vibration with a 180° phase difference across the rotor span, even when the machine is decoupled and rolled slowly by hand.',
    standardsRef: 'ISO 20816-3 & API 686 Chapter 7',
    recommendedSimulator: 'alignment',
  },
  {
    id: 'faq-7',
    category: 'Piping & Dynamics',
    question: 'What is "pipe strain" and how does it destroy rotating equipment bearings and seals?',
    answer: 'Pipe strain occurs when piping flanges do not naturally align with machinery nozzles and are forced into place by flange bolt torquing. As the piping heats up in service, thermal expansion forces act on the casing. This warps the machinery casing, displacing bearing centerlines and producing severe angular misalignment. The result is continuous 2X cyclic vibration, premature bearing spalling, and mechanical seal face distortion.',
    standardsRef: 'ASME B31.3 §319 & API 686 Chapter 6',
    recommendedSimulator: 'pipe',
  },
  {
    id: 'faq-8',
    category: 'Diagnostics',
    question: 'What are the 4 distinct stages of rolling element bearing degradation?',
    answer: 'Stage 1: Subsurface micro-fissures (detected via ultrasonic emission > 20 kHz, no change in standard velocity). Stage 2: Minor surface defects ring natural frequencies of bearing components (500 Hz - 2 kHz, high shock pulse kurtosis). Stage 3: Clear bearing defect frequencies (BPFO, BPFI, BSF) with 1X sidebands appear in the velocity spectrum. Stage 4: Widespread spalling destroys component geometry, defect peaks merge into a broad random noise floor, high 1X vibration emerges, and catastrophic lockup is imminent.',
    standardsRef: 'ISO 15243:2017 & ISO 281:2007',
    recommendedSimulator: 'bearing',
  },
  {
    id: 'faq-9',
    category: 'Diagnostics',
    question: 'How does the 5-Whys methodology prevent premature physical component replacement without resolving root cause?',
    answer: 'Traditional maintenance often stops at the physical symptom (e.g. replacing a wiped bearing or warped seal face). The 5-Whys methodology forces investigation through 3 causal tiers: Physical (e.g. loss of lubrication film), Operational/Process (e.g. operating at deadhead triggering suction recirculation), and Latent Organizational (e.g. absence of interlock logic or maintenance calibration procedures). True CAPA actions address the latent cause to prevent recurrence across the entire fleet.',
    standardsRef: 'IEC 62740:2015 & ISO 18436-2',
    recommendedSimulator: 'rotor',
  },
  {
    id: 'faq-10',
    category: 'Tribology',
    question: 'What is the significance of the 3 numbers in an ISO 4406 cleanliness rating (e.g., 18/16/13)?',
    answer: 'ISO 4406 allocates scale numbers representing particle count concentrations per milliliter across 3 size thresholds: >4 µm, >6 µm, and >14 µm. Each increase of 1 in the scale number represents a doubling of particle concentration. Particles in the 4-6 µm range are particularly lethal because dynamic oil film thicknesses in journal and rolling bearings range between 1 and 5 µm, causing three-body abrasive cutting wear and surface fatigue.',
    standardsRef: 'ISO 4406:2021 & ASTM D341',
    recommendedSimulator: 'bearing',
  },
  {
    id: 'faq-11',
    category: 'Piping & Dynamics',
    question: 'Why is Monte Carlo stochastic simulation superior to worst-case stack-up in machinery tolerance analysis?',
    answer: 'Worst-case tolerance stack-up assumes all manufacturing, thermal, and dynamic variances simultaneously align at their extreme worst-case limits, leading to prohibitively expensive over-design. Monte Carlo simulation samples real-world probability distributions (Gaussian, Uniform) over thousands of iterations. Per ISO/IEC Guide 98-3 (GUM), this yields realistic defect probabilities, 95% confidence intervals, and Tornado sensitivity rankings indicating which specific tolerances matter.',
    standardsRef: 'ISO/IEC Guide 98-3 (GUM) & ASME B89.7.3.1',
    recommendedSimulator: 'pump',
  },
  {
    id: 'faq-12',
    category: 'Turbomachinery',
    question: 'What is the difference between 1st-Law efficiency and 2nd-Law exergy efficiency in rotating machinery?',
    answer: 'First-law thermal/mechanical efficiency only accounts for energy conservation (useful fluid work divided by input power). It treats all heat and pressure equally. Second-law exergy analysis measures the quality and work potential of energy, quantifying irreversible exergy destruction (entropy generation) caused by viscous dissipation, turbulent mixing, and throttling. Exergy analysis reveals the true thermodynamic cost and carbon abatement potential.',
    standardsRef: 'ISO 14040:2006 & ISO 15663:2021',
    recommendedSimulator: 'compressor',
  },
];

export const KnowledgeBaseHub: React.FC<KnowledgeBaseHubProps> = ({ initialTab = 'standards' }) => {
  const {
    activeRoute,
    setActiveRoute,
    unitSystem,
    openComparatorWith,
    setIsRcaStudioOpen,
    setIsTribologyLabOpen,
    setIsMonteCarloOpen,
    setIsExergyCarbonOpen,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'standards' | 'methodology' | 'faq' | 'about'>(
    activeRoute === 'methodology'
      ? 'methodology'
      : activeRoute === 'faq'
      ? 'faq'
      : activeRoute === 'about'
      ? 'about'
      : initialTab
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');

  // Sync tab with activeRoute
  useEffect(() => {
    if (activeRoute === 'standards') setActiveTab('standards');
    else if (activeRoute === 'methodology') setActiveTab('methodology');
    else if (activeRoute === 'faq') setActiveTab('faq');
    else if (activeRoute === 'about') setActiveTab('about');
  }, [activeRoute]);

  const filteredStandards = useMemo(() => {
    return STANDARDS_LIST.filter((std) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        std.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        std.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        std.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        std.summary.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDomain = selectedDomain === 'all' || std.domain.toLowerCase().includes(selectedDomain.toLowerCase());
      return matchesSearch && matchesDomain;
    });
  }, [searchQuery, selectedDomain]);

  const filteredFaqs = useMemo(() => {
    return FAQS_LIST.filter((faq) => {
      return (
        searchQuery.trim() === '' ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.standardsRef.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [searchQuery]);

  return (
    <div className="w-full h-full flex flex-col bg-[#080b0f] text-[#d1d5db] font-sans overflow-hidden">
      {/* Top Header & Breadcrumb Bar */}
      <div className="px-4 sm:px-8 py-3.5 bg-[#0d1117] border-b border-[#21262d] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveRoute('home')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-xs font-mono text-[#c9d1d9] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Dashboard</span>
          </button>
          <div className="h-4 w-[1px] bg-[#30363d]" />
          <div className="flex items-center gap-2 text-xs font-mono">
            <BookOpen size={15} className="text-[#f27d26]" />
            <span className="text-white font-bold uppercase tracking-wider">Engineering Knowledge & Governance</span>
            <span className="px-2 py-0.5 rounded bg-[#f27d26]/10 border border-[#f27d26]/30 text-[#f27d26] text-[10px] hidden sm:inline">
              API / ISO / ASME / AGMA
            </span>
          </div>
        </div>

        {/* Tab Navigation Pills */}
        <div className="flex items-center gap-1 p-1 bg-[#161b22] border border-[#30363d] rounded-lg text-xs font-mono">
          <button
            onClick={() => {
              setActiveTab('standards');
              setActiveRoute('standards');
            }}
            className={`px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'standards'
                ? 'bg-[#f27d26] text-black font-bold'
                : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
            }`}
          >
            <Scale size={13} />
            <span>Standards Matrix</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('methodology');
              setActiveRoute('methodology');
            }}
            className={`px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'methodology'
                ? 'bg-[#f27d26] text-black font-bold'
                : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
            }`}
          >
            <FileText size={13} />
            <span>Methodology</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('faq');
              setActiveRoute('faq');
            }}
            className={`px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'faq'
                ? 'bg-[#f27d26] text-black font-bold'
                : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
            }`}
          >
            <HelpCircle size={13} />
            <span>Field FAQ</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('about');
              setActiveRoute('about');
            }}
            className={`px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'about'
                ? 'bg-[#f27d26] text-black font-bold'
                : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
            }`}
          >
            <Info size={13} />
            <span>Architecture</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Strip */}
      <div className="px-4 sm:px-8 py-3 bg-[#111620] border-b border-[#21262d] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
          <input
            type="text"
            placeholder={
              activeTab === 'standards'
                ? 'Search standards by code (API 612, ISO 281), clause, or keyword...'
                : activeTab === 'methodology'
                ? 'Search physics formulations, equations, or failure mechanisms...'
                : 'Search engineering field questions, failure symptoms, or codes...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#161b22] border border-[#30363d] rounded text-xs font-mono text-white placeholder-[#8b949e] focus:border-[#f27d26] outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setIsRcaStudioOpen(true)}
            title="Launch Forensic RCA & Ishikawa Studio (IEC 62740)"
            className="px-2.5 py-1.5 bg-[#161b22] hover:bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ShieldCheck size={13} className="text-rose-400" />
            <span>RCA Studio</span>
          </button>

          <button
            onClick={() => setIsTribologyLabOpen(true)}
            title="Launch Tribology & ISO 4406 Cleanliness Lab"
            className="px-2.5 py-1.5 bg-[#161b22] hover:bg-amber-950/60 border border-amber-500/40 text-amber-300 rounded transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Droplet size={13} className="text-amber-400" />
            <span>Tribology Lab</span>
          </button>

          <button
            onClick={() => setIsMonteCarloOpen(true)}
            title="Launch Monte Carlo Probabilistic Tolerance Simulator (GUM)"
            className="px-2.5 py-1.5 bg-[#161b22] hover:bg-purple-950/60 border border-purple-500/40 text-purple-300 rounded transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <BarChart3 size={13} className="text-purple-400" />
            <span>Monte Carlo</span>
          </button>

          <button
            onClick={() => setIsExergyCarbonOpen(true)}
            title="Launch Exergy Destruction & Decarbonization Simulator (ISO 14040)"
            className="px-2.5 py-1.5 bg-[#161b22] hover:bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Leaf size={13} className="text-emerald-400" />
            <span>Exergy & Carbon</span>
          </button>

          <button
            onClick={() => openComparatorWith('turbine', 'compressor')}
            className="px-2.5 py-1.5 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-[#c9d1d9] hover:text-white rounded transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Layers size={13} className="text-[#38bdf8]" />
            <span>Comparator</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 space-y-6">
        {/* TAB 1: STANDARDS MATRIX */}
        {activeTab === 'standards' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#21262d] pb-4">
              <div>
                <h1 className="text-xl font-bold text-white font-mono uppercase tracking-wider">
                  Governing Standards & Acceptance Criteria Matrix
                </h1>
                <p className="text-xs text-[#8b949e] font-mono mt-1">
                  Cross-referenced engineering specifications, standard editions, mandatory clauses, and quantitative pass/fail thresholds.
                </p>
              </div>
              <div className="text-xs font-mono text-[#8b949e] bg-[#161b22] px-3 py-1.5 rounded border border-[#21262d]">
                Showing <span className="text-white font-bold">{filteredStandards.length}</span> Standards
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {filteredStandards.map((std) => (
                <div
                  key={std.code}
                  className="bg-[#0d1117] border border-[#21262d] hover:border-[#30363d] rounded-lg p-4 sm:p-5 flex flex-col justify-between gap-4 font-mono transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#f27d26]">{std.domain}</span>
                        <h2 className="text-sm sm:text-base font-bold text-white mt-0.5">{std.code}</h2>
                        <div className="text-[11px] text-[#8b949e] leading-snug mt-0.5">{std.title}</div>
                      </div>
                      <span className="px-2 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-[10px] text-white shrink-0">
                        {std.edition}
                      </span>
                    </div>

                    <p className="text-xs text-[#c9d1d9] leading-relaxed font-sans">
                      {std.summary}
                    </p>

                    {/* Governing Equation Box */}
                    <div className="p-2.5 bg-[#161b22] border border-[#21262d] rounded">
                      <div className="text-[10px] uppercase font-bold text-[#8b949e] mb-1">Governing Mathematical Relation:</div>
                      <code className="text-xs text-[#38bdf8] font-bold block overflow-x-auto">
                        {std.governingFormula}
                      </code>
                    </div>

                    {/* Key Clauses */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] uppercase font-bold text-[#8b949e]">Key Clauses & Requirements:</div>
                      <ul className="space-y-1 text-xs text-[#c9d1d9]">
                        {std.keyClauses.map((clause, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 leading-snug">
                            <span className="text-[#f27d26] shrink-0 mt-0.5">•</span>
                            <span>{clause}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Card Bottom: Deterministic Pass/Fail Criteria & Launch Twin Button */}
                  <div className="pt-3 border-t border-[#21262d] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="text-[11px] font-mono">
                      <span className="text-[#8b949e] block text-[9px] uppercase">DETERMINISTIC TARGET</span>
                      <span className="text-emerald-400 font-bold">{std.deterministicCriteria}</span>
                    </div>

                    <button
                      onClick={() => setActiveRoute(std.simulatorId)}
                      className="px-3 py-1.5 bg-[#161b22] hover:bg-[#f27d26] hover:text-black border border-[#30363d] hover:border-[#f27d26] text-white rounded text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <span>Launch Twin</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CALCULATION & PHYSICS METHODOLOGY */}
        {activeTab === 'methodology' && (
          <div className="space-y-6 max-w-5xl mx-auto font-mono text-xs">
            <div className="border-b border-[#21262d] pb-4">
              <h1 className="text-xl font-bold text-white uppercase tracking-wider">
                Calculation Methodology & Physics Formulations
              </h1>
              <p className="text-xs text-[#8b949e] mt-1">
                Deterministic Float64 mathematical formulations, fluid thermodynamics, and rotordynamic relationships implemented across all 11 simulators.
              </p>
            </div>

            {/* Architecture Statement */}
            <div className="p-4 rounded-lg bg-[#111620] border border-[#38bdf8]/30 space-y-2">
              <div className="flex items-center gap-2 text-[#38bdf8] font-bold text-sm">
                <CheckCircle2 size={16} />
                <span>Deterministic Physics vs Stochastic Prediction</span>
              </div>
              <p className="text-[#c9d1d9] leading-relaxed font-sans">
                Every calculation in Mechanical Lab Pro runs locally in the client using deterministic, standards-aligned physics routines written in pure TypeScript. No physics calculations are generated or estimated by generative LLMs. This guarantees zero hallucination, repeatable results to 6 decimal places, and strict adherence to API, ISO, AGMA, and ASME equations.
              </p>
            </div>

            {/* Detailed Physics Modules */}
            <div className="space-y-4">
              {/* Module 1: Turbomachinery Thermodynamics */}
              <div className="p-4 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Flame size={16} className="text-amber-400" />
                  <span>1. Turbomachinery Thermodynamics & Steam Expansion (API 612 / ASME PTC 6)</span>
                </div>
                <p className="text-[#8b949e] font-sans leading-relaxed">
                  Steam properties are calculated using simplified 2D polynomial surface fits derived from the IAPWS-IF97 steam tables. Inlet enthalpy h_in and entropy s_in are determined from inlet pressure P_in and temperature T_in. The isentropic expansion path to exhaust pressure P_ex determines ideal isentropic enthalpy h_ex,s. Actual work is calculated as:
                </p>
                <div className="p-3 bg-[#161b22] border border-[#30363d] rounded text-[#38bdf8]">
                  <code>{'W_sh = \\dot{m} \\cdot (h_{in} - h_{ex,s}) \\cdot \\eta_s'}</code>
                </div>
                <p className="text-[#8b949e] font-sans leading-relaxed">
                  Exhaust steam moisture content y is calculated from the Mollier dryness fraction x. If moisture exceeds the API 612 limit of 12%, erosion risk is flagged. Blade resonance is computed by intersecting the nozzle passing frequency NPF = Z_nozzle × (RPM/60) with blade natural frequencies on a Campbell diagram.
                </p>
              </div>

              {/* Module 2: Centrifugal Compressor Polytropic Compression */}
              <div className="p-4 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Wind size={16} className="text-blue-400" />
                  <span>2. Polytropic Gas Compression & Surge Boundary (API 617 / ASME PTC 10)</span>
                </div>
                <p className="text-[#8b949e] font-sans leading-relaxed">
                  Polytropic head H_poly is computed using average compressibility Z_avg and polytropic exponent n/(n-1):
                </p>
                <div className="p-3 bg-[#161b22] border border-[#30363d] rounded text-[#38bdf8]">
                  <code>{'H_{poly} = \\frac{Z_{avg} R T_1}{\\frac{n-1}{n}} \\left[ \\left(\\frac{P_2}{P_1}\\right)^{\\frac{n-1}{n}} - 1 \\right]'}</code>
                </div>
                <p className="text-[#8b949e] font-sans leading-relaxed">
                  The surge limit line (SLL) is modeled using Greitzer B-parameter aerodynamic instability criteria. Surge Margin (SM) evaluates mass flow distance from the SLL: SM = [(Q_oper - Q_surge) / Q_oper] × 100%. API 617 requires SM ≥ 10.0% at all operating speeds.
                </p>
              </div>

              {/* Module 3: Reciprocating Compressor Cylinder Kinematics */}
              <div className="p-4 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Cpu size={16} className="text-emerald-400" />
                  <span>3. Reciprocating Compressor Rod Load Dynamics (API 618 / API 688)</span>
                </div>
                <p className="text-[#8b949e] font-sans leading-relaxed">
                  The instantaneous combined rod load F_rod(θ) is the vector sum of gas pressure forces on the Head End (HE) and Crank End (CE) plus slider-crank reciprocating inertia:
                </p>
                <div className="p-3 bg-[#161b22] border border-[#30363d] rounded text-[#38bdf8]">
                  <code>{'F_{rod}(\\theta) = A_{HE} P_{HE}(\\theta) - A_{CE} P_{CE}(\\theta) - m_{recip} r \\omega^2 (\\cos\\theta + \\frac{r}{L}\\cos 2\\theta)'}</code>
                </div>
                <p className="text-[#8b949e] font-sans leading-relaxed">
                  API 618 requires that the combined rod load reverse from tension to compression over a continuous span of at least 15° of crank angle to allow fresh hydrodynamic oil film ingress into the crosshead pin bushing.
                </p>
              </div>

              {/* Module 4: Hydrodynamic Lubrication */}
              <div className="p-4 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Compass size={16} className="text-cyan-400" />
                  <span>4. Hydrodynamic Journal Bearing Stability (API 684 / Reynolds Equation)</span>
                </div>
                <p className="text-[#8b949e] font-sans leading-relaxed">
                  Fluid film pressure is governed by the 2D Reynolds equation with Vogelpohl transformations. The dimensionless Sommerfeld number S characterizes the operating point:
                </p>
                <div className="p-3 bg-[#161b22] border border-[#30363d] rounded text-[#38bdf8]">
                  <code>{'S = \\left(\\frac{R}{C}\\right)^2 \\frac{\\mu N}{P_{unit}}'}</code>
                </div>
                <p className="text-[#8b949e] font-sans leading-relaxed">
                  Eccentricity ratio ε and attitude angle Φ yield cross-coupled stiffness coefficients (k_xy, k_yx) and damping (c_xx, c_yy). Instability onset occurs when cross-coupled stiffness overcomes hydrodynamic damping, producing oil whirl at 0.43X - 0.48X.
                </p>
              </div>

              {/* Module 5: Gear Mesh & AGMA Contact Stress */}
              <div className="p-4 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Cog size={16} className="text-yellow-400" />
                  <span>5. Gear Mesh Mechanics & AGMA 2001 Pitting/Bending Rating</span>
                </div>
                <p className="text-[#8b949e] font-sans leading-relaxed">
                  Contact stress σ_H is determined per AGMA 2001 using elastic coefficient Z_E, dynamic factor K_v, and overload factor K_o:
                </p>
                <div className="p-3 bg-[#161b22] border border-[#30363d] rounded text-[#38bdf8]">
                  <code>{'\\sigma_H = Z_E \\sqrt{\\frac{W_t K_o K_v K_s K_m C_f}{d w I}}'}</code>
                </div>
                <p className="text-[#8b949e] font-sans leading-relaxed">
                  Elastohydrodynamic (EHL) lubrication is evaluated via Dowson-Higginson central film thickness h_c and specific film thickness ratio λ = h_c / √(Rq_1² + Rq_2²). λ ≥ 2.0 indicates full fluid film separation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FIELD TROUBLESHOOTING FAQ */}
        {activeTab === 'faq' && (
          <div className="space-y-6 max-w-5xl mx-auto font-mono text-xs">
            <div className="border-b border-[#21262d] pb-4">
              <h1 className="text-xl font-bold text-white uppercase tracking-wider">
                Rotating Machinery Field Troubleshooting & Diagnostics FAQ
              </h1>
              <p className="text-xs text-[#8b949e] mt-1">
                Practical engineering explanations and diagnostic logic for real-world turbomachinery, tribology, and vibration anomalies.
              </p>
            </div>

            <div className="space-y-4">
              {filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className="p-5 rounded-lg bg-[#0d1117] border border-[#21262d] hover:border-[#30363d] space-y-3 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#161b22] border border-[#30363d] text-[10px] text-[#f27d26] uppercase font-bold">
                        {faq.category}
                      </span>
                      <span className="text-[10px] text-[#8b949e]">{faq.standardsRef}</span>
                    </div>

                    <button
                      onClick={() => setActiveRoute(faq.recommendedSimulator)}
                      className="px-2.5 py-1 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] rounded text-[10px] text-[#58a6ff] hover:text-white transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <span>Simulate in Twin</span>
                      <ChevronRight size={11} />
                    </button>
                  </div>

                  <h2 className="text-sm font-bold text-white leading-snug">
                    {faq.question}
                  </h2>

                  <p className="text-xs text-[#c9d1d9] leading-relaxed font-sans">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: TECHNICAL ARCHITECTURE & VERIFICATION */}
        {activeTab === 'about' && (
          <div className="space-y-6 max-w-5xl mx-auto font-mono text-xs">
            <div className="border-b border-[#21262d] pb-4">
              <h1 className="text-xl font-bold text-white uppercase tracking-wider">
                Platform Architecture & Engineering Verification
              </h1>
              <p className="text-xs text-[#8b949e] mt-1">
                Built for reliability managers, rotordynamicists, and machinery engineers requiring deterministic verification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-2">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>Deterministic Math</span>
                </div>
                <p className="text-xs text-[#8b949e] font-sans leading-relaxed">
                  All equations run client-side using IEEE 754 64-bit double precision floating point arithmetic. Zero reliance on remote APIs or generative approximations for calculation results.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-2">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck size={16} className="text-blue-400" />
                  <span>Standards Compliant</span>
                </div>
                <p className="text-xs text-[#8b949e] font-sans leading-relaxed">
                  Hardcoded validation against published benchmarks from API 610, API 612, API 617, API 618, API 682, AGMA 2001, and ISO 1940 with maximum deviation under ±0.5%.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-2">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" />
                  <span>Zero-Latency Hot Re-calc</span>
                </div>
                <p className="text-xs text-[#8b949e] font-sans leading-relaxed">
                  Inputs propagate through reactive parameter trees with 60 FPS visual rendering. Transient changes update dynamic indicator cards, Campbell diagrams, and orbits instantaneously.
                </p>
              </div>
            </div>

            {/* Legal / Engineering Disclaimer Notice */}
            <div className="p-4 rounded-xl bg-[#090d16] border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs font-mono uppercase">
                  <AlertTriangle size={14} />
                  <span>Engineering Accuracy Notice & Safety Terms</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  NOMINATIVE USE
                </span>
              </div>
              <p className="text-xs text-[#c9d1d9] font-sans leading-relaxed">
                <strong>Accuracy Notice:</strong> Mechanical Lab Pro outputs theoretical Float64 approximations calculated from generalized mathematical models (64-bit ODEs, 2D hydrodynamic Reynolds formulations). Real-world physical machinery behavior can deviate due to manufacturing tolerances, thermal distortions, fluid contaminants, and component wear. Outputs must not replace certified OEM test sheets or calibrated instrumentation.
              </p>
              <p className="text-[11px] text-[#8b949e] font-sans leading-relaxed">
                Operating conditions and modifications in physical plants must always be verified against certified OEM equipment datasheets and validated by a licensed Professional Engineer (PE) prior to executing operational or safety-critical decisions.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* LiveSimulators Universal Footer */}
      <LiveSimulatorsFooter />
    </div>
  );
};
