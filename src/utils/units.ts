import { UnitSystem } from '../types/common';

export const UNITS = {
  metric: {
    pressure: 'kPa',
    pressureGauge: 'kPag',
    pressureBar: 'bar',
    head: 'm',
    flow: 'm³/h',
    flowLpm: 'L/min',
    flowGpm: 'L/min',
    temperature: '°C',
    length: 'm',
    lengthMm: 'mm',
    lengthCm: 'cm',
    diameter: 'mm',
    velocity: 'm/s',
    force: 'N',
    forceKn: 'kN',
    moment: 'kN·m',
    stress: 'MPa',
    power: 'kW',
    mass: 'kg',
    massGrams: 'g',
    unbalance: 'g·mm',
    eccentricity: 'µm',
    vibrationVel: 'mm/s rms',
    vibrationDisp: 'µm pk-pk',
    density: 'kg/m³',
    viscosity: 'cSt',
    roughness: 'mm',
  },
  us: {
    pressure: 'psi',
    pressureGauge: 'psig',
    pressureBar: 'psi',
    head: 'ft',
    flow: 'gpm',
    flowLpm: 'gpm',
    flowGpm: 'gpm',
    temperature: '°F',
    length: 'ft',
    lengthMm: 'in',
    lengthCm: 'in',
    diameter: 'in',
    velocity: 'ft/s',
    force: 'lbf',
    forceKn: 'lbf',
    moment: 'ft·lbf',
    stress: 'psi',
    power: 'hp',
    mass: 'lb',
    massGrams: 'oz',
    unbalance: 'oz·in',
    eccentricity: 'mils',
    vibrationVel: 'in/s rms',
    vibrationDisp: 'mils pk-pk',
    density: 'lb/ft³',
    viscosity: 'SSU',
    roughness: 'in',
  },
};

export function convertPressure(valueKPa: number, system: UnitSystem): { val: number; unit: string } {
  if (system === 'us') {
    return { val: valueKPa * 0.145038, unit: 'psi' };
  }
  return { val: valueKPa, unit: 'kPa' };
}

export function convertPressureGauge(valueKPag: number, system: UnitSystem): { val: number; unit: string } {
  if (system === 'us') {
    return { val: valueKPag * 0.145038, unit: 'psig' };
  }
  return { val: valueKPag, unit: 'kPag' };
}

export function convertHead(valueM: number, system: UnitSystem): { val: number; unit: string } {
  if (system === 'us') {
    return { val: valueM * 3.28084, unit: 'ft' };
  }
  return { val: valueM, unit: 'm' };
}

export function convertFlow(valueM3h: number, system: UnitSystem): { val: number; unit: string } {
  if (system === 'us') {
    return { val: valueM3h * 4.40287, unit: 'gpm' };
  }
  return { val: valueM3h, unit: 'm³/h' };
}

export function convertFlowLpm(valueLpm: number, system: UnitSystem): { val: number; unit: string } {
  if (system === 'us') {
    return { val: valueLpm * 0.264172, unit: 'gpm' };
  }
  return { val: valueLpm, unit: 'L/min' };
}

export function convertTemp(valueC: number, system: UnitSystem): { val: number; unit: string } {
  if (system === 'us') {
    return { val: (valueC * 9) / 5 + 32, unit: '°F' };
  }
  return { val: valueC, unit: '°C' };
}

export function convertLength(valueM: number, system: UnitSystem): { val: number; unit: string } {
  if (system === 'us') {
    return { val: valueM * 3.28084, unit: 'ft' };
  }
  return { val: valueM, unit: 'm' };
}

export function convertMmToInches(valueMm: number, system: UnitSystem): { val: number; unit: string } {
  if (system === 'us') {
    return { val: valueMm / 25.4, unit: 'in' };
  }
  return { val: valueMm, unit: 'mm' };
}

export const convertLengthMm = convertMmToInches;

export function convertStress(valueMPa: number, system: UnitSystem): { val: number; unit: string } {
  if (system === 'us') {
    return { val: valueMPa * 145.038, unit: 'psi' };
  }
  return { val: valueMPa, unit: 'MPa' };
}

export function convertVelocity(valueMs: number, system: UnitSystem): { val: number; unit: string } {
  if (system === 'us') {
    return { val: valueMs * 3.28084, unit: 'ft/s' };
  }
  return { val: valueMs, unit: 'm/s' };
}

export function convertForce(valueN: number, system: UnitSystem): { val: number; unit: string } {
  if (system === 'us') {
    return { val: valueN * 0.224809, unit: 'lbf' };
  }
  return { val: valueN, unit: 'N' };
}

export function convertForceKn(valueKn: number, system: UnitSystem): { val: number; unit: string } {
  if (system === 'us') {
    return { val: valueKn * 224.809, unit: 'lbf' };
  }
  return { val: valueKn, unit: 'kN' };
}

export function convertPower(valueKW: number, system: UnitSystem): { val: number; unit: string } {
  if (system === 'us') {
    return { val: valueKW * 1.34102, unit: 'HP' };
  }
  return { val: valueKW, unit: 'kW' };
}

export function convertVibrationVelocity(valueMmS: number, system: UnitSystem): { val: number; unit: string } {
  if (system === 'us') {
    return { val: valueMmS / 25.4, unit: 'in/s' };
  }
  return { val: valueMmS, unit: 'mm/s' };
}

export function convertVibrationDisp(valueMicrons: number, system: UnitSystem): { val: number; unit: string } {
  if (system === 'us') {
    return { val: valueMicrons / 25.4, unit: 'mils' };
  }
  return { val: valueMicrons, unit: 'µm' };
}

export function formatNum(value: number, decimals: number = 2): string {
  if (isNaN(value) || !isFinite(value)) return '--';
  if (Math.abs(value) >= 10000) {
    return value.toLocaleString('en-US', { maximumFractionDigits: 1 });
  }
  if (Math.abs(value) < 0.01 && value !== 0) {
    return value.toExponential(2);
  }
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}
