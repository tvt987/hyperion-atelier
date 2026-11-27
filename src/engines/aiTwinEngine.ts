/**
 * HYPERION ATELIER v5.0 — Chrome Built-in On-Device AI (LanguageModel / Gemini Nano)
 * + Deterministic Hybrid BM25 / Semantic Vector Digital Twin & Instant JD Fit Matcher.
 */

import { CV_DOSSIERS, FLAGSHIP_WORKS, type CvItem } from '../data/atelierContent';

export interface BuiltInAiProbe {
  engine: 'chrome-nano' | 'local-hybrid-rag';
  status: 'available' | 'downloadable' | 'downloading' | 'unavailable';
  label: string;
}

interface ChromeLanguageModelSession {
  prompt: (text: string) => Promise<string>;
  destroy?: () => void;
}

interface ChromeLanguageModelApi {
  availability?: () => Promise<string>;
  create?: (opts?: {
    systemPrompt?: string;
    expectedOutputs?: Array<{ type: string; languages?: string[] }>;
  }) => Promise<ChromeLanguageModelSession>;
}

export async function probeChromeBuiltInAI(): Promise<BuiltInAiProbe> {
  try {
    const scope = globalThis as unknown as { LanguageModel?: ChromeLanguageModelApi };
    if (typeof scope !== 'undefined' && 'LanguageModel' in scope && scope.LanguageModel?.availability) {
      const state = await scope.LanguageModel.availability();
      if (state === 'available' || state === 'readily') {
        return {
          engine: 'chrome-nano',
          status: 'available',
          label: 'CHROME GEMINI NANO',
        };
      }
      if (state === 'downloadable' || state === 'after-download') {
        return {
          engine: 'local-hybrid-rag',
          status: 'downloadable',
          label: 'LOCAL HYBRID RAG · 0ms',
        };
      }
      if (state === 'downloading') {
        return {
          engine: 'local-hybrid-rag',
          status: 'downloading',
          label: 'LOCAL HYBRID RAG · 0ms',
        };
      }
    }
  } catch {
    // Graceful fallback
  }

  return {
    engine: 'local-hybrid-rag',
    status: 'unavailable',
    label: 'LOCAL HYBRID RAG · 0ms',
  };
}

export interface TwinActionPill {
  label: string;
  href?: string;
  copyText?: string;
  accent?: boolean;
}

export interface TwinAnswer {
  id: string;
  title: string;
  engineLabel: string;
  metrics: string[];
  keywords: string[];
  actions: TwinActionPill[];
  nanoSynthesis?: string;
}

interface KnowledgeEntry {
  id: string;
  title: string;
  terms: string[];
  metrics: string[];
  keywords: string[];
  actions: TwinActionPill[];
}

const TWIN_KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    id: 'concurrency-dotnet',
    title: 'High-Concurrency .NET 8/10 & Retail Core',
    terms: [
      '139k', 'rps', 'dotnet', '.net', 'c#', 'concurrency', 'redis', 'dapper', 'sql',
      'voucher', 'double', 'spend', 'cas', 'con cung', '700', 'stores', 'backend', 'aegispulse', 'latency',
    ],
    metrics: ['139,099 RPS (.NET 10 CAS)', '700+ Retail Stores', '0.00% Double-Spend', 'p99 < 45ms'],
    keywords: ['.NET 8/10', 'Dapper', 'Redis Lua', 'Channel<T> WAL', 'SQL Server', 'Polly v8', 'OpenTelemetry'],
    actions: [
      { label: 'Launch AegisPulse ↗', href: 'https://tvt987.github.io/aegispulse-distributed-sre/', accent: true },
      { label: 'Backend CV PDF ↗', href: './CV_Backend_TruongVanTinh.pdf' },
    ],
  },
  {
    id: 'ai-protocols',
    title: 'Applied AI, MCP 2.0, A2A & Hybrid RAG',
    terms: [
      'ai', 'mcp', 'a2a', 'ag-ui', 'rag', 'bm25', 'rrf', 'vector', 'hnsw', 'langgraph',
      'agent', 'multi-agent', 'python', 'fastapi', 'qdrant', 'llm', 'verdict', 'gemini', 'nano',
    ],
    metrics: ['0.99 Grounded Score', '-52% Token Cost', 'OWASP LLM Top-10 10/10', '70/70 CI Green'],
    keywords: ['Python 3.12', 'FastAPI', 'MCP Server 2.0', 'A2A Protocol', 'AG-UI SSE', 'LangGraph Fork', 'OTel GenAI'],
    actions: [
      { label: 'Launch Verdict Graph ↗', href: 'https://tvt987.github.io/verdict-graph/', accent: true },
      { label: 'Applied AI CV PDF ↗', href: './CV_AI_TruongVanTinh.pdf' },
    ],
  },
  {
    id: 'rate-availability',
    title: 'Remote B2B Engagement & Timezone Overlap',
    terms: [
      'rate', 'salary', 'price', 'cost', 'hourly', 'contract', 'freelance', 'remote',
      'b2b', 'deel', 'wire', 'timezone', 'overlap', 'us', 'eu', 'apac', 'hire', 'availability', 'email', 'contact',
    ],
    metrics: ['$25–$45/hr USD (B2B)', '4–6h US/EU/APAC Overlap', 'UTC+7 · Immediate Start', 'Deel / Wire / B2B'],
    keywords: ['Remote Contract', 'Milestone Payout', 'Zero Payroll Overhead', 'Ho Chi Minh City'],
    actions: [
      { label: 'Copy Email: tinhkun102@gmail.com', copyText: 'tinhkun102@gmail.com', accent: true },
      { label: 'Full-Stack CV PDF ↗', href: './CV_FullStack_TruongVanTinh.pdf' },
    ],
  },
  {
    id: 'live-flagships',
    title: 'Twenty-Two Live Production Web Apps & 10 Pro Tools (1,003 CI Green)',
    terms: [
      'flagship', 'project', 'portfolio', 'live', 'demo', 'maison', 'vera', 'atelier',
      'canvas', 'aether', 'nexus', 'lake', 'three', 'webgl', 'webgpu', 'duckdb', 'wasm', 'crdt', 'yjs', 'figma', '3d',
      'studio', 'store', 'pos', 'medspa', 'proptech', 'lumina', 'kinetix', 'pulsepos', 'order', 'buy',
      'tools', 'vietqr', 'payroll', 'resort', 'ev', 'velox', 'aurelia', 'solaris', 'kuro', 'vanguard', 'meridian', 'coda', 'veritas', 'nordic', 'zenith',
    ],
    metrics: ['22 Live Web Apps', '10 Free Pro Tools', '1,003 CI Tests Passing', 'Admin CMS & MBBank Auto-Pay'],
    keywords: ['TVT Studio v5.0', 'Velox EV v3.0 HDRI', 'AegisPulse v3.0', 'Verdict Graph v3.0', 'Nexus Lake v3.0', 'Atelier Canvas v4.0'],
    actions: [
      { label: 'TVT Studio Store ↗', href: 'https://tvt987.github.io/tvt-studio/', accent: true },
      { label: '10 Pro Tools Suite ↗', href: 'https://tvt987.github.io/tvt-tools/' },
      { label: 'Velox EV 3D ↗', href: 'https://tvt987.github.io/velox-ev-motors/' },
    ],
  },
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9.#+<>\-/\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

/**
 * Deterministic BM25-inspired retrieval over Truong Van Tinh's structured dossier.
 */
export function queryDigitalTwinLocal(question: string): TwinAnswer {
  const tokens = tokenize(question);
  let bestEntry = TWIN_KNOWLEDGE_BASE[3];
  let bestScore = -1;

  for (const entry of TWIN_KNOWLEDGE_BASE) {
    let score = 0;
    for (const qTok of tokens) {
      for (const term of entry.terms) {
        if (term === qTok) {
          score += 3.2;
        } else if (term.includes(qTok) || qTok.includes(term)) {
          score += 1.4;
        }
      }
      if (entry.title.toLowerCase().includes(qTok)) {
        score += 1.2;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  // Fallback to default flagship overview if query has no token hits
  if (bestScore <= 0) {
    bestEntry = TWIN_KNOWLEDGE_BASE[0];
  }

  return {
    id: bestEntry.id,
    title: bestEntry.title,
    engineLabel: 'LOCAL HYBRID RAG · 0ms',
    metrics: bestEntry.metrics,
    keywords: bestEntry.keywords,
    actions: bestEntry.actions,
  };
}

/**
 * Queries Chrome Built-in Gemini Nano when available on-device, always augmenting with
 * grounded metrics and Generative UI action pills from the local Hybrid RAG index.
 */
export async function queryDigitalTwin(question: string): Promise<TwinAnswer> {
  const local = queryDigitalTwinLocal(question);
  const probe = await probeChromeBuiltInAI();

  if (probe.engine === 'chrome-nano') {
    try {
      const scope = globalThis as unknown as { LanguageModel?: ChromeLanguageModelApi };
      const session = await scope.LanguageModel?.create?.({
        systemPrompt:
          'You are the concise keyword-only technical index for Truong Van Tinh (Senior Full-Stack .NET 10, Python/MCP/A2A AI, React 19/WebGPU). Reply in at most 18 words using crisp metrics only. Never use emojis.',
      });
      if (session) {
        const nanoRaw = await session.prompt(
          `Question: ${question}\nFacts: ${local.metrics.join(' | ')} | ${local.keywords.join(', ')}`
        );
        session.destroy?.();
        const cleaned = nanoRaw.trim().slice(0, 140);
        if (cleaned) {
          return {
            ...local,
            engineLabel: 'CHROME GEMINI NANO',
            nanoSynthesis: cleaned,
          };
        }
      }
    } catch {
      // Fallback seamlessly to local hybrid RAG
    }
  }

  return local;
}

export interface JdSkillSpec {
  label: string;
  patterns: string[];
  track: 'backend' | 'fullstack' | 'ai';
  weight: number;
}

const JD_SKILL_TAXONOMY: JdSkillSpec[] = [
  { label: '.NET 8/10 & C#', patterns: ['.net', 'dotnet', 'c#', 'aspnet', 'asp.net'], track: 'backend', weight: 12 },
  { label: 'Dapper / SQL Server', patterns: ['dapper', 'sql server', 'mssql', 'postgresql', 'postgres', 'sql'], track: 'backend', weight: 9 },
  { label: 'Redis & High-Concurrency', patterns: ['redis', 'concurrency', 'high-throughput', 'distributed', 'caching', 'lock', 'rps'], track: 'backend', weight: 10 },
  { label: 'Microservices & Messaging', patterns: ['microservice', 'rabbitmq', 'kafka', 'grpc', 'event-driven', 'queue'], track: 'backend', weight: 8 },
  { label: 'OpenTelemetry & SRE', patterns: ['opentelemetry', 'otel', 'prometheus', 'grafana', 'observability', 'sre', 'docker', 'kubernetes', 'k8s'], track: 'backend', weight: 8 },
  { label: 'Keycloak / OAuth2 OIDC', patterns: ['keycloak', 'oauth', 'oidc', 'jwt', 'sso', 'auth'], track: 'backend', weight: 6 },
  { label: 'Python & FastAPI', patterns: ['python', 'fastapi', 'pydantic', 'uvicorn', 'asyncio'], track: 'ai', weight: 11 },
  { label: 'RAG & Vector Search', patterns: ['rag', 'bm25', 'vector', 'embedding', 'qdrant', 'pinecone', 'hnsw', 'rerank', 'retrieval'], track: 'ai', weight: 12 },
  { label: 'MCP / A2A / LangGraph Agents', patterns: ['mcp', 'a2a', 'langgraph', 'langchain', 'agent', 'agentic', 'llm', 'openai', 'gemini', 'claude', 'orchestration'], track: 'ai', weight: 13 },
  { label: 'React 19 & TypeScript', patterns: ['react', 'typescript', 'next.js', 'nextjs', 'vite', 'frontend', 'tailwind'], track: 'fullstack', weight: 11 },
  { label: 'Angular & Enterprise UI', patterns: ['angular', 'rxjs', 'spa', 'rest', 'api'], track: 'fullstack', weight: 8 },
  { label: 'Three.js / WebGL / WebGPU', patterns: ['three.js', 'threejs', 'webgl', 'webgpu', 'shader', 'glsl', 'wgsl', '3d', 'canvas'], track: 'fullstack', weight: 10 },
  { label: 'Local-First WASM / CRDT', patterns: ['wasm', 'webassembly', 'duckdb', 'yjs', 'crdt', 'local-first', 'web worker'], track: 'fullstack', weight: 9 },
];

export interface JdFitReport {
  fitScorePct: number;
  recommendedTrack: 'backend' | 'fullstack' | 'ai';
  recommendedCv: CvItem;
  matchedSkills: string[];
  matchedFlagshipIds: string[];
  tailoredPitch: string;
}

export const SAMPLE_SENIOR_JD =
  'Senior Full-Stack & Applied AI Engineer (Remote B2B): Build high-concurrency distributed APIs (.NET 8/10 or Python FastAPI), multi-agent LLM orchestration (MCP, LangGraph, Hybrid RAG with BM25 + Vector search), React 19 / TypeScript interactive dashboards, Redis caching, and OpenTelemetry observability.';

export function analyzeJdFit(jdText: string): JdFitReport {
  const lower = jdText.toLowerCase();
  const trackScores: Record<'backend' | 'fullstack' | 'ai', number> = {
    backend: 0,
    fullstack: 0,
    ai: 0,
  };
  const matchedSkills: string[] = [];
  let rawWeight = 0;

  for (const spec of JD_SKILL_TAXONOMY) {
    const hit = spec.patterns.some((pat) => lower.includes(pat));
    if (hit) {
      matchedSkills.push(spec.label);
      trackScores[spec.track] += spec.weight;
      rawWeight += spec.weight;
    }
  }

  let recommendedTrack: 'backend' | 'fullstack' | 'ai' = 'fullstack';
  if (trackScores.ai >= trackScores.backend && trackScores.ai >= trackScores.fullstack && trackScores.ai > 0) {
    recommendedTrack = 'ai';
  } else if (trackScores.backend >= trackScores.fullstack && trackScores.backend > 0) {
    recommendedTrack = 'backend';
  }

  // Calibrated realistic score: base 64% + scaled skill coverage capped at 98%
  const fitScorePct =
    matchedSkills.length === 0
      ? 62
      : Math.min(98, Math.round(64 + Math.min(34, rawWeight * 0.62)));

  const recommendedCv =
    CV_DOSSIERS.find((cv) => cv.id === recommendedTrack) ?? CV_DOSSIERS[1];

  const matchedFlagshipIds: string[] = [];
  if (trackScores.ai > 0) matchedFlagshipIds.push('verdict-graph');
  if (trackScores.backend > 0) matchedFlagshipIds.push('aegispulse');
  if (trackScores.fullstack > 0) matchedFlagshipIds.push('atelier-canvas', 'nexus-lake');
  if (matchedFlagshipIds.length === 0) {
    matchedFlagshipIds.push(FLAGSHIP_WORKS[0].id, FLAGSHIP_WORKS[4].id);
  }

  const topSkillsText =
    matchedSkills.slice(0, 5).join(', ') || '.NET 10, Python/FastAPI, React 19, MCP/RAG';
  const tailoredPitch = `Truong Van Tinh — ${fitScorePct}% Stack Match (${topSkillsText}). Production proof: 700+ retail stores (.NET 8/Dapper/Redis), 139,099 RPS CAS engine, 22 live production apps + 10 Pro Tools (1,003 CI green). Remote B2B ($25–$45/hr, 4–6h US/EU/APAC overlap) · tinhkun102@gmail.com`;

  return {
    fitScorePct,
    recommendedTrack,
    recommendedCv,
    matchedSkills: matchedSkills.length > 0 ? matchedSkills : ['Full-Stack Architecture', 'Distributed Systems', 'Applied AI'],
    matchedFlagshipIds: matchedFlagshipIds.slice(0, 3),
    tailoredPitch,
  };
}
