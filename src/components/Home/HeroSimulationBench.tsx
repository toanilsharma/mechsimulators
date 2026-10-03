import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCw, AlertTriangle, Zap, Activity, ArrowRight, ShieldAlert, CheckCircle2, Flame, Wind, Disc } from 'lucide-react';
import { SimulatorId } from '../../types/common';

interface HeroSimulationBenchProps {
  onLaunchSim: (id: SimulatorId) => void;
}

type BenchMode = 'nominal' | 'surge' | 'whirl' | 'cavitation' | 'unbalance';

export const HeroSimulationBench: React.FC<HeroSimulationBenchProps> = ({ onLaunchSim }) => {
  const [speedPreset, setSpeedPreset] = useState<'nominal' | 'high' | 'trip'>('nominal');
  const [mode, setMode] = useState<BenchMode>('nominal');
  const [phase, setPhase] = useState<number>(0);
  const animRef = useRef<number | null>(null);

  // Speed values
  const rpm = speedPreset === 'nominal' ? 6200 : speedPreset === 'high' ? 9800 : 11450;
  
  // Real-time animation loop
  useEffect(() => {
    let lastTime = performance.now();
    const update = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const speedMultiplier = speedPreset === 'nominal' ? 1.0 : speedPreset === 'high' ? 1.8 : 2.5;
      setPhase((prev) => (prev + dt * speedMultiplier * 4) % (Math.PI * 2));
      animRef.current = requestAnimationFrame(update);
    };
    animRef.current = requestAnimationFrame(update);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [speedPreset]);

  // Derived telemetry based on mode
  const telemetry = {
    nominal: {
      vibration: (1.2 + Math.sin(phase) * 0.15).toFixed(2),
      margin: '18.4%',
      marginLabel: 'Surge / Cav Margin',
      health: 98,
      status: 'NORMAL BASELINE',
      statusColor: 'text-emerald-400',
      statusBg: 'bg-emerald-500/10 border-emerald-500/30',
      desc: 'Balanced hydrodynamic film • Flow in steady-state envelope',
      associatedSim: 'compressor' as SimulatorId,
      simName: 'Centrifugal Compressor',
      dominantFreq: '1X Running (103 Hz)',
      dampingRatio: 'ζ = 0.18',
    },
    surge: {
      vibration: (7.4 + Math.sin(phase * 3) * 2.8).toFixed(2),
      margin: '-4.2%',
      marginLabel: 'Surge Deficit',
      health: 24,
      status: 'AERODYNAMIC SURGE TRIP',
      statusColor: 'text-rose-400',
      statusBg: 'bg-rose-500/10 border-rose-500/30',
      desc: 'Mass flow reversal • Violent axial thrust oscillation detected',
      associatedSim: 'compressor' as SimulatorId,
      simName: 'Centrifugal Compressor',
      dominantFreq: 'Plenum Pulse (3.2 Hz)',
      dampingRatio: 'ζ = -0.04 (Instability)',
    },
    whirl: {
      vibration: (5.8 + Math.sin(phase * 0.43 * 2) * 1.6).toFixed(2),
      margin: '0.43X',
      marginLabel: 'Whirl Ratio',
      health: 38,
      status: '0.43X SUB-SYNCHRONOUS WHIRL',
      statusColor: 'text-amber-400',
      statusBg: 'bg-amber-500/10 border-amber-500/30',
      desc: 'Oil wedge instability • Shaft precessing at 43% running speed',
      associatedSim: 'journal' as SimulatorId,
      simName: 'Hydrodynamic Journal',
      dominantFreq: 'Sub-harmonic (44.3 Hz)',
      dampingRatio: 'ζ = 0.01 (Borderline)',
    },
    cavitation: {
      vibration: (6.9 + Math.sin(phase * 5) * 2.1).toFixed(2),
      margin: '0.82x',
      marginLabel: 'NPSH Ratio (Deficient)',
      health: 31,
      status: 'HIGH-FREQUENCY CAVITATION',
      statusColor: 'text-rose-400',
      statusBg: 'bg-rose-500/10 border-rose-500/30',
      desc: 'Vapor bubble collapse • High-frequency acoustic pitting',
      associatedSim: 'pump' as SimulatorId,
      simName: 'Centrifugal Pump',
      dominantFreq: 'Acoustic Shock (>5 kHz)',
      dampingRatio: 'NPSHa < NPSH3',
    },
    unbalance: {
      vibration: (8.6 + Math.sin(phase * 2) * 1.9).toFixed(2),
      margin: 'ISO G16',
      marginLabel: 'Unbalance Grade (Exceeded)',
      health: 29,
      status: '1X ROTOR UNBALANCE TRIP',
      statusColor: 'text-purple-400',
      statusBg: 'bg-purple-500/10 border-purple-500/30',
      desc: 'Centrifugal mass eccentricity • High 1X synchronous bearing load',
      associatedSim: 'rotor' as SimulatorId,
      simName: 'Laval / Jeffcott Rotor',
      dominantFreq: 'Pure 1X Synchronous',
      dampingRatio: 'ISO 1940 Out of Spec',
    },
  }[mode];

  // Dynamic waveform points for real-time oscilloscope
  const generateWaveform = () => {
    const points: string[] = [];
    const width = 260;
    const height = 48;
    const midY = height / 2;
    const steps = 30;

    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * width;
      let y = midY;
      if (mode === 'nominal') {
        y = midY + Math.sin(phase + (i / steps) * Math.PI * 4) * 12;
      } else if (mode === 'surge') {
        y = midY + Math.sin(phase * 2 + (i / steps) * Math.PI * 2) * 18 + Math.sin(i * 0.8) * 5;
      } else if (mode === 'whirl') {
        y = midY + Math.sin(phase * 0.43 + (i / steps) * Math.PI * 2) * 14 + Math.sin(phase + (i / steps) * Math.PI * 6) * 6;
      } else if (mode === 'unbalance') {
        // High pure 1X sinusoidal amplitude with phase shift
        y = midY + Math.sin(phase * 2 + (i / steps) * Math.PI * 4) * 20;
      } else {
        // Cavitation: erratic high frequency spikes
        y = midY + Math.sin(phase * 4 + i) * 14 + (Math.sin(i * 1.7 + phase * 3) > 0.5 ? 9 : -9);
      }
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return points.join(' ');
  };

  // Rotation angles for visual SVG rotor
  const rotationDeg = (phase * (180 / Math.PI) * 4) % 360;
  // Orbit offset for shaft center
  const orbitX = mode === 'whirl' 
    ? Math.cos(phase * 0.43 * 2) * 14 
    : mode === 'unbalance' 
    ? Math.cos(phase * 2) * 16 
    : Math.cos(phase) * 3;
  const orbitY = mode === 'whirl' 
    ? Math.sin(phase * 0.43 * 2) * 11 
    : mode === 'unbalance' 
    ? Math.sin(phase * 2) * 16 
    : Math.sin(phase) * 3;

  return (
    <div className="relative rounded-2xl border border-sky-500/30 bg-gradient-to-br from-[#0a1120] via-[#070d18] to-[#040810] p-4 sm:p-5 shadow-2xl shadow-sky-950/50 overflow-hidden font-sans">
      {/* Background Neon Grid Accent */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header: Simulator Status & Live Ticker */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1c2942]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/40 text-sky-300 text-[11px] font-mono font-semibold">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <span>INTERACTIVE TEST RIG</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">Multi-Physics Engine</span>
        </div>

        <div className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border flex items-center gap-1.5 ${telemetry.statusBg} ${telemetry.statusColor}`}>
          {mode === 'nominal' ? <CheckCircle2 size={12} /> : <ShieldAlert size={12} />}
          <span>{telemetry.status}</span>
        </div>
      </div>

      {/* Main Interactive Stage: Graphic & Oscilloscope */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 py-4 items-center">
        {/* Left Stage: Kinetic Rotor / Bearing Orbit Visualizer */}
        <div className="sm:col-span-6 flex flex-col items-center justify-center p-3 rounded-xl bg-[#060a12] border border-[#162238] relative">
          <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-400">
            SHAFT & IMPELLER DYNAMICS
          </div>
          <div className="absolute top-2 right-2 text-[10px] font-mono text-sky-400 font-semibold">
            {rpm} RPM
          </div>

          <div className="relative w-36 h-36 my-2 flex items-center justify-center">
            {/* Outer Bearing Shell / Stator Housing */}
            <svg className="w-full h-full" viewBox="0 0 140 140">
              {/* Stator ring */}
              <circle cx="70" cy="70" r="64" fill="none" stroke="#1f2d47" strokeWidth="8" />
              <circle cx="70" cy="70" r="58" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" />
              
              {/* Dynamic Oil Film / Flow Ring */}
              <circle
                cx="70"
                cy="70"
                r="48"
                fill={mode === 'surge' ? '#f43f5e15' : mode === 'cavitation' ? '#0284c725' : '#05966920'}
                stroke={mode === 'surge' ? '#f43f5e' : mode === 'cavitation' ? '#38bdf8' : '#10b981'}
                strokeWidth="1.5"
                opacity="0.8"
              />

              {/* Orbit Trajectory Trail */}
              {mode === 'whirl' && (
                <ellipse
                  cx="70"
                  cy="70"
                  rx="24"
                  ry="18"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
              )}
              {mode === 'unbalance' && (
                <circle
                  cx="70"
                  cy="70"
                  r="26"
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                />
              )}

              {/* Rotating Rotor / Impeller Blades */}
              <g transform={`translate(${70 + orbitX}, ${70 + orbitY}) rotate(${rotationDeg})`}>
                {/* Rotor center hub */}
                <circle cx="0" cy="0" r="20" fill="#0f172a" stroke="#64748b" strokeWidth="2.5" />
                
                {/* 6 Blades / Impeller vanes */}
                {[0, 60, 120, 180, 240, 300].map((angle) => (
                  <g key={angle} transform={`rotate(${angle})`}>
                    <path
                      d="M 0,-20 Q 8,-36 4,-46 Q -2,-44 -4,-20 Z"
                      fill={mode === 'surge' ? '#fb7185' : mode === 'cavitation' ? '#38bdf8' : '#34d399'}
                      opacity="0.9"
                    />
                  </g>
                ))}

                {/* Shaft Center Marker */}
                <circle cx="0" cy="0" r="4" fill="#ffffff" />
                <line x1="0" y1="-8" x2="0" y2="8" stroke="#38bdf8" strokeWidth="1.5" />
                <line x1="-8" y1="0" x2="8" y2="0" stroke="#38bdf8" strokeWidth="1.5" />
              </g>
            </svg>

            {/* Dynamic Status Glow Indicator */}
            {mode !== 'nominal' && (
              <div className="absolute inset-0 rounded-full border border-red-500/50 animate-ping pointer-events-none opacity-30" />
            )}
          </div>

          <div className="text-[11px] font-mono text-center text-slate-300 font-medium">
            {telemetry.desc}
          </div>
        </div>

        {/* Right Stage: Real-Time Oscilloscope & Live Readings */}
        <div className="sm:col-span-6 space-y-3">
          {/* Dynamic Oscilloscope */}
          <div className="bg-[#060a12] border border-[#162238] rounded-xl p-2.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Activity size={12} className="text-sky-400" />
                <span>REAL-TIME SHAFT VIBRATION SPECTRUM</span>
              </span>
              <span className="text-sky-300">{telemetry.vibration} mm/s RMS</span>
            </div>

            <div className="h-12 w-full bg-[#04060a] rounded border border-[#121c2d] flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 260 48" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor={mode === 'nominal' ? '#34d399' : mode === 'surge' ? '#f43f5e' : '#fbbf24'} />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
                {/* Center zero line */}
                <line x1="0" y1="24" x2="260" y2="24" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                {/* Oscilloscope polyline */}
                <polyline
                  points={generateWaveform()}
                  fill="none"
                  stroke="url(#wave-grad)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Telemetry Metric Cards */}
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <div className="p-2 rounded-lg bg-[#090f1a] border border-[#162238]">
              <div className="text-[10px] text-slate-400 uppercase">{telemetry.marginLabel}</div>
              <div className="text-sm font-bold text-white mt-0.5">{telemetry.margin}</div>
              <div className="text-[9px] text-sky-400/80 mt-0.5">{telemetry.dominantFreq}</div>
            </div>

            <div className="p-2 rounded-lg bg-[#090f1a] border border-[#162238]">
              <div className="text-[10px] text-slate-400 uppercase">Health & Stability</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-sm font-bold ${telemetry.health > 70 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {telemetry.health}%
                </span>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${telemetry.health > 70 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${telemetry.health}%` }}
                  />
                </div>
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5 truncate">{telemetry.dampingRatio}</div>
            </div>
          </div>

          {/* Direct Simulator Launch Link for Current Mode */}
          <button
            onClick={() => onLaunchSim(telemetry.associatedSim)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/40 text-sky-300 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer group"
          >
            <span className="flex items-center gap-1.5">
              <span>Open {telemetry.simName} Twin</span>
              <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">• Full 64-Bit Physics</span>
            </span>
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Interactive Controls Bar: 1-Click Fault Injections */}
      <div className="pt-3 border-t border-[#1c2942] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="text-slate-400 text-[11px] mr-1 hidden lg:inline">Inject Physics:</span>
          
          <button
            onClick={() => setMode('nominal')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
              mode === 'nominal'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'bg-[#0e1626] text-slate-300 hover:text-white border border-[#1e2a40]'
            }`}
          >
            ⚡ Normal
          </button>

          <button
            onClick={() => setMode('surge')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
              mode === 'surge'
                ? 'bg-rose-500 text-white font-bold shadow'
                : 'bg-[#0e1626] text-rose-300 hover:text-white border border-[#1e2a40]'
            }`}
          >
            💥 Surge Trip
          </button>

          <button
            onClick={() => setMode('whirl')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
              mode === 'whirl'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'bg-[#0e1626] text-amber-300 hover:text-white border border-[#1e2a40]'
            }`}
          >
            🌀 0.43X Whirl
          </button>

          <button
            onClick={() => setMode('cavitation')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
              mode === 'cavitation'
                ? 'bg-sky-500 text-slate-950 font-bold shadow'
                : 'bg-[#0e1626] text-sky-300 hover:text-white border border-[#1e2a40]'
            }`}
          >
            🌊 Cavitation
          </button>

          <button
            onClick={() => setMode('unbalance')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
              mode === 'unbalance'
                ? 'bg-purple-500 text-white font-bold shadow'
                : 'bg-[#0e1626] text-purple-300 hover:text-white border border-[#1e2a40]'
            }`}
          >
            🎯 1X Unbalance
          </button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1 font-mono text-[11px] self-end sm:self-auto text-slate-400">
          <span className="mr-1">Speed:</span>
          <button
            onClick={() => setSpeedPreset('nominal')}
            className={`px-2 py-0.5 rounded transition-colors ${speedPreset === 'nominal' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold' : 'hover:text-white'}`}
          >
            6.2k
          </button>
          <button
            onClick={() => setSpeedPreset('high')}
            className={`px-2 py-0.5 rounded transition-colors ${speedPreset === 'high' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold' : 'hover:text-white'}`}
          >
            9.8k
          </button>
          <button
            onClick={() => setSpeedPreset('trip')}
            className={`px-2 py-0.5 rounded transition-colors ${speedPreset === 'trip' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold' : 'hover:text-white'}`}
          >
            11.4k
          </button>
        </div>
      </div>
    </div>
  );
};
