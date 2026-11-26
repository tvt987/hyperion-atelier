/**
 * HYPERION ATELIER v5.0 — Browser-Native Web Speech API Voice Command Pilot
 * Supports concise EN & VI navigation commands with zero external dependencies.
 */

export type VoiceIntent =
  | { type: 'THEME'; value: 'obsidian' | 'paper' }
  | { type: 'OPEN_WORK'; workId: string }
  | { type: 'ASK_AI' }
  | { type: 'SCROLL'; sectionId: 'sec-works' | 'sec-lab' | 'sec-stack' | 'sec-dossier' }
  | { type: 'OPEN_INSPECTOR' };

export function parseVoiceCommand(rawTranscript: string): VoiceIntent | null {
  const t = rawTranscript.trim().toLowerCase();
  if (!t) return null;

  if (t.includes('light') || t.includes('paper') || t.includes('sáng')) {
    return { type: 'THEME', value: 'paper' };
  }
  if (t.includes('dark') || t.includes('obsidian') || t.includes('tối')) {
    return { type: 'THEME', value: 'obsidian' };
  }
  if (t.includes('maison') || t.includes('vera') || t.includes('véra')) {
    return { type: 'OPEN_WORK', workId: 'maison-vera' };
  }
  if (t.includes('atelier') || t.includes('canvas') || t.includes('figma')) {
    return { type: 'OPEN_WORK', workId: 'atelier-canvas' };
  }
  if (t.includes('aether') || t.includes('acoustic') || t.includes('audio')) {
    return { type: 'OPEN_WORK', workId: 'aether-acoustics' };
  }
  if (t.includes('nexus') || t.includes('lake') || t.includes('duckdb')) {
    return { type: 'OPEN_WORK', workId: 'nexus-lake' };
  }
  if (t.includes('verdict') || t.includes('graph') || t.includes('agent')) {
    return { type: 'OPEN_WORK', workId: 'verdict-graph' };
  }
  if (t.includes('aegis') || t.includes('pulse')) {
    return { type: 'OPEN_WORK', workId: 'aegispulse' };
  }
  if (t.includes('ask ai') || t.includes('hỏi ai') || t.includes('twin') || t.includes('jd')) {
    return { type: 'ASK_AI' };
  }
  if (t.includes('lab') || t.includes('raft') || t.includes('worker')) {
    return { type: 'SCROLL', sectionId: 'sec-lab' };
  }
  if (t.includes('cv') || t.includes('resume') || t.includes('contact') || t.includes('hồ sơ')) {
    return { type: 'SCROLL', sectionId: 'sec-dossier' };
  }
  if (t.includes('stack') || t.includes('experience') || t.includes('kinh nghiệm')) {
    return { type: 'SCROLL', sectionId: 'sec-stack' };
  }
  if (t.includes('work') || t.includes('project') || t.includes('dự án')) {
    return { type: 'SCROLL', sectionId: 'sec-works' };
  }
  if (t.includes('gpu') || t.includes('telemetry') || t.includes('api')) {
    return { type: 'OPEN_INSPECTOR' };
  }

  return null;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechCtor() !== null;
}

export function startVoiceSession(opts: {
  lang: 'en' | 'vi';
  onInterim: (text: string) => void;
  onFinal: (text: string, intent: VoiceIntent | null) => void;
  onEnd: () => void;
}): (() => void) | null {
  const Ctor = getSpeechCtor();
  if (!Ctor) return null;

  try {
    const rec = new Ctor();
    rec.lang = opts.lang === 'vi' ? 'vi-VN' : 'en-US';
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    rec.onresult = (ev) => {
      const idx = ev.results.length - 1;
      const res = ev.results[idx];
      if (!res || !res[0]) return;
      const transcript = res[0].transcript;
      if (res.isFinal) {
        opts.onFinal(transcript, parseVoiceCommand(transcript));
      } else {
        opts.onInterim(transcript);
      }
    };

    rec.onerror = () => {
      opts.onEnd();
    };
    rec.onend = () => {
      opts.onEnd();
    };

    rec.start();
    return () => {
      try {
        rec.stop();
      } catch {
        // Ignore stop errors
      }
    };
  } catch {
    return null;
  }
}
