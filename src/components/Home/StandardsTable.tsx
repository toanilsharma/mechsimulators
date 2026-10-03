import React, { useState, useMemo } from 'react';
import { SimulatorId } from '../../types/common';
import { FileText, ArrowRight, Search, ShieldCheck, Check } from 'lucide-react';

export interface StandardItem {
  code: string;
  org: string;
  body: 'api' | 'iso' | 'asme-agma';
  scope: string;
  criteria: string;
  simId: SimulatorId;
  simName: string;
}

interface StandardsTableProps {
  standards: StandardItem[];
  onLaunchSim: (id: SimulatorId) => void;
  onOpenAudit: () => void;
}

export const StandardsTable: React.FC<StandardsTableProps> = ({
  standards,
  onLaunchSim,
  onOpenAudit,
}) => {
  const [filter, setFilter] = useState<'all' | 'api' | 'iso' | 'asme-agma'>('all');
  const [tableSearch, setTableSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const filteredStandards = useMemo(() => {
    return standards.filter((s) => {
      const matchesCategory = filter === 'all' || s.body === filter;
      const q = tableSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.code.toLowerCase().includes(q) ||
        s.org.toLowerCase().includes(q) ||
        s.scope.toLowerCase().includes(q) ||
        s.criteria.toLowerCase().includes(q) ||
        s.simName.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [standards, filter, tableSearch]);

  return (
    <section
      id="standards-matrix-section"
      className="border-b border-[#1b253b] bg-gradient-to-b from-[#060a12] via-[#080d19] to-[#05070c] px-4 sm:px-8 py-10 sm:py-12"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#18253e] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold uppercase tracking-wider">
                04 // ENGINEERING GOVERNANCE & STANDARDS
              </span>
              <span className="text-slate-500 text-xs hidden sm:inline">•</span>
              <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                Calibrated Limits & Boundary Formulations
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Industry Governance & Verification Matrix
            </h2>
            <p className="text-xs text-slate-300 font-sans max-w-2xl leading-relaxed mt-1">
              Digital twins implement mathematical formulations and open engineering principles referencing standard industry guidelines for diagnostic evaluation and academic analysis.
            </p>
          </div>

          <button
            onClick={onOpenAudit}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0c1424] hover:bg-[#131f36] border border-[#213454] rounded-xl text-xs font-mono font-bold text-sky-300 transition-colors cursor-pointer self-start sm:self-auto shadow-md shrink-0"
          >
            <FileText size={14} className="text-amber-400" />
            <span>Calculation Audit Trail</span>
          </button>
        </div>

        {/* Filter Tabs and Instant Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                filter === 'all'
                  ? 'bg-sky-500 text-slate-950 shadow'
                  : 'bg-[#111726] text-slate-400 hover:text-white border border-[#1e2638]'
              }`}
            >
              All Guidelines ({standards.length})
            </button>
            <button
              onClick={() => setFilter('api')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                filter === 'api'
                  ? 'bg-sky-500 text-slate-950 shadow'
                  : 'bg-[#111726] text-slate-400 hover:text-white border border-[#1e2638]'
              }`}
            >
              API ({standards.filter((s) => s.body === 'api').length})
            </button>
            <button
              onClick={() => setFilter('iso')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                filter === 'iso'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'bg-[#111726] text-slate-400 hover:text-white border border-[#1e2638]'
              }`}
            >
              ISO ({standards.filter((s) => s.body === 'iso').length})
            </button>
            <button
              onClick={() => setFilter('asme-agma')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                filter === 'asme-agma'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-[#111726] text-slate-400 hover:text-white border border-[#1e2638]'
              }`}
            >
              ASME & AGMA ({standards.filter((s) => s.body === 'asme-agma').length})
            </button>
          </div>

          <div className="relative min-w-[220px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Search code or criteria..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#0a101d] border border-[#1e2840] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 font-mono"
            />
            {tableSearch && (
              <button
                onClick={() => setTableSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Standards Table */}
        <div className="overflow-x-auto custom-scrollbar border border-[#1e2638] rounded-2xl bg-[#090d16] shadow-xl">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0f1524] text-slate-400 border-b border-[#1e2638]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Reference Code</th>
                <th className="py-3.5 px-4 font-semibold">Issuing Org (Ref)</th>
                <th className="py-3.5 px-4 font-semibold">Equipment Scope</th>
                <th className="py-3.5 px-4 font-semibold">Typical Engineering Benchmark Criteria</th>
                <th className="py-3.5 px-4 font-semibold text-right">Digital Twin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#18233a] text-slate-300">
              {filteredStandards.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No standards matched &quot;{tableSearch}&quot;.
                  </td>
                </tr>
              ) : (
                filteredStandards.map((std) => (
                  <tr key={std.code} className="hover:bg-[#11192b]/70 transition-colors group">
                    <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            std.body === 'api'
                              ? 'bg-sky-400'
                              : std.body === 'iso'
                              ? 'bg-emerald-400'
                              : 'bg-amber-400'
                          }`}
                        ></span>
                        <button
                          onClick={() => handleCopyCode(std.code)}
                          title="Click to copy standard reference code"
                          className="text-sky-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>{std.code}</span>
                          {copiedCode === std.code ? (
                            <Check size={11} className="text-emerald-400" />
                          ) : (
                            <span className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-500">📋</span>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">{std.org}</td>
                    <td className="py-3.5 px-4 text-slate-200">{std.scope}</td>
                    <td className="py-3.5 px-4 text-slate-300 leading-relaxed">
                      <span className="text-slate-100 font-medium">{std.criteria}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onLaunchSim(std.simId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#141e30] hover:bg-sky-500 hover:text-slate-950 border border-[#233554] hover:border-sky-400 rounded-lg text-sky-300 font-bold transition-all cursor-pointer text-[11px] shadow-sm"
                      >
                        <span>{std.simName}</span>
                        <ArrowRight size={11} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Legal & Standards Non-Affiliation Box */}
        <div className="p-4 rounded-xl bg-[#090e18] border border-[#1a253c] text-[11px] text-slate-400 leading-relaxed space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-slate-200 font-mono text-[10px] uppercase tracking-wider">
            <ShieldCheck size={13} className="text-sky-400" />
            <span>Notice Regarding Engineering Standards & Trademark Designations</span>
          </div>
          <p>
            All standard codes (API, ISO, ASME, AGMA, HI), publication editions, and acronyms listed above are referenced strictly for educational comparison and nominative identification of recognized engineering methods. Mechanical Lab Pro is an independent educational tool with no affiliation, endorsement, sponsorship, or certification by any standards organization or regulatory agency.
          </p>
        </div>
      </div>
    </section>
  );
};
