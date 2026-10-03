import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  Download,
  Activity,
  Play,
  TrendingUp,
  BarChart3,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Shuffle,
  Filter,
} from 'lucide-react';
import {
  runMonteCarloSimulation,
  MonteCarloVariable,
  MonteCarloSummary,
} from '../../physics/monteCarloMath';
import { STANDARDS_SAFE_DISCLAIMER_SHORT } from '../../utils/standardsSafeHarbor';

interface MonteCarloModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SimulationPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  variables: MonteCarloVariable[];
  evaluator: (inputs: Record<string, number>) => { primaryOutput: number; secondaryOutput: number };
  outputConfig: {
    name: string;
    unit: string;
    thresholdLimit: number;
    thresholdType: 'min' | 'max';
  };
}

const PRESETS: SimulationPreset[] = [
  {
    id: 'pump-npsh',
    name: 'Centrifugal Pump NPSH Margin & Cavitation Risk',
    category: 'API 610 / HI 9.6.1',
    description: 'Propagates suction pressure head, liquid temperature vapor pressure, and suction piping friction losses to assess NPSH margin ratio.',
    variables: [
      { name: 'Suction Head (m)', nominal: 4.5, uncertaintyPercent: 12, distribution: 'normal' },
      { name: 'Fluid Temp (°C)', nominal: 65, uncertaintyPercent: 8, distribution: 'normal' },
      { name: 'Flow Rate (m³/h)', nominal: 220, uncertaintyPercent: 10, distribution: 'uniform' },
      { name: 'Piping Friction Loss (m)', nominal: 1.2, uncertaintyPercent: 20, distribution: 'uniform' },
      { name: 'Impeller NPSHR (m)', nominal: 2.8, uncertaintyPercent: 5, distribution: 'normal' },
    ],
    evaluator: (v) => {
      // Vapor pressure estimate for water (Antoine equation approx)
      const T = v['Fluid Temp (°C)'];
      const P_vap_m = 0.05 * Math.exp(0.045 * T);
      const NPSHA = Math.max(0.5, v['Suction Head (m)'] - v['Piping Friction Loss (m)'] - P_vap_m + 10.13);
      const NPSHR = v['Impeller NPSHR (m)'] * Math.pow(v['Flow Rate (m³/h)'] / 220, 1.8);
      const marginRatio = NPSHA / Math.max(0.1, NPSHR);
      return { primaryOutput: Number(marginRatio.toFixed(3)), secondaryOutput: NPSHA };
    },
    outputConfig: {
      name: 'NPSH Margin Ratio (NPSHA / NPSHR)',
      unit: 'Ratio',
      thresholdLimit: 1.35, // API 610 recommends >= 1.35x
      thresholdType: 'min',
    },
  },
  {
    id: 'rotor-vibration',
    name: 'Turbomachinery Rotor Unbalance Vibration',
    category: 'API 684 / ISO 20816-1',
    description: 'Propagates residual unbalance mass, journal bearing damping variation, and speed drift to calculate peak shaft vibration displacement.',
    variables: [
      { name: 'Speed (RPM)', nominal: 4200, uncertaintyPercent: 3, distribution: 'normal' },
      { name: 'Residual Unbalance (g·mm)', nominal: 35, uncertaintyPercent: 25, distribution: 'uniform' },
      { name: 'Damping Ratio (ζ)', nominal: 0.12, uncertaintyPercent: 20, distribution: 'normal' },
      { name: 'Bearing Clearance (µm)', nominal: 85, uncertaintyPercent: 15, distribution: 'normal' },
    ],
    evaluator: (v) => {
      const omega = (2 * Math.PI * v['Speed (RPM)']) / 60;
      const omega_n = (2 * Math.PI * 3600) / 60; // 1st critical speed at 3600 RPM
      const r = omega / omega_n;
      const zeta = v['Damping Ratio (ζ)'];
      const magnification = r * r / Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * zeta * r, 2));
      const baselineVib = (v['Residual Unbalance (g·mm)'] * 0.15) * (v['Bearing Clearance (µm)'] / 85);
      const vibPeakPk = Math.min(120, baselineVib * magnification);
      return { primaryOutput: Number(vibPeakPk.toFixed(2)), secondaryOutput: magnification };
    },
    outputConfig: {
      name: 'Shaft 1X Vibration Amplitude',
      unit: 'µm pk-pk',
      thresholdLimit: 25.0, // API 670 alarm threshold 25 µm pk-pk
      thresholdType: 'max',
    },
  },
  {
    id: 'compressor-surge',
    name: 'Centrifugal Compressor Surge Margin Line',
    category: 'API 617 8th Ed',
    description: 'Stochastically models gas molecular weight swings, interstage suction temperatures, and IGV angle shifts.',
    variables: [
      { name: 'Gas MW (g/mol)', nominal: 22.4, uncertaintyPercent: 8, distribution: 'normal' },
      { name: 'Suction Temp (°C)', nominal: 38, uncertaintyPercent: 12, distribution: 'normal' },
      { name: 'Mass Flow (kg/s)', nominal: 18.5, uncertaintyPercent: 10, distribution: 'uniform' },
      { name: 'Polytropic Efficiency (%)', nominal: 82, uncertaintyPercent: 4, distribution: 'normal' },
    ],
    evaluator: (v) => {
      const MW_factor = Math.sqrt(28.96 / v['Gas MW (g/mol)']);
      const surgeFlow = 14.2 * (1 / MW_factor) * (1 + (v['Suction Temp (°C)'] - 38) * 0.002);
      const margin = ((v['Mass Flow (kg/s)'] - surgeFlow) / Math.max(1, v['Mass Flow (kg/s)'])) * 100;
      return { primaryOutput: Number(margin.toFixed(2)), secondaryOutput: surgeFlow };
    },
    outputConfig: {
      name: 'Surge Control Line Margin',
      unit: '% SCL',
      thresholdLimit: 10.0, // Minimum 10% safety margin from Surge Line
      thresholdType: 'min',
    },
  },
  {
    id: 'journal-film',
    name: 'Hydrodynamic Journal Bearing Min Oil Film (h_min)',
    category: 'API 670 / DIN 31657',
    description: 'Simulates radial bearing clearance stack-up, lubricant sump viscosity degradation, and radial shaft loads.',
    variables: [
      { name: 'Radial Clearance (µm)', nominal: 65, uncertaintyPercent: 15, distribution: 'normal' },
      { name: 'Oil Viscosity (cSt)', nominal: 32, uncertaintyPercent: 12, distribution: 'normal' },
      { name: 'Radial Load (kN)', nominal: 14.5, uncertaintyPercent: 10, distribution: 'uniform' },
      { name: 'Shaft Speed (RPM)', nominal: 3000, uncertaintyPercent: 2, distribution: 'normal' },
    ],
    evaluator: (v) => {
      // Sommerfeld number calculation approximation
      const c = v['Radial Clearance (µm)'] * 1e-6;
      const mu = v['Oil Viscosity (cSt)'] * 0.86 * 1e-3; // Pa.s
      const N = v['Shaft Speed (RPM)'] / 60;
      const W = v['Radial Load (kN)'] * 1000;
      const D = 0.1; // 100 mm shaft
      const L = 0.08;
      const P = W / (L * D);
      const S = (mu * N / P) * Math.pow(D / (2 * c), 2);
      // Eccentricity ratio epsilon approximation
      const epsilon = 1 / Math.sqrt(1 + Math.pow(Math.PI * S, 2));
      const hminMicrons = v['Radial Clearance (µm)'] * (1 - Math.min(0.95, epsilon));
      return { primaryOutput: Number(hminMicrons.toFixed(2)), secondaryOutput: S };
    },
    outputConfig: {
      name: 'Minimum Fluid Film Thickness (h_min)',
      unit: 'µm',
      thresholdLimit: 12.0, // Minimum recommended fluid film 12 µm
      thresholdType: 'min',
    },
  },
];

export const MonteCarloModal: React.FC<MonteCarloModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('pump-npsh');
  const [sampleSize, setSampleSize] = useState<number>(1000);
  const [seedIteration, setSeedIteration] = useState<number>(0);

  const activePreset = useMemo(() => {
    return PRESETS.find((p) => p.id === selectedPresetId) || PRESETS[0];
  }, [selectedPresetId]);

  // Local copy of variables for real-time slider adjustments
  const [currentVariables, setCurrentVariables] = useState<MonteCarloVariable[]>(activePreset.variables);

  // Sync variables when preset changes
  const handleSelectPreset = (id: string) => {
    setSelectedPresetId(id);
    const p = PRESETS.find((pr) => pr.id === id) || PRESETS[0];
    setCurrentVariables(JSON.parse(JSON.stringify(p.variables)));
    setSeedIteration((prev) => prev + 1);
  };

  // Update a single variable's parameter
  const handleUpdateVar = (index: number, field: keyof MonteCarloVariable, value: any) => {
    setCurrentVariables((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Run the Monte Carlo engine
  const simulationResults: MonteCarloSummary = useMemo(() => {
    // depend on seedIteration to allow re-roll
    const _ = seedIteration;
    return runMonteCarloSimulation(
      sampleSize,
      currentVariables,
      activePreset.evaluator,
      activePreset.outputConfig
    );
  }, [sampleSize, currentVariables, activePreset, seedIteration]);

  // Export report handler
  const handleExportReport = () => {
    const report = `# MONTE CARLO STOCHASTIC UNCERTAINTY & RISK SIMULATION REPORT
Standard Reference: ISO/IEC Guide 98-3 (GUM Uncertainty Propagation)
Simulation Case: ${activePreset.name} (${activePreset.category})
Generated: ${new Date().toISOString()}

## 1. Executive Statistical Findings
- Output Metric: ${simulationResults.outputMetricName} (${simulationResults.outputUnit})
- Trials Executed: ${simulationResults.sampleSize.toLocaleString()}
- Mean: ${simulationResults.mean} ${simulationResults.outputUnit}
- Median: ${simulationResults.median} ${simulationResults.outputUnit}
- Standard Deviation (1σ): ±${simulationResults.stdDev} ${simulationResults.outputUnit}
- 90% Confidence Interval [P5 - P95]: [${simulationResults.p5}, ${simulationResults.p95}] ${simulationResults.outputUnit}
- Design Threshold Limit: ${simulationResults.thresholdLimit} ${simulationResults.outputUnit} (${simulationResults.thresholdType === 'min' ? 'Minimum Acceptable' : 'Maximum Allowable'})
- Probability of Violation / Exceedance: ${simulationResults.probabilityOfViolationPercent}%

## 2. Input Parameter Uncertainty Bounds
${currentVariables
  .map(
    (v) =>
      `- ${v.name}: Nominal = ${v.nominal}, Uncertainty = ±${v.uncertaintyPercent}%, Distribution = ${v.distribution}`
  )
  .join('\n')}

## 3. Tornado Sensitivity & Variance Contribution Ranking
${simulationResults.tornadoSensitivity
  .map(
    (s) =>
      `${s.sensitivityRank}. ${s.parameterName}: Correlation r = ${s.correlationCoeff} (Variance Contribution: ${s.varianceContributionPercent}%)`
  )
  .join('\n')}

---
${STANDARDS_SAFE_DISCLAIMER_SHORT}
`;

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MonteCarlo_Uncertainty_Report_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      id="monte-carlo-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div
        id="monte-carlo-modal-container"
        className="relative flex flex-col w-full max-w-6xl max-h-[92vh] bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden text-[#c9d1d9]"
      >
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#161b22] border-b border-[#30363d] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-400">
              <BarChart3 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-purple-950/50 text-purple-400 border border-purple-500/30">
                  Pillar 12 • Stochastic Risk Engine
                </span>
                <span className="text-[10px] font-mono text-[#8b949e]">
                  ISO/IEC Guide 98-3 (GUM)
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Monte Carlo Probabilistic Tolerance & Uncertainty Simulator
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-rerun-monte-carlo"
              type="button"
              onClick={() => setSeedIteration((prev) => prev + 1)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold text-purple-300 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 rounded transition-colors"
            >
              <Shuffle size={13} />
              <span>Re-Simulate</span>
            </button>

            <button
              id="btn-export-monte-carlo-report"
              type="button"
              onClick={handleExportReport}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold text-white bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded transition-colors"
            >
              <Download size={13} className="text-[#58a6ff]" />
              <span>Export Dossier</span>
            </button>

            <button
              id="btn-close-monte-carlo-modal"
              type="button"
              onClick={onClose}
              className="p-1 text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Preset Selector Banner */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-[#0d1117] border-b border-[#30363d] overflow-x-auto shrink-0">
          <span className="text-[11px] font-mono text-[#8b949e] whitespace-nowrap">
            Engineered Machine Scenario:
          </span>
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset.id)}
              className={`px-3 py-1 text-xs font-mono rounded whitespace-nowrap transition-colors ${
                selectedPresetId === preset.id
                  ? 'bg-purple-900/50 text-white font-bold border border-purple-500/50'
                  : 'bg-[#161b22] text-[#8b949e] hover:text-white border border-[#30363d]'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Top Row: Executive Statistical KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg">
              <span className="text-[10px] font-mono uppercase text-[#8b949e] block">
                Mean Value (μ)
              </span>
              <div className="text-xl sm:text-2xl font-mono font-bold text-white mt-0.5">
                {simulationResults.mean} {simulationResults.outputUnit}
              </div>
              <span className="text-[10px] font-mono text-[#8b949e]">
                Std Dev (1σ): ±{simulationResults.stdDev}
              </span>
            </div>

            <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg">
              <span className="text-[10px] font-mono uppercase text-[#8b949e] block">
                90% Confidence Interval
              </span>
              <div className="text-lg sm:text-xl font-mono font-bold text-cyan-400 mt-0.5">
                [{simulationResults.p5}, {simulationResults.p95}]
              </div>
              <span className="text-[10px] font-mono text-[#8b949e]">
                P5 to P95 percentiles
              </span>
            </div>

            <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg">
              <span className="text-[10px] font-mono uppercase text-[#8b949e] block">
                Probability of Violation
              </span>
              <div
                className={`text-xl sm:text-2xl font-mono font-bold mt-0.5 ${
                  simulationResults.probabilityOfViolationPercent > 10
                    ? 'text-rose-400'
                    : simulationResults.probabilityOfViolationPercent > 2
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {simulationResults.probabilityOfViolationPercent}%
              </div>
              <span className="text-[10px] font-mono text-[#8b949e]">
                {simulationResults.thresholdType === 'min' ? '< Min Limit' : '> Max Limit'} ({simulationResults.thresholdLimit} {simulationResults.outputUnit})
              </span>
            </div>

            <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg">
              <span className="text-[10px] font-mono uppercase text-[#8b949e] block">
                Iterations Executed
              </span>
              <div className="text-xl sm:text-2xl font-mono font-bold text-purple-300 mt-0.5">
                {simulationResults.sampleSize.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 mt-1 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setSampleSize(500)}
                  className={`px-1.5 py-0.2 rounded ${sampleSize === 500 ? 'bg-purple-900 text-white' : 'text-[#8b949e]'}`}
                >
                  500
                </button>
                <button
                  type="button"
                  onClick={() => setSampleSize(1000)}
                  className={`px-1.5 py-0.2 rounded ${sampleSize === 1000 ? 'bg-purple-900 text-white' : 'text-[#8b949e]'}`}
                >
                  1K
                </button>
                <button
                  type="button"
                  onClick={() => setSampleSize(2500)}
                  className={`px-1.5 py-0.2 rounded ${sampleSize === 2500 ? 'bg-purple-900 text-white' : 'text-[#8b949e]'}`}
                >
                  2.5K
                </button>
              </div>
            </div>
          </div>

          {/* Middle Row: Variable Controls + PDF Histogram */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Interactive Input Variable Uncertainties (5 cols) */}
            <div className="lg:col-span-5 space-y-3 bg-[#161b22] p-4 rounded-lg border border-[#30363d]">
              <div className="flex items-center justify-between pb-2 border-b border-[#30363d]">
                <span className="text-xs font-mono font-bold text-white uppercase">
                  Input Parameters & Stochastic Tolerances
                </span>
                <span className="text-[10px] font-mono text-[#8b949e]">GUM Guide 98-3</span>
              </div>

              <div className="space-y-3">
                {currentVariables.map((v, idx) => (
                  <div key={v.name} className="p-2.5 bg-[#0d1117] rounded border border-[#30363d]/60 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-white">{v.name}</span>
                      <span className="text-purple-300 font-bold">{v.nominal}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div>
                        <label className="text-[#8b949e] block text-[10px]">Uncertainty ±%:</label>
                        <input
                          type="range"
                          min={1}
                          max={35}
                          step={1}
                          value={v.uncertaintyPercent}
                          onChange={(e) => handleUpdateVar(idx, 'uncertaintyPercent', Number(e.target.value))}
                          className="w-full accent-purple-500"
                        />
                        <div className="text-right text-[#c9d1d9] text-[10px]">±{v.uncertaintyPercent}%</div>
                      </div>

                      <div>
                        <label className="text-[#8b949e] block text-[10px]">Distribution:</label>
                        <select
                          value={v.distribution}
                          onChange={(e) => handleUpdateVar(idx, 'distribution', e.target.value)}
                          className="w-full px-1.5 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-white text-[10px]"
                        >
                          <option value="normal">Normal (Gaussian)</option>
                          <option value="uniform">Uniform (Rectangular)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: SVG Probability Distribution Histogram & Threshold Limit (7 cols) */}
            <div className="lg:col-span-7 space-y-3 bg-[#161b22] p-4 rounded-lg border border-[#30363d]">
              <div className="flex items-center justify-between pb-2 border-b border-[#30363d]">
                <div>
                  <span className="text-xs font-mono font-bold text-white uppercase block">
                    Stochastic Probability Density Function (PDF)
                  </span>
                  <span className="text-[10px] font-mono text-[#8b949e]">
                    {simulationResults.outputMetricName} Distribution
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-purple-400">
                    <span className="w-2.5 h-2.5 bg-purple-500 rounded-sm inline-block" /> Safe Runs
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm inline-block" /> Violation Breach
                  </span>
                </div>
              </div>

              {/* SVG Histogram */}
              <div className="h-48 w-full bg-[#0d1117] rounded border border-[#30363d]/60 p-3 flex flex-col justify-between relative">
                <div className="flex-1 flex items-end justify-between gap-1">
                  {simulationResults.histogram.map((bin, bIdx) => {
                    const maxPercent = Math.max(...simulationResults.histogram.map((h) => h.percentage)) || 1;
                    const heightPercent = (bin.percentage / maxPercent) * 100;
                    const isBinViolation =
                      simulationResults.thresholdType === 'min'
                        ? bin.rangeEnd < simulationResults.thresholdLimit
                        : bin.rangeStart > simulationResults.thresholdLimit;

                    return (
                      <div
                        key={bIdx}
                        className="flex-1 flex flex-col items-center h-full justify-end group relative"
                      >
                        <div
                          className={`w-full rounded-t transition-all duration-200 ${
                            isBinViolation ? 'bg-rose-500/80 hover:bg-rose-400' : 'bg-purple-500/80 hover:bg-purple-400'
                          }`}
                          style={{ height: `${Math.max(4, heightPercent)}%` }}
                        />

                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10 bg-black/90 p-1.5 rounded border border-[#30363d] text-[9px] font-mono pointer-events-none whitespace-nowrap">
                          <span>Range: {bin.rangeStart} - {bin.rangeEnd}</span>
                          <span>Count: {bin.count} ({bin.percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* X-Axis Labels */}
                <div className="flex justify-between text-[10px] font-mono text-[#8b949e] pt-2 border-t border-[#30363d]">
                  <span>Min: {simulationResults.min}</span>
                  <span className="text-white font-bold">Mean: {simulationResults.mean}</span>
                  <span className="text-amber-400 font-bold">
                    Threshold: {simulationResults.thresholdLimit} {simulationResults.outputUnit}
                  </span>
                  <span>Max: {simulationResults.max}</span>
                </div>
              </div>

              {/* Tornado Sensitivity Factors */}
              <div className="pt-2">
                <span className="text-xs font-mono font-bold text-white uppercase block mb-2">
                  Tornado Sensitivity & Variance Attribution
                </span>

                <div className="space-y-1.5">
                  {simulationResults.tornadoSensitivity.map((t) => (
                    <div key={t.parameterName} className="flex items-center gap-3 text-xs font-mono">
                      <span className="w-40 text-[#c9d1d9] truncate text-[11px]">{t.parameterName}</span>
                      <div className="flex-1 bg-[#0d1117] h-3.5 rounded overflow-hidden flex items-center border border-[#30363d]/60">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-cyan-400 transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.abs(t.correlationCoeff) * 100)}%` }}
                        />
                      </div>
                      <span className="w-16 text-right font-bold text-cyan-300 text-[11px]">
                        r = {t.correlationCoeff}
                      </span>
                      <span className="w-16 text-right text-[#8b949e] text-[10px]">
                        {t.varianceContributionPercent}% var
                      </span>
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
          <span>ISO/IEC Guide 98-3 (GUM) Stochastic Engine</span>
        </div>
      </div>
    </div>
  );
};
