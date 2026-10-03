import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Maximize2, Minimize2, Activity, Info } from 'lucide-react';
import { SeverityLevel } from '../../types/common';

export interface SchematicCanvasProps {
  title?: string;
  subtitle?: string;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onReset?: () => void;
  status?: SeverityLevel;
  statusBadge?: React.ReactNode;
  children: React.ReactNode;
  aspectRatio?: string; // e.g. '16/9' or '4/3'
  overlayInfo?: string;
  className?: string;
}

export const SchematicCanvas: React.FC<SchematicCanvasProps> = ({
  title,
  subtitle,
  isPlaying,
  onTogglePlay,
  onReset,
  status,
  statusBadge,
  children,
  aspectRatio = '16/9',
  overlayInfo,
  className = '',
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const getBorderColor = () => {
    switch (status) {
      case 'critical':
        return 'border-[#f8514988]';
      case 'warning':
        return 'border-[#f27d2666]';
      case 'safe':
        return 'border-[#3fb95044]';
      default:
        return 'border-[#30363d]';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-sm bg-[#0a0a0b] border ${getBorderColor()} overflow-hidden flex flex-col transition-all shadow-lg ${
        isFullscreen ? 'p-4 bg-[#0a0a0b]' : ''
      } ${className}`}
    >
      {/* Schematic Header Bar */}
      {(title || onTogglePlay || onReset) && (
        <div className="flex items-center justify-between gap-2 p-2.5 sm:px-4 bg-[#161b22] border-b border-[#30363d] text-xs font-mono select-none">
          <div className="flex items-center gap-2 min-w-0">
            <Activity className="w-4 h-4 text-[#f27d26] shrink-0" />
            <div className="flex flex-col truncate">
              {title && (
                <span className="font-bold text-white uppercase tracking-wider truncate">
                  {title}
                </span>
              )}
              {subtitle && (
                <span className="text-[10px] text-[#8b949e] truncate font-sans">
                  {subtitle}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {statusBadge && <div className="mr-1">{statusBadge}</div>}

            {onTogglePlay && isPlaying !== undefined && (
              <button
                type="button"
                onClick={onTogglePlay}
                className="p-1.5 rounded-sm bg-[#0d1117] border border-[#30363d] hover:border-[#f27d26] text-[#d1d5db] hover:text-white transition-colors"
                title={isPlaying ? 'Pause Dynamic Physics' : 'Play Dynamic Physics'}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-[#f27d26]" />}
              </button>
            )}

            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="p-1.5 rounded-sm bg-[#0d1117] border border-[#30363d] hover:border-[#f27d26] text-[#8b949e] hover:text-white transition-colors"
                title="Reset animation state"
                aria-label="Reset"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-sm bg-[#0d1117] border border-[#30363d] hover:border-[#f27d26] text-[#8b949e] hover:text-white transition-colors hidden sm:flex"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Main Canvas / SVG Content Stage */}
      <div
        className="relative w-full flex items-center justify-center overflow-hidden bg-[#0d1117]"
        style={{ aspectRatio: isFullscreen ? 'auto' : aspectRatio }}
      >
        {children}

        {/* Optional floating informational overlay tag */}
        {overlayInfo && (
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-[#161b22]/90 border border-[#30363d] rounded-sm text-[10px] font-mono text-[#8b949e] backdrop-blur-sm pointer-events-none">
            {overlayInfo}
          </div>
        )}
      </div>
    </div>
  );
};
