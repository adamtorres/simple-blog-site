/* tetris-ui.js - Rendering, input, game loop, and UI controls */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');

const CELL_SIZE = 30;
const CANVAS_W = COLS * CELL_SIZE;
const CANVAS_H = ROWS * CELL_SIZE;

let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let softDropTimer = null;

// ---- Cell drawing helper ----
function drawCell(context, x, y, color, size) {
  const s = size || CELL_SIZE;
  context.fillStyle = color;
  context.fillRect(x * s + 1, y * s + 1, s - 2, s - 2);
  context.fillStyle = 'rgba(255,255,255,0.28)';
  context.fillRect(x * s + 2, y * s + 2, s - 6, 3);
  context.fillStyle = 'rgba(0,0,0,0.18)';
  context.fillRect(x * s + 2, y * s + s - 4, s - 4, 3);
}

// ---- Draw ghost piece ----
function drawGhostPiece() {
  if (!currentPiece) return;
  let ghostY = currentPiece.y;
  while (canPlace(currentPiece.type, currentPiece.rotation, currentPiece.x, ghostY + 1)) {
    ghostY++;
  }
  if (ghostY === currentPiece.y) return;
  const cells = PIECES[currentPiece.type].rotations[currentPiece.rotation];
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = currentPiece.color;
  ctx.lineWidth = 2;
  for (const [cx, cy] of cells) {
    const px = (cx + currentPiece.x) * CELL_SIZE;
    const py = (cy + ghostY) * CELL_SIZE;
    ctx.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
  }
  ctx.globalAlpha = 1;
}

// ---- Draw next piece preview ----
function drawNextPiece() {
  nextCtx.fillStyle = '#111';
  nextCtx.fillRect(0, 0, 120, 120);
  if (!nextPiece) return;
  const cells = PIECES[nextPiece.type].rotations[nextPiece.rotation];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [cx, cy] of cells) {
    minX = Math.min(minX, cx);
    maxX = Math.max(maxX, cx);
    minY = Math.min(minY, cy);
    maxY = Math.max(maxY, cy);
  }
  const pieceW = maxX - minX + 1;
  const pieceH = maxY - minY + 1;
  const previewSize = 24;
  const ox = (120 - pieceW * previewSize) / 2;
  const oy = (120 - pieceH * previewSize) / 2;
  for (const [cx, cy] of cells) {
    drawCell(nextCtx, cx - minX, cy - minY, nextPiece.color, previewSize);
  }
}

// ---- Main render ----
function render() {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL_SIZE, 0);
    ctx.lineTo(x * CELL_SIZE, CANVAS_H);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL_SIZE);
    ctx.lineTo(CANVAS_W, y * CELL_SIZE);
    ctx.stroke();
  }
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x]) {
        drawCell(ctx, x, y, grid[y][x]);
      }
    }
  }
  drawGhostPiece();
  if (currentPiece) {
    const cells = PIECES[currentPiece.type].rotations[currentPiece.rotation];
    for (const [cx, cy] of cells) {
      const nx = cx + currentPiece.x;
      const ny = cy + currentPiece.y;
      if (ny >= 0) {
        drawCell(ctx, nx, ny, currentPiece.color);
      }
    }
  }
  drawNextPiece();
}

// ---- Game loop ----
function gameLoop(timestamp) {
  if (!gameRunning || gameOver) return;
  if (!paused && !isHardDropping && !softDropping) {
    if (!lastDropTime) lastDropTime = timestamp;
    const elapsed = timestamp - lastDropTime;
    if (elapsed >= CONFIG.DROP_INTERVAL) {
      if (!movePiece(0, 1)) {
        lockPiece();
      }
      lastDropTime = timestamp;
    }
  }
  render();
  updateScore();
  requestAnimationFrame(gameLoop);
}


// ---- Keyboard input ----
document.addEventListener('keydown', (e) => {
  if (gameOver && !gameRunning) return;

  const gameOverOverlay = document.getElementById('game-over-overlay');
  if (gameOverOverlay.classList.contains('active')) {
    if (e.key === 'Enter' || e.key === 'n' || e.key === 'N') {
      handleNewGame();
    }
    return;
  }

  const quitOverlay = document.getElementById('quit-overlay');
  if (quitOverlay.classList.contains('active')) {
    if (e.key === 'Enter') {
      handleResume();
    }
    return;
  }

  if (e.key === 'm' || e.key === 'M') {
    e.preventDefault();
    handleMuteToggle();
    return;
  }

  if (paused || !gameRunning) return;

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      if (!isHardDropping) { movePiece(-1, 0); sounds.play('move'); }
      break;
    case 'ArrowRight':
      e.preventDefault();
      if (!isHardDropping) { movePiece(1, 0); sounds.play('move'); }
      break;
    case 'ArrowDown':
      e.preventDefault();
      if (!isHardDropping && !softDropping) {
        softDropping = true;
        movePiece(0, 1);
        sounds.play('move');
      }
      break;
    case 'ArrowUp':
      e.preventDefault();
      if (!isHardDropping) {
        if (rotatePiece()) sounds.play('rotate');
      }
      break;
    case ' ':
      e.preventDefault();
      handleHardDrop();
      break;
    case 'p':
    case 'P':
      e.preventDefault();
      togglePause();
      document.getElementById('pause-overlay').classList.toggle('active', paused);
      document.getElementById('pause-btn').textContent = paused ? 'Resume' : 'Pause';
      break;
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowDown') {
    softDropping = false;
  }
});

// ---- Touch swipe on canvas ----
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
  touchStartTime = Date.now();
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
  if (gameOver || paused || isHardDropping || softDropping) return;
  e.preventDefault();
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  const dt = Date.now() - touchStartTime;
  const absDx = Math.abs(dx), absDy = Math.abs(dy);
  const threshold = 30;
  if (Math.max(absDx, absDy) < threshold) return;

  if (absDx > absDy) {
    movePiece(dx > 0 ? 1 : -1, 0);
    sounds.play('move');
  } else if (dy > 0) {
    if (dt < 200) { handleHardDrop(); }
    else { movePiece(0, 1); sounds.play('move'); }
  } else {
    if (rotatePiece()) sounds.play('rotate');
  }
}, { passive: false });

// ---- Mobile on-screen buttons ----
function startSoftDrop() {
  if (softDropTimer || isHardDropping || gameOver || paused) return;
  movePiece(0, 1);
  sounds.play('move');
  softDropTimer = setInterval(() => {
    if (!movePiece(0, 1)) {
      clearInterval(softDropTimer);
      softDropTimer = null;
    }
  }, 50);
}

function stopSoftDrop() {
  if (softDropTimer) {
    clearInterval(softDropTimer);
    softDropTimer = null;
  }
}

function setupMobileButtons() {
  const holdBtns = ['btn-down'];
  const clickBtns = ['btn-left', 'btn-right', 'btn-rotate', 'btn-drop'];
  const holdActions = {
    'btn-down': () => { startSoftDrop(); },
    'btn-down-end': () => { stopSoftDrop(); },
  };
  const clickActions = {
    'btn-left': () => { if (!isHardDropping && !softDropping) { movePiece(-1, 0); sounds.play('move'); } },
    'btn-right': () => { if (!isHardDropping && !softDropping) { movePiece(1, 0); sounds.play('move'); } },
    'btn-rotate': () => { if (!isHardDropping && !softDropping) { if (rotatePiece()) sounds.play('rotate'); } },
    'btn-drop': () => { handleHardDrop(); },
  };

  for (const id of holdBtns) {
    const btn = document.getElementById(id);
    if (!btn) continue;
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); holdActions[id](); });
    btn.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); holdActions[id + '-end'](); });
    btn.addEventListener('touchcancel', (e) => { holdActions[id + '-end'](); });
    btn.addEventListener('mousedown', (e) => { e.preventDefault(); holdActions[id](); });
    btn.addEventListener('mouseup', (e) => { e.preventDefault(); holdActions[id + '-end'](); });
    btn.addEventListener('mouseleave', (e) => { holdActions[id + '-end'](); });
  }
  for (const id of clickBtns) {
    const btn = document.getElementById(id);
    if (!btn) continue;
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); clickActions[id](); });
    btn.addEventListener('mousedown', (e) => { e.preventDefault(); clickActions[id](); });
  }
}

function handleHardDrop() {
  if (isHardDropping || gameOver || paused) return;
  isHardDropping = true;
  hardDrop();
  sounds.play('drop');
  setTimeout(() => {
    isHardDropping = false;
    lockPiece();
    sounds.play('land');
  }, 80);
}

function handleNewGame() {
  document.getElementById('game-over-overlay').classList.remove('active');
  document.getElementById('quit-overlay').classList.remove('active');
  document.getElementById('pause-overlay').classList.remove('active');
  startGame();
  lastDropTime = 0;
  requestAnimationFrame(gameLoop);
}

function handleQuit() {
  document.getElementById('game-over-overlay').classList.remove('active');
  document.getElementById('quit-overlay').classList.add('active');
  gameRunning = false;
}

function handleResume() {
  document.getElementById('quit-overlay').classList.remove('active');
  startGame();
  lastDropTime = 0;
  requestAnimationFrame(gameLoop);
}

function handleMuteToggle() {
  const muted = sounds.toggleMute();
  const muteBtn = document.getElementById('mute-btn');
  muteBtn.textContent = muted ? '&#128263;' : '&#128266;';
  muteBtn.classList.toggle('muted', muted);
}

function updateScore() {
  const s = String(score);
  document.getElementById('score').textContent = s;
  document.getElementById('score-panel').textContent = s;
}

window.togglePause = function() {
  togglePause();
  const overlay = document.getElementById('pause-overlay');
  const btn = document.getElementById('pause-btn');
  overlay.classList.toggle('active', paused);
  btn.textContent = paused ? 'Resume' : 'Pause';
};

window.onGameOver = function() {
  document.getElementById('final-score').textContent = 'Score: ' + score;
  document.getElementById('game-over-overlay').classList.add('active');
};

document.addEventListener('DOMContentLoaded', () => {
  setupMobileButtons();
  document.getElementById('new-game-btn').addEventListener('click', handleNewGame);
  document.getElementById('quit-btn').addEventListener('click', handleQuit);
  document.getElementById('pause-btn').addEventListener('click', window.togglePause);
  document.getElementById('mute-btn').addEventListener('click', handleMuteToggle);
  document.getElementById('resume-btn').addEventListener('click', handleResume);
  startGame();
  requestAnimationFrame(gameLoop);
});

