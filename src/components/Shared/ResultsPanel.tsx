import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UnitSystem } from '../../types/common';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  Zap,
  Network,
  Activity,
  Gauge,
  SlidersHorizontal,
  BookOpen,
  FileText,
  Wrench,
  Cpu,
  Award,
  Sliders,
  CheckCircle2,
  XCircle,
  Scale,
  ListChecks,
  ChevronRight,
  Info,
} from 'lucide-react';
import { AnimatedCounter } from '../Workbench/AnimatedCounter';
import { Sparkline } from '../Workbench/Sparkline';
import {
  getSimulatorPhysicsFactors,
  getSimulatorStandardsCompliance,
  getSimulatorCorrectiveGuidance,
  explainInputChange,
  PhysicsFactorItem,
  StandardComplianceItem,
  CorrectiveGuidanceItem,
  InputChangeImpact,
} from '../../utils/physicsDiagnosticEngine';

export type StatusLevel = 'safe' | 'warning' | 'critical';

export interface ResultKPI {
  id: string;
  label: string;
  value: number | string;
  rawNumericValue?: number;
  unit?: string;
  decimals?: number;
  status?: 'safe' | 'warning' | 'critical' | 'neutral';
  helperText?: string;
}

export interface ResultGauge {
  id: string;
  title: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  warningThreshold?: number;
  criticalThreshold?: number;
  inverseZones?: boolean; // If true: lower values are dangerous (e.g. NPSH Margin, Vapor Margin)
  targetValue?: number;
  targetLabel?: string;
}

export interface ResultEventItem {
  id: string;
  timestamp?: string;
  message: string;
  level: 'safe' | 'warning' | 'critical' | 'info';
}

export interface ResultsPanelProps {
  status: {
    level: StatusLevel;
    label?: string;
    message?: string;
  };
  mainResult?: {
    label: string;
    value: number | string;
    rawNumericValue?: number;
    unit?: string;
    decimals?: number;
    status?: StatusLevel;
  };
  unitSystem?: UnitSystem;
  liveInsight: string;
  kpis?: ResultKPI[];
  gauges?: ResultGauge[];
  trendData?: number[];
  trendLabel?: string;
  recommendedAction: string;
  events?: ResultEventItem[];
  simulatorId?: string;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  factors?: PhysicsFactorItem[];
  complianceChecks?: StandardComplianceItem[];
  correctiveActions?: CorrectiveGuidanceItem[];
}

/**
 * Compact Industrial Circular Radial Gauge
 * Optimized for zero-scroll fit-to-screen side-by-side presentation
 */
const CircularArcGauge: React.FC<{
  gauge: ResultGauge;
}> = ({ gauge }) => {
  const {
    value,
    min,
    max,
    title,
    unit,
    warningThreshold,
    criticalThreshold,
    inverseZones = false,
    targetValue,
    targetLabel,
  } = gauge;

  const range = max - min || 1;
  const clampedVal = Math.max(min, Math.min(max, value));
  const fraction = (clampedVal - min) / range;

  // Arc angles: 220 degree sweep from 150° to 390°
  const startAngle = 150;
  const endAngle = 390;
  const totalAngle = endAngle - startAngle;
  const currentAngle = startAngle + fraction * totalAngle;

  const size = 114;
  const cx = size / 2;
  const cy = size / 2 + 6;
  const radius = 38;
  const strokeWidth = 6;

  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, startA: number, endA: number) => {
    const start = polarToCartesian(x, y, r, endA);
    const end = polarToCartesian(x, y, r, startA);
    const largeArcFlag = endA - startA <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  let gaugeColor = '#3fb950'; // green
  if (inverseZones) {
    if (criticalThreshold !== undefined && value <= criticalThreshold) {
      gaugeColor = '#f85149'; // red
    } else if (warningThreshold !== undefined && value <= warningThreshold) {
      gaugeColor = '#d29922'; // amber
    }
  } else {
    if (criticalThreshold !== undefined && value >= criticalThreshold) {
      gaugeColor = '#f85149'; // red
    } else if (warningThreshold !== undefined && value >= warningThreshold) {
      gaugeColor = '#d29922'; // amber
    }
  }

  const bgPath = describeArc(cx, cy, radius, startAngle, endAngle);
  const valAngle = Math.max(startAngle + 0.1, Math.min(endAngle, currentAngle));
  const valPath = describeArc(cx, cy, radius, startAngle, valAngle);

  let targetAngle: number | null = null;
  if (targetValue !== undefined) {
    const targetFrac = Math.max(0, Math.min(1, (targetValue - min) / range));
    targetAngle = startAngle + targetFrac * totalAngle;
  }

  const needleTip = polarToCartesian(cx, cy, radius - 4, currentAngle);

  return (
    <div className="flex flex-col items-center justify-between p-2 bg-[#161b22] border border-[#30363d] rounded-lg shadow-sm w-full">
      <span className="text-[9.5px] font-mono text-[#8b949e] uppercase font-bold tracking-wider text-center truncate w-full">
        {title}
      </span>

      <div className="relative my-0.5 flex items-center justify-center">
        <svg width={size} height={size * 0.72} viewBox={`0 0 ${size} ${size * 0.74}`} className="overflow-visible">
          {/* Background Track */}
          <path
            d={bgPath}
            fill="none"
            stroke="#21262d"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active Arc */}
          <path
            d={valPath}
            fill="none"
            stroke={gaugeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />

          {/* Target Marker */}
          {targetAngle !== null && (
            (() => {
              const ptOuter = polarToCartesian(cx, cy, radius + strokeWidth / 2 + 2, targetAngle);
              const ptInner = polarToCartesian(cx, cy, radius - strokeWidth / 2 - 2, targetAngle);
              return (
                <line
                  x1={ptInner.x}
                  y1={ptInner.y}
                  x2={ptOuter.x}
                  y2={ptOuter.y}
                  stroke="#58a6ff"
                  strokeWidth="2"
                  strokeDasharray="2,1"
                />
              );
            })()
          )}

          {/* Needle pivot */}
          <circle cx={cx} cy={cy} r={3} fill="#c9d1d9" />
          <line
            x1={cx}
            y1={cy}
            x2={needleTip.x}
            y2={needleTip.y}
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Digital Readout */}
        <div className="absolute top-[54%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div className="text-xs md:text-sm font-bold font-mono text-white leading-none">
            {typeof value === 'number' ? (
              <AnimatedCounter value={value} decimals={value % 1 === 0 ? 0 : 1} />
            ) : (
              value
            )}
          </div>
          <span className="text-[9px] font-mono text-[#8b949e] block mt-0.5">
            {unit}
          </span>
        </div>
      </div>

      {/* Limits & Target Footer */}
      <div className="flex items-center justify-between w-full px-1 text-[8.5px] font-mono text-[#8b949e]">
        <span>{min}</span>
        {targetLabel && targetValue !== undefined && (
          <span className="text-[#58a6ff] text-[8px] truncate max-w-[65px]">
            {targetLabel}: {targetValue}
          </span>
        )}
        <span>{max}</span>
      </div>
    </div>
  );
};

/**
 * Calibrated Industrial Zone Compliance & Safety Envelope Diagram
 */
const ZoneEnvelopeDiagram: React.FC<{
  gauge: ResultGauge;
}> = ({ gauge }) => {
  const { title, value, min, max, unit, warningThreshold, criticalThreshold, inverseZones, targetValue, targetLabel } = gauge;
  const range = max - min || 1;
  const clampedVal = Math.max(min, Math.min(max, value));
  const valPct = Math.max(2, Math.min(98, ((clampedVal - min) / range) * 100));

  let warnPct = 60;
  let critPct = 80;
  if (warningThreshold !== undefined) {
    warnPct = Math.max(5, Math.min(95, ((warningThreshold - min) / range) * 100));
  }
  if (criticalThreshold !== undefined) {
    critPct = Math.max(5, Math.min(95, ((criticalThreshold - min) / range) * 100));
  }

  let statusColor = '#3fb950';
  let statusText = 'SAFE ZONE';
  if (inverseZones) {
    if (criticalThreshold !== undefined && value <= criticalThreshold) {
      statusColor = '#f85149';
      statusText = 'CRITICAL TRIP';
    } else if (warningThreshold !== undefined && value <= warningThreshold) {
      statusColor = '#d29922';
      statusText = 'ADVISORY WARNING';
    }
  } else {
    if (criticalThreshold !== undefined && value >= criticalThreshold) {
      statusColor = '#f85149';
      statusText = 'CRITICAL TRIP';
    } else if (warningThreshold !== undefined && value >= warningThreshold) {
      statusColor = '#d29922';
      statusText = 'ADVISORY WARNING';
    }
  }

  return (
    <div className="p-2 bg-[#161b22] border border-[#30363d] rounded-md shadow-sm flex flex-col gap-1 w-full">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono font-bold text-[#8b949e] uppercase truncate">
          {title}
        </span>
        <span
          className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded border"
          style={{ color: statusColor, borderColor: `${statusColor}44`, backgroundColor: `${statusColor}15` }}
        >
          {statusText}
        </span>
      </div>

      {/* Visual Multi-Zone Bar with Needle */}
      <div className="relative pt-3.5 pb-0.5">
        {/* Animated Value Pointer */}
        <div
          className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300 pointer-events-none z-10"
          style={{ left: `${valPct}%` }}
        >
          <span
            className="text-[8px] font-mono font-bold px-1 rounded bg-[#0d1117] border shadow-sm"
            style={{ color: statusColor, borderColor: statusColor }}
          >
            {typeof value === 'number' ? value.toFixed(value % 1 === 0 ? 0 : 1) : value} {unit}
          </span>
          <div
            className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[3px]"
            style={{ borderTopColor: statusColor }}
          />
        </div>

        {/* Multi-zone color track */}
        <div className="h-2.5 w-full rounded-full overflow-hidden flex border border-[#30363d]">
          {inverseZones ? (
            <>
              <div style={{ width: `${critPct}%` }} className="bg-rose-500/80 h-full" title="Critical Zone" />
              <div style={{ width: `${Math.max(0, warnPct - critPct)}%` }} className="bg-amber-500/80 h-full" title="Warning Zone" />
              <div style={{ width: `${Math.max(0, 100 - warnPct)}%` }} className="bg-emerald-500/80 h-full" title="Normal Zone" />
            </>
          ) : (
            <>
              <div style={{ width: `${warnPct}%` }} className="bg-emerald-500/80 h-full" title="Normal Zone" />
              <div style={{ width: `${Math.max(0, critPct - warnPct)}%` }} className="bg-amber-500/80 h-full" title="Warning Zone" />
              <div style={{ width: `${Math.max(0, 100 - critPct)}%` }} className="bg-rose-500/80 h-full" title="Critical Zone" />
            </>
          )}
        </div>
      </div>

      {/* Bounds & Target Callouts */}
      <div className="flex items-center justify-between text-[7.5px] font-mono text-[#8b949e]">
        <span>Min: {min}</span>
        {targetLabel && targetValue !== undefined && (
          <span className="text-[#58a6ff]">
            {targetLabel}: {targetValue} {unit}
          </span>
        )}
        <span>Max: {max}</span>
      </div>
    </div>
  );
};

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  status,
  mainResult,
  unitSystem = 'metric',
  liveInsight,
  kpis = [],
  gauges = [],
  trendData,
  trendLabel = 'Trend (Recent)',
  recommendedAction,
  events,
  simulatorId,
  inputs,
  outputs,
  factors,
  complianceChecks,
  correctiveActions,
}) => {
  const {
    setIsReliabilityStudioOpen,
    setIsMachineryTrainStudioOpen,
    setIsSpectralLabOpen,
    setIsAuditModalOpen,
    setIsReportModalOpen,
    setIsDiagnosticModalOpen,
    setIsCaseStudiesModalOpen,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'telemetry' | 'factors' | 'standards' | 'guidance' | 'studios'>('telemetry');
  const [dialsViewMode, setDialsViewMode] = useState<'gauges' | 'envelope'>('gauges');
  const [showChangeBanner, setShowChangeBanner] = useState<boolean>(true);
  const [lastInputChange, setLastInputChange] = useState<InputChangeImpact | null>(null);

  const safeKpis = kpis || [];
  const safeGauges = gauges || [];
  const resolvedMainResult = mainResult || {
    label: safeKpis[0]?.label || 'Primary Criterion',
    value: safeKpis[0]?.value ?? 0,
    rawNumericValue: typeof safeKpis[0]?.value === 'number' ? safeKpis[0].value : undefined,
    unit: safeKpis[0]?.unit,
    status: status?.level || 'safe',
  };

  // Infer simulator ID if not explicitly passed
  const resolvedSimId = useMemo(() => {
    if (simulatorId) return simulatorId;
    const label = (resolvedMainResult.label || '').toLowerCase();
    const kpiText = safeKpis.map((k) => (k.label || '').toLowerCase()).join(' ');
    const combined = `${label} ${kpiText}`;

    if (combined.includes('npsh') || combined.includes('cavitation') || combined.includes('pump')) return 'pump';
    if (combined.includes('unbalance') || combined.includes('iso 20816') || combined.includes('rotor')) return 'rotor';
    if (combined.includes('misalignment') || combined.includes('offset') || combined.includes('angular')) return 'alignment';
    if (combined.includes('bearing') && (combined.includes('bpfo') || combined.includes('defect') || combined.includes('demod'))) return 'bearing';
    if (combined.includes('journal') || combined.includes('sommerfeld') || combined.includes('whirl') || combined.includes('attitude')) return 'journal';
    if (combined.includes('surge') || combined.includes('compressor') || combined.includes('b-parameter')) return 'compressor';
    if (combined.includes('recip') || combined.includes('rod load') || combined.includes('cylinder') || combined.includes('packing')) return 'recip';
    if (combined.includes('gear') || combined.includes('backlash') || combined.includes('contact stress') || combined.includes('mesh')) return 'gearbox';
    if (combined.includes('pipe') || combined.includes('expansion') || combined.includes('flange') || combined.includes('b31.3')) return 'pipe';
    if (combined.includes('steam') || combined.includes('turbine') || combined.includes('expansion ratio') || combined.includes('moisture')) return 'steam-turbine';
    if (combined.includes('seal') || combined.includes('flush') || combined.includes('barrier') || combined.includes('tribology')) return 'seal';
    return 'pump';
  }, [simulatorId, resolvedMainResult.label, safeKpis]);

  // Real-time Input Change Tracker & Impact Synthesizer
  const prevInputsRef = useRef<Record<string, any>>({});
  useEffect(() => {
    if (!inputs || Object.keys(inputs).length === 0) return;
    const prev = prevInputsRef.current;
    if (Object.keys(prev).length > 0) {
      for (const key of Object.keys(inputs)) {
        if (prev[key] !== undefined && prev[key] !== inputs[key]) {
          const impact = explainInputChange(
            resolvedSimId,
            key,
            prev[key],
            inputs[key],
            inputs,
            outputs || {}
          );
          if (impact) {
            setLastInputChange(impact);
            setShowChangeBanner(true);
          }
          break;
        }
      }
    }
    prevInputsRef.current = { ...inputs };
  }, [inputs, resolvedSimId, outputs]);

  // Physical Factors, Standards Compliance, and Corrective Guidance Resolution
  const currentUnitSystem: UnitSystem = unitSystem === 'us' ? 'us' : 'metric';
  const resolvedPhysicsData = useMemo(() => {
    if (factors && factors.length > 0) {
      return {
        governingEquation: 'Physics Transfer Relationship',
        equationDescription: 'Multi-parameter transfer function for governing criterion.',
        factors,
      };
    }
    return getSimulatorPhysicsFactors(resolvedSimId, inputs || {}, outputs || {}, currentUnitSystem);
  }, [factors, resolvedSimId, inputs, outputs, currentUnitSystem]);

  const resolvedCompliance = useMemo(() => {
    if (complianceChecks && complianceChecks.length > 0) return complianceChecks;
    return getSimulatorStandardsCompliance(resolvedSimId, inputs || {}, outputs || {}, currentUnitSystem);
  }, [complianceChecks, resolvedSimId, inputs, outputs, currentUnitSystem]);

  const resolvedGuidance = useMemo(() => {
    if (correctiveActions && correctiveActions.length > 0) return correctiveActions;
    return getSimulatorCorrectiveGuidance(resolvedSimId, inputs || {}, outputs || {}, currentUnitSystem);
  }, [correctiveActions, resolvedSimId, inputs, outputs, currentUnitSystem]);

  const violationCount = resolvedCompliance.filter((c) => c.status === 'violation').length;
  const marginalCount = resolvedCompliance.filter((c) => c.status === 'marginal').length;
  const compliantCount = resolvedCompliance.filter((c) => c.status === 'compliant').length;
  const highPriorityActions = resolvedGuidance.filter((g) => g.priority === 'high').length;

  // Trend directions for KPI chips - computed stably via ref comparison to eliminate re-render loops
  const prevKpiValuesRef = useRef<Map<string, number>>(new Map());
  const trendDirectionsRef = useRef<Record<string, 'up' | 'down' | 'flat'>>({});

  safeKpis.forEach((kpi) => {
    const currentVal =
      kpi.rawNumericValue !== undefined
        ? kpi.rawNumericValue
        : typeof kpi.value === 'number'
        ? kpi.value
        : parseFloat(String(kpi.value));

    if (!isNaN(currentVal)) {
      const prevVal = prevKpiValuesRef.current.get(kpi.id);
      if (prevVal !== undefined) {
        const delta = currentVal - prevVal;
        if (Math.abs(delta) > 0.0001) {
          trendDirectionsRef.current[kpi.id] = delta > 0 ? 'up' : 'down';
        }
      } else {
        trendDirectionsRef.current[kpi.id] = 'flat';
      }
      prevKpiValuesRef.current.set(kpi.id, currentVal);
    }
  });

  // Internal auto-history tracker via ref to prevent re-render cascades
  const internalHistoryRef = useRef<number[]>([]);
  const lastHistoryValRef = useRef<number | null>(null);

  const num =
    resolvedMainResult.rawNumericValue !== undefined
      ? resolvedMainResult.rawNumericValue
      : typeof resolvedMainResult.value === 'number'
      ? resolvedMainResult.value
      : parseFloat(String(resolvedMainResult.value));

  if (!isNaN(num) && lastHistoryValRef.current !== num) {
    lastHistoryValRef.current = num;
    internalHistoryRef.current.push(num);
    if (internalHistoryRef.current.length > 20) {
      internalHistoryRef.current.shift();
    }
  }

  const activeTrendData =
    trendData && trendData.length > 0
      ? trendData
      : internalHistoryRef.current.length > 0
      ? internalHistoryRef.current
      : !isNaN(num)
      ? [num]
      : [];

  // Internal event logger via ref
  const internalEventsRef = useRef<ResultEventItem[]>([]);
  const lastEventMsgRef = useRef<string>('');

  if (status.level === 'critical' || status.level === 'warning') {
    const msg = status.message || `${status.level.toUpperCase()} alarm triggered on governing criterion.`;
    if (lastEventMsgRef.current !== msg) {
      lastEventMsgRef.current = msg;
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      internalEventsRef.current = [
        ...internalEventsRef.current.slice(-3),
        {
          id: `auto-${Date.now()}`,
          timestamp: timeStr,
          level: status.level,
          message: msg,
        },
      ];
    }
  }

  const activeEvents = events && events.length > 0 ? events.slice(-4) : internalEventsRef.current;

  // Status Styling
  const getStatusStyles = () => {
    switch (status.level) {
      case 'safe':
        return {
          mainColor: 'text-emerald-400',
          badgeBg: 'bg-emerald-950/80 border-emerald-700/60 text-emerald-400',
          dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
          icon: <ShieldCheck size={11} className="text-emerald-400 shrink-0" />,
          cardBorder: 'border-emerald-500/30',
          label: 'NOMINAL',
        };
      case 'warning':
        return {
          mainColor: 'text-amber-400',
          badgeBg: 'bg-amber-950/80 border-amber-700/60 text-amber-400',
          dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
          icon: <AlertTriangle size={11} className="text-amber-400 shrink-0" />,
          cardBorder: 'border-amber-500/40',
          label: 'ADVISORY',
        };
      case 'critical':
        return {
          mainColor: 'text-rose-400',
          badgeBg: 'bg-rose-950/90 border-rose-700/80 text-rose-300 animate-pulse',
          dot: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,1)]',
          icon: <AlertOctagon size={11} className="text-rose-400 shrink-0" />,
          cardBorder: 'border-rose-500/60',
          label: 'CRITICAL',
        };
    }
  };

  const statusStyle = getStatusStyles();
  const sparkColor =
    status.level === 'critical' ? '#f85149' : status.level === 'warning' ? '#d29922' : '#3fb950';

  const validTrendData = activeTrendData.filter((v) => typeof v === 'number' && !isNaN(v) && isFinite(v));
  const minTrend = validTrendData.length > 0 ? Math.min(...validTrendData) : 0;
  const maxTrend = validTrendData.length > 0 ? Math.max(...validTrendData) : 0;

  // Alerts on tabs
  const hasKpiCritical = safeKpis.some((k) => k.status === 'critical');
  const hasKpiWarning = safeKpis.some((k) => k.status === 'warning');
  const hasGaugeCritical = safeGauges.some((g) =>
    g.inverseZones
      ? g.criticalThreshold !== undefined && g.value <= g.criticalThreshold
      : g.criticalThreshold !== undefined && g.value >= g.criticalThreshold
  );

  return (
    <div className="flex flex-col gap-2 w-full select-none text-[#c9d1d9]">
      {/* ========================================================================= */}
      {/* 1. PERSISTENT TOP GOVERNING RESULT CARD (Compact ~60px) */}
      {/* ========================================================================= */}
      <div
        id="card-primary-governing-result"
        className={`p-2.5 bg-[#161b22] border ${statusStyle.cardBorder} rounded-lg shadow-sm flex flex-col gap-1.5 relative overflow-hidden`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono text-[#8b949e] uppercase font-bold tracking-wider truncate">
            {resolvedMainResult.label}
          </span>

          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-mono font-bold tracking-wide shrink-0 ${statusStyle.badgeBg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
            {statusStyle.icon}
            <span>{statusStyle.label}</span>
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            {typeof resolvedMainResult.value === 'number' ? (
              <AnimatedCounter
                value={resolvedMainResult.value}
                decimals={
                  resolvedMainResult.decimals !== undefined
                    ? resolvedMainResult.decimals
                    : resolvedMainResult.value % 1 === 0
                    ? 0
                    : 2
                }
                className={`text-xl md:text-2xl font-extrabold font-mono tracking-tight leading-none ${statusStyle.mainColor}`}
              />
            ) : (
              <span className={`text-xl md:text-2xl font-extrabold font-mono tracking-tight leading-none ${statusStyle.mainColor}`}>
                {resolvedMainResult.value}
              </span>
            )}

            {resolvedMainResult.unit && (
              <span className="text-xs font-mono text-[#8b949e] font-semibold">
                {resolvedMainResult.unit}
              </span>
            )}
          </div>

          {/* Mini Live Insight Ticker */}
          {liveInsight && (
            <div className="flex items-center gap-1 text-[9.5px] font-mono text-[#c9d1d9] truncate max-w-[170px] text-right">
              <Zap size={10} className="text-[#f27d26] shrink-0" />
              <span className="truncate">{liveInsight}</span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. REAL-TIME INPUT CHANGE IMPACT BANNER (Triggered on any slider move) */}
      {/* ========================================================================= */}
      {lastInputChange && showChangeBanner && (
        <div
          id="banner-input-change-impact"
          className="p-2 bg-[#0d2238] border border-[#388bfd]/60 rounded-lg shadow-sm flex flex-col gap-1 text-[9.5px] font-mono animate-fadeIn relative"
        >
          <div className="flex items-center justify-between border-b border-[#388bfd]/30 pb-1">
            <div className="flex items-center gap-1.5 text-[#58a6ff] font-bold">
              <Zap size={11} className="text-[#f27d26] animate-pulse shrink-0" />
              <span>INPUT CHANGED:</span>
              <span className="text-white font-bold">{lastInputChange.detectedParam}</span>
              <span className="text-[8.5px] bg-[#1f3a5f] text-cyan-200 px-1 py-0.2 rounded border border-[#388bfd]/40">
                {lastInputChange.oldValue} → {lastInputChange.newValue} ({lastInputChange.delta})
              </span>
            </div>
            <button
              id="btn-dismiss-change-impact"
              type="button"
              onClick={() => setShowChangeBanner(false)}
              className="text-[#8b949e] hover:text-white px-1 cursor-pointer text-xs"
              title="Dismiss banner"
            >
              ✕
            </button>
          </div>

          <div className="text-[#e6edf3] leading-snug">
            <b className="text-[#79c0ff]">Physics Consequence: </b>
            {lastInputChange.physicalEffect}
          </div>

          <div className="flex items-center justify-between text-[8.5px] text-[#8b949e] pt-0.5 border-t border-[#388bfd]/20 mt-0.5">
            <span className="truncate text-emerald-300">
              <b>Standard Impact: </b>
              {lastInputChange.standardImpact}
            </span>
            <span className="shrink-0 text-[8px] text-cyan-400/90 font-mono italic">
              {lastInputChange.governingEquation}
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DIAGNOSTIC VIEW 5-TAB SWITCHER */}
      {/* ========================================================================= */}
      <div className="flex items-center p-0.5 bg-[#161b22] border border-[#30363d] rounded-md gap-0.5 shrink-0 overflow-x-auto">
        <button
          id="btn-tab-telemetry"
          type="button"
          onClick={() => setActiveTab('telemetry')}
          className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 text-[9.5px] font-mono font-bold rounded transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'telemetry'
              ? 'bg-[#21262d] text-[#58a6ff] shadow-sm border border-[#30363d]'
              : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1c2128]'
          }`}
          title="Telemetry & KPIs"
        >
          <Activity size={10} className={activeTab === 'telemetry' ? 'text-[#58a6ff]' : 'text-[#8b949e]'} />
          <span>Telemetry</span>
          {hasKpiCritical ? (
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          ) : hasKpiWarning ? (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          ) : (
            <span className="text-[8px] px-1 py-0.2 bg-[#30363d]/60 rounded text-[#8b949e]">
              {safeKpis.length}
            </span>
          )}
        </button>

        <button
          id="btn-tab-factors"
          type="button"
          onClick={() => setActiveTab('factors')}
          className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 text-[9.5px] font-mono font-bold rounded transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'factors'
              ? 'bg-[#21262d] text-[#58a6ff] shadow-sm border border-[#30363d]'
              : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1c2128]'
          }`}
          title="Contributing Physical Factors"
        >
          <Cpu size={10} className={activeTab === 'factors' ? 'text-[#58a6ff]' : 'text-[#8b949e]'} />
          <span>Factors</span>
          <span className="text-[8px] px-1 py-0.2 bg-[#30363d]/60 rounded text-[#8b949e]">
            {resolvedPhysicsData.factors.length}
          </span>
        </button>

        <button
          id="btn-tab-standards"
          type="button"
          onClick={() => setActiveTab('standards')}
          className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 text-[9.5px] font-mono font-bold rounded transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'standards'
              ? 'bg-[#21262d] text-[#58a6ff] shadow-sm border border-[#30363d]'
              : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1c2128]'
          }`}
          title="Approved International Standards Audit"
        >
          <Award size={10} className={activeTab === 'standards' ? 'text-[#58a6ff]' : 'text-[#8b949e]'} />
          <span>Standards</span>
          {violationCount > 0 ? (
            <span className="text-[8px] px-1 py-0.2 bg-rose-950 text-rose-400 border border-rose-700/60 rounded font-bold animate-pulse">
              !{violationCount}
            </span>
          ) : marginalCount > 0 ? (
            <span className="text-[8px] px-1 py-0.2 bg-amber-950 text-amber-400 border border-amber-700/60 rounded font-bold">
              {marginalCount}
            </span>
          ) : (
            <span className="text-[8px] px-1 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-700/60 rounded font-bold">
              {compliantCount}/{resolvedCompliance.length}
            </span>
          )}
        </button>

        <button
          id="btn-tab-guidance"
          type="button"
          onClick={() => setActiveTab('guidance')}
          className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 text-[9.5px] font-mono font-bold rounded transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'guidance'
              ? 'bg-[#21262d] text-[#58a6ff] shadow-sm border border-[#30363d]'
              : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1c2128]'
          }`}
          title="Actionable Input Adjustments Matrix"
        >
          <Sliders size={10} className={activeTab === 'guidance' ? 'text-[#58a6ff]' : 'text-[#8b949e]'} />
          <span>Guidance</span>
          {highPriorityActions > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#f27d26] animate-pulse" />
          )}
        </button>

        <button
          id="btn-tab-studios"
          type="button"
          onClick={() => setActiveTab('studios')}
          className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 text-[9.5px] font-mono font-bold rounded transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'studios'
              ? 'bg-[#21262d] text-[#58a6ff] shadow-sm border border-[#30363d]'
              : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1c2128]'
          }`}
          title="SCADA Logs & Cross-Machinery Studios"
        >
          <Network size={10} className={activeTab === 'studios' ? 'text-[#58a6ff]' : 'text-[#8b949e]'} />
          <span>Studios</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB 1: TELEMETRY & GAUGES */}
      {/* ========================================================================= */}
      {activeTab === 'telemetry' && (
        <div className="flex flex-col gap-2 animate-fadeIn">
          {/* 6 KPI Grid */}
          {safeKpis.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5">
              {safeKpis.slice(0, 6).map((kpi) => {
                const rawVal =
                  kpi.rawNumericValue !== undefined
                    ? kpi.rawNumericValue
                    : typeof kpi.value === 'number'
                    ? kpi.value
                    : parseFloat(String(kpi.value));

                const isNumeric = !isNaN(rawVal);
                const trendDir = trendDirectionsRef.current[kpi.id] || 'flat';

                let kpiValColor = 'text-white';
                if (kpi.status === 'safe') kpiValColor = 'text-emerald-400';
                else if (kpi.status === 'warning') kpiValColor = 'text-amber-400';
                else if (kpi.status === 'critical') kpiValColor = 'text-rose-400';

                return (
                  <div
                    key={kpi.id}
                    className="p-1.5 px-2 bg-[#161b22] border border-[#30363d] rounded-md shadow-sm flex flex-col justify-between hover:border-[#58a6ff]/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-mono text-[#8b949e] uppercase truncate font-medium">
                        {kpi.label}
                      </span>
                      {trendDir !== 'flat' && (
                        <div className="shrink-0 flex items-center">
                          {trendDir === 'up' ? (
                            <TrendingUp size={10} className="text-emerald-400" />
                          ) : (
                            <TrendingDown size={10} className="text-amber-400" />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1 my-0.5">
                      {isNumeric ? (
                        <AnimatedCounter
                          value={rawVal}
                          decimals={
                            kpi.decimals !== undefined
                              ? kpi.decimals
                              : rawVal % 1 === 0
                              ? 0
                              : 2
                          }
                          className={`text-xs md:text-sm font-bold font-mono leading-none ${kpiValColor}`}
                        />
                      ) : (
                        <span className={`text-xs md:text-sm font-bold font-mono leading-none ${kpiValColor}`}>
                          {kpi.value}
                        </span>
                      )}

                      {kpi.unit && (
                        <span className="text-[9px] font-mono text-[#8b949e] font-medium">
                          {kpi.unit}
                        </span>
                      )}
                    </div>

                    {kpi.helperText && (
                      <span className="text-[8px] font-mono text-[#8b949e]/80 truncate">
                        {kpi.helperText}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Dials & Envelope Toggle */}
          {safeGauges.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-1 bg-[#161b22] p-0.5 rounded border border-[#30363d] text-[9px] font-mono">
                  <button
                    id="btn-subtab-radial-dials"
                    type="button"
                    onClick={() => setDialsViewMode('gauges')}
                    className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                      dialsViewMode === 'gauges'
                        ? 'bg-[#21262d] text-[#58a6ff] font-bold border border-[#30363d]'
                        : 'text-[#8b949e] hover:text-white'
                    }`}
                  >
                    Radial Dials
                  </button>
                  <button
                    id="btn-subtab-zone-envelope"
                    type="button"
                    onClick={() => setDialsViewMode('envelope')}
                    className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                      dialsViewMode === 'envelope'
                        ? 'bg-[#21262d] text-[#58a6ff] font-bold border border-[#30363d]'
                        : 'text-[#8b949e] hover:text-white'
                    }`}
                  >
                    Operating Zone Map
                  </button>
                </div>
                <span className="text-[8px] font-mono text-[#8b949e]">
                  {dialsViewMode === 'gauges' ? 'Twin Arc Dials' : 'Compliance Envelope'}
                </span>
              </div>

              {dialsViewMode === 'gauges' ? (
                <div className={`grid ${safeGauges.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-1.5`}>
                  {safeGauges.slice(0, 2).map((gauge) => (
                    <CircularArcGauge key={gauge.id} gauge={gauge} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {safeGauges.slice(0, 2).map((gauge) => (
                    <ZoneEnvelopeDiagram key={gauge.id} gauge={gauge} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mini Sparkline Trend */}
          {activeTrendData.length >= 2 && (
            <div className="p-2 bg-[#161b22] border border-[#30363d] rounded-md shadow-sm flex items-center justify-between gap-2">
              <div className="flex flex-col min-w-0">
                <span className="text-[9.5px] font-mono text-[#8b949e] uppercase font-bold tracking-wider truncate">
                  {trendLabel}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5 text-[8.5px] font-mono text-[#8b949e]">
                  <span>Min: <b className="text-white">{typeof minTrend === 'number' && !isNaN(minTrend) ? minTrend.toFixed(1) : '0.0'}</b></span>
                  <span>•</span>
                  <span>Max: <b className="text-white">{typeof maxTrend === 'number' && !isNaN(maxTrend) ? maxTrend.toFixed(1) : '0.0'}</b></span>
                </div>
              </div>

              <div className="shrink-0 flex items-center">
                <Sparkline
                  data={activeTrendData}
                  width={90}
                  height={22}
                  color={sparkColor}
                />
              </div>
            </div>
          )}

          {/* Recommended Action Box */}
          {recommendedAction && (
            <div className="p-2 bg-[#161b22] border border-[#58a6ff]/30 rounded-md shadow-sm flex items-start gap-1.5">
              <ArrowRight size={12} className="text-[#58a6ff] shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-mono font-bold text-[#58a6ff] uppercase block">
                  Recommended Immediate Action
                </span>
                <p className="text-[10px] font-mono text-white leading-tight mt-0.5">
                  {recommendedAction}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 2: CONTRIBUTING PHYSICAL FACTORS */}
      {/* ========================================================================= */}
      {activeTab === 'factors' && (
        <div className="flex flex-col gap-2 animate-fadeIn">
          {/* Governing Physics Equation Card */}
          <div className="p-2 bg-[#161b22] border border-[#30363d] rounded-md shadow-sm flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold text-[#8b949e] uppercase tracking-wider">
                Governing Physics Equation
              </span>
              <span className="text-[8px] font-mono text-[#58a6ff] bg-[#58a6ff]/10 px-1.5 py-0.5 rounded border border-[#58a6ff]/30">
                Closed-Form Physics
              </span>
            </div>
            <div className="p-1.5 bg-[#0d1117] border border-[#30363d] rounded font-mono text-[10.5px] text-[#79c0ff] text-center font-bold tracking-wide select-all overflow-x-auto">
              {resolvedPhysicsData.governingEquation}
            </div>
            <p className="text-[8.5px] font-mono text-[#8b949e] leading-snug">
              {resolvedPhysicsData.equationDescription}
            </p>
          </div>

          {/* Factors List */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-mono font-bold text-[#8b949e] uppercase tracking-wider px-0.5">
              Parameter Sensitivity Breakdown ({resolvedPhysicsData.factors.length} Factors)
            </span>
            {resolvedPhysicsData.factors.map((factor) => {
              const impactBg =
                factor.impactDirection === 'positive'
                  ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-400'
                  : factor.impactDirection === 'negative'
                  ? 'bg-rose-950/70 border-rose-700/60 text-rose-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300';

              const barColor =
                factor.impactDirection === 'positive'
                  ? 'bg-emerald-500'
                  : factor.impactDirection === 'negative'
                  ? 'bg-rose-500'
                  : 'bg-blue-500';

              return (
                <div
                  key={factor.factorName}
                  className="p-2 bg-[#161b22] border border-[#30363d] rounded-md shadow-sm flex flex-col gap-1 hover:border-[#58a6ff]/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-[10px] font-bold text-white truncate">
                        {factor.factorName}
                      </span>
                      {factor.symbol && (
                        <span className="text-[9px] font-mono text-[#58a6ff] bg-[#58a6ff]/10 px-1 rounded">
                          ({factor.symbol})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[9px] font-mono font-bold text-[#c9d1d9]">
                        {typeof factor.value === 'number' ? factor.value.toFixed(2) : factor.value} {factor.unit}
                      </span>
                      <span className={`text-[8px] font-mono font-bold px-1 py-0.2 rounded border uppercase ${impactBg}`}>
                        {factor.impactDirection === 'positive' ? '▲ Favorable' : factor.impactDirection === 'negative' ? '▼ Adverse' : '◆ Neutral'}
                      </span>
                    </div>
                  </div>

                  {/* Relative Sensitivity Bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${Math.min(100, Math.max(5, factor.contributionPercent))}%` }}
                      />
                    </div>
                    <span className="text-[8px] font-mono text-[#8b949e] shrink-0">
                      {factor.contributionPercent.toFixed(0)}% weight
                    </span>
                  </div>

                  {/* Physics Explanation */}
                  <p className="text-[8.5px] font-mono text-[#8b949e] leading-snug">
                    {factor.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB 3: APPROVED INTERNATIONAL STANDARDS AUDIT */}
      {/* ========================================================================= */}
      {activeTab === 'standards' && (
        <div className="flex flex-col gap-2 animate-fadeIn">
          {/* Summary Scorecard Header */}
          <div className="p-2 bg-[#161b22] border border-[#30363d] rounded-md shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale size={14} className="text-[#58a6ff]" />
              <div className="flex flex-col">
                <span className="text-[9.5px] font-mono font-bold text-white uppercase tracking-wider">
                  International Standards Audit
                </span>
                <span className="text-[8px] font-mono text-[#8b949e]">
                  API • ISO • ASME • AGMA Normative Criteria
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 font-mono text-[9px]">
              {violationCount > 0 ? (
                <span className="px-1.5 py-0.5 bg-rose-950 text-rose-300 border border-rose-700/80 rounded font-bold">
                  {violationCount} VIOLATION{violationCount > 1 ? 'S' : ''}
                </span>
              ) : marginalCount > 0 ? (
                <span className="px-1.5 py-0.5 bg-amber-950 text-amber-300 border border-amber-700/80 rounded font-bold">
                  {marginalCount} MARGINAL
                </span>
              ) : (
                <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700/80 rounded font-bold flex items-center gap-1">
                  <CheckCircle2 size={10} className="text-emerald-400" />
                  100% COMPLIANT
                </span>
              )}
            </div>
          </div>

          {/* Standards Checks List */}
          <div className="flex flex-col gap-1.5">
            {resolvedCompliance.map((item, idx) => {
              const isViol = item.status === 'violation';
              const isMarg = item.status === 'marginal';
              const isComp = item.status === 'compliant';

              const cardBorder = isViol
                ? 'border-rose-700/60 bg-rose-950/20'
                : isMarg
                ? 'border-amber-700/60 bg-amber-950/20'
                : 'border-[#30363d] bg-[#161b22]';

              const statusBadge = isViol
                ? 'bg-rose-950 text-rose-300 border-rose-700'
                : isMarg
                ? 'bg-amber-950 text-amber-300 border-amber-700'
                : 'bg-emerald-950 text-emerald-300 border-emerald-700';

              return (
                <div
                  key={`${item.standard}-${idx}`}
                  className={`p-2 border rounded-md shadow-sm flex flex-col gap-1 transition-colors ${cardBorder}`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-white truncate">
                          {item.standard}
                        </span>
                        <span className="text-[8.5px] font-mono text-[#58a6ff] bg-[#58a6ff]/10 px-1 rounded">
                          {item.clause}
                        </span>
                      </div>
                      <span className="text-[8.5px] font-mono text-[#8b949e] truncate">
                        {item.parameter}
                      </span>
                    </div>

                    <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${statusBadge}`}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Limits and Values */}
                  <div className="grid grid-cols-3 gap-1 p-1.5 bg-[#0d1117] rounded border border-[#30363d]/60 text-[9px] font-mono">
                    <div className="flex flex-col">
                      <span className="text-[#8b949e] text-[8px] uppercase">Allowable Limit</span>
                      <span className="text-white font-bold truncate">{item.permissibleLimit}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#8b949e] text-[8px] uppercase">Actual Value</span>
                      <span className={`font-bold truncate ${isViol ? 'text-rose-400' : isMarg ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {item.actualValue}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#8b949e] text-[8px] uppercase">Safety Margin</span>
                      <span className="text-[#c9d1d9] font-bold truncate">{item.margin}</span>
                    </div>
                  </div>

                  {/* Standard Recommendation Note */}
                  <div className="flex items-start gap-1 text-[8.5px] font-mono text-[#8b949e] pt-0.5">
                    <Info size={10} className="text-[#58a6ff] shrink-0 mt-0.5" />
                    <span className="text-[#c9d1d9] leading-tight">{item.recommendation}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB 4: WHAT USER NEEDS TO CHANGE (ACTION MATRIX) */}
      {/* ========================================================================= */}
      {activeTab === 'guidance' && (
        <div className="flex flex-col gap-2 animate-fadeIn">
          {/* Guidance Header */}
          <div className="p-2 bg-[#161b22] border border-[#30363d] rounded-md shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ListChecks size={13} className="text-[#58a6ff]" />
              <div className="flex flex-col">
                <span className="text-[9.5px] font-mono font-bold text-white uppercase tracking-wider">
                  Corrective Adjustment Matrix
                </span>
                <span className="text-[8px] font-mono text-[#8b949e]">
                  Targeted slider movements to restore compliance
                </span>
              </div>
            </div>
            <span className="text-[8.5px] font-mono text-cyan-300 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
              {resolvedGuidance.length} Guidance Item{resolvedGuidance.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Recommendations List */}
          <div className="flex flex-col gap-1.5">
            {resolvedGuidance.map((rec) => {
              const priorityBadge =
                rec.priority === 'high'
                  ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                  : rec.priority === 'medium'
                  ? 'bg-amber-950 text-amber-300 border-amber-700'
                  : 'bg-blue-950 text-blue-300 border-blue-700';

              return (
                <div
                  key={rec.parameter}
                  className="p-2 bg-[#161b22] border border-[#30363d] rounded-md shadow-sm flex flex-col gap-1.5 hover:border-[#58a6ff]/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <SlidersHorizontal size={11} className="text-[#58a6ff] shrink-0" />
                      <span className="text-[10px] font-mono font-bold text-white truncate">
                        {rec.parameter}
                      </span>
                    </div>
                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase shrink-0 ${priorityBadge}`}>
                      {rec.priority} Priority
                    </span>
                  </div>

                  {/* Target Adjustment Box */}
                  <div className="p-1.5 bg-[#0d1117] rounded border border-[#30363d]/60 flex items-center justify-between text-[9px] font-mono">
                    <div className="flex items-center gap-1">
                      <span className="text-[#8b949e]">Current:</span>
                      <span className="text-[#e6edf3] font-bold">{rec.currentSetting}</span>
                    </div>
                    <ArrowRight size={10} className="text-[#58a6ff] shrink-0" />
                    <div className="flex items-center gap-1">
                      <span className="text-[#8b949e]">Target:</span>
                      <span className="text-emerald-400 font-bold">{rec.recommendedSetting}</span>
                    </div>
                    <span className="text-[8px] px-1 py-0.2 bg-[#21262d] text-cyan-300 rounded font-bold">
                      Δ {rec.requiredDelta}
                    </span>
                  </div>

                  {/* Physical Rationale */}
                  <div className="text-[8.5px] font-mono text-[#8b949e] leading-snug">
                    <b className="text-[#c9d1d9]">Physics Mechanism: </b>
                    {rec.physicalRationale}
                  </div>

                  {/* Standard Impact */}
                  <div className="flex items-center gap-1 text-[8px] font-mono text-emerald-400">
                    <CheckCircle2 size={9} className="shrink-0" />
                    <span><b>Outcome:</b> {rec.expectedStandardImpact}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. TAB 5: SCADA LOGS & SPECIALIZED STUDIOS */}
      {/* ========================================================================= */}
      {activeTab === 'studios' && (
        <div className="flex flex-col gap-2 animate-fadeIn">
          {/* SCADA Event Log */}
          <div className="p-2 bg-[#161b22] border border-[#30363d] rounded-md shadow-sm flex flex-col gap-1">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-1">
              <div className="flex items-center gap-1.5 text-[9.5px] font-mono font-bold text-[#8b949e] uppercase">
                <Clock size={10} className="text-[#8b949e]" />
                <span>SCADA Event Log</span>
              </div>
              <div className="flex items-center gap-1 text-[8.5px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE</span>
              </div>
            </div>

            <div className="flex flex-col divide-y divide-[#30363d]/40">
              {activeEvents.length > 0 ? (
                activeEvents.map((evt) => (
                  <div key={evt.id} className="flex items-start gap-1 py-0.5 text-[9px] font-mono leading-tight">
                    <span className="text-[#8b949e] shrink-0 text-[8.5px]">
                      {evt.timestamp || '—'}
                    </span>
                    <span
                      className={`truncate flex-1 font-medium ${
                        evt.level === 'critical'
                          ? 'text-rose-400 font-bold'
                          : evt.level === 'warning'
                          ? 'text-amber-400'
                          : evt.level === 'safe'
                          ? 'text-emerald-300'
                          : 'text-[#c9d1d9]'
                      }`}
                    >
                      {evt.message}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-[9px] font-mono text-[#8b949e] py-0.5">
                  Telemetry nominal. No active alarms.
                </span>
              )}
            </div>
          </div>

          {/* Pillar Quick Launch Buttons */}
          <div className="flex flex-col gap-1.5">
            <button
              id="btn-launch-reliability-studio"
              type="button"
              onClick={() => setIsReliabilityStudioOpen(true)}
              className="px-2 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 hover:border-emerald-400 rounded flex items-center justify-between transition-colors text-left group touch-manipulation cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <TrendingUp size={12} className="text-emerald-400 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9.5px] font-mono font-bold text-emerald-400 uppercase tracking-wider truncate">
                    Pillar 3 • Reliability & LCC Studio
                  </span>
                  <span className="text-[8.5px] font-mono text-[#8b949e] group-hover:text-[#c9d1d9] truncate">
                    Parametric Sweeps, P-F Curves & 15-Yr LCC
                  </span>
                </div>
              </div>
              <ArrowRight size={11} className="text-emerald-400 shrink-0 transform group-hover:translate-x-0.5 transition-transform ml-1" />
            </button>

            <button
              id="btn-launch-machinery-train-studio"
              type="button"
              onClick={() => setIsMachineryTrainStudioOpen(true)}
              className="px-2 py-1.5 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/40 hover:border-blue-400 rounded flex items-center justify-between transition-colors text-left group touch-manipulation cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Network size={12} className="text-blue-400 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9.5px] font-mono font-bold text-blue-400 uppercase tracking-wider truncate">
                    Pillar 4 • Coupled Machinery Train
                  </span>
                  <span className="text-[8.5px] font-mono text-[#8b949e] group-hover:text-[#c9d1d9] truncate">
                    Cross-System Failure Cascades & SIS Trips
                  </span>
                </div>
              </div>
              <ArrowRight size={11} className="text-blue-400 shrink-0 transform group-hover:translate-x-0.5 transition-transform ml-1" />
            </button>

            <button
              id="btn-launch-spectral-lab"
              type="button"
              onClick={() => setIsSpectralLabOpen(true)}
              className="px-2 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/40 hover:border-cyan-400 rounded flex items-center justify-between transition-colors text-left group touch-manipulation cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Activity size={12} className="text-cyan-400 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9.5px] font-mono font-bold text-cyan-400 uppercase tracking-wider truncate">
                    Pillar 5 • Spectral Lab & FFT
                  </span>
                  <span className="text-[8.5px] font-mono text-[#8b949e] group-hover:text-[#c9d1d9] truncate">
                    Harmonics, 1X/2X Orbits & Bearing Faults
                  </span>
                </div>
              </div>
              <ArrowRight size={11} className="text-cyan-400 shrink-0 transform group-hover:translate-x-0.5 transition-transform ml-1" />
            </button>

            {/* Compliance & Audit Quick Triggers */}
            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-[#21262d]">
              <button
                id="btn-launch-audit-quick"
                type="button"
                onClick={() => setIsAuditModalOpen(true)}
                className="px-2 py-1.5 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff]/50 rounded flex items-center gap-1.5 transition-colors text-left group cursor-pointer"
              >
                <BookOpen size={11} className="text-[#58a6ff] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-mono font-bold text-[#c9d1d9] group-hover:text-[#58a6ff] truncate">
                    Audit Trail
                  </span>
                  <span className="text-[8px] font-mono text-[#8b949e] truncate">
                    Equations & Proofs
                  </span>
                </div>
              </button>

              <button
                id="btn-launch-report-quick"
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="px-2 py-1.5 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] hover:border-emerald-500/50 rounded flex items-center gap-1.5 transition-colors text-left group cursor-pointer"
              >
                <FileText size={11} className="text-emerald-400 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-mono font-bold text-[#c9d1d9] group-hover:text-emerald-400 truncate">
                    Compliance Report
                  </span>
                  <span className="text-[8px] font-mono text-[#8b949e] truncate">
                    Export / Print PDF
                  </span>
                </div>
              </button>

              <button
                id="btn-launch-diag-quick"
                type="button"
                onClick={() => setIsDiagnosticModalOpen(true)}
                className="px-2 py-1.5 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] hover:border-amber-500/50 rounded flex items-center gap-1.5 transition-colors text-left group cursor-pointer"
              >
                <Wrench size={11} className="text-amber-400 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-mono font-bold text-[#c9d1d9] group-hover:text-amber-400 truncate">
                    Troubleshooter
                  </span>
                  <span className="text-[8px] font-mono text-[#8b949e] truncate">
                    Root Cause Tree
                  </span>
                </div>
              </button>

              <button
                id="btn-launch-cases-quick"
                type="button"
                onClick={() => setIsCaseStudiesModalOpen(true)}
                className="px-2 py-1.5 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] hover:border-rose-500/50 rounded flex items-center gap-1.5 transition-colors text-left group cursor-pointer"
              >
                <AlertOctagon size={11} className="text-rose-400 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-mono font-bold text-[#c9d1d9] group-hover:text-rose-400 truncate">
                    Case Studies
                  </span>
                  <span className="text-[8px] font-mono text-[#8b949e] truncate">
                    Forensic Failures
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
