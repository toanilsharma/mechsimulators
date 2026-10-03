import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  RotateCw,
  Layers,
  Eye,
  EyeOff,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { SimulatorId } from '../../types/common';
import { STANDARDS_SAFE_DISCLAIMER_SHORT } from '../../utils/standardsSafeHarbor';

interface KineticCutawayModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEquipment?: 'pump' | 'compressor' | 'journal' | 'seal' | 'gearbox';
}

export const KineticCutawayModal: React.FC<KineticCutawayModalProps> = ({
  isOpen,
  onClose,
  initialEquipment = 'pump',
}) => {
  const [selectedAsset, setSelectedAsset] = useState<'pump' | 'compressor' | 'journal' | 'seal' | 'gearbox'>(initialEquipment);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [cutawaySlice, setCutawaySlice] = useState<'quarter' | 'half' | 'transparent'>('half');

  // Layer Toggles
  const [showCasing, setShowCasing] = useState<boolean>(true);
  const [showFlowStreamlines, setShowFlowStreamlines] = useState<boolean>(true);
  const [showClearances, setShowClearances] = useState<boolean>(true);
  const [showThermalHeatmap, setShowThermalHeatmap] = useState<boolean>(false);

  // Animation Angle
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  useEffect(() => {
    setSelectedAsset(initialEquipment);
  }, [initialEquipment, isOpen]);

  useEffect(() => {
    if (!isPlaying) return;
    let animId: number;
    const update = () => {
      setRotationAngle((prev) => (prev + 1.2 * speedMultiplier) % 360);
      animId = requestAnimationFrame(update);
    };
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, speedMultiplier]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[94vh] rounded bg-[#161b22] border border-[#30363d] shadow-2xl flex flex-col overflow-hidden text-[#d1d5db]">
        {/* Header */}
        <div className="p-3 sm:p-4 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-cyan-950 border border-cyan-500/60 rounded flex items-center justify-center font-bold text-cyan-400 font-mono text-xs shadow-md shrink-0">
              <Layers size={17} />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                PILLAR 8 • KINETIC MACHINERY INTERNAL CUTAWAY INSPECTOR
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white font-mono flex items-center gap-2">
                Cross-Sectional Turbomachinery & Flow Vector Explorer
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] text-[#d1d5db] flex items-center justify-center transition-colors min-h-[40px] min-w-[40px]"
            aria-label="Close Cutaway Inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Equipment Selector Ribbon */}
        <div className="px-4 py-2 bg-[#161b22] border-b border-[#30363d] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
            {[
              { id: 'pump', label: 'Centrifugal Volute Pump' },
              { id: 'compressor', label: 'Multi-Stage Centrifugal Compressor' },
              { id: 'journal', label: 'Tilting-Pad Journal Bearing' },
              { id: 'seal', label: 'API 682 Dual Mechanical Seal' },
              { id: 'gearbox', label: 'Helical Speed Reducer' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedAsset(item.id as any);
                  setActiveHotspot(null);
                }}
                className={`px-3 py-1 text-xs font-mono rounded border transition-colors cursor-pointer whitespace-nowrap ${
                  selectedAsset === item.id
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Animation speed & play */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 bg-[#0d1117] border border-[#30363d] rounded text-white hover:bg-[#21262d] cursor-pointer"
              title={isPlaying ? 'Pause Rotation' : 'Start Rotation'}
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
            </button>
            <div className="flex items-center gap-1 text-xs font-mono text-[#8b949e]">
              <span>Speed:</span>
              {[0.5, 1.0, 2.0].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeedMultiplier(s)}
                  className={`px-1.5 py-0.5 rounded ${
                    speedMultiplier === s ? 'bg-cyan-700 text-white font-bold' : 'hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Canvas & Inspection Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Visual SVG Stage (3 cols) */}
          <div className="lg:col-span-3 bg-[#0a0d12] border border-[#30363d] rounded-lg p-4 flex flex-col justify-between relative overflow-hidden min-h-[380px]">
            {/* Cutaway Overlay Canvas */}
            <div className="w-full flex-1 flex items-center justify-center relative">
              <svg viewBox="0 0 650 360" className="w-full h-auto max-h-[360px] select-none">
                <defs>
                  {/* Fluid Flow Gradient: Blue to Orange */}
                  <linearGradient id="fluidGradient" x1="0%" y1="50%" x2="100%" y2="50%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0.9" />
                  </linearGradient>

                  {/* Thermal Heatmap Gradient */}
                  <linearGradient id="thermalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
                    <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
                  </linearGradient>

                  {/* Metallic Shaft Gradient */}
                  <linearGradient id="shaftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#64748b" />
                    <stop offset="50%" stopColor="#cbd5e1" />
                    <stop offset="100%" stopColor="#475569" />
                  </linearGradient>

                  {/* Casing Cross-Section Hatch */}
                  <pattern id="casingHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="8" stroke="#334155" strokeWidth="1.5" />
                  </pattern>
                </defs>

                {/* Grid guidelines */}
                <line x1="20" y1="180" x2="630" y2="180" stroke="#1e293b" strokeDasharray="4 4" />

                {/* Equipment Specific Vector Renderings */}
                {selectedAsset === 'pump' && (
                  <g id="pump-cutaway">
                    {/* Outer Casing (Upper Half Cutaway) */}
                    {showCasing && (
                      <path
                        d="M 120 180 L 120 70 Q 240 50 360 60 Q 480 70 520 180 L 490 180 Q 460 90 360 85 Q 240 80 150 95 L 150 180 Z"
                        fill={showThermalHeatmap ? 'url(#thermalGrad)' : 'url(#casingHatch)'}
                        stroke="#475569"
                        strokeWidth="2"
                        className="cursor-pointer"
                        onClick={() => setActiveHotspot('volute-casing')}
                      />
                    )}

                    {/* Lower Volute Section */}
                    {showCasing && (
                      <path
                        d="M 120 180 L 120 290 Q 240 310 360 300 Q 480 290 520 180 L 490 180 Q 460 270 360 275 Q 240 280 150 265 L 150 180 Z"
                        fill="url(#casingHatch)"
                        stroke="#475569"
                        strokeWidth="2"
                      />
                    )}

                    {/* Rotating Shaft */}
                    <rect x="50" y="165" width="550" height="30" fill="url(#shaftGrad)" stroke="#334155" rx="3" />

                    {/* Impeller Hub and Shroud */}
                    <g
                      transform={`rotate(${rotationAngle}, 320, 180)`}
                      className="cursor-pointer"
                      onClick={() => setActiveHotspot('impeller-eye')}
                    >
                      {/* Impeller Disc */}
                      <circle cx="320" cy="180" r="85" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                      {/* Vane Blades */}
                      {[0, 60, 120, 180, 240, 300].map((deg) => (
                        <path
                          key={deg}
                          d="M 320 180 Q 350 140 395 150"
                          transform={`rotate(${deg}, 320, 180)`}
                          fill="none"
                          stroke="#67e8f9"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                      ))}
                      <circle cx="320" cy="180" r="22" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
                    </g>

                    {/* Dynamic Fluid Streamlines */}
                    {showFlowStreamlines && (
                      <g>
                        <path
                          d="M 70 180 Q 200 180 280 170 Q 320 130 360 90"
                          fill="none"
                          stroke="url(#fluidGradient)"
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray="12 6"
                          strokeDashoffset={-rotationAngle * 2}
                        />
                        <path
                          d="M 70 180 Q 200 180 280 190 Q 320 230 360 270"
                          fill="none"
                          stroke="url(#fluidGradient)"
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray="12 6"
                          strokeDashoffset={-rotationAngle * 2}
                        />
                      </g>
                    )}

                    {/* Wear Ring Clearance Callouts */}
                    {showClearances && (
                      <g className="cursor-pointer" onClick={() => setActiveHotspot('wear-ring')}>
                        <rect x="250" y="110" width="15" height="6" fill="#f59e0b" />
                        <rect x="250" y="244" width="15" height="6" fill="#f59e0b" />
                        <line x1="257" y1="100" x2="257" y2="80" stroke="#f59e0b" strokeWidth="1.5" />
                        <text x="257" y="74" fill="#f59e0b" fontSize="9" textAnchor="middle" fontFamily="monospace">
                          0.25 mm Clearance
                        </text>
                      </g>
                    )}
                  </g>
                )}

                {/* Compressor Cutaway */}
                {selectedAsset === 'compressor' && (
                  <g id="compressor-cutaway">
                    {/* Casing Diaphragm */}
                    {showCasing && (
                      <path
                        d="M 100 180 L 100 60 L 520 60 L 520 180 L 490 180 L 490 85 L 130 85 L 130 180 Z"
                        fill="url(#casingHatch)"
                        stroke="#475569"
                        strokeWidth="2"
                      />
                    )}
                    {/* Shaft */}
                    <rect x="60" y="165" width="520" height="30" fill="url(#shaftGrad)" rx="3" />
                    {/* 3 Compressor Stages */}
                    {[180, 290, 400].map((stageX, idx) => (
                      <g
                        key={idx}
                        transform={`rotate(${rotationAngle}, ${stageX}, 180)`}
                        className="cursor-pointer"
                        onClick={() => setActiveHotspot('compressor-wheel')}
                      >
                        <circle cx={stageX} cy="180" r={65 - idx * 6} fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                        {[0, 72, 144, 216, 288].map((deg) => (
                          <line
                            key={deg}
                            x1={stageX}
                            y1="180"
                            x2={stageX + (60 - idx * 6)}
                            y2="180"
                            transform={`rotate(${deg}, ${stageX}, 180)`}
                            stroke="#38bdf8"
                            strokeWidth="3"
                          />
                        ))}
                      </g>
                    ))}
                    {/* Labyrinth Seals */}
                    {showClearances && (
                      <g className="cursor-pointer" onClick={() => setActiveHotspot('balance-drum')}>
                        <rect x="440" y="150" width="30" height="15" fill="#f59e0b" opacity="0.8" />
                        <text x="455" y="140" fill="#f59e0b" fontSize="9" textAnchor="middle" fontFamily="monospace">
                          Balance Drum Labys
                        </text>
                      </g>
                    )}
                  </g>
                )}

                {/* Journal Bearing */}
                {selectedAsset === 'journal' && (
                  <g id="journal-cutaway">
                    {/* Bearing Housing */}
                    <circle cx="325" cy="180" r="140" fill="url(#casingHatch)" stroke="#475569" strokeWidth="2" />
                    {/* 5 Rocker Tilting Pads */}
                    {[0, 72, 144, 216, 288].map((deg, i) => (
                      <path
                        key={i}
                        d="M 285 105 A 95 95 0 0 1 365 105 L 368 95 A 108 108 0 0 0 282 95 Z"
                        transform={`rotate(${deg}, 325, 180)`}
                        fill="#334155"
                        stroke="#cbd5e1"
                        strokeWidth="1.5"
                        className="cursor-pointer"
                        onClick={() => setActiveHotspot('tilting-pad')}
                      />
                    ))}
                    {/* Hydrodynamic Oil Wedge */}
                    {showFlowStreamlines && (
                      <circle
                        cx="327"
                        cy="177"
                        r="82"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="5"
                        strokeDasharray="8 4"
                        strokeDashoffset={-rotationAngle * 3}
                      />
                    )}
                    {/* Shaft Journal with orbit offset */}
                    <circle
                      cx="326"
                      cy="178"
                      r="80"
                      fill="url(#shaftGrad)"
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />
                    <circle
                      cx="326 + 15 * Math.cos(rotationAngle)"
                      cy="178 + 15 * Math.sin(rotationAngle)"
                      r="4"
                      fill="#ef4444"
                    />
                  </g>
                )}

                {/* Mechanical Seal */}
                {selectedAsset === 'seal' && (
                  <g id="seal-cutaway">
                    {/* Gland Plate & Seal Chamber */}
                    <rect x="150" y="80" width="350" height="200" fill="url(#casingHatch)" stroke="#475569" strokeWidth="2" />
                    <rect x="180" y="110" width="290" height="140" fill="#0f172a" stroke="#334155" />
                    {/* Shaft Sleeve */}
                    <rect x="100" y="165" width="450" height="30" fill="url(#shaftGrad)" />
                    {/* Rotating SiC Ring */}
                    <rect
                      x="310"
                      y="130"
                      width="18"
                      height="100"
                      fill="#1e293b"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      className="cursor-pointer"
                      onClick={() => setActiveHotspot('seal-faces')}
                    />
                    {/* Stationary Carbon Ring */}
                    <rect
                      x="330"
                      y="130"
                      width="18"
                      height="100"
                      fill="#334155"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      className="cursor-pointer"
                      onClick={() => setActiveHotspot('seal-faces')}
                    />
                    {/* Interface Film */}
                    {showClearances && (
                      <line x1="329" y1="125" x2="329" y2="235" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
                    )}
                    {/* Barrier Fluid Circulation */}
                    {showFlowStreamlines && (
                      <path
                        d="M 220 120 L 440 120 L 440 240 L 220 240 Z"
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="3"
                        strokeDasharray="6 4"
                        strokeDashoffset={-rotationAngle * 2}
                      />
                    )}
                  </g>
                )}

                {/* Gearbox Cutaway */}
                {selectedAsset === 'gearbox' && (
                  <g id="gearbox-cutaway">
                    {/* Gearbox Casing */}
                    <rect x="120" y="60" width="410" height="240" fill="url(#casingHatch)" stroke="#475569" strokeWidth="2" rx="8" />
                    <rect x="140" y="80" width="370" height="200" fill="#0f172a" stroke="#334155" />
                    {/* High-Speed Pinion (Top) */}
                    <g transform={`rotate(${rotationAngle * 3}, 260, 140)`} className="cursor-pointer" onClick={() => setActiveHotspot('gear-mesh')}>
                      <circle cx="260" cy="140" r="40" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                      {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => (
                        <line key={d} x1="260" y1="100" x2="260" y2="140" transform={`rotate(${d}, 260, 140)`} stroke="#38bdf8" strokeWidth="3" />
                      ))}
                    </g>
                    {/* Low-Speed Bull Gear (Bottom) */}
                    <g transform={`rotate(${-rotationAngle}, 360, 210)`} className="cursor-pointer" onClick={() => setActiveHotspot('gear-mesh')}>
                      <circle cx="360" cy="210" r="70" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((d) => (
                        <line key={d} x1="360" y1="140" x2="360" y2="210" transform={`rotate(${d}, 360, 210)`} stroke="#f59e0b" strokeWidth="3" />
                      ))}
                    </g>
                    {/* Pitch Line Mesh Point */}
                    <circle cx="310" cy="175" r="5" fill="#ef4444" />
                  </g>
                )}
              </svg>
            </div>

            {/* Bottom Status bar */}
            <div className="flex items-center justify-between text-xs font-mono text-[#8b949e] pt-2 border-t border-[#30363d]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full inline-block" />
                  <span>Interactive Cutaway Slice: {cutawaySlice.toUpperCase()}</span>
                </span>
                <span className="text-white">RPM Sync: {Math.round(rotationAngle * 10)} deg/sec</span>
              </div>
              <span className="text-amber-400">Click any component to inspect telemetry</span>
            </div>
          </div>

          {/* Right Inspector & Telemetry Column (1 col) */}
          <div className="space-y-4">
            {/* Layer Controls Panel */}
            <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded font-mono text-xs space-y-2.5">
              <div className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#30363d] pb-1.5 flex items-center gap-1.5">
                <Layers size={13} className="text-cyan-400" />
                <span>Cutaway Layers</span>
              </div>

              <div className="space-y-1.5">
                <button
                  onClick={() => setShowCasing(!showCasing)}
                  className="w-full flex items-center justify-between p-1.5 rounded hover:bg-[#161b22] text-[#d1d5db] cursor-pointer"
                >
                  <span>Pressure Casing</span>
                  {showCasing ? <Eye size={13} className="text-cyan-400" /> : <EyeOff size={13} className="text-[#6e7681]" />}
                </button>

                <button
                  onClick={() => setShowFlowStreamlines(!showFlowStreamlines)}
                  className="w-full flex items-center justify-between p-1.5 rounded hover:bg-[#161b22] text-[#d1d5db] cursor-pointer"
                >
                  <span>Fluid Flow Vectors</span>
                  {showFlowStreamlines ? <Eye size={13} className="text-emerald-400" /> : <EyeOff size={13} className="text-[#6e7681]" />}
                </button>

                <button
                  onClick={() => setShowClearances(!showClearances)}
                  className="w-full flex items-center justify-between p-1.5 rounded hover:bg-[#161b22] text-[#d1d5db] cursor-pointer"
                >
                  <span>Critical Clearances</span>
                  {showClearances ? <Eye size={13} className="text-amber-400" /> : <EyeOff size={13} className="text-[#6e7681]" />}
                </button>

                <button
                  onClick={() => setShowThermalHeatmap(!showThermalHeatmap)}
                  className="w-full flex items-center justify-between p-1.5 rounded hover:bg-[#161b22] text-[#d1d5db] cursor-pointer"
                >
                  <span>Thermal Gradient</span>
                  {showThermalHeatmap ? <Eye size={13} className="text-rose-400" /> : <EyeOff size={13} className="text-[#6e7681]" />}
                </button>
              </div>
            </div>

            {/* Hotspot Telemetry Card */}
            <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded font-mono text-xs space-y-2">
              <div className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#30363d] pb-1.5 flex items-center gap-1.5">
                <Info size={13} className="text-amber-400" />
                <span>Internal Telemetry</span>
              </div>

              {activeHotspot === 'wear-ring' && (
                <div className="space-y-1.5 text-[11px]">
                  <div className="text-amber-400 font-bold">Impeller Front Wear Ring</div>
                  <div className="text-[#8b949e]">Diametral Clearance: 0.25 mm (API 610 ref)</div>
                  <div className="text-[#8b949e]">Internal Leakage Flow: 1.8 m³/h bypass</div>
                  <div className="text-emerald-400">Status: Nominal (Within wear limit)</div>
                </div>
              )}

              {activeHotspot === 'volute-casing' && (
                <div className="space-y-1.5 text-[11px]">
                  <div className="text-cyan-400 font-bold">Volute Cutwater & Diffuser</div>
                  <div className="text-[#8b949e]">Pressure Recovery: 78% static head</div>
                  <div className="text-[#8b949e]">Radial Thrust: 1,420 N @ BEP</div>
                  <div className="text-emerald-400">Double volute balance confirmed</div>
                </div>
              )}

              {activeHotspot === 'seal-faces' && (
                <div className="space-y-1.5 text-[11px]">
                  <div className="text-cyan-400 font-bold">SiC vs Carbon Seal Interface</div>
                  <div className="text-[#8b949e]">Interface Film: 0.85 µm fluid barrier</div>
                  <div className="text-[#8b949e]">PV Factor: 18.5 MPa·m/s</div>
                  <div className="text-emerald-400">Zero dry running risk detected</div>
                </div>
              )}

              {activeHotspot === 'gear-mesh' && (
                <div className="space-y-1.5 text-[11px]">
                  <div className="text-amber-400 font-bold">Pitch Line Gear Mesh Zone</div>
                  <div className="text-[#8b949e]">Pitch Line Velocity: 18.4 m/s</div>
                  <div className="text-[#8b949e]">EHL Oil Film Ratio (λ): 2.4 (Full fluid film)</div>
                  <div className="text-emerald-400">Scuffing risk: Negligible</div>
                </div>
              )}

              {(!activeHotspot || activeHotspot === 'impeller-eye' || activeHotspot === 'compressor-wheel' || activeHotspot === 'tilting-pad' || activeHotspot === 'balance-drum') && (
                <div className="space-y-1.5 text-[11px] text-[#8b949e]">
                  <div>Rotating Component: {selectedAsset.toUpperCase()} CORE</div>
                  <div>Kinetic Velocity: {(rotationAngle * 0.12).toFixed(1)} m/s peripheral</div>
                  <div>Hover or click highlighted elements in the cutaway to inspect precision clearances.</div>
                </div>
              )}
            </div>

            {/* Quick Benchmark Safe Harbor */}
            <div className="p-2.5 bg-[#080b10] border border-[#30363d] rounded text-[10px] text-[#8b949e] font-mono leading-relaxed">
              <span className="text-amber-400 font-bold mr-1">Industry Reference Benchmark:</span>
              {STANDARDS_SAFE_DISCLAIMER_SHORT} Kinematics and geometric sectionals based on academic textbook turbomachinery cutaway schematics.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
