import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Minus,
  Plus,
  Info,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Wrench,
  HelpCircle,
  Layout,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SimulatorSchematicDiagram, SimulatorType } from './SimulatorSchematicDiagram';
import { UnitSystem } from '../../types/common';

/* ==========================================================================
   1. INPUT SECTION CARD (COMPACT ADAPTIVE CONTAINER)
   ========================================================================== */
export interface InputSectionProps {
  title: string;
  icon?: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({
  title,
  icon,
  badge,
  children,
  className = '',
  compact = true,
}) => {
  return (
    <div
      className={`bg-[#161b22] border border-[#30363d] rounded p-2 flex flex-col gap-2 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between border-b border-[#30363d] pb-1">
        <span className="text-[11px] font-mono font-bold text-[#f27d26] uppercase flex items-center gap-1.5">
          {icon}
          <span>{title}</span>
        </span>
        {badge && (
          <span className="text-[9px] text-[#8b949e] font-mono px-1 py-0.2 bg-[#0d1117] rounded border border-[#30363d]">
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
};

/* ==========================================================================
   2. ERGONOMIC COMPACT SLIDER (WITH STEPPERS & ACCENTS)
   ========================================================================== */
export interface ControlSliderProps {
  id?: string;
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  formatValue?: (val: number) => string;
  colorAccent?: 'orange' | 'blue' | 'green' | 'amber' | 'purple' | 'red';
  minLabel?: string;
  maxLabel?: string;
  helperText?: string;
  standardRef?: string;
  disabled?: boolean;
  precision?: number;
  /** Live Sensitivity & Rate-of-Change Badge (Recommendation #1) */
  sensitivityBadge?: {
    label: string;
    derivative?: string;
    level?: 'high' | 'medium' | 'low';
    direction?: 'positive' | 'negative';
  };
  sensitivityText?: string;
}

export const ControlSlider: React.FC<ControlSliderProps> = ({
  id,
  label,
  value,
  unit = '',
  min,
  max,
  step = 1,
  onChange,
  formatValue,
  colorAccent = 'orange',
  minLabel,
  maxLabel,
  helperText,
  standardRef,
  disabled = false,
  precision,
  sensitivityBadge,
  sensitivityText,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editInput, setEditInput] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const accentClasses = {
    orange: 'accent-[#f27d26]',
    blue: 'accent-[#58a6ff]',
    green: 'accent-[#3fb950]',
    amber: 'accent-amber-400',
    purple: 'accent-purple-400',
    red: 'accent-red-400',
  };

  const valueDisplayColor = {
    orange: 'text-[#f27d26]',
    blue: 'text-[#58a6ff]',
    green: 'text-[#3fb950]',
    amber: 'text-amber-400',
    purple: 'text-purple-300',
    red: 'text-red-400',
  };

  const decPlaces = precision !== undefined ? precision : step < 1 ? 2 : 0;
  const formattedVal = formatValue
    ? formatValue(value)
    : Number(value).toFixed(decPlaces);

  const handleStep = (direction: 'up' | 'down') => {
    if (disabled) return;
    const delta = direction === 'up' ? step : -step;
    const next = Math.min(max, Math.max(min, Number((value + delta).toFixed(4))));
    onChange(next);
  };

  const handleBlurOrSubmit = () => {
    setIsEditing(false);
    const parsed = parseFloat(editInput);
    if (!isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed));
      onChange(clamped);
    }
  };

  return (
    <div className={`flex flex-col gap-0.5 select-none ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Top row: Label & Standard Ref on left; Steppers & Numeric Badge on right */}
      <div className="flex items-center justify-between text-[11px] font-mono leading-none">
        <label htmlFor={id} className="text-[#c9d1d9] flex items-center gap-1 cursor-pointer truncate max-w-[170px]" title={label}>
          <span>{label}</span>
          {standardRef && (
            <span className="text-[8px] px-1 py-0.5 rounded bg-[#0d1117] text-[#f27d26] border border-[#f27d26]/30 uppercase shrink-0">
              {standardRef}
            </span>
          )}
        </label>

        <div className="flex items-center gap-1 shrink-0">
          {/* Stepper Down */}
          <button
            type="button"
            onClick={() => handleStep('down')}
            disabled={disabled || value <= min}
            title={`Decrease by ${step}`}
            className="w-5 h-5 flex items-center justify-center rounded bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff] text-[#8b949e] hover:text-white disabled:opacity-30 disabled:hover:border-[#30363d] transition-colors cursor-pointer"
          >
            <Minus size={10} />
          </button>

          {/* Stepper Up */}
          <button
            type="button"
            onClick={() => handleStep('up')}
            disabled={disabled || value >= max}
            title={`Increase by ${step}`}
            className="w-5 h-5 flex items-center justify-center rounded bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff] text-[#8b949e] hover:text-white disabled:opacity-30 disabled:hover:border-[#30363d] transition-colors cursor-pointer"
          >
            <Plus size={10} />
          </button>

          {/* Value Display / Click-to-edit Box */}
          {isEditing ? (
            <input
              type="number"
              autoFocus
              value={editInput}
              step={step}
              min={min}
              max={max}
              onChange={(e) => setEditInput(e.target.value)}
              onBlur={handleBlurOrSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleBlurOrSubmit()}
              className="w-16 h-5 px-1 text-[10px] font-mono font-bold bg-[#0d1117] border border-[#f27d26] rounded text-white text-right focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditInput(value.toString());
                setIsEditing(true);
              }}
              title="Click to manually enter exact value"
              className={`px-1.5 py-0.5 min-w-[50px] text-right rounded bg-[#0d1117] border border-[#30363d] hover:border-[#8b949e] font-mono font-bold text-[11px] ${valueDisplayColor[colorAccent]} cursor-text transition-colors`}
            >
              {formattedVal} <span className="text-[9px] font-normal text-[#8b949e]">{unit}</span>
            </button>
          )}
        </div>
      </div>

      {/* Slider Track with Custom styling */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            const num = step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
            onChange(isNaN(num) ? min : num);
          }}
          className={`w-full h-1.5 bg-[#0d1117] rounded appearance-none cursor-pointer ${accentClasses[colorAccent]} disabled:cursor-not-allowed`}
        />
      </div>

      {/* Optional Range bounds cues */}
      {(minLabel || maxLabel || helperText) && (
        <div className="flex items-center justify-between text-[8px] text-[#8b949e]/60 font-mono -mt-0.5">
          <span>{minLabel || `${min} ${unit}`}</span>
          {helperText && <span className="text-[#8b949e] truncate max-w-[130px]">{helperText}</span>}
          <span>{maxLabel || `${max} ${unit}`}</span>
        </div>
      )}

      {/* Live Sensitivity & Rate-of-Change Badge (Recommendation #1) */}
      {(sensitivityBadge || sensitivityText) && (
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`flex items-center justify-between text-[9px] font-mono px-1.5 py-0.5 mt-0.5 rounded transition-all ${
            isHovered
              ? 'bg-[#21262d] border border-[#58a6ff]/50 text-white'
              : 'bg-[#0d1117]/80 border border-[#30363d]/70 text-[#8b949e]'
          }`}
          title="Analytical rate of change (derivative) determining physical sensitivity to this parameter"
        >
          <span className="flex items-center gap-1">
            <span className="text-[#f27d26] font-bold">∂/∂x</span>
            <span className="truncate max-w-[110px]">{sensitivityBadge?.label || 'Rate of change'}:</span>
          </span>
          <span
            className={`font-semibold shrink-0 ${
              sensitivityBadge?.level === 'high'
                ? 'text-amber-400'
                : sensitivityBadge?.direction === 'negative'
                ? 'text-rose-400'
                : 'text-cyan-300'
            }`}
          >
            {sensitivityBadge?.derivative || sensitivityText}
          </span>
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   3. COMPACT ERGONOMIC SELECT
   ========================================================================== */
export interface ControlSelectOption {
  value: string;
  label: string;
  group?: string;
}

export interface ControlSelectProps {
  id?: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: ControlSelectOption[];
  helperText?: string;
  disabled?: boolean;
}

export const ControlSelect: React.FC<ControlSelectProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  helperText,
  disabled = false,
}) => {
  const hasGroups = options.some((o) => !!o.group);

  const groups: { [name: string]: ControlSelectOption[] } = {};
  if (hasGroups) {
    for (const opt of options) {
      const g = opt.group || 'Standard';
      if (!groups[g]) groups[g] = [];
      groups[g].push(opt);
    }
  }

  return (
    <div className={`flex flex-col gap-0.5 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <label htmlFor={id} className="text-[10px] font-mono text-[#8b949e] flex items-center justify-between">
        <span>{label}</span>
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-7 bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff] focus:border-[#f27d26] rounded px-2 text-xs font-mono text-white focus:outline-none cursor-pointer disabled:cursor-not-allowed transition-colors"
      >
        {hasGroups
          ? Object.entries(groups).map(([grpName, grpOptions]) => (
              <optgroup key={grpName} label={grpName} className="bg-[#161b22] text-[#8b949e]">
                {grpOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#0d1117] text-white">
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            ))
          : options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#0d1117] text-white">
                {opt.label}
              </option>
            ))}
      </select>
      {helperText && (
        <span className="text-[8px] text-[#8b949e] font-mono">{helperText}</span>
      )}
    </div>
  );
};

/* ==========================================================================
   4. COMPACT SCENARIO HEADER BAR (WITH INTEGRATED POPOVER TIPS)
   ========================================================================== */
export interface ScenarioHeaderBarProps {
  scenarioId: string;
  onScenarioChange: (id: string) => void;
  options: ControlSelectOption[];
  activeScenario?: {
    id: string;
    name?: string;
    category?: string;
    insight?: string;
    event?: string;
    consequence?: string;
  };
  coachStandard?: string;
  coachRuleOfThumb?: string;
  coachFieldTip?: string;
  simulatorType?: SimulatorType;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  unitSystem?: UnitSystem;
}

export const ScenarioHeaderBar: React.FC<ScenarioHeaderBarProps> = ({
  scenarioId,
  onScenarioChange,
  options,
  activeScenario,
  coachStandard,
  coachRuleOfThumb,
  coachFieldTip,
  simulatorType,
  inputs,
  outputs,
  unitSystem = 'metric',
}) => {
  const { isLearningMode, setIsDiagnosticModalOpen } = useApp();
  const [showCoachTip, setShowCoachTip] = useState(false);
  const [showInsight, setShowInsight] = useState(false);
  const [showDiagram, setShowDiagram] = useState(false);

  const isAbnormal =
    activeScenario?.category === 'abnormal' ||
    scenarioId.includes('failure') ||
    scenarioId.includes('loss') ||
    scenarioId.includes('strainer') ||
    scenarioId.includes('blocked') ||
    scenarioId.includes('throttled') ||
    scenarioId.includes('unbalance') ||
    scenarioId.includes('shock') ||
    scenarioId.includes('overload') ||
    scenarioId.includes('cocking') ||
    scenarioId.includes('soft-foot');

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded p-2 flex flex-col gap-1.5 shadow-sm">
      {/* Dropdown row */}
      <div className="flex items-center gap-1.5">
        <div className="flex-1">
          <ControlSelect
            id="scenario-selector-main"
            label="Preset Scenario"
            value={scenarioId}
            onChange={onScenarioChange}
            options={options}
          />
        </div>

        {/* Quick Toggles: Guidance Tip, Info & Visual Schematic */}
        <div className="flex items-center gap-1 self-end mb-0.5">
          {simulatorType && inputs && (
            <button
              id="btn-toggle-schematic-diagram"
              type="button"
              onClick={() => setShowDiagram(!showDiagram)}
              title={showDiagram ? 'Hide engineering schematic' : 'Show dimensional engineering schematic & animated vectors'}
              className={`h-7 px-2 rounded text-[10px] font-mono flex items-center gap-1 border transition-colors cursor-pointer ${
                showDiagram
                  ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300'
                  : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:text-cyan-300 hover:border-cyan-500/40'
              }`}
            >
              <Layout size={11} className={showDiagram ? 'text-cyan-400' : ''} />
              <span className="hidden sm:inline">Diagram</span>
            </button>
          )}

          {coachRuleOfThumb && (
            <button
              type="button"
              onClick={() => setShowCoachTip(!showCoachTip)}
              title={showCoachTip ? 'Hide field guidelines' : 'Show engineering rules of thumb & field tips'}
              className={`h-7 px-2 rounded text-[10px] font-mono flex items-center gap-1 border transition-colors cursor-pointer ${
                showCoachTip
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                  : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:text-amber-300 hover:border-amber-500/40'
              }`}
            >
              <Sparkles size={11} className={showCoachTip ? 'text-amber-400' : ''} />
              <span className="hidden sm:inline">Tips</span>
            </button>
          )}

          {activeScenario && (activeScenario.insight || activeScenario.consequence) && (
            <button
              type="button"
              onClick={() => setShowInsight(!showInsight)}
              title={showInsight ? 'Hide scenario details' : 'Show scenario impact & event'}
              className={`h-7 px-1.5 rounded text-[10px] font-mono flex items-center gap-1 border transition-colors cursor-pointer ${
                isAbnormal
                  ? showInsight
                    ? 'bg-red-950/40 border-red-500/60 text-red-300'
                    : 'bg-[#0d1117] border-red-900/60 text-red-400 hover:border-red-500'
                  : showInsight
                  ? 'bg-blue-950/40 border-blue-500/60 text-blue-300'
                  : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:text-white'
              }`}
            >
              {isAbnormal ? <AlertTriangle size={11} /> : <Info size={11} />}
              <span className="hidden sm:inline">{isAbnormal ? 'Fault' : 'Info'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Visual Engineering Schematic Diagram */}
      {showDiagram && simulatorType && inputs && (
        <div className="animate-fadeIn">
          <SimulatorSchematicDiagram
            simulatorType={simulatorType}
            inputs={inputs}
            outputs={outputs}
            unitSystem={unitSystem}
          />
        </div>
      )}

      {/* Collapsible Guidance Tip Drawer */}
      {showCoachTip && coachRuleOfThumb && (
        <div className="p-2 rounded bg-amber-950/30 border border-amber-500/40 text-xs text-[#c9d1d9] space-y-1 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={11} />
              {coachStandard ? `Guidance (${coachStandard})` : 'Engineering Rule of Thumb'}
            </span>
            <button
              type="button"
              onClick={() => setIsDiagnosticModalOpen(true)}
              className="text-[9px] font-mono text-amber-400 hover:text-amber-300 underline flex items-center gap-0.5 cursor-pointer"
            >
              <Wrench size={9} />
              Diagnose
            </button>
          </div>
          <p className="text-[10px] leading-relaxed text-[#d1d5db]">{coachRuleOfThumb}</p>
          {coachFieldTip && (
            <p className="text-[9px] font-mono text-[#a1a1aa] border-t border-amber-500/20 pt-1">
              💡 {coachFieldTip}
            </p>
          )}
        </div>
      )}

      {/* Collapsible Active Scenario Fault/Consequence Drawer */}
      {showInsight && activeScenario && (
        <div
          className={`p-2 rounded border text-xs font-mono space-y-1 animate-fadeIn ${
            isAbnormal
              ? 'bg-red-950/30 border-red-800/60 text-red-200'
              : 'bg-[#0d1117] border-[#30363d] text-[#8b949e]'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="flex items-center gap-1">
              {isAbnormal ? (
                <>
                  <AlertTriangle size={10} className="text-red-400" />
                  <span className="text-red-400 uppercase">Abnormal Test Condition</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={10} className="text-emerald-400" />
                  <span className="text-emerald-400 uppercase">Baseline Operation</span>
                </>
              )}
            </span>
            <span className="text-[9px] font-mono text-[#8b949e] truncate max-w-[120px]">
              {activeScenario.name || scenarioId}
            </span>
          </div>

          {activeScenario.event && (
            <div className="text-[10px] leading-tight">
              <span className="text-[9px] text-[#8b949e] uppercase mr-1">Event:</span>
              <span className="text-white">{activeScenario.event}</span>
            </div>
          )}

          {activeScenario.consequence && (
            <div className="text-[10px] leading-tight">
              <span className="text-[9px] text-red-400 uppercase mr-1">Impact:</span>
              <span className="text-white">{activeScenario.consequence}</span>
            </div>
          )}

          {activeScenario.insight && (
            <div className="text-[10px] leading-tight text-[#d1d5db]">
              {activeScenario.insight}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   5. ZERO-SCROLL TABBED PARAMETER CONTAINER
   ========================================================================== */
export interface ParameterTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  content: React.ReactNode;
}

export interface TabbedParameterPanelProps {
  scenarioHeader?: React.ReactNode;
  tabs: ParameterTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const TabbedParameterPanel: React.FC<TabbedParameterPanelProps> = ({
  scenarioHeader,
  tabs,
  activeTab,
  onTabChange,
  className = '',
}) => {
  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <div className={`flex flex-col h-full overflow-hidden gap-1.5 select-none ${className}`}>
      {/* 1. Compact Scenario Header */}
      {scenarioHeader && <div className="shrink-0">{scenarioHeader}</div>}

      {/* 2. Sleek Segmented Tab Selector */}
      <div className="shrink-0 flex items-center bg-[#161b22] p-1 rounded border border-[#30363d] gap-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-1 px-1.5 text-[11px] font-mono font-semibold rounded flex items-center justify-center gap-1 transition-all cursor-pointer truncate ${
                isActive
                  ? 'bg-[#0d1117] text-[#f27d26] border border-[#f27d26]/40 shadow-sm'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#0d1117]/50 border border-transparent'
              }`}
            >
              {tab.icon}
              <span className="truncate">{tab.label}</span>
              {tab.badge && (
                <span className="text-[8px] px-1 py-0.2 rounded bg-[#161b22] text-[#8b949e] border border-[#30363d]">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Active Tab Content (Fits Viewport Height) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-0.5">
        {currentTab?.content}
      </div>
    </div>
  );
};

/* ==========================================================================
   6. ADVANCED SECTION ACCORDION (COMPACT)
   ========================================================================== */
export interface AdvancedSectionProps {
  title?: string;
  isOpen: boolean;
  onToggle: () => void;
  count?: number;
  children: React.ReactNode;
}

export const AdvancedSection: React.FC<AdvancedSectionProps> = ({
  title = 'Advanced Parameters',
  isOpen,
  onToggle,
  count,
  children,
}) => {
  return (
    <div className="p-2 bg-[#161b22] border border-[#30363d] rounded flex flex-col gap-1.5 shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between text-[10px] font-mono font-bold text-[#8b949e] hover:text-white transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-1">
          {isOpen ? <ChevronDown size={12} className="text-[#f27d26]" /> : <ChevronRight size={12} className="text-[#f27d26]" />}
          <span>{title}</span>
          {count !== undefined && (
            <span className="text-[8px] text-[#8b949e] px-1 bg-[#0d1117] rounded border border-[#30363d]">
              {count}
            </span>
          )}
        </span>
        <span className="text-[9px] text-[#58a6ff]">
          {isOpen ? 'hide' : 'expand'}
        </span>
      </button>

      {isOpen && (
        <div className="pt-1.5 border-t border-[#30363d] flex flex-col gap-2">
          {children}
        </div>
      )}
    </div>
  );
};
