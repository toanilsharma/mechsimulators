import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  VibrationUnit,
  MachineryClass,
  BearingGeometry,
  SpectralPreset,
} from '../../types/spectralLab';
import {
  STANDARD_BEARINGS,
  SPECTRAL_PRESETS,
  calculateBearingFrequencies,
  generateSynthesizedSpectrum,
  generateShaftOrbit,
  generateWaterfallCascade,
  evaluateSpectralCondition,
} from '../../utils/spectralCalculations';
import { FFTSpectrumCanvas } from './FFTSpectrumCanvas';
import { ShaftOrbitCanvas } from './ShaftOrbitCanvas';
import { BearingCalculatorPanel } from './BearingCalculatorPanel';
import { WaterfallCanvas } from './WaterfallCanvas';
import { DiagnosticEvaluationCard } from './DiagnosticEvaluationCard';
import {
  X,
  Activity,
  Compass,
  Layers,
  BarChart3,
  CheckCircle2,
  Sliders,
  Download,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';

interface SpectralLabModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpectralLabModal: React.FC<SpectralLabModalProps> = ({ isOpen, onClose }) => {
  const { activeRoute, injectedSimulatorInputs } = useApp();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'fft' | 'orbit' | 'bearing' | 'waterfall' | 'iso'>('fft');

  // Selected Preset
  const [selectedPresetId, setSelectedPresetId] = useState<string>('pristine_baseline');

  // Active Parameters (Configurable)
  const [params, setParams] = useState<SpectralPreset>(() => ({
    ...SPECTRAL_PRESETS[0],
  }));

  // Selected Bearing
  const [selectedBearing, setSelectedBearing] = useState<BearingGeometry>(() => STANDARD_BEARINGS[1]); // SKF 6309

  // Settings
  const [unit, setUnit] = useState<VibrationUnit>('mm/s_rms');
  const [machineryClass, setMachineryClass] = useState<MachineryClass>('Class_II');
  const [isRigidFoundation, setIsRigidFoundation] = useState<boolean>(true);
  const [showBearingCursors, setShowBearingCursors] = useState<boolean>(true);

  // Load Preset
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const p = SPECTRAL_PRESETS.find((item) => item.id === presetId);
    if (p) {
      setParams({ ...p });
      const b = STANDARD_BEARINGS.find((item) => item.id === p.bearingId) || STANDARD_BEARINGS[1];
      setSelectedBearing(b);
    }
  };

  // Import condition from current active simulator
  const handleImportCurrentSimulator = () => {
    let newParams = { ...params };
    const inputs = injectedSimulatorInputs || {};

    if (activeRoute === 'pump') {
      const rpm = inputs.speedRpm || 2980;
      newParams = {
        ...newParams,
        shaftRpm: rpm,
        cavitationNoiseAmp: 3.2,
        vanePassAmp: 2.1,
        vanePassVaneCount: 5,
        title: 'Live Twin: API 610 Cavitation & Hydraulic Pulse State',
      };
    } else if (activeRoute === 'rotor') {
      const rpm = inputs.operatingSpeedRpm || 3000;
      newParams = {
        ...newParams,
        shaftRpm: rpm,
        unbalance1XAmp: 7.6,
        misalignment2XAmp: 1.1,
        title: 'Live Twin: ISO 1940 Dynamic Rotor Unbalance State',
      };
    } else if (activeRoute === 'alignment') {
      newParams = {
        ...newParams,
        shaftRpm: 2950,
        misalignment2XAmp: 8.2,
        misalignment3XAmp: 2.4,
        unbalance1XAmp: 2.1,
        title: 'Live Twin: API 686 Coupling Misalignment & Figure-8 Orbit',
      };
    } else if (activeRoute === 'pipe') {
      newParams = {
        ...newParams,
        shaftRpm: 2950,
        misalignment2XAmp: 6.5,
        unbalance1XAmp: 3.2,
        rubSeverity: 0.35,
        title: 'Live Twin: ASME B31.3 Pipe Strain Casing Distortion State',
      };
    } else if (activeRoute === 'seal') {
      newParams = {
        ...newParams,
        shaftRpm: 2950,
        rubSeverity: 0.7,
        bearingDefectType: 'outer_race',
        bearingDefectAmp: 3.8,
        title: 'Live Twin: API 682 Seal Dry Rub & Thermal Shaft Bow State',
      };
    } else {
      // Default to robust refinery pump state
      newParams = {
        ...newParams,
        shaftRpm: 2980,
        unbalance1XAmp: 3.5,
        misalignment2XAmp: 4.2,
        title: 'Live Twin: Coupled Refinery Pump Train State',
      };
    }

    setParams(newParams);
    setSelectedPresetId('custom_live');
  };

  // Calculations Memoized
  const bearingFrequencies = useMemo(
    () => calculateBearingFrequencies(selectedBearing, params.shaftRpm),
    [selectedBearing, params.shaftRpm]
  );

  const synthesizedSpectrum = useMemo(
    () => generateSynthesizedSpectrum(params, selectedBearing, unit, 8.0, 512),
    [params, selectedBearing, unit]
  );

  const shaftOrbit = useMemo(
    () => generateShaftOrbit(params, 256),
    [params]
  );

  const waterfallSlices = useMemo(
    () => generateWaterfallCascade(params, selectedBearing, unit),
    [params, selectedBearing, unit]
  );

  const diagnosis = useMemo(
    () => evaluateSpectralCondition(params, selectedBearing, machineryClass, isRigidFoundation),
    [params, selectedBearing, machineryClass, isRigidFoundation]
  );

  // Export handlers
  const handleExportCSV = () => {
    const rows = [
      ['Order (X)', 'Frequency (Hz)', `Amplitude (${unit})`, 'Phase (deg)', 'Fault Label'],
      ...synthesizedSpectrum.discretePeaks.map((p) => [
        p.order,
        p.freqHz,
        p.amplitude,
        p.phaseDeg,
        `"${p.label}"`,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Pillar5_VibrationSpectrum_${params.shaftRpm}RPM.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const packet = {
      pillar: 'Pillar 5: Vibration Spectral Diagnostics & Machinery Condition Monitoring Lab',
      timestamp: new Date().toISOString(),
      machineState: params,
      bearingKinematics: {
        bearing: selectedBearing,
        calculatedFrequencies: bearingFrequencies,
      },
      telemetry: {
        overallVelocityRms_mm_s: diagnosis.overallVelocityRms,
        overallDisplacementPkPk_um: diagnosis.overallDisplacementPkPk,
        overallAccelerationG_rms: diagnosis.overallAccelerationG,
        iso10816Zone: diagnosis.isoZone,
        orbitDiagnostics: shaftOrbit.diagnostics,
      },
      diagnostics: diagnosis,
    };
    const blob = new Blob([JSON.stringify(packet, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Pillar5_ConditionMonitoring_Twin_${params.shaftRpm}RPM.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      id="spectral-lab-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
    >
      <div
        id="spectral-lab-modal-card"
        className="relative w-full max-w-5xl bg-[#090d16] border border-blue-500/40 rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* ========================================================================= */}
        {/* 1. MODAL HEADER */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-950 border border-blue-500/50 text-blue-400">
              <Activity size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/40 uppercase">
                  Pillar 5
                </span>
                <h3 className="text-sm sm:text-base font-mono font-bold text-slate-100">
                  VIBRATION SPECTRAL DIAGNOSTICS & CONDITION MONITORING LAB
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-sans hidden sm:block">
                ISO 10816 / ISO 7919 / ISO 13373 / API 670 • FFT Spectrum, Shaft Orbit, Bearing Kinematics & Waterfall Cascade
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Unit Dropdown */}
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as VibrationUnit)}
              className="px-2 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono font-bold"
            >
              <option value="mm/s_rms">mm/s RMS (Velocity)</option>
              <option value="in/s_pk">in/s pk (Velocity)</option>
              <option value="um_pkpk">µm pk-pk (Displacement)</option>
              <option value="mil_pkpk">mil pk-pk (Displacement)</option>
              <option value="g_rms">g RMS (Acceleration)</option>
            </select>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Close Modal (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. PRESETS BAR & SIMULATOR IMPORT */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-slate-950/80 border-b border-slate-800/80 text-xs font-mono shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
            <span className="text-slate-400 text-[11px] whitespace-nowrap">Fault Case:</span>
            {SPECTRAL_PRESETS.map((pr) => (
              <button
                key={pr.id}
                onClick={() => handleSelectPreset(pr.id)}
                className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
                  selectedPresetId === pr.id
                    ? 'bg-blue-900/70 text-blue-200 border border-blue-500/60 font-bold'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {pr.title.split('(')[0]}
              </button>
            ))}
          </div>

          {/* Quick Import from current simulator */}
          <button
            onClick={handleImportCurrentSimulator}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold whitespace-nowrap transition-colors"
            title="Import speed, unbalance, misalignment, or cavitation noise from active workbench"
          >
            <Sparkles size={13} />
            <span>Import Active Twin</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 3. TAB NAVIGATION */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-1 px-4 pt-2 bg-slate-900/40 border-b border-slate-800 shrink-0 text-xs font-mono">
          <button
            onClick={() => setActiveTab('fft')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold transition-colors ${
              activeTab === 'fft'
                ? 'border-blue-400 text-blue-300 bg-blue-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity size={14} />
            <span>1. FFT Spectrum Analyzer</span>
          </button>

          <button
            onClick={() => setActiveTab('orbit')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold transition-colors ${
              activeTab === 'orbit'
                ? 'border-purple-400 text-purple-300 bg-purple-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass size={14} />
            <span>2. Shaft Orbit & Centerline (API 670)</span>
          </button>

          <button
            onClick={() => setActiveTab('bearing')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold transition-colors ${
              activeTab === 'bearing'
                ? 'border-amber-400 text-amber-300 bg-amber-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={14} />
            <span>3. Bearing Kinematics (ISO 15243)</span>
          </button>

          <button
            onClick={() => setActiveTab('waterfall')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold transition-colors ${
              activeTab === 'waterfall'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 size={14} />
            <span>4. 3D Waterfall Cascade</span>
          </button>

          <button
            onClick={() => setActiveTab('iso')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold transition-colors ${
              activeTab === 'iso'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>5. ISO 10816 Audit & CMMS Export</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 4. MODAL BODY (SCROLLABLE) */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Active Tab View */}
          {activeTab === 'fft' && (
            <FFTSpectrumCanvas
              spectrumPoints={synthesizedSpectrum.spectrumPoints}
              discretePeaks={synthesizedSpectrum.discretePeaks}
              bearingFreqs={bearingFrequencies}
              showBearingCursors={showBearingCursors}
              unit={unit}
              shaftRpm={params.shaftRpm}
            />
          )}

          {activeTab === 'orbit' && (
            <ShaftOrbitCanvas
              orbitPoints={shaftOrbit.orbitPoints}
              diagnostics={shaftOrbit.diagnostics}
              clearanceUm={params.radialClearanceUm}
              shaftRpm={params.shaftRpm}
            />
          )}

          {activeTab === 'bearing' && (
            <BearingCalculatorPanel
              selectedBearing={selectedBearing}
              onSelectBearing={(b) => setSelectedBearing(b)}
              onUpdateBearingParam={(field, val) =>
                setSelectedBearing((prev) => ({ ...prev, [field]: val }))
              }
              frequencies={bearingFrequencies}
              showCursors={showBearingCursors}
              onToggleCursors={(show) => setShowBearingCursors(show)}
              shaftRpm={params.shaftRpm}
            />
          )}

          {activeTab === 'waterfall' && (
            <WaterfallCanvas
              slices={waterfallSlices}
              unit={unit}
            />
          )}

          {activeTab === 'iso' && (
            <DiagnosticEvaluationCard
              diagnosis={diagnosis}
              machineryClass={machineryClass}
              onChangeMachineryClass={(c) => setMachineryClass(c)}
              isRigidFoundation={isRigidFoundation}
              onToggleFoundation={(rigid) => setIsRigidFoundation(rigid)}
              onExportCSV={handleExportCSV}
              onExportJSON={handleExportJSON}
            />
          )}

          {/* ========================================================================= */}
          {/* 5. INTERACTIVE LIVE TUNING BENCH (SLIDERS) */}
          {/* ========================================================================= */}
          <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono mb-3">
              <div className="flex items-center gap-2">
                <Sliders size={14} className="text-blue-400" />
                <span className="font-bold text-slate-200">INTERACTIVE VIBRATION SYNTHESIZER TUNING</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Adjust fault parameters to observe instantaneous changes across FFT, Orbit, and ISO Zones
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              {/* Shaft RPM */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Shaft Speed:</span>
                  <span className="font-bold text-blue-400">{params.shaftRpm} RPM</span>
                </div>
                <input
                  type="range"
                  min="600"
                  max="4500"
                  step="50"
                  value={params.shaftRpm}
                  onChange={(e) => setParams({ ...params, shaftRpm: Number(e.target.value) })}
                  className="w-full mt-1.5 accent-blue-500"
                />
              </div>

              {/* 1X Unbalance */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>1X Unbalance:</span>
                  <span className="font-bold text-blue-400">{params.unbalance1XAmp.toFixed(1)} mm/s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="0.2"
                  value={params.unbalance1XAmp}
                  onChange={(e) => setParams({ ...params, unbalance1XAmp: Number(e.target.value) })}
                  className="w-full mt-1.5 accent-blue-500"
                />
              </div>

              {/* 2X Misalignment */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>2X Misalignment:</span>
                  <span className="font-bold text-purple-400">{params.misalignment2XAmp.toFixed(1)} mm/s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="0.2"
                  value={params.misalignment2XAmp}
                  onChange={(e) => setParams({ ...params, misalignment2XAmp: Number(e.target.value) })}
                  className="w-full mt-1.5 accent-purple-500"
                />
              </div>

              {/* Bearing Defect Amplitude */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Bearing Defect:</span>
                  <span className="font-bold text-amber-400">{params.bearingDefectAmp.toFixed(1)} mm/s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="0.2"
                  value={params.bearingDefectAmp}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      bearingDefectAmp: Number(e.target.value),
                      bearingDefectType: Number(e.target.value) > 0.1 ? (params.bearingDefectType === 'none' ? 'outer_race' : params.bearingDefectType) : 'none',
                    })
                  }
                  className="w-full mt-1.5 accent-amber-500"
                />
              </div>

              {/* Subharmonic (Oil Whirl / Looseness) */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Sub-Harmonic (0.43X/0.5X):</span>
                  <span className="font-bold text-pink-400">{params.subharmonicAmp.toFixed(1)} mm/s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="0.2"
                  value={params.subharmonicAmp}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      subharmonicAmp: Number(e.target.value),
                      subharmonicType: Number(e.target.value) > 0.1 ? (params.subharmonicType === 'none' ? 'oil_whirl_0_45X' : params.subharmonicType) : 'none',
                    })
                  }
                  className="w-full mt-1.5 accent-pink-500"
                />
              </div>

              {/* Cavitation Noise */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Cavitation Acoustic Noise:</span>
                  <span className="font-bold text-cyan-400">{params.cavitationNoiseAmp.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.2"
                  value={params.cavitationNoiseAmp}
                  onChange={(e) => setParams({ ...params, cavitationNoiseAmp: Number(e.target.value) })}
                  className="w-full mt-1.5 accent-cyan-500"
                />
              </div>

              {/* Rub Severity */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Mechanical Rub:</span>
                  <span className="font-bold text-red-400">{(params.rubSeverity * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={params.rubSeverity}
                  onChange={(e) => setParams({ ...params, rubSeverity: Number(e.target.value) })}
                  className="w-full mt-1.5 accent-red-500"
                />
              </div>

              {/* Radial Clearance */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Bearing Radial Clearance:</span>
                  <span className="font-bold text-slate-300">{params.radialClearanceUm} µm</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="200"
                  step="5"
                  value={params.radialClearanceUm}
                  onChange={(e) => setParams({ ...params, radialClearanceUm: Number(e.target.value) })}
                  className="w-full mt-1.5 accent-slate-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 6. MODAL FOOTER */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 shrink-0 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Active ISO 10816 State:</span>
            <span className={`px-2 py-0.5 rounded font-bold ${
              diagnosis.isoZone === 'A' ? 'bg-emerald-950 text-emerald-300' :
              diagnosis.isoZone === 'B' ? 'bg-blue-950 text-blue-300' :
              diagnosis.isoZone === 'C' ? 'bg-amber-950 text-amber-300' : 'bg-red-950 text-red-300'
            }`}>
              ZONE {diagnosis.isoZone} • {diagnosis.overallVelocityRms} mm/s RMS
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors"
            >
              Close Studio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
