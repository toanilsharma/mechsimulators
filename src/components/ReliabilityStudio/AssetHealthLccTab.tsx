import React, { useMemo } from 'react';
import { SimulatorId, UnitSystem } from '../../types/common';
import {
  calculateAssetHealth,
  calculateLifeCycleCost,
  PF_STAGES,
} from '../../utils/reliabilityCalculations';
import {
  ShieldAlert,
  Clock,
  DollarSign,
  TrendingDown,
  AlertOctagon,
  CheckCircle2,
  Gauge,
  Zap,
} from 'lucide-react';

interface AssetHealthLccTabProps {
  simulatorId: SimulatorId;
  inputs: Record<string, any>;
  outputs: any;
  unitSystem: UnitSystem;
}

export const AssetHealthLccTab: React.FC<AssetHealthLccTabProps> = ({
  simulatorId,
  inputs,
  outputs,
}) => {
  const healthScore = useMemo(() => {
    return calculateAssetHealth(simulatorId, inputs, outputs);
  }, [simulatorId, inputs, outputs]);

  const lcc = useMemo(() => {
    return calculateLifeCycleCost(simulatorId, healthScore);
  }, [simulatorId, healthScore]);

  const currentPFStage = PF_STAGES[healthScore.pfCurrentStageIndex] || PF_STAGES[0];

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Header Metrics: Health Index & MTBF */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Overall Asset Health Score Card */}
        <div className="p-3.5 bg-[#0d1117] border border-[#30363d] rounded flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-mono uppercase text-[#8b949e]">
              Asset Health Index (AHI)
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span
                className={`text-2xl font-mono font-bold ${
                  healthScore.overallScore >= 80
                    ? 'text-[#3fb950]'
                    : healthScore.overallScore >= 55
                    ? 'text-[#d29922]'
                    : 'text-[#f85149]'
                }`}
              >
                {healthScore.overallScore}
                <span className="text-sm text-[#8b949e]">/100</span>
              </span>
              <span
                className={`text-xs font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                  healthScore.overallScore >= 80
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-600/40'
                    : healthScore.overallScore >= 55
                    ? 'bg-amber-950 text-amber-400 border border-amber-600/40'
                    : 'bg-rose-950 text-rose-400 border border-rose-600/40'
                }`}
              >
                {healthScore.rating}
              </span>
            </div>
            <span className="text-[10px] text-[#8b949e] mt-1 line-clamp-1">
              {healthScore.governingFailureMode}
            </span>
          </div>

          <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center font-mono font-bold text-sm shrink-0 border-[#30363d] bg-[#161b22]">
            <Gauge
              className={`w-6 h-6 ${
                healthScore.overallScore >= 80
                  ? 'text-[#3fb950]'
                  : healthScore.overallScore >= 55
                  ? 'text-[#d29922]'
                  : 'text-[#f85149]'
              }`}
            />
          </div>
        </div>

        {/* Estimated MTBF */}
        <div className="p-3.5 bg-[#0d1117] border border-[#30363d] rounded flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-mono uppercase text-[#8b949e]">
              Mean Time Between Failure (MTBF)
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-mono font-bold text-white">
                {healthScore.mtbfHours.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-[#8b949e]">hours</span>
            </div>
            <span className="text-[10px] text-[#8b949e] mt-1">
              ~{(healthScore.mtbfHours / 8760).toFixed(1)} operating years under continuous duty
            </span>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-[#30363d] bg-[#161b22] flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-cyan-400" />
          </div>
        </div>

        {/* 15-Year Potential Savings */}
        <div className="p-3.5 bg-[#0d1117] border border-[#30363d] rounded flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-mono uppercase text-[#8b949e]">
              15-Year LCC Optimization Savings
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-mono font-bold text-[#3fb950]">
                ${lcc.potentialLifetimeSavings.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-[#8b949e]">USD</span>
            </div>
            <span className="text-[10px] text-[#8b949e] mt-1">
              Energy reduction + downtime risk mitigation
            </span>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-[#30363d] bg-[#161b22] flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6 text-[#3fb950]" />
          </div>
        </div>
      </div>

      {/* 2. Interactive P-F Degradation Curve */}
      <div className="p-4 bg-[#0d1117] border border-[#30363d] rounded flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Reliability P-F Degradation Interval
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#8b949e]">
            Active Condition: <strong className="text-white">{currentPFStage.name}</strong>
          </span>
        </div>

        {/* Visual P-F Progression Track */}
        <div className="relative pt-4 pb-2">
          {/* Progress Line */}
          <div className="h-1.5 w-full bg-[#21262d] rounded relative">
            <div
              className={`h-full rounded transition-all duration-300 ${
                healthScore.pfCurrentStageIndex >= 4
                  ? 'bg-rose-500'
                  : healthScore.pfCurrentStageIndex >= 2
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.max(10, 100 - (healthScore.pfCurrentStageIndex / 5) * 100)}%`,
              }}
            />
          </div>

          {/* 6 Stage Indicators */}
          <div className="grid grid-cols-6 gap-1 mt-3">
            {PF_STAGES.map((st, idx) => {
              const isCurrent = idx === healthScore.pfCurrentStageIndex;
              const isPast = idx < healthScore.pfCurrentStageIndex;
              return (
                <div
                  key={st.id}
                  className={`flex flex-col p-2 rounded border text-left transition-colors ${
                    isCurrent
                      ? 'bg-[#161b22] border-[#f27d26] ring-1 ring-[#f27d26]'
                      : isPast
                      ? 'bg-[#0d1117] border-[#30363d] opacity-80'
                      : 'bg-[#0d1117] border-[#21262d] opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono font-bold text-[#8b949e]">
                      {idx === 0 ? 'Point P' : idx === 5 ? 'Point F' : `Stage ${idx + 1}`}
                    </span>
                    {isCurrent && (
                      <span className="w-2 h-2 rounded-full bg-[#f27d26] animate-ping" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-white line-clamp-1">
                    {st.name.split(':')[0]}
                  </span>
                  <span className="text-[9px] font-mono text-[#8b949e] mt-1">
                    ~{st.typicalTimeRemainingDays}d window
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Stage Deep Dive */}
        <div className="p-3 bg-[#161b22] rounded border border-[#30363d] text-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-white flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-[#f27d26]" />
              {currentPFStage.name}
            </span>
            <span className="font-mono text-[11px] text-amber-400">
              Prescribed Inspection: {currentPFStage.detectionTechnology}
            </span>
          </div>
          <p className="text-[#8b949e] text-[11px] leading-relaxed">
            {currentPFStage.description}
          </p>
        </div>
      </div>

      {/* 3. Reliability Factors & ISO 15663 LCC Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Reliability Sub-Factors */}
        <div className="p-3.5 bg-[#0d1117] border border-[#30363d] rounded flex flex-col gap-2">
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Health Index Factor Assessment
          </span>

          <div className="flex flex-col divide-y divide-[#21262d]">
            {healthScore.reliabilityFactors.map((factor, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-xs font-mono text-[#c9d1d9] font-semibold">
                    {factor.name}
                  </span>
                  <span className="text-[10px] text-[#8b949e]">{factor.detail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white">
                    {factor.score}/100
                  </span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      factor.status === 'safe'
                        ? 'bg-[#3fb950]'
                        : factor.status === 'warning'
                        ? 'bg-[#d29922]'
                        : 'bg-[#f85149]'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ISO 15663 Life Cycle Cost Table */}
        <div className="p-3.5 bg-[#0d1117] border border-[#30363d] rounded flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              ISO 15663 Life Cycle Cost (15-Yr)
            </span>
            <span className="text-[10px] font-mono text-[#8b949e]">Electricity: $0.11/kWh</span>
          </div>

          <div className="flex flex-col divide-y divide-[#21262d] text-xs font-mono">
            <div className="py-2 flex justify-between">
              <span className="text-[#8b949e]">Base Energy Consumption:</span>
              <span className="text-white">${lcc.annualEnergyCost.toLocaleString()} / yr</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-[#8b949e]">Wasted Degradation Energy:</span>
              <span className="text-amber-400">+${lcc.energySavingsAnnual.toLocaleString()} / yr</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-[#8b949e]">Bearing/Seal Parts & Overhaul:</span>
              <span className="text-white">${lcc.annualPartsOverhaulCost.toLocaleString()} / yr</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-[#8b949e]">Unplanned Downtime Production Risk:</span>
              <span className="text-rose-400">+${lcc.annualUnplannedDowntimeRiskCost.toLocaleString()} / yr</span>
            </div>
            <div className="pt-2.5 flex justify-between font-bold border-t border-[#30363d]">
              <span className="text-[#f27d26]">15-Yr Total Cost (Unmitigated):</span>
              <span className="text-white">${lcc.totalLifetimeCostUnmitigated.toLocaleString()}</span>
            </div>
            <div className="py-1 flex justify-between font-bold">
              <span className="text-[#3fb950]">15-Yr Total Cost (Mitigated):</span>
              <span className="text-[#3fb950]">${lcc.totalLifetimeCostMitigated.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
