import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { SimulatorWorkbenchProps } from './types';
import { WorkbenchLeftPanel } from './WorkbenchLeftPanel';
import { WorkbenchCenterPanel } from './WorkbenchCenterPanel';
import { WorkbenchRightPanel } from './WorkbenchRightPanel';
import { MobileBottomSheet } from './MobileBottomSheet';
import { UnitSystem, StatusLevel } from '../../types/common';
import { useApp } from '../../context/AppContext';
import { LiveSimulatorsFooter } from '../Footer/LiveSimulatorsFooter';

export function SimulatorWorkbench<
  TInputs extends Record<string, any>,
  TOutputs extends Record<string, any>
>({
  title,
  subtitle,
  scenarios,
  defaultInputs,
  inputSchema,
  resultSchema,
  VisualComponent,
  calculateFn,
  disclaimerText,
  customControls,
  customResults,
  chartComponent,
  chartTabLabel,
  visualTabLabel,
  simulatorType,
  simulatorId,
  buildReportData,
  unitSystem: externalUnitSystem = 'metric',
  onUnitSystemChange: externalOnUnitSystemChange,
  onAuditRequested,
  onReportRequested,
  onOpenInfo,
  telemetryItems,
}: SimulatorWorkbenchProps<TInputs, TOutputs>) {
  // 1. Core State: Inputs & Scenario Selection
  const initialInputs = useMemo(() => {
    if (defaultInputs) return defaultInputs;
    if (scenarios && scenarios.length > 0) return scenarios[0].inputs;
    return {} as TInputs;
  }, [defaultInputs, scenarios]);

  const [inputs, setInputs] = useState<TInputs>(initialInputs);
  const [activeScenarioId, setActiveScenarioId] = useState<string>(
    scenarios && scenarios.length > 0 ? scenarios[0].id : ''
  );

  const { injectedSimulatorInputs, clearInjectedInputs, registerReportProvider } = useApp();

  // Listen for external educational input injections (e.g. from Diagnostic Wizard or Case Studies)
  useEffect(() => {
    if (injectedSimulatorInputs && Object.keys(injectedSimulatorInputs).length > 0) {
      setInputs((prev) => ({
        ...prev,
        ...injectedSimulatorInputs,
      }));
      setActiveScenarioId('');
      clearInjectedInputs();
    }
  }, [injectedSimulatorInputs, clearInjectedInputs]);

  // 2. Local unit system state if not externally managed
  const [internalUnitSystem, setInternalUnitSystem] = useState<UnitSystem>(externalUnitSystem);
  const currentUnitSystem = externalOnUnitSystemChange ? externalUnitSystem : internalUnitSystem;
  const handleUnitSystemChange = (u: UnitSystem) => {
    if (externalOnUnitSystemChange) {
      externalOnUnitSystemChange(u);
    } else {
      setInternalUnitSystem(u);
    }
  };

  // 3. Animation / Physics running state
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const handleToggleRunning = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  // 4. Mobile Bottom Sheet State
  const [mobileTab, setMobileTab] = useState<'inputs' | 'results'>('inputs');

  // 5. Physics / Calculations Calculation
  const outputs: TOutputs = useMemo(() => {
    if (calculateFn) return calculateFn(inputs);
    return {} as TOutputs;
  }, [calculateFn, inputs]);

  // Live calculation provider for audit trail and printable engineering report
  // Uses ref-based retrieval so report generation does NOT trigger re-render cascades
  const reportGeneratorRef = useRef<() => any>(() => null);

  reportGeneratorRef.current = () => {
    if (!buildReportData || !simulatorId) return null;
    return {
      ...buildReportData(inputs, outputs, currentUnitSystem),
      route: simulatorId as any,
    };
  };

  useEffect(() => {
    if (registerReportProvider) {
      return registerReportProvider(() => reportGeneratorRef.current());
    }
  }, [registerReportProvider]);

  // 6. Scenario selection handler
  const handleSelectScenario = (id: string) => {
    setActiveScenarioId(id);
    const found = scenarios.find((s) => s.id === id);
    if (found) {
      setInputs({ ...found.inputs });
    }
  };

  // 7. Inputs modification handler
  const handleInputsChange = (patch: Partial<TInputs> | TInputs) => {
    setInputs((prev) => ({
      ...prev,
      ...patch,
    }));
    setActiveScenarioId('');
  };

  // 8. Reset handler
  const handleReset = () => {
    setInputs({ ...initialInputs });
    setActiveScenarioId(scenarios && scenarios.length > 0 ? scenarios[0].id : '');
  };

  // 9. Overall Status extraction
  const status = useMemo(() => {
    if (resultSchema?.statusGetter) {
      return resultSchema.statusGetter(outputs, inputs);
    }
    // Fallback if outputs has a status property
    if ((outputs as any)?.status?.level) {
      return (outputs as any).status as { level: StatusLevel; label: string; message: string };
    }
    return {
      level: 'safe' as StatusLevel,
      label: 'Optimal',
      message: 'Operating within standard tolerances',
    };
  }, [resultSchema, outputs, inputs]);

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId);

  return (
    <div className="w-full min-h-full bg-[#080b0f] flex flex-col md:grid md:grid-cols-[minmax(320px,350px)_1fr_minmax(340px,370px)] md:h-[calc(100dvh-54px)] md:overflow-hidden relative">
      {/* ========================================================
          1. DESKTOP LEFT PANEL: INPUTS & PARAMETERS (320px - 360px)
          ======================================================== */}
      <aside className="hidden md:flex h-full min-w-0 border-r border-[#30363d] bg-[#0d1117] overflow-hidden">
        <WorkbenchLeftPanel
          title="Operating Parameters"
          scenarios={scenarios}
          activeScenarioId={activeScenarioId}
          onSelectScenario={handleSelectScenario}
          inputs={inputs}
          onInputsChange={handleInputsChange}
          inputSchema={inputSchema}
          customControls={customControls}
          unitSystem={currentUnitSystem}
          onUnitSystemChange={handleUnitSystemChange}
          isRunning={isRunning}
          onToggleRunning={handleToggleRunning}
          onReset={handleReset}
        />
      </aside>

      {/* ========================================================
          2. CENTER PANEL: HERO PHYSICS VISUALIZER (FLEXIBLE MAX SPACE)
          ======================================================== */}
      <main className="flex-1 min-w-0 relative flex flex-col md:h-full md:overflow-hidden bg-[#080b0f]">
        <WorkbenchCenterPanel
          title={title}
          subtitle={subtitle}
          VisualComponent={VisualComponent}
          inputs={inputs}
          outputs={outputs}
          isRunning={isRunning}
          unitSystem={currentUnitSystem}
          chartComponent={chartComponent}
          chartTabLabel={chartTabLabel}
          visualTabLabel={visualTabLabel}
          simulatorType={simulatorType}
          simulatorId={simulatorId}
          telemetryItems={telemetryItems}
          status={status}
          scenarios={scenarios}
          activeScenarioId={activeScenarioId}
          onSelectScenario={handleSelectScenario}
          disclaimerText={disclaimerText}
          onOpenInfo={onOpenInfo}
          onToggleRunning={handleToggleRunning}
          onReset={handleReset}
          onAuditRequested={() => {
            if (onAuditRequested) {
              onAuditRequested(outputs.auditTrail || []);
            }
          }}
          onReportRequested={() => {
            if (onReportRequested && buildReportData && simulatorId) {
              onReportRequested({
                ...buildReportData(inputs, outputs, currentUnitSystem),
                route: simulatorId as any,
              });
            }
          }}
        />
      </main>

      {/* ========================================================
          3. DESKTOP RIGHT PANEL: LIVE SCADA RESULTS (340px - 380px)
          ======================================================== */}
      <aside className="hidden md:flex h-full min-w-0 border-l border-[#30363d] bg-[#0d1117] overflow-hidden">
        <WorkbenchRightPanel
          outputs={outputs}
          inputs={inputs}
          unitSystem={currentUnitSystem}
          resultSchema={resultSchema}
          customResults={customResults}
          status={status}
          simulatorId={simulatorId}
        />
      </aside>

      {/* ========================================================
          4. MOBILE INLINE SCROLLABLE WORKBENCH & EXPLORATION
          Enables mobile visitors to scroll down naturally and explore
          Operating Parameters, SCADA Results, and Department Footer.
          ======================================================== */}
      <div className="md:hidden flex flex-col gap-4 p-3 bg-[#080b0f] pb-24 border-t border-[#30363d]">
        <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>Mobile Workbench &bull; Scroll to Inspect Controls &amp; SCADA Results</span>
        </div>

        {/* Mobile Inline Left Panel: Operating Parameters */}
        <div className="rounded-xl border border-[#30363d] bg-[#0d1117] overflow-hidden shadow-2xl">
          <WorkbenchLeftPanel
            title="Operating Parameters"
            scenarios={scenarios}
            activeScenarioId={activeScenarioId}
            onSelectScenario={handleSelectScenario}
            inputs={inputs}
            onInputsChange={handleInputsChange}
            inputSchema={inputSchema}
            customControls={customControls}
            unitSystem={currentUnitSystem}
            onUnitSystemChange={handleUnitSystemChange}
            isRunning={isRunning}
            onToggleRunning={handleToggleRunning}
            onReset={handleReset}
          />
        </div>

        {/* Mobile Inline Right Panel: SCADA Results & Diagnostics */}
        <div className="rounded-xl border border-[#30363d] bg-[#0d1117] overflow-hidden shadow-2xl">
          <WorkbenchRightPanel
            outputs={outputs}
            inputs={inputs}
            unitSystem={currentUnitSystem}
            resultSchema={resultSchema}
            customResults={customResults}
            status={status}
            simulatorId={simulatorId}
          />
        </div>

        {/* Explore Full LiveSimulators Footer on Mobile */}
        <div className="pt-2">
          <LiveSimulatorsFooter />
        </div>
      </div>

      {/* ========================================================
          5. MOBILE LAYOUT: SWIPEABLE BOTTOM SHEET (Quick Access)
          ======================================================== */}
      <MobileBottomSheet
        status={status}
        activeTab={mobileTab}
        onTabChange={setMobileTab}
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        onSelectScenario={handleSelectScenario}
        inputsContent={
          <WorkbenchLeftPanel
            title="Operating Parameters"
            scenarios={scenarios}
            activeScenarioId={activeScenarioId}
            onSelectScenario={handleSelectScenario}
            inputs={inputs}
            onInputsChange={handleInputsChange}
            inputSchema={inputSchema}
            customControls={customControls}
            unitSystem={currentUnitSystem}
            onUnitSystemChange={handleUnitSystemChange}
            isRunning={isRunning}
            onToggleRunning={handleToggleRunning}
            onReset={handleReset}
          />
        }
        resultsContent={
          <WorkbenchRightPanel
            outputs={outputs}
            inputs={inputs}
            unitSystem={currentUnitSystem}
            resultSchema={resultSchema}
            customResults={customResults}
            status={status}
          />
        }
      />
    </div>
  );
}
