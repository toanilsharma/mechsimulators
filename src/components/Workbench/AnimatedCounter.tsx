import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  decimals = 1,
  prefix = '',
  suffix = '',
  durationMs = 400,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const startValRef = useRef<number>(value);
  const targetValRef = useRef<number>(value);
  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (isNaN(value)) return;
    startValRef.current = displayValue;
    targetValRef.current = value;
    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(1, elapsed / durationMs);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValRef.current + (targetValRef.current - startValRef.current) * easeOut;

      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [value, durationMs]);

  const formatted = isNaN(displayValue)
    ? '—'
    : displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

  return (
    <span className={`tabular-nums font-mono ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
