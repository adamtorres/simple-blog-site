// tetris-ui.js - DOM manipulation, rendering, events, overlays
(function() {
  'use strict';

  const canvas = document.getElementById('tetris-grid');
  const ctx = canvas.getContext('2d');
  const previewCanvas = document.getElementById('next-piece-preview');
  const previewCtx = previewCanvas.getContext('2d');
  const scoreDisplay = document.getElementById('score-display');
  const levelDisplay = document.getElementById('level-display');
  const linesDisplay = document.getElementById('lines-display');
  const timerDisplay = document.getElementById('timer-display');
  const muteBtn = document.getElementById('mute-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const startOverlay = document.getElementById('start-overlay');
  const pauseOverlay = document.getElementById('pause-overlay');
  const gameOverOverlay = document.getElementById('game-over-overlay');
  const quitOverlay = document.getElementById('quit-overlay');
  const gameStats = document.getElementById('game-stats');
  const gameContainer = document.querySelector('.game-container');
  const mobileLeft = document.getElementById('mobile-left');
  const mobileRight = document.getElementById('mobile-right');
  const mobileRotate = document.getElementById('mobile-rotate');
  const mobileSoftDrop = document.getElementById('mobile-soft-drop');
  const mobileHardDrop = document.getElementById('mobile-hard-drop');
  const mobilePause = document.getElementById('mobile-pause');
  const mobileMute = document.getElementById('mobile-mute');

  const CELL_SIZE = TetrisCore.CELL_SIZE;
  const COLS = TetrisCore.COLS;
  const ROWS = TetrisCore.ROWS;
  const GRID_WIDTH = COLS * CELL_SIZE;
  const GRID_HEIGHT = ROWS * CELL_SIZE;
  const PREVIEW_SIZE = 80;
  canvas.width = GRID_WIDTH;
  canvas.height = GRID_HEIGHT;
  previewCanvas.width = PREVIEW_SIZE;
  previewCanvas.height = PREVIEW_SIZE;

  let animationFrameId = null;
  let hardDropAnimating = false;
  let hardDropFrame = 0;
  let gameOverTriggered = false;

  function formatTime(seconds) {
    return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  }

  function getColorForIndex(idx) {
    return TetrisCore.PIECE_COLORS[(idx - 1) % TetrisCore.PIECE_COLORS.length] || '#fff';
  }

  function hideAllOverlays() {
    [startOverlay, pauseOverlay, gameOverOverlay, quitOverlay].forEach(function(o) {
      o.classList.remove('active');
    });
  }
  function showOverlay(el) { hideAllOverlays(); el.classList.add('active'); }

  function drawCell(context, x, y, color, alpha) {
    const p = 1;
    context.globalAlpha = alpha || 1;
    context.fillStyle = color;
    context.fillRect(x + p, y + p, CELL_SIZE - 2, CELL_SIZE - 2);
    context.fillStyle = 'rgba(255,255,255,0.15)';
    context.fillRect(x + p, y + p, CELL_SIZE - 2, 3);
    context.fillRect(x + p, y + p, 3, CELL_SIZE - 2);
    context.fillStyle = 'rgba(0,0,0,0.2)';
    context.fillRect(x + p, y + CELL_SIZE - p - 3, CELL_SIZE - 2, 3);
    context.fillRect(x + CELL_SIZE - p - 3, y + p, 3, CELL_SIZE - 2);
    context.globalAlpha = 1;
  }

  function drawGridBackground() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, GRID_WIDTH, GRID_HEIGHT);
    ctx.strokeStyle = '#1a1a3e';
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * CELL_SIZE); ctx.lineTo(GRID_WIDTH, r * CELL_SIZE); ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * CELL_SIZE, 0); ctx.lineTo(c * CELL_SIZE, GRID_HEIGHT); ctx.stroke();
    }
  }

  function drawFrozenCells() {
    const grid = TetrisCore.getGrid();
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (grid[r][c] !== 0) drawCell(ctx, c * CELL_SIZE, r * CELL_SIZE, getColorForIndex(grid[r][c]), 1);
    }
  }

  function drawCurrentPiece() {
    const piece = TetrisCore.getCurrentPiece();
    if (!piece) return;
    const color = getColorForIndex(piece.color);
    for (let r = 0; r < piece.shape.length; r++) for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c] !== 0) drawCell(ctx, (piece.col + c) * CELL_SIZE, (piece.row + r) * CELL_SIZE, color, 1);
    }
  }

  function drawGhostPiece() {
    const piece = TetrisCore.getCurrentPiece();
    if (!piece) return;
    const ghostRow = TetrisCore.getGhostRow();
    if (ghostRow === piece.row) return;
    const color = getColorForIndex(piece.color);
    for (let r = 0; r < piece.shape.length; r++) for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c] !== 0) drawCell(ctx, (piece.col + c) * CELL_SIZE, (ghostRow + r) * CELL_SIZE, color, 0.2);
    }
  }

  function renderPreview() {
    const piece = TetrisCore.getNextPiece();
    previewCtx.fillStyle = '#0a0a1a';
    previewCtx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
    if (!piece) return;
    const shape = piece.shape;
    const rows = shape.length, cols = shape[0].length;
    const ps = 16, ox = Math.floor((PREVIEW_SIZE - cols * ps) / 2), oy = Math.floor((PREVIEW_SIZE - rows * ps) / 2);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (shape[r][c] !== 0) {
        previewCtx.fillStyle = getColorForIndex(piece.color);
        previewCtx.fillRect(ox + c * ps + 1, oy + r * ps + 1, ps - 2, ps - 2);
      }
    }
  }

  function updateDisplay() {
    scoreDisplay.textContent = 'Score: ' + TetrisCore.getScore();
    levelDisplay.textContent = TetrisCore.getLevel();
    linesDisplay.textContent = TetrisCore.getLinesCleared();
    timerDisplay.textContent = formatTime(TetrisCore.getGameTimer());
  }

  function render() {
    drawGridBackground(); drawFrozenCells(); drawGhostPiece(); drawCurrentPiece();
  }

  function gameLoop() {
    render(); renderPreview(); updateDisplay();
    if (TetrisCore.getGameOver() && !gameOverTriggered) { handleGameOver(); return; }
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function animateHardDrop() {
    hardDropAnimating = true;
    hardDropFrame = 0;
    const piece = TetrisCore.getCurrentPiece();
    if (!piece) { hardDropAnimating = false; return; }
    const targetRow = TetrisCore.getGhostRow();
    const startRow = piece.row;
    const totalDistance = targetRow - startRow;

    function step() {
      if (!hardDropAnimating) return;
      hardDropFrame++;
      const progress = hardDropFrame / 8;
      piece.row = Math.min(targetRow, startRow + Math.floor(progress * totalDistance));
      render();
      if (piece.row < targetRow) {
        requestAnimationFrame(step);
      } else {
        hardDropAnimating = false;
        TetrisCore.freezePiece();
        const lines = TetrisCore.clearLines();
        if (lines > 0) TetrisSounds.playLineClear(lines);
        TetrisCore.updateScore(lines);
        TetrisCore.spawnPiece();
        TetrisCore.restartDropLoop();
      }
    }
    requestAnimationFrame(step);
  }

  function handleKeyDown(e) {
    if (!TetrisCore.getGameRunning()) return;
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        TetrisCore.movePiece(-1, 0);
        TetrisSounds.playMove();
        break;
      case 'ArrowRight':
        e.preventDefault();
        TetrisCore.movePiece(1, 0);
        TetrisSounds.playMove();
        break;
      case 'ArrowUp':
        e.preventDefault();
        TetrisCore.tryRotate();
        TetrisSounds.playRotate();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (TetrisCore.softDrop()) {
          TetrisSounds.playSoftDrop();
          TetrisCore.restartDropLoop();
        }
        break;
      case ' ':
        e.preventDefault();
        if (!hardDropAnimating) {
          TetrisSounds.playHardDrop();
          animateHardDrop();
        }
        break;
      case 'p': case 'P':
        e.preventDefault();
        handlePause();
        break;
      case 'm': case 'M':
        e.preventDefault();
        handleMute();
        break;
    }
  }

  function handlePause() {
    const isPaused = TetrisCore.togglePause();
    if (isPaused) {
      gameContainer.classList.add('paused');
      showOverlay(pauseOverlay);
      TetrisSounds.playPause();
    } else {
      gameContainer.classList.remove('paused');
      hideAllOverlays();
      TetrisSounds.playPause();
    }
  }

  function handleMute() {
    TetrisSounds.toggleMute();
    updateMuteButton();
  }

  function updateMuteButton() {
    const muted = TetrisSounds.isMuted();
    muteBtn.textContent = muted ? String.fromCharCode(0x1F507) : String.fromCharCode(0x1F50A);
    if (mobileMute) mobileMute.textContent = muted ? String.fromCharCode(0x1F507) : String.fromCharCode(0x1F50A);
  }

  function handleGameOver() {
    gameOverTriggered = true;
    TetrisCore.stopGameLoop();
    TetrisSounds.playGameOver();
    gameStats.innerHTML = 'Score: ' + TetrisCore.getScore() +
      '<br>Level: ' + TetrisCore.getLevel() + '<br>Lines: ' + TetrisCore.getLinesCleared();
    showOverlay(gameOverOverlay);
  }

  function startNewGame(mode) {
    gameOverTriggered = false;
    hideAllOverlays();
    gameContainer.classList.remove('paused');
    TetrisCore.resetGame(mode);
    if (!animationFrameId) { gameLoop(); }
    TetrisCore.startGameLoop();
  }

  function quitToGameList() {
    TetrisCore.stopGameLoop();
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
    if (window.parent && window.parent !== window) {
      window.parent.location.href = '/games/';
    } else {
      window.location.href = '/games/';
    }
  }

  function setupMobileControls() {
    function addTouch(el, action) {
      if (!el) return;
      el.addEventListener('touchstart', function(e) { e.preventDefault(); action(); });
    }
    addTouch(mobileLeft, function() { if (TetrisCore.getGameRunning()) { TetrisCore.movePiece(-1, 0); TetrisSounds.playMove(); } });
    addTouch(mobileRight, function() { if (TetrisCore.getGameRunning()) { TetrisCore.movePiece(1, 0); TetrisSounds.playMove(); } });
    addTouch(mobileRotate, function() { if (TetrisCore.getGameRunning()) { TetrisCore.tryRotate(); TetrisSounds.playRotate(); } });
    addTouch(mobileSoftDrop, function() { if (TetrisCore.getGameRunning()) { TetrisCore.softDrop(); TetrisSounds.playSoftDrop(); } });
    addTouch(mobileHardDrop, function() { if (TetrisCore.getGameRunning() && !hardDropAnimating) { TetrisSounds.playHardDrop(); animateHardDrop(); } });
    if (mobilePause) mobilePause.addEventListener('click', function() { if (TetrisCore.getGameRunning()) handlePause(); });
    if (mobileMute) mobileMute.addEventListener('click', function() { handleMute(); });
  }

  function setupOverlayButtons() {
    const timedBtn = document.getElementById('new-timed-btn');
    const classicBtn = document.getElementById('new-classic-btn');
    if (timedBtn) timedBtn.addEventListener('click', function() { startNewGame('timed'); });
    if (classicBtn) classicBtn.addEventListener('click', function() { startNewGame('classic'); });
    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) resumeBtn.addEventListener('click', function() { handlePause(); });
    const playAgainBtn = document.getElementById('play-again-btn');
    const quitBtn = document.getElementById('quit-btn');
    if (playAgainBtn) playAgainBtn.addEventListener('click', function() { startNewGame(TetrisCore.getGameMode()); });
    if (quitBtn) quitBtn.addEventListener('click', function() { quitToGameList(); });
    const playAgain2Btn = document.getElementById('play-again-btn-2');
    if (playAgain2Btn) playAgain2Btn.addEventListener('click', function() { startNewGame(TetrisCore.getGameMode()); });
    if (muteBtn) muteBtn.addEventListener('click', function() { handleMute(); });
    if (pauseBtn) pauseBtn.addEventListener('click', function() { if (TetrisCore.getGameRunning()) handlePause(); });
  }

  function init() {
    updateMuteButton();
    showOverlay(startOverlay);
    document.addEventListener('keydown', handleKeyDown);
    setupOverlayButtons();
    setupMobileControls();
    render();
    renderPreview();
    updateDisplay();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();