import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-sm border border-[#30363d] bg-[#161b22] overflow-hidden transition-all duration-200">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left hover:bg-[#21262d] transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="font-bold text-xs sm:text-sm text-white tracking-wider uppercase font-mono">
            {title}
          </div>
          {badge && (
            <span className="text-[10px] font-mono bg-[#f27d2618] text-[#f27d26] border border-[#f27d26]/40 px-2 py-0.5 rounded-sm font-semibold">
              {badge}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-[#8b949e] font-mono hidden md:inline">
              {subtitle}
            </span>
          )}
        </div>
        <div className="w-7 h-7 rounded-sm bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#8b949e] shrink-0">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-3.5 sm:p-4 pt-3 border-t border-[#30363d] bg-[#0d1117]/60 flex flex-col gap-3">
          {children}
        </div>
      )}
    </div>
  );
};
