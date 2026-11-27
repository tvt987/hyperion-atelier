import {
  PORTFOLIO_AUDIT_SUMMARY,
  VERIFIED_API_BENCHMARKS,
} from '../data/atelierContent';
import { tactileAudio } from '../engines/tactileAudio';

interface HeroApiProofPanelProps {
  lang: 'en' | 'vi';
  selectedBenchIdx: number;
  onSelectBenchIdx: (idx: number) => void;
  onInspect: (workId: string) => void;
}

function computeLatencyBarPct(p50Ms: number): number {
  const normalized = Math.log10(p50Ms + 1) / Math.log10(36);
  return Math.min(100, Math.max(16, Math.round(normalized * 100)));
}

export function HeroApiProofPanel({
  lang,
  selectedBenchIdx,
  onSelectBenchIdx,
  onInspect,
}: HeroApiProofPanelProps) {
  const selectedBench =
    VERIFIED_API_BENCHMARKS[selectedBenchIdx] ?? VERIFIED_API_BENCHMARKS[0];

  return (
    <>
      {/* Main Telemetry Stage: Matches Locked 16:10 Desktop Footprint (Zero Layout Shift) */}
      <div
        data-testid="hero-api-proof-panel"
        className="relative w-full min-h-[282px] lg:min-h-0 lg:aspect-[16/10] bg-[var(--bg-primary)] border-b border-[var(--hairline)] px-3.5 py-2.5 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[var(--hairline)] font-mono-tech text-[9.5px] uppercase tracking-wider text-[var(--fg-muted)]">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span
              style={{ backgroundColor: 'var(--signal-ok)' }}
              className="w-1.5 h-1.5 rounded-full shrink-0"
            />
            <span className="sm:hidden">HTTP 200 · .NET 10 / FastAPI</span>
            <span className="hidden sm:inline">HTTP 200 · Release .NET 10 &amp; FastAPI</span>
          </span>
          <span className="whitespace-nowrap shrink-0">P50 ms</span>
        </div>

        <div
          role="listbox"
          aria-label="Verified local production API benchmarks"
          className="flex-1 flex flex-col justify-between py-1 gap-0.5"
        >
          {VERIFIED_API_BENCHMARKS.map((bench, idx) => {
            const isSelected = idx === selectedBenchIdx;
            const barPct = computeLatencyBarPct(bench.p50Ms);
            const isSub2Ms = bench.p50Ms < 2.0;

            return (
              <button
                key={bench.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-testid="api-benchmark-row"
                onClick={() => {
                  tactileAudio.playTick(1460);
                  onSelectBenchIdx(idx);
                }}
                style={{
                  backgroundColor: isSelected
                    ? 'var(--bg-elevated)'
                    : 'transparent',
                  borderColor: isSelected
                    ? 'var(--hairline-strong)'
                    : 'transparent',
                }}
                className="w-full px-2 py-[3px] rounded-lg border flex items-center gap-2 text-left transition hover:bg-[var(--bg-panel)] cursor-pointer"
              >
                <span
                  style={{
                    color:
                      bench.runtime === '.NET 10'
                        ? 'var(--fg-primary)'
                        : 'var(--accent)',
                    backgroundColor:
                      bench.runtime === '.NET 10'
                        ? 'var(--bg-panel)'
                        : 'var(--accent-soft)',
                  }}
                  className="w-[50px] shrink-0 text-center py-[1px] rounded font-mono-tech text-[9px] font-bold border border-[var(--hairline)]"
                >
                  {bench.runtime}
                </span>

                <span className="w-[136px] sm:w-[162px] shrink-0 font-mono-tech text-[10px] font-semibold text-[var(--fg-primary)] truncate">
                  {bench.service}
                </span>

                <div className="flex-1 h-[6px] rounded-full bg-[var(--bg-panel)] border border-[var(--hairline)] overflow-hidden">
                  <div
                    style={{
                      width: `${barPct}%`,
                      backgroundColor: isSub2Ms
                        ? 'var(--signal-ok)'
                        : 'var(--accent)',
                    }}
                    className="h-full rounded-full transition-[width] duration-300 ease-out"
                  />
                </div>

                <span
                  style={{
                    color: isSub2Ms ? 'var(--signal-ok)' : 'var(--accent)',
                  }}
                  className="w-[46px] shrink-0 text-right font-mono-tech text-[10px] font-bold tabular-nums"
                >
                  {bench.p50Ms.toFixed(2)}ms
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lower Proof Summary & 1-Click Actions (Exact Height Parity with Live UI Panel) */}
      <div className="p-3.5 sm:p-4 flex flex-col justify-between gap-2.5 lg:h-[186px]">
        <div className="space-y-2">
          <div className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-panel)] border border-[var(--hairline)] flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 font-mono-tech text-[9.5px] sm:text-[10px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                style={{ color: 'var(--signal-ok)' }}
                className="font-bold shrink-0"
              >
                HTTP {selectedBench.httpStatus}
              </span>
              <span className="text-[var(--fg-muted)]">·</span>
              <span className="text-[var(--fg-primary)] font-semibold truncate">
                {selectedBench.endpoint}
              </span>
            </div>
            <span className="text-[var(--fg-secondary)] tabular-nums shrink-0">
              P50 {selectedBench.p50Ms.toFixed(2)} · P95{' '}
              {selectedBench.p95Ms.toFixed(2)} · P99{' '}
              {selectedBench.p99Ms.toFixed(2)}ms
            </span>
          </div>

          <div
            data-testid="api-audit-badges"
            className="flex flex-wrap gap-1.5 font-mono-tech text-[9.5px] sm:text-[10px]"
          >
            <span className="px-2 py-0.5 rounded-full bg-[var(--bg-panel)] border border-[var(--hairline)] font-semibold text-[var(--fg-primary)]">
              {PORTFOLIO_AUDIT_SUMMARY.openApiValid}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[var(--bg-panel)] border border-[var(--hairline)] font-semibold text-[var(--fg-primary)]">
              {PORTFOLIO_AUDIT_SUMMARY.dockerComposeValid}
            </span>
            <span
              style={{ color: 'var(--signal-ok)' }}
              className="px-2 py-0.5 rounded-full bg-[var(--bg-panel)] border border-[var(--hairline)] font-semibold"
            >
              {PORTFOLIO_AUDIT_SUMMARY.sastFindings}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-[var(--hairline)] flex flex-wrap items-center justify-between gap-2 font-mono-tech text-[10.5px]">
          <div className="flex items-center gap-2">
            <a
              data-testid="api-open-live"
              href={selectedBench.liveUrl}
              target="_blank"
              rel="noreferrer"
              style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
              className="px-3 py-1 rounded-full font-semibold hover:opacity-90 transition"
            >
              {lang === 'vi' ? 'Mở Live App ↗' : 'Open Live App ↗'}
            </a>
            <a
              data-testid="api-inspect-source"
              href={selectedBench.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 rounded-full bg-[var(--bg-panel)] border border-[var(--hairline-strong)] text-[var(--fg-primary)] hover:border-[var(--accent)] font-semibold transition"
            >
              {lang === 'vi' ? 'Xem Mã Nguồn ↗' : 'Inspect Source ↗'}
            </a>
          </div>
          <button
            type="button"
            onClick={() => onInspect(selectedBench.workId)}
            className="text-[var(--fg-muted)] hover:text-[var(--fg-primary)] font-semibold transition cursor-pointer"
          >
            {lang === 'vi' ? 'Phóng To' : 'Lightbox'}
          </button>
        </div>
      </div>
    </>
  );
}
