// Solaris Drift — Next-Gen WebGL GLSL Shaders (100% WebGL 1 & 2 compatible)

export const MESH_VS = `
  attribute vec3 aPos;
  attribute vec3 aNorm;
  attribute vec3 aColor;
  attribute vec3 aMat; // x = emissive (0..1), y = roughness (0..1), z = metallic (0..1)

  uniform mat4 uModel;
  uniform mat4 uViewProj;
  uniform mat3 uNormalMat;

  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;
  varying vec3 vColor;
  varying vec3 vMat;

  void main() {
    vec4 worldPos = uModel * vec4(aPos, 1.0);
    vWorldPos = worldPos.xyz;
    vLocalPos = aPos;
    vNormal = normalize(uNormalMat * aNorm);
    vColor = aColor;
    vMat = aMat;
    gl_Position = uViewProj * worldPos;
  }
`;

export const MESH_FS = `
  precision mediump float;

  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;
  varying vec3 vColor;
  varying vec3 vMat;

  uniform vec3 uCamPos;
  uniform vec3 uLightDir;
  uniform vec3 uLightColor;
  uniform vec3 uAmbientColor;
  uniform vec3 uRimColor;
  uniform vec3 uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform vec3 uTint;
  uniform float uFlash;
  uniform float uAlpha;
  uniform float uDamage; // 0..1 hull damage scorch/flicker

  void main() {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(uLightDir);
    vec3 V = normalize(uCamPos - vWorldPos);
    vec3 H = normalize(L + V);

    float emissive = vMat.x;
    float roughness = clamp(vMat.y, 0.08, 1.0);
    float metallic = clamp(vMat.z, 0.0, 1.0);

    // Subtle procedural Heliotech micro-panel bevels on non-emissive surfaces
    vec3 grid = abs(fract(vLocalPos * 1.15 + 0.5) - 0.5);
    float seam = smoothstep(0.015, 0.055, min(min(grid.x, grid.y), grid.z));
    float panelShade = mix(0.88, 1.0, seam);

    vec3 albedo = vColor * uTint * mix(panelShade, 1.0, emissive);

    // Diffuse + soft hemisphere fill + key specular
    float NdotL = max(dot(N, L), 0.0);
    float wrapDiff = max((dot(N, L) + 0.25) / 1.25, 0.0);
    float backFill = max(dot(N, normalize(vec3(-L.x, 0.45, -L.z))), 0.0) * 0.28;

    float shininess = mix(96.0, 10.0, roughness);
    float specStrength = mix(0.32, 1.05, metallic) * (1.0 - roughness * 0.55);
    float spec = pow(max(dot(N, H), 0.0), shininess) * specStrength;

    // Fresnel rim lighting & metallic env sheen
    float ndv = max(dot(N, V), 0.0);
    float fresnel = pow(1.0 - ndv, 3.2) * mix(0.38, 0.82, metallic);

    vec3 diffColor = albedo * (1.0 - metallic * 0.35);
    vec3 specTint = mix(uLightColor, albedo * uLightColor * 1.35, metallic);

    vec3 lit = diffColor * (uAmbientColor + uLightColor * mix(NdotL, wrapDiff, 0.35) + uRimColor * backFill)
             + specTint * spec
             + uRimColor * fresnel;

    // Emissive surfaces push brightly so FBO Bloom picks them up cleanly
    vec3 emCol = vColor * uTint * 1.55;
    vec3 col = mix(lit, emCol, emissive);

    // Optional battle scorch/damage glow cracks
    if (uDamage > 0.05) {
      float crack = smoothstep(0.45, 0.50, sin(vLocalPos.x * 7.0 + vLocalPos.z * 5.0) * cos(vLocalPos.y * 6.0));
      col = mix(col, vec3(1.0, 0.36, 0.10) * 1.4, crack * uDamage * 0.55);
    }

    // Hit flash
    col = mix(col, vec3(1.0, 0.98, 0.92) * 1.35, uFlash);

    // Distance atmospheric fog (emissive pierces fog)
    float dist = length(uCamPos - vWorldPos);
    float fog = clamp((dist - uFogNear) / max(1.0, (uFogFar - uFogNear)), 0.0, 1.0);
    fog = fog * fog * (1.0 - emissive * 0.52);
    vec3 finalCol = mix(col, uFogColor, fog);

    gl_FragColor = vec4(finalCol, uAlpha);
  }
`;

// Fullscreen Quad Vertex Shader (used by Nebula Baker, Skybox, and Bloom Post-Process)
export const QUAD_VS = `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.999, 1.0);
  }
`;

// Baked Procedural 6-Octave Nebula + Milky Way + Star Clusters (runs ONCE per region load!)
export const NEBULA_BAKE_FS = `
  precision highp float;
  varying vec2 vUv;

  uniform vec3 uBgColor;
  uniform vec3 uNebulaA;
  uniform vec3 uNebulaB;
  uniform vec3 uNebulaC;
  uniform float uSeed;
  uniform float uStarDensity;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.52;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.04 + vec3(13.1, 7.7, 5.3);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    // Equirectangular uv -> 3D sphere direction
    float lon = (vUv.x - 0.5) * 6.2831853;
    float lat = (vUv.y - 0.5) * 3.1415926;
    vec3 dir = vec3(cos(lat) * sin(lon), sin(lat), -cos(lat) * cos(lon));

    // Tilted galactic plane
    float plane = abs(dot(dir, normalize(vec3(0.28, 0.90, 0.33))));
    float galBand = exp(-plane * 4.4);

    vec3 p = dir * 2.4 + vec3(uSeed * 3.1, uSeed * 1.7, -uSeed * 2.3);
    float n1 = fbm(p);
    float n2 = fbm(p * 2.1 + vec3(n1 * 1.8));
    float dust = smoothstep(0.46, 0.72, fbm(p * 3.0 + vec3(4.2)));

    // Multi-layer cosmic nebula composition
    vec3 col = uBgColor;
    col += uNebulaA * smoothstep(0.28, 0.85, n1) * (0.45 + galBand * 0.75);
    col += uNebulaB * smoothstep(0.38, 0.88, n2) * (0.35 + galBand * 0.65);
    col += uNebulaC * pow(max(0.0, n1 * n2), 1.8) * (0.4 + galBand * 1.2);

    // Dark cosmic dust rift cutting through the Milky Way band
    col *= (1.0 - dust * galBand * 0.48);

    // Rich crisp multi-scale background starfield baked cleanly into sky
    vec3 starCell = floor(dir * 165.0);
    float h = hash(starCell + vec3(uSeed));
    float starMask = smoothstep(1.0 - 0.008 * uStarDensity, 1.0, h);
    vec3 starTint = mix(vec3(0.75, 0.88, 1.0), vec3(1.0, 0.88, 0.68), hash(starCell + vec3(9.1)));
    col += starTint * starMask * (0.8 + galBand * 0.65);

    // Bright hero stars with subtle twinkle halo
    vec3 bigCell = floor(dir * 52.0);
    float hb = hash(bigCell + vec3(uSeed * 2.0 + 3.0));
    if (hb > 0.992) {
      vec3 local = fract(dir * 52.0) - 0.5;
      float d = length(local);
      float glow = exp(-d * 14.0);
      vec3 bCol = mix(vec3(0.65, 0.90, 1.0), vec3(1.0, 0.82, 0.52), fract(hb * 413.0));
      col += bCol * glow * 1.35;
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

// Real-time Spherical Skybox Pass (1 texture lookup + live solar corona!)
export const SKY_FS = `
  precision mediump float;
  varying vec2 vUv;

  uniform sampler2D uSkyTex;
  uniform vec3 uCamRight;
  uniform vec3 uCamUp;
  uniform vec3 uCamFwd;
  uniform float uTanHalfFov;
  uniform float uAspect;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform float uWarpFlash;

  void main() {
    vec2 ndc = vUv * 2.0 - 1.0;
    vec3 dir = normalize(
      uCamFwd +
      uCamRight * (ndc.x * uAspect * uTanHalfFov) +
      uCamUp * (ndc.y * uTanHalfFov)
    );

    float lon = atan(dir.x, -dir.z);
    float lat = asin(clamp(dir.y, -1.0, 1.0));
    vec2 eqUv = vec2(lon / 6.2831853 + 0.5, lat / 3.1415926 + 0.5);

    vec3 col = texture2D(uSkyTex, eqUv).rgb;

    // Dynamic solar disc + atmospheric corona glow
    float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
    float corona = pow(sunDot, 12.0) * 0.36 + pow(sunDot, 96.0) * 0.85;
    float disc = smoothstep(0.9965, 0.9990, sunDot);
    col += uSunColor * (corona + disc * 1.5);

    // Hyperspace jump tunnel flash
    if (uWarpFlash > 0.01) {
      float radial = length(ndc);
      col += vec3(0.45, 0.88, 1.0) * uWarpFlash * (0.35 + radial * 0.75);
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

// Atmospheric Giant Planet Shader (Procedural bands/oceans/lava/ice + Fresnel atmosphere limb!)
export const PLANET_VS = `
  attribute vec3 aPos;
  attribute vec3 aNorm;

  uniform mat4 uModel;
  uniform mat4 uViewProj;
  uniform mat3 uNormalMat;

  varying vec3 vNormal;
  varying vec3 vLocal;
  varying vec3 vWorldPos;

  void main() {
    vec4 wp = uModel * vec4(aPos, 1.0);
    vWorldPos = wp.xyz;
    vLocal = normalize(aPos);
    vNormal = normalize(uNormalMat * aNorm);
    gl_Position = uViewProj * wp;
  }
`;

export const PLANET_FS = `
  precision mediump float;

  varying vec3 vNormal;
  varying vec3 vLocal;
  varying vec3 vWorldPos;

  uniform vec3 uCamPos;
  uniform vec3 uLightDir;
  uniform vec3 uColA;
  uniform vec3 uColB;
  uniform vec3 uAtmoCol;
  uniform float uType; // 0=gas giant, 1=exoplanet, 2=cryo, 3=solar/volcanic, 4=singularity
  uniform float uTime;

  float pHash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float pNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(pHash(i+vec3(0,0,0)), pHash(i+vec3(1,0,0)), f.x),
          mix(pHash(i+vec3(0,1,0)), pHash(i+vec3(1,1,0)), f.x), f.y),
      mix(mix(pHash(i+vec3(0,0,1)), pHash(i+vec3(1,0,1)), f.x),
          mix(pHash(i+vec3(0,1,1)), pHash(i+vec3(1,1,1)), f.x), f.y), f.z);
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(uLightDir);
    vec3 V = normalize(uCamPos - vWorldPos);
    vec3 p = normalize(vLocal);

    float ndl = dot(N, L);
    float day = smoothstep(-0.18, 0.45, ndl);
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);

    vec3 surf = uColA;
    float emissive = 0.0;

    if (uType < 0.5) {
      // Gas Giant with swirling atmospheric bands
      float turb = pNoise(p * 4.2 + vec3(uTime * 0.03, 0.0, 0.0)) * 0.35;
      float band = sin((p.y + turb) * 14.0) * 0.5 + 0.5;
      float storm = smoothstep(0.62, 0.85, pNoise(p * 6.5));
      surf = mix(uColA, uColB, band);
      surf = mix(surf, uAtmoCol * 1.15, storm * 0.4);
    } else if (uType < 1.5) {
      // Fractured Rocky / Ocean Exoplanet + drifting clouds
      float cont = pNoise(p * 3.8) + 0.5 * pNoise(p * 8.0);
      surf = mix(uColA, uColB, smoothstep(0.68, 0.92, cont));
      float clouds = smoothstep(0.55, 0.78, pNoise(p * 5.2 + vec3(uTime * 0.06, 0.0, 0.0)));
      surf = mix(surf, vec3(0.92, 0.96, 1.0), clouds * 0.52);
    } else if (uType < 2.5) {
      // Cryo Ice World (Europa-style luminous glacier fissures)
      float ice = pNoise(p * 4.2) * 0.65 + pNoise(p * 9.0) * 0.35;
      float vein = 1.0 - smoothstep(0.0, 0.085, abs(pNoise(p * 6.2) - 0.5));
      surf = mix(uColA, uColB, smoothstep(0.25, 0.78, ice));
      surf = mix(surf, uAtmoCol * 1.25, vein * 0.65);
      emissive = vein * 0.38;
    } else if (uType < 3.5) {
      // Volcanic / Solar Corona Star
      float mag = pNoise(p * 5.5 + vec3(uTime * 0.14));
      float mag2 = pNoise(p * 11.0 - vec3(uTime * 0.18));
      float heat = smoothstep(0.32, 0.78, mag * 0.65 + mag2 * 0.45);
      surf = mix(uColA, uColB * 1.45, heat);
      emissive = 0.75 + heat * 0.55;
    } else {
      // Singularity / Ancient Dark Core with blazing event horizon rim
      surf = vec3(0.02, 0.03, 0.05);
      emissive = 0.0;
    }

    vec3 lit = surf * (0.09 + day * 0.95);
    vec3 col = mix(lit, surf, clamp(emissive, 0.0, 1.0));

    // Luminous atmospheric limb scattering (stronger on sunlit edge, full ring on singularity)
    float atmoStrength = uType > 3.5 ? (pow(fresnel, 1.6) * 2.1) : (fresnel * (0.28 + day * 0.95));
    col += uAtmoCol * atmoStrength;

    gl_FragColor = vec4(col, 1.0);
  }
`;

// 3D Hexagonal Energy Shield Dome (Additive with Impact Ripple!)
export const SHIELD_VS = `
  attribute vec3 aPos;
  attribute vec3 aNorm;

  uniform mat4 uModel;
  uniform mat4 uViewProj;
  uniform mat3 uNormalMat;

  varying vec3 vNormal;
  varying vec3 vLocal;
  varying vec3 vWorldPos;

  void main() {
    vec4 wp = uModel * vec4(aPos, 1.0);
    vWorldPos = wp.xyz;
    vLocal = normalize(aPos);
    vNormal = normalize(uNormalMat * aNorm);
    gl_Position = uViewProj * wp;
  }
`;

export const SHIELD_FS = `
  precision mediump float;

  varying vec3 vNormal;
  varying vec3 vLocal;
  varying vec3 vWorldPos;

  uniform vec3 uCamPos;
  uniform vec3 uColor;
  uniform float uAlpha;
  uniform float uTime;
  uniform vec3 uHitDir;
  uniform float uHitWave; // 0..1 expanding impact pulse

  // Lightweight procedural hex-like lattice in 3D triplanar coords
  float hexGrid(vec3 p) {
    vec3 q = abs(fract(p * 4.5) - 0.5);
    float d1 = max(q.x * 0.866 + q.y * 0.5, q.y);
    float d2 = max(q.z * 0.866 + q.y * 0.5, q.y);
    float edge = smoothstep(0.38, 0.48, max(d1, d2));
    return edge;
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(uCamPos - vWorldPos);
    float fresnel = pow(1.0 - abs(dot(N, V)), 2.2);
    float grid = hexGrid(vLocal + vec3(0.0, uTime * 0.08, 0.0));

    // Expanding impact ring across dome
    float dHit = acos(clamp(dot(normalize(vLocal), normalize(uHitDir)), -1.0, 1.0));
    float ring = exp(-pow((dHit - uHitWave * 2.8) * 5.5, 2.0)) * (1.0 - uHitWave);

    float intensity = fresnel * 0.95 + grid * 0.45 + ring * 1.85;
    float alpha = clamp(intensity * uAlpha, 0.0, 0.95);
    vec3 col = uColor * (1.1 + ring * 1.4 + grid * 0.3);
    gl_FragColor = vec4(col, alpha);
  }
`;

// GPU-Driven 3D Starfield & Warp Streaks
export const STAR_VS = `
  attribute vec3 aBasePos;
  attribute float aEnd;
  attribute vec3 aCol;

  uniform mat4 uViewProj;
  uniform float uTravel;
  uniform float uStreak;

  varying vec3 vCol;
  varying float vFade;

  void main() {
    float depth = 240.0;
    float z = mod(aBasePos.z + uTravel, depth) - depth + 22.0;
    z -= aEnd * uStreak;
    vCol = aCol;
    float distFade = clamp(1.0 - (-z) / 230.0, 0.04, 1.0);
    vFade = distFade * (1.0 - aEnd * 0.78);
    gl_Position = uViewProj * vec4(aBasePos.x, aBasePos.y, z, 1.0);
  }
`;

export const STAR_FS = `
  precision mediump float;
  varying vec3 vCol;
  varying float vFade;
  void main() {
    gl_FragColor = vec4(vCol * (0.7 + vFade * 0.8), vFade);
  }
`;

// Batched 3D Additive Glow Billboards (1 draw call for hundreds of explosion puffs/sparks/halos!)
export const BILLBOARD_VS = `
  attribute vec3 aCenter;
  attribute vec2 aCorner; // (-1..1, -1..1)
  attribute float aSize;
  attribute vec4 aColor;

  uniform mat4 uViewProj;
  uniform vec3 uCamRight;
  uniform vec3 uCamUp;

  varying vec2 vCorner;
  varying vec4 vColor;

  void main() {
    vec3 wp = aCenter + (uCamRight * aCorner.x + uCamUp * aCorner.y) * aSize;
    vCorner = aCorner;
    vColor = aColor;
    gl_Position = uViewProj * vec4(wp, 1.0);
  }
`;

export const BILLBOARD_FS = `
  precision mediump float;
  varying vec2 vCorner;
  varying vec4 vColor;

  void main() {
    float d = length(vCorner);
    if (d > 1.0) discard;
    float core = exp(-d * d * 4.8);
    float halo = pow(1.0 - d, 2.2) * 0.55;
    float a = (core + halo) * vColor.a;
    vec3 col = mix(vColor.rgb, vec3(1.0, 0.98, 0.92), core * 0.55);
    gl_FragColor = vec4(col, a);
  }
`;

// Wingtip & Missile 3D Additive Ribbon Trail Shader
export const RIBBON_VS = `
  attribute vec3 aPos;
  attribute vec4 aColor;
  uniform mat4 uViewProj;
  varying vec4 vColor;
  void main() {
    vColor = aColor;
    gl_Position = uViewProj * vec4(aPos, 1.0);
  }
`;

export const RIBBON_FS = `
  precision mediump float;
  varying vec4 vColor;
  void main() {
    gl_FragColor = vColor;
  }
`;

// Selective Brightness Extraction for Half-Res FBO Bloom
export const BRIGHT_FS = `
  precision mediump float;
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform float uThreshold;

  void main() {
    vec3 c = texture2D(uTex, vUv).rgb;
    float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
    float peak = max(c.r, max(c.g, c.b));
    float contrib = smoothstep(uThreshold, uThreshold + 0.32, max(luma, peak * 0.92));
    gl_FragColor = vec4(c * contrib, 1.0);
  }
`;

// Separable 9-tap Gaussian Blur for Bloom
export const BLUR_FS = `
  precision mediump float;
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform vec2 uDir; // (1/w, 0) or (0, 1/h)

  void main() {
    vec3 sum = texture2D(uTex, vUv).rgb * 0.227027;
    sum += texture2D(uTex, vUv + uDir * 1.384615).rgb * 0.316216;
    sum += texture2D(uTex, vUv - uDir * 1.384615).rgb * 0.316216;
    sum += texture2D(uTex, vUv + uDir * 3.230769).rgb * 0.070270;
    sum += texture2D(uTex, vUv - uDir * 3.230769).rgb * 0.070270;
    gl_FragColor = vec4(sum, 1.0);
  }
`;

// Final Composite + ACES Filmic Tone Mapping + Warp Chromatic Aberration
export const COMP_FS = `
  precision mediump float;
  varying vec2 vUv;
  uniform sampler2D uScene;
  uniform sampler2D uBloom;
  uniform float uBloomStrength;
  uniform float uChromatic;

  vec3 aces(vec3 x) {
    return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
  }

  void main() {
    vec2 fromCenter = vUv - 0.5;
    vec3 scene;
    if (uChromatic > 0.0005) {
      vec2 off = fromCenter * uChromatic;
      scene.r = texture2D(uScene, vUv + off).r;
      scene.g = texture2D(uScene, vUv).g;
      scene.b = texture2D(uScene, vUv - off).b;
    } else {
      scene = texture2D(uScene, vUv).rgb;
    }

    vec3 bloom = texture2D(uBloom, vUv).rgb * uBloomStrength;
    vec3 hdr = scene + bloom;

    // Gentle ACES filmic tone map preserving vibrant highlights
    vec3 mapped = aces(hdr * 1.06);
    gl_FragColor = vec4(mapped, 1.0);
  }
`;
