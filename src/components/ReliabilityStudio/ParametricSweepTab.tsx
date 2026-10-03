import React, { useState, useMemo } from 'react';
import { SimulatorId, UnitSystem } from '../../types/common';
import { SWEEP_CONFIGS, runParametricSweep } from '../../utils/reliabilityCalculations';
import { SweepConfig, SweepPoint } from '../../types/reliability';
import { Activity, AlertTriangle, CheckCircle2, ChevronRight, Zap, RefreshCw, BarChart2 } from 'lucide-react';

interface ParametricSweepTabProps {
  simulatorId: SimulatorId;
  inputs: Record<string, any>;
  unitSystem: UnitSystem;
  onInjectInputs: (inputs: Record<string, any>) => void;
}

export const ParametricSweepTab: React.FC<ParametricSweepTabProps> = ({
  simulatorId,
  inputs,
  unitSystem,
  onInjectInputs,
}) => {
  const availableConfigs = SWEEP_CONFIGS[simulatorId] || [];
  const [selectedConfigId, setSelectedConfigId] = useState<string>(
    availableConfigs[0]?.id || ''
  );

  const activeConfig = useMemo(() => {
    return availableConfigs.find((c) => c.id === selectedConfigId) || availableConfigs[0];
  }, [availableConfigs, selectedConfigId]);

  const sweepPoints = useMemo(() => {
    if (!activeConfig) return [];
    return runParametricSweep(activeConfig, inputs, unitSystem);
  }, [activeConfig, inputs, unitSystem]);

  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const activePoint: SweepPoint | null =
    selectedPointIndex !== null && sweepPoints[selectedPointIndex]
      ? sweepPoints[selectedPointIndex]
      : sweepPoints[Math.floor(sweepPoints.length / 2)] || null;

  // Chart scaling
  const chartGeometry = useMemo(() => {
    if (!sweepPoints.length) return null;

    const y1Values = sweepPoints.map((p) => p.yValuePrimary);
    const y2Values = sweepPoints
      .map((p) => p.yValueSecondary)
      .filter((v): v is number => v !== undefined);

    const minY1 = Math.min(...y1Values, activeConfig?.thresholdCritical || 0);
    const maxY1 = Math.max(...y1Values, activeConfig?.thresholdWarning || 1);
    const rangeY1 = maxY1 - minY1 || 1;

    const minY2 = y2Values.length ? Math.min(...y2Values) : 0;
    const maxY2 = y2Values.length ? Math.max(...y2Values) : 1;
    const rangeY2 = maxY2 - minY2 || 1;

    const width = 640;
    const height = 240;
    const padding = { top: 25, right: 55, bottom: 35, left: 55 };
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    const coords = sweepPoints.map((p, idx) => {
      const x = padding.left + (idx / (sweepPoints.length - 1)) * innerW;
      const y1Norm = (p.yValuePrimary - minY1) / rangeY1;
      const y1 = padding.top + innerH - y1Norm * innerH;

      let y2: number | undefined = undefined;
      if (p.yValueSecondary !== undefined) {
        const y2Norm = (p.yValueSecondary - minY2) / rangeY2;
        y2 = padding.top + innerH - y2Norm * innerH;
      }

      return { x, y1, y2, point: p, index: idx };
    });

    // Threshold Y position
    const warnY = activeConfig
      ? padding.top + innerH - ((activeConfig.thresholdWarning - minY1) / rangeY1) * innerH
      : null;
    const critY = activeConfig
      ? padding.top + innerH - ((activeConfig.thresholdCritical - minY1) / rangeY1) * innerH
      : null;

    return {
      width,
      height,
      padding,
      innerW,
      innerH,
      minY1,
      maxY1,
      minY2,
      maxY2,
      coords,
      warnY,
      critY,
    };
  }, [sweepPoints, activeConfig]);

  if (!activeConfig) {
    return (
      <div className="p-8 text-center text-[#8b949e] font-mono">
        No parametric sweep profiles configured for this equipment model.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Sweep Profile Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#0d1117] border border-[#30363d] rounded">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[#f27d26]" />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Parametric Sensitivity Study:
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {availableConfigs.map((cfg) => (
            <button
              key={cfg.id}
              onClick={() => {
                setSelectedConfigId(cfg.id);
                setSelectedPointIndex(null);
              }}
              className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors touch-manipulation cursor-pointer ${
                cfg.id === activeConfig.id
                  ? 'bg-[#f27d26] text-black font-bold border-[#f27d26]'
                  : 'bg-[#161b22] text-[#c9d1d9] hover:bg-[#21262d] border-[#30363d]'
              }`}
            >
              {cfg.label.split(' vs ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="text-xs text-[#8b949e] bg-[#161b22] p-2.5 rounded border border-[#30363d] flex items-center gap-2">
        <Activity className="w-4 h-4 text-[#f27d26] shrink-0" />
        <span>{activeConfig.description}</span>
      </div>

      {/* 2. Interactive SVG Sweep Curve */}
      <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded flex flex-col gap-2 relative">
        <div className="flex items-center justify-between text-xs font-mono text-[#8b949e]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <span className="w-2.5 h-0.5 bg-cyan-400"></span>
              {activeConfig.primaryOutputName} ({activeConfig.primaryOutputUnit})
            </span>
            {activeConfig.secondaryOutputName && (
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-0.5 bg-amber-400 border-dashed"></span>
                {activeConfig.secondaryOutputName} ({activeConfig.secondaryOutputUnit})
              </span>
            )}
          </div>
          <span className="text-[11px] text-[#8b949e]">Hover / Click point to inspect & inject</span>
        </div>

        {chartGeometry && (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
              className="w-full h-auto max-h-[260px] select-none"
            >
              {/* Grid Lines */}
              <line
                x1={chartGeometry.padding.left}
                y1={chartGeometry.padding.top}
                x2={chartGeometry.padding.left + chartGeometry.innerW}
                y2={chartGeometry.padding.top}
                stroke="#21262d"
                strokeWidth="1"
              />
              <line
                x1={chartGeometry.padding.left}
                y1={chartGeometry.padding.top + chartGeometry.innerH * 0.5}
                x2={chartGeometry.padding.left + chartGeometry.innerW}
                y2={chartGeometry.padding.top + chartGeometry.innerH * 0.5}
                stroke="#21262d"
                strokeWidth="1"
              />
              <line
                x1={chartGeometry.padding.left}
                y1={chartGeometry.padding.top + chartGeometry.innerH}
                x2={chartGeometry.padding.left + chartGeometry.innerW}
                y2={chartGeometry.padding.top + chartGeometry.innerH}
                stroke="#30363d"
                strokeWidth="1"
              />

              {/* Threshold Lines */}
              {chartGeometry.critY !== null &&
                chartGeometry.critY >= chartGeometry.padding.top &&
                chartGeometry.critY <= chartGeometry.padding.top + chartGeometry.innerH && (
                  <g>
                    <line
                      x1={chartGeometry.padding.left}
                      y1={chartGeometry.critY}
                      x2={chartGeometry.padding.left + chartGeometry.innerW}
                      y2={chartGeometry.critY}
                      stroke="#f85149"
                      strokeWidth="1"
                      strokeDasharray="4 3"
                    />
                    <text
                      x={chartGeometry.padding.left + 6}
                      y={chartGeometry.critY - 3}
                      fill="#f85149"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      CRITICAL LIMIT ({activeConfig.thresholdCritical})
                    </text>
                  </g>
                )}

              {/* Secondary Curve (Y2) */}
              {chartGeometry.coords[0]?.y2 !== undefined && (
                <path
                  d={chartGeometry.coords
                    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y2}`)
                    .join(' ')}
                  fill="none"
                  stroke="#e3b341"
                  strokeWidth="1.75"
                  strokeDasharray="4 2"
                />
              )}

              {/* Primary Curve Area Fill */}
              <path
                d={`${chartGeometry.coords
                  .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y1}`)
                  .join(' ')} L ${
                  chartGeometry.coords[chartGeometry.coords.length - 1].x
                } ${chartGeometry.padding.top + chartGeometry.innerH} L ${
                  chartGeometry.coords[0].x
                } ${chartGeometry.padding.top + chartGeometry.innerH} Z`}
                fill="url(#primaryGradient)"
                opacity="0.2"
              />

              <defs>
                <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#58a6ff" />
                  <stop offset="100%" stopColor="#58a6ff" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Primary Curve (Y1) */}
              <path
                d={chartGeometry.coords
                  .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y1}`)
                  .join(' ')}
                fill="none"
                stroke="#58a6ff"
                strokeWidth="2.5"
              />

              {/* Interactive Data Points */}
              {chartGeometry.coords.map((c, idx) => {
                const isCurrent =
                  activePoint && activePoint.xValue === c.point.xValue;
                const ptColor =
                  c.point.status === 'critical'
                    ? '#f85149'
                    : c.point.status === 'warning'
                    ? '#d29922'
                    : '#3fb950';

                return (
                  <g
                    key={idx}
                    className="cursor-pointer group"
                    onClick={() => setSelectedPointIndex(idx)}
                  >
                    <circle
                      cx={c.x}
                      cy={c.y1}
                      r={isCurrent ? 6 : 3.5}
                      fill={isCurrent ? '#ffffff' : ptColor}
                      stroke={ptColor}
                      strokeWidth={isCurrent ? 2 : 1}
                      className="transition-all duration-150"
                    />
                    {isCurrent && (
                      <circle
                        cx={c.x}
                        cy={c.y1}
                        r="10"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                        className="animate-spin"
                      />
                    )}
                  </g>
                );
              })}

              {/* Axis Labels */}
              <text
                x={chartGeometry.padding.left}
                y={chartGeometry.height - 10}
                fill="#8b949e"
                fontSize="10"
                fontFamily="monospace"
              >
                {activeConfig.min} {activeConfig.unit}
              </text>
              <text
                x={chartGeometry.padding.left + chartGeometry.innerW * 0.5}
                y={chartGeometry.height - 10}
                textAnchor="middle"
                fill="#c9d1d9"
                fontSize="10"
                fontFamily="monospace"
              >
                SWEEP PARAMETER: {activeConfig.parameterKey} ({activeConfig.unit})
              </text>
              <text
                x={chartGeometry.padding.left + chartGeometry.innerW}
                y={chartGeometry.height - 10}
                textAnchor="end"
                fill="#8b949e"
                fontSize="10"
                fontFamily="monospace"
              >
                {activeConfig.max} {activeConfig.unit}
              </text>
            </svg>
          </div>
        )}
      </div>

      {/* 3. Selected Operating Point Details & Digital Twin Injection */}
      {activePoint && (
        <div className="p-3.5 bg-[#161b22] border border-[#30363d] rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  activePoint.status === 'safe'
                    ? 'bg-[#3fb950]'
                    : activePoint.status === 'warning'
                    ? 'bg-[#d29922]'
                    : 'bg-[#f85149]'
                }`}
              />
              <span className="font-mono font-bold text-white text-xs">
                Operating Point: {activePoint.xLabel}
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                  activePoint.status === 'safe'
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-600/40'
                    : activePoint.status === 'warning'
                    ? 'bg-amber-950/80 text-amber-400 border border-amber-600/40'
                    : 'bg-rose-950/80 text-rose-400 border border-rose-600/40'
                }`}
              >
                {activePoint.status}
              </span>
            </div>

            <div className="text-xs font-mono text-[#c9d1d9]">
              <span className="text-[#8b949e]">{activeConfig.primaryOutputName}:</span>{' '}
              <span className="font-bold text-cyan-400">{activePoint.yLabelPrimary}</span>
              {activePoint.yLabelSecondary && (
                <>
                  <span className="text-[#8b949e] ml-3">{activeConfig.secondaryOutputName}:</span>{' '}
                  <span className="font-bold text-amber-400">{activePoint.yLabelSecondary}</span>
                </>
              )}
            </div>

            <p className="text-[11px] text-[#8b949e] mt-0.5">{activePoint.insight}</p>
          </div>

          <button
            onClick={() => {
              if (activePoint.patchInputs) {
                onInjectInputs(activePoint.patchInputs);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#f27d26] hover:bg-[#ff8f3d] text-black font-mono font-bold text-xs rounded transition-colors touch-manipulation cursor-pointer shadow-md shadow-[#f27d2622] shrink-0"
          >
            <Zap size={14} className="fill-black" />
            <span>Inject Into Digital Twin</span>
          </button>
        </div>
      )}
    </div>
  );
};
