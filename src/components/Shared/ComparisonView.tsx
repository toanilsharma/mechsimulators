import React from 'react';
import { ArrowRight, ArrowUpRight, ArrowDownRight, Minus, GitCompare, CheckCircle, AlertTriangle } from 'lucide-react';
import { SeverityLevel } from '../../types/common';

export interface ComparisonMetric {
  label: string;
  unit: string;
  currentValue: number;
  baselineValue: number;
  inverseBetter?: boolean; // If true, lower is better (e.g. stress, vibration). If false, higher is better (e.g. NPSH margin, bearing life)
  precision?: number;
}

export interface ComparisonViewProps {
  baselineName: string;
  currentName?: string;
  metrics: ComparisonMetric[];
  currentStatus?: SeverityLevel;
  baselineStatus?: SeverityLevel;
  className?: string;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  baselineName,
  currentName = 'Current Simulation Run',
  metrics,
  currentStatus,
  baselineStatus,
  className = '',
}) => {
  return (
    <div className={`p-4 rounded-sm bg-[#161b22] border border-[#30363d] flex flex-col gap-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[#30363d] pb-3">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-[#f27d26]" />
          <span className="text-xs font-mono font-bold uppercase text-white tracking-wider">
            Operating Case Delta Comparison
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#8b949e]">
          Delta: Current vs. Baseline
        </span>
      </div>

      {/* Case labels */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded-sm bg-[#0d1117] border border-[#30363d]">
          <span className="text-[10px] text-[#8b949e] uppercase block">Baseline Case:</span>
          <span className="font-bold text-[#58a6ff] truncate block mt-0.5">{baselineName}</span>
        </div>
        <div className="p-2.5 rounded-sm bg-[#0d1117] border border-[#f27d26]/50">
          <span className="text-[10px] text-[#8b949e] uppercase block">Current Case:</span>
          <span className="font-bold text-[#f27d26] truncate block mt-0.5">{currentName}</span>
        </div>
      </div>

      {/* Metrics Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono text-left border-collapse">
          <thead>
            <tr className="border-b border-[#30363d] text-[#8b949e] text-[10px] uppercase">
              <th className="py-2 px-2">Engineering Parameter</th>
              <th className="py-2 px-2 text-right">Baseline</th>
              <th className="py-2 px-2 text-right">Current</th>
              <th className="py-2 px-2 text-right">Delta (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363d]/50">
            {metrics.map((m, idx) => {
              const bVal = typeof m.baselineValue === 'number' && !isNaN(m.baselineValue) ? m.baselineValue : 0;
              const cVal = typeof m.currentValue === 'number' && !isNaN(m.currentValue) ? m.currentValue : 0;
              const diff = cVal - bVal;
              const percentDiff = bVal !== 0 ? (diff / Math.abs(bVal)) * 100 : 0;
              const precision = m.precision !== undefined ? m.precision : 2;

              // Check if change is an improvement
              const isImprovement = m.inverseBetter ? diff < 0 : diff > 0;
              const isWorse = m.inverseBetter ? diff > 0 : diff < 0;
              const isNeutral = Math.abs(diff) < 0.0001;

              return (
                <tr key={idx} className="hover:bg-[#0d1117] transition-colors">
                  <td className="py-2.5 px-2 font-sans font-medium text-[#d1d5db]">
                    {m.label} <span className="text-[10px] text-[#8b949e]">({m.unit})</span>
                  </td>
                  <td className="py-2.5 px-2 text-right text-[#8b949e]">
                    {bVal.toFixed(precision)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold text-white">
                    {cVal.toFixed(precision)}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isNeutral && (
                        <span className="text-[#8b949e] flex items-center">
                          <Minus className="w-3 h-3" /> 0.0%
                        </span>
                      )}
                      {!isNeutral && isImprovement && (
                        <span className="text-[#3fb950] font-bold flex items-center">
                          <ArrowUpRight className="w-3 h-3" />
                          {diff > 0 ? '+' : ''}
                          {percentDiff.toFixed(1)}%
                        </span>
                      )}
                      {!isNeutral && isWorse && (
                        <span className="text-[#f85149] font-bold flex items-center">
                          <ArrowDownRight className="w-3 h-3" />
                          {diff > 0 ? '+' : ''}
                          {percentDiff.toFixed(1)}%
                        </span>
                      )}
                    </div>
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
