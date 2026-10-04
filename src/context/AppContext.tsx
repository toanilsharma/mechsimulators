import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo, ReactNode } from 'react';
import { RouteId, UnitSystem, ThemeMode, SimulatorId, AuditStep, StatusAssessment } from '../types/common';

export interface ActiveSimulationReport {
  route: RouteId;
  title: string;
  subtitle: string;
  standards: string[];
  status: StatusAssessment;
  auditTrail: AuditStep[];
  inputSummary: Array<{ label: string; value: string }>;
  keyResults: Array<{ label: string; value: string; status?: 'safe' | 'warning' | 'critical' }>;
}

interface AppContextType {
  activeRoute: RouteId;
  setActiveRoute: (route: RouteId) => void;
  navigateToSimulator: (simId: SimulatorId) => void;
  unitSystem: UnitSystem;
  setUnitSystem: (units: UnitSystem) => void;
  toggleUnitSystem: () => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isDisclaimerAccepted: boolean;
  acceptDisclaimer: () => void;
  isDisclaimerModalOpen: boolean;
  setIsDisclaimerModalOpen: (open: boolean) => void;
  isAuditModalOpen: boolean;
  setIsAuditModalOpen: (open: boolean) => void;
  isReportModalOpen: boolean;
  setIsReportModalOpen: (open: boolean) => void;
  isLearningMode: boolean;
  setIsLearningMode: (mode: boolean) => void;
  toggleLearningMode: () => void;
  isDiagnosticModalOpen: boolean;
  setIsDiagnosticModalOpen: (open: boolean) => void;
  isCaseStudiesModalOpen: boolean;
  setIsCaseStudiesModalOpen: (open: boolean) => void;
  isReliabilityStudioOpen: boolean;
  setIsReliabilityStudioOpen: (open: boolean) => void;
  isMachineryTrainStudioOpen: boolean;
  setIsMachineryTrainStudioOpen: (open: boolean) => void;
  isSpectralLabOpen: boolean;
  setIsSpectralLabOpen: (open: boolean) => void;
  isTransientModalOpen: boolean;
  setIsTransientModalOpen: (open: boolean) => void;
  isKineticCutawayOpen: boolean;
  setIsKineticCutawayOpen: (open: boolean) => void;
  isFleetMatrixOpen: boolean;
  setIsFleetMatrixOpen: (open: boolean) => void;
  isRcaStudioOpen: boolean;
  setIsRcaStudioOpen: (open: boolean) => void;
  rcaPreloadCase: any | null;
  setRcaPreloadCase: (investigation: any | null) => void;
  isTribologyLabOpen: boolean;
  setIsTribologyLabOpen: (open: boolean) => void;
  isMonteCarloOpen: boolean;
  setIsMonteCarloOpen: (open: boolean) => void;
  isExergyCarbonOpen: boolean;
  setIsExergyCarbonOpen: (open: boolean) => void;
  isComparatorOpen: boolean;
  setIsComparatorOpen: (open: boolean) => void;
  comparatorPair: [SimulatorId, SimulatorId];
  setComparatorPair: (pair: [SimulatorId, SimulatorId]) => void;
  openComparatorWith: (a?: SimulatorId, b?: SimulatorId) => void;
  injectedSimulatorInputs: Record<string, any> | null;
  injectSimulatorInputs: (inputs: Record<string, any>) => void;
  clearInjectedInputs: () => void;
  activeSimulationReport: ActiveSimulationReport | null;
  setActiveSimulationReport: (report: ActiveSimulationReport | null) => void;
  registerReportProvider: (provider: () => ActiveSimulationReport | null) => () => void;
  getLiveSimulationReport: () => ActiveSimulationReport | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const VALID_ROUTES: RouteId[] = [
  'home',
  'portal',
  'pump',
  'compressor',
  'recip',
  'gearbox',
  'turbine',
  'bearing',
  'journal',
  'rotor',
  'pipe',
  'seal',
  'alignment',
  'methodology',
  'standards',
  'faq',
  'disclaimer',
  'about',
];

const resolveInitialRoute = (): RouteId => {
  if (typeof window === 'undefined') return 'home';

  // 1. Check URL pathname (e.g. /compressor, /pump, /turbine)
  const rawPath = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (rawPath === 'welcome') return 'portal';
  if (VALID_ROUTES.includes(rawPath as RouteId)) {
    return rawPath as RouteId;
  }

  // 2. Check URL query parameters (?sim=pump or ?route=portal or ?page=welcome)
  const urlParams = new URLSearchParams(window.location.search);
  const paramRoute = (urlParams.get('sim') || urlParams.get('route') || urlParams.get('page'))?.toLowerCase();
  if (paramRoute === 'welcome') return 'portal';
  if (paramRoute && VALID_ROUTES.includes(paramRoute as RouteId)) {
    return paramRoute as RouteId;
  }

  // 3. Check hash (#pump, #compressor, etc. for backward compatibility)
  const rawHash = window.location.hash.replace('#', '').toLowerCase();
  if (rawHash === 'welcome') return 'portal';
  if (VALID_ROUTES.includes(rawHash as RouteId)) {
    return rawHash as RouteId;
  }

  return 'home';
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Active Route synced with URL hash / query
  const [activeRoute, setActiveRouteState] = useState<RouteId>(resolveInitialRoute);

  // 2. Global Units Preference (SI / Imperial)
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>(() => {
    const saved = localStorage.getItem('plant_rel_unit_system');
    return saved === 'us' ? 'us' : 'metric';
  });

  // 3. Theme Mode
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('plant_rel_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  // 4. Disclaimer Status (Main website already handles initial disclaimer)
  const [isDisclaimerAccepted, setIsDisclaimerAccepted] = useState<boolean>(true);

  // 5. Modal states
  const [isDisclaimerModalOpen, setIsDisclaimerModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState<boolean>(false);
  const [isCaseStudiesModalOpen, setIsCaseStudiesModalOpen] = useState<boolean>(false);
  const [isReliabilityStudioOpen, setIsReliabilityStudioOpen] = useState<boolean>(false);
  const [isMachineryTrainStudioOpen, setIsMachineryTrainStudioOpen] = useState<boolean>(false);
  const [isSpectralLabOpen, setIsSpectralLabOpen] = useState<boolean>(false);
  const [isTransientModalOpen, setIsTransientModalOpen] = useState<boolean>(false);
  const [isKineticCutawayOpen, setIsKineticCutawayOpen] = useState<boolean>(false);
  const [isFleetMatrixOpen, setIsFleetMatrixOpen] = useState<boolean>(false);
  const [isRcaStudioOpen, setIsRcaStudioOpen] = useState<boolean>(false);
  const [rcaPreloadCase, setRcaPreloadCase] = useState<any | null>(null);
  const [isTribologyLabOpen, setIsTribologyLabOpen] = useState<boolean>(false);
  const [isMonteCarloOpen, setIsMonteCarloOpen] = useState<boolean>(false);
  const [isExergyCarbonOpen, setIsExergyCarbonOpen] = useState<boolean>(false);
  const [isComparatorOpen, setIsComparatorOpen] = useState<boolean>(false);
  const [comparatorPair, setComparatorPair] = useState<[SimulatorId, SimulatorId]>(['turbine', 'compressor']);

  const openComparatorWith = useCallback((a?: SimulatorId, b?: SimulatorId) => {
    if (a && b) {
      setComparatorPair([a, b]);
    } else if (a) {
      setComparatorPair((prev) => [a, prev[1] === a ? (a === 'compressor' ? 'turbine' : 'compressor') : prev[1]]);
    }
    setIsComparatorOpen(true);
  }, []);

  // 6. Guided Learning / Novice Mode
  const [isLearningMode, setIsLearningModeState] = useState<boolean>(() => {
    return localStorage.getItem('mech_lab_learning_mode') === 'true';
  });

  const setIsLearningMode = useCallback((mode: boolean) => {
    setIsLearningModeState(mode);
    localStorage.setItem('mech_lab_learning_mode', mode ? 'true' : 'false');
  }, []);

  const toggleLearningMode = useCallback(() => {
    setIsLearningModeState((prev) => {
      const next = !prev;
      localStorage.setItem('mech_lab_learning_mode', next ? 'true' : 'false');
      return next;
    });
  }, []);

  // 7. Injected Simulator Inputs (from Case Studies or Diagnostics)
  const [injectedSimulatorInputs, setInjectedSimulatorInputs] = useState<Record<string, any> | null>(null);

  // 8. Live Active Simulation Report & Audit Trail
  const [activeSimulationReport, setActiveSimulationReport] = useState<ActiveSimulationReport | null>(null);
  const reportProviderRef = useRef<(() => ActiveSimulationReport | null) | null>(null);

  const registerReportProvider = useCallback((provider: () => ActiveSimulationReport | null) => {
    reportProviderRef.current = provider;
    return () => {
      if (reportProviderRef.current === provider) {
        reportProviderRef.current = null;
      }
    };
  }, []);

  const getLiveSimulationReport = useCallback((): ActiveSimulationReport | null => {
    if (reportProviderRef.current) {
      try {
        const live = reportProviderRef.current();
        if (live) return live;
      } catch {
        // fallback
      }
    }
    return activeSimulationReport;
  }, [activeSimulationReport]);

  const injectSimulatorInputs = useCallback((inputs: Record<string, any>) => {
    setInjectedSimulatorInputs(inputs);
  }, []);

  const clearInjectedInputs = useCallback(() => {
    setInjectedSimulatorInputs(null);
  }, []);

  // Sync URL routing (pathname and hash)
  useEffect(() => {
    const handleUrlChange = () => {
      // 1. Check pathname first
      const rawPath = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
      if (rawPath === 'welcome') {
        setActiveRouteState('portal');
        return;
      }
      if (VALID_ROUTES.includes(rawPath as RouteId)) {
        setActiveRouteState(rawPath as RouteId);
        return;
      }

      // 2. Check hash
      const rawHash = window.location.hash.replace('#', '').toLowerCase();
      if (rawHash === 'welcome') {
        setActiveRouteState('portal');
        return;
      }
      const hash = rawHash as RouteId;
      if (VALID_ROUTES.includes(hash)) {
        setActiveRouteState(hash);
        return;
      }

      if (!rawPath && !window.location.hash) {
        setActiveRouteState('home');
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const setActiveRoute = useCallback((route: RouteId) => {
    setActiveRouteState(route);
    const targetPath = route === 'home' ? '/' : `/${route}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
    if (window.location.hash) {
      window.history.replaceState(null, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToSimulator = useCallback((simId: SimulatorId) => {
    setActiveRoute(simId);
  }, [setActiveRoute]);

  const setUnitSystem = useCallback((units: UnitSystem) => {
    setUnitSystemState(units);
    localStorage.setItem('plant_rel_unit_system', units);
  }, []);

  const toggleUnitSystem = useCallback(() => {
    setUnitSystemState((prev) => {
      const next = prev === 'metric' ? 'us' : 'metric';
      localStorage.setItem('plant_rel_unit_system', next);
      return next;
    });
  }, []);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('plant_rel_theme', newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('plant_rel_theme', next);
      return next;
    });
  }, []);

  const acceptDisclaimer = useCallback(() => {
    localStorage.setItem('mech_lab_disclaimer_accepted', 'true');
    setIsDisclaimerAccepted(true);
    setIsDisclaimerModalOpen(false);
  }, []);

  const contextValue = useMemo(
    () => ({
      activeRoute,
      setActiveRoute,
      navigateToSimulator,
      unitSystem,
      setUnitSystem,
      toggleUnitSystem,
      theme,
      setTheme,
      toggleTheme,
      isDisclaimerAccepted,
      acceptDisclaimer,
      isDisclaimerModalOpen,
      setIsDisclaimerModalOpen,
      isAuditModalOpen,
      setIsAuditModalOpen,
      isReportModalOpen,
      setIsReportModalOpen,
      isLearningMode,
      setIsLearningMode,
      toggleLearningMode,
      isDiagnosticModalOpen,
      setIsDiagnosticModalOpen,
      isCaseStudiesModalOpen,
      setIsCaseStudiesModalOpen,
      isReliabilityStudioOpen,
      setIsReliabilityStudioOpen,
      isMachineryTrainStudioOpen,
      setIsMachineryTrainStudioOpen,
      isSpectralLabOpen,
      setIsSpectralLabOpen,
      isTransientModalOpen,
      setIsTransientModalOpen,
      isKineticCutawayOpen,
      setIsKineticCutawayOpen,
      isFleetMatrixOpen,
      setIsFleetMatrixOpen,
      isRcaStudioOpen,
      setIsRcaStudioOpen,
      rcaPreloadCase,
      setRcaPreloadCase,
      isTribologyLabOpen,
      setIsTribologyLabOpen,
      isMonteCarloOpen,
      setIsMonteCarloOpen,
      isExergyCarbonOpen,
      setIsExergyCarbonOpen,
      isComparatorOpen,
      setIsComparatorOpen,
      comparatorPair,
      setComparatorPair,
      openComparatorWith,
      injectedSimulatorInputs,
      injectSimulatorInputs,
      clearInjectedInputs,
      activeSimulationReport,
      setActiveSimulationReport,
      registerReportProvider,
      getLiveSimulationReport,
    }),
    [
      activeRoute,
      setActiveRoute,
      navigateToSimulator,
      unitSystem,
      setUnitSystem,
      toggleUnitSystem,
      theme,
      setTheme,
      toggleTheme,
      isDisclaimerAccepted,
      acceptDisclaimer,
      isDisclaimerModalOpen,
      isAuditModalOpen,
      isReportModalOpen,
      isLearningMode,
      setIsLearningMode,
      toggleLearningMode,
      isDiagnosticModalOpen,
      isCaseStudiesModalOpen,
      isReliabilityStudioOpen,
      isMachineryTrainStudioOpen,
      isSpectralLabOpen,
      isTransientModalOpen,
      isKineticCutawayOpen,
      isFleetMatrixOpen,
      isRcaStudioOpen,
      rcaPreloadCase,
      isTribologyLabOpen,
      isMonteCarloOpen,
      isExergyCarbonOpen,
      isComparatorOpen,
      comparatorPair,
      openComparatorWith,
      injectedSimulatorInputs,
      injectSimulatorInputs,
      clearInjectedInputs,
      activeSimulationReport,
      registerReportProvider,
      getLiveSimulationReport,
    ]
  );

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
