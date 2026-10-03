import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Activity,
  Maximize2,
  Minimize2,
  Grid,
  Zap,
  ArrowRight,
  Gauge,
  Layers,
  Sparkles,
  Info,
  Clock,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { SimulatorId } from '../../types/common';
import { SimulatorFleetSection } from '../Fleet/SimulatorFleetSection';
import { LiveSimulatorsFooter } from '../Footer/LiveSimulatorsFooter';
import {
  ScenarioTimeScrubber,
  ScenarioDefinition,
  TransientEventMarker,
  formatPrecisionTime,
} from './ScenarioTimeScrubber';
import { machineryAcoustics } from '../../utils/machineryAcoustics';

const WORKBENCH_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'nominal',
    name: 'Nominal (BEP)',
    shortName: 'Continuous Duty',
    category: 'nominal',
    description: 'API 610 continuous duty baseline at Best Efficiency Point (BEP). Balanced hydraulic equilibrium.',
    badge: 'API 610',
    params: {
      rpm: 1750,
      flowRate: 120.0,
      staticHead: 3.5,
      fluidTemp: 45.0,
      impellerTrim: 215,
    },
  },
  {
    id: 'fouled_strainer',
    name: 'Fouled Strainer',
    shortName: 'Inlet Blockage',
    category: 'fault',
    description: 'Suction basket strainer clogged with particulate. Static head collapses to -1.2m, triggering suction cavitation.',
    badge: 'FAULT: ΔP',
    params: {
      rpm: 1750,
      flowRate: 98.0,
      staticHead: -1.2,
      fluidTemp: 45.0,
      impellerTrim: 215,
    },
  },
  {
    id: 'discharge_trip',
    name: 'Discharge Trip',
    shortName: 'Valve Slam',
    category: 'fault',
    description: 'Discharge isolation valve inadvertent trip. Flow throttles to shutoff threshold (22 m³/h), causing hydraulic recirculation.',
    badge: 'FAULT: TRIP',
    params: {
      rpm: 1750,
      flowRate: 22.0,
      staticHead: 3.5,
      fluidTemp: 52.0,
      impellerTrim: 215,
    },
  },
  {
    id: 'loss_of_prime',
    name: 'Loss of Prime',
    shortName: 'Vapor Lock',
    category: 'fault',
    description: 'Loss of suction liquid seal with severe air entrainment. Head collapses and fluid boils at impeller eye.',
    badge: 'FAULT: VAPOR',
    params: {
      rpm: 1750,
      flowRate: 35.0,
      staticHead: -2.2,
      fluidTemp: 76.0,
      impellerTrim: 215,
    },
  },
];

interface MissionControlWorkbenchProps {
  onLaunchSimulator?: (id: SimulatorId) => void;
}

export const MissionControlWorkbench: React.FC<MissionControlWorkbenchProps> = ({
  onLaunchSimulator,
}) => {
  // -------------------------------------------------------------
  // 1. Simulation Physical State & Interactive Parameters
  // -------------------------------------------------------------
  const [rpm, setRpm] = useState<number>(1750); // Nominal 1750 RPM
  const [flowRate, setFlowRate] = useState<number>(120.0); // m³/h
  const [staticHead, setStaticHead] = useState<number>(3.5); // m (suction static head)
  const [fluidTemp, setFluidTemp] = useState<number>(45.0); // °C
  const [impellerTrim, setImpellerTrim] = useState<number>(215); // mm

  // Scenario Fault Injection & Transient State
  const [activeScenarioId, setActiveScenarioId] = useState<string>('nominal');
  const [isTransientActive, setIsTransientActive] = useState<boolean>(false);
  const [transientMessage, setTransientMessage] = useState<string>('');
  const [transientMarkers, setTransientMarkers] = useState<TransientEventMarker[]>([]);

  // Transport & History Buffer State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1.0);
  const [simTime, setSimTime] = useState<number>(0);
  const [maxRecordedTime, setMaxRecordedTime] = useState<number>(0);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showParticles, setShowParticles] = useState<boolean>(true);
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState<boolean>(false);

  // References for live animation, history buffer & time-scrubbing
  const simTimeRef = useRef<number>(0);
  const maxRecordedTimeRef = useRef<number>(0);
  const activeScenarioIdRef = useRef<string>('nominal');
  const isTransientActiveRef = useRef<boolean>(false);
  const transientTimeoutRef = useRef<number | null>(null);
  const historyBufferRef = useRef<Array<{
    time: number;
    rpm: number;
    flowRate: number;
    staticHead: number;
    fluidTemp: number;
    impellerTrim: number;
    scenarioId: string;
  }>>([]);
  const lastSnapshotTimeRef = useRef<number>(0);

  // Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const impellerAngleRef = useRef<number>(0);
  const particlesRef = useRef<Array<{ x: number; y: number; r: number; speed: number; angle: number; life: number; isBubble?: boolean }>>([]);

  // -------------------------------------------------------------
  // 2. Real-time Physical Equations & Fluid Mechanics Computations
  // -------------------------------------------------------------
  // Reference BEP at 1750 RPM: Q_bep = 120 m³/h, H_bep = 48 m
  const speedRatio = rpm / 1750;
  const trimRatio = impellerTrim / 215;

  // Affinity laws scaled shutoff head & head curve
  const shutoffHead = 62.0 * Math.pow(speedRatio, 2) * Math.pow(trimRatio, 2);
  const currentHead = Math.max(
    5.0,
    shutoffHead - 0.00095 * Math.pow(flowRate / speedRatio, 2) * Math.pow(speedRatio, 2)
  );

  // Atmospheric & Vapor Pressure (Antoine Equation for Water)
  const pAtmBar = 1.01325;
  const pVaporBar = 0.61078 * Math.exp((17.27 * fluidTemp) / (fluidTemp + 237.3)) / 10; // bar
  const density = 1000 - 0.2 * (fluidTemp - 20); // kg/m³
  const g = 9.80665;

  // Suction Line Velocity (assuming 150mm ID pipe)
  const pipeArea = Math.PI * Math.pow(0.15 / 2, 2);
  const fluidVelocity = (flowRate / 3600) / pipeArea; // m/s
  const velocityHead = Math.pow(fluidVelocity, 2) / (2 * g); // m

  // Suction Friction Head Loss
  const frictionLoss = 0.02 * (10 / 0.15) * velocityHead; // m

  // NPSH Available (NPSHa)
  const npsha = Math.max(
    0.1,
    ((pAtmBar - pVaporBar) * 1e5) / (density * g) + staticHead - frictionLoss
  );

  // NPSH Required (NPSHr) based on pump design & flow deviation from BEP
  const bepFlow = 120.0 * speedRatio;
  const flowDeviation = flowRate / bepFlow;
  const baseNpshr = 3.1 * Math.pow(speedRatio, 2);
  const npshr = baseNpshr * (1 + 0.65 * Math.pow(flowDeviation - 1, 2) + 0.35 * Math.pow(flowDeviation, 1.8));

  // Cavitation Detection Flag & Severity
  const isCavitating = npsha < npshr;
  const cavitationDeficit = Math.max(0, npshr - npsha);
  const npshMarginRatio = npsha / npshr;

  // Suction Specific Speed Nss (US units: RPM * sqrt(GPM) / NPSHr^0.75)
  const gpm = flowRate * 4.40287;
  const npshrFt = npshr * 3.28084;
  const nss = (rpm * Math.sqrt(gpm)) / Math.pow(npshrFt, 0.75);

  // Impeller tip speed u2 = pi * D2 * N / 60
  const tipSpeed = (Math.PI * (impellerTrim / 1000) * rpm) / 60; // m/s

  // -------------------------------------------------------------
  // 3. Transport Controls & Scenario Handlers
  // -------------------------------------------------------------
  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setRpm(1750);
    setFlowRate(120.0);
    setStaticHead(3.5);
    setFluidTemp(45.0);
    setImpellerTrim(215);
    setSimTime(0);
    simTimeRef.current = 0;
    setMaxRecordedTime(0);
    maxRecordedTimeRef.current = 0;
    setActiveScenarioId('nominal');
    activeScenarioIdRef.current = 'nominal';
    setIsTransientActive(false);
    isTransientActiveRef.current = false;
    setTransientMessage('');
    setTransientMarkers([]);
    historyBufferRef.current = [];
    impellerAngleRef.current = 0;
  }, []);

  const handleStepForward = useCallback((dt: number = 0.1) => {
    setIsPlaying(false);
    const nextTime = simTimeRef.current + dt;
    simTimeRef.current = nextTime;
    setSimTime(nextTime);
    if (nextTime > maxRecordedTimeRef.current) {
      maxRecordedTimeRef.current = nextTime;
      setMaxRecordedTime(nextTime);
    }
    impellerAngleRef.current += (rpm / 60) * 2 * Math.PI * dt;
  }, [rpm]);

  const handleScrubTime = useCallback((targetTime: number) => {
    setIsPlaying(false);
    simTimeRef.current = targetTime;
    setSimTime(targetTime);

    // Find nearest snapshot in history buffer
    const history = historyBufferRef.current;
    if (history.length > 0) {
      let closest = history[0];
      let minDiff = Math.abs(history[0].time - targetTime);

      for (let i = 1; i < history.length; i++) {
        const diff = Math.abs(history[i].time - targetTime);
        if (diff < minDiff) {
          minDiff = diff;
          closest = history[i];
        }
      }

      if (closest) {
        setRpm(closest.rpm);
        setFlowRate(closest.flowRate);
        setStaticHead(closest.staticHead);
        setFluidTemp(closest.fluidTemp);
        setImpellerTrim(closest.impellerTrim);
        setActiveScenarioId(closest.scenarioId);
        activeScenarioIdRef.current = closest.scenarioId;
        impellerAngleRef.current = (targetTime * (closest.rpm / 60) * 2 * Math.PI) % (Math.PI * 2);
      }
    }
  }, []);

  const handleJumpToLive = useCallback(() => {
    const liveTime = maxRecordedTimeRef.current;
    simTimeRef.current = liveTime;
    setSimTime(liveTime);
    setIsPlaying(true);
  }, []);

  const handleScenarioChange = useCallback((scenarioId: string) => {
    setActiveScenarioId(scenarioId);
    activeScenarioIdRef.current = scenarioId;

    const scenario = WORKBENCH_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return;

    if (scenario.params.rpm !== undefined) setRpm(scenario.params.rpm);
    if (scenario.params.flowRate !== undefined) setFlowRate(scenario.params.flowRate);
    if (scenario.params.staticHead !== undefined) setStaticHead(scenario.params.staticHead);
    if (scenario.params.fluidTemp !== undefined) setFluidTemp(scenario.params.fluidTemp);
    if (scenario.params.impellerTrim !== undefined) setImpellerTrim(scenario.params.impellerTrim);

    machineryAcoustics.updateState({
      rpm: scenario.params.rpm ?? rpm,
      cavitationIntensity: scenario.category === 'fault' ? 0.75 : 0.05,
      vibrationIntensity: scenario.category === 'fault' ? 0.6 : 0.1,
      isSurging: scenario.id === 'discharge_trip',
    });

    if (scenario.category === 'fault') {
      setIsTransientActive(true);
      isTransientActiveRef.current = true;
      setTransientMessage(scenario.name);

      // Add transient marker at current time on timeline
      const currentTime = simTimeRef.current;
      setTransientMarkers((prev) => [
        ...prev.filter((m) => Math.abs(m.time - currentTime) > 0.4),
        {
          id: `marker-${Date.now()}`,
          time: currentTime,
          scenarioId: scenario.id,
          label: scenario.name,
        },
      ]);

      if (transientTimeoutRef.current) {
        clearTimeout(transientTimeoutRef.current);
      }
      transientTimeoutRef.current = window.setTimeout(() => {
        setIsTransientActive(false);
        isTransientActiveRef.current = false;
        setTransientMessage('');
      }, 4500);
    } else {
      setIsTransientActive(false);
      isTransientActiveRef.current = false;
      setTransientMessage('');
    }
  }, [rpm]);

  // -------------------------------------------------------------
  // 4. Real-time Canvas Physics Simulation Engine (60 FPS)
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize particles if empty
    if (particlesRef.current.length === 0) {
      const pArr: Array<{ x: number; y: number; r: number; speed: number; angle: number; life: number; isBubble?: boolean }> = [];
      for (let i = 0; i < 90; i++) {
        pArr.push({
          x: 0,
          y: 0,
          r: 30 + Math.random() * 110,
          speed: 0.02 + Math.random() * 0.03,
          angle: Math.random() * Math.PI * 2,
          life: Math.random(),
          isBubble: false,
        });
      }
      particlesRef.current = pArr;
    }

    let lastTimestamp = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTimestamp) / 1000, 0.1);
      lastTimestamp = now;

      if (isPlaying) {
        const nextTime = simTimeRef.current + dt * simSpeed;
        simTimeRef.current = nextTime;
        setSimTime(nextTime);
        if (nextTime > maxRecordedTimeRef.current) {
          maxRecordedTimeRef.current = nextTime;
          setMaxRecordedTime(nextTime);
        }

        const angularVelocity = (rpm / 60) * 2 * Math.PI; // rad/s
        impellerAngleRef.current += angularVelocity * dt * simSpeed;

        // Save history snapshot every 50ms (20Hz)
        if (now - lastSnapshotTimeRef.current >= 50) {
          lastSnapshotTimeRef.current = now;
          historyBufferRef.current.push({
            time: nextTime,
            rpm,
            flowRate,
            staticHead,
            fluidTemp,
            impellerTrim,
            scenarioId: activeScenarioIdRef.current,
          });
          if (historyBufferRef.current.length > 1200) {
            historyBufferRef.current.shift();
          }
        }
      }

      // Responsive canvas scaling
      const width = canvas.width;
      const height = canvas.height;
      const cx = width * 0.46;
      const cy = height * 0.52;
      const baseRadius = Math.min(width, height) * 0.36;

      ctx.clearRect(0, 0, width, height);

      // (a) Background Layering: Deep #0B1220 to #0F172A radial gradient
      const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, width * 0.7);
      bgGrad.addColorStop(0, '#0f1c33');
      bgGrad.addColorStop(0.5, '#0b1424');
      bgGrad.addColorStop(1, '#080d18');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // (b) Engineering CAD Grid Overlay (WCAG high visibility subtle grid)
      if (showGrid) {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        const gridSize = 36;
        ctx.beginPath();
        for (let x = 0; x < width; x += gridSize) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();

        // Center axis crosshairs
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, height);
        ctx.moveTo(0, cy);
        ctx.lineTo(width, cy);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // (c) Volute Casing (Spiral Geometry)
      ctx.save();
      const voluteGrad = ctx.createRadialGradient(cx, cy, 40, cx, cy, baseRadius * 1.35);
      voluteGrad.addColorStop(0, '#10243d');
      voluteGrad.addColorStop(0.7, '#0d1a2d');
      voluteGrad.addColorStop(1, '#070f1c');

      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 1.25, 0, Math.PI * 2);
      ctx.fillStyle = voluteGrad;
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Tangential Discharge Nozzle
      ctx.beginPath();
      ctx.moveTo(cx + baseRadius * 0.8, cy - baseRadius * 0.9);
      ctx.lineTo(cx + baseRadius * 0.8, 25);
      ctx.lineTo(cx + baseRadius * 1.25, 25);
      ctx.lineTo(cx + baseRadius * 1.25, cy);
      ctx.fillStyle = '#0f1e33';
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Fluid Flow Discharge Arrow in Cyan #06B6D4
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx + baseRadius * 1.02, cy - 20);
      ctx.lineTo(cx + baseRadius * 1.02, 35);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + baseRadius * 0.92, 45);
      ctx.lineTo(cx + baseRadius * 1.02, 30);
      ctx.lineTo(cx + baseRadius * 1.12, 45);
      ctx.fillStyle = '#06b6d4';
      ctx.fill();

      // (d) Impeller Pressure Distribution Heatmap
      const pressureGrad = ctx.createRadialGradient(cx, cy, 25, cx, cy, baseRadius);
      // Low pressure at eye (cyan / deep blue), high pressure at tips
      pressureGrad.addColorStop(0, isCavitating ? 'rgba(245, 158, 11, 0.25)' : 'rgba(6, 182, 212, 0.2)');
      pressureGrad.addColorStop(0.6, 'rgba(14, 165, 233, 0.15)');
      pressureGrad.addColorStop(1, 'rgba(16, 185, 129, 0.2)');
      ctx.fillStyle = pressureGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
      ctx.fill();

      // (e) Rotating Impeller Vanes (6 Backward-Curved Vanes)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(impellerAngleRef.current);

      // Impeller Outer Shroud Rim
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius * (impellerTrim / 250), 0, Math.PI * 2);
      ctx.stroke();

      const numVanes = 6;
      for (let i = 0; i < numVanes; i++) {
        const vAngle = (i * (Math.PI * 2)) / numVanes;
        ctx.save();
        ctx.rotate(vAngle);

        // Backward curved vane trajectory (Bezier curve)
        ctx.beginPath();
        ctx.moveTo(35, 0);
        ctx.quadraticCurveTo(
          baseRadius * 0.45,
          -baseRadius * 0.25,
          baseRadius * (impellerTrim / 250) * 0.95,
          -baseRadius * 0.42
        );
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Vane Leading Edge Marker
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(35, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Impeller Hub & Suction Eye
      const hubGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 35);
      hubGrad.addColorStop(0, '#38bdf8');
      hubGrad.addColorStop(0.5, '#0284c7');
      hubGrad.addColorStop(1, '#0369a1');
      ctx.fillStyle = hubGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Central Drive Shaft Nut
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore(); // Restore translate/rotate

      // (f) Fluid Flow Streamline Particles
      if (showParticles) {
        particlesRef.current.forEach((p) => {
          if (isPlaying) {
            p.angle += p.speed * (rpm / 1750) * simSpeed;
            // Particles spiral outward from eye to casing
            p.r += 0.3 * (flowRate / 120) * simSpeed;
            if (p.r > baseRadius * 1.15) {
              p.r = 32 + Math.random() * 20;
              p.angle = Math.random() * Math.PI * 2;
              p.isBubble = isCavitating && Math.random() < 0.6;
            }
          }

          const px = cx + Math.cos(p.angle) * p.r;
          const py = cy + Math.sin(p.angle) * p.r;

          if (p.isBubble && isCavitating) {
            // Cavitation Vapor Bubble: Amber/White glowing bubble with jitter
            const jitterX = (Math.random() - 0.5) * 3;
            const jitterY = (Math.random() - 0.5) * 3;
            ctx.fillStyle = '#f59e0b';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(px + jitterX, py + jitterY, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          } else {
            // Normal fluid particle: Cyan glow
            ctx.fillStyle = 'rgba(6, 182, 212, 0.75)';
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // (g) Cavitation Shockwave Pulses (if cavitating)
      if (isCavitating) {
        const pulseTime = performance.now() / 250;
        const pulseRadius = 38 + (pulseTime % 1) * 65;
        const pulseAlpha = 1 - (pulseTime % 1);

        ctx.strokeStyle = `rgba(245, 158, 11, ${pulseAlpha * 0.85})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Flash marker at suction eye
        ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.beginPath();
        ctx.arc(cx, cy, 45, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, rpm, flowRate, impellerTrim, isCavitating, showGrid, showParticles, simSpeed]);

  // Format time display 00:00:00.0
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const tenths = Math.floor((sec % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}.${tenths}`;
  };



  return (
    <div className="w-full bg-[#0B1220] text-slate-100 font-sans selection:bg-[#06B6D4]/30 selection:text-cyan-200">
      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: MISSION CONTROL SIMULATOR WORKBENCH (3-PANE LAYOUT) */}
      {/* ------------------------------------------------------------- */}
      <section className="w-full pt-4 pb-2 px-4 lg:px-6 max-w-[1720px] mx-auto">
        {/* Top Header Bar (Compressed <= 120px vertical, 8pt spacing) */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-7 bg-[#06B6D4] rounded-sm shadow-[0_0_10px_#06B6D4] shrink-0" />
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-[24px] md:text-[26px] lg:text-[28px] font-bold tracking-tight text-slate-100 font-sans leading-tight">
                  MISSION CONTROL WORKBENCH
                </h1>
                <span className="inline-flex items-center h-[20px] px-2 py-[2px] bg-[#0F172A] border border-[#1E293B] text-[#06B6D4] text-[11px] font-mono font-semibold rounded uppercase tracking-wider">
                  API 610 / HI 9.6.1
                </span>
              </div>
              <p className="text-[14px] text-slate-400 mt-0.5 leading-snug">
                Full-fidelity turbomachinery digital twin with real-time numerical solvers and dynamic telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
            <div className="flex items-center gap-2 bg-[#0F172A] border border-[#1E293B] px-2.5 py-1 rounded-md text-[12px] font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-slate-400">SOLVER:</span>
              <span className="text-[#06B6D4] font-bold">FLOAT64 RK4 ACTIVE</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#0F172A] border border-[#1E293B] px-2.5 py-1 rounded-md text-[12px] font-mono text-slate-300">
              <Clock className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>{formatTime(simTime)}</span>
            </div>
          </div>
        </div>

        {/* The 3-Pane Screen-Filling Workbench (Reduced 25% for Professional Instrument Density) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-auto lg:h-[495px]">
          {/* ------------------------------------------------------------- */}
          {/* PANE 1: LEFT PANE (25% Width / 3 Cols) - Interactive Controls */}
          {/* ------------------------------------------------------------- */}
          <div className="lg:col-span-3 flex flex-col justify-between bg-[#0F172A] border border-[#1E293B] rounded-xl p-3 shadow-2xl overflow-hidden">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1E293B]">
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-[#06B6D4]" />
                  <span className="text-[12px] font-bold tracking-wider uppercase text-slate-200">
                    Operating Parameters
                  </span>
                </div>
                <span className="inline-flex items-center h-[18px] px-1.5 py-[1px] rounded bg-[#0B1220] border border-[#1E293B] text-[10px] font-mono text-slate-400">
                  5 CHANNELS
                </span>
              </div>

              {/* Slider Rows: Compact 46px row height with 14px cyan monospace readouts */}
              <div className="space-y-1.5">
                {/* Slider 1: RPM */}
                <div className="h-[46px] flex flex-col justify-between py-0.5">
                  <div className="flex items-center justify-between leading-none">
                    <label className="text-[11px] font-medium text-slate-300 uppercase tracking-wide">
                      Shaft Speed
                    </label>
                    <span className="font-mono text-[14px] font-bold text-[#06B6D4] [text-shadow:0_0_8px_rgba(6,182,212,0.4)]">
                      RPM: {rpm.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={800}
                    max={3600}
                    step={25}
                    value={rpm}
                    onChange={(e) => setRpm(Number(e.target.value))}
                    className="w-full h-1 bg-[#1E293B] rounded-lg appearance-none cursor-pointer accent-[#06B6D4]"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-500 leading-none">
                    <span>800</span>
                    <span>1,750 (Nominal)</span>
                    <span>3,600</span>
                  </div>
                </div>

                {/* Slider 2: Flow Rate Q */}
                <div className="h-[46px] flex flex-col justify-between py-0.5">
                  <div className="flex items-center justify-between leading-none">
                    <label className="text-[11px] font-medium text-slate-300 uppercase tracking-wide">
                      Flow Rate (Q)
                    </label>
                    <span className="font-mono text-[14px] font-bold text-[#06B6D4] [text-shadow:0_0_8px_rgba(6,182,212,0.4)]">
                      Q: {flowRate.toFixed(1)} m³/h
                    </span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={220}
                    step={2}
                    value={flowRate}
                    onChange={(e) => setFlowRate(Number(e.target.value))}
                    className="w-full h-1 bg-[#1E293B] rounded-lg appearance-none cursor-pointer accent-[#06B6D4]"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-500 leading-none">
                    <span>20</span>
                    <span>BEP {bepFlow.toFixed(0)}</span>
                    <span>220</span>
                  </div>
                </div>

                {/* Slider 3: Static Suction Head Hs */}
                <div className="h-[46px] flex flex-col justify-between py-0.5">
                  <div className="flex items-center justify-between leading-none">
                    <label className="text-[11px] font-medium text-slate-300 uppercase tracking-wide">
                      Suction Static Head (H<sub className="text-[8px]">s</sub>)
                    </label>
                    <span
                      className={`font-mono text-[14px] font-bold ${
                        staticHead < 1.0
                          ? 'text-[#F59E0B] [text-shadow:0_0_8px_rgba(245,158,11,0.4)]'
                          : 'text-[#06B6D4] [text-shadow:0_0_8px_rgba(6,182,212,0.4)]'
                      }`}
                    >
                      H<sub className="text-[8px]">s</sub>: {staticHead >= 0 ? `+${staticHead.toFixed(2)}` : staticHead.toFixed(2)} m
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-2.0}
                    max={8.0}
                    step={0.25}
                    value={staticHead}
                    onChange={(e) => setStaticHead(Number(e.target.value))}
                    className="w-full h-1 bg-[#1E293B] rounded-lg appearance-none cursor-pointer accent-[#06B6D4]"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-500 leading-none">
                    <span>-2.0m (Lift)</span>
                    <span>+3.5m (Flooded)</span>
                    <span>+8.0m</span>
                  </div>
                </div>

                {/* Slider 4: Fluid Temperature */}
                <div className="h-[46px] flex flex-col justify-between py-0.5">
                  <div className="flex items-center justify-between leading-none">
                    <label className="text-[11px] font-medium text-slate-300 uppercase tracking-wide">
                      Fluid Temp (T)
                    </label>
                    <span
                      className={`font-mono text-[14px] font-bold ${
                        fluidTemp > 65
                          ? 'text-[#F59E0B] [text-shadow:0_0_8px_rgba(245,158,11,0.4)]'
                          : 'text-[#06B6D4] [text-shadow:0_0_8px_rgba(6,182,212,0.4)]'
                      }`}
                    >
                      T: {fluidTemp.toFixed(1)} °C
                    </span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={95}
                    step={1}
                    value={fluidTemp}
                    onChange={(e) => setFluidTemp(Number(e.target.value))}
                    className="w-full h-1 bg-[#1E293B] rounded-lg appearance-none cursor-pointer accent-[#06B6D4]"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-500 leading-none">
                    <span>15°C</span>
                    <span>P<sub className="text-[7px]">vap</sub>: {pVaporBar.toFixed(2)} bar</span>
                    <span>95°C</span>
                  </div>
                </div>

                {/* Slider 5: Impeller Trim D2 */}
                <div className="h-[46px] flex flex-col justify-between py-0.5">
                  <div className="flex items-center justify-between leading-none">
                    <label className="text-[11px] font-medium text-slate-300 uppercase tracking-wide">
                      Impeller Diameter (D<sub className="text-[8px]">2</sub>)
                    </label>
                    <span className="font-mono text-[14px] font-bold text-[#06B6D4] [text-shadow:0_0_8px_rgba(6,182,212,0.4)]">
                      D<sub className="text-[8px]">2</sub>: {impellerTrim} mm
                    </span>
                  </div>
                  <input
                    type="range"
                    min={170}
                    max={250}
                    step={5}
                    value={impellerTrim}
                    onChange={(e) => setImpellerTrim(Number(e.target.value))}
                    className="w-full h-1 bg-[#1E293B] rounded-lg appearance-none cursor-pointer accent-[#06B6D4]"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-500 leading-none">
                    <span>170mm</span>
                    <span>215mm (Nom)</span>
                    <span>250mm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Hydraulic Summary & Baseline Reset */}
            <div className="pt-2 border-t border-[#1E293B] mt-1.5 flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">BEP RATIO:</span>
                <span className={`font-bold ${flowDeviation < 0.7 || flowDeviation > 1.25 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {(flowDeviation * 100).toFixed(0)}%
                </span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 px-2 py-1 rounded bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-slate-300 text-[10px] transition-colors cursor-pointer"
                title="Reset to BEP baseline"
              >
                <RotateCcw className="w-3 h-3 text-[#06B6D4]" />
                <span>RESET BEP</span>
              </button>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* PANE 2: CENTER PANE (50% Width / 6 Cols) - Canvas & Time-Scrubber */}
          {/* ------------------------------------------------------------- */}
          <div className="lg:col-span-6 flex flex-col justify-between bg-[#0F172A] border border-[#1E293B] rounded-xl overflow-hidden shadow-2xl p-2.5 sm:p-3 gap-2.5">
            {/* Simulation Canvas Frame with Live HUD Overlays */}
            <div className="relative w-full h-[250px] sm:h-[285px] lg:h-[295px] bg-[#070b12] rounded-lg overflow-hidden border border-[#1E293B] touch-pan-y shrink-0">
              <canvas
                ref={canvasRef}
                width={750}
                height={380}
                className="w-full h-full object-cover block touch-pan-y"
              />

              {/* HUD Top-Left: Machine Telemetry */}
              <div className="absolute top-2 left-2 pointer-events-none flex flex-col gap-0.5 bg-[#0F172A]/90 backdrop-blur-md border border-[#1E293B] px-2.5 py-1 rounded-md shadow-md z-10">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-pulse motion-reduce:animate-none" />
                  <span className="font-mono text-[10.5px] font-bold text-slate-100 tracking-wider">
                    ASSET: P-101A [API 610 OH2]
                  </span>
                </div>
                <div className="text-[9.5px] font-mono text-slate-400">
                  u<sub className="text-[7.5px]">2</sub>: <span className="text-[#06B6D4] font-semibold">{tipSpeed.toFixed(1)} m/s</span> | RK4 SOLVER
                </div>
              </div>

              {/* HUD Top-Right: Transient Badge & Status Badge */}
              <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
                {/* Flashing Amber TRANSIENT DETECTED Badge */}
                {isTransientActive && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="flex items-center gap-1.5 bg-amber-500/25 border-2 border-amber-500/90 backdrop-blur-md px-2.5 py-1 rounded-md shadow-[0_0_18px_rgba(245,158,11,0.5)] animate-pulse motion-reduce:animate-none"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-bounce motion-reduce:animate-none" />
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] sm:text-[10.5px] font-extrabold text-amber-300 tracking-wider leading-none">
                        ⚡ TRANSIENT DETECTED
                      </span>
                      <span className="font-mono text-[8.5px] text-amber-200/90 leading-tight">
                        {transientMessage || 'Hydraulic Step'} &bull; {formatPrecisionTime(simTime)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Machine Equilibrium Status Badge */}
                {isCavitating ? (
                  <div className="flex items-center gap-1.5 bg-[#F59E0B]/15 border border-[#F59E0B]/60 backdrop-blur-md px-2 py-1 rounded-md shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span className="font-mono text-[10px] sm:text-[10.5px] font-bold text-[#F59E0B] tracking-wide">
                      CAVITATION (-{cavitationDeficit.toFixed(2)}m)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-[#06B6D4]/15 border border-[#06B6D4]/50 backdrop-blur-md px-2 py-1 rounded-md shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#06B6D4]" />
                    <span className="font-mono text-[10px] sm:text-[10.5px] font-bold text-[#06B6D4] tracking-wide">
                      NOMINAL (BEP {Math.round(flowDeviation * 100)}%)
                    </span>
                  </div>
                )}
              </div>

              {/* HUD Bottom-Left: Real-time Pressure & Margins */}
              <div className="absolute bottom-2 left-2 pointer-events-none bg-[#0F172A]/90 backdrop-blur-md border border-[#1E293B] px-2 py-1 rounded-md shadow-md z-10">
                <div className="grid grid-cols-2 gap-x-2.5 gap-y-0.5 text-[9.5px] font-mono leading-tight">
                  <div>
                    <span className="text-slate-400">NPSH<sub className="text-[7.5px]">a</sub>: </span>
                    <span className={`font-bold ${isCavitating ? 'text-[#F59E0B]' : 'text-[#06B6D4]'}`}>
                      {npsha.toFixed(2)}m
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">NPSH<sub className="text-[7.5px]">r</sub>: </span>
                    <span className="text-slate-200 font-bold">{npshr.toFixed(2)}m</span>
                  </div>
                  <div>
                    <span className="text-slate-400">MARGIN: </span>
                    <span className={`font-bold ${npshMarginRatio < 1.0 ? 'text-[#F59E0B]' : 'text-emerald-400'}`}>
                      {npshMarginRatio.toFixed(2)}x
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">HEAD: </span>
                    <span className="text-slate-200 font-bold">{currentHead.toFixed(1)}m</span>
                  </div>
                </div>
              </div>

              {/* HUD Bottom-Right: Viewport & Overlay Toggles */}
              <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-[#0F172A]/90 backdrop-blur-md border border-[#1E293B] p-0.5 rounded-md shadow-md z-10">
                <button
                  type="button"
                  onClick={() => setShowGrid((g) => !g)}
                  className={`p-1 rounded text-[10px] font-mono transition-colors ${
                    showGrid ? 'bg-[#1E293B] text-[#06B6D4]' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Toggle CAD Grid"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowParticles((p) => !p)}
                  className={`p-1 rounded text-[10px] font-mono transition-colors ${
                    showParticles ? 'bg-[#1E293B] text-[#06B6D4]' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Toggle Fluid Particles"
                >
                  <Zap className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scenario & Time-Scrubbing Control Panel sitting just below the main canvas */}
            <ScenarioTimeScrubber
              currentTime={simTime}
              maxTime={maxRecordedTime}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              onStepForward={handleStepForward}
              onScrubTime={handleScrubTime}
              onResetTime={handleReset}
              onJumpToLive={handleJumpToLive}
              scenarios={WORKBENCH_SCENARIOS}
              activeScenarioId={activeScenarioId}
              onScenarioChange={handleScenarioChange}
              isTransientActive={isTransientActive}
              transientMessage={transientMessage}
              transientMarkers={transientMarkers}
              simSpeed={simSpeed}
              onChangeSimSpeed={setSimSpeed}
            />
          </div>

          {/* ------------------------------------------------------------- */}
          {/* PANE 3: RIGHT PANE (25% Width / 3 Cols) - Line Chart & Equations */}
          {/* ------------------------------------------------------------- */}
          <div className="lg:col-span-3 flex flex-col justify-between bg-[#0F172A] border border-[#1E293B] rounded-xl p-3 shadow-2xl overflow-y-auto">
            <div className="flex flex-col gap-2.5">
              {/* Telemetry Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#06B6D4]" />
                  <span className="text-[12px] font-bold tracking-wider uppercase text-slate-200">
                    Live Telemetry & Curves
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">H vs. Q</span>
              </div>

              {/* Data Visualization: Head vs. Flow Line Chart (Compact) */}
              <div className="bg-[#0B1220] border border-[#1E293B] rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-slate-300">
                    HEAD vs. FLOW (API 610)
                  </span>
                  <span className="text-[10px] font-mono text-[#06B6D4]">
                    {currentHead.toFixed(1)}m @ {flowRate.toFixed(0)}m³/h
                  </span>
                </div>

                {/* SVG Curve Chart */}
                <div className="w-full h-28 relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 240 115">
                    {/* Grid Lines */}
                    <line x1="28" y1="15" x2="230" y2="15" stroke="#1e293b" strokeDasharray="2,2" />
                    <line x1="28" y1="50" x2="230" y2="50" stroke="#1e293b" strokeDasharray="2,2" />
                    <line x1="28" y1="85" x2="230" y2="85" stroke="#1e293b" strokeDasharray="2,2" />
                    <line x1="28" y1="100" x2="230" y2="100" stroke="#334155" />
                    <line x1="28" y1="10" x2="28" y2="100" stroke="#334155" />

                    {/* Axis Labels */}
                    <text x="26" y="18" fill="#64748b" fontSize="7.5" textAnchor="end" fontFamily="JetBrains Mono">
                      70m
                    </text>
                    <text x="26" y="54" fill="#64748b" fontSize="7.5" textAnchor="end" fontFamily="JetBrains Mono">
                      40m
                    </text>
                    <text x="26" y="98" fill="#64748b" fontSize="7.5" textAnchor="end" fontFamily="JetBrains Mono">
                      10m
                    </text>
                    <text x="230" y="110" fill="#64748b" fontSize="7.5" textAnchor="end" fontFamily="JetBrains Mono">
                      240 m³/h
                    </text>

                    {/* H-Q Pump Performance Curve */}
                    <path
                      d="M 28,25 Q 120,40 220,95"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2"
                    />

                    {/* System Resistance Curve (Parabolic) */}
                    <path
                      d="M 28,88 Q 120,70 220,30"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="1.2"
                      strokeDasharray="3,2"
                    />

                    {/* BEP Marker Line */}
                    <line x1="124" y1="15" x2="124" y2="100" stroke="rgba(16,185,129,0.3)" strokeDasharray="2,2" />

                    {/* Operating Duty Point Coordinates */}
                    {(() => {
                      const plotX = 28 + (flowRate / 240) * 192;
                      const plotY = Math.min(96, Math.max(20, 100 - (currentHead / 70) * 80));
                      return (
                        <g>
                          {/* Crosshairs */}
                          <line x1="28" y1={plotY} x2={plotX} y2={plotY} stroke="rgba(6,182,212,0.4)" strokeDasharray="2,2" />
                          <line x1={plotX} y1={plotY} x2={plotX} y2="100" stroke="rgba(6,182,212,0.4)" strokeDasharray="2,2" />
                          {/* Point with glow */}
                          <circle
                            cx={plotX}
                            cy={plotY}
                            r="4"
                            fill={isCavitating ? '#f59e0b' : '#06b6d4'}
                            className={isCavitating ? 'animate-ping' : ''}
                          />
                          <circle cx={plotX} cy={plotY} r="3" fill="#0f172a" stroke={isCavitating ? '#f59e0b' : '#06b6d4'} strokeWidth="1.5" />
                        </g>
                      );
                    })()}
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1 pt-1 border-t border-[#1E293B]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-0.5 bg-[#06B6D4]" /> Pump H-Q
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-0.5 bg-slate-500 border-dashed" /> System
                  </span>
                  <span className="text-emerald-400 font-semibold">BEP 120m³/h</span>
                </div>
              </div>

              {/* Active Equations (Compact) */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span>Governing Laws</span>
                  <span className="text-[9px] font-mono text-[#06B6D4]">FLOAT64 RK4</span>
                </div>

                {/* Equation 1: Euler Turbomachinery */}
                <div className="bg-[#0B1220] border border-[#1E293B] rounded-lg p-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                    <span>Euler Turbomachinery</span>
                    <span className="text-[#06B6D4] font-semibold">u₂ = {tipSpeed.toFixed(1)} m/s</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-200">
                    H = (u₂ · v_u2 - u₁ · v_u1) / g
                  </div>
                </div>

                {/* Equation 2: NPSHa */}
                <div className="bg-[#0B1220] border border-[#1E293B] rounded-lg p-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                    <span>NPSH Available (API 610)</span>
                    <span className={isCavitating ? 'text-[#F59E0B] font-bold' : 'text-[#06B6D4]'}>
                      NPSHa: {npsha.toFixed(2)} m
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-200">
                    NPSH<sub className="text-[8px]">a</sub> = (P<sub className="text-[8px]">s</sub> - P<sub className="text-[8px]">v</sub>)/(ρ·g) + H<sub className="text-[8px]">s</sub> - h<sub className="text-[8px]">f</sub>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="pt-2 border-t border-[#1E293B] mt-2">
              <button
                type="button"
                onClick={() => onLaunchSimulator?.('pump')}
                className="w-full h-[34px] px-3 rounded-lg bg-[#06B6D4] hover:bg-[#0891b2] text-slate-950 font-bold text-[12px] flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
              >
                <span>OPEN FULL PUMP SIMULATOR</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: DIGITAL TWINS FLEET (GROUPED + SCHEMATICS + RIBBON) */}
      {/* ------------------------------------------------------------- */}
      <SimulatorFleetSection onLaunchSimulator={onLaunchSimulator} />

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3: LIVESIMULATORS UNIVERSAL ENGINEERING FOOTER */}
      {/* ------------------------------------------------------------- */}
      <LiveSimulatorsFooter />
    </div>
  );
};
