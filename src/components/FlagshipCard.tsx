import { useRef } from 'react';
import type { FlagshipWorkItem } from '../data/atelierContent';
import { tactileAudio } from '../engines/tactileAudio';

interface FlagshipCardProps {
  item: FlagshipWorkItem;
  lang: 'en' | 'vi';
}

export function FlagshipCard({ item, lang }: FlagshipCardProps) {
  const cardRef = useRef<HTMLElement | null>(null);
  const imgSrc = `./${item.previewImage}`;

  const handleMouseMove = (ev: React.MouseEvent<HTMLElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${ev.clientX - r.left}px`);
    el.style.setProperty('--spot-y', `${ev.clientY - r.top}px`);
  };

  return (
    <article
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => tactileAudio.playTick(1280)}
      className="flagship-card group flex flex-col"
    >
      {/* Edge-to-Edge Live Visual Preview */}
      <a
        href={item.liveUrl}
        target="_blank"
        rel="noreferrer"
        data-cursor="OPEN LIVE ↗"
        className="relative block aspect-[16/10] w-full overflow-hidden bg-[var(--bg-panel)] border-b border-[var(--hairline)]"
      >
        <img
          src={imgSrc}
          alt={`${item.title} live interface preview`}
          loading="lazy"
          className="card-media w-full h-full object-cover object-top"
        />

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
      </a>

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
    </article>
  );
}
