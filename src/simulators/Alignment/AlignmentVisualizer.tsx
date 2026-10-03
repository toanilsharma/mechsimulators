import React, { useState, useEffect, useRef } from 'react';
import { AlignmentInputs, AlignmentOutputs } from '../../types/alignment';
import { UnitSystem } from '../../types/common';
import { RotateCw, Maximize2, AlertTriangle, CheckCircle2, ShieldAlert, Thermometer, Layers, Compass, Play, Pause, Square, RotateCcw } from 'lucide-react';

interface AlignmentVisualizerProps {
  inputs: AlignmentInputs;
  outputs: AlignmentOutputs;
  isRunning?: boolean;
  unitSystem: UnitSystem;
}

export const AlignmentVisualizer: React.FC<AlignmentVisualizerProps> = ({
  inputs,
  outputs,
  isRunning = true,
  unitSystem,
}) => {
  const [viewMode, setViewMode] = useState<'elevation' | 'plan' | 'metrology' | 'skid'>('elevation');
  const [isPlaying, setIsPlaying] = useState<boolean>(isRunning);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setIsPlaying(isRunning);
  }, [isRunning]);

  // Animate shaft rotation smoothly based on motor RPM
  useEffect(() => {
    let lastTime = performance.now();
    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      if (isPlaying) {
        // Rotation visual speed scaled appropriately
        const speedDegPerSec = (inputs.motorRpm / 60) * 180;
        setRotationAngle((prev) => (prev + speedDegPerSec * dt) % 360);
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [inputs.motorRpm, isPlaying]);

  const svgWidth = 840;
  const svgHeight = 440;

  // Visual magnification scale for sub-millimeter offsets
  const visScale = 90; // 1 mm offset = 90 SVG pixels

  // Motor and pump baseline positions
  const baseCenterY = 240;
  const motorCenterX = 220;
  const pumpCenterX = 640;
  const couplingCenterX = 430;

  // Visual vertical offsets
  const motorVertOffsetPx = -outputs.hotRunningVerticalOffsetMm * visScale;
  const motorTiltAngleDeg = -(outputs.hotRunningVerticalAngleMrad * (180 / Math.PI)) * 0.4;

  const isSafe = outputs.status.level === 'safe';
  const isCritical = outputs.status.level === 'critical';

  return (
    <div className="relative w-full h-full bg-[#080b0f] flex flex-col select-none overflow-hidden font-mono">
      {/* 1. Header Toolbar with Simulation Controls, View Mode Toggles & Telemetry */}
      <div className="h-10 bg-[#0d1117] border-b border-[#30363d] px-3 flex items-center justify-between text-xs shrink-0 z-10 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {/* Simulation Controls */}
          <div className="flex items-center gap-1 bg-[#161b22] p-0.5 rounded border border-[#30363d]">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-emerald-950/80 border border-emerald-600/80 text-emerald-400 hover:bg-emerald-900/80'
                  : 'bg-amber-950/80 border border-amber-600/80 text-amber-400 animate-pulse hover:bg-amber-900/80'
              }`}
            >
              {isPlaying ? <Pause size={10} /> : <Play size={10} />}
              <span>{isPlaying ? 'PAUSE' : 'START'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying(false)}
              className="p-1 rounded text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Stop rotation"
            >
              <Square size={10} />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPlaying(true);
                setRotationAngle(0);
              }}
              className="p-1 rounded text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              title="Reset rotation"
            >
              <RotateCcw size={10} />
            </button>
          </div>

          <span className="text-[#8b949e] font-bold text-[11px] uppercase tracking-wider hidden sm:inline">VIEW:</span>
          <div className="flex items-center gap-1 bg-[#161b22] p-0.5 rounded border border-[#30363d]">
            <button
              onClick={() => setViewMode('elevation')}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all flex items-center gap-1 ${
                viewMode === 'elevation'
                  ? 'bg-[#f27d26] text-black font-bold'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              Shaft Elevation
            </button>
            <button
              onClick={() => setViewMode('plan')}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all flex items-center gap-1 ${
                viewMode === 'plan'
                  ? 'bg-[#f27d26] text-black font-bold'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              Plan View (Top)
            </button>
            <button
              onClick={() => setViewMode('metrology')}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all flex items-center gap-1 ${
                viewMode === 'metrology'
                  ? 'bg-[#f27d26] text-black font-bold'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              Laser / Dial Dial
            </button>
            <button
              onClick={() => setViewMode('skid')}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all flex items-center gap-1 ${
                viewMode === 'skid'
                  ? 'bg-[#f27d26] text-black font-bold'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              Skid Train Twin
            </button>
          </div>
        </div>

        {/* Live Alignment Status Badge */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#8b949e]">HOT RUNNING:</span>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
              isCritical
                ? 'bg-rose-950/80 text-rose-400 border-rose-600/50'
                : outputs.toleranceUtilizationPercent > 100
                ? 'bg-amber-950/80 text-amber-400 border-amber-600/50'
                : 'bg-emerald-950/80 text-emerald-400 border-emerald-600/50'
            }`}
          >
            {outputs.hotResultantOffsetMm.toFixed(3)} mm (
            {outputs.toleranceUtilizationPercent.toFixed(0)}% API 686)
          </span>
        </div>
      </div>

      {/* 2. Main High-Precision SVG Canvas */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center p-2 overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full max-h-full max-w-full drop-shadow-md"
        >
          <defs>
            {/* Baseplate Gradients */}
            <linearGradient id="baseplateGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#21262d" />
              <stop offset="100%" stopColor="#0d1117" />
            </linearGradient>

            {/* Motor Stator Gradient */}
            <linearGradient id="motorGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1f6feb" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0b2b6b" stopOpacity="0.95" />
            </linearGradient>

            {/* Pump Casing Gradient */}
            <linearGradient id="pumpGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#238636" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0f4419" stopOpacity="0.95" />
            </linearGradient>

            {/* Hot Thermal Glow */}
            <radialGradient id="thermalGlow">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
            </radialGradient>

            {/* Laser Beam Glow */}
            <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid Background */}
          <pattern id="alignGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#21262d" strokeWidth="0.5" strokeOpacity="0.4" />
          </pattern>
          <rect width={svgWidth} height={svgHeight} fill="url(#alignGrid)" />

          {/* ========================================================= */}
          {/* VIEW 1: SHAFT ELEVATION (SIDE PROFILE WITH MAGNIFIED MISALIGNMENT) */}
          {/* ========================================================= */}
          {viewMode === 'elevation' && (
            <g id="view-elevation">
              {/* Common Baseplate Skid */}
              <rect x="50" y="340" width="740" height="45" rx="3" fill="url(#baseplateGrad)" stroke="#30363d" strokeWidth="2" />
              <line x1="50" y1="348" x2="790" y2="348" stroke="#484f58" strokeWidth="1" strokeDasharray="6 4" />
              <text x="70" y="368" fill="#8b949e" fontSize="11" fontWeight="bold">API 686 RIGID STRUCTURAL STEEL BASEPLATE</text>

              {/* Baseplate Anchor Bolts */}
              {[90, 210, 330, 430, 560, 690, 760].map((bx, i) => (
                <g key={`anchor-${i}`} transform={`translate(${bx}, 385)`}>
                  <rect x="-4" y="0" width="8" height="15" fill="#484f58" />
                  <circle cx="0" cy="0" r="6" fill="#8b949e" stroke="#161b22" strokeWidth="1.5" />
                </g>
              ))}

              {/* ----------------- DRIVEN MACHINE: PUMP (RIGHT) ----------------- */}
              <g id="pump-assembly">
                {/* Pump Pedestal Support Feet */}
                <rect x="540" y="280" width="50" height="60" fill="#161b22" stroke="#30363d" strokeWidth="1.5" />
                <rect x="680" y="280" width="50" height="60" fill="#161b22" stroke="#30363d" strokeWidth="1.5" />

                {/* Pump Bearing Bracket Housing */}
                <rect x="510" y="195" width="130" height="90" rx="4" fill="url(#pumpGrad)" stroke="#2ea043" strokeWidth="1.5" />
                {/* Impeller Volute Casing */}
                <circle cx="690" cy="240" r="65" fill="#1b4d26" stroke="#2ea043" strokeWidth="2" />
                {/* Suction Nozzle */}
                <rect x="740" y="222" width="36" height="36" fill="#161b22" stroke="#2ea043" strokeWidth="1.5" />
                {/* Discharge Nozzle Top */}
                <rect x="672" y="145" width="36" height="36" fill="#161b22" stroke="#2ea043" strokeWidth="1.5" />

                {/* Hot Fluid Glow inside Pump */}
                <circle cx="690" cy="240" r="45" fill="url(#thermalGlow)" opacity={Math.min(1, inputs.pumpFluidTempC / 180)} />

                <text x="690" y="236" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">PUMP</text>
                <text x="690" y="250" fill="#a7f3d0" fontSize="9.5" textAnchor="middle">{inputs.pumpFluidTempC}°C Process</text>

                {/* Pump Shaft Stiff Extension */}
                <rect x="470" y={baseCenterY - 14} width="50" height="28" fill="#8b949e" stroke="#30363d" strokeWidth="1" />
                {/* Pump Coupling Hub */}
                <rect x="452" y={baseCenterY - 36} width="22" height="72" rx="2" fill="#c9d1d9" stroke="#30363d" strokeWidth="1.5" />

                {/* Pump Thermal Growth Indicator (Upward Arrow) */}
                <g transform="translate(640, 150)">
                  <line x1="0" y1="35" x2="0" y2="10" stroke="#f43f5e" strokeWidth="2.5" markerEnd="url(#arrowRed)" />
                  <polygon points="0,0 -5,12 5,12" fill="#f43f5e" />
                  <text x="8" y="16" fill="#f43f5e" fontSize="9.5" fontWeight="bold">
                    +ΔY_P: {outputs.pumpThermalGrowthMm.toFixed(3)} mm
                  </text>
                </g>
              </g>

              {/* ----------------- DRIVER MACHINE: MOTOR (LEFT) ----------------- */}
              <g
                id="motor-assembly"
                transform={`translate(0, ${motorVertOffsetPx}) rotate(${motorTiltAngleDeg}, ${motorCenterX + 100}, ${baseCenterY})`}
              >
                {/* Motor Stator Body */}
                <rect x="90" y="160" width="260" height="150" rx="8" fill="url(#motorGrad)" stroke="#388bfd" strokeWidth="2" />

                {/* Stator Cooling Fins */}
                {[120, 145, 170, 195, 220, 245, 270, 295, 320].map((fx) => (
                  <line key={`fin-${fx}`} x1={fx} y1="155" x2={fx} y2="160" stroke="#388bfd" strokeWidth="2.5" />
                ))}

                {/* Terminal Junction Box */}
                <rect x="180" y="130" width="60" height="30" rx="3" fill="#161b22" stroke="#388bfd" strokeWidth="1.5" />
                <text x="210" y="150" fill="#58a6ff" fontSize="9" fontWeight="bold" textAnchor="middle">4160V</text>

                {/* Motor Drive-End & Non-Drive-End Bearing Housings */}
                <rect x="80" y="215" width="20" height="50" rx="2" fill="#161b22" stroke="#30363d" strokeWidth="1" />
                <rect x="340" y="215" width="20" height="50" rx="2" fill="#161b22" stroke="#30363d" strokeWidth="1" />

                {/* Motor Front & Rear Support Feet */}
                <rect x="120" y="300" width="45" height="40" fill="#161b22" stroke="#30363d" strokeWidth="1.5" />
                <rect x="270" y="300" width="45" height="40" fill="#161b22" stroke="#30363d" strokeWidth="1.5" />

                <text x="210" y="235" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">ELECTRIC MOTOR</text>
                <text x="210" y="252" fill="#93c5fd" fontSize="10" textAnchor="middle">{inputs.motorRpm} RPM | {inputs.motorOperatingTempC}°C</text>

                {/* Motor Shaft Extension */}
                <rect x="350" y={baseCenterY - 14} width="55" height="28" fill="#8b949e" stroke="#30363d" strokeWidth="1" />
                {/* Motor Coupling Hub */}
                <rect x="390" y={baseCenterY - 36} width="22" height="72" rx="2" fill="#c9d1d9" stroke="#30363d" strokeWidth="1.5" />

                {/* Motor Thermal Elevation */}
                <g transform="translate(180, 105)">
                  <polygon points="0,0 -5,10 5,10" fill="#38bdf8" />
                  <text x="8" y="10" fill="#38bdf8" fontSize="9.5" fontWeight="bold">
                    +ΔY_M: {outputs.motorThermalGrowthMm.toFixed(3)} mm
                  </text>
                </g>
              </g>

              {/* ----------------- SHIM ADJUSTMENT CALLOUTS AT MOTOR FEET ----------------- */}
              {/* Rear Foot Shim Pack */}
              <g transform="translate(142, 350)">
                <rect x="-35" y="0" width="70" height="20" rx="3" fill="#0d1117" stroke={Math.abs(outputs.rearFootShimAdjustmentMm) > 0.15 ? '#f43f5e' : '#34d399'} strokeWidth="1.5" />
                <text x="0" y="14" fill={Math.abs(outputs.rearFootShimAdjustmentMm) > 0.15 ? '#f43f5e' : '#34d399'} fontSize="10" fontWeight="bold" textAnchor="middle">
                  {outputs.rearFootShimAdjustmentMm >= 0 ? '+' : ''}{outputs.rearFootShimAdjustmentMm.toFixed(2)} mm
                </text>
                <text x="0" y="32" fill="#8b949e" fontSize="8" textAnchor="middle">REAR FEET SHIMS</text>
              </g>

              {/* Front Foot Shim Pack */}
              <g transform="translate(292, 350)">
                <rect x="-35" y="0" width="70" height="20" rx="3" fill="#0d1117" stroke={Math.abs(outputs.frontFootShimAdjustmentMm) > 0.15 ? '#f43f5e' : '#34d399'} strokeWidth="1.5" />
                <text x="0" y="14" fill={Math.abs(outputs.frontFootShimAdjustmentMm) > 0.15 ? '#f43f5e' : '#34d399'} fontSize="10" fontWeight="bold" textAnchor="middle">
                  {outputs.frontFootShimAdjustmentMm >= 0 ? '+' : ''}{outputs.frontFootShimAdjustmentMm.toFixed(2)} mm
                </text>
                <text x="0" y="32" fill="#8b949e" fontSize="8" textAnchor="middle">FRONT FEET SHIMS</text>
              </g>

              {/* ----------------- FLEXIBLE COUPLING SPACER (CENTER) ----------------- */}
              <g id="coupling-spacer">
                {/* Spacer Spool Body between Motor and Pump Hubs */}
                <rect
                  x="414"
                  y={baseCenterY - 18 + motorVertOffsetPx / 2}
                  width="36"
                  height="36"
                  fill="#484f58"
                  stroke="#6e7681"
                  strokeWidth="1.5"
                  rx="1"
                />

                {/* Disc Packs (Thin flexible metallic membrane stacks) */}
                <line x1="413" y1={baseCenterY - 32} x2="413" y2={baseCenterY + 32} stroke="#f27d26" strokeWidth="4" />
                <line x1="451" y1={baseCenterY - 32} x2="451" y2={baseCenterY + 32} stroke="#f27d26" strokeWidth="4" />

                {/* Rotating flexure ripple indicators */}
                <circle
                  cx="432"
                  cy={baseCenterY + motorVertOffsetPx / 2}
                  r="8"
                  fill="none"
                  stroke="#f27d26"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                  transform={`rotate(${rotationAngle}, 432, ${baseCenterY + motorVertOffsetPx / 2})`}
                />

                {/* Coupling Reaction Force vectors */}
                {outputs.transmittedRadialShearN > 300 && (
                  <g transform={`translate(432, ${baseCenterY - 50})`}>
                    <line x1="0" y1="0" x2="0" y2="18" stroke="#f43f5e" strokeWidth="2.5" />
                    <polygon points="0,20 -4,12 4,12" fill="#f43f5e" />
                    <text x="0" y="-6" fill="#f43f5e" fontSize="9" fontWeight="bold" textAnchor="middle">
                      F_shear: {outputs.transmittedRadialShearN.toFixed(0)} N
                    </text>
                  </g>
                )}
              </g>

              {/* ----------------- DUAL LASER METROLOGY SYSTEM ----------------- */}
              <g id="laser-sensors">
                {/* Laser Head Transmitter on Motor Hub */}
                <rect x="382" y={baseCenterY - 75 + motorVertOffsetPx} width="22" height="32" rx="2" fill="#161b22" stroke="#f43f5e" strokeWidth="1.5" />
                <circle cx="393" cy={baseCenterY - 59 + motorVertOffsetPx} r="4" fill="#f43f5e" />

                {/* Laser Receiver Detector on Pump Hub */}
                <rect x="460" y={baseCenterY - 75} width="22" height="32" rx="2" fill="#161b22" stroke="#38bdf8" strokeWidth="1.5" />
                <circle cx="471" cy={baseCenterY - 59} r="4" fill="#38bdf8" />

                {/* Animated Glowing Laser Beam */}
                <line
                  x1="395"
                  y1={baseCenterY - 59 + motorVertOffsetPx}
                  x2="469"
                  y2={baseCenterY - 59}
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  filter="url(#laserGlow)"
                />
              </g>

              {/* ----------------- SHAFT CENTERLINE TRACES ----------------- */}
              {/* Driven Pump Shaft Datum Centerline (Cyan Extended Baseline) */}
              <line x1="120" y1={baseCenterY} x2="750" y2={baseCenterY} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6 3" strokeOpacity="0.7" />
              <text x="755" y={baseCenterY + 4} fill="#38bdf8" fontSize="9" fontWeight="bold">DATUM 0.0</text>

              {/* Motor Actual Running Centerline (Yellow Dashed with Tilt) */}
              <line
                x1="80"
                y1={baseCenterY + motorVertOffsetPx - (outputs.hotRunningVerticalAngleMrad * 200)}
                x2="440"
                y2={baseCenterY + motorVertOffsetPx + (outputs.hotRunningVerticalAngleMrad * 100)}
                stroke="#fbbf24"
                strokeWidth="2"
                strokeDasharray="4 2"
              />

              {/* Measured Misalignment Callout Box */}
              <g transform="translate(430, 75)">
                <rect x="-110" y="0" width="220" height="42" rx="4" fill="#0d1117" stroke="#30363d" strokeWidth="1.5" />
                <text x="0" y="16" fill="#ffffff" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                  HOT RUNNING MISALIGNMENT
                </text>
                <text
                  x="0"
                  y="32"
                  fill={isCritical ? '#f43f5e' : outputs.toleranceUtilizationPercent > 100 ? '#fbbf24' : '#34d399'}
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  ΔY: {outputs.hotRunningVerticalOffsetMm.toFixed(3)} mm | θ: {outputs.hotRunningVerticalAngleMrad.toFixed(2)} mrad
                </text>
              </g>
            </g>
          )}

          {/* ========================================================= */}
          {/* VIEW 2: PLAN (TOP HORIZONTAL VIEW) */}
          {/* ========================================================= */}
          {viewMode === 'plan' && (
            <g id="view-plan">
              {/* Top View Baseplate */}
              <rect x="70" y="60" width="700" height="320" rx="4" fill="#161b22" stroke="#30363d" strokeWidth="2" />
              <line x1="70" y1="220" x2="770" y2="220" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6 3" strokeOpacity="0.5" />

              {/* Motor Body Top View */}
              <rect x="120" y="120" width="240" height="200" rx="6" fill="#1f6feb" stroke="#388bfd" strokeWidth="2" />
              <text x="240" y="225" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">MOTOR TOP PROFILE</text>

              {/* Pump Body Top View */}
              <rect x="520" y="135" width="200" height="170" rx="6" fill="#238636" stroke="#2ea043" strokeWidth="2" />
              <text x="620" y="225" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">PUMP CASING</text>

              {/* Coupling Top Spacer */}
              <rect x="410" y="200" width="45" height="40" fill="#484f58" stroke="#f27d26" strokeWidth="2" />

              {/* Horizontal Jackbolts at Motor 4 Corners */}
              <g transform="translate(150, 95)">
                <line x1="0" y1="0" x2="0" y2="20" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arrow)" />
                <text x="0" y="-6" fill="#fbbf24" fontSize="9.5" textAnchor="middle" fontWeight="bold">
                  Rear: {outputs.rearFootHorizontalMoveMm >= 0 ? '→' : '←'} {Math.abs(outputs.rearFootHorizontalMoveMm).toFixed(2)} mm
                </text>
              </g>
              <g transform="translate(310, 95)">
                <line x1="0" y1="0" x2="0" y2="20" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arrow)" />
                <text x="0" y="-6" fill="#fbbf24" fontSize="9.5" textAnchor="middle" fontWeight="bold">
                  Front: {outputs.frontFootHorizontalMoveMm >= 0 ? '→' : '←'} {Math.abs(outputs.frontFootHorizontalMoveMm).toFixed(2)} mm
                </text>
              </g>

              {/* Horizontal Misalignment Label */}
              <g transform="translate(432, 280)">
                <rect x="-90" y="0" width="180" height="40" rx="3" fill="#0d1117" stroke="#30363d" strokeWidth="1" />
                <text x="0" y="16" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">HORIZ OFFSET</text>
                <text x="0" y="30" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">
                  ΔX: {outputs.hotRunningHorizontalOffsetMm.toFixed(3)} mm
                </text>
              </g>
            </g>
          )}

          {/* ========================================================= */}
          {/* VIEW 3: REVERSE DIAL / LASER METROLOGY CLOCK FACES */}
          {/* ========================================================= */}
          {viewMode === 'metrology' && (
            <g id="view-metrology">
              {/* Dial Face 1: Motor Side TIR */}
              <g transform="translate(250, 220)">
                <circle cx="0" cy="0" r="110" fill="#161b22" stroke="#388bfd" strokeWidth="3" />
                <circle cx="0" cy="0" r="95" fill="#0d1117" stroke="#30363d" strokeWidth="1" />
                <text x="0" y="-120" fill="#58a6ff" fontSize="12" fontWeight="bold" textAnchor="middle">DRIVER (MOTOR) DIAL CLOCK</text>

                {/* Clock Ticks 0, 90, 180, 270 */}
                <text x="0" y="-75" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">12:00 (0.00)</text>
                <text x="75" y="4" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">3:00</text>
                <text x="0" y="85" fill="#f43f5e" fontSize="12" fontWeight="bold" textAnchor="middle">
                  6:00 ({(outputs.hotRunningVerticalOffsetMm * 2).toFixed(2)})
                </text>
                <text x="-75" y="4" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">9:00</text>

                {/* Dial Pointer Needle */}
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="70"
                  stroke="#f43f5e"
                  strokeWidth="3"
                  strokeLinecap="round"
                  transform={`rotate(${outputs.hotRunningVerticalOffsetMm * 180}, 0, 0)`}
                />
                <circle cx="0" cy="0" r="6" fill="#f43f5e" />
              </g>

              {/* Dial Face 2: Pump Side TIR */}
              <g transform="translate(590, 220)">
                <circle cx="0" cy="0" r="110" fill="#161b22" stroke="#2ea043" strokeWidth="3" />
                <circle cx="0" cy="0" r="95" fill="#0d1117" stroke="#30363d" strokeWidth="1" />
                <text x="0" y="-120" fill="#2ea043" fontSize="12" fontWeight="bold" textAnchor="middle">DRIVEN (PUMP) DIAL CLOCK</text>

                <text x="0" y="-75" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">12:00 (0.00)</text>
                <text x="75" y="4" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">3:00</text>
                <text x="0" y="85" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">
                  6:00 ({(-outputs.hotRunningVerticalOffsetMm * 2).toFixed(2)})
                </text>
                <text x="-75" y="4" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">9:00</text>

                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="70"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  strokeLinecap="round"
                  transform={`rotate(${-outputs.hotRunningVerticalOffsetMm * 180}, 0, 0)`}
                />
                <circle cx="0" cy="0" r="6" fill="#38bdf8" />
              </g>
            </g>
          )}

          {/* ========================================================= */}
          {/* VIEW 4: FULL SKID DIGITAL TWIN WITH CROSS-COUPLING */}
          {/* ========================================================= */}
          {viewMode === 'skid' && (
            <g id="view-skid">
              {/* Isometric Baseplate Frame */}
              <polygon points="120,320 720,320 680,390 80,390" fill="url(#baseplateGrad)" stroke="#30363d" strokeWidth="2" />

              {/* 3D Block Motor */}
              <polygon points="150,220 310,220 350,170 190,170" fill="#1f6feb" stroke="#388bfd" strokeWidth="1.5" />
              <polygon points="150,220 310,220 310,300 150,300" fill="#1158c7" stroke="#388bfd" strokeWidth="1.5" />
              <polygon points="310,220 350,170 350,250 310,300" fill="#0b3d8f" stroke="#388bfd" strokeWidth="1.5" />

              {/* 3D Block Pump */}
              <polygon points="490,230 650,230 680,180 520,180" fill="#238636" stroke="#2ea043" strokeWidth="1.5" />
              <polygon points="490,230 650,230 650,300 490,300" fill="#1a6328" stroke="#2ea043" strokeWidth="1.5" />
              <polygon points="650,230 680,180 680,250 650,300" fill="#104219" stroke="#2ea043" strokeWidth="1.5" />

              {/* Coupling in Center */}
              <rect x="360" y="240" width="70" height="20" fill="#f27d26" stroke="#ff9b4e" strokeWidth="2" />

              {/* Suction and Discharge Flange Connections */}
              <circle cx="680" cy="240" r="18" fill="#161b22" stroke="#38bdf8" strokeWidth="2" />
              <text x="680" y="280" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">SUCTION</text>

              <circle cx="580" cy="160" r="18" fill="#161b22" stroke="#f43f5e" strokeWidth="2" />
              <text x="580" y="140" fill="#f43f5e" fontSize="10" fontWeight="bold" textAnchor="middle">DISCHARGE</text>

              {/* Telemetry HUD */}
              <g transform="translate(180, 50)">
                <rect x="0" y="0" width="480" height="60" rx="4" fill="#0d1117" stroke="#30363d" strokeWidth="1.5" />
                <text x="240" y="22" fill="#f27d26" fontSize="11" fontWeight="bold" textAnchor="middle">
                  COUPLED SKID MULTI-PHYSICS TRAIN TELEMETRY
                </text>
                <text x="240" y="42" fill="#c9d1d9" fontSize="10" textAnchor="middle">
                  Rotor RPM: {inputs.motorRpm} | Fluid T: {inputs.pumpFluidTempC}°C | Transmitted Shear: {outputs.transmittedRadialShearN.toFixed(0)} N | ISO Zone: {outputs.iso10816Zone}
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
