import React, { useState } from 'react';
import { SimulatorId, UnitSystem } from '../../types/common';
import { useApp } from '../../context/AppContext';
import { useSimulationStore } from '../../engine/simulationStore';
import { ParametricSweepTab } from './ParametricSweepTab';
import { AssetHealthLccTab } from './AssetHealthLccTab';
import { EquipmentDatasheetTab } from './EquipmentDatasheetTab';
import { MonteCarloTab } from './MonteCarloTab';
import { ExergyCarbonTab } from './ExergyCarbonTab';
import {
  X,
  TrendingUp,
  BarChart2,
  Gauge,
  FileText,
  Activity,
  RotateCw,
  Maximize2,
  ShieldCheck,
  Target,
  BarChart3,
  Leaf,
} from 'lucide-react';

interface ReliabilityStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSimulator: SimulatorId;
}

export const ReliabilityStudioModal: React.FC<ReliabilityStudioModalProps> = ({
  isOpen,
  onClose,
  activeSimulator,
}) => {
  const { unitSystem, injectSimulatorInputs } = useApp();
  const simStore = useSimulationStore();

  const [currentTab, setCurrentTab] = useState<'sweep' | 'health' | 'montecarlo' | 'exergy' | 'datasheet'>('sweep');
  const [selectedSim, setSelectedSim] = useState<SimulatorId>(activeSimulator);

  // Sync selectedSim when activeSimulator changes upon opening
  React.useEffect(() => {
    setSelectedSim(activeSimulator);
  }, [activeSimulator, isOpen]);

  if (!isOpen) return null;

  // Retrieve inputs and outputs for the selected simulator
  const simInputs =
    selectedSim === 'alignment'
      ? (simStore.inputs as any).alignment || {}
      : simStore.inputs[selectedSim as 'pump' | 'rotor' | 'pipe' | 'seal'];

  const simOutputs =
    selectedSim === 'alignment'
      ? (simStore.calculatedOutputs as any).alignment || {}
      : simStore.calculatedOutputs[selectedSim as 'pump' | 'rotor' | 'pipe' | 'seal'];

  const simulators: { id: SimulatorId; label: string; icon: React.ElementType }[] = [
    { id: 'pump', label: 'Pump NPSH', icon: Activity },
    { id: 'rotor', label: 'Rotor Dynamics', icon: RotateCw },
    { id: 'pipe', label: 'Pipe Stress', icon: Maximize2 },
    { id: 'seal', label: 'Seal Flush', icon: ShieldCheck },
    { id: 'alignment', label: 'Shaft Alignment', icon: Target },
  ];

  const handleInjectInputs = (patchedInputs: Record<string, any>) => {
    // Inject through AppContext and update simulation store
    injectSimulatorInputs(patchedInputs);
    if (selectedSim !== 'alignment') {
      simStore.patchInputs(selectedSim as any, patchedInputs);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[92vh] rounded bg-[#161b22] border border-[#30363d] shadow-2xl flex flex-col overflow-hidden text-[#d1d5db]">
        {/* 1. Industrial Header Bar */}
        <div className="p-3 sm:p-4 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-emerald-950 border border-emerald-500/50 rounded flex items-center justify-center font-bold text-emerald-400 font-mono text-xs shadow-md shrink-0">
              <TrendingUp size={16} />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                PILLAR 3 • PREDICTIVE RELIABILITY & LIFECYCLE
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white font-mono flex items-center gap-2">
                Reliability Engineering Studio & Lifecycle Analytics
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] text-[#d1d5db] flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Close Reliability Studio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Machinery Model Selector & Studio Tabs Bar */}
        <div className="px-3 sm:px-4 py-2 bg-[#161b22] border-b border-[#30363d] flex flex-wrap items-center justify-between gap-2">
          {/* Simulator Selection Pills */}
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
            <span className="text-[11px] font-mono text-[#8b949e] mr-1 hidden sm:inline">
              EQUIPMENT:
            </span>
            {simulators.map((s) => {
              const Icon = s.icon;
              const isSelected = selectedSim === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSim(s.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors touch-manipulation cursor-pointer whitespace-nowrap border ${
                    isSelected
                      ? 'bg-[#21262d] text-[#f27d26] border-[#f27d26] font-bold shadow-sm'
                      : 'bg-[#0d1117] text-[#8b949e] hover:text-white border-[#30363d]'
                  }`}
                >
                  <Icon size={12} className={isSelected ? 'text-[#f27d26]' : 'text-[#8b949e]'} />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Studio Functional Tabs */}
          <div className="flex items-center gap-1 bg-[#0d1117] p-0.5 rounded border border-[#30363d]">
            <button
              onClick={() => setCurrentTab('sweep')}
              className={`flex items-center gap-1.5 px-3 py-1 min-h-[32px] rounded text-xs font-mono transition-colors touch-manipulation cursor-pointer ${
                currentTab === 'sweep'
                  ? 'bg-[#f27d26] text-black font-bold shadow-sm'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
              }`}
            >
              <BarChart2 size={13} />
              <span>Parametric Sweep</span>
            </button>

            <button
              onClick={() => setCurrentTab('health')}
              className={`flex items-center gap-1.5 px-3 py-1 min-h-[32px] rounded text-xs font-mono transition-colors touch-manipulation cursor-pointer ${
                currentTab === 'health'
                  ? 'bg-[#f27d26] text-black font-bold shadow-sm'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
              }`}
            >
              <Gauge size={13} />
              <span>Asset Health & LCC</span>
            </button>

            <button
              onClick={() => setCurrentTab('montecarlo')}
              className={`flex items-center gap-1.5 px-3 py-1 min-h-[32px] rounded text-xs font-mono transition-colors touch-manipulation cursor-pointer ${
                currentTab === 'montecarlo'
                  ? 'bg-emerald-500 text-black font-bold shadow-sm'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
              }`}
            >
              <BarChart3 size={13} />
              <span>Monte Carlo</span>
            </button>

            <button
              onClick={() => setCurrentTab('exergy')}
              className={`flex items-center gap-1.5 px-3 py-1 min-h-[32px] rounded text-xs font-mono transition-colors touch-manipulation cursor-pointer ${
                currentTab === 'exergy'
                  ? 'bg-emerald-500 text-black font-bold shadow-sm'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
              }`}
            >
              <Leaf size={13} />
              <span>Exergy & CO₂</span>
            </button>

            <button
              onClick={() => setCurrentTab('datasheet')}
              className={`flex items-center gap-1.5 px-3 py-1 min-h-[32px] rounded text-xs font-mono transition-colors touch-manipulation cursor-pointer ${
                currentTab === 'datasheet'
                  ? 'bg-[#f27d26] text-black font-bold shadow-sm'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
              }`}
            >
              <FileText size={13} />
              <span>API Datasheet</span>
            </button>
          </div>
        </div>

        {/* 3. Tab Content Canvas */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#080b0f] custom-scrollbar">
          {currentTab === 'sweep' && (
            <ParametricSweepTab
              simulatorId={selectedSim}
              inputs={simInputs}
              unitSystem={unitSystem}
              onInjectInputs={handleInjectInputs}
            />
          )}

          {currentTab === 'health' && (
            <AssetHealthLccTab
              simulatorId={selectedSim}
              inputs={simInputs}
              outputs={simOutputs}
              unitSystem={unitSystem}
            />
          )}

          {currentTab === 'montecarlo' && (
            <MonteCarloTab
              selectedSim={selectedSim}
              unitSystem={unitSystem}
              simInputs={simInputs}
              simOutputs={simOutputs}
            />
          )}

          {currentTab === 'exergy' && (
            <ExergyCarbonTab
              selectedSim={selectedSim}
              unitSystem={unitSystem}
              simInputs={simInputs}
              simOutputs={simOutputs}
            />
          )}

          {currentTab === 'datasheet' && (
            <EquipmentDatasheetTab
              simulatorId={selectedSim}
              inputs={simInputs}
              outputs={simOutputs}
              unitSystem={unitSystem}
            />
          )}
        </div>
      </div>
    </div>
  );
};
