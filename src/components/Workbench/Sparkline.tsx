import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  className?: string;
  min?: number;
  max?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 72,
  height = 24,
  color = '#f27d26',
  fillColor = 'rgba(242, 125, 38, 0.15)',
  className = '',
  min: customMin,
  max: customMax,
}) => {
  if (!data || data.length < 2) {
    return <div className={`w-[${width}px] h-[${height}px] bg-[#161b22] rounded opacity-40`} />;
  }

  const min = customMin !== undefined ? customMin : Math.min(...data);
  const max = customMax !== undefined ? customMax : Math.max(...data);
  const range = max - min || 1;

  const padding = 2;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * innerW;
    const y = height - padding - ((val - min) / range) * innerH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;

  const lastPoint = points[points.length - 1].split(',');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible ${className}`}
    >
      <defs>
        <linearGradient id={`spark-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Fill Area */}
      <path d={areaD} fill={`url(#spark-grad-${color.replace('#', '')})`} />

      {/* Stroke Line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Current/Last Point Dot */}
      {lastPoint.length === 2 && (
        <circle
          cx={parseFloat(lastPoint[0])}
          cy={parseFloat(lastPoint[1])}
          r="2.5"
          fill={color}
          className="animate-pulse"
        />
      )}
    </svg>
  );
};
