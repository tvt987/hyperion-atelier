import { useCallback, useRef, useState } from 'react';
import type { FlagshipWorkItem } from '../data/atelierContent';
import { computeGaussianDockLift, computeGaussianDockScale } from '../engines/mathUtils';
import { tactileAudio } from '../engines/tactileAudio';

interface FlagshipDockProps {
  works: FlagshipWorkItem[];
  onScrollToSection: (id: string) => void;
  onOpenCommandPalette: () => void;
  onOpenAskAi: () => void;
}

const MONOGRAMS: Record<string, string> = {
  'tvt-studio': 'TVT',
  'maison-vera': 'MV',
  'atelier-canvas': 'AC',
  'lumina-medspa': 'LM',
  'kinetix-proptech': 'KX',
  'pulse-pos-fnb': 'POS',
  'aether-acoustics': 'AE',
  'nexus-lake': 'NL',
  'verdict-graph': 'VG',
  aegispulse: 'AP',
};

interface DockEntry {
  id: string;
  monogram: string;
  tooltip: string;
  href?: string;
  accent?: boolean;
  onClick?: () => void;
}

export function FlagshipDock({
  works,
  onScrollToSection,
  onOpenCommandPalette,
  onOpenAskAi,
}: FlagshipDockProps) {
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const flagshipEntries: DockEntry[] = works.map((w) => ({
    id: w.id,
    monogram: MONOGRAMS[w.id] ?? w.index,
    tooltip: `${w.title} ${w.version} ↗`,
    href: w.liveUrl,
  }));

  const utilityEntries: DockEntry[] = [
    {
      id: 'dock-ai',
      monogram: 'AI',
      tooltip: 'Ask AI Twin & JD Fit (/)',
      onClick: () => {
        tactileAudio.playLatch();
        onOpenAskAi();
      },
    },
    {
      id: 'dock-lab',
      monogram: 'LAB',
      tooltip: 'Compute Lab',
      onClick: () => onScrollToSection('sec-lab'),
    },
    {
      id: 'dock-cv',
      monogram: 'CV',
      tooltip: 'CV & Contact',
      onClick: () => onScrollToSection('sec-dossier'),
    },
    {
      id: 'dock-cmd',
      monogram: '⌘K',
      tooltip: 'Command Palette',
      accent: true,
      onClick: () => {
        tactileAudio.playLatch();
        onOpenCommandPalette();
      },
    },
  ];

  const allEntries = [...flagshipEntries, ...utilityEntries];

  const getScaleAndLift = useCallback(
    (index: number) => {
      if (mouseX === null) return { scale: 1, lift: 0 };
      const el = itemRefs.current[index];
      if (!el) return { scale: 1, lift: 0 };
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width * 0.5;
      const dist = Math.abs(mouseX - centerX);
      const scale = computeGaussianDockScale(dist, 1.38, 68);
      const lift = computeGaussianDockLift(scale, 1.38, 8);
      return { scale, lift };
    },
    [mouseX]
  );

  const renderTile = (entry: DockEntry, idx: number) => {
    const { scale, lift } = getScaleAndLift(idx);
    const isHovered = hoveredId === entry.id;

    const tileStyle: React.CSSProperties = {
      transform: `translate3d(0, -${lift.toFixed(2)}px, 0) scale(${scale.toFixed(3)})`,
      transformOrigin: 'center bottom',
      backgroundColor: entry.accent
        ? 'var(--fg-primary)'
        : isHovered
        ? 'var(--accent)'
        : 'var(--bg-panel)',
      color: entry.accent
        ? 'var(--bg-primary)'
        : isHovered
        ? '#ffffff'
        : 'var(--fg-primary)',
    };

    const commonClasses =
      'relative w-10 h-10 rounded-xl border border-[var(--hairline)] font-mono-tech text-[11px] font-bold tracking-tight flex items-center justify-center transition-[transform,background-color,color,border-color] duration-150 ease-out cursor-pointer select-none';

    const tooltipEl = (
      <span
        role="tooltip"
        style={{
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? 'translate(-50%, -8px)' : 'translate(-50%, 0px)',
        }}
        className="pointer-events-none absolute -top-9 left-1/2 whitespace-nowrap px-2.5 py-1 rounded-full liquid-glass font-mono-tech text-[10px] font-semibold text-[var(--fg-primary)] transition-all duration-150"
      >
        {entry.tooltip}
      </span>
    );

    if (entry.href) {
      return (
        <a
          key={entry.id}
          ref={(el) => {
            itemRefs.current[idx] = el;
          }}
          href={entry.href}
          target="_blank"
          rel="noreferrer"
          aria-label={entry.tooltip}
          onMouseEnter={() => {
            setHoveredId(entry.id);
            tactileAudio.playTick(1440);
          }}
          onMouseLeave={() => setHoveredId((prev) => (prev === entry.id ? null : prev))}
          style={tileStyle}
          className={commonClasses}
        >
          {tooltipEl}
          <span>{entry.monogram}</span>
        </a>
      );
    }

    return (
      <button
        key={entry.id}
        ref={(el) => {
          itemRefs.current[idx] = el;
        }}
        type="button"
        aria-label={entry.tooltip}
        onClick={entry.onClick}
        onMouseEnter={() => {
          setHoveredId(entry.id);
          tactileAudio.playTick(1380);
        }}
        onMouseLeave={() => setHoveredId((prev) => (prev === entry.id ? null : prev))}
        style={tileStyle}
        className={commonClasses}
      >
        {tooltipEl}
        <span>{entry.monogram}</span>
      </button>
    );
  };

  return (
    <nav
      aria-label="Quick Launch Dock"
      data-testid="flagship-dock"
      onPointerMove={(ev) => setMouseX(ev.clientX)}
      onPointerLeave={() => {
        setMouseX(null);
        setHoveredId(null);
      }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 hidden md:flex items-end gap-2 px-3 py-2 rounded-2xl liquid-glass"
    >
      {flagshipEntries.map((entry, idx) => renderTile(entry, idx))}

      <span
        aria-hidden="true"
        className="w-px h-6 mx-0.5 self-center bg-[var(--hairline-strong)]"
      />

      {utilityEntries.map((entry, idx) =>
        renderTile(entry, flagshipEntries.length + idx)
      )}

      {/* Keep reference array aligned */}
      <span className="hidden">{allEntries.length}</span>
    </nav>
  );
}
