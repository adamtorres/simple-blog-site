// animaldoku-ui.js — Rendering, events, overlays, game loop
(function() {
  'use strict';

  var canvas, ctx;
  var CELL_SIZE = 0;
  var gridOffsetX = 0, gridOffsetY = 0;
  var lastTapTime = 0;
  var lastTapCell = null;
  var animationFrameId = null;
  var gameCallback = null;
  var prevLives = 3;
  var prevGameState = null;

  var OVERLAY_DURATION_MS = 2500;
  var lastStateTime = 0;

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
    var area = document.querySelector('.game-container');
    var availW = area ? area.clientWidth - 12 : window.innerWidth - 40;
    var availH = area ? area.clientHeight - 12 : window.innerHeight - 200;
    var size = Math.min(availW, availH, 500);
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
      AnimaldokuCore.placeCat(row, col);
    } else {
      AnimaldokuCore.toggleX(row, col);
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
    gameCallback = onGameStateChange;
    AnimaldokuCore.resetGame();
  }

  function onGameStateChange(event) {
    lastStateTime = Date.now();
    prevGameState = event;
    if (event === 'win') {
      AnimaldokuSounds.playWin();
      setTimeout(function() {
        showGameWinStats();
        showOverlay('game-over-overlay');
      }, OVERLAY_DURATION_MS);
    } else if (event === 'gameover') {
      AnimaldokuSounds.playGameOver();
      setTimeout(function() {
        showGameOverStats();
        showOverlay('game-over-overlay');
      }, OVERLAY_DURATION_MS);
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
  }

  function drawAnimal(row, col, bgColor) {
    var cx = col * CELL_SIZE + CELL_SIZE / 2;
    var cy = row * CELL_SIZE + CELL_SIZE / 2;
    var size = CELL_SIZE * 0.35;
    var animalType = AnimaldokuCore.getAnimalType();
    var variation = AnimaldokuCore.getAnimalVariation();
    var imgSrc = 'animals/' + animalType + '/' + variation;

    if (!bgColor) bgColor = '#4a4a8a';

    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = bgColor;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
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
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();