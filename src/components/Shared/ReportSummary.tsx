import React from 'react';
import { Printer, Copy, Check, ShieldAlert, FileText, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { SeverityLevel, UnitSystem } from '../../types/common';
import { DISCLAIMER_TEXT } from '../DisclaimerModal';

export interface ReportItem {
  label: string;
  value: string;
  unit?: string;
  status?: SeverityLevel;
}

export interface ReportSummaryProps {
  toolName: string;
  subtitle?: string;
  date?: string;
  unitSystem: UnitSystem;
  status: SeverityLevel;
  inputs: ReportItem[];
  assumptions: string[];
  results: ReportItem[];
  warnings?: string[];
  standards: string[];
  recommendations?: string[];
  className?: string;
}

export const ReportSummary: React.FC<ReportSummaryProps> = ({
  toolName,
  subtitle,
  date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }),
  unitSystem,
  status,
  inputs,
  assumptions,
  results,
  warnings = [],
  standards,
  recommendations = [],
  className = '',
}) => {
  const [copied, setCopied] = React.useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = `
=====================================================
PLANT RELIABILITY SIMULATION SUITE - ENGINEERING REPORT
=====================================================
Tool: ${toolName}
Date: ${date}
Unit System: ${unitSystem.toUpperCase()}
Status: ${status.toUpperCase()}

STANDARDS REFERENCED:
${standards.map((s) => `- ${s}`).join('\n')}

OPERATING INPUTS:
${inputs.map((i) => `- ${i.label}: ${i.value} ${i.unit || ''}`).join('\n')}

CALCULATED RESULTS:
${results.map((r) => `- ${r.label}: ${r.value} ${r.unit || ''}`).join('\n')}

ENGINEERING ASSUMPTIONS:
${assumptions.map((a) => `- ${a}`).join('\n')}

${warnings.length > 0 ? `WARNINGS & LIMIT VIOLATIONS:\n${warnings.map((w) => `[!] ${w}`).join('\n')}\n` : ''}
${recommendations.length > 0 ? `RECOMMENDATIONS:\n${recommendations.map((r) => `- ${r}`).join('\n')}\n` : ''}
DISCLAIMER:
"${DISCLAIMER_TEXT}"
=====================================================
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className={`p-6 rounded-sm bg-[#161b22] border border-[#30363d] text-[#d1d5db] flex flex-col gap-6 shadow-xl ${className}`}
    >
      {/* Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#30363d] pb-4 no-print">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#f27d26]" />
          <span className="text-xs font-mono font-bold uppercase text-white tracking-wider">
            Engineering Assessment Summary
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyText}
            className="px-3 py-1.5 rounded-sm bg-[#0d1117] border border-[#30363d] hover:border-[#f27d26] text-xs font-mono text-[#d1d5db] hover:text-white flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#3fb950]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Summary' : 'Copy Text'}</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-1.5 rounded-sm bg-[#f27d26] hover:bg-[#ff8f3d] text-black font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#30363d]">
        <div>
          <span className="text-[10px] font-mono text-[#f27d26] uppercase font-bold tracking-wider">
            Plant Reliability Simulation Suite • Technical Record
          </span>
          <h2 className="text-lg sm:text-xl font-bold font-mono text-white uppercase mt-0.5">
            {toolName}
          </h2>
          {subtitle && (
            <p className="text-xs text-[#8b949e] font-sans mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex flex-col items-start sm:items-end text-xs font-mono gap-1 shrink-0">
          <span className="text-[#8b949e]">Timestamp: <strong className="text-white">{date}</strong></span>
          <span className="text-[#8b949e]">System: <strong className="text-white">{unitSystem.toUpperCase()}</strong></span>
          <div className="mt-1">
            <span
              className={`px-2.5 py-0.5 rounded-sm text-[10px] font-mono font-bold uppercase ${
                status === 'safe'
                  ? 'bg-[#3fb95022] text-[#3fb950] border border-[#3fb95066]'
                  : status === 'warning'
                  ? 'bg-[#f27d2622] text-[#f27d26] border border-[#f27d2666]'
                  : 'bg-[#f8514922] text-[#f85149] border border-[#f8514966]'
              }`}
            >
              Overall Status: {status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Standards Referenced */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
        <span className="text-[#8b949e] uppercase font-bold">Standards:</span>
        {standards.map((s, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 rounded-sm bg-[#0d1117] border border-[#30363d] text-[#d1d5db] text-[11px]"
          >
            {s}
          </span>
        ))}
      </div>

      {/* Warnings & Limit Violations if present */}
      {warnings.length > 0 && (
        <div className="p-3.5 rounded-sm bg-[#f8514915] border border-[#f8514966] flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[#f85149] text-xs font-mono font-bold uppercase">
            <AlertTriangle className="w-4 h-4" />
            <span>Active Engineering Limit Violations</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-[#d1d5db]">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 2-Column Grid: Inputs & Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Operating Inputs */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider border-b border-[#30363d] pb-1.5">
            Operating Inputs
          </h3>
          <div className="flex flex-col gap-1.5 text-xs font-mono">
            {inputs.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-sm bg-[#0d1117] border border-[#30363d]/60"
              >
                <span className="text-[#8b949e]">{item.label}</span>
                <span className="font-bold text-white">
                  {item.value} {item.unit || ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Calculated Results */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider border-b border-[#30363d] pb-1.5">
            Key Calculated Results
          </h3>
          <div className="flex flex-col gap-1.5 text-xs font-mono">
            {results.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-sm bg-[#0d1117] border border-[#30363d]/60"
              >
                <span className="text-[#8b949e]">{item.label}</span>
                <span
                  className={`font-bold ${
                    item.status === 'safe'
                      ? 'text-[#3fb950]'
                      : item.status === 'warning'
                      ? 'text-[#f27d26]'
                      : item.status === 'critical'
                      ? 'text-[#f85149]'
                      : 'text-white'
                  }`}
                >
                  {item.value} {item.unit || ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assumptions & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-[#30363d]">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider mb-2">
            Engineering Assumptions
          </h3>
          <ul className="list-disc list-inside space-y-1 text-xs text-[#8b949e] font-sans">
            {assumptions.map((a, idx) => (
              <li key={idx}>{a}</li>
            ))}
          </ul>
        </div>

        {recommendations.length > 0 && (
          <div>
            <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider mb-2">
              Actionable Recommendations
            </h3>
            <ul className="list-disc list-inside space-y-1 text-xs text-[#d1d5db] font-sans">
              {recommendations.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Mandatory Engineering Disclaimer */}
      <div className="p-3.5 rounded-sm bg-[#0d1117] border border-[#30363d] text-[11px] leading-relaxed text-[#8b949e] flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-[#f27d26] shrink-0 mt-0.5" />
        <div>
          <strong className="text-white font-mono uppercase mr-1">
            Professional Engineering Disclaimer:
          </strong>
          <span>{DISCLAIMER_TEXT}</span>
        </div>
      </div>
    </div>
  );
};
