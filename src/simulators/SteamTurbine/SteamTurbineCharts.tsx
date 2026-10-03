import React, { useState } from 'react';
import { SteamTurbineInputs, SteamTurbineOutputs } from '../../types/steamTurbine';
import { UnitSystem } from '../../types/common';

interface SteamTurbineChartsProps {
  inputs: SteamTurbineInputs;
  outputs: SteamTurbineOutputs;
  unitSystem?: UnitSystem;
}

export const SteamTurbineCharts: React.FC<SteamTurbineChartsProps> = ({
  inputs,
  outputs,
}) => {
  const [activeChart, setActiveChart] = useState<'mollier' | 'willans' | 'campbell' | 'moisture'>('mollier');

  // SVG dimensions
  const width = 640;
  const height = 320;
  const padding = { top: 30, right: 40, bottom: 45, left: 65 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // --------------------------------------------------------------------------
  // CHART 1: MOLLIER (h-s) EXPANSION DIAGRAM
  // --------------------------------------------------------------------------
  const renderMollierChart = () => {
    // S range: 5.5 to 8.2 kJ/(kg·K)
    // H range: 1800 to 3600 kJ/kg
    const minS = 5.5;
    const maxS = 8.2;
    const minH = 1800;
    const maxH = 3600;

    const scaleS = (s: number) => padding.left + ((s - minS) / (maxS - minS)) * plotWidth;
    const scaleH = (h: number) => padding.top + plotHeight - ((h - minH) / (maxH - minH)) * plotHeight;

    // Approximated Saturation Line (x = 1.0)
    const satCurvePoints: Array<{ s: number; h: number }> = [
      { s: 8.0, h: 2570 },
      { s: 7.7, h: 2630 },
      { s: 7.3, h: 2710 },
      { s: 7.0, h: 2760 },
      { s: 6.7, h: 2795 },
      { s: 6.4, h: 2800 },
      { s: 6.1, h: 2770 },
      { s: 5.8, h: 2700 },
    ];
    const satPath = satCurvePoints
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${scaleS(pt.s)},${scaleH(pt.h)}`)
      .join(' ');

    // Approximated Wilson Line (x = 0.96)
    const wilsonPath = satCurvePoints
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${scaleS(pt.s - 0.15)},${scaleH(pt.h - 90)}`)
      .join(' ');

    // 12% Moisture Limit Line (x = 0.88)
    const moistureLimitPath = satCurvePoints
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${scaleS(pt.s - 0.45)},${scaleH(pt.h - 280)}`)
      .join(' ');

    // State points
    const pIn = outputs.mollierPoints[0];
    const pIsen = outputs.mollierPoints[1];
    const pAct = outputs.mollierPoints[2];

    const xIn = scaleS(pIn.entropy);
    const yIn = scaleH(pIn.enthalpy);

    const xIsen = scaleS(pIsen.entropy);
    const yIsen = scaleH(pIsen.enthalpy);

    const xAct = scaleS(pAct.entropy);
    const yAct = scaleH(pAct.enthalpy);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* Grid lines */}
        {[6.0, 6.5, 7.0, 7.5, 8.0].map((sVal) => (
          <g key={sVal}>
            <line
              x1={scaleS(sVal)}
              y1={padding.top}
              x2={scaleS(sVal)}
              y2={padding.top + plotHeight}
              stroke="#27272a"
              strokeDasharray="3 3"
            />
            <text x={scaleS(sVal)} y={height - 18} textAnchor="middle" fill="#71717a" fontSize="10" fontFamily="monospace">
              {sVal.toFixed(1)}
            </text>
          </g>
        ))}

        {[2000, 2400, 2800, 3200, 3600].map((hVal) => (
          <g key={hVal}>
            <line
              x1={padding.left}
              y1={scaleH(hVal)}
              x2={padding.left + plotWidth}
              y2={scaleH(hVal)}
              stroke="#27272a"
              strokeDasharray="3 3"
            />
            <text x={padding.left - 8} y={scaleH(hVal) + 3} textAnchor="end" fill="#71717a" fontSize="10" fontFamily="monospace">
              {hVal}
            </text>
          </g>
        ))}

        {/* Curves */}
        <path d={satPath} fill="none" stroke="#38bdf8" strokeWidth="2" />
        <path d={wilsonPath} fill="none" stroke="#eab308" strokeWidth="1.5" strokeDasharray="4 3" />
        <path d={moistureLimitPath} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3" />

        {/* Labels for curves */}
        <text x={scaleS(7.6)} y={scaleH(2650) - 8} fill="#38bdf8" fontSize="9" fontWeight="bold">
          Saturation Dome (x = 1.0)
        </text>
        <text x={scaleS(7.4)} y={scaleH(2530) - 8} fill="#eab308" fontSize="8">
          Wilson Line (x = 0.96)
        </text>
        <text x={scaleS(7.05)} y={scaleH(2340) - 8} fill="#ef4444" fontSize="8">
          12% Erosion Limit (x = 0.88)
        </text>

        {/* Expansion Lines */}
        {/* Ideal isentropic expansion (vertical downward line s = const) */}
        <line x1={xIn} y1={yIn} x2={xIsen} y2={yIsen} stroke="#a1a1aa" strokeWidth="2" strokeDasharray="5 3" />
        {/* Actual expansion line */}
        <line x1={xIn} y1={yIn} x2={xAct} y2={yAct} stroke="#22c55e" strokeWidth="2.5" />

        {/* Points */}
        <circle cx={xIn} cy={yIn} r="5" fill="#f97316" stroke="#fff" strokeWidth="1.5" />
        <text x={xIn + 8} y={yIn - 4} fill="#f97316" fontSize="10" fontWeight="bold">
          1: Inlet ({pIn.enthalpy} kJ/kg)
        </text>

        <circle cx={xIsen} cy={yIsen} r="4" fill="#a1a1aa" />
        <text x={xIsen - 8} y={yIsen + 14} textAnchor="end" fill="#a1a1aa" fontSize="9">
          2s: Ideal ({pIsen.enthalpy})
        </text>

        <circle cx={xAct} cy={yAct} r="5" fill="#22c55e" stroke="#fff" strokeWidth="1.5" />
        <text x={xAct + 8} y={yAct + 4} fill="#22c55e" fontSize="10" fontWeight="bold">
          2: Actual ({pAct.enthalpy} kJ/kg, y={outputs.exhaustMoisturePercent}%)
        </text>

        {/* Axis Titles */}
        <text x={padding.left + plotWidth / 2} y={height - 2} textAnchor="middle" fill="#a1a1aa" fontSize="11" fontWeight="bold">
          Entropy s [kJ / (kg·K)]
        </text>
        <text
          x={14}
          y={padding.top + plotHeight / 2}
          textAnchor="middle"
          fill="#a1a1aa"
          fontSize="11"
          fontWeight="bold"
          transform={`rotate(-90, 14, ${padding.top + plotHeight / 2})`}
        >
          Enthalpy h [kJ / kg]
        </text>
      </svg>
    );
  };

  // --------------------------------------------------------------------------
  // CHART 2: WILLANS LINE (Steam Mass Flow vs Shaft Power)
  // --------------------------------------------------------------------------
  const renderWillansChart = () => {
    const maxPower = Math.round(inputs.ratedPowerKw * 1.3);
    const maxFlow = Math.round(outputs.steamMassFlowTonnesHr * 1.4);

    const scaleP = (p: number) => padding.left + (p / maxPower) * plotWidth;
    const scaleF = (f: number) => padding.top + plotHeight - (f / maxFlow) * plotHeight;

    // Willans curve points
    const noLoad = outputs.noLoadSteamFlowTonnesHr;
    const ratedP = inputs.ratedPowerKw;
    const ratedF = outputs.steamMassFlowTonnesHr;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1.0, 1.25].map((mult) => {
          const pVal = Math.round(maxPower * mult);
          return (
            <g key={mult}>
              <line x1={scaleP(pVal)} y1={padding.top} x2={scaleP(pVal)} y2={padding.top + plotHeight} stroke="#27272a" strokeDasharray="3 3" />
              <text x={scaleP(pVal)} y={height - 18} textAnchor="middle" fill="#71717a" fontSize="10" fontFamily="monospace">
                {pVal}
              </text>
            </g>
          );
        })}

        {[0, 0.25, 0.5, 0.75, 1.0].map((mult) => {
          const fVal = Math.round(maxFlow * mult);
          return (
            <g key={mult}>
              <line x1={padding.left} y1={scaleF(fVal)} x2={padding.left + plotWidth} y2={scaleF(fVal)} stroke="#27272a" strokeDasharray="3 3" />
              <text x={padding.left - 8} y={scaleF(fVal) + 3} textAnchor="end" fill="#71717a" fontSize="10" fontFamily="monospace">
                {fVal}
              </text>
            </g>
          );
        })}

        {/* Willans Line */}
        <line
          x1={scaleP(0)}
          y1={scaleF(noLoad)}
          x2={scaleP(maxPower)}
          y2={scaleF(noLoad + ((ratedF - noLoad) / ratedP) * maxPower)}
          stroke="#06b6d4"
          strokeWidth="3"
        />

        {/* No-Load Intercept */}
        <circle cx={scaleP(0)} cy={scaleF(noLoad)} r="5" fill="#eab308" />
        <text x={scaleP(0) + 8} y={scaleF(noLoad) - 6} fill="#eab308" fontSize="9" fontWeight="bold">
          No-Load: {noLoad.toFixed(1)} t/h
        </text>

        {/* Rated Operating Point */}
        <circle cx={scaleP(ratedP)} cy={scaleF(ratedF)} r="6" fill="#10b981" stroke="#fff" strokeWidth="2" />
        <text x={scaleP(ratedP) - 10} y={scaleF(ratedF) - 12} textAnchor="end" fill="#10b981" fontSize="10" fontWeight="bold">
          Rated Load ({ratedP} kW, {ratedF.toFixed(1)} t/h)
        </text>

        {/* Axis Titles */}
        <text x={padding.left + plotWidth / 2} y={height - 2} textAnchor="middle" fill="#a1a1aa" fontSize="11" fontWeight="bold">
          Shaft Output Power [kW]
        </text>
        <text
          x={14}
          y={padding.top + plotHeight / 2}
          textAnchor="middle"
          fill="#a1a1aa"
          fontSize="11"
          fontWeight="bold"
          transform={`rotate(-90, 14, ${padding.top + plotHeight / 2})`}
        >
          Steam Consumption [t/h]
        </text>
      </svg>
    );
  };

  // --------------------------------------------------------------------------
  // CHART 3: CAMPBELL DIAGRAM (Blade Resonances vs RPM)
  // --------------------------------------------------------------------------
  const renderCampbellChart = () => {
    const maxRpm = Math.round(inputs.ratedSpeedRpm * 1.25);
    const maxFreq = Math.max(10000, outputs.nozzlePassFrequencyHz * 1.3);

    const scaleN = (n: number) => padding.left + (n / maxRpm) * plotWidth;
    const scaleF = (f: number) => padding.top + plotHeight - (f / maxFreq) * plotHeight;

    const opN = inputs.operatingSpeedRpm;
    const bladeFb = inputs.bladeNaturalFrequencyHz;

    // Campbell excitation rays (1X, 2X, NPF)
    const ray1X_y = (maxRpm / 60) * 1;
    const ray2X_y = (maxRpm / 60) * 2;
    const rayNPF_y = (maxRpm / 60) * inputs.nozzlePassFrequencyCount;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* Grid */}
        {[0.2, 0.4, 0.6, 0.8, 1.0, 1.2].map((ratio) => {
          const rVal = Math.round(inputs.ratedSpeedRpm * ratio);
          return (
            <g key={ratio}>
              <line x1={scaleN(rVal)} y1={padding.top} x2={scaleN(rVal)} y2={padding.top + plotHeight} stroke="#27272a" strokeDasharray="3 3" />
              <text x={scaleN(rVal)} y={height - 18} textAnchor="middle" fill="#71717a" fontSize="10" fontFamily="monospace">
                {rVal}
              </text>
            </g>
          );
        })}

        {/* Blade Natural Frequency Horizontal Line (with centrifugal stiffening) */}
        <line x1={padding.left} y1={scaleF(bladeFb)} x2={padding.left + plotWidth} y2={scaleF(bladeFb * 1.04)} stroke="#a855f7" strokeWidth="2.5" />
        <text x={padding.left + plotWidth - 10} y={scaleF(bladeFb * 1.04) - 8} textAnchor="end" fill="#c084fc" fontSize="9" fontWeight="bold">
          Blade Natural Frequency (f_b = {bladeFb} Hz)
        </text>

        {/* API 612 ±10% Avoidance Band */}
        <rect
          x={padding.left}
          y={scaleF(bladeFb * 1.10)}
          width={plotWidth}
          height={scaleF(bladeFb * 0.90) - scaleF(bladeFb * 1.10)}
          fill="#a855f7"
          opacity="0.10"
        />

        {/* Excitation Rays */}
        {/* 1X Line */}
        <line x1={scaleN(0)} y1={scaleF(0)} x2={scaleN(maxRpm)} y2={scaleF(ray1X_y)} stroke="#71717a" strokeWidth="1.5" />
        <text x={scaleN(maxRpm) - 10} y={scaleF(ray1X_y) - 6} fill="#71717a" fontSize="8">
          1X Running
        </text>

        {/* Nozzle Pass Frequency (NPF) Ray */}
        <line x1={scaleN(0)} y1={scaleF(0)} x2={scaleN(maxRpm)} y2={scaleF(rayNPF_y)} stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" />
        <text x={scaleN(maxRpm) - 10} y={scaleF(rayNPF_y) - 6} fill="#38bdf8" fontSize="9" fontWeight="bold">
          NPF ({inputs.nozzlePassFrequencyCount}X)
        </text>

        {/* Current Operating Speed Marker */}
        <line
          x1={scaleN(opN)}
          y1={padding.top}
          x2={scaleN(opN)}
          y2={padding.top + plotHeight}
          stroke={outputs.isBladeResonant ? '#ef4444' : '#22c55e'}
          strokeWidth="2"
        />
        <circle cx={scaleN(opN)} cy={scaleF(outputs.nozzlePassFrequencyHz)} r="6" fill={outputs.isBladeResonant ? '#ef4444' : '#22c55e'} />
        <text
          x={scaleN(opN) + 8}
          y={scaleF(outputs.nozzlePassFrequencyHz) - 6}
          fill={outputs.isBladeResonant ? '#f87171' : '#4ade80'}
          fontSize="9"
          fontWeight="bold"
        >
          {opN} RPM (NPF: {outputs.nozzlePassFrequencyHz.toFixed(0)} Hz)
        </text>

        {/* Axis Titles */}
        <text x={padding.left + plotWidth / 2} y={height - 2} textAnchor="middle" fill="#a1a1aa" fontSize="11" fontWeight="bold">
          Turbine Speed [RPM]
        </text>
        <text
          x={14}
          y={padding.top + plotHeight / 2}
          textAnchor="middle"
          fill="#a1a1aa"
          fontSize="11"
          fontWeight="bold"
          transform={`rotate(-90, 14, ${padding.top + plotHeight / 2})`}
        >
          Frequency [Hz]
        </text>
      </svg>
    );
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col h-full">
      {/* Chart Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-zinc-800 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveChart('mollier')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeChart === 'mollier' ? 'bg-orange-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Mollier (h-s) Diagram
          </button>

          <button
            onClick={() => setActiveChart('willans')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeChart === 'willans' ? 'bg-cyan-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Willans Steam Rate Line
          </button>

          <button
            onClick={() => setActiveChart('campbell')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeChart === 'campbell' ? 'bg-purple-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Campbell Blade Dynamics
          </button>
        </div>

        <span className="text-[11px] font-mono text-zinc-400">
          {activeChart === 'mollier' && 'Expansion Path & Moisture Dome'}
          {activeChart === 'willans' && 'Steam Consumption vs kW'}
          {activeChart === 'campbell' && 'NPF Blade Interference Margin'}
        </span>
      </div>

      {/* Chart Canvas Area */}
      <div className="flex-1 w-full min-h-[280px] flex items-center justify-center bg-zinc-900/40 rounded-lg p-2 border border-zinc-850">
        {activeChart === 'mollier' && renderMollierChart()}
        {activeChart === 'willans' && renderWillansChart()}
        {activeChart === 'campbell' && renderCampbellChart()}
      </div>
    </div>
  );
};
