// Procedural Web Audio API Soundscape for The Obsidian Tribunal
// Canonical Art Direction: Obsidian, Bone, and Oxidized Copper

class ObsidianAudioEngine {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientOsc3: OscillatorNode | null = null;
  private isMuted: boolean = true;
  private lastTriggerTimes: Record<string, number> = {};

  constructor() {
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pause();
        } else if (!this.isMuted) {
          this.resume();
        }
      });
    }
  }

  private initContext(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass && !this.ctx) {
        this.ctx = new AudioContextClass();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return Boolean(this.ctx);
    } catch {
      return false;
    }
  }

  public toggleMute(): boolean {
    this.initContext();
    this.isMuted = !this.isMuted;

    if (!this.isMuted) {
      this.startAmbient();
      this.playClaimEstablished();
    } else {
      this.stopAmbient();
    }

    return !this.isMuted;
  }

  public getIsPlaying(): boolean {
    return !this.isMuted;
  }

  public pause() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended' && !this.isMuted) {
      this.ctx.resume().catch(() => {});
    }
  }

  // Prevents repeated cue firing on frantic scroll crossing
  private canTrigger(cue: string, cooldownMs = 2500): boolean {
    const now = Date.now();
    const last = this.lastTriggerTimes[cue] || 0;
    if (now - last < cooldownMs) return false;
    this.lastTriggerTimes[cue] = now;
    return true;
  }

  // Low subterranean atmospheric room tone
  private startAmbient() {
    if (!this.ctx || this.ambientGain) return;

    try {
      const now = this.ctx.currentTime;
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.0001, now);
      // Restrained, slow fade-in
      this.ambientGain.gain.exponentialRampToValueAtTime(0.028, now + 3.0);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(110, now);

      // Deep 48Hz Sub-basalt resonance + 72Hz fifth + 108Hz octave fifth
      this.ambientOsc1 = this.ctx.createOscillator();
      this.ambientOsc1.type = 'sine';
      this.ambientOsc1.frequency.setValueAtTime(48, now);

      this.ambientOsc2 = this.ctx.createOscillator();
      this.ambientOsc2.type = 'triangle';
      this.ambientOsc2.frequency.setValueAtTime(72, now);

      this.ambientOsc3 = this.ctx.createOscillator();
      this.ambientOsc3.type = 'sine';
      this.ambientOsc3.frequency.setValueAtTime(108, now);

      this.ambientOsc1.connect(filter);
      this.ambientOsc2.connect(filter);
      this.ambientOsc3.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);

      this.ambientOsc1.start();
      this.ambientOsc2.start();
      this.ambientOsc3.start();
    } catch {
      // AudioContext policy fallback
    }
  }

  private stopAmbient() {
    if (this.ambientGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
        this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        setTimeout(() => {
          try {
            this.ambientOsc1?.stop();
            this.ambientOsc2?.stop();
            this.ambientOsc3?.stop();
            this.ambientOsc1?.disconnect();
            this.ambientOsc2?.disconnect();
            this.ambientOsc3?.disconnect();
            this.ambientGain?.disconnect();
            this.ambientOsc1 = null;
            this.ambientOsc2 = null;
            this.ambientOsc3 = null;
            this.ambientGain = null;
          } catch {
            // Cleanup
          }
        }, 650);
      } catch {
        this.ambientGain = null;
      }
    }
  }

  // Soft metallic/stone texture during the opening sequence revelation
  public playRevealTexture() {
    if (this.isMuted || !this.canTrigger('reveal', 3000)) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.02, now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(440, now);
      filter.Q.setValueAtTime(6.0, now);

      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(330, now + 2.0);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 3.4);
    } catch {
      // Audio fallback
    }
  }

  // Subtle cue when the claim becomes established (Chapter I)
  public playClaimEstablished() {
    if (this.isMuted || !this.canTrigger('claim', 2000)) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.045, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, now);

      // Warm copper triad (A2: 110Hz, E3: 164.8Hz, C#4: 277.2Hz)
      const freqs = [110, 164.8, 277.2];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.connect(filter);
        osc.start(now);
        osc.stop(now + 2.6);
      });

      filter.connect(masterGain);
      masterGain.connect(this.ctx.destination);
    } catch {
      // Audio fallback
    }
  }

  // Subtle mineral chime when evidence fragments dock (Chapter II)
  public playEvidenceDock() {
    if (this.isMuted || !this.canTrigger('evidence', 1800)) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(580, now);
      filter.Q.setValueAtTime(5.0, now);

      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(293.66, now); // D4
      osc.frequency.setValueAtTime(440, now + 0.12); // A4

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.9);
    } catch {
      // Audio fallback
    }
  }

  // Low, controlled impact when opposing force arrives (Chapter III)
  public playOppositionImpact() {
    if (this.isMuted || !this.canTrigger('opposition', 2500)) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const impactGain = this.ctx.createGain();
      impactGain.gain.setValueAtTime(0.065, now);
      impactGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(240, now);
      filter.frequency.exponentialRampToValueAtTime(60, now + 1.5);

      // Low impact sub-frequency
      const oscSub = this.ctx.createOscillator();
      oscSub.type = 'triangle';
      oscSub.frequency.setValueAtTime(68, now);
      oscSub.frequency.exponentialRampToValueAtTime(34, now + 1.2);

      // Stone friction harmonic
      const oscClash = this.ctx.createOscillator();
      oscClash.type = 'sawtooth';
      oscClash.frequency.setValueAtTime(142, now);
      oscClash.frequency.exponentialRampToValueAtTime(50, now + 0.8);

      const clashGain = this.ctx.createGain();
      clashGain.gain.setValueAtTime(0.02, now);
      clashGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

      oscSub.connect(filter);
      oscClash.connect(clashGain);
      clashGain.connect(filter);

      filter.connect(impactGain);
      impactGain.connect(this.ctx.destination);

      oscSub.start(now);
      oscClash.start(now);
      oscSub.stop(now + 2.4);
      oscClash.stop(now + 2.4);
    } catch {
      // Audio fallback
    }
  }

  // Restrained resonance when structure resolves into truth (Chapter IV)
  public playResolutionResonance() {
    if (this.isMuted || !this.canTrigger('resolution', 2500)) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.04, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);

      // Pure consonance: D3 (146.8), A3 (220), D4 (293.7), F#4 (370)
      const freqs = [146.8, 220, 293.7, 370];
      freqs.forEach((f) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);
        osc.connect(filter);
        osc.start(now);
        osc.stop(now + 3.2);
      });

      filter.connect(gain);
      gain.connect(this.ctx.destination);
    } catch {
      // Audio fallback
    }
  }

  // Spatial swell as the inner gate opens
  public playGateSwell() {
    if (this.isMuted || !this.canTrigger('gate', 3000)) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const swellGain = this.ctx.createGain();
      swellGain.gain.setValueAtTime(0.0001, now);
      swellGain.gain.exponentialRampToValueAtTime(0.055, now + 1.2);
      swellGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.0);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, now);
      filter.frequency.exponentialRampToValueAtTime(520, now + 1.5);

      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(55, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 2.0);

      const oscHarmonic = this.ctx.createOscillator();
      oscHarmonic.type = 'sine';
      oscHarmonic.frequency.setValueAtTime(165, now);
      oscHarmonic.frequency.exponentialRampToValueAtTime(220, now + 2.5);

      osc.connect(filter);
      oscHarmonic.connect(filter);
      filter.connect(swellGain);
      swellGain.connect(this.ctx.destination);

      osc.start(now);
      oscHarmonic.start(now);
      osc.stop(now + 4.2);
      oscHarmonic.stop(now + 4.2);
    } catch {
      // Audio fallback
    }
  }

  // Resonant strike when user enters court or lodges objection (Preserved)
  public playGavelChime() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const strikeGain = this.ctx.createGain();
      strikeGain.gain.setValueAtTime(0.08, now);
      strikeGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, now);
      filter.Q.setValueAtTime(4.0, now);

      // Deep bell / stone harmonics (160Hz, 320Hz, 480Hz)
      const freqs = [160, 320, 480];
      freqs.forEach((f, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(f, now);
        osc.connect(filter);
        osc.start(now);
        osc.stop(now + 2.8);
      });

      filter.connect(strikeGain);
      strikeGain.connect(this.ctx.destination);
    } catch {
      // Audio fallback
    }
  }

  // Gentle acoustic cue when user selects or manipulates an artifact
  public playArtifactInspect() {
    if (this.isMuted || !this.canTrigger('inspect', 600)) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.025, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(740, now);
      filter.Q.setValueAtTime(6.0, now);

      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.9);
    } catch {
      // Audio fallback
    }
  }

  // Subterranean stone resonance when the player intervenes in cross-examination
  public playMechanismShift() {
    if (this.isMuted || !this.canTrigger('mechShift', 900)) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, now);

      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(75, now);
      osc.frequency.exponentialRampToValueAtTime(115, now + 0.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.9);
    } catch {
      // Audio fallback
    }
  }
}

export const obsidianAudio = new ObsidianAudioEngine();
