// Solaris Drift — Procedural Web Audio Synthesizer & Adaptive Music Engine

import { clamp, rand } from './math.js';

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.noiseBuf = null;
    this.engineGain = null;
    this.engineOsc = null;
    this.engineSub = null;
    this.engineFilter = null;
    this.musicTimer = 0;
    this.musicStep = 0;
    this.musicIntensity = 0; // 0 = menu/explore, 1 = combat, 2 = boss
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const sr = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, sr * 1.6, sr);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this._initEngineLoop();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  _initEngineLoop() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    sub.type = 'triangle';
    osc.frequency.value = 60;
    sub.frequency.value = 30;
    filter.type = 'lowpass';
    filter.frequency.value = 170;
    gain.gain.value = 0.0;
    osc.connect(filter);
    sub.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    sub.start();
    this.engineOsc = osc;
    this.engineSub = sub;
    this.engineFilter = filter;
    this.engineGain = gain;
  }

  update(dt, active, boostRatio, speedNorm, intensity = 0) {
    this.musicIntensity = intensity;
    if (!this.ctx || !this.engineGain) return;
    const now = this.ctx.currentTime;
    const targetGain = (!active || this.muted) ? 0.0 : (0.022 + boostRatio * 0.028);
    const freq = 56 + speedNorm * 24 + boostRatio * 52;
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.08);
    this.engineOsc.frequency.setTargetAtTime(freq, now, 0.08);
    this.engineSub.frequency.setTargetAtTime(freq * 0.5, now, 0.08);
    this.engineFilter.frequency.setTargetAtTime(150 + boostRatio * 440 + speedNorm * 120, now, 0.08);

    // Subtle adaptive procedural space soundtrack pulse during gameplay
    if (active && this._ready()) {
      const stepDur = intensity >= 2 ? 0.175 : intensity >= 1 ? 0.21 : 0.26;
      this.musicTimer += dt;
      if (this.musicTimer >= stepDur) {
        this.musicTimer -= stepDur;
        this._playMusicStep(this.musicStep++, intensity);
      }
    }
  }

  _playMusicStep(step, intensity) {
    // D minor pentatonic / Dorian cosmic progression (D2, F2, G2, A2, C3, D3)
    const bassProg = [73.42, 73.42, 65.41, 87.31];
    const bar = Math.floor(step / 16) % bassProg.length;
    const root = bassProg[bar];
    const subStep = step % 16;

    // Warm rhythmic bass pulse
    if (subStep % 2 === 0 || (intensity >= 2 && subStep % 2 === 1)) {
      const accent = (subStep % 4 === 0) ? 1.0 : 0.55;
      const mult = (subStep === 14 && intensity >= 1) ? 1.5 : 1.0;
      this._musicNote('triangle', root * mult, 0.14, 0.024 * accent, 240 + intensity * 140);
    }

    // Cosmic arpeggio shimmer on exploration & combat
    const arpScale = [293.66, 349.23, 440.0, 523.25, 587.33, 440.0, 392.0, 329.63];
    if (subStep % 4 === 0 || (intensity >= 1 && subStep % 2 === 0)) {
      const note = arpScale[(step + bar * 2) % arpScale.length];
      this._musicNote('sine', note, 0.24, intensity >= 2 ? 0.017 : 0.012, 1600);
    }

    // Boss tension pulse
    if (intensity >= 2 && (subStep === 0 || subStep === 6 || subStep === 12)) {
      this._musicNote('sawtooth', root * 2, 0.11, 0.016, 480);
    }
  }

  _musicNote(type, freq, dur, vol, cutoff) {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, now);
    gain.gain.setValueAtTime(0.0005, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + dur);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  setMuted(m) {
    this.muted = !!m;
    if (this.muted && this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.04);
    }
    return this.muted;
  }

  toggleMute() {
    return this.setMuted(!this.muted);
  }

  _ready() {
    return this.ctx && !this.muted && this.ctx.state === 'running';
  }

  _tone(type, f0, f1, dur, vol, delay = 0) {
    if (!this._ready()) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.015);
  }

  laser(triple = false, heavy = false) {
    const base = heavy ? 620 : triple ? 980 : 860;
    this._tone(triple || heavy ? 'sawtooth' : 'triangle', base + rand(-45, 45), heavy ? 130 : 190, heavy ? 0.12 : 0.09, triple ? 0.062 : 0.05);
  }

  missile() {
    if (!this._ready() || !this.noiseBuf) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(600, now);
    bp.frequency.exponentialRampToValueAtTime(2200, now + 0.25);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.075, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    src.connect(bp); bp.connect(g); g.connect(this.ctx.destination);
    src.start(now); src.stop(now + 0.3);
    this._tone('sawtooth', 320, 920, 0.22, 0.045);
  }

  enemyShot() { this._tone('square', 340, 120, 0.14, 0.03); }
  sniperCharge() { this._tone('sine', 420, 1480, 0.45, 0.04); }
  sniperFire() { this._tone('sawtooth', 1420, 140, 0.22, 0.085); }
  hit() { this._tone('sine', 520 + rand(-40, 40), 180, 0.05, 0.048); }
  shieldBlock() { this._tone('triangle', 980, 1420, 0.09, 0.055); }
  graze() { this._tone('sine', 1180, 1640, 0.08, 0.045); }
  uiClick() { this._tone('sine', 740, 500, 0.04, 0.042); }
  scanTick(progress) { this._tone('sine', 640 + progress * 560, 700 + progress * 600, 0.07, 0.038); }
  scanComplete() { [587.33, 739.99, 880, 1174.66].forEach((f, i) => this._tone('triangle', f, f, 0.24, 0.07, i * 0.055)); }

  hyperspace() {
    this._tone('sine', 90, 880, 0.75, 0.08);
    this._tone('triangle', 180, 1320, 0.75, 0.05, 0.06);
  }

  ring(combo) {
    const pitchShift = Math.pow(1.06, Math.min(combo - 1, 10));
    [523.25, 659.25, 783.99].forEach((f, i) => this._tone('triangle', f * pitchShift, f * pitchShift, 0.22, 0.072, i * 0.045));
  }

  powerup() {
    [440, 554.37, 659.25, 880].forEach((f, i) => this._tone('sine', f, f, 0.25, 0.078, i * 0.05));
  }

  barrelRoll() {
    if (!this._ready() || !this.noiseBuf) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 3.0;
    bp.frequency.setValueAtTime(280, now);
    bp.frequency.exponentialRampToValueAtTime(1600, now + 0.18);
    bp.frequency.exponentialRampToValueAtTime(320, now + 0.42);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
    src.connect(bp); bp.connect(gain); gain.connect(this.ctx.destination);
    src.start(now); src.stop(now + 0.45);
  }

  explosion(scale = 1) {
    if (!this._ready() || !this.noiseBuf) return;
    const now = this.ctx.currentTime;
    const dur = clamp(0.30 * scale, 0.22, 0.9);
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(920 / Math.sqrt(scale), now);
    filter.frequency.exponentialRampToValueAtTime(65, now + dur);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(Math.min(0.22, 0.12 * scale), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
    src.start(now); src.stop(now + dur + 0.02);
    this._tone('sine', 115, 26, dur * 0.85, Math.min(0.22, 0.13 * scale));
  }

  damage() {
    this.explosion(1.15);
    this._tone('sawtooth', 185, 84, 0.28, 0.105);
  }

  bossWarning() {
    for (let i = 0; i < 3; i++) {
      this._tone('sawtooth', 220, 155, 0.24, 0.072, i * 0.34);
    }
  }
}
