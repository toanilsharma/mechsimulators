import React, { useState, useMemo } from 'react';
import {
  SimulatorId,
  UnitSystem,
} from '../../types/common';
import {
  MonteCarloVariable,
  runMonteCarloSimulation,
  MonteCarloSummary,
} from '../../physics/monteCarloMath';
import {
  Play,
  RotateCcw,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  TrendingDown,
  Download,
} from 'lucide-react';
import { STANDARDS_SAFE_DISCLAIMER_SHORT } from '../../utils/standardsSafeHarbor';

interface MonteCarloTabProps {
  selectedSim: SimulatorId;
  unitSystem: UnitSystem;
  simInputs: Record<string, any>;
  simOutputs: Record<string, any>;
}

export const MonteCarloTab: React.FC<MonteCarloTabProps> = ({
  selectedSim,
  unitSystem,
  simInputs,
  simOutputs,
}) => {
  const [sampleSize, setSampleSize] = useState<number>(1000);
  const [distributionType, setDistributionType] = useState<'normal' | 'uniform'>('normal');

  // Define stochastic variables based on selected machine
  const [uncertainties, setUncertainties] = useState<Record<string, number>>({
    var1: 6, // ±6%
    var2: 8, // ±8%
    var3: 10, // ±10%
    var4: 5, // ±5%
  });

  const variablesConfig = useMemo((): {
    variables: MonteCarloVariable[];
    outputConfig: { name: string; unit: string; thresholdLimit: number; thresholdType: 'min' | 'max' };
    evaluator: (values: Record<string, number>) => { primaryOutput: number; secondaryOutput: number };
  } => {
    switch (selectedSim) {
      case 'compressor':
        return {
          variables: [
            { name: 'Suction Mass Flow (kg/s)', nominal: simInputs.massFlowKg_s || 35, uncertaintyPercent: uncertainties.var1, distribution: distributionType },
            { name: 'Suction Pressure (bar)', nominal: simInputs.suctionPressureBar || 12, uncertaintyPercent: uncertainties.var2, distribution: distributionType },
            { name: 'Speed (RPM)', nominal: simInputs.speedRpm || 10500, uncertaintyPercent: uncertainties.var3, distribution: distributionType },
            { name: 'Inlet Temp (°C)', nominal: simInputs.suctionTempC || 25, uncertaintyPercent: uncertainties.var4, distribution: distributionType },
          ],
          outputConfig: {
            name: 'Surge Margin',
            unit: '%',
            thresholdLimit: 10.0, // Minimum safe surge margin
            thresholdType: 'min',
          },
          evaluator: (v) => {
            const flow = v['Suction Mass Flow (kg/s)'];
            const p = v['Suction Pressure (bar)'];
            const rpm = v['Speed (RPM)'];
            // Realistic surge margin calculation model
            const surgeFlow = 15 + (rpm / 10500) * 12;
            const sm = ((flow - surgeFlow) / surgeFlow) * 100;
            return { primaryOutput: sm, secondaryOutput: flow * p };
          },
        };

      case 'rotor':
        return {
          variables: [
            { name: 'Residual Unbalance (g·mm)', nominal: 400, uncertaintyPercent: uncertainties.var1, distribution: distributionType },
            { name: 'Bearing Support Stiffness (MN/m)', nominal: 15, uncertaintyPercent: uncertainties.var2, distribution: distributionType },
            { name: 'Damping Ratio (zeta)', nominal: 0.05, uncertaintyPercent: uncertainties.var3, distribution: distributionType },
            { name: 'Operating Speed (RPM)', nominal: 3600, uncertaintyPercent: uncertainties.var4, distribution: distributionType },
          ],
          outputConfig: {
            name: 'Peak Shaft Vibration',
            unit: 'µm pk-pk',
            thresholdLimit: 50.0, // ISO 7919 Zone A/B benchmark
            thresholdType: 'max',
          },
          evaluator: (v) => {
            const unb = v['Residual Unbalance (g·mm)'];
            const k = v['Bearing Support Stiffness (MN/m)'] * 1e6;
            const zeta = v['Damping Ratio (zeta)'];
            const rpm = v['Operating Speed (RPM)'];
            const omega = (rpm * 2 * Math.PI) / 60;
            const omegaN = Math.sqrt(k / 100);
            const r = omega / omegaN;
            const amp = (unb * 0.05 * r * r) / Math.max(0.01, Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * zeta * r, 2)));
            return { primaryOutput: amp, secondaryOutput: amp * 1.5 };
          },
        };

      case 'seal':
        return {
          variables: [
            { name: 'Barrier Fluid Pressure (bar)', nominal: 14, uncertaintyPercent: uncertainties.var1, distribution: distributionType },
            { name: 'Flush Flow Rate (L/min)', nominal: 8, uncertaintyPercent: uncertainties.var2, distribution: distributionType },
            { name: 'Box Temp (°C)', nominal: 65, uncertaintyPercent: uncertainties.var3, distribution: distributionType },
            { name: 'Seal Face Flatness (light bands)', nominal: 2, uncertaintyPercent: uncertainties.var4, distribution: distributionType },
          ],
          outputConfig: {
            name: 'Interface Film Thickness',
            unit: 'µm',
            thresholdLimit: 0.4, // Minimum hydrodynamic film to prevent face contact
            thresholdType: 'min',
          },
          evaluator: (v) => {
            const pb = v['Barrier Fluid Pressure (bar)'];
            const q = v['Flush Flow Rate (L/min)'];
            const t = v['Box Temp (°C)'];
            const h = 0.85 * (pb / 14) * (q / 8) * (1 - (t - 65) * 0.005);
            return { primaryOutput: Math.max(0.05, h), secondaryOutput: t };
          },
        };

      case 'pump':
      default:
        return {
          variables: [
            { name: 'Suction Head / NPSHa (m)', nominal: simOutputs.npsha || 5.8, uncertaintyPercent: uncertainties.var1, distribution: distributionType },
            { name: 'Manufacturer NPSHr (m)', nominal: simOutputs.npshr || 3.9, uncertaintyPercent: uncertainties.var2, distribution: distributionType },
            { name: 'Process Flow Rate (m³/h)', nominal: simInputs.flowM3_h || 120, uncertaintyPercent: uncertainties.var3, distribution: distributionType },
            { name: 'Fluid Temperature (°C)', nominal: simInputs.tempC || 40, uncertaintyPercent: uncertainties.var4, distribution: distributionType },
          ],
          outputConfig: {
            name: 'NPSH Margin Ratio',
            unit: 'x',
            thresholdLimit: 1.35, // Reference benchmark margin (API 610)
            thresholdType: 'min',
          },
          evaluator: (v) => {
            const npsha = v['Suction Head / NPSHa (m)'];
            const npshr = v['Manufacturer NPSHr (m)'];
            const margin = npshr > 0 ? npsha / npshr : 1.5;
            return { primaryOutput: margin, secondaryOutput: npsha - npshr };
          },
        };
    }
  }, [selectedSim, uncertainties, distributionType, simInputs, simOutputs]);

  // Execute simulation
  const simulationResults: MonteCarloSummary = useMemo(() => {
    return runMonteCarloSimulation(
      sampleSize,
      variablesConfig.variables,
      variablesConfig.evaluator,
      variablesConfig.outputConfig
    );
  }, [sampleSize, variablesConfig]);

  const handleExportCsv = () => {
    const headers = ['Iteration', ...variablesConfig.variables.map((v) => v.name), simulationResults.outputMetricName, 'Violation'];
    const rows = simulationResults.iterationsSample.map((iter) => [
      iter.iteration,
      ...variablesConfig.variables.map((v) => iter.inputs[v.name]?.toFixed(3) || '0'),
      iter.primaryOutput.toFixed(3),
      iter.isViolation ? 'YES' : 'NO',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MonteCarlo_${selectedSim}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Settings */}
      <div className="p-4 bg-[#0d1117] border border-[#30363d] rounded flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 flex items-center gap-1.5">
            <BarChart3 size={13} />
            <span>Stochastic Monte Carlo Reliability Simulation</span>
          </div>
          <h2 className="text-sm sm:text-base font-bold text-white font-mono">
            {variablesConfig.outputConfig.name} Uncertainty Distribution ({sampleSize.toLocaleString()} Runs)
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sample Size Selector */}
          <div className="flex items-center bg-[#161b22] p-0.5 rounded border border-[#30363d] text-xs font-mono">
            {[500, 1000, 2500].map((n) => (
              <button
                key={n}
                onClick={() => setSampleSize(n)}
                className={`px-2 py-1 rounded cursor-pointer ${
                  sampleSize === n ? 'bg-emerald-600 text-white font-bold' : 'text-[#8b949e] hover:text-white'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Distribution Selector */}
          <div className="flex items-center bg-[#161b22] p-0.5 rounded border border-[#30363d] text-xs font-mono">
            <button
              onClick={() => setDistributionType('normal')}
              className={`px-2 py-1 rounded cursor-pointer ${
                distributionType === 'normal' ? 'bg-[#30363d] text-white font-bold' : 'text-[#8b949e] hover:text-white'
              }`}
            >
              Normal (Gaussian)
            </button>
            <button
              onClick={() => setDistributionType('uniform')}
              className={`px-2 py-1 rounded cursor-pointer ${
                distributionType === 'uniform' ? 'bg-[#30363d] text-white font-bold' : 'text-[#8b949e] hover:text-white'
              }`}
            >
              Uniform
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="px-2.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-mono text-white rounded flex items-center gap-1 cursor-pointer"
          >
            <Download size={13} />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded">
          <div className="text-[10px] uppercase text-[#8b949e]">Mean Expected Value</div>
          <div className="text-lg sm:text-xl font-bold text-white">
            {simulationResults.mean} <span className="text-xs text-[#8b949e]">{simulationResults.outputUnit}</span>
          </div>
          <div className="text-[10px] text-[#8b949e]">Median: {simulationResults.median} {simulationResults.outputUnit}</div>
        </div>

        <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded">
          <div className="text-[10px] uppercase text-[#8b949e]">95% Confidence Interval</div>
          <div className="text-lg sm:text-xl font-bold text-cyan-400">
            [{simulationResults.p5} – {simulationResults.p95}]
          </div>
          <div className="text-[10px] text-[#8b949e]">Std Dev (σ): ±{simulationResults.stdDev}</div>
        </div>

        <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded">
          <div className="text-[10px] uppercase text-[#8b949e]">Tolerance Threshold</div>
          <div className="text-lg sm:text-xl font-bold text-amber-400">
            {simulationResults.thresholdType === 'min' ? '≥ ' : '≤ '}
            {simulationResults.thresholdLimit} {simulationResults.outputUnit}
          </div>
          <div className="text-[10px] text-[#8b949e]">Reference Benchmark Boundary</div>
        </div>

        <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded">
          <div className="text-[10px] uppercase text-[#8b949e]">Probability of Violation</div>
          <div
            className={`text-lg sm:text-xl font-bold ${
              simulationResults.probabilityOfViolationPercent > 10
                ? 'text-rose-400'
                : simulationResults.probabilityOfViolationPercent > 2
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {simulationResults.probabilityOfViolationPercent}%
          </div>
          <div className="text-[10px] text-[#8b949e]">
            {simulationResults.probabilityOfViolationPercent === 0
              ? 'Zero Exceedance in Sample'
              : `${simulationResults.probabilityOfViolationPercent}% of iterations fail`}
          </div>
        </div>
      </div>

      {/* Main Analysis Section: Histogram + Tornado Sensitivity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Histogram Chart */}
        <div className="lg:col-span-2 p-4 bg-[#0d1117] border border-[#30363d] rounded flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2 mb-3">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Monte Carlo Frequency Distribution Histogram
            </span>
            <span className="text-[10px] font-mono text-[#8b949e]">
              Red Bars = Violation of Benchmark Threshold
            </span>
          </div>

          {/* SVG Histogram */}
          <div className="w-full overflow-hidden">
            <svg viewBox="0 0 500 200" className="w-full h-auto max-h-[220px]">
              {/* Grid Lines */}
              {[0.25, 0.5, 0.75, 1.0].map((ratio, i) => (
                <line
                  key={i}
                  x1={40}
                  y1={170 - ratio * 140}
                  x2={490}
                  y2={170 - ratio * 140}
                  stroke="#21262d"
                  strokeDasharray="2 2"
                />
              ))}

              {/* Bins */}
              {(() => {
                const maxPct = Math.max(...simulationResults.histogram.map((h) => h.percentage), 5);
                const binW = 440 / simulationResults.histogram.length;

                return simulationResults.histogram.map((bin, i) => {
                  const x = 45 + i * binW;
                  const barH = (bin.percentage / maxPct) * 140;
                  const y = 170 - barH;

                  const isViolatingBin =
                    simulationResults.thresholdType === 'min'
                      ? bin.rangeEnd < simulationResults.thresholdLimit
                      : bin.rangeStart > simulationResults.thresholdLimit;

                  return (
                    <g key={i}>
                      <rect
                        x={x + 1}
                        y={y}
                        width={Math.max(1, binW - 2)}
                        height={barH}
                        fill={isViolatingBin ? '#f85149dd' : '#3fb950cc'}
                        className="transition-all hover:opacity-80"
                      />
                      {i % 4 === 0 && (
                        <text
                          x={x + binW / 2}
                          y={185}
                          fill="#8b949e"
                          fontSize="8"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {bin.rangeStart.toFixed(1)}
                        </text>
                      )}
                    </g>
                  );
                });
              })()}

              {/* Threshold Line */}
              {(() => {
                const min = simulationResults.min;
                const max = simulationResults.max;
                const range = max - min || 1;
                const threshRatio = (simulationResults.thresholdLimit - min) / range;
                if (threshRatio >= 0 && threshRatio <= 1) {
                  const threshX = 45 + threshRatio * 440;
                  return (
                    <g>
                      <line
                        x1={threshX}
                        y1={20}
                        x2={threshX}
                        y2={170}
                        stroke="#f27d26"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                      />
                      <text
                        x={threshX + 4}
                        y={30}
                        fill="#f27d26"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        Limit: {simulationResults.thresholdLimit}
                      </text>
                    </g>
                  );
                }
                return null;
              })()}
            </svg>
          </div>
        </div>

        {/* Tornado Sensitivity Chart */}
        <div className="p-4 bg-[#0d1117] border border-[#30363d] rounded flex flex-col justify-between">
          <div className="border-b border-[#30363d] pb-2 mb-3">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block">
              Tornado Sensitivity Ranking
            </span>
            <span className="text-[10px] font-mono text-[#8b949e]">
              Correlation with Output Variance
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {simulationResults.tornadoSensitivity.map((f, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-white truncate max-w-[170px]">{f.parameterName}</span>
                  <span className="text-amber-400 font-bold">
                    {f.correlationCoeff > 0 ? `+${f.correlationCoeff}` : f.correlationCoeff}
                  </span>
                </div>
                <div className="w-full bg-[#161b22] rounded-full h-2 overflow-hidden flex">
                  <div
                    className={`h-full ${
                      f.correlationCoeff > 0 ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.abs(f.correlationCoeff) * 100)}%` }}
                  />
                </div>
                <div className="text-[9px] text-[#8b949e] text-right">
                  Contrib: {f.varianceContributionPercent}% variance
                </div>
              </div>
            ))}
          </div>

          <div className="p-2 bg-[#161b22] border border-[#30363d] rounded text-[10px] font-mono text-[#8b949e] mt-4">
            <span className="text-white font-bold">Engineering Rule:</span> Tighten manufacturing tolerance on Rank 1 parameter to achieve greatest failure risk reduction.
          </div>
        </div>
      </div>

      {/* Uncertainty Sliders Setup */}
      <div className="p-4 bg-[#0d1117] border border-[#30363d] rounded space-y-3">
        <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sliders size={13} className="text-emerald-400" />
            <span>Tolerance Uncertainty Inputs (± % Spread)</span>
          </span>
          <span className="text-[10px] font-mono text-[#8b949e]">
            Adjust process or manufacturing tolerances to re-simulate
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          {variablesConfig.variables.map((v, i) => {
            const key = `var${i + 1}`;
            return (
              <div key={i} className="p-2.5 bg-[#161b22] border border-[#30363d] rounded">
                <div className="text-[#8b949e] text-[10px] truncate mb-1">{v.name}</div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white font-bold">±{uncertainties[key]}%</span>
                  <span className="text-[10px] text-emerald-400">Nom: {v.nominal}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={25}
                  step={1}
                  value={uncertainties[key]}
                  onChange={(e) =>
                    setUncertainties({ ...uncertainties, [key]: Number(e.target.value) })
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Safe Harbor Legal Benchmark Notice */}
      <div className="p-3 bg-[#080b10] border border-[#30363d] rounded text-[10px] text-[#8b949e] font-mono leading-relaxed">
        <span className="text-amber-400 font-bold uppercase mr-1">Industry Reference Benchmark:</span>
        {STANDARDS_SAFE_DISCLAIMER_SHORT} Monte Carlo stochastic methodology conforms to ISO/IEC Guide 98-3 (GUM) uncertainty propagation modeling for preliminary educational screening.
      </div>
    </div>
  );
};
