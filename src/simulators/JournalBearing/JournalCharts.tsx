import React, { useState } from 'react';
import { JournalBearingInputs, JournalBearingOutputs } from '../../types/journalBearing';
import { UnitSystem } from '../../types/common';
import { Activity, BarChart2, ShieldAlert, TrendingUp } from 'lucide-react';

interface JournalChartsProps {
  inputs: JournalBearingInputs;
  outputs: JournalBearingOutputs;
  unitSystem: UnitSystem;
}

export const JournalCharts: React.FC<JournalChartsProps> = ({
  inputs,
  outputs,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'spectrum' | 'pressure' | 'stability'>('spectrum');

  const {
    spectrum,
    runningFreqHz,
    whirlFreqHz,
    api670AlarmLimitUmPkPk,
    api670TripLimitUmPkPk,
    totalShaftDisplacementUmPkPk,
    pressureProfile,
    projectedPressureMpa,
    onsetSpeedOfInstabilityRpm,
    shaftSpeedRpm,
    logarithmicDecrement,
    stabilityMarginRatio,
    instabilityMode,
  } = outputs;

  // Max scale for spectrum
  const maxSpectrumAmp = Math.max(
    api670TripLimitUmPkPk * 1.2,
    ...spectrum.map((s) => s.ampUmPkPk * 1.25)
  );

  // Stability speed sweep points (from 1000 RPM to 12000 RPM)
  const speedPoints = [];
  const minRpm = 1000;
  const maxRpm = 12000;
  for (let rpm = minRpm; rpm <= maxRpm; rpm += 500) {
    let logDec: number;
    if (outputs.whirlFrequencyRatio <= 0.05) {
      logDec = 0.65; // Tilt pad stable across full speed
    } else {
      const ratio = rpm / onsetSpeedOfInstabilityRpm;
      if (ratio < 0.75) {
        logDec = 0.45 * (1 - ratio);
      } else if (ratio < 1.0) {
        logDec = 0.25 * (1 - ratio);
      } else {
        logDec = -0.15 - (ratio - 1.0) * 0.4;
      }
    }
    speedPoints.push({ rpm, logDec: Number(logDec.toFixed(2)) });
  }

  // Max pressure for profile chart
  const maxPressure = Math.max(10, ...pressureProfile.map((p) => p.pressureBar * 1.15));

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0f17] rounded-lg border border-[#1e293b] overflow-hidden select-none">
      {/* Chart Nav Tabs */}
      <div className="px-3 py-2 bg-[#0f172a] border-b border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-[#1e293b] p-0.5 rounded border border-slate-700/60">
          <button
            onClick={() => setActiveChartTab('spectrum')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              activeChartTab === 'spectrum'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            FFT Vibration Spectrum
          </button>
          <button
            onClick={() => setActiveChartTab('pressure')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              activeChartTab === 'pressure'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Hydrodynamic Pressure P(θ)
          </button>
          <button
            onClick={() => setActiveChartTab('stability')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              activeChartTab === 'stability'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            API 684 Stability Map
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Total S(p-p):</span>
          <span className={`font-bold ${totalShaftDisplacementUmPkPk > api670AlarmLimitUmPkPk ? 'text-rose-400' : 'text-emerald-400'}`}>
            {totalShaftDisplacementUmPkPk} µm
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Alarm Limit:</span>
          <span className="text-amber-400 font-bold">{api670AlarmLimitUmPkPk} µm</span>
        </div>
      </div>

      {/* Chart Canvas Body */}
      <div className="flex-1 p-4 flex flex-col justify-center items-center">
        {/* TAB 1: FFT VIBRATION SPECTRUM */}
        {activeChartTab === 'spectrum' && (
          <div className="w-full h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-300 font-semibold">
                Shaft Relative Displacement Spectrum (API 670 Orthogonal Probe Peak-to-Peak)
              </span>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1 text-cyan-400">
                  <span className="w-2.5 h-2.5 bg-cyan-400 rounded-sm"></span> 1X Synchronous
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2.5 h-2.5 bg-amber-400 rounded-sm"></span> Subsynchronous Whirl
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2.5 h-0.5 bg-rose-500"></span> API 670 Alarm
                </span>
              </div>
            </div>

            {/* Spectrum SVG Display */}
            <div className="flex-1 relative bg-[#090d14] rounded border border-slate-800 p-2 flex items-end">
              <svg viewBox="0 0 600 240" className="w-full h-full">
                {/* Horizontal Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1.0].map((frac, i) => {
                  const y = 200 - frac * 170;
                  const val = (frac * maxSpectrumAmp).toFixed(0);
                  return (
                    <g key={i}>
                      <line x1="45" y1={y} x2="585" y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                      <text x="38" y={y + 4} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">
                        {val} µm
                      </text>
                    </g>
                  );
                })}

                {/* API 670 Alarm Line */}
                <line
                  x1="45"
                  y1={200 - (api670AlarmLimitUmPkPk / maxSpectrumAmp) * 170}
                  x2="585"
                  y2={200 - (api670AlarmLimitUmPkPk / maxSpectrumAmp) * 170}
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                <text
                  x="580"
                  y={200 - (api670AlarmLimitUmPkPk / maxSpectrumAmp) * 170 - 4}
                  fill="#ef4444"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="end"
                  fontWeight="bold"
                >
                  API 670 ALARM ({api670AlarmLimitUmPkPk} µm)
                </text>

                {/* Spectrum Peak Bars */}
                {spectrum.map((peak, idx) => {
                  // Frequency mapped to X: 0 to 250 Hz
                  const maxFreq = Math.max(200, runningFreqHz * 2.4);
                  const x = 50 + (peak.freqHz / maxFreq) * 520;
                  const barH = (peak.ampUmPkPk / maxSpectrumAmp) * 170;
                  const y = 200 - barH;

                  const barColor =
                    peak.type === 'subsynchronous_whip'
                      ? '#ef4444'
                      : peak.type === 'subsynchronous_whirl'
                      ? '#f59e0b'
                      : peak.type === '1x_synchronous'
                      ? '#06b6d4'
                      : '#a855f7';

                  return (
                    <g key={idx}>
                      {/* Bar stem */}
                      <rect x={x - 4} y={y} width="8" height={barH} fill={barColor} rx="1" />
                      {/* Label badge */}
                      <text
                        x={x}
                        y={y - 6}
                        fill={barColor}
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {peak.order.toFixed(2)}X ({peak.ampUmPkPk} µm)
                      </text>
                      {/* Frequency X-axis label */}
                      <text x={x} y="215" fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="middle">
                        {peak.freqHz} Hz
                      </text>
                    </g>
                  );
                })}

                {/* X Axis base */}
                <line x1="45" y1="200" x2="585" y2="200" stroke="#475569" strokeWidth="1.5" />
                <text x="315" y="232" fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">
                  Frequency (Hz) / Multiples of Running Speed
                </text>
              </svg>
            </div>
          </div>
        )}

        {/* TAB 2: HYDRODYNAMIC PRESSURE P(θ) */}
        {activeChartTab === 'pressure' && (
          <div className="w-full h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-300 font-semibold">
                Circumferential Fluid Film Pressure Distribution P(θ) [0° to 360°]
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Peak Hydrodynamic Pressure: <span className="text-cyan-400 font-bold">{Math.max(...pressureProfile.map(p => p.pressureBar)).toFixed(1)} bar</span>
              </span>
            </div>

            <div className="flex-1 relative bg-[#090d14] rounded border border-slate-800 p-2 flex items-end">
              <svg viewBox="0 0 600 240" className="w-full h-full">
                {/* Horizontal Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1.0].map((frac, i) => {
                  const y = 200 - frac * 170;
                  const val = (frac * maxPressure).toFixed(0);
                  return (
                    <g key={i}>
                      <line x1="45" y1={y} x2="585" y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                      <text x="38" y={y + 4} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">
                        {val} bar
                      </text>
                    </g>
                  );
                })}

                {/* Pressure line path */}
                {pressureProfile.length > 0 && (
                  <path
                    d={pressureProfile
                      .map((p, idx) => {
                        const x = 50 + (p.angleDeg / 360) * 525;
                        const y = 200 - (p.pressureBar / maxPressure) * 170;
                        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2.5"
                  />
                )}

                {/* Cavitation zone annotation */}
                <rect x="320" y="30" width="220" height="24" fill="#1e293b" rx="3" className="opacity-80" />
                <text x="430" y="46" fill="#f59e0b" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  Divergent Wedge Cavitation Zone (P ≈ 0)
                </text>

                {/* X Axis */}
                <line x1="45" y1="200" x2="585" y2="200" stroke="#475569" strokeWidth="1.5" />
                {[0, 90, 180, 270, 360].map((deg) => {
                  const x = 50 + (deg / 360) * 525;
                  return (
                    <g key={deg}>
                      <line x1={x} y1="200" x2={x} y2="205" stroke="#475569" strokeWidth="1.5" />
                      <text x={x} y="218" fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="middle">
                        {deg}°
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        {/* TAB 3: API 684 STABILITY MAP */}
        {activeChartTab === 'stability' && (
          <div className="w-full h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-300 font-semibold">
                Rotor Stability Map: Logarithmic Decrement (δ) vs Shaft Speed (RPM)
              </span>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="text-emerald-400">API 684 Margin: δ ≥ +0.10</span>
                <span className="text-rose-400">Unstable: δ &lt; 0.00</span>
              </div>
            </div>

            <div className="flex-1 relative bg-[#090d14] rounded border border-slate-800 p-2 flex items-end">
              <svg viewBox="0 0 600 240" className="w-full h-full">
                {/* Zero line (Stability Threshold) */}
                <line x1="45" y1="120" x2="585" y2="120" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 2" />
                <text x="580" y="115" fill="#ef4444" fontSize="9" fontFamily="monospace" textAnchor="end" fontWeight="bold">
                  THRESHOLD OF INSTABILITY (δ = 0)
                </text>

                {/* API 684 Recommended Margin line (delta = 0.10) */}
                <line x1="45" y1="95" x2="585" y2="95" stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" />
                <text x="580" y="90" fill="#10b981" fontSize="9" fontFamily="monospace" textAnchor="end">
                  API 684 SAFE MARGIN (δ = +0.10)
                </text>

                {/* Log Dec Curve Path */}
                <path
                  d={speedPoints
                    .map((pt, idx) => {
                      const x = 50 + ((pt.rpm - minRpm) / (maxRpm - minRpm)) * 525;
                      // Mapped: delta = 0 is y = 120; delta = +0.7 is y = 30; delta = -0.7 is y = 210
                      const y = 120 - (pt.logDec / 0.7) * 90;
                      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                />

                {/* Operating Point Marker */}
                {shaftSpeedRpm >= minRpm && shaftSpeedRpm <= maxRpm && (
                  <g>
                    {(() => {
                      const opX = 50 + ((shaftSpeedRpm - minRpm) / (maxRpm - minRpm)) * 525;
                      const opY = 120 - (logarithmicDecrement / 0.7) * 90;
                      return (
                        <>
                          <circle cx={opX} cy={opY} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                          <line x1={opX} y1="30" x2={opX} y2="210" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
                          <text x={opX} y={Math.max(25, opY - 12)} fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                            OPERATING {shaftSpeedRpm} RPM (δ = {logarithmicDecrement})
                          </text>
                        </>
                      );
                    })()}
                  </g>
                )}

                {/* X Axis Speeds */}
                <line x1="45" y1="210" x2="585" y2="210" stroke="#475569" strokeWidth="1.5" />
                {[2000, 4000, 6000, 8000, 10000, 12000].map((rpm) => {
                  const x = 50 + ((rpm - minRpm) / (maxRpm - minRpm)) * 525;
                  return (
                    <g key={rpm}>
                      <line x1={x} y1="210" x2={x} y2="215" stroke="#475569" strokeWidth="1.5" />
                      <text x={x} y="228" fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="middle">
                        {rpm}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
