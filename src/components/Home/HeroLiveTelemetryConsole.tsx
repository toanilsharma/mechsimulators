import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCw,
  Activity,
  Sliders,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Gauge,
  Wind,
  Droplets,
  Flame,
  Disc,
} from 'lucide-react';
import { SimulatorId } from '../../types/common';

interface HeroLiveTelemetryConsoleProps {
  onLaunchSimulator: (id: SimulatorId) => void;
}

type LiveAssetKey = 'pump' | 'compressor' | 'turbine' | 'gearbox';

interface LiveAssetConfig {
  id: SimulatorId;
  name: string;
  code: string;
  category: string;
  accentColor: string;
  badgeBg: string;
  badgeBorder: string;
  defaultRpm: number;
  minRpm: number;
  maxRpm: number;
  rpmUnit: string;
  primaryMetricName: string;
  calculateMetrics: (rpm: number) => {
    primaryValue: string;
    flowOrPower: string;
    status: string;
    statusLevel: 'safe' | 'warning' | 'optimal';
    efficiency: string;
  };
}

const ASSET_CONFIGS: Record<LiveAssetKey, LiveAssetConfig> = {
  pump: {
    id: 'pump',
    name: 'Centrifugal Pump (OH2)',
    code: 'API 610 / HI 9.6.1',
    category: 'Hydraulics',
    accentColor: '#06B6D4',
    badgeBg: 'bg-cyan-950/70',
    badgeBorder: 'border-cyan-500/40',
    defaultRpm: 1750,
    minRpm: 1200,
    maxRpm: 2400,
    rpmUnit: 'RPM',
    primaryMetricName: 'NPSH Margin (Δh)',
    calculateMetrics: (rpm: number) => {
      const ratio = rpm / 1750;
      const head = (48.3 * Math.pow(ratio, 2)).toFixed(1);
      const flow = (120 * ratio).toFixed(1);
      const npsha = 4.8;
      const npshr = 3.1 * Math.pow(ratio, 2);
      const margin = (npsha - npshr).toFixed(2);
      const isCav = npshr >= npsha - 0.3;
      return {
        primaryValue: `+${margin} m`,
        flowOrPower: `${flow} m³/h @ ${head}m`,
        status: isCav ? 'CAVITATION RISK' : 'STABLE FLUID FLOW',
        statusLevel: isCav ? 'warning' : 'safe',
        efficiency: `${Math.min(88, Math.max(68, 84 - Math.abs(ratio - 1) * 20)).toFixed(1)}%`,
      };
    },
  },
  compressor: {
    id: 'compressor',
    name: 'Centrifugal Compressor',
    code: 'API 617 / ASME PTC 10',
    category: 'Dynamic Gas',
    accentColor: '#F59E0B',
    badgeBg: 'bg-amber-950/70',
    badgeBorder: 'border-amber-500/40',
    defaultRpm: 10500,
    minRpm: 7500,
    maxRpm: 13000,
    rpmUnit: 'RPM',
    primaryMetricName: 'Surge Line Margin',
    calculateMetrics: (rpm: number) => {
      const ratio = rpm / 10500;
      const pr = (2.45 * Math.pow(ratio, 1.4)).toFixed(2);
      const margin = (18.5 - (ratio - 1) * 12).toFixed(1);
      const isSurge = parseFloat(margin) < 10.0;
      return {
        primaryValue: `+${margin}%`,
        flowOrPower: `PR ${pr}:1 • 14.2 kg/s`,
        status: isSurge ? 'APPROACHING SURGE' : 'OPTIMAL GAS STABILITY',
        statusLevel: isSurge ? 'warning' : 'optimal',
        efficiency: `${(83.2 - Math.abs(ratio - 1) * 10).toFixed(1)}%`,
      };
    },
  },
  turbine: {
    id: 'turbine',
    name: 'Multi-Stage Steam Turbine',
    code: 'API 612 / ASME PTC 6',
    category: 'Thermodynamics',
    accentColor: '#10B981',
    badgeBg: 'bg-emerald-950/70',
    badgeBorder: 'border-emerald-500/40',
    defaultRpm: 3600,
    minRpm: 2400,
    maxRpm: 4200,
    rpmUnit: 'RPM',
    primaryMetricName: 'Isentropic Enthalpy',
    calculateMetrics: (rpm: number) => {
      const ratio = rpm / 3600;
      const power = (4.85 * Math.pow(ratio, 2.2)).toFixed(2);
      const wetness = (7.8 * ratio).toFixed(1);
      const isHighWetness = parseFloat(wetness) > 11.5;
      return {
        primaryValue: `${(620 * ratio).toFixed(0)} kJ/kg`,
        flowOrPower: `${power} MW @ 3,600 RPM`,
        status: isHighWetness ? 'HIGH EXHAUST MOISTURE' : 'SUPERHEATED EXPANSION',
        statusLevel: isHighWetness ? 'warning' : 'safe',
        efficiency: `${(87.5 - Math.abs(ratio - 1) * 8).toFixed(1)}%`,
      };
    },
  },
  gearbox: {
    id: 'gearbox',
    name: 'Parallel Shaft Gearbox',
    code: 'AGMA 2001 / ISO 6336',
    category: 'Power Transmission',
    accentColor: '#8B5CF6',
    badgeBg: 'bg-purple-950/70',
    badgeBorder: 'border-purple-500/40',
    defaultRpm: 1450,
    minRpm: 900,
    maxRpm: 1800,
    rpmUnit: 'RPM',
    primaryMetricName: 'Contact Safety (SH)',
    calculateMetrics: (rpm: number) => {
      const ratio = rpm / 1450;
      const gmf = (1450 * 24 * ratio / 60).toFixed(0);
      const sf = (1.42 / Math.pow(ratio, 0.4)).toFixed(2);
      const isLowSf = parseFloat(sf) < 1.15;
      return {
        primaryValue: `SH = ${sf}`,
        flowOrPower: `GMF: ${gmf} Hz • 24T Pinion`,
        status: isLowSf ? 'ELEVATED CONTACT STRESS' : 'RATED AGMA TOOTH LIFE',
        statusLevel: isLowSf ? 'warning' : 'optimal',
        efficiency: '98.6%',
      };
    },
  },
};

export const HeroLiveTelemetryConsole: React.FC<HeroLiveTelemetryConsoleProps> = ({
  onLaunchSimulator,
}) => {
  const [activeAsset, setActiveAsset] = useState<LiveAssetKey>('pump');
  const [rpm, setRpm] = useState<number>(ASSET_CONFIGS.pump.defaultRpm);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const animRef = useRef<number | null>(null);

  const config = ASSET_CONFIGS[activeAsset];
  const metrics = config.calculateMetrics(rpm);

  // Sync RPM when changing asset
  const handleSelectAsset = (key: LiveAssetKey) => {
    setActiveAsset(key);
    setRpm(ASSET_CONFIGS[key].defaultRpm);
  };

  // Continuous smooth 60 FPS animation loop
  useEffect(() => {
    let lastTime = performance.now();
    const update = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      // Rotation speed proportional to normalized RPM
      const speedFactor = (rpm / config.defaultRpm) * 360 * 0.8;
      setRotationAngle((prev) => (prev + speedFactor * dt) % 360);
      animRef.current = requestAnimationFrame(update);
    };
    animRef.current = requestAnimationFrame(update);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [rpm, config.defaultRpm]);

  return (
    <div className="w-full rounded-2xl bg-[#070E1A] border border-cyan-500/30 shadow-2xl p-4 sm:p-5 flex flex-col justify-between overflow-hidden relative group backdrop-blur-md">
      {/* Background Subtle Radar/Grid Lines */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#38bdf8 1px, #070e1a 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Top Telemetry Header Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-mono font-bold text-slate-200 tracking-wider uppercase">
            LIVE KINEMATIC SOLVER
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
            FLOAT64 • 60 FPS
          </span>
        </div>

        {/* Machine Switcher Tabs */}
        <div className="flex items-center gap-1 bg-[#040812] p-1 rounded-xl border border-slate-800">
          {(['pump', 'compressor', 'turbine', 'gearbox'] as LiveAssetKey[]).map((key) => {
            const isSelected = activeAsset === key;
            const assetCfg = ASSET_CONFIGS[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectAsset(key)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {key}
              </button>
            );
          })}
        </div>
      </div>

      {/* Center Showcase: Animated Physics Cutaway Graphic */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center my-1">
        {/* Left Visual Area (Rotating Machinery Twin) */}
        <div className="sm:col-span-6 flex flex-col items-center justify-center p-3 rounded-xl bg-[#040812] border border-slate-800/80 relative overflow-hidden h-[180px]">
          {/* Machine Graphic SVG based on activeAsset */}
          <svg className="w-full h-full max-w-[210px]" viewBox="0 0 200 160" fill="none">
            {/* Coordinate Crosshairs */}
            <line x1="100" y1="10" x2="100" y2="150" stroke="#1E293B" strokeWidth="0.8" strokeDasharray="3 3" />
            <line x1="20" y1="80" x2="180" y2="80" stroke="#1E293B" strokeWidth="0.8" strokeDasharray="3 3" />

            {/* Stationary Casing Contour */}
            <circle cx="100" cy="80" r="62" stroke="#1E293B" strokeWidth="1.5" />
            <circle cx="100" cy="80" r="54" stroke="#0F172A" strokeWidth="1" strokeDasharray="4 2" />

            {/* Rotating Rotor / Impeller Element */}
            <g transform={`rotate(${rotationAngle} 100 80)`}>
              {/* Outer Ring */}
              <circle cx="100" cy="80" r="44" stroke={config.accentColor} strokeWidth="1.2" strokeOpacity="0.6" fill="none" />
              {/* Hub */}
              <circle cx="100" cy="80" r="14" fill="#0B1322" stroke={config.accentColor} strokeWidth="1.5" />
              <circle cx="100" cy="80" r="4" fill={config.accentColor} />

              {/* Impeller Blades / Rotor Arms */}
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <path
                  key={deg}
                  d="M 100 66 C 108 66 118 60 125 50"
                  transform={`rotate(${deg} 100 80)`}
                  stroke={config.accentColor}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  fill="none"
                />
              ))}

              {/* Dynamic Streamlines */}
              {[30, 90, 150, 210, 270, 330].map((deg) => (
                <circle
                  key={deg}
                  cx="128"
                  cy="70"
                  r="1.8"
                  transform={`rotate(${deg} 100 80)`}
                  fill={config.accentColor}
                  opacity="0.8"
                />
              ))}
            </g>

            {/* Flow Vector Arrow Tangents */}
            <path
              d="M 100 24 Q 136 28 160 52"
              stroke={config.accentColor}
              strokeWidth="1.2"
              strokeDasharray="4 2"
              fill="none"
              strokeOpacity="0.8"
            />
            <polygon points="162,50 162,56 156,54" fill={config.accentColor} />

            {/* In-situ Live RPM Overlay */}
            <text x="100" y="84" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="monospace">
              {rpm}
            </text>
          </svg>

          {/* Quick Status Pill Overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono px-2 py-0.5 rounded bg-[#070E1A]/90 border border-slate-800">
            <span className="text-slate-400">EFF: <strong className="text-white">{metrics.efficiency}</strong></span>
            <span
              className={`font-semibold ${
                metrics.statusLevel === 'warning' ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {metrics.status}
            </span>
          </div>
        </div>

        {/* Right Telemetry Readouts & Interactive Control */}
        <div className="sm:col-span-6 space-y-2.5">
          {/* Machine Header */}
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${config.badgeBg} ${config.badgeBorder} text-white`}>
                {config.code}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {config.category}
              </span>
            </div>
            <h3 className="text-base font-bold text-white font-sans mt-0.5 leading-snug">
              {config.name}
            </h3>
          </div>

          {/* Dynamic Metric Cards */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded-lg bg-[#040812] border border-slate-800">
              <span className="text-[10px] text-slate-400 block truncate">{config.primaryMetricName}</span>
              <span className="text-sm font-bold text-cyan-300 block mt-0.5">{metrics.primaryValue}</span>
            </div>
            <div className="p-2 rounded-lg bg-[#040812] border border-slate-800">
              <span className="text-[10px] text-slate-400 block truncate">Operational Output</span>
              <span className="text-xs font-bold text-slate-200 block mt-0.5 truncate">{metrics.flowOrPower}</span>
            </div>
          </div>

          {/* Real-time Shaft Speed Slider */}
          <div className="p-2 rounded-lg bg-[#040812] border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400 flex items-center gap-1">
                <Sliders size={12} className="text-cyan-400" />
                <span>Adjust Speed:</span>
              </span>
              <span className="font-bold text-cyan-300">
                {rpm.toLocaleString()} {config.rpmUnit}
              </span>
            </div>
            <input
              type="range"
              min={config.minRpm}
              max={config.maxRpm}
              step={25}
              value={rpm}
              onChange={(e) => setRpm(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
              <span>{config.minRpm} {config.rpmUnit}</span>
              <span>100% BEP</span>
              <span>{config.maxRpm} {config.rpmUnit}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Launch Bar */}
      <div className="relative z-10 pt-3 mt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
        <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
          Ready to experiment? Open complete transient mathematical solver:
        </span>
        <button
          type="button"
          onClick={() => onLaunchSimulator(config.id)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-md shadow-cyan-500/25 hover:from-cyan-400 hover:to-teal-300 transition-all cursor-pointer group/btn"
        >
          <span>Launch {config.name.split(' ')[0]} Twin</span>
          <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
