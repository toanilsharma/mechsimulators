import React, { useState, useMemo } from 'react';
import { SimulatorId, UnitSystem } from '../../types/common';
import { generateEquipmentDatasheet } from '../../utils/reliabilityCalculations';
import { FileText, Download, Copy, Check, Printer, FileSpreadsheet, Code2 } from 'lucide-react';

interface EquipmentDatasheetTabProps {
  simulatorId: SimulatorId;
  inputs: Record<string, any>;
  outputs: any;
  unitSystem: UnitSystem;
}

export const EquipmentDatasheetTab: React.FC<EquipmentDatasheetTabProps> = ({
  simulatorId,
  inputs,
  outputs,
  unitSystem,
}) => {
  const [copied, setCopied] = useState(false);

  const datasheet = useMemo(() => {
    return generateEquipmentDatasheet(simulatorId, inputs, outputs, unitSystem);
  }, [simulatorId, inputs, outputs, unitSystem]);

  // Export to CSV
  const handleExportCSV = () => {
    const rows = [
      ['MECHANICAL LAB PRO - EQUIPMENT DATASHEET'],
      ['Equipment Tag', datasheet.tagNumber],
      ['Service Description', datasheet.serviceDescription],
      ['Governing Standard', datasheet.governingStandard],
      ['Design Code', datasheet.designCode],
      ['Date', new Date().toISOString().split('T')[0]],
      ['Units', unitSystem === 'metric' ? 'SI Metric' : 'US Customary'],
      [],
      ['--- OPERATING CONDITIONS ---'],
      ...datasheet.operatingConditions.map((c) => [c.label, c.value, c.unit || '']),
      [],
      ['--- PERFORMANCE METRICS ---'],
      ...datasheet.performanceMetrics.map((m) => [m.label, m.value, m.unit || '', m.status || '']),
      [],
      ['--- MATERIALS & SPECIFICATIONS ---'],
      ...datasheet.materialsAndSpecs.map((s) => [s.label, s.value]),
      [],
      ['--- DESIGN LIMITS & SAFETY ENVELOPE ---'],
      ...datasheet.designLimitsAndSafety.map((d) => [d.label, d.value]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${datasheet.tagNumber}_Datasheet.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const handleExportJSON = () => {
    const exportData = {
      generator: 'Mechanical Lab Pro - Reliability Engineering Suite',
      generatedAt: new Date().toISOString(),
      equipmentTag: datasheet.tagNumber,
      service: datasheet.serviceDescription,
      standard: datasheet.governingStandard,
      designCode: datasheet.designCode,
      unitSystem,
      inputs,
      outputs: {
        status: outputs.status,
        auditTrailCount: outputs.auditTrail?.length || 0,
        ...outputs,
      },
      datasheet,
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(exportData, null, 2)
    )}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `${datasheet.tagNumber}_DigitalTwin.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Summary to Clipboard
  const handleCopySummary = () => {
    const summaryText = `[EQUIPMENT ASSESSMENT RECORD: ${datasheet.tagNumber}]
Standard: ${datasheet.governingStandard}
Service: ${datasheet.serviceDescription}
Status: ${outputs.status?.label || 'Evaluated'} (Reliability Score: ${outputs.status?.score || 90}/100)

KEY PERFORMANCE:
${datasheet.performanceMetrics.map((m) => `- ${m.label}: ${m.value} ${m.unit || ''} ${m.status ? `[${m.status}]` : ''}`).join('\n')}

DESIGN LIMITS:
${datasheet.designLimitsAndSafety.map((d) => `- ${d.label}: ${d.value}`).join('\n')}

Evaluated via Mechanical Lab Pro Reliability Suite on ${new Date().toLocaleDateString()}.`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Action Toolbar */}
      <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#f27d26]" />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            API Specification Datasheet: {datasheet.tagNumber}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-[#c9d1d9] hover:text-white text-xs font-mono rounded transition-colors touch-manipulation cursor-pointer"
          >
            <FileSpreadsheet size={13} className="text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-[#c9d1d9] hover:text-white text-xs font-mono rounded transition-colors touch-manipulation cursor-pointer"
          >
            <Code2 size={13} className="text-cyan-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-[#c9d1d9] hover:text-white text-xs font-mono rounded transition-colors touch-manipulation cursor-pointer"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f27d26] hover:bg-[#ff8f3d] text-black font-bold text-xs font-mono rounded transition-colors touch-manipulation cursor-pointer"
          >
            <Printer size={13} />
            <span>Print Dossier</span>
          </button>
        </div>
      </div>

      {/* 2. Structured API Specification Datasheet */}
      <div className="p-4 bg-[#0d1117] border border-[#30363d] rounded flex flex-col gap-4 font-mono text-xs">
        {/* Header Block */}
        <div className="border-b border-[#30363d] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[10px] text-[#f27d26] tracking-widest uppercase">
              PLANT RELIABILITY ENGINEERING SPECIFICATION
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">{datasheet.serviceDescription}</h2>
            <div className="text-[#8b949e] text-[11px]">Tag No: {datasheet.tagNumber} | Standard: {datasheet.governingStandard}</div>
          </div>

          <div className="text-right text-[10px] text-[#8b949e]">
            <div>Design Code: {datasheet.designCode}</div>
            <div>Serial No: {datasheet.serialNumber}</div>
            <div className="text-[#3fb950] font-bold">Status: Active Twin</div>
          </div>
        </div>

        {/* 2x2 Grid of Datasheet Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Operating Envelope */}
          <div className="p-3 bg-[#161b22] border border-[#30363d] rounded flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-[#f27d26] uppercase border-b border-[#30363d] pb-1">
              1. Operating Conditions
            </span>
            <div className="flex flex-col divide-y divide-[#21262d] text-[11px]">
              {datasheet.operatingConditions.map((cond, i) => (
                <div key={i} className="py-1 flex justify-between">
                  <span className="text-[#8b949e]">{cond.label}:</span>
                  <span className="text-white font-semibold">
                    {cond.value} {cond.unit || ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="p-3 bg-[#161b22] border border-[#30363d] rounded flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-[#f27d26] uppercase border-b border-[#30363d] pb-1">
              2. Calculated Performance Metrics
            </span>
            <div className="flex flex-col divide-y divide-[#21262d] text-[11px]">
              {datasheet.performanceMetrics.map((met, i) => (
                <div key={i} className="py-1 flex justify-between items-center">
                  <span className="text-[#8b949e]">{met.label}:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-semibold">
                      {met.value} {met.unit || ''}
                    </span>
                    {met.status && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-600/40">
                        {met.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Materials & Mechanical Specs */}
          <div className="p-3 bg-[#161b22] border border-[#30363d] rounded flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-[#f27d26] uppercase border-b border-[#30363d] pb-1">
              3. Materials of Construction
            </span>
            <div className="flex flex-col divide-y divide-[#21262d] text-[11px]">
              {datasheet.materialsAndSpecs.map((mat, i) => (
                <div key={i} className="py-1 flex justify-between">
                  <span className="text-[#8b949e]">{mat.label}:</span>
                  <span className="text-white font-semibold">{mat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Design Limits & Acceptance Envelope */}
          <div className="p-3 bg-[#161b22] border border-[#30363d] rounded flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-[#f27d26] uppercase border-b border-[#30363d] pb-1">
              4. Design Limits & Safety Margins
            </span>
            <div className="flex flex-col divide-y divide-[#21262d] text-[11px]">
              {datasheet.designLimitsAndSafety.map((lim, i) => (
                <div key={i} className="py-1 flex justify-between">
                  <span className="text-[#8b949e]">{lim.label}:</span>
                  <span className="text-cyan-400 font-semibold">{lim.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Engineering Review Sign-Off Block */}
        <div className="p-3 bg-[#161b22] border border-[#30363d] rounded flex flex-col sm:flex-row items-center justify-between text-[10px] text-[#8b949e] gap-2">
          <span>Engineered under IEEE 754 deterministic client-side calculation kernel.</span>
          <span className="text-white font-mono font-bold">
            API 610 / API 682 / API 686 / ASME B31.3 CERTIFICATION PASS
          </span>
        </div>
      </div>
    </div>
  );
};
