import React from 'react';
import { JournalBearingInputs, JournalBearingType, OilIsoGrade } from '../../types/journalBearing';
import { Settings, Gauge, Activity, Droplets, RotateCw } from 'lucide-react';

interface JournalControlsProps {
  inputs: JournalBearingInputs;
  onChange: <K extends keyof JournalBearingInputs>(field: K, val: JournalBearingInputs[K]) => void;
}

export const JournalControls: React.FC<JournalControlsProps> = ({
  inputs,
  onChange,
}) => {
  return (
    <div className="flex flex-col gap-4 p-3 bg-[#0d1117] text-slate-200">
      {/* 1. BEARING DESIGN & GEOMETRY */}
      <div className="flex flex-col gap-2.5 p-3 rounded-lg bg-[#161b22] border border-[#30363d]">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
          <Settings className="w-3.5 h-3.5" />
          Bearing Design & Clearance
        </div>

        {/* Bearing Type Selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-mono text-slate-400">Bearing Geometry / Type</label>
          <select
            value={inputs.bearingType}
            onChange={(e) => onChange('bearingType', e.target.value as JournalBearingType)}
            className="bg-[#0b0f17] border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="plain_cylindrical">Plain Cylindrical Sleeve (360° Bore)</option>
            <option value="axial_groove">Axial Two-Groove Sleeve (Split Bore)</option>
            <option value="pressure_dam">Pressure Dam Sleeve (Anti-Whirl Step)</option>
            <option value="tilt_pad_4pad_lop">4-Pad Tilting Pad (Load-On-Pad)</option>
            <option value="tilt_pad_5pad_lbp">5-Pad Tilting Pad (Load-Between-Pad)</option>
          </select>
        </div>

        {/* Journal Diameter */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Journal Diameter (D):</span>
            <span className="text-cyan-400 font-bold">{inputs.journalDiameterMm} mm</span>
          </div>
          <input
            type="range"
            min="50"
            max="250"
            step="5"
            value={inputs.journalDiameterMm}
            onChange={(e) => onChange('journalDiameterMm', Number(e.target.value))}
            className="accent-cyan-500 cursor-pointer h-1.5 bg-slate-700 rounded"
          />
        </div>

        {/* Bearing Length */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Bearing Length (L):</span>
            <span className="text-cyan-400 font-bold">
              {inputs.bearingLengthMm} mm (L/D = {(inputs.bearingLengthMm / inputs.journalDiameterMm).toFixed(2)})
            </span>
          </div>
          <input
            type="range"
            min="25"
            max="200"
            step="5"
            value={inputs.bearingLengthMm}
            onChange={(e) => onChange('bearingLengthMm', Number(e.target.value))}
            className="accent-cyan-500 cursor-pointer h-1.5 bg-slate-700 rounded"
          />
        </div>

        {/* Radial Clearance */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Radial Clearance (c):</span>
            <span className="text-cyan-400 font-bold">
              {inputs.radialClearanceUm} µm (ψ = {((inputs.radialClearanceUm / (inputs.journalDiameterMm * 500)) * 1000).toFixed(2)}‰)
            </span>
          </div>
          <input
            type="range"
            min="25"
            max="220"
            step="5"
            value={inputs.radialClearanceUm}
            onChange={(e) => onChange('radialClearanceUm', Number(e.target.value))}
            className="accent-cyan-500 cursor-pointer h-1.5 bg-slate-700 rounded"
          />
        </div>
      </div>

      {/* 2. ROTOR DYNAMICS & SPEED */}
      <div className="flex flex-col gap-2.5 p-3 rounded-lg bg-[#161b22] border border-[#30363d]">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
          <RotateCw className="w-3.5 h-3.5" />
          Shaft Speed & Rotor Dynamics
        </div>

        {/* Shaft Operating Speed */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Shaft Speed (N):</span>
            <span className="text-amber-400 font-bold">
              {inputs.shaftSpeedRpm.toLocaleString()} RPM ({(inputs.shaftSpeedRpm / 60).toFixed(1)} Hz)
            </span>
          </div>
          <input
            type="range"
            min="800"
            max="14000"
            step="100"
            value={inputs.shaftSpeedRpm}
            onChange={(e) => onChange('shaftSpeedRpm', Number(e.target.value))}
            className="accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded"
          />
        </div>

        {/* Rotor 1st Critical Speed */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Rotor 1st Critical Speed (N_cr1):</span>
            <span className="text-amber-400 font-bold">
              {inputs.rotorFirstCriticalSpeedRpm.toLocaleString()} RPM (Oil Whip &gt; 2X)
            </span>
          </div>
          <input
            type="range"
            min="1200"
            max="6500"
            step="100"
            value={inputs.rotorFirstCriticalSpeedRpm}
            onChange={(e) => onChange('rotorFirstCriticalSpeedRpm', Number(e.target.value))}
            className="accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded"
          />
        </div>

        {/* Residual Unbalance */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Residual Unbalance:</span>
            <span className="text-amber-400 font-bold">{inputs.unbalanceGmm} g·mm (1X Orbit)</span>
          </div>
          <input
            type="range"
            min="5"
            max="300"
            step="5"
            value={inputs.unbalanceGmm}
            onChange={(e) => onChange('unbalanceGmm', Number(e.target.value))}
            className="accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded"
          />
        </div>
      </div>

      {/* 3. STATIC LOAD & LUBRICANT */}
      <div className="flex flex-col gap-2.5 p-3 rounded-lg bg-[#161b22] border border-[#30363d]">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
          <Droplets className="w-3.5 h-3.5" />
          Static Load & Lube Oil Properties
        </div>

        {/* Static Radial Load */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Static Radial Load (W):</span>
            <span className="text-emerald-400 font-bold">{inputs.staticRadialLoadKn} kN</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="50.0"
            step="0.5"
            value={inputs.staticRadialLoadKn}
            onChange={(e) => onChange('staticRadialLoadKn', Number(e.target.value))}
            className="accent-emerald-500 cursor-pointer h-1.5 bg-slate-700 rounded"
          />
        </div>

        {/* Oil ISO Viscosity Grade */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-mono text-slate-400">Lubricating Oil Grade</label>
          <select
            value={inputs.oilGrade}
            onChange={(e) => onChange('oilGrade', e.target.value as OilIsoGrade)}
            className="bg-[#0b0f17] border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ISO_VG_32">ISO VG 32 (Turbine Light Oil)</option>
            <option value="ISO_VG_46">ISO VG 46 (API 610/617 Standard)</option>
            <option value="ISO_VG_68">ISO VG 68 (Heavy Duty Industrial)</option>
          </select>
        </div>

        {/* Oil Supply Temperature */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Oil Supply Temp:</span>
            <span className="text-emerald-400 font-bold">{inputs.oilSupplyTempC} °C</span>
          </div>
          <input
            type="range"
            min="20"
            max="80"
            step="1"
            value={inputs.oilSupplyTempC}
            onChange={(e) => onChange('oilSupplyTempC', Number(e.target.value))}
            className="accent-emerald-500 cursor-pointer h-1.5 bg-slate-700 rounded"
          />
        </div>

        {/* Oil Supply Pressure */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Supply Pressure:</span>
            <span className="text-emerald-400 font-bold">{inputs.oilSupplyPressureBar} bar</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.5"
            step="0.1"
            value={inputs.oilSupplyPressureBar}
            onChange={(e) => onChange('oilSupplyPressureBar', Number(e.target.value))}
            className="accent-emerald-500 cursor-pointer h-1.5 bg-slate-700 rounded"
          />
        </div>
      </div>
    </div>
  );
};
