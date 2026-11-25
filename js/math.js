// Solaris Drift — Math & Matrix Utilities (Column-major WebGL)

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (lo, hi) => lo + Math.random() * (hi - lo);
export const randInt = (lo, hi) => Math.floor(rand(lo, hi + 1));
export const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

export const Mat4 = {
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
    for (let i = 0; i < 4; i++) {
      const o = i * 4;
      const b0 = b[o], b1 = b[o + 1], b2 = b[o + 2], b3 = b[o + 3];
      out[o]     = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[o + 1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[o + 2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[o + 3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    }
    return out;
  },

  // Composes T * Ry * Rx * Rz * S directly (zero allocations)
  compose(out, px, py, pz, rx, ry, rz, sx, sy, sz) {
    const cx = Math.cos(rx), sxr = Math.sin(rx);
    const cy = Math.cos(ry), syr = Math.sin(ry);
    const cz = Math.cos(rz), szr = Math.sin(rz);

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

  // Computes inverse-transpose 3x3 normal matrix from a 4x4 model matrix (fixes non-uniform scale normals!)
  normalMat3(out9, m) {
    const a00 = m[0], a01 = m[1], a02 = m[2];
    const a10 = m[4], a11 = m[5], a12 = m[6];
    const a20 = m[8], a21 = m[9], a22 = m[10];

    const b01 = a22 * a11 - a12 * a21;
    const b11 = -a22 * a10 + a12 * a20;
    const b21 = a21 * a10 - a11 * a20;

    let det = a00 * b01 + a01 * b11 + a02 * b21;
    if (Math.abs(det) < 1e-8) {
      out9[0] = 1; out9[1] = 0; out9[2] = 0;
      out9[3] = 0; out9[4] = 1; out9[5] = 0;
      out9[6] = 0; out9[7] = 0; out9[8] = 1;
      return out9;
    }
    det = 1.0 / det;

    // Inverse-transpose in column-major order
    out9[0] = b01 * det;
    out9[1] = b11 * det;
    out9[2] = b21 * det;
    out9[3] = (-a22 * a01 + a02 * a21) * det;
    out9[4] = (a22 * a00 - a02 * a20) * det;
    out9[5] = (-a21 * a00 + a01 * a20) * det;
    out9[6] = (a12 * a01 - a02 * a11) * det;
    out9[7] = (-a12 * a00 + a02 * a10) * det;
    out9[8] = (a11 * a00 - a01 * a10) * det;
    return out9;
  },

  project(x, y, z, vp, width, height) {
    const cx = vp[0] * x + vp[4] * y + vp[8] * z + vp[12];
    const cy = vp[1] * x + vp[5] * y + vp[9] * z + vp[13];
    const cw = vp[3] * x + vp[7] * y + vp[11] * z + vp[15];
    if (cw <= 0.05) return null;
    const invW = 1 / cw;
    return {
      x: (cx * invW * 0.5 + 0.5) * width,
      y: (0.5 - cy * invW * 0.5) * height,
      w: cw
    };
  }
};
