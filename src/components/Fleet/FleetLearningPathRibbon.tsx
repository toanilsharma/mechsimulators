import React from 'react';
import { ArrowRight, CheckCircle2, Award, Clock, Layers, ChevronRight } from 'lucide-react';
import { SimulatorId } from '../../types/common';

interface FleetLearningPathRibbonProps {
  onLaunchSimulator?: (id: SimulatorId) => void;
}

export const FleetLearningPathRibbon: React.FC<FleetLearningPathRibbonProps> = ({
  onLaunchSimulator,
}) => {
  const TRACK_STEPS = [
    {
      step: '01',
      id: 'bearing' as SimulatorId,
      code: 'ISO 281 / 10816',
      title: 'Bearing Enveloping',
      subtitle: 'BPFO/BPFI defect spectra',
      time: '15 Min',
      domain: 'Tribology',
    },
    {
      step: '02',
      id: 'gearbox' as SimulatorId,
      code: 'AGMA 2001',
      title: 'Gearbox Mesh Dynamics',
      subtitle: 'GMF harmonics & safety factors',
      time: '25 Min',
      domain: 'Gears',
    },
    {
      step: '03',
      id: 'rotor' as SimulatorId,
      code: 'ISO 1940 / API 684',
      title: 'Rotor 2-Plane Balancing',
      subtitle: '1X synchronous polar phasor',
      time: '20 Min',
      domain: 'Rotor Dynamics',
    },
    {
      step: '04',
      id: 'seal' as SimulatorId,
      code: 'API 682 4th Ed',
      title: 'Seal Flush Thermal Plan',
      subtitle: 'Vapor boiling margin dissipation',
      time: '15 Min',
      domain: 'Fluid Sealing',
    },
  ];

  return (
    <div className="col-span-full relative my-3 rounded-[12px] bg-[#131E33] border border-[#233554] p-5 shadow-2xl overflow-hidden transition-all duration-300 hover:border-[#06B6D4]/50 hover:shadow-[0_0_28px_rgba(6,182,212,0.12)]">
      {/* Background Micro Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(#06B6D4 1px, transparent 1px), radial-gradient(#06B6D4 1px, #131E33 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px',
        }}
      />

      {/* Top Banner Row */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#06B6D4]/15 border border-[#06B6D4]/35 text-[#06B6D4] text-[11px] font-mono font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              <span>RECOMMENDED ENGINEERING CURRICULUM</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              4 SIMS &bull; 75 MIN
            </span>
          </div>
          <h3 className="text-[18px] sm:text-[20px] font-bold text-slate-100 font-sans tracking-tight">
            Reliability Engineer Track: Bearing ➔ Gearbox ➔ Rotor ➔ Seal
          </h3>
          <p className="text-[13px] text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
            Follow the standard diagnostic sequence to trace mechanical faults from localized tribological bearing spalls through gear mesh excitation to whole-train balancing and fluid containment.
          </p>
        </div>

        {/* Aggregate Stats Pill */}
        <div className="flex items-center gap-3 shrink-0 self-start lg:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B1220]/80 border border-[#1E293B] text-[12px] font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>EST: 75 MIN</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B1220]/80 border border-[#1E293B] text-[12px] font-mono text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>API &bull; ISO ALIGNED</span>
          </div>
        </div>
      </div>

      {/* Interactive Arrow Chain Milestones Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {TRACK_STEPS.map((step, idx) => (
          <div key={step.id} className="relative group/step">
            {/* Step Card */}
            <div className="flex flex-col justify-between h-full rounded-[10px] bg-[#0A101D] border border-[#1E293B] p-3.5 transition-all duration-200 hover:border-[#06B6D4] hover:bg-[#0E1729]">
              <div>
                {/* Step Index & Code Badge */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-mono font-bold text-[#06B6D4]">
                    STEP {step.step}
                  </span>
                  <span className="inline-flex items-center h-[20px] px-2 py-[2px] rounded bg-[#131E33] border border-[#233554] text-[11px] font-mono font-medium text-slate-300">
                    {step.code}
                  </span>
                </div>

                {/* Step Title */}
                <h4 className="text-[14px] font-semibold text-slate-100 group-hover/step:text-[#06B6D4] transition-colors leading-snug mb-1">
                  {step.title}
                </h4>

                {/* Subtitle */}
                <p className="text-[12px] text-slate-400 line-clamp-1 mb-2">
                  {step.subtitle}
                </p>

                {/* Step Meta Chips */}
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="inline-flex items-center h-[20px] px-2 py-[2px] rounded bg-[#131E33]/60 border border-[#233554]/60 text-[10px] font-mono text-slate-400">
                    {step.domain}
                  </span>
                  <span className="inline-flex items-center h-[20px] px-2 py-[2px] rounded bg-[#131E33]/60 border border-[#233554]/60 text-[10px] font-mono text-slate-400">
                    {step.time}
                  </span>
                </div>
              </div>

              {/* Direct Launch Trigger */}
              <button
                type="button"
                onClick={() => onLaunchSimulator?.(step.id)}
                className="w-full h-[32px] px-2.5 rounded-md text-[12px] font-semibold flex items-center justify-between bg-[#131E33] hover:bg-[#06B6D4] text-slate-300 hover:text-slate-950 border border-[#233554] hover:border-[#06B6D4] transition-all cursor-pointer"
              >
                <span>Launch Step {step.step}</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/step:translate-x-0.5" />
              </button>
            </div>

            {/* Connecting Arrow (Desktop Only between steps) */}
            {idx < TRACK_STEPS.length - 1 && (
              <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-4 h-4 rounded-full bg-[#131E33] border border-[#233554] items-center justify-center text-[#06B6D4]">
                <ArrowRight className="w-2.5 h-2.5" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
