// animaldoku-sounds.js — Web Audio API sound effects
(function() {
  'use strict';

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let ctx = null;
  let muted = false;

  function ensureCtx() {
    if (!ctx) ctx = new AudioCtx();
    return ctx;
  }

  function playTone(freq, duration, type, vol) {
    try {
      const c = ensureCtx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol || 0.12, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + duration);
    } catch (e) { /* Audio not supported */ }
  }

  function playPlace() {
    playTone(520, 0.1, 'sine', 0.15);
    setTimeout(() => playTone(780, 0.08, 'sine', 0.1), 60);
  }

  function playBlock() {
    playTone(220, 0.08, 'triangle', 0.1);
  }

  function playMistake() {
    playTone(180, 0.15, 'sawtooth', 0.12);
    setTimeout(() => playTone(140, 0.2, 'sawtooth', 0.1), 100);
  }

  function playWin() {
    [400, 500, 600, 800].forEach(function(f, i) {
      setTimeout(function() { playTone(f, 0.15, 'sine', 0.12); }, i * 100);
    });
  }

  function playGameOver() {
    playTone(300, 0.15, 'sine', 0.1);
    setTimeout(function() { playTone(200, 0.3, 'sine', 0.1); }, 150);
  }

  function playPause() {
    playTone(600, 0.06, 'square', 0.08);
    setTimeout(function() { playTone(500, 0.06, 'square', 0.06); }, 80);
  }

  function toggleMute() { muted = !muted; }
  function isMuted() { return muted; }

  window.AnimaldokuSounds = {
    playPlace, playBlock, playMistake, playWin, playGameOver, playPause,
    toggleMute, isMuted,
  };
})();