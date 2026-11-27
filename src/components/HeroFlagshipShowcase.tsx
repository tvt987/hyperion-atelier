import { useState } from 'react';
import type { FlagshipWorkItem } from '../data/atelierContent';

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

  const [activeIndex, setActiveIndex] = useState(0);
  const current = featured[activeIndex] ?? works[0];

  if (!current) return null;

  return (
    <div className="rounded-3xl bg-[var(--bg-elevated)] border border-[var(--hairline-strong)] overflow-hidden shadow-[var(--card-shadow)] flex flex-col">
      {/* Top Minimal Browser Chrome + Live Indicator */}
      <div className="px-4 py-3 border-b border-[var(--hairline)] flex items-center justify-between gap-2 bg-[var(--bg-panel)]">
        <div className="flex items-center gap-2 min-w-0">
          <span
            style={{ backgroundColor: 'var(--signal-ok)' }}
            className="w-2 h-2 rounded-full shrink-0"
          />
          <span className="font-mono-tech text-[11px] font-semibold text-[var(--fg-primary)] truncate">
            {current.title} {current.version}
          </span>
        </div>
        <span className="font-mono-tech text-[10px] text-[var(--fg-muted)] shrink-0">
          {current.ciBadge}
        </span>
      </div>

      {/* Real Live Website Interface Capture */}
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

      {/* Concise Context & Instant Project Switcher */}
      <div className="p-4 space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-[var(--fg-secondary)] line-clamp-2 leading-relaxed">
              {lang === 'vi' ? current.taglineVi : current.taglineEn}
            </p>
          </div>
        </div>

        {/* Real Project Switcher Pills */}
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Featured live projects">
          {featured.map((item, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveIndex(idx)}
                style={{
                  backgroundColor: isActive ? 'var(--fg-primary)' : 'var(--bg-panel)',
                  color: isActive ? 'var(--bg-primary)' : 'var(--fg-secondary)',
                  borderColor: isActive ? 'transparent' : 'var(--hairline)',
                }}
                className="px-2.5 py-1 rounded-full border font-mono-tech text-[10.5px] font-semibold transition cursor-pointer"
              >
                {item.title}
              </button>
            );
          })}
        </div>

        {/* Real Production Experience Footnote */}
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
    </div>
  );
}
