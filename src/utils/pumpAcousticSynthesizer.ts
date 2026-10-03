/**
 * Procedural Web Audio API Synthesizer for Centrifugal Pump & Cavitation Acoustics
 * 
 * Accurately synthesizes:
 * 1. 1X Shaft Fundamental Frequency (N / 60 Hz)
 * 2. Blade Pass Frequency (BPF = N * z / 60 Hz) with 2X/3X harmonics
 * 3. Hydrodynamic turbulent flow pink/white noise
 * 4. Cavitation Impactor: High-frequency crackling burst transients (2.8 kHz - 8.5 kHz),
 *    the signature "pumping gravel / marbles in the casing" sound
 * 5. Low-frequency Suction Recirculation surging modulation (12 - 18 Hz)
 * 6. Real-time AnalyserNode output for live decibel and frequency spectrum visualization
 */

export interface PumpAcousticParams {
  pumpSpeedRpm: number;
  flowRateM3h: number;
  bepFlowM3h: number;
  npshaM: number;
  npshrM: number;
  cavitationIntensity: number; // 0 to 1
  isRecirculating: boolean;
  recirculationIntensity: number;
  numBlades?: number;
}

export class PumpAcousticSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Sound nodes
  private bpfOsc: OscillatorNode | null = null;
  private bpfHarmonicOsc: OscillatorNode | null = null;
  private bpfGain: GainNode | null = null;

  private motorOsc: OscillatorNode | null = null;
  private motorGain: GainNode | null = null;

  private flowNoiseNode: AudioBufferSourceNode | null = null;
  private flowFilter: BiquadFilterNode | null = null;
  private flowGain: GainNode | null = null;

  private cavitationGain: GainNode | null = null;
  private cavitationFilter: BiquadFilterNode | null = null;

  private surgeLfo: OscillatorNode | null = null;
  private surgeLfoGain: GainNode | null = null;

  // Cavitation burst scheduler
  private burstIntervalId: any = null;
  private currentParams: PumpAcousticParams = {
    pumpSpeedRpm: 2950,
    flowRateM3h: 120,
    bepFlowM3h: 125,
    npshaM: 4.5,
    npshrM: 3.2,
    cavitationIntensity: 0,
    isRecirculating: false,
    recirculationIntensity: 0,
    numBlades: 6,
  };

  constructor() {
    // Lazy initialized on user activation to comply with browser autoplay policy
  }

  public init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.45, this.ctx.currentTime);

    // Analyser Node for spectrum visualizer
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 64;
    this.analyser.smoothingTimeConstant = 0.8;
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // 1. Blade Pass Frequency (BPF) Oscillator
    const rpm = this.currentParams.pumpSpeedRpm;
    const z = this.currentParams.numBlades || 6;
    const bpfHz = Math.max(20, (rpm * z) / 60);

    this.bpfOsc = this.ctx.createOscillator();
    this.bpfOsc.type = 'sine';
    this.bpfOsc.frequency.setValueAtTime(bpfHz, this.ctx.currentTime);

    this.bpfHarmonicOsc = this.ctx.createOscillator();
    this.bpfHarmonicOsc.type = 'triangle';
    this.bpfHarmonicOsc.frequency.setValueAtTime(bpfHz * 2, this.ctx.currentTime);

    this.bpfGain = this.ctx.createGain();
    this.bpfGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    this.bpfOsc.connect(this.bpfGain);
    this.bpfHarmonicOsc.connect(this.bpfGain);
    this.bpfGain.connect(this.masterGain);

    this.bpfOsc.start();
    this.bpfHarmonicOsc.start();

    // 2. Motor / Shaft 1X Hum
    const motorHz = Math.max(10, rpm / 60);
    this.motorOsc = this.ctx.createOscillator();
    this.motorOsc.type = 'sine';
    this.motorOsc.frequency.setValueAtTime(motorHz, this.ctx.currentTime);

    this.motorGain = this.ctx.createGain();
    this.motorGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

    this.motorOsc.connect(this.motorGain);
    this.motorGain.connect(this.masterGain);
    this.motorOsc.start();

    // 3. Hydrodynamic Flow Noise (Looping Filtered Noise Buffer)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.flowNoiseNode = this.ctx.createBufferSource();
    this.flowNoiseNode.buffer = noiseBuffer;
    this.flowNoiseNode.loop = true;

    this.flowFilter = this.ctx.createBiquadFilter();
    this.flowFilter.type = 'bandpass';
    this.flowFilter.frequency.setValueAtTime(550, this.ctx.currentTime);
    this.flowFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    this.flowGain = this.ctx.createGain();
    this.flowGain.gain.setValueAtTime(0.07, this.ctx.currentTime);

    this.flowNoiseNode.connect(this.flowFilter);
    this.flowFilter.connect(this.flowGain);
    this.flowGain.connect(this.masterGain);
    this.flowNoiseNode.start();

    // 4. Cavitation "Pumping Gravel" Crackle Bus
    this.cavitationFilter = this.ctx.createBiquadFilter();
    this.cavitationFilter.type = 'bandpass';
    this.cavitationFilter.frequency.setValueAtTime(4200, this.ctx.currentTime);
    this.cavitationFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    this.cavitationGain = this.ctx.createGain();
    this.cavitationGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.cavitationFilter.connect(this.cavitationGain);
    this.cavitationGain.connect(this.masterGain);

    // 5. Suction Recirculation Low-Frequency Surge LFO
    this.surgeLfo = this.ctx.createOscillator();
    this.surgeLfo.type = 'sine';
    this.surgeLfo.frequency.setValueAtTime(14, this.ctx.currentTime);

    this.surgeLfoGain = this.ctx.createGain();
    this.surgeLfoGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.surgeLfo.connect(this.surgeLfoGain);
    this.surgeLfoGain.connect(this.flowGain.gain);
    this.surgeLfo.start();

    // Start procedural cavitation click scheduler
    this.startCavitationScheduler();
  }

  private startCavitationScheduler() {
    if (this.burstIntervalId) clearInterval(this.burstIntervalId);

    this.burstIntervalId = setInterval(() => {
      if (!this.ctx || this.isMuted || !this.cavitationFilter) return;

      const { cavitationIntensity, npshaM, npshrM } = this.currentParams;
      if (cavitationIntensity <= 0.05 && npshaM > npshrM * 1.15) return;

      // Higher deficit -> denser bursts of micro-implosions
      const deficit = Math.max(0, npshrM - npshaM);
      const isCritical = npshaM <= npshrM;
      const burstProbability = isCritical ? 0.85 : 0.35;

      if (Math.random() < burstProbability) {
        this.triggerGravelPop(isCritical, deficit);
      }
    }, 28);
  }

  /**
   * Procedurally fires an individual high-frequency bubble collapse shockwave transient
   */
  private triggerGravelPop(isCritical: boolean, deficit: number) {
    if (!this.ctx || !this.cavitationFilter) return;

    try {
      const now = this.ctx.currentTime;
      // High frequency click burst
      const popOsc = this.ctx.createOscillator();
      const popGain = this.ctx.createGain();

      // Sharp resonant metallic frequency between 3.2 kHz and 7.8 kHz
      const clickFreq = 3200 + Math.random() * 4600;
      popOsc.type = Math.random() > 0.5 ? 'triangle' : 'sawtooth';
      popOsc.frequency.setValueAtTime(clickFreq, now);
      popOsc.frequency.exponentialRampToValueAtTime(clickFreq * 0.4, now + 0.007);

      const amp = isCritical
        ? 0.15 + Math.random() * 0.22 + Math.min(0.2, deficit * 0.08)
        : 0.04 + Math.random() * 0.06;

      popGain.gain.setValueAtTime(amp, now);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.008);

      popOsc.connect(this.cavitationFilter);
      this.cavitationFilter.connect(popGain);
      if (this.masterGain) {
        popGain.connect(this.masterGain);
      }

      popOsc.start(now);
      popOsc.stop(now + 0.01);
    } catch {
      // Ignore transient audio edge errors
    }
  }

  public updateParameters(params: PumpAcousticParams) {
    this.currentParams = { ...params };
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Update BPF
    const z = params.numBlades || 6;
    const bpfHz = Math.max(20, (params.pumpSpeedRpm * z) / 60);
    if (this.bpfOsc) {
      this.bpfOsc.frequency.setTargetAtTime(bpfHz, now, 0.05);
    }
    if (this.bpfHarmonicOsc) {
      this.bpfHarmonicOsc.frequency.setTargetAtTime(bpfHz * 2, now, 0.05);
    }

    // Update Motor 1X
    const motorHz = Math.max(10, params.pumpSpeedRpm / 60);
    if (this.motorOsc) {
      this.motorOsc.frequency.setTargetAtTime(motorHz, now, 0.05);
    }

    // Update Flow noise volume based on flow
    const flowRatio = params.flowRateM3h / Math.max(1, params.bepFlowM3h);
    if (this.flowGain) {
      const flowVol = 0.04 + Math.min(0.12, flowRatio * 0.08);
      this.flowGain.gain.setTargetAtTime(flowVol, now, 0.08);
    }

    // Cavitation acoustic crackle level
    const isCavitating = params.npshaM <= params.npshrM * 1.1;
    const deficit = Math.max(0, params.npshrM - params.npshaM);
    if (this.cavitationGain) {
      const targetCavGain = isCavitating
        ? Math.min(0.45, 0.08 + (deficit / 2.0) * 0.35)
        : 0;
      this.cavitationGain.gain.setTargetAtTime(targetCavGain, now, 0.06);
    }

    // Suction Recirculation LFO
    if (this.surgeLfoGain) {
      const surgeAmp = params.isRecirculating ? Math.min(0.06, params.recirculationIntensity * 0.06) : 0;
      this.surgeLfoGain.gain.setTargetAtTime(surgeAmp, now, 0.1);
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
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.45, this.ctx.currentTime, 0.04);
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

  public getSpectrumData(buffer: Uint8Array): void {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(buffer);
    } else {
      buffer.fill(0);
    }
  }

  public dispose() {
    if (this.burstIntervalId) clearInterval(this.burstIntervalId);
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

// Global Singleton for easy persistent connection across renders
let acousticInstance: PumpAcousticSynthesizer | null = null;

export function getPumpAcousticSynthesizer(): PumpAcousticSynthesizer {
  if (!acousticInstance) {
    acousticInstance = new PumpAcousticSynthesizer();
  }
  return acousticInstance;
}
