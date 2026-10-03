import React, { useRef, useEffect, useState } from 'react';
import { BearingFaultInputs, BearingFaultOutputs } from '../../types/bearing';
import { STANDARD_BEARINGS } from '../../utils/spectralCalculations';
import { UnitSystem } from '../../types/common';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';

interface BearingVisualizerProps {
  inputs: BearingFaultInputs;
  outputs: BearingFaultOutputs;
  isRunning?: boolean;
  unitSystem?: UnitSystem;
}

export const BearingVisualizer: React.FC<BearingVisualizerProps> = ({
  inputs,
  outputs,
  isRunning: parentIsRunning = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animAngleRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(parentIsRunning);

  useEffect(() => {
    setIsPlaying(parentIsRunning);
  }, [parentIsRunning]);

  const geom = STANDARD_BEARINGS.find((b) => b.id === inputs.bearingId) || STANDARD_BEARINGS[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (isPlaying) {
        // Inner race angular speed in radians/sec
        const radPerSec = (inputs.shaftSpeedRpm * 2 * Math.PI) / 60;
        animAngleRef.current += radPerSec * dt * 0.2; // visually normalized
      }

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // 1. Dark Technical Background
      ctx.fillStyle = '#0a0d13';
      ctx.fillRect(0, 0, w, h);

      // Center & geometry dimensions
      const cx = w * 0.42;
      const cy = h * 0.5;
      const rOuterHousing = Math.min(w, h) * 0.42;
      const rOuterTrack = rOuterHousing * 0.82;
      const rInnerTrack = rOuterHousing * 0.54;
      const rShaft = rOuterHousing * 0.32;
      const rBall = (rOuterTrack - rInnerTrack) * 0.48;
      const rPitch = (rOuterTrack + rInnerTrack) / 2;

      // Outer housing ring (stationary)
      ctx.fillStyle = '#161b22';
      ctx.beginPath();
      ctx.arc(cx, cy, rOuterHousing, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#30363d';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Outer race ring
      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.arc(cx, cy, rOuterTrack, 0, Math.PI * 2);
      ctx.arc(cx, cy, rInnerTrack, 0, Math.PI * 2, true);
      ctx.fill();

      // Outer raceway groove
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, rOuterTrack, 0, Math.PI * 2);
      ctx.stroke();

      // Stationary outer race defect mark (if outer race fault)
      if (inputs.faultLocation === 'outer_race' && inputs.faultSeverityPercent > 5) {
        const defectAngle = Math.PI * 0.5; // at 6 o'clock in bottom load zone
        const defW = (inputs.faultSeverityPercent / 100) * 0.35 + 0.1;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(cx, cy, rOuterTrack - 1, defectAngle - defW / 2, defectAngle + defW / 2);
        ctx.stroke();

        // Pulsing impact beacon
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.beginPath();
        ctx.arc(cx, cy + rOuterTrack - 2, 8 + Math.sin(time * 0.01) * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Rotating Inner ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(animAngleRef.current);

      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(0, 0, rInnerTrack, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Shaft body inside inner ring
      ctx.fillStyle = '#374151';
      ctx.beginPath();
      ctx.arc(0, 0, rShaft, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Shaft keyway indicator to visualize rotation
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(-rShaft * 0.15, -rShaft * 0.95, rShaft * 0.3, rShaft * 0.3);

      // Rotating Inner race defect (if inner race fault)
      if (inputs.faultLocation === 'inner_race' && inputs.faultSeverityPercent > 5) {
        const defW = (inputs.faultSeverityPercent / 100) * 0.3 + 0.08;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, rInnerTrack + 1, -defW / 2, defW / 2);
        ctx.stroke();
      }

      ctx.restore();

      // Cage & Rolling Elements (Balls)
      // Cage rotates at FTF (approx 0.4 * shaft speed)
      const cageAngle = animAngleRef.current * (outputs.frequencies.ftfOrder || 0.4);
      const numBalls = geom.numberOfBalls;

      for (let i = 0; i < numBalls; i++) {
        const theta = cageAngle + (i * 2 * Math.PI) / numBalls;
        const bx = cx + Math.cos(theta) * rPitch;
        const by = cy + Math.sin(theta) * rPitch;

        // Ball spin around its own center at BSF
        const isDefectiveBall = inputs.faultLocation === 'ball_spin' && i === 0 && inputs.faultSeverityPercent > 5;

        // Ball body
        ctx.fillStyle = isDefectiveBall ? '#fca5a5' : '#9ca3af';
        ctx.beginPath();
        ctx.arc(bx, by, rBall, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isDefectiveBall ? '#ef4444' : '#d1d5db';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Metallic reflection highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bx - rBall * 0.3, by - rBall * 0.3, rBall * 0.28, 0, Math.PI * 2);
        ctx.fill();

        // Ball defect spot
        if (isDefectiveBall) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(bx, by, rBall * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Load Zone Vector (Downward radial load)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy + rInnerTrack);
      ctx.lineTo(cx, cy + rOuterTrack);
      ctx.stroke();
      // Arrowhead
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy + rOuterTrack - 8);
      ctx.lineTo(cx + 5, cy + rOuterTrack - 8);
      ctx.lineTo(cx, cy + rOuterTrack);
      ctx.fill();

      // 2. Right Diagnostic Telemetry Overlay
      const tx = w * 0.72;
      const ty = 25;

      ctx.fillStyle = '#161b22';
      ctx.fillRect(tx, ty, w * 0.26, h - 50);
      ctx.strokeStyle = '#30363d';
      ctx.lineWidth = 1;
      ctx.strokeRect(tx, ty, w * 0.26, h - 50);

      // Title
      ctx.fillStyle = '#f27d26';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('KINEMATIC FAULT ORDERS', tx + 12, ty + 24);

      // Frequency items
      const items = [
        { label: '1X Running', val: `${outputs.frequencies.runningSpeedHz} Hz (1.00X)`, col: '#38bdf8' },
        { label: 'BPFO (Outer)', val: `${outputs.frequencies.bpfoHz} Hz (${outputs.frequencies.bpfoOrder}X)`, col: inputs.faultLocation === 'outer_race' ? '#ef4444' : '#94a3b8' },
        { label: 'BPFI (Inner)', val: `${outputs.frequencies.bpfiHz} Hz (${outputs.frequencies.bpfiOrder}X)`, col: inputs.faultLocation === 'inner_race' ? '#f59e0b' : '#94a3b8' },
        { label: '2X BSF (Ball)', val: `${(outputs.frequencies.bsfHz * 2).toFixed(1)} Hz (${(outputs.frequencies.bsfOrder * 2).toFixed(2)}X)`, col: inputs.faultLocation === 'ball_spin' ? '#f87171' : '#94a3b8' },
        { label: 'FTF (Cage)', val: `${outputs.frequencies.ftfHz} Hz (${outputs.frequencies.ftfOrder}X)`, col: '#94a3b8' },
        { label: 'Lube Kappa (κ)', val: `${outputs.lubricationKappaRatio}x ${outputs.lubricationKappaRatio < 0.4 ? '⚠ BOUNDARY' : '✓ EHL'}`, col: outputs.lubricationKappaRatio < 0.4 ? '#ef4444' : '#10b981' },
        { label: 'Kurtosis (Spike)', val: `${outputs.kurtosis} (Norm: 3.0)`, col: outputs.kurtosis > 6.0 ? '#ef4444' : '#38bdf8' },
        { label: 'Crest Factor', val: `${outputs.crestFactor}`, col: '#cbd5e1' },
      ];

      let itemY = ty + 50;
      items.forEach((it) => {
        ctx.fillStyle = '#64748b';
        ctx.font = '9px monospace';
        ctx.fillText(it.label, tx + 12, itemY);
        ctx.fillStyle = it.col;
        ctx.font = 'bold 10px monospace';
        ctx.fillText(it.val, tx + 12, itemY + 14);
        itemY += 28;
      });

      // Stage Pill at bottom of panel
      ctx.fillStyle =
        outputs.stage === 'stage4_catastrophic'
          ? '#ef4444'
          : outputs.stage === 'stage3_defect_harmonics'
          ? '#f59e0b'
          : outputs.stage === 'stage2_resonance'
          ? '#38bdf8'
          : '#10b981';
      ctx.fillRect(tx + 12, itemY + 5, w * 0.26 - 24, 22);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(outputs.stage.replace('_', ' ').toUpperCase(), tx + (w * 0.26) / 2, itemY + 20);
      ctx.textAlign = 'left';

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [inputs, outputs, isPlaying, geom]);

  return (
    <div className="w-full h-full relative flex items-center justify-center bg-[#0a0d13] select-none">
      {/* Top Left Simulation Controls Overlay */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur px-2 py-1 rounded-md border border-slate-700/80 shadow-md">
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
            animAngleRef.current = 0;
          }}
          className="p-1 rounded text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
          title="Reset rotation"
        >
          <RotateCcw size={10} />
        </button>
      </div>

      <canvas ref={canvasRef} width={680} height={340} className="w-full h-full max-w-full max-h-full object-contain" />
    </div>
  );
};
