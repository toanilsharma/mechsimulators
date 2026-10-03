import React from 'react';
import { CompressorInputs, GasType } from '../../types/compressor';
import { GAS_DATABASE } from '../../utils/compressorCalculations';
import { UnitSystem } from '../../types/common';
import { InputSection } from '../../components/Shared/InputControls';
import { Wind, Gauge, ShieldAlert, Cpu } from 'lucide-react';

interface CompressorControlsProps {
  inputs: CompressorInputs;
  onChange: (key: keyof CompressorInputs, val: any) => void;
  unitSystem?: UnitSystem;
}

export const CompressorControls: React.FC<CompressorControlsProps> = ({
  inputs,
  onChange,
  unitSystem = 'metric',
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* 1. Gas Composition & Thermodynamic State */}
      <InputSection title="Process Gas & Suction State (API 617)" icon={<Wind size={13} />}>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono text-slate-400">Process Gas Mixture</label>
          <select
            value={inputs.gasType}
            onChange={(e) => onChange('gasType', e.target.value as GasType)}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-xs font-mono text-slate-200"
          >
            {Object.values(GAS_DATABASE).map((gas) => (
              <option key={gas.id} value={gas.id}>
                {gas.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-1">
          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Suction P1</span>
              <span className="text-[#38bdf8]">{inputs.suctionPressureBar.toFixed(1)} bar(a)</span>
            </div>
            <input
              type="range"
              min={2.0}
              max={60.0}
              step={0.5}
              value={inputs.suctionPressureBar}
              onChange={(e) => onChange('suctionPressureBar', parseFloat(e.target.value))}
              className="w-full accent-[#38bdf8]"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Suction Temp T1</span>
              <span className="text-[#38bdf8]">{inputs.suctionTempC.toFixed(0)}°C</span>
            </div>
            <input
              type="range"
              min={-20}
              max={80}
              step={1}
              value={inputs.suctionTempC}
              onChange={(e) => onChange('suctionTempC', parseFloat(e.target.value))}
              className="w-full accent-[#38bdf8]"
            />
          </div>
        </div>
      </InputSection>

      {/* 2. Process Flow & Rotor Speed */}
      <InputSection title="Operating Point & Aerodynamics" icon={<Gauge size={13} />}>
        <div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Process Feed Mass Flow (ṁ)</span>
            <span className="text-[#f27d26] font-bold">{inputs.massFlowKgS.toFixed(1)} kg/s</span>
          </div>
          <input
            type="range"
            min={5.0}
            max={40.0}
            step={0.2}
            value={inputs.massFlowKgS}
            onChange={(e) => onChange('massFlowKgS', parseFloat(e.target.value))}
            className="w-full accent-[#f27d26]"
          />
          <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-0.5">
            <span>Surge Zone (&lt; 18 kg/s)</span>
            <span>Design (22.5 kg/s)</span>
            <span>Choke (&gt; 35 kg/s)</span>
          </div>
          <div className="flex justify-between text-[9px] font-mono px-1.5 py-0.5 mt-1 rounded bg-[#0d1117] border border-[#30363d]/80 text-[#8b949e]">
            <span className="text-[#f27d26] font-bold">∂SM/∂ṁ:</span>
            <span className="text-emerald-400 font-semibold">+4.5% Surge Margin per kg/s</span>
          </div>
        </div>

        <div className="mt-1">
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Compressor Speed (RPM)</span>
            <span className="text-[#10b981] font-bold">{inputs.speedRpm.toLocaleString()} RPM</span>
          </div>
          <input
            type="range"
            min={7000}
            max={12000}
            step={100}
            value={inputs.speedRpm}
            onChange={(e) => onChange('speedRpm', parseInt(e.target.value))}
            className="w-full accent-[#10b981]"
          />
          <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-0.5">
            <span>Minimum (7,000)</span>
            <span>Rated (10,500)</span>
            <span>MCOS (11,025)</span>
          </div>
          <div className="flex justify-between text-[9px] font-mono px-1.5 py-0.5 mt-1 rounded bg-[#0d1117] border border-[#30363d]/80 text-[#8b949e]">
            <span className="text-[#f27d26] font-bold">∂Head/∂N:</span>
            <span className="text-cyan-300 font-semibold">Euler Head ∝ N²</span>
          </div>
        </div>
      </InputSection>

      {/* 3. Anti-Surge Control Loop (ASV) */}
      <InputSection title="Anti-Surge Control Loop (API 670 Reference)" icon={<ShieldAlert size={13} />}>
        <div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Anti-Surge Valve (ASV) Position</span>
            <span className={`font-bold ${inputs.asvOpeningPercent > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {inputs.asvOpeningPercent}% OPEN
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={inputs.asvOpeningPercent}
            onChange={(e) => onChange('asvOpeningPercent', parseInt(e.target.value))}
            className="w-full accent-[#f59e0b]"
          />
          <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-0.5">
            <span>Closed (0%)</span>
            <span>Modulating</span>
            <span>Full Trip (100%)</span>
          </div>
          <div className="flex justify-between text-[9px] font-mono px-1.5 py-0.5 mt-1 rounded bg-[#0d1117] border border-[#30363d]/80 text-[#8b949e]">
            <span className="text-[#f27d26] font-bold">∂SM/∂ASV:</span>
            <span className="text-amber-400 font-semibold">+0.75% Margin per % Open</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>SCL Margin Target</span>
              <span className="text-slate-200">{inputs.surgeMarginTargetPercent}%</span>
            </div>
            <input
              type="range"
              min={8}
              max={25}
              step={1}
              value={inputs.surgeMarginTargetPercent}
              onChange={(e) => onChange('surgeMarginTargetPercent', parseInt(e.target.value))}
              className="w-full accent-slate-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>ASV Rated Cv</span>
              <span className="text-slate-200">{inputs.asvCv}</span>
            </div>
            <input
              type="range"
              min={100}
              max={500}
              step={25}
              value={inputs.asvCv}
              onChange={(e) => onChange('asvCv', parseInt(e.target.value))}
              className="w-full accent-slate-400"
            />
          </div>
        </div>
      </InputSection>
    </div>
  );
};
