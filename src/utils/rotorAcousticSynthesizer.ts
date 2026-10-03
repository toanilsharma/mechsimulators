/**
 * Procedural Web Audio API Synthesizer for Rotor Dynamics & Bearing Fault Acoustics
 * 
 * Synthesizes:
 * 1. 1X Shaft Fundamental Rotation Tone (N / 60 Hz)
 * 2. 2X Harmonic
 * 3. Subsynchronous Oil Whirl / Whip tone (~0.45X Hz) when instability occurs
 * 4. High-frequency bearing defect impact pulses (BPFO, BPFI, BSF)
 * 5. Master volume and mute control
 */

export interface RotorAcousticParams {
  operatingRpm: number;
  unbalanceForceN: number;
  isResonance: boolean;
  isOilWhirlActive: boolean;
  isOilWhipActive: boolean;
  bearingDefect: 'none' | 'bpfo' | 'bpfi' | 'bsf' | 'ftf';
  bpfoHz: number;
  bpfiHz: number;
  bsfHz: number;
}

export class RotorAcousticSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private masterGain: GainNode | null = null;

  // 1X Fundamental
  private osc1X: OscillatorNode | null = null;
  private gain1X: GainNode | null = null;

  // 2X Harmonic
  private osc2X: OscillatorNode | null = null;
  private gain2X: GainNode | null = null;

  // Subsynchronous Oil Whirl Osc (~0.45X)
  private oscWhirl: OscillatorNode | null = null;
  private gainWhirl: GainNode | null = null;

  // Defect impact filter & gain
  private defectFilter: BiquadFilterNode | null = null;
  private defectGain: GainNode | null = null;
  private defectIntervalId: any = null;

  private currentParams: RotorAcousticParams = {
    operatingRpm: 1800,
    unbalanceForceN: 450,
    isResonance: false,
    isOilWhirlActive: false,
    isOilWhipActive: false,
    bearingDefect: 'none',
    bpfoHz: 105,
    bpfiHz: 135,
    bsfHz: 68,
  };

  public init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    const f0 = Math.max(10, this.currentParams.operatingRpm / 60);

    // 1X Osc
    this.osc1X = this.ctx.createOscillator();
    this.osc1X.type = 'sine';
    this.osc1X.frequency.setValueAtTime(f0, this.ctx.currentTime);
    this.gain1X = this.ctx.createGain();
    this.gain1X.gain.setValueAtTime(0.12, this.ctx.currentTime);
    this.osc1X.connect(this.gain1X);
    this.gain1X.connect(this.masterGain);
    this.osc1X.start();

    // 2X Harmonic Osc
    this.osc2X = this.ctx.createOscillator();
    this.osc2X.type = 'triangle';
    this.osc2X.frequency.setValueAtTime(f0 * 2, this.ctx.currentTime);
    this.gain2X = this.ctx.createGain();
    this.gain2X.gain.setValueAtTime(0.04, this.ctx.currentTime);
    this.osc2X.connect(this.gain2X);
    this.gain2X.connect(this.masterGain);
    this.osc2X.start();

    // Subsynchronous Oil Whirl Osc (0.45X)
    this.oscWhirl = this.ctx.createOscillator();
    this.oscWhirl.type = 'sine';
    this.oscWhirl.frequency.setValueAtTime(f0 * 0.45, this.ctx.currentTime);
    this.gainWhirl = this.ctx.createGain();
    this.gainWhirl.gain.setValueAtTime(0, this.ctx.currentTime);
    this.oscWhirl.connect(this.gainWhirl);
    this.gainWhirl.connect(this.masterGain);
    this.oscWhirl.start();

    // Defect Impact Filter (Resonant Ringing at 3.5 kHz)
    this.defectFilter = this.ctx.createBiquadFilter();
    this.defectFilter.type = 'bandpass';
    this.defectFilter.frequency.setValueAtTime(3600, this.ctx.currentTime);
    this.defectFilter.Q.setValueAtTime(6.0, this.ctx.currentTime);

    this.defectGain = this.ctx.createGain();
    this.defectGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.defectFilter.connect(this.defectGain);
    this.defectGain.connect(this.masterGain);

    this.startDefectScheduler();
  }

  private startDefectScheduler() {
    if (this.defectIntervalId) clearInterval(this.defectIntervalId);

    this.defectIntervalId = setInterval(() => {
      if (!this.ctx || this.isMuted || !this.defectFilter) return;

      const defect = this.currentParams.bearingDefect;
      if (defect === 'none') return;

      let triggerFreqHz = this.currentParams.bpfoHz;
      if (defect === 'bpfi') triggerFreqHz = this.currentParams.bpfiHz;
      else if (defect === 'bsf') triggerFreqHz = this.currentParams.bsfHz;

      // Fire a resonant high-frequency metallic impact ping
      this.triggerBearingPing();
    }, 45);
  }

  private triggerBearingPing() {
    if (!this.ctx || !this.defectFilter) return;
    try {
      const now = this.ctx.currentTime;
      const pingOsc = this.ctx.createOscillator();
      const pingGain = this.ctx.createGain();

      pingOsc.type = 'sawtooth';
      pingOsc.frequency.setValueAtTime(3500 + Math.random() * 800, now);
      pingOsc.frequency.exponentialRampToValueAtTime(1200, now + 0.005);

      pingGain.gain.setValueAtTime(0.16, now);
      pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.007);

      pingOsc.connect(this.defectFilter);
      this.defectFilter.connect(pingGain);
      if (this.masterGain) {
        pingGain.connect(this.masterGain);
      }

      pingOsc.start(now);
      pingOsc.stop(now + 0.008);
    } catch {
      // Safe catch
    }
  }

  public updateParameters(params: RotorAcousticParams) {
    this.currentParams = { ...params };
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const f0 = Math.max(10, params.operatingRpm / 60);

    if (this.osc1X) {
      this.osc1X.frequency.setTargetAtTime(f0, now, 0.05);
    }
    if (this.osc2X) {
      this.osc2X.frequency.setTargetAtTime(f0 * 2, now, 0.05);
    }

    // 1X Amplitude depends on unbalance force and resonance
    if (this.gain1X) {
      const baseAmp = Math.min(0.25, 0.06 + (params.unbalanceForceN / 5000) * 0.15);
      const resAmp = params.isResonance ? baseAmp * 2.2 : baseAmp;
      this.gain1X.gain.setTargetAtTime(resAmp, now, 0.05);
    }

    // Oil Whirl/Whip Tone (0.45X)
    if (this.oscWhirl && this.gainWhirl) {
      this.oscWhirl.frequency.setTargetAtTime(f0 * 0.45, now, 0.05);
      const whirlAmp = params.isOilWhipActive ? 0.35 : params.isOilWhirlActive ? 0.18 : 0;
      this.gainWhirl.gain.setTargetAtTime(whirlAmp, now, 0.08);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!this.ctx && !muted) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended' && !muted) {
      this.ctx.resume();
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.4, this.ctx.currentTime, 0.04);
    }
  }

  public setVolume(volume0to1: number) {
    if (this.masterGain && this.ctx && !this.isMuted) {
      const safeVol = Math.max(0, Math.min(1, volume0to1)) * 0.6;
      this.masterGain.gain.setTargetAtTime(safeVol, this.ctx.currentTime, 0.04);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public dispose() {
    if (this.defectIntervalId) clearInterval(this.defectIntervalId);
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {
        // Safe close
      }
      this.ctx = null;
    }
  }
}

let rotorAcousticInstance: RotorAcousticSynthesizer | null = null;

export function getRotorAcousticSynthesizer(): RotorAcousticSynthesizer {
  if (!rotorAcousticInstance) {
    rotorAcousticInstance = new RotorAcousticSynthesizer();
  }
  return rotorAcousticInstance;
}
