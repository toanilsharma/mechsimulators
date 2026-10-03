import React from 'react';
import { StatusLevel } from '../../types/common';
import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

interface StatusBadgeProps {
  level: StatusLevel;
  label: string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  level,
  label,
  score,
  size = 'md',
  showIcon = true,
}) => {
  const styles = {
    safe: {
      bg: 'bg-[#23863622] text-[#3fb950] border-[#238636]',
      dot: 'bg-[#3fb950]',
      icon: CheckCircle2,
    },
    warning: {
      bg: 'bg-[#f27d2622] text-[#f27d26] border-[#f27d26]',
      dot: 'bg-[#f27d26]',
      icon: AlertTriangle,
    },
    critical: {
      bg: 'bg-[#f8514922] text-[#f85149] border-[#da3633]',
      dot: 'bg-[#f85149] animate-pulse',
      icon: AlertOctagon,
    },
  }[level];

  const Icon = styles.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-3 py-1 gap-2',
    lg: 'text-sm px-4 py-1.5 gap-2.5 font-semibold',
  }[size];

  return (
    <div
      className={`inline-flex items-center rounded-sm border ${styles.bg} ${sizeClasses} transition-all duration-300 whitespace-nowrap font-mono`}
    >
      <span className={`w-2 h-2 rounded-full ${styles.dot} shrink-0`} />
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span className="tracking-wider uppercase text-[11px] font-bold">{label}</span>
      {score !== undefined && (
        <span className="ml-1 pl-1.5 border-l border-current/30 text-xs">
          {score}/100
        </span>
      )}
    </div>
  );
};
