// sudoku-sounds.js — Simple Web Audio API sound effects
const SudokuSounds = (() => {
  let ctx = null;
  let muted = localStorage.getItem('sudoku-muted') === 'true';

  function ensureCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  }

  function playTone(freq, duration, type, volume) {
    if (muted) return;
    ensureCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq || 440;
    gain.gain.setValueAtTime(volume || 0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (duration || 0.1));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + (duration || 0.1));
  }

  function playFill() { playTone(600, 0.08, 'sine', 0.12); }
  function playErase() { playTone(300, 0.06, 'sine', 0.1); }
  function playError() { playTone(150, 0.15, 'square', 0.08); }
  function playWin() {
    setTimeout(() => playTone(523, 0.12, 'sine', 0.12), 0);
    setTimeout(() => playTone(659, 0.12, 'sine', 0.12), 100);
    setTimeout(() => playTone(784, 0.12, 'sine', 0.12), 200);
    setTimeout(() => playTone(1047, 0.25, 'sine', 0.15), 300);
  }
  function playSelect() { playTone(800, 0.04, 'sine', 0.06); }

  function toggleMute() {
    muted = !muted;
    localStorage.setItem('sudoku-muted', String(muted));
    return muted;
  }
  function isMuted() { return muted; }

  return { playFill, playErase, playError, playWin, playSelect, toggleMute, isMuted };
})();
