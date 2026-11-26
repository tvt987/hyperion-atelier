/**
 * HYPERION ATELIER v5.0 — Zero-Asset Spatial Stereo Web Audio API Micro-Acoustics Synthesizer.
 * Generates mechanical Leica/Teenage-Engineering-inspired relay clicks and harmonic pulses
 * routed through StereoPannerNode (-0.65 left -> +0.65 right) tracking pointer azimuth.
 */

class TactileAudioEngine {
  private ctx: AudioContext | null = null;
  private enabled = false;
  private currentPan = 0;

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setPointerPanX(normX01: number): void {
    const clamped = Math.min(1, Math.max(0, normX01));
    this.currentPan = (clamped * 2 - 1) * 0.65;
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.ensureContext();
      this.playLatch();
    }
    return this.enabled;
  }

  public setEnabled(next: boolean): void {
    this.enabled = next;
    if (next) {
      this.ensureContext();
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private connectOutput(ctx: AudioContext, node: AudioNode, panOverride?: number): void {
    const targetPan = Math.min(
      0.65,
      Math.max(-0.65, panOverride !== undefined ? panOverride : this.currentPan)
    );
    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(targetPan, ctx.currentTime);
      node.connect(panner);
      panner.connect(ctx.destination);
    } else {
      node.connect(ctx.destination);
    }
  }

  public playTick(freq = 1480, panX?: number): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.014);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.016);

    osc.connect(filter);
    filter.connect(gain);
    this.connectOutput(ctx, gain, panX);

    osc.start(now);
    osc.stop(now + 0.018);
  }

  public playLatch(panX?: number): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(1040, now + 0.028);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    this.connectOutput(ctx, gain, panX);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  public playFaultPulse(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(78, now + 0.09);

    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.095);

    osc.connect(gain);
    this.connectOutput(ctx, gain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playChordPulse(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [440, 659.25].forEach((hz, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(hz, now + idx * 0.02);
      gain.gain.setValueAtTime(0.032, now + idx * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16 + idx * 0.02);
      osc.connect(gain);
      this.connectOutput(ctx, gain, idx === 0 ? -0.28 : 0.28);
      osc.start(now + idx * 0.02);
      osc.stop(now + 0.18 + idx * 0.02);
    });
  }
}

export const tactileAudio = new TactileAudioEngine();
