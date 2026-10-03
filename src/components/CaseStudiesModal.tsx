import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { INCIDENT_CASE_STUDIES } from '../data/diagnosticData';
import { IncidentCaseStudy } from '../types/education';
import { SimulatorId } from '../types/common';
import {
  FileWarning,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  BookOpen,
  Building2,
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface CaseStudiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSimulator: SimulatorId;
  onLoadCaseInputs?: (inputs: Record<string, any>) => void;
}

export const CaseStudiesModal: React.FC<CaseStudiesModalProps> = ({
  isOpen,
  onClose,
  activeSimulator,
  onLoadCaseInputs,
}) => {
  const { injectSimulatorInputs, setActiveRoute } = useApp();
  const [selectedSim, setSelectedSim] = useState<SimulatorId>(activeSimulator);

  const filteredCases = INCIDENT_CASE_STUDIES.filter((c) => c.simulatorId === selectedSim);
  const [activeCaseId, setActiveCaseId] = useState<string>(filteredCases[0]?.id || INCIDENT_CASE_STUDIES[0].id);
  const [activeModeFeedback, setActiveModeFeedback] = useState<string | null>(null);

  React.useEffect(() => {
    setSelectedSim(activeSimulator);
    const found = INCIDENT_CASE_STUDIES.find((c) => c.simulatorId === activeSimulator);
    if (found) {
      setActiveCaseId(found.id);
      setActiveModeFeedback(null);
    }
  }, [activeSimulator, isOpen]);

  if (!isOpen) return null;

  const currentCase: IncidentCaseStudy =
    INCIDENT_CASE_STUDIES.find((c) => c.id === activeCaseId) || filteredCases[0] || INCIDENT_CASE_STUDIES[0];

  const handleLoadFailureState = () => {
    setActiveRoute(currentCase.simulatorId);
    if (onLoadCaseInputs) {
      onLoadCaseInputs(currentCase.initialInputs);
    }
    injectSimulatorInputs(currentCase.initialInputs);
    setActiveModeFeedback('Loaded failure state into simulator.');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleLoadSolutionState = () => {
    setActiveRoute(currentCase.simulatorId);
    if (onLoadCaseInputs) {
      onLoadCaseInputs(currentCase.correctedInputs);
    }
    injectSimulatorInputs(currentCase.correctedInputs);
    setActiveModeFeedback('Loaded validated engineering fix.');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div
      id="case-studies-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        id="case-studies-modal"
        className="relative w-full max-w-4xl max-h-[92vh] bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#c9d1d9]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-[#30363d] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <FileWarning size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                REAL-WORLD INCIDENT CASE STUDIES
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500/40 text-red-300 font-mono">
                  Forensic RCFA
                </span>
              </h2>
              <p className="text-xs text-[#8b949e]">
                Historical industrial plant equipment failures, physical root causes, and lessons learned
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[#21262d] text-[#8b949e] hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Simulator Selector Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-[#0d1117] border-b border-[#30363d] overflow-x-auto custom-scrollbar shrink-0">
          {[
            { id: 'pump', label: 'Pump NPSH Cavitation' },
            { id: 'seal', label: 'Plan 52/53 Seal Blowout' },
            { id: 'rotor', label: 'OH2 Bearing Spall' },
            { id: 'pipe', label: 'Thermal Pipe Stress' },
            { id: 'alignment', label: 'Thermal Misalignment' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedSim(tab.id as SimulatorId);
                const found = INCIDENT_CASE_STUDIES.find((c) => c.simulatorId === tab.id);
                if (found) {
                  setActiveCaseId(found.id);
                  setActiveModeFeedback(null);
                }
              }}
              className={`px-3 py-1 rounded text-xs font-mono transition-colors cursor-pointer whitespace-nowrap ${
                selectedSim === tab.id
                  ? 'bg-red-500 text-black font-bold shadow-sm'
                  : 'bg-[#161b22] text-[#8b949e] hover:text-white hover:bg-[#21262d] border border-[#30363d]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
          {/* Main Case Card */}
          <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wide font-semibold flex items-center gap-1">
                  <Building2 size={13} />
                  {currentCase.facility}
                </span>
                <h3 className="text-base font-bold text-white mt-1">{currentCase.title}</h3>
                <span className="text-xs text-[#8b949e] font-mono block mt-0.5">
                  Equipment: {currentCase.equipmentType}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/80 border border-red-600/40 text-red-300 self-start">
                {currentCase.failureMode}
              </span>
            </div>

            {/* Narrative Box */}
            <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs leading-relaxed text-[#c9d1d9]">
              <strong className="text-white font-mono block mb-1">Incident Chronology:</strong>
              {currentCase.incidentSummary}
            </div>

            {/* Consequence & Standard Citation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-lg">
                <span className="text-[10px] font-mono text-red-400 font-bold uppercase block mb-1">
                  Business & Safety Impact:
                </span>
                <p className="text-[#fca5a5]">{currentCase.consequence}</p>
              </div>
              <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-lg">
                <span className="text-[10px] font-mono text-blue-400 font-bold uppercase block mb-1">
                  Governing Standard Citation:
                </span>
                <p className="text-[#93c5fd] font-mono">{currentCase.standardCitation}</p>
              </div>
            </div>
          </div>

          {/* Root Cause Physics Explanation */}
          <div className="p-4 bg-[#111827] border border-amber-500/30 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold text-xs uppercase tracking-wide">
              <Flame size={14} />
              Forensic Root Cause Physics Analysis
            </div>
            <p className="text-xs text-[#d1d5db] leading-relaxed">
              {currentCase.rootCausePhysics}
            </p>
          </div>

          {/* Engineering Lesson Learned */}
          <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold text-xs uppercase tracking-wide">
              <ShieldCheck size={14} />
              Engineering Lesson Learned & Best Practice
            </div>
            <p className="text-xs text-[#d1d5db] leading-relaxed">
              {currentCase.lessonLearned}
            </p>
          </div>

          {/* Action Feedback Banner */}
          {activeModeFeedback && (
            <div className="p-2.5 bg-blue-950/80 border border-blue-500/50 rounded-lg text-xs font-mono text-blue-300 text-center animate-pulse">
              {activeModeFeedback}
            </div>
          )}

          {/* Interactive Simulation Discovery Controls */}
          <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-mono font-bold text-white uppercase">
                Interactive Sandbox Re-creation
              </h4>
              <p className="text-[11px] text-[#8b949e]">
                Explore both the disaster state and the engineered fix directly in the digital twin:
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleLoadFailureState}
                className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-600/50 text-red-300 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Inject failure conditions to view warnings"
              >
                <AlertTriangle size={13} />
                Load Failure State
              </button>

              <button
                onClick={handleLoadSolutionState}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
                title="Apply validated engineering fix to clear all warnings"
              >
                <CheckCircle2 size={13} />
                Load Validated Fix
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
