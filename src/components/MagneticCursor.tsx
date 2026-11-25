import { useEffect, useRef, useState } from 'react';

export function MagneticCursor() {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const [label, setLabel] = useState<string>('');
  const [visible, setVisible] = useState<boolean>(false);
  const [finePointer, setFinePointer] = useState<boolean>(false);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)');
    setFinePointer(mq.matches);
    const onChange = (ev: MediaQueryListEvent) => setFinePointer(ev.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!finePointer) return;

    let targetX = -100;
    let targetY = -100;
    let curX = -100;
    let curY = -100;
    let velX = 0;
    let velY = 0;
    let rafId = 0;
    let idleTimer = 0;

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      setVisible(true);
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        setLabel('');
        setVisible(false);
      }, 1500);

      const el = (e.target as HTMLElement | null)?.closest?.('[data-cursor]');
      const nextLabel = el ? el.getAttribute('data-cursor') ?? '' : '';
      setLabel((prev) => (prev === nextLabel ? prev : nextLabel));
    };

    const onScrollOrClick = () => {
      setLabel('');
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScrollOrClick, { passive: true });
    window.addEventListener('pointerdown', onScrollOrClick, { passive: true });

    const tick = () => {
      const stiffness = 0.25;
      const damping = 0.72;
      velX = (velX + (targetX - curX) * stiffness) * damping;
      velY = (velY + (targetY - curY) * stiffness) * damping;
      curX += velX;
      curY += velY;

      if (outerRef.current) {
        outerRef.current.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      window.clearTimeout(idleTimer);
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScrollOrClick);
      window.removeEventListener('pointerdown', onScrollOrClick);
    };
  }, [finePointer]);

  if (!finePointer || !visible) return null;

  return (
    <div
      ref={outerRef}
      aria-hidden="true"
      className="fixed top-0 left-0 z-[90] pointer-events-none -translate-x-1/2 -translate-y-1/2 will-change-transform transition-opacity duration-200"
    >
      {label ? (
        <div
          style={{
            backgroundColor: 'var(--accent)',
            color: '#ffffff',
          }}
          className="px-2 py-0.5 font-mono-tech text-[9.5px] font-semibold tracking-wider uppercase whitespace-nowrap shadow-md"
        >
          [{label}]
        </div>
      ) : (
        <div className="relative w-4 h-4 flex items-center justify-center">
          <span
            style={{ backgroundColor: 'var(--accent)' }}
            className="w-1.5 h-1.5 rounded-full"
          />
          <span
            style={{ borderColor: 'var(--hairline-strong)' }}
            className="absolute inset-0 border rounded-full"
          />
        </div>
      )}
    </div>
  );
}
