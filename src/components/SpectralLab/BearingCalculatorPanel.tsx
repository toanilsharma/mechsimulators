import React from 'react';
import { BearingGeometry, BearingFrequencies } from '../../types/spectralLab';
import { STANDARD_BEARINGS } from '../../utils/spectralCalculations';
import { ShieldCheck, Crosshair, Wrench, HelpCircle, Layers } from 'lucide-react';

interface BearingCalculatorPanelProps {
  selectedBearing: BearingGeometry;
  onSelectBearing: (bearing: BearingGeometry) => void;
  onUpdateBearingParam: (field: keyof BearingGeometry, value: any) => void;
  frequencies: BearingFrequencies;
  showCursors: boolean;
  onToggleCursors: (show: boolean) => void;
  shaftRpm: number;
}

export const BearingCalculatorPanel: React.FC<BearingCalculatorPanelProps> = ({
  selectedBearing,
  onSelectBearing,
  onUpdateBearingParam,
  frequencies,
  showCursors,
  onToggleCursors,
  shaftRpm,
}) => {
  return (
    <div className="flex flex-col gap-4 w-full bg-slate-900/50 p-3.5 rounded-lg border border-slate-800">
      {/* Header & Bearing Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-amber-400" />
            <h4 className="text-sm font-mono font-bold text-slate-200">
              ROLLER BEARING FAULT FREQUENCY CALCULATOR (ISO 15243)
            </h4>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Calculates kinematic defect frequencies for outer race, inner race, rolling elements, and cage pockets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-300">
            <input
              type="checkbox"
              checked={showCursors}
              onChange={(e) => onToggleCursors(e.target.checked)}
              className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-800"
            />
            <Crosshair size={14} className="text-amber-400" />
            <span>Overlay Cursors on FFT</span>
          </label>

          <select
            value={selectedBearing.id}
            onChange={(e) => {
              const b = STANDARD_BEARINGS.find((item) => item.id === e.target.value);
              if (b) onSelectBearing(b);
            }}
            className="px-2.5 py-1.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono font-bold"
          >
            {STANDARD_BEARINGS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calculated Kinematic Frequencies Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* BPFO */}
        <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-400">BPFO</span>
              <span className="text-[10px] font-mono text-amber-500/80 uppercase">Outer Race</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-sans">Ball Pass Frequency Outer</p>
          </div>
          <div className="mt-3">
            <div className="text-lg font-mono font-bold text-amber-300">{frequencies.bpfoOrder}X</div>
            <div className="text-xs font-mono text-slate-400">{frequencies.bpfoHz} Hz @ {shaftRpm} RPM</div>
          </div>
        </div>

        {/* BPFI */}
        <div className="p-3 rounded-lg bg-pink-950/20 border border-pink-500/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-pink-400">BPFI</span>
              <span className="text-[10px] font-mono text-pink-500/80 uppercase">Inner Race</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-sans">Ball Pass Frequency Inner</p>
          </div>
          <div className="mt-3">
            <div className="text-lg font-mono font-bold text-pink-300">{frequencies.bpfiOrder}X</div>
            <div className="text-xs font-mono text-slate-400">{frequencies.bpfiHz} Hz @ {shaftRpm} RPM</div>
          </div>
        </div>

        {/* BSF */}
        <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-500/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-purple-400">BSF</span>
              <span className="text-[10px] font-mono text-purple-500/80 uppercase">Ball / Roller</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-sans">Ball Spin Element Defect</p>
          </div>
          <div className="mt-3">
            <div className="text-lg font-mono font-bold text-purple-300">{frequencies.bsfOrder}X</div>
            <div className="text-xs font-mono text-slate-400">{frequencies.bsfHz} Hz @ {shaftRpm} RPM</div>
          </div>
        </div>

        {/* FTF */}
        <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-400">FTF</span>
              <span className="text-[10px] font-mono text-emerald-500/80 uppercase">Cage / Train</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-sans">Fundamental Train Frequency</p>
          </div>
          <div className="mt-3">
            <div className="text-lg font-mono font-bold text-emerald-300">{frequencies.ftfOrder}X</div>
            <div className="text-xs font-mono text-slate-400">{frequencies.ftfHz} Hz @ {shaftRpm} RPM</div>
          </div>
        </div>
      </div>

      {/* Kinematic Geometric Parameters & Harris Formulas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Geometric Inputs */}
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-2.5 text-xs font-mono">
          <span className="text-slate-300 font-bold uppercase tracking-wider block border-b border-slate-800 pb-1">
            Bearing Geometry Configuration
          </span>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block">Number of Balls / Rollers (Z)</label>
              <input
                type="number"
                min="4"
                max="40"
                value={selectedBearing.numberOfBalls}
                onChange={(e) => onUpdateBearingParam('numberOfBalls', Number(e.target.value))}
                className="w-full mt-1 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block">Ball Diameter Dw (mm)</label>
              <input
                type="number"
                step="0.1"
                min="2"
                max="100"
                value={selectedBearing.ballDiameterMm}
                onChange={(e) => onUpdateBearingParam('ballDiameterMm', Number(e.target.value))}
                className="w-full mt-1 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block">Pitch Diameter dm (mm)</label>
              <input
                type="number"
                step="0.5"
                min="10"
                max="500"
                value={selectedBearing.pitchDiameterMm}
                onChange={(e) => onUpdateBearingParam('pitchDiameterMm', Number(e.target.value))}
                className="w-full mt-1 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block">Contact Angle α (deg)</label>
              <input
                type="number"
                min="0"
                max="60"
                value={selectedBearing.contactAngleDeg}
                onChange={(e) => onUpdateBearingParam('contactAngleDeg', Number(e.target.value))}
                className="w-full mt-1 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Harris Kinematic Equations Guide */}
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs font-mono space-y-2">
          <span className="text-slate-300 font-bold uppercase tracking-wider block border-b border-slate-800 pb-1">
            Harris Kinematic Derivations
          </span>

          <div className="space-y-1.5 text-[11px] text-slate-300">
            <div className="p-1 rounded bg-slate-900/80 border border-slate-800 flex justify-between items-center">
              <span className="text-amber-400 font-bold">BPFO:</span>
              <code>(Z / 2) · [1 - (Dw/dm)·cos(α)] · fr</code>
            </div>
            <div className="p-1 rounded bg-slate-900/80 border border-slate-800 flex justify-between items-center">
              <span className="text-pink-400 font-bold">BPFI:</span>
              <code>(Z / 2) · [1 + (Dw/dm)·cos(α)] · fr</code>
            </div>
            <div className="p-1 rounded bg-slate-900/80 border border-slate-800 flex justify-between items-center">
              <span className="text-purple-400 font-bold">BSF:</span>
              <code>(dm / 2Dw) · [1 - ((Dw/dm)·cos(α))²] · fr</code>
            </div>
            <div className="p-1 rounded bg-slate-900/80 border border-slate-800 flex justify-between items-center">
              <span className="text-emerald-400 font-bold">FTF:</span>
              <code>(1 / 2) · [1 - (Dw/dm)·cos(α)] · fr</code>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 font-sans pt-1">
            *Where fr = shaft speed in Hz, Z = rolling element count, Dw = ball diameter, dm = pitch diameter, and α = contact angle.
          </p>
        </div>
      </div>
    </div>
  );
};
