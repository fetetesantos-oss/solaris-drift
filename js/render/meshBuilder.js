// Solaris Drift — Procedural 3D Mesh Builder (Flat & Smooth Normals + PBR-lite Material Channels)

import { lerp } from '../math.js';

export class MeshBuilder {
  constructor() {
    // Interleaved layout: px, py, pz, nx, ny, nz, r, g, b, emissive, roughness, metallic (12 floats = 48 bytes)
    this.data = [];
  }

  _pushVert(p, n, col, em, rough, metal) {
    this.data.push(
      p[0], p[1], p[2],
      n[0], n[1], n[2],
      col[0], col[1], col[2],
      em, rough, metal
    );
  }

  addTri(a, b, c, col, em = 0, rough = 0.45, metal = 0.35) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len; ny /= len; nz /= len;
    const n = [nx, ny, nz];
    this._pushVert(a, n, col, em, rough, metal);
    this._pushVert(b, n, col, em, rough, metal);
    this._pushVert(c, n, col, em, rough, metal);
  }

  addTriSmooth(a, na, b, nb, c, nc, col, em = 0, rough = 0.45, metal = 0.35) {
    this._pushVert(a, na, col, em, rough, metal);
    this._pushVert(b, nb, col, em, rough, metal);
    this._pushVert(c, nc, col, em, rough, metal);
  }

  addTriOutward(a, b, c, center, col, em = 0, rough = 0.45, metal = 0.35) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const mx = (a[0] + b[0] + c[0]) / 3 - center[0];
    const my = (a[1] + b[1] + c[1]) / 3 - center[1];
    const mz = (a[2] + b[2] + c[2]) / 3 - center[2];
    if (nx * mx + ny * my + nz * mz < 0) {
      this.addTri(a, c, b, col, em, rough, metal);
    } else {
      this.addTri(a, b, c, col, em, rough, metal);
    }
  }

  addQuad(a, b, c, d, col, em = 0, rough = 0.45, metal = 0.35) {
    this.addTri(a, b, c, col, em, rough, metal);
    this.addTri(a, c, d, col, em, rough, metal);
  }

  addQuadOutward(a, b, c, d, center, col, em = 0, rough = 0.45, metal = 0.35) {
    this.addTriOutward(a, b, c, center, col, em, rough, metal);
    this.addTriOutward(a, c, d, center, col, em, rough, metal);
  }

  addBox(cx, cy, cz, sx, sy, sz, col, em = 0, rough = 0.42, metal = 0.42) {
    const hx = sx * 0.5, hy = sy * 0.5, hz = sz * 0.5;
    const x0 = cx - hx, x1 = cx + hx;
    const y0 = cy - hy, y1 = cy + hy;
    const z0 = cz - hz, z1 = cz + hz;
    const p000 = [x0, y0, z0], p100 = [x1, y0, z0], p110 = [x1, y1, z0], p010 = [x0, y1, z0];
    const p001 = [x0, y0, z1], p101 = [x1, y0, z1], p111 = [x1, y1, z1], p011 = [x0, y1, z1];
    this.addQuad(p001, p101, p111, p011, col, em, rough, metal);
    this.addQuad(p100, p000, p010, p110, col, em, rough, metal);
    this.addQuad(p101, p100, p110, p111, col, em, rough, metal);
    this.addQuad(p000, p001, p011, p010, col, em, rough, metal);
    this.addQuad(p011, p111, p110, p010, col, em, rough, metal);
    this.addQuad(p000, p100, p101, p001, col, em, rough, metal);
  }

  // Tapered fuselage prism between z0 (w0,h0) and z1 (w1,h1) with optional vertical offset
  addTaperBoxZ(cx, y0, z0, w0, h0, y1, z1, w1, h1, col, em = 0, rough = 0.35, metal = 0.5) {
    const hw0 = w0 * 0.5, hh0 = h0 * 0.5;
    const hw1 = w1 * 0.5, hh1 = h1 * 0.5;
    const a0 = [cx - hw0, y0 - hh0, z0], b0 = [cx + hw0, y0 - hh0, z0];
    const c0 = [cx + hw0, y0 + hh0, z0], d0 = [cx - hw0, y0 + hh0, z0];
    const a1 = [cx - hw1, y1 - hh1, z1], b1 = [cx + hw1, y1 - hh1, z1];
    const c1 = [cx + hw1, y1 + hh1, z1], d1 = [cx - hw1, y1 + hh1, z1];
    const mid = [cx, (y0 + y1) * 0.5, (z0 + z1) * 0.5];
    this.addQuadOutward(a0, b0, c0, d0, mid, col, em, rough, metal);
    this.addQuadOutward(b1, a1, d1, c1, mid, col, em, rough, metal);
    this.addQuadOutward(d0, c0, c1, d1, mid, col, em, rough, metal); // top
    this.addQuadOutward(a1, b1, b0, a0, mid, col, em, rough, metal); // bottom
    this.addQuadOutward(b0, b1, c1, c0, mid, col, em, rough, metal); // right
    this.addQuadOutward(a1, a0, d0, d1, mid, col, em, rough, metal); // left
  }

  addConeZ(cx, cy, zBase, zTip, rBase, segs, col, em = 0, rough = 0.35, metal = 0.45) {
    const tip = [cx, cy, zTip];
    const baseCenter = [cx, cy, zBase];
    const mid = [cx, cy, (zBase + zTip) * 0.5];
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2;
      const a1 = ((i + 1) / segs) * Math.PI * 2;
      const p0 = [cx + Math.cos(a0) * rBase, cy + Math.sin(a0) * rBase, zBase];
      const p1 = [cx + Math.cos(a1) * rBase, cy + Math.sin(a1) * rBase, zBase];
      this.addTriOutward(p0, p1, tip, mid, col, em, rough, metal);
      this.addTriOutward(p1, p0, baseCenter, mid, col, em, rough, metal);
    }
  }

  addCylinderZ(cx, cy, z0, z1, r0, r1, segs, col, em = 0, rough = 0.35, metal = 0.55) {
    const mid = [cx, cy, (z0 + z1) * 0.5];
    const c0 = [cx, cy, z0], c1 = [cx, cy, z1];
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2;
      const a1 = ((i + 1) / segs) * Math.PI * 2;
      const ca0 = Math.cos(a0), sa0 = Math.sin(a0);
      const ca1 = Math.cos(a1), sa1 = Math.sin(a1);
      const p00 = [cx + ca0 * r0, cy + sa0 * r0, z0];
      const p10 = [cx + ca1 * r0, cy + sa1 * r0, z0];
      const p11 = [cx + ca1 * r1, cy + sa1 * r1, z1];
      const p01 = [cx + ca0 * r1, cy + sa0 * r1, z1];
      this.addQuadOutward(p00, p10, p11, p01, mid, col, em, rough, metal);
      if (r0 > 0.001) this.addTriOutward(p10, p00, c0, mid, col, em, rough, metal);
      if (r1 > 0.001) this.addTriOutward(p01, p11, c1, mid, col, em, rough, metal);
    }
  }

  addWedgeWing(side, rootX, rootZFront, rootZBack, tipX, tipZFront, tipZBack, yRoot, yTip, thick, col, em = 0, rough = 0.34, metal = 0.45) {
    const rx = side * rootX;
    const tx = side * tipX;
    const ht = thick * 0.5;
    const rft = [rx, yRoot + ht, rootZFront], rfb = [rx, yRoot - ht, rootZFront];
    const rbt = [rx, yRoot + ht, rootZBack],  rbb = [rx, yRoot - ht, rootZBack];
    const tft = [tx, yTip + ht * 0.42, tipZFront], tfb = [tx, yTip - ht * 0.42, tipZFront];
    const tbt = [tx, yTip + ht * 0.42, tipZBack],  tbb = [tx, yTip - ht * 0.42, tipZBack];
    const mid = [(rx + tx) * 0.5, (yRoot + yTip) * 0.5, (rootZFront + rootZBack + tipZFront + tipZBack) * 0.25];
    this.addQuadOutward(rft, tft, tbt, rbt, mid, col, em, rough, metal);
    this.addQuadOutward(rfb, rbb, tbb, tfb, mid, col, em, rough, metal);
    this.addQuadOutward(rft, rfb, tfb, tft, mid, col, em, rough, metal);
    this.addQuadOutward(rbt, tbt, tbb, rbb, mid, col, em, rough, metal);
    this.addQuadOutward(tft, tfb, tbb, tbt, mid, col, em, rough, metal);
  }

  addTorusZ(R, r, segMajor, segMinor, col, em = 0, rough = 0.32, metal = 0.6) {
    for (let i = 0; i < segMajor; i++) {
      const u0 = (i / segMajor) * Math.PI * 2;
      const u1 = ((i + 1) / segMajor) * Math.PI * 2;
      const cu0 = Math.cos(u0), su0 = Math.sin(u0);
      const cu1 = Math.cos(u1), su1 = Math.sin(u1);
      const ringCenter = [Math.cos((u0 + u1) * 0.5) * R, Math.sin((u0 + u1) * 0.5) * R, 0];
      for (let j = 0; j < segMinor; j++) {
        const v0 = (j / segMinor) * Math.PI * 2;
        const v1 = ((j + 1) / segMinor) * Math.PI * 2;
        const pt = (cu, su, v) => {
          const rr = R + r * Math.cos(v);
          return [cu * rr, su * rr, r * Math.sin(v)];
        };
        this.addQuadOutward(pt(cu0, su0, v0), pt(cu1, su1, v0), pt(cu1, su1, v1), pt(cu0, su0, v1), ringCenter, col, em, rough, metal);
      }
    }
  }

  // Flat planetary ring disc (translucent Saturn/orbital style with inner/outer bands)
  addPlanetaryRing(innerR, outerR, segs, colA, colB, em = 0.35) {
    const bands = 4;
    for (let b = 0; b < bands; b++) {
      const t0 = b / bands, t1 = (b + 1) / bands;
      if (b === 2) continue; // Cassini-style gap!
      const r0 = lerp(innerR, outerR, t0);
      const r1 = lerp(innerR, outerR, t1);
      const col = b % 2 === 0 ? colA : colB;
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * Math.PI * 2;
        const a1 = ((i + 1) / segs) * Math.PI * 2;
        const p00 = [Math.cos(a0) * r0, 0, Math.sin(a0) * r0];
        const p10 = [Math.cos(a1) * r0, 0, Math.sin(a1) * r0];
        const p11 = [Math.cos(a1) * r1, 0, Math.sin(a1) * r1];
        const p01 = [Math.cos(a0) * r1, 0, Math.sin(a0) * r1];
        const nUp = [0, 1, 0];
        this.addTriSmooth(p00, nUp, p10, nUp, p11, nUp, col, em, 0.7, 0.1);
        this.addTriSmooth(p00, nUp, p11, nUp, p01, nUp, col, em, 0.7, 0.1);
      }
    }
  }

  addIcosphere(radius, subdivisions, noiseAmp, seed, colA, colB, em = 0, rough = 0.78, metal = 0.15) {
    const t = (1 + Math.sqrt(5)) / 2;
    let verts = [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
    ].map(v => {
      const l = Math.hypot(v[0], v[1], v[2]);
      return [v[0] / l, v[1] / l, v[2] / l];
    });
    let faces = [
      [0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
      [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
      [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
      [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]
    ];
    for (let s = 0; s < subdivisions; s++) {
      const next = [];
      const cache = new Map();
      const mid = (i1, i2) => {
        const key = i1 < i2 ? `${i1}_${i2}` : `${i2}_${i1}`;
        if (cache.has(key)) return cache.get(key);
        const a = verts[i1], b = verts[i2];
        const mx = a[0] + b[0], my = a[1] + b[1], mz = a[2] + b[2];
        const l = Math.hypot(mx, my, mz) || 1;
        const idx = verts.length;
        verts.push([mx / l, my / l, mz / l]);
        cache.set(key, idx);
        return idx;
      };
      for (const [a, b, c] of faces) {
        const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
        next.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
      }
      faces = next;
    }
    const displaced = verts.map(v => {
      const n = Math.sin(v[0] * 4.1 + seed) * Math.cos(v[1] * 3.7 - seed * 0.7) * Math.sin(v[2] * 4.9 + seed * 1.3);
      const n2 = Math.cos((v[0] + v[2]) * 6.2 + seed * 2.1) * 0.45;
      const r = radius * (1 + (n + n2) * noiseAmp);
      return [v[0] * r, v[1] * r, v[2] * r];
    });
    const origin = [0, 0, 0];
    for (let i = 0; i < faces.length; i++) {
      const [a, b, c] = faces[i];
      const mixT = Math.sin(i * 1.7 + seed) * 0.5 + 0.5;
      const col = [
        lerp(colA[0], colB[0], mixT),
        lerp(colA[1], colB[1], mixT),
        lerp(colA[2], colB[2], mixT)
      ];
      this.addTriOutward(displaced[a], displaced[b], displaced[c], origin, col, em, rough, metal);
    }
  }

  upload(gl) {
    const arr = new Float32Array(this.data);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
    return { vbo, count: arr.length / 12 };
  }
}

// Smooth UV-free Sphere (Pos3 + Norm3 = 24 bytes/vert) for Atmospheric Planets & Hex Shields!
export function createSmoothSphere(gl, radius = 1.0, latBands = 24, lonBands = 32) {
  const data = [];
  const pt = (lat, lon) => {
    const theta = (lat / latBands) * Math.PI;
    const phi = (lon / lonBands) * Math.PI * 2;
    const st = Math.sin(theta), ct = Math.cos(theta);
    const sp = Math.sin(phi), cp = Math.cos(phi);
    const nx = st * cp, ny = ct, nz = st * sp;
    return [nx * radius, ny * radius, nz * radius, nx, ny, nz];
  };
  for (let i = 0; i < latBands; i++) {
    for (let j = 0; j < lonBands; j++) {
      const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1);
      data.push(...a, ...b, ...c, ...a, ...c, ...d);
    }
  }
  const arr = new Float32Array(data);
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
  return { vbo, count: arr.length / 6 };
}
