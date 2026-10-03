import React, { useState, useEffect, useRef } from 'react';
import { SteamTurbineInputs, SteamTurbineOutputs } from '../../types/steamTurbine';
import { UnitSystem } from '../../types/common';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Activity,
  Compass,
  Layers,
  Gauge,
  Droplets,
  Volume2,
} from 'lucide-react';

interface SteamTurbineVisualizerProps {
  inputs: SteamTurbineInputs;
  outputs: SteamTurbineOutputs;
  isRunning?: boolean;
  unitSystem?: UnitSystem;
  onToggleRunning?: () => void;
  onReset?: () => void;
}

export const SteamTurbineVisualizer: React.FC<SteamTurbineVisualizerProps> = ({
  inputs,
  outputs,
  isRunning: parentIsRunning = true,
  unitSystem = 'metric',
  onToggleRunning,
  onReset,
}) => {
  // Local playback state allowing instant interactivity
  const [localPlaying, setLocalPlaying] = useState<boolean>(parentIsRunning);
  const [isManualTrip, setIsManualTrip] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1.0);
  const [activeSubView, setActiveSubView] = useState<'casing' | 'rotor_end'>('casing');

  // Sync with parent isRunning when prop changes
  useEffect(() => {
    setLocalPlaying(parentIsRunning);
  }, [parentIsRunning]);

  // Simulation kinematic state
  const [currentRpm, setCurrentRpm] = useState<number>(inputs.operatingSpeedRpm);
  const [shaftAngleDeg, setShaftAngleDeg] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  const animFrameRef = useRef<number | null>(null);
  const currentRpmRef = useRef<number>(inputs.operatingSpeedRpm);
  const shaftAngleRef = useRef<number>(0);

  const isOverspeed = outputs.isOverspeedTripTriggered || isManualTrip;
  const isTripped = isOverspeed || isManualTrip || (!localPlaying && currentRpmRef.current < 50);
  const isResonant = outputs.isBladeResonant || outputs.isNearCriticalSpeed;
  const isHighMoisture = outputs.moistureErosionRiskLevel === 'critical';

  // Target RPM logic:
  // If tripped or stopped, target is 0 RPM (coast-down)
  // If running, target is operatingSpeedRpm
  const targetRpm = isTripped ? 0 : localPlaying ? inputs.operatingSpeedRpm : currentRpmRef.current;

  // Animation Loop (60 FPS kinematic integration)
  useEffect(() => {
    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;

      // 1. Coast-down or run-up inertia modeling:
      // Rotational inertia time constant tau = 3.5s for industrial turbine rotor
      const tau = isTripped ? 2.5 : 1.2;
      const rpmDiff = targetRpm - currentRpmRef.current;
      const rpmChange = rpmDiff * (1 - Math.exp(-dt / tau));
      currentRpmRef.current = Math.max(0, currentRpmRef.current + rpmChange);
      setCurrentRpm(Math.round(currentRpmRef.current));

      // 2. Shaft rotation integration:
      // Physical revolutions per second = RPM / 60
      // Scaled for human visual discernment (e.g. 0.08x so 3000 RPM spins at 4 visual rev/sec)
      if (currentRpmRef.current > 1) {
        const visualRps = (currentRpmRef.current / 60) * 0.08 * simSpeed;
        shaftAngleRef.current = (shaftAngleRef.current + visualRps * 360 * dt) % 360;
        setShaftAngleDeg(shaftAngleRef.current);
      }

      setElapsedTime((prev) => prev + dt * simSpeed);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [localPlaying, isTripped, targetRpm, simSpeed]);

  // Controls Handlers
  const handleTogglePlay = () => {
    if (isManualTrip) {
      // Re-arm turbine trip bolt
      setIsManualTrip(false);
      setLocalPlaying(true);
      if (onToggleRunning && !parentIsRunning) onToggleRunning();
    } else {
      const next = !localPlaying;
      setLocalPlaying(next);
      if (onToggleRunning) onToggleRunning();
    }
  };

  const handleTripStop = () => {
    setIsManualTrip(true);
    setLocalPlaying(false);
  };

  const handleResetSimulation = () => {
    setIsManualTrip(false);
    setLocalPlaying(true);
    currentRpmRef.current = inputs.ratedSpeedRpm;
    setCurrentRpm(inputs.ratedSpeedRpm);
    shaftAngleRef.current = 0;
    setShaftAngleDeg(0);
    if (onReset) onReset();
  };

  // Kinematic calculations for rendering
  const rad = (shaftAngleDeg * Math.PI) / 180;
  const sinAngle = Math.sin(rad);
  const cosAngle = Math.cos(rad);

  // Shaft Dynamic Vibration displacement (API 670 eddy current probe orbit)
  // Scale um to SVG pixels
  const vibAmplitudePx = Math.min(6, (outputs.shaftRelativeVibrationUmPkPk / 60) * 4);
  const shaftVibOffset = Math.sin(elapsedTime * ((currentRpm / 60) * 2 * Math.PI) * 0.1) * vibAmplitudePx;

  // Number of stages modeled
  const stages = [
    { stage: 1, x: 245, h: 50, w: 12, label: 'Curtis HP', numBlades: 28, meanDiaMm: 420 },
    { stage: 2, x: 295, h: 58, w: 12, label: 'S2 IP', numBlades: 32, meanDiaMm: 460 },
    { stage: 3, x: 345, h: 68, w: 13, label: 'S3 IP', numBlades: 36, meanDiaMm: 510 },
    { stage: 4, x: 395, h: 80, w: 14, label: 'S4 IP', numBlades: 40, meanDiaMm: 570 },
    { stage: 5, x: 445, h: 94, w: 15, label: 'S5 LP', numBlades: 44, meanDiaMm: 640 },
    { stage: 6, x: 495, h: 112, w: 16, label: 'S6 LP', numBlades: 48, meanDiaMm: 720 },
    { stage: 7, x: 550, h: 134, w: 18, label: 'L-1 LP', numBlades: 52, meanDiaMm: 820 },
    { stage: 8, x: 615, h: 164, w: 20, label: 'L-0 Last Stage', numBlades: 56, meanDiaMm: inputs.meanBladeDiameterMm || 950 },
  ];

  // Steam particle stream generation
  const steamFlowActive = currentRpm > 100 && !isTripped && inputs.throttleValveOpeningPercent > 0;
  const numParticles = 14;
  const particleSpeed = (currentRpm / 3000) * (inputs.throttleValveOpeningPercent / 100) * 2.2 * simSpeed;

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col bg-[#080b11] rounded-xl p-3 sm:p-4 border border-zinc-800 relative overflow-hidden select-none">
      {/* ========================================================
          1. COCKPIT INTERACTIVE CONTROL & TELEMETRY HEADER
          ======================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-3 py-2 bg-zinc-900/95 backdrop-blur rounded-lg border border-zinc-700/80 shadow-lg text-xs z-10">
        {/* Left: Simulation Primary Controls */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-md border border-zinc-800">
          <button
            type="button"
            id="turbine-btn-toggle-play"
            onClick={handleTogglePlay}
            title={localPlaying && !isTripped ? 'Pause Turbine Simulation' : 'Start / Accelerate Turbine'}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
              localPlaying && !isTripped
                ? 'bg-emerald-950/90 border border-emerald-500 text-emerald-400 hover:bg-emerald-900 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'bg-amber-950/90 border border-amber-500 text-amber-300 hover:bg-amber-900 animate-pulse'
            }`}
          >
            {localPlaying && !isTripped ? <Pause size={13} className="fill-current" /> : <Play size={13} className="fill-current" />}
            <span>{isManualTrip ? 'RE-ARM & START' : localPlaying ? 'PAUSE' : 'START TURBINE'}</span>
          </button>

          <button
            type="button"
            id="turbine-btn-trip-stop"
            onClick={handleTripStop}
            title="Emergency Trip Bolt / Quick-Closing Stop Valve (Coast down to 0 RPM)"
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer border ${
              isTripped
                ? 'bg-red-950 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-600'
            }`}
          >
            <Square size={12} className="fill-current text-red-400" />
            <span>STOP / TRIP</span>
          </button>

          <button
            type="button"
            id="turbine-btn-reset"
            onClick={handleResetSimulation}
            title="Reset to nominal rated operating speed"
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 transition-colors cursor-pointer border border-transparent hover:border-zinc-700"
          >
            <RotateCcw size={12} />
            <span>RESET</span>
          </button>
        </div>

        {/* Speed Multiplier & Sub-View Switcher */}
        <div className="flex items-center gap-2">
          {/* Speed selector */}
          <div className="flex items-center bg-zinc-950 p-0.5 rounded border border-zinc-800 text-[10px] font-mono">
            <span className="px-1.5 text-zinc-500">SPEED:</span>
            {[0.25, 0.5, 1.0, 2.0].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setSimSpeed(spd)}
                className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                  simSpeed === spd
                    ? 'bg-cyan-500 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* View Mode */}
          <div className="flex items-center bg-zinc-950 p-0.5 rounded border border-zinc-800 text-xs font-mono">
            <button
              type="button"
              id="view-btn-casing"
              onClick={() => setActiveSubView('casing')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeSubView === 'casing'
                  ? 'bg-amber-600 text-black font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Casing Cross-Section
            </button>
            <button
              type="button"
              id="view-btn-rotor-end"
              onClick={() => setActiveSubView('rotor_end')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeSubView === 'rotor_end'
                  ? 'bg-amber-600 text-black font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Rotor 360° End View
            </button>
          </div>
        </div>

        {/* Telemetry Status Pills */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800">
            <span className="text-zinc-500">ROTOR SPEED:</span>
            <strong
              className={`text-sm ${
                currentRpm === 0
                  ? 'text-zinc-400'
                  : isOverspeed
                  ? 'text-red-400 font-black animate-pulse'
                  : currentRpm > inputs.ratedSpeedRpm * 1.05
                  ? 'text-amber-400'
                  : 'text-emerald-400 font-black'
              }`}
            >
              {currentRpm} RPM
            </strong>
            <span className="text-[10px] text-zinc-500">
              ({((currentRpm / Math.max(1, inputs.ratedSpeedRpm)) * 100).toFixed(0)}%)
            </span>
          </div>

          <span
            className={`px-2 py-1 rounded text-[11px] font-semibold border ${
              outputs.iso20816VibrationZone === 'A'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : outputs.iso20816VibrationZone === 'B'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                : outputs.iso20816VibrationZone === 'C'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
            }`}
          >
            ISO Zone {outputs.iso20816VibrationZone} ({outputs.shaftRelativeVibrationUmPkPk} μm p-p)
          </span>
        </div>
      </div>

      {/* ========================================================
          2. MAIN VISUAL SCHEMATIC (CROSS-SECTION OR ROTOR END-VIEW)
          ======================================================== */}
      <div className="relative flex-1 w-full flex items-center justify-center min-h-[360px]">
        {activeSubView === 'casing' ? (
          <svg
            viewBox="0 0 940 430"
            className="w-full h-full max-h-[420px] drop-shadow-xl"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Gradients */}
              <linearGradient id="stCasingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22272e" />
                <stop offset="100%" stopColor="#12161d" />
              </linearGradient>

              {/* Dynamic rotating cylindrical shaft gradient */}
              <linearGradient id="stShaftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#484f58" />
                <stop offset="30%" stopColor="#8b949e" />
                <stop offset="50%" stopColor="#f0f6fc" />
                <stop offset="70%" stopColor="#8b949e" />
                <stop offset="100%" stopColor="#30363d" />
              </linearGradient>

              <linearGradient id="steamInletGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff7b72" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#f0883e" stopOpacity="0.8" />
              </linearGradient>

              <linearGradient id="exhaustGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.75" />
              </linearGradient>

              {/* Rotating shaft striation pattern */}
              <pattern
                id="shaftRotatingTexture"
                width="24"
                height="22"
                patternUnits="userSpaceOnUse"
                patternTransform={`translate(${(shaftAngleDeg * 0.6) % 24}, 0)`}
              >
                <rect width="24" height="22" fill="#30363d" />
                <rect x="0" width="12" height="22" fill="#484f58" opacity="0.6" />
                <line x1="6" y1="0" x2="6" y2="22" stroke="#8b949e" strokeWidth="1" strokeDasharray="3 3" />
              </pattern>
            </defs>

            {/* CASING SHELL BOUNDARY */}
            <path
              d="M 160,110 L 290,95 L 560,65 L 690,50 L 690,175 L 775,175 L 775,255 L 690,255 L 690,375 L 560,355 L 290,325 L 160,310 Z"
              fill="url(#stCasingGrad)"
              stroke="#444c56"
              strokeWidth="3.5"
            />

            {/* STEAM INLET PIPE (HP Superheated Steam) */}
            <g transform="translate(45, 120)">
              <rect x="0" y="0" width="90" height="38" fill="#21262d" stroke="#484f58" strokeWidth="2" rx="4" />
              <text x="45" y="-6" textAnchor="middle" fill="#ff7b72" fontSize="10" fontFamily="monospace" fontWeight="bold">
                {inputs.inletPressureBar} bar(a) | {inputs.inletTemperatureC}°C
              </text>
              {/* Dynamic Steam Inflow Stream */}
              {steamFlowActive && (
                <g>
                  {[0, 1, 2, 3].map((i) => {
                    const offset = ((elapsedTime * particleSpeed * 40 + i * 22) % 80);
                    return (
                      <circle
                        key={i}
                        cx={offset}
                        cy="19"
                        r="3.5"
                        fill="#f0883e"
                        opacity="0.85"
                        className="animate-pulse"
                      />
                    );
                  })}
                </g>
              )}
            </g>

            {/* EMERGENCY STOP VALVE (ESV) & THROTTLE GOVERNOR */}
            <g transform="translate(135, 108)">
              <rect x="0" y="0" width="36" height="62" fill="#161b22" stroke="#6e7681" strokeWidth="2" rx="3" />
              {/* Valve Handwheel / Hydraulic Actuator */}
              <line x1="18" y1="0" x2="18" y2="-22" stroke="#8b949e" strokeWidth="4" />
              <circle cx="18" cy="-26" r="10" fill={isTripped ? '#da3633' : '#238636'} stroke="#f0f6fc" strokeWidth="2" />
              {/* Valve Stem Position (Closed if tripped or 0%) */}
              <rect
                x="6"
                y={isTripped ? 40 : 18 + (100 - inputs.throttleValveOpeningPercent) * 0.28}
                width="24"
                height="10"
                fill={isTripped ? '#f85149' : inputs.throttleValveOpeningPercent > 70 ? '#3fb950' : '#d29922'}
                rx="2"
              />
              <text x="18" y="76" textAnchor="middle" fill="#8b949e" fontSize="9" fontFamily="monospace">
                {isTripped ? 'TRIPPED (0%)' : `${inputs.throttleValveOpeningPercent}% Open`}
              </text>
            </g>

            {/* NOZZLE RING (Stator Nozzle Blades) */}
            <g transform="translate(180, 130)">
              <path d="M 0,0 L 35,0 L 35,170 L 0,170 Z" fill="#2d333b" stroke="#f0883e" strokeWidth="2" />
              {/* Stator Nozzle Guide Vanes */}
              {[15, 35, 55, 75, 95, 115, 135, 155].map((y, idx) => (
                <path
                  key={idx}
                  d={`M 4,${y} Q 18,${y - 8} 31,${y + 4}`}
                  fill="none"
                  stroke="#ff7b72"
                  strokeWidth="2.5"
                />
              ))}
              <text x="17" y="-8" textAnchor="middle" fill="#f0883e" fontSize="9" fontWeight="bold">
                Nozzles ({inputs.nozzlePassFrequencyCount}x)
              </text>
            </g>

            {/* DYNAMIC EXPANDING STEAM FLOW THROUGH STAGES */}
            {steamFlowActive && (
              <g opacity="0.8">
                {Array.from({ length: numParticles }).map((_, i) => {
                  const progress = ((elapsedTime * particleSpeed * 0.25 + i / numParticles) % 1);
                  const px = 215 + progress * 430;
                  const py = 212 + (progress - 0.5) * 60 + Math.sin(progress * 12 + elapsedTime * 4) * 12;
                  const particleColor =
                    progress < 0.2 ? '#f0883e' : progress < 0.6 ? '#e3b341' : '#38bdf8';
                  return (
                    <circle
                      key={i}
                      cx={px}
                      cy={py}
                      r={2 + progress * 3.5}
                      fill={particleColor}
                      opacity={0.75 - progress * 0.2}
                    />
                  );
                })}
              </g>
            )}

            {/* ROTOR SHAFT ASSEMBLY WITH ROTATION & VIBRATION */}
            <g transform={`translate(0, ${shaftVibOffset})`}>
              {/* Main Rotor Shaft Cylinder */}
              <rect
                x="95"
                y="201"
                width="725"
                height="22"
                fill="url(#stShaftGrad)"
                stroke="#21262d"
                strokeWidth="1.5"
                rx="3"
              />

              {/* Dynamic rotating striations over shaft surface */}
              {currentRpm > 10 && (
                <rect
                  x="95"
                  y="202"
                  width="725"
                  height="20"
                  fill="url(#shaftRotatingTexture)"
                  opacity="0.35"
                />
              )}

              {/* Bearing #1 & Thrust Collar (Left Front) */}
              <g transform="translate(95, 178)">
                <rect x="0" y="0" width="38" height="68" fill="#161b22" stroke="#58a6ff" strokeWidth="2" rx="4" />
                {/* Thrust Collar */}
                <rect x="12" y="-8" width="14" height="84" fill="#d0d7de" stroke="#30363d" strokeWidth="1.5" />
                {/* API 670 Proximity Probes (Eddy Current X & Y) */}
                <line x1="30" y1="-16" x2="30" y2="-4" stroke="#d29922" strokeWidth="3" />
                <circle cx="30" cy="-18" r="3.5" fill="#d29922" />
                <text x="19" y="84" textAnchor="middle" fill="#58a6ff" fontSize="8" fontWeight="bold">
                  Thrust Bearing
                </text>
                <text x="19" y="96" textAnchor="middle" fill="#8b949e" fontSize="8" fontFamily="monospace">
                  {inputs.thrustBearingPadTempC}°C
                </text>
              </g>

              {/* Bearing #2 Drive End (Right Rear) */}
              <g transform="translate(745, 178)">
                <rect x="0" y="0" width="38" height="68" fill="#161b22" stroke="#58a6ff" strokeWidth="2" rx="4" />
                <line x1="19" y1="-16" x2="19" y2="-4" stroke="#d29922" strokeWidth="3" />
                <circle cx="19" cy="-18" r="3.5" fill="#d29922" />
                {/* Drive Shaft Coupling Flange */}
                <rect x="36" y="8" width="12" height="52" fill="#6e7681" stroke="#30363d" strokeWidth="1.5" />
                <text x="19" y="84" textAnchor="middle" fill="#58a6ff" fontSize="8" fontWeight="bold">
                  Journal #2
                </text>
                <text x="19" y="96" textAnchor="middle" fill="#8b949e" fontSize="8" fontFamily="monospace">
                  Drive Output
                </text>
              </g>

              {/* 8 MULTI-STAGE ROTOR DISCS & ROTATING BLADES */}
              {stages.map((stg, stgIdx) => {
                const isLastStage = stg.stage === 8;
                const isFirstStage = stg.stage === 1;

                // Stage specific blade tip speed: U = π * D * N / 60
                const stageTipSpeed = Math.round((Math.PI * (stg.meanDiaMm / 1000) * currentRpm) / 60);

                // Blade animation phase: each stage has distinct phase offset
                const stageAngle = (shaftAngleDeg + stgIdx * 35) % 360;
                const stageRad = (stageAngle * Math.PI) / 180;
                const vaneVibration = isResonant && stgIdx >= 6 ? Math.sin(elapsedTime * 30) * 3 : 0;

                // Stroboscopic blade vane offset
                const vaneOffset = Math.sin(stageRad) * (stg.h * 0.12);

                const bladeColor =
                  isLastStage && isHighMoisture
                    ? '#f85149'
                    : isResonant && stg.stage === 7
                    ? '#d29922'
                    : isFirstStage
                    ? '#ff7b72'
                    : '#79c0ff';

                return (
                  <g key={stg.stage} transform={`translate(${stg.x}, 212)`}>
                    {/* Rotor Wheel Disc Hub */}
                    <rect
                      x={-stg.w / 2}
                      y={-stg.h * 0.38}
                      width={stg.w}
                      height={stg.h * 0.76}
                      fill="#30363d"
                      stroke="#484f58"
                      strokeWidth="1.5"
                      rx="2"
                    />

                    {/* Disc keyway/rivet rotation indicators */}
                    {currentRpm > 10 && (
                      <circle
                        cx={0}
                        cy={Math.sin(stageRad) * (stg.h * 0.22)}
                        r="2"
                        fill="#8b949e"
                        stroke="#21262d"
                      />
                    )}

                    {/* UPPER ROTATING BLADE AEROFOIL */}
                    <path
                      d={`M ${-stg.w / 2},${-stg.h * 0.38} Q ${stg.w / 2 + vaneVibration},${
                        -stg.h * 0.7 + vaneOffset
                      } ${stg.w / 3},${-stg.h} L ${-stg.w / 3},${-stg.h} Z`}
                      fill={bladeColor}
                      stroke="#161b22"
                      strokeWidth="1.2"
                    />

                    {/* Rotating blade vane highlight reflection */}
                    <line
                      x1="0"
                      y1={-stg.h * 0.4}
                      x2={vaneVibration}
                      y2={-stg.h * 0.95}
                      stroke="#f0f6fc"
                      strokeWidth={1.5}
                      strokeOpacity={0.3 + Math.abs(Math.cos(stageRad)) * 0.6}
                    />

                    {/* LOWER ROTATING BLADE AEROFOIL */}
                    <path
                      d={`M ${-stg.w / 2},${stg.h * 0.38} Q ${stg.w / 2 - vaneVibration},${
                        stg.h * 0.7 - vaneOffset
                      } ${stg.w / 3},${stg.h} L ${-stg.w / 3},${stg.h} Z`}
                      fill={bladeColor}
                      stroke="#161b22"
                      strokeWidth="1.2"
                    />

                    {/* Stellite Erosion Shield on L-0 Blade Tips */}
                    {isLastStage && inputs.stelliteErosionShieldInstalled && (
                      <g>
                        <path
                          d={`M ${-stg.w / 3},${-stg.h} L ${-stg.w / 3},${-stg.h * 0.82} L ${stg.w / 3},${
                            -stg.h * 0.82
                          } Z`}
                          fill="#38bdf8"
                          stroke="#0284c7"
                          strokeWidth="1.5"
                        />
                        <path
                          d={`M ${-stg.w / 3},${stg.h} L ${-stg.w / 3},${stg.h * 0.82} L ${stg.w / 3},${
                            stg.h * 0.82
                          } Z`}
                          fill="#38bdf8"
                          stroke="#0284c7"
                          strokeWidth="1.5"
                        />
                      </g>
                    )}

                    {/* Tip Speed Vector Arrow (when rotating) */}
                    {currentRpm > 500 && isLastStage && (
                      <g transform={`translate(${stg.w / 2 + 6}, ${-stg.h})`}>
                        <line x1="0" y1="0" x2="22" y2="0" stroke="#f0883e" strokeWidth="2" markerEnd="url(#arrow)" />
                        <text x="26" y="3" fill="#f0883e" fontSize="9" fontFamily="monospace" fontWeight="bold">
                          U_tip: {stageTipSpeed} m/s
                        </text>
                      </g>
                    )}

                    {/* Stage Tag Label */}
                    <text x="0" y={stg.h + 24} textAnchor="middle" fill="#8b949e" fontSize="8" fontFamily="monospace">
                      {stg.label}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* CONDENSING EXHAUST HOOD & DROPLET FOG */}
            <g transform="translate(690, 255)">
              <path d="M 0,0 L 0,110 L 110,110 L 110,0 Z" fill="url(#exhaustGrad)" stroke="#38bdf8" strokeWidth="2" />
              <text x="55" y="45" textAnchor="middle" fill="#f0f6fc" fontSize="10" fontWeight="bold">
                Condenser Hotwell
              </text>
              <text x="55" y="60" textAnchor="middle" fill="#79c0ff" fontSize="9" fontFamily="monospace">
                {inputs.exhaustPressureBar} bar(a)
              </text>
              <text x="55" y="75" textAnchor="middle" fill="#a5d6ff" fontSize="9" fontFamily="monospace">
                {outputs.exhaustMoisturePercent}% Moisture
              </text>

              {/* Dynamic Droplet condensation when moisture > 4% */}
              {outputs.exhaustMoisturePercent > 4.0 && currentRpm > 100 && (
                <g fill="#38bdf8" opacity="0.85">
                  {[
                    { cx: 20, cy: 25, r: 2.5 },
                    { cx: 45, cy: 35, r: 3.0 },
                    { cx: 80, cy: 22, r: 2.0 },
                    { cx: 65, cy: 75, r: 2.8 },
                    { cx: 30, cy: 90, r: 3.5 },
                    { cx: 85, cy: 85, r: 2.2 },
                  ].map((drop, idx) => {
                    const oscY = (drop.cy + (elapsedTime * 35 + idx * 18) % 75);
                    return (
                      <circle
                        key={idx}
                        cx={drop.cx}
                        cy={oscY}
                        r={drop.r}
                        opacity={0.8}
                      />
                    );
                  })}
                </g>
              )}
            </g>

            {/* CALLOUT: ROTOR/CASING EXPANSION */}
            <g transform="translate(360, 380)">
              <rect x="0" y="0" width="220" height="26" fill="#161b22" stroke="#484f58" strokeWidth="1" rx="4" />
              <text x="110" y="17" textAnchor="middle" fill="#8b949e" fontSize="9" fontFamily="monospace">
                Diff Expansion:{' '}
                <strong
                  className={
                    Math.abs(inputs.casingWarmUpDifferentialMm) > 0.7 ? 'text-amber-400' : 'text-emerald-400'
                  }
                >
                  {inputs.casingWarmUpDifferentialMm >= 0
                    ? `+${inputs.casingWarmUpDifferentialMm}`
                    : inputs.casingWarmUpDifferentialMm}{' '}
                  mm
                </strong>{' '}
                ({outputs.differentialExpansionStatus.toUpperCase()})
              </text>
            </g>
          </svg>
        ) : (
          /* ========================================================
             ROTOR 360° END-ON CROSS-SECTION COCKPIT VIEW
             ======================================================== */
          <div className="w-full h-full max-h-[420px] flex flex-col md:flex-row items-center justify-center gap-6 p-4">
            {/* Circular Rotor Disc & Blade Wheel */}
            <div className="relative w-[320px] h-[320px] flex items-center justify-center">
              <svg viewBox="0 0 340 340" className="w-full h-full drop-shadow-2xl">
                <defs>
                  <radialGradient id="discGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#8b949e" />
                    <stop offset="60%" stopColor="#30363d" />
                    <stop offset="100%" stopColor="#161b22" />
                  </radialGradient>
                  <radialGradient id="shaftCenterGrad" cx="40%" cy="40%" r="60%">
                    <stop offset="0%" stopColor="#f0f6fc" />
                    <stop offset="70%" stopColor="#6e7681" />
                    <stop offset="100%" stopColor="#21262d" />
                  </radialGradient>
                </defs>

                {/* Stator Casing Ring Outer */}
                <circle cx="170" cy="170" r="160" fill="#0d1117" stroke="#30363d" strokeWidth="4" />

                {/* API 670 Proximity Probes at 45° and 135° */}
                <g stroke="#d29922" strokeWidth="4">
                  {/* Probe X (45°) */}
                  <line x1="56" y1="56" x2="100" y2="100" />
                  <circle cx="56" cy="56" r="6" fill="#d29922" />
                  {/* Probe Y (135°) */}
                  <line x1="284" y1="56" x2="240" y2="100" />
                  <circle cx="284" cy="56" r="6" fill="#d29922" />
                </g>
                <text x="56" y="44" fill="#d29922" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  Probe X
                </text>
                <text x="284" y="44" fill="#d29922" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  Probe Y
                </text>

                {/* Rotating Bladed Wheel Assembly */}
                <g transform={`rotate(${shaftAngleDeg}, 170, 170)`}>
                  {/* Rotor Disc Body */}
                  <circle cx="170" cy="170" r="100" fill="url(#discGrad)" stroke="#484f58" strokeWidth="2" />

                  {/* 16 Radial Aerofoil Blades radiating from disc */}
                  {Array.from({ length: 16 }).map((_, i) => {
                    const bladeAngle = (i * 360) / 16;
                    return (
                      <g key={i} transform={`rotate(${bladeAngle}, 170, 170)`}>
                        <path
                          d="M 166,70 L 165,22 Q 170,18 175,22 L 174,70 Z"
                          fill={isHighMoisture ? '#f85149' : '#58a6ff'}
                          stroke="#161b22"
                          strokeWidth="1"
                        />
                        {/* Shroud Band segment */}
                        <path d="M 162,22 L 178,22" stroke="#d0d7de" strokeWidth="2" />
                      </g>
                    );
                  })}

                  {/* Central Rotor Shaft Bore */}
                  <circle cx="170" cy="170" r="42" fill="url(#shaftCenterGrad)" stroke="#21262d" strokeWidth="2" />

                  {/* Shaft Keyway Slot (indicates actual rotation angle) */}
                  <rect x="165" y="128" width="10" height="18" fill="#0d1117" stroke="#f0f6fc" strokeWidth="1" rx="1" />

                  {/* Rotation Arrow direction indicator */}
                  <path
                    d="M 170,146 A 24 24 0 0 1 194,170"
                    fill="none"
                    stroke="#f0883e"
                    strokeWidth="3"
                    strokeDasharray="4 2"
                  />
                </g>

                {/* Center Dynamic Orbit Locus (Vibration Orbit Spot) */}
                <circle
                  cx={170 + Math.cos(rad) * vibAmplitudePx * 2.5}
                  cy={170 + Math.sin(rad) * vibAmplitudePx * 2.5}
                  r="5"
                  fill="#f85149"
                  stroke="#f0f6fc"
                  strokeWidth="1.5"
                />
              </svg>

              {/* Center Digital RPM Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-mono text-zinc-400">API 612 TWIN</span>
                <span className="text-xl font-mono font-black text-white">{currentRpm}</span>
                <span className="text-[9px] font-mono text-zinc-400">RPM</span>
              </div>
            </div>

            {/* Right: Blade Mechanics & Dynamics Diagnostics */}
            <div className="flex-1 max-w-sm flex flex-col gap-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-bold text-zinc-200">ROTOR DYNAMICS SPECS</span>
                <span className="text-emerald-400 font-bold">{currentRpm > 0 ? 'ACTIVE ROTATION' : 'STOPPED'}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Angular Velocity (ω):</span>
                <span className="text-zinc-200 font-bold">{((2 * Math.PI * currentRpm) / 60).toFixed(1)} rad/s</span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">L-0 Tip Speed (U_tip):</span>
                <span className="text-amber-400 font-bold">{outputs.bladeTipVelocityMs} m/s</span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Nozzle Pass Freq (NPF):</span>
                <span className="text-cyan-400 font-bold">{outputs.nozzlePassFrequencyHz} Hz</span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Blade Nat. Frequency:</span>
                <span className="text-zinc-200 font-bold">{inputs.bladeNaturalFrequencyHz} Hz</span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Resonance Margin:</span>
                <span
                  className={`font-bold ${
                    outputs.isBladeResonant ? 'text-red-400 animate-pulse' : 'text-emerald-400'
                  }`}
                >
                  {outputs.bladeResonanceMarginPercent}% ({outputs.isBladeResonant ? 'RESONANT RISK' : 'CLEAR'})
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-zinc-400">1st Critical Separation:</span>
                <span
                  className={`font-bold ${
                    outputs.isNearCriticalSpeed ? 'text-amber-400' : 'text-zinc-200'
                  }`}
                >
                  {outputs.criticalSpeedSeparationMarginPercent}% (API min: ≥15%)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Overspeed Trip Banner */}
        {isOverspeed && (
          <div className="absolute inset-0 bg-red-950/60 backdrop-blur-[2px] flex items-center justify-center p-4 z-30">
            <div className="bg-zinc-950 border-2 border-red-500 rounded-xl p-5 text-center max-w-lg shadow-[0_0_30px_rgba(239,68,68,0.5)] animate-pulse">
              <div className="flex items-center justify-center gap-2 text-red-400 mb-2">
                <AlertTriangle size={24} />
                <h4 className="text-base font-bold uppercase tracking-wider">
                  API 612 EMERGENCY TRIP BOLT ACTUATED
                </h4>
              </div>
              <p className="text-zinc-300 text-xs mb-3">
                {isManualTrip
                  ? 'Manual Emergency Stop actuated. Stop valve slammed shut, steam admission isolated. Rotor coasting down to rest.'
                  : `Operating speed (${currentRpm} RPM) breached the 110% overspeed trip threshold (${outputs.overspeedTripThresholdRpm} RPM). Quick-closing stop valve actuated.`}
              </p>
              <button
                type="button"
                onClick={handleResetSimulation}
                className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition-colors cursor-pointer shadow-md"
              >
                RE-ARM TRIP BOLT & RESET
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          3. BOTTOM STATUS & DIAGNOSTIC PILLS
          ======================================================== */}
      <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-2 flex flex-col">
          <span className="text-zinc-400 text-[10px] uppercase font-medium">Isentropic Efficiency</span>
          <span className="text-emerald-400 font-bold text-sm">{outputs.isentropicEfficiencyPercent}%</span>
          <span className="text-zinc-500 text-[10px]">Δh_act = {outputs.actualEnthalpyDropKjKg} kJ/kg</span>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-2 flex flex-col">
          <span className="text-zinc-400 text-[10px] uppercase font-medium">Steam Flow (Willans)</span>
          <span className="text-cyan-400 font-bold text-sm">{outputs.steamMassFlowTonnesHr} t/h</span>
          <span className="text-zinc-500 text-[10px]">ASR = {outputs.actualSteamRateAsrKgKwh} kg/kWh</span>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-2 flex flex-col">
          <span className="text-zinc-400 text-[10px] uppercase font-medium">Critical Speed Margin</span>
          <span className={`font-bold text-sm ${outputs.isNearCriticalSpeed ? 'text-red-400' : 'text-zinc-200'}`}>
            {outputs.criticalSpeedSeparationMarginPercent}%
          </span>
          <span className="text-zinc-500 text-[10px]">API 612 min: ≥ 15%</span>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-2 flex flex-col">
          <span className="text-zinc-400 text-[10px] uppercase font-medium">Axial Thrust Load</span>
          <span className="text-amber-400 font-bold text-sm">{outputs.calculatedAxialThrustKn} kN</span>
          <span className="text-zinc-500 text-[10px]">{outputs.thrustBearingLoadPercent}% Capacity</span>
        </div>
      </div>
    </div>
  );
};
