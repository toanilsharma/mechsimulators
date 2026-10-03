import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, HelpCircle, Wrench } from 'lucide-react';

interface LearningCoachBadgeProps {
  ruleOfThumb: string;
  fieldTip?: string;
  standard?: string;
  className?: string;
}

export const LearningCoachBadge: React.FC<LearningCoachBadgeProps> = ({
  ruleOfThumb,
  fieldTip,
  standard,
  className = '',
}) => {
  const { isLearningMode, setIsDiagnosticModalOpen } = useApp();

  if (!isLearningMode) return null;

  return (
    <div
      className={`p-2.5 bg-amber-950/20 border border-amber-500/30 rounded-lg text-xs text-[#c9d1d9] space-y-1 select-none animate-fadeIn ${className}`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
          <Sparkles size={12} />
          {standard ? `Guidance (${standard})` : 'Engineering Rule of Thumb'}
        </span>
        <button
          onClick={() => setIsDiagnosticModalOpen(true)}
          className="text-[10px] font-mono text-amber-400 hover:text-amber-300 underline flex items-center gap-0.5 cursor-pointer"
        >
          <Wrench size={10} />
          Diagnose
        </button>
      </div>
      <p className="text-[11px] leading-relaxed text-[#d1d5db]">{ruleOfThumb}</p>
      {fieldTip && (
        <p className="text-[10px] font-mono text-[#8b949e] border-t border-amber-500/20 pt-1">
          💡 <span className="text-[#a1a1aa]">{fieldTip}</span>
        </p>
      )}
    </div>
  );
};
