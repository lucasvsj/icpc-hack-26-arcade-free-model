// ORBIT RUSH - one-tap orbital arcade game (Phaser 3)
// Tap / click / space / enter / up / W to switch orbit (arcade P1A + START1 also work)
// Dodge spikes, collect gems, build combos, grab shields, survive.
// M toggles sound. Best score is saved locally.

const D2R = Math.PI / 180;

const ACTION_KEYS = {
  ' ': 1, 'Enter': 1, 'ArrowUp': 1, 'w': 1, 'W': 1,
  'P1A': 1, 'P1B': 1, 'P1C': 1, 'P1X': 1, 'P1Y': 1, 'P1Z': 1, 'START1': 1,
  'P2A': 1, 'P2B': 1, 'P2C': 1, 'P2X': 1, 'P2Y': 1, 'P2Z': 1, 'START2': 1
};

const COL = {
  cyan: 0x39e7ff,
  blue: 0x2f7fd8,
  magenta: 0xff3d8b,
  gold: 0xffd24a,
  white: 0xffffff,
  gray: 0x8394b8,
  orange: 0xff9e3b,
  green: 0x4dffa6
};

// 5x8 pixel font, column major (bit 0 = top row)
const FONT = {
  'A': [126, 9, 9, 9, 126],
  'B': [127, 73, 73, 73, 54],
  'C': [62, 65, 65, 65, 34],
  'D': [127, 65, 65, 65, 62],
  'E': [127, 73, 73, 73, 65],
  'F': [127, 9, 9, 9, 1],
  'G': [62, 65, 73, 73, 122],
  'H': [127, 8, 8, 8, 127],
  'I': [0, 65, 127, 65, 0],
  'J': [32, 64, 65, 63, 1],
  'K': [127, 8, 20, 34, 65],
  'L': [127, 64, 64, 64, 64],
  'M': [127, 2, 12, 2, 127],
  'N': [127, 2, 4, 8, 127],
  'O': [62, 65, 65, 65, 62],
  'P': [127, 9, 9, 9, 6],
  'Q': [62, 65, 81, 33, 94],
  'R': [127, 9, 25, 41, 70],
  'S': [70, 73, 73, 73, 49],
  'T': [1, 1, 127, 1, 1],
  'U': [63, 64, 64, 64, 63],
  'V': [31, 32, 64, 32, 31],
  'W': [127, 32, 24, 32, 127],
  'X': [99, 20, 8, 20, 99],
  'Y': [3, 4, 120, 4, 3],
  'Z': [97, 81, 73, 69, 67],
  '0': [62, 81, 73, 69, 62],
  '1': [0, 66, 127, 64, 0],
  '2': [66, 97, 81, 73, 70],
  '3': [33, 65, 69, 75, 49],
  '4': [24, 20, 18, 127, 16],
  '5': [39, 69, 69, 69, 57],
  '6': [60, 74, 73, 73, 48],
  '7': [1, 113, 9, 5, 3],
  '8': [54, 73, 73, 73, 54],
  '9': [6, 73, 73, 41, 30],
  '!': [0, 0, 95, 0, 0],
  '+': [8, 8, 62, 8, 8],
  '-': [8, 8, 8, 8, 8],
  '.': [0, 96, 96, 0, 0],
  ':': [0, 0, 54, 54, 0],
  '/': [64, 48, 8, 6, 1],
  "'": [0, 0, 3, 0, 0],
  ' ': [0, 0, 0, 0, 0]
};

const config = {
  type: Phaser.AUTO,
  width: 400,
  height: 700,
  backgroundColor: '#07070f',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: {
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);

// ---------- runtime state ----------
let scene = null;
let gfx = null;

let W = 400;
let H = 700;
let CX = 200;
let CY = 330;
let R = [95, 150];

let state = 'menu';
let stateT = 0;
let now = 0;

let player = { angle: 0, travel: 0, ring: 1, r: 150, dir: 1, shield: false, inv: 0 };
let spikes = [];
let gems = [];
let shields = [];
let parts = [];
let pops = [];
let waves = [];
let trail = [];
let stars = [];

let score = 0;
let best = 0;
let combo = 0;
let maxCombo = 0;
let gemsGot = 0;
let level = 1;
let lastMult = 1;
let dist = 0;
let survAcc = 0;
let nextT = 0;
let runs = 0;
let hintT = 0;
let switchCd = 0;
let corePulse = 0;
let revTimer = 0;
let revWarn = 0;
let newRecord = false;
let newBestShown = false;
let muted = false;
let beatTimer = null;
let beatStep = 0;
let mutedBtn = { x: 0, y: 0, w: 36, h: 36 };

// ---------- setup ----------
function create() {
  scene = this;
  gfx = this.add.graphics();

  best = loadNum('orbitrush_best', 0);
  muted = loadNum('orbitrush_muted', 0) === 1;

  makeStars();
  layout(this.scale.width, this.scale.height);

  this.scale.on('resize', function (gs) {
    layout(gs.width, gs.height);
  });

  this.input.on('pointerdown', function (p) {
    if (p.x >= mutedBtn.x && p.x <= mutedBtn.x + mutedBtn.w &&
        p.y >= mutedBtn.y && p.y <= mutedBtn.y + mutedBtn.h) {
      toggleMute();
      return;
    }
    press();
  });

  this.input.keyboard.addCapture(['SPACE', 'ENTER', 'UP']);
  this.input.keyboard.on('keydown', function (e) {
    if (e.key === 'm' || e.key === 'M') {
      toggleMute();
      return;
    }
    if (ACTION_KEYS[e.key]) press();
  });

  player.r = R[1];
  state = 'menu';
  stateT = 0;
}

function layout(w, h) {
  W = Math.max(120, w || 400);
  H = Math.max(120, h || 700);
  CX = W * 0.5;
  CY = H * 0.47;
  const outer = Math.min(W * 0.375, H * 0.3, 260);
  R[0] = outer * 0.63;
  R[1] = outer;
  if (state === 'menu' || state === 'playing') {
    if (Math.abs(player.r - R[player.ring]) < 4) player.r = R[player.ring];
  }
  mutedBtn.x = W - 46;
  mutedBtn.y = 12;
}

function makeStars() {
  stars = [];
  for (let i = 0; i < 52; i++) {
    stars.push({
      a: Math.random() * 6.283,
      d: 0.18 + Math.random() * 0.82,
      s: (Math.random() - 0.5) * 0.06,
      ph: Math.random() * 6.283,
      sz: 0.7 + Math.random() * 1.6
    });
  }
}

// ---------- input ----------
function press() {
  resumeAudio();
  if (state === 'menu') {
    startRun();
  } else if (state === 'playing') {
    trySwitch();
  } else if (state === 'gameover') {
    if (stateT > 550) startRun();
  }
}

function trySwitch() {
  if (switchCd > 0 || state !== 'playing') return;
  player.ring = player.ring === 1 ? 0 : 1;
  switchCd = 90;
  tone(430, 0.05, 'square', 0.045, 640);
  vibrate(8);
}

function toggleMute() {
  muted = !muted;
  save('orbitrush_muted', muted ? 1 : 0);
  vibrate(12);
  if (muted) {
    stopMusic();
  } else {
    resumeAudio();
    if (state === 'playing') startMusic();
    tone(760, 0.06, 'square', 0.05);
  }
}

// ---------- game flow ----------
function startRun() {
  state = 'playing';
  stateT = 0;
  score = 0;
  combo = 0;
  maxCombo = 0;
  gemsGot = 0;
  level = 1;
  lastMult = 1;
  dist = 0;
  survAcc = 0;
  spikes = [];
  gems = [];
  shields = [];
  parts = [];
  pops = [];
  waves = [];
  trail = [];
  player.angle = 0;
  player.ring = 1;
  player.r = R[1];
  player.dir = 1;
  player.shield = false;
  player.inv = 0;
  switchCd = 0;
  revTimer = 12000;
  revWarn = 0;
  corePulse = 0;
  newRecord = false;
  newBestShown = false;
  nextT = player.angle + 132;
  runs++;
  save('orbitrush_runs', runs);
  hintT = runs < 5 ? 3.2 : 2.1;
  startMusic();
  tone(540, 0.06, 'square', 0.05);
  tone(810, 0.09, 'square', 0.045);
}

function levelUp(nl) {
  level = nl;
  pops.push({ x: CX, y: CY, txt: 'LEVEL ' + level, color: COL.cyan, life: 1.15, max: 1.15, size: 3.4 });
  waves.push({ x: CX, y: CY, r: 10, max: R[1] * 1.5, life: 0.55, maxLife: 0.55, color: COL.cyan });
  corePulse = 1.2;
  tone(523, 0.08, 'sine', 0.05);
  tone(659, 0.08, 'sine', 0.05);
  tone(784, 0.12, 'sine', 0.055);
  vibrate(18);
}

function spawnGap() {
  let g = Math.max(78, 132 - (level - 1) * 5.5);
  const minD = omegaDeg() * 0.36;
  if (g < minD) g = minD;
  return g;
}

function omegaDeg() {
  let rad = 1.85 * Math.pow(1.065, level - 1);
  if (rad > 4.6) rad = 4.6;
  return rad / D2R;
}

function comboMult() {
  return Math.min(10, 1 + Math.floor(combo / 5));
}

function rndRing() {
  return Math.random() < 0.5 ? 0 : 1;
}

function addSpike(a, ring, wob) {
  spikes.push({ a: a, ring: ring, ph: Math.random() * 6.283, wob: !!wob });
}

function addGem(a, ring) {
  gems.push({ a: a, ring: ring, ph: Math.random() * 6.283 });
}

function addShield(a, ring) {
  shields.push({ a: a, ring: ring, ph: Math.random() * 6.283 });
}

function spawnPattern(at) {
  const dirf = player.dir;
  const off = Math.max(1, omegaDeg() / 200);
  const pool = [];

  pool.push({ w: 3, f: function () { addSpike(at, rndRing(), false); return 0; } });
  pool.push({ w: 3, f: function () { addGem(at, rndRing()); return 0; } });

  if (level >= 2) {
    pool.push({ w: 2, f: function () {
      const r = rndRing();
      addGem(at, r);
      addGem(at + 28 * off * dirf, r);
      return 28 * off;
    } });
    pool.push({ w: 2, f: function () {
      const r = rndRing();
      addSpike(at, r, false);
      addSpike(at + 32 * off * dirf, 1 - r, false);
      return 32 * off;
    } });
  }
  if (level >= 3) {
    pool.push({ w: 2, f: function () { addSpike(at, rndRing(), true); return 0; } });
    pool.push({ w: 1, f: function () {
      const r = rndRing();
      addGem(at, r);
      addSpike(at + 26 * off * dirf, r, false);
      return 26 * off;
    } });
  }
  if (level >= 4) {
    pool.push({ w: 1, f: function () {
      const r = rndRing();
      addSpike(at, r, false);
      addGem(at + 28 * off * dirf, 1 - r);
      addSpike(at + 56 * off * dirf, r, false);
      return 56 * off;
    } });
  }
  if (level >= 2 && !player.shield && Math.random() < 0.12) {
    pool.push({ w: 1, f: function () { addShield(at, rndRing()); return 0; } });
  }

  let total = 0;
  for (let i = 0; i < pool.length; i++) total += pool[i].w;
  let pick = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    pick -= pool[i].w;
    if (pick <= 0) return pool[i].f();
  }
  return pool[0].f();
}

// ---------- collisions ----------
function wrapSigned(d) {
  d = d % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

function entPos(a, r) {
  const rad = a * D2R;
  return { x: CX + Math.sin(rad) * r, y: CY - Math.cos(rad) * r };
}

function playerPos() {
  return entPos(player.angle, player.r);
}

function updateEntities() {
  for (let i = spikes.length - 1; i >= 0; i--) {
    const s = spikes[i];
    const eff = s.a + (s.wob ? Math.sin(now * 0.0016 + s.ph) * 10 : 0);
    const rel = wrapSigned(eff - player.angle);
    const ar = Math.abs(rel);
    const rr = R[s.ring];
    if (ar < 9 && Math.abs(player.r - rr) < 20) {
      hitSpike(s);
      return;
    }
    if (rel * player.dir < -12) {
      if (!s.near) {
        s.near = true;
        if (Math.abs(player.r - rr) < 34) closeCall(s);
      }
      spikes.splice(i, 1);
    }
  }

  for (let i = gems.length - 1; i >= 0; i--) {
    const g = gems[i];
    const rel = wrapSigned(g.a - player.angle);
    const rr = R[g.ring];
    if (Math.abs(rel) < 11 && Math.abs(player.r - rr) < 18) {
      collectGem(g, i);
      continue;
    }
    if (rel * player.dir < -12) gems.splice(i, 1);
  }

  for (let i = shields.length - 1; i >= 0; i--) {
    const sh = shields[i];
    const rel = wrapSigned(sh.a - player.angle);
    const rr = R[sh.ring];
    if (Math.abs(rel) < 12 && Math.abs(player.r - rr) < 20) {
      collectShield(sh, i);
      continue;
    }
    if (rel * player.dir < -12) shields.splice(i, 1);
  }
}

function collectGem(g, i) {
  gems.splice(i, 1);
  combo++;
  gemsGot++;
  if (combo > maxCombo) maxCombo = combo;
  const mult = comboMult();
  const gain = 10 * mult;
  score += gain;
  const p = entPos(g.a, R[g.ring]);
  pops.push({ x: p.x, y: p.y, txt: '+' + gain, color: COL.gold, life: 0.85, max: 0.85, size: 2.6 });
  if (mult > lastMult) {
    lastMult = mult;
    pops.push({ x: CX, y: CY + R[0] * 0.4, txt: 'X' + mult, color: COL.gold, life: 1.2, max: 1.2, size: 4.2 });
    tone(880, 0.1, 'sine', 0.045);
  }
  waves.push({ x: p.x, y: p.y, r: 5, max: 46, life: 0.35, maxLife: 0.35, color: COL.gold });
  spark(p.x, p.y, COL.gold, 7, 70);
  corePulse = Math.min(1.5, corePulse + 0.5);
  toneGem();
  vibrate(8);
}

function collectShield(sh, i) {
  shields.splice(i, 1);
  player.shield = true;
  const p = entPos(sh.a, R[sh.ring]);
  pops.push({ x: p.x, y: p.y, txt: 'SHIELD', color: COL.cyan, life: 1.1, max: 1.1, size: 2.6 });
  waves.push({ x: p.x, y: p.y, r: 6, max: 60, life: 0.45, maxLife: 0.45, color: COL.cyan });
  spark(p.x, p.y, COL.cyan, 10, 80);
  tone(520, 0.08, 'sine', 0.05);
  tone(780, 0.12, 'sine', 0.045);
  vibrate(15);
}

function closeCall(s) {
  score += 25;
  const p = entPos(s.a, R[s.ring]);
  pops.push({ x: p.x, y: p.y, txt: 'CLOSE +25', color: COL.cyan, life: 0.9, max: 0.9, size: 2.2 });
  spark(p.x, p.y, COL.cyan, 5, 50);
  tone(900, 0.1, 'sawtooth', 0.03, 260);
}

function hitSpike(s) {
  if (player.inv > 0) return;
  if (player.shield) {
    player.shield = false;
    player.inv = 1.2;
    const p = entPos(s.a, R[s.ring]);
    waves.push({ x: p.x, y: p.y, r: 8, max: 90, life: 0.5, maxLife: 0.5, color: COL.cyan });
    spark(p.x, p.y, COL.cyan, 18, 140);
    tone(320, 0.22, 'square', 0.07, 900);
    scene.cameras.main.shake(150, 0.006);
    vibrate(35);
    const idx = spikes.indexOf(s);
    if (idx >= 0) spikes.splice(idx, 1);
    return;
  }
  die();
}

function die() {
  state = 'dying';
  stateT = 0;
  const p = playerPos();
  explosion(p.x, p.y);
  scene.cameras.main.shake(340, 0.013);
  scene.cameras.main.flash(130, 200, 20, 70);
  vibrate(140);
  tone(230, 0.5, 'sawtooth', 0.09, 55);
  tone(120, 0.4, 'square', 0.06, 42);
  stopMusic();
  if (score > best) {
    best = score;
    save('orbitrush_best', best);
    newRecord = true;
  } else {
    newRecord = false;
  }
  newBestShown = false;
}

// ---------- update ----------
function update(time, delta) {
  now = time;
  const dt = Math.min(delta, 33) / 1000;
  stateT += delta;
  if (switchCd > 0) switchCd -= delta;
  if (hintT > 0) hintT -= dt;
  corePulse *= Math.pow(0.002, dt);

  gfx.clear();
  drawSpace(dt);

  if (state === 'menu') {
    menuUpdate(dt);
    drawWorld();
    drawMenu();
  } else if (state === 'playing') {
    playUpdate(dt, delta);
    drawWorld();
    drawHUD();
  } else if (state === 'dying') {
    if (stateT > 480 && newRecord && !newBestShown) {
      newBestShown = true;
      tone(523, 0.1, 'sine', 0.05);
      tone(659, 0.1, 'sine', 0.05);
      tone(784, 0.1, 'sine', 0.05);
      tone(1046, 0.2, 'sine', 0.055);
      for (let k = 0; k < 24; k++) {
        spark(CX + (Math.random() - 0.5) * W * 0.5, CY + (Math.random() - 0.5) * H * 0.2, COL.cyan, 1, 120);
      }
    }
    if (stateT > 980) {
      state = 'gameover';
      stateT = 0;
      trail = [];
    }
    drawWorld();
    drawHUD();
  } else if (state === 'gameover') {
    drawWorld();
    drawGameOver();
  }

  drawFx(dt);
}

function menuUpdate(dt) {
  player.travel += 42 * dt;
  player.angle = player.travel;
  const wantRing = Math.floor(now / 2300) % 2 === 0 ? 1 : 0;
  player.ring = wantRing;
  const target = R[player.ring];
  player.r += (target - player.r) * Math.min(1, dt * 6);
  trail.push(playerPos());
  if (trail.length > 16) trail.shift();
}

function playUpdate(dt, delta) {
  const wd = omegaDeg();
  const step = wd * dt;
  player.angle += player.dir * step;
  dist += step;
  survAcc += step;
  while (survAcc >= 20) {
    survAcc -= 20;
    score++;
  }

  const target = R[player.ring];
  player.r += (target - player.r) * Math.min(1, dt * 14);
  if (Math.abs(player.r - target) < 0.4) player.r = target;

  if (player.inv > 0) player.inv -= dt;

  const nl = 1 + Math.floor(gemsGot / 9) + Math.floor(dist / 1600);
  if (nl > level) levelUp(nl);

  const gapNow = spawnGap();
  let guard = 0;
  while (guard++ < 4) {
    const ahead = wrapSigned(nextT - player.angle) * player.dir;
    if (ahead > gapNow || ahead < -5) break;
    nextT += player.dir * (spawnPattern(nextT) + gapNow);
  }

  if (level >= 4) {
    if (revWarn > 0) {
      revWarn -= delta;
      if (revWarn <= 0) {
        player.dir *= -1;
        nextT = player.angle + player.dir * spawnGap();
        revTimer = 12000 + Math.random() * 8000;
        pops.push({ x: CX, y: CY, txt: 'REVERSE!', color: COL.orange, life: 1.1, max: 1.1, size: 3.2 });
        waves.push({ x: CX, y: CY, r: 10, max: R[1] * 1.4, life: 0.5, maxLife: 0.5, color: COL.orange });
        tone(300, 0.14, 'square', 0.05, 140);
        vibrate(25);
      }
    } else {
      revTimer -= delta;
      if (revTimer <= 0) {
        revWarn = 950;
        tone(660, 0.05, 'square', 0.04);
      }
    }
  }

  trail.push(playerPos());
  if (trail.length > 16) trail.shift();

  updateEntities();
}

// ---------- fx ----------
function spark(x, y, color, n, spd) {
  const count = n || 1;
  const speed = spd || 70;
  const s = Math.max(0.7, Math.min(1.6, R[1] / 150));
  for (let i = 0; i < count; i++) {
    const a = Math.random() * 6.283;
    const v = speed * (0.3 + Math.random());
    const life = 0.35 + Math.random() * 0.4;
    parts.push({
      x: x, y: y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: life, max: life,
      color: color,
      size: (1.6 + Math.random() * 2) * s
    });
  }
}

function explosion(x, y) {
  spark(x, y, COL.magenta, 30, 190);
  spark(x, y, COL.cyan, 16, 140);
  spark(x, y, COL.white, 10, 110);
  waves.push({ x: x, y: y, r: 8, max: 150, life: 0.6, maxLife: 0.6, color: COL.magenta });
  waves.push({ x: x, y: y, r: 4, max: 90, life: 0.45, maxLife: 0.45, color: COL.white });
}

function drawFx(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt;
    if (p.life <= 0) {
      parts.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const drag = Math.pow(0.18, dt);
    p.vx *= drag;
    p.vy *= drag;
    const alpha = Math.max(0, p.life / p.max);
    gfx.fillStyle(p.color, alpha);
    gfx.fillCircle(p.x, p.y, p.size * (0.35 + 0.65 * alpha));
  }

  for (let i = waves.length - 1; i >= 0; i--) {
    const w = waves[i];
    w.life -= dt;
    if (w.life <= 0) {
      waves.splice(i, 1);
      continue;
    }
    const t = 1 - w.life / w.maxLife;
    const rr = w.r + (w.max - w.r) * t;
    const alpha = (1 - t) * 0.8;
    gfx.lineStyle(2.5, w.color, alpha * 0.45);
    gfx.strokeCircle(w.x, w.y, rr);
    gfx.lineStyle(1.5, w.color, alpha);
    gfx.strokeCircle(w.x, w.y, rr * 0.92);
  }

  for (let i = pops.length - 1; i >= 0; i--) {
    const p = pops[i];
    p.life -= dt;
    if (p.life <= 0) {
      pops.splice(i, 1);
      continue;
    }
    p.y -= 30 * dt;
    const alpha = Math.max(0, Math.min(1, p.life / p.max));
    text(p.txt, p.x, p.y, p.size, p.color, alpha);
  }
}

// ---------- drawing ----------
function drawSpace(dt) {
  const maxD = Math.hypot(W, H) * 0.5;
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    s.a += s.s * dt;
    const x = CX + Math.cos(s.a) * s.d * maxD;
    const y = CY + Math.sin(s.a) * s.d * maxD;
    const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(now * 0.002 + s.ph));
    gfx.fillStyle(0x9fc8ff, tw * 0.55);
    gfx.fillCircle(x, y, s.sz);
  }
  gfx.fillStyle(0x1a2b6b, 0.05);
  gfx.fillCircle(CX, CY, Math.min(W, H) * 0.55);
  gfx.fillStyle(0x2a1a5b, 0.04);
  gfx.fillCircle(CX, CY, Math.min(W, H) * 0.38);
}

function drawRings() {
  for (let i = 0; i < 2; i++) {
    gfx.lineStyle(2, COL.blue, 0.5);
    gfx.strokeCircle(CX, CY, R[i]);
    const a0 = (now * 0.0006 + i * 2.4) % 6.283;
    gfx.lineStyle(3, COL.cyan, 0.16);
    gfx.beginPath();
    gfx.arc(CX, CY, R[i], a0, a0 + 0.95, false);
    gfx.strokePath();
  }
}

function coreColor() {
  const pal = [0x39e7ff, 0x6f7bff, 0xb45dff, 0xff4fa3, 0xff9e3b];
  return pal[(level - 1) % pal.length];
}

function drawCore() {
  const col = coreColor();
  const pulse = 1 + Math.sin(now * 0.003) * 0.06 + corePulse * 0.3;
  const rad = Math.min(R[0] * 0.33, 30) * pulse;
  gfx.fillStyle(col, 0.05);
  gfx.fillCircle(CX, CY, rad * 2.7);
  gfx.fillStyle(col, 0.08);
  gfx.fillCircle(CX, CY, rad * 1.7);
  gfx.fillStyle(col, 0.18);
  gfx.fillCircle(CX, CY, rad * 1.18);
  gfx.fillStyle(col, 0.9);
  gfx.fillCircle(CX, CY, rad);
  gfx.fillStyle(0xffffff, 0.9);
  gfx.fillCircle(CX, CY - rad * 0.15, rad * 0.28);
  gfx.lineStyle(2, col, 0.55);
  gfx.strokeCircle(CX, CY, rad * 1.5);
}

function drawDiamond(x, y, h) {
  const w = h * 0.8;
  gfx.fillTriangle(x, y - h, x + w, y, x, y + h);
  gfx.fillTriangle(x, y - h, x - w, y, x, y + h);
}

function spikeAngle(s) {
  return s.a + (s.wob ? Math.sin(now * 0.0016 + s.ph) * 10 : 0);
}

function drawSpike(s) {
  const S = Math.max(0.7, Math.min(1.6, R[1] / 150));
  const p = entPos(spikeAngle(s), R[s.ring]);
  const h = 10.5 * S;
  const col = s.wob ? COL.orange : COL.magenta;
  gfx.fillStyle(col, 0.14);
  drawDiamond(p.x, p.y, h * 1.65);
  gfx.fillStyle(col, 0.95);
  drawDiamond(p.x, p.y, h);
  gfx.fillStyle(0xffffff, 0.85);
  drawDiamond(p.x, p.y, h * 0.32);
}

function drawGemAt(x, y, ph, scale) {
  const S = scale || 1;
  const rr = 6.4 * S;
  const halo = rr + 2.5 * S + Math.sin(now * 0.006 + ph) * 1.4 * S;
  gfx.fillStyle(COL.gold, 0.1);
  gfx.fillCircle(x, y, halo * 2.3);
  gfx.fillStyle(COL.gold, 0.22);
  gfx.fillCircle(x, y, halo);
  gfx.fillStyle(COL.gold, 0.95);
  gfx.fillCircle(x, y, rr);
  gfx.fillStyle(0xffffff, 0.85);
  gfx.fillCircle(x - rr * 0.25, y - rr * 0.28, rr * 0.28);
  gfx.lineStyle(1.5, 0xffe9a0, 0.4);
  gfx.strokeCircle(x, y, halo + 2 * S);
}

function drawGem(g) {
  const S = Math.max(0.7, Math.min(1.6, R[1] / 150));
  const p = entPos(g.a, R[g.ring]);
  drawGemAt(p.x, p.y, g.ph, S);
}

function drawShield(sh) {
  const S = Math.max(0.7, Math.min(1.6, R[1] / 150));
  const p = entPos(sh.a, R[sh.ring]);
  const rr = 9 * S;
  const rot = now * 0.002 + sh.ph;
  gfx.fillStyle(COL.cyan, 0.14);
  gfx.fillCircle(p.x, p.y, rr * 2.2);
  for (let k = 0; k < 6; k++) {
    const a1 = rot + k * 1.047;
    const a2 = rot + (k + 1) * 1.047;
    const x1 = p.x + Math.cos(a1) * rr;
    const y1 = p.y + Math.sin(a1) * rr;
    const x2 = p.x + Math.cos(a2) * rr;
    const y2 = p.y + Math.sin(a2) * rr;
    gfx.fillStyle(COL.cyan, 0.32);
    gfx.fillTriangle(p.x, p.y, x1, y1, x2, y2);
    gfx.lineStyle(2, COL.cyan, 0.9);
    gfx.lineBetween(x1, y1, x2, y2);
  }
  gfx.fillStyle(0xffffff, 0.9);
  gfx.fillCircle(p.x, p.y, 2.2 * S);
}

function drawPlayer() {
  if (state === 'gameover' || state === 'dying') return;
  const S = Math.max(0.7, Math.min(1.7, R[1] / 150));
  const blink = player.inv > 0 && Math.floor(now / 70) % 2 === 0;

  for (let i = 0; i < trail.length; i++) {
    const t = trail[i];
    const f = i / trail.length;
    gfx.fillStyle(COL.cyan, 0.03 + f * 0.22);
    gfx.fillCircle(t.x, t.y, (2 + f * 4.5) * S);
  }

  const p = playerPos();
  if (blink) return;

  gfx.fillStyle(COL.cyan, 0.1);
  gfx.fillCircle(p.x, p.y, 17 * S);
  gfx.fillStyle(COL.cyan, 0.25);
  gfx.fillCircle(p.x, p.y, 10.5 * S);
  gfx.fillStyle(0xffffff, 0.98);
  gfx.fillCircle(p.x, p.y, 6.2 * S);

  if (player.shield) {
    const rr = 13 * S + Math.sin(now * 0.008) * 1.8 * S;
    gfx.lineStyle(2.5, COL.cyan, 0.7);
    gfx.strokeCircle(p.x, p.y, rr);
    gfx.lineStyle(1.5, COL.cyan, 0.3);
    gfx.strokeCircle(p.x, p.y, rr + 4);
  }
}

function drawWorld() {
  drawRings();
  drawCore();

  if (state === 'menu') {
    const S = Math.max(0.7, Math.min(1.4, R[1] / 150));
    for (let i = 0; i < 3; i++) {
      const a = (now * 0.018 + i * 120) % 360;
      const ring = i % 2;
      const p = entPos(a, R[ring]);
      drawGemAt(p.x, p.y, now * 0.004 + i, S * 0.85);
    }
  }

  for (let i = 0; i < spikes.length; i++) drawSpike(spikes[i]);
  for (let i = 0; i < gems.length; i++) drawGem(gems[i]);
  for (let i = 0; i < shields.length; i++) drawShield(shields[i]);
  drawPlayer();
}

function drawMuteButton() {
  const b = mutedBtn;
  gfx.fillStyle(0xffffff, 0.06);
  gfx.fillRoundedRect(b.x, b.y, b.w, b.h, 8);
  gfx.lineStyle(1, 0x39e7ff, 0.25);
  gfx.strokeRoundedRect(b.x, b.y, b.w, b.h, 8);

  const x = b.x + 8;
  const y = b.y + 9;
  gfx.fillStyle(0x9fc8ff, 0.9);
  gfx.fillRect(x, y + 5, 5, 8);
  gfx.fillTriangle(x + 5, y + 3, x + 13, y - 2, x + 13, y + 20);
  gfx.fillTriangle(x + 5, y + 15, x + 13, y + 20, x + 13, y - 2);

  if (muted) {
    gfx.lineStyle(2, COL.magenta, 0.95);
    gfx.lineBetween(b.x + 22, b.y + 11, b.x + 30, b.y + 23);
    gfx.lineBetween(b.x + 30, b.y + 11, b.x + 22, b.y + 23);
  } else {
    gfx.lineStyle(1.5, COL.cyan, 0.7);
    gfx.beginPath();
    gfx.arc(x + 13, y + 9, 8, -0.7, 0.7, false);
    gfx.strokePath();
    gfx.beginPath();
    gfx.arc(x + 13, y + 9, 12, -0.7, 0.7, false);
    gfx.strokePath();
  }
}

function drawHUD() {
  const ts = Math.max(3, Math.min(6.5, W / 82, H / 95));
  text(String(score), CX, 24, ts, COL.white, 1);
  text('BEST ' + best, CX, 24 + 8 * ts + 7, 1.7, COL.gray, 0.9);
  text('LVL ' + level, 62, 27, 1.7, COL.gray, 0.85);
  drawMuteButton();

  const comboY = Math.min(H - 52, CY + R[1] + 40);
  if (combo > 0) {
    text('COMBO ' + combo, CX, comboY, Math.max(1.6, Math.min(2.4, W / 200)), COL.gold, 0.9);
    const m = comboMult();
    text('X' + m, CX, comboY + 22, Math.max(2.2, Math.min(3.4, W / 130)), COL.gold, 0.95);
  }

  if (hintT > 0) {
    const a = Math.min(1, hintT) * 0.85;
    text('TAP TO SWITCH ORBIT', CX, Math.min(H - 22, comboY + 58), 1.5, COL.gray, a);
  }

  if (revWarn > 0) {
    const blink = Math.sin(now * 0.024) > 0;
    if (blink) {
      text('REVERSE INCOMING', CX, CY - R[1] - 34, 1.8, COL.orange, 0.95);
    }
  }
}

function drawMenu() {
  const ts = Math.max(4, Math.min(W / 24, H / 76, 10));
  const titleY = Math.max(16, H * 0.045);
  text('ORBIT', CX, titleY, ts, COL.cyan, 1);
  text('RUSH', CX, titleY + 9 * ts, ts, COL.magenta, 1);

  const promptY = CY + R[1] + 44;
  const pa = 0.55 + 0.45 * Math.sin(now * 0.006);
  text('TAP TO START', CX, promptY, Math.max(2.2, Math.min(3.4, W / 120)), COL.white, pa);

  const h1 = promptY + 42;
  text('TAP SWITCHES ORBIT', CX, h1, 1.6, COL.gray, 0.9);
  const h2 = h1 + 23;
  text('DODGE SPIKES - COLLECT GEMS', CX, h2, 1.6, COL.gray, 0.9);
  const h3 = h2 + 22;
  if (h3 < H - 64) text('SPACE OR CLICK WORKS TOO', CX, h3, 1.3, COL.gray, 0.55);
  text('BEST ' + best, CX, Math.min(H - 26, h2 + 46), 2, COL.gold, 0.9);

  drawMuteButton();
}

function drawGameOver() {
  const pw = Math.min(W * 0.88, 430);
  const ph = Math.min(H * 0.54, 340);
  const px = CX - pw / 2;
  const py = CY - ph / 2 + 8;

  gfx.fillStyle(0x0a0a1c, 0.84);
  gfx.fillRoundedRect(px, py, pw, ph, 14);
  gfx.lineStyle(2, COL.magenta, 0.45);
  gfx.strokeRoundedRect(px, py, pw, ph, 14);
  gfx.lineStyle(1, COL.cyan, 0.18);
  gfx.strokeRoundedRect(px + 4, py + 4, pw - 8, ph - 8, 11);

  const ts1 = Math.min(pw / 44, 5);
  let y = py + 24;
  text('GAME OVER', CX, y, ts1, COL.magenta, 1);
  y += 8 * ts1 + 16;

  const ts2 = Math.min(pw / 24, 8);
  text(String(score), CX, y, ts2, COL.white, 1);
  y += 8 * ts2 + 10;

  text('BEST ' + best, CX, y, 1.9, COL.gray, 0.95);
  y += 26;

  if (newRecord) {
    const na = 0.55 + 0.45 * Math.sin(now * 0.01);
    text('NEW BEST!', CX, y, 2.2, COL.cyan, na);
    y += 30;
  }

  text('GEMS ' + gemsGot + '  MAX COMBO ' + maxCombo, CX, y, 1.3, COL.gray, 0.75);
  y += 21;
  text('LEVEL ' + level, CX, y, 1.3, COL.gray, 0.75);

  const ra = stateT > 550 ? (0.55 + 0.45 * Math.sin(now * 0.008)) : 0.25;
  text('TAP TO RETRY', CX, py + ph - 42, Math.min(pw / 62, 2.6), COL.white, ra);
  drawMuteButton();
}

// ---------- text ----------
function text(t, x, y, size, color, alpha) {
  const a = alpha === undefined ? 1 : alpha;
  if (a <= 0.01) return;
  gfx.fillStyle(color, a);
  const cw = 6 * size;
  const px = size >= 3 ? size - 1 : size;
  let sx = x - (t.length * cw - size) * 0.5;
  for (let i = 0; i < t.length; i++) {
    const g = FONT[t[i]];
    if (g) {
      for (let c = 0; c < 5; c++) {
        const bits = g[c];
        for (let row = 0; row < 8; row++) {
          if (bits & (1 << row)) {
            gfx.fillRect(sx + c * size, y + row * size, px, px);
          }
        }
      }
    }
    sx += cw;
  }
}

// ---------- audio ----------
function tone(freq, dur, type, vol, toFreq) {
  try {
    const ctx = scene.sound.context;
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (toFreq) o.frequency.exponentialRampToValueAtTime(Math.max(20, toFreq), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch (e) {}
}

function resumeAudio() {
  try {
    const ctx = scene.sound.context;
    if (ctx && ctx.state === 'suspended') ctx.resume();
  } catch (e) {}
}

function toneGem() {
  const f = Math.min(1500, 620 + combo * 24);
  tone(f, 0.07, 'square', 0.045);
  tone(f * 1.5, 0.06, 'sine', 0.03);
}

function startMusic() {
  stopMusic();
  if (muted) return;
  beatStep = 0;
  beatTimer = setInterval(function () {
    if (state !== 'playing' || muted) return;
    musicStep();
  }, 132);
}

function stopMusic() {
  if (beatTimer) {
    clearInterval(beatTimer);
    beatTimer = null;
  }
}

function musicStep() {
  const s = beatStep % 16;
  if (s % 4 === 0) tone(105, 0.1, 'sine', 0.09);
  if (s % 2 === 1) tone(5200, 0.012, 'square', 0.011);
  const bass = [0, 0, 220, 0, 261.6, 0, 196, 0, 0, 0, 220, 0, 293.7, 0, 261.6, 0];
  if (bass[s]) tone(bass[s], 0.13, 'triangle', 0.032);
  beatStep++;
}

// ---------- helpers ----------
function vibrate(ms) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch (e) {}
}

function loadNum(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    const n = Number(v);
    return isNaN(n) ? fallback : n;
  } catch (e) {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch (e) {}
}
