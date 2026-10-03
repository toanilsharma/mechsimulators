import React from 'react';
import { SeverityLevel } from '../../types/common';

export interface GaugeZone {
  from: number;
  to: number;
  color: string;
  label?: string;
}

export interface GaugeProps {
  value: number;
  min: number;
  max: number;
  title: string;
  unit: string;
  warningThreshold?: number;
  criticalThreshold?: number;
  inverseZones?: boolean; // If true, lower values are worse (e.g. NPSH margin)
  targetValue?: number;
  targetLabel?: string;
  size?: number;
  zones?: GaugeZone[];
  status?: SeverityLevel;
  className?: string;
}

export const Gauge: React.FC<GaugeProps> = ({
  value,
  min,
  max,
  title,
  unit,
  warningThreshold,
  criticalThreshold,
  inverseZones = false,
  targetValue,
  targetLabel,
  size = 190,
  zones,
  status,
  className = '',
}) => {
  // Normalize value between min and max
  const safeRange = max - min || 1;
  const clampedVal = Math.max(min, Math.min(max, value));
  const fraction = (clampedVal - min) / safeRange;

  // 240 degree arc gauge: from 135 deg to 405 deg
  const startAngle = 135;
  const endAngle = 405;
  const totalAngle = endAngle - startAngle;
  const currentAngle = startAngle + fraction * totalAngle;

  const radius = size * 0.38;
  const strokeWidth = size * 0.085;
  const cx = size / 2;
  const cy = size / 2 + size * 0.06;

  // Polar to cartesian helper
  const polarToCartesian = (angleDeg: number, r: number) => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad),
    };
  };

  const describeArc = (start: number, end: number, r: number) => {
    const startPt = polarToCartesian(start, r);
    const endPt = polarToCartesian(end, r);
    const largeArcFlag = end - start <= 180 ? '0' : '1';
    return `M ${startPt.x} ${startPt.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${endPt.x} ${endPt.y}`;
  };

  // Needle point
  const needleLength = radius * 0.85;
  const needlePoint = polarToCartesian(currentAngle, needleLength);

  // Status color determination
  let statusColor = '#3fb950'; // Safe Green
  if (status) {
    if (status === 'critical') statusColor = '#f85149';
    else if (status === 'warning') statusColor = '#f27d26';
    else statusColor = '#3fb950';
  } else if (inverseZones) {
    // Lower is worse (e.g. NPSH margin: <1.0 red, 1.0-1.2 yellow, >1.2 green)
    if (criticalThreshold !== undefined && value <= criticalThreshold) {
      statusColor = '#f85149';
    } else if (warningThreshold !== undefined && value <= warningThreshold) {
      statusColor = '#f27d26';
    }
  } else {
    // Higher is worse (e.g. vibration, stress: >critical is red)
    if (criticalThreshold !== undefined && value >= criticalThreshold) {
      statusColor = '#f85149';
    } else if (warningThreshold !== undefined && value >= warningThreshold) {
      statusColor = '#f27d26';
    }
  }

  return (
    <div
      className={`flex flex-col items-center justify-center p-3.5 bg-[#0d1117] rounded-sm border border-[#30363d] shadow-sm ${className}`}
    >
      <div className="text-[11px] font-bold font-mono text-[#8b949e] mb-1 text-center tracking-wider uppercase">
        {title}
      </div>

      <div className="relative" style={{ width: size, height: size * 0.86 }}>
        <svg width={size} height={size * 0.86} viewBox={`0 0 ${size} ${size * 0.9}`}>
          {/* Background Arc Track */}
          <path
            d={describeArc(startAngle, endAngle, radius)}
            fill="none"
            stroke="#161b22"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Color Zone Indications */}
          <path
            d={describeArc(
              startAngle,
              startAngle + (inverseZones ? 0.35 : 0.6) * totalAngle,
              radius
            )}
            fill="none"
            stroke={inverseZones ? '#f85149' : '#3fb950'}
            strokeWidth={strokeWidth * 0.32}
            opacity="0.6"
          />
          <path
            d={describeArc(
              startAngle + (inverseZones ? 0.35 : 0.6) * totalAngle,
              startAngle + (inverseZones ? 0.6 : 0.82) * totalAngle,
              radius
            )}
            fill="none"
            stroke="#f27d26"
            strokeWidth={strokeWidth * 0.32}
            opacity="0.6"
          />
          <path
            d={describeArc(
              startAngle + (inverseZones ? 0.6 : 0.82) * totalAngle,
              endAngle,
              radius
            )}
            fill="none"
            stroke={inverseZones ? '#3fb950' : '#f85149'}
            strokeWidth={strokeWidth * 0.32}
            opacity="0.6"
          />

          {/* Active Value Arc */}
          {fraction > 0.01 && (
            <path
              d={describeArc(startAngle, currentAngle, radius)}
              fill="none"
              stroke={statusColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          )}

          {/* Target marker line if provided */}
          {targetValue !== undefined && (
            (() => {
              const targetFrac = Math.max(0, Math.min(1, (targetValue - min) / safeRange));
              const targetAng = startAngle + targetFrac * totalAngle;
              const innerPt = polarToCartesian(targetAng, radius - strokeWidth / 2 - 3);
              const outerPt = polarToCartesian(targetAng, radius + strokeWidth / 2 + 3);
              return (
                <line
                  x1={innerPt.x}
                  y1={innerPt.y}
                  x2={outerPt.x}
                  y2={outerPt.y}
                  stroke="#58a6ff"
                  strokeWidth="2.5"
                  strokeDasharray="2,2"
                />
              );
            })()
          )}

          {/* Needle Center Hub & Needle */}
          <circle cx={cx} cy={cy} r={size * 0.045} fill="#161b22" stroke="#30363d" strokeWidth="2" />
          <line
            x1={cx}
            y1={cy}
            x2={needlePoint.x}
            y2={needlePoint.y}
            stroke={statusColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            className="transition-all duration-300"
          />
          <circle cx={cx} cy={cy} r={size * 0.022} fill={statusColor} />
        </svg>

        {/* Numeric Readout Overlay */}
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center text-center">
          <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-white flex items-baseline justify-center">
            <span>
              {typeof value === 'number'
                ? Math.abs(value) >= 100
                  ? value.toFixed(0)
                  : value.toFixed(2)
                : '--'}
            </span>
            <span className="text-xs font-normal text-[#8b949e] ml-1">{unit}</span>
          </div>
          {targetLabel && (
            <div className="text-[10px] text-[#58a6ff] font-mono mt-0.5">
              Ref: {targetLabel}
            </div>
          )}
        </div>
      </div>

      {/* Min & Max Range Labels */}
      <div className="w-full flex justify-between px-2 text-[10px] font-mono text-[#8b949e] pt-1">
        <span>{min}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
};
