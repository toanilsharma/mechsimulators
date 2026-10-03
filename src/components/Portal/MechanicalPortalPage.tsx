import React, { useState, useMemo } from 'react';
import { RouteId, SimulatorId } from '../../types/common';
import { useApp } from '../../context/AppContext';
import { LiveSimulatorsFooter } from '../Footer/LiveSimulatorsFooter';
import { ALL_SIMULATORS, CATEGORY_THEMES, SimulatorCategory } from '../../data/simulatorRegistry';
import {
  Cpu,
  RotateCw,
  Wind,
  Disc,
  Compass,
  Cog,
  Flame,
  Activity,
  Layers,
  ShieldCheck,
  Target,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Code,
  Globe,
  Link as LinkIcon,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Wrench,
  GraduationCap,
  Share2,
} from 'lucide-react';

export const MechanicalPortalPage: React.FC = () => {
  const { setActiveRoute } = useApp();

  // Domain Config for generating links to paste into LiveSimulators.com
  const [baseDomainChoice, setBaseDomainChoice] = useState<'subdomain' | 'subpath' | 'netlify' | 'custom'>('subdomain');
  const [customDomainInput, setCustomDomainInput] = useState<string>('https://mechanical.livesimulators.com');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'cname' | 'proxy' | 'html'>('overview');

  // Compute actual base URL based on selection
  const computedBaseUrl = useMemo(() => {
    switch (baseDomainChoice) {
      case 'subdomain':
        return 'https://mechanical.livesimulators.com';
      case 'subpath':
        return 'https://livesimulators.com/mechanical';
      case 'netlify':
        return 'https://mechanicallab.netlify.app';
      case 'custom':
        return customDomainInput.replace(/\/$/, '');
      default:
        return 'https://mechanical.livesimulators.com';
    }
  }, [baseDomainChoice, customDomainInput]);

  const getFullSimulatorUrl = (simId: SimulatorId) => {
    return `${computedBaseUrl}/#${simId}`;
  };

  const handleCopyLink = (simId: SimulatorId) => {
    const url = getFullSimulatorUrl(simId);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
      setCopiedId(simId);
      setTimeout(() => setCopiedId(null), 2200);
    }
  };

  const handleCopyAllLinks = (format: 'markdown' | 'json' | 'html') => {
    let text = '';
    if (format === 'markdown') {
      text = ALL_SIMULATORS.map(
        (s) => `- [${s.name} (${s.standardOrg})](${getFullSimulatorUrl(s.id)}) — ${s.tagline}`
      ).join('\n');
    } else if (format === 'html') {
      text = ALL_SIMULATORS.map(
        (s) =>
          `<div class="simulator-card"><a href="${getFullSimulatorUrl(s.id)}"><h3>${s.name}</h3><p>${s.tagline}</p></a></div>`
      ).join('\n');
    } else {
      const data = ALL_SIMULATORS.map((s) => ({
        id: s.id,
        name: s.name,
        standard: s.standard,
        url: getFullSimulatorUrl(s.id),
        description: s.description,
      }));
      text = JSON.stringify(data, null, 2);
    }

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    }
  };

  return (
    <div
      id="mechanical-portal-page"
      className="w-full min-h-full bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-white pb-16"
    >
      {/* 1. Portal Welcome Header */}
      <section className="relative border-b border-[#162033] bg-gradient-to-b from-[#0c1526] via-[#090f1c] to-[#070b14] px-4 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Brand & Ecosystem Pill */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-950/70 border border-sky-500/30 text-xs font-mono text-sky-300 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white tracking-wide">LIVESIMULATORS.COM</span>
              <span className="text-slate-500">•</span>
              <span>Mechanical Engineering Division</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveRoute('home')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e1a30] hover:bg-[#142646] border border-sky-500/30 text-xs font-mono text-sky-200 hover:text-white transition-all cursor-pointer shadow-sm"
              >
                <span>Full Pro Sandbox & Fleet Matrix</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Headline & Description */}
          <div className="space-y-3 max-w-4xl">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Welcome to <span className="text-sky-400">Live Simulators</span> — Mechanical Lab
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
              Interactive, browser-native 64-bit multi-physics simulation digital twins for industrial rotating
              machinery, turbomachinery, and process piping reliability. Built for engineers, plant operators, and university students.
            </p>
          </div>

          {/* Quick Stats & Live Indicator Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-[#091120] border border-[#162238] space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Total Simulators</span>
              <div className="text-lg font-mono font-bold text-white flex items-center gap-1.5">
                <Cpu size={16} className="text-sky-400" />
                <span>11 Digital Twins</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#091120] border border-[#162238] space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Governing Standards</span>
              <div className="text-lg font-mono font-bold text-white flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span>API, ISO, ASME, AGMA</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#091120] border border-[#162238] space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Math Engine</span>
              <div className="text-lg font-mono font-bold text-white flex items-center gap-1.5">
                <Sparkles size={16} className="text-amber-400" />
                <span>IEEE-754 64-Bit Float</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#091120] border border-[#162238] space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Deployment</span>
              <div className="text-lg font-mono font-bold text-white flex items-center gap-1.5">
                <Globe size={16} className="text-cyan-400" />
                <span>Zero Install / Client</span>
              </div>
            </div>
          </div>

          {/* Integration & Deep-Linking Control Bar */}
          <div className="p-4 rounded-2xl bg-[#091120]/90 border border-sky-500/30 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#162238] pb-3">
              <div className="flex items-center gap-2">
                <LinkIcon size={16} className="text-sky-400" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Target Domain For LiveSimulators.com Links:
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setBaseDomainChoice('subdomain')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    baseDomainChoice === 'subdomain'
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'bg-[#121c2e] text-slate-300 hover:text-white'
                  }`}
                  title="Recommended: mechanical.livesimulators.com"
                >
                  mechanical.livesimulators.com
                </button>
                <button
                  type="button"
                  onClick={() => setBaseDomainChoice('subpath')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    baseDomainChoice === 'subpath'
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'bg-[#121c2e] text-slate-300 hover:text-white'
                  }`}
                  title="Proxy Path: livesimulators.com/mechanical"
                >
                  livesimulators.com/mechanical
                </button>
                <button
                  type="button"
                  onClick={() => setBaseDomainChoice('netlify')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    baseDomainChoice === 'netlify'
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'bg-[#121c2e] text-slate-300 hover:text-white'
                  }`}
                  title="Direct Netlify Address"
                >
                  mechanicallab.netlify.app
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Current Base URL:</span>
                <span className="text-sky-300 font-bold bg-[#0d1627] px-2 py-0.5 rounded border border-[#1b2b48]">
                  {computedBaseUrl}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyAllLinks('markdown')}
                  className="px-2.5 py-1 rounded-md bg-[#121d30] hover:bg-[#1a2a44] border border-sky-500/30 text-sky-200 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                  title="Copy list of all 11 simulators formatted as Markdown"
                >
                  {copiedAll ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedAll ? 'Copied All!' : 'Copy All Links (Markdown)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(!isGuideOpen)}
                  className="px-2.5 py-1 rounded-md bg-[#162238] hover:bg-[#203150] text-slate-200 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Code size={12} className="text-amber-400" />
                  <span>How to hide Netlify & embed</span>
                  {isGuideOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>
            </div>

            {/* Collapsible Setup Guide */}
            {isGuideOpen && (
              <div className="mt-3 p-4 rounded-xl bg-[#060a12] border border-[#1b273d] space-y-4 text-xs font-sans text-slate-300">
                <div className="flex items-center justify-between border-b border-[#162238] pb-2">
                  <span className="font-bold text-white font-mono text-sm">
                    How to show livesimulators.com and hide the netlify.app URL
                  </span>
                  <div className="flex gap-1.5 font-mono text-[11px]">
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        activeTab === 'overview' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('cname')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        activeTab === 'cname' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400'
                      }`}
                    >
                      Option A: Subdomain
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('proxy')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        activeTab === 'proxy' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400'
                      }`}
                    >
                      Option B: Proxy Path
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('html')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        activeTab === 'html' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400'
                      }`}
                    >
                      HTML Snippets
                    </button>
                  </div>
                </div>

                {activeTab === 'overview' && (
                  <div className="space-y-2 text-slate-300 leading-relaxed">
                    <p>
                      <strong>Yes, it is 100% possible!</strong> When visitors click mechanical simulators, they can stay completely under your brand <strong>livesimulators.com</strong> without ever seeing <em>mechanicallab.netlify.app</em>.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 rounded-lg bg-[#0a101d] border border-sky-500/20 space-y-1">
                        <span className="font-bold text-sky-400 font-mono">Option A: Subdomain (Easiest)</span>
                        <p className="text-[11px] text-slate-400">
                          URL: <code className="text-white">mechanical.livesimulators.com</code>. Connected via a single DNS CNAME record in 2 minutes. Netlify automatically provides free SSL certificate.
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-[#0a101d] border border-cyan-500/20 space-y-1">
                        <span className="font-bold text-cyan-400 font-mono">Option B: Subpath Proxy</span>
                        <p className="text-[11px] text-slate-400">
                          URL: <code className="text-white">livesimulators.com/mechanical/</code>. If your main site is also hosted on Netlify, a 1-line <code className="text-white">_redirects</code> rewrite transparently proxies this site under your main domain.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'cname' && (
                  <div className="space-y-2 text-slate-300 leading-relaxed">
                    <p className="font-bold text-white">Steps for Option A: mechanical.livesimulators.com</p>
                    <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
                      <li>
                        Go to your domain DNS provider (where you bought <em>livesimulators.com</em>, e.g. GoDaddy, Namecheap, Cloudflare).
                      </li>
                      <li>
                        Add a new <strong>CNAME</strong> record:
                        <div className="mt-1 p-2 rounded bg-black/40 font-mono text-[11px] text-emerald-400 border border-emerald-500/20">
                          Type: CNAME &nbsp;|&nbsp; Host / Name: <strong>mechanical</strong> &nbsp;|&nbsp; Value / Points to: <strong>mechanicallab.netlify.app</strong>
                        </div>
                      </li>
                      <li>
                        In Netlify dashboard for this project: go to <strong>Site configuration → Domain management → Add a custom domain</strong>, and enter <strong>mechanical.livesimulators.com</strong>.
                      </li>
                      <li>
                        Netlify will verify DNS and issue a free Let's Encrypt SSL certificate. Done! Visitors will now see <strong>mechanical.livesimulators.com</strong> in the address bar.
                      </li>
                    </ol>
                  </div>
                )}

                {activeTab === 'proxy' && (
                  <div className="space-y-2 text-slate-300 leading-relaxed">
                    <p className="font-bold text-white">Steps for Option B: livesimulators.com/mechanical/*</p>
                    <p>
                      If your main <em>livesimulators.com</em> site is also hosted on Netlify, you can proxy all traffic to this mechanical site using Netlify rewrites (status code 200).
                    </p>
                    <p>
                      In the GitHub repository for <em>livesimulators.com</em>, add a file named <code className="text-white font-mono">_redirects</code> inside the publish folder with this exact line:
                    </p>
                    <div className="p-2.5 rounded bg-black/60 font-mono text-[11px] text-emerald-300 border border-emerald-500/30">
                      /mechanical/* &nbsp; https://mechanicallab.netlify.app/:splat &nbsp; 200
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Because the status code is <code className="text-sky-300 font-mono">200</code>, Netlify will invisibly proxy the content. The browser address bar stays on <strong>livesimulators.com/mechanical/</strong>!
                    </p>
                  </div>
                )}

                {activeTab === 'html' && (
                  <div className="space-y-2 text-slate-300 leading-relaxed">
                    <p className="font-bold text-white">Ready-Made HTML Card for your livesimulators.com Homepage:</p>
                    <pre className="p-3 rounded bg-black/60 font-mono text-[11px] text-sky-300 overflow-x-auto border border-[#1e2a40]">
{`<!-- Mechanical Simulator Link Card for livesimulators.com -->
<div class="simulator-card">
  <h3>Centrifugal Pump Cavitation & NPSH</h3>
  <p>API 610 / HI 9.6.1 Cavitation Severity & Impeller Trim</p>
  <a href="${computedBaseUrl}/#pump" class="launch-btn">Launch Simulator</a>
</div>`}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Compact Mechanical Simulators Grid */}
      <main className="max-w-6xl mx-auto px-4 py-8 w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#162033] pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Layers size={18} className="text-sky-400" />
              <span>Mechanical Engineering Digital Twins</span>
              <span className="text-xs font-mono font-normal text-slate-400 px-2 py-0.5 rounded-full bg-[#121c2e] border border-[#1c2c46]">
                11 Active Simulators
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Click &quot;Launch&quot; to test in-place, or click &quot;Copy Link&quot; to paste directly into your LiveSimulators.com main homepage.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400 hidden sm:inline">Each simulator has its own deep link</span>
          </div>
        </div>

        {/* Category-Wise Simulator Sections */}
        <div className="space-y-12 sm:space-y-14">
          {(Object.keys(CATEGORY_THEMES) as SimulatorCategory[]).map((category) => {
            const theme = CATEGORY_THEMES[category];
            const CatIcon = theme.icon;
            const simulators = ALL_SIMULATORS.filter((s) => s.category === category);

            return (
              <section
                key={category}
                id={`portal-category-${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                className="space-y-5"
              >
                {/* Category Header & Technical Overview Banner */}
                <div
                  className={`p-5 sm:p-6 rounded-2xl bg-gradient-to-r ${theme.bannerGradient} border ${theme.cardBorder} relative overflow-hidden shadow-xl space-y-3.5`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${theme.topStripe}`} />

                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg ${theme.accentBg} ${theme.accentBorder} flex items-center justify-center ${theme.accentText} border`}
                      >
                        <CatIcon size={16} />
                      </div>
                      <span className="text-xs font-mono font-black tracking-wider uppercase px-2.5 py-1 rounded-md bg-black/60 border border-white/10 text-white">
                        {theme.badgeLabel}
                      </span>
                      <span className={`text-xs font-mono font-bold ${theme.accentText}`}>
                        {simulators.length} Digital Twins
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mr-1">
                        CODES:
                      </span>
                      {theme.governingCodes.map((code) => (
                        <span
                          key={code}
                          className="px-2 py-0.5 rounded-md bg-black/50 border border-white/10 text-slate-300 font-semibold"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Title & Tagline */}
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <span>{category}</span>
                    </h3>
                    <p className={`text-xs font-mono font-semibold ${theme.accentText} mt-0.5`}>
                      {theme.tagline}
                    </p>
                  </div>

                  {/* Category Details */}
                  <p className="text-xs text-slate-300 font-sans leading-relaxed max-w-4xl">
                    {theme.description}
                  </p>

                  {/* Modeled Assets and Failure Modes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 border-t border-white/10 text-[11px]">
                    <div className="space-y-1">
                      <div className="text-[9px] font-mono font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Target size={11} className={theme.accentText} />
                        <span>Modeled Plant Equipment:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {theme.industrialAssets.map((asset) => (
                          <span
                            key={asset}
                            className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-slate-200 text-[10px] font-mono"
                          >
                            {asset}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[9px] font-mono font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <ShieldCheck size={11} className={theme.accentText} />
                        <span>Critical Failures Prevented:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {theme.primaryFailureModes.map((mode) => (
                          <span
                            key={mode}
                            className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-slate-200 text-[10px] font-mono"
                          >
                            {mode}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Simulators Grid - Spacious gap-6 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {simulators.map((sim) => {
                    const Icon = sim.icon;
                    const SignalIcon = sim.signalIcon;
                    const CategoryIcon = theme.icon;
                    const fullUrl = getFullSimulatorUrl(sim.id);
                    const isCopied = copiedId === sim.id;

                    return (
                      <div
                        key={sim.id}
                        id={`portal-sim-${sim.id}`}
                        className={`relative flex flex-col justify-between p-6 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} ${theme.cardBorderHover} transition-all duration-200 hover:-translate-y-1 ${theme.cardGlow} group overflow-hidden shadow-lg`}
                      >
                        {/* Glowing Top Stripe */}
                        <div className={`absolute top-0 left-0 right-0 h-1.5 ${theme.topStripe}`} />

                        <div className="space-y-3.5 pt-1">
                          {/* Top Bar: Asset Tag, Category Badge & Governing Standard Org */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md font-mono font-black text-[11px] tracking-wider bg-black/60 border border-white/15 text-white shadow-sm">
                                {sim.assetTag}
                              </span>
                              <span
                                className={`text-[10px] font-mono font-bold uppercase tracking-wider ${theme.accentText} flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/40 border border-white/5`}
                              >
                                <CategoryIcon size={11} className="shrink-0" />
                                <span>{theme.badgeLabel}</span>
                              </span>
                            </div>

                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black ${theme.standardBadge}`}>
                              {sim.standardOrg}
                            </span>
                          </div>

                          {/* Header: Prominent Icon + BOLD Name */}
                          <div className="flex items-start gap-3 pt-0.5">
                            <div
                              className={`w-11 h-11 rounded-xl ${theme.accentBg} ${theme.accentBorder} flex items-center justify-center ${theme.accentText} shrink-0 border shadow-inner mt-0.5 group-hover:scale-105 transition-transform`}
                            >
                              <Icon size={22} className="stroke-[2.2]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-base sm:text-[17px] font-black text-white tracking-tight leading-snug group-hover:text-white drop-shadow-sm">
                                {sim.name}
                              </h3>
                              <p className="text-[11px] font-mono text-slate-300 font-semibold mt-0.5 line-clamp-1">
                                {sim.standard}
                              </p>
                            </div>
                          </div>

                          {/* Relevant Live Diagnostic Signal Box */}
                          <div
                            className={`p-2.5 rounded-xl border ${theme.signalBadge} flex items-center justify-between gap-2 shadow-inner backdrop-blur-sm`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="relative flex h-2.5 w-2.5 shrink-0">
                                <span
                                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme.dotColor}`}
                                />
                                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${theme.dotColor}`} />
                              </span>
                              <div className="min-w-0">
                                <div className="text-[9px] font-mono uppercase font-black tracking-wider opacity-85 truncate">
                                  SIGNAL: {sim.signalLabel}
                                </div>
                                <div className="text-xs font-mono font-black text-white tracking-tight truncate">
                                  {sim.signalTarget}
                                </div>
                              </div>
                            </div>
                            <SignalIcon size={16} className={`${theme.accentText} shrink-0 opacity-90`} />
                          </div>

                          {/* Description */}
                          <p className="text-xs text-slate-300 font-sans leading-relaxed line-clamp-2">
                            {sim.description}
                          </p>

                          {/* Key Calculation Outputs in Category-Colored Chips */}
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {sim.keyOutputs.slice(0, 3).map((output) => (
                              <span
                                key={output}
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${theme.outputChip} border font-medium`}
                              >
                                {output}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Bottom Actions & Deep Link */}
                        <div className="pt-4 mt-4 border-t border-white/10 space-y-2.5">
                          {/* Direct Link Tag Display */}
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 bg-black/60 px-2.5 py-1.5 rounded-lg border border-white/10">
                            <span className="truncate text-slate-400">
                              Link: <span className={`font-bold ${theme.linkAccent}`}>/#{sim.id}</span>
                            </span>
                            <span className="text-slate-400 text-[9px] shrink-0 font-mono">64-Bit Digital Twin</span>
                          </div>

                          {/* Buttons */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveRoute(sim.id)}
                              className={`w-full py-2.5 px-3 rounded-xl ${theme.launchBtn} text-xs font-mono font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95`}
                            >
                              <span>Launch</span>
                              <ArrowRight size={14} className="stroke-[2.5]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyLink(sim.id)}
                              className={`w-full py-2.5 px-3 rounded-xl border text-xs font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                                isCopied
                                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold'
                                  : `bg-[#0e1728]/80 hover:bg-[#14223a] ${theme.copyBtn}`
                              }`}
                              title={`Copy ${fullUrl} to clipboard`}
                            >
                              {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                              <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* 3. Footer Integration Callout Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0c182e] via-[#091120] to-[#0c182e] border border-sky-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-base font-bold text-white flex items-center justify-center md:justify-start gap-2">
              <GraduationCap size={18} className="text-amber-400" />
              <span>Need this embedded directly on livesimulators.com?</span>
            </h3>
            <p className="text-xs text-slate-300 font-sans max-w-xl">
              Each simulator accepts deep URL linking via hash (<code className="text-sky-300 font-mono">/#pump</code>) or query parameter (<code className="text-sky-300 font-mono">?sim=pump</code>). When linking from your main LiveSimulators portal, users are taken directly to the requested digital twin.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleCopyAllLinks('markdown')}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-sky-500/20 cursor-pointer"
            >
              {copiedAll ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              <span>{copiedAll ? 'All 11 Links Copied!' : 'Export All 11 Links'}</span>
            </button>
          </div>
        </div>
      </main>

      {/* LiveSimulators Universal Footer */}
      <LiveSimulatorsFooter />
    </div>
  );
};
