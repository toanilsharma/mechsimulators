import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Download,
  Share2,
  Plus,
  Trash2,
  Check,
  FileText,
  Clock,
  GitBranch,
  Layers,
  Wrench,
  ChevronRight,
  ExternalLink,
  Target,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  RcaInvestigation,
  RCA_PRESET_INVESTIGATIONS,
  WhyNode,
  FishboneItem,
  FishboneCategory,
  TimelineEvent,
  CapaItem,
} from '../../physics/rcaDiagnosticMath';
import { STANDARDS_SAFE_DISCLAIMER_SHORT } from '../../utils/standardsSafeHarbor';

interface RcaStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  preloadedInvestigation?: RcaInvestigation | null;
}

export const RcaStudioModal: React.FC<RcaStudioModalProps> = ({
  isOpen,
  onClose,
  preloadedInvestigation,
}) => {
  const { navigateToSimulator } = useApp();

  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('pump-cavitation');
  const [activeTab, setActiveTab] = useState<'5whys' | 'fishbone' | 'timeline' | 'capa'>('5whys');

  // Active investigation state
  const [investigation, setInvestigation] = useState<RcaInvestigation>(() => {
    return preloadedInvestigation || RCA_PRESET_INVESTIGATIONS['pump-cavitation'];
  });

  // Keep state updated if preloadedInvestigation changes
  React.useEffect(() => {
    if (preloadedInvestigation) {
      setInvestigation(preloadedInvestigation);
    }
  }, [preloadedInvestigation]);

  const handleSelectPreset = (key: string) => {
    setSelectedPresetKey(key);
    if (RCA_PRESET_INVESTIGATIONS[key]) {
      setInvestigation(JSON.parse(JSON.stringify(RCA_PRESET_INVESTIGATIONS[key])));
    }
  };

  // Add Why Node
  const handleAddWhyNode = () => {
    setInvestigation((prev) => {
      const nextOrder = prev.whyNodes.length + 1;
      const newNode: WhyNode = {
        id: `w-${Date.now()}`,
        order: nextOrder,
        question: `Why did the preceding condition occur (Level ${nextOrder})?`,
        answer: 'Pending engineering investigation / metallurgical examination.',
        isRootCause: false,
        verificationEvidence: 'Field maintenance inspection or SCADA log verification pending.',
      };
      return {
        ...prev,
        whyNodes: [...prev.whyNodes, newNode],
      };
    });
  };

  // Toggle Root Cause on Why Node
  const handleToggleRootCause = (nodeId: string) => {
    setInvestigation((prev) => ({
      ...prev,
      whyNodes: prev.whyNodes.map((n) =>
        n.id === nodeId ? { ...n, isRootCause: !n.isRootCause } : n
      ),
    }));
  };

  // Update Why Node text
  const handleUpdateWhy = (nodeId: string, field: 'question' | 'answer' | 'verificationEvidence', value: string) => {
    setInvestigation((prev) => ({
      ...prev,
      whyNodes: prev.whyNodes.map((n) =>
        n.id === nodeId ? { ...n, [field]: value } : n
      ),
    }));
  };

  // Delete Why Node
  const handleDeleteWhy = (nodeId: string) => {
    setInvestigation((prev) => ({
      ...prev,
      whyNodes: prev.whyNodes.filter((n) => n.id !== nodeId),
    }));
  };

  // Add Fishbone Cause
  const handleAddFishboneItem = (category: FishboneCategory) => {
    setInvestigation((prev) => {
      const newItem: FishboneItem = {
        id: `fb-${Date.now()}`,
        category,
        causeText: 'New contributing factor or hypothesis',
        probability: 'medium',
        isRootCause: false,
      };
      return {
        ...prev,
        fishboneItems: [...prev.fishboneItems, newItem],
      };
    });
  };

  // Toggle Fishbone Root Cause
  const handleToggleFishboneRootCause = (id: string) => {
    setInvestigation((prev) => ({
      ...prev,
      fishboneItems: prev.fishboneItems.map((item) =>
        item.id === id ? { ...item, isRootCause: !item.isRootCause } : item
      ),
    }));
  };

  // Delete Fishbone Item
  const handleDeleteFishboneItem = (id: string) => {
    setInvestigation((prev) => ({
      ...prev,
      fishboneItems: prev.fishboneItems.filter((i) => i.id !== id),
    }));
  };

  // Add CAPA item
  const handleAddCapaItem = () => {
    setInvestigation((prev) => {
      const newCapa: CapaItem = {
        id: `c-${Date.now()}`,
        actionTitle: 'New corrective or preventive mitigation action',
        type: 'preventive',
        assignee: 'Reliability Engineer',
        targetDays: 14,
        verificationCriteria: 'Operational log audit and vibration baseline acceptance test.',
        status: 'open',
      };
      return {
        ...prev,
        capaItems: [...prev.capaItems, newCapa],
      };
    });
  };

  // Toggle CAPA Status
  const handleToggleCapaStatus = (id: string) => {
    setInvestigation((prev) => ({
      ...prev,
      capaItems: prev.capaItems.map((c) => {
        if (c.id !== id) return c;
        const nextStatus: CapaItem['status'] =
          c.status === 'open' ? 'in-progress' : c.status === 'in-progress' ? 'verified' : 'open';
        return { ...c, status: nextStatus };
      }),
    }));
  };

  // Export RCA dossier as Markdown / text
  const handleExportDossier = () => {
    const reportText = `# FORMAL ROOT CAUSE ANALYSIS (RCA) INVESTIGATION DOSSIER
Asset Tag: ${investigation.assetTag}
Equipment Title: ${investigation.title}
Incident Date: ${investigation.incidentDate}
Severity Classification: ${investigation.severity}
Governing Standard: ISO 55000 / API 689 / EPRI NP-6096 Rotating Equipment RCA

## 1. Executive Incident Summary
${investigation.incidentSummary}
Primary Symptom: ${investigation.primarySymptom}

## 2. 5-Whys Recursive Causality Chain
${investigation.whyNodes
  .map(
    (n) =>
      `Level ${n.order}: ${n.question}\n-> Answer: ${n.answer}${
        n.isRootCause ? ' [IDENTIFIED ROOT CAUSE]' : ''
      }\n   Evidence: ${n.verificationEvidence}\n`
  )
  .join('\n')}

## 3. Ishikawa (Fishbone) Contributing Factors
${investigation.fishboneItems
  .map(
    (f) =>
      `- [${f.category.toUpperCase()}] ${f.causeText} (Probability: ${f.probability})${
        f.isRootCause ? ' *ROOT CAUSE*' : ''
      }`
  )
  .join('\n')}

## 4. Chronological Sequence of Events
${investigation.timelineEvents
  .map(
    (t) =>
      `[T ${t.relativeMinutes >= 0 ? '+' : ''}${t.relativeMinutes} min] ${t.label}: ${
        t.description
      } (Telemetry: ${t.telemetryNote})`
  )
  .join('\n')}

## 5. Corrective & Preventive Action (CAPA) Register
${investigation.capaItems
  .map(
    (c) =>
      `- [${c.status.toUpperCase()}] (${c.type.toUpperCase()}) ${c.actionTitle} | Assignee: ${
        c.assignee
      } | Due: ${c.targetDays} days | Verification: ${c.verificationCriteria}`
  )
  .join('\n')}

---
${STANDARDS_SAFE_DISCLAIMER_SHORT}
Generated by Mechanical Lab Pro - Reliability & Forensic Studio.
`;

    const blob = new Blob([reportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RCA_${investigation.assetTag}_${investigation.incidentDate}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      id="rca-studio-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div
        id="rca-studio-modal-container"
        className="relative flex flex-col w-full max-w-6xl max-h-[92vh] bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden text-[#c9d1d9]"
      >
        {/* Modal Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#161b22] border-b border-[#30363d] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-400">
              <Target size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-rose-950/50 text-rose-400 border border-rose-500/30">
                  Pillar 10 • RCA & Diagnostics
                </span>
                <span className="text-[10px] font-mono text-[#8b949e]">
                  ISO 55000 / API 689 / EPRI NP-6096
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Root Cause Analysis (RCA) & 5-Whys / Fishbone Failure Studio
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Preset Selector */}
            <select
              id="rca-preset-selector"
              value={selectedPresetKey}
              onChange={(e) => handleSelectPreset(e.target.value)}
              aria-label="Select forensic case study preset"
              className="px-2.5 py-1 text-xs font-mono bg-[#0d1117] border border-[#30363d] rounded text-white hover:border-[#58a6ff] transition-colors focus:outline-none focus:ring-1 focus:ring-[#58a6ff]"
            >
              <option value="pump-cavitation">Case 1: Pump Cavitation & Impeller Pitting</option>
              <option value="compressor-surge">Case 2: Compressor Surge & Thrust Wipe</option>
              <option value="gearbox-micropitting">Case 3: Gearbox Tooth Pitting & Lube Starvation</option>
            </select>

            <button
              id="btn-export-rca-dossier"
              type="button"
              onClick={handleExportDossier}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold text-white bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded transition-colors"
            >
              <Download size={13} className="text-[#58a6ff]" />
              <span>Export Dossier</span>
            </button>

            <button
              id="btn-close-rca-modal"
              type="button"
              onClick={onClose}
              className="p-1 text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Incident Summary Banner */}
        <div className="px-5 py-2.5 bg-[#161b22]/50 border-b border-[#30363d] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-[#8b949e]">Asset:</span>
            <span className="font-bold text-white bg-[#21262d] px-2 py-0.5 rounded border border-[#30363d]">
              {investigation.assetTag}
            </span>
            <span className="text-white font-semibold">{investigation.title}</span>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-2 py-0.5 rounded font-bold border ${
                investigation.severity.includes('Level 1')
                  ? 'bg-rose-950/60 text-rose-400 border-rose-500/40'
                  : 'bg-amber-950/60 text-amber-400 border-amber-500/40'
              }`}
            >
              {investigation.severity}
            </span>
            <button
              type="button"
              onClick={() => {
                navigateToSimulator(investigation.simulatorId);
                onClose();
              }}
              className="flex items-center gap-1 text-[#58a6ff] hover:underline"
            >
              <span>Launch {investigation.simulatorId.toUpperCase()} Digital Twin</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 border-b border-[#30363d] bg-[#0d1117] shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('5whys')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium border-b-2 transition-colors ${
              activeTab === '5whys'
                ? 'border-rose-400 text-white font-bold bg-[#161b22]/60'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <GitBranch size={13} className="text-rose-400" />
            <span>5-Whys Causality Chain</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#21262d] text-[#8b949e]">
              {investigation.whyNodes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fishbone')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium border-b-2 transition-colors ${
              activeTab === 'fishbone'
                ? 'border-rose-400 text-white font-bold bg-[#161b22]/60'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <Layers size={13} className="text-rose-400" />
            <span>6M Ishikawa Fishbone Diagram</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#21262d] text-[#8b949e]">
              {investigation.fishboneItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium border-b-2 transition-colors ${
              activeTab === 'timeline'
                ? 'border-rose-400 text-white font-bold bg-[#161b22]/60'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <Clock size={13} className="text-rose-400" />
            <span>Sequence of Events Timeline</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#21262d] text-[#8b949e]">
              {investigation.timelineEvents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('capa')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium border-b-2 transition-colors ${
              activeTab === 'capa'
                ? 'border-rose-400 text-white font-bold bg-[#161b22]/60'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <Wrench size={13} className="text-rose-400" />
            <span>CAPA Corrective Action Matrix</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#21262d] text-[#8b949e]">
              {investigation.capaItems.length}
            </span>
          </button>
        </div>

        {/* Modal Body Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: 5-WHYS */}
          {activeTab === '5whys' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Recursive 5-Whys Root Cause Derivation Tree</span>
                  </h3>
                  <p className="text-xs text-[#8b949e] mt-0.5">
                    Drill down sequentially from visible telemetry alarms to underlying systemic,
                    procedural, and design root causes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddWhyNode}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold text-rose-400 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/40 rounded transition-colors"
                >
                  <Plus size={13} />
                  <span>Add Next Why Level</span>
                </button>
              </div>

              {/* Problem Statement Card */}
              <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-lg">
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold block">
                  Incident Symptom / Defect Event
                </span>
                <p className="text-sm font-mono text-white font-bold mt-1">
                  {investigation.primarySymptom}
                </p>
              </div>

              {/* 5-Whys Nodes Vertical Chain */}
              <div className="space-y-3 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-[#30363d]">
                {investigation.whyNodes.map((node, index) => (
                  <div
                    key={node.id}
                    className={`relative pl-12 transition-all ${
                      node.isRootCause ? 'scale-[1.01]' : ''
                    }`}
                  >
                    {/* Node Number Circle */}
                    <div
                      className={`absolute left-3.5 top-3.5 w-6 h-6 -translate-x-1/2 rounded-full border-2 flex items-center justify-center font-mono text-xs font-bold z-10 ${
                        node.isRootCause
                          ? 'bg-rose-500 border-white text-black shadow-lg shadow-rose-500/50'
                          : 'bg-[#161b22] border-[#58a6ff] text-[#58a6ff]'
                      }`}
                    >
                      {node.order}
                    </div>

                    <div
                      className={`p-3.5 rounded-lg border transition-all ${
                        node.isRootCause
                          ? 'bg-rose-950/40 border-rose-500/60 shadow-lg shadow-rose-950/30'
                          : 'bg-[#161b22] border-[#30363d] hover:border-[#58a6ff]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#8b949e] uppercase">
                            Why #{node.order}
                          </span>
                          {node.isRootCause && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500 text-black uppercase tracking-wider animate-pulse">
                              Root Cause Identified
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleRootCause(node.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                              node.isRootCause
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                                : 'bg-[#21262d] text-[#8b949e] hover:text-white'
                            }`}
                          >
                            {node.isRootCause ? 'Unmark Root Cause' : 'Mark Root Cause'}
                          </button>
                          {investigation.whyNodes.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteWhy(node.id)}
                              className="p-1 text-[#8b949e] hover:text-rose-400 rounded transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Question */}
                      <div className="mb-2">
                        <label className="text-[10px] font-mono text-[#8b949e] uppercase block mb-1">
                          Question / Inquiry:
                        </label>
                        <input
                          type="text"
                          value={node.question}
                          onChange={(e) => handleUpdateWhy(node.id, 'question', e.target.value)}
                          className="w-full px-2.5 py-1 text-xs font-mono bg-[#0d1117] border border-[#30363d] rounded text-white focus:border-[#58a6ff] focus:outline-none"
                        />
                      </div>

                      {/* Answer */}
                      <div className="mb-2">
                        <label className="text-[10px] font-mono text-[#8b949e] uppercase block mb-1">
                          Engineering Answer / Finding:
                        </label>
                        <textarea
                          rows={2}
                          value={node.answer}
                          onChange={(e) => handleUpdateWhy(node.id, 'answer', e.target.value)}
                          className="w-full px-2.5 py-1 text-xs font-mono bg-[#0d1117] border border-[#30363d] rounded text-[#e6edf3] focus:border-[#58a6ff] focus:outline-none"
                        />
                      </div>

                      {/* Verification Evidence */}
                      <div className="flex items-start gap-1.5 p-2 bg-[#0d1117]/80 rounded border border-[#30363d]/60 text-[11px] font-mono">
                        <ShieldCheck size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-[#8b949e] uppercase text-[9px] block">
                            Supporting Physical Evidence:
                          </span>
                          <input
                            type="text"
                            value={node.verificationEvidence}
                            onChange={(e) =>
                              handleUpdateWhy(node.id, 'verificationEvidence', e.target.value)
                            }
                            className="w-full bg-transparent text-emerald-300 border-none p-0 focus:outline-none focus:ring-0 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: FISHBONE (ISHIKAWA 6M) */}
          {activeTab === 'fishbone' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>6M Ishikawa / Fishbone Cause-and-Effect Matrix</span>
                  </h3>
                  <p className="text-xs text-[#8b949e] mt-0.5">
                    Categorized decomposition across Machine, Method, Material, Measurement,
                    Manpower, and Environment (Milieu).
                  </p>
                </div>
              </div>

              {/* 6M Category Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(
                  [
                    { key: 'machine', label: 'Machine (Equipment & Mechanics)', color: 'text-blue-400' },
                    { key: 'method', label: 'Method (Procedures & SOPs)', color: 'text-emerald-400' },
                    { key: 'material', label: 'Material (Lubricants & Metallurgy)', color: 'text-amber-400' },
                    { key: 'measurement', label: 'Measurement (Transmitters & Scada)', color: 'text-purple-400' },
                    { key: 'manpower', label: 'Manpower (Training & Operations)', color: 'text-cyan-400' },
                    { key: 'environment', label: 'Milieu / Environment (Ambient & Pipe Loads)', color: 'text-rose-400' },
                  ] as const
                ).map((cat) => {
                  const items = investigation.fishboneItems.filter((i) => i.category === cat.key);
                  return (
                    <div
                      key={cat.key}
                      className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg flex flex-col justify-between hover:border-[#58a6ff]/40 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#30363d]">
                          <span className={`text-xs font-mono font-bold ${cat.color}`}>
                            {cat.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddFishboneItem(cat.key)}
                            className="p-1 text-[#8b949e] hover:text-white rounded hover:bg-[#21262d] transition-colors"
                            title="Add contributing cause"
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <div className="space-y-2">
                          {items.length === 0 ? (
                            <p className="text-[11px] font-mono text-[#8b949e] italic py-1">
                              No contributing factors logged.
                            </p>
                          ) : (
                            items.map((item) => (
                              <div
                                key={item.id}
                                className={`p-2 rounded border text-xs font-mono flex flex-col gap-1.5 ${
                                  item.isRootCause
                                    ? 'bg-rose-950/40 border-rose-500 text-white shadow-sm'
                                    : 'bg-[#0d1117] border-[#30363d] text-[#c9d1d9]'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <span className="font-medium leading-tight flex-1">
                                    {item.causeText}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteFishboneItem(item.id)}
                                    className="text-[#8b949e] hover:text-rose-400 p-0.5 shrink-0"
                                  >
                                    <X size={11} />
                                  </button>
                                </div>

                                <div className="flex items-center justify-between pt-1 border-t border-[#30363d]/50">
                                  <span
                                    className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${
                                      item.probability === 'high'
                                        ? 'bg-rose-950 text-rose-300'
                                        : item.probability === 'medium'
                                        ? 'bg-amber-950 text-amber-300'
                                        : 'bg-[#21262d] text-[#8b949e]'
                                    }`}
                                  >
                                    {item.probability} Prob.
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleFishboneRootCause(item.id)}
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                      item.isRootCause
                                        ? 'bg-rose-500 text-black'
                                        : 'bg-[#21262d] text-[#8b949e] hover:text-white'
                                    }`}
                                  >
                                    {item.isRootCause ? 'Root Cause' : 'Mark Root'}
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg">
                <h3 className="text-sm font-bold text-white">
                  Chronological Sequence of Events (SOE) Reconstruction
                </h3>
                <p className="text-xs text-[#8b949e] mt-0.5">
                  High-resolution chronological log leading up to the trip event and post-incident
                  isolation.
                </p>
              </div>

              <div className="space-y-3 relative before:absolute before:left-7 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#30363d]">
                {investigation.timelineEvents.map((evt) => (
                  <div key={evt.id} className="relative pl-14">
                    <div
                      className={`absolute left-5 top-3 w-4 h-4 -translate-x-1/2 rounded-full border-2 z-10 ${
                        evt.severity === 'critical'
                          ? 'bg-rose-500 border-white animate-ping'
                          : evt.severity === 'warning'
                          ? 'bg-amber-400 border-[#161b22]'
                          : 'bg-emerald-400 border-[#161b22]'
                      }`}
                    />
                    <div
                      className={`absolute left-5 top-3 w-4 h-4 -translate-x-1/2 rounded-full border-2 z-10 ${
                        evt.severity === 'critical'
                          ? 'bg-rose-500 border-white'
                          : evt.severity === 'warning'
                          ? 'bg-amber-400 border-[#161b22]'
                          : 'bg-emerald-400 border-[#161b22]'
                      }`}
                    />

                    <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg text-xs font-mono">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{evt.label}</span>
                          <span className="px-2 py-0.5 bg-[#21262d] rounded text-[#79c0ff] font-bold">
                            T {evt.relativeMinutes >= 0 ? '+' : ''}
                            {evt.relativeMinutes} min
                          </span>
                        </div>
                        <span
                          className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${
                            evt.severity === 'critical'
                              ? 'bg-rose-950 text-rose-300'
                              : evt.severity === 'warning'
                              ? 'bg-amber-950 text-amber-300'
                              : 'bg-emerald-950 text-emerald-300'
                          }`}
                        >
                          {evt.severity}
                        </span>
                      </div>
                      <p className="text-[#c9d1d9] leading-relaxed mb-2">{evt.description}</p>
                      <div className="p-1.5 bg-[#0d1117] rounded border border-[#30363d]/60 text-[11px] text-[#8b949e]">
                        <b className="text-white">SCADA Record: </b>
                        {evt.telemetryNote}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CAPA (CORRECTIVE AND PREVENTIVE ACTIONS) */}
          {activeTab === 'capa' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Corrective and Preventive Actions (CAPA) Register</span>
                  </h3>
                  <p className="text-xs text-[#8b949e] mt-0.5">
                    Close out identified failure mechanisms with auditable design, procedural, and
                    maintenance work orders.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCapaItem}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 rounded transition-colors"
                >
                  <Plus size={13} />
                  <span>Add CAPA Action</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {investigation.capaItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg hover:border-[#58a6ff]/40 transition-colors text-xs font-mono"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            item.type === 'corrective'
                              ? 'bg-rose-950 text-rose-300 border border-rose-700/50'
                              : 'bg-blue-950 text-blue-300 border border-blue-700/50'
                          }`}
                        >
                          {item.type}
                        </span>
                        <span className="font-bold text-white text-sm">{item.actionTitle}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleCapaStatus(item.id)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                            item.status === 'verified'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : item.status === 'in-progress'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {item.status === 'verified' && <Check size={11} />}
                          <span>Status: {item.status}</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2 bg-[#0d1117] rounded border border-[#30363d]/60 text-[11px]">
                      <div>
                        <span className="text-[#8b949e] uppercase block text-[9px]">Assignee:</span>
                        <span className="text-white font-medium">{item.assignee}</span>
                      </div>
                      <div>
                        <span className="text-[#8b949e] uppercase block text-[9px]">Target Window:</span>
                        <span className="text-cyan-300 font-bold">{item.targetDays} Days</span>
                      </div>
                      <div>
                        <span className="text-[#8b949e] uppercase block text-[9px]">
                          Acceptance Verification:
                        </span>
                        <span className="text-emerald-300">{item.verificationCriteria}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Safe-Harbor Footer */}
        <div className="px-5 py-2.5 bg-[#161b22] border-t border-[#30363d] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#8b949e] shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
            <span>{STANDARDS_SAFE_DISCLAIMER_SHORT}</span>
          </div>
          <span>ISO 55000 / API 689 Compliant Engineering Record</span>
        </div>
      </div>
    </div>
  );
};
