import React, { useState, useEffect } from 'react';
import { PhysicsAnimationParams, SimulatorType, AnimationIntensity } from '../../engine/types';
import { PHYSICS_ANIMATION_MAPPING_TABLE } from '../../engine/animationMapping';
import { UnitSystem } from '../../types/common';
import { Bug, Activity, ShieldCheck, AlertTriangle, Cpu, Gauge, Zap } from 'lucide-react';

export interface VisualDebugOverlayProps {
  simulator: SimulatorType;
  inputs: any;
  outputs: any;
  animationParams: PhysicsAnimationParams;
  unitSystem: UnitSystem;
  performanceMode: 'high' | 'balanced' | 'low-power';
  animationIntensity?: AnimationIntensity;
  reducedMotion: boolean;
  fps?: number;
}

export const VisualDebugOverlay: React.FC<VisualDebugOverlayProps> = ({
  simulator,
  inputs,
  outputs,
  animationParams,
  unitSystem,
  performanceMode,
  animationIntensity = 'high',
  reducedMotion,
  fps = 60,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'physics' | 'animation' | 'diagnostics'>('physics');

  const simulatorMappings = PHYSICS_ANIMATION_MAPPING_TABLE.filter((m) => m.simulator === simulator);

  return (
    <div className="absolute top-12 right-3 z-30 pointer-events-auto select-none font-mono">
      {/* Floating Toggle Button */}
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-2 py-1 bg-[#161b22]/90 hover:bg-[#21262d] text-[#8b949e] hover:text-[#58a6ff] text-[11px] rounded border border-[#30363d] backdrop-blur transition-all shadow-md"
          title="Toggle Engineering Physics & Animation Debug Overlay"
        >
          <Bug size={13} className="text-[#38bdf8]" />
          <span className="font-bold">DEBUG</span>
          <span className="text-[10px] text-[#58a6ff] bg-[#58a6ff]/10 px-1 rounded">{fps} FPS</span>
        </button>
      ) : (
        /* Expanded Debug Inspector Panel */
        <div className="w-80 sm:w-96 max-h-[75vh] flex flex-col bg-[#0d1117]/95 border border-[#30363d] rounded-md shadow-2xl backdrop-blur overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#c9d1d9]">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-[#30363d]">
            <div className="flex items-center gap-2">
              <Bug size={14} className="text-[#38bdf8]" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Twin Physics Inspector
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30">
                {simulator.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                {fps} FPS
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#8b949e] hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-[#30363d]"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Mode & Performance Banner */}
          <div className="px-3 py-1.5 bg-[#080b0f] border-b border-[#30363d]/60 flex items-center justify-between text-[10px] text-[#8b949e]">
            <div className="flex items-center gap-1.5">
              <Cpu size={12} className="text-[#d29922]" />
              <span>Perf: <strong className="text-white capitalize">{performanceMode}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Reduced Motion: <strong className={reducedMotion ? 'text-amber-400' : 'text-emerald-400'}>{reducedMotion ? 'ON' : 'OFF'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Units: <strong className="text-white">{unitSystem.toUpperCase()}</strong></span>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-[#30363d] bg-[#161b22]/50 text-[11px]">
            <button
              onClick={() => setActiveTab('physics')}
              className={`flex-1 py-1.5 text-center font-bold transition-colors ${
                activeTab === 'physics'
                  ? 'text-[#58a6ff] border-b-2 border-[#58a6ff] bg-[#1f242c]'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              Physics State
            </button>
            <button
              onClick={() => setActiveTab('animation')}
              className={`flex-1 py-1.5 text-center font-bold transition-colors ${
                activeTab === 'animation'
                  ? 'text-[#38bdf8] border-b-2 border-[#38bdf8] bg-[#1f242c]'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              Animation Mappings
            </button>
            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`flex-1 py-1.5 text-center font-bold transition-colors ${
                activeTab === 'diagnostics'
                  ? 'text-[#3fb950] border-b-2 border-[#3fb950] bg-[#1f242c]'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              Validation & Alarms
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-3 overflow-y-auto space-y-2.5 text-xs custom-scrollbar">
            {activeTab === 'physics' && (
              <div className="space-y-2">
                <div className="text-[10px] text-[#8b949e] uppercase font-bold tracking-wider">
                  Raw Engineering Calculated Outputs
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  {Object.entries(outputs || {})
                    .filter(([key, val]) => typeof val === 'number' || typeof val === 'string' || typeof val === 'boolean')
                    .slice(0, 14)
                    .map(([key, val]) => (
                      <div key={key} className="p-1.5 bg-[#161b22] rounded border border-[#30363d]/60 flex flex-col justify-between">
                        <span className="text-[9px] text-[#8b949e] truncate" title={key}>{key}</span>
                        <span className="font-bold text-white font-mono mt-0.5 truncate">
                          {typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(3)) : String(val)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {activeTab === 'animation' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8b949e] uppercase font-bold tracking-wider">
                    Physics Animation Mapping Matrix
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#38bdf8]/10 text-[#38bdf8] font-bold border border-[#38bdf8]/30 capitalize">
                    {animationIntensity} Intensity
                  </span>
                </div>

                {/* Specific Physics-to-Animation Mapping Rules */}
                <div className="space-y-1.5">
                  {simulatorMappings.map((m, idx) => (
                    <div key={`${m.simulator}-${idx}`} className="p-2 bg-[#161b22] rounded border border-[#30363d] space-y-1 text-[10px]">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-[#58a6ff]">{m.effectName}</span>
                        <span className="text-white bg-[#0d1117] px-1.5 py-0.5 rounded border border-[#30363d]">
                          {m.governingVariable}
                        </span>
                      </div>
                      <div className="text-[#8b949e] font-mono text-[9px] truncate" title={m.formulaOrRule}>
                        Formula: {m.formulaOrRule}
                      </div>
                      {m.faultThreshold && (
                        <div className="text-emerald-400 text-[9px]">
                          Threshold: {m.faultThreshold} ({m.unitOrScale})
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-[#8b949e] uppercase font-bold tracking-wider pt-1">
                  Active Real-Time Numerical Values
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="p-1.5 bg-[#161b22] rounded border border-[#30363d] flex items-center justify-between">
                    <span className="text-[#8b949e]">Flow Velocity Speed:</span>
                    <span className="font-bold text-[#38bdf8]">{animationParams.flowSpeed.toFixed(2)}x</span>
                  </div>
                  <div className="p-1.5 bg-[#161b22] rounded border border-[#30363d] flex items-center justify-between">
                    <span className="text-[#8b949e]">Cavitation Bubble Intensity:</span>
                    <span className={`font-bold ${animationParams.bubbleIntensity > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {(animationParams.bubbleIntensity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="p-1.5 bg-[#161b22] rounded border border-[#30363d] flex items-center justify-between">
                    <span className="text-[#8b949e]">Structural Vibration Intensity:</span>
                    <span className="font-bold text-amber-400">{(animationParams.vibrationIntensity * 100).toFixed(0)}%</span>
                  </div>
                  <div className="p-1.5 bg-[#161b22] rounded border border-[#30363d] flex items-center justify-between">
                    <span className="text-[#8b949e]">Orbit Whirl Radius:</span>
                    <span className="font-bold text-white">{animationParams.orbitRadius.toFixed(2)} px</span>
                  </div>
                  <div className="p-1.5 bg-[#161b22] rounded border border-[#30363d] flex items-center justify-between">
                    <span className="text-[#8b949e]">Stress Color & Compliance:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: animationParams.stressColor }} />
                      <span className="font-bold text-white">{animationParams.stressColor}</span>
                    </div>
                  </div>
                  <div className="p-1.5 bg-[#161b22] rounded border border-[#30363d] flex items-center justify-between">
                    <span className="text-[#8b949e]">Thermal Glow Color:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: animationParams.temperatureGlow }} />
                      <span className="font-bold text-white">{animationParams.temperatureGlow}</span>
                    </div>
                  </div>
                  <div className="p-1.5 bg-[#161b22] rounded border border-[#30363d] flex items-center justify-between">
                    <span className="text-[#8b949e]">Pressure Pulse Sync:</span>
                    <span className="font-bold text-white">
                      {animationParams.pressurePulse.frequencyHz.toFixed(1)} Hz (Amp: {(animationParams.pressurePulse.amplitude * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="p-1.5 bg-[#161b22] rounded border border-[#30363d] flex items-center justify-between">
                    <span className="text-[#8b949e]">Calculated Bearing Health / Life:</span>
                    <span className="font-bold text-emerald-400">{animationParams.bearingHealth.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'diagnostics' && (
              <div className="space-y-2">
                <div className="text-[10px] text-[#8b949e] uppercase font-bold tracking-wider">
                  Active Mathematical Validation & Warnings
                </div>
                <div className="p-2 bg-[#161b22] rounded border border-[#30363d] space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                    <ShieldCheck size={14} />
                    <span>Deterministic Physics Twin Engine Active</span>
                  </div>
                  <p className="text-[10px] text-[#8b949e]">
                    Every visual animation vector is tied strictly to hydrodynamic, kinematic, ASME B31.3, or API 682 equations.
                  </p>
                </div>

                {outputs.status?.level === 'critical' ? (
                  <div className="p-2 bg-red-950/30 border border-red-800/50 rounded text-red-300 text-[11px] space-y-1">
                    <div className="flex items-center gap-1 font-bold">
                      <AlertTriangle size={13} />
                      <span>CRITICAL TRIP CONDITION</span>
                    </div>
                    <p className="text-[10px] text-red-200">
                      {outputs.status?.message || 'Operational boundaries exceeded.'}
                    </p>
                  </div>
                ) : outputs.status?.level === 'warning' ? (
                  <div className="p-2 bg-amber-950/30 border border-amber-800/50 rounded text-amber-300 text-[11px] space-y-1">
                    <div className="flex items-center gap-1 font-bold">
                      <AlertTriangle size={13} />
                      <span>WARNING THRESHOLD ACTIVE</span>
                    </div>
                    <p className="text-[10px] text-amber-200">
                      {outputs.status?.message || 'Sub-optimal operating condition.'}
                    </p>
                  </div>
                ) : (
                  <div className="p-2 bg-emerald-950/30 border border-emerald-800/50 rounded text-emerald-300 text-[11px]">
                    ✓ Normal Steady-State Operation (All Safety Margins Compliant)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
