// Web Audio API Synthesizer & Metronome for virtual/audio feedback
class PianoSynth {
  constructor() {
    this.audioCtx = null;
    this.activeVoices = new Map();
    this.masterGain = null;
    this.volume = 0.3;
    this.enabled = true;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
        this.masterGain.connect(this.audioCtx.destination);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.enabled ? this.volume : 0, this.audioCtx.currentTime);
    }
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.enabled ? this.volume : 0, this.audioCtx.currentTime);
    }
  }

  // Convert MIDI note number to frequency in Hz (A4 = 440Hz = MIDI 69)
  midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Play a note (velocity: 0.0 - 1.0)
  noteOn(midi, velocity = 0.8) {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;

    // Stop any existing voice on same MIDI
    this.noteOff(midi);

    const now = this.audioCtx.currentTime;
    const freq = this.midiToFreq(midi);

    // Primary oscillator (triangle for soft piano body)
    const osc1 = this.audioCtx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);

    // Secondary oscillator (sine for fundamental clarity)
    const osc2 = this.audioCtx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq, now);

    // Voice gain envelope (Attack - Decay)
    const voiceGain = this.audioCtx.createGain();
    const velFactor = Math.max(0.1, velocity);
    voiceGain.gain.setValueAtTime(0, now);
    // Instant attack
    voiceGain.gain.linearRampToValueAtTime(velFactor * 0.4, now + 0.008);
    // Gentle natural piano decay
    voiceGain.gain.exponentialRampToValueAtTime(velFactor * 0.15, now + 0.6);

    // Filter for acoustic warm damping
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(freq * 4, 8000), now);

    osc1.connect(voiceGain);
    osc2.connect(voiceGain);
    voiceGain.connect(filter);
    filter.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);

    this.activeVoices.set(midi, { osc1, osc2, voiceGain, startTime: now });
  }

  // Release a note
  noteOff(midi) {
    if (!this.activeVoices.has(midi) || !this.audioCtx) return;

    const { osc1, osc2, voiceGain } = this.activeVoices.get(midi);
    const now = this.audioCtx.currentTime;

    // Smooth release to avoid clicking
    voiceGain.gain.cancelScheduledValues(now);
    voiceGain.gain.setValueAtTime(voiceGain.gain.value, now);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    setTimeout(() => {
      try {
        osc1.stop();
        osc2.stop();
        osc1.disconnect();
        osc2.disconnect();
        voiceGain.disconnect();
      } catch (e) {
        // Voice might already be stopped
      }
    }, 180);

    this.activeVoices.delete(midi);
  }

  // Metronome tick sound (clean wooden click)
  playMetronomeClick(isDownbeat = false) {
    this.init();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    // Higher pitch for first beat / downbeat
    osc.frequency.setValueAtTime(isDownbeat ? 1200 : 800, now);

    gain.gain.setValueAtTime(isDownbeat ? 0.35 : 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  // Cut all active voices
  stopAll() {
    for (const midi of this.activeVoices.keys()) {
      this.noteOff(midi);
    }
  }
}

export const synth = new PianoSynth();
