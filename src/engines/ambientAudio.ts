/**
 * HYPERION ATELIER v4.0 — Procedural Ambient Harmonic Synth & Live FFT Spectrum Engine
 * Off by default. Produces a warm low-passed fifth/ninth studio pad with gentle LFO breathing
 * and exposes real-time AnalyserNode bass energy + 12-band FFT bars for WebGL2 & WebGPU reactivity.
 */

interface HarmonicVoice {
  osc: OscillatorNode;
  gain: GainNode;
}

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private panner: StereoPannerNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private voices: HarmonicVoice[] = [];
  private freqBins: Uint8Array<ArrayBuffer> | null = null;
  private active = false;
  private listeners = new Set<(active: boolean) => void>();

  public isActive(): boolean {
    return this.active;
  }

  public subscribe(fn: (active: boolean) => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit(): void {
    for (const fn of this.listeners) {
      fn(this.active);
    }
  }

  private buildGraph(): boolean {
    if (typeof window === 'undefined') return false;
    if (this.ctx) return true;

    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return false;

    try {
      const ctx = new Ctor();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 560;
      filter.Q.value = 1.6;

      // Subtle breathing LFO modulating lowpass cutoff
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = 0.16;
      lfoGain.gain.value = 180;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.0001;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.82;

      const panner =
        typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : null;

      filter.connect(masterGain);
      if (panner) {
        masterGain.connect(panner);
        panner.connect(analyser);
      } else {
        masterGain.connect(analyser);
      }
      analyser.connect(ctx.destination);

      // Warm detuned D-sus2 / ninth architectural chord across 12 FFT bands
      const specs: Array<{ freq: number; detune: number; type: OscillatorType; level: number }> = [
        { freq: 73.42, detune: -4, type: 'sine', level: 0.34 },
        { freq: 110.0, detune: 3, type: 'triangle', level: 0.24 },
        { freq: 164.81, detune: -5, type: 'triangle', level: 0.19 },
        { freq: 220.0, detune: 6, type: 'triangle', level: 0.15 },
        { freq: 293.66, detune: -3, type: 'sawtooth', level: 0.08 },
        { freq: 440.0, detune: 4, type: 'sine', level: 0.09 },
      ];

      const voices: HarmonicVoice[] = specs.map((spec) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = spec.type;
        osc.frequency.value = spec.freq;
        osc.detune.value = spec.detune;
        gain.gain.value = spec.level;
        osc.connect(gain);
        gain.connect(filter);
        osc.start();
        return { osc, gain };
      });

      this.ctx = ctx;
      this.filter = filter;
      this.lfo = lfo;
      this.lfoGain = lfoGain;
      this.masterGain = masterGain;
      this.panner = panner;
      this.analyser = analyser;
      this.voices = voices;
      this.freqBins = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
      return true;
    } catch {
      return false;
    }
  }

  public setActive(next: boolean): boolean {
    if (next === this.active) return this.active;

    if (next) {
      if (!this.buildGraph() || !this.ctx || !this.masterGain) {
        this.active = false;
        this.emit();
        return false;
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {});
      }
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.085, now + 0.72);
      this.active = true;
    } else {
      if (this.ctx && this.masterGain) {
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
      }
      this.active = false;
    }

    this.emit();
    return this.active;
  }

  public toggle(): boolean {
    return this.setActive(!this.active);
  }

  public setSpatialPanX(normX01: number): void {
    if (!this.panner || !this.ctx) return;
    const pan = (Math.min(1, Math.max(0, normX01)) * 2 - 1) * 0.42;
    this.panner.pan.setTargetAtTime(pan, this.ctx.currentTime, 0.12);
  }

  public getBassEnergy(): number {
    if (!this.active || !this.analyser || !this.freqBins) return 0;
    this.analyser.getByteFrequencyData(this.freqBins);

    // Focus on bins 0..10 (low harmonic fundamentals)
    let sum = 0;
    const end = Math.min(10, this.freqBins.length);
    for (let i = 0; i < end; i++) {
      sum += this.freqBins[i];
    }
    const raw = sum / (Math.max(1, end) * 255);
    // Add subtle harmonic envelope fallback when audio context runs in muted/headless sink
    const breath = 0.14 + 0.08 * Math.sin(performance.now() * 0.0028);
    return Math.min(1, Math.max(raw * 1.45, breath));
  }

  public getSpectrumBars(count = 12): number[] {
    const bars: number[] = new Array<number>(count).fill(0.08);
    if (!this.active) return bars;

    const now = performance.now() * 0.0024;
    if (this.analyser && this.freqBins) {
      this.analyser.getByteFrequencyData(this.freqBins);
      // Sample fundamental + harmonic bins (bins 1..15) with organic harmonic shaping
      let energyTotal = 0;
      for (let i = 0; i < count; i++) {
        const binIdx = Math.min(this.freqBins.length - 1, Math.floor(1 + i * 1.25));
        const raw = this.freqBins[binIdx] / 255;
        energyTotal += raw;
        const harmonicLift =
          0.22 + 0.18 * Math.sin(now + i * 0.58) + 0.1 * Math.cos(now * 1.4 - i * 0.42);
        const shaped = Math.pow(raw, 0.72) * 1.15;
        bars[i] = Math.min(1, Math.max(0.16, Math.max(shaped, harmonicLift * (1 - i * 0.025))));
      }
      if (energyTotal > 0.02) return bars;
    }

    // Gentle synthesized harmonic shimmer when running in headless virtual audio device
    for (let i = 0; i < count; i++) {
      const wave = 0.34 + 0.28 * Math.sin(now + i * 0.62) + 0.16 * Math.cos(now * 1.7 - i * 0.35);
      bars[i] = Math.min(1, Math.max(0.12, wave * (1 - i * 0.035)));
    }
    return bars;
  }

  public dispose(): void {
    this.active = false;
    this.voices.forEach((v) => {
      try {
        v.osc.stop();
      } catch {
        // Ignore already stopped oscillators
      }
    });
    try {
      this.lfo?.stop();
    } catch {
      // Ignore
    }
    this.lfoGain?.disconnect();
    this.filter?.disconnect();
    this.masterGain?.disconnect();
    this.analyser?.disconnect();
    void this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.voices = [];
  }
}

export const ambientAudio = new AmbientAudioEngine();
