import React, { useState, useMemo } from 'react';
import { SealInputs, SealOutputs } from '../../types/seal';
import { UnitSystem } from '../../types/common';
import { getFluidProperties } from '../../utils/sealCalculations';
import { convertPressure, formatNum } from '../../utils/units';
import { TrendingUp, Flame, Activity, ShieldCheck, AlertTriangle, Layers } from 'lucide-react';
import { calculateSealFaceTribology } from '../../physics/sealTribologyMath';

interface SealPlanChartsProps {
  inputs: SealInputs;
  outputs: SealOutputs;
  unitSystem: UnitSystem;
}

export const SealPlanCharts: React.FC<SealPlanChartsProps> = ({
  inputs,
  outputs,
  unitSystem,
}) => {
  const [activeTab, setActiveTab] = useState<'orifice' | 'vapor' | 'speed' | 'tribology'>('orifice');
  const [hoveredX, setHoveredX] = useState<number | null>(null);

  const tribology = useMemo(() => {
    return calculateSealFaceTribology({ inputs, outputs });
  }, [inputs, outputs]);

  // SVG Dimension Constants
  const svgWidth = 620;
  const svgHeight = 260;
  const pad = { top: 25, right: 35, bottom: 45, left: 60 };
  const plotW = svgWidth - pad.left - pad.right;
  const plotH = svgHeight - pad.top - pad.bottom;

  // -------------------------------------------------------------
  // 1. Orifice Flow vs Delta P
  // -------------------------------------------------------------
  const Cd = 0.60;
  const d_m = (inputs.flushOrificeDiameterMm || 3.0) / 1000;
  const area_m2 = (Math.PI / 4) * Math.pow(d_m, 2);
  const fluidDensity = inputs.fluidDensityKgM3 || 1000;
  const maxDp = 2500;
  const numSteps = 50;

  const orificeData: Array<{ dp: number; flow: number; req: number }> = [];
  let maxFlow = 0;
  for (let i = 0; i <= numSteps; i++) {
    const dp = (i / numSteps) * maxDp;
    const v = Math.sqrt((2 * Math.max(0, dp) * 1000) / fluidDensity);
    const flow = Cd * area_m2 * v * 60000;
    if (flow > maxFlow) maxFlow = flow;
    orificeData.push({ dp, flow, req: outputs.requiredFlushFlowLpm });
  }
  const flowScaleMax = Math.max(15, Math.ceil(maxFlow * 1.15));

  // Current operating point
  const currentDeltaP = Math.max(0, inputs.pumpDischargePressureKPag - inputs.sealChamberPressureKPag);
  const currentOrificeFlow = outputs.actualOrificeFlowLpm;

  // -------------------------------------------------------------
  // 2. Vapor Pressure Margin vs Chamber Temp
  // -------------------------------------------------------------
  const chamberAbsP = inputs.sealChamberPressureKPag + 101.325;
  const minTemp = 20;
  const maxTemp = 220;
  const vaporData: Array<{ temp: number; pVap: number; margin: number }> = [];
  let maxPvap = 0;

  for (let i = 0; i <= numSteps; i++) {
    const t = minTemp + (i / numSteps) * (maxTemp - minTemp);
    const p = getFluidProperties(inputs.processFluidType, t).pVapKPa;
    const m = chamberAbsP - p;
    if (p > maxPvap) maxPvap = p;
    vaporData.push({ temp: t, pVap: p, margin: m });
  }
  const pScaleMax = Math.max(1000, Math.ceil(Math.max(chamberAbsP * 1.1, maxPvap * 1.1)));

  // -------------------------------------------------------------
  // 3. Face Heat Gen & Velocity vs RPM
  // -------------------------------------------------------------
  const minRpm = 900;
  const maxRpm = 3600;
  const d_m_val = inputs.sealSizeMm / 1000;
  const faceArea_m2_val = Math.PI * d_m_val * 0.0035;
  const netP_MPa = outputs.netFaceClosingPressureKPa / 1000;
  const fc = inputs.faceFrictionCoeff || 0.06;

  const speedData: Array<{ rpm: number; vel: number; qKW: number; pv: number }> = [];
  let maxQ = 0;
  for (let i = 0; i <= numSteps; i++) {
    const rpm = minRpm + (i / numSteps) * (maxRpm - minRpm);
    const vel = (Math.PI * d_m_val * rpm) / 60;
    const qFaceKW = (fc * (netP_MPa * 1e6) * faceArea_m2_val * vel) / 1000;
    const pv = netP_MPa * vel;
    if (qFaceKW > maxQ) maxQ = qFaceKW;
    speedData.push({ rpm, vel, qKW: qFaceKW, pv });
  }
  const qScaleMax = Math.max(4, Math.ceil(maxQ * 1.2));

  return (
    <div className="flex flex-col gap-3 rounded-sm bg-[#161b22] border border-[#30363d] p-3 sm:p-4 shadow-md">
      {/* Header & Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#f27d26]" />
            Hydraulic & Tribological Characteristic Curves
          </span>
        </div>

        <div className="flex items-center gap-1 bg-[#0d1117] p-1 rounded-sm border border-[#30363d] text-xs font-mono">
          <button
            onClick={() => setActiveTab('orifice')}
            className={`px-2.5 py-1 rounded-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'orifice'
                ? 'bg-[#f27d26] text-black font-bold'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Orifice ΔP vs Flow
          </button>
          <button
            onClick={() => setActiveTab('vapor')}
            className={`px-2.5 py-1 rounded-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'vapor'
                ? 'bg-[#f27d26] text-black font-bold'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Vapor Pressure Margin
          </button>
          <button
            onClick={() => setActiveTab('speed')}
            className={`px-2.5 py-1 rounded-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'speed'
                ? 'bg-[#f27d26] text-black font-bold'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Heat Gen vs Speed
          </button>
          <button
            onClick={() => setActiveTab('tribology')}
            className={`px-2.5 py-1 rounded-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'tribology'
                ? 'bg-[#f27d26] text-black font-bold'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Sub-Micron Tribology
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="w-full bg-[#0d1117] rounded-sm border border-[#30363d] p-2 relative overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto max-h-[300px]"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="vaporAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          <g stroke="#30363d" strokeWidth="1" strokeDasharray="3 3">
            {[0, 0.25, 0.5, 0.75, 1.0].map((frac, i) => {
              const y = pad.top + plotH * (1 - frac);
              return <line key={`h-${i}`} x1={pad.left} y1={y} x2={pad.left + plotW} y2={y} />;
            })}
            {[0, 0.25, 0.5, 0.75, 1.0].map((frac, i) => {
              const x = pad.left + plotW * frac;
              return <line key={`v-${i}`} x1={x} y1={pad.top} x2={x} y2={pad.top + plotH} />;
            })}
          </g>

          {/* Axes */}
          <line
            x1={pad.left}
            y1={pad.top + plotH}
            x2={pad.left + plotW}
            y2={pad.top + plotH}
            stroke="#64748b"
            strokeWidth="1.5"
          />
          <line
            x1={pad.left}
            y1={pad.top}
            x2={pad.left}
            y2={pad.top + plotH}
            stroke="#64748b"
            strokeWidth="1.5"
          />

          {/* ========================================================= */}
          {/* TAB 1: ORIFICE HYDRAULICS */}
          {/* ========================================================= */}
          {activeTab === 'orifice' && (
            <g id="tab-orifice">
              {/* Shaded Area */}
              <polygon
                points={`
                  ${pad.left},${pad.top + plotH}
                  ${orificeData
                    .map((d) => {
                      const x = pad.left + (d.dp / maxDp) * plotW;
                      const y = pad.top + plotH * (1 - d.flow / flowScaleMax);
                      return `${x},${y}`;
                    })
                    .join(' ')}
                  ${pad.left + plotW},${pad.top + plotH}
                `}
                fill="url(#areaGrad)"
              />

              {/* Orifice Flow Curve */}
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                points={orificeData
                  .map((d) => {
                    const x = pad.left + (d.dp / maxDp) * plotW;
                    const y = pad.top + plotH * (1 - d.flow / flowScaleMax);
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* Required Flow Reference Line */}
              {outputs.requiredFlushFlowLpm > 0 && (
                <g>
                  <line
                    x1={pad.left}
                    y1={pad.top + plotH * (1 - outputs.requiredFlushFlowLpm / flowScaleMax)}
                    x2={pad.left + plotW}
                    y2={pad.top + plotH * (1 - outputs.requiredFlushFlowLpm / flowScaleMax)}
                    stroke="#f27d26"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={pad.left + plotW - 6}
                    y={pad.top + plotH * (1 - outputs.requiredFlushFlowLpm / flowScaleMax) - 6}
                    fill="#f27d26"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="end"
                    fontWeight="bold"
                  >
                    Req Flow: {outputs.requiredFlushFlowLpm.toFixed(1)} L/min
                  </text>
                </g>
              )}

              {/* Current Operating Point Marker */}
              {currentDeltaP <= maxDp && (
                <g>
                  <line
                    x1={pad.left + (currentDeltaP / maxDp) * plotW}
                    y1={pad.top}
                    x2={pad.left + (currentDeltaP / maxDp) * plotW}
                    y2={pad.top + plotH}
                    stroke="#fbbf24"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={pad.left + (currentDeltaP / maxDp) * plotW}
                    cy={pad.top + plotH * (1 - currentOrificeFlow / flowScaleMax)}
                    r="5"
                    fill="#fbbf24"
                    stroke="#000"
                    strokeWidth="1.5"
                  />
                  <text
                    x={pad.left + (currentDeltaP / maxDp) * plotW + 8}
                    y={pad.top + plotH * (1 - currentOrificeFlow / flowScaleMax) - 8}
                    fill="#fbbf24"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    Operating: {currentOrificeFlow.toFixed(1)} L/min @ ΔP={currentDeltaP} kPa
                  </text>
                </g>
              )}

              {/* Axis Labels & Ticks */}
              <text x={pad.left + plotW / 2} y={svgHeight - 10} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                Driving Pressure Differential ΔP (kPa)
              </text>
              <text
                x={18}
                y={pad.top + plotH / 2}
                fill="#94a3b8"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
                transform={`rotate(-90, 18, ${pad.top + plotH / 2})`}
              >
                Flush Flow Rate (L/min)
              </text>

              {/* Y Axis Ticks */}
              {[0, 0.5, 1.0].map((frac) => (
                <text
                  key={`yt-${frac}`}
                  x={pad.left - 8}
                  y={pad.top + plotH * (1 - frac) + 4}
                  fill="#8b949e"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {(flowScaleMax * frac).toFixed(0)}
                </text>
              ))}

              {/* X Axis Ticks */}
              {[0, 0.5, 1.0].map((frac) => (
                <text
                  key={`xt-${frac}`}
                  x={pad.left + plotW * frac}
                  y={pad.top + plotH + 16}
                  fill="#8b949e"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {(maxDp * frac).toFixed(0)}
                </text>
              ))}
            </g>
          )}

          {/* ========================================================= */}
          {/* TAB 2: VAPOR MARGIN CURVE */}
          {/* ========================================================= */}
          {activeTab === 'vapor' && (
            <g id="tab-vapor">
              {/* Vapor Pressure Curve */}
              <polyline
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2.5"
                points={vaporData
                  .map((d) => {
                    const x = pad.left + ((d.temp - minTemp) / (maxTemp - minTemp)) * plotW;
                    const y = pad.top + plotH * (1 - d.pVap / pScaleMax);
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* Chamber Absolute Pressure Baseline */}
              <line
                x1={pad.left}
                y1={pad.top + plotH * (1 - chamberAbsP / pScaleMax)}
                x2={pad.left + plotW}
                y2={pad.top + plotH * (1 - chamberAbsP / pScaleMax)}
                stroke="#38bdf8"
                strokeWidth="2"
              />
              <text
                x={pad.left + 10}
                y={pad.top + plotH * (1 - chamberAbsP / pScaleMax) - 6}
                fill="#38bdf8"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
              >
                Chamber Pressure P_box = {chamberAbsP.toFixed(0)} kPa(a)
              </text>

              {/* Operating Chamber Temp Marker */}
              {outputs.sealChamberOperatingTempC >= minTemp && (
                <g>
                  <line
                    x1={pad.left + ((outputs.sealChamberOperatingTempC - minTemp) / (maxTemp - minTemp)) * plotW}
                    y1={pad.top}
                    x2={pad.left + ((outputs.sealChamberOperatingTempC - minTemp) / (maxTemp - minTemp)) * plotW}
                    y2={pad.top + plotH}
                    stroke="#fbbf24"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={pad.left + ((outputs.sealChamberOperatingTempC - minTemp) / (maxTemp - minTemp)) * plotW}
                    cy={pad.top + plotH * (1 - chamberAbsP / pScaleMax)}
                    r="5"
                    fill="#fbbf24"
                    stroke="#000"
                    strokeWidth="1.5"
                  />
                  <text
                    x={pad.left + ((outputs.sealChamberOperatingTempC - minTemp) / (maxTemp - minTemp)) * plotW + 6}
                    y={pad.top + 30}
                    fill="#fbbf24"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    Operating: {outputs.sealChamberOperatingTempC.toFixed(0)}°C (Margin: {outputs.vaporPressureMarginKPa.toFixed(0)} kPa)
                  </text>
                </g>
              )}

              {/* Axis Labels & Ticks */}
              <text x={pad.left + plotW / 2} y={svgHeight - 10} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                Chamber Temperature (°C)
              </text>
              <text
                x={18}
                y={pad.top + plotH / 2}
                fill="#94a3b8"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
                transform={`rotate(-90, 18, ${pad.top + plotH / 2})`}
              >
                Pressure (kPa abs)
              </text>

              {[0, 0.5, 1.0].map((frac) => (
                <text
                  key={`yv-${frac}`}
                  x={pad.left - 8}
                  y={pad.top + plotH * (1 - frac) + 4}
                  fill="#8b949e"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {(pScaleMax * frac).toFixed(0)}
                </text>
              ))}

              {[0, 0.5, 1.0].map((frac) => (
                <text
                  key={`xv-${frac}`}
                  x={pad.left + plotW * frac}
                  y={pad.top + plotH + 16}
                  fill="#8b949e"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {(minTemp + (maxTemp - minTemp) * frac).toFixed(0)}
                </text>
              ))}
            </g>
          )}

          {/* ========================================================= */}
          {/* TAB 3: SPEED VS HEAT GEN */}
          {/* ========================================================= */}
          {activeTab === 'speed' && (
            <g id="tab-speed">
              <polyline
                fill="none"
                stroke="#f27d26"
                strokeWidth="2.5"
                points={speedData
                  .map((d) => {
                    const x = pad.left + ((d.rpm - minRpm) / (maxRpm - minRpm)) * plotW;
                    const y = pad.top + plotH * (1 - d.qKW / qScaleMax);
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* Operating Speed Marker */}
              <g>
                <line
                  x1={pad.left + ((inputs.shaftSpeedRpm - minRpm) / (maxRpm - minRpm)) * plotW}
                  y1={pad.top}
                  x2={pad.left + ((inputs.shaftSpeedRpm - minRpm) / (maxRpm - minRpm)) * plotW}
                  y2={pad.top + plotH}
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={pad.left + ((inputs.shaftSpeedRpm - minRpm) / (maxRpm - minRpm)) * plotW}
                  cy={pad.top + plotH * (1 - outputs.sealFaceHeatGenKW / qScaleMax)}
                  r="5"
                  fill="#fbbf24"
                  stroke="#000"
                  strokeWidth="1.5"
                />
                <text
                  x={pad.left + ((inputs.shaftSpeedRpm - minRpm) / (maxRpm - minRpm)) * plotW + 6}
                  y={pad.top + plotH * (1 - outputs.sealFaceHeatGenKW / qScaleMax) - 6}
                  fill="#fbbf24"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {inputs.shaftSpeedRpm} RPM: {outputs.sealFaceHeatGenKW.toFixed(2)} kW
                </text>
              </g>

              {/* Axis Labels & Ticks */}
              <text x={pad.left + plotW / 2} y={svgHeight - 10} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                Shaft Rotational Speed (RPM)
              </text>
              <text
                x={18}
                y={pad.top + plotH / 2}
                fill="#94a3b8"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
                transform={`rotate(-90, 18, ${pad.top + plotH / 2})`}
              >
                Face Heat Gen Q_face (kW)
              </text>

              {[0, 0.5, 1.0].map((frac) => (
                <text
                  key={`ys-${frac}`}
                  x={pad.left - 8}
                  y={pad.top + plotH * (1 - frac) + 4}
                  fill="#8b949e"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {(qScaleMax * frac).toFixed(1)}
                </text>
              ))}

              {[0, 0.5, 1.0].map((frac) => (
                <text
                  key={`xs-${frac}`}
                  x={pad.left + plotW * frac}
                  y={pad.top + plotH + 16}
                  fill="#8b949e"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {(minRpm + (maxRpm - minRpm) * frac).toFixed(0)}
                </text>
              ))}
            </g>
          )}

          {/* ========================================================= */}
          {/* TAB 4: SUB-MICRON FACE TRIBOLOGY (h(r), P(r) & Psat(T)) */}
          {/* ========================================================= */}
          {activeTab === 'tribology' && (
            <g id="tab-tribology">
              {/* Highlight Phase-Change Boiling Vapor Zone */}
              {tribology.hasVaporFlash && tribology.boilingRadiusNorm !== null && (
                <g>
                  <rect
                    x={pad.left}
                    y={pad.top}
                    width={plotW * tribology.boilingRadiusNorm}
                    height={plotH}
                    fill="url(#vaporAreaGrad)"
                  />
                  <line
                    x1={pad.left + plotW * tribology.boilingRadiusNorm}
                    y1={pad.top}
                    x2={pad.left + plotW * tribology.boilingRadiusNorm}
                    y2={pad.top + plotH}
                    stroke="#f43f5e"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  <text
                    x={pad.left + plotW * tribology.boilingRadiusNorm - 6}
                    y={pad.top + 16}
                    fill="#f43f5e"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="end"
                    fontWeight="bold"
                  >
                    VAPOR FLASH ZONE (Boiling)
                  </text>
                </g>
              )}

              {/* Saturated Vapor Pressure Curve (Dashed Rose) */}
              <polyline
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2"
                strokeDasharray="3 3"
                points={tribology.radialNodes
                  .map((n) => {
                    const x = pad.left + n.radiusNorm * plotW;
                    const maxP = Math.max(...tribology.radialNodes.map((m) => Math.max(m.pressureKPa, m.vaporPressureKPa))) * 1.1;
                    const y = pad.top + plotH * (1 - n.vaporPressureKPa / Math.max(1, maxP));
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* Fluid Film Pressure Curve P(r) (Solid Cyan) */}
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                points={tribology.radialNodes
                  .map((n) => {
                    const x = pad.left + n.radiusNorm * plotW;
                    const maxP = Math.max(...tribology.radialNodes.map((m) => Math.max(m.pressureKPa, m.vaporPressureKPa))) * 1.1;
                    const y = pad.top + plotH * (1 - n.pressureKPa / Math.max(1, maxP));
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* Film Gap Thickness Curve h(r) (Amber) */}
              <polyline
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2"
                points={tribology.radialNodes
                  .map((n) => {
                    const x = pad.left + n.radiusNorm * plotW;
                    const maxH = 4.0; // 4.0 um scale
                    const y = pad.top + plotH * (1 - n.filmThicknessUm / maxH);
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* Coning & Stability Badge */}
              <g>
                <rect
                  x={pad.left + plotW - 190}
                  y={pad.top + 8}
                  width="180"
                  height="46"
                  fill="#0d1117"
                  stroke="#30363d"
                  strokeWidth="1"
                  rx="3"
                />
                <text
                  x={pad.left + plotW - 180}
                  y={pad.top + 22}
                  fill="#fbbf24"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  Coning β: {tribology.coningAngleUrad.toFixed(1)} µrad ({tribology.coningClassification.split('_')[0]})
                </text>
                <text
                  x={pad.left + plotW - 180}
                  y={pad.top + 34}
                  fill="#38bdf8"
                  fontSize="8.5"
                  fontFamily="monospace"
                >
                  h_mean: {tribology.meanFilmThicknessUm.toFixed(2)} µm | k: {(tribology.filmStiffnessNPerUm / 1000).toFixed(1)} kN/µm
                </text>
                <text
                  x={pad.left + plotW - 180}
                  y={pad.top + 46}
                  fill={tribology.hasVaporFlash ? '#f43f5e' : '#34d399'}
                  fontSize="8.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {tribology.hasVaporFlash ? `PUFFING: ${tribology.puffingFrequencyHz} Hz (${tribology.acousticChatterDb.toFixed(0)} dB)` : 'STABLE HYDRODYNAMIC FILM'}
                </text>
              </g>

              {/* Legends */}
              <g transform={`translate(${pad.left + 10}, ${pad.top + 8})`}>
                <line x1="0" y1="6" x2="16" y2="6" stroke="#38bdf8" strokeWidth="2.5" />
                <text x="22" y="9" fill="#38bdf8" fontSize="8.5" fontFamily="monospace">P_film(r)</text>

                <line x1="85" y1="6" x2="101" y2="6" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 2" />
                <text x="107" y="9" fill="#f43f5e" fontSize="8.5" fontFamily="monospace">P_sat(T)</text>

                <line x1="165" y1="6" x2="181" y2="6" stroke="#fbbf24" strokeWidth="2" />
                <text x="187" y="9" fill="#fbbf24" fontSize="8.5" fontFamily="monospace">Film Gap h(r)</text>
              </g>

              {/* Axis Labels */}
              <text x={pad.left + plotW / 2} y={svgHeight - 10} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                Radial Face Contact Width: Inner Diameter (r_i) → Outer Diameter (r_o) [mm]
              </text>
              <text
                x={18}
                y={pad.top + plotH / 2}
                fill="#94a3b8"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
                transform={`rotate(-90, 18, ${pad.top + plotH / 2})`}
              >
                P(r) [kPa abs] & Film Gap h(r) [µm]
              </text>

              {/* X Axis ticks */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((frac) => (
                <text
                  key={`xt-${frac}`}
                  x={pad.left + plotW * frac}
                  y={pad.top + plotH + 16}
                  fill="#8b949e"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {(tribology.innerRadiusMm + (tribology.outerRadiusMm - tribology.innerRadiusMm) * frac).toFixed(1)}
                </text>
              ))}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
