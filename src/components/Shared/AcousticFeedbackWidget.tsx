import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Radio, Sparkles } from 'lucide-react';
import { machineryAcoustics } from '../../utils/machineryAcoustics';

interface AcousticFeedbackWidgetProps {
  rpm?: number;
  cavitationIntensity?: number; // 0 to 1
  vibrationIntensity?: number;  // 0 to 1
  isSurging?: boolean;
}

export const AcousticFeedbackWidget: React.FC<AcousticFeedbackWidgetProps> = ({
  rpm = 1800,
  cavitationIntensity = 0,
  vibrationIntensity = 0.1,
  isSurging = false,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(machineryAcoustics.getIsMuted());
  const [volume, setVolume] = useState<number>(machineryAcoustics.getVolume());
  const [showSlider, setShowSlider] = useState<boolean>(false);

  // Synchronize dynamic simulator outputs to audio engine
  useEffect(() => {
    machineryAcoustics.updateState({
      rpm,
      cavitationIntensity,
      vibrationIntensity,
      isSurging,
    });
  }, [rpm, cavitationIntensity, vibrationIntensity, isSurging]);

  const handleToggle = () => {
    const nextMuted = machineryAcoustics.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    machineryAcoustics.setVolume(val);
    if (isMuted && val > 0) {
      machineryAcoustics.toggleMute();
      setIsMuted(false);
    }
  };

  // Determine acoustic state description
  const getSoundLabel = () => {
    if (isMuted) return 'Muted';
    if (cavitationIntensity > 0.4) return 'Vapor Cavitation Crackle';
    if (isSurging) return 'Surge Cycle Throbbing';
    if (vibrationIntensity > 0.5) return '1X Mechanical Unbalance';
    return `Shaft 1X Hum (${(rpm / 60).toFixed(0)} Hz)`;
  };

  return (
    <div
      id="acoustic-feedback-widget"
      className="relative flex items-center gap-1.5 bg-[#161b22] border border-[#30363d] px-2 py-1 rounded-sm text-xs font-mono select-none"
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      <button
        type="button"
        onClick={handleToggle}
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-sm transition-all ${
          !isMuted
            ? cavitationIntensity > 0.4
              ? 'bg-rose-950/80 border border-rose-500 text-rose-300 shadow-sm animate-pulse'
              : 'bg-[#10b981]/20 border border-[#10b981]/60 text-emerald-300 shadow-sm'
            : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
        }`}
        title="Synthesized acoustic audio feedback of machinery physics (Cavitation / Rotor Unbalance)"
      >
        {!isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        <span className="text-[11px] font-medium hidden sm:inline">
          {!isMuted ? 'Acoustic Audio: ON' : 'Acoustics: Muted'}
        </span>
      </button>

      {/* Mini Visualizer bars when active */}
      {!isMuted && (
        <div className="flex items-end gap-0.5 h-3.5 px-1">
          <span className="w-1 bg-[#10b981] rounded-xs animate-bounce" style={{ height: '40%', animationDuration: '300ms' }} />
          <span className="w-1 bg-cyan-400 rounded-xs animate-bounce" style={{ height: '80%', animationDuration: '220ms' }} />
          <span
            className={`w-1 rounded-xs animate-bounce ${cavitationIntensity > 0.3 ? 'bg-amber-400' : 'bg-emerald-400'}`}
            style={{ height: cavitationIntensity > 0.3 ? '100%' : '50%', animationDuration: '180ms' }}
          />
          <span
            className={`w-1 rounded-xs animate-bounce ${cavitationIntensity > 0.5 ? 'bg-rose-500' : 'bg-cyan-300'}`}
            style={{ height: cavitationIntensity > 0.5 ? '90%' : '30%', animationDuration: '260ms' }}
          />
        </div>
      )}

      {/* Acoustic State Badge */}
      <span className="text-[10px] text-[#8b949e] truncate max-w-[120px] hidden md:inline">
        {getSoundLabel()}
      </span>

      {/* Hover Volume Slider Popover */}
      {showSlider && (
        <div className="absolute top-full mt-1.5 left-0 z-50 bg-[#161b22] border border-[#30363d] p-2 rounded shadow-xl flex flex-col gap-1 w-44">
          <div className="flex justify-between text-[10px] text-[#8b949e]">
            <span>Acoustic Volume</span>
            <span className="text-white font-bold">{(volume * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={handleVolumeChange}
            className="w-full h-1.5 bg-[#0d1117] rounded accent-[#f27d26] cursor-pointer"
          />
          <div className="text-[9px] text-[#6e7681] pt-0.5 border-t border-[#21262d] mt-1">
            Physical synthesis: vapor collapse & 1X rotor frequency
          </div>
        </div>
      )}
    </div>
  );
};
