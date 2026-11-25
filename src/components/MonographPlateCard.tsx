import { useRef } from 'react';
import type { MonographPlateItem } from '../data/atelierContent';
import { tactileAudio } from '../engines/tactileAudio';

interface MonographPlateCardProps {
  item: MonographPlateItem;
  index: number;
  lang: 'en' | 'vi';
}

export function MonographPlateCard({ item, index, lang }: MonographPlateCardProps) {
  const plateRef = useRef<HTMLElement | null>(null);

  const handleMouseMove = (ev: React.MouseEvent<HTMLElement>) => {
    const el = plateRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${ev.clientX - r.left}px`);
    el.style.setProperty('--spot-y', `${ev.clientY - r.top}px`);
  };

  return (
    <article
      ref={plateRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => tactileAudio.playTick(1240 + index * 110)}
      className="monograph-plate grid grid-cols-1 lg:grid-cols-12"
    >
      {/* Column 1: Plate Index & CI Proof Stamp */}
      <div className="lg:col-span-3 p-6 sm:p-8 hairline-r flex flex-col justify-between gap-6">
        <div>
          <div className="flex items-center justify-between font-mono-tech text-[11px] text-[var(--fg-muted)]">
            <span>{item.plateNo}</span>
            <span>{item.year}</span>
          </div>
          <div className="font-display text-4xl sm:text-5xl font-extrabold mt-2 text-[var(--fg-primary)]">
            0{index + 1}
          </div>
          <p
            style={{ color: 'var(--accent)' }}
            className="font-mono-tech text-[10px] font-semibold uppercase tracking-wider mt-2"
          >
            {item.domainTag}
          </p>
        </div>

        <div className="space-y-2.5">
          <div className="px-2.5 py-1.5 hairline-box bg-[var(--bg-panel)] font-mono-tech text-[10px] text-[var(--fg-secondary)]">
            <span style={{ color: 'var(--signal-ok)' }} className="font-bold mr-1.5">
              ● VERIFIED:
            </span>
            {item.ciProof}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {item.stack.map((tech) => (
              <span
                key={tech}
                className="px-2 py-0.5 hairline-box font-mono-tech text-[10px] text-[var(--fg-secondary)]"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Column 2: Editorial Narrative & Precision Vector Pipeline Blueprint */}
      <div className="lg:col-span-6 p-6 sm:p-8 hairline-r flex flex-col justify-between gap-6">
        <div className="space-y-3">
          <h3 className="font-display text-xl sm:text-2xl font-bold text-[var(--fg-primary)] leading-snug">
            {item.title}
          </h3>
          <p className="font-serif-editorial italic text-lg sm:text-xl text-[var(--fg-secondary)]">
            {lang === 'vi' ? item.subtitleVi : item.subtitleEn}
          </p>
          <p className="text-sm leading-relaxed text-[var(--fg-secondary)] pt-1">
            {lang === 'vi' ? item.summaryVi : item.summaryEn}
          </p>
        </div>

        {/* Custom Geometric Vector Signal Pipeline (Zero Generic Icons) */}
        <div className="pt-2">
          <div className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--fg-muted)] mb-2">
            SIGNAL TOPOLOGY // EXECUTION PIPELINE
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {item.topologyNodes.map((nodeName, nIdx) => (
              <div
                key={nodeName}
                className="relative px-3 py-2.5 hairline-box bg-[var(--bg-panel)] flex flex-col justify-between"
              >
                <span className="font-mono-tech text-[9px] text-[var(--fg-muted)]">
                  STAGE 0{nIdx + 1}
                </span>
                <span className="font-mono-tech text-[11px] font-semibold text-[var(--fg-primary)] mt-1 truncate">
                  {nodeName}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Column 3: Hard Empirical Metrics & Direct Dispatch Links */}
      <div className="lg:col-span-3 p-6 sm:p-8 flex flex-col justify-between gap-6 bg-[var(--bg-panel)]">
        <div className="divide-y divide-[var(--hairline)]">
          {item.metrics.map((m) => (
            <div key={m.label} className="py-2.5 first:pt-0 last:pb-0">
              <span className="font-mono-tech text-[10px] text-[var(--fg-muted)] block uppercase">
                {m.label}
              </span>
              <strong className="font-mono-tech text-lg sm:text-xl font-bold text-[var(--fg-primary)]">
                {m.value}
              </strong>
            </div>
          ))}
        </div>

        <div className="space-y-2 font-mono-tech text-xs font-semibold">
          {item.liveUrl && (
            <a
              href={item.liveUrl}
              target="_blank"
              rel="noreferrer"
              data-cursor="LAUNCH LIVE ↗"
              style={{ backgroundColor: 'var(--accent)', color: '#FFFFFF' }}
              className="w-full py-2.5 px-4 flex items-center justify-between uppercase tracking-wider hover:opacity-90 transition"
            >
              <span>{lang === 'vi' ? 'Mở Bản Live' : 'Launch Live Control'}</span>
              <span>↗</span>
            </a>
          )}
          <a
            href={item.repoUrl}
            target="_blank"
            rel="noreferrer"
            data-cursor="INSPECT CODE ↗"
            className="w-full py-2.5 px-4 hairline-box flex items-center justify-between text-[var(--fg-primary)] hover:bg-[var(--bg-elevated)] uppercase tracking-wider transition"
          >
            <span>{lang === 'vi' ? 'Mã Nguồn & CI' : 'Source & CI Suite'}</span>
            <span>↗</span>
          </a>
        </div>
      </div>
    </article>
  );
}
