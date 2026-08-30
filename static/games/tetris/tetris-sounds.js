// tetris-sounds.js - Simple Web Audio API sound effects
const TetrisSounds = (() => {
  let ctx = null;
  let muted = localStorage.getItem('tetris-muted') === 'true';

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

  function playMove() { playTone(200, 0.04, 'sine', 0.08); }
  function playRotate() { playTone(400, 0.06, 'sine', 0.1); }
  function playDrop() { playTone(150, 0.1, 'sine', 0.12); }
  function playSoftDrop() { playTone(500, 0.03, 'sine', 0.06); }
  function playHardDrop() { playTone(300, 0.08, 'square', 0.08); }

  function playLineClear(lines) {
    const baseFreq = 523;
    for (let i = 0; i < lines; i++) {
      setTimeout(() => {
        playTone(baseFreq * Math.pow(1.25, i), 0.12, 'sine', 0.12);
      }, i * 80);
    }
    // Extra flourish for 4 lines (tetris!)
    if (lines === 4) {
      setTimeout(() => playTone(1047, 0.2, 'sine', 0.15), lines * 80);
    }
  }

  function playGameOver() {
    playTone(400, 0.15, 'sine', 0.1);
    setTimeout(() => playTone(300, 0.15, 'sine', 0.1), 150);
    setTimeout(() => playTone(200, 0.3, 'sine', 0.12), 300);
  }

  function playPause() { playTone(600, 0.05, 'sine', 0.08); }

  function toggleMute() {
    muted = !muted;
    localStorage.setItem('tetris-muted', String(muted));
    return muted;
  }

  function isMuted() { return muted; }

  return {
    playMove, playRotate, playDrop, playSoftDrop, playHardDrop,
    playLineClear, playGameOver, playPause,
    toggleMute, isMuted,
  };
})();