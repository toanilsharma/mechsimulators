import React, { useState } from 'react';
import { PipeInputs, PipeMaterialType, PipeSizePreset, AnchorCondition } from '../../types/pipe';
import { UnitSystem } from '../../types/common';
import { MATERIAL_DATABASE, PIPE_SIZE_DATABASE } from '../../utils/pipeData';
import { PIPE_PRESETS } from '../../utils/pipePresets';
import {
  TabbedParameterPanel,
  ScenarioHeaderBar,
  ControlSlider,
  ControlSelect,
  InputSection,
} from '../../components/Shared/InputControls';
import {
  Thermometer,
  Cpu,
  ShieldCheck,
} from 'lucide-react';

interface PipeStressControlsProps {
  inputs: PipeInputs;
  onChange: (inputs: PipeInputs) => void;
  unitSystem: UnitSystem;
  scenarios?: any[];
  activeScenarioId?: string;
  onSelectScenario?: (id: string) => void;
}

export const PipeStressControls: React.FC<PipeStressControlsProps> = ({
  inputs,
  onChange,
  unitSystem,
  scenarios,
  activeScenarioId,
  onSelectScenario,
}) => {
  const [activeTab, setActiveTab] = useState<string>('thermal');

  const update = (patch: Partial<PipeInputs>) => {
    onChange({ ...inputs, ...patch });
  };

  const handleScenarioChange = (scenarioId: string) => {
    if (onSelectScenario) {
      onSelectScenario(scenarioId);
    }
    const preset = PIPE_PRESETS.find((p) => p.id === scenarioId);
    if (preset) {
      onChange({ ...preset.inputs, scenarioId });
    } else {
      update({ scenarioId });
    }
  };

  const handleMaterialChange = (mat: string) => {
    const data = MATERIAL_DATABASE[mat as PipeMaterialType] || MATERIAL_DATABASE.carbon_steel;
    update({
      materialType: mat as PipeMaterialType,
      modulusOfElasticityGPa: data.modulusOfElasticityGPa,
      thermalExpansionCoeff_1e6PerC: data.thermalExpansionCoeff_1e6PerC,
      allowableStressMPa: data.allowableStressMPa,
    });
  };

  const handlePipeSizeChange = (presetKey: string) => {
    const sizeData = PIPE_SIZE_DATABASE[presetKey as PipeSizePreset];
    if (sizeData && presetKey !== 'custom') {
      update({
        pipeSizePreset: presetKey as PipeSizePreset,
        pipeOuterDiameterMm: sizeData.odMm,
        pipeWallThicknessMm: sizeData.wallMm,
        npsNominalDiameterInches: sizeData.nps,
        nozzleLoadLimitKN: sizeData.defaultNozzleLimitKN,
      });
    } else {
      update({ pipeSizePreset: 'custom' });
    }
  };

  const handleSupportConditionChange = (cond: string) => {
    if (cond === 'one_end_fixed_one_end_free') {
      update({ anchorCondition: cond as AnchorCondition, restraintPercent: 0, isAnchorFailed: false });
    } else if (cond === 'guided') {
      update({ anchorCondition: cond as AnchorCondition, restraintPercent: 80, isAnchorFailed: false });
    } else if (cond === 'expansion_loop') {
      update({ anchorCondition: cond as AnchorCondition, restraintPercent: 5, isAnchorFailed: false });
    } else {
      update({ anchorCondition: 'anchored_both_ends', restraintPercent: 100, isAnchorFailed: false });
    }
  };

  const currentScenarioId = activeScenarioId || inputs.scenarioId || 'normal_heatup';
  const activeScenarioObj = scenarios?.find((s) => s.id === currentScenarioId);

  const currentSizePreset =
    inputs.pipeSizePreset ||
    (inputs.pipeOuterDiameterMm === 60.3
      ? 'DN50'
      : inputs.pipeOuterDiameterMm === 88.9
      ? 'DN80'
      : inputs.pipeOuterDiameterMm === 114.3
      ? 'DN100'
      : inputs.pipeOuterDiameterMm === 168.3
      ? 'DN150'
      : inputs.pipeOuterDiameterMm === 219.1
      ? 'DN200'
      : 'custom');

  const scenarioOptions = [
    { value: 'normal_heatup', label: 'Normal Heat-up (ASME B31.3)', group: 'Baseline' },
    { value: 'cold_installation', label: 'Cold Installation (Ambient State)', group: 'Baseline' },
    { value: 'benchmark_carbon_steel_10m', label: 'Benchmark: 10m CS, 100°C ΔT', group: 'Baseline' },
    { value: 'hot_line_operation', label: 'Hot Line Operation (High Growth)', group: 'Abnormal Tests' },
    { value: 'fully_restrained_pipe', label: 'Fully Restrained (Max Thrust)', group: 'Abnormal Tests' },
    { value: 'free_expansion', label: 'Free Expansion (Zero Restraint)', group: 'Abnormal Tests' },
    { value: 'expansion_loop_active', label: 'Expansion Loop Active (U-Bend)', group: 'Abnormal Tests' },
    { value: 'failed_anchor', label: 'Failed Anchor (Slip & Rotation)', group: 'Abnormal Tests' },
    { value: 'failed_support', label: 'Failed Intermediate Support', group: 'Abnormal Tests' },
    { value: 'thermal_shock', label: 'Thermal Shock Surge', group: 'Abnormal Tests' },
    { value: 'nozzle_overload_on_pump', label: 'Nozzle Overload on Pump Flange', group: 'Abnormal Tests' },
  ];

  // 1. Thermal & Restraint Tab
  const thermalTabContent = (
    <InputSection title="Operating Temperatures & Restraint" icon={<Thermometer size={12} className="text-[#f85149]" />} badge="Thermal ΔT">
      <ControlSlider
        id="slider-op-temp"
        label="Operating Temperature"
        value={inputs.operatingTempC}
        unit="°C"
        min={0}
        max={450}
        step={5}
        onChange={(val) => update({ operatingTempC: val })}
        colorAccent="orange"
        standardRef="T_op"
      />

      <ControlSlider
        id="slider-install-temp"
        label="Installation Temperature"
        value={inputs.installationTempC}
        unit="°C"
        min={-20}
        max={50}
        step={1}
        onChange={(val) => update({ installationTempC: val })}
        colorAccent="green"
        standardRef="T_inst"
      />

      <ControlSlider
        id="slider-restraint-factor"
        label="Anchor Restraint Factor"
        value={inputs.restraintPercent}
        unit="%"
        min={0}
        max={100}
        step={5}
        onChange={(val) => update({ restraintPercent: val })}
        colorAccent="amber"
        minLabel="0% (Free)"
        maxLabel="100% (Locked)"
      />

      <ControlSlider
        id="slider-internal-pressure"
        label="Internal Design Pressure"
        value={inputs.operatingPressureBar}
        unit="bar"
        min={0}
        max={100}
        step={1}
        onChange={(val) => update({ operatingPressureBar: val })}
        colorAccent="blue"
      />
    </InputSection>
  );

  // 2. Piping Spec Tab
  const specTabContent = (
    <InputSection title="Piping Specs & Geometry" icon={<Cpu size={12} className="text-[#58a6ff]" />} badge="Material">
      <ControlSelect
        id="pipe-material-select"
        label="Pipe Metallurgy"
        value={inputs.materialType}
        onChange={handleMaterialChange}
        options={[
          { value: 'carbon_steel', label: 'Carbon Steel ASTM A106 Gr B' },
          { value: 'stainless_steel', label: 'Austenitic SS (TP304 / TP316)' },
          { value: 'alloy_steel', label: 'Chrome-Moly Alloy (P11 / P22)' },
          { value: 'custom', label: 'Custom User Metallurgy' },
        ]}
      />

      <ControlSelect
        id="pipe-size-select"
        label="Nominal Pipe Size (NPS / DN)"
        value={currentSizePreset}
        onChange={handlePipeSizeChange}
        options={[
          { value: 'DN50', label: 'DN50 (2" NPS, OD 60.3mm)' },
          { value: 'DN80', label: 'DN80 (3" NPS, OD 88.9mm)' },
          { value: 'DN100', label: 'DN100 (4" NPS, OD 114.3mm)' },
          { value: 'DN150', label: 'DN150 (6" NPS, OD 168.3mm)' },
          { value: 'DN200', label: 'DN200 (8" NPS, OD 219.1mm)' },
          { value: 'custom', label: 'Custom Pipe Dimensions' },
        ]}
      />

      <ControlSlider
        id="slider-pipe-length"
        label="Straight Run Length (L)"
        value={inputs.pipeLengthM}
        unit="m"
        min={1.0}
        max={50.0}
        step={0.5}
        formatValue={(v) => v.toFixed(1)}
        onChange={(val) => update({ pipeLengthM: val })}
        colorAccent="blue"
      />

      <ControlSelect
        id="pipe-support-select"
        label="Boundary Condition"
        value={inputs.anchorCondition}
        onChange={handleSupportConditionChange}
        options={[
          { value: 'anchored_both_ends', label: 'Fixed-Fixed (Rigid Anchors at Both Flanges)' },
          { value: 'one_end_fixed_one_end_free', label: 'Fixed-Free (Unrestrained Expansion)' },
          { value: 'guided', label: 'Intermediate Guides (Axial Slide Restraint)' },
          { value: 'expansion_loop', label: 'Flexible U-Bend Expansion Loop' },
        ]}
      />
    </InputSection>
  );

  // 3. Limits & Loop Tab
  const limitsTabContent = (
    <InputSection title="ASME Limits & Expansion Loop" icon={<ShieldCheck size={12} className="text-amber-400" />} badge="ASME B31.3">
      <ControlSlider
        id="slider-allowable-stress"
        label="Allowable Stress Range (S_A)"
        value={inputs.allowableStressMPa}
        unit="MPa"
        min={50}
        max={350}
        step={5}
        formatValue={(v) => v.toFixed(1)}
        onChange={(val) => update({ allowableStressMPa: val })}
        colorAccent="green"
      />

      <ControlSlider
        id="slider-nozzle-limit"
        label="API 610 Nozzle Load Limit"
        value={inputs.nozzleLoadLimitKN}
        unit="kN"
        min={1.0}
        max={50.0}
        step={0.5}
        formatValue={(v) => v.toFixed(1)}
        onChange={(val) => update({ nozzleLoadLimitKN: val })}
        colorAccent="purple"
      />

      {inputs.anchorCondition === 'expansion_loop' ? (
        <>
          <ControlSlider
            id="slider-loop-width"
            label="Loop Width (W)"
            value={inputs.expansionLoopWidthM}
            unit="m"
            min={0.5}
            max={10.0}
            step={0.5}
            formatValue={(v) => v.toFixed(1)}
            onChange={(val) => update({ expansionLoopWidthM: val })}
            colorAccent="green"
          />

          <ControlSlider
            id="slider-loop-height"
            label="Loop Height (H)"
            value={inputs.expansionLoopHeightM}
            unit="m"
            min={0.5}
            max={10.0}
            step={0.5}
            formatValue={(v) => v.toFixed(1)}
            onChange={(val) => update({ expansionLoopHeightM: val })}
            colorAccent="green"
          />
        </>
      ) : (
        <>
          <ControlSlider
            id="slider-pipe-od"
            label="Outside Diameter (Do)"
            value={inputs.pipeOuterDiameterMm}
            unit="mm"
            min={20}
            max={500}
            step={1}
            formatValue={(v) => v.toFixed(1)}
            onChange={(val) => update({ pipeOuterDiameterMm: val, pipeSizePreset: 'custom' })}
            colorAccent="blue"
          />

          <ControlSlider
            id="slider-wall-thickness"
            label="Wall Thickness (t)"
            value={inputs.pipeWallThicknessMm}
            unit="mm"
            min={1}
            max={30}
            step={0.2}
            formatValue={(v) => v.toFixed(2)}
            onChange={(val) => update({ pipeWallThicknessMm: val, pipeSizePreset: 'custom' })}
            colorAccent="blue"
          />
        </>
      )}
    </InputSection>
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
          simulatorType="pipe-stress"
          inputs={inputs}
          unitSystem={unitSystem}
          coachStandard="ASME B31.3 §302.3.5"
          coachRuleOfThumb="Unrestrained thermal growth causes high nozzle forces F = E·A·α·ΔT on pump flanges. Maintain F < API 610 Table 5 nozzle limits using loops or directional guides."
          coachFieldTip="Stainless steels (304/316) expand 50% more than carbon steel for the same temperature change."
        />
      }
      tabs={[
        {
          id: 'thermal',
          label: 'Thermal',
          icon: <Thermometer size={12} className="text-[#f85149]" />,
          content: thermalTabContent,
        },
        {
          id: 'spec',
          label: 'Pipe Spec',
          icon: <Cpu size={12} className="text-[#58a6ff]" />,
          content: specTabContent,
        },
        {
          id: 'limits',
          label: 'Limits & Loop',
          icon: <ShieldCheck size={12} className="text-amber-400" />,
          content: limitsTabContent,
        },
      ]}
    />
  );
};
