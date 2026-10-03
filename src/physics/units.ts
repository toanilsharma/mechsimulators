/**
 * Core Engineering Units and Conversions Module
 * Unit-safe, bi-directional conversion functions with strict floating-point accuracy.
 */

// Length Conversions
export function mToFt(m: number): number {
  return m * 3.280839895013123;
}

export function ftToM(ft: number): number {
  return ft / 3.280839895013123;
}

export function mmToInch(mm: number): number {
  return mm / 25.4;
}

export function inchToMm(inch: number): number {
  return inch * 25.4;
}

export function mToMm(m: number): number {
  return m * 1000.0;
}

export function mmToM(mm: number): number {
  return mm / 1000.0;
}

// Mass Conversions
export function kgToLb(kg: number): number {
  return kg * 2.2046226218487757;
}

export function lbToKg(lb: number): number {
  return lb / 2.2046226218487757;
}

export function gToOz(g: number): number {
  return g * 0.03527396195;
}

export function ozToG(oz: number): number {
  return oz / 0.03527396195;
}

// Temperature Conversions
export function cToF(c: number): number {
  return (c * 9.0) / 5.0 + 32.0;
}

export function fToC(f: number): number {
  return ((f - 32.0) * 5.0) / 9.0;
}

export function cToK(c: number): number {
  return c + 273.15;
}

export function kToC(k: number): number {
  return k - 273.15;
}

export function deltaCToDeltaF(deltaC: number): number {
  return (deltaC * 9.0) / 5.0;
}

export function deltaFToDeltaC(deltaF: number): number {
  return (deltaF * 5.0) / 9.0;
}

// Pressure Conversions (Base: Pa)
export function kpaToBar(kpa: number): number {
  return kpa / 100.0;
}

export function barToKpa(bar: number): number {
  return bar * 100.0;
}

export function kpaToPsi(kpa: number): number {
  return kpa * 0.14503773773;
}

export function psiToKpa(psi: number): number {
  return psi / 0.14503773773;
}

export function paToKpa(pa: number): number {
  return pa / 1000.0;
}

export function kpaToPa(kpa: number): number {
  return kpa * 1000.0;
}

export function barToPsi(bar: number): number {
  return bar * 14.503773773;
}

export function psiToBar(psi: number): number {
  return psi / 14.503773773;
}

export function mHeadToKpa(headM: number, densityKgM3: number, g = 9.80665): number {
  // P = rho * g * h (Pa) -> / 1000 = kPa
  return (densityKgM3 * g * headM) / 1000.0;
}

export function kpaToMHead(kpa: number, densityKgM3: number, g = 9.80665): number {
  // h = P / (rho * g)
  if (densityKgM3 <= 0) return 0;
  return (kpa * 1000.0) / (densityKgM3 * g);
}

// Volumetric Flow Conversions
export function m3hToUsGpm(m3h: number): number {
  return m3h * 4.4028675393;
}

export function usGpmToM3h(gpm: number): number {
  return gpm / 4.4028675393;
}

export function m3hToLs(m3h: number): number {
  return m3h / 3.6;
}

export function lsToM3h(ls: number): number {
  return ls * 3.6;
}

export function lpmToUsGpm(lpm: number): number {
  return lpm * 0.2641720524;
}

export function usGpmToLpm(gpm: number): number {
  return gpm / 0.2641720524;
}

export function lpmToM3h(lpm: number): number {
  return lpm * 0.06;
}

export function m3hToLpm(m3h: number): number {
  return m3h / 0.06;
}

export function m3sToM3h(m3s: number): number {
  return m3s * 3600.0;
}

export function m3hToM3s(m3h: number): number {
  return m3h / 3600.0;
}

// Power Conversions
export function kwToHp(kw: number): number {
  // Mechanical horsepower (1 hp = 745.699872 W)
  return kw / 0.745699872;
}

export function hpToKw(hp: number): number {
  return hp * 0.745699872;
}

export function wToKw(w: number): number {
  return w / 1000.0;
}

export function kwToW(kw: number): number {
  return kw * 1000.0;
}

// Force Conversions
export function nToKn(n: number): number {
  return n / 1000.0;
}

export function knToN(kn: number): number {
  return kn * 1000.0;
}

export function nToLbf(n: number): number {
  return n * 0.2248089431;
}

export function lbfToN(lbf: number): number {
  return lbf / 0.2248089431;
}

export function knToLbf(kn: number): number {
  return kn * 224.8089431;
}

export function lbfToKn(lbf: number): number {
  return lbf / 224.8089431;
}

// Angular Velocity Conversions
export function rpmToRadS(rpm: number): number {
  // omega = (2 * pi * RPM) / 60
  return (rpm * 2.0 * Math.PI) / 60.0;
}

export function radSToRpm(radS: number): number {
  return (radS * 60.0) / (2.0 * Math.PI);
}

export function rpmToHz(rpm: number): number {
  return rpm / 60.0;
}

export function hzToRpm(hz: number): number {
  return hz * 60.0;
}

// Unbalance Conversions (Mass × Radius)
export function gMmToKgM(gMm: number): number {
  // 1 g = 1e-3 kg, 1 mm = 1e-3 m -> 1 g*mm = 1e-6 kg*m
  return gMm * 1e-6;
}

export function kgMToGMm(kgM: number): number {
  return kgM * 1e6;
}

export function gMmToOzIn(gMm: number): number {
  // 1 g*mm = (1/28.3495 oz) * (1/25.4 in) = 0.00138874 oz*in
  return gMm * 0.00138873865;
}

export function ozInToGMm(ozIn: number): number {
  return ozIn / 0.00138873865;
}

// Velocity Conversions
export function msToFts(ms: number): number {
  return ms * 3.280839895;
}

export function ftsToMs(fts: number): number {
  return fts / 3.280839895;
}

export function mmSToInS(mmS: number): number {
  return mmS / 25.4;
}

export function inSToMmS(inS: number): number {
  return inS * 25.4;
}
