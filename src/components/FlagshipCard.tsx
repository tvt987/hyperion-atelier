import type { FlagshipWorkItem } from '../data/atelierContent';
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
  const imgSrc = `./${item.previewImage}`;

  return (
    <div className="scroll-view-reveal">
      <article className="flagship-card group flex flex-col">
        {/* Edge-to-Edge Real Live Interface Capture */}
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
            className="block w-full h-full"
          >
            <img
              src={imgSrc}
              alt={`${item.title} live interface preview`}
              loading="lazy"
              className="card-media w-full h-full object-cover object-top"
            />
          </a>

          {/* Minimal Top Index + Live Pill */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
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

        {/* Clean Card Body */}
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-lg sm:text-xl font-bold text-[var(--fg-primary)] tracking-tight truncate">
                {item.title}
              </h3>
              <p className="text-xs sm:text-[13px] text-[var(--fg-secondary)] mt-0.5 truncate">
                {lang === 'vi' ? item.taglineVi : item.taglineEn}
              </p>
            </div>
            <span className="shrink-0 px-2.5 py-1 rounded-full bg-[var(--bg-panel)] border border-[var(--hairline)] font-mono-tech text-[10px] font-semibold text-[var(--signal-ok)]">
              {item.ciBadge}
            </span>
          </div>

          {/* Highlight Metric */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-soft)' }}
              className="px-2.5 py-1 rounded-full font-mono-tech text-[10.5px] font-semibold"
            >
              {item.highlightMetric}
            </span>
            {item.keywords.slice(0, 3).map((kw) => (
              <span
                key={kw}
                className="px-2.5 py-1 rounded-full bg-[var(--bg-panel)] border border-[var(--hairline)] font-mono-tech text-[10.5px] text-[var(--fg-secondary)]"
              >
                {kw}
              </span>
            ))}
          </div>

          {/* Clean Action Links */}
          <div className="pt-2 flex items-center justify-between border-t border-[var(--hairline)] font-mono-tech text-[11px]">
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
