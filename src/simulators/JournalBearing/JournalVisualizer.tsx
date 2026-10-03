import React, { useState, useEffect, useRef } from 'react';
import { JournalBearingInputs, JournalBearingOutputs } from '../../types/journalBearing';
import { UnitSystem } from '../../types/common';
import { Layers, Activity, Eye, Compass, AlertTriangle, ShieldCheck, Play, Pause, Square, RotateCcw } from 'lucide-react';

interface JournalVisualizerProps {
  inputs: JournalBearingInputs;
  outputs: JournalBearingOutputs;
  isRunning?: boolean;
  unitSystem?: UnitSystem;
}

export const JournalVisualizer: React.FC<JournalVisualizerProps> = ({
  inputs,
  outputs,
  isRunning: parentIsRunning = true,
}) => {
  const [viewMode, setViewMode] = useState<'orbit' | 'film_wedge' | 'schematic'>('orbit');
  const [isPlaying, setIsPlaying] = useState<boolean>(parentIsRunning);
  const [shaftAngleDeg, setShaftAngleDeg] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setIsPlaying(parentIsRunning);
  }, [parentIsRunning]);

  useEffect(() => {
    let lastTime = performance.now();
    const animate = (time: number) => {
      const dt = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;

      if (isPlaying && inputs.shaftSpeedRpm > 0) {
        // Scaled visual speed for hydrodynamic rotation
        const visualRps = (inputs.shaftSpeedRpm / 60) * 0.12;
        setShaftAngleDeg((prev) => (prev + visualRps * 360 * dt) % 360);
        setElapsedTime((prev) => prev + dt);
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, inputs.shaftSpeedRpm]);

  const {
    bearingType,
    journalDiameterMm,
    radialClearanceUm,
    shaftSpeedRpm,
    staticRadialLoadKn,
  } = inputs;

  const {
    sommerfeldNumber,
    eccentricityRatio,
    attitudeAngleDeg,
    minimumFilmThicknessUm,
    journalCenterOffsetUm,
    totalShaftDisplacementUmPkPk,
    api670AlarmLimitUmPkPk,
    instabilityMode,
    orbitPoints,
    dynamicCoefficients,
  } = outputs;

  // Visual scaling
  const centerSvgX = 220;
  const centerSvgY = 220;
  const bearingVisualRadius = 140; // SVG pixels for bearing bore
  // Scale radial clearance for clear visual inspection
  const clearanceVisualPx = 28;
  const journalVisualRadius = bearingVisualRadius - clearanceVisualPx;

  // Offset journal center by eccentricity & attitude angle
  // Offset scaled: clearanceVisualPx corresponds to radialClearanceUm
  const visualOffsetX = (journalCenterOffsetUm.x / Math.max(1, radialClearanceUm)) * clearanceVisualPx;
  const visualOffsetY = (-journalCenterOffsetUm.y / Math.max(1, radialClearanceUm)) * clearanceVisualPx; // in SVG down is positive

  const journalCenterX = centerSvgX + visualOffsetX;
  const journalCenterY = centerSvgY + visualOffsetY;

  // Map orbit points to SVG coordinates
  const svgOrbitPath = orbitPoints
    .map((pt, idx) => {
      const sx = centerSvgX + (pt.xUm / radialClearanceUm) * clearanceVisualPx;
      const sy = centerSvgY - (pt.yUm / radialClearanceUm) * clearanceVisualPx;
      return `${idx === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
    })
    .join(' ');

  // Tilting Pad Geometry Generator (4 or 5 pads)
  const numPads = bearingType.includes('5pad') ? 5 : bearingType.includes('4pad') ? 4 : 0;
  const pads = [];
  if (numPads > 0) {
    const padSpanDeg = 360 / numPads - 12; // gap between pads
    for (let i = 0; i < numPads; i++) {
      const startAngle = (i * 360) / numPads + 6;
      const endAngle = startAngle + padSpanDeg;
      const pivotAngle = (startAngle + endAngle) / 2;
      pads.push({ id: i, startAngle, endAngle, pivotAngle });
    }
  }

  // Color mapping based on instability
  const isWhip = instabilityMode === 'oil_whip';
  const isWhirl = instabilityMode === 'oil_whirl';
  const isRub = instabilityMode === 'boundary_rub';

  const statusBorderColor = isWhip
    ? 'border-red-500/60 bg-red-950/20'
    : isWhirl
    ? 'border-amber-500/60 bg-amber-950/20'
    : isRub
    ? 'border-rose-500/60 bg-rose-950/20'
    : 'border-emerald-500/60 bg-emerald-950/20';

  const statusTextColor = isWhip
    ? 'text-red-400'
    : isWhirl
    ? 'text-amber-400'
    : isRub
    ? 'text-rose-400'
    : 'text-emerald-400';

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0f17] rounded-lg border border-[#1e293b] overflow-hidden select-none">
      {/* Visual Header Toolbar */}
      <div className="px-4 py-2 bg-[#0f172a] border-b border-[#1e293b] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {/* Simulation Controls */}
          <div className="flex items-center gap-1 bg-[#090d16] p-0.5 rounded border border-slate-700/60">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-emerald-950/80 border border-emerald-600/80 text-emerald-400'
                  : 'bg-amber-950/80 border border-amber-600/80 text-amber-400 animate-pulse'
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
                setShaftAngleDeg(0);
              }}
              className="p-1 rounded text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              title="Reset rotation"
            >
              <RotateCcw size={10} />
            </button>
          </div>

          <Compass className="w-4 h-4 text-cyan-400 hidden sm:inline" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            Hydrodynamic Twin
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${statusBorderColor} ${statusTextColor}`}>
            {instabilityMode.toUpperCase().replace('_', ' ')}
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#1e293b] p-0.5 rounded border border-slate-700/60">
          <button
            onClick={() => setViewMode('orbit')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
              viewMode === 'orbit'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dual-Probe Orbit
          </button>
          <button
            onClick={() => setViewMode('film_wedge')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
              viewMode === 'film_wedge'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pressure Wedge
          </button>
          <button
            onClick={() => setViewMode('schematic')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
              viewMode === 'schematic'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dynamic Matrix
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-4 gap-6 relative overflow-hidden">
        {/* Stage Graphic */}
        <div className="relative w-[340px] sm:w-[440px] h-[340px] sm:h-[440px] flex items-center justify-center shrink-0">
          <svg viewBox="0 0 440 440" className="w-full h-full drop-shadow-2xl">
            <defs>
              {/* Radial gradient for hydrodynamic pressure wedge */}
              <radialGradient id="hydroWedgeGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.9" />
              </radialGradient>

              {/* Metal shaft gradient */}
              <linearGradient id="shaftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="50%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>

              {/* Bearing Babbitt lining */}
              <linearGradient id="babbittGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>

            {/* 1. Outer Bearing Housing */}
            <circle
              cx={centerSvgX}
              cy={centerSvgY}
              r={bearingVisualRadius + 30}
              fill="none"
              stroke="#334155"
              strokeWidth="20"
              strokeDasharray="4 2"
              className="opacity-40"
            />

            {/* 2. Bearing Bore / Babbitt Ring */}
            <circle
              cx={centerSvgX}
              cy={centerSvgY}
              r={bearingVisualRadius}
              fill="#0f172a"
              stroke="#64748b"
              strokeWidth="4"
            />

            {/* Tilting Pads (if selected) */}
            {numPads > 0 &&
              pads.map((pad) => {
                const radStart = (pad.startAngle * Math.PI) / 180;
                const radEnd = (pad.endAngle * Math.PI) / 180;
                const rOut = bearingVisualRadius;
                const rIn = bearingVisualRadius - 10;
                const x1 = centerSvgX + rIn * Math.cos(radStart);
                const y1 = centerSvgY + rIn * Math.sin(radStart);
                const x2 = centerSvgX + rOut * Math.cos(radStart);
                const y2 = centerSvgY + rOut * Math.sin(radStart);
                const x3 = centerSvgX + rOut * Math.cos(radEnd);
                const y3 = centerSvgY + rOut * Math.sin(radEnd);
                const x4 = centerSvgX + rIn * Math.cos(radEnd);
                const y4 = centerSvgY + rIn * Math.sin(radEnd);

                const pivotRad = (pad.pivotAngle * Math.PI) / 180;
                const px = centerSvgX + (rOut + 2) * Math.cos(pivotRad);
                const py = centerSvgY + (rOut + 2) * Math.sin(pivotRad);

                return (
                  <g key={pad.id}>
                    <path
                      d={`M ${x1} ${y1} L ${x2} ${y2} A ${rOut} ${rOut} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${rIn} ${rIn} 0 0 0 ${x1} ${y1} Z`}
                      fill="#1e293b"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />
                    {/* Pivot pin */}
                    <circle cx={px} cy={py} r="3" fill="#f59e0b" />
                  </g>
                );
              })}

            {/* Pressure Dam Step Pocket (if pressure dam bearing) */}
            {bearingType === 'pressure_dam' && (
              <path
                d={`M ${centerSvgX + (bearingVisualRadius - 8) * Math.cos((40 * Math.PI) / 180)} ${
                  centerSvgY + (bearingVisualRadius - 8) * Math.sin((40 * Math.PI) / 180)
                } A ${bearingVisualRadius - 8} ${bearingVisualRadius - 8} 0 0 1 ${
                  centerSvgX + (bearingVisualRadius - 8) * Math.cos((160 * Math.PI) / 180)
                } ${centerSvgY + (bearingVisualRadius - 8) * Math.sin((160 * Math.PI) / 180)}`}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="6"
                strokeDasharray="4 2"
              />
            )}

            {/* 3. Clearance Circle Envelope (API 670 Reference) */}
            <circle
              cx={centerSvgX}
              cy={centerSvgY}
              r={clearanceVisualPx}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1"
              strokeDasharray="2 2"
              className="opacity-70"
            />
            {/* Center crosshairs */}
            <line
              x1={centerSvgX - clearanceVisualPx - 10}
              y1={centerSvgY}
              x2={centerSvgX + clearanceVisualPx + 10}
              y2={centerSvgY}
              stroke="#475569"
              strokeWidth="0.8"
            />
            <line
              x1={centerSvgX}
              y1={centerSvgY - clearanceVisualPx - 10}
              x2={centerSvgX}
              y2={centerSvgY + clearanceVisualPx + 10}
              stroke="#475569"
              strokeWidth="0.8"
            />

            {/* 4. Fluid Film Oil Wedge Shading (in Convergent Zone) */}
            {viewMode === 'film_wedge' && (
              <path
                d={`M ${centerSvgX} ${centerSvgY + bearingVisualRadius} A ${bearingVisualRadius} ${bearingVisualRadius} 0 0 0 ${
                  centerSvgX + bearingVisualRadius * Math.cos((attitudeAngleDeg * Math.PI) / 180)
                } ${centerSvgY + bearingVisualRadius * Math.sin((attitudeAngleDeg * Math.PI) / 180)}`}
                fill="none"
                stroke="url(#hydroWedgeGrad)"
                strokeWidth={clearanceVisualPx * 0.9}
                strokeLinecap="round"
                className="opacity-80"
              />
            )}

            {/* Circulating Oil Film Particles in Clearance Gap (Couette flow) */}
            {isPlaying && inputs.shaftSpeedRpm > 0 && (
              <g>
                {[0, 45, 90, 135, 180, 225, 270, 315].map((baseAngle, idx) => {
                  const pAngle = ((shaftAngleDeg * 0.5 + baseAngle) * Math.PI) / 180;
                  const rGap = bearingVisualRadius - clearanceVisualPx * 0.45;
                  const px = centerSvgX + rGap * Math.cos(pAngle);
                  const py = centerSvgY + rGap * Math.sin(pAngle);
                  return (
                    <circle
                      key={idx}
                      cx={px}
                      cy={py}
                      r="2.5"
                      fill="#38bdf8"
                      opacity="0.75"
                    />
                  );
                })}
              </g>
            )}

            {/* 5. Rotating Journal Shaft */}
            <circle
              cx={journalCenterX}
              cy={journalCenterY}
              r={journalVisualRadius}
              fill="url(#shaftGrad)"
              stroke="#e2e8f0"
              strokeWidth="2"
              className="transition-all duration-300"
            />

            {/* Rotating Keyway & Radial Crosshair Indicators on Journal Face */}
            <g transform={`rotate(${shaftAngleDeg}, ${journalCenterX}, ${journalCenterY})`}>
              {/* Shaft Keyway Slot */}
              <rect
                x={journalCenterX - 5}
                y={journalCenterY - journalVisualRadius + 4}
                width="10"
                height="18"
                fill="#0f172a"
                stroke="#64748b"
                strokeWidth="1.5"
                rx="2"
              />
              {/* Radial alignment reference lines */}
              <line
                x1={journalCenterX}
                y1={journalCenterY - journalVisualRadius + 22}
                x2={journalCenterX}
                y2={journalCenterY - 10}
                stroke="#475569"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <line
                x1={journalCenterX - journalVisualRadius + 10}
                y1={journalCenterY}
                x2={journalCenterX - 10}
                y2={journalCenterY}
                stroke="#475569"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <line
                x1={journalCenterX + 10}
                y1={journalCenterY}
                x2={journalCenterX + journalVisualRadius - 10}
                y2={journalCenterY}
                stroke="#475569"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <line
                x1={journalCenterX}
                y1={journalCenterY + 10}
                x2={journalCenterX}
                y2={journalCenterY + journalVisualRadius - 10}
                stroke="#475569"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            </g>

            {/* Shaft Center Marker */}
            <circle cx={journalCenterX} cy={journalCenterY} r="3.5" fill="#ef4444" />

            {/* Shaft Rotation Direction Arrow */}
            <path
              d={`M ${journalCenterX - 30} ${journalCenterY - 40} A 50 50 0 0 1 ${journalCenterX + 40} ${journalCenterY - 30}`}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              markerEnd="url(#arrow)"
            />
            <text
              x={journalCenterX}
              y={journalCenterY - 55}
              fill="#38bdf8"
              fontSize="11"
              fontFamily="monospace"
              textAnchor="middle"
              fontWeight="bold"
            >
              {inputs.shaftSpeedRpm} RPM ↻
            </text>

            {/* Static Radial Gravity Load Vector */}
            <line
              x1={journalCenterX}
              y1={journalCenterY}
              x2={journalCenterX}
              y2={journalCenterY + 60}
              stroke="#f43f5e"
              strokeWidth="2"
            />
            <polygon
              points={`${journalCenterX - 4},${journalCenterY + 56} ${journalCenterX + 4},${journalCenterY + 56} ${journalCenterX},${journalCenterY + 64}`}
              fill="#f43f5e"
            />
            <text
              x={journalCenterX + 8}
              y={journalCenterY + 50}
              fill="#f43f5e"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
            >
              W = {staticRadialLoadKn} kN
            </text>

            {/* 6. Dynamic Shaft Vibration Orbit (Lissajous) */}
            {(viewMode === 'orbit' || viewMode === 'film_wedge') && (
              <g>
                <path
                  d={svgOrbitPath}
                  fill="none"
                  stroke={isWhip ? '#ef4444' : isWhirl ? '#f59e0b' : '#10b981'}
                  strokeWidth="2"
                  className={isWhip ? 'animate-pulse' : ''}
                />
                {/* Keyphasor 1X Blanking Dot */}
                {orbitPoints.length > 0 && (
                  <circle
                    cx={(centerSvgX + (orbitPoints[0].xUm / radialClearanceUm) * clearanceVisualPx).toFixed(1)}
                    cy={(centerSvgY - (orbitPoints[0].yUm / radialClearanceUm) * clearanceVisualPx).toFixed(1)}
                    r="3.5"
                    fill="#38bdf8"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                )}
              </g>
            )}

            {/* 7. API 670 Proximity Probes (Orthogonal at ±45° or 90° separation) */}
            {/* Probe X (Right Probe at 45 deg) */}
            <g transform={`rotate(45 ${centerSvgX} ${centerSvgY})`}>
              <rect
                x={centerSvgX + bearingVisualRadius + 10}
                y={centerSvgY - 6}
                width="28"
                height="12"
                fill="#334155"
                stroke="#38bdf8"
                strokeWidth="1.5"
                rx="2"
              />
              <line
                x1={centerSvgX + bearingVisualRadius}
                y1={centerSvgY}
                x2={centerSvgX + bearingVisualRadius + 10}
                y2={centerSvgY}
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="2 1"
              />
              <text
                x={centerSvgX + bearingVisualRadius + 42}
                y={centerSvgY + 4}
                fill="#38bdf8"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
              >
                PROBE X
              </text>
            </g>

            {/* Probe Y (Left Probe at 135 deg) */}
            <g transform={`rotate(135 ${centerSvgX} ${centerSvgY})`}>
              <rect
                x={centerSvgX + bearingVisualRadius + 10}
                y={centerSvgY - 6}
                width="28"
                height="12"
                fill="#334155"
                stroke="#a855f7"
                strokeWidth="1.5"
                rx="2"
              />
              <line
                x1={centerSvgX + bearingVisualRadius}
                y1={centerSvgY}
                x2={centerSvgX + bearingVisualRadius + 10}
                y2={centerSvgY}
                stroke="#a855f7"
                strokeWidth="1"
                strokeDasharray="2 1"
              />
              <text
                x={centerSvgX + bearingVisualRadius + 42}
                y={centerSvgY + 4}
                fill="#a855f7"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
              >
                PROBE Y
              </text>
            </g>

            {/* Attitude Angle Indicator */}
            <line
              x1={journalCenterX}
              y1={journalCenterY}
              x2={journalCenterX + 50 * Math.sin((attitudeAngleDeg * Math.PI) / 180)}
              y2={journalCenterY - 50 * Math.cos((attitudeAngleDeg * Math.PI) / 180)}
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeDasharray="3 2"
            />
            <text
              x={journalCenterX + 25}
              y={journalCenterY - 20}
              fill="#fbbf24"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
            >
              φ = {attitudeAngleDeg}°
            </text>
          </svg>
        </div>

        {/* Dynamic Telemetry & Diagnostic Overlay */}
        <div className="w-full md:w-[260px] flex flex-col gap-2.5">
          {/* Status Box */}
          <div className={`p-3 rounded-lg border ${statusBorderColor} flex flex-col gap-1`}>
            <div className="flex items-center gap-1.5">
              {isWhip || isWhirl || isRub ? (
                <AlertTriangle className={`w-4 h-4 ${statusTextColor}`} />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              )}
              <span className={`text-xs font-mono font-bold uppercase ${statusTextColor}`}>
                {outputs.status.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              {outputs.instabilityDescription}
            </p>
          </div>

          {/* Key Kinematic Indicators */}
          <div className="bg-[#111827] p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Sommerfeld (S):</span>
              <span className="text-cyan-400 font-bold">{sommerfeldNumber}</span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Eccentricity (ε):</span>
              <span className={`font-bold ${eccentricityRatio > 0.85 ? 'text-amber-400' : 'text-slate-200'}`}>
                {eccentricityRatio} ({((1 - eccentricityRatio) * 100).toFixed(0)}% clearance left)
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Min Film (h_min):</span>
              <span className={`font-bold ${minimumFilmThicknessUm < 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {minimumFilmThicknessUm} µm
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Whirl Ratio (WFR):</span>
              <span className={`font-bold ${outputs.whirlFrequencyRatio > 0.3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {outputs.whirlFrequencyRatio.toFixed(3)} ({outputs.whirlFrequencyRatio > 0.05 ? `${(outputs.whirlFrequencyRatio * 100).toFixed(0)}%X` : 'TPJB Immune'})
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Shaft Vib (S_pp):</span>
              <span className={`font-bold ${totalShaftDisplacementUmPkPk > api670AlarmLimitUmPkPk ? 'text-rose-400' : 'text-cyan-300'}`}>
                {totalShaftDisplacementUmPkPk} µm pk-pk
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono border-t border-slate-800 pt-1.5">
              <span className="text-slate-500">API 670 Limit:</span>
              <span className="text-slate-400">{api670AlarmLimitUmPkPk} µm pk-pk</span>
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className="bg-[#0f172a]/60 p-2.5 rounded border border-slate-800/80 text-[10px] text-slate-400 leading-normal font-sans">
            <span className="text-cyan-400 font-bold font-mono">API 684 INSIGHT: </span>
            {bearingType.startsWith('tilt_pad')
              ? 'Tilting pads eliminate cross-coupled stiffness (Kxy ≈ 0), removing fluid film whirl excitation.'
              : 'Plain cylindrical sleeves have large cross-coupled stiffness Kxy > 0, driving oil whirl above onset speed.'}
          </div>
        </div>
      </div>
    </div>
  );
};
