import { useEffect, useMemo, useState } from 'react';
import { formatOdometerValue, parseOdometerMetric } from '../engines/mathUtils';

interface OdometerMetricProps {
  value: string;
  durationMs?: number;
  className?: string;
}

export function OdometerMetric({
  value,
  durationMs = 1150,
  className = '',
}: OdometerMetricProps) {
  const parsed = useMemo(() => parseOdometerMetric(value), [value]);
  const [rendered, setRendered] = useState<string>(value);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setRendered(value);
      return;
    }

    let rafId = 0;
    const start = performance.now();

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / durationMs);
      setRendered(formatOdometerValue(parsed, progress));
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [durationMs, parsed, value]);

  return (
    <strong
      className={`tabular-nums ${className}`}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {rendered}
    </strong>
  );
}
