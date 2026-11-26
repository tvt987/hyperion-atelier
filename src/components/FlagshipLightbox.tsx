import { useEffect } from 'react';
import type { FlagshipWorkItem } from '../data/atelierContent';
import { tactileAudio } from '../engines/tactileAudio';

interface FlagshipLightboxProps {
  items: FlagshipWorkItem[];
  activeId: string | null;
  lang: 'en' | 'vi';
  onClose: () => void;
  onSelectId: (id: string) => void;
}

export function FlagshipLightbox({
  items,
  activeId,
  lang,
  onClose,
  onSelectId,
}: FlagshipLightboxProps) {
  const activeIdx = activeId ? items.findIndex((it) => it.id === activeId) : -1;
  const item = activeIdx >= 0 ? items[activeIdx] : null;

  useEffect(() => {
    if (!item) return;

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        onClose();
      } else if (ev.key === 'ArrowRight') {
        ev.preventDefault();
        tactileAudio.playTick(1460);
        const next = items[(activeIdx + 1) % items.length];
        if (next) onSelectId(next.id);
      } else if (ev.key === 'ArrowLeft') {
        ev.preventDefault();
        tactileAudio.playTick(1240);
        const prev = items[(activeIdx - 1 + items.length) % items.length];
        if (prev) onSelectId(prev.id);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIdx, item, items, onClose, onSelectId]);

  if (!item) return null;

  const goPrev = () => {
    tactileAudio.playTick(1240);
    const prev = items[(activeIdx - 1 + items.length) % items.length];
    if (prev) onSelectId(prev.id);
  };

  const goNext = () => {
    tactileAudio.playTick(1460);
    const next = items[(activeIdx + 1) % items.length];
    if (next) onSelectId(next.id);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} Quick Preview`}
      data-testid="flagship-lightbox"
      onClick={onClose}
      className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="liquid-glass w-full max-w-4xl rounded-3xl overflow-hidden text-[var(--fg-primary)]"
      >
        {/* Top Bar */}
        <div className="px-5 py-3.5 border-b border-[var(--hairline)] flex items-center justify-between gap-3 font-mono-tech text-[11px]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span style={{ backgroundColor: 'var(--accent)' }} className="w-2 h-2 rounded-full shrink-0" />
            <span className="font-bold text-[var(--fg-primary)]">
              {item.index} / 0{items.length}
            </span>
            <span className="text-[var(--fg-muted)]">·</span>
            <span className="text-[var(--fg-secondary)] truncate">
              {item.title} {item.version}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              data-testid="lightbox-prev"
              onClick={goPrev}
              aria-label="Previous flagship"
              className="px-2.5 py-1 rounded-full border border-[var(--hairline)] text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:border-[var(--hairline-strong)] transition cursor-pointer"
            >
              ←
            </button>
            <button
              type="button"
              data-testid="lightbox-next"
              onClick={goNext}
              aria-label="Next flagship"
              className="px-2.5 py-1 rounded-full border border-[var(--hairline)] text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:border-[var(--hairline-strong)] transition cursor-pointer"
            >
              →
            </button>
            <button
              type="button"
              data-testid="lightbox-close"
              onClick={onClose}
              className="px-2.5 py-1 rounded-full border border-[var(--hairline)] text-[var(--fg-muted)] hover:text-[var(--fg-primary)] transition cursor-pointer"
            >
              ESC
            </button>
          </div>
        </div>

        {/* High-Res 16:10 Visual Preview */}
        <div className="relative aspect-[16/10] w-full bg-[var(--bg-panel)] border-b border-[var(--hairline)] overflow-hidden">
          <img
            src={`./${item.previewImage}`}
            alt={`${item.title} full preview`}
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between pointer-events-none">
            <span
              style={{ color: '#ffffff', backgroundColor: 'rgba(6,6,8,0.74)' }}
              className="px-3 py-1 rounded-full backdrop-blur-md border border-white/15 font-mono-tech text-[11px] font-semibold"
            >
              {item.highlightMetric}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 font-mono-tech text-[10.5px] font-semibold text-[#22c55e]">
              {item.ciBadge}
            </span>
          </div>
        </div>

        {/* Keyword & Launch Footer */}
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2.5 min-w-0">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <h3
                data-testid="lightbox-title"
                className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--fg-primary)] tracking-tight"
              >
                {item.title}
              </h3>
              <span className="font-mono-tech text-xs text-[var(--fg-muted)]">
                {lang === 'vi' ? item.taglineVi : item.taglineEn}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {item.keywords.map((kw) => (
                <span
                  key={kw}
                  className="px-2.5 py-1 rounded-full bg-[var(--bg-panel)] border border-[var(--hairline)] font-mono-tech text-[10.5px] text-[var(--fg-secondary)]"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 font-mono-tech text-xs">
            <a
              href={item.liveUrl}
              target="_blank"
              rel="noreferrer"
              style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
              className="px-4 py-2.5 rounded-full font-semibold hover:opacity-90 transition whitespace-nowrap"
            >
              {lang === 'vi' ? 'Mở Live App ↗' : 'Launch Live App ↗'}
            </a>
            <a
              href={item.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-panel)] text-[var(--fg-primary)] hover:border-[var(--accent)] transition whitespace-nowrap"
            >
              Source Code ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
