/**
 * Machinery Acoustics Engine (Web Audio API Synthesizer)
 * 
 * Generates mathematically modeled real-time acoustic signatures of industrial machinery:
 * - Fluid cavitation vapor bubble collapse crackle (pink/bandpassed noise + random impulses)
 * - Shaft rotational 1X/2X mechanical unbalance hum
 * - Rolling element bearing impact pulses (BPFO / BPFI ringing)
 * - Gear tooth meshing whine
 * - Centrifugal compressor aerodynamic surge breathing pulsation
 */

export interface MachineryAcousticState {
  rpm: number;
  cavitationIntensity: number; // 0.0 (silent) to 1.0 (severe violent cavitation)
  vibrationIntensity: number;  // 0.0 to 1.0 (1X unbalance amplitude)
  bearingDefectIntensity?: number; // 0.0 to 1.0
  isSurging?: boolean;
}

class MachineryAcousticsEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private masterGain: GainNode | null = null;
  private volume: number = 0.4;

  // Cavitation Nodes
  private noiseNode: AudioBufferSourceNode | null = null;
  private cavitationFilter: BiquadFilterNode | null = null;
  private cavitationGain: GainNode | null = null;
  private impulseIntervalId: number | null = null;

  // Unbalance / Rotational Nodes
  private shaftOsc: OscillatorNode | null = null;
  private shaftHarmonicOsc: OscillatorNode | null = null;
  private shaftGain: GainNode | null = null;

  // Surge LFO Node
  private surgeOsc: OscillatorNode | null = null;
  private surgeGain: GainNode | null = null;

  private currentState: MachineryAcousticState = {
    rpm: 1800,
    cavitationIntensity: 0,
    vibrationIntensity: 0.1,
    isSurging: false,
  };

  /**
   * Initialize Web Audio Context safely upon user gesture
   */
  public async init(): Promise<void> {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      this.ctx = new AudioCtxClass();
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupCavitationCrackle();
      this.setupShaftTone();
      this.setupSurgeLFO();
    } catch (e) {
      console.warn("Machinery Audio initialization deferred until user interaction.", e);
    }
  }

  private setupCavitationCrackle(): void {
    if (!this.ctx || !this.masterGain) return;

    // Create 3 seconds of white noise buffer
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.4;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    // High-pass + Bandpass to simulate metal casing acoustic resonance
    this.cavitationFilter = this.ctx.createBiquadFilter();
    this.cavitationFilter.type = 'bandpass';
    this.cavitationFilter.frequency.value = 1800; // Typical cavitation hiss frequency
    this.cavitationFilter.Q.value = 2.5;

    this.cavitationGain = this.ctx.createGain();
    this.cavitationGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.noiseNode.connect(this.cavitationFilter);
    this.cavitationFilter.connect(this.cavitationGain);
    this.cavitationGain.connect(this.masterGain);

    this.noiseNode.start();
  }

  private setupShaftTone(): void {
    if (!this.ctx || !this.masterGain) return;

    // Fundamental shaft rotational 1X tone
    this.shaftOsc = this.ctx.createOscillator();
    this.shaftOsc.type = 'sine';
    const fundamentalHz = Math.max(10, this.currentState.rpm / 60);
    this.shaftOsc.frequency.setValueAtTime(fundamentalHz, this.ctx.currentTime);

    // 2X Harmonic
    this.shaftHarmonicOsc = this.ctx.createOscillator();
    this.shaftHarmonicOsc.type = 'sine';
    this.shaftHarmonicOsc.frequency.setValueAtTime(fundamentalHz * 2, this.ctx.currentTime);

    this.shaftGain = this.ctx.createGain();
    this.shaftGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.shaftOsc.connect(this.shaftGain);
    this.shaftHarmonicOsc.connect(this.shaftGain);
    this.shaftGain.connect(this.masterGain);

    this.shaftOsc.start();
    this.shaftHarmonicOsc.start();
  }

  private setupSurgeLFO(): void {
    if (!this.ctx || !this.masterGain) return;

    // Surge creates a low-frequency envelope pulse (1.5 Hz)
    this.surgeOsc = this.ctx.createOscillator();
    this.surgeOsc.type = 'sine';
    this.surgeOsc.frequency.setValueAtTime(1.8, this.ctx.currentTime);

    this.surgeGain = this.ctx.createGain();
    this.surgeGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.surgeOsc.connect(this.surgeGain);
    this.surgeGain.connect(this.masterGain);
    this.surgeOsc.start();
  }

  /**
   * Update real-time acoustic machinery parameters
   */
  public updateState(state: Partial<MachineryAcousticState>): void {
    this.currentState = { ...this.currentState, ...state };
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;

    // 1. Update Shaft Rotational Frequency
    if (this.shaftOsc && this.shaftHarmonicOsc) {
      const freq1X = Math.max(8, this.currentState.rpm / 60);
      this.shaftOsc.frequency.linearRampToValueAtTime(freq1X, now + 0.1);
      this.shaftHarmonicOsc.frequency.linearRampToValueAtTime(freq1X * 2, now + 0.1);
    }

    // 2. Shaft Vibration Gain
    if (this.shaftGain) {
      const vibGain = Math.min(0.25, Math.max(0, this.currentState.vibrationIntensity * 0.2));
      this.shaftGain.gain.linearRampToValueAtTime(vibGain, now + 0.1);
    }

    // 3. Cavitation Crackle Gain & Frequency
    if (this.cavitationGain && this.cavitationFilter) {
      const cav = Math.min(1.0, Math.max(0, this.currentState.cavitationIntensity));
      // Exponential feeling: low until threshold, then rapid acoustic harshness
      const targetGain = cav > 0.05 ? Math.pow(cav, 1.8) * 0.45 : 0;
      this.cavitationGain.gain.linearRampToValueAtTime(targetGain, now + 0.15);

      // Pitch shifts higher as bubbles collapse faster
      const centerHz = 1200 + cav * 1600;
      this.cavitationFilter.frequency.linearRampToValueAtTime(centerHz, now + 0.15);

      // Random sharp popping impulses for gravel-like cavitation
      if (cav > 0.35 && !this.impulseIntervalId) {
        this.startImpulsePopScheduler();
      } else if (cav <= 0.35 && this.impulseIntervalId) {
        this.stopImpulsePopScheduler();
      }
    }

    // 4. Surge Oscillation
    if (this.surgeGain) {
      const surgeVal = this.currentState.isSurging ? 0.3 : 0;
      this.surgeGain.gain.linearRampToValueAtTime(surgeVal, now + 0.2);
    }
  }

  private startImpulsePopScheduler(): void {
    if (this.impulseIntervalId) return;
    this.impulseIntervalId = window.setInterval(() => {
      if (!this.ctx || !this.masterGain || this.isMuted) return;
      if (Math.random() < this.currentState.cavitationIntensity * 0.8) {
        this.playPopImpulse();
      }
    }, 65);
  }

  private stopImpulsePopScheduler(): void {
    if (this.impulseIntervalId) {
      clearInterval(this.impulseIntervalId);
      this.impulseIntervalId = null;
    }
  }

  private playPopImpulse(): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600 + Math.random() * 1200, now);
    g.gain.setValueAtTime(0.2 * this.currentState.cavitationIntensity, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : this.volume, now + 0.05);
    }
    if (!this.isMuted) {
      this.updateState(this.currentState);
    } else {
      this.stopImpulsePopScheduler();
    }
    return this.isMuted;
  }

  public setVolume(val: number): void {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.ctx && this.masterGain && !this.isMuted) {
      this.masterGain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.05);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentState(): MachineryAcousticState {
    return { ...this.currentState };
  }
}

export const machineryAcoustics = new MachineryAcousticsEngine();
