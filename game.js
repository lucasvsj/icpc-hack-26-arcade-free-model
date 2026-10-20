// ORBIT RUSH - one-tap orbital arcade game (Phaser 3)
// Tap / click / space / enter / up / W to switch orbit (arcade P1A + START1 also work)
// Dodge spikes, evade blue electric arcs and blinkers, collect gems, grab shields, survive.
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
  green: 0x4dffa6,
  electric: 0x4da6ff,
  violet: 0xb45dff
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
let electrics = [];
let blinkers = [];
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
let menuSel = 0;
let menuBtns = [];
let uiBtns = [];
let lbScores = null;
let lbError = false;
let lbTimer = 0;
let howtoPage = 0;

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
    if (state === 'menu') {
      for (let i = 0; i < menuBtns.length; i++) {
        const b = menuBtns[i];
        if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) {
          menuSel = b.idx;
          menuAction(b.idx);
          return;
        }
      }
      return;
    }
    if (state === 'options' || state === 'leaderboard' || state === 'howto') {
      hitUI(p.x, p.y);
      return;
    }
    if (state === 'gameover') {
      if (hitUI(p.x, p.y)) return;
    }
    press();
  });

  this.input.keyboard.addCapture(['SPACE', 'ENTER', 'UP']);
  this.input.keyboard.on('keydown', function (e) {
    if (e.key === 'm' || e.key === 'M') {
      toggleMute();
      return;
    }
    if (state === 'menu') {
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S' || e.key === 'ArrowRight') {
        menuSel = (menuSel + 1) % 4;
        tone(640, 0.03, 'square', 0.03);
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowLeft') {
        menuSel = (menuSel + 3) % 4;
        tone(640, 0.03, 'square', 0.03);
        return;
      }
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'P1A' || e.key === 'P1B' || e.key === 'START1') {
        menuAction(menuSel);
        return;
      }
      return;
    }
    if (state === 'options') {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'P1A' || e.key === 'START1') {
        toggleMute();
        return;
      }
      if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'P1B') {
        backToMenu();
        return;
      }
      return;
    }
    if (state === 'leaderboard') {
      if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'Enter' || e.key === ' ' || e.key === 'P1B') {
        backToMenu();
        return;
      }
      return;
    }
    if (state === 'howto') {
      if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'P1B') {
        backToMenu();
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        howtoPage = 0;
        tone(640, 0.04, 'square', 0.03);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        howtoPage = 1;
        tone(640, 0.04, 'square', 0.03);
        return;
      }
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'P1A' || e.key === 'START1') {
        if (howtoPage < 1) howtoPage = 1;
        else backToMenu();
        tone(640, 0.04, 'square', 0.03);
        return;
      }
      return;
    }
    if (state === 'gameover' && (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'P1B')) {
      backToMenu();
      return;
    }
    if (ACTION_KEYS[e.key]) press();
  });

  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'arcade:leaderboard:data') {
      lbScores = Array.isArray(e.data.scores) ? e.data.scores : [];
      lbError = !!e.data.error;
      lbTimer = 0;
    }
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
    menuAction(menuSel);
  } else if (state === 'playing') {
    trySwitch();
  } else if (state === 'gameover') {
    if (stateT > 550) startRun();
  }
}

function menuAction(i) {
  resumeAudio();
  if (i === 0) startRun();
  else if (i === 1) openLeaderboard();
  else if (i === 2) openOptions();
  else openHowTo();
}

function backToMenu() {
  state = 'menu';
  stateT = 0;
  menuSel = 0;
  menuBtns = [];
  uiBtns = [];
  lbScores = null;
  lbError = false;
  lbTimer = 0;
  trail = [];
  stopMusic();
  tone(420, 0.05, 'square', 0.04);
}

function openOptions() {
  state = 'options';
  stateT = 0;
  uiBtns = [];
  menuBtns = [];
  tone(700, 0.04, 'square', 0.03);
}

function openHowTo() {
  state = 'howto';
  stateT = 0;
  uiBtns = [];
  menuBtns = [];
  howtoPage = 0;
  tone(700, 0.04, 'square', 0.03);
}

function openLeaderboard() {
  state = 'leaderboard';
  stateT = 0;
  uiBtns = [];
  menuBtns = [];
  lbScores = null;
  lbError = false;
  lbTimer = 2500;
  if (window.parent && window.parent !== window) {
    try {
      window.parent.postMessage({ type: 'arcade:leaderboard:request' }, '*');
    } catch (e) {}
  } else {
    lbScores = [];
    lbError = true;
    lbTimer = 0;
  }
  tone(700, 0.04, 'square', 0.03);
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
  electrics = [];
  blinkers = [];
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

// Electric pair: two blue diamonds on the same ring that electrify the arc between them
function addElectric(a, ring, span, dir) {
  electrics.push({
    a1: a,
    a2: a + dir * span,
    ring: ring,
    span: span,
    dir: dir,
    ph: Math.random() * 6.283
  });
}

// Blinker: diamond that periodically hops between the two rings
function addBlinker(a, ring) {
  blinkers.push({
    a: a,
    ring: ring,
    ph: Math.random() * 6.283,
    t: 900 + Math.random() * 600,
    warn: 0
  });
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
  // Electric pair: both diamonds always share the same ring
  if (level >= 2) {
    pool.push({ w: 2, f: function () {
      const r = rndRing();
      const span = Math.max(30, 50 - (level - 2) * 4);
      addElectric(at, r, span, player.dir);
      return span + 18;
    } });
  }

  // Blinker: appears from level 3 onward
  if (level >= 3) {
    pool.push({ w: 1, f: function () { addBlinker(at, rndRing()); return 0; } });
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

function updateEntities(delta) {
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

  // Electric pair: the whole arc between the two diamonds is lethal
  for (let i = electrics.length - 1; i >= 0; i--) {
    const e = electrics[i];
    const rr = R[e.ring];
    const along = e.dir * wrapSigned(player.angle - e.a1);
    if (along >= 0 && along <= e.span && Math.abs(player.r - rr) < 20) {
      hitElectric(e, i);
      return;
    }
    // Clear once the far diamond is well past the player, or if the player
    // reversed and left the whole pair more than 150 degrees away.
    const along2 = e.dir * wrapSigned(player.angle - e.a2);
    const farA1 = Math.abs(wrapSigned(player.angle - e.a1));
    const farA2 = Math.abs(wrapSigned(player.angle - e.a2));
    if (along2 > 14 || (farA1 > 150 && farA2 > 150)) electrics.splice(i, 1);
  }

  // Blinker: ring changes over time, telegraphed by a warning flash
  for (let i = blinkers.length - 1; i >= 0; i--) {
    const b = blinkers[i];
    if (b.warn > 0) b.warn -= delta;
    b.t -= delta;
    if (b.t <= 0) {
      b.ring = 1 - b.ring;
      b.t = 1100 + Math.random() * 500;
      b.warn = 260;
      const gp = entPos(b.a, R[b.ring]);
      spark(gp.x, gp.y, COL.violet, 6, 60);
    }
    const rel = wrapSigned(b.a - player.angle);
    const rr = R[b.ring];
    if (Math.abs(rel) < 9 && Math.abs(player.r - rr) < 20) {
      hitBlinker(b, i);
      return;
    }
    if (rel * player.dir < -12) blinkers.splice(i, 1);
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

function breakShield(p, color) {
  player.shield = false;
  player.inv = 1.2;
  waves.push({ x: p.x, y: p.y, r: 8, max: 90, life: 0.5, maxLife: 0.5, color: color });
  spark(p.x, p.y, color, 18, 140);
  tone(320, 0.22, 'square', 0.07, 900);
  scene.cameras.main.shake(150, 0.006);
  vibrate(35);
}

function hitElectric(e, i) {
  if (player.inv > 0) return;
  if (player.shield) {
    breakShield(playerPos(), COL.electric);
    if (i >= 0) electrics.splice(i, 1);
    return;
  }
  die();
}

function hitBlinker(b, i) {
  if (player.inv > 0) return;
  if (player.shield) {
    breakShield(playerPos(), COL.violet);
    if (i >= 0) blinkers.splice(i, 1);
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
  } else if (state === 'options') {
    drawWorld();
    drawOptions();
  } else if (state === 'leaderboard') {
    if (lbScores === null && lbTimer > 0) {
      lbTimer -= delta;
      if (lbTimer <= 0) {
        lbScores = [];
        lbError = true;
      }
    }
    drawWorld();
    drawLeaderboard();
  } else if (state === 'howto') {
    drawWorld();
    drawHowTo();
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

  updateEntities(delta);
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

function drawElectricDiamond(p, size, col) {
  gfx.fillStyle(col, 0.14);
  drawDiamond(p.x, p.y, size * 1.75);
  gfx.fillStyle(col, 0.95);
  drawDiamond(p.x, p.y, size);
  gfx.fillStyle(0xffffff, 0.9);
  drawDiamond(p.x, p.y, size * 0.3);
}

function drawElectricPair(e) {
  const S = Math.max(0.7, Math.min(1.6, R[1] / 150));
  const rr = R[e.ring];
  const segs = Math.max(8, Math.floor(e.span / 3));
  const stepA = e.dir * e.span / segs;
  const flick = Math.sin(now * 0.02 + e.ph) * 3;
  const pts = [];
  for (let i = 0; i <= segs; i++) {
    const a = e.a1 + stepA * i;
    const j = (i === 0 || i === segs) ? 0 : (Math.random() - 0.5) * 9 * S;
    pts.push(entPos(a, rr + j + flick));
  }

  gfx.lineStyle(7, COL.electric, 0.10);
  gfx.beginPath();
  gfx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) gfx.lineTo(pts[i].x, pts[i].y);
  gfx.strokePath();

  gfx.lineStyle(2, COL.electric, 0.95);
  gfx.beginPath();
  gfx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) gfx.lineTo(pts[i].x, pts[i].y);
  gfx.strokePath();

  gfx.lineStyle(1, 0xdff4ff, 0.85);
  for (let i = 1; i < pts.length - 1; i++) {
    if (Math.random() < 0.35) {
      const p = pts[i];
      gfx.lineBetween(p.x, p.y, p.x + (Math.random() - 0.5) * 7, p.y + (Math.random() - 0.5) * 7);
    }
  }

  drawElectricDiamond(entPos(e.a1, rr), 11 * S, COL.electric);
  drawElectricDiamond(entPos(e.a2, rr), 11 * S, COL.electric);
}

function drawBlinker(b) {
  const S = Math.max(0.7, Math.min(1.6, R[1] / 150));
  const col = b.warn > 0 ? COL.gold : COL.violet;
  const p = entPos(b.a, R[b.ring]);
  const ghost = entPos(b.a, R[1 - b.ring]);
  gfx.fillStyle(col, b.warn > 0 ? 0.22 : 0.08);
  drawDiamond(ghost.x, ghost.y, 9 * S);
  const pa = b.warn > 0 ? 0.55 + 0.45 * Math.sin(now * 0.03) : 0.95;
  gfx.fillStyle(col, 0.14);
  drawDiamond(p.x, p.y, 14 * S);
  gfx.fillStyle(col, pa);
  drawDiamond(p.x, p.y, 9 * S);
  gfx.fillStyle(0xffffff, 0.9);
  drawDiamond(p.x, p.y, 2.8 * S);
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
  for (let i = 0; i < electrics.length; i++) drawElectricPair(electrics[i]);
  for (let i = 0; i < blinkers.length; i++) drawBlinker(blinkers[i]);
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

function uiButton(x, y, w, h, label, size, color, selected) {
  const r = Math.min(12, h * 0.35);
  gfx.fillStyle(color, selected ? 0.2 : 0.07);
  gfx.fillRoundedRect(x, y, w, h, r);
  gfx.lineStyle(selected ? 2.5 : 1.5, color, selected ? 0.95 : 0.42);
  gfx.strokeRoundedRect(x, y, w, h, r);
  if (selected) {
    gfx.lineStyle(1, 0xffffff, 0.16);
    gfx.strokeRoundedRect(x + 3, y + 3, w - 6, h - 6, Math.max(1, r - 3));
  }
  text(label, x + w / 2, y + (h - 8 * size) / 2, size, color, selected ? 1 : 0.82);
}

function hitUI(x, y) {
  for (let i = 0; i < uiBtns.length; i++) {
    const b = uiBtns[i];
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      b.fn();
      return true;
    }
  }
  return false;
}

function normName(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/_/g, ' ')
    .replace(/[^A-Z0-9 .:+\-'\/]/g, ' ')
    .slice(0, 12);
}

function drawMenu() {
  const ts = Math.max(4, Math.min(W / 24, H / 76, 10));
  const titleY = Math.max(12, H * 0.035);
  text('ORBIT', CX, titleY, ts, COL.cyan, 1);
  text('RUSH', CX, titleY + 9 * ts, ts, COL.magenta, 1);

  const infoY = titleY + 18 * ts + 10;
  text('BEST ' + best, CX, infoY, 1.8, COL.gold, 0.9);
  text('TAP OR ARROWS + ENTER', CX, infoY + 22, 1.1, COL.gray, 0.5);

  const bw = Math.min(W * 0.74, 320);
  const bx = CX - bw / 2;
  let bh = Math.max(30, Math.min(46, H * 0.058));
  let smallH = Math.max(24, bh * 0.72);
  let gap = Math.max(6, bh * 0.18);
  let total = bh + gap + smallH + gap + smallH;
  const minY = CY + R[1] + 14;
  const avail = Math.max(60, H - minY - 10);
  if (total > avail) {
    const k = avail / total;
    bh *= k;
    smallH *= k;
    gap *= k;
    total = bh + gap + smallH + gap + smallH;
  }
  let by = H - total - Math.max(10, H * 0.02);
  if (by < minY) by = minY;
  if (by + total > H - 4) by = Math.max(4, H - total - 4);

  menuBtns = [];

  uiButton(bx, by, bw, bh, 'PLAY', Math.max(2.2, bh / 16), COL.cyan, menuSel === 0);
  menuBtns.push({ x: bx, y: by, w: bw, h: bh, idx: 0 });
  by += bh + gap;

  const half = (bw - gap) / 2;
  uiButton(bx, by, half, smallH, 'LEADERBOARDS', Math.max(1.35, smallH / 22), COL.gold, menuSel === 1);
  menuBtns.push({ x: bx, y: by, w: half, h: smallH, idx: 1 });
  uiButton(bx + half + gap, by, half, smallH, 'OPTIONS', Math.max(1.5, smallH / 18), COL.cyan, menuSel === 2);
  menuBtns.push({ x: bx + half + gap, y: by, w: half, h: smallH, idx: 2 });
  by += smallH + gap;

  uiButton(bx, by, bw, smallH, 'HOW TO PLAY', Math.max(1.5, smallH / 18), COL.gray, menuSel === 3);
  menuBtns.push({ x: bx, y: by, w: bw, h: smallH, idx: 3 });

  drawMuteButton();
}

function drawOptions() {
  const ts = Math.max(3, Math.min(W / 52, H / 90, 6));
  const titleY = Math.max(16, H * 0.07);
  text('OPTIONS', CX, titleY, ts, COL.cyan, 1);
  text('M TOGGLES SOUND', CX, titleY + 9 * ts + 10, 1.2, COL.gray, 0.55);

  const bw = Math.min(W * 0.72, 300);
  const bh = Math.max(34, Math.min(50, H * 0.065));
  const gap = Math.max(14, bh * 0.35);
  const bx = CX - bw / 2;
  let by = H * 0.42;

  uiBtns = [];

  uiButton(bx, by, bw, bh, 'SOUND ' + (muted ? 'OFF' : 'ON'), Math.max(1.7, bh / 18), muted ? COL.magenta : COL.green, false);
  uiBtns.push({ x: bx, y: by, w: bw, h: bh, fn: toggleMute });
  by += bh + gap;

  uiButton(bx, by, bw, bh, 'BACK', Math.max(1.7, bh / 18), COL.gray, false);
  uiBtns.push({ x: bx, y: by, w: bw, h: bh, fn: backToMenu });

  drawMuteButton();
}

function drawLeaderboard() {
  const ts = Math.max(2.8, Math.min(W / 78, H / 90, 5));
  const titleY = Math.max(14, H * 0.06);
  text('LEADERBOARDS', CX, titleY, ts, COL.gold, 1);
  text('ORBIT RUSH - TOP 10', CX, titleY + 9 * ts + 10, 1.2, COL.gray, 0.55);

  const size = Math.max(1.3, Math.min(W / 240, 2));
  const rowH = 8 * size + 12;
  let y = Math.max(80, H * 0.2);
  const maxRows = Math.min(10, Math.max(0, Math.floor((H - y - 100) / rowH)));

  uiBtns = [];

  if (lbScores === null) {
    const a = 0.6 + 0.4 * Math.sin(now * 0.008);
    text('LOADING...', CX, y, 1.6, COL.cyan, a);
  } else if (lbError || lbScores.length === 0) {
    text('NO SCORES YET', CX, y, 1.5, COL.gray, 0.85);
    text('PLAY TO SET A RECORD', CX, y + 22, 1.2, COL.gray, 0.55);
  } else {
    const rows = lbScores.slice(0, maxRows);
    for (let i = 0; i < rows.length; i++) {
      const e = rows[i];
      const rank = String(e.rank || i + 1);
      const line = rank + '. ' + normName(e.player) + '  ' + e.score;
      const color = i === 0 ? COL.gold : (i < 3 ? COL.white : COL.gray);
      text(line, CX, y, size, color, i === 0 ? 1 : 0.9);
      y += rowH;
    }
  }

  const bw = Math.min(W * 0.5, 220);
  const bh = Math.max(30, Math.min(46, H * 0.06));
  const bx = CX - bw / 2;
  const by = H - bh - 18;

  text('YOUR BEST ' + best, CX, by - 28, 1.4, COL.gold, 0.9);

  uiButton(bx, by, bw, bh, 'BACK', Math.max(1.6, bh / 18), COL.gray, false);
  uiBtns.push({ x: bx, y: by, w: bw, h: bh, fn: backToMenu });

  drawMuteButton();
}

function fitText(t, maxW, maxSize, minSize) {
  const w = t.length * 6 - 1;
  const s = maxW / (w > 0 ? w : 1);
  return Math.max(minSize, Math.min(maxSize, s));
}

function textLeft(t, x, y, size, color, alpha) {
  const w = (t.length * 6 - 1) * size;
  text(t, x + w / 2, y, size, color, alpha);
}

function iconSwitchOrbit(cx, cy, s) {
  gfx.lineStyle(2, COL.blue, 0.55);
  gfx.strokeCircle(cx, cy, s * 0.34);
  gfx.strokeCircle(cx, cy, s * 0.62);

  const a = -50 * D2R;
  const x1 = cx + Math.cos(a) * s * 0.62;
  const y1 = cy + Math.sin(a) * s * 0.62;
  const x2 = cx + Math.cos(a) * s * 0.34;
  const y2 = cy + Math.sin(a) * s * 0.34;

  gfx.lineStyle(2, COL.cyan, 0.75);
  gfx.lineBetween(x1, y1, x2, y2);

  gfx.fillStyle(COL.cyan, 0.2);
  gfx.fillCircle(x1, y1, s * 0.13);
  gfx.fillStyle(0xffffff, 1);
  gfx.fillCircle(x1, y1, s * 0.06);

  gfx.fillStyle(COL.cyan, 0.4);
  gfx.fillCircle(x2, y2, s * 0.06);
}

function iconSpike(cx, cy, s) {
  gfx.lineStyle(2, COL.blue, 0.45);
  gfx.strokeCircle(cx, cy, s * 0.6);
  const a = -35 * D2R;
  const px = cx + Math.cos(a) * s * 0.6;
  const py = cy + Math.sin(a) * s * 0.6;
  gfx.fillStyle(COL.magenta, 0.16);
  drawDiamond(px, py, s * 0.2);
  gfx.fillStyle(COL.magenta, 0.95);
  drawDiamond(px, py, s * 0.11);
  gfx.fillStyle(0xffffff, 0.9);
  drawDiamond(px, py, s * 0.04);
}

function iconArc(cx, cy, s) {
  gfx.lineStyle(2, COL.blue, 0.45);
  gfx.strokeCircle(cx, cy, s * 0.6);

  const r = s * 0.6;
  const a1 = -34 * D2R;
  const a2 = 34 * D2R;
  const p1x = cx + Math.cos(a1) * r;
  const p1y = cy + Math.sin(a1) * r;
  const p2x = cx + Math.cos(a2) * r;
  const p2y = cy + Math.sin(a2) * r;
  const segs = 6;

  gfx.lineStyle(3, COL.electric, 0.2);
  gfx.beginPath();
  gfx.moveTo(p1x, p1y);
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    const j = i < segs ? (Math.random() - 0.5) * 10 : 0;
    gfx.lineTo(cx + Math.cos(a1 + (a2 - a1) * t) * (r + j),
               cy + Math.sin(a1 + (a2 - a1) * t) * (r + j));
  }
  gfx.strokePath();

  gfx.lineStyle(1.8, COL.electric, 0.95);
  gfx.beginPath();
  gfx.moveTo(p1x, p1y);
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    const j = i < segs ? (Math.random() - 0.5) * 7 : 0;
    gfx.lineTo(cx + Math.cos(a1 + (a2 - a1) * t) * (r + j),
               cy + Math.sin(a1 + (a2 - a1) * t) * (r + j));
  }
  gfx.strokePath();

  gfx.fillStyle(COL.electric, 0.16);
  drawDiamond(p1x, p1y, s * 0.19);
  drawDiamond(p2x, p2y, s * 0.19);
  gfx.fillStyle(COL.electric, 0.98);
  drawDiamond(p1x, p1y, s * 0.1);
  drawDiamond(p2x, p2y, s * 0.1);
  gfx.fillStyle(0xffffff, 0.9);
  drawDiamond(p1x, p1y, s * 0.035);
  drawDiamond(p2x, p2y, s * 0.035);
}

function iconBlinker(cx, cy, s) {
  gfx.lineStyle(2, COL.blue, 0.45);
  gfx.strokeCircle(cx, cy, s * 0.62);
  gfx.strokeCircle(cx, cy, s * 0.34);

  const px = cx + s * 0.62;
  const py = cy;
  const qx = cx + s * 0.34;
  const qy = cy;

  gfx.lineStyle(1.5, COL.gold, 0.55 + 0.45 * Math.sin(now * 0.01));
  gfx.strokeCircle(px, py, s * 0.17);

  gfx.fillStyle(COL.violet, 0.32);
  drawDiamond(qx, qy, s * 0.1);
  gfx.fillStyle(COL.violet, 0.98);
  drawDiamond(px, py, s * 0.11);
  gfx.fillStyle(0xffffff, 0.9);
  drawDiamond(px, py, s * 0.035);

  gfx.lineStyle(1.5, COL.gray, 0.55);
  gfx.lineBetween(px - s * 0.06, py, qx + s * 0.06, qy);
}

function iconGem(cx, cy, s) {
  const rr = s * 0.15;
  gfx.fillStyle(COL.gold, 0.12);
  gfx.fillCircle(cx, cy, rr * 2.2);
  gfx.fillStyle(COL.gold, 0.25);
  gfx.fillCircle(cx, cy, rr * 1.5);
  gfx.fillStyle(COL.gold, 0.98);
  gfx.fillCircle(cx, cy, rr);
  gfx.fillStyle(0xffffff, 0.9);
  gfx.fillCircle(cx - rr * 0.25, cy - rr * 0.28, rr * 0.28);
}

function iconShield(cx, cy, s) {
  const rr = s * 0.2;
  gfx.fillStyle(COL.cyan, 0.12);
  gfx.fillCircle(cx, cy, rr * 2.1);
  for (let k = 0; k < 6; k++) {
    const a1 = k * 1.047 - 0.3;
    const a2 = (k + 1) * 1.047 - 0.3;
    const x1 = cx + Math.cos(a1) * rr;
    const y1 = cy + Math.sin(a1) * rr;
    const x2 = cx + Math.cos(a2) * rr;
    const y2 = cy + Math.sin(a2) * rr;
    gfx.fillStyle(COL.cyan, 0.3);
    gfx.fillTriangle(cx, cy, x1, y1, x2, y2);
    gfx.lineStyle(2, COL.cyan, 0.9);
    gfx.lineBetween(x1, y1, x2, y2);
  }
  gfx.fillStyle(0xffffff, 0.95);
  gfx.fillCircle(cx, cy, rr * 0.22);
}

function infoCard(x, y, w, h, accent, iconFn, title, l1, l2) {
  gfx.fillStyle(0x0a0d22, 0.9);
  gfx.fillRoundedRect(x, y, w, h, 14);
  gfx.lineStyle(1.5, accent, 0.45);
  gfx.strokeRoundedRect(x, y, w, h, 14);

  const iconSize = Math.min(h * 0.62, 84, w * 0.28);
  iconFn(x + 14 + iconSize * 0.5, y + h / 2, iconSize);

  const tx = x + 14 + iconSize + 14;
  const tw = x + w - 14 - tx;
  const ts = fitText(title, tw, 2.1, 1.1);
  const bs = fitText(l1.length > l2.length ? l1 : l2, tw, 1.5, 0.9);

  const totalH = 8 * ts + 10 + 8 * bs + 6 + 8 * bs;
  let ty = y + (h - totalH) / 2;

  textLeft(title, tx, ty, ts, accent, 1);
  ty += 8 * ts + 10;
  textLeft(l1, tx, ty, bs, 0xdfe8ff, 0.96);
  ty += 8 * bs + 6;
  textLeft(l2, tx, ty, bs, 0xdfe8ff, 0.96);
}

function drawHowTo() {
  const ts = Math.max(3, Math.min(W / 95, H / 110, 4.6));
  const titleY = Math.max(12, H * 0.035);
  text('HOW TO PLAY', CX, titleY, ts, COL.cyan, 1);

  const ctrlH = Math.max(38, Math.min(46, H * 0.055));
  const ctrlY = H - ctrlH - 14;
  const ctrlW = Math.max(56, Math.min(70, W * 0.18));

  const gap = Math.max(8, H * 0.015);
  const top = titleY + 8 * ts + 14;
  const bottom = ctrlY - 14;
  const areaH = bottom - top;
  const cardH = Math.max(60, (areaH - gap * 2) / 3);
  const cardW = Math.min(W * 0.94, 400);
  const cardX = CX - cardW / 2;

  const pages = [
    [
      [COL.cyan, iconSwitchOrbit, 'SWITCH ORBIT', 'TAP SPACE OR UP', 'TO SWITCH ORBIT'],
      [COL.magenta, iconSpike, 'MAGENTA SPIKES', 'ONE HIT AND YOU LOSE', 'CHANGE RING TO DODGE'],
      [COL.electric, iconArc, 'BLUE ARC', 'TWO BLUE DIAMONDS', 'THE ARC BETWEEN SHOCKS']
    ],
    [
      [COL.violet, iconBlinker, 'VIOLET BLINKER', 'JUMPS BETWEEN RINGS', 'GOLD FLASH MEANS JUMP'],
      [COL.gold, iconGem, 'GOLD GEMS', 'COLLECT TO BUILD COMBO', 'HIGHER COMBO MORE POINTS'],
      [COL.cyan, iconShield, 'CYAN SHIELD', 'ABSORBS ONE HIT', 'GRAB IT WHEN YOU CAN']
    ]
  ];

  const list = pages[howtoPage] || pages[0];
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    infoCard(cardX, top + i * (cardH + gap), cardW, cardH, c[0], c[1], c[2], c[3], c[4]);
  }

  uiBtns = [];

  const btnSize = Math.max(1.2, ctrlH / 24);
  uiButton(10, ctrlY, ctrlW, ctrlH, 'BACK', btnSize, COL.gray, false);
  uiBtns.push({ x: 10, y: ctrlY, w: ctrlW, h: ctrlH, fn: backToMenu });

  const prevOn = howtoPage > 0;
  const prevX = W - 10 - ctrlW * 2 - 8;
  uiButton(prevX, ctrlY, ctrlW, ctrlH, 'PREV', btnSize, prevOn ? COL.cyan : 0x39405c, false);
  if (prevOn) {
    uiBtns.push({ x: prevX, y: ctrlY, w: ctrlW, h: ctrlH, fn: function () { howtoPage = 0; tone(640, 0.04, 'square', 0.03); } });
  }

  const nextOn = howtoPage < pages.length - 1;
  const nextX = W - 10 - ctrlW;
  uiButton(nextX, ctrlY, ctrlW, ctrlH, 'NEXT', btnSize, nextOn ? COL.cyan : 0x39405c, false);
  if (nextOn) {
    uiBtns.push({ x: nextX, y: ctrlY, w: ctrlW, h: ctrlH, fn: function () { howtoPage = 1; tone(640, 0.04, 'square', 0.03); } });
  }

  for (let i = 0; i < pages.length; i++) {
    const dx = CX + (i - (pages.length - 1) / 2) * 18;
    gfx.fillStyle(i === howtoPage ? COL.cyan : 0x39405c, 0.95);
    gfx.fillCircle(dx, ctrlY + ctrlH / 2, i === howtoPage ? 4.5 : 3);
  }

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
  text('TAP TO RETRY', CX, py + ph - 70, Math.min(pw / 62, 2.4), COL.white, ra);

  const bw2 = Math.min(pw * 0.46, 190);
  const bh2 = Math.max(22, Math.min(30, ph * 0.085));
  const bx2 = CX - bw2 / 2;
  const by2 = py + ph - bh2 - 12;

  uiBtns = [];
  uiButton(bx2, by2, bw2, bh2, 'MENU', Math.max(1.3, bh2 / 20), COL.gray, false);
  uiBtns.push({ x: bx2, y: by2, w: bw2, h: bh2, fn: backToMenu });

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
