import React from 'react';
import { SpectralDiagnosis, MachineryClass } from '../../types/spectralLab';
import { ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2, FileText, Download, Activity, Gauge } from 'lucide-react';

interface DiagnosticEvaluationCardProps {
  diagnosis: SpectralDiagnosis;
  machineryClass: MachineryClass;
  onChangeMachineryClass: (cls: MachineryClass) => void;
  isRigidFoundation: boolean;
  onToggleFoundation: (isRigid: boolean) => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
}

export const DiagnosticEvaluationCard: React.FC<DiagnosticEvaluationCardProps> = ({
  diagnosis,
  machineryClass,
  onChangeMachineryClass,
  isRigidFoundation,
  onToggleFoundation,
  onExportCSV,
  onExportJSON,
}) => {
  const getZoneBadgeColor = (zone: string) => {
    switch (zone) {
      case 'A':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50';
      case 'B':
        return 'bg-blue-950/60 text-blue-300 border-blue-500/50';
      case 'C':
        return 'bg-amber-950/60 text-amber-300 border-amber-500/50';
      case 'D':
      default:
        return 'bg-red-950/60 text-red-300 border-red-500/50';
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full bg-slate-900/50 p-4 rounded-lg border border-slate-800">
      {/* Top Banner: ISO Zone & Overall Health */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg border flex items-center justify-center font-mono text-xl font-bold ${getZoneBadgeColor(diagnosis.isoZone)}`}>
            ZONE {diagnosis.isoZone}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-mono font-bold text-slate-200">
                {diagnosis.isoZoneLabel}
              </h4>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Primary Diagnostic: <span className="text-blue-300 font-semibold">{diagnosis.primaryDefect}</span> ({diagnosis.confidencePercent}% confidence)
            </p>
          </div>
        </div>

        {/* Machinery Class & Foundation Standard Selector */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400">ISO 10816-3 Group:</span>
            <select
              value={machineryClass}
              onChange={(e) => onChangeMachineryClass(e.target.value as MachineryClass)}
              className="px-2 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono"
            >
              <option value="Class_I">Class I (&lt; 15 kW)</option>
              <option value="Class_II">Class II (15-75 kW / Pump)</option>
              <option value="Class_III">Class III (&gt; 300 kW Rigid)</option>
              <option value="Class_IV">Class IV (&gt; 300 kW Flexible)</option>
            </select>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400">Foundation:</span>
            <button
              onClick={() => onToggleFoundation(!isRigidFoundation)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono"
            >
              {isRigidFoundation ? 'Rigid / Grouted' : 'Flexible / Skid'}
            </button>
          </div>
        </div>
      </div>

      {/* Vibration Triad Metrics (Velocity, Displacement, Acceleration) */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded bg-slate-950/60 border border-slate-800 text-xs font-mono">
          <span className="text-slate-400 block text-[11px]">Overall Velocity (ISO 10816)</span>
          <div className="text-lg font-bold text-blue-300 mt-1">
            {diagnosis.overallVelocityRms} <span className="text-xs font-normal text-slate-400">mm/s RMS</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Primary standard metric</span>
        </div>

        <div className="p-3 rounded bg-slate-950/60 border border-slate-800 text-xs font-mono">
          <span className="text-slate-400 block text-[11px]">Peak Displacement (ISO 7919)</span>
          <div className="text-lg font-bold text-cyan-300 mt-1">
            {diagnosis.overallDisplacementPkPk} <span className="text-xs font-normal text-slate-400">µm pk-pk</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Shaft relative motion</span>
        </div>

        <div className="p-3 rounded bg-slate-950/60 border border-slate-800 text-xs font-mono">
          <span className="text-slate-400 block text-[11px]">Peak Acceleration</span>
          <div className="text-lg font-bold text-purple-300 mt-1">
            {diagnosis.overallAccelerationG} <span className="text-xs font-normal text-slate-400">g RMS</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">High-freq impacts & bearing spalls</span>
        </div>
      </div>

      {/* ISO 10816 Visual Zone Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-[11px] font-mono text-slate-400">
          <span>Zone A (Good)</span>
          <span>Zone B (Acceptable)</span>
          <span>Zone C (Alert)</span>
          <span>Zone D (Danger / Trip)</span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden flex">
          <div className="h-full bg-emerald-500 w-1/4" title="Zone A: Good" />
          <div className="h-full bg-blue-500 w-1/4" title="Zone B: Acceptable" />
          <div className="h-full bg-amber-500 w-1/4" title="Zone C: Restricted" />
          <div className="h-full bg-red-500 w-1/4" title="Zone D: Unacceptable" />
        </div>
      </div>

      {/* Diagnostic Findings & Corrective Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        {/* Fault Findings */}
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
            Observed Spectral Fault Findings
          </span>
          {diagnosis.faultFindings.length === 0 ? (
            <div className="p-2.5 rounded bg-slate-950/40 border border-slate-800 text-xs text-slate-400">
              No anomalous fault frequencies detected. Rotor operating within normal limits.
            </div>
          ) : (
            diagnosis.faultFindings.map((f, i) => (
              <div
                key={i}
                className="p-2.5 rounded bg-slate-950/60 border border-slate-800 flex flex-col gap-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{f.title}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                      f.severity === 'critical'
                        ? 'bg-red-950/60 text-red-300 border border-red-500/40'
                        : f.severity === 'warning'
                        ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                        : 'bg-blue-950/60 text-blue-300 border border-blue-500/40'
                    }`}
                  >
                    {f.severity}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">{f.description}</p>
                <span className="text-[10px] font-mono text-slate-500">Ref: {f.standardRef}</span>
              </div>
            ))
          )}
        </div>

        {/* Maintenance Recommendations */}
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
            Targeted Corrective Action Directives
          </span>
          <div className="space-y-2">
            {diagnosis.maintenanceRecommendations.map((r, i) => (
              <div
                key={i}
                className="p-2.5 rounded bg-slate-950/60 border border-slate-800 flex items-start gap-2 text-xs"
              >
                <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-slate-300 font-sans text-[11px] leading-relaxed">{r}</span>
              </div>
            ))}
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={onExportCSV}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition-colors"
            >
              <Download size={13} />
              <span>Export Peaks (CSV)</span>
            </button>
            <button
              onClick={onExportJSON}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition-colors"
            >
              <FileText size={13} />
              <span>Export CMMS JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
