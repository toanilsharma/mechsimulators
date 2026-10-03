import React, { useState, useMemo } from 'react';
import {
  Layers,
  ArrowRight,
  Filter,
  CheckCircle2,
  Sliders,
  Sparkles,
  RotateCw,
  Gauge,
  Activity,
  Flame,
  Wind,
  ShieldCheck,
  Disc,
} from 'lucide-react';
import { SimulatorId } from '../../types/common';
import { getFleetSchematic, FeaturedImpellerMicroPreview } from './FleetSchematics';
import { FleetLearningPathRibbon } from './FleetLearningPathRibbon';

interface SimulatorFleetSectionProps {
  onLaunchSimulator?: (id: SimulatorId) => void;
}

export type DomainGroupId = 'turbomachinery' | 'tribology' | 'rotordynamics' | 'piping';

interface FleetTwinItem {
  id: SimulatorId;
  title: string;
  benefit: string;
  domain: string;
  domainGroup: DomainGroupId;
  difficulty: 'Intermediate' | 'Advanced' | 'Expert';
  time: string;
  standard: string;
  standardCode: 'API' | 'ISO' | 'ASME' | 'AGMA';
  featured?: boolean;
  symbolGlyph: string;
  formulaSnippet: string;
  keyMetric: { label: string; value: string };
}

// --------------------------------------------------------------------------
// DOMAIN TYPOGRAPHY & SYMBOL ACCENT SYSTEM
// Cards maintain uniform, ultra-clean, obsidian dark slate backgrounds.
// Differentiation is achieved purely through fonts, texts, engineering symbols & schematics.
// --------------------------------------------------------------------------
const DOMAIN_THEMES: Record<
  DomainGroupId,
  {
    name: string;
    icon: React.ElementType;
    standards: string;
    primaryHex: string;
    accentFont: string;
    accentHoverFont: string;
    topStripe: string;
    tagBg: string;
    tagBorder: string;
    tagText: string;
    formulaText: string;
    schematicBorderHover: string;
    btnOutline: string;
    btnHover: string;
  }
> = {
  turbomachinery: {
    name: 'Turbomachinery & Pressure Systems',
    icon: Wind,
    standards: 'API 617 &bull; API 618 &bull; API 612 &bull; API 610',
    primaryHex: '#06B6D4',
    accentFont: 'text-cyan-400',
    accentHoverFont: 'group-hover:text-cyan-400',
    topStripe: 'bg-cyan-500',
    tagBg: 'bg-cyan-950/40',
    tagBorder: 'border-cyan-800/40',
    tagText: 'text-cyan-300',
    formulaText: 'text-cyan-400',
    schematicBorderHover: 'group-hover:border-cyan-500/50',
    btnOutline: 'border-cyan-500/40 text-cyan-400',
    btnHover: 'hover:bg-cyan-500/10 hover:border-cyan-400 hover:text-cyan-300',
  },
  tribology: {
    name: 'Tribology, Gearing & Heavy Bearings',
    icon: Disc,
    standards: 'AGMA 2001 &bull; ISO 281 &bull; API 684',
    primaryHex: '#F59E0B',
    accentFont: 'text-amber-400',
    accentHoverFont: 'group-hover:text-amber-400',
    topStripe: 'bg-amber-500',
    tagBg: 'bg-amber-950/40',
    tagBorder: 'border-amber-800/40',
    tagText: 'text-amber-300',
    formulaText: 'text-amber-400',
    schematicBorderHover: 'group-hover:border-amber-500/50',
    btnOutline: 'border-amber-500/40 text-amber-400',
    btnHover: 'hover:bg-amber-500/10 hover:border-amber-400 hover:text-amber-300',
  },
  rotordynamics: {
    name: 'Rotor Dynamics & Precision Alignment',
    icon: RotateCw,
    standards: 'ISO 1940 &bull; API 684 &bull; API 686',
    primaryHex: '#10B981',
    accentFont: 'text-emerald-400',
    accentHoverFont: 'group-hover:text-emerald-400',
    topStripe: 'bg-emerald-500',
    tagBg: 'bg-emerald-950/40',
    tagBorder: 'border-emerald-800/40',
    tagText: 'text-emerald-300',
    formulaText: 'text-emerald-400',
    schematicBorderHover: 'group-hover:border-emerald-500/50',
    btnOutline: 'border-emerald-500/40 text-emerald-400',
    btnHover: 'hover:bg-emerald-500/10 hover:border-emerald-400 hover:text-emerald-300',
  },
  piping: {
    name: 'Process Piping & Fluid Sealing',
    icon: Activity,
    standards: 'ASME B31.3 &bull; API 682',
    primaryHex: '#8B5CF6',
    accentFont: 'text-purple-400',
    accentHoverFont: 'group-hover:text-purple-400',
    topStripe: 'bg-purple-500',
    tagBg: 'bg-purple-950/40',
    tagBorder: 'border-purple-800/40',
    tagText: 'text-purple-300',
    formulaText: 'text-purple-400',
    schematicBorderHover: 'group-hover:border-purple-500/50',
    btnOutline: 'border-purple-500/40 text-purple-400',
    btnHover: 'hover:bg-purple-500/10 hover:border-purple-400 hover:text-purple-300',
  },
};

export const SimulatorFleetSection: React.FC<SimulatorFleetSectionProps> = ({
  onLaunchSimulator,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Complete Registry of all 11 Digital Twins with Physics Formulas & Symbols
  const ALL_TWINS: FleetTwinItem[] = useMemo(
    () => [
      // 1. Turbomachinery
      {
        id: 'compressor' as SimulatorId,
        title: 'Centrifugal Compressor Surge & Anti-Surge',
        benefit: 'Map dynamic aerodynamic stall lines and tune anti-surge recycle valves before reverse flow damage occurs.',
        domain: 'Turbomachinery',
        domainGroup: 'turbomachinery',
        difficulty: 'Advanced',
        time: '20 Min',
        standard: 'API 617 / ASME PTC 10',
        standardCode: 'API',
        featured: true,
        symbolGlyph: '∿',
        formulaSnippet: 'Δh_poly = (Z·R·T₁)/m · [PRᵐ - 1]',
        keyMetric: { label: 'Surge Line', value: 'β ≤ 0.85' },
      },
      {
        id: 'recip' as SimulatorId,
        title: 'Reciprocating Compressor Cylinder P-V Dynamics',
        benefit: 'Evaluate real-time cylinder pressure-volume loops, valve flutter losses, and crosshead pin rod reversal.',
        domain: 'Positive Displacement',
        domainGroup: 'turbomachinery',
        difficulty: 'Advanced',
        time: '25 Min',
        standard: 'API 618 5th Ed',
        standardCode: 'API',
        symbolGlyph: '◷',
        formulaSnippet: '∮ P dV • Dynamic Work',
        keyMetric: { label: 'Rod Load', value: 'Reversal > 3%' },
      },
      {
        id: 'turbine' as SimulatorId,
        title: 'Steam Turbine Isentropic Expansion & Mollier',
        benefit: 'Simulate Willans line thermal efficiency, stage enthalpy drops, and Wilson line wet-droplet blade erosion.',
        domain: 'Thermodynamics',
        domainGroup: 'turbomachinery',
        difficulty: 'Intermediate',
        time: '15 Min',
        standard: 'API 612 / ASME PTC 6',
        standardCode: 'API',
        symbolGlyph: '♨',
        formulaSnippet: 'W = ṁ(h₁ - h₂_isen) · η_t',
        keyMetric: { label: 'Wilson Line', value: 'Moisture < 12%' },
      },
      {
        id: 'pump' as SimulatorId,
        title: 'Centrifugal Pump Cavitation & Impeller NPSH',
        benefit: 'Compute suction specific speed Nss, compare NPSHa vs NPSHr 3% head drop, and analyze suction recirculation.',
        domain: 'Hydraulics',
        domainGroup: 'turbomachinery',
        difficulty: 'Intermediate',
        time: '15 Min',
        standard: 'API 610 / HI 9.6.1',
        standardCode: 'API',
        symbolGlyph: '≎',
        formulaSnippet: 'NPSHa = (P_s - P_v)/(ρg) + Z_s',
        keyMetric: { label: 'Cavitation', value: 'Nss = 11,200' },
      },

      // 2. Tribology & Bearings
      {
        id: 'gearbox' as SimulatorId,
        title: 'Industrial Gearbox Mesh Dynamics & AGMA Rating',
        benefit: 'Analyze gear mesh frequencies (GMF), sideband harmonics, and ISO 6336/AGMA contact & bending safety factors.',
        domain: 'Power Transmission',
        domainGroup: 'tribology',
        difficulty: 'Advanced',
        time: '25 Min',
        standard: 'AGMA 2001 / ISO 6336',
        standardCode: 'AGMA',
        symbolGlyph: '⚙',
        formulaSnippet: 'f_gmf = z₁ · n₁ = z₂ · n₂',
        keyMetric: { label: 'Contact Safety', value: 'S_H ≥ 1.25' },
      },
      {
        id: 'bearing' as SimulatorId,
        title: 'Rolling Element Bearing Defect Enveloping',
        benefit: 'Calculate BPFO, BPFI, and ball spin defect spikes from vibration spectrum data using ISO 10816 velocity limits.',
        domain: 'Tribology & Vibration',
        domainGroup: 'tribology',
        difficulty: 'Intermediate',
        time: '15 Min',
        standard: 'ISO 281 / ISO 10816',
        standardCode: 'ISO',
        symbolGlyph: '∿',
        formulaSnippet: 'BPFO = (n/2)·f_r·(1 - d/D·cosα)',
        keyMetric: { label: 'Envelope Peak', value: '4.5 mm/s' },
      },
      {
        id: 'journal' as SimulatorId,
        title: 'Hydrodynamic Journal Bearing & Orbit Whirl',
        benefit: 'Simulate 2D Reynolds lubrication pressure wedge, eccentricity locus, and sub-synchronous 0.45X oil whirl onset.',
        domain: 'Rotor Dynamics',
        domainGroup: 'tribology',
        difficulty: 'Expert',
        time: '30 Min',
        standard: 'API 684 / DIN 31652',
        standardCode: 'API',
        symbolGlyph: '◎',
        formulaSnippet: '∂/∂x(h³∂p/∂x) = 6μU·∂h/∂x',
        keyMetric: { label: 'Locus', value: 'e/c = 0.42' },
      },

      // 3. Rotor Dynamics
      {
        id: 'rotor' as SimulatorId,
        title: 'Rotor Dynamics & 2-Plane Resonant Balancing',
        benefit: 'Calculate 1X synchronous unbalance response, Jeffcott rotor critical speeds, and polar balance trial weights.',
        domain: 'Rotor Dynamics',
        domainGroup: 'rotordynamics',
        difficulty: 'Intermediate',
        time: '20 Min',
        standard: 'ISO 1940-1 / API 684',
        standardCode: 'ISO',
        symbolGlyph: '⟳',
        formulaSnippet: 'U_per = (G × m_rotor) / Ω',
        keyMetric: { label: 'Grade', value: 'ISO G2.5' },
      },
      {
        id: 'alignment' as SimulatorId,
        title: 'Shaft Alignment & Thermal Growth Offsets',
        benefit: 'Calculate reverse-indicator dial sweeps, collinear rim/face offsets, and thermal casing thermal growth shims.',
        domain: 'Alignment & Mechanics',
        domainGroup: 'rotordynamics',
        difficulty: 'Intermediate',
        time: '15 Min',
        standard: 'API 686 2nd Ed',
        standardCode: 'API',
        symbolGlyph: '⇥',
        formulaSnippet: 'Δy_th = α · L_casing · ΔT',
        keyMetric: { label: 'Collinear Offset', value: '< 0.05 mm' },
      },

      // 4. Piping & Sealing
      {
        id: 'pipe' as SimulatorId,
        title: 'Process Piping Thermal Flexure & Expansion',
        benefit: 'Model 3D thermal expansion loops, anchor reactions, and allowable displacement stress ranges per ASME B31.3.',
        domain: 'Piping Mechanics',
        domainGroup: 'piping',
        difficulty: 'Intermediate',
        time: '20 Min',
        standard: 'ASME B31.3 §319',
        standardCode: 'ASME',
        symbolGlyph: '⤹',
        formulaSnippet: 'S_E ≤ f(1.25S_c + 0.25S_h)',
        keyMetric: { label: 'Loop Flexure', value: 'ΔL = 48 mm' },
      },
      {
        id: 'seal' as SimulatorId,
        title: 'API 682 Mechanical Seal Flush Plan Thermodynamics',
        benefit: 'Verify face temperature dissipation, boiling point vapor margins, and barrier fluid circulation loops.',
        domain: 'Fluid Sealing',
        domainGroup: 'piping',
        difficulty: 'Intermediate',
        time: '15 Min',
        standard: 'API 682 4th Ed',
        standardCode: 'API',
        symbolGlyph: '⊚',
        formulaSnippet: 'P_barrier = P_seal + 1.5 bar',
        keyMetric: { label: 'Flush Plan 53A', value: 'ΔT_vap > 14°C' },
      },
    ],
    []
  );

  const DOMAIN_GROUPS: DomainGroupId[] = ['turbomachinery', 'tribology', 'rotordynamics', 'piping'];

  // Filter Computation
  const filteredTwins = useMemo(() => {
    if (activeFilter === 'all') return ALL_TWINS;
    if (activeFilter === 'advanced') {
      return ALL_TWINS.filter((t) => t.difficulty === 'Advanced' || t.difficulty === 'Expert');
    }
    if (activeFilter === 'intermediate') {
      return ALL_TWINS.filter((t) => t.difficulty === 'Intermediate');
    }
    if (activeFilter === 'quick') {
      return ALL_TWINS.filter((t) => parseInt(t.time, 10) <= 20);
    }
    if (activeFilter === 'api') {
      return ALL_TWINS.filter((t) => t.standardCode === 'API');
    }
    if (activeFilter === 'iso') {
      return ALL_TWINS.filter((t) => t.standardCode === 'ISO');
    }
    if (activeFilter === 'asme') {
      return ALL_TWINS.filter((t) => t.standardCode === 'ASME');
    }
    return ALL_TWINS;
  }, [ALL_TWINS, activeFilter]);

  const counts = useMemo(
    () => ({
      all: ALL_TWINS.length,
      advanced: ALL_TWINS.filter((t) => t.difficulty === 'Advanced' || t.difficulty === 'Expert').length,
      intermediate: ALL_TWINS.filter((t) => t.difficulty === 'Intermediate').length,
      quick: ALL_TWINS.filter((t) => parseInt(t.time, 10) <= 20).length,
      api: ALL_TWINS.filter((t) => t.standardCode === 'API').length,
      iso: ALL_TWINS.filter((t) => t.standardCode === 'ISO').length,
      asme: ALL_TWINS.filter((t) => t.standardCode === 'ASME').length,
    }),
    [ALL_TWINS]
  );

  const groupedSections = useMemo(() => {
    return DOMAIN_GROUPS.map((groupId) => {
      const theme = DOMAIN_THEMES[groupId];
      const items = filteredTwins.filter((t) => t.domainGroup === groupId);
      return {
        id: groupId,
        theme,
        items,
        count: items.length,
      };
    }).filter((g) => g.count > 0);
  }, [DOMAIN_GROUPS, filteredTwins]);

  let cardCounter = 0;

  return (
    <section className="w-full px-4 lg:px-6 max-w-[1720px] mx-auto select-none">
      {/* ----------------------------------------------------------------- */}
      {/* SECTION HEADER BLOCK: 32px top / 24px bottom (Strict 8pt System)   */}
      {/* ----------------------------------------------------------------- */}
      <div className="pt-8 pb-6 border-b border-[#1E293B]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-[12px] font-mono font-semibold tracking-wider uppercase mb-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>ROTATING MACHINERY &amp; RELIABILITY FLEET</span>
            </div>
            <h2 className="text-[28px] md:text-[32px] font-bold tracking-tight text-slate-100 font-sans leading-tight">
              Mechanical Engineering Digital Twins
            </h2>
            <p className="text-[15px] text-slate-400 mt-1.5 max-w-[60ch] leading-relaxed">
              Physics-verified simulation workbenches conforming to API, ISO, ASME, and AGMA codes. Select any simulator below to launch its interactive workbench.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0F172A] border border-[#1E293B] text-[12px] font-mono text-slate-300 shrink-0 self-start md:self-end shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#06B6D4]" />
            <span className="font-semibold text-slate-200">
              {filteredTwins.length} ACTIVE SIMULATOR LABS
            </span>
          </div>
        </div>

        {/* Live Filter Chips Row */}
        <div className="flex items-center gap-1.5 mt-5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
            DISCIPLINE:
          </span>

          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`h-[28px] px-3 rounded-full text-[12px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                : 'bg-[#0F172A] border border-[#1E293B] text-slate-300 hover:border-cyan-500/50 hover:text-white'
            }`}
          >
            <span>All Labs</span>
            <span className="text-[10px] opacity-75">({counts.all})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('advanced')}
            className={`h-[28px] px-3 rounded-full text-[12px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFilter === 'advanced'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                : 'bg-[#0F172A] border border-[#1E293B] text-slate-300 hover:border-amber-500/50 hover:text-white'
            }`}
          >
            <span>Advanced &amp; Expert</span>
            <span className="text-[10px] opacity-75">({counts.advanced})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('intermediate')}
            className={`h-[28px] px-3 rounded-full text-[12px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFilter === 'intermediate'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                : 'bg-[#0F172A] border border-[#1E293B] text-slate-300 hover:border-emerald-500/50 hover:text-white'
            }`}
          >
            <span>Intermediate</span>
            <span className="text-[10px] opacity-75">({counts.intermediate})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('quick')}
            className={`h-[28px] px-3 rounded-full text-[12px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFilter === 'quick'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                : 'bg-[#0F172A] border border-[#1E293B] text-slate-300 hover:border-cyan-500/50 hover:text-white'
            }`}
          >
            <span>&le; 20 Min</span>
            <span className="text-[10px] opacity-75">({counts.quick})</span>
          </button>

          <div className="h-4 w-[1px] bg-[#1E293B] mx-1" />

          <button
            type="button"
            onClick={() => setActiveFilter('api')}
            className={`h-[28px] px-3 rounded-full text-[12px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFilter === 'api'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                : 'bg-[#0F172A] border border-[#1E293B] text-slate-300 hover:border-cyan-500/50 hover:text-white'
            }`}
          >
            <span>API Codes</span>
            <span className="text-[10px] opacity-75">({counts.api})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('iso')}
            className={`h-[28px] px-3 rounded-full text-[12px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFilter === 'iso'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                : 'bg-[#0F172A] border border-[#1E293B] text-slate-300 hover:border-emerald-500/50 hover:text-white'
            }`}
          >
            <span>ISO</span>
            <span className="text-[10px] opacity-75">({counts.iso})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('asme')}
            className={`h-[28px] px-3 rounded-full text-[12px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFilter === 'asme'
                ? 'bg-purple-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(139,92,246,0.35)]'
                : 'bg-[#0F172A] border border-[#1E293B] text-slate-300 hover:border-purple-500/50 hover:text-white'
            }`}
          >
            <span>ASME</span>
            <span className="text-[10px] opacity-75">({counts.asme})</span>
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* DOMAIN SECTIONS (ALL CARDS ON UNIFORM OBSIDIAN SLATE BACKGROUND)  */}
      {/* ----------------------------------------------------------------- */}
      <div className="space-y-10 mt-6 pb-16">
        {groupedSections.map((group) => {
          const { theme } = group;
          const GroupIcon = theme.icon;

          return (
            <div key={group.id} className="relative">
              {/* Sticky Domain Mini-Header: Clean dark surface with domain text accent */}
              <div className="sticky top-12 z-20 backdrop-blur-md bg-[#0B1220]/95 border-y border-[#1E293B] py-2.5 px-3.5 mb-4 flex items-center justify-between shadow-lg rounded-md">
                <div className="flex items-center gap-3">
                  {/* Subtle 3px colored accent dot */}
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: theme.primaryHex, boxShadow: `0 0 8px ${theme.primaryHex}` }}
                  />

                  <div className="w-6 h-6 rounded-md bg-[#070D18] border border-[#1E293B] flex items-center justify-center" style={{ color: theme.primaryHex }}>
                    <GroupIcon className="w-3.5 h-3.5" />
                  </div>

                  <h3 className="text-[13px] font-mono font-bold uppercase tracking-wider text-slate-100">
                    <span className={theme.accentFont}>{theme.name}</span>
                  </h3>

                  <span
                    className="text-[11px] font-mono text-slate-400 hidden lg:inline opacity-80"
                    dangerouslySetInnerHTML={{ __html: `(${theme.standards})` }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center h-[22px] px-2.5 py-[2px] rounded-full ${theme.tagBg} border ${theme.tagBorder} text-[11px] font-mono font-bold ${theme.tagText}`}
                  >
                    {group.count} {group.count === 1 ? 'LAB' : 'LABS'}
                  </span>
                </div>
              </div>

              {/* 3-Column Domain Grid (Uniform Dark Slate Cards) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map((sim) => {
                  cardCounter += 1;
                  const currentGlobalIndex = cardCounter;
                  const isFeatured = sim.featured;
                  const SchematicComponent = getFleetSchematic(sim.id);
                  const staggeredDelayMs = (currentGlobalIndex % 12) * 40;

                  return (
                    <React.Fragment key={sim.id}>
                      {/* CARD COMPONENT: Uniform Obsidian Slate Background with Domain Text & Diagram Accents */}
                      <div
                        className={`group relative flex flex-col justify-between bg-[#0C1322] border ${
                          isFeatured
                            ? 'border-cyan-500/70 shadow-[0_0_24px_rgba(6,182,212,0.15)] col-span-1 md:col-span-2 lg:col-span-2'
                            : 'border-[#1E293B] hover:border-slate-600 hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                        } rounded-[10px] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 motion-reduce:transition-none`}
                        style={{
                          minHeight: isFeatured ? '320px' : '260px',
                          maxHeight: isFeatured ? 'none' : '310px',
                          animationDelay: `${staggeredDelayMs}ms`,
                        }}
                      >
                        {/* Domain Top Accent Line (2px) */}
                        <div className={`w-full h-[2px] ${theme.topStripe} opacity-70 group-hover:opacity-100 transition-opacity`} />

                        <div className="p-4 flex flex-col h-full justify-between">
                          {isFeatured ? (
                            /* ------------------------------------------------- */
                            /* 1. FEATURED TWIN (2-COLUMN INTEGRATED PREVIEW)    */
                            /* ------------------------------------------------- */
                            <div className="flex flex-col h-full justify-between">
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                {/* Left Column (5 Cols): Auto-running Muted Micro-Preview */}
                                <div className="md:col-span-5 flex flex-col justify-center">
                                  <FeaturedImpellerMicroPreview />
                                </div>

                                {/* Right Column (7 Cols): Metadata & Physics Brief */}
                                <div className="md:col-span-7 flex flex-col justify-between">
                                  <div>
                                    {/* Code Badge & Featured Tag */}
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                      <span className={`inline-flex items-center gap-1.5 h-[20px] px-2 py-[2px] rounded ${theme.tagBg} border ${theme.tagBorder} ${theme.tagText} text-[11px] font-mono font-semibold`}>
                                        <span className="font-bold">{sim.symbolGlyph}</span>
                                        <span>{sim.standard}</span>
                                      </span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="inline-flex items-center h-[20px] px-2 py-[2px] rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[11px] font-mono font-bold uppercase tracking-wider">
                                          FEATURED LAB
                                        </span>
                                        <span className="inline-flex items-center h-[20px] px-2 py-[2px] rounded bg-[#070D18] border border-[#1E293B] text-[11px] font-mono text-slate-400">
                                          ID: {sim.id.toUpperCase()}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-[18px] sm:text-[20px] font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors leading-snug line-clamp-2 mb-1.5 font-sans">
                                      {sim.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-[13.5px] text-slate-300 leading-[1.5] line-clamp-2 mb-3">
                                      {sim.benefit}
                                    </p>

                                    {/* Physics Formula & Telemetry Metric Bar */}
                                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#070D18] border border-[#1E293B] text-[11px] font-mono mb-3">
                                      <span className="text-cyan-400 font-medium truncate mr-2">
                                        {sim.formulaSnippet}
                                      </span>
                                      <span className="text-slate-300 font-semibold shrink-0">
                                        {sim.keyMetric.label}: {sim.keyMetric.value}
                                      </span>
                                    </div>

                                    {/* Chips */}
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className={`inline-flex items-center h-[20px] px-2 py-[2px] rounded ${theme.tagBg} border ${theme.tagBorder} ${theme.tagText} text-[11px] font-mono`}>
                                        {sim.domain}
                                      </span>
                                      <span className="inline-flex items-center h-[20px] px-2 py-[2px] rounded bg-[#0F172A] border border-[#1E293B] text-slate-300 text-[11px] font-mono">
                                        {sim.difficulty}
                                      </span>
                                      <span className="inline-flex items-center h-[20px] px-2 py-[2px] rounded bg-[#0F172A] border border-[#1E293B] text-slate-300 text-[11px] font-mono">
                                        {sim.time}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Card Footer: The ONLY solid cyan Launch button on the page */}
                              <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#1E293B]">
                                <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                                  API 617 Digital Twin Ready &bull; Real-time Aerodynamic Solver
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onLaunchSimulator?.(sim.id)}
                                  className="group/btn h-[36px] px-4 rounded-lg text-[13px] font-bold inline-flex items-center gap-2 bg-cyan-500 text-slate-950 border border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.35)] hover:bg-cyan-400 transition-all duration-200 cursor-pointer"
                                >
                                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                                  <span>Launch Flagship Twin</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* ------------------------------------------------- */
                            /* 2. STANDARD TWIN CARD (UNIFORM OBSIDIAN SLATE)    */
                            /* ------------------------------------------------- */
                            <div className="flex flex-col h-full justify-between">
                              <div>
                                {/* Header Row: Standard Code Badge with Symbol, ID, & Blueprint Diagram */}
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="space-y-1">
                                    <span className={`inline-flex items-center gap-1.5 h-[20px] px-2 py-[2px] rounded ${theme.tagBg} border ${theme.tagBorder} ${theme.tagText} text-[11px] font-mono font-semibold`}>
                                      <span className="font-bold">{sim.symbolGlyph}</span>
                                      <span>{sim.standard}</span>
                                    </span>
                                    <div className="block">
                                      <span className="inline-flex items-center h-[20px] px-2 py-[2px] rounded bg-[#070D18] border border-[#1E293B] text-[11px] font-mono text-slate-400">
                                        ID: {sim.id.toUpperCase()}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Small Diagram: Keyed SVG Blueprint Schematic on Neutral Dark Plate */}
                                  <div
                                    className={`w-[60px] h-[48px] p-1 rounded-md bg-[#070D18] border border-[#1E293B] ${theme.schematicBorderHover} flex items-center justify-center text-slate-400 transition-all duration-300`}
                                    title={`${sim.title} Physics Schematic`}
                                  >
                                    <SchematicComponent className="w-full h-full" accentColor={theme.primaryHex} />
                                  </div>
                                </div>

                                {/* Title (17-18px semibold, with domain hover font color) */}
                                <h3 className={`text-[17px] font-semibold text-slate-100 ${theme.accentHoverFont} transition-colors leading-snug line-clamp-2 mt-1 mb-1.5 font-sans`}>
                                  {sim.title}
                                </h3>

                                {/* Description (13px, line-height 1.45, clamped to 2 lines) */}
                                <p className="text-[13px] text-slate-400 leading-[1.45] line-clamp-2 mb-2.5">
                                  {sim.benefit}
                                </p>

                                {/* Small Physics Formula & Telemetry Metric Bar */}
                                <div className="flex items-center justify-between px-2 py-1 rounded bg-[#070D18] border border-[#1E293B] text-[11px] font-mono mb-2.5">
                                  <span className={`${theme.formulaText} truncate mr-2 font-medium`}>
                                    {sim.formulaSnippet}
                                  </span>
                                  <span className="text-slate-300 font-semibold shrink-0 text-[10px]">
                                    {sim.keyMetric.value}
                                  </span>
                                </div>

                                {/* Chips: Domain Highlighted in Domain Text, others in neutral dark slate */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className={`inline-flex items-center h-[20px] px-2 py-[2px] rounded ${theme.tagBg} border ${theme.tagBorder} ${theme.tagText} text-[11px] font-mono font-medium`}>
                                    {sim.domain}
                                  </span>
                                  <span className="inline-flex items-center h-[20px] px-2 py-[2px] rounded bg-[#0F172A] border border-[#1E293B] text-slate-400 text-[11px] font-mono">
                                    {sim.difficulty}
                                  </span>
                                  <span className="inline-flex items-center h-[20px] px-2 py-[2px] rounded bg-[#0F172A] border border-[#1E293B] text-slate-400 text-[11px] font-mono">
                                    {sim.time}
                                  </span>
                                </div>
                              </div>

                              {/* Card Footer: Crisp Outline Button with Domain Accent Font & Border */}
                              <div className="flex items-center justify-end pt-2.5 mt-auto border-t border-[#1E293B]">
                                <button
                                  type="button"
                                  onClick={() => onLaunchSimulator?.(sim.id)}
                                  className={`group/btn h-[34px] px-3.5 rounded-lg text-[12px] font-mono font-semibold inline-flex items-center gap-1.5 bg-[#070D18] border ${theme.btnOutline} ${theme.btnHover} transition-all duration-200 cursor-pointer`}
                                >
                                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                                  <span>Launch</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ------------------------------------------------------------- */}
                      {/* RHYTHM BREAKER: FULL-WIDTH LEARNING PATH RIBBON AFTER 6 CARDS  */}
                      {/* ------------------------------------------------------------- */}
                      {currentGlobalIndex === 6 && (
                        <FleetLearningPathRibbon onLaunchSimulator={onLaunchSimulator} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
