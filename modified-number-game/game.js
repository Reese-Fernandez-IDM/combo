<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>2048 - 6x6 Neon Edition</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #000000;  /* black background */
      color: #f0f0f0;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 0;
      padding: 20px;
    }

    h1 {
      font-size: 48px;
      margin: 20px 0;
    }

    #game-container {
      width: 600px;
      height: 600px;
      background: #333333;
      border-radius: 6px;
      padding: 10px;
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      grid-gap: 10px;
    }

    .tile {
      width: 80px;
      height: 80px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 24px;
      font-weight: bold;
      border-radius: 6px;
      color: #ffffff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.4);
      transition: transform 0.2s ease;
    }

    .tile:hover {
      transform: scale(1.05);
    }

    /* Neon colors for tile values */
    .tile[data-value="2"]    { background: #00ffff; color: #000; }
    .tile[data-value="4"]    { background: #00ff99; color: #000; }
    .tile[data-value="8"]    { background: #ffff00; color: #000; }
    .tile[data-value="16"]   { background: #ff9900; color: #000; }
    .tile[data-value="32"]   { background: #ff0066; }
    .tile[data-value="64"]   { background: #ff0000; }
    .tile[data-value="128"]  { background: #cc00ff; }
    .tile[data-value="256"]  { background: #6600ff; }
    .tile[data-value="512"]  { background: #0066ff; }
    .tile[data-value="1024"] { background: #00ccff; color: #000; }
    .tile[data-value="2048"] { background: #00ff00; color: #000; }
  </style>
</head>
<body>
  <h1>2048 - 6x6</h1>
  <div id="game-container"></div>
  <p>Use arrow keys (↑ ↓ ← →) to play</p>

  <script>
    const gameContainer = document.getElementById("game-container");
    const GRID_SIZE = 6;
    let grid = [];

    function init() {
      grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
      addNumber();
      addNumber();
      draw();
    }

    function addNumber() {
      let options = [];
      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          if (grid[i][j] === 0) {
            options.push({x: i, y: j});
          }
        }
      }
      if (options.length > 0) {
        let spot = options[Math.floor(Math.random() * options.length)];
        grid[spot.x][spot.y] = Math.random() > 0.1 ? 2 : 4;
      }
    }

    function draw() {
      gameContainer.innerHTML = "";
      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          let tile = document.createElement("div");
          tile.classList.add("tile");
          let value = grid[i][j];
          if (value !== 0) {
            tile.textContent = value;
            tile.dataset.value = value;
            tile.style.fontSize = getFontSize(value);
          } else {
            tile.dataset.value = 0;
          }
          gameContainer.appendChild(tile);
        }
      }
    }

    function getFontSize(value) {
      if (value < 100) return "24px";
      if (value < 1000) return "20px";
      if (value < 10000) return "16px";
      return "14px";
    }

    function slide(row) {
      row = row.filter(val => val);
      for (let i = 0; i < row.length - 1; i++) {
        if (row[i] === row[i + 1]) {
          row[i] *= 2;
          row[i + 1] = 0;
        }
      }
      row = row.filter(val => val);
      while (row.length < GRID_SIZE) {
        row.push(0);
      }
      return row;
    }

    function rotateGrid() {
      let newGrid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          newGrid[i][j] = grid[j][i];
        }
      }
      grid = newGrid;
    }

    function flipGrid() {
      for (let i = 0; i < GRID_SIZE; i++) {
        grid[i].reverse();
      }
    }

    function keyPressed(event) {
      let flipped = false;
      let rotated = false;
      let played = true;

      switch (event.key) {
        case "ArrowRight":
          break;
        case "ArrowLeft":
          flipGrid();
          flipped = true;
          break;
        case "ArrowDown":
          rotateGrid();
          flipped = true;
          break;
        case "ArrowUp":
          rotateGrid();
          flipGrid();
          rotated = true;
          flipped = true;
          break;
        default:
          played = false;
      }

      if (played) {
        let past = JSON.stringify(grid);
        for (let i = 0; i < GRID_SIZE; i++) {
          grid[i] = slide(grid[i]);
        }
        if (flipped) flipGrid();
        if (rotated) {
          rotateGrid();
          rotateGrid();
          rotateGrid();
        }
        let present = JSON.stringify(grid);
        if (past !== present) {
          addNumber();
        }
        draw();
      }
    }

    window.addEventListener("keydown", keyPressed);
    init();
  </script>
</body>
</html>
