import React from 'react';
import { UnitSystem } from '../../types/common';
import { formatNum } from '../../utils/units';

interface UnitValueProps {
  label: string;
  metricValue: number;
  metricUnit: string;
  usValue?: number;
  usUnit?: string;
  unitSystem: UnitSystem;
  decimals?: number;
  highlight?: 'safe' | 'warning' | 'critical' | 'cyan' | 'neutral';
  subtext?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const UnitValue: React.FC<UnitValueProps> = ({
  label,
  metricValue,
  metricUnit,
  usValue,
  usUnit,
  unitSystem,
  decimals = 2,
  highlight = 'neutral',
  subtext,
  size = 'md',
}) => {
  const value = unitSystem === 'us' && usValue !== undefined ? usValue : metricValue;
  const unit = unitSystem === 'us' && usUnit !== undefined ? usUnit : metricUnit;

  const colorStyles = {
    safe: 'text-[#3fb950]',
    warning: 'text-[#f27d26]',
    critical: 'text-[#f85149] font-bold',
    cyan: 'text-[#f27d26]',
    neutral: 'text-white',
  }[highlight];

  const sizeClasses = {
    sm: 'text-xs font-semibold',
    md: 'text-base sm:text-lg font-bold',
    lg: 'text-xl sm:text-2xl font-bold tracking-tight',
  }[size];

  return (
    <div className="flex flex-col p-2.5 rounded-sm bg-[#0d1117] border border-[#30363d]">
      <span className="text-[10px] font-bold text-[#8b949e] tracking-wider uppercase font-mono truncate">
        {label}
      </span>
      <div className="flex items-baseline gap-1 mt-0.5">
        <span className={`font-mono ${sizeClasses} ${colorStyles}`}>
          {formatNum(value, decimals)}
        </span>
        <span className="text-xs font-mono text-[#8b949e]">{unit}</span>
      </div>
      {subtext && (
        <span className="text-[10px] text-[#8b949e] font-mono mt-0.5 truncate">
          {subtext}
        </span>
      )}
    </div>
  );
};
