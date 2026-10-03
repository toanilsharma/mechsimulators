import React, { useState } from 'react';
import { AlignmentInputs, AlignmentOutputs } from '../../types/alignment';
import { UnitSystem } from '../../types/common';
import { Target, TrendingUp, Activity, Layers, ShieldCheck, AlertTriangle } from 'lucide-react';

interface AlignmentChartsProps {
  inputs: AlignmentInputs;
  outputs: AlignmentOutputs;
  unitSystem: UnitSystem;
}

export const AlignmentCharts: React.FC<AlignmentChartsProps> = ({
  inputs,
  outputs,
  unitSystem,
}) => {
  const [activeTab, setActiveTab] = useState<'tolerance' | 'thermal' | 'vibration' | 'disc'>('tolerance');

  const svgWidth = 620;
  const svgHeight = 260;
  const pad = { top: 35, right: 30, bottom: 45, left: 60 };
  const plotW = svgWidth - pad.left - pad.right;
  const plotH = svgHeight - pad.top - pad.bottom;

  return (
    <div id="alignment-charts" className="flex flex-col h-full bg-[#0d1117] text-[#c9d1d9] font-mono text-xs select-none">
      {/* 1. Technical Chart Header Tabs */}
      <div className="h-9 border-b border-[#30363d] px-3 flex items-center justify-between bg-[#161b22] shrink-0">
        <div className="flex items-center gap-1.5 text-[11px]">
          <button
            onClick={() => setActiveTab('tolerance')}
            className={`px-2.5 py-1 rounded-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'tolerance'
                ? 'bg-[#f27d26] text-black font-bold'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            API 686 Envelope
          </button>
          <button
            onClick={() => setActiveTab('thermal')}
            className={`px-2.5 py-1 rounded-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'thermal'
                ? 'bg-[#f27d26] text-black font-bold'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Thermal Elevation
          </button>
          <button
            onClick={() => setActiveTab('vibration')}
            className={`px-2.5 py-1 rounded-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'vibration'
                ? 'bg-[#f27d26] text-black font-bold'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            2X Vibration FFT
          </button>
          <button
            onClick={() => setActiveTab('disc')}
            className={`px-2.5 py-1 rounded-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'disc'
                ? 'bg-[#f27d26] text-black font-bold'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Disc Pack Stress
          </button>
        </div>

        <span className="text-[10px] text-[#8b949e] hidden sm:inline">
          {activeTab === 'tolerance' && `API 686 Table 7.1 (${inputs.motorRpm} RPM)`}
          {activeTab === 'thermal' && 'Cold-to-Hot Thermal Growth Profile'}
          {activeTab === 'vibration' && 'ISO 10816-3 2X Misalignment Spectrum'}
          {activeTab === 'disc' && 'AGMA 9000-D11 Alternating Fatigue'}
        </span>
      </div>

      {/* 2. SVG Plot Area */}
      <div className="relative flex-1 w-full p-2 flex items-center justify-center overflow-hidden">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full max-h-full drop-shadow-sm">
          {/* Background & Plot Border */}
          <rect x={pad.left} y={pad.top} width={plotW} height={plotH} fill="#080b0f" stroke="#30363d" strokeWidth="1" rx="2" />

          {/* ========================================================= */}
          {/* TAB 1: API 686 TOLERANCE ENVELOPE (POLAR / CARTESIAN PLOT) */}
          {/* ========================================================= */}
          {activeTab === 'tolerance' && (
            <g id="chart-tolerance-envelope">
              {/* Max limits for plot scale */}
              {(() => {
                const maxOffsetScale = outputs.allowableParallelOffsetMm * 2.2;
                const maxAngleScale = outputs.allowableAngularOffsetMrad * 2.2;

                const originX = pad.left + plotW / 2;
                const originY = pad.top + plotH / 2;

                // API 686 Limit Ellipse / Box (Acceptable: 100%)
                const rx100 = (outputs.allowableParallelOffsetMm / maxOffsetScale) * (plotW / 2);
                const ry100 = (outputs.allowableAngularOffsetMrad / maxAngleScale) * (plotH / 2);

                // API 686 Excellent Box (50%)
                const rx50 = rx100 * 0.5;
                const ry50 = ry100 * 0.5;

                // Current operating point coordinates
                const ptX = originX + (outputs.hotRunningHorizontalOffsetMm / maxOffsetScale) * (plotW / 2);
                const ptY = originY - (outputs.hotRunningVerticalOffsetMm / maxOffsetScale) * (plotH / 2);

                return (
                  <g>
                    {/* Crosshairs */}
                    <line x1={pad.left} y1={originY} x2={pad.left + plotW} y2={originY} stroke="#30363d" strokeWidth="1" strokeDasharray="4 2" />
                    <line x1={originX} y1={pad.top} x2={originX} y2={pad.top + plotH} stroke="#30363d" strokeWidth="1" strokeDasharray="4 2" />

                    {/* Zone 3: Out of Tolerance (Red background area) */}
                    <rect x={pad.left} y={pad.top} width={plotW} height={plotH} fill="#f43f5e" fillOpacity="0.06" />

                    {/* Zone 2: Acceptable (Yellow Ellipse) */}
                    <ellipse cx={originX} cy={originY} rx={rx100} ry={ry100} fill="#fbbf24" fillOpacity="0.12" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 3" />

                    {/* Zone 1: Excellent (Green Ellipse) */}
                    <ellipse cx={originX} cy={originY} rx={rx50} ry={ry50} fill="#34d399" fillOpacity="0.2" stroke="#34d399" strokeWidth="2" />

                    {/* Operating Target (Cold Target) */}
                    <circle
                      cx={originX + (outputs.coldTargetVerticalOffsetMm / maxOffsetScale) * (plotW / 2)}
                      cy={originY}
                      r="4"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />
                    <text
                      x={originX + (outputs.coldTargetVerticalOffsetMm / maxOffsetScale) * (plotW / 2) + 6}
                      y={originY - 8}
                      fill="#38bdf8"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      COLD TARGET
                    </text>

                    {/* Current Running Point (Hot Resultant) */}
                    <circle cx={ptX} cy={ptY} r="7" fill={outputs.toleranceUtilizationPercent > 100 ? '#f43f5e' : '#34d399'} stroke="#ffffff" strokeWidth="2" />
                    <circle cx={ptX} cy={ptY} r="12" fill="none" stroke={outputs.toleranceUtilizationPercent > 100 ? '#f43f5e' : '#34d399'} strokeWidth="1.5" strokeOpacity="0.5" />

                    <text x={ptX + 12} y={ptY + 4} fill="#ffffff" fontSize="10" fontWeight="bold">
                      HOT RUNNING ({outputs.toleranceUtilizationPercent.toFixed(0)}%)
                    </text>

                    {/* Axis Labels */}
                    <text x={pad.left + plotW - 10} y={originY - 6} fill="#8b949e" fontSize="9" textAnchor="end">
                      Parallel Offset ΔX [mm]
                    </text>
                    <text x={originX + 8} y={pad.top + 14} fill="#8b949e" fontSize="9">
                      Parallel Offset ΔY [mm]
                    </text>

                    {/* Legend */}
                    <g transform={`translate(${pad.left + 10}, ${pad.top + 10})`}>
                      <circle cx="6" cy="6" r="4" fill="#34d399" />
                      <text x="14" y="9" fill="#34d399" fontSize="8.5">API 686 Excellent (≤50%)</text>
                      <circle cx="126" cy="6" r="4" fill="#fbbf24" />
                      <text x="134" y="9" fill="#fbbf24" fontSize="8.5">API 686 Acceptable (≤100%)</text>
                      <circle cx="256" cy="6" r="4" fill="#f43f5e" />
                      <text x="264" y="9" fill="#f43f5e" fontSize="8.5">Out of Tolerance</text>
                    </g>
                  </g>
                );
              })()}
            </g>
          )}

          {/* ========================================================= */}
          {/* TAB 2: THERMAL GROWTH ELEVATION PROFILE */}
          {/* ========================================================= */}
          {activeTab === 'thermal' && (
            <g id="chart-thermal-growth">
              {/* Profile from Motor Rear Foot to Pump Volute */}
              {(() => {
                const nodes = [
                  { label: 'Motor Rear', xFrac: 0.1, coldY: 0, hotY: outputs.motorThermalGrowthMm },
                  { label: 'Motor Front', xFrac: 0.3, coldY: 0, hotY: outputs.motorThermalGrowthMm },
                  { label: 'Coupling DBSE', xFrac: 0.5, coldY: 0, hotY: (outputs.motorThermalGrowthMm + outputs.pumpThermalGrowthMm) / 2 },
                  { label: 'Pump Front', xFrac: 0.7, coldY: 0, hotY: outputs.pumpThermalGrowthMm },
                  { label: 'Pump Rear', xFrac: 0.9, coldY: 0, hotY: outputs.pumpThermalGrowthMm * 0.95 },
                ];

                const maxGrowth = Math.max(0.4, outputs.pumpThermalGrowthMm * 1.3);
                const toSvgY = (yVal: number) => pad.top + plotH * (1 - yVal / maxGrowth);

                const coldPts = nodes.map((n) => `${pad.left + n.xFrac * plotW},${toSvgY(n.coldY)}`).join(' ');
                const hotPts = nodes.map((n) => `${pad.left + n.xFrac * plotW},${toSvgY(n.hotY)}`).join(' ');

                return (
                  <g>
                    {/* Horizontal Baseline (Cold 0.0) */}
                    <line x1={pad.left} y1={toSvgY(0)} x2={pad.left + plotW} y2={toSvgY(0)} stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" />

                    {/* Hot Elevation Curve */}
                    <polyline fill="none" stroke="#f43f5e" strokeWidth="3" points={hotPts} />

                    {/* Nodes and Callouts */}
                    {nodes.map((n, i) => {
                      const nx = pad.left + n.xFrac * plotW;
                      const ny = toSvgY(n.hotY);
                      return (
                        <g key={`node-${i}`}>
                          <line x1={nx} y1={toSvgY(0)} x2={nx} y2={ny} stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3 3" />
                          <circle cx={nx} cy={ny} r="5" fill="#f43f5e" />
                          <text x={nx} y={ny - 8} fill="#f43f5e" fontSize="9" fontWeight="bold" textAnchor="middle">
                            +{n.hotY.toFixed(3)} mm
                          </text>
                          <text x={nx} y={pad.top + plotH + 16} fill="#8b949e" fontSize="9" textAnchor="middle">
                            {n.label}
                          </text>
                        </g>
                      );
                    })}

                    {/* Net Thermal Mismatch Box */}
                    <g transform={`translate(${pad.left + 15}, ${pad.top + 12})`}>
                      <rect x="0" y="0" width="220" height="34" rx="3" fill="#161b22" stroke="#30363d" strokeWidth="1" />
                      <text x="10" y="15" fill="#c9d1d9" fontSize="9.5">
                        Net Thermal Elevation: <tspan fill="#f43f5e" fontWeight="bold">+{outputs.netThermalOffsetMm.toFixed(3)} mm</tspan>
                      </text>
                      <text x="10" y="27" fill="#8b949e" fontSize="8.5">
                        Required Cold Target: {outputs.coldTargetVerticalOffsetMm.toFixed(3)} mm
                      </text>
                    </g>
                  </g>
                );
              })()}
            </g>
          )}

          {/* ========================================================= */}
          {/* TAB 3: 2X MISALIGNMENT VIBRATION FFT SPECTRUM */}
          {/* ========================================================= */}
          {activeTab === 'vibration' && (
            <g id="chart-vibration-fft">
              {/* FFT Bars for 1X, 2X, 3X, Axial */}
              {(() => {
                const maxVib = Math.max(7.1, outputs.totalVibrationRmsMmS * 1.3);
                const toVibY = (v: number) => pad.top + plotH * (1 - v / maxVib);

                const bars = [
                  { label: '1X Radial (Unbalance)', val: outputs.vibration1XRmsMmS, color: '#38bdf8' },
                  { label: '2X Radial (Misalignment)', val: outputs.vibration2XRmsMmS, color: '#f43f5e' },
                  { label: '3X Radial (Harmonic)', val: outputs.vibration2XRmsMmS * 0.25, color: '#fbbf24' },
                  { label: '1X/2X Axial (Angular)', val: outputs.vibrationAxialRmsMmS, color: '#a855f7' },
                ];

                return (
                  <g>
                    {/* ISO 10816 Zone Threshold Lines */}
                    {/* Zone A/B Limit: 2.8 mm/s */}
                    <line x1={pad.left} y1={toVibY(2.8)} x2={pad.left + plotW} y2={toVibY(2.8)} stroke="#34d399" strokeWidth="1.5" strokeDasharray="4 2" />
                    <text x={pad.left + plotW - 6} y={toVibY(2.8) - 4} fill="#34d399" fontSize="8.5" textAnchor="end">
                      Zone B Limit (2.8 mm/s RMS)
                    </text>

                    {/* Zone C/D Limit: 4.5 mm/s */}
                    <line x1={pad.left} y1={toVibY(4.5)} x2={pad.left + plotW} y2={toVibY(4.5)} stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 2" />
                    <text x={pad.left + plotW - 6} y={toVibY(4.5) - 4} fill="#f43f5e" fontSize="8.5" textAnchor="end">
                      Zone D Trip Limit (4.5 mm/s RMS)
                    </text>

                    {/* Render Bars */}
                    {bars.map((b, i) => {
                      const barW = 55;
                      const bx = pad.left + 50 + i * (plotW / 4);
                      const by = toVibY(b.val);
                      const bh = pad.top + plotH - by;

                      return (
                        <g key={`bar-${i}`}>
                          <rect x={bx} y={by} width={barW} height={bh} fill={b.color} rx="2" />
                          <text x={bx + barW / 2} y={by - 6} fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                            {b.val.toFixed(2)}
                          </text>
                          <text x={bx + barW / 2} y={pad.top + plotH + 16} fill="#8b949e" fontSize="8.5" textAnchor="middle">
                            {b.label.split(' ')[0]}
                          </text>
                        </g>
                      );
                    })}

                    {/* Total RMS Badge */}
                    <g transform={`translate(${pad.left + 10}, ${pad.top + 10})`}>
                      <rect x="0" y="0" width="180" height="28" rx="3" fill="#161b22" stroke="#30363d" strokeWidth="1" />
                      <text x="10" y="18" fill="#ffffff" fontSize="9.5" fontWeight="bold">
                        TOTAL RMS: {outputs.totalVibrationRmsMmS.toFixed(2)} mm/s (Zone {outputs.iso10816Zone})
                      </text>
                    </g>
                  </g>
                );
              })()}
            </g>
          )}

          {/* ========================================================= */}
          {/* TAB 4: DISC PACK CYCLIC STRESS */}
          {/* ========================================================= */}
          {activeTab === 'disc' && (
            <g id="chart-disc-stress">
              {/* Sinusoidal bending stress across 360 degrees */}
              {(() => {
                const maxStress = 350; // MPa
                const enduranceLimit = 280; // MPa

                const pts = Array.from({ length: 60 }).map((_, i) => {
                  const angleRad = (i / 59) * (2 * Math.PI);
                  const stress = 45 + (outputs.couplingDiscStressMPa - 45) * Math.sin(angleRad);
                  const x = pad.left + (i / 59) * plotW;
                  const y = pad.top + plotH * (1 - Math.max(0, stress) / maxStress);
                  return `${x},${y}`;
                }).join(' ');

                return (
                  <g>
                    {/* Endurance Limit Line (280 MPa) */}
                    <line
                      x1={pad.left}
                      y1={pad.top + plotH * (1 - enduranceLimit / maxStress)}
                      x2={pad.left + plotW}
                      y2={pad.top + plotH * (1 - enduranceLimit / maxStress)}
                      stroke="#f43f5e"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />
                    <text
                      x={pad.left + plotW - 10}
                      y={pad.top + plotH * (1 - enduranceLimit / maxStress) - 6}
                      fill="#f43f5e"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="end"
                    >
                      FATIGUE ENDURANCE LIMIT (280 MPa)
                    </text>

                    {/* Alternating Stress Sine Wave */}
                    <polyline fill="none" stroke="#f27d26" strokeWidth="3" points={pts} />

                    {/* Stress Callout Box */}
                    <g transform={`translate(${pad.left + 15}, ${pad.top + 15})`}>
                      <rect x="0" y="0" width="220" height="36" rx="3" fill="#161b22" stroke="#30363d" strokeWidth="1" />
                      <text x="10" y="16" fill="#ffffff" fontSize="9.5" fontWeight="bold">
                        Peak Disc Stress: {outputs.couplingDiscStressMPa.toFixed(0)} MPa
                      </text>
                      <text x="10" y="28" fill="#38bdf8" fontSize="8.5">
                        Fatigue Safety Factor: {outputs.couplingFatigueSafetyFactor.toFixed(2)} (Min: ≥ 1.3)
                      </text>
                    </g>

                    <text x={pad.left + plotW / 2} y={pad.top + plotH + 18} fill="#8b949e" fontSize="9" textAnchor="middle">
                      Shaft Rotation Angle: 0° → 90° → 180° → 270° → 360°
                    </text>
                  </g>
                );
              })()}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
