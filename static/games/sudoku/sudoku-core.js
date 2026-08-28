// sudoku-core.js — Core game logic for Sudoku
const SudokuCore = (() => {
  const GRID_SIZE = 9;
  const BOX_SIZE = 3;
  const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
  const DIFFICULTY_REMOVALS = { easy: 30, medium: 40, hard: 50 };

  let puzzle = [], solution = [], board = [], pencils = [];
  let state = 'idle', difficulty = 'medium';
  let highlightErrors = false, pencilMode = false;
  let selectedCell = null, mistakeCount = 0, timerSeconds = 0;
  let timerInterval = null;

  function indexToRC(index) {
    return { row: Math.floor(index / GRID_SIZE), col: index % GRID_SIZE };
  }
  function rcToIndex(row, col) { return row * GRID_SIZE + col; }
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function isValidPlacement(bd, row, col, num) {
    for (let c = 0; c < GRID_SIZE; c++) { if (bd[row*GRID_SIZE+c] === num) return false; }
    for (let r = 0; r < GRID_SIZE; r++) { if (bd[r*GRID_SIZE+col] === num) return false; }
    const sr = Math.floor(row/BOX_SIZE)*BOX_SIZE, sc = Math.floor(col/BOX_SIZE)*BOX_SIZE;
    for (let r = 0; r < BOX_SIZE; r++)
      for (let c = 0; c < BOX_SIZE; c++)
        if (bd[(sr+r)*GRID_SIZE+(sc+c)] === num) return false;
    return true;
  }
  function generateSolution() {
    const b = new Array(TOTAL_CELLS).fill(0);
    (function fill() {
      const ei = b.indexOf(0);
      if (ei === -1) return true;
      const { row, col } = indexToRC(ei);
      for (const n of shuffle([1,2,3,4,5,6,7,8,9])) {
        if (isValidPlacement(b, row, col, n)) {
          b[ei] = n;
          if (fill()) return true;
          b[ei] = 0;
        }
      }
      return false;
    })();
    return b;
  }
  function createPuzzle(sol, diff) {
    const puz = [...sol];
    const positions = shuffle([...Array(TOTAL_CELLS).keys()]);
    let removed = 0;
    const removals = DIFFICULTY_REMOVALS[diff] || 40;
    for (const idx of positions) {
      if (removed >= removals) break;
      puz[idx] = 0; removed++;
    }
    return puz;
  }
  function getErrors() {
    const errs = [];
    for (let r = 0; r < GRID_SIZE; r++)
      for (let c = 0; c < GRID_SIZE; c++) {
        const v = board[r*GRID_SIZE+c];
        if (v !== 0 && v !== solution[r*GRID_SIZE+c]) errs.push({row:r, col:c});
      }
    return errs;
  }
  function initPencils() {
    pencils = []; for (let i = 0; i < TOTAL_CELLS; i++) pencils.push(new Array(GRID_SIZE+1).fill(false));
  }
  function togglePencilMark(row, col, num) { pencils[rcToIndex(row,col)][num] = !pencils[rcToIndex(row,col)][num]; }
  function clearAllPencils() { for (let i=0;i<pencils.length;i++) pencils[i].fill(false); }
  function clearRowPencils(row) { for (let c=0;c<GRID_SIZE;c++) pencils[rcToIndex(row,c)].fill(false); }
  function clearColPencils(col) { for (let r=0;r<GRID_SIZE;r++) pencils[rcToIndex(r,col)].fill(false); }
  function clearBoxPencils(row, col) {
    const sr = Math.floor(row/BOX_SIZE)*BOX_SIZE, sc = Math.floor(col/BOX_SIZE)*BOX_SIZE;
    for (let r=0;r<BOX_SIZE;r++) for (let c=0;c<BOX_SIZE;c++) pencils[rcToIndex(sr+r,sc+c)].fill(false);
  }

  function startGame(diff) {
    difficulty = diff || difficulty;
    state = 'playing'; mistakeCount = 0; timerSeconds = 0;
    selectedCell = null; pencilMode = false;
    solution = generateSolution();
    puzzle = createPuzzle(solution, difficulty);
    board = [...puzzle];
    initPencils();
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (state === 'playing') { timerSeconds++; if (window.sudokuUIOnTimerChange) window.sudokuUIOnTimerChange(timerSeconds); }
    }, 1000);
    if (window.sudokuUIOnInit) window.sudokuUIOnInit();
  }
  function enterNumber(num) {
    if (state !== 'playing' || !selectedCell) return;
    const {row, col} = selectedCell;
    if (puzzle[rcToIndex(row,col)] !== 0) return;
    if (pencilMode) { togglePencilMark(row,col,num); if (window.sudokuUIOnPencilChange) window.sudokuUIOnPencilChange(); return; }
    board[rcToIndex(row,col)] = num;
    if (solution[rcToIndex(row,col)] !== num) {
      mistakeCount++;
      if (window.sudokuUIOnMistakeChange) window.sudokuUIOnMistakeChange(mistakeCount);
      if (window.sudokuUIOnCellChange) window.sudokuUIOnCellChange(row,col,num);
      if (window.sudokuUIOnError) window.sudokuUIOnError();
    } else {
      if (window.sudokuUIOnCellChange) window.sudokuUIOnCellChange(row,col,num);
    }
    // Check win
    let allFilled = true;
    for (let i=0;i<TOTAL_CELLS;i++) { if (board[i] !== solution[i]) { allFilled = false; break; } }
    if (allFilled) { state='won'; clearInterval(timerInterval); if (window.sudokuUIOnWin) window.sudokuUIOnWin(); }
  }
  function clearCell() {
    if (state !== 'playing' || !selectedCell) return;
    const {row,col} = selectedCell;
    if (puzzle[rcToIndex(row,col)] !== 0) return;
    board[rcToIndex(row,col)] = 0;
    if (window.sudokuUIOnCellChange) window.sudokuUIOnCellChange(row,col,0);
  }
  function pauseGame() { if (state==='playing' && window.sudokuUIOnPause) { state='paused'; window.sudokuUIOnPause(); } }
  function resumeGame() { if (state==='paused' && window.sudokuUIOnResume) { state='playing'; window.sudokuUIOnResume(); } }
  function quitGame() { state='quit'; clearInterval(timerInterval); if (window.sudokuUIOnQuit) window.sudokuUIOnQuit(); }
  function selectCell(row, col) { selectedCell={row,col}; if (window.sudokuUIOnSelect) window.sudokuUIOnSelect(row,col); }

  function getState() { return state; }
  function getBoard() { return board; }
  function getPuzzle() { return puzzle; }
  function getSolution() { return solution; }
  function getPencils() { return pencils; }
  function getDifficulty() { return difficulty; }
  function getHighlightErrors() { return highlightErrors; }
  function getPencilMode() { return pencilMode; }
  function getSelectedCell() { return selectedCell; }
  function getMistakeCount() { return mistakeCount; }
  function getTimerSeconds() { return timerSeconds; }
  function setHighlightErrors(v) { highlightErrors=v; }
  function setPencilMode(v) { pencilMode=v; }

  return {
    startGame, enterNumber, clearCell, pauseGame, resumeGame, quitGame, selectCell,
    clearAllPencils, clearRowPencils, clearColPencils, clearBoxPencils,
    getState, getBoard, getPuzzle, getSolution, getPencils, getDifficulty, getHighlightErrors,
    getPencilMode, getSelectedCell, getMistakeCount, getTimerSeconds,
    setHighlightErrors, setPencilMode, rcToIndex,
  };
})();
