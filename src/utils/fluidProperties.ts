import { PumpFluidType } from '../types/pump';

export interface FluidData {
  id: PumpFluidType;
  name: string;
  category: string;
  defaultTempC: number;
  minTempC: number;
  maxTempC: number;
  antoineA: number; // log10(P_bar) = A - B/(T_K + C) or P_kPa
  antoineB: number;
  antoineC: number;
  baseDensity20C: number; // kg/m3
  thermalExpansionCoeff: number; // 1/K
  viscosity20CcP: number;
  specificHeatKJkgK: number;
}

export const FLUID_DATABASE: Record<PumpFluidType, FluidData> = {
  water: {
    id: 'water',
    name: 'Water (Standard)',
    category: 'Aqueous',
    defaultTempC: 20,
    minTempC: 0,
    maxTempC: 150,
    antoineA: 5.20389,
    antoineB: 1733.926,
    antoineC: -39.485,
    baseDensity20C: 998.2,
    thermalExpansionCoeff: 0.00021,
    viscosity20CcP: 1.002,
    specificHeatKJkgK: 4.184,
  },
  boiler_feed: {
    id: 'boiler_feed',
    name: 'Boiler Feedwater (High Temp)',
    category: 'Steam System',
    defaultTempC: 105,
    minTempC: 60,
    maxTempC: 180,
    antoineA: 5.20389,
    antoineB: 1733.926,
    antoineC: -39.485,
    baseDensity20C: 998.2,
    thermalExpansionCoeff: 0.00045,
    viscosity20CcP: 1.0,
    specificHeatKJkgK: 4.22,
  },
  gasoline: {
    id: 'gasoline',
    name: 'Gasoline / Naphtha',
    category: 'Light Hydrocarbon',
    defaultTempC: 25,
    minTempC: -20,
    maxTempC: 80,
    antoineA: 4.0,
    antoineB: 1100.0,
    antoineC: -50.0,
    baseDensity20C: 740.0,
    thermalExpansionCoeff: 0.00095,
    viscosity20CcP: 0.6,
    specificHeatKJkgK: 2.1,
  },
  diesel: {
    id: 'diesel',
    name: 'Diesel / Gas Oil',
    category: 'Middle Distillate',
    defaultTempC: 30,
    minTempC: -10,
    maxTempC: 120,
    antoineA: 4.8,
    antoineB: 1800.0,
    antoineC: -80.0,
    baseDensity20C: 840.0,
    thermalExpansionCoeff: 0.0008,
    viscosity20CcP: 3.5,
    specificHeatKJkgK: 1.95,
  },
  crude_oil: {
    id: 'crude_oil',
    name: 'Crude Oil (32° API)',
    category: 'Petroleum',
    defaultTempC: 40,
    minTempC: 10,
    maxTempC: 150,
    antoineA: 4.2,
    antoineB: 1450.0,
    antoineC: -60.0,
    baseDensity20C: 865.0,
    thermalExpansionCoeff: 0.00075,
    viscosity20CcP: 12.0,
    specificHeatKJkgK: 1.88,
  },
  lpg_propane: {
    id: 'lpg_propane',
    name: 'LPG / Liquid Propane',
    category: 'Liquefied Gas',
    defaultTempC: 15,
    minTempC: -40,
    maxTempC: 50,
    antoineA: 3.92828,
    antoineB: 803.997,
    antoineC: -26.11,
    baseDensity20C: 510.0,
    thermalExpansionCoeff: 0.0028,
    viscosity20CcP: 0.12,
    specificHeatKJkgK: 2.55,
  },
  methanol: {
    id: 'methanol',
    name: 'Methanol',
    category: 'Chemical',
    defaultTempC: 20,
    minTempC: -20,
    maxTempC: 60,
    antoineA: 5.20409,
    antoineB: 1581.341,
    antoineC: -33.5,
    baseDensity20C: 792.0,
    thermalExpansionCoeff: 0.00119,
    viscosity20CcP: 0.59,
    specificHeatKJkgK: 2.53,
  },
  thermal_oil: {
    id: 'thermal_oil',
    name: 'Synthetic Thermal Oil (Dowtherm/Therminol)',
    category: 'Heat Transfer',
    defaultTempC: 180,
    minTempC: 20,
    maxTempC: 300,
    antoineA: 4.5,
    antoineB: 2100.0,
    antoineC: -100.0,
    baseDensity20C: 1040.0,
    thermalExpansionCoeff: 0.00085,
    viscosity20CcP: 45.0,
    specificHeatKJkgK: 1.75,
  },
  custom: {
    id: 'custom',
    name: 'Custom User Fluid',
    category: 'User Defined',
    defaultTempC: 25,
    minTempC: -50,
    maxTempC: 300,
    antoineA: 5.20389,
    antoineB: 1733.926,
    antoineC: -39.485,
    baseDensity20C: 1000.0,
    thermalExpansionCoeff: 0.0005,
    viscosity20CcP: 1.0,
    specificHeatKJkgK: 3.5,
  },
};

/**
 * Calculates vapor pressure in kPa absolute using Antoine Equation:
 * log10(P_bar) = A - (B / (T_C + 273.15 + C))
 * P_kPa = 100 * 10^(A - B/(T_K + C))
 */
export function getVaporPressureKPa(fluidId: PumpFluidType, tempC: number): number {
  const f = FLUID_DATABASE[fluidId] || FLUID_DATABASE.water;
  const T_K = tempC + 273.15;

  if (fluidId === 'water' || fluidId === 'boiler_feed') {
    // Highly accurate IAPWS formulation for water vapor pressure
    const Tc = 647.096;
    const Pc = 22064; // kPa
    const tau = 1 - (tempC + 273.15) / Tc;
    if (tau <= 0) return Pc;
    const a1 = -7.85951783;
    const a2 = 1.84408259;
    const a3 = -11.7866497;
    const a4 = 22.6807411;
    const a5 = -15.9618719;
    const a6 = 1.80122502;
    const exponent =
      (Tc / (tempC + 273.15)) *
      (a1 * tau +
        a2 * Math.pow(tau, 1.5) +
        a3 * Math.pow(tau, 3) +
        a4 * Math.pow(tau, 3.5) +
        a5 * Math.pow(tau, 4) +
        a6 * Math.pow(tau, 7.5));
    const P = Pc * Math.exp(exponent);
    return Math.max(0.1, Math.min(Pc, P));
  }

  // Antoine equation for other fluids
  const logP_bar = f.antoineA - f.antoineB / (T_K + f.antoineC);
  const pBar = Math.pow(10, logP_bar);
  return Math.max(0.05, pBar * 100);
}

/**
 * Calculates temperature-dependent density in kg/m³
 */
export function getFluidDensityKgM3(fluidId: PumpFluidType, tempC: number): number {
  const f = FLUID_DATABASE[fluidId] || FLUID_DATABASE.water;
  const deltaT = tempC - 20;
  const density = f.baseDensity20C / (1 + f.thermalExpansionCoeff * deltaT);
  return Math.max(300, density);
}

/**
 * Calculates temperature-dependent dynamic viscosity in cP (mPa·s)
 */
export function getFluidViscosityCP(fluidId: PumpFluidType, tempC: number): number {
  const f = FLUID_DATABASE[fluidId] || FLUID_DATABASE.water;
  // Andrade equation: mu(T) = A * exp(B / T_K)
  const T_K = tempC + 273.15;
  const T20_K = 293.15;
  const B = 1600; // General activation energy approx
  const factor = Math.exp(B * (1 / T_K - 1 / T20_K));
  const visc = f.viscosity20CcP * factor;
  return Math.max(0.05, visc);
}
