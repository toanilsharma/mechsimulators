import React, { useMemo } from 'react';
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Radio,
  Sliders,
  FastForward,
} from 'lucide-react';

export interface TransientEventMarker {
  id: string;
  time: number;
  scenarioId: string;
  label: string;
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  shortName: string;
  category: 'nominal' | 'fault';
  description: string;
  badge: string;
  params: {
    rpm?: number;
    flowRate?: number;
    staticHead?: number;
    fluidTemp?: number;
    impellerTrim?: number;
  };
}

export interface ScenarioTimeScrubberProps {
  // Scrubber & Time State
  currentTime: number;
  maxTime: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward: (dt?: number) => void;
  onScrubTime: (time: number) => void;
  onResetTime: () => void;
  onJumpToLive?: () => void;

  // Scenario Fault Injection State
  scenarios: ScenarioDefinition[];
  activeScenarioId: string;
  onScenarioChange: (scenarioId: string) => void;

  // Transient HUD state
  isTransientActive: boolean;
  transientMessage?: string;
  transientMarkers?: TransientEventMarker[];

  // Speed multiplier
  simSpeed?: number;
  onChangeSimSpeed?: (speed: number) => void;

  className?: string;
}

/**
 * Format high-precision simulation time string:
 * e.g., t = 04.215s (or mm:ss.mmm for longer durations)
 */
export const formatPrecisionTime = (seconds: number): string => {
  const s = Math.max(0, seconds);
  const secs = Math.floor(s);
  const millis = Math.floor((s - secs) * 1000);
  const paddedSecs = String(secs).padStart(2, '0');
  const paddedMillis = String(millis).padStart(3, '0');
  return `t = ${paddedSecs}.${paddedMillis}s`;
};

export const ScenarioTimeScrubber: React.FC<ScenarioTimeScrubberProps> = ({
  currentTime,
  maxTime,
  isPlaying,
  onTogglePlay,
  onStepForward,
  onScrubTime,
  onResetTime,
  onJumpToLive,
  scenarios,
  activeScenarioId,
  onScenarioChange,
  isTransientActive,
  transientMessage,
  transientMarkers = [],
  simSpeed = 1.0,
  onChangeSimSpeed,
  className = '',
}) => {
  // Calculate percentage for timeline slider progress fill
  const progressPercent = useMemo(() => {
    if (maxTime <= 0) return 0;
    return Math.min(100, Math.max(0, (currentTime / maxTime) * 100));
  }, [currentTime, maxTime]);

  const isReviewingHistory = maxTime - currentTime > 0.15;

  return (
    <div
      className={`w-full bg-[#090e18] border border-[#1E293B] rounded-xl p-2.5 sm:p-3 shadow-2xl flex flex-col gap-2.5 select-none ${className}`}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. FAULT INJECTION PANEL (Physical Toggle Switches / Pills)   */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#06B6D4] animate-pulse motion-reduce:animate-none" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-200">
              Fault Injection &amp; Scenario Sandbox
            </span>
          </div>

          {/* Active Transient Notification Indicator */}
          {isTransientActive ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/70 text-amber-300 font-mono text-[10px] font-bold shadow-[0_0_12px_rgba(245,158,11,0.35)] animate-pulse motion-reduce:animate-none">
              <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>TRANSIENT DETECTED</span>
              {transientMessage && <span className="hidden sm:inline">&bull; {transientMessage}</span>}
            </div>
          ) : (
            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
              SELECT FAULT TO TRIGGER DYNAMIC EQUILIBRIUM SHIFT
            </span>
          )}
        </div>

        {/* Horizontal Row of Physical Toggle Switches */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
          {scenarios.map((sc) => {
            const isActive = activeScenarioId === sc.id;
            const isFault = sc.category === 'fault';

            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => onScenarioChange(sc.id)}
                title={sc.description}
                className={`relative group flex flex-col justify-between p-2 rounded-lg border text-left transition-all cursor-pointer font-mono ${
                  isActive
                    ? isFault
                      ? 'bg-amber-950/40 border-amber-500 text-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.3)] ring-1 ring-amber-500/50'
                      : 'bg-[#06B6D4]/15 border-[#06B6D4] text-cyan-200 shadow-[0_0_14px_rgba(6,182,212,0.25)] ring-1 ring-[#06B6D4]/50'
                    : 'bg-[#0F172A] border-[#1E293B] hover:border-slate-600 text-slate-400 hover:text-slate-200'
                }`}
              >
                {/* Top LED Indicator & Switch Mechanism */}
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5">
                    {/* Simulated Physical LED Light */}
                    <span
                      className={`w-2 h-2 rounded-full transition-all ${
                        isActive
                          ? isFault
                            ? 'bg-amber-400 shadow-[0_0_8px_#F59E0B]'
                            : 'bg-emerald-400 shadow-[0_0_8px_#10B981]'
                          : 'bg-slate-700 border border-slate-600'
                      }`}
                    />
                    <span
                      className={`text-[9px] font-semibold uppercase tracking-wider ${
                        isActive
                          ? isFault
                            ? 'text-amber-400'
                            : 'text-[#06B6D4]'
                          : 'text-slate-400'
                      }`}
                    >
                      {isActive ? 'ENGAGED' : 'STANDBY'}
                    </span>
                  </div>

                  {/* Physical Toggle Switch Rocker Graphic */}
                  <div
                    className={`w-5 h-2.5 rounded-full p-[1px] border transition-colors flex items-center ${
                      isActive
                        ? isFault
                          ? 'bg-amber-950 border-amber-500 justify-end'
                          : 'bg-cyan-950 border-[#06B6D4] justify-end'
                        : 'bg-slate-900 border-slate-700 justify-start'
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full transition-transform ${
                        isActive
                          ? isFault
                            ? 'bg-amber-400'
                            : 'bg-[#06B6D4]'
                          : 'bg-slate-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Scenario Name & Badge */}
                <div className="leading-tight">
                  <div
                    className={`text-[12px] font-bold tracking-tight truncate ${
                      isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                    }`}
                  >
                    {sc.name}
                  </div>
                  <div className="flex items-center justify-between mt-0.5 text-[9px] text-slate-400 truncate">
                    <span>{sc.shortName}</span>
                    <span
                      className={`px-1 py-[1px] rounded text-[8px] font-semibold ${
                        isFault
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                          : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                      }`}
                    >
                      {sc.badge}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. TIME-SCRUBBER CONTROL (Transport + Precision Slider + HUD) */}
      {/* ------------------------------------------------------------- */}
      <div className="pt-2 border-t border-[#1E293B] flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Left Transport Cluster: Play, Pause, Step (+0.1s), Reset, Speed */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Play / Pause Toggle Button */}
            <button
              type="button"
              onClick={onTogglePlay}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-[#06B6D4] text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-[#1E293B] hover:bg-[#334155] text-slate-200'
              }`}
              title={isPlaying ? 'Pause Simulation (Space)' : 'Play Live Simulation (Space)'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>PLAY</span>
                </>
              )}
            </button>

            {/* Step Forward (+0.1s) */}
            <button
              type="button"
              onClick={() => onStepForward(0.1)}
              disabled={isPlaying}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] disabled:opacity-40 text-slate-200 font-mono text-[11px] font-semibold transition-all cursor-pointer"
              title="Step Forward +0.1s (paused only)"
            >
              <StepForward className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>+0.1s</span>
            </button>

            {/* Reset / Rewind to t = 0.000s */}
            <button
              type="button"
              onClick={onResetTime}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-slate-300 font-mono text-[11px] transition-all cursor-pointer"
              title="Rewind Timeline to 0.000s"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">REWIND</span>
            </button>

            {/* Speed Multiplier (0.5x, 1x, 2x) */}
            {onChangeSimSpeed && (
              <button
                type="button"
                onClick={() =>
                  onChangeSimSpeed(simSpeed === 1.0 ? 2.0 : simSpeed === 2.0 ? 0.5 : 1.0)
                }
                className="px-2 py-1.5 rounded-lg bg-[#0F172A] border border-[#1E293B] hover:border-slate-600 text-[#06B6D4] font-mono text-[11px] font-bold transition-all cursor-pointer"
                title="Simulation Speed Multiplier"
              >
                {simSpeed.toFixed(1)}x
              </button>
            )}
          </div>

          {/* Right Status Cluster: High-Precision Monospace Time Display */}
          <div className="flex items-center gap-2 font-mono">
            {isReviewingHistory ? (
              <button
                type="button"
                onClick={onJumpToLive}
                className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-bold hover:bg-amber-500/30 transition-all cursor-pointer animate-pulse motion-reduce:animate-none"
                title="Jump to live running edge"
              >
                <FastForward className="w-3 h-3 text-amber-400" />
                <span>RESUME LIVE</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0F172A] border border-[#1E293B] text-[10px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping motion-reduce:animate-none" />
                <span>LIVE SOLVER</span>
              </div>
            )}

            {/* Monospace High-Precision Time Display (t = 04.215s) */}
            <div className="bg-[#0F172A] border border-[#1E293B] px-3 py-1 rounded-lg text-slate-100 flex items-center gap-2 shadow-inner">
              <Clock className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span className="text-[13px] sm:text-[14px] font-bold text-[#06B6D4] tracking-wider tabular-nums [text-shadow:0_0_10px_rgba(6,182,212,0.45)]">
                {formatPrecisionTime(currentTime)}
              </span>
            </div>
          </div>
        </div>

        {/* High-Precision Interactive Scrubber Track with Transient Event Ticks */}
        <div className="relative w-full pt-1 pb-1">
          {/* Timeline Visual Track Background with Progress Fill */}
          <div className="relative w-full h-2.5 bg-[#0F172A] border border-[#1E293B] rounded-full overflow-hidden">
            {/* Played progress fill in Cyan */}
            <div
              className="h-full bg-gradient-to-r from-cyan-600 via-[#06B6D4] to-cyan-300 transition-[width] duration-75"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Fault / Transient Event Tick Markers on the Timeline */}
          {transientMarkers.map((marker) => {
            const markerPercent = maxTime > 0 ? (marker.time / maxTime) * 100 : 0;
            if (markerPercent < 0 || markerPercent > 100) return null;

            return (
              <button
                key={marker.id}
                type="button"
                onClick={() => onScrubTime(marker.time)}
                className="absolute top-1 -translate-x-1/2 z-10 group/marker cursor-pointer"
                style={{ left: `${markerPercent}%` }}
                title={`Jump to transient: ${marker.label} at ${formatPrecisionTime(marker.time)}`}
              >
                <div className="w-2.5 h-2.5 bg-amber-400 border border-black rotate-45 shadow-[0_0_6px_#F59E0B] group-hover/marker:scale-125 transition-transform" />
                {/* Tooltip on hover */}
                <div className="hidden group-hover/marker:flex absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/90 border border-amber-500/60 text-amber-200 font-mono text-[9px] whitespace-nowrap shadow-xl pointer-events-none z-30">
                  {marker.label} ({formatPrecisionTime(marker.time)})
                </div>
              </button>
            );
          })}

          {/* Native High-Precision Range Input */}
          <input
            type="range"
            min={0}
            max={Math.max(15, maxTime)}
            step={0.025}
            value={currentTime}
            onChange={(e) => onScrubTime(Number(e.target.value))}
            aria-label="Simulation Time Scrubber"
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
          />
        </div>

        {/* Timeline Boundary Readouts */}
        <div className="flex justify-between text-[10px] font-mono text-slate-500 leading-none px-0.5">
          <span>00.000s</span>
          <span className="text-slate-400">
            {isReviewingHistory
              ? `Reviewing snapshot at ${currentTime.toFixed(2)}s (drag forward or click Play to resume live)`
              : 'Drag slider backward to scrub history & inspect past transients'}
          </span>
          <span className="text-slate-400">{Math.max(15, maxTime).toFixed(1)}s</span>
        </div>
      </div>
    </div>
  );
};
