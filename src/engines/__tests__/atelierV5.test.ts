import { describe, expect, it } from 'vitest';
import {
  ACCENT_SWATCHES,
  DEFAULT_ACCENT_OBSIDIAN,
  hexToRgb01,
  hexToRgbaString,
  normalizeHex,
} from '../accentEngine';
import {
  analyzeJdFit,
  probeChromeBuiltInAI,
  queryDigitalTwinLocal,
  SAMPLE_SENIOR_JD,
} from '../aiTwinEngine';
import { parseVoiceCommand } from '../voicePilot';
import { FLAGSHIP_WORKS } from '../../data/atelierContent';

describe('HYPERION ATELIER v5.0 — AI Twin RAG, JD Fit Matcher, Accent Engine & Voice Pilot', () => {
  it('retrieves grounded metrics and Generative UI actions for Digital Twin queries', () => {
    const dotnetAns = queryDigitalTwinLocal('Tell me about 139K RPS .NET 10 concurrency');
    expect(dotnetAns.id).toBe('concurrency-dotnet');
    expect(dotnetAns.metrics.some((m) => m.includes('139,099'))).toBe(true);
    expect(dotnetAns.actions.some((a) => a.href?.includes('CV_Backend'))).toBe(true);

    const aiAns = queryDigitalTwinLocal('MCP / A2A Stack');
    expect(aiAns.id).toBe('ai-protocols');
    expect(aiAns.keywords).toContain('MCP Server 2.0');
    expect(aiAns.actions.some((a) => a.href?.includes('CV_AI'))).toBe(true);

    const rateAns = queryDigitalTwinLocal('What is your hourly remote B2B rate and timezone overlap?');
    expect(rateAns.id).toBe('rate-availability');
    expect(rateAns.metrics.some((m) => m.includes('$25'))).toBe(true);
    expect(rateAns.actions.some((a) => a.copyText === 'tinhkun102@gmail.com')).toBe(true);
  });

  it('probes Chrome Built-in LanguageModel API safely in non-browser runtimes', async () => {
    const probe = await probeChromeBuiltInAI();
    expect(['chrome-nano', 'local-hybrid-rag']).toContain(probe.engine);
    expect(probe.label.length).toBeGreaterThan(4);
  });

  it('scores JDs deterministically and recommends the optimal specialized CV PDF', () => {
    const sampleReport = analyzeJdFit(SAMPLE_SENIOR_JD);
    expect(sampleReport.fitScorePct).toBeGreaterThanOrEqual(85);
    expect(sampleReport.fitScorePct).toBeLessThanOrEqual(98);
    expect(sampleReport.matchedSkills.length).toBeGreaterThanOrEqual(5);
    expect(sampleReport.tailoredPitch).toContain('tinhkun102@gmail.com');

    const backendOnly = analyzeJdFit(
      'Senior Backend Engineer: .NET 8, C#, Dapper, SQL Server, Redis caching, RabbitMQ microservices, OpenTelemetry.'
    );
    expect(backendOnly.recommendedTrack).toBe('backend');
    expect(backendOnly.recommendedCv.href).toBe('./CV_Backend_TruongVanTinh.pdf');

    const aiOnly = analyzeJdFit(
      'Applied AI Engineer: Python, FastAPI, LangGraph multi-agent orchestration, MCP server, BM25 + Qdrant vector RAG.'
    );
    expect(aiOnly.recommendedTrack).toBe('ai');
    expect(aiOnly.recommendedCv.href).toBe('./CV_AI_TruongVanTinh.pdf');

    const fullstackOnly = analyzeJdFit(
      'Creative Frontend Full-Stack Engineer: React 19, TypeScript, Angular, Three.js WebGL/WebGPU shaders, DuckDB-WASM, Yjs CRDT.'
    );
    expect(fullstackOnly.recommendedTrack).toBe('fullstack');
    expect(fullstackOnly.recommendedCv.href).toBe('./CV_FullStack_TruongVanTinh.pdf');
  });

  it('normalizes hex accents and converts accurately to normalized WebGL2 RGB vectors', () => {
    expect(normalizeHex('#0f8')).toBe('#00FF88');
    expect(normalizeHex('38bdf8')).toBe('#38BDF8');
    expect(normalizeHex('not-a-color')).toBe(DEFAULT_ACCENT_OBSIDIAN);

    const [r, g, b] = hexToRgb01('#FF4D00');
    expect(r).toBeCloseTo(1.0, 3);
    expect(g).toBeCloseTo(77 / 255, 3);
    expect(b).toBeCloseTo(0.0, 3);

    expect(hexToRgbaString('#38BDF8', 0.14)).toBe('rgba(56, 189, 248, 0.14)');
    expect(ACCENT_SWATCHES.length).toBeGreaterThanOrEqual(6);
  });

  it('parses bilingual EN & VI voice pilot commands accurately', () => {
    expect(parseVoiceCommand('switch to light mode')).toEqual({ type: 'THEME', value: 'paper' });
    expect(parseVoiceCommand('bật giao diện tối')).toEqual({ type: 'THEME', value: 'obsidian' });
    expect(parseVoiceCommand('open maison vera')).toEqual({ type: 'OPEN_WORK', workId: 'maison-vera' });
    expect(parseVoiceCommand('open atelier canvas')).toEqual({ type: 'OPEN_WORK', workId: 'atelier-canvas' });
    expect(parseVoiceCommand('open nexus lake')).toEqual({ type: 'OPEN_WORK', workId: 'nexus-lake' });
    expect(parseVoiceCommand('ask ai twin')).toEqual({ type: 'ASK_AI' });
    expect(parseVoiceCommand('show lab')).toEqual({ type: 'SCROLL', sectionId: 'sec-lab' });
    expect(parseVoiceCommand('download cv')).toEqual({ type: 'SCROLL', sectionId: 'sec-dossier' });
    expect(parseVoiceCommand('unrecognized silence')).toBeNull();
  });

  it('registers all 28 live flagship production apps with unique IDs, sequential 01..28 indices, and valid URLs', () => {
    expect(FLAGSHIP_WORKS.length).toBe(28);
    const ids = new Set(FLAGSHIP_WORKS.map((w) => w.id));
    expect(ids.size).toBe(28);

    const expectedIndices = Array.from({ length: 28 }, (_, i) => String(i + 1).padStart(2, '0'));
    expect(FLAGSHIP_WORKS.map((w) => w.index)).toEqual(expectedIndices);

    for (const work of FLAGSHIP_WORKS) {
      expect(work.liveUrl).toMatch(/^https:\/\/tvt987\.github\.io\//);
      expect(work.repoUrl).toMatch(/^https:\/\/github\.com\/tvt987\//);
      expect(work.previewImage).toMatch(/^previews\/[a-z0-9-]+\.webp$/);
      expect(work.ciBadge).toMatch(/^\d+\/\d+ CI$/);
    }
  });

  it('verifies all 26 full-stack monorepos cite .NET 10 or FastAPI plus TVT Studio v8.5 & TVT Tools v2.0 (3,274 showcase CI)', () => {
    const studio = FLAGSHIP_WORKS.find((w) => w.id === 'tvt-studio');
    const tools = FLAGSHIP_WORKS.find((w) => w.id === 'tvt-tools');
    expect(studio?.version).toBe('v8.5 · Supabase RLS');
    expect(studio?.ciBadge).toBe('49/49 CI');
    expect(tools?.version).toBe('v2.0 · 12 Engines');
    expect(tools?.ciBadge).toBe('73/73 CI');

    const monorepos = FLAGSHIP_WORKS.filter((w) => w.id !== 'tvt-studio' && w.id !== 'tvt-tools');
    expect(monorepos).toHaveLength(26);

    const dotnetRepos = monorepos.filter((w) => w.version.includes('.NET 10'));
    const fastapiRepos = monorepos.filter((w) => w.version.includes('FastAPI'));
    expect(dotnetRepos).toHaveLength(18);
    expect(fastapiRepos).toHaveLength(8);
    expect(dotnetRepos.length + fastapiRepos.length).toBe(26);

    const totalShowcaseTests = FLAGSHIP_WORKS.reduce((sum, w) => {
      const m = w.ciBadge.match(/^(\d+)\/(\d+) CI$/);
      expect(m).not.toBeNull();
      expect(m?.[1]).toBe(m?.[2]);
      return sum + Number(m?.[1] ?? 0);
    }, 0);
    expect(totalShowcaseTests).toBe(3274);
  });

  it('surfaces v11.5 portfolio facts (29 live apps, 26/26 monorepos, 12 pro tools, 3,294 live CI) in AI Twin & JD Fit', () => {
    const portfolioAns = queryDigitalTwinLocal('Tell me about your 26 monorepos and live portfolio apps');
    expect(portfolioAns.id).toBe('live-flagships');
    expect(portfolioAns.title).toContain('29 Live Production Web Apps');
    expect(portfolioAns.title).toContain('26/26 Monorepos');
    expect(portfolioAns.metrics.some((m) => m.includes('12 Free Pro Tools'))).toBe(true);
    expect(portfolioAns.metrics.some((m) => m.includes('3,294 Live CI Tests'))).toBe(true);

    const report = analyzeJdFit(SAMPLE_SENIOR_JD);
    expect(report.tailoredPitch).toContain('29 live web apps');
    expect(report.tailoredPitch).toContain('26/26 full-stack .NET 10 & FastAPI monorepos');
    expect(report.tailoredPitch).toContain('12 Free Pro Tools');
    expect(report.tailoredPitch).toContain('3,294 live CI tests');
  });

  it('enforces zero UI emojis across all 28 flagship showcase entries', () => {
    const emojiRe = /\p{Emoji_Presentation}/u;
    for (const work of FLAGSHIP_WORKS) {
      const combined = [
        work.title,
        work.version,
        work.taglineEn,
        work.taglineVi,
        work.highlightMetric,
        work.ciBadge,
        ...work.keywords,
      ].join(' ');
      expect(emojiRe.test(combined)).toBe(false);
    }
  });
});
