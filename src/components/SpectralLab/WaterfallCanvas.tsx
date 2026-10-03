import React, { useRef, useEffect } from 'react';
import { WaterfallSlice, VibrationUnit } from '../../types/spectralLab';
import { Activity, Info } from 'lucide-react';

interface WaterfallCanvasProps {
  slices: WaterfallSlice[];
  unit: VibrationUnit;
}

export const WaterfallCanvas: React.FC<WaterfallCanvasProps> = ({ slices, unit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Find max amplitude across all slices to normalize
    let maxAmp = 0;
    slices.forEach((s) => {
      s.spectrum.forEach((pt) => {
        if (pt.amp > maxAmp) maxAmp = pt.amp;
      });
    });
    maxAmp = Math.max(maxAmp * 1.15, 1.0);

    const numSlices = slices.length;
    const paddingLeft = 60;
    const paddingBottom = 40;
    const plotWidth = width - 120;
    const plotHeight = height - 80;

    // Isometric 2.5D Waterfall projection parameters
    // Each slice is shifted up and right
    const xStep = 3.5;
    const yStep = 18;

    // Draw from back (highest RPM) to front (lowest RPM) so front overlays back cleanly
    const reversedSlices = [...slices].reverse();

    reversedSlices.forEach((slice, sliceIndex) => {
      const actualIndex = numSlices - 1 - sliceIndex;
      const xOffset = paddingLeft + actualIndex * xStep;
      const yOffset = height - paddingBottom - actualIndex * yStep;

      // Draw baseline for this slice
      ctx.beginPath();
      ctx.moveTo(xOffset, yOffset);
      ctx.lineTo(xOffset + plotWidth * 0.75, yOffset);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Slice label (RPM)
      ctx.fillStyle = '#64748b';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${slice.rpm} RPM`, xOffset - 6, yOffset + 3);

      // Draw spectrum profile curve
      ctx.beginPath();
      let started = false;
      const spectrumLen = slice.spectrum.length;

      slice.spectrum.forEach((pt) => {
        const xPos = xOffset + (pt.order / 6.0) * (plotWidth * 0.75);
        const normAmp = pt.amp / maxAmp;
        const yPos = yOffset - normAmp * 55; // vertical height of spectral peaks

        if (!started) {
          ctx.moveTo(xPos, yPos);
          started = true;
        } else {
          ctx.lineTo(xPos, yPos);
        }
      });

      // Fill beneath to occlude rear slices (opaque background fill for 3D depth)
      ctx.lineTo(xOffset + plotWidth * 0.75, yOffset);
      ctx.lineTo(xOffset, yOffset);
      ctx.closePath();

      // Critical speed slice highlighting (around 1800 RPM)
      const isCritical = Math.abs(slice.rpm - 1800) < 150;
      ctx.fillStyle = isCritical ? '#0c1a2e' : '#0a101d';
      ctx.fill();

      // Stroke curve
      ctx.strokeStyle = isCritical ? '#f59e0b' : actualIndex % 2 === 0 ? '#38bdf8' : '#60a5fa';
      ctx.lineWidth = isCritical ? 2.0 : 1.4;
      ctx.stroke();

      if (isCritical) {
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('CRITICAL SPEED (RESONANCE)', xOffset + plotWidth * 0.75 + 8, yOffset - 18);
      }
    });

    // Draw 1X Order diagonal guideline across cascade
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    slices.forEach((slice, i) => {
      const xOffset = paddingLeft + i * xStep;
      const yOffset = height - paddingBottom - i * yStep;
      const x1X = xOffset + (1.0 / 6.0) * (plotWidth * 0.75);
      if (i === 0) ctx.moveTo(x1X, yOffset);
      else ctx.lineTo(x1X, yOffset);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // 1X Guide Label
    ctx.fillStyle = '#ec4899';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('1X ORDER LINE', paddingLeft + 10, height - paddingBottom - (numSlices - 1) * yStep - 15);

    // Axis Header
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Orders (1X, 2X, 3X, 4X, 5X, 6X)', width / 2, height - 10);
  }, [slices, unit]);

  return (
    <div className="flex flex-col gap-2 w-full bg-slate-950/60 p-3 rounded-lg border border-slate-800">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-blue-400" />
          <span className="font-bold text-slate-200">
            3D WATERFALL / CASCADE SPECTRUM (SPEED RUN-UP / COAST-DOWN)
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-amber-400">
          <Info size={12} />
          <span>Notice resonance peak amplification at 1st Critical Speed (1800 RPM)</span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-lg border border-slate-800 bg-[#090d16] flex justify-center">
        <canvas
          ref={canvasRef}
          width={800}
          height={350}
          className="w-full h-auto block"
        />
      </div>
    </div>
  );
};
