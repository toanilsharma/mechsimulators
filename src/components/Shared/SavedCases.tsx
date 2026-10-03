import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, Trash2, Download, Upload, Plus, Check, Clock, Tag } from 'lucide-react';

export interface SavedCase<T = any> {
  id: string;
  name: string;
  toolKey: string;
  timestamp: number;
  notes?: string;
  data: T;
}

export interface SavedCasesProps<T = any> {
  toolKey: string;
  toolName: string;
  currentData: T;
  onLoadCase: (data: T, name: string) => void;
  className?: string;
}

export const SavedCases = <T,>({
  toolKey,
  toolName,
  currentData,
  onLoadCase,
  className = '',
}: SavedCasesProps<T>) => {
  const [cases, setCases] = useState<SavedCase<T>[]>([]);
  const [newCaseName, setNewCaseName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const storageKey = `plant_sim_cases_${toolKey}`;

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setCases(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load saved cases from localStorage', e);
    }
  }, [storageKey]);

  // Persist to localStorage
  const persistCases = (updated: SavedCase<T>[]) => {
    setCases(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to persist cases', e);
    }
  };

  const handleSave = () => {
    const trimmed = newCaseName.trim() || `Case ${cases.length + 1} (${new Date().toLocaleDateString()})`;
    const newCase: SavedCase<T> = {
      id: `case_${Date.now()}`,
      name: trimmed,
      toolKey,
      timestamp: Date.now(),
      data: currentData,
    };

    const updated = [newCase, ...cases];
    persistCases(updated);
    setNewCaseName('');
    setIsSaving(false);
    setActiveCaseId(newCase.id);
    showFeedback(`Saved case "${trimmed}"`);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete saved case "${name}"?`)) {
      const updated = cases.filter((c) => c.id !== id);
      persistCases(updated);
      if (activeCaseId === id) setActiveCaseId(null);
      showFeedback(`Deleted "${name}"`);
    }
  };

  const handleLoad = (c: SavedCase<T>) => {
    onLoadCase(c.data, c.name);
    setActiveCaseId(c.id);
    showFeedback(`Loaded "${c.name}"`);
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cases, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${toolKey}_saved_cases_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          persistCases([...imported, ...cases]);
          showFeedback(`Imported ${imported.length} cases`);
        }
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`p-4 rounded-sm bg-[#161b22] border border-[#30363d] flex flex-col gap-3.5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[#30363d] pb-2.5">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-[#f27d26]" />
          <span className="text-xs font-mono font-bold uppercase text-white tracking-wider">
            Saved Engineering Cases ({cases.length})
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono">
          <button
            type="button"
            onClick={handleExportJSON}
            disabled={cases.length === 0}
            className="p-1 rounded-sm bg-[#0d1117] border border-[#30363d] text-[#8b949e] hover:text-white hover:border-[#f27d26] disabled:opacity-40"
            title="Export cases as JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <label className="p-1 rounded-sm bg-[#0d1117] border border-[#30363d] text-[#8b949e] hover:text-white hover:border-[#f27d26] cursor-pointer" title="Import cases from JSON">
            <Upload className="w-3.5 h-3.5" />
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>
      </div>

      {/* Save Current State Form */}
      {isSaving ? (
        <div className="flex items-center gap-2 p-2 bg-[#0d1117] rounded-sm border border-[#f27d26]">
          <input
            type="text"
            placeholder="Case name (e.g. Pump Rated Condition #2)..."
            value={newCaseName}
            onChange={(e) => setNewCaseName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
            className="flex-1 bg-transparent text-xs font-mono text-white outline-none"
          />
          <button
            type="button"
            onClick={handleSave}
            className="px-3 py-1 bg-[#f27d26] text-black font-mono font-bold text-xs rounded-sm hover:bg-[#ff8f3d]"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsSaving(false)}
            className="px-2 py-1 bg-[#21262d] text-[#8b949e] font-mono text-xs rounded-sm hover:text-white"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsSaving(true)}
          className="w-full py-2 px-3 rounded-sm bg-[#0d1117] border border-dashed border-[#30363d] hover:border-[#f27d26] text-[#f27d26] text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Save Current Operating Inputs
        </button>
      )}

      {/* Feedback message banner */}
      {feedbackMsg && (
        <div className="p-2 rounded-sm bg-[#3fb95015] border border-[#3fb95066] text-[#3fb950] text-xs font-mono flex items-center gap-1.5 animate-in fade-in duration-150">
          <Check className="w-3.5 h-3.5" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Case List */}
      <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
        {cases.length === 0 ? (
          <div className="text-center py-4 text-xs font-sans text-[#8b949e]">
            No saved cases yet. Save current parameters to easily reload or compare them later.
          </div>
        ) : (
          cases.map((c) => {
            const isActive = activeCaseId === c.id;
            return (
              <div
                key={c.id}
                className={`p-2.5 rounded-sm border flex items-center justify-between gap-2 transition-all ${
                  isActive
                    ? 'bg-[#f27d2615] border-[#f27d26]'
                    : 'bg-[#0d1117] border-[#30363d] hover:border-[#8b949e]'
                }`}
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white truncate">
                      {c.name}
                    </span>
                    {isActive && (
                      <span className="text-[9px] font-mono px-1 py-0.2 bg-[#f27d26] text-black font-bold rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#8b949e] mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(c.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleLoad(c)}
                    className="px-2.5 py-1 rounded-sm bg-[#161b22] border border-[#30363d] hover:border-[#f27d26] text-xs font-mono text-[#d1d5db] hover:text-[#f27d26] transition-colors"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id, c.name)}
                    className="p-1 rounded-sm bg-[#161b22] border border-[#30363d] hover:border-[#f85149] text-[#8b949e] hover:text-[#f85149] transition-colors"
                    title="Delete case"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
