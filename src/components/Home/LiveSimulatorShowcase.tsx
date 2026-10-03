import React, { useState, useMemo } from 'react';
import { SimulatorId, UnitSystem } from '../../types/common';
import { useApp } from '../../context/AppContext';
import {
  Activity,
  Wind,
  Flame,
  Cog,
  Disc,
  RotateCw,
  Play,
  Pause,
  ArrowRight,
  Maximize2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';

// Visualizers
import { PumpVisualizer } from '../../simulators/PumpCavitation/PumpVisualizer';
import { CompressorVisualizer } from '../../simulators/CompressorSurge/CompressorVisualizer';
import { SteamTurbineVisualizer } from '../../simulators/SteamTurbine/SteamTurbineVisualizer';
import { GearboxVisualizer } from '../../simulators/Gearbox/GearboxVisualizer';
import { BearingVisualizer } from '../../simulators/BearingFault/BearingVisualizer';
import { RotorVisualizer } from '../../simulators/RotorUnbalance/RotorVisualizer';

// Calculators & Presets
import { calculatePump } from '../../utils/pumpCalculations';
import { calculateCompressorSurge } from '../../utils/compressorCalculations';
import { calculateSteamTurbine } from '../../utils/steamTurbineCalculations';
import { calculateGearbox } from '../../utils/gearboxCalculations';
import { calculateBearingFaults } from '../../utils/bearingCalculations';
import { calculateRotor } from '../../utils/rotorCalculations';

import { PUMP_PRESETS } from '../../utils/pumpPresets';
import { COMPRESSOR_SCENARIOS } from '../../utils/compressorPresets';
import { STEAM_TURBINE_SCENARIOS } from '../../utils/steamTurbinePresets';
import { GEARBOX_SCENARIOS } from '../../utils/gearboxPresets';
import { BEARING_SCENARIOS } from '../../utils/bearingPresets';
import { ROTOR_PRESETS } from '../../utils/rotorPresets';

type FeaturedSimId = 'pump' | 'compressor' | 'turbine' | 'gearbox' | 'bearing' | 'rotor';

interface LiveSimulatorShowcaseProps {
  unitSystem: UnitSystem;
}

export const LiveSimulatorShowcase: React.FC<LiveSimulatorShowcaseProps> = ({ unitSystem }) => {
  const { setActiveRoute, setIsAuditModalOpen, setIsReportModalOpen } = useApp();
  const [activeAsset, setActiveAsset] = useState<FeaturedSimId>('pump');
  const [isRunning, setIsRunning] = useState<boolean>(true);

  // 1. Pump State
  const [pumpSpeedRpm, setPumpSpeedRpm] = useState<number>(1800);
  const [pumpFlowRateM3h, setPumpFlowRateM3h] = useState<number>(180);
  const pumpInputs = useMemo(() => ({
    ...PUMP_PRESETS[0].inputs,
    pumpSpeedRpm,
    flowRateM3h: pumpFlowRateM3h,
  }), [pumpSpeedRpm, pumpFlowRateM3h]);
  const pumpOutputs = useMemo(() => calculatePump(pumpInputs), [pumpInputs]);

  // 2. Compressor State
  const [compSpeedRpm, setCompSpeedRpm] = useState<number>(10500);
  const [compFlowRateM3h, setCompFlowRateM3h] = useState<number>(4200);
  const compInputs = useMemo(() => ({
    ...COMPRESSOR_SCENARIOS[0].inputs,
    operatingSpeedRpm: compSpeedRpm,
    suctionFlowM3Hr: compFlowRateM3h,
  }), [compSpeedRpm, compFlowRateM3h]);
  const compOutputs = useMemo(() => calculateCompressorSurge(compInputs), [compInputs]);

  // 3. Steam Turbine State
  const [turbSpeedRpm, setTurbSpeedRpm] = useState<number>(6000);
  const [turbPowerKw, setTurbPowerKw] = useState<number>(3500);
  const turbInputs = useMemo(() => ({
    ...STEAM_TURBINE_SCENARIOS[0].inputs,
    operatingSpeedRpm: turbSpeedRpm,
    ratedPowerKw: turbPowerKw,
  }), [turbSpeedRpm, turbPowerKw]);
  const turbOutputs = useMemo(() => calculateSteamTurbine(turbInputs), [turbInputs]);

  // 4. Gearbox State
  const [gearPinionRpm, setGearPinionRpm] = useState<number>(1500);
  const [gearPowerKw, setGearPowerKw] = useState<number>(450);
  const gearInputs = useMemo(() => ({
    ...GEARBOX_SCENARIOS[0].inputs,
    inputSpeedRpm: gearPinionRpm,
    ratedPowerKw: gearPowerKw,
  }), [gearPinionRpm, gearPowerKw]);
  const gearOutputs = useMemo(() => calculateGearbox(gearInputs), [gearInputs]);

  // 5. Bearing State
  const [bearingSpeedRpm, setBearingSpeedRpm] = useState<number>(1780);
  const [bearingSeverity, setBearingSeverity] = useState<number>(35);
  const bearingInputs = useMemo(() => ({
    ...BEARING_SCENARIOS[0].inputs,
    shaftSpeedRpm: bearingSpeedRpm,
    faultSeverityPercent: bearingSeverity,
  }), [bearingSpeedRpm, bearingSeverity]);
  const bearingOutputs = useMemo(() => calculateBearingFaults(bearingInputs), [bearingInputs]);

  // 6. Rotor State
  const [rotorSpeedRpm, setRotorSpeedRpm] = useState<number>(2950);
  const [rotorUnbalance, setRotorUnbalance] = useState<number>(25);
  const rotorInputs = useMemo(() => ({
    ...ROTOR_PRESETS[0].inputs,
    runningSpeedRpm: rotorSpeedRpm,
    unbalanceAmountGmm: rotorUnbalance,
  }), [rotorSpeedRpm, rotorUnbalance]);
  const rotorOutputs = useMemo(() => calculateRotor(rotorInputs), [rotorInputs]);

  // Visual Assets Metadata with sleek dark color identities matching livesimulators.com
  const featuredAssets: Array<{
    id: FeaturedSimId;
    name: string;
    standard: string;
    category: string;
    icon: React.ElementType;
    accentColor: string;
    badgeStyle: string;
    activeTabClass: string;
    btnClass: string;
    panelBg: string;
  }> = [
    {
      id: 'pump',
      name: 'Pump Cavitation & NPSH',
      standard: 'API 610 12th Ed / HI 9.6.1',
      category: 'Centrifugal Turbomachinery',
      icon: Activity,
      accentColor: '#38bdf8', // Cyan-400
      badgeStyle: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
      activeTabClass: 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25 border-cyan-400 font-bold',
      btnClass: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold',
      panelBg: 'bg-gradient-to-b from-[#081a2e] via-[#071322] to-[#040a14] border-cyan-500/30',
    },
    {
      id: 'compressor',
      name: 'Compressor Surge & SLL',
      standard: 'API 617 8th Ed / ASME PTC 10',
      category: 'Dynamic Turbomachinery',
      icon: Wind,
      accentColor: '#fbbf24', // Amber-400
      badgeStyle: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
      activeTabClass: 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 border-amber-400 font-bold',
      btnClass: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold',
      panelBg: 'bg-gradient-to-b from-[#1c1406] via-[#120c04] to-[#060402] border-amber-500/30',
    },
    {
      id: 'turbine',
      name: 'Steam Turbine Thermodynamics',
      standard: 'API 612 8th Ed / ASME PTC 6',
      category: 'Thermal Power Expansion',
      icon: Flame,
      accentColor: '#fb7185', // Rose-400
      badgeStyle: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
      activeTabClass: 'bg-rose-500 text-white shadow-md shadow-rose-500/25 border-rose-400 font-bold',
      btnClass: 'bg-rose-500 hover:bg-rose-400 text-white font-bold',
      panelBg: 'bg-gradient-to-b from-[#1f0a0e] via-[#130608] to-[#060204] border-rose-500/30',
    },
    {
      id: 'gearbox',
      name: 'Industrial Gearbox Kinematics',
      standard: 'AGMA 6011 / ISO 6336',
      category: 'Power Transmission',
      icon: Cog,
      accentColor: '#fb923c', // Orange-400
      badgeStyle: 'bg-orange-950/80 text-orange-300 border-orange-500/40',
      activeTabClass: 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/25 border-orange-400 font-bold',
      btnClass: 'bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold',
      panelBg: 'bg-gradient-to-b from-[#1d0f05] via-[#120a03] to-[#060301] border-orange-500/30',
    },
    {
      id: 'bearing',
      name: 'Bearing Fault Vibration Frequencies',
      standard: 'ISO 10816 / ISO 15243',
      category: 'High-Frequency Diagnostics',
      icon: Disc,
      accentColor: '#c084fc', // Violet-400
      badgeStyle: 'bg-violet-950/80 text-violet-300 border-violet-500/40',
      activeTabClass: 'bg-violet-500 text-white shadow-md shadow-violet-500/25 border-violet-400 font-bold',
      btnClass: 'bg-violet-500 hover:bg-violet-400 text-white font-bold',
      panelBg: 'bg-gradient-to-b from-[#160c22] via-[#0e0717] to-[#050209] border-violet-500/30',
    },
    {
      id: 'rotor',
      name: 'Rotor Dynamics & Balancing',
      standard: 'ISO 1940 / API 684',
      category: 'Rotordynamics & Resonance',
      icon: RotateCw,
      accentColor: '#34d399', // Emerald-400
      badgeStyle: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
      activeTabClass: 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 border-emerald-400 font-bold',
      btnClass: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold',
      panelBg: 'bg-gradient-to-b from-[#081f15] via-[#05140e] to-[#020805] border-emerald-500/30',
    },
  ];

  const currentAsset = featuredAssets.find((a) => a.id === activeAsset) || featuredAssets[0];

  return (
    <div className="w-full rounded-2xl bg-[#081220]/95 border border-cyan-500/25 shadow-[0_0_35px_rgba(6,182,212,0.06)] p-4 sm:p-6 space-y-4 text-slate-200">
      {/* Top Banner: Asset Switcher Tabs & Live Verification */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
              Interactive Working Simulator Preview • Client-Side Float64 Solvers
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 font-semibold">
              60 FPS Physics Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Manipulate operating parameters below in real time to inspect instantaneous fluid dynamics, stress tensors, and transient vibration profiles.
          </p>
        </div>

        {/* Quick Simulator Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#040913] border border-slate-800">
          {featuredAssets.map((asset) => {
            const Icon = asset.icon;
            const isSelected = activeAsset === asset.id;
            return (
              <button
                key={asset.id}
                onClick={() => setActiveAsset(asset.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                  isSelected
                    ? `${asset.activeTabClass}`
                    : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon size={13} className={isSelected ? 'text-inherit' : undefined} style={{ color: !isSelected ? asset.accentColor : undefined }} />
                <span>{asset.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Showcase Layout: Left Controls & Telemetry | Right Visualizer Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Column: Live Knobs, Equation & Output Telemetry (5 cols) */}
        <div className={`lg:col-span-5 flex flex-col justify-between p-4 rounded-xl border ${currentAsset.panelBg} space-y-4`}>
          <div className="space-y-3.5">
            {/* Asset Identity Banner */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs shrink-0 bg-[#040914]"
                  style={{
                    borderColor: `${currentAsset.accentColor}60`,
                    color: currentAsset.accentColor,
                  }}
                >
                  <currentAsset.icon size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    {currentAsset.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${currentAsset.badgeStyle}`}>
                      {currentAsset.standard}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {currentAsset.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Pill */}
              <div className="shrink-0">
                {activeAsset === 'pump' && (
                  <span
                    className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                      pumpOutputs.status?.level === 'safe'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        : pumpOutputs.status?.level === 'warning'
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                        : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {pumpOutputs.status?.level === 'safe' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                    <span className="uppercase">{pumpOutputs.status?.level || 'SAFE'}</span>
                  </span>
                )}
                {activeAsset === 'compressor' && (
                  <span
                    className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                      compOutputs.status?.level === 'safe'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        : compOutputs.status?.level === 'warning'
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                        : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {compOutputs.status?.level === 'safe' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                    <span className="uppercase">{compOutputs.status?.level || 'SAFE'}</span>
                  </span>
                )}
                {activeAsset === 'turbine' && (
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 bg-emerald-950/80 text-emerald-300 border-emerald-500/40">
                    <CheckCircle2 size={12} />
                    <span>NORMAL</span>
                  </span>
                )}
                {activeAsset === 'gearbox' && (
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 bg-emerald-950/80 text-emerald-300 border-emerald-500/40">
                    <CheckCircle2 size={12} />
                    <span>MESH OK</span>
                  </span>
                )}
                {activeAsset === 'bearing' && (
                  <span
                    className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                      bearingSeverity < 40
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        : bearingSeverity < 70
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                        : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    <AlertTriangle size={12} />
                    <span>{bearingSeverity < 40 ? 'ZONE A/B' : bearingSeverity < 70 ? 'ZONE C' : 'ZONE D TRIP'}</span>
                  </span>
                )}
                {activeAsset === 'rotor' && (
                  <span
                    className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                      rotorOutputs.status?.level === 'safe'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    <CheckCircle2 size={12} />
                    <span className="uppercase">{rotorOutputs.status?.level || 'BALANCED'}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Interactive Sliders for Active Asset */}
            <div className="p-3 rounded-xl bg-[#040914]/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-300">
                <span className="flex items-center gap-1">
                  <Sliders size={12} style={{ color: currentAsset.accentColor }} />
                  <span>Real-Time Operator Knobs</span>
                </span>
                <span className="text-[10px] text-slate-500">Continuous Evaluation</span>
              </div>

              {activeAsset === 'pump' && (
                <div className="space-y-2.5 text-xs font-mono">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Shaft Speed (RPM):</span>
                      <span className="font-bold text-white">{pumpSpeedRpm} RPM</span>
                    </div>
                    <input
                      type="range"
                      min={900}
                      max={3600}
                      step={50}
                      value={pumpSpeedRpm}
                      onChange={(e) => setPumpSpeedRpm(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Flow Rate (Q):</span>
                      <span className="font-bold text-white">{pumpFlowRateM3h} m³/h</span>
                    </div>
                    <input
                      type="range"
                      min={40}
                      max={320}
                      step={5}
                      value={pumpFlowRateM3h}
                      onChange={(e) => setPumpFlowRateM3h(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                </div>
              )}

              {activeAsset === 'compressor' && (
                <div className="space-y-2.5 text-xs font-mono">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Impeller Speed:</span>
                      <span className="font-bold text-white">{compSpeedRpm} RPM</span>
                    </div>
                    <input
                      type="range"
                      min={7000}
                      max={14000}
                      step={100}
                      value={compSpeedRpm}
                      onChange={(e) => setCompSpeedRpm(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Suction Flow (m³/h):</span>
                      <span className="font-bold text-white">{compFlowRateM3h} m³/h</span>
                    </div>
                    <input
                      type="range"
                      min={2200}
                      max={6500}
                      step={50}
                      value={compFlowRateM3h}
                      onChange={(e) => setCompFlowRateM3h(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                  </div>
                </div>
              )}

              {activeAsset === 'turbine' && (
                <div className="space-y-2.5 text-xs font-mono">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Turbine Speed:</span>
                      <span className="font-bold text-white">{turbSpeedRpm} RPM</span>
                    </div>
                    <input
                      type="range"
                      min={3000}
                      max={12000}
                      step={100}
                      value={turbSpeedRpm}
                      onChange={(e) => setTurbSpeedRpm(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Shaft Power Output:</span>
                      <span className="font-bold text-white">{turbPowerKw} kW</span>
                    </div>
                    <input
                      type="range"
                      min={1000}
                      max={10000}
                      step={100}
                      value={turbPowerKw}
                      onChange={(e) => setTurbPowerKw(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
                    />
                  </div>
                </div>
              )}

              {activeAsset === 'gearbox' && (
                <div className="space-y-2.5 text-xs font-mono">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Pinion Input Speed:</span>
                      <span className="font-bold text-white">{gearPinionRpm} RPM</span>
                    </div>
                    <input
                      type="range"
                      min={600}
                      max={3000}
                      step={50}
                      value={gearPinionRpm}
                      onChange={(e) => setGearPinionRpm(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-400"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Transmitted Power:</span>
                      <span className="font-bold text-white">{gearPowerKw} kW</span>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={1500}
                      step={25}
                      value={gearPowerKw}
                      onChange={(e) => setGearPowerKw(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-400"
                    />
                  </div>
                </div>
              )}

              {activeAsset === 'bearing' && (
                <div className="space-y-2.5 text-xs font-mono">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Shaft Rotation Speed:</span>
                      <span className="font-bold text-white">{bearingSpeedRpm} RPM</span>
                    </div>
                    <input
                      type="range"
                      min={600}
                      max={3600}
                      step={50}
                      value={bearingSpeedRpm}
                      onChange={(e) => setBearingSpeedRpm(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-400"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Fault Severity Spall:</span>
                      <span className="font-bold text-white">{bearingSeverity}% Defect</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={100}
                      step={5}
                      value={bearingSeverity}
                      onChange={(e) => setBearingSeverity(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-400"
                    />
                  </div>
                </div>
              )}

              {activeAsset === 'rotor' && (
                <div className="space-y-2.5 text-xs font-mono">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Rotor Train Speed:</span>
                      <span className="font-bold text-white">{rotorSpeedRpm} RPM</span>
                    </div>
                    <input
                      type="range"
                      min={1000}
                      max={6000}
                      step={50}
                      value={rotorSpeedRpm}
                      onChange={(e) => setRotorSpeedRpm(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Residual Unbalance:</span>
                      <span className="font-bold text-white">{rotorUnbalance} g·mm</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={80}
                      step={1}
                      value={rotorUnbalance}
                      onChange={(e) => setRotorUnbalance(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Instantaneous Float64 Telemetry Readouts */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {activeAsset === 'pump' && (
                <>
                  <div className="p-2.5 rounded-lg bg-[#040914]/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">NPSH Margin (ΔNPSH)</span>
                    <span className={`text-sm font-bold ${pumpOutputs.npshMarginM >= 0.5 ? 'text-cyan-400' : 'text-rose-400'}`}>
                      {pumpOutputs.npshMarginM.toFixed(2)} m
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#040914]/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Total Pump Head (H)</span>
                    <span className="text-sm font-bold text-white">
                      {pumpOutputs.operatingHeadM.toFixed(1)} m
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#040914]/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Suction Velocity</span>
                    <span className="text-sm font-bold text-white">
                      {pumpOutputs.fluidVelocityMs.toFixed(2)} m/s
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#040914]/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Suction Specific Speed Nss</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {pumpOutputs.suctionSpecificSpeedMetric.toFixed(0)}
                    </span>
                  </div>
                </>
              )}

              {activeAsset === 'compressor' && (
                <>
                  <div className="p-2.5 rounded-lg bg-[#040914]/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Surge Margin (SLL)</span>
                    <span className={`text-sm font-bold ${compOutputs.currentSurgeMarginPercent >= 10 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {compOutputs.currentSurgeMarginPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#040914]/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Pressure Ratio (rc)</span>
                    <span className="text-sm font-bold text-white">
                      {compOutputs.pressureRatioRc.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#040914]/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Polytropic Head</span>
                    <span className="text-sm font-bold text-white">
                      {compOutputs.polytropicHeadKjKg.toFixed(1)} kJ/kg
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#040914]/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Gas Discharge Temp</span>
                    <span className="text-sm font-bold text-rose-400">
                      {compOutputs.dischargeTempC.toFixed(1)} °C
                    </span>
                  </div>
                </>
              )}

              {activeAsset === 'turbine' && (
                <>
                  <div className="p-2.5 rounded-lg bg-[#040914]/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Steam Flow Demand</span>
                    <span className="text-sm font-bold text-rose-400">
                      {turbOutputs.steamMassFlowTonnesHr.toFixed(1)} t/h
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#040914]/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Isentropic Efficiency</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {turbOutputs.isentropicEfficiencyPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#040914]/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Exhaust Moisture (1-x)</span>
                    <span className="text-sm font-bold text-white">
                      {turbOutputs.exhaustMoisturePercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#040914]/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Enthalpy Drop (Δh)</span>
                    <span className="text-sm font-bold text-white">
                      {turbOutputs.actualEnthalpyDropKjKg.toFixed(1)} kJ/kg
                    </span>
                  </div>
                </>
              )}

              {activeAsset === 'gearbox' && (
                <>
                  <div className="p-2.5 rounded-lg bg-[#040914]/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Mesh Frequency (GMF)</span>
                    <span className="text-sm font-bold text-orange-400">
                      {gearOutputs.gearMeshFrequencyHz.toFixed(1)} Hz
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#040914]/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Output Gear Speed</span>
                    <span className="text-sm font-bold text-white">
                      {gearOutputs.outputSpeedRpm.toFixed(0)} RPM
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#040914]/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Contact Stress (σH)</span>
                    <span className="text-sm font-bold text-white">
                      {gearOutputs.contactStressMpa.toFixed(0)} MPa
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#040914]/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Pitting Safety Factor SH</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {gearOutputs.contactSafetyFactorSH.toFixed(2)}
                    </span>
                  </div>
                </>
              )}

              {activeAsset === 'bearing' && (
                <>
                  <div className="p-2.5 rounded-lg bg-[#040914]/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Outer Race (BPFO)</span>
                    <span className="text-sm font-bold text-violet-400">
                      {bearingOutputs.frequencies.bpfoHz.toFixed(1)} Hz
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#040914]/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Inner Race (BPFI)</span>
                    <span className="text-sm font-bold text-white">
                      {bearingOutputs.frequencies.bpfiHz.toFixed(1)} Hz
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#040914]/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Ball Spin (BSF)</span>
                    <span className="text-sm font-bold text-white">
                      {bearingOutputs.frequencies.bsfHz.toFixed(1)} Hz
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#040914]/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Fundamental Train (FTF)</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {bearingOutputs.frequencies.ftfHz.toFixed(1)} Hz
                    </span>
                  </div>
                </>
              )}

              {activeAsset === 'rotor' && (
                <>
                  <div className="p-2.5 rounded-lg bg-[#040914]/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">1X Vibration Velocity RMS</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {rotorOutputs.vibrationVelocityRmsMmS.toFixed(2)} mm/s
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#040914]/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Dynamic Unbalance Force</span>
                    <span className="text-sm font-bold text-white">
                      {rotorOutputs.dynamicUnbalanceForceN.toFixed(1)} N
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#040914]/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Pk-Pk Vibration</span>
                    <span className="text-sm font-bold text-white">
                      {rotorOutputs.vibrationDisplacementPkPkMicrons.toFixed(1)} µm
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#040914]/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">1st Critical Speed</span>
                    <span className="text-sm font-bold text-amber-400">
                      {rotorOutputs.criticalSpeedRpm.toFixed(0)} RPM
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action CTAs: Launch Full Simulator or Inspect Formulas */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2 border-t border-slate-800">
            <button
              onClick={() => setActiveRoute(activeAsset)}
              className={`w-full sm:flex-1 py-2.5 px-4 rounded-xl font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${currentAsset.btnClass}`}
            >
              <span>Launch Full {currentAsset.name.split(' ')[0]} Module</span>
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="w-full sm:w-auto py-2.5 px-3 rounded-xl bg-[#0a1424] hover:bg-[#0f1f38] border border-slate-700 text-slate-300 font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="View full equation step-by-step audit trail"
            >
              <FileText size={13} className="text-slate-400" />
              <span>Audit Trail</span>
            </button>
          </div>
        </div>

        {/* Right Column: High-Contrast 60 FPS Visualizer Frame (7 cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-xl bg-[#090e1a] border border-slate-800 shadow-md overflow-hidden min-h-[360px] sm:min-h-[420px] relative">
          {/* Visualizer Frame Header Bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#0d1527] border-b border-slate-800 text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-cyan-300 font-bold uppercase">
                {currentAsset.name} Twin Visualizer
              </span>
              <span className="text-slate-400 hidden sm:inline">• 60 FPS ODE SOLVER</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors flex items-center gap-1 cursor-pointer ${
                  isRunning ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                }`}
              >
                {isRunning ? <Pause size={10} /> : <Play size={10} />}
                <span>{isRunning ? 'RUNNING' : 'PAUSED'}</span>
              </button>

              <button
                onClick={() => setActiveRoute(activeAsset)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                title="Open Workbench in Full Screen"
              >
                <Maximize2 size={10} />
                <span className="hidden sm:inline">Workbench</span>
              </button>
            </div>
          </div>

          {/* Render Active 60 FPS Animated Visualizer */}
          <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center p-2">
            {activeAsset === 'pump' && (
              <PumpVisualizer
                inputs={pumpInputs}
                outputs={pumpOutputs}
                isRunning={isRunning}
                unitSystem={unitSystem}
              />
            )}

            {activeAsset === 'compressor' && (
              <CompressorVisualizer
                inputs={compInputs}
                outputs={compOutputs}
                isRunning={isRunning}
                unitSystem={unitSystem}
              />
            )}

            {activeAsset === 'turbine' && (
              <SteamTurbineVisualizer
                inputs={turbInputs}
                outputs={turbOutputs}
                isRunning={isRunning}
                unitSystem={unitSystem}
              />
            )}

            {activeAsset === 'gearbox' && (
              <GearboxVisualizer
                inputs={gearInputs}
                outputs={gearOutputs}
                isRunning={isRunning}
                unitSystem={unitSystem}
              />
            )}

            {activeAsset === 'bearing' && (
              <BearingVisualizer
                inputs={bearingInputs}
                outputs={bearingOutputs}
                isRunning={isRunning}
                unitSystem={unitSystem}
              />
            )}

            {activeAsset === 'rotor' && (
              <RotorVisualizer
                inputs={rotorInputs}
                outputs={rotorOutputs}
                isRunning={isRunning}
                unitSystem={unitSystem}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
