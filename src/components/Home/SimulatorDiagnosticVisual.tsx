import React from 'react';
import { SimulatorId } from '../../types/common';

interface DiagnosticVisualProps {
  id: SimulatorId;
}

export const SimulatorDiagnosticVisual: React.FC<DiagnosticVisualProps> = ({ id }) => {
  switch (id) {
    case 'pump':
      return (
        <div className="w-full h-28 rounded-xl bg-[#040914] border border-cyan-500/20 p-2.5 flex flex-col justify-between overflow-hidden relative group/viz">
          {/* Header readout */}
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-cyan-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              NPSH Margin &amp; Q-H Curve
            </span>
            <span className="text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
              ΔNPSH: +1.42 m (Safe)
            </span>
          </div>

          {/* SVG Mini Q-H Curve and NPSH Margin */}
          <svg className="w-full h-14 overflow-visible" viewBox="0 0 200 60">
            {/* Grid lines */}
            <line x1="10" y1="10" x2="190" y2="10" stroke="#1e293b" strokeDasharray="2 2" strokeWidth="0.8" />
            <line x1="10" y1="30" x2="190" y2="30" stroke="#1e293b" strokeDasharray="2 2" strokeWidth="0.8" />
            <line x1="10" y1="50" x2="190" y2="50" stroke="#1e293b" strokeWidth="0.8" />

            {/* Q-H Head Curve */}
            <path
              d="M 15 14 Q 90 20 185 46"
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* NPSHr Curve (rising with flow) */}
            <path
              d="M 15 52 Q 100 48 185 36"
              fill="none"
              stroke="#fb7185"
              strokeWidth="1.8"
              strokeDasharray="3 2"
            />
            {/* NPSHa Line (above NPSHr) */}
            <path
              d="M 15 42 Q 100 38 185 24"
              fill="none"
              stroke="#34d399"
              strokeWidth="1.8"
            />

            {/* Active Duty Point with pulse */}
            <circle cx="105" cy="22" r="4.5" fill="#38bdf8" />
            <circle cx="105" cy="22" r="7.5" fill="#38bdf8" opacity="0.3" className="animate-ping" />
            <line x1="105" y1="22" x2="105" y2="50" stroke="#38bdf8" strokeDasharray="1.5 1.5" strokeWidth="1" />
          </svg>

          {/* Footer metrics */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Q = 180 m³/h</span>
            <span className="text-cyan-300">H = 68.4 m</span>
            <span>Nss = 8,950</span>
          </div>
        </div>
      );

    case 'compressor':
      return (
        <div className="w-full h-28 rounded-xl bg-[#060402] border border-amber-500/20 p-2.5 flex flex-col justify-between overflow-hidden relative group/viz">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Dynamic Surge Map (P2/P1 vs Q)
            </span>
            <span className="text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
              SLL Margin: +14.5%
            </span>
          </div>

          <svg className="w-full h-14 overflow-visible" viewBox="0 0 200 60">
            {/* Surge Zone Danger Fill */}
            <path d="M 15 10 Q 55 25 75 50 L 15 50 Z" fill="rgba(244, 63, 94, 0.15)" />
            {/* Surge Limit Line (SLL) */}
            <path d="M 15 10 Q 55 25 75 50" fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 2" />
            {/* Surge Control Line (SCL) */}
            <path d="M 28 10 Q 68 25 88 50" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="2 2" />
            {/* Speed Line 10,500 RPM */}
            <path d="M 45 15 Q 120 18 185 38" fill="none" stroke="#38bdf8" strokeWidth="2.2" />

            {/* Operating Point */}
            <circle cx="118" cy="20" r="4.5" fill="#f59e0b" />
            <circle cx="118" cy="20" r="7.5" fill="#f59e0b" opacity="0.3" className="animate-ping" />
            <text x="124" y="16" fill="#fbbf24" fontSize="8" fontFamily="monospace">Stable OP</text>
          </svg>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>rc = 2.45</span>
            <span className="text-amber-300">Hp = 82.5 kJ/kg</span>
            <span>T2 = 142°C</span>
          </div>
        </div>
      );

    case 'recip':
      return (
        <div className="w-full h-28 rounded-xl bg-[#030a07] border border-emerald-500/20 p-2.5 flex flex-col justify-between overflow-hidden relative group/viz">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Cylinder P-V Indicator Loop
            </span>
            <span className="text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
              Reversal: 24° (&gt;15° OK)
            </span>
          </div>

          <svg className="w-full h-14 overflow-visible" viewBox="0 0 200 60">
            {/* P-V Closed Thermodynamic Loop */}
            <path
              d="M 50 16 L 150 16 Q 165 30 165 48 L 70 48 Q 45 32 50 16 Z"
              fill="rgba(16, 185, 129, 0.12)"
              stroke="#10b981"
              strokeWidth="2"
            />
            {/* Cylinder Top Dead Center (TDC) / Bottom Dead Center (BDC) markers */}
            <line x1="50" y1="12" x2="50" y2="52" stroke="#64748b" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
            <line x1="165" y1="12" x2="165" y2="52" stroke="#64748b" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
            <text x="35" y="52" fill="#94a3b8" fontSize="7" fontFamily="monospace">TDC</text>
            <text x="170" y="52" fill="#94a3b8" fontSize="7" fontFamily="monospace">BDC</text>

            {/* Live Crank-Angle Marker */}
            <circle cx="108" cy="16" r="3.5" fill="#34d399" />
          </svg>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>F_rod = 84 kN</span>
            <span className="text-emerald-300">η_vol = 81.2%</span>
            <span>fn = 28 Hz</span>
          </div>
        </div>
      );

    case 'turbine':
      return (
        <div className="w-full h-28 rounded-xl bg-[#080204] border border-rose-500/20 p-2.5 flex flex-col justify-between overflow-hidden relative group/viz">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-rose-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              Mollier Expansion (h-s Path)
            </span>
            <span className="text-rose-300 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/30">
              Moisture: 8.2% (&lt;12% Max)
            </span>
          </div>

          <svg className="w-full h-14 overflow-visible" viewBox="0 0 200 60">
            {/* Saturation Vapor Line */}
            <path d="M 20 28 Q 100 32 180 40" fill="none" stroke="#64748b" strokeWidth="1.2" strokeDasharray="2 2" />
            {/* Wilson Condensation Line */}
            <path d="M 20 38 Q 100 42 180 48" fill="none" stroke="#f43f5e" strokeWidth="1" strokeDasharray="1.5 1.5" />
            
            {/* Actual Steam Expansion Curve */}
            <path d="M 40 10 Q 60 25 140 38" fill="none" stroke="#fb7185" strokeWidth="2.5" />
            {/* Isentropic Reference Line */}
            <line x1="40" y1="10" x2="40" y2="44" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />

            {/* Inlet and Exhaust Points */}
            <circle cx="40" cy="10" r="3.5" fill="#f43f5e" />
            <circle cx="140" cy="38" r="4.5" fill="#fb7185" />
            <circle cx="140" cy="38" r="7" fill="#fb7185" opacity="0.3" className="animate-ping" />
          </svg>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Δh = 742 kJ/kg</span>
            <span className="text-rose-300">η_isen = 83.4%</span>
            <span>Steam: 18.5 t/h</span>
          </div>
        </div>
      );

    case 'gearbox':
      return (
        <div className="w-full h-28 rounded-xl bg-[#070301] border border-orange-500/20 p-2.5 flex flex-col justify-between overflow-hidden relative group/viz">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-orange-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              AGMA Stress &amp; Mesh Spectrum
            </span>
            <span className="text-orange-300 bg-orange-950/60 px-1.5 py-0.5 rounded border border-orange-500/30">
              SH: 1.34 / SF: 1.62
            </span>
          </div>

          <svg className="w-full h-14 overflow-visible" viewBox="0 0 200 60">
            {/* FFT Spectrum Floor */}
            <path
              d="M 15 50 L 35 48 L 45 32 L 55 50 L 80 48 L 95 12 L 110 50 L 140 48 L 155 36 L 170 50 L 185 49"
              fill="none"
              stroke="#ea580c"
              strokeWidth="1.8"
            />
            {/* GMF Peak Highlight */}
            <circle cx="95" cy="12" r="3.5" fill="#fb923c" />
            <text x="82" y="8" fill="#fb923c" fontSize="8" fontFamily="monospace">1X GMF</text>
            <text x="142" y="30" fill="#94a3b8" fontSize="7" fontFamily="monospace">2X GMF</text>
          </svg>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>f_gmf = 750 Hz</span>
            <span className="text-orange-300">σ_H = 890 MPa</span>
            <span>Λ = 1.84 (EHL)</span>
          </div>
        </div>
      );

    case 'bearing':
      return (
        <div className="w-full h-28 rounded-xl bg-[#06030a] border border-violet-500/20 p-2.5 flex flex-col justify-between overflow-hidden relative group/viz">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-violet-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Enveloped Acceleration (gE) FFT
            </span>
            <span className="text-violet-300 bg-violet-950/60 px-1.5 py-0.5 rounded border border-violet-500/30">
              ISO Zone B (Acceptable)
            </span>
          </div>

          <svg className="w-full h-14 overflow-visible" viewBox="0 0 200 60">
            {/* Noise Floor & Defect Spikes */}
            <path
              d="M 15 50 L 30 46 L 40 50 L 60 48 L 70 14 L 80 50 L 105 48 L 120 22 L 135 50 L 160 48 L 170 34 L 185 49"
              fill="none"
              stroke="#a855f7"
              strokeWidth="1.8"
            />
            {/* BPFO Harmonic Markers */}
            <circle cx="70" cy="14" r="3.5" fill="#c084fc" />
            <text x="58" y="10" fill="#c084fc" fontSize="8" fontFamily="monospace">BPFO</text>
            <circle cx="120" cy="22" r="3" fill="#c084fc" />
            <text x="110" y="18" fill="#94a3b8" fontSize="7" fontFamily="monospace">2xBPFO</text>
          </svg>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>BPFO = 106.8 Hz</span>
            <span className="text-violet-300">V_rms = 2.4 mm/s</span>
            <span>L10h = 42,000h</span>
          </div>
        </div>
      );

    case 'journal':
      return (
        <div className="w-full h-28 rounded-xl bg-[#02070a] border border-teal-500/20 p-2.5 flex flex-col justify-between overflow-hidden relative group/viz">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-teal-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Journal Orbit &amp; Reynolds Wedge
            </span>
            <span className="text-teal-300 bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-500/30">
              Whirl Margin: +32%
            </span>
          </div>

          <svg className="w-full h-14 overflow-visible" viewBox="0 0 200 60">
            {/* Bearing Bushing Outer Circle */}
            <circle cx="100" cy="30" r="24" fill="none" stroke="#334155" strokeWidth="1.5" />
            {/* Hydrodynamic Oil Wedge Pressure Arc */}
            <path d="M 85 46 A 24 24 0 0 0 120 42" fill="none" stroke="#14b8a6" strokeWidth="4" opacity="0.6" />
            {/* Journal Orbit Ellipse */}
            <ellipse cx="98" cy="28" rx="14" ry="10" fill="rgba(45, 212, 191, 0.15)" stroke="#2dd4bf" strokeWidth="1.8" />
            {/* Shaft Center */}
            <circle cx="98" cy="28" r="2.5" fill="#5eead4" />
          </svg>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>S = 0.18</span>
            <span className="text-teal-300">h_min = 22 µm</span>
            <span>Onset: 0.45X Safe</span>
          </div>
        </div>
      );

    case 'rotor':
      return (
        <div className="w-full h-28 rounded-xl bg-[#020805] border border-emerald-500/20 p-2.5 flex flex-col justify-between overflow-hidden relative group/viz">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Critical Speed Resonance &amp; 1X
            </span>
            <span className="text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
              ISO G2.5 Compliant
            </span>
          </div>

          <svg className="w-full h-14 overflow-visible" viewBox="0 0 200 60">
            {/* Baseline and Damped Critical Speed Resonance Peak */}
            <path
              d="M 15 50 Q 55 48 70 38 Q 85 8 95 8 Q 105 8 120 38 Q 140 46 185 47"
              fill="none"
              stroke="#10b981"
              strokeWidth="2.2"
            />
            {/* 1st Critical Speed Marker (Nc1) */}
            <line x1="95" y1="8" x2="95" y2="52" stroke="#eab308" strokeWidth="1" strokeDasharray="2 2" />
            <circle cx="95" cy="8" r="3.5" fill="#facc15" />
            <text x="98" y="14" fill="#facc15" fontSize="7" fontFamily="monospace">Nc1 (1,820 RPM)</text>

            {/* Running Speed Marker (2,950 RPM - Supercritical regime) */}
            <circle cx="160" cy="46" r="4" fill="#34d399" />
            <text x="145" y="40" fill="#34d399" fontSize="7" fontFamily="monospace">Op 2,950 RPM</text>
          </svg>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>U_actual = 25 g·mm</span>
            <span className="text-emerald-300">Fc = 590 N</span>
            <span>V_rms = 1.8 mm/s</span>
          </div>
        </div>
      );

    case 'pipe':
      return (
        <div className="w-full h-28 rounded-xl bg-[#040508] border border-slate-700/50 p-2.5 flex flex-col justify-between overflow-hidden relative group/viz">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-300 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
              Thermal Loop Bending Stress
            </span>
            <span className="text-lime-300 bg-lime-950/60 px-1.5 py-0.5 rounded border border-lime-500/30">
              SE/SA = 0.68 (OK)
            </span>
          </div>

          <svg className="w-full h-14 overflow-visible" viewBox="0 0 200 60">
            {/* Piping Expansion U-Loop Geometry */}
            <path
              d="M 20 45 L 65 45 L 65 18 L 135 18 L 135 45 L 180 45"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {/* Deflected shape under thermal growth */}
            <path
              d="M 20 45 L 67 43 L 67 15 L 133 15 L 133 43 L 180 45"
              fill="none"
              stroke="#a3e635"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
            {/* Fixed Anchor Symbols */}
            <rect x="12" y="40" width="8" height="10" fill="#475569" />
            <rect x="180" y="40" width="8" height="10" fill="#475569" />
          </svg>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>ΔL = 28.4 mm</span>
            <span className="text-lime-400">SE = 138 MPa</span>
            <span>SA = 205 MPa</span>
          </div>
        </div>
      );

    case 'seal':
      return (
        <div className="w-full h-28 rounded-xl bg-[#02070c] border border-blue-500/20 p-2.5 flex flex-col justify-between overflow-hidden relative group/viz">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-blue-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              API 682 Flush Loop Schematic
            </span>
            <span className="text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
              Vapor Margin: +18°C
            </span>
          </div>

          <svg className="w-full h-14 overflow-visible" viewBox="0 0 200 60">
            {/* Stuffing Box Outline */}
            <rect x="30" y="15" width="60" height="32" fill="none" stroke="#334155" strokeWidth="1.5" rx="3" />
            {/* Seal Face Contact Plane */}
            <line x1="60" y1="15" x2="60" y2="47" stroke="#38bdf8" strokeWidth="2.5" />
            {/* Heat Exchanger Coil Loop */}
            <path d="M 60 15 L 60 8 L 140 8 L 140 40 L 90 40" fill="none" stroke="#0284c7" strokeWidth="1.8" strokeDasharray="3 1.5" />
            {/* Flush Flow Direction Arrows */}
            <polygon points="100,5 106,8 100,11" fill="#38bdf8" />
          </svg>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Q_gen = 1.8 kW</span>
            <span className="text-cyan-300">P_box = 8.5 bar</span>
            <span>ΔP_barrier = +1.8 bar</span>
          </div>
        </div>
      );

    case 'alignment':
      return (
        <div className="w-full h-28 rounded-xl bg-[#050702] border border-lime-500/20 p-2.5 flex flex-col justify-between overflow-hidden relative group/viz">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-lime-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
              Laser Alignment Target Dial
            </span>
            <span className="text-lime-300 bg-lime-950/60 px-1.5 py-0.5 rounded border border-lime-500/30">
              API 686 In-Tolerance
            </span>
          </div>

          <svg className="w-full h-14 overflow-visible" viewBox="0 0 200 60">
            {/* Bullseye Crosshair Rings */}
            <circle cx="100" cy="30" r="22" fill="none" stroke="#334155" strokeWidth="1" />
            <circle cx="100" cy="30" r="14" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
            <circle cx="100" cy="30" r="6" fill="rgba(163, 230, 53, 0.15)" stroke="#65a30d" strokeWidth="1.2" />
            <line x1="72" y1="30" x2="128" y2="30" stroke="#334155" strokeWidth="0.8" />
            <line x1="100" y1="4" x2="100" y2="56" stroke="#334155" strokeWidth="0.8" />

            {/* Current Alignment Laser Dot */}
            <circle cx="103" cy="28" r="3.5" fill="#a3e635" />
            <circle cx="103" cy="28" r="6" fill="#a3e635" opacity="0.3" className="animate-ping" />
          </svg>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Angular: 0.03 mm/100mm</span>
            <span className="text-lime-400">Offset: 0.02 mm</span>
            <span>Shim: +0.25 mm</span>
          </div>
        </div>
      );

    default:
      return null;
  }
};
