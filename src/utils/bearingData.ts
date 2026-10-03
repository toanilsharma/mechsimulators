import { BearingSpec } from '../types/rotor';

export const BEARING_CATALOG: BearingSpec[] = [
  {
    id: '6208',
    model: '6208 (Deep Groove Ball)',
    type: 'deep_groove',
    bearingCategory: 'ball',
    boreMm: 40,
    outerDiameterMm: 80,
    widthMm: 18,
    dynamicCapacityCrN: 32500, // 32.5 kN
    staticCapacityC0rN: 19000, // 19.0 kN
    limitingSpeedRpm: 9500,
    exponentP: 3.0,
    dmMm: 60,
  },
  {
    id: '6310',
    model: '6310 (Medium Deep Groove Ball)',
    type: 'deep_groove',
    bearingCategory: 'ball',
    boreMm: 50,
    outerDiameterMm: 110,
    widthMm: 27,
    dynamicCapacityCrN: 65000, // 65.0 kN
    staticCapacityC0rN: 38000,
    limitingSpeedRpm: 7500,
    exponentP: 3.0,
    dmMm: 80,
  },
  {
    id: '7312_becbm',
    model: '7312 BECBM (Angular Contact Ball 40°)',
    type: 'angular_contact',
    bearingCategory: 'ball',
    boreMm: 60,
    outerDiameterMm: 130,
    widthMm: 31,
    dynamicCapacityCrN: 104000, // 104.0 kN
    staticCapacityC0rN: 73500,
    limitingSpeedRpm: 6300,
    exponentP: 3.0,
    dmMm: 95,
  },
  {
    id: '7314_becbm',
    model: '7314 BECBM (Angular Contact Ball 40°)',
    type: 'angular_contact',
    bearingCategory: 'ball',
    boreMm: 70,
    outerDiameterMm: 150,
    widthMm: 35,
    dynamicCapacityCrN: 127000, // 127.0 kN
    staticCapacityC0rN: 95000,
    limitingSpeedRpm: 5600,
    exponentP: 3.0,
    dmMm: 110,
  },
  {
    id: '22216_e',
    model: '22216 E (Spherical Roller Bearing)',
    type: 'spherical_roller',
    bearingCategory: 'roller',
    boreMm: 80,
    outerDiameterMm: 140,
    widthMm: 33,
    dynamicCapacityCrN: 236000, // 236.0 kN
    staticCapacityC0rN: 255000,
    limitingSpeedRpm: 4500,
    exponentP: 10 / 3, // 3.333
    dmMm: 110,
  },
  {
    id: '22220_e',
    model: '22220 E (Heavy Spherical Roller)',
    type: 'spherical_roller',
    bearingCategory: 'roller',
    boreMm: 100,
    outerDiameterMm: 180,
    widthMm: 46,
    dynamicCapacityCrN: 425000, // 425.0 kN
    staticCapacityC0rN: 490000,
    limitingSpeedRpm: 3400,
    exponentP: 10 / 3,
    dmMm: 140,
  },
  {
    id: 'nu_310_ecp',
    model: 'NU 310 ECP (Cylindrical Roller)',
    type: 'cylindrical_roller',
    bearingCategory: 'roller',
    boreMm: 50,
    outerDiameterMm: 110,
    widthMm: 27,
    dynamicCapacityCrN: 114000, // 114.0 kN
    staticCapacityC0rN: 104000,
    limitingSpeedRpm: 7000,
    exponentP: 10 / 3,
    dmMm: 80,
  },
  {
    id: 'custom_bearing',
    model: 'Custom User-Specified Bearing',
    type: 'deep_groove',
    bearingCategory: 'ball',
    boreMm: 50,
    outerDiameterMm: 100,
    widthMm: 25,
    dynamicCapacityCrN: 50000,
    staticCapacityC0rN: 30000,
    limitingSpeedRpm: 8000,
    exponentP: 3.0,
    dmMm: 75,
  },
];

export function getBearing(id: string): BearingSpec {
  return BEARING_CATALOG.find((b) => b.id === id) || BEARING_CATALOG[1]; // default 6310
}
