(() => {
  'use strict';

  /* =========================================================================
     1. MATH UTILITIES (Column-major 4x4 Matrices for WebGL)
  ========================================================================= */
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (lo, hi) => lo + Math.random() * (hi - lo);
  const randInt = (lo, hi) => Math.floor(rand(lo, hi + 1));

  const Mat4 = {
    create: () => new Float32Array(16),
    identity(m) {
      m.fill(0);
      m[0] = m[5] = m[10] = m[15] = 1;
      return m;
    },
    perspective(out, fovy, aspect, near, far) {
      const f = 1.0 / Math.tan(fovy * 0.5);
      const nf = 1.0 / (near - far);
      out.fill(0);
      out[0] = f / aspect;
      out[5] = f;
      out[10] = (far + near) * nf;
      out[11] = -1;
      out[14] = 2 * far * near * nf;
      return out;
    },
    lookAt(out, ex, ey, ez, cx, cy, cz, ux, uy, uz) {
      let zx = ex - cx, zy = ey - cy, zz = ez - cz;
      let len = Math.hypot(zx, zy, zz) || 1;
      zx /= len; zy /= len; zz /= len;

      let xx = uy * zz - uz * zy;
      let xy = uz * zx - ux * zz;
      let xz = ux * zy - uy * zx;
      len = Math.hypot(xx, xy, xz) || 1;
      xx /= len; xy /= len; xz /= len;

      const yx = zy * xz - zz * xy;
      const yy = zz * xx - zx * xz;
      const yz = zx * xy - zy * xx;

      out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
      out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
      out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
      out[12] = -(xx * ex + xy * ey + xz * ez);
      out[13] = -(yx * ex + yy * ey + yz * ez);
      out[14] = -(zx * ex + zy * ey + zz * ez);
      out[15] = 1;
      return out;
    },
    multiply(out, a, b) {
      const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
      const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
      const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
      const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

      let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
      out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
      out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
      out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
      out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

      b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
      out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
      out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
      out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
      out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

      b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
      out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
      out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
      out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
      out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

      b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
      out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
      out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
      out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
      out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
      return out;
    },
    // Composes T * Ry * Rx * Rz * S directly (zero allocations)
    compose(out, px, py, pz, rx, ry, rz, sx, sy, sz) {
      const cx = Math.cos(rx), sxr = Math.sin(rx);
      const cy = Math.cos(ry), syr = Math.sin(ry);
      const cz = Math.cos(rz), szr = Math.sin(rz);

      // R = Ry * Rx * Rz
      const r00 = cy * cz + syr * sxr * szr;
      const r10 = cx * szr;
      const r20 = -syr * cz + cy * sxr * szr;

      const r01 = -cy * szr + syr * sxr * cz;
      const r11 = cx * cz;
      const r21 = syr * szr + cy * sxr * cz;

      const r02 = syr * cx;
      const r12 = -sxr;
      const r22 = cy * cx;

      out[0] = r00 * sx; out[1] = r10 * sx; out[2] = r20 * sx; out[3] = 0;
      out[4] = r01 * sy; out[5] = r11 * sy; out[6] = r21 * sy; out[7] = 0;
      out[8] = r02 * sz; out[9] = r12 * sz; out[10] = r22 * sz; out[11] = 0;
      out[12] = px;      out[13] = py;      out[14] = pz;      out[15] = 1;
      return out;
    },
    project(x, y, z, vp, width, height) {
      const cx = vp[0]*x + vp[4]*y + vp[8]*z + vp[12];
      const cy = vp[1]*x + vp[5]*y + vp[9]*z + vp[13];
      const cw = vp[3]*x + vp[7]*y + vp[11]*z + vp[15];
      if (cw <= 0.05) return null;
      const invW = 1 / cw;
      return {
        x: (cx * invW * 0.5 + 0.5) * width,
        y: (0.5 - cy * invW * 0.5) * height,
        w: cw
      };
    }
  };

  /* =========================================================================
     2. PROCEDURAL WEB AUDIO SYNTHESIZER (Zero external assets)
  ========================================================================= */
  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this.noiseBuf = null;
      this.engineGain = null;
      this.engineOsc = null;
      this.engineFilter = null;
    }

    unlock() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        // Create shared white noise buffer
        const sr = this.ctx.sampleRate;
        this.noiseBuf = this.ctx.createBuffer(1, sr * 1.5, sr);
        const data = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        this._initEngineLoop();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    _initEngineLoop() {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const sub = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      sub.type = 'triangle';
      osc.frequency.value = 62;
      sub.frequency.value = 31;
      filter.type = 'lowpass';
      filter.frequency.value = 180;
      gain.gain.value = 0.0;
      osc.connect(filter);
      sub.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      sub.start();
      this.engineOsc = osc;
      this.engineSub = sub;
      this.engineFilter = filter;
      this.engineGain = gain;
    }

    updateEngine(active, boostRatio, speedNorm) {
      if (!this.ctx || !this.engineGain) return;
      const now = this.ctx.currentTime;
      const targetGain = (!active || this.muted) ? 0.0 : (0.028 + boostRatio * 0.032);
      const freq = 58 + speedNorm * 24 + boostRatio * 48;
      this.engineGain.gain.setTargetAtTime(targetGain, now, 0.08);
      this.engineOsc.frequency.setTargetAtTime(freq, now, 0.08);
      this.engineSub.frequency.setTargetAtTime(freq * 0.5, now, 0.08);
      this.engineFilter.frequency.setTargetAtTime(160 + boostRatio * 420 + speedNorm * 110, now, 0.08);
    }

    toggleMute() {
      this.muted = !this.muted;
      if (this.muted && this.engineGain && this.ctx) {
        this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.04);
      }
      return this.muted;
    }

    _ready() {
      return this.ctx && !this.muted && this.ctx.state === 'running';
    }

    laser(triple = false) {
      if (!this._ready()) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = triple ? 'sawtooth' : 'triangle';
      const base = triple ? 980 : 860;
      osc.frequency.setValueAtTime(base + rand(-50, 50), now);
      osc.frequency.exponentialRampToValueAtTime(190, now + 0.09);
      gain.gain.setValueAtTime(triple ? 0.07 : 0.055, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    }

    enemyShot() {
      if (!this._ready()) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.14);
      gain.gain.setValueAtTime(0.032, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    }

    hit() {
      if (!this._ready()) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520 + rand(-40, 40), now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.05);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    }

    explosion(scale = 1) {
      if (!this._ready() || !this.noiseBuf) return;
      const now = this.ctx.currentTime;
      const dur = clamp(0.28 * scale, 0.2, 0.85);

      // Filtered noise burst
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900 / Math.sqrt(scale), now);
      filter.frequency.exponentialRampToValueAtTime(70, now + dur);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(Math.min(0.22, 0.12 * scale), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      src.start(now);
      src.stop(now + dur + 0.02);

      // Sub punch
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(110, now);
      sub.frequency.exponentialRampToValueAtTime(28, now + dur * 0.8);
      subGain.gain.setValueAtTime(Math.min(0.22, 0.13 * scale), now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.85);
      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(now);
      sub.stop(now + dur);
    }

    ring(combo) {
      if (!this._ready()) return;
      const now = this.ctx.currentTime;
      const pitchShift = Math.pow(1.06, Math.min(combo - 1, 10));
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const t = now + idx * 0.045;
        osc.frequency.setValueAtTime(freq * pitchShift, t);
        gain.gain.setValueAtTime(0.075, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.24);
      });
    }

    powerup() {
      if (!this._ready()) return;
      const now = this.ctx.currentTime;
      [440, 554.37, 659.25, 880].forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const t = now + idx * 0.055;
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.26);
      });
    }

    barrelRoll() {
      if (!this._ready() || !this.noiseBuf) return;
      const now = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 3.0;
      bp.frequency.setValueAtTime(280, now);
      bp.frequency.exponentialRampToValueAtTime(1600, now + 0.18);
      bp.frequency.exponentialRampToValueAtTime(320, now + 0.42);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
      src.connect(bp);
      bp.connect(gain);
      gain.connect(this.ctx.destination);
      src.start(now);
      src.stop(now + 0.45);
    }

    graze() {
      if (!this._ready()) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1180, now);
      osc.frequency.exponentialRampToValueAtTime(1640, now + 0.08);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    }

    damage() {
      if (!this._ready()) return;
      this.explosion(1.2);
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(185, now);
      osc.frequency.linearRampToValueAtTime(88, now + 0.28);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    }

    bossWarning() {
      if (!this._ready()) return;
      const now = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        const t = now + i * 0.34;
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.linearRampToValueAtTime(160, t + 0.24);
        gain.gain.setValueAtTime(0.075, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.28);
      }
    }

    uiClick() {
      if (!this._ready()) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(720, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.04);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }

  const audio = new AudioEngine();

  /* =========================================================================
     3. PROCEDURAL 3D MESH BUILDER (Flat-shaded faceted sci-fi geometry)
  ========================================================================= */
  class MeshBuilder {
    constructor() {
      // Interleaved: px, py, pz, nx, ny, nz, r, g, b, emissive (10 floats/vert)
      this.data = [];
    }

    addTri(a, b, c, col, em = 0) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
      const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy;
      let ny = uz * vx - ux * vz;
      let nz = ux * vy - uy * vx;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len; ny /= len; nz /= len;
      const r = col[0], g = col[1], bl = col[2];
      this.data.push(
        a[0], a[1], a[2], nx, ny, nz, r, g, bl, em,
        b[0], b[1], b[2], nx, ny, nz, r, g, bl, em,
        c[0], c[1], c[2], nx, ny, nz, r, g, bl, em
      );
    }

    addTriOutward(a, b, c, center, col, em = 0) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
      const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      const nx = uy * vz - uz * vy;
      const ny = uz * vx - ux * vz;
      const nz = ux * vy - uy * vx;
      const mx = (a[0] + b[0] + c[0]) / 3 - center[0];
      const my = (a[1] + b[1] + c[1]) / 3 - center[1];
      const mz = (a[2] + b[2] + c[2]) / 3 - center[2];
      if (nx * mx + ny * my + nz * mz < 0) {
        this.addTri(a, c, b, col, em);
      } else {
        this.addTri(a, b, c, col, em);
      }
    }

    addQuad(a, b, c, d, col, em = 0) {
      this.addTri(a, b, c, col, em);
      this.addTri(a, c, d, col, em);
    }

    addQuadOutward(a, b, c, d, center, col, em = 0) {
      this.addTriOutward(a, b, c, center, col, em);
      this.addTriOutward(a, c, d, center, col, em);
    }

    addBox(cx, cy, cz, sx, sy, sz, col, em = 0) {
      const hx = sx * 0.5, hy = sy * 0.5, hz = sz * 0.5;
      const x0 = cx - hx, x1 = cx + hx;
      const y0 = cy - hy, y1 = cy + hy;
      const z0 = cz - hz, z1 = cz + hz;
      const p000 = [x0, y0, z0], p100 = [x1, y0, z0], p110 = [x1, y1, z0], p010 = [x0, y1, z0];
      const p001 = [x0, y0, z1], p101 = [x1, y0, z1], p111 = [x1, y1, z1], p011 = [x0, y1, z1];
      this.addQuad(p001, p101, p111, p011, col, em); // +Z
      this.addQuad(p100, p000, p010, p110, col, em); // -Z
      this.addQuad(p101, p100, p110, p111, col, em); // +X
      this.addQuad(p000, p001, p011, p010, col, em); // -X
      this.addQuad(p011, p111, p110, p010, col, em); // +Y
      this.addQuad(p000, p100, p101, p001, col, em); // -Y
    }

    addConeZ(cx, cy, zBase, zTip, rBase, segs, col, em = 0) {
      const tip = [cx, cy, zTip];
      const baseCenter = [cx, cy, zBase];
      const mid = [cx, cy, (zBase + zTip) * 0.5];
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * Math.PI * 2;
        const a1 = ((i + 1) / segs) * Math.PI * 2;
        const p0 = [cx + Math.cos(a0) * rBase, cy + Math.sin(a0) * rBase, zBase];
        const p1 = [cx + Math.cos(a1) * rBase, cy + Math.sin(a1) * rBase, zBase];
        this.addTriOutward(p0, p1, tip, mid, col, em);
        this.addTriOutward(p1, p0, baseCenter, mid, col, em);
      }
    }

    addCylinderZ(cx, cy, z0, z1, r0, r1, segs, col, em = 0) {
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
        this.addQuadOutward(p00, p10, p11, p01, mid, col, em);
        if (r0 > 0.001) this.addTriOutward(p10, p00, c0, mid, col, em);
        if (r1 > 0.001) this.addTriOutward(p01, p11, c1, mid, col, em);
      }
    }

    addWedgeWing(side, rootZFront, rootZBack, tipX, tipZFront, tipZBack, yRoot, yTip, thick, col, em = 0) {
      const s = side; // -1 or +1
      const rx = s * 0.35;
      const tx = s * tipX;
      const ht = thick * 0.5;
      const rft = [rx, yRoot + ht, rootZFront], rfb = [rx, yRoot - ht, rootZFront];
      const rbt = [rx, yRoot + ht, rootZBack],  rbb = [rx, yRoot - ht, rootZBack];
      const tft = [tx, yTip + ht*0.45, tipZFront], tfb = [tx, yTip - ht*0.45, tipZFront];
      const tbt = [tx, yTip + ht*0.45, tipZBack],  tbb = [tx, yTip - ht*0.45, tipZBack];
      const mid = [(rx + tx)*0.5, (yRoot + yTip)*0.5, (rootZFront + rootZBack + tipZFront + tipZBack)*0.25];
      this.addQuadOutward(rft, tft, tbt, rbt, mid, col, em); // top
      this.addQuadOutward(rfb, rbb, tbb, tfb, mid, col, em); // bottom
      this.addQuadOutward(rft, rfb, tfb, tft, mid, col, em); // leading edge
      this.addQuadOutward(rbt, tbt, tbb, rbb, mid, col, em); // trailing edge
      this.addQuadOutward(tft, tfb, tbb, tbt, mid, col, em); // tip
    }

    addTorusZ(R, r, segMajor, segMinor, col, em = 0) {
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
            const cv = Math.cos(v), sv = Math.sin(v);
            const rr = R + r * cv;
            return [cu * rr, su * rr, r * sv];
          };
          const p00 = pt(cu0, su0, v0);
          const p10 = pt(cu1, su1, v0);
          const p11 = pt(cu1, su1, v1);
          const p01 = pt(cu0, su0, v1);
          this.addQuadOutward(p00, p10, p11, p01, ringCenter, col, em);
        }
      }
    }

    addIcosphere(radius, subdivisions, noiseAmp, seed, colA, colB, em = 0) {
      const t = (1 + Math.sqrt(5)) / 2;
      let verts = [
        [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
        [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
        [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
      ].map(v => {
        const l = Math.hypot(v[0], v[1], v[2]);
        return [v[0]/l, v[1]/l, v[2]/l];
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
          verts.push([mx/l, my/l, mz/l]);
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
        const n = Math.sin(v[0]*4.1 + seed) * Math.cos(v[1]*3.7 - seed*0.7) * Math.sin(v[2]*4.9 + seed*1.3);
        const n2 = Math.cos((v[0] + v[2])*6.2 + seed*2.1) * 0.45;
        const r = radius * (1 + (n + n2) * noiseAmp);
        return [v[0]*r, v[1]*r, v[2]*r];
      });
      const origin = [0, 0, 0];
      for (let i = 0; i < faces.length; i++) {
        const [a, b, c] = faces[i];
        const mixT = (Math.sin(i * 1.7 + seed) * 0.5 + 0.5);
        const col = [
          lerp(colA[0], colB[0], mixT),
          lerp(colA[1], colB[1], mixT),
          lerp(colA[2], colB[2], mixT)
        ];
        this.addTriOutward(displaced[a], displaced[b], displaced[c], origin, col, em);
      }
    }

    upload(gl) {
      const arr = new Float32Array(this.data);
      const vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
      return { vbo, count: arr.length / 10 };
    }
  }

  /* =========================================================================
     4. WEBGL 3D ENGINE (Custom Phong + Fresnel + Emissive + Fog + GPU Stars)
  ========================================================================= */
  const MESH_VS = `
    attribute vec3 aPos;
    attribute vec3 aNorm;
    attribute vec3 aColor;
    attribute float aEmissive;

    uniform mat4 uModel;
    uniform mat4 uViewProj;

    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying vec3 vColor;
    varying float vEmissive;

    void main() {
      vec4 worldPos = uModel * vec4(aPos, 1.0);
      vWorldPos = worldPos.xyz;
      vNormal = mat3(uModel) * aNorm;
      vColor = aColor;
      vEmissive = aEmissive;
      gl_Position = uViewProj * worldPos;
    }
  `;

  const MESH_FS = `
    precision mediump float;

    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying vec3 vColor;
    varying float vEmissive;

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

    void main() {
      vec3 N = normalize(vNormal);
      vec3 L = normalize(uLightDir);
      vec3 V = normalize(uCamPos - vWorldPos);
      vec3 H = normalize(L + V);

      float NdotL = max(dot(N, L), 0.0);
      float fill = max(dot(N, normalize(vec3(-L.x, 0.35, -L.z))), 0.0) * 0.24;
      float spec = pow(max(dot(N, H), 0.0), 26.0) * 0.52;
      float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0) * 0.48;

      vec3 lit = vColor * (uAmbientColor + uLightColor * NdotL + uRimColor * fill)
               + uLightColor * spec
               + uRimColor * fresnel;

      vec3 col = mix(lit, vColor * 1.42, vEmissive);
      col = mix(col * uTint, vec3(1.0, 0.97, 0.90), uFlash);

      float dist = length(uCamPos - vWorldPos);
      float fog = clamp((dist - uFogNear) / max(1.0, (uFogFar - uFogNear)), 0.0, 1.0);
      fog = fog * fog * (1.0 - vEmissive * 0.42);
      vec3 finalCol = mix(col, uFogColor, fog);

      gl_FragColor = vec4(finalCol, uAlpha);
    }
  `;

  // GPU-driven 3D Starfield & Warp Streak Shader
  const STAR_VS = `
    attribute vec3 aBasePos;
    attribute float aEnd; // 0 = head, 1 = tail
    attribute vec3 aCol;

    uniform mat4 uViewProj;
    uniform float uTravel;
    uniform float uStreak;

    varying vec3 vCol;
    varying float vFade;

    void main() {
      float depth = 220.0;
      float z = mod(aBasePos.z + uTravel, depth) - depth + 20.0;
      z -= aEnd * uStreak;
      vCol = aCol;
      float distFade = clamp(1.0 - (-z) / 210.0, 0.05, 1.0);
      vFade = distFade * (1.0 - aEnd * 0.78);
      gl_Position = uViewProj * vec4(aBasePos.x, aBasePos.y, z, 1.0);
    }
  `;

  const STAR_FS = `
    precision mediump float;
    varying vec3 vCol;
    varying float vFade;
    void main() {
      gl_FragColor = vec4(vCol * (0.65 + vFade * 0.7), vFade);
    }
  `;

  class Renderer3D {
    constructor(canvas) {
      const gl = canvas.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'high-performance' })
              || canvas.getContext('experimental-webgl', { antialias: true, alpha: false });
      if (!gl) throw new Error('WebGL unavailable');
      this.gl = gl;
      this.canvas = canvas;

      this.meshProg = this._createProgram(MESH_VS, MESH_FS, ['aPos', 'aNorm', 'aColor', 'aEmissive']);
      this.mLoc = {
        aPos: 0,
        aNorm: 1,
        aColor: 2,
        aEmissive: 3,
        uModel: gl.getUniformLocation(this.meshProg, 'uModel'),
        uViewProj: gl.getUniformLocation(this.meshProg, 'uViewProj'),
        uCamPos: gl.getUniformLocation(this.meshProg, 'uCamPos'),
        uLightDir: gl.getUniformLocation(this.meshProg, 'uLightDir'),
        uLightColor: gl.getUniformLocation(this.meshProg, 'uLightColor'),
        uAmbientColor: gl.getUniformLocation(this.meshProg, 'uAmbientColor'),
        uRimColor: gl.getUniformLocation(this.meshProg, 'uRimColor'),
        uFogColor: gl.getUniformLocation(this.meshProg, 'uFogColor'),
        uFogNear: gl.getUniformLocation(this.meshProg, 'uFogNear'),
        uFogFar: gl.getUniformLocation(this.meshProg, 'uFogFar'),
        uTint: gl.getUniformLocation(this.meshProg, 'uTint'),
        uFlash: gl.getUniformLocation(this.meshProg, 'uFlash'),
        uAlpha: gl.getUniformLocation(this.meshProg, 'uAlpha')
      };

      this.starProg = this._createProgram(STAR_VS, STAR_FS, ['aBasePos', 'aEnd', 'aCol']);
      this.sLoc = {
        aBasePos: 0,
        aEnd: 1,
        aCol: 2,
        uViewProj: gl.getUniformLocation(this.starProg, 'uViewProj'),
        uTravel: gl.getUniformLocation(this.starProg, 'uTravel'),
        uStreak: gl.getUniformLocation(this.starProg, 'uStreak')
      };

      this._initStarfield(420);

      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    _compile(type, src) {
      const gl = this.gl;
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(sh));
      }
      return sh;
    }

    _createProgram(vsSrc, fsSrc, attribNames = []) {
      const gl = this.gl;
      const p = gl.createProgram();
      gl.attachShader(p, this._compile(gl.VERTEX_SHADER, vsSrc));
      gl.attachShader(p, this._compile(gl.FRAGMENT_SHADER, fsSrc));
      attribNames.forEach((name, idx) => gl.bindAttribLocation(p, idx, name));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(p));
      }
      return p;
    }

    _initStarfield(count) {
      const gl = this.gl;
      const arr = [];
      for (let i = 0; i < count; i++) {
        // Avoid dead center flight lane so stars frame the horizon
        let x = rand(-75, 75);
        let y = rand(-10, 52);
        if (Math.abs(x) < 12 && y < 10) x += (x < 0 ? -14 : 14);
        const z = rand(0, 220);
        const temp = Math.random();
        const col = temp < 0.25 ? [1.0, 0.88, 0.68] : temp < 0.6 ? [0.78, 0.92, 1.0] : [0.95, 0.97, 1.0];
        arr.push(x, y, z, 0, col[0], col[1], col[2]);
        arr.push(x, y, z, 1, col[0], col[1], col[2]);
      }
      this.starCount = count * 2;
      this.starVbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.starVbo);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);
    }

    resize(w, h, dpr) {
      this.canvas.width = Math.max(1, Math.floor(w * dpr));
      this.canvas.height = Math.max(1, Math.floor(h * dpr));
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    beginFrame(env, camPos, viewProj) {
      const gl = this.gl;
      gl.clearColor(env.fog[0], env.fog[1], env.fog[2], 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.useProgram(this.meshProg);
      gl.uniformMatrix4fv(this.mLoc.uViewProj, false, viewProj);
      gl.uniform3fv(this.mLoc.uCamPos, camPos);
      gl.uniform3fv(this.mLoc.uLightDir, env.lightDir);
      gl.uniform3fv(this.mLoc.uLightColor, env.lightCol);
      gl.uniform3fv(this.mLoc.uAmbientColor, env.ambient);
      gl.uniform3fv(this.mLoc.uRimColor, env.rim);
      gl.uniform3fv(this.mLoc.uFogColor, env.fog);
      gl.uniform1f(this.mLoc.uFogNear, env.fogNear);
      gl.uniform1f(this.mLoc.uFogFar, env.fogFar);

      gl.enableVertexAttribArray(this.mLoc.aPos);
      gl.enableVertexAttribArray(this.mLoc.aNorm);
      gl.enableVertexAttribArray(this.mLoc.aColor);
      gl.enableVertexAttribArray(this.mLoc.aEmissive);
    }

    setFogRange(near, far) {
      this.gl.uniform1f(this.mLoc.uFogNear, near);
      this.gl.uniform1f(this.mLoc.uFogFar, far);
    }

    drawMesh(mesh, modelMat, tint = [1, 1, 1], flash = 0, alpha = 1) {
      const gl = this.gl;
      const loc = this.mLoc;
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
      const stride = 40;
      gl.vertexAttribPointer(loc.aPos, 3, gl.FLOAT, false, stride, 0);
      gl.vertexAttribPointer(loc.aNorm, 3, gl.FLOAT, false, stride, 12);
      gl.vertexAttribPointer(loc.aColor, 3, gl.FLOAT, false, stride, 24);
      gl.vertexAttribPointer(loc.aEmissive, 1, gl.FLOAT, false, stride, 36);

      gl.uniformMatrix4fv(loc.uModel, false, modelMat);
      gl.uniform3fv(loc.uTint, tint);
      gl.uniform1f(loc.uFlash, flash);
      gl.uniform1f(loc.uAlpha, alpha);
      gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
    }

    drawStars(viewProj, travel, streak) {
      const gl = this.gl;
      const s = this.sLoc;
      gl.depthMask(false);
      gl.disableVertexAttribArray(this.mLoc.aEmissive);
      gl.useProgram(this.starProg);
      gl.uniformMatrix4fv(s.uViewProj, false, viewProj);
      gl.uniform1f(s.uTravel, travel);
      gl.uniform1f(s.uStreak, streak);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.starVbo);
      const stride = 28;
      gl.enableVertexAttribArray(s.aBasePos);
      gl.enableVertexAttribArray(s.aEnd);
      gl.enableVertexAttribArray(s.aCol);
      gl.vertexAttribPointer(s.aBasePos, 3, gl.FLOAT, false, stride, 0);
      gl.vertexAttribPointer(s.aEnd, 1, gl.FLOAT, false, stride, 12);
      gl.vertexAttribPointer(s.aCol, 3, gl.FLOAT, false, stride, 16);
      gl.drawArrays(gl.LINES, 0, this.starCount);
      gl.depthMask(true);

      // Restore mesh program & all 4 mesh attributes
      gl.useProgram(this.meshProg);
      gl.enableVertexAttribArray(this.mLoc.aEmissive);
    }
  }

  /* =========================================================================
     5. 3D MODELS LIBRARY & SHIP DEFINITIONS
  ========================================================================= */
  const SHIPS = [
    {
      id: 'valkyrie',
      name: 'Valkyrie Mk.IV',
      role: 'Equilibrada',
      desc: 'Caça tático versátil com ótimo balanço entre velocidade, escudo e cadência.',
      speed: 17.5,
      maxShield: 4,
      fireRate: 0.145,
      damage: 1.0,
      boostDrain: 0.34,
      stats: { vel: 80, esc: 80, cad: 80 },
      accent: '#f59e0b'
    },
    {
      id: 'interceptor',
      name: 'Interceptor S-9',
      role: 'Velocidade',
      desc: 'Ultra-ágil com cadência elevada e turbo eficiente, porém blindagem mais leve.',
      speed: 21.5,
      maxShield: 3,
      fireRate: 0.11,
      damage: 0.9,
      boostDrain: 0.25,
      stats: { vel: 98, esc: 60, cad: 96 },
      accent: '#38bdf8'
    },
    {
      id: 'bastion',
      name: 'Bastion Heavy',
      role: 'Blindada',
      desc: 'Escudo reforçado e canhões de alto impacto para dominar batalhas contra chefões.',
      speed: 15.0,
      maxShield: 5,
      fireRate: 0.175,
      damage: 1.4,
      boostDrain: 0.40,
      stats: { vel: 66, esc: 100, cad: 72 },
      accent: '#eab308'
    }
  ];

  function buildModels(gl) {
    const M = {};

    // --- PLAYER SHIP 1: VALKYRIE MK.IV ---
    {
      const b = new MeshBuilder();
      const hull = [0.86, 0.90, 0.94];
      const dark = [0.22, 0.28, 0.36];
      const trim = [0.96, 0.62, 0.08];
      const glass = [0.16, 0.72, 0.92];
      const glow = [0.35, 0.88, 1.0];
      // Nose & main fuselage
      b.addConeZ(0, 0, -0.5, -2.55, 0.48, 6, hull, 0);
      b.addBox(0, 0, 0.45, 0.92, 0.52, 1.9, hull, 0);
      b.addBox(0, 0.28, -0.15, 0.46, 0.30, 1.15, glass, 0.22); // cockpit
      b.addBox(0, 0.04, 1.25, 0.76, 0.38, 0.55, dark, 0);
      // Swept delta wings
      b.addWedgeWing(1, -0.35, 1.05, 2.35, 0.65, 1.25, -0.04, -0.18, 0.16, hull, 0);
      b.addWedgeWing(-1, -0.35, 1.05, 2.35, 0.65, 1.25, -0.04, -0.18, 0.16, hull, 0);
      // Amber wing stripes & cannon pods
      b.addBox(1.35, 0.02, 0.55, 0.52, 0.10, 0.9, trim, 0.1);
      b.addBox(-1.35, 0.02, 0.55, 0.52, 0.10, 0.9, trim, 0.1);
      b.addCylinderZ(1.95, -0.12, -0.45, 0.95, 0.08, 0.09, 6, dark, 0);
      b.addCylinderZ(-1.95, -0.12, -0.45, 0.95, 0.08, 0.09, 6, dark, 0);
      // Twin angled stabilizers
      b.addBox(0.55, 0.46, 0.95, 0.10, 0.68, 0.82, trim, 0);
      b.addBox(-0.55, 0.46, 0.95, 0.10, 0.68, 0.82, trim, 0);
      // Engine nacelles & thruster rings
      b.addCylinderZ(0.32, -0.02, 1.25, 1.62, 0.20, 0.17, 8, dark, 0);
      b.addCylinderZ(-0.32, -0.02, 1.25, 1.62, 0.20, 0.17, 8, dark, 0);
      b.addCylinderZ(0.32, -0.02, 1.56, 1.66, 0.14, 0.12, 8, glow, 1.0);
      b.addCylinderZ(-0.32, -0.02, 1.56, 1.66, 0.14, 0.12, 8, glow, 1.0);
      M.ship_valkyrie = b.upload(gl);
    }

    // --- PLAYER SHIP 2: INTERCEPTOR S-9 ---
    {
      const b = new MeshBuilder();
      const hull = [0.92, 0.96, 1.0];
      const cyan = [0.18, 0.78, 0.96];
      const dark = [0.16, 0.24, 0.34];
      const glow = [0.45, 0.95, 1.0];
      b.addConeZ(0, 0, -0.2, -2.95, 0.38, 6, hull, 0);
      b.addBox(0, -0.02, 0.55, 0.66, 0.40, 1.85, hull, 0);
      b.addBox(0, 0.24, -0.25, 0.38, 0.24, 1.2, [0.08, 0.35, 0.52], 0.2);
      // Forward-swept razor wings
      b.addWedgeWing(1, 0.15, 1.15, 2.45, -0.75, -0.15, 0.0, 0.08, 0.12, hull, 0);
      b.addWedgeWing(-1, 0.15, 1.15, 2.45, -0.75, -0.15, 0.0, 0.08, 0.12, hull, 0);
      b.addBox(1.5, 0.08, -0.05, 0.35, 0.09, 0.85, cyan, 0.25);
      b.addBox(-1.5, 0.08, -0.05, 0.35, 0.09, 0.85, cyan, 0.25);
      // Central dorsal fin
      b.addBox(0, 0.48, 0.85, 0.09, 0.72, 1.05, cyan, 0.1);
      // Central oversized ion engine
      b.addCylinderZ(0, 0, 1.25, 1.72, 0.30, 0.24, 10, dark, 0);
      b.addCylinderZ(0, 0, 1.65, 1.76, 0.22, 0.18, 10, glow, 1.0);
      M.ship_interceptor = b.upload(gl);
    }

    // --- PLAYER SHIP 3: BASTION HEAVY ---
    {
      const b = new MeshBuilder();
      const hull = [0.76, 0.80, 0.84];
      const gold = [0.92, 0.68, 0.16];
      const dark = [0.20, 0.24, 0.30];
      const glow = [1.0, 0.72, 0.22];
      // Twin armored pontoons + central cockpit core
      b.addBox(0, 0.08, 0.2, 1.25, 0.56, 2.0, hull, 0);
      b.addConeZ(0, 0.06, -0.8, -2.05, 0.56, 4, gold, 0);
      b.addBox(0, 0.42, -0.1, 0.62, 0.26, 1.0, [0.16, 0.68, 0.88], 0.22);
      // Heavy twin hulls
      b.addBox(1.18, -0.04, 0.05, 0.68, 0.52, 2.35, dark, 0);
      b.addBox(-1.18, -0.04, 0.05, 0.68, 0.52, 2.35, dark, 0);
      b.addBox(1.18, 0.25, 0.15, 0.52, 0.12, 1.65, gold, 0.1);
      b.addBox(-1.18, 0.25, 0.15, 0.52, 0.12, 1.65, gold, 0.1);
      // Heavy cannons
      b.addCylinderZ(1.18, -0.04, -1.85, -0.95, 0.14, 0.16, 8, hull, 0);
      b.addCylinderZ(-1.18, -0.04, -1.85, -0.95, 0.14, 0.16, 8, hull, 0);
      // Stubby armored winglets
      b.addWedgeWing(1, 0.0, 1.1, 2.25, 0.45, 1.15, -0.05, -0.22, 0.22, hull, 0);
      b.addWedgeWing(-1, 0.0, 1.1, 2.25, 0.45, 1.15, -0.05, -0.22, 0.22, hull, 0);
      // Broad thrusters
      b.addBox(1.18, -0.04, 1.28, 0.48, 0.34, 0.18, glow, 1.0);
      b.addBox(-1.18, -0.04, 1.28, 0.48, 0.34, 0.18, glow, 1.0);
      b.addBox(0, 0.02, 1.25, 0.58, 0.30, 0.18, glow, 1.0);
      M.ship_bastion = b.upload(gl);
    }

    // --- THRUSTER FLAME CONE ---
    {
      const b = new MeshBuilder();
      b.addConeZ(0, 0, 0, 1.35, 0.19, 8, [1.0, 1.0, 1.0], 1.0);
      M.flame = b.upload(gl);
    }

    // --- ENEMY 1: VIPER DRONE (Fast Crimson/Obsidian Interceptor) ---
    {
      const b = new MeshBuilder();
      const dark = [0.22, 0.24, 0.30];
      const red = [0.88, 0.20, 0.22];
      const eye = [1.0, 0.42, 0.18];
      b.addConeZ(0, 0, -0.35, 1.95, 0.48, 6, dark, 0); // faces +Z (toward player)
      b.addBox(0, 0, -0.6, 0.95, 0.50, 1.15, dark, 0);
      b.addBox(0, 0.12, 0.42, 0.48, 0.22, 0.45, eye, 1.0); // sensor eye
      // Aggressive forward fangs
      b.addWedgeWing(1, -0.9, 0.2, 2.15, 0.75, 1.35, 0, -0.28, 0.18, red, 0);
      b.addWedgeWing(-1, -0.9, 0.2, 2.15, 0.75, 1.35, 0, -0.28, 0.18, red, 0);
      b.addBox(0, 0.48, -0.75, 0.14, 0.65, 0.75, red, 0);
      M.enemy_viper = b.upload(gl);
    }

    // --- ENEMY 2: MANTIS HEAVY STRIKER ---
    {
      const b = new MeshBuilder();
      const armor = [0.30, 0.32, 0.38];
      const crimson = [0.92, 0.26, 0.18];
      const core = [1.0, 0.65, 0.15];
      b.addBox(0, 0, 0, 1.8, 0.85, 1.9, armor, 0);
      b.addBox(0, 0.1, 0.95, 0.95, 0.38, 0.32, core, 1.0);
      b.addBox(1.55, 0, 0.25, 0.75, 1.35, 1.65, crimson, 0);
      b.addBox(-1.55, 0, 0.25, 0.75, 1.35, 1.65, crimson, 0);
      b.addCylinderZ(1.55, -0.35, 0.85, 1.85, 0.16, 0.14, 6, armor, 0);
      b.addCylinderZ(-1.55, -0.35, 0.85, 1.85, 0.16, 0.14, 6, armor, 0);
      M.enemy_mantis = b.upload(gl);
    }

    // --- BOSS: LEVIATHAN DREADNOUGHT HULL ---
    {
      const b = new MeshBuilder();
      const steel = [0.28, 0.33, 0.40];
      const plate = [0.18, 0.22, 0.28];
      const trim = [0.85, 0.24, 0.18];
      // Main hull body
      b.addBox(0, 0, 0, 8.8, 2.2, 5.2, plate, 0);
      b.addBox(0, 1.5, -0.8, 4.0, 1.5, 3.2, steel, 0); // command bridge
      b.addBox(0, 1.65, 0.85, 2.8, 0.35, 0.3, [1.0, 0.55, 0.15], 1.0); // bridge visor
      // Wide wing decks
      b.addBox(7.2, -0.2, 0.3, 6.2, 1.3, 3.8, steel, 0);
      b.addBox(-7.2, -0.2, 0.3, 6.2, 1.3, 3.8, steel, 0);
      b.addBox(7.2, 0.55, 0.5, 4.8, 0.25, 2.6, trim, 0);
      b.addBox(-7.2, 0.55, 0.5, 4.8, 0.25, 2.6, trim, 0);
      // Forward prow mandibles
      b.addBox(3.4, -0.3, 3.6, 1.7, 1.2, 3.0, steel, 0);
      b.addBox(-3.4, -0.3, 3.6, 1.7, 1.2, 3.0, steel, 0);
      M.boss_hull = b.upload(gl);
    }

    // --- BOSS WEAKPOINT CORE ---
    {
      const b = new MeshBuilder();
      b.addIcosphere(1.15, 1, 0.08, 2.0, [1.0, 0.42, 0.12], [1.0, 0.78, 0.20], 0.95);
      M.boss_core = b.upload(gl);
    }

    // --- ASTEROIDS (3 procedural faceted rock variants) ---
    M.asteroids = [];
    for (let i = 0; i < 3; i++) {
      const b = new MeshBuilder();
      b.addIcosphere(1.0, 1, 0.24, 1.7 + i * 3.1, [0.42, 0.37, 0.34], [0.27, 0.25, 0.26], 0);
      M.asteroids.push(b.upload(gl));
    }

    // --- ENERGY GATE RING ---
    {
      const b = new MeshBuilder();
      b.addTorusZ(2.85, 0.26, 10, 6, [0.98, 0.72, 0.16], 0.85);
      // Outer metallic frame accents
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
        b.addBox(Math.cos(a) * 3.15, Math.sin(a) * 3.15, 0, 0.52, 0.52, 0.65, [0.35, 0.44, 0.54], 0);
      }
      M.ring = b.upload(gl);
    }

    // --- POWERUP CRYSTALS (Shield, Triple, Nova) ---
    const makePowerup = (col, haloCol) => {
      const b = new MeshBuilder();
      b.addConeZ(0, 0, 0, 0.95, 0.65, 4, col, 0.95);
      b.addConeZ(0, 0, 0, -0.95, 0.65, 4, col, 0.95);
      b.addTorusZ(1.05, 0.09, 10, 5, haloCol, 0.9);
      return b.upload(gl);
    };
    M.pu_shield = makePowerup([0.22, 0.82, 1.0], [0.75, 0.96, 1.0]);
    M.pu_triple = makePowerup([1.0, 0.68, 0.12], [1.0, 0.90, 0.55]);
    M.pu_nova   = makePowerup([0.28, 0.95, 0.62], [0.85, 1.0, 0.90]);

    // --- LASER BOLTS & ENEMY PLASMA ---
    {
      const b = new MeshBuilder();
      b.addBox(0, 0, 0, 0.18, 0.18, 2.4, [0.45, 0.92, 1.0], 1.0);
      M.laser_cyan = b.upload(gl);
    }
    {
      const b = new MeshBuilder();
      b.addBox(0, 0, 0, 0.24, 0.24, 2.7, [1.0, 0.78, 0.22], 1.0);
      M.laser_amber = b.upload(gl);
    }
    {
      const b = new MeshBuilder();
      b.addIcosphere(0.42, 0, 0.0, 1.0, [1.0, 0.28, 0.18], [1.0, 0.62, 0.22], 1.0);
      M.enemy_orb = b.upload(gl);
    }

    // --- TRENCH FLOOR & SIDE WALLS & ARCHES ---
    {
      const b = new MeshBuilder();
      // Main floor slab (width 34, depth 10)
      b.addBox(0, 0, 0, 34, 0.8, 10.0, [0.16, 0.22, 0.30], 0);
      // Raised side trench shoulders
      b.addBox(-13.8, 1.1, 0, 6.4, 1.8, 10.0, [0.22, 0.29, 0.38], 0);
      b.addBox(13.8, 1.1, 0, 6.4, 1.8, 10.0, [0.22, 0.29, 0.38], 0);
      // Center runway emissive guide strip
      b.addBox(0, 0.46, 0, 0.55, 0.10, 4.4, [0.95, 0.66, 0.18], 0.85);
      // Side lane strips
      b.addBox(-9.5, 0.46, 0, 0.24, 0.10, 9.6, [0.22, 0.72, 0.92], 0.65);
      b.addBox(9.5, 0.46, 0, 0.24, 0.10, 9.6, [0.22, 0.72, 0.92], 0.65);
      // Transverse deck ribs
      b.addBox(0, 0.44, -4.6, 20.5, 0.16, 0.65, [0.26, 0.34, 0.44], 0);
      M.trench_deck = b.upload(gl);
    }
    {
      // Tall monolith tower for trench walls & obstacles
      const b = new MeshBuilder();
      b.addBox(0, 0, 0, 1.0, 1.0, 1.0, [0.24, 0.31, 0.40], 0);
      b.addBox(0, 0.42, 0.51, 0.72, 0.08, 0.04, [0.98, 0.68, 0.18], 0.95);
      M.pillar = b.upload(gl);
    }
    {
      // Hazard Energy Pylon (Destructible / Dodgeable obstacle in corridor)
      const b = new MeshBuilder();
      b.addBox(0, 0, 0, 1.65, 1.0, 1.65, [0.26, 0.30, 0.38], 0);
      b.addBox(0, 0, 0.84, 0.42, 0.92, 0.08, [0.96, 0.28, 0.20], 0.95);
      b.addBox(0, 0, -0.84, 0.42, 0.92, 0.08, [0.96, 0.28, 0.20], 0.95);
      M.hazard_pillar = b.upload(gl);
    }
    {
      // Giant Overhead Orbital Arch (high above camera & ship ceiling)
      const b = new MeshBuilder();
      const col = [0.22, 0.29, 0.38];
      b.addBox(-15.0, 10.5, 0, 2.4, 21.0, 2.2, col, 0);
      b.addBox(15.0, 10.5, 0, 2.4, 21.0, 2.2, col, 0);
      b.addBox(0, 20.5, 0, 32.4, 1.9, 2.4, col, 0);
      // Under-arch beacon lights
      b.addBox(-7.5, 19.4, 0, 3.6, 0.32, 0.6, [0.35, 0.85, 1.0], 0.9);
      b.addBox(7.5, 19.4, 0, 3.6, 0.32, 0.6, [0.35, 0.85, 1.0], 0.9);
      b.addBox(0, 19.4, 0, 3.4, 0.32, 0.6, [0.98, 0.68, 0.18], 0.9);
      M.arch = b.upload(gl);
    }

    // --- HORIZON SCENERY (Distant Planet + Ring + Sun) ---
    {
      const b = new MeshBuilder();
      b.addIcosphere(1.0, 2, 0.02, 0.5, [0.24, 0.46, 0.66], [0.16, 0.30, 0.46], 0.12);
      M.planet = b.upload(gl);
    }
    {
      const b = new MeshBuilder();
      b.addTorusZ(1.75, 0.18, 24, 4, [0.85, 0.72, 0.52], 0.35);
      M.planet_ring = b.upload(gl);
    }
    {
      const b = new MeshBuilder();
      b.addIcosphere(1.0, 1, 0.0, 1.0, [1.0, 0.86, 0.58], [1.0, 0.68, 0.28], 1.0);
      M.sun = b.upload(gl);
    }

    // --- PARTICLES & SHOCKWAVE ---
    {
      const b = new MeshBuilder();
      b.addIcosphere(0.5, 0, 0.15, 4.2, [1.0, 0.82, 0.35], [1.0, 0.42, 0.14], 0.92);
      M.shard = b.upload(gl);
    }
    {
      const b = new MeshBuilder();
      b.addTorusZ(1.0, 0.08, 16, 4, [1.0, 0.82, 0.35], 1.0);
      M.shockwave = b.upload(gl);
    }

    return M;
  }

  /* =========================================================================
     6. SECTOR PALETTES (No purple — distinct Solar, Arctic & Volcanic vibes)
  ========================================================================= */
  const SECTORS = [
    {
      name: 'Órbita Solaris',
      fog: [0.035, 0.075, 0.125],
      lightDir: [0.45, 0.78, 0.42],
      lightCol: [1.0, 0.85, 0.62],
      ambient: [0.24, 0.32, 0.44],
      rim: [0.22, 0.76, 0.98],
      planetTint: [0.85, 0.92, 1.0],
      sunTint: [1.0, 0.86, 0.55]
    },
    {
      name: 'Cânion Criogênico',
      fog: [0.025, 0.090, 0.125],
      lightDir: [-0.4, 0.85, 0.35],
      lightCol: [0.86, 0.96, 1.0],
      ambient: [0.22, 0.38, 0.48],
      rim: [0.18, 0.88, 0.78],
      planetTint: [0.72, 1.0, 0.96],
      sunTint: [0.82, 0.96, 1.0]
    },
    {
      name: 'Fenda de Ignição',
      fog: [0.105, 0.048, 0.035],
      lightDir: [0.32, 0.72, 0.52],
      lightCol: [1.0, 0.72, 0.40],
      ambient: [0.36, 0.22, 0.18],
      rim: [1.0, 0.44, 0.22],
      planetTint: [1.0, 0.66, 0.45],
      sunTint: [1.0, 0.58, 0.22]
    }
  ];

  /* =========================================================================
     7. GAME STATE, STORAGE & UI REFERENCES
  ========================================================================= */
  const glCanvas = document.getElementById('gl-canvas');
  const hudCanvas = document.getElementById('hud-canvas');
  const hudCtx = hudCanvas.getContext('2d');

  let renderer, models;
  try {
    renderer = new Renderer3D(glCanvas);
    models = buildModels(renderer.gl);
  } catch (e) {
    document.getElementById('webgl-error').classList.remove('hidden');
    console.error(e);
    return;
  }

  const STORAGE_KEY = 'solaris_drift_3d_v1';
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  })();

  const ui = {
    hudLayer: document.getElementById('hud-layer'),
    score: document.getElementById('hud-score'),
    best: document.getElementById('hud-best'),
    combo: document.getElementById('hud-combo'),
    sector: document.getElementById('hud-sector'),
    sectorName: document.getElementById('hud-sector-name'),
    speed: document.getElementById('hud-speed'),
    sectorBar: document.getElementById('hud-sector-bar'),
    sectorProgressWrap: document.getElementById('sector-progress-wrap'),
    bossBarWrap: document.getElementById('boss-bar-wrap'),
    bossName: document.getElementById('boss-name'),
    bossCoresLeft: document.getElementById('boss-cores-left'),
    bossHpBar: document.getElementById('boss-hp-bar'),
    shieldText: document.getElementById('hud-shield-text'),
    shieldPips: document.getElementById('hud-shield-pips'),
    boostBar: document.getElementById('hud-boost-bar'),
    rollBar: document.getElementById('hud-roll-bar'),
    rollStatus: document.getElementById('hud-roll-status'),
    powerupRow: document.getElementById('hud-powerup-row'),
    powerupLabel: document.getElementById('hud-powerup-label'),
    powerupTime: document.getElementById('hud-powerup-time'),
    powerupBar: document.getElementById('hud-powerup-bar'),
    banner: document.getElementById('event-banner'),
    bannerSub: document.getElementById('banner-sub'),
    bannerTitle: document.getElementById('banner-title'),
    screenTitle: document.getElementById('screen-title'),
    screenPause: document.getElementById('screen-pause'),
    screenGameOver: document.getElementById('screen-gameover'),
    shipSelector: document.getElementById('ship-selector'),
    titleRecord: document.getElementById('title-record'),
    titleRecordVal: document.getElementById('title-record-val'),
    titleSectorVal: document.getElementById('title-sector-val'),
    btnStart: document.getElementById('btn-start'),
    btnMouseMode: document.getElementById('btn-mouse-mode'),
    btnAutofire: document.getElementById('btn-autofire'),
    btnMute: document.getElementById('btn-mute'),
    btnPause: document.getElementById('btn-pause'),
    btnResume: document.getElementById('btn-resume'),
    btnPauseMouse: document.getElementById('btn-pause-mouse'),
    btnPauseAutofire: document.getElementById('btn-pause-autofire'),
    btnRestartPause: document.getElementById('btn-restart-pause'),
    btnMenuPause: document.getElementById('btn-menu-pause'),
    btnRetry: document.getElementById('btn-retry'),
    btnGoMenu: document.getElementById('btn-go-menu'),
    touchRoll: document.getElementById('touch-roll'),
    touchBoost: document.getElementById('touch-boost'),
    goScore: document.getElementById('go-score'),
    goNewRecord: document.getElementById('go-new-record'),
    goSector: document.getElementById('go-sector'),
    goKills: document.getElementById('go-kills'),
    goRings: document.getElementById('go-rings'),
    goMaxCombo: document.getElementById('go-maxcombo')
  };

  const state = {
    mode: 'title', // 'title' | 'playing' | 'paused' | 'gameover'
    selectedShipIdx: saved.shipIdx ?? 0,
    bestScore: saved.bestScore ?? 0,
    bestSector: saved.bestSector ?? 1,
    autoFire: false,
    mouseSteer: false,

    time: 0,
    travel: 0,
    score: 0,
    combo: 1,
    comboTimer: 0,
    maxCombo: 1,
    kills: 0,
    ringsCollected: 0,
    ringStreak: 0,
    sector: 1,
    sectorProgress: 0, // 0..1 before boss spawns
    baseSpeed: 54,
    speed: 54,

    bannerTimer: 0,
    shake: 0,
    damageVignette: 0,
    boostBlend: 0,

    player: {
      x: 0, y: 0.4, vx: 0, vy: 0,
      roll: 0, pitch: 0,
      shield: 4, maxShield: 4,
      invuln: 0,
      boost: 1.0, boosting: false,
      fireCd: 0,
      barrelTimer: 0, barrelDir: 1, barrelCd: 0,
      tripleTimer: 0,
      muzzleFlash: 0
    },

    boss: null,
    trench: [],
    asteroids: [],
    enemies: [],
    pillars: [],
    rings: [],
    powerups: [],
    lasers: [],
    enemyShots: [],
    particles: [],
    shockwaves: [],
    popups: [],

    spawnTimers: { ast: 0.8, enemy: 2.2, ring: 3.4, pillar: 4.5 },

    // Active interpolated lighting/fog
    env: {
      fog: [...SECTORS[0].fog],
      lightDir: [...SECTORS[0].lightDir],
      lightCol: [...SECTORS[0].lightCol],
      ambient: [...SECTORS[0].ambient],
      rim: [...SECTORS[0].rim],
      planetTint: [...SECTORS[0].planetTint],
      sunTint: [...SECTORS[0].sunTint],
      fogNear: 36,
      fogFar: 185
    }
  };

  // Build ship selector UI cards
  function renderShipCards() {
    ui.shipSelector.innerHTML = '';
    SHIPS.forEach((s, idx) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = `ship-card ${idx === state.selectedShipIdx ? 'selected' : ''}`;
      el.innerHTML = `
        <div class="ship-card-head">
          <span class="ship-name">${s.name}</span>
          <span class="ship-role">${s.role}</span>
        </div>
        <p class="ship-desc">${s.desc}</p>
        <div class="ship-stats">
          <div class="stat-row">
            <span>Veloc.</span>
            <div class="track track-sm">
              <div class="fill" style="width:${s.stats.vel}%; background:${s.accent}"></div>
            </div>
          </div>
          <div class="stat-row">
            <span>Escudo</span>
            <div class="track track-sm">
              <div class="fill fill-sky" style="width:${s.stats.esc}%"></div>
            </div>
          </div>
          <div class="stat-row">
            <span>Fogo</span>
            <div class="track track-sm">
              <div class="fill fill-amber" style="width:${s.stats.cad}%"></div>
            </div>
          </div>
        </div>
      `;
      el.addEventListener('click', () => {
        audio.unlock();
        audio.uiClick();
        state.selectedShipIdx = idx;
        saveProgress();
        renderShipCards();
      });
      ui.shipSelector.appendChild(el);
    });
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        shipIdx: state.selectedShipIdx,
        bestScore: state.bestScore,
        bestSector: state.bestSector
      }));
    } catch {}
  }

  function refreshRecordDisplay() {
    ui.best.textContent = state.bestScore.toLocaleString('pt-BR');
    if (state.bestScore > 0) {
      ui.titleRecord.classList.remove('hidden');
      ui.titleRecordVal.textContent = state.bestScore.toLocaleString('pt-BR');
      ui.titleSectorVal.textContent = state.bestSector;
    }
  }

  function showBanner(sub, title, duration = 2.6) {
    ui.bannerSub.textContent = sub;
    ui.bannerTitle.textContent = title;
    ui.banner.classList.remove('banner-hidden');
    ui.banner.classList.add('banner-visible');
    state.bannerTimer = duration;
  }

  function syncToggleButtons() {
    const mText = state.mouseSteer ? 'ON' : 'OFF';
    ui.btnMouseMode.textContent = `Mouse Livre: ${mText}`;
    ui.btnMouseMode.classList.toggle('active-toggle', state.mouseSteer);
    ui.btnPauseMouse.textContent = `Pilotar com Mouse Livre: ${mText}`;
    ui.btnPauseMouse.classList.toggle('active-toggle', state.mouseSteer);

    const aText = state.autoFire ? 'ON' : 'OFF';
    ui.btnAutofire.textContent = `Auto-Tiro: ${aText}`;
    ui.btnAutofire.classList.toggle('active-toggle', state.autoFire);
    ui.btnPauseAutofire.textContent = `Tiro Automático: ${aText}`;
    ui.btnPauseAutofire.classList.toggle('active-toggle', state.autoFire);

    ui.btnMute.textContent = audio.muted ? 'Som: OFF' : 'Som: ON';
  }

  /* =========================================================================
     8. INPUT SYSTEM (Keyboard + Mouse Hybrid + Touch Drag)
  ========================================================================= */
  const keys = new Set();
  const pointer = {
    down: false,
    activeDrag: false,
    normX: 0, // -1..1
    normY: 0, // -1..1
    touchBoost: false
  };
  let lastTapDir = 0, lastTapTime = 0;

  function triggerBarrelRoll(dir) {
    const p = state.player;
    if (state.mode !== 'playing') return;
    if (p.barrelTimer > 0 || p.barrelCd > 0) return;
    p.barrelTimer = 0.52;
    p.barrelDir = dir || (p.vx < -0.5 ? -1 : 1);
    p.barrelCd = 2.6;
    p.vx += p.barrelDir * 14;
    audio.barrelRoll();
    addPopup(p.x, p.y + 1.1, 0, 'MANOBRA 360°', '#34d399');
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
      if (state.mode === 'playing') pauseGame();
      else if (state.mode === 'paused') resumeGame();
      return;
    }
    if (code === 'KeyM') {
      audio.toggleMute();
      syncToggleButtons();
      return;
    }
    if (code === 'KeyF') {
      state.autoFire = !state.autoFire;
      syncToggleButtons();
      return;
    }

    if (state.mode === 'playing') {
      if (code === 'KeyE' || code === 'KeyQ') {
        triggerBarrelRoll(code === 'KeyQ' ? -1 : 1);
      }
      // Double-tap A/D or Left/Right for Barrel Roll
      if (!e.repeat && (code === 'KeyA' || code === 'ArrowLeft' || code === 'KeyD' || code === 'ArrowRight')) {
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
    if (state.mode === 'playing') pauseGame();
  });

  function updatePointerNorm(clientX, clientY) {
    const rect = glCanvas.getBoundingClientRect();
    pointer.normX = clamp(((clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    pointer.normY = clamp(1 - ((clientY - rect.top) / rect.height) * 2, -1, 1);
  }

  glCanvas.addEventListener('pointerdown', (e) => {
    audio.unlock();
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
    if (state.mode !== 'playing') return;
    if (pointer.activeDrag || state.mouseSteer) {
      updatePointerNorm(e.clientX, e.clientY);
    }
  });
  window.addEventListener('pointerup', () => {
    pointer.down = false;
    pointer.activeDrag = false;
  });
  glCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // Mobile quick buttons
  ui.touchRoll.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    audio.unlock();
    triggerBarrelRoll();
  });
  ui.touchBoost.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    audio.unlock();
    pointer.touchBoost = true;
  });
  ui.touchBoost.addEventListener('pointerup', () => { pointer.touchBoost = false; });
  ui.touchBoost.addEventListener('pointerleave', () => { pointer.touchBoost = false; });

  // UI Button Listeners
  ui.btnStart.addEventListener('click', () => { audio.unlock(); audio.uiClick(); startGame(); });
  ui.btnRetry.addEventListener('click', () => { audio.unlock(); audio.uiClick(); startGame(); });
  ui.btnPause.addEventListener('click', () => { audio.uiClick(); pauseGame(); });
  ui.btnResume.addEventListener('click', () => { audio.uiClick(); resumeGame(); });
  ui.btnRestartPause.addEventListener('click', () => { audio.uiClick(); startGame(); });
  ui.btnMenuPause.addEventListener('click', () => { audio.uiClick(); returnToTitle(); });
  ui.btnGoMenu.addEventListener('click', () => { audio.uiClick(); returnToTitle(); });

  const toggleMouse = () => {
    audio.unlock(); audio.uiClick();
    state.mouseSteer = !state.mouseSteer;
    syncToggleButtons();
  };
  const toggleAuto = () => {
    audio.unlock(); audio.uiClick();
    state.autoFire = !state.autoFire;
    syncToggleButtons();
  };
  ui.btnMouseMode.addEventListener('click', toggleMouse);
  ui.btnPauseMouse.addEventListener('click', toggleMouse);
  ui.btnAutofire.addEventListener('click', toggleAuto);
  ui.btnPauseAutofire.addEventListener('click', toggleAuto);
  ui.btnMute.addEventListener('click', () => {
    audio.unlock();
    audio.toggleMute();
    syncToggleButtons();
  });

  /* =========================================================================
     9. TRENCH GENERATION & GAME LIFECYCLE
  ========================================================================= */
  const TRENCH_COUNT = 24;
  const TRENCH_LEN = 10;

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

  function setScreen(mode) {
    state.mode = mode;
    ui.screenTitle.classList.toggle('hidden-screen', mode !== 'title');
    ui.screenPause.classList.toggle('hidden-screen', mode !== 'paused');
    ui.screenGameOver.classList.toggle('hidden-screen', mode !== 'gameover');
    ui.hudLayer.style.opacity = (mode === 'playing' || mode === 'paused') ? '1' : '0';
    ui.hudLayer.classList.toggle('pointer-events-none', mode !== 'playing');
  }

  function startGame() {
    const ship = SHIPS[state.selectedShipIdx];
    state.score = 0;
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
    state.boss = null;

    state.player = {
      x: 0, y: 0.4, vx: 0, vy: 0,
      roll: 0, pitch: 0,
      shield: ship.maxShield, maxShield: ship.maxShield,
      invuln: 0,
      boost: 1.0, boosting: false,
      fireCd: 0,
      barrelTimer: 0, barrelDir: 1, barrelCd: 0,
      tripleTimer: 0,
      muzzleFlash: 0
    };

    state.asteroids.length = 0;
    state.enemies.length = 0;
    state.pillars.length = 0;
    state.rings.length = 0;
    state.powerups.length = 0;
    state.lasers.length = 0;
    state.enemyShots.length = 0;
    state.particles.length = 0;
    state.shockwaves.length = 0;
    state.popups.length = 0;
    state.spawnTimers = { ast: 0.4, enemy: 1.2, ring: 3.6, pillar: 3.8 };
    // Immediate welcoming golden ring & asteroids down the canyon
    state.rings.push({ x: 0, y: 1.0, z: -110, rot: 0, passed: false });
    spawnAsteroid();
    state.asteroids[0].z = -125;
    state.asteroids[0].x = -4.5;

    ui.bossBarWrap.classList.add('hidden');
    ui.sectorProgressWrap.classList.remove('hidden');

    setScreen('playing');
    updateHUD();
    showBanner('SETOR 01', SECTORS[0].name, 2.5);
  }

  function pauseGame() {
    if (state.mode !== 'playing') return;
    setScreen('paused');
  }

  function resumeGame() {
    if (state.mode !== 'paused') return;
    setScreen('playing');
  }

  function returnToTitle() {
    state.boss = null;
    setScreen('title');
    refreshRecordDisplay();
  }

  function triggerGameOver() {
    const p = state.player;
    spawnExplosion(p.x, p.y, 0, 2.2, [1.0, 0.65, 0.2]);
    audio.explosion(2.0);
    state.shake = 1.1;

    const finalScore = Math.floor(state.score);
    const isNewRecord = finalScore > state.bestScore;
    if (isNewRecord) state.bestScore = finalScore;
    if (state.sector > state.bestSector) state.bestSector = state.sector;
    saveProgress();
    refreshRecordDisplay();

    ui.goScore.textContent = finalScore.toLocaleString('pt-BR');
    ui.goNewRecord.classList.toggle('hidden', !isNewRecord);
    ui.goSector.textContent = String(state.sector).padStart(2, '0');
    ui.goKills.textContent = state.kills;
    ui.goRings.textContent = state.ringsCollected;
    ui.goMaxCombo.textContent = `×${state.maxCombo}`;
    setScreen('gameover');
  }

  /* =========================================================================
     10. ENTITIES, SPAWNING & COMBAT LOGIC
  ========================================================================= */
  const BOUNDS_X = 9.0;
  const BOUNDS_Y_MIN = -3.6;
  const BOUNDS_Y_MAX = 5.4;

  function addScore(basePoints, wx, wy, wz, label) {
    const mult = state.combo * (state.player.boosting ? 2 : 1);
    const pts = Math.round(basePoints * mult);
    state.score += pts;
    if (wx !== undefined) {
      addPopup(wx, wy, wz, label || `+${pts}`, mult >= 4 ? '#fbbf24' : '#f8fafc');
    }
  }

  function addCombo(amount = 1) {
    state.combo = Math.min(8, state.combo + amount);
    state.comboTimer = 5.5;
    if (state.combo > state.maxCombo) state.maxCombo = state.combo;
  }

  function addPopup(x, y, z, text, color = '#f8fafc') {
    state.popups.push({ x, y, z, text, color, life: 1.05, maxLife: 1.05 });
  }

  function spawnExplosion(x, y, z, scale = 1.0, colorTint = [1.0, 0.72, 0.25]) {
    const count = Math.floor(12 + scale * 10);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(rand(-1, 1));
      const spd = rand(6, 20) * scale;
      state.particles.push({
        x, y, z,
        vx: Math.sin(phi) * Math.cos(theta) * spd,
        vy: Math.sin(phi) * Math.sin(theta) * spd,
        vz: Math.cos(phi) * spd * 0.6 + state.speed * 0.25,
        rx: rand(0, 6), ry: rand(0, 6),
        vrx: rand(-9, 9), vry: rand(-9, 9),
        size: rand(0.18, 0.52) * scale,
        life: rand(0.35, 0.78),
        maxLife: 0.78,
        tint: colorTint
      });
    }
    state.shockwaves.push({
      x, y, z,
      scale: 0.5 * scale,
      maxScale: 4.5 * scale,
      life: 0.36,
      maxLife: 0.36,
      tint: colorTint
    });
  }

  function spawnPowerup(x, y, z, forcedType) {
    const r = Math.random();
    const type = forcedType || (r < 0.42 ? 'triple' : r < 0.80 ? 'shield' : 'nova');
    state.powerups.push({ x, y, z, type, spin: 0 });
  }

  function spawnAsteroid() {
    const scale = rand(1.15, 2.55);
    const hp = Math.ceil(scale * 1.15 + state.sector * 0.25);
    state.asteroids.push({
      x: rand(-BOUNDS_X - 1.2, BOUNDS_X + 1.2),
      y: rand(BOUNDS_Y_MIN + 0.5, BOUNDS_Y_MAX + 0.6),
      z: -165,
      vx: rand(-1.4, 1.4),
      vy: rand(-0.6, 0.6),
      rx: rand(0, 6.28), ry: rand(0, 6.28), rz: rand(0, 6.28),
      vrx: rand(-1.8, 1.8), vry: rand(-1.8, 1.8),
      scale,
      hp, maxHp: hp,
      flash: 0,
      grazed: false,
      variant: randInt(0, 2)
    });
  }

  function spawnEnemyWave() {
    const count = Math.min(4, 1 + Math.floor((state.sector + 1) * 0.6) + (Math.random() < 0.35 ? 1 : 0));
    const pattern = Math.random();
    const baseX = rand(-5.0, 5.0);
    const baseY = rand(0.2, 3.8);

    for (let i = 0; i < count; i++) {
      const isMantis = state.sector >= 2 && i === 0 && Math.random() < 0.42;
      const offset = (i - (count - 1) * 0.5) * 3.4;
      const hp = isMantis ? (4.5 + state.sector * 1.2) : (1.8 + state.sector * 0.45);
      state.enemies.push({
        type: isMantis ? 'mantis' : 'viper',
        x: clamp(baseX + offset, -BOUNDS_X, BOUNDS_X),
        y: clamp(baseY + (pattern < 0.5 ? Math.abs(offset) * 0.25 : rand(-1.2, 1.2)), -1.5, BOUNDS_Y_MAX),
        z: -155 - i * 11,
        targetZ: rand(-48, -32),
        phase: rand(0, 6.28),
        strafeAmp: isMantis ? 2.4 : 3.6,
        anchorX: clamp(baseX + offset, -BOUNDS_X + 2, BOUNDS_X - 2),
        anchorY: clamp(baseY + rand(-0.8, 1.0), -1.2, BOUNDS_Y_MAX - 0.5),
        hp, maxHp: hp,
        fireCd: rand(0.9, 2.0),
        dwell: rand(4.5, 7.2),
        flash: 0,
        roll: 0,
        grazed: false
      });
    }
  }

  function spawnRing() {
    state.rings.push({
      x: rand(-BOUNDS_X + 2.5, BOUNDS_X - 2.5),
      y: rand(-1.4, BOUNDS_Y_MAX - 1.2),
      z: -165,
      rot: 0,
      passed: false
    });
  }

  function spawnHazardPillar() {
    const sideX = rand(-BOUNDS_X + 1.2, BOUNDS_X - 1.2);
    const h = rand(6.5, 11.5);
    state.pillars.push({
      x: sideX,
      y: -8.5 + h * 0.5, // rises from trench floor
      z: -168,
      height: h,
      hp: 4 + state.sector,
      flash: 0,
      grazed: false
    });
  }

  function spawnBoss() {
    const sec = state.sector;
    const coreHp = 18 + sec * 10;
    state.boss = {
      x: 0, y: 2.0, z: -150,
      targetZ: -46,
      phase: 0,
      fireCd: 1.8,
      escortCd: 7.0,
      dyingTimer: 0,
      flash: 0,
      cores: [
        { ox: -6.8, oy: -0.2, oz: 2.3, hp: coreHp, maxHp: coreHp, flash: 0, alive: true },
        { ox:  0.0, oy:  0.2, oz: 2.9, hp: coreHp * 1.25, maxHp: coreHp * 1.25, flash: 0, alive: true },
        { ox:  6.8, oy: -0.2, oz: 2.3, hp: coreHp, maxHp: coreHp, flash: 0, alive: true }
      ]
    };
    audio.bossWarning();
    showBanner(`ALERTA SETOR 0${sec}`, 'COURAÇADO LEVIATHAN DETECTADO', 3.2);
    ui.sectorProgressWrap.classList.add('hidden');
    ui.bossBarWrap.classList.remove('hidden');
    ui.bossName.textContent = `COURAÇADO LEVIATHAN MK.${sec}`;
  }

  function triggerNovaEMP() {
    const p = state.player;
    audio.explosion(1.9);
    state.shake = 0.85;
    state.shockwaves.push({
      x: p.x, y: p.y, z: -6,
      scale: 1.5, maxScale: 36,
      life: 0.65, maxLife: 0.65,
      tint: [0.3, 0.96, 0.68]
    });
    addPopup(p.x, p.y + 1.5, -2, 'PULSO PEM NOVA!', '#34d399');

    // Clear enemy shots
    state.enemyShots.length = 0;

    // Destroy all nearby asteroids & enemies
    for (let i = state.asteroids.length - 1; i >= 0; i--) {
      const a = state.asteroids[i];
      if (a.z > -125) {
        spawnExplosion(a.x, a.y, a.z, a.scale * 0.7, [0.4, 0.95, 0.7]);
        addScore(100, a.x, a.y, a.z);
        state.asteroids.splice(i, 1);
      }
    }
    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const e = state.enemies[i];
      if (e.z > -130) {
        spawnExplosion(e.x, e.y, e.z, 1.3, [0.4, 0.95, 0.7]);
        addScore(250, e.x, e.y, e.z);
        state.kills++;
        state.enemies.splice(i, 1);
      }
    }
    // Also damage Boss cores!
    if (state.boss && state.boss.dyingTimer <= 0) {
      state.boss.cores.forEach(c => {
        if (c.alive) {
          c.hp -= 8;
          c.flash = 1;
          if (c.hp <= 0) destroyBossCore(c);
        }
      });
    }
  }

  function destroyBossCore(core) {
    if (!core.alive) return;
    core.alive = false;
    core.hp = 0;
    const b = state.boss;
    const wx = b.x + core.ox, wy = b.y + core.oy, wz = b.z + core.oz;
    spawnExplosion(wx, wy, wz, 2.2, [1.0, 0.55, 0.16]);
    audio.explosion(1.9);
    state.shake = 0.8;
    addCombo(2);
    addScore(750, wx, wy + 1.5, wz, 'NÚCLEO DESTRUÍDO!');

    if (b.cores.every(c => !c.alive)) {
      b.dyingTimer = 1.6;
      showBanner('ALVO ELIMINADO', 'COURAÇADO DESTRUÍDO!', 2.6);
    }
  }

  function findAimAssistTarget(px, py) {
    let best = null;
    let bestScore = 1e9;
    const consider = (tx, ty, tz, radius) => {
      if (tz >= -4 || tz < -118) return;
      const dx = tx - px, dy = ty - py;
      const perp = Math.hypot(dx, dy);
      if (perp < 2.65 + radius * 0.55) {
        const metric = perp * 4.5 + (-tz) * 0.12;
        if (metric < bestScore) {
          bestScore = metric;
          best = { x: tx, y: ty, z: tz };
        }
      }
    };

    if (state.boss && state.boss.dyingTimer <= 0) {
      for (const c of state.boss.cores) {
        if (c.alive) consider(state.boss.x + c.ox, state.boss.y + c.oy, state.boss.z + c.oz, 1.5);
      }
    }
    for (const e of state.enemies) consider(e.x, e.y, e.z, e.type === 'mantis' ? 2.0 : 1.4);
    for (const a of state.asteroids) consider(a.x, a.y, a.z, a.scale);
    return best;
  }

  function firePlayerLasers() {
    const p = state.player;
    const ship = SHIPS[state.selectedShipIdx];
    const triple = p.tripleTimer > 0;
    const aim = findAimAssistTarget(p.x, p.y);
    const speedZ = -195;

    const addBolt = (ox, oy, spreadX) => {
      let vx = spreadX;
      let vy = 0;
      if (aim) {
        const dt = Math.max(0.08, (aim.z - (-1.4)) / speedZ);
        vx = clamp((aim.x - (p.x + ox)) / dt, -34, 34) + spreadX * 0.4;
        vy = clamp((aim.y - (p.y + oy)) / dt, -28, 28);
      }
      state.lasers.push({
        x: p.x + ox, y: p.y + oy, z: -1.4,
        vx, vy, vz: speedZ,
        dmg: ship.damage * (triple ? 1.1 : 1.0),
        amber: triple || ship.id === 'bastion'
      });
    };

    if (triple) {
      addBolt(-1.25, -0.1, -6.5);
      addBolt(0, 0.12, 0);
      addBolt(1.25, -0.1, 6.5);
    } else {
      addBolt(-1.25, -0.1, 0);
      addBolt(1.25, -0.1, 0);
    }
    p.muzzleFlash = 1.0;
    audio.laser(triple);
  }

  function damagePlayer() {
    const p = state.player;
    if (p.invuln > 0 || p.barrelTimer > 0) return;
    p.shield--;
    p.invuln = 1.65;
    state.combo = 1;
    state.comboTimer = 0;
    state.ringStreak = 0;
    state.shake = 0.72;
    state.damageVignette = 1.0;
    audio.damage();
    spawnExplosion(p.x, p.y, -0.5, 0.85, [1.0, 0.32, 0.2]);

    if (p.shield <= 0) {
      triggerGameOver();
    }
  }

  /* =========================================================================
     11. MAIN SIMULATION UPDATE
  ========================================================================= */
  function updateEnvironmentPalette(dt) {
    const target = SECTORS[(state.sector - 1) % SECTORS.length];
    const e = state.env;
    const k = Math.min(1, dt * 1.4);
    for (let i = 0; i < 3; i++) {
      e.fog[i] = lerp(e.fog[i], target.fog[i], k);
      e.lightDir[i] = lerp(e.lightDir[i], target.lightDir[i], k);
      e.lightCol[i] = lerp(e.lightCol[i], target.lightCol[i], k);
      e.ambient[i] = lerp(e.ambient[i], target.ambient[i], k);
      e.rim[i] = lerp(e.rim[i], target.rim[i], k);
      e.planetTint[i] = lerp(e.planetTint[i], target.planetTint[i], k);
      e.sunTint[i] = lerp(e.sunTint[i], target.sunTint[i], k);
    }
  }

  function updateTrench(dt, spd) {
    for (const seg of state.trench) {
      seg.z += spd * dt;
      if (seg.z > 24) {
        seg.z -= TRENCH_COUNT * TRENCH_LEN;
        seg.leftH = rand(7, 23);
        seg.rightH = rand(7, 23);
      }
    }
  }

  function update(dt) {
    state.time += dt;
    updateEnvironmentPalette(dt);

    // Banner fade countdown
    if (state.bannerTimer > 0) {
      state.bannerTimer -= dt;
      if (state.bannerTimer <= 0) {
        ui.banner.classList.remove('banner-visible');
        ui.banner.classList.add('banner-hidden');
      }
    }

    // Title & GameOver attract flythrough
    if (state.mode !== 'playing') {
      const attractSpeed = state.mode === 'paused' ? 0 : 38;
      if (attractSpeed > 0) {
        state.travel += attractSpeed * dt;
        updateTrench(dt, attractSpeed);
        state.player.x = Math.sin(state.time * 0.65) * 3.4;
        state.player.y = 0.8 + Math.sin(state.time * 1.1) * 0.9;
        state.player.roll = -Math.cos(state.time * 0.65) * 0.34;
        state.player.pitch = Math.cos(state.time * 1.1) * 0.14;
      }
      audio.updateEngine(false, 0, 0);
      // Keep fading particles alive during gameover
      if (state.mode === 'gameover') updateParticles(dt);
      return;
    }

    const p = state.player;
    const ship = SHIPS[state.selectedShipIdx];

    // --- 1. BOOST & SPEED ---
    const wantBoost = keys.has('ShiftLeft') || keys.has('ShiftRight') || pointer.touchBoost;
    if (wantBoost && p.boost > 0.04) {
      p.boosting = true;
      p.boost = Math.max(0, p.boost - ship.boostDrain * dt);
    } else {
      p.boosting = false;
      p.boost = Math.min(1.0, p.boost + 0.18 * dt);
    }
    state.boostBlend = lerp(state.boostBlend, p.boosting ? 1 : 0, Math.min(1, dt * 8));
    state.baseSpeed = 56 + (state.sector - 1) * 9 + state.sectorProgress * 12;
    state.speed = state.baseSpeed * (1 + state.boostBlend * 0.62);
    state.travel += state.speed * dt;
    updateTrench(dt, state.speed);

    // Distance score
    state.score += state.speed * dt * 0.32 * (p.boosting ? 2 : 1);

    // Audio engine hum
    audio.updateEngine(true, state.boostBlend, clamp((state.speed - 50) / 55, 0, 1));

    // --- 2. PLAYER MOVEMENT ---
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
    } else if (pointer.activeDrag || state.mouseSteer) {
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

    // Banking & Barrel Roll animation
    if (p.barrelTimer > 0) {
      p.barrelTimer = Math.max(0, p.barrelTimer - dt);
      const prog = 1 - p.barrelTimer / 0.52;
      p.roll = -p.barrelDir * prog * Math.PI * 2;
    } else {
      const targetRoll = clamp(-p.vx / ship.speed * 0.58, -0.68, 0.68);
      p.roll = lerp(p.roll, targetRoll, Math.min(1, dt * 10));
    }
    if (p.barrelCd > 0) p.barrelCd = Math.max(0, p.barrelCd - dt);
    const targetPitch = clamp(p.vy / ship.speed * 0.34, -0.36, 0.38);
    p.pitch = lerp(p.pitch, targetPitch, Math.min(1, dt * 10));

    if (p.invuln > 0) p.invuln = Math.max(0, p.invuln - dt);
    if (p.tripleTimer > 0) p.tripleTimer = Math.max(0, p.tripleTimer - dt);
    if (p.muzzleFlash > 0) p.muzzleFlash = Math.max(0, p.muzzleFlash - dt * 8);

    // Combo decay
    if (state.combo > 1) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) {
        state.combo = 1;
      }
    }

    // Screen effects decay
    state.shake = Math.max(0, state.shake - dt * 2.6);
    state.damageVignette = Math.max(0, state.damageVignette - dt * 2.2);

    // --- 3. WEAPONS ---
    p.fireCd = Math.max(0, p.fireCd - dt);
    const wantFire = keys.has('Space') || keys.has('KeyJ') || pointer.down || state.autoFire;
    if (wantFire && p.fireCd <= 0) {
      firePlayerLasers();
      p.fireCd = ship.fireRate * (p.tripleTimer > 0 ? 0.85 : 1.0);
    }

    // --- 4. SECTOR PROGRESSION & SPAWNING ---
    if (!state.boss) {
      state.sectorProgress += dt / (34 + state.sector * 6);
      if (state.sectorProgress >= 1.0) {
        state.sectorProgress = 1.0;
        spawnBoss();
      } else {
        const diffScale = 1 + (state.sector - 1) * 0.22;
        state.spawnTimers.ast -= dt * diffScale;
        state.spawnTimers.enemy -= dt * diffScale;
        state.spawnTimers.ring -= dt;
        state.spawnTimers.pillar -= dt * diffScale;

        if (state.spawnTimers.ast <= 0) {
          spawnAsteroid();
          state.spawnTimers.ast = rand(0.65, 1.35);
        }
        if (state.spawnTimers.enemy <= 0 && state.enemies.length < 6) {
          spawnEnemyWave();
          state.spawnTimers.enemy = rand(3.8, 5.6);
        }
        if (state.spawnTimers.ring <= 0) {
          spawnRing();
          state.spawnTimers.ring = rand(4.5, 6.8);
        }
        if (state.spawnTimers.pillar <= 0) {
          spawnHazardPillar();
          state.spawnTimers.pillar = rand(4.2, 6.8);
        }
      }
    } else {
      updateBoss(dt);
    }

    // --- 5. UPDATE PLAYER LASERS ---
    for (let i = state.lasers.length - 1; i >= 0; i--) {
      const l = state.lasers[i];
      l.x += l.vx * dt;
      l.y += l.vy * dt;
      l.z += l.vz * dt;
      let hit = false;

      // Boss core hits
      if (state.boss && state.boss.dyingTimer <= 0) {
        const b = state.boss;
        for (const c of b.cores) {
          if (!c.alive) continue;
          const cx = b.x + c.ox, cy = b.y + c.oy, cz = b.z + c.oz;
          if (Math.abs(l.z - cz) < 3.4 && Math.hypot(l.x - cx, l.y - cy) < 2.2) {
            c.hp -= l.dmg;
            c.flash = 1.0;
            b.flash = 0.28;
            audio.hit();
            spawnExplosion(l.x, l.y, cz + 0.8, 0.35, [1.0, 0.78, 0.25]);
            if (c.hp <= 0) destroyBossCore(c);
            hit = true;
            break;
          }
        }
      }

      // Enemy hits
      if (!hit) {
        for (let j = state.enemies.length - 1; j >= 0; j--) {
          const e = state.enemies[j];
          const rad = e.type === 'mantis' ? 2.4 : 1.75;
          if (Math.abs(l.z - e.z) < 3.6 && Math.hypot(l.x - e.x, l.y - e.y) < rad) {
            e.hp -= l.dmg;
            e.flash = 1.0;
            audio.hit();
            hit = true;
            if (e.hp <= 0) {
              spawnExplosion(e.x, e.y, e.z, e.type === 'mantis' ? 1.55 : 1.15, [1.0, 0.55, 0.18]);
              audio.explosion(e.type === 'mantis' ? 1.3 : 0.95);
              state.shake = Math.max(state.shake, 0.25);
              state.kills++;
              addCombo(1);
              addScore(e.type === 'mantis' ? 400 : 200, e.x, e.y, e.z);
              if (Math.random() < (e.type === 'mantis' ? 0.45 : 0.16)) {
                spawnPowerup(e.x, e.y, e.z);
              }
              state.enemies.splice(j, 1);
            }
            break;
          }
        }
      }

      // Asteroid hits
      if (!hit) {
        for (let j = state.asteroids.length - 1; j >= 0; j--) {
          const a = state.asteroids[j];
          if (Math.abs(l.z - a.z) < a.scale + 2.8 && Math.hypot(l.x - a.x, l.y - a.y) < a.scale + 0.85) {
            a.hp -= l.dmg;
            a.flash = 1.0;
            audio.hit();
            hit = true;
            if (a.hp <= 0) {
              spawnExplosion(a.x, a.y, a.z, a.scale * 0.72, [0.96, 0.72, 0.38]);
              audio.explosion(0.75);
              addScore(80, a.x, a.y, a.z);
              if (Math.random() < 0.08) spawnPowerup(a.x, a.y, a.z);
              state.asteroids.splice(j, 1);
            }
            break;
          }
        }
      }

      // Hazard pillar hits
      if (!hit) {
        for (let j = state.pillars.length - 1; j >= 0; j--) {
          const pl = state.pillars[j];
          if (Math.abs(l.z - pl.z) < 3.0 && Math.abs(l.x - pl.x) < 1.5 && Math.abs(l.y - pl.y) < pl.height * 0.52) {
            pl.hp -= l.dmg;
            pl.flash = 1.0;
            audio.hit();
            hit = true;
            if (pl.hp <= 0) {
              spawnExplosion(pl.x, l.y, pl.z, 1.4, [1.0, 0.45, 0.2]);
              audio.explosion(1.1);
              addScore(180, pl.x, l.y, pl.z);
              state.pillars.splice(j, 1);
            }
            break;
          }
        }
      }

      if (hit || l.z < -180) state.lasers.splice(i, 1);
    }

    // --- 6. UPDATE ASTEROIDS ---
    for (let i = state.asteroids.length - 1; i >= 0; i--) {
      const a = state.asteroids[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.z += state.speed * dt;
      a.rx += a.vrx * dt;
      a.ry += a.vry * dt;
      a.flash = Math.max(0, a.flash - dt * 6);

      if (Math.abs(a.z) < a.scale + 1.1) {
        const d = Math.hypot(a.x - p.x, a.y - p.y);
        if (d < a.scale * 0.85 + 0.72) {
          damagePlayer();
          spawnExplosion(a.x, a.y, a.z, a.scale * 0.7, [1.0, 0.5, 0.2]);
          state.asteroids.splice(i, 1);
          continue;
        } else if (!a.grazed && d < a.scale + 2.3) {
          a.grazed = true;
          audio.graze();
          addScore(120, p.x, p.y + 1.1, -1, 'RASPÃO! +120');
          p.boost = Math.min(1, p.boost + 0.14);
        }
      }
      if (a.z > 18) state.asteroids.splice(i, 1);
    }

    // --- 7. UPDATE HAZARD PILLARS ---
    for (let i = state.pillars.length - 1; i >= 0; i--) {
      const pl = state.pillars[i];
      pl.z += state.speed * dt;
      pl.flash = Math.max(0, pl.flash - dt * 6);
      if (Math.abs(pl.z) < 1.6) {
        const inY = p.y < pl.y + pl.height * 0.5 + 0.4;
        const dx = Math.abs(p.x - pl.x);
        if (inY && dx < 1.35) {
          damagePlayer();
          spawnExplosion(pl.x, p.y, pl.z, 1.2, [1.0, 0.35, 0.2]);
          state.pillars.splice(i, 1);
          continue;
        } else if (inY && !pl.grazed && dx < 2.6) {
          pl.grazed = true;
          audio.graze();
          addScore(140, p.x, p.y + 1.0, -1, 'RASPÃO! +140');
        }
      }
      if (pl.z > 18) state.pillars.splice(i, 1);
    }

    // --- 8. UPDATE ENEMIES ---
    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const e = state.enemies[i];
      e.phase += dt * (e.type === 'mantis' ? 1.7 : 2.5);
      e.flash = Math.max(0, e.flash - dt * 6);

      if (e.dwell > 0) {
        if (e.z < e.targetZ) {
          e.z += Math.max(state.speed * 0.9, 55) * dt;
        } else {
          e.dwell -= dt;
          const prevX = e.x;
          e.x = clamp(e.anchorX + Math.sin(e.phase) * e.strafeAmp, -BOUNDS_X, BOUNDS_X);
          e.y = clamp(e.anchorY + Math.cos(e.phase * 0.8) * 1.3, -1.6, BOUNDS_Y_MAX);
          e.roll = clamp((e.x - prevX) / Math.max(dt, 0.001) * -0.045, -0.65, 0.65);

          e.fireCd -= dt;
          if (e.fireCd <= 0) {
            fireEnemyOrb(e.x, e.y, e.z + 1.4, p.x, p.y, e.type === 'mantis');
            e.fireCd = (e.type === 'mantis' ? 1.5 : 2.1) / (1 + (state.sector - 1) * 0.12);
          }
        }
      } else {
        // Swoop past player
        e.z += (state.speed * 1.15) * dt;
        e.y += 1.8 * dt;
      }

      if (Math.abs(e.z) < 2.0 && Math.hypot(e.x - p.x, e.y - p.y) < 1.9) {
        damagePlayer();
        spawnExplosion(e.x, e.y, e.z, 1.1, [1.0, 0.4, 0.2]);
        state.enemies.splice(i, 1);
        continue;
      }
      if (e.z > 20) state.enemies.splice(i, 1);
    }

    // --- 9. UPDATE ENEMY SHOTS ---
    for (let i = state.enemyShots.length - 1; i >= 0; i--) {
      const s = state.enemyShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.z += s.vz * dt;
      if (Math.abs(s.z) < 1.35) {
        const d = Math.hypot(s.x - p.x, s.y - p.y);
        if (d < 1.15) {
          if (p.barrelTimer > 0) {
            // Deflected by Barrel Roll!
            s.vz = -110;
            s.vx = -s.vx * 2;
            audio.graze();
            addScore(150, p.x, p.y + 1.0, -1, 'DEFLETIDO! +150');
          } else {
            damagePlayer();
            state.enemyShots.splice(i, 1);
            continue;
          }
        }
      }
      if (s.z > 16 || s.z < -150) state.enemyShots.splice(i, 1);
    }

    // --- 10. UPDATE ENERGY RINGS ---
    for (let i = state.rings.length - 1; i >= 0; i--) {
      const r = state.rings[i];
      r.z += state.speed * dt;
      r.rot += dt * 1.6;
      if (!r.passed && r.z > -1.8 && r.z < 1.8) {
        if (Math.hypot(r.x - p.x, r.y - p.y) < 3.05) {
          r.passed = true;
          state.ringsCollected++;
          state.ringStreak++;
          addCombo(1);
          p.boost = Math.min(1.0, p.boost + 0.35);
          audio.ring(state.combo);
          addScore(220, r.x, r.y + 1.2, 0, `ANEL ×${state.combo}`);
          state.shockwaves.push({
            x: r.x, y: r.y, z: 0,
            scale: 1.8, maxScale: 6.2,
            life: 0.34, maxLife: 0.34,
            tint: [1.0, 0.78, 0.22]
          });
          if (state.ringStreak >= 3) {
            state.ringStreak = 0;
            if (p.shield < p.maxShield) {
              p.shield++;
              addPopup(p.x, p.y + 1.9, 0, 'ESCUDO +1', '#38bdf8');
            }
          }
        }
      }
      if (r.z > 16) state.rings.splice(i, 1);
    }

    // --- 11. UPDATE POWERUPS ---
    for (let i = state.powerups.length - 1; i >= 0; i--) {
      const pu = state.powerups[i];
      pu.z += state.speed * 0.75 * dt;
      pu.spin += dt * 3.0;
      if (Math.abs(pu.z) < 2.2 && Math.hypot(pu.x - p.x, pu.y - p.y) < 2.35) {
        audio.powerup();
        if (pu.type === 'shield') {
          p.shield = Math.min(p.maxShield, p.shield + 1);
          addPopup(pu.x, pu.y + 1.2, 0, 'ESCUDO RESTAURADO!', '#38bdf8');
        } else if (pu.type === 'triple') {
          p.tripleTimer = 9.0;
          addPopup(pu.x, pu.y + 1.2, 0, 'CANHÃO TRIPLO 9s!', '#fbbf24');
        } else {
          triggerNovaEMP();
        }
        addScore(150);
        state.powerups.splice(i, 1);
        continue;
      }
      if (pu.z > 16) state.powerups.splice(i, 1);
    }

    // --- 12. PARTICLES & POPUPS ---
    updateParticles(dt);
    updateHUD();
  }

  function fireEnemyOrb(ex, ey, ez, tx, ty, dual) {
    const spd = 48 + state.sector * 5;
    const dist = Math.max(10, -ez);
    const t = dist / spd;
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
    for (const c of b.cores) c.flash = Math.max(0, c.flash - dt * 6);

    if (b.dyingTimer > 0) {
      b.dyingTimer -= dt;
      b.z -= 5 * dt;
      if (Math.random() < dt * 16) {
        spawnExplosion(b.x + rand(-8, 8), b.y + rand(-2, 3), b.z + rand(-2, 3), rand(1.1, 2.2), [1.0, 0.58, 0.16]);
        audio.explosion(1.2);
        state.shake = 0.55;
      }
      if (b.dyingTimer <= 0) {
        spawnExplosion(b.x, b.y, b.z, 3.6, [1.0, 0.82, 0.3]);
        audio.explosion(2.4);
        state.shake = 1.0;
        addScore(2500 * state.sector, b.x, b.y + 1, b.z, `BÔNUS CHEFÃO!`);
        state.boss = null;
        state.sector++;
        state.sectorProgress = 0;
        p.shield = Math.min(p.maxShield, p.shield + 2);
        p.boost = 1.0;
        ui.bossBarWrap.classList.add('hidden');
        ui.sectorProgressWrap.classList.remove('hidden');
        const secInfo = SECTORS[(state.sector - 1) % SECTORS.length];
        showBanner(`SETOR 0${state.sector}`, secInfo.name, 3.0);
      }
      return;
    }

    // Approach target hover distance
    if (b.z < b.targetZ) {
      b.z = lerp(b.z, b.targetZ, Math.min(1, dt * 1.8));
    } else {
      b.phase += dt * (0.75 + state.sector * 0.08);
      b.x = Math.sin(b.phase) * 4.5;
      b.y = 2.0 + Math.sin(b.phase * 1.6) * 1.4;

      b.fireCd -= dt;
      if (b.fireCd <= 0) {
        const liveCores = b.cores.filter(c => c.alive);
        const shooter = liveCores[randInt(0, liveCores.length - 1)];
        if (shooter) {
          const sx = b.x + shooter.ox, sy = b.y + shooter.oy, sz = b.z + shooter.oz + 1.5;
          // Spread volley of 3 plasma orbs
          const spd = 50 + state.sector * 4;
          const t = Math.max(0.35, -sz / spd);
          const baseVx = clamp((p.x - sx) / t, -20, 20);
          const baseVy = clamp((p.y - sy) / t, -15, 15);
          audio.enemyShot();
          [-5.5, 0, 5.5].forEach(spread => {
            state.enemyShots.push({ x: sx, y: sy, z: sz, vx: baseVx + spread, vy: baseVy, vz: spd });
          });
        }
        b.fireCd = Math.max(0.85, 1.75 - state.sector * 0.14);
      }

      b.escortCd -= dt;
      if (b.escortCd <= 0 && state.enemies.length < 2) {
        spawnEnemyWave();
        b.escortCd = 9.0;
      }
    }

    // Update Boss HUD Bar
    let totalHp = 0, totalMax = 0, aliveCount = 0;
    for (const c of b.cores) {
      totalHp += Math.max(0, c.hp);
      totalMax += c.maxHp;
      if (c.alive) aliveCount++;
    }
    ui.bossHpBar.style.width = `${clamp((totalHp / Math.max(1, totalMax)) * 100, 0, 100)}%`;
    ui.bossCoresLeft.textContent = `${aliveCount} ${aliveCount === 1 ? 'NÚCLEO' : 'NÚCLEOS'}`;
  }

  function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const pt = state.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.z += pt.vz * dt;
      pt.rx += pt.vrx * dt;
      pt.ry += pt.vry * dt;
      pt.life -= dt;
      if (pt.life <= 0) state.particles.splice(i, 1);
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
     12. HUD DOM SYNC
  ========================================================================= */
  let lastShieldRendered = -1, lastMaxShieldRendered = -1;

  function updateHUD() {
    const p = state.player;
    ui.score.textContent = String(Math.floor(state.score)).padStart(6, '0');
    ui.combo.textContent = `×${state.combo}${p.boosting ? ' · 2×' : ''}`;
    ui.sector.textContent = `SETOR ${String(state.sector).padStart(2, '0')}`;
    ui.sectorName.textContent = SECTORS[(state.sector - 1) % SECTORS.length].name;
    ui.sectorBar.style.width = `${Math.round(state.sectorProgress * 100)}%`;
    ui.speed.textContent = `MACH ${(state.speed / 13.2).toFixed(1)}`;
    if (state.score > state.bestScore) {
      ui.best.textContent = Math.floor(state.score).toLocaleString('pt-BR');
    }

    // Shield Pips
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

    // Boost & Roll
    ui.boostBar.style.width = `${Math.round(p.boost * 100)}%`;
    const rollReady = p.barrelCd <= 0 && p.barrelTimer <= 0;
    const rollPct = rollReady ? 100 : Math.round((1 - p.barrelCd / 2.6) * 100);
    ui.rollBar.style.width = `${clamp(rollPct, 0, 100)}%`;
    ui.rollStatus.textContent = rollReady ? 'OK' : `${p.barrelCd.toFixed(1)}s`;
    ui.rollStatus.className = `mono ${rollReady ? 'text-emerald' : 'text-muted'}`;

    // Triple powerup indicator
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
     13. 3D WEBGL RENDER PASS + 2D TACTICAL RETICLE OVERLAY
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
    const aspect = viewW / Math.max(1, viewH);
    const portraitFactor = aspect < 1 ? clamp((1 - aspect) / 0.55, 0, 1) : 0;
    const fovDeg = 58 + portraitFactor * 14 + state.boostBlend * 14;
    Mat4.perspective(projMat, (fovDeg * Math.PI) / 180, aspect, 0.4, 340);

    // Dynamic camera with chase smoothing, banking & hit shake
    const sx = (Math.random() - 0.5) * state.shake * 0.9;
    const sy = (Math.random() - 0.5) * state.shake * 0.9;
    if (state.mode === 'title') {
      camPos[0] = p.x * 0.45 + Math.sin(state.time * 0.4) * 2.2;
      camPos[1] = p.y * 0.4 + 2.6;
      camPos[2] = 9.2 + portraitFactor * 3.5;
      Mat4.lookAt(viewMat, camPos[0], camPos[1], camPos[2], p.x * 0.7, p.y * 0.65, -28, 0, 1, 0);
    } else {
      camPos[0] = p.x * 0.46 + sx;
      camPos[1] = p.y * 0.42 + 2.45 + portraitFactor * 0.5 + sy;
      camPos[2] = 10.6 + portraitFactor * 4.2 - state.boostBlend * 0.9;
      const upX = -p.vx * 0.005;
      Mat4.lookAt(viewMat, camPos[0], camPos[1], camPos[2], p.x * 0.68, p.y * 0.56, -34, upX, 1, 0);
    }
    Mat4.multiply(vpMat, projMat, viewMat);

    renderer.beginFrame(state.env, camPos, vpMat);

    // 1. Starfield & Warp streaks
    renderer.drawStars(vpMat, state.travel * 0.9, 1.4 + state.boostBlend * 8.5);

    // 2. Horizon Planet & Solar Disc (minimal fog so they shine cleanly)
    renderer.setFogRange(260, 500);
    Mat4.compose(modelMat, -42 + camPos[0]*0.3, 30, -235, 0.2, state.time * 0.04, 0.22, 24, 24, 24);
    renderer.drawMesh(models.planet, modelMat, state.env.planetTint, 0, 1);
    Mat4.compose(modelMat, -42 + camPos[0]*0.3, 30, -235, 1.24, 0.2, 0.25, 24, 24, 24);
    renderer.drawMesh(models.planet_ring, modelMat, state.env.sunTint, 0, 0.85);
    Mat4.compose(modelMat, 56 + camPos[0]*0.2, 36, -260, 0, 0, 0, 11, 11, 11);
    renderer.drawMesh(models.sun, modelMat, state.env.sunTint, 0, 1);

    // Restore scene fog
    renderer.setFogRange(state.env.fogNear, state.env.fogFar);

    // 3. Megastructure Trench Floor, Walls & Overhead Arches
    for (const seg of state.trench) {
      Mat4.compose(modelMat, 0, -8.5, seg.z, 0, 0, 0, 1, 1, 1);
      renderer.drawMesh(models.trench_deck, modelMat);

      // Left & Right canyon wall monoliths
      Mat4.compose(modelMat, -18.5, -8.5 + seg.leftH * 0.5, seg.z, 0, 0, 0, seg.leftW, seg.leftH, 8.8);
      renderer.drawMesh(models.pillar, modelMat);
      Mat4.compose(modelMat, 18.5, -8.5 + seg.rightH * 0.5, seg.z, 0, Math.PI, 0, seg.rightW, seg.rightH, 8.8);
      renderer.drawMesh(models.pillar, modelMat);

      if (seg.hasArch) {
        Mat4.compose(modelMat, 0, -8.5, seg.z, 0, 0, 0, 1, 1, 1);
        renderer.drawMesh(models.arch, modelMat);
      }
    }

    // 4. Hazard Pillars
    for (const pl of state.pillars) {
      Mat4.compose(modelMat, pl.x, pl.y, pl.z, 0, 0, 0, 1, pl.height, 1);
      renderer.drawMesh(models.hazard_pillar, modelMat, [1, 1, 1], pl.flash, 1);
    }

    // 5. Asteroids
    for (const a of state.asteroids) {
      Mat4.compose(modelMat, a.x, a.y, a.z, a.rx, a.ry, a.rz, a.scale, a.scale, a.scale);
      renderer.drawMesh(models.asteroids[a.variant], modelMat, [1, 1, 1], a.flash, 1);
    }

    // 6. Energy Gate Rings
    for (const r of state.rings) {
      const alpha = r.passed ? 0.35 : 1.0;
      Mat4.compose(modelMat, r.x, r.y, r.z, 0, 0, r.rot, 1, 1, 1);
      renderer.drawMesh(models.ring, modelMat, r.passed ? [0.4, 1.0, 0.7] : [1, 1, 1], 0, alpha);
    }

    // 7. Power-ups
    for (const pu of state.powerups) {
      const mesh = pu.type === 'shield' ? models.pu_shield : pu.type === 'triple' ? models.pu_triple : models.pu_nova;
      Mat4.compose(modelMat, pu.x, pu.y + Math.sin(state.time * 4 + pu.spin) * 0.25, pu.z, 0.35, pu.spin, 0.2, 1, 1, 1);
      renderer.drawMesh(mesh, modelMat);
    }

    // 8. Enemies
    for (const e of state.enemies) {
      const mesh = e.type === 'mantis' ? models.enemy_mantis : models.enemy_viper;
      Mat4.compose(modelMat, e.x, e.y, e.z, 0, 0, e.roll, 1, 1, 1);
      renderer.drawMesh(mesh, modelMat, [1, 1, 1], e.flash, 1);
    }

    // 9. Boss Dreadnought & Weakpoint Cores
    if (state.boss) {
      const b = state.boss;
      const tilt = Math.sin(b.phase) * 0.08;
      Mat4.compose(modelMat, b.x, b.y, b.z, 0, 0, tilt, 1, 1, 1);
      renderer.drawMesh(models.boss_hull, modelMat, [1, 1, 1], b.flash, 1);
      for (const c of b.cores) {
        if (!c.alive) continue;
        const pulse = 1.0 + Math.sin(state.time * 9) * 0.08;
        Mat4.compose(modelMat, b.x + c.ox, b.y + c.oy, b.z + c.oz, state.time * 1.5, state.time * 2.1, 0, pulse, pulse, pulse);
        renderer.drawMesh(models.boss_core, modelMat, [1, 1, 1], c.flash, 1);
      }
    }

    // 10. Player Ship & Thruster Flames
    const showPlayer = state.mode !== 'gameover' && (p.invuln <= 0 || Math.floor(state.time * 18) % 2 === 0);
    if (showPlayer) {
      const shipId = SHIPS[state.selectedShipIdx].id;
      const shipMesh = models[`ship_${shipId}`];
      Mat4.compose(modelMat, p.x, p.y, 0, p.pitch, 0, p.roll, 1, 1, 1);
      renderer.drawMesh(shipMesh, modelMat, [1, 1, 1], p.barrelTimer > 0 ? 0.22 : 0, 1);

      // Pulsing thruster flame cones
      const flameLen = (0.85 + Math.sin(state.time * 48) * 0.22) * (1 + state.boostBlend * 1.35);
      const flameTint = state.boostBlend > 0.2 ? [1.0, 0.78, 0.28] : [0.45, 0.92, 1.0];
      const offsets = shipId === 'interceptor' ? [[0, 0, 1.72]] : shipId === 'bastion' ? [[-1.18, -0.04, 1.32], [1.18, -0.04, 1.32]] : [[-0.32, -0.02, 1.62], [0.32, -0.02, 1.62]];
      const cr = Math.cos(p.roll), sr = Math.sin(p.roll);
      for (const [ox, oy, oz] of offsets) {
        const rx = ox * cr - oy * sr;
        const ry = ox * sr + oy * cr;
        Mat4.compose(modelMat, p.x + rx, p.y + ry, oz, p.pitch, 0, p.roll, 1, 1, flameLen);
        renderer.drawMesh(models.flame, modelMat, flameTint, 0, 0.88);
      }
    }

    // 11. Lasers & Enemy Plasma Orbs
    for (const l of state.lasers) {
      Mat4.compose(modelMat, l.x, l.y, l.z, 0, 0, 0, 1, 1, 1);
      renderer.drawMesh(l.amber ? models.laser_amber : models.laser_cyan, modelMat);
    }
    for (const s of state.enemyShots) {
      const sc = 1 + Math.sin(state.time * 24) * 0.14;
      Mat4.compose(modelMat, s.x, s.y, s.z, state.time * 5, state.time * 4, 0, sc, sc, sc);
      renderer.drawMesh(models.enemy_orb, modelMat);
    }

    // 12. 3D Particles & Shockwaves
    for (const pt of state.particles) {
      const a = clamp(pt.life / pt.maxLife, 0, 1);
      const sc = pt.size * (0.4 + a * 0.7);
      Mat4.compose(modelMat, pt.x, pt.y, pt.z, pt.rx, pt.ry, 0, sc, sc, sc);
      renderer.drawMesh(models.shard, modelMat, pt.tint, 0, a);
    }
    for (const sw of state.shockwaves) {
      const a = clamp(sw.life / sw.maxLife, 0, 1);
      Mat4.compose(modelMat, sw.x, sw.y, sw.z, 0, 0, 0, sw.scale, sw.scale, 1);
      renderer.drawMesh(models.shockwave, modelMat, sw.tint, 0, a * 0.85);
    }

    // 13. 2D Projected Tactical Overlay
    renderOverlayHUD();
  }

  function renderOverlayHUD() {
    hudCtx.clearRect(0, 0, viewW, viewH);

    // Damage crimson vignette
    if (state.damageVignette > 0.01) {
      const g = hudCtx.createRadialGradient(viewW * 0.5, viewH * 0.5, viewH * 0.25, viewW * 0.5, viewH * 0.5, viewW * 0.65);
      g.addColorStop(0, 'rgba(239, 68, 68, 0)');
      g.addColorStop(1, `rgba(239, 68, 68, ${state.damageVignette * 0.45})`);
      hudCtx.fillStyle = g;
      hudCtx.fillRect(0, 0, viewW, viewH);
    }

    // Turbo Boost kinetic edge vignette
    if (state.boostBlend > 0.05 && state.mode === 'playing') {
      const g = hudCtx.createRadialGradient(viewW * 0.5, viewH * 0.5, viewH * 0.35, viewW * 0.5, viewH * 0.5, viewW * 0.7);
      g.addColorStop(0, 'rgba(56, 189, 248, 0)');
      g.addColorStop(1, `rgba(56, 189, 248, ${state.boostBlend * 0.22})`);
      hudCtx.fillStyle = g;
      hudCtx.fillRect(0, 0, viewW, viewH);
    }

    if (state.mode !== 'playing') return;

    const p = state.player;
    const locked = findAimAssistTarget(p.x, p.y);

    // Dual Star-Fox style 3D aiming reticles (Near & Far depth alignment)
    const nearPt = Mat4.project(p.x, p.y, -24, vpMat, viewW, viewH);
    const farPt = Mat4.project(p.x, p.y, -58, vpMat, viewW, viewH);
    const retColor = locked ? '#fbbf24' : 'rgba(125, 211, 252, 0.82)';

    if (nearPt) {
      hudCtx.strokeStyle = retColor;
      hudCtx.lineWidth = 1.6;
      const r = 15;
      hudCtx.beginPath();
      // Corner brackets
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
      hudCtx.moveTo(farPt.x, farPt.y - r);
      hudCtx.lineTo(farPt.x + r, farPt.y);
      hudCtx.lineTo(farPt.x, farPt.y + r);
      hudCtx.lineTo(farPt.x - r, farPt.y);
      hudCtx.closePath();
      hudCtx.stroke();
    }

    // Enemy target brackets & mini health bars
    for (const e of state.enemies) {
      if (e.z > -4 || e.z < -130) continue;
      const pt = Mat4.project(e.x, e.y, e.z, vpMat, viewW, viewH);
      if (!pt) continue;
      const isLocked = locked && Math.abs(locked.x - e.x) < 0.1 && Math.abs(locked.z - e.z) < 0.1;
      const sz = clamp(520 / pt.w, 10, 26);
      hudCtx.strokeStyle = isLocked ? '#fbbf24' : 'rgba(248, 113, 113, 0.72)';
      hudCtx.lineWidth = isLocked ? 2 : 1.2;
      hudCtx.strokeRect(pt.x - sz, pt.y - sz, sz * 2, sz * 2);

      if (e.hp < e.maxHp) {
        const bw = sz * 2;
        hudCtx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        hudCtx.fillRect(pt.x - sz, pt.y - sz - 7, bw, 3.5);
        hudCtx.fillStyle = '#f87171';
        hudCtx.fillRect(pt.x - sz, pt.y - sz - 7, bw * clamp(e.hp / e.maxHp, 0, 1), 3.5);
      }
    }

    // Boss Weakpoint Target Diamonds
    if (state.boss && state.boss.dyingTimer <= 0) {
      const b = state.boss;
      for (const c of b.cores) {
        if (!c.alive) continue;
        const pt = Mat4.project(b.x + c.ox, b.y + c.oy, b.z + c.oz, vpMat, viewW, viewH);
        if (!pt) continue;
        const r = 16;
        hudCtx.strokeStyle = '#fbbf24';
        hudCtx.lineWidth = 1.8;
        hudCtx.beginPath();
        hudCtx.moveTo(pt.x, pt.y - r);
        hudCtx.lineTo(pt.x + r, pt.y);
        hudCtx.lineTo(pt.x, pt.y + r);
        hudCtx.lineTo(pt.x - r, pt.y);
        hudCtx.closePath();
        hudCtx.stroke();

        // Mini core HP bar
        hudCtx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        hudCtx.fillRect(pt.x - 16, pt.y + r + 5, 32, 3.5);
        hudCtx.fillStyle = '#f59e0b';
        hudCtx.fillRect(pt.x - 16, pt.y + r + 5, 32 * clamp(c.hp / c.maxHp, 0, 1), 3.5);
      }
    }

    // Floating 3D-projected Popups
    hudCtx.font = '700 13px ui-monospace, SFMono-Regular, Menlo, monospace';
    hudCtx.textAlign = 'center';
    for (const pop of state.popups) {
      const pt = Mat4.project(pop.x, pop.y, Math.min(-4, pop.z), vpMat, viewW, viewH);
      if (!pt) continue;
      const alpha = clamp(pop.life / pop.maxLife, 0, 1);
      hudCtx.globalAlpha = alpha;
      hudCtx.fillStyle = 'rgba(2, 6, 23, 0.75)';
      hudCtx.fillText(pop.text, pt.x + 1, pt.y + 1);
      hudCtx.fillStyle = pop.color;
      hudCtx.fillText(pop.text, pt.x, pt.y);
    }
    hudCtx.globalAlpha = 1;
  }

  /* =========================================================================
     14. BOOTSTRAP & ANIMATION LOOP
  ========================================================================= */
  initTrench();
  renderShipCards();
  refreshRecordDisplay();
  syncToggleButtons();
  setScreen('title');

  let lastTime = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
