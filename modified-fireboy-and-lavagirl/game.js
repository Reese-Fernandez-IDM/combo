// Fireboy & Watergirl - simple two-player canvas platformer
// Controls:
// Fireboy: A, D, W
// Watergirl: ArrowLeft, ArrowRight, ArrowUp

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const restartBtn = document.getElementById('restartBtn');

const GRAVITY = 0.9;
const FRICTION = 0.86;
const PLAYER_SPEED = 3.2;
const JUMP_POWER = 15;

// --- Level definition (platforms, hazards, doors) ---
const level = {
  width: canvas.width,
  height: canvas.height,
  platforms: [
    // ground
    { x: 0, y: 500, w: 960, h: 40 },
    // small platforms
    { x: 120, y: 400, w: 160, h: 16 },
    { x: 320, y: 330, w: 140, h: 16 },
    { x: 520, y: 260, w: 140, h: 16 },
    { x: 760, y: 360, w: 120, h: 16 },
    { x: 420, y: 440, w: 120, h: 16 }
  ],
  lava: [
    // lava pools (red) - Fireboy safe here, Watergirl dies
    { x: 0, y: 540-24, w: 160, h: 24 },
    { x: 600, y: 540-24, w: 120, h: 24 }
  ],
  water: [
    // water pools (blue) - Watergirl safe here, Fireboy dies
    { x: 240, y: 540-24, w: 160, h: 24 },
    { x: 420, y: 540-24, w: 80, h: 24 }
  ],
  doors: [
    // door for Fireboy (orange) and Watergirl (blue)
    { x: 840, y: 460, w: 48, h: 40, for: 'fire' },
    { x: 40, y: 440, w: 48, h: 40, for: 'water' }
  ],
};

// --- Player factory ---
function createPlayer(kind, x, y) {
  return {
    kind, // 'fire' or 'water'
    x, y,
    w: 32, h: 48,
    vx: 0, vy: 0,
    onGround: false,
    alive: true,
    startX: x, startY: y
  };
}

const fire = createPlayer('fire', 80, 420);
const water = createPlayer('water', 120, 420);

let keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

restartBtn.addEventListener('click', resetLevel);

function resetPlayer(p) {
  p.x = p.startX; p.y = p.startY;
  p.vx = 0; p.vy = 0; p.alive = true; p.onGround = false;
}

function resetLevel() {
  resetPlayer(fire);
  resetPlayer(water);
  statusEl.textContent = '';
}

function rectsIntersect(a,b){
  return !(a.x + a.w <= b.x || a.x >= b.x + b.w || a.y + a.h <= b.y || a.y >= b.y + b.h);
}

function applyControls(p) {
  if (!p.alive) return;
  if (p.kind === 'fire') {
    if (keys['a'] || keys['A']) p.vx = -PLAYER_SPEED;
    else if (keys['d'] || keys['D']) p.vx = PLAYER_SPEED;
    else p.vx *= FRICTION;

    if ((keys['w'] || keys['W']) && p.onGround) {
      p.vy = -JUMP_POWER; p.onGround = false;
    }
  } else {
    if (keys['ArrowLeft']) p.vx = -PLAYER_SPEED;
    else if (keys['ArrowRight']) p.vx = PLAYER_SPEED;
    else p.vx *= FRICTION;

    if (keys['ArrowUp'] && p.onGround) {
      p.vy = -JUMP_POWER; p.onGround = false;
    }
  }
}

// collision resolution with platforms (simple AABB)
function handlePlatformCollisions(p) {
  p.onGround = false;
  // move horizontally, then check platforms
  p.x += p.vx;
  for (let plat of level.platforms) {
    const box = { x: plat.x, y: plat.y, w: plat.w, h: plat.h };
    if (rectsIntersect(p, box)) {
      // moving right
      if (p.vx > 0) p.x = box.x - p.w;
      else if (p.vx < 0) p.x = box.x + box.w;
      p.vx = 0;
    }
  }
  // keep inside canvas horizontally
  if (p.x < 0) { p.x = 0; p.vx = 0; }
  if (p.x + p.w > level.width) { p.x = level.width - p.w; p.vx = 0; }

  // vertical movement
  p.vy += GRAVITY;
  p.y += p.vy;
  for (let plat of level.platforms) {
    const box = { x: plat.x, y: plat.y, w: plat.w, h: plat.h };
    if (rectsIntersect(p, box)) {
      // falling
      if (p.vy > 0) {
        p.y = box.y - p.h;
        p.vy = 0;
        p.onGround = true;
      } else if (p.vy < 0) {
        // hitting head
        p.y = box.y + box.h;
        p.vy = 0;
      }
    }
  }

  // floor check (if below canvas)
  if (p.y + p.h > level.height) {
    p.y = level.height - p.h;
    p.vy = 0;
    p.onGround = true;
  }
}

// check hazards (water/lava)
function checkHazards(p) {
  if (!p.alive) return;
  // water
  for (let w of level.water) {
    const box = { x: w.x, y: w.y, w: w.w, h: w.h };
    if (rectsIntersect(p, box)) {
      if (p.kind === 'fire') {
        // fireboy dies in water
        p.alive = false;
        return;
      } else {
        // watergirl safe
      }
    }
  }
  // lava
  for (let l of level.lava) {
    const box = { x: l.x, y: l.y, w: l.w, h: l.h };
    if (rectsIntersect(p, box)) {
      if (p.kind === 'water') {
        p.alive = false;
        return;
      } else {
        // fireboy safe
      }
    }
  }
}

// check doors
function checkDoors() {
  const reached = { fire:false, water:false };
  for (let d of level.doors) {
    const door = { x: d.x, y: d.y, w: d.w, h: d.h };
    if (d.for === 'fire' && rectsIntersect(fire, door) && fire.alive) reached.fire = true;
    if (d.for === 'water' && rectsIntersect(water, door) && water.alive) reached.water = true;
  }
  if (reached.fire && reached.water) {
    statusEl.textContent = 'Level Complete! Both reached their doors 🎉';
    // freeze players
    fire.alive = false;
    water.alive = false;
  } else {
    let msgs = [];
    if (reached.fire) msgs.push('Fireboy at door');
    if (reached.water) msgs.push('Watergirl at door');
    statusEl.textContent = msgs.join(' — ');
  }
}

function update() {
  // controls
  applyControls(fire);
  applyControls(water);

  // flight physics & collisions
  handlePlatformCollisions(fire);
  handlePlatformCollisions(water);

  // hazards & death
  checkHazards(fire);
  checkHazards(water);

  // respawn dead players after a short delay
  if (!fire.alive) {
    // quick visual reset
    setTimeout(()=> resetPlayer(fire), 350);
  }
  if (!water.alive) {
    setTimeout(()=> resetPlayer(water), 350);
  }

  // check doors
  checkDoors();
}

function drawRoundedRect(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function draw() {
  // background
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // draw platforms
  ctx.fillStyle = '#7a5c3a';
  ctx.strokeStyle = '#5b432b';
  for (let p of level.platforms) {
    drawRoundedRect(p.x, p.y, p.w, p.h, 6);
  }

  // lava
  for (let l of level.lava) {
    ctx.fillStyle = '#ff6b4a';
    ctx.fillRect(l.x, l.y, l.w, l.h);
    // wavy accents
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i=0;i<l.w;i+=12) ctx.fillRect(l.x+i, l.y+6 + Math.sin((Date.now()/200)+i)*4, 10, 6);
  }

  // water
  for (let w of level.water) {
    ctx.fillStyle = '#4ab3ff';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i=0;i<w.w;i+=12) ctx.fillRect(w.x+i, w.y+6 + Math.cos((Date.now()/200)+i)*4, 10, 6);
  }

  // doors
  for (let d of level.doors) {
    if (d.for === 'fire') {
      ctx.fillStyle = '#ff8c2b';
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.strokeStyle = '#8a4d00';
      ctx.strokeRect(d.x, d.y, d.w, d.h);
    } else {
      ctx.fillStyle = '#3ea5ff';
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.strokeStyle = '#005b9a';
      ctx.strokeRect(d.x, d.y, d.w, d.h);
    }
  }

  // players
  drawPlayer(fire);
  drawPlayer(water);
}

function drawPlayer(p) {
  // body
  if (!p.alive) ctx.globalAlpha = 0.5;
  if (p.kind === 'fire') {
    ctx.fillStyle = '#ff7d2a';
    ctx.strokeStyle = '#8a3d00';
  } else {
    ctx.fillStyle = '#2ea6ff';
    ctx.strokeStyle = '#004f8a';
  }
  drawRoundedRect(p.x, p.y, p.w, p.h, 6);

  // face (simple eyes)
  ctx.fillStyle = '#fff';
  ctx.fillRect(p.x + 6, p.y + 12, 6, 6);
  ctx.fillRect(p.x + p.w - 12, p.y + 12, 6, 6);
  ctx.fillStyle = '#000';
  ctx.fillRect(p.x + 7, p.y + 13, 2, 2);
  ctx.fillRect(p.x + p.w - 11, p.y + 13, 2, 2);

  ctx.globalAlpha = 1;
}

// main loop
function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

resetLevel();
loop();
