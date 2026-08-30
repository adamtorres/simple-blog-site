// tetris-core.js - Core game logic for Tetris
const TetrisCore = (() => {
  // --- Constants ---
  const COLS = 10;
  const ROWS = 20;
  const CELL_SIZE = 24;
  const INITIAL_DROP_INTERVAL = 1000;

  const PIECE_COLORS = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24',
    '#6c5ce7', '#a8e6cf', '#fd79a8',
  ];

  const LINE_BONUS = [0, 100, 200, 400, 800];

  const PIECE_SHAPES = {
    I: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    J: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    L: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    O: [
      [1, 1],
      [1, 1],
    ],
    S: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    T: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    Z: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
  };

  const PIECE_TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

  // --- State ---
  let grid = [];
  let currentPiece = null;
  let nextPiece = null;
  let score = 0;
  let level = 1;
  let linesCleared = 0;
  let gameMode = 'timed';
  let dropInterval = INITIAL_DROP_INTERVAL;
  let gameTimer = 0;
  let scoreAccumulator = 0;
  let paused = false;
  let gameOver = false;
  let gameRunning = false;
  let timerInterval = null;
  let dropTimeout = null;

  function createEmptyGrid() {
    const g = [];
    for (let r = 0; r < ROWS; r++) {
      g.push(new Array(COLS).fill(0));
    }
    return g;
  }

  function randomPieceType() {
    return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  }

  function createPiece(type) {
    const shape = PIECE_SHAPES[type].map((row) => row.slice());
    const color = Math.floor(Math.random() * PIECE_COLORS.length) + 1;
    const startCol = Math.floor((COLS - shape[0].length) / 2);
    return { type, shape, color, row: 0, col: startCol };
  }

  function rotateShape(shape) {
    const rows = shape.length;
    const cols = shape[0].length;
    const rotated = [];
    for (let c = 0; c < cols; c++) {
      const newRow = [];
      for (let r = rows - 1; r >= 0; r--) {
        newRow.push(shape[r][c]);
      }
      rotated.push(newRow);
    }
    return rotated;
  }

  function isValidPosition(g, shape, row, col) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const newRow = row + r;
          const newCol = col + c;
          if (newRow < 0 || newRow >= ROWS || newCol < 0 || newCol >= COLS) {
            return false;
          }
          if (g[newRow][newCol] !== 0) {
            return false;
          }
        }
      }
    }
    return true;
  }

  function calculateDropInterval() {
    return Math.max(100, INITIAL_DROP_INTERVAL - (level - 1) * 80);
  }

  function calculateLevel() {
    if (gameMode === 'timed') {
      return 1 + Math.floor(gameTimer / 120);
    }
    return 1 + Math.floor(scoreAccumulator / 1000);
  }
  function tryRotate() {
    if (!currentPiece) return false;
    const newShape = rotateShape(currentPiece.shape);
    const offsets = [
      { dr: 0, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 },
      { dr: -1, dc: 0 },
      { dr: 0, dc: -2 },
      { dr: 0, dc: 2 },
    ];
    for (const o of offsets) {
      if (isValidPosition(grid, newShape, currentPiece.row + o.dr, currentPiece.col + o.dc)) {
        currentPiece.shape = newShape;
        currentPiece.row += o.dr;
        currentPiece.col += o.dc;
        return true;
      }
    }
    return false;
  }

  function movePiece(dc, dr) {
    if (!currentPiece) return false;
    const newRow = currentPiece.row + dr;
    const newCol = currentPiece.col + dc;
    if (isValidPosition(grid, currentPiece.shape, newRow, newCol)) {
      currentPiece.row = newRow;
      currentPiece.col = newCol;
      return true;
    }
    return false;
  }

  function getGhostRow() {
    if (!currentPiece) return 0;
    let ghostRow = currentPiece.row;
    while (isValidPosition(grid, currentPiece.shape, ghostRow + 1, currentPiece.col)) {
      ghostRow++;
    }
    return ghostRow;
  }

  function freezePiece() {
    if (!currentPiece) return;
    for (let r = 0; r < currentPiece.shape.length; r++) {
      for (let c = 0; c < currentPiece.shape[r].length; c++) {
        if (currentPiece.shape[r][c] !== 0) {
          const gr = currentPiece.row + r;
          const gc = currentPiece.col + c;
          if (gr >= 0 && gr < ROWS && gc >= 0 && gc < COLS) {
            grid[gr][gc] = currentPiece.color;
          }
        }
      }
    }
  }

  function clearLines() {
    let count = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r].every((cell) => cell !== 0)) {
        grid.splice(r, 1);
        grid.unshift(new Array(COLS).fill(0));
        count++;
        r++;
      }
    }
    return count;
  }

  function countCells(shape) {
    let count = 0;
    for (const row of shape) {
      for (const cell of row) {
        if (cell !== 0) count++;
      }
    }
    return count;
  }

  function updateScore(lines) {
    const bonus = lines > 0 ? (LINE_BONUS[lines] || 0) : 0;
    const cellScore = currentPiece ? countCells(currentPiece.shape) : 0;
    score += bonus + cellScore;
    linesCleared += lines;
    return { bonus, cellScore };
  }

  function spawnPiece() {
    currentPiece = nextPiece || createPiece(randomPieceType());
    nextPiece = createPiece(randomPieceType());
    if (!isValidPosition(grid, currentPiece.shape, currentPiece.row, currentPiece.col)) {
      gameOver = true;
      gameRunning = false;
      return false;
    }
    return true;
  }

  function hardDrop() {
    if (!currentPiece) return 0;
    let dropped = 0;
    while (isValidPosition(grid, currentPiece.shape, currentPiece.row + 1, currentPiece.col)) {
      currentPiece.row++;
      dropped++;
    }
    return dropped;
  }

  function softDrop() {
    return movePiece(0, 1);
  }

  function resetGame(mode) {
    stopGameLoop();
    grid = createEmptyGrid();
    score = 0;
    level = 1;
    linesCleared = 0;
    gameTimer = 0;
    scoreAccumulator = 0;
    paused = false;
    gameOver = false;
    gameMode = mode;
    dropInterval = calculateDropInterval();
    nextPiece = null;
    spawnPiece();
    return true;
  }

  function startGameLoop() {
    stopGameLoop();
    gameRunning = true;
    paused = false;
    timerInterval = setInterval(() => {
      if (!paused && gameRunning && !gameOver) {
        gameTimer++;
        scoreAccumulator = score;
        const newLevel = calculateLevel();
        if (newLevel !== level) {
          level = newLevel;
          dropInterval = calculateDropInterval();
        }
      }
    }, 1000);
    restartDropLoop();
  }

  function restartDropLoop() {
    if (dropTimeout) clearTimeout(dropTimeout);
    scheduleDrop();
  }

  function scheduleDrop() {
    if (dropTimeout) clearTimeout(dropTimeout);
    dropTimeout = setTimeout(() => {
      if (!paused && gameRunning && !gameOver) {
        if (!movePiece(0, 1)) {
          freezePiece();
          const lines = clearLines();
          updateScore(lines);
          if (!spawnPiece()) {
            stopGameLoop();
            return;
          }
        }
        scheduleDrop();
      }
    }, dropInterval);
  }

  function stopGameLoop() {
    gameRunning = false;
    paused = false;
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    if (dropTimeout) { clearTimeout(dropTimeout); dropTimeout = null; }
  }

  function togglePause() {
    if (!gameRunning || gameOver) return false;
    paused = !paused;
    return paused;
  }

  return {
    COLS, ROWS, CELL_SIZE, INITIAL_DROP_INTERVAL,
    PIECE_COLORS, PIECE_SHAPES,
    getGrid: () => grid,
    getCurrentPiece: () => currentPiece,
    getNextPiece: () => nextPiece,
    getScore: () => score,
    getLevel: () => level,
    getLinesCleared: () => linesCleared,
    getGameMode: () => gameMode,
    getDropInterval: () => dropInterval,
    getGameTimer: () => gameTimer,
    getPaused: () => paused,
    getGameOver: () => gameOver,
    getGameRunning: () => gameRunning,
    movePiece,
    tryRotate,
    hardDrop,
    softDrop,
    getGhostRow,
    freezePiece,
    clearLines,
    updateScore,
    spawnPiece,
    resetGame,
    startGameLoop,
    restartDropLoop,
    stopGameLoop,
    togglePause,
  };
})();