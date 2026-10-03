import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  Download,
  Zap,
  Leaf,
  DollarSign,
  TrendingDown,
  Activity,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Clock,
  Globe,
} from 'lucide-react';
import {
  calculateExergyAndCarbon,
  ExergyCarbonInputs,
  ExergyCarbonOutputs,
} from '../../physics/exergyCarbonMath';
import { STANDARDS_SAFE_DISCLAIMER_SHORT } from '../../utils/standardsSafeHarbor';

interface ExergyCarbonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EquipmentPreset {
  id: string;
  name: string;
  tag: string;
  inputs: ExergyCarbonInputs;
}

const EQUIPMENT_PRESETS: EquipmentPreset[] = [
  {
    id: 'bfw-pump',
    name: 'Multi-Stage High-Pressure Boiler Feed Water Pump',
    tag: 'BFW-101A',
    inputs: {
      assetName: 'High-Pressure BFW Pump 101-A',
      shaftPowerKw: 520,
      driverEfficiencyPercent: 95.2,
      fluidFlowM3_h: 240,
      pressureRiseBar: 62,
      fluidDensityKg_m3: 980,
      ambientTempC: 25,
      operatingHoursPerYear: 8200,
      electricityCostPerKwh: 0.115,
      gridCarbonIntensityKgCo2_kwh: 0.42,
      degradationFactorPercent: 6,
    },
  },
  {
    id: 'gas-compressor',
    name: 'Centrifugal Natural Gas Export Compressor',
    tag: 'K-201',
    inputs: {
      assetName: 'Natural Gas Export Compressor K-201',
      shaftPowerKw: 1450,
      driverEfficiencyPercent: 96.0,
      fluidFlowM3_h: 1800,
      pressureRiseBar: 24,
      fluidDensityKg_m3: 18,
      ambientTempC: 20,
      operatingHoursPerYear: 8400,
      electricityCostPerKwh: 0.098,
      gridCarbonIntensityKgCo2_kwh: 0.48,
      degradationFactorPercent: 4,
    },
  },
  {
    id: 'crude-pipeline',
    name: 'Crude Oil Mainline Pipeline Booster Pump',
    tag: 'P-302B',
    inputs: {
      assetName: 'Crude Pipeline Booster P-302B',
      shaftPowerKw: 780,
      driverEfficiencyPercent: 94.8,
      fluidFlowM3_h: 650,
      pressureRiseBar: 35,
      fluidDensityKg_m3: 860,
      ambientTempC: 22,
      operatingHoursPerYear: 7800,
      electricityCostPerKwh: 0.125,
      gridCarbonIntensityKgCo2_kwh: 0.52,
      degradationFactorPercent: 8,
    },
  },
  {
    id: 'cooling-water',
    name: 'Cooling Tower Water Circulation Pump',
    tag: 'CWP-401',
    inputs: {
      assetName: 'Cooling Tower Circulation Pump CWP-401',
      shaftPowerKw: 310,
      driverEfficiencyPercent: 93.5,
      fluidFlowM3_h: 1850,
      pressureRiseBar: 4.2,
      fluidDensityKg_m3: 1000,
      ambientTempC: 30,
      operatingHoursPerYear: 8760,
      electricityCostPerKwh: 0.13,
      gridCarbonIntensityKgCo2_kwh: 0.38,
      degradationFactorPercent: 12,
    },
  },
];

export const ExergyCarbonModal: React.FC<ExergyCarbonModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('bfw-pump');

  // Input states
  const [shaftPowerKw, setShaftPowerKw] = useState<number>(520);
  const [driverEffPercent, setDriverEffPercent] = useState<number>(95.2);
  const [fluidFlowM3_h, setFluidFlowM3_h] = useState<number>(240);
  const [pressureRiseBar, setPressureRiseBar] = useState<number>(62);
  const [operatingHours, setOperatingHours] = useState<number>(8200);
  const [elecCost, setElecCost] = useState<number>(0.115);
  const [carbonIntensity, setCarbonIntensity] = useState<number>(0.42);
  const [degradation, setDegradation] = useState<number>(6);

  const handleApplyPreset = (preset: EquipmentPreset) => {
    setSelectedPresetId(preset.id);
    setShaftPowerKw(preset.inputs.shaftPowerKw);
    setDriverEffPercent(preset.inputs.driverEfficiencyPercent);
    setFluidFlowM3_h(preset.inputs.fluidFlowM3_h);
    setPressureRiseBar(preset.inputs.pressureRiseBar);
    setOperatingHours(preset.inputs.operatingHoursPerYear);
    setElecCost(preset.inputs.electricityCostPerKwh);
    setCarbonIntensity(preset.inputs.gridCarbonIntensityKgCo2_kwh);
    setDegradation(preset.inputs.degradationFactorPercent);
  };

  const results: ExergyCarbonOutputs = useMemo(() => {
    return calculateExergyAndCarbon({
      assetName: EQUIPMENT_PRESETS.find((p) => p.id === selectedPresetId)?.name || 'Machinery Asset',
      shaftPowerKw,
      driverEfficiencyPercent: driverEffPercent,
      fluidFlowM3_h,
      pressureRiseBar,
      fluidDensityKg_m3: 980,
      ambientTempC: 25,
      operatingHoursPerYear: operatingHours,
      electricityCostPerKwh: elecCost,
      gridCarbonIntensityKgCo2_kwh: carbonIntensity,
      degradationFactorPercent: degradation,
    });
  }, [
    selectedPresetId,
    shaftPowerKw,
    driverEffPercent,
    fluidFlowM3_h,
    pressureRiseBar,
    operatingHours,
    elecCost,
    carbonIntensity,
    degradation,
  ]);

  const handleExportReport = () => {
    const report = `# THERMODYNAMIC EXERGY DESTRUCTION, ENERGY RECOVERY & DECARBONIZATION DOSSIER
Reference: ISO 14040 / ISO 15663 / ASME PTC 10
Generated: ${new Date().toISOString()}

## 1. Operating Point & Power Flow
- Electrical Grid Power Drawn: ${results.electricalInputPowerKw} kW
- Shaft Coupling Power: ${shaftPowerKw} kW
- Useful Hydraulic / Fluid Power: ${results.usefulFluidPowerKw} kW
- 1st Law Thermal/Mechanical Efficiency: ${results.firstLawEfficiencyPercent}%
- 2nd Law Exergy Efficiency: ${results.secondLawExergyEfficiencyPercent}%
- Exergy Destruction Rate: ${results.exergyDestructionKw} kW

## 2. Economics & Carbon Footprint
- Annual Energy Consumption: ${results.annualEnergyConsumptionMwh.toLocaleString()} MWh/year
- Annual Electricity Bill: $${results.annualElectricityCostUsd.toLocaleString()} / year
- Annual CO2e Carbon Footprint: ${results.annualCarbonFootprintTonsCo2} Metric Tons CO2e/year
- Continuous Carbon Emission Rate: ${results.carbonEmissionRateKgPerHour} kg CO2e / operating hour
- 10-Year Discounted Life-Cycle Cost: $${results.tenYearLifeCycleCostUsd.toLocaleString()}
- 20-Year Discounted Life-Cycle Cost: $${results.twentyYearLifeCycleCostUsd.toLocaleString()}

## 3. Decarbonization & Efficiency Abatement Opportunities
${results.optimizationOptions
  .map(
    (opt, i) => `### Initiative ${i + 1}: ${opt.title}
- Scope: ${opt.description}
- Power Saved: ${opt.powerSavedKw} kW (${opt.annualCo2SavedTons} tons CO2e/year avoided)
- Annual Operating Cost Savings: $${opt.annualCostSavedUsd.toLocaleString()} / year
- Estimated CAPEX: $${opt.estCapexUsd.toLocaleString()}
- Simple Payback Period: ${opt.simplePaybackMonths} months`
  )
  .join('\n\n')}

---
${STANDARDS_SAFE_DISCLAIMER_SHORT}
`;

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Exergy_Carbon_Decarbonization_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      id="exergy-carbon-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div
        id="exergy-carbon-modal-container"
        className="relative flex flex-col w-full max-w-6xl max-h-[92vh] bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden text-[#c9d1d9]"
      >
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#161b22] border-b border-[#30363d] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
              <Leaf size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-500/30">
                  Pillar 13 • Decarbonization Engine
                </span>
                <span className="text-[10px] font-mono text-[#8b949e]">
                  ISO 14040 / ISO 15663 / 2nd-Law Exergy
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Machinery Exergy Destruction, Energy Recovery & Carbon Footprint Simulator
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-export-exergy-report"
              type="button"
              onClick={handleExportReport}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold text-white bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded transition-colors"
            >
              <Download size={13} className="text-[#58a6ff]" />
              <span>Export Dossier</span>
            </button>

            <button
              id="btn-close-exergy-modal"
              type="button"
              onClick={onClose}
              className="p-1 text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-[#0d1117] border-b border-[#30363d] overflow-x-auto shrink-0">
          <span className="text-[11px] font-mono text-[#8b949e] whitespace-nowrap">
            Machinery System Presets:
          </span>
          {EQUIPMENT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className={`px-3 py-1 text-xs font-mono rounded whitespace-nowrap transition-colors ${
                selectedPresetId === p.id
                  ? 'bg-emerald-900/50 text-white font-bold border border-emerald-500/50'
                  : 'bg-[#161b22] text-[#8b949e] hover:text-white border border-[#30363d]'
              }`}
            >
              <span className="text-emerald-400 font-bold mr-1">[{p.tag}]</span> {p.name}
            </button>
          ))}
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Top Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg">
              <span className="text-[10px] font-mono uppercase text-[#8b949e] block">
                Annual Electricity Cost
              </span>
              <div className="text-xl sm:text-2xl font-mono font-bold text-amber-400 mt-0.5">
                ${results.annualElectricityCostUsd.toLocaleString()}
              </div>
              <span className="text-[10px] font-mono text-[#8b949e]">
                {results.annualEnergyConsumptionMwh.toLocaleString()} MWh / year
              </span>
            </div>

            <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg">
              <span className="text-[10px] font-mono uppercase text-[#8b949e] block">
                Annual Carbon Footprint
              </span>
              <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-400 mt-0.5">
                {results.annualCarbonFootprintTonsCo2} t CO₂e
              </div>
              <span className="text-[10px] font-mono text-[#8b949e]">
                {results.carbonEmissionRateKgPerHour} kg CO₂e / operating hr
              </span>
            </div>

            <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg">
              <span className="text-[10px] font-mono uppercase text-[#8b949e] block">
                Exergy Destruction Rate
              </span>
              <div className="text-xl sm:text-2xl font-mono font-bold text-rose-400 mt-0.5">
                {results.exergyDestructionKw} kW
              </div>
              <span className="text-[10px] font-mono text-[#8b949e]">
                Irreversible Thermal Dissipation
              </span>
            </div>

            <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg">
              <span className="text-[10px] font-mono uppercase text-[#8b949e] block">
                20-Year Life Cycle Cost (LCC)
              </span>
              <div className="text-xl sm:text-2xl font-mono font-bold text-cyan-300 mt-0.5">
                ${(results.twentyYearLifeCycleCostUsd / 1e6).toFixed(2)}M USD
              </div>
              <span className="text-[10px] font-mono text-[#8b949e]">
                5% Discounted Cumulative OpEx
              </span>
            </div>
          </div>

          {/* Middle Row: Operational Parameters + Power Balance Flow */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Controls (5 cols) */}
            <div className="lg:col-span-5 space-y-3 bg-[#161b22] p-4 rounded-lg border border-[#30363d]">
              <span className="text-xs font-mono font-bold text-white uppercase block pb-2 border-b border-[#30363d]">
                Operational Parameters & Grid Factors
              </span>

              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#c9d1d9]">Shaft Mechanical Power:</span>
                    <span className="text-white font-bold">{shaftPowerKw} kW</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={2500}
                    step={10}
                    value={shaftPowerKw}
                    onChange={(e) => setShaftPowerKw(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#c9d1d9]">Process Fluid Flow Rate:</span>
                    <span className="text-white font-bold">{fluidFlowM3_h} m³/h</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={2500}
                    step={20}
                    value={fluidFlowM3_h}
                    onChange={(e) => setFluidFlowM3_h(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#c9d1d9]">Total Head / Pressure Rise:</span>
                    <span className="text-white font-bold">{pressureRiseBar} bar</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={120}
                    step={1}
                    value={pressureRiseBar}
                    onChange={(e) => setPressureRiseBar(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#30363d] text-xs font-mono">
                  <div>
                    <label className="text-[10px] font-mono text-[#8b949e] block">Annual Hours (hrs):</label>
                    <input
                      type="number"
                      value={operatingHours}
                      onChange={(e) => setOperatingHours(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-[#0d1117] border border-[#30363d] rounded text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-[#8b949e] block">Tariff ($/kWh):</label>
                    <input
                      type="number"
                      step={0.01}
                      value={elecCost}
                      onChange={(e) => setElecCost(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-[#0d1117] border border-[#30363d] rounded text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <label className="text-[10px] font-mono text-[#8b949e] block">Grid CO₂ (kg/kWh):</label>
                    <input
                      type="number"
                      step={0.05}
                      value={carbonIntensity}
                      onChange={(e) => setCarbonIntensity(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-[#0d1117] border border-[#30363d] rounded text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-[#8b949e] block">Wear Degradation (%):</label>
                    <input
                      type="number"
                      value={degradation}
                      onChange={(e) => setDegradation(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-[#0d1117] border border-[#30363d] rounded text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Thermodynamic Energy Balance Flow (7 cols) */}
            <div className="lg:col-span-7 space-y-3 bg-[#161b22] p-4 rounded-lg border border-[#30363d]">
              <span className="text-xs font-mono font-bold text-white uppercase block pb-2 border-b border-[#30363d]">
                1st-Law Energy & 2nd-Law Exergy Dissipation Breakdown
              </span>

              {/* Visual Flow Stages */}
              <div className="p-3 bg-[#0d1117] rounded border border-[#30363d]/60 space-y-3">
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#8b949e]">1. Electrical Grid Power Drawn:</span>
                    <span className="text-white font-bold">{results.electricalInputPowerKw} kW (100%)</span>
                  </div>
                  <div className="w-full bg-[#161b22] h-2.5 rounded overflow-hidden">
                    <div className="h-full bg-blue-500 w-full" />
                  </div>
                </div>

                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#8b949e]">2. Mechanical Shaft Power Delivered:</span>
                    <span className="text-cyan-300 font-bold">
                      {shaftPowerKw} kW ({((shaftPowerKw / results.electricalInputPowerKw) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#161b22] h-2.5 rounded overflow-hidden">
                    <div
                      className="h-full bg-cyan-500"
                      style={{ width: `${(shaftPowerKw / results.electricalInputPowerKw) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#8b949e]">3. Useful Process Fluid Power (Output):</span>
                    <span className="text-emerald-400 font-bold">
                      {results.usefulFluidPowerKw} kW ({results.firstLawEfficiencyPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#161b22] h-2.5 rounded overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${Math.min(100, results.firstLawEfficiencyPercent)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#8b949e]">4. Irreversible Losses & Exergy Destruction:</span>
                    <span className="text-rose-400 font-bold">
                      {results.totalLossPowerKw} kW ({((results.totalLossPowerKw / results.electricalInputPowerKw) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#161b22] h-2.5 rounded overflow-hidden">
                    <div
                      className="h-full bg-rose-500"
                      style={{ width: `${Math.min(100, (results.totalLossPowerKw / results.electricalInputPowerKw) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Decarbonization Optimization Initiatives */}
              <div className="pt-2">
                <span className="text-xs font-mono font-bold text-white uppercase block mb-2">
                  Actionable Decarbonization & Efficiency Initiatives (ISO 15663)
                </span>

                <div className="space-y-2">
                  {results.optimizationOptions.map((opt, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#0d1117] rounded border border-emerald-500/30 text-xs font-mono space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{opt.title}</span>
                        <span className="text-emerald-400 font-bold">
                          -${opt.annualCostSavedUsd.toLocaleString()} / yr
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8b949e]">{opt.description}</p>
                      <div className="flex flex-wrap gap-3 text-[10px] text-[#c9d1d9] pt-1">
                        <span>Power Saved: <b className="text-white">{opt.powerSavedKw} kW</b></span>
                        <span>CO₂ Avoided: <b className="text-emerald-400">{opt.annualCo2SavedTons} t/yr</b></span>
                        <span>Payback: <b className="text-cyan-300">{opt.simplePaybackMonths} Months</b></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-2.5 bg-[#161b22] border-t border-[#30363d] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#8b949e] shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
            <span>{STANDARDS_SAFE_DISCLAIMER_SHORT}</span>
          </div>
          <span>Thermodynamic Second-Law Exergy Formulation</span>
        </div>
      </div>
    </div>
  );
};
