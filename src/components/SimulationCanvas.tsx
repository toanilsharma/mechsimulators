import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';

export type CoordinateSystemMode =
  | 'pixel' // (0,0) top-left in CSS pixels (retina scaled)
  | 'center' // (0,0) at canvas center, Cartesian coordinates (+y up)
  | 'aspect-fit'; // Maps a fixed virtual world (e.g. 1000x1000) uniformly into the viewport without stretching

export interface PhysicsWorldBounds {
  /** Virtual world width (default: 1000) */
  worldWidth?: number;
  /** Virtual world height (default: 1000) */
  worldHeight?: number;
  /** Whether the Y-axis points upward (true, standard physics/Cartesian) or downward (false, standard screen) */
  yAxisUp?: boolean;
}

export interface CanvasRenderContext {
  /** 2D rendering context with DPR and coordinate transforms pre-applied */
  ctx: CanvasRenderingContext2D;
  /** CSS pixel width of the container */
  width: number;
  /** CSS pixel height of the container */
  height: number;
  /** Physical backing buffer width (width * dpr) */
  bufferWidth: number;
  /** Physical backing buffer height (height * dpr) */
  bufferHeight: number;
  /** Current device pixel ratio */
  dpr: number;
  /** Center X coordinate in CSS pixels */
  centerX: number;
  /** Center Y coordinate in CSS pixels */
  centerY: number;
  /** Isotropic scale factor preserving aspect ratio without distortion */
  scale: number;
  /** Converts a screen coordinate (e.g. mouse event clientX/Y) to virtual physics world coordinates */
  screenToWorld: (screenX: number, screenY: number) => { x: number; y: number };
  /** Converts a virtual physics world coordinate to canvas screen pixels */
  worldToScreen: (worldX: number, worldY: number) => { x: number; y: number };
}

export interface SimulationCanvasProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onResize'> {
  /** Render callback called whenever the canvas redraws (or invoke manually via ref) */
  draw?: (context: CanvasRenderContext) => void;
  /** Coordinate system mapping mode (default: 'aspect-fit') */
  coordinateMode?: CoordinateSystemMode;
  /** Physics world dimensions if using 'aspect-fit' (default: 1000x1000, yAxisUp: true) */
  worldBounds?: PhysicsWorldBounds;
  /** Maximum device pixel ratio clamp to prevent mobile GPU throttling on 3x screens (default: 2) */
  maxDpr?: number;
  /** Callback fired whenever the container dimensions change */
  onResize?: (dimensions: { width: number; height: number; dpr: number }) => void;
  /** Optional overlay elements (like HUD gauges, badges, or controls) positioned on top of the canvas */
  children?: React.ReactNode;
  /** Custom canvas className */
  canvasClassName?: string;
}

export interface SimulationCanvasHandle {
  /** The underlying HTMLCanvasElement */
  canvas: HTMLCanvasElement | null;
  /** The 2D rendering context */
  context: CanvasRenderingContext2D | null;
  /** Trigger an immediate redraw */
  redraw: () => void;
  /** Current canvas CSS dimensions */
  getDimensions: () => { width: number; height: number; dpr: number };
  /** Convert screen coordinate to physics coordinate */
  screenToWorld: (screenX: number, screenY: number) => { x: number; y: number };
}

/**
 * SimulationCanvas
 *
 * High-performance, responsive HTML5 canvas wrapper engineered for physics simulations.
 * - Utilizes ResizeObserver to automatically fill parent container with zero 'dead space'.
 * - Dynamically updates internal backing buffer (canvas.width/height) to eliminate blurry Retina rendering.
 * - Prevents distortion/stretching: preserves 1:1 isotropic physics aspect ratio (circles stay circles).
 * - Exposes screen-to-world and world-to-screen coordinate transformers.
 */
export const SimulationCanvas = forwardRef<SimulationCanvasHandle, SimulationCanvasProps>(
  (
    {
      draw,
      coordinateMode = 'aspect-fit',
      worldBounds = { worldWidth: 1000, worldHeight: 1000, yAxisUp: true },
      maxDpr = 2,
      onResize,
      children,
      className = '',
      canvasClassName = '',
      style,
      ...divProps
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const [dimensions, setDimensions] = useState<{ width: number; height: number; dpr: number }>({
      width: 0,
      height: 0,
      dpr: 1,
    });

    const drawRef = useRef(draw);
    drawRef.current = draw;

    const { worldWidth = 1000, worldHeight = 1000, yAxisUp = true } = worldBounds;

    // Coordinate transformations
    const getTransformers = useCallback(
      (width: number, height: number) => {
        const centerX = width / 2;
        const centerY = height / 2;

        if (coordinateMode === 'aspect-fit') {
          // Compute uniform isotropic scale factor
          const scale = Math.min(width / worldWidth, height / worldHeight);

          const screenToWorld = (screenX: number, screenY: number) => {
            const dx = screenX - centerX;
            const dy = screenY - centerY;
            return {
              x: dx / scale,
              y: yAxisUp ? -dy / scale : dy / scale,
            };
          };

          const worldToScreen = (worldX: number, worldY: number) => {
            return {
              x: centerX + worldX * scale,
              y: yAxisUp ? centerY - worldY * scale : centerY + worldY * scale,
            };
          };

          return { scale, centerX, centerY, screenToWorld, worldToScreen };
        } else if (coordinateMode === 'center') {
          const screenToWorld = (screenX: number, screenY: number) => ({
            x: screenX - centerX,
            y: yAxisUp ? -(screenY - centerY) : screenY - centerY,
          });

          const worldToScreen = (worldX: number, worldY: number) => ({
            x: centerX + worldX,
            y: yAxisUp ? centerY - worldY : centerY + worldY,
          });

          return { scale: 1, centerX, centerY, screenToWorld, worldToScreen };
        } else {
          // Pixel mode
          const screenToWorld = (screenX: number, screenY: number) => ({
            x: screenX,
            y: screenY,
          });

          const worldToScreen = (worldX: number, worldY: number) => ({
            x: worldX,
            y: worldY,
          });

          return { scale: 1, centerX, centerY, screenToWorld, worldToScreen };
        }
      },
      [coordinateMode, worldWidth, worldHeight, yAxisUp]
    );

    // Redraw execution
    const renderFrame = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width, height, dpr } = dimensions;
      if (width === 0 || height === 0) return;

      const { scale, centerX, centerY, screenToWorld, worldToScreen } = getTransformers(
        width,
        height
      );

      ctx.save();
      // Reset transform & scale to physical device pixels
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (drawRef.current) {
        drawRef.current({
          ctx,
          width,
          height,
          bufferWidth: canvas.width,
          bufferHeight: canvas.height,
          dpr,
          centerX,
          centerY,
          scale,
          screenToWorld,
          worldToScreen,
        });
      }

      ctx.restore();
    }, [dimensions, getTransformers]);

    // Handle high-precision resize observer
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      let rafId: number | null = null;

      const observer = new ResizeObserver((entries) => {
        if (!entries || entries.length === 0) return;
        const entry = entries[0];

        // Read CSS pixel bounding box
        const contentRect = entry.contentRect;
        const newWidth = Math.floor(contentRect.width);
        const newHeight = Math.floor(contentRect.height);

        if (newWidth <= 0 || newHeight <= 0) return;

        // Debounce via requestAnimationFrame to avoid ResizeObserver loop limit warnings
        if (rafId) cancelAnimationFrame(rafId);

        rafId = requestAnimationFrame(() => {
          const deviceDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
          const clampedDpr = Math.min(deviceDpr, maxDpr);

          const canvas = canvasRef.current;
          if (canvas) {
            // Physical Backing Buffer dimensions (prevents pixelation)
            const nextBufferWidth = Math.floor(newWidth * clampedDpr);
            const nextBufferHeight = Math.floor(newHeight * clampedDpr);

            if (canvas.width !== nextBufferWidth || canvas.height !== nextBufferHeight) {
              canvas.width = nextBufferWidth;
              canvas.height = nextBufferHeight;
              canvas.style.width = `${newWidth}px`;
              canvas.style.height = `${newHeight}px`;
            }
          }

          setDimensions({ width: newWidth, height: newHeight, dpr: clampedDpr });

          if (onResize) {
            onResize({ width: newWidth, height: newHeight, dpr: clampedDpr });
          }
        });
      });

      observer.observe(container);

      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        observer.disconnect();
      };
    }, [maxDpr, onResize]);

    // Execute render whenever dimensions change
    useEffect(() => {
      renderFrame();
    }, [dimensions, renderFrame]);

    // Expose Imperative Handle for parent components
    useImperativeHandle(
      ref,
      () => {
        const { screenToWorld } = getTransformers(dimensions.width, dimensions.height);
        return {
          canvas: canvasRef.current,
          context: canvasRef.current ? canvasRef.current.getContext('2d') : null,
          redraw: renderFrame,
          getDimensions: () => dimensions,
          screenToWorld,
        };
      },
      [dimensions, getTransformers, renderFrame]
    );

    return (
      <div
        ref={containerRef}
        className={`relative w-full h-full min-h-[200px] overflow-hidden flex items-center justify-center select-none ${className}`}
        style={style}
        {...divProps}
      >
        {/* The underlying HTML5 Canvas */}
        <canvas
          ref={canvasRef}
          className={`block w-full h-full ${canvasClassName}`}
          style={{
            touchAction: 'none',
          }}
        />

        {/* Children Overlay Layer (HUD, controls, telemetry badges) */}
        {children && (
          <div className="absolute inset-0 pointer-events-none [&>*]:pointer-events-auto z-10">
            {children}
          </div>
        )}
      </div>
    );
  }
);

SimulationCanvas.displayName = 'SimulationCanvas';
