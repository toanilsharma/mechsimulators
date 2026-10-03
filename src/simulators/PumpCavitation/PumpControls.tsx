import React, { useState } from 'react';
import { PumpInputs } from '../../types/pump';
import { UnitSystem } from '../../types/common';
import { PUMP_PRESETS } from '../../utils/pumpPresets';
import {
  TabbedParameterPanel,
  ScenarioHeaderBar,
  ControlSlider,
  ControlSelect,
  InputSection,
} from '../../components/Shared/InputControls';
import {
  Gauge,
  Cpu,
  ShieldCheck,
  Upload,
  BookOpen,
} from 'lucide-react';

interface PumpControlsProps {
  inputs: PumpInputs;
  onChange: (inputs: PumpInputs) => void;
  unitSystem: UnitSystem;
  scenarios?: any[];
  activeScenarioId?: string;
  onSelectScenario?: (id: string) => void;
}

export const PumpControls: React.FC<PumpControlsProps> = ({
  inputs,
  onChange,
  unitSystem,
  scenarios,
  activeScenarioId,
  onSelectScenario,
}) => {
  const [activeTab, setActiveTab] = useState<string>('operating');
  const [oemImportSuccess, setOemImportSuccess] = useState<string | null>(null);

  const update = (patch: Partial<PumpInputs>) => {
    onChange({ ...inputs, ...patch });
  };

  // Scenario presets handler
  const handleScenarioChange = (scenarioId: string) => {
    if (onSelectScenario) {
      onSelectScenario(scenarioId);
    }
    const preset = PUMP_PRESETS.find((p) => p.id === scenarioId);
    if (preset) {
      onChange({ ...preset.inputs, scenarioId });
    }
  };

  // Fluid selector handler
  const handleFluidSelect = (fluidKey: string) => {
    if (fluidKey === 'water_20') {
      update({
        fluidId: 'water',
        fluidTempC: 20,
        customDensityKgM3: undefined,
        customVaporPressureKPa: undefined,
        customViscosityCP: undefined,
      });
    } else if (fluidKey === 'water_90') {
      update({
        fluidId: 'water',
        fluidTempC: 90,
        customDensityKgM3: undefined,
        customVaporPressureKPa: undefined,
        customViscosityCP: undefined,
      });
    } else if (fluidKey === 'condensate') {
      update({
        fluidId: 'boiler_feed',
        fluidTempC: 98,
        customDensityKgM3: undefined,
        customVaporPressureKPa: undefined,
        customViscosityCP: undefined,
      });
    } else if (fluidKey === 'custom') {
      update({
        fluidId: 'water',
        customDensityKgM3: inputs.customDensityKgM3 || 1000,
        customVaporPressureKPa: inputs.customVaporPressureKPa || 3.17,
        customViscosityCP: inputs.customViscosityCP || 1.0,
      });
    }
  };

  const getSelectedFluidKey = () => {
    if (inputs.customDensityKgM3 || inputs.customVaporPressureKPa || inputs.customViscosityCP) {
      return 'custom';
    }
    if (inputs.fluidId === 'boiler_feed') {
      return 'condensate';
    }
    if (inputs.fluidId === 'water') {
      if (inputs.fluidTempC >= 75) return 'water_90';
      return 'water_20';
    }
    return 'custom';
  };

  // Pump model selection handler
  const handlePumpModelSelect = (model: string) => {
    if (model === 'low_npshr') {
      update({
        pumpPresetModel: 'low_npshr',
        npshr3percentM: 2.2,
        bepFlowM3h: 120,
        impellerEyeDiameterMm: 140,
      });
    } else if (model === 'standard') {
      update({
        pumpPresetModel: 'standard',
        npshr3percentM: 3.0,
        bepFlowM3h: 100,
        impellerEyeDiameterMm: 120,
      });
    } else if (model === 'high_flow') {
      update({
        pumpPresetModel: 'high_flow',
        npshr3percentM: 4.8,
        bepFlowM3h: 180,
        impellerEyeDiameterMm: 160,
      });
    } else if (model === 'oem_curve') {
      update({
        pumpPresetModel: 'oem_curve',
        npshrInputMode: 'curve_table',
        npshr3percentM: 3.2,
      });
    }
  };

  const currentScenarioId = activeScenarioId || inputs.scenarioId || 'normal_operation';
  const activeScenarioObj = scenarios?.find((s) => s.id === currentScenarioId);

  // Scenario options with grouped categories
  const scenarioOptions = [
    { value: 'normal_operation', label: 'Normal Flooded Suction', group: 'Baseline' },
    { value: 'validation_benchmark_open_tank', label: 'Benchmark: Water 20°C', group: 'Baseline' },
    { value: 'low_suction_level', label: 'Low Suction Level (Elevated Lift)', group: 'Abnormal Tests' },
    { value: 'hot_condensate', label: 'Hot Condensate (High Pv)', group: 'Abnormal Tests' },
    { value: 'suction_strainer_blocked', label: 'Suction Strainer Blocked', group: 'Abnormal Tests' },
    { value: 'suction_valve_throttled', label: 'Suction Valve Throttled', group: 'Abnormal Tests' },
    { value: 'high_flow_demand', label: 'High Flow Demand (Runout)', group: 'Abnormal Tests' },
    { value: 'gas_entrainment', label: 'Gas Entrainment (Aeration)', group: 'Abnormal Tests' },
  ];

  // 1. Operating Tab Content (Q, N, Static Head, Temp, Valve)
  const operatingTabContent = (
    <InputSection title="Dynamic Operating Conditions" icon={<Gauge size={12} className="text-[#3fb950]" />} badge="Real-time">
      <ControlSlider
        id="slider-flow-rate"
        label="Flow Rate (Q)"
        value={inputs.flowRateM3h}
        unit="m³/h"
        min={10}
        max={250}
        step={5}
        onChange={(val) => update({ flowRateM3h: val })}
        colorAccent="orange"
        standardRef="Duty Point"
        sensitivityBadge={{
          label: "∂NPSHa/∂Q",
          derivative: "-0.045 m/(m³/h)",
          level: "high",
          direction: "negative",
        }}
      />

      <ControlSlider
        id="slider-pump-speed"
        label="Pump Speed (N)"
        value={inputs.pumpSpeedRpm}
        unit="RPM"
        min={500}
        max={3600}
        step={50}
        onChange={(val) => update({ pumpSpeedRpm: val })}
        colorAccent="orange"
        sensitivityBadge={{
          label: "∂NPSHr/∂N",
          derivative: "Affinity ∝ N²",
          level: "high",
          direction: "positive",
        }}
      />

      <ControlSlider
        id="slider-tank-level"
        label="Tank Level / Static Head (Z)"
        value={inputs.staticHeadM}
        unit="m"
        min={-6.0}
        max={8.0}
        step={0.2}
        formatValue={(v) => (v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1))}
        onChange={(val) => update({ staticHeadM: val })}
        colorAccent={inputs.staticHeadM >= 0 ? 'green' : 'red'}
        minLabel="-6.0m (Lift)"
        maxLabel="+8.0m (Flooded)"
        sensitivityBadge={{
          label: "∂NPSHa/∂Z",
          derivative: "+1.00 m/m (Direct Static Lift)",
          level: "high",
          direction: "positive",
        }}
      />

      <ControlSlider
        id="slider-fluid-temp"
        label="Fluid Temperature (T)"
        value={inputs.fluidTempC}
        unit="°C"
        min={5}
        max={130}
        step={1}
        onChange={(val) => update({ fluidTempC: val })}
        colorAccent="amber"
        sensitivityBadge={{
          label: "∂Pv/∂T",
          derivative: "Exponential (Antoine/Clausius)",
          level: "high",
          direction: "negative",
        }}
      />

      <ControlSlider
        id="slider-valve-opening"
        label="Suction Valve Opening"
        value={inputs.valveOpeningPercent ?? 100}
        unit="%"
        min={10}
        max={100}
        step={5}
        onChange={(val) => update({ valveOpeningPercent: val })}
        colorAccent={(inputs.valveOpeningPercent ?? 100) < 50 ? 'red' : 'green'}
        minLabel="10% (Throttled)"
        maxLabel="100% (Open)"
        sensitivityBadge={{
          label: "∂hf/∂Valve",
          derivative: "ΔP ∝ 1/Cv² Throttling Loss",
          level: "medium",
          direction: "positive",
        }}
      />
    </InputSection>
  );

  // 2. Hydraulics / System Tab Content
  const hydraulicsTabContent = (
    <InputSection title="Hydraulics & Process Fluid" icon={<Cpu size={12} className="text-[#58a6ff]" />} badge="Geometry">
      <ControlSelect
        id="fluid-select"
        label="Process Fluid"
        value={getSelectedFluidKey()}
        onChange={handleFluidSelect}
        options={[
          { value: 'water_20', label: 'Water @ 20°C (1.0 cP, Pv=2.34 kPa)' },
          { value: 'water_90', label: 'Hot Water @ 90°C (Pv=70.1 kPa)' },
          { value: 'condensate', label: 'Condensate / Boiler Feedwater' },
          { value: 'custom', label: 'Custom User Defined Fluid' },
        ]}
      />

      <ControlSelect
        id="pump-model-select"
        label="Pump Model / NPSHr Curve"
        value={inputs.pumpPresetModel || 'standard'}
        onChange={handlePumpModelSelect}
        options={[
          { value: 'standard', label: 'Standard Overhung Pump (NPSHr ≈ 3.0m)' },
          { value: 'low_npshr', label: 'Low NPSHr Impeller (Enlarged Eye, ≈ 2.2m)' },
          { value: 'high_flow', label: 'High Flow Heavy Duty (NPSHr ≈ 4.8m)' },
          { value: 'oem_curve', label: 'OEM Factory Curve Calibration' },
        ]}
      />

      <ControlSlider
        id="slider-pipe-diameter"
        label="Suction Pipe Diameter (D)"
        value={inputs.pipeDiameterMm}
        unit="mm"
        min={50}
        max={300}
        step={5}
        onChange={(val) => update({ pipeDiameterMm: val })}
        colorAccent="blue"
        sensitivityBadge={{
          label: "∂hf/∂D",
          derivative: "Darcy-Weisbach ∝ D⁻⁵",
          level: "high",
          direction: "negative",
        }}
      />

      <ControlSlider
        id="slider-pipe-length"
        label="Suction Pipe Length (L)"
        value={inputs.pipeLengthM}
        unit="m"
        min={1}
        max={60}
        step={1}
        onChange={(val) => update({ pipeLengthM: val })}
        colorAccent="blue"
        sensitivityBadge={{
          label: "∂hf/∂L",
          derivative: "+0.015 m/m line loss",
          level: "medium",
          direction: "negative",
        }}
      />
    </InputSection>
  );

  // 3. Limits & Advanced Tab Content
  const limitsTabContent = (
    <InputSection title="Standards, Margins & Advanced" icon={<ShieldCheck size={12} className="text-amber-400" />} badge="API 610">
      <ControlSelect
        id="safety-margin-select"
        label="Safety Margin Standard"
        value={inputs.safetyMarginType || 'normal'}
        onChange={(val) => update({ safetyMarginType: val as any })}
        options={[
          { value: 'normal', label: 'HI Standard (NPSHa ≥ NPSHr + 0.6m)' },
          { value: 'conservative', label: 'API 610 Conservative (NPSHa ≥ NPSHr + 1.0m)' },
          { value: 'none', label: 'Zero Margin (3% Head Drop Boundary)' },
        ]}
      />

      <ControlSlider
        id="slider-npshr-val"
        label="Base NPSHr (Rated Duty)"
        value={inputs.npshr3percentM}
        unit="m"
        min={1.0}
        max={8.0}
        step={0.1}
        formatValue={(v) => v.toFixed(1)}
        onChange={(val) => update({ npshr3percentM: val })}
        colorAccent="green"
      />

      <ControlSlider
        id="slider-fouling-factor"
        label="Fouling Factor (Strainer / Pipe)"
        value={inputs.foulingFactor}
        unit="x"
        min={1.0}
        max={2.5}
        step={0.05}
        formatValue={(v) => v.toFixed(2)}
        onChange={(val) => update({ foulingFactor: val })}
        colorAccent={inputs.foulingFactor > 1.4 ? 'amber' : 'orange'}
        minLabel="1.0x (Clean)"
        maxLabel="2.5x (Fouled)"
      />

      <ControlSlider
        id="slider-gas-entrainment"
        label="Gas Entrainment (Free Air)"
        value={inputs.gasEntrainmentPercent ?? 0}
        unit="%"
        min={0}
        max={10}
        step={1}
        onChange={(val) => update({ gasEntrainmentPercent: val })}
        colorAccent="blue"
      />

      {/* OEM Factory Calibration Loader */}
      <div className="p-1.5 bg-[#0d1117] border border-[#30363d] rounded flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[10px] font-mono text-[#8b949e]">
          <Upload size={11} className="text-[#f27d26]" />
          <span>OEM Curve</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setOemImportSuccess('OEM Curve Loaded');
            update({
              pumpPresetModel: 'oem_curve',
              npshrCurvePoints: [
                { flowM3h: 50, npshrM: 2.1 },
                { flowM3h: 80, npshrM: 2.8 },
                { flowM3h: 110, npshrM: 3.5 },
                { flowM3h: 140, npshrM: 4.9 },
              ],
            });
            setTimeout(() => setOemImportSuccess(null), 3000);
          }}
          className="py-1 px-2 bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d] rounded text-[10px] font-mono transition-colors cursor-pointer"
        >
          {oemImportSuccess ? '✓ Loaded' : 'Load OEM Curve'}
        </button>
      </div>
    </InputSection>
  );

  // Model Notes & Academic Faculty Rigor
  const modelNotesContent = (
    <div className="space-y-3 p-3 font-sans">
      {/* Three Action-Oriented Scannable Bullets */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-3.5 space-y-2.5">
        <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
          <ShieldCheck size={13} />
          <span>Interactive Simulation Scope</span>
        </div>
        
        <div className="space-y-2.5 text-xs">
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
            <div>
              <strong className="text-slate-100">What You Control:</strong>{' '}
              <span className="text-slate-300 leading-relaxed block mt-0.5">
                Throttle suction head, adjust system fluid temperature, vary shaft RPM (800–3,600), and trim impeller diameter to dynamically alter system resistance.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
            <div>
              <strong className="text-slate-100">What You Observe:</strong>{' '}
              <span className="text-slate-300 leading-relaxed block mt-0.5">
                Watch the real-time Euler H–Q curve adapt at 60 FPS, monitor the live NPSHa vs. NPSHr margin bar, and visualize vapor cavity nucleation and acoustic shockwaves at the impeller eye.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
            <div>
              <strong className="text-slate-100">Failure Prevented:</strong>{' '}
              <span className="text-slate-300 leading-relaxed block mt-0.5">
                Destructive micro-jet cavitation pitting, 1X/vane-pass structural vibration spikes, mechanical seal thermal runaway, and premature bearing fatigue (API 610 / HI 9.6.1 compliance).
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Model Notes Sidebar Text */}
      <div className="bg-[#0a1120] border border-cyan-500/30 rounded-xl p-3.5 space-y-2">
        <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 font-bold flex items-center gap-1.5">
          <BookOpen size={13} />
          <span>Model Notes (Academic & EPC Rigor)</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          <strong>Governing Physical Model:</strong> Solved in real time using the 1D Euler Turbomachinery Equation coupled with the Rayleigh-Plesset bubble dynamics ODE and the Antoine vapor pressure formulation. Hydraulic losses and head deductions are computed via the Darcy-Weisbach friction model, strictly validating suction specific speed (<span className="font-mono text-cyan-300 font-bold">Nss</span>) against Hydraulic Institute HI 9.6.1 margin criteria.
        </p>
      </div>
    </div>
  );

  return (
    <TabbedParameterPanel
      activeTab={activeTab}
      onTabChange={setActiveTab}
      scenarioHeader={
        <ScenarioHeaderBar
          scenarioId={currentScenarioId}
          onScenarioChange={handleScenarioChange}
          options={scenarioOptions}
          activeScenario={activeScenarioObj}
          simulatorType="pump-cavitation"
          inputs={inputs}
          unitSystem={unitSystem}
          coachStandard="HI 9.6.1 & API 610 §6.1.8"
          coachRuleOfThumb="Ensure NPSHa > 1.35x NPSHr (or >= 1.0 m absolute margin). Vapor pressure increases exponentially with fluid temperature, rapidly cutting suction margin."
          coachFieldTip="Listen for rattling like gravel or marbles in the pump suction casing when operating at flow runout (> 110% BEP)."
        />
      }
      tabs={[
        {
          id: 'operating',
          label: 'Operating',
          icon: <Gauge size={12} className="text-[#3fb950]" />,
          content: operatingTabContent,
        },
        {
          id: 'hydraulics',
          label: 'Hydraulics',
          icon: <Cpu size={12} className="text-[#58a6ff]" />,
          content: hydraulicsTabContent,
        },
        {
          id: 'limits',
          label: 'Limits & Adv',
          icon: <ShieldCheck size={12} className="text-amber-400" />,
          content: limitsTabContent,
        },
        {
          id: 'model-notes',
          label: 'Model Notes',
          icon: <BookOpen size={12} className="text-cyan-400" />,
          content: modelNotesContent,
        },
      ]}
    />
  );
};
