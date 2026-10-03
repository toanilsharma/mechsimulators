import React, { useRef, useState } from 'react';
import { StatusAssessment, AuditStep, UnitSystem } from '../types/common';
import {
  Printer,
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Download,
  Copy,
  Check,
  FileSpreadsheet,
  FileCode,
  Award,
  ShieldCheck,
} from 'lucide-react';
import { DISCLAIMER_TEXT } from './DisclaimerModal';
import { CERTIFICATE_DISCLAIMER_TEXT, STANDARDS_SAFE_DISCLAIMER_SHORT } from '../utils/standardsSafeHarbor';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulatorTitle: string;
  simulatorSubtitle: string;
  standardsCited: string[];
  status: StatusAssessment;
  auditTrail: AuditStep[];
  unitSystem: UnitSystem;
  inputSummary: { label: string; value: string }[];
  keyResults: { label: string; value: string; status?: 'safe' | 'warning' | 'critical' }[];
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  simulatorTitle,
  simulatorSubtitle,
  standardsCited,
  status,
  auditTrail,
  unitSystem,
  inputSummary,
  keyResults,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [reportMode, setReportMode] = useState<'report' | 'certificate'>('report');
  const [copiedFormat, setCopiedFormat] = useState<'markdown' | 'csv' | 'json' | null>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const timestampIso = new Date().toISOString();
  const filePrefix = `MechanicalLabPro_${simulatorTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}`;

  const buildCsvContent = (): string => {
    const lines: string[] = [];
    lines.push(`"MECHANICAL LAB PRO - RELIABILITY ENGINEERING ASSESSMENT"`);
    lines.push(`"Asset / Twin","${simulatorTitle.replace(/"/g, '""')}"`);
    lines.push(`"Scope / Standards","${simulatorSubtitle.replace(/"/g, '""')}"`);
    lines.push(`"Date","${currentDate}"`);
    lines.push(`"Unit System","${unitSystem === 'metric' ? 'SI Metric' : 'US Customary'}"`);
    lines.push(`"Assessment Verdict","${status.label}"`);
    lines.push(`"Reliability Score","${status.score}/100"`);
    lines.push(`"Governing Standards Reference","${standardsCited.join('; ')}"`);
    lines.push(``);
    lines.push(`"OPERATING INPUTS"`);
    lines.push(`"Parameter","Value"`);
    inputSummary.forEach((item) => {
      lines.push(`"${item.label.replace(/"/g, '""')}","${item.value.replace(/"/g, '""')}"`);
    });
    lines.push(``);
    lines.push(`"KEY PERFORMANCE INDICATORS"`);
    lines.push(`"Metric","Value","Status"`);
    keyResults.forEach((item) => {
      lines.push(`"${item.label.replace(/"/g, '""')}","${item.value.replace(/"/g, '""')}","${item.status || 'safe'}"`);
    });
    lines.push(``);
    lines.push(`"RECOMMENDATIONS & ACTIONS"`);
    status.recommendations.forEach((rec, idx) => {
      lines.push(`"${idx + 1}","${rec.replace(/"/g, '""')}"`);
    });
    lines.push(``);
    lines.push(`"MATHEMATICAL AUDIT TRAIL"`);
    lines.push(`"Step","Title","Standard Reference","Governing Formula","Substituted Values","Result","Unit"`);
    auditTrail.forEach((step, idx) => {
      lines.push(
        `"${idx + 1}","${step.title.replace(/"/g, '""')}","${step.standardRef.replace(/"/g, '""')}","${step.formula.replace(/"/g, '""')}","${step.substituted.replace(/"/g, '""')}","${step.result.toString().replace(/"/g, '""')}","${step.unit || ''}"`
      );
    });
    lines.push(``);
    lines.push(`"DISCLAIMER","${DISCLAIMER_TEXT.replace(/"/g, '""')}"`);
    return lines.join('\n');
  };

  const handleExportCSV = () => {
    const csvData = buildCsvContent();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filePrefix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const exportData = {
      suite: 'Mechanical Lab Pro',
      version: '2.4.0-industrial',
      generatedAt: timestampIso,
      simulator: {
        title: simulatorTitle,
        subtitle: simulatorSubtitle,
        standardsCited,
        unitSystem,
      },
      assessment: {
        verdict: status.label,
        statusLevel: status.level,
        score: status.score,
        summaryMessage: status.message,
        recommendations: status.recommendations,
      },
      operatingInputs: inputSummary,
      keyPerformanceIndicators: keyResults,
      mathematicalAuditTrail: auditTrail,
      disclaimer: DISCLAIMER_TEXT,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filePrefix}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = () => {
    const lines: string[] = [];
    lines.push(`# [Mechanical Lab Pro] Engineering Assessment Report`);
    lines.push(`## ${simulatorTitle}`);
    lines.push(`*${simulatorSubtitle}*`);
    lines.push(``);
    lines.push(`- **Date:** ${currentDate}`);
    lines.push(`- **Unit System:** ${unitSystem === 'metric' ? 'SI Metric (ISO)' : 'US Customary (Imperial)'}`);
    lines.push(`- **Verdict:** **${status.label.toUpperCase()}** (Reliability Score: ${status.score}/100)`);
    lines.push(`- **Governing Standards:** ${standardsCited.join(' • ')}`);
    lines.push(``);
    lines.push(`### Executive Summary`);
    lines.push(`${status.message}`);
    lines.push(``);
    lines.push(`### 1. Operating & Geometric Inputs`);
    lines.push(`| Parameter | Value |`);
    lines.push(`|:---|:---|`);
    inputSummary.forEach((item) => {
      lines.push(`| ${item.label} | \`${item.value}\` |`);
    });
    lines.push(``);
    lines.push(`### 2. Key Performance Indicators`);
    lines.push(`| Metric | Value | Status |`);
    lines.push(`|:---|:---|:---|`);
    keyResults.forEach((item) => {
      lines.push(`| ${item.label} | **${item.value}** | \`${item.status?.toUpperCase() || 'SAFE'}\` |`);
    });
    lines.push(``);
    if (status.recommendations.length > 0) {
      lines.push(`### 3. Engineering Recommendations & Mitigations`);
      status.recommendations.forEach((rec, idx) => {
        lines.push(`${idx + 1}. ${rec}`);
      });
      lines.push(``);
    }
    lines.push(`### 4. Mathematical Verification Audit Trail`);
    auditTrail.forEach((step, idx) => {
      lines.push(`#### Step ${idx + 1}: ${step.title} [${step.standardRef}]`);
      lines.push(`- **Formula:** \`${step.formula}\``);
      lines.push(`- **Substituted:** \`${step.substituted}\``);
      lines.push(`- **Result:** **\`${step.result} ${step.unit || ''}\`**`);
      lines.push(``);
    });
    lines.push(`---`);
    lines.push(`*Generated by Mechanical Lab Pro. Verification strictly for preliminary engineering review per ${standardsCited[0] || 'API/ISO Standards'}.*`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedFormat('markdown');
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[92vh] rounded-sm bg-[#161b22] border border-[#30363d] shadow-2xl flex flex-col overflow-hidden text-[#d1d5db]">
        {/* Controls Bar (Hidden during printing) */}
        <div className="p-3 sm:p-4 bg-[#0d1117] border-b border-[#30363d] flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-5 h-5 text-[#f27d26] shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-xs sm:text-sm text-white font-mono uppercase tracking-wide truncate block">
                {reportMode === 'report' ? 'Engineering Assessment Summary Report' : 'Tolerancing Compliance Certificate'}
              </span>
              <span className="text-[10px] text-[#8b949e] font-mono hidden sm:inline">
                Independent Benchmark Audit Trail & Tolerancing Suite (Nominative Fair Use)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-[#161b22] p-0.5 rounded border border-[#30363d] mr-1">
              <button
                type="button"
                onClick={() => setReportMode('report')}
                className={`px-2.5 py-1 text-xs font-mono rounded-sm transition-all cursor-pointer flex items-center gap-1 ${
                  reportMode === 'report'
                    ? 'bg-[#30363d] text-white font-bold'
                    : 'text-[#8b949e] hover:text-white'
                }`}
              >
                <FileText size={12} />
                <span>Report</span>
              </button>
              <button
                type="button"
                onClick={() => setReportMode('certificate')}
                className={`px-2.5 py-1 text-xs font-mono rounded-sm transition-all cursor-pointer flex items-center gap-1 ${
                  reportMode === 'certificate'
                    ? 'bg-[#f27d26] text-black font-bold'
                    : 'text-[#8b949e] hover:text-white'
                }`}
              >
                <Award size={12} />
                <span>Certificate (PDF)</span>
              </button>
            </div>

            {/* Copy Markdown */}
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="px-2.5 sm:px-3 py-1.5 rounded-sm bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white font-mono text-xs flex items-center gap-1.5 transition-all touch-manipulation min-h-[38px] cursor-pointer"
              title="Copy formatted Markdown report to clipboard"
            >
              {copiedFormat === 'markdown' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#8b949e]" />
                  <span>Markdown</span>
                </>
              )}
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-2.5 sm:px-3 py-1.5 rounded-sm bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white font-mono text-xs flex items-center gap-1.5 transition-all touch-manipulation min-h-[38px] cursor-pointer"
              title="Download RFC 4180 CSV dataset with inputs, KPIs, and audit trail"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>

            {/* Export JSON */}
            <button
              type="button"
              onClick={handleExportJSON}
              className="px-2.5 sm:px-3 py-1.5 rounded-sm bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white font-mono text-xs flex items-center gap-1.5 transition-all touch-manipulation min-h-[38px] cursor-pointer"
              title="Download high-precision JSON telemetry dataset"
            >
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
              <span>JSON</span>
            </button>

            {/* Print / Save PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 sm:px-4 py-1.5 rounded-sm bg-[#f27d26] hover:bg-[#ff8f3d] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-[#f27d2622] transition-all touch-manipulation min-h-[38px] cursor-pointer"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>{reportMode === 'certificate' ? 'Print / Export PDF' : 'Print / PDF'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-sm bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] text-[#d1d5db] flex items-center justify-center transition-colors min-h-[38px] min-w-[38px] cursor-pointer"
              aria-label="Close Report"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document (Report Mode or Certificate Mode) */}
        <div
          ref={reportRef}
          className="p-5 sm:p-8 overflow-y-auto bg-[#0d1117] text-[#d1d5db] flex flex-col gap-6 font-sans print:bg-white print:text-black print:p-6"
        >
          {reportMode === 'certificate' ? (
            /* ========================================================================= */
            /* TOLERANCING & COMPLIANCE CERTIFICATE PDF EXPORT VIEW                      */
            /* ========================================================================= */
            <div className="relative border-4 border-amber-600/40 p-5 sm:p-8 rounded-lg bg-[#0b0e14] text-[#c9d1d9] print:bg-white print:text-black print:border-amber-700 shadow-2xl flex flex-col gap-6 font-mono select-none">
              {/* Top Certificate Guilloche Accent */}
              <div className="border-b-2 border-amber-500/60 pb-4 text-center relative">
                <div className="flex items-center justify-center gap-2 text-amber-400 print:text-amber-700 mb-1">
                  <Award className="w-7 h-7" />
                  <span className="text-[11px] font-bold uppercase tracking-widest">
                    Independent Engineering Simulation Audit
                  </span>
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white print:text-black uppercase tracking-wider font-mono">
                  Certificate of Machinery Tolerancing & Verification
                </h1>
                <p className="text-xs text-[#8b949e] print:text-slate-600 mt-1">
                  Autonomous Physical Simulation Assessment • Educational Benchmark Screening
                </p>

                {/* Certificate Meta Details */}
                <div className="flex flex-wrap justify-between items-center text-[11px] text-[#8b949e] print:text-slate-700 mt-4 pt-3 border-t border-[#30363d] print:border-slate-300">
                  <div>
                    <span className="text-white print:text-black font-bold">Certificate ID: </span>
                    <span className="text-amber-400 print:text-amber-800">
                      MLP-TOL-{Date.now().toString(36).toUpperCase()}-VERIFIED
                    </span>
                  </div>
                  <div>
                    <span className="text-white print:text-black font-bold">Issued: </span>
                    <span>{currentDate}</span>
                  </div>
                  <div>
                    <span className="text-white print:text-black font-bold">Units: </span>
                    <span>{unitSystem === 'metric' ? 'SI Metric (ISO)' : 'US Customary (Imperial)'}</span>
                  </div>
                </div>
              </div>

              {/* Machine Asset Identifier */}
              <div className="p-3.5 bg-[#161b22] print:bg-slate-100 border border-[#30363d] print:border-slate-300 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase text-[#8b949e] print:text-slate-600">Simulated Digital Twin Asset</div>
                  <div className="text-base font-bold text-white print:text-black">{simulatorTitle}</div>
                  <div className="text-xs text-[#8b949e] print:text-slate-600">{simulatorSubtitle}</div>
                </div>
                <div className="text-right sm:text-right">
                  <span className="text-[10px] uppercase text-[#8b949e] print:text-slate-600 block">Overall Verdict</span>
                  <span
                    className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                      status.level === 'safe'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500 print:bg-emerald-100 print:text-emerald-900'
                        : status.level === 'warning'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-500 print:bg-amber-100 print:text-amber-900'
                        : 'bg-rose-950/80 text-rose-300 border border-rose-500 print:bg-rose-100 print:text-rose-900'
                    }`}
                  >
                    {status.label} • Score: {status.score}/100
                  </span>
                </div>
              </div>

              {/* Reference Benchmarks Notice */}
              <div className="text-xs text-[#8b949e] print:text-slate-700">
                <span className="font-bold text-white print:text-black mr-2">Nominative Reference Benchmarks:</span>
                {standardsCited.map((s, i) => (
                  <span
                    key={i}
                    className="inline-block bg-[#161b22] print:bg-slate-200 text-amber-400 print:text-amber-800 px-2 py-0.5 rounded border border-[#30363d] print:border-slate-300 text-[10px] mr-1.5 mb-1"
                  >
                    {s} (Reference Guideline)
                  </span>
                ))}
              </div>

              {/* Tolerancing Compliance Audit Table */}
              <div className="flex flex-col gap-1.5">
                <div className="text-xs font-bold uppercase text-white print:text-black flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400 print:text-amber-700" />
                  <span>Dimensional & Physical Tolerancing Assessment Matrix</span>
                </div>
                <div className="overflow-x-auto border border-[#30363d] print:border-slate-300 rounded">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#161b22] print:bg-slate-200 text-[#8b949e] print:text-slate-700 border-b border-[#30363d] print:border-slate-300 text-[10px] uppercase">
                        <th className="py-2 px-3">Inspected Metric</th>
                        <th className="py-2 px-3">Computed Twin Value</th>
                        <th className="py-2 px-3">Reference Benchmark Target</th>
                        <th className="py-2 px-3 text-right">Tolerance Verdict</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#21262d] print:divide-slate-200">
                      {keyResults.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#161b22]/50 print:hover:bg-transparent">
                          <td className="py-2.5 px-3 font-medium text-white print:text-black">{item.label}</td>
                          <td className="py-2.5 px-3 font-bold text-amber-300 print:text-amber-900">{item.value}</td>
                          <td className="py-2.5 px-3 text-[#8b949e] print:text-slate-600">
                            {standardsCited[idx % standardsCited.length] || 'Industry Engineering Practice'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.status === 'safe' || !item.status
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500 print:bg-emerald-100 print:text-emerald-800'
                                  : item.status === 'warning'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-500 print:bg-amber-100 print:text-amber-800'
                                  : 'bg-rose-950 text-rose-300 border border-rose-500 print:bg-rose-100 print:text-rose-800'
                              }`}
                            >
                              {item.status === 'safe' || !item.status ? 'WITHIN TOLERANCE' : 'EXCEEDS TOLERANCE'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Governing Mathematical Formulation Trail */}
              <div className="flex flex-col gap-1.5">
                <div className="text-xs font-bold uppercase text-white print:text-black">
                  Traceable Mathematical Verification Formulations
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {auditTrail.slice(0, 4).map((step, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#161b22] print:bg-slate-100 border border-[#30363d] print:border-slate-300 rounded text-[11px]"
                    >
                      <div className="font-bold text-white print:text-black flex justify-between">
                        <span>{step.title}</span>
                        <span className="text-amber-400 print:text-amber-800">[{step.standardRef}]</span>
                      </div>
                      <div className="text-[#8b949e] print:text-slate-600 font-mono mt-0.5 text-[10px]">
                        Formula: {step.formula}
                      </div>
                      <div className="text-emerald-400 print:text-emerald-800 font-bold mt-0.5">
                        Output: {step.result} {step.unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CRITICAL LEGAL SAFE HARBOR & NON-AFFILIATION NOTICE */}
              <div className="p-3.5 bg-[#080b10] print:bg-slate-50 border-2 border-amber-600/60 print:border-amber-700 rounded text-[10px] text-[#8b949e] print:text-slate-700 leading-relaxed space-y-1.5">
                <div className="text-amber-400 print:text-amber-800 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span>MANDATORY NON-AFFILIATION & INDEPENDENT BENCHMARK DECLARATION</span>
                </div>
                <p className="font-mono text-justify">
                  {CERTIFICATE_DISCLAIMER_TEXT}
                </p>
                <p className="font-mono text-justify text-[#6e7681] print:text-slate-500">
                  {STANDARDS_SAFE_DISCLAIMER_SHORT}
                </p>
              </div>

              {/* Engineering Attestation & Sign-off Block */}
              <div className="pt-3 border-t border-[#30363d] print:border-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-4 text-[10px] text-[#8b949e] print:text-slate-700">
                <div className="border-t border-dashed border-[#484f58] pt-1">
                  <div className="text-white print:text-black font-bold">Analytical Engine:</div>
                  <div>Mechanical Lab Pro Physics Core v2.4</div>
                  <div className="text-[9px] text-[#6e7681]">Deterministic Analytical Solvers</div>
                </div>

                <div className="border-t border-dashed border-[#484f58] pt-1">
                  <div className="text-white print:text-black font-bold">Lead Simulation Analyst:</div>
                  <div>Autonomous Digital Twin Agent</div>
                  <div className="text-[9px] text-[#6e7681]">Verification Hash: SHA256-MLP-AUDIT</div>
                </div>

                <div className="border-t border-dashed border-[#484f58] pt-1">
                  <div className="text-white print:text-black font-bold">Reviewing Professional Engineer:</div>
                  <div className="italic text-[#6e7681]">Signature / Stamp / PE Licensure Required</div>
                  <div className="text-[9px] text-[#6e7681]">For Plant Field Execution</div>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* STANDARD EXECUTIVE ENGINEERING REPORT VIEW                                */
            /* ========================================================================= */
            <>
              {/* Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[#f27d26] pb-4 gap-3">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#f27d26] print:text-[#f27d26]">
                    MECHANICAL LAB PRO • RELIABILITY ENGINEERING SUITE
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white print:text-black mt-0.5 font-mono">
                    {simulatorTitle}
                  </h1>
                  <p className="text-xs text-[#8b949e] print:text-slate-600">
                    {simulatorSubtitle}
                  </p>
                </div>

                <div className="text-right flex flex-col sm:items-end text-xs font-mono text-[#8b949e] print:text-slate-600">
                  <span>Date: {currentDate}</span>
                  <span>Units: {unitSystem === 'metric' ? 'SI Metric (ISO)' : 'US Customary (Imperial)'}</span>
                  <span className="text-[#f27d26] print:text-[#f27d26] font-bold">Status: {status.label}</span>
                </div>
              </div>

              {/* Standards & Methodologies Citation */}
              <div className="flex flex-wrap gap-1.5 items-center text-xs">
                <span className="font-semibold text-[#8b949e] print:text-slate-700 mr-1 font-mono uppercase">
                  Industry Reference Benchmarks (Nominative Citation):
                </span>
                {standardsCited.map((std, i) => (
                  <span
                    key={i}
                    className="bg-[#161b22] print:bg-slate-200 print:text-black text-[#f27d26] font-mono px-2 py-0.5 rounded-sm text-[11px] border border-[#30363d] print:border-slate-300"
                  >
                    {std}
                  </span>
                ))}
              </div>

              {/* Health & Overall Verdict Box */}
              <div
                className={`p-4 rounded-sm border flex flex-col gap-2 font-mono ${
                  status.level === 'safe'
                    ? 'bg-[#23863622] border-[#238636] text-[#3fb950] print:bg-emerald-50 print:text-emerald-900 print:border-emerald-500'
                    : status.level === 'warning'
                    ? 'bg-[#f27d2622] border-[#f27d26] text-[#f27d26] print:bg-amber-50 print:text-amber-900 print:border-amber-500'
                    : 'bg-[#f8514922] border-[#da3633] text-[#f85149] print:bg-rose-50 print:text-rose-900 print:border-rose-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
                    {status.level === 'safe' && <CheckCircle2 className="w-5 h-5 text-[#3fb950] print:text-emerald-700" />}
                    {status.level === 'warning' && <AlertTriangle className="w-5 h-5 text-[#f27d26] print:text-amber-700" />}
                    {status.level === 'critical' && <AlertOctagon className="w-5 h-5 text-[#f85149] print:text-rose-700" />}
                    <span>Assessment Verdict: {status.label}</span>
                  </div>
                  <span className="font-mono font-bold text-xs bg-[#161b22] print:bg-slate-200 px-2.5 py-1 rounded-sm border border-[#30363d]">
                    Reliability Score: {status.score}/100
                  </span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-[#d1d5db] print:text-slate-800 font-sans">
                  {status.message}
                </p>
              </div>

              {/* Input & Output Parameters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Inputs Summary Table */}
                <div className="flex flex-col gap-2 p-3.5 rounded-sm bg-[#161b22] print:bg-slate-100 border border-[#30363d] print:border-slate-300">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8b949e] print:text-slate-700 font-mono">
                    Operating & Geometric Inputs
                  </span>
                  <div className="flex flex-col divide-y divide-[#30363d] print:divide-slate-300 text-xs">
                    {inputSummary.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-1.5">
                        <span className="text-[#8b949e] print:text-slate-600">{item.label}</span>
                        <span className="font-mono font-semibold text-white print:text-slate-900">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Calculated Outputs */}
                <div className="flex flex-col gap-2 p-3.5 rounded-sm bg-[#161b22] print:bg-slate-100 border border-[#30363d] print:border-slate-300">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8b949e] print:text-slate-700 font-mono">
                    Key Performance Indicators
                  </span>
                  <div className="flex flex-col divide-y divide-[#30363d] print:divide-slate-300 text-xs">
                    {keyResults.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1.5">
                        <span className="text-[#8b949e] print:text-slate-600">{item.label}</span>
                        <span
                          className={`font-mono font-bold ${
                            item.status === 'safe'
                              ? 'text-[#3fb950] print:text-emerald-700'
                              : item.status === 'warning'
                              ? 'text-[#f27d26] print:text-amber-700'
                              : item.status === 'critical'
                              ? 'text-[#f85149] print:text-rose-700'
                              : 'text-white print:text-slate-900'
                          }`}
                        >
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendations Checklist */}
              {status.recommendations.length > 0 && (
                <div className="p-3.5 rounded-sm bg-[#161b22] print:bg-slate-50 border border-[#30363d] print:border-slate-300 flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#f27d26] print:text-[#f27d26] font-mono">
                    Engineering Action Items & Mitigations
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#d1d5db] print:text-slate-800 list-disc list-inside">
                    {status.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Step-by-Step Calculation Audit Trail */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8b949e] print:text-slate-700 font-mono">
                  Mathematical Verification & Audit Trail
                </span>
                <div className="space-y-2">
                  {auditTrail.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-sm bg-[#161b22] print:bg-slate-100 border border-[#30363d] print:border-slate-300 text-xs font-mono"
                    >
                      <div className="flex justify-between text-white print:text-slate-900 font-bold mb-1">
                        <span>{idx + 1}. {step.title}</span>
                        <span className="text-[#f27d26] print:text-[#f27d26]">[{step.standardRef}]</span>
                      </div>
                      <div className="text-[11px] text-[#f27d26] print:text-slate-800">Formula: {step.formula}</div>
                      <div className="text-[11px] text-[#8b949e] print:text-slate-600 mt-0.5">Input: {step.substituted}</div>
                      <div className="text-[11px] text-[#3fb950] print:text-emerald-700 font-bold mt-0.5">
                        Result = {step.result} {step.unit && `[${step.unit}]`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Disclaimer & Legal Non-Affiliation */}
              <div className="pt-4 border-t border-[#30363d] print:border-slate-400 text-[10px] text-[#8b949e] print:text-slate-600 space-y-1.5">
                <div className="italic">
                  "{DISCLAIMER_TEXT}"
                </div>
                <div className="text-[9px] text-[#6e7681] print:text-slate-500 leading-normal">
                  <strong>Non-Affiliation Notice:</strong> Standards codes (API, ISO, ASME, AGMA, HI) and acronyms are used strictly for educational reference and nominative technical identification. This software is an independent engineering tool and is not affiliated with, sponsored by, endorsed by, or approved by any standards organization or regulatory agency.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
