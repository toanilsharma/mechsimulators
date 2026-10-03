import React from 'react';
import { ChevronRight, Radio, ExternalLink, SlidersHorizontal, Activity } from 'lucide-react';

export interface BreadcrumbSegment {
  label: string;
  href?: string;
  onClick?: () => void;
  isCurrent?: boolean;
}

export interface MechanicalContextBarProps {
  hubLabel?: string;
  hubHref?: string;
  workbenchLabel?: string;
  workbenchHref?: string;
  categoryLabel?: string;
  categoryHref?: string;
  simulatorLabel?: string;
  customSegments?: BreadcrumbSegment[];
  onNavigate?: (path: string) => void;
  className?: string;
}

export const MechanicalContextBar: React.FC<MechanicalContextBarProps> = ({
  hubLabel = 'LiveSimulators Hub',
  hubHref = 'https://livesimulators.com',
  workbenchLabel = 'Mechanical Workbench',
  workbenchHref = '/mechanical',
  categoryLabel = 'Turbomachinery',
  categoryHref = '/mechanical#turbomachinery',
  simulatorLabel = 'API 610 Pump',
  customSegments,
  onNavigate,
  className = '',
}) => {
  const handleLinkClick = (e: React.MouseEvent, href?: string, onClick?: () => void) => {
    if (onClick) {
      e.preventDefault();
      onClick();
      return;
    }
    if (href && onNavigate && href.startsWith('/')) {
      e.preventDefault();
      onNavigate(href);
    }
  };

  // Default segments match the exact requirement:
  // LiveSimulators Hub › Mechanical Workbench › Turbomachinery › API 610 Pump
  const segments: BreadcrumbSegment[] = customSegments || [
    {
      label: hubLabel,
      href: hubHref,
    },
    {
      label: workbenchLabel,
      href: workbenchHref,
    },
    {
      label: categoryLabel,
      href: categoryHref,
    },
    {
      label: simulatorLabel,
      isCurrent: true,
    },
  ];

  return (
    <nav
      aria-label="Mechanical Context Breadcrumb"
      className={`w-full h-[30px] min-h-[30px] max-h-[30px] bg-[#070D18] border-b border-[#1E293B] px-3 sm:px-5 md:px-6 lg:px-8 flex items-center justify-between text-xs font-mono select-none shrink-0 z-30 ${className}`}
    >
      {/* Breadcrumb Hierarchy */}
      <ol className="flex items-center gap-1.5 sm:gap-2 text-[11px] overflow-x-auto no-scrollbar py-0.5">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1 || segment.isCurrent;
          const isWorkbench = segment.label.toLowerCase().includes('mechanical workbench');

          return (
            <li key={index} className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {index > 0 && (
                <span className="text-slate-600 select-none text-[10px]">›</span>
              )}

              {isLast ? (
                <span
                  aria-current="page"
                  className="font-bold text-[#06B6D4] [text-shadow:0_0_8px_rgba(6,182,212,0.4)] flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-pulse motion-reduce:animate-none" />
                  {segment.label}
                </span>
              ) : isWorkbench ? (
                /* Required: 'Mechanical Workbench' text should be a link back to the main mechanical fleet listing page */
                <a
                  href={segment.href || workbenchHref}
                  onClick={(e) => handleLinkClick(e, segment.href || workbenchHref, segment.onClick)}
                  className="font-medium text-slate-300 hover:text-white hover:underline transition-colors flex items-center gap-1 cursor-pointer bg-slate-800/40 px-1.5 py-0.5 rounded border border-slate-700/60"
                  title="Return to Mechanical Fleet Workbench Directory"
                >
                  <SlidersHorizontal className="w-3 h-3 text-[#06B6D4]" />
                  <span>{segment.label}</span>
                </a>
              ) : segment.href ? (
                <a
                  href={segment.href}
                  onClick={(e) => handleLinkClick(e, segment.href, segment.onClick)}
                  target={segment.href.startsWith('http') ? '_blank' : undefined}
                  rel={segment.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {segment.label}
                </a>
              ) : (
                <span className="text-slate-400">{segment.label}</span>
              )}
            </li>
          );
        })}
      </ol>

      {/* Right Side: Engineering Metadata Pill */}
      <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-400 shrink-0">
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0B1322] border border-[#1E293B]">
          <Activity className="w-3 h-3 text-[#06B6D4]" />
          <span className="text-slate-300 font-semibold">API/ISO DIGITAL TWIN</span>
        </div>
        <span className="text-slate-600">|</span>
        <span className="text-[#06B6D4] font-semibold">FLOAT64 RK4</span>
      </div>
    </nav>
  );
};
