import {
  TrainNodeId,
  TrainComponentState,
  CouplingTransferLink,
  CascadeScenario,
  CascadeStep,
  SISInterlockSensor,
  CoupledTrainSimulationResult,
} from '../types/machineryTrain';
import { StatusLevel } from '../types/common';

// ============================================================================
// 1. PRE-CONFIGURED INDUSTRIAL FAILURE CASCADE SCENARIOS
// ============================================================================

export const CASCADE_SCENARIOS: CascadeScenario[] = [
  {
    id: 'pipe-to-seal-cascade',
    title: 'Refinery Hot Crude Run Thermal Pipe Strain → Blown Mechanical Seal',
    subtitle: 'ASME B31.3 Unrestrained Nozzle Expansion → API 686 Soft Foot → API 682 Seal Face Opening',
    industry: 'Petrochemical Refining (Crude Distillation Unit Atmospheric Column Bottoms Pump P-101A)',
    governingStandards: ['ASME B31.3 §319', 'API 610 12th Ed Table 5', 'API 686 Chapter 5', 'API 682 Plan 53A', 'ISO 10816-3'],
    rootCauseNode: 'pipe',
    rootCauseDescription: 'Discharge line thermal guide friction seized during 280°C crude oil operating ramp. Unrestrained thermal growth exerted 42 kN axial nozzle thrust on the top-discharge pump casing.',
    terminalOutcome: 'API 610 casing feet lifted 0.48 mm, causing severe angular coupling misalignment, 2X vibration trip (11.2 mm/s RMS), and seal face angular opening leading to catastrophic volatile hydrocarbon leak.',
    recommendedMitigation: [
      'Install slotted spring pipe hangers and PTFE low-friction slide plates on discharge header.',
      'Perform hot alignment verification at operating temperature (280°C) per API 686.',
      'Reinforce pump baseplate grouting and torque hold-down anchor bolts with calibrated hydraulic tensioners.',
      'Upgrade mechanical seal to API 682 Category 1 Type B high-temperature metal bellows seal with Plan 53B.'
    ],
    preventiveDesignAction: 'Perform formal CAESAR II piping flexibility analysis adhering to API 610 Table 5 nozzle load envelopes prior to unit hot startup.',
    steps: [
      {
        timeSeconds: 0,
        phaseTitle: 'Baseline Normal Operation (120°C Start)',
        triggerNode: 'pipe',
        headline: 'Normal pre-heat operating condition within all API envelopes.',
        physicsDescription: 'Process fluid temperature at 120°C. Thermal pipe expansion ΔL = 6.4 mm within spring hanger travel. Nozzle stresses at 42% of ASME B31.3 allowable limit SA.',
        nodeStatuses: {
          motor: 'safe',
          coupling: 'safe',
          pump: 'safe',
          seal: 'safe',
          pipe: 'safe',
          rotor: 'safe',
        },
        metricsSnapshot: {
          nozzleStressPercent: 42,
          couplingOffsetMm: 0.04,
          vibrationRMS: 1.4,
          sealLeakageMlHr: 1.2,
          sealTempC: 62,
          npshMarginRatio: 1.45,
          bearingL10h: 48000,
        },
        interlockTrips: [],
      },
      {
        timeSeconds: 30,
        phaseTitle: 'Thermal Excursion & Pipe Support Binding (280°C)',
        triggerNode: 'pipe',
        headline: 'Pipe hanger binds; thermal thrust escalates against pump casing.',
        physicsDescription: 'Crude temperature reaches 280°C. Pipe elongation ΔL jumps to 18.2 mm. Axial reaction force on pump discharge nozzle reaches 42 kN (210% of API 610 Table 5 maximum allowable envelope).',
        nodeStatuses: {
          motor: 'safe',
          coupling: 'safe',
          pump: 'warning',
          seal: 'safe',
          pipe: 'critical',
          rotor: 'safe',
        },
        metricsSnapshot: {
          nozzleStressPercent: 184,
          couplingOffsetMm: 0.12,
          vibrationRMS: 2.8,
          sealLeakageMlHr: 3.5,
          sealTempC: 78,
          npshMarginRatio: 1.38,
          bearingL10h: 32000,
        },
        interlockTrips: [],
      },
      {
        timeSeconds: 90,
        phaseTitle: 'Casing Distortion & Induced Soft Foot Misalignment',
        triggerNode: 'coupling',
        headline: 'Nozzle moment twists pump casing; coupling gap opens by 0.38 mm.',
        physicsDescription: 'Pump casing deflects upward at Drive-End feet by 0.48 mm (severe soft foot). Coupling spacer suffers 0.38 mm parallel offset and 1.2 mrad angular misalignment, generating heavy 2X dynamic bending forces.',
        nodeStatuses: {
          motor: 'warning',
          coupling: 'critical',
          pump: 'critical',
          seal: 'warning',
          pipe: 'critical',
          rotor: 'warning',
        },
        metricsSnapshot: {
          nozzleStressPercent: 215,
          couplingOffsetMm: 0.38,
          vibrationRMS: 6.2,
          sealLeakageMlHr: 14.8,
          sealTempC: 96,
          npshMarginRatio: 1.32,
          bearingL10h: 12000,
        },
        interlockTrips: ['VSH-101 (Bearing Vibration High Alarm)'],
      },
      {
        timeSeconds: 180,
        phaseTitle: 'Seal Face Runout & High Dynamic Vibration Excitation',
        triggerNode: 'seal',
        headline: 'Radial shaft deflection at stuffing box reaches 0.076 mm; seal faces open.',
        physicsDescription: 'Coupling reaction forces deflect shaft at stuffing box past the 0.050 mm API 682 limit. Stationary and rotating seal faces separate; barrier fluid drops as hot oil vapor flashes at seal atmospheric port.',
        nodeStatuses: {
          motor: 'warning',
          coupling: 'critical',
          pump: 'critical',
          seal: 'critical',
          pipe: 'critical',
          rotor: 'critical',
        },
        metricsSnapshot: {
          nozzleStressPercent: 220,
          couplingOffsetMm: 0.46,
          vibrationRMS: 8.9,
          sealLeakageMlHr: 85.0,
          sealTempC: 135,
          npshMarginRatio: 1.28,
          bearingL10h: 4200,
        },
        interlockTrips: ['VSH-101 (Bearing Vibration High)', 'TSH-104 (Seal Chamber High Temp)', 'PDSH-102 (Seal Barrier Pressure Drop)'],
      },
      {
        timeSeconds: 300,
        phaseTitle: 'Terminal Emergency Shutdown (ESD) Trip & Seal Blowout',
        triggerNode: 'pump',
        headline: 'SIS 2oo3 voting logic triggers emergency shutdown on 11.2 mm/s vibration.',
        physicsDescription: 'Bearing housing vibration surpasses ISO 10816 Zone D trip threshold (7.1 mm/s RMS). SIS logic initiates emergency trip to prevent bearing seizure and hydrocarbon fire.',
        nodeStatuses: {
          motor: 'critical',
          coupling: 'critical',
          pump: 'critical',
          seal: 'critical',
          pipe: 'critical',
          rotor: 'critical',
        },
        metricsSnapshot: {
          nozzleStressPercent: 228,
          couplingOffsetMm: 0.52,
          vibrationRMS: 11.2,
          sealLeakageMlHr: 240.0,
          sealTempC: 168,
          npshMarginRatio: 1.22,
          bearingL10h: 850,
        },
        interlockTrips: ['VSHH-101 (Vibration High-High Trip)', 'TSHH-104 (Seal High-High Temp Trip)', 'ESD-TRIP-ACTUATED'],
      },
    ],
  },
  {
    id: 'cavitation-unbalance-cascade',
    title: 'Vacuum Column Cavitation → Rotor Dynamic Unbalance → Bearing Cage Failure',
    subtitle: 'NPSH Starvation → Impeller Pitting Mass Loss → ISO 1940 Unbalance → ISO 281 Fatigue Collapse',
    industry: 'Petroleum Refinery (Vacuum Residue Booster Pump P-204B)',
    governingStandards: ['API 610 §6.1.11', 'HI 9.6.1 Cavitation Criteria', 'ISO 1940-1 Grade G2.5', 'ISO 281 L10h', 'ISO 10816-3 Zone D'],
    rootCauseNode: 'pump',
    rootCauseDescription: 'Upstream vacuum column suction level dropped 1.8 m below minimum submergence; suction strainer 70% blinded with coke fines, collapsing NPSHa below NPSHr.',
    terminalOutcome: 'Severe vapor bubble micro-jet collapse eroded 85 grams of 316L stainless steel from blade suction tips. Asymmetric mass loss generated 180 g·mm dynamic unbalance, escalating 1X radial bearing loads by 420% and shattering the drive-end bearing brass cage.',
    recommendedMitigation: [
      'Install automatic suction differential pressure transmitter (PDT) with low NPSH alarm.',
      'Fit backwashable dual duplex strainers to prevent coke blinding.',
      'Re-balance impeller to ISO 1940-1 Grade G1.0 before returning to service.',
      'Upgrade radial bearing from deep-groove ball to heavy-duty cylindrical roller bearing with machined brass cage.'
    ],
    preventiveDesignAction: 'Ensure minimum continuous NPSH margin of at least 1.5x (or NPSHa - NPSHr >= 1.5 m) per API 610 Table 6 for boiling hydrocarbon service.',
    steps: [
      {
        timeSeconds: 0,
        phaseTitle: 'Design Hydrodynamic State',
        triggerNode: 'pump',
        headline: 'Normal NPSH margin 1.62x; vibration in ISO Zone A (1.1 mm/s RMS).',
        physicsDescription: 'Suction pressure at 0.85 bar absolute. NPSHa = 5.2 m vs NPSHr = 3.2 m. Dynamic unbalance at 3.5 g·mm (ISO Grade G1.0). Bearings operating smoothly at 48°C.',
        nodeStatuses: {
          motor: 'safe',
          coupling: 'safe',
          pump: 'safe',
          seal: 'safe',
          pipe: 'safe',
          rotor: 'safe',
        },
        metricsSnapshot: {
          nozzleStressPercent: 38,
          couplingOffsetMm: 0.03,
          vibrationRMS: 1.1,
          sealLeakageMlHr: 0.8,
          sealTempC: 54,
          npshMarginRatio: 1.62,
          bearingL10h: 52000,
        },
        interlockTrips: [],
      },
      {
        timeSeconds: 30,
        phaseTitle: 'Suction Strainer Blinded; NPSH Collapse',
        triggerNode: 'pump',
        headline: 'NPSH margin plummets to 0.94x; acoustic cavitation inception.',
        physicsDescription: 'Coke particulates restrict suction flow. Pressure at suction nozzle drops below fluid vapor pressure (P_vap = 32 kPa). High-frequency ultrasound noise (40 kHz) detects vapor bubble cloud inception.',
        nodeStatuses: {
          motor: 'safe',
          coupling: 'safe',
          pump: 'critical',
          seal: 'safe',
          pipe: 'safe',
          rotor: 'warning',
        },
        metricsSnapshot: {
          nozzleStressPercent: 44,
          couplingOffsetMm: 0.05,
          vibrationRMS: 2.9,
          sealLeakageMlHr: 1.5,
          sealTempC: 59,
          npshMarginRatio: 0.94,
          bearingL10h: 28000,
        },
        interlockTrips: ['PSL-204 (Suction Pressure Low Alarm)'],
      },
      {
        timeSeconds: 90,
        phaseTitle: 'Micro-Jet Impeller Erosion & Mass Unbalance Inception',
        triggerNode: 'rotor',
        headline: 'Erosion removes 35g metal; rotor unbalance escalates to ISO Grade G6.3.',
        physicsDescription: 'Micro-jet liquid velocities exceeding 1000 m/s pit blade suction leading edges. Asymmetric material loss introduces 74 g·mm unbalance, generating 1X dynamic centrifugal force Fc = 1,420 N.',
        nodeStatuses: {
          motor: 'safe',
          coupling: 'warning',
          pump: 'critical',
          seal: 'warning',
          pipe: 'safe',
          rotor: 'critical',
        },
        metricsSnapshot: {
          nozzleStressPercent: 52,
          couplingOffsetMm: 0.11,
          vibrationRMS: 5.4,
          sealLeakageMlHr: 5.2,
          sealTempC: 71,
          npshMarginRatio: 0.88,
          bearingL10h: 11000,
        },
        interlockTrips: ['PSL-204 (Suction Low)', 'VSH-201 (Rotor Vibration High Alarm)'],
      },
      {
        timeSeconds: 180,
        phaseTitle: 'Severe Dynamic Force & Bearing Raceway Spalling',
        triggerNode: 'rotor',
        headline: '1X force reaches 3,800 N; ISO 281 L10h bearing life collapses to 1,200 hrs.',
        physicsDescription: 'Continuous pitting erosion removes 85g from blade 2. Residual unbalance reaches 182 g·mm. Dynamic bearing load P exceeds dynamic rating C/3, triggering sub-surface fatigue spalling and metal debris in lube oil.',
        nodeStatuses: {
          motor: 'warning',
          coupling: 'critical',
          pump: 'critical',
          seal: 'critical',
          pipe: 'warning',
          rotor: 'critical',
        },
        metricsSnapshot: {
          nozzleStressPercent: 68,
          couplingOffsetMm: 0.22,
          vibrationRMS: 9.6,
          sealLeakageMlHr: 22.0,
          sealTempC: 88,
          npshMarginRatio: 0.81,
          bearingL10h: 1200,
        },
        interlockTrips: ['PSLL-204 (Suction Low-Low Trip)', 'VSHH-201 (Rotor Vibration High-High Trip)'],
      },
      {
        timeSeconds: 300,
        phaseTitle: 'Bearing Cage Catastrophic Fracture & Train Trip',
        triggerNode: 'rotor',
        headline: 'Bearing ball cage shatters; shaft orbit locks up, tripping motor breaker.',
        physicsDescription: 'Dynamic 1X force fractures brass bearing cage. Rolling elements bunch together, locking the rotating assembly. Motor current spikes to locked-rotor amperage (620 A), tripping substation breaker 52.',
        nodeStatuses: {
          motor: 'critical',
          coupling: 'critical',
          pump: 'critical',
          seal: 'critical',
          pipe: 'critical',
          rotor: 'critical',
        },
        metricsSnapshot: {
          nozzleStressPercent: 92,
          couplingOffsetMm: 0.44,
          vibrationRMS: 16.5,
          sealLeakageMlHr: 120.0,
          sealTempC: 115,
          npshMarginRatio: 0.72,
          bearingL10h: 40,
        },
        interlockTrips: ['VSHH-201 (Vibration High-High)', 'ISHH-52 (Motor Overcurrent Trip)', 'ESD-UNIT-SHUTDOWN'],
      },
    ],
  },
  {
    id: 'seal-flush-dryrun-cascade',
    title: 'Plan 11 Orifice Plugging → Seal Chamber Vaporization → Shaft Galling',
    subtitle: 'API 682 Plan 11 Loss → Seal Face Dry Running → Frictional Heat Spike → Thermal Shaft Bowing',
    industry: 'Chemical Plant (Aromatics Extraction Benzene Feed Pump P-302)',
    governingStandards: ['API 682 4th Ed Plan 11/53A', 'API 610 Table 8', 'ISO 10816-3', 'OSHA 1910.119 PSM'],
    rootCauseNode: 'seal',
    rootCauseDescription: '3.0 mm flush restriction orifice plugged with polymer particulate sludge. Flush flow dropped from 9.5 L/min to 0.2 L/min, eliminating heat dissipation from the SiC/Carbon seal faces.',
    terminalOutcome: 'Seal chamber fluid vaporized into dry running. Frictional coefficient jumped to 0.38, causing carbon blister fracturing, shaft thermal sleeve galling, and a high-drag torque spike that tripped the motor.',
    recommendedMitigation: [
      'Replace Plan 11 with API 682 Plan 31 (cyclone separator) or Plan 53B closed pressurized barrier.',
      'Install differential pressure transmitter across flush orifice with low-flow interlock.',
      'Upgrade face materials to premium reaction-bonded silicon carbide vs antimony-impregnated carbon.',
      'Incorporate seal chamber temperature transmitter (TSH) with automated interlock to trip pump before dry vaporization.'
    ],
    preventiveDesignAction: 'Ensure flush orifice diameter is never less than 3.2 mm (1/8 in) per API 682 §8.2 to prevent particulate bridging.',
    steps: [
      {
        timeSeconds: 0,
        phaseTitle: 'Normal Plan 11 Hydrodynamic Lubrication',
        triggerNode: 'seal',
        headline: '9.5 L/min flush flow maintains 52°C seal chamber temperature.',
        physicsDescription: 'Product flush removes 1.2 kW of face frictional heat. Fluid film thickness h = 1.0 micron maintained between silicon carbide and carbon rings. Leakage is invisible vapor (< 0.5 mL/hr).',
        nodeStatuses: {
          motor: 'safe',
          coupling: 'safe',
          pump: 'safe',
          seal: 'safe',
          pipe: 'safe',
          rotor: 'safe',
        },
        metricsSnapshot: {
          nozzleStressPercent: 32,
          couplingOffsetMm: 0.02,
          vibrationRMS: 0.9,
          sealLeakageMlHr: 0.4,
          sealTempC: 52,
          npshMarginRatio: 1.55,
          bearingL10h: 55000,
        },
        interlockTrips: [],
      },
      {
        timeSeconds: 30,
        phaseTitle: 'Orifice Partial Plugging & Thermal Dissipation Deficit',
        triggerNode: 'seal',
        headline: 'Polymer debris chokes orifice; flush flow drops by 80%.',
        physicsDescription: 'Orifice restriction increases pressure drop; flow collapses to 1.8 L/min. Heat generation rate exceeds fluid heat removal rate (Q_gen = 1.2 kW vs Q_rem = 0.3 kW). Seal chamber heats up rapidly.',
        nodeStatuses: {
          motor: 'safe',
          coupling: 'safe',
          pump: 'safe',
          seal: 'warning',
          pipe: 'safe',
          rotor: 'safe',
        },
        metricsSnapshot: {
          nozzleStressPercent: 35,
          couplingOffsetMm: 0.04,
          vibrationRMS: 1.4,
          sealLeakageMlHr: 1.8,
          sealTempC: 84,
          npshMarginRatio: 1.52,
          bearingL10h: 50000,
        },
        interlockTrips: ['FSL-302 (Flush Flow Low Alarm)'],
      },
      {
        timeSeconds: 90,
        phaseTitle: 'Phase Change Flashing & Seal Face Dry Running',
        triggerNode: 'seal',
        headline: 'Chamber temperature crosses benzene boiling point (98°C); fluid flashes to vapor.',
        physicsDescription: 'Hydrodynamic fluid film collapses into dry gas pocket. Lubrication film lost; friction coefficient jumps from μ = 0.04 to μ = 0.36. Surface temperature spikes to 240°C in micro-contact asperities.',
        nodeStatuses: {
          motor: 'warning',
          coupling: 'safe',
          pump: 'warning',
          seal: 'critical',
          pipe: 'safe',
          rotor: 'warning',
        },
        metricsSnapshot: {
          nozzleStressPercent: 42,
          couplingOffsetMm: 0.08,
          vibrationRMS: 3.2,
          sealLeakageMlHr: 45.0,
          sealTempC: 128,
          npshMarginRatio: 1.48,
          bearingL10h: 38000,
        },
        interlockTrips: ['FSL-302 (Flush Low)', 'TSH-302 (Seal Chamber High Temp Alarm)'],
      },
      {
        timeSeconds: 180,
        phaseTitle: 'Thermal Galling & Shaft Local Bowing Excitation',
        triggerNode: 'rotor',
        headline: 'Heat soak into 4140 shaft causes 0.12 mm thermal bow; 1X vibration jumps.',
        physicsDescription: 'Intense frictional heating at seal sleeve causes asymmetric thermal gradient across the shaft cross-section. Shaft bows dynamically by 0.12 mm, creating high 1X unbalance and rubs against throat bushing.',
        nodeStatuses: {
          motor: 'warning',
          coupling: 'warning',
          pump: 'critical',
          seal: 'critical',
          pipe: 'warning',
          rotor: 'critical',
        },
        metricsSnapshot: {
          nozzleStressPercent: 58,
          couplingOffsetMm: 0.18,
          vibrationRMS: 7.4,
          sealLeakageMlHr: 180.0,
          sealTempC: 195,
          npshMarginRatio: 1.42,
          bearingL10h: 8500,
        },
        interlockTrips: ['TSHH-302 (Seal Chamber High-High Temp)', 'VSH-301 (Vibration High Alarm)'],
      },
      {
        timeSeconds: 300,
        phaseTitle: 'Drive Pin Shearing, Toxic Benzene Leak & Plant Trip',
        triggerNode: 'seal',
        headline: 'Galling shears seal drive pins; hazardous VOC vapor detectors trip unit.',
        physicsDescription: 'Frictional torque spikes past 280 N·m, shearing 316SS drive pins. Silicon carbide stationary ring fractures into three pieces. Atmospheric benzene vapor detector detects 25 ppm VOC, triggering emergency firewater deluge and SIS train shutdown.',
        nodeStatuses: {
          motor: 'critical',
          coupling: 'critical',
          pump: 'critical',
          seal: 'critical',
          pipe: 'critical',
          rotor: 'critical',
        },
        metricsSnapshot: {
          nozzleStressPercent: 75,
          couplingOffsetMm: 0.28,
          vibrationRMS: 10.8,
          sealLeakageMlHr: 540.0,
          sealTempC: 245,
          npshMarginRatio: 1.35,
          bearingL10h: 1800,
        },
        interlockTrips: ['TSHH-302 (Seal High-High Temp)', 'AIT-309 (Toxic VOC Vapor Trip)', 'ESD-FIRE-SAFETY-TRIP'],
      },
    ],
  },
  {
    id: 'pristine-baseline-train',
    title: 'Pristine Commissioning Baseline (Hot Thermal Offset Alignment)',
    subtitle: 'API 686 Pre-Compensated Cold Shims → Zero Hot Misalignment → Extended 50k+ Hr MTBF',
    industry: 'Power Generation (High-Pressure Boiler Feed Water Booster Train BFP-4)',
    governingStandards: ['API 686 Chapter 5 §4', 'API 610 12th Ed', 'ISO 1940 Grade G1.0', 'ISO 10816-3 Zone A'],
    rootCauseNode: 'coupling',
    rootCauseDescription: 'Engineering team performed hot alignment growth calculation (Δy = 0.28 mm pump thermal rise) and pre-shimmed motor cold feet with -0.28 mm reverse bias.',
    terminalOutcome: 'As train achieved operating equilibrium at 165°C, thermal expansion naturally canceled the cold pre-offset, resulting in running offset of 0.012 mm (< 20% of API 686 tolerance) and flawless ISO Zone A vibration (0.85 mm/s RMS).',
    recommendedMitigation: [
      'Maintain continuous online shaft laser alignment monitoring.',
      'Adhere to monthly oil lubrication sampling per ISO 4406 (target cleanliness 16/14/11).',
      'Record vibration FFT spectral baselines quarterly for predictive asset trending.'
    ],
    preventiveDesignAction: 'Standardize API 686 Chapter 5 hot alignment growth protocol across all high-temperature rotating equipment trains.',
    steps: [
      {
        timeSeconds: 0,
        phaseTitle: 'Cold Pre-Compensated Alignment State (Ambient 25°C)',
        triggerNode: 'coupling',
        headline: 'Cold reverse offset intentionally set to -0.28 mm to match calculated hot rise.',
        physicsDescription: 'Motor set lower than pump centerline. At ambient start, spacer dial reads -0.28 mm offset. Equipment is started and ramped smoothly.',
        nodeStatuses: {
          motor: 'safe',
          coupling: 'warning',
          pump: 'safe',
          seal: 'safe',
          pipe: 'safe',
          rotor: 'safe',
        },
        metricsSnapshot: {
          nozzleStressPercent: 18,
          couplingOffsetMm: 0.28,
          vibrationRMS: 2.1,
          sealLeakageMlHr: 0.5,
          sealTempC: 38,
          npshMarginRatio: 1.75,
          bearingL10h: 42000,
        },
        interlockTrips: [],
      },
      {
        timeSeconds: 60,
        phaseTitle: 'Thermal Transient Warm-Up (80°C Fluid)',
        triggerNode: 'pump',
        headline: 'Pump casing expands vertically; coupling gap closes toward zero.',
        physicsDescription: 'Boiler feed water pre-heats casing. Thermal expansion Δy = α · h · ΔT lifts pump centerline by +0.14 mm. Net running offset reduces to 0.14 mm.',
        nodeStatuses: {
          motor: 'safe',
          coupling: 'safe',
          pump: 'safe',
          seal: 'safe',
          pipe: 'safe',
          rotor: 'safe',
        },
        metricsSnapshot: {
          nozzleStressPercent: 24,
          couplingOffsetMm: 0.14,
          vibrationRMS: 1.4,
          sealLeakageMlHr: 0.4,
          sealTempC: 45,
          npshMarginRatio: 1.68,
          bearingL10h: 52000,
        },
        interlockTrips: [],
      },
      {
        timeSeconds: 150,
        phaseTitle: 'Operating Thermal Equilibrium (165°C)',
        triggerNode: 'coupling',
        headline: 'Thermal growth cancels cold bias; net running offset reaches 0.015 mm!',
        physicsDescription: 'Pump casing stabilizes at 165°C, yielding +0.27 mm thermal rise. Residual running offset is 0.015 mm (92% below API 686 allowable limit of 0.05 mm).',
        nodeStatuses: {
          motor: 'safe',
          coupling: 'safe',
          pump: 'safe',
          seal: 'safe',
          pipe: 'safe',
          rotor: 'safe',
        },
        metricsSnapshot: {
          nozzleStressPercent: 32,
          couplingOffsetMm: 0.015,
          vibrationRMS: 0.88,
          sealLeakageMlHr: 0.3,
          sealTempC: 56,
          npshMarginRatio: 1.58,
          bearingL10h: 68000,
        },
        interlockTrips: [],
      },
      {
        timeSeconds: 300,
        phaseTitle: 'Steady-State Best-in-Class Operating Point',
        triggerNode: 'rotor',
        headline: 'ISO 10816 Zone A vibration (0.82 mm/s RMS); calculated bearing L10h > 72,000 hrs.',
        physicsDescription: 'Zero 2X misalignment harmonics. Hydrodynamic seal face pressure film stable at 1.2 microns. Pipe thermal guides expand freely without nozzle binding. System benchmark achieved.',
        nodeStatuses: {
          motor: 'safe',
          coupling: 'safe',
          pump: 'safe',
          seal: 'safe',
          pipe: 'safe',
          rotor: 'safe',
        },
        metricsSnapshot: {
          nozzleStressPercent: 34,
          couplingOffsetMm: 0.012,
          vibrationRMS: 0.82,
          sealLeakageMlHr: 0.2,
          sealTempC: 58,
          npshMarginRatio: 1.55,
          bearingL10h: 74000,
        },
        interlockTrips: [],
      },
    ],
  },
];

// ============================================================================
// 2. HARDWARE / TRAIN SUBSYSTEM DATA MODELS
// ============================================================================

export function getInitialTrainComponents(): Record<TrainNodeId, TrainComponentState> {
  return {
    motor: {
      nodeId: 'motor',
      name: 'Induction Electric Motor Drive',
      tag: 'M-101',
      standard: 'NEMA MG-1 / IEEE 841',
      status: 'safe',
      healthIndex: 96,
      primaryMetric: { label: 'Electrical Load', value: '78.5', unit: '% FLC', status: 'safe' },
      secondaryMetrics: [
        { label: 'Rated Power', value: '355', unit: 'kW' },
        { label: 'Synchronous RPM', value: '2980', unit: 'RPM' },
        { label: 'Winding Temp', value: '74', unit: '°C' },
      ],
      operatingConditions: ['3-Phase 4000V 50Hz', 'TEFC Severe Duty Frame', 'Class F Insulation'],
      activeAlarms: [],
      vibrationRMS: 1.1,
      temperatureC: 74,
    },
    coupling: {
      nodeId: 'coupling',
      name: 'Flexible Disc Spacer Coupling',
      tag: 'CPL-101',
      standard: 'API 671 / API 686 Ch 5',
      status: 'safe',
      healthIndex: 94,
      primaryMetric: { label: 'Parallel Offset', value: '0.04', unit: 'mm', status: 'safe' },
      secondaryMetrics: [
        { label: 'Angular Misalignment', value: '0.12', unit: 'mrad' },
        { label: 'Spacer Length', value: '180', unit: 'mm' },
        { label: 'Transmitted Torque', value: '1,137', unit: 'N·m' },
      ],
      operatingConditions: ['Stainless Disc Pack', 'API 686 < 0.05 mm limit', 'Dynamic 2X excitation < 1.2 mm/s'],
      activeAlarms: [],
      vibrationRMS: 1.2,
      temperatureC: 48,
    },
    pump: {
      nodeId: 'pump',
      name: 'API 610 OH2 Process Pump',
      tag: 'P-101A',
      standard: 'API 610 12th Ed / ISO 13709',
      status: 'safe',
      healthIndex: 92,
      primaryMetric: { label: 'NPSH Margin Ratio', value: '1.45', unit: 'x', status: 'safe' },
      secondaryMetrics: [
        { label: 'Operating Flow', value: '320', unit: 'm³/h' },
        { label: 'Differential Head', value: '94', unit: 'm' },
        { label: 'Hydraulic Efficiency', value: '81.4', unit: '%' },
      ],
      operatingConditions: ['Centerline Supported Casing', 'Closed Radial Impeller', 'Hydrocarbon Specific Gravity 0.82'],
      activeAlarms: [],
      vibrationRMS: 1.4,
      temperatureC: 62,
    },
    seal: {
      nodeId: 'seal',
      name: 'Dual Cartridge Seal & Plan 53A',
      tag: 'MECH-SEAL-1',
      standard: 'API 682 4th Ed Plan 53A',
      status: 'safe',
      healthIndex: 95,
      primaryMetric: { label: 'Seal Chamber Temp', value: '62', unit: '°C', status: 'safe' },
      secondaryMetrics: [
        { label: 'Barrier Overpressure', value: '1.8', unit: 'bar' },
        { label: 'Volumetric Leakage', value: '1.2', unit: 'mL/h' },
        { label: 'Film Thickness h', value: '1.05', unit: 'μm' },
      ],
      operatingConditions: ['SiC vs Carbon Balance Faces', 'Mineral Barrier Fluid ISO VG 32', 'Circulation via Internal Pumping Ring'],
      activeAlarms: [],
      vibrationRMS: 1.3,
      temperatureC: 62,
    },
    pipe: {
      nodeId: 'pipe',
      name: 'Suction & Discharge Piping',
      tag: 'LINE-10"-HC',
      standard: 'ASME B31.3 §319 / API 610 Tab 5',
      status: 'safe',
      healthIndex: 90,
      primaryMetric: { label: 'ASME Stress Ratio', value: '42', unit: '% SA', status: 'safe' },
      secondaryMetrics: [
        { label: 'Thermal Expansion ΔL', value: '6.4', unit: 'mm' },
        { label: 'Axial Nozzle Thrust', value: '8.4', unit: 'kN' },
        { label: 'Resultant Flange Moment', value: '4.2', unit: 'kN·m' },
      ],
      operatingConditions: ['ASTM A106 Gr B Carbon Steel', 'Design Temp 300°C', 'Spring Hangers & PTFE Slides'],
      activeAlarms: [],
      vibrationRMS: 0.8,
      temperatureC: 120,
    },
    rotor: {
      nodeId: 'rotor',
      name: 'Rotor Assembly & Bearing Housing',
      tag: 'ROT-101',
      standard: 'ISO 1940 G2.5 / ISO 10816-3',
      status: 'safe',
      healthIndex: 93,
      primaryMetric: { label: 'Bearing Vibration RMS', value: '1.4', unit: 'mm/s', status: 'safe' },
      secondaryMetrics: [
        { label: 'Dynamic Residual Unbalance', value: '3.5', unit: 'g·mm' },
        { label: 'Centrifugal 1X Force', value: '124', unit: 'N' },
        { label: 'Calculated ISO 281 L10h', value: '48,000', unit: 'hrs' },
      ],
      operatingConditions: ['Duplex Angular Contact Thrust', 'Deep Groove Radial Roller', 'ISO VG 46 Synthetic Oil Lube'],
      activeAlarms: [],
      vibrationRMS: 1.4,
      temperatureC: 56,
    },
  };
}

// ============================================================================
// 3. PHYSICAL COUPLING TRANSFER FUNCTIONS
// ============================================================================

export function evaluateTransferLinks(
  metrics: CascadeStep['metricsSnapshot'],
  nodeStatuses: Record<TrainNodeId, StatusLevel>
): CouplingTransferLink[] {
  // Link 1: Piping Thermal Thrust -> Casing Distortion -> Coupling Misalignment
  const isPipeToCouplingExceeded = metrics.nozzleStressPercent > 100 || metrics.couplingOffsetMm > 0.05;
  const link1: CouplingTransferLink = {
    id: 'link-pipe-coupling',
    source: 'pipe',
    target: 'coupling',
    sourceLabel: 'Pipe Nozzle Thermal Load',
    targetLabel: 'Coupling Alignment Offset',
    physicalMechanism: 'Piping thermal expansion generates nozzle forces (Fx, Fy, Fz). When exceeding API 610 Table 5, baseplate elastic deflection induces pump casing soft-foot tilt, translating into angular and parallel coupling misalignment.',
    governingFormula: 'Δy_casing = F_y / k_baseplate + L_casing · sin(θ_pipe)',
    standardRef: 'ASME B31.3 §319.4.4 & API 686 Ch 5 §3.2',
    transferCoefficient: '0.0028 mm / kN',
    currentEffect: `Nozzle loading ${metrics.nozzleStressPercent}% of allowable generates ${metrics.couplingOffsetMm.toFixed(2)} mm coupling offset.`,
    isExceeded: isPipeToCouplingExceeded,
    severity: metrics.nozzleStressPercent > 150 ? 'critical' : metrics.nozzleStressPercent > 100 ? 'warning' : 'safe',
  };

  // Link 2: Coupling Misalignment -> Shaft Radial Deflection at Seal Faces
  const isCouplingToSealExceeded = metrics.couplingOffsetMm > 0.15 || metrics.sealLeakageMlHr > 10;
  const link2: CouplingTransferLink = {
    id: 'link-coupling-seal',
    source: 'coupling',
    target: 'seal',
    sourceLabel: 'Coupling Spacer Misalignment',
    targetLabel: 'Mechanical Seal Cartridge',
    physicalMechanism: 'Coupling parallel offset bends the pump shaft with 2X dynamic frequency. This bending moment propagates past the drive-end bearing, causing radial runout and face tilt at the mechanical seal stuffing box.',
    governingFormula: 'δ_seal = (M_coupling · a² · (3L - a)) / (6 · E · I)',
    standardRef: 'API 682 4th Ed §6.1.2.9 (Max 0.050 mm FIM Runout)',
    transferCoefficient: '0.14 mm runout / mm offset',
    currentEffect: `Shaft runout at seal face is ${(metrics.couplingOffsetMm * 0.14).toFixed(3)} mm; leakage rate is ${metrics.sealLeakageMlHr.toFixed(1)} mL/h.`,
    isExceeded: isCouplingToSealExceeded,
    severity: metrics.couplingOffsetMm > 0.3 ? 'critical' : metrics.couplingOffsetMm > 0.15 ? 'warning' : 'safe',
  };

  // Link 3: Pump Cavitation -> Rotor Asymmetric Erosion -> Dynamic Unbalance
  const isCavitationToRotorExceeded = metrics.npshMarginRatio < 1.0;
  const link3: CouplingTransferLink = {
    id: 'link-pump-rotor',
    source: 'pump',
    target: 'rotor',
    sourceLabel: 'Pump Cavitation Inception',
    targetLabel: 'Rotor Dynamic Unbalance',
    physicalMechanism: 'Acoustic micro-jet collapse of vapor cavities erodes metal from impeller blade suction leading edges. Asymmetric material loss introduces residual mass unbalance U, escalating 1X dynamic centrifugal forces Fc = U·ω².',
    governingFormula: 'U_residual = U_0 + Δm_eroded · r_impeller ; F_centrifugal = U · ω²',
    standardRef: 'ISO 1940-1 Grade G2.5 & HI 9.6.1',
    transferCoefficient: '2.14 g·mm / gram eroded',
    currentEffect: `NPSH margin ${metrics.npshMarginRatio.toFixed(2)}x induces vibration of ${metrics.vibrationRMS.toFixed(1)} mm/s RMS.`,
    isExceeded: isCavitationToRotorExceeded,
    severity: metrics.npshMarginRatio < 0.95 ? 'critical' : metrics.npshMarginRatio < 1.2 ? 'warning' : 'safe',
  };

  // Link 4: Rotor Dynamic Force & Misalignment -> Bearing Fatigue Life Collapse
  const isRotorToBearingExceeded = metrics.bearingL10h < 15000 || metrics.vibrationRMS > 4.5;
  const link4: CouplingTransferLink = {
    id: 'link-rotor-bearing',
    source: 'rotor',
    target: 'motor',
    sourceLabel: 'Dynamic Rotor 1X/2X Loading',
    targetLabel: 'Drive-End Bearing Life (ISO 281)',
    physicalMechanism: 'Combined centrifugal unbalance forces and coupling reaction shear sum into dynamic equivalent radial load P. Bearing L10h fatigue life scales inversely with the cube of load: L10h ∝ (C/P)³.',
    governingFormula: 'L_10h = (10⁶ / (60 · n)) · (C / P)³',
    standardRef: 'ISO 281:2007 Rolling Bearings Rating Life',
    transferCoefficient: 'Cubic Load Factor 1/P³',
    currentEffect: `Equivalent dynamic load has degraded calculated L10h bearing life to ${metrics.bearingL10h.toLocaleString()} operating hours.`,
    isExceeded: isRotorToBearingExceeded,
    severity: metrics.bearingL10h < 5000 ? 'critical' : metrics.bearingL10h < 15000 ? 'warning' : 'safe',
  };

  // Link 5: Mechanical Seal Dry Running -> Shaft Thermal Bowing Rubs
  const isSealToRotorExceeded = metrics.sealTempC > 120;
  const link5: CouplingTransferLink = {
    id: 'link-seal-rotor',
    source: 'seal',
    target: 'rotor',
    sourceLabel: 'Seal Chamber Frictional Heat',
    targetLabel: 'Shaft Thermal Bowing',
    physicalMechanism: 'Seal face dry running elevates contact temperatures to >200°C. Localized heat conducted into the shaft sleeve creates an asymmetric radial thermal gradient, causing the shaft to bow dynamically.',
    governingFormula: 'Δr_bow = (α · L² · ΔT_radial) / (8 · D_shaft)',
    standardRef: 'API 610 §6.6.1 & API 682 §8.6.2',
    transferCoefficient: '0.0008 mm bow / °C rise',
    currentEffect: `Chamber temp ${metrics.sealTempC}°C generates ${(Math.max(0, metrics.sealTempC - 60) * 0.0008).toFixed(3)} mm thermal shaft deflection.`,
    isExceeded: isSealToRotorExceeded,
    severity: metrics.sealTempC > 140 ? 'critical' : metrics.sealTempC > 95 ? 'warning' : 'safe',
  };

  return [link1, link2, link3, link4, link5];
}

// ============================================================================
// 4. SAFETY INSTRUMENTED SYSTEM (SIS) INTERLOCK SENSORS
// ============================================================================

export function evaluateSISSensors(
  metrics: CascadeStep['metricsSnapshot'],
  bypasses: Record<string, boolean> = {}
): {
  sensors: SISInterlockSensor[];
  isTrainTripped: boolean;
  tripReason: string | null;
} {
  const sensors: SISInterlockSensor[] = [
    {
      tag: 'VSHH-101',
      description: 'Drive-End Bearing Housing Vibration Transmitter',
      nodeId: 'rotor',
      currentValue: metrics.vibrationRMS,
      unit: 'mm/s RMS',
      warningThreshold: 4.5,
      tripSetpoint: 7.1, // ISO 10816 Zone D boundary
      votingLogic: '2oo3',
      isWarning: metrics.vibrationRMS >= 4.5 && metrics.vibrationRMS < 7.1,
      isTripped: metrics.vibrationRMS >= 7.1 && !bypasses['VSHH-101'],
      bypassed: !!bypasses['VSHH-101'],
    },
    {
      tag: 'TSHH-104',
      description: 'Mechanical Seal Chamber Fluid Temperature',
      nodeId: 'seal',
      currentValue: metrics.sealTempC,
      unit: '°C',
      warningThreshold: 90,
      tripSetpoint: 125, // Vapor flash point trip
      votingLogic: '1oo2',
      isWarning: metrics.sealTempC >= 90 && metrics.sealTempC < 125,
      isTripped: metrics.sealTempC >= 125 && !bypasses['TSHH-104'],
      bypassed: !!bypasses['TSHH-104'],
    },
    {
      tag: 'PSLL-204',
      description: 'Suction Line Pressure Low-Low (NPSH Collapse)',
      nodeId: 'pump',
      currentValue: metrics.npshMarginRatio,
      unit: 'x margin',
      warningThreshold: 1.1,
      tripSetpoint: 0.95, // Below NPSHr trip
      votingLogic: '2oo3',
      isWarning: metrics.npshMarginRatio <= 1.1 && metrics.npshMarginRatio > 0.95,
      isTripped: metrics.npshMarginRatio <= 0.95 && !bypasses['PSLL-204'],
      bypassed: !!bypasses['PSLL-204'],
    },
    {
      tag: 'MSHH-301',
      description: 'ASME B31.3 Pipe Flange Thermal Stress Monitor',
      nodeId: 'pipe',
      currentValue: metrics.nozzleStressPercent,
      unit: '% SA Allowable',
      warningThreshold: 100,
      tripSetpoint: 175,
      votingLogic: '1oo1',
      isWarning: metrics.nozzleStressPercent >= 100 && metrics.nozzleStressPercent < 175,
      isTripped: metrics.nozzleStressPercent >= 175 && !bypasses['MSHH-301'],
      bypassed: !!bypasses['MSHH-301'],
    },
  ];

  const trippedSensors = sensors.filter((s) => s.isTripped);
  const isTrainTripped = trippedSensors.length > 0;
  const tripReason = isTrainTripped
    ? trippedSensors.map((s) => `${s.tag} (${s.description}): ${s.currentValue} ${s.unit} (Trip Setpoint: ${s.tripSetpoint})`).join('; ')
    : null;

  return { sensors, isTrainTripped, tripReason };
}

// ============================================================================
// 5. COUPLED TRAIN SIMULATION ENGINE
// ============================================================================

export function calculateCoupledTrainSimulation(
  scenarioId: string,
  timeSeconds: number,
  isCoupledPhysicsEnabled: boolean,
  sensorBypasses: Record<string, boolean> = {}
): CoupledTrainSimulationResult {
  const scenario = CASCADE_SCENARIOS.find((s) => s.id === scenarioId) || CASCADE_SCENARIOS[0];

  // Find surrounding steps for interpolation
  const steps = scenario.steps;
  let lowerStep = steps[0];
  let upperStep = steps[steps.length - 1];

  for (let i = 0; i < steps.length - 1; i++) {
    if (timeSeconds >= steps[i].timeSeconds && timeSeconds <= steps[i + 1].timeSeconds) {
      lowerStep = steps[i];
      upperStep = steps[i + 1];
      break;
    }
  }

  const dt = upperStep.timeSeconds - lowerStep.timeSeconds;
  const factor = dt === 0 ? 0 : Math.min(1, Math.max(0, (timeSeconds - lowerStep.timeSeconds) / dt));

  // Interpolate metrics
  const mLow = lowerStep.metricsSnapshot;
  const mHigh = upperStep.metricsSnapshot;

  const interpolatedMetrics: CascadeStep['metricsSnapshot'] = {
    nozzleStressPercent: Math.round(mLow.nozzleStressPercent + (mHigh.nozzleStressPercent - mLow.nozzleStressPercent) * factor),
    couplingOffsetMm: Number((mLow.couplingOffsetMm + (mHigh.couplingOffsetMm - mLow.couplingOffsetMm) * factor).toFixed(3)),
    vibrationRMS: Number((mLow.vibrationRMS + (mHigh.vibrationRMS - mLow.vibrationRMS) * factor).toFixed(2)),
    sealLeakageMlHr: Number((mLow.sealLeakageMlHr + (mHigh.sealLeakageMlHr - mLow.sealLeakageMlHr) * factor).toFixed(1)),
    sealTempC: Math.round(mLow.sealTempC + (mHigh.sealTempC - mLow.sealTempC) * factor),
    npshMarginRatio: Number((mLow.npshMarginRatio + (mHigh.npshMarginRatio - mLow.npshMarginRatio) * factor).toFixed(2)),
    bearingL10h: Math.round(mLow.bearingL10h + (mHigh.bearingL10h - mLow.bearingL10h) * factor),
  };

  // If uncoupled, reset downstream secondary reactions to baseline
  const effectiveMetrics = isCoupledPhysicsEnabled
    ? interpolatedMetrics
    : {
        ...interpolatedMetrics,
        // decouple: pipe doesn't push coupling, cavitation doesn't erode rotor
        couplingOffsetMm: scenario.rootCauseNode === 'coupling' ? interpolatedMetrics.couplingOffsetMm : 0.04,
        vibrationRMS: scenario.rootCauseNode === 'rotor' ? interpolatedMetrics.vibrationRMS : 1.4,
        sealLeakageMlHr: scenario.rootCauseNode === 'seal' ? interpolatedMetrics.sealLeakageMlHr : 1.2,
      };

  // Determine current node statuses
  const nodeStatuses: Record<TrainNodeId, StatusLevel> = {
    motor: factor > 0.6 ? upperStep.nodeStatuses.motor : lowerStep.nodeStatuses.motor,
    coupling: factor > 0.6 ? upperStep.nodeStatuses.coupling : lowerStep.nodeStatuses.coupling,
    pump: factor > 0.6 ? upperStep.nodeStatuses.pump : lowerStep.nodeStatuses.pump,
    seal: factor > 0.6 ? upperStep.nodeStatuses.seal : lowerStep.nodeStatuses.seal,
    pipe: factor > 0.6 ? upperStep.nodeStatuses.pipe : lowerStep.nodeStatuses.pipe,
    rotor: factor > 0.6 ? upperStep.nodeStatuses.rotor : lowerStep.nodeStatuses.rotor,
  };

  // Build component states with active telemetry
  const baseComponents = getInitialTrainComponents();
  const components: Record<TrainNodeId, TrainComponentState> = {
    motor: {
      ...baseComponents.motor,
      status: nodeStatuses.motor,
      healthIndex: Math.max(15, Math.round(96 - (effectiveMetrics.vibrationRMS / 11) * 60)),
      vibrationRMS: effectiveMetrics.vibrationRMS * 0.75,
      temperatureC: Math.min(130, Math.round(74 + (effectiveMetrics.vibrationRMS > 4 ? 25 : 0))),
      primaryMetric: {
        label: 'Electrical Load',
        value: `${(78.5 + (effectiveMetrics.vibrationRMS > 6 ? 18 : 0)).toFixed(1)}`,
        unit: '% FLC',
        status: nodeStatuses.motor,
      },
      secondaryMetrics: [
        { label: 'Shaft Speed', value: `${(2980 - (effectiveMetrics.vibrationRMS > 8 ? 45 : 0))}`, unit: 'RPM' },
        { label: 'Winding Temp', value: `${Math.round(74 + (effectiveMetrics.vibrationRMS > 4 ? 25 : 0))}`, unit: '°C' },
        { label: 'Stator Current', value: `${(62 + (effectiveMetrics.vibrationRMS > 6 ? 14 : 0)).toFixed(1)}`, unit: 'A' },
      ],
    },
    coupling: {
      ...baseComponents.coupling,
      status: nodeStatuses.coupling,
      healthIndex: Math.max(10, Math.round(94 - (effectiveMetrics.couplingOffsetMm / 0.5) * 80)),
      vibrationRMS: effectiveMetrics.vibrationRMS * 0.9,
      temperatureC: Math.min(110, Math.round(48 + effectiveMetrics.couplingOffsetMm * 90)),
      primaryMetric: {
        label: 'Parallel Offset',
        value: `${effectiveMetrics.couplingOffsetMm.toFixed(3)}`,
        unit: 'mm',
        status: nodeStatuses.coupling,
      },
      secondaryMetrics: [
        { label: 'Angular Misalignment', value: `${(effectiveMetrics.couplingOffsetMm * 2.8).toFixed(2)}`, unit: 'mrad' },
        { label: '2X Harmonic Vibe', value: `${(effectiveMetrics.vibrationRMS * 0.55).toFixed(2)}`, unit: 'mm/s' },
        { label: 'API 686 Used', value: `${Math.round((effectiveMetrics.couplingOffsetMm / 0.05) * 100)}%`, unit: 'limit' },
      ],
    },
    pump: {
      ...baseComponents.pump,
      status: nodeStatuses.pump,
      healthIndex: Math.max(12, Math.round(92 - (effectiveMetrics.npshMarginRatio < 1.0 ? 60 : 0) - (effectiveMetrics.nozzleStressPercent > 100 ? 25 : 0))),
      vibrationRMS: effectiveMetrics.vibrationRMS,
      temperatureC: Math.round(62 + (effectiveMetrics.sealTempC > 100 ? 15 : 0)),
      primaryMetric: {
        label: 'NPSH Margin Ratio',
        value: `${effectiveMetrics.npshMarginRatio.toFixed(2)}`,
        unit: 'x',
        status: nodeStatuses.pump,
      },
      secondaryMetrics: [
        { label: 'Operating Flow', value: `${(320 * Math.min(1, effectiveMetrics.npshMarginRatio)).toFixed(0)}`, unit: 'm³/h' },
        { label: 'Differential Head', value: `${(94 * Math.min(1, Math.max(0.7, effectiveMetrics.npshMarginRatio))).toFixed(1)}`, unit: 'm' },
        { label: 'Casing Deflection', value: `${(effectiveMetrics.nozzleStressPercent * 0.002).toFixed(3)}`, unit: 'mm' },
      ],
    },
    seal: {
      ...baseComponents.seal,
      status: nodeStatuses.seal,
      healthIndex: Math.max(8, Math.round(95 - (effectiveMetrics.sealTempC / 200) * 80)),
      vibrationRMS: effectiveMetrics.vibrationRMS * 0.85,
      temperatureC: effectiveMetrics.sealTempC,
      primaryMetric: {
        label: 'Chamber Temperature',
        value: `${effectiveMetrics.sealTempC}`,
        unit: '°C',
        status: nodeStatuses.seal,
      },
      secondaryMetrics: [
        { label: 'Volumetric Leakage', value: `${effectiveMetrics.sealLeakageMlHr.toFixed(1)}`, unit: 'mL/h' },
        { label: 'Radial Face Runout', value: `${(effectiveMetrics.couplingOffsetMm * 0.14).toFixed(3)}`, unit: 'mm' },
        { label: 'Vapor Margin', value: `${Math.max(0, 165 - effectiveMetrics.sealTempC).toFixed(1)}`, unit: '°C margin' },
      ],
    },
    pipe: {
      ...baseComponents.pipe,
      status: nodeStatuses.pipe,
      healthIndex: Math.max(15, Math.round(90 - (effectiveMetrics.nozzleStressPercent / 200) * 75)),
      vibrationRMS: 0.8 + effectiveMetrics.vibrationRMS * 0.1,
      temperatureC: Math.round(120 + (effectiveMetrics.nozzleStressPercent / 220) * 160),
      primaryMetric: {
        label: 'ASME B31.3 Stress',
        value: `${effectiveMetrics.nozzleStressPercent}`,
        unit: '% SA',
        status: nodeStatuses.pipe,
      },
      secondaryMetrics: [
        { label: 'Axial Nozzle Thrust', value: `${(effectiveMetrics.nozzleStressPercent * 0.2).toFixed(1)}`, unit: 'kN' },
        { label: 'Thermal Expansion ΔL', value: `${(effectiveMetrics.nozzleStressPercent * 0.08).toFixed(1)}`, unit: 'mm' },
        { label: 'API 610 Table 5 Used', value: `${Math.round((effectiveMetrics.nozzleStressPercent / 100) * 120)}%`, unit: 'envelope' },
      ],
    },
    rotor: {
      ...baseComponents.rotor,
      status: nodeStatuses.rotor,
      healthIndex: Math.max(5, Math.round(93 - (effectiveMetrics.vibrationRMS / 12) * 85)),
      vibrationRMS: effectiveMetrics.vibrationRMS,
      temperatureC: Math.min(125, Math.round(56 + (effectiveMetrics.vibrationRMS / 10) * 45)),
      primaryMetric: {
        label: 'Bearing Vibration',
        value: `${effectiveMetrics.vibrationRMS.toFixed(2)}`,
        unit: 'mm/s RMS',
        status: nodeStatuses.rotor,
      },
      secondaryMetrics: [
        { label: 'ISO 281 L10h Life', value: `${effectiveMetrics.bearingL10h.toLocaleString()}`, unit: 'hrs' },
        { label: 'Centrifugal 1X Force', value: `${Math.round(124 + effectiveMetrics.vibrationRMS * 280)}`, unit: 'N' },
        { label: 'ISO 10816 Zone', value: effectiveMetrics.vibrationRMS < 2.3 ? 'Zone A (Good)' : effectiveMetrics.vibrationRMS < 4.5 ? 'Zone B (Acceptable)' : effectiveMetrics.vibrationRMS < 7.1 ? 'Zone C (Warning)' : 'Zone D (Trip)', unit: 'rating' },
      ],
    },
  };

  // Evaluate physical coupling links
  const transferLinks = evaluateTransferLinks(effectiveMetrics, nodeStatuses);

  // Evaluate SIS safety interlocks
  const { sensors: sisSensors, isTrainTripped, tripReason: activeTripReason } = evaluateSISSensors(effectiveMetrics, sensorBypasses);

  // Calculate overall train health & status
  const healthValues = Object.values(components).map((c) => c.healthIndex);
  const overallTrainHealth = Math.round(healthValues.reduce((a, b) => a + b, 0) / healthValues.length);

  const statuses = Object.values(components).map((c) => c.status);
  const trainStatus: StatusLevel = isTrainTripped || statuses.includes('critical') ? 'critical' : statuses.includes('warning') ? 'warning' : 'safe';

  // Coupling loss & mechanical metrics
  const couplingLossKW = Number((0.45 + effectiveMetrics.couplingOffsetMm * 3.8).toFixed(2));
  const hydraulicEfficiency = Number((81.4 * Math.max(0.6, Math.min(1, effectiveMetrics.npshMarginRatio))).toFixed(1));
  const totalVibrationSumMmS = Number(Object.values(components).reduce((sum, c) => sum + (c.vibrationRMS || 0), 0).toFixed(2));

  return {
    overallTrainHealth,
    trainStatus,
    components,
    transferLinks,
    sisSensors,
    isTrainTripped,
    activeTripReason,
    couplingLossKW,
    hydraulicEfficiency,
    totalVibrationSumMmS,
  };
}

// ============================================================================
// 6. EXPORT / REPORT HELPERS
// ============================================================================

export function exportCoupledTrainCSV(result: CoupledTrainSimulationResult, scenario: CascadeScenario, timeSeconds: number): string {
  const lines: string[] = [];
  lines.push('MECHANICAL LAB PRO - PILLAR 4: COUPLED MACHINERY TRAIN & FAILURE CASCADE DOSSIER');
  lines.push(`Scenario,${scenario.title}`);
  lines.push(`Industry Context,${scenario.industry}`);
  lines.push(`Simulation Time,${timeSeconds} seconds`);
  lines.push(`Train Status,${result.trainStatus.toUpperCase()}`);
  lines.push(`Overall Train Health Index,${result.overallTrainHealth} / 100`);
  lines.push(`Emergency Trip Actuated,${result.isTrainTripped ? 'YES - EMERGENCY SHUTDOWN' : 'NO - IN OPERATION'}`);
  if (result.activeTripReason) {
    lines.push(`Active Trip Cause,"${result.activeTripReason}"`);
  }
  lines.push('');
  lines.push('--- EQUIPMENT TRAIN COMPONENT TELEMETRY ---');
  lines.push('Node ID,Equipment Name,Standard,Status,Health Index,Primary Metric,Primary Value,Primary Unit,Vibration RMS (mm/s),Temp (°C)');
  for (const c of Object.values(result.components)) {
    lines.push(`${c.nodeId},"${c.name}",${c.standard},${c.status},${c.healthIndex},"${c.primaryMetric.label}",${c.primaryMetric.value},${c.primaryMetric.unit},${c.vibrationRMS || 'N/A'},${c.temperatureC || 'N/A'}`);
  }
  lines.push('');
  lines.push('--- CROSS-SYSTEM PHYSICAL TRANSFER COUPLINGS ---');
  lines.push('Source Subsystem,Target Subsystem,Physical Mechanism,Governing Formula,Standard,Severity,Exceeded?');
  for (const l of result.transferLinks) {
    lines.push(`"${l.sourceLabel}","${l.targetLabel}","${l.physicalMechanism}","${l.governingFormula}",${l.standardRef},${l.severity},${l.isExceeded ? 'YES' : 'NO'}`);
  }
  lines.push('');
  lines.push('--- SAFETY INSTRUMENTED SYSTEM (SIS) INTERLOCKS ---');
  lines.push('Tag,Description,Subsystem,Current Value,Unit,Warning Threshold,Trip Setpoint,Voting,Status');
  for (const s of result.sisSensors) {
    const status = s.bypassed ? 'BYPASSED' : s.isTripped ? 'TRIPPED' : s.isWarning ? 'WARNING' : 'NORMAL';
    lines.push(`${s.tag},"${s.description}",${s.nodeId},${s.currentValue},${s.unit},${s.warningThreshold},${s.tripSetpoint},${s.votingLogic},${status}`);
  }
  return lines.join('\n');
}

export function exportCoupledTrainJSON(result: CoupledTrainSimulationResult, scenario: CascadeScenario, timeSeconds: number): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      platform: 'Mechanical Lab Pro',
      pillar: 'Pillar 4: Coupled Machinery Train & Plant-Wide Failure Cascade Simulator',
      scenario: {
        id: scenario.id,
        title: scenario.title,
        industry: scenario.industry,
        rootCause: scenario.rootCauseDescription,
        terminalOutcome: scenario.terminalOutcome,
        mitigation: scenario.recommendedMitigation,
      },
      simulationState: {
        timeSeconds,
        overallTrainHealth: result.overallTrainHealth,
        trainStatus: result.trainStatus,
        isTrainTripped: result.isTrainTripped,
        activeTripReason: result.activeTripReason,
        couplingLossKW: result.couplingLossKW,
        hydraulicEfficiency: result.hydraulicEfficiency,
        totalVibrationSumMmS: result.totalVibrationSumMmS,
      },
      equipmentNodes: result.components,
      transferLinks: result.transferLinks,
      sisInterlocks: result.sisSensors,
    },
    null,
    2
  );
}
