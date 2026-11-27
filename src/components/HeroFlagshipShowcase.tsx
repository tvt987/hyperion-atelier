import { lazy, Suspense, useState } from 'react';
import {
  VERIFIED_API_BENCHMARKS,
  type FlagshipWorkItem,
} from '../data/atelierContent';
import { tactileAudio } from '../engines/tactileAudio';

const HeroApiProofPanel = lazy(() =>
  import('./HeroApiProofPanel').then((m) => ({ default: m.HeroApiProofPanel }))
);

interface HeroFlagshipShowcaseProps {
  works: FlagshipWorkItem[];
  lang: 'en' | 'vi';
  onInspect: (workId: string) => void;
}

const SPOTLIGHT_IDS = [
  'orbitalflow-saas',
  'vectradoc-rag',
  'fleetpulse-gis',
  'medcore-ehr',
  'velox-ev-motors',
  'aeroforge-digital-twin',
];

export function HeroFlagshipShowcase({
  works,
  lang,
  onInspect,
}: HeroFlagshipShowcaseProps) {
  const featured = SPOTLIGHT_IDS
    .map((id) => works.find((w) => w.id === id))
    .filter((w): w is FlagshipWorkItem => Boolean(w));

  const [mode, setMode] = useState<'preview' | 'api'>('preview');
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedBenchIdx, setSelectedBenchIdx] = useState(0);

  const current = featured[activeIndex] ?? works[0];

  if (!current) return null;

  const prefetchApiPanel = () => {
    void import('./HeroApiProofPanel');
  };

  const handleSwitchMode = (next: 'preview' | 'api') => {
    if (next === mode) return;
    tactileAudio.playLatch();
    if (next === 'api') {
      const matchedIdx = VERIFIED_API_BENCHMARKS.findIndex(
        (b) => b.workId === current.id
      );
      if (matchedIdx >= 0) {
        setSelectedBenchIdx(matchedIdx);
      }
    }
    setMode(next);
  };

  return (
    <div
      data-testid="hero-flagship-showcase"
      className="rounded-3xl bg-[var(--bg-elevated)] border border-[var(--hairline-strong)] overflow-hidden shadow-[var(--card-shadow)] flex flex-col"
    >
      {/* Top Minimal Chrome + Live UI / API Proof Mode Switcher */}
      <div className="px-3.5 sm:px-4 py-2.5 border-b border-[var(--hairline)] flex items-center justify-between gap-2 bg-[var(--bg-panel)]">
        <div className="flex items-center gap-2 min-w-0">
          <span
            style={{ backgroundColor: 'var(--signal-ok)' }}
            className="w-2 h-2 rounded-full shrink-0"
          />
          <span className="font-mono-tech text-[11px] font-semibold text-[var(--fg-primary)] truncate">
            {mode === 'preview' ? (
              `${current.title} ${current.version}`
            ) : lang === 'vi' ? (
              <>
                <span className="sm:hidden">Đo Kiểm API</span>
                <span className="hidden sm:inline">Đo Kiểm API Production</span>
              </>
            ) : (
              <>
                <span className="sm:hidden">API Telemetry</span>
                <span className="hidden sm:inline">Verified API Telemetry</span>
              </>
            )}
          </span>
        </div>

        <div
          role="tablist"
          aria-label={
            lang === 'vi'
              ? 'Chế độ hiển thị minh chứng'
              : 'Hero proof mode switcher'
          }
          className="flex items-center p-0.5 rounded-full bg-[var(--bg-primary)] border border-[var(--hairline-strong)] font-mono-tech text-[10px] shrink-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'preview'}
            data-testid="hero-mode-live"
            onClick={() => handleSwitchMode('preview')}
            style={{
              backgroundColor:
                mode === 'preview' ? 'var(--fg-primary)' : 'transparent',
              color:
                mode === 'preview'
                  ? 'var(--bg-primary)'
                  : 'var(--fg-secondary)',
            }}
            className="px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 transition cursor-pointer"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <rect x="1.75" y="2.75" width="12.5" height="10.5" rx="2" />
              <path d="M1.75 6h12.5" />
            </svg>
            <span>Live UI</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'api'}
            data-testid="hero-mode-api"
            onMouseEnter={prefetchApiPanel}
            onFocus={prefetchApiPanel}
            onClick={() => handleSwitchMode('api')}
            style={{
              backgroundColor:
                mode === 'api' ? 'var(--accent)' : 'transparent',
              color: mode === 'api' ? '#ffffff' : 'var(--fg-secondary)',
            }}
            className="px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 transition cursor-pointer"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <path
                d="M2 10.5h2.5l2-6 3 9 2-5H14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>API Proof</span>
          </button>
        </div>
      </div>

      {/* Main Content: Live UI Screenshot OR Lazy-Loaded Verified API Latency Proof */}
      {mode === 'preview' ? (
        <>
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--bg-primary)] border-b border-[var(--hairline)]">
            <a
              href={current.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="block w-full h-full"
              aria-label={`Open ${current.title} live website`}
            >
              <img
                src={`./${current.previewImage}`}
                alt={`${current.title} real live website preview`}
                className="w-full h-full object-cover object-top"
              />
            </a>
            <div className="absolute top-3 right-3 pointer-events-none">
              <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 font-mono-tech text-[10px] font-semibold text-[#22c55e]">
                {current.ciBadge}
              </span>
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onInspect(current.id)}
                className="px-3 py-1.5 rounded-full bg-black/75 hover:bg-black/90 text-white border border-white/20 font-mono-tech text-[10.5px] font-semibold backdrop-blur-md transition cursor-pointer"
              >
                {lang === 'vi' ? 'Xem Chi Tiết' : 'Inspect'}
              </button>
              <a
                href={current.liveUrl}
                target="_blank"
                rel="noreferrer"
                style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
                className="px-3 py-1.5 rounded-full font-mono-tech text-[10.5px] font-semibold shadow-md hover:opacity-90 transition"
              >
                {lang === 'vi' ? 'Mở Web Live ↗' : 'Open Live ↗'}
              </a>
            </div>
          </div>

          <div className="p-4 flex flex-col justify-between gap-3 lg:h-[186px]">
            <div className="space-y-3">
              <p className="text-xs font-medium text-[var(--fg-secondary)] line-clamp-2 leading-relaxed">
                {lang === 'vi' ? current.taglineVi : current.taglineEn}
              </p>

              <div
                className="flex flex-wrap gap-1.5"
                role="tablist"
                aria-label="Featured live projects"
              >
                {featured.map((item, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => {
                        tactileAudio.playTick(1380);
                        setActiveIndex(idx);
                      }}
                      style={{
                        backgroundColor: isActive
                          ? 'var(--fg-primary)'
                          : 'var(--bg-panel)',
                        color: isActive
                          ? 'var(--bg-primary)'
                          : 'var(--fg-secondary)',
                        borderColor: isActive
                          ? 'transparent'
                          : 'var(--hairline)',
                      }}
                      className="px-2.5 py-1 rounded-full border font-mono-tech text-[10.5px] font-semibold transition cursor-pointer"
                    >
                      {item.title}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2.5 border-t border-[var(--hairline)] flex flex-wrap items-center justify-between gap-2 font-mono-tech text-[10.5px] text-[var(--fg-muted)]">
              <span>Ex-Con Cung · 700+ Stores · .NET 8/10 · 5,000+ RPS</span>
              <a
                href="https://tvt987.github.io/tvt-studio/"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--accent)] font-semibold hover:underline"
              >
                TVT Studio ↗
              </a>
            </div>
          </div>
        </>
      ) : (
        <Suspense
          fallback={
            <div className="aspect-[16/10] w-full flex items-center justify-center bg-[var(--bg-primary)] font-mono-tech text-[11px] text-[var(--fg-muted)]">
              Loading Verified API Telemetry...
            </div>
          }
        >
          <HeroApiProofPanel
            lang={lang}
            selectedBenchIdx={selectedBenchIdx}
            onSelectBenchIdx={setSelectedBenchIdx}
            onInspect={onInspect}
          />
        </Suspense>
      )}
    </div>
  );
}
