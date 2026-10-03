import React from 'react';
import { UnitSystem } from '../../types/common';

export type SimulatorType =
  | 'pump-cavitation'
  | 'compressor-surge'
  | 'bearing-fault'
  | 'rotor-unbalance'
  | 'pipe-stress'
  | 'seal-flush-plan'
  | 'alignment';

export interface SimulatorSchematicDiagramProps {
  simulatorType: SimulatorType;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  unitSystem?: UnitSystem;
  className?: string;
}

/**
 * High-clarity interactive SVG engineering schematic for simulator operating parameters
 * Illustrates physical dimensions, flow paths, forces, and dynamic operational states.
 */
export const SimulatorSchematicDiagram: React.FC<SimulatorSchematicDiagramProps> = ({
  simulatorType,
  inputs,
  outputs,
  unitSystem = 'metric',
  className = '',
}) => {
  switch (simulatorType) {
    case 'pump-cavitation':
      return <PumpCavitationSchematic inputs={inputs} outputs={outputs} unitSystem={unitSystem} className={className} />;
    case 'compressor-surge':
      return <CompressorSurgeSchematic inputs={inputs} outputs={outputs} unitSystem={unitSystem} className={className} />;
    case 'bearing-fault':
      return <BearingFaultSchematic inputs={inputs} outputs={outputs} unitSystem={unitSystem} className={className} />;
    case 'rotor-unbalance':
      return <RotorUnbalanceSchematic inputs={inputs} outputs={outputs} unitSystem={unitSystem} className={className} />;
    case 'pipe-stress':
      return <PipeStressSchematic inputs={inputs} outputs={outputs} unitSystem={unitSystem} className={className} />;
    case 'seal-flush-plan':
      return <SealFlushPlanSchematic inputs={inputs} outputs={outputs} unitSystem={unitSystem} className={className} />;
    case 'alignment':
      return <AlignmentSchematic inputs={inputs} outputs={outputs} unitSystem={unitSystem} className={className} />;
    default:
      return null;
  }
};

/* ==========================================================================
   1. PUMP CAVITATION SCHEMATIC
   ========================================================================== */
const PumpCavitationSchematic: React.FC<{
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  unitSystem: UnitSystem;
  className?: string;
}> = ({ inputs, outputs, className = '' }) => {
  const staticHead = inputs.staticSuctionHeadM ?? 2.5;
  const flowRate = inputs.flowRateM3H ?? 180;
  const tempC = inputs.liquidTemperatureC ?? 35;
  const isCavitating = outputs?.isCavitating ?? (outputs?.npshMarginM ?? 1.5) < 0.5;

  return (
    <div className={`w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-white select-none ${className}`}>
      <div className="flex items-center justify-between pb-1 mb-1 border-b border-[#30363d]/60 text-[9.5px] font-mono text-[#8b949e]">
        <span className="font-bold text-[#f27d26] uppercase">Hydraulic Suction Schematic</span>
        <span>Temp: <b className="text-white">{tempC}°C</b> • Q: <b className="text-white">{flowRate} m³/h</b></span>
      </div>

      <svg viewBox="0 0 320 85" className="w-full h-auto overflow-visible font-mono text-[8px]">
        <defs>
          <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1f6feb" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0d419d" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Suction Vessel Tank */}
        <rect x="15" y="15" width="55" height="58" rx="3" fill="#161b22" stroke="#58a6ff" strokeWidth="1.5" />
        {/* Liquid level */}
        <rect x="16" y="28" width="53" height="44" fill="url(#waterGrad)" />
        <line x1="16" y1="28" x2="69" y2="28" stroke="#58a6ff" strokeWidth="1.5" strokeDasharray="3,1" />
        <text x="42" y="42" fill="#c9d1d9" textAnchor="middle" fontWeight="bold">Tank</text>
        <text x="42" y="52" fill="#8b949e" textAnchor="middle">P_atm</text>

        {/* Static Head Dimension Line (zs) */}
        <line x1="75" y1="28" x2="75" y2="60" stroke="#d29922" strokeWidth="1" markerEnd="url(#arrow)" />
        <line x1="72" y1="28" x2="78" y2="28" stroke="#d29922" strokeWidth="1" />
        <line x1="72" y1="60" x2="78" y2="60" stroke="#d29922" strokeWidth="1" />
        <text x="80" y="46" fill="#d29922" fontWeight="bold">zs = {staticHead}m</text>

        {/* Suction Piping */}
        <path
          d="M 50 72 L 50 60 L 150 60 L 150 48 L 220 48"
          fill="none"
          stroke="#30363d"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 50 72 L 50 60 L 150 60 L 150 48 L 220 48"
          fill="none"
          stroke="#1f6feb"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Suction Strainer */}
        <rect x="110" y="54" width="16" height="12" rx="1" fill="#21262d" stroke="#f27d26" strokeWidth="1" />
        <text x="118" y="74" fill="#8b949e" textAnchor="middle">Strainer</text>

        {/* Flow direction arrow */}
        <path d="M 160 48 L 180 48" stroke="#ffffff" strokeWidth="1.5" markerEnd="url(#arrowWhite)" />
        <text x="170" y="42" fill="#58a6ff" textAnchor="middle">Flow Q</text>

        {/* Centrifugal Pump Casing & Impeller */}
        <circle cx="245" cy="48" r="22" fill="#161b22" stroke="#3fb950" strokeWidth="2" />
        <circle cx="245" cy="48" r="10" fill="#21262d" stroke="#3fb950" strokeWidth="1.5" strokeDasharray="2,2" />
        {/* Impeller eye */}
        <circle cx="245" cy="48" r="3" fill="#ffffff" />
        {/* Discharge nozzle */}
        <path d="M 245 26 L 245 10 L 260 10" fill="none" stroke="#30363d" strokeWidth="8" />
        <path d="M 245 26 L 245 10 L 260 10" fill="none" stroke="#1f6feb" strokeWidth="4" />

        {/* Impeller Eye Label */}
        <text x="245" y="78" fill="#3fb950" textAnchor="middle" fontWeight="bold">Impeller Eye</text>

        {/* Vapor Bubbles Animation if Cavitating */}
        {isCavitating ? (
          <g className="animate-pulse">
            <circle cx="238" cy="44" r="2.5" fill="#f85149" />
            <circle cx="242" cy="40" r="2" fill="#f85149" />
            <circle cx="248" cy="43" r="2.5" fill="#f85149" />
            <text x="285" y="44" fill="#f85149" fontWeight="bold">VAPOR FLASH!</text>
          </g>
        ) : (
          <text x="285" y="44" fill="#3fb950" fontWeight="bold">Laminar Inflow</text>
        )}
      </svg>
    </div>
  );
};

/* ==========================================================================
   2. ROTOR UNBALANCE SCHEMATIC
   ========================================================================== */
const RotorUnbalanceSchematic: React.FC<{
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  unitSystem: UnitSystem;
  className?: string;
}> = ({ inputs, outputs, className = '' }) => {
  const span = inputs.bearingSpanMm ?? 650;
  const overhang = inputs.overhungDistanceMm ?? 180;
  const unbalanceMass = inputs.unbalanceMassG ?? 12;
  const rpm = inputs.operatingSpeedRpm ?? 2950;
  const isHighVib = (outputs?.vibrationVelocityRmsMmS ?? 2.0) > 4.5;

  return (
    <div className={`w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-white select-none ${className}`}>
      <div className="flex items-center justify-between pb-1 mb-1 border-b border-[#30363d]/60 text-[9.5px] font-mono text-[#8b949e]">
        <span className="font-bold text-[#f27d26] uppercase">Rotor Dynamics Shaft Train</span>
        <span>Speed: <b className="text-white">{rpm} RPM</b> • Span L: <b className="text-white">{span} mm</b></span>
      </div>

      <svg viewBox="0 0 320 85" className="w-full h-auto overflow-visible font-mono text-[8px]">
        {/* Motor */}
        <rect x="15" y="25" width="45" height="35" rx="2" fill="#161b22" stroke="#8b949e" strokeWidth="1.5" />
        <text x="37" y="45" fill="#8b949e" textAnchor="middle" fontWeight="bold">Motor</text>

        {/* Flexible Coupling */}
        <rect x="62" y="37" width="8" height="12" fill="#d29922" stroke="#f27d26" strokeWidth="1" />
        <line x1="60" y1="43" x2="70" y2="43" stroke="#ffffff" strokeWidth="2" />

        {/* Rotor Shaft */}
        <rect x="70" y="40" width="195" height="6" fill="#8b949e" stroke="#30363d" />

        {/* Inboard Bearing 1 */}
        <polygon points="95,46 88,62 102,62" fill="#21262d" stroke="#58a6ff" strokeWidth="1.5" />
        <circle cx="95" cy="43" r="3" fill="#58a6ff" />
        <text x="95" y="72" fill="#58a6ff" textAnchor="middle">BRG #1</text>

        {/* Outboard Bearing 2 */}
        <polygon points="215,46 208,62 222,62" fill="#21262d" stroke="#58a6ff" strokeWidth="1.5" />
        <circle cx="215" cy="43" r="3" fill="#58a6ff" />
        <text x="215" y="72" fill="#58a6ff" textAnchor="middle">BRG #2</text>

        {/* Span Dimension (L) */}
        <line x1="95" y1="26" x2="215" y2="26" stroke="#58a6ff" strokeWidth="1" />
        <line x1="95" y1="22" x2="95" y2="30" stroke="#58a6ff" strokeWidth="1" />
        <line x1="215" y1="22" x2="215" y2="30" stroke="#58a6ff" strokeWidth="1" />
        <text x="155" y="22" fill="#58a6ff" textAnchor="middle">Span L = {span}mm</text>

        {/* Overhang Dimension (a) */}
        <line x1="215" y1="26" x2="265" y2="26" stroke="#d29922" strokeWidth="1" />
        <line x1="265" y1="22" x2="265" y2="30" stroke="#d29922" strokeWidth="1" />
        <text x="240" y="22" fill="#d29922" textAnchor="middle">a = {overhang}mm</text>

        {/* Rotor Disk */}
        <rect x="260" y="16" width="10" height="54" rx="2" fill="#21262d" stroke="#3fb950" strokeWidth="1.5" />
        <circle cx="265" cy="43" r="2" fill="#ffffff" />

        {/* Unbalance Mass (m_u) and Centrifugal Force Vector */}
        <circle cx="265" cy="22" r="4.5" fill="#f85149" stroke="#ffffff" strokeWidth="1" className="animate-pulse" />
        <text x="273" y="24" fill="#f85149" fontWeight="bold">mu={unbalanceMass}g</text>

        {/* Centrifugal Force Arrow */}
        <path d="M 265 20 L 265 8" stroke="#f85149" strokeWidth="2" markerEnd="url(#arrowRed)" />
        <text x="265" y="6" fill={isHighVib ? '#f85149' : '#d29922'} textAnchor="middle" fontWeight="bold">
          Fc = m·r·ω²
        </text>
      </svg>
    </div>
  );
};

/* ==========================================================================
   3. PIPE STRESS SCHEMATIC
   ========================================================================== */
const PipeStressSchematic: React.FC<{
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  unitSystem: UnitSystem;
  className?: string;
}> = ({ inputs, outputs, className = '' }) => {
  const straightLength = inputs.straightLengthM ?? 15;
  const loopWidth = inputs.loopWidthM ?? 3;
  const loopHeight = inputs.loopHeightM ?? 4;
  const tempC = inputs.operatingTempC ?? 180;
  const isHighStress = (outputs?.stressRatioPercent ?? 75) > 80;

  return (
    <div className={`w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-white select-none ${className}`}>
      <div className="flex items-center justify-between pb-1 mb-1 border-b border-[#30363d]/60 text-[9.5px] font-mono text-[#8b949e]">
        <span className="font-bold text-[#f27d26] uppercase">Thermal Expansion & U-Loop Layout</span>
        <span>Temp: <b className="text-white">{tempC}°C</b> • Run: <b className="text-white">{straightLength} m</b></span>
      </div>

      <svg viewBox="0 0 320 85" className="w-full h-auto overflow-visible font-mono text-[8px]">
        {/* Fixed Anchor 1 */}
        <rect x="15" y="48" width="12" height="24" fill="#21262d" stroke="#8b949e" strokeWidth="1.5" />
        <line x1="10" y1="72" x2="32" y2="72" stroke="#8b949e" strokeWidth="2" />
        <text x="21" y="81" fill="#8b949e" textAnchor="middle">Anchor</text>

        {/* Straight Run 1 */}
        <path
          d="M 27 60 L 110 60 L 110 25 L 170 25 L 170 60 L 260 60"
          fill="none"
          stroke="#30363d"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 27 60 L 110 60 L 110 25 L 170 25 L 170 60 L 260 60"
          fill="none"
          stroke={isHighStress ? '#f85149' : '#3fb950'}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Expansion U-Loop Labels */}
        <line x1="110" y1="18" x2="170" y2="18" stroke="#58a6ff" strokeWidth="1" />
        <text x="140" y="15" fill="#58a6ff" textAnchor="middle" fontWeight="bold">Loop W = {loopWidth}m</text>

        <line x1="178" y1="25" x2="178" y2="60" stroke="#d29922" strokeWidth="1" />
        <text x="195" y="44" fill="#d29922" fontWeight="bold">H = {loopHeight}m</text>

        {/* Thermal Expansion Direction Vector */}
        <path d="M 60 70 L 90 70" stroke="#f27d26" strokeWidth="1.5" markerEnd="url(#arrowOrange)" />
        <text x="75" y="79" fill="#f27d26" textAnchor="middle">ΔL = α·L·ΔT</text>

        {/* Equipment Nozzle Flange Anchor */}
        <rect x="260" y="52" width="10" height="16" fill="#161b22" stroke="#f27d26" strokeWidth="1.5" />
        <rect x="270" y="42" width="35" height="36" rx="2" fill="#161b22" stroke="#58a6ff" strokeWidth="1.5" />
        <text x="287" y="62" fill="#58a6ff" textAnchor="middle" fontWeight="bold">Pump</text>
        <text x="287" y="71" fill="#8b949e" textAnchor="middle">Nozzle</text>

        {/* Nozzle Reaction Force */}
        <path d="M 255 50 L 240 50" stroke="#f85149" strokeWidth="1.5" markerEnd="url(#arrowRed)" />
        <text x="245" y="44" fill="#f85149" textAnchor="middle" fontWeight="bold">F_nozzle</text>
      </svg>
    </div>
  );
};

/* ==========================================================================
   4. SEAL FLUSH PLAN SCHEMATIC
   ========================================================================== */
const SealFlushPlanSchematic: React.FC<{
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  unitSystem: UnitSystem;
  className?: string;
}> = ({ inputs, outputs, className = '' }) => {
  const planType = inputs.apiFlushPlan ?? 'Plan 11';
  const chamberTemp = outputs?.sealChamberOperatingTempC ?? inputs.processFluidTempC ?? 85;
  const filmGap = outputs?.tribology?.meanFilmThicknessUm ?? 1.2;
  const isVaporFlash = outputs?.tribology?.hasVaporFlash ?? false;

  return (
    <div className={`w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-white select-none ${className}`}>
      <div className="flex items-center justify-between pb-1 mb-1 border-b border-[#30363d]/60 text-[9.5px] font-mono text-[#8b949e]">
        <span className="font-bold text-[#f27d26] uppercase">API 682 Mechanical Seal Loop</span>
        <span>Config: <b className="text-[#58a6ff]">{planType}</b> • Box T: <b className="text-white">{chamberTemp.toFixed(0)}°C</b></span>
      </div>

      <svg viewBox="0 0 320 85" className="w-full h-auto overflow-visible font-mono text-[8px]">
        {/* Shaft */}
        <rect x="15" y="38" width="290" height="12" fill="#8b949e" stroke="#30363d" />

        {/* Seal Chamber Stuffing Box */}
        <rect x="80" y="16" width="130" height="56" rx="2" fill="#161b22" stroke="#58a6ff" strokeWidth="1.5" />
        <text x="145" y="24" fill="#8b949e" textAnchor="middle">Seal Chamber</text>

        {/* Stationary Mating Ring */}
        <rect x="130" y="26" width="8" height="36" fill="#21262d" stroke="#d29922" strokeWidth="1" />
        {/* Rotating Seal Face */}
        <rect x="142" y="26" width="8" height="36" fill="#21262d" stroke="#3fb950" strokeWidth="1" />

        {/* Microscopic Fluid Film Interface */}
        <line x1="139" y1="26" x2="139" y2="62" stroke="#58a6ff" strokeWidth="2" strokeDasharray="1,1" />
        <text x="139" y="70" fill="#58a6ff" textAnchor="middle" fontWeight="bold">h = {filmGap.toFixed(1)}µm</text>

        {/* Flush Piping Loop */}
        <path
          d="M 50 44 L 50 10 L 140 10 L 140 24"
          fill="none"
          stroke="#f27d26"
          strokeWidth="2"
          strokeDasharray="3,1"
        />
        <circle cx="95" cy="10" r="3" fill="#f27d26" />
        <text x="95" y="7" fill="#f27d26" textAnchor="middle" fontWeight="bold">{planType} Flush Port</text>

        {/* Secondary containment / Barrier reservoir if Plan 53 */}
        {planType.includes('53') && (
          <g>
            <rect x="230" y="12" width="30" height="28" rx="2" fill="#21262d" stroke="#3fb950" strokeWidth="1.5" />
            <text x="245" y="26" fill="#3fb950" textAnchor="middle">Barrier</text>
            <text x="245" y="34" fill="#8b949e" textAnchor="middle">P_barr &gt; P_box</text>
          </g>
        )}

        {/* Vapor Flash Status */}
        {isVaporFlash ? (
          <text x="250" y="65" fill="#f85149" fontWeight="bold" className="animate-pulse">
            ⚠️ VAPOR FLASHING!
          </text>
        ) : (
          <text x="250" y="65" fill="#3fb950" fontWeight="bold">
            ✓ Hydrodynamic Film
          </text>
        )}
      </svg>
    </div>
  );
};

/* ==========================================================================
   5. SHAFT ALIGNMENT SCHEMATIC
   ========================================================================== */
const AlignmentSchematic: React.FC<{
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  unitSystem: UnitSystem;
  className?: string;
}> = ({ inputs, outputs, className = '' }) => {
  const frontDistB = inputs.frontFootDistanceBMm ?? 280;
  const rearDistC = inputs.rearFootDistanceCMm ?? 650;
  const shimFront = outputs?.frontFootShimAdjustmentMm ?? 0.15;
  const shimRear = outputs?.rearFootShimAdjustmentMm ?? -0.22;
  const isCompliant = outputs?.api686HotRunningCompliant ?? true;

  return (
    <div className={`w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-white select-none ${className}`}>
      <div className="flex items-center justify-between pb-1 mb-1 border-b border-[#30363d]/60 text-[9.5px] font-mono text-[#8b949e]">
        <span className="font-bold text-[#f27d26] uppercase">Shaft Alignment & Foot Geometry</span>
        <span>B: <b className="text-white">{frontDistB} mm</b> • C: <b className="text-white">{rearDistC} mm</b></span>
      </div>

      <svg viewBox="0 0 320 85" className="w-full h-auto overflow-visible font-mono text-[8px]">
        {/* Stationary Machine (Driven Pump) */}
        <rect x="20" y="25" width="60" height="42" rx="2" fill="#161b22" stroke="#58a6ff" strokeWidth="1.5" />
        <text x="50" y="48" fill="#58a6ff" textAnchor="middle" fontWeight="bold">Driven (Pump)</text>
        <text x="50" y="57" fill="#8b949e" textAnchor="middle">Stationary</text>
        <rect x="80" y="42" width="25" height="8" fill="#8b949e" />

        {/* Flexible Coupling */}
        <rect x="105" y="32" width="12" height="28" rx="1" fill="#21262d" stroke="#f27d26" strokeWidth="1.5" />
        <line x1="111" y1="32" x2="111" y2="60" stroke="#f27d26" strokeWidth="1" strokeDasharray="2,2" />
        <text x="111" y="70" fill="#f27d26" textAnchor="middle">Coupling</text>

        {/* Movable Machine (Motor) Shaft */}
        <rect x="117" y="42" width="25" height="8" fill="#8b949e" />

        {/* Movable Machine Body */}
        <rect x="142" y="20" width="150" height="48" rx="2" fill="#161b22" stroke="#3fb950" strokeWidth="1.5" />
        <text x="217" y="36" fill="#3fb950" textAnchor="middle" fontWeight="bold">Driver Machine (Motor)</text>

        {/* Front Foot (Distance B from coupling) */}
        <polygon points="175,68 168,78 182,78" fill="#21262d" stroke="#d29922" strokeWidth="1.5" />
        <text x="175" y="65" fill="#d29922" textAnchor="middle" fontWeight="bold">Front Foot</text>
        <text x="175" y="85" fill={shimFront >= 0 ? '#3fb950' : '#f85149'} textAnchor="middle" fontWeight="bold">
          ΔS_F: {shimFront >= 0 ? `+${shimFront.toFixed(2)}` : shimFront.toFixed(2)}
        </text>

        {/* Rear Foot (Distance C from coupling) */}
        <polygon points="265,68 258,78 272,78" fill="#21262d" stroke="#d29922" strokeWidth="1.5" />
        <text x="265" y="65" fill="#d29922" textAnchor="middle" fontWeight="bold">Rear Foot</text>
        <text x="265" y="85" fill={shimRear >= 0 ? '#3fb950' : '#f85149'} textAnchor="middle" fontWeight="bold">
          ΔS_R: {shimRear >= 0 ? `+${shimRear.toFixed(2)}` : shimRear.toFixed(2)}
        </text>

        {/* Distances B & C Dimension Lines */}
        <line x1="111" y1="14" x2="175" y2="14" stroke="#58a6ff" strokeWidth="1" />
        <text x="143" y="11" fill="#58a6ff" textAnchor="middle">B = {frontDistB}mm</text>

        <line x1="111" y1="20" x2="265" y2="20" stroke="#3fb950" strokeWidth="1" />
        <text x="220" y="18" fill="#3fb950" textAnchor="middle">C = {rearDistC}mm</text>

        {/* API 686 Status indicator */}
        <circle cx="280" cy="30" r="4" fill={isCompliant ? '#3fb950' : '#f85149'} className="animate-pulse" />
      </svg>
    </div>
  );
};

/* ==========================================================================
   6. CENTRIFUGAL COMPRESSOR SURGE SCHEMATIC
   ========================================================================== */
const CompressorSurgeSchematic: React.FC<{
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  unitSystem?: UnitSystem;
  className?: string;
}> = ({ inputs, outputs, className = '' }) => {
  const p1 = inputs.suctionPressureBar ?? 3.5;
  const p2 = outputs?.dischargePressureBar ?? 8.8;
  const asvOpen = inputs.asvOpeningPercent ?? 0;
  const surgeMargin = outputs?.currentSurgeMarginPercent ?? 15.0;
  const isSurging = outputs?.operatingState === 'deep_surge' || outputs?.operatingState === 'incipient_surge';

  return (
    <div className={`p-2 bg-[#0d1117] rounded border border-[#30363d] ${className}`}>
      <div className="flex items-center justify-between text-[9px] font-mono text-[#8b949e] mb-1.5">
        <span className="font-semibold text-slate-300">API 617 / 670 COMPRESSOR & ANTI-SURGE LOOP</span>
        <span className={isSurging ? 'text-red-400 font-bold' : surgeMargin < 12 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
          SM: {surgeMargin.toFixed(1)}% | ASV: {asvOpen}%
        </span>
      </div>

      <svg viewBox="0 0 320 85" className="w-full h-auto overflow-visible font-mono text-[8px]">
        {/* Suction Pipe */}
        <path d="M 15 45 L 75 45" fill="none" stroke="#58a6ff" strokeWidth="4" />
        <polygon points="50,42 60,45 50,48" fill="#58a6ff" />
        <text x="35" y="38" fill="#58a6ff" textAnchor="middle">P1: {p1} bar</text>

        {/* Centrifugal Compressor Casing */}
        <polygon points="75,25 145,15 145,75 75,65" fill="#161b22" stroke={isSurging ? '#ef4444' : '#38bdf8'} strokeWidth="1.5" />
        <text x="110" y="44" fill="#38bdf8" textAnchor="middle" fontWeight="bold">Compressor</text>
        <text x="110" y="54" fill="#8b949e" textAnchor="middle">{inputs.speedRpm ?? 10500} RPM</text>

        {/* Discharge Pipe */}
        <path d="M 145 45 L 205 45 L 295 45" fill="none" stroke="#f27d26" strokeWidth="4" />
        <polygon points="240,42 250,45 240,48" fill="#f27d26" />
        <text x="270" y="38" fill="#f27d26" textAnchor="middle">P2: {p2.toFixed(1)} bar</text>

        {/* Anti-Surge Bypass Loop */}
        <path d="M 205 45 L 205 75 L 55 75 L 55 45" fill="none" stroke={asvOpen > 0 ? '#10b981' : '#475569'} strokeWidth="2" strokeDasharray={asvOpen > 0 ? '3 2' : 'none'} />
        
        {/* ASV Valve Symbol */}
        <polygon points="120,70 140,80 120,80" fill="#21262d" stroke={asvOpen > 0 ? '#10b981' : '#64748b'} strokeWidth="1" />
        <polygon points="140,70 120,70 140,80" fill="#21262d" stroke={asvOpen > 0 ? '#10b981' : '#64748b'} strokeWidth="1" />
        <text x="130" y="65" fill={asvOpen > 0 ? '#10b981' : '#8b949e'} textAnchor="middle" fontWeight="bold">
          ASV ({asvOpen}%)
        </text>

        {/* Status Indicator */}
        <circle cx="305" cy="45" r="4" fill={isSurging ? '#ef4444' : surgeMargin < 12 ? '#f59e0b' : '#10b981'} className="animate-pulse" />
      </svg>
    </div>
  );
};

/* ==========================================================================
   7. ROLLING ELEMENT BEARING FAULT SCHEMATIC
   ========================================================================== */
const BearingFaultSchematic: React.FC<{
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  unitSystem?: UnitSystem;
  className?: string;
}> = ({ inputs, outputs, className = '' }) => {
  const faultLoc = inputs.faultLocation ?? 'none';
  const sev = inputs.faultSeverityPercent ?? 0;
  const rpm = inputs.shaftSpeedRpm ?? 2980;
  const bpfo = outputs?.frequencies?.bpfoHz ?? 152;
  const bpfi = outputs?.frequencies?.bpfiHz ?? 245;
  const kappa = outputs?.lubricationKappaRatio ?? 1.2;
  const isDamaged = faultLoc !== 'none' && sev > 15;

  return (
    <div className={`p-2 bg-[#0d1117] rounded border border-[#30363d] ${className}`}>
      <div className="flex items-center justify-between text-[9px] font-mono text-[#8b949e] mb-1.5">
        <span className="font-semibold text-slate-300">ISO 15243 / HARRIS BEARING KINEMATICS</span>
        <span className={isDamaged ? 'text-red-400 font-bold' : kappa < 0.4 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
          FAULT: {faultLoc.toUpperCase()} | SEV: {sev}% | κ: {kappa}x
        </span>
      </div>

      <svg viewBox="0 0 320 85" className="w-full h-auto overflow-visible font-mono text-[8px]">
        {/* Outer Ring Cross-Section */}
        <rect x="25" y="10" width="100" height="14" fill="#161b22" stroke="#4b5563" strokeWidth="1.5" rx="1" />
        <rect x="25" y="60" width="100" height="14" fill="#161b22" stroke="#4b5563" strokeWidth="1.5" rx="1" />
        <text x="75" y="8" fill="#8b949e" textAnchor="middle">Outer Ring (Stationary)</text>

        {/* Outer Race Defect Marker */}
        {faultLoc === 'outer_race' && (
          <rect x="70" y="60" width="10" height="3" fill="#ef4444" />
        )}

        {/* Balls / Rolling Elements */}
        <circle cx="45" cy="42" r="10" fill="#9ca3af" stroke="#d1d5db" strokeWidth="1" />
        <circle cx="75" cy="42" r="10" fill={faultLoc === 'ball_spin' ? '#fca5a5' : '#9ca3af'} stroke={faultLoc === 'ball_spin' ? '#ef4444' : '#d1d5db'} strokeWidth={1} />
        <circle cx="105" cy="42" r="10" fill="#9ca3af" stroke="#d1d5db" strokeWidth="1" />

        {/* Inner Ring Cross-Section */}
        <rect x="25" y="27" width="100" height="8" fill="#1f2937" stroke="#38bdf8" strokeWidth="1" />
        <rect x="25" y="49" width="100" height="8" fill="#1f2937" stroke="#38bdf8" strokeWidth="1" />
        <text x="75" y="55" fill="#38bdf8" textAnchor="middle" fontWeight="bold">Shaft ({rpm} RPM)</text>

        {/* Inner Race Defect Marker */}
        {faultLoc === 'inner_race' && (
          <rect x="70" y="49" width="10" height="3" fill="#f59e0b" />
        )}

        {/* Kinematic Frequency Readout */}
        <rect x="145" y="10" width="165" height="64" fill="#161b22" stroke="#30363d" rx="2" />
        <text x="155" y="24" fill="#8b949e">1X Running Speed:</text>
        <text x="295" y="24" fill="#38bdf8" textAnchor="end">{(rpm / 60).toFixed(1)} Hz</text>

        <text x="155" y="38" fill={faultLoc === 'outer_race' ? '#ef4444' : '#8b949e'}>BPFO (Outer Raceway):</text>
        <text x="295" y="38" fill={faultLoc === 'outer_race' ? '#ef4444' : '#c9d1d9'} textAnchor="end">{bpfo} Hz</text>

        <text x="155" y="52" fill={faultLoc === 'inner_race' ? '#f59e0b' : '#8b949e'}>BPFI (Inner Raceway):</text>
        <text x="295" y="52" fill={faultLoc === 'inner_race' ? '#f59e0b' : '#c9d1d9'} textAnchor="end">{bpfi} Hz</text>

        <text x="155" y="66" fill="#8b949e">Lubricant Kappa (κ):</text>
        <text x="295" y="66" fill={kappa < 0.4 ? '#ef4444' : '#10b981'} textAnchor="end">{kappa}x</text>
      </svg>
    </div>
  );
};
