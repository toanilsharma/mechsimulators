import React, { useState } from 'react';
import { SEAL_PLAN_MATRIX, SealPlanMatrixRow } from '../../utils/sealPlanMatrix';
import { SealPlanId } from '../../types/seal';
import { Table, CheckCircle2, AlertCircle, Info, ChevronRight, Layers } from 'lucide-react';

interface SealPlanMatrixTableProps {
  activePlanId: SealPlanId;
  onSelectPlan: (planId: SealPlanId) => void;
}

export const SealPlanMatrixTable: React.FC<SealPlanMatrixTableProps> = ({
  activePlanId,
  onSelectPlan,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const rows = Object.values(SEAL_PLAN_MATRIX);
  const categories = ['all', 'Single Seal (Internal)', 'Single Seal (Cooling)', 'Single Seal (Special)', 'Dual Unpressurized', 'Dual Pressurized', 'Atmospheric Quench'];

  const filteredRows = filterCategory === 'all'
    ? rows
    : rows.filter((r) => r.category === filterCategory);

  return (
    <div className="flex flex-col gap-3 rounded-sm bg-[#161b22] border border-[#30363d] p-3 sm:p-4 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
            <Table className="w-4 h-4 text-[#f27d26]" />
            API 682 / ISO 21049 Mechanical Seal Flush Plan Selection Matrix
          </span>
          <p className="text-[11px] text-[#8b949e]">
            Comprehensive comparison of flush source, destination, cooling mechanism, pressurization, failure modes, and monitoring guidelines.
          </p>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono scrollbar-thin">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-2.5 py-1 rounded-sm border whitespace-nowrap transition-colors ${
              filterCategory === cat
                ? 'bg-[#f27d26] text-black font-bold border-[#f27d26]'
                : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:text-white hover:border-[#8b949e]'
            }`}
          >
            {cat === 'all' ? 'All Plans (12)' : cat}
          </button>
        ))}
      </div>

      {/* Matrix Responsive Table */}
      <div className="overflow-x-auto border border-[#30363d] rounded-sm max-h-[420px] scrollbar-thin">
        <table className="w-full text-left text-xs border-collapse min-w-[800px]">
          <thead className="bg-[#0d1117] text-[#8b949e] font-mono text-[10px] uppercase sticky top-0 z-10 border-b border-[#30363d]">
            <tr>
              <th className="p-2.5">Plan</th>
              <th className="p-2.5">Category</th>
              <th className="p-2.5">Flush Source</th>
              <th className="p-2.5">Destination</th>
              <th className="p-2.5">Cooling / Circulation</th>
              <th className="p-2.5">Pressurization</th>
              <th className="p-2.5">Typical Service</th>
              <th className="p-2.5">Primary Risk</th>
              <th className="p-2.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363d]/60 font-sans">
            {filteredRows.map((row) => {
              const isSelected = row.planId === activePlanId;
              return (
                <tr
                  key={row.planId}
                  className={`transition-colors ${
                    isSelected
                      ? 'bg-[#f27d26]/10 border-l-2 border-l-[#f27d26]'
                      : 'hover:bg-[#1f242c]'
                  }`}
                >
                  <td className="p-2.5 font-mono font-bold text-white whitespace-nowrap">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${isSelected ? 'bg-[#f27d26] text-black' : 'bg-[#0d1117] text-[#f27d26] border border-[#30363d]'}`}>
                      {row.name}
                    </span>
                  </td>
                  <td className="p-2.5 font-mono text-[10px] text-[#8b949e] whitespace-nowrap">
                    {row.category}
                  </td>
                  <td className="p-2.5 text-[#d1d5db]">{row.flushSource}</td>
                  <td className="p-2.5 text-[#d1d5db]">{row.flushDestination}</td>
                  <td className="p-2.5 text-[#d1d5db]">{row.coolingMethod}</td>
                  <td className="p-2.5 text-[#d1d5db]">{row.pressurizationMethod}</td>
                  <td className="p-2.5 text-[#cbd5e1]">{row.typicalApplication}</td>
                  <td className="p-2.5 text-[#f85149] font-medium">{row.mainRisk}</td>
                  <td className="p-2.5 text-center">
                    <button
                      onClick={() => onSelectPlan(row.planId)}
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                        isSelected
                          ? 'bg-[#f27d26] text-black'
                          : 'bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d] hover:text-white border border-[#30363d]'
                      }`}
                    >
                      {isSelected ? 'Active' : 'Load'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Selected Plan In-Depth Monitoring Detail */}
      {SEAL_PLAN_MATRIX[activePlanId] && (
        <div className="p-3 bg-[#0d1117] rounded-sm border border-[#30363d] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-col gap-1">
            <span className="text-[#f27d26] font-mono font-bold flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Recommended Monitoring for {SEAL_PLAN_MATRIX[activePlanId].name}:
            </span>
            <div className="flex flex-wrap gap-2 mt-0.5">
              {SEAL_PLAN_MATRIX[activePlanId].recommendedMonitoring.map((mon, i) => (
                <span key={i} className="bg-[#161b22] px-2 py-1 rounded border border-[#30363d] text-[#c9d1d9] text-[11px] font-mono">
                  • {mon}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
