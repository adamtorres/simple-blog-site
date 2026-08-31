// animaldoku-core.js — Core game logic for Animaldoku
(function() {
  'use strict';

  var GRID_SIZE = 10;
  var MAX_LIVES = 3;

  var grid = [];
  var regionGrid = [];
  var animalPositions = [];
  var lives = MAX_LIVES;
  var level = 1;
  var gameRunning = false;
  var paused = false;
  var gameOver = false;
  var debugMode = false;
  var animalType = 'cat';
  var animalVariation = 'cat-1.svg';
  var territoryColors = [];
  var apiEndpoint = '/games/animaldoku/generate/';

  function createEmptyGrid() {
    var g = [];
    for (var r = 0; r < GRID_SIZE; r++) {
      g.push(new Array(GRID_SIZE).fill(0));
    }
    return g;
  }

  function getAllPlacedCats() {
    var cats = [];
    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] === 1 || grid[r][c] === 3) cats.push([r, c]);
      }
    }
    return cats;
  }

  function validateCell(row, col) {
    var cats = getAllPlacedCats();
    if (cats.length === 0) return { valid: true };

    for (var i = 0; i < cats.length; i++) {
      if (cats[i][0] === row && cats[i][1] === col) return { valid: true, isSelf: true };
    }

    var rowCats = 0, colCats = 0;
    for (var r = 0; r < GRID_SIZE; r++) {
      if (grid[r][col] === 1 || grid[r][col] === 3) colCats++;
    }
    for (var c = 0; c < GRID_SIZE; c++) {
      if (grid[row][c] === 1 || grid[row][c] === 3) rowCats++;
    }
    if (rowCats > 1) return { valid: false, reason: 'row' };
    if (colCats > 1) return { valid: false, reason: 'col' };

    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        var nr = row + dr, nc = col + dc;
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
          if (grid[nr][nc] === 1 || grid[nr][nc] === 3) return { valid: false, reason: 'touching' };
        }
      }
    }

    var regionId = regionGrid[row][col];
    var regionCats = 0;
    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        if (regionGrid[r][c] === regionId && (grid[r][c] === 1 || grid[r][c] === 3)) regionCats++;
      }
    }
    if (regionCats > 1) return { valid: false, reason: 'region' };

    return { valid: true };
  }

  function autoBlock(row, col) {
    for (var c = 0; c < GRID_SIZE; c++) {
      if (grid[row][c] === 0) grid[row][c] = 2;
    }
    for (var r = 0; r < GRID_SIZE; r++) {
      if (grid[r][col] === 0) grid[r][col] = 2;
    }
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        var nr = row + dr, nc = col + dc;
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
          if (grid[nr][nc] === 0) grid[nr][nc] = 2;
        }
      }
    }
  }

  function checkWin() {
    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        if (regionGrid[r][c] === -1) continue;
        var regionId = regionGrid[r][c];
        var regionCats = 0;
        for (var rr = 0; rr < GRID_SIZE; rr++) {
          for (var cc = 0; cc < GRID_SIZE; cc++) {
            if (regionGrid[rr][cc] === regionId && grid[rr][cc] > 0 && grid[rr][cc] !== 2) regionCats++;
          }
        }
        if (regionCats !== 1) return false;
      }
    }

    for (var r = 0; r < GRID_SIZE; r++) {
      var rowCats = 0;
      for (var c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] > 0 && grid[r][c] !== 2) rowCats++;
      }
      if (rowCats !== 1) return false;
    }

    for (var c = 0; c < GRID_SIZE; c++) {
      var colCats = 0;
      for (var r = 0; r < GRID_SIZE; r++) {
        if (grid[r][c] > 0 && grid[r][c] !== 2) colCats++;
      }
      if (colCats !== 1) return false;
    }

    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] > 0 && grid[r][c] !== 2) {
          for (var dr = -1; dr <= 1; dr++) {
            for (var dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              var nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                if (grid[nr][nc] > 0 && grid[nr][nc] !== 2) return false;
              }
            }
          }
        }
      }
    }

    return true;
  }

  function fetchNewGrid(callback) {
    var xhr = new XMLHttpRequest();
    var url = apiEndpoint + '?grid_size=' + GRID_SIZE;
    xhr.open('GET', url, true);
    xhr.onload = function() {
      if (xhr.status === 200) {
        var data = JSON.parse(xhr.responseText);
        callback(data);
      }
    };
    xhr.send();
  }

  function resetGame(initialLevel) {
    var savedAnimal = animalType;
    var savedVariation = animalVariation;

    lives = MAX_LIVES;
    level = initialLevel !== undefined ? initialLevel : 1;
    gameOver = false;
    gameRunning = false;
    paused = false;
    animalType = savedAnimal;
    animalVariation = savedVariation;

    fetchNewGrid(function(data) {
      GRID_SIZE = data.grid_size || 10;
      regionGrid = data.region_grid;
      animalPositions = data.cat_positions;
      territoryColors = data.territory_colors;
      animalType = data.animal_type || 'cat';
      animalVariation = data.animal_variation || 'cat-1.svg';

      grid = createEmptyGrid();

      for (var i = 0; i < animalPositions.length; i++) {
        grid[animalPositions[i][0]][animalPositions[i][1]] = (i === 0) ? 3 : 0;
      }

      gameRunning = true;
      if (cb) cb();
    });
  }

  var cb = null;

  function placeCat(row, col) {
    if (!gameRunning || gameOver || paused) return false;
    if (grid[row][col] === 3) return false;
    if (grid[row][col] === 1) return false;

    var result = validateCell(row, col);
    if (!result.valid) {
      lives--;
      if (lives <= 0) {
        gameOver = true;
        gameRunning = false;
        lives = 0;
        if (cb) cb('gameover');
      }
      return false;
    }

    grid[row][col] = 1;
    autoBlock(row, col);

    if (checkWin()) {
      gameOver = true;
      gameRunning = false;
      if (cb) cb('win');
      // Auto-start next level after brief celebration
      setTimeout(function() {
        gameOver = false;
        resetGame(level + 1);
      }, 600);
      return true;
    }

    return true;
  }

  function toggleX(row, col) {
    if (!gameRunning || gameOver || paused) return;
    if (grid[row][col] === 3) return;
    if (grid[row][col] === 1) return;

    if (grid[row][col] === 2) {
      grid[row][col] = 0;
    } else {
      grid[row][col] = 2;
    }
  }

  function togglePause() {
    if (!gameRunning || gameOver) return false;
    paused = !paused;
    return paused;
  }

  function toggleDebug() {
    debugMode = !debugMode;
    return debugMode;
  }

  function getDebugMode() {
    return debugMode;
  }

  function stopGameLoop() {
    gameRunning = false;
    paused = false;
  }

  window.AnimaldokuCore = {
    resetGame: function(callback) { cb = callback; resetGame(); },
    placeCat: placeCat,
    toggleX: toggleX,
    togglePause: togglePause,
    stopGameLoop: stopGameLoop,
    getGrid: function() { return grid; },
    getRegionGrid: function() { return regionGrid; },
    getAnimalPositions: function() { return animalPositions; },
    getLives: function() { return lives; },
    getLevel: function() { return level; },
    getAnimalType: function() { return animalType; },
    getAnimalVariation: function() { return animalVariation; },
    getTerritoryColors: function() { return territoryColors; },
    getGridSize: function() { return GRID_SIZE; },
    getGameOver: function() { return gameOver; },
    getGameRunning: function() { return gameRunning; },
    getPaused: function() { return paused; },
    toggleDebug: toggleDebug,
    getDebugMode: getDebugMode,
  };
})();