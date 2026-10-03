import React from 'react';
import { Cpu, FileCheck, ShieldAlert, BookCheck, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

interface PlatformCapabilitiesBarProps {
  onOpenAudit: () => void;
}

export const PlatformCapabilitiesBar: React.FC<PlatformCapabilitiesBarProps> = ({ onOpenAudit }) => {
  const capabilities = [
    {
      id: 'solvers',
      icon: Cpu,
      accent: 'sky',
      badge: 'Zero Server Latency',
      title: '100% Client Float64 Solvers',
      description: 'Solves complex Navier-Stokes, IAPWS-IF97 steam tables, and 2D Reynolds lubrication in real-time with 60 FPS fluid rendering.',
      detail: 'No server queuing • Instant physics update',
      borderColor: 'border-sky-500/25 hover:border-sky-400',
      iconBg: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    },
    {
      id: 'proofs',
      icon: FileCheck,
      accent: 'amber',
      badge: 'Transparent Math',
      title: 'Audit-Ready Equations',
      description: 'Step-by-step mathematical derivations with complete parameter breakdowns, verified against academic textbooks and industry codes.',
      detail: 'Verified formulas • Exam & RCA ready',
      borderColor: 'border-amber-500/25 hover:border-amber-400',
      iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      clickable: true,
    },
    {
      id: 'sandbox',
      icon: ShieldAlert,
      accent: 'rose',
      badge: 'Safe Failure Testing',
      title: 'Zero-Risk Failure Sandbox',
      description: 'Intentionally trigger aerodynamic surge, bearing oil whip, and acoustic cavitation to understand destructive failure mechanisms safely.',
      detail: 'Crash million-dollar machines virtually',
      borderColor: 'border-rose-500/25 hover:border-rose-400',
      iconBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    },
    {
      id: 'standards',
      icon: BookCheck,
      accent: 'emerald',
      badge: 'Industry Benchmark',
      title: 'Calibrated Standards Limits',
      description: 'Trip thresholds, allowable stresses, and safety margins calibrated to API 610/612/617, ISO 10816/20816, and ASME B31.3.',
      detail: 'API • ISO • ASME • AGMA compliance',
      borderColor: 'border-emerald-500/25 hover:border-emerald-400',
      iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
  ];

  return (
    <section id="platform-capabilities-bar" className="border-b border-[#1b253b] bg-[#060a12] px-4 sm:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#18263e] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold uppercase tracking-wider w-fit">
              <Zap size={12} className="text-sky-400" />
              <span>DETERMINISTIC MULTI-PHYSICS ARCHITECTURE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Built for Engineering Rigor & Transparent Mathematics
            </h2>
            <p className="text-xs text-slate-300 font-sans max-w-2xl leading-relaxed">
              Every numerical calculation runs deterministically in 64-bit precision within your browser thread—guaranteeing verifiable reproducibility without hidden black-box cloud solvers.
            </p>
          </div>
          <button
            onClick={onOpenAudit}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0c1424] hover:bg-[#131f36] border border-[#213454] rounded-xl text-xs font-mono font-bold text-sky-300 transition-colors cursor-pointer self-start sm:self-auto shadow-md shrink-0"
          >
            <FileCheck size={14} className="text-amber-400" />
            <span>Open Formula Audit Sheets</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Asymmetric 4-Card Architecture Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
          {/* Card 1: Flagship 4-Col 100% Client Float64 Solvers */}
          <div className="lg:col-span-4 p-5 rounded-2xl bg-gradient-to-b from-[#0c182b] to-[#070e1a] border border-sky-500/30 flex flex-col justify-between group shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center font-bold">
                  <Cpu size={20} />
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-sky-950/80 border border-sky-500/40 text-sky-300 font-bold">
                  Zero Server Queues
                </span>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-white group-hover:text-sky-200 transition-colors">
                  100% Client Float64 Solvers
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Solves complex Navier-Stokes, IAPWS-IF97 steam tables, and 2D Reynolds lubrication in real-time with 60 FPS fluid rendering.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-sky-500/20 font-mono text-[11px] text-sky-300 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Solver Precision:</span>
                  <span className="font-bold text-white">IEEE-754 64-Bit Float</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Physics Update:</span>
                  <span className="font-bold text-emerald-400">16.6 ms (60 Hz)</span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] font-mono text-slate-300">
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
              <span>Instant responsiveness • No telemetry leakage</span>
            </div>
          </div>

          {/* Card 2: 4-Col Audit-Ready Formulas */}
          <div 
            onClick={onOpenAudit}
            className="lg:col-span-4 p-5 rounded-2xl bg-gradient-to-b from-[#211709] to-[#120c04] border border-amber-500/30 hover:border-amber-400 flex flex-col justify-between group cursor-pointer transition-all shadow-lg hover:shadow-amber-500/10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
                  <FileCheck size={20} />
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1">
                  <span>Transparent Math</span>
                  <ArrowRight size={10} />
                </span>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-white group-hover:text-amber-200 transition-colors">
                  Audit-Ready Equations & Proofs
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Step-by-step mathematical derivations with complete parameter breakdowns, verified against academic textbooks and industry codes.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/20 font-mono text-[11px] text-amber-300 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Derivation Breadth:</span>
                  <span className="font-bold text-white">11 Formula Suites</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Academic Verification:</span>
                  <span className="font-bold text-amber-400">Exam & RCA Calibrated</span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-amber-400 shrink-0" />
                <span>Click to inspect calculation steps</span>
              </div>
              <ArrowRight size={12} className="text-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: 4-Col Split (Top Safe Sandbox, Bottom Calibrated Standards) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Safe Failure Testing */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-[#1c0d14] to-[#0e060a] border border-rose-500/30 flex flex-col justify-between flex-1 group shadow-md">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
                    <ShieldAlert size={16} />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold">
                    Zero Risk Sandbox
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-rose-200 transition-colors">
                    Catastrophic Limit Testing
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    Trigger aerodynamic surge, bearing oil whip, and cavitation pitting without risking million-dollar physical assets.
                  </p>
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>Forensic RCA & trip sequence verification</span>
              </div>
            </div>

            {/* Calibrated Standards Limits */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-[#091b15] to-[#040d0a] border border-emerald-500/30 flex flex-col justify-between flex-1 group shadow-md">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                    <BookCheck size={16} />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold">
                    Calibrated Benchmarks
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-200 transition-colors">
                    Recognized Engineering Standards
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    Trip boundaries and allowable stresses calibrated against API 610/612/617, ISO 10816/20816, and ASME B31.3.
                  </p>
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>API • ISO • ASME • AGMA compliance criteria</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
