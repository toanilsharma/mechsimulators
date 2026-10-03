import React from 'react';

interface Option {
  value: string;
  label: string;
  sublabel?: string;
}

interface SelectControlProps {
  id: string;
  label: string;
  value: string;
  options: Option[];
  onChange: (val: string) => void;
  description?: string;
  standardRef?: string;
}

export const SelectControl: React.FC<SelectControlProps> = ({
  id,
  label,
  value,
  options,
  onChange,
  description,
  standardRef,
}) => {
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-sm bg-[#161b22] border border-[#30363d] hover:border-[#8b949e]/50 transition-colors">
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
          <span className="text-[10px] text-[#8b949e] font-mono hidden sm:inline truncate max-w-[180px]">
            {description}
          </span>
        )}
      </div>

      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-[44px] py-2.5 pl-3 pr-8 rounded-sm bg-[#0d1117] text-white font-mono text-xs font-semibold border border-[#30363d] focus:border-[#f27d26] focus:outline-none appearance-none cursor-pointer touch-manipulation"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#161b22] text-[#d1d5db]">
              {opt.label} {opt.sublabel ? `— ${opt.sublabel}` : ''}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8b949e] text-xs font-mono">
          ▼
        </div>
      </div>
    </div>
  );
};
