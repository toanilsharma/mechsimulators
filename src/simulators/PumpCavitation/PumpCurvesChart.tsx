import React, { useState } from 'react';
import { PumpInputs, PumpOutputs } from '../../types/pump';
import { UnitSystem } from '../../types/common';
import { convertHead, convertFlow, formatNum } from '../../utils/units';
import { Activity, ShieldCheck, AlertTriangle, Info, Layers } from 'lucide-react';

interface PumpCurvesChartProps {
  inputs: PumpInputs;
  outputs: PumpOutputs;
  unitSystem: UnitSystem;
}

export const PumpCurvesChart: React.FC<PumpCurvesChartProps> = ({
  inputs,
  outputs,
  unitSystem,
}) => {
  const [activeTab, setActiveTab] = useState<'npsh' | 'head' | 'system_crossplot' | 'breakdown'>('npsh');
  const [hoveredPoint, setHoveredPoint] = useState<{ flow: number; val1: number; val2?: number } | null>(null);
  const [staticDischargeHeadM, setStaticDischargeHeadM] = useState<number>(15);
  const [throttleFactor, setThrottleFactor] = useState<number>(1.0);

  const flowConv = convertFlow(inputs.flowRateM3h, unitSystem);
  const npshaConv = convertHead(outputs.npshaM, unitSystem);
  const npshrConv = convertHead(outputs.npshrM, unitSystem);
  const marginConv = convertHead(outputs.npshMarginM, unitSystem);
  const reqMarginConv = convertHead(outputs.requiredSafetyMarginM, unitSystem);
  const headConv = convertHead(outputs.operatingHeadM, unitSystem);

  // SVG Chart Dimensions
  const svgWidth = 600;
  const svgHeight = 280;
  const padding = { top: 25, right: 35, bottom: 45, left: 55 };
  const chartW = svgWidth - padding.left - padding.right;
  const chartH = svgHeight - padding.top - padding.bottom;

  // Max ranges for curves
  const maxFlow = Math.max(...outputs.npshCurveData.map((d) => d.flowM3h), inputs.bepFlowM3h * 1.5, 10);
  const maxNpshVal = Math.max(
    ...outputs.npshCurveData.map((d) => Math.max(d.npshaM, d.npshrM, d.safeThresholdM)),
    outputs.npshaM * 1.15,
    outputs.npshrM * 1.4,
    10
  );
  const maxHeadVal = Math.max(
    ...outputs.headCurveData.map((d) => d.headM),
    inputs.ratedHeadM * 1.3,
    20
  );

  const scaleX = (q: number) => padding.left + (q / maxFlow) * chartW;
  const scaleY_Npsh = (h: number) => padding.top + chartH - (h / maxNpshVal) * chartH;
  const scaleY_Head = (h: number) => padding.top + chartH - (h / maxHeadVal) * chartH;

  // Generate SVG path for NPSHr curve
  const npshrPath = outputs.npshCurveData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(d.flowM3h).toFixed(1)} ${scaleY_Npsh(d.npshrM).toFixed(1)}`)
    .join(' ');

  // Generate SVG path for NPSHa curve
  const npshaPath = outputs.npshCurveData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(d.flowM3h).toFixed(1)} ${scaleY_Npsh(d.npshaM).toFixed(1)}`)
    .join(' ');

  // Generate SVG path for Safe Threshold curve (NPSHr + Safety Margin)
  const safeThresholdPath = outputs.npshCurveData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(d.flowM3h).toFixed(1)} ${scaleY_Npsh(d.safeThresholdM).toFixed(1)}`)
    .join(' ');

  // Generate SVG path for Pump Head (H-Q) curve
  const headPath = outputs.headCurveData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(d.flowM3h).toFixed(1)} ${scaleY_Head(d.headM).toFixed(1)}`)
    .join(' ');

  // Head breakdown values (in meters)
  const breakdownItems = [
    { label: 'Atmospheric Head', val: outputs.atmosphericHeadM, color: '#38bdf8' },
    { label: 'Vessel Gauge Head', val: outputs.vesselPressureHeadM, color: '#818cf8' },
    { label: 'Static Elevation Z', val: outputs.staticSuctionHeadM, color: outputs.staticSuctionHeadM >= 0 ? '#34d399' : '#f87171' },
    { label: '- Friction Loss', val: -outputs.totalSuctionHeadLossM, color: '#fb923c' },
    { label: '- Vapor Head', val: -outputs.vaporPressureHeadM, color: '#f43f5e' },
    { label: '= Net NPSHa', val: outputs.npshaM, color: '#10b981', bold: true },
    { label: 'NPSHr', val: outputs.npshrM, color: '#f97316', bold: true },
    { label: 'Required Margin', val: outputs.requiredSafetyMarginM, color: '#a855f7' },
  ];

  return (
    <div id="pump-curves-section" className="flex flex-col gap-3 rounded-sm bg-[#161b22] border border-[#30363d] p-3 sm:p-4 shadow-md">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#30363d] pb-2">
        <div className="flex items-center gap-1.5">
          <button
            id="tab-npsh-curve"
            onClick={() => setActiveTab('npsh')}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono font-medium transition-all ${
              activeTab === 'npsh'
                ? 'bg-[#f27d26] text-white shadow-sm'
                : 'bg-[#0d1117] text-[#8b949e] hover:text-white border border-[#30363d]'
            }`}
          >
            NPSHa vs NPSHr Curves
          </button>
          <button
            id="tab-head-curve"
            onClick={() => setActiveTab('head')}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono font-medium transition-all ${
              activeTab === 'head'
                ? 'bg-[#f27d26] text-white shadow-sm'
                : 'bg-[#0d1117] text-[#8b949e] hover:text-white border border-[#30363d]'
            }`}
          >
            H-Q Performance Curve
          </button>
          <button
            id="tab-system-crossplot"
            onClick={() => setActiveTab('system_crossplot')}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono font-medium transition-all ${
              activeTab === 'system_crossplot'
                ? 'bg-[#f27d26] text-white shadow-sm'
                : 'bg-[#0d1117] text-[#8b949e] hover:text-white border border-[#30363d]'
            }`}
          >
            System vs Pump Cross-Plot
          </button>
          <button
            id="tab-head-breakdown"
            onClick={() => setActiveTab('breakdown')}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono font-medium transition-all ${
              activeTab === 'breakdown'
                ? 'bg-[#f27d26] text-white shadow-sm'
                : 'bg-[#0d1117] text-[#8b949e] hover:text-white border border-[#30363d]'
            }`}
          >
            NPSHa Component Breakdown
          </button>
        </div>

        <span className="text-[11px] font-mono text-[#8b949e]">
          Operating at: <strong className="text-white">{formatNum(flowConv.val, 1)} {flowConv.unit}</strong>
        </span>
      </div>

      {/* 1. NPSHa vs NPSHr Curve View */}
      {activeTab === 'npsh' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#8b949e]">
            <span>Vertical: Head ({unitSystem === 'US' ? 'ft' : 'm'}) | Horizontal: Flow ({unitSystem === 'US' ? 'GPM' : 'm³/h'})</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[#38bdf8]">
                <span className="w-2.5 h-0.5 bg-[#38bdf8] inline-block"></span> NPSHa
              </span>
              <span className="flex items-center gap-1 text-[#f97316]">
                <span className="w-2.5 h-0.5 bg-[#f97316] inline-block"></span> NPSHr
              </span>
              <span className="flex items-center gap-1 text-[#a855f7]">
                <span className="w-2.5 h-0.5 bg-[#a855f7] border-dashed inline-block border-t"></span> Safe Target
              </span>
            </div>
          </div>

          <div className="relative w-full bg-[#0d1117] rounded-sm overflow-hidden border border-[#30363d]">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto block"
            >
              {/* Grid Lines */}
              {[0.25, 0.5, 0.75, 1.0].map((frac) => (
                <g key={`npsh-grid-${frac}`}>
                  <line
                    x1={padding.left}
                    y1={padding.top + chartH * (1 - frac)}
                    x2={padding.left + chartW}
                    y2={padding.top + chartH * (1 - frac)}
                    stroke="#21262d"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padding.left - 8}
                    y={padding.top + chartH * (1 - frac) + 4}
                    fill="#6e7681"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {(maxNpshVal * frac * (unitSystem === 'US' ? 3.28084 : 1)).toFixed(1)}
                  </text>
                  <line
                    x1={padding.left + chartW * frac}
                    y1={padding.top}
                    x2={padding.left + chartW * frac}
                    y2={padding.top + chartH}
                    stroke="#21262d"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padding.left + chartW * frac}
                    y={padding.top + chartH + 15}
                    fill="#6e7681"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {(maxFlow * frac * (unitSystem === 'US' ? 4.40287 : 1)).toFixed(0)}
                  </text>
                </g>
              ))}

              {/* Axes */}
              <line
                x1={padding.left}
                y1={padding.top + chartH}
                x2={padding.left + chartW}
                y2={padding.top + chartH}
                stroke="#484f58"
                strokeWidth="1.5"
              />
              <line
                x1={padding.left}
                y1={padding.top}
                x2={padding.left}
                y2={padding.top + chartH}
                stroke="#484f58"
                strokeWidth="1.5"
              />

              {/* BEP Reference Line */}
              {inputs.bepFlowM3h > 0 && (
                <line
                  x1={scaleX(inputs.bepFlowM3h)}
                  y1={padding.top}
                  x2={scaleX(inputs.bepFlowM3h)}
                  y2={padding.top + chartH}
                  stroke="#3fb950"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
              )}

              {/* Safe Margin Band (NPSHr + Safety Margin) */}
              <path
                d={safeThresholdPath}
                fill="none"
                stroke="#a855f7"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />

              {/* NPSHr Curve */}
              <path
                d={npshrPath}
                fill="none"
                stroke="#f97316"
                strokeWidth="2.5"
              />

              {/* NPSHa Curve */}
              <path
                d={npshaPath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
              />

              {/* Operating Duty Point Markers */}
              <g>
                {/* Vertical Duty Line */}
                <line
                  x1={scaleX(inputs.flowRateM3h)}
                  y1={padding.top}
                  x2={scaleX(inputs.flowRateM3h)}
                  y2={padding.top + chartH}
                  stroke="#e6edf3"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />

                {/* NPSHa Point */}
                <circle
                  cx={scaleX(inputs.flowRateM3h)}
                  cy={scaleY_Npsh(outputs.npshaM)}
                  r="5"
                  fill="#38bdf8"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />

                {/* NPSHr Point */}
                <circle
                  cx={scaleX(inputs.flowRateM3h)}
                  cy={scaleY_Npsh(outputs.npshrM)}
                  r="5"
                  fill="#f97316"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />

                {/* Margin Bracket */}
                <line
                  x1={scaleX(inputs.flowRateM3h) + 10}
                  y1={scaleY_Npsh(outputs.npshaM)}
                  x2={scaleX(inputs.flowRateM3h) + 10}
                  y2={scaleY_Npsh(outputs.npshrM)}
                  stroke={outputs.npshaM >= outputs.npshrM + outputs.requiredSafetyMarginM ? '#3fb950' : outputs.npshaM > outputs.npshrM ? '#f27d26' : '#f85149'}
                  strokeWidth="2"
                />
                <text
                  x={scaleX(inputs.flowRateM3h) + 16}
                  y={(scaleY_Npsh(outputs.npshaM) + scaleY_Npsh(outputs.npshrM)) / 2 + 3}
                  fill={outputs.npshaM >= outputs.npshrM + outputs.requiredSafetyMarginM ? '#3fb950' : outputs.npshaM > outputs.npshrM ? '#f27d26' : '#f85149'}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  Δ = {formatNum(marginConv.val, 2)} {marginConv.unit}
                </text>
              </g>

              {/* Axis Labels */}
              <text
                x={padding.left + chartW / 2}
                y={svgHeight - 8}
                fill="#8b949e"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
              >
                Operating Flow Q ({unitSystem === 'US' ? 'GPM' : 'm³/h'})
              </text>
              <text
                x={-padding.top - chartH / 2}
                y={15}
                transform="rotate(-90)"
                fill="#8b949e"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
              >
                NPSH Head ({unitSystem === 'US' ? 'ft' : 'm'})
              </text>
            </svg>
          </div>
        </div>
      )}

      {/* 2. Pump Head Curve View */}
      {activeTab === 'head' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#8b949e]">
            <span>Total Dynamic Head H-Q Curve vs Flow</span>
            <span className="text-[#3fb950]">Operating Head: {formatNum(headConv.val, 1)} {headConv.unit}</span>
          </div>

          <div className="relative w-full bg-[#0d1117] rounded-sm overflow-hidden border border-[#30363d]">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto block"
            >
              {/* Grid Lines */}
              {[0.25, 0.5, 0.75, 1.0].map((frac) => (
                <g key={`head-grid-${frac}`}>
                  <line
                    x1={padding.left}
                    y1={padding.top + chartH * (1 - frac)}
                    x2={padding.left + chartW}
                    y2={padding.top + chartH * (1 - frac)}
                    stroke="#21262d"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padding.left - 8}
                    y={padding.top + chartH * (1 - frac) + 4}
                    fill="#6e7681"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {(maxHeadVal * frac * (unitSystem === 'US' ? 3.28084 : 1)).toFixed(0)}
                  </text>
                  <line
                    x1={padding.left + chartW * frac}
                    y1={padding.top}
                    x2={padding.left + chartW * frac}
                    y2={padding.top + chartH}
                    stroke="#21262d"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padding.left + chartW * frac}
                    y={padding.top + chartH + 15}
                    fill="#6e7681"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {(maxFlow * frac * (unitSystem === 'US' ? 4.40287 : 1)).toFixed(0)}
                  </text>
                </g>
              ))}

              {/* Axes */}
              <line
                x1={padding.left}
                y1={padding.top + chartH}
                x2={padding.left + chartW}
                y2={padding.top + chartH}
                stroke="#484f58"
                strokeWidth="1.5"
              />
              <line
                x1={padding.left}
                y1={padding.top}
                x2={padding.left}
                y2={padding.top + chartH}
                stroke="#484f58"
                strokeWidth="1.5"
              />

              {/* H-Q Curve */}
              <path
                d={headPath}
                fill="none"
                stroke="#3fb950"
                strokeWidth="3"
              />

              {/* BEP Operating Marker */}
              {inputs.bepFlowM3h > 0 && (
                <circle
                  cx={scaleX(inputs.bepFlowM3h)}
                  cy={scaleY_Head(inputs.ratedHeadM)}
                  r="4"
                  fill="#f27d26"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              )}

              {/* Duty Operating Point */}
              <circle
                cx={scaleX(inputs.flowRateM3h)}
                cy={scaleY_Head(outputs.operatingHeadM)}
                r="6"
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth="2"
              />

              {/* Annotations */}
              <text
                x={scaleX(inputs.flowRateM3h) + 10}
                y={scaleY_Head(outputs.operatingHeadM) - 8}
                fill="#38bdf8"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                Duty: {formatNum(flowConv.val, 0)} {flowConv.unit} @ {formatNum(headConv.val, 1)} {headConv.unit}
              </text>

              <text
                x={padding.left + chartW / 2}
                y={svgHeight - 8}
                fill="#8b949e"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
              >
                Flow Q ({unitSystem === 'US' ? 'GPM' : 'm³/h'})
              </text>
              <text
                x={-padding.top - chartH / 2}
                y={15}
                transform="rotate(-90)"
                fill="#8b949e"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
              >
                Total Dynamic Head TDH ({unitSystem === 'US' ? 'ft' : 'm'})
              </text>
            </svg>
          </div>
        </div>
      )}

      {/* System vs Pump Cross-Plot Overlay View (Recommendation #4) */}
      {activeTab === 'system_crossplot' && (() => {
        const bepQ = inputs.bepFlowM3h || 100;
        const ratedH = inputs.ratedHeadM || 45;
        const frictionAtBEP = Math.max(2, ratedH - staticDischargeHeadM);
        const kSystem = (frictionAtBEP / Math.pow(bepQ, 2)) * throttleFactor;

        const systemCurvePoints: { q: number; hSys: number; hPump: number }[] = [];
        const stepQ = maxFlow / 30;
        for (let q = 0; q <= maxFlow; q += stepQ) {
          const hSys = staticDischargeHeadM + kSystem * Math.pow(q, 2);
          const shutoff = inputs.shutoffHeadM || ratedH * 1.2;
          const hPump = Math.max(0, shutoff - ((shutoff - ratedH) / Math.pow(bepQ, 2)) * Math.pow(q, 2));
          systemCurvePoints.push({ q, hSys, hPump });
        }

        const systemCurvePath = systemCurvePoints
          .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(pt.q).toFixed(1)} ${scaleY_Head(Math.min(maxHeadVal * 1.05, pt.hSys)).toFixed(1)}`)
          .join(' ');

        const shutoff = inputs.shutoffHeadM || ratedH * 1.2;
        const aPump = (shutoff - ratedH) / Math.pow(bepQ, 2);
        const qIntersect = Math.sqrt(Math.max(0, (shutoff - staticDischargeHeadM) / (aPump + kSystem)));
        const hIntersect = staticDischargeHeadM + kSystem * Math.pow(qIntersect, 2);

        const convQInt = convertFlow(qIntersect, unitSystem);
        const convHInt = convertHead(hIntersect, unitSystem);

        return (
          <div className="flex flex-col gap-3">
            {/* Interactive System Parameters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 rounded bg-[#0d1117] border border-[#30363d]">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-[#c9d1d9] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    Static Head / Elevation Lift (H_stat):
                  </span>
                  <span className="text-amber-400 font-bold">{staticDischargeHeadM.toFixed(1)} m</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.min(maxHeadVal * 0.8, 50)}
                  step={1}
                  value={staticDischargeHeadM}
                  onChange={(e) => setStaticDischargeHeadM(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#161b22] rounded accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-[#8b949e]">
                  <span>0m (Level Vessel)</span>
                  <span>Discharge Elevation Tank Lift</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-[#c9d1d9] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#f43f5e]"></span>
                    Discharge Control Valve Throttling:
                  </span>
                  <span className="text-[#f43f5e] font-bold">{(throttleFactor * 100).toFixed(0)}% Friction</span>
                </div>
                <input
                  type="range"
                  min={0.3}
                  max={2.5}
                  step={0.05}
                  value={throttleFactor}
                  onChange={(e) => setThrottleFactor(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#161b22] rounded accent-rose-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-[#8b949e]">
                  <span>Wide Open (Low Resistance)</span>
                  <span>Pinch / Throttle</span>
                </div>
              </div>
            </div>

            {/* SVG Chart Overlay */}
            <div className="relative w-full bg-[#0d1117] rounded-sm overflow-hidden border border-[#30363d]">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto block">
                {/* Preferred Operating Region (POR: 80% to 110% BEP) */}
                <rect
                  x={scaleX(bepQ * 0.8)}
                  y={padding.top}
                  width={scaleX(bepQ * 1.1) - scaleX(bepQ * 0.8)}
                  height={chartH}
                  fill="#10b981"
                  fillOpacity="0.08"
                />
                {/* Allowed Operating Region (AOR: 70% to 120% BEP) */}
                <rect
                  x={scaleX(bepQ * 0.7)}
                  y={padding.top}
                  width={scaleX(bepQ * 1.2) - scaleX(bepQ * 0.7)}
                  height={chartH}
                  fill="#38bdf8"
                  fillOpacity="0.04"
                />

                {/* Grid Lines */}
                {[0.25, 0.5, 0.75, 1.0].map((frac) => (
                  <g key={`cross-grid-${frac}`}>
                    <line
                      x1={padding.left}
                      y1={padding.top + chartH * (1 - frac)}
                      x2={padding.left + chartW}
                      y2={padding.top + chartH * (1 - frac)}
                      stroke="#21262d"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padding.left - 8}
                      y={padding.top + chartH * (1 - frac) + 4}
                      fill="#6e7681"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {(maxHeadVal * frac * (unitSystem === 'US' ? 3.28084 : 1)).toFixed(0)}
                    </text>
                    <line
                      x1={padding.left + chartW * frac}
                      y1={padding.top}
                      x2={padding.left + chartW * frac}
                      y2={padding.top + chartH}
                      stroke="#21262d"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padding.left + chartW * frac}
                      y={padding.top + chartH + 18}
                      fill="#6e7681"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {(maxFlow * frac * (unitSystem === 'US' ? 4.40287 : 1)).toFixed(0)}
                    </text>
                  </g>
                ))}

                {/* BEP Vertical Marker Line */}
                <line
                  x1={scaleX(bepQ)}
                  y1={padding.top}
                  x2={scaleX(bepQ)}
                  y2={padding.top + chartH}
                  stroke="#3fb950"
                  strokeDasharray="2 2"
                  strokeWidth="1.2"
                />
                <text
                  x={scaleX(bepQ) + 3}
                  y={padding.top + 12}
                  fill="#3fb950"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  BEP (Best Efficiency)
                </text>

                {/* Pump H-Q Curve (Green) */}
                <path
                  d={headPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* System Resistance Curve (Amber/Red) */}
                <path
                  d={systemCurvePath}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                  strokeLinecap="round"
                />

                {/* Dynamic Operating Intersection Point */}
                {qIntersect <= maxFlow && hIntersect <= maxHeadVal && (
                  <g>
                    <line
                      x1={scaleX(qIntersect)}
                      y1={padding.top}
                      x2={scaleX(qIntersect)}
                      y2={padding.top + chartH}
                      stroke="#f43f5e"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <line
                      x1={padding.left}
                      y1={scaleY_Head(hIntersect)}
                      x2={padding.left + chartW}
                      y2={scaleY_Head(hIntersect)}
                      stroke="#f43f5e"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <circle
                      cx={scaleX(qIntersect)}
                      cy={scaleY_Head(hIntersect)}
                      r="6"
                      fill="#f43f5e"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={scaleX(qIntersect) + 8}
                      y={scaleY_Head(hIntersect) - 8}
                      fill="#ffffff"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      Operating Duty Point ({convQInt.val.toFixed(0)} {convQInt.unit}, {convHInt.val.toFixed(0)} {convHInt.unit})
                    </text>
                  </g>
                )}

                {/* Axis Titles */}
                <text
                  x={padding.left + chartW / 2}
                  y={padding.top + chartH + 34}
                  fill="#8b949e"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  Flow Rate Q ({unitSystem === 'US' ? 'GPM' : 'm³/h'})
                </text>
                <text
                  x={-padding.top - chartH / 2}
                  y={15}
                  transform="rotate(-90)"
                  fill="#8b949e"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  Total Dynamic Head TDH ({unitSystem === 'US' ? 'ft' : 'm'})
                </text>
              </svg>
            </div>

            {/* Cross-Plot Engineering Metrics Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-[#0d1117] border border-[#30363d]">
                <div className="text-[10px] text-[#8b949e]">System Intersection Flow</div>
                <div className="text-white font-bold text-sm mt-0.5">{convQInt.val.toFixed(1)} {convQInt.unit}</div>
                <div className="text-[9px] text-[#8b949e]">{(qIntersect / bepQ * 100).toFixed(0)}% of BEP flow</div>
              </div>
              <div className="p-2 rounded bg-[#0d1117] border border-[#30363d]">
                <div className="text-[10px] text-[#8b949e]">System Intersection Head</div>
                <div className="text-amber-400 font-bold text-sm mt-0.5">{convHInt.val.toFixed(1)} {convHInt.unit}</div>
                <div className="text-[9px] text-[#8b949e]">Static Lift: {staticDischargeHeadM.toFixed(1)} m</div>
              </div>
              <div className="p-2 rounded bg-[#0d1117] border border-[#30363d]">
                <div className="text-[10px] text-[#8b949e]">Hydraulic Power</div>
                <div className="text-cyan-400 font-bold text-sm mt-0.5">
                  {((9.81 * (inputs.customDensityKgM3 || 1000) * (qIntersect / 3600) * hIntersect) / 1000).toFixed(1)} kW
                </div>
                <div className="text-[9px] text-[#8b949e]">P_hyd = ρ·g·Q·H</div>
              </div>
              <div className="p-2 rounded bg-[#0d1117] border border-[#30363d]">
                <div className="text-[10px] text-[#8b949e]">Operating Zone Status</div>
                <div className={`font-bold text-sm mt-0.5 ${
                  qIntersect >= bepQ * 0.8 && qIntersect <= bepQ * 1.1
                    ? 'text-emerald-400'
                    : qIntersect >= bepQ * 0.7 && qIntersect <= bepQ * 1.2
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}>
                  {qIntersect >= bepQ * 0.8 && qIntersect <= bepQ * 1.1
                    ? 'Preferred (POR)'
                    : qIntersect >= bepQ * 0.7 && qIntersect <= bepQ * 1.2
                    ? 'Allowed (AOR)'
                    : 'Recirc / Runout Risk'}
                </div>
                <div className="text-[9px] text-[#8b949e]">Ref: Hydraulic Inst. HI 9.6.1</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 3. NPSHa Component Breakdown View */}
      {activeTab === 'breakdown' && (
        <div className="flex flex-col gap-3">
          <div className="text-[11px] font-mono text-[#8b949e]">
            Pressure & Elevation Head Contributions to NPSHa vs NPSHr & Safety Margin:
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {breakdownItems.map((item, idx) => {
              const conv = convertHead(Math.abs(item.val), unitSystem);
              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-sm bg-[#0d1117] border border-[#30363d] flex flex-col justify-between"
                >
                  <span className="text-[10px] text-[#8b949e] font-mono">{item.label}</span>
                  <span
                    className={`text-sm font-mono font-bold mt-1 ${item.bold ? 'text-white' : ''}`}
                    style={{ color: item.bold ? undefined : item.color }}
                  >
                    {item.val < 0 ? '-' : item.val > 0 && item.label.includes('Z') ? '+' : ''}
                    {formatNum(conv.val, 2)} {conv.unit}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Graphical Head Budget Bar */}
          <div className="flex flex-col gap-1.5 mt-1 bg-[#0d1117] p-3 rounded-sm border border-[#30363d]">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#8b949e]">
              <span>Hydraulic Energy Balance</span>
              <span>
                NPSHa: <strong className="text-[#10b981]">{formatNum(npshaConv.val, 2)} {npshaConv.unit}</strong> | NPSHr: <strong className="text-[#f97316]">{formatNum(npshrConv.val, 2)} {npshrConv.unit}</strong>
              </span>
            </div>

            <div className="w-full h-6 bg-[#161b22] rounded-sm overflow-hidden flex border border-[#30363d]">
              {/* Positive Contributors */}
              <div
                style={{ width: `${Math.min(100, Math.max(5, (outputs.atmosphericHeadM / 15) * 100))}%` }}
                className="bg-[#38bdf8] h-full flex items-center justify-center text-[9px] font-mono text-black font-bold truncate px-1"
                title={`Atmospheric Head: ${outputs.atmosphericHeadM.toFixed(2)}m`}
              >
                P_atm
              </div>
              {outputs.vesselPressureHeadM > 0 && (
                <div
                  style={{ width: `${Math.min(100, (outputs.vesselPressureHeadM / 15) * 100)}%` }}
                  className="bg-[#818cf8] h-full flex items-center justify-center text-[9px] font-mono text-white font-bold truncate px-1"
                  title={`Vessel Head: ${outputs.vesselPressureHeadM.toFixed(2)}m`}
                >
                  P_vessel
                </div>
              )}
              {outputs.staticSuctionHeadM > 0 && (
                <div
                  style={{ width: `${Math.min(100, (outputs.staticSuctionHeadM / 15) * 100)}%` }}
                  className="bg-[#34d399] h-full flex items-center justify-center text-[9px] font-mono text-black font-bold truncate px-1"
                  title={`Static Head: +${outputs.staticSuctionHeadM.toFixed(2)}m`}
                >
                  +Z
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-[#6e7681]">
              <span>Industry Reference Benchmark: API 610 / Hydraulic Institute HI 9.6.1 (Nominative Citation)</span>
              <span>Safety Margin: {formatNum(reqMarginConv.val, 2)} {reqMarginConv.unit} ({inputs.safetyMarginType})</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
