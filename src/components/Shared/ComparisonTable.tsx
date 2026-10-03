import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, CheckCircle, AlertTriangle } from 'lucide-react';

export interface ComparisonRow {
  parameter: string;
  baseline: string | number;
  current: string | number;
  delta?: string | number;
  unit?: string;
  isFavorable?: boolean | null;
  note?: string;
}

interface ComparisonTableProps {
  title: string;
  baselineName: string;
  currentName: string;
  rows: ComparisonRow[];
  onClose: () => void;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  title,
  baselineName,
  currentName,
  rows,
  onClose,
}) => {
  return (
    <div className="p-4 bg-[#161b22] border border-[#58a6ff]/40 rounded-sm flex flex-col gap-3 text-xs font-mono shadow-md animate-in fade-in duration-150">
      <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#58a6ff] animate-pulse" />
          <h3 className="font-bold text-white uppercase tracking-wider">{title}</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#8b949e]">
            Comparing: <strong className="text-white">{baselineName}</strong> vs <strong className="text-[#58a6ff]">{currentName}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-0.5 rounded-sm bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white"
          >
            Hide Comparison
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#30363d] text-[#8b949e] text-[10px] uppercase">
              <th className="py-2 px-3">Engineering Parameter</th>
              <th className="py-2 px-3">Baseline Case ({baselineName})</th>
              <th className="py-2 px-3">Active Case ({currentName})</th>
              <th className="py-2 px-3">Delta / Variance</th>
              <th className="py-2 px-3">Impact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363d]/50">
            {rows.map((row, idx) => {
              return (
                <tr key={idx} className="hover:bg-[#0d1117]/60 transition-colors">
                  <td className="py-2 px-3 text-white font-semibold">
                    {row.parameter} {row.unit ? <span className="text-[#8b949e] font-normal">({row.unit})</span> : ''}
                  </td>
                  <td className="py-2 px-3 text-[#8b949e]">{row.baseline}</td>
                  <td className="py-2 px-3 text-[#58a6ff] font-bold">{row.current}</td>
                  <td className="py-2 px-3">
                    <span className="font-mono text-white">{row.delta ?? '-'}</span>
                  </td>
                  <td className="py-2 px-3">
                    {row.isFavorable === true && (
                      <span className="inline-flex items-center gap-1 text-[#3fb950] font-bold text-[11px]">
                        <ArrowUpRight className="w-3.5 h-3.5" /> Improved
                      </span>
                    )}
                    {row.isFavorable === false && (
                      <span className="inline-flex items-center gap-1 text-[#f85149] font-bold text-[11px]">
                        <ArrowDownRight className="w-3.5 h-3.5" /> Degraded
                      </span>
                    )}
                    {row.isFavorable === null && (
                      <span className="inline-flex items-center gap-1 text-[#8b949e] text-[11px]">
                        <Minus className="w-3.5 h-3.5" /> Neutral
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
