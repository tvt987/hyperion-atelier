import { useEffect, useRef, useState } from 'react';

interface KineticTextProps {
  text: string;
  className?: string;
  accent?: boolean;
  scrollVelocityRef?: React.MutableRefObject<number>;
}

/**
 * Character-level magnetic spring lift + subtle scroll-velocity kinetic stretch.
 */
export function KineticText({
  text,
  className = '',
  accent = false,
  scrollVelocityRef,
}: KineticTextProps) {
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!scrollVelocityRef) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let rafId = 0;
    let currentStretch = 1;

    const tick = () => {
      const vel = Math.abs(scrollVelocityRef.current);
      const targetStretch = 1 + Math.min(0.045, vel * 0.0024);
      currentStretch += (targetStretch - currentStretch) * 0.14;
      if (wrapRef.current) {
        if (Math.abs(currentStretch - 1) > 0.0005) {
          wrapRef.current.style.transform = `scaleX(${currentStretch.toFixed(4)})`;
        } else if (wrapRef.current.style.transform) {
          wrapRef.current.style.transform = '';
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [scrollVelocityRef]);

  const chars = Array.from(text);

  return (
    <span
      ref={wrapRef}
      aria-label={text}
      onMouseLeave={() => setHoveredIdx(null)}
      className={`inline-block origin-left will-change-transform ${className}`}
    >
      {chars.map((ch, idx) => {
        const dist = hoveredIdx === null ? 99 : Math.abs(hoveredIdx - idx);
        const lift = dist === 0 ? -7 : dist === 1 ? -3.5 : dist === 2 ? -1.2 : 0;
        const isPrimaryHover = dist === 0;
        return (
          <span
            key={`${idx}-${ch}`}
            aria-hidden="true"
            onMouseEnter={() => setHoveredIdx(idx)}
            style={{
              transform: lift !== 0 ? `translate3d(0, ${lift}px, 0)` : 'translate3d(0, 0, 0)',
              color: isPrimaryHover
                ? accent
                  ? 'var(--fg-primary)'
                  : 'var(--accent)'
                : undefined,
              transition:
                'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), color 180ms ease',
            }}
            className="inline-block will-change-transform"
          >
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        );
      })}
    </span>
  );
}

const DECODE_GLYPHS = '0123456789ABCDEF/·_-';

interface GlyphDecodeTextProps {
  text: string;
  className?: string;
}

/**
 * Crisp 160ms monospaced glyph-decode hover micro-effect for nav links & CTA pills.
 */
export function GlyphDecodeText({ text, className = '' }: GlyphDecodeTextProps) {
  const [display, setDisplay] = useState(text);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    setDisplay(text);
  }, [text]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const triggerDecode = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const duration = 160;
    const chars = Array.from(text);

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      if (progress >= 1) {
        setDisplay(text);
        return;
      }
      const lockedCount = Math.floor(progress * chars.length);
      const next = chars
        .map((c, idx) => {
          if (idx < lockedCount || c === ' ' || c === '↗' || c === '↓' || c === '·') {
            return c;
          }
          const glyphIdx = (idx * 7 + Math.floor(now * 0.08)) % DECODE_GLYPHS.length;
          return DECODE_GLYPHS[glyphIdx];
        })
        .join('');
      setDisplay(next);
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
  };

  return (
    <span
      onMouseEnter={triggerDecode}
      onMouseLeave={() => {
        cancelAnimationFrame(rafRef.current);
        setDisplay(text);
      }}
      className={className}
    >
      {display}
    </span>
  );
}
