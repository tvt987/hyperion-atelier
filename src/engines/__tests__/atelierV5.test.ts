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
});
