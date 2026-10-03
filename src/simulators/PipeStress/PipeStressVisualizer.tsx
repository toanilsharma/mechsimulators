import React, { useRef, useEffect, useState, useMemo } from 'react';
import { PipeInputs, PipeOutputs } from '../../types/pipe';
import { UnitSystem } from '../../types/common';
import { VisualCanvas } from '../../components/Shared/VisualCanvas';
import { convertTemp, convertPressure, formatNum } from '../../utils/units';
import {
  calculatePipeFeaStress,
  getTurboColormapHex,
  PipeFeaAnalysisResult,
} from '../../physics/pipeFeaStressMath';
import {
  Layers,
  Activity,
  Sliders,
  Maximize2,
  Box,
  Compass,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface PipeStressVisualizerProps {
  inputs: PipeInputs;
  outputs: PipeOutputs;
  isRunning?: boolean;
  unitSystem: UnitSystem;
}

export const PipeStressVisualizer: React.FC<PipeStressVisualizerProps> = ({
  inputs,
  outputs,
  isRunning = true,
  unitSystem,
}) => {
  const [colorMode, setColorMode] = useState<'turbo_stress' | 'temperature'>('turbo_stress');
  const [magnification, setMagnification] = useState<number>(15);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [showFeaMesh, setShowFeaMesh] = useState<boolean>(true);
  const [showElbowOvalization, setShowElbowOvalization] = useState<boolean>(true);
  const [showApi610Ellipsoid, setShowApi610Ellipsoid] = useState<boolean>(true);

  // Failure & Special Mode Flags
  const isAnchorFailed = outputs.isAnchorFailed || inputs.isAnchorFailed || inputs.scenarioId === 'failed_anchor';
  const isSupportFailed = outputs.isSupportFailed || inputs.isSupportFailed || inputs.scenarioId === 'failed_support';
  const isThermalShock = outputs.isThermalShock || inputs.isThermalShock || inputs.scenarioId === 'thermal_shock';
  const isNozzleOverloaded = outputs.isNozzleOverloaded || inputs.scenarioId === 'nozzle_overload_on_pump';

  const headerControls = (
    <div className="flex items-center gap-1.5 font-mono text-[10px] flex-wrap">
      {/* Colormap Switcher */}
      <div className="flex bg-[#0d1117] border border-[#30363d] rounded p-0.5 gap-0.5">
        <button
          onClick={() => setColorMode('turbo_stress')}
          className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
            colorMode === 'turbo_stress' ? 'bg-[#f27d26] text-white font-bold' : 'text-[#8b949e] hover:text-white'
          }`}
          title="Continuous Scientific Turbo von Mises Stress Colormap"
        >
          Turbo von Mises
        </button>
        <button
          onClick={() => setColorMode('temperature')}
          className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
            colorMode === 'temperature' ? 'bg-cyan-500 text-white font-bold' : 'text-[#8b949e] hover:text-white'
          }`}
          title="Thermal Expansion Temperature Gradient"
        >
          Thermal Map
        </button>
      </div>

      {/* FEA Mesh Discretization Toggle */}
      <button
        onClick={() => setShowFeaMesh(!showFeaMesh)}
        className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
          showFeaMesh ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300 font-bold' : 'bg-[#0d1117] border-[#30363d] text-[#8b949e]'
        }`}
        title="Toggle 50-Element Euler-Bernoulli FEA Mesh Discretization"
      >
        <Layers className="w-3 h-3" />
        <span>FEA Mesh: {showFeaMesh ? '50 Elem' : 'OFF'}</span>
      </button>

      {/* Elbow Karman Ovalization Toggle */}
      <button
        onClick={() => setShowElbowOvalization(!showElbowOvalization)}
        className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
          showElbowOvalization ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 font-bold' : 'bg-[#0d1117] border-[#30363d] text-[#8b949e]'
        }`}
        title="Toggle ASME B31.3 Elbow Karman Ovalization & SIF Inset"
      >
        <Compass className="w-3 h-3" />
        <span>Elbow Oval: {showElbowOvalization ? 'ON' : 'OFF'}</span>
      </button>

      {/* API 610 Nozzle Ellipsoid Toggle */}
      <button
        onClick={() => setShowApi610Ellipsoid(!showApi610Ellipsoid)}
        className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
          showApi610Ellipsoid ? 'bg-rose-950/60 border-rose-500/50 text-rose-300 font-bold' : 'bg-[#0d1117] border-[#30363d] text-[#8b949e]'
        }`}
        title="Toggle API 610 Annex F 3D Nozzle Interaction Ellipsoid"
      >
        <Box className="w-3 h-3" />
        <span>API 610 3D: {showApi610Ellipsoid ? 'ON' : 'OFF'}</span>
      </button>

      {/* Magnification */}
      <div className="flex items-center gap-1 bg-[#0d1117] border border-[#30363d] px-2 py-0.5 rounded text-[#8b949e]">
        <span>Deflect:</span>
        <button
          onClick={() => setMagnification(magnification === 1 ? 15 : magnification === 15 ? 30 : 1)}
          className="text-[#58a6ff] hover:text-white font-bold"
          title="Toggle exaggerated deformation view"
        >
          {magnification}x
        </button>
      </div>

      {/* Vector Toggles */}
      <button
        onClick={() => setShowVectors(!showVectors)}
        className={`px-2 py-0.5 rounded border transition-colors ${
          showVectors ? 'bg-[#21262d] border-amber-500/50 text-amber-300' : 'bg-[#0d1117] border-[#30363d] text-[#8b949e]'
        }`}
        title="Toggle vector force and movement arrows"
      >
        Vec: {showVectors ? 'ON' : 'OFF'}
      </button>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col">
      <VisualCanvas<PipeInputs, PipeOutputs>
        simulator="pipe"
        inputs={inputs}
        outputs={outputs}
        unitSystem={unitSystem}
        isRunning={isRunning}
        title="Piping Thermal Kinematics & Stress Digital Twin (ASME B31.3 / API 610)"
        subtitle="Real-time 50-element FEA discretization, Turbo von Mises gradient, Karman elbow ovalization & Annex F nozzle 3D interaction ellipsoid"
        headerControls={headerControls}
        overlayBadge={
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span
              className={`px-2 py-0.5 rounded border font-bold ${
                outputs.stressState === 'critical'
                  ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
                  : outputs.stressState === 'warning'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              }`}
            >
              {outputs.stressState === 'critical' ? 'CRITICAL OVERSTRESS' : outputs.stressState === 'warning' ? 'NEAR LIMIT' : 'ASME COMPLIANT'}
            </span>
          </div>
        }
        renderVisual={({ containerWidth, containerHeight, isRunning }) => {
          return (
            <PipeCanvasRenderer
              width={containerWidth}
              height={containerHeight}
              inputs={inputs}
              outputs={outputs}
              unitSystem={unitSystem}
              colorMode={colorMode}
              magnification={magnification}
              showVectors={showVectors}
              showFeaMesh={showFeaMesh}
              showElbowOvalization={showElbowOvalization}
              showApi610Ellipsoid={showApi610Ellipsoid}
              isAnchorFailed={isAnchorFailed}
              isSupportFailed={isSupportFailed}
              isThermalShock={isThermalShock}
              isNozzleOverloaded={isNozzleOverloaded}
              isRunning={isRunning}
            />
          );
        }}
      />
    </div>
  );
};

interface PipeCanvasRendererProps {
  width: number;
  height: number;
  inputs: PipeInputs;
  outputs: PipeOutputs;
  unitSystem: UnitSystem;
  colorMode: 'turbo_stress' | 'temperature';
  magnification: number;
  showVectors: boolean;
  showFeaMesh: boolean;
  showElbowOvalization: boolean;
  showApi610Ellipsoid: boolean;
  isAnchorFailed: boolean;
  isSupportFailed: boolean;
  isThermalShock: boolean;
  isNozzleOverloaded: boolean;
  isRunning: boolean;
}

const PipeCanvasRenderer: React.FC<PipeCanvasRendererProps> = ({
  width,
  height,
  inputs,
  outputs,
  unitSystem,
  colorMode,
  magnification,
  showVectors,
  showFeaMesh,
  showElbowOvalization,
  showApi610Ellipsoid,
  isAnchorFailed,
  isSupportFailed,
  isThermalShock,
  isNozzleOverloaded,
  isRunning,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flowOffsetRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // Compute 50-Element Beam FEA, Elbow Karman Ovalization & API 610 Annex F interaction
  const feaResult = useMemo<PipeFeaAnalysisResult>(() => {
    return calculatePipeFeaStress({
      pipeLengthM: inputs.pipeLengthM || 20,
      pipeOuterDiameterMm: inputs.pipeOuterDiameterMm || 168.3,
      pipeWallThicknessMm: inputs.pipeWallThicknessMm || 7.11,
      modulusOfElasticityGPa: inputs.modulusOfElasticityGPa || 200,
      thermalExpansionCoeff_1e6PerC: inputs.thermalExpansionCoeff_1e6PerC || 12.0,
      deltaTempC: outputs.deltaTempC,
      operatingPressureBar: inputs.operatingPressureBar || 10,
      allowableStressMPa: outputs.allowableStressMPa || 138,
      anchorCondition: inputs.anchorCondition,
      restraintPercent: inputs.restraintPercent,
      expansionLoopWidthM: inputs.expansionLoopWidthM,
      expansionLoopHeightM: inputs.expansionLoopHeightM,
      nozzleLoadLimitKN: outputs.nozzleLoadLimitKN,
    });
  }, [inputs, outputs]);

  useEffect(() => {
    let animId: number;
    let lastT = performance.now();

    const render = (now: number) => {
      const dt = (now - lastT) / 1000;
      lastT = now;

      if (isRunning) {
        flowOffsetRef.current += dt * 45;
        timeRef.current += dt;
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

      drawPipeDigitalTwin(ctx, width, height, {
        inputs,
        outputs,
        unitSystem,
        colorMode,
        magnification,
        showVectors,
        showFeaMesh,
        showElbowOvalization,
        showApi610Ellipsoid,
        isAnchorFailed,
        isSupportFailed,
        isThermalShock,
        isNozzleOverloaded,
        flowOffset: flowOffsetRef.current,
        time: timeRef.current,
        feaResult,
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
    colorMode,
    magnification,
    showVectors,
    showFeaMesh,
    showElbowOvalization,
    showApi610Ellipsoid,
    isAnchorFailed,
    isSupportFailed,
    isThermalShock,
    isNozzleOverloaded,
    isRunning,
    feaResult,
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

function getThermalColor(tempC: number): string {
  if (tempC <= 25) return '#38bdf8';
  if (tempC <= 70) return '#34d399';
  if (tempC <= 140) return '#fbbf24';
  if (tempC <= 240) return '#f97316';
  return '#ef4444';
}

function drawPipeDigitalTwin(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: {
    inputs: PipeInputs;
    outputs: PipeOutputs;
    unitSystem: UnitSystem;
    colorMode: 'turbo_stress' | 'temperature';
    magnification: number;
    showVectors: boolean;
    showFeaMesh: boolean;
    showElbowOvalization: boolean;
    showApi610Ellipsoid: boolean;
    isAnchorFailed: boolean;
    isSupportFailed: boolean;
    isThermalShock: boolean;
    isNozzleOverloaded: boolean;
    flowOffset: number;
    time: number;
    feaResult: PipeFeaAnalysisResult;
  }
) {
  const {
    inputs,
    outputs,
    unitSystem,
    colorMode,
    magnification,
    showVectors,
    showFeaMesh,
    showElbowOvalization,
    showApi610Ellipsoid,
    isAnchorFailed,
    isSupportFailed,
    isThermalShock,
    isNozzleOverloaded,
    flowOffset,
    time,
    feaResult,
  } = state;

  ctx.clearRect(0, 0, w, h);

  // Background Engineering Substrate Grid
  ctx.save();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  const gridSize = 30;
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

  // Layout baseline geometry
  const centerY = h * 0.58;
  const leftX = w * 0.10;
  // Make room for right insets if enabled
  const rightX = (showElbowOvalization || showApi610Ellipsoid) ? w * 0.65 : w * 0.82;
  const totalSpan = rightX - leftX;

  const actualDeltaLMm = outputs.thermalExpansionMm;
  const effectiveRestraint = outputs.effectiveRestraintFactor;

  // Unconstrained growth in pixels on canvas
  const pxPerMm = (totalSpan / (inputs.pipeLengthM * 1000)) * magnification;
  const physicalGrowthPx = actualDeltaLMm * pxPerMm * (1 - effectiveRestraint);

  // Pipe Diameter visual thickness
  const basePipeThickness = Math.max(16, Math.min(34, (inputs.pipeOuterDiameterMm / 168.3) * 20));

  const hasExpansionLoop = inputs.anchorCondition === 'expansion_loop';
  const isFreeExpansion = inputs.anchorCondition === 'one_end_fixed_one_end_free' || effectiveRestraint === 0;

  // Draw Ground Reference Baseline
  const groundY = centerY + 45;
  ctx.save();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(leftX - 40, groundY);
  ctx.lineTo(rightX + 50, groundY);
  ctx.stroke();

  // Cross-hatching for ground foundation
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let gx = leftX - 40; gx < rightX + 50; gx += 12) {
    ctx.beginPath();
    ctx.moveTo(gx, groundY);
    ctx.lineTo(gx - 8, groundY + 12);
    ctx.stroke();
  }
  ctx.restore();

  // Draw Left Terminal Anchor
  drawLeftAnchor(ctx, leftX, centerY, groundY, isAnchorFailed, time, outputs.axialForceKN);

  // Draw Intermediate Support Guides
  const guideX = hasExpansionLoop ? leftX + totalSpan * 0.22 : leftX + totalSpan * 0.5;
  drawGuideSupport(ctx, guideX, centerY, groundY, isSupportFailed, time);

  if (hasExpansionLoop) {
    const guide2X = leftX + totalSpan * 0.78;
    drawGuideSupport(ctx, guide2X, centerY, groundY, false, time);
  }

  // Draw Right Terminal Component (Rigid Anchor, Sliding Roller, or Connected Pump Nozzle)
  const terminalEndPx = rightX + (isFreeExpansion || isAnchorFailed ? physicalGrowthPx : 0);
  drawRightTerminal(
    ctx,
    terminalEndPx,
    centerY,
    groundY,
    inputs.anchorCondition,
    isNozzleOverloaded || !feaResult.nozzle.isNozzleCompliant,
    isFreeExpansion,
    isAnchorFailed,
    time,
    outputs.nozzleLoadKN,
    outputs.nozzleLoadLimitKN
  );

  // Draw FEA Discretized Continuous Pipe Run
  if (hasExpansionLoop) {
    drawExpansionLoopPipe(
      ctx,
      leftX,
      terminalEndPx,
      centerY,
      basePipeThickness,
      colorMode,
      inputs,
      outputs,
      feaResult,
      showFeaMesh,
      flowOffset,
      time
    );
  } else {
    drawFeaStraightPipeRun(
      ctx,
      leftX,
      terminalEndPx,
      centerY,
      basePipeThickness,
      colorMode,
      inputs,
      outputs,
      feaResult,
      showFeaMesh,
      isSupportFailed,
      isThermalShock,
      flowOffset,
      time
    );
  }

  // Draw Vector Overlays
  if (showVectors) {
    drawVectorOverlays(
      ctx,
      leftX,
      terminalEndPx,
      centerY,
      inputs,
      outputs,
      actualDeltaLMm,
      isAnchorFailed,
      isNozzleOverloaded || !feaResult.nozzle.isNozzleCompliant
    );
  }

  // Top Scientific Turbo Stress Colormap Legend
  drawContinuousColormapLegend(ctx, leftX, 16, Math.min(totalSpan, 320), feaResult.asmeAllowableRangeSaMPa);

  // Draw Inset #1: ASME B31.3 Elbow Karman Ovalization Cutaway
  if (showElbowOvalization) {
    drawElbowOvalizationInset(ctx, w * 0.69, 14, w * 0.29, h * 0.44, feaResult.elbow, time);
  }

  // Draw Inset #2: API 610 Annex F 3D Nozzle Interaction Ellipsoid
  if (showApi610Ellipsoid) {
    drawApi610EllipsoidInset(ctx, w * 0.69, h * 0.50, w * 0.29, h * 0.46, feaResult.nozzle, time);
  }

  // Draw Engineering HUD Callouts
  drawEngineeringHUD(ctx, w, h, leftX, terminalEndPx, centerY, inputs, outputs, feaResult);
}

// -------------------------------------------------------------
// Scientific Turbo Colormap Legend Bar
// -------------------------------------------------------------
function drawContinuousColormapLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  saMPa: number
) {
  ctx.save();
  const barH = 10;

  // Background Box
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 4, width + 12, barH + 28, 4);
  ctx.fill();
  ctx.stroke();

  // Gradient Bar
  const grad = ctx.createLinearGradient(x, 0, x + width, 0);
  for (let s = 0; s <= 10; s++) {
    const t = s / 10;
    grad.addColorStop(t, getTurboColormapHex(t));
  }
  ctx.fillStyle = grad;
  ctx.fillRect(x, y + 12, width, barH);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y + 12, width, barH);

  // Labels
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 8px IBM Plex Mono, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('ASME B31.3 von Mises Stress Range S_E / S_A (Turbo Colormap)', x, y + 8);

  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('0 MPa (0%)', x, y + barH + 22);

  ctx.textAlign = 'center';
  ctx.fillText(`0.5 S_A (${(saMPa * 0.5).toFixed(0)} MPa)`, x + width * 0.5, y + barH + 22);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#f87171';
  ctx.fillText(`1.0 S_A (${saMPa.toFixed(0)} MPa)`, x + width, y + barH + 22);

  ctx.restore();
}

// -------------------------------------------------------------
// 50-Element Beam FEA Straight Run Renderer
// -------------------------------------------------------------
function drawFeaStraightPipeRun(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  baseY: number,
  thickness: number,
  colorMode: 'turbo_stress' | 'temperature',
  inputs: PipeInputs,
  outputs: PipeOutputs,
  feaResult: PipeFeaAnalysisResult,
  showFeaMesh: boolean,
  isSupportFailed: boolean,
  isThermalShock: boolean,
  flowOffset: number,
  time: number
) {
  ctx.save();
  const radius = thickness / 2;
  const nodes = feaResult.nodes;
  const totalLen = x2 - x1;

  // Render element-by-element von Mises gradient
  const numElems = nodes.length - 1;
  for (let i = 0; i < numElems; i++) {
    const n1 = nodes[i];
    const n2 = nodes[i + 1];

    const ex1 = x1 + n1.sNorm * totalLen;
    const ex2 = x1 + n2.sNorm * totalLen;

    const ey1 = baseY + (isSupportFailed ? Math.sin(n1.sNorm * Math.PI) * 16 : n1.dispYMm * 0.35);
    const ey2 = baseY + (isSupportFailed ? Math.sin(n2.sNorm * Math.PI) * 16 : n2.dispYMm * 0.35);

    // Color computation
    let elemColor: string;
    if (colorMode === 'temperature') {
      elemColor = getThermalColor(inputs.operatingTempC);
    } else {
      const avgRatio = (n1.stressRatio + n2.stressRatio) / 2;
      elemColor = getTurboColormapHex(avgRatio);
    }

    // Draw Element Trapezoid Body
    ctx.fillStyle = elemColor;
    ctx.beginPath();
    ctx.moveTo(ex1, ey1 - radius);
    ctx.lineTo(ex2, ey2 - radius);
    ctx.lineTo(ex2, ey2 + radius);
    ctx.lineTo(ex1, ey1 + radius);
    ctx.closePath();
    ctx.fill();

    // Specular highlight cylinder effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(ex1, ey1 - radius * 0.4);
    ctx.lineTo(ex2, ey2 - radius * 0.4);
    ctx.lineTo(ex2, ey2);
    ctx.lineTo(ex1, ey1);
    ctx.closePath();
    ctx.fill();

    // Node tick line if FEA mesh is enabled
    if (showFeaMesh) {
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ex1, ey1 - radius);
      ctx.lineTo(ex1, ey1 + radius);
      ctx.stroke();

      // Node indicator dots on outer fiber
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex1, ey1 - radius, 1.2, 0, Math.PI * 2);
      ctx.arc(ex1, ey1 + radius, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw Pipe Outer Contours
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  nodes.forEach((n, idx) => {
    const nx = x1 + n.sNorm * totalLen;
    const ny = baseY + (isSupportFailed ? Math.sin(n.sNorm * Math.PI) * 16 : n.dispYMm * 0.35);
    if (idx === 0) ctx.moveTo(nx, ny - radius);
    else ctx.lineTo(nx, ny - radius);
  });
  ctx.stroke();

  ctx.beginPath();
  nodes.forEach((n, idx) => {
    const nx = x1 + n.sNorm * totalLen;
    const ny = baseY + (isSupportFailed ? Math.sin(n.sNorm * Math.PI) * 16 : n.dispYMm * 0.35);
    if (idx === 0) ctx.moveTo(nx, ny + radius);
    else ctx.lineTo(nx, ny + radius);
  });
  ctx.stroke();

  // Internal Moving Process Fluid
  ctx.fillStyle = isThermalShock ? '#f97316' : '#38bdf8';
  const particleSpacing = 32;
  const numParticles = Math.floor(totalLen / particleSpacing);
  for (let i = 0; i <= numParticles; i++) {
    const px = x1 + ((i * particleSpacing + flowOffset) % totalLen);
    const sNorm = (px - x1) / totalLen;
    const py = baseY + (isSupportFailed ? Math.sin(sNorm * Math.PI) * 16 : 0);
    ctx.beginPath();
    ctx.arc(px, py, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// -------------------------------------------------------------
// Expansion U-Loop FEA Renderer
// -------------------------------------------------------------
function drawExpansionLoopPipe(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  y: number,
  thickness: number,
  colorMode: 'turbo_stress' | 'temperature',
  inputs: PipeInputs,
  outputs: PipeOutputs,
  feaResult: PipeFeaAnalysisResult,
  showFeaMesh: boolean,
  flowOffset: number,
  time: number
) {
  ctx.save();
  const radius = thickness / 2;
  const totalLen = x2 - x1;
  const loopCenterX = (x1 + x2) / 2;

  const loopWidthPx = Math.min(totalLen * 0.38, Math.max(50, (inputs.expansionLoopWidthM / 4.0) * 110));
  const loopHeightPx = Math.min(170, Math.max(60, (inputs.expansionLoopHeightM / 4.0) * 135));

  const leg1X = loopCenterX - loopWidthPx / 2;
  const leg2X = loopCenterX + loopWidthPx / 2;
  const topY = y - loopHeightPx;

  const flexDeltaX = Math.min(14, outputs.thermalExpansionMm * 0.32);
  const flexTopY = topY - Math.sin(time * 2) * 1.5;

  const elbowColor = colorMode === 'temperature'
    ? getThermalColor(inputs.operatingTempC)
    : getTurboColormapHex(Math.min(1.0, (feaResult.nodes[25]?.stressRatio || 0.6) * 1.25));

  ctx.strokeStyle = elbowColor;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(leg1X - flexDeltaX, y);
  ctx.lineTo(leg1X + flexDeltaX * 0.5, flexTopY);
  ctx.lineTo(leg2X - flexDeltaX * 0.5, flexTopY);
  ctx.lineTo(leg2X + flexDeltaX, y);
  ctx.lineTo(x2, y);
  ctx.stroke();

  // Elbow High-Stress Bending Hotspots
  const elbows = [
    { x: leg1X - flexDeltaX, y: y },
    { x: leg1X + flexDeltaX * 0.5, y: flexTopY },
    { x: leg2X - flexDeltaX * 0.5, y: flexTopY },
    { x: leg2X + flexDeltaX, y: y },
  ];

  elbows.forEach((pt) => {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, radius * 1.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  });

  // Loop Flexibility Adequacy Badge
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(loopCenterX - 50, flexTopY - 26, 100, 20);
  ctx.strokeStyle = outputs.isExpansionLoopAdequate ? '#10b981' : '#f59e0b';
  ctx.lineWidth = 1;
  ctx.strokeRect(loopCenterX - 50, flexTopY - 26, 100, 20);

  ctx.fillStyle = outputs.isExpansionLoopAdequate ? '#34d399' : '#fbbf24';
  ctx.font = 'bold 9px IBM Plex Mono, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(
    `H=${inputs.expansionLoopHeightM.toFixed(1)}m (${outputs.expansionLoopAdequacyPercent.toFixed(0)}%)`,
    loopCenterX,
    flexTopY - 13
  );

  ctx.restore();
}

// -------------------------------------------------------------
// Inset #1: ASME B31.3 Elbow Karman Ovalization Cutaway
// -------------------------------------------------------------
function drawElbowOvalizationInset(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  elbow: any,
  time: number
) {
  ctx.save();

  // Panel Frame
  ctx.fillStyle = 'rgba(10, 15, 26, 0.92)';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();

  // Header Title
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 9.5px IBM Plex Mono, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('ASME B31.3 90° ELBOW OVALIZATION', x + 10, y + 16);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '8px IBM Plex Mono, monospace';
  ctx.fillText('Karman Effect: Cross-Section Flattening under Bending', x + 10, y + 27);

  // Cross-Section Visual Center
  const centerX = x + w * 0.42;
  const centerY = y + h * 0.60;
  const baseR = Math.min(38, h * 0.25);

  // 1. Initial Circular Undeformed Cross-Section (Dashed reference)
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 2. Ovalized Deformed Ellipse under in-plane thermal bending moment
  // Karman flattening ratio
  const ovalFactor = Math.min(0.35, Math.max(0.04, (elbow.ovalizationRatioPercent || 8.0) / 100 * 2.2));
  const rMajor = baseR * (1 + ovalFactor);
  const rMinor = baseR * (1 - ovalFactor);

  // Ellipse Outer Skin
  ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, rMajor, rMinor, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pipe Wall Inner Bore
  ctx.fillStyle = '#0a0f1a';
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, rMajor * 0.85, rMinor * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Ovalization Deformation Dimension Arrows (Horizontal elongation & Vertical compression)
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX - rMajor, centerY);
  ctx.lineTo(centerX + rMajor, centerY);
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`Δr/rₘ = ${elbow.ovalizationRatioPercent.toFixed(1)}%`, centerX, centerY - rMinor - 5);

  // Right-side ASME B31.3 SIF & Flexibility factors table
  const colX = x + w * 0.68;
  ctx.textAlign = 'left';
  ctx.font = '8px IBM Plex Mono, monospace';

  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Char h:', colX, y + 46);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`${elbow.flexibilityCharacteristic_h.toFixed(3)}`, colX, y + 57);

  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Flex k:', colX, y + 72);
  ctx.fillStyle = '#f59e0b';
  ctx.fillText(`${elbow.flexibilityFactor_k.toFixed(2)}`, colX, y + 83);

  ctx.fillStyle = '#94a3b8';
  ctx.fillText('SIF in (i_i):', colX, y + 98);
  ctx.fillStyle = '#ef4444';
  ctx.fillText(`${elbow.sifInPlane_ii.toFixed(2)}`, colX, y + 109);

  ctx.fillStyle = '#94a3b8';
  ctx.fillText('SIF out (i_o):', colX, y + 124);
  ctx.fillStyle = '#f97316';
  ctx.fillText(`${elbow.sifOutOfPlane_io.toFixed(2)}`, colX, y + 135);

  ctx.restore();
}

// -------------------------------------------------------------
// Inset #2: API 610 Annex F 3D Nozzle Interaction Ellipsoid
// -------------------------------------------------------------
function drawApi610EllipsoidInset(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  nozzle: any,
  time: number
) {
  ctx.save();

  // Panel Frame
  ctx.fillStyle = 'rgba(10, 15, 26, 0.92)';
  ctx.strokeStyle = nozzle.isNozzleCompliant ? '#334155' : 'rgba(239, 68, 68, 0.6)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();

  // Header Title
  ctx.fillStyle = nozzle.isNozzleCompliant ? '#38bdf8' : '#ef4444';
  ctx.font = 'bold 9.5px IBM Plex Mono, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('API 610 ANNEX F NOZZLE ELLIPSOID', x + 10, y + 16);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '8px IBM Plex Mono, monospace';
  ctx.fillText('Table 5 Interaction: (Fx/Fxa)² + (Fy/Fya)² + (Fz/Fza)² ≤ 1.0', x + 10, y + 27);

  // Center Coordinates for 3D Ellipsoid
  const cX = x + w * 0.40;
  const cY = y + h * 0.58;
  const aX = Math.min(50, w * 0.24);
  const bY = Math.min(32, h * 0.22);

  // Isometric 3D Coordinate Axes
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;

  // Fx axis (pointing forward-left)
  ctx.beginPath();
  ctx.moveTo(cX, cY);
  ctx.lineTo(cX - aX * 1.25, cY + bY * 0.7);
  ctx.stroke();

  // Fy axis (vertical)
  ctx.beginPath();
  ctx.moveTo(cX, cY);
  ctx.lineTo(cX, cY - bY * 1.35);
  ctx.stroke();

  // Fz axis (pointing right)
  ctx.beginPath();
  ctx.moveTo(cX, cY);
  ctx.lineTo(cX + aX * 1.25, cY - bY * 0.25);
  ctx.stroke();

  // 3D Allowable Boundary Wireframe Ellipsoid
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);

  // Equator ellipse
  ctx.beginPath();
  ctx.ellipse(cX, cY, aX, bY * 0.6, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Vertical meridian 1
  ctx.beginPath();
  ctx.ellipse(cX, cY, aX * 0.75, bY, 0.35, 0, Math.PI * 2);
  ctx.stroke();

  // Vertical meridian 2
  ctx.beginPath();
  ctx.ellipse(cX, cY, aX, bY, -0.2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Compute Operating Reaction Vector coordinates normalized to allowable
  const ir = nozzle.combinedInteractionRatio || 0.85;
  const ptX = cX + (nozzle.actualFxKN / nozzle.allowableFKN) * aX * 0.95;
  const ptY = cY - (nozzle.actualFyKN / (nozzle.allowableFKN * 0.8)) * bY * 0.95;

  // Projection Vector Line
  ctx.strokeStyle = nozzle.isNozzleCompliant ? '#10b981' : '#ef4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cX, cY);
  ctx.lineTo(ptX, ptY);
  ctx.stroke();

  // Reaction Point Marker
  ctx.fillStyle = nozzle.isNozzleCompliant ? '#10b981' : '#ef4444';
  ctx.beginPath();
  ctx.arc(ptX, ptY, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Telemetry details on right side
  const rx = x + w * 0.67;
  ctx.textAlign = 'left';
  ctx.font = '8px IBM Plex Mono, monospace';

  ctx.fillStyle = '#94a3b8';
  ctx.fillText('F_actual:', rx, y + 46);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`${nozzle.actualResultantFKN.toFixed(1)} kN`, rx, y + 57);

  ctx.fillStyle = '#94a3b8';
  ctx.fillText('F_allow:', rx, y + 72);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`${nozzle.allowableFKN.toFixed(1)} kN`, rx, y + 83);

  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Table 5 IR:', rx, y + 98);
  ctx.fillStyle = nozzle.isNozzleCompliant ? '#10b981' : '#ef4444';
  ctx.font = 'bold 9px IBM Plex Mono, monospace';
  ctx.fillText(`${ir.toFixed(2)} ${nozzle.isNozzleCompliant ? 'PASS' : 'FAIL'}`, rx, y + 110);

  // Casing distortion warning badge
  if (!nozzle.isNozzleCompliant) {
    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 7.5px IBM Plex Mono, monospace';
    ctx.fillText(`Distortion: ${nozzle.pumpCasingDistortionUm.toFixed(0)} µm`, rx - 10, y + 128);
    ctx.fillText(`Misalign: ${nozzle.couplingAngularMisalignmentMrad.toFixed(2)} mrad`, rx - 10, y + 140);
  } else {
    ctx.fillStyle = '#34d399';
    ctx.font = '8px IBM Plex Mono, monospace';
    ctx.fillText('Shaft Aligned', rx, y + 128);
  }

  ctx.restore();
}

// -------------------------------------------------------------
// Sub-renderers: Anchors, Guides, Flanges & HUD
// -------------------------------------------------------------
function drawLeftAnchor(
  ctx: CanvasRenderingContext2D,
  x: number,
  pipeY: number,
  groundY: number,
  isFailed: boolean,
  time: number,
  axialForceKN: number
) {
  ctx.save();
  if (isFailed) {
    const pulse = (Math.sin(time * 6) + 1) / 2;
    ctx.fillStyle = `rgba(239, 68, 68, ${0.2 + pulse * 0.3})`;
    ctx.fillRect(x - 28, pipeY - 24, 40, groundY - pipeY + 34);

    ctx.fillStyle = '#475569';
    ctx.fillRect(x - 24, groundY - 14, 34, 14);

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - 10, groundY);
    ctx.lineTo(x - 6, groundY - 8);
    ctx.lineTo(x - 12, groundY - 14);
    ctx.stroke();

    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x - 14, pipeY - 16, 12, groundY - pipeY - 2);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FAILED ANCHOR', x - 8, groundY + 22);
  } else {
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 22, groundY - 12, 30, 12);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 22, groundY - 12, 30, 12);

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(x - 18, groundY - 12);
    ctx.lineTo(x - 6, pipeY + 12);
    ctx.lineTo(x + 4, pipeY + 12);
    ctx.lineTo(x + 8, groundY - 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.fillRect(x - 12, pipeY - 18, 14, 36);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 12, pipeY - 18, 14, 36);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RIGID ANCHOR', x - 5, groundY + 20);
  }
  ctx.restore();
}

function drawGuideSupport(
  ctx: CanvasRenderingContext2D,
  x: number,
  pipeY: number,
  groundY: number,
  isFailed: boolean,
  time: number
) {
  ctx.save();
  if (isFailed) {
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GUIDE DROPPED', x, groundY + 20);

    ctx.fillStyle = '#64748b';
    ctx.save();
    ctx.translate(x + 8, groundY - 6);
    ctx.rotate(0.3);
    ctx.fillRect(-10, -6, 20, 8);
    ctx.restore();
  } else {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 10, pipeY + 14, 20, groundY - pipeY - 14);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 10, pipeY + 14, 20, groundY - pipeY - 14);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x - 14, pipeY + 10, 28, 4);

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x - 12, pipeY - 16, 4, 26);
    ctx.fillRect(x + 8, pipeY - 16, 4, 26);

    ctx.fillStyle = '#64748b';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AXIAL GUIDE', x, groundY + 20);
  }
  ctx.restore();
}

function drawRightTerminal(
  ctx: CanvasRenderingContext2D,
  x: number,
  pipeY: number,
  groundY: number,
  condition: string,
  isOverloaded: boolean,
  isFree: boolean,
  isFailed: boolean,
  time: number,
  nozzleLoadKN: number,
  nozzleLimitKN: number
) {
  ctx.save();
  if (condition === 'one_end_fixed_one_end_free' || isFree) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 12, groundY - 16, 24, 16);
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(x - 12, groundY - 16, 24, 16);

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(x - 6, groundY - 18, 4, 0, Math.PI * 2);
    ctx.arc(x + 6, groundY - 18, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FREE EXPANSION (SLIDER)', x, groundY + 20);
  } else {
    const pumpX = x + 16;
    const pulse = isOverloaded ? (Math.sin(time * 8) + 1) / 2 : 0;

    // Pump Pedestal
    ctx.fillStyle = isOverloaded ? `rgba(239, 68, 68, ${0.15 + pulse * 0.25})` : '#161b22';
    ctx.fillRect(pumpX - 10, groundY - 26, 68, 26);
    ctx.strokeStyle = isOverloaded ? '#ef4444' : '#30363d';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pumpX - 10, groundY - 26, 68, 26);

    // Pump Volute
    ctx.fillStyle = isOverloaded ? '#7f1d1d' : '#1e293b';
    ctx.beginPath();
    ctx.arc(pumpX + 26, pipeY, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isOverloaded ? '#ef4444' : '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Impeller hub
    ctx.fillStyle = isOverloaded ? '#f87171' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(pumpX + 26, pipeY, 7, 0, Math.PI * 2);
    ctx.fill();

    // Suction nozzle neck
    ctx.fillStyle = isOverloaded ? '#b91c1c' : '#334155';
    ctx.fillRect(x + 2, pipeY - 11, pumpX + 6 - x, 22);

    // Flange pair
    ctx.fillStyle = isOverloaded ? '#ef4444' : '#64748b';
    ctx.fillRect(x - 4, pipeY - 16, 5, 32);
    ctx.fillRect(x + 3, pipeY - 16, 5, 32);

    // Label
    ctx.fillStyle = isOverloaded ? '#ef4444' : '#58a6ff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PUMP NOZZLE (API 610)', pumpX + 26, groundY + 18);
  }
  ctx.restore();
}

function drawVectorOverlays(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  y: number,
  inputs: PipeInputs,
  outputs: PipeOutputs,
  deltaLMm: number,
  isAnchorFailed: boolean,
  isNozzleOverloaded: boolean
) {
  ctx.save();
  const arrowY = y - 36;
  ctx.strokeStyle = '#38bdf8';
  ctx.fillStyle = '#38bdf8';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(x1, arrowY);
  ctx.lineTo(x2, arrowY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x1, arrowY - 5);
  ctx.lineTo(x1, arrowY + 5);
  ctx.moveTo(x2, arrowY - 5);
  ctx.lineTo(x2, arrowY + 5);
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 9.5px IBM Plex Mono, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(
    `THERMAL GROWTH ΔL = ${deltaLMm.toFixed(2)} mm (L = ${inputs.pipeLengthM} m, ΔT = ${outputs.deltaTempC}°C)`,
    (x1 + x2) / 2,
    arrowY - 6
  );
  ctx.restore();
}

function drawEngineeringHUD(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  x1: number,
  x2: number,
  y: number,
  inputs: PipeInputs,
  outputs: PipeOutputs,
  feaResult: PipeFeaAnalysisResult
) {
  ctx.save();
  const cardW = 265;
  const cardH = 76;
  const cardX = 14;
  const cardY = h - cardH - 12;

  ctx.fillStyle = 'rgba(13, 17, 23, 0.92)';
  ctx.fillRect(cardX, cardY, cardW, cardH);
  ctx.strokeStyle = '#30363d';
  ctx.lineWidth = 1;
  ctx.strokeRect(cardX, cardY, cardW, cardH);

  ctx.fillStyle = '#8b949e';
  ctx.font = '9px IBM Plex Mono, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('FEA & ASME B31.3 KINEMATICS HUD', cardX + 8, cardY + 14);

  // Column 1
  ctx.fillStyle = '#58a6ff';
  ctx.font = 'bold 10px IBM Plex Mono, monospace';
  ctx.fillText(`ΔT: ${outputs.deltaTempC}°C`, cardX + 8, cardY + 31);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`ΔL: ${outputs.thermalExpansionMm.toFixed(2)} mm`, cardX + 8, cardY + 47);
  ctx.fillStyle = '#8b949e';
  ctx.fillText(`Restraint: ${inputs.restraintPercent}%`, cardX + 8, cardY + 63);

  // Column 2
  ctx.fillStyle = outputs.stressState === 'critical' ? '#ef4444' : outputs.stressState === 'warning' ? '#fbbf24' : '#34d399';
  ctx.font = 'bold 10px IBM Plex Mono, monospace';
  ctx.fillText(`Peak σ_vM: ${feaResult.maxVonMisesMPa.toFixed(1)} MPa`, cardX + 115, cardY + 31);
  ctx.fillStyle = '#f59e0b';
  ctx.fillText(`F_axial: ${outputs.axialForceKN.toFixed(1)} kN`, cardX + 115, cardY + 47);
  ctx.fillStyle = '#8b949e';
  ctx.fillText(`S_A Limit: ${feaResult.asmeAllowableRangeSaMPa.toFixed(0)} MPa`, cardX + 115, cardY + 63);

  ctx.restore();
}
