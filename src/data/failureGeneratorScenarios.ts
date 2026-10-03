import { SimulatorId } from '../types/common';

export interface GeneratedFailureScenario {
  id: string;
  simulatorId: SimulatorId;
  title: string;
  severity: 'critical' | 'emergency' | 'warning';
  plantUnit: string;
  dcsAlarmBanner: string;
  symptoms: {
    acoustic: string;
    vibration: string;
    process: string;
  };
  telemetryMetrics: {
    label: string;
    value: string;
    benchmarkLimit: string;
    isViolated: boolean;
  }[];
  rootCauseOptions: {
    id: string;
    description: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  correctiveActions: {
    id: string;
    actionLabel: string;
    isOptimal: boolean;
    inputsToInject: Record<string, any>;
    engineeringOutcome: string;
  }[];
  governingBenchmark: string;
  debriefPhysics: string;
}

export const FAILURE_GENERATOR_SCENARIOS: GeneratedFailureScenario[] = [
  {
    id: 'pump-feed-cavitation-crisis',
    simulatorId: 'pump',
    title: 'Boiler Feed Pump Cavitation & Vapor Lock Crisis',
    severity: 'emergency',
    plantUnit: 'Steam Generation Plant - Unit 4 Boiler Feed',
    dcsAlarmBanner: 'ALARM 104-PMP: SUCTION PRESSURE BELOW SATURATION - TRIP IMMINENT',
    symptoms: {
      acoustic: 'Violent metallic rattling and popping sounds resembling gravel churned inside the casing.',
      vibration: 'Broadband high-frequency demodulated casing acceleration spiking above 14 g pk-pk.',
      process: 'Discharge pressure fluctuating by ±22%; delivered mass flow rate collapsing from 160 m³/h to 105 m³/h.',
    },
    telemetryMetrics: [
      { label: 'NPSHa / NPSHr Margin', value: '0.78x', benchmarkLimit: '≥ 1.35x (Reference API 610 / HI 9.6.1)', isViolated: true },
      { label: 'Suction Line Velocity', value: '3.45 m/s', benchmarkLimit: '≤ 2.20 m/s', isViolated: true },
      { label: 'Vessel Liquid Level (Z)', value: '+0.50 m', benchmarkLimit: '≥ +3.20 m', isViolated: true },
      { label: 'Fluid Temperature', value: '88 °C', benchmarkLimit: 'Design 60 °C', isViolated: true },
    ],
    rootCauseOptions: [
      {
        id: 'opt-1',
        description: 'Mechanical seal face distortion causing atmospheric air ingress into the impeller.',
        isCorrect: false,
        explanation: 'Incorrect. Air ingress causes smooth air binding, not violent high-frequency micro-jet cavitation bubble collapse.',
      },
      {
        id: 'opt-2',
        description: 'Elevated fluid temperature and low static tank level causing suction pressure to collapse below liquid vapor pressure.',
        isCorrect: true,
        explanation: 'Correct! At 88°C, water vapor pressure is ~0.65 bar(a). With only 0.5m static head and high friction velocity (3.45 m/s), NPSHa plunges below NPSHr.',
      },
      {
        id: 'opt-3',
        description: 'Electric motor rotor bar breakage causing electrical slip pulsation.',
        isCorrect: false,
        explanation: 'Incorrect. Broken rotor bars generate 2x slip frequency sidebands around line frequency, which does not cause fluid head collapse.',
      },
      {
        id: 'opt-4',
        description: 'Discharge check valve flapper jamming in closed position.',
        isCorrect: false,
        explanation: 'Incorrect. A jammed discharge valve would cause pump shutoff head, not suction casing cavitation crackling.',
      },
    ],
    correctiveActions: [
      {
        id: 'act-1',
        actionLabel: 'Throttle discharge valve slightly and subcool feed liquid to 45°C while raising deaerator level to 4.2m',
        isOptimal: true,
        inputsToInject: {
          flowRateM3h: 120,
          staticHeadM: 4.2,
          fluidTempC: 45,
          pipeDiameterMm: 200,
          suctionPressureBarG: 1.8,
        },
        engineeringOutcome: 'NPSHa restored to 12.8 m (Margin 1.75x). Cavitation bubble collapses silenced; discharge pressure stabilized.',
      },
      {
        id: 'act-2',
        actionLabel: 'Increase pump motor speed to 3600 RPM to overcome vapor resistance',
        isOptimal: false,
        inputsToInject: {
          pumpSpeedRpm: 3600,
        },
        engineeringOutcome: 'Catastrophic failure: Higher speed quadruples NPSHr by affinity laws (NPSHr ∝ N²), destroying the impeller in minutes.',
      },
    ],
    governingBenchmark: 'Hydraulic Institute HI 9.6.1 & API 610 Annex A (Nominative Reference)',
    debriefPhysics: 'Under HI 9.6.1 guidelines, pump reliability requires NPSH margin >= 1.35x. Subcooling fluid significantly reduces vapor pressure, while raising liquid level restores hydrostatic head.',
  },
  {
    id: 'compressor-surge-emergency',
    simulatorId: 'compressor',
    title: 'Centrifugal Compressor Severe Aerodynamic Surge',
    severity: 'critical',
    plantUnit: 'Offshore Associated Gas Re-injection Train',
    dcsAlarmBanner: 'TRIP WARN 202-CMP: FLOW < SLL - SEVERE AXIAL SHOCK PULSATION',
    symptoms: {
      acoustic: 'Rhythmic deep booming thump every 0.6 seconds followed by high-velocity gas hiss.',
      vibration: 'Axial shaft displacement excursion jumping to 75 µm pk-pk with thrust pad temperature spiking.',
      process: 'Discharge pressure oscillating from 28 bar to 19 bar; mass flow rate momentarily reversing direction.',
    },
    telemetryMetrics: [
      { label: 'Proximity to Surge Limit (SLL)', value: '-8.5% (Violated)', benchmarkLimit: '≥ +10.0% Buffer', isViolated: true },
      { label: 'Anti-Surge Valve (ASV)', value: '0% (Fully Closed)', benchmarkLimit: 'Modulating (SCL)', isViolated: true },
      { label: 'Thrust Bearing Pad Temp', value: '118 °C', benchmarkLimit: '≤ 100 °C (Ref: API 670)', isViolated: true },
      { label: 'Impeller Pressure Ratio', value: '2.85 Rc', benchmarkLimit: 'Stability Cap: 2.50 Rc', isViolated: true },
    ],
    rootCauseOptions: [
      {
        id: 'opt-1',
        description: 'Downstream process block valve throttled with anti-surge valve (ASV) fail-closed / stuck.',
        isCorrect: true,
        explanation: 'Correct! Downstream throttling pushed operating resistance above the compressor pressure capability, driving flow left of the Surge Limit Line while ASV was uncommanded.',
      },
      {
        id: 'opt-2',
        description: 'Inlet suction gas filter rupture causing particulate ingestion.',
        isCorrect: false,
        explanation: 'Incorrect. Ingestion causes erosion and continuous unbalance, not cyclic flow reversal and aerodynamic surge.',
      },
      {
        id: 'opt-3',
        description: 'Compressor shaft shear at coupling hub.',
        isCorrect: false,
        explanation: 'Incorrect. Shaft shear would result in motor overspeed trip and instant zero compressor discharge pressure.',
      },
    ],
    correctiveActions: [
      {
        id: 'act-1',
        actionLabel: 'Execute Emergency Anti-Surge Recycle Valve (ASV) Quick-Open to 65% and reduce speed',
        isOptimal: true,
        inputsToInject: {
          asvPositionPercent: 65,
          compressorSpeedRpm: 9200,
          suctionPressureBarA: 1.1,
        },
        engineeringOutcome: 'Flow instantly restored to +22% safe margin right of SCL; cyclic thrust shock neutralized; pad temp cooling.',
      },
      {
        id: 'act-2',
        actionLabel: 'Further restrict discharge valve to build higher head',
        isOptimal: false,
        inputsToInject: {
          asvPositionPercent: 0,
        },
        engineeringOutcome: 'Failure: Destroys thrust bearing pads and shears internal labyrinths within seconds.',
      },
    ],
    governingBenchmark: 'API 617 8th Ed & ASME PTC 10 (Nominative Reference)',
    debriefPhysics: 'Centrifugal compressor surge occurs when pressure ratio exceeds aerodynamic stall limit. Rapid ASV opening recycles mass flow from discharge to suction, moving the operating point safely rightward.',
  },
  {
    id: 'rotor-unbalance-resonance',
    simulatorId: 'rotor',
    title: 'Steam Turbine-Generator High 1X Vibration Trip Risk',
    severity: 'critical',
    plantUnit: 'Turbine Island - Main 45 MW Turbo-Generator',
    dcsAlarmBanner: 'VIB ALARM 301-TBN: 1X BEARING SEVERITY ZONE D (UNACCEPTABLE)',
    symptoms: {
      acoustic: 'Deep, steady rotational drone at exactly 50 Hz matching 3000 RPM generator frequency.',
      vibration: 'Shaft relative vibration reached 92 µm pk-pk (ISO 10816 Zone D). 1X amplitude accounts for 90% of spectral energy.',
      process: 'Lube oil temperature elevated; bearing drain oil shows babbitt particulate traces.',
    },
    telemetryMetrics: [
      { label: 'ISO 10816-3 Vibration Severity', value: '11.4 mm/s RMS (Zone D)', benchmarkLimit: 'Zone A/B ≤ 4.5 mm/s', isViolated: true },
      { label: 'Residual Unbalance', value: '485 g·mm', benchmarkLimit: '≤ 120 g·mm (ISO 1940 Grade G2.5)', isViolated: true },
      { label: 'Bearing L10h Rating Life', value: '1,200 hrs', benchmarkLimit: '≥ 40,000 hrs (API 610/617)', isViolated: true },
    ],
    rootCauseOptions: [
      {
        id: 'opt-1',
        description: 'Single-plane mass unbalance caused by blade shroud exfoliation or coupling balance weight loss.',
        isCorrect: true,
        explanation: 'Correct! Pure sinusoidal 1X vibration with constant phase angle is the quintessential signature of mass unbalance.',
      },
      {
        id: 'opt-2',
        description: 'Severe angular coupling misalignment.',
        isCorrect: false,
        explanation: 'Incorrect. Angular misalignment produces dominant 2X harmonics and 180° axial phase shift across the coupling, not pure 1X.',
      },
      {
        id: 'opt-3',
        description: 'Subsynchronous oil whirl in journal bearing.',
        isCorrect: false,
        explanation: 'Incorrect. Oil whirl generates subsynchronous peaks at 0.42X - 0.48X running speed, not 1.0X synchronous vibration.',
      },
    ],
    correctiveActions: [
      {
        id: 'act-1',
        actionLabel: 'Perform precision 2-plane field balancing to restore ISO 1940-1 Grade G2.5 (< 65 g·mm)',
        isOptimal: true,
        inputsToInject: {
          balanceGrade: 'G2.5',
          eccentricityUm: 2.1,
          operatingRpm: 3000,
        },
        engineeringOutcome: '1X vibration dropped to 1.8 mm/s RMS (Zone A Nominal). Bearing L10h rating extended to 78,000 hrs.',
      },
      {
        id: 'act-2',
        actionLabel: 'Increase bearing lube oil viscosity to damp the vibration without rebalancing',
        isOptimal: false,
        inputsToInject: {
          operatingRpm: 3000,
        },
        engineeringOutcome: 'Temporary mask: Unbalance centrifugal force F = m·r·ω² continues hammering bearing shell, accelerating fatigue.',
      },
    ],
    governingBenchmark: 'ISO 1940-1:2003 & ISO 20816-3 (Nominative Reference)',
    debriefPhysics: 'Centrifugal unbalance force scales with the square of speed. Balancing corrects the eccentricity vector between geometric center of rotation and mass center of gravity.',
  },
  {
    id: 'pipe-thermal-stress-rupture',
    simulatorId: 'pipe',
    title: 'Hot Refinery Discharge Header Anchor Overstress',
    severity: 'critical',
    plantUnit: 'Crude Distillation Unit (CDU) Overhead Vapor Line',
    dcsAlarmBanner: 'STRUCT ALARM 402-PIP: ANCHOR REACTION THRUST EXCEEDED STRUCTURAL ALLOWABLE',
    symptoms: {
      acoustic: 'Loud creaking and groaning sounds during thermal heat-up.',
      vibration: 'Pipe resting guides vibrating and binding against steel structure.',
      process: 'Flange leak detected at compressor discharge nozzle due to excessive external bending moments.',
    },
    telemetryMetrics: [
      { label: 'ASME B31.3 Combined Stress', value: '385 MPa (148% Allowable)', benchmarkLimit: '≤ 260 MPa (100% S_A)', isViolated: true },
      { label: 'Thermal Expansion ΔL', value: '94 mm', benchmarkLimit: 'Cold sprung allowable 35 mm', isViolated: true },
      { label: 'Nozzle Reaction Force F_z', value: '44.8 kN', benchmarkLimit: '≤ 12.5 kN (API 617 Table 4)', isViolated: true },
    ],
    rootCauseOptions: [
      {
        id: 'opt-1',
        description: 'Rigid straight run piping between fixed anchors with inadequate expansion loop flexibility at 320°C.',
        isCorrect: true,
        explanation: 'Correct! Without flexible offsets or expansion loops, thermal expansion ΔL = α·L·ΔT induces massive axial compressive stress σ = E·α·ΔT.',
      },
      {
        id: 'opt-2',
        description: 'Water hammer caused by rapid valve closure.',
        isCorrect: false,
        explanation: 'Incorrect. Water hammer produces transient acoustic pressure shock waves, not steady thermal growth thrust.',
      },
    ],
    correctiveActions: [
      {
        id: 'act-1',
        actionLabel: 'Introduce 3D expansion loop and cold spring to absorb 60 mm thermal growth',
        isOptimal: true,
        inputsToInject: {
          operatingTempC: 180,
          pipeLengthM: 18,
          operatingPressureBar: 12,
        },
        engineeringOutcome: 'Combined stress reduced to 54% of ASME B31.3 allowable; nozzle reaction moments reduced below API 617 limits.',
      },
    ],
    governingBenchmark: 'ASME B31.3:2022 Chapter II & API 617 Table 4 (Nominative Reference)',
    debriefPhysics: 'Thermal flexibility analysis per ASME B31.3 requires that displacement stress range S_E must not exceed allowable displacement stress range S_A = f(1.25 S_c + 0.25 S_h).',
  },
];
