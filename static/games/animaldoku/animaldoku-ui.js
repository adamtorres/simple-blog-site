// animaldoku-ui.js — Rendering, events, overlays, game loop
(function() {
  'use strict';

  var canvas, ctx;
  var CELL_SIZE = 0;
  var gridOffsetX = 0, gridOffsetY = 0;
  var lastTapTime = 0;
  var lastTapCell = null;
  var pendingCell = null;
  var pendingAction = null;
  var animationFrameId = null;
  var gameCallback = null;
  var prevLives = 3;
  var prevGameState = null;

  function init() {
    canvas = document.getElementById('animaldoku-grid');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resizeCanvas();
    bindEvents();
    showOverlay('start-overlay');
    window.addEventListener('resize', resizeCanvas);
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function resizeCanvas() {
    if (!canvas) return;
    var area = document.querySelector('.game-area');
    var availW = (area ? area.clientWidth - 12 : window.innerWidth) - 200;
    var availH = (area ? area.clientHeight - 12 : window.innerHeight) - 50;
    var size = Math.max(Math.min(availW, availH, 600), 200);
    var gs = AnimaldokuCore.getGridSize() || 10;
    CELL_SIZE = Math.floor(size / gs);
    var dim = CELL_SIZE * gs;
    canvas.width = dim;
    canvas.height = dim;
    gridOffsetX = 0;
    gridOffsetY = 0;
    if (!gameOverTriggered) render();
  }

  function bindEvents() {
    canvas.addEventListener('click', handleGridClick);
    document.addEventListener('keydown', handleKeyDown);

    var overlayContainer = document.querySelector('.game-container');
    overlayContainer.addEventListener('click', handleOverlayClicks);

    var pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) pauseBtn.addEventListener('click', togglePauseUI);

    var muteBtn = document.getElementById('mute-btn');
    if (muteBtn) muteBtn.addEventListener('click', function() {
      AnimaldokuSounds.toggleMute();
    });

    var mobileMark = document.getElementById('mobile-mark');
    if (mobileMark) mobileMark.addEventListener('click', function() {
      if (lastTapCell) AnimaldokuCore.toggleX(lastTapCell[0], lastTapCell[1]);
    });

    var mobilePlace = document.getElementById('mobile-place');
    if (mobilePlace) mobilePlace.addEventListener('click', function() {
      if (lastTapCell) AnimaldokuCore.placeCat(lastTapCell[0], lastTapCell[1]);
    });

    var mobilePause = document.getElementById('mobile-pause');
    if (mobilePause) mobilePause.addEventListener('click', togglePauseUI);

    var mobileMute = document.getElementById('mobile-mute');
    if (mobileMute) mobileMute.addEventListener('click', function() {
      AnimaldokuSounds.toggleMute();
    });

    var debugBtn = document.getElementById('debug-btn');
    if (debugBtn) debugBtn.addEventListener('click', function() {
      AnimaldokuCore.toggleDebug();
      updateDebugIndicator();
    });
  }

  function handleGridClick(e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var x = (e.clientX - rect.left) * scaleX;
    var y = (e.clientY - rect.top) * scaleY;
    var gs = AnimaldokuCore.getGridSize();
    var col = Math.floor(x / CELL_SIZE);
    var row = Math.floor(y / CELL_SIZE);
    if (row < 0 || row >= gs || col < 0 || col >= gs) return;

    var now = Date.now();
    var isDoubleTap = (now - lastTapTime) < 300 && lastTapCell &&
      lastTapCell[0] === row && lastTapCell[1] === col;

    lastTapCell = [row, col];
    lastTapTime = now;

    if (isDoubleTap) {
      var placed = AnimaldokuCore.placeCat(row, col);
      if (placed) {
        pendingCell = null;
        pendingAction = null;
        return;
      }
    }

    if (pendingCell && pendingCell[0] === row && pendingCell[1] === col) {
      if (pendingAction === 'place') {
        AnimaldokuCore.placeCat(row, col);
      }
      pendingCell = null;
      pendingAction = null;
    } else {
      pendingCell = [row, col];
      if (AnimaldokuCore.getGrid()[row][col] === 0) {
        pendingAction = 'place';
        AnimaldokuCore.toggleX(row, col);
      } else {
        pendingAction = null;
      }
    }
  }

  function handleOverlayClicks(e) {
    var target = e.target;
    if (target.id === 'new-game-btn' || target.id === 'new-game-btn-go' ||
        target.id === 'play-again-btn-2') {
      startNewGame();
      return;
    }
    if (target.id === 'quit-btn' || target.id === 'play-again-btn-2') {
      showOverlay('quit-overlay');
      return;
    }
    if (target.id === 'resume-btn') {
      togglePauseUI();
      return;
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'p' || e.key === 'P') {
      togglePauseUI();
      return;
    }
    if (e.key === 'm' || e.key === 'M') {
      AnimaldokuSounds.toggleMute();
    }
    if (e.key === 'd' || e.key === 'D') {
      AnimaldokuCore.toggleDebug();
      updateDebugIndicator();
    }
  }

  function togglePauseUI() {
    var paused = AnimaldokuCore.togglePause();
    var overlay = document.getElementById('pause-overlay');
    var container = document.querySelector('.game-container');
    if (paused) {
      showOverlay('pause-overlay');
      container.classList.add('paused');
    } else {
      hideOverlay('pause-overlay');
      container.classList.remove('paused');
    }
  }

  function showOverlay(id) {
    hideAllOverlays();
    var el = document.getElementById(id);
    if (el) el.classList.add('active');
  }

  function hideOverlay(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('active');
  }

  function hideAllOverlays() {
    var overlays = document.querySelectorAll('.overlay');
    for (var i = 0; i < overlays.length; i++) overlays[i].classList.remove('active');
  }

  function startNewGame() {
    gameOverTriggered = false;
    hideAllOverlays();
    gameCallback = onGameStateChange;
    AnimaldokuCore.resetGame();
  }

  function onGameStateChange(event) {
    prevGameState = event;
    if (event === 'win') {
      AnimaldokuSounds.playWin();
      showGameWinStats();
      showOverlay('game-over-overlay');
      // Clear overlay before auto-advancing to next level
      setTimeout(function() {
        hideOverlay('game-over-overlay');
      }, 600);
    } else if (event === 'gameover') {
      AnimaldokuSounds.playGameOver();
      showGameOverStats();
      showOverlay('game-over-overlay');
    }
  }

  function showGameWinStats() {
    var stats = document.getElementById('game-stats');
    if (stats) stats.innerHTML = '<p>Congratulations! Level reached: ' +
      AnimaldokuCore.getLevel() + '</p>';
  }

  function showGameOverStats() {
    var stats = document.getElementById('game-stats');
    if (stats) stats.innerHTML = '<p>Lives exhausted at Level ' +
      AnimaldokuCore.getLevel() + '</p>';
  }

  function updateUI() {
    var lives = AnimaldokuCore.getLives();
    var level = AnimaldokuCore.getLevel();
    document.getElementById('lives-display').textContent = lives;
    document.getElementById('mobile-lives-display').textContent = 'Lives: ' + lives;
    document.getElementById('level-display').textContent = level;
  }

  function render() {
    if (!ctx) return;

    var grid = AnimaldokuCore.getGrid();
    var regionGrid = AnimaldokuCore.getRegionGrid();
    var animalPos = AnimaldokuCore.getAnimalPositions();
    var colors = AnimaldokuCore.getTerritoryColors();
    var gs = AnimaldokuCore.getGridSize();
    var animalType = AnimaldokuCore.getAnimalType();
    var variation = AnimaldokuCore.getAnimalVariation();
    if (!grid || !regionGrid || regionGrid.length === 0 || !colors || colors.length === 0 || !gs) return;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw territory cells
    for (var r = 0; r < gs; r++) {
      for (var c = 0; c < gs; c++) {
        var rid = regionGrid[r][c];
        if (rid >= 0 && rid < colors.length) {
          ctx.fillStyle = colors[rid] + '66';
          ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    for (var r = 0; r <= gs; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL_SIZE);
      ctx.lineTo(gs * CELL_SIZE, r * CELL_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(r * CELL_SIZE, 0);
      ctx.lineTo(r * CELL_SIZE, gs * CELL_SIZE);
      ctx.stroke();
    }

    // Draw pre-placed animals (value 3)
    for (var i = 0; i < animalPos.length; i++) {
      var ar = animalPos[i][0];
      var ac = animalPos[i][1];
      if (grid[ar][ac] === 3) {
        drawAnimal(ar, ac, colors[regionGrid[ar][ac]]);
      }
    }

    // Draw placed cats (value 1)
    for (var r = 0; r < gs; r++) {
      for (var c = 0; c < gs; c++) {
        if (grid[r][c] === 1) {
          drawAnimal(r, c, colors[regionGrid[r][c]]);
        }
      }
    }

    // Draw X marks (value 2)
    ctx.strokeStyle = 'rgba(255,80,80,0.5)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (var r = 0; r < gs; r++) {
      for (var c = 0; c < gs; c++) {
        if (grid[r][c] === 2) {
          var cx = c * CELL_SIZE + CELL_SIZE / 2;
          var cy = r * CELL_SIZE + CELL_SIZE / 2;
          var s = CELL_SIZE * 0.25;
          ctx.beginPath();
          ctx.moveTo(cx - s, cy - s);
          ctx.lineTo(cx + s, cy + s);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx + s, cy - s);
          ctx.lineTo(cx - s, cy + s);
          ctx.stroke();
        }
      }
    }

    // Draw debug indicators: green dashed circles on unplaced solution cells
    if (AnimaldokuCore.getDebugMode()) {
      var solutionPositions = AnimaldokuCore.getAnimalPositions();
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(46, 213, 115, 0.7)';
      ctx.beginPath();
      for (var i = 0; i < solutionPositions.length; i++) {
        var sr = solutionPositions[i][0];
        var sc = solutionPositions[i][1];
        if (grid[sr][sc] !== 1) {
          var sx = sc * CELL_SIZE + CELL_SIZE / 2;
          var sy = sr * CELL_SIZE + CELL_SIZE / 2;
          var radius = CELL_SIZE * 0.35;
          ctx.moveTo(sx + radius, sy);
          ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  var EMOJIS = {
    cat: '\uD83D\uDC31', dog: '\uD83D\uDC36', horse: '\uD83D\uDC34',
    mouse: '\uD83D\uDC2D', duck: '\uD83E\uDD86', parrot: '\uD83E\uDD9C',
    fish: '\uD83D\uDC1F',
  };

  function drawAnimal(row, col, bgColor) {
    var cx = col * CELL_SIZE + CELL_SIZE / 2;
    var cy = row * CELL_SIZE + CELL_SIZE / 2;
    var emojiSize = Math.floor(CELL_SIZE * 0.6);
    var animalType = AnimaldokuCore.getAnimalType();
    var emoji = EMOJIS[animalType] || EMOJIS.cat;

    ctx.save();
    ctx.font = emojiSize + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, cx, cy);
    ctx.restore();
  }

  function updateDebugIndicator() {
    var statusEl = document.getElementById('debug-status');
    if (statusEl) {
      var isOn = AnimaldokuCore.getDebugMode();
      statusEl.textContent = isOn ? 'On' : 'Off';
      statusEl.classList.toggle('active', isOn);
    }
  }

  var gameOverTriggered = false;

  function gameLoop() {
    animationFrameId = requestAnimationFrame(gameLoop);

    var running = AnimaldokuCore.getGameRunning();
    var over = AnimaldokuCore.getGameOver();
    var paused = AnimaldokuCore.getPaused();

    if (running && !over && !paused) {
      if (prevLives !== AnimaldokuCore.getLives()) {
        if (AnimaldokuCore.getLives() < prevLives) {
          AnimaldokuSounds.playMistake();
        }
        prevLives = AnimaldokuCore.getLives();
      }
      updateUI();
    }

    render();

    if (over && !gameOverTriggered) {
      gameOverTriggered = true;
      if (prevGameState === 'win') {
        showGameWinStats();
      } else {
        showGameOverStats();
      }
      showOverlay('game-over-overlay');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();