import React from 'react';
import { SteamTurbineInputs, TurbineType, StageDesign, GoverningMode } from '../../types/steamTurbine';
import { UnitSystem } from '../../types/common';

interface SteamTurbineControlsProps {
  inputs: SteamTurbineInputs;
  onChange: (inputs: SteamTurbineInputs) => void;
  unitSystem?: UnitSystem;
}

export const SteamTurbineControls: React.FC<SteamTurbineControlsProps> = ({
  inputs,
  onChange,
}) => {
  const updateField = <K extends keyof SteamTurbineInputs>(key: K, value: SteamTurbineInputs[K]) => {
    onChange({
      ...inputs,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6 text-sm text-zinc-300">
      {/* 1. THERMODYNAMIC CONDITIONS */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 border-b border-zinc-800/80 pb-2">
          <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            Steam Thermodynamic State
          </h3>
          <span className="text-[11px] font-mono text-zinc-500">ASME PTC 6 / API 612</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Turbine Configuration</label>
            <select
              value={inputs.turbineType}
              onChange={(e) => updateField('turbineType', e.target.value as TurbineType)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
            >
              <option value="condensing">Condensing (Vacuum Exhaust & Surface Condenser)</option>
              <option value="back_pressure">Back-Pressure (Process Steam Header Exhaust)</option>
              <option value="extraction_condensing">Extraction Condensing</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Blading Stage Design</label>
            <select
              value={inputs.stageDesign}
              onChange={(e) => updateField('stageDesign', e.target.value as StageDesign)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
            >
              <option value="impulse_rateau">Impulse (Rateau Pressure-Compounded Stages)</option>
              <option value="impulse_curtis">Impulse (Curtis Velocity-Compounded Stage)</option>
              <option value="reaction_parsons">50% Reaction (Parsons Multi-Stage Drum)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Inlet Pressure (P_in)</span>
              <span className="font-mono text-orange-400 font-semibold">{inputs.inletPressureBar} bar(a)</span>
            </div>
            <input
              type="range"
              min="5"
              max="130"
              step="1"
              value={inputs.inletPressureBar}
              onChange={(e) => updateField('inletPressureBar', parseFloat(e.target.value))}
              className="w-full accent-orange-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Inlet Temperature (T_in)</span>
              <span className="font-mono text-orange-400 font-semibold">{inputs.inletTemperatureC} °C</span>
            </div>
            <input
              type="range"
              min="180"
              max="540"
              step="5"
              value={inputs.inletTemperatureC}
              onChange={(e) => updateField('inletTemperatureC', parseFloat(e.target.value))}
              className="w-full accent-orange-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Exhaust Pressure (P_exh)</span>
              <span className="font-mono text-sky-400 font-semibold">{inputs.exhaustPressureBar} bar(a)</span>
            </div>
            <input
              type="range"
              min="0.05"
              max={inputs.turbineType === 'condensing' ? 0.5 : 20.0}
              step={inputs.turbineType === 'condensing' ? 0.01 : 0.5}
              value={inputs.exhaustPressureBar}
              onChange={(e) => updateField('exhaustPressureBar', parseFloat(e.target.value))}
              className="w-full accent-sky-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Number of Stages</span>
              <span className="font-mono text-zinc-200 font-semibold">{inputs.numberOfStages} Stages</span>
            </div>
            <input
              type="range"
              min="1"
              max="16"
              step="1"
              value={inputs.numberOfStages}
              onChange={(e) => updateField('numberOfStages', parseInt(e.target.value))}
              className="w-full accent-zinc-500"
            />
          </div>
        </div>
      </div>

      {/* 2. MECHANICAL RATING & GOVERNING */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 border-b border-zinc-800/80 pb-2">
          <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Power, Speed & Governing
          </h3>
          <span className="text-[11px] font-mono text-zinc-500">API 612 §2.4 Speed Control</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Shaft Power Rating</span>
              <span className="font-mono text-emerald-400 font-semibold">{inputs.ratedPowerKw} kW</span>
            </div>
            <input
              type="range"
              min="200"
              max="15000"
              step="100"
              value={inputs.ratedPowerKw}
              onChange={(e) => updateField('ratedPowerKw', parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Operating Speed (N_op)</span>
              <span className="font-mono text-emerald-400 font-semibold">{inputs.operatingSpeedRpm} RPM</span>
            </div>
            <input
              type="range"
              min="1000"
              max={Math.round(inputs.ratedSpeedRpm * 1.15)}
              step="25"
              value={inputs.operatingSpeedRpm}
              onChange={(e) => updateField('operatingSpeedRpm', parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <span className="text-[10px] text-zinc-500">Trip threshold: {Math.round(inputs.ratedSpeedRpm * 1.10)} RPM</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Governing Mode</label>
            <select
              value={inputs.governingMode}
              onChange={(e) => updateField('governingMode', e.target.value as GoverningMode)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="nozzle_governing">Nozzle Governing (Sequential Multi-Valve Arc)</option>
              <option value="throttle_governing">Throttle Governing (Single Control Valve)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Governor Valve Position</span>
              <span className="font-mono text-zinc-200 font-semibold">{inputs.throttleValveOpeningPercent}% Open</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="1"
              value={inputs.throttleValveOpeningPercent}
              onChange={(e) => updateField('throttleValveOpeningPercent', parseInt(e.target.value))}
              className="w-full accent-zinc-500"
            />
          </div>
        </div>
      </div>

      {/* 3. ROTOR DYNAMICS & CAMPBELL BLADE RESONANCE */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 border-b border-zinc-800/80 pb-2">
          <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            Critical Speeds & Campbell Blade Resonance
          </h3>
          <span className="text-[11px] font-mono text-zinc-500">API 612 §2.5 / §2.6</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">1st Lateral Critical Speed</span>
              <span className="font-mono text-cyan-400 font-semibold">{inputs.firstCriticalSpeedRpm} RPM</span>
            </div>
            <input
              type="range"
              min="1500"
              max="6000"
              step="50"
              value={inputs.firstCriticalSpeedRpm}
              onChange={(e) => updateField('firstCriticalSpeedRpm', parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Stator Nozzle Count (z_n)</span>
              <span className="font-mono text-cyan-400 font-semibold">{inputs.nozzlePassFrequencyCount} Nozzles</span>
            </div>
            <input
              type="range"
              min="24"
              max="72"
              step="2"
              value={inputs.nozzlePassFrequencyCount}
              onChange={(e) => updateField('nozzlePassFrequencyCount', parseInt(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Blade Natural Frequency (f_b)</span>
              <span className="font-mono text-cyan-400 font-semibold">{inputs.bladeNaturalFrequencyHz} Hz</span>
            </div>
            <input
              type="range"
              min="2000"
              max="9000"
              step="50"
              value={inputs.bladeNaturalFrequencyHz}
              onChange={(e) => updateField('bladeNaturalFrequencyHz', parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Last Stage Blade Length</span>
              <span className="font-mono text-zinc-200 font-semibold">{inputs.lastStageBladeLengthMm} mm</span>
            </div>
            <input
              type="range"
              min="50"
              max="350"
              step="5"
              value={inputs.lastStageBladeLengthMm}
              onChange={(e) => updateField('lastStageBladeLengthMm', parseFloat(e.target.value))}
              className="w-full accent-zinc-500"
            />
          </div>
        </div>
      </div>

      {/* 4. PROTECTION & AUXILIARIES */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 border-b border-zinc-800/80 pb-2">
          <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Auxiliaries & Stellite Erosion Shield
          </h3>
          <span className="text-[11px] font-mono text-zinc-500">API 670 Machinery Protection</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-2.5 bg-zinc-800/50 rounded-lg border border-zinc-700/60">
            <div>
              <span className="text-xs font-semibold text-zinc-200 block">Stellite Erosion Shield</span>
              <span className="text-[10px] text-zinc-400">Brazed on L-0 blade leading edge</span>
            </div>
            <button
              type="button"
              onClick={() => updateField('stelliteErosionShieldInstalled', !inputs.stelliteErosionShieldInstalled)}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                inputs.stelliteErosionShieldInstalled
                  ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                  : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
              }`}
            >
              {inputs.stelliteErosionShieldInstalled ? 'INSTALLED' : 'NONE'}
            </button>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Thrust Bearing Pad Temp</span>
              <span className="font-mono text-amber-400 font-semibold">{inputs.thrustBearingPadTempC} °C</span>
            </div>
            <input
              type="range"
              min="50"
              max="125"
              step="1"
              value={inputs.thrustBearingPadTempC}
              onChange={(e) => updateField('thrustBearingPadTempC', parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Differential Thermal Growth</span>
              <span className="font-mono text-zinc-200 font-semibold">
                {inputs.casingWarmUpDifferentialMm >= 0 ? `+${inputs.casingWarmUpDifferentialMm}` : inputs.casingWarmUpDifferentialMm} mm
              </span>
            </div>
            <input
              type="range"
              min="-0.5"
              max="1.5"
              step="0.05"
              value={inputs.casingWarmUpDifferentialMm}
              onChange={(e) => updateField('casingWarmUpDifferentialMm', parseFloat(e.target.value))}
              className="w-full accent-zinc-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Lube Oil Supply Pressure</span>
              <span className="font-mono text-zinc-200 font-semibold">{inputs.lubeOilInletPressureBar} bar(g)</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="3.5"
              step="0.1"
              value={inputs.lubeOilInletPressureBar}
              onChange={(e) => updateField('lubeOilInletPressureBar', parseFloat(e.target.value))}
              className="w-full accent-zinc-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
