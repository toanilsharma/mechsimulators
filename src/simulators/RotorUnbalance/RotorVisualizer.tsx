import React, { useRef, useEffect, useState, useMemo } from 'react';
import { RotorInputs, RotorOutputs } from '../../types/rotor';
import { UnitSystem } from '../../types/common';
import { VisualCanvas } from '../../components/Shared/VisualCanvas';
import { convertForce, formatNum } from '../../utils/units';
import { getBearing } from '../../utils/bearingData';
import {
  calculateAnisotropicOrbit,
  calculateShaftModeShapes,
  calculateBearingDefectFrequencies,
  AnisotropicOrbitResult,
  ShaftModeShapeResult,
  BearingFaultFrequencies,
} from '../../physics/rotorAnisotropicMath';
import {
  getRotorAcousticSynthesizer,
} from '../../utils/rotorAcousticSynthesizer';
import {
  Volume2,
  VolumeX,
  Compass,
  Zap,
  Activity,
  Waves,
  Sliders,
  AlertTriangle,
  Layers,
} from 'lucide-react';

interface RotorVisualizerProps {
  inputs: RotorInputs;
  outputs: RotorOutputs;
  isRunning?: boolean;
  unitSystem: UnitSystem;
}

export const RotorVisualizer: React.FC<RotorVisualizerProps> = ({
  inputs,
  outputs,
  isRunning = true,
  unitSystem,
}) => {
  // Layer toggles
  const [showAnisotropicOrbit, setShowAnisotropicOrbit] = useState<boolean>(true);
  const [showModeShapes, setShowModeShapes] = useState<boolean>(true);
  const [showHertzianDefects, setShowHertzianDefects] = useState<boolean>(true);
  
  // Interactive bearing simulation overrides
  const [activeBearingType, setActiveBearingType] = useState<'rolling_element' | 'hydrodynamic_sleeve' | 'tilting_pad'>('rolling_element');
  const [activeDefect, setActiveDefect] = useState<'none' | 'bpfo' | 'bpfi' | 'bsf'>('none');
  const [activeMode, setActiveMode] = useState<1 | 2 | 3>(1);

  // Audio state
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
  const [audioVolume, setAudioVolume] = useState<number>(0.6);

  const handleToggleSound = () => {
    const synth = getRotorAcousticSynthesizer();
    const nextMuted = !isAudioMuted;
    synth.setMuted(nextMuted);
    synth.setVolume(audioVolume);
    setIsAudioMuted(nextMuted);
  };

  const handleVolumeChange = (newVol: number) => {
    setAudioVolume(newVol);
    const synth = getRotorAcousticSynthesizer();
    synth.setVolume(newVol);
  };

  const bearingInfo = getBearing(inputs.bearingModelId);
  const forceConv = convertForce(outputs.dynamicUnbalanceForceN, unitSystem);
  const isResonance = outputs.isNearCriticalSpeed;
  const isBladeLoss = inputs.scenarioId === 'blade_loss_event';
  const isLubeLoss = inputs.scenarioId === 'lubrication_loss' || inputs.lubricationCondition === 'poor';
  const isOverload = inputs.scenarioId === 'bearing_overload' || outputs.loadRatioCP < 4.0;
  const isHighTemp = inputs.scenarioId === 'high_temp_degradation' || (inputs.bearingOperatingTempC && inputs.bearingOperatingTempC >= 90);

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
          title={isAudioMuted ? 'Turn on rotor & bearing acoustics' : 'Mute rotor sound'}
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
              className="w-14 h-1 accent-amber-500 bg-slate-700 rounded cursor-pointer"
              title={`Acoustic Volume: ${Math.round(audioVolume * 100)}%`}
            />
          </div>
        )}
      </div>

      {/* Bearing Archetype Selector */}
      <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-md p-0.5 gap-1 text-[11px]">
        <span className="text-slate-400 px-1 font-mono text-[10px]">Brg Type:</span>
        <button
          onClick={() => setActiveBearingType('rolling_element')}
          className={`px-1.5 py-0.5 rounded transition-colors ${
            activeBearingType === 'rolling_element'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-medium'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Rolling
        </button>
        <button
          onClick={() => setActiveBearingType('hydrodynamic_sleeve')}
          className={`px-1.5 py-0.5 rounded transition-colors ${
            activeBearingType === 'hydrodynamic_sleeve'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Hydrodynamic Fluid-Film Sleeve (Oil Wedge, Cross-Coupling, Whirl/Whip)"
        >
          Fluid Sleeve
        </button>
        <button
          onClick={() => setActiveBearingType('tilting_pad')}
          className={`px-1.5 py-0.5 rounded transition-colors ${
            activeBearingType === 'tilting_pad'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-medium'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Tilting-Pad Journal Bearing (Zero Cross-Coupling)"
        >
          Tilt-Pad
        </button>
      </div>

      {/* Bearing Defect Injector */}
      <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-md p-0.5 gap-1 text-[11px]">
        <span className="text-slate-400 px-1 font-mono text-[10px]">Defect:</span>
        {(['none', 'bpfo', 'bpfi', 'bsf'] as const).map((def) => (
          <button
            key={def}
            onClick={() => setActiveDefect(def)}
            className={`px-1.5 py-0.5 rounded uppercase font-mono text-[10px] transition-colors ${
              activeDefect === def
                ? def === 'none'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {def}
          </button>
        ))}
      </div>

      {/* Mode Shape Selector */}
      <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-md p-0.5 gap-1 text-[11px]">
        <span className="text-slate-400 px-1 font-mono text-[10px]">Mode:</span>
        {([1, 2, 3] as const).map((m) => (
          <button
            key={m}
            onClick={() => setActiveMode(m)}
            className={`px-1.5 py-0.5 rounded font-mono text-[10px] transition-colors ${
              activeMode === m
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {m === 1 ? '1st (Bounce)' : m === 2 ? '2nd (Conical)' : '3rd (Bending)'}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col">
      <VisualCanvas<RotorInputs, RotorOutputs>
        simulator="rotor"
        inputs={inputs}
        outputs={outputs}
        unitSystem={unitSystem}
        isRunning={isRunning}
        title="Rotor Dynamics & Bearing Tribology Digital Twin (API 684 / ISO 281)"
        subtitle="Anisotropic fluid-film orbits, spatial flexural bending mode shapes, Hertzian contact stress & fault frequencies"
        headerControls={headerControls}
        renderVisual={({ containerWidth, containerHeight, isRunning, reducedMotion }) => {
          return (
            <RotorCanvasRenderer
              width={containerWidth}
              height={containerHeight}
              inputs={inputs}
              outputs={outputs}
              unitSystem={unitSystem}
              isRunning={isRunning}
              reducedMotion={reducedMotion}
              bearingInfo={bearingInfo}
              isResonance={isResonance}
              isBladeLoss={isBladeLoss}
              isLubeLoss={isLubeLoss}
              isOverload={isOverload}
              isHighTemp={isHighTemp}
              activeBearingType={activeBearingType}
              activeDefect={activeDefect}
              activeMode={activeMode}
              isAudioMuted={isAudioMuted}
            />
          );
        }}
      />
    </div>
  );
};

interface RotorCanvasRendererProps {
  width: number;
  height: number;
  inputs: RotorInputs;
  outputs: RotorOutputs;
  unitSystem: UnitSystem;
  isRunning: boolean;
  reducedMotion: boolean;
  bearingInfo: any;
  isResonance: boolean;
  isBladeLoss: boolean;
  isLubeLoss: boolean;
  isOverload: boolean;
  isHighTemp: boolean;
  activeBearingType: 'rolling_element' | 'hydrodynamic_sleeve' | 'tilting_pad';
  activeDefect: 'none' | 'bpfo' | 'bpfi' | 'bsf';
  activeMode: 1 | 2 | 3;
  isAudioMuted: boolean;
}

const RotorCanvasRenderer: React.FC<RotorCanvasRendererProps> = ({
  width,
  height,
  inputs,
  outputs,
  unitSystem,
  isRunning,
  reducedMotion,
  bearingInfo,
  isResonance,
  isBladeLoss,
  isLubeLoss,
  isOverload,
  isHighTemp,
  activeBearingType,
  activeDefect,
  activeMode,
  isAudioMuted,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shaftAngleRef = useRef<number>(0);
  const cageAngleRef = useRef<number>(0);
  const orbitTrailRef = useRef<Array<{ x: number; y: number; alpha: number }>>([]);
  const pulsePhaseRef = useRef<number>(0);
  const oscWaveformRef = useRef<number[]>(new Array(60).fill(0));

  // Compute Anisotropic Orbit & Fluid-Film state
  const orbitData = useMemo<AnisotropicOrbitResult>(() => {
    return calculateAnisotropicOrbit({
      operatingRpm: inputs.operatingRpm,
      rotorMassKg: inputs.rotorMassKg,
      unbalanceMassGrams: inputs.unbalanceMassGrams,
      unbalanceRadiusMm: inputs.unbalanceRadiusMm,
      criticalSpeedRpm: outputs.criticalSpeedRpm,
      dampingRatio: inputs.dampingRatio || 0.05,
      bearingType: activeBearingType,
      shaftLengthMm: inputs.bearingSpanMm || 800,
      shaftDiameterMm: 65,
      radialLoadN: outputs.equivalentDynamicLoadP_N || 3500,
      bearingDefect: activeDefect,
    });
  }, [inputs.operatingRpm, inputs.rotorMassKg, inputs.unbalanceMassGrams, inputs.unbalanceRadiusMm, outputs.criticalSpeedRpm, inputs.dampingRatio, activeBearingType, inputs.bearingSpanMm, outputs.equivalentDynamicLoadP_N, activeDefect]);

  // Compute Spatial Mode Shapes & Fiber Stress
  const modeData = useMemo<ShaftModeShapeResult>(() => {
    return calculateShaftModeShapes(
      activeMode,
      inputs.bearingSpanMm || 800,
      65,
      outputs.criticalSpeedRpm,
      outputs.vibrationDisplacementPkPkMicrons
    );
  }, [activeMode, inputs.bearingSpanMm, outputs.criticalSpeedRpm, outputs.vibrationDisplacementPkPkMicrons]);

  // Compute Bearing Kinematics, Fault Frequencies & Hertzian Stress
  const defectData = useMemo<BearingFaultFrequencies>(() => {
    return calculateBearingDefectFrequencies({
      operatingRpm: inputs.operatingRpm,
      boreDiameterMm: bearingInfo.boreMm || 50,
      outerDiameterMm: bearingInfo.outerDiameterMm || 110,
      radialLoadN: outputs.equivalentDynamicLoadP_N || 3500,
      numBalls: 8,
      contactAngleDeg: 0,
    });
  }, [inputs.operatingRpm, bearingInfo.boreMm, bearingInfo.outerDiameterMm, outputs.equivalentDynamicLoadP_N]);

  // Sync acoustic synthesizer
  useEffect(() => {
    const synth = getRotorAcousticSynthesizer();
    synth.updateParameters({
      operatingRpm: inputs.operatingRpm,
      unbalanceForceN: outputs.dynamicUnbalanceForceN,
      isResonance,
      isOilWhirlActive: orbitData.isOilWhirlActive,
      isOilWhipActive: orbitData.isOilWhipActive,
      bearingDefect: activeDefect,
      bpfoHz: defectData.bpfoHz,
      bpfiHz: defectData.bpfiHz,
      bsfHz: defectData.bsfHz,
    });
  }, [inputs.operatingRpm, outputs.dynamicUnbalanceForceN, isResonance, orbitData.isOilWhirlActive, orbitData.isOilWhipActive, activeDefect, defectData.bpfoHz, defectData.bpfiHz, defectData.bsfHz]);

  useEffect(() => {
    let animId: number;
    let lastT = performance.now();

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;

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

      const omega = outputs.angularVelocityRadS;
      if (isRunning && !reducedMotion) {
        const visualSpeedMult = Math.min(3.0, Math.max(0.35, inputs.operatingRpm / 1500));
        shaftAngleRef.current += omega * dt * 0.16 * visualSpeedMult;
        // Epicyclic planetary cage rotation rate
        cageAngleRef.current += (defectData.ftfHz * 2 * Math.PI) * dt * 0.16 * visualSpeedMult;
        pulsePhaseRef.current += dt * 4.5;
      }

      ctx.clearRect(0, 0, width, height);

      // Base Layout Coordinates
      const bedplateY = height * 0.72;
      const leftMargin = width * 0.05;
      const rightMargin = width * 0.58;
      const shaftCenterY = height * 0.42;
      const shaftLength = rightMargin - leftMargin;

      const isOverhung = inputs.bearingPosition === 'overhung' || inputs.machineType === 'fan';
      const brg1X = isOverhung ? leftMargin + shaftLength * 0.16 : leftMargin + shaftLength * 0.20;
      const brg2X = isOverhung ? leftMargin + shaftLength * 0.58 : leftMargin + shaftLength * 0.80;
      const discX = isOverhung ? leftMargin + shaftLength * 0.88 : leftMargin + shaftLength * 0.50;

      // 1. Bedplate heavy steel base
      const bedGrad = ctx.createLinearGradient(0, bedplateY, 0, bedplateY + 45);
      bedGrad.addColorStop(0, '#1e293b');
      bedGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = bedGrad;
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(leftMargin - 20, bedplateY, shaftLength + 40, 36, 4);
      ctx.fill();
      ctx.stroke();

      // Bedplate vibration isolator ribs
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      for (let bx = leftMargin; bx <= rightMargin; bx += 40) {
        ctx.beginPath();
        ctx.moveTo(bx, bedplateY + 6);
        ctx.lineTo(bx + 15, bedplateY + 30);
        ctx.stroke();
      }

      // Horizontal Centerline Datum
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(leftMargin - 25, shaftCenterY);
      ctx.lineTo(rightMargin + 25, shaftCenterY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. SHAFT SPATIAL MODE SHAPE DEFLECTION & FIBER BENDING STRESS
      const baseWhirlAmp = Math.min(28, Math.max(3.0, (orbitData.semiMajorAxisUm / 8.0) * 3.5));
      const dynamicDeflectionSign = Math.sin(shaftAngleRef.current);

      // Draw Color-Coded Fiber Stress along Deflected Shaft Curve
      ctx.save();
      const nSegments = modeData.points.length - 1;
      for (let s = 0; s < nSegments; s++) {
        const pt1 = modeData.points[s];
        const pt2 = modeData.points[s + 1];

        const x1 = leftMargin + pt1.normalizedZ * shaftLength;
        const x2 = leftMargin + pt2.normalizedZ * shaftLength;

        const y1 = shaftCenterY + pt1.deflectionNorm * baseWhirlAmp * dynamicDeflectionSign;
        const y2 = shaftCenterY + pt2.deflectionNorm * baseWhirlAmp * dynamicDeflectionSign;

        // Bending stress color gradient: Cyan -> Amber -> Crimson Red
        const stressFraction = Math.min(1.0, pt1.fiberStressMPa / Math.max(1, modeData.maxBendingStressMPa));
        let segColor = '#38bdf8';
        if (stressFraction > 0.65) segColor = '#ef4444';
        else if (stressFraction > 0.35) segColor = '#f59e0b';

        ctx.strokeStyle = segColor;
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();

      // Shaft Centerline Core
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      modeData.points.forEach((pt, idx) => {
        const px = leftMargin + pt.normalizedZ * shaftLength;
        const py = shaftCenterY + pt.deflectionNorm * baseWhirlAmp * dynamicDeflectionSign;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Mode Shape Antinode / Node Labels
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `Mode ${activeMode}: ${modeData.modeName} | Peak σ_bending = ${modeData.maxBendingStressMPa.toFixed(1)} MPa`,
        leftMargin,
        shaftCenterY - 38
      );

      // 3. BEARING PEDESTALS & DETAILED BEARING CUTAWAY (HERTZIAN STRESS)
      const bearings = [
        { x: brg1X, label: 'Brg #1 (DE)', isCritical: false },
        { x: brg2X, label: 'Brg #2 (NDE)', isCritical: true },
      ];

      bearings.forEach((brg) => {
        const pedW = 38;

        // Cast Iron Pedestal Housing
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(brg.x - pedW / 2, shaftCenterY + 12);
        ctx.lineTo(brg.x - pedW / 2 - 8, bedplateY);
        ctx.lineTo(brg.x + pedW / 2 + 8, bedplateY);
        ctx.lineTo(brg.x + pedW / 2, shaftCenterY + 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Foundation Anchor Bolts
        ctx.fillStyle = '#64748b';
        ctx.fillRect(brg.x - pedW / 2 - 6, bedplateY - 6, 6, 6);
        ctx.fillRect(brg.x + pedW / 2, bedplateY - 6, 6, 6);

        if (activeBearingType === 'hydrodynamic_sleeve') {
          // Hydrodynamic Fluid-Film Sleeve Bearing Visual
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(brg.x, shaftCenterY, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Hydrodynamic Oil Film Crescent (Attitude Angle Wedge)
          ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
          ctx.beginPath();
          ctx.arc(brg.x + 3, shaftCenterY + 3, 17, 0, Math.PI * 2);
          ctx.fill();

          // Journal Steel Core
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.arc(brg.x, shaftCenterY, 13, 0, Math.PI * 2);
          ctx.fill();
        } else if (activeBearingType === 'tilting_pad') {
          // Tilting Pad Journal Bearing (4 Rocking Pads)
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(brg.x, shaftCenterY, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 4 Pivoting Pads
          for (let p = 0; p < 4; p++) {
            const padAng = (p * Math.PI) / 2 + Math.PI / 4;
            const px = brg.x + Math.cos(padAng) * 16;
            const py = shaftCenterY + Math.sin(padAng) * 16;
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Rolling Element Bearing with Hertzian Contact Stress
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = outputs.bearingLifeStatus === 'critical' ? '#ef4444' : '#10b981';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(brg.x, shaftCenterY, 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Outer Raceway
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(brg.x, shaftCenterY, 14, 0, Math.PI * 2);
          ctx.stroke();

          // Epicyclic Rolling Elements (8 Balls)
          const numElements = 8;
          for (let b = 0; b < numElements; b++) {
            const ballAng = (b * Math.PI * 2) / numElements + cageAngleRef.current;
            const ballX = brg.x + Math.cos(ballAng) * 14;
            const ballY = shaftCenterY + Math.sin(ballAng) * 14;

            // Check if ball is in bottom load zone (cos(ballAng) > 0 for vertical gravity)
            const isInLoadZone = Math.sin(ballAng) > 0.2;

            if (isInLoadZone) {
              // Hertzian Contact Stress Ellipse Highlight
              ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
              ctx.beginPath();
              ctx.ellipse(ballX, ballY + 2.5, 3.5, 1.5, 0, 0, Math.PI * 2);
              ctx.fill();
            }

            // Ball Body
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.arc(ballX, ballY, 3.8, 0, Math.PI * 2);
            ctx.fill();

            // Inject defect scar if selected
            if (activeDefect === 'bpfo' && b === 0) {
              // Outer race spall mark at bottom
              ctx.fillStyle = '#ef4444';
              ctx.fillRect(brg.x - 2, shaftCenterY + 12, 4, 3);
            } else if (activeDefect === 'bsf' && b === 2) {
              // Ball surface spall spot
              ctx.fillStyle = '#ef4444';
              ctx.beginPath();
              ctx.arc(ballX, ballY, 1.8, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        // Bearing Label
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 9px IBM Plex Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(brg.label, brg.x, bedplateY + 16);
      });

      // 4. ROTOR DISC, UNBALANCE PHASOR & CENTRIFUGAL ARROW
      const discRadius = Math.min(52, height * 0.16);
      const currentWhirlY = Math.sin(shaftAngleRef.current) * baseWhirlAmp;
      ctx.save();
      ctx.translate(discX, shaftCenterY + currentWhirlY);

      // Heavy Disc Body
      const discGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, discRadius);
      discGrad.addColorStop(0, '#334155');
      discGrad.addColorStop(0.6, '#1e293b');
      discGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = discGrad;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, discRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Rotating Spokes
      ctx.save();
      ctx.rotate(shaftAngleRef.current);
      for (let s = 0; s < 6; s++) {
        ctx.rotate(Math.PI / 3);
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.arc(discRadius * 0.68, 0, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Unbalance Phasor & Heavy Spot Mass (m_u)
      ctx.save();
      ctx.rotate(shaftAngleRef.current);
      const unbalanceR = discRadius * 0.84;
      ctx.strokeStyle = '#f27d26';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(unbalanceR, 0);
      ctx.stroke();

      ctx.fillStyle = outputs.iso10816Zone === 'D' ? '#ef4444' : '#10b981';
      ctx.beginPath();
      ctx.arc(unbalanceR, 0, isBladeLoss ? 10 : 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Centrifugal Force F_c Vector Arrow
      const forceLen = Math.min(52, Math.max(18, (outputs.dynamicUnbalanceForceN / 1200) * 26));
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(unbalanceR, 0);
      ctx.lineTo(unbalanceR + forceLen, 0);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(unbalanceR + forceLen + 7, 0);
      ctx.lineTo(unbalanceR + forceLen - 2, -5);
      ctx.lineTo(unbalanceR + forceLen - 2, 5);
      ctx.fill();
      ctx.restore();

      ctx.restore(); // Restore disc translate

      // 5. ANISOTROPIC TILTED ELLIPTICAL ORBIT SCOPE (TOP RIGHT INSET)
      const scopeCenterX = width * 0.79;
      const scopeCenterY = height * 0.26;
      const scopeSize = Math.min(115, height * 0.44);

      // Scope Frame Background
      ctx.fillStyle = '#020617';
      ctx.strokeStyle = '#30363d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(scopeCenterX - scopeSize / 2, scopeCenterY - scopeSize / 2, scopeSize, scopeSize, 6);
      ctx.fill();
      ctx.stroke();

      // Scope Reticle Axis Lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(scopeCenterX - scopeSize / 2, scopeCenterY);
      ctx.lineTo(scopeCenterX + scopeSize / 2, scopeCenterY);
      ctx.moveTo(scopeCenterX, scopeCenterY - scopeSize / 2);
      ctx.lineTo(scopeCenterX, scopeCenterY + scopeSize / 2);
      ctx.stroke();

      // Calibration rings
      [0.35, 0.70, 0.95].forEach((ringFrac) => {
        ctx.beginPath();
        ctx.arc(scopeCenterX, scopeCenterY, (scopeSize / 2) * ringFrac, 0, Math.PI * 2);
        ctx.strokeStyle = '#0f172a';
        ctx.stroke();
      });

      // Compute current orbit point on anisotropic ellipse
      const a_px = Math.min(scopeSize * 0.44, (orbitData.semiMajorAxisUm / 40) * (scopeSize * 0.35));
      const b_px = a_px * Math.max(0.2, 1 - orbitData.ellipticity * 0.7);
      const tiltRad = (orbitData.tiltAngleDeg * Math.PI) / 180;

      // Unrotated orbit coordinates
      const uX = Math.cos(shaftAngleRef.current) * a_px;
      const uY = Math.sin(shaftAngleRef.current) * b_px;

      // Rotated by tilt angle
      const curOrbX = scopeCenterX + uX * Math.cos(tiltRad) - uY * Math.sin(tiltRad);
      const curOrbY = scopeCenterY + uX * Math.sin(tiltRad) + uY * Math.cos(tiltRad);

      if (isRunning && !reducedMotion) {
        orbitTrailRef.current.push({ x: curOrbX, y: curOrbY, alpha: 1.0 });
        if (orbitTrailRef.current.length > 40) orbitTrailRef.current.shift();
      }

      // Draw Orbit Trail
      ctx.strokeStyle = orbitData.isOilWhipActive
        ? '#ef4444'
        : orbitData.isOilWhirlActive
        ? '#f59e0b'
        : '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      orbitTrailRef.current.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      // Current spot
      ctx.fillStyle = orbitData.isOilWhirlActive ? '#ef4444' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(curOrbX, curOrbY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Orbit Title & Measurements
      ctx.fillStyle = '#8b949e';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        activeBearingType === 'hydrodynamic_sleeve' ? 'Fluid-Film Elliptical Orbit' : '1X Anisotropic Orbit',
        scopeCenterX,
        scopeCenterY - scopeSize / 2 - 5
      );

      ctx.fillStyle = orbitData.isOilWhirlActive ? '#ef4444' : '#38bdf8';
      ctx.font = 'bold 8px monospace';
      ctx.fillText(
        `${orbitData.semiMajorAxisUm.toFixed(1)} µm (e=${orbitData.ellipticity.toFixed(2)}, θ=${orbitData.tiltAngleDeg}°)`,
        scopeCenterX,
        scopeCenterY + scopeSize / 2 + 12
      );

      // 6. FAULT SPECTRUM & OSCILLOSCOPE TIME-WAVEFORM (BOTTOM RIGHT INSET)
      const plotBoxX = width * 0.62;
      const plotBoxY = height * 0.55;
      const plotBoxW = width * 0.35;
      const plotBoxH = height * 0.40;

      // Plot Container
      ctx.fillStyle = '#020617';
      ctx.strokeStyle = '#30363d';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(plotBoxX, plotBoxY, plotBoxW, plotBoxH, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#8b949e';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('FFT Vibration Spectrum & Defect Cursors', plotBoxX + 8, plotBoxY + 14);

      // FFT Spectrum Bar Chart
      const fLeft = plotBoxX + 10;
      const fBottom = plotBoxY + plotBoxH - 24;
      const fWidth = plotBoxW - 20;
      const fHeight = plotBoxH - 46;

      // Baseline Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(fLeft, fBottom);
      ctx.lineTo(fLeft + fWidth, fBottom);
      ctx.stroke();

      // Spectral Peaks: 1X, 2X, Subsynchronous Whirl, BPFO, BPFI, BSF
      const f1X = defectData.speed1XHz;
      const maxPlotFreq = Math.max(200, defectData.bpfiHz * 1.5);

      const peaks = [
        { label: '1X', freq: f1X, amp: 1.0, color: '#38bdf8' },
        { label: '2X', freq: f1X * 2, amp: 0.35, color: '#0ea5e9' },
      ];

      if (orbitData.isOilWhirlActive) {
        peaks.push({ label: '0.45X', freq: f1X * 0.45, amp: 0.85, color: '#ef4444' });
      }

      if (activeDefect === 'bpfo') {
        peaks.push({ label: 'BPFO', freq: defectData.bpfoHz, amp: 0.92, color: '#f43f5e' });
      } else if (activeDefect === 'bpfi') {
        peaks.push({ label: 'BPFI', freq: defectData.bpfiHz, amp: 0.95, color: '#f43f5e' });
        peaks.push({ label: 'BPFI±1X', freq: defectData.bpfiHz - f1X, amp: 0.45, color: '#fb7185' });
        peaks.push({ label: 'BPFI+1X', freq: defectData.bpfiHz + f1X, amp: 0.45, color: '#fb7185' });
      } else if (activeDefect === 'bsf') {
        peaks.push({ label: 'BSF', freq: defectData.bsfHz, amp: 0.88, color: '#f43f5e' });
      }

      // Render Peaks
      peaks.forEach((pk) => {
        const px = fLeft + (pk.freq / maxPlotFreq) * fWidth;
        const py = fBottom - pk.amp * fHeight;

        ctx.strokeStyle = pk.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(px, fBottom);
        ctx.lineTo(px, py);
        ctx.stroke();

        ctx.fillStyle = pk.color;
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(pk.label, px, py - 4);
      });

      // Frequency Axis Label
      ctx.fillStyle = '#64748b';
      ctx.font = '8px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`0 to ${Math.round(maxPlotFreq)} Hz`, fLeft + fWidth, fBottom + 14);

      // Hertzian Contact Stress readout
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `Hertz P₀ = ${defectData.hertzMaxContactStressGPa.toFixed(2)} GPa (Ellipse ${defectData.hertzEllipseAMm.toFixed(1)}x${defectData.hertzEllipseBMm.toFixed(1)}mm)`,
        fLeft,
        fBottom + 14
      );

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    width,
    height,
    inputs,
    outputs,
    unitSystem,
    isRunning,
    reducedMotion,
    bearingInfo,
    isResonance,
    isBladeLoss,
    isLubeLoss,
    isOverload,
    isHighTemp,
    activeBearingType,
    activeDefect,
    activeMode,
    orbitData,
    modeData,
    defectData,
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
