// Solaris Drift — 5 Distinct Space Biomes, Star Map Routes & Star Codex Lore

export const REGIONS = {
  solaris_orbit: {
    id: 'solaris_orbit',
    name: 'Órbita Solaris',
    subtitle: 'Megaestrutura & Vento Solar',
    mode: 'solar_corridor',
    hazardDesc: 'Correntes solares aceleram o voo e recarregam o Turbo.',
    bossId: 'leviathan',
    bossName: 'COURAÇADO LEVIATHAN',
    rewardMult: 1.0,
    fog: [0.032, 0.068, 0.118],
    lightDir: [0.46, 0.78, 0.42],
    sunDir: [0.34, 0.28, -0.89],
    lightCol: [1.0, 0.86, 0.62],
    ambient: [0.22, 0.30, 0.42],
    rim: [0.24, 0.78, 1.0],
    sunTint: [1.0, 0.84, 0.48],
    fogNear: 40,
    fogFar: 195,
    sky: {
      seed: 1.4,
      bg: [0.014, 0.032, 0.068],
      nebulaA: [0.06, 0.22, 0.40],
      nebulaB: [0.48, 0.28, 0.09],
      nebulaC: [0.18, 0.56, 0.72],
      starDensity: 1.15
    },
    planet: {
      type: 0, // Gas Giant
      colA: [0.16, 0.38, 0.62],
      colB: [0.76, 0.56, 0.34],
      atmoCol: [0.36, 0.78, 1.0],
      hasRing: true,
      ringTint: [1.0, 0.84, 0.58],
      pos: [-48, 28, -225],
      scale: 34
    },
    nextRoutes: ['kharon_belt', 'cryo_nebula'],
    codexId: 'region_solaris'
  },

  kharon_belt: {
    id: 'kharon_belt',
    name: 'Cinturão de Kharon',
    subtitle: 'Espaço Aberto & Campo de Asteroides',
    mode: 'asteroid_field', // Open 360° deep space — NO floor!
    hazardDesc: 'Espaço aberto sem pista: asteroides gigantes se fragmentam ao explodir.',
    bossId: 'krag',
    bossName: 'COLOSSO MINERADOR KRAG',
    rewardMult: 1.25,
    fog: [0.042, 0.038, 0.052],
    lightDir: [-0.52, 0.68, 0.52],
    sunDir: [-0.42, 0.26, -0.87],
    lightCol: [1.0, 0.80, 0.56],
    ambient: [0.24, 0.24, 0.30],
    rim: [0.96, 0.58, 0.24],
    sunTint: [1.0, 0.74, 0.42],
    fogNear: 52,
    fogFar: 210,
    sky: {
      seed: 4.8,
      bg: [0.018, 0.018, 0.028],
      nebulaA: [0.36, 0.20, 0.10],
      nebulaB: [0.12, 0.24, 0.36],
      nebulaC: [0.68, 0.44, 0.16],
      starDensity: 1.45
    },
    planet: {
      type: 1, // Rocky/Ocean Exoplanet
      colA: [0.14, 0.28, 0.44],
      colB: [0.58, 0.44, 0.30],
      atmoCol: [0.42, 0.78, 0.96],
      hasRing: false,
      ringTint: [0.9, 0.8, 0.6],
      pos: [52, 22, -210],
      scale: 42
    },
    nextRoutes: ['ignition_rift', 'cryo_nebula'],
    codexId: 'region_kharon'
  },

  cryo_nebula: {
    id: 'cryo_nebula',
    name: 'Nebulosa Criogênica',
    subtitle: 'Nuvens de Gelo & Monolitos Refrativos',
    mode: 'cryo_nebula', // Open luminous nebula + drifting crystal spires
    hazardDesc: 'Monolitos de gelo flutuantes, drones escudados Aegis e bolsões de névoa.',
    bossId: 'archon',
    bossName: 'ARCONTE CRIOGÊNICO',
    rewardMult: 1.35,
    fog: [0.020, 0.088, 0.122],
    lightDir: [-0.36, 0.84, 0.40],
    sunDir: [0.24, 0.34, -0.91],
    lightCol: [0.84, 0.96, 1.0],
    ambient: [0.20, 0.38, 0.48],
    rim: [0.18, 0.94, 0.82],
    sunTint: [0.76, 0.96, 1.0],
    fogNear: 34,
    fogFar: 170,
    sky: {
      seed: 8.3,
      bg: [0.010, 0.045, 0.072],
      nebulaA: [0.06, 0.44, 0.56],
      nebulaB: [0.10, 0.58, 0.48],
      nebulaC: [0.46, 0.88, 0.96],
      starDensity: 1.25
    },
    planet: {
      type: 2, // Cryo Ice World
      colA: [0.26, 0.56, 0.74],
      colB: [0.78, 0.94, 1.0],
      atmoCol: [0.24, 0.96, 0.88],
      hasRing: true,
      ringTint: [0.68, 0.96, 1.0],
      pos: [-38, 30, -205],
      scale: 38
    },
    nextRoutes: ['ignition_rift', 'ancient_ruins'],
    codexId: 'region_cryo'
  },

  ignition_rift: {
    id: 'ignition_rift',
    name: 'Fenda de Ignição',
    subtitle: 'Coroa Estelar & Tempestades Solares',
    mode: 'solar_corona',
    hazardDesc: 'Erupções solares periódicas varrem o espaço — use 360° ou desvie pelas lacunas!',
    bossId: 'phoenix',
    bossName: 'FÊNIX SOLAR',
    rewardMult: 1.55,
    fog: [0.105, 0.042, 0.028],
    lightDir: [0.34, 0.70, 0.54],
    sunDir: [0.0, 0.18, -0.98],
    lightCol: [1.0, 0.72, 0.38],
    ambient: [0.36, 0.20, 0.16],
    rim: [1.0, 0.46, 0.18],
    sunTint: [1.0, 0.58, 0.18],
    fogNear: 42,
    fogFar: 195,
    sky: {
      seed: 12.7,
      bg: [0.055, 0.016, 0.012],
      nebulaA: [0.62, 0.18, 0.08],
      nebulaB: [0.78, 0.42, 0.10],
      nebulaC: [1.0, 0.68, 0.22],
      starDensity: 0.95
    },
    planet: {
      type: 3, // Blazing Volcanic / Solar Star
      colA: [0.62, 0.12, 0.05],
      colB: [1.0, 0.78, 0.24],
      atmoCol: [1.0, 0.52, 0.14],
      hasRing: false,
      ringTint: [1.0, 0.6, 0.2],
      pos: [0, 26, -215],
      scale: 48
    },
    nextRoutes: ['ancient_ruins', 'solaris_orbit'],
    codexId: 'region_ignition'
  },

  ancient_ruins: {
    id: 'ancient_ruins',
    name: 'Ruínas do Horizonte',
    subtitle: 'Portais Monolíticos & Singularidade',
    mode: 'ancient_ruins',
    hazardDesc: 'Portais antigos em espaço aberto, relíquias escaneáveis e esquadrões de elite.',
    bossId: 'phoenix',
    bossName: 'GUARDIÃO SOLAR ÔMEGA',
    rewardMult: 1.75,
    fog: [0.024, 0.036, 0.054],
    lightDir: [0.22, 0.85, 0.48],
    sunDir: [0.0, 0.24, -0.97],
    lightCol: [1.0, 0.88, 0.66],
    ambient: [0.18, 0.24, 0.34],
    rim: [1.0, 0.76, 0.26],
    sunTint: [1.0, 0.80, 0.36],
    fogNear: 48,
    fogFar: 220,
    sky: {
      seed: 19.2,
      bg: [0.010, 0.014, 0.026],
      nebulaA: [0.10, 0.20, 0.34],
      nebulaB: [0.46, 0.34, 0.12],
      nebulaC: [0.26, 0.64, 0.72],
      starDensity: 1.6
    },
    planet: {
      type: 4, // Singularity Black Hole Event Horizon!
      colA: [0.02, 0.02, 0.03],
      colB: [0.02, 0.02, 0.03],
      atmoCol: [1.0, 0.74, 0.24],
      hasRing: true,
      ringTint: [1.0, 0.76, 0.28],
      pos: [0, 24, -220],
      scale: 36
    },
    nextRoutes: ['solaris_orbit', 'kharon_belt'],
    codexId: 'region_ruins'
  }
};

export const REGION_ORDER = ['solaris_orbit', 'kharon_belt', 'cryo_nebula', 'ignition_rift', 'ancient_ruins'];

export const CODEX_ENTRIES = [
  { id: 'region_solaris', title: 'Órbita Solaris', category: 'Região', lore: 'Anel de coletores heliotécnicos erguido em torno de um gigante gasoso azul-dourado para abastecer a frota.' },
  { id: 'region_kharon',  title: 'Cinturão de Kharon', category: 'Região', lore: 'Restos de uma lua fragmentada ricos em titânio e minerais raros, hoje dominados por dragas autônomas.' },
  { id: 'region_cryo',    title: 'Nebulosa Criogênica', category: 'Região', lore: 'Berçário de cristais de gelo super-resfriados cuja refração interfere em sensores convencionais.' },
  { id: 'region_ignition',title: 'Fenda de Ignição', category: 'Região', lore: 'Zona limítrofe de uma estrela hiperativa; apenas cascos revestidos em ouro térmico suportam o calor.' },
  { id: 'region_ruins',   title: 'Ruínas do Horizonte', category: 'Região', lore: 'Arcos monolíticos de uma civilização esquecida orbitando uma singularidade estável.' },
  { id: 'relic_probe',    title: 'Sonda Relíquia', category: 'Exploração', lore: 'Baliza de telemetria ancestral que emite dados estelares quando escaneada em voo rasante.' },
  { id: 'mission_convoy', title: 'Comboio de Suprimentos', category: 'Operação', lore: 'Cargueiro blindado de alta prioridade interceptado antes do salto hiperespacial.' },
  { id: 'boss_leviathan', title: 'Couraçado Leviathan', category: 'Chefão', lore: 'Nave-capitânia de assalto equipada com três núcleos de fusão independentes.' },
  { id: 'boss_krag',      title: 'Colosso Minerador Krag', category: 'Chefão', lore: 'Plataforma extratora convertida em arma de guerra com brocas gêmeas de liga reforçada.' },
  { id: 'boss_archon',    title: 'Arconte Criogênico', category: 'Chefão', lore: 'Estação anelar automatizada capaz de rotacionar escudos prismáticos ao redor de seu reator.' },
  { id: 'boss_phoenix',   title: 'Fênix Solar', category: 'Chefão', lore: 'Nave experimental que canaliza energia da coroa estelar em rajadas espirais de plasma.' }
];
