import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface SliderControlProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (val: number) => void;
  description?: string;
  standardRef?: string;
  warningMin?: number;
  warningMax?: number;
}

export const SliderControl: React.FC<SliderControlProps> = ({
  id,
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  description,
  standardRef,
  warningMin,
  warningMax,
}) => {
  const isOutOfRange =
    (warningMin !== undefined && value < warningMin) ||
    (warningMax !== undefined && value > warningMax);

  const handleStep = (direction: 'up' | 'down') => {
    const delta = direction === 'up' ? step : -step;
    const nextVal = Math.min(max, Math.max(min, Number((value + delta).toFixed(4))));
    onChange(nextVal);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      onChange(Math.min(max * 2, Math.max(min * 0.5, val)));
    }
  };

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-sm bg-[#161b22] border border-[#30363d] hover:border-[#8b949e]/50 transition-colors">
      {/* Header with Label & Standard reference */}
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[11px] font-bold text-[#d1d5db] uppercase font-mono flex items-center gap-1.5 cursor-pointer">
          {label}
          {standardRef && (
            <span className="text-[10px] text-[#f27d26] font-mono bg-[#f27d2618] px-1.5 py-0.5 rounded-sm border border-[#f27d26]/40 font-semibold">
              {standardRef}
            </span>
          )}
        </label>
        {description && (
          <span className="text-[10px] text-[#8b949e] font-mono hidden sm:inline truncate max-w-[160px]">
            {description}
          </span>
        )}
      </div>

      {/* Control row: [- button] [Slider] [+ button] [Numeric Input Box] */}
      <div className="flex items-center gap-2">
        {/* Step Down button - min 44x44px touch area */}
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => handleStep('down')}
          disabled={value <= min}
          className="w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center rounded-sm bg-[#21262d] border border-[#30363d] text-[#d1d5db] hover:bg-[#30363d] active:bg-[#484f58] disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0 touch-manipulation font-mono"
        >
          <Minus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        </button>

        {/* Range Slider */}
        <div className="flex-1 relative flex items-center py-2 px-1">
          <input
            type="range"
            id={id}
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-3 sm:h-2 bg-[#0d1117] border border-[#30363d] rounded-sm appearance-none cursor-pointer accent-[#f27d26] focus:outline-none"
          />
        </div>

        {/* Step Up button */}
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => handleStep('up')}
          disabled={value >= max}
          className="w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center rounded-sm bg-[#21262d] border border-[#30363d] text-[#d1d5db] hover:bg-[#30363d] active:bg-[#484f58] disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0 touch-manipulation font-mono"
        >
          <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        </button>

        {/* Direct Numeric Input with Unit */}
        <div className="relative flex items-center shrink-0 w-24 sm:w-28">
          <input
            type="number"
            value={value}
            step={step}
            onChange={handleInputChange}
            className={`w-full text-right pr-9 pl-2 py-1.5 rounded-sm bg-[#0d1117] font-mono text-xs font-semibold text-white border ${
              isOutOfRange
                ? 'border-[#f27d26] bg-[#f27d2610] text-[#f27d26]'
                : 'border-[#30363d] focus:border-[#f27d26]'
            } focus:outline-none`}
          />
          <span className="absolute right-2 text-[10px] font-mono text-[#8b949e] pointer-events-none">
            {unit}
          </span>
        </div>
      </div>

      {/* Warning message if out of bounds */}
      {isOutOfRange && (
        <div className="text-[10px] font-mono text-[#f27d26] flex items-center gap-1 mt-0.5">
          <span>⚠️ Value outside standard recommended envelope ({warningMin ?? min} - {warningMax ?? max} {unit})</span>
        </div>
      )}
    </div>
  );
};
