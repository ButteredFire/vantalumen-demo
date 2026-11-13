/**
 * SpatialAudioEngine: Synthesizes cosmic ambient drone, cockpit boot sequence,
 * and warp transition frequency sweeps directly using the Web Audio API.
 * Modulates a Biquad low-pass filter according to Warp state and camera altitude.
 */
class SpatialAudioEngine {
  private static instance: SpatialAudioEngine;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  private isRunning = false;
  private isMuted = false;

  public static getInstance(): SpatialAudioEngine {
    if (!SpatialAudioEngine.instance) {
      SpatialAudioEngine.instance = new SpatialAudioEngine();
    }
    return SpatialAudioEngine.instance;
  }

  public initAndStart(): void {
    if (this.isRunning) {
      if (this.ctx?.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.isMuted ? 0 : 0.24;
    this.masterGain.connect(this.ctx.destination);

    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.value = 165;
    this.droneFilter.Q.value = 2.4;
    this.droneFilter.connect(this.masterGain);

    // Dual detuned sub-bass oscillators for deep-space binaural cosmic drone
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.value = 54.0; // A1 sub-bass
    osc2.frequency.value = 81.2; // E2 fifth harmonic

    const droneSubGain = this.ctx.createGain();
    droneSubGain.gain.value = 0.35;

    osc1.connect(droneSubGain);
    osc2.connect(droneSubGain);
    droneSubGain.connect(this.droneFilter);

    osc1.start();
    osc2.start();
    this.isRunning = true;

    this.playCockpitBoot();
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.24, this.ctx.currentTime, 0.15);
    }
  }

  public playCockpitBoot(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.18);
    osc.frequency.exponentialRampToValueAtTime(960, now + 0.45);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.8);
  }

  public playWarpTransition(durationSec = 3.4): void {
    if (!this.ctx || !this.masterGain || !this.droneFilter || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Modulate the ambient low-pass filter cutoff up and down during the warp trajectory
    this.droneFilter.frequency.cancelScheduledValues(now);
    this.droneFilter.frequency.setValueAtTime(165, now);
    this.droneFilter.frequency.exponentialRampToValueAtTime(920, now + durationSec * 0.42);
    this.droneFilter.frequency.exponentialRampToValueAtTime(175, now + durationSec);

    // Add a futuristic phase sweep tone
    const sweepOsc = this.ctx.createOscillator();
    const sweepGain = this.ctx.createGain();
    sweepOsc.type = 'sine';
    sweepOsc.frequency.setValueAtTime(95, now);
    sweepOsc.frequency.exponentialRampToValueAtTime(280, now + durationSec * 0.45);
    sweepOsc.frequency.exponentialRampToValueAtTime(72, now + durationSec);

    sweepGain.gain.setValueAtTime(0.001, now);
    sweepGain.gain.linearRampToValueAtTime(0.14, now + 0.4);
    sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    sweepOsc.connect(sweepGain);
    sweepGain.connect(this.masterGain);
    sweepOsc.start(now);
    sweepOsc.stop(now + durationSec + 0.05);
  }
}

export const spatialAudio = SpatialAudioEngine.getInstance();
