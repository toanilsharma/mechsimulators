import React, { useState, useMemo } from 'react';
import { GlobalTopNavigation } from './GlobalTopNavigation';
import { MechanicalContextBar, BreadcrumbSegment } from './MechanicalContextBar';
import { GlobalCmdkSearch } from './GlobalCmdkSearch';
import { LiveSimulatorsFooter } from '../Footer/LiveSimulatorsFooter';
import { MECHANICAL_SIMS, MechanicalSimulatorMeta } from '../../data/mechanicalSims';

export interface UnifiedLayoutProps {
  children: React.ReactNode;
  /** Current route string, e.g. '/mechanical/lab/pump' or '/mechanical' */
  currentRoute?: string;
  /** Active simulator ID (e.g. 'pump', 'compressor', etc.) */
  activeSimulatorId?: string;
  /** Custom breadcrumb segments if overriding default hierarchy */
  breadcrumbs?: BreadcrumbSegment[];
  /** Array of mechanical simulators passed to cmdk search */
  mechanicalSims?: MechanicalSimulatorMeta[];
  /** Navigation callback for Next.js or React Router */
  onNavigate?: (path: string) => void;
  /** Hide footer if in an embedded frame */
  hideFooter?: boolean;
  /** Hide secondary context bar */
  hideContextBar?: boolean;
  /** Class name overrides for main content container */
  className?: string;
}

export const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({
  children,
  currentRoute = '/mechanical/lab/pump',
  activeSimulatorId,
  breadcrumbs,
  mechanicalSims = MECHANICAL_SIMS,
  onNavigate,
  hideFooter = false,
  hideContextBar = false,
  className = '',
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Identify active simulator metadata if available
  const currentSimMeta = useMemo(() => {
    if (activeSimulatorId) {
      return mechanicalSims.find((s) => s.id === activeSimulatorId);
    }
    // Extract ID from route if formatted like /mechanical/lab/[id]
    const match = currentRoute.match(/\/mechanical\/lab\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return mechanicalSims.find((s) => s.id === match[1]);
    }
    // Default fallback to pump
    return mechanicalSims.find((s) => s.id === 'pump') || mechanicalSims[0];
  }, [activeSimulatorId, currentRoute, mechanicalSims]);

  // Build breadcrumbs according to specification:
  // LiveSimulators Hub › Mechanical Workbench › Turbomachinery › API 610 Pump
  const computedBreadcrumbs: BreadcrumbSegment[] = useMemo(() => {
    if (breadcrumbs) return breadcrumbs;

    const category = currentSimMeta?.category || 'Turbomachinery';
    const shortName = currentSimMeta?.shortName || 'API 610 Pump';

    return [
      {
        label: 'LiveSimulators Hub',
        href: 'https://livesimulators.com',
      },
      {
        label: 'Mechanical Workbench',
        href: '/mechanical',
      },
      {
        label: category,
        href: `/mechanical#${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      },
      {
        label: shortName,
        isCurrent: true,
      },
    ];
  }, [breadcrumbs, currentSimMeta]);

  return (
    <div
      id="unified-livesimulators-layout"
      className="min-h-screen w-full bg-[#050B14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/25 selection:text-cyan-200 relative"
    >
      {/* 
        Strict CSS Enforcement:
        Ensure that NO standalone 'Netlify' promotional badge or banner can ever render
      */}
      <style>{`
        [class*="netlify-badge"],
        [id*="netlify-badge"],
        [data-netlify-badge],
        .netlify-badge,
        #netlify-badge,
        a[href*="netlify.com"][class*="badge"],
        a[href*="netlify.com"][class*="promo"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          height: 0 !important;
          width: 0 !important;
          position: absolute !important;
          overflow: hidden !important;
        }
      `}</style>

      {/* 1. Global Navigation Bar: Home, Electrical, Mechanical [Active], Faculty, Login */}
      <GlobalTopNavigation
        onOpenSearch={() => setIsSearchOpen(true)}
        onNavigate={onNavigate}
      />

      {/* 2. Secondary Ultra-Thin Context Bar: LiveSimulators Hub › Mechanical Workbench › Turbomachinery › API 610 Pump */}
      {!hideContextBar && (
        <MechanicalContextBar
          customSegments={computedBreadcrumbs}
          onNavigate={onNavigate}
        />
      )}

      {/* 3. Main Route Workspace */}
      <main
        id="unified-main-content"
        role="main"
        className={`flex-1 w-full overflow-x-hidden ${className}`}
      >
        {children}
      </main>

      {/* 4. Global Footer: Full livesimulators.com multi-department footer */}
      {!hideFooter && <LiveSimulatorsFooter />}

      {/* 5. Global Ctrl+K Search Palette with cmdk integration */}
      <GlobalCmdkSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        mechanicalSims={mechanicalSims}
        onNavigate={onNavigate}
        currentRoute={currentRoute}
      />
    </div>
  );
};

export default UnifiedLayout;
