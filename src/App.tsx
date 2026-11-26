import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { CommandPaletteModal, type CommandItem } from './components/CommandPaletteModal';
import { DistributedSystemsLab } from './components/DistributedSystemsLab';
import { FlagshipCard } from './components/FlagshipCard';
import { FlagshipDock } from './components/FlagshipDock';
import { FlagshipLightbox } from './components/FlagshipLightbox';
import { GlyphDecodeText, KineticText } from './components/KineticText';
import { LiquidGlassFilter } from './components/LiquidGlassFilter';
import { MagneticCursor } from './components/MagneticCursor';
import { OdometerMetric } from './components/OdometerMetric';
import { PlatformInspectorPopover } from './components/PlatformInspectorPopover';
import { WebGLMonolithCanvas } from './components/WebGLMonolithCanvas';
import {
  WebGpuAmbientField,
  type AmbientFieldTelemetry,
} from './components/WebGpuAmbientField';
import {
  CV_DOSSIERS,
  EXPERIENCE_ROWS,
  FLAGSHIP_WORKS,
  SKILL_GROUPS,
  type WorkCategory,
} from './data/atelierContent';
import { ambientAudio } from './engines/ambientAudio';
import { tactileAudio } from './engines/tactileAudio';
import { applyAtelierThemeWithTransition, type AtelierTheme } from './engines/themeTransition';

gsap.registerPlugin(ScrollTrigger);

const HERO_KEYWORDS = ['.NET 10', 'Python', 'React 19', 'MCP / A2A', 'DuckDB-WASM', 'Three.js', 'WebGPU'];

const CATEGORIES: Array<{ id: WorkCategory; labelEn: string; labelVi: string }> = [
  { id: 'all', labelEn: 'All', labelVi: 'Tất Cả' },
  { id: 'commerce', labelEn: 'E-Commerce', labelVi: 'Bán Hàng' },
  { id: 'design', labelEn: 'Design Tool', labelVi: 'Thiết Kế' },
  { id: 'ai', labelEn: 'AI & Agents', labelVi: 'AI & Agent' },
  { id: 'systems', labelEn: 'Data & Core', labelVi: 'Hệ Thống' },
];

export function App() {
  const [theme, setTheme] = useState<AtelierTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('atelier_theme');
      if (saved === 'paper' || saved === 'obsidian') return saved;
    }
    return 'obsidian';
  });
  const [lang, setLang] = useState<'en' | 'vi'>('en');
  const [category, setCategory] = useState<WorkCategory>('all');
  const [audioOn, setAudioOn] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(60);
  const [ambientTelemetry, setAmbientTelemetry] = useState<AmbientFieldTelemetry>({
    backend: 'canvas-fallback',
    particleCount: 900,
    label: 'CANVAS FALLBACK · 900',
  });
  const [cmdOpen, setCmdOpen] = useState<boolean>(false);
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [zaloModalOpen, setZaloModalOpen] = useState<boolean>(false);
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);
  const [labCmdSeq, setLabCmdSeq] = useState<number>(0);
  const [labCmdKind, setLabCmdKind] = useState<'RAFT_FAILOVER' | 'SHARD_OUTAGE' | 'BENCHMARK' | null>(null);

  const scrollProgressRef = useRef<number>(0);
  const scrollVelocityRef = useRef<number>(0);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  useEffect(() => {
    return ambientAudio.subscribe((active) => setAudioOn(active));
  }, []);

  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') {
        ev.preventDefault();
        tactileAudio.playLatch();
        setCmdOpen((prev) => !prev);
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
    (ev?: React.MouseEvent<HTMLButtonElement>) => {
      const next: AtelierTheme = theme === 'obsidian' ? 'paper' : 'obsidian';
      tactileAudio.playChordPulse();
      applyAtelierThemeWithTransition(next, ev?.clientX, ev?.clientY, (committed) => {
        setTheme(committed);
      });
    },
    [theme]
  );

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
      ...FLAGSHIP_WORKS.map((w, idx) => ({
        id: `work-${w.id}`,
        code: `0${idx + 1}`,
        group: 'LIVE APPS',
        label: `${w.title} ${w.version} — ${w.highlightMetric} ↗`,
        hint: w.ciBadge,
        onSelect: () => window.open(w.liveUrl, '_blank'),
      })),
      {
        id: 'act-theme',
        code: '07',
        group: 'INTERFACE',
        label: theme === 'obsidian' ? 'Switch to Light Paper Surface' : 'Switch to Dark Obsidian Surface',
        hint: 'VIEW TRANSITION',
        onSelect: () => handleThemeSwitch(),
      },
      {
        id: 'act-audio',
        code: '08',
        group: 'AUDIO DSP',
        label: audioOn ? 'Mute Ambient Synth & FFT' : 'Engage Ambient Harmonic Synth & FFT',
        hint: 'WEB AUDIO',
        onSelect: () => handleToggleAudio(),
      },
      {
        id: 'act-inspector',
        code: '09',
        group: '2026 APIS',
        label: 'Inspect WebGPU / 2026 Hardware Telemetry',
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
        code: '10',
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
        code: `${11 + idx}`,
        group: 'CV PDF',
        label: `${cv.titleEn} (${cv.keywords})`,
        hint: 'PDF',
        onSelect: () => window.open(cv.href, '_blank'),
      })),
      {
        id: 'contact-zalo',
        code: '14',
        group: 'CONTACT',
        label: 'Zalo QR — (+84) 0931 467 024',
        hint: 'QR',
        onSelect: () => setZaloModalOpen(true),
      },
    ],
    [audioOn, handleThemeSwitch, handleToggleAudio, scrollToSection, theme]
  );

  return (
    <div className="min-h-screen relative selection:bg-[var(--accent)] selection:text-white">
      <LiquidGlassFilter />
      <WebGpuAmbientField
        theme={theme}
        scrollVelocityRef={scrollVelocityRef}
        onTelemetryChange={setAmbientTelemetry}
      />
      <div className="grain-overlay" />
      <MagneticCursor />

      {/* Compositor Scroll Progress Hairline */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-[80] pointer-events-none">
        <div className="scroll-progress-line h-full w-full" />
      </div>

      {/* ===================================================================== */}
      {/* FLOATING APPLE 2026 LIQUID GLASS NAVIGATION DOCK                      */}
      {/* ===================================================================== */}
      <header className="fixed top-4 left-0 right-0 z-50 px-3 sm:px-4 pointer-events-none">
        <div className="max-w-[1160px] mx-auto flex items-center justify-between px-3.5 sm:px-5 h-12 rounded-full liquid-glass pointer-events-auto">
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

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[var(--fg-secondary)]">
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

          <div className="flex items-center gap-1.5 font-mono-tech text-[11px]">
            {/* Minimalist Animated Sound Wave Toggle */}
            <button
              type="button"
              data-testid="btn-audio-toggle"
              onClick={handleToggleAudio}
              aria-label={audioOn ? 'Mute ambient synth' : 'Enable ambient synth'}
              title={audioOn ? 'Audio FFT: Live' : 'Audio FFT: Off'}
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
              className="gpu-anchor-btn px-2.5 py-1 rounded-full border border-[var(--hairline)] text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:border-[var(--hairline-strong)] flex items-center gap-1.5 transition cursor-pointer"
            >
              <span
                style={{
                  backgroundColor:
                    ambientTelemetry.backend === 'webgpu'
                      ? 'var(--signal-ok)'
                      : 'var(--signal-warn)',
                }}
                className="w-1.5 h-1.5 rounded-full shrink-0"
              />
              <span className="hidden sm:inline">GPU / 2026 APIs</span>
              <span className="sm:hidden">GPU</span>
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
              onClick={handleThemeSwitch}
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
      </header>

      {/* Native Top-Layer Hardware Inspector Popover */}
      <PlatformInspectorPopover
        fps={fps}
        ambientTelemetry={ambientTelemetry}
        audioOn={audioOn}
        onToggleAudio={handleToggleAudio}
      />

      <main id="top" className="relative z-10">
        {/* =================================================================== */}
        {/* 01 // ULTRA-CLEAN VISUAL HERO (ZERO PROSE PARAGRAPHS)               */}
        {/* =================================================================== */}
        <section className="hero-ambient pt-24 pb-16 sm:pt-32 sm:pb-20 px-5 sm:px-8">
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
                  <GlyphDecodeText text={lang === 'vi' ? 'Xem 6 Dự Án Live ↓' : 'Selected Works ↓'} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('sec-dossier')}
                  className="px-5 py-3 rounded-full border border-[var(--hairline-strong)] bg-[var(--bg-elevated)] text-xs sm:text-sm font-semibold text-[var(--fg-primary)] hover:border-[var(--accent)] transition cursor-pointer"
                >
                  <GlyphDecodeText text={lang === 'vi' ? 'Tải CV PDF' : 'CV Dossier'} />
                </button>
                <a
                  href="https://github.com/tvt987"
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3 rounded-full border border-[var(--hairline)] text-xs sm:text-sm font-medium text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:border-[var(--hairline-strong)] transition"
                >
                  <GlyphDecodeText text="GitHub ↗" />
                </a>
              </div>
            </div>

            {/* Right 5 Cols: Floating Frameless Audio-Reactive WebGL2 3D Ferrofluid Sculpture */}
            <div className="lg:col-span-5 h-[390px] sm:h-[460px] lg:h-[510px]">
              <WebGLMonolithCanvas
                theme={theme}
                scrollProgressRef={scrollProgressRef}
                scrollVelocityRef={scrollVelocityRef}
                onFpsSample={setFps}
              />
            </div>
          </div>

          {/* Floating 4-Metric Odometer Signal Ribbon */}
          <div className="max-w-[1200px] mx-auto mt-12 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: '700+', labelEn: 'Retail Stores', labelVi: 'Siêu Thị Production' },
              { value: '139K', labelEn: 'Peak RPS (.NET 10)', labelVi: 'Đỉnh Tải RPS (.NET 10)' },
              { value: '0.00%', labelEn: 'Double-Spend Leaks', labelVi: 'Lỗi Âm Kho' },
              { value: '135+', labelEn: 'CI Tests Green', labelVi: 'Test Tự Động Xanh' },
            ].map((m) => (
              <div
                key={m.value}
                className="px-5 py-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--hairline)] flex items-baseline justify-between gap-2"
              >
                <OdometerMetric
                  value={m.value}
                  className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--fg-primary)]"
                />
                <span className="font-mono-tech text-[10.5px] text-[var(--fg-muted)] uppercase text-right">
                  {lang === 'vi' ? m.labelVi : m.labelEn}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* =================================================================== */}
        {/* 02 // VISUAL FLAGSHIP GALLERY (6 LIVE APPS WITH 3D TILT + LIGHTBOX) */}
        {/* =================================================================== */}
        <section id="sec-works" className="py-16 sm:py-24 px-5 sm:px-8 border-t border-[var(--hairline)]">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10">
              <div>
                <span className="font-mono-tech text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
                  01 · {lang === 'vi' ? 'Sản Phẩm Live' : 'Selected Works'}
                </span>
                <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[var(--fg-primary)] mt-1">
                  {lang === 'vi' ? '6 Hệ Thống Đang Chạy' : 'Six Live Flagships'}
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
                  onInspect={(work) => setLightboxId(work.id)}
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
              <DistributedSystemsLab
                theme={theme}
                lang={lang}
                externalCommandSeq={labCmdSeq}
                externalCommandKind={labCmdKind}
              />
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
                  data-cursor="OPEN PDF ↗"
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
          <span>WebGPU WGSL · WebGL2 SDF · Liquid Glass · View Transitions</span>
        </div>
      </footer>

      {/* Bottom Floating Apple-Style Liquid Glass Spring-Magnification Dock */}
      <FlagshipDock
        works={FLAGSHIP_WORKS}
        onScrollToSection={scrollToSection}
        onOpenCommandPalette={() => setCmdOpen(true)}
      />

      {/* Instant Liquid Glass Flagship Lightbox */}
      <FlagshipLightbox
        items={FLAGSHIP_WORKS}
        activeId={lightboxId}
        lang={lang}
        onClose={() => setLightboxId(null)}
        onSelectId={setLightboxId}
      />

      {/* Command Palette (CMD+K) */}
      <CommandPaletteModal open={cmdOpen} onClose={() => setCmdOpen(false)} items={commandItems} lang={lang} />

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
