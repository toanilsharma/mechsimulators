import React, { useState } from 'react';
import {
  RotateCcw,
  Save,
  Download,
  GitCompare,
  Calculator,
  FileText,
  ShieldCheck,
  Zap,
  ZapOff,
  Sliders,
  Sparkles,
  Check,
  Activity,
} from 'lucide-react';
import { AnimationIntensity } from '../../engine/types';

export interface EngineeringToolbarProps {
  mode: 'basic' | 'advanced';
  onToggleMode: (newMode: 'basic' | 'advanced') => void;
  onReset: () => void;
  onSaveCase?: () => void;
  onOpenValidationBench: () => void;
  onOpenAudit: () => void;
  onOpenReport: () => void;
  isComparisonActive: boolean;
  onToggleComparison: () => void;
  isLowPowerMode?: boolean;
  onToggleLowPowerMode?: () => void;
  animationIntensity?: AnimationIntensity;
  onAnimationIntensityChange?: (intensity: AnimationIntensity) => void;
  className?: string;
}

export const EngineeringToolbar: React.FC<EngineeringToolbarProps> = ({
  mode,
  onToggleMode,
  onReset,
  onSaveCase,
  onOpenValidationBench,
  onOpenAudit,
  onOpenReport,
  isComparisonActive,
  onToggleComparison,
  isLowPowerMode = false,
  onToggleLowPowerMode,
  animationIntensity = 'high',
  onAnimationIntensityChange,
  className = '',
}) => {
  const [saveFeedback, setSaveFeedback] = useState<boolean>(false);

  const handleSave = () => {
    if (onSaveCase) {
      onSaveCase();
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2000);
    }
  };

  return (
    <div
      className={`p-2 bg-[#161b22] border border-[#30363d] rounded-sm flex flex-wrap items-center justify-between gap-2 text-xs font-mono shadow-sm ${className}`}
    >
      {/* Left side: Basic vs Advanced Mode Toggle & Comparison Toggle */}
      <div className="flex items-center flex-wrap gap-2">
        {/* Mode Switcher */}
        <div className="flex items-center bg-[#0d1117] p-0.5 rounded-sm border border-[#30363d]">
          <button
            type="button"
            onClick={() => onToggleMode('basic')}
            className={`px-3 py-1 rounded-sm text-xs font-mono transition-all flex items-center gap-1.5 ${
              mode === 'basic'
                ? 'bg-[#f27d26] text-black font-bold shadow-sm'
                : 'text-[#8b949e] hover:text-white'
            }`}
            title="Switch to Basic Engineering Mode (Essential parameters only)"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Basic</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleMode('advanced')}
            className={`px-3 py-1 rounded-sm text-xs font-mono transition-all flex items-center gap-1.5 ${
              mode === 'advanced'
                ? 'bg-[#f27d26] text-black font-bold shadow-sm'
                : 'text-[#8b949e] hover:text-white'
            }`}
            title="Switch to Advanced Engineering Mode (All friction, fittings, materials & coefficients)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Advanced</span>
          </button>
        </div>

        {/* Animation Intensity Selector: High / Medium / Low */}
        {onAnimationIntensityChange && (
          <div className="flex items-center bg-[#0d1117] p-0.5 rounded-sm border border-[#30363d] text-[11px]">
            <span className="px-2 text-[#8b949e] flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#38bdf8]" />
              <span className="hidden sm:inline">Intensity:</span>
            </span>
            {(['high', 'medium', 'low'] as AnimationIntensity[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => onAnimationIntensityChange(level)}
                className={`px-2 py-0.5 rounded-sm capitalize transition-all ${
                  animationIntensity === level
                    ? 'bg-[#38bdf8] text-black font-bold'
                    : 'text-[#8b949e] hover:text-white'
                }`}
                title={`Set physics animation intensity to ${level}`}
              >
                {level}
              </button>
            ))}
          </div>
        )}

        {/* Delta Comparison Toggle */}
        <button
          type="button"
          onClick={onToggleComparison}
          className={`px-3 py-1.5 rounded-sm border text-xs font-mono transition-all flex items-center gap-1.5 ${
            isComparisonActive
              ? 'bg-[#58a6ff]/20 text-[#58a6ff] border-[#58a6ff] font-bold'
              : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:text-white hover:border-[#8b949e]'
          }`}
          title="Toggle baseline vs. customized case comparison table"
        >
          <GitCompare className="w-3.5 h-3.5" />
          <span>Compare Case</span>
        </button>

        {/* Save Snapshot Button */}
        {onSaveCase && (
          <button
            type="button"
            onClick={handleSave}
            className="px-2.5 py-1.5 rounded-sm bg-[#0d1117] text-[#8b949e] hover:text-white border border-[#30363d] hover:border-[#8b949e] flex items-center gap-1.5 transition-colors"
            title="Save current parameter snapshot to local storage"
          >
            {saveFeedback ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#3fb950]" />
                <span className="text-[#3fb950] font-bold">Saved</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Case</span>
              </>
            )}
          </button>
        )}

        {/* Reset to Defaults */}
        <button
          type="button"
          onClick={onReset}
          className="px-2.5 py-1.5 rounded-sm bg-[#0d1117] text-[#8b949e] hover:text-[#f85149] border border-[#30363d] hover:border-[#f85149]/50 flex items-center gap-1.5 transition-colors"
          title="Reset all inputs back to benchmark default values"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Right side: Verification Bench, Audit Trail, Report & Power Mode */}
      <div className="flex items-center flex-wrap gap-2">
        {/* Low Power Animation Toggle */}
        {onToggleLowPowerMode && (
          <button
            type="button"
            onClick={onToggleLowPowerMode}
            className={`px-2.5 py-1.5 rounded-sm border text-xs font-mono transition-all flex items-center gap-1.5 ${
              isLowPowerMode
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:text-white'
            }`}
            title="Toggle Low Power Mode (reduces animation overhead on mobile/battery)"
          >
            {isLowPowerMode ? <ZapOff className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isLowPowerMode ? 'Low Power' : 'Full FX'}</span>
          </button>
        )}

        {/* Engineering Validation Bench Modal */}
        <button
          type="button"
          onClick={onOpenValidationBench}
          className="px-3 py-1.5 rounded-sm bg-[#0d1117] hover:bg-[#3fb950]/10 text-[#3fb950] border border-[#3fb950]/50 flex items-center gap-1.5 transition-colors font-bold"
          title="Open Engineering Quality & Validation Benchmark Suite"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#3fb950]" />
          <span>Validation Bench</span>
        </button>

        {/* Audit Modal Button */}
        <button
          type="button"
          onClick={onOpenAudit}
          className="px-2.5 py-1.5 rounded-sm bg-[#0d1117] text-sky-400 hover:bg-sky-400/10 border border-sky-400/40 flex items-center gap-1.5 transition-colors"
          title="Inspect step-by-step mathematical derivation"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Audit Steps</span>
        </button>

        {/* Export Report Button */}
        <button
          type="button"
          onClick={onOpenReport}
          className="px-3 py-1.5 rounded-sm bg-[#f27d26] hover:bg-[#ff8f3d] text-black font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          title="Generate and print comprehensive engineering compliance report"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Export Report</span>
        </button>
      </div>
    </div>
  );
};
