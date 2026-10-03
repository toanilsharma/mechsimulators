import React from 'react';
import { Cpu, Zap, Activity, ShieldCheck, Layers, ArrowUpRight, CheckCircle2, Sparkles } from 'lucide-react';

interface TelemetryMetricsAnchorProps {
  onOpenAudit: () => void;
  onOpenCommandPalette?: () => void;
}

export const TelemetryMetricsAnchor: React.FC<TelemetryMetricsAnchorProps> = ({
  onOpenAudit,
  onOpenCommandPalette,
}) => {
  const metrics = [
    {
      id: 'twins',
      value: '11',
      unit: 'Twins',
      label: 'Digital Twins',
      sublabel: 'API & ISO Validated Models',
      accent: 'sky',
      glow: 'shadow-sky-500/10 border-sky-500/30',
      badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      description: 'Centrifugal pumps, compressors, steam turbines, gearboxes & bearings.',
    },
    {
      id: 'solvers',
      value: '100%',
      unit: 'Float64',
      label: 'Client-Side Solvers',
      sublabel: 'Deterministic In-Browser Math',
      accent: 'emerald',
      glow: 'shadow-emerald-500/10 border-emerald-500/30',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      description: 'Runge-Kutta 4th order, 2D Reynolds lubrication & Navier-Stokes.',
    },
    {
      id: 'latency',
      value: '0',
      unit: 'ms',
      label: 'Server Queuing',
      sublabel: 'Instant 60 FPS Response',
      accent: 'amber',
      glow: 'shadow-amber-500/10 border-amber-500/30',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      description: 'Continuous parameter sweeps without network lag or cloud API quotas.',
    },
    {
      id: 'standards',
      value: '15+',
      unit: 'Codes',
      label: 'Governed Standards',
      sublabel: 'API, ISO, ASME & AGMA',
      accent: 'cyan',
      glow: 'shadow-cyan-500/10 border-cyan-500/30',
      badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      description: 'Calibrated trip thresholds, allowable stress ranges & ISO vibration limits.',
    },
    {
      id: 'studios',
      value: '7',
      unit: 'Studios',
      label: 'Integrated Suites',
      sublabel: 'Plant-Wide Cross Diagnostics',
      accent: 'purple',
      glow: 'shadow-purple-500/10 border-purple-500/30',
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      description: 'Driveline cascade, FFT waterfall, Weibull, RCA & Tribology lab.',
    },
  ];

  return (
    <section
      id="telemetry-metrics-anchor"
      className="border-b border-[#1b253b] bg-gradient-to-b from-[#060911] via-[#080d19] to-[#060911] px-4 sm:px-8 py-6 relative overflow-hidden"
    >
      {/* Background Subtle Tech Grid Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-4">
        {/* Split Header: Technical telemetry badge + live status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#162034] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-mono tracking-widest uppercase font-bold text-slate-300">
              PHYSICS ENGINE REAL-TIME TELEMETRY
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded font-semibold hidden sm:inline">
              ONLINE & RUNNING
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            {onOpenCommandPalette && (
              <button
                onClick={onOpenCommandPalette}
                className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-[#0d1424] border border-[#1e2a44] transition-colors cursor-pointer flex items-center gap-1.5"
                title="Search any asset, studio, standard, or equation (Cmd+K)"
              >
                <span>Command Palette</span>
                <kbd className="px-1 py-0.5 text-[9px] rounded bg-slate-800 text-slate-300 border border-slate-700">⌘K</kbd>
              </button>
            )}
            <button
              onClick={onOpenAudit}
              className="text-[11px] text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1 cursor-pointer font-semibold"
            >
              <span>Audit Calculation Engine</span>
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>

        {/* High-Contrast 5-Block Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {metrics.map((m) => (
            <div
              key={m.id}
              className={`p-3.5 sm:p-4 rounded-xl bg-[#09101e]/80 hover:bg-[#0d172c] border border-[#1c2944] hover:${m.glow} transition-all duration-200 group flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border font-semibold ${m.badgeColor}`}>
                    {m.unit}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400 transition-colors">
                    VERIFIED
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono">
                    {m.value}
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-200 mt-1 tracking-tight">
                  {m.label}
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                  {m.sublabel}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-sans mt-2.5 pt-2 border-t border-[#141f33] line-clamp-2 leading-relaxed">
                {m.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
