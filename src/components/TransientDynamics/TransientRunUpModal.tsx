import React, { useState, useMemo } from 'react';
import {
  X,
  RotateCw,
  Activity,
  Play,
  Pause,
  RefreshCw,
  Info,
  ShieldCheck,
  Zap,
  Gauge,
} from 'lucide-react';
import {
  calculateTransientRotorDynamics,
  TransientRotorInputs,
} from '../../physics/transientRotorMath';
import { STANDARDS_SAFE_DISCLAIMER_SHORT } from '../../utils/standardsSafeHarbor';

interface TransientRunUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransientRunUpModal: React.FC<TransientRunUpModalProps> = ({ isOpen, onClose }) => {
  const [inputs, setInputs] = useState<TransientRotorInputs>({
    rotorMassKg: 120,
    shaftStiffnessN_m: 12000000,
    dampingRatio: 0.045,
    unbalanceGramMm: 450,
    slowRollRunoutUm: 4.5,
    slowRollPhaseDeg: 45,
    nominalRpm: 3600,
    maxSweepRpm: 6000,
    accelRateRpmPerSec: 60,
    thermalBowUm: 0,
    thermalBowPhaseDeg: 180,
  });

  const [activeChartTab, setActiveChartTab] = useState<'bode' | 'nyquist'>('bode');
  const [isSimulatingRunup, setIsSimulatingRunup] = useState(false);
  const [simulatedRpm, setSimulatedRpm] = useState(600);

  const outputs = useMemo(() => {
    return calculateTransientRotorDynamics(inputs);
  }, [inputs]);

  // Runup animation effect
  React.useEffect(() => {
    if (!isSimulatingRunup) return;
    const interval = setInterval(() => {
      setSimulatedRpm((prev) => {
        const next = prev + inputs.accelRateRpmPerSec * 0.2;
        if (next >= inputs.maxSweepRpm) {
          setIsSimulatingRunup(false);
          return inputs.nominalRpm;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isSimulatingRunup, inputs.accelRateRpmPerSec, inputs.maxSweepRpm, inputs.nominalRpm]);

  if (!isOpen) return null;

  const currentPoint = outputs.bodeProfile.find(
    (p) => Math.abs(p.rpm - simulatedRpm) < 30
  ) || outputs.bodeProfile[0];

  // SVG Chart Dimensions
  const chartW = 600;
  const chartH = 260;
  const padL = 50;
  const padR = 20;
  const padT = 20;
  const padB = 40;

  const maxAmp = Math.max(outputs.peakResonantAmplitudeUm * 1.15, 50);

  // Generate Bode Amplitude path
  const ampPath = outputs.bodeProfile.reduce((acc, pt, i) => {
    const x = padL + ((pt.rpm / inputs.maxSweepRpm) * (chartW - padL - padR));
    const y = chartH - padB - ((pt.amplitudeUm / maxAmp) * (chartH - padT - padB));
    return `${acc} ${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }, '');

  // Generate Bode Phase path
  const phasePath = outputs.bodeProfile.reduce((acc, pt, i) => {
    const x = padL + ((pt.rpm / inputs.maxSweepRpm) * (chartW - padL - padR));
    const y = chartH - padB - ((pt.phaseDeg / 360) * (chartH - padT - padB));
    return `${acc} ${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }, '');

  // Nyquist plot polar calculations
  const nyquistScale = (chartH - 60) / (2 * (maxAmp || 1));
  const nyquistCenterX = chartW / 2;
  const nyquistCenterY = chartH / 2;

  const nyquistPath = outputs.nyquistProfile.reduce((acc, pt, i) => {
    const x = nyquistCenterX + pt.real * nyquistScale;
    const y = nyquistCenterY - pt.imag * nyquistScale;
    return `${acc} ${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[94vh] rounded bg-[#161b22] border border-[#30363d] shadow-2xl flex flex-col overflow-hidden text-[#d1d5db]">
        {/* Header */}
        <div className="p-3 sm:p-4 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-purple-950 border border-purple-500/60 rounded flex items-center justify-center font-bold text-purple-400 font-mono text-xs shadow-md shrink-0">
              <RotateCw size={17} />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-purple-400">
                PILLAR 7 • ROTORDYNAMIC TRANSIENTS & BODE / NYQUIST LAB
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white font-mono flex items-center gap-2">
                Machinery Run-Up & Coastdown Dynamic Simulator
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] text-[#d1d5db] flex items-center justify-center transition-colors min-h-[40px] min-w-[40px]"
            aria-label="Close Transient Lab"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Top KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded">
              <div className="text-[10px] uppercase font-mono text-[#8b949e]">Critical Speed (1st)</div>
              <div className="text-lg sm:text-xl font-bold font-mono text-amber-400">
                {outputs.criticalSpeedRpm} <span className="text-xs text-[#8b949e]">RPM</span>
              </div>
              <div className="text-[10px] text-[#8b949e]">Freq: {outputs.criticalSpeedHz} Hz</div>
            </div>

            <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded">
              <div className="text-[10px] uppercase font-mono text-[#8b949e]">Amplification Factor Q</div>
              <div className="text-lg sm:text-xl font-bold font-mono text-purple-400">
                {outputs.amplificationFactorQ}
              </div>
              <div className="text-[10px] text-[#8b949e]">
                {outputs.amplificationFactorQ > 8
                  ? 'Sharp Resonance (High Q)'
                  : outputs.amplificationFactorQ > 3
                  ? 'Moderate Damping'
                  : 'Well-Damped (Low Q)'}
              </div>
            </div>

            <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded">
              <div className="text-[10px] uppercase font-mono text-[#8b949e]">Separation Margin</div>
              <div
                className={`text-lg sm:text-xl font-bold font-mono ${
                  outputs.isSeparationCompliant ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {outputs.separationMarginPercent}%
              </div>
              <div className="text-[10px] text-[#8b949e]">
                Ref Benchmark: {'>'}= 16% (API 684)
              </div>
            </div>

            <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded">
              <div className="text-[10px] uppercase font-mono text-[#8b949e]">Resonance Dwell Time</div>
              <div className="text-lg sm:text-xl font-bold font-mono text-cyan-400">
                {outputs.dwellTimeSeconds} <span className="text-xs text-[#8b949e]">sec</span>
              </div>
              <div className="text-[10px] text-[#8b949e]">
                Band: {outputs.resonanceBandRpm[0]}-{outputs.resonanceBandRpm[1]} RPM
              </div>
            </div>
          </div>

          {/* Interactive Run-Up Controls & Display */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left Controls Column */}
            <div className="p-4 bg-[#0d1117] border border-[#30363d] rounded space-y-4">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Rotor & Transient Controls
                </span>
                <button
                  onClick={() => setIsSimulatingRunup(!isSimulatingRunup)}
                  className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 cursor-pointer font-bold ${
                    isSimulatingRunup
                      ? 'bg-rose-900/80 text-rose-200 border border-rose-500'
                      : 'bg-purple-900/80 text-purple-200 border border-purple-500 hover:bg-purple-800'
                  }`}
                >
                  {isSimulatingRunup ? <Pause size={12} /> : <Play size={12} />}
                  <span>{isSimulatingRunup ? 'Halt Run-Up' : 'Simulate Run-Up'}</span>
                </button>
              </div>

              {/* Sliders */}
              <div className="space-y-3 text-xs font-mono">
                <div>
                  <div className="flex justify-between text-[#8b949e] mb-1">
                    <span>Shaft Stiffness (MN/m):</span>
                    <span className="text-white">{(inputs.shaftStiffnessN_m / 1e6).toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={4000000}
                    max={25000000}
                    step={500000}
                    value={inputs.shaftStiffnessN_m}
                    onChange={(e) =>
                      setInputs({ ...inputs, shaftStiffnessN_m: Number(e.target.value) })
                    }
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#8b949e] mb-1">
                    <span>Damping Ratio (zeta):</span>
                    <span className="text-white">{inputs.dampingRatio.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.01}
                    max={0.15}
                    step={0.005}
                    value={inputs.dampingRatio}
                    onChange={(e) =>
                      setInputs({ ...inputs, dampingRatio: Number(e.target.value) })
                    }
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#8b949e] mb-1">
                    <span>Unbalance (g·mm):</span>
                    <span className="text-white">{inputs.unbalanceGramMm}</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={1500}
                    step={50}
                    value={inputs.unbalanceGramMm}
                    onChange={(e) =>
                      setInputs({ ...inputs, unbalanceGramMm: Number(e.target.value) })
                    }
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#8b949e] mb-1">
                    <span>Accel / Decel Rate (RPM/s):</span>
                    <span className="text-white">{inputs.accelRateRpmPerSec}</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={200}
                    step={5}
                    value={inputs.accelRateRpmPerSec}
                    onChange={(e) =>
                      setInputs({ ...inputs, accelRateRpmPerSec: Number(e.target.value) })
                    }
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#8b949e] mb-1">
                    <span>Slow-Roll Runout (µm):</span>
                    <span className="text-white">{inputs.slowRollRunoutUm} µm</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    step={0.5}
                    value={inputs.slowRollRunoutUm}
                    onChange={(e) =>
                      setInputs({ ...inputs, slowRollRunoutUm: Number(e.target.value) })
                    }
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#8b949e] mb-1">
                    <span>Thermal Bow Sag (µm):</span>
                    <span className="text-white">{inputs.thermalBowUm || 0} µm</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    step={1}
                    value={inputs.thermalBowUm || 0}
                    onChange={(e) =>
                      setInputs({ ...inputs, thermalBowUm: Number(e.target.value) })
                    }
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Instantaneous Tracking readout */}
              <div className="p-2.5 bg-[#161b22] border border-[#30363d] rounded text-[11px] font-mono space-y-1">
                <div className="text-[#8b949e] uppercase text-[10px]">Instantaneous Telemetry</div>
                <div className="flex justify-between">
                  <span>Speed:</span>
                  <span className="text-cyan-400 font-bold">{Math.round(simulatedRpm)} RPM</span>
                </div>
                <div className="flex justify-between">
                  <span>Vibration:</span>
                  <span className="text-amber-400 font-bold">{currentPoint?.amplitudeUm || 0} µm pk-pk</span>
                </div>
                <div className="flex justify-between">
                  <span>Phase Lag:</span>
                  <span className="text-purple-300 font-bold">{currentPoint?.phaseDeg || 0}°</span>
                </div>
              </div>
            </div>

            {/* Right Chart Visualization Area */}
            <div className="lg:col-span-2 p-4 bg-[#0d1117] border border-[#30363d] rounded flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    {activeChartTab === 'bode' ? 'Bode Amplitude & Phase Profile' : 'Nyquist Polar Vector Locus'}
                  </span>
                </div>

                <div className="flex items-center bg-[#161b22] p-0.5 rounded border border-[#30363d]">
                  <button
                    onClick={() => setActiveChartTab('bode')}
                    className={`px-2 py-0.5 text-xs font-mono rounded cursor-pointer ${
                      activeChartTab === 'bode'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'text-[#8b949e] hover:text-white'
                    }`}
                  >
                    Bode Plot
                  </button>
                  <button
                    onClick={() => setActiveChartTab('nyquist')}
                    className={`px-2 py-0.5 text-xs font-mono rounded cursor-pointer ${
                      activeChartTab === 'nyquist'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'text-[#8b949e] hover:text-white'
                    }`}
                  >
                    Nyquist Polar
                  </button>
                </div>
              </div>

              {/* Chart SVG */}
              <div className="w-full flex items-center justify-center overflow-hidden py-1">
                {activeChartTab === 'bode' ? (
                  <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto max-h-[300px]">
                    {/* Background Grid Lines */}
                    {[0.25, 0.5, 0.75, 1.0].map((ratio, i) => (
                      <g key={i}>
                        <line
                          x1={padL}
                          y1={chartH - padB - ratio * (chartH - padT - padB)}
                          x2={chartW - padR}
                          y2={chartH - padB - ratio * (chartH - padT - padB)}
                          stroke="#21262d"
                          strokeDasharray="3 3"
                        />
                        <text
                          x={padL - 6}
                          y={chartH - padB - ratio * (chartH - padT - padB) + 3}
                          fill="#6e7681"
                          fontSize="9"
                          textAnchor="end"
                          fontFamily="monospace"
                        >
                          {(ratio * maxAmp).toFixed(0)}
                        </text>
                      </g>
                    ))}

                    {/* Critical Speed Zone Highlight */}
                    {(() => {
                      const x1 = padL + (outputs.resonanceBandRpm[0] / inputs.maxSweepRpm) * (chartW - padL - padR);
                      const x2 = padL + (outputs.resonanceBandRpm[1] / inputs.maxSweepRpm) * (chartW - padL - padR);
                      return (
                        <rect
                          x={x1}
                          y={padT}
                          width={Math.max(2, x2 - x1)}
                          height={chartH - padT - padB}
                          fill="#f27d2615"
                          stroke="#f27d2640"
                        />
                      );
                    })()}

                    {/* Bode Amplitude Curve */}
                    <path d={ampPath} fill="none" stroke="#f27d26" strokeWidth="2.5" />

                    {/* Bode Phase Curve */}
                    <path d={phasePath} fill="none" stroke="#a371f7" strokeWidth="1.5" strokeDasharray="4 2" />

                    {/* Live Simulated RPM Cursor */}
                    {(() => {
                      const curX = padL + (simulatedRpm / inputs.maxSweepRpm) * (chartW - padL - padR);
                      return (
                        <line
                          x1={curX}
                          y1={padT}
                          x2={curX}
                          y2={chartH - padB}
                          stroke="#58a6ff"
                          strokeWidth="2"
                          strokeDasharray="2 2"
                        />
                      );
                    })()}

                    {/* X-Axis labels */}
                    {[0, 1500, 3000, 4500, 6000].map((rpmVal) => {
                      if (rpmVal > inputs.maxSweepRpm) return null;
                      const x = padL + (rpmVal / inputs.maxSweepRpm) * (chartW - padL - padR);
                      return (
                        <text
                          key={rpmVal}
                          x={x}
                          y={chartH - 12}
                          fill="#8b949e"
                          fontSize="9"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {rpmVal}
                        </text>
                      );
                    })}
                  </svg>
                ) : (
                  /* Nyquist Polar View */
                  <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto max-h-[300px]">
                    {/* Polar Crosshairs */}
                    <line x1={padL} y1={nyquistCenterY} x2={chartW - padR} y2={nyquistCenterY} stroke="#30363d" />
                    <line x1={nyquistCenterX} y1={padT} x2={nyquistCenterX} y2={chartH - padB} stroke="#30363d" />

                    {/* Concentric Circles */}
                    {[0.33, 0.66, 1.0].map((r, i) => (
                      <circle
                        key={i}
                        cx={nyquistCenterX}
                        cy={nyquistCenterY}
                        r={((chartH - 60) / 2) * r}
                        fill="none"
                        stroke="#21262d"
                        strokeDasharray="2 2"
                      />
                    ))}

                    {/* Nyquist Orbit Curve */}
                    <path d={nyquistPath} fill="none" stroke="#3fb950" strokeWidth="2" />

                    <text x={chartW - padR - 10} y={nyquistCenterY - 6} fill="#6e7681" fontSize="9" textAnchor="end" fontFamily="monospace">
                      +Real (µm)
                    </text>
                    <text x={nyquistCenterX + 6} y={padT + 12} fill="#6e7681" fontSize="9" fontFamily="monospace">
                      +Imag (µm)
                    </text>
                  </svg>
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-between text-[11px] font-mono pt-2 border-t border-[#30363d] text-[#8b949e]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-[#f27d26] inline-block rounded-full" />
                    <span>Amplitude (µm pk-pk)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-0.5 bg-[#a371f7] inline-block" />
                    <span>Phase Lag (0-360°)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-[#58a6ff] inline-block rounded-full" />
                    <span>Current RPM</span>
                  </span>
                </div>
                <span className="text-amber-400 font-semibold">Resonant Peak: {outputs.peakResonantAmplitudeUm} µm</span>
              </div>
            </div>
          </div>

          {/* Safe Harbor Legal Benchmark Notice */}
          <div className="p-3 bg-[#080b10] border border-[#30363d] rounded text-[10px] text-[#8b949e] font-mono leading-relaxed">
            <span className="text-amber-400 font-bold uppercase mr-1">Industry Reference Benchmark:</span>
            {STANDARDS_SAFE_DISCLAIMER_SHORT} Bode criteria modeled under nominative academic literature for Jeffcott unbalance response and ISO 13373 / API 684 methodology screening.
          </div>
        </div>
      </div>
    </div>
  );
};
