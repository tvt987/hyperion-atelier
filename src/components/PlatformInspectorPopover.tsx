import { useEffect, useMemo, useRef, useState } from 'react';
import { ambientAudio } from '../engines/ambientAudio';
import { detectPlatformCapabilities } from '../engines/webgpuShaders';
import type { AmbientFieldTelemetry } from './WebGpuAmbientField';

interface PlatformInspectorPopoverProps {
  fps: number;
  ambientTelemetry: AmbientFieldTelemetry;
  audioOn: boolean;
  onToggleAudio: () => void;
}

export function PlatformInspectorPopover({
  fps,
  ambientTelemetry,
  audioOn,
  onToggleAudio,
}: PlatformInspectorPopoverProps) {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [bars, setBars] = useState<number[]>(() => new Array<number>(12).fill(0.12));

  const caps = useMemo(() => detectPlatformCapabilities(), []);

  useEffect(() => {
    const el = popoverRef.current;
    if (!el) return;

    const onToggle = (ev: Event) => {
      const nextState = (ev as ToggleEvent).newState === 'open';
      setIsOpen(nextState);
    };

    el.addEventListener('toggle', onToggle);
    return () => {
      el.removeEventListener('toggle', onToggle);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    let rafId = 0;
    const tick = () => {
      setBars(ambientAudio.getSpectrumBars(12));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen]);

  const rows: Array<{ label: string; value: string; ok: boolean }> = [
    {
      label: 'WebGPU',
      value:
        ambientTelemetry.backend === 'webgpu'
          ? 'ACTIVE · WGSL 32K'
          : 'CANVAS FALLBACK · 900',
      ok: ambientTelemetry.backend === 'webgpu',
    },
    {
      label: 'WebGL2 SDF',
      value: caps.webgl2 ? `ACTIVE · ${fps} FPS` : '2D FALLBACK',
      ok: caps.webgl2,
    },
    {
      label: 'Web Workers',
      value: caps.webWorkers ? 'DEDICATED THREAD' : 'MAIN THREAD',
      ok: caps.webWorkers,
    },
    {
      label: 'View Transitions',
      value: caps.viewTransitions ? 'SUPPORTED' : 'FALLBACK',
      ok: caps.viewTransitions,
    },
    {
      label: 'Popover + Anchor',
      value:
        caps.popoverApi && caps.anchorPositioning
          ? 'NATIVE TOP-LAYER'
          : caps.popoverApi
          ? 'POPOVER · JS POS'
          : 'FALLBACK',
      ok: caps.popoverApi,
    },
    {
      label: 'Speculation Rules',
      value: caps.speculationRules ? '6 FLAGSHIPS PREFETCHED' : 'DECLARED · 6 URLS',
      ok: caps.speculationRules,
    },
    {
      label: 'Scroll Timeline',
      value: caps.scrollDrivenAnimations ? 'VIEW() GPU' : 'FALLBACK',
      ok: caps.scrollDrivenAnimations,
    },
  ];

  return (
    <div
      ref={popoverRef}
      id="platform-inspector"
      popover="auto"
      data-testid="platform-inspector-popover"
      className="platform-popover liquid-glass rounded-2xl p-4 w-[min(340px,calc(100vw-24px))] text-[var(--fg-primary)]"
    >
      {/* Popover Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[var(--hairline)] font-mono-tech">
        <div className="flex items-center gap-2">
          <span
            style={{
              backgroundColor:
                ambientTelemetry.backend === 'webgpu'
                  ? 'var(--signal-ok)'
                  : 'var(--signal-warn)',
            }}
            className="w-2 h-2 rounded-full"
          />
          <span className="text-[11px] font-bold tracking-wider uppercase">
            2026 PLATFORM TELEMETRY
          </span>
        </div>
        <span className="text-[10px] text-[var(--fg-muted)]">v4.0</span>
      </div>

      {/* Runtime Capability Rows */}
      <div className="space-y-1.5 font-mono-tech text-[10.5px]">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-2 py-1 border-b border-[var(--hairline)] last:border-b-0"
          >
            <span className="text-[var(--fg-secondary)]">{row.label}</span>
            <span
              style={{
                color: row.ok ? 'var(--signal-ok)' : 'var(--signal-warn)',
              }}
              className="font-semibold tracking-tight text-right"
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Live 12-Bar Audio FFT Spectrum Visualizer */}
      <div className="mt-3 pt-3 border-t border-[var(--hairline)] space-y-2">
        <div className="flex items-center justify-between font-mono-tech text-[10px]">
          <span className="text-[var(--fg-secondary)] uppercase tracking-wider">
            Audio FFT · 12-Band
          </span>
          <button
            type="button"
            data-testid="popover-audio-toggle"
            onClick={onToggleAudio}
            style={{
              color: audioOn ? 'var(--accent)' : 'var(--fg-secondary)',
            }}
            className="px-2 py-0.5 rounded-full border border-[var(--hairline)] hover:border-[var(--hairline-strong)] font-semibold uppercase transition cursor-pointer"
          >
            {audioOn ? 'LIVE · MUTE' : 'OFF · ENGAGE'}
          </button>
        </div>

        <div
          data-testid="fft-visualizer-bars"
          className="h-11 px-2.5 py-2 rounded-xl bg-[var(--bg-panel)] border border-[var(--hairline)] flex items-end gap-1.5"
        >
          {bars.map((val, idx) => (
            <span
              key={idx}
              style={{
                height: `${Math.max(16, Math.round(val * 100))}%`,
                backgroundColor: audioOn ? 'var(--accent)' : 'var(--fg-muted)',
                opacity: audioOn ? 0.55 + val * 0.45 : 0.35,
              }}
              className="flex-1 rounded-[3px] transition-[height] duration-75 ease-out"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
