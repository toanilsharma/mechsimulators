import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DIAGNOSTIC_ISSUES } from '../data/diagnosticData';
import { DiagnosticIssue, DiagnosticStep } from '../types/education';
import { SimulatorId } from '../types/common';
import { FailureCaseGeneratorView } from './FailureCaseGeneratorView';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Zap,
  BookOpen,
  HelpCircle,
  X,
  Gauge,
  Sparkles,
  Shuffle,
} from 'lucide-react';

interface DiagnosticWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSimulator: SimulatorId;
  onApplyFix?: (inputs: Record<string, any>) => void;
}

export const DiagnosticWizardModal: React.FC<DiagnosticWizardModalProps> = ({
  isOpen,
  onClose,
  activeSimulator,
  onApplyFix,
}) => {
  const { injectSimulatorInputs } = useApp();
  const [selectedSim, setSelectedSim] = useState<SimulatorId>(activeSimulator);
  const [modalMode, setModalMode] = useState<'generator' | 'guide'>('generator');

  // Filter issues for selected simulator
  const issues = DIAGNOSTIC_ISSUES.filter((issue) => issue.simulatorId === selectedSim);
  const [activeIssueId, setActiveIssueId] = useState<string>(issues[0]?.id || DIAGNOSTIC_ISSUES[0].id);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [fixApplied, setFixApplied] = useState<boolean>(false);

  // Sync simulator if prop changes
  React.useEffect(() => {
    setSelectedSim(activeSimulator);
    const simIssues = DIAGNOSTIC_ISSUES.filter((i) => i.simulatorId === activeSimulator);
    if (simIssues.length > 0) {
      setActiveIssueId(simIssues[0].id);
      setActiveStepIndex(0);
      setFixApplied(false);
    }
  }, [activeSimulator, isOpen]);

  if (!isOpen) return null;

  const currentIssue: DiagnosticIssue =
    DIAGNOSTIC_ISSUES.find((i) => i.id === activeIssueId) || issues[0] || DIAGNOSTIC_ISSUES[0];
  const currentStep: DiagnosticStep = currentIssue.steps[activeStepIndex] || currentIssue.steps[0];
  const totalSteps = currentIssue.steps.length;

  const handleApplyFix = () => {
    if (onApplyFix) {
      onApplyFix(currentIssue.applyFixInputs);
    }
    injectSimulatorInputs(currentIssue.applyFixInputs);
    setFixApplied(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div
      id="diagnostic-wizard-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        id="diagnostic-wizard-modal"
        className="relative w-full max-w-4xl max-h-[92vh] bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#c9d1d9]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-[#30363d] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Wrench size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                STEP-WISE DIAGNOSTIC TROUBLESHOOTER & FAILURE SOLVER
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono">
                  Physics RCFA
                </span>
              </h2>
              <p className="text-xs text-[#8b949e]">
                Physics-based guided failure troubleshooting and interactive incident crisis solving
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

        {/* Mode Selector Sub-header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#12161f] border-b border-[#30363d] shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalMode('generator')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                modalMode === 'generator'
                  ? 'bg-[#f27d26] text-black font-bold shadow-sm'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
              }`}
            >
              <Shuffle size={13} />
              <span>Incident Crisis Generator & Solver</span>
            </button>
            <button
              onClick={() => setModalMode('guide')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                modalMode === 'guide'
                  ? 'bg-amber-500 text-black font-bold shadow-sm'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
              }`}
            >
              <BookOpen size={13} />
              <span>Guided RCFA Stepper</span>
            </button>
          </div>
          <span className="text-[10px] font-mono text-[#8b949e] hidden sm:inline">
            Nominative Industry Reference Benchmarks
          </span>
        </div>

        {modalMode === 'generator' ? (
          <div className="flex-1 overflow-hidden p-4 sm:p-5 flex flex-col">
            <FailureCaseGeneratorView onClose={onClose} initialSimulatorId={selectedSim} />
          </div>
        ) : (
          <>
            {/* Simulator Selector Tabs */}
            <div className="flex items-center gap-1.5 px-4 py-2 bg-[#0d1117] border-b border-[#30363d] overflow-x-auto custom-scrollbar shrink-0">
              {[
                { id: 'pump', label: 'Pump NPSH' },
                { id: 'seal', label: 'Seal Flush (API 682)' },
                { id: 'rotor', label: 'Rotor Dynamics' },
                { id: 'pipe', label: 'Pipe Stress (ASME B31.3)' },
                { id: 'alignment', label: 'Alignment (API 686)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedSim(tab.id as SimulatorId);
                    const found = DIAGNOSTIC_ISSUES.find((i) => i.simulatorId === tab.id);
                    if (found) {
                      setActiveIssueId(found.id);
                      setActiveStepIndex(0);
                      setFixApplied(false);
                    }
                  }}
                  className={`px-3 py-1 rounded text-xs font-mono transition-colors cursor-pointer whitespace-nowrap ${
                    selectedSim === tab.id
                      ? 'bg-amber-500 text-black font-bold shadow-sm'
                      : 'bg-[#161b22] text-[#8b949e] hover:text-white hover:bg-[#21262d] border border-[#30363d]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
              {/* Issue Header Banner */}
              <div className="p-3.5 bg-[#161b22] border border-amber-500/30 rounded-lg">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wide font-semibold">
                      Reference Benchmark: {currentIssue.standardRef}
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">{currentIssue.title}</h3>
                    <p className="text-xs text-[#8b949e] mt-1 italic">
                      &ldquo;{currentIssue.symptom}&rdquo;
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/80 border border-red-600/40 text-red-400 shrink-0">
                    ACTIVE SYMPTOM
                  </span>
                </div>
                <div className="mt-2.5 pt-2.5 border-t border-[#30363d] text-xs text-[#c9d1d9] leading-relaxed">
                  <strong className="text-white font-mono">Field Observation: </strong>
                  {currentIssue.fieldObservation}
                </div>
              </div>

          {/* Governing Physics Box */}
          <div className="p-3 bg-[#111827] border border-blue-500/30 rounded-lg text-xs leading-relaxed">
            <div className="flex items-center gap-1.5 text-blue-400 font-mono font-bold text-[11px] mb-1">
              <BookOpen size={14} />
              GOVERNING PHYSICAL PRINCIPLE
            </div>
            <p className="text-[#9ca3af]">{currentIssue.governingPhysics}</p>
          </div>

          {/* Step Stepper Navigation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[#8b949e]">
              <span>DIAGNOSTIC STEP {activeStepIndex + 1} OF {totalSteps}</span>
              <span className="text-amber-400 font-semibold">{currentStep.title}</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {currentIssue.steps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`p-2 rounded border text-left font-mono text-xs transition-colors cursor-pointer ${
                    activeStepIndex === idx
                      ? 'bg-amber-500/10 border-amber-500/50 text-amber-300 font-bold'
                      : idx < activeStepIndex
                      ? 'bg-[#161b22] border-emerald-500/30 text-emerald-400'
                      : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px]">Step {idx + 1}</span>
                    {idx < activeStepIndex && <CheckCircle2 size={12} className="text-emerald-400" />}
                  </div>
                  <div className="truncate text-[11px] mt-0.5">{step.title}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Diagnostic Step Card */}
          <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-xl space-y-3.5">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                {activeStepIndex + 1}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">{currentStep.question}</h4>
                <p className="text-xs text-[#8b949e] mt-1">
                  Evaluate whether this physical boundary condition is violated in your process setup.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {/* Rule of Thumb Box */}
              <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-lg">
                <div className="text-[10px] font-mono text-amber-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Sparkles size={12} />
                  Industrial Rule of Thumb
                </div>
                <p className="text-xs text-[#c9d1d9] leading-relaxed">
                  {currentStep.ruleOfThumb}
                </p>
              </div>

              {/* Physical Mechanism Box */}
              <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-lg">
                <div className="text-[10px] font-mono text-blue-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Zap size={12} />
                  Underlying Physics Mechanism
                </div>
                <p className="text-xs text-[#c9d1d9] leading-relaxed">
                  {currentStep.physicalMechanism}
                </p>
              </div>
            </div>

            {/* Formula & Field Acceptance Threshold */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#0d1117] border border-dashed border-[#30363d] rounded-lg font-mono text-xs">
              <div>
                <span className="text-[10px] text-[#8b949e] block uppercase">Verification Formula:</span>
                <span className="text-amber-300 font-bold text-sm tracking-wide">
                  {currentStep.checkFormula}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#8b949e] block uppercase">Field Acceptance Limit:</span>
                <span className="text-emerald-400 font-bold text-xs">
                  {currentStep.fieldThreshold}
                </span>
              </div>
            </div>
          </div>

          {/* Solution & Live Mitigation Panel */}
          <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  RECOMMENDED ENGINEERING MITIGATION
                </span>
                <p className="text-xs text-[#c9d1d9] mt-1 leading-relaxed">
                  {currentIssue.solutionSummary}
                </p>
              </div>
            </div>

            {/* Action Trigger Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-emerald-500/20">
              <span className="text-[11px] text-[#8b949e]">
                Click below to immediately inject these engineered parameters into the active digital twin:
              </span>
              <button
                onClick={handleApplyFix}
                disabled={fixApplied}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                  fixApplied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black hover:shadow-emerald-500/20'
                }`}
              >
                {fixApplied ? (
                  <>
                    <CheckCircle2 size={14} />
                    Parameters Injected into Simulator!
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    {currentIssue.applyFixActionTitle}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Navigation Controls */}
        <div className="px-4 py-3 bg-[#161b22] border-t border-[#30363d] flex items-center justify-between shrink-0">
          <button
            onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
            disabled={activeStepIndex === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#21262d] hover:bg-[#30363d] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono text-white transition-colors cursor-pointer"
          >
            <ChevronLeft size={14} />
            Previous Step
          </button>

          <span className="text-xs font-mono text-[#8b949e]">
            {activeStepIndex + 1} / {totalSteps}
          </span>

          <button
            onClick={() => setActiveStepIndex((prev) => Math.min(totalSteps - 1, prev + 1))}
            disabled={activeStepIndex === totalSteps - 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#21262d] hover:bg-[#30363d] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono text-white transition-colors cursor-pointer"
          >
            Next Step
            <ChevronRight size={14} />
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
};
