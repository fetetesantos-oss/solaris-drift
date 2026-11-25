// Solaris Drift — Heliotech Celestial 3D Models & Ship Definitions

import { MeshBuilder } from '../render/meshBuilder.js';

export const SHIPS = [
  {
    id: 'valkyrie',
    name: 'Valkyrie Mk.IV',
    role: 'Equilibrada',
    cost: 0,
    desc: 'Caça tático Heliotech com cascos de titânio, equilíbrio superior entre agilidade, escudo e cadência.',
    speed: 18.0,
    maxShield: 4,
    fireRate: 0.14,
    damage: 1.0,
    boostDrain: 0.33,
    rollCd: 2.5,
    stats: { vel: 78, esc: 76, cad: 80 },
    accent: '#f59e0b',
    wingtips: [[-2.42, -0.14, 1.05], [2.42, -0.14, 1.05]],
    thrusters: [[-0.36, -0.02, 1.72], [0.36, -0.02, 1.72]]
  },
  {
    id: 'interceptor',
    name: 'Interceptor S-9',
    role: 'Velocidade',
    cost: 0,
    desc: 'Asas enflechadas para frente, motor vetorial central de alta resposta e cadência extrema.',
    speed: 22.0,
    maxShield: 3,
    fireRate: 0.105,
    damage: 0.92,
    boostDrain: 0.24,
    rollCd: 2.1,
    stats: { vel: 96, esc: 58, cad: 95 },
    accent: '#38bdf8',
    wingtips: [[-2.52, 0.12, -0.58], [2.52, 0.12, -0.58]],
    thrusters: [[0, 0.0, 1.85]]
  },
  {
    id: 'bastion',
    name: 'Bastion Heavy',
    role: 'Blindada',
    cost: 0,
    desc: 'Canhoneira catamarã blindada com placas térmicas douradas e canhões pesados de alto impacto.',
    speed: 15.2,
    maxShield: 5,
    fireRate: 0.17,
    damage: 1.45,
    boostDrain: 0.38,
    rollCd: 2.8,
    stats: { vel: 64, esc: 98, cad: 74 },
    accent: '#eab308',
    wingtips: [[-2.35, -0.18, 0.92], [2.35, -0.18, 0.92]],
    thrusters: [[-1.18, -0.04, 1.42], [1.18, -0.04, 1.42], [0, 0.02, 1.38]]
  },
  {
    id: 'mirage',
    name: 'Mirage-X',
    role: 'Furtiva',
    cost: 850,
    desc: 'Delta experimental com lâminas de plasma e recarga ultrarrápida da Manobra 360°.',
    speed: 21.0,
    maxShield: 4,
    fireRate: 0.115,
    damage: 1.12,
    boostDrain: 0.25,
    rollCd: 1.35,
    stats: { vel: 94, esc: 76, cad: 88 },
    accent: '#2dd4bf',
    wingtips: [[-2.62, -0.05, 0.85], [2.62, -0.05, 0.85]],
    thrusters: [[-0.45, 0.0, 1.65], [0.45, 0.0, 1.65]]
  },
  {
    id: 'aurelia',
    name: 'Aurelia Prime',
    role: 'Protótipo',
    cost: 1500,
    desc: 'Protótipo solar com pilones flutuantes, escudo superior e disparo triplo nativo calibrado.',
    speed: 19.2,
    maxShield: 5,
    fireRate: 0.125,
    damage: 1.25,
    boostDrain: 0.26,
    rollCd: 2.0,
    innateTriple: true,
    stats: { vel: 86, esc: 96, cad: 96 },
    accent: '#fbbf24',
    wingtips: [[-2.68, 0.05, 0.35], [2.68, 0.05, 0.35]],
    thrusters: [[0, 0.0, 1.80], [-1.35, 0.0, 1.15], [1.35, 0.0, 1.15]]
  }
];

export function buildModels(gl) {
  const M = {};

  const ceramic = [0.90, 0.93, 0.97];
  const titanium = [0.68, 0.74, 0.82];
  const carbon = [0.16, 0.20, 0.27];
  const gold = [0.96, 0.68, 0.16];
  const glass = [0.10, 0.56, 0.78];
  const cyanGlow = [0.38, 0.92, 1.0];
  const goldGlow = [1.0, 0.78, 0.24];
  const tealGlow = [0.22, 0.96, 0.82];

  // =========================================================================
  // 1. PLAYABLE HELIOTECH SHIPS (Detailed Multi-Part Designs)
  // =========================================================================

  // --- VALKYRIE MK.IV ---
  {
    const b = new MeshBuilder();
    // Sculpted nose & dorsal spine
    b.addTaperBoxZ(0, -0.02, -0.6, 0.86, 0.44, -0.05, -2.75, 0.16, 0.14, ceramic, 0, 0.28, 0.35);
    b.addBox(0, 0.0, 0.45, 0.96, 0.50, 2.0, ceramic, 0, 0.30, 0.38);
    b.addTaperBoxZ(0, 0.28, -0.85, 0.42, 0.20, 0.32, 0.45, 0.56, 0.32, glass, 0.18, 0.10, 0.85); // glazed canopy
    b.addBox(0, 0.18, 0.95, 0.50, 0.26, 0.95, carbon, 0, 0.45, 0.5);
    // Side engine air-intakes
    b.addTaperBoxZ(0.68, -0.04, -0.35, 0.34, 0.32, -0.02, 1.25, 0.44, 0.36, titanium, 0, 0.32, 0.65);
    b.addTaperBoxZ(-0.68, -0.04, -0.35, 0.34, 0.32, -0.02, 1.25, 0.44, 0.36, titanium, 0, 0.32, 0.65);
    // Swept multi-stage delta wings + gold heat-shield inlays
    b.addWedgeWing(1, 0.52, -0.45, 1.12, 2.45, 0.62, 1.24, -0.04, -0.16, 0.15, ceramic, 0, 0.28, 0.35);
    b.addWedgeWing(-1, 0.52, -0.45, 1.12, 2.45, 0.62, 1.24, -0.04, -0.16, 0.15, ceramic, 0, 0.28, 0.35);
    b.addBox(1.42, 0.01, 0.56, 0.56, 0.08, 0.92, gold, 0.08, 0.22, 0.88);
    b.addBox(-1.42, 0.01, 0.56, 0.56, 0.08, 0.92, gold, 0.08, 0.22, 0.88);
    // Wingtip laser pods + navigation strobes
    b.addCylinderZ(2.22, -0.12, -0.58, 1.05, 0.08, 0.10, 8, carbon, 0, 0.35, 0.7);
    b.addCylinderZ(-2.22, -0.12, -0.58, 1.05, 0.08, 0.10, 8, carbon, 0, 0.35, 0.7);
    b.addBox(2.42, -0.14, 0.95, 0.08, 0.08, 0.36, cyanGlow, 1.0);
    b.addBox(-2.42, -0.14, 0.95, 0.08, 0.08, 0.36, cyanGlow, 1.0);
    // Twin canted tail fins
    b.addBox(0.58, 0.46, 0.95, 0.09, 0.66, 0.84, gold, 0.05, 0.24, 0.85);
    b.addBox(-0.58, 0.46, 0.95, 0.09, 0.66, 0.84, gold, 0.05, 0.24, 0.85);
    // Twin vectoring ion nozzles
    b.addCylinderZ(0.36, -0.02, 1.28, 1.70, 0.22, 0.18, 10, carbon, 0, 0.3, 0.8);
    b.addCylinderZ(-0.36, -0.02, 1.28, 1.70, 0.22, 0.18, 10, carbon, 0, 0.3, 0.8);
    b.addCylinderZ(0.36, -0.02, 1.64, 1.74, 0.15, 0.13, 10, cyanGlow, 1.0);
    b.addCylinderZ(-0.36, -0.02, 1.64, 1.74, 0.15, 0.13, 10, cyanGlow, 1.0);
    M.ship_valkyrie = b.upload(gl);
  }

  // --- INTERCEPTOR S-9 ---
  {
    const b = new MeshBuilder();
    const iceBlue = [0.20, 0.76, 0.96];
    b.addTaperBoxZ(0, 0, -0.35, 0.66, 0.36, -0.02, -3.15, 0.10, 0.10, ceramic, 0, 0.24, 0.45);
    b.addBox(0, -0.02, 0.55, 0.72, 0.42, 1.95, ceramic, 0, 0.26, 0.45);
    b.addTaperBoxZ(0, 0.23, -1.05, 0.34, 0.18, 0.26, 0.35, 0.42, 0.26, glass, 0.22, 0.08, 0.9);
    // Razor forward-swept wings
    b.addWedgeWing(1, 0.34, 0.12, 1.22, 2.52, -0.82, -0.18, -0.02, 0.10, 0.12, ceramic, 0, 0.25, 0.42);
    b.addWedgeWing(-1, 0.34, 0.12, 1.22, 2.52, -0.82, -0.18, -0.02, 0.10, 0.12, ceramic, 0, 0.25, 0.42);
    b.addBox(1.52, 0.08, -0.08, 0.38, 0.08, 0.92, iceBlue, 0.35, 0.2, 0.7);
    b.addBox(-1.52, 0.08, -0.08, 0.38, 0.08, 0.92, iceBlue, 0.35, 0.2, 0.7);
    // Canard winglets near nose
    b.addWedgeWing(1, 0.28, -1.7, -1.1, 0.98, -1.2, -0.95, -0.04, -0.02, 0.07, carbon, 0, 0.35, 0.6);
    b.addWedgeWing(-1, 0.28, -1.7, -1.1, 0.98, -1.2, -0.95, -0.04, -0.02, 0.07, carbon, 0, 0.35, 0.6);
    // Tall dorsal razor fin
    b.addBox(0, 0.52, 0.85, 0.08, 0.76, 1.15, iceBlue, 0.2, 0.25, 0.6);
    // Central high-thrust plasma ring nozzle
    b.addCylinderZ(0, 0, 1.32, 1.84, 0.34, 0.26, 12, carbon, 0, 0.3, 0.85);
    b.addCylinderZ(0, 0, 1.76, 1.88, 0.24, 0.20, 12, cyanGlow, 1.0);
    M.ship_interceptor = b.upload(gl);
  }

  // --- BASTION HEAVY ---
  {
    const b = new MeshBuilder();
    b.addBox(0, 0.08, 0.2, 1.32, 0.58, 2.1, titanium, 0, 0.36, 0.62);
    b.addTaperBoxZ(0, 0.06, -0.82, 1.12, 0.50, 0.02, -2.18, 0.42, 0.26, gold, 0.05, 0.24, 0.88);
    b.addBox(0, 0.44, -0.1, 0.66, 0.26, 1.05, glass, 0.22, 0.1, 0.88);
    // Twin armored catamaran booms
    b.addBox(1.18, -0.04, 0.05, 0.72, 0.56, 2.45, carbon, 0, 0.44, 0.55);
    b.addBox(-1.18, -0.04, 0.05, 0.72, 0.56, 2.45, carbon, 0, 0.44, 0.55);
    b.addBox(1.18, 0.27, 0.15, 0.56, 0.12, 1.72, gold, 0.12, 0.22, 0.88);
    b.addBox(-1.18, 0.27, 0.15, 0.56, 0.12, 1.72, gold, 0.12, 0.22, 0.88);
    // Dual rotary heavy cannons
    b.addCylinderZ(1.18, -0.04, -2.05, -1.0, 0.14, 0.17, 8, titanium, 0, 0.3, 0.75);
    b.addCylinderZ(-1.18, -0.04, -2.05, -1.0, 0.14, 0.17, 8, titanium, 0, 0.3, 0.75);
    // Armored stubby winglets
    b.addWedgeWing(1, 1.48, 0.0, 1.12, 2.38, 0.48, 1.15, -0.05, -0.22, 0.22, ceramic, 0, 0.32, 0.45);
    b.addWedgeWing(-1, 1.48, 0.0, 1.12, 2.38, 0.48, 1.15, -0.05, -0.22, 0.22, ceramic, 0, 0.32, 0.45);
    // Triple heavy thruster array
    b.addBox(1.18, -0.04, 1.36, 0.50, 0.36, 0.18, goldGlow, 1.0);
    b.addBox(-1.18, -0.04, 1.36, 0.50, 0.36, 0.18, goldGlow, 1.0);
    b.addBox(0, 0.02, 1.32, 0.62, 0.32, 0.18, goldGlow, 1.0);
    M.ship_bastion = b.upload(gl);
  }

  // --- MIRAGE-X (Unlockable Stealth Delta Fighter) ---
  {
    const b = new MeshBuilder();
    const stealth = [0.22, 0.26, 0.34];
    b.addTaperBoxZ(0, 0.0, -0.2, 1.10, 0.34, -0.02, -2.95, 0.12, 0.08, stealth, 0, 0.32, 0.68);
    b.addBox(0, 0.0, 0.65, 1.18, 0.34, 1.65, stealth, 0, 0.32, 0.68);
    b.addTaperBoxZ(0, 0.22, -0.9, 0.36, 0.16, 0.24, 0.3, 0.44, 0.20, tealGlow, 0.45, 0.1, 0.9);
    // Diamond stealth wings with glowing teal plasma trim
    b.addWedgeWing(1, 0.54, -1.15, 1.25, 2.65, 0.42, 0.98, 0.0, -0.06, 0.11, stealth, 0, 0.28, 0.72);
    b.addWedgeWing(-1, 0.54, -1.15, 1.25, 2.65, 0.42, 0.98, 0.0, -0.06, 0.11, stealth, 0, 0.28, 0.72);
    b.addBox(1.55, 0.02, 0.32, 1.45, 0.06, 0.14, tealGlow, 0.95);
    b.addBox(-1.55, 0.02, 0.32, 1.45, 0.06, 0.14, tealGlow, 0.95);
    // Split low-profile stabilizers
    b.addBox(0.75, 0.32, 1.08, 0.08, 0.48, 0.75, ceramic, 0, 0.28, 0.5);
    b.addBox(-0.75, 0.32, 1.08, 0.08, 0.48, 0.75, ceramic, 0, 0.28, 0.5);
    b.addBox(0.45, 0.0, 1.54, 0.32, 0.20, 0.22, tealGlow, 1.0);
    b.addBox(-0.45, 0.0, 1.54, 0.32, 0.20, 0.22, tealGlow, 1.0);
    M.ship_mirage = b.upload(gl);
  }

  // --- AURELIA PRIME (Unlockable Heliotech Prototype with Floating Solar Pylons) ---
  {
    const b = new MeshBuilder();
    b.addTaperBoxZ(0, 0.02, -0.4, 0.88, 0.44, 0.0, -2.85, 0.18, 0.14, ceramic, 0, 0.22, 0.5);
    b.addBox(0, 0.02, 0.55, 0.96, 0.48, 1.9, ceramic, 0, 0.22, 0.5);
    b.addTaperBoxZ(0, 0.30, -0.9, 0.44, 0.20, 0.32, 0.42, 0.54, 0.28, goldGlow, 0.45, 0.1, 0.92);
    // Golden solar halo ring around rear core
    b.addTorusZ(0.88, 0.08, 16, 6, gold, 0.45, 0.2, 0.9);
    // Floating detached solar-wing pylons
    b.addWedgeWing(1, 1.15, -0.85, 1.05, 2.68, -0.10, 0.85, 0.05, 0.05, 0.14, ceramic, 0, 0.24, 0.48);
    b.addWedgeWing(-1, 1.15, -0.85, 1.05, 2.68, -0.10, 0.85, 0.05, 0.05, 0.14, ceramic, 0, 0.24, 0.48);
    b.addBox(1.82, 0.07, 0.25, 0.72, 0.08, 0.95, gold, 0.35, 0.18, 0.92);
    b.addBox(-1.82, 0.07, 0.25, 0.72, 0.08, 0.95, gold, 0.35, 0.18, 0.92);
    // Central + pylon ion drives
    b.addCylinderZ(0, 0, 1.5, 1.82, 0.24, 0.18, 10, goldGlow, 1.0);
    b.addCylinderZ(1.35, 0.0, 0.7, 1.18, 0.14, 0.11, 8, cyanGlow, 1.0);
    b.addCylinderZ(-1.35, 0.0, 0.7, 1.18, 0.14, 0.11, 8, cyanGlow, 1.0);
    M.ship_aurelia = b.upload(gl);
  }

  // --- THRUSTER FLAME CONE (Pure White for Accurate Tinting) ---
  {
    const b = new MeshBuilder();
    b.addConeZ(0, 0, 0, 1.45, 0.21, 8, [1.0, 1.0, 1.0], 1.0);
    M.flame = b.upload(gl);
  }

  // =========================================================================
  // 2. ENEMY CLASSES (6 Distinct Silhouettes + Convoy Target)
  // =========================================================================

  // Viper (Agile crimson interceptor)
  {
    const b = new MeshBuilder();
    const dark = [0.20, 0.22, 0.28], red = [0.90, 0.20, 0.22], eye = [1.0, 0.46, 0.16];
    b.addConeZ(0, 0, -0.4, 2.05, 0.50, 6, dark, 0, 0.38, 0.6);
    b.addBox(0, 0, -0.65, 0.98, 0.52, 1.2, dark, 0, 0.4, 0.6);
    b.addBox(0, 0.14, 0.45, 0.52, 0.22, 0.46, eye, 1.0);
    b.addWedgeWing(1, 0.4, -0.9, 0.25, 2.25, 0.75, 1.38, 0, -0.28, 0.18, red, 0, 0.34, 0.5);
    b.addWedgeWing(-1, 0.4, -0.9, 0.25, 2.25, 0.75, 1.38, 0, -0.28, 0.18, red, 0, 0.34, 0.5);
    b.addBox(0, 0.48, -0.75, 0.14, 0.65, 0.75, red, 0, 0.34, 0.5);
    M.enemy_viper = b.upload(gl);
  }

  // Mantis (Heavy Armored Twin-Cannon Striker)
  {
    const b = new MeshBuilder();
    const armor = [0.28, 0.31, 0.38], cr = [0.92, 0.25, 0.18], core = [1.0, 0.68, 0.16];
    b.addBox(0, 0, 0, 1.9, 0.90, 2.0, armor, 0, 0.42, 0.65);
    b.addBox(0, 0.1, 1.0, 1.0, 0.42, 0.34, core, 1.0);
    b.addBox(1.62, 0, 0.25, 0.78, 1.42, 1.72, cr, 0, 0.36, 0.55);
    b.addBox(-1.62, 0, 0.25, 0.78, 1.42, 1.72, cr, 0, 0.36, 0.55);
    b.addCylinderZ(1.62, -0.35, 0.9, 2.0, 0.16, 0.14, 6, armor, 0, 0.3, 0.8);
    b.addCylinderZ(-1.62, -0.35, 0.9, 2.0, 0.16, 0.14, 6, armor, 0, 0.3, 0.8);
    M.enemy_mantis = b.upload(gl);
  }

  // Aegis (Shielded Vanguard Cruiser)
  {
    const b = new MeshBuilder();
    const slate = [0.26, 0.32, 0.44], teal = [0.20, 0.86, 0.98];
    b.addBox(0, 0, -0.2, 2.2, 1.1, 1.8, slate, 0, 0.35, 0.7);
    b.addTorusZ(1.65, 0.16, 8, 6, teal, 0.85, 0.2, 0.8);
    b.addBox(0, 0, 0.85, 1.0, 0.5, 0.3, teal, 1.0);
    b.addBox(1.75, 0, -0.3, 0.55, 1.4, 1.4, slate, 0, 0.4, 0.65);
    b.addBox(-1.75, 0, -0.3, 0.55, 1.4, 1.4, slate, 0, 0.4, 0.65);
    M.enemy_aegis = b.upload(gl);
  }

  // Spectre Sniper (Long-Barrel Rail-Drone)
  {
    const b = new MeshBuilder();
    const dark = [0.18, 0.22, 0.28], amber = [1.0, 0.55, 0.12];
    b.addBox(0, 0, -0.5, 1.1, 0.65, 2.4, dark, 0, 0.34, 0.72);
    b.addCylinderZ(0, 0, 0.6, 3.2, 0.18, 0.12, 8, titanium, 0, 0.25, 0.88);
    b.addBox(0, 0, 3.15, 0.24, 0.24, 0.35, amber, 1.0);
    b.addWedgeWing(1, 0.5, -1.2, 0.4, 2.6, -1.4, -0.7, 0.0, 0.45, 0.12, dark, 0, 0.35, 0.7);
    b.addWedgeWing(-1, 0.5, -1.2, 0.4, 2.6, -1.4, -0.7, 0.0, 0.45, 0.12, dark, 0, 0.35, 0.7);
    M.enemy_sniper = b.upload(gl);
  }

  // Swarm Drone (Tiny agile diamond fighter)
  {
    const b = new MeshBuilder();
    b.addConeZ(0, 0, -0.6, 1.15, 0.55, 4, [0.85, 0.24, 0.20], 0, 0.35, 0.5);
    b.addConeZ(0, 0, -0.6, -1.1, 0.55, 4, [0.22, 0.25, 0.32], 0, 0.4, 0.6);
    b.addBox(0, 0, 0.35, 0.35, 0.35, 0.35, [1.0, 0.72, 0.18], 1.0);
    M.enemy_swarm = b.upload(gl);
  }

  // Proximity Mine (Spiked pulsing orb)
  {
    const b = new MeshBuilder();
    b.addIcosphere(0.95, 1, 0.06, 1.0, [0.22, 0.24, 0.30], [0.16, 0.18, 0.24], 0, 0.35, 0.75);
    b.addBox(0, 0, 0, 2.4, 0.22, 0.22, [1.0, 0.26, 0.18], 1.0);
    b.addBox(0, 0, 0, 0.22, 2.4, 0.22, [1.0, 0.26, 0.18], 1.0);
    b.addBox(0, 0, 0, 0.22, 0.22, 2.4, [1.0, 0.26, 0.18], 1.0);
    M.enemy_mine = b.upload(gl);
  }

  // Convoy Cargo Transport (Special Mission VIP Target)
  {
    const b = new MeshBuilder();
    b.addBox(0, 0, 0, 2.6, 1.7, 5.2, titanium, 0, 0.42, 0.58);
    b.addBox(0, 0.95, -0.4, 1.4, 0.6, 2.2, ceramic, 0, 0.35, 0.4);
    b.addBox(1.5, 0, 0, 0.65, 1.2, 3.8, gold, 0.25, 0.25, 0.85);
    b.addBox(-1.5, 0, 0, 0.65, 1.2, 3.8, gold, 0.25, 0.25, 0.85);
    b.addBox(0, 0, 2.65, 1.8, 0.6, 0.25, goldGlow, 1.0);
    M.enemy_convoy = b.upload(gl);
  }

  // =========================================================================
  // 3. FOUR UNIQUE REGION BOSSES
  // =========================================================================

  // Boss 1: Couraçado Leviathan (Solaris Orbit)
  {
    const b = new MeshBuilder();
    const steel = [0.30, 0.36, 0.44], plate = [0.18, 0.22, 0.29], trim = [0.90, 0.24, 0.18];
    b.addBox(0, 0, 0, 9.2, 2.4, 5.6, plate, 0, 0.4, 0.65);
    b.addBox(0, 1.7, -0.8, 4.2, 1.6, 3.4, steel, 0, 0.36, 0.7);
    b.addBox(0, 1.85, 0.95, 3.0, 0.38, 0.32, [1.0, 0.58, 0.14], 1.0);
    b.addBox(7.4, -0.2, 0.3, 6.4, 1.4, 4.0, steel, 0, 0.38, 0.65);
    b.addBox(-7.4, -0.2, 0.3, 6.4, 1.4, 4.0, steel, 0, 0.38, 0.65);
    b.addBox(7.4, 0.60, 0.5, 5.0, 0.28, 2.8, trim, 0.1, 0.32, 0.5);
    b.addBox(-7.4, 0.60, 0.5, 5.0, 0.28, 2.8, trim, 0.1, 0.32, 0.5);
    b.addBox(3.6, -0.3, 3.8, 1.8, 1.25, 3.2, steel, 0, 0.36, 0.7);
    b.addBox(-3.6, -0.3, 3.8, 1.8, 1.25, 3.2, steel, 0, 0.36, 0.7);
    M.boss_leviathan = b.upload(gl);
  }

  // Boss 2: Colosso Minerador Krag (Kharon Belt)
  {
    const b = new MeshBuilder();
    const rust = [0.44, 0.28, 0.20], dark = [0.20, 0.22, 0.26], warn = [0.96, 0.68, 0.12];
    b.addBox(0, 0, -0.5, 11.2, 3.4, 5.8, dark, 0, 0.52, 0.6);
    b.addBox(0, 2.0, -0.4, 6.2, 1.4, 3.8, rust, 0, 0.55, 0.5);
    b.addBox(0, 0.2, 2.5, 3.4, 1.1, 0.5, warn, 0.35, 0.3, 0.8);
    // Twin colossal front mining drills
    b.addConeZ(-5.2, -0.2, 1.8, 6.4, 1.75, 8, titanium, 0, 0.3, 0.85);
    b.addConeZ(5.2, -0.2, 1.8, 6.4, 1.75, 8, titanium, 0, 0.3, 0.85);
    b.addBox(-7.8, 0.2, -0.2, 2.8, 2.6, 4.4, rust, 0, 0.5, 0.55);
    b.addBox(7.8, 0.2, -0.2, 2.8, 2.6, 4.4, rust, 0, 0.5, 0.55);
    M.boss_krag = b.upload(gl);
  }

  // Boss 3: Arconte Criogênico (Cryo Nebula Ring Station)
  {
    const b = new MeshBuilder();
    const frost = [0.70, 0.86, 0.96], steel = [0.22, 0.32, 0.44], ice = [0.24, 0.94, 0.98];
    b.addTorusZ(6.8, 0.95, 16, 8, steel, 0, 0.26, 0.78);
    b.addTorusZ(5.2, 0.26, 16, 6, ice, 0.95);
    // Radial structural spokes & crystal blades
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      b.addBox(Math.cos(a) * 6.8, Math.sin(a) * 6.8, 0.4, 2.2, 2.2, 2.6, frost, 0.12, 0.2, 0.8);
    }
    b.addIcosphere(2.4, 1, 0.1, 3.0, frost, steel, 0.18, 0.2, 0.85);
    M.boss_archon = b.upload(gl);
  }

  // Boss 4: Fênix Solar (Ignition Rift / Ancient Ruins Winged Star-Craft)
  {
    const b = new MeshBuilder();
    const dark = [0.20, 0.16, 0.18], flare = [1.0, 0.52, 0.14];
    b.addTaperBoxZ(0, 0, -2.0, 4.4, 2.4, 0, 4.8, 1.2, 0.8, dark, 0, 0.3, 0.8);
    b.addBox(0, 0.6, 1.4, 2.4, 0.7, 2.8, gold, 0.35, 0.2, 0.92);
    // Sweeping blazing solar wings
    b.addWedgeWing(1, 1.8, -2.5, 1.5, 11.5, -1.2, 3.2, 0.4, 2.6, 0.65, gold, 0.25, 0.22, 0.9);
    b.addWedgeWing(-1, 1.8, -2.5, 1.5, 11.5, -1.2, 3.2, 0.4, 2.6, 0.65, gold, 0.25, 0.22, 0.9);
    b.addWedgeWing(1, 2.0, -1.5, 2.2, 9.8, 1.2, 4.2, -0.4, -1.8, 0.45, flare, 0.92);
    b.addWedgeWing(-1, 2.0, -1.5, 2.2, 9.8, 1.2, 4.2, -0.4, -1.8, 0.45, flare, 0.92);
    M.boss_phoenix = b.upload(gl);
  }

  // Boss Weakpoint Reactor Core
  {
    const b = new MeshBuilder();
    b.addIcosphere(1.22, 1, 0.08, 2.0, [1.0, 0.42, 0.12], [1.0, 0.82, 0.22], 1.0);
    M.boss_core = b.upload(gl);
  }

  // =========================================================================
  // 4. ENVIRONMENT, OBSTACLES, RELICS, POWERUPS & PROJECTILES
  // =========================================================================

  // 4 procedural faceted asteroids (basalt, iron, mineral-veined, volcanic)
  M.asteroids = [];
  const rockPalettes = [
    [[0.44, 0.39, 0.35], [0.27, 0.25, 0.26]],
    [[0.36, 0.38, 0.42], [0.22, 0.24, 0.28]],
    [[0.48, 0.40, 0.30], [0.28, 0.24, 0.22]],
    [[0.38, 0.22, 0.18], [0.24, 0.16, 0.15]]
  ];
  for (let i = 0; i < 4; i++) {
    const b = new MeshBuilder();
    b.addIcosphere(1.0, 1, 0.25, 1.7 + i * 3.3, rockPalettes[i][0], rockPalettes[i][1], 0, 0.86, 0.12);
    M.asteroids.push(b.upload(gl));
  }

  // Planetary Ring Disc (for giant background planets!)
  {
    const b = new MeshBuilder();
    b.addPlanetaryRing(1.38, 2.28, 48, [0.92, 0.78, 0.56], [0.68, 0.58, 0.44], 0.38);
    M.planet_ring = b.upload(gl);
  }

  // Energy Gate Ring (Octagonal golden portal)
  {
    const b = new MeshBuilder();
    b.addTorusZ(2.9, 0.24, 12, 6, [1.0, 0.76, 0.18], 0.95);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
      b.addBox(Math.cos(a) * 3.2, Math.sin(a) * 3.2, 0, 0.54, 0.54, 0.68, titanium, 0, 0.32, 0.72);
    }
    M.ring = b.upload(gl);
  }

  // Scannable Relic / Deep-Space Anomaly Probe (Exploration feature!)
  {
    const b = new MeshBuilder();
    b.addConeZ(0, 0, 0, 1.8, 1.0, 4, gold, 0.35, 0.2, 0.92);
    b.addConeZ(0, 0, 0, -1.8, 1.0, 4, gold, 0.35, 0.2, 0.92);
    b.addTorusZ(1.9, 0.12, 16, 6, cyanGlow, 1.0);
    b.addTorusZ(2.45, 0.08, 12, 5, goldGlow, 0.95);
    M.relic = b.upload(gl);
  }

  // Power-ups (Shield, Triple, Nova, Missile Refill)
  const makePowerup = (col, haloCol) => {
    const b = new MeshBuilder();
    b.addConeZ(0, 0, 0, 0.95, 0.65, 4, col, 1.0);
    b.addConeZ(0, 0, 0, -0.95, 0.65, 4, col, 1.0);
    b.addTorusZ(1.08, 0.09, 12, 5, haloCol, 0.95);
    return b.upload(gl);
  };
  M.pu_shield  = makePowerup([0.22, 0.85, 1.0], [0.75, 0.96, 1.0]);
  M.pu_triple  = makePowerup([1.0, 0.70, 0.14], [1.0, 0.92, 0.55]);
  M.pu_nova    = makePowerup([0.28, 0.96, 0.62], [0.85, 1.0, 0.90]);
  M.pu_missile = makePowerup([1.0, 0.42, 0.22], [1.0, 0.82, 0.50]);

  // Projectiles & Missiles
  { const b = new MeshBuilder(); b.addBox(0, 0, 0, 0.18, 0.18, 2.7, [0.42, 0.94, 1.0], 1.0); M.laser_cyan = b.upload(gl); }
  { const b = new MeshBuilder(); b.addBox(0, 0, 0, 0.24, 0.24, 3.0, [1.0, 0.80, 0.24], 1.0); M.laser_amber = b.upload(gl); }
  { const b = new MeshBuilder(); b.addBox(0, 0, 0, 0.44, 0.44, 70.0, [1.0, 0.35, 0.18], 1.0); M.sniper_beam = b.upload(gl); }
  {
    const b = new MeshBuilder();
    b.addConeZ(0, 0, 0.1, -1.1, 0.22, 6, ceramic, 0.15, 0.3, 0.6);
    b.addBox(0, 0, 0.55, 0.24, 0.24, 0.9, gold, 0.4);
    b.addBox(0, 0, 1.05, 0.22, 0.22, 0.26, [1.0, 0.62, 0.18], 1.0);
    M.missile = b.upload(gl);
  }
  { const b = new MeshBuilder(); b.addIcosphere(0.45, 0, 0.0, 1.0, [1.0, 0.28, 0.18], [1.0, 0.68, 0.22], 1.0); M.enemy_orb = b.upload(gl); }

  // Biome 1 Setpieces: Solaris Orbit Megastructure Deck, Walls & Arches
  {
    const b = new MeshBuilder();
    b.addBox(0, 0, 0, 34, 0.8, 10.0, [0.15, 0.21, 0.30], 0, 0.45, 0.55);
    b.addBox(-13.8, 1.1, 0, 6.4, 1.8, 10.0, [0.22, 0.29, 0.39], 0, 0.42, 0.58);
    b.addBox(13.8, 1.1, 0, 6.4, 1.8, 10.0, [0.22, 0.29, 0.39], 0, 0.42, 0.58);
    b.addBox(0, 0.46, 0, 0.55, 0.10, 4.4, goldGlow, 0.92);
    b.addBox(-9.5, 0.46, 0, 0.24, 0.10, 9.6, cyanGlow, 0.72);
    b.addBox(9.5, 0.46, 0, 0.24, 0.10, 9.6, cyanGlow, 0.72);
    b.addBox(0, 0.44, -4.6, 20.5, 0.16, 0.65, titanium, 0, 0.38, 0.65);
    M.trench_deck = b.upload(gl);
  }
  {
    const b = new MeshBuilder();
    b.addBox(0, 0, 0, 1.0, 1.0, 1.0, [0.22, 0.29, 0.39], 0, 0.44, 0.55);
    b.addBox(0, 0.42, 0.51, 0.72, 0.08, 0.04, goldGlow, 0.98);
    M.pillar = b.upload(gl);
  }
  {
    const b = new MeshBuilder();
    b.addBox(0, 0, 0, 1.7, 1.0, 1.7, [0.24, 0.28, 0.36], 0, 0.4, 0.6);
    b.addBox(0, 0, 0.87, 0.44, 0.92, 0.08, [1.0, 0.30, 0.20], 1.0);
    b.addBox(0, 0, -0.87, 0.44, 0.92, 0.08, [1.0, 0.30, 0.20], 1.0);
    M.hazard_pillar = b.upload(gl);
  }
  {
    const b = new MeshBuilder();
    const col = [0.20, 0.28, 0.38];
    b.addBox(-15.0, 10.5, 0, 2.4, 21.0, 2.2, col, 0, 0.4, 0.62);
    b.addBox(15.0, 10.5, 0, 2.4, 21.0, 2.2, col, 0, 0.4, 0.62);
    b.addBox(0, 20.5, 0, 32.4, 1.9, 2.4, col, 0, 0.4, 0.62);
    b.addBox(-7.5, 19.4, 0, 3.6, 0.32, 0.6, cyanGlow, 0.95);
    b.addBox(7.5, 19.4, 0, 3.6, 0.32, 0.6, cyanGlow, 0.95);
    b.addBox(0, 19.4, 0, 3.4, 0.32, 0.6, goldGlow, 0.95);
    M.arch = b.upload(gl);
  }

  // Biome 3 Setpiece: Cryo Crystalline Spire (floating jagged crystal)
  {
    const b = new MeshBuilder();
    const iceA = [0.46, 0.84, 0.96], iceB = [0.22, 0.56, 0.78];
    b.addConeZ(0, 0, 0, 1.6, 0.65, 5, iceA, 0.28, 0.14, 0.82);
    b.addConeZ(0, 0, 0, -1.6, 0.65, 5, iceB, 0.18, 0.18, 0.78);
    M.cryo_crystal = b.upload(gl);
  }

  // Biome 5 Setpiece: Ancient Monolith Ring Gate
  {
    const b = new MeshBuilder();
    b.addTorusZ(15.5, 1.35, 8, 6, [0.16, 0.20, 0.26], 0, 0.32, 0.78);
    b.addTorusZ(14.1, 0.22, 8, 5, goldGlow, 0.95);
    M.ancient_gate = b.upload(gl);
  }

  // Debris Shards & Expanding Shockwave Ring
  { const b = new MeshBuilder(); b.addIcosphere(0.5, 0, 0.18, 4.2, [1.0, 0.82, 0.38], [1.0, 0.42, 0.16], 0.95); M.shard = b.upload(gl); }
  { const b = new MeshBuilder(); b.addTorusZ(1.0, 0.08, 20, 4, [1.0, 0.82, 0.35], 1.0); M.shockwave = b.upload(gl); }

  return M;
}
