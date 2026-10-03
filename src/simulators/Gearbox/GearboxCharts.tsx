import React, { useState } from 'react';
import { GearboxInputs, GearboxOutputs } from '../../types/gearbox';
import { UnitSystem } from '../../types/common';
import { Activity, BarChart2, Layers } from 'lucide-react';

interface GearboxChartsProps {
  inputs: GearboxInputs;
  outputs: GearboxOutputs;
  unitSystem?: UnitSystem;
}

export const GearboxCharts: React.FC<GearboxChartsProps> = ({
  inputs,
  outputs,
}) => {
  const [activeTab, setActiveTab] = useState<'spectrum' | 'stress' | 'ehl'>('spectrum');

  const {
    gmfHarmonics,
    stressCurves,
    bendingStressMpa,
    allowableBendingStressMpa,
    bendingSafetyFactorSF,
    contactStressMpa,
    allowableContactStressMpa,
    contactSafetyFactorSH,
    operatingViscosityCSt,
    specificFilmThicknessLambda,
    lubricationRegime,
    overallVibrationMmSRms,
    iso10816Zone,
    iso10816ZoneLabel,
    sidebandSeverityPercent,
  } = outputs;

  // Chart dimensions
  const chartW = 740;
  const chartH = 340;
  const padL = 65;
  const padR = 35;
  const padT = 30;
  const padB = 45;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  // Tab 1: Spectrum Scale
  const maxFreq = Math.max(100, outputs.gearMeshFrequencyHz * 4.5);
  const maxAmp = Math.max(8, ...gmfHarmonics.map((h) => Math.max(h.amplitudeMmS, h.sidebandAmpMmS) * 1.35));

  const getSpecX = (f: number) => padL + (f / maxFreq) * plotW;
  const getSpecY = (a: number) => padT + plotH - (a / maxAmp) * plotH;

  // Tab 2: Stress vs Load Scale
  const maxStressY = Math.max(
    allowableContactStressMpa * 1.15,
    ...stressCurves.map((s) => Math.max(s.bendingStressMpa, s.contactStressMpa) * 1.1)
  );

  const getLoadX = (pct: number) => padL + ((pct - 20) / (150 - 20)) * plotW;
  const getStressY = (val: number) => padT + plotH - (val / maxStressY) * plotH;

  const contactStressPath = stressCurves
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getLoadX(pt.powerPercent).toFixed(1)} ${getStressY(pt.contactStressMpa).toFixed(1)}`)
    .join(' ');

  const bendingStressPath = stressCurves
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getLoadX(pt.powerPercent).toFixed(1)} ${getStressY(pt.bendingStressMpa).toFixed(1)}`)
    .join(' ');

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0f17] rounded-lg border border-[#1e293b] overflow-hidden select-none">
      {/* Chart Navigation Tabs */}
      <div className="px-3 py-2 bg-[#0f172a] border-b border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-[#1e293b] p-0.5 rounded border border-slate-700/60">
          <button
            onClick={() => setActiveTab('spectrum')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              activeTab === 'spectrum'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            GMF Spectrum & Sidebands
          </button>
          <button
            onClick={() => setActiveTab('stress')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              activeTab === 'stress'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            AGMA 2001 Stress Curves
          </button>
          <button
            onClick={() => setActiveTab('ehl')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              activeTab === 'ehl'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            EHL Lubrication (AGMA 9005)
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-slate-400">
          {activeTab === 'spectrum' && (
            <span>
              ISO 10816: <strong className={iso10816Zone === 'A' || iso10816Zone === 'B' ? 'text-emerald-400' : 'text-rose-400'}>{overallVibrationMmSRms} mm/s (Zone {iso10816Zone})</strong>
            </span>
          )}
          {activeTab === 'stress' && (
            <span>
              Bending S_F: <strong className={bendingSafetyFactorSF >= 1.4 ? 'text-emerald-400' : 'text-rose-400'}>{bendingSafetyFactorSF}</strong> | Contact S_H: <strong className={contactSafetyFactorSH >= 1.25 ? 'text-emerald-400' : 'text-rose-400'}>{contactSafetyFactorSH}</strong>
            </span>
          )}
          {activeTab === 'ehl' && (
            <span>
              Film Ratio λ: <strong className={specificFilmThicknessLambda >= 2.0 ? 'text-emerald-400' : 'text-amber-400'}>{specificFilmThicknessLambda}</strong> ({lubricationRegime})
            </span>
          )}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="flex-1 w-full p-2 flex items-center justify-center min-h-[340px]">
        {activeTab === 'spectrum' && (
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-full max-h-[460px]">
            {/* Grid & Frame */}
            <rect x={padL} y={padT} width={plotW} height={plotH} fill="#070a0f" stroke="#334155" strokeWidth="1" />

            {/* ISO 10816 Zone Limit Lines */}
            <line x1={padL} y1={getSpecY(2.8)} x2={padL + plotW} y2={getSpecY(2.8)} stroke="#38bdf8" strokeDasharray="3 3" strokeWidth="1" opacity="0.6" />
            <text x={padL + plotW - 6} y={getSpecY(2.8) - 3} fill="#38bdf8" fontSize="9" fontFamily="monospace" textAnchor="end">
              Zone A/B (2.8 mm/s)
            </text>

            <line x1={padL} y1={getSpecY(4.5)} x2={padL + plotW} y2={getSpecY(4.5)} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth="1" opacity="0.6" />
            <text x={padL + plotW - 6} y={getSpecY(4.5) - 3} fill="#fbbf24" fontSize="9" fontFamily="monospace" textAnchor="end">
              Zone B/C Alert (4.5 mm/s)
            </text>

            <line x1={padL} y1={getSpecY(7.1)} x2={padL + plotW} y2={getSpecY(7.1)} stroke="#ef4444" strokeDasharray="3 3" strokeWidth="1" opacity="0.6" />
            <text x={padL + plotW - 6} y={getSpecY(7.1) - 3} fill="#ef4444" fontSize="9" fontFamily="monospace" textAnchor="end">
              Zone C/D Danger (7.1 mm/s)
            </text>

            {/* 1X Pinion & Gear Running Speed Markers */}
            <line x1={getSpecX(outputs.pinionSpeedHz)} y1={padT} x2={getSpecX(outputs.pinionSpeedHz)} y2={padT + plotH} stroke="#475569" strokeDasharray="2 2" strokeWidth="1" />
            <text x={getSpecX(outputs.pinionSpeedHz)} y={padT + 12} fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="middle">
              1X_p ({outputs.pinionSpeedHz}Hz)
            </text>

            <line x1={getSpecX(outputs.gearSpeedHz)} y1={padT} x2={getSpecX(outputs.gearSpeedHz)} y2={padT + plotH} stroke="#475569" strokeDasharray="2 2" strokeWidth="1" />
            <text x={getSpecX(outputs.gearSpeedHz)} y={padT + 24} fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="middle">
              1X_g ({outputs.gearSpeedHz}Hz)
            </text>

            {/* GMF Harmonics & Sidebands */}
            {gmfHarmonics.map((h) => {
              const xGmf = getSpecX(h.frequencyHz);
              const yGmf = getSpecY(h.amplitudeMmS);
              const xSbLeft = getSpecX(Math.max(0, h.frequencyHz - outputs.pinionSpeedHz));
              const xSbRight = getSpecX(h.frequencyHz + outputs.pinionSpeedHz);
              const ySb = getSpecY(h.sidebandAmpMmS);

              return (
                <g key={`gmf-${h.order}`}>
                  {/* GMF Main Peak */}
                  <line x1={xGmf} y1={padT + plotH} x2={xGmf} y2={yGmf} stroke={h.isHigh ? '#ef4444' : '#06b6d4'} strokeWidth="3" />
                  <circle cx={xGmf} cy={yGmf} r="4" fill={h.isHigh ? '#ef4444' : '#06b6d4'} />
                  <text x={xGmf} y={yGmf - 8} fill={h.isHigh ? '#fca5a5' : '#67e8f9'} fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    {h.label} ({h.amplitudeMmS} mm/s)
                  </text>

                  {/* Pinion 1X Sidebands (+/- 1X) */}
                  {h.sidebandAmpMmS > 0.1 && (
                    <g>
                      {/* Left sideband */}
                      <line x1={xSbLeft} y1={padT + plotH} x2={xSbLeft} y2={ySb} stroke="#f59e0b" strokeWidth="1.8" />
                      <circle cx={xSbLeft} cy={ySb} r="2.5" fill="#f59e0b" />

                      {/* Right sideband */}
                      <line x1={xSbRight} y1={padT + plotH} x2={xSbRight} y2={ySb} stroke="#f59e0b" strokeWidth="1.8" />
                      <circle cx={xSbRight} cy={ySb} r="2.5" fill="#f59e0b" />
                    </g>
                  )}
                </g>
              );
            })}

            {/* Y Axis Labels (Velocity Amplitude) */}
            {[0, maxAmp * 0.25, maxAmp * 0.5, maxAmp * 0.75, maxAmp].map((val, idx) => {
              const y = getSpecY(val);
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
              Vibration Velocity (mm/s RMS)
            </text>

            {/* X Axis Labels (Frequency Hz) */}
            {[0, maxFreq * 0.25, maxFreq * 0.5, maxFreq * 0.75, maxFreq].map((val, idx) => {
              const x = getSpecX(val);
              return (
                <g key={`x-${idx}`}>
                  <line x1={x} y1={padT + plotH} x2={x} y2={padT + plotH + 4} stroke="#64748b" />
                  <text x={x} y={padT + plotH + 16} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                    {Math.round(val)} Hz
                  </text>
                </g>
              );
            })}
            <text x={padL + plotW / 2} y={chartH - 8} fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="middle">
              Frequency Spectrum (GMF = {outputs.gearMeshFrequencyHz} Hz | Sideband Depth: {sidebandSeverityPercent}%)
            </text>

            {/* Legend */}
            <g transform={`translate(${padL + 12}, ${padT + 14})`}>
              <line x1="0" y1="0" x2="16" y2="0" stroke="#06b6d4" strokeWidth="3" />
              <text x="22" y="3" fill="#67e8f9" fontSize="10" fontFamily="monospace">Gear Mesh Harmonics (GMF)</text>

              <line x1="200" y1="0" x2="216" y2="0" stroke="#f59e0b" strokeWidth="2" />
              <text x="222" y="3" fill="#fbbf24" fontSize="10" fontFamily="monospace">±1X Pinion Modulation Sidebands</text>
            </g>
          </svg>
        )}

        {activeTab === 'stress' && (
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-full max-h-[460px]">
            <rect x={padL} y={padT} width={plotW} height={plotH} fill="#070a0f" stroke="#334155" strokeWidth="1" />

            {/* Allowable Contact Stress Line */}
            <line
              x1={padL}
              y1={getStressY(allowableContactStressMpa)}
              x2={padL + plotW}
              y2={getStressY(allowableContactStressMpa)}
              stroke="#ef4444"
              strokeDasharray="4 3"
              strokeWidth="1.5"
            />
            <text x={padL + plotW - 6} y={getStressY(allowableContactStressMpa) - 4} fill="#fca5a5" fontSize="10" fontFamily="monospace" textAnchor="end">
              Allowable Contact Stress σ_HP ({allowableContactStressMpa} MPa)
            </text>

            {/* Allowable Bending Stress Line */}
            <line
              x1={padL}
              y1={getStressY(allowableBendingStressMpa)}
              x2={padL + plotW}
              y2={getStressY(allowableBendingStressMpa)}
              stroke="#f59e0b"
              strokeDasharray="4 3"
              strokeWidth="1.5"
            />
            <text x={padL + plotW - 6} y={getStressY(allowableBendingStressMpa) - 4} fill="#fde047" fontSize="10" fontFamily="monospace" textAnchor="end">
              Allowable Bending Stress σ_FP ({allowableBendingStressMpa} MPa)
            </text>

            {/* Stress Paths */}
            <path d={contactStressPath} fill="none" stroke="#ef4444" strokeWidth="2.5" />
            <path d={bendingStressPath} fill="none" stroke="#38bdf8" strokeWidth="2.5" />

            {/* Current Operating Point Marker (100% Load) */}
            <circle cx={getLoadX(100)} cy={getStressY(contactStressMpa)} r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx={getLoadX(100)} cy={getStressY(bendingStressMpa)} r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />

            {/* Operating Point Annotations */}
            <text x={getLoadX(100) + 8} y={getStressY(contactStressMpa) + 4} fill="#fca5a5" fontSize="10" fontFamily="monospace" fontWeight="bold">
              σ_c = {contactStressMpa} MPa (S_H = {contactSafetyFactorSH})
            </text>
            <text x={getLoadX(100) + 8} y={getStressY(bendingStressMpa) - 4} fill="#7dd3fc" fontSize="10" fontFamily="monospace" fontWeight="bold">
              σ_b = {bendingStressMpa} MPa (S_F = {bendingSafetyFactorSF})
            </text>

            {/* Y Axis Labels (Stress MPa) */}
            {[0, maxStressY * 0.25, maxStressY * 0.5, maxStressY * 0.75, maxStressY].map((val, idx) => {
              const y = getStressY(val);
              return (
                <g key={`y-${idx}`}>
                  <line x1={padL - 4} y1={y} x2={padL} y2={y} stroke="#64748b" />
                  <text x={padL - 8} y={y + 3} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="end">
                    {Math.round(val)}
                  </text>
                </g>
              );
            })}
            <text x={18} y={padT + plotH / 2} fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="middle" transform={`rotate(-90 18 ${padT + plotH / 2})`}>
              AGMA 2001 Stress (MPa)
            </text>

            {/* X Axis Labels (Power %) */}
            {[20, 40, 60, 80, 100, 120, 140, 150].map((pct) => {
              const x = getLoadX(pct);
              return (
                <g key={`x-${pct}`}>
                  <line x1={x} y1={padT + plotH} x2={x} y2={padT + plotH + 4} stroke="#64748b" />
                  <text x={x} y={padT + plotH + 16} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                    {pct}%
                  </text>
                </g>
              );
            })}
            <text x={padL + plotW / 2} y={chartH - 8} fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="middle">
              Transmitted Motor Power (% of {inputs.ratedPowerKw} kW)
            </text>

            {/* Legend */}
            <g transform={`translate(${padL + 12}, ${padT + 14})`}>
              <line x1="0" y1="0" x2="16" y2="0" stroke="#ef4444" strokeWidth="2.5" />
              <text x="22" y="3" fill="#fca5a5" fontSize="10" fontFamily="monospace">Contact Stress σ_c (Pitting Risk)</text>

              <line x1="230" y1="0" x2="246" y2="0" stroke="#38bdf8" strokeWidth="2.5" />
              <text x="252" y="3" fill="#7dd3fc" fontSize="10" fontFamily="monospace">Bending Stress σ_b (Root Fatigue)</text>
            </g>
          </svg>
        )}

        {activeTab === 'ehl' && (
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-full max-h-[460px]">
            <rect x={padL} y={padT} width={plotW} height={plotH} fill="#070a0f" stroke="#334155" strokeWidth="1" />

            {/* EHL Lambda Regime Shaded Backgrounds */}
            {/* Boundary Regime (0 to 1.0) */}
            <rect
              x={padL}
              y={padT + plotH - (1.0 / 4.0) * plotH}
              width={plotW}
              height={(1.0 / 4.0) * plotH}
              fill="rgba(239, 68, 68, 0.12)"
            />
            {/* Mixed Regime (1.0 to 2.2) */}
            <rect
              x={padL}
              y={padT + plotH - (2.2 / 4.0) * plotH}
              width={plotW}
              height={((2.2 - 1.0) / 4.0) * plotH}
              fill="rgba(245, 158, 11, 0.10)"
            />
            {/* Full EHL Film (> 2.2) */}
            <rect
              x={padL}
              y={padT}
              width={plotW}
              height={plotH - (2.2 / 4.0) * plotH}
              fill="rgba(16, 185, 129, 0.08)"
            />

            {/* Threshold Dividing Lines */}
            <line
              x1={padL}
              y1={padT + plotH - (1.0 / 4.0) * plotH}
              x2={padL + plotW}
              y2={padT + plotH - (1.0 / 4.0) * plotH}
              stroke="#ef4444"
              strokeDasharray="4 2"
              strokeWidth="1.5"
            />
            <text x={padL + plotW - 6} y={padT + plotH - (1.0 / 4.0) * plotH + 14} fill="#ef4444" fontSize="10" fontFamily="monospace" textAnchor="end">
              Boundary Friction / Scuffing Zone (λ &lt; 1.0)
            </text>

            <line
              x1={padL}
              y1={padT + plotH - (2.2 / 4.0) * plotH}
              x2={padL + plotW}
              y2={padT + plotH - (2.2 / 4.0) * plotH}
              stroke="#f59e0b"
              strokeDasharray="4 2"
              strokeWidth="1.5"
            />
            <text x={padL + plotW - 6} y={padT + plotH - (2.2 / 4.0) * plotH + 14} fill="#fbbf24" fontSize="10" fontFamily="monospace" textAnchor="end">
              Mixed / Asperity Contact Zone (1.0 ≤ λ &lt; 2.2)
            </text>

            <text x={padL + plotW - 6} y={padT + 18} fill="#34d399" fontSize="10" fontFamily="monospace" textAnchor="end">
              Full Elastohydrodynamic Film (λ ≥ 2.2)
            </text>

            {/* Current Operating Condition Marker */}
            {(() => {
              const clampLam = Math.min(3.8, Math.max(0.1, specificFilmThicknessLambda));
              const markY = padT + plotH - (clampLam / 4.0) * plotH;
              const markX = padL + ((inputs.oilOperatingTempC - 30) / (100 - 30)) * plotW;

              return (
                <g>
                  <line x1={markX} y1={padT} x2={markX} y2={padT + plotH} stroke="#38bdf8" strokeDasharray="3 3" strokeWidth="1" />
                  <circle cx={markX} cy={markY} r="7" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" />
                  <text x={markX + 12} y={markY + 4} fill="#67e8f9" fontSize="11" fontFamily="monospace" fontWeight="bold">
                    λ = {specificFilmThicknessLambda} (T = {inputs.oilOperatingTempC}°C, ν = {operatingViscosityCSt} cSt)
                  </text>
                </g>
              );
            })()}

            {/* Y Axis (Lambda Ratio 0 to 4) */}
            {[0, 1.0, 2.0, 3.0, 4.0].map((val) => {
              const y = padT + plotH - (val / 4.0) * plotH;
              return (
                <g key={`lam-${val}`}>
                  <line x1={padL - 4} y1={y} x2={padL} y2={y} stroke="#64748b" />
                  <text x={padL - 8} y={y + 3} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="end">
                    λ = {val.toFixed(1)}
                  </text>
                </g>
              );
            })}
            <text x={18} y={padT + plotH / 2} fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="middle" transform={`rotate(-90 18 ${padT + plotH / 2})`}>
              Specific Film Ratio λ = h_min / Ra
            </text>

            {/* X Axis (Oil Temperature 30 to 100 C) */}
            {[30, 40, 50, 60, 70, 80, 90, 100].map((deg) => {
              const x = padL + ((deg - 30) / (100 - 30)) * plotW;
              return (
                <g key={`deg-${deg}`}>
                  <line x1={x} y1={padT + plotH} x2={x} y2={padT + plotH + 4} stroke="#64748b" />
                  <text x={x} y={padT + plotH + 16} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                    {deg}°C
                  </text>
                </g>
              );
            })}
            <text x={padL + plotW / 2} y={chartH - 8} fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="middle">
              Gearbox Sump Operating Oil Temperature (°C)
            </text>
          </svg>
        )}
      </div>
    </div>
  );
};
