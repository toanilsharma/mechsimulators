import React, { useState, useEffect, useRef } from 'react';
import { GearboxInputs, GearboxOutputs } from '../../types/gearbox';
import { UnitSystem } from '../../types/common';
import { Play, Pause, Square, RotateCcw, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface GearboxVisualizerProps {
  inputs: GearboxInputs;
  outputs: GearboxOutputs;
  isRunning?: boolean;
  unitSystem?: UnitSystem;
}

export const GearboxVisualizer: React.FC<GearboxVisualizerProps> = ({
  inputs,
  outputs,
  isRunning = true,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(isRunning);
  const [simSpeed, setSimSpeed] = useState<number>(1.0);
  const [showPitchCircles, setShowPitchCircles] = useState<boolean>(true);
  const [showLineOfAction, setShowLineOfAction] = useState<boolean>(true);

  const anglePinionRef = useRef<number>(0);
  const [pinionAngle, setPinionAngle] = useState<number>(0);

  useEffect(() => {
    setIsPlaying(isRunning);
  }, [isRunning]);

  // Animation Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (isPlaying) {
        // Base rotation speed scaled for pleasant visual tracking
        const visualRps = (inputs.inputSpeedRpm / 60) * 0.12 * simSpeed;
        anglePinionRef.current = (anglePinionRef.current + visualRps * 360 * dt) % 360;
        setPinionAngle(anglePinionRef.current);
      }
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, simSpeed, inputs.inputSpeedRpm]);

  // Derived Angles
  const gearRatio = outputs.gearRatio;
  const gearAngle = -(pinionAngle / gearRatio); // Opposite rotation direction

  // SVG Layout
  const svgW = 760;
  const svgH = 430;

  // Scale gear radii for visual display
  const maxCenterSpan = 380;
  const totalPitchD = outputs.pinionPitchDiameterMm + outputs.gearPitchDiameterMm;
  const scale = maxCenterSpan / Math.max(10, totalPitchD);

  const rPinion = Math.max(38, Math.min(100, (outputs.pinionPitchDiameterMm / 2) * scale));
  const rGear = Math.max(80, Math.min(185, (outputs.gearPitchDiameterMm / 2) * scale));

  // Center coordinates
  const cX_pinion = 220;
  const cY = 215;
  const cX_gear = cX_pinion + rPinion + rGear; // Perfect tangent at pitch point

  // Mesh Pitch Point
  const pitchPointX = cX_pinion + rPinion;
  const pitchPointY = cY;

  // Pressure angle line of action
  const alphaRad = (inputs.pressureAngleDeg * Math.PI) / 180;
  const lineLength = 110;
  const loActionX1 = pitchPointX - lineLength * Math.cos(alphaRad);
  const loActionY1 = pitchPointY - lineLength * Math.sin(alphaRad);
  const loActionX2 = pitchPointX + lineLength * Math.cos(alphaRad);
  const loActionY2 = pitchPointY + lineLength * Math.sin(alphaRad);

  // Generate Gear Teeth Path
  const generateGearPath = (
    teethCount: number,
    pitchRadius: number,
    rotationDeg: number
  ) => {
    const dTheta = (2 * Math.PI) / teethCount;
    const moduleVisual = (pitchRadius * 2) / teethCount;
    const addendum = moduleVisual * 0.85;
    const dedendum = moduleVisual * 1.05;
    const rOuter = pitchRadius + addendum;
    const rRoot = Math.max(12, pitchRadius - dedendum);

    const rotRad = (rotationDeg * Math.PI) / 180;
    const points: string[] = [];

    for (let i = 0; i < teethCount; i++) {
      const angle = i * dTheta + rotRad;
      const a1 = angle - dTheta * 0.32;
      const a2 = angle - dTheta * 0.15;
      const a3 = angle + dTheta * 0.15;
      const a4 = angle + dTheta * 0.32;

      const pRoot1 = `${(rRoot * Math.cos(a1)).toFixed(1)},${(rRoot * Math.sin(a1)).toFixed(1)}`;
      const pTip1 = `${(rOuter * Math.cos(a2)).toFixed(1)},${(rOuter * Math.sin(a2)).toFixed(1)}`;
      const pTip2 = `${(rOuter * Math.cos(a3)).toFixed(1)},${(rOuter * Math.sin(a3)).toFixed(1)}`;
      const pRoot2 = `${(rRoot * Math.cos(a4)).toFixed(1)},${(rRoot * Math.sin(a4)).toFixed(1)}`;

      if (i === 0) points.push(`M ${pRoot1}`);
      else points.push(`L ${pRoot1}`);
      points.push(`L ${pTip1} L ${pTip2} L ${pRoot2}`);
    }
    points.push('Z');
    return points.join(' ');
  };

  // Limit visual tooth counts so SVG does not lag on extreme counts
  const visualPinionTeeth = Math.min(28, Math.max(12, inputs.pinionTeeth));
  const visualGearTeeth = Math.round(visualPinionTeeth * Math.min(4.5, gearRatio));

  return (
    <div className="w-full h-full flex flex-col bg-[#080c14] border border-[#1e293b] rounded-lg overflow-hidden select-none">
      {/* Top Bar Controls */}
      <div className="px-3 py-2 bg-[#0d1424] border-b border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'PAUSE' : 'START'}
          </button>

          <button
            onClick={() => setIsPlaying(false)}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-700 hover:bg-slate-700"
            title="Stop Rotation"
          >
            <Square className="w-3 h-3" />
            STOP
          </button>

          <button
            onClick={() => {
              setIsPlaying(true);
              anglePinionRef.current = 0;
              setPinionAngle(0);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
            title="Reset Kinematic Angles"
          >
            <RotateCcw className="w-3 h-3" />
            RESET
          </button>

          <div className="flex items-center gap-1 ml-2 text-xs font-mono text-slate-400">
            <span>Speed:</span>
            {[0.5, 1.0, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => setSimSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                  simSpeed === s ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPitchCircles(!showPitchCircles)}
            className={`px-2 py-1 rounded text-[11px] font-mono border ${
              showPitchCircles ? 'bg-cyan-950 text-cyan-400 border-cyan-700' : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            Pitch Circles
          </button>
          <button
            onClick={() => setShowLineOfAction(!showLineOfAction)}
            className={`px-2 py-1 rounded text-[11px] font-mono border ${
              showLineOfAction ? 'bg-amber-950 text-amber-400 border-amber-700' : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            Line of Action ({inputs.pressureAngleDeg}°)
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <div className="relative flex-1 w-full p-2 flex items-center justify-center bg-[#070b12] overflow-hidden">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full max-h-[500px]">
          <defs>
            {/* Gear Metal Gradients */}
            <radialGradient id="pinionMetal" cx="45%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#0284c7" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0c4a6e" stopOpacity="1" />
            </radialGradient>
            <radialGradient id="gearMetal" cx="45%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#475569" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="1" />
            </radialGradient>
            {/* Fault Highlight Glow */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid */}
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" opacity="0.3" />
          </pattern>
          <rect width={svgW} height={svgH} fill="url(#grid)" />

          {/* Center Distance Dimension Line */}
          <line x1={cX_pinion} y1={cY + rGear + 35} x2={cX_gear} y2={cY + rGear + 35} stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1={cX_pinion} y1={cY} x2={cX_pinion} y2={cY + rGear + 42} stroke="#475569" strokeWidth="1" />
          <line x1={cX_gear} y1={cY} x2={cX_gear} y2={cY + rGear + 42} stroke="#475569" strokeWidth="1" />
          <text
            x={(cX_pinion + cX_gear) / 2}
            y={cY + rGear + 30}
            fill="#94a3b8"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="middle"
          >
            Center Distance a = {outputs.centerDistanceMm} mm (Ratio u = {outputs.gearRatio}:1)
          </text>

          {/* Line of Action */}
          {showLineOfAction && (
            <g>
              <line
                x1={loActionX1}
                y1={loActionY1}
                x2={loActionX2}
                y2={loActionY2}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <text x={loActionX2 + 8} y={loActionY2 + 3} fill="#fbbf24" fontSize="10" fontFamily="monospace">
                Pressure Line ({inputs.pressureAngleDeg}°)
              </text>
            </g>
          )}

          {/* Pitch Circles (Tangential at Pitch Point) */}
          {showPitchCircles && (
            <g>
              <circle cx={cX_pinion} cy={cY} r={rPinion} fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="5 3" />
              <circle cx={cX_gear} cy={cY} r={rGear} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 3" />
            </g>
          )}

          {/* DRIVEN GEAR (Right, Larger) */}
          <g transform={`translate(${cX_gear}, ${cY})`}>
            {/* Rotating Gear Teeth */}
            <path
              d={generateGearPath(visualGearTeeth, rGear, gearAngle)}
              fill="url(#gearMetal)"
              stroke="#64748b"
              strokeWidth="1.2"
            />

            {/* Gear Hub & Web Lightening Holes */}
            <circle cx="0" cy="0" r={rGear * 0.72} fill="#0d1424" stroke="#334155" strokeWidth="1.5" />
            {[0, 60, 120, 180, 240, 300].map((deg) => {
              const hRad = (deg * Math.PI) / 180;
              const hR = rGear * 0.48;
              return (
                <circle
                  key={deg}
                  cx={hR * Math.cos(hRad)}
                  cy={hR * Math.sin(hRad)}
                  r={rGear * 0.14}
                  fill="#070b12"
                  stroke="#334155"
                  strokeWidth="1"
                />
              );
            })}

            {/* Gear Shaft Hub */}
            <circle cx="0" cy="0" r={rGear * 0.24} fill="#334155" stroke="#64748b" strokeWidth="1.5" />
            <circle cx="0" cy="0" r={rGear * 0.12} fill="#0b0f17" />
            <rect x={-rGear * 0.03} y={-rGear * 0.16} width={rGear * 0.06} height={rGear * 0.08} fill="#94a3b8" />

            {/* Rotation Direction Indicator (CCW or CW) */}
            <path
              d={`M ${rGear * 0.38} 0 A ${rGear * 0.38} ${rGear * 0.38} 0 0 0 0 ${-rGear * 0.38}`}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              markerEnd="url(#arrow)"
            />
          </g>

          {/* DRIVER PINION (Left, Smaller) */}
          <g transform={`translate(${cX_pinion}, ${cY})`}>
            {/* Rotating Pinion Teeth */}
            <path
              d={generateGearPath(visualPinionTeeth, rPinion, pinionAngle)}
              fill="url(#pinionMetal)"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />

            {/* Pinion Hub */}
            <circle cx="0" cy="0" r={rPinion * 0.4} fill="#0c4a6e" stroke="#0284c7" strokeWidth="1.5" />
            <circle cx="0" cy="0" r={rPinion * 0.22} fill="#080c14" />
            <rect x={-rPinion * 0.04} y={-rPinion * 0.28} width={rPinion * 0.08} height={rPinion * 0.12} fill="#38bdf8" />

            {/* Fault Visualization Indicator on Pinion */}
            {inputs.toothFault === 'broken_tooth' && (
              <g transform={`rotate(${pinionAngle})`}>
                <polygon
                  points={`${rPinion + 8},0 ${rPinion + 24},-6 ${rPinion + 24},6`}
                  fill="#ef4444"
                  filter="url(#glow)"
                />
                <circle cx={rPinion + 12} cy="0" r="4" fill="#ef4444" />
              </g>
            )}

            {inputs.toothFault === 'pitch_line_pitting' && (
              <g transform={`rotate(${pinionAngle})`}>
                <circle cx={rPinion} cy="-4" r="2.5" fill="#f59e0b" />
                <circle cx={rPinion + 2} cy="3" r="2.0" fill="#f59e0b" />
                <circle cx={rPinion - 2} cy="0" r="1.8" fill="#f59e0b" />
              </g>
            )}
          </g>

          {/* Pitch Contact Point Hotspot */}
          <circle cx={pitchPointX} cy={pitchPointY} r="5" fill="#ef4444" filter="url(#glow)" />
          <circle cx={pitchPointX} cy={pitchPointY} r="8" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.8" />

          {/* Tangential Force Vector W_t */}
          <line
            x1={pitchPointX}
            y1={pitchPointY - 35}
            x2={pitchPointX}
            y2={pitchPointY + 35}
            stroke="#10b981"
            strokeWidth="2.5"
          />
          <polygon
            points={`${pitchPointX - 4},${pitchPointY + 32} ${pitchPointX + 4},${pitchPointY + 32} ${pitchPointX},${pitchPointY + 44}`}
            fill="#10b981"
          />
          <text x={pitchPointX + 12} y={pitchPointY + 40} fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold">
            W_t = {outputs.tangentialForceKn} kN
          </text>

          {/* Pinion Telemetry Tag */}
          <g transform={`translate(${cX_pinion - 120}, ${cY - rPinion - 45})`}>
            <rect x="0" y="0" width="130" height="42" rx="4" fill="#0f172a" stroke="#0284c7" strokeWidth="1" opacity="0.9" />
            <text x="8" y="15" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
              PINION (Z_p = {inputs.pinionTeeth})
            </text>
            <text x="8" y="28" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              Speed: {inputs.inputSpeedRpm} RPM ({outputs.pinionSpeedHz} Hz)
            </text>
            <text x="8" y="38" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              d_p = {outputs.pinionPitchDiameterMm} mm
            </text>
          </g>

          {/* Gear Telemetry Tag */}
          <g transform={`translate(${cX_gear + 20}, ${cY - rGear - 45})`}>
            <rect x="0" y="0" width="140" height="42" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="1" opacity="0.9" />
            <text x="8" y="15" fill="#e2e8f0" fontSize="10" fontFamily="monospace" fontWeight="bold">
              DRIVEN GEAR (Z_g = {inputs.gearTeeth})
            </text>
            <text x="8" y="28" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              Speed: {outputs.outputSpeedRpm} RPM ({outputs.gearSpeedHz} Hz)
            </text>
            <text x="8" y="38" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              d_g = {outputs.gearPitchDiameterMm} mm
            </text>
          </g>
        </svg>

        {/* Real-Time Telemetry HUD Overlay */}
        <div className="absolute bottom-3 left-3 bg-[#0d1424]/90 border border-[#1e293b] rounded p-2.5 backdrop-blur-sm pointer-events-none">
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400">Gear Mesh (GMF):</span>{' '}
              <strong className="text-cyan-400">{outputs.gearMeshFrequencyHz} Hz</strong>
            </div>
            <div>
              <span className="text-slate-400">Hunting Tooth:</span>{' '}
              <strong className={outputs.commonFactorsGcd === 1 ? 'text-emerald-400' : 'text-amber-400'}>
                {outputs.huntingToothFrequencyHz} Hz {outputs.commonFactorsGcd === 1 ? '(Prime)' : `(GCD=${outputs.commonFactorsGcd})`}
              </strong>
            </div>
            <div>
              <span className="text-slate-400">EHL Film λ:</span>{' '}
              <strong
                className={
                  outputs.specificFilmThicknessLambda >= 2.0
                    ? 'text-emerald-400'
                    : outputs.specificFilmThicknessLambda >= 1.0
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }
              >
                {outputs.specificFilmThicknessLambda} ({outputs.lubricationRegime})
              </strong>
            </div>
          </div>
        </div>

        {/* Fault Alert Badge */}
        {inputs.toothFault !== 'none' && (
          <div className="absolute top-3 right-3 bg-rose-950/80 border border-rose-700/80 rounded px-2.5 py-1 flex items-center gap-1.5 text-xs font-mono text-rose-300">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>FAULT ACTIVE: {inputs.toothFault.replace(/_/g, ' ').toUpperCase()}</span>
          </div>
        )}
      </div>
    </div>
  );
};
