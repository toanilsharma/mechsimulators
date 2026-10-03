import React, { useState } from 'react';
import { BearingFaultInputs, BearingFaultOutputs } from '../../types/bearing';
import { UnitSystem } from '../../types/common';
import { Activity, BarChart2, Radio, Layers } from 'lucide-react';

interface BearingChartsProps {
  inputs: BearingFaultInputs;
  outputs: BearingFaultOutputs;
  unitSystem?: UnitSystem;
}

export const BearingCharts: React.FC<BearingChartsProps> = ({
  inputs,
  outputs,
}) => {
  const [activeTab, setActiveTab] = useState<'spectrum' | 'time_waveform' | 'envelope'>('spectrum');

  const svgW = 620;
  const svgH = 260;
  const pad = { top: 30, right: 35, bottom: 40, left: 55 };
  const plotW = svgW - pad.left - pad.right;
  const plotH = svgH - pad.top - pad.bottom;

  // Spectrum parameters (0 to 1000 Hz)
  const maxFreq = Math.max(800, outputs.frequencies.runningSpeedHz * 15);
  const maxAmpG = Math.max(2.0, ...outputs.spectralPeaks.map((p) => p.amplitudeG * 1.3));

  const toX = (f: number) => pad.left + (f / maxFreq) * plotW;
  const toY = (a: number) => pad.top + (1 - a / maxAmpG) * plotH;

  // Synthesize spectrum noise floor + discrete peaks
  const synthSpectrumPath = () => {
    let d = `M ${pad.left} ${pad.top + plotH}`;
    const steps = 150;
    for (let i = 0; i <= steps; i++) {
      const f = (i / steps) * maxFreq;
      // Background noise floor
      const baseNoise = 0.05 + (outputs.stage === 'stage4_catastrophic' ? 0.45 : 0.08) * Math.sin(f * 0.05);
      // Check if near any peak
      let amp = baseNoise;
      outputs.spectralPeaks.forEach((p) => {
        const delta = Math.abs(f - p.freqHz);
        if (delta < 12) {
          const peakVal = p.amplitudeG * Math.exp(-Math.pow(delta / 4, 2));
          if (peakVal > amp) amp = peakVal;
        }
      });
      const x = toX(f);
      const y = toY(Math.min(maxAmpG, amp));
      d += ` L ${x} ${y}`;
    }
    return d;
  };

  // Synthesize raw time waveform (acceleration shocks)
  const synthTimeWaveformPath = () => {
    let d = `M ${pad.left} ${pad.top + plotH / 2}`;
    const steps = 200;
    const impactPeriodSec = outputs.peakDefectFreqHz > 0 ? 1 / outputs.peakDefectFreqHz : 0.02;
    const totalTimeSec = 0.08; // 80 ms window

    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * totalTimeSec;
      // High frequency ringdown from impacts
      const phaseInCycle = (t % impactPeriodSec) / impactPeriodSec;
      const decay = Math.exp(-phaseInCycle * 8);
      const ringing = Math.sin(phaseInCycle * Math.PI * 2 * 12);
      const shockAmp = (outputs.crestFactor / 3.0) * decay * ringing * 0.8;
      const noise = (Math.random() - 0.5) * 0.15;
      const yVal = shockAmp + noise;

      const x = pad.left + (i / steps) * plotW;
      const y = pad.top + plotH / 2 - (yVal / 2.0) * (plotH / 2);
      d += ` L ${x} ${Math.max(pad.top, Math.min(pad.top + plotH, y))}`;
    }
    return d;
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#c9d1d9] font-mono text-xs select-none">
      {/* 1. Header Tabs */}
      <div className="h-9 border-b border-[#30363d] px-3 flex items-center justify-between bg-[#161b22] shrink-0">
        <div className="flex items-center gap-1.5 text-[11px]">
          <button
            onClick={() => setActiveTab('spectrum')}
            className={`px-2.5 py-1 rounded-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'spectrum'
                ? 'bg-[#f27d26] text-black font-bold'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            FFT Velocity / Acceleration Spectrum
          </button>
          <button
            onClick={() => setActiveTab('time_waveform')}
            className={`px-2.5 py-1 rounded-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'time_waveform'
                ? 'bg-[#f27d26] text-black font-bold'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Time Waveform (TWF) Impact Shocks
          </button>
          <button
            onClick={() => setActiveTab('envelope')}
            className={`px-2.5 py-1 rounded-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'envelope'
                ? 'bg-[#f27d26] text-black font-bold'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Demodulated Envelope (gE)
          </button>
        </div>

        <span className="text-[10px] text-[#8b949e] border border-[#30363d] px-1.5 py-0.5 rounded bg-[#0d1117]">
          Peak Defect: {outputs.dominantHarmonicLabel}
        </span>
      </div>

      {/* 2. Main Plot Area */}
      <div className="flex-1 p-2 flex flex-col items-center justify-center relative overflow-hidden">
        {activeTab === 'spectrum' ? (
          <div className="w-full h-full max-h-[300px] flex items-center justify-center">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full max-w-full">
              {/* Background */}
              <rect x={pad.left} y={pad.top} width={plotW} height={plotH} fill="#161b22" stroke="#30363d" strokeWidth={1} />

              {/* Grid Lines */}
              {[0, 0.5, 1.0, 1.5, 2.0].map((amp) => {
                if (amp > maxAmpG) return null;
                const y = toY(amp);
                return (
                  <g key={`y-${amp}`}>
                    <line x1={pad.left} y1={y} x2={pad.left + plotW} y2={y} stroke="#21262d" strokeDasharray="3 3" />
                    <text x={pad.left - 8} y={y + 3.5} textAnchor="end" fill="#8b949e" fontSize="9">
                      {amp.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {[0, 200, 400, 600, 800].map((fVal) => {
                if (fVal > maxFreq) return null;
                const x = toX(fVal);
                return (
                  <g key={`x-${fVal}`}>
                    <line x1={x} y1={pad.top} x2={x} y2={pad.top + plotH} stroke="#21262d" strokeDasharray="3 3" />
                    <text x={x} y={pad.top + plotH + 15} textAnchor="middle" fill="#8b949e" fontSize="9">
                      {fVal}
                    </text>
                  </g>
                );
              })}

              {/* Axis Titles */}
              <text x={pad.left + plotW / 2} y={svgH - 6} textAnchor="middle" fill="#8b949e" fontSize="10">
                Frequency (Hz)
              </text>
              <text x={14} y={pad.top + plotH / 2} textAnchor="middle" fill="#8b949e" fontSize="10" transform={`rotate(-90, 14, ${pad.top + plotH / 2})`}>
                Amplitude (g pk)
              </text>

              {/* Spectrum Trace */}
              <path d={synthSpectrumPath()} fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" strokeWidth={1.5} />

              {/* Labeled Fault Peaks */}
              {outputs.spectralPeaks.map((p, idx) => {
                const px = toX(p.freqHz);
                const py = toY(p.amplitudeG);
                if (p.amplitudeG < 0.2) return null;
                return (
                  <g key={`peak-${idx}`}>
                    <line x1={px} y1={py} x2={px} y2={pad.top + plotH} stroke={p.type === 'bpfo' ? '#ef4444' : p.type === 'bpfi' ? '#f59e0b' : '#38bdf8'} strokeWidth={1.2} />
                    <circle cx={px} cy={py} r={3} fill={p.type === 'bpfo' ? '#ef4444' : p.type === 'bpfi' ? '#f59e0b' : '#38bdf8'} />
                    <text x={px} y={py - 6} textAnchor="middle" fill="#f27d26" fontSize="8" fontWeight="bold">
                      {p.label}
                    </text>
                  </g>
                );
              })}

              {/* Legend Box */}
              <g transform={`translate(${pad.left + plotW - 130}, ${pad.top + 8})`}>
                <rect width={120} height={50} fill="#0d1117" stroke="#30363d" rx={3} opacity={0.9} />
                <circle cx={10} cy={14} r={3} fill="#ef4444" />
                <text x={22} y={17} fill="#ef4444" fontSize="8">BPFO Fault</text>

                <circle cx={10} cy={28} r={3} fill="#f59e0b" />
                <text x={22} y={31} fill="#f59e0b" fontSize="8">BPFI Fault</text>

                <circle cx={10} cy={42} r={3} fill="#38bdf8" />
                <text x={22} y={45} fill="#38bdf8" fontSize="8">1X / 2X Running</text>
              </g>
            </svg>
          </div>
        ) : activeTab === 'time_waveform' ? (
          <div className="w-full h-full max-h-[300px] flex items-center justify-center">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full max-w-full">
              <rect x={pad.left} y={pad.top} width={plotW} height={plotH} fill="#161b22" stroke="#30363d" strokeWidth={1} />
              <line x1={pad.left} y1={pad.top + plotH / 2} x2={pad.left + plotW} y2={pad.top + plotH / 2} stroke="#30363d" strokeDasharray="3 3" />

              <text x={pad.left + plotW / 2} y={svgH - 6} textAnchor="middle" fill="#8b949e" fontSize="10">
                Time (0 to 80 milliseconds)
              </text>
              <text x={14} y={pad.top + plotH / 2} textAnchor="middle" fill="#8b949e" fontSize="10" transform={`rotate(-90, 14, ${pad.top + plotH / 2})`}>
                Shock Acceleration (g)
              </text>

              <path d={synthTimeWaveformPath()} fill="none" stroke="#f59e0b" strokeWidth={1.5} />
            </svg>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col justify-center p-4 max-w-lg mx-auto gap-3">
            <div className="bg-[#161b22] border border-[#30363d] p-3 rounded flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Demodulated High Frequency Energy (gE)</span>
                <span className={`font-bold ${outputs.highFreqEnvelopeG > 10 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {outputs.highFreqEnvelopeG.toFixed(1)} gE
                </span>
              </div>
              <div className="w-full bg-[#0d1117] h-3 rounded overflow-hidden border border-[#30363d]">
                <div
                  className={`h-full transition-all duration-300 ${outputs.highFreqEnvelopeG > 10 ? 'bg-red-500' : outputs.highFreqEnvelopeG > 5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, (outputs.highFreqEnvelopeG / 20) * 100)}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-400">
                {outputs.highFreqEnvelopeG > 10
                  ? 'High frequency stress waves confirm active micro-spalling metal loss.'
                  : 'Low stress wave activity indicates intact raceways and stable hydrodynamic film.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#161b22] border border-[#30363d] p-2.5 rounded">
                <div className="text-[10px] text-slate-400">SHOCK PULSE METHOD (SPM)</div>
                <div className="text-base font-bold text-sky-400">{outputs.impactPulseDecibels} dBm</div>
                <div className="text-[9px] text-slate-500">ISO 13373 Baseline: &lt; 25 dBm</div>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] p-2.5 rounded">
                <div className="text-[10px] text-slate-400">ISO 10816 VIBRATION ZONE</div>
                <div className="text-base font-bold text-amber-400">Zone {outputs.iso10816Zone} ({outputs.overallVelocityRmsMmS} mm/s)</div>
                <div className="text-[9px] text-slate-500">Class II / III Industrial Machinery</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Engineering KPI Strip */}
      <div className="h-14 border-t border-[#30363d] px-3 grid grid-cols-4 items-center bg-[#161b22] shrink-0 text-center">
        <div>
          <div className="text-[9px] text-[#8b949e]">OVERALL VELOCITY</div>
          <div className={`text-xs font-bold ${outputs.overallVelocityRmsMmS > 7.1 ? 'text-red-400' : outputs.overallVelocityRmsMmS > 4.5 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {outputs.overallVelocityRmsMmS.toFixed(2)} mm/s RMS
          </div>
        </div>

        <div>
          <div className="text-[9px] text-[#8b949e]">CREST FACTOR</div>
          <div className="text-xs font-bold text-sky-400">{outputs.crestFactor}</div>
        </div>

        <div>
          <div className="text-[9px] text-[#8b949e]">KURTOSIS (4TH MOMENT)</div>
          <div className={`text-xs font-bold ${outputs.kurtosis > 6.0 ? 'text-red-400' : outputs.kurtosis > 4.0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {outputs.kurtosis}
          </div>
        </div>

        <div>
          <div className="text-[9px] text-[#8b949e]">REMAINING FATIGUE</div>
          <div className="text-xs font-bold text-[#f27d26]">{Math.round(outputs.l10hFatigueHoursRemaining).toLocaleString()} hrs</div>
        </div>
      </div>
    </div>
  );
};
