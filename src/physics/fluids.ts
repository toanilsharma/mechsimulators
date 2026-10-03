/**
 * Fluid Properties and Thermophysical State Calculations
 * 
 * Includes high-accuracy water property formulations (Antoine / IAPWS approximations),
 * standard industrial presets (Water 20°C, Water 90°C, Light Hydrocarbon, Condensate, Thermal Oil),
 * and user-defined fluid state models with validation warnings.
 */

export interface FluidProperties {
  id: string;
  name: string;
  temperatureC: number;
  density: number; // kg/m³
  dynamicViscosity: number; // Pa·s (N·s/m²), 1 cP = 1e-3 Pa·s
  kinematicViscosity: number; // cSt (mm²/s), 1 cSt = 1e-6 m²/s
  vaporPressureAbs: number | null; // kPa absolute (null triggers engineering cavitation risk warnings)
  specificHeat: number; // kJ/(kg·K)
  specificGravity: number; // Dimensionless relative to water @ 4°C (1000 kg/m³)
  isCustom?: boolean;
}

export interface FluidValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * High-accuracy saturated water vapor pressure calculation (Antoine equation)
 * Range: 1°C to 100°C
 * Formula: log10(P_mmHg) = A - (B / (C + T_C))
 * Conversion: 1 mmHg = 0.133322387415 kPa
 *
 * @param tempC - Temperature in Celsius
 * @returns Vapor pressure in kPa absolute
 */
export function calculateWaterVaporPressure(tempC: number): number {
  const T = Math.max(0.1, Math.min(tempC, 250));
  if (T <= 100) {
    // Antoine parameters for Water 1-100 °C
    const A = 8.07131;
    const B = 1730.63;
    const C = 233.426;
    const pMmHg = Math.pow(10, A - B / (C + T));
    return pMmHg * 0.133322387415;
  } else {
    // Wagner formulation for elevated temps (100-250 °C)
    // Tc = 647.096 K, Pc = 22064 kPa
    const Tc = 647.096;
    const Pc = 22064;
    const Tk = T + 273.15;
    const tau = 1 - Tk / Tc;
    const a1 = -7.85951783;
    const a2 = 1.84408259;
    const a3 = -11.7866497;
    const a4 = 22.6807411;
    const a5 = -15.9618719;
    const a6 = 1.80122502;
    const exponent =
      (Tc / Tk) *
      (a1 * tau +
        a2 * Math.pow(tau, 1.5) +
        a3 * Math.pow(tau, 3) +
        a4 * Math.pow(tau, 3.5) +
        a5 * Math.pow(tau, 4) +
        a6 * Math.pow(tau, 7.5));
    return Pc * Math.exp(exponent);
  }
}

/**
 * Water density as a function of temperature (Tanaka formula / standard polynomial)
 * Range: 0°C to 150°C
 *
 * @param tempC - Temperature in Celsius
 * @returns Density in kg/m³
 */
export function calculateWaterDensity(tempC: number): number {
  const T = Math.max(0, Math.min(tempC, 200));
  // Polynomial fit for liquid water density at atmospheric/saturation pressure
  const rho =
    999.83952 +
    16.945176 * T * 1e-2 -
    7.9870401 * Math.pow(T, 2) * 1e-3 -
    46.170461 * Math.pow(T, 3) * 1e-6 +
    105.56302 * Math.pow(T, 4) * 1e-9 -
    280.54253 * Math.pow(T, 5) * 1e-12;
  return Math.max(800, Math.min(1000, rho));
}

/**
 * Water kinematic viscosity as a function of temperature
 * Formula: Vogel-Fulcher-Tammann approximation
 *
 * @param tempC - Temperature in Celsius
 * @returns Kinematic viscosity in cSt (mm²/s)
 */
export function calculateWaterKinematicViscosity(tempC: number): number {
  const T = Math.max(0, Math.min(tempC, 200));
  // mu in mPa·s (cP)
  const dynamicViscosityCp =
    2.414e-2 * Math.pow(10, 247.8 / (T + 273.15 - 140));
  const density = calculateWaterDensity(T);
  // nu (cSt) = dynamic (cP) / (density in g/cm³) = dynamic (mPa·s) / (density / 1000)
  return (dynamicViscosityCp / density) * 1000;
}

/**
 * Water specific heat (Cp) as a function of temperature
 *
 * @param tempC - Temperature in Celsius
 * @returns Specific heat in kJ/(kg·K)
 */
export function calculateWaterSpecificHeat(tempC: number): number {
  const T = Math.max(0, Math.min(tempC, 200));
  // Approximate standard Cp around 4.184 kJ/(kg·K)
  return 4.2174 - 5.618e-3 * T + 1.299e-4 * Math.pow(T, 2) - 1.153e-6 * Math.pow(T, 3) + 4.149e-9 * Math.pow(T, 4);
}

/**
 * Standard Fluid Presets
 */
export const FLUID_PRESETS: Record<string, FluidProperties> = {
  water20: {
    id: 'water20',
    name: 'Water @ 20°C (Standard Ambient)',
    temperatureC: 20,
    density: 998.2,
    dynamicViscosity: 1.002e-3, // 1.002 cP = 1.002e-3 Pa·s
    kinematicViscosity: 1.004, // cSt
    vaporPressureAbs: 2.34, // kPa abs
    specificHeat: 4.182, // kJ/(kg·K)
    specificGravity: 0.9982,
  },
  water90: {
    id: 'water90',
    name: 'Water @ 90°C (Hot Boiler Feed / Condensate)',
    temperatureC: 90,
    density: 965.3,
    dynamicViscosity: 0.315e-3, // 0.315 cP
    kinematicViscosity: 0.326, // cSt
    vaporPressureAbs: 70.14, // kPa abs (~0.70 bar abs)
    specificHeat: 4.208, // kJ/(kg·K)
    specificGravity: 0.9653,
  },
  lightHydrocarbon: {
    id: 'lightHydrocarbon',
    name: 'Light Hydrocarbon (e.g. Hexane/Naphtha)',
    temperatureC: 38,
    density: 660.0,
    dynamicViscosity: 0.297e-3, // Pa·s
    kinematicViscosity: 0.45, // cSt
    vaporPressureAbs: 45.0, // kPa abs
    specificHeat: 2.25, // kJ/(kg·K)
    specificGravity: 0.66,
  },
  crudeOil: {
    id: 'crudeOil',
    name: 'Medium Crude Oil @ 40°C',
    temperatureC: 40,
    density: 870.0,
    dynamicViscosity: 15.0e-3, // Pa·s
    kinematicViscosity: 17.24, // cSt
    vaporPressureAbs: 12.5, // kPa abs
    specificHeat: 1.95, // kJ/(kg·K)
    specificGravity: 0.87,
  },
  thermalOil: {
    id: 'thermalOil',
    name: 'Heat Transfer Fluid (Dowtherm/Therminol) @ 150°C',
    temperatureC: 150,
    density: 890.0,
    dynamicViscosity: 1.2e-3,
    kinematicViscosity: 1.35,
    vaporPressureAbs: 4.8,
    specificHeat: 2.10,
    specificGravity: 0.89,
  },
};

/**
 * Creates and validates a fluid property object from user parameters
 */
export function createFluidProperties(params: {
  id?: string;
  name: string;
  temperatureC: number;
  density: number; // kg/m³
  kinematicViscosity?: number; // cSt
  dynamicViscosity?: number; // Pa·s
  vaporPressureAbs: number | null | undefined; // kPa abs
  specificHeat?: number; // kJ/(kg·K)
}): { fluid: FluidProperties; validation: FluidValidationResult } {
  const warnings: string[] = [];
  const errors: string[] = [];

  const tempC = params.temperatureC;
  const density = params.density;

  if (density <= 0) {
    errors.push('Fluid density must be greater than 0 kg/m³.');
  } else if (density < 300 || density > 2500) {
    warnings.push(`Fluid density (${density} kg/m³) is outside common industrial liquid ranges (300 - 2500 kg/m³).`);
  }

  // Calculate or reconcile viscosities
  let nu = params.kinematicViscosity;
  let mu = params.dynamicViscosity;

  if (nu === undefined && mu !== undefined && density > 0) {
    // nu (cSt) = mu (Pa·s) * 1e6 / density
    nu = (mu * 1e6) / density;
  } else if (mu === undefined && nu !== undefined && density > 0) {
    // mu (Pa·s) = nu (cSt) * density * 1e-6
    mu = (nu * density) * 1e-6;
  } else if (nu === undefined && mu === undefined) {
    nu = 1.0;
    mu = (density > 0 ? density : 1000) * 1e-6;
    warnings.push('Viscosity not specified; default water-like viscosity (1.0 cSt) assigned.');
  }

  // Check vapor pressure
  const vaporPressure =
    params.vaporPressureAbs !== undefined ? params.vaporPressureAbs : null;

  if (vaporPressure === null || isNaN(vaporPressure)) {
    warnings.push(
      'Vapor pressure is missing or null. NPSHa, seal chamber vaporization margin, and cavitation calculations cannot be accurately assessed.'
    );
  } else if (vaporPressure < 0) {
    errors.push('Vapor pressure cannot be negative in absolute scale.');
  } else if (vaporPressure > 5000) {
    warnings.push(`Vapor pressure (${vaporPressure} kPa abs) is exceptionally high; verify liquid state at operating temperature.`);
  }

  const cp = params.specificHeat !== undefined && params.specificHeat > 0 ? params.specificHeat : 4.184;

  const fluid: FluidProperties = {
    id: params.id || 'custom_fluid',
    name: params.name || 'Custom Fluid',
    temperatureC: tempC,
    density: density > 0 ? density : 1000,
    dynamicViscosity: mu || 1e-3,
    kinematicViscosity: nu || 1.0,
    vaporPressureAbs: vaporPressure,
    specificHeat: cp,
    specificGravity: density > 0 ? density / 1000.0 : 1.0,
    isCustom: true,
  };

  return {
    fluid,
    validation: {
      isValid: errors.length === 0,
      warnings,
      errors,
    },
  };
}
