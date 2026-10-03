import React from 'react';
import { UnitSystem } from '../../types/common';
import { RefreshCw, Globe, HelpCircle } from 'lucide-react';

export interface UnitToggleProps {
  unitSystem: UnitSystem;
  onToggle: () => void;
  onChange?: (system: UnitSystem) => void;
  variant?: 'compact' | 'segmented' | 'card';
  className?: string;
}

export const UnitToggle: React.FC<UnitToggleProps> = ({
  unitSystem,
  onToggle,
  onChange,
  variant = 'segmented',
  className = '',
}) => {
  const isMetric = unitSystem === 'metric';

  const handleSelect = (selected: UnitSystem) => {
    if (selected !== unitSystem) {
      if (onChange) {
        onChange(selected);
      } else {
        onToggle();
      }
    }
  };

  if (variant === 'compact') {
    return (
      <button
        type="button"
        id="unit-toggle-compact"
        onClick={onToggle}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#0d1117] border border-[#30363d] hover:border-[#f27d26] text-xs font-mono text-[#d1d5db] transition-colors touch-manipulation min-h-[34px] ${className}`}
        title="Toggle between SI Metric and US Customary Units"
        aria-label={`Current units: ${isMetric ? 'SI Metric' : 'US Customary'}. Click to toggle.`}
      >
        <span className="text-[10px] text-[#8b949e] uppercase">Unit:</span>
        <span className={isMetric ? 'text-[#f27d26] font-bold' : 'text-[#8b949e]'}>SI</span>
        <span className="text-[#30363d]">/</span>
        <span className={!isMetric ? 'text-[#f27d26] font-bold' : 'text-[#8b949e]'}>US</span>
      </button>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`p-3 rounded-sm bg-[#0d1117] border border-[#30363d] flex flex-col gap-2 ${className}`}>
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#8b949e] uppercase font-bold flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#f27d26]" />
            Measurement Standards
          </span>
          <span className="text-[10px] text-[#f27d26] font-bold">
            {isMetric ? 'SI Metric System' : 'US Customary System'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#161b22] rounded-sm border border-[#30363d]">
          <button
            type="button"
            onClick={() => handleSelect('metric')}
            className={`py-1.5 px-2 rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition-all ${
              isMetric
                ? 'bg-[#f27d26] text-black shadow-sm'
                : 'text-[#8b949e] hover:text-white hover:bg-[#0d1117]'
            }`}
          >
            SI (m, kW, kPa, mm)
          </button>
          <button
            type="button"
            onClick={() => handleSelect('us')}
            className={`py-1.5 px-2 rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition-all ${
              !isMetric
                ? 'bg-[#f27d26] text-black shadow-sm'
                : 'text-[#8b949e] hover:text-white hover:bg-[#0d1117]'
            }`}
          >
            US (ft, HP, PSI, in)
          </button>
        </div>
      </div>
    );
  }

  // Default: Segmented button group
  return (
    <div
      role="radiogroup"
      aria-label="Unit system selection"
      className={`inline-flex items-center p-1 bg-[#0d1117] rounded-sm border border-[#30363d] ${className}`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={isMetric}
        onClick={() => handleSelect('metric')}
        className={`px-3 py-1 rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 touch-manipulation min-h-[32px] ${
          isMetric
            ? 'bg-[#f27d26] text-black shadow-sm'
            : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]'
        }`}
      >
        <span>SI Metric</span>
        <span className="text-[9px] opacity-75 font-normal">(m, °C)</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={!isMetric}
        onClick={() => handleSelect('us')}
        className={`px-3 py-1 rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 touch-manipulation min-h-[32px] ${
          !isMetric
            ? 'bg-[#f27d26] text-black shadow-sm'
            : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]'
        }`}
      >
        <span>US Customary</span>
        <span className="text-[9px] opacity-75 font-normal">(ft, °F)</span>
      </button>
    </div>
  );
};
