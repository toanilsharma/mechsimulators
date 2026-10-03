import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sliders, Activity, ChevronUp, ChevronDown, CheckCircle2, AlertTriangle, AlertOctagon, Layers } from 'lucide-react';
import { StatusLevel } from '../../types/common';
import { ScenarioItem } from './types';

export type BottomSheetState = 'peek' | 'half' | 'full';

interface MobileBottomSheetProps {
  status: {
    level: StatusLevel;
    label: string;
    message?: string;
  };
  inputsContent: React.ReactNode;
  resultsContent: React.ReactNode;
  activeTab: 'inputs' | 'results';
  onTabChange: (tab: 'inputs' | 'results') => void;
  scenarios?: ScenarioItem<any>[];
  activeScenarioId?: string;
  onSelectScenario?: (id: string) => void;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  status,
  inputsContent,
  resultsContent,
  activeTab,
  onTabChange,
  scenarios,
  activeScenarioId,
  onSelectScenario,
}) => {
  const [sheetState, setSheetState] = useState<BottomSheetState>('peek');
  const [dragOffset, setDragOffset] = useState<number>(0);
  const touchStartYRef = useRef<number>(0);
  const touchCurrentYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const startTimeRef = useRef<number>(0);

  // Height mappings based on screen state
  const getHeightStyle = () => {
    switch (sheetState) {
      case 'peek':
        return 'h-[64px] max-h-[64px]';
      case 'half':
        return 'h-[54dvh] max-h-[54dvh]';
      case 'full':
        return 'h-[88dvh] max-h-[88dvh]';
      default:
        return 'h-[64px]';
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
    touchCurrentYRef.current = e.touches[0].clientY;
    startTimeRef.current = performance.now();
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    touchCurrentYRef.current = e.touches[0].clientY;
    const delta = touchCurrentYRef.current - touchStartYRef.current;
    
    // Provide elastic resistance when over-dragging beyond full or peek
    if (sheetState === 'peek' && delta > 0) {
      setDragOffset(delta * 0.2);
    } else if (sheetState === 'full' && delta < 0) {
      setDragOffset(delta * 0.2);
    } else {
      setDragOffset(delta);
    }
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const deltaY = touchCurrentYRef.current - touchStartYRef.current;
    const elapsedTime = performance.now() - startTimeRef.current;
    const velocity = deltaY / Math.max(1, elapsedTime); // px per ms

    setDragOffset(0);

    // Fast flick or significant drag distance
    const isFlickUp = velocity < -0.4 || deltaY < -45;
    const isFlickDown = velocity > 0.4 || deltaY > 45;

    if (isFlickUp) {
      if (sheetState === 'peek') setSheetState('half');
      else if (sheetState === 'half') setSheetState('full');
    } else if (isFlickDown) {
      if (sheetState === 'full') setSheetState('half');
      else if (sheetState === 'half') setSheetState('peek');
    }
  };

  const toggleExpand = useCallback(() => {
    if (sheetState === 'peek') setSheetState('half');
    else if (sheetState === 'half') setSheetState('full');
    else setSheetState('peek');
  }, [sheetState]);

  const getStatusColor = () => {
    switch (status.level) {
      case 'safe':
        return 'bg-emerald-950/90 text-emerald-400 border-emerald-700/60';
      case 'warning':
        return 'bg-amber-950/90 text-amber-400 border-amber-700/60';
      case 'critical':
        return 'bg-red-950/90 text-red-400 border-red-700/60 animate-pulse';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  const getStatusIcon = () => {
    switch (status.level) {
      case 'safe':
        return <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle size={13} className="text-amber-400 shrink-0" />;
      case 'critical':
        return <AlertOctagon size={13} className="text-red-400 shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Dimmed backdrop when fully expanded */}
      {sheetState === 'full' && (
        <div
          onClick={() => setSheetState('peek')}
          className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Main Draggable Bottom Sheet Container */}
      <section
        id="mobile-bottom-sheet"
        aria-label="Simulator Controls and Telemetry"
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d1117] border-t border-[#30363d] shadow-[0_-8px_30px_rgba(0,0,0,0.8)] flex flex-col transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden ${getHeightStyle()}`}
        style={{
          transform: dragOffset !== 0 ? `translateY(${dragOffset}px)` : undefined,
          paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Drag Handle & SCADA Status Strip */}
        <div
          className="w-full bg-[#161b22] px-3 pt-2 pb-2 flex flex-col gap-1.5 cursor-grab active:cursor-grabbing border-b border-[#30363d] select-none shrink-0"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Visual Grab Handle Pill */}
          <div className="w-full flex items-center justify-center -mt-0.5" onClick={toggleExpand}>
            <div className="w-12 h-1.5 bg-[#484f58] hover:bg-[#8b949e] rounded-full transition-colors" />
          </div>

          {/* Header Action Row: Tabs (Inputs / Results) | Scenario Quick Selector | Status Badge | Expand Chevron */}
          <div className="flex items-center justify-between gap-2">
            {/* Tab Selectors (Inputs vs Results) */}
            <div className="flex items-center gap-1 bg-[#0d1117] p-0.5 rounded-lg border border-[#30363d]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabChange('inputs');
                  if (sheetState === 'peek') setSheetState('half');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[40px] text-xs font-mono font-bold rounded transition-colors touch-manipulation ${
                  activeTab === 'inputs'
                    ? 'bg-[#f27d26] text-black shadow-sm'
                    : 'text-[#8b949e] hover:text-white'
                }`}
              >
                <Sliders size={14} />
                <span>Inputs</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabChange('results');
                  if (sheetState === 'peek') setSheetState('half');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[40px] text-xs font-mono font-bold rounded transition-colors touch-manipulation ${
                  activeTab === 'results'
                    ? 'bg-[#f27d26] text-black shadow-sm'
                    : 'text-[#8b949e] hover:text-white'
                }`}
              >
                <Activity size={14} />
                <span>Results</span>
              </button>
            </div>

            {/* Middle: Compact Scenario Selector on mobile */}
            {scenarios && scenarios.length > 0 && onSelectScenario && (
              <div
                className="hidden sm:flex items-center gap-1 bg-[#0d1117] px-2 py-1 rounded border border-[#30363d] max-w-[140px]"
                onClick={(e) => e.stopPropagation()}
              >
                <Layers size={12} className="text-[#f27d26] shrink-0" />
                <select
                  value={activeScenarioId}
                  onChange={(e) => onSelectScenario(e.target.value)}
                  className="bg-transparent text-white text-[11px] font-mono font-bold focus:outline-none truncate w-full cursor-pointer"
                >
                  {scenarios.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#161b22] text-white">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Right: Status Pill & Expand/Collapse Toggle Button */}
            <div className="flex items-center gap-1.5">
              <div
                onClick={toggleExpand}
                className={`flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-mono font-bold cursor-pointer ${getStatusColor()}`}
              >
                {getStatusIcon()}
                <span className="uppercase">{status.label}</span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand();
                }}
                aria-label={sheetState === 'full' ? 'Collapse panel' : 'Expand panel'}
                className="w-10 h-10 flex items-center justify-center text-[#8b949e] hover:text-white rounded bg-[#0d1117] border border-[#30363d] active:bg-[#21262d] transition-colors touch-manipulation"
              >
                {sheetState === 'full' ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content Pane */}
        <div
          className="flex-1 w-full overflow-y-auto px-3 py-3 space-y-3 bg-[#0d1117] custom-scrollbar overscroll-contain"
          style={{
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {activeTab === 'inputs' ? inputsContent : resultsContent}
        </div>
      </section>
    </>
  );
};
