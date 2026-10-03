import React, { useState, useEffect } from 'react';
import { UnitSystem, StatusLevel, SimulatorId } from '../../types/common';
import { useSimulationStore } from '../../engine/simulationStore';
import { AnimationIntensity } from '../../engine/types';
import {
  Eye,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Layers,
  Info,
  Zap,
  X,
  ShieldAlert,
  Sparkles,
  Layout,
  GitCompare,
  Activity,
  FileText,
  BookOpen,
  Scale,
  Play,
  Pause,
  Square,
  RotateCcw,
} from 'lucide-react';
import { ScenarioItem } from './types';
import { SimulatorSchematicDiagram } from '../Shared/SimulatorSchematicDiagram';
import { useApp } from '../../context/AppContext';

interface WorkbenchCenterPanelProps<TInputs extends Record<string, any>, TOutputs extends Record<string, any>> {
  title: string;
  subtitle?: string;
  VisualComponent: React.ComponentType<{
    inputs: TInputs;
    outputs: TOutputs;
    isRunning: boolean;
    unitSystem: UnitSystem;
    [key: string]: any;
  }>;
  inputs: TInputs;
  outputs: TOutputs;
  isRunning: boolean;
  unitSystem: UnitSystem;
  chartComponent?: React.ReactNode | ((props: { inputs: TInputs; outputs: TOutputs; unitSystem: UnitSystem }) => React.ReactNode);
  chartTabLabel?: string;
  visualTabLabel?: string;
  simulatorType?: 'pump-cavitation' | 'compressor-surge' | 'bearing-fault' | 'journal-bearing' | 'recip-compressor' | 'rotor-unbalance' | 'pipe-stress' | 'seal-flush-plan' | 'alignment' | 'gearbox' | 'steam-turbine';
  simulatorId?: string;
  telemetryItems?: Array<{
    label: string;
    value: string | number;
    highlight?: 'default' | 'primary' | 'safe' | 'warning' | 'critical';
  }>;
  status: {
    level: StatusLevel;
    label: string;
    message?: string;
  };
  scenarios?: ScenarioItem<TInputs>[];
  activeScenarioId?: string;
  onSelectScenario?: (id: string) => void;
  disclaimerText?: string;
  onOpenInfo?: () => void;
  onAuditRequested?: () => void;
  onReportRequested?: () => void;
  onToggleRunning?: () => void;
  onReset?: () => void;
}

const COMPLEMENTARY_TWINS: Record<string, { partnerId: SimulatorId; partnerLabel: string }> = {
  pump: { partnerId: 'seal', partnerLabel: 'Mechanical Seal' },
  compressor: { partnerId: 'turbine', partnerLabel: 'Steam Turbine' },
  turbine: { partnerId: 'compressor', partnerLabel: 'Centrifugal Compressor' },
  gearbox: { partnerId: 'bearing', partnerLabel: 'Bearing Faults' },
  bearing: { partnerId: 'journal', partnerLabel: 'Journal Bearing' },
  journal: { partnerId: 'rotor', partnerLabel: 'Rotor Unbalance' },
  rotor: { partnerId: 'alignment', partnerLabel: 'Shaft Alignment' },
  alignment: { partnerId: 'rotor', partnerLabel: 'Rotor Unbalance' },
  recip: { partnerId: 'pipe', partnerLabel: 'Pipe Pulsation' },
  pipe: { partnerId: 'recip', partnerLabel: 'Recip Compressor' },
  seal: { partnerId: 'pump', partnerLabel: 'Centrifugal Pump' },
};

export function WorkbenchCenterPanel<TInputs extends Record<string, any>, TOutputs extends Record<string, any>>({
  title,
  subtitle,
  VisualComponent,
  inputs,
  outputs,
  isRunning,
  unitSystem,
  chartComponent,
  chartTabLabel = 'Engineering Curves',
  visualTabLabel = 'Physical Twin',
  simulatorType,
  simulatorId,
  telemetryItems,
  status,
  scenarios,
  activeScenarioId,
  onSelectScenario,
  disclaimerText,
  onOpenInfo,
  onAuditRequested,
  onReportRequested,
  onToggleRunning,
  onReset,
}: WorkbenchCenterPanelProps<TInputs, TOutputs>) {
  const {
    openComparatorWith,
    setIsSpectralLabOpen,
    setIsAuditModalOpen,
    setIsReportModalOpen,
    setActiveRoute,
  } = useApp();

  const [activeCenterView, setActiveCenterView] = useState<'visual' | 'chart' | 'schematic'>('visual');
  const animationIntensity = useSimulationStore((state) => state.animationIntensity);
  const setAnimationIntensity = useSimulationStore((state) => state.setAnimationIntensity);
  const [showToast, setShowToast] = useState<boolean>(true);

  const activeScenario = scenarios?.find((s) => s.id === activeScenarioId);

  const partnerInfo = simulatorId ? COMPLEMENTARY_TWINS[simulatorId] : null;

  const handleAuditClick = () => {
    if (onAuditRequested) {
      onAuditRequested();
    } else {
      setIsAuditModalOpen(true);
    }
  };

  const handleReportClick = () => {
    if (onReportRequested) {
      onReportRequested();
    } else {
      setIsReportModalOpen(true);
    }
  };

  const handleCompareClick = () => {
    if (simulatorId && partnerInfo) {
      openComparatorWith(simulatorId as SimulatorId, partnerInfo.partnerId);
    } else {
      openComparatorWith();
    }
  };

  // When active scenario changes, ensure toast is shown
  useEffect(() => {
    if (activeScenarioId) {
      setShowToast(true);
    }
  }, [activeScenarioId]);

  const getStatusBadge = () => {
    switch (status.level) {
      case 'safe':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 text-xs font-mono font-bold shadow-sm">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span className="uppercase">{status.label}</span>
          </div>
        );
      case 'warning':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/80 border border-amber-700/60 text-amber-400 text-xs font-mono font-bold shadow-sm">
            <AlertTriangle size={12} className="text-amber-400" />
            <span className="uppercase">{status.label}</span>
          </div>
        );
      case 'critical':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-950/80 border border-red-700/60 text-red-400 text-xs font-mono font-bold shadow-sm animate-pulse">
            <AlertOctagon size={12} className="text-red-400" />
            <span className="uppercase">{status.label}</span>
          </div>
        );
    }
  };

  const getHighlightColor = (highlight?: string) => {
    switch (highlight) {
      case 'primary':
        return 'text-[#58a6ff]';
      case 'safe':
        return 'text-emerald-400';
      case 'warning':
        return 'text-amber-400';
      case 'critical':
        return 'text-red-400';
      default:
        return 'text-white';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#080b0f] relative overflow-hidden select-none min-w-0">
      {/* Top HUD Telemetry Bar (Desktop) */}
      <div className="h-9 px-3 bg-[#161b22] border-b border-[#30363d] hidden md:flex items-center justify-between shrink-0 z-20">
        {/* Left Telemetry Indicators & Simulation Cockpit Controls */}
        <div className="flex items-center gap-3 text-xs font-mono truncate mr-2">
          {/* Primary Simulation Controls */}
          <div className="flex items-center gap-1 bg-[#0d1117] p-0.5 rounded border border-[#30363d]">
            <button
              type="button"
              id="hud-btn-toggle-run"
              onClick={onToggleRunning}
              title={isRunning ? 'Pause physics simulation' : 'Start / Resume live physics simulation'}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                isRunning
                  ? 'bg-emerald-950/80 border border-emerald-600/80 text-emerald-400 hover:bg-emerald-900/80 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                  : 'bg-amber-950/80 border border-amber-600/80 text-amber-400 hover:bg-amber-900/80 animate-pulse'
              }`}
            >
              {isRunning ? <Pause size={11} className="fill-current" /> : <Play size={11} className="fill-current" />}
              <span>{isRunning ? 'PAUSE' : 'START'}</span>
            </button>

            <button
              type="button"
              id="hud-btn-stop"
              onClick={() => {
                if (isRunning && onToggleRunning) onToggleRunning();
              }}
              title="Stop simulation (decelerate / trip to halt)"
              className="p-1 rounded text-[11px] text-zinc-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer border border-transparent hover:border-red-900/40"
            >
              <Square size={11} className="fill-current" />
            </button>

            {onReset && (
              <button
                type="button"
                id="hud-btn-reset"
                onClick={onReset}
                title="Reset simulation parameters to nominal scenario baseline"
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-zinc-400 hover:text-cyan-400 hover:bg-cyan-950/40 transition-colors cursor-pointer border border-transparent hover:border-cyan-900/40"
              >
                <RotateCcw size={11} />
                <span className="hidden lg:inline">RESET</span>
              </button>
            )}
          </div>

          <div className="h-4 w-px bg-[#30363d] hidden sm:block" />

          {telemetryItems && telemetryItems.length > 0 ? (
            telemetryItems.map((item, idx) => (
              <span key={idx} className="text-[#8b949e] flex items-center gap-1.5">
                <span>{item.label}:</span>
                <strong className={getHighlightColor(item.highlight)}>{item.value}</strong>
              </span>
            ))
          ) : (
            <span className="text-[#8b949e] hidden sm:inline">
              STATE: <strong className={isRunning ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{isRunning ? 'RUNNING (60 FPS)' : 'PAUSED'}</strong>
            </span>
          )}
        </div>

        {/* View Mode Toggle (Visualizer vs Curves), Intensity & Info Icon */}
        <div className="flex items-center gap-2">
          {/* Animation Intensity Quick Selector */}
          <div className="flex items-center bg-[#0d1117] p-0.5 rounded border border-[#30363d] text-[10px] font-mono">
            <span className="px-1.5 text-[#8b949e] flex items-center gap-1">
              <Zap size={11} className="text-[#38bdf8]" />
              <span>FX:</span>
            </span>
            {(['high', 'medium', 'low'] as AnimationIntensity[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setAnimationIntensity(lvl)}
                className={`px-1.5 py-0.5 rounded uppercase font-bold transition-all ${
                  animationIntensity === lvl
                    ? 'bg-[#38bdf8] text-black'
                    : 'text-[#8b949e] hover:text-white'
                }`}
                title={`Set physics animation intensity to ${lvl}`}
              >
                {lvl[0]}
              </button>
            ))}
          </div>

          {/* Center View Mode Switcher */}
          <div className="flex items-center gap-1 bg-[#0d1117] p-0.5 rounded border border-[#30363d] shrink-0">
            <button
              id="btn-center-view-visual"
              onClick={() => setActiveCenterView('visual')}
              className={`flex items-center gap-1 px-2 py-0.5 text-xs font-mono rounded transition-colors cursor-pointer ${
                activeCenterView === 'visual'
                  ? 'bg-[#f27d26] text-black font-bold shadow-sm'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              <Eye size={12} />
              <span>{visualTabLabel}</span>
            </button>

            {simulatorType && (
              <button
                id="btn-center-view-schematic"
                onClick={() => setActiveCenterView('schematic')}
                className={`flex items-center gap-1 px-2 py-0.5 text-xs font-mono rounded transition-colors cursor-pointer ${
                  activeCenterView === 'schematic'
                    ? 'bg-[#f27d26] text-black font-bold shadow-sm'
                    : 'text-[#8b949e] hover:text-white'
                }`}
              >
                <Layout size={12} />
                <span>P&ID Schematic</span>
              </button>
            )}

            {chartComponent && (
              <button
                id="btn-center-view-chart"
                onClick={() => setActiveCenterView('chart')}
                className={`flex items-center gap-1 px-2 py-0.5 text-xs font-mono rounded transition-colors cursor-pointer ${
                  activeCenterView === 'chart'
                    ? 'bg-[#f27d26] text-black font-bold shadow-sm'
                    : 'text-[#8b949e] hover:text-white'
                }`}
              >
                <BarChart2 size={12} />
                <span>{chartTabLabel}</span>
              </button>
            )}
          </div>

          {/* Quick Engineering Tools */}
          <div className="flex items-center gap-1">
            {/* Audit Trail Button */}
            <button
              onClick={handleAuditClick}
              title="Step-by-step Mathematical Calculation Audit Trail & Governing Formulas"
              className="flex items-center gap-1 px-2 py-1 bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-emerald-500/60 rounded text-xs font-mono text-[#8b949e] hover:text-emerald-400 transition-colors shadow-sm cursor-pointer"
            >
              <BookOpen size={12} className="text-emerald-400" />
              <span className="text-[11px] hidden lg:inline">Audit</span>
            </button>

            {/* Printable Engineering Report */}
            <button
              onClick={handleReportClick}
              title="Generate Formal Engineering Assessment Summary Report (PDF / Print / CSV)"
              className="flex items-center gap-1 px-2 py-1 bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-blue-500/60 rounded text-xs font-mono text-[#8b949e] hover:text-blue-400 transition-colors shadow-sm cursor-pointer"
            >
              <FileText size={12} className="text-blue-400" />
              <span className="text-[11px] hidden lg:inline">Report</span>
            </button>

            {/* Cross-Asset Twin Comparator */}
            <button
              onClick={handleCompareClick}
              title={partnerInfo ? `Side-by-Side Comparison with ${partnerInfo.partnerLabel}` : "Cross-Asset Twin Comparator"}
              className="flex items-center gap-1 px-2 py-1 bg-orange-950/40 hover:bg-orange-950/80 border border-[#f27d26]/50 hover:border-[#f27d26] rounded text-xs font-mono text-[#f27d26] transition-colors shadow-sm cursor-pointer font-bold"
            >
              <GitCompare size={12} className="text-[#f27d26]" />
              <span className="text-[11px] hidden xl:inline">Compare Twin</span>
            </button>

            {/* Spectral Lab */}
            <button
              onClick={() => setIsSpectralLabOpen(true)}
              title="Spectral Diagnostic Lab (FFT Spectrum, Cascade Waterfall & Harmonics)"
              className="flex items-center gap-1 px-2 py-1 bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-purple-500/60 rounded text-xs font-mono text-[#8b949e] hover:text-purple-300 transition-colors shadow-sm cursor-pointer"
            >
              <Activity size={12} className="text-purple-400" />
              <span className="text-[11px] hidden xl:inline">Spectral</span>
            </button>

            {/* Governing Standards Reference */}
            <button
              onClick={() => setActiveRoute('standards')}
              title="Governing Standards Matrix & Clauses Directory (API 610/612/617/618/682, AGMA, ISO)"
              className="flex items-center gap-1 px-2 py-1 bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff] rounded text-xs font-mono text-[#8b949e] hover:text-white transition-colors shadow-sm cursor-pointer"
            >
              <Scale size={12} className="text-[#58a6ff]" />
              <span className="text-[11px]">Standards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Top Header (Tool Title, Scenario Dropdown, Status Badge) */}
      <div className="md:hidden w-full bg-[#161b22] border-b border-[#30363d] px-2.5 py-1.5 flex flex-col gap-1.5 shrink-0 z-20 shadow-md">
        <div className="flex items-center justify-between gap-2">
          {/* Tool Title & Subtitle */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#f27d26] animate-pulse shrink-0" />
            <h1 className="text-xs font-mono font-bold text-white uppercase truncate">{title}</h1>
            {subtitle && (
              <span className="text-[10px] font-mono text-[#f27d26] bg-[#f27d2618] px-1 rounded border border-[#f27d26]/30 shrink-0">
                {subtitle}
              </span>
            )}
          </div>

          {/* Status Badge & Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Mobile Simulation Controls */}
            {onToggleRunning && (
              <div className="flex items-center gap-0.5 bg-[#0d1117] p-0.5 rounded border border-[#30363d]">
                <button
                  type="button"
                  onClick={onToggleRunning}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                    isRunning
                      ? 'bg-emerald-950/80 text-emerald-400'
                      : 'bg-amber-950/80 text-amber-400 animate-pulse'
                  }`}
                  title={isRunning ? 'Pause Simulation' : 'Run Simulation'}
                >
                  {isRunning ? <Pause size={10} /> : <Play size={10} />}
                  <span>{isRunning ? 'PAUSE' : 'START'}</span>
                </button>
                {onReset && (
                  <button
                    type="button"
                    onClick={onReset}
                    className="p-1 text-slate-400 hover:text-cyan-400"
                    title="Reset Simulation"
                  >
                    <RotateCcw size={10} />
                  </button>
                )}
              </div>
            )}

            {/* Mobile Intensity Cycling Button */}
            <button
              type="button"
              onClick={() => {
                const next: Record<AnimationIntensity, AnimationIntensity> = {
                  high: 'medium',
                  medium: 'low',
                  low: 'high',
                };
                setAnimationIntensity(next[animationIntensity]);
              }}
              className="px-1.5 py-1 bg-[#0d1117] border border-[#30363d] rounded text-[10px] font-mono text-[#38bdf8] font-bold touch-manipulation uppercase"
              title={`Animation Intensity: ${animationIntensity} (tap to cycle)`}
            >
              FX:{animationIntensity[0]}
            </button>

            {/* View Switcher Button (Mobile) */}
            {(chartComponent || simulatorType) && (
              <button
                type="button"
                onClick={() => {
                  if (activeCenterView === 'visual') {
                    if (simulatorType) setActiveCenterView('schematic');
                    else if (chartComponent) setActiveCenterView('chart');
                  } else if (activeCenterView === 'schematic') {
                    if (chartComponent) setActiveCenterView('chart');
                    else setActiveCenterView('visual');
                  } else {
                    setActiveCenterView('visual');
                  }
                }}
                className="px-2 py-1 bg-[#0d1117] border border-[#30363d] rounded text-[11px] font-mono font-bold text-[#8b949e] hover:text-white flex items-center gap-1 touch-manipulation cursor-pointer"
              >
                {activeCenterView === 'visual' ? (
                  <Layout size={12} className="text-[#f27d26]" />
                ) : activeCenterView === 'schematic' ? (
                  <BarChart2 size={12} className="text-[#f27d26]" />
                ) : (
                  <Eye size={12} className="text-[#f27d26]" />
                )}
                <span>
                  {activeCenterView === 'visual'
                    ? simulatorType
                      ? 'P&ID'
                      : 'Curves'
                    : activeCenterView === 'schematic'
                    ? chartComponent
                      ? 'Curves'
                      : 'Twin'
                    : 'Twin'}
                </span>
              </button>
            )}

            {/* Quick Action Icons (Mobile) */}
            <button
              onClick={handleAuditClick}
              className="p-1.5 bg-[#0d1117] border border-[#30363d] rounded text-emerald-400 hover:text-white shadow touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center"
              title="Mathematical Calculation Audit"
            >
              <BookOpen size={13} />
            </button>

            <button
              onClick={handleReportClick}
              className="p-1.5 bg-[#0d1117] border border-[#30363d] rounded text-blue-400 hover:text-white shadow touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center"
              title="Engineering Report"
            >
              <FileText size={13} />
            </button>

            <button
              onClick={handleCompareClick}
              className="p-1.5 bg-orange-950/50 border border-[#f27d26]/60 rounded text-[#f27d26] hover:text-white shadow touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center"
              title="Compare Twin"
            >
              <GitCompare size={13} />
            </button>

            {getStatusBadge()}
          </div>
        </div>

        {/* Mobile Scenario Selector Dropdown */}
        {scenarios && scenarios.length > 0 && onSelectScenario && (
          <div className="flex items-center gap-1.5 bg-[#0d1117] px-2.5 py-1 rounded border border-[#30363d] w-full">
            <Layers size={13} className="text-[#f27d26] shrink-0" />
            <select
              value={activeScenarioId}
              onChange={(e) => onSelectScenario(e.target.value)}
              className="bg-transparent text-white text-xs font-mono font-bold focus:outline-none w-full cursor-pointer touch-manipulation min-h-[30px]"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#161b22] text-white">
                  {s.category === 'abnormal' ? `⚠ ${s.name}` : s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Hero Visualizer Canvas Area */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-[#080b0f]">
        {/* Floating Scenario Consequence Toast / HUD (Clean, Minimal, Direct) */}
        {activeScenario && showToast && (
          <div className="absolute top-3 left-3 right-3 md:left-4 md:right-auto md:max-w-md z-30 pointer-events-auto transition-all animate-fadeIn">
            <div
              className={`p-2.5 rounded-lg border backdrop-blur-md shadow-2xl font-mono text-xs ${
                activeScenario.category === 'abnormal'
                  ? 'bg-[#1c1208]/90 border-amber-600/80 text-amber-200'
                  : 'bg-[#0d1117]/90 border-[#30363d] text-[#c9d1d9]'
              }`}
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-1.5">
                <div className="flex items-center gap-1.5">
                  {activeScenario.category === 'abnormal' ? (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase border border-amber-500/40">
                      <AlertTriangle size={11} /> Abnormal Test
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase border border-emerald-500/40">
                      <CheckCircle2 size={11} /> Baseline
                    </span>
                  )}
                  <span className="font-bold text-white text-[12px] truncate">{activeScenario.name}</span>
                </div>
                <button
                  onClick={() => setShowToast(false)}
                  className="text-white/60 hover:text-white p-0.5 rounded hover:bg-white/10 transition-colors"
                  title="Dismiss alert"
                >
                  <X size={13} />
                </button>
              </div>

              {activeScenario.event && (
                <div className="leading-snug mb-1">
                  <span className="text-[9px] uppercase font-bold text-amber-400/90 mr-1.5">Event:</span>
                  <span className="text-white text-[11px]">{activeScenario.event}</span>
                </div>
              )}

              {activeScenario.consequence && (
                <div className="leading-snug mb-1">
                  <span className="text-[9px] uppercase font-bold text-red-400 mr-1.5">Consequence:</span>
                  <span className="text-white text-[11px]">{activeScenario.consequence}</span>
                </div>
              )}

              {activeScenario.recommendedAction && (
                <div className="leading-snug">
                  <span className="text-[9px] uppercase font-bold text-emerald-400 mr-1.5">Action:</span>
                  <span className="text-[#58a6ff] text-[11px] font-semibold">{activeScenario.recommendedAction}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeCenterView === 'visual' ? (
          <div className="w-full h-full relative">
            <VisualComponent
              inputs={inputs}
              outputs={outputs}
              isRunning={isRunning}
              unitSystem={unitSystem}
              onToggleRunning={onToggleRunning}
              onReset={onReset}
            />
          </div>
        ) : activeCenterView === 'schematic' && simulatorType ? (
          <div className="w-full h-full overflow-hidden p-3 flex flex-col justify-center items-center bg-[#080b0f] animate-fadeIn">
            <div className="w-full max-w-4xl flex flex-col justify-center">
              <SimulatorSchematicDiagram
                simulatorType={simulatorType}
                inputs={inputs}
                outputs={outputs}
                unitSystem={unitSystem}
              />
            </div>
          </div>
        ) : (
          <div className="w-full h-full overflow-y-auto p-4 custom-scrollbar">
            {typeof chartComponent === 'function'
              ? chartComponent({ inputs, outputs, unitSystem })
              : chartComponent}
          </div>
        )}

        {/* Small floating disclaimer or standard note at bottom-left */}
        {disclaimerText && (
          <div className="hidden md:block absolute bottom-2 left-2 z-20 pointer-events-none">
            <span className="text-[10px] font-mono text-[#8b949e]/60 bg-[#0d1117]/80 px-2 py-0.5 rounded border border-[#30363d]/40 backdrop-blur">
              {disclaimerText}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
