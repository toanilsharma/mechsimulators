import React, { useState } from 'react';
import { UnitSystem, SimulatorId } from '../types/common';
import { useApp } from '../context/AppContext';
import { MechanicalLandingPage } from './Home/MechanicalLandingPage';
import { MissionControlWorkbench } from './Workbench/MissionControlWorkbench';
import { Sliders, LayoutGrid } from 'lucide-react';

interface HomePageProps {
  unitSystem: UnitSystem;
  onOpenAudit: () => void;
  onOpenReport: () => void;
  onOpenInfo: () => void;
  onOpenCommandPalette?: () => void;
  onOpenDiagnostics?: () => void;
  onOpenCaseStudies?: () => void;
  onOpenReliabilityStudio?: () => void;
  onOpenMachineryTrainStudio?: () => void;
  onOpenSpectralLab?: () => void;
  onOpenTransientLab?: () => void;
  onOpenKineticCutaway?: () => void;
  onOpenFleetMatrix?: () => void;
  onOpenRcaStudio?: () => void;
  onOpenTribologyLab?: () => void;
  onOpenMonteCarlo?: () => void;
  onOpenExergyCarbon?: () => void;
}

export const HomePage: React.FC<HomePageProps> = (props) => {
  const { setActiveRoute } = useApp();
  const [viewMode, setViewMode] = useState<'workbench' | 'catalog'>('workbench');

  return (
    <div className="w-full bg-[#0B1220] min-h-screen text-slate-100">
      {/* Top Viewport Mode Switcher */}
      <div className="bg-[#0B1220]/95 border-b border-[#1E293B] sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-[1720px] mx-auto px-4 lg:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-mono text-slate-400 uppercase tracking-wider hidden sm:inline">
              VIEWPORT:
            </span>
            <div className="inline-flex p-1 rounded-lg bg-[#0F172A] border border-[#1E293B]">
              <button
                type="button"
                onClick={() => setViewMode('workbench')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-[13px] font-semibold transition-all ${
                  viewMode === 'workbench'
                    ? 'bg-[#06B6D4] text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>MISSION CONTROL WORKBENCH</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('catalog')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-[13px] font-semibold transition-all ${
                  viewMode === 'catalog'
                    ? 'bg-[#06B6D4] text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>ALL DIGITAL TWINS (11)</span>
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 text-[12px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse" />
              <span>LIVE SOLVER RUNNING</span>
            </span>
            <span className="text-[#1E293B]">|</span>
            <span>API 610 / ISO 13709</span>
          </div>
        </div>
      </div>

      {/* Render Active View */}
      {viewMode === 'workbench' ? (
        <MissionControlWorkbench onLaunchSimulator={(id: SimulatorId) => setActiveRoute(id)} />
      ) : (
        <MechanicalLandingPage {...props} />
      )}
    </div>
  );
};
