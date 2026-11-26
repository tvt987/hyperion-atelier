import { useEffect, useRef, useState } from 'react';
import { FLAGSHIP_WORKS } from '../data/atelierContent';
import {
  analyzeJdFit,
  probeChromeBuiltInAI,
  queryDigitalTwin,
  queryDigitalTwinLocal,
  SAMPLE_SENIOR_JD,
  type BuiltInAiProbe,
  type JdFitReport,
  type TwinAnswer,
} from '../engines/aiTwinEngine';
import { tactileAudio } from '../engines/tactileAudio';

interface AskTinhModalProps {
  open: boolean;
  lang: 'en' | 'vi';
  onClose: () => void;
  onEngineProbe?: (probe: BuiltInAiProbe) => void;
}

const PROMPT_CHIPS = [
  '139K RPS .NET 10',
  'MCP / A2A Stack',
  'Rate & Overlap',
  'Live Flagships',
];

export function AskTinhModal({ open, lang, onClose, onEngineProbe }: AskTinhModalProps) {
  const [tab, setTab] = useState<'twin' | 'jd'>('twin');
  const [probe, setProbe] = useState<BuiltInAiProbe>({
    engine: 'local-hybrid-rag',
    status: 'unavailable',
    label: 'LOCAL HYBRID RAG · 0ms',
  });
  const [query, setQuery] = useState('');
  const [thinking, setThinking] = useState(false);
  const [answer, setAnswer] = useState<TwinAnswer>(() =>
    queryDigitalTwinLocal('139K RPS .NET 10')
  );
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const [jdText, setJdText] = useState('');
  const [jdReport, setJdReport] = useState<JdFitReport | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const reqSeqRef = useRef<number>(0);

  useEffect(() => {
    void probeChromeBuiltInAI().then((res) => {
      setProbe(res);
      onEngineProbe?.(res);
    });
  }, [onEngineProbe]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      if (tab === 'twin') inputRef.current?.focus();
    }, 30);

    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, open, tab]);

  if (!open) return null;

  const runTwinQuery = async (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    tactileAudio.playLatch();
    setQuery(clean);
    const seq = ++reqSeqRef.current;

    // 0ms deterministic local Hybrid RAG render first (zero latency, zero race)
    const immediate = queryDigitalTwinLocal(clean);
    setAnswer(immediate);

    if (probe.engine === 'chrome-nano') {
      setThinking(true);
      try {
        const res = await queryDigitalTwin(clean);
        if (reqSeqRef.current === seq) {
          setAnswer(res);
        }
      } finally {
        if (reqSeqRef.current === seq) {
          setThinking(false);
        }
      }
    }
  };

  const runJdMatch = (raw: string) => {
    const clean = raw.trim();
    if (!clean) return;
    tactileAudio.playChordPulse();
    setJdReport(analyzeJdFit(clean));
  };

  const handleCopy = (value: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    tactileAudio.playTick(1520);
    setCopiedText(value);
    window.setTimeout(() => setCopiedText(null), 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ask AI Digital Twin & JD Fit Matcher"
      data-testid="ask-tinh-modal"
      onClick={onClose}
      className="fixed inset-0 z-[115] bg-black/75 backdrop-blur-md flex items-start justify-center pt-[7vh] px-4 pb-6 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="liquid-glass w-full max-w-2xl rounded-3xl overflow-hidden text-[var(--fg-primary)]"
      >
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-[var(--hairline)] flex flex-wrap items-center justify-between gap-2 font-mono-tech">
          <div className="flex items-center gap-2.5">
            <span
              style={{
                backgroundColor:
                  probe.engine === 'chrome-nano' ? 'var(--signal-ok)' : 'var(--accent)',
              }}
              className="w-2 h-2 rounded-full"
            />
            <span className="text-xs font-bold tracking-wider uppercase">
              TVT // AI TWIN
            </span>
            <span
              data-testid="ai-engine-badge"
              className="px-2 py-0.5 rounded-full bg-[var(--bg-panel)] border border-[var(--hairline)] text-[10px] font-semibold text-[var(--fg-secondary)]"
            >
              {probe.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center p-0.5 rounded-full bg-[var(--bg-panel)] border border-[var(--hairline)] text-[10.5px]">
              <button
                type="button"
                data-testid="tab-ask-twin"
                onClick={() => {
                  tactileAudio.playTick(1360);
                  setTab('twin');
                }}
                style={{
                  backgroundColor: tab === 'twin' ? 'var(--fg-primary)' : 'transparent',
                  color: tab === 'twin' ? 'var(--bg-primary)' : 'var(--fg-secondary)',
                }}
                className="px-3 py-1 rounded-full font-semibold transition cursor-pointer"
              >
                {lang === 'vi' ? 'Hỏi Twin' : 'Ask Digital Twin'}
              </button>
              <button
                type="button"
                data-testid="tab-jd-matcher"
                onClick={() => {
                  tactileAudio.playTick(1460);
                  setTab('jd');
                }}
                style={{
                  backgroundColor: tab === 'jd' ? 'var(--fg-primary)' : 'transparent',
                  color: tab === 'jd' ? 'var(--bg-primary)' : 'var(--fg-secondary)',
                }}
                className="px-3 py-1 rounded-full font-semibold transition cursor-pointer"
              >
                JD Fit Matcher
              </button>
            </div>
            <button
              type="button"
              data-testid="ask-ai-close"
              onClick={onClose}
              className="px-2.5 py-1 rounded-full border border-[var(--hairline)] text-[10px] text-[var(--fg-muted)] hover:text-[var(--fg-primary)] transition cursor-pointer"
            >
              ESC
            </button>
          </div>
        </div>

        {/* TAB 1: ASK DIGITAL TWIN */}
        {tab === 'twin' && (
          <div className="p-5 space-y-4">
            {/* 4 Quick Keyword Chips */}
            <div className="flex flex-wrap gap-1.5">
              {PROMPT_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  data-testid={`twin-chip-${chip.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  onClick={() => void runTwinQuery(chip)}
                  className="px-3 py-1.5 rounded-full bg-[var(--bg-panel)] border border-[var(--hairline)] hover:border-[var(--accent)] font-mono-tech text-[11px] text-[var(--fg-primary)] transition cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Query Input */}
            <form
              onSubmit={(ev) => {
                ev.preventDefault();
                void runTwinQuery(query);
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                data-testid="twin-query-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  lang === 'vi'
                    ? 'Từ khóa: .NET 10, MCP, RAG, rate, flagship...'
                    : 'Keywords: .NET 10, MCP, RAG, rate, flagships...'
                }
                className="flex-1 px-4 py-2.5 rounded-full bg-[var(--bg-panel)] border border-[var(--hairline)] focus:border-[var(--accent)] focus:outline-none font-mono-tech text-xs text-[var(--fg-primary)] placeholder:text-[var(--fg-muted)]"
              />
              <button
                type="submit"
                data-testid="twin-query-submit"
                style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
                className="px-4 py-2.5 rounded-full font-mono-tech text-xs font-semibold hover:opacity-90 transition cursor-pointer shrink-0"
              >
                {thinking ? '...' : 'Query →'}
              </button>
            </form>

            {/* Structured Keyword / Metric Result Card (Zero Prose Walls) */}
            {answer && (
              <div
                data-testid="twin-answer-panel"
                className="p-4 rounded-2xl bg-[var(--bg-panel)] border border-[var(--hairline)] space-y-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="font-display text-lg font-bold text-[var(--fg-primary)]">
                    {answer.title}
                  </strong>
                  <span className="font-mono-tech text-[10px] text-[var(--signal-ok)] shrink-0">
                    {answer.engineLabel}
                  </span>
                </div>

                {answer.nanoSynthesis && (
                  <div className="px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--hairline)] font-mono-tech text-[11px] text-[var(--fg-secondary)]">
                    {answer.nanoSynthesis}
                  </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {answer.metrics.map((m) => (
                    <div
                      key={m}
                      className="px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--hairline)] font-mono-tech text-[11px] font-semibold text-[var(--fg-primary)]"
                    >
                      {m}
                    </div>
                  ))}
                </div>

                {/* Keyword Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {answer.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2.5 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--hairline)] font-mono-tech text-[10.5px] text-[var(--fg-secondary)]"
                    >
                      {kw}
                    </span>
                  ))}
                </div>

                {/* Generative UI Action Pills */}
                <div className="pt-2 border-t border-[var(--hairline)] flex flex-wrap gap-2 font-mono-tech text-[11px]">
                  {answer.actions.map((act) =>
                    act.href ? (
                      <a
                        key={act.label}
                        href={act.href}
                        target="_blank"
                        rel="noreferrer"
                        style={
                          act.accent
                            ? { backgroundColor: 'var(--accent)', color: '#ffffff' }
                            : undefined
                        }
                        className={`px-3.5 py-1.5 rounded-full font-semibold transition ${
                          act.accent
                            ? 'hover:opacity-90'
                            : 'bg-[var(--bg-elevated)] border border-[var(--hairline)] text-[var(--fg-primary)] hover:border-[var(--accent)]'
                        }`}
                      >
                        {act.label}
                      </a>
                    ) : (
                      <button
                        key={act.label}
                        type="button"
                        onClick={() => act.copyText && handleCopy(act.copyText)}
                        style={
                          act.accent
                            ? { backgroundColor: 'var(--accent)', color: '#ffffff' }
                            : undefined
                        }
                        className="px-3.5 py-1.5 rounded-full font-semibold hover:opacity-90 transition cursor-pointer"
                      >
                        {copiedText === act.copyText ? 'Copied ✓' : act.label}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INSTANT JD FIT MATCHER */}
        {tab === 'jd' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono-tech text-[11px]">
              <span className="text-[var(--fg-secondary)]">
                {lang === 'vi'
                  ? 'Dán JD để chấm điểm khớp & chọn CV tối ưu'
                  : 'Paste JD · Instant Deterministic Skill Score & CV Match'}
              </span>
              <button
                type="button"
                data-testid="btn-load-sample-jd"
                onClick={() => {
                  setJdText(SAMPLE_SENIOR_JD);
                  runJdMatch(SAMPLE_SENIOR_JD);
                }}
                className="px-3 py-1 rounded-full bg-[var(--bg-panel)] border border-[var(--hairline)] hover:border-[var(--accent)] text-[var(--fg-primary)] font-semibold transition cursor-pointer"
              >
                Load Sample Senior AI/Fullstack JD
              </button>
            </div>

            <textarea
              data-testid="jd-textarea"
              rows={4}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste role requirements (.NET, Python, FastAPI, React, MCP, RAG, Redis, Three.js...)"
              className="w-full p-3.5 rounded-2xl bg-[var(--bg-panel)] border border-[var(--hairline)] focus:border-[var(--accent)] focus:outline-none font-mono-tech text-xs text-[var(--fg-primary)] placeholder:text-[var(--fg-muted)] resize-none"
            />

            <div className="flex items-center justify-end">
              <button
                type="button"
                data-testid="btn-analyze-jd"
                onClick={() => runJdMatch(jdText)}
                style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
                className="px-5 py-2 rounded-full font-mono-tech text-xs font-semibold hover:opacity-90 transition cursor-pointer"
              >
                Score JD Fit →
              </button>
            </div>

            {jdReport && (
              <div
                data-testid="jd-fit-report"
                className="p-4 rounded-2xl bg-[var(--bg-panel)] border border-[var(--hairline)] space-y-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-baseline gap-3">
                    <strong
                      data-testid="jd-fit-score"
                      style={{ color: 'var(--signal-ok)' }}
                      className="font-display text-4xl font-extrabold tabular-nums"
                    >
                      {jdReport.fitScorePct}%
                    </strong>
                    <span className="font-mono-tech text-[11px] uppercase text-[var(--fg-secondary)]">
                      FIT · {jdReport.recommendedCv.titleEn}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 font-mono-tech text-[11px]">
                    <a
                      data-testid="jd-download-cv"
                      href={jdReport.recommendedCv.href}
                      target="_blank"
                      rel="noreferrer"
                      style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
                      className="px-3.5 py-1.5 rounded-full font-semibold hover:opacity-90 transition"
                    >
                      Download Matched CV ↗
                    </a>
                    <button
                      type="button"
                      data-testid="jd-copy-pitch"
                      onClick={() => handleCopy(jdReport.tailoredPitch)}
                      className="px-3.5 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--hairline)] hover:border-[var(--accent)] text-[var(--fg-primary)] font-semibold transition cursor-pointer"
                    >
                      {copiedText === jdReport.tailoredPitch ? 'Pitch Copied ✓' : 'Copy Tailored Pitch'}
                    </button>
                  </div>
                </div>

                {/* Matched Skills Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {jdReport.matchedSkills.map((sk) => (
                    <span
                      key={sk}
                      style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-soft)' }}
                      className="px-2.5 py-1 rounded-full font-mono-tech text-[10.5px] font-semibold"
                    >
                      {sk}
                    </span>
                  ))}
                </div>

                {/* Relevant Live Flagship Proof Links */}
                <div className="pt-2 border-t border-[var(--hairline)] flex flex-wrap items-center gap-2 font-mono-tech text-[10.5px]">
                  <span className="text-[var(--fg-muted)] uppercase">Proof:</span>
                  {jdReport.matchedFlagshipIds.map((fid) => {
                    const work = FLAGSHIP_WORKS.find((w) => w.id === fid);
                    if (!work) return null;
                    return (
                      <a
                        key={work.id}
                        href={work.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--hairline)] hover:border-[var(--accent)] text-[var(--fg-primary)] transition"
                      >
                        {work.title} ↗
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
