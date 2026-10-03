/**
 * Root Cause Analysis (RCA), 5-Whys, Ishikawa (Fishbone) & CAPA Diagnostics
 * Reference Framework: ISO 55000 / API 689 / EPRI NP-6096 Rotating Equipment RCA
 * Academic reference benchmark for systematic reliability engineering investigations.
 */

import { SimulatorId } from '../types/common';

export interface WhyNode {
  id: string;
  order: number;
  question: string;
  answer: string;
  isRootCause: boolean;
  verificationEvidence: string;
}

export type FishboneCategory =
  | 'machine'
  | 'method'
  | 'material'
  | 'measurement'
  | 'manpower'
  | 'environment';

export interface FishboneItem {
  id: string;
  category: FishboneCategory;
  causeText: string;
  probability: 'high' | 'medium' | 'low';
  isRootCause: boolean;
  notes?: string;
}

export interface TimelineEvent {
  id: string;
  relativeMinutes: number; // e.g. -60, -15, 0 (trip), +10
  label: string;
  description: string;
  telemetryNote: string;
  severity: 'nominal' | 'warning' | 'critical';
}

export interface CapaItem {
  id: string;
  actionTitle: string;
  type: 'corrective' | 'preventive';
  assignee: string;
  targetDays: number;
  verificationCriteria: string;
  status: 'open' | 'in-progress' | 'verified';
}

export interface RcaInvestigation {
  id: string;
  title: string;
  assetTag: string;
  simulatorId: SimulatorId;
  incidentDate: string;
  incidentSummary: string;
  severity: 'Level 1 Catastrophic' | 'Level 2 Serious Trip' | 'Level 3 Reliability Alert';
  primarySymptom: string;
  whyNodes: WhyNode[];
  fishboneItems: FishboneItem[];
  timelineEvents: TimelineEvent[];
  capaItems: CapaItem[];
}

export const RCA_PRESET_INVESTIGATIONS: Record<string, RcaInvestigation> = {
  'pump-cavitation': {
    id: 'rca-pump-cavitation',
    title: 'Boiler Feed Pump Cavitation Erosion & Impeller Shroud Pitting',
    assetTag: 'P-101A',
    simulatorId: 'pump',
    incidentDate: '2026-04-12',
    incidentSummary:
      'Centrifugal pump exhibited loud gravel-like popping acoustic noise, 1X/blade-pass vibration surge to 11.2 mm/s RMS, and 28% head degradation over 48 hours of low suction tank level operation.',
    severity: 'Level 2 Serious Trip',
    primarySymptom: 'Acoustic gravel noise, high blade-pass vibration, and rapid head loss',
    whyNodes: [
      {
        id: 'w1',
        order: 1,
        question: 'Why did the pump head drop by 28% and vibration spike to 11.2 mm/s?',
        answer: 'Vapor bubbles formed and violently collapsed against the impeller blade suction surfaces, eroding metal.',
        isRootCause: false,
        verificationEvidence: 'Borescope inspection showed sponge-like pitting on suction eye vanes.',
      },
      {
        id: 'w2',
        order: 2,
        question: 'Why were vapor bubbles forming inside the impeller suction eye?',
        answer: 'NPSH Available (3.1 m) dropped below vendor certified NPSH Required (3.8 m), breaching the safety margin ratio.',
        isRootCause: false,
        verificationEvidence: 'Suction pressure transmitter PT-101 read 0.32 bar gauge vs normal 0.95 bar gauge.',
      },
      {
        id: 'w3',
        order: 3,
        question: 'Why did NPSH Available drop to 3.1 m?',
        answer: 'Suction line frictional pressure drop surged from 0.4 m to 1.8 m while deaerator liquid level was held at minimum limit.',
        isRootCause: false,
        verificationEvidence: 'Differential pressure across suction strainer ST-101 reached 1.1 bar.',
      },
      {
        id: 'w4',
        order: 4,
        question: 'Why did the suction strainer experience an excessive differential pressure of 1.1 bar?',
        answer: 'The temporary startup cone strainer basket was clogged with construction weld slag and pipe scale.',
        isRootCause: false,
        verificationEvidence: 'Physical strainer basket removal revealed 85% surface area occluded with magnetite slag.',
      },
      {
        id: 'w5',
        order: 5,
        question: 'Why was a temporary startup cone strainer still installed 6 months after plant commissioning?',
        answer: 'The pre-commissioning handover checklist did not mandate permanent removal and inspection of temporary commissioning strainers prior to commercial turnover.',
        isRootCause: true,
        verificationEvidence: 'Commissioning Procedure SOP-PR-402 lacked a sign-off line item for temporary strainer replacement with permanent low-loss spool.',
      },
    ],
    fishboneItems: [
      { id: 'fb1', category: 'machine', causeText: 'NPSHr margin ratio 0.81x (< 1.10x HI 9.6.1 minimum)', probability: 'high', isRootCause: false },
      { id: 'fb2', category: 'machine', causeText: 'Impeller 316SS metallurgy susceptible to severe bubble collapse erosion', probability: 'medium', isRootCause: false },
      { id: 'fb3', category: 'method', causeText: 'SOP lacked temporary strainer removal sign-off prior to commercial run', probability: 'high', isRootCause: true },
      { id: 'fb4', category: 'method', causeText: 'Suction strainer delta-P alarm limit set too high (1.5 bar instead of 0.3 bar)', probability: 'high', isRootCause: false },
      { id: 'fb5', category: 'material', causeText: 'Deaerator feed water contained loose welding slag and pipe scale debris', probability: 'medium', isRootCause: false },
      { id: 'fb6', category: 'measurement', causeText: 'Suction pressure transmitter impulse line partially air-locked, dampening alarm', probability: 'medium', isRootCause: false },
      { id: 'fb7', category: 'manpower', causeText: 'Operator unaware that gravel popping sound indicated suction cavitation vs mechanical rub', probability: 'medium', isRootCause: false },
      { id: 'fb8', category: 'environment', causeText: 'High summer ambient temperature raised deaerator vapor pressure by 0.15 bar', probability: 'low', isRootCause: false },
    ],
    timelineEvents: [
      { id: 't1', relativeMinutes: -120, label: 'Normal Baseline', description: 'Pump operating at BEP. NPSHa = 5.2 m, NPSHr = 3.8 m. Vibration 1.8 mm/s.', telemetryNote: 'NPSH Margin = 1.37x', severity: 'nominal' },
      { id: 't2', relativeMinutes: -45, label: 'Suction DP Warning', description: 'Suction strainer differential pressure exceeds 0.4 bar warning threshold.', telemetryNote: 'PT-101 drop from 0.95 to 0.65 bar', severity: 'warning' },
      { id: 't3', relativeMinutes: -15, label: 'Cavitation Inception', description: 'Acoustic noise increases; blade pass frequency (BPF = 7X) harmonics elevate 300%.', telemetryNote: 'NPSHa drops to 3.6 m (< NPSHr)', severity: 'warning' },
      { id: 't4', relativeMinutes: 0, label: 'Vibration SIS Trip', description: 'Overall vibration reaches 11.2 mm/s RMS (ISO 10816 Zone D trip setpoint). Pump trips on high radial vibration.', telemetryNote: 'Discharge pressure collapsed to 4.2 bar', severity: 'critical' },
      { id: 't5', relativeMinutes: 30, label: 'Post-Trip Borescope', description: 'Internal endoscopic inspection reveals cavitation micro-pitting on 4 of 7 impeller vanes.', telemetryNote: 'Metal erosion depth approx 0.8 mm', severity: 'nominal' },
    ],
    capaItems: [
      { id: 'c1', actionTitle: 'Remove temporary cone strainer and replace with permanent low-resistance ASME suction spool', type: 'corrective', assignee: 'Mechanical Maintenance Lead', targetDays: 2, verificationCriteria: 'Visual sign-off & suction DP < 0.1 bar @ rated flow', status: 'verified' },
      { id: 'c2', actionTitle: 'Update commissioning handover SOP-PR-402 with mandatory sign-off for temporary strainer removal', type: 'preventive', assignee: 'Plant Reliability Engineer', targetDays: 14, verificationCriteria: 'Engineering document change notice approved & signed', status: 'in-progress' },
      { id: 'c3', actionTitle: 'Configure DCS low NPSHa warning interlock with 1.20x margin threshold to trigger deaerator level trim', type: 'preventive', assignee: 'Control Systems Specialist', targetDays: 7, verificationCriteria: 'DCS simulation test verifying interlock alarm firing', status: 'open' },
    ],
  },

  'compressor-surge': {
    id: 'rca-compressor-surge',
    title: 'Multi-Stage Syngas Centrifugal Compressor Severe Surge & Thrust Bearing Failure',
    assetTag: 'K-201',
    simulatorId: 'compressor',
    incidentDate: '2026-05-28',
    incidentSummary:
      'Compressor entered violent, cyclical deep surge during rapid plant turndown. Reversal of mass flow produced 4.8 G axial thrust reversals, blowing through the active tilting-pad thrust bearing and triggering emergency ESD.',
    severity: 'Level 1 Catastrophic',
    primarySymptom: 'Massive flow oscillation, 4.8 G axial vibration shock spikes, thrust collar wipe',
    whyNodes: [
      {
        id: 'w1',
        order: 1,
        question: 'Why did the compressor active thrust bearing wipe its babbitt metal?',
        answer: 'Repeated instantaneous gas flow reversals created axial thrust forces exceeding 185 kN, crushing the oil film.',
        isRootCause: false,
        verificationEvidence: 'Thrust pad temperature RTD spiked from 78°C to 134°C within 1.4 seconds.',
      },
      {
        id: 'w2',
        order: 2,
        question: 'Why did cyclical flow reversal occur across the impellers?',
        answer: 'The operating point crossed the Surge Control Line (SCL) into the deep aerodynamic surge zone.',
        isRootCause: false,
        verificationEvidence: 'Suction orifice flow plummeted to zero while discharge pressure oscillated at 1.8 Hz.',
      },
      {
        id: 'w3',
        order: 3,
        question: 'Why did the anti-surge control system fail to recycle gas and keep the compressor right of the SCL?',
        answer: 'The anti-surge recycle valve (ASV) stroke time was 4.2 seconds instead of the required 1.5 seconds fail-open specification.',
        isRootCause: false,
        verificationEvidence: 'DCS valve travel log showed valve opened only 35% when the surge cycle initiated.',
      },
      {
        id: 'w4',
        order: 4,
        question: 'Why was the anti-surge valve opening sluggishly at 4.2 seconds?',
        answer: 'The quick-exhaust valve on the pneumatic valve positioner was clogged with desiccant dust from the instrument air dryer.',
        isRootCause: false,
        verificationEvidence: 'Instrument technician disassembled the quick exhaust and discovered white alumina dust powder.',
      },
      {
        id: 'w5',
        order: 5,
        question: 'Why was desiccant dust present in the critical safety instrument air line?',
        answer: 'The instrument air dryer after-filter coalescing element was omitted during the turnaround filter changeout 3 weeks prior.',
        isRootCause: true,
        verificationEvidence: 'Turnaround work pack showed work order closed out without signed filter element verification tag.',
      },
    ],
    fishboneItems: [
      { id: 'fb1', category: 'machine', causeText: 'ASV pneumatic quick-exhaust valve clogged with alumina dust', probability: 'high', isRootCause: false },
      { id: 'fb2', category: 'machine', causeText: 'Anti-surge controller dP/dt derivative response gain detuned too slow', probability: 'medium', isRootCause: false },
      { id: 'fb3', category: 'method', causeText: 'Turnaround quality assurance lacked independent inspection of filter install', probability: 'high', isRootCause: true },
      { id: 'fb4', category: 'material', causeText: 'Dryer desiccant beads degraded into fine powder due to moisture breakthrough', probability: 'medium', isRootCause: false },
      { id: 'fb5', category: 'measurement', causeText: 'Instrument air header dewpoint analyzer out of calibration (read -40°C false)', probability: 'medium', isRootCause: false },
      { id: 'fb6', category: 'manpower', causeText: 'Instrument technician did not install after-filter replacement cartridge', probability: 'high', isRootCause: false },
      { id: 'fb7', category: 'environment', causeText: 'Downstream process upset caused sudden 40% gas feed interruption', probability: 'medium', isRootCause: false },
    ],
    timelineEvents: [
      { id: 't1', relativeMinutes: -30, label: 'Feed Cut Upset', description: 'Upstream gasifier tripped, cutting compressor mass flow by 45% in 3 seconds.', telemetryNote: 'Inlet flow drops from 42 kg/s to 23 kg/s', severity: 'warning' },
      { id: 't2', relativeMinutes: -1, label: 'Anti-Surge Trip Demand', description: 'Operating point hits Surge Limit Line. Controller commands ASV to snap 100% open.', telemetryNote: 'ASV command = 100%, position lags at 35%', severity: 'warning' },
      { id: 't3', relativeMinutes: 0, label: 'Surge Inception', description: 'Compressor enters deep surge. 1.8 Hz acoustic booming and 4.8 G axial acceleration shock.', telemetryNote: 'Axial position probe spikes to +0.45 mm', severity: 'critical' },
      { id: 't4', relativeMinutes: 2, label: 'Emergency ESD Trip', description: 'Turbine trip valve slams shut on high axial displacement. Train coasts down.', telemetryNote: 'Rotor coastdown completed in 184 seconds', severity: 'critical' },
    ],
    capaItems: [
      { id: 'c1', actionTitle: 'Rebuild compressor thrust bearing assembly with new babbitt tilting pads and verify end-play', type: 'corrective', assignee: 'Turbomachinery Specialist', targetDays: 5, verificationCriteria: 'Axial float measured at 0.30 mm per API 617 clearance sheet', status: 'in-progress' },
      { id: 'c2', actionTitle: 'Clean pneumatic quick-exhaust valves and install certified 0.3-micron particulate after-filters', type: 'corrective', assignee: 'I&C Lead', targetDays: 3, verificationCriteria: 'Stroke test confirmed ASV open time < 1.2 seconds', status: 'verified' },
      { id: 'c3', actionTitle: 'Implement mandatory two-person sign-off protocol on all safety-critical instrument air filter changes', type: 'preventive', assignee: 'Quality Assurance Manager', targetDays: 14, verificationCriteria: 'Updated QA procedure released to maintenance management system', status: 'open' },
    ],
  },

  'gearbox-micropitting': {
    id: 'rca-gearbox-micropitting',
    title: 'Extruder Drive Helical Speed Reducer Gear Tooth Pitting & Lubricant Starvation',
    assetTag: 'GB-401',
    simulatorId: 'gearbox',
    incidentDate: '2026-07-04',
    incidentSummary:
      'High-speed helical gearbox exhibited progressive 24 kHz gear mesh frequency sideband growth, oil sump temperature climbing to 94°C, and magnetic plug accumulation of fine steel spall flakes.',
    severity: 'Level 2 Serious Trip',
    primarySymptom: 'Gear mesh acoustic screech, magnetic plug metal fuzz, 94°C sump temperature',
    whyNodes: [
      {
        id: 'w1',
        order: 1,
        question: 'Why did magnetic drain plugs accumulate 35 grams of fine steel wear debris?',
        answer: 'High-speed pinion teeth experienced micro-pitting and surface fatigue along the dedendum pitch line.',
        isRootCause: false,
        verificationEvidence: 'Borescope photos revealed frosted grey band of micro-pitting across 100% of pinion teeth.',
      },
      {
        id: 'w2',
        order: 2,
        question: 'Why did the pinion teeth suffer surface fatigue micro-pitting?',
        answer: 'The elastohydrodynamic (EHL) oil film thickness ratio lambda (λ) fell below 0.85, causing continuous metal-to-metal asperity contact.',
        isRootCause: false,
        verificationEvidence: 'AGMA 9005 calculation showed minimum operating film thickness of 0.18 µm vs combined surface roughness 0.28 µm.',
      },
      {
        id: 'w3',
        order: 3,
        question: 'Why did the EHL film thickness ratio collapse to 0.85?',
        answer: 'Operating oil viscosity was only 28 cSt at 94°C because the gearbox was filled with ISO VG 150 instead of specified ISO VG 320 synthetic oil.',
        isRootCause: false,
        verificationEvidence: 'Lab oil sample confirmed ASTM D445 viscosity at 40°C was 146 cSt (ISO VG 150 grade).',
      },
      {
        id: 'w4',
        order: 4,
        question: 'Why was ISO VG 150 oil charged into an ISO VG 320 specified gearbox?',
        answer: 'Lube oil dispensing drums in the plant oil room had faded handwritten grease-pencil labels and identical quick-connect couplers.',
        isRootCause: false,
        verificationEvidence: 'Oil storage audit found VG 150 and VG 320 drums stored side-by-side with weathered unreadable tags.',
      },
      {
        id: 'w5',
        order: 5,
        question: 'Why were different viscosity lubricants stored with identical fittings and inadequate labeling?',
        answer: 'The plant lubrication management program had not implemented ISO 4406 / API color-coded dedicated dispensing hardware and mistake-proof lube couplers.',
        isRootCause: true,
        verificationEvidence: 'Plant Reliability Audit Finding RA-2025-08 previously recommended color-coded lube tags but was never funded.',
      },
    ],
    fishboneItems: [
      { id: 'fb1', category: 'machine', causeText: 'EHL lambda ratio λ = 0.85 (< 1.50 recommended AGMA limit)', probability: 'high', isRootCause: false },
      { id: 'fb2', category: 'machine', causeText: 'Gearbox lube oil cooler water flow valve throttled 70% closed', probability: 'medium', isRootCause: false },
      { id: 'fb3', category: 'method', causeText: 'No laboratory verification requirement before adding bulk top-off lubricant', probability: 'high', isRootCause: false },
      { id: 'fb4', category: 'material', causeText: 'ISO VG 150 mineral oil used instead of ISO VG 320 synthetic PAO', probability: 'high', isRootCause: false },
      { id: 'fb5', category: 'measurement', causeText: 'Oil lab sampling frequency was set to annual instead of monthly quarterly', probability: 'medium', isRootCause: false },
      { id: 'fb6', category: 'manpower', causeText: 'Lube technician selected incorrect drum due to faded handwritten label', probability: 'high', isRootCause: false },
      { id: 'fb7', category: 'environment', causeText: 'Plant lube storage room lacked color-coded standardized hardware tags', probability: 'high', isRootCause: true },
    ],
    timelineEvents: [
      { id: 't1', relativeMinutes: -300, label: 'Lube Top-Off', description: 'Gearbox topped off with 40 liters of incorrect ISO VG 150 mineral lubricant.', telemetryNote: 'Sump level restored to 100%', severity: 'nominal' },
      { id: 't2', relativeMinutes: -120, label: 'Thermal Runaway', description: 'Oil sump temperature rises from normal 68°C to 88°C due to boundary friction.', telemetryNote: 'Viscosity drops to 34 cSt', severity: 'warning' },
      { id: 't3', relativeMinutes: -30, label: 'Spectral Sideband Growth', description: 'Vibration monitoring detects 24.2 kHz Gear Mesh Frequency sideband elevation (+14 dB).', telemetryNote: 'Acceleration envelope spikes 4x', severity: 'warning' },
      { id: 't4', relativeMinutes: 0, label: 'High Temp Alarm & Trip', description: 'Oil temperature trips high alarm setpoint at 94°C. Drive interlock halts machine.', telemetryNote: 'Oil temp TT-401 = 94.2°C', severity: 'critical' },
    ],
    capaItems: [
      { id: 'c1', actionTitle: 'Flush gearbox sump twice and refill with premium ISO VG 320 synthetic PAO gear oil', type: 'corrective', assignee: 'Lube Specialist', targetDays: 1, verificationCriteria: 'Oil lab test verifies 315-325 cSt @ 40°C & zero cross-contamination', status: 'verified' },
      { id: 'c2', actionTitle: 'Perform borescope NDE inspection on pinion teeth to confirm micro-pitting depth < 0.1 mm', type: 'corrective', assignee: 'Reliability Inspector', targetDays: 2, verificationCriteria: 'Formal NDE report confirming tooth root structural integrity', status: 'in-progress' },
      { id: 'c3', actionTitle: 'Install color-coded desiccant breathers, dedicated quick-connects, and weatherproof drum labels across oil room', type: 'preventive', assignee: 'Plant Maintenance Manager', targetDays: 21, verificationCriteria: '100% color-code compliance verified by plant safety walkthrough', status: 'open' },
    ],
  },
};

/**
 * Generate a dynamic RCA investigation draft from the current active simulator state
 */
export function generateRcaFromActiveSimulator(
  simId: SimulatorId,
  inputs: Record<string, any>,
  outputs: Record<string, any>,
  statusMessage?: string
): RcaInvestigation {
  const dateStr = new Date().toISOString().split('T')[0];
  const assetTag = `${simId.toUpperCase()}-01`;

  // Provide realistic dynamic starting points based on machine type
  switch (simId) {
    case 'pump': {
      const npsha = outputs?.npsha ?? 3.5;
      const npshr = outputs?.npshr ?? 3.2;
      const margin = outputs?.marginRatio ?? (npsha / npshr).toFixed(2);
      return {
        id: `rca-live-${Date.now()}`,
        title: `Centrifugal Pump Cavitation & NPSH Operational Discrepancy Investigation`,
        assetTag,
        simulatorId: 'pump',
        incidentDate: dateStr,
        incidentSummary: `Live simulation indicates operating NPSHa of ${Number(npsha).toFixed(2)} m against vendor NPSHr of ${Number(npshr).toFixed(2)} m (Margin: ${margin}x). ${statusMessage || 'Cavitation risk condition active.'}`,
        severity: Number(margin) < 1.0 ? 'Level 1 Catastrophic' : 'Level 2 Serious Trip',
        primarySymptom: `Suction cavitation margin violation (Margin = ${margin}x vs 1.10x-1.30x ANSI/HI 9.6.1 guideline)`,
        whyNodes: [
          { id: 'w1', order: 1, question: 'Why did the pump enter cavitation?', answer: `Operating NPSHa (${Number(npsha).toFixed(2)} m) fell below required head margin.`, isRootCause: false, verificationEvidence: 'Calculated NPSH Margin ratio < 1.10x.' },
          { id: 'w2', order: 2, question: 'Why is NPSHa insufficient?', answer: `Suction piping friction head loss is elevated at current flow of ${inputs?.flowRate ?? 120} m³/h.`, isRootCause: false, verificationEvidence: 'Darcy-Weisbach friction calculation confirms line loss.' },
          { id: 'w3', order: 3, question: 'Why is suction line friction excessive?', answer: 'Suction line equivalent length or restriction orifice is creating excessive resistance.', isRootCause: true, verificationEvidence: 'Suction valve throttled or pipe diameter undersized.' },
        ],
        fishboneItems: [
          { id: 'fb1', category: 'machine', causeText: `NPSH Margin ${margin}x is below standard safe limit`, probability: 'high', isRootCause: true },
          { id: 'fb2', category: 'method', causeText: 'Operating flow throttled away from Best Efficiency Point (BEP)', probability: 'medium', isRootCause: false },
          { id: 'fb3', category: 'material', causeText: 'Fluid vapor pressure high due to process temperature', probability: 'medium', isRootCause: false },
        ],
        timelineEvents: [
          { id: 't1', relativeMinutes: -30, label: 'Stable BEP Run', description: 'Pump at nominal design operating point.', telemetryNote: 'NPSH Margin nominal', severity: 'nominal' },
          { id: 't2', relativeMinutes: 0, label: 'Telemetry Excursion', description: statusMessage || 'NPSHa fell below required threshold.', telemetryNote: `Margin = ${margin}x`, severity: 'critical' },
        ],
        capaItems: [
          { id: 'c1', actionTitle: 'Increase suction vessel liquid head elevation or reduce suction line friction', type: 'corrective', assignee: 'Process Operations', targetDays: 1, verificationCriteria: 'NPSHa restored > 1.20x NPSHr', status: 'open' },
        ],
      };
    }

    case 'compressor': {
      return {
        ...RCA_PRESET_INVESTIGATIONS['compressor-surge'],
        id: `rca-live-${Date.now()}`,
        incidentDate: dateStr,
      };
    }

    case 'gearbox': {
      return {
        ...RCA_PRESET_INVESTIGATIONS['gearbox-micropitting'],
        id: `rca-live-${Date.now()}`,
        incidentDate: dateStr,
      };
    }

    default: {
      return {
        ...RCA_PRESET_INVESTIGATIONS['pump-cavitation'],
        id: `rca-live-${Date.now()}`,
        title: `${simId.toUpperCase()} Reliability Diagnostic & Root Cause Investigation`,
        assetTag,
        simulatorId: simId,
        incidentDate: dateStr,
      };
    }
  }
}
