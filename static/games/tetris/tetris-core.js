/* tetris-core.js - Game engine */

// CONFIGURATION — change DROP_INTERVAL to adjust piece speed
const CONFIG = {
  DROP_INTERVAL: 800, // milliseconds between automatic drops
};

const COLS = 10;
const ROWS = 20;

// Game state
let grid = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let gameOver = false;
let paused = false;
let gameRunning = false;
let lastDropTime = 0;
let isHardDropping = false;
let softDropping = false;

function createGrid() {
  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function randomPiece() {
  const types = Object.keys(PIECES);
  const type = types[Math.floor(Math.random() * types.length)];
  const rotation = Math.floor(Math.random() * PIECES[type].rotations.length);
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  return { type, rotation, x: 3, y: 0, color };
}

function canPlace(type, rotation, x, y) {
  const cells = PIECES[type].rotations[rotation];
  for (const [cx, cy] of cells) {
    const nx = cx + x;
    const ny = cy + y;
    if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
    if (ny >= 0 && grid[ny][nx] !== null) return false;
  }
  return true;
}

function movePiece(dx, dy) {
  const newX = currentPiece.x + dx;
  const newY = currentPiece.y + dy;
  if (canPlace(currentPiece.type, currentPiece.rotation, newX, newY)) {
    currentPiece.x = newX;
    currentPiece.y = newY;
    return true;
  }
  return false;
}

function rotatePiece() {
  const numRotations = PIECES[currentPiece.type].rotations.length;
  const newRotation = (currentPiece.rotation + 1) % numRotations;

  // Try at current position
  if (canPlace(currentPiece.type, newRotation, currentPiece.x, currentPiece.y)) {
    currentPiece.rotation = newRotation;
    return true;
  }

  // Wall kick: try shifting left or right
  for (const offset of [-1, 1, -2, 2]) {
    if (canPlace(currentPiece.type, newRotation, currentPiece.x + offset, currentPiece.y)) {
      currentPiece.x += offset;
      currentPiece.rotation = newRotation;
      return true;
    }
  }
  return false;
}

function hardDrop() {
  while (canPlace(currentPiece.type, currentPiece.rotation, currentPiece.x, currentPiece.y + 1)) {
    currentPiece.y++;
  }
}

function lockPiece() {
  const cells = PIECES[currentPiece.type].rotations[currentPiece.rotation];
  for (const [cx, cy] of cells) {
    const nx = cx + currentPiece.x;
    const ny = cy + currentPiece.y;
    if (ny >= 0 && ny < ROWS) {
      grid[ny][nx] = currentPiece.color;
    }
  }

  const linesCleared = clearLines();

  // Score: 1 point per cell placed (4 cells per piece)
  score += 4;
  // Line clear bonus: 100, 200, 400, 800 for 1-4 lines
  const bonuses = [0, 100, 200, 400, 800];
  score += bonuses[linesCleared] || 0;

  if (linesCleared > 0) {
    sounds.play('lineClear');
  }

  // Spawn next piece
  currentPiece = nextPiece || randomPiece();
  nextPiece = randomPiece();

  // Check game over
  if (!canPlace(currentPiece.type, currentPiece.rotation, currentPiece.x, currentPiece.y)) {
    gameOver = true;
    sounds.play('gameOver');
    if (window.onGameOver) window.onGameOver();
  }
}

function clearLines() {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (grid[y].every(cell => cell !== null)) {
      grid.splice(y, 1);
      grid.unshift(new Array(COLS).fill(null));
      cleared++;
      y++; // re-check this row since everything shifted down
    }
  }
  return cleared;
}

function startGame() {
  createGrid();
  score = 0;
  gameOver = false;
  paused = false;
  gameRunning = true;
  lastDropTime = 0;
  isHardDropping = false;
  softDropping = false;
  currentPiece = randomPiece();
  nextPiece = randomPiece();
}

function togglePause() {
  if (gameOver || !gameRunning) return;
  paused = !paused;
}
