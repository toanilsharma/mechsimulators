import { PipeMaterialType } from '../types/pipe';

export interface PipeDimension {
  nps: number; // inches
  schedule: '10' | '40' | '80' | '160';
  outerDiameterMm: number;
  wallThicknessMm: number;
  innerDiameterMm: number;
}

export interface MaterialDefaultData {
  type: PipeMaterialType;
  name: string;
  spec: string;
  modulusOfElasticityGPa: number;
  thermalExpansionCoeff_1e6PerC: number;
  allowableStressMPa: number;
  poissonsRatio: number;
  densityKgM3: number;
}

export const MATERIAL_DATABASE: Record<PipeMaterialType, MaterialDefaultData> = {
  carbon_steel: {
    type: 'carbon_steel',
    name: 'Carbon Steel (ASTM A106 Gr. B / A53)',
    spec: 'ASME B31.3 Table A-1 (CS)',
    modulusOfElasticityGPa: 200.0, // 200 GPa (~29.0 Msi)
    thermalExpansionCoeff_1e6PerC: 12.0, // 12.0 x 10^-6 /°C (benchmark)
    allowableStressMPa: 137.9, // 20.0 ksi
    poissonsRatio: 0.30,
    densityKgM3: 7850,
  },
  stainless_steel: {
    type: 'stainless_steel',
    name: 'Stainless Steel (ASTM A312 TP304/316)',
    spec: 'ASME B31.3 Table A-1 (Austenitic)',
    modulusOfElasticityGPa: 195.0, // 195 GPa
    thermalExpansionCoeff_1e6PerC: 16.5, // 16.5 x 10^-6 /°C (high thermal growth)
    allowableStressMPa: 137.9, // 20.0 ksi
    poissonsRatio: 0.30,
    densityKgM3: 8000,
  },
  alloy_steel: {
    type: 'alloy_steel',
    name: 'Low Alloy Steel (ASTM A335 P11/P22 Cr-Mo)',
    spec: 'ASME B31.3 Table A-1 (1.25Cr-0.5Mo / 2.25Cr-1Mo)',
    modulusOfElasticityGPa: 205.0, // 205 GPa
    thermalExpansionCoeff_1e6PerC: 13.0, // 13.0 x 10^-6 /°C
    allowableStressMPa: 137.9, // 20.0 ksi
    poissonsRatio: 0.29,
    densityKgM3: 7850,
  },
  custom: {
    type: 'custom',
    name: 'Custom User-Defined Material',
    spec: 'User Specification',
    modulusOfElasticityGPa: 200.0,
    thermalExpansionCoeff_1e6PerC: 12.0,
    allowableStressMPa: 137.9,
    poissonsRatio: 0.30,
    densityKgM3: 7850,
  },
};

export interface PipeSizeData {
  preset: string;
  label: string;
  nps: number;
  odMm: number;
  wallMm: number;
  defaultNozzleLimitKN: number;
}

export const PIPE_SIZE_DATABASE: Record<string, PipeSizeData> = {
  DN50: { preset: 'DN50', label: 'DN50 / 2" (60.3 mm OD, 3.91 mm t)', nps: 2, odMm: 60.3, wallMm: 3.91, defaultNozzleLimitKN: 6.0 },
  DN80: { preset: 'DN80', label: 'DN80 / 3" (88.9 mm OD, 5.49 mm t)', nps: 3, odMm: 88.9, wallMm: 5.49, defaultNozzleLimitKN: 9.0 },
  DN100: { preset: 'DN100', label: 'DN100 / 4" (114.3 mm OD, 6.02 mm t)', nps: 4, odMm: 114.3, wallMm: 6.02, defaultNozzleLimitKN: 12.0 },
  DN150: { preset: 'DN150', label: 'DN150 / 6" (168.3 mm OD, 7.11 mm t)', nps: 6, odMm: 168.3, wallMm: 7.11, defaultNozzleLimitKN: 18.0 },
  DN200: { preset: 'DN200', label: 'DN200 / 8" (219.1 mm OD, 8.18 mm t)', nps: 8, odMm: 219.1, wallMm: 8.18, defaultNozzleLimitKN: 25.0 },
  custom: { preset: 'custom', label: 'Custom Dimension', nps: 6, odMm: 168.3, wallMm: 7.11, defaultNozzleLimitKN: 18.0 },
};

// ASME B36.10M standard pipe dimensions
export const PIPE_DIMENSIONS: Record<string, PipeDimension> = {
  '2-10': { nps: 2, schedule: '10', outerDiameterMm: 60.3, wallThicknessMm: 2.77, innerDiameterMm: 54.76 },
  '2-40': { nps: 2, schedule: '40', outerDiameterMm: 60.3, wallThicknessMm: 3.91, innerDiameterMm: 52.48 },
  '2-80': { nps: 2, schedule: '80', outerDiameterMm: 60.3, wallThicknessMm: 5.54, innerDiameterMm: 49.22 },
  '2-160': { nps: 2, schedule: '160', outerDiameterMm: 60.3, wallThicknessMm: 8.74, innerDiameterMm: 42.82 },

  '3-10': { nps: 3, schedule: '10', outerDiameterMm: 88.9, wallThicknessMm: 3.05, innerDiameterMm: 82.8 },
  '3-40': { nps: 3, schedule: '40', outerDiameterMm: 88.9, wallThicknessMm: 5.49, innerDiameterMm: 77.92 },
  '3-80': { nps: 3, schedule: '80', outerDiameterMm: 88.9, wallThicknessMm: 7.62, innerDiameterMm: 73.66 },

  '4-10': { nps: 4, schedule: '10', outerDiameterMm: 114.3, wallThicknessMm: 3.05, innerDiameterMm: 108.2 },
  '4-40': { nps: 4, schedule: '40', outerDiameterMm: 114.3, wallThicknessMm: 6.02, innerDiameterMm: 102.26 },
  '4-80': { nps: 4, schedule: '80', outerDiameterMm: 114.3, wallThicknessMm: 8.56, innerDiameterMm: 97.18 },
  '4-160': { nps: 4, schedule: '160', outerDiameterMm: 114.3, wallThicknessMm: 13.49, innerDiameterMm: 87.32 },

  '6-10': { nps: 6, schedule: '10', outerDiameterMm: 168.3, wallThicknessMm: 3.40, innerDiameterMm: 161.5 },
  '6-40': { nps: 6, schedule: '40', outerDiameterMm: 168.3, wallThicknessMm: 7.11, innerDiameterMm: 154.08 },
  '6-80': { nps: 6, schedule: '80', outerDiameterMm: 168.3, wallThicknessMm: 10.97, innerDiameterMm: 146.36 },
  '6-160': { nps: 6, schedule: '160', outerDiameterMm: 168.3, wallThicknessMm: 18.26, innerDiameterMm: 131.78 },

  '8-10': { nps: 8, schedule: '10', outerDiameterMm: 219.1, wallThicknessMm: 3.76, innerDiameterMm: 211.58 },
  '8-40': { nps: 8, schedule: '40', outerDiameterMm: 219.1, wallThicknessMm: 8.18, innerDiameterMm: 202.74 },
  '8-80': { nps: 8, schedule: '80', outerDiameterMm: 219.1, wallThicknessMm: 12.7, innerDiameterMm: 193.7 },
  '8-160': { nps: 8, schedule: '160', outerDiameterMm: 219.1, wallThicknessMm: 23.01, innerDiameterMm: 173.08 },

  '10-40': { nps: 10, schedule: '40', outerDiameterMm: 273.0, wallThicknessMm: 9.27, innerDiameterMm: 254.46 },
  '10-80': { nps: 10, schedule: '80', outerDiameterMm: 273.0, wallThicknessMm: 15.09, innerDiameterMm: 242.82 },

  '12-40': { nps: 12, schedule: '40', outerDiameterMm: 323.8, wallThicknessMm: 10.31, innerDiameterMm: 303.18 },
  '12-80': { nps: 12, schedule: '80', outerDiameterMm: 323.8, wallThicknessMm: 17.48, innerDiameterMm: 288.84 },

  '14-40': { nps: 14, schedule: '40', outerDiameterMm: 355.6, wallThicknessMm: 11.13, innerDiameterMm: 333.34 },
  '16-40': { nps: 16, schedule: '40', outerDiameterMm: 406.4, wallThicknessMm: 12.7, innerDiameterMm: 381.0 },
};

export function getPipeDimensions(nps: number, schedule: '10' | '40' | '80' | '160'): PipeDimension {
  const key = `${nps}-${schedule}`;
  if (PIPE_DIMENSIONS[key]) {
    return PIPE_DIMENSIONS[key];
  }
  const od = nps <= 12 ? (nps + 0.375) * 25.4 : nps * 25.4;
  const wt = schedule === '80' ? 8.5 : schedule === '160' ? 14.0 : 6.0;
  return {
    nps,
    schedule,
    outerDiameterMm: od,
    wallThicknessMm: wt,
    innerDiameterMm: od - 2 * wt,
  };
}

// Legacy export for backward compatibility
export const PIPE_MATERIALS: Record<string, any> = {
  a106_b: {
    id: 'a106_b',
    name: 'Carbon Steel ASTM A106 Gr. B',
    spec: 'ASME B31.3 Table A-1 (CS)',
    coldAllowableStressSc_MPa: 137.9,
    hotAllowableStressSh_MPa_at_temp: () => 137.9,
    elasticModulusE_GPa_at_temp: () => 200.0,
    meanAlpha1e6_PerC_at_temp: () => 12.0,
    poissonsRatio: 0.3,
  },
  a312_tp304: {
    id: 'a312_tp304',
    name: 'Stainless Steel ASTM A312 TP304',
    spec: 'ASME B31.3 Table A-1 (Austenitic)',
    coldAllowableStressSc_MPa: 137.9,
    hotAllowableStressSh_MPa_at_temp: () => 124.0,
    elasticModulusE_GPa_at_temp: () => 195.0,
    meanAlpha1e6_PerC_at_temp: () => 16.5,
    poissonsRatio: 0.3,
  },
  a335_p11: {
    id: 'a335_p11',
    name: 'Low Alloy Steel ASTM A335 P11 (1.25Cr-0.5Mo)',
    spec: 'ASME B31.3 Table A-1 (Cr-Mo)',
    coldAllowableStressSc_MPa: 137.9,
    hotAllowableStressSh_MPa_at_temp: () => 137.9,
    elasticModulusE_GPa_at_temp: () => 205.0,
    meanAlpha1e6_PerC_at_temp: () => 13.0,
    poissonsRatio: 0.29,
  },
};
