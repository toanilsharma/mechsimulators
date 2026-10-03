export interface DocSection {
  title: string;
  badge?: string;
  items: {
    heading: string;
    content: string;
    equation?: string;
    subtext?: string;
  }[];
}

export const ALIGNMENT_DOC_DATA: DocSection[] = [
  {
    title: 'Governing Standards & Alignment Tolerances',
    badge: 'API 686 / ISO 20816',
    items: [
      {
        heading: 'API 686 Chapter 7 Permissible Alignment Limits',
        content:
          'API 686 (Recommended Practice for Machinery Installation and Installation Design) mandates maximum allowable shaft centerline offset and angularity during hot continuous operation.',
        equation: 'Offset_allow = 0.05 mm (2.0 mils),  Angle_allow = 0.05 mm / 100 mm = 0.50 mrad (at 3000 RPM)',
        subtext: 'Tolerances are speed-dependent: ≤1800 RPM permits 0.075 mm, while >3600 RPM restricts to 0.025 mm.',
      },
      {
        heading: 'Cold Alignment Target Compensation',
        content:
          'Because the process pump and electric motor driver operate at different steady-state thermal equilibriums, intentional cold misalignment must be set so that thermal expansion brings the shafts into coaxial alignment.',
        equation: 'ΔY_target = - [ (H_P · α_P · ΔT_P) - (H_M · α_M · ΔT_M) ]',
        subtext: 'Centerline-mounted pumps reduce thermal lift compared to foot-supported overhung casings.',
      },
    ],
  },
  {
    title: 'Soft Foot & Foundation Metrology',
    badge: 'API 686 §7.2',
    items: [
      {
        heading: 'Soft Foot Permissible Deflection (0.05 mm Max)',
        content:
          'When any single machine hold-down bolt is loosened, indicator deflection must not exceed 0.05 mm (2.0 mils). Greater values indicate frame twist, distorted shims, or poor baseplate planarity.',
        equation: 'max(Δ_soft_foot) ≤ 0.05 mm',
        subtext: 'API 686 strictly forbids more than 3 shims under any individual foot pad.',
      },
      {
        heading: 'Shim Pack Correction Formula',
        content:
          'Correction shims needed under front and rear feet to adjust vertical offset and angular slope simultaneously.',
        equation: 'ΔS_F = - [ e_y + (θ_y · B) ],   ΔS_R = - [ e_y + (θ_y · (B + C)) ]',
        subtext: 'Where B is distance from coupling to front foot, and C is distance between front and rear feet.',
      },
    ],
  },
  {
    title: 'Coupling Dynamics & ISO Vibration Severity',
    badge: 'AGMA 9000 / ISO 10816',
    items: [
      {
        heading: 'Transmitted Reaction Bending Moment & Bearing Load',
        content:
          'Angular deflection across flexible disc packs generates continuous restoring moments that act directly onto drive-end (DE) bearings as alternating dynamic loads.',
        equation: 'M_reaction = k_θ · θ,   F_shear = 2 · M / DBSE + k_r · Δr',
        subtext: 'Excessive reaction loads reduce ISO 281 L10h bearing fatigue life exponentially.',
      },
      {
        heading: '2X RPM Vibration Harmonics & Phase Signature',
        content:
          'Shaft misalignment generates a characteristic 2X running speed radial vibration peak accompanied by a 180° phase inversion across the flexible coupling.',
        equation: 'V_2X ∝ (θ / θ_allow)^1.4 · (RPM / 3000)^0.75 [mm/s RMS]',
        subtext: 'Evaluated under ISO 10816-3 Group 2 rigid foundation criteria (Zone A ≤ 1.4, B ≤ 2.8, C ≤ 4.5, D > 4.5 mm/s).',
      },
    ],
  },
];
