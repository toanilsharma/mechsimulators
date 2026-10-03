import React from 'react';
import {
  RecipCompressorInputs,
  CylinderCrankAction,
  GasType,
  ValveFaultCondition,
  RingCondition,
} from '../../types/recipCompressor';
import { Settings, Gauge, Activity, Volume2, AlertOctagon, RotateCw } from 'lucide-react';

interface RecipControlsProps {
  inputs: RecipCompressorInputs;
  onChange: <K extends keyof RecipCompressorInputs>(field: K, val: RecipCompressorInputs[K]) => void;
}

export const RecipControls: React.FC<RecipControlsProps> = ({
  inputs,
  onChange,
}) => {
  return (
    <div className="flex flex-col gap-4 p-3 bg-[#0d1117] text-slate-200">
      {/* 1. CYLINDER GEOMETRY & KINEMATICS */}
      <div className="flex flex-col gap-2.5 p-3 rounded-lg bg-[#161b22] border border-[#30363d]">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
          <Settings className="w-3.5 h-3.5" />
          Cylinder Geometry & Kinematics
        </div>

        {/* Cylinder Action */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-mono text-slate-400">Cylinder Acting Mode</label>
          <select
            value={inputs.cylinderAction}
            onChange={(e) => onChange('cylinderAction', e.target.value as CylinderCrankAction)}
            className="bg-[#0b0f17] border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="double_acting">Double-Acting (Head End & Crank End)</option>
            <option value="single_acting_he">Single-Acting (Head End Only)</option>
            <option value="single_acting_ce">Single-Acting (Crank End Only)</option>
          </select>
        </div>

        {/* Compressor Speed */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Crank Speed (N):</span>
            <span className="text-cyan-400 font-bold">
              {inputs.crankSpeedRpm} RPM ({(inputs.crankSpeedRpm / 60).toFixed(1)} Hz)
            </span>
          </div>
          <input
            type="range"
            min="300"
            max="1200"
            step="10"
            value={inputs.crankSpeedRpm}
            onChange={(e) => onChange('crankSpeedRpm', Number(e.target.value))}
            className="accent-cyan-500 cursor-pointer h-1.5 bg-slate-700 rounded"
          />
        </div>

        {/* Cylinder Bore */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Cylinder Bore (D):</span>
            <span className="text-cyan-400 font-bold">{inputs.cylinderBoreMm} mm</span>
          </div>
          <input
            type="range"
            min="150"
            max="500"
            step="5"
            value={inputs.cylinderBoreMm}
            onChange={(e) => onChange('cylinderBoreMm', Number(e.target.value))}
            className="accent-cyan-500 cursor-pointer h-1.5 bg-slate-700 rounded"
          />
        </div>

        {/* Stroke Length */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Piston Stroke (S):</span>
            <span className="text-cyan-400 font-bold">{inputs.strokeMm} mm</span>
          </div>
          <input
            type="range"
            min="100"
            max="350"
            step="5"
            value={inputs.strokeMm}
            onChange={(e) => onChange('strokeMm', Number(e.target.value))}
            className="accent-cyan-500 cursor-pointer h-1.5 bg-slate-700 rounded"
          />
        </div>

        {/* Clearance Volume % */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-slate-400">HE Clearance: {inputs.heClearancePercent}%</span>
            <input
              type="range"
              min="6"
              max="25"
              step="0.5"
              value={inputs.heClearancePercent}
              onChange={(e) => onChange('heClearancePercent', Number(e.target.value))}
              className="accent-cyan-500 cursor-pointer h-1 bg-slate-700 rounded"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-slate-400">CE Clearance: {inputs.ceClearancePercent}%</span>
            <input
              type="range"
              min="8"
              max="28"
              step="0.5"
              value={inputs.ceClearancePercent}
              onChange={(e) => onChange('ceClearancePercent', Number(e.target.value))}
              className="accent-cyan-500 cursor-pointer h-1 bg-slate-700 rounded"
            />
          </div>
        </div>
      </div>

      {/* 2. PROCESS GAS & PRESSURES */}
      <div className="flex flex-col gap-2.5 p-3 rounded-lg bg-[#161b22] border border-[#30363d]">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
          <Gauge className="w-3.5 h-3.5" />
          Process Gas & Thermodynamics
        </div>

        {/* Gas Type */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-mono text-slate-400">Working Gas Medium</label>
          <select
            value={inputs.gasType}
            onChange={(e) => onChange('gasType', e.target.value as GasType)}
            className="bg-[#0b0f17] border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="natural_gas_methane">Natural Gas / Methane (k=1.30, Mw=16.0)</option>
            <option value="hydrogen_h2">Hydrogen H₂ (k=1.405, Mw=2.016, c≈1300 m/s)</option>
            <option value="nitrogen_air">Nitrogen / Air (k=1.40, Mw=28.96)</option>
            <option value="carbon_dioxide_co2">Carbon Dioxide CO₂ (k=1.28, Mw=44.01)</option>
            <option value="propane_c3h8">Propane LPG (k=1.13, Mw=44.1)</option>
          </select>
        </div>

        {/* Suction Pressure */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Suction Pressure (P_s):</span>
            <span className="text-amber-400 font-bold">{inputs.suctionPressureBarA} bar(a)</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="30.0"
            step="0.5"
            value={inputs.suctionPressureBarA}
            onChange={(e) => onChange('suctionPressureBarA', Number(e.target.value))}
            className="accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded"
          />
        </div>

        {/* Discharge Pressure */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Discharge Pressure (P_d):</span>
            <span className="text-amber-400 font-bold">
              {inputs.dischargePressureBarA} bar(a) (Π = {(inputs.dischargePressureBarA / inputs.suctionPressureBarA).toFixed(2)})
            </span>
          </div>
          <input
            type="range"
            min="5.0"
            max="120.0"
            step="1.0"
            value={inputs.dischargePressureBarA}
            onChange={(e) => onChange('dischargePressureBarA', Number(e.target.value))}
            className="accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded"
          />
        </div>

        {/* Suction Temp */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Suction Temperature:</span>
            <span className="text-amber-400 font-bold">{inputs.suctionTempC} °C</span>
          </div>
          <input
            type="range"
            min="10"
            max="70"
            step="1"
            value={inputs.suctionTempC}
            onChange={(e) => onChange('suctionTempC', Number(e.target.value))}
            className="accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded"
          />
        </div>
      </div>

      {/* 3. VALVE & SEALING INTEGRITY (FAULT INJECTIONS) */}
      <div className="flex flex-col gap-2.5 p-3 rounded-lg bg-[#161b22] border border-[#30363d]">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
          <AlertOctagon className="w-3.5 h-3.5" />
          Valves & Ring Sealing Degradation
        </div>

        {/* Suction Valve */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-mono text-slate-400">Suction Valve Status</label>
          <select
            value={inputs.suctionValveFault}
            onChange={(e) => onChange('suctionValveFault', e.target.value as ValveFaultCondition)}
            className="bg-[#0b0f17] border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
          >
            <option value="normal">Normal (Tight Sealing)</option>
            <option value="minor_leak">Minor Leak (Slight Backflow)</option>
            <option value="severe_leak">Severe Leak (High Churn / Flattened PV)</option>
            <option value="late_opening">Late Opening (Stiff Spring / Delayed Cut-in)</option>
            <option value="flutter">Valve Flutter (Unstable Plate Oscillation)</option>
          </select>
        </div>

        {/* Discharge Valve */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-mono text-slate-400">Discharge Valve Status</label>
          <select
            value={inputs.dischargeValveFault}
            onChange={(e) => onChange('dischargeValveFault', e.target.value as ValveFaultCondition)}
            className="bg-[#0b0f17] border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
          >
            <option value="normal">Normal (Tight Sealing)</option>
            <option value="minor_leak">Minor Leak (Re-expansion Distorted)</option>
            <option value="severe_leak">Severe Broken Plate (PV Collapse)</option>
            <option value="flutter">Discharge Valve Flutter</option>
          </select>
        </div>

        {/* Piston Rings */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-mono text-slate-400">Piston Rings & Rider Bands</label>
          <select
            value={inputs.pistonRingCondition}
            onChange={(e) => onChange('pistonRingCondition', e.target.value as RingCondition)}
            className="bg-[#0b0f17] border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
          >
            <option value="good">Good Sealing (&lt; 2% Leakage)</option>
            <option value="worn_blowby">Worn Rings (Inter-Chamber Blow-By)</option>
            <option value="severe_blowby">Severe Ring Failure (Heavy HE-CE Blow-By)</option>
          </select>
        </div>
      </div>

      {/* 4. API 688 ACOUSTIC DAMPERS & PIPING */}
      <div className="flex flex-col gap-2.5 p-3 rounded-lg bg-[#161b22] border border-[#30363d]">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5" />
            API 688 Pulsation Dampers
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-normal">
            <input
              type="checkbox"
              checked={inputs.hasPulsationBottles}
              onChange={(e) => onChange('hasPulsationBottles', e.target.checked)}
              className="accent-purple-500 cursor-pointer"
            />
            <span>Bottles Active</span>
          </label>
        </div>

        {inputs.hasPulsationBottles && (
          <>
            {/* Bottle Volume */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Damper Volume:</span>
                <span className="text-purple-400 font-bold">{inputs.damperVolumeLiters} Liters</span>
              </div>
              <input
                type="range"
                min="100"
                max="1200"
                step="25"
                value={inputs.damperVolumeLiters}
                onChange={(e) => onChange('damperVolumeLiters', Number(e.target.value))}
                className="accent-purple-500 cursor-pointer h-1.5 bg-slate-700 rounded"
              />
            </div>

            {/* Choke Tube Diameter */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Choke Tube Diameter:</span>
                <span className="text-purple-400 font-bold">{inputs.chokeTubeDiameterMm} mm</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                step="5"
                value={inputs.chokeTubeDiameterMm}
                onChange={(e) => onChange('chokeTubeDiameterMm', Number(e.target.value))}
                className="accent-purple-500 cursor-pointer h-1.5 bg-slate-700 rounded"
              />
            </div>
          </>
        )}

        {/* Piping Length */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Distance to 1st Elbow (Acoustic L):</span>
            <span className="text-purple-400 font-bold">{inputs.pipingLengthToFirstElbowM} m</span>
          </div>
          <input
            type="range"
            min="1.5"
            max="12.0"
            step="0.1"
            value={inputs.pipingLengthToFirstElbowM}
            onChange={(e) => onChange('pipingLengthToFirstElbowM', Number(e.target.value))}
            className="accent-purple-500 cursor-pointer h-1.5 bg-slate-700 rounded"
          />
        </div>
      </div>
    </div>
  );
};
