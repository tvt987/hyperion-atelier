import { useEffect, useState } from 'react';
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
  const [mode, setMode] = useState<'preview' | 'sandbox'>('preview');
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);

  const activeIdx = activeId ? items.findIndex((it) => it.id === activeId) : -1;
  const item = activeIdx >= 0 ? items[activeIdx] : null;

  useEffect(() => {
    setIframeLoaded(false);
  }, [activeId, mode]);

  useEffect(() => {
    if (!activeId) {
      setMode('preview');
      setViewport('desktop');
    }
  }, [activeId]);

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
      className="fixed inset-0 z-[110] bg-black/78 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="liquid-glass w-full max-w-5xl rounded-3xl overflow-hidden text-[var(--fg-primary)]"
      >
        {/* Top Bar: Index + Mode Switch (Preview | Live Sandbox) + Controls */}
        <div className="px-4 sm:px-5 py-3 border-b border-[var(--hairline)] flex flex-wrap items-center justify-between gap-2.5 font-mono-tech text-[11px]">
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

          {/* Segmented Mode Switch: Preview vs Live Sandbox */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 rounded-full bg-[var(--bg-panel)] border border-[var(--hairline)] text-[10.5px]">
              <button
                type="button"
                data-testid="lightbox-mode-preview"
                onClick={() => {
                  tactileAudio.playTick(1360);
                  setMode('preview');
                }}
                style={{
                  backgroundColor: mode === 'preview' ? 'var(--fg-primary)' : 'transparent',
                  color: mode === 'preview' ? 'var(--bg-primary)' : 'var(--fg-secondary)',
                }}
                className="px-3 py-1 rounded-full font-semibold transition cursor-pointer"
              >
                Preview
              </button>
              <button
                type="button"
                data-testid="lightbox-mode-sandbox"
                onClick={() => {
                  tactileAudio.playLatch();
                  setMode('sandbox');
                }}
                style={{
                  backgroundColor: mode === 'sandbox' ? 'var(--accent)' : 'transparent',
                  color: mode === 'sandbox' ? '#ffffff' : 'var(--fg-secondary)',
                }}
                className="px-3 py-1 rounded-full font-semibold transition cursor-pointer"
              >
                Live Sandbox
              </button>
            </div>

            {mode === 'sandbox' && (
              <div className="hidden sm:flex items-center p-0.5 rounded-full bg-[var(--bg-panel)] border border-[var(--hairline)] text-[10px]">
                <button
                  type="button"
                  data-testid="sandbox-vp-desktop"
                  onClick={() => setViewport('desktop')}
                  style={{
                    backgroundColor: viewport === 'desktop' ? 'var(--fg-primary)' : 'transparent',
                    color: viewport === 'desktop' ? 'var(--bg-primary)' : 'var(--fg-secondary)',
                  }}
                  className="px-2.5 py-1 rounded-full font-semibold transition cursor-pointer"
                >
                  Desktop
                </button>
                <button
                  type="button"
                  data-testid="sandbox-vp-mobile"
                  onClick={() => setViewport('mobile')}
                  style={{
                    backgroundColor: viewport === 'mobile' ? 'var(--fg-primary)' : 'transparent',
                    color: viewport === 'mobile' ? 'var(--bg-primary)' : 'var(--fg-secondary)',
                  }}
                  className="px-2.5 py-1 rounded-full font-semibold transition cursor-pointer"
                >
                  Mobile 390px
                </button>
              </div>
            )}
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

        {/* Shared-Element View Transition Stage: High-Res Visual OR Interactive Live Sandbox */}
        <div
          style={{ viewTransitionName: 'active-flagship-visual' }}
          className="relative aspect-[16/10] max-h-[64vh] w-full bg-[var(--bg-panel)] border-b border-[var(--hairline)] overflow-hidden flex items-center justify-center"
        >
          {mode === 'preview' ? (
            <>
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
            </>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center bg-black/40 p-2 sm:p-3">
              {!iframeLoaded && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[var(--bg-panel)] font-mono-tech text-xs text-[var(--fg-secondary)]">
                  <span
                    style={{ backgroundColor: 'var(--accent)' }}
                    className="w-2.5 h-2.5 rounded-full animate-pulse"
                  />
                  <span>BOOTING LIVE SANDBOX · {item.title.toUpperCase()}</span>
                </div>
              )}
              <iframe
                key={`${item.id}-${viewport}`}
                data-testid="sandbox-iframe"
                src={item.liveUrl}
                title={`${item.title} Interactive Sandbox`}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                onLoad={() => setIframeLoaded(true)}
                style={{
                  width: viewport === 'mobile' ? '390px' : '100%',
                  maxWidth: '100%',
                }}
                className="h-full rounded-xl border border-[var(--hairline-strong)] bg-black transition-[width] duration-300 ease-out"
              />
            </div>
          )}
        </div>

        {/* Keyword & Launch Footer */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 min-w-0">
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
              {mode === 'sandbox'
                ? 'Open Full Tab ↗'
                : lang === 'vi'
                ? 'Mở Live App ↗'
                : 'Launch Live App ↗'}
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
