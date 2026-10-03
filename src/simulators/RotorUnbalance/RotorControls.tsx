import React, { useState } from 'react';
import {
  RotorInputs,
  BalanceGrade,
  MachineType,
  MachineClassISO10816,
  LubricationCondition,
  ContaminationLevel,
  ReliabilityTarget,
  ScenarioId,
} from '../../types/rotor';
import { UnitSystem } from '../../types/common';
import { getBearing } from '../../utils/bearingData';
import { ROTOR_PRESETS } from '../../utils/rotorPresets';
import {
  TabbedParameterPanel,
  ScenarioHeaderBar,
  ControlSlider,
  ControlSelect,
  InputSection,
} from '../../components/Shared/InputControls';
import {
  RotateCw,
  Cpu,
  ShieldCheck,
} from 'lucide-react';

interface RotorControlsProps {
  inputs: RotorInputs;
  onChange: (inputs: RotorInputs) => void;
  unitSystem: UnitSystem;
  scenarios?: any[];
  activeScenarioId?: string;
  onSelectScenario?: (id: string) => void;
}

export const RotorControls: React.FC<RotorControlsProps> = ({
  inputs,
  onChange,
  unitSystem,
  scenarios,
  activeScenarioId,
  onSelectScenario,
}) => {
  const [activeTab, setActiveTab] = useState<string>('dynamics');

  const update = (patch: Partial<RotorInputs>) => {
    onChange({ ...inputs, ...patch });
  };

  const handleScenarioChange = (scenarioId: string) => {
    if (onSelectScenario) {
      onSelectScenario(scenarioId);
    }
    const preset = ROTOR_PRESETS.find((p) => p.id === scenarioId);
    if (preset) {
      onChange({ ...preset.inputs, scenarioId: scenarioId as ScenarioId });
    } else {
      update({ scenarioId: scenarioId as ScenarioId });
    }
  };

  const handleBearingDropdownChange = (category: string) => {
    if (category === 'ball') {
      const b = getBearing('6310');
      update({
        bearingCategorySelect: 'ball',
        bearingType: 'ball',
        bearingModelId: '6310',
        basicDynamicLoadC_kN: b.dynamicCapacityCrN / 1000,
      });
    } else if (category === 'roller') {
      const b = getBearing('nu_310_ecp');
      update({
        bearingCategorySelect: 'roller',
        bearingType: 'roller',
        bearingModelId: 'nu_310_ecp',
        basicDynamicLoadC_kN: b.dynamicCapacityCrN / 1000,
      });
    } else if (category === 'high_capacity') {
      const b = getBearing('22220_e');
      update({
        bearingCategorySelect: 'high_capacity',
        bearingType: 'roller',
        bearingModelId: '22220_e',
        basicDynamicLoadC_kN: b.dynamicCapacityCrN / 1000,
      });
    } else {
      update({
        bearingCategorySelect: 'custom',
        bearingModelId: 'custom_bearing',
      });
    }
  };

  const currentBearingCat =
    inputs.bearingCategorySelect || (inputs.bearingType === 'roller' ? 'roller' : 'ball');

  const currentScenarioId = activeScenarioId || inputs.scenarioId || 'balanced_rotor';
  const activeScenarioObj = scenarios?.find((s) => s.id === currentScenarioId);

  const scenarioOptions = [
    { value: 'balanced_rotor', label: 'Balanced Rotor (ISO G2.5 Baseline)', group: 'Baseline' },
    { value: 'validation_benchmark', label: 'Benchmark: Ball Bearing (C/P=8)', group: 'Baseline' },
    { value: 'mild_unbalance', label: 'Mild Unbalance (Elevated 1X)', group: 'Abnormal Tests' },
    { value: 'heavy_unbalance', label: 'Heavy Unbalance (Severe 1X Alarm)', group: 'Abnormal Tests' },
    { value: 'blade_loss_event', label: 'Blade Loss Event (Shock Step)', group: 'Abnormal Tests' },
    { value: 'near_critical_speed', label: 'Near Critical Speed (Resonance)', group: 'Abnormal Tests' },
    { value: 'lubrication_loss', label: 'Lubrication Loss (Thermal Wear)', group: 'Abnormal Tests' },
    { value: 'bearing_overload', label: 'Bearing Overload (Low C/P)', group: 'Abnormal Tests' },
    { value: 'high_temp_degradation', label: 'High Temperature (105°C)', group: 'Abnormal Tests' },
  ];

  // 1. Dynamics Tab Content
  const dynamicsTabContent = (
    <InputSection title="Operating Dynamics & Unbalance" icon={<RotateCw size={12} className="text-[#3fb950]" />} badge="1X Vibration">
      <ControlSlider
        id="slider-rotor-rpm"
        label="Operating Speed"
        value={inputs.operatingRpm}
        unit="RPM"
        min={300}
        max={6000}
        step={50}
        onChange={(val) => update({ operatingRpm: val })}
        colorAccent="blue"
        standardRef="Speed"
      />

      <ControlSlider
        id="slider-unbalance-mass"
        label="Unbalance Mass (m_u)"
        value={inputs.unbalanceMassGrams}
        unit="g"
        min={0.1}
        max={60.0}
        step={0.1}
        formatValue={(v) => v.toFixed(1)}
        onChange={(val) => update({ unbalanceMassGrams: val })}
        colorAccent="amber"
      />

      <ControlSlider
        id="slider-unbalance-radius"
        label="Unbalance Radius (r_u)"
        value={inputs.unbalanceRadiusMm}
        unit="mm"
        min={20}
        max={400}
        step={5}
        onChange={(val) => update({ unbalanceRadiusMm: val })}
        colorAccent="orange"
      />

      <ControlSlider
        id="slider-vibration-limit"
        label="Alarm Threshold"
        value={inputs.customVibrationLimitMmS || 4.5}
        unit="mm/s"
        min={1.0}
        max={20.0}
        step={0.5}
        formatValue={(v) => v.toFixed(1)}
        onChange={(val) => update({ customVibrationLimitMmS: val })}
        colorAccent="red"
      />
    </InputSection>
  );

  // 2. Machine & Bearing Tab Content
  const machineTabContent = (
    <InputSection title="Machine & Bearing Architecture" icon={<Cpu size={12} className="text-[#58a6ff]" />} badge="L10h Capacity">
      <ControlSelect
        id="rotor-machine-select"
        label="Machine Architecture"
        value={inputs.machineType || 'pump'}
        onChange={(val) => update({ machineType: val as MachineType })}
        options={[
          { value: 'pump', label: 'Centrifugal Pump (Overhung OH2)' },
          { value: 'fan', label: 'Industrial Fan & Blower' },
          { value: 'motor', label: 'Electric Induction Motor' },
          { value: 'compressor', label: 'Centrifugal Compressor' },
        ]}
      />

      <ControlSelect
        id="rotor-bearing-select"
        label="Bearing Topology"
        value={currentBearingCat}
        onChange={handleBearingDropdownChange}
        options={[
          { value: 'ball', label: 'Deep Groove Ball 6310 (C = 61.8 kN)' },
          { value: 'roller', label: 'Cylindrical Roller NU 310 (C = 110 kN)' },
          { value: 'high_capacity', label: 'Spherical Roller 22220 (C = 425 kN)' },
          { value: 'custom', label: 'Custom Bearing Rating' },
        ]}
      />

      <ControlSlider
        id="slider-rotor-mass"
        label="Rotor Mass (M)"
        value={inputs.rotorMassKg}
        unit="kg"
        min={5}
        max={600}
        step={5}
        onChange={(val) => update({ rotorMassKg: val })}
        colorAccent="orange"
      />

      <ControlSlider
        id="slider-bearing-c"
        label="Dynamic Load Rating (C)"
        value={inputs.basicDynamicLoadC_kN}
        unit="kN"
        min={10}
        max={450}
        step={5}
        formatValue={(v) => v.toFixed(1)}
        onChange={(val) => update({ basicDynamicLoadC_kN: val })}
        colorAccent="blue"
      />
    </InputSection>
  );

  // 3. Standards & Margins Tab Content
  const standardsTabContent = (
    <InputSection title="ISO Standards & Life Factors" icon={<ShieldCheck size={12} className="text-amber-400" />} badge="ISO 1940 / 281">
      <ControlSelect
        id="select-balance-grade"
        label="ISO 1940 Balance Grade (G)"
        value={inputs.balanceGrade || 'G2.5'}
        onChange={(val) => update({ balanceGrade: val as BalanceGrade })}
        options={[
          { value: 'G0.4', label: 'G0.4 (High Precision / Gyros)' },
          { value: 'G1.0', label: 'G1.0 (Turbines, Precision Motors)' },
          { value: 'G2.5', label: 'G2.5 (Process Pumps, Fans)' },
          { value: 'G6.3', label: 'G6.3 (General Machinery & Drives)' },
          { value: 'G16', label: 'G16 (Agricultural & Crushers)' },
          { value: 'G40', label: 'G40 (Heavy Flywheels)' },
        ]}
      />

      <ControlSelect
        id="select-machine-class"
        label="ISO 10816-3 Machine Class"
        value={inputs.machineClass || 'class_2_medium'}
        onChange={(val) => update({ machineClass: val as MachineClassISO10816 })}
        options={[
          { value: 'class_1_small', label: 'Class I: Small Machines (< 15 kW)' },
          { value: 'class_2_medium', label: 'Class II: Medium (15 - 300 kW)' },
          { value: 'class_3_large_rigid', label: 'Class III: Large (> 300 kW rigid)' },
          { value: 'class_4_large_flexible', label: 'Class IV: Large (> 300 kW flex)' },
        ]}
      />

      <ControlSelect
        id="select-lubrication"
        label="Lubrication Quality (ISO 281 a_lube)"
        value={inputs.lubricationCondition || 'normal'}
        onChange={(val) => update({ lubricationCondition: val as LubricationCondition })}
        options={[
          { value: 'poor', label: 'Poor Lubrication (0.5x life penalty)' },
          { value: 'normal', label: 'Normal Industrial Film (1.0x baseline)' },
          { value: 'good', label: 'Good Synthetic Viscosity (1.5x bonus)' },
        ]}
      />

      <ControlSelect
        id="select-reliability"
        label="Reliability Target (a1 Factor)"
        value={String(inputs.reliabilityTarget || 0.90)}
        onChange={(val) => update({ reliabilityTarget: parseFloat(val) as ReliabilityTarget })}
        options={[
          { value: '0.9', label: '90% Reliability (a1 = 1.00 - Standard L10h)' },
          { value: '0.95', label: '95% Reliability (a1 = 0.64)' },
          { value: '0.98', label: '98% Reliability (a1 = 0.37)' },
          { value: '0.99', label: '99% Reliability (a1 = 0.25 - Critical)' },
        ]}
      />
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
          simulatorType="rotor-unbalance"
          inputs={inputs}
          unitSystem={unitSystem}
          coachStandard="API 610 §6.8 & ISO 1940-1 G2.5"
          coachRuleOfThumb="On overhung OH2 pumps, dynamic cantilever action amplifies unbalance force on the inboard bearing by (1 + a/L), cutting bearing L10h fatigue life drastically."
          coachFieldTip="Ensure operating speed maintains at least ±15% separation margin from rotor lateral critical speeds."
        />
      }
      tabs={[
        {
          id: 'dynamics',
          label: 'Dynamics',
          icon: <RotateCw size={12} className="text-[#3fb950]" />,
          content: dynamicsTabContent,
        },
        {
          id: 'machine',
          label: 'Bearing',
          icon: <Cpu size={12} className="text-[#58a6ff]" />,
          content: machineTabContent,
        },
        {
          id: 'standards',
          label: 'Standards',
          icon: <ShieldCheck size={12} className="text-amber-400" />,
          content: standardsTabContent,
        },
      ]}
    />
  );
};
