import React, { useState } from 'react';
import { RotorInputs, RotorOutputs } from '../../types/rotor';
import { UnitSystem } from '../../types/common';
import { formatNum, convertVibrationVelocity, convertVibrationDisp } from '../../utils/units';
import { Activity, Gauge as GaugeIcon, AlertTriangle, ShieldCheck, Layers, BarChart3, HelpCircle } from 'lucide-react';

interface RotorChartsProps {
  inputs: RotorInputs;
  outputs: RotorOutputs;
  unitSystem: UnitSystem;
}

export const RotorCharts: React.FC<RotorChartsProps> = ({
  inputs,
  outputs,
  unitSystem,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'vibration_rpm' | 'iso_severity' | 'bearing_life' | 'unbalance_limit'>('vibration_rpm');
  const [hoveredRpm, setHoveredRpm] = useState<number | null>(null);

  // Generate Frequency Response Curve Data (Vibration vs RPM)
  // Sweep from 0 to 2.2 * criticalSpeed or at least 1.5 * operatingRpm
  const maxSweepRpm = Math.max(outputs.criticalSpeedRpm * 2.2, inputs.operatingRpm * 1.5, 5000);
  const minSweepRpm = 100;
  const numPoints = 80;
  const stepRpm = (maxSweepRpm - minSweepRpm) / numPoints;

  const stiffnessNm = outputs.stiffnessNm;
  const rotorMass = Math.max(1, inputs.rotorMassKg);
  const dampingC = outputs.dampingC;
  const unbalanceKgM = outputs.actualUnbalanceKgM;

  const curvePoints: Array<{ rpm: number; velRmsMmS: number; dispPkPkMicrons: number }> = [];
  let maxVelOnCurve = 0;

  for (let i = 0; i <= numPoints; i++) {
    const rpm = minSweepRpm + i * stepRpm;
    const w = (2 * Math.PI * rpm) / 60;
    const f_unbal = unbalanceKgM * Math.pow(w, 2);
    const denom = Math.sqrt(
      Math.pow(stiffnessNm - rotorMass * Math.pow(w, 2), 2) +
      Math.pow(dampingC * w, 2)
    );
    const x_pk = denom > 0 ? f_unbal / denom : 0;
    const v_pk = x_pk * w * 1000;
    const v_rms = v_pk / Math.SQRT2;
    const disp_pkpk = x_pk * 2 * 1e6;

    if (v_rms > maxVelOnCurve) maxVelOnCurve = v_rms;
    curvePoints.push({ rpm, velRmsMmS: v_rms, dispPkPkMicrons: disp_pkpk });
  }

  // Ensure reasonable vertical scale
  const yMax = Math.max(maxVelOnCurve * 1.25, outputs.iso10816Limits.zoneCLimit * 1.5, 10);

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 260;
  const padding = { top: 25, right: 30, bottom: 45, left: 55 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const mapX = (rpm: number) => padding.left + ((rpm - minSweepRpm) / (maxSweepRpm - minSweepRpm)) * plotWidth;
  const mapY = (vel: number) => padding.top + plotHeight - (Math.min(vel, yMax) / yMax) * plotHeight;

  // Path data for response curve
  const pathD = curvePoints.reduce((acc, pt, idx) => {
    const x = mapX(pt.rpm);
    const y = mapY(pt.velRmsMmS);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Resonance Band (±15% of critical speed)
  const critLowX = mapX(outputs.criticalSpeedRpm * 0.85);
  const critHighX = mapX(outputs.criticalSpeedRpm * 1.15);
  const critX = mapX(outputs.criticalSpeedRpm);
  const opX = mapX(inputs.operatingRpm);
  const opY = mapY(outputs.vibrationVelocityRmsMmS);

  // ISO Zone boundaries on chart
  const zoneAY = mapY(outputs.iso10816Limits.zoneALimit);
  const zoneBY = mapY(outputs.iso10816Limits.zoneBLimit);
  const zoneCY = mapY(outputs.iso10816Limits.zoneCLimit);

  return (
    <div className="flex flex-col gap-3 rounded-sm bg-[#161b22] border border-[#30363d] p-3 sm:p-4 shadow-md">
      {/* Chart Navigation Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#30363d] pb-2.5">
        <div className="flex items-center gap-1 bg-[#0d1117] p-0.5 rounded-sm border border-[#30363d]">
          <button
            onClick={() => setActiveChartTab('vibration_rpm')}
            className={`px-2.5 py-1 text-xs font-mono rounded-sm transition-all flex items-center gap-1.5 ${
              activeChartTab === 'vibration_rpm'
                ? 'bg-[#f27d26] text-white font-bold'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <Activity size={13} />
            <span>Vibration vs RPM Curve</span>
          </button>

          <button
            onClick={() => setActiveChartTab('iso_severity')}
            className={`px-2.5 py-1 text-xs font-mono rounded-sm transition-all flex items-center gap-1.5 ${
              activeChartTab === 'iso_severity'
                ? 'bg-[#f27d26] text-white font-bold'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <Layers size={13} />
            <span>ISO 10816 Severity Zones</span>
          </button>

          <button
            onClick={() => setActiveChartTab('bearing_life')}
            className={`px-2.5 py-1 text-xs font-mono rounded-sm transition-all flex items-center gap-1.5 ${
              activeChartTab === 'bearing_life'
                ? 'bg-[#f27d26] text-white font-bold'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <GaugeIcon size={13} />
            <span>ISO 281 Bearing Life</span>
          </button>

          <button
            onClick={() => setActiveChartTab('unbalance_limit')}
            className={`px-2.5 py-1 text-xs font-mono rounded-sm transition-all flex items-center gap-1.5 ${
              activeChartTab === 'unbalance_limit'
                ? 'bg-[#f27d26] text-white font-bold'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <BarChart3 size={13} />
            <span>ISO 1940 Unbalance</span>
          </button>
        </div>

        {/* Legend Tag */}
        <div className="text-[11px] font-mono text-[#8b949e] hidden sm:block">
          {activeChartTab === 'vibration_rpm' && (
            <span className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 bg-amber-500/30 border border-amber-500 rounded-xs"></span>
              Resonance Band (±15%)
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#f27d26]"></span>
              Operating Speed ({inputs.operatingRpm} RPM)
            </span>
          )}
        </div>
      </div>

      {/* VIEW 1: Vibration Response vs RPM Curve with Critical Speed */}
      {activeChartTab === 'vibration_rpm' && (
        <div className="flex flex-col gap-2">
          <div className="relative w-full aspect-[2/1] sm:aspect-[2.4/1] max-h-[300px] bg-[#0d1117] rounded-sm p-1 border border-[#30363d]">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-full block select-none"
            >
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((frac) => {
                const y = padding.top + plotHeight * (1 - frac);
                const val = (yMax * frac).toFixed(1);
                return (
                  <g key={frac}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={svgWidth - padding.right}
                      y2={y}
                      stroke="#21262d"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 3}
                      textAnchor="end"
                      fill="#8b949e"
                      fontSize={10}
                      fontFamily="monospace"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* ISO 10816 Zone Color Background Overlays */}
              {zoneAY >= padding.top && (
                <rect
                  x={padding.left}
                  y={zoneAY}
                  width={plotWidth}
                  height={padding.top + plotHeight - zoneAY}
                  fill="#23863610"
                />
              )}
              {zoneBY >= padding.top && zoneAY >= padding.top && (
                <rect
                  x={padding.left}
                  y={zoneBY}
                  width={plotWidth}
                  height={zoneAY - zoneBY}
                  fill="#38bdf810"
                />
              )}
              {zoneCY >= padding.top && zoneBY >= padding.top && (
                <rect
                  x={padding.left}
                  y={zoneCY}
                  width={plotWidth}
                  height={zoneBY - zoneCY}
                  fill="#d2992215"
                />
              )}
              {zoneCY >= padding.top && (
                <rect
                  x={padding.left}
                  y={padding.top}
                  width={plotWidth}
                  height={zoneCY - padding.top}
                  fill="#f8514915"
                />
              )}

              {/* ISO Zone Limit Lines */}
              {[
                { y: zoneAY, label: `Zone A/B (${outputs.iso10816Limits.zoneALimit})`, color: '#238636' },
                { y: zoneBY, label: `Zone B/C (${outputs.iso10816Limits.zoneBLimit})`, color: '#d29922' },
                { y: zoneCY, label: `Zone C/D (${outputs.iso10816Limits.zoneCLimit})`, color: '#f85149' },
              ].map((z, idx) => (
                <g key={idx}>
                  <line
                    x1={padding.left}
                    y1={z.y}
                    x2={svgWidth - padding.right}
                    y2={z.y}
                    stroke={z.color}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                  <text
                    x={svgWidth - padding.right - 4}
                    y={z.y - 3}
                    textAnchor="end"
                    fill={z.color}
                    fontSize={8.5}
                    fontFamily="monospace"
                  >
                    {z.label}
                  </text>
                </g>
              ))}

              {/* Critical Speed Resonance Zone Shading (±15%) */}
              {critLowX < svgWidth - padding.right && critHighX > padding.left && (
                <g>
                  <rect
                    x={Math.max(padding.left, critLowX)}
                    y={padding.top}
                    width={Math.min(svgWidth - padding.right, critHighX) - Math.max(padding.left, critLowX)}
                    height={plotHeight}
                    fill="#d2992218"
                    stroke="#d2992244"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                  />
                  <line
                    x1={critX}
                    y1={padding.top}
                    x2={critX}
                    y2={padding.top + plotHeight}
                    stroke="#d29922"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                  />
                  <text
                    x={critX}
                    y={padding.top + 12}
                    textAnchor="middle"
                    fill="#d29922"
                    fontSize={9}
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    N_crit: {outputs.criticalSpeedRpm.toFixed(0)} RPM
                  </text>
                </g>
              )}

              {/* Dynamic Response Curve */}
              <path
                d={pathD}
                fill="none"
                stroke="#38bdf8"
                strokeWidth={2.5}
                strokeLinecap="round"
              />

              {/* Operating RPM Vertical Guide & Duty Point Marker */}
              <line
                x1={opX}
                y1={padding.top}
                x2={opX}
                y2={padding.top + plotHeight}
                stroke="#f27d26"
                strokeWidth={1.5}
                strokeDasharray="2 2"
              />
              <circle
                cx={opX}
                cy={opY}
                r={6}
                fill="#f27d26"
                stroke="#ffffff"
                strokeWidth={2}
              />

              {/* Duty Point Label */}
              <g transform={`translate(${opX > svgWidth - 140 ? opX - 110 : opX + 10}, ${Math.max(padding.top + 20, Math.min(plotHeight + padding.top - 30, opY - 10))})`}>
                <rect
                  x={0}
                  y={0}
                  width={100}
                  height={28}
                  rx={3}
                  fill="#0d1117ee"
                  stroke="#f27d26"
                  strokeWidth={1}
                />
                <text
                  x={6}
                  y={12}
                  fill="#f27d26"
                  fontSize={9}
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {inputs.operatingRpm} RPM
                </text>
                <text
                  x={6}
                  y={22}
                  fill="#e6edf3"
                  fontSize={8.5}
                  fontFamily="monospace"
                >
                  {outputs.vibrationVelocityRmsMmS.toFixed(2)} mm/s RMS
                </text>
              </g>

              {/* X Axis Ticks */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((frac) => {
                const rpm = Math.round(minSweepRpm + frac * (maxSweepRpm - minSweepRpm));
                const x = padding.left + frac * plotWidth;
                return (
                  <g key={frac}>
                    <line
                      x1={x}
                      y1={padding.top + plotHeight}
                      x2={x}
                      y2={padding.top + plotHeight + 5}
                      stroke="#8b949e"
                      strokeWidth={1}
                    />
                    <text
                      x={x}
                      y={padding.top + plotHeight + 18}
                      textAnchor="middle"
                      fill="#8b949e"
                      fontSize={9.5}
                      fontFamily="monospace"
                    >
                      {rpm}
                    </text>
                  </g>
                );
              })}

              {/* Axis Titles */}
              <text
                x={svgWidth / 2}
                y={svgHeight - 6}
                textAnchor="middle"
                fill="#8b949e"
                fontSize={10.5}
                fontFamily="monospace"
              >
                Rotor Rotational Speed (RPM)
              </text>
              <text
                x={-svgHeight / 2}
                y={15}
                transform="rotate(-90)"
                textAnchor="middle"
                fill="#8b949e"
                fontSize={10}
                fontFamily="monospace"
              >
                Vibration Velocity (mm/s RMS)
              </text>
            </svg>
          </div>

          {/* Quick Diagnostics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2 rounded bg-[#0d1117] border border-[#30363d]">
              <span className="text-[10px] text-[#8b949e]">Critical Speed (N_crit)</span>
              <div className="font-bold text-[#d29922]">{outputs.criticalSpeedRpm.toFixed(0)} RPM</div>
            </div>
            <div className="p-2 rounded bg-[#0d1117] border border-[#30363d]">
              <span className="text-[10px] text-[#8b949e]">Speed Ratio (λ = N/N_crit)</span>
              <div className={`font-bold ${outputs.isNearCriticalSpeed ? 'text-red-400' : 'text-[#38bdf8]'}`}>
                {outputs.speedRatioLambda.toFixed(2)}x ({outputs.criticalSpeedZone})
              </div>
            </div>
            <div className="p-2 rounded bg-[#0d1117] border border-[#30363d]">
              <span className="text-[10px] text-[#8b949e]">Vibration Displacement</span>
              <div className="font-bold text-[#3fb950]">{outputs.vibrationDisplacementPkPkMicrons.toFixed(1)} µm pk-pk</div>
            </div>
            <div className="p-2 rounded bg-[#0d1117] border border-[#30363d]">
              <span className="text-[10px] text-[#8b949e]">Vibration Velocity RMS</span>
              <div className={`font-bold ${outputs.iso10816Zone === 'D' ? 'text-red-400' : outputs.iso10816Zone === 'C' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {outputs.vibrationVelocityRmsMmS.toFixed(2)} mm/s (Zone {outputs.iso10816Zone})
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: ISO 10816 / ISO 20816 Vibration Severity Zones Bar */}
      {activeChartTab === 'iso_severity' && (
        <div className="flex flex-col gap-3">
          <div className="p-3 bg-[#0d1117] rounded-sm border border-[#30363d] flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs font-mono text-[#8b949e]">
              <span>ISO 10816-3 Severity Thresholds for {inputs.machineClass.replace('_', ' ')}</span>
              <span className="text-white font-bold">Current: {outputs.vibrationVelocityRmsMmS.toFixed(2)} mm/s RMS (Zone {outputs.iso10816Zone})</span>
            </div>

            {/* Visual Zone Bar */}
            <div className="relative h-10 w-full rounded flex overflow-hidden border border-[#30363d]">
              <div className="flex-1 bg-emerald-950/70 border-r border-emerald-700/60 flex items-center justify-center text-xs font-bold font-mono text-emerald-400">
                Zone A (&lt; {outputs.iso10816Limits.zoneALimit})
              </div>
              <div className="flex-1 bg-sky-950/70 border-r border-sky-700/60 flex items-center justify-center text-xs font-bold font-mono text-sky-400">
                Zone B ({outputs.iso10816Limits.zoneALimit} - {outputs.iso10816Limits.zoneBLimit})
              </div>
              <div className="flex-1 bg-amber-950/70 border-r border-amber-700/60 flex items-center justify-center text-xs font-bold font-mono text-amber-400">
                Zone C ({outputs.iso10816Limits.zoneBLimit} - {outputs.iso10816Limits.zoneCLimit})
              </div>
              <div className="flex-1 bg-red-950/70 flex items-center justify-center text-xs font-bold font-mono text-red-400">
                Zone D (&gt; {outputs.iso10816Limits.zoneCLimit})
              </div>

              {/* Marker for current velocity */}
              {(() => {
                const zC = outputs.iso10816Limits.zoneCLimit;
                const pct = Math.min(96, Math.max(4, (outputs.vibrationVelocityRmsMmS / (zC * 1.5)) * 100));
                return (
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_#ffffff] z-10 transition-all"
                    style={{ left: `${pct}%` }}
                  >
                    <div className="absolute -top-2 -left-1.5 w-4 h-4 rounded-full bg-[#f27d26] border-2 border-white flex items-center justify-center text-[8px] font-bold text-white">
                      ▲
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Zone Descriptions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className={`p-2.5 rounded border ${outputs.iso10816Zone === 'A' ? 'bg-emerald-950/30 border-emerald-500' : 'bg-[#161b22] border-[#30363d]'}`}>
                <div className="font-bold text-emerald-400 font-mono">Zone A: Good / Newly Commissioned</div>
                <div className="text-[11px] text-[#8b949e]">Vibration of newly commissioned machines typically falls within this zone. Unrestricted operation.</div>
              </div>
              <div className={`p-2.5 rounded border ${outputs.iso10816Zone === 'B' ? 'bg-sky-950/30 border-sky-500' : 'bg-[#161b22] border-[#30363d]'}`}>
                <div className="font-bold text-sky-400 font-mono">Zone B: Acceptable for Long-term Operation</div>
                <div className="text-[11px] text-[#8b949e]">Acceptable for unrestricted long-term operation without significant risk of damage.</div>
              </div>
              <div className={`p-2.5 rounded border ${outputs.iso10816Zone === 'C' ? 'bg-amber-950/30 border-amber-500' : 'bg-[#161b22] border-[#30363d]'}`}>
                <div className="font-bold text-amber-400 font-mono">Zone C: Unsatisfactory / Restricted Operation</div>
                <div className="text-[11px] text-[#8b949e]">Machine is unsatisfactory for continuous operation. Remedial balancing action recommended.</div>
              </div>
              <div className={`p-2.5 rounded border ${outputs.iso10816Zone === 'D' ? 'bg-red-950/30 border-red-500' : 'bg-[#161b22] border-[#30363d]'}`}>
                <div className="font-bold text-red-400 font-mono">Zone D: Danger / Trip & Shutdown</div>
                <div className="text-[11px] text-[#8b949e]">Vibration severity is sufficient to cause imminent damage. Immediate trip/shutdown required.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: ISO 281 Rolling Bearing Life Breakdown */}
      {activeChartTab === 'bearing_life' && (
        <div className="flex flex-col gap-3">
          <div className="p-3 bg-[#0d1117] rounded-sm border border-[#30363d] flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#8b949e]">ISO 281 Rating Life Comparison & Modification Factors</span>
              <span className={`font-bold ${outputs.bearingLifeStatus === 'critical' ? 'text-red-400' : outputs.bearingLifeStatus === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {outputs.bearingLifeStatus.toUpperCase()} ({Math.round(outputs.modifiedLifeL10mhHours).toLocaleString()} hrs)
              </span>
            </div>

            {/* Life Comparison Bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[#8b949e]">Basic Rating Life L10h (No Factors):</span>
                  <span className="font-bold text-white">{Math.round(outputs.basicLifeL10hHours).toLocaleString()} hrs ({(outputs.basicLifeL10hHours / 8760).toFixed(1)} yrs)</span>
                </div>
                <div className="h-4 bg-[#161b22] rounded overflow-hidden border border-[#30363d]">
                  <div
                    className="h-full bg-sky-500 transition-all"
                    style={{ width: `${Math.min(100, (outputs.basicLifeL10hHours / 50000) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[#8b949e]">Modified Rating Life L10mh (a_mod = {outputs.combinedLifeFactorAmod.toFixed(3)}):</span>
                  <span className={`font-bold ${outputs.modifiedLifeL10mhHours < 8000 ? 'text-red-400' : outputs.modifiedLifeL10mhHours < 25000 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {Math.round(outputs.modifiedLifeL10mhHours).toLocaleString()} hrs ({outputs.operatingYears24x7.toFixed(1)} yrs)
                  </span>
                </div>
                <div className="h-4 bg-[#161b22] rounded overflow-hidden border border-[#30363d]">
                  <div
                    className={`h-full transition-all ${
                      outputs.modifiedLifeL10mhHours < 8000 ? 'bg-red-500' : outputs.modifiedLifeL10mhHours < 25000 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (outputs.modifiedLifeL10mhHours / 50000) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Life Factors Breakdown Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-2 border-t border-[#30363d]">
              <div className="p-2 rounded bg-[#161b22] border border-[#30363d]">
                <div className="text-[10px] text-[#8b949e]">Reliability a1 ({(((inputs.reliabilityTarget || 0.90)) * 100).toFixed(0)}%)</div>
                <div className="font-bold text-white">{(outputs.reliabilityFactorA1 ?? 1).toFixed(2)}x</div>
              </div>
              <div className="p-2 rounded bg-[#161b22] border border-[#30363d]">
                <div className="text-[10px] text-[#8b949e]">Lubrication a_lube ({inputs.lubricationCondition})</div>
                <div className={`font-bold ${inputs.lubricationCondition === 'poor' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {(outputs.lubricationFactorAlube ?? 1).toFixed(2)}x
                </div>
              </div>
              <div className="p-2 rounded bg-[#161b22] border border-[#30363d]">
                <div className="text-[10px] text-[#8b949e]">Contamination a_contam ({inputs.contaminationLevel})</div>
                <div className={`font-bold ${inputs.contaminationLevel === 'contaminated' ? 'text-red-400' : 'text-sky-400'}`}>
                  {(outputs.contaminationFactorAcontam ?? 1).toFixed(2)}x
                </div>
              </div>
              <div className="p-2 rounded bg-[#161b22] border border-[#30363d]">
                <div className="text-[10px] text-[#8b949e]">C/P Load Ratio (C={formatNum((outputs.bearingDynamicCapacityCrN ?? 0) / 1000, 1)}kN)</div>
                <div className={`font-bold ${(outputs.loadRatioCP ?? 0) < 4 ? 'text-red-400' : 'text-[#f27d26]'}`}>
                  {(outputs.loadRatioCP ?? 0).toFixed(2)}x
                </div>
              </div>
            </div>

            {/* ISO 281 Disclaimer */}
            <div className="p-2 bg-amber-950/20 border border-amber-800/40 rounded text-[11px] text-amber-200/90 font-mono">
              ⚠ <strong>Engineering Notice:</strong> This is an engineering estimate based on ISO 281 rating concepts, not a substitute for OEM manufacturer calculation tools (e.g. SKF Bearing Select, Schaeffler Bearinx).
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: ISO 1940 Unbalance vs Permissible Limit */}
      {activeChartTab === 'unbalance_limit' && (
        <div className="flex flex-col gap-3">
          <div className="p-3 bg-[#0d1117] rounded-sm border border-[#30363d] flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#8b949e]">ISO 1940-1 Unbalance Exceedance & Quality Grade</span>
              <span className={`font-bold ${outputs.isBalanceCompliant ? 'text-emerald-400' : 'text-red-400'}`}>
                {outputs.isBalanceCompliant ? 'WITHIN CRITERIA (≤ 1.0x)' : 'EXCEEDED (> 1.0x)'}
              </span>
            </div>

            {/* Comparative Visual Bar */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[#8b949e]">Actual Residual Unbalance (U_act = m × r):</span>
                  <span className={`font-bold ${outputs.isBalanceCompliant ? 'text-emerald-400' : 'text-red-400'}`}>
                    {outputs.actualUnbalanceGmm.toFixed(1)} g·mm ({outputs.actualEccentricityMicrons.toFixed(2)} µm e_act)
                  </span>
                </div>
                <div className="h-4 bg-[#161b22] rounded overflow-hidden border border-[#30363d]">
                  <div
                    className={`h-full transition-all ${outputs.isBalanceCompliant ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, (outputs.actualUnbalanceGmm / Math.max(outputs.iso1940PermissibleUnbalanceGmm * 2, outputs.actualUnbalanceGmm)) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[#8b949e]">ISO 1940 Permissible Limit (U_per, Grade {inputs.balanceGrade}):</span>
                  <span className="font-bold text-sky-400">
                    {outputs.iso1940PermissibleUnbalanceGmm.toFixed(1)} g·mm ({outputs.iso1940PermissibleEperMicrons.toFixed(2)} µm e_per)
                  </span>
                </div>
                <div className="h-4 bg-[#161b22] rounded overflow-hidden border border-[#30363d]">
                  <div
                    className="h-full bg-sky-500 transition-all"
                    style={{ width: `${Math.min(100, (outputs.iso1940PermissibleUnbalanceGmm / Math.max(outputs.iso1940PermissibleUnbalanceGmm * 2, outputs.actualUnbalanceGmm)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Units Conversion Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-2 border-t border-[#30363d]">
              <div className="p-2 rounded bg-[#161b22] border border-[#30363d]">
                <div className="text-[10px] text-[#8b949e]">Unbalance in g·mm</div>
                <div className="font-bold text-white">{outputs.actualUnbalanceGmm.toFixed(1)} g·mm</div>
              </div>
              <div className="p-2 rounded bg-[#161b22] border border-[#30363d]">
                <div className="text-[10px] text-[#8b949e]">Unbalance in g·cm</div>
                <div className="font-bold text-white">{outputs.actualUnbalanceGcm.toFixed(2)} g·cm</div>
              </div>
              <div className="p-2 rounded bg-[#161b22] border border-[#30363d]">
                <div className="text-[10px] text-[#8b949e]">Unbalance in kg·m</div>
                <div className="font-bold text-white">{outputs.actualUnbalanceKgM.toExponential(2)} kg·m</div>
              </div>
              <div className="p-2 rounded bg-[#161b22] border border-[#30363d]">
                <div className="text-[10px] text-[#8b949e]">Unbalance in oz·in</div>
                <div className="font-bold text-white">{outputs.actualUnbalanceOzIn.toFixed(2)} oz·in</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
