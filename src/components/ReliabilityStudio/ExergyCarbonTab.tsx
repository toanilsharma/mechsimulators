import React, { useState, useMemo } from 'react';
import {
  SimulatorId,
  UnitSystem,
} from '../../types/common';
import {
  calculateExergyAndCarbon,
  ExergyCarbonInputs,
} from '../../physics/exergyCarbonMath';
import {
  Zap,
  Leaf,
  DollarSign,
  TrendingDown,
  Clock,
  ShieldCheck,
  ChevronRight,
  Flame,
  Activity,
} from 'lucide-react';
import { STANDARDS_SAFE_DISCLAIMER_SHORT } from '../../utils/standardsSafeHarbor';

interface ExergyCarbonTabProps {
  selectedSim: SimulatorId;
  unitSystem: UnitSystem;
  simInputs: Record<string, any>;
  simOutputs: Record<string, any>;
}

export const ExergyCarbonTab: React.FC<ExergyCarbonTabProps> = ({
  selectedSim,
  unitSystem,
  simInputs,
  simOutputs,
}) => {
  // Configurable economic and thermodynamic parameters
  const [electricityCost, setElectricityCost] = useState<number>(0.12); // $/kWh
  const [operatingHours, setOperatingHours] = useState<number>(8000); // hrs/yr
  const [gridCarbonFactor, setGridCarbonFactor] = useState<number>(0.42); // kg CO2e / kWh
  const [driverEfficiency, setDriverEfficiency] = useState<number>(94.5); // %
  const [degradationFactor, setDegradationFactor] = useState<number>(6.0); // % wear

  // Map inputs from current simulation
  const exergyInputs: ExergyCarbonInputs = useMemo(() => {
    let shaftPower = 120;
    let flowM3_h = 100;
    let pressureRiseBar = 4.5;

    if (selectedSim === 'pump') {
      shaftPower = simOutputs.powerKw || 95;
      flowM3_h = simInputs.flowM3_h || 120;
      pressureRiseBar = (simOutputs.headM || 45) * 0.0981;
    } else if (selectedSim === 'compressor') {
      shaftPower = simOutputs.shaftPowerKw || 380;
      flowM3_h = (simInputs.massFlowKg_s || 30) * 2.8;
      pressureRiseBar = (simInputs.suctionPressureBar || 12) * ((simOutputs.pressureRatio || 3.2) - 1);
    } else if (selectedSim === 'rotor') {
      shaftPower = 250;
      flowM3_h = 80;
      pressureRiseBar = 8.0;
    }

    return {
      assetName: selectedSim.toUpperCase(),
      shaftPowerKw: shaftPower,
      driverEfficiencyPercent: driverEfficiency,
      fluidFlowM3_h: flowM3_h,
      pressureRiseBar: pressureRiseBar,
      fluidDensityKg_m3: 1000,
      ambientTempC: 20,
      operatingHoursPerYear: operatingHours,
      electricityCostPerKwh: electricityCost,
      gridCarbonIntensityKgCo2_kwh: gridCarbonFactor,
      degradationFactorPercent: degradationFactor,
    };
  }, [selectedSim, simInputs, simOutputs, driverEfficiency, operatingHours, electricityCost, gridCarbonFactor, degradationFactor]);

  const results = useMemo(() => {
    return calculateExergyAndCarbon(exergyInputs);
  }, [exergyInputs]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 bg-[#0d1117] border border-[#30363d] rounded flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 flex items-center gap-1.5">
            <Leaf size={13} />
            <span>Thermodynamic Exergy Destruction & Life-Cycle Carbon (LCC)</span>
          </div>
          <h2 className="text-sm sm:text-base font-bold text-white font-mono">
            {selectedSim.toUpperCase()} Energy Dissipation & Emissions Abatement Studio
          </h2>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-[#8b949e]">
          <span>Ref Benchmark: ISO 14040 / 15663</span>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded">
          <div className="text-[10px] uppercase text-[#8b949e]">Grid Input Power</div>
          <div className="text-lg sm:text-xl font-bold text-amber-400">
            {results.electricalInputPowerKw} <span className="text-xs text-[#8b949e]">kW</span>
          </div>
          <div className="text-[10px] text-[#8b949e]">
            Shaft: {exergyInputs.shaftPowerKw.toFixed(1)} kW (Motor Eff: {driverEfficiency}%)
          </div>
        </div>

        <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded">
          <div className="text-[10px] uppercase text-[#8b949e]">Exergy Destruction Rate</div>
          <div className="text-lg sm:text-xl font-bold text-rose-400 flex items-center gap-1">
            <Flame size={16} />
            <span>{results.exergyDestructionKw}</span> <span className="text-xs text-[#8b949e]">kW</span>
          </div>
          <div className="text-[10px] text-[#8b949e]">
            2nd Law Efficiency: {results.secondLawExergyEfficiencyPercent}%
          </div>
        </div>

        <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded">
          <div className="text-[10px] uppercase text-[#8b949e]">Annual Electricity Cost</div>
          <div className="text-lg sm:text-xl font-bold text-emerald-400">
            ${(results.annualElectricityCostUsd / 1000).toFixed(1)}k <span className="text-xs text-[#8b949e]">/ yr</span>
          </div>
          <div className="text-[10px] text-[#8b949e]">
            {results.annualEnergyConsumptionMwh.toLocaleString()} MWh/yr @ ${electricityCost}/kWh
          </div>
        </div>

        <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded">
          <div className="text-[10px] uppercase text-[#8b949e]">Annual Carbon Footprint</div>
          <div className="text-lg sm:text-xl font-bold text-cyan-400">
            {results.annualCarbonFootprintTonsCo2} <span className="text-xs text-[#8b949e]">tons CO₂e</span>
          </div>
          <div className="text-[10px] text-[#8b949e]">
            Rate: {results.carbonEmissionRateKgPerHour} kg CO₂e / hour
          </div>
        </div>
      </div>

      {/* Energy Balance Breakdown & Sankey Proportions */}
      <div className="p-4 bg-[#0d1117] border border-[#30363d] rounded space-y-3 font-mono">
        <div className="flex justify-between items-center border-b border-[#30363d] pb-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            First & Second Law Energy Flow Distribution
          </span>
          <span className="text-[11px] text-[#8b949e]">
            1st-Law Hydraulic Efficiency: {results.firstLawEfficiencyPercent}%
          </span>
        </div>

        {/* Visual Partition Bar */}
        <div className="w-full bg-[#161b22] h-6 rounded-md overflow-hidden flex border border-[#30363d] text-[10px] font-bold">
          <div
            className="bg-emerald-600 flex items-center justify-center text-white px-2 transition-all"
            style={{ width: `${Math.max(5, results.firstLawEfficiencyPercent)}%` }}
            title={`Useful Fluid Work: ${results.usefulFluidPowerKw} kW`}
          >
            Fluid Work ({results.firstLawEfficiencyPercent}%)
          </div>
          <div
            className="bg-amber-600 flex items-center justify-center text-white px-2 transition-all"
            style={{ width: `${Math.max(5, 100 - results.firstLawEfficiencyPercent - 6)}%` }}
            title={`Thermal & Hydraulic Dissipation: ${(results.totalLossPowerKw * 0.7).toFixed(1)} kW`}
          >
            Hydraulic Losses
          </div>
          <div
            className="bg-rose-600 flex items-center justify-center text-white px-2 transition-all"
            style={{ width: '6%' }}
            title="Motor & Bearing Dissipation"
          >
            Driver Loss
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-2 bg-[#161b22] rounded border border-[#30363d]">
            <div className="text-[#8b949e] text-[10px]">Useful Fluid Power</div>
            <div className="text-white font-bold">{results.usefulFluidPowerKw} kW</div>
          </div>
          <div className="p-2 bg-[#161b22] rounded border border-[#30363d]">
            <div className="text-[#8b949e] text-[10px]">Total Power Dissipated</div>
            <div className="text-rose-400 font-bold">{results.totalLossPowerKw} kW</div>
          </div>
          <div className="p-2 bg-[#161b22] rounded border border-[#30363d]">
            <div className="text-[#8b949e] text-[10px]">10-Year Discounted LCC</div>
            <div className="text-amber-400 font-bold">${(results.tenYearLifeCycleCostUsd / 1000).toFixed(0)}k USD</div>
          </div>
        </div>
      </div>

      {/* Industrial Optimization & Decarbonization Roadmap */}
      <div className="p-4 bg-[#0d1117] border border-[#30363d] rounded space-y-3 font-mono">
        <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <TrendingDown size={14} className="text-emerald-400" />
            <span>Decarbonization & Energy Conservation Initiatives</span>
          </span>
          <span className="text-[10px] text-[#8b949e]">
            Prioritized by Simple Payback Timeline
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {results.optimizationOptions.map((opt, i) => (
            <div
              key={i}
              className="p-3 bg-[#161b22] border border-[#30363d] rounded flex flex-col justify-between space-y-2.5"
            >
              <div>
                <div className="text-xs font-bold text-white">{opt.title}</div>
                <div className="text-[10px] text-[#8b949e] mt-1 leading-relaxed">{opt.description}</div>
              </div>

              <div className="space-y-1 text-[11px] pt-2 border-t border-[#30363d]">
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Power Reduction:</span>
                  <span className="text-emerald-400 font-bold">-{opt.powerSavedKw} kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Annual Savings:</span>
                  <span className="text-white font-bold">${opt.annualCostSavedUsd.toLocaleString()} / yr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">CO₂ Avoided:</span>
                  <span className="text-cyan-400 font-bold">-{opt.annualCo2SavedTons} tons/yr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Simple Payback:</span>
                  <span className="text-amber-400 font-bold">{opt.simplePaybackMonths} months</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Adjustable Parameters Sliders */}
      <div className="p-4 bg-[#0d1117] border border-[#30363d] rounded space-y-3 font-mono text-xs">
        <div className="border-b border-[#30363d] pb-2 text-xs font-bold text-white uppercase tracking-wider">
          Economic & Site Operating Conditions
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="flex justify-between text-[#8b949e] mb-1">
              <span>Electricity Cost:</span>
              <span className="text-white">${electricityCost}/kWh</span>
            </div>
            <input
              type="range"
              min={0.05}
              max={0.35}
              step={0.01}
              value={electricityCost}
              onChange={(e) => setElectricityCost(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[#8b949e] mb-1">
              <span>Operating Hours/Yr:</span>
              <span className="text-white">{operatingHours} hrs</span>
            </div>
            <input
              type="range"
              min={2000}
              max={8760}
              step={200}
              value={operatingHours}
              onChange={(e) => setOperatingHours(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[#8b949e] mb-1">
              <span>Grid Carbon Factor:</span>
              <span className="text-white">{gridCarbonFactor} kg/kWh</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={0.9}
              step={0.02}
              value={gridCarbonFactor}
              onChange={(e) => setGridCarbonFactor(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[#8b949e] mb-1">
              <span>Motor Efficiency:</span>
              <span className="text-white">{driverEfficiency}%</span>
            </div>
            <input
              type="range"
              min={85}
              max={98}
              step={0.5}
              value={driverEfficiency}
              onChange={(e) => setDriverEfficiency(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Safe Harbor Legal Benchmark Notice */}
      <div className="p-3 bg-[#080b10] border border-[#30363d] rounded text-[10px] text-[#8b949e] font-mono leading-relaxed">
        <span className="text-amber-400 font-bold uppercase mr-1">Industry Reference Benchmark:</span>
        {STANDARDS_SAFE_DISCLAIMER_SHORT} Energy and lifecycle carbon assessments align with ISO 14040 and ISO 15663 educational life cycle costing frameworks under generic regional grid parameters.
      </div>
    </div>
  );
};
