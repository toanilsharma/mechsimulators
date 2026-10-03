import React, { useState } from 'react';
import { ChevronDown, Sliders, Shield, Info } from 'lucide-react';

export interface AccordionSectionProps {
  id?: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeColor?: string;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  className?: string;
}

export const AccordionSection: React.FC<AccordionSectionProps> = ({
  id,
  title,
  subtitle,
  icon,
  badge,
  badgeColor = 'bg-[#161b22] text-[#8b949e]',
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onToggle,
  children,
  headerAction,
  className = '',
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const isExpanded = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  return (
    <div
      id={id}
      className={`rounded-sm bg-[#161b22] border border-[#30363d] overflow-hidden transition-colors ${className}`}
    >
      <button
        type="button"
        onClick={handleToggle}
        className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left hover:bg-[#21262d]/50 transition-colors cursor-pointer touch-manipulation min-h-[48px]"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {icon ? (
            <div className="text-[#f27d26] shrink-0">{icon}</div>
          ) : (
            <Sliders className="w-4 h-4 text-[#f27d26] shrink-0" />
          )}

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white truncate">
                {title}
              </span>
              {badge !== undefined && (
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-sm border border-[#30363d] ${badgeColor}`}
                >
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <span className="text-[11px] text-[#8b949e] font-sans truncate">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {headerAction && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mr-1"
            >
              {headerAction}
            </div>
          )}
          <div
            className={`w-6 h-6 rounded-sm bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#8b949e] transition-transform duration-200 ${
              isExpanded ? 'rotate-180 text-[#f27d26] border-[#f27d26]' : ''
            }`}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="p-3.5 sm:p-4 border-t border-[#30363d] bg-[#0d1117]/60">
          {children}
        </div>
      )}
    </div>
  );
};
