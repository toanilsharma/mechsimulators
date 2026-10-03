import React, { useState } from 'react';

export interface DataPoint {
  x: number;
  y: number;
  label?: string;
}

export interface ChartSeries {
  id: string;
  name: string;
  data: DataPoint[];
  color: string;
  strokeWidth?: number;
  dashed?: boolean;
  fillArea?: boolean;
}

export interface MiniChartProps {
  title?: string;
  series: ChartSeries[];
  xLabel?: string;
  yLabel?: string;
  xUnit?: string;
  yUnit?: string;
  referenceLineY?: { value: number; label: string; color?: string };
  referenceLineX?: { value: number; label: string; color?: string };
  currentOperatingPoint?: { x: number; y: number; label?: string };
  height?: number;
  aspectRatio?: string;
  className?: string;
}

export const MiniChart: React.FC<MiniChartProps> = ({
  title,
  series,
  xLabel,
  yLabel,
  xUnit = '',
  yUnit = '',
  referenceLineY,
  referenceLineX,
  currentOperatingPoint,
  height = 200,
  className = '',
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; seriesName: string } | null>(null);

  // Compute extents
  const allPoints = series.flatMap((s) => s.data);
  if (currentOperatingPoint) allPoints.push(currentOperatingPoint);

  const minX = Math.min(...allPoints.map((p) => p.x), 0);
  const maxX = Math.max(...allPoints.map((p) => p.x), 10);
  const minY = Math.min(...allPoints.map((p) => p.y), 0);
  const maxY = Math.max(...allPoints.map((p) => p.y), 10) * 1.1; // 10% head room

  const width = 450;
  const padding = { top: 20, right: 25, bottom: 35, left: 45 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const scaleX = (x: number) => padding.left + ((x - minX) / (maxX - minX || 1)) * innerWidth;
  const scaleY = (y: number) => padding.top + innerHeight - ((y - minY) / (maxY - minY || 1)) * innerHeight;

  // Grid tick marks
  const xTicks = [minX, minX + (maxX - minX) * 0.33, minX + (maxX - minX) * 0.66, maxX];
  const yTicks = [minY, minY + (maxY - minY) * 0.33, minY + (maxY - minY) * 0.66, maxY];

  return (
    <div className={`p-3.5 rounded-sm bg-[#0d1117] border border-[#30363d] flex flex-col gap-2 ${className}`}>
      {/* Title & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {title && (
          <span className="text-xs font-mono font-bold uppercase text-[#8b949e] tracking-wider">
            {title}
          </span>
        )}
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono">
          {series.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5" style={{ backgroundColor: s.color }} />
              <span className="text-[#d1d5db]">{s.name}</span>
            </div>
          ))}
          {currentOperatingPoint && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#f27d26]" />
              <span className="text-[#f27d26] font-bold">Operating Point</span>
            </div>
          )}
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            {series.map((s) => (
              <linearGradient key={`grad-${s.id}`} id={`grad-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
              </linearGradient>
            ))}
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <g key={`ytick-${i}`}>
              <line
                x1={padding.left}
                y1={scaleY(tick)}
                x2={width - padding.right}
                y2={scaleY(tick)}
                stroke="#21262d"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <text
                x={padding.left - 6}
                y={scaleY(tick) + 3}
                fill="#8b949e"
                fontSize="9"
                fontFamily="var(--font-mono)"
                textAnchor="end"
              >
                {tick >= 100 ? tick.toFixed(0) : tick.toFixed(1)}
              </text>
            </g>
          ))}

          {xTicks.map((tick, i) => (
            <g key={`xtick-${i}`}>
              <line
                x1={scaleX(tick)}
                y1={padding.top}
                x2={scaleX(tick)}
                y2={height - padding.bottom}
                stroke="#21262d"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <text
                x={scaleX(tick)}
                y={height - padding.bottom + 14}
                fill="#8b949e"
                fontSize="9"
                fontFamily="var(--font-mono)"
                textAnchor="middle"
              >
                {tick >= 100 ? tick.toFixed(0) : tick.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Axes Lines */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={height - padding.bottom}
            stroke="#30363d"
            strokeWidth="1.5"
          />
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke="#30363d"
            strokeWidth="1.5"
          />

          {/* Reference Line Y */}
          {referenceLineY && (
            <g>
              <line
                x1={padding.left}
                y1={scaleY(referenceLineY.value)}
                x2={width - padding.right}
                y2={scaleY(referenceLineY.value)}
                stroke={referenceLineY.color || '#f85149'}
                strokeWidth="1.5"
                strokeDasharray="3,3"
              />
              <text
                x={width - padding.right}
                y={scaleY(referenceLineY.value) - 4}
                fill={referenceLineY.color || '#f85149'}
                fontSize="8"
                fontFamily="var(--font-mono)"
                textAnchor="end"
                fontWeight="bold"
              >
                {referenceLineY.label} ({typeof referenceLineY.value === 'number' ? referenceLineY.value.toFixed(1) : referenceLineY.value} {yUnit})
              </text>
            </g>
          )}

          {/* Reference Line X */}
          {referenceLineX && (
            <g>
              <line
                x1={scaleX(referenceLineX.value)}
                y1={padding.top}
                x2={scaleX(referenceLineX.value)}
                y2={height - padding.bottom}
                stroke={referenceLineX.color || '#f27d26'}
                strokeWidth="1.5"
                strokeDasharray="3,3"
              />
              <text
                x={scaleX(referenceLineX.value) + 4}
                y={padding.top + 10}
                fill={referenceLineX.color || '#f27d26'}
                fontSize="8"
                fontFamily="var(--font-mono)"
                fontWeight="bold"
              >
                {referenceLineX.label}
              </text>
            </g>
          )}

          {/* Series Areas and Lines */}
          {series.map((s) => {
            if (s.data.length < 2) return null;
            const pointsStr = s.data.map((p) => `${scaleX(p.x)},${scaleY(p.y)}`).join(' ');
            const areaPointsStr = `${scaleX(s.data[0].x)},${scaleY(minY)} ${pointsStr} ${scaleX(
              s.data[s.data.length - 1].x
            )},${scaleY(minY)}`;

            return (
              <g key={`series-group-${s.id}`}>
                {s.fillArea && (
                  <polygon points={areaPointsStr} fill={`url(#grad-${s.id})`} />
                )}
                <polyline
                  points={pointsStr}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.strokeWidth || 2}
                  strokeDasharray={s.dashed ? '4,4' : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {s.data.map((p, idx) => (
                  <circle
                    key={`dot-${s.id}-${idx}`}
                    cx={scaleX(p.x)}
                    cy={scaleY(p.y)}
                    r="2.5"
                    fill={s.color}
                    className="hover:r-4 transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredPoint({ x: p.x, y: p.y, seriesName: s.name })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                ))}
              </g>
            );
          })}

          {/* Operating Point Marker */}
          {currentOperatingPoint && (
            <g>
              {/* Pulsing halo */}
              <circle
                cx={scaleX(currentOperatingPoint.x)}
                cy={scaleY(currentOperatingPoint.y)}
                r="7"
                fill="#f27d26"
                opacity="0.3"
                className="animate-ping"
              />
              <circle
                cx={scaleX(currentOperatingPoint.x)}
                cy={scaleY(currentOperatingPoint.y)}
                r="4.5"
                fill="#f27d26"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              {currentOperatingPoint.label && (
                <text
                  x={scaleX(currentOperatingPoint.x) + 7}
                  y={scaleY(currentOperatingPoint.y) - 6}
                  fill="#ffffff"
                  fontSize="9"
                  fontFamily="var(--font-mono)"
                  fontWeight="bold"
                >
                  {currentOperatingPoint.label}
                </text>
              )}
            </g>
          )}

          {/* Axis Labels */}
          {xLabel && (
            <text
              x={width / 2}
              y={height - 5}
              fill="#8b949e"
              fontSize="9"
              fontFamily="var(--font-mono)"
              textAnchor="middle"
            >
              {xLabel} {xUnit ? `(${xUnit})` : ''}
            </text>
          )}
          {yLabel && (
            <text
              x={-height / 2}
              y="12"
              transform="rotate(-90)"
              fill="#8b949e"
              fontSize="9"
              fontFamily="var(--font-mono)"
              textAnchor="middle"
            >
              {yLabel} {yUnit ? `(${yUnit})` : ''}
            </text>
          )}
        </svg>

        {/* Hover Readout Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-[#161b22] border border-[#f27d26] rounded-sm text-[10px] font-mono text-white shadow-md">
            <span className="text-[#f27d26] font-bold">{hoveredPoint.seriesName}:</span>{' '}
            X={hoveredPoint.x.toFixed(1)} {xUnit}, Y={hoveredPoint.y.toFixed(1)} {yUnit}
          </div>
        )}
      </div>
    </div>
  );
};
