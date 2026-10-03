import React, { useState } from 'react';
import { PipeInputs, PipeOutputs } from '../../types/pipe';
import { UnitSystem } from '../../types/common';
import { formatNum } from '../../utils/units';
import { Activity, BarChart3, TrendingUp, Layers, HelpCircle, ShieldCheck, AlertTriangle } from 'lucide-react';

interface PipeStressChartsProps {
  inputs: PipeInputs;
  outputs: PipeOutputs;
  unitSystem: UnitSystem;
}

export const PipeStressCharts: React.FC<PipeStressChartsProps> = ({
  inputs,
  outputs,
  unitSystem,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<
    'growth_vs_temp' | 'stress_breakdown' | 'anchor_thrust' | 'loop_adequacy'
  >('growth_vs_temp');

  const [hoveredDeltaT, setHoveredDeltaT] = useState<number | null>(null);

  // -------------------------------------------------------------
  // 1. Thermal Growth vs Delta T Curve Generation
  // -------------------------------------------------------------
  const maxDeltaT = 350;
  const numPoints = 50;
  const deltaTStep = maxDeltaT / numPoints;

  const alpha_CS = 12.0 * 1e-6; // Carbon Steel
  const alpha_SS = 16.5 * 1e-6; // Stainless 304
  const alpha_Alloy = 13.0 * 1e-6; // Cr-Mo Alloy
  const alpha_Actual = outputs.materialDetails.alpha_1e6 * 1e-6;
  const L = inputs.pipeLengthM;

  const growthCurve: Array<{
    dt: number;
    growthActualMm: number;
    growthCSMm: number;
    growthSSMm: number;
  }> = [];

  for (let i = 0; i <= numPoints; i++) {
    const dt = i * deltaTStep;
    growthCurve.push({
      dt,
      growthActualMm: alpha_Actual * L * dt * 1000,
      growthCSMm: alpha_CS * L * dt * 1000,
      growthSSMm: alpha_SS * L * dt * 1000,
    });
  }

  // Chart dimensions
  const svgWidth = 620;
  const svgHeight = 270;
  const padding = { top: 25, right: 35, bottom: 45, left: 60 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Scales for Delta L chart
  const maxGrowthY = Math.max(outputs.thermalExpansionMm * 1.3, alpha_SS * L * maxDeltaT * 1000 * 1.05, 20);
  const scaleX = (dt: number) => padding.left + (dt / maxDeltaT) * plotWidth;
  const scaleY = (val: number) => padding.top + plotHeight - (val / maxGrowthY) * plotHeight;

  // Path generators
  const makePath = (key: 'growthActualMm' | 'growthCSMm' | 'growthSSMm') => {
    return growthCurve.reduce((acc, pt, idx) => {
      const x = scaleX(pt.dt);
      const y = scaleY(pt[key]);
      return `${acc} ${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  };

  const actualPath = makePath('growthActualMm');
  const csPath = makePath('growthCSMm');
  const ssPath = makePath('growthSSMm');

  // Duty point coords
  const dutyX = scaleX(outputs.deltaTempC);
  const dutyY = scaleY(outputs.thermalExpansionMm);

  return (
    <div className="flex flex-col gap-3 rounded-sm bg-[#161b22] border border-[#30363d] p-3 sm:p-4 shadow-md">
      {/* Chart Navigation Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#30363d] pb-2">
        <div className="flex items-center gap-1 bg-[#0d1117] p-0.5 rounded-sm border border-[#30363d] flex-wrap">
          <button
            type="button"
            onClick={() => setActiveChartTab('growth_vs_temp')}
            className={`px-3 py-1 text-xs font-mono rounded-sm transition-all flex items-center gap-1.5 ${
              activeChartTab === 'growth_vs_temp'
                ? 'bg-[#f27d26] text-black font-bold'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <TrendingUp size={13} />
            <span>Thermal Growth vs ΔT</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartTab('stress_breakdown')}
            className={`px-3 py-1 text-xs font-mono rounded-sm transition-all flex items-center gap-1.5 ${
              activeChartTab === 'stress_breakdown'
                ? 'bg-[#f27d26] text-black font-bold'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <BarChart3 size={13} />
            <span>Stress Breakdown vs Allowable</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartTab('anchor_thrust')}
            className={`px-3 py-1 text-xs font-mono rounded-sm transition-all flex items-center gap-1.5 ${
              activeChartTab === 'anchor_thrust'
                ? 'bg-[#f27d26] text-black font-bold'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <Activity size={13} />
            <span>Anchor Force & Reactions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartTab('loop_adequacy')}
            className={`px-3 py-1 text-xs font-mono rounded-sm transition-all flex items-center gap-1.5 ${
              activeChartTab === 'loop_adequacy'
                ? 'bg-[#f27d26] text-black font-bold'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <Layers size={13} />
            <span>Expansion Loop Sizing</span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-[#8b949e]">
          ASME B31.3 §319 Flexibility Verification
        </span>
      </div>

      {/* ========================================================
          TAB 1: THERMAL GROWTH VS DELTA T
          ======================================================== */}
      {activeChartTab === 'growth_vs_temp' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono text-[#8b949e]">
            <span>
              Thermal Expansion: <strong className="text-[#f27d26]">ΔL = α · L · ΔT</strong> (L = {inputs.pipeLengthM} m)
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[#f27d26]">
                <span className="w-3 h-0.5 bg-[#f27d26] inline-block" /> Active ({outputs.materialDetails.name.split(' ')[0]})
              </span>
              <span className="flex items-center gap-1 text-[#58a6ff]">
                <span className="w-3 h-0.5 bg-[#58a6ff] inline-block" /> SS 304 (High)
              </span>
              <span className="flex items-center gap-1 text-[#8b949e]">
                <span className="w-3 h-0.5 bg-[#8b949e] inline-block" /> CS A106B
              </span>
            </div>
          </div>

          <div className="relative w-full aspect-[2.3/1] max-h-[300px] bg-[#0d1117] rounded-sm overflow-hidden border border-[#30363d]">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-full"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;
                if (mouseX >= padding.left && mouseX <= svgWidth - padding.right) {
                  const dt = ((mouseX - padding.left) / plotWidth) * maxDeltaT;
                  setHoveredDeltaT(dt);
                } else {
                  setHoveredDeltaT(null);
                }
              }}
              onMouseLeave={() => setHoveredDeltaT(null)}
            >
              {/* Grid Lines */}
              {[0, 50, 100, 150, 200, 250, 300, 350].map((dt) => (
                <g key={`grid-x-${dt}`}>
                  <line
                    x1={scaleX(dt)}
                    y1={padding.top}
                    x2={scaleX(dt)}
                    y2={padding.top + plotHeight}
                    stroke="#21262d"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                  <text
                    x={scaleX(dt)}
                    y={padding.top + plotHeight + 14}
                    fill="#8b949e"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {dt}°C
                  </text>
                </g>
              ))}

              {[0, 0.25, 0.5, 0.75, 1.0].map((frac) => {
                const val = frac * maxGrowthY;
                const y = scaleY(val);
                return (
                  <g key={`grid-y-${frac}`}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={padding.left + plotWidth}
                      y2={y}
                      stroke="#21262d"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 3}
                      fill="#8b949e"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {val.toFixed(0)} mm
                    </text>
                  </g>
                );
              })}

              {/* Reference Curves */}
              <path d={ssPath} fill="none" stroke="#58a6ff" strokeWidth="1.5" strokeDasharray="3,3" />
              <path d={csPath} fill="none" stroke="#8b949e" strokeWidth="1.5" strokeDasharray="3,3" />

              {/* Active Material Curve */}
              <path d={actualPath} fill="none" stroke="#f27d26" strokeWidth="2.5" />

              {/* Operating Duty Point Crosshairs */}
              <line
                x1={dutyX}
                y1={padding.top}
                x2={dutyX}
                y2={padding.top + plotHeight}
                stroke="#f27d26"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <line
                x1={padding.left}
                y1={dutyY}
                x2={padding.left + plotWidth}
                y2={dutyY}
                stroke="#f27d26"
                strokeWidth="1"
                strokeDasharray="4,4"
              />

              {/* Duty Point Marker */}
              <circle cx={dutyX} cy={dutyY} r="5" fill="#f27d26" stroke="#ffffff" strokeWidth="2" />

              {/* Duty Point Tooltip / Badge */}
              <g transform={`translate(${Math.min(svgWidth - 140, Math.max(padding.left + 10, dutyX + 10))}, ${Math.max(padding.top + 20, dutyY - 25)})`}>
                <rect width="130" height="34" rx="3" fill="#161b22" stroke="#f27d26" strokeWidth="1" />
                <text x="8" y="14" fill="#8b949e" fontSize="8" fontFamily="monospace">OPERATING POINT</text>
                <text x="8" y="27" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  ΔT={outputs.deltaTempC}°C → ΔL={outputs.thermalExpansionMm.toFixed(1)}mm
                </text>
              </g>

              {/* X / Y Axis Labels */}
              <text
                x={padding.left + plotWidth / 2}
                y={svgHeight - 10}
                fill="#8b949e"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
              >
                Temperature Differential ΔT (°C)
              </text>
              <text
                x={14}
                y={padding.top + plotHeight / 2}
                fill="#8b949e"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
                transform={`rotate(-90 14 ${padding.top + plotHeight / 2})`}
              >
                Thermal Growth ΔL (mm)
              </text>
            </svg>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: STRESS BREAKDOWN VS CODE ALLOWABLE
          ======================================================== */}
      {activeChartTab === 'stress_breakdown' && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-sm bg-[#0d1117] border border-[#30363d]">
              <span className="text-[10px] font-mono text-[#8b949e] block">Axial Stress σ_axial</span>
              <span className="text-base font-bold font-mono text-white">
                {outputs.axialStressMPa.toFixed(1)} <span className="text-xs text-[#8b949e]">MPa</span>
              </span>
              <span className="text-[9px] font-mono text-[#58a6ff] block mt-0.5">
                Restraint {(outputs.effectiveRestraintFactor * 100).toFixed(0)}%
              </span>
            </div>

            <div className="p-2.5 rounded-sm bg-[#0d1117] border border-[#30363d]">
              <span className="text-[10px] font-mono text-[#8b949e] block">Hoop Pressure σ_hoop</span>
              <span className="text-base font-bold font-mono text-white">
                {outputs.hoopStressMPa.toFixed(1)} <span className="text-xs text-[#8b949e]">MPa</span>
              </span>
              <span className="text-[9px] font-mono text-[#58a6ff] block mt-0.5">
                P = {inputs.operatingPressureBar} bar
              </span>
            </div>

            <div className="p-2.5 rounded-sm bg-[#0d1117] border border-[#30363d]">
              <span className="text-[10px] font-mono text-[#8b949e] block">Combined von Mises</span>
              <span
                className={`text-base font-bold font-mono ${
                  outputs.stressState === 'critical'
                    ? 'text-[#f85149]'
                    : outputs.stressState === 'warning'
                    ? 'text-[#f27d26]'
                    : 'text-[#3fb950]'
                }`}
              >
                {outputs.combinedStressVonMisesMPa.toFixed(1)} <span className="text-xs text-[#8b949e]">MPa</span>
              </span>
              <span className="text-[9px] font-mono text-[#8b949e] block mt-0.5">
                {outputs.stressRatioPercent.toFixed(0)}% of S_A
              </span>
            </div>

            <div className="p-2.5 rounded-sm bg-[#0d1117] border border-[#30363d]">
              <span className="text-[10px] font-mono text-[#8b949e] block">ASME Allowable S_A</span>
              <span className="text-base font-bold font-mono text-[#3fb950]">
                {outputs.allowableStressMPa.toFixed(1)} <span className="text-xs text-[#8b949e]">MPa</span>
              </span>
              <span className="text-[9px] font-mono text-[#8b949e] block mt-0.5">
                ASME B31.3 Table A-1
              </span>
            </div>
          </div>

          {/* Graphical Stress Bars */}
          <div className="p-3 bg-[#0d1117] rounded-sm border border-[#30363d] flex flex-col gap-3">
            <span className="text-xs font-bold font-mono text-white">Stress Component Capacity Utilization:</span>

            {/* 1. Combined von Mises */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-white">Combined von Mises (σ_combined):</span>
                <span className={outputs.stressRatioPercent > 100 ? 'text-[#f85149] font-bold' : 'text-white'}>
                  {outputs.combinedStressVonMisesMPa.toFixed(1)} / {outputs.allowableStressMPa.toFixed(1)} MPa ({outputs.stressRatioPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="h-4 bg-[#161b22] rounded-sm overflow-hidden border border-[#30363d] relative">
                <div
                  className={`h-full transition-all duration-300 ${
                    outputs.stressRatioPercent > 100
                      ? 'bg-[#f85149]'
                      : outputs.stressRatioPercent > 80
                      ? 'bg-[#f27d26]'
                      : 'bg-[#3fb950]'
                  }`}
                  style={{ width: `${Math.min(100, outputs.stressRatioPercent)}%` }}
                />
                {/* 100% threshold marker */}
                <div className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-[#f27d26] opacity-60" title="80% Warning Threshold" />
              </div>
            </div>

            {/* 2. Axial Thermal Stress */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#8b949e]">Direct Axial Stress (σ_axial):</span>
                <span className="text-[#8b949e]">
                  {outputs.axialStressMPa.toFixed(1)} MPa ({((outputs.axialStressMPa / outputs.allowableStressMPa) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="h-3 bg-[#161b22] rounded-sm overflow-hidden border border-[#30363d]">
                <div
                  className="h-full bg-[#58a6ff] transition-all duration-300"
                  style={{ width: `${Math.min(100, (outputs.axialStressMPa / outputs.allowableStressMPa) * 100)}%` }}
                />
              </div>
            </div>

            {/* 3. Hoop Pressure Stress */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#8b949e]">Hoop Pressure Stress (σ_hoop):</span>
                <span className="text-[#8b949e]">
                  {outputs.hoopStressMPa.toFixed(1)} MPa ({((outputs.hoopStressMPa / outputs.allowableStressMPa) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="h-3 bg-[#161b22] rounded-sm overflow-hidden border border-[#30363d]">
                <div
                  className="h-full bg-[#d2a8ff] transition-all duration-300"
                  style={{ width: `${Math.min(100, (outputs.hoopStressMPa / outputs.allowableStressMPa) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: ANCHOR REACTION THRUST & EQUIPMENT NOZZLES
          ======================================================== */}
      {activeChartTab === 'anchor_thrust' && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="p-2.5 rounded-sm bg-[#0d1117] border border-[#30363d]">
              <span className="text-[10px] font-mono text-[#8b949e] block">Axial Reaction Force F_axial</span>
              <span className="text-lg font-bold font-mono text-[#f27d26]">
                {outputs.axialForceKN.toFixed(2)} <span className="text-xs text-[#8b949e]">kN</span>
              </span>
              <span className="text-[9px] font-mono text-[#8b949e] block">
                ({(outputs.axialForceKN * 224.809).toFixed(0)} lbf / {(outputs.axialForceKN * 101.97).toFixed(0)} kgf)
              </span>
            </div>

            <div className="p-2.5 rounded-sm bg-[#0d1117] border border-[#30363d]">
              <span className="text-[10px] font-mono text-[#8b949e] block">Anchor Overturn Moment</span>
              <span className="text-lg font-bold font-mono text-white">
                {outputs.anchorReactionMomentZ_kNm.toFixed(2)} <span className="text-xs text-[#8b949e]">kN·m</span>
              </span>
              <span className="text-[9px] font-mono text-[#8b949e] block">
                ({(outputs.anchorReactionMomentZ_kNm * 737.56).toFixed(0)} ft·lb)
              </span>
            </div>

            <div className="p-2.5 rounded-sm bg-[#0d1117] border border-[#30363d]">
              <span className="text-[10px] font-mono text-[#8b949e] block">API 610 Pump Nozzle Check</span>
              <span
                className={`text-sm font-bold font-mono ${
                  outputs.axialForceKN > 15 ? 'text-[#f85149]' : 'text-[#3fb950]'
                }`}
              >
                {outputs.axialForceKN > 15 ? 'Exceeds Typical API 610 Table 5' : 'Within Typical API 610 Range'}
              </span>
              <span className="text-[9px] font-mono text-[#8b949e] block">
                Std 6" Nozzle: ~12-18 kN
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#0d1117] rounded-sm border border-[#30363d] text-xs text-[#d1d5db] font-sans flex flex-col gap-2">
            <span className="font-bold text-white font-mono flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#3fb950]" />
              Anchor & Nozzle Loading Insights
            </span>
            <p className="leading-relaxed">
              When a pipe undergoes thermal expansion, restraint at fixed anchors generates substantial compressive thrust.
              For a <strong>{inputs.pipeLengthM} m</strong> run at <strong>ΔT = {outputs.deltaTempC}°C</strong>, calculated anchor thrust is{' '}
              <strong className="text-[#f27d26] font-mono">{outputs.axialForceKN.toFixed(1)} kN</strong>.
              If connected directly to rotating machinery (pumps, compressors, turbines), high nozzle reactions can cause casing distortion, shaft misalignment, and premature seal/bearing failures.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: EXPANSION LOOP SIZING & ADEQUACY
          ======================================================== */}
      {activeChartTab === 'loop_adequacy' && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="p-2.5 rounded-sm bg-[#0d1117] border border-[#30363d]">
              <span className="text-[10px] font-mono text-[#8b949e] block">Actual Loop Height (H)</span>
              <span className="text-base font-bold font-mono text-white">
                {inputs.expansionLoopHeightM.toFixed(2)} <span className="text-xs text-[#8b949e]">m</span>
              </span>
              <span className="text-[9px] font-mono text-[#8b949e] block">
                Loop Width: {inputs.expansionLoopWidthM.toFixed(2)} m
              </span>
            </div>

            <div className="p-2.5 rounded-sm bg-[#0d1117] border border-[#30363d]">
              <span className="text-[10px] font-mono text-[#8b949e] block">Required Minimum Height (H_min)</span>
              <span className="text-base font-bold font-mono text-[#38bdf8]">
                {outputs.expansionLoopRequiredHeightM > 0
                  ? outputs.expansionLoopRequiredHeightM.toFixed(2)
                  : 'N/A'}{' '}
                <span className="text-xs text-[#8b949e]">m</span>
              </span>
              <span className="text-[9px] font-mono text-[#8b949e] block">
                Guided Cantilever Formula
              </span>
            </div>

            <div className="p-2.5 rounded-sm bg-[#0d1117] border border-[#30363d]">
              <span className="text-[10px] font-mono text-[#8b949e] block">Loop Adequacy Ratio</span>
              <span
                className={`text-base font-bold font-mono ${
                  outputs.isExpansionLoopAdequate ? 'text-[#3fb950]' : 'text-[#f85149]'
                }`}
              >
                {outputs.expansionLoopAdequacyPercent > 0
                  ? `${outputs.expansionLoopAdequacyPercent.toFixed(0)}%`
                  : 'N/A'}
              </span>
              <span className="text-[9px] font-mono text-[#8b949e] block">
                {outputs.isExpansionLoopAdequate ? 'Adequate (H ≥ H_min)' : 'Inadequate (H < H_min)'}
              </span>
            </div>
          </div>

          {outputs.expansionLoopWarning && (
            <div className="p-2.5 rounded-sm bg-[#f27d2618] border border-[#f27d26] flex items-center gap-2 text-xs text-[#f27d26] font-mono">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{outputs.expansionLoopWarning}</span>
            </div>
          )}

          <div className="p-3 bg-[#0d1117] rounded-sm border border-[#30363d] text-xs text-[#d1d5db] font-sans flex flex-col gap-1.5">
            <span className="font-bold text-white font-mono">
              Kellogg / Guided Cantilever Sizing Formula:
            </span>
            <div className="bg-[#161b22] p-2 rounded-sm font-mono text-[11px] text-[#38bdf8] border border-[#30363d]">
              H_min = sqrt((3 · E · D_o · ΔL) / (S_A · K_loop))
            </div>
            <p className="text-[11px] text-[#8b949e] leading-relaxed">
              Where E = {outputs.materialDetails.E_GPa} GPa, D_o = {inputs.pipeOuterDiameterMm} mm, ΔL = {outputs.thermalExpansionMm.toFixed(2)} mm, and S_A = {outputs.allowableStressMPa} MPa.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
