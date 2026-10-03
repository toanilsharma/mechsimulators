import { useState, useEffect, useRef, useCallback } from 'react';

export type SimulationParamValue = string | number | boolean;
export type SimulationParamRecord = Record<string, SimulationParamValue>;

export interface UseSyncSimulationStateOptions {
  /** Debounce delay in milliseconds before writing parameters to URL (default: 300ms) */
  debounceMs?: number;
  /** If true, parameters that match the initial/default value are omitted from the URL query to keep links compact (default: false) */
  omitDefaults?: boolean;
  /** Custom base URL or path prefix for generated share URLs (defaults to window.location.origin + window.location.pathname) */
  basePath?: string;
  /** Optional callback fired when parameters are successfully synced to URL */
  onSync?: (searchString: string) => void;
}

export interface UseSyncSimulationStateReturn<T extends SimulationParamRecord> {
  /** Current active parameter values (reactive React state) */
  params: T;
  /** Update one or multiple parameters (updates state immediately, debounces URL write) */
  setParams: (updates: Partial<T> | ((prev: T) => Partial<T>)) => void;
  /** Update a single parameter by key */
  setParam: <K extends keyof T>(key: K, value: T[K]) => void;
  /** Reset parameters back to the initial default values */
  resetParams: () => void;
  /** Full shareable URL containing encoded query parameters */
  shareUrl: string;
  /** Copy shareable URL to clipboard with promise feedback */
  copyShareUrl: () => Promise<boolean>;
  /** Whether the initial URL query parameters have finished hydrating */
  isHydrated: boolean;
}

/**
 * Parses URL search string into a typed object based on the defaults schema.
 */
function parseUrlSearchParams<T extends SimulationParamRecord>(
  searchStr: string,
  defaults: T
): T {
  if (!searchStr) return { ...defaults };
  const searchParams = new URLSearchParams(searchStr);
  const result: Record<string, SimulationParamValue> = { ...defaults };

  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const stringKey = String(key);
    if (searchParams.has(stringKey)) {
      const rawValue = searchParams.get(stringKey);
      if (rawValue !== null) {
        const defaultValue = defaults[key];

        if (typeof defaultValue === 'number') {
          const parsedNum = parseFloat(rawValue);
          if (!isNaN(parsedNum)) {
            result[stringKey] = parsedNum;
          }
        } else if (typeof defaultValue === 'boolean') {
          result[stringKey] = rawValue === 'true' || rawValue === '1';
        } else {
          result[stringKey] = rawValue;
        }
      }
    }
  }

  return result as T;
}

/**
 * Serializes typed parameters to a URLSearchParams instance.
 */
function serializeToSearchParams<T extends SimulationParamRecord>(
  params: T,
  defaults: T,
  omitDefaults: boolean = false
): URLSearchParams {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (omitDefaults && defaults[key] === value) {
      continue;
    }
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  }

  return searchParams;
}

/**
 * useSyncSimulationState
 *
 * Universal, production-ready hook for syncing engineering simulator parameters with URL search params.
 * Compatible with Next.js App Router (useSearchParams) and standard React/Vite SPAs.
 *
 * - Reads search params on mount and hydrates slider inputs.
 * - Instantly updates local React state for buttery 60fps sliders.
 * - Debounces writes to the URL query (300ms) via window.history.replaceState without reloads.
 * - Generates full canonical share links with copy-to-clipboard functionality.
 */
export function useSyncSimulationState<T extends SimulationParamRecord>(
  defaultParams: T,
  options: UseSyncSimulationStateOptions = {}
): UseSyncSimulationStateReturn<T> {
  const { debounceMs = 300, omitDefaults = false, basePath, onSync } = options;

  const defaultsRef = useRef<T>(defaultParams);
  defaultsRef.current = defaultParams;

  // 1. Initial State from URL Search Params or Defaults
  const [params, setParamsState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultParams;
    return parseUrlSearchParams(window.location.search, defaultParams);
  });

  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>('');

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentParamsRef = useRef<T>(params);
  currentParamsRef.current = params;

  // Compute canonical share URL
  const computeShareUrl = useCallback(
    (current: T): string => {
      if (typeof window === 'undefined') return '';
      const qs = serializeToSearchParams(current, defaultsRef.current, omitDefaults).toString();
      const base = basePath || `${window.location.origin}${window.location.pathname}`;
      return qs ? `${base}?${qs}` : base;
    },
    [basePath, omitDefaults]
  );

  // 2. Hydration on Mount & Handle Browser Back/Forward PopState
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial read
    const initialFromUrl = parseUrlSearchParams(window.location.search, defaultsRef.current);
    setParamsState(initialFromUrl);
    setShareUrl(computeShareUrl(initialFromUrl));
    setIsHydrated(true);

    const handlePopState = () => {
      const updated = parseUrlSearchParams(window.location.search, defaultsRef.current);
      setParamsState(updated);
      setShareUrl(computeShareUrl(updated));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [computeShareUrl]);

  // 3. Debounced Sync to URL Search Parameters
  const syncToUrl = useCallback(
    (newParams: T) => {
      if (typeof window === 'undefined') return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        const urlParams = serializeToSearchParams(newParams, defaultsRef.current, omitDefaults);
        const searchString = urlParams.toString();
        const newUrl = searchString
          ? `${window.location.pathname}?${searchString}`
          : window.location.pathname;

        // Perform non-reloading history update
        if (window.location.search !== `?${searchString}`) {
          window.history.replaceState(null, '', newUrl);
        }

        const fullShare = computeShareUrl(newParams);
        setShareUrl(fullShare);

        if (onSync) {
          onSync(searchString);
        }
      }, debounceMs);
    },
    [debounceMs, omitDefaults, computeShareUrl, onSync]
  );

  // 4. Parameter Update Handlers (Instant local state, debounced URL)
  const setParams = useCallback(
    (updates: Partial<T> | ((prev: T) => Partial<T>)) => {
      setParamsState((prev) => {
        const evaluated = typeof updates === 'function' ? updates(prev) : updates;
        const next = { ...prev, ...evaluated };
        syncToUrl(next);
        return next;
      });
    },
    [syncToUrl]
  );

  const setParam = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setParams({ [key]: value } as unknown as Partial<T>);
    },
    [setParams]
  );

  const resetParams = useCallback(() => {
    const initial = { ...defaultsRef.current };
    setParamsState(initial);
    syncToUrl(initial);
  }, [syncToUrl]);

  // 5. Share URL Copy-to-Clipboard Utility
  const copyShareUrl = useCallback(async (): Promise<boolean> => {
    const currentUrl = shareUrl || computeShareUrl(currentParamsRef.current);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentUrl);
        return true;
      } else {
        // Fallback for non-secure contexts
        const textarea = document.createElement('textarea');
        textarea.value = currentUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      }
    } catch (err) {
      console.error('Failed to copy simulation share URL:', err);
      return false;
    }
  }, [shareUrl, computeShareUrl]);

  return {
    params,
    setParams,
    setParam,
    resetParams,
    shareUrl,
    copyShareUrl,
    isHydrated,
  };
}
