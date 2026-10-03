import React, { useState } from 'react';
import { GeneratedFailureScenario, FAILURE_GENERATOR_SCENARIOS } from '../data/failureGeneratorScenarios';
import { useApp } from '../context/AppContext';
import { SimulatorId } from '../types/common';
import {
  AlertOctagon,
  Wrench,
  CheckCircle2,
  XCircle,
  Volume2,
  Activity,
  Gauge,
  ArrowRight,
  Shuffle,
  ShieldAlert,
  Play,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { STANDARDS_SAFE_DISCLAIMER_SHORT } from '../utils/standardsSafeHarbor';

interface FailureCaseGeneratorViewProps {
  onClose?: () => void;
  initialSimulatorId?: SimulatorId;
}

export const FailureCaseGeneratorView: React.FC<FailureCaseGeneratorViewProps> = ({
  onClose,
  initialSimulatorId,
}) => {
  const { injectSimulatorInputs, setActiveRoute } = useApp();

  // Selected scenario
  const availableScenarios = initialSimulatorId
    ? FAILURE_GENERATOR_SCENARIOS.filter((s) => s.simulatorId === initialSimulatorId)
    : FAILURE_GENERATOR_SCENARIOS;

  const [currentScenario, setCurrentScenario] = useState<GeneratedFailureScenario>(
    availableScenarios[0] || FAILURE_GENERATOR_SCENARIOS[0]
  );

  // Investigation state
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<string | null>(null);
  const [hasVerifiedHypothesis, setHasVerifiedHypothesis] = useState<boolean>(false);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [actionExecuted, setActionExecuted] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(1); // 1: Triage, 2: RCFA, 3: Action, 4: Debrief

  const handleRandomize = () => {
    const list = FAILURE_GENERATOR_SCENARIOS;
    const next = list[Math.floor(Math.random() * list.length)];
    setCurrentScenario(next);
    setSelectedHypothesisId(null);
    setHasVerifiedHypothesis(false);
    setSelectedActionId(null);
    setActionExecuted(false);
    setActiveStep(1);
  };

  const handleSelectScenario = (id: string) => {
    const found = FAILURE_GENERATOR_SCENARIOS.find((s) => s.id === id);
    if (found) {
      setCurrentScenario(found);
      setSelectedHypothesisId(null);
      setHasVerifiedHypothesis(false);
      setSelectedActionId(null);
      setActionExecuted(false);
      setActiveStep(1);
    }
  };

  const selectedHypothesis = currentScenario.rootCauseOptions.find((o) => o.id === selectedHypothesisId);
  const selectedAction = currentScenario.correctiveActions.find((a) => a.id === selectedActionId);

  const handleExecuteAction = () => {
    if (!selectedAction) return;
    injectSimulatorInputs(selectedAction.inputsToInject);
    setActionExecuted(true);
    setActiveStep(4);
  };

  const handleJumpToTwin = () => {
    setActiveRoute(currentScenario.simulatorId);
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col h-full gap-4 text-[#c9d1d9] font-mono text-xs select-none">
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#161b22] border border-[#30363d] rounded-lg">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRandomize}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f27d26] hover:bg-[#ff9040] text-black font-bold rounded-sm shadow-sm transition-all cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Generate Random Plant Incident</span>
          </button>

          <select
            value={currentScenario.id}
            onChange={(e) => handleSelectScenario(e.target.value)}
            className="bg-[#0d1117] border border-[#30363d] text-white px-2 py-1.5 rounded-sm text-xs cursor-pointer focus:outline-none focus:border-[#f27d26]"
          >
            {FAILURE_GENERATOR_SCENARIOS.map((sc) => (
              <option key={sc.id} value={sc.id}>
                [{sc.simulatorId.toUpperCase()}] {sc.title}
              </option>
            ))}
          </select>
        </div>

        {/* Incident Severity Badge */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#8b949e]">{currentScenario.plantUnit}</span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              currentScenario.severity === 'emergency'
                ? 'bg-rose-950 border border-rose-500 text-rose-300 animate-pulse'
                : 'bg-amber-950 border border-amber-500 text-amber-300'
            }`}
          >
            {currentScenario.severity === 'emergency' ? '🚨 Plant Emergency' : '⚠️ Critical Alarm'}
          </span>
        </div>
      </div>

      {/* 2. Step Navigation Bar */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-[#161b22] border border-[#30363d] rounded">
        {[
          { num: 1, label: '1. Symptom Triage' },
          { num: 2, label: '2. Root Cause RCFA' },
          { num: 3, label: '3. Corrective Action' },
          { num: 4, label: '4. Physical Debrief' },
        ].map((st) => (
          <button
            key={st.num}
            onClick={() => setActiveStep(st.num)}
            className={`py-1.5 px-2 text-center rounded text-[11px] font-medium transition-all ${
              activeStep === st.num
                ? 'bg-[#30363d] text-white font-bold shadow-sm'
                : activeStep > st.num
                ? 'text-emerald-400 hover:bg-[#21262d]'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* 3. Step Content Area */}
      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
        {/* STEP 1: Symptom Triage */}
        {activeStep === 1 && (
          <div className="flex flex-col gap-3">
            {/* DCS Alarm Banner */}
            <div className="p-3 bg-red-950/40 border border-red-500/80 rounded-lg flex items-center gap-3">
              <AlertOctagon className="w-6 h-6 text-red-400 shrink-0 animate-bounce" />
              <div>
                <div className="text-[10px] text-red-300 font-bold">DCS TELEMETRY ALARM</div>
                <div className="text-white font-bold text-sm tracking-wide">{currentScenario.dcsAlarmBanner}</div>
              </div>
            </div>

            {/* Tri-fold Symptoms Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-[#161b22] border border-[#30363d] rounded flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Acoustic Signature</span>
                </div>
                <p className="text-[#8b949e] text-xs leading-relaxed">{currentScenario.symptoms.acoustic}</p>
              </div>

              <div className="p-3 bg-[#161b22] border border-[#30363d] rounded flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Vibration Signature</span>
                </div>
                <p className="text-[#8b949e] text-xs leading-relaxed">{currentScenario.symptoms.vibration}</p>
              </div>

              <div className="p-3 bg-[#161b22] border border-[#30363d] rounded flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold text-[11px]">
                  <Gauge className="w-3.5 h-3.5" />
                  <span>Process Telemetry</span>
                </div>
                <p className="text-[#8b949e] text-xs leading-relaxed">{currentScenario.symptoms.process}</p>
              </div>
            </div>

            {/* Live Telemetry Table */}
            <div className="p-3 bg-[#161b22] border border-[#30363d] rounded">
              <div className="text-[11px] font-bold text-white mb-2">Live Incident Telemetry vs Engineering Benchmarks</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#30363d] text-[10px] text-[#8b949e]">
                      <th className="py-1.5 px-2">Parameter</th>
                      <th className="py-1.5 px-2">Observed Value</th>
                      <th className="py-1.5 px-2">Benchmark Safe Limit</th>
                      <th className="py-1.5 px-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentScenario.telemetryMetrics.map((m, i) => (
                      <tr key={i} className="border-b border-[#21262d] hover:bg-[#21262d]/50">
                        <td className="py-2 px-2 text-white font-medium">{m.label}</td>
                        <td className="py-2 px-2 text-rose-400 font-bold">{m.value}</td>
                        <td className="py-2 px-2 text-[#8b949e]">{m.benchmarkLimit}</td>
                        <td className="py-2 px-2 text-right">
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-950 text-red-300 border border-red-500">
                            VIOLATION
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setActiveStep(2)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#f27d26] hover:bg-[#ff9040] text-black font-bold rounded cursor-pointer"
              >
                <span>Proceed to Step 2: Root Cause Investigation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Root Cause RCFA */}
        {activeStep === 2 && (
          <div className="flex flex-col gap-3">
            <div className="p-3 bg-[#161b22] border border-[#30363d] rounded">
              <div className="text-white font-bold text-sm mb-1">Differential Diagnosis: Root Cause Failure Analysis (RCFA)</div>
              <p className="text-[#8b949e] text-xs">
                Review the symptoms and telemetry from Step 1. Select the primary physical mechanism governing this machinery distress:
              </p>
            </div>

            {/* Candidate Options */}
            <div className="flex flex-col gap-2">
              {currentScenario.rootCauseOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => {
                    setSelectedHypothesisId(opt.id);
                    setHasVerifiedHypothesis(false);
                  }}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedHypothesisId === opt.id
                      ? 'bg-[#21262d] border-[#f27d26] shadow-sm'
                      : 'bg-[#161b22] border-[#30363d] hover:border-[#8b949e]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      checked={selectedHypothesisId === opt.id}
                      onChange={() => {}}
                      className="mt-1 accent-[#f27d26]"
                    />
                    <div className="flex-1">
                      <div className="text-white text-xs font-medium leading-relaxed">{opt.description}</div>
                      {hasVerifiedHypothesis && selectedHypothesisId === opt.id && (
                        <div
                          className={`mt-2 p-2 rounded text-[11px] leading-relaxed border ${
                            opt.isCorrect
                              ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                              : 'bg-rose-950/60 border-rose-500/60 text-rose-200'
                          }`}
                        >
                          <div className="font-bold flex items-center gap-1.5 mb-0.5">
                            {opt.isCorrect ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Root Cause Confirmed!</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                <span>Physics Disproved</span>
                              </>
                            )}
                          </div>
                          {opt.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Verification Button Bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setActiveStep(1)}
                className="px-3 py-1.5 bg-[#161b22] hover:bg-[#21262d] text-[#8b949e] border border-[#30363d] rounded"
              >
                Back to Telemetry
              </button>

              <div className="flex items-center gap-2">
                {!hasVerifiedHypothesis ? (
                  <button
                    disabled={!selectedHypothesisId}
                    onClick={() => setHasVerifiedHypothesis(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#f27d26] disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded cursor-pointer"
                  >
                    <span>Verify Engineering Hypothesis</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveStep(3)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded cursor-pointer"
                  >
                    <span>Proceed to Corrective Action</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Corrective Action */}
        {activeStep === 3 && (
          <div className="flex flex-col gap-3">
            <div className="p-3 bg-[#161b22] border border-[#30363d] rounded">
              <div className="text-white font-bold text-sm mb-1">Formulate Corrective Engineering Action</div>
              <p className="text-[#8b949e] text-xs">
                Select an engineering intervention to resolve the crisis and bring the machinery back within reference benchmark limits:
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {currentScenario.correctiveActions.map((act) => (
                <div
                  key={act.id}
                  onClick={() => setSelectedActionId(act.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedActionId === act.id
                      ? 'bg-[#21262d] border-[#10b981] shadow-sm'
                      : 'bg-[#161b22] border-[#30363d] hover:border-[#8b949e]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      checked={selectedActionId === act.id}
                      onChange={() => {}}
                      className="mt-1 accent-emerald-400"
                    />
                    <div className="flex-1">
                      <div className="text-white text-xs font-bold">{act.actionLabel}</div>
                      <div className="text-[11px] text-[#8b949e] mt-1">Expected Outcome: {act.engineeringOutcome}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setActiveStep(2)}
                className="px-3 py-1.5 bg-[#161b22] hover:bg-[#21262d] text-[#8b949e] border border-[#30363d] rounded"
              >
                Back to Root Cause
              </button>

              <button
                disabled={!selectedActionId}
                onClick={handleExecuteAction}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Execute Physical Plant Action</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Debrief & Twin Navigation */}
        {activeStep === 4 && (
          <div className="flex flex-col gap-3">
            <div className="p-4 bg-emerald-950/40 border border-emerald-500 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                <CheckCircle2 className="w-5 h-5" />
                <span>Incident Successfully Resolved & Physical Equilibrium Restored!</span>
              </div>
              <p className="text-emerald-200 text-xs leading-relaxed">
                {selectedAction?.engineeringOutcome}
              </p>
            </div>

            <div className="p-3 bg-[#161b22] border border-[#30363d] rounded flex flex-col gap-2">
              <div className="text-white font-bold text-xs flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Engineering Physics Debrief:</span>
              </div>
              <p className="text-[#8b949e] text-xs leading-relaxed">{currentScenario.debriefPhysics}</p>
              <div className="text-[10px] font-mono text-cyan-300 pt-2 border-t border-[#21262d]">
                Industry Reference Benchmark: {currentScenario.governingBenchmark}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                onClick={handleRandomize}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#161b22] hover:bg-[#21262d] text-white border border-[#30363d] rounded cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Solve Another Incident</span>
              </button>

              <button
                onClick={handleJumpToTwin}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#f27d26] hover:bg-[#ff9040] text-black font-bold rounded cursor-pointer shadow-lg"
              >
                <span>Jump to Live Digital Twin & Observe Stable Dynamics</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Safe Harbor Legal Standards Banner */}
      <div className="p-2 bg-[#0d1117] border-t border-[#30363d] text-[10px] text-[#6e7681] text-center leading-relaxed">
        {STANDARDS_SAFE_DISCLAIMER_SHORT}
      </div>
    </div>
  );
};
