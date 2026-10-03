import React, { useState } from 'react';
import { AuditStep } from '../types/common';
import { X, BookOpen, CheckCircle2, AlertTriangle, Copy, Check, FileSpreadsheet } from 'lucide-react';

interface CalculationAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulatorTitle: string;
  auditTrail: AuditStep[];
}

export const CalculationAuditModal: React.FC<CalculationAuditModalProps> = ({
  isOpen,
  onClose,
  simulatorTitle,
  auditTrail,
}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyDerivations = () => {
    const lines: string[] = [];
    lines.push(`# [Mechanical Lab Pro] Mathematical Verification & Audit Trail`);
    lines.push(`## Asset: ${simulatorTitle}`);
    lines.push(`*Generated on: ${new Date().toLocaleString()}*`);
    lines.push(``);
    lines.push(`Formulas implement generalized classical engineering relationships and methods referencing industry engineering guidelines for educational simulation and diagnostic evaluation.`);
    lines.push(`Notice: Mechanical Lab Pro is an independent educational tool not affiliated with or endorsed by API, ISO, ASME, AGMA, or any standards body.`);
    lines.push(``);

    auditTrail.forEach((step, idx) => {
      lines.push(`### Step ${idx + 1}: ${step.title} [${step.standardRef}]`);
      lines.push(`- **Governing Formula:** \`${step.formula}\``);
      lines.push(`- **Substituted Values:** \`${step.substituted}\``);
      lines.push(`- **Result:** **\`${step.result} ${step.unit || ''}\`**`);
      if (step.isCompliant !== undefined) {
        lines.push(`- **Threshold Evaluation:** ${step.isCompliant ? 'PASS (Within Allowable Guideline Limit)' : 'ADVISORY (Threshold Exceedance)'}`);
      }
      lines.push(``);
    });

    navigator.clipboard.writeText(lines.join('\n'));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleExportCSV = () => {
    const lines: string[] = [];
    lines.push(`"Step","Title","Standard Reference","Governing Formula","Substituted Values","Calculated Result","Unit","Compliance Status"`);
    auditTrail.forEach((step, idx) => {
      lines.push(
        `"${idx + 1}","${step.title.replace(/"/g, '""')}","${step.standardRef.replace(/"/g, '""')}","${step.formula.replace(/"/g, '""')}","${step.substituted.replace(/"/g, '""')}","${step.result.toString().replace(/"/g, '""')}","${step.unit || ''}","${step.isCompliant === undefined ? 'N/A' : step.isCompliant ? 'PASS' : 'EXCEEDANCE'}"`
      );
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Audit_Trail_${simulatorTitle.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl max-h-[90vh] rounded-sm bg-[#161b22] border border-[#30363d] shadow-2xl flex flex-col overflow-hidden text-[#d1d5db]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#0d1117] border-b border-[#30363d] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-sm bg-[#f27d2622] border border-[#f27d26] flex items-center justify-center text-[#f27d26] shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white uppercase font-mono tracking-wide truncate">
                Calculation Audit Trail & Equations
              </h3>
              <p className="text-xs text-[#8b949e] font-mono truncate">
                {simulatorTitle} • Standards Citations & Step-by-Step Proofs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy Derivations */}
            <button
              type="button"
              onClick={handleCopyDerivations}
              className="px-3 py-1.5 rounded-sm bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white font-mono text-xs flex items-center gap-1.5 transition-all touch-manipulation min-h-[38px] cursor-pointer"
              title="Copy step-by-step mathematical proofs to clipboard"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#8b949e]" />
                  <span>Copy Proofs</span>
                </>
              )}
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-sm bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white font-mono text-xs flex items-center gap-1.5 transition-all touch-manipulation min-h-[38px] cursor-pointer"
              title="Download equations and substitution table as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-sm bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] text-[#d1d5db] flex items-center justify-center transition-colors touch-manipulation min-h-[38px] min-w-[38px] cursor-pointer"
              aria-label="Close calculation audit modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Audit Content List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-4">
          <div className="p-3 bg-[#f27d2610] border border-[#f27d26]/30 rounded-sm text-xs text-[#f27d26] font-mono">
            Every calculation in Mechanical Lab Pro follows public domain relationships derived from ISO, API, ASME, and Hydraulic Institute publications.
          </div>

          {auditTrail.map((step, idx) => (
            <div
              key={idx}
              className="p-4 rounded-sm bg-[#0d1117] border border-[#30363d] flex flex-col gap-2.5 hover:border-[#8b949e]/60 transition-colors"
            >
              {/* Step Header */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-sm bg-[#161b22] text-[10px] font-mono font-bold flex items-center justify-center text-[#f27d26] border border-[#30363d]">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-white font-mono uppercase">
                    {step.title}
                  </span>
                </div>
                <span className="text-[11px] font-mono bg-[#161b22] px-2 py-0.5 rounded-sm text-[#f27d26] border border-[#30363d]">
                  {step.standardRef}
                </span>
              </div>

              {/* Governing Formula */}
              <div className="p-2.5 rounded-sm bg-[#161b22] border border-[#30363d] font-mono text-xs text-[#f27d26] overflow-x-auto">
                <span className="text-[10px] uppercase tracking-wider text-[#8b949e] block mb-1">
                  Formula:
                </span>
                {step.formula}
              </div>

              {/* Substituted Numerical Values */}
              <div className="text-xs text-[#8b949e] font-mono leading-relaxed bg-[#161b22]/50 p-2 rounded-sm border border-[#30363d]">
                <span className="text-[10px] uppercase tracking-wider text-[#8b949e] block mb-0.5">
                  Substituted Values:
                </span>
                {step.substituted}
              </div>

              {/* Result Readout */}
              <div className="flex items-center justify-between pt-1 border-t border-[#30363d] flex-wrap gap-2">
                <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-bold text-white">
                  <span className="text-[#8b949e] font-normal text-xs uppercase">Result:</span>
                  <span className="text-[#3fb950]">{step.result}</span>
                  {step.unit && <span className="text-xs text-[#8b949e] font-normal">[{step.unit}]</span>}
                </div>

                {step.isCompliant !== undefined && (
                  <div
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold font-mono px-2 py-0.5 rounded-sm border ${
                      step.isCompliant
                        ? 'bg-[#23863622] text-[#3fb950] border-[#238636]'
                        : 'bg-[#f8514922] text-[#f85149] border-[#da3633]'
                    }`}
                  >
                    {step.isCompliant ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        WITHIN THRESHOLD
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        THRESHOLD EXCEEDED
                      </>
                    )}
                  </div>
                )}
              </div>

              {step.note && (
                <div className="text-[11px] text-[#f27d26] font-mono bg-[#f27d2610] p-2 rounded-sm border border-[#f27d26]/30">
                  💡 {step.note}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Modal Footer with Non-Affiliation Disclaimer */}
        <div className="p-3 bg-[#0d1117] border-t border-[#30363d] flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-[#8b949e]">
          <span className="leading-tight">
            Non-Affiliation: Reference codes (API, ISO, ASME, AGMA) used strictly for educational nominative comparison. No endorsement implied.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-sm bg-[#21262d] hover:bg-[#30363d] text-white font-bold font-mono uppercase text-xs transition-colors min-h-[38px] border border-[#30363d] shrink-0 cursor-pointer"
          >
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
};
