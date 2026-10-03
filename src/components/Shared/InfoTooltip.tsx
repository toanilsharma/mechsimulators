import React, { useState } from 'react';
import { Info, HelpCircle, X, BookOpen, ExternalLink } from 'lucide-react';

export interface InfoTooltipProps {
  text: string;
  term?: string;
  codeReference?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  iconOnly?: boolean;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  text,
  term,
  codeReference,
  position = 'top',
  className = '',
  iconOnly = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full mt-2 left-1/2 -translate-x-1/2';
      case 'left':
        return 'right-full mr-2 top-1/2 -translate-y-1/2';
      case 'right':
        return 'left-full ml-2 top-1/2 -translate-y-1/2';
      case 'top':
      default:
        return 'bottom-full mb-2 left-1/2 -translate-x-1/2';
    }
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen)}
        }
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-[#8b949e] hover:text-[#f27d26] transition-colors p-0.5 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#f27d26] cursor-help inline-flex items-center gap-1"
        aria-label={term ? `Info about ${term}` : 'Engineering definition'}
      >
        <HelpCircle className="w-3.5 h-3.5" />
        {!iconOnly && term && (
          <span className="text-xs font-mono underline decoration-dotted text-[#8b949e] hover:text-[#f27d26]">
            {term}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop for mobile closing */}
          <div
            className="fixed inset-0 z-40 sm:hidden"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
          <div
            role="tooltip"
            className={`absolute z-50 w-64 sm:w-72 p-3 rounded-sm bg-[#161b22] border border-[#f27d26] shadow-xl text-left ${getPositionClasses()} animate-in fade-in zoom-in-95 duration-150`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-1 mb-1">
              <span className="text-xs font-mono font-bold text-[#f27d26] uppercase">
                {term || 'Engineering Definition'}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[#8b949e] hover:text-white p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-[#d1d5db] font-sans leading-relaxed">
              {text}
            </p>
            {codeReference && (
              <div className="mt-2 pt-1.5 border-t border-[#30363d] flex items-center gap-1 text-[10px] font-mono text-[#8b949e]">
                <BookOpen className="w-3 h-3 text-[#f27d26]" />
                <span>Ref: {codeReference}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  formula?: string;
  formulaDescription?: string;
  standardReference?: string;
  practicalTips?: string[];
}

export const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  formula,
  formulaDescription,
  standardReference,
  practicalTips = [],
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg rounded-sm bg-[#161b22] border border-[#30363d] shadow-2xl p-5 sm:p-6 text-[#d1d5db] flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 border-b border-[#30363d] pb-3">
          <div>
            <div className="flex items-center gap-2 text-[#f27d26] text-xs font-mono uppercase font-bold">
              <BookOpen className="w-4 h-4" />
              <span>Engineering Reference</span>
            </div>
            <h3 className="text-base sm:text-lg font-mono font-bold text-white uppercase mt-1">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-sm bg-[#0d1117] border border-[#30363d] hover:border-[#f27d26] flex items-center justify-center text-[#8b949e] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 text-xs sm:text-sm font-sans leading-relaxed">
          <p className="text-[#d1d5db]">{description}</p>

          {formula && (
            <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-sm flex flex-col gap-1">
              <span className="text-[10px] font-mono font-bold text-[#8b949e] uppercase">
                Governing Equation
              </span>
              <code className="text-sm font-mono text-[#f27d26] font-bold">
                {formula}
              </code>
              {formulaDescription && (
                <span className="text-[11px] text-[#8b949e] font-sans mt-0.5">
                  {formulaDescription}
                </span>
              )}
            </div>
          )}

          {standardReference && (
            <div className="text-xs font-mono text-[#8b949e] p-2 bg-[#0d1117] rounded-sm border border-[#30363d]">
              <span className="text-white font-bold">Governing Code: </span>
              {standardReference}
            </div>
          )}

          {practicalTips.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-1">
              <span className="text-xs font-mono font-bold text-white uppercase">
                Plant Engineering Best Practices:
              </span>
              <ul className="list-disc list-inside space-y-1 text-xs text-[#8b949e]">
                {practicalTips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-[#30363d] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-sm bg-[#f27d26] text-black font-bold font-mono text-xs uppercase tracking-wider hover:bg-[#ff8f3d]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
