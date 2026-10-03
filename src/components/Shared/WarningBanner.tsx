import React from 'react';
import { AlertOctagon, AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import { SeverityLevel } from '../../types/common';

export interface WarningBannerProps {
  severity: SeverityLevel | 'info';
  title: string;
  message: string;
  standard?: string;
  actionRequired?: string;
  onDismiss?: () => void;
  className?: string;
}

export const WarningBanner: React.FC<WarningBannerProps> = ({
  severity,
  title,
  message,
  standard,
  actionRequired,
  onDismiss,
  className = '',
}) => {
  const getSeverityConfig = () => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-[#f8514915]',
          border: 'border-[#f8514966]',
          text: 'text-[#f85149]',
          badge: 'bg-[#f8514922] text-[#f85149]',
          icon: <AlertOctagon className="w-5 h-5 text-[#f85149] shrink-0" />,
        };
      case 'warning':
        return {
          bg: 'bg-[#f27d2615]',
          border: 'border-[#f27d2666]',
          text: 'text-[#f27d26]',
          badge: 'bg-[#f27d2622] text-[#f27d26]',
          icon: <AlertTriangle className="w-5 h-5 text-[#f27d26] shrink-0" />,
        };
      case 'safe':
        return {
          bg: 'bg-[#3fb95015]',
          border: 'border-[#3fb95066]',
          text: 'text-[#3fb950]',
          badge: 'bg-[#3fb95022] text-[#3fb950]',
          icon: <CheckCircle2 className="w-5 h-5 text-[#3fb950] shrink-0" />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-[#58a6ff15]',
          border: 'border-[#58a6ff66]',
          text: 'text-[#58a6ff]',
          badge: 'bg-[#58a6ff22] text-[#58a6ff]',
          icon: <Info className="w-5 h-5 text-[#58a6ff] shrink-0" />,
        };
    }
  };

  const config = getSeverityConfig();

  return (
    <div
      role="alert"
      className={`p-3.5 sm:p-4 rounded-sm border ${config.bg} ${config.border} flex items-start justify-between gap-3 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="mt-0.5">{config.icon}</div>
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-mono font-bold uppercase tracking-wider ${config.text}`}>
              {title}
            </span>
            {standard && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-sm bg-[#161b22] border border-[#30363d] text-[#d1d5db]">
                {standard}
              </span>
            )}
          </div>

          <p className="text-xs text-[#d1d5db] font-sans leading-relaxed">
            {message}
          </p>

          {actionRequired && (
            <div className="mt-1 pt-1.5 border-t border-[#30363d]/50 text-xs font-sans text-white">
              <strong className="font-mono text-[11px] text-[#f27d26] uppercase mr-1.5">
                Required Mitigation:
              </strong>
              <span>{actionRequired}</span>
            </div>
          )}
        </div>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-[#8b949e] hover:text-white p-1 rounded-sm transition-colors shrink-0"
          aria-label="Dismiss warning"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
