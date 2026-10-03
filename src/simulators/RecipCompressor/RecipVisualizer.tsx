import React, { useState, useEffect, useRef } from 'react';
import { RecipCompressorInputs, RecipCompressorOutputs } from '../../types/recipCompressor';
import { UnitSystem } from '../../types/common';
import { Play, Pause, Square, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface RecipVisualizerProps {
  inputs: RecipCompressorInputs;
  outputs: RecipCompressorOutputs;
  isRunning?: boolean;
  unitSystem?: UnitSystem;
}

export const RecipVisualizer: React.FC<RecipVisualizerProps> = ({
  inputs,
  outputs,
  isRunning = true,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(isRunning);
  const [crankAngleDeg, setCrankAngleDeg] = useState<number>(45);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setIsPlaying(isRunning);
  }, [isRunning]);

  // Continuous animation loop
  useEffect(() => {
    let lastTime = performance.now();
    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (isPlaying) {
        // Speed in RPM converted to degrees per second
        const degPerSec = (inputs.crankSpeedRpm / 60) * 360 * 0.25; // 0.25x speed for smooth visual comprehension
        setCrankAngleDeg((prev) => (prev + degPerSec * dt) % 360);
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, inputs.crankSpeedRpm]);

  // Current Kinematic State
  const strokeM = inputs.strokeMm / 1000;
  const crankRadiusM = strokeM / 2;
  const connRodM = inputs.connectingRodLengthMm / 1000;
  const lambda = crankRadiusM / connRodM;
  const thetaRad = (crankAngleDeg * Math.PI) / 180;

  const cosT = Math.cos(thetaRad);
  const sinT = Math.sin(thetaRad);
  const sqrtTerm = Math.sqrt(Math.max(0, 1 - Math.pow(lambda * sinT, 2)));
  const pistonPosM = crankRadiusM * ((1 - cosT) + (1 / lambda) * (1 - sqrtTerm));
  const normalizedPistonFraction = pistonPosM / strokeM; // 0 (HE TDC) to 1 (BDC)

  // Find corresponding PV data point for current angle
  const currentAngleIndex = Math.round((crankAngleDeg / 360) * (outputs.pvCurvePoints.length - 1));
  const currentPoint = outputs.pvCurvePoints[currentAngleIndex] || outputs.pvCurvePoints[0];

  // Visual layout geometry
  const width = 800;
  const height = 480;

  // Cylinder coordinates
  const cylLeft = 110;
  const cylRight = 420;
  const cylTop = 130;
  const cylHeight = 160;
  const cylMidY = cylTop + cylHeight / 2;
  const strokePixels = 160;

  const pistonWidth = 46;
  const pistonMinX = cylLeft + 20;
  const pistonMaxX = pistonMinX + strokePixels;
  const currentPistonX = pistonMinX + normalizedPistonFraction * strokePixels;

  // Crosshead and Crankshaft coordinates
  const crossheadX = 490 + normalizedPistonFraction * 35;
  const crossheadY = cylMidY;
  const crankCenterX = 680;
  const crankCenterY = cylMidY;
  const crankPinRadius = 60;
  const crankPinX = crankCenterX + crankPinRadius * Math.cos(thetaRad + Math.PI);
  const crankPinY = crankCenterY + crankPinRadius * Math.sin(thetaRad + Math.PI);

  // Pressure color interpolation
  const maxP = Math.max(20, inputs.dischargePressureBarA);
  const heRatio = Math.min(1, Math.max(0, (currentPoint.cylinderPressureBarAHE - inputs.suctionPressureBarA) / (maxP - inputs.suctionPressureBarA)));
  const ceRatio = Math.min(1, Math.max(0, (currentPoint.cylinderPressureBarACE - inputs.suctionPressureBarA) / (maxP - inputs.suctionPressureBarA)));

  const heColor = `rgba(${Math.round(40 + heRatio * 215)}, ${Math.round(140 - heRatio * 70)}, ${Math.round(230 - heRatio * 200)}, 0.45)`;
  const ceColor = `rgba(${Math.round(40 + ceRatio * 215)}, ${Math.round(140 - ceRatio * 70)}, ${Math.round(230 - ceRatio * 200)}, 0.45)`;

  const isReversalSafe = outputs.hasAdequateRodLoadReversal;
  const isPulsationSafe = outputs.isAcousticPulsationCompliant;

  return (
    <div className="relative w-full h-full flex flex-col bg-[#070a0e] select-none overflow-hidden">
      {/* Top Engineering Overlay Bar */}
      <div className="absolute top-2 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-[#0d121a]/90 backdrop-blur border border-slate-700/80 px-3 py-1.5 rounded-lg shadow-lg">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-400">CRANK ANGLE / HE STATE</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold text-cyan-300">
                {Math.round(crankAngleDeg)}°
              </span>
              <span className="text-xs font-mono text-slate-300">
                P_HE: <strong className="text-amber-400">{currentPoint.cylinderPressureBarAHE} bar(a)</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* API 618 Reversal Chip */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-mono backdrop-blur bg-[#0d121a]/90 ${
              isReversalSafe
                ? 'border-emerald-500/60 text-emerald-300'
                : 'border-rose-500/80 text-rose-300 animate-pulse'
            }`}
          >
            {isReversalSafe ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            <span>API 618 REVERSAL: {outputs.rodLoadReversalDegrees}°</span>
          </div>

          {/* Combined Load */}
          <div className="flex flex-col px-2.5 py-1 rounded border border-slate-700 bg-[#0d121a]/90 text-xs font-mono">
            <span className="text-[9px] text-slate-400">COMBINED ROD LOAD</span>
            <span
              className={`font-bold ${
                currentPoint.combinedRodLoadKn >= 0 ? 'text-cyan-400' : 'text-amber-400'
              }`}
            >
              {currentPoint.combinedRodLoadKn > 0 ? '+' : ''}
              {currentPoint.combinedRodLoadKn} kN ({currentPoint.combinedRodLoadKn >= 0 ? 'Tension' : 'Comp'})
            </span>
          </div>
        </div>
      </div>

      {/* Main SVG Schematic */}
      <div className="flex-1 w-full h-full flex items-center justify-center p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full max-w-[960px] max-h-[580px] drop-shadow-xl"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="pistonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="rodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="50%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="bottleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="gasWedge" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* BACKGROUND GRID */}
          <g opacity="0.12" stroke="#475569" strokeWidth="0.5">
            {Array.from({ length: 16 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2={height} />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * 50} x2={width} y2={i * 50} />
            ))}
          </g>

          {/* 1. API 688 PULSATION DAMPERS (SUCTION & DISCHARGE BOTTLES) */}
          {inputs.hasPulsationBottles && (
            <g id="pulsation-bottles">
              {/* Suction Damper Bottle (Top) */}
              <rect
                x="80"
                y="24"
                width="280"
                height="44"
                rx="18"
                fill="url(#bottleGrad)"
                stroke="#0284c7"
                strokeWidth="1.5"
              />
              <text x="220" y="48" fill="#38bdf8" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                API 688 SUCTION DAMPER ({inputs.damperVolumeLiters} L)
              </text>
              {/* Suction Manifold Line to Cylinder */}
              <path d="M 160 68 L 160 115" stroke="#0284c7" strokeWidth="8" fill="none" strokeLinecap="round" />
              <path d="M 360 68 L 360 115" stroke="#0284c7" strokeWidth="8" fill="none" strokeLinecap="round" />

              {/* Discharge Damper Bottle (Bottom) */}
              <rect
                x="80"
                y="380"
                width="280"
                height="44"
                rx="18"
                fill="url(#bottleGrad)"
                stroke="#f97316"
                strokeWidth="1.5"
              />
              <text x="220" y="406" fill="#fb923c" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                API 688 DISCHARGE DAMPER ({inputs.damperVolumeLiters} L)
              </text>
              {/* Discharge Manifold Line to Cylinder */}
              <path d="M 160 380 L 160 305" stroke="#f97316" strokeWidth="8" fill="none" strokeLinecap="round" />
              <path d="M 360 380 L 360 305" stroke="#f97316" strokeWidth="8" fill="none" strokeLinecap="round" />
            </g>
          )}

          {/* 2. CYLINDER BODY & LINER */}
          {/* Cylinder Outer Frame */}
          <rect
            x={cylLeft}
            y={cylTop - 12}
            width={cylRight - cylLeft + 20}
            height={cylHeight + 24}
            fill="#0f172a"
            stroke="#334155"
            strokeWidth="3"
            rx="4"
          />

          {/* Gas Chambers Color Fill */}
          {/* Head End Chamber (Left of piston) */}
          <rect
            x={cylLeft + 8}
            y={cylTop}
            width={Math.max(4, currentPistonX - (cylLeft + 8))}
            height={cylHeight}
            fill={heColor}
            className="transition-colors duration-100"
          />
          {/* Crank End Chamber (Right of piston) */}
          <rect
            x={currentPistonX + pistonWidth}
            y={cylTop}
            width={Math.max(4, cylRight - (currentPistonX + pistonWidth))}
            height={cylHeight}
            fill={ceColor}
            className="transition-colors duration-100"
          />

          {/* Cylinder Bore Liner Wall (Top & Bottom rails) */}
          <line x1={cylLeft} y1={cylTop} x2={cylRight} y2={cylTop} stroke="#64748b" strokeWidth="4" />
          <line x1={cylLeft} y1={cylTop + cylHeight} x2={cylRight} y2={cylTop + cylHeight} stroke="#64748b" strokeWidth="4" />
          {/* Head End Cover Flange */}
          <rect x={cylLeft - 6} y={cylTop - 10} width="14" height={cylHeight + 20} fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
          {/* Crank End Packing Gland */}
          <rect x={cylRight} y={cylTop + 40} width="22" height={cylHeight - 80} fill="#334155" stroke="#64748b" strokeWidth="1.5" />

          {/* VALVES REPRESENTATION */}
          {/* HE Suction Valve (Top Left) */}
          <g transform="translate(150, 110)">
            <rect x="-12" y="0" width="24" height="12" fill="#0284c7" rx="2" />
            <polygon points="-8,4 8,4 0,10" fill="#e0f2fe" />
            <text x="0" y="-4" fill="#38bdf8" fontSize="8" fontFamily="monospace" textAnchor="middle">HE-SUCT</text>
          </g>
          {/* CE Suction Valve (Top Right) */}
          <g transform="translate(350, 110)">
            <rect x="-12" y="0" width="24" height="12" fill="#0284c7" rx="2" />
            <polygon points="-8,4 8,4 0,10" fill="#e0f2fe" />
            <text x="0" y="-4" fill="#38bdf8" fontSize="8" fontFamily="monospace" textAnchor="middle">CE-SUCT</text>
          </g>
          {/* HE Discharge Valve (Bottom Left) */}
          <g transform="translate(150, 298)">
            <rect x="-12" y="0" width="24" height="12" fill="#f97316" rx="2" />
            <polygon points="-8,8 8,8 0,2" fill="#ffedd5" />
            <text x="0" y="22" fill="#fb923c" fontSize="8" fontFamily="monospace" textAnchor="middle">HE-DISCH</text>
          </g>
          {/* CE Discharge Valve (Bottom Right) */}
          <g transform="translate(350, 298)">
            <rect x="-12" y="0" width="24" height="12" fill="#f97316" rx="2" />
            <polygon points="-8,8 8,8 0,2" fill="#ffedd5" />
            <text x="0" y="22" fill="#fb923c" fontSize="8" fontFamily="monospace" textAnchor="middle">CE-DISCH</text>
          </g>

          {/* 3. PISTON & PISTON RINGS */}
          <g id="piston" transform={`translate(${currentPistonX}, ${cylTop + 2})`}>
            {/* Piston Body */}
            <rect
              x="0"
              y="0"
              width={pistonWidth}
              height={cylHeight - 4}
              rx="3"
              fill="url(#pistonGrad)"
              stroke="#64748b"
              strokeWidth="2"
            />
            {/* Rider & Compression Ring Grooves */}
            <line x1="8" y1="0" x2="8" y2={cylHeight - 4} stroke="#1e293b" strokeWidth="2.5" />
            <line x1="16" y1="0" x2="16" y2={cylHeight - 4} stroke="#1e293b" strokeWidth="2.5" />
            <line x1={pistonWidth - 8} y1="0" x2={pistonWidth - 8} y2={cylHeight - 4} stroke="#1e293b" strokeWidth="2.5" />
          </g>

          {/* 4. PISTON ROD */}
          <rect
            x={currentPistonX + pistonWidth}
            y={cylMidY - 9}
            width={Math.max(10, crossheadX - (currentPistonX + pistonWidth))}
            height="18"
            fill="url(#rodGrad)"
            stroke="#475569"
            strokeWidth="1"
            rx="2"
          />

          {/* 5. CROSSHEAD & CROSSHEAD GUIDE */}
          {/* Guide Shoes */}
          <rect x="470" y={cylMidY - 34} width="110" height="68" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="4 2" />
          {/* Crosshead Slider Block */}
          <g id="crosshead" transform={`translate(${crossheadX - 16}, ${crossheadY - 20})`}>
            <rect x="0" y="0" width="32" height="40" rx="4" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
            <circle cx="16" cy="20" r="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
            {/* Wrist pin */}
            <circle cx="16" cy="20" r="4" fill="#38bdf8" />
          </g>

          {/* 6. CONNECTING ROD */}
          <line
            x1={crossheadX}
            y1={crossheadY}
            x2={crankPinX}
            y2={crankPinY}
            stroke="#94a3b8"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <line
            x1={crossheadX}
            y1={crossheadY}
            x2={crankPinX}
            y2={crankPinY}
            stroke="#cbd5e1"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* 7. CRANKSHAFT & FLYWHEEL ROTATION */}
          {/* Crank Pin */}
          <circle cx={crankPinX} cy={crankPinY} r="9" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />

          {/* Crank Web / Throw */}
          <line
            x1={crankCenterX}
            y1={crankCenterY}
            x2={crankPinX}
            y2={crankPinY}
            stroke="#475569"
            strokeWidth="16"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Crank Shaft Center Journal */}
          <circle cx={crankCenterX} cy={crankCenterY} r="26" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
          <circle cx={crankCenterX} cy={crankCenterY} r="6" fill="#38bdf8" />

          {/* Crank Orbit Circle */}
          <circle
            cx={crankCenterX}
            cy={crankCenterY}
            r={crankPinRadius}
            fill="none"
            stroke="#475569"
            strokeWidth="1"
            strokeDasharray="4 3"
          />

          {/* Rotation Direction Arrow */}
          <path
            d={`M ${crankCenterX + 75} ${crankCenterY - 10} A 75 75 0 0 1 ${crankCenterX + 60} ${crankCenterY + 45}`}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            markerEnd="url(#arrow)"
          />
          <text x={crankCenterX + 85} y={crankCenterY + 15} fill="#38bdf8" fontSize="9" fontFamily="monospace">
            {inputs.crankSpeedRpm} RPM
          </text>
        </svg>
      </div>

      {/* Bottom Transport Controls Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0c1017] border-t border-[#1f2937] text-xs font-mono">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-bold transition-colors ${
              isPlaying
                ? 'bg-amber-600/80 hover:bg-amber-500 text-white'
                : 'bg-emerald-600/80 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'PAUSE' : 'START'}
          </button>

          <button
            onClick={() => setIsPlaying(false)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#161b22] border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-red-400"
            title="Stop Animation"
          >
            <Square className="w-3 h-3" />
            STOP
          </button>

          <button
            onClick={() => {
              setIsPlaying(true);
              setCrankAngleDeg(0);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#161b22] border border-slate-700 hover:border-slate-500 text-slate-300"
            title="Reset to 0° Top Dead Center"
          >
            <RotateCcw className="w-3 h-3" />
            RESET (0° TDC)
          </button>

          {/* Manual Scrub Slider */}
          <div className="flex items-center gap-2 ml-2">
            <span className="text-slate-400 text-[11px]">Crank Angle:</span>
            <input
              type="range"
              min="0"
              max="360"
              step="2"
              value={Math.round(crankAngleDeg)}
              onChange={(e) => {
                setIsPlaying(false);
                setCrankAngleDeg(Number(e.target.value));
              }}
              className="w-32 accent-cyan-400 h-1 bg-slate-700 rounded cursor-pointer"
            />
            <span className="text-cyan-300 w-8 text-right font-bold">{Math.round(crankAngleDeg)}°</span>
          </div>
        </div>

        {/* Live Kinematic Telemetry */}
        <div className="hidden md:flex items-center gap-4 text-slate-400 text-[11px]">
          <span>
            Piston Pos: <strong className="text-slate-200">{currentPoint.pistonPositionMm} mm</strong>
          </span>
          <span>
            HE Vol: <strong className="text-slate-200">{currentPoint.sweptVolumeLitersHE} L</strong>
          </span>
          <span>
            Gas Force: <strong className="text-cyan-400">{currentPoint.gasLoadKn} kN</strong>
          </span>
          <span>
            Inertia: <strong className="text-purple-400">{currentPoint.inertiaLoadKn} kN</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
