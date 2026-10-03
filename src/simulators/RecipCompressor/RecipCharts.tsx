import React, { useState } from 'react';
import { RecipCompressorInputs, RecipCompressorOutputs } from '../../types/recipCompressor';
import { UnitSystem } from '../../types/common';
import { Activity, BarChart2, Zap } from 'lucide-react';

interface RecipChartsProps {
  inputs: RecipCompressorInputs;
  outputs: RecipCompressorOutputs;
  unitSystem?: UnitSystem;
}

export const RecipCharts: React.FC<RecipChartsProps> = ({
  inputs,
  outputs,
}) => {
  const [activeTab, setActiveTab] = useState<'pv' | 'rodload' | 'pulsation'>('pv');

  const {
    pvCurvePoints,
    harmonics,
    rodLoadReversalDegrees,
    hasAdequateRodLoadReversal,
    effectiveVolumetricEfficiencyPercent,
    indicatedPowerKw,
    maxPulsationPercentOfLine,
    api618AllowablePulsationPercent,
    helmholtzResonanceHz,
  } = outputs;

  // Chart Dimensions
  const chartW = 740;
  const chartH = 340;
  const padL = 65;
  const padR = 30;
  const padT = 30;
  const padB = 45;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  // 1. PV Curve Scale Calculations
  const minVol = Math.min(...pvCurvePoints.map((p) => p.sweptVolumeLitersHE));
  const maxVol = Math.max(...pvCurvePoints.map((p) => p.sweptVolumeLitersHE));
  const volSpan = Math.max(0.1, maxVol - minVol);

  const minP = 0;
  const maxP = Math.max(inputs.dischargePressureBarA * 1.25, ...pvCurvePoints.map((p) => p.cylinderPressureBarAHE * 1.1));
  const pSpan = Math.max(1, maxP - minP);

  const getPvX = (vol: number) => padL + ((vol - minVol) / volSpan) * plotW;
  const getPvY = (p: number) => padT + plotH - ((p - minP) / pSpan) * plotH;

  const actualPvPath = pvCurvePoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getPvX(pt.sweptVolumeLitersHE).toFixed(1)} ${getPvY(pt.cylinderPressureBarAHE).toFixed(1)}`)
    .join(' ');

  const idealPvPath = pvCurvePoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getPvX(pt.sweptVolumeLitersHE).toFixed(1)} ${getPvY(pt.idealPressureBarAHE).toFixed(1)}`)
    .join(' ');

  // 2. Rod Load Curve Scale Calculations (0 to 360 deg)
  const maxLoad = Math.max(
    inputs.rodLoadTensionLimitKn * 1.15,
    Math.abs(inputs.rodLoadCompressionLimitKn) * 1.15,
    ...pvCurvePoints.map((p) => Math.abs(p.combinedRodLoadKn) * 1.1)
  );
  const minLoad = -maxLoad;
  const loadSpan = maxLoad - minLoad;

  const getAngleX = (deg: number) => padL + (deg / 360) * plotW;
  const getLoadY = (loadKn: number) => padT + plotH - ((loadKn - minLoad) / loadSpan) * plotH;
  const zeroLoadY = getLoadY(0);

  const combinedLoadPath = pvCurvePoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getAngleX(pt.crankAngleDeg).toFixed(1)} ${getLoadY(pt.combinedRodLoadKn).toFixed(1)}`)
    .join(' ');

  const gasLoadPath = pvCurvePoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getAngleX(pt.crankAngleDeg).toFixed(1)} ${getLoadY(pt.gasLoadKn).toFixed(1)}`)
    .join(' ');

  const inertiaLoadPath = pvCurvePoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getAngleX(pt.crankAngleDeg).toFixed(1)} ${getLoadY(pt.inertiaLoadKn).toFixed(1)}`)
    .join(' ');

  // 3. Pulsation Harmonics Scale
  const maxHarmonicVal = Math.max(10, ...harmonics.map((h) => Math.max(h.pressurePulsationPercent, h.api618AllowablePercent) * 1.25));

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0f17] rounded-lg border border-[#1e293b] overflow-hidden select-none">
      {/* Chart Nav Tabs */}
      <div className="px-3 py-2 bg-[#0f172a] border-b border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-[#1e293b] p-0.5 rounded border border-slate-700/60">
          <button
            onClick={() => setActiveTab('pv')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              activeTab === 'pv'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            PV Indicator Card (P-V)
          </button>
          <button
            onClick={() => setActiveTab('rodload')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              activeTab === 'rodload'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            API 618 Rod Load & Reversal
          </button>
          <button
            onClick={() => setActiveTab('pulsation')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              activeTab === 'pulsation'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            API 688 Acoustic Pulsation
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-slate-400">
          {activeTab === 'pv' && (
            <span>
              VE: <strong className="text-cyan-400">{effectiveVolumetricEfficiencyPercent}%</strong> | Ind: <strong className="text-amber-400">{indicatedPowerKw} kW</strong>
            </span>
          )}
          {activeTab === 'rodload' && (
            <span className={hasAdequateRodLoadReversal ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
              Reversal: {rodLoadReversalDegrees}° {hasAdequateRodLoadReversal ? '(PASS ≥15°)' : '(FAIL <15°)'}
            </span>
          )}
          {activeTab === 'pulsation' && (
            <span className={outputs.isAcousticPulsationCompliant ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
              Max Pulse: {maxPulsationPercentOfLine}% (Limit: {api618AllowablePulsationPercent}%)
            </span>
          )}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="flex-1 w-full p-2 flex items-center justify-center min-h-[340px]">
        {activeTab === 'pv' && (
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-full max-h-[460px]">
            {/* Grid & Axes */}
            <rect x={padL} y={padT} width={plotW} height={plotH} fill="#070a0f" stroke="#334155" strokeWidth="1" />

            {/* Pressure Reference Lines */}
            {/* Suction Pressure Line */}
            <line
              x1={padL}
              y1={getPvY(inputs.suctionPressureBarA)}
              x2={padL + plotW}
              y2={getPvY(inputs.suctionPressureBarA)}
              stroke="#0284c7"
              strokeDasharray="4 3"
              strokeWidth="1.5"
            />
            <text x={padL + plotW - 6} y={getPvY(inputs.suctionPressureBarA) - 4} fill="#38bdf8" fontSize="10" fontFamily="monospace" textAnchor="end">
              P_suct ({inputs.suctionPressureBarA} bar)
            </text>

            {/* Discharge Pressure Line */}
            <line
              x1={padL}
              y1={getPvY(inputs.dischargePressureBarA)}
              x2={padL + plotW}
              y2={getPvY(inputs.dischargePressureBarA)}
              stroke="#f97316"
              strokeDasharray="4 3"
              strokeWidth="1.5"
            />
            <text x={padL + plotW - 6} y={getPvY(inputs.dischargePressureBarA) - 4} fill="#fb923c" fontSize="10" fontFamily="monospace" textAnchor="end">
              P_disch ({inputs.dischargePressureBarA} bar)
            </text>

            {/* Ideal Loop */}
            <path d={idealPvPath} fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 2" />

            {/* Actual PV Curve */}
            <path d={actualPvPath} fill="rgba(6, 182, 212, 0.08)" stroke="#06b6d4" strokeWidth="2.5" />

            {/* Axis Ticks & Labels */}
            {/* Y Axis Labels (Pressure) */}
            {[0, maxP * 0.25, maxP * 0.5, maxP * 0.75, maxP].map((val, idx) => {
              const y = getPvY(val);
              return (
                <g key={`y-${idx}`}>
                  <line x1={padL - 4} y1={y} x2={padL} y2={y} stroke="#64748b" />
                  <text x={padL - 8} y={y + 3} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="end">
                    {val.toFixed(1)}
                  </text>
                </g>
              );
            })}
            <text x={18} y={padT + plotH / 2} fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="middle" transform={`rotate(-90 18 ${padT + plotH / 2})`}>
              Cylinder Pressure bar(a)
            </text>

            {/* X Axis Labels (Volume) */}
            {[minVol, minVol + volSpan * 0.25, minVol + volSpan * 0.5, minVol + volSpan * 0.75, maxVol].map((val, idx) => {
              const x = getPvX(val);
              return (
                <g key={`x-${idx}`}>
                  <line x1={x} y1={padT + plotH} x2={x} y2={padT + plotH + 4} stroke="#64748b" />
                  <text x={x} y={padT + plotH + 16} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                    {val.toFixed(2)}
                  </text>
                </g>
              );
            })}
            <text x={padL + plotW / 2} y={chartH - 8} fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="middle">
              Cylinder Volume (Liters)
            </text>

            {/* Legend */}
            <g transform={`translate(${padL + 12}, ${padT + 16})`}>
              <line x1="0" y1="0" x2="20" y2="0" stroke="#06b6d4" strokeWidth="2.5" />
              <text x="26" y="3" fill="#e2e8f0" fontSize="10" fontFamily="monospace">Actual Indicator Card</text>
              <line x1="160" y1="0" x2="180" y2="0" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x="186" y="3" fill="#94a3b8" fontSize="10" fontFamily="monospace">Ideal Isentropic Cycle</text>
            </g>
          </svg>
        )}

        {activeTab === 'rodload' && (
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-full max-h-[460px]">
            <rect x={padL} y={padT} width={plotW} height={plotH} fill="#070a0f" stroke="#334155" strokeWidth="1" />

            {/* Neutral Zero Load Axis (Reversal Line) */}
            <line x1={padL} y1={zeroLoadY} x2={padL + plotW} y2={zeroLoadY} stroke="#e2e8f0" strokeWidth="1.5" />
            <text x={padL + plotW - 6} y={zeroLoadY - 4} fill="#e2e8f0" fontSize="10" fontFamily="monospace" textAnchor="end">
              0 kN (Neutral Axis / Reversal Zero)
            </text>

            {/* Tension Limit */}
            <line
              x1={padL}
              y1={getLoadY(inputs.rodLoadTensionLimitKn)}
              x2={padL + plotW}
              y2={getLoadY(inputs.rodLoadTensionLimitKn)}
              stroke="#ef4444"
              strokeDasharray="4 3"
              strokeWidth="1.5"
            />
            <text x={padL + 8} y={getLoadY(inputs.rodLoadTensionLimitKn) - 4} fill="#ef4444" fontSize="10" fontFamily="monospace">
              Tension Limit (+{inputs.rodLoadTensionLimitKn} kN)
            </text>

            {/* Compression Limit */}
            <line
              x1={padL}
              y1={getLoadY(-inputs.rodLoadCompressionLimitKn)}
              x2={padL + plotW}
              y2={getLoadY(-inputs.rodLoadCompressionLimitKn)}
              stroke="#ef4444"
              strokeDasharray="4 3"
              strokeWidth="1.5"
            />
            <text x={padL + 8} y={getLoadY(-inputs.rodLoadCompressionLimitKn) + 12} fill="#ef4444" fontSize="10" fontFamily="monospace">
              Compression Limit (-{inputs.rodLoadCompressionLimitKn} kN)
            </text>

            {/* Curves */}
            <path d={gasLoadPath} fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 2" />
            <path d={inertiaLoadPath} fill="none" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="3 2" />
            <path d={combinedLoadPath} fill="none" stroke="#f59e0b" strokeWidth="2.5" />

            {/* Y Axis Labels (Force kN) */}
            {[minLoad, minLoad * 0.5, 0, maxLoad * 0.5, maxLoad].map((val, idx) => {
              const y = getLoadY(val);
              return (
                <g key={`y-${idx}`}>
                  <line x1={padL - 4} y1={y} x2={padL} y2={y} stroke="#64748b" />
                  <text x={padL - 8} y={y + 3} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="end">
                    {val.toFixed(0)}
                  </text>
                </g>
              );
            })}
            <text x={18} y={padT + plotH / 2} fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="middle" transform={`rotate(-90 18 ${padT + plotH / 2})`}>
              Rod Force (kN)
            </text>

            {/* X Axis Labels (Angle 0 to 360) */}
            {[0, 90, 180, 270, 360].map((deg) => {
              const x = getAngleX(deg);
              return (
                <g key={`x-${deg}`}>
                  <line x1={x} y1={padT + plotH} x2={x} y2={padT + plotH + 4} stroke="#64748b" />
                  <text x={x} y={padT + plotH + 16} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                    {deg}°
                  </text>
                </g>
              );
            })}
            <text x={padL + plotW / 2} y={chartH - 8} fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="middle">
              Crank Angle θ (Degrees)
            </text>

            {/* Legend */}
            <g transform={`translate(${padL + 12}, ${padT + 14})`}>
              <line x1="0" y1="0" x2="20" y2="0" stroke="#f59e0b" strokeWidth="2.5" />
              <text x="26" y="3" fill="#fbbf24" fontSize="10" fontFamily="monospace">Combined Rod Load</text>

              <line x1="160" y1="0" x2="180" y2="0" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 2" />
              <text x="186" y="3" fill="#38bdf8" fontSize="10" fontFamily="monospace">Gas Load (F_gas)</text>

              <line x1="310" y1="0" x2="330" y2="0" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="3 2" />
              <text x="336" y="3" fill="#c084fc" fontSize="10" fontFamily="monospace">Inertia Load (F_inertia)</text>
            </g>
          </svg>
        )}

        {activeTab === 'pulsation' && (
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-full max-h-[460px]">
            <rect x={padL} y={padT} width={plotW} height={plotH} fill="#070a0f" stroke="#334155" strokeWidth="1" />

            {/* Harmonic Bars */}
            {harmonics.map((h, idx) => {
              const barWidth = 45;
              const xCenter = padL + ((idx + 0.5) / harmonics.length) * plotW;
              const barH = (h.pressurePulsationPercent / maxHarmonicVal) * plotH;
              const barY = padT + plotH - barH;
              const limitY = padT + plotH - (h.api618AllowablePercent / maxHarmonicVal) * plotH;

              return (
                <g key={`harm-${h.order}`}>
                  {/* Bar */}
                  <rect
                    x={xCenter - barWidth / 2}
                    y={barY}
                    width={barWidth}
                    height={Math.max(2, barH)}
                    fill={h.isExceeded ? '#ef4444' : '#a855f7'}
                    rx="3"
                    opacity={0.85}
                  />

                  {/* Value on top of bar */}
                  <text
                    x={xCenter}
                    y={barY - 5}
                    fill={h.isExceeded ? '#fca5a5' : '#e9d5ff'}
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {h.pressurePulsationPercent}%
                  </text>

                  {/* API 618 Allowable Limit Notch */}
                  <line
                    x1={xCenter - barWidth / 2 - 8}
                    y1={limitY}
                    x2={xCenter + barWidth / 2 + 8}
                    y2={limitY}
                    stroke="#ef4444"
                    strokeWidth="2.5"
                  />
                  <circle cx={xCenter} cy={limitY} r="3" fill="#ef4444" />

                  {/* X Axis label */}
                  <text
                    x={xCenter}
                    y={padT + plotH + 16}
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {h.order}X ({h.frequencyHz}Hz)
                  </text>
                </g>
              );
            })}

            {/* Y Axis (Pulsation % of Line P) */}
            {[0, maxHarmonicVal * 0.25, maxHarmonicVal * 0.5, maxHarmonicVal * 0.75, maxHarmonicVal].map((val, idx) => {
              const y = padT + plotH - (val / maxHarmonicVal) * plotH;
              return (
                <g key={`y-${idx}`}>
                  <line x1={padL - 4} y1={y} x2={padL} y2={y} stroke="#64748b" />
                  <text x={padL - 8} y={y + 3} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="end">
                    {val.toFixed(1)}%
                  </text>
                </g>
              );
            })}
            <text x={18} y={padT + plotH / 2} fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="middle" transform={`rotate(-90 18 ${padT + plotH / 2})`}>
              Pulsation Amplitude (% Line P)
            </text>

            <text x={padL + plotW / 2} y={chartH - 8} fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="middle">
              Cylinder Excitation Harmonics (Helmholtz Bottle: {inputs.hasPulsationBottles ? `${helmholtzResonanceHz} Hz` : 'Disabled'})
            </text>

            {/* Legend */}
            <g transform={`translate(${padL + 12}, ${padT + 14})`}>
              <rect x="0" y="-8" width="14" height="10" fill="#a855f7" rx="2" />
              <text x="20" y="0" fill="#e9d5ff" fontSize="10" fontFamily="monospace">Acoustic Pulsation Amplitude (%)</text>
              <line x1="230" y1="-3" x2="250" y2="-3" stroke="#ef4444" strokeWidth="2.5" />
              <circle cx="240" cy="-3" r="3" fill="#ef4444" />
              <text x="256" y="0" fill="#fca5a5" fontSize="10" fontFamily="monospace">API 618 Allowable Limit Line</text>
            </g>
          </svg>
        )}
      </div>
    </div>
  );
};
