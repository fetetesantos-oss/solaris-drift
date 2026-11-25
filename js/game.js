// Solaris Drift 2.0 — Modular 3D Space Action, Exploration & Boss Combat Engine

import { Mat4, clamp, lerp, rand, randInt } from './math.js';
import { loadProfile, saveProfile, SKINS, UPGRADES, upgradeCost } from './storage.js';
import { AudioEngine } from './audio.js';
import { Renderer3D } from './render/renderer.js';
import { SHIPS, buildModels } from './models/models.js';
import { REGIONS, REGION_ORDER, CODEX_ENTRIES } from './world/regions.js';

const audio = new AudioEngine();
const profile = loadProfile();
audio.setMuted(profile.muted);

const gameRoot = document.getElementById('game-root');
const glCanvas = document.getElementById('gl-canvas');
const hudCanvas = document.getElementById('hud-canvas');
const hudCtx = hudCanvas.getContext('2d');
const $ = (id) => document.getElementById(id);

let renderer, models;
try {
  renderer = new Renderer3D(glCanvas, profile.quality);
  models = buildModels(renderer.gl);
} catch (err) {
  $('webgl-error').classList.remove('hidden');
  console.error(err);
  throw err;
}

const ui = {
  hudLayer: $('hud-layer'),
  score: $('hud-score'),
  best: $('hud-best'),
  credits: $('hud-credits'),
  combo: $('hud-combo'),
  sector: $('hud-sector'),
  sectorName: $('hud-sector-name'),
  speed: $('hud-speed'),
  sectorBar: $('hud-sector-bar'),
  sectorProgressWrap: $('sector-progress-wrap'),
  bossBarWrap: $('boss-bar-wrap'),
  bossName: $('boss-name'),
  bossCoresLeft: $('boss-cores-left'),
  bossHpBar: $('boss-hp-bar'),
  missionPill: $('hud-mission-pill'),
  shieldText: $('hud-shield-text'),
  shieldPips: $('hud-shield-pips'),
  boostBar: $('hud-boost-bar'),
  rollBar: $('hud-roll-bar'),
  rollStatus: $('hud-roll-status'),
  missileBar: $('hud-missile-bar'),
  missileStatus: $('hud-missile-status'),
  powerupRow: $('hud-powerup-row'),
  powerupLabel: $('hud-powerup-label'),
  powerupTime: $('hud-powerup-time'),
  powerupBar: $('hud-powerup-bar'),
  banner: $('event-banner'),
  bannerSub: $('banner-sub'),
  bannerTitle: $('banner-title'),

  screenTitle: $('screen-title'),
  screenHangar: $('screen-hangar'),
  screenCodex: $('screen-codex'),
  screenStarMap: $('screen-starmap'),
  screenPause: $('screen-pause'),
  screenGameOver: $('screen-gameover'),

  shipSelector: $('ship-selector'),
  regionSelector: $('region-selector'),
  titleCredits: $('title-credits'),
  titleRecord: $('title-record'),
  titleRecordVal: $('title-record-val'),
  titleSectorVal: $('title-sector-val'),

  hangarCredits: $('hangar-credits'),
  hangarShips: $('hangar-ships'),
  hangarUpgrades: $('hangar-upgrades'),
  hangarSkins: $('hangar-skins'),
  codexList: $('codex-list'),
  codexCount: $('codex-count'),
  starmapRoutes: $('starmap-routes'),

  btnStart: $('btn-start'),
  btnOpenHangar: $('btn-open-hangar'),
  btnOpenCodex: $('btn-open-codex'),
  btnCloseHangar: $('btn-close-hangar'),
  btnCloseCodex: $('btn-close-codex'),
  btnMouseMode: $('btn-mouse-mode'),
  btnQualityTitle: $('btn-quality-title'),
  btnAutofire: $('btn-autofire'),
  btnMute: $('btn-mute'),
  btnPause: $('btn-pause'),
  btnResume: $('btn-resume'),
  btnPauseMouse: $('btn-pause-mouse'),
  btnPauseAutofire: $('btn-pause-autofire'),
  btnPauseQuality: $('btn-pause-quality'),
  btnRestartPause: $('btn-restart-pause'),
  btnMenuPause: $('btn-menu-pause'),
  btnRetry: $('btn-retry'),
  btnGoHangar: $('btn-go-hangar'),
  touchRoll: $('touch-roll'),
  touchBoost: $('touch-boost'),
  touchMissile: $('touch-missile'),

  goScore: $('go-score'),
  goCredits: $('go-credits'),
  goNewRecord: $('go-new-record'),
  goSector: $('go-sector'),
  goKills: $('go-kills'),
  goRings: $('go-rings'),
  goMaxCombo: $('go-maxcombo')
};

const BOUNDS_X = 9.4;
const BOUNDS_Y_MIN = -3.8;
const BOUNDS_Y_MAX = 5.4;
const TRENCH_COUNT = 22;
const TRENCH_LEN = 10;
const TRAIL_LEN = 22;

function createTrailRing() {
  return Array.from({ length: TRAIL_LEN }, () => ({ x: 0, y: 0, z: 0 }));
}

const state = {
  mode: 'title', // 'title' | 'hangar' | 'codex' | 'playing' | 'starmap' | 'paused' | 'gameover'
  startRegionId: 'solaris_orbit',
  regionId: 'solaris_orbit',
  region: REGIONS.solaris_orbit,

  time: 0,
  travel: 0,
  score: 0,
  runCredits: 0,
  combo: 1,
  comboTimer: 0,
  maxCombo: 1,
  kills: 0,
  ringsCollected: 0,
  ringStreak: 0,
  sector: 1,
  sectorProgress: 0,
  baseSpeed: 56,
  speed: 56,

  bannerTimer: 0,
  shake: 0,
  damageVignette: 0,
  boostBlend: 0,
  warpFlash: 0,
  solarFlareTimer: 0,
  solarFlareState: 'idle', // 'idle' | 'warn' | 'active'
  solarFlareSafeX: 0,

  hangarOrbitYaw: 0.45,
  hangarOrbitPitch: 0.16,
  hangarDrag: false,
  hangarLastX: 0,

  player: {
    x: 0, y: 0.4, vx: 0, vy: 0,
    roll: 0, pitch: 0,
    shield: 4, maxShield: 4,
    invuln: 0,
    shieldFlash: 0, shieldWave: 1, shieldHitDir: new Float32Array([0, 0, 1]),
    boost: 1.0, boosting: false,
    fireCd: 0,
    missileCd: 0, missileMaxCd: 6.5,
    barrelTimer: 0, barrelDir: 1, barrelCd: 0,
    tripleTimer: 0
  },

  trails: [createTrailRing(), createTrailRing()],
  trailCount: 0,

  boss: null,
  activeMission: null, // { type: 'relic' | 'convoy' | 'rush', timer, maxTimer, done, target }
  trench: [],
  decor: [], // floating biome setpieces (cryo crystals, ancient gates, background rocks)
  asteroids: [],
  enemies: [],
  pillars: [],
  rings: [],
  relics: [],
  powerups: [],
  lasers: [],
  missiles: [],
  enemyShots: [],
  sniperBeams: [],
  particles: [],
  glows: [],
  shockwaves: [],
  popups: [],

  spawnTimers: { ast: 0.5, enemy: 1.4, ring: 3.4, pillar: 4.0, mission: 11.0 },

  env: {
    fog: [...REGIONS.solaris_orbit.fog],
    lightDir: [...REGIONS.solaris_orbit.lightDir],
    sunDir: [...REGIONS.solaris_orbit.sunDir],
    lightCol: [...REGIONS.solaris_orbit.lightCol],
    ambient: [...REGIONS.solaris_orbit.ambient],
    rim: [...REGIONS.solaris_orbit.rim],
    sunTint: [...REGIONS.solaris_orbit.sunTint],
    fogNear: REGIONS.solaris_orbit.fogNear,
    fogFar: REGIONS.solaris_orbit.fogFar
  }
};

function getShip() {
  return SHIPS[clamp(profile.shipIdx, 0, SHIPS.length - 1)];
}

function getSkin() {
  return SKINS.find(s => s.id === profile.selectedSkin) || SKINS[0];
}

function unlockCodex(id) {
  if (!id || profile.codex.includes(id)) return;
  profile.codex.push(id);
  saveProfile(profile);
  const entry = CODEX_ENTRIES.find(c => c.id === id);
  if (entry && state.mode === 'playing') {
    addPopup(state.player.x, state.player.y + 2.0, -2, `CÓDICE: ${entry.title}`, '#38bdf8');
  }
}

function addCredits(amount, wx, wy, wz) {
  const scaled = Math.max(1, Math.round(amount * state.region.rewardMult));
  state.runCredits += scaled;
  profile.credits += scaled;
  if (wx !== undefined) {
    addPopup(wx, wy - 0.6, wz, `+${scaled} CR`, '#fbbf24');
  }
}

function setRegion(regionId, instant = false) {
  const reg = REGIONS[regionId] || REGIONS.solaris_orbit;
  state.regionId = reg.id;
  state.region = reg;
  renderer.bakeRegionSky(reg.sky);
  unlockCodex(reg.codexId);
  initBiomeDecor(reg);
  if (instant) {
    state.env.fog = [...reg.fog];
    state.env.lightDir = [...reg.lightDir];
    state.env.sunDir = [...reg.sunDir];
    state.env.lightCol = [...reg.lightCol];
    state.env.ambient = [...reg.ambient];
    state.env.rim = [...reg.rim];
    state.env.sunTint = [...reg.sunTint];
    state.env.fogNear = reg.fogNear;
    state.env.fogFar = reg.fogFar;
  }
}

function initTrench() {
  state.trench = [];
  for (let i = 0; i < TRENCH_COUNT; i++) {
    state.trench.push({
      z: 20 - i * TRENCH_LEN,
      leftH: rand(7, 22),
      rightH: rand(7, 22),
      leftW: rand(3.5, 6.2),
      rightW: rand(3.5, 6.2),
      hasArch: i % 5 === 2
    });
  }
}

function initBiomeDecor(reg) {
  state.decor = [];
  if (reg.mode === 'cryo_nebula') {
    for (let i = 0; i < 24; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      state.decor.push({
        kind: 'cryo',
        x: side * rand(13, 28),
        y: rand(-11, 14),
        z: 10 - i * 9.5,
        rx: rand(0, 6), ry: rand(0, 6), rz: rand(0, 6),
        spin: rand(-0.6, 0.6),
        scale: rand(1.6, 4.2)
      });
    }
  } else if (reg.mode === 'ancient_ruins') {
    for (let i = 0; i < 7; i++) {
      state.decor.push({
        kind: 'gate',
        x: Math.sin(i * 1.1) * 2.5,
        y: 1.0 + Math.cos(i * 0.9) * 1.5,
        z: -15 - i * 32,
        rx: 0, ry: 0, rz: i * 0.4,
        spin: (i % 2 === 0 ? 0.28 : -0.28),
        scale: 1.0
      });
    }
  } else if (reg.mode === 'asteroid_field' || reg.mode === 'solar_corona') {
    // Distant ambient megalith rocks framing open 360° space
    for (let i = 0; i < 26; i++) {
      const angle = rand(0, Math.PI * 2);
      const dist = rand(16, 36);
      state.decor.push({
        kind: 'rock',
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist * 0.65,
        z: 10 - i * 9,
        rx: rand(0, 6), ry: rand(0, 6), rz: rand(0, 6),
        spin: rand(-0.5, 0.5),
        scale: rand(2.0, 5.8),
        variant: reg.mode === 'solar_corona' ? 3 : randInt(0, 2)
      });
    }
  }
}

/* =========================================================================
   UI RENDERING: TITLE, HANGAR 3D, CODEX, STAR MAP & SETTINGS
========================================================================= */
const QUALITY_CYCLE = ['auto', 'high', 'medium', 'low'];
const QUALITY_LABEL = { auto: 'Auto', high: 'Alto', medium: 'Médio', low: 'Leve' };

function cycleQuality() {
  const idx = (QUALITY_CYCLE.indexOf(profile.quality) + 1) % QUALITY_CYCLE.length;
  profile.quality = QUALITY_CYCLE[idx];
  renderer.setQuality(profile.quality);
  handleResize();
  renderer.bakeRegionSky(state.region.sky);
  saveProfile(profile);
  syncToggleButtons();
}

function syncToggleButtons() {
  const mText = profile.mouseSteer ? 'ON' : 'OFF';
  const aText = profile.autoFire ? 'ON' : 'OFF';
  const qText = QUALITY_LABEL[profile.quality] || 'Auto';

  ui.btnMouseMode.textContent = `Mouse Livre: ${mText}`;
  ui.btnMouseMode.classList.toggle('active-toggle', profile.mouseSteer);
  ui.btnPauseMouse.textContent = `Mouse Livre: ${mText}`;
  ui.btnPauseMouse.classList.toggle('active-toggle', profile.mouseSteer);

  ui.btnAutofire.textContent = `Auto-Tiro: ${aText}`;
  ui.btnAutofire.classList.toggle('active-toggle', profile.autoFire);
  ui.btnPauseAutofire.textContent = `Tiro Automático: ${aText}`;
  ui.btnPauseAutofire.classList.toggle('active-toggle', profile.autoFire);

  ui.btnQualityTitle.textContent = `Gráficos: ${qText}`;
  ui.btnPauseQuality.textContent = `Qualidade Gráfica: ${qText}`;
  ui.btnMute.textContent = audio.muted ? 'Som: OFF' : 'Som: ON';
}

function refreshRecordDisplay() {
  ui.best.textContent = profile.bestScore.toLocaleString('pt-BR');
  ui.titleCredits.textContent = `${profile.credits.toLocaleString('pt-BR')} CR`;
  ui.hangarCredits.textContent = `${profile.credits.toLocaleString('pt-BR')} CR`;
  if (profile.bestScore > 0) {
    ui.titleRecord.classList.remove('hidden');
    ui.titleRecordVal.textContent = profile.bestScore.toLocaleString('pt-BR');
    ui.titleSectorVal.textContent = profile.bestSector;
  }
}

function renderTitleSelectors() {
  // Compact ship chips on title screen (unlocked ships + quick jump to Hangar)
  ui.shipSelector.innerHTML = '';
  SHIPS.forEach((s, idx) => {
    const unlocked = profile.unlockedShips.includes(s.id);
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `ship-card ${idx === profile.shipIdx ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`;
    el.innerHTML = `
      <div class="ship-card-head">
        <span class="ship-name">${s.name}</span>
        <span class="ship-role">${unlocked ? s.role : `${s.cost} CR`}</span>
      </div>
      <div class="ship-stats">
        <div class="stat-row"><span>Vel</span><div class="track track-xs"><div class="fill" style="width:${s.stats.vel}%;background:${s.accent}"></div></div></div>
        <div class="stat-row"><span>Esc</span><div class="track track-xs"><div class="fill fill-sky" style="width:${s.stats.esc}%"></div></div></div>
        <div class="stat-row"><span>Fogo</span><div class="track track-xs"><div class="fill fill-amber" style="width:${s.stats.cad}%"></div></div></div>
      </div>
    `;
    el.addEventListener('click', () => {
      audio.unlock();
      audio.uiClick();
      if (unlocked) {
        profile.shipIdx = idx;
        saveProfile(profile);
        renderTitleSelectors();
      } else {
        openHangar();
      }
    });
    ui.shipSelector.appendChild(el);
  });

  // Starting Region picker (discovered regions or Solaris Orbit)
  ui.regionSelector.innerHTML = '';
  REGION_ORDER.forEach((rid) => {
    const r = REGIONS[rid];
    const discovered = rid === 'solaris_orbit' || profile.codex.includes(r.codexId);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `region-chip ${state.startRegionId === rid ? 'selected' : ''} ${!discovered ? 'locked' : ''}`;
    btn.textContent = discovered ? r.name : '??? (Explorar)';
    btn.disabled = !discovered;
    btn.title = discovered ? `${r.subtitle} — ${r.hazardDesc}` : 'Descubra esta região durante uma expedição!';
    btn.addEventListener('click', () => {
      audio.unlock();
      audio.uiClick();
      state.startRegionId = rid;
      setRegion(rid, false);
      renderTitleSelectors();
    });
    ui.regionSelector.appendChild(btn);
  });
}

function renderHangarUI() {
  refreshRecordDisplay();

  // Ships tab/section
  ui.hangarShips.innerHTML = '';
  SHIPS.forEach((s, idx) => {
    const unlocked = profile.unlockedShips.includes(s.id);
    const selected = idx === profile.shipIdx;
    const canBuy = !unlocked && profile.credits >= s.cost;
    const card = document.createElement('div');
    card.className = `hangar-item ${selected ? 'selected' : ''}`;
    card.innerHTML = `
      <div class="hangar-item-head">
        <div>
          <div class="ship-name">${s.name}</div>
          <div class="hangar-sub">${s.role} · ${s.desc}</div>
        </div>
        <button type="button" class="${selected ? 'btn-ghost active-toggle' : unlocked ? 'btn-ghost' : canBuy ? 'btn-primary' : 'btn-ghost'} btn-sm">
          ${selected ? 'Equipada' : unlocked ? 'Equipar' : `${s.cost} CR`}
        </button>
      </div>
    `;
    card.querySelector('button').addEventListener('click', () => {
      audio.unlock();
      if (unlocked) {
        audio.uiClick();
        profile.shipIdx = idx;
      } else if (canBuy) {
        audio.powerup();
        profile.credits -= s.cost;
        profile.unlockedShips.push(s.id);
        profile.shipIdx = idx;
      } else {
        return;
      }
      saveProfile(profile);
      renderHangarUI();
      renderTitleSelectors();
    });
    ui.hangarShips.appendChild(card);
  });

  // Upgrades section
  ui.hangarUpgrades.innerHTML = '';
  UPGRADES.forEach((u) => {
    const lvl = profile.upgrades[u.id] || 0;
    const maxed = lvl >= u.maxLevel;
    const cost = upgradeCost(u, lvl);
    const canBuy = !maxed && profile.credits >= cost;
    const row = document.createElement('div');
    row.className = 'hangar-item';
    const pips = Array.from({ length: u.maxLevel }, (_, i) => `<span class="upg-pip ${i < lvl ? 'on' : ''}"></span>`).join('');
    row.innerHTML = `
      <div class="hangar-item-head">
        <div>
          <div class="ship-name">${u.name}</div>
          <div class="hangar-sub">${u.desc}</div>
          <div class="upg-pips">${pips}</div>
        </div>
        <button type="button" class="${maxed ? 'btn-ghost' : canBuy ? 'btn-primary' : 'btn-ghost'} btn-sm" ${maxed || !canBuy ? 'disabled' : ''}>
          ${maxed ? 'MÁX' : `${cost} CR`}
        </button>
      </div>
    `;
    row.querySelector('button').addEventListener('click', () => {
      if (!canBuy) return;
      audio.unlock();
      audio.powerup();
      profile.credits -= cost;
      profile.upgrades[u.id] = lvl + 1;
      saveProfile(profile);
      renderHangarUI();
    });
    ui.hangarUpgrades.appendChild(row);
  });

  // Skins section
  ui.hangarSkins.innerHTML = '';
  SKINS.forEach((sk) => {
    const unlocked = profile.unlockedSkins.includes(sk.id);
    const active = profile.selectedSkin === sk.id;
    const canBuy = !unlocked && profile.credits >= sk.cost;
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `skin-chip ${active ? 'selected' : ''}`;
    chip.innerHTML = `
      <span class="skin-dot" style="background:${sk.preview}"></span>
      <span>${sk.name}</span>
      <span class="mono skin-cost">${active ? 'ATIVO' : unlocked ? 'USAR' : `${sk.cost} CR`}</span>
    `;
    chip.addEventListener('click', () => {
      audio.unlock();
      if (unlocked) {
        audio.uiClick();
        profile.selectedSkin = sk.id;
      } else if (canBuy) {
        audio.powerup();
        profile.credits -= sk.cost;
        profile.unlockedSkins.push(sk.id);
        profile.selectedSkin = sk.id;
      } else {
        return;
      }
      saveProfile(profile);
      renderHangarUI();
    });
    ui.hangarSkins.appendChild(chip);
  });
}

function renderCodexUI() {
  const discovered = profile.codex.length;
  ui.codexCount.textContent = `${discovered} / ${CODEX_ENTRIES.length} Descobertos`;
  ui.codexList.innerHTML = '';
  CODEX_ENTRIES.forEach((entry) => {
    const ok = profile.codex.includes(entry.id);
    const el = document.createElement('div');
    el.className = `codex-card ${ok ? '' : 'locked'}`;
    el.innerHTML = `
      <div class="codex-cat">${entry.category}</div>
      <div class="codex-title">${ok ? entry.title : 'Registro Desconhecido'}</div>
      <p class="codex-lore">${ok ? entry.lore : 'Explore regiões espaciais, escaneie relíquias e derrote chefões para desbloquear este registro.'}</p>
    `;
    ui.codexList.appendChild(el);
  });
}

function openStarMap() {
  setScreen('starmap');
  const nextIds = state.region.nextRoutes || ['kharon_belt', 'cryo_nebula'];
  ui.starmapRoutes.innerHTML = '';
  nextIds.forEach((rid) => {
    const r = REGIONS[rid];
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'route-card';
    card.innerHTML = `
      <div class="route-head">
        <span class="route-title">${r.name}</span>
        <span class="mono route-mult">${r.rewardMult.toFixed(2)}× CR</span>
      </div>
      <div class="route-sub">${r.subtitle}</div>
      <p class="route-desc">${r.hazardDesc}</p>
      <div class="route-boss">Alvo do Setor: <strong>${r.bossName}</strong></div>
    `;
    card.addEventListener('click', () => {
      audio.unlock();
      audio.hyperspace();
      advanceToRegion(rid);
    });
    ui.starmapRoutes.appendChild(card);
  });
}

function showBanner(sub, title, duration = 2.6) {
  ui.bannerSub.textContent = sub;
  ui.bannerTitle.textContent = title;
  ui.banner.classList.remove('banner-hidden');
  ui.banner.classList.add('banner-visible');
  state.bannerTimer = duration;
}

function setScreen(mode) {
  state.mode = mode;
  ui.screenTitle.classList.toggle('hidden-screen', mode !== 'title');
  ui.screenHangar.classList.toggle('hidden-screen', mode !== 'hangar');
  ui.screenCodex.classList.toggle('hidden-screen', mode !== 'codex');
  ui.screenStarMap.classList.toggle('hidden-screen', mode !== 'starmap');
  ui.screenPause.classList.toggle('hidden-screen', mode !== 'paused');
  ui.screenGameOver.classList.toggle('hidden-screen', mode !== 'gameover');
  ui.hudLayer.style.opacity = (mode === 'playing' || mode === 'paused') ? '1' : '0';
}

function openHangar() {
  renderHangarUI();
  setScreen('hangar');
}

function openCodex() {
  renderCodexUI();
  setScreen('codex');
}

/* =========================================================================
   INPUT SYSTEM (Preserving 100% of Original Controls + Secondary R Missile)
========================================================================= */
const keys = new Set();
const pointer = { down: false, activeDrag: false, normX: 0, normY: 0, touchBoost: false };
let lastTapDir = 0, lastTapTime = 0;

function triggerBarrelRoll(dir) {
  const p = state.player;
  if (state.mode !== 'playing') return;
  if (p.barrelTimer > 0 || p.barrelCd > 0) return;
  const ship = getShip();
  p.barrelTimer = 0.52;
  p.barrelDir = dir || (p.vx < -0.5 ? -1 : 1);
  p.barrelCd = ship.rollCd;
  p.vx += p.barrelDir * 14.5;
  p.shieldFlash = Math.max(p.shieldFlash, 0.72);
  p.shieldWave = 0;
  p.shieldHitDir.set([0, 0, -1]);
  audio.barrelRoll();
  addPopup(p.x, p.y + 1.15, 0, 'MANOBRA 360°', '#34d399');
}

function fireHomingMissiles() {
  const p = state.player;
  if (state.mode !== 'playing' || p.missileCd > 0) return;
  const count = 2 + (profile.upgrades.missile || 0);
  const targets = [];

  if (state.boss && state.boss.dyingTimer <= 0) {
    state.boss.cores.forEach(c => {
      if (c.alive) targets.push({ kind: 'boss_core', ref: c, boss: state.boss });
    });
  }
  state.enemies.forEach(e => { if (e.z < -6 && e.z > -140) targets.push({ kind: 'enemy', ref: e }); });
  state.asteroids.forEach(a => { if (a.z < -8 && a.z > -120) targets.push({ kind: 'asteroid', ref: a }); });

  for (let i = 0; i < count; i++) {
    const spread = (i - (count - 1) * 0.5) * 1.4;
    const tgt = targets.length ? targets[i % targets.length] : null;
    state.missiles.push({
      x: p.x + spread * 0.7,
      y: p.y - 0.15,
      z: -1.6,
      vx: spread * 5.2,
      vy: 3.5 + (i % 2) * 1.6,
      vz: -68,
      life: 2.6,
      target: tgt,
      trail: Array.from({ length: 10 }, () => ({ x: p.x, y: p.y, z: -1.6 })),
      trailLen: 0
    });
  }
  p.missileMaxCd = Math.max(3.6, 6.8 - (profile.upgrades.missile || 0) * 0.9);
  p.missileCd = p.missileMaxCd;
  audio.missile();
  addPopup(p.x, p.y + 1.4, -1, `SALVA ×${count}`, '#fbbf24');
}

window.addEventListener('keydown', (e) => {
  const code = e.code;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
    e.preventDefault();
  }
  audio.unlock();

  if (state.mode === 'gameover' && (code === 'Enter' || code === 'Space')) {
    startGame();
    return;
  }
  if (state.mode === 'title' && code === 'Enter') {
    startGame();
    return;
  }
  if (code === 'Escape' || code === 'KeyP') {
    if (state.mode === 'playing') setScreen('paused');
    else if (state.mode === 'paused') setScreen('playing');
    else if (state.mode === 'hangar' || state.mode === 'codex') setScreen('title');
    return;
  }
  if (code === 'KeyM') {
    profile.muted = audio.toggleMute();
    saveProfile(profile);
    syncToggleButtons();
    return;
  }
  if (code === 'KeyF') {
    profile.autoFire = !profile.autoFire;
    saveProfile(profile);
    syncToggleButtons();
    return;
  }
  if (state.mode === 'playing') {
    if (code === 'KeyR') fireHomingMissiles();
    if (code === 'KeyE' || code === 'KeyQ') triggerBarrelRoll(code === 'KeyQ' ? -1 : 1);
    if (!e.repeat && ['KeyA', 'ArrowLeft', 'KeyD', 'ArrowRight'].includes(code)) {
      const dir = (code === 'KeyA' || code === 'ArrowLeft') ? -1 : 1;
      const now = performance.now();
      if (dir === lastTapDir && now - lastTapTime < 260) {
        triggerBarrelRoll(dir);
        lastTapTime = 0;
      } else {
        lastTapDir = dir;
        lastTapTime = now;
      }
    }
  }
  keys.add(code);
});

window.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('blur', () => {
  keys.clear();
  pointer.down = false;
  pointer.activeDrag = false;
  state.hangarDrag = false;
  if (state.mode === 'playing') setScreen('paused');
});

function updatePointerNorm(clientX, clientY) {
  const rect = glCanvas.getBoundingClientRect();
  pointer.normX = clamp(((clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
  pointer.normY = clamp(1 - ((clientY - rect.top) / rect.height) * 2, -1, 1);
}

glCanvas.addEventListener('pointerdown', (e) => {
  audio.unlock();
  if (state.mode === 'hangar' || state.mode === 'title') {
    state.hangarDrag = true;
    state.hangarLastX = e.clientX;
    return;
  }
  if (state.mode !== 'playing') return;
  if (e.button === 2) {
    triggerBarrelRoll(pointer.normX >= 0 ? 1 : -1);
    return;
  }
  pointer.down = true;
  pointer.activeDrag = true;
  updatePointerNorm(e.clientX, e.clientY);
});

window.addEventListener('pointermove', (e) => {
  if (state.hangarDrag && (state.mode === 'hangar' || state.mode === 'title')) {
    const dx = e.clientX - state.hangarLastX;
    state.hangarLastX = e.clientX;
    state.hangarOrbitYaw += dx * 0.01;
    return;
  }
  if (state.mode === 'playing' && (pointer.activeDrag || profile.mouseSteer)) {
    updatePointerNorm(e.clientX, e.clientY);
  }
});

window.addEventListener('pointerup', () => {
  pointer.down = false;
  pointer.activeDrag = false;
  state.hangarDrag = false;
});
glCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Touch & UI Button bindings
ui.touchRoll.addEventListener('pointerdown', (e) => { e.stopPropagation(); audio.unlock(); triggerBarrelRoll(); });
ui.touchMissile.addEventListener('pointerdown', (e) => { e.stopPropagation(); audio.unlock(); fireHomingMissiles(); });
ui.touchBoost.addEventListener('pointerdown', (e) => { e.stopPropagation(); audio.unlock(); pointer.touchBoost = true; });
ui.touchBoost.addEventListener('pointerup', () => { pointer.touchBoost = false; });
ui.touchBoost.addEventListener('pointerleave', () => { pointer.touchBoost = false; });

ui.btnStart.addEventListener('click', () => { audio.unlock(); audio.uiClick(); startGame(); });
ui.btnOpenHangar.addEventListener('click', () => { audio.unlock(); audio.uiClick(); openHangar(); });
ui.btnOpenCodex.addEventListener('click', () => { audio.unlock(); audio.uiClick(); openCodex(); });
ui.btnCloseHangar.addEventListener('click', () => { audio.uiClick(); setScreen('title'); renderTitleSelectors(); });
ui.btnCloseCodex.addEventListener('click', () => { audio.uiClick(); setScreen('title'); });
ui.btnRetry.addEventListener('click', () => { audio.unlock(); audio.uiClick(); startGame(); });
ui.btnGoHangar.addEventListener('click', () => { audio.uiClick(); openHangar(); });
ui.btnPause.addEventListener('click', () => { audio.uiClick(); setScreen('paused'); });
ui.btnResume.addEventListener('click', () => { audio.uiClick(); setScreen('playing'); });
ui.btnRestartPause.addEventListener('click', () => { audio.uiClick(); startGame(); });
ui.btnMenuPause.addEventListener('click', () => { audio.uiClick(); state.boss = null; setScreen('title'); renderTitleSelectors(); });

const toggleMouse = () => { audio.unlock(); audio.uiClick(); profile.mouseSteer = !profile.mouseSteer; saveProfile(profile); syncToggleButtons(); };
const toggleAuto = () => { audio.unlock(); audio.uiClick(); profile.autoFire = !profile.autoFire; saveProfile(profile); syncToggleButtons(); };
ui.btnMouseMode.addEventListener('click', toggleMouse);
ui.btnPauseMouse.addEventListener('click', toggleMouse);
ui.btnAutofire.addEventListener('click', toggleAuto);
ui.btnPauseAutofire.addEventListener('click', toggleAuto);
ui.btnQualityTitle.addEventListener('click', () => { audio.unlock(); audio.uiClick(); cycleQuality(); });
ui.btnPauseQuality.addEventListener('click', () => { audio.unlock(); audio.uiClick(); cycleQuality(); });
ui.btnMute.addEventListener('click', () => { audio.unlock(); profile.muted = audio.toggleMute(); saveProfile(profile); syncToggleButtons(); });

/* =========================================================================
   GAME LIFECYCLE, SECTOR TRANSITIONS & SPECIAL MISSIONS
========================================================================= */
function clearEntities() {
  state.asteroids.length = 0;
  state.enemies.length = 0;
  state.pillars.length = 0;
  state.rings.length = 0;
  state.relics.length = 0;
  state.powerups.length = 0;
  state.lasers.length = 0;
  state.missiles.length = 0;
  state.enemyShots.length = 0;
  state.sniperBeams.length = 0;
  state.particles.length = 0;
  state.glows.length = 0;
  state.shockwaves.length = 0;
  state.popups.length = 0;
  state.trailCount = 0;
  state.activeMission = null;
  ui.missionPill.classList.add('hidden');
}

function startGame() {
  gameRoot.focus();
  const ship = getShip();
  const maxSh = ship.maxShield + (profile.upgrades.hull || 0);
  state.score = 0;
  state.runCredits = 0;
  state.combo = 1;
  state.comboTimer = 0;
  state.maxCombo = 1;
  state.kills = 0;
  state.ringsCollected = 0;
  state.ringStreak = 0;
  state.sector = 1;
  state.sectorProgress = 0;
  state.baseSpeed = 56;
  state.speed = 56;
  state.shake = 0;
  state.damageVignette = 0;
  state.boostBlend = 0;
  state.warpFlash = 0.75;
  state.solarFlareTimer = 9.0;
  state.solarFlareState = 'idle';
  state.boss = null;

  state.player = {
    x: 0, y: 0.4, vx: 0, vy: 0,
    roll: 0, pitch: 0,
    shield: maxSh, maxShield: maxSh,
    invuln: 0,
    shieldFlash: 0.4, shieldWave: 1, shieldHitDir: new Float32Array([0, 0, 1]),
    boost: 1.0, boosting: false,
    fireCd: 0,
    missileCd: 0, missileMaxCd: Math.max(3.6, 6.8 - (profile.upgrades.missile || 0) * 0.9),
    barrelTimer: 0, barrelDir: 1, barrelCd: 0,
    tripleTimer: 0
  };

  clearEntities();
  setRegion(state.startRegionId, false);
  state.spawnTimers = { ast: 0.45, enemy: 1.5, ring: 3.8, pillar: 4.2, mission: 10.0 };

  // Welcoming golden portal & opening asteroids
  state.rings.push({ x: 0, y: 0.9, z: -108, rot: 0, passed: false });
  spawnAsteroid(-4.8, 1.4, -128, 1.9);

  ui.bossBarWrap.classList.add('hidden');
  ui.sectorProgressWrap.classList.remove('hidden');
  setScreen('playing');
  updateHUD();
  showBanner(`SETOR 01`, `${state.region.name} — ${state.region.subtitle}`, 2.8);
}

function advanceToRegion(nextRegionId) {
  const p = state.player;
  state.sector++;
  state.sectorProgress = 0;
  state.boss = null;
  state.warpFlash = 1.0;
  state.solarFlareState = 'idle';
  state.solarFlareTimer = 8.0;
  clearEntities();
  setRegion(nextRegionId, false);
  p.shield = Math.min(p.maxShield, p.shield + 2);
  p.boost = 1.0;
  p.missileCd = 0;
  state.spawnTimers = { ast: 0.6, enemy: 1.8, ring: 3.2, pillar: 4.0, mission: 9.5 };
  state.rings.push({ x: 0, y: 1.0, z: -115, rot: 0, passed: false });

  ui.bossBarWrap.classList.add('hidden');
  ui.sectorProgressWrap.classList.remove('hidden');
  setScreen('playing');
  updateHUD();
  showBanner(`SETOR ${String(state.sector).padStart(2, '0')}`, `${state.region.name} — ${state.region.subtitle}`, 3.0);
}

function triggerGameOver() {
  const p = state.player;
  spawnExplosion(p.x, p.y, 0, 2.5, [1.0, 0.62, 0.2]);
  audio.explosion(2.2);
  state.shake = 1.15;

  const finalScore = Math.floor(state.score);
  const isNewRecord = finalScore > profile.bestScore;
  if (isNewRecord) profile.bestScore = finalScore;
  if (state.sector > profile.bestSector) profile.bestSector = state.sector;
  profile.totalKills += state.kills;
  profile.totalRuns++;
  saveProfile(profile);
  refreshRecordDisplay();

  ui.goScore.textContent = finalScore.toLocaleString('pt-BR');
  ui.goCredits.textContent = `+${state.runCredits.toLocaleString('pt-BR')} CR`;
  ui.goNewRecord.classList.toggle('hidden', !isNewRecord);
  ui.goSector.textContent = String(state.sector).padStart(2, '0');
  ui.goKills.textContent = state.kills;
  ui.goRings.textContent = state.ringsCollected;
  ui.goMaxCombo.textContent = `×${state.maxCombo}`;
  setScreen('gameover');
}

/* =========================================================================
   COMBAT, FX, SPAWNERS & MISSIONS
========================================================================= */
function addPopup(x, y, z, text, color = '#f8fafc') {
  if (state.popups.length > 26) state.popups.shift();
  state.popups.push({ x, y, z, text, color, life: 1.05, maxLife: 1.05 });
}

function addCombo(amount = 1) {
  state.combo = Math.min(10, state.combo + amount);
  state.comboTimer = 5.8;
  if (state.combo > state.maxCombo) state.maxCombo = state.combo;
}

function addScore(basePoints, wx, wy, wz, label) {
  const mult = state.combo * (state.player.boosting ? 2 : 1);
  const pts = Math.round(basePoints * mult);
  state.score += pts;
  if (wx !== undefined) {
    addPopup(wx, wy, wz, label || `+${pts}`, mult >= 4 ? '#fbbf24' : '#f8fafc');
  }
}

function spawnExplosion(x, y, z, scale = 1.0, tint = [1.0, 0.68, 0.22]) {
  const qMult = renderer.quality === 'low' ? 0.55 : renderer.quality === 'medium' ? 0.8 : 1.0;
  // 1. Bright core flash + expanding plasma puffs (additive billboards!)
  state.glows.push({ x, y, z, vx: 0, vy: 0, vz: state.speed * 0.2, size: 2.8 * scale, grow: 5.5 * scale, r: 1, g: 0.94, b: 0.72, life: 0.22, maxLife: 0.22 });
  const puffs = Math.max(4, Math.floor((6 + scale * 4) * qMult));
  for (let i = 0; i < puffs; i++) {
    const a = rand(0, Math.PI * 2), el = rand(-1, 1);
    const spd = rand(2.5, 9.5) * scale;
    state.glows.push({
      x: x + rand(-0.4, 0.4) * scale, y: y + rand(-0.4, 0.4) * scale, z,
      vx: Math.cos(a) * spd, vy: el * spd, vz: Math.sin(a) * spd * 0.5 + state.speed * 0.22,
      size: rand(0.9, 2.0) * scale, grow: 2.2 * scale,
      r: tint[0], g: tint[1], b: tint[2],
      life: rand(0.32, 0.62), maxLife: 0.62
    });
  }
  // 2. Tumbling 3D shards
  const shards = Math.max(5, Math.floor((8 + scale * 6) * qMult));
  for (let i = 0; i < shards; i++) {
    const th = rand(0, Math.PI * 2), ph = Math.acos(rand(-1, 1)), spd = rand(7, 22) * scale;
    state.particles.push({
      x, y, z,
      vx: Math.sin(ph) * Math.cos(th) * spd,
      vy: Math.sin(ph) * Math.sin(th) * spd,
      vz: Math.cos(ph) * spd * 0.6 + state.speed * 0.25,
      rx: rand(0, 6), ry: rand(0, 6), vrx: rand(-10, 10), vry: rand(-10, 10),
      size: rand(0.16, 0.46) * scale,
      life: rand(0.35, 0.75), maxLife: 0.75,
      tint
    });
  }
  // 3. Expanding 3D Shockwave Ring
  state.shockwaves.push({
    x, y, z, scale: 0.6 * scale, maxScale: 4.8 * scale, life: 0.38, maxLife: 0.38, tint
  });
}

function spawnPowerup(x, y, z, forced) {
  const r = Math.random();
  const type = forced || (r < 0.34 ? 'triple' : r < 0.64 ? 'shield' : r < 0.85 ? 'missile' : 'nova');
  state.powerups.push({ x, y, z, type, spin: 0 });
}

function spawnAsteroid(fx, fy, fz, fscale, fragment = false) {
  const isBelt = state.region.mode === 'asteroid_field';
  const scale = fscale || (isBelt ? rand(1.3, 3.0) : rand(1.15, 2.45));
  const hp = Math.ceil(scale * 1.15 + state.sector * 0.25);
  state.asteroids.push({
    x: fx !== undefined ? fx : rand(-BOUNDS_X - 1.2, BOUNDS_X + 1.2),
    y: fy !== undefined ? fy : rand(BOUNDS_Y_MIN + 0.5, BOUNDS_Y_MAX + 0.5),
    z: fz !== undefined ? fz : -170,
    vx: fragment ? rand(-4.8, 4.8) : rand(-1.4, 1.4),
    vy: fragment ? rand(-3.5, 3.5) : rand(-0.6, 0.6),
    rx: rand(0, 6.28), ry: rand(0, 6.28), rz: rand(0, 6.28),
    vrx: rand(-1.9, 1.9), vry: rand(-1.9, 1.9),
    scale, hp, maxHp: hp, flash: 0, grazed: false,
    canSplit: !fragment && isBelt && scale >= 2.1,
    variant: state.region.mode === 'solar_corona' ? 3 : randInt(0, 2)
  });
}

function spawnEnemyWave() {
  const mode = state.region.mode;
  const roll = Math.random();

  // Swarm formation (5 fast mini-drones in spiral wave!)
  if (roll < 0.18 && state.sector >= 1) {
    const cx = rand(-4, 4), cy = rand(0.5, 3.5);
    for (let i = 0; i < 5; i++) {
      state.enemies.push({
        type: 'swarm', x: cx, y: cy, z: -150 - i * 8,
        targetZ: -44 + i * 2, phase: i * 1.1, strafeAmp: 4.2,
        anchorX: cx, anchorY: cy, hp: 1.1 + state.sector * 0.2, maxHp: 1.1 + state.sector * 0.2,
        fireCd: rand(1.3, 2.4), dwell: 4.5, flash: 0, roll: 0
      });
    }
    return;
  }

  // Proximity Mines cluster
  if (roll < 0.32) {
    const bx = rand(-5, 5), by = rand(-1.0, 3.6);
    for (let i = 0; i < 3; i++) {
      state.enemies.push({
        type: 'mine',
        x: clamp(bx + (i - 1) * 3.1, -BOUNDS_X + 1, BOUNDS_X - 1),
        y: clamp(by + rand(-1.2, 1.2), BOUNDS_Y_MIN + 1, BOUNDS_Y_MAX - 1),
        z: -165 - i * 9,
        targetZ: 20, phase: rand(0, 6), strafeAmp: 0, anchorX: 0, anchorY: 0,
        hp: 1.2, maxHp: 1.2, fireCd: 99, dwell: 0, flash: 0, roll: 0
      });
    }
    return;
  }

  // Tactical Squadron (Viper, Mantis, Aegis Shielded, or Spectre Sniper!)
  const count = Math.min(4, 1 + Math.floor((state.sector + 1) * 0.55) + (Math.random() < 0.35 ? 1 : 0));
  const baseX = rand(-4.8, 4.8), baseY = rand(0.2, 3.8);
  for (let i = 0; i < count; i++) {
    let type = 'viper';
    if (i === 0) {
      if ((mode === 'cryo_nebula' || state.sector >= 2) && Math.random() < 0.38) type = 'aegis';
      else if ((mode === 'ancient_ruins' || state.sector >= 2) && Math.random() < 0.34) type = 'sniper';
      else if (Math.random() < 0.35) type = 'mantis';
    }
    const off = (i - (count - 1) * 0.5) * 3.6;
    const hpMap = { viper: 1.9, mantis: 4.6, aegis: 4.2, sniper: 3.2 };
    const hp = hpMap[type] + state.sector * 0.7;
    state.enemies.push({
      type,
      x: clamp(baseX + off, -BOUNDS_X, BOUNDS_X),
      y: clamp(baseY + rand(-1.0, 1.0), -1.5, BOUNDS_Y_MAX),
      z: -158 - i * 11,
      targetZ: type === 'sniper' ? -64 : rand(-48, -33),
      phase: rand(0, 6.28),
      strafeAmp: type === 'sniper' ? 1.5 : type === 'aegis' ? 2.2 : 3.5,
      anchorX: clamp(baseX + off, -BOUNDS_X + 2, BOUNDS_X - 2),
      anchorY: clamp(baseY + rand(-0.7, 0.9), -1.2, BOUNDS_Y_MAX - 0.5),
      hp, maxHp: hp,
      shieldHp: type === 'aegis' ? 3.5 + state.sector * 0.8 : 0,
      shieldWave: 1,
      sniperAim: 0, sniperTx: 0, sniperTy: 0,
      fireCd: rand(1.0, 2.1),
      dwell: rand(4.8, 7.6),
      flash: 0, roll: 0
    });
  }
}

function triggerSpecialMission() {
  if (state.activeMission || state.boss) return;
  const roll = Math.random();
  if (roll < 0.42) {
    // Exploration: Scannable Relic Probe!
    const rx = rand(-5.2, 5.2), ry = rand(0.0, 3.6);
    const relic = { x: rx, y: ry, z: -155, rot: 0, scan: 0, scanned: false };
    state.relics.push(relic);
    state.activeMission = { type: 'relic', label: 'EXPLORAÇÃO: ESCANEIE A RELÍQUIA', ref: relic, timer: 14 };
    showBanner('ANOMALIA DETECTADA', 'MANTENHA A MIRA NA RELÍQUIA PARA ESCANEAR', 2.4);
  } else if (roll < 0.74) {
    // Special Op: Convoy Interception!
    const hp = 14 + state.sector * 5;
    const convoy = {
      type: 'convoy', x: rand(-4, 4), y: rand(0.5, 3.5), z: -150,
      targetZ: -54, phase: 0, strafeAmp: 4.5, anchorX: 0, anchorY: 2.0,
      hp, maxHp: hp, fireCd: 99, dwell: 11.5, flash: 0, roll: 0
    };
    state.enemies.push(convoy);
    state.activeMission = { type: 'convoy', label: 'OPERAÇÃO: INTERCEPTE O COMBOIO', ref: convoy, timer: 12 };
    showBanner('ALVO VIP', 'DESTRUA O COMBOIO ANTES DA DOBRA!', 2.4);
  } else {
    // Speed Rift: Chain of 4 golden curving rings!
    const dir = Math.random() < 0.5 ? -1 : 1;
    for (let i = 0; i < 4; i++) {
      state.rings.push({
        x: clamp(dir * (-4.5 + i * 3.0), -7.2, 7.2),
        y: 1.0 + Math.sin(i * 1.1) * 1.8,
        z: -145 - i * 24,
        rot: i * 0.4,
        passed: false
      });
    }
    state.activeMission = { type: 'rush', label: 'FENDA DE VELOCIDADE: ATRAVESSE OS ANÉIS', timer: 7.5 };
    showBanner('FENDA DE VELOCIDADE', 'ENCADEIE OS ANÉIS DOURADOS!', 2.2);
  }
  ui.missionPill.textContent = state.activeMission.label;
  ui.missionPill.classList.remove('hidden');
}

function spawnBoss() {
  const reg = state.region;
  const sec = state.sector;
  const baseCoreHp = 20 + sec * 11;

  let cores;
  if (reg.bossId === 'archon') {
    cores = [
      { ox: 0, oy: 0, oz: 2.0, hp: baseCoreHp * 2.2, maxHp: baseCoreHp * 2.2, flash: 0, alive: true, orbit: false },
      { ox: -5.8, oy: 0, oz: 1.5, hp: baseCoreHp * 0.9, maxHp: baseCoreHp * 0.9, flash: 0, alive: true, orbit: true, angle: 0 },
      { ox: 5.8, oy: 0, oz: 1.5, hp: baseCoreHp * 0.9, maxHp: baseCoreHp * 0.9, flash: 0, alive: true, orbit: true, angle: Math.PI }
    ];
  } else if (reg.bossId === 'krag') {
    cores = [
      { ox: -5.2, oy: -0.2, oz: 3.4, hp: baseCoreHp, maxHp: baseCoreHp, flash: 0, alive: true },
      { ox:  0.0, oy:  1.2, oz: 2.6, hp: baseCoreHp * 1.3, maxHp: baseCoreHp * 1.3, flash: 0, alive: true },
      { ox:  5.2, oy: -0.2, oz: 3.4, hp: baseCoreHp, maxHp: baseCoreHp, flash: 0, alive: true }
    ];
  } else if (reg.bossId === 'phoenix') {
    cores = [
      { ox: -6.2, oy:  0.6, oz: 2.0, hp: baseCoreHp * 1.1, maxHp: baseCoreHp * 1.1, flash: 0, alive: true },
      { ox:  0.0, oy:  0.2, oz: 3.2, hp: baseCoreHp * 1.4, maxHp: baseCoreHp * 1.4, flash: 0, alive: true },
      { ox:  6.2, oy:  0.6, oz: 2.0, hp: baseCoreHp * 1.1, maxHp: baseCoreHp * 1.1, flash: 0, alive: true }
    ];
  } else {
    cores = [
      { ox: -6.8, oy: -0.2, oz: 2.4, hp: baseCoreHp, maxHp: baseCoreHp, flash: 0, alive: true },
      { ox:  0.0, oy:  0.2, oz: 3.1, hp: baseCoreHp * 1.3, maxHp: baseCoreHp * 1.3, flash: 0, alive: true },
      { ox:  6.8, oy: -0.2, oz: 2.4, hp: baseCoreHp, maxHp: baseCoreHp, flash: 0, alive: true }
    ];
  }

  state.boss = {
    id: reg.bossId,
    name: `${reg.bossName} MK.${sec}`,
    x: 0, y: 2.0, z: -158,
    targetZ: -46,
    phase: 0,
    spin: 0,
    fireCd: 1.7,
    escortCd: 7.5,
    shieldOn: false,
    shieldTimer: 0,
    dyingTimer: 0,
    flash: 0,
    cores
  };
  state.activeMission = null;
  ui.missionPill.classList.add('hidden');
  audio.bossWarning();
  showBanner(`ALERTA SETOR ${String(sec).padStart(2, '0')}`, state.boss.name, 3.2);
  ui.sectorProgressWrap.classList.add('hidden');
  ui.bossBarWrap.classList.remove('hidden');
  ui.bossName.textContent = state.boss.name;
}

function destroyBossCore(core) {
  if (!core.alive) return;
  core.alive = false;
  core.hp = 0;
  const b = state.boss;
  const wx = b.x + core.ox, wy = b.y + core.oy, wz = b.z + core.oz;
  spawnExplosion(wx, wy, wz, 2.3, [1.0, 0.56, 0.16]);
  audio.explosion(1.9);
  state.shake = 0.85;
  addCombo(2);
  addScore(800, wx, wy + 1.5, wz, 'NÚCLEO DESTRUÍDO!');
  addCredits(65, wx, wy, wz);

  if (b.cores.every(c => !c.alive)) {
    b.dyingTimer = 1.7;
    unlockCodex(`boss_${b.id}`);
    showBanner('ALVO ELIMINADO', `${b.name} DESTRUÍDO!`, 2.6);
  }
}

function triggerNovaEMP() {
  const p = state.player;
  audio.explosion(2.0);
  state.shake = 0.9;
  state.shockwaves.push({ x: p.x, y: p.y, z: -6, scale: 1.8, maxScale: 38, life: 0.65, maxLife: 0.65, tint: [0.3, 0.96, 0.72] });
  addPopup(p.x, p.y + 1.5, -2, 'PULSO PEM NOVA!', '#34d399');
  state.enemyShots.length = 0;

  for (let i = state.asteroids.length - 1; i >= 0; i--) {
    const a = state.asteroids[i];
    if (a.z > -128) {
      spawnExplosion(a.x, a.y, a.z, a.scale * 0.7, [0.4, 0.95, 0.75]);
      addScore(100, a.x, a.y, a.z);
      state.asteroids.splice(i, 1);
    }
  }
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    if (e.z > -135) {
      e.shieldHp = 0;
      spawnExplosion(e.x, e.y, e.z, 1.35, [0.4, 0.95, 0.75]);
      addScore(250, e.x, e.y, e.z);
      addCredits(18);
      state.kills++;
      state.enemies.splice(i, 1);
    }
  }
  if (state.boss && state.boss.dyingTimer <= 0) {
    state.boss.shieldOn = false;
    state.boss.cores.forEach(c => {
      if (c.alive) { c.hp -= 9; c.flash = 1; if (c.hp <= 0) destroyBossCore(c); }
    });
  }
}

function detonateMineChain(mx, my, mz) {
  spawnExplosion(mx, my, mz, 2.2, [1.0, 0.35, 0.18]);
  audio.explosion(1.6);
  state.shake = Math.max(state.shake, 0.5);
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    if (Math.hypot(e.x - mx, e.y - my, e.z - mz) < 12) {
      e.hp -= 5;
      e.flash = 1;
      if (e.hp <= 0) {
        spawnExplosion(e.x, e.y, e.z, 1.2, [1, 0.5, 0.2]);
        addScore(200, e.x, e.y, e.z, 'REAÇÃO EM CADEIA!');
        addCredits(20);
        state.kills++;
        state.enemies.splice(i, 1);
      }
    }
  }
}

function findAimAssistTarget(px, py) {
  let best = null, bestScore = 1e9;
  const consider = (tx, ty, tz, radius) => {
    if (tz >= -4 || tz < -125) return;
    const perp = Math.hypot(tx - px, ty - py);
    if (perp < 2.75 + radius * 0.55) {
      const m = perp * 4.4 + (-tz) * 0.11;
      if (m < bestScore) { bestScore = m; best = { x: tx, y: ty, z: tz }; }
    }
  };
  if (state.boss && state.boss.dyingTimer <= 0) {
    for (const c of state.boss.cores) {
      if (c.alive) consider(state.boss.x + c.ox, state.boss.y + c.oy, state.boss.z + c.oz, 1.6);
    }
  }
  for (const e of state.enemies) consider(e.x, e.y, e.z, e.type === 'mantis' || e.type === 'convoy' ? 2.2 : 1.5);
  for (const a of state.asteroids) consider(a.x, a.y, a.z, a.scale);
  return best;
}

function firePlayerLasers() {
  const p = state.player;
  const ship = getShip();
  const wepLvl = profile.upgrades.weapons || 0;
  const dmgMult = 1 + wepLvl * 0.16;
  const triple = p.tripleTimer > 0 || !!ship.innateTriple;
  const aim = findAimAssistTarget(p.x, p.y);
  const speedZ = -205;

  const addBolt = (ox, oy, spreadX) => {
    let vx = spreadX, vy = 0;
    if (aim) {
      const dt = Math.max(0.08, (aim.z + 1.4) / speedZ);
      vx = clamp((aim.x - (p.x + ox)) / dt, -36, 36) + spreadX * 0.35;
      vy = clamp((aim.y - (p.y + oy)) / dt, -30, 30);
    }
    state.lasers.push({
      x: p.x + ox, y: p.y + oy, z: -1.4,
      vx, vy, vz: speedZ,
      dmg: ship.damage * dmgMult * (triple ? 1.05 : 1.0),
      amber: triple || ship.id === 'bastion' || ship.id === 'aurelia'
    });
  };

  if (triple) {
    addBolt(-1.3, -0.1, -6.2);
    addBolt(0, 0.12, 0);
    addBolt(1.3, -0.1, 6.2);
  } else {
    addBolt(-1.3, -0.1, 0);
    addBolt(1.3, -0.1, 0);
  }
  audio.laser(triple, ship.id === 'bastion');
}

function damagePlayer(hitX = 0, hitY = 0, hitZ = -1) {
  const p = state.player;
  if (p.invuln > 0 || p.barrelTimer > 0) return;
  p.shield--;
  p.invuln = 1.6;
  p.shieldFlash = 1.0;
  p.shieldWave = 0.0;
  const dx = hitX - p.x, dy = hitY - p.y, dz = hitZ;
  const l = Math.hypot(dx, dy, dz) || 1;
  p.shieldHitDir.set([dx / l, dy / l, dz / l]);

  state.combo = 1;
  state.comboTimer = 0;
  state.ringStreak = 0;
  state.shake = 0.78;
  state.damageVignette = 1.0;
  audio.damage();
  spawnExplosion(p.x, p.y, -0.4, 0.9, [1.0, 0.32, 0.2]);

  if (p.shield <= 0) triggerGameOver();
}

/* =========================================================================
   MAIN SIMULATION UPDATE
========================================================================= */
function updateEnvironment(dt) {
  const r = state.region;
  const e = state.env;
  const k = Math.min(1, dt * 1.8);
  for (let i = 0; i < 3; i++) {
    e.fog[i] = lerp(e.fog[i], r.fog[i], k);
    e.lightDir[i] = lerp(e.lightDir[i], r.lightDir[i], k);
    e.sunDir[i] = lerp(e.sunDir[i], r.sunDir[i], k);
    e.lightCol[i] = lerp(e.lightCol[i], r.lightCol[i], k);
    e.ambient[i] = lerp(e.ambient[i], r.ambient[i], k);
    e.rim[i] = lerp(e.rim[i], r.rim[i], k);
    e.sunTint[i] = lerp(e.sunTint[i], r.sunTint[i], k);
  }
  e.fogNear = lerp(e.fogNear, r.fogNear, k);
  e.fogFar = lerp(e.fogFar, r.fogFar, k);
}

function updateWorldScroll(dt, spd) {
  if (state.region.mode === 'solar_corridor') {
    for (const seg of state.trench) {
      seg.z += spd * dt;
      if (seg.z > 24) {
        seg.z -= TRENCH_COUNT * TRENCH_LEN;
        seg.leftH = rand(7, 23);
        seg.rightH = rand(7, 23);
      }
    }
  }
  for (const d of state.decor) {
    d.z += spd * (d.kind === 'rock' ? 0.65 : 0.95) * dt;
    d.rz += d.spin * dt;
    if (d.z > 24) {
      d.z -= d.kind === 'gate' ? 224 : 230;
    }
  }
}

function updateTrails(dt, spd) {
  const p = state.player;
  const ship = getShip();
  const cr = Math.cos(p.roll), sr = Math.sin(p.roll);
  const cp = Math.cos(p.pitch), sp = Math.sin(p.pitch);

  // Shift points backward in Z so trail streams behind ship
  for (let t = 0; t < 2; t++) {
    const ring = state.trails[t];
    for (let i = TRAIL_LEN - 1; i > 0; i--) {
      ring[i].x = ring[i - 1].x;
      ring[i].y = ring[i - 1].y;
      ring[i].z = ring[i - 1].z + spd * dt;
    }
    const [ox, oy, oz] = ship.wingtips[t];
    const rx = ox * cr - oy * sr;
    const ry = (ox * sr + oy * cr) * cp - oz * sp;
    ring[0].x = p.x + rx;
    ring[0].y = p.y + ry;
    ring[0].z = oz;
  }
  if (state.trailCount < TRAIL_LEN) state.trailCount++;
}

function update(dt) {
  state.time += dt;
  updateEnvironment(dt);
  state.warpFlash = Math.max(0, state.warpFlash - dt * 1.4);

  if (state.bannerTimer > 0) {
    state.bannerTimer -= dt;
    if (state.bannerTimer <= 0) {
      ui.banner.classList.remove('banner-visible');
      ui.banner.classList.add('banner-hidden');
    }
  }

  // Non-playing showcase / attract modes
  if (state.mode !== 'playing') {
    const attractSpd = (state.mode === 'paused' || state.mode === 'starmap') ? 0 : 34;
    if (attractSpd > 0) {
      state.travel += attractSpd * dt;
      updateWorldScroll(dt, attractSpd);
      if (state.mode === 'hangar' || state.mode === 'codex') {
        if (!state.hangarDrag) state.hangarOrbitYaw += dt * 0.35;
        state.player.x = 0;
        state.player.y = 0.5 + Math.sin(state.time * 1.6) * 0.16;
        state.player.roll = Math.sin(state.time * 0.9) * 0.08;
        state.player.pitch = Math.cos(state.time * 1.2) * 0.05;
      } else {
        state.player.x = Math.sin(state.time * 0.65) * 3.4;
        state.player.y = 0.8 + Math.sin(state.time * 1.1) * 0.9;
        state.player.roll = -Math.cos(state.time * 0.65) * 0.34;
        state.player.pitch = Math.cos(state.time * 1.1) * 0.14;
      }
      updateTrails(dt, attractSpd);
    }
    audio.update(dt, false, 0, 0, 0);
    if (state.mode === 'gameover') updateVFX(dt);
    return;
  }

  const p = state.player;
  const ship = getShip();
  const reactorMult = 1 + (profile.upgrades.reactor || 0) * 0.22;

  // --- 1. BOOST, SPEED & SOLAR WIND ---
  const wantBoost = keys.has('ShiftLeft') || keys.has('ShiftRight') || pointer.touchBoost;
  if (wantBoost && p.boost > 0.04) {
    p.boosting = true;
    p.boost = Math.max(0, p.boost - (ship.boostDrain / reactorMult) * dt);
  } else {
    p.boosting = false;
    p.boost = Math.min(1.0, p.boost + 0.18 * reactorMult * dt);
  }
  state.boostBlend = lerp(state.boostBlend, p.boosting ? 1 : 0, Math.min(1, dt * 8));
  state.baseSpeed = 56 + (state.sector - 1) * 8 + state.sectorProgress * 12;
  state.speed = state.baseSpeed * (1 + state.boostBlend * 0.62);
  state.travel += state.speed * dt;
  updateWorldScroll(dt, state.speed);

  state.score += state.speed * dt * 0.34 * (p.boosting ? 2 : 1);
  const musicIntensity = state.boss ? 2 : state.enemies.length > 0 ? 1 : 0;
  audio.update(dt, true, state.boostBlend, clamp((state.speed - 50) / 55, 0, 1), musicIntensity);

  // --- 2. PLAYER MOVEMENT & SHIELD DOME FX ---
  let ix = 0, iy = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) iy += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) iy -= 1;

  if (ix !== 0 || iy !== 0) {
    const len = Math.hypot(ix, iy);
    ix /= len; iy /= len;
    p.vx = lerp(p.vx, ix * ship.speed, Math.min(1, dt * 11));
    p.vy = lerp(p.vy, iy * ship.speed * 0.85, Math.min(1, dt * 11));
  } else if (pointer.activeDrag || profile.mouseSteer) {
    const tx = pointer.normX * BOUNDS_X;
    const ty = lerp(BOUNDS_Y_MIN + 0.4, BOUNDS_Y_MAX - 0.3, (pointer.normY + 1) * 0.5);
    p.vx = lerp(p.vx, clamp((tx - p.x) * 6.5, -ship.speed * 1.15, ship.speed * 1.15), Math.min(1, dt * 12));
    p.vy = lerp(p.vy, clamp((ty - p.y) * 6.5, -ship.speed, ship.speed), Math.min(1, dt * 12));
  } else {
    p.vx *= Math.pow(0.001, dt);
    p.vy *= Math.pow(0.001, dt);
  }

  p.x = clamp(p.x + p.vx * dt, -BOUNDS_X, BOUNDS_X);
  p.y = clamp(p.y + p.vy * dt, BOUNDS_Y_MIN, BOUNDS_Y_MAX);

  if (p.barrelTimer > 0) {
    p.barrelTimer = Math.max(0, p.barrelTimer - dt);
    p.roll = -p.barrelDir * (1 - p.barrelTimer / 0.52) * Math.PI * 2;
  } else {
    p.roll = lerp(p.roll, clamp(-p.vx / ship.speed * 0.58, -0.68, 0.68), Math.min(1, dt * 10));
  }
  p.barrelCd = Math.max(0, p.barrelCd - dt);
  p.missileCd = Math.max(0, p.missileCd - dt);
  p.pitch = lerp(p.pitch, clamp(p.vy / ship.speed * 0.34, -0.36, 0.38), Math.min(1, dt * 10));
  p.invuln = Math.max(0, p.invuln - dt);
  p.tripleTimer = Math.max(0, p.tripleTimer - dt);
  p.shieldFlash = Math.max(0, p.shieldFlash - dt * 1.6);
  p.shieldWave = Math.min(1.0, p.shieldWave + dt * 2.2);

  // Progressive visual hull damage sparks when critical (shield === 1)
  if (p.shield === 1 && Math.random() < dt * 16) {
    state.glows.push({
      x: p.x + rand(-0.6, 0.6), y: p.y + rand(-0.2, 0.2), z: 0.6,
      vx: rand(-2, 2), vy: rand(0.5, 2.5), vz: state.speed * 0.45,
      size: 0.42, grow: 0.8, r: 1.0, g: 0.45, b: 0.14, life: 0.32, maxLife: 0.32
    });
  }

  updateTrails(dt, state.speed);

  if (state.combo > 1) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) state.combo = 1;
  }
  state.shake = Math.max(0, state.shake - dt * 2.6);
  state.damageVignette = Math.max(0, state.damageVignette - dt * 2.2);

  // --- 3. WEAPONS ---
  const rateScale = 1 / (1 + (profile.upgrades.weapons || 0) * 0.10);
  p.fireCd = Math.max(0, p.fireCd - dt);
  const wantFire = keys.has('Space') || keys.has('KeyJ') || pointer.down || profile.autoFire;
  if (wantFire && p.fireCd <= 0) {
    firePlayerLasers();
    p.fireCd = ship.fireRate * rateScale * (p.tripleTimer > 0 ? 0.85 : 1.0);
  }

  // --- 4. BIOME-SPECIFIC HAZARD: SOLAR FLARE SWEEP (Fenda de Ignição) ---
  if (state.region.mode === 'solar_corona' && !state.boss) {
    state.solarFlareTimer -= dt;
    if (state.solarFlareState === 'idle' && state.solarFlareTimer <= 0) {
      state.solarFlareState = 'warn';
      state.solarFlareTimer = 2.1;
      state.solarFlareSafeX = rand(-5.5, 5.5);
      audio.bossWarning();
      showBanner('ERUPÇÃO SOLAR', 'VA PARA A ZONA SEGURA OU USE MANOBRA 360°!', 2.0);
    } else if (state.solarFlareState === 'warn' && state.solarFlareTimer <= 0) {
      state.solarFlareState = 'active';
      state.solarFlareTimer = 0.7;
      state.shake = 0.65;
      audio.explosion(1.6);
      if (Math.abs(p.x - state.solarFlareSafeX) > 3.5 && p.barrelTimer <= 0) {
        damagePlayer(p.x, p.y, -2);
      } else {
        addScore(300, p.x, p.y + 1.4, -1, 'ERUPÇÃO EVITADA!');
        addCredits(25);
      }
    } else if (state.solarFlareState === 'active' && state.solarFlareTimer <= 0) {
      state.solarFlareState = 'idle';
      state.solarFlareTimer = rand(11, 15);
    }
  }

  // --- 5. SECTOR PROGRESSION, SPECIAL MISSIONS & SPAWNING ---
  if (state.activeMission) {
    state.activeMission.timer -= dt;
    if (state.activeMission.timer <= 0) {
      state.activeMission = null;
      ui.missionPill.classList.add('hidden');
    }
  }

  if (!state.boss) {
    state.sectorProgress += dt / (38 + state.sector * 6);
    if (state.sectorProgress >= 1.0) {
      state.sectorProgress = 1.0;
      spawnBoss();
    } else {
      const diffScale = 1 + (state.sector - 1) * 0.2;
      const isBelt = state.region.mode === 'asteroid_field';
      state.spawnTimers.ast -= dt * diffScale * (isBelt ? 1.55 : 1.0);
      state.spawnTimers.enemy -= dt * diffScale;
      state.spawnTimers.ring -= dt;
      state.spawnTimers.pillar -= dt * diffScale;
      state.spawnTimers.mission -= dt;

      if (state.spawnTimers.ast <= 0) {
        spawnAsteroid();
        state.spawnTimers.ast = rand(0.65, 1.3);
      }
      if (state.spawnTimers.enemy <= 0 && state.enemies.length < 7) {
        spawnEnemyWave();
        state.spawnTimers.enemy = rand(3.5, 5.2);
      }
      if (state.spawnTimers.ring <= 0) {
        state.rings.push({ x: rand(-BOUNDS_X + 2.5, BOUNDS_X - 2.5), y: rand(-1.4, BOUNDS_Y_MAX - 1.2), z: -168, rot: 0, passed: false });
        state.spawnTimers.ring = rand(4.6, 6.8);
      }
      if (state.spawnTimers.pillar <= 0 && state.region.mode === 'solar_corridor') {
        const h = rand(6.5, 11.5);
        state.pillars.push({ x: rand(-BOUNDS_X + 1.2, BOUNDS_X - 1.2), y: -8.5 + h * 0.5, z: -170, height: h, hp: 4 + state.sector, flash: 0, grazed: false });
        state.spawnTimers.pillar = rand(4.5, 6.8);
      }
      if (state.spawnTimers.mission <= 0 && state.sectorProgress > 0.18 && state.sectorProgress < 0.78) {
        triggerSpecialMission();
        state.spawnTimers.mission = 18.0;
      }
    }
  } else {
    updateBoss(dt);
  }

  // --- 6. PLAYER LASERS ---
  for (let i = state.lasers.length - 1; i >= 0; i--) {
    const l = state.lasers[i];
    l.x += l.vx * dt; l.y += l.vy * dt; l.z += l.vz * dt;
    if (checkPlayerProjectileHit(l.x, l.y, l.z, l.dmg, false) || l.z < -185) {
      state.lasers.splice(i, 1);
    }
  }

  // --- 7. HOMING MISSILES ---
  for (let i = state.missiles.length - 1; i >= 0; i--) {
    const m = state.missiles[i];
    m.life -= dt;

    // Steer toward locked target
    let tx = null, ty = null, tz = null;
    if (m.target) {
      if (m.target.kind === 'boss_core' && m.target.ref.alive && state.boss) {
        tx = state.boss.x + m.target.ref.ox;
        ty = state.boss.y + m.target.ref.oy;
        tz = state.boss.z + m.target.ref.oz;
      } else if (m.target.kind === 'enemy' && state.enemies.includes(m.target.ref)) {
        tx = m.target.ref.x; ty = m.target.ref.y; tz = m.target.ref.z;
      } else if (m.target.kind === 'asteroid' && state.asteroids.includes(m.target.ref)) {
        tx = m.target.ref.x; ty = m.target.ref.y; tz = m.target.ref.z;
      }
    }
    if (tx !== null) {
      const dx = tx - m.x, dy = ty - m.y, dz = tz - m.z;
      const dist = Math.hypot(dx, dy, dz) || 1;
      const spd = 118;
      m.vx = lerp(m.vx, (dx / dist) * spd, Math.min(1, dt * 8.5));
      m.vy = lerp(m.vy, (dy / dist) * spd, Math.min(1, dt * 8.5));
      m.vz = lerp(m.vz, (dz / dist) * spd, Math.min(1, dt * 8.5));
    } else {
      m.vz = lerp(m.vz, -135, Math.min(1, dt * 4));
    }
    m.x += m.vx * dt; m.y += m.vy * dt; m.z += m.vz * dt;

    // Update missile trail
    for (let k = m.trail.length - 1; k > 0; k--) {
      m.trail[k].x = m.trail[k - 1].x;
      m.trail[k].y = m.trail[k - 1].y;
      m.trail[k].z = m.trail[k - 1].z;
    }
    m.trail[0].x = m.x; m.trail[0].y = m.y; m.trail[0].z = m.z;
    if (m.trailLen < m.trail.length) m.trailLen++;

    const hit = checkPlayerProjectileHit(m.x, m.y, m.z, 4.8 + (profile.upgrades.weapons || 0) * 0.9, true);
    if (hit || m.life <= 0 || m.z < -185) {
      if (hit) {
        spawnExplosion(m.x, m.y, m.z, 1.4, [1.0, 0.72, 0.24]);
        audio.explosion(1.1);
      }
      state.missiles.splice(i, 1);
    }
  }

  // --- 8. ASTEROIDS ---
  for (let i = state.asteroids.length - 1; i >= 0; i--) {
    const a = state.asteroids[i];
    a.x += a.vx * dt; a.y += a.vy * dt; a.z += state.speed * dt;
    a.rx += a.vrx * dt; a.ry += a.vry * dt;
    a.flash = Math.max(0, a.flash - dt * 6);
    if (Math.abs(a.z) < a.scale + 1.1) {
      const d = Math.hypot(a.x - p.x, a.y - p.y);
      if (d < a.scale * 0.85 + 0.72) {
        damagePlayer(a.x, a.y, a.z);
        spawnExplosion(a.x, a.y, a.z, a.scale * 0.7, [1, 0.5, 0.2]);
        state.asteroids.splice(i, 1);
        continue;
      } else if (!a.grazed && d < a.scale + 2.3) {
        a.grazed = true;
        audio.graze();
        addScore(130, p.x, p.y + 1.1, -1, 'RASPÃO! +130');
        p.boost = Math.min(1, p.boost + 0.16);
      }
    }
    if (a.z > 20) state.asteroids.splice(i, 1);
  }

  // --- 9. HAZARD PILLARS ---
  for (let i = state.pillars.length - 1; i >= 0; i--) {
    const pl = state.pillars[i];
    pl.z += state.speed * dt;
    pl.flash = Math.max(0, pl.flash - dt * 6);
    if (Math.abs(pl.z) < 1.6 && p.y < pl.y + pl.height * 0.5 + 0.4) {
      const dx = Math.abs(p.x - pl.x);
      if (dx < 1.35) {
        damagePlayer(pl.x, p.y, pl.z);
        spawnExplosion(pl.x, p.y, pl.z, 1.2, [1, 0.35, 0.2]);
        state.pillars.splice(i, 1);
        continue;
      } else if (!pl.grazed && dx < 2.6) {
        pl.grazed = true;
        audio.graze();
        addScore(150, p.x, p.y + 1.0, -1, 'RASPÃO! +150');
      }
    }
    if (pl.z > 20) state.pillars.splice(i, 1);
  }

  // --- 10. ENEMIES (All 6 Classes + Convoy VIP) ---
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    e.flash = Math.max(0, e.flash - dt * 6);
    if (e.shieldWave !== undefined) e.shieldWave = Math.min(1, e.shieldWave + dt * 2.4);

    if (e.type === 'mine') {
      e.z += state.speed * 0.82 * dt;
      e.phase += dt * 4;
      if (Math.abs(e.z) < 1.8 && Math.hypot(e.x - p.x, e.y - p.y) < 2.1) {
        damagePlayer(e.x, e.y, e.z);
        detonateMineChain(e.x, e.y, e.z);
        state.enemies.splice(i, 1);
        continue;
      }
    } else if (e.dwell > 0) {
      e.phase += dt * (e.type === 'swarm' ? 4.2 : e.type === 'mantis' ? 1.7 : 2.4);
      if (e.z < e.targetZ) {
        e.z += Math.max(state.speed * 0.9, 56) * dt;
      } else {
        e.dwell -= dt;
        const prevX = e.x;
        e.x = clamp(e.anchorX + Math.sin(e.phase) * e.strafeAmp, -BOUNDS_X, BOUNDS_X);
        e.y = clamp(e.anchorY + Math.cos(e.phase * 0.85) * (e.type === 'swarm' ? 2.4 : 1.3), -1.6, BOUNDS_Y_MAX);
        e.roll = clamp((e.x - prevX) / Math.max(dt, 0.001) * -0.045, -0.75, 0.75);

        if (e.type === 'sniper') {
          e.fireCd -= dt;
          if (e.fireCd <= 0.95 && e.fireCd > 0) {
            if (e.sniperAim <= 0) audio.sniperCharge();
            e.sniperAim = 1 - e.fireCd / 0.95;
            e.sniperTx = lerp(e.sniperTx || p.x, p.x, dt * 2.5);
            e.sniperTy = lerp(e.sniperTy || p.y, p.y, dt * 2.5);
          } else if (e.fireCd <= 0) {
            e.sniperAim = 0;
            audio.sniperFire();
            state.sniperBeams.push({ x: e.sniperTx, y: e.sniperTy, z: e.z * 0.5, life: 0.25, maxLife: 0.25 });
            if (Math.hypot(p.x - e.sniperTx, p.y - e.sniperTy) < 1.65) {
              damagePlayer(e.sniperTx, e.sniperTy, -2);
            }
            e.fireCd = 3.2;
          }
        } else if (e.type !== 'convoy') {
          e.fireCd -= dt;
          if (e.fireCd <= 0) {
            fireEnemyOrb(e.x, e.y, e.z + 1.4, p.x, p.y, e.type === 'mantis');
            e.fireCd = (e.type === 'mantis' ? 1.55 : e.type === 'swarm' ? 2.6 : 2.1) / (1 + (state.sector - 1) * 0.1);
          }
        }
      }
    } else {
      e.z += (e.type === 'convoy' ? -95 : state.speed * 1.15) * dt;
      if (e.type !== 'convoy') e.y += 1.8 * dt;
      if (e.type === 'convoy' && e.z < -170) {
        addPopup(0, 2, -20, 'COMBOIO ESCAPOU', '#f87171');
        state.enemies.splice(i, 1);
        continue;
      }
    }

    if (Math.abs(e.z) < 2.0 && Math.hypot(e.x - p.x, e.y - p.y) < 1.9) {
      damagePlayer(e.x, e.y, e.z);
      spawnExplosion(e.x, e.y, e.z, 1.1, [1, 0.4, 0.2]);
      state.enemies.splice(i, 1);
      continue;
    }
    if (e.z > 20) state.enemies.splice(i, 1);
  }

  // --- 11. ENEMY SHOTS & SNIPER BEAMS ---
  for (let i = state.enemyShots.length - 1; i >= 0; i--) {
    const s = state.enemyShots[i];
    s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
    if (Math.abs(s.z) < 1.4 && Math.hypot(s.x - p.x, s.y - p.y) < 1.18) {
      if (p.barrelTimer > 0) {
        s.vz = -115; s.vx = -s.vx * 2;
        audio.graze();
        addScore(160, p.x, p.y + 1.0, -1, 'DEFLETIDO! +160');
      } else {
        damagePlayer(s.x, s.y, s.z);
        state.enemyShots.splice(i, 1);
        continue;
      }
    }
    if (s.z > 16 || s.z < -150) state.enemyShots.splice(i, 1);
  }
  for (let i = state.sniperBeams.length - 1; i >= 0; i--) {
    state.sniperBeams[i].life -= dt;
    if (state.sniperBeams[i].life <= 0) state.sniperBeams.splice(i, 1);
  }

  // --- 12. RELIC EXPLORATION SCANNING ---
  for (let i = state.relics.length - 1; i >= 0; i--) {
    const rl = state.relics[i];
    rl.rot += dt * 1.4;
    rl.z += (rl.z < -38 ? state.speed * 0.65 : state.speed * 0.14) * dt;
    if (!rl.scanned && rl.z < -6 && rl.z > -110) {
      const d = Math.hypot(rl.x - p.x, rl.y - p.y);
      if (d < 3.8) {
        const prevStep = Math.floor(rl.scan * 5);
        rl.scan = Math.min(1.0, rl.scan + dt * 0.48);
        if (Math.floor(rl.scan * 5) > prevStep) audio.scanTick(rl.scan);
        if (rl.scan >= 1.0) {
          rl.scanned = true;
          audio.scanComplete();
          unlockCodex('relic_probe');
          addScore(650, rl.x, rl.y + 1.5, rl.z, 'RELÍQUIA ESCANEADA!');
          addCredits(120, rl.x, rl.y, rl.z);
          if (p.shield < p.maxShield) p.shield++;
          state.shockwaves.push({ x: rl.x, y: rl.y, z: rl.z, scale: 1.5, maxScale: 10, life: 0.45, maxLife: 0.45, tint: [0.35, 0.92, 1.0] });
          if (state.activeMission && state.activeMission.type === 'relic') {
            state.activeMission = null;
            ui.missionPill.classList.add('hidden');
          }
        }
      }
    }
    if (rl.z > 16) state.relics.splice(i, 1);
  }

  // --- 13. ENERGY RINGS & POWERUPS ---
  for (let i = state.rings.length - 1; i >= 0; i--) {
    const r = state.rings[i];
    r.z += state.speed * dt;
    r.rot += dt * 1.7;
    if (!r.passed && Math.abs(r.z) < 1.9 && Math.hypot(r.x - p.x, r.y - p.y) < 3.1) {
      r.passed = true;
      state.ringsCollected++;
      state.ringStreak++;
      addCombo(1);
      p.boost = Math.min(1.0, p.boost + 0.36);
      audio.ring(state.combo);
      addScore(240, r.x, r.y + 1.2, 0, `ANEL ×${state.combo}`);
      addCredits(12);
      state.shockwaves.push({ x: r.x, y: r.y, z: 0, scale: 1.8, maxScale: 6.5, life: 0.35, maxLife: 0.35, tint: [1.0, 0.78, 0.22] });
      if (state.ringStreak >= 3) {
        state.ringStreak = 0;
        if (p.shield < p.maxShield) {
          p.shield++;
          addPopup(p.x, p.y + 1.9, 0, 'ESCUDO +1', '#38bdf8');
        }
      }
    }
    if (r.z > 16) state.rings.splice(i, 1);
  }

  for (let i = state.powerups.length - 1; i >= 0; i--) {
    const pu = state.powerups[i];
    pu.z += state.speed * 0.72 * dt;
    pu.spin += dt * 3.0;
    if (Math.abs(pu.z) < 2.3 && Math.hypot(pu.x - p.x, pu.y - p.y) < 2.45) {
      audio.powerup();
      if (pu.type === 'shield') {
        p.shield = Math.min(p.maxShield, p.shield + 1);
        p.shieldFlash = 0.85; p.shieldWave = 0;
        addPopup(pu.x, pu.y + 1.2, 0, 'ESCUDO RESTAURADO!', '#38bdf8');
      } else if (pu.type === 'triple') {
        p.tripleTimer = 9.0;
        addPopup(pu.x, pu.y + 1.2, 0, 'CANHÃO TRIPLO 9s!', '#fbbf24');
      } else if (pu.type === 'missile') {
        p.missileCd = 0;
        addPopup(pu.x, pu.y + 1.2, 0, 'MÍSSEIS PRONTOS!', '#fb923c');
      } else {
        triggerNovaEMP();
      }
      addScore(150);
      state.powerups.splice(i, 1);
      continue;
    }
    if (pu.z > 16) state.powerups.splice(i, 1);
  }

  updateVFX(dt);
  updateHUD();
}

function checkPlayerProjectileHit(px, py, pz, dmg, isMissile) {
  // 1. Boss cores
  if (state.boss && state.boss.dyingTimer <= 0) {
    const b = state.boss;
    if (b.shieldOn && !isMissile && Math.abs(pz - b.z) < 5.5 && Math.hypot(px - b.x, py - b.y) < 7.5) {
      audio.shieldBlock();
      return true;
    }
    for (const c of b.cores) {
      if (!c.alive) continue;
      const cx = b.x + c.ox, cy = b.y + c.oy, cz = b.z + c.oz;
      if (Math.abs(pz - cz) < 3.6 && Math.hypot(px - cx, py - cy) < 2.4) {
        c.hp -= dmg;
        c.flash = 1.0;
        b.flash = 0.28;
        audio.hit();
        state.glows.push({ x: px, y: py, z: cz + 0.8, vx: 0, vy: 0, vz: 0, size: 1.4, grow: 2.2, r: 1, g: 0.82, b: 0.3, life: 0.16, maxLife: 0.16 });
        if (c.hp <= 0) destroyBossCore(c);
        return true;
      }
    }
  }

  // 2. Enemies
  for (let j = state.enemies.length - 1; j >= 0; j--) {
    const e = state.enemies[j];
    const rad = (e.type === 'mantis' || e.type === 'convoy' || e.type === 'aegis') ? 2.45 : e.type === 'swarm' ? 1.55 : 1.85;
    if (Math.abs(pz - e.z) < 3.8 && Math.hypot(px - e.x, py - e.y) < rad) {
      if (e.shieldHp > 0 && !isMissile) {
        e.shieldHp -= dmg * 0.7;
        e.shieldWave = 0;
        audio.shieldBlock();
        return true;
      }
      if (isMissile && e.shieldHp > 0) e.shieldHp = 0;
      e.hp -= dmg;
      e.flash = 1.0;
      audio.hit();
      if (e.hp <= 0) {
        if (e.type === 'mine') {
          detonateMineChain(e.x, e.y, e.z);
        } else {
          spawnExplosion(e.x, e.y, e.z, e.type === 'convoy' ? 2.1 : e.type === 'mantis' ? 1.5 : 1.15, [1.0, 0.56, 0.18]);
          audio.explosion(e.type === 'convoy' ? 1.8 : 1.0);
          state.shake = Math.max(state.shake, 0.25);
        }
        state.kills++;
        addCombo(1);
        const pts = e.type === 'convoy' ? 1000 : e.type === 'mantis' || e.type === 'aegis' ? 420 : e.type === 'sniper' ? 360 : 210;
        addScore(pts, e.x, e.y, e.z, e.type === 'convoy' ? 'COMBOIO ABATIDO!' : undefined);
        addCredits(e.type === 'convoy' ? 150 : e.type === 'mantis' || e.type === 'aegis' ? 35 : 16, e.x, e.y, e.z);
        if (e.type === 'convoy') {
          unlockCodex('mission_convoy');
          spawnPowerup(e.x - 1.2, e.y, e.z, 'triple');
          spawnPowerup(e.x + 1.2, e.y, e.z, 'shield');
          if (state.activeMission && state.activeMission.type === 'convoy') {
            state.activeMission = null;
            ui.missionPill.classList.add('hidden');
          }
        } else if (Math.random() < (e.type === 'mantis' || e.type === 'aegis' ? 0.45 : 0.16)) {
          spawnPowerup(e.x, e.y, e.z);
        }
        state.enemies.splice(j, 1);
      }
      return true;
    }
  }

  // 3. Asteroids (with Kharon Belt splitting!)
  for (let j = state.asteroids.length - 1; j >= 0; j--) {
    const a = state.asteroids[j];
    if (Math.abs(pz - a.z) < a.scale + 2.8 && Math.hypot(px - a.x, py - a.y) < a.scale + 0.85) {
      a.hp -= dmg;
      a.flash = 1.0;
      audio.hit();
      if (a.hp <= 0) {
        spawnExplosion(a.x, a.y, a.z, a.scale * 0.72, [0.96, 0.72, 0.36]);
        audio.explosion(0.75);
        addScore(90, a.x, a.y, a.z);
        addCredits(8);
        if (a.canSplit) {
          for (let k = 0; k < 2; k++) {
            spawnAsteroid(a.x + (k === 0 ? -1.4 : 1.4), a.y + rand(-0.8, 0.8), a.z, a.scale * 0.52, true);
          }
        }
        if (Math.random() < 0.09) spawnPowerup(a.x, a.y, a.z);
        state.asteroids.splice(j, 1);
      }
      return true;
    }
  }

  // 4. Hazard Pillars
  for (let j = state.pillars.length - 1; j >= 0; j--) {
    const pl = state.pillars[j];
    if (Math.abs(pz - pl.z) < 3.0 && Math.abs(px - pl.x) < 1.5 && Math.abs(py - pl.y) < pl.height * 0.52) {
      pl.hp -= dmg;
      pl.flash = 1.0;
      audio.hit();
      if (pl.hp <= 0) {
        spawnExplosion(pl.x, py, pl.z, 1.4, [1.0, 0.45, 0.2]);
        audio.explosion(1.1);
        addScore(180, pl.x, py, pl.z);
        addCredits(14);
        state.pillars.splice(j, 1);
      }
      return true;
    }
  }
  return false;
}

function fireEnemyOrb(ex, ey, ez, tx, ty, dual) {
  const spd = 48 + state.sector * 5;
  const t = Math.max(10, -ez) / spd;
  const vx = clamp((tx - ex) / t, -18, 18);
  const vy = clamp((ty - ey) / t, -14, 14);
  audio.enemyShot();
  if (dual) {
    state.enemyShots.push({ x: ex - 1.3, y: ey, z: ez, vx: vx - 1.2, vy, vz: spd });
    state.enemyShots.push({ x: ex + 1.3, y: ey, z: ez, vx: vx + 1.2, vy, vz: spd });
  } else {
    state.enemyShots.push({ x: ex, y: ey, z: ez, vx, vy, vz: spd });
  }
}

function updateBoss(dt) {
  const b = state.boss;
  const p = state.player;
  b.flash = Math.max(0, b.flash - dt * 5);
  b.spin += dt * (b.id === 'archon' ? 0.9 : 0.35);
  for (const c of b.cores) {
    c.flash = Math.max(0, c.flash - dt * 6);
    if (c.orbit) {
      c.angle += dt * 0.95;
      c.ox = Math.cos(c.angle) * 5.8;
      c.oy = Math.sin(c.angle) * 5.8;
    }
  }

  if (b.dyingTimer > 0) {
    b.dyingTimer -= dt;
    b.z -= 5 * dt;
    if (Math.random() < dt * 16) {
      spawnExplosion(b.x + rand(-8, 8), b.y + rand(-2, 3), b.z + rand(-2, 3), rand(1.1, 2.2), [1.0, 0.58, 0.16]);
      audio.explosion(1.2);
      state.shake = 0.6;
    }
    if (b.dyingTimer <= 0) {
      spawnExplosion(b.x, b.y, b.z, 4.0, [1.0, 0.82, 0.3]);
      audio.explosion(2.5);
      state.shake = 1.1;
      addScore(2500 * state.sector, b.x, b.y + 1, b.z, 'CHEFÃO DESTRUÍDO!');
      addCredits(220 + state.sector * 80);
      saveProfile(profile);
      openStarMap(); // Let the player pick their next galactic route!
    }
    return;
  }

  if (b.z < b.targetZ) {
    b.z = lerp(b.z, b.targetZ, Math.min(1, dt * 1.8));
  } else {
    b.phase += dt * (0.78 + state.sector * 0.08);
    b.x = Math.sin(b.phase) * 4.6;
    b.y = 2.0 + Math.sin(b.phase * 1.6) * 1.4;

    // Archon unique rotating shield phase
    if (b.id === 'archon') {
      b.shieldTimer += dt;
      b.shieldOn = (b.shieldTimer % 6.5) > 4.2;
    }

    b.fireCd -= dt;
    if (b.fireCd <= 0) {
      const liveCores = b.cores.filter(c => c.alive);
      const shooter = liveCores[randInt(0, liveCores.length - 1)];
      if (shooter) {
        const sx = b.x + shooter.ox, sy = b.y + shooter.oy, sz = b.z + shooter.oz + 1.5;
        const spd = 50 + state.sector * 4;
        const t = Math.max(0.35, -sz / spd);
        const baseVx = clamp((p.x - sx) / t, -20, 20);
        const baseVy = clamp((p.y - sy) / t, -15, 15);
        audio.enemyShot();

        if (b.id === 'krag') {
          // Launches flaming asteroid boulders + twin plasma!
          spawnAsteroid(sx, sy, sz + 2, 1.55, true);
          [-4.5, 4.5].forEach(sp => state.enemyShots.push({ x: sx, y: sy, z: sz, vx: baseVx + sp, vy: baseVy, vz: spd }));
        } else if (b.id === 'phoenix') {
          // 5-orb blazing solar fan!
          [-8, -4, 0, 4, 8].forEach(sp => state.enemyShots.push({ x: sx, y: sy, z: sz, vx: baseVx + sp, vy: baseVy + Math.sin(sp) * 2, vz: spd * 1.05 }));
        } else {
          [-5.5, 0, 5.5].forEach(sp => state.enemyShots.push({ x: sx, y: sy, z: sz, vx: baseVx + sp, vy: baseVy, vz: spd }));
        }
      }
      b.fireCd = Math.max(0.85, 1.7 - state.sector * 0.12);
    }

    b.escortCd -= dt;
    if (b.escortCd <= 0 && state.enemies.length < 2) {
      spawnEnemyWave();
      b.escortCd = 9.5;
    }
  }

  let totalHp = 0, totalMax = 0, aliveCount = 0;
  for (const c of b.cores) {
    totalHp += Math.max(0, c.hp);
    totalMax += c.maxHp;
    if (c.alive) aliveCount++;
  }
  ui.bossHpBar.style.width = `${clamp((totalHp / Math.max(1, totalMax)) * 100, 0, 100)}%`;
  ui.bossCoresLeft.textContent = b.shieldOn ? 'ESCUDO ATIVO' : `${aliveCount} ${aliveCount === 1 ? 'NÚCLEO' : 'NÚCLEOS'}`;
}

function updateVFX(dt) {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const pt = state.particles[i];
    pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.z += pt.vz * dt;
    pt.rx += pt.vrx * dt; pt.ry += pt.vry * dt;
    pt.life -= dt;
    if (pt.life <= 0) state.particles.splice(i, 1);
  }
  for (let i = state.glows.length - 1; i >= 0; i--) {
    const g = state.glows[i];
    g.x += g.vx * dt; g.y += g.vy * dt; g.z += g.vz * dt;
    g.size += g.grow * dt;
    g.life -= dt;
    if (g.life <= 0) state.glows.splice(i, 1);
  }
  for (let i = state.shockwaves.length - 1; i >= 0; i--) {
    const sw = state.shockwaves[i];
    sw.life -= dt;
    const k = 1 - Math.max(0, sw.life / sw.maxLife);
    sw.scale = lerp(0.8, sw.maxScale, 1 - Math.pow(1 - k, 3));
    if (sw.life <= 0) state.shockwaves.splice(i, 1);
  }
  for (let i = state.popups.length - 1; i >= 0; i--) {
    const pop = state.popups[i];
    pop.y += 2.2 * dt;
    pop.life -= dt;
    if (pop.life <= 0) state.popups.splice(i, 1);
  }
}

/* =========================================================================
   HUD SYNC
========================================================================= */
let lastShieldRendered = -1, lastMaxShieldRendered = -1;

function updateHUD() {
  const p = state.player;
  ui.score.textContent = String(Math.floor(state.score)).padStart(6, '0');
  ui.credits.textContent = `${state.runCredits} CR`;
  ui.combo.textContent = `×${state.combo}${p.boosting ? ' · 2×' : ''}`;
  ui.sector.textContent = `SETOR ${String(state.sector).padStart(2, '0')}`;
  ui.sectorName.textContent = state.region.name;
  ui.sectorBar.style.width = `${Math.round(state.sectorProgress * 100)}%`;
  ui.speed.textContent = `MACH ${(state.speed / 13.2).toFixed(1)}`;
  if (state.score > profile.bestScore) {
    ui.best.textContent = Math.floor(state.score).toLocaleString('pt-BR');
  }

  if (p.shield !== lastShieldRendered || p.maxShield !== lastMaxShieldRendered) {
    lastShieldRendered = p.shield;
    lastMaxShieldRendered = p.maxShield;
    ui.shieldText.textContent = `${Math.max(0, p.shield)} / ${p.maxShield}`;
    ui.shieldPips.innerHTML = '';
    for (let i = 0; i < p.maxShield; i++) {
      const pip = document.createElement('div');
      const active = i < p.shield;
      const low = p.shield <= 1;
      pip.className = `shield-pip ${active ? (low ? 'low' : 'active') : ''}`;
      ui.shieldPips.appendChild(pip);
    }
  }

  ui.boostBar.style.width = `${Math.round(p.boost * 100)}%`;

  const ship = getShip();
  const rollReady = p.barrelCd <= 0 && p.barrelTimer <= 0;
  ui.rollBar.style.width = `${rollReady ? 100 : clamp(Math.round((1 - p.barrelCd / ship.rollCd) * 100), 0, 100)}%`;
  ui.rollStatus.textContent = rollReady ? 'OK' : `${p.barrelCd.toFixed(1)}s`;
  ui.rollStatus.className = `mono ${rollReady ? 'text-emerald' : 'text-muted'}`;

  const misReady = p.missileCd <= 0;
  ui.missileBar.style.width = `${misReady ? 100 : clamp(Math.round((1 - p.missileCd / p.missileMaxCd) * 100), 0, 100)}%`;
  ui.missileStatus.textContent = misReady ? 'R' : `${p.missileCd.toFixed(1)}s`;
  ui.missileStatus.className = `mono ${misReady ? 'text-amber-soft' : 'text-muted'}`;

  if (p.tripleTimer > 0) {
    ui.powerupRow.classList.remove('hidden');
    ui.powerupLabel.textContent = 'CANHÃO TRIPLO';
    ui.powerupTime.textContent = `${p.tripleTimer.toFixed(1)}s`;
    ui.powerupBar.style.width = `${(p.tripleTimer / 9.0) * 100}%`;
  } else {
    ui.powerupRow.classList.add('hidden');
  }
}

/* =========================================================================
   RENDER PASS (Opaque -> Translucent/Additive VFX -> FBO Bloom -> 2D HUD)
========================================================================= */
const projMat = Mat4.create();
const viewMat = Mat4.create();
const vpMat = Mat4.create();
const modelMat = Mat4.create();
const camPos = new Float32Array(3);

let viewW = window.innerWidth, viewH = window.innerHeight, dpr = 1;

function handleResize() {
  viewW = window.innerWidth;
  viewH = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.resize(viewW, viewH, dpr);
  hudCanvas.width = Math.max(1, Math.floor(viewW * dpr));
  hudCanvas.height = Math.max(1, Math.floor(viewH * dpr));
  hudCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', handleResize);
handleResize();

function render() {
  const p = state.player;
  const skin = getSkin();
  const ship = getShip();
  const aspect = viewW / Math.max(1, viewH);
  const portraitFactor = aspect < 1 ? clamp((1 - aspect) / 0.55, 0, 1) : 0;
  const fovDeg = 58 + portraitFactor * 14 + state.boostBlend * 14 + state.warpFlash * 16;
  const fovRad = (fovDeg * Math.PI) / 180;
  Mat4.perspective(projMat, fovRad, aspect, 0.4, 380);

  const sx = (Math.random() - 0.5) * state.shake * 0.9;
  const sy = (Math.random() - 0.5) * state.shake * 0.9;

  if (state.mode === 'hangar' || state.mode === 'codex') {
    const dist = 6.2 + portraitFactor * 2.2;
    camPos[0] = Math.sin(state.hangarOrbitYaw) * dist;
    camPos[1] = 1.9 + state.hangarOrbitPitch * 2.5;
    camPos[2] = Math.cos(state.hangarOrbitYaw) * dist;
    Mat4.lookAt(viewMat, camPos[0], camPos[1], camPos[2], 0, 0.5, 0, 0, 1, 0);
  } else if (state.mode === 'title') {
    camPos[0] = p.x * 0.45 + Math.sin(state.time * 0.4) * 2.4;
    camPos[1] = p.y * 0.4 + 2.5;
    camPos[2] = 9.0 + portraitFactor * 3.5;
    Mat4.lookAt(viewMat, camPos[0], camPos[1], camPos[2], p.x * 0.7, p.y * 0.65, -28, 0, 1, 0);
  } else {
    camPos[0] = p.x * 0.46 + sx;
    camPos[1] = p.y * 0.42 + 2.45 + portraitFactor * 0.5 + sy;
    camPos[2] = 10.6 + portraitFactor * 4.2 - state.boostBlend * 0.95;
    Mat4.lookAt(viewMat, camPos[0], camPos[1], camPos[2], p.x * 0.68, p.y * 0.56, -34, -p.vx * 0.005, 1, 0);
  }
  Mat4.multiply(vpMat, projMat, viewMat);

  // 1. Begin Frame (Nebula Skybox + Solar Corona)
  renderer.beginFrame(state.env, camPos, viewMat, vpMat, fovRad, aspect, state.warpFlash);

  // 2. Warp Starfield
  renderer.drawStars(state.travel * 0.95, 1.4 + state.boostBlend * 9.5 + state.warpFlash * 22.0);

  // 3. Giant Atmospheric Planet + Planetary Rings (Procedural Planet Shader!)
  const pl = state.region.planet;
  const px = pl.pos[0] + camPos[0] * 0.25;
  const py = pl.pos[1] + camPos[1] * 0.15;
  const pz = pl.pos[2];
  Mat4.compose(modelMat, px, py, pz, 0.18, state.time * 0.035, 0.2, pl.scale, pl.scale, pl.scale);
  renderer.drawPlanet(modelMat, pl.colA, pl.colB, pl.atmoCol, pl.type, state.time);
  if (pl.hasRing) {
    renderer.setFogRange(300, 600);
    Mat4.compose(modelMat, px, py, pz, 0.34, state.time * 0.015, 0.28, pl.scale, pl.scale, pl.scale);
    renderer.drawMesh(models.planet_ring, modelMat, pl.ringTint, 0, 0.72);
    renderer.setFogRange(state.env.fogNear, state.env.fogFar);
  }

  // 4. Biome Environmental Setpieces (Solaris Trench OR Open-Space Biomes!)
  if (state.region.mode === 'solar_corridor' && state.mode !== 'hangar') {
    for (const seg of state.trench) {
      Mat4.compose(modelMat, 0, -8.5, seg.z, 0, 0, 0, 1, 1, 1);
      renderer.drawMesh(models.trench_deck, modelMat);
      Mat4.compose(modelMat, -18.5, -8.5 + seg.leftH * 0.5, seg.z, 0, 0, 0, seg.leftW, seg.leftH, 8.8);
      renderer.drawMesh(models.pillar, modelMat);
      Mat4.compose(modelMat, 18.5, -8.5 + seg.rightH * 0.5, seg.z, 0, Math.PI, 0, seg.rightW, seg.rightH, 8.8);
      renderer.drawMesh(models.pillar, modelMat);
      if (seg.hasArch) {
        Mat4.compose(modelMat, 0, -8.5, seg.z, 0, 0, 0, 1, 1, 1);
        renderer.drawMesh(models.arch, modelMat);
      }
    }
  } else if (state.mode !== 'hangar') {
    for (const d of state.decor) {
      Mat4.compose(modelMat, d.x, d.y, d.z, d.rx, d.ry, d.rz, d.scale, d.scale, d.scale);
      if (d.kind === 'cryo') renderer.drawMesh(models.cryo_crystal, modelMat);
      else if (d.kind === 'gate') renderer.drawMesh(models.ancient_gate, modelMat);
      else renderer.drawMesh(models.asteroids[d.variant || 0], modelMat, [0.75, 0.78, 0.85]);
    }
  }

  // 5. Gameplay Opaque Pass
  for (const hp of state.pillars) {
    Mat4.compose(modelMat, hp.x, hp.y, hp.z, 0, 0, 0, 1, hp.height, 1);
    renderer.drawMesh(models.hazard_pillar, modelMat, [1, 1, 1], hp.flash);
  }
  for (const a of state.asteroids) {
    Mat4.compose(modelMat, a.x, a.y, a.z, a.rx, a.ry, a.rz, a.scale, a.scale, a.scale);
    renderer.drawMesh(models.asteroids[a.variant], modelMat, [1, 1, 1], a.flash);
  }
  for (const r of state.rings) {
    Mat4.compose(modelMat, r.x, r.y, r.z, 0, 0, r.rot, 1, 1, 1);
    renderer.drawMesh(models.ring, modelMat, r.passed ? [0.4, 1.0, 0.7] : [1, 1, 1], 0, r.passed ? 0.32 : 1.0);
  }
  for (const rl of state.relics) {
    Mat4.compose(modelMat, rl.x, rl.y + Math.sin(state.time * 3) * 0.3, rl.z, 0.3, rl.rot, rl.rot * 0.6, 1, 1, 1);
    renderer.drawMesh(models.relic, modelMat, rl.scanned ? [0.4, 1.0, 0.8] : [1, 1, 1]);
    renderer.pushBillboard(rl.x, rl.y, rl.z, 3.6, 0.35, 0.9, 1.0, 0.45);
  }
  for (const pu of state.powerups) {
    const m = pu.type === 'shield' ? models.pu_shield : pu.type === 'triple' ? models.pu_triple : pu.type === 'missile' ? models.pu_missile : models.pu_nova;
    Mat4.compose(modelMat, pu.x, pu.y + Math.sin(state.time * 4 + pu.spin) * 0.25, pu.z, 0.35, pu.spin, 0.2, 1, 1, 1);
    renderer.drawMesh(m, modelMat);
  }
  for (const e of state.enemies) {
    const meshMap = { viper: models.enemy_viper, mantis: models.enemy_mantis, aegis: models.enemy_aegis, sniper: models.enemy_sniper, swarm: models.enemy_swarm, mine: models.enemy_mine, convoy: models.enemy_convoy };
    const dmgRatio = e.hp < e.maxHp * 0.5 ? (1 - e.hp / e.maxHp) : 0;
    const rotY = e.type === 'mine' ? e.phase : 0;
    Mat4.compose(modelMat, e.x, e.y, e.z, 0, rotY, e.roll, 1, 1, 1);
    renderer.drawMesh(meshMap[e.type] || models.enemy_viper, modelMat, [1, 1, 1], e.flash, 1, dmgRatio);
    if (e.type === 'aegis' && e.shieldHp > 0) {
      Mat4.compose(modelMat, e.x, e.y, e.z, 0, 0, 0, 2.5, 2.1, 2.4);
      renderer.drawShieldDome(modelMat, [0.22, 0.88, 1.0], 0.52, state.time, [0, 0, 1], e.shieldWave);
    }
  }

  // Boss & Cores
  if (state.boss) {
    const b = state.boss;
    const bossMesh = models[`boss_${b.id}`] || models.boss_leviathan;
    const rotZ = b.id === 'archon' ? b.spin : Math.sin(b.phase) * 0.08;
    Mat4.compose(modelMat, b.x, b.y, b.z, 0, 0, rotZ, 1, 1, 1);
    renderer.drawMesh(bossMesh, modelMat, [1, 1, 1], b.flash, 1, b.dyingTimer > 0 ? 1 : 0);

    for (const c of b.cores) {
      if (!c.alive) continue;
      const pulse = 1.0 + Math.sin(state.time * 9) * 0.09;
      Mat4.compose(modelMat, b.x + c.ox, b.y + c.oy, b.z + c.oz, state.time * 1.5, state.time * 2.1, 0, pulse, pulse, pulse);
      renderer.drawMesh(models.boss_core, modelMat, [1, 1, 1], c.flash);
      renderer.pushBillboard(b.x + c.ox, b.y + c.oy, b.z + c.oz + 1.0, 3.2, 1.0, 0.56, 0.16, 0.45);
    }
    if (b.shieldOn) {
      Mat4.compose(modelMat, b.x, b.y, b.z, 0, b.spin, 0, 8.6, 8.6, 5.2);
      renderer.drawShieldDome(modelMat, [0.24, 0.94, 0.98], 0.65, state.time, [0, 0, 1], 0.5);
    }
  }

  // Player Ship + Hull Skin + Thrusters + Wingtip Ribbons + 3D Hex Energy Shield!
  const showPlayer = state.mode !== 'gameover' && (p.invuln <= 0 || Math.floor(state.time * 18) % 2 === 0);
  if (showPlayer) {
    const shipMesh = models[`ship_${ship.id}`];
    const hullDmg = p.shield <= 1 ? 0.75 : 0;
    Mat4.compose(modelMat, p.x, p.y, 0, p.pitch, 0, p.roll, 1, 1, 1);
    renderer.drawMesh(shipMesh, modelMat, skin.hullTint, p.barrelTimer > 0 ? 0.2 : 0, 1, hullDmg);

    // Thruster flames (additive glowing pass!)
    renderer.setBlendMode(true);
    const flameLen = (0.9 + Math.sin(state.time * 48) * 0.24) * (1 + state.boostBlend * 1.45);
    const flameTint = state.boostBlend > 0.2 ? skin.boostColor : skin.trailColor;
    const cr = Math.cos(p.roll), sr = Math.sin(p.roll);
    for (const [ox, oy, oz] of ship.thrusters) {
      const rx = ox * cr - oy * sr;
      const ry = ox * sr + oy * cr;
      Mat4.compose(modelMat, p.x + rx, p.y + ry, oz, p.pitch, 0, p.roll, 1, 1, flameLen);
      renderer.drawMesh(models.flame, modelMat, flameTint, 0, 0.90);
      renderer.pushBillboard(p.x + rx, p.y + ry, oz + 0.35, 0.56 + state.boostBlend * 0.42, flameTint[0], flameTint[1], flameTint[2], 0.44);
    }
    renderer.setBlendMode(false);

    // Continuous 3D Wingtip Light Ribbons
    if (state.mode !== 'hangar' && state.mode !== 'codex') {
      const ribbonCol = state.boostBlend > 0.25 ? skin.boostColor : skin.trailColor;
      const ribbonW = 0.08 + state.boostBlend * 0.08;
      const ribbonA = 0.42 + state.boostBlend * 0.45;
      renderer.drawRibbon(state.trails[0], state.trailCount, ribbonW, ribbonCol, ribbonA);
      renderer.drawRibbon(state.trails[1], state.trailCount, ribbonW, ribbonCol, ribbonA);
    }

    // 3D Hexagonal Energy Shield Dome on hit / barrel roll / low-shield shimmer
    const shieldAlpha = Math.max(p.shieldFlash * 0.85, p.barrelTimer > 0 ? 0.68 : 0);
    if (shieldAlpha > 0.02) {
      const shCol = p.shield <= 1 ? [1.0, 0.34, 0.24] : [0.28, 0.86, 1.0];
      Mat4.compose(modelMat, p.x, p.y, 0.1, p.pitch, 0, p.roll, 2.7, 1.5, 3.0);
      renderer.drawShieldDome(modelMat, shCol, shieldAlpha, state.time, p.shieldHitDir, p.shieldWave);
    }
  }

  // 6. Translucent / Additive Projectiles, Missiles & Explosions
  renderer.setBlendMode(true);
  for (const l of state.lasers) {
    Mat4.compose(modelMat, l.x, l.y, l.z, 0, 0, 0, 1, 1, 1);
    renderer.drawMesh(l.amber ? models.laser_amber : models.laser_cyan, modelMat);
    renderer.pushBillboard(l.x, l.y, l.z, 0.85, l.amber ? 1.0 : 0.42, l.amber ? 0.78 : 0.92, l.amber ? 0.22 : 1.0, 0.42);
  }
  for (const m of state.missiles) {
    renderer.setBlendMode(false);
    Mat4.compose(modelMat, m.x, m.y, m.z, 0, 0, 0, 1, 1, 1);
    renderer.drawMesh(models.missile, modelMat);
    renderer.drawRibbon(m.trail, m.trailLen, 0.14, [1.0, 0.78, 0.26], 0.82);
    renderer.pushBillboard(m.x, m.y, m.z + 0.8, 1.1, 1.0, 0.68, 0.22, 0.78);
    renderer.setBlendMode(true);
  }
  for (const s of state.enemyShots) {
    const sc = 1 + Math.sin(state.time * 24) * 0.15;
    Mat4.compose(modelMat, s.x, s.y, s.z, state.time * 5, state.time * 4, 0, sc, sc, sc);
    renderer.drawMesh(models.enemy_orb, modelMat);
    renderer.pushBillboard(s.x, s.y, s.z, 1.35, 1.0, 0.34, 0.18, 0.55);
  }
  for (const sb of state.sniperBeams) {
    const a = sb.life / sb.maxLife;
    Mat4.compose(modelMat, sb.x, sb.y, sb.z, 0, 0, 0, a * 1.4, a * 1.4, 1);
    renderer.drawMesh(models.sniper_beam, modelMat, [1, 1, 1], 0, a);
  }
  for (const pt of state.particles) {
    const a = clamp(pt.life / pt.maxLife, 0, 1);
    const sc = pt.size * (0.4 + a * 0.7);
    Mat4.compose(modelMat, pt.x, pt.y, pt.z, pt.rx, pt.ry, 0, sc, sc, sc);
    renderer.drawMesh(models.shard, modelMat, pt.tint, 0, a);
  }
  for (const sw of state.shockwaves) {
    const a = clamp(sw.life / sw.maxLife, 0, 1);
    Mat4.compose(modelMat, sw.x, sw.y, sw.z, 0, 0, 0, sw.scale, sw.scale, 1);
    renderer.drawMesh(models.shockwave, modelMat, sw.tint, 0, a * 0.9);
  }
  renderer.setBlendMode(false);

  // Queue plasma explosion glow billboards
  for (const g of state.glows) {
    const a = clamp(g.life / g.maxLife, 0, 1);
    renderer.pushBillboard(g.x, g.y, g.z, g.size, g.r, g.g, g.b, a * 0.85);
  }

  // 7. End Frame (Flush Billboards + Selective Half-Res FBO Bloom + ACES Tone Mapping)
  const bloomStr = 0.46 + state.boostBlend * 0.16 + state.warpFlash * 0.35;
  const chromatic = state.boostBlend * 0.0045 + state.shake * 0.005 + state.warpFlash * 0.009;
  renderer.endFrame(bloomStr, chromatic);

  // 8. 2D Projected Tactical HUD Overlay
  renderOverlayHUD();
}

function renderOverlayHUD() {
  hudCtx.clearRect(0, 0, viewW, viewH);

  // Damage crimson vignette
  if (state.damageVignette > 0.01) {
    const g = hudCtx.createRadialGradient(viewW * 0.5, viewH * 0.5, viewH * 0.25, viewW * 0.5, viewH * 0.5, viewW * 0.65);
    g.addColorStop(0, 'rgba(239, 68, 68, 0)');
    g.addColorStop(1, `rgba(239, 68, 68, ${state.damageVignette * 0.46})`);
    hudCtx.fillStyle = g;
    hudCtx.fillRect(0, 0, viewW, viewH);
  }

  // Solar Flare Warning Overlay (Fenda de Ignição)
  if (state.mode === 'playing' && state.solarFlareState !== 'idle') {
    const safePt = Mat4.project(state.solarFlareSafeX, 0.8, -14, vpMat, viewW, viewH);
    const pulse = 0.5 + 0.5 * Math.sin(state.time * 18);
    if (state.solarFlareState === 'active') {
      hudCtx.fillStyle = `rgba(251, 146, 60, ${0.34})`;
      hudCtx.fillRect(0, 0, viewW, viewH);
    }
    if (safePt) {
      hudCtx.strokeStyle = `rgba(52, 211, 153, ${0.65 + pulse * 0.35})`;
      hudCtx.lineWidth = 2.2;
      hudCtx.setLineDash([6, 4]);
      hudCtx.strokeRect(safePt.x - 56, 70, 112, viewH - 150);
      hudCtx.setLineDash([]);
      hudCtx.font = '700 11px ui-monospace, monospace';
      hudCtx.textAlign = 'center';
      hudCtx.fillStyle = '#34d399';
      hudCtx.fillText('ZONA SEGURA', safePt.x, 90);
    }
  }

  if (state.mode !== 'playing') return;

  const p = state.player;
  const locked = findAimAssistTarget(p.x, p.y);
  const nearPt = Mat4.project(p.x, p.y, -24, vpMat, viewW, viewH);
  const farPt = Mat4.project(p.x, p.y, -58, vpMat, viewW, viewH);
  const retColor = locked ? '#fbbf24' : 'rgba(125, 211, 252, 0.82)';

  if (nearPt) {
    hudCtx.strokeStyle = retColor;
    hudCtx.lineWidth = 1.6;
    const r = 15;
    hudCtx.beginPath();
    hudCtx.moveTo(nearPt.x - r, nearPt.y - 6); hudCtx.lineTo(nearPt.x - r, nearPt.y - r); hudCtx.lineTo(nearPt.x - 6, nearPt.y - r);
    hudCtx.moveTo(nearPt.x + 6, nearPt.y - r); hudCtx.lineTo(nearPt.x + r, nearPt.y - r); hudCtx.lineTo(nearPt.x + r, nearPt.y - 6);
    hudCtx.moveTo(nearPt.x + r, nearPt.y + 6); hudCtx.lineTo(nearPt.x + r, nearPt.y + r); hudCtx.lineTo(nearPt.x + 6, nearPt.y + r);
    hudCtx.moveTo(nearPt.x - 6, nearPt.y + r); hudCtx.lineTo(nearPt.x - r, nearPt.y + r); hudCtx.lineTo(nearPt.x - r, nearPt.y + 6);
    hudCtx.stroke();
  }
  if (farPt) {
    hudCtx.strokeStyle = locked ? 'rgba(251, 191, 36, 0.95)' : 'rgba(186, 230, 253, 0.58)';
    hudCtx.lineWidth = 1.3;
    const r = 7;
    hudCtx.beginPath();
    hudCtx.moveTo(farPt.x, farPt.y - r); hudCtx.lineTo(farPt.x + r, farPt.y);
    hudCtx.lineTo(farPt.x, farPt.y + r); hudCtx.lineTo(farPt.x - r, farPt.y);
    hudCtx.closePath();
    hudCtx.stroke();
  }

  // Relic Scan Progress Ring
  for (const rl of state.relics) {
    if (rl.scanned || rl.z > -4) continue;
    const pt = Mat4.project(rl.x, rl.y, rl.z, vpMat, viewW, viewH);
    if (!pt) continue;
    hudCtx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    hudCtx.lineWidth = 2.5;
    hudCtx.beginPath();
    hudCtx.arc(pt.x, pt.y, 26, 0, Math.PI * 2);
    hudCtx.stroke();
    if (rl.scan > 0) {
      hudCtx.strokeStyle = '#38bdf8';
      hudCtx.beginPath();
      hudCtx.arc(pt.x, pt.y, 26, -Math.PI * 0.5, -Math.PI * 0.5 + rl.scan * Math.PI * 2);
      hudCtx.stroke();
    }
    hudCtx.font = '700 10px ui-monospace, monospace';
    hudCtx.textAlign = 'center';
    hudCtx.fillStyle = '#7dd3fc';
    hudCtx.fillText(`SCAN ${Math.round(rl.scan * 100)}%`, pt.x, pt.y - 32);
  }

  // Enemy Brackets + Sniper Laser Sightlines + Convoy Tag
  for (const e of state.enemies) {
    if (e.z > -4 || e.z < -135) continue;
    const pt = Mat4.project(e.x, e.y, e.z, vpMat, viewW, viewH);
    if (!pt) continue;

    if (e.type === 'sniper' && e.sniperAim > 0) {
      const tp = Mat4.project(e.sniperTx, e.sniperTy, 0, vpMat, viewW, viewH);
      if (tp) {
        hudCtx.strokeStyle = `rgba(248, 113, 113, ${0.35 + e.sniperAim * 0.65})`;
        hudCtx.lineWidth = 1 + e.sniperAim * 2;
        hudCtx.beginPath();
        hudCtx.moveTo(pt.x, pt.y);
        hudCtx.lineTo(tp.x, tp.y);
        hudCtx.stroke();
      }
    }

    const isLocked = locked && Math.abs(locked.x - e.x) < 0.1 && Math.abs(locked.z - e.z) < 0.1;
    const sz = clamp(520 / pt.w, 10, 26);
    hudCtx.strokeStyle = e.type === 'convoy' ? '#fbbf24' : e.shieldHp > 0 ? '#38bdf8' : isLocked ? '#fbbf24' : 'rgba(248, 113, 113, 0.72)';
    hudCtx.lineWidth = isLocked || e.type === 'convoy' ? 2 : 1.2;
    hudCtx.strokeRect(pt.x - sz, pt.y - sz, sz * 2, sz * 2);

    if (e.hp < e.maxHp || e.type === 'convoy') {
      const bw = sz * 2;
      hudCtx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      hudCtx.fillRect(pt.x - sz, pt.y - sz - 7, bw, 3.5);
      hudCtx.fillStyle = e.type === 'convoy' ? '#fbbf24' : '#f87171';
      hudCtx.fillRect(pt.x - sz, pt.y - sz - 7, bw * clamp(e.hp / e.maxHp, 0, 1), 3.5);
    }
  }

  // Boss Weakpoint Diamonds
  if (state.boss && state.boss.dyingTimer <= 0) {
    const b = state.boss;
    for (const c of b.cores) {
      if (!c.alive) continue;
      const pt = Mat4.project(b.x + c.ox, b.y + c.oy, b.z + c.oz, vpMat, viewW, viewH);
      if (!pt) continue;
      const r = 16;
      hudCtx.strokeStyle = b.shieldOn ? '#38bdf8' : '#fbbf24';
      hudCtx.lineWidth = 1.8;
      hudCtx.beginPath();
      hudCtx.moveTo(pt.x, pt.y - r); hudCtx.lineTo(pt.x + r, pt.y);
      hudCtx.lineTo(pt.x, pt.y + r); hudCtx.lineTo(pt.x - r, pt.y);
      hudCtx.closePath();
      hudCtx.stroke();

      hudCtx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      hudCtx.fillRect(pt.x - 16, pt.y + r + 5, 32, 3.5);
      hudCtx.fillStyle = '#f59e0b';
      hudCtx.fillRect(pt.x - 16, pt.y + r + 5, 32 * clamp(c.hp / c.maxHp, 0, 1), 3.5);
    }
  }

  // Floating 3D-Projected Popups
  hudCtx.font = '700 13px ui-monospace, SFMono-Regular, Menlo, monospace';
  hudCtx.textAlign = 'center';
  for (const pop of state.popups) {
    const pt = Mat4.project(pop.x, pop.y, Math.min(-4, pop.z), vpMat, viewW, viewH);
    if (!pt) continue;
    hudCtx.globalAlpha = clamp(pop.life / pop.maxLife, 0, 1);
    hudCtx.fillStyle = 'rgba(2, 6, 23, 0.78)';
    hudCtx.fillText(pop.text, pt.x + 1, pt.y + 1);
    hudCtx.fillStyle = pop.color;
    hudCtx.fillText(pop.text, pt.x, pt.y);
  }
  hudCtx.globalAlpha = 1;
}

/* =========================================================================
   BOOTSTRAP
========================================================================= */
initTrench();
setRegion('solaris_orbit', true);
renderTitleSelectors();
refreshRecordDisplay();
syncToggleButtons();
setScreen('title');

// Expose debug/test hook gently on window for automated Playwright verification
window.__SOLARIS__ = { state, profile, setRegion, openStarMap, openHangar, openCodex, spawnBoss, triggerSpecialMission };

let lastTime = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
  lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
