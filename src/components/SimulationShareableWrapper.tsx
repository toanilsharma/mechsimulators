import React, { useState } from 'react';
import {
  Share2,
  Check,
  RotateCcw,
  Play,
  Pause,
  AlertCircle,
  Copy,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useSimulationAutoPlay } from '../hooks/useSimulationAutoPlay';
import {
  useSyncSimulationState,
  SimulationParamRecord,
} from '../hooks/useSyncSimulationState';

export interface SimulationShareableWrapperProps<T extends SimulationParamRecord> {
  /** Simulator Title for the share modal & header */
  title: string;
  /** Subtitle or engineering standard */
  subtitle?: string;
  /** Default parameters configuration */
  defaultParams: T;
  /** Render prop providing parameters, controls, and motion state */
  children: (props: {
    params: T;
    setParam: <K extends keyof T>(key: K, value: T[K]) => void;
    setParams: (updates: Partial<T> | ((prev: T) => Partial<T>)) => void;
    isPlaying: boolean;
    play: () => void;
    pause: () => void;
    togglePlay: () => void;
    fps: number;
    isReducedMotion: boolean;
  }) => React.ReactNode;
  /** Optional parameter formatting function for the share preview */
  formatParamSummary?: (params: T) => string;
}

export function SimulationShareableWrapper<T extends SimulationParamRecord>({
  title,
  subtitle,
  defaultParams,
  children,
  formatParamSummary,
}: SimulationShareableWrapperProps<T>) {
  // 1. Core Hooks
  const autoPlay = useSimulationAutoPlay();
  const sync = useSyncSimulationState(defaultParams, { debounceMs: 300 });

  // 2. UI State for Share Popover
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyLink = async () => {
    const success = await sync.copyShareUrl();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="relative w-full flex flex-col bg-[#0B1220] rounded-2xl border border-[#1E293B] overflow-hidden text-slate-100 font-sans shadow-2xl">
      {/* Reduced Motion System Preference Notification Banner */}
      {autoPlay.isReducedMotion && !autoPlay.isPlaying && (
        <div className="bg-[#F59E0B]/15 border-b border-[#F59E0B]/30 px-4 py-2.5 flex items-center justify-between gap-3 text-xs md:text-sm font-mono text-[#F59E0B] animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              <strong>Motion Reduced:</strong> Simulation paused to honor your operating system accessibility preferences.
            </span>
          </div>
          <button
            type="button"
            onClick={autoPlay.play}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#F59E0B] hover:bg-[#d97706] text-slate-950 font-bold transition-colors shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Resume Animation</span>
          </button>
        </div>
      )}

      {/* Top Engineering Share & Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#0F172A] border-b border-[#1E293B]">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-6 bg-[#06B6D4] rounded-sm shadow-[0_0_8px_#06B6D4]" />
          <div>
            <h2 className="text-base font-bold text-slate-100 tracking-tight leading-none">
              {title}
            </h2>
            {subtitle && (
              <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls: Share Link & Reset */}
        <div className="flex items-center gap-2">
          {/* FPS & Status Chip */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#0B1220] border border-[#1E293B] px-2.5 py-1 rounded-md text-xs font-mono text-slate-400">
            <span
              className={`w-2 h-2 rounded-full ${
                autoPlay.isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>{autoPlay.isPlaying ? `${autoPlay.fps} FPS` : 'STATIC FRAME'}</span>
          </div>

          {/* Reset Parameters Button */}
          <button
            type="button"
            onClick={sync.resetParams}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            title="Reset parameters to factory defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset Defaults</span>
          </button>

          {/* Share Simulator Setup Button */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#06B6D4] hover:bg-[#0891b2] text-slate-950 text-xs font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all"
            title="Share this exact simulation setup via URL"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Setup</span>
          </button>
        </div>
      </div>

      {/* Main Simulation Viewport (Render Prop) */}
      <div className="relative w-full">
        {children({
          params: sync.params,
          setParam: sync.setParam,
          setParams: sync.setParams,
          isPlaying: autoPlay.isPlaying,
          play: autoPlay.play,
          pause: autoPlay.pause,
          togglePlay: autoPlay.togglePlay,
          fps: autoPlay.fps,
          isReducedMotion: autoPlay.isReducedMotion,
        })}
      </div>

      {/* Share Setup Dialog Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 shadow-2xl relative text-slate-100">
            <div className="flex items-center gap-2.5 text-[#06B6D4] text-xs font-mono font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Shareable Simulation Preset</span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-1">
              Share Simulation Setup
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Anyone opening this link will load your exact operating parameters without reloading or resetting the physics engine.
            </p>

            {/* Active Parameters Summary */}
            <div className="bg-[#0B1220] border border-[#1E293B] rounded-xl p-3.5 mb-4 text-xs font-mono">
              <div className="text-slate-500 uppercase tracking-wider text-[10px] mb-2 font-semibold">
                Encoded Setup Parameters:
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                {formatParamSummary ? (
                  <div className="col-span-2 text-cyan-300">{formatParamSummary(sync.params)}</div>
                ) : (
                  Object.entries(sync.params).map(([key, val]) => (
                    <div key={key} className="flex justify-between border-b border-[#1E293B]/60 pb-1">
                      <span className="text-slate-400">{key}:</span>
                      <span className="text-cyan-400 font-bold">{String(val)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* URL Input & Copy Button */}
            <div className="flex items-center gap-2 mb-5">
              <input
                type="text"
                readOnly
                value={sync.shareUrl}
                className="w-full bg-[#0B1220] border border-[#1E293B] rounded-lg px-3 py-2 text-xs font-mono text-slate-300 truncate focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs transition-all shrink-0 ${
                  copied
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-[#06B6D4] hover:bg-[#0891b2] text-slate-950'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-slate-200 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
