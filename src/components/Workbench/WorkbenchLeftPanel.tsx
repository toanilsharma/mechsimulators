import React from 'react';
import { UnitSystem } from '../../types/common';
import { ScenarioItem, InputGroupSchema, InputFieldSchema } from './types';
import { Sliders, RotateCcw, Play, Pause, Layers, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface WorkbenchLeftPanelProps<TInputs extends Record<string, any>> {
  title?: string;
  scenarios: ScenarioItem<TInputs>[];
  activeScenarioId: string;
  onSelectScenario: (id: string) => void;
  inputs: TInputs;
  onInputsChange: (patch: Partial<TInputs> | TInputs) => void;
  inputSchema?: InputGroupSchema<TInputs>[];
  customControls?: (props: {
    inputs: TInputs;
    onChange: (patch: Partial<TInputs> | TInputs) => void;
    unitSystem: UnitSystem;
    scenarios?: ScenarioItem<TInputs>[];
    activeScenarioId?: string;
    onSelectScenario?: (id: string) => void;
    isRunning: boolean;
    onToggleRunning: () => void;
    onReset: () => void;
  }) => React.ReactNode;
  unitSystem: UnitSystem;
  onUnitSystemChange?: (units: UnitSystem) => void;
  isRunning: boolean;
  onToggleRunning: () => void;
  onReset: () => void;
}

export function WorkbenchLeftPanel<TInputs extends Record<string, any>>({
  title = 'Operating Parameters',
  scenarios,
  activeScenarioId,
  onSelectScenario,
  inputs,
  onInputsChange,
  inputSchema,
  customControls,
  unitSystem,
  onUnitSystemChange,
  isRunning,
  onToggleRunning,
  onReset,
}: WorkbenchLeftPanelProps<TInputs>) {
  const handleFieldChange = (key: keyof TInputs, value: any) => {
    onInputsChange({
      ...inputs,
      [key]: value,
    });
  };

  const normalScenarios = scenarios.filter((s) => s.category !== 'abnormal');
  const abnormalScenarios = scenarios.filter((s) => s.category === 'abnormal');
  const activeScenario = scenarios.find((s) => s.id === activeScenarioId);

  return (
    <div className="w-full h-full flex flex-col bg-[#0d1117] text-[#c9d1d9] select-none">
      {/* Top Header Toolbar */}
      <div className="p-2.5 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white uppercase tracking-wider">
          <Sliders size={13} className="text-[#f27d26]" />
          <span>{title}</span>
        </div>

        {/* Action Controls: Unit Toggle + Play/Pause + Reset */}
        <div className="flex items-center gap-1.5">
          {onUnitSystemChange && (
            <button
              onClick={() => onUnitSystemChange(unitSystem === 'metric' ? 'us' : 'metric')}
              title={`Switch unit system (Current: ${unitSystem.toUpperCase()})`}
              className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-[#0d1117] border border-[#30363d] hover:border-[#f27d26] text-white transition-colors cursor-pointer"
            >
              {unitSystem === 'metric' ? 'SI' : 'US'}
            </button>
          )}

          <button
            onClick={onToggleRunning}
            title={isRunning ? 'Pause physics simulation' : 'Resume live physics simulation'}
            className={`p-1 rounded border text-xs transition-colors flex items-center gap-1 font-mono cursor-pointer ${
              isRunning
                ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-400 hover:bg-emerald-900/60'
                : 'bg-amber-950/60 border-amber-700/60 text-amber-400 hover:bg-amber-900/60'
            }`}
          >
            {isRunning ? <Pause size={12} /> : <Play size={12} />}
          </button>

          <button
            onClick={onReset}
            title="Reset parameters to baseline"
            className="p-1 rounded border border-[#30363d] bg-[#0d1117] text-[#8b949e] hover:text-white hover:border-[#f27d26] transition-colors cursor-pointer"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Input Body (Fit-to-Screen) */}
      <div className="flex-1 min-h-0 p-2 flex flex-col overflow-hidden custom-scrollbar">
        {customControls ? (
          <div className="flex-1 min-h-0 flex flex-col">
            {customControls({
              inputs,
              onChange: onInputsChange,
              unitSystem,
              scenarios,
              activeScenarioId,
              onSelectScenario,
              isRunning,
              onToggleRunning,
              onReset,
            })}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 custom-scrollbar">
          <>
            {/* Fallback Schema Scenario / Preset Dropdown */}
            {scenarios && scenarios.length > 0 && (
              <div className="p-2.5 bg-[#161b22] rounded border border-[#30363d] shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-mono font-bold text-[#f27d26] uppercase flex items-center gap-1">
                    <Layers size={11} /> Operating Scenario
                  </label>
                  <span className="text-[9px] font-mono text-[#8b949e]">
                    {scenarios.length} Scenarios
                  </span>
                </div>

                <select
                  value={activeScenarioId}
                  onChange={(e) => onSelectScenario(e.target.value)}
                  className="w-full min-h-[38px] bg-[#0d1117] border border-[#30363d] rounded p-2 text-xs font-mono text-white focus:outline-none focus:border-[#f27d26] cursor-pointer"
                >
                  {normalScenarios.length > 0 && (
                    <optgroup label="Baseline Scenarios">
                      {normalScenarios.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {abnormalScenarios.length > 0 && (
                    <optgroup label="Abnormal Industrial Tests">
                      {abnormalScenarios.map((s) => (
                        <option key={s.id} value={s.id}>
                          ⚠ {s.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                {activeScenario && (
                  <div
                    className={`mt-2 p-2 rounded border text-xs font-mono space-y-1.5 transition-all ${
                      activeScenario.category === 'abnormal'
                        ? 'bg-amber-950/30 border-amber-800/60 text-[#f0883e]'
                        : 'bg-[#0d1117] border-[#30363d] text-[#8b949e]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1">
                        {activeScenario.category === 'abnormal' ? (
                          <>
                            <AlertTriangle size={11} className="text-amber-400" />
                            <span className="text-amber-400">Abnormal Test</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={11} className="text-emerald-400" />
                            <span className="text-emerald-400">Baseline</span>
                          </>
                        )}
                      </span>
                      <span className="text-[9px] font-mono text-[#8b949e]">{activeScenario.name}</span>
                    </div>

                    {activeScenario.event && (
                      <div className="leading-tight">
                        <span className="text-[9px] uppercase font-bold text-[#8b949e] mr-1">Event:</span>
                        <span className="text-white text-[11px]">{activeScenario.event}</span>
                      </div>
                    )}

                    {activeScenario.consequence && (
                      <div className="leading-tight">
                        <span className="text-[9px] uppercase font-bold text-[#f85149] mr-1">Consequence:</span>
                        <span className="text-white text-[11px]">{activeScenario.consequence}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Input Schema Groups */}
            {inputSchema && (
              <div className="space-y-3">
                {inputSchema.map((group) => (
                  <div
                    key={group.id}
                    className="p-3 bg-[#161b22] border border-[#30363d] rounded flex flex-col gap-2.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-[#30363d] pb-1.5">
                      <span className="text-[11px] font-mono font-bold text-[#f27d26] uppercase flex items-center gap-1">
                        {group.icon}
                        <span>{group.title}</span>
                      </span>
                      {group.badge && (
                        <span className="text-[10px] text-[#8b949e] font-mono">{group.badge}</span>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      {group.fields.map((field) => {
                        const currentVal = inputs[field.key];

                        if (field.type === 'select' && field.options) {
                          return (
                            <div key={String(field.key)}>
                              <label className="text-[10px] font-mono text-[#8b949e] block mb-1">
                                {field.label}
                              </label>
                              <select
                                value={currentVal}
                                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                disabled={field.disabled}
                                className="w-full min-h-[36px] bg-[#0d1117] border border-[#30363d] rounded p-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#f27d26] disabled:opacity-50 cursor-pointer"
                              >
                                {field.options.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        }

                        return (
                          <div key={String(field.key)}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-mono text-[#8b949e]">{field.label}</span>
                              <span className="text-xs font-mono font-bold text-white">
                                {typeof currentVal === 'number' ? currentVal : String(currentVal)}{' '}
                                {field.unit || ''}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={field.min ?? 0}
                              max={field.max ?? 100}
                              step={field.step ?? 1}
                              value={typeof currentVal === 'number' ? currentVal : 0}
                              onChange={(e) =>
                                handleFieldChange(
                                  field.key,
                                  field.step && field.step < 1
                                    ? parseFloat(e.target.value)
                                    : parseInt(e.target.value, 10)
                                )
                              }
                              disabled={field.disabled}
                              className="w-full h-2 min-h-[24px] bg-[#0d1117] rounded-lg appearance-none cursor-pointer accent-[#f27d26] disabled:opacity-50"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
          </div>
        )}
      </div>
    </div>
  );
}
