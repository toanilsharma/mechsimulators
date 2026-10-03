import React from 'react';
import { SeverityLevel } from '../../types/common';
import { TrafficLightStatus } from './TrafficLightStatus';
import { CheckCircle, AlertTriangle, AlertOctagon, ArrowUpRight, Wrench, Shield } from 'lucide-react';

export interface SecondaryMetric {
  label: string;
  value: string | number;
  unit?: string;
  status?: SeverityLevel;
}

export interface ResultCardProps {
  title: string;
  value: string | number;
  unit: string;
  status: SeverityLevel;
  recommendedAction?: string;
  standard?: string;
  thresholdLabel?: string;
  limitProgress?: {
    current: number;
    max: number;
    threshold?: number;
  };
  secondaryMetrics?: SecondaryMetric[];
  className?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  title,
  value,
  unit,
  status,
  recommendedAction,
  standard,
  thresholdLabel,
  limitProgress,
  secondaryMetrics = [],
  className = '',
}) => {
  const getStatusBorder = () => {
    switch (status) {
      case 'safe':
        return 'border-[#3fb95044] hover:border-[#3fb950]';
      case 'warning':
        return 'border-[#f27d2666] hover:border-[#f27d26]';
      case 'critical':
        return 'border-[#f8514988] hover:border-[#f85149] shadow-lg shadow-[#f8514915]';
      default:
        return 'border-[#30363d] hover:border-[#8b949e]';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'safe':
        return <CheckCircle className="w-5 h-5 text-[#3fb950]" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[#f27d26]" />;
      case 'critical':
        return <AlertOctagon className="w-5 h-5 text-[#f85149]" />;
      default:
        return <Shield className="w-5 h-5 text-[#58a6ff]" />;
    }
  };

  const progressPercent = limitProgress
    ? Math.min(100, Math.max(0, (limitProgress.current / (limitProgress.max || 1)) * 100))
    : null;

  return (
    <div
      className={`rounded-sm bg-[#161b22] border p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all shadow-md ${getStatusBorder()} ${className}`}
    >
      {/* Header: Title and Status Badge */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8b949e] block">
            {title}
          </span>
          {standard && (
            <span className="text-[10px] font-mono text-[#f27d26]">
              {standard}
            </span>
          )}
        </div>
        <div className="shrink-0">
          <TrafficLightStatus status={status} variant="pill" />
        </div>
      </div>

      {/* Primary Value Readout */}
      <div className="flex items-baseline gap-2 my-1">
        <span className="text-3xl sm:text-4xl font-mono font-bold text-white tracking-tight">
          {typeof value === 'number'
            ? Math.abs(value) >= 1000
              ? value.toLocaleString(undefined, { maximumFractionDigits: 1 })
              : value.toFixed(2)
            : value}
        </span>
        <span className="text-sm font-mono font-bold text-[#8b949e] uppercase">
          {unit}
        </span>
      </div>

      {/* Optional Limit Progress Bar */}
      {progressPercent !== null && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[10px] font-mono text-[#8b949e]">
            <span>Capacity Utilized</span>
            <span className="font-bold text-white">{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#0d1117] border border-[#30363d] overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                status === 'critical'
                  ? 'bg-[#f85149]'
                  : status === 'warning'
                  ? 'bg-[#f27d26]'
                  : 'bg-[#3fb950]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {thresholdLabel && (
            <span className="text-[9px] font-mono text-[#8b949e] text-right">
              {thresholdLabel}
            </span>
          )}
        </div>
      )}

      {/* Recommended Action / Engineering Guidance */}
      {recommendedAction && (
        <div className="p-3 rounded-sm bg-[#0d1117] border border-[#30363d] flex items-start gap-2.5">
          <div className="mt-0.5 shrink-0">{getStatusIcon()}</div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono font-bold uppercase text-[#8b949e] flex items-center gap-1">
              <Wrench className="w-3 h-3 text-[#f27d26]" />
              Engineering Recommendation
            </span>
            <p className="text-xs text-[#d1d5db] font-sans leading-relaxed">
              {recommendedAction}
            </p>
          </div>
        </div>
      )}

      {/* Secondary Metrics Grid if provided */}
      {secondaryMetrics.length > 0 && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#30363d]">
          {secondaryMetrics.map((metric, idx) => (
            <div key={idx} className="flex flex-col p-2 bg-[#0d1117] rounded-sm border border-[#30363d]">
              <span className="text-[10px] text-[#8b949e] font-sans truncate">
                {metric.label}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-sm font-mono font-bold text-white">
                  {typeof metric.value === 'number' ? metric.value.toFixed(2) : metric.value}
                </span>
                {metric.unit && (
                  <span className="text-[10px] font-mono text-[#8b949e]">
                    {metric.unit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
