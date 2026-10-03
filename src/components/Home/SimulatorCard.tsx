import React, { useState } from 'react';
import { SimulatorId } from '../../types/common';
import { SimulatorSparkline } from '../Shared/SimulatorSparkline';
import {
  ArrowRight,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  Flame,
  ShieldAlert,
  GraduationCap,
  Factory,
  BookOpen,
  Sparkles,
  Wind,
  Target,
  Compass,
  Cog,
  ShieldCheck,
  Disc,
} from 'lucide-react';

export interface SimulatorItem {
  id: SimulatorId;
  name: string;
  tag: string;
  standard: string;
  standardTitle: string;
  category: string;
  domain: string;
  brief: string;
  icon: React.ElementType;
  governingMetric: {
    label: string;
    value: string;
    unit: string;
  };
  primaryFailureMode: string;
  healthStatus: 'compliant' | 'advisory' | 'critical';
  samplePreset: string;
  keyPhysics: string[];
  quickScenarios: {
    id: string;
    name: string;
    badge: string;
    type: 'baseline' | 'fault' | 'nominal';
    inputs: Record<string, any>;
  }[];
  learningOrder?: number;
  learningLevel?: 'level1' | 'level2' | 'level3';
  learningLevelLabel?: string;
  learningImportance?: string;
  learningImportanceBadge?: string;
  applicabilityTier?: 'tier1' | 'tier2' | 'tier3';
  applicabilityTierLabel?: string;
  applicabilityPercentage?: string;
  targetRoles?: string[];
  prerequisites?: string;
}

interface SimulatorCardProps {
  sim: SimulatorItem;
  domainAccent: 'sky' | 'emerald' | 'amber';
  viewMode?: 'learning' | 'applicability' | 'domain';
  onLaunch: (id: SimulatorId) => void;
  onLaunchScenario: (id: SimulatorId, inputs: Record<string, any>) => void;
  onOpenInfo: () => void;
}

type EquipmentArchetype = 'turbomachinery' | 'tribology' | 'hydraulics' | 'dynamics';

export const SimulatorCard: React.FC<SimulatorCardProps> = ({
  sim,
  domainAccent,
  viewMode = 'learning',
  onLaunch,
  onLaunchScenario,
  onOpenInfo,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const SimIcon = sim.icon;

  // Classify equipment into 4 distinctive visual flight deck archetypes
  const getArchetype = (id: SimulatorId): EquipmentArchetype => {
    if (['turbine', 'compressor', 'recip'].includes(id)) return 'turbomachinery';
    if (['gearbox', 'bearing', 'journal'].includes(id)) return 'tribology';
    if (['pump', 'pipe', 'seal'].includes(id)) return 'hydraulics';
    return 'dynamics';
  };

  const archetype = getArchetype(sim.id);

  // High-contrast equipment flight deck styling
  const archetypeStyles = {
    turbomachinery: {
      cardBg: 'bg-gradient-to-b from-[#0b172a] via-[#070e1c] to-[#040812]',
      border: 'border-[#1e345b] hover:border-cyan-400',
      badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
      iconBox: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-cyan-500/20',
      topLine: 'bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500',
      metricColor: 'text-cyan-400',
      archetypeLabel: 'AERODYNAMIC & ENTHALPY EXPANSION',
      glow: 'hover:shadow-xl hover:shadow-cyan-500/15',
      button: 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-extrabold',
    },
    tribology: {
      cardBg: 'bg-gradient-to-b from-[#1f140a] via-[#130b05] to-[#080402]',
      border: 'border-[#462b14] hover:border-amber-400',
      badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
      iconBox: 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-amber-500/20',
      topLine: 'bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-500',
      metricColor: 'text-amber-400',
      archetypeLabel: 'HERTZIAN STRESS & EHL LUBRICATION',
      glow: 'hover:shadow-xl hover:shadow-amber-500/15',
      button: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold',
    },
    hydraulics: {
      cardBg: 'bg-gradient-to-b from-[#081a13] via-[#040f0a] to-[#020705]',
      border: 'border-[#153e2d] hover:border-emerald-400',
      badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
      iconBox: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-emerald-500/20',
      topLine: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500',
      metricColor: 'text-emerald-400',
      archetypeLabel: 'HYDRAULIC CAVITATION & PRESSURE',
      glow: 'hover:shadow-xl hover:shadow-emerald-500/15',
      button: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold',
    },
    dynamics: {
      cardBg: 'bg-gradient-to-b from-[#180d26] via-[#0f0719] to-[#08040d]',
      border: 'border-[#3a1d5c] hover:border-purple-400',
      badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
      iconBox: 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-purple-500/20',
      topLine: 'bg-gradient-to-r from-purple-500 via-fuchsia-400 to-indigo-500',
      metricColor: 'text-purple-400',
      archetypeLabel: 'ROTORDYNAMICS & VECTOR ALIGNMENT',
      glow: 'hover:shadow-xl hover:shadow-purple-500/15',
      button: 'bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400 text-slate-950 font-extrabold',
    },
  }[archetype];

  // Specific governing physics law mapping
  const physicsLawMap: Record<SimulatorId, string> = {
    turbine: 'IAPWS-IF97 Steam Enthalpy & Campbell Diagram',
    compressor: 'Greitzer B-Param & 3D Polytropic Compression',
    recip: 'Ideal Gas In-Cylinder P-V Loop & Rod Reversal',
    gearbox: 'AGMA 2001-D04 Contact Stress & Lewis J-Factor',
    pump: 'Bernoulli Cavitation NPSHa vs NPSH3 Margin',
    pipe: 'ASME B31.3 Thermal Expansion & Casing Reactions',
    seal: 'API 682 Tribology & Vapor Suppression (ΔPvap)',
    bearing: 'ISO 281 L10mh & Kinematic Fault Orders',
    journal: '2D Reynolds Hydrodynamics & Sommerfeld Whirl',
    rotor: 'Jeffcott Dynamic Balancing & ISO 1940 Grade',
    alignment: 'Thermal Growth Vectors & API 686 Reverse Dial',
  };

  const governingLaw = physicsLawMap[sim.id] || 'Deterministic Engineering Physics';

  return (
    <div
      id={`simulator-card-${sim.id}`}
      onClick={() => onLaunch(sim.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group ${archetypeStyles.cardBg} border ${archetypeStyles.border} rounded-2xl flex flex-col justify-between transition-all duration-300 cursor-pointer ${archetypeStyles.glow} overflow-hidden font-sans relative transform hover:-translate-y-1.5 shadow-md`}
    >
      {/* High-Contrast Top Archetype Accent Ribbon */}
      <div className={`h-1.5 w-full ${archetypeStyles.topLine}`} />

      <div className="p-4 sm:p-5 space-y-3.5">
        {/* Archetype Micro Header & Standard Code */}
        <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
          <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase truncate">
            {archetypeStyles.archetypeLabel}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200 font-bold shrink-0">
            {sim.standard.split('/')[0].trim()}
          </span>
        </div>

        {/* Card Header: Distinct Equipment Icon, Title, & Health Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl border ${archetypeStyles.iconBox} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-md`}>
              <SimIcon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold text-sky-400">
                  {sim.tag}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {sim.categoryLabel}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-white group-hover:text-white transition-colors tracking-tight leading-snug mt-0.5">
                {sim.name}
              </h3>
            </div>
          </div>

          {/* Operational Status Jewel Pip */}
          <div className="shrink-0 pt-1">
            {sim.healthStatus === 'compliant' ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 flex items-center gap-1 font-bold shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>SAFE</span>
              </span>
            ) : sim.healthStatus === 'advisory' ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/90 border border-amber-500/50 text-amber-300 flex items-center gap-1 font-bold shadow-sm">
                <AlertTriangle size={10} className="text-amber-400" />
                <span>ADVISORY</span>
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950/90 border border-rose-500/50 text-rose-300 flex items-center gap-1 font-bold shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                <span>TRIP RISK</span>
              </span>
            )}
          </div>
        </div>

        {/* Physics Brief Description */}
        <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-2">
          {sim.brief}
        </p>

        {/* Interactive Physics Sparkline / Telemetry Window with Flight Deck Styling */}
        <div className="relative group/sparkline">
          <div className="bg-[#03060c] border border-white/10 group-hover:border-white/20 rounded-xl p-2.5 overflow-hidden transition-colors shadow-inner">
            <SimulatorSparkline id={sim.id} className="w-full h-16" isHovered={isHovered} />
          </div>
          <div className="absolute top-1.5 right-2 text-[9px] font-mono text-slate-400 px-1 rounded bg-black/60 border border-white/5">
            FLOAT64
          </div>
        </div>

        {/* Governing Metric & Failure Mode Display */}
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-black/40 border border-white/5 font-mono text-xs">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              {sim.governingMetric.label}
            </div>
            <div className="font-extrabold flex items-baseline gap-1 mt-0.5">
              <span className={`text-lg sm:text-xl ${archetypeStyles.metricColor} font-mono`}>
                {sim.governingMetric.value}
              </span>
              <span className="text-[10px] text-slate-400 font-sans">{sim.governingMetric.unit}</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Primary Failure Mode
            </div>
            <div
              className="text-[11px] text-rose-400 font-bold truncate mt-1"
              title={sim.primaryFailureMode.replace(/\$|\{|\}/g, '')}
            >
              {sim.primaryFailureMode.replace(/\$|\{|\}/g, '')}
            </div>
          </div>
        </div>

        {/* Governing Physics Equation Tag */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-white/5 rounded-lg px-2.5 py-1 border border-white/5 truncate">
          <Activity size={12} className={archetypeStyles.metricColor} />
          <span className="truncate text-slate-300 font-medium">{governingLaw}</span>
        </div>

        {/* Tactile Rocker Switch Scenario Buttons */}
        {sim.quickScenarios && sim.quickScenarios.length > 0 && (
          <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 font-mono">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold shrink-0">
              Scenarios:
            </span>
            <div className="flex items-center gap-1.5 overflow-hidden">
              {sim.quickScenarios.map((scen) => (
                <button
                  key={scen.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onLaunchScenario(sim.id, scen.inputs);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer truncate max-w-[135px] flex items-center gap-1 ${
                    scen.type === 'fault'
                      ? 'bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 hover:text-white shadow-sm'
                      : 'bg-[#10192b] hover:bg-[#182744] border border-sky-500/30 text-sky-200 hover:text-white shadow-sm'
                  }`}
                  title={`Run Scenario: ${scen.name}`}
                >
                  <span>{scen.badge}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="px-4 py-3 bg-black/40 border-t border-white/10 flex items-center justify-between gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenInfo();
          }}
          className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Inspect verified mathematical formulas and standards"
        >
          <FileText size={13} className="text-amber-400" />
          <span>Derivations</span>
        </button>

        <button
          onClick={() => onLaunch(sim.id)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer shadow-md ${archetypeStyles.button}`}
        >
          <span>Launch Twin</span>
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};
