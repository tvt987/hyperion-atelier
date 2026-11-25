import { useMemo, useState } from 'react';
import { tactileAudio } from '../engines/tactileAudio';

interface ContractEstimatorAndDossierProps {
  lang: 'en' | 'vi';
  onOpenZalo: () => void;
}

type ScopeTrack = 'BACKEND_CONCURRENCY' | 'FULLSTACK_PRODUCT' | 'HYBRID_RAG_AI';
type ContractModel = 'MILESTONE' | 'DEDICATED_B2B';
type OverlapZone = 'APAC' | 'EU' | 'US';

export function ContractEstimatorAndDossier({
  lang,
  onOpenZalo,
}: ContractEstimatorAndDossierProps) {
  const [track, setTrack] = useState<ScopeTrack>('BACKEND_CONCURRENCY');
  const [model, setModel] = useState<ContractModel>('MILESTONE');
  const [zone, setZone] = useState<OverlapZone>('EU');
  const [copiedEmail, setCopiedEmail] = useState(false);

  const estimate = useMemo(() => {
    const trackMeta = {
      BACKEND_CONCURRENCY: {
        name: '.NET 8/10 High-Concurrency & SQL/Redis Optimization',
        milestoneRange: '$450 – $950 USD',
        hourlyRange: '$28 – $45 / hr USD',
        sla: '5 – 10 Business Days (First PR within 48h)',
        deliverables: 'Execution plan audit, Dapper/RowVersion refactor, Redis Lua guard, xUnit concurrency suite & Docker.',
      },
      FULLSTACK_PRODUCT: {
        name: 'End-to-End Product Sprint (.NET/Python + React/Angular/TS)',
        milestoneRange: '$650 – $1,450 USD',
        hourlyRange: '$25 – $42 / hr USD',
        sla: '1 – 2 Weeks per Verifiable Milestone',
        deliverables: 'Typed REST/OpenAPI backend, Keycloak RBAC, reactive TypeScript UI, Playwright & CI pipeline.',
      },
      HYBRID_RAG_AI: {
        name: 'Production Hybrid RAG, Vector Search & Agentic Automation',
        milestoneRange: '$600 – $1,500 USD',
        hourlyRange: '$30 – $45 / hr USD',
        sla: '7 – 12 Business Days (Grounded Eval Included)',
        deliverables: 'FastAPI + Qdrant/BM25 RRF retrieval, Pydantic guardrails, zero-hallucination abstention & Pytest eval.',
      },
    }[track];

    const overlapText =
      zone === 'APAC'
        ? 'Full Business Day Overlap (UTC+7 · Vietnam / Singapore / Australia)'
        : zone === 'EU'
        ? '4 – 6 Hours Daily Live Overlap (CET / UK Afternoon & Morning Sync)'
        : '4 – 5 Hours Daily Overlap (US EST Morning / PST Evening Sync)';

    const budget = model === 'MILESTONE' ? trackMeta.milestoneRange : trackMeta.hourlyRange;
    const subject = encodeURIComponent(`[B2B Contract Inquiry] ${trackMeta.name}`);
    const body = encodeURIComponent(
      `Hi Truong Van Tinh,\n\nWe reviewed your interactive engineering atelier (https://tvt987.github.io) and would like to discuss:\n- Track: ${trackMeta.name}\n- Engagement Model: ${
        model === 'MILESTONE' ? 'Fixed-Scope Milestone' : 'Dedicated Remote B2B Contractor (30-40h/wk)'
      } (${budget})\n- Timezone Sync: ${overlapText}\n\nBest regards,`
    );

    return {
      ...trackMeta,
      budget,
      overlapText,
      mailtoHref: `mailto:tinhkun102@gmail.com?subject=${subject}&body=${body}`,
    };
  }, [model, track, zone]);

  const handleCopyEmail = () => {
    tactileAudio.playLatch();
    navigator.clipboard?.writeText('tinhkun102@gmail.com').catch(() => {});
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2200);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 hairline-box bg-[var(--bg-elevated)]">
      {/* Left 7 Cols: Interactive B2B Scope & Milestone Configurator */}
      <div className="lg:col-span-7 p-6 sm:p-8 hairline-r flex flex-col justify-between gap-6">
        <div className="space-y-5">
          <div>
            <span className="font-mono-tech text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">
              INTERACTIVE B2B DISPATCH // ZERO TAX OR PAYROLL OVERHEAD
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-bold mt-1 text-[var(--fg-primary)]">
              {lang === 'vi'
                ? 'Định Cấu Hình Gói Khoán Milestone & Hợp Đồng Remote'
                : 'Configure Contract Scope & Milestone SLA'}
            </h3>
          </div>

          {/* 1. Engineering Track Selector */}
          <div className="space-y-2">
            <label className="font-mono-tech text-[10px] uppercase text-[var(--fg-muted)] block">
              01 // SELECT ENGINEERING TRACK
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  { id: 'BACKEND_CONCURRENCY', label: '.NET / SQL Concurrency' },
                  { id: 'FULLSTACK_PRODUCT', label: 'Full-Stack (.NET + TS)' },
                  { id: 'HYBRID_RAG_AI', label: 'Python Hybrid RAG / AI' },
                ] as const
              ).map((opt) => {
                const active = track === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    data-cursor="SELECT TRACK"
                    onClick={() => {
                      tactileAudio.playTick();
                      setTrack(opt.id);
                    }}
                    style={{
                      backgroundColor: active ? 'var(--accent)' : 'var(--bg-panel)',
                      color: active ? '#FFFFFF' : 'var(--fg-primary)',
                    }}
                    className="px-3 py-2.5 hairline-box font-mono-tech text-xs font-semibold text-left transition cursor-pointer"
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Contract Billing Model & Timezone Overlap */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-mono-tech text-[10px] uppercase text-[var(--fg-muted)] block">
                02 // ENGAGEMENT MODEL
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'MILESTONE', label: 'Fixed Milestone' },
                    { id: 'DEDICATED_B2B', label: 'Hourly B2B (35h/wk)' },
                  ] as const
                ).map((m) => {
                  const active = model === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        tactileAudio.playTick();
                        setModel(m.id);
                      }}
                      style={{
                        borderColor: active ? 'var(--accent)' : 'var(--hairline)',
                        color: active ? 'var(--accent)' : 'var(--fg-secondary)',
                      }}
                      className="px-3 py-2 border bg-[var(--bg-panel)] font-mono-tech text-[11px] font-semibold cursor-pointer"
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-mono-tech text-[10px] uppercase text-[var(--fg-muted)] block">
                03 // TIMEZONE SYNC WINDOW
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'APAC', label: 'APAC / VN' },
                    { id: 'EU', label: 'EU / UK' },
                    { id: 'US', label: 'US EST/PST' },
                  ] as const
                ).map((z) => {
                  const active = zone === z.id;
                  return (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => {
                        tactileAudio.playTick();
                        setZone(z.id);
                      }}
                      style={{
                        borderColor: active ? 'var(--accent)' : 'var(--hairline)',
                        color: active ? 'var(--accent)' : 'var(--fg-secondary)',
                      }}
                      className="px-2 py-2 border bg-[var(--bg-panel)] font-mono-tech text-[11px] font-semibold cursor-pointer"
                    >
                      {z.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Computed Specification Readout */}
          <div className="p-4 hairline-box bg-[var(--bg-panel)] space-y-2.5 font-mono-tech text-xs">
            <div className="flex flex-wrap justify-between gap-2 hairline-b pb-2">
              <span className="text-[var(--fg-muted)]">TARGET INVESTMENT BAND</span>
              <strong style={{ color: 'var(--accent)' }} className="text-sm">
                {estimate.budget}
              </strong>
            </div>
            <div className="flex flex-wrap justify-between gap-2 hairline-b pb-2">
              <span className="text-[var(--fg-muted)]">DELIVERY CADENCE</span>
              <strong className="text-[var(--fg-primary)]">{estimate.sla}</strong>
            </div>
            <div className="flex flex-wrap justify-between gap-2 hairline-b pb-2">
              <span className="text-[var(--fg-muted)]">DAILY OVERLAP</span>
              <span className="text-[var(--fg-secondary)]">{estimate.overlapText}</span>
            </div>
            <p className="text-[11px] text-[var(--fg-secondary)] pt-0.5 leading-relaxed">
              DELIVERABLES: {estimate.deliverables}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2 font-mono-tech text-xs font-bold">
          <a
            href={estimate.mailtoHref}
            data-cursor="DISPATCH BRIEF ↗"
            style={{ backgroundColor: 'var(--accent)', color: '#FFFFFF' }}
            className="px-5 py-3 uppercase tracking-wider hover:opacity-90 transition"
          >
            {lang === 'vi' ? 'Gửi Brief Hợp Đồng Qua Email ↗' : 'Dispatch Scope Brief via Email ↗'}
          </a>
          <button
            type="button"
            onClick={handleCopyEmail}
            data-cursor="COPY EMAIL"
            className="px-4 py-3 hairline-box bg-[var(--bg-panel)] text-[var(--fg-primary)] uppercase tracking-wider hover:bg-[var(--bg-primary)] transition cursor-pointer"
          >
            {copiedEmail ? 'COPIED: TINHKUN102@GMAIL.COM' : 'COPY TINHKUN102@GMAIL.COM'}
          </button>
        </div>
      </div>

      {/* Right 5 Cols: 3 Specialized CVs + Scannable Zalo QR Direct Channel */}
      <div className="lg:col-span-5 p-6 sm:p-8 bg-[var(--bg-panel)] flex flex-col justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between hairline-b pb-2.5">
            <span className="font-mono-tech text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">
              VERIFIED CANDIDATE DOSSIER (PDF)
            </span>
            <span style={{ color: 'var(--signal-ok)' }} className="font-mono-tech text-[10px] font-bold">
              ● IMMEDIATE START
            </span>
          </div>

          <div className="space-y-2.5 font-mono-tech text-xs">
            <a
              href="./CV_Backend_TruongVanTinh.pdf"
              download
              data-cursor="DOWNLOAD PDF"
              className="p-3.5 hairline-box bg-[var(--bg-elevated)] hover:border-[var(--accent)] flex items-center justify-between transition group"
            >
              <div>
                <strong className="text-[var(--fg-primary)] block group-hover:text-[var(--accent)] transition">
                  01 // CV_Backend_TruongVanTinh.pdf
                </strong>
                <span className="text-[10px] text-[var(--fg-muted)]">
                  C# · .NET 8/10 · Dapper · SQL Server · Redis Lua · High-Concurrency
                </span>
              </div>
              <span className="text-[var(--accent)] font-bold">PDF ↓</span>
            </a>

            <a
              href="./CV_FullStack_TruongVanTinh.pdf"
              download
              data-cursor="DOWNLOAD PDF"
              className="p-3.5 hairline-box bg-[var(--bg-elevated)] hover:border-[var(--accent)] flex items-center justify-between transition group"
            >
              <div>
                <strong className="text-[var(--fg-primary)] block group-hover:text-[var(--accent)] transition">
                  02 // CV_FullStack_TruongVanTinh.pdf
                </strong>
                <span className="text-[10px] text-[var(--fg-muted)]">
                  .NET + Angular / React 19 / TypeScript · Keycloak OIDC · Retail ERP
                </span>
              </div>
              <span className="text-[var(--accent)] font-bold">PDF ↓</span>
            </a>

            <a
              href="./CV_AI_TruongVanTinh.pdf"
              download
              data-cursor="DOWNLOAD PDF"
              className="p-3.5 hairline-box bg-[var(--bg-elevated)] hover:border-[var(--accent)] flex items-center justify-between transition group"
            >
              <div>
                <strong className="text-[var(--fg-primary)] block group-hover:text-[var(--accent)] transition">
                  03 // CV_AI_TruongVanTinh.pdf
                </strong>
                <span className="text-[10px] text-[var(--fg-muted)]">
                  Python 3.12 · FastAPI · Hybrid BM25+Vector RAG · Qdrant · Agentic AI
                </span>
              </div>
              <span className="text-[var(--accent)] font-bold">PDF ↓</span>
            </a>
          </div>
        </div>

        {/* Direct Hotline & Zalo QR Hardware Plate */}
        <div className="p-4 hairline-box bg-[var(--bg-elevated)] flex items-center gap-4">
          <button
            type="button"
            onClick={onOpenZalo}
            data-cursor="EXPAND QR"
            className="shrink-0 p-1.5 bg-white hairline-box cursor-pointer hover:opacity-90 transition"
          >
            <img
              src="./zalo_qr.jpg"
              alt="Zalo QR Truong Van Tinh 0931 467 024"
              className="w-20 h-20 object-cover block"
            />
          </button>
          <div className="font-mono-tech text-xs space-y-1 min-w-0">
            <span className="text-[10px] uppercase text-[var(--fg-muted)] block">
              DIRECT HOTLINE // ZALO INSTANT MESSAGING
            </span>
            <strong className="text-base text-[var(--fg-primary)] block">(+84) 0931 467 024</strong>
            <div className="flex flex-wrap gap-3 pt-1 text-[11px] font-semibold">
              <button
                type="button"
                onClick={onOpenZalo}
                style={{ color: 'var(--accent)' }}
                className="underline underline-offset-4 cursor-pointer uppercase"
              >
                {lang === 'vi' ? 'Phóng To QR' : 'Expand QR'}
              </button>
              <a
                href="https://zalo.me/0931467024"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] uppercase"
              >
                zalo.me/0931467024 ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
