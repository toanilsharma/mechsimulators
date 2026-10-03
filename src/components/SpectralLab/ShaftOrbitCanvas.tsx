import React, { useRef, useEffect, useState } from 'react';
import { OrbitPoint, OrbitDiagnostics } from '../../types/spectralLab';
import { Play, Pause, Square, RotateCcw, Compass, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ShaftOrbitCanvasProps {
  orbitPoints: OrbitPoint[];
  diagnostics: OrbitDiagnostics;
  clearanceUm: number;
  shaftRpm: number;
}

export const ShaftOrbitCanvas: React.FC<ShaftOrbitCanvasProps> = ({
  orbitPoints,
  diagnostics,
  clearanceUm,
  shaftRpm,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(true);
  const [animIndex, setAnimIndex] = useState<number>(0);
  const [filterMode, setFilterMode] = useState<'direct' | 'filtered1X'>('direct');
  const animFrameRef = useRef<number | null>(null);

  // Animation Loop
  useEffect(() => {
    if (!isAnimating || orbitPoints.length === 0) return;

    const step = () => {
      setAnimIndex((prev) => (prev + 2) % orbitPoints.length);
      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isAnimating, orbitPoints.length]);

  // Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Scale: Clearance circle fills ~75% of canvas radius
    const maxRadius = Math.min(centerX, centerY) - 25;
    const scale = maxRadius / clearanceUm;

    // Background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, width, height);

    // Coordinate Grid & Concentric Circles
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
    ctx.lineWidth = 1;

    // Axes
    ctx.beginPath();
    ctx.moveTo(centerX, 20);
    ctx.lineTo(centerX, height - 20);
    ctx.moveTo(20, centerY);
    ctx.lineTo(width - 20, centerY);
    ctx.stroke();

    // 45 deg & 135 deg API 670 Probe Axes
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(centerX - maxRadius, centerY - maxRadius);
    ctx.lineTo(centerX + maxRadius, centerY + maxRadius);
    ctx.moveTo(centerX - maxRadius, centerY + maxRadius);
    ctx.lineTo(centerX + maxRadius, centerY - maxRadius);
    ctx.stroke();
    ctx.setLineDash([]);

    // Probe Labels
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('Y-PROBE (135°)', centerX - maxRadius + 5, centerY - maxRadius + 12);
    ctx.fillText('X-PROBE (45°)', centerX + maxRadius - 80, centerY - maxRadius + 12);

    // Bearing Clearance Boundary Circle
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, clearanceUm * scale, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ef4444';
    ctx.font = '9px monospace';
    ctx.fillText(`BEARING CLEARANCE LIMIT (${clearanceUm} µm)`, centerX - 80, centerY - clearanceUm * scale - 4);

    // Safe 50% API 670 Zone
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, clearanceUm * 0.5 * scale, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw Orbit Path
    if (orbitPoints.length > 0) {
      ctx.beginPath();
      orbitPoints.forEach((pt, i) => {
        const xVal = filterMode === 'filtered1X' ? pt.xFiltered : pt.x;
        const yVal = filterMode === 'filtered1X' ? pt.yFiltered : pt.y;

        const screenX = centerX + xVal * scale;
        const screenY = centerY - yVal * scale; // Invert Y for Cartesian

        if (i === 0) ctx.moveTo(screenX, screenY);
        else ctx.lineTo(screenX, screenY);
      });
      ctx.closePath();

      // Orbit Stroke
      ctx.strokeStyle = filterMode === 'filtered1X' ? '#38bdf8' : '#22d3ee';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Orbit Fill glow
      ctx.fillStyle = filterMode === 'filtered1X' ? 'rgba(56, 189, 248, 0.08)' : 'rgba(34, 211, 238, 0.12)';
      ctx.fill();

      // Keyphasor Blanking / Phase Trigger Dot
      const kpPoint = orbitPoints.find((p) => p.keyphasor) || orbitPoints[0];
      const kpX = centerX + (filterMode === 'filtered1X' ? kpPoint.xFiltered : kpPoint.x) * scale;
      const kpY = centerY - (filterMode === 'filtered1X' ? kpPoint.yFiltered : kpPoint.y) * scale;

      // Draw Keyphasor Marker (Bright Yellow / White Dot)
      ctx.beginPath();
      ctx.arc(kpX, kpY, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('KEYPHASOR (1X)', kpX + 8, kpY - 4);

      // Rotating Current Shaft Center Position
      const currentPt = orbitPoints[animIndex % orbitPoints.length];
      const curX = centerX + (filterMode === 'filtered1X' ? currentPt.xFiltered : currentPt.x) * scale;
      const curY = centerY - (filterMode === 'filtered1X' ? currentPt.yFiltered : currentPt.y) * scale;

      ctx.beginPath();
      ctx.arc(curX, curY, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#ec4899';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [orbitPoints, diagnostics, clearanceUm, filterMode, animIndex]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full bg-slate-950/60 p-3 rounded-lg border border-slate-800">
      {/* Canvas Area */}
      <div className="flex-1 flex flex-col items-center">
        {/* Canvas Header */}
        <div className="flex items-center justify-between w-full px-2 py-1.5 bg-slate-900/90 border border-slate-800 rounded-t-lg text-xs font-mono">
          <div className="flex items-center gap-2">
            <Compass size={14} className="text-purple-400" />
            <span className="font-bold text-slate-200">X-Y PROXIMITY PROBE ORBIT (API 670)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterMode(filterMode === 'direct' ? 'filtered1X' : 'direct')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 font-bold"
            >
              {filterMode === 'direct' ? 'DIRECT (UNFILTERED)' : 'FILTERED 1X VECTOR'}
            </button>

            <button
              onClick={() => setIsAnimating(!isAnimating)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              title={isAnimating ? 'Pause Rotation' : 'Resume Rotation'}
            >
              {isAnimating ? <Pause size={13} /> : <Play size={13} />}
            </button>

            <button
              onClick={() => setIsAnimating(false)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400"
              title="Stop Rotation"
            >
              <Square size={13} />
            </button>

            <button
              onClick={() => {
                setIsAnimating(true);
                setAnimIndex(0);
              }}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-400"
              title="Reset Orbit Phase"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>

        {/* Orbit Canvas */}
        <div className="relative w-full overflow-hidden rounded-b-lg border-x border-b border-slate-800 flex justify-center bg-[#0a0e17]">
          <canvas
            ref={canvasRef}
            width={380}
            height={360}
            className="w-[380px] h-[360px] block"
          />
        </div>
      </div>

      {/* Orbit Telemetry & Forensic Diagnosis */}
      <div className="w-full lg:w-72 flex flex-col justify-between gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Lissajous Telemetry
            </span>
            <span className="text-[11px] font-mono text-blue-400 font-bold">{shaftRpm} RPM</span>
          </div>

          <div className="space-y-2.5 mt-3 text-xs font-mono">
            <div className="flex justify-between items-center p-2 rounded bg-slate-800/60 border border-slate-700/60">
              <span className="text-slate-400">Peak-to-Peak (X):</span>
              <span className="font-bold text-slate-200">{diagnostics.peakToPeakX} µm pk-pk</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded bg-slate-800/60 border border-slate-700/60">
              <span className="text-slate-400">Peak-to-Peak (Y):</span>
              <span className="font-bold text-slate-200">{diagnostics.peakToPeakY} µm pk-pk</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded bg-slate-800/60 border border-slate-700/60">
              <span className="text-slate-400">Eccentricity Ratio:</span>
              <span className={`font-bold ${diagnostics.eccentricityRatio > 0.7 ? 'text-red-400' : 'text-emerald-400'}`}>
                {diagnostics.eccentricityRatio} ε
              </span>
            </div>

            <div className="flex justify-between items-center p-2 rounded bg-slate-800/60 border border-slate-700/60">
              <span className="text-slate-400">Precession:</span>
              <span className="font-bold text-cyan-400">{diagnostics.orbitPrecession}</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded bg-slate-800/60 border border-slate-700/60">
              <span className="text-slate-400">Pattern Signature:</span>
              <span className="font-bold text-amber-400 truncate max-w-[130px]" title={diagnostics.patternShape}>
                {diagnostics.patternShape}
              </span>
            </div>
          </div>
        </div>

        {/* Forensic Pattern Diagnostic */}
        <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700 text-xs">
          <div className="flex items-center gap-1.5 mb-1.5">
            {diagnostics.eccentricityRatio > 0.7 ? (
              <AlertCircle size={14} className="text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            )}
            <span className="font-mono font-bold text-slate-200">Orbit Signature Verdict</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
            {diagnostics.summaryDescription}
          </p>
        </div>
      </div>
    </div>
  );
};
