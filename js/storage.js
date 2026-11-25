// Solaris Drift — Persistent Save System with v1 -> v2 Migration

const LEGACY_KEY = 'solaris_drift_3d_v1';
const SAVE_KEY = 'solaris_drift_3d_v2';

export const SKINS = [
  { id: 'heliotech', name: 'Heliotech Ouro', cost: 0, hullTint: [1.0, 1.0, 1.0], trailColor: [0.35, 0.92, 1.0], boostColor: [1.0, 0.78, 0.25], preview: '#f59e0b' },
  { id: 'arctic',    name: 'Glaciar Polar',  cost: 450, hullTint: [0.82, 0.96, 1.05], trailColor: [0.22, 1.0, 0.88], boostColor: [0.45, 0.95, 1.0], preview: '#22d3ee' },
  { id: 'obsidian',  name: 'Obsidiana Solar', cost: 800, hullTint: [0.55, 0.58, 0.65], trailColor: [1.0, 0.56, 0.18], boostColor: [1.0, 0.35, 0.22], preview: '#f97316' },
  { id: 'crimson',   name: 'Valkiria Carmesim', cost: 1200, hullTint: [1.08, 0.78, 0.76], trailColor: [1.0, 0.38, 0.42], boostColor: [1.0, 0.82, 0.32], preview: '#ef4444' },
  { id: 'emerald',   name: 'Vanguard Esmeralda', cost: 1600, hullTint: [0.80, 1.02, 0.88], trailColor: [0.28, 0.98, 0.62], boostColor: [0.85, 1.0, 0.45], preview: '#10b981' }
];

export const UPGRADES = [
  { id: 'hull',    name: 'Blindagem Composta', desc: '+1 Escudo máximo por nível', maxLevel: 3, baseCost: 300, stepCost: 420 },
  { id: 'weapons', name: 'Acelerador de Plasma', desc: '+16% dano e cadência de tiro', maxLevel: 4, baseCost: 260, stepCost: 360 },
  { id: 'reactor', name: 'Reator Solar', desc: '+22% duração de Turbo e recarga', maxLevel: 3, baseCost: 240, stepCost: 340 },
  { id: 'missile', name: 'Lançador Teleguiado', desc: '+1 Míssil guiado na salva e recarga', maxLevel: 3, baseCost: 350, stepCost: 460 }
];

export function upgradeCost(upg, level) {
  return upg.baseCost + level * upg.stepCost;
}

export function loadProfile() {
  const defaults = {
    version: 2,
    shipIdx: 0,
    bestScore: 0,
    bestSector: 1,
    credits: 0,
    totalKills: 0,
    totalRuns: 0,
    unlockedShips: ['valkyrie', 'interceptor', 'bastion'],
    unlockedSkins: ['heliotech'],
    selectedSkin: 'heliotech',
    upgrades: { hull: 0, weapons: 0, reactor: 0, missile: 0 },
    codex: [], // discovered region/anomaly/boss IDs
    quality: 'auto', // 'auto' | 'high' | 'medium' | 'low'
    autoFire: false,
    mouseSteer: false,
    muted: false
  };

  try {
    const rawV2 = localStorage.getItem(SAVE_KEY);
    if (rawV2) {
      const parsed = JSON.parse(rawV2);
      return {
        ...defaults,
        ...parsed,
        upgrades: { ...defaults.upgrades, ...(parsed.upgrades || {}) },
        unlockedShips: Array.from(new Set([...defaults.unlockedShips, ...(parsed.unlockedShips || [])])),
        unlockedSkins: Array.from(new Set([...defaults.unlockedSkins, ...(parsed.unlockedSkins || [])])),
        codex: Array.isArray(parsed.codex) ? parsed.codex : []
      };
    }

    // Automatic non-destructive migration from v1
    const rawV1 = localStorage.getItem(LEGACY_KEY);
    if (rawV1) {
      const legacy = JSON.parse(rawV1);
      defaults.shipIdx = typeof legacy.shipIdx === 'number' ? legacy.shipIdx : 0;
      defaults.bestScore = typeof legacy.bestScore === 'number' ? legacy.bestScore : 0;
      defaults.bestSector = typeof legacy.bestSector === 'number' ? legacy.bestSector : 1;
      // Reward existing pilots with a small starting credit bonus proportional to legacy high score
      defaults.credits = Math.min(800, Math.floor(defaults.bestScore / 40));
    }
  } catch {
    // Ignore storage quota or privacy mode errors
  }
  return defaults;
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage errors
  }
}
