import React, { useState, useEffect, useRef } from 'react';
import {
  TrainNodeId,
  TrainComponentState,
  CouplingTransferLink,
  CascadeScenario,
  SISInterlockSensor,
  CoupledTrainSimulationResult,
} from '../../types/machineryTrain';
import {
  CASCADE_SCENARIOS,
  calculateCoupledTrainSimulation,
  exportCoupledTrainCSV,
  exportCoupledTrainJSON,
} from '../../utils/machineryTrainCalculations';
import { useApp } from '../../context/AppContext';
import {
  Network,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  AlertOctagon,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRight,
  TrendingDown,
  Info,
  Download,
  Copy,
  Check,
  X,
  Gauge,
  Sliders,
  Flame,
  Layers,
  FileSpreadsheet,
  FileCode,
  Share2,
  ExternalLink,
  Lock,
  Unlock,
} from 'lucide-react';

interface MachineryTrainStudioProps {
  isOpen: boolean;
  onClose: () => void;
}

type StudioTab = 'synoptic' | 'coupling-matrix' | 'scenarios' | 'sis-matrix';

export const MachineryTrainStudio: React.FC<MachineryTrainStudioProps> = ({ isOpen, onClose }) => {
  const { navigateToSimulator, injectSimulatorInputs } = useApp();

  // State
  const [activeTab, setActiveTab] = useState<StudioTab>('synoptic');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(CASCADE_SCENARIOS[0].id);
  const [timeSeconds, setTimeSeconds] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1);
  const [isCoupledPhysics, setIsCoupledPhysics] = useState<boolean>(true);
  const [sensorBypasses, setSensorBypasses] = useState<Record<string, boolean>>({});
  const [selectedNodeId, setSelectedNodeId] = useState<TrainNodeId | null>('pump');
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);

  const activeScenario = CASCADE_SCENARIOS.find((s) => s.id === selectedScenarioId) || CASCADE_SCENARIOS[0];

  // Simulation result
  const simResult: CoupledTrainSimulationResult = calculateCoupledTrainSimulation(
    selectedScenarioId,
    timeSeconds,
    isCoupledPhysics,
    sensorBypasses
  );

  // Playback timer
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null;
      return;
    }

    const loop = (now: number) => {
      if (lastTimeRef.current !== null) {
        const deltaSec = ((now - lastTimeRef.current) / 1000) * playSpeed * 15; // 15x real time
        setTimeSeconds((prev) => {
          const next = prev + deltaSec;
          if (next >= 300) {
            setIsPlaying(false);
            return 300;
          }
          return next;
        });
      }
      lastTimeRef.current = now;
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, playSpeed]);

  if (!isOpen) return null;

  // Handler: Toggle sensor bypass
  const toggleBypass = (tag: string) => {
    setSensorBypasses((prev) => ({
      ...prev,
      [tag]: !prev[tag],
    }));
  };

  // Handler: Inject current coupled condition into live twin
  const handleInjectIntoTwin = (nodeId: TrainNodeId) => {
    if (nodeId === 'pump') {
      injectSimulatorInputs({
        flowRateM3H: Number(simResult.components.pump.secondaryMetrics[0].value),
        npshaM: simResult.components.pump.primaryMetric.value === '0.72' ? 2.4 : 5.2,
      });
      navigateToSimulator('pump');
      onClose();
    } else if (nodeId === 'rotor') {
      injectSimulatorInputs({
        balancingGrade: 'G6.3',
        operatingSpeedRPM: 2980,
      });
      navigateToSimulator('rotor');
      onClose();
    } else if (nodeId === 'coupling') {
      injectSimulatorInputs({
        dialOffsetVerticalMm: Number(simResult.components.coupling.primaryMetric.value),
        thermalGrowthDriverVerticalMm: 0.28,
      });
      navigateToSimulator('alignment');
      onClose();
    } else if (nodeId === 'pipe') {
      injectSimulatorInputs({
        operatingTemperatureC: simResult.components.pipe.temperatureC || 200,
        pipeRunLengthM: 14,
      });
      navigateToSimulator('pipe');
      onClose();
    } else if (nodeId === 'seal') {
      injectSimulatorInputs({
        flushFluidTemperatureC: simResult.components.seal.temperatureC || 80,
        flushFlowRateLMin: simResult.components.seal.temperatureC && simResult.components.seal.temperatureC > 100 ? 1.2 : 9.5,
      });
      navigateToSimulator('seal');
      onClose();
    }
  };

  // Export handlers
  const handleDownloadCSV = () => {
    const csv = exportCoupledTrainCSV(simResult, activeScenario, Math.round(timeSeconds));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Pillar4_MachineryTrain_Cascade_${activeScenario.id}_${Math.round(timeSeconds)}s.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJSON = () => {
    const json = exportCoupledTrainJSON(simResult, activeScenario, Math.round(timeSeconds));
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Pillar4_TrainTwin_Snapshot_${activeScenario.id}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopySummary = () => {
    const summary = `MECHANICAL LAB PRO - PILLAR 4 TRAIN CASSIER
Scenario: ${activeScenario.title}
Industry: ${activeScenario.industry}
Elapsed Time: ${Math.round(timeSeconds)}s
Train Status: ${simResult.trainStatus.toUpperCase()} (Health: ${simResult.overallTrainHealth}/100)
Emergency Trip Actuated: ${simResult.isTrainTripped ? 'YES' : 'NO'}
${simResult.activeTripReason ? `Trip Cause: ${simResult.activeTripReason}` : ''}
Key Telemetry:
- Motor Current: ${simResult.components.motor.primaryMetric.value} ${simResult.components.motor.primaryMetric.unit}
- Coupling Offset: ${simResult.components.coupling.primaryMetric.value} mm
- Pump NPSH Margin: ${simResult.components.pump.primaryMetric.value}x
- Seal Chamber Temp: ${simResult.components.seal.primaryMetric.value} °C
- Piping Thermal Stress: ${simResult.components.pipe.primaryMetric.value} %
- Rotor 1X Vibration: ${simResult.components.rotor.primaryMetric.value} mm/s RMS (L10h: ${simResult.components.rotor.secondaryMetrics[0].value})`;

    navigator.clipboard.writeText(summary);
    setCopiedMessage('Copied Train Dossier to Clipboard!');
    setTimeout(() => setCopiedMessage(null), 3000);
  };

  // Node coordinate positions for the SVG train schematic
  const nodeLayout: Record<TrainNodeId, { x: number; y: number; label: string; icon: string }> = {
    motor: { x: 70, y: 120, label: 'Electric Motor', icon: 'M' },
    coupling: { x: 230, y: 120, label: 'Disc Coupling', icon: 'CPL' },
    pump: { x: 390, y: 120, label: 'API 610 Pump', icon: 'P' },
    seal: { x: 390, y: 240, label: 'API 682 Seal', icon: 'SEAL' },
    pipe: { x: 550, y: 240, label: 'Piping System', icon: 'PIPE' },
    rotor: { x: 550, y: 120, label: 'Rotor & Bearing', icon: 'ROT' },
  };

  const currentStepInfo = activeScenario.steps.reduce((prev, curr) => {
    return timeSeconds >= curr.timeSeconds ? curr : prev;
  }, activeScenario.steps[0]);

  return (
    <div
      id="machinery-train-studio-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto"
    >
      <div className="bg-[#0d1117] border border-[#30363d] w-full max-w-7xl max-h-[96vh] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#c9d1d9]">
        {/* ========================================================================= */}
        {/* MODAL HEADER */}
        {/* ========================================================================= */}
        <div className="p-3 sm:p-4 bg-[#161b22] border-b border-[#30363d] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-950/80 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0">
              <Network size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white font-mono tracking-tight">
                  Pillar 4: Coupled Machinery Train & Plant Failure Cascade Matrix
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-900/60 text-blue-300 border border-blue-500/40">
                  SYSTEM DIGITAL TWIN
                </span>
                {simResult.isTrainTripped ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-500 flex items-center gap-1 animate-pulse">
                    <AlertOctagon size={11} /> ESD TRIP ACTUATED
                  </span>
                ) : simResult.trainStatus === 'critical' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950/60 text-red-300 border border-red-500/50">
                    SEVERELY DEGRADED
                  </span>
                ) : simResult.trainStatus === 'warning' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-500/50">
                    EARLY DEGRADATION
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/50">
                    NOMINAL TRAIN OPERATION
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8b949e] font-mono mt-0.5">
                Multi-Equipment Physical Couplings • API 610 / API 682 / API 686 / ASME B31.3 / ISO 1940 Train Dynamic Model
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Physics Coupling Switch */}
            <button
              id="btn-toggle-coupling-physics"
              onClick={() => setIsCoupledPhysics(!isCoupledPhysics)}
              title="Toggle Dynamic Physical Coupling between Subsystems"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors touch-manipulation cursor-pointer ${
                isCoupledPhysics
                  ? 'bg-blue-950/70 border-blue-500/60 text-blue-300 font-bold'
                  : 'bg-[#21262d] border-[#30363d] text-[#8b949e]'
              }`}
            >
              <Zap size={13} className={isCoupledPhysics ? 'text-blue-400' : 'text-[#8b949e]'} />
              <span>Coupled Physics: {isCoupledPhysics ? 'ACTIVE' : 'ISOLATED'}</span>
            </button>

            {/* Quick Export Button */}
            <button
              id="btn-copy-train-dossier"
              onClick={handleCopySummary}
              title="Copy Train Assessment Summary to Clipboard"
              className="flex items-center gap-1 px-2 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-lg text-xs font-mono text-[#c9d1d9] transition-colors touch-manipulation cursor-pointer"
            >
              {copiedMessage ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span className="hidden sm:inline">Copy</span>
            </button>

            <button
              id="btn-close-machinery-train-studio"
              onClick={onClose}
              className="p-1.5 text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-lg transition-colors touch-manipulation cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE TIMELINE / TIME-STEP PROGRESSION SCRUBBER */}
        {/* ========================================================================= */}
        <div className="bg-[#12171f] border-b border-[#30363d] p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                id="btn-play-pause-cascade"
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-1.5 rounded-md font-mono text-xs flex items-center gap-1 font-bold border transition-colors cursor-pointer ${
                  isPlaying
                    ? 'bg-amber-950 border-amber-500 text-amber-300'
                    : 'bg-emerald-950 border-emerald-500 text-emerald-300 hover:bg-emerald-900'
                }`}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
              </button>

              <button
                id="btn-reset-cascade-timeline"
                onClick={() => {
                  setIsPlaying(false);
                  setTimeSeconds(0);
                }}
                className="p-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-md text-[#8b949e] hover:text-white transition-colors cursor-pointer"
                title="Reset Timeline to t = 0s"
              >
                <RotateCcw size={14} />
              </button>

              <div className="flex items-center gap-1 text-xs font-mono bg-[#161b22] px-2 py-1 rounded border border-[#30363d]">
                <span className="text-[#8b949e]">Time t:</span>
                <span className="font-bold text-white text-sm w-12 text-right">{Math.round(timeSeconds)}s</span>
                <span className="text-[#8b949e] text-[10px]">/ 300s</span>
              </div>

              {/* Speed toggle */}
              <div className="flex items-center gap-0.5 bg-[#161b22] p-0.5 rounded border border-[#30363d] text-[10px] font-mono">
                {[1, 2, 4].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPlaySpeed(s)}
                    className={`px-1.5 py-0.5 rounded ${
                      playSpeed === s ? 'bg-blue-600 text-white font-bold' : 'text-[#8b949e] hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Current Scenario Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-mono text-[#8b949e] hidden md:inline">Cascade Scenario:</label>
              <select
                id="select-cascade-scenario"
                value={selectedScenarioId}
                onChange={(e) => {
                  setSelectedScenarioId(e.target.value);
                  setTimeSeconds(0);
                  setIsPlaying(false);
                }}
                className="bg-[#161b22] border border-[#30363d] text-xs font-mono text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 max-w-[280px] sm:max-w-md truncate"
              >
                {CASCADE_SCENARIOS.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time Slider */}
          <div className="flex items-center gap-3 w-full">
            <input
              id="slider-cascade-time"
              type="range"
              min="0"
              max="300"
              step="1"
              value={Math.round(timeSeconds)}
              onChange={(e) => {
                setIsPlaying(false);
                setTimeSeconds(Number(e.target.value));
              }}
              className="w-full h-1.5 bg-[#21262d] rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Key Milestone Markers */}
          <div className="flex justify-between text-[10px] font-mono text-[#8b949e] px-1">
            {activeScenario.steps.map((st) => (
              <button
                key={st.timeSeconds}
                onClick={() => {
                  setIsPlaying(false);
                  setTimeSeconds(st.timeSeconds);
                }}
                className={`hover:text-blue-400 transition-colors flex items-center gap-1 ${
                  Math.abs(timeSeconds - st.timeSeconds) < 20 ? 'text-blue-400 font-bold' : ''
                }`}
              >
                <span>{st.timeSeconds}s</span>
                <span className="hidden lg:inline text-[9px] opacity-75 truncate max-w-[120px]">
                  ({st.phaseTitle.split(' ')[0]})
                </span>
              </button>
            ))}
          </div>

          {/* Active Phase Info Banner */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-2 flex items-start gap-2 text-xs font-mono">
            <Activity size={14} className="text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-white mr-2">{currentStepInfo.phaseTitle}:</span>
              <span className="text-[#c9d1d9]">{currentStepInfo.headline}</span>
              <p className="text-[11px] text-[#8b949e] mt-0.5">{currentStepInfo.physicsDescription}</p>
            </div>
            {currentStepInfo.interlockTrips.length > 0 && (
              <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 bg-red-950/80 border border-red-500/50 rounded text-[10px] text-red-300 font-bold">
                <AlertTriangle size={11} />
                <span>{currentStepInfo.interlockTrips.length} ALARM(S)</span>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUB-TABS NAVIGATION */}
        {/* ========================================================================= */}
        <div className="flex items-center border-b border-[#30363d] bg-[#161b22] px-3 gap-1 overflow-x-auto">
          <button
            id="tab-btn-synoptic"
            onClick={() => setActiveTab('synoptic')}
            className={`px-3 py-2 text-xs font-mono font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'synoptic'
                ? 'border-blue-500 text-white bg-blue-950/20'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <Layers size={13} />
            <span>1. Train Synoptic Topology</span>
          </button>

          <button
            id="tab-btn-coupling-matrix"
            onClick={() => setActiveTab('coupling-matrix')}
            className={`px-3 py-2 text-xs font-mono font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'coupling-matrix'
                ? 'border-blue-500 text-white bg-blue-950/20'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <Zap size={13} />
            <span>2. Physics Coupling Matrix ({simResult.transferLinks.filter((l) => l.isExceeded).length} Exceeded)</span>
          </button>

          <button
            id="tab-btn-scenarios"
            onClick={() => setActiveTab('scenarios')}
            className={`px-3 py-2 text-xs font-mono font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'scenarios'
                ? 'border-blue-500 text-white bg-blue-950/20'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <Activity size={13} />
            <span>3. Incident Scenarios & Root Causes</span>
          </button>

          <button
            id="tab-btn-sis-matrix"
            onClick={() => setActiveTab('sis-matrix')}
            className={`px-3 py-2 text-xs font-mono font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'sis-matrix'
                ? 'border-blue-500 text-white bg-blue-950/20'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <AlertOctagon size={13} />
            <span>4. SIS Safety Interlock Matrix ({simResult.sisSensors.filter((s) => s.isTripped).length} Tripped)</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB CONTENT CONTAINER */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-[#0d1117] space-y-4">
          {/* TAB 1: SYNOPTIC DRIVE TRAIN TOPOLOGY */}
          {activeTab === 'synoptic' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left 2 Cols: Interactive Train Schematic Diagram */}
              <div className="lg:col-span-2 bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                      <span>Coupled Drive Train Schematic</span>
                      <span className="text-[10px] text-blue-400 font-normal">Click node to inspect transfer equations</span>
                    </h3>
                    <p className="text-xs text-[#8b949e] font-mono">
                      Real-time interactive mechanical coupling network (Motor → Coupling → Pump → Seal → Piping → Rotor)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-[#8b949e]">Train Health:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded ${
                        simResult.overallTrainHealth > 80
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                          : simResult.overallTrainHealth > 50
                          ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                          : 'bg-red-950 text-red-400 border border-red-500/40'
                      }`}
                    >
                      {simResult.overallTrainHealth} / 100
                    </span>
                  </div>
                </div>

                {/* SVG Visualizer */}
                <div className="relative bg-[#0b0e14] border border-[#21262d] rounded-lg p-2 min-h-[300px] flex items-center justify-center overflow-x-auto">
                  <svg viewBox="0 0 680 340" className="w-full max-w-[680px] h-auto select-none">
                    <defs>
                      <linearGradient id="grad-line-active" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#21262d" strokeWidth="0.5" />
                      </pattern>
                    </defs>

                    <rect width="680" height="340" fill="url(#grid)" />

                    {/* Drive Shaft Axis Line */}
                    <line x1="120" y1="120" x2="600" y2="120" stroke="#30363d" strokeWidth="6" strokeDasharray="6 6" />

                    {/* Connecting transfer lines */}
                    {/* Pipe to Pump */}
                    <path
                      d="M 550 210 L 550 160 L 440 120"
                      fill="none"
                      stroke={simResult.components.pipe.status === 'critical' ? '#ef4444' : '#3b82f6'}
                      strokeWidth={simResult.components.pipe.status === 'critical' ? '3' : '2'}
                      strokeDasharray={isPlaying ? '4 4' : undefined}
                      className={isPlaying ? 'animate-pulse' : ''}
                    />

                    {/* Seal to Rotor */}
                    <path
                      d="M 440 240 L 500 240 L 550 160"
                      fill="none"
                      stroke={simResult.components.seal.status === 'critical' ? '#ef4444' : '#10b981'}
                      strokeWidth="2"
                    />

                    {/* Coupling to Seal */}
                    <path
                      d="M 230 150 L 230 240 L 340 240"
                      fill="none"
                      stroke={simResult.components.coupling.status === 'critical' ? '#ef4444' : '#f59e0b'}
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />

                    {/* Machine Node Blocks */}
                    {Object.entries(nodeLayout).map(([nodeKey, pos]) => {
                      const c = simResult.components[nodeKey as TrainNodeId];
                      const isSelected = selectedNodeId === nodeKey;
                      const statusColor =
                        c.status === 'critical' ? '#ef4444' : c.status === 'warning' ? '#f59e0b' : '#10b981';
                      const statusFill =
                        c.status === 'critical' ? '#450a0a' : c.status === 'warning' ? '#451a03' : '#064e3b';

                      return (
                        <g
                          key={nodeKey}
                          transform={`translate(${pos.x}, ${pos.y})`}
                          onClick={() => setSelectedNodeId(nodeKey as TrainNodeId)}
                          className="cursor-pointer group"
                        >
                          {/* Outer card rectangle */}
                          <rect
                            x="-55"
                            y="-35"
                            width="110"
                            height="70"
                            rx="8"
                            fill={isSelected ? '#1c2128' : statusFill}
                            stroke={isSelected ? '#58a6ff' : statusColor}
                            strokeWidth={isSelected ? '2.5' : '1.5'}
                            className="transition-all duration-200"
                          />

                          {/* Node Icon/Badge */}
                          <rect x="-48" y="-28" width="22" height="16" rx="3" fill="#0d1117" stroke={statusColor} strokeWidth="1" />
                          <text x="-37" y="-16" textAnchor="middle" fill={statusColor} fontSize="8" fontWeight="bold" fontFamily="monospace">
                            {pos.icon}
                          </text>

                          {/* Tag */}
                          <text x="5" y="-16" textAnchor="start" fill="#8b949e" fontSize="9" fontFamily="monospace">
                            {c.tag}
                          </text>

                          {/* Equipment Name */}
                          <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                            {pos.label}
                          </text>

                          {/* Primary Metric */}
                          <text x="0" y="18" textAnchor="middle" fill={statusColor} fontSize="10" fontWeight="bold" fontFamily="monospace">
                            {c.primaryMetric.value} {c.primaryMetric.unit}
                          </text>

                          {/* Selection indicator */}
                          {isSelected && (
                            <circle cx="0" cy="38" r="3" fill="#58a6ff" />
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Train Summary Telemetry Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#30363d]">
                  <div className="bg-[#0d1117] p-2 rounded border border-[#21262d] flex flex-col">
                    <span className="text-[10px] font-mono text-[#8b949e]">Total Vibration Sum</span>
                    <span className="text-sm font-mono font-bold text-white">{simResult.totalVibrationSumMmS} mm/s</span>
                  </div>
                  <div className="bg-[#0d1117] p-2 rounded border border-[#21262d] flex flex-col">
                    <span className="text-[10px] font-mono text-[#8b949e]">Coupling Power Loss</span>
                    <span className="text-sm font-mono font-bold text-amber-400">{simResult.couplingLossKW} kW</span>
                  </div>
                  <div className="bg-[#0d1117] p-2 rounded border border-[#21262d] flex flex-col">
                    <span className="text-[10px] font-mono text-[#8b949e]">Hydraulic Efficiency</span>
                    <span className="text-sm font-mono font-bold text-emerald-400">{simResult.hydraulicEfficiency} %</span>
                  </div>
                  <div className="bg-[#0d1117] p-2 rounded border border-[#21262d] flex flex-col">
                    <span className="text-[10px] font-mono text-[#8b949e]">Emergency Trip Logic</span>
                    <span
                      className={`text-sm font-mono font-bold ${
                        simResult.isTrainTripped ? 'text-red-400 animate-pulse' : 'text-emerald-400'
                      }`}
                    >
                      {simResult.isTrainTripped ? 'TRIP ENGAGED' : 'ARMED / OK'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right 1 Col: Selected Equipment Node Deep-Dive Card */}
              {selectedNodeId && (
                <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex flex-col gap-3">
                  {(() => {
                    const c = simResult.components[selectedNodeId];
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-wider">
                              NODE INSPECTOR • {c.tag}
                            </span>
                            <h3 className="text-base font-bold text-white font-mono">{c.name}</h3>
                            <span className="text-xs text-[#8b949e] font-mono">Standard: {c.standard}</span>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-mono font-bold uppercase ${
                              c.status === 'critical'
                                ? 'bg-red-950 text-red-400 border border-red-500'
                                : c.status === 'warning'
                                ? 'bg-amber-950 text-amber-400 border border-amber-500'
                                : 'bg-emerald-950 text-emerald-400 border border-emerald-500'
                            }`}
                          >
                            {c.status}
                          </span>
                        </div>

                        {/* Health Score Gauge */}
                        <div className="bg-[#0d1117] p-3 rounded-lg border border-[#21262d] flex items-center justify-between">
                          <span className="text-xs font-mono text-[#8b949e]">Component Health Index</span>
                          <span
                            className={`text-lg font-mono font-bold ${
                              c.healthIndex > 80
                                ? 'text-emerald-400'
                                : c.healthIndex > 50
                                ? 'text-amber-400'
                                : 'text-red-400'
                            }`}
                          >
                            {c.healthIndex} / 100
                          </span>
                        </div>

                        {/* Primary Metric */}
                        <div className="bg-[#0d1117] p-3 rounded-lg border border-[#21262d]">
                          <span className="text-[10px] font-mono text-[#8b949e] uppercase">{c.primaryMetric.label}</span>
                          <div className="text-xl font-mono font-bold text-white mt-0.5">
                            {c.primaryMetric.value}{' '}
                            <span className="text-xs font-normal text-[#8b949e]">{c.primaryMetric.unit}</span>
                          </div>
                        </div>

                        {/* Secondary Metrics */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-mono font-bold text-[#8b949e] uppercase">Secondary Telemetry</span>
                          <div className="grid grid-cols-2 gap-2">
                            {c.secondaryMetrics.map((sm, idx) => (
                              <div key={idx} className="bg-[#0d1117] p-2 rounded border border-[#21262d]">
                                <div className="text-[10px] font-mono text-[#8b949e] truncate">{sm.label}</div>
                                <div className="text-xs font-mono font-bold text-white">
                                  {sm.value} <span className="text-[10px] text-[#8b949e]">{sm.unit}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Operating specs */}
                        <div className="space-y-1">
                          <span className="text-[11px] font-mono font-bold text-[#8b949e] uppercase">Operating Constraints</span>
                          <ul className="text-[11px] font-mono text-[#8b949e] space-y-0.5 pl-3 list-disc">
                            {c.operatingConditions.map((cond, idx) => (
                              <li key={idx}>{cond}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Action: Inject to Active Twin */}
                        <button
                          id={`btn-inject-${c.nodeId}-twin`}
                          onClick={() => handleInjectIntoTwin(c.nodeId)}
                          className="mt-auto w-full py-2 bg-blue-950/80 hover:bg-blue-900 border border-blue-500/50 hover:border-blue-400 rounded-lg text-xs font-mono font-bold text-blue-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <ExternalLink size={13} />
                          <span>Push Condition to {c.name.split(' ')[0]} Twin</span>
                        </button>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PHYSICS COUPLING MATRIX */}
          {activeTab === 'coupling-matrix' && (
            <div className="space-y-4">
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Zap size={16} className="text-blue-400" />
                  <span>Cross-System Physical Transfer Functions</span>
                </h3>
                <p className="text-xs text-[#8b949e] font-mono mt-1">
                  Deterministic mechanical transfer mechanics governed by API 610, ASME B31.3, API 686, API 682, and ISO 1940.
                  When one equipment node degrades, dynamic forces propagate along the train.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {simResult.transferLinks.map((link) => (
                  <div
                    key={link.id}
                    className={`bg-[#161b22] border rounded-xl p-4 flex flex-col gap-2.5 transition-all ${
                      link.severity === 'critical'
                        ? 'border-red-500/60 bg-red-950/10'
                        : link.severity === 'warning'
                        ? 'border-amber-500/60 bg-amber-950/10'
                        : 'border-[#30363d]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#21262d] text-white">
                          {link.source.toUpperCase()}
                        </span>
                        <ArrowRight size={13} className="text-blue-400" />
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#21262d] text-white">
                          {link.target.toUpperCase()}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          link.severity === 'critical'
                            ? 'bg-red-950 text-red-400 border border-red-500'
                            : link.severity === 'warning'
                            ? 'bg-amber-950 text-amber-400 border border-amber-500'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-500'
                        }`}
                      >
                        {link.severity}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white font-mono">{link.sourceLabel} → {link.targetLabel}</h4>
                      <p className="text-[11px] text-[#8b949e] font-mono mt-1">{link.physicalMechanism}</p>
                    </div>

                    {/* Formula box */}
                    <div className="bg-[#0d1117] p-2 rounded border border-[#21262d] font-mono text-xs text-blue-300">
                      <span className="text-[10px] text-[#8b949e] block">Transfer Formula:</span>
                      <code>{link.governingFormula}</code>
                    </div>

                    {/* Live Effect */}
                    <div className="bg-[#0b0e14] p-2 rounded border border-[#21262d] text-xs font-mono">
                      <span className="text-[10px] text-[#8b949e] block">Current Physical Impact:</span>
                      <span className={link.isExceeded ? 'text-amber-300 font-bold' : 'text-emerald-400'}>
                        {link.currentEffect}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-[#8b949e] pt-1 border-t border-[#21262d]">
                      <span>Standard: {link.standardRef}</span>
                      <span>Gain: {link.transferCoefficient}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SCENARIOS & ROOT CAUSE ANALYSIS */}
          {activeTab === 'scenarios' && (
            <div className="space-y-4">
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Activity size={16} className="text-blue-400" />
                  <span>Industrial Machinery Train Failure Scenarios</span>
                </h3>
                <p className="text-xs text-[#8b949e] font-mono mt-1">
                  Select an industrial failure scenario to simulate root-cause causality across the rotating equipment train.
                </p>
              </div>

              {/* Scenario Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CASCADE_SCENARIOS.map((sc) => {
                  const isSelected = sc.id === selectedScenarioId;
                  return (
                    <div
                      key={sc.id}
                      onClick={() => {
                        setSelectedScenarioId(sc.id);
                        setTimeSeconds(0);
                        setIsPlaying(false);
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                        isSelected
                          ? 'bg-blue-950/30 border-blue-500 shadow-md'
                          : 'bg-[#161b22] border-[#30363d] hover:border-[#484f58]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#21262d] text-blue-300 border border-blue-500/30">
                          {sc.industry}
                        </span>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-600 text-white">
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-white font-mono">{sc.title}</h4>
                      <p className="text-xs text-[#8b949e] font-mono">{sc.subtitle}</p>

                      <div className="bg-[#0d1117] p-2.5 rounded border border-[#21262d] text-xs font-mono mt-1">
                        <span className="text-[10px] text-amber-400 font-bold block uppercase">Root Cause:</span>
                        <p className="text-[#c9d1d9] text-[11px] mt-0.5">{sc.rootCauseDescription}</p>
                      </div>

                      <div className="bg-[#0d1117] p-2.5 rounded border border-[#21262d] text-xs font-mono">
                        <span className="text-[10px] text-red-400 font-bold block uppercase">Terminal Outcome:</span>
                        <p className="text-[#c9d1d9] text-[11px] mt-0.5">{sc.terminalOutcome}</p>
                      </div>

                      <div className="text-[10px] font-mono text-[#8b949e] pt-1">
                        Governing Standards: {sc.governingStandards.join(' • ')}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mitigation & Preventive Design Strategy */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider">
                  Recommended Engineering Remediation & Mitigations ({activeScenario.title})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeScenario.recommendedMitigation.map((mit, idx) => (
                    <div key={idx} className="bg-[#0d1117] p-2.5 rounded border border-[#21262d] flex items-start gap-2">
                      <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-xs font-mono text-[#c9d1d9]">{mit}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-blue-950/30 border border-blue-500/40 p-3 rounded-lg text-xs font-mono text-blue-200">
                  <span className="font-bold text-blue-300">Preventive Design Principle: </span>
                  {activeScenario.preventiveDesignAction}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SIS SAFETY INTERLOCK MATRIX */}
          {activeTab === 'sis-matrix' && (
            <div className="space-y-4">
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <AlertOctagon size={16} className="text-red-400" />
                    <span>Safety Instrumented System (SIS) / Emergency Shutdown (ESD) Matrix</span>
                  </h3>
                  <p className="text-xs text-[#8b949e] font-mono mt-1">
                    API 670 Machinery Protection Systems & IEC 61511 Safety Lifecycle Voting Logic.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded text-xs font-mono font-bold ${
                      simResult.isTrainTripped
                        ? 'bg-red-950 text-red-300 border border-red-500 animate-pulse'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                    }`}
                  >
                    {simResult.isTrainTripped ? 'TRAIN ESD TRIP ENGAGED' : 'SAFETY SYSTEM ARMED'}
                  </span>
                </div>
              </div>

              {/* Trip Reason Banner if tripped */}
              {simResult.isTrainTripped && (
                <div className="bg-red-950/80 border border-red-500 p-3 rounded-xl flex items-start gap-2.5 text-xs font-mono text-red-200">
                  <AlertOctagon size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold uppercase tracking-wider block text-red-300">Emergency Shutdown Initiated:</span>
                    <p className="mt-0.5">{simResult.activeTripReason}</p>
                    <span className="text-[10px] text-red-400 mt-1 block">
                      Main breaker 52 tripped • Process isolation valves SV-101/102 closed per HAZOP interlock.
                    </span>
                  </div>
                </div>
              )}

              {/* Sensors Table */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#12171f] text-[#8b949e] border-b border-[#30363d]">
                    <tr>
                      <th className="p-3">Sensor Tag</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Node</th>
                      <th className="p-3">Current Telemetry</th>
                      <th className="p-3">Warning Limit</th>
                      <th className="p-3">Trip Setpoint</th>
                      <th className="p-3">Voting Logic</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Maintenance Bypass</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#21262d]">
                    {simResult.sisSensors.map((sensor) => {
                      const isTripped = sensor.isTripped;
                      const isWarning = sensor.isWarning;
                      return (
                        <tr
                          key={sensor.tag}
                          className={`${
                            isTripped ? 'bg-red-950/20' : isWarning ? 'bg-amber-950/20' : 'hover:bg-[#1c2128]'
                          }`}
                        >
                          <td className="p-3 font-bold text-white">{sensor.tag}</td>
                          <td className="p-3 text-[#c9d1d9]">{sensor.description}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-[#21262d] text-blue-300">
                              {sensor.nodeId.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-white">
                            <span className={isTripped ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}>
                              {sensor.currentValue} {sensor.unit}
                            </span>
                          </td>
                          <td className="p-3 text-[#8b949e]">
                            {sensor.warningThreshold} {sensor.unit}
                          </td>
                          <td className="p-3 text-red-400 font-bold">
                            {sensor.tripSetpoint} {sensor.unit}
                          </td>
                          <td className="p-3 text-[#c9d1d9]">{sensor.votingLogic}</td>
                          <td className="p-3">
                            {sensor.bypassed ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/40">
                                BYPASSED
                              </span>
                            ) : isTripped ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-500 animate-pulse">
                                TRIPPED
                              </span>
                            ) : isWarning ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
                                WARNING
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                                NORMAL
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => toggleBypass(sensor.tag)}
                              className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer border ${
                                sensor.bypassed
                                  ? 'bg-purple-900 border-purple-400 text-white'
                                  : 'bg-[#21262d] border-[#30363d] text-[#8b949e] hover:text-white'
                              }`}
                            >
                              {sensor.bypassed ? <Unlock size={11} /> : <Lock size={11} />}
                              <span>{sensor.bypassed ? 'UNBYPASS' : 'BYPASS'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ESD Safety Interlock Flowchart Visualizer */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider mb-2">
                  SIS Architecture Logic Flowchart
                </h4>
                <div className="flex items-center justify-between text-center text-xs font-mono gap-2 flex-wrap sm:flex-nowrap">
                  <div className="flex-1 bg-[#0d1117] p-2.5 rounded border border-[#21262d]">
                    <span className="text-[10px] text-blue-400 block font-bold">FIELD SENSORS</span>
                    <span className="text-white mt-1 block">4 Active Transmitters</span>
                    <span className="text-[10px] text-[#8b949e]">API 670 Proximity & RTD</span>
                  </div>
                  <ArrowRight size={16} className="text-[#8b949e] shrink-0" />
                  <div className="flex-1 bg-[#0d1117] p-2.5 rounded border border-[#21262d]">
                    <span className="text-[10px] text-amber-400 block font-bold">LOGIC SOLVER</span>
                    <span className="text-white mt-1 block">1oo2 / 2oo3 Voting</span>
                    <span className="text-[10px] text-[#8b949e]">Triple Modular Redundant</span>
                  </div>
                  <ArrowRight size={16} className="text-[#8b949e] shrink-0" />
                  <div className="flex-1 bg-[#0d1117] p-2.5 rounded border border-[#21262d]">
                    <span className="text-[10px] text-red-400 block font-bold">FINAL CONTROL ELEMENT</span>
                    <span className="text-white mt-1 block">Vacuum Breaker 52 & XV-101</span>
                    <span className="text-[10px] text-[#8b949e]">Trip Response &lt; 80 ms</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER WITH EXPORT SUITE */}
        {/* ========================================================================= */}
        <div className="p-3 bg-[#161b22] border-t border-[#30363d] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-[#8b949e]">
            <span className="font-bold text-white">Scenario:</span>
            <span className="truncate max-w-xs">{activeScenario.title}</span>
            <span className="hidden sm:inline">• Elapsed: {Math.round(timeSeconds)}s</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-download-train-csv"
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-lg text-xs font-mono text-white transition-colors cursor-pointer"
            >
              <FileSpreadsheet size={13} className="text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              id="btn-download-train-json"
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-lg text-xs font-mono text-white transition-colors cursor-pointer"
            >
              <FileCode size={13} className="text-blue-400" />
              <span>Export Twin JSON</span>
            </button>

            <button
              id="btn-footer-close-train-studio"
              onClick={onClose}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
