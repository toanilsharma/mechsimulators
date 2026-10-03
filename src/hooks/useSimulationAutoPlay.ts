import { useState, useEffect, useRef, useCallback } from 'react';

export interface SimulationFrameContext {
  /** High-resolution timestamp from performance.now() in milliseconds */
  timestamp: number;
  /** Delta time elapsed since the previous frame in seconds (clamped to maxDeltaTime) */
  deltaTime: number;
  /** Total elapsed simulation time in seconds */
  elapsedTime: number;
  /** Monotonically increasing frame index */
  frameIndex: number;
  /** Smoothed instantaneous frames per second */
  fps: number;
}

export interface UseSimulationAutoPlayOptions {
  /** Callback fired on every physics tick/animation frame */
  onTick?: (context: SimulationFrameContext) => void;
  /** Optional target frame rate (e.g. 60 or 30). Set to 0 or undefined for native VSync (uncapped) */
  targetFps?: number;
  /** Maximum allowable delta time per frame in seconds to prevent physics tunneling after background tab pauses (default: 0.1s) */
  maxDeltaTime?: number;
  /** Force pause on mount regardless of motion preference (default: false) */
  initialPaused?: boolean;
}

export interface UseSimulationAutoPlayReturn {
  /** Whether the simulation loop is currently executing */
  isPlaying: boolean;
  /** Whether the user has system-level prefers-reduced-motion enabled */
  isReducedMotion: boolean;
  /** Smoothed instantaneous frame rate */
  fps: number;
  /** Total accumulated simulation time in seconds */
  elapsedTime: number;
  /** Start or resume the simulation loop */
  play: () => void;
  /** Pause the simulation loop */
  pause: () => void;
  /** Toggle between playing and paused */
  togglePlay: () => void;
  /** Advance physics engine by a discrete step duration (default: 1/60s) while paused */
  step: (stepDurationSeconds?: number) => void;
  /** Reset simulation time and frame counters */
  reset: () => void;
}

/**
 * useSimulationAutoPlay
 *
 * Production-ready hook for high-performance physics engines on <canvas> or <svg>.
 * - Automatically starts on mount.
 * - Detects `prefers-reduced-motion: reduce` and defaults to a paused state with static frame.
 * - Automatically manages requestAnimationFrame lifecycle, delta-time clamping, and cleanup.
 */
export function useSimulationAutoPlay(
  options: UseSimulationAutoPlayOptions = {}
): UseSimulationAutoPlayReturn {
  const { onTick, targetFps = 0, maxDeltaTime = 0.1, initialPaused = false } = options;

  // Track prefers-reduced-motion media query
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // State: Default to playing UNLESS user requested reduced motion or explicitly set initialPaused
  const [isPlaying, setIsPlaying] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return !reduced && !initialPaused;
  });

  const [fps, setFps] = useState<number>(60);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  // Mutable refs for high-frequency render loop without React re-render overhead
  const isPlayingRef = useRef<boolean>(isPlaying);
  isPlayingRef.current = isPlaying;

  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const totalElapsedRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsWindowRef = useRef<{ lastSampleTime: number; frames: number }>({
    lastSampleTime: 0,
    frames: 0,
  });

  // 1. Listen for system-level prefers-reduced-motion changes dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleMotionPreferenceChange = (e: MediaQueryListEvent) => {
      const reduced = e.matches;
      setIsReducedMotion(reduced);
      if (reduced) {
        setIsPlaying(false);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMotionPreferenceChange);
    } else {
      // Legacy Safari / Older Browsers fallback
      mediaQuery.addListener(handleMotionPreferenceChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMotionPreferenceChange);
      } else {
        mediaQuery.removeListener(handleMotionPreferenceChange);
      }
    };
  }, []);

  // 2. Main Physics / Animation Frame Loop
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const minFrameInterval = targetFps > 0 ? 1000 / targetFps : 0;

    const loop = (now: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = now;
        fpsWindowRef.current.lastSampleTime = now;
      }

      const elapsedSinceLastFrame = now - lastTimeRef.current;

      // Frame rate throttling (if targetFps is specified)
      if (minFrameInterval > 0 && elapsedSinceLastFrame < minFrameInterval) {
        rafIdRef.current = requestAnimationFrame(loop);
        return;
      }

      // Compute & clamp delta time (seconds) to prevent numerical explosions when tab was backgrounded
      const rawDt = elapsedSinceLastFrame / 1000;
      const dt = Math.min(Math.max(rawDt, 0.0001), maxDeltaTime);
      lastTimeRef.current = now;

      if (isPlayingRef.current) {
        totalElapsedRef.current += dt;
        frameCountRef.current += 1;

        // Calculate smoothed FPS every 500ms
        fpsWindowRef.current.frames += 1;
        const timeSinceSample = now - fpsWindowRef.current.lastSampleTime;
        if (timeSinceSample >= 500) {
          const calculatedFps = Math.round(
            (fpsWindowRef.current.frames * 1000) / timeSinceSample
          );
          setFps(calculatedFps);
          setElapsedTime(totalElapsedRef.current);
          fpsWindowRef.current.frames = 0;
          fpsWindowRef.current.lastSampleTime = now;
        }

        // Fire user physics callback
        if (onTickRef.current) {
          onTickRef.current({
            timestamp: now,
            deltaTime: dt,
            elapsedTime: totalElapsedRef.current,
            frameIndex: frameCountRef.current,
            fps,
          });
        }
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [targetFps, maxDeltaTime]);

  // 3. User Controls
  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const togglePlay = useCallback(() => setIsPlaying((prev) => !prev), []);

  const step = useCallback(
    (stepDurationSeconds: number = 1 / 60) => {
      setIsPlaying(false);
      totalElapsedRef.current += stepDurationSeconds;
      frameCountRef.current += 1;
      setElapsedTime(totalElapsedRef.current);

      if (onTickRef.current) {
        onTickRef.current({
          timestamp: performance.now(),
          deltaTime: stepDurationSeconds,
          elapsedTime: totalElapsedRef.current,
          frameIndex: frameCountRef.current,
          fps: 60,
        });
      }
    },
    []
  );

  const reset = useCallback(() => {
    totalElapsedRef.current = 0;
    frameCountRef.current = 0;
    lastTimeRef.current = 0;
    setElapsedTime(0);
  }, []);

  return {
    isPlaying,
    isReducedMotion,
    fps,
    elapsedTime,
    play,
    pause,
    togglePlay,
    step,
    reset,
  };
}
