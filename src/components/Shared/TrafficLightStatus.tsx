import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import { SeverityLevel } from '../../types/common';

export interface TrafficLightStatusProps {
  status: SeverityLevel;
  title?: string;
  message?: string;
  standard?: string;
  variant?: 'pill' | 'industrial-lamp' | 'banner' | 'compact';
  className?: string;
}

export const TrafficLightStatus: React.FC<TrafficLightStatusProps> = ({
  status,
  title,
  message,
  standard,
  variant = 'pill',
  className = '',
}) => {
  const isSafe = status === 'safe';
  const isWarning = status === 'warning';
  const isCritical = status === 'critical';

  const getStatusText = () => {
    switch (status) {
      case 'safe':
        return 'Safe / Compliant';
      case 'warning':
        return 'Warning / Marginal';
      case 'critical':
        return 'Critical / Exceeded';
      default:
        return 'Operational';
    }
  };

  const getColors = () => {
    switch (status) {
      case 'safe':
        return {
          bg: 'bg-[#3fb95015]',
          border: 'border-[#3fb95066]',
          text: 'text-[#3fb950]',
          lamp: 'bg-[#3fb950] shadow-[0_0_8px_#3fb950]',
          badge: 'bg-[#3fb95022] text-[#3fb950]',
        };
      case 'warning':
        return {
          bg: 'bg-[#f27d2615]',
          border: 'border-[#f27d2666]',
          text: 'text-[#f27d26]',
          lamp: 'bg-[#f27d26] shadow-[0_0_8px_#f27d26]',
          badge: 'bg-[#f27d2622] text-[#f27d26]',
        };
      case 'critical':
        return {
          bg: 'bg-[#f8514915]',
          border: 'border-[#f8514966]',
          text: 'text-[#f85149]',
          lamp: 'bg-[#f85149] shadow-[0_0_8px_#f85149]',
          badge: 'bg-[#f8514922] text-[#f85149]',
        };
      default:
        return {
          bg: 'bg-[#58a6ff15]',
          border: 'border-[#58a6ff66]',
          text: 'text-[#58a6ff]',
          lamp: 'bg-[#58a6ff] shadow-[0_0_8px_#58a6ff]',
          badge: 'bg-[#58a6ff22] text-[#58a6ff]',
        };
    }
  };

  const colors = getColors();

  if (variant === 'industrial-lamp') {
    return (
      <div
        className={`flex items-center gap-3 p-2.5 rounded-sm bg-[#0d1117] border ${colors.border} ${className}`}
      >
        {/* 3-stack physical beacon */}
        <div className="flex items-center gap-1.5 p-1 bg-[#161b22] border border-[#30363d] rounded-sm shrink-0">
          <div
            className={`w-3 h-3 rounded-full transition-all ${
              isCritical ? 'bg-[#f85149] shadow-[0_0_8px_#f85149]' : 'bg-[#f85149]/20'
            }`}
            title="Critical Alarm Indicator"
          />
          <div
            className={`w-3 h-3 rounded-full transition-all ${
              isWarning ? 'bg-[#f27d26] shadow-[0_0_8px_#f27d26]' : 'bg-[#f27d26]/20'
            }`}
            title="Warning Advisory Indicator"
          />
          <div
            className={`w-3 h-3 rounded-full transition-all ${
              isSafe ? 'bg-[#3fb950] shadow-[0_0_8px_#3fb950]' : 'bg-[#3fb950]/20'
            }`}
            title="Safe Compliance Indicator"
          />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className={`text-xs font-mono font-bold uppercase tracking-wider ${colors.text}`}>
              {title || getStatusText()}
            </span>
            {standard && (
              <span className="text-[10px] font-mono text-[#8b949e] shrink-0">
                {standard}
              </span>
            )}
          </div>
          {message && (
            <span className="text-[11px] text-[#8b949e] font-sans truncate">
              {message}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div
        className={`p-3.5 rounded-sm border ${colors.bg} ${colors.border} flex items-start gap-3 ${className}`}
      >
        <div className="mt-0.5 shrink-0">
          {isSafe && <ShieldCheck className="w-5 h-5 text-[#3fb950]" />}
          {isWarning && <AlertTriangle className="w-5 h-5 text-[#f27d26]" />}
          {isCritical && <AlertOctagon className="w-5 h-5 text-[#f85149]" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className={`text-xs font-mono font-bold uppercase tracking-wider ${colors.text}`}>
              {title || getStatusText()}
            </h4>
            {standard && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-[#161b22] border border-[#30363d] text-[#d1d5db]">
                {standard}
              </span>
            )}
          </div>
          {message && (
            <p className="text-xs text-[#d1d5db] font-sans mt-1 leading-relaxed">
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Default: Compact Pill
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border ${colors.bg} ${colors.border} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${colors.lamp}`} />
      <span className={`text-xs font-mono font-bold uppercase tracking-wider ${colors.text}`}>
        {title || getStatusText()}
      </span>
      {standard && (
        <span className="text-[10px] font-mono text-[#8b949e] pl-1 border-l border-[#30363d]">
          {standard}
        </span>
      )}
    </div>
  );
};
