import React, { useState } from 'react';
import {
  Sparkles,
  ExternalLink,
  Mail,
  Linkedin,
  Cpu,
  Layers,
  ShieldCheck,
  Check,
  Copy,
  ChevronRight,
  Activity,
  Wind,
  Disc,
  Compass,
  Cog,
  Flame,
  Maximize2,
  Target,
  Calculator,
  BarChart3,
  Globe,
  Radio,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SimulatorId } from '../../types/common';

interface LiveSimulatorsFooterProps {
  onOpenAudit?: () => void;
  onOpenReport?: () => void;
}

export const LiveSimulatorsFooter: React.FC<LiveSimulatorsFooterProps> = ({
  onOpenAudit,
  onOpenReport,
}) => {
  const { setActiveRoute } = useApp();
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedLink(id);
      setTimeout(() => setCopiedLink(null), 2000);
    }
  };

  const disciplines = [
    { name: 'Electrical Engineering', code: 'EE-200', href: 'https://livesimulators.com/department/electrical' },
    { name: 'Mechanical Systems', code: 'ME-400', href: 'https://mech.livesimulators.com', isCurrent: true },
    { name: 'Control & Signals', code: 'CS-300', href: 'https://livesimulators.com/department/control' },
    { name: 'Chemical & Process', code: 'CH-250', href: 'https://livesimulators.com/department/chemical' },
    { name: 'Civil & Structural', code: 'CE-320', href: 'https://livesimulators.com/department/civil' },
    { name: 'Quantum & Physics', code: 'PH-500', href: 'https://livesimulators.com/department/physics' },
  ];

  const mechanicalSimulators: { id: SimulatorId; name: string; standard: string }[] = [
    { id: 'pump', name: 'Pump Cavitation & NPSH', standard: 'API 610' },
    { id: 'compressor', name: 'Compressor Surge Dynamics', standard: 'API 617' },
    { id: 'recip', name: 'Reciprocating P-V Cycle', standard: 'API 618' },
    { id: 'gearbox', name: 'Gearbox Mesh & AGMA', standard: 'AGMA 2001' },
    { id: 'turbine', name: 'Steam Turbine Enthalpy', standard: 'API 612' },
    { id: 'bearing', name: 'Bearing Fault Vibration', standard: 'ISO 281' },
    { id: 'journal', name: 'Journal Bearing Whirl', standard: 'API 684' },
    { id: 'rotor', name: 'Rotor Resonant Balancing', standard: 'ISO 1940' },
    { id: 'pipe', name: 'Piping Thermal Stress', standard: 'ASME B31.3' },
    { id: 'seal', name: 'Mechanical Seal Flush', standard: 'API 682' },
    { id: 'alignment', name: 'Shaft Laser Alignment', standard: 'API 686' },
  ];

  const parentLabs = [
    { name: 'Power Electronics Lab', desc: '8 Interactive Switching Modules', href: 'https://livesimulators.com/lab/power-electronics-lab' },
    { name: 'Power Systems Lab', desc: '25 Transmission & Stability Solvers', href: 'https://livesimulators.com/lab/power-systems-lab' },
    { name: 'SafeOps UPS Lab', desc: 'Double-Conversion & Battery Sim', href: 'https://livesimulators.com/lab/safeops-ups' },
    { name: 'ElectroLive Electrical Safety', desc: 'NFPA 70E Arc Flash Boundary', href: 'https://livesimulators.com/lab/electrolive-electrical-safety' },
    { name: 'Mechanical Reliability Lab', desc: '11 Digital Twins • Turbomachinery', isCurrentInternal: true },
  ];

  return (
    <footer
      id="livesimulators-footer"
      className="w-full border-t border-[#1E3A5F] bg-[#040812] text-slate-400 font-sans text-xs relative z-20 shadow-[0_-16px_48px_rgba(0,0,0,0.85)]"
      style={{
        backgroundImage: 'radial-gradient(ellipse 90% 35% at 50% 0%, rgba(6, 182, 212, 0.08), transparent 70%)',
      }}
    >
      {/* 1. Distinct Top Cyan Laser Divider Line */}
      <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500/80 to-transparent shadow-[0_0_16px_rgba(6,182,212,0.6)]" />

      {/* 2. Architectural Ecosystem Transition Strip */}
      <div className="w-full bg-[#060C18] border-b border-[#1E293B]/80 py-3 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#06B6D4]" />
          <span className="font-bold text-white tracking-wider uppercase">
            LiveSimulators.com Ecosystem
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline">
            Multi-Department Engineering Digital Twins &amp; Reliability Framework
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/40 text-[10px] font-mono font-bold text-cyan-300">
            <ShieldCheck size={12} className="text-cyan-400" />
            <span>STANDARDS REFERENCED • AUDIT READY</span>
          </span>
        </div>
      </div>

      {/* 3. Main Footer Content Container */}
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 py-10 lg:py-14 space-y-10">
        {/* Top 4-Column Grid: Spans the full viewport width */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 w-full">
          {/* Column 1: Brand & Founder Info (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="font-display text-xl font-bold text-white tracking-tight">
                LiveSimulators<span className="text-cyan-400">.com</span>
              </span>
            </div>

            <p className="text-slate-200 text-sm font-display font-semibold tracking-tight">
              "Don't Just Read Engineering. See It Happen."
            </p>

            <p className="text-slate-400 text-xs font-sans leading-relaxed max-w-md">
              Interactive numerical simulations turning abstract differential formulations into intuitive,
              real-time physical behaviors for students, educators, and practicing engineers.
            </p>

            {/* Founder Card (Identical to livesimulators.com) */}
            <div className="pt-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2 max-w-md font-mono text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold">Anil Sharma</span>
                <span className="text-[10px] text-cyan-400 font-semibold px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                  FOUNDER
                </span>
              </div>
              <div className="flex flex-col gap-1.5 text-slate-400">
                <a
                  href="mailto:0808miracle@gmail.com"
                  className="hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>0808miracle@gmail.com</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/toanilsharma/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-300 flex items-center gap-1.5 transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5 text-blue-400" />
                  <span>linkedin.com/in/toanilsharma</span>
                  <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-70" />
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Engineering Disciplines (2 cols) */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-white font-display font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              Disciplines
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {disciplines.map((d) => (
                <li key={d.code}>
                  <a
                    href={d.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`hover:text-cyan-400 transition-colors flex items-center justify-between group py-0.5 ${
                      d.isCurrent ? 'text-cyan-300 font-semibold' : ''
                    }`}
                  >
                    <span>{d.name}</span>
                    <span className="text-[9px] font-mono text-slate-500 group-hover:text-cyan-400">
                      {d.code}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Mechanical Digital Twins (3 cols) */}
          <div className="lg:col-span-3 space-y-3.5">
            <h4 className="text-white font-display font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Mechanical Simulators
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-1 text-xs text-slate-300">
              {mechanicalSimulators.map((sim) => (
                <button
                  key={sim.id}
                  onClick={() => {
                    setActiveRoute(sim.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-800/60 hover:text-cyan-300 transition-all text-left cursor-pointer group"
                >
                  <span className="truncate pr-1 group-hover:translate-x-0.5 transition-transform">
                    {sim.name}
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.2 bg-slate-900 border border-slate-800 rounded text-slate-400 group-hover:border-cyan-500/40 group-hover:text-cyan-300 shrink-0">
                    {sim.standard}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Column 4: Interactive Labs & Workbenches (3 cols) */}
          <div className="lg:col-span-3 space-y-3.5">
            <h4 className="text-white font-display font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              Specialized Labs
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {parentLabs.map((lab, i) => (
                <li key={i}>
                  {lab.isCurrentInternal ? (
                    <button
                      onClick={() => setActiveRoute('home')}
                      className="w-full text-left p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 block transition-colors cursor-pointer"
                    >
                      <div className="font-semibold text-white flex items-center justify-between">
                        <span>{lab.name}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                          Active
                        </span>
                      </div>
                      <div className="text-[11px] text-cyan-300/80">{lab.desc}</div>
                    </button>
                  ) : (
                    <a
                      href={lab.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900 text-slate-300 hover:text-white transition-all group"
                    >
                      <div className="font-semibold text-slate-200 group-hover:text-cyan-300 flex items-center justify-between">
                        <span>{lab.name}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400" />
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{lab.desc}</div>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Section: Engineering Ecosystem by Anil Sharma (Companion Portals) */}
        <div className="pt-6 border-t border-slate-800/80 space-y-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-xs font-display font-bold text-white tracking-wide uppercase">
                Engineering Ecosystem by Anil Sharma
              </span>
              <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                • Free Companion Portals
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Standards-Referenced Calculation &amp; Plant Reliability Analytics
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
            {/* DesignCalculators.co.in Card */}
            <a
              href="https://designcalculators.co.in"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-400/80 transition-all duration-200 flex flex-col justify-between gap-3 hover:shadow-[0_0_20px_rgba(16,185,129,0.12)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Calculator className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                        DesignCalculators.co.in
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-400 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400/90 block">
                      Electrical • Mechanical • Instrumentation Calculators
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shrink-0">
                  IEEE • IEC • ASME Refs
                </span>
              </div>

              <p className="text-xs text-slate-300/90 leading-relaxed font-sans">
                Free engineering calculators for Electrical, Mechanical, and Instrumentation disciplines based on
                publicly documented industry methodologies (referenced from IEEE, IEC, ASME, API, ISA for technical reference only)—covering
                cable sizing, substation grounding, pressure vessels, pipe hydraulics, and control valve sizing (
                <span className="font-mono text-slate-200">Cv</span>).
              </p>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
                <span className="text-emerald-400/80">Referenced Industry Standards</span>
                <span className="text-emerald-400 font-medium group-hover:underline flex items-center gap-1">
                  Visit portal ↗
                </span>
              </div>
            </a>

            {/* ReliabilityTools.co.in Card */}
            <a
              href="https://reliabilitytools.co.in"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900/90 border border-violet-500/30 hover:border-violet-400/80 transition-all duration-200 flex flex-col justify-between gap-3 hover:shadow-[0_0_20px_rgba(139,92,246,0.12)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0 group-hover:scale-105 transition-transform">
                    <BarChart3 className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-bold text-sm text-white group-hover:text-violet-300 transition-colors">
                        ReliabilityTools.co.in
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-violet-400 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                    <span className="text-[10px] font-mono text-violet-400/90 block">
                      Plant Reliability &amp; Maintenance Analytics
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-violet-500/10 text-violet-300 border border-violet-500/30 shrink-0">
                  Uptime &amp; Analytics
                </span>
              </div>

              <p className="text-xs text-slate-300/90 leading-relaxed font-sans">
                Improve your plant's reliability and reduce downtime using free reliability tools—including 2P/3P
                Weibull failure analysis, MTBF/MTTR uptime modeling, Root Cause Analysis (RCA), OEE loss tracking, and IEC
                61508/61511 SIL verification.
              </p>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
                <span className="text-violet-400/80">Asset Optimization &amp; RCA</span>
                <span className="text-violet-400 font-medium group-hover:underline flex items-center gap-1">
                  Visit portal ↗
                </span>
              </div>
            </a>
          </div>
        </div>

        {/* Section: Legal & Standards Reference Notice (Spans full width without artificial max-w clamping) */}
        <div className="pt-6 border-t border-slate-900 text-[11px] text-slate-500 font-sans leading-relaxed w-full space-y-2">
          <p>
            LiveSimulators provides interactive engineering learning experiences and conceptual visualizations.
            Simulations are intended for education and exploration; users should consult applicable standards,
            engineering documentation, and qualified professionals for real-world design, safety, or operational decisions.
          </p>
          <p className="text-[10px] text-slate-500">
            <strong>Non-Affiliation &amp; Standards Reference Notice:</strong> All product names, trademarks, and standard
            designations (including IEEE, IEC, ASME, API, ISO, ISA, NFPA, and ASTM) belong to their respective proprietary
            owners. Mention of any standard, code, or organization is strictly for academic cross-referencing,
            educational identification, and computational modeling context only, and does not constitute or imply any
            endorsement, sponsorship, affiliation, certification, or approval by any standards organization.
          </p>
        </div>
      </div>

      {/* 4. Solid Ground Foundation Base Plate */}
      <div className="w-full bg-[#02050B] border-t border-slate-900/90 py-4 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-mono text-slate-500">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 font-bold">FLOAT64 ENGINE ACTIVE</span>
          </div>
          <span>•</span>
          <span>GOOGLE TAG: G-WX8V8HH57V</span>
          <span>•</span>
          <span className="text-cyan-400/80">OPEN ACADEMIC ACCESS</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-slate-400">
          <button
            onClick={() => setActiveRoute('about')}
            className="hover:text-cyan-400 transition-colors cursor-pointer"
          >
            About
          </button>
          <a
            href="mailto:0808miracle@gmail.com"
            className="hover:text-cyan-400 transition-colors cursor-pointer"
          >
            Contact
          </a>
          <button
            onClick={() => setActiveRoute('standards')}
            className="hover:text-cyan-400 transition-colors cursor-pointer"
          >
            Standards
          </button>
          <button
            onClick={() => setActiveRoute('methodology')}
            className="hover:text-cyan-400 transition-colors cursor-pointer"
          >
            Methodology
          </button>
          <button
            onClick={() => setActiveRoute('faq')}
            className="hover:text-cyan-400 transition-colors cursor-pointer"
          >
            FAQ
          </button>
        </div>

        <div>
          © {new Date().getFullYear()} <span className="text-slate-300 font-bold">LiveSimulators.com</span> • All Rights Reserved
        </div>
      </div>
    </footer>
  );
};
