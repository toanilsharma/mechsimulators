import React, { useState } from 'react';
import { Bookmark, ChevronDown, Check, Sparkles, Layers } from 'lucide-react';

export interface PresetOption<T = any> {
  id: string;
  name: string;
  category?: string;
  description?: string;
  standard?: string;
  data: T;
}

export interface PresetSelectorProps<T = any> {
  title?: string;
  presets: PresetOption<T>[];
  selectedId?: string;
  onSelect: (preset: PresetOption<T>) => void;
  variant?: 'chips' | 'dropdown' | 'grid';
  className?: string;
}

export const PresetSelector = <T,>({
  title = 'Engineering Presets',
  presets,
  selectedId,
  onSelect,
  variant = 'chips',
  className = '',
}: PresetSelectorProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedPreset = presets.find((p) => p.id === selectedId) || presets[0];

  // Group presets by category if available
  const categories = Array.from(
    new Set(presets.map((p) => p.category || 'General Presets'))
  );

  if (variant === 'dropdown') {
    return (
      <div className={`relative flex flex-col gap-1.5 ${className}`}>
        {title && (
          <label className="text-xs font-mono font-bold text-[#8b949e] uppercase tracking-wider flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-[#f27d26]" />
            {title}
          </label>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between gap-2 p-2.5 rounded-sm bg-[#0d1117] border border-[#30363d] hover:border-[#f27d26] text-xs font-mono text-left text-white transition-colors"
            aria-expanded={isOpen}
          >
            <div className="flex flex-col truncate">
              <span className="font-bold truncate text-[#d1d5db]">
                {selectedPreset?.name}
              </span>
              {selectedPreset?.standard && (
                <span className="text-[10px] text-[#f27d26] truncate">
                  {selectedPreset.standard}
                </span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[#8b949e] shrink-0 transition-transform ${
                isOpen ? 'rotate-180 text-[#f27d26]' : ''
              }`}
            />
          </button>

          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-60 overflow-y-auto rounded-sm bg-[#161b22] border border-[#30363d] shadow-xl py-1">
                {categories.map((cat) => {
                  const catPresets = presets.filter(
                    (p) => (p.category || 'General Presets') === cat
                  );
                  return (
                    <div key={cat} className="border-b border-[#30363d]/50 last:border-0">
                      <div className="px-3 py-1 text-[10px] font-mono font-bold text-[#8b949e] bg-[#0d1117] uppercase">
                        {cat}
                      </div>
                      {catPresets.map((preset) => {
                        const isSelected = preset.id === selectedId;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              onSelect(preset);
                              setIsOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left flex items-start justify-between gap-2 text-xs font-mono transition-colors ${
                              isSelected
                                ? 'bg-[#f27d2622] text-[#f27d26] font-bold'
                                : 'text-[#d1d5db] hover:bg-[#0d1117] hover:text-white'
                            }`}
                          >
                            <div>
                              <div className="font-sans font-semibold">{preset.name}</div>
                              {preset.description && (
                                <div className="text-[10px] text-[#8b949e] font-sans">
                                  {preset.description}
                                </div>
                              )}
                            </div>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-[#f27d26] shrink-0 mt-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {title && (
          <div className="text-xs font-mono font-bold text-[#8b949e] uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#f27d26]" />
            {title}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {presets.map((preset) => {
            const isSelected = preset.id === selectedId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelect(preset)}
                className={`p-2.5 rounded-sm border text-left flex flex-col justify-between gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-[#f27d2622] border-[#f27d26] text-white shadow-sm'
                    : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:border-[#8b949e] hover:text-[#d1d5db]'
                }`}
              >
                <div className="flex items-start justify-between gap-1 w-full">
                  <span className="text-xs font-bold font-sans text-white">
                    {preset.name}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#f27d26] shrink-0" />}
                </div>
                {preset.description && (
                  <span className="text-[10px] text-[#8b949e] font-sans line-clamp-2">
                    {preset.description}
                  </span>
                )}
                {preset.standard && (
                  <span className="text-[9px] font-mono text-[#f27d26]">
                    {preset.standard}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Default: Chips row
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {title && (
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#8b949e] uppercase font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#f27d26]" />
            {title}
          </span>
          <span className="text-[10px] text-[#8b949e]">Click chip to load</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {presets.map((preset) => {
          const isSelected = preset.id === selectedId;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset)}
              className={`px-3 py-1.5 rounded-sm text-xs font-mono whitespace-nowrap transition-all border shrink-0 touch-manipulation min-h-[32px] flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#f27d26] border-[#f27d26] text-black font-bold shadow-sm'
                  : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:text-white hover:border-[#8b949e]'
              }`}
            >
              <span>{preset.name}</span>
              {preset.standard && (
                <span
                  className={`text-[9px] px-1 py-0.2 rounded ${
                    isSelected ? 'bg-black/30 text-black' : 'text-[#f27d26]'
                  }`}
                >
                  {preset.standard}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
