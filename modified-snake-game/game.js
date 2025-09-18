(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', {alpha: false});
  const COLS = 24, ROWS = 24;
  const cellSize = Math.floor(canvas.width / COLS);
  const scoreDisplay = document.getElementById('scoreDisplay');
  const levelDisplay = document.getElementById('levelDisplay');
  const difficultySelect = document.getElementById('difficulty');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const upBtn = document.getElementById('upBtn');
  const downBtn = document.getElementById('downBtn');
  const leftBtn = document.getElementById('leftBtn');
  const rightBtn = document.getElementById('rightBtn');

  let lastTime = 0, accumulator = 0, running = false, paused = false;
  let snake, dir, nextDir, food, score, level, speed;

  function resetState(){
    const midX = Math.floor(COLS/2);
    const midY = Math.floor(ROWS/2);
    snake = [{x: midX, y: midY},{x: midX-1, y: midY},{x: midX-2, y: midY}];
    dir = {x:1,y:0}; nextDir = {x:1,y:0};
    placeFood();
    score = 0; level = parseInt(difficultySelect.value,10) || 1;
    speed = getSpeedForLevel(level);
    updateUI();
  }

  function getSpeedForLevel(l){ return [0,6,9,14,20][l] || 9; }

  function updateUI(){ scoreDisplay.textContent = score; levelDisplay.textContent = level; }

  function placeFood(){
    const occupied = new Set(snake.map(p=>p.x+','+p.y));
    while(true){
      const x = Math.floor(Math.random()*COLS);
      const y = Math.floor(Math.random()*ROWS);
      if(!occupied.has(x+','+y)){ food = {x,y}; return; }
    }
  }

  function drawCell(x,y){ ctx.fillRect(x*cellSize,y*cellSize,cellSize,cellSize); }

  function render(){
    ctx.fillStyle='#04121a'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#22c55e'; drawCell(food.x,food.y);
    for(let i=0;i<snake.length;i++){
      const p=snake[i]; ctx.fillStyle=i===0?'#7af089':'#1d9c54'; drawCell(p.x,p.y);
    }
  }

  function step(){
    dir=nextDir;
    const newHead={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
    if(newHead.x<0||newHead.x>=COLS||newHead.y<0||newHead.y>=ROWS) return gameOver();
    if(snake.some(p=>p.x===newHead.x&&p.y===newHead.y)) return gameOver();
    snake.unshift(newHead);
    if(newHead.x===food.x&&newHead.y===food.y){ score+=10*level; placeFood(); }
    else snake.pop();
    updateUI();
  }

  function gameOver(){ running=false; paused=false; alert('Game Over — score: '+score); }

  function gameLoop(ts){
    if(!running){ lastTime=ts; return requestAnimationFrame(gameLoop); }
    if(paused){ lastTime=ts; return requestAnimationFrame(gameLoop); }
    const dt=(ts-lastTime)/1000; lastTime=ts; accumulator+=dt;
    const interval=1/speed;
    while(accumulator>=interval){ step(); accumulator-=interval; }
    render(); requestAnimationFrame(gameLoop);
  }

  function setDirection(x,y){ if(x===-dir.x&&y===-dir.y) return; nextDir={x,y}; }

  window.addEventListener('keydown',e=>{
    if(['ArrowUp','w','W'].includes(e.key)) setDirection(0,-1);
    if(['ArrowDown','s','S'].includes(e.key)) setDirection(0,1);
    if(['ArrowLeft','a','A'].includes(e.key)) setDirection(-1,0);
    if(['ArrowRight','d','D'].includes(e.key)) setDirection(1,0);
    if(['p','P'].includes(e.key)) togglePause();
  });

  upBtn.onclick=()=>setDirection(0,-1);
  downBtn.onclick=()=>setDirection(0,1);
  leftBtn.onclick=()=>setDirection(-1,0);
  rightBtn.onclick=()=>setDirection(1,0);
  startBtn.onclick=()=>{ resetState(); running=true; paused=false; lastTime=performance.now(); };
  pauseBtn.onclick=togglePause;
  resetBtn.onclick=()=>{ running=false; paused=false; resetState(); render(); };
  difficultySelect.onchange=()=>{ level=parseInt(difficultySelect.value,10); speed=getSpeedForLevel(level); updateUI(); };
  function togglePause(){ if(!running) return; paused=!paused; pauseBtn.textContent=paused?'Resume':'Pause'; }

  resetState(); render(); requestAnimationFrame(gameLoop);
})();
