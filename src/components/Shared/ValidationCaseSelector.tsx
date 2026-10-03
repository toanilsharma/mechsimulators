import React from 'react';
import { ValidationPreset } from '../../types/common';
import { Bookmark, CheckCircle2 } from 'lucide-react';

interface ValidationCaseSelectorProps<T> {
  presets: ValidationPreset<T>[];
  activePresetId?: string;
  onSelect: (preset: ValidationPreset<T>) => void;
}

export function ValidationCaseSelector<T>({
  presets,
  activePresetId,
  onSelect,
}: ValidationCaseSelectorProps<T>) {
  return (
    <div className="flex flex-col gap-2.5 p-3.5 bg-[#161b22] rounded-sm border border-[#30363d]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5 font-mono">
          <Bookmark className="w-3.5 h-3.5 text-[#f27d26]" />
          Industry Benchmarks & Validation Cases
        </span>
        <span className="text-[10px] text-[#8b949e] font-mono uppercase">
          Standards-Verified
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {presets.map((p) => {
          const isSelected = activePresetId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p)}
              className={`flex flex-col text-left p-3 rounded-sm border transition-all text-xs touch-manipulation ${
                isSelected
                  ? 'bg-[#f27d2618] border-[#f27d26] text-white shadow-md shadow-[#f27d2610]'
                  : 'bg-[#0d1117] border-[#30363d] hover:border-[#8b949e]/60 text-[#8b949e]'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className={`font-bold text-xs font-mono uppercase ${isSelected ? 'text-[#f27d26]' : 'text-[#d1d5db]'} line-clamp-1`}>
                  {p.name}
                </span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#f27d26] shrink-0" />}
              </div>
              <span className="text-[11px] text-[#8b949e] line-clamp-2 mb-2 font-sans">
                {p.description}
              </span>
              <span className="mt-auto text-[10px] text-[#f27d26] font-mono bg-[#161b22] px-2 py-0.5 rounded-sm border border-[#30363d] self-start">
                {p.source}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
