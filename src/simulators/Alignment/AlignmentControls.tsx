import React, { useState } from 'react';
import { AlignmentInputs, CasingMaterial, CouplingType, AlignmentMethod } from '../../types/alignment';
import { UnitSystem } from '../../types/common';
import { ALIGNMENT_SCENARIOS } from '../../engine/scenarios';
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
  Thermometer,
} from 'lucide-react';

interface AlignmentControlsProps {
  inputs: AlignmentInputs;
  onChange: (inputs: AlignmentInputs) => void;
  unitSystem: UnitSystem;
  activeScenarioId?: string;
  onSelectScenario?: (scenarioId: string) => void;
  scenarios?: any[];
}

export const AlignmentControls: React.FC<AlignmentControlsProps> = ({
  inputs,
  onChange,
  unitSystem,
  activeScenarioId,
  onSelectScenario,
  scenarios,
}) => {
  const [activeTab, setActiveTab] = useState<string>('offsets');

  const update = (patch: Partial<AlignmentInputs>) => {
    onChange({ ...inputs, ...patch });
  };

  const currentScenarioId = activeScenarioId || 'api686-normal';
  const scenarioList = scenarios || ALIGNMENT_SCENARIOS;

  const handleScenarioChange = (scenarioId: string) => {
    if (onSelectScenario) {
      onSelectScenario(scenarioId);
    }
    const found = scenarioList.find((s: any) => s.id === scenarioId);
    if (found?.inputs) {
      onChange({ ...found.inputs });
    }
  };

  const activeScenarioObj = scenarioList.find((s: any) => s.id === currentScenarioId);

  const scenarioOptions = [
    { value: 'api686-normal', label: 'API 686 Standard (Cold Target Aligned)', group: 'Baseline' },
    { value: 'thermal-offset-neglected', label: 'Thermal Offset Neglected (Hot Misalignment)', group: 'Failure Cases' },
    { value: 'severe-coupling-cocking', label: 'Severe Angular Cocking (2X Vibration)', group: 'Failure Cases' },
    { value: 'soft-foot-violation', label: 'Soft Foot Baseplate Distortion (>0.05mm)', group: 'Mechanical Faults' },
  ];

  // 1. Offsets & Measured Metrology Tab
  const offsetsTabContent = (
    <InputSection title="Measured Alignment & Speed" icon={<Gauge size={12} className="text-[#3fb950]" />} badge="Laser Sweep">
      <ControlSlider
        id="slider-motor-rpm"
        label="Shaft Operating Speed"
        value={inputs.motorRpm}
        unit="RPM"
        min={900}
        max={4000}
        step={50}
        onChange={(val) => update({ motorRpm: val })}
        colorAccent="blue"
        standardRef="API Envelope"
      />

      <ControlSlider
        id="slider-measured-vert-offset"
        label="Vertical Parallel Offset"
        value={inputs.measuredVerticalOffsetMm}
        unit="mm"
        min={-0.5}
        max={0.5}
        step={0.01}
        formatValue={(v) => (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2))}
        onChange={(val) => update({ measuredVerticalOffsetMm: val })}
        colorAccent={Math.abs(inputs.measuredVerticalOffsetMm) > 0.08 ? 'red' : 'green'}
        minLabel="-0.50mm"
        maxLabel="+0.50mm"
      />

      <ControlSlider
        id="slider-measured-vert-angle"
        label="Vertical Angular Tilt"
        value={inputs.measuredVerticalAngleMrad}
        unit="mrad"
        min={-1.5}
        max={1.5}
        step={0.05}
        formatValue={(v) => (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2))}
        onChange={(val) => update({ measuredVerticalAngleMrad: val })}
        colorAccent={Math.abs(inputs.measuredVerticalAngleMrad) > 0.5 ? 'red' : 'amber'}
        minLabel="-1.50mrad"
        maxLabel="+1.50mrad"
      />

      <ControlSlider
        id="slider-measured-horiz-offset"
        label="Horizontal Offset"
        value={inputs.measuredHorizontalOffsetMm}
        unit="mm"
        min={-0.4}
        max={0.4}
        step={0.01}
        formatValue={(v) => (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2))}
        onChange={(val) => update({ measuredHorizontalOffsetMm: val })}
        colorAccent={Math.abs(inputs.measuredHorizontalOffsetMm) > 0.08 ? 'red' : 'green'}
      />

      <ControlSlider
        id="slider-measured-horiz-angle"
        label="Horizontal Angular Tilt"
        value={inputs.measuredHorizontalAngleMrad}
        unit="mrad"
        min={-1.0}
        max={1.0}
        step={0.05}
        formatValue={(v) => (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2))}
        onChange={(val) => update({ measuredHorizontalAngleMrad: val })}
        colorAccent={Math.abs(inputs.measuredHorizontalAngleMrad) > 0.5 ? 'red' : 'amber'}
      />
    </InputSection>
  );

  // 2. Machine Train Geometry Tab
  const geometryTabContent = (
    <InputSection title="Machinery Train Geometry" icon={<Cpu size={12} className="text-[#58a6ff]" />} badge="Dimensions">
      <ControlSlider
        id="slider-spacer-length"
        label="Coupling DBSE (Spacer)"
        value={inputs.couplingSpacerLengthMm}
        unit="mm"
        min={80}
        max={250}
        step={5}
        onChange={(val) => update({ couplingSpacerLengthMm: val })}
        colorAccent="blue"
        standardRef="DBSE"
      />

      <ControlSlider
        id="slider-dist-b"
        label="Coupling to Front Foot (B)"
        value={inputs.distCouplingToMotorFrontFootMm}
        unit="mm"
        min={100}
        max={400}
        step={10}
        onChange={(val) => update({ distCouplingToMotorFrontFootMm: val })}
        colorAccent="orange"
      />

      <ControlSlider
        id="slider-dist-c"
        label="Front to Rear Foot (C)"
        value={inputs.distMotorFrontToRearFootMm}
        unit="mm"
        min={150}
        max={600}
        step={10}
        onChange={(val) => update({ distMotorFrontToRearFootMm: val })}
        colorAccent="orange"
      />

      <ControlSlider
        id="slider-pump-height"
        label="Pump Centerline Height H_P"
        value={inputs.pumpCenterlineHeightMm}
        unit="mm"
        min={160}
        max={450}
        step={10}
        onChange={(val) => update({ pumpCenterlineHeightMm: val })}
        colorAccent="blue"
      />
    </InputSection>
  );

  // 3. Thermal Growth & Soft Foot Tab
  const thermalTabContent = (
    <InputSection title="Thermal Lift & Soft Foot" icon={<Thermometer size={12} className="text-rose-400" />} badge="L·α·ΔT">
      <ControlSlider
        id="slider-pump-fluid-temp"
        label="Process Fluid Temperature"
        value={inputs.pumpFluidTempC}
        unit="°C"
        min={20}
        max={240}
        step={5}
        onChange={(val) => update({ pumpFluidTempC: val })}
        colorAccent="orange"
        standardRef="Thermal ΔT"
      />

      <ControlSlider
        id="slider-motor-temp"
        label="Motor Operating Temp"
        value={inputs.motorOperatingTempC}
        unit="°C"
        min={30}
        max={90}
        step={1}
        onChange={(val) => update({ motorOperatingTempC: val })}
        colorAccent="amber"
      />

      <ControlSelect
        id="select-casing-material"
        label="Pump Casing Metallurgy"
        value={inputs.pumpCasingMaterial}
        onChange={(val) => update({ pumpCasingMaterial: val as CasingMaterial })}
        options={[
          { value: 'carbon_steel', label: 'Carbon Steel (11.7 µm/m·K)' },
          { value: 'cast_iron', label: 'Cast Iron (10.5 µm/m·K)' },
          { value: 'stainless_316', label: '316 SS (16.5 µm/m·K)' },
          { value: 'chrome_steel', label: '12% Cr Steel (11.0 µm/m·K)' },
        ]}
      />

      <ControlSlider
        id="slider-soft-foot-worst"
        label="Worst Soft Foot Gap"
        value={Math.max(
          inputs.softFootFrontLeftMm,
          inputs.softFootFrontRightMm,
          inputs.softFootRearLeftMm,
          inputs.softFootRearRightMm
        )}
        unit="mm"
        min={0}
        max={0.30}
        step={0.005}
        formatValue={(v) => v.toFixed(3)}
        onChange={(val) => {
          update({
            softFootFrontLeftMm: val,
            softFootFrontRightMm: val > 0.05 ? val * 0.4 : 0,
            softFootRearLeftMm: 0,
            softFootRearRightMm: 0,
          });
        }}
        colorAccent={
          Math.max(
            inputs.softFootFrontLeftMm,
            inputs.softFootFrontRightMm,
            inputs.softFootRearLeftMm,
            inputs.softFootRearRightMm
          ) > 0.05
            ? 'red'
            : 'green'
        }
        minLabel="0.00mm (Flat)"
        maxLabel="API 686 limit: 0.05mm"
      />

      <ControlSelect
        id="select-coupling-type"
        label="Coupling Style"
        value={inputs.couplingType}
        onChange={(val) => update({ couplingType: val as CouplingType })}
        options={[
          { value: 'metallic_disc_pack', label: 'Metallic Disc Pack (API 671)' },
          { value: 'elastomeric_jaw', label: 'Elastomeric Jaw/Tire' },
          { value: 'gear_coupling', label: 'Crowned Tooth Gear' },
          { value: 'diaphragm', label: 'Contoured Diaphragm' },
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
          simulatorType="alignment"
          inputs={inputs}
          unitSystem={unitSystem}
          coachStandard="API 686 2nd Ed Ch 7"
          coachRuleOfThumb="Hot operating machines must be aligned with intentional cold negative offsets. If a pump casing rises 0.50 mm when hot, set motor feet 0.50 mm lower cold."
          coachFieldTip="Always check and eliminate soft foot (< 0.05 mm) before taking final alignment sweep readings."
        />
      }
      tabs={[
        {
          id: 'offsets',
          label: 'Offsets',
          icon: <Gauge size={12} className="text-[#3fb950]" />,
          content: offsetsTabContent,
        },
        {
          id: 'geometry',
          label: 'Geometry',
          icon: <Cpu size={12} className="text-[#58a6ff]" />,
          content: geometryTabContent,
        },
        {
          id: 'thermal',
          label: 'Thermal & Soft',
          icon: <Thermometer size={12} className="text-rose-400" />,
          content: thermalTabContent,
        },
      ]}
    />
  );
};
