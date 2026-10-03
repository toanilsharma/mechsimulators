import React, { useRef, useEffect, useState } from 'react';
import { SpectralPeak, VibrationUnit, BearingFrequencies } from '../../types/spectralLab';
import { Volume2, VolumeX, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface FFTSpectrumCanvasProps {
  spectrumPoints: { order: number; freqHz: number; amp: number }[];
  discretePeaks: SpectralPeak[];
  bearingFreqs: BearingFrequencies;
  showBearingCursors: boolean;
  unit: VibrationUnit;
  shaftRpm: number;
}

export const FFTSpectrumCanvas: React.FC<FFTSpectrumCanvasProps> = ({
  spectrumPoints,
  discretePeaks,
  bearingFreqs,
  showBearingCursors,
  unit,
  shaftRpm,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscNodesRef = useRef<OscillatorNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);

  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [hoveredPeak, setHoveredPeak] = useState<SpectralPeak | null>(null);
  const [scaleMode, setScaleMode] = useState<'linear' | 'log'>('linear');
  const [maxOrderView, setMaxOrderView] = useState<number>(8.0);

  // Audio Tone Synthesizer for Physical Acoustic Feeling
  const toggleAudioSynthesis = () => {
    if (isAudioPlaying) {
      // Stop
      try {
        oscNodesRef.current.forEach((osc) => osc.stop());
        oscNodesRef.current = [];
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
          audioCtxRef.current.close();
        }
      } catch (e) {
        console.error('Audio stop error', e);
      }
      setIsAudioPlaying(false);
    } else {
      // Start Web Audio API
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.08, ctx.currentTime); // gentle volume
        masterGain.connect(ctx.destination);
        gainNodeRef.current = masterGain;

        const f1X = shaftRpm / 60;
        // Synthesize top 3 prominent peaks
        const sortedPeaks = [...discretePeaks].sort((a, b) => b.amplitude - a.amplitude).slice(0, 3);

        const newOscs: OscillatorNode[] = [];
        sortedPeaks.forEach((p) => {
          if (p.freqHz > 15 && p.freqHz < 4000) {
            const osc = ctx.createOscillator();
            const peakGain = ctx.createGain();
            const relAmp = Math.min(1.0, Math.max(0.1, p.amplitude / 5.0));
            peakGain.gain.setValueAtTime(relAmp, ctx.currentTime);

            osc.type = p.order === 1.0 ? 'sine' : p.order === 2.0 ? 'triangle' : 'sawtooth';
            osc.frequency.setValueAtTime(p.freqHz, ctx.currentTime);
            osc.connect(peakGain);
            peakGain.connect(masterGain);
            osc.start();
            newOscs.push(osc);
          }
        });

        // Add soft 1X hum if none in audible range
        if (newOscs.length === 0 && f1X > 10) {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f1X * 2, ctx.currentTime); // 2X audible octave
          osc.connect(masterGain);
          osc.start();
          newOscs.push(osc);
        }

        oscNodesRef.current = newOscs;
        setIsAudioPlaying(true);
      } catch (e) {
        console.error('Audio start error', e);
      }
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup audio on unmount
      try {
        oscNodesRef.current.forEach((osc) => osc.stop());
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
          audioCtxRef.current.close();
        }
      } catch (e) {
        // ignore
      }
    };
  }, []);

  // Draw Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    const paddingLeft = 60;
    const paddingRight = 30;
    const paddingTop = 35;
    const paddingBottom = 45;

    const plotW = width - paddingLeft - paddingRight;
    const plotH = height - paddingTop - paddingBottom;

    // Find max amplitude
    let maxAmp = 0;
    spectrumPoints.forEach((pt) => {
      if (pt.order <= maxOrderView && pt.amp > maxAmp) {
        maxAmp = pt.amp;
      }
    });
    maxAmp = Math.max(maxAmp * 1.2, 1.0);

    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;

    // Horizontal grid
    const numYDivs = 5;
    for (let i = 0; i <= numYDivs; i++) {
      const yVal = (maxAmp / numYDivs) * i;
      const yPos = paddingTop + plotH - (i / numYDivs) * plotH;

      ctx.beginPath();
      ctx.moveTo(paddingLeft, yPos);
      ctx.lineTo(paddingLeft + plotW, yPos);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(yVal.toFixed(yVal >= 10 ? 0 : 1), paddingLeft - 8, yPos + 3);
    }

    // Vertical grid (Orders 1X, 2X, 3X...)
    const maxIntOrder = Math.floor(maxOrderView);
    for (let ord = 1; ord <= maxIntOrder; ord++) {
      const xPos = paddingLeft + (ord / maxOrderView) * plotW;

      ctx.strokeStyle = ord === 1 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(56, 189, 248, 0.08)';
      ctx.beginPath();
      ctx.moveTo(xPos, paddingTop);
      ctx.lineTo(xPos, paddingTop + plotH);
      ctx.stroke();

      ctx.fillStyle = ord === 1 ? '#38bdf8' : '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${ord}X`, xPos, paddingTop + plotH + 16);

      const hz = ((ord * shaftRpm) / 60).toFixed(0);
      ctx.fillStyle = '#475569';
      ctx.fillText(`${hz}Hz`, xPos, paddingTop + plotH + 28);
    }

    // Draw Continuous Spectrum
    ctx.beginPath();
    let started = false;
    spectrumPoints.forEach((pt) => {
      if (pt.order <= maxOrderView) {
        const xPos = paddingLeft + (pt.order / maxOrderView) * plotW;
        let normAmp = pt.amp / maxAmp;
        if (scaleMode === 'log') {
          normAmp = Math.max(0, Math.log10(pt.amp + 1) / Math.log10(maxAmp + 1));
        }
        const yPos = paddingTop + plotH - normAmp * plotH;

        if (!started) {
          ctx.moveTo(xPos, yPos);
          started = true;
        } else {
          ctx.lineTo(xPos, yPos);
        }
      }
    });

    // Spectrum stroke
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Fill gradient beneath curve
    const grad = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + plotH);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0.01)');

    ctx.lineTo(paddingLeft + plotW, paddingTop + plotH);
    ctx.lineTo(paddingLeft, paddingTop + plotH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw Bearing Defect Cursors if active
    if (showBearingCursors) {
      const bearingLines = [
        { order: bearingFreqs.bpfoOrder, label: 'BPFO', color: '#f59e0b' },
        { order: bearingFreqs.bpfiOrder, label: 'BPFI', color: '#ec4899' },
        { order: bearingFreqs.bsfOrder, label: 'BSF', color: '#a855f7' },
        { order: bearingFreqs.ftfOrder, label: 'FTF', color: '#10b981' },
      ];

      bearingLines.forEach((bl) => {
        if (bl.order <= maxOrderView) {
          const xPos = paddingLeft + (bl.order / maxOrderView) * plotW;
          ctx.strokeStyle = bl.color;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 4]);

          ctx.beginPath();
          ctx.moveTo(xPos, paddingTop);
          ctx.lineTo(xPos, paddingTop + plotH);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = bl.color;
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${bl.label} (${bl.order}X)`, xPos, paddingTop - 8);
        }
      });
    }

    // Draw Discrete Peak Badges
    discretePeaks.forEach((p) => {
      if (p.order <= maxOrderView) {
        const xPos = paddingLeft + (p.order / maxOrderView) * plotW;
        let normAmp = p.amplitude / maxAmp;
        if (scaleMode === 'log') {
          normAmp = Math.max(0, Math.log10(p.amplitude + 1) / Math.log10(maxAmp + 1));
        }
        const yPos = paddingTop + plotH - normAmp * plotH;

        // Draw dot
        ctx.beginPath();
        ctx.arc(xPos, yPos, 4, 0, 2 * Math.PI);
        ctx.fillStyle = p.isBearingDefect ? '#f59e0b' : p.isSubharmonic ? '#ec4899' : '#38bdf8';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label above peak
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${p.amplitude} ${unit.split('_')[0]}`, xPos, Math.max(paddingTop + 10, yPos - 12));
      }
    });

    // Axis Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Order Tracking (Multiples of Running Speed 1X)', paddingLeft + plotW / 2, height - 10);

    ctx.save();
    ctx.translate(16, paddingTop + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`Vibration Amplitude (${unit})`, 0, 0);
    ctx.restore();

    // Title Header in Canvas
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`FFT SPECTRUM • SHAFT SPEED: ${shaftRpm} RPM (1X = ${(shaftRpm / 60).toFixed(1)} Hz)`, paddingLeft, 20);
  }, [spectrumPoints, discretePeaks, bearingFreqs, showBearingCursors, unit, shaftRpm, scaleMode, maxOrderView]);

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Canvas Top Bar Controls */}
      <div className="flex items-center justify-between bg-slate-900/80 px-3 py-1.5 rounded-t-lg border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-slate-400">Scale:</span>
          <button
            onClick={() => setScaleMode(scaleMode === 'linear' ? 'log' : 'linear')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 uppercase"
          >
            {scaleMode} Mode
          </button>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Span:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMaxOrderView(Math.max(4.0, maxOrderView - 2))}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Zoom In (Fewer Orders)"
            >
              <ZoomIn size={13} />
            </button>
            <span className="text-blue-300 font-bold px-1">{maxOrderView}X</span>
            <button
              onClick={() => setMaxOrderView(Math.min(16.0, maxOrderView + 2))}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Zoom Out (More Orders)"
            >
              <ZoomOut size={13} />
            </button>
            <button
              onClick={() => setMaxOrderView(8.0)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
              title="Reset Span"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        {/* Audio Synthesizer */}
        <button
          onClick={toggleAudioSynthesis}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
            isAudioPlaying
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
          title="Synthesize real-time acoustic tone from FFT harmonics"
        >
          {isAudioPlaying ? <Volume2 size={14} className="animate-pulse text-amber-400" /> : <VolumeX size={14} />}
          <span className="text-[11px] font-bold">{isAudioPlaying ? 'Mute Audio Tone' : 'Play Vibration Sound'}</span>
        </button>
      </div>

      {/* Canvas */}
      <div className="relative w-full rounded-b-lg overflow-hidden border border-slate-800 bg-[#0b0f19]">
        <canvas
          ref={canvasRef}
          width={820}
          height={340}
          className="w-full h-auto block"
        />
      </div>

      {/* Discrete Peaks Table */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {discretePeaks.slice(0, 4).map((p, idx) => (
          <div
            key={idx}
            className="p-2 rounded bg-slate-900/60 border border-slate-800 flex flex-col justify-between text-xs"
          >
            <span className="text-[10px] text-slate-400 truncate">{p.label}</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-mono text-sm font-bold text-blue-400">{p.order}X</span>
              <span className="font-mono text-slate-300 font-semibold">{p.amplitude} {unit.split('_')[0]}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">{p.freqHz} Hz</span>
          </div>
        ))}
      </div>
    </div>
  );
};
