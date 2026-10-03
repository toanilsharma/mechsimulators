import React, { useState } from 'react';
import { SimulatorId } from '../../types/common';
import {
  ArrowRight,
  Network,
  Zap,
  ChevronRight,
  AlertTriangle,
  Flame,
  Target,
  Cog,
  Compass,
  Wind,
  ShieldAlert,
  Layers,
  Sparkles,
  Play,
  RotateCw,
} from 'lucide-react';

export interface TrainNode {
  id: SimulatorId;
  name: string;
  tag: string;
  standard: string;
  role: string;
  speed: string;
  operatingCondition: string;
  icon: React.ElementType;
  coupledTo: string;
  failureRisk: string;
  upstreamReaction: string;
  downstreamCascade: string;
}

interface DriveTrainRibbonProps {
  nodes: TrainNode[];
  activeNodeId: SimulatorId;
  onSelectNode: (id: SimulatorId) => void;
  onLaunchNode: (id: SimulatorId) => void;
  onOpenTrainStudio: () => void;
}

export const DriveTrainRibbon: React.FC<DriveTrainRibbonProps> = ({
  nodes,
  activeNodeId,
  onSelectNode,
  onLaunchNode,
  onOpenTrainStudio,
}) => {
  const activeNode = nodes.find((n) => n.id === activeNodeId) || nodes[0];
  const ActiveIcon = activeNode.icon;
  const [isSimulatingTorque, setIsSimulatingTorque] = useState(true);

  // Machinery node category themes for high-contrast optical variety
  const nodeThemes: Record<SimulatorId, { border: string; activeBorder: string; glow: string; text: string; bg: string }> = {
    turbine: {
      border: 'border-amber-700/50',
      activeBorder: 'border-amber-400',
      glow: 'shadow-amber-500/20',
      text: 'text-amber-400',
      bg: 'bg-amber-950/40',
    },
    alignment: {
      border: 'border-purple-700/50',
      activeBorder: 'border-purple-400',
      glow: 'shadow-purple-500/20',
      text: 'text-purple-400',
      bg: 'bg-purple-950/40',
    },
    gearbox: {
      border: 'border-orange-700/50',
      activeBorder: 'border-orange-400',
      glow: 'shadow-orange-500/20',
      text: 'text-orange-400',
      bg: 'bg-orange-950/40',
    },
    journal: {
      border: 'border-emerald-700/50',
      activeBorder: 'border-emerald-400',
      glow: 'shadow-emerald-500/20',
      text: 'text-emerald-400',
      bg: 'bg-emerald-950/40',
    },
    compressor: {
      border: 'border-sky-700/50',
      activeBorder: 'border-sky-400',
      glow: 'shadow-sky-500/20',
      text: 'text-sky-400',
      bg: 'bg-sky-950/40',
    },
    pump: {
      border: 'border-teal-700/50',
      activeBorder: 'border-teal-400',
      glow: 'shadow-teal-500/20',
      text: 'text-teal-400',
      bg: 'bg-teal-950/40',
    },
    pipe: {
      border: 'border-blue-700/50',
      activeBorder: 'border-blue-400',
      glow: 'shadow-blue-500/20',
      text: 'text-blue-400',
      bg: 'bg-blue-950/40',
    },
    seal: {
      border: 'border-rose-700/50',
      activeBorder: 'border-rose-400',
      glow: 'shadow-rose-500/20',
      text: 'text-rose-400',
      bg: 'bg-rose-950/40',
    },
    bearing: {
      border: 'border-indigo-700/50',
      activeBorder: 'border-indigo-400',
      glow: 'shadow-indigo-500/20',
      text: 'text-indigo-400',
      bg: 'bg-indigo-950/40',
    },
    rotor: {
      border: 'border-cyan-700/50',
      activeBorder: 'border-cyan-400',
      glow: 'shadow-cyan-500/20',
      text: 'text-cyan-400',
      bg: 'bg-cyan-950/40',
    },
    recip: {
      border: 'border-red-700/50',
      activeBorder: 'border-red-400',
      glow: 'shadow-red-500/20',
      text: 'text-red-400',
      bg: 'bg-red-950/40',
    },
  };

  return (
    <section
      id="home-drive-train-ribbon"
      className="border-b border-[#1b253b] bg-gradient-to-b from-[#060911] via-[#090f1d] to-[#060911] px-4 sm:px-8 py-10 relative overflow-hidden"
    >
      {/* Background Pipeline Blueprint Grid Line */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#16233a15_1px,transparent_1px),linear-gradient(to_bottom,#16233a15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Split Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#18263e] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold uppercase tracking-wider">
                03 // PHYSICAL DRIVELINE INTEGRATION
              </span>
              <span className="text-slate-500 text-xs hidden sm:inline">•</span>
              <span className="text-xs font-mono text-emerald-400 hidden sm:inline">
                Kinematic Speed & Dynamic Torque Continuity
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Machinery Train Pipeline Ribbon
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSimulatingTorque(!isSimulatingTorque)}
              className="px-2.5 py-1.5 rounded-lg bg-[#0d1628] hover:bg-[#121e36] border border-[#1e2d4a] text-[11px] font-mono text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCw size={12} className={isSimulatingTorque ? 'text-emerald-400 animate-spin' : 'text-slate-500'} />
              <span>{isSimulatingTorque ? 'Live Kinetic Torque' : 'Torque Paused'}</span>
            </button>

            <button
              onClick={onOpenTrainStudio}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-mono font-bold transition-all cursor-pointer shadow-lg shadow-sky-500/20"
            >
              <span>Launch Train Studio</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Illuminated Mechanical Pipeline Schematic Conduit */}
        <div className="p-4 sm:p-6 bg-[#070c17]/95 border border-[#192b4a] rounded-2xl shadow-xl space-y-4">
          {/* Top Pipeline Conduit Rail with Flow Marker */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-[#16243d] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-white font-bold">14 MW HYDROCARBON REINJECTION TRAIN</span>
            </div>
            <div className="text-[10px] text-sky-400 hidden sm:flex items-center gap-1">
              <span>TORQUE FLUIDITY: 3,000 RPM (TURBINE)</span>
              <span>➔</span>
              <span>11,250 RPM (COMPRESSOR PINION)</span>
            </div>
          </div>

          {/* Interactive Mechanical Pipeline Ribbon */}
          <div className="overflow-x-auto custom-scrollbar pb-2">
            <div className="flex items-center gap-3 min-w-[840px] py-1">
              {nodes.map((node, index) => {
                const NodeIcon = node.icon;
                const isActive = node.id === activeNodeId;
                const theme = nodeThemes[node.id] || nodeThemes.compressor;

                return (
                  <React.Fragment key={node.id}>
                    {/* Component Station Capsule */}
                    <div
                      onClick={() => onSelectNode(node.id)}
                      className={`flex-1 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none relative group ${
                        isActive
                          ? `bg-[#0f1b32] ${theme.activeBorder} shadow-lg ${theme.glow} ring-1 ring-white/10`
                          : 'bg-[#080f1d] border-[#18263e] hover:border-slate-500 hover:bg-[#0c1527]'
                      }`}
                    >
                      {/* Active Indicator Pip */}
                      {isActive && (
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-sky-400 shadow-sm shadow-sky-400" />
                      )}

                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 ${
                            isActive
                              ? `${theme.bg} ${theme.text} border ${theme.activeBorder}`
                              : 'bg-slate-800/80 text-slate-400 border border-slate-700'
                          }`}
                        >
                          <NodeIcon size={16} />
                        </div>

                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-bold">
                          {node.tag}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <div className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                          {node.name}
                        </div>
                        <div className="text-[10px] font-mono text-sky-400 font-medium truncate">
                          {node.speed}
                        </div>
                        <div className="text-[9px] font-mono text-slate-400 truncate">
                          {node.standard}
                        </div>
                      </div>
                    </div>

                    {/* Pipeline Mechanical Joint Connector */}
                    {index < nodes.length - 1 && (
                      <div className="shrink-0 flex items-center justify-center px-0.5">
                        <div className="flex items-center gap-0.5">
                          <div className={`w-3 h-1 rounded ${isActive || nodes[index + 1]?.id === activeNodeId ? 'bg-sky-400' : 'bg-slate-700'}`} />
                          <div className={`text-[11px] font-mono font-bold ${isSimulatingTorque ? 'text-sky-400 animate-pulse' : 'text-slate-600'}`}>
                            ➔
                          </div>
                          <div className={`w-3 h-1 rounded ${isActive || nodes[index + 1]?.id === activeNodeId ? 'bg-sky-400' : 'bg-slate-700'}`} />
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Focused Component Deep Inspection Telemetry Bay */}
          <div className="bg-[#050a14] border border-[#1a2c4e] rounded-xl p-4 sm:p-5 mt-2">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              {/* Left Bay: Station Profile */}
              <div className="space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center font-bold">
                    <ActiveIcon size={15} />
                  </div>
                  <span className="text-white font-extrabold text-sm">{activeNode.name}</span>
                  <span className="text-sky-400 font-bold">({activeNode.tag})</span>
                  <span className="text-slate-600">•</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px]">
                    {activeNode.standard}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-400 font-semibold">{activeNode.role}</span>
                </div>

                <div className="text-xs text-slate-200 font-sans leading-relaxed">
                  <span className="text-slate-400 font-mono text-[11px] uppercase mr-1">Operating Regime:</span>
                  {activeNode.operatingCondition}
                </div>

                {/* Real-time Dynamic Mechanical Status Ribbon */}
                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] pt-0.5">
                  <div className="px-2.5 py-1 rounded bg-[#0b1424] border border-[#1d2d4c] text-sky-300 flex items-center gap-1.5">
                    <span className="text-slate-400">SHAFT SPEED:</span>
                    <span className="font-bold text-white">{activeNode.speed}</span>
                  </div>
                  <div className="px-2.5 py-1 rounded bg-[#0b1424] border border-[#1d2d4c] text-emerald-300 flex items-center gap-1.5">
                    <span className="text-slate-400">KINEMATIC STATE:</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Coupled in Sequence
                    </span>
                  </div>
                  <div className="px-2.5 py-1 rounded bg-[#0b1424] border border-[#1d2d4c] text-amber-300 flex items-center gap-1.5">
                    <span className="text-slate-400">GOVERNED STANDARD:</span>
                    <span className="font-bold text-amber-300">{activeNode.standard}</span>
                  </div>
                </div>

                {/* Coupled Transmission & Cascade Threat Panels */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                  <div className="bg-[#0a1222] border border-[#1c2c4b] rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <Zap size={12} />
                      <span>COUPLED BOUNDARY INTERFACE:</span>
                    </div>
                    <div className="text-slate-300 text-[10px] leading-relaxed font-sans">
                      {activeNode.coupledTo}
                    </div>
                  </div>

                  <div className="bg-[#0a1222] border border-[#1c2c4b] rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                      <AlertTriangle size={12} />
                      <span>TRANSIENT TRIP PROPAGATION:</span>
                    </div>
                    <div className="text-slate-300 text-[10px] leading-relaxed font-sans">
                      {activeNode.downstreamCascade}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Bay: Fast Launch Action Switch */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 lg:w-56">
                <button
                  onClick={() => onLaunchNode(activeNode.id)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-slate-950 font-extrabold text-xs font-mono transition-all cursor-pointer shadow-lg shadow-sky-500/25"
                >
                  <span>Launch {activeNode.name}</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  onClick={onOpenTrainStudio}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#0c1526] hover:bg-[#131f36] border border-[#213454] text-sky-300 text-xs font-mono transition-all cursor-pointer"
                >
                  <Network size={13} />
                  <span>Simulate in Full Train</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
