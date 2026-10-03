import React, { useState } from 'react';
import {
  SealInputs,
  SealPlanId,
  SealFaceMaterial,
  BarrierFluidType,
} from '../../types/seal';
import { UnitSystem } from '../../types/common';
import { SEAL_SCENARIOS } from '../../engine/scenarios';
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
} from 'lucide-react';

interface SealPlanControlsProps {
  inputs: SealInputs;
  onChange: (inputs: SealInputs) => void;
  unitSystem: UnitSystem;
  scenarios?: any[];
  activeScenarioId?: string;
  onSelectScenario?: (id: string) => void;
}

export const SealPlanControls: React.FC<SealPlanControlsProps> = ({
  inputs,
  onChange,
  unitSystem,
  scenarios,
  activeScenarioId,
  onSelectScenario,
}) => {
  const [activeTab, setActiveTab] = useState<string>('chamber');

  const update = (patch: Partial<SealInputs>) => {
    onChange({ ...inputs, ...patch });
  };

  const scenarioList = scenarios || SEAL_SCENARIOS;

  const handleScenarioChange = (scenarioId: string) => {
    if (onSelectScenario) {
      onSelectScenario(scenarioId);
    }
    const preset = scenarioList.find((p) => p.id === scenarioId);
    if (preset?.inputs) {
      onChange({ ...preset.inputs });
    }
  };

  const isDualSeal = ['plan_52', 'plan_53a', 'plan_53b', 'plan_53c', 'plan_54'].includes(inputs.planId);
  const isPressurized = ['plan_53a', 'plan_53b', 'plan_53c', 'plan_54'].includes(inputs.planId);
  const hasCooler = ['plan_21', 'plan_23', 'plan_53a', 'plan_53b', 'plan_53c'].includes(inputs.planId);
  const hasOrifice = ['plan_11', 'plan_13', 'plan_21', 'plan_31', 'plan_32'].includes(inputs.planId);

  const currentScenarioId = activeScenarioId || 'plan11-standard-flush';
  const activeScenarioObj = scenarioList.find((s) => s.id === currentScenarioId);

  const scenarioOptions = [
    { value: 'plan11-standard-flush', label: 'Plan 11 (Standard Bypass Flush)', group: 'Baseline' },
    { value: 'cooler-failure', label: 'Plan 23 Cooler Loss (Thermal Spike)', group: 'Failure Cases' },
    { value: 'barrier-pressure-low', label: 'Plan 53A Barrier Pressure Loss', group: 'Failure Cases' },
    { value: 'flush-blocked', label: 'Plan 11 Orifice Blocked (Loss of Flow)', group: 'Failure Cases' },
  ];

  // 1. Chamber & Pressure Tab
  const chamberTabContent = (
    <InputSection title="Chamber Pressures & Speeds" icon={<Gauge size={12} className="text-[#3fb950]" />} badge="Real-time">
      <ControlSlider
        id="slider-process-temp"
        label="Process Fluid Temperature"
        value={inputs.processFluidTempC}
        unit="°C"
        min={10}
        max={250}
        step={2}
        onChange={(val) => update({ processFluidTempC: val })}
        colorAccent="orange"
        standardRef="T_proc"
      />

      <ControlSlider
        id="slider-chamber-pressure"
        label="Seal Chamber Pressure (P_box)"
        value={inputs.sealChamberPressureKPag}
        unit="kPag"
        min={50}
        max={3000}
        step={25}
        onChange={(val) => update({ sealChamberPressureKPag: val })}
        colorAccent="blue"
        standardRef="P_box"
      />

      <ControlSlider
        id="slider-discharge-pressure"
        label="Discharge Pressure (P_disch)"
        value={inputs.pumpDischargePressureKPag}
        unit="kPag"
        min={inputs.sealChamberPressureKPag}
        max={4000}
        step={25}
        onChange={(val) => update({ pumpDischargePressureKPag: val })}
        colorAccent="orange"
      />

      {isPressurized ? (
        <ControlSlider
          id="slider-barrier-pressure"
          label="Barrier Fluid Pressure"
          value={inputs.barrierBufferPressureKPag}
          unit="kPag"
          min={0}
          max={3500}
          step={25}
          onChange={(val) => update({ barrierBufferPressureKPag: val })}
          colorAccent={inputs.barrierBufferPressureKPag < inputs.sealChamberPressureKPag + 140 ? 'red' : 'green'}
          minLabel={`Req: ≥ ${inputs.sealChamberPressureKPag + 140} kPag`}
          maxLabel="API 682 +1.4 bar"
        />
      ) : (
        <ControlSlider
          id="slider-shaft-speed"
          label="Shaft Operating Speed"
          value={inputs.shaftSpeedRpm}
          unit="RPM"
          min={1000}
          max={3600}
          step={50}
          onChange={(val) => update({ shaftSpeedRpm: val })}
          colorAccent="blue"
        />
      )}
    </InputSection>
  );

  // 2. Plan & Fluids Tab
  const planTabContent = (
    <InputSection title="API 682 Plan & Fluid Metallurgy" icon={<Cpu size={12} className="text-[#58a6ff]" />} badge="Arrangement">
      <ControlSelect
        id="select-api-plan"
        label="API 682 Flush Piping Plan"
        value={inputs.planId}
        onChange={(val) => update({ planId: val as SealPlanId })}
        options={[
          { value: 'plan_11', label: 'Plan 11 (Discharge to Seal via Orifice)' },
          { value: 'plan_13', label: 'Plan 13 (Seal Chamber to Suction)' },
          { value: 'plan_21', label: 'Plan 21 (Discharge through Cooler)' },
          { value: 'plan_23', label: 'Plan 23 (Pumping Ring through Heat Exchanger)' },
          { value: 'plan_31', label: 'Plan 31 (Discharge through Cyclone Separator)' },
          { value: 'plan_32', label: 'Plan 32 (External Clean Flush Injection)' },
          { value: 'plan_52', label: 'Plan 52 (Dual Unpressurized Buffer)' },
          { value: 'plan_53a', label: 'Plan 53A (Dual Pressurized Reservoir)' },
          { value: 'plan_53b', label: 'Plan 53B (Dual Bladder Accumulator)' },
          { value: 'plan_54', label: 'Plan 54 (External Clean Barrier Circ)' },
        ]}
      />

      <ControlSelect
        id="select-process-fluid"
        label="Pumped Process Fluid"
        value={inputs.processFluidType}
        onChange={(val) => update({ processFluidType: val as any })}
        options={[
          { value: 'water', label: 'Water (Clean Potable / Industrial)' },
          { value: 'boiler_feedwater', label: 'Hot Boiler Feedwater (Deaerated)' },
          { value: 'crude_oil', label: 'Crude Oil (Heavy Hydrocarbon)' },
          { value: 'gasoline', label: 'Gasoline / Refined Light Oil' },
          { value: 'hot_hydrocarbon', label: 'Hot Hydrocarbon Fraction' },
          { value: 'propane_lpg', label: 'LPG / Liquefied Petroleum Gas' },
          { value: 'caustic_soda', label: 'Caustic Soda Solution' },
        ]}
      />

      <ControlSlider
        id="slider-seal-size"
        label="Shaft Sleeve Diameter"
        value={inputs.sealSizeMm}
        unit="mm"
        min={25}
        max={120}
        step={5}
        onChange={(val) => update({ sealSizeMm: val })}
        colorAccent="blue"
      />

      {isDualSeal && (
        <ControlSelect
          id="select-barrier-fluid"
          label="Barrier / Buffer Fluid"
          value={inputs.barrierFluid || 'water_glycol_50_50'}
          onChange={(val) => update({ barrierFluid: val as BarrierFluidType })}
          options={[
            { value: 'water_glycol_50_50', label: 'Water-Glycol Mix 50/50' },
            { value: 'iso_vg_5_synthetic', label: 'Synthetic Barrier Oil ISO VG 5' },
            { value: 'iso_vg_10_mineral', label: 'Mineral Barrier Oil ISO VG 10' },
            { value: 'white_oil', label: 'Technical White Oil (Food grade)' },
          ]}
        />
      )}
    </InputSection>
  );

  // 3. Orifice & Limits Tab
  const limitsTabContent = (
    <InputSection title="Orifice, Faces & Thermal Margins" icon={<ShieldCheck size={12} className="text-amber-400" />} badge="API 682 Limits">
      {hasOrifice && (
        <ControlSlider
          id="slider-orifice-size"
          label="Restriction Orifice (Ø)"
          value={inputs.flushOrificeDiameterMm}
          unit="mm"
          min={1.5}
          max={8.0}
          step={0.1}
          formatValue={(v) => v.toFixed(1)}
          onChange={(val) => update({ flushOrificeDiameterMm: val })}
          colorAccent={inputs.flushOrificeDiameterMm < 3.0 ? 'amber' : 'green'}
          minLabel="1.5mm (Risk)"
          maxLabel="8.0mm (API 682 min Ø3mm)"
        />
      )}

      <ControlSlider
        id="slider-temp-rise"
        label="Allowable Flush ΔT"
        value={inputs.allowableFlushTempRiseC || 8}
        unit="°C"
        min={2}
        max={20}
        step={1}
        onChange={(val) => update({ allowableFlushTempRiseC: val })}
        colorAccent="orange"
      />

      <ControlSelect
        id="select-face-materials"
        label="Face Material Pair"
        value={inputs.faceMaterials || 'carbon_vs_sic'}
        onChange={(val) => update({ faceMaterials: val as SealFaceMaterial })}
        options={[
          { value: 'carbon_vs_sic', label: 'Carbon vs Silicon Carbide (f = 0.05)' },
          { value: 'sic_vs_sic', label: 'SiC vs SiC (Hard faces, abrasive)' },
          { value: 'carbon_vs_tc', label: 'Carbon vs Tungsten Carbide' },
          { value: 'tc_vs_tc', label: 'TC vs TC (Severe slurry)' },
        ]}
      />

      {hasCooler && (
        <ControlSlider
          id="slider-cooler-capacity"
          label="Cooler Capacity"
          value={inputs.coolerCapacityKW ?? 5.0}
          unit="kW"
          min={0}
          max={20}
          step={0.5}
          formatValue={(v) => v.toFixed(1)}
          onChange={(val) => update({ coolerCapacityKW: val })}
          colorAccent="green"
        />
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
          simulatorType="seal-flush-plan"
          inputs={inputs}
          unitSystem={unitSystem}
          coachStandard="API 682 4th Ed. §6 & §7"
          coachRuleOfThumb="For Plan 53A dual seals, maintain barrier pressure at least 1.4 bar (20 psi) above seal chamber pressure to prevent hazardous process leakage."
          coachFieldTip="Restriction orifices smaller than 3.0 mm (1/8 in) are prohibited by API 682 due to catastrophic fouling plugging risks."
        />
      }
      tabs={[
        {
          id: 'chamber',
          label: 'Chamber',
          icon: <Gauge size={12} className="text-[#3fb950]" />,
          content: chamberTabContent,
        },
        {
          id: 'plan',
          label: 'Plan & Fluid',
          icon: <Cpu size={12} className="text-[#58a6ff]" />,
          content: planTabContent,
        },
        {
          id: 'limits',
          label: 'Orifice & Adv',
          icon: <ShieldCheck size={12} className="text-amber-400" />,
          content: limitsTabContent,
        },
      ]}
    />
  );
};
