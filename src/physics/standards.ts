/**
 * Engineering Standards, Clauses, Permissible Criteria, and Explanatory References
 * 
 * Provides centralized citations, clause summaries, and reference limits for:
 * - API 610 (Centrifugal Pumps for Petroleum, Petrochemical and Natural Gas Industries)
 * - API 682 (Pumps - Shaft Sealing Systems for Centrifugal and Rotary Pumps)
 * - ISO 281 (Rolling Bearings - Dynamic Load Ratings and Rating Life)
 * - ISO 1940-1 (Balance Quality Requirements for Rotors)
 * - ISO 10816-3 / ISO 20816-3 (Evaluation of Machine Vibration)
 * - ASME B31.3 (Process Piping Code)
 * - Hydraulic Institute HI 9.6.1 (NPSH Margin Guidelines)
 */

export interface StandardReference {
  code: string;
  title: string;
  edition: string;
  governingBody: string;
  keyClauses: {
    clauseNumber: string;
    topic: string;
    requirementSummary: string;
    permissibleLimits: string;
  }[];
  engineeringNotes: string[];
}

export const ENGINEERING_STANDARDS: Record<string, StandardReference> = {
  api610: {
    code: 'API 610',
    title: 'Centrifugal Pumps for Petroleum, Petrochemical and Natural Gas Industries',
    edition: '12th Edition (2021) / 11th Edition (2010)',
    governingBody: 'American Petroleum Institute (API)',
    keyClauses: [
      {
        clauseNumber: '6.1.15',
        topic: 'NPSH Margin & Operating Range',
        requirementSummary:
          'NPSHa must exceed NPSH3 (NPSHr) by a specified margin across the entire Preferred Operating Region (POR, typically 70% to 120% BEP).',
        permissibleLimits: 'NPSHa >= NPSHr + 1.0 m (3.3 ft) or Margin Ratio >= 1.1 - 1.25 depending on service.',
      },
      {
        clauseNumber: '6.10.1.1',
        topic: 'Bearing Rating Life (L10h)',
        requirementSummary:
          'Bearings shall be selected to give a minimum basic rating life (L10h) calculated in accordance with ISO 281 at continuous rated conditions.',
        permissibleLimits: 'Minimum L10h >= 25,000 operating hours continuous (and >= 16,000 hrs at maximum design loads).',
      },
      {
        clauseNumber: '6.8.2 / Table 5',
        topic: 'External Nozzle Loads',
        requirementSummary:
          'Pumps shall be capable of withstanding external forces and moments transmitted by connected suction and discharge piping.',
        permissibleLimits: 'Combined nozzle loads F_res and M_res shall not exceed API 610 Table 5 criteria without engineered baseplate reinforcement.',
      },
      {
        clauseNumber: '6.9.3.1',
        topic: 'Rotor Lateral Critical Speed Margin',
        requirementSummary:
          'Operating speeds shall be separated from lateral bending critical speeds by a defined avoidance margin.',
        permissibleLimits: 'Operating speed must be >= 20% below 1st critical (subcritical) or >= 15% above (supercritical).',
      },
    ],
    engineeringNotes: [
      'Preferred Operating Region (POR): 70% to 120% of Best Efficiency Point (BEP).',
      'Allowable Operating Region (AOR): Defined by vendor where vibration and temperature remain within acceptable limits.',
      'Suction Specific Speed (Nss) guideline: Nss > 11,000 - 12,000 (US units) indicates high cavitation surge susceptibility at part-load.',
    ],
  },

  api682: {
    code: 'API 682',
    title: 'Pumps - Shaft Sealing Systems for Centrifugal and Rotary Pumps',
    edition: '4th Edition (2014)',
    governingBody: 'American Petroleum Institute (API)',
    keyClauses: [
      {
        clauseNumber: '6.1.2.14',
        topic: 'Vapor Pressure Margin in Seal Chamber',
        requirementSummary:
          'To prevent phase change (flashing) between seal faces, seal chamber pressure must maintain adequate margin above the boiling/vapor pressure at operating chamber temperature.',
        permissibleLimits: 'P_chamber >= P_vapor(T_chamber) + 200 kPa (2.0 bar / 30 psi) OR P_chamber >= 1.3 * P_vapor.',
      },
      {
        clauseNumber: 'Annex G',
        topic: 'Standard Piping Flush Plans',
        requirementSummary:
          'Standardized mechanical seal flush arrangements (Plans 11, 13, 21, 23, 31, 32, 52, 53A/B/C, 54) to ensure face lubrication, particulate flushing, and heat removal.',
        permissibleLimits: 'Flush flow must maintain seal chamber temperature rise (DeltaT) <= 8°C - 10°C (15°F).',
      },
    ],
    engineeringNotes: [
      'Plan 23 is the standard choice for hot boiler feed and water services > 80°C because it cools only the recirculated seal chamber fluid, saving massive thermal energy.',
      'Plan 11 is simplest for clean non-flashing liquids but direct injection of hot discharge fluid adds thermal load to the seal.',
    ],
  },

  iso281: {
    code: 'ISO 281',
    title: 'Rolling Bearings - Dynamic Load Ratings and Rating Life',
    edition: 'ISO 281:2007',
    governingBody: 'International Organization for Standardization (ISO)',
    keyClauses: [
      {
        clauseNumber: 'Clause 4',
        topic: 'Basic Rating Life L10',
        requirementSummary:
          'Life achieved by 90% of a sufficiently large group of identical bearings operating under identical conditions.',
        permissibleLimits: 'L10 = (C / P)^p million revolutions (p=3 for ball, p=10/3 for roller).',
      },
      {
        clauseNumber: 'Clause 8',
        topic: 'Modified Rating Life Lnm (aISO factor)',
        requirementSummary:
          'Accounts for lubricant film thickness (viscosity ratio kappa), contamination index (e_C), and fatigue load limit (Pu).',
        permissibleLimits: 'Lnm = a1 * aISO * L10, where kappa = nu / nu1 (ideal kappa between 1.0 and 3.0).',
      },
    ],
    engineeringNotes: [
      'Viscosity ratio kappa < 0.4 indicates severe boundary lubrication where metal-to-metal asperity contact dominates.',
      'Viscosity ratio kappa > 4.0 causes hydrodynamic churning friction and excessive heat buildup without extending fatigue life.',
    ],
  },

  iso1940: {
    code: 'ISO 1940-1',
    title: 'Mechanical Vibration - Balance Quality Requirements for Rotors in a Constant (Rigid) State',
    edition: 'ISO 1940-1:2003 (Cor. 2005)',
    governingBody: 'International Organization for Standardization (ISO)',
    keyClauses: [
      {
        clauseNumber: 'Clause 5',
        topic: 'Permissible Residual Unbalance (e_per)',
        requirementSummary:
          'Specific permissible unbalance is calculated from the balance quality grade G (mm/s) and operational angular speed omega.',
        permissibleLimits: 'e_per = (G * 1000) / omega (g·mm/kg or µm). Permissible Unbalance U_per = e_per * M_rotor.',
      },
    ],
    engineeringNotes: [
      'Grade G2.5: Standard for API 610 pumps, electric motor rotors, and high-speed process turbines.',
      'Grade G1.0: High-speed precision turbo-compressors and grinding spindles.',
      'Grade G6.3: General industrial machinery, standard ventilation fans, and agricultural equipment.',
    ],
  },

  iso10816: {
    code: 'ISO 10816-3 / ISO 20816-3',
    title: 'Mechanical Vibration - Evaluation of Machine Vibration on Non-Rotating Parts',
    edition: 'ISO 20816-3:2022',
    governingBody: 'International Organization for Standardization (ISO)',
    keyClauses: [
      {
        clauseNumber: 'Section 4',
        topic: 'Vibration Severity Zones',
        requirementSummary:
          'Broadband RMS vibration velocity (10 Hz to 1000 Hz) categorized into Zones A, B, C, and D based on machine rating and foundation stiffness.',
        permissibleLimits:
          'Group 2 Rigid: A <= 1.4 mm/s | B <= 2.8 mm/s | C <= 4.5 mm/s | D > 4.5 mm/s (Alarm at 4.5 mm/s, Trip at 7.1 mm/s).',
      },
    ],
    engineeringNotes: [
      'Zone A: Newly commissioned machines.',
      'Zone B: Unrestricted long-term continuous operation.',
      'Zone C: Limited period operation; remedial action required at next maintenance opportunity.',
      'Zone D: Severe vibration; immediate shutdown / trip required to prevent destructive failure.',
    ],
  },

  asmeB313: {
    code: 'ASME B31.3',
    title: 'Process Piping Code - Section of ASME Boiler and Pressure Vessel Code',
    edition: '2022 Edition',
    governingBody: 'American Society of Mechanical Engineers (ASME)',
    keyClauses: [
      {
        clauseNumber: '304.1.2',
        topic: 'Internal Pressure Design of Straight Pipe',
        requirementSummary:
          'Calculates minimum wall thickness or hoop stress under internal design pressure and temperature.',
        permissibleLimits: 't = (P * D) / (2 * (S * E + P * Y)) + c. Hoop stress <= S * E quality factor.',
      },
      {
        clauseNumber: '319.4.4',
        topic: 'Allowable Displacement Stress Range (S_A)',
        requirementSummary:
          'Governs cyclic thermal expansion stress range to prevent low-cycle fatigue failure.',
        permissibleLimits: 'S_A = f * [1.25 * (S_c + S_h) - S_L], where S_c = cold allowable, S_h = hot allowable.',
      },
    ],
    engineeringNotes: [
      'Thermal expansion deltaL = alpha * L * deltaT can generate hundreds of kilonewtons of restraint force if piping lacks expansion loops.',
      'Rigid nozzle attachments directly transfer unrestrained pipe loads onto pump casings, causing casing distortion, internal rubbing, and bearing misalignment.',
    ],
  },

  hydraulicInstitute: {
    code: 'HI 9.6.1',
    title: 'Rotodynamic Pumps - Guideline for NPSH Margin',
    edition: 'ANSI/HI 9.6.1-2017',
    governingBody: 'Hydraulic Institute (HI)',
    keyClauses: [
      {
        clauseNumber: 'Section 9.6.1.3',
        topic: 'Recommended NPSH Margin Ratio',
        requirementSummary:
          'Standard 3% head drop (NPSH3/NPSHr) does NOT mean zero cavitation; bubble inception occurs at NPSH values 2x to 5x higher than NPSH3. Margin ratio provides 40,000+ hr impeller life.',
        permissibleLimits:
          'Water/Boiler feed: NPSH margin ratio 1.2 to 2.0 (or NPSHa - NPSHr >= 1.5 m). Hydrocarbons: Margin ratio >= 1.1 to 1.3.',
      },
    ],
    engineeringNotes: [
      'Cavitation damage is greatest at flows near 50% to 80% BEP where flow separation combines with high-energy vortex shedding.',
    ],
  },

  api617: {
    code: 'API 617',
    title: 'Axial and Centrifugal Compressors and Expander-compressors for Petroleum, Chemical and Gas Industry Services',
    edition: '8th Edition / 9th Edition',
    governingBody: 'American Petroleum Institute (API)',
    keyClauses: [
      {
        clauseNumber: 'Clause 4.1.3',
        topic: 'Aerodynamic Stability & Surge Margin',
        requirementSummary:
          'Compressor shall exhibit continuous head rise to surge (minimum 5% to 10% rise from rated point) and stable aerodynamic performance over the entire operating envelope.',
        permissibleLimits: 'Continuous positive slope (dH/dQ < 0). Rated point surge margin >= 10% - 15% above the Surge Limit Line (SLL).',
      },
      {
        clauseNumber: 'Clause 4.8.4',
        topic: 'Thrust Bearing Transient Load Capacity',
        requirementSummary:
          'Tilting-pad thrust bearings shall be designed to absorb transient thrust load reversals during emergency trip and aerodynamic surge events without babbit wiping.',
        permissibleLimits: 'Bearing unit loading shall not exceed 3.5 MPa (500 psi) at maximum continuous load.',
      },
    ],
    engineeringNotes: [
      'Surge represents complete aerodynamic breakdown with flow reversal, cyclic pressure oscillations (1-2 Hz), and severe axial thrust reversals.',
      'The Surge Control Line (SCL) incorporates an automatic safety buffer (typically 10-15%) right of the Surge Limit Line (SLL) to activate recycle flow.',
    ],
  },

  api670: {
    code: 'API 670',
    title: 'Machinery Protection Systems',
    edition: '5th Edition',
    governingBody: 'American Petroleum Institute (API)',
    keyClauses: [
      {
        clauseNumber: 'Annex K',
        topic: 'Anti-Surge Control Systems',
        requirementSummary:
          'Anti-Surge Control systems require dedicated fast-response differential pressure transmitters, quick-opening ASV valves, and redundant surge detection algorithms.',
        permissibleLimits: 'Anti-Surge Valve (ASV) full open stroke time <= 1.5 to 2.0 seconds with quick-opening characteristic.',
      },
    ],
    engineeringNotes: [
      'Fail-safe configuration: ASV must stroke open on loss of instrument air or loss of electrical signal.',
    ],
  },

  api618: {
    code: 'API 618 / ISO 13631',
    title: 'Reciprocating Compressors for Petroleum, Chemical, and Gas Industry Services',
    edition: '5th Edition (2007, Reaffirmed 2016)',
    governingBody: 'American Petroleum Institute (API)',
    keyClauses: [
      {
        clauseNumber: '6.1.3',
        topic: 'Rod Load Reversal',
        requirementSummary:
          'A minimum continuous rod load reversal of at least 15 degrees of crank rotation and at least 3% of the actual peak load is mandatory to ensure crosshead wrist pin bushing hydrodynamic lubrication.',
        permissibleLimits: 'Continuous reversal duration >= 15° crank angle AND minimum reverse load magnitude >= 3.0% of peak load span.',
      },
      {
        clauseNumber: '6.1.2',
        topic: 'Combined Rod Load Rating',
        requirementSummary:
          'Combined gas force and reciprocating inertia load shall not exceed manufacturer maximum rated allowable tensile and compressive rod limits across all operating conditions.',
        permissibleLimits: 'Combined Rod Load <= 100% of API 618 continuous rod rating.',
      },
      {
        clauseNumber: '7.9.4.2 / API 688',
        topic: 'Acoustic Pulsation & Surge Bottles',
        requirementSummary:
          'Acoustic filters / surge volume bottles must suppress gas slug pulsation below API 618 Design Approach 3 allowable peak-to-peak pulsation limits.',
        permissibleLimits: 'P_1 (%) <= 300 / sqrt(P_line_bar * D_pipe_id_mm * f_harmonic).',
      },
    ],
    engineeringNotes: [
      'Loss of rod load reversal causes boundary oil film collapse at the crosshead wrist pin bushing, resulting in catastrophic seizure.',
      'Acoustic resonance occurs when cylinder pulsation frequency matches the Helmholtz bottle natural frequency or the quarter-wave piping acoustic length.',
    ],
  },

  agma2001: {
    code: 'AGMA 2001 / ISO 6336',
    title: 'Fundamental Rating Factors and Calculation Methods for Involute Spur and Helical Gear Teeth',
    edition: 'AGMA 2001-D04 / ISO 6336:2019',
    governingBody: 'American Gear Manufacturers Association (AGMA) / ISO',
    keyClauses: [
      {
        clauseNumber: 'Section 8',
        topic: 'Bending Fatigue Strength (Tooth Root Stress)',
        requirementSummary:
          'Calculates tooth root bending stress using Lewis form factor, geometry factor Y_J, dynamic factor K_v, and load distribution factor K_H.',
        permissibleLimits: 'sigma_b = (W_t * K_o * K_v * K_s * K_H) / (b * m_n * Y_J) <= sigma_b,allow / S_F (minimum S_F >= 1.30).',
      },
      {
        clauseNumber: 'Section 9',
        topic: 'Contact Fatigue Strength (Pitting / Flank Durability)',
        requirementSummary:
          'Calculates Hertzian contact stress using elasticity coefficient Z_E, surface condition factors, and geometry factor Z_I.',
        permissibleLimits: 'sigma_c = Z_E * sqrt((W_t * K_o * K_v * K_s * K_H) / (d_p * b * Z_I)) <= sigma_c,allow / S_H (minimum S_H >= 1.20).',
      },
      {
        clauseNumber: 'AGMA 9005-F16',
        topic: 'EHL Specific Film Thickness Ratio (Lambda)',
        requirementSummary:
          'Minimum elastohydrodynamic lubricant film thickness h_min compared against composite surface roughness.',
        permissibleLimits: 'Lambda = h_min / sqrt(Ra1^2 + Ra2^2). Full EHL: Lambda >= 2.0; Mixed: 1.0 <= Lambda < 2.0; Boundary: Lambda < 1.0.',
      },
    ],
    engineeringNotes: [
      'Gear Mesh Frequency (GMF = z * f_rot) harmonics indicate tooth stiffness variation and geometric mesh errors.',
      'Sidebands spaced at 1X rotational speed indicate eccentricity, pitch-line runout, or localized tooth fault modulation.',
    ],
  },

  api612: {
    code: 'API 612 / ASME PTC 6',
    title: 'Petroleum, Petrochemical, and Natural Gas Industries - Steam Turbines - Special-purpose Applications',
    edition: 'API 612 8th Edition (2020) / ASME PTC 6-2004',
    governingBody: 'American Petroleum Institute (API) / ASME',
    keyClauses: [
      {
        clauseNumber: '2.4.1',
        topic: 'Overspeed Protection & Trip Bolts',
        requirementSummary:
          'Turbines shall be equipped with independent electronic or mechanical overspeed trip mechanisms calibrated to trip before rotor stress reaches yield limits.',
        permissibleLimits: 'Emergency trip setpoint = 110% of maximum continuous rated speed (MCOS).',
      },
      {
        clauseNumber: '2.6.2',
        topic: 'Lateral Critical Speed Separation Margin',
        requirementSummary:
          'All operational speed ranges shall maintain adequate separation from lateral bending critical speeds.',
        permissibleLimits: 'Separation margin SM >= 15% from any lateral critical speed N_crit.',
      },
      {
        clauseNumber: '2.1.5',
        topic: 'Exhaust Moisture Limit & Liquid Droplet Erosion',
        requirementSummary:
          'Wetness fraction at the turbine exhaust blading must be constrained to prevent supersonic droplet impingement erosion (LDIE).',
        permissibleLimits: 'Exhaust moisture y <= 10.0% (or <= 12.0% - 14.0% with Stellite erosion shields).',
      },
    ],
    engineeringNotes: [
      'Wilson line crossing (x <= 0.96) marks spontaneous condensation onset in low-pressure stages.',
      'Baumann rule: 1% average stage moisture content reduces stage isentropic blading efficiency by approximately 0.8% - 1.0%.',
    ],
  },

  api684: {
    code: 'API 684 / DIN 31652',
    title: 'API Standard Paragraphs Rotordynamics Tutorial: Lateral Critical Speeds, Unbalance Response, Stability Train',
    edition: '2nd Edition / DIN 31652 (Hydrodynamic Plain Journal Bearings)',
    governingBody: 'American Petroleum Institute (API) / DIN',
    keyClauses: [
      {
        clauseNumber: 'Section 2.3',
        topic: 'Subsynchronous Oil Whirl & Oil Whip Stability',
        requirementSummary:
          'Hydrodynamic journal bearings must maintain positive logarithmic decrement (stability) across the complete operational envelope.',
        permissibleLimits: 'Logarithmic decrement delta >= 0.10. Whirl Frequency Ratio (WFR) < 0.48.',
      },
      {
        clauseNumber: 'DIN 31652 Part 1',
        topic: 'Sommerfeld Number & Minimum Oil Film Thickness',
        requirementSummary:
          'Steady-state hydrodynamic fluid wedge must maintain adequate minimum film thickness h_min to prevent babbitt metal-to-metal rubbing.',
        permissibleLimits: 'Sommerfeld number S = (mu * n / P) * (R/c)^2. Minimum film thickness h_min = c * (1 - epsilon) >= 8.0 - 10.0 µm.',
      },
    ],
    engineeringNotes: [
      'Tilting pad journal bearings eliminate destabilizing cross-coupled stiffness (Kxy ≈ 0, Kyx ≈ 0), rendering the rotor inherently immune to oil whirl.',
      'Oil whip is a resonant condition that occurs when the forward subsynchronous whirl frequency locks onto the rotor first lateral critical speed.',
    ],
  },

  api686: {
    code: 'API 686 / ANSI S2.75',
    title: 'Recommended Practice for Machinery Installation and Installation Design - Chapter 7: Shaft Alignment',
    edition: 'API 686 2nd Edition (2009) / ANSI S2.75',
    governingBody: 'American Petroleum Institute (API) / Acoustical Society of America',
    keyClauses: [
      {
        clauseNumber: '7.2.3.4',
        topic: 'Soft Foot Tolerances',
        requirementSummary:
          'Prior to final alignment, soft foot on any individual equipment support foot shall be measured and corrected.',
        permissibleLimits: 'Maximum allowable soft foot <= 0.05 mm (0.002 in / 2.0 mils).',
      },
      {
        clauseNumber: 'Table 7.1',
        topic: 'Hot Running Operational Shaft Alignment Limits',
        requirementSummary:
          'Centerline collinearity under stabilized operating temperatures must satisfy strict parallel and angular tolerances.',
        permissibleLimits:
          'Operating speed <= 1800 RPM: Offset <= 0.075 mm, Angularity <= 0.70 mrad. 1800-3600 RPM: Offset <= 0.05 mm, Angularity <= 0.50 mrad. > 3600 RPM: Offset <= 0.025 mm, Angularity <= 0.30 mrad.',
      },
      {
        clauseNumber: '7.3.2',
        topic: 'Thermal Growth Compensation (Cold Target Offsets)',
        requirementSummary:
          'Cold alignment targets must intentionally offset the driving and driven shafts to compensate for relative vertical and horizontal thermal casing expansion.',
        permissibleLimits: 'DeltaY_thermal = H_P * alpha_P * DeltaT_P - H_M * alpha_M * DeltaT_M.',
      },
    ],
    engineeringNotes: [
      'Shaft misalignment excites predominantly 2X running speed radial vibration and high 1X/2X axial vibration across the coupling.',
      'Stainless steel precision pre-cut shims shall be limited to a maximum of 3 shims under any individual equipment foot (API 686 §7.4.3).',
    ],
  },
};

