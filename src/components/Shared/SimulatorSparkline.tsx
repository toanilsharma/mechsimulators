import React from 'react';
import { SimulatorId } from '../../types/common';

interface SimulatorSparklineProps {
  id: SimulatorId;
  className?: string;
  isHovered?: boolean;
}

export const SimulatorSparkline: React.FC<SimulatorSparklineProps> = ({
  id,
  className = '',
  isHovered = false,
}) => {
  const accentColor = isHovered ? '#ff8f3d' : '#f27d26';
  const cyanColor = '#38bdf8';
  const emeraldColor = '#34d399';
  const redColor = '#f87171';

  return (
    <div className={`relative w-full h-16 bg-[#080b0f] border border-[#21262d] rounded overflow-hidden select-none font-mono ${className}`}>
      {/* Background Engineering Coordinate Grid */}
      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" width="100%" height="100%">
        <defs>
          <pattern id={`grid-pattern-${id}`} width="20" height="15" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 15" fill="none" stroke="#484f58" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-pattern-${id})`} />
      </svg>

      {/* SVG Physics Graph Viewport */}
      <svg
        viewBox="0 0 240 60"
        className="w-full h-full p-1"
        preserveAspectRatio="none"
      >
        {/* COMPRESSOR: Dynamic Compressor Map (Surge Line, Speed Line & Operating Point) */}
        {id === 'compressor' && (
          <g>
            {/* Surge Limit Line (SLL) */}
            <path
              d="M 20 54 Q 45 35 60 10"
              fill="none"
              stroke={redColor}
              strokeWidth="1.5"
              strokeDasharray="3 2"
            />
            {/* Surge Control Line (SCL) */}
            <path
              d="M 38 54 Q 65 35 82 10"
              fill="none"
              stroke={accentColor}
              strokeWidth="1.2"
              strokeDasharray="2 2"
            />
            {/* 100% Speed Line */}
            <path
              d="M 60 12 Q 130 18 220 50"
              fill="none"
              stroke="#6e7681"
              strokeWidth="1"
            />
            {/* Operating Point */}
            <circle cx="125" cy="24" r="3.5" fill={cyanColor} />
            <circle cx="125" cy="24" r="7" fill={cyanColor} fillOpacity={isHovered ? '0.3' : '0.15'} />
            {/* Label */}
            <text x="230" y="16" fill="#8b949e" fontSize="8" textAnchor="end">API 617 MAP</text>
            <text x="230" y="27" fill={cyanColor} fontSize="8" fontWeight="bold" textAnchor="end">SM: +25.5%</text>
          </g>
        )}

        {/* STEAM TURBINE: Campbell Diagram (Speed vs Frequency & Resonance Rays) */}
        {id === 'turbine' && (
          <g>
            {/* Blade 1st Flex Natural Frequency line */}
            <line x1="20" y1="26" x2="220" y2="26" stroke="#6e7681" strokeWidth="1" strokeDasharray="3 2" />
            <text x="25" y="23" fill="#6e7681" fontSize="7">f_n1 (320 Hz)</text>
            {/* 1X Ray */}
            <line x1="20" y1="52" x2="200" y2="38" stroke="#484f58" strokeWidth="1" />
            {/* 2X Ray */}
            <line x1="20" y1="52" x2="190" y2="18" stroke="#484f58" strokeWidth="1" />
            {/* 6X Nozzle Pass Ray */}
            <line x1="20" y1="52" x2="110" y2="10" stroke={redColor} strokeWidth="1.2" />
            {/* Rated Speed Operating Line */}
            <line x1="140" y1="8" x2="140" y2="54" stroke={emeraldColor} strokeWidth="1.2" strokeDasharray="2 1" />
            <circle cx="140" cy="26" r="3" fill={accentColor} />
            {/* Label */}
            <text x="230" y="16" fill="#8b949e" fontSize="8" textAnchor="end">CAMPBELL</text>
            <text x="230" y="27" fill={emeraldColor} fontSize="8" fontWeight="bold" textAnchor="end">MARGIN: 18%</text>
          </g>
        )}

        {/* RECIPROCATING COMPRESSOR: P-V Indicator Card Closed Loop */}
        {id === 'recip' && (
          <g>
            {/* P-V Closed Loop */}
            <path
              d="M 50 48 L 50 38 Q 65 30 110 18 L 180 18 L 180 28 Q 130 38 75 48 Z"
              fill={accentColor}
              fillOpacity={isHovered ? '0.25' : '0.12'}
              stroke={accentColor}
              strokeWidth="1.5"
            />
            {/* Valve flutter ripple on discharge */}
            <path
              d="M 110 18 Q 115 16 120 18 Q 125 20 130 18"
              fill="none"
              stroke={cyanColor}
              strokeWidth="1.5"
            />
            {/* Label */}
            <text x="230" y="16" fill="#8b949e" fontSize="8" textAnchor="end">API 618 P-V</text>
            <text x="230" y="27" fill={cyanColor} fontSize="8" fontWeight="bold" textAnchor="end">VE: 84.6%</text>
            <text x="50" y="55" fill="#6e7681" fontSize="7">BDC</text>
            <text x="175" y="55" fill="#6e7681" fontSize="7">TDC</text>
          </g>
        )}

        {/* PUMP: H-Q Head Curve vs NPSH Margin */}
        {id === 'pump' && (
          <g>
            {/* Head vs Flow Curve */}
            <path
              d="M 20 14 Q 100 20 200 48"
              fill="none"
              stroke={accentColor}
              strokeWidth="1.5"
            />
            {/* System Curve */}
            <path
              d="M 20 48 Q 80 44 200 22"
              fill="none"
              stroke="#6e7681"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            {/* BEP Operating Point */}
            <circle cx="118" cy="30" r="3.5" fill={emeraldColor} />
            {/* NPSHa vs NPSHr split */}
            <line x1="118" y1="36" x2="118" y2="50" stroke={cyanColor} strokeWidth="1.5" />
            {/* Label */}
            <text x="230" y="16" fill="#8b949e" fontSize="8" textAnchor="end">API 610 H-Q</text>
            <text x="230" y="27" fill={emeraldColor} fontSize="8" fontWeight="bold" textAnchor="end">NPSH: 1.42x</text>
          </g>
        )}

        {/* GEARBOX: FFT Gear Mesh Frequency (GMF) Spectrum */}
        {id === 'gearbox' && (
          <g>
            {/* Baseline noise floor */}
            <line x1="20" y1="50" x2="220" y2="50" stroke="#30363d" strokeWidth="1" />
            {/* 1X Pinion */}
            <line x1="50" y1="50" x2="50" y2="35" stroke="#6e7681" strokeWidth="1.5" />
            <text x="50" y="32" fill="#6e7681" fontSize="7" textAnchor="middle">1X</text>
            {/* GMF Peak */}
            <line x1="120" y1="50" x2="120" y2="12" stroke={accentColor} strokeWidth="2" />
            <circle cx="120" cy="12" r="2.5" fill={accentColor} />
            <text x="120" y="9" fill={accentColor} fontSize="7" textAnchor="middle">GMF</text>
            {/* Sidebands around GMF */}
            <line x1="108" y1="50" x2="108" y2="32" stroke={cyanColor} strokeWidth="1" />
            <line x1="132" y1="50" x2="132" y2="32" stroke={cyanColor} strokeWidth="1" />
            {/* 2X GMF */}
            <line x1="190" y1="50" x2="190" y2="28" stroke="#8b949e" strokeWidth="1.2" />
            <text x="190" y="25" fill="#8b949e" fontSize="7" textAnchor="middle">2X</text>
            {/* Label */}
            <text x="230" y="16" fill="#8b949e" fontSize="8" textAnchor="end">AGMA MESH</text>
            <text x="230" y="27" fill={emeraldColor} fontSize="8" fontWeight="bold" textAnchor="end">S_H: 1.38</text>
          </g>
        )}

        {/* JOURNAL BEARING: Hydrodynamic Fluid Film Pressure Wedge */}
        {id === 'journal' && (
          <g>
            {/* Bearing clearance circle boundary arc */}
            <path d="M 20 48 Q 110 52 200 48" fill="none" stroke="#30363d" strokeWidth="1" />
            {/* Hydrodynamic Reynolds Pressure Distribution */}
            <path
              d="M 30 48 Q 60 48 90 28 Q 120 10 145 22 Q 160 38 175 48 Z"
              fill={cyanColor}
              fillOpacity={isHovered ? '0.3' : '0.15'}
              stroke={cyanColor}
              strokeWidth="1.5"
            />
            {/* h_min line */}
            <line x1="138" y1="18" x2="138" y2="48" stroke={accentColor} strokeWidth="1" strokeDasharray="2 1" />
            <circle cx="138" cy="18" r="2.5" fill={accentColor} />
            {/* Label */}
            <text x="230" y="16" fill="#8b949e" fontSize="8" textAnchor="end">API 684 WEDGE</text>
            <text x="230" y="27" fill={cyanColor} fontSize="8" fontWeight="bold" textAnchor="end">h_min: 24.2µm</text>
          </g>
        )}

        {/* BEARING: Time-Domain Shock Waveform / Kurtosis Impacts */}
        {id === 'bearing' && (
          <g>
            {/* Centerline */}
            <line x1="20" y1="30" x2="220" y2="30" stroke="#30363d" strokeWidth="1" />
            {/* Waveform with periodic BPFO impact spikes */}
            <path
              d="M 20 30 Q 30 32 40 30 L 45 10 L 50 48 L 55 24 L 60 30 Q 75 31 90 30 L 95 12 L 100 46 L 105 26 L 110 30 Q 125 31 140 30 L 145 14 L 150 44 L 155 25 L 160 30 Q 180 32 200 30"
              fill="none"
              stroke={accentColor}
              strokeWidth="1.2"
            />
            {/* Alarm threshold line */}
            <line x1="20" y1="16" x2="200" y2="16" stroke={redColor} strokeWidth="0.8" strokeDasharray="2 2" />
            {/* Label */}
            <text x="230" y="16" fill="#8b949e" fontSize="8" textAnchor="end">ISO 281 PULSE</text>
            <text x="230" y="27" fill={accentColor} fontSize="8" fontWeight="bold" textAnchor="end">BPFO: 104Hz</text>
          </g>
        )}

        {/* ROTOR: 1X Shaft Orbit Lissajous Ellipse */}
        {id === 'rotor' && (
          <g>
            {/* Bearing clearance circle */}
            <circle cx="85" cy="30" r="22" fill="none" stroke="#21262d" strokeWidth="1" />
            <circle cx="85" cy="30" r="2" fill="#484f58" />
            {/* Dynamic Orbit Ellipse */}
            <ellipse
              cx="88"
              cy="28"
              rx="16"
              ry="9"
              transform="rotate(-25 88 28)"
              fill={cyanColor}
              fillOpacity={isHovered ? '0.2' : '0.1'}
              stroke={cyanColor}
              strokeWidth="1.5"
            />
            {/* 1X Keyphasor Blank Dot */}
            <circle cx="100" cy="22" r="2.5" fill={accentColor} />
            {/* Label */}
            <text x="230" y="16" fill="#8b949e" fontSize="8" textAnchor="end">ISO 1940 ORBIT</text>
            <text x="230" y="27" fill={cyanColor} fontSize="8" fontWeight="bold" textAnchor="end">G2.5 (184 g·mm)</text>
          </g>
        )}

        {/* SHAFT ALIGNMENT: Driver vs Driven Thermal Offset Vector */}
        {id === 'alignment' && (
          <g>
            {/* Driver shaft centerline */}
            <line x1="25" y1="30" x2="95" y2="30" stroke="#8b949e" strokeWidth="2" />
            <rect x="25" y="24" width="70" height="12" fill="#161b22" stroke="#484f58" strokeWidth="1" />
            <text x="60" y="32" fill="#8b949e" fontSize="7" textAnchor="middle">DRIVER</text>
            {/* Coupling spacer */}
            <line x1="95" y1="30" x2="115" y2="24" stroke={accentColor} strokeWidth="1.5" strokeDasharray="2 1" />
            {/* Driven machine with vertical thermal offset */}
            <rect x="115" y="18" width="70" height="12" fill="#161b22" stroke="#484f58" strokeWidth="1" />
            <line x1="115" y1="24" x2="185" y2="24" stroke={cyanColor} strokeWidth="2" />
            <text x="150" y="26" fill={cyanColor} fontSize="7" textAnchor="middle">DRIVEN</text>
            {/* Offset delta arrow */}
            <line x1="105" y1="18" x2="105" y2="32" stroke={redColor} strokeWidth="1" />
            {/* Label */}
            <text x="230" y="16" fill="#8b949e" fontSize="8" textAnchor="end">API 686 ALIGN</text>
            <text x="230" y="27" fill={emeraldColor} fontSize="8" fontWeight="bold" textAnchor="end">ΔY: 0.04 mm</text>
          </g>
        )}

        {/* PIPE STRESS: Thermal Expansion U-Loop Deflection */}
        {id === 'pipe' && (
          <g>
            {/* Anchor points */}
            <rect x="25" y="44" width="10" height="6" fill="#484f58" />
            <rect x="175" y="44" width="10" height="6" fill="#484f58" />
            {/* Expansion Loop */}
            <path
              d="M 35 46 L 75 46 L 75 16 L 135 16 L 135 46 L 175 46"
              fill="none"
              stroke="#6e7681"
              strokeWidth="1.5"
            />
            {/* Deflected Hot Position */}
            <path
              d="M 35 46 L 72 46 Q 72 13 105 13 Q 138 13 138 46 L 175 46"
              fill="none"
              stroke={accentColor}
              strokeWidth="1.5"
              strokeDasharray={isHovered ? 'none' : '3 1'}
            />
            {/* Peak moment marker */}
            <circle cx="105" cy="13" r="2.5" fill={redColor} />
            {/* Label */}
            <text x="230" y="16" fill="#8b949e" fontSize="8" textAnchor="end">ASME B31.3</text>
            <text x="230" y="27" fill={accentColor} fontSize="8" fontWeight="bold" textAnchor="end">ΔL: 38.2 mm</text>
          </g>
        )}

        {/* SEAL FLUSH: Vapor Margin vs Chamber Pressure */}
        {id === 'seal' && (
          <g>
            {/* Vapor pressure curve */}
            <path
              d="M 20 48 Q 100 44 190 20"
              fill="none"
              stroke={redColor}
              strokeWidth="1.5"
            />
            <text x="185" y="16" fill={redColor} fontSize="7">P_vap</text>
            {/* Seal chamber pressure line (constant/elevated) */}
            <line x1="20" y1="16" x2="190" y2="16" stroke={cyanColor} strokeWidth="1.5" />
            <text x="45" y="12" fill={cyanColor} fontSize="7">P_chamber (Flush)</text>
            {/* Vapor Margin Gap Bracket */}
            <line x1="120" y1="16" x2="120" y2="38" stroke={emeraldColor} strokeWidth="1.5" />
            <circle cx="120" cy="27" r="2.5" fill={emeraldColor} />
            {/* Label */}
            <text x="230" y="16" fill="#8b949e" fontSize="8" textAnchor="end">API 682 FLUSH</text>
            <text x="230" y="27" fill={emeraldColor} fontSize="8" fontWeight="bold" textAnchor="end">MARGIN: 280 kPa</text>
          </g>
        )}
      </svg>
    </div>
  );
};
