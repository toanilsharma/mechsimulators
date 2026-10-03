import React, { useRef, useEffect, useState, useMemo } from 'react';
import { PumpInputs, PumpOutputs } from '../../types/pump';
import { UnitSystem } from '../../types/common';
import { VisualCanvas } from '../../components/Shared/VisualCanvas';
import {
  createMetallicSteelGradient,
  createFluidParticlePool,
  updateFluidParticles,
  drawEngineeringGrid,
  FluidFlowParticle,
  calculateCanvasScale,
} from '../../components/Shared/animationUtils';
import {
  calculateEulerTriangles,
  EulerVelocityTriangle,
} from '../../physics/eulerVelocityMath';
import {
  calculateRayleighPlessetState,
  RayleighPlessetState,
} from '../../physics/rayleighPlessetMath';
import {
  getPumpAcousticSynthesizer,
} from '../../utils/pumpAcousticSynthesizer';
import {
  Volume2,
  VolumeX,
  Compass,
  Zap,
  Waves,
  Activity,
  AlertTriangle,
} from 'lucide-react';

interface PumpVisualizerProps {
  inputs: PumpInputs;
  outputs: PumpOutputs;
  isRunning?: boolean;
  unitSystem: UnitSystem;
}

export const PumpVisualizer: React.FC<PumpVisualizerProps> = ({
  inputs,
  outputs,
  isRunning = true,
  unitSystem,
}) => {
  // Visual layer toggles
  const [showEulerTriangles, setShowEulerTriangles] = useState<boolean>(true);
  const [showRayleighPitting, setShowRayleighPitting] = useState<boolean>(true);
  const [showRecirculationVortices, setShowRecirculationVortices] = useState<boolean>(true);
  
  // Audio state
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
  const [audioVolume, setAudioVolume] = useState<number>(0.6);

  // Toggle sound handler
  const handleToggleSound = () => {
    const synth = getPumpAcousticSynthesizer();
    const nextMuted = !isAudioMuted;
    synth.setMuted(nextMuted);
    synth.setVolume(audioVolume);
    setIsAudioMuted(nextMuted);
  };

  const handleVolumeChange = (newVol: number) => {
    setAudioVolume(newVol);
    const synth = getPumpAcousticSynthesizer();
    synth.setVolume(newVol);
  };

  // Header controls toolbar for VisualCanvas
  const headerControls = (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Sound Synthesizer Toggle */}
      <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-md px-2 py-1 gap-2 shadow-sm">
        <button
          onClick={handleToggleSound}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
            !isAudioMuted
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
              : 'bg-slate-700/60 text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
          title={isAudioMuted ? 'Turn on procedural cavitation audio' : 'Mute pump acoustics'}
        >
          {!isAudioMuted ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>{!isAudioMuted ? 'Sound: ON' : 'Sound: OFF'}</span>
        </button>

        {!isAudioMuted && (
          <div className="flex items-center gap-1.5">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={audioVolume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1 accent-amber-500 bg-slate-700 rounded cursor-pointer"
              title={`Acoustic Volume: ${Math.round(audioVolume * 100)}%`}
            />
            <span className="text-[10px] font-mono text-slate-400">{Math.round(audioVolume * 100)}%</span>
          </div>
        )}
      </div>

      {/* Physics Overlays */}
      <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-md p-0.5 gap-1">
        <button
          onClick={() => setShowEulerTriangles((v) => !v)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
            showEulerTriangles
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Euler Velocity Vector Triangles (U1, Vm1, W1 -> U2, Vu2, W2)"
        >
          <Compass className="w-3 h-3" />
          <span>Euler Triangles</span>
        </button>

        <button
          onClick={() => setShowRayleighPitting((v) => !v)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
            showRayleighPitting
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Rayleigh-Plesset Bubble Dynamics, Micro-Jets & Pitting Damage"
        >
          <Zap className="w-3 h-3" />
          <span>Bubble Pitting</span>
        </button>

        <button
          onClick={() => setShowRecirculationVortices((v) => !v)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
            showRecirculationVortices
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Suction Recirculation Vortex Breakdown at Low Flow"
        >
          <Waves className="w-3 h-3" />
          <span>Recirculation</span>
        </button>
      </div>
    </div>
  );

  return (
    <VisualCanvas
      simulator="pump"
      inputs={inputs}
      outputs={outputs}
      unitSystem={unitSystem}
      isRunning={isRunning}
      title="Centrifugal Pump Digital Twin (API 610 / HI 9.6.1)"
      subtitle="Navier-Stokes velocity streamlines, Euler vector triangles, Rayleigh-Plesset bubble pitting & acoustic synthesis"
      headerControls={headerControls}
      renderVisual={({
        containerWidth,
        containerHeight,
        inputs: currentInputs,
        outputs: currentOutputs,
        reducedMotion,
        isRunning: isAnimRunning,
      }) => {
        return (
          <PumpCanvasRenderer
            width={containerWidth}
            height={containerHeight}
            inputs={currentInputs}
            outputs={currentOutputs}
            unitSystem={unitSystem}
            isRunning={isAnimRunning}
            reducedMotion={reducedMotion}
            showEulerTriangles={showEulerTriangles}
            showRayleighPitting={showRayleighPitting}
            showRecirculationVortices={showRecirculationVortices}
            isAudioMuted={isAudioMuted}
          />
        );
      }}
    />
  );
};

interface PumpCanvasRendererProps {
  width: number;
  height: number;
  inputs: PumpInputs;
  outputs: PumpOutputs;
  unitSystem: UnitSystem;
  isRunning: boolean;
  reducedMotion: boolean;
  showEulerTriangles: boolean;
  showRayleighPitting: boolean;
  showRecirculationVortices: boolean;
  isAudioMuted: boolean;
}

interface PersistentPittingScar {
  vaneIndex: number;
  bladeT: number;      // 0 at leading edge, 1 at trailing edge
  offsetNormal: number; // offset along blade normal
  radiusPx: number;
  alpha: number;
  timestamp: number;
}

const PumpCanvasRenderer: React.FC<PumpCanvasRendererProps> = ({
  width,
  height,
  inputs: currentInputs,
  outputs: currentOutputs,
  unitSystem,
  isRunning: isAnimRunning,
  reducedMotion,
  showEulerTriangles,
  showRayleighPitting,
  showRecirculationVortices,
  isAudioMuted,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<FluidFlowParticle[]>([]);
  const gasPocketsRef = useRef<Array<{ progress: number; speed: number; size: number; offsetY: number }>>([]);
  
  // Advanced Rayleigh-Plesset Bubble Dynamics Pool
  const bubblesRef = useRef<
    Array<{
      vaneIndex: number;
      bladeT: number;        // distance along blade chord 0 to 1
      x: number;
      y: number;
      radiusMm: number;      // Rayleigh-Plesset radius
      maxRadiusMm: number;
      growthPhase: 'nucleating' | 'expanding' | 'collapsing' | 'microjet';
      microJetAngle: number;
      microJetVelocityMs: number;
      shockwaveRadiusPx: number;
      shockwaveAlpha: number;
      alpha: number;
      life: number;
      maxLife: number;
    }>
  >([]);

  // Persistent blade surface pitting scars
  const pittingScarsRef = useRef<PersistentPittingScar[]>([]);
  
  // Suction recirculation vortex filaments
  const recirculationVorticesRef = useRef<
    Array<{
      x: number;
      y: number;
      angle: number;
      radius: number;
      speed: number;
      life: number;
      maxLife: number;
    }>
  >([]);

  const rotationAngleRef = useRef<number>(0);
  const simTimeRef = useRef<number>(0);
  const audioBufferRef = useRef<Uint8Array>(new Uint8Array(32));

  // Compute Euler Velocity Triangles
  const eulerData = useMemo(() => {
    return calculateEulerTriangles({
      flowRateM3h: currentInputs.flowRateM3h,
      bepFlowM3h: currentInputs.bepFlowM3h,
      pumpSpeedRpm: currentInputs.pumpSpeedRpm,
      impellerEyeDiameterMm: currentInputs.impellerEyeDiameterMm || 120,
      ratedHeadM: currentInputs.ratedHeadM || 65,
      suctionSpecificSpeedUS: currentOutputs.suctionSpecificSpeedUS || 9500,
      numBlades: 6,
    });
  }, [currentInputs.flowRateM3h, currentInputs.bepFlowM3h, currentInputs.pumpSpeedRpm, currentInputs.impellerEyeDiameterMm, currentInputs.ratedHeadM, currentOutputs.suctionSpecificSpeedUS]);

  // Compute Rayleigh-Plesset Bubble Dynamics & Pitting State
  const rayleighState = useMemo(() => {
    return calculateRayleighPlessetState({
      suctionFlangePressureKPa: currentOutputs.suctionFlangePressureKPag + 101.325,
      vaporPressureKPa: currentOutputs.vaporPressureKPa,
      fluidDensityKgM3: currentOutputs.fluidDensityKgM3,
      fluidVelocityMs: currentOutputs.fluidVelocityMs,
      impellerSpeedRpm: currentInputs.pumpSpeedRpm,
      npshaM: currentOutputs.npshaM,
      npshrM: currentOutputs.npshrM,
      incidenceAngleDeg: eulerData.incidenceAngleDeg,
      cumulativeTimeSeconds: simTimeRef.current,
    });
  }, [currentOutputs.suctionFlangePressureKPag, currentOutputs.vaporPressureKPa, currentOutputs.fluidDensityKgM3, currentOutputs.fluidVelocityMs, currentInputs.pumpSpeedRpm, currentOutputs.npshaM, currentOutputs.npshrM, eulerData.incidenceAngleDeg]);

  // Initialize particle pools
  useEffect(() => {
    particlesRef.current = createFluidParticlePool(65, 'high');
    gasPocketsRef.current = Array.from({ length: 14 }, () => ({
      progress: Math.random(),
      speed: 0.5 + Math.random() * 0.3,
      size: 4 + Math.random() * 5,
      offsetY: (Math.random() - 0.5) * 8,
    }));
  }, []);

  const isCritical = currentOutputs.npshaM <= currentOutputs.npshrM;
  const isWarning = !isCritical && currentOutputs.npshaM < currentOutputs.npshrM + currentOutputs.requiredSafetyMarginM;
  const cavitationIntensity = isCritical ? 1.0 : isWarning ? 0.45 : 0.05;

  // Sync acoustic synthesizer
  useEffect(() => {
    const synth = getPumpAcousticSynthesizer();
    synth.updateParameters({
      pumpSpeedRpm: currentInputs.pumpSpeedRpm,
      flowRateM3h: currentInputs.flowRateM3h,
      bepFlowM3h: currentInputs.bepFlowM3h,
      npshaM: currentOutputs.npshaM,
      npshrM: currentOutputs.npshrM,
      cavitationIntensity,
      isRecirculating: eulerData.isRecirculating,
      recirculationIntensity: eulerData.recirculationIntensity,
      numBlades: 6,
    });
  }, [currentInputs.pumpSpeedRpm, currentInputs.flowRateM3h, currentInputs.bepFlowM3h, currentOutputs.npshaM, currentOutputs.npshrM, cavitationIntensity, eulerData.isRecirculating, eulerData.recirculationIntensity]);

  // Main 60 FPS Render Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const animActive = isAnimRunning && !reducedMotion;
      if (animActive) {
        simTimeRef.current += dt;
      }

      const baseW = 900;
      const baseH = 530;
      const { scale, offsetX, offsetY } = calculateCanvasScale(width, height, baseW, baseH);

      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // 1. Engineering Coordinate CAD Grid
      drawEngineeringGrid(ctx, baseW, baseH, 20, '#0c121e');

      // Impeller rotation kinematic update
      const rpmSpeed = (2 * Math.PI * currentInputs.pumpSpeedRpm) / 60;
      if (animActive) {
        rotationAngleRef.current += rpmSpeed * dt * 0.28;
      }

      // Vibration displacement offset
      let vibX = 0;
      let vibY = 0;
      if (animActive && cavitationIntensity > 0.1) {
        const vibFreq = 42;
        const vibAmp = isCritical ? 3.8 : 1.2;
        vibX = (Math.sin(time * 0.001 * vibFreq) + (Math.random() - 0.5) * 0.9) * vibAmp;
        vibY = (Math.cos(time * 0.001 * vibFreq * 1.35) + (Math.random() - 0.5) * 0.9) * vibAmp;
      }

      // Geometry coordinates
      const isSuctionLift = currentInputs.staticHeadM < 0 || currentInputs.suctionSourceType === 'suction_lift';
      const isPressurized = currentInputs.suctionSourceType === 'pressurized_vessel';

      // Tank geometry
      const tankW = 160;
      const tankH = 260;
      const tankX = 125;
      const tankY = isSuctionLift ? 340 : 210;

      // Pump geometry
      const pumpCenterX = 640 + vibX;
      const pumpCenterY = 275 + vibY;
      const pumpRadius = 115;

      // Centerline Datum Line
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(25, pumpCenterY);
      ctx.lineTo(baseW - 25, pumpCenterY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('℄ Pump Centerline Datum (Z = 0)', 30, pumpCenterY - 6);

      // 2. DRAW SUCTION VESSEL / TANK
      ctx.save();
      ctx.fillStyle = '#090d16';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.5;

      if (isPressurized) {
        ctx.beginPath();
        ctx.roundRect(tankX - tankW / 2, tankY - tankH / 2, tankW, tankH, [tankW / 2, tankW / 2, 8, 8]);
        ctx.fill();
        ctx.stroke();

        // Pressure gauge
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(tankX, tankY - tankH / 2 - 14, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#f27d26';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(tankX, tankY - tankH / 2 - 14);
        ctx.lineTo(tankX + 7, tankY - tankH / 2 - 21);
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`P_vessel: ${currentInputs.tankPressureKPag} kPag`, tankX, tankY - tankH / 2 - 32);
      } else {
        ctx.beginPath();
        ctx.roundRect(tankX - tankW / 2, tankY - tankH / 2, tankW, tankH, [0, 0, 8, 8]);
        ctx.fill();
        ctx.stroke();

        // Open vent stack
        ctx.fillStyle = '#334155';
        ctx.fillRect(tankX - 6, tankY - tankH / 2 - 16, 12, 16);
        ctx.fillRect(tankX - 14, tankY - tankH / 2 - 18, 28, 4);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Atmospheric Vented (101.3 kPa)', tankX, tankY - tankH / 2 - 25);
      }

      // Tank liquid level
      const levelNorm = Math.max(0.15, Math.min(0.85, 0.5 + (currentInputs.staticHeadM / 8) * 0.35));
      const liquidH = tankH * levelNorm;
      const liquidTopY = tankY + tankH / 2 - liquidH;

      const isHot = currentInputs.fluidTempC >= 70;
      const fluidGrad = ctx.createLinearGradient(tankX, liquidTopY, tankX, tankY + tankH / 2);
      if (isHot) {
        fluidGrad.addColorStop(0, 'rgba(249, 115, 22, 0.45)');
        fluidGrad.addColorStop(1, 'rgba(194, 65, 12, 0.8)');
      } else {
        fluidGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
        fluidGrad.addColorStop(1, 'rgba(2, 132, 199, 0.8)');
      }

      ctx.fillStyle = fluidGrad;
      ctx.beginPath();
      ctx.roundRect(tankX - tankW / 2 + 2, liquidTopY, tankW - 4, liquidH - 2, [0, 0, 6, 6]);
      ctx.fill();

      // Animated surface wave
      ctx.strokeStyle = isHot ? '#fb923c' : '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let x = tankX - tankW / 2 + 3; x <= tankX + tankW / 2 - 3; x += 3) {
        const wave = animActive ? Math.sin(time * 0.003 + x * 0.1) * 2.2 : 0;
        const y = liquidTopY + wave;
        if (x === tankX - tankW / 2 + 3) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Static head dimension line
      ctx.strokeStyle = currentInputs.staticHeadM >= 0 ? '#34d399' : '#f87171';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(tankX + tankW / 2 + 12, liquidTopY);
      ctx.lineTo(tankX + tankW / 2 + 12, pumpCenterY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = currentInputs.staticHeadM >= 0 ? '#34d399' : '#f87171';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `Z = ${currentInputs.staticHeadM >= 0 ? '+' : ''}${currentInputs.staticHeadM.toFixed(1)}m (${isSuctionLift ? 'Lift' : 'Flooded'})`,
        tankX + tankW / 2 + 18,
        (liquidTopY + pumpCenterY) / 2
      );

      ctx.restore();

      // 3. SUCTION PIPING WITH CONTINUITY ACCELERATION
      const pipeDiameterPx = Math.max(14, Math.min(26, (currentInputs.pipeDiameterMm / 200) * 18));
      const pipeStartX = tankX + (isSuctionLift ? 0 : tankW / 2);
      const pipeStartY = isSuctionLift ? liquidTopY + liquidH * 0.6 : tankY + tankH / 2 - 22;
      const pipeTurnX = pumpCenterX - pumpRadius * 0.72;
      const pipeReducerStartX = pumpCenterX - pumpRadius * 0.58;
      const pipeEndX = pumpCenterX - pumpRadius * 0.38;

      // Pipe outer structure
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = pipeDiameterPx + 6;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      if (isSuctionLift) {
        ctx.moveTo(pipeStartX, pipeStartY);
        ctx.lineTo(pipeStartX, pumpCenterY);
        ctx.lineTo(pipeEndX, pumpCenterY);
      } else {
        ctx.moveTo(pipeStartX, pipeStartY);
        ctx.lineTo(pipeTurnX, pipeStartY);
        ctx.lineTo(pipeTurnX, pumpCenterY);
        ctx.lineTo(pipeEndX, pumpCenterY);
      }
      ctx.stroke();

      // Pipe inner fluid channel
      ctx.strokeStyle = isHot ? '#451a03' : '#082f49';
      ctx.lineWidth = pipeDiameterPx;
      ctx.beginPath();
      if (isSuctionLift) {
        ctx.moveTo(pipeStartX, pipeStartY);
        ctx.lineTo(pipeStartX, pumpCenterY);
        ctx.lineTo(pipeEndX, pumpCenterY);
      } else {
        ctx.moveTo(pipeStartX, pipeStartY);
        ctx.lineTo(pipeTurnX, pipeStartY);
        ctx.lineTo(pipeTurnX, pumpCenterY);
        ctx.lineTo(pipeEndX, pumpCenterY);
      }
      ctx.stroke();

      // Reducer Flange at Impeller Eye
      ctx.fillStyle = '#64748b';
      ctx.fillRect(pipeReducerStartX, pumpCenterY - pipeDiameterPx / 2 - 4, 6, pipeDiameterPx + 8);
      ctx.fillRect(pipeEndX - 4, pumpCenterY - pipeDiameterPx * 0.38 - 4, 6, pipeDiameterPx * 0.76 + 8);

      // Continuity Velocity Annotation: V_pipe vs V_eye
      const vPipe = currentOutputs.fluidVelocityMs || 1.4;
      const vEye = eulerData.vm1Ms;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`V_pipe = ${vPipe.toFixed(2)} m/s`, (pipeTurnX + pipeReducerStartX) / 2, pumpCenterY - pipeDiameterPx / 2 - 6);

      // 4. VALVES & STRAINERS RESTRICTIONS
      const valveX = isSuctionLift ? pipeStartX + (pipeEndX - pipeStartX) * 0.32 : pipeTurnX + (pipeReducerStartX - pipeTurnX) * 0.3;
      const strainerX = isSuctionLift ? pipeStartX + (pipeEndX - pipeStartX) * 0.65 : pipeTurnX + (pipeReducerStartX - pipeTurnX) * 0.72;

      // Suction Throttling Valve
      const valveOpening = currentInputs.valveOpeningPercent ?? 100;
      ctx.save();
      ctx.translate(valveX, pumpCenterY);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-6, -pipeDiameterPx / 2 - 6, 12, pipeDiameterPx + 12);
      ctx.fillStyle = valveOpening < 50 ? '#ef4444' : '#f27d26';
      ctx.fillRect(-2, -pipeDiameterPx / 2 - 18, 4, 13);
      ctx.fillRect(-10, -pipeDiameterPx / 2 - 21, 20, 4);

      const discAngle = ((100 - valveOpening) / 100) * (Math.PI / 2.2);
      ctx.save();
      ctx.rotate(discAngle);
      ctx.fillStyle = valveOpening < 50 ? '#ef4444' : '#cbd5e1';
      ctx.fillRect(-1.5, -pipeDiameterPx / 2 + 1, 3, pipeDiameterPx - 2);
      ctx.restore();

      ctx.fillStyle = valveOpening < 50 ? '#ef4444' : '#94a3b8';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Valve: ${valveOpening}%`, 0, pipeDiameterPx / 2 + 13);
      ctx.restore();

      // Suction Strainer (Fouling)
      const isFouled = currentInputs.foulingFactor > 1.3 || currentInputs.scenarioId === 'suction_strainer_blocked';
      ctx.save();
      ctx.translate(strainerX, pumpCenterY);
      ctx.fillStyle = isFouled ? '#78350f' : '#475569';
      ctx.fillRect(-5, -pipeDiameterPx / 2 - 4, 10, pipeDiameterPx + 8);
      ctx.strokeStyle = isFouled ? '#b45309' : '#94a3b8';
      ctx.lineWidth = 1;
      for (let y = -pipeDiameterPx / 2; y <= pipeDiameterPx / 2; y += 4) {
        ctx.beginPath();
        ctx.moveTo(-4, y);
        ctx.lineTo(4, y);
        ctx.stroke();
      }
      ctx.fillStyle = isFouled ? '#ea580c' : '#94a3b8';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isFouled ? `Fouled (${currentInputs.foulingFactor.toFixed(1)}x)` : 'Strainer', 0, pipeDiameterPx / 2 + 13);
      ctx.restore();

      // 5. ANIMATED FLOW PARTICLES WITH CONTINUITY LAW (A1*V1 = A2*V2)
      const baseFlowSpeed = (vPipe / 1.5) * (animActive ? 1 : 0);
      updateFluidParticles(particlesRef.current, baseFlowSpeed, dt, reducedMotion);

      particlesRef.current.forEach((p) => {
        let px = 0;
        let py = 0;

        if (isSuctionLift) {
          if (p.progress < 0.5) {
            const t = p.progress / 0.5;
            px = pipeStartX + p.offsetY * 0.4;
            py = pipeStartY - t * (pipeStartY - pumpCenterY);
          } else {
            const t = (p.progress - 0.5) / 0.5;
            px = pipeStartX + t * (pipeEndX - pipeStartX);
            py = pumpCenterY + p.offsetY * 0.4;
          }
        } else {
          if (p.progress < 0.35) {
            const t = p.progress / 0.35;
            px = pipeStartX + t * (pipeTurnX - pipeStartX);
            py = pipeStartY + p.offsetY * 0.4;
          } else if (p.progress < 0.7) {
            const t = (p.progress - 0.35) / 0.35;
            px = pipeTurnX + p.offsetY * 0.4;
            py = pipeStartY + t * (pumpCenterY - pipeStartY);
          } else {
            const t = (p.progress - 0.7) / 0.3;
            px = pipeTurnX + t * (pipeEndX - pipeTurnX);
            py = pumpCenterY + p.offsetY * 0.4;
          }
        }

        // Particle color: red if cavitating, amber if hot, sky-blue normal
        ctx.fillStyle = isCritical ? '#f87171' : isHot ? '#fdba74' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Gas Entrainment air pockets
      const gasPercent = currentInputs.gasEntrainmentPercent ?? 0;
      if (gasPercent > 0 && animActive) {
        gasPocketsRef.current.forEach((g) => {
          g.progress += dt * g.speed * baseFlowSpeed * 0.45;
          if (g.progress > 1.0) g.progress = 0;

          const gx = pipeStartX + g.progress * (pipeEndX - pipeStartX);
          const gy = pumpCenterY + g.offsetY;

          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(gx, gy, g.size, g.size * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
      }

      // 6. SUCTION RECIRCULATION BACKFLOW VORTICES (Q < Q_rec)
      if (showRecirculationVortices && eulerData.isRecirculating) {
        // Spawn counter-flowing spiral vortex filaments
        if (animActive && Math.random() < 0.4 * eulerData.recirculationIntensity) {
          if (recirculationVorticesRef.current.length < 24) {
            const side = Math.random() > 0.5 ? 1 : -1;
            recirculationVorticesRef.current.push({
              x: pipeEndX - 8,
              y: pumpCenterY + side * (pipeDiameterPx / 2 - 3),
              angle: Math.random() * Math.PI * 2,
              radius: 4 + Math.random() * 5,
              speed: 25 + Math.random() * 35,
              life: 0.8,
              maxLife: 0.8,
            });
          }
        }

        // Draw and update recirculation vortices
        for (let i = recirculationVorticesRef.current.length - 1; i >= 0; i--) {
          const v = recirculationVorticesRef.current[i];
          if (animActive) {
            v.life -= dt;
            v.x -= v.speed * dt; // Travels BACKWARD against forward core flow!
            v.angle += dt * 14;
          }
          const alpha = Math.max(0, v.life / v.maxLife);

          ctx.save();
          ctx.translate(v.x, v.y);
          ctx.rotate(v.angle);
          ctx.strokeStyle = `rgba(245, 158, 11, ${alpha * 0.85})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(0, 0, v.radius, 0, Math.PI * 1.5);
          ctx.stroke();

          // Low-pressure core vapor string inside vortex center
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
          ctx.beginPath();
          ctx.arc(0, 0, v.radius * 0.35, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          if (v.life <= 0 || v.x < pipeTurnX) {
            recirculationVorticesRef.current.splice(i, 1);
          }
        }

        // Suction Recirculation Inset Banner
        ctx.fillStyle = 'rgba(217, 119, 6, 0.9)';
        ctx.fillRect(pipeTurnX + 10, pumpCenterY + pipeDiameterPx / 2 + 18, 180, 22);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(
          `⚡ SUCTION RECIRCULATION ACTIVE (Q/Q_rec = ${eulerData.recirculationRatio.toFixed(2)})`,
          pipeTurnX + 14,
          pumpCenterY + pipeDiameterPx / 2 + 32
        );
      }

      // 7. CENTRIFUGAL PUMP VOLUTE & CASING
      ctx.save();
      ctx.translate(pumpCenterX, pumpCenterY);

      // Volute casing profile
      const casingGrad = createMetallicSteelGradient(ctx, -pumpRadius, -pumpRadius, pumpRadius, pumpRadius, 'cast_iron');
      ctx.fillStyle = casingGrad;
      ctx.strokeStyle = isCritical ? '#ef4444' : '#475569';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2; a += 0.05) {
        const r = pumpRadius * (0.78 + (a / (Math.PI * 2)) * 0.28);
        const vx = Math.cos(a) * r;
        const vy = Math.sin(a) * r;
        if (a === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Discharge Nozzle
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.rect(pumpRadius * 0.42, -pumpRadius * 1.35, pumpRadius * 0.42, pumpRadius * 0.85);
      ctx.fill();
      ctx.stroke();

      // Discharge Flange
      ctx.fillStyle = '#64748b';
      ctx.fillRect(pumpRadius * 0.36, -pumpRadius * 1.38, pumpRadius * 0.54, 8);

      // Rotating Impeller Assembly
      ctx.save();
      ctx.rotate(rotationAngleRef.current);

      // Impeller Hub
      const impellerSteelGrad = createMetallicSteelGradient(ctx, -32, -32, 32, 32, 'bronze');
      ctx.fillStyle = impellerSteelGrad;
      ctx.strokeStyle = isCritical ? '#ef4444' : '#f27d26';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, pumpRadius * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 6 Backward Curved Impeller Vanes
      const numVanes = 6;
      for (let i = 0; i < numVanes; i++) {
        const vaneAngle = (i * (2 * Math.PI)) / numVanes;
        ctx.save();
        ctx.rotate(vaneAngle);

        // Vane contour
        ctx.strokeStyle = isCritical ? '#ef4444' : '#f27d26';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(pumpRadius * 0.34, 0);
        ctx.quadraticCurveTo(pumpRadius * 0.65, pumpRadius * 0.28, pumpRadius * 0.96, pumpRadius * 0.12);
        ctx.stroke();

        // Persistent pitting damage scars along blade suction face
        if (showRayleighPitting) {
          pittingScarsRef.current.forEach((scar) => {
            if (scar.vaneIndex === i) {
              const bx = pumpRadius * (0.34 + scar.bladeT * 0.5);
              const by = scar.bladeT * (pumpRadius * 0.22) + scar.offsetNormal;
              ctx.fillStyle = `rgba(185, 28, 28, ${scar.alpha})`;
              ctx.beginPath();
              ctx.arc(bx, by, scar.radiusPx, 0, Math.PI * 2);
              ctx.fill();
            }
          });
        }

        ctx.restore();
      }

      ctx.restore(); // Restore rotating impeller frame

      // 8. RAYLEIGH-PLESSET BUBBLE DYNAMICS, MICRO-JETS & PITTING SHOCKWAVES
      if (showRayleighPitting && animActive && currentOutputs.cavitationRiskPercent > 5) {
        const spawnCount = isCritical ? 5 : isWarning ? 2 : 1;
        for (let s = 0; s < spawnCount; s++) {
          if (bubblesRef.current.length < (isCritical ? 90 : 35)) {
            const chosenVane = Math.floor(Math.random() * numVanes);
            const rInit = pumpRadius * 0.35 + Math.random() * pumpRadius * 0.15;
            const angleInit = rotationAngleRef.current + (chosenVane * 2 * Math.PI) / numVanes + (Math.random() - 0.5) * 0.25;

            bubblesRef.current.push({
              vaneIndex: chosenVane,
              bladeT: 0.05,
              x: Math.cos(angleInit) * rInit,
              y: Math.sin(angleInit) * rInit,
              radiusMm: 0.4,
              maxRadiusMm: rayleighState.maxTheoreticalRadiusMm * (0.6 + Math.random() * 0.8),
              growthPhase: 'expanding',
              microJetAngle: angleInit + Math.PI * 0.8,
              microJetVelocityMs: rayleighState.microJetVelocityMs,
              shockwaveRadiusPx: 0,
              shockwaveAlpha: 0,
              alpha: 1.0,
              life: 0.5,
              maxLife: 0.5,
            });
          }
        }
      }

      // Update and render Rayleigh-Plesset bubbles & micro-jets
      for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
        const b = bubblesRef.current[i];
        if (animActive) {
          b.life -= dt;
          b.bladeT += dt * 1.8; // sweeps along blade

          if (b.growthPhase === 'expanding') {
            b.radiusMm = Math.min(b.maxRadiusMm, b.radiusMm + dt * 12);
            if (b.radiusMm >= b.maxRadiusMm * 0.95 || b.bladeT > 0.4) {
              b.growthPhase = 'collapsing';
            }
          } else if (b.growthPhase === 'collapsing') {
            b.radiusMm = Math.max(0.1, b.radiusMm - dt * 25);
            if (b.radiusMm <= 0.2) {
              b.growthPhase = 'microjet';
              b.shockwaveAlpha = 1.0;
              b.shockwaveRadiusPx = 2;

              // Deposit persistent pitting scar on blade if severe cavitation
              if (rayleighState.willPittingOccur && Math.random() < 0.35) {
                if (pittingScarsRef.current.length > 120) {
                  pittingScarsRef.current.shift();
                }
                pittingScarsRef.current.push({
                  vaneIndex: b.vaneIndex,
                  bladeT: Math.min(0.8, Math.max(0.1, b.bladeT)),
                  offsetNormal: (Math.random() - 0.5) * 4,
                  radiusPx: 1.2 + Math.random() * 2.2,
                  alpha: 0.9,
                  timestamp: simTimeRef.current,
                });
              }
            }
          } else if (b.growthPhase === 'microjet') {
            b.shockwaveRadiusPx += dt * 65;
            b.shockwaveAlpha = Math.max(0, b.shockwaveAlpha - dt * 6.5);
          }
        }

        b.alpha = Math.max(0, b.life / b.maxLife);

        if (b.growthPhase !== 'microjet') {
          // Render spherical vapor cavity
          const bubblePx = Math.max(1.5, (b.radiusMm / 2.5) * 6);
          ctx.fillStyle = isCritical ? 'rgba(254, 202, 202, 0.9)' : 'rgba(255, 255, 255, 0.85)';
          ctx.strokeStyle = isCritical ? '#ef4444' : '#38bdf8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(b.x, b.y, bubblePx, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (b.shockwaveAlpha > 0) {
          // Render asymmetric micro-jet vector & impact shockwave ring
          ctx.save();
          ctx.strokeStyle = `rgba(239, 68, 68, ${b.shockwaveAlpha * 1.5})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.shockwaveRadiusPx, 0, Math.PI * 2);
          ctx.stroke();

          // High-velocity micro-jet arrow
          const jetLen = 14;
          const jx = b.x + Math.cos(b.microJetAngle) * jetLen;
          const jy = b.y + Math.sin(b.microJetAngle) * jetLen;
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(jx, jy);
          ctx.stroke();
          ctx.restore();
        }

        if (b.life <= 0 || (b.growthPhase === 'microjet' && b.shockwaveAlpha <= 0)) {
          bubblesRef.current.splice(i, 1);
        }
      }

      // Impeller Suction Eye Center (Static Datum Zone)
      ctx.fillStyle = isCritical
        ? 'rgba(239, 68, 68, 0.35)'
        : isWarning
        ? 'rgba(242, 125, 38, 0.25)'
        : 'rgba(56, 189, 248, 0.18)';
      ctx.strokeStyle = isCritical ? '#ef4444' : isWarning ? '#f27d26' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, pumpRadius * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isCritical ? '#f87171' : '#94a3b8';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Impeller Eye', 0, 3);

      // 9. EULER VELOCITY TRIANGLES OVERLAY (INLET 1 & DISCHARGE 2)
      if (showEulerTriangles) {
        ctx.save();
        // INLET TRIANGLE AT BLADE LEADING EDGE (r = r1)
        const inOriginX = -pumpRadius * 0.34;
        const inOriginY = -pumpRadius * 0.08;
        const vecScale = 2.4;

        ctx.translate(inOriginX, inOriginY);

        // Blade tangential speed U1 (vertical downwards or tangential)
        const u1Len = eulerData.u1Ms * vecScale;
        const vm1Len = eulerData.vm1Ms * vecScale * 2.2;

        // U1 Vector (Green: Blade Speed)
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, u1Len);
        ctx.stroke();
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`U₁=${eulerData.u1Ms.toFixed(1)}m/s`, -4, u1Len / 2);

        // Vm1 Vector (Cyan: Through-flow Velocity)
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, u1Len);
        ctx.lineTo(-vm1Len, u1Len);
        ctx.stroke();
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Vm₁=${eulerData.vm1Ms.toFixed(1)}`, -vm1Len / 2, u1Len + 10);

        // W1 Relative Velocity (Amber: Relative Flow Vector)
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-vm1Len, u1Len);
        ctx.stroke();
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`W₁=${eulerData.w1Ms.toFixed(1)}`, -vm1Len - 4, u1Len / 2);

        // Incidence angle indicator & separation warning
        const incColor = eulerData.incidenceState === 'shockless' ? '#34d399' : '#f43f5e';
        ctx.fillStyle = incColor;
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(
          `i = ${eulerData.incidenceAngleDeg >= 0 ? '+' : ''}${eulerData.incidenceAngleDeg.toFixed(1)}° (${eulerData.incidenceState.replace('_', ' ').toUpperCase()})`,
          -vm1Len,
          -8
        );

        ctx.restore();

        // DISCHARGE EULER TRIANGLE (TIP r = r2)
        ctx.save();
        const outOriginX = pumpRadius * 0.72;
        const outOriginY = -pumpRadius * 0.85;
        ctx.translate(outOriginX, outOriginY);

        // Euler tip vectors
        const u2Len = eulerData.u2Ms * 1.3;
        const vu2Len = eulerData.vu2Ms * 1.3;
        const vm2Len = eulerData.vm2Ms * 2.8;

        // U2 Tip Speed
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(u2Len, 0);
        ctx.stroke();
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`U₂=${eulerData.u2Ms.toFixed(1)}m/s`, u2Len / 2, -6);

        // Vu2 Whirl & Vm2 Meridional
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(vu2Len, -vm2Len);
        ctx.stroke();
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`V₂=${eulerData.v2Ms.toFixed(1)} (Euler H = ${eulerData.eulerHeadM.toFixed(1)}m)`, vu2Len + 4, -vm2Len);

        ctx.restore();
      }

      ctx.restore(); // Restore pump center coordinate frame

      // 10. REAL-TIME ACOUSTIC FFT & DECIBEL GAUGE (Bottom Left HUD)
      if (!isAudioMuted) {
        const synth = getPumpAcousticSynthesizer();
        synth.getSpectrumData(audioBufferRef.current);

        ctx.save();
        ctx.translate(35, baseH * 0.74);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(0, 0, 195, 62, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('Acoustic Spectrum (Web Audio FFT)', 8, 14);

        // Render 14-bar frequency visualizer
        const barW = 9;
        const barGap = 3;
        for (let b = 0; b < 14; b++) {
          const val = audioBufferRef.current[b * 2] || 0;
          const barH = Math.min(32, (val / 255) * 32);
          const isHighFreq = b >= 8;
          ctx.fillStyle = isHighFreq && isCritical ? '#ef4444' : isCritical ? '#f59e0b' : '#10b981';
          ctx.fillRect(8 + b * (barW + barGap), 50 - barH, barW, barH);
        }

        const estDb = Math.round(62 + cavitationIntensity * 31);
        ctx.fillStyle = isCritical ? '#f87171' : '#94a3b8';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${estDb} dB SPL`, 187, 14);
        ctx.restore();
      }

      // 11. RAYLEIGH-PLESSET MICRO-PHYSICS METRICS HUD (Bottom Right)
      if (showRayleighPitting && currentOutputs.cavitationRiskPercent > 5) {
        ctx.save();
        ctx.translate(baseW - 250, baseH * 0.70);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = isCritical ? '#ef4444' : '#334155';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(0, 0, 220, 84, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isCritical ? '#f87171' : '#f59e0b';
        ctx.font = 'bold 9.5px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('⚡ Rayleigh–Plesset Cavitation HUD', 10, 16);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '8.5px monospace';
        ctx.fillText(`• Min Eye Pressure : ${rayleighState.minPressureKPa.toFixed(1)} kPa (P_v=${rayleighState.vaporPressureKPa.toFixed(1)})`, 10, 31);
        ctx.fillText(`• Max Bubble Size   : ${(rayleighState.maxTheoreticalRadiusMm * 2).toFixed(1)} mm`, 10, 44);
        ctx.fillText(`• Micro-Jet Velocity: ${rayleighState.microJetVelocityMs.toFixed(0)} m/s`, 10, 57);
        ctx.fillText(
          `• Impact Shock Peak : ${rayleighState.impactPressureGPa.toFixed(2)} GPa (Yield 0.24)`,
          10,
          70
        );

        ctx.restore();
      }

      // 12. Engineering Status Banner (Bottom)
      if (isCritical) {
        ctx.fillStyle = 'rgba(220, 38, 38, 0.94)';
        ctx.fillRect(baseW * 0.04, baseH * 0.89, baseW * 0.92, 28);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          `⚡ SEVERE CAVITATION: NPSHa (${currentOutputs.npshaM.toFixed(2)}m) ≤ NPSHr (${currentOutputs.npshrM.toFixed(2)}m) | Micro-Jet Implosion Pitting Active (${rayleighState.pittingRatePitsPerSec} pits/s)`,
          baseW / 2,
          baseH * 0.89 + 18
        );
      } else if (isWarning) {
        ctx.fillStyle = 'rgba(217, 119, 6, 0.92)';
        ctx.fillRect(baseW * 0.04, baseH * 0.89, baseW * 0.92, 28);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          `⚠️ LOW NPSH MARGIN: NPSHa (${currentOutputs.npshaM.toFixed(2)}m) < Required Margin (${(currentOutputs.npshrM + currentOutputs.requiredSafetyMarginM).toFixed(2)}m) | Incipient Bubble Inception`,
          baseW / 2,
          baseH * 0.89 + 18
        );
      } else {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.88)';
        ctx.fillRect(baseW * 0.04, baseH * 0.89, baseW * 0.92, 28);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          `✓ OPTIMAL FLOW: Safe NPSH Margin Δ = +${currentOutputs.npshMarginM.toFixed(2)}m (${currentOutputs.npshMarginRatio.toFixed(2)}x NPSHr) | Shockless Vane Entry (i=${eulerData.incidenceAngleDeg.toFixed(1)}°)`,
          baseW / 2,
          baseH * 0.89 + 18
        );
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    width,
    height,
    currentInputs,
    currentOutputs,
    unitSystem,
    isAnimRunning,
    reducedMotion,
    isCritical,
    isWarning,
    cavitationIntensity,
    showEulerTriangles,
    showRayleighPitting,
    showRecirculationVortices,
    isAudioMuted,
    eulerData,
    rayleighState,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full block select-none"
    />
  );
};
