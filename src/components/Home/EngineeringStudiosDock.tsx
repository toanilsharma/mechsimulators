import React, { useState } from 'react';
import {
  Network,
  GitCompare,
  TrendingUp,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Droplet,
  BarChart3,
  Leaf,
  ArrowRight,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

interface EngineeringStudiosDockProps {
  onOpenTrainStudio: () => void;
  onOpenComparator: () => void;
  onOpenReliabilityStudio: () => void;
  onOpenSpectralLab: () => void;
  onOpenRcaStudio?: () => void;
  onOpenTribologyLab?: () => void;
  onOpenMonteCarlo?: () => void;
  onOpenExergyCarbon?: () => void;
}

export const EngineeringStudiosDock: React.FC<EngineeringStudiosDockProps> = ({
  onOpenTrainStudio,
  onOpenComparator,
  onOpenReliabilityStudio,
  onOpenSpectralLab,
  onOpenRcaStudio,
  onOpenTribologyLab,
  onOpenMonteCarlo,
  onOpenExergyCarbon,
}) => {
  const [activeTrainHover, setActiveTrainHover] = useState(false);

  return (
    <section
      id="engineering-studios-dock"
      className="border-b border-[#1b253b] bg-gradient-to-b from-[#080d1a] via-[#091122] to-[#070b16] px-4 sm:px-8 py-8 sm:py-10"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Split Section Header with Tabular Step Prefix & Telemetry Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#18243c] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold uppercase tracking-wider">
                01 // MULTI-BODY & CROSS-ASSET SUITES
              </span>
              <span className="text-slate-500 text-xs hidden sm:inline">•</span>
              <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                Dynamic Coupling & Forensic Diagnostics
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Engineering Studios & Diagnostics Bay
            </h2>
          </div>
          <p className="text-xs text-slate-300 max-w-md font-sans leading-relaxed">
            Multi-component dynamic coupling, twin comparison matrix, vibration spectral cascading, and root-cause failure forensics.
          </p>
        </div>

        {/* Asymmetric Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* TILE 1 (Hero Large - Spans 2 Columns on Desktop): Machinery Train Cascade & Transient Driveline */}
          <div
            id="dock-machinery-train"
            onClick={onOpenTrainStudio}
            onMouseEnter={() => setActiveTrainHover(true)}
            onMouseLeave={() => setActiveTrainHover(false)}
            className="md:col-span-2 group bg-gradient-to-br from-[#0c1830] via-[#0b1426] to-[#060b17] border border-[#223961] hover:border-sky-400 p-6 rounded-2xl flex flex-col justify-between transition-all duration-300 cursor-pointer shadow-lg hover:shadow-sky-500/15 relative overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 group-hover:bg-sky-500/15 transition-all" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-sky-500/20 border border-sky-500/50 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform shadow-md shadow-sky-500/20">
                    <Network size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-500/30 font-bold uppercase tracking-wider">
                      Flagship Suite
                    </span>
                    <h3 className="text-lg font-bold text-white group-hover:text-sky-200 transition-colors mt-0.5">
                      Machinery Train Cascade Studio
                    </h3>
                  </div>
                </div>

                <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/40 font-semibold hidden sm:flex items-center gap-1.5">
                  <Activity size={12} className="text-sky-300 animate-pulse" />
                  <span>4 Coupled Machines</span>
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans max-w-xl">
                Simulate end-to-end mechanical trains from Steam Turbine driver, through high-speed flexible couplings and speed-increasing gearboxes, to multi-stage centrifugal compressors. Track transient trip shockwaves and load reversals.
              </p>

              {/* Animated Interactive Multi-Body Shaft Schematic */}
              <div className="p-3.5 bg-[#060c18]/90 border border-[#1b2d4f] rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="text-sky-400 font-bold">SHAFT DRIVELINE CONTINUUM</span>
                  <span>TORQUE FLOW: ➔ FORWARD (14.2 MW)</span>
                </div>

                <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 text-center font-mono">
                  {/* Node 1: Turbine */}
                  <div className="flex-1 min-w-[70px] bg-[#0c162a] border border-[#203456] rounded-lg p-2 group-hover:border-sky-400 transition-colors">
                    <div className="text-[9px] text-amber-400 font-bold">API 612</div>
                    <div className="text-xs font-bold text-white">TURBINE</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">3,000 RPM</div>
                  </div>

                  <div className="text-sky-400 text-xs font-bold shrink-0 animate-pulse">➔</div>

                  {/* Node 2: Coupling */}
                  <div className="flex-1 min-w-[70px] bg-[#0c162a] border border-[#203456] rounded-lg p-2 group-hover:border-sky-400 transition-colors">
                    <div className="text-[9px] text-sky-400 font-bold">API 686</div>
                    <div className="text-xs font-bold text-white">COUPLING</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">DBSE 180mm</div>
                  </div>

                  <div className="text-sky-400 text-xs font-bold shrink-0 animate-pulse">➔</div>

                  {/* Node 3: Gearbox */}
                  <div className="flex-1 min-w-[70px] bg-[#0c162a] border border-[#203456] rounded-lg p-2 group-hover:border-sky-400 transition-colors">
                    <div className="text-[9px] text-amber-400 font-bold">AGMA 2001</div>
                    <div className="text-xs font-bold text-white">GEARBOX</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">3.75:1 Step</div>
                  </div>

                  <div className="text-sky-400 text-xs font-bold shrink-0 animate-pulse">➔</div>

                  {/* Node 4: Compressor */}
                  <div className="flex-1 min-w-[70px] bg-[#0c162a] border border-[#203456] rounded-lg p-2 group-hover:border-sky-400 transition-colors">
                    <div className="text-[9px] text-cyan-400 font-bold">API 617</div>
                    <div className="text-xs font-bold text-white">COMPRESSOR</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">11,250 RPM</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-[#1b2f52] flex items-center justify-between text-xs font-mono font-bold text-sky-400 group-hover:text-sky-300">
              <span className="flex items-center gap-1.5">
                <span>Launch Full Machinery Train Studio</span>
                <Sparkles size={13} className="text-sky-400" />
              </span>
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* TILE 2 (1 Col on Desktop): Vibration Spectral Lab (Royal Violet) */}
          <div
            id="dock-spectral-lab"
            onClick={onOpenSpectralLab}
            className="group bg-gradient-to-br from-[#1c1030] via-[#140b24] to-[#0a0514] border border-[#3b2160] hover:border-purple-400 p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 cursor-pointer shadow-lg hover:shadow-purple-500/15"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                  <Sliders size={20} />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30 font-semibold">
                  FFT & Orbit
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                  Vibration Spectral Lab
                </h3>
                <div className="text-[11px] text-purple-400 font-mono mt-0.5">3D Cascades & Phase Orbits</div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                High-resolution FFT spectra, 3D waterfall harmonic run-up cascades, and dual-channel Lissajous shaft orbits with Keyphasor dots.
              </p>

              {/* Schematic Harmonic Bars */}
              <div className="h-10 bg-[#0c0714] border border-[#26143d] rounded-lg px-3 flex items-end justify-between py-1.5 gap-1.5">
                <div className="w-full flex items-end justify-between h-full">
                  <div className="w-1.5 bg-purple-400 h-8 rounded-t" title="1X Unbalance" />
                  <div className="w-1.5 bg-purple-500/70 h-5 rounded-t" title="2X Misalignment" />
                  <div className="w-1.5 bg-purple-600/50 h-3 rounded-t" title="3X" />
                  <div className="w-1.5 bg-pink-400 h-7 rounded-t" title="GMF Mesh" />
                  <div className="w-1.5 bg-purple-500/60 h-4 rounded-t" />
                  <div className="w-1.5 bg-indigo-400 h-6 rounded-t" title="BPFO Bearing" />
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-[#291642] flex items-center justify-between text-xs font-mono font-bold text-purple-400 group-hover:text-purple-300">
              <span>Open Spectral Lab</span>
              <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* TILE 3 (1 Col on Desktop): Cross-Asset Comparator (Flame Orange) */}
          <div
            id="dock-twin-comparator"
            onClick={onOpenComparator}
            className="group bg-gradient-to-br from-[#241309] via-[#180d06] to-[#0c0603] border border-[#4a2612] hover:border-orange-400 p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 cursor-pointer shadow-lg hover:shadow-orange-500/15"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 group-hover:scale-105 transition-transform">
                  <GitCompare size={20} />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-950/80 text-orange-300 border border-orange-500/30 font-semibold">
                  Side-by-Side
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white group-hover:text-orange-300 transition-colors">
                  Digital Twin Comparator
                </h3>
                <div className="text-[11px] text-orange-400 font-mono mt-0.5">Dual-Asset Telemetry Matrix</div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Simultaneously benchmark complementary assets (e.g. Steam Turbine vs Compressor) with unified margin ratios and delta indicators.
              </p>

              {/* Side-by-Side Graphic Pill */}
              <div className="h-10 bg-[#0f0703] border border-[#331a0b] rounded-lg px-2 flex items-center justify-around text-[10px] font-mono">
                <span className="text-amber-300 font-bold">API 612 TURB</span>
                <span className="text-orange-400 font-extrabold px-1.5 py-0.5 rounded bg-orange-500/20">VS</span>
                <span className="text-cyan-300 font-bold">API 617 COMP</span>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-[#361c0c] flex items-center justify-between text-xs font-mono font-bold text-orange-400 group-hover:text-orange-300">
              <span>Launch Comparator</span>
              <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: 4 Specialized Diagnostic Labs (RCA, Tribology, Monte Carlo, Exergy) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Sub-Studio 1: Reliability & Weibull */}
          <div
            onClick={onOpenReliabilityStudio}
            className="p-3.5 rounded-xl bg-[#091511] hover:bg-[#0d1e18] border border-[#163629] hover:border-emerald-400 transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                <TrendingUp size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Weibull Lifecycle
                </div>
                <div className="text-[10px] font-mono text-emerald-400">Hazard Rate & Health 0-100</div>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5" />
          </div>

          {/* Sub-Studio 2: Forensic RCA Studio */}
          <div
            onClick={onOpenRcaStudio}
            className="p-3.5 rounded-xl bg-[#160d11] hover:bg-[#201319] border border-[#3d1a27] hover:border-rose-400 transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
                  Forensic RCA Studio
                </div>
                <div className="text-[10px] font-mono text-rose-400">IEC 62740 5-Whys & Fishbone</div>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-500 group-hover:text-rose-400 transition-transform group-hover:translate-x-0.5" />
          </div>

          {/* Sub-Studio 3: Tribology & ISO 4406 Lab */}
          <div
            onClick={onOpenTribologyLab}
            className="p-3.5 rounded-xl bg-[#181308] hover:bg-[#231b0c] border border-[#3b2d12] hover:border-amber-400 transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <Droplet size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                  Tribology & Cleanliness
                </div>
                <div className="text-[10px] font-mono text-amber-400">ISO 4406 & ASTM D341 Walther</div>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5" />
          </div>

          {/* Sub-Studio 4: Monte Carlo & Exergy Hub */}
          <div
            onClick={onOpenMonteCarlo || onOpenExergyCarbon}
            className="p-3.5 rounded-xl bg-[#120f20] hover:bg-[#1a162e] border border-[#2b224c] hover:border-purple-400 transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center shrink-0">
                <BarChart3 size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                  Monte Carlo & Exergy
                </div>
                <div className="text-[10px] font-mono text-purple-400">GUM Tolerance & ISO 14040</div>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-500 group-hover:text-purple-400 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </section>
  );
};
