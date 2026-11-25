import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { CommandPaletteModal, type CommandItem } from './components/CommandPaletteModal';
import { ContractEstimatorAndDossier } from './components/ContractEstimatorAndDossier';
import { DistributedSystemsLab } from './components/DistributedSystemsLab';
import { MagneticCursor } from './components/MagneticCursor';
import { MonographPlateCard } from './components/MonographPlateCard';
import { WebGLMonolithCanvas } from './components/WebGLMonolithCanvas';
import {
  ARCHITECTURAL_LAWS,
  EXPERIENCE_LEDGER,
  MONOGRAPH_PLATES,
} from './data/atelierContent';
import { tactileAudio } from './engines/tactileAudio';
import {
  applyAtelierThemeWithTransition,
  type AtelierTheme,
} from './engines/themeTransition';

gsap.registerPlugin(ScrollTrigger);

const MANIFESTO_EN =
  'Most interfaces imitate complexity with decorative gradients. Real engineering lives underneath: deterministic state machines, sub-millisecond memory discipline, lock-free concurrency invariants, and AI retrieval engines that refuse to hallucinate when production is on fire.';

const MANIFESTO_VI =
  'Phần lớn giao diện hiện đại chỉ tô vẽ sự phức tạp bằng màu chuyển sắc bề nổi. Giá trị kỹ thuật thực sự nằm ở tầng sâu: máy trạng thái tất định, kỷ luật bộ nhớ dưới một phần nghìn giây, bất biến chống âm kho phi khóa và trí tuệ nhân tạo biết từ chối bịa đặt khi hệ thống chịu tải đỉnh.';

export function App() {
  const [theme, setTheme] = useState<AtelierTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('atelier_theme');
      if (saved === 'paper' || saved === 'obsidian') return saved;
    }
    return 'obsidian';
  });
  const [lang, setLang] = useState<'en' | 'vi'>('en');
  const [audioOn, setAudioOn] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(60);
  const [saigonClock, setSaigonClock] = useState<string>('');
  const [cmdOpen, setCmdOpen] = useState<boolean>(false);
  const [zaloModalOpen, setZaloModalOpen] = useState<boolean>(false);
  const [labCmdSeq, setLabCmdSeq] = useState<number>(0);
  const [labCmdKind, setLabCmdKind] = useState<
    'RAFT_FAILOVER' | 'SHARD_OUTAGE' | 'BENCHMARK' | null
  >(null);

  const scrollProgressRef = useRef<number>(0);
  const scrollVelocityRef = useRef<number>(0);
  const manifestoRef = useRef<HTMLParagraphElement | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Sync initial theme & language attributes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  // Live Ho Chi Minh City (UTC+7) Precision Clock
  useEffect(() => {
    const updateClock = () => {
      try {
        const fmt = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Ho_Chi_Minh',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(new Date());
        setSaigonClock(`${fmt} ICT`);
      } catch {
        setSaigonClock('UTC+07:00');
      }
    };
    updateClock();
    const id = window.setInterval(updateClock, 1000);
    return () => clearInterval(id);
  }, []);

  // Global Cmd+K / Ctrl+K shortcut
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

  // Lenis Smooth Inertial Scroll + GSAP ScrollTrigger Synchronization
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.08,
      smoothWheel: true,
      wheelMultiplier: 0.95,
    });
    lenisRef.current = lenis;

    lenis.on('scroll', (e: { progress: number; velocity: number }) => {
      scrollProgressRef.current = e.progress;
      scrollVelocityRef.current = e.velocity;
      ScrollTrigger.update();
    });

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    // Native scroll listener fallback so headless/programmatic window.scrollTo updates shader progress too
    const onNativeScroll = () => {
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
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

  // GSAP ScrollTrigger Word-by-Word Optical Manifesto Illumination
  useEffect(() => {
    const container = manifestoRef.current;
    if (!container) return;
    const words = container.querySelectorAll<HTMLSpanElement>('.manifesto-word');
    if (!words.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        { opacity: 0.34 },
        {
          opacity: 1,
          stagger: 0.04,
          ease: 'none',
          scrollTrigger: {
            trigger: container,
            start: 'top 84%',
            end: 'bottom 46%',
            scrub: true,
          },
        }
      );
    }, container);

    return () => ctx.revert();
  }, [lang]);

  const scrollToSection = useCallback((id: string) => {
    tactileAudio.playTick(1360);
    const el = document.getElementById(id);
    if (!el) return;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(el, { offset: -52 });
    } else {
      el.scrollIntoView({ behavior: 'smooth' });
    }
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

  const handleToggleAudio = useCallback(() => {
    const next = tactileAudio.toggle();
    setAudioOn(next);
  }, []);

  const commandItems: CommandItem[] = useMemo(
    () => [
      {
        id: 'nav-lab',
        code: '01',
        group: 'NAVIGATION',
        label:
          lang === 'vi'
            ? 'Đi tới Phòng Thí Nghiệm Hệ Phân Tán & Vector HNSW'
            : 'Jump to Interactive Distributed & HNSW Vector Lab',
        hint: 'SEC 03',
        onSelect: () => scrollToSection('sec-lab'),
      },
      {
        id: 'nav-works',
        code: '02',
        group: 'NAVIGATION',
        label:
          lang === 'vi'
            ? 'Đi tới Các Hệ Thống Thực Chiến (Monograph Plates 01–04)'
            : 'Jump to Selected Systems Monograph (Plates 01–04)',
        hint: 'SEC 04',
        onSelect: () => scrollToSection('sec-works'),
      },
      {
        id: 'act-theme',
        code: '03',
        group: 'VIEW TRANSITION API',
        label:
          theme === 'obsidian'
            ? 'Morph Surface -> Swiss Archival Paper (Light Studio)'
            : 'Morph Surface -> Carbon Obsidian (Dark Studio)',
        hint: 'CLIP-PATH WIPE',
        onSelect: () => handleThemeSwitch(),
      },
      {
        id: 'act-raft',
        code: '04',
        group: 'WEB WORKER SIMULATION',
        label: 'Assassinate Raft Leader & Observe Quorum Election',
        hint: 'LIVE CHAOS',
        onSelect: () => {
          scrollToSection('sec-lab');
          setLabCmdKind('RAFT_FAILOVER');
          setLabCmdSeq((s) => s + 1);
        },
      },
      {
        id: 'act-bench',
        code: '05',
        group: 'HARDWARE COMPUTE',
        label: 'Execute 384-d SIMD Vector & CAS Worker Benchmark',
        hint: 'FLOAT32 OPS/S',
        onSelect: () => {
          scrollToSection('sec-lab');
          setLabCmdKind('BENCHMARK');
          setLabCmdSeq((s) => s + 1);
        },
      },
      {
        id: 'act-aegispulse',
        code: '06',
        group: 'LIVE DEPLOYMENT',
        label: 'Open AegisPulse (.NET 10 + Hybrid RAG) Live Control Plane ↗',
        hint: 'GITHUB PAGES',
        onSelect: () => {
          window.open('https://tvt987.github.io/aegispulse-distributed-sre/', '_blank');
        },
      },
      {
        id: 'act-lang',
        code: '07',
        group: 'LOCALIZATION',
        label:
          lang === 'en'
            ? 'Chuyển ngôn ngữ sang Tiếng Việt (VI)'
            : 'Switch Editorial Language to English (EN)',
        hint: 'EN / VI',
        onSelect: () => setLang((l) => (l === 'en' ? 'vi' : 'en')),
      },
      {
        id: 'act-audio',
        code: '08',
        group: 'WEB AUDIO SYNTH',
        label: audioOn
          ? 'Mute Procedural Tactile Relay Acoustics'
          : 'Enable Procedural Tactile Relay Acoustics',
        hint: 'WEB AUDIO API',
        onSelect: handleToggleAudio,
      },
      {
        id: 'cv-backend',
        code: '09',
        group: 'DOSSIER PDF',
        label: 'Download CV_Backend_TruongVanTinh.pdf (.NET / Concurrency)',
        hint: 'DIRECT PDF',
        onSelect: () => {
          window.open('./CV_Backend_TruongVanTinh.pdf', '_blank');
        },
      },
      {
        id: 'cv-fullstack',
        code: '10',
        group: 'DOSSIER PDF',
        label: 'Download CV_FullStack_TruongVanTinh.pdf (.NET + React/Angular)',
        hint: 'DIRECT PDF',
        onSelect: () => {
          window.open('./CV_FullStack_TruongVanTinh.pdf', '_blank');
        },
      },
      {
        id: 'cv-ai',
        code: '11',
        group: 'DOSSIER PDF',
        label: 'Download CV_AI_TruongVanTinh.pdf (Python / FastAPI / RAG)',
        hint: 'DIRECT PDF',
        onSelect: () => {
          window.open('./CV_AI_TruongVanTinh.pdf', '_blank');
        },
      },
      {
        id: 'contact-zalo',
        code: '12',
        group: 'DIRECT CONTACT',
        label: 'Open Zalo QR Lightbox — (+84) 0931 467 024',
        hint: 'HOTLINE',
        onSelect: () => setZaloModalOpen(true),
      },
    ],
    [audioOn, handleThemeSwitch, handleToggleAudio, lang, scrollToSection, theme]
  );

  const manifestoWords = (lang === 'vi' ? MANIFESTO_VI : MANIFESTO_EN).split(' ');

  return (
    <div className="min-h-screen relative selection:bg-[var(--accent)] selection:text-white">
      {/* Tactile Analog Film Grain + Spring Magnetic Reticle */}
      <div className="grain-overlay" />
      <MagneticCursor />

      {/* Native CSS Scroll-Driven Compositor Progress Hairline */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-[80] bg-transparent pointer-events-none">
        <div className="scroll-progress-line h-full w-full" />
      </div>

      {/* ===================================================================== */}
      {/* STICKY SWISS PRECISION TELEMETRY RAIL                                 */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-50 bg-[var(--bg-glass)] backdrop-blur-xl hairline-b">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-8 h-13 flex items-center justify-between gap-2">
          {/* Identity Mark & Coordinates */}
          <div className="flex items-center gap-3 min-w-0">
            <a
              href="#top"
              data-cursor="INDEX 00"
              className="flex items-center gap-2 shrink-0"
            >
              <span
                style={{ backgroundColor: 'var(--accent)' }}
                className="w-2.5 h-2.5 inline-block shrink-0"
              />
              <span className="font-mono-tech text-xs font-bold tracking-wider uppercase text-[var(--fg-primary)] hidden sm:inline">
                TRUONG VAN TINH
              </span>
              <span className="font-mono-tech text-xs font-bold tracking-wider uppercase text-[var(--fg-primary)] sm:hidden">
                TVT // ATELIER
              </span>
            </a>
            <span className="hidden xl:inline-block font-mono-tech text-[11px] text-[var(--fg-muted)]">
              // SGN 10.7769°N 106.7009°E · {saigonClock}
            </span>
            <span className="hidden md:inline-block font-mono-tech text-[11px] text-[var(--fg-muted)]">
              // SHADER: <strong style={{ color: 'var(--signal-ok)' }}>{fps} FPS</strong>
            </span>
          </div>

          {/* Section Index Jump Links */}
          <nav className="hidden lg:flex items-center gap-5 font-mono-tech text-[11px] text-[var(--fg-secondary)]">
            <button
              type="button"
              onClick={() => scrollToSection('sec-manifesto')}
              className="hover:text-[var(--fg-primary)] transition cursor-pointer"
            >
              01.MANIFESTO
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('sec-lab')}
              className="hover:text-[var(--fg-primary)] transition cursor-pointer"
            >
              02.SYSTEMS_LAB
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('sec-works')}
              className="hover:text-[var(--fg-primary)] transition cursor-pointer"
            >
              03.MONOGRAPH
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('sec-dossier')}
              className="hover:text-[var(--fg-primary)] transition cursor-pointer"
            >
              04.DISPATCH
            </button>
          </nav>

          {/* Hardware Switches: Audio, Theme Aperture Morph, Language, Cmd+K */}
          <div className="flex items-center gap-1.5 sm:gap-2 font-mono-tech text-[10px] font-semibold shrink-0">
            <button
              type="button"
              data-testid="btn-audio-toggle"
              data-cursor="WEB AUDIO"
              onClick={handleToggleAudio}
              className="hidden sm:inline-flex px-2.5 py-1.5 hairline-box text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition cursor-pointer"
            >
              SND:{audioOn ? 'ON' : 'OFF'}
            </button>

            <button
              type="button"
              data-testid="btn-theme-morph"
              data-cursor="THEME WIPE"
              onClick={handleThemeSwitch}
              className="px-2 sm:px-2.5 py-1.5 hairline-box text-[var(--fg-primary)] hover:border-[var(--accent)] transition cursor-pointer uppercase"
            >
              <span className="hidden sm:inline">
                {theme === 'obsidian' ? 'SURFACE:OBSIDIAN' : 'SURFACE:PAPER'}
              </span>
              <span className="sm:hidden">
                {theme === 'obsidian' ? 'OBSIDIAN' : 'PAPER'}
              </span>
            </button>

            <button
              type="button"
              data-testid="btn-lang-toggle"
              data-cursor="LOCALE"
              onClick={() => {
                tactileAudio.playTick();
                setLang((l) => (l === 'en' ? 'vi' : 'en'));
              }}
              className="px-2 sm:px-2.5 py-1.5 hairline-box text-[var(--fg-primary)] hover:border-[var(--accent)] transition cursor-pointer"
            >
              {lang === 'en' ? 'EN/VI' : 'VI/EN'}
            </button>

            <button
              type="button"
              data-testid="btn-open-cmd"
              data-cursor="COMMAND PALETTE"
              onClick={() => {
                tactileAudio.playLatch();
                setCmdOpen(true);
              }}
              style={{ backgroundColor: 'var(--fg-primary)', color: 'var(--bg-primary)' }}
              className="px-2 sm:px-2.5 py-1.5 font-bold tracking-wider cursor-pointer"
            >
              CMD+K
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* MAIN ARCHITECTURAL DRAFTING GRID                                      */}
      {/* ===================================================================== */}
      <main id="top" className="max-w-[1440px] mx-auto hairline-l hairline-r">
        {/* ----------------------------------------------------------------- */}
        {/* 00 // ASYMMETRIC MONUMENTAL HERO + LIVE 3D RAYMARCHED STAGE       */}
        {/* ----------------------------------------------------------------- */}
        <section className="min-h-[86vh] grid grid-cols-1 lg:grid-cols-12 hairline-b relative">
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-14 flex flex-col justify-between gap-9">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 px-3 py-1.5 conic-signal-badge font-mono-tech text-[10.5px] sm:text-[11px]">
                <span
                  style={{ backgroundColor: 'var(--signal-ok)' }}
                  className="w-2 h-2 rounded-full inline-block shrink-0"
                />
                <span className="uppercase tracking-wider text-[var(--fg-primary)]">
                  {lang === 'vi'
                    ? 'SẴN SÀNG NHẬN HỢP ĐỒNG REMOTE B2B & MILESTONE · $25–$45/HR'
                    : 'AVAILABLE FOR REMOTE B2B CONTRACTS & FIXED MILESTONES · $25–$45/HR'}
                </span>
              </div>

              <h1 className="font-display hero-headline font-extrabold tracking-tight text-[var(--fg-primary)]">
                {lang === 'vi' ? (
                  <>
                    KIẾN TRÚC CHỊU TẢI
                    <br />
                    <span className="font-serif-editorial italic font-normal text-[var(--accent)]">
                      chuẩn xác tuyệt đối
                    </span>
                    <br />
                    &amp; AI THỰC CHIẾN.
                  </>
                ) : (
                  <>
                    DISTRIBUTED
                    <br />
                    SYSTEMS WITH{' '}
                    <span className="font-serif-editorial italic font-normal text-[var(--accent)]">
                      surgical precision.
                    </span>
                  </>
                )}
              </h1>

              <p className="max-w-xl text-sm sm:text-base lg:text-lg leading-relaxed text-[var(--fg-secondary)]">
                {lang === 'vi'
                  ? 'Trương Văn Tình — Kỹ sư Full-Stack .NET & Applied AI với hơn 3 năm vận hành hệ thống lõi cho 700+ siêu thị Con Cưng (5.000+ RPS, 0% âm kho), kiến tạo các nhân giao dịch phi khóa C# .NET 8/10 và đường ống truy xuất lai Hybrid RAG không ảo giác.'
                  : 'Truong Van Tinh — Full-Stack .NET & Applied AI Engineer with 3+ years shipping core retail infrastructure across 700+ Con Cung hypermarkets (5,000+ RPS, 0% double-spend), lock-free C# .NET 8/10 transaction kernels, and zero-hallucination Hybrid RAG pipelines.'}
              </p>
            </div>

            {/* Hero Primary Actions */}
            <div className="flex flex-wrap items-center gap-3 font-mono-tech text-xs font-bold">
              <button
                type="button"
                data-cursor="INTERACTIVE LAB"
                onClick={() => scrollToSection('sec-lab')}
                style={{ backgroundColor: 'var(--accent)', color: '#FFFFFF' }}
                className="px-5 sm:px-6 py-3.5 uppercase tracking-wider hover:opacity-90 transition cursor-pointer"
              >
                {lang === 'vi'
                  ? 'Khám Phá Phòng Lab Tương Tác ↓'
                  : 'Enter Live Distributed Lab ↓'}
              </button>

              <a
                href="https://tvt987.github.io/aegispulse-distributed-sre/"
                target="_blank"
                rel="noreferrer"
                data-cursor="OPEN AEGISPULSE ↗"
                className="px-4 sm:px-5 py-3.5 hairline-box bg-[var(--bg-elevated)] text-[var(--fg-primary)] hover:border-[var(--accent)] uppercase tracking-wider transition"
              >
                AegisPulse (.NET 10 + RAG) ↗
              </a>

              <button
                type="button"
                data-cursor="DOWNLOAD CVs"
                onClick={() => scrollToSection('sec-dossier')}
                className="px-4 sm:px-5 py-3.5 hairline-box bg-[var(--bg-elevated)] text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] uppercase tracking-wider transition cursor-pointer"
              >
                {lang === 'vi' ? 'Hồ Sơ PDF & Zalo QR' : 'CV Dossier & Zalo QR'}
              </button>
            </div>
          </div>

          {/* Right 5 Cols: Dedicated Interactive WebGL2 SDF Raymarching Stage + 4 Hard Metrics */}
          <div className="lg:col-span-5 hairline-l p-5 sm:p-7 flex flex-col justify-between gap-5 bg-[var(--bg-panel)]">
            <div className="flex-1 flex flex-col">
              <WebGLMonolithCanvas
                theme={theme}
                scrollProgressRef={scrollProgressRef}
                scrollVelocityRef={scrollVelocityRef}
                onFpsSample={setFps}
              />
            </div>

            {/* Hard Production Metrics Ledger */}
            <div className="grid grid-cols-2 gap-px bg-[var(--hairline)] hairline-box font-mono-tech">
              <div className="bg-[var(--bg-elevated)] p-3.5">
                <span className="text-[9.5px] text-[var(--fg-muted)] block">RETAIL FOOTPRINT</span>
                <strong className="text-base sm:text-lg font-bold text-[var(--fg-primary)]">
                  700+ STORES
                </strong>
              </div>
              <div className="bg-[var(--bg-elevated)] p-3.5">
                <span className="text-[9.5px] text-[var(--fg-muted)] block">.NET 10 CAS BENCH</span>
                <strong style={{ color: 'var(--accent)' }} className="text-base sm:text-lg font-bold">
                  139,099 RPS
                </strong>
              </div>
              <div className="bg-[var(--bg-elevated)] p-3.5">
                <span className="text-[9.5px] text-[var(--fg-muted)] block">DOUBLE-SPENDING</span>
                <strong
                  style={{ color: 'var(--signal-ok)' }}
                  className="text-base sm:text-lg font-bold"
                >
                  0.000%
                </strong>
              </div>
              <div className="bg-[var(--bg-elevated)] p-3.5">
                <span className="text-[9.5px] text-[var(--fg-muted)] block">HYBRID RAG OOD</span>
                <strong className="text-base sm:text-lg font-bold text-[var(--fg-primary)]">
                  100% GUARD
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* 01 // SCRUBBED KINETIC MANIFESTO & 4 ARCHITECTURAL LAWS           */}
        {/* ----------------------------------------------------------------- */}
        <section id="sec-manifesto" className="hairline-b bg-[var(--bg-glass)] backdrop-blur-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 hairline-b">
            <div className="lg:col-span-3 p-6 sm:p-10 hairline-r font-mono-tech text-xs text-[var(--fg-muted)]">
              <div>[01 // ENGINEERING DOCTRINE]</div>
              <div className="mt-2 text-[var(--fg-secondary)]">
                FIRST PRINCIPLES FROM PRODUCTION HIGH-LOAD RETAIL &amp; APPLIED AI
              </div>
            </div>
            <div className="lg:col-span-9 p-6 sm:p-12">
              <p
                ref={manifestoRef}
                className="font-display text-2xl sm:text-4xl font-bold leading-[1.22] text-[var(--fg-primary)]"
              >
                {manifestoWords.map((word, idx) => (
                  <span key={`${word}-${idx}`} className="manifesto-word inline-block mr-[0.28em]">
                    {word}
                  </span>
                ))}
              </p>
            </div>
          </div>

          {/* 4 Architectural Laws */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {ARCHITECTURAL_LAWS.map((law) => (
              <div
                key={law.index}
                className="p-6 sm:p-8 hairline-r hairline-b lg:border-b-0 flex flex-col justify-between gap-5 bg-[var(--bg-elevated)]/85"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono-tech text-[11px]">
                    <span className="text-[var(--fg-muted)]">{law.index}</span>
                    <span style={{ color: 'var(--accent)' }} className="font-bold">
                      {law.metric}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-[var(--fg-primary)] leading-snug">
                    {lang === 'vi' ? law.titleVi : law.titleEn}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-[var(--fg-secondary)]">
                  {lang === 'vi' ? law.bodyVi : law.bodyEn}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* 02 // OFF-MAIN-THREAD DISTRIBUTED & HNSW VECTOR INTERACTIVE LAB   */}
        {/* ----------------------------------------------------------------- */}
        <section id="sec-lab" className="p-6 sm:p-10 lg:p-12 hairline-b bg-[var(--bg-primary)]/92">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
            <div>
              <span className="font-mono-tech text-[11px] uppercase tracking-widest text-[var(--accent)] block">
                [02 // INTERACTIVE OFF-MAIN-THREAD COMPUTE LAB]
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold mt-1 text-[var(--fg-primary)]">
                {lang === 'vi'
                  ? 'Mô Phỏng Hệ Phân Tán & Đồ Thị Vector Thời Gian Thực'
                  : 'Live Distributed Consensus & Vector Graph Engine'}
              </h2>
            </div>
            <p className="max-w-md font-mono-tech text-xs text-[var(--fg-secondary)] leading-relaxed">
              {lang === 'vi'
                ? 'Không dùng ảnh tĩnh hay biểu đồ giả lập: toàn bộ gói tin, bầu cử Raft Quorum và tìm kiếm tia HNSW chạy trực tiếp trên luồng Web Worker độc lập.'
                : 'Zero canned animations: consistent-hash virtual tokens, Raft election timers, and 3-layer HNSW beam searches execute live inside a dedicated Web Worker.'}
            </p>
          </div>

          <DistributedSystemsLab
            theme={theme}
            lang={lang}
            externalCommandSeq={labCmdSeq}
            externalCommandKind={labCmdKind}
          />
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* 03 // SWISS MONOGRAPH PLATES: VERIFIED PRODUCTION & OSS SYSTEMS   */}
        {/* ----------------------------------------------------------------- */}
        <section id="sec-works" className="hairline-b bg-[var(--bg-primary)]/95">
          <div className="p-6 sm:p-10 lg:p-12 hairline-b flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="font-mono-tech text-[11px] uppercase tracking-widest text-[var(--accent)] block">
                [03 // VERIFIED ARCHITECTURAL MONOGRAPH]
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold mt-1 text-[var(--fg-primary)]">
                {lang === 'vi'
                  ? 'Các Hệ Thống Mã Nguồn Mở & Kiểm Thử CI 100%'
                  : 'Selected Production & CI-Verified Systems'}
              </h2>
            </div>
            <a
              href="https://github.com/tvt987"
              target="_blank"
              rel="noreferrer"
              data-cursor="GITHUB PROFILE ↗"
              className="font-mono-tech text-xs font-bold uppercase tracking-wider px-4 py-2.5 hairline-box text-[var(--fg-primary)] hover:border-[var(--accent)] transition self-start sm:self-auto"
            >
              GITHUB.COM/TVT987 (ALL REPOS) ↗
            </a>
          </div>

          <div>
            {MONOGRAPH_PLATES.map((item, idx) => (
              <MonographPlateCard
                key={item.plateNo}
                item={item}
                index={idx}
                lang={lang}
              />
            ))}
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* 04 // PRODUCTION TRACK RECORD & ACADEMIC CREDENTIALS              */}
        {/* ----------------------------------------------------------------- */}
        <section className="hairline-b bg-[var(--bg-elevated)]/95">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-4 p-6 sm:p-10 lg:p-12 hairline-r flex flex-col justify-between">
              <div>
                <span className="font-mono-tech text-[11px] uppercase tracking-widest text-[var(--accent)] block">
                  [04 // ENTERPRISE TRACK RECORD]
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold mt-2 text-[var(--fg-primary)]">
                  {lang === 'vi' ? 'Lịch Sử Thực Chiến Doanh Nghiệp' : 'Production Career Ledger'}
                </h2>
                <p className="text-sm text-[var(--fg-secondary)] mt-3 leading-relaxed">
                  {lang === 'vi'
                    ? 'Kết hợp nền tảng kỹ thuật phần mềm bài bản tại ĐH Công Nghệ Thông Tin (UIT — ĐHQG TP.HCM) với hơn 3 năm trực tiếp xây dựng hệ thống lõi chịu tải cao.'
                    : 'Combining formal Computer Science & IT foundations at UIT (VNU-HCM) with 3+ years owning mission-critical retail & AI software in production.'}
                </p>
              </div>

              <div className="mt-8 p-4 hairline-box bg-[var(--bg-panel)] font-mono-tech text-[11px] space-y-1.5">
                <div className="text-[var(--fg-muted)]">PRIMARY STACK MATRIX</div>
                <div className="text-[var(--fg-primary)]">
                  C# · .NET 8/10 · Dapper · SQL Server · PostgreSQL · Redis Lua · RabbitMQ · Polly · Keycloak OIDC · Python 3.12 · FastAPI · Qdrant · Hybrid RAG · Angular 19 · React 19 · TypeScript · Docker
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 divide-y divide-[var(--hairline)]">
              {EXPERIENCE_LEDGER.map((exp) => (
                <div key={exp.org} className="p-6 sm:p-10 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono-tech text-xs">
                    <span style={{ color: 'var(--accent)' }} className="font-bold">
                      {exp.period}
                    </span>
                    <span className="px-2.5 py-0.5 hairline-box text-[10px] text-[var(--fg-muted)]">
                      {exp.scopeBadge}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-[var(--fg-primary)]">
                      {exp.org}
                    </h3>
                    <span className="font-serif-editorial italic text-lg text-[var(--fg-secondary)]">
                      {lang === 'vi' ? exp.roleVi : exp.roleEn}
                    </span>
                  </div>
                  <ul className="space-y-2 pt-1 text-sm text-[var(--fg-secondary)] leading-relaxed">
                    {(lang === 'vi' ? exp.bulletsVi : exp.bulletsEn).map((b) => (
                      <li key={b} className="flex gap-3">
                        <span style={{ color: 'var(--accent)' }} className="font-mono-tech shrink-0">
                          —
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* 05 // DIRECT CONTRACT ESTIMATOR, 3-CV DOSSIER & ZALO QR           */}
        {/* ----------------------------------------------------------------- */}
        <section id="sec-dossier" className="p-6 sm:p-10 lg:p-12 bg-[var(--bg-primary)]/95">
          <div className="mb-8">
            <span className="font-mono-tech text-[11px] uppercase tracking-widest text-[var(--accent)] block">
              [05 // DIRECT ENGAGEMENT &amp; CANDIDATE DOSSIER]
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold mt-1 text-[var(--fg-primary)]">
              {lang === 'vi'
                ? 'Khởi Động Dự Án Ngay Hôm Nay'
                : 'Initiate Remote Contract or Technical Review'}
            </h2>
          </div>

          <ContractEstimatorAndDossier
            lang={lang}
            onOpenZalo={() => {
              tactileAudio.playLatch();
              setZaloModalOpen(true);
            }}
          />
        </section>
      </main>

      {/* ===================================================================== */}
      {/* ARCHITECTURAL COLOPHON FOOTER                                         */}
      {/* ===================================================================== */}
      <footer className="hairline-t bg-[var(--bg-elevated)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono-tech text-[11px] text-[var(--fg-muted)]">
          <div>
            TRUONG VAN TINH // ENGINEERED WITH REACT 19 · TAILWIND V4 · THREE.JS GLSL SDF · WEB WORKERS · VIEW TRANSITIONS · LENIS &amp; GSAP
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[var(--fg-secondary)]">
            <a
              href="https://github.com/tvt987"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--accent)]"
            >
              GITHUB ↗
            </a>
            <a
              href="https://www.linkedin.com/in/tr%C6%B0%C6%A1ng-v%C4%83n-t%C3%ACnh-651b12289/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--accent)]"
            >
              LINKEDIN ↗
            </a>
            <a
              href="https://tvt987.github.io/aegispulse-distributed-sre/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--accent)]"
            >
              AEGISPULSE LAB ↗
            </a>
          </div>
        </div>
      </footer>

      {/* Command Palette Modal (Cmd+K) */}
      <CommandPaletteModal
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        items={commandItems}
        lang={lang}
      />

      {/* High-Contrast Zalo QR Lightbox Modal */}
      {zaloModalOpen && (
        <div
          data-testid="zalo-qr-modal"
          onClick={() => setZaloModalOpen(false)}
          className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-sm w-full bg-[var(--bg-panel)] hairline-box p-6 space-y-4 text-center"
          >
            <div className="flex items-center justify-between font-mono-tech text-[11px] text-[var(--fg-muted)] hairline-b pb-2.5">
              <span>ZALO DIRECT CHANNEL</span>
              <button
                type="button"
                onClick={() => setZaloModalOpen(false)}
                className="px-2 py-0.5 hairline-box text-[var(--fg-primary)] cursor-pointer"
              >
                CLOSE [X]
              </button>
            </div>
            <div className="p-3 bg-white inline-block mx-auto hairline-box">
              <img
                src="./zalo_qr.jpg"
                alt="Zalo QR 0931 467 024"
                className="w-56 h-56 object-cover block"
              />
            </div>
            <div className="font-mono-tech space-y-1">
              <div className="text-base font-bold text-[var(--fg-primary)]">
                (+84) 0931 467 024
              </div>
              <div className="text-[11px] text-[var(--fg-secondary)]">
                TRUONG VAN TINH · FULL-STACK .NET &amp; APPLIED AI
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono-tech text-xs font-bold pt-1">
              <a
                href="https://zalo.me/0931467024"
                target="_blank"
                rel="noreferrer"
                style={{ backgroundColor: 'var(--accent)', color: '#FFFFFF' }}
                className="py-2.5 uppercase"
              >
                OPEN ZALO ↗
              </a>
              <a
                href="tel:0931467024"
                className="py-2.5 hairline-box text-[var(--fg-primary)] uppercase"
              >
                CALL DIRECT
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
