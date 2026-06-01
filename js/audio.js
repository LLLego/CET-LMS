/**
 * Procedural sound effects using Web Audio API
 * CET LMS — No audio files needed, all sounds generated at runtime
 */

const Audio = {
  ctx: null,
  _muted: false,
  _volume: 0.3,

  /**
   * Initialize AudioContext on first user gesture
   */
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not available:', e);
    }
    try { this._muted = localStorage.getItem('audioMuted') === '1'; } catch(e) {}
  },

  /**
   * Ensure context is running (browser autoplay policy)
   * Returns a promise that resolves to true/false, or false synchronously if no ctx
   */
  _ensure() {
    this.init();
    if (!this.ctx) return false;
    if (this._muted) return false;
    if (this.ctx.state === 'suspended') {
      return this.ctx.resume().then(() => true).catch(() => false);
    }
    return true;
  },

  /**
   * Play a single tone
   */
  _tone(freq, duration = 0.2, type = 'sine', vol = 0.3, attack = 0.02, release = 0.1) {
    const result = this._ensure();
    if (!result) return;
    // If _ensure() returned a promise (resume needed), chain the tone after it
    if (result && typeof result.then === 'function') {
      result.then(ok => { if (ok) this._tone(freq, duration, type, vol, attack, release); });
      return;
    }
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol * this._volume * 3, now + attack);
    gain.gain.setValueAtTime(vol * this._volume * 3, now + duration - release);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  },

  /**
   * Play multiple tones simultaneously (chord)
   */
  _chord(freqs, duration = 0.4, type = 'sine', vol = 0.2) {
    freqs.forEach(f => this._tone(f, duration, type, vol / freqs.length));
  },

  /**
   * Correct answer: Rising C major chord — C4, E4, G4
   */
  playCorrect() {
    this._chord([261.63, 329.63, 392.00], 0.5, 'sine', 0.3);
  },

  /**
   * Wrong answer: Soft minor descending — E4, C4
   */
  playIncorrect() {
    setTimeout(() => this._tone(329.63, 0.3, 'triangle', 0.2), 0);
    setTimeout(() => this._tone(261.63, 0.3, 'triangle', 0.15), 150);
  },

  /**
   * Card flip: Quick filtered noise sweep
   */
  playFlip() {
    const result = this._ensure();
    if (!result) return;
    if (result && typeof result.then === 'function') {
      result.then(ok => { if (ok) this.playFlip(); });
      return;
    }
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.08);
    filter.Q.value = 2;

    gain.gain.setValueAtTime(0.1 * this._volume * 3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter).connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  },

  /**
   * Timer complete: Ascending arpeggio — C5 → E5 → G5 → C6
   */
  playTimerComplete() {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      setTimeout(() => this._tone(freq, 0.3, 'sine', 0.25), i * 150);
    });
  },

/**
 * Button click: Softer, more pleasant tick
 */
playClick() {
  const result = this._ensure();
  if (!result) return;
  if (result && typeof result.then === 'function') {
    result.then(ok => { if (ok) this.playClick(); });
    return;
  }
  const now = this.ctx.currentTime;
  const osc = this.ctx.createOscillator();
  const gain = this.ctx.createGain();
  const filter = this.ctx.createBiquadFilter();
  
  // Softer sine wave instead of harsh square wave
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.06);
  
  // Filter for warmth
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1200, now);
  
  // Gentler envelope
  gain.gain.setValueAtTime(0.03 * this._volume * 3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  
  osc.connect(filter).connect(gain).connect(this.ctx.destination);
  osc.start(now);
  osc.stop(now + 0.06);
},

  /**
   * Page transition: Soft ambient whoosh
   */
  playTransition() {
    const result = this._ensure();
    if (!result) return;
    if (result && typeof result.then === 'function') {
      result.then(ok => { if (ok) this.playTransition(); });
      return;
    }
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'sine';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.2);
    gain.gain.setValueAtTime(0.08 * this._volume * 3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(filter).connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  },

  /**
   * Toggle mute
   */
  toggleMute() {
    this._muted = !this._muted;
    try { localStorage.setItem('audioMuted', this._muted ? '1' : ''); } catch(e) {}
    return this._muted;
  },

  /**
   * Check if muted
   */
  isMuted() {
    return this._muted;
  },

  /**
   * Set volume (0.0 - 1.0)
   */
  setVolume(v) {
    this._volume = Math.max(0, Math.min(1, v));
  },

  /**
   * Get current volume
   */
  getVolume() {
    return this._volume;
  },
};

export default Audio;