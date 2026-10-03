import React, { useState } from 'react';
import { CompressorInputs, CompressorOutputs } from '../../types/compressor';
import { UnitSystem } from '../../types/common';
import { Activity, Gauge, TrendingUp, AlertTriangle } from 'lucide-react';

interface CompressorChartsProps {
  inputs: CompressorInputs;
  outputs: CompressorOutputs;
  unitSystem?: UnitSystem;
}

export const CompressorCharts: React.FC<CompressorChartsProps> = ({
  inputs,
  outputs,
  unitSystem = 'metric',
}) => {
  const [activeTab, setActiveTab] = useState<'map' | 'thrust'>('map');
  const [showSystemResistance, setShowSystemResistance] = useState<boolean>(true);
  const [throttleFactor, setThrottleFactor] = useState<number>(1.0);

  const svgW = 620;
  const svgH = 260;
  const pad = { top: 30, right: 35, bottom: 40, left: 55 };
  const plotW = svgW - pad.left - pad.right;
  const plotH = svgH - pad.top - pad.bottom;

  // Domain: Flow (kg/s) 8 to 38, Pressure Ratio (Rc) 1.0 to 3.2
  const minFlow = 8;
  const maxFlow = 38;
  const minPR = 1.0;
  const maxPR = 3.2;

  const toX = (flow: number) => pad.left + ((flow - minFlow) / (maxFlow - minFlow)) * plotW;
  const toY = (pr: number) => pad.top + (1 - (pr - minPR) / (maxPR - minPR)) * plotH;

  // Speeds: 80%, 90%, 100%, 105%
  const speeds = [
    { label: '80% Speed', color: '#64748b', fraction: 0.8 },
    { label: '90% Speed', color: '#94a3b8', fraction: 0.9 },
    { label: '100% (Rated)', color: '#10b981', fraction: 1.0 },
    { label: '105% Speed', color: '#38bdf8', fraction: 1.05 },
  ];

  const currentFlow = outputs.massFlowTotalKgS;
  const currentPR = outputs.pressureRatioRc;

  // Generate paths for speed lines
  const generateSpeedLinePath = (spdFraction: number) => {
    const sllFlow = 18.0 * (inputs.speedRpm / inputs.designSpeedRpm) * spdFraction;
    const startFlow = sllFlow * 0.95;
    const endFlow = sllFlow * 2.15;
    let d = '';
    const steps = 25;
    for (let i = 0; i <= steps; i++) {
      const f = startFlow + (i / steps) * (endFlow - startFlow);
      const flowRatio = f / sllFlow;
      const maxHeadPR = 1 + 1.6 * Math.pow(spdFraction, 2);
      const pr = maxHeadPR - 0.24 * Math.pow(flowRatio - 1, 1.25);
      const x = toX(f);
      const y = toY(Math.max(1.02, pr));
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    return d;
  };

  // Generate SLL (Surge Limit Line) path
  let sllD = '';
  for (let f = 10; f <= 23; f += 0.5) {
    const pr = 1 + 1.6 * Math.pow(f / 18.0, 2);
    const x = toX(f);
    const y = toY(pr);
    sllD += sllD === '' ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }

  // Generate SCL (Surge Control Line) path (+12% buffer)
  let sclD = '';
  for (let f = 11.2; f <= 26; f += 0.5) {
    const pr = 1 + 1.6 * Math.pow(f / (18.0 * 1.12), 2);
    const x = toX(f);
    const y = toY(pr);
    sclD += sclD === '' ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }

  // Generate System Process Resistance Line path (Recommendation #4)
  let sysD = '';
  if (showSystemResistance) {
    const kSys = Math.max(0.001, (currentPR - 1.05) / Math.pow(Math.max(10, currentFlow), 1.85));
    for (let f = minFlow; f <= maxFlow; f += 0.5) {
      const pr = 1.05 + kSys * Math.pow(f, 1.85);
      const x = toX(f);
      const y = toY(Math.min(maxPR, Math.max(minPR, pr)));
      sysD += sysD === '' ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#c9d1d9] font-mono text-xs select-none">
      {/* 1. Header Tabs */}
      <div className="h-9 border-b border-[#30363d] px-3 flex items-center justify-between bg-[#161b22] shrink-0">
        <div className="flex items-center gap-1.5 text-[11px]">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-2.5 py-1 rounded-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'map'
                ? 'bg-[#f27d26] text-black font-bold'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            Performance Map & SLL (API 617 Benchmark)
          </button>
          <button
            onClick={() => setActiveTab('thrust')}
            className={`px-2.5 py-1 rounded-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'thrust'
                ? 'bg-[#f27d26] text-black font-bold'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Axial Thrust & Shock Pulsation
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'map' && (
            <button
              onClick={() => setShowSystemResistance(!showSystemResistance)}
              className={`px-2 py-0.5 rounded text-[10px] border transition-all ${
                showSystemResistance
                  ? 'bg-purple-950/60 border-purple-400 text-purple-200'
                  : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:text-white'
              }`}
              title="Overlay Process System Resistance Curve"
            >
              Overlay System Curve {showSystemResistance ? 'ON' : 'OFF'}
            </button>
          )}
          <span className="text-[10px] text-[#8b949e] border border-[#30363d] px-1.5 py-0.5 rounded bg-[#0d1117]">
            Point: {currentFlow.toFixed(1)} kg/s @ {currentPR.toFixed(2)} Rc
          </span>
        </div>
      </div>

      {/* 2. Visual Chart Area */}
      <div className="flex-1 p-2 flex flex-col items-center justify-center relative overflow-hidden">
        {activeTab === 'map' ? (
          <div className="w-full h-full max-h-[300px] flex items-center justify-center">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full max-w-full">
              {/* Plot Background */}
              <rect
                x={pad.left}
                y={pad.top}
                width={plotW}
                height={plotH}
                fill="#161b22"
                stroke="#30363d"
                strokeWidth={1}
              />

              {/* Grid Lines */}
              {[1.0, 1.5, 2.0, 2.5, 3.0].map((prVal) => {
                const y = toY(prVal);
                return (
                  <g key={`y-${prVal}`}>
                    <line x1={pad.left} y1={y} x2={pad.left + plotW} y2={y} stroke="#21262d" strokeDasharray="3 3" />
                    <text x={pad.left - 8} y={y + 3.5} textAnchor="end" fill="#8b949e" fontSize="9">
                      {prVal.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {[10, 15, 20, 25, 30, 35].map((fVal) => {
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

              {/* Axis Labels */}
              <text
                x={pad.left + plotW / 2}
                y={svgH - 6}
                textAnchor="middle"
                fill="#8b949e"
                fontSize="10"
              >
                Mass Flow Rate m_dot (kg/s)
              </text>
              <text
                x={14}
                y={pad.top + plotH / 2}
                textAnchor="middle"
                fill="#8b949e"
                fontSize="10"
                transform={`rotate(-90, 14, ${pad.top + plotH / 2})`}
              >
                Pressure Ratio (P2/P1)
              </text>

              {/* Speed Characteristic Curves */}
              {speeds.map((s) => (
                <path
                  key={s.label}
                  d={generateSpeedLinePath(s.fraction)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.fraction === 1.0 ? 2 : 1.2}
                />
              ))}

              {/* Surge Limit Line (SLL) */}
              <path d={sllD} fill="none" stroke="#ef4444" strokeWidth={2.5} strokeDasharray="4 3" />

              {/* Surge Control Line (SCL) */}
              <path d={sclD} fill="none" stroke="#f59e0b" strokeWidth={1.8} strokeDasharray="2 2" />

              {/* System Process Resistance Curve (Recommendation #4) */}
              {showSystemResistance && sysD && (
                <path d={sysD} fill="none" stroke="#c084fc" strokeWidth={2} strokeDasharray="3 2" />
              )}

              {/* Operating Point */}
              <circle
                cx={toX(Math.min(maxFlow, Math.max(minFlow, currentFlow)))}
                cy={toY(Math.min(maxPR, Math.max(minPR, currentPR)))}
                r={6}
                fill={
                  outputs.operatingState === 'deep_surge' || outputs.operatingState === 'incipient_surge'
                    ? '#ef4444'
                    : outputs.operatingState === 'surge_warning'
                    ? '#f59e0b'
                    : '#10b981'
                }
                stroke="#ffffff"
                strokeWidth={2}
              />

              {/* Legend in top-right */}
              <g transform={`translate(${pad.left + plotW - 145}, ${pad.top + 8})`}>
                <rect width={135} height={84} fill="#0d1117" stroke="#30363d" rx={3} opacity={0.9} />
                <line x1={8} y1={14} x2={28} y2={14} stroke="#ef4444" strokeWidth={2} strokeDasharray="4 2" />
                <text x={34} y={17} fill="#ef4444" fontSize="9">Surge Limit Line</text>

                <line x1={8} y1={28} x2={28} y2={28} stroke="#f59e0b" strokeWidth={1.8} strokeDasharray="2 2" />
                <text x={34} y={31} fill="#f59e0b" fontSize="9">Surge Control Line</text>

                <line x1={8} y1={42} x2={28} y2={42} stroke="#10b981" strokeWidth={2} />
                <text x={34} y={45} fill="#10b981" fontSize="9">100% Design Speed</text>

                {showSystemResistance && (
                  <>
                    <line x1={8} y1={56} x2={28} y2={56} stroke="#c084fc" strokeWidth={1.8} strokeDasharray="3 2" />
                    <text x={34} y={59} fill="#c084fc" fontSize="9">System Curve</text>
                  </>
                )}

                <circle cx={18} cy={showSystemResistance ? 70 : 56} r={4} fill="#38bdf8" />
                <text x={34} y={showSystemResistance ? 73 : 59} fill="#38bdf8" fontSize="9">Current Point</text>
              </g>
            </svg>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col justify-center p-4 max-w-lg mx-auto gap-3">
            <div className="bg-[#161b22] border border-[#30363d] p-3 rounded flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Axial Thrust Pad Load Ratio</span>
                <span
                  className={`font-bold ${
                    outputs.thrustBearingLoadPercent > 100
                      ? 'text-red-400'
                      : outputs.thrustBearingLoadPercent > 80
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {outputs.thrustBearingLoadPercent.toFixed(0)}% of API 617 Rating
                </span>
              </div>
              <div className="w-full bg-[#0d1117] h-3 rounded overflow-hidden border border-[#30363d]">
                <div
                  className={`h-full transition-all duration-300 ${
                    outputs.thrustBearingLoadPercent > 100
                      ? 'bg-red-500'
                      : outputs.thrustBearingLoadPercent > 80
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, outputs.thrustBearingLoadPercent)}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-400">
                {outputs.reverseFlowDetected
                  ? '⚠ REVERSE THRUST REVERSAL ACTIVE: Impeller backpressure loss drives rotor hard into inactive tilting pads.'
                  : 'Normal unidirectional thrust toward compressor suction casing.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#161b22] border border-[#30363d] p-2.5 rounded">
                <div className="text-[10px] text-slate-400">PRESSURE OSCILLATION</div>
                <div className="text-base font-bold text-sky-400">
                  ±{outputs.pressureOscillationBar.toFixed(2)} bar
                </div>
                <div className="text-[9px] text-slate-500">Acoustic cycle: {outputs.surgeCycleFrequencyHz} Hz</div>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] p-2.5 rounded">
                <div className="text-[10px] text-slate-400">CASING NOISE</div>
                <div className="text-base font-bold text-amber-400">{outputs.acousticNoiseDba} dBA</div>
                <div className="text-[9px] text-slate-500">Threshold: 85 dBA continuous</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Engineering KPI Strip */}
      <div className="h-14 border-t border-[#30363d] px-3 grid grid-cols-4 items-center bg-[#161b22] shrink-0 text-center">
        <div>
          <div className="text-[9px] text-[#8b949e]">SURGE MARGIN</div>
          <div
            className={`text-xs font-bold ${
              outputs.currentSurgeMarginPercent < 0
                ? 'text-red-400'
                : outputs.currentSurgeMarginPercent < 12
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {outputs.currentSurgeMarginPercent.toFixed(1)}%
          </div>
        </div>

        <div>
          <div className="text-[9px] text-[#8b949e]">DISCHARGE T2</div>
          <div className="text-xs font-bold text-sky-400">{outputs.dischargeTempC.toFixed(1)}°C</div>
        </div>

        <div>
          <div className="text-[9px] text-[#8b949e]">GAS SHAFT POWER</div>
          <div className="text-xs font-bold text-[#f27d26]">
            {Math.round(outputs.shaftPowerKw).toLocaleString()} kW
          </div>
        </div>

        <div>
          <div className="text-[9px] text-[#8b949e]">REGIME</div>
          <div
            className={`text-xs font-bold ${
              outputs.operatingState === 'deep_surge'
                ? 'text-red-400'
                : outputs.operatingState === 'surge_warning'
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {outputs.operatingState.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};
