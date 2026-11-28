import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import type { CommandItem } from './components/CommandPaletteModal';
import { FlagshipCard } from './components/FlagshipCard';
import { FlagshipDock } from './components/FlagshipDock';
import { HeroFlagshipShowcase } from './components/HeroFlagshipShowcase';
import { GlyphDecodeText, KineticText } from './components/KineticText';
import { LiquidGlassFilter } from './components/LiquidGlassFilter';
import type { FluidTelemetry } from './components/NavierStokesFluidCanvas';
import type { AmbientFieldTelemetry } from './components/WebGpuAmbientField';
import {
  CV_DOSSIERS,
  EXPERIENCE_ROWS,
  FLAGSHIP_WORKS,
  SKILL_GROUPS,
  type WorkCategory,
} from './data/atelierContent';
import {
  applyAccentToDocument,
  DEFAULT_ACCENT_OBSIDIAN,
  DEFAULT_ACCENT_PAPER,
} from './engines/accentEngine';
import type { BuiltInAiProbe } from './engines/aiTwinEngine';
import { ambientAudio } from './engines/ambientAudio';
import { tactileAudio } from './engines/tactileAudio';
import { applyAtelierThemeWithTransition, type AtelierTheme } from './engines/themeTransition';
import {
  isSpeechRecognitionSupported,
  startVoiceSession,
  type VoiceIntent,
} from './engines/voicePilot';

const AskTinhModal = lazy(() =>
  import('./components/AskTinhModal').then((m) => ({ default: m.AskTinhModal }))
);
const CommandPaletteModal = lazy(() =>
  import('./components/CommandPaletteModal').then((m) => ({ default: m.CommandPaletteModal }))
);
const DistributedSystemsLab = lazy(() =>
  import('./components/DistributedSystemsLab').then((m) => ({ default: m.DistributedSystemsLab }))
);
const FlagshipLightbox = lazy(() =>
  import('./components/FlagshipLightbox').then((m) => ({ default: m.FlagshipLightbox }))
);
const NavierStokesFluidCanvas = lazy(() =>
  import('./components/NavierStokesFluidCanvas').then((m) => ({
    default: m.NavierStokesFluidCanvas,
  }))
);
const PlatformInspectorPopover = lazy(() =>
  import('./components/PlatformInspectorPopover').then((m) => ({
    default: m.PlatformInspectorPopover,
  }))
);
const WebGpuAmbientField = lazy(() =>
  import('./components/WebGpuAmbientField').then((m) => ({ default: m.WebGpuAmbientField }))
);

gsap.registerPlugin(ScrollTrigger);

const HERO_KEYWORDS = ['.NET 10', 'Python', 'React 19', 'MCP / A2A', 'DuckDB-WASM', 'Three.js', 'WebGPU'];

const CATEGORIES: Array<{ id: WorkCategory; labelEn: string; labelVi: string }> = [
  { id: 'all', labelEn: 'All (28)', labelVi: 'Tất Cả (28)' },
  { id: 'enterprise', labelEn: 'SaaS, EHR & FinTech', labelVi: 'SaaS, Y Tế & FinTech' },
  { id: 'ai', labelEn: 'AI & Hybrid RAG', labelVi: 'AI & Hybrid RAG' },
  { id: 'systems', labelEn: 'GIS, IoT & Core', labelVi: 'GIS, IoT & Hệ Thống' },
  { id: 'commerce', labelEn: '3D & Luxury', labelVi: '3D & Thương Mại' },
  { id: 'design', labelEn: 'CAD & Design', labelVi: 'Thiết Kế & CAD' },
];

type DocWithViewTransition = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> };
};

export function App() {
  const [theme, setTheme] = useState<AtelierTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('atelier_theme');
      if (saved === 'paper' || saved === 'obsidian') return saved;
    }
    return 'obsidian';
  });
  const [customAccentHex, setCustomAccentHex] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'vi'>('en');
  const [category, setCategory] = useState<WorkCategory>('all');
  const [audioOn, setAudioOn] = useState<boolean>(false);
  const [fluidEnabled, setFluidEnabled] = useState<boolean>(false);
  const [particlesEnabled, setParticlesEnabled] = useState<boolean>(false);
  const [fps] = useState<number>(60);
  const [ambientTelemetry, setAmbientTelemetry] = useState<AmbientFieldTelemetry>({
    backend: 'canvas-fallback',
    particleCount: 900,
    label: 'CANVAS FALLBACK · 900',
  });
  const [fluidTelemetry, setFluidTelemetry] = useState<FluidTelemetry>({
    active: false,
    label: 'INITIALIZING',
  });
  const [aiProbe, setAiProbe] = useState<BuiltInAiProbe>({
    engine: 'local-hybrid-rag',
    status: 'unavailable',
    label: 'LOCAL HYBRID RAG · 0ms',
  });
  const [cmdOpen, setCmdOpen] = useState<boolean>(false);
  const [askAiOpen, setAskAiOpen] = useState<boolean>(false);
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [transitionCardId, setTransitionCardId] = useState<string | null>(null);
  const [zaloModalOpen, setZaloModalOpen] = useState<boolean>(false);
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);
  const [voiceListening, setVoiceListening] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [labCmdSeq, setLabCmdSeq] = useState<number>(0);
  const [labCmdKind, setLabCmdKind] = useState<'RAFT_FAILOVER' | 'SHARD_OUTAGE' | 'BENCHMARK' | null>(null);

  const scrollProgressRef = useRef<number>(0);
  const scrollVelocityRef = useRef<number>(0);
  const lenisRef = useRef<Lenis | null>(null);
  const stopVoiceRef = useRef<(() => void) | null>(null);

  const speechSupported = useMemo(() => isSpeechRecognitionSupported(), []);
  const effectiveAccentHex =
    customAccentHex ??
    (theme === 'paper' ? DEFAULT_ACCENT_PAPER : DEFAULT_ACCENT_OBSIDIAN);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  useEffect(() => {
    applyAccentToDocument(customAccentHex);
  }, [customAccentHex]);

  useEffect(() => {
    return ambientAudio.subscribe((active) => setAudioOn(active));
  }, []);

  // Spatial Stereo Panning synced to pointer X across viewport
  useEffect(() => {
    const onPointerMove = (ev: PointerEvent) => {
      const normX = ev.clientX / Math.max(1, window.innerWidth);
      tactileAudio.setPointerPanX(normX);
      ambientAudio.setSpatialPanX(normX);
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, []);

  // Global keyboard shortcuts: CMD+K (Command Palette) and `/` (Ask AI Twin)
  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') {
        ev.preventDefault();
        tactileAudio.playLatch();
        setCmdOpen((prev) => !prev);
        return;
      }

      const target = ev.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;
      if (!isTyping && ev.key === '/' && !ev.metaKey && !ev.ctrlKey && !ev.altKey) {
        ev.preventDefault();
        tactileAudio.playLatch();
        setAskAiOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.02,
      smoothWheel: true,
      wheelMultiplier: 0.95,
    });
    lenisRef.current = lenis;

    lenis.on('scroll', (e: { progress: number; velocity: number }) => {
      scrollProgressRef.current = e.progress;
      scrollVelocityRef.current = e.velocity;
      ScrollTrigger.update();
    });

    const tickerCallback = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    const onNativeScroll = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollProgressRef.current = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    };
    window.addEventListener('scroll', onNativeScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onNativeScroll);
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollToSection = useCallback((id: string) => {
    tactileAudio.playTick(1360);
    const el = document.getElementById(id);
    if (!el) return;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(el, { offset: -84 });
    } else {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleToggleAudio = useCallback(() => {
    const next = ambientAudio.toggle();
    tactileAudio.setEnabled(next);
    if (next) tactileAudio.playLatch();
    setAudioOn(next);
  }, []);

  const handleThemeSwitch = useCallback(
    (ev?: React.MouseEvent<HTMLButtonElement>, forced?: AtelierTheme) => {
      const next: AtelierTheme = forced ?? (theme === 'obsidian' ? 'paper' : 'obsidian');
      if (next === theme) return;
      tactileAudio.playChordPulse();
      applyAtelierThemeWithTransition(next, ev?.clientX, ev?.clientY, (committed) => {
        setTheme(committed);
      });
    },
    [theme]
  );

  // Shared-Element View Transition Lightbox Open / Close
  const openLightboxWithTransition = useCallback((workId: string) => {
    const doc = document as DocWithViewTransition;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!doc.startViewTransition || prefersReduced) {
      setLightboxId(workId);
      return;
    }

    flushSync(() => {
      setTransitionCardId(workId);
    });
    const transition = doc.startViewTransition(() => {
      flushSync(() => {
        setTransitionCardId(null);
        setLightboxId(workId);
      });
    });
    void transition.finished.catch(() => {});
  }, []);

  const closeLightboxWithTransition = useCallback(() => {
    const closingId = lightboxId;
    const doc = document as DocWithViewTransition;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!closingId || !doc.startViewTransition || prefersReduced) {
      setLightboxId(null);
      setTransitionCardId(null);
      return;
    }

    const transition = doc.startViewTransition(() => {
      flushSync(() => {
        setLightboxId(null);
        setTransitionCardId(closingId);
      });
    });
    void transition.finished
      .finally(() => {
        setTransitionCardId(null);
      })
      .catch(() => {});
  }, [lightboxId]);

  const executeVoiceIntent = useCallback(
    (intent: VoiceIntent) => {
      if (intent.type === 'THEME') {
        handleThemeSwitch(undefined, intent.value);
      } else if (intent.type === 'OPEN_WORK') {
        openLightboxWithTransition(intent.workId);
      } else if (intent.type === 'ASK_AI') {
        setAskAiOpen(true);
      } else if (intent.type === 'SCROLL') {
        scrollToSection(intent.sectionId);
      } else if (intent.type === 'OPEN_INSPECTOR') {
        const el = document.getElementById('platform-inspector') as
          | (HTMLElement & { showPopover?: () => void })
          | null;
        el?.showPopover?.();
      }
    },
    [handleThemeSwitch, openLightboxWithTransition, scrollToSection]
  );

  const handleToggleVoice = useCallback(() => {
    if (!speechSupported) return;
    if (voiceListening) {
      stopVoiceRef.current?.();
      stopVoiceRef.current = null;
      setVoiceListening(false);
      return;
    }

    tactileAudio.playLatch();
    setVoiceTranscript(lang === 'vi' ? 'Đang nghe...' : 'Listening...');
    setVoiceListening(true);

    const stop = startVoiceSession({
      lang,
      onInterim: (text) => setVoiceTranscript(text),
      onFinal: (text, intent) => {
        setVoiceTranscript(text);
        if (intent) {
          executeVoiceIntent(intent);
        }
        window.setTimeout(() => setVoiceTranscript(''), 1800);
      },
      onEnd: () => {
        setVoiceListening(false);
        stopVoiceRef.current = null;
      },
    });

    if (!stop) {
      setVoiceListening(false);
      setVoiceTranscript('');
    } else {
      stopVoiceRef.current = stop;
    }
  }, [executeVoiceIntent, lang, speechSupported, voiceListening]);

  const handleCopyEmail = useCallback(() => {
    navigator.clipboard?.writeText('tinhkun102@gmail.com').catch(() => {});
    tactileAudio.playTick(1520);
    setCopiedEmail(true);
    window.setTimeout(() => setCopiedEmail(false), 1800);
  }, []);

  const filteredWorks = useMemo(
    () => (category === 'all' ? FLAGSHIP_WORKS : FLAGSHIP_WORKS.filter((w) => w.category === category)),
    [category]
  );

  const commandItems: CommandItem[] = useMemo(
    () => [
      {
        id: 'act-ask-ai',
        code: '00',
        group: 'AI TWIN & JD FIT',
        label: 'Ask AI Digital Twin / Instant JD Fit Matcher (/)',
        hint: aiProbe.label,
        onSelect: () => setAskAiOpen(true),
      },
      ...FLAGSHIP_WORKS.map((w, idx) => ({
        id: `work-${w.id}`,
        code: String(idx + 1).padStart(2, '0'),
        group: 'LIVE APPS',
        label: `${w.title} ${w.version} — ${w.highlightMetric} ↗`,
        hint: w.ciBadge,
        onSelect: () => openLightboxWithTransition(w.id),
      })),
      {
        id: 'act-theme',
        code: '29',
        group: 'INTERFACE',
        label: theme === 'obsidian' ? 'Switch to Light Paper Surface' : 'Switch to Dark Obsidian Surface',
        hint: 'VIEW TRANSITION',
        onSelect: () => handleThemeSwitch(),
      },
      {
        id: 'act-audio',
        code: '30',
        group: 'SPATIAL AUDIO',
        label: audioOn ? 'Mute Stereo Ambient Synth & FFT' : 'Engage Stereo Ambient Synth & FFT',
        hint: '3D STEREO PAN',
        onSelect: () => handleToggleAudio(),
      },
      {
        id: 'act-inspector',
        code: '31',
        group: '2026 APIS',
        label: 'Inspect 11 Platform APIs & Fluid / WebGPU Engines',
        hint: 'POPOVER API',
        onSelect: () => {
          const el = document.getElementById('platform-inspector') as
            | (HTMLElement & { togglePopover?: () => void })
            | null;
          el?.togglePopover?.();
        },
      },
      {
        id: 'act-raft',
        code: '32',
        group: 'SYSTEMS LAB',
        label: 'Trigger Raft Leader Failover (Web Worker)',
        hint: 'LIVE CHAOS',
        onSelect: () => {
          scrollToSection('sec-lab');
          setLabCmdKind('RAFT_FAILOVER');
          setLabCmdSeq((s) => s + 1);
        },
      },
      ...CV_DOSSIERS.map((cv, idx) => ({
        id: `cv-${cv.id}`,
        code: `${33 + idx}`,
        group: 'CV PDF',
        label: `${cv.titleEn} (${cv.keywords})`,
        hint: 'PDF',
        onSelect: () => window.open(cv.href, '_blank'),
      })),
      {
        id: 'contact-zalo',
        code: '36',
        group: 'CONTACT',
        label: 'Zalo QR — (+84) 0931 467 024',
        hint: 'QR',
        onSelect: () => setZaloModalOpen(true),
      },
    ],
    [
      aiProbe.label,
      audioOn,
      handleThemeSwitch,
      handleToggleAudio,
      openLightboxWithTransition,
      scrollToSection,
      theme,
    ]
  );

  return (
    <div className="min-h-screen relative selection:bg-[var(--accent)] selection:text-white">
      <LiquidGlassFilter />
      {particlesEnabled && (
        <Suspense fallback={null}>
          <WebGpuAmbientField
            enabled={particlesEnabled}
            theme={theme}
            scrollVelocityRef={scrollVelocityRef}
            onTelemetryChange={setAmbientTelemetry}
          />
        </Suspense>
      )}
      {fluidEnabled && (
        <Suspense fallback={null}>
          <NavierStokesFluidCanvas
            enabled={fluidEnabled}
            theme={theme}
            accentHex={effectiveAccentHex}
            onTelemetryChange={setFluidTelemetry}
          />
        </Suspense>
      )}
      <div className="grain-overlay" />

      {/* Compositor Scroll Progress Hairline */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-[80] pointer-events-none">
        <div className="scroll-progress-line h-full w-full" />
      </div>

      {/* ===================================================================== */}
      {/* FLOATING APPLE 2026 LIQUID GLASS NAVIGATION DOCK                      */}
      {/* ===================================================================== */}
      <header className="fixed top-4 left-0 right-0 z-50 px-3 sm:px-4 pointer-events-none">
        <div className="max-w-[1160px] mx-auto flex items-center justify-between px-3 sm:px-5 h-12 rounded-full liquid-glass pointer-events-auto">
          <a href="#top" className="flex items-center gap-2 shrink-0">
            <span
              style={{
                backgroundColor:
                  ambientTelemetry.backend === 'webgpu' ? 'var(--signal-ok)' : 'var(--accent)',
              }}
              className="w-2 h-2 rounded-full"
            />
            <span className="font-mono-tech text-xs font-bold tracking-wider uppercase text-[var(--fg-primary)]">
              TVT
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-[var(--fg-secondary)]">
            <a
              href="https://tvt987.github.io/tvt-studio/"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--accent)] font-semibold hover:opacity-80 transition cursor-pointer"
            >
              <GlyphDecodeText text={lang === 'vi' ? 'Mua Web / Thuê Code ↗' : 'Web Store ↗'} />
            </a>
            <button
              type="button"
              onClick={() => scrollToSection('sec-works')}
              className="hover:text-[var(--fg-primary)] transition cursor-pointer"
            >
              <GlyphDecodeText text={lang === 'vi' ? 'Dự Án' : 'Works'} />
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('sec-lab')}
              className="hover:text-[var(--fg-primary)] transition cursor-pointer"
            >
              <GlyphDecodeText text="Lab" />
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('sec-stack')}
              className="hover:text-[var(--fg-primary)] transition cursor-pointer"
            >
              <GlyphDecodeText text="Stack" />
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('sec-dossier')}
              className="hover:text-[var(--fg-primary)] transition cursor-pointer"
            >
              <GlyphDecodeText text="CV & Contact" />
            </button>
          </nav>

          <div className="flex items-center gap-1 sm:gap-1.5 font-mono-tech text-[11px]">
            {/* Ask AI Digital Twin + JD Fit Matcher Pill */}
            <button
              type="button"
              data-testid="btn-ask-ai"
              onClick={() => {
                tactileAudio.playLatch();
                setAskAiOpen(true);
              }}
              style={{
                borderColor: 'var(--accent)',
                color: 'var(--fg-primary)',
                backgroundColor: 'var(--accent-soft)',
              }}
              className="px-2 sm:px-2.5 py-1 rounded-full border font-semibold flex items-center gap-1.5 hover:opacity-90 transition cursor-pointer"
            >
              <span
                style={{ backgroundColor: 'var(--accent)' }}
                className="w-1.5 h-1.5 rounded-full shrink-0"
              />
              <span className="hidden sm:inline">Ask AI</span>
              <span className="sm:hidden">AI</span>
            </button>

            {/* Browser-Native Web Speech API Voice Pilot */}
            <button
              type="button"
              data-testid="btn-voice-pilot"
              onClick={handleToggleVoice}
              disabled={!speechSupported}
              aria-label={voiceListening ? 'Stop voice pilot' : 'Start voice command pilot'}
              title={
                speechSupported
                  ? voiceListening
                    ? 'Voice Listening...'
                    : 'Voice Ready (EN / VI)'
                  : 'Web Speech API Unavailable'
              }
              style={{
                borderColor: voiceListening ? 'var(--accent)' : 'var(--hairline)',
                color: voiceListening
                  ? 'var(--accent)'
                  : speechSupported
                  ? 'var(--fg-secondary)'
                  : 'var(--fg-muted)',
              }}
              className={`hidden sm:flex w-7 h-7 rounded-full border items-center justify-center transition ${
                speechSupported
                  ? 'hover:text-[var(--fg-primary)] hover:border-[var(--hairline-strong)] cursor-pointer'
                  : 'opacity-45 cursor-not-allowed'
              }`}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden="true"
              >
                <rect x="5.5" y="1.75" width="5" height="8" rx="2.5" />
                <path d="M3.25 7.5a4.75 4.75 0 0 0 9.5 0M8 12.25v2.25" strokeLinecap="round" />
              </svg>
            </button>

            {/* Minimalist Animated Sound Wave Toggle */}
            <button
              type="button"
              data-testid="btn-audio-toggle"
              onClick={handleToggleAudio}
              aria-label={audioOn ? 'Mute ambient synth' : 'Enable ambient synth'}
              title={audioOn ? 'Stereo Audio FFT: Live' : 'Stereo Audio FFT: Off'}
              className="w-7 h-7 rounded-full border border-[var(--hairline)] hover:border-[var(--hairline-strong)] flex items-center justify-center gap-[2px] transition cursor-pointer"
            >
              {[0.42, 0.88, 0.58, 1.0, 0.48].map((h, i) => (
                <span
                  key={i}
                  style={{
                    height: `${Math.round(h * 11)}px`,
                    backgroundColor: audioOn ? 'var(--accent)' : 'var(--fg-muted)',
                    animationDelay: `${i * 120}ms`,
                  }}
                  className={`w-[1.5px] rounded-full ${audioOn ? 'sound-bar-live' : ''}`}
                />
              ))}
            </button>

            {/* Native HTML Popover + CSS Anchor Positioning Hardware Pill */}
            <button
              type="button"
              data-testid="btn-gpu-inspector"
              popoverTarget="platform-inspector"
              onClick={() => tactileAudio.playTick(1520)}
              className="gpu-anchor-btn px-2 sm:px-2.5 py-1 rounded-full border border-[var(--hairline)] text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:border-[var(--hairline-strong)] flex items-center gap-1.5 transition cursor-pointer"
            >
              <span
                style={{
                  backgroundColor:
                    ambientTelemetry.backend === 'webgpu' || fluidTelemetry.active
                      ? 'var(--signal-ok)'
                      : 'var(--signal-warn)',
                }}
                className="w-1.5 h-1.5 rounded-full shrink-0"
              />
              <span className="hidden lg:inline">GPU / 2026 APIs</span>
              <span className="lg:hidden">GPU</span>
            </button>

            <button
              type="button"
              data-testid="btn-lang-toggle"
              onClick={() => {
                tactileAudio.playTick();
                setLang((l) => (l === 'en' ? 'vi' : 'en'));
              }}
              className="px-2 sm:px-2.5 py-1 rounded-full border border-[var(--hairline)] text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition cursor-pointer"
            >
              {lang.toUpperCase()}
            </button>

            <button
              type="button"
              data-testid="btn-theme-morph"
              onClick={(ev) => handleThemeSwitch(ev)}
              aria-label="Toggle theme"
              className="px-2 sm:px-2.5 py-1 rounded-full border border-[var(--hairline)] text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition cursor-pointer"
            >
              {theme === 'obsidian' ? 'Light' : 'Dark'}
            </button>

            <button
              type="button"
              data-testid="btn-open-cmd"
              onClick={() => {
                tactileAudio.playLatch();
                setCmdOpen(true);
              }}
              style={{ backgroundColor: 'var(--fg-primary)', color: 'var(--bg-primary)' }}
              className="px-2.5 sm:px-3 py-1 rounded-full font-bold cursor-pointer"
            >
              ⌘K
            </button>
          </div>
        </div>

        {/* Live Voice Pilot Transcript Pill */}
        {(voiceListening || voiceTranscript) && (
          <div className="mt-2 flex justify-center pointer-events-none">
            <div className="liquid-glass px-3.5 py-1.5 rounded-full font-mono-tech text-[11px] text-[var(--fg-primary)] flex items-center gap-2">
              <span
                style={{ backgroundColor: 'var(--accent)' }}
                className="w-2 h-2 rounded-full animate-pulse"
              />
              <span>{voiceTranscript}</span>
            </div>
          </div>
        )}
      </header>

      {/* Native Top-Layer Hardware Inspector Popover (11 Live 2026 APIs) */}
      <Suspense fallback={null}>
        <PlatformInspectorPopover
          fps={fps}
          ambientTelemetry={ambientTelemetry}
          fluidTelemetry={fluidTelemetry}
          aiProbe={aiProbe}
          fluidEnabled={fluidEnabled}
          particlesEnabled={particlesEnabled}
          audioOn={audioOn}
          accentHex={effectiveAccentHex}
          onToggleFluid={() => {
            tactileAudio.playLatch();
            setFluidEnabled((v) => !v);
          }}
          onToggleParticles={() => {
            tactileAudio.playLatch();
            setParticlesEnabled((v) => !v);
          }}
          onToggleAudio={handleToggleAudio}
          onAccentChange={setCustomAccentHex}
        />
      </Suspense>

      <main id="top" className="relative z-10">
        {/* =================================================================== */}
        {/* 01 // ULTRA-CLEAN VISUAL HERO (ZERO PROSE PARAGRAPHS)               */}
        {/* =================================================================== */}
        <section className="hero-ambient pt-24 pb-14 sm:pt-32 sm:pb-20 px-5 sm:px-8">
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left 7 Cols: Pure Signal Kinetic Typography & Keywords */}
            <div className="lg:col-span-7 space-y-7">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--hairline)] font-mono-tech text-[11px] text-[var(--fg-secondary)]">
                <span style={{ backgroundColor: 'var(--signal-ok)' }} className="w-2 h-2 rounded-full animate-pulse" />
                <span>Remote B2B · $25–$45/hr · UTC+7</span>
              </div>

              <div className="space-y-2">
                <p className="font-mono-tech text-xs uppercase tracking-[0.22em] text-[var(--fg-muted)]">
                  Truong Van Tinh · Full-Stack &amp; Applied AI
                </p>
                <h1 className="font-display hero-headline font-extrabold text-[var(--fg-primary)]">
                  {lang === 'vi' ? (
                    <>
                      <KineticText text="Kiến Trúc" scrollVelocityRef={scrollVelocityRef} />
                      <br />
                      <KineticText
                        text="& Sản Phẩm."
                        accent
                        scrollVelocityRef={scrollVelocityRef}
                        className="font-serif-editorial italic font-normal text-[var(--accent)]"
                      />
                    </>
                  ) : (
                    <>
                      <KineticText text="Systems" scrollVelocityRef={scrollVelocityRef} />
                      <br />
                      <KineticText
                        text="& Craft."
                        accent
                        scrollVelocityRef={scrollVelocityRef}
                        className="font-serif-editorial italic font-normal text-[var(--accent)]"
                      />
                    </>
                  )}
                </h1>
              </div>

              {/* Crisp Keyword Strip — Zero Sentences */}
              <div className="flex flex-wrap gap-2">
                {HERO_KEYWORDS.map((kw) => (
                  <span
                    key={kw}
                    className="px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--hairline)] font-mono-tech text-xs text-[var(--fg-primary)]"
                  >
                    {kw}
                  </span>
                ))}
              </div>

              {/* Clean CTA Trio with Subtle Glyph Decode */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => scrollToSection('sec-works')}
                  style={{ backgroundColor: 'var(--fg-primary)', color: 'var(--bg-primary)' }}
                  className="px-6 py-3 rounded-full text-xs sm:text-sm font-semibold tracking-wide hover:opacity-90 transition cursor-pointer"
                >
                  <GlyphDecodeText text={lang === 'vi' ? 'Xem 28 Dự Án Live ↓' : '28 Live Works ↓'} />
                </button>
                <a
                  href="https://tvt987.github.io/tvt-studio/"
                  target="_blank"
                  rel="noreferrer"
                  style={{ borderColor: 'var(--accent)', backgroundColor: 'var(--accent-soft)' }}
                  className="px-5 py-3 rounded-full border text-xs sm:text-sm font-semibold text-[var(--fg-primary)] hover:opacity-90 transition cursor-pointer"
                >
                  <GlyphDecodeText text={lang === 'vi' ? 'Đặt Làm Web / 26 Hệ Thống ↗' : 'Order Web / 26 Systems ↗'} />
                </a>
                <a
                  href="https://tvt987.github.io/tvt-tools/"
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3 rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-elevated)] text-xs sm:text-sm font-semibold text-[var(--fg-primary)] hover:border-[var(--accent)] transition cursor-pointer"
                >
                  <GlyphDecodeText text={lang === 'vi' ? '12 Pro Tools Miễn Phí ↗' : '12 Free Pro Tools ↗'} />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    tactileAudio.playLatch();
                    setAskAiOpen(true);
                  }}
                  className="px-5 py-3 rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-elevated)] text-xs sm:text-sm font-semibold text-[var(--fg-primary)] hover:border-[var(--accent)] transition cursor-pointer"
                >
                  <GlyphDecodeText text={lang === 'vi' ? 'AI Twin & Chấm JD' : 'AI Twin · JD Fit'} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('sec-dossier')}
                  className="px-5 py-3 rounded-full border border-[var(--hairline)] text-xs sm:text-sm font-medium text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:border-[var(--hairline-strong)] transition cursor-pointer"
                >
                  <GlyphDecodeText text={lang === 'vi' ? 'Tải CV PDF' : 'CV Dossier'} />
                </button>
              </div>
            </div>

            {/* Right 5 Cols: Real Live Production Showcase (Zero Meaningless 3D Crystal) */}
            <div className="lg:col-span-5">
              <HeroFlagshipShowcase
                works={FLAGSHIP_WORKS}
                lang={lang}
                onInspect={(workId) => openLightboxWithTransition(workId)}
              />
            </div>
          </div>

          {/* Direct Executive Contact & CV Bar (Moved Up to Hero as Requested) */}
          <div
            data-testid="hero-contact-strip"
            className="max-w-[1200px] mx-auto mt-9 px-4 py-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--hairline-strong)] shadow-[0_1px_3px_rgba(17,19,24,0.05)] flex flex-col xl:flex-row xl:items-center justify-between gap-3"
          >
            <div className="flex flex-wrap items-center gap-1.5 font-mono-tech text-[11px]">
              <span className="inline-flex items-center gap-1.5 pr-1.5 font-semibold text-[var(--fg-primary)]">
                <span style={{ backgroundColor: 'var(--signal-ok)' }} className="w-2 h-2 rounded-full shrink-0" />
                {lang === 'vi' ? 'Liên Hệ:' : 'Contact:'}
              </span>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="px-3 py-1.5 rounded-full bg-[var(--bg-panel)] border border-[var(--hairline)] text-[var(--fg-primary)] hover:border-[var(--accent)] transition cursor-pointer"
              >
                {copiedEmail ? 'Copied!' : 'tinhkun102@gmail.com'}
              </button>
              <a
                href="tel:+84931467024"
                className="px-3 py-1.5 rounded-full bg-[var(--bg-panel)] border border-[var(--hairline)] text-[var(--fg-primary)] hover:border-[var(--accent)] transition"
              >
                0931 467 024
              </a>
              <button
                type="button"
                onClick={() => {
                  tactileAudio.playLatch();
                  setZaloModalOpen(true);
                }}
                style={{ backgroundColor: 'var(--accent)', color: '#FFFFFF' }}
                className="px-3 py-1.5 rounded-full font-semibold hover:opacity-90 transition cursor-pointer"
              >
                Zalo QR
              </button>
              <a
                href="https://github.com/tvt987"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-full bg-[var(--bg-panel)] border border-[var(--hairline)] text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition"
              >
                GitHub ↗
              </a>
              <a
                href="https://www.linkedin.com/in/tr%C6%B0%C6%A1ng-v%C4%83n-t%C3%ACnh-651b12289/"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-full bg-[var(--bg-panel)] border border-[var(--hairline)] text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition"
              >
                LinkedIn ↗
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 font-mono-tech text-[11px] border-t xl:border-t-0 pt-2.5 xl:pt-0 border-[var(--hairline)]">
              <span className="text-[var(--fg-muted)] uppercase tracking-wider pr-0.5">CV:</span>
              {CV_DOSSIERS.map((cv) => (
                <a
                  key={cv.id}
                  href={cv.href}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-full bg-[var(--bg-panel)] border border-[var(--hairline)] text-[var(--fg-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition"
                >
                  {lang === 'vi' ? cv.titleVi : cv.titleEn} ↗
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 02 // VISUAL FLAGSHIP GALLERY (3D TILT + VIEW TRANSITION + SANDBOX) */}
        {/* =================================================================== */}
        <section id="sec-works" className="py-16 sm:py-24 px-5 sm:px-8 border-t border-[var(--hairline)]">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10">
              <div>
                <span className="font-mono-tech text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
                  01 · {lang === 'vi' ? 'Sản Phẩm Live' : 'Selected Works'}
                </span>
                <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[var(--fg-primary)] mt-1">
                  {lang === 'vi' ? '28 Hệ Thống & 12 Pro Tools' : '28 Live Production Apps'}
                </h2>
              </div>

              {/* Clean Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => {
                  const active = category === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        tactileAudio.playTick(1400);
                        setCategory(c.id);
                      }}
                      style={{
                        backgroundColor: active ? 'var(--fg-primary)' : 'var(--bg-elevated)',
                        color: active ? 'var(--bg-primary)' : 'var(--fg-secondary)',
                      }}
                      className="px-3.5 py-1.5 rounded-full border border-[var(--hairline)] font-mono-tech text-[11px] font-semibold transition cursor-pointer"
                    >
                      {lang === 'vi' ? c.labelVi : c.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7">
              {filteredWorks.map((item) => (
                <FlagshipCard
                  key={item.id}
                  item={item}
                  lang={lang}
                  isTransitionTarget={transitionCardId === item.id}
                  onInspect={(work) => openLightboxWithTransition(work.id)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 03 // COMPACT LIVE COMPUTE LAB (OFF-MAIN-THREAD WEB WORKER)         */}
        {/* =================================================================== */}
        <section id="sec-lab" className="py-16 sm:py-24 px-5 sm:px-8 border-t border-[var(--hairline)]">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <span className="font-mono-tech text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
                  02 · Web Worker · 60 FPS
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--fg-primary)] mt-1">
                  {lang === 'vi' ? 'Phòng Lab Mô Phỏng' : 'Interactive Compute Lab'}
                </h2>
              </div>
              <div className="flex flex-wrap gap-1.5 font-mono-tech text-[11px]">
                <span className="px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--hairline)] text-[var(--fg-secondary)]">
                  Consistent Hash
                </span>
                <span className="px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--hairline)] text-[var(--fg-secondary)]">
                  Raft Quorum
                </span>
                <span className="px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--hairline)] text-[var(--fg-secondary)]">
                  384-d HNSW
                </span>
              </div>
            </div>

            <div className="scroll-view-reveal rounded-[20px] overflow-hidden border border-[var(--hairline)] bg-[var(--bg-elevated)]">
              <Suspense
                fallback={
                  <div className="min-h-[420px] flex items-center justify-center font-mono-tech text-xs text-[var(--fg-muted)]">
                    {lang === 'vi' ? 'Đang nạp Phòng Lab Web Worker...' : 'Initializing Web Worker Compute Lab...'}
                  </div>
                }
              >
                <DistributedSystemsLab
                  theme={theme}
                  lang={lang}
                  externalCommandSeq={labCmdSeq}
                  externalCommandKind={labCmdKind}
                />
              </Suspense>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 04 // KEYWORD EXPERIENCE & STACK MATRIX (ZERO BULLET WALLS)         */}
        {/* =================================================================== */}
        <section id="sec-stack" className="py-16 sm:py-24 px-5 sm:px-8 border-t border-[var(--hairline)]">
          <div className="max-w-[1200px] mx-auto space-y-14">
            {/* Experience — 3 Ultra-Clean Single-Row Lines */}
            <div>
              <span className="font-mono-tech text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
                03 · {lang === 'vi' ? 'Kinh Nghiệm' : 'Track Record'}
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--fg-primary)] mt-1 mb-7">
                {lang === 'vi' ? 'Thực Chiến & Học Vấn' : 'Experience'}
              </h2>

              <div className="divide-y divide-[var(--hairline)] border-y border-[var(--hairline)]">
                {EXPERIENCE_ROWS.map((row) => (
                  <div
                    key={row.org}
                    className="py-5 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-center"
                  >
                    <span className="lg:col-span-2 font-mono-tech text-xs text-[var(--fg-muted)]">
                      {row.period}
                    </span>
                    <div className="lg:col-span-4 flex items-baseline gap-2.5">
                      <strong className="font-display text-lg font-bold text-[var(--fg-primary)]">
                        {row.org}
                      </strong>
                      <span className="text-xs text-[var(--fg-secondary)]">
                        {lang === 'vi' ? row.roleVi : row.roleEn}
                      </span>
                    </div>
                    <div className="lg:col-span-6 flex flex-wrap lg:justify-end gap-1.5">
                      {row.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-2.5 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--hairline)] font-mono-tech text-[10.5px] text-[var(--fg-secondary)]"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pure Keyword Stack Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {SKILL_GROUPS.map((group) => (
                <div
                  key={group.labelEn}
                  className="scroll-view-reveal p-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--hairline)] space-y-4"
                >
                  <div className="font-mono-tech text-[11px] uppercase tracking-wider text-[var(--fg-muted)]">
                    {lang === 'vi' ? group.labelVi : group.labelEn}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 rounded-full bg-[var(--bg-panel)] border border-[var(--hairline)] font-mono-tech text-[11px] text-[var(--fg-primary)]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 05 // MINIMALIST 3-CV DOSSIER & DIRECT CONTACT                      */}
        {/* =================================================================== */}
        <section id="sec-dossier" className="py-16 sm:py-24 px-5 sm:px-8 border-t border-[var(--hairline)]">
          <div className="max-w-[1200px] mx-auto space-y-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="font-mono-tech text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
                  04 · {lang === 'vi' ? 'Hồ Sơ & Liên Hệ' : 'Dossier & Dispatch'}
                </span>
                <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[var(--fg-primary)] mt-1">
                  {lang === 'vi' ? 'Kết Nối Trực Tiếp' : 'Let’s Build.'}
                </h2>
              </div>
              <span className="font-mono-tech text-xs text-[var(--fg-muted)]">
                B2B / Deel / Wire · 4–6h US/EU/APAC Overlap
              </span>
            </div>

            {/* 3 Clean CV Download Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CV_DOSSIERS.map((cv) => (
                <a
                  key={cv.id}
                  href={cv.href}
                  target="_blank"
                  rel="noreferrer"
                  className="scroll-view-reveal group p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--hairline)] hover:border-[var(--hairline-strong)] transition flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span style={{ backgroundColor: cv.accent }} className="w-2 h-2 rounded-full shrink-0" />
                      <strong className="font-display text-lg font-bold text-[var(--fg-primary)]">
                        {lang === 'vi' ? cv.titleVi : cv.titleEn}
                      </strong>
                    </div>
                    <div className="font-mono-tech text-[11px] text-[var(--fg-secondary)] truncate">
                      {cv.keywords}
                    </div>
                  </div>
                  <span className="shrink-0 px-3 py-1.5 rounded-full bg-[var(--bg-panel)] border border-[var(--hairline)] font-mono-tech text-[11px] font-semibold text-[var(--fg-primary)] group-hover:bg-[var(--accent)] group-hover:text-white group-hover:border-transparent transition">
                    PDF ↗
                  </span>
                </a>
              ))}
            </div>

            {/* Direct Contact Strip */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--hairline)] flex flex-wrap items-center justify-between gap-3 font-mono-tech text-xs">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="px-4 py-2 rounded-full bg-[var(--bg-panel)] border border-[var(--hairline)] text-[var(--fg-primary)] hover:border-[var(--accent)] transition cursor-pointer"
                >
                  {copiedEmail ? 'Copied: tinhkun102@gmail.com' : 'tinhkun102@gmail.com'}
                </button>
                <a
                  href="tel:+84931467024"
                  className="px-4 py-2 rounded-full bg-[var(--bg-panel)] border border-[var(--hairline)] text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition"
                >
                  +84 931 467 024
                </a>
                <button
                  type="button"
                  onClick={() => {
                    tactileAudio.playLatch();
                    setZaloModalOpen(true);
                  }}
                  style={{ backgroundColor: 'var(--accent)', color: '#FFFFFF' }}
                  className="px-4 py-2 rounded-full font-semibold hover:opacity-90 transition cursor-pointer"
                >
                  Zalo QR
                </button>
              </div>

              <div className="flex items-center gap-4 text-[var(--fg-secondary)]">
                <a href="https://github.com/tvt987" target="_blank" rel="noreferrer" className="hover:text-[var(--fg-primary)] transition">
                  GitHub ↗
                </a>
                <a
                  href="https://www.linkedin.com/in/tr%C6%B0%C6%A1ng-v%C4%83n-t%C3%ACnh-651b12289/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--fg-primary)] transition"
                >
                  LinkedIn ↗
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal 1-Line Footer (extra bottom clearance for floating dock on desktop) */}
      <footer className="relative z-10 py-8 pb-10 md:pb-24 px-5 sm:px-8 border-t border-[var(--hairline)]">
        <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-between gap-2 font-mono-tech text-[11px] text-[var(--fg-muted)]">
          <span>© 2026 Truong Van Tinh · Ho Chi Minh City</span>
          <span>29 Live Apps · 26/26 Full-Stack .NET 10 / FastAPI Monorepos (100% Master Interactive · 20 Three.js 3D) · 12 Free Pro Tools v3.0 · 5,043 Live CI Tests · v12.0</span>
        </div>
      </footer>

      {/* Bottom Floating Apple-Style Liquid Glass Spring-Magnification Dock */}
      <FlagshipDock
        works={FLAGSHIP_WORKS}
        onScrollToSection={scrollToSection}
        onOpenCommandPalette={() => setCmdOpen(true)}
        onOpenAskAi={() => setAskAiOpen(true)}
      />

      {/* Ask AI Digital Twin & Instant JD Fit Matcher Modal */}
      {askAiOpen && (
        <Suspense fallback={null}>
          <AskTinhModal
            open={askAiOpen}
            lang={lang}
            onClose={() => setAskAiOpen(false)}
            onEngineProbe={setAiProbe}
          />
        </Suspense>
      )}

      {/* Shared-Element View Transition Lightbox + Live Interactive Sandbox */}
      {lightboxId !== null && (
        <Suspense fallback={null}>
          <FlagshipLightbox
            items={FLAGSHIP_WORKS}
            activeId={lightboxId}
            lang={lang}
            onClose={closeLightboxWithTransition}
            onSelectId={setLightboxId}
          />
        </Suspense>
      )}

      {/* Command Palette (CMD+K) */}
      {cmdOpen && (
        <Suspense fallback={null}>
          <CommandPaletteModal open={cmdOpen} onClose={() => setCmdOpen(false)} items={commandItems} lang={lang} />
        </Suspense>
      )}

      {/* Zalo QR Modal */}
      {zaloModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setZaloModalOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="liquid-glass w-full max-w-xs p-6 rounded-3xl space-y-4 text-center"
          >
            <div className="flex items-center justify-between font-mono-tech text-xs">
              <span className="text-[var(--fg-primary)] font-bold">ZALO · +84 931 467 024</span>
              <button
                type="button"
                onClick={() => setZaloModalOpen(false)}
                className="text-[var(--fg-muted)] hover:text-[var(--fg-primary)] cursor-pointer"
              >
                ESC
              </button>
            </div>
            <img
              src="./zalo_qr.jpg"
              alt="Zalo QR Truong Van Tinh"
              className="w-full rounded-2xl border border-[var(--hairline)]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
