/**
 * Machinery Exergy Destruction, Energy Efficiency & Life-Cycle Carbon Footprint (LCC / CO2e)
 * Thermodynamic Second-Law analysis and emissions abatement modeling
 *
 * Nominative Benchmark Reference: ISO 14040 / ISO 15663 (Educational Citation Only)
 * Independent computational analysis - zero official endorsement or affiliation.
 */

export interface ExergyCarbonInputs {
  assetName: string;
  shaftPowerKw: number;
  driverEfficiencyPercent: number; // e.g. 95% for high-efficiency electric motor
  fluidFlowM3_h: number;
  pressureRiseBar: number;
  fluidDensityKg_m3: number;
  ambientTempC: number; // T0 reference, typically 20°C (293.15 K)
  operatingHoursPerYear: number; // e.g. 8000 hrs/yr (91.3% availability)
  electricityCostPerKwh: number; // e.g. $0.12 / kWh
  gridCarbonIntensityKgCo2_kwh: number; // e.g. 0.45 kg CO2e / kWh
  degradationFactorPercent: number; // e.g. 5% degradation due to wear/recirculation
}

export interface ExergyCarbonOutputs {
  electricalInputPowerKw: number;
  usefulFluidPowerKw: number;
  totalLossPowerKw: number;
  firstLawEfficiencyPercent: number;
  exergyDestructionKw: number;
  secondLawExergyEfficiencyPercent: number;
  annualEnergyConsumptionMwh: number;
  annualElectricityCostUsd: number;
  annualCarbonFootprintTonsCo2: number;
  carbonEmissionRateKgPerHour: number;
  tenYearLifeCycleCostUsd: number;
  twentyYearLifeCycleCostUsd: number;
  optimizationOptions: {
    title: string;
    description: string;
    powerSavedKw: number;
    annualCostSavedUsd: number;
    annualCo2SavedTons: number;
    estCapexUsd: number;
    simplePaybackMonths: number;
  }[];
  benchmarkNotes: string[];
}

export function calculateExergyAndCarbon(inputs: ExergyCarbonInputs): ExergyCarbonOutputs {
  const {
    shaftPowerKw,
    driverEfficiencyPercent,
    fluidFlowM3_h,
    pressureRiseBar,
    ambientTempC,
    operatingHoursPerYear,
    electricityCostPerKwh,
    gridCarbonIntensityKgCo2_kwh,
    degradationFactorPercent,
  } = inputs;

  // 1. Electrical input power drawn from grid
  const driverEff = Math.max(0.7, driverEfficiencyPercent / 100);
  const electricalInputPowerKw = shaftPowerKw / driverEff;

  // 2. Useful fluid power: P_fluid = Q (m³/s) * ΔP (Pa) / 1000 [kW]
  const flowM3_s = fluidFlowM3_h / 3600;
  const deltaP_pa = pressureRiseBar * 100000;
  const usefulFluidPowerKw = (flowM3_s * deltaP_pa) / 1000;

  // 3. First law efficiency (Fluid power / shaft power)
  const firstLawEfficiencyPercent =
    shaftPowerKw > 0 ? (usefulFluidPowerKw / shaftPowerKw) * 100 : 0;

  // 4. Power lost to friction, turbulence, leakage, and motor losses
  const totalLossPowerKw = electricalInputPowerKw - usefulFluidPowerKw;

  // 5. Exergy destruction rate (Second-law irreversibility)
  // E_dest = W_in - ΔEx_fluid ≈ Total Loss * (1 - T0 / T_eff)
  // For fluid machinery at near-ambient temperatures, almost all internal dissipation converts to destroyed mechanical exergy
  const exergyDestructionKw = totalLossPowerKw * (1 + (degradationFactorPercent / 100) * 0.4);
  const secondLawExergyEfficiencyPercent =
    electricalInputPowerKw > 0 ? (usefulFluidPowerKw / electricalInputPowerKw) * 100 : 0;

  // 6. Annual electrical energy & cost
  const annualEnergyConsumptionMwh = (electricalInputPowerKw * operatingHoursPerYear) / 1000;
  const annualElectricityCostUsd = annualEnergyConsumptionMwh * 1000 * electricityCostPerKwh;

  // 7. Carbon emissions
  const annualCarbonFootprintTonsCo2 =
    (annualEnergyConsumptionMwh * 1000 * gridCarbonIntensityKgCo2_kwh) / 1000;
  const carbonEmissionRateKgPerHour = electricalInputPowerKw * gridCarbonIntensityKgCo2_kwh;

  // 8. 10-year and 20-year LCC (discounted at 5% real rate)
  const discountRate = 0.05;
  let tenYearLcc = 0;
  let twentyYearLcc = 0;
  for (let y = 1; y <= 20; y++) {
    const discounted = annualElectricityCostUsd / Math.pow(1 + discountRate, y);
    if (y <= 10) tenYearLcc += discounted;
    twentyYearLcc += discounted;
  }

  // 9. Standardized Industrial Optimization Initiatives
  const optimizationOptions = [
    {
      title: 'Precision Impeller Trimming & VFD Speed Optimization',
      description: 'Tune machine operating point to exact process BEP; eliminate discharge control valve throttling.',
      powerSavedKw: Number((electricalInputPowerKw * 0.16).toFixed(1)),
      annualCostSavedUsd: Math.round(annualElectricityCostUsd * 0.16),
      annualCo2SavedTons: Number((annualCarbonFootprintTonsCo2 * 0.16).toFixed(1)),
      estCapexUsd: Math.round(electricalInputPowerKw * 85),
      simplePaybackMonths: Number(((electricalInputPowerKw * 85) / (annualElectricityCostUsd * 0.16 / 12)).toFixed(1)),
    },
    {
      title: 'Restoration of Labyrinth & Wear Ring Clearances',
      description: 'Replace eroded wear rings to eliminate internal volumetric bypass and inter-stage backflow.',
      powerSavedKw: Number((electricalInputPowerKw * 0.06).toFixed(1)),
      annualCostSavedUsd: Math.round(annualElectricityCostUsd * 0.06),
      annualCo2SavedTons: Number((annualCarbonFootprintTonsCo2 * 0.06).toFixed(1)),
      estCapexUsd: Math.round(electricalInputPowerKw * 30),
      simplePaybackMonths: Number(((electricalInputPowerKw * 30) / (annualElectricityCostUsd * 0.06 / 12)).toFixed(1)),
    },
    {
      title: 'Premium Efficiency (IE4/IE5 Super Premium) Motor Upgrade',
      description: 'Replace standard induction motor with permanent magnet synchronous drive.',
      powerSavedKw: Number((electricalInputPowerKw * 0.035).toFixed(1)),
      annualCostSavedUsd: Math.round(annualElectricityCostUsd * 0.035),
      annualCo2SavedTons: Number((annualCarbonFootprintTonsCo2 * 0.035).toFixed(1)),
      estCapexUsd: Math.round(electricalInputPowerKw * 110),
      simplePaybackMonths: Number(((electricalInputPowerKw * 110) / (annualElectricityCostUsd * 0.035 / 12)).toFixed(1)),
    },
  ];

  const benchmarkNotes = [
    `Life Cycle Cost based on ${operatingHoursPerYear} operating hrs/yr at $${electricityCostPerKwh.toFixed(2)}/kWh.`,
    `Carbon footprint modeled at ${gridCarbonIntensityKgCo2_kwh.toFixed(2)} kg CO2e/kWh regional grid factor.`,
    'Thermodynamic exergy destruction highlights irreversible thermal dissipative friction.',
    'Notice: Calculations serve educational energy screening under open thermodynamic principles without standards society endorsement.',
  ];

  return {
    electricalInputPowerKw: Number(electricalInputPowerKw.toFixed(1)),
    usefulFluidPowerKw: Number(usefulFluidPowerKw.toFixed(1)),
    totalLossPowerKw: Number(totalLossPowerKw.toFixed(1)),
    firstLawEfficiencyPercent: Number(firstLawEfficiencyPercent.toFixed(1)),
    exergyDestructionKw: Number(exergyDestructionKw.toFixed(1)),
    secondLawExergyEfficiencyPercent: Number(secondLawExergyEfficiencyPercent.toFixed(1)),
    annualEnergyConsumptionMwh: Math.round(annualEnergyConsumptionMwh),
    annualElectricityCostUsd: Math.round(annualElectricityCostUsd),
    annualCarbonFootprintTonsCo2: Number(annualCarbonFootprintTonsCo2.toFixed(1)),
    carbonEmissionRateKgPerHour: Number(carbonEmissionRateKgPerHour.toFixed(1)),
    tenYearLifeCycleCostUsd: Math.round(tenYearLcc),
    twentyYearLifeCycleCostUsd: Math.round(twentyYearLcc),
    optimizationOptions,
    benchmarkNotes,
  };
}
