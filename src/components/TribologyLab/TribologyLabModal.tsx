import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Download,
  Droplet,
  Activity,
  Gauge,
  Thermometer,
  Sliders,
  Layers,
  Filter,
  RefreshCw,
  Search,
  BookOpen,
} from 'lucide-react';
import {
  calculateIso4406Assessment,
  calculateViscosityAtTemp,
  calculateWaterContamination,
  calculateGreaseRelubeInterval,
  STANDARD_ISO_VG_GRADES,
  WEAR_DEBRIS_LIBRARY,
  WearDebrisMorphology,
} from '../../physics/tribologyLabMath';
import { STANDARDS_SAFE_DISCLAIMER_SHORT } from '../../utils/standardsSafeHarbor';

interface TribologyLabModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TribologyLabModal: React.FC<TribologyLabModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'iso4406' | 'viscosity' | 'water' | 'ferrography' | 'grease'>('iso4406');

  // --- TAB 1: ISO 4406 State ---
  const [count4um, setCount4um] = useState<number>(1850);
  const [count6um, setCount6um] = useState<number>(420);
  const [count14um, setCount14um] = useState<number>(68);
  const [machineClass, setMachineClass] = useState<'turbine' | 'compressor' | 'pump' | 'gearbox' | 'bearing'>('gearbox');

  const isoAssessment = useMemo(() => {
    return calculateIso4406Assessment({
      count4um,
      count6um,
      count14um,
      machineType: machineClass,
    });
  }, [count4um, count6um, count14um, machineClass]);

  // --- TAB 2: ASTM D341 Viscosity State ---
  const [selectedIsoVg, setSelectedIsoVg] = useState<string>('VG 220');
  const [operatingTempC, setOperatingTempC] = useState<number>(75);

  const viscosityAssessment = useMemo(() => {
    const grade = STANDARD_ISO_VG_GRADES[selectedIsoVg] || STANDARD_ISO_VG_GRADES['VG 220'];
    return calculateViscosityAtTemp(grade.cStAt40C, grade.cStAt100C, operatingTempC);
  }, [selectedIsoVg, operatingTempC]);

  // --- TAB 3: Karl Fischer Water State ---
  const [waterPpm, setWaterPpm] = useState<number>(380);
  const [waterTempC, setWaterTempC] = useState<number>(65);
  const [oilBase, setOilBase] = useState<'mineral' | 'synthetic_pao' | 'ester'>('mineral');

  const waterAssessment = useMemo(() => {
    return calculateWaterContamination({
      waterPpm,
      tempC: waterTempC,
      oilBase,
    });
  }, [waterPpm, waterTempC, oilBase]);

  // --- TAB 4: Ferrography State ---
  const [selectedDebrisId, setSelectedDebrisId] = useState<string>('rolling-fatigue');
  const activeDebris = useMemo(() => {
    return WEAR_DEBRIS_LIBRARY.find((d) => d.id === selectedDebrisId) || WEAR_DEBRIS_LIBRARY[0];
  }, [selectedDebrisId]);

  // --- TAB 5: Grease Relube State ---
  const [bearingBoreMm, setBearingBoreMm] = useState<number>(65);
  const [bearingOdMm, setBearingOdMm] = useState<number>(140);
  const [bearingWidthMm, setBearingWidthMm] = useState<number>(33);
  const [bearingRpm, setBearingRpm] = useState<number>(1780);
  const [bearingType, setBearingType] = useState<'deep_groove_ball' | 'cylindrical_roller' | 'spherical_roller' | 'tapered_roller'>('spherical_roller');
  const [bearingTempC, setBearingTempC] = useState<number>(72);
  const [bearingEnv, setBearingEnv] = useState<'clean' | 'dusty' | 'severe_water'>('clean');
  const [bearingVib, setBearingVib] = useState<'low' | 'moderate' | 'high'>('low');

  const greaseAssessment = useMemo(() => {
    return calculateGreaseRelubeInterval({
      bearingBoreMm,
      outerDiameterMm: bearingOdMm,
      bearingWidthMm,
      rpm: bearingRpm,
      bearingType,
      tempC: bearingTempC,
      environment: bearingEnv,
      vibration: bearingVib,
    });
  }, [bearingBoreMm, bearingOdMm, bearingWidthMm, bearingRpm, bearingType, bearingTempC, bearingEnv, bearingVib]);

  // Export Tribology Lab Report
  const handleExportReport = () => {
    const report = `# LUBRICATION TRIBOLOGY & OIL ANALYSIS LABORATORY REPORT
Reference Standards: ISO 4406:2021, ASTM D341-20, ASTM D2270, DIN 51825
Generated: ${new Date().toISOString()}

## 1. ISO 4406 Solid Particulate Contamination
- Measured Particle Counts:
  - > 4 µm: ${count4um} particles/mL (Code ${isoAssessment.code4um})
  - > 6 µm: ${count6um} particles/mL (Code ${isoAssessment.code6um})
  - > 14 µm: ${count14um} particles/mL (Code ${isoAssessment.code14um})
- ISO 4406 Rating: ${isoAssessment.codeString}
- Target Specification for ${machineClass.toUpperCase()}: ${isoAssessment.targetCodeForMachine}
- Compliance Status: ${isoAssessment.isCompliantWithTarget ? 'PASS / COMPLIANT' : 'FAIL / OUT OF SPECIFICATION'}
- Noria Life Extension Factor (LEF): ${isoAssessment.lifeExtensionFactor}x
- Filtration Strategy: ${isoAssessment.filterRecommendation.micronRating}, Beta Ratio >= ${isoAssessment.filterRecommendation.targetBetaRatio}

## 2. ASTM D341 Kinematic Viscosity & EHL Film
- Selected Grade: ${selectedIsoVg}
- Operating Temperature: ${operatingTempC} °C
- Kinematic Viscosity @ ${operatingTempC} °C: ${viscosityAssessment.viscosityAtTemp} cSt
- Calculated Viscosity Index (VI): ${viscosityAssessment.viscosityIndex}
- Lubrication Film Parameter (Kappa λ): ${viscosityAssessment.filmParameterKappa}
- Lubrication Regime: ${viscosityAssessment.regime}

## 3. Karl Fischer Moisture Ingress & Degradation
- Moisture Concentration: ${waterPpm} ppm
- Moisture State: ${waterAssessment.state}
- Saturation Limit @ ${waterTempC} °C: ${waterAssessment.saturationLimitPpm} ppm
- Bearing Fatigue Life Derating Factor: ${waterAssessment.bearingLifeDeratingFactor} (Retained Life: ${(waterAssessment.bearingLifeDeratingFactor * 100).toFixed(0)}%)
- Corrosion / Embrittlement Risk: ${waterAssessment.corrosionRisk}

## 4. DIN 51825 Bearing Relubrication
- Bearing Dimensions: ${bearingBoreMm}x${bearingOdMm}x${bearingWidthMm} mm @ ${bearingRpm} RPM (${greaseAssessment.ndmFactor} n-dm)
- Re-Greasing Frequency: ${greaseAssessment.relubeIntervalHours} operating hours (${greaseAssessment.relubeIntervalDays} days)
- Grease Quantity per Shot: ${greaseAssessment.greaseQuantityGrams} grams

---
${STANDARDS_SAFE_DISCLAIMER_SHORT}
`;

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tribology_Oil_Analysis_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      id="tribology-lab-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div
        id="tribology-lab-modal-container"
        className="relative flex flex-col w-full max-w-6xl max-h-[92vh] bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden text-[#c9d1d9]"
      >
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#161b22] border-b border-[#30363d] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-400">
              <Droplet size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-950/50 text-amber-400 border border-amber-500/30">
                  Pillar 11 • Tribology & Oil Lab
                </span>
                <span className="text-[10px] font-mono text-[#8b949e]">
                  ISO 4406 / ASTM D341 / DIN 51825
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Lubrication Tribology, ISO Cleanliness & Oil Degradation Lab
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-export-tribology-report"
              type="button"
              onClick={handleExportReport}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold text-white bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded transition-colors"
            >
              <Download size={13} className="text-[#58a6ff]" />
              <span>Export Lab Dossier</span>
            </button>

            <button
              id="btn-close-tribology-modal"
              type="button"
              onClick={onClose}
              className="p-1 text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 border-b border-[#30363d] bg-[#0d1117] shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('iso4406')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'iso4406'
                ? 'border-amber-400 text-white font-bold bg-[#161b22]/60'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <Filter size={13} className="text-amber-400" />
            <span>ISO 4406 Solid Cleanliness Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('viscosity')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'viscosity'
                ? 'border-amber-400 text-white font-bold bg-[#161b22]/60'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <Gauge size={13} className="text-amber-400" />
            <span>ASTM D341 Viscosity-Temperature Solver</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('water')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'water'
                ? 'border-amber-400 text-white font-bold bg-[#161b22]/60'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <Droplet size={13} className="text-amber-400" />
            <span>Karl Fischer Water Contamination</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ferrography')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'ferrography'
                ? 'border-amber-400 text-white font-bold bg-[#161b22]/60'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <Layers size={13} className="text-amber-400" />
            <span>Ferrography & Wear Debris Library</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('grease')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'grease'
                ? 'border-amber-400 text-white font-bold bg-[#161b22]/60'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <RefreshCw size={13} className="text-amber-400" />
            <span>DIN 51825 Grease Relube Interval</span>
          </button>
        </div>

        {/* Modal Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: ISO 4406 SOLID PARTICULATE CONTAMINATION */}
          {activeTab === 'iso4406' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Controls */}
                <div className="space-y-3 bg-[#161b22] p-4 rounded-lg border border-[#30363d]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white uppercase">
                      Particle Counter Inputs
                    </span>
                    <span className="text-[10px] font-mono text-[#8b949e]">Particles / mL</span>
                  </div>

                  {/* Machine Class */}
                  <div>
                    <label className="text-[11px] font-mono text-[#8b949e] block mb-1">
                      Equipment Application:
                    </label>
                    <select
                      value={machineClass}
                      onChange={(e) => setMachineClass(e.target.value as any)}
                      className="w-full px-2.5 py-1 text-xs font-mono bg-[#0d1117] border border-[#30363d] rounded text-white focus:border-[#58a6ff] focus:outline-none"
                    >
                      <option value="turbine">Steam / Gas Turbine (Target: 16/14/11)</option>
                      <option value="compressor">Centrifugal Compressor (Target: 17/15/12)</option>
                      <option value="gearbox">Industrial Gearbox (Target: 18/16/13)</option>
                      <option value="pump">Boiler Feed / Process Pump (Target: 18/16/13)</option>
                      <option value="bearing">Precision Rolling Element Bearing (Target: 16/14/11)</option>
                    </select>
                  </div>

                  {/* > 4 um slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#c9d1d9]">&gt; 4 µm (c) Particles:</span>
                      <span className="text-amber-400 font-bold">{count4um.toLocaleString()} / mL</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={10000}
                      step={25}
                      value={count4um}
                      onChange={(e) => setCount4um(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                    <div className="text-[10px] font-mono text-[#8b949e] text-right">
                      ISO Code: <b className="text-white">{isoAssessment.code4um}</b>
                    </div>
                  </div>

                  {/* > 6 um slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#c9d1d9]">&gt; 6 µm (c) Particles:</span>
                      <span className="text-amber-400 font-bold">{count6um.toLocaleString()} / mL</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={2500}
                      step={10}
                      value={count6um}
                      onChange={(e) => setCount6um(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                    <div className="text-[10px] font-mono text-[#8b949e] text-right">
                      ISO Code: <b className="text-white">{isoAssessment.code6um}</b>
                    </div>
                  </div>

                  {/* > 14 um slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#c9d1d9]">&gt; 14 µm (c) Particles:</span>
                      <span className="text-amber-400 font-bold">{count14um.toLocaleString()} / mL</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={500}
                      step={2}
                      value={count14um}
                      onChange={(e) => setCount14um(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                    <div className="text-[10px] font-mono text-[#8b949e] text-right">
                      ISO Code: <b className="text-white">{isoAssessment.code14um}</b>
                    </div>
                  </div>
                </div>

                {/* Right Results & Visuals */}
                <div className="lg:col-span-2 space-y-3">
                  {/* Big Assessment Card */}
                  <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-lg">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#8b949e] block">
                          Current Fluid Cleanliness Code
                        </span>
                        <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-wider">
                          ISO {isoAssessment.codeString}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#8b949e] block">
                          Target Spec for {machineClass.toUpperCase()}
                        </span>
                        <div className="text-xl font-mono font-bold text-[#58a6ff]">
                          ISO {isoAssessment.targetCodeForMachine}
                        </div>
                      </div>

                      <div
                        className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-xs ${
                          isoAssessment.isCompliantWithTarget
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                            : 'bg-rose-950/60 text-rose-400 border-rose-500/40'
                        }`}
                      >
                        {isoAssessment.isCompliantWithTarget
                          ? 'TARGET COMPLIANT'
                          : 'EXCEEDS CONTAMINATION LIMIT'}
                      </div>
                    </div>

                    {/* Metric Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-[#30363d] text-xs font-mono">
                      <div className="p-2.5 bg-[#0d1117] rounded border border-[#30363d]">
                        <span className="text-[#8b949e] text-[10px] uppercase block">Cleanliness Tier</span>
                        <span className="text-white font-bold">{isoAssessment.cleanlinessClass}</span>
                      </div>
                      <div className="p-2.5 bg-[#0d1117] rounded border border-[#30363d]">
                        <span className="text-[#8b949e] text-[10px] uppercase block">Life Extension Factor (LEF)</span>
                        <span className="text-emerald-400 font-bold">{isoAssessment.lifeExtensionFactor}x Normal Life</span>
                      </div>
                      <div className="p-2.5 bg-[#0d1117] rounded border border-[#30363d]">
                        <span className="text-[#8b949e] text-[10px] uppercase block">Filtration Spec</span>
                        <span className="text-cyan-300 font-bold">
                          {isoAssessment.filterRecommendation.micronRating} (β≥1000)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Particle Log Distribution SVG Bar Visualization */}
                  <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-lg">
                    <span className="text-xs font-mono font-bold text-white uppercase block mb-2">
                      Particle Size Spectrum vs ISO 4406 Range Limits
                    </span>

                    <div className="h-32 w-full flex items-end justify-around gap-6 pt-4 px-4 bg-[#0d1117] rounded border border-[#30363d]/60">
                      {/* 4um Bar */}
                      <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <span className="text-[10px] font-mono text-amber-400 font-bold">
                          {count4um} /mL
                        </span>
                        <div
                          className="w-full max-w-[60px] bg-gradient-to-t from-amber-600 to-amber-400 rounded-t transition-all duration-300"
                          style={{ height: `${Math.min(100, Math.max(15, (Math.log10(count4um) / 4) * 100))}%` }}
                        />
                        <span className="text-xs font-mono text-white font-bold">&gt; 4 µm</span>
                        <span className="text-[10px] font-mono text-[#8b949e]">Code {isoAssessment.code4um}</span>
                      </div>

                      {/* 6um Bar */}
                      <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <span className="text-[10px] font-mono text-amber-400 font-bold">
                          {count6um} /mL
                        </span>
                        <div
                          className="w-full max-w-[60px] bg-gradient-to-t from-amber-600 to-amber-400 rounded-t transition-all duration-300"
                          style={{ height: `${Math.min(100, Math.max(15, (Math.log10(count6um) / 4) * 100))}%` }}
                        />
                        <span className="text-xs font-mono text-white font-bold">&gt; 6 µm</span>
                        <span className="text-[10px] font-mono text-[#8b949e]">Code {isoAssessment.code6um}</span>
                      </div>

                      {/* 14um Bar */}
                      <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <span className="text-[10px] font-mono text-amber-400 font-bold">
                          {count14um} /mL
                        </span>
                        <div
                          className="w-full max-w-[60px] bg-gradient-to-t from-amber-600 to-amber-400 rounded-t transition-all duration-300"
                          style={{ height: `${Math.min(100, Math.max(15, (Math.log10(count14um) / 4) * 100))}%` }}
                        />
                        <span className="text-xs font-mono text-white font-bold">&gt; 14 µm</span>
                        <span className="text-[10px] font-mono text-[#8b949e]">Code {isoAssessment.code14um}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ASTM D341 VISCOSITY SOLVER */}
          {activeTab === 'viscosity' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Inputs */}
                <div className="space-y-3 bg-[#161b22] p-4 rounded-lg border border-[#30363d]">
                  <span className="text-xs font-mono font-bold text-white uppercase block">
                    Viscosity Parameters
                  </span>

                  <div>
                    <label className="text-[11px] font-mono text-[#8b949e] block mb-1">
                      ISO VG Standard Lubricant Grade:
                    </label>
                    <select
                      value={selectedIsoVg}
                      onChange={(e) => setSelectedIsoVg(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs font-mono bg-[#0d1117] border border-[#30363d] rounded text-white focus:border-[#58a6ff] focus:outline-none"
                    >
                      {Object.keys(STANDARD_ISO_VG_GRADES).map((k) => (
                        <option key={k} value={k}>
                          {STANDARD_ISO_VG_GRADES[k].name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#c9d1d9]">Operating Sump Temperature:</span>
                      <span className="text-amber-400 font-bold">{operatingTempC} °C</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={120}
                      step={1}
                      value={operatingTempC}
                      onChange={(e) => setOperatingTempC(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-[#8b949e]">
                      <span>0 °C (Cold Start)</span>
                      <span>40 °C (Rating)</span>
                      <span>120 °C (Overheat)</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#0d1117] rounded border border-[#30363d]/60 text-xs font-mono space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#8b949e]">Base Viscosity @ 40°C:</span>
                      <span className="text-white font-bold">{STANDARD_ISO_VG_GRADES[selectedIsoVg].cStAt40C} cSt</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8b949e]">Base Viscosity @ 100°C:</span>
                      <span className="text-white font-bold">{STANDARD_ISO_VG_GRADES[selectedIsoVg].cStAt100C} cSt</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8b949e]">Viscosity Index (VI):</span>
                      <span className="text-cyan-300 font-bold">{viscosityAssessment.viscosityIndex}</span>
                    </div>
                  </div>
                </div>

                {/* Viscosity & Film Results */}
                <div className="lg:col-span-2 space-y-3">
                  <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-lg">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#8b949e] block">
                          Operating Kinematic Viscosity ν(T)
                        </span>
                        <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-400">
                          {viscosityAssessment.viscosityAtTemp} cSt (mm²/s)
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#8b949e] block">
                          EHL Film Thickness Ratio (Kappa λ)
                        </span>
                        <div className="text-xl font-mono font-bold text-white">
                          κ = {viscosityAssessment.filmParameterKappa}
                        </div>
                      </div>

                      <div
                        className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-xs ${
                          viscosityAssessment.regime === 'Full Fluid EHL'
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                            : viscosityAssessment.regime === 'Mixed'
                            ? 'bg-amber-950/60 text-amber-400 border-amber-500/40'
                            : viscosityAssessment.regime === 'Boundary'
                            ? 'bg-rose-950/60 text-rose-400 border-rose-500/40'
                            : 'bg-blue-950/60 text-blue-400 border-blue-500/40'
                        }`}
                      >
                        {viscosityAssessment.regime.toUpperCase()}
                      </div>
                    </div>

                    <p className="text-xs font-mono text-[#c9d1d9] leading-relaxed pt-2 border-t border-[#30363d]">
                      {viscosityAssessment.regime === 'Full Fluid EHL' &&
                        'Full elastohydrodynamic (EHL) fluid film fully separates metal asperities. Minimal adhesive wear rate.'}
                      {viscosityAssessment.regime === 'Mixed' &&
                        'Partial asperity contact occurring. Anti-wear (AW) or extreme-pressure (EP) additive depletion will accelerate micro-pitting.'}
                      {viscosityAssessment.regime === 'Boundary' &&
                        'Critical lubricant thinning! High friction, rapid scuffing, and metal-to-metal welding imminent. Immediate oil cooling or grade upgrade required.'}
                      {viscosityAssessment.regime === 'Excessive Viscous Drag' &&
                        'Fluid film is excessively thick. High parasitic fluid churning losses will generate excess heat.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KARL FISCHER WATER CONTAMINATION */}
          {activeTab === 'water' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Inputs */}
                <div className="space-y-3 bg-[#161b22] p-4 rounded-lg border border-[#30363d]">
                  <span className="text-xs font-mono font-bold text-white uppercase block">
                    Moisture Ingress Parameters
                  </span>

                  <div>
                    <label className="text-[11px] font-mono text-[#8b949e] block mb-1">
                      Base Stock Formulation:
                    </label>
                    <select
                      value={oilBase}
                      onChange={(e) => setOilBase(e.target.value as any)}
                      className="w-full px-2.5 py-1 text-xs font-mono bg-[#0d1117] border border-[#30363d] rounded text-white focus:border-[#58a6ff] focus:outline-none"
                    >
                      <option value="mineral">Mineral Oil (Group I / II)</option>
                      <option value="synthetic_pao">Synthetic PAO (Group IV)</option>
                      <option value="ester">Synthetic Polyol Ester (Group V)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#c9d1d9]">Karl Fischer Water:</span>
                      <span className="text-amber-400 font-bold">{waterPpm} ppm ({ (waterPpm / 10000).toFixed(2) }%)</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={2500}
                      step={10}
                      value={waterPpm}
                      onChange={(e) => setWaterPpm(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-[#8b949e]">
                      <span>10 ppm (Bone Dry)</span>
                      <span>500 ppm (Warning)</span>
                      <span>2500 ppm (Severe)</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#c9d1d9]">Oil Sump Temp:</span>
                      <span className="text-white font-bold">{waterTempC} °C</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={90}
                      step={2}
                      value={waterTempC}
                      onChange={(e) => setWaterTempC(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>

                {/* Right Diagnostics */}
                <div className="lg:col-span-2 space-y-3">
                  <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-lg">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#8b949e] block">
                          Fluid Physical State
                        </span>
                        <div className="text-xl sm:text-2xl font-mono font-bold text-white">
                          {waterAssessment.state}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#8b949e] block">
                          Moisture Saturation Limit @ {waterTempC}°C
                        </span>
                        <div className="text-lg font-mono font-bold text-cyan-400">
                          {waterAssessment.saturationLimitPpm} ppm
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#30363d] text-xs font-mono">
                      <div className="p-3 bg-[#0d1117] rounded border border-[#30363d]">
                        <span className="text-[#8b949e] text-[10px] uppercase block">
                          Bearing Fatigue Life Derating Factor
                        </span>
                        <div className="text-lg font-bold text-rose-400 mt-0.5">
                          {(waterAssessment.bearingLifeDeratingFactor * 100).toFixed(0)}% Retained Life
                        </div>
                        <p className="text-[11px] text-[#8b949e] mt-1">
                          Dissolved and free water causes hydrogen micro-embrittlement at rolling contact zones.
                        </p>
                      </div>

                      <div className="p-3 bg-[#0d1117] rounded border border-[#30363d]">
                        <span className="text-[#8b949e] text-[10px] uppercase block">
                          Corrosion & Rust Risk
                        </span>
                        <div
                          className={`text-lg font-bold mt-0.5 ${
                            waterAssessment.corrosionRisk.includes('Severe')
                              ? 'text-rose-400'
                              : waterAssessment.corrosionRisk.includes('Moderate')
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {waterAssessment.corrosionRisk}
                        </div>
                        <p className="text-[11px] text-[#8b949e] mt-1">
                          Free water droplets displace the lubricant barrier on steel surfaces.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FERROGRAPHY & WEAR DEBRIS */}
          {activeTab === 'ferrography' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Debris Selector List */}
                <div className="space-y-2 bg-[#161b22] p-3 rounded-lg border border-[#30363d]">
                  <span className="text-xs font-mono font-bold text-white uppercase block mb-1">
                    Wear Particle Library
                  </span>

                  {WEAR_DEBRIS_LIBRARY.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedDebrisId(item.id)}
                      className={`w-full text-left p-2.5 rounded border text-xs font-mono transition-all ${
                        selectedDebrisId === item.id
                          ? 'bg-amber-950/40 border-amber-500 text-white font-bold'
                          : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{item.name}</span>
                        <span
                          className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${
                            item.severityLevel === 'critical'
                              ? 'bg-rose-950 text-rose-300'
                              : item.severityLevel === 'caution'
                              ? 'bg-amber-950 text-amber-300'
                              : 'bg-emerald-950 text-emerald-300'
                          }`}
                        >
                          {item.severityLevel}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Selected Debris Detail */}
                <div className="md:col-span-2 space-y-3 bg-[#161b22] p-4 rounded-lg border border-[#30363d]">
                  <div className="flex items-center justify-between pb-2 border-b border-[#30363d]">
                    <h3 className="text-base font-bold text-white font-mono">
                      {activeDebris.name}
                    </h3>
                    <span className="text-xs font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      Typical Size: {activeDebris.typicalSizeMicrons}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div>
                      <span className="text-[#8b949e] uppercase text-[10px] block">
                        Microscopic Optical Appearance:
                      </span>
                      <p className="text-white leading-relaxed mt-0.5">
                        {activeDebris.microscopeAppearance}
                      </p>
                    </div>

                    <div>
                      <span className="text-[#8b949e] uppercase text-[10px] block">
                        Underlying Root Cause Mechanism:
                      </span>
                      <p className="text-[#c9d1d9] leading-relaxed mt-0.5">
                        {activeDebris.rootCauseMechanism}
                      </p>
                    </div>

                    <div className="p-3 bg-[#0d1117] rounded border border-amber-500/30 text-amber-300">
                      <span className="text-[#8b949e] uppercase text-[10px] block mb-0.5">
                        Mandated Maintenance Remediation:
                      </span>
                      <p className="font-bold">{activeDebris.recommendedAction}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DIN 51825 GREASE RELUBE INTERVAL */}
          {activeTab === 'grease' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Inputs */}
                <div className="space-y-3 bg-[#161b22] p-4 rounded-lg border border-[#30363d]">
                  <span className="text-xs font-mono font-bold text-white uppercase block">
                    Bearing & Operating Conditions
                  </span>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-mono text-[#8b949e] block">Bore d (mm):</label>
                      <input
                        type="number"
                        value={bearingBoreMm}
                        onChange={(e) => setBearingBoreMm(Number(e.target.value))}
                        className="w-full px-2 py-1 text-xs font-mono bg-[#0d1117] border border-[#30363d] rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-[#8b949e] block">OD D (mm):</label>
                      <input
                        type="number"
                        value={bearingOdMm}
                        onChange={(e) => setBearingOdMm(Number(e.target.value))}
                        className="w-full px-2 py-1 text-xs font-mono bg-[#0d1117] border border-[#30363d] rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-[#8b949e] block">Width B (mm):</label>
                      <input
                        type="number"
                        value={bearingWidthMm}
                        onChange={(e) => setBearingWidthMm(Number(e.target.value))}
                        className="w-full px-2 py-1 text-xs font-mono bg-[#0d1117] border border-[#30363d] rounded text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-[#8b949e] block mb-1">Shaft Speed (RPM):</label>
                    <input
                      type="number"
                      value={bearingRpm}
                      onChange={(e) => setBearingRpm(Number(e.target.value))}
                      className="w-full px-2.5 py-1 text-xs font-mono bg-[#0d1117] border border-[#30363d] rounded text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-[#8b949e] block mb-1">Bearing Internal Geometry:</label>
                    <select
                      value={bearingType}
                      onChange={(e) => setBearingType(e.target.value as any)}
                      className="w-full px-2.5 py-1 text-xs font-mono bg-[#0d1117] border border-[#30363d] rounded text-white"
                    >
                      <option value="deep_groove_ball">Deep Groove Ball Bearing</option>
                      <option value="cylindrical_roller">Cylindrical Roller Bearing</option>
                      <option value="spherical_roller">Spherical Roller Bearing</option>
                      <option value="tapered_roller">Tapered Roller Bearing</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-[#8b949e] block mb-1">Operating Temp (°C):</label>
                    <input
                      type="number"
                      value={bearingTempC}
                      onChange={(e) => setBearingTempC(Number(e.target.value))}
                      className="w-full px-2.5 py-1 text-xs font-mono bg-[#0d1117] border border-[#30363d] rounded text-white"
                    />
                  </div>
                </div>

                {/* Outputs */}
                <div className="lg:col-span-2 space-y-3">
                  <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-lg">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#8b949e] block">
                      Recommended Relubrication Frequency
                    </span>
                    <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400 mt-1">
                      {greaseAssessment.relubeIntervalHours.toLocaleString()} Operating Hours
                    </div>
                    <span className="text-xs font-mono text-white">
                      (Approx. Every {greaseAssessment.relubeIntervalDays} Calendar Days)
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 mt-3 border-t border-[#30363d] text-xs font-mono">
                      <div className="p-2.5 bg-[#0d1117] rounded border border-[#30363d]">
                        <span className="text-[#8b949e] text-[10px] uppercase block">Replenishment Quantity</span>
                        <span className="text-white font-bold">{greaseAssessment.greaseQuantityGrams} Grams</span>
                      </div>
                      <div className="p-2.5 bg-[#0d1117] rounded border border-[#30363d]">
                        <span className="text-[#8b949e] text-[10px] uppercase block">Pitch Diameter (dm)</span>
                        <span className="text-white font-bold">{greaseAssessment.pitchDiameterMm} mm</span>
                      </div>
                      <div className="p-2.5 bg-[#0d1117] rounded border border-[#30363d]">
                        <span className="text-[#8b949e] text-[10px] uppercase block">Speed Factor (n · dm)</span>
                        <span className="text-cyan-300 font-bold">{greaseAssessment.ndmFactor.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-2.5 bg-[#161b22] border-t border-[#30363d] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#8b949e] shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
            <span>{STANDARDS_SAFE_DISCLAIMER_SHORT}</span>
          </div>
          <span>ISO 4406 / ASTM D341 Verified Physics</span>
        </div>
      </div>
    </div>
  );
};
