import React, { useRef, useEffect, useState, useMemo } from 'react';
import { SealInputs, SealOutputs } from '../../types/seal';
import { UnitSystem } from '../../types/common';
import { VisualCanvas } from '../../components/Shared/VisualCanvas';
import { SEAL_PLAN_INFO } from '../../utils/sealCalculations';
import { convertPressure, formatNum } from '../../utils/units';
import {
  calculateSealFaceTribology,
  SealTribologyAnalysisResult,
} from '../../physics/sealTribologyMath';
import {
  AlertTriangle,
  CheckCircle2,
  Flame,
  Layers,
  Activity,
  Compass,
  Sliders,
  Split,
  Eye,
  Volume2,
} from 'lucide-react';

interface SealPlanVisualizerProps {
  inputs: SealInputs;
  outputs: SealOutputs;
  isRunning?: boolean;
  unitSystem: UnitSystem;
}

export type SealVisualViewMode = 'pid_system' | 'micro_tribology' | 'dual_twin';
export type ConingModeOption = 'auto' | 'converging' | 'diverging';

export const SealPlanVisualizer: React.FC<SealPlanVisualizerProps> = ({
  inputs,
  outputs,
  isRunning = true,
  unitSystem,
}) => {
  const [viewMode, setViewMode] = useState<SealVisualViewMode>('dual_twin');
  const [coningMode, setConingMode] = useState<ConingModeOption>('auto');
  const [showVaporBubbles, setShowVaporBubbles] = useState<boolean>(true);
  const [showPressureCurve, setShowPressureCurve] = useState<boolean>(true);
  const [microZoom, setMicroZoom] = useState<number>(2000);

  const planInfo = SEAL_PLAN_INFO[inputs.planId] || SEAL_PLAN_INFO.plan_11;

  // Calculate tribology, sub-micron gap, phase change and coning
  const tribologyResult = useMemo<SealTribologyAnalysisResult>(() => {
    return calculateSealFaceTribology({
      inputs,
      outputs,
      forcedConingMode: coningMode,
    });
  }, [inputs, outputs, coningMode]);

  const isVaporRisk = !outputs.api682VaporMarginCompliant || tribologyResult.hasVaporFlash;
  const isPuffing = tribologyResult.puffingSeverityPercent > 0;

  const headerControls = (
    <div className="flex items-center gap-1.5 font-mono text-[10px] flex-wrap">
      {/* View Mode Selector */}
      <div className="flex bg-[#0d1117] border border-[#30363d] rounded p-0.5 gap-0.5">
        <button
          onClick={() => setViewMode('pid_system')}
          className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
            viewMode === 'pid_system' ? 'bg-[#f27d26] text-white font-bold' : 'text-[#8b949e] hover:text-white'
          }`}
          title="API 682 Piping P&ID & Chamber Dynamics"
        >
          P&ID Loop
        </button>
        <button
          onClick={() => setViewMode('micro_tribology')}
          className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
            viewMode === 'micro_tribology' ? 'bg-cyan-500 text-white font-bold' : 'text-[#8b949e] hover:text-white'
          }`}
          title="Sub-Micron Face Tribology, Vapor Flash & Coning"
        >
          Sub-Micron Tribology
        </button>
        <button
          onClick={() => setViewMode('dual_twin')}
          className={`px-2 py-0.5 rounded text-[10px] transition-colors flex items-center gap-1 ${
            viewMode === 'dual_twin' ? 'bg-indigo-600 text-white font-bold' : 'text-[#8b949e] hover:text-white'
          }`}
          title="Split Screen Dual Twin: P&ID Loop + Sub-Micron Tribology"
        >
          <Split className="w-3 h-3" />
          Dual Twin
        </button>
      </div>

      {/* Coning Distortion Mode */}
      <div className="flex items-center gap-1 bg-[#0d1117] border border-[#30363d] px-1.5 py-0.5 rounded text-[#8b949e]">
        <span>Coning:</span>
        <select
          value={coningMode}
          onChange={(e) => setConingMode(e.target.value as ConingModeOption)}
          className="bg-transparent text-amber-300 font-bold outline-none cursor-pointer text-[10px]"
          title="Switch between natural thermal coning or forced converging/diverging gap"
        >
          <option value="auto" className="bg-[#161b22] text-white">Auto (Thermal)</option>
          <option value="converging" className="bg-[#161b22] text-emerald-400">Converging (+β)</option>
          <option value="diverging" className="bg-[#161b22] text-rose-400">Diverging (-β Pinch)</option>
        </select>
      </div>

      {/* Vapor Flash Bubbles Toggle */}
      <button
        onClick={() => setShowVaporBubbles(!showVaporBubbles)}
        className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
          showVaporBubbles ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 font-bold' : 'bg-[#0d1117] border-[#30363d] text-[#8b949e]'
        }`}
        title="Toggle Phase-Change Boiling Vapor Nucleation & Puffing animation"
      >
        <Flame className="w-3 h-3" />
        Vapor: {showVaporBubbles ? 'ON' : 'OFF'}
      </button>

      {/* Pressure Curve Overlay Toggle */}
      <button
        onClick={() => setShowPressureCurve(!showPressureCurve)}
        className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
          showPressureCurve ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300 font-bold' : 'bg-[#0d1117] border-[#30363d] text-[#8b949e]'
        }`}
        title="Toggle radial P(r) and Psat(T) distribution curves"
      >
        <Activity className="w-3 h-3" />
        P(r) Curve
      </button>

      {/* Micro-Gap Zoom */}
      <div className="flex items-center gap-1 bg-[#0d1117] border border-[#30363d] px-2 py-0.5 rounded text-[#8b949e]">
        <span>Gap Zoom:</span>
        <button
          onClick={() => setMicroZoom(microZoom === 1000 ? 2000 : microZoom === 2000 ? 4000 : 1000)}
          className="text-[#58a6ff] hover:text-white font-bold"
          title="Adjust sub-micron visual scale factor"
        >
          {microZoom}x
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col">
      <VisualCanvas<SealInputs, SealOutputs>
        simulator="seal"
        inputs={inputs}
        outputs={outputs}
        unitSystem={unitSystem}
        isRunning={isRunning}
        title="API 682 Mechanical Seal Micro-Gap Tribology & P&ID Digital Twin"
        subtitle={`Plan ${planInfo.name}: ${planInfo.title} | Sub-micron lubrication, phase-change boiling, and thermal coning`}
        headerControls={headerControls}
        overlayBadge={
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            {isPuffing ? (
              <span className="px-2 py-0.5 rounded border font-bold bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                VAPOR FLASH & PUFFING ({tribologyResult.puffingFrequencyHz} Hz)
              </span>
            ) : isVaporRisk ? (
              <span className="px-2 py-0.5 rounded border font-bold bg-amber-500/20 border-amber-500/50 text-amber-300 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                LOW VAPOR MARGIN
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded border font-bold bg-emerald-500/20 border-emerald-500/40 text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                STABLE HYDRODYNAMIC FILM
              </span>
            )}
          </div>
        }
        renderVisual={({ containerWidth, containerHeight, isRunning }) => {
          return (
            <SealCanvasRenderer
              width={containerWidth}
              height={containerHeight}
              inputs={inputs}
              outputs={outputs}
              unitSystem={unitSystem}
              viewMode={viewMode}
              coningMode={coningMode}
              showVaporBubbles={showVaporBubbles}
              showPressureCurve={showPressureCurve}
              microZoom={microZoom}
              tribology={tribologyResult}
              isRunning={isRunning}
            />
          );
        }}
      />
    </div>
  );
};

interface SealCanvasRendererProps {
  width: number;
  height: number;
  inputs: SealInputs;
  outputs: SealOutputs;
  unitSystem: UnitSystem;
  viewMode: SealVisualViewMode;
  coningMode: ConingModeOption;
  showVaporBubbles: boolean;
  showPressureCurve: boolean;
  microZoom: number;
  tribology: SealTribologyAnalysisResult;
  isRunning: boolean;
}

const SealCanvasRenderer: React.FC<SealCanvasRendererProps> = ({
  width,
  height,
  inputs,
  outputs,
  unitSystem,
  viewMode,
  coningMode,
  showVaporBubbles,
  showPressureCurve,
  microZoom,
  tribology,
  isRunning,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flowOffsetRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const bubblesRef = useRef<Array<{ x: number; y: number; r: number; vx: number; vy: number; life: number; maxLife: number }>>([]);

  useEffect(() => {
    let animId: number;
    let lastT = performance.now();

    const render = (now: number) => {
      const dt = (now - lastT) / 1000;
      lastT = now;

      if (isRunning) {
        flowOffsetRef.current += dt * 35;
        timeRef.current += dt;

        // Manage dynamic boiling vapor bubbles
        if (tribology.hasVaporFlash && showVaporBubbles) {
          // Spawn new micro vapor bubbles
          if (Math.random() < 0.45) {
            bubblesRef.current.push({
              x: 0, // will be scaled in local coordinates
              y: (Math.random() - 0.5) * 20,
              r: 1.2 + Math.random() * 2.5,
              vx: 15 + Math.random() * 30,
              vy: (Math.random() - 0.5) * 10,
              life: 0,
              maxLife: 0.6 + Math.random() * 0.8,
            });
          }
          // Update bubbles
          for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
            const b = bubblesRef.current[i];
            b.life += dt;
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.r += dt * 1.5; // Bubble expansion as pressure drops
            if (b.life >= b.maxLife) {
              bubblesRef.current.splice(i, 1);
            }
          }
        } else {
          bubblesRef.current = [];
        }
      }

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

      drawMasterSealDigitalTwin(ctx, width, height, {
        inputs,
        outputs,
        unitSystem,
        viewMode,
        coningMode,
        showVaporBubbles,
        showPressureCurve,
        microZoom,
        tribology,
        flowOffset: flowOffsetRef.current,
        time: timeRef.current,
        bubbles: bubblesRef.current,
      });

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
    viewMode,
    coningMode,
    showVaporBubbles,
    showPressureCurve,
    microZoom,
    tribology,
    isRunning,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full block"
    />
  );
};

// -------------------------------------------------------------
// Master Drawing Dispatcher
// -------------------------------------------------------------
function drawMasterSealDigitalTwin(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: {
    inputs: SealInputs;
    outputs: SealOutputs;
    unitSystem: UnitSystem;
    viewMode: SealVisualViewMode;
    coningMode: ConingModeOption;
    showVaporBubbles: boolean;
    showPressureCurve: boolean;
    microZoom: number;
    tribology: SealTribologyAnalysisResult;
    flowOffset: number;
    time: number;
    bubbles: Array<any>;
  }
) {
  const { viewMode, tribology, time } = state;

  ctx.clearRect(0, 0, w, h);

  // Background Engineering Grid
  drawBlueprintGrid(ctx, w, h);

  if (viewMode === 'pid_system') {
    // Full P&ID schematic view
    drawPidSchematic(ctx, 0, 0, w, h, state);
  } else if (viewMode === 'micro_tribology') {
    // Full Sub-Micron Face Tribology view
    drawSubMicronTribologyView(ctx, 0, 0, w, h, state);
  } else {
    // Dual Twin Split: Left 48% P&ID, Right 52% Sub-Micron Face Tribology
    const splitX = Math.round(w * 0.46);
    drawPidSchematic(ctx, 0, 0, splitX, h, state);

    // Divider Line
    ctx.save();
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, h);
    ctx.stroke();

    // Split Divider Accent
    ctx.fillStyle = '#f27d26';
    ctx.fillRect(splitX - 2, h * 0.5 - 20, 4, 40);
    ctx.restore();

    drawSubMicronTribologyView(ctx, splitX, 0, w - splitX, h, state);
  }
}

// -------------------------------------------------------------
// Sub-View 1: P&ID Piping & Chamber Dynamics Schematic
// -------------------------------------------------------------
function drawPidSchematic(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  state: {
    inputs: SealInputs;
    outputs: SealOutputs;
    unitSystem: UnitSystem;
    tribology: SealTribologyAnalysisResult;
    flowOffset: number;
    time: number;
  }
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const { inputs, outputs, unitSystem, tribology, flowOffset, time } = state;

  // Header Title in view
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 10px IBM Plex Mono, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`API 682 ${inputs.planId.toUpperCase()} P&ID SCHEMATIC`, x + 16, y + 24);

  // Pump & Chamber Coordinates
  const pumpCenterX = x + w * 0.22;
  const pumpCenterY = y + h * 0.54;
  const chamberX = x + w * 0.50;
  const chamberY = pumpCenterY - 45;
  const chamberW = Math.min(180, w * 0.38);
  const chamberH = 120;

  // 1. Draw Pump Volute & Impeller
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;

  // Suction Nozzle
  ctx.beginPath();
  ctx.rect(pumpCenterX - 55, pumpCenterY + 5, 35, 26);
  ctx.fill();
  ctx.stroke();

  // Discharge Nozzle
  ctx.beginPath();
  ctx.rect(pumpCenterX - 14, pumpCenterY - 70, 28, 35);
  ctx.fill();
  ctx.stroke();

  // Volute Body
  ctx.beginPath();
  ctx.arc(pumpCenterX, pumpCenterY, 38, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.strokeStyle = '#64748b';
  ctx.stroke();

  // Impeller spinning vanes
  ctx.save();
  ctx.translate(pumpCenterX, pumpCenterY);
  ctx.rotate(time * 3);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  for (let a = 0; a < 4; a++) {
    ctx.beginPath();
    ctx.arc(0, 0, 24, (a * Math.PI) / 2, (a * Math.PI) / 2 + 0.8);
    ctx.stroke();
  }
  ctx.restore();

  // 2. Draw Pump Shaft extending through Seal Chamber
  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  const shaftY = pumpCenterY - 10;
  const shaftH = 20;
  ctx.fillRect(pumpCenterX, shaftY, chamberX + chamberW - pumpCenterX + 35, shaftH);
  ctx.strokeRect(pumpCenterX, shaftY, chamberX + chamberW - pumpCenterX + 35, shaftH);

  // 3. Draw Stuffing Box / Seal Chamber Outer Housing
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(chamberX, chamberY, chamberW, chamberH, 4);
  ctx.fill();
  ctx.stroke();

  // Stuffing Box Fluid Fill
  const chamberColor = tribology.hasVaporFlash ? 'rgba(244, 63, 94, 0.25)' : 'rgba(56, 189, 248, 0.18)';
  ctx.fillStyle = chamberColor;
  ctx.fillRect(chamberX + 8, chamberY + 8, chamberW - 16, chamberH - 16);

  // Throat Bushing at pump side
  ctx.fillStyle = '#475569';
  ctx.fillRect(chamberX, shaftY - 14, 12, 14);
  ctx.fillRect(chamberX, shaftY + shaftH, 12, 14);

  // Primary Mechanical Seal Faces Inside Chamber
  const faceX = chamberX + chamberW * 0.48;

  // Rotating Seal Ring (Shaft mounted)
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(faceX - 10, shaftY - 26, 8, 26);
  ctx.fillRect(faceX - 10, shaftY + shaftH, 8, 26);

  // Stationary Seal Ring (Gland mounted)
  ctx.fillStyle = '#0d9488';
  ctx.fillRect(faceX, shaftY - 26, 8, 26);
  ctx.fillRect(faceX, shaftY + shaftH, 8, 26);

  // Micro-gap line between faces
  ctx.strokeStyle = tribology.hasVaporFlash ? '#f43f5e' : '#fbbf24';
  ctx.lineWidth = tribology.hasVaporFlash ? 2.5 : 1.5;
  ctx.beginPath();
  ctx.moveTo(faceX - 1, shaftY - 28);
  ctx.lineTo(faceX - 1, shaftY);
  ctx.moveTo(faceX - 1, shaftY + shaftH);
  ctx.lineTo(faceX - 1, shaftY + shaftH + 28);
  ctx.stroke();

  // Vapor Flash Glow on Seal Faces
  if (tribology.hasVaporFlash) {
    const pulse = (Math.sin(time * 12) + 1) / 2;
    ctx.fillStyle = `rgba(244, 63, 94, ${0.4 + pulse * 0.4})`;
    ctx.beginPath();
    ctx.arc(faceX, shaftY - 13, 14, 0, Math.PI * 2);
    ctx.arc(faceX, shaftY + shaftH + 13, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. API 682 Plan-Specific Piping Loop
  drawPlanPipingLoop(ctx, pumpCenterX, pumpCenterY, chamberX, chamberY, chamberW, chamberH, faceX, inputs, outputs, flowOffset, time);

  // 5. SCADA Telemetry Badges in P&ID view
  drawPidTelemetry(ctx, x, y, w, h, inputs, outputs, tribology, unitSystem);

  ctx.restore();
}

// -------------------------------------------------------------
// P&ID Auxiliary Piping Circuits
// -------------------------------------------------------------
function drawPlanPipingLoop(
  ctx: CanvasRenderingContext2D,
  pumpX: number,
  pumpY: number,
  chamberX: number,
  chamberY: number,
  chamberW: number,
  chamberH: number,
  faceX: number,
  inputs: SealInputs,
  outputs: SealOutputs,
  flowOffset: number,
  time: number
) {
  ctx.save();
  const pipeColor = '#38bdf8';
  ctx.strokeStyle = pipeColor;
  ctx.lineWidth = 3;

  const topPipeY = chamberY - 30;

  if (inputs.planId === 'plan_11' || inputs.planId === 'plan_21') {
    // Discharge -> (Cooler) -> Orifice -> Chamber
    ctx.beginPath();
    ctx.moveTo(pumpX, pumpY - 70);
    ctx.lineTo(pumpX, topPipeY);
    ctx.lineTo(chamberX + chamberW * 0.4, topPipeY);
    ctx.lineTo(chamberX + chamberW * 0.4, chamberY);
    ctx.stroke();

    // Restriction Orifice
    const orX = chamberX + 15;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(orX - 10, topPipeY - 10, 20, 20);
    ctx.strokeStyle = '#38bdf8';
    ctx.strokeRect(orX - 10, topPipeY - 10, 20, 20);
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(orX, topPipeY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`RO Ø${inputs.flushOrificeDiameterMm}mm`, orX, topPipeY - 14);

    // Plan 21 Cooler
    if (inputs.planId === 'plan_21') {
      const hxX = (pumpX + orX) / 2;
      drawCoolerSymbol(ctx, hxX, topPipeY, outputs.actualCoolerHeatRemovalKW);
    }
  } else if (inputs.planId === 'plan_23') {
    // Plan 23: Pumping Ring -> Cooler -> Chamber (Closed Loop)
    const returnPipeY = topPipeY - 15;
    // Outlet from pumping ring
    ctx.strokeStyle = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(chamberX + chamberW * 0.25, chamberY);
    ctx.lineTo(chamberX + chamberW * 0.25, topPipeY);
    ctx.lineTo(chamberX + chamberW * 0.65, topPipeY);
    ctx.stroke();

    // Cooled Return line
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(chamberX + chamberW * 0.65, topPipeY);
    ctx.lineTo(chamberX + chamberW * 0.85, topPipeY);
    ctx.lineTo(chamberX + chamberW * 0.85, chamberY);
    ctx.stroke();

    // Closed loop cooler
    const hxX = chamberX + chamberW * 0.55;
    drawCoolerSymbol(ctx, hxX, topPipeY, outputs.actualCoolerHeatRemovalKW);
  } else if (inputs.planId.startsWith('plan_53')) {
    // Plan 53A/B/C: Dual Pressurized Barrier Reservoir/Accumulator
    const potX = chamberX + chamberW * 0.5;
    const potY = topPipeY - 30;

    // Circulation lines to barrier cavity
    ctx.beginPath();
    ctx.moveTo(chamberX + chamberW * 0.6, chamberY);
    ctx.lineTo(chamberX + chamberW * 0.6, topPipeY);
    ctx.lineTo(potX + 18, topPipeY);
    ctx.lineTo(potX + 18, potY + 25);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(potX - 18, potY + 25);
    ctx.lineTo(potX - 18, topPipeY);
    ctx.lineTo(chamberX + chamberW * 0.75, topPipeY);
    ctx.lineTo(chamberX + chamberW * 0.75, chamberY);
    ctx.stroke();

    // Accumulator / Reservoir Pot
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#f27d26';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(potX - 22, potY - 20, 44, 48, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f27d26';
    ctx.font = 'bold 7.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(inputs.planId === 'plan_53b' ? '53B ACC' : '53A POT', potX, potY - 24);
    ctx.fillText(`${inputs.barrierBufferPressureKPag} kPa`, potX, potY + 5);
  }

  // Animated Flow Particles
  drawFlowParticlesAlongLoop(ctx, pumpX, topPipeY, chamberX + chamberW * 0.4, chamberY, flowOffset);

  ctx.restore();
}

function drawCoolerSymbol(ctx: CanvasRenderingContext2D, x: number, y: number, dutyKW: number) {
  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(x - 22, y - 14, 44, 28, 4);
  ctx.fill();
  ctx.stroke();

  // Internal wavy cooling coils
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x - 16, y - 6);
  ctx.lineTo(x - 8, y + 6);
  ctx.lineTo(x, y - 6);
  ctx.lineTo(x + 8, y + 6);
  ctx.lineTo(x + 16, y - 6);
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = '7.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`HX: ${dutyKW.toFixed(1)} kW`, x, y + 23);
  ctx.restore();
}

function drawFlowParticlesAlongLoop(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  offset: number
) {
  ctx.save();
  ctx.fillStyle = '#38bdf8';
  const span = Math.abs(x2 - x1) + Math.abs(y2 - y1);
  const numDots = Math.floor(span / 26);
  for (let i = 0; i < numDots; i++) {
    const d = (i * 26 + offset) % span;
    let px = x1;
    let py = y1;
    if (d < Math.abs(x2 - x1)) {
      px = x1 + (x2 > x1 ? d : -d);
      py = y1;
    } else {
      px = x2;
      py = y1 + (d - Math.abs(x2 - x1));
    }
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPidTelemetry(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  inputs: SealInputs,
  outputs: SealOutputs,
  tribology: SealTribologyAnalysisResult,
  unitSystem: UnitSystem
) {
  ctx.save();
  const hudW = Math.min(220, w - 24);
  const hudH = 68;
  const hudX = x + 12;
  const hudY = y + h - hudH - 12;

  ctx.fillStyle = 'rgba(13, 17, 23, 0.90)';
  ctx.strokeStyle = '#30363d';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(hudX, hudY, hudW, hudH, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#8b949e';
  ctx.font = 'bold 8.5px IBM Plex Mono, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('P&ID HYDRAULICS TELEMETRY', hudX + 8, hudY + 13);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '8px IBM Plex Mono, monospace';
  ctx.fillText(`P_box: ${inputs.sealChamberPressureKPag} kPag`, hudX + 8, hudY + 28);
  ctx.fillText(`P_disch: ${inputs.pumpDischargePressureKPag} kPag`, hudX + 8, hudY + 42);
  ctx.fillText(`Flow: ${outputs.actualFlushFlowLpm.toFixed(1)} L/min`, hudX + 8, hudY + 56);

  const col2X = hudX + hudW * 0.52;
  ctx.fillText(`T_box: ${outputs.sealChamberOperatingTempC.toFixed(0)}°C`, col2X, hudY + 28);
  ctx.fillText(`ΔP_vap: ${outputs.vaporPressureMarginKPa.toFixed(0)} kPa`, col2X, hudY + 42);
  ctx.fillStyle = tribology.hasVaporFlash ? '#f43f5e' : '#34d399';
  ctx.fillText(tribology.hasVaporFlash ? 'FLASHING' : 'VAPOR SAFE', col2X, hudY + 56);

  ctx.restore();
}

// -------------------------------------------------------------
// Sub-View 2: Sub-Micron Seal Face Tribology & Vapor Boiling Inset
// -------------------------------------------------------------
function drawSubMicronTribologyView(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  state: {
    inputs: SealInputs;
    outputs: SealOutputs;
    unitSystem: UnitSystem;
    coningMode: ConingModeOption;
    showVaporBubbles: boolean;
    showPressureCurve: boolean;
    microZoom: number;
    tribology: SealTribologyAnalysisResult;
    flowOffset: number;
    time: number;
    bubbles: Array<any>;
  }
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const {
    inputs,
    tribology,
    coningMode,
    showVaporBubbles,
    showPressureCurve,
    microZoom,
    time,
    bubbles,
  } = state;

  // Header Title
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 10px IBM Plex Mono, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('SUB-MICRON SEAL FACE TRIBOLOGY & PHASE-CHANGE', x + 14, y + 20);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '8px IBM Plex Mono, monospace';
  ctx.fillText(`Reynolds Lubrication Gap h(r)=0.5-3.5µm | Coning β=${tribology.coningAngleUrad.toFixed(1)} µrad`, x + 14, y + 32);

  // Geometric Layout for Micro-Cutaway
  const cutawayX = x + 20;
  const cutawayY = y + 50;
  const cutawayW = w - 40;
  const cutawayH = Math.min(220, h * 0.44);

  // Seal Face Interface Coordinates
  const interfaceY = cutawayY + cutawayH * 0.52;
  const idX = cutawayX + 45; // Inner Diameter (left)
  const odX = cutawayX + cutawayW - 45; // Outer Diameter (right)
  const faceSpan = odX - idX;

  // Zoom scale: 1 um film thickness = (microZoom / 1000) * 12 pixels
  const pxPerUm = (microZoom / 1000) * 8.5;

  // Dynamic Puffing Axial Vibration Offset
  const puffingVibeY = tribology.hasVaporFlash
    ? Math.sin(time * 35) * (tribology.faceSeparationAmplitudeUm * pxPerUm * 0.6)
    : 0;

  // 1. Draw Rotating Ring (Top Face - SiC/TC)
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;

  // Top Ring Body
  ctx.beginPath();
  ctx.rect(idX - 15, cutawayY + 10, faceSpan + 30, interfaceY - (cutawayY + 10) - 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ROTATING SEAL RING (SHAFT)', idX + faceSpan / 2, cutawayY + 28);

  // 2. Draw Stationary Ring (Bottom Face - Carbon/SiC)
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#0d9488';
  ctx.lineWidth = 1.5;

  // Bottom Ring Body
  ctx.beginPath();
  ctx.rect(idX - 15, interfaceY + 20, faceSpan + 30, cutawayY + cutawayH - (interfaceY + 20) - 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#2dd4bf';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('STATIONARY SEAL RING (GLAND)', idX + faceSpan / 2, cutawayY + cutawayH - 18);

  // 3. Render Micro-Gap Fluid Film with Coning Geometry
  // Top Face profile y_top(r) and Bottom Face profile y_bot(r)
  const nodes = tribology.radialNodes;
  ctx.save();

  // Draw Fluid Film Polygon
  ctx.beginPath();
  // Bottom face profile (flat baseline)
  ctx.moveTo(idX, interfaceY + 1);
  ctx.lineTo(odX, interfaceY + 1);

  // Top face profile (tilted by coning + dynamic puffing gap)
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    const nx = idX + n.radiusNorm * faceSpan;
    const ny = interfaceY - n.filmThicknessUm * pxPerUm - puffingVibeY;
    ctx.lineTo(nx, ny);
  }
  ctx.closePath();

  // Fluid Film Fill Gradient (Blue cold at OD to Amber/Red vaporized at ID/peak)
  const filmGrad = ctx.createLinearGradient(idX, 0, odX, 0);
  filmGrad.addColorStop(0, '#f43f5e'); // ID flashing hot
  filmGrad.addColorStop(0.4, '#fbbf24'); // Mid face
  filmGrad.addColorStop(1, '#38bdf8'); // OD cool process fluid
  ctx.fillStyle = filmGrad;
  ctx.fill();
  ctx.restore();

  // Draw Face Boundary Lines
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;

  // Bottom stationary face line
  ctx.beginPath();
  ctx.moveTo(idX - 15, interfaceY + 1);
  ctx.lineTo(odX + 15, interfaceY + 1);
  ctx.stroke();

  // Top rotating face line
  ctx.beginPath();
  nodes.forEach((n, idx) => {
    const nx = idX + n.radiusNorm * faceSpan;
    const ny = interfaceY - n.filmThicknessUm * pxPerUm - puffingVibeY;
    if (idx === 0) ctx.moveTo(nx - 15, ny);
    ctx.lineTo(nx, ny);
    if (idx === nodes.length - 1) ctx.lineTo(nx + 15, ny);
  });
  ctx.stroke();

  // 4. Highlight Phase-Change Boiling Zone & Nucleation Bubbles
  if (tribology.hasVaporFlash && showVaporBubbles) {
    const boilNorm = tribology.boilingRadiusNorm || 0.45;
    const boilX = idX + boilNorm * faceSpan;

    // Vapor Boiling Region Shading
    ctx.fillStyle = 'rgba(244, 63, 94, 0.28)';
    ctx.fillRect(idX, interfaceY - 45, boilX - idX, 90);

    // Flashing boundary dotted line
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(boilX, interfaceY - 45);
    ctx.lineTo(boilX, interfaceY + 45);
    ctx.stroke();
    ctx.setLineDash([]);

    // Boundary Label
    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 8.5px IBM Plex Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VAPOR FLASH BOUNDARY', boilX, interfaceY - 48);
    ctx.fillText(`r_boil = ${tribology.boilingRadiusMm?.toFixed(1)} mm`, boilX, interfaceY + 54);

    // Draw Boiling Bubbles blowing out towards ID
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 1;
    bubbles.forEach((b) => {
      const bx = boilX - (b.x % (boilX - idX + 5));
      const by = interfaceY + b.y * 0.5 - 6;
      ctx.beginPath();
      ctx.arc(bx, by, Math.max(1, b.r), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Acoustic Chatter Burst Indicators
    const numWaves = 3;
    for (let wIdx = 0; wIdx < numWaves; wIdx++) {
      const waveR = ((time * 40 + wIdx * 15) % 45);
      const waveAlpha = 1 - waveR / 45;
      ctx.strokeStyle = `rgba(239, 68, 68, ${waveAlpha * 0.7})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(idX, interfaceY, waveR, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.stroke();
    }
  }

  // 5. Film Thickness Callouts (h_ID vs h_OD)
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`h_ID = ${tribology.radialNodes[0]?.filmThicknessUm.toFixed(2)} µm`, idX - 25, interfaceY + 14);

  ctx.textAlign = 'right';
  ctx.fillText(`h_OD = ${tribology.radialNodes[nodes.length - 1]?.filmThicknessUm.toFixed(2)} µm`, odX + 25, interfaceY + 14);

  // 6. Draw Radial Pressure & Saturation Vapor Pressure Curves below interface
  if (showPressureCurve) {
    drawPressureDistributionCurves(ctx, cutawayX, cutawayY + cutawayH + 8, cutawayW, h - (cutawayY + cutawayH + 16), tribology, idX, odX);
  }

  // 7. Right-Side Diagnostics & Tribology Telemetry HUD
  drawTribologyHUD(ctx, x, y, w, h, tribology);

  ctx.restore();
}

// -------------------------------------------------------------
// Sub-Micron Pressure Distribution Curves: P(r) vs Psat(T)
// -------------------------------------------------------------
function drawPressureDistributionCurves(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tribology: SealTribologyAnalysisResult,
  idX: number,
  odX: number
) {
  if (h < 50) return;
  ctx.save();

  const plotH = Math.min(65, h - 20);
  const plotY = y + 15;
  const nodes = tribology.radialNodes;
  const maxP = Math.max(...nodes.map((n) => Math.max(n.pressureKPa, n.vaporPressureKPa))) * 1.1;

  // Frame Box
  ctx.fillStyle = 'rgba(10, 15, 26, 0.85)';
  ctx.strokeStyle = '#30363d';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(idX, plotY, odX - idX, plotH);
  ctx.fill();
  ctx.stroke();

  // Title
  ctx.fillStyle = '#94a3b8';
  ctx.font = '8px IBM Plex Mono, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Radial Fluid Film Pressure P(r) vs Saturation Vapor Pressure P_sat(T)', idX + 4, plotY - 4);

  // Saturation Vapor Pressure Curve (Dashed Rose line)
  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = 1.8;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  nodes.forEach((n, idx) => {
    const nx = idX + n.radiusNorm * (odX - idX);
    const ny = plotY + plotH - (n.vaporPressureKPa / maxP) * plotH;
    if (idx === 0) ctx.moveTo(nx, ny);
    else ctx.lineTo(nx, ny);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  // Local Fluid Film Pressure Curve (Solid Cyan line)
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  nodes.forEach((n, idx) => {
    const nx = idX + n.radiusNorm * (odX - idX);
    const ny = plotY + plotH - (n.pressureKPa / maxP) * plotH;
    if (idx === 0) ctx.moveTo(nx, ny);
    else ctx.lineTo(nx, ny);
  });
  ctx.stroke();

  // Legends
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('— P_film(r)', idX + 6, plotY + 12);
  ctx.fillStyle = '#f43f5e';
  ctx.fillText('-- P_sat(T)', idX + 70, plotY + 12);

  ctx.restore();
}

// -------------------------------------------------------------
// Tribology Engineering HUD Panel
// -------------------------------------------------------------
function drawTribologyHUD(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tribology: SealTribologyAnalysisResult
) {
  ctx.save();
  const hudW = Math.min(230, w * 0.40);
  const hudH = 96;
  const hudX = x + w - hudW - 12;
  const hudY = y + 14;

  ctx.fillStyle = 'rgba(13, 17, 23, 0.94)';
  ctx.strokeStyle = tribology.hasVaporFlash ? '#f43f5e' : '#30363d';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(hudX, hudY, hudW, hudH, 4);
  ctx.fill();
  ctx.stroke();

  // Header
  ctx.fillStyle = tribology.hasVaporFlash ? '#f87171' : '#58a6ff';
  ctx.font = 'bold 8.5px IBM Plex Mono, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('API 682 TRIBOLOGY METRICS', hudX + 8, hudY + 14);

  // Column 1
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '8px IBM Plex Mono, monospace';
  ctx.fillText(`F_open: ${tribology.openingForceN.toFixed(0)} N`, hudX + 8, hudY + 30);
  ctx.fillText(`F_close: ${tribology.closingForceN.toFixed(0)} N`, hudX + 8, hudY + 44);
  ctx.fillText(`h_mean: ${tribology.meanFilmThicknessUm.toFixed(2)} µm`, hudX + 8, hudY + 58);
  ctx.fillText(`Leakage: ${tribology.estimatedLeakageMlPerHour.toFixed(1)} mL/h`, hudX + 8, hudY + 72);

  // Column 2
  const col2 = hudX + hudW * 0.52;
  ctx.fillText(`k_film: ${(tribology.filmStiffnessNPerUm / 1000).toFixed(1)} kN/µm`, col2, hudY + 30);
  ctx.fillText(`Coning: ${tribology.coningAngleUrad.toFixed(1)} µrad`, col2, hudY + 44);
  ctx.fillText(`Regime: ${tribology.lubricationRegime.split('_')[0].toUpperCase()}`, col2, hudY + 58);

  // Puffing & Chatter Status
  ctx.fillStyle = tribology.hasVaporFlash ? '#f43f5e' : '#34d399';
  ctx.font = 'bold 8px IBM Plex Mono, monospace';
  if (tribology.hasVaporFlash) {
    ctx.fillText(`PUFFING: ${tribology.puffingFrequencyHz} Hz (${tribology.acousticChatterDb.toFixed(0)} dB)`, hudX + 8, hudY + 87);
  } else {
    ctx.fillText('FILM STABLE (NO FLASHING)', hudX + 8, hudY + 87);
  }

  ctx.restore();
}

// -------------------------------------------------------------
// Background Grid
// -------------------------------------------------------------
function drawBlueprintGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  const gridSize = 28;
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.restore();
}
