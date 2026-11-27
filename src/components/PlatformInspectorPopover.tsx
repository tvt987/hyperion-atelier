import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ACCENT_SWATCHES,
  isEyeDropperSupported,
  pickColorWithEyeDropper,
} from '../engines/accentEngine';
import type { BuiltInAiProbe } from '../engines/aiTwinEngine';
import { ambientAudio } from '../engines/ambientAudio';
import { tactileAudio } from '../engines/tactileAudio';
import { detectPlatformCapabilities } from '../engines/webgpuShaders';
import type { FluidTelemetry } from './NavierStokesFluidCanvas';
import type { AmbientFieldTelemetry } from './WebGpuAmbientField';

interface PlatformInspectorPopoverProps {
  fps: number;
  ambientTelemetry: AmbientFieldTelemetry;
  fluidTelemetry: FluidTelemetry;
  aiProbe: BuiltInAiProbe;
  fluidEnabled: boolean;
  particlesEnabled: boolean;
  audioOn: boolean;
  accentHex: string;
  onToggleFluid: () => void;
  onToggleParticles: () => void;
  onToggleAudio: () => void;
  onAccentChange: (hex: string | null) => void;
}

export function PlatformInspectorPopover({
  fps,
  ambientTelemetry,
  fluidTelemetry,
  aiProbe,
  fluidEnabled,
  particlesEnabled,
  audioOn,
  accentHex,
  onToggleFluid,
  onToggleParticles,
  onToggleAudio,
  onAccentChange,
}: PlatformInspectorPopoverProps) {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [bars, setBars] = useState<number[]>(() => new Array<number>(12).fill(0.14));

  const caps = useMemo(() => detectPlatformCapabilities(), []);
  const eyeDropperAvailable = isEyeDropperSupported();

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

  const handleSampleAccent = async () => {
    tactileAudio.playLatch();
    if (eyeDropperAvailable) {
      const picked = await pickColorWithEyeDropper();
      if (picked) onAccentChange(picked);
      return;
    }
    // Cycle curated accent swatches when EyeDropper API is unavailable
    const idx = ACCENT_SWATCHES.findIndex(
      (s) => s.hex.toUpperCase() === accentHex.toUpperCase()
    );
    const next = ACCENT_SWATCHES[(idx + 1) % ACCENT_SWATCHES.length];
    onAccentChange(next.hex);
  };

  const rows: Array<{ label: string; value: string; ok: boolean }> = [
    {
      label: 'WebGPU WGSL',
      value: !particlesEnabled
        ? 'PAUSED'
        : ambientTelemetry.backend === 'webgpu'
        ? 'ACTIVE · 32K'
        : 'CANVAS FALLBACK · 900',
      ok: particlesEnabled && ambientTelemetry.backend === 'webgpu',
    },
    {
      label: 'Navier-Stokes FBO',
      value: fluidEnabled ? fluidTelemetry.label : 'PAUSED',
      ok: fluidEnabled && fluidTelemetry.active,
    },
    {
      label: 'WebGL2 Hardware',
      value: caps.webgl2 ? `ACTIVE · ${fps} FPS` : '2D FALLBACK',
      ok: caps.webgl2,
    },
    {
      label: 'Chrome Built-in AI',
      value: aiProbe.label,
      ok: aiProbe.engine === 'chrome-nano',
    },
    {
      label: 'Speculation Rules',
      value: caps.speculationRules ? '6 PREFETCHED' : 'DECLARED · 6 URLS',
      ok: caps.speculationRules,
    },
    {
      label: 'Shared View Transitions',
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
      label: 'Scroll Timeline view()',
      value: caps.scrollDrivenAnimations ? 'GPU COMPOSITOR' : 'FALLBACK',
      ok: caps.scrollDrivenAnimations,
    },
    {
      label: 'Stereo Audio + FFT',
      value: audioOn ? 'LIVE · 3D PAN' : caps.webAudio ? 'READY · 12-BAND' : 'UNAVAILABLE',
      ok: caps.webAudio,
    },
    {
      label: 'EyeDropper API',
      value: caps.eyeDropper ? 'SUPPORTED' : 'SWATCH FALLBACK',
      ok: caps.eyeDropper,
    },
    {
      label: 'Web Speech API',
      value: caps.speechRecognition ? 'VOICE READY' : 'UNAVAILABLE',
      ok: caps.speechRecognition,
    },
  ];

  return (
    <div
      ref={popoverRef}
      id="platform-inspector"
      popover="auto"
      data-testid="platform-inspector-popover"
      className="platform-popover liquid-glass rounded-2xl p-4 w-[min(360px,calc(100vw-24px))] max-h-[82vh] overflow-y-auto text-[var(--fg-primary)]"
    >
      {/* Popover Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[var(--hairline)] font-mono-tech">
        <div className="flex items-center gap-2">
          <span
            style={{
              backgroundColor:
                ambientTelemetry.backend === 'webgpu' || fluidTelemetry.active
                  ? 'var(--signal-ok)'
                  : 'var(--signal-warn)',
            }}
            className="w-2 h-2 rounded-full"
          />
          <span className="text-[11px] font-bold tracking-wider uppercase">
            2026 PLATFORM TELEMETRY
          </span>
        </div>
        <span className="text-[10px] text-[var(--fg-muted)]">v12.0 · 11 APIS</span>
      </div>

      {/* Live Engine Toggle Strip */}
      <div className="grid grid-cols-3 gap-1.5 mb-3 font-mono-tech text-[10px]">
        <button
          type="button"
          data-testid="toggle-fluid-sim"
          onClick={onToggleFluid}
          style={{
            borderColor: fluidEnabled ? 'var(--accent)' : 'var(--hairline)',
            color: fluidEnabled ? 'var(--fg-primary)' : 'var(--fg-muted)',
          }}
          className="px-2 py-1.5 rounded-xl bg-[var(--bg-panel)] border font-semibold transition cursor-pointer"
        >
          Fluid: {fluidEnabled ? 'ON' : 'OFF'}
        </button>
        <button
          type="button"
          data-testid="toggle-webgpu-field"
          onClick={onToggleParticles}
          style={{
            borderColor: particlesEnabled ? 'var(--accent)' : 'var(--hairline)',
            color: particlesEnabled ? 'var(--fg-primary)' : 'var(--fg-muted)',
          }}
          className="px-2 py-1.5 rounded-xl bg-[var(--bg-panel)] border font-semibold transition cursor-pointer"
        >
          Particles: {particlesEnabled ? 'ON' : 'OFF'}
        </button>
        <button
          type="button"
          data-testid="popover-sample-accent"
          onClick={() => void handleSampleAccent()}
          className="px-2 py-1.5 rounded-xl bg-[var(--bg-panel)] border border-[var(--hairline)] hover:border-[var(--accent)] text-[var(--fg-primary)] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <span
            style={{ backgroundColor: accentHex }}
            className="w-2 h-2 rounded-full shrink-0"
          />
          <span>Accent</span>
        </button>
      </div>

      {/* 11 Runtime Capability Rows */}
      <div data-testid="telemetry-rows" className="space-y-1 font-mono-tech text-[10.5px]">
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
      <div className="mt-3 pt-2.5 border-t border-[var(--hairline)] space-y-2">
        <div className="flex items-center justify-between font-mono-tech text-[10px]">
          <span className="text-[var(--fg-secondary)] uppercase tracking-wider">
            Audio FFT · 12-Band Stereo
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
          className="h-10 px-2.5 py-2 rounded-xl bg-[var(--bg-panel)] border border-[var(--hairline)] flex items-end gap-1.5"
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
