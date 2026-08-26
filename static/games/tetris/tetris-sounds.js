/* tetris-sounds.js - Sound effects using Web Audio API */

const sounds = {
  ctx: null,
  muted: false,

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  play(type) {
    if (this.muted) return;
    this.init();
    switch (type) {
      case 'move':
        this.tone(400, 0.04, 'sine', 0.08);
        break;
      case 'rotate':
        this.tone(600, 0.04, 'sine', 0.08);
        break;
      case 'drop':
        this.tone(200, 0.08, 'triangle', 0.12);
        break;
      case 'land':
        this.tone(120, 0.12, 'square', 0.04);
        break;
      case 'lineClear':
        this.tone(440, 0.1, 'sine', 0.15);
        setTimeout(() => this.tone(660, 0.1, 'sine', 0.15), 80);
        setTimeout(() => this.tone(880, 0.15, 'sine', 0.15), 160);
        break;
      case 'gameOver':
        this.tone(300, 0.2, 'sawtooth', 0.1);
        setTimeout(() => this.tone(200, 0.2, 'sawtooth', 0.1), 200);
        setTimeout(() => this.tone(100, 0.3, 'sawtooth', 0.1), 400);
        break;
    }
  },

  tone(freq, duration, type, volume) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  },

  setMuted(muted) {
    this.muted = muted;
  }
};
