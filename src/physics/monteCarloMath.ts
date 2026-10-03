/**
 * Monte Carlo Probabilistic Tolerance & Uncertainty Analysis Engine
 * Stochastic multi-variable uncertainty quantification for machinery reliability
 *
 * Nominative Benchmark: ISO/IEC Guide 98-3 (GUM Uncertainty Propagation)
 * Independent educational simulation - zero official endorsement or affiliation.
 */

export interface MonteCarloVariable {
  name: string;
  nominal: number;
  uncertaintyPercent: number; // e.g. 5 for ±5%
  distribution: 'normal' | 'uniform';
}

export interface MonteCarloIterationResult {
  iteration: number;
  inputs: Record<string, number>;
  primaryOutput: number;
  secondaryOutput: number;
  isViolation: boolean;
}

export interface HistogramBin {
  rangeStart: number;
  rangeEnd: number;
  count: number;
  percentage: number;
}

export interface TornadoSensitivityFactor {
  parameterName: string;
  correlationCoeff: number; // Spearman/Pearson correlation with output (-1 to +1)
  sensitivityRank: number;
  varianceContributionPercent: number;
}

export interface MonteCarloSummary {
  sampleSize: number;
  outputMetricName: string;
  outputUnit: string;
  thresholdLimit: number;
  thresholdType: 'min' | 'max'; // e.g., NPSH margin should be above min (1.35x), vibration below max (4.5 mm/s)
  mean: number;
  median: number;
  stdDev: number;
  p5: number;
  p95: number;
  min: number;
  max: number;
  probabilityOfViolationPercent: number;
  histogram: HistogramBin[];
  tornadoSensitivity: TornadoSensitivityFactor[];
  iterationsSample: MonteCarloIterationResult[];
}

/**
 * Box-Muller Gaussian random generator
 */
function randomGaussian(mean: number, stdDev: number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * stdDev;
}

/**
 * Executes a 1,000-run Monte Carlo simulation on machine parameters.
 */
export function runMonteCarloSimulation(
  sampleSize = 1000,
  variables: MonteCarloVariable[],
  evaluator: (values: Record<string, number>) => { primaryOutput: number; secondaryOutput: number },
  outputConfig: {
    name: string;
    unit: string;
    thresholdLimit: number;
    thresholdType: 'min' | 'max';
  }
): MonteCarloSummary {
  const results: MonteCarloIterationResult[] = [];
  const primaryValues: number[] = [];
  const inputArrays: Record<string, number[]> = {};

  variables.forEach((v) => {
    inputArrays[v.name] = [];
  });

  for (let i = 0; i < sampleSize; i++) {
    const sampledInputs: Record<string, number> = {};

    variables.forEach((v) => {
      let val = v.nominal;
      const deltaRange = (v.nominal * (v.uncertaintyPercent / 100));

      if (v.distribution === 'normal') {
        // Assume 95% of samples lie within ±uncertainty (2 sigma)
        const sigma = deltaRange / 2;
        val = randomGaussian(v.nominal, sigma);
      } else {
        // Uniform distribution between nominal - delta and nominal + delta
        val = v.nominal - deltaRange + Math.random() * 2 * deltaRange;
      }

      sampledInputs[v.name] = val;
      inputArrays[v.name].push(val);
    });

    const evaluated = evaluator(sampledInputs);
    const isViolation =
      outputConfig.thresholdType === 'min'
        ? evaluated.primaryOutput < outputConfig.thresholdLimit
        : evaluated.primaryOutput > outputConfig.thresholdLimit;

    results.push({
      iteration: i + 1,
      inputs: sampledInputs,
      primaryOutput: evaluated.primaryOutput,
      secondaryOutput: evaluated.secondaryOutput,
      isViolation,
    });

    primaryValues.push(evaluated.primaryOutput);
  }

  // Statistical calculations
  primaryValues.sort((a, b) => a - b);
  const sum = primaryValues.reduce((acc, val) => acc + val, 0);
  const mean = sum / sampleSize;
  const median = primaryValues[Math.floor(sampleSize / 2)];
  const p5 = primaryValues[Math.floor(sampleSize * 0.05)];
  const p95 = primaryValues[Math.floor(sampleSize * 0.95)];
  const min = primaryValues[0];
  const max = primaryValues[sampleSize - 1];

  const variance =
    primaryValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / sampleSize;
  const stdDev = Math.sqrt(variance);

  const violationsCount = results.filter((r) => r.isViolation).length;
  const probabilityOfViolationPercent = (violationsCount / sampleSize) * 100;

  // Histogram (20 bins)
  const numBins = 20;
  const binWidth = (max - min) / numBins || 1;
  const histogram: HistogramBin[] = [];

  for (let b = 0; b < numBins; b++) {
    const rStart = min + b * binWidth;
    const rEnd = rStart + binWidth;
    const count = primaryValues.filter((v) => (b === numBins - 1 ? v >= rStart && v <= rEnd : v >= rStart && v < rEnd)).length;
    histogram.push({
      rangeStart: Number(rStart.toFixed(2)),
      rangeEnd: Number(rEnd.toFixed(2)),
      count,
      percentage: Number(((count / sampleSize) * 100).toFixed(1)),
    });
  }

  // Tornado Sensitivity (Pearson correlation of each input with primary output)
  const tornadoSensitivity: TornadoSensitivityFactor[] = variables.map((v) => {
    const x = inputArrays[v.name];
    const xMean = x.reduce((a, b) => a + b, 0) / sampleSize;
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < sampleSize; i++) {
      const dx = x[i] - xMean;
      const dy = results[i].primaryOutput - mean;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }

    const r = (denomX > 0 && denomY > 0) ? numerator / Math.sqrt(denomX * denomY) : 0;
    return {
      parameterName: v.name,
      correlationCoeff: Number(r.toFixed(3)),
      sensitivityRank: 0,
      varianceContributionPercent: Number((r * r * 100).toFixed(1)),
    };
  });

  // Sort tornado sensitivity descending by magnitude of correlation
  tornadoSensitivity.sort((a, b) => Math.abs(b.correlationCoeff) - Math.abs(a.correlationCoeff));
  tornadoSensitivity.forEach((item, idx) => {
    item.sensitivityRank = idx + 1;
  });

  return {
    sampleSize,
    outputMetricName: outputConfig.name,
    outputUnit: outputConfig.unit,
    thresholdLimit: outputConfig.thresholdLimit,
    thresholdType: outputConfig.thresholdType,
    mean: Number(mean.toFixed(2)),
    median: Number(median.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    p5: Number(p5.toFixed(2)),
    p95: Number(p95.toFixed(2)),
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    probabilityOfViolationPercent: Number(probabilityOfViolationPercent.toFixed(1)),
    histogram,
    tornadoSensitivity,
    iterationsSample: results.slice(0, 50), // keep 50 rows for sample table
  };
}
