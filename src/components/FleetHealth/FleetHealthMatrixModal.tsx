import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Download,
  ExternalLink,
  Search,
  Filter,
  BarChart2,
  Calendar,
  Grid,
} from 'lucide-react';
import { SimulatorId } from '../../types/common';
import { useApp } from '../../context/AppContext';
import { useSimulationStore } from '../../engine/simulationStore';
import {
  calculateFleetHealthMatrix,
  FleetAssetHealthRecord,
} from '../../physics/fleetHealthMath';
import { STANDARDS_SAFE_DISCLAIMER_SHORT } from '../../utils/standardsSafeHarbor';

interface FleetHealthMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FleetHealthMatrixModal: React.FC<FleetHealthMatrixModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { navigateToSimulator } = useApp();
  const simStore = useSimulationStore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'safe' | 'warning' | 'critical'>('all');
  const [sortField, setSortField] = useState<'rpn' | 'healthScore' | 'name' | 'nextInspectionDays'>('rpn');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fleetSummary = useMemo(() => {
    return calculateFleetHealthMatrix(simStore.calculatedOutputs);
  }, [simStore.calculatedOutputs]);

  if (!isOpen) return null;

  // Filter and sort records
  const filteredRecords = fleetSummary.records
    .filter((r) => {
      if (filterStatus !== 'all' && r.statusLevel !== filterStatus) return false;
      if (searchQuery.trim() === '') return true;
      const q = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.assetTag.toLowerCase().includes(q) ||
        r.primaryFailureMode.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const mult = sortDirection === 'desc' ? -1 : 1;
      if (sortField === 'rpn') return (a.rpn - b.rpn) * mult;
      if (sortField === 'healthScore') return (a.healthScore - b.healthScore) * mult;
      if (sortField === 'nextInspectionDays') return (a.nextInspectionDays - b.nextInspectionDays) * mult;
      return a.name.localeCompare(b.name) * mult;
    });

  const handleExportCsv = () => {
    const headers = [
      'Asset Tag',
      'Equipment Name',
      'Category',
      'Health Score (%)',
      'Status',
      'Primary Failure Mode',
      'Leading Indicator',
      'Severity (S)',
      'Occurrence (O)',
      'Detection (D)',
      'RPN (SxOxD)',
      'Recommended Action',
      'Next Inspection (Days)',
    ];

    const rows = fleetSummary.records.map((r) => [
      r.assetTag,
      `"${r.name}"`,
      `"${r.category}"`,
      r.healthScore,
      r.statusLevel.toUpperCase(),
      `"${r.primaryFailureMode}"`,
      `"${r.leadingIndicatorMetric}"`,
      r.severity,
      r.occurrence,
      r.detection,
      r.rpn,
      `"${r.maintenanceAction}"`,
      r.nextInspectionDays,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Plant_Fleet_Health_Matrix_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGoToSimulator = (simId: SimulatorId) => {
    onClose();
    navigateToSimulator(simId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-6xl max-h-[94vh] rounded bg-[#161b22] border border-[#30363d] shadow-2xl flex flex-col overflow-hidden text-[#d1d5db]">
        {/* Header */}
        <div className="p-3 sm:p-4 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-950 border border-emerald-500/60 rounded flex items-center justify-center font-bold text-emerald-400 font-mono text-xs shadow-md shrink-0">
              <Grid size={17} />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                PILLAR 9 • FLEET ASSET INTEGRITY & FMEA / RPN MATRIX
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white font-mono flex items-center gap-2">
                Plant-Wide Machinery Fleet Health & Reliability Matrix
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-2.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-mono text-white rounded flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Export Fleet CSV</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] text-[#d1d5db] flex items-center justify-center transition-colors min-h-[40px] min-w-[40px]"
              aria-label="Close Fleet Matrix"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Top KPI Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
            <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded">
              <div className="text-[10px] uppercase text-[#8b949e]">Fleet Health Index</div>
              <div className="text-xl font-bold text-emerald-400">
                {fleetSummary.fleetOverallHealth} <span className="text-xs text-[#8b949e]">/ 100</span>
              </div>
              <div className="text-[10px] text-[#8b949e]">Aggregate plant score</div>
            </div>

            <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded">
              <div className="text-[10px] uppercase text-[#8b949e]">Availability Forecast</div>
              <div className="text-xl font-bold text-cyan-400">
                {fleetSummary.fleetAvailabilityForecastPercent}%
              </div>
              <div className="text-[10px] text-[#8b949e]">Target: {'>'}= 95.0%</div>
            </div>

            <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded">
              <div className="text-[10px] uppercase text-[#8b949e]">Highest Risk Asset</div>
              <div className="text-sm font-bold text-amber-400 truncate">
                {fleetSummary.highestRpnAsset}
              </div>
              <div className="text-[10px] text-rose-400 font-bold">RPN: {fleetSummary.highestRpnValue}</div>
            </div>

            <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded">
              <div className="text-[10px] uppercase text-[#8b949e]">Risk Breakdown</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-1.5 py-0.5 bg-rose-950 border border-rose-500/50 text-rose-300 rounded text-xs font-bold">
                  {fleetSummary.criticalAssetCount} Crit
                </span>
                <span className="px-1.5 py-0.5 bg-amber-950 border border-amber-500/50 text-amber-300 rounded text-xs font-bold">
                  {fleetSummary.warningAssetCount} Warn
                </span>
              </div>
              <div className="text-[10px] text-[#8b949e] mt-1">{fleetSummary.healthyAssetCount} Nominal</div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 bg-[#0d1117] border border-[#30363d] rounded">
              <div className="text-[10px] uppercase text-[#8b949e]">Benchmark Standard</div>
              <div className="text-xs font-bold text-white mt-0.5">ISO 17359 / 55000</div>
              <div className="text-[9px] text-[#8b949e] mt-1">Condition Monitoring & Asset Integrity</div>
            </div>
          </div>

          {/* Search, Filter and Sort Toolbar */}
          <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[220px]">
              <div className="relative w-full max-w-xs">
                <Search size={14} className="absolute left-2.5 top-2.5 text-[#8b949e]" />
                <input
                  type="text"
                  placeholder="Filter machinery by tag or failure mode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#6e7681] focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center bg-[#161b22] p-0.5 rounded border border-[#30363d]">
                {(['all', 'critical', 'warning', 'safe'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-2 py-1 rounded capitalize cursor-pointer ${
                      filterStatus === st
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-[#8b949e] hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-[#8b949e]">
              <span>Sort by:</span>
              <button
                onClick={() => {
                  if (sortField === 'rpn') setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
                  else { setSortField('rpn'); setSortDirection('desc'); }
                }}
                className={`px-2 py-1 rounded border border-[#30363d] ${
                  sortField === 'rpn' ? 'bg-[#21262d] text-white font-bold' : 'hover:text-white'
                }`}
              >
                RPN {sortField === 'rpn' && (sortDirection === 'desc' ? '↓' : '↑')}
              </button>
              <button
                onClick={() => {
                  if (sortField === 'healthScore') setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
                  else { setSortField('healthScore'); setSortDirection('desc'); }
                }}
                className={`px-2 py-1 rounded border border-[#30363d] ${
                  sortField === 'healthScore' ? 'bg-[#21262d] text-white font-bold' : 'hover:text-white'
                }`}
              >
                Health {sortField === 'healthScore' && (sortDirection === 'desc' ? '↓' : '↑')}
              </button>
            </div>
          </div>

          {/* Interactive Fleet Table */}
          <div className="border border-[#30363d] rounded-lg overflow-x-auto bg-[#0d1117]">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-[#161b22] border-b border-[#30363d] text-[#8b949e] text-[11px]">
                  <th className="p-3">Asset Tag</th>
                  <th className="p-3">Equipment / Category</th>
                  <th className="p-3 text-center">Health</th>
                  <th className="p-3">Primary Failure Mode</th>
                  <th className="p-3">Leading Indicator</th>
                  <th className="p-3 text-center">FMEA (S×O×D)</th>
                  <th className="p-3 text-center">RPN</th>
                  <th className="p-3">Maintenance Action</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]">
                {filteredRecords.map((rec) => {
                  const isHighRpn = rec.rpn >= 200;
                  const isModRpn = rec.rpn >= 100 && rec.rpn < 200;

                  return (
                    <tr key={rec.assetId} className="hover:bg-[#161b22]/70 transition-colors">
                      <td className="p-3 font-bold text-white whitespace-nowrap">
                        <span className="px-1.5 py-0.5 bg-[#21262d] rounded border border-[#30363d] text-emerald-400">
                          {rec.assetTag}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-white">{rec.name}</div>
                        <div className="text-[10px] text-[#8b949e]">{rec.category}</div>
                      </td>

                      <td className="p-3 text-center">
                        <div className="font-bold text-white">{rec.healthScore}%</div>
                        <div className="w-16 bg-[#21262d] h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                          <div
                            className={`h-full ${
                              rec.healthScore > 80
                                ? 'bg-emerald-500'
                                : rec.healthScore > 65
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${rec.healthScore}%` }}
                          />
                        </div>
                      </td>

                      <td className="p-3 text-[11px] text-amber-300 max-w-[200px]">
                        {rec.primaryFailureMode}
                      </td>

                      <td className="p-3 text-[11px] text-cyan-300 whitespace-nowrap">
                        {rec.leadingIndicatorMetric}
                      </td>

                      <td className="p-3 text-center text-[#8b949e]">
                        {rec.severity} × {rec.occurrence} × {rec.detection}
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            isHighRpn
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/60'
                              : isModRpn
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/60'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-500/60'
                          }`}
                        >
                          {rec.rpn}
                        </span>
                      </td>

                      <td className="p-3 text-[10px] text-[#d1d5db] max-w-[240px] leading-snug">
                        {rec.maintenanceAction}
                        <div className="text-[9px] text-[#8b949e] mt-0.5">
                          Inspect in {rec.nextInspectionDays} days
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleGoToSimulator(rec.assetId)}
                          className="p-1.5 bg-[#21262d] hover:bg-emerald-950 hover:border-emerald-500 border border-[#30363d] rounded text-emerald-400 transition-colors cursor-pointer"
                          title={`Open ${rec.name} Simulator`}
                        >
                          <ExternalLink size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Safe Harbor Legal Benchmark Notice */}
          <div className="p-3 bg-[#080b10] border border-[#30363d] rounded text-[10px] text-[#8b949e] font-mono leading-relaxed">
            <span className="text-amber-400 font-bold uppercase mr-1">Industry Reference Benchmark:</span>
            {STANDARDS_SAFE_DISCLAIMER_SHORT} Fleet scoring utilizes open FMEA severity-occurrence-detection multipliers under ISO 17359 / ISO 55000 academic condition monitoring standards. Not an official field certification.
          </div>
        </div>
      </div>
    </div>
  );
};
