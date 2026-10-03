import React, { useState } from 'react';
import {
  GearboxInputs,
  GearType,
  GearMaterialGrade,
  GearLubricantType,
  ToothFaultType,
} from '../../types/gearbox';
import { UnitSystem } from '../../types/common';
import { Sliders, Wrench, Shield, Droplets, AlertOctagon, ChevronDown, ChevronUp } from 'lucide-react';

interface GearboxControlsProps {
  inputs: GearboxInputs;
  onChange: (inputs: GearboxInputs) => void;
  unitSystem?: UnitSystem;
}

export const GearboxControls: React.FC<GearboxControlsProps> = ({
  inputs,
  onChange,
}) => {
  const [openSection, setOpenSection] = useState<'duty' | 'geometry' | 'material' | 'lube' | 'faults'>('duty');

  const updateField = <K extends keyof GearboxInputs>(key: K, value: GearboxInputs[K]) => {
    onChange({ ...inputs, [key]: value });
  };

  const toggleSection = (section: 'duty' | 'geometry' | 'material' | 'lube' | 'faults') => {
    setOpenSection(openSection === section ? ('' as any) : section);
  };

  return (
    <div className="w-full flex flex-col gap-2 select-none text-xs font-mono">
      {/* 1. Machine Duty & Power */}
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('duty')}
          className="w-full px-3 py-2.5 bg-[#0f172a] flex items-center justify-between hover:bg-[#162036] transition-colors"
        >
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>1. OPERATING DUTY & SPEED RATIO</span>
          </div>
          {openSection === 'duty' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSection === 'duty' && (
          <div className="p-3 flex flex-col gap-3 bg-[#080d17]">
            {/* Gear Configuration Type */}
            <div>
              <label className="text-slate-400 block mb-1">Gear Type Configuration</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['spur', 'helical', 'double_helical'] as GearType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => updateField('gearType', t)}
                    className={`py-1.5 px-2 rounded text-[11px] font-mono border transition-all ${
                      inputs.gearType === t
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {t.replace(/_/g, ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Rated Power */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300">Transmitted Power:</span>
                <span className="text-cyan-400 font-bold">{inputs.ratedPowerKw} kW ({Math.round(inputs.ratedPowerKw * 1.341)} HP)</span>
              </div>
              <input
                type="range"
                min="15"
                max="1500"
                step="5"
                value={inputs.ratedPowerKw}
                onChange={(e) => updateField('ratedPowerKw', Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Input Speed */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300">Driver Shaft Speed (Pinion):</span>
                <span className="text-cyan-400 font-bold">{inputs.inputSpeedRpm} RPM ({(inputs.inputSpeedRpm / 60).toFixed(1)} Hz)</span>
              </div>
              <input
                type="range"
                min="300"
                max="3600"
                step="10"
                value={inputs.inputSpeedRpm}
                onChange={(e) => updateField('inputSpeedRpm', Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Teeth Counts */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Pinion Teeth (Z_p)</label>
                <input
                  type="number"
                  min="12"
                  max="45"
                  value={inputs.pinionTeeth}
                  onChange={(e) => updateField('pinionTeeth', Math.max(12, Number(e.target.value)))}
                  className="w-full bg-[#0d1424] border border-[#1e293b] rounded px-2 py-1 text-slate-200 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Gear Teeth (Z_g)</label>
                <input
                  type="number"
                  min="20"
                  max="300"
                  value={inputs.gearTeeth}
                  onChange={(e) => updateField('gearTeeth', Math.max(20, Number(e.target.value)))}
                  className="w-full bg-[#0d1424] border border-[#1e293b] rounded px-2 py-1 text-slate-200 text-xs font-mono"
                />
              </div>
            </div>

            {/* Application Service Factor Ko */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300">AGMA Overload Factor (K_o):</span>
                <span className="text-cyan-400 font-bold">{inputs.applicationServiceFactor}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.2"
                step="0.05"
                value={inputs.applicationServiceFactor}
                onChange={(e) => updateField('applicationServiceFactor', Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>Uniform (1.0)</span>
                <span>Moderate Shock (1.5)</span>
                <span>Heavy Shock (2.0)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Gear Geometry & Mesh */}
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('geometry')}
          className="w-full px-3 py-2.5 bg-[#0f172a] flex items-center justify-between hover:bg-[#162036] transition-colors"
        >
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            <span>2. GEAR MESH GEOMETRY</span>
          </div>
          {openSection === 'geometry' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSection === 'geometry' && (
          <div className="p-3 flex flex-col gap-3 bg-[#080d17]">
            {/* Normal Module */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300">Normal Module (m_n):</span>
                <span className="text-cyan-400 font-bold">{inputs.normalModuleMm} mm</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="14.0"
                step="0.5"
                value={inputs.normalModuleMm}
                onChange={(e) => updateField('normalModuleMm', Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Face Width */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300">Active Face Width (b):</span>
                <span className="text-cyan-400 font-bold">{inputs.faceWidthMm} mm</span>
              </div>
              <input
                type="range"
                min="30"
                max="300"
                step="5"
                value={inputs.faceWidthMm}
                onChange={(e) => updateField('faceWidthMm', Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Angles & Backlash */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Pressure Angle (α)</label>
                <select
                  value={inputs.pressureAngleDeg}
                  onChange={(e) => updateField('pressureAngleDeg', Number(e.target.value))}
                  className="w-full bg-[#0d1424] border border-[#1e293b] rounded px-2 py-1 text-slate-200 text-xs font-mono"
                >
                  <option value={20}>20° (Standard)</option>
                  <option value={25}>25° (High Strength)</option>
                  <option value={14.5}>14.5° (Obsolete)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Helix Angle (β)</label>
                <input
                  type="number"
                  min="0"
                  max="35"
                  value={inputs.helixAngleDeg}
                  onChange={(e) => updateField('helixAngleDeg', Number(e.target.value))}
                  disabled={inputs.gearType === 'spur'}
                  className="w-full bg-[#0d1424] border border-[#1e293b] rounded px-2 py-1 text-slate-200 text-xs font-mono disabled:opacity-40"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300">Circumferential Backlash:</span>
                <span className="text-cyan-400 font-bold">{inputs.backlashMm} mm</span>
              </div>
              <input
                type="range"
                min="0.08"
                max="0.60"
                step="0.02"
                value={inputs.backlashMm}
                onChange={(e) => updateField('backlashMm', Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Metallurgy & Hardness */}
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('material')}
          className="w-full px-3 py-2.5 bg-[#0f172a] flex items-center justify-between hover:bg-[#162036] transition-colors"
        >
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>3. METALLURGY & QUALITY GRADE</span>
          </div>
          {openSection === 'material' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSection === 'material' && (
          <div className="p-3 flex flex-col gap-3 bg-[#080d17]">
            {/* Material Grade */}
            <div>
              <label className="text-slate-400 block mb-1">Gear Material & Heat Treatment</label>
              <select
                value={inputs.materialGrade}
                onChange={(e) => updateField('materialGrade', e.target.value as GearMaterialGrade)}
                className="w-full bg-[#0d1424] border border-[#1e293b] rounded px-2 py-1.5 text-slate-200 text-xs font-mono"
              >
                <option value="carburized_case_hardened">Case Carburized & Hardened Steel (API 613 Grade)</option>
                <option value="through_hardened_steel">Through-Hardened Alloy Steel (4140 / 4340)</option>
                <option value="nitrided_steel">Nitrided Steel (Low Distortion)</option>
                <option value="cast_iron">Cast Iron Grade 40 (Low Duty)</option>
              </select>
            </div>

            {/* Hardness Controls */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400">Pinion Hardness:</span>
                  <span className="text-cyan-400 font-bold">{inputs.pinionHardnessHrc} HRC</span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="64"
                  value={inputs.pinionHardnessHrc}
                  onChange={(e) => updateField('pinionHardnessHrc', Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400">Gear Hardness:</span>
                  <span className="text-cyan-400 font-bold">{inputs.gearHardnessHrc} HRC</span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="64"
                  value={inputs.gearHardnessHrc}
                  onChange={(e) => updateField('gearHardnessHrc', Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>

            {/* ISO 1328 Accuracy Grade */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300">ISO 1328 Accuracy Grade:</span>
                <span className="text-cyan-400 font-bold">Grade {inputs.isoQualityGrade}</span>
              </div>
              <input
                type="range"
                min="4"
                max="10"
                step="1"
                value={inputs.isoQualityGrade}
                onChange={(e) => updateField('isoQualityGrade', Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>Grade 4 (Precision/API 613)</span>
                <span>Grade 7 (Industrial)</span>
                <span>Grade 10 (Rough)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Lubrication & Tribology */}
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('lube')}
          className="w-full px-3 py-2.5 bg-[#0f172a] flex items-center justify-between hover:bg-[#162036] transition-colors"
        >
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span>4. LUBRICATION & TRIBOLOGY</span>
          </div>
          {openSection === 'lube' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSection === 'lube' && (
          <div className="p-3 flex flex-col gap-3 bg-[#080d17]">
            <div>
              <label className="text-slate-400 block mb-1">Gear Oil Formulation (AGMA 9005)</label>
              <select
                value={inputs.lubricant}
                onChange={(e) => updateField('lubricant', e.target.value as GearLubricantType)}
                className="w-full bg-[#0d1424] border border-[#1e293b] rounded px-2 py-1.5 text-slate-200 text-xs font-mono"
              >
                <option value="synthetic_pao_220">Synthetic Polyalphaolefin (PAO) ISO VG 220 (High VI)</option>
                <option value="iso_vg_150">Mineral Industrial Gear Oil ISO VG 150</option>
                <option value="iso_vg_220">Mineral Industrial Gear Oil ISO VG 220 (Standard)</option>
                <option value="iso_vg_320">Mineral Industrial Gear Oil ISO VG 320 (Heavy)</option>
                <option value="iso_vg_460">Mineral Industrial Gear Oil ISO VG 460 (Extra Heavy)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300">Oil Operating Sump Temperature:</span>
                <span className="text-cyan-400 font-bold">{inputs.oilOperatingTempC} °C</span>
              </div>
              <input
                type="range"
                min="30"
                max="105"
                step="1"
                value={inputs.oilOperatingTempC}
                onChange={(e) => updateField('oilOperatingTempC', Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300">Tooth Surface Roughness (Ra):</span>
                <span className="text-cyan-400 font-bold">{inputs.surfaceRoughnessRaUm} µm</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.1"
                value={inputs.surfaceRoughnessRaUm}
                onChange={(e) => updateField('surfaceRoughnessRaUm', Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* 5. Fault Injections & Diagnostics */}
      <div className="bg-[#0b101b] border border-rose-950/60 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('faults')}
          className="w-full px-3 py-2.5 bg-rose-950/30 flex items-center justify-between hover:bg-rose-950/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span>5. FAULT INJECTION & VIBRATION DIAGNOSTICS</span>
          </div>
          {openSection === 'faults' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSection === 'faults' && (
          <div className="p-3 flex flex-col gap-3 bg-[#080d17]">
            <div>
              <label className="text-slate-400 block mb-1">Simulated Tooth Failure Mode</label>
              <select
                value={inputs.toothFault}
                onChange={(e) => updateField('toothFault', e.target.value as ToothFaultType)}
                className="w-full bg-[#0d1424] border border-rose-900/60 rounded px-2 py-1.5 text-rose-200 text-xs font-mono"
              >
                <option value="none">Pristine Gearing (No Faults)</option>
                <option value="pitch_line_pitting">Pitch Line Macro-Pitting (Surface Contact Fatigue)</option>
                <option value="root_bending_fatigue_crack">Root Bending Fatigue Crack (Notch Concentration)</option>
                <option value="broken_tooth">Broken / Missing Tooth Segment (High Impact Shock)</option>
                <option value="scuffing_scoring">Scuffing & Scoring (Adhesive Welding Wear)</option>
                <option value="excessive_backlash">Excessive Backlash & Tooth Battering</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300">Pinion Shaft Radial Eccentricity / Runout:</span>
                <span className="text-rose-400 font-bold">{inputs.pinionEccentricityUm} µm</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="2"
                value={inputs.pinionEccentricityUm}
                onChange={(e) => updateField('pinionEccentricityUm', Number(e.target.value))}
                className="w-full accent-rose-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Generates 1X rotational modulation and sidebands flanking the GMF harmonics.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
