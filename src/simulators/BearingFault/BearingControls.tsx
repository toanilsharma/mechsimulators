import React from 'react';
import { BearingFaultInputs, BearingFaultLocation } from '../../types/bearing';
import { STANDARD_BEARINGS } from '../../utils/spectralCalculations';
import { Disc, Gauge, Thermometer, ShieldAlert, Cpu } from 'lucide-react';

interface BearingControlsProps {
  inputs: BearingFaultInputs;
  onChange: <K extends keyof BearingFaultInputs>(field: K, value: BearingFaultInputs[K]) => void;
}

const InputSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  title,
  icon,
  children,
}) => (
  <div className="border-b border-slate-800 pb-3 mb-3">
    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
      <span className="text-[#f27d26]">{icon}</span>
      <span>{title}</span>
    </div>
    <div className="space-y-2.5">{children}</div>
  </div>
);

export const BearingControls: React.FC<BearingControlsProps> = ({ inputs, onChange }) => {
  return (
    <div className="space-y-4 text-xs font-mono">
      {/* 1. Bearing Model & Kinematics */}
      <InputSection title="Bearing Model & Kinematics" icon={<Disc size={13} />}>
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Standard Bearing Assembly</label>
          <select
            value={inputs.bearingId}
            onChange={(e) => onChange('bearingId', e.target.value)}
            className="w-full bg-[#161b22] border border-[#30363d] text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-[#f27d26]"
          >
            {STANDARD_BEARINGS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Shaft Operating Speed</span>
            <span className="text-[#f27d26] font-bold">{inputs.shaftSpeedRpm.toLocaleString()} RPM</span>
          </div>
          <input
            type="range"
            min={300}
            max={6000}
            step={50}
            value={inputs.shaftSpeedRpm}
            onChange={(e) => onChange('shaftSpeedRpm', parseInt(e.target.value))}
            className="w-full accent-[#f27d26]"
          />
        </div>
      </InputSection>

      {/* 2. Fault Location & Spall Severity */}
      <InputSection title="Fault Location & Severity" icon={<ShieldAlert size={13} />}>
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Defect Location</label>
          <select
            value={inputs.faultLocation}
            onChange={(e) => onChange('faultLocation', e.target.value as BearingFaultLocation)}
            className="w-full bg-[#161b22] border border-[#30363d] text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-[#f27d26]"
          >
            <option value="none">None (Healthy Raceways & Rolling Elements)</option>
            <option value="outer_race">Outer Race Defect (BPFO - Stationary)</option>
            <option value="inner_race">Inner Race Spall (BPFI - ±1X Sidebands)</option>
            <option value="ball_spin">Rolling Element Ball Defect (2X BSF ± FTF)</option>
            <option value="cage">Cage Pocket Fracture (FTF Train)</option>
          </select>
        </div>

        <div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Fault Degradation Severity</span>
            <span className="text-red-400 font-bold">{inputs.faultSeverityPercent}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={inputs.faultSeverityPercent}
            onChange={(e) => onChange('faultSeverityPercent', parseInt(e.target.value))}
            className="w-full accent-red-500"
          />
          <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
            <span>Stage 1 (Incipient)</span>
            <span>Stage 2</span>
            <span>Stage 3</span>
            <span>Stage 4 (Terminal)</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Defect Physical Width</span>
            <span className="text-slate-200">{inputs.defectSizeMicrons} µm</span>
          </div>
          <input
            type="range"
            min={10}
            max={3000}
            step={20}
            value={inputs.defectSizeMicrons}
            onChange={(e) => onChange('defectSizeMicrons', parseInt(e.target.value))}
            className="w-full accent-slate-400"
          />
        </div>
      </InputSection>

      {/* 3. Applied Loads & Lubrication Condition */}
      <InputSection title="Operating Loads & Lubrication" icon={<Gauge size={13} />}>
        <div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Applied Radial Load (Fr)</span>
            <span className="text-sky-400 font-bold">{inputs.radialLoadKn.toFixed(1)} kN</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={25.0}
            step={0.5}
            value={inputs.radialLoadKn}
            onChange={(e) => onChange('radialLoadKn', parseFloat(e.target.value))}
            className="w-full accent-sky-400"
          />
        </div>

        <div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Applied Axial Thrust (Fa)</span>
            <span className="text-slate-200">{inputs.axialLoadKn.toFixed(1)} kN</span>
          </div>
          <input
            type="range"
            min={0.0}
            max={15.0}
            step={0.2}
            value={inputs.axialLoadKn}
            onChange={(e) => onChange('axialLoadKn', parseFloat(e.target.value))}
            className="w-full accent-slate-400"
          />
        </div>

        <div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Bearing Housing Temperature</span>
            <span className="text-amber-400 font-bold">{inputs.bearingTempC}°C</span>
          </div>
          <input
            type="range"
            min={20}
            max={120}
            step={1}
            value={inputs.bearingTempC}
            onChange={(e) => onChange('bearingTempC', parseInt(e.target.value))}
            className="w-full accent-amber-400"
          />
        </div>

        <div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Base Oil Viscosity (ISO VG @ 40°C)</span>
            <span className="text-slate-200">{inputs.oilViscosityCSt} cSt</span>
          </div>
          <select
            value={inputs.oilViscosityCSt}
            onChange={(e) => onChange('oilViscosityCSt', parseInt(e.target.value))}
            className="w-full bg-[#161b22] border border-[#30363d] text-slate-200 text-xs px-2 py-1 rounded focus:outline-none focus:border-[#f27d26]"
          >
            <option value={22}>ISO VG 22 (Light Spindle Oil)</option>
            <option value={32}>ISO VG 32 (Turbine / High Speed)</option>
            <option value={46}>ISO VG 46 (API 610 Pump Standard)</option>
            <option value={68}>ISO VG 68 (Medium Industrial)</option>
            <option value={100}>ISO VG 100 (Heavy Gear / Slow Speed)</option>
          </select>
        </div>
      </InputSection>
    </div>
  );
};
