// sudoku-ui.js — DOM manipulation, events, overlays
(function() {
  // --- DOM References ---
  const gridEl = document.getElementById('sudoku-grid');
  const timerPanel = document.getElementById('timer-panel');
  const mistakesPanel = document.getElementById('mistakes-panel');
  const scoreDisplay = document.getElementById('score-display');
  const difficultySelect = document.getElementById('difficulty-select');
  const errorToggle = document.getElementById('error-toggle');
  const pencilModeBtn = document.getElementById('pencil-mode-btn');
  const muteBtn = document.getElementById('mute-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const startOverlay = document.getElementById('start-overlay');
  const pauseOverlay = document.getElementById('pause-overlay');
  const winOverlay = document.getElementById('win-overlay');
  const quitOverlay = document.getElementById('quit-overlay');
  const winStats = document.getElementById('win-stats');
  const numPad = document.getElementById('num-pad');
  const newGameBtn = document.getElementById('new-game-btn');
  const quitBtn = document.getElementById('quit-btn');
  const playAgainBtn = document.getElementById('play-again-btn');
  const startNewBtn = document.getElementById('start-new-btn');
  const resumeBtnOverlay = document.getElementById('resume-btn-overlay');
  const mobileErase = document.getElementById('mobile-erase');
  const mobilePencil = document.getElementById('mobile-pencil');
  const mobileMute = document.getElementById('mobile-mute');
  const mobilePause = document.getElementById('mobile-pause');
  const clearAllBtn = document.getElementById('clear-all-pencils');
  const clearRowBtn = document.getElementById('clear-row-pencils');
  const clearColBtn = document.getElementById('clear-col-pencils');
  const clearBoxBtn = document.getElementById('clear-box-pencils');

  // --- Helpers ---
  function formatTime(s) {
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function hideAllOverlays() {
    [startOverlay, pauseOverlay, winOverlay, quitOverlay].forEach(function(o) { o.classList.remove('active'); });
  }

  function showOverlay(el) { el.classList.add('active'); }

  function buildGrid() {
    gridEl.innerHTML = '';
    for (var i = 0; i < 81; i++) {
      var cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.index = i;
      var rc = SudokuCore.indexToRC(i);
      cell.dataset.row = rc.row;
      cell.dataset.col = rc.col;
      cell.addEventListener('click', function() { SudokuCore.selectCell(rc.row, rc.col); });
      gridEl.appendChild(cell);
    }
  }

  function buildNumPad() {
    numPad.innerHTML = '';
    for (var n = 1; n <= 9; n++) {
      var btn = document.createElement('button');
      btn.textContent = String(n);
      btn.addEventListener('click', function() { SudokuCore.enterNumber(n); });
      numPad.appendChild(btn);
    }
  }

  function updateTimer() {
    var t = SudokuCore.getTimerSeconds();
    var formatted = formatTime(t);
    if (timerPanel) timerPanel.textContent = formatted;
    if (scoreDisplay) scoreDisplay.textContent = 'Time: ' + formatted;
  }

  function updateMistakes() {
    if (mistakesPanel) mistakesPanel.textContent = String(SudokuCore.getMistakeCount());
  }

  function renderPuzzle() {
    var board = SudokuCore.getBoard();
    var puzzle = SudokuCore.getPuzzle();
    var pencils = SudokuCore.getPencils();
    var selected = SudokuCore.getSelectedCell();
    var highlightErrors = SudokuCore.getHighlightErrors();
    var cells = gridEl.querySelectorAll('.cell');
    var solution = SudokuCore.getSolution();

    cells.forEach(function(cell, i) {
      cell.className = 'cell';
      cell.innerHTML = '';
      var val = board[i];
      var isGiven = puzzle[i] !== 0;
      var rc = SudokuCore.indexToRC(i);

      if (isGiven) cell.classList.add('given');
      else if (val !== 0) cell.classList.add('user-entry');

      if (val === 0) {
        var hasMarks = pencils[i].some(function(m, n) { return n >= 1 && m; });
        if (hasMarks) {
          var pg = document.createElement('div');
          pg.className = 'pencil-grid';
          for (var n = 1; n <= 9; n++) {
            var span = document.createElement('span');
            span.textContent = pencils[i][n] ? String(n) : '';
            pg.appendChild(span);
          }
          cell.appendChild(pg);
        }
      }

      if (selected && selected.row === rc.row && selected.col === rc.col) cell.classList.add('selected');

      if (selected) {
        var selIdx = SudokuCore.rcToIndex(selected.row, selected.col);
        var sameBox = Math.floor(selected.row / 3) === Math.floor(rc.row / 3) && Math.floor(selected.col / 3) === Math.floor(rc.col / 3);
        if ((selected.row === rc.row || selected.col === rc.col || sameBox) &&
            !(selected.row === rc.row && selected.col === rc.col)) {
          cell.classList.add('highlighted');
        }
      }

      if (val !== 0 && selected) {
        if (val === board[selIdx]) cell.classList.add('same-num');
      }

      if (highlightErrors && val !== 0 && !isGiven && solution) {
        if (val !== solution[i]) cell.classList.add('error');
      }
    });
  }

  function setPencilButtonUI() {
    if (!pencilModeBtn) return;
    var mode = SudokuCore.getPencilMode();
    pencilModeBtn.textContent = 'Pencil: ' + (mode ? 'ON' : 'OFF');
    pencilModeBtn.classList.toggle('active-toggle', mode);
  }

  function updateMuteIcon() {
    if (!muteBtn) return;
    muteBtn.textContent = SudokuSounds.isMuted() ? '\u{1F507}' : '\u{1F50A}';
  }

  // --- Event Handlers ---
  function handleDifficultyClick(e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    var diff = btn.dataset.diff;
    if (diff) {
      difficultySelect.value = diff;
      hideAllOverlays();
      SudokuCore.startGame(diff);
    }
  }

  function handleCellClick(e) {
    var cell = e.target.closest('.cell');
    if (!cell) return;
    SudokuCore.selectCell(parseInt(cell.dataset.row), parseInt(cell.dataset.col));
  }

  function handleMouseMove(e) {
    var cell = e.target.closest('.cell');
    if (!cell) {
      gridEl.classList.remove('paused');
      return;
    }
    // Select on hover if idle
    if (SudokuCore.getState() === 'idle') {
      SudokuCore.selectCell(parseInt(cell.dataset.row), parseInt(cell.dataset.col));
    }
  }

  function handleKeydown(e) {
    if (SudokuCore.getState() !== 'playing') return;
    var key = e.key;

    if (key >= '1' && key <= '9') {
      e.preventDefault();
      SudokuCore.enterNumber(parseInt(key));
    } else if (key === 'Backspace' || key === 'Delete') {
      e.preventDefault();
      SudokuCore.clearCell();
    } else if (key === 'ArrowUp') {
      e.preventDefault();
      moveSelection(-1, 0);
    } else if (key === 'ArrowDown') {
      e.preventDefault();
      moveSelection(1, 0);
    } else if (key === 'ArrowLeft') {
      e.preventDefault();
      moveSelection(0, -1);
    } else if (key === 'ArrowRight') {
      e.preventDefault();
      moveSelection(0, 1);
    } else if (key === 'p' || key === 'P') {
      e.preventDefault();
      if (SudokuCore.getState() === 'playing') SudokuCore.pauseGame();
      else if (SudokuCore.getState() === 'paused') SudokuCore.resumeGame();
    } else if (key === 'n' || key === 'N') {
      e.preventDefault();
      var mode = SudokuCore.getPencilMode();
      SudokuCore.setPencilMode(!mode);
      setPencilButtonUI();
    } else if (key === 'm' || key === 'M') {
      e.preventDefault();
      SudokuSounds.toggleMute();
      updateMuteIcon();
    }
  }

  function moveSelection(dRow, dCol) {
    var sel = SudokuCore.getSelectedCell();
    if (!sel) {
      SudokuCore.selectCell(0, 0);
      return;
    }
    var newRow = sel.row + dRow;
    var newCol = sel.col + dCol;
    if (newRow < 0) newRow = 8;
    if (newRow > 8) newRow = 0;
    if (newCol < 0) newCol = 8;
    if (newCol > 8) newCol = 0;
    SudokuCore.selectCell(newRow, newCol);
  }

  // --- Callbacks from Core ---
  window.sudokuUIOnInit = function() {
    hideAllOverlays();
    updateTimer();
    updateMistakes();
    renderPuzzle();
  };

  window.sudokuUIOnTimerChange = function(seconds) {
    updateTimer();
  };

  window.sudokuUIOnCellChange = function(row, col, val) {
    updateTimer();
    renderPuzzle();
    if (val !== 0) {
      var puzzle = SudokuCore.getPuzzle();
      if (puzzle[SudokuCore.rcToIndex(row, col)] === 0) {
        SudokuSounds.playFill();
      }
    } else {
      SudokuSounds.playErase();
    }
  };

  window.sudokuUIOnMistakeChange = function(count) {
    updateMistakes();
  };

  window.sudokuUIOnError = function() {
    SudokuSounds.playError();
  };

  window.sudokuUIOnSelect = function(row, col) {
    renderPuzzle();
    SudokuSounds.playSelect();
  };

  window.sudokuUIOnPencilChange = function() {
    renderPuzzle();
  };

  window.sudokuUIOnPause = function() {
    pauseOverlay.classList.add('active');
    gridEl.classList.add('paused');
  };

  window.sudokuUIOnResume = function() {
    pauseOverlay.classList.remove('active');
    gridEl.classList.remove('paused');
  };

  window.sudokuUIOnWin = function() {
    SudokuSounds.playWin();
    var stats = formatTime(SudokuCore.getTimerSeconds()) + ' | Mistakes: ' + SudokuCore.getMistakeCount();
    if (winStats) winStats.textContent = 'Time: ' + stats;
    winOverlay.classList.add('active');
  };

  window.sudokuUIOnQuit = function() {
    quitOverlay.classList.add('active');
  };

  // --- Bind Events ---
  function bindEvents() {
    // Grid click
    gridEl.addEventListener('click', handleCellClick);
    gridEl.addEventListener('mousemove', handleMouseMove);

    // Difficulty buttons
    document.addEventListener('click', handleDifficultyClick);

    // Keyboard
    document.addEventListener('keydown', handleKeydown);

    // Buttons
    if (resumeBtnOverlay) resumeBtnOverlay.addEventListener('click', function() {
      SudokuCore.resumeGame();
    });

    if (newGameBtn) newGameBtn.addEventListener('click', function() {
      SudokuCore.startGame(SudokuCore.getDifficulty());
    });

    if (quitBtn) quitBtn.addEventListener('click', function() {
      window.top.location.href = '/games/';
    });

    if (playAgainBtn) playAgainBtn.addEventListener('click', function() {
      window.top.location.href = '/games/';
    });

    if (startNewBtn) startNewBtn.addEventListener('click', function() {
      var diff = difficultySelect.value;
      hideAllOverlays();
      SudokuCore.startGame(diff);
    });

    if (pauseBtn) pauseBtn.addEventListener('click', function() {
      if (SudokuCore.getState() === 'playing') SudokuCore.pauseGame();
      else if (SudokuCore.getState() === 'paused') SudokuCore.resumeGame();
    });

    // Mobile pause
    if (mobilePause) mobilePause.addEventListener('click', function() {
      if (SudokuCore.getState() === 'playing') SudokuCore.pauseGame();
      else if (SudokuCore.getState() === 'paused') SudokuCore.resumeGame();
    });

    // Mobile erase
    if (mobileErase) mobileErase.addEventListener('click', function() {
      SudokuCore.clearCell();
    });

    // Mobile pencil
    if (mobilePencil) mobilePencil.addEventListener('click', function() {
      var mode = SudokuCore.getPencilMode();
      SudokuCore.setPencilMode(!mode);
      setPencilButtonUI();
    });

    // Mobile mute
    if (mobileMute) mobileMute.addEventListener('click', function() {
      SudokuSounds.toggleMute();
      updateMuteIcon();
    });

    // Mute toggle
    if (muteBtn) muteBtn.addEventListener('click', function() {
      SudokuSounds.toggleMute();
      updateMuteIcon();
    });

    // Error toggle
    if (errorToggle) errorToggle.addEventListener('change', function() {
      SudokuCore.setHighlightErrors(errorToggle.checked);
      renderPuzzle();
    });

    // Pencil mode toggle
    if (pencilModeBtn) pencilModeBtn.addEventListener('click', function() {
      var mode = SudokuCore.getPencilMode();
      SudokuCore.setPencilMode(!mode);
      setPencilButtonUI();
    });

    // Pencil clear buttons
    if (clearAllBtn) clearAllBtn.addEventListener('click', function() {
      SudokuCore.clearAllPencils();
      renderPuzzle();
    });
    if (clearRowBtn) clearRowBtn.addEventListener('click', function() {
      var sel = SudokuCore.getSelectedCell();
      if (sel) { SudokuCore.clearRowPencils(sel.row); renderPuzzle(); }
    });
    if (clearColBtn) clearColBtn.addEventListener('click', function() {
      var sel = SudokuCore.getSelectedCell();
      if (sel) { SudokuCore.clearColPencils(sel.col); renderPuzzle(); }
    });
    if (clearBoxBtn) clearBoxBtn.addEventListener('click', function() {
      var sel = SudokuCore.getSelectedCell();
      if (sel) { SudokuCore.clearBoxPencils(sel.row, sel.col); renderPuzzle(); }
    });
  }

  // --- Init ---
  buildGrid();
  buildNumPad();
  bindEvents();
  updateMuteIcon();
  SudokuCore.selectCell(0, 0);
  renderPuzzle();
})();
