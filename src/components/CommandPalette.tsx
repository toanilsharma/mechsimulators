import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { RouteId, SimulatorId } from '../types/common';
import {
  Search,
  Command,
  ArrowRight,
  Flame,
  Wind,
  Cpu,
  Activity,
  Cog,
  Compass,
  Disc,
  RotateCw,
  Target,
  Maximize2,
  ShieldCheck,
  Network,
  TrendingUp,
  Sliders,
  Wrench,
  BookOpen,
  FileSpreadsheet,
  Calculator,
  X,
  CornerDownLeft,
  GitCompare,
  FileText,
  HelpCircle,
  Info,
  Scale,
  Droplet,
  Grid,
  Layers,
  BarChart3,
  Leaf,
} from 'lucide-react';

interface PaletteItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'twins' | 'studios' | 'tools' | 'standards';
  tag?: string;
  icon: React.ElementType;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAudit: () => void;
  onOpenReport: () => void;
  onOpenInfo: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenAudit,
  onOpenReport,
  onOpenInfo,
}) => {
  const {
    setActiveRoute,
    setIsMachineryTrainStudioOpen,
    setIsReliabilityStudioOpen,
    setIsSpectralLabOpen,
    setIsDiagnosticModalOpen,
    setIsCaseStudiesModalOpen,
    setIsComparatorOpen,
    setIsTransientModalOpen,
    setIsKineticCutawayOpen,
    setIsFleetMatrixOpen,
    setIsRcaStudioOpen,
    setIsTribologyLabOpen,
    setIsMonteCarloOpen,
    setIsExergyCarbonOpen,
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Registry of all command palette items
  const allItems: PaletteItem[] = useMemo(() => [
    // --- 11 Digital Twins ---
    {
      id: 'compressor',
      title: 'Centrifugal Compressor Surge & Anti-Surge Control',
      subtitle: 'API 617 / API 670 • Polytropic Head, SCL/SLL Map, Recycle ASV Dynamics',
      category: 'twins',
      tag: 'COMP-CENT',
      icon: Wind,
      action: () => { setActiveRoute('compressor'); onClose(); },
      keywords: ['compressor', 'surge', 'anti-surge', 'asv', 'polytropic', 'api 617', 'asme ptc 10', 'scl', 'sll'],
    },
    {
      id: 'turbine',
      title: 'Industrial Steam Turbine Thermodynamics & Dynamics',
      subtitle: 'API 612 / NEMA SM 23 • Willans Line, Mollier Expansion, Campbell Resonance',
      category: 'twins',
      tag: 'TURB-ST',
      icon: Flame,
      action: () => { setActiveRoute('turbine'); onClose(); },
      keywords: ['turbine', 'steam', 'willans', 'mollier', 'campbell', 'blade', 'api 612', 'resonance', 'governor'],
    },
    {
      id: 'recip',
      title: 'Reciprocating Compressor P-V & Gas Pulsation',
      subtitle: 'API 618 5th Ed • Indicator Card, Volumetric Efficiency, Acoustical Dampener',
      category: 'twins',
      tag: 'COMP-RECIP',
      icon: Cpu,
      action: () => { setActiveRoute('recip'); onClose(); },
      keywords: ['recip', 'p-v', 'pulsation', 'cylinder', 'valve', 'api 618', 'volumetric efficiency', 'helmholtz'],
    },
    {
      id: 'pump',
      title: 'Centrifugal Pump Cavitation & NPSH Margin',
      subtitle: 'API 610 12th Ed / HI 9.6.1 • Rayleigh-Plesset Eye Cavitation, N_ss, MCSF',
      category: 'twins',
      tag: 'PUMP-CENT',
      icon: Activity,
      action: () => { setActiveRoute('pump'); onClose(); },
      keywords: ['pump', 'npsh', 'cavitation', 'api 610', 'suction specific speed', 'impeller', 'mcsf'],
    },
    {
      id: 'gearbox',
      title: 'Industrial Gearbox & Gear Mesh Diagnostics',
      subtitle: 'AGMA 2001-D04 / ISO 6336 • Gear Mesh Frequencies (GMF), EHL Film, Pitting S_H',
      category: 'twins',
      tag: 'GBX-PAR',
      icon: Cog,
      action: () => { setActiveRoute('gearbox'); onClose(); },
      keywords: ['gearbox', 'gear', 'mesh', 'gmf', 'agma 2001', 'pinion', 'pitting', 'bending fatigue'],
    },
    {
      id: 'journal',
      title: 'Hydrodynamic Journal Bearings & Fluid Whirl',
      subtitle: 'API 670 5th Ed / API 684 • Sommerfeld Number, Babbitt Temp, Oil Whirl/Whip',
      category: 'twins',
      tag: 'BRG-JOUR',
      icon: Compass,
      action: () => { setActiveRoute('journal'); onClose(); },
      keywords: ['journal', 'bearing', 'babbitt', 'whirl', 'whip', 'sommerfeld', 'api 684', 'tilting pad'],
    },
    {
      id: 'bearing',
      title: 'Rolling Element Bearing Kinematics & Faults',
      subtitle: 'ISO 281 / ISO 15243 • BPFO, BPFI, BSF, FTF Kinematics, Shock Kurtosis',
      category: 'twins',
      tag: 'BRG-ROLL',
      icon: Disc,
      action: () => { setActiveRoute('bearing'); onClose(); },
      keywords: ['bearing', 'rolling', 'bpfo', 'bpfi', 'kurtosis', 'iso 281', 'spall', 'crest factor'],
    },
    {
      id: 'rotor',
      title: 'Rotor Dynamics & ISO 1940 Balancing',
      subtitle: 'ISO 1940-1 / ISO 20816-3 • Static/Couple Unbalance, 1X Centrifugal Vector',
      category: 'twins',
      tag: 'ROTOR-DYN',
      icon: RotateCw,
      action: () => { setActiveRoute('rotor'); onClose(); },
      keywords: ['rotor', 'unbalance', 'balancing', 'iso 1940', 'couple', '1x', 'vibration zone', 'g2.5'],
    },
    {
      id: 'alignment',
      title: 'Shaft Alignment & API 686 Thermal Growth',
      subtitle: 'API 686 Chapter 7 • Reverse Indicator Matrix, Shim Calculations, 2X Coupling Stress',
      category: 'twins',
      tag: 'ALIGN-SHAFT',
      icon: Target,
      action: () => { setActiveRoute('alignment'); onClose(); },
      keywords: ['alignment', 'shaft', 'thermal growth', 'api 686', 'shim', 'reverse indicator', 'coupling'],
    },
    {
      id: 'pipe',
      title: 'Process Piping Thermal Expansion & Stress',
      subtitle: 'ASME B31.3 2022 §319 • Thermal Expansion ΔL, Expansion Loops, Allowable S_A',
      category: 'twins',
      tag: 'PIPE-STR',
      icon: Maximize2,
      action: () => { setActiveRoute('pipe'); onClose(); },
      keywords: ['pipe', 'piping', 'stress', 'thermal expansion', 'asme b31.3', 'anchor', 'nozzle load', 'loop'],
    },
    {
      id: 'seal',
      title: 'API 682 Mechanical Seal Flush Plans',
      subtitle: 'API 682 4th Ed / ISO 21049 • Flush Plan 11/21/23/31/53, Vapor Margin, Face Heat',
      category: 'twins',
      tag: 'SEAL-FLUSH',
      icon: ShieldCheck,
      action: () => { setActiveRoute('seal'); onClose(); },
      keywords: ['seal', 'flush', 'plan 11', 'plan 53', 'api 682', 'vapor margin', 'mechanical seal'],
    },

    // --- 4 Cross-Asset Studios ---
    {
      id: 'studio-train',
      title: 'Machinery Train Studio',
      subtitle: 'Multi-body drive train cascade (Motor/Turbine → Gearbox → Compressor/Pump)',
      category: 'studios',
      icon: Network,
      action: () => { setIsMachineryTrainStudioOpen(true); onClose(); },
      keywords: ['train', 'cascade', 'drive train', 'machinery train', 'multi-body', 'torque'],
    },
    {
      id: 'studio-reliability',
      title: 'Reliability & Asset Life Studio',
      subtitle: 'Weibull hazard curves, health index (0-100), automated equipment datasheets',
      category: 'studios',
      icon: TrendingUp,
      action: () => { setIsReliabilityStudioOpen(true); onClose(); },
      keywords: ['reliability', 'weibull', 'life', 'health score', 'datasheet', 'mtbf', 'hazard'],
    },
    {
      id: 'studio-spectral',
      title: 'Vibration Spectral Lab',
      subtitle: 'Interactive FFT spectrum, cascade waterfall, Bode rotor speed, shaft orbits',
      category: 'studios',
      icon: Sliders,
      action: () => { setIsSpectralLabOpen(true); onClose(); },
      keywords: ['fft', 'spectral', 'vibration', 'waterfall', 'bode', 'spectrum', 'envelope', 'demodulation'],
    },
    {
      id: 'studio-diagnostic',
      title: 'Forensic Diagnostic Troubleshooting Tree',
      subtitle: 'Step-by-step root cause trees for vibration, temperature, and leakage alarms',
      category: 'studios',
      icon: Wrench,
      action: () => { setIsDiagnosticModalOpen(true); onClose(); },
      keywords: ['diagnostic', 'troubleshooter', 'tree', 'root cause', 'rcfa', 'forensic', 'alarm'],
    },
    {
      id: 'studio-comparator',
      title: 'Cross-Asset Digital Twin Side-by-Side Comparator',
      subtitle: 'Compare physics, failure propagation, standards, and spectral fingerprints across any 2 twins',
      category: 'studios',
      icon: GitCompare,
      action: () => { setIsComparatorOpen(true); onClose(); },
      keywords: ['compare', 'comparator', 'side-by-side', 'cross-asset', 'twin comparison', 'benchmark', 'train'],
    },
    {
      id: 'studio-transient',
      title: 'Transient Dynamics Run-Up & Coastdown Lab',
      subtitle: 'Bode plots, Nyquist polar plots, critical speed resonance tracking during startup/shutdown',
      category: 'studios',
      icon: RotateCw,
      action: () => { setIsTransientModalOpen(true); onClose(); },
      keywords: ['transient', 'bode', 'nyquist', 'coastdown', 'runup', 'resonance', 'critical speed'],
    },
    {
      id: 'studio-cutaway',
      title: '3D Machinery Internal Cutaway Inspector',
      subtitle: 'Internal exploded fluid kinematics & mechanical component stress overlay',
      category: 'studios',
      icon: Layers,
      action: () => { setIsKineticCutawayOpen(true); onClose(); },
      keywords: ['cutaway', '3d', 'kinetic', 'internal', 'flow', 'stress', 'cad', 'impeller', 'rotor'],
    },
    {
      id: 'studio-fleet',
      title: 'Plant Fleet Integrity & FMEA / RPN Matrix',
      subtitle: 'Fleet-wide criticality ranking, Risk Priority Numbers (RPN), and predictive maintenance scheduler',
      category: 'studios',
      icon: Grid,
      action: () => { setIsFleetMatrixOpen(true); onClose(); },
      keywords: ['fleet', 'fmea', 'rpn', 'risk', 'maintenance', 'criticality', 'iso 55000', 'plant'],
    },
    {
      id: 'studio-rca',
      title: 'Forensic Root Cause Analysis (RCA) & Ishikawa 5-Whys Studio',
      subtitle: 'Visual Fishbone diagrams, automated CAPA action tracking, and failure incident forensics',
      category: 'studios',
      icon: Target,
      action: () => { setIsRcaStudioOpen(true); onClose(); },
      keywords: ['rca', 'root cause', 'fishbone', 'ishikawa', '5-whys', 'forensic', 'capa', 'failure'],
    },
    {
      id: 'studio-tribology',
      title: 'Lubrication Tribology, ISO 4406 Cleanliness & Oil Degradation Lab',
      subtitle: 'Solid particle counts, ASTM D341 viscosity curves, water-in-oil saturation, wear debris library',
      category: 'studios',
      icon: Droplet,
      action: () => { setIsTribologyLabOpen(true); onClose(); },
      keywords: ['tribology', 'oil', 'viscosity', 'iso 4406', 'cleanliness', 'particle', 'ferrography', 'grease', 'lubrication'],
    },
    {
      id: 'studio-monte-carlo',
      title: 'Monte Carlo Probabilistic Tolerance & Uncertainty Simulator',
      subtitle: 'Stochastic tolerance stack-up, GUM uncertainty propagation, and violation risk analysis',
      category: 'studios',
      icon: BarChart3,
      action: () => { setIsMonteCarloOpen(true); onClose(); },
      keywords: ['monte carlo', 'uncertainty', 'gum', 'stochastic', 'tolerance', 'probability', 'histogram', 'tornado'],
    },
    {
      id: 'studio-exergy',
      title: 'Machinery Exergy Destruction & Decarbonization Simulator',
      subtitle: '2nd-law exergy dissipation, 10/20-yr life cycle cost (LCC), and carbon emissions abatement',
      category: 'studios',
      icon: Leaf,
      action: () => { setIsExergyCarbonOpen(true); onClose(); },
      keywords: ['exergy', 'carbon', 'decarbonization', 'energy', 'efficiency', 'lcc', 'emissions', 'second law'],
    },

    // --- Engineering Tools & Reports ---
    {
      id: 'tool-audit',
      title: 'Calculation Audit Trail',
      subtitle: 'Full step-by-step intermediate Float64 derivations and equation citations',
      category: 'tools',
      icon: Calculator,
      action: () => { onOpenAudit(); onClose(); },
      keywords: ['audit', 'calculation', 'math', 'equation', 'formula', 'derivation', 'step-by-step'],
    },
    {
      id: 'tool-report',
      title: 'Engineering Datasheet & Printable Report',
      subtitle: 'Formal plant reliability assessment summary ready for PDF export or archiving',
      category: 'tools',
      icon: FileSpreadsheet,
      action: () => { onOpenReport(); onClose(); },
      keywords: ['report', 'datasheet', 'print', 'pdf', 'summary', 'specification'],
    },
    {
      id: 'tool-case-studies',
      title: 'Forensic Case Studies Archive',
      subtitle: 'Real-world equipment failure post-mortems from petrochemical & offshore assets',
      category: 'tools',
      icon: BookOpen,
      action: () => { setIsCaseStudiesModalOpen(true); onClose(); },
      keywords: ['case study', 'post-mortem', 'texas refinery', 'north sea', 'failure', 'incident'],
    },
    {
      id: 'tool-standards',
      title: 'Governing Standards Directory & Matrix',
      subtitle: 'Complete searchable directory of API 610, 612, 617, 618, 682, AGMA, ISO clauses and limits',
      category: 'standards',
      icon: Scale,
      action: () => { setActiveRoute('standards'); onClose(); },
      keywords: ['standards', 'api', 'iso', 'agma', 'asme', 'matrix', 'clauses', 'limits', 'code'],
    },
    {
      id: 'tool-methodology',
      title: 'Physics & Calculation Methodology',
      subtitle: 'Detailed mathematical Float64 derivations, equations, and thermodynamic models across all 11 twins',
      category: 'standards',
      icon: FileText,
      action: () => { setActiveRoute('methodology'); onClose(); },
      keywords: ['methodology', 'physics', 'equations', 'math', 'formulations', 'iapws', 'reynolds', 'greitzer'],
    },
    {
      id: 'tool-faq',
      title: 'Rotating Machinery Field Troubleshooting FAQ',
      subtitle: 'Practical plant engineering Q&A, diagnostic rules of thumb, and condition monitoring advice',
      category: 'standards',
      icon: HelpCircle,
      action: () => { setActiveRoute('faq'); onClose(); },
      keywords: ['faq', 'questions', 'troubleshooting', 'field advice', 'vibration rules', 'answers'],
    },
    {
      id: 'tool-about',
      title: 'Platform Architecture & Deterministic Verification',
      subtitle: 'Client-side zero-latency architecture, zero hallucination Float64 math, safety disclaimers',
      category: 'standards',
      icon: Info,
      action: () => { setActiveRoute('about'); onClose(); },
      keywords: ['about', 'architecture', 'verification', 'deterministic', 'client-side', 'disclaimer'],
    },
  ], [
    setActiveRoute,
    setIsMachineryTrainStudioOpen,
    setIsReliabilityStudioOpen,
    setIsSpectralLabOpen,
    setIsDiagnosticModalOpen,
    setIsCaseStudiesModalOpen,
    setIsComparatorOpen,
    onOpenAudit,
    onOpenReport,
    onOpenInfo,
    onClose,
  ]);

  // Filter items by query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase().trim();
    return allItems.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(q);
      const subMatch = item.subtitle.toLowerCase().includes(q);
      const tagMatch = item.tag?.toLowerCase().includes(q);
      const kwMatch = item.keywords?.some((k) => k.toLowerCase().includes(q));
      return titleMatch || subMatch || tagMatch || kwMatch;
    });
  }, [allItems, query]);

  // Keyboard navigation inside command palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (filteredItems.length || 1)) % (filteredItems.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[#21262d] gap-3 bg-[#161b22]">
          <Search size={18} className="text-[#f27d26] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search digital twins, standards (API 612), failure modes, studios..."
            className="w-full bg-transparent text-sm text-white placeholder-[#8b949e] focus:outline-none font-mono"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-[#8b949e] hover:text-white font-mono px-1 cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8b949e] hover:text-white hover:bg-[#21262d] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2 divide-y divide-[#21262d]/40">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-[#8b949e] space-y-2">
              <Search size={28} className="mx-auto text-[#6e7681]" />
              <div className="text-sm font-mono text-white">No matching engineering assets found</div>
              <p className="text-xs font-mono text-[#8b949e]">
                Try searching for &quot;API 617&quot;, &quot;Turbine&quot;, &quot;Surge&quot;, &quot;Weibull&quot;, or &quot;GMF&quot;.
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const ItemIcon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#161b22] border-l-2 border-[#f27d26] text-white pl-3.5'
                      : 'text-[#c9d1d9] hover:bg-[#161b22]/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#f27d26]/20 text-[#f27d26] border border-[#f27d26]/40'
                          : 'bg-[#21262d] text-[#8b949e]'
                      }`}
                    >
                      <ItemIcon size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold truncate">
                          {item.title}
                        </span>
                        {item.tag && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#21262d] text-[#f27d26] font-semibold shrink-0">
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-[#8b949e] truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-3 shrink-0">
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-[#f27d26] font-bold">
                        <span>Select</span>
                        <CornerDownLeft size={12} />
                      </span>
                    ) : (
                      <ArrowRight size={13} className="text-[#6e7681]" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2 bg-[#111620] border-t border-[#21262d] flex items-center justify-between text-[10px] font-mono text-[#8b949e]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-[#21262d] text-white">↑</kbd>
              <kbd className="px-1 py-0.5 rounded bg-[#21262d] text-white">↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[#21262d] text-white">↵</kbd>
              <span>Execute</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[#21262d] text-white">ESC</kbd>
              <span>Dismiss</span>
            </span>
          </div>
          <span className="hidden sm:inline text-[#6e7681]">
            Press <kbd className="px-1 py-0.5 rounded bg-[#21262d] text-[#c9d1d9]">⌘K</kbd> anywhere
          </span>
        </div>
      </div>
    </div>
  );
};
