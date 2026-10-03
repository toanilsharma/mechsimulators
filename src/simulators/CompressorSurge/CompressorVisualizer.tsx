import React, { useRef, useEffect, useState } from 'react';
import { CompressorInputs, CompressorOutputs } from '../../types/compressor';
import { UnitSystem } from '../../types/common';
import { Play, Pause, RotateCcw, Square } from 'lucide-react';

interface CompressorVisualizerProps {
  inputs: CompressorInputs;
  outputs: CompressorOutputs;
  isRunning?: boolean;
  unitSystem?: UnitSystem;
}

export const CompressorVisualizer: React.FC<CompressorVisualizerProps> = ({
  inputs,
  outputs,
  isRunning: parentIsRunning = true,
  unitSystem = 'metric',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(parentIsRunning);

  useEffect(() => {
    setIsPlaying(parentIsRunning);
  }, [parentIsRunning]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isMounted = true;

    const render = () => {
      if (!isMounted) return;
      if (isPlaying) {
        timeRef.current += 0.03;
      }
      const t = timeRef.current;

      const w = canvas.width;
      const h = canvas.height;

      // Dark industrial telemetry background
      ctx.fillStyle = '#0a0d13';
      ctx.fillRect(0, 0, w, h);

      // Draw subtle engineering grid
      ctx.strokeStyle = '#1e2638';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < w; x += 40) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y < h; y += 40) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      const state = outputs.operatingState;
      const isSurging = state === 'deep_surge' || state === 'incipient_surge';
      const isWarning = state === 'surge_warning';

      // Shake effect when in surge
      let shakeX = 0;
      let shakeY = 0;
      if (isSurging) {
        const severity = state === 'deep_surge' ? 6 : 2;
        shakeX = (Math.random() - 0.5) * severity;
        shakeY = (Math.random() - 0.5) * severity;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // Centered layout
      const cx = w * 0.45;
      const cy = h * 0.52;

      // 1. Suction Pipe (Left to Center)
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 36;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.moveTo(w * 0.08, cy);
      ctx.lineTo(cx - 70, cy);
      ctx.stroke();

      // Suction gas flow particles
      const flowDir = outputs.reverseFlowDetected ? -1 : 1;
      const flowSpeed = (outputs.massFlowTotalKgS / 20) * 4 * flowDir;
      const particleCount = 10;
      ctx.fillStyle = outputs.reverseFlowDetected ? '#ef4444' : '#38bdf8';
      for (let i = 0; i < particleCount; i++) {
        const offset = ((t * flowSpeed * 30 + i * 28) % (cx - 70 - w * 0.08) + (cx - 70 - w * 0.08)) % (cx - 70 - w * 0.08);
        const px = w * 0.08 + offset;
        ctx.beginPath();
        ctx.arc(px, cy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Anti-Surge Recycle Loop (Discharge pipe top -> ASV -> Suction pipe)
      const recycleActive = inputs.asvOpeningPercent > 0;
      ctx.strokeStyle = recycleActive ? (isSurging ? '#ef4444' : '#f59e0b') : '#1e293b';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(cx + 70, cy - 60);
      ctx.lineTo(cx + 70, cy - 140);
      ctx.lineTo(w * 0.22, cy - 140);
      ctx.lineTo(w * 0.22, cy);
      ctx.stroke();

      // ASV Valve Symbol in top recycle leg
      const valveX = (cx + 70 + w * 0.22) / 2;
      const valveY = cy - 140;
      ctx.fillStyle = inputs.asvOpeningPercent > 0 ? '#f59e0b' : '#475569';
      // Hourglass valve shape
      ctx.beginPath();
      ctx.moveTo(valveX - 16, valveY - 12);
      ctx.lineTo(valveX + 16, valveY + 12);
      ctx.lineTo(valveX + 16, valveY - 12);
      ctx.lineTo(valveX - 16, valveY + 12);
      ctx.closePath();
      ctx.fill();
      // Valve actuator bonnet
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(valveX, valveY);
      ctx.lineTo(valveX, valveY - 18);
      ctx.stroke();
      ctx.fillStyle = inputs.asvOpeningPercent > 0 ? '#10b981' : '#64748b';
      ctx.beginPath();
      ctx.arc(valveX, valveY - 22, 7, 0, Math.PI * 2);
      ctx.fill();

      // ASV Label & Opening %
      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`ASV: ${inputs.asvOpeningPercent}% [${outputs.asvRecycleMassFlowKgS.toFixed(1)} kg/s]`, valveX, valveY - 34);

      // 3. Discharge Pipe (Center to Right)
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 28;
      ctx.beginPath();
      ctx.moveTo(cx + 70, cy);
      ctx.lineTo(w * 0.88, cy);
      ctx.stroke();

      // 4. Centrifugal Compressor Casing (Volute Scroll shape)
      ctx.fillStyle = isSurging ? '#7f1d1d' : isWarning ? '#451a03' : '#1e293b';
      ctx.strokeStyle = isSurging ? '#ef4444' : isWarning ? '#f59e0b' : '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 78, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 5. Impeller Rotor & Blades (Animated spinning)
      const rotSpeed = (inputs.speedRpm / 10500) * 0.25;
      const rotAngle = t * rotSpeed * (outputs.reverseFlowDetected ? -0.5 : 1.0);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotAngle);

      // Central Hub
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Impeller Backswept Vanes (12 vanes typical for process centrifugal)
      const vaneCount = 8;
      ctx.strokeStyle = isSurging ? '#fca5a5' : '#67e8f9';
      ctx.lineWidth = 3;
      for (let i = 0; i < vaneCount; i++) {
        const a = (i * 2 * Math.PI) / vaneCount;
        ctx.beginPath();
        const r1 = 24;
        const r2 = 68;
        const x1 = Math.cos(a) * r1;
        const y1 = Math.sin(a) * r1;
        // curved backward curve
        const cpx = Math.cos(a + 0.35) * (r1 + r2) * 0.5;
        const cpy = Math.sin(a + 0.35) * (r1 + r2) * 0.5;
        const x2 = Math.cos(a + 0.2) * r2;
        const y2 = Math.sin(a + 0.2) * r2;
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cpx, cpy, x2, y2);
        ctx.stroke();
      }
      ctx.restore();

      // 6. Aerodynamic Stall & Flow Reversal Visualizer inside Casing
      if (isSurging) {
        // Red pulsating surge wave expanding outward
        const pulseR = 30 + (Math.sin(t * 8) * 0.5 + 0.5) * 45;
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.fill();

        // Flashy Warning Tag
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚠ SURGE REVERSAL', cx, cy - 90);
      } else if (isWarning) {
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ SCL MARGIN BUFFER', cx, cy - 90);
      }

      // 7. Telemetry Badges (In-Canvas HUD)
      // Suction Condition Box
      ctx.fillStyle = '#111827';
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(14, 14, 190, 75, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'left';
      ctx.fillText('SUCTION CONDITIONS (P1, T1)', 24, 30);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '11px monospace';
      ctx.fillText(`Gas: ${outputs.gasProperties.name.split(' ')[0]}`, 24, 46);
      ctx.fillText(`P1: ${inputs.suctionPressureBar.toFixed(1)} bar(a) | T1: ${inputs.suctionTempC.toFixed(0)}°C`, 24, 62);
      ctx.fillText(`Total Flow: ${outputs.massFlowTotalKgS.toFixed(1)} kg/s`, 24, 78);

      // Discharge Condition Box
      ctx.fillStyle = '#111827';
      ctx.strokeStyle = '#374151';
      ctx.beginPath();
      ctx.roundRect(w - 204, 14, 190, 75, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('DISCHARGE & SURGE MARGIN', w - 194, 30);
      ctx.fillStyle = isSurging ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
      ctx.font = '11px monospace';
      ctx.fillText(`P2: ${outputs.dischargePressureBar.toFixed(2)} bar | Rc: ${outputs.pressureRatioRc.toFixed(2)}`, w - 194, 46);
      ctx.fillText(`Surge Margin: ${outputs.currentSurgeMarginPercent.toFixed(1)}% (SLL: ${outputs.surgeLimitMassFlowKgS.toFixed(1)} kg/s)`, w - 194, 62);
      ctx.fillText(`Thrust Load: ${outputs.thrustBearingLoadPercent.toFixed(0)}% | ${outputs.operatingState.toUpperCase()}`, w - 194, 78);

      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isMounted = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [inputs, outputs, unitSystem, isPlaying]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative bg-[#0a0d13] select-none overflow-hidden">
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
          title="Stop simulation"
        >
          <Square size={10} />
        </button>

        <button
          type="button"
          onClick={() => {
            setIsPlaying(true);
            timeRef.current = 0;
          }}
          className="p-1 rounded text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
          title="Reset animation"
        >
          <RotateCcw size={10} />
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={720}
        height={420}
        className="w-full h-full max-w-full max-h-full object-contain"
      />
    </div>
  );
};
