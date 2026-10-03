import React from 'react';
import { AlertTriangle, Info, Plus, Minus } from 'lucide-react';

export interface EngineeringInputProps {
  id?: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit: string;
  min?: number;
  max?: number;
  step?: number;
  showSlider?: boolean;
  helperText?: string;
  infoText?: string;
  recommendedRange?: { min: number; max: number; label?: string };
  warningMessage?: string;
  disabled?: boolean;
  precision?: number;
  className?: string;
}

export const EngineeringInput: React.FC<EngineeringInputProps> = ({
  id,
  label,
  value,
  onChange,
  unit,
  min,
  max,
  step = 1,
  showSlider = true,
  helperText,
  infoText,
  recommendedRange,
  warningMessage,
  disabled = false,
  precision = 2,
  className = '',
}) => {
  const inputId = id || `eng-input-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  // Check if current value is out of recommended range
  const isOutOfRange =
    recommendedRange &&
    ((recommendedRange.min !== undefined && value < recommendedRange.min) ||
      (recommendedRange.max !== undefined && value > recommendedRange.max));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      onChange(val);
    } else if (e.target.value === '' || e.target.value === '-') {
      // Allow clearing or negative sign during typing
      onChange(0);
    }
  };

  const handleStep = (direction: 'up' | 'down') => {
    const delta = direction === 'up' ? step : -step;
    let nextVal = parseFloat((value + delta).toFixed(precision));
    if (min !== undefined) nextVal = Math.max(min, nextVal);
    if (max !== undefined) nextVal = Math.min(max, nextVal);
    onChange(nextVal);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChange(val);
  };

  return (
    <div
      className={`flex flex-col gap-1.5 p-3 rounded-sm bg-[#0d1117] border ${
        isOutOfRange ? 'border-[#f27d26]' : 'border-[#30363d]'
      } hover:border-[#8b949e] transition-colors ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}
    >
      {/* Top row: Label, Info Tooltip Trigger, and Unit Badge */}
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-[#d1d5db] font-sans flex items-center gap-1.5 cursor-pointer"
        >
          <span>{label}</span>
          {infoText && (
            <span
              title={infoText}
              className="text-[#8b949e] hover:text-[#f27d26] transition-colors cursor-help inline-flex"
            >
              <Info className="w-3.5 h-3.5" />
            </span>
          )}
        </label>

        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-[#161b22] text-[#f27d26] border border-[#30363d] uppercase tracking-wider shrink-0">
          {unit}
        </span>
      </div>

      {/* Middle row: Stepper buttons and Numeric Input */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => handleStep('down')}
          disabled={disabled || (min !== undefined && value <= min)}
          className="w-8 h-8 rounded-sm bg-[#161b22] border border-[#30363d] hover:border-[#f27d26] active:bg-[#21262d] text-[#8b949e] hover:text-white flex items-center justify-center shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
          aria-label={`Decrease ${label}`}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <div className="relative flex-1">
          <input
            id={inputId}
            type="number"
            inputMode="decimal"
            value={isNaN(value) ? '' : value}
            onChange={handleInputChange}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className="w-full bg-[#161b22] border border-[#30363d] focus:border-[#f27d26] focus:ring-1 focus:ring-[#f27d26] rounded-sm py-1.5 px-3 text-sm font-mono font-bold text-white text-right outline-none transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={() => handleStep('up')}
          disabled={disabled || (max !== undefined && value >= max)}
          className="w-8 h-8 rounded-sm bg-[#161b22] border border-[#30363d] hover:border-[#f27d26] active:bg-[#21262d] text-[#8b949e] hover:text-white flex items-center justify-center shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
          aria-label={`Increase ${label}`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Optional Range Slider */}
      {showSlider && min !== undefined && max !== undefined && (
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[9px] font-mono text-[#8b949e] shrink-0">{min}</span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleSliderChange}
            disabled={disabled}
            className="w-full h-1.5 bg-[#161b22] rounded-lg appearance-none cursor-pointer accent-[#f27d26] touch-none"
            aria-label={`${label} slider`}
          />
          <span className="text-[9px] font-mono text-[#8b949e] shrink-0">{max}</span>
        </div>
      )}

      {/* Helper text or Out of Normal Range warning */}
      {isOutOfRange && (
        <div className="flex items-center gap-1.5 text-[10px] text-[#f27d26] font-mono pt-0.5">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>
            {warningMessage ||
              `Out of typical operating range (${recommendedRange?.min} - ${recommendedRange?.max} ${unit})`}
          </span>
        </div>
      )}

      {!isOutOfRange && helperText && (
        <span className="text-[10px] text-[#8b949e] font-sans leading-tight">
          {helperText}
        </span>
      )}
    </div>
  );
};
