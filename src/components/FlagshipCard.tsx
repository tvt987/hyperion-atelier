import { useRef } from 'react';
import type { FlagshipWorkItem } from '../data/atelierContent';
import { computeCardTilt } from '../engines/mathUtils';
import { tactileAudio } from '../engines/tactileAudio';

interface FlagshipCardProps {
  item: FlagshipWorkItem;
  lang: 'en' | 'vi';
  onInspect: (item: FlagshipWorkItem) => void;
  isTransitionTarget?: boolean;
}

export function FlagshipCard({
  item,
  lang,
  onInspect,
  isTransitionTarget = false,
}: FlagshipCardProps) {
  const cardRef = useRef<HTMLElement | null>(null);
  const imgSrc = `./${item.previewImage}`;

  const handleMouseMove = (ev: React.MouseEvent<HTMLElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ev.clientX - r.left;
    const y = ev.clientY - r.top;
    const relX = x / Math.max(1, r.width);
    const relY = y / Math.max(1, r.height);
    const { rotateX, rotateY, sheenAngle } = computeCardTilt(relX, relY, 4.5);

    el.style.setProperty('--spot-x', `${x}px`);
    el.style.setProperty('--spot-y', `${y}px`);
    el.style.setProperty('--tilt-x', `${rotateX.toFixed(2)}deg`);
    el.style.setProperty('--tilt-y', `${rotateY.toFixed(2)}deg`);
    el.style.setProperty('--sheen-angle', `${sheenAngle}deg`);
  };

  const handleMouseLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
  };

  return (
    <div className="scroll-view-reveal perspective-[1100px]">
      <article
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => tactileAudio.playTick(1280)}
        className="flagship-card group flex flex-col will-change-transform"
      >
        {/* Iridescent Chromatic Edge Sheen Overlay */}
        <div className="flagship-iridescent-rim" aria-hidden="true" />

        {/* Edge-to-Edge Live Visual Preview */}
        <div
          style={
            isTransitionTarget
              ? { viewTransitionName: 'active-flagship-visual' }
              : undefined
          }
          className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--bg-panel)] border-b border-[var(--hairline)]"
        >
          <a
            href={item.liveUrl}
            target="_blank"
            rel="noreferrer"
            data-cursor="OPEN LIVE ↗"
            className="block w-full h-full"
          >
            <img
              src={imgSrc}
              alt={`${item.title} live interface preview`}
              loading="lazy"
              className="card-media w-full h-full object-cover object-top"
            />
          </a>

          {/* Minimal Floating Index + Live Pill */}
          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
            <span className="px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/15 font-mono-tech text-[10px] font-semibold text-white/90">
              {item.index} · {item.version}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/15 font-mono-tech text-[10px] font-semibold text-white flex items-center gap-1.5 group-hover:bg-[var(--accent)] group-hover:border-transparent transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] group-hover:bg-white" />
              LIVE ↗
            </span>
          </div>

          {/* Crisp Floating Inspect Lightbox Trigger */}
          <button
            type="button"
            data-testid={`btn-inspect-${item.id}`}
            data-cursor="INSPECT"
            onClick={(ev) => {
              ev.stopPropagation();
              tactileAudio.playLatch();
              onInspect(item);
            }}
            className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/72 hover:bg-[var(--accent)] backdrop-blur-md border border-white/20 hover:border-transparent font-mono-tech text-[10px] font-semibold text-white flex items-center gap-1.5 transition cursor-pointer"
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="M10 2h4v4M6 14H2v-4M14 2l-4.5 4.5M2 14l4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{lang === 'vi' ? 'Xem Nhanh' : 'Inspect'}</span>
          </button>
        </div>

        {/* Tight Keyword-Only Card Footer */}
        <div className="p-5 sm:p-6 flex flex-col gap-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <h3 className="font-display text-xl sm:text-2xl font-bold text-[var(--fg-primary)] tracking-tight truncate">
                  {item.title}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[var(--fg-secondary)] mt-0.5 truncate">
                {lang === 'vi' ? item.taglineVi : item.taglineEn}
              </p>
            </div>
            <span className="shrink-0 px-2.5 py-1 rounded-full bg-[var(--bg-panel)] border border-[var(--hairline)] font-mono-tech text-[10px] font-semibold text-[var(--signal-ok)]">
              {item.ciBadge}
            </span>
          </div>

          {/* Highlight Metric + Keywords Row */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-soft)' }}
              className="px-2.5 py-1 rounded-full font-mono-tech text-[10.5px] font-semibold"
            >
              {item.highlightMetric}
            </span>
            {item.keywords.map((kw) => (
              <span
                key={kw}
                className="px-2.5 py-1 rounded-full bg-[var(--bg-panel)] border border-[var(--hairline)] font-mono-tech text-[10.5px] text-[var(--fg-secondary)]"
              >
                {kw}
              </span>
            ))}
          </div>

          {/* Clean Action Links */}
          <div className="pt-1 flex items-center justify-between border-t border-[var(--hairline)] font-mono-tech text-[11px]">
            <a
              href={item.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--fg-primary)] hover:text-[var(--accent)] font-semibold transition"
            >
              {lang === 'vi' ? 'Mở Trực Tiếp ↗' : 'Launch App ↗'}
            </a>
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => {
                  tactileAudio.playLatch();
                  onInspect(item);
                }}
                className="text-[var(--fg-muted)] hover:text-[var(--fg-primary)] transition cursor-pointer"
              >
                {lang === 'vi' ? 'Phóng To' : 'Inspect'}
              </button>
              <a
                href={item.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--fg-muted)] hover:text-[var(--fg-primary)] transition"
              >
                GitHub ↗
              </a>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
