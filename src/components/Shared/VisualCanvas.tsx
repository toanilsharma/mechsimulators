import React, { useRef, useState, useEffect, ReactNode } from 'react';
import { PhysicsAnimationParams, SimulatorType, PerformanceMode, AnimationIntensity } from '../../engine/types';
import { UnitSystem } from '../../types/common';
import { useSimulationStore } from '../../engine/simulationStore';
import { Maximize2, Minimize2, Sparkles, Sliders, Play, Pause, Zap, Square, RotateCcw } from 'lucide-react';

export interface VisualCanvasProps<TInputs = any, TOutputs = any> {
  simulator: SimulatorType;
  inputs: TInputs;
  outputs: TOutputs;
  animationParams?: PhysicsAnimationParams;
  animationIntensity?: AnimationIntensity;
  scenarioState?: string | null;
  performanceMode?: PerformanceMode;
  reducedMotion?: boolean;
  unitSystem: UnitSystem;
  isRunning?: boolean;
  onToggleRunning?: () => void;
  onReset?: () => void;
  className?: string;
  title?: string;
  subtitle?: string;
  renderVisual: (props: {
    containerWidth: number;
    containerHeight: number;
    inputs: TInputs;
    outputs: TOutputs;
    animationParams: PhysicsAnimationParams;
    performanceMode: PerformanceMode;
    reducedMotion: boolean;
    isRunning: boolean;
    unitSystem: UnitSystem;
    time: number;
    isMobile?: boolean;
  }) => ReactNode;
  headerControls?: ReactNode;
  overlayBadge?: ReactNode;
}

export const VisualCanvas = <TInputs extends any, TOutputs extends any>({
  simulator,
  inputs,
  outputs,
  animationParams,
  animationIntensity: externalIntensity,
  scenarioState,
  performanceMode: externalPerformanceMode,
  reducedMotion = false,
  unitSystem,
  isRunning = true,
  onToggleRunning,
  onReset,
  className = '',
  title,
  subtitle,
  renderVisual,
  headerControls,
  overlayBadge,
}: VisualCanvasProps<TInputs, TOutputs>) => {
  const storeIntensity = useSimulationStore((state) => state.animationIntensity);
  const effectiveIntensity: AnimationIntensity = externalIntensity || storeIntensity || 'high';

  const [localRunning, setLocalRunning] = useState<boolean>(isRunning);

  useEffect(() => {
    setLocalRunning(isRunning);
  }, [isRunning]);

  const handleToggle = () => {
    if (onToggleRunning) {
      onToggleRunning();
    } else {
      setLocalRunning((prev) => !prev);
    }
  };

  const handleStop = () => {
    if (onToggleRunning && localRunning) {
      onToggleRunning();
    } else {
      setLocalRunning(false);
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
    setLocalRunning(true);
  };

  const activeRunning = localRunning;

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 500,
  });
  const [fps, setFps] = useState<number>(60);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [autoLowPower, setAutoLowPower] = useState<boolean>(false);

  const effectiveReducedMotion = !!(reducedMotion || autoLowPower);

  // Check mobile device detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
      setIsMobile(!!mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const effectivePerformanceMode: PerformanceMode =
    externalPerformanceMode || (autoLowPower ? 'low-power' : isMobile ? 'balanced' : 'high');

  // Default fallback animation parameters if not supplied
  const fallbackAnimParams: PhysicsAnimationParams = animationParams || {
    flowSpeed: 1.0,
    bubbleIntensity: 0,
    vibrationIntensity: 0.1,
    orbitRadius: 2.0,
    temperatureGlow: 'rgba(56, 189, 248, 0.3)',
    stressColor: '#38bdf8',
    pressurePulse: { frequencyHz: 25, amplitude: 0.2 },
    leakIntensity: 0,
    vaporizationIntensity: 0,
    damageLevel: 0,
    bearingHealth: 100,
    sealChamberTempColor: '#38bdf8',
  };

  // Robust ResizeObserver: ensures canvas fills center panel and resizes responsively without page scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let debounceTimer: number | null = null;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          if (debounceTimer) cancelAnimationFrame(debounceTimer);
          debounceTimer = requestAnimationFrame(() => {
            const nextW = Math.floor(width);
            const nextH = Math.floor(height);
            setDimensions((prev) => {
              if (prev.width === nextW && prev.height === nextH) return prev;
              return { width: nextW, height: nextH };
            });
          });
        }
      }
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
      if (debounceTimer) cancelAnimationFrame(debounceTimer);
    };
  }, []);

  // Performance FPS monitoring with automatic low-power adaptation
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let lowFpsConsecutiveCount = 0;
    let animId: number;

    const loop = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        const measuredFps = Math.round((frameCount * 1000) / (now - lastTime));
        setFps((prev) => (prev === measuredFps ? prev : measuredFps));
        
        // If FPS drops below 35 for 2 consecutive seconds, automatically throttle to low power
        if (measuredFps < 35 && isRunning && !effectiveReducedMotion) {
          lowFpsConsecutiveCount++;
          if (lowFpsConsecutiveCount >= 2) {
            setAutoLowPower((prev) => (prev ? prev : true));
          }
        } else if (measuredFps > 50) {
          lowFpsConsecutiveCount = 0;
        }

        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, effectiveReducedMotion]);

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative overflow-hidden flex flex-col bg-[#080b0f] select-none ${className}`}
      style={{ touchAction: 'none' }}
    >
      {/* Background Engineering Substrate Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, #1f2937 1px, transparent 1px), linear-gradient(to bottom, #1f2937 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Overlay Bar: Title, Scenario Indicator & Actions (Desktop) */}
      <div className="absolute top-2 left-3 right-3 z-20 hidden md:flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {title && (
            <div className="flex items-center gap-2 bg-[#0d1117]/85 border border-[#30363d] px-2.5 py-1 rounded backdrop-blur shadow-sm">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: fallbackAnimParams.stressColor }} />
              <span className="text-xs font-bold text-white font-mono">{title}</span>
              {subtitle && <span className="text-[10px] text-[#8b949e] font-mono hidden sm:inline">| {subtitle}</span>}
            </div>
          )}
          {scenarioState && (
            <div className="bg-[#161b22]/90 border border-[#38bdf8]/30 px-2 py-0.5 rounded text-[10px] font-mono text-[#38bdf8] hidden md:flex items-center gap-1">
              <Zap size={11} />
              <span>{scenarioState}</span>
            </div>
          )}
          {autoLowPower && (
            <div className="bg-amber-950/80 border border-amber-600/50 px-2 py-0.5 rounded text-[10px] font-mono text-amber-400 flex items-center gap-1">
              <Sparkles size={11} />
              <span>Low-Power Active</span>
            </div>
          )}
        </div>

        {/* Right Action Icons: Controls, Debug Overlay & Fullscreen */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Universal Simulation Playback Controls */}
          <div className="flex items-center gap-1 bg-[#0d121a]/95 border border-slate-700/80 p-0.5 rounded shadow-sm">
            <button
              type="button"
              onClick={handleToggle}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                activeRunning
                  ? 'bg-emerald-950/80 border border-emerald-600/80 text-emerald-400 hover:bg-emerald-900/80'
                  : 'bg-amber-950/80 border border-amber-600/80 text-amber-400 animate-pulse hover:bg-amber-900/80'
              }`}
            >
              {activeRunning ? <Pause size={11} /> : <Play size={11} />}
              <span>{activeRunning ? 'PAUSE' : 'START'}</span>
            </button>

            <button
              type="button"
              onClick={handleStop}
              className="p-1 rounded text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Stop simulation"
            >
              <Square size={11} />
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-1 rounded text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              title="Reset simulation"
            >
              <RotateCcw size={11} />
            </button>
          </div>

          {overlayBadge}
          {headerControls}

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1 bg-[#161b22]/80 hover:bg-[#21262d] border border-[#30363d] rounded text-[#8b949e] hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Toggle Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Main Visual Render Area */}
      <div className="flex-1 w-full h-full relative">
        {renderVisual({
          containerWidth: dimensions.width,
          containerHeight: dimensions.height,
          inputs,
          outputs,
          animationParams: fallbackAnimParams,
          performanceMode: effectivePerformanceMode,
          reducedMotion: effectiveReducedMotion,
          isRunning: activeRunning,
          unitSystem,
          time: performance.now(),
          isMobile,
        })}
      </div>
    </div>
  );
};
