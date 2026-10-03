import React from 'react';
import { SimulatorId } from '../../types/common';

export interface SchematicProps {
  className?: string;
  isHovered?: boolean;
  accentColor?: string;
}

// --------------------------------------------------------------------------
// 1. CENTRIFUGAL COMPRESSOR: Surge & Stall Map (API 617 / ASME PTC 10)
// Coordinates: Polytropic Head vs Flow Coefficient. Surge Line & Speed Curves.
// --------------------------------------------------------------------------
export const CompressorSchematic: React.FC<SchematicProps> = ({
  className = 'w-16 h-14',
  accentColor = '#06B6D4',
}) => (
  <svg
    viewBox="0 0 72 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} transition-all duration-300`}
  >
    {/* Coordinate Axes */}
    <path d="M10 8V48H66" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.4" />
    <path d="M7 12L10 8L13 12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.4" />
    <path d="M62 45L66 48L62 51" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.4" />

    {/* Unstable Surge Zone Hatching */}
    <path d="M12 18L18 24M12 28L22 38M12 38L18 44" stroke="currentColor" strokeWidth="0.75" strokeOpacity="0.18" />

    {/* Dynamic Speed Curves (N1, N2, N3) */}
    <path d="M20 16C32 16.5 48 20 62 30" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.5" />
    <path d="M17 26C28 26.5 44 30 58 39" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.5" />
    <path d="M14 36C24 36.5 38 39 52 46" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.5" />

    {/* Surge Limit Line (SLL) - Dashed with Domain Accent */}
    <path
      d="M14 42Q19 28 24 12"
      stroke={accentColor}
      strokeWidth="1.6"
      strokeDasharray="3 2"
      strokeLinecap="round"
      className="group-hover:[stroke-dashoffset:20] transition-all duration-700"
    />

    {/* Operating Point & Surge Margin Vector */}
    <circle cx="38" cy="27.5" r="2.5" fill={accentColor} className="group-hover:animate-ping opacity-75" />
    <circle cx="38" cy="27.5" r="2" fill={accentColor} />
    <path d="M38 27.5L25 24" stroke={accentColor} strokeWidth="1" strokeDasharray="1.5 1.5" strokeOpacity="0.7" />
  </svg>
);

// --------------------------------------------------------------------------
// 2. RECIPROCATING COMPRESSOR: P-V Loop (API 618)
// Closed 4-Phase Thermodynamic Indicator Diagram: Suction, Compression, Discharge, Expansion.
// --------------------------------------------------------------------------
export const RecipSchematic: React.FC<SchematicProps> = ({
  className = 'w-16 h-14',
  accentColor = '#06B6D4',
}) => (
  <svg
    viewBox="0 0 72 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} transition-all duration-300`}
  >
    {/* P & V Coordinate Ticks */}
    <path d="M10 10V48H64" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.4" />
    <line x1="8" y1="18" x2="12" y2="18" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
    <line x1="8" y1="42" x2="12" y2="42" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />

    {/* Suction (Ps) & Discharge (Pd) Pressure Limit Levels */}
    <line x1="12" y1="18" x2="62" y2="18" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" strokeOpacity="0.25" />
    <line x1="12" y1="42" x2="62" y2="42" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" strokeOpacity="0.25" />

    {/* Closed P-V Loop with Valve Flutter Ripple on Discharge */}
    <path
      d="M20 42C20 42 22 41.5 32 36C40 31 46 24 48 18C46 17.5 44 19 40 18C36 17 32 18.5 28 18C28 18 26 26 24 34C22 39 20 42 20 42Z"
      stroke={accentColor}
      strokeWidth="1.5"
      strokeLinejoin="round"
      className="group-hover:[stroke-dasharray:6_2] group-hover:[stroke-dashoffset:32] transition-all duration-700"
    />

    {/* Indicator Arrow indicating Clockwise Cycle */}
    <path d="M36 29L38 31L35 33" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// --------------------------------------------------------------------------
// 3. STEAM TURBINE: Mollier Chart Line (API 612 / ASME PTC 6)
// Enthalpy (h) vs Entropy (s) Expansion Line crossing Saturation into Wilson Line.
// --------------------------------------------------------------------------
export const TurbineSchematic: React.FC<SchematicProps> = ({
  className = 'w-16 h-14',
  accentColor = '#06B6D4',
}) => (
  <svg
    viewBox="0 0 72 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} transition-all duration-300`}
  >
    {/* Frame */}
    <path d="M10 8V48H64" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.4" />

    {/* Steam Saturation Vapor Line (x = 1.0) */}
    <path d="M12 24C28 27 46 34 62 44" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" strokeOpacity="0.35" />

    {/* Isobar Curves (Constant Pressure Lines) */}
    <path d="M14 12C30 16 48 24 60 36" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.25" />
    <path d="M18 20C34 25 50 33 62 45" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.25" />

    {/* Actual Expansion Path */}
    <path
      d="M24 14L28 32C31 38 36 44 42 46"
      stroke={accentColor}
      strokeWidth="1.6"
      strokeLinecap="round"
      className="group-hover:[stroke-dasharray:4_2] group-hover:[stroke-dashoffset:24] transition-all duration-700"
    />

    {/* Wilson Moisture Limit Dot */}
    <circle cx="24" cy="14" r="2" fill={accentColor} />
    <circle cx="42" cy="46" r="2.5" fill={accentColor} className="group-hover:animate-pulse" />
  </svg>
);

// --------------------------------------------------------------------------
// 4. CENTRIFUGAL PUMP: Impeller Volute & NPSH (API 610 / HI 9.6.1)
// Spiral Volute Casing, Backward-Curved Vanes & Suction Eye Cavitation Inception.
// --------------------------------------------------------------------------
export const PumpSchematic: React.FC<SchematicProps> = ({
  className = 'w-16 h-14',
  accentColor = '#06B6D4',
}) => (
  <svg
    viewBox="0 0 72 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} transition-all duration-300`}
  >
    {/* Spiral Volute Casing Contour */}
    <path
      d="M34 10C44 10 54 18 56 28C58 38 48 46 36 46C24 46 16 38 16 28C16 16 26 10 36 10L62 10"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeOpacity="0.6"
    />

    {/* Discharge Tangent */}
    <line x1="62" y1="10" x2="62" y2="18" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.4" />

    {/* Impeller Hub & Suction Eye */}
    <circle cx="36" cy="28" r="6" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
    <circle cx="36" cy="28" r="2.5" fill={accentColor} />

    {/* Backward Curved Vanes */}
    <path d="M36 22C40 22 45 24 46 27" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.8" />
    <path d="M42 28C42 33 40 37 37 39" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.8" />
    <path d="M36 34C32 34 27 32 26 29" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.8" />
    <path d="M30 28C30 23 32 19 35 17" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.8" />

    {/* Cavitation Inception Bubbles */}
    <circle cx="28" cy="24" r="1" fill={accentColor} className="group-hover:animate-ping" />
    <circle cx="26" cy="26" r="1.2" fill={accentColor} />
  </svg>
);

// --------------------------------------------------------------------------
// 5. INDUSTRIAL GEARBOX: Gear Mesh Lines & Contact Line (AGMA 2001 / ISO 6336)
// Pinion & Gear Pitch Circles with Line of Action (20° Pressure Angle) and Involute Profiles.
// --------------------------------------------------------------------------
export const GearboxSchematic: React.FC<SchematicProps> = ({
  className = 'w-16 h-14',
  accentColor = '#F59E0B',
}) => (
  <svg
    viewBox="0 0 72 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} transition-all duration-300`}
  >
    {/* Pitch Circles */}
    <circle cx="28" cy="20" r="14" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" strokeOpacity="0.4" />
    <circle cx="48" cy="38" r="16" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" strokeOpacity="0.4" />

    {/* Line of Action (20° Pressure Angle) */}
    <line
      x1="16"
      y1="10"
      x2="60"
      y2="48"
      stroke={accentColor}
      strokeWidth="1.5"
      strokeDasharray="4 2"
      className="group-hover:[stroke-dashoffset:24] transition-all duration-700"
    />

    {/* Conjugate Involute Teeth Touching at Pitch Point P */}
    <path d="M32 24C35 26 37 28 38 29" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.7" />
    <path d="M40 32C39 30 38 29 38 29" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.7" />

    {/* Mesh Pitch Point P */}
    <circle cx="38" cy="29" r="2.5" fill={accentColor} className="group-hover:animate-ping opacity-75" />
    <circle cx="38" cy="29" r="2" fill={accentColor} />
  </svg>
);

// --------------------------------------------------------------------------
// 6. ROLLING ELEMENT BEARING: Defect Enveloping (ISO 281 / ISO 10816)
// Bearing Raceways, Ball Complement, and High-Frequency Defect Envelope Waveform.
// --------------------------------------------------------------------------
export const BearingSchematic: React.FC<SchematicProps> = ({
  className = 'w-16 h-14',
  accentColor = '#F59E0B',
}) => (
  <svg
    viewBox="0 0 72 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} transition-all duration-300`}
  >
    {/* Concentric Bearing Ring Section */}
    <path d="M12 16C18 10 32 8 42 12C50 15 56 24 56 34" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.4" />
    <path d="M20 22C24 18 32 17 38 19C43 21 47 26 47 32" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.4" />

    {/* Rolling Elements (Balls) */}
    <circle cx="18" cy="18" r="3" stroke={accentColor} strokeWidth="1.2" strokeOpacity="0.7" />
    <circle cx="30" cy="14" r="3" stroke={accentColor} strokeWidth="1.2" strokeOpacity="0.7" />
    <circle cx="43" cy="16" r="3" stroke={accentColor} strokeWidth="1.2" strokeOpacity="0.7" />
    <circle cx="51" cy="27" r="3" stroke={accentColor} strokeWidth="1.2" strokeOpacity="0.7" />

    {/* Time Domain Vibration Spike with Envelope */}
    <path
      d="M10 46H22L24 40L26 50L28 34L30 52L32 38L34 48L36 44H62"
      stroke={accentColor}
      strokeWidth="1.4"
      strokeLinejoin="round"
      className="group-hover:[stroke-dasharray:4_2] group-hover:[stroke-dashoffset:20] transition-all duration-700"
    />
    <path d="M22 41C26 36 32 38 36 44" stroke={accentColor} strokeWidth="0.8" strokeDasharray="1.5 1.5" strokeOpacity="0.6" />
  </svg>
);

// --------------------------------------------------------------------------
// 7. HYDRODYNAMIC JOURNAL BEARING: Orbit Whirl & Wedge (API 684 / DIN 31652)
// Clearance Circle, Eccentric Journal Shaft & Hydrodynamic 2D Reynolds Pressure Wedge.
// --------------------------------------------------------------------------
export const JournalSchematic: React.FC<SchematicProps> = ({
  className = 'w-16 h-14',
  accentColor = '#F59E0B',
}) => (
  <svg
    viewBox="0 0 72 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} transition-all duration-300`}
  >
    {/* Outer Bearing Bushing Sleeve */}
    <circle cx="36" cy="28" r="22" stroke="currentColor" strokeWidth="1.3" strokeOpacity="0.4" />

    {/* Eccentric Journal Shaft */}
    <circle cx="39" cy="31" r="16" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.7" />
    <circle cx="36" cy="28" r="1.5" fill="currentColor" strokeOpacity="0.4" />
    <circle cx="39" cy="31" r="1.5" fill={accentColor} />

    {/* Hydrodynamic Fluid Pressure Wedge Crescent */}
    <path
      d="M20 38C26 44 38 48 48 42C43 45 33 46 26 42Z"
      fill={accentColor}
      fillOpacity="0.4"
      className="group-hover:fill-opacity-70 transition-all duration-500"
    />

    {/* Minimum Film Thickness Gap Indicator */}
    <line x1="48" y1="41" x2="52" y2="44" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="50" cy="42.5" r="1" fill={accentColor} className="group-hover:animate-ping" />
  </svg>
);

// --------------------------------------------------------------------------
// 8. ROTOR DYNAMICS: 2-Plane Resonant Balancing & 1X Orbit (ISO 1940 / API 684)
// Shaft Center Crosshair, Forward 1X Elliptical Orbit, and Balance Mass Vector.
// --------------------------------------------------------------------------
export const RotorSchematic: React.FC<SchematicProps> = ({
  className = 'w-16 h-14',
  accentColor = '#10B981',
}) => (
  <svg
    viewBox="0 0 72 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} transition-all duration-300`}
  >
    {/* Center Coordinate Crosshairs */}
    <line x1="16" y1="28" x2="56" y2="28" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" strokeOpacity="0.3" />
    <line x1="36" y1="8" x2="36" y2="48" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" strokeOpacity="0.3" />

    {/* 1X Synchronous Elliptical Whirl Orbit */}
    <ellipse
      cx="36"
      cy="28"
      rx="20"
      ry="12"
      transform="rotate(-25 36 28)"
      stroke={accentColor}
      strokeWidth="1.5"
      strokeDasharray="4 2"
      className="group-hover:[stroke-dashoffset:24] transition-all duration-700"
    />

    {/* Unbalance Heavy Spot Vector */}
    <line x1="36" y1="28" x2="48" y2="18" stroke={accentColor} strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="48" cy="18" r="2" fill={accentColor} />

    {/* 180° Correction Trial Balance Weight Mass */}
    <line x1="36" y1="28" x2="24" y2="38" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 1.5" strokeOpacity="0.6" />
    <circle cx="24" cy="38" r="2.5" stroke={accentColor} strokeWidth="1.2" fill="#0B1220" />
  </svg>
);

// --------------------------------------------------------------------------
// 9. PROCESS PIPING: Thermal Flexure & Expansion Loop (ASME B31.3 §319)
// Symmetrical U-Expansion Loop, Anchor Reactions and Moment Inflection Flexure.
// --------------------------------------------------------------------------
export const PipeSchematic: React.FC<SchematicProps> = ({
  className = 'w-16 h-14',
  accentColor = '#8B5CF6',
}) => (
  <svg
    viewBox="0 0 72 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} transition-all duration-300`}
  >
    {/* Cold Original Centerline (Dashed) */}
    <path d="M10 38H24V18H48V38H62" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" strokeOpacity="0.25" />

    {/* Hot Thermal Expanded Flexure Loop */}
    <path
      d="M14 38H26C26 38 27 16 36 14C45 16 46 38 46 38H58"
      stroke={accentColor}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="group-hover:[stroke-dasharray:4_2] group-hover:[stroke-dashoffset:24] transition-all duration-700"
    />

    {/* Fixed End Anchors */}
    <path d="M8 35L14 38L8 41Z" fill="currentColor" fillOpacity="0.4" />
    <path d="M64 35L58 38L64 41Z" fill="currentColor" fillOpacity="0.4" />
    <line x1="8" y1="32" x2="8" y2="44" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
    <line x1="64" y1="32" x2="64" y2="44" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />

    {/* Peak Thermal Bending Moment Dot */}
    <circle cx="36" cy="14" r="2.5" fill={accentColor} className="group-hover:animate-ping opacity-80" />
    <circle cx="36" cy="14" r="2" fill={accentColor} />
  </svg>
);

// --------------------------------------------------------------------------
// 10. MECHANICAL SEAL: API 682 Flush Plan Loop (API 682 4th Ed)
// Seal Face Interface with Forced Barrier Flush Circulation Loop & Heat Dissipation.
// --------------------------------------------------------------------------
export const SealSchematic: React.FC<SchematicProps> = ({
  className = 'w-16 h-14',
  accentColor = '#8B5CF6',
}) => (
  <svg
    viewBox="0 0 72 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} transition-all duration-300`}
  >
    {/* Rotating Shaft */}
    <line x1="10" y1="28" x2="62" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.3" />

    {/* Stationary Seat & Rotating Seal Ring Blocks */}
    <rect x="32" y="16" width="4" height="10" fill="currentColor" fillOpacity="0.5" />
    <rect x="38" y="16" width="4" height="10" fill={accentColor} fillOpacity="0.8" />
    <rect x="32" y="30" width="4" height="10" fill="currentColor" fillOpacity="0.5" />
    <rect x="38" y="30" width="4" height="10" fill={accentColor} fillOpacity="0.8" />

    {/* Flush Recirculation Fluid Circuit Loop */}
    <path
      d="M20 18H28C32 18 36 12 44 12H52C56 12 56 22 52 22H44"
      stroke={accentColor}
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="3 2"
      className="group-hover:[stroke-dashoffset:20] transition-all duration-700"
    />

    {/* Fluid Flow Direction Indicator */}
    <path d="M26 16L30 18L26 20" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// --------------------------------------------------------------------------
// 11. SHAFT ALIGNMENT: Precision Alignment (API 686 / Reverse Dial)
// Colinear Shafts, Reverse Indicator Dials, Angular and Parallel Misalignment.
// --------------------------------------------------------------------------
export const AlignmentSchematic: React.FC<SchematicProps> = ({
  className = 'w-16 h-14',
  accentColor = '#10B981',
}) => (
  <svg
    viewBox="0 0 72 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} transition-all duration-300`}
  >
    {/* Driver Shaft (Left) */}
    <rect x="10" y="24" width="22" height="8" rx="1" fill="currentColor" fillOpacity="0.4" />
    {/* Driven Shaft (Right, with slight offset) */}
    <rect x="40" y="22" width="22" height="8" rx="1" fill="currentColor" fillOpacity="0.4" />

    {/* Coupling Hubs & Gap */}
    <rect x="31" y="21" width="3" height="14" fill={accentColor} fillOpacity="0.7" />
    <rect x="38" y="19" width="3" height="14" fill={accentColor} fillOpacity="0.7" />

    {/* Reverse Dial Indicator Bracket Arm */}
    <path
      d="M24 24V14H46V22"
      stroke={accentColor}
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Dial Indicator Gauge Head */}
    <circle cx="46" cy="14" r="3.5" stroke={accentColor} strokeWidth="1" fill="#0B1220" />
    <line x1="46" y1="14" x2="48" y2="12.5" stroke={accentColor} strokeWidth="1" strokeLinecap="round" />
  </svg>
);

// --------------------------------------------------------------------------
// SVG SCHEMATICS KEYED MAP
// Maps any SimulatorId directly to its authentic physical stroke-art glyph.
// --------------------------------------------------------------------------
export const FLEET_SCHEMATICS: Record<SimulatorId, React.FC<SchematicProps>> = {
  compressor: CompressorSchematic,
  recip: RecipSchematic,
  turbine: TurbineSchematic,
  pump: PumpSchematic,
  gearbox: GearboxSchematic,
  bearing: BearingSchematic,
  journal: JournalSchematic,
  rotor: RotorSchematic,
  pipe: PipeSchematic,
  seal: SealSchematic,
  alignment: AlignmentSchematic,
};

export const getFleetSchematic = (id: SimulatorId): React.FC<SchematicProps> => {
  return FLEET_SCHEMATICS[id] || CompressorSchematic;
};

// --------------------------------------------------------------------------
// FEATURED TWIN: Auto-running Muted Micro-Preview (Impeller + Fluid Particles)
// High-density visual anchor for the 2-column featured card.
// --------------------------------------------------------------------------
export const FeaturedImpellerMicroPreview: React.FC = () => {
  return (
    <div className="relative w-full h-[180px] sm:h-[190px] rounded-lg bg-[#070D18] border border-[#1E293B] overflow-hidden flex items-center justify-center select-none">
      {/* Background Engineering Coordinate Grid */}
      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="feat-grid" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#06B6D4" strokeWidth="0.5" strokeOpacity="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#feat-grid)" />
      </svg>

      {/* Volute Spiral Casing Graphic */}
      <svg
        viewBox="0 0 280 200"
        className="w-full h-full max-w-[340px] pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="volute-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0B1220" stopOpacity="0.1" />
          </linearGradient>
          <radialGradient id="impeller-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.3" />
            <stop offset="70%" stopColor="#06B6D4" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Center Glow */}
        <circle cx="125" cy="100" r="75" fill="url(#impeller-glow)" />

        {/* Outer Spiral Volute Casing */}
        <path
          d="M 125 32 C 168 32 205 64 212 105 C 218 142 188 172 145 174 C 95 176 56 142 56 100 C 56 50 90 32 125 32 L 235 32"
          fill="url(#volute-grad)"
          stroke="#1E293B"
          strokeWidth="2"
        />
        {/* Volute Inner Lip / Cutwater */}
        <path d="M 125 32 L 245 32 L 245 52 L 205 52" stroke="#06B6D4" strokeWidth="1.5" strokeOpacity="0.6" fill="none" />

        {/* Flow Streamline Curves with Animated Dashoffset */}
        <path
          d="M 125 100 Q 155 80 185 62 L 235 42"
          stroke="#06B6D4"
          strokeWidth="1.2"
          strokeDasharray="4 3"
          strokeOpacity="0.75"
          className="animate-[dash_3s_linear_infinite]"
        />
        <path
          d="M 125 100 Q 140 120 170 140 Q 195 145 225 110 L 235 48"
          stroke="#06B6D4"
          strokeWidth="1"
          strokeDasharray="3 3"
          strokeOpacity="0.5"
          className="animate-[dash_4s_linear_infinite]"
        />

        {/* Rotating Impeller Rotor Assembly */}
        <g className="origin-[125px_100px] animate-[spin_8s_linear_infinite] motion-reduce:animate-none">
          {/* Outer Shroud Ring */}
          <circle cx="125" cy="100" r="48" stroke="#334155" strokeWidth="1.2" fill="none" />
          <circle cx="125" cy="100" r="16" stroke="#06B6D4" strokeWidth="1.5" strokeOpacity="0.6" fill="#0B1220" />
          <circle cx="125" cy="100" r="6" fill="#06B6D4" />

          {/* 6 Aerodynamic Backward-Leaned Blades */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <path
              key={i}
              d="M 125 84 C 135 84 148 76 156 66"
              transform={`rotate(${angle} 125 100)`}
              stroke="#06B6D4"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              strokeOpacity="0.9"
            />
          ))}

          {/* Secondary splitter blades */}
          {[30, 90, 150, 210, 270, 330].map((angle, i) => (
            <path
              key={`split-${i}`}
              d="M 132 86 C 138 86 146 80 152 74"
              transform={`rotate(${angle} 125 100)`}
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeOpacity="0.4"
              fill="none"
            />
          ))}
        </g>

        {/* Floating Fluid Particles in Volute Channels */}
        <circle cx="178" cy="74" r="1.8" fill="#06B6D4" className="animate-ping opacity-60" />
        <circle cx="152" cy="142" r="1.5" fill="#06B6D4" className="animate-pulse" />
        <circle cx="218" cy="42" r="2" fill="#06B6D4" className="animate-bounce" />
      </svg>

      {/* Live Telemetry Overlay Pill Badges (Top & Bottom Corners) */}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0B1220]/90 border border-[#1E293B] text-[10px] font-mono text-slate-300">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>N = 10,500 RPM</span>
      </div>

      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0B1220]/90 border border-[#1E293B] text-[10px] font-mono text-cyan-300">
        <span>PR: 3.42 : 1</span>
      </div>

      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0B1220]/90 border border-[#1E293B] text-[10px] font-mono text-slate-300">
        <span>SURGE MARGIN:</span>
        <span className="text-[#06B6D4] font-bold">+24.8%</span>
      </div>

      <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-[#06B6D4]/15 border border-[#06B6D4]/30 text-[9px] font-mono text-[#06B6D4] font-bold uppercase tracking-wider">
        LIVE TWIN
      </div>
    </div>
  );
};
