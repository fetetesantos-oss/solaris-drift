// Solaris Drift — Next-Gen WebGL2/1 Renderer (Baked Nebula Skybox, Planet & Shield Shaders, Additive VFX, Half-Res FBO Bloom)

import { Mat4, rand } from '../math.js';
import {
  MESH_VS, MESH_FS, QUAD_VS, NEBULA_BAKE_FS, SKY_FS,
  PLANET_VS, PLANET_FS, SHIELD_VS, SHIELD_FS,
  STAR_VS, STAR_FS, BILLBOARD_VS, BILLBOARD_FS,
  RIBBON_VS, RIBBON_FS, BRIGHT_FS, BLUR_FS, COMP_FS
} from './shaders.js';
import { createSmoothSphere } from './meshBuilder.js';

const MAX_BILLBOARDS = 450;
const MAX_RIBBON_VERTS = 128;

export class Renderer3D {
  constructor(canvas, qualityPref = 'auto') {
    const opts = { antialias: true, alpha: false, powerPreference: 'high-performance' };
    let gl = canvas.getContext('webgl2', opts);
    this.isWebGL2 = !!gl;
    if (!gl) {
      gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
    }
    if (!gl) throw new Error('WebGL unavailable');
    this.gl = gl;
    this.canvas = canvas;

    this.width = 1;
    this.height = 1;
    this.dpr = 1;
    this.qualityPref = qualityPref;
    this.quality = this._resolveQuality(qualityPref);

    this._normalMat = new Float32Array(9);
    this._camRight = new Float32Array(3);
    this._camUp = new Float32Array(3);
    this._camFwd = new Float32Array(3);
    this._currentViewProj = null;
    this._currentCamPos = null;
    this._currentEnv = null;

    // Compile all programs with deterministic attribute slots
    this.meshProg = this._prog(MESH_VS, MESH_FS, ['aPos', 'aNorm', 'aColor', 'aMat']);
    this.mLoc = this._uniforms(this.meshProg, [
      'uModel', 'uViewProj', 'uNormalMat', 'uCamPos', 'uLightDir', 'uLightColor',
      'uAmbientColor', 'uRimColor', 'uFogColor', 'uFogNear', 'uFogFar',
      'uTint', 'uFlash', 'uAlpha', 'uDamage'
    ]);

    this.bakeProg = this._prog(QUAD_VS, NEBULA_BAKE_FS, ['aPos']);
    this.bakeLoc = this._uniforms(this.bakeProg, [
      'uBgColor', 'uNebulaA', 'uNebulaB', 'uNebulaC', 'uSeed', 'uStarDensity'
    ]);

    this.skyProg = this._prog(QUAD_VS, SKY_FS, ['aPos']);
    this.skyLoc = this._uniforms(this.skyProg, [
      'uSkyTex', 'uCamRight', 'uCamUp', 'uCamFwd', 'uTanHalfFov', 'uAspect',
      'uSunDir', 'uSunColor', 'uWarpFlash'
    ]);

    this.planetProg = this._prog(PLANET_VS, PLANET_FS, ['aPos', 'aNorm']);
    this.pLoc = this._uniforms(this.planetProg, [
      'uModel', 'uViewProj', 'uNormalMat', 'uCamPos', 'uLightDir',
      'uColA', 'uColB', 'uAtmoCol', 'uType', 'uTime'
    ]);

    this.shieldProg = this._prog(SHIELD_VS, SHIELD_FS, ['aPos', 'aNorm']);
    this.shLoc = this._uniforms(this.shieldProg, [
      'uModel', 'uViewProj', 'uNormalMat', 'uCamPos', 'uColor',
      'uAlpha', 'uTime', 'uHitDir', 'uHitWave'
    ]);

    this.starProg = this._prog(STAR_VS, STAR_FS, ['aBasePos', 'aEnd', 'aCol']);
    this.sLoc = this._uniforms(this.starProg, ['uViewProj', 'uTravel', 'uStreak']);

    this.billProg = this._prog(BILLBOARD_VS, BILLBOARD_FS, ['aCenter', 'aCorner', 'aSize', 'aColor']);
    this.bLoc = this._uniforms(this.billProg, ['uViewProj', 'uCamRight', 'uCamUp']);

    this.ribbonProg = this._prog(RIBBON_VS, RIBBON_FS, ['aPos', 'aColor']);
    this.rLoc = this._uniforms(this.ribbonProg, ['uViewProj']);

    this.brightProg = this._prog(QUAD_VS, BRIGHT_FS, ['aPos']);
    this.brLoc = this._uniforms(this.brightProg, ['uTex', 'uThreshold']);

    this.blurProg = this._prog(QUAD_VS, BLUR_FS, ['aPos']);
    this.blLoc = this._uniforms(this.blurProg, ['uTex', 'uDir']);

    this.compProg = this._prog(QUAD_VS, COMP_FS, ['aPos']);
    this.coLoc = this._uniforms(this.compProg, ['uScene', 'uBloom', 'uBloomStrength', 'uChromatic']);

    // Shared geometry
    this.quadVbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    this.smoothSphere = createSmoothSphere(gl, 1.0, 22, 30);
    this.shieldSphere = createSmoothSphere(gl, 1.0, 16, 22);
    this._initStarfield(460);

    // Dynamic billboard batch buffer (6 verts per quad, 10 floats/vert)
    this.billData = new Float32Array(MAX_BILLBOARDS * 6 * 10);
    this.billCount = 0;
    this.billVbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.billVbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.billData.byteLength, gl.DYNAMIC_DRAW);

    // Dynamic ribbon buffer (7 floats/vert: pos3 + rgba4)
    this.ribbonData = new Float32Array(MAX_RIBBON_VERTS * 7);
    this.ribbonVbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.ribbonVbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.ribbonData.byteLength, gl.DYNAMIC_DRAW);

    // Baked skybox FBO (generated once per region!)
    this.skyFBO = null;
    this._initSkyFBO();

    // Post-process Bloom FBOs (rebuilt on resize)
    this.sceneFBO = null;
    this.bloomA = null;
    this.bloomB = null;
    this.bloomReady = false;

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  _resolveQuality(pref) {
    if (pref === 'high' || pref === 'medium' || pref === 'low') return pref;
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '') || window.innerWidth < 768;
    const cores = navigator.hardwareConcurrency || 4;
    if (isMobile) return cores >= 6 ? 'medium' : 'low';
    return 'high';
  }

  setQuality(pref) {
    this.qualityPref = pref;
    const next = this._resolveQuality(pref);
    if (next !== this.quality) {
      this.quality = next;
      this._initSkyFBO();
      this._rebuildPostFBOs();
    }
  }

  _compile(type, src) {
    const gl = this.gl;
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error(`Shader error: ${gl.getShaderInfoLog(sh)}`);
    }
    return sh;
  }

  _prog(vs, fs, attribs) {
    const gl = this.gl;
    const p = gl.createProgram();
    gl.attachShader(p, this._compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, this._compile(gl.FRAGMENT_SHADER, fs));
    attribs.forEach((n, i) => gl.bindAttribLocation(p, i, n));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error(`Program link error: ${gl.getProgramInfoLog(p)}`);
    }
    return p;
  }

  _uniforms(prog, names) {
    const out = {};
    for (const n of names) out[n] = this.gl.getUniformLocation(prog, n);
    return out;
  }

  _setAttribs(count) {
    const gl = this.gl;
    for (let i = 0; i < 4; i++) {
      if (i < count) gl.enableVertexAttribArray(i);
      else gl.disableVertexAttribArray(i);
    }
  }

  _createFBO(w, h, withDepth = false) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

    let depth = null;
    if (withDepth) {
      depth = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
    }

    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    if (!ok) {
      gl.deleteFramebuffer(fbo);
      gl.deleteTexture(tex);
      if (depth) gl.deleteRenderbuffer(depth);
      return null;
    }
    return { fbo, tex, depth, w, h };
  }

  _deleteFBO(obj) {
    if (!obj) return;
    const gl = this.gl;
    if (obj.fbo) gl.deleteFramebuffer(obj.fbo);
    if (obj.tex) gl.deleteTexture(obj.tex);
    if (obj.depth) gl.deleteRenderbuffer(obj.depth);
  }

  _initSkyFBO() {
    this._deleteFBO(this.skyFBO);
    const w = this.quality === 'high' ? 1024 : 512;
    const h = w >> 1;
    this.skyFBO = this._createFBO(w, h, false);
    if (this.skyFBO) {
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, this.skyFBO.tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
    this._lastSkySeed = null;
  }

  _rebuildPostFBOs() {
    this._deleteFBO(this.sceneFBO);
    this._deleteFBO(this.bloomA);
    this._deleteFBO(this.bloomB);
    this.sceneFBO = this.bloomA = this.bloomB = null;
    this.bloomReady = false;

    if (this.quality === 'low' || this.canvas.width < 16 || this.canvas.height < 16) return;

    const cw = this.canvas.width, ch = this.canvas.height;
    const div = this.quality === 'high' ? 2 : 4;
    const bw = Math.max(32, Math.floor(cw / div));
    const bh = Math.max(32, Math.floor(ch / div));

    this.sceneFBO = this._createFBO(cw, ch, true);
    this.bloomA = this._createFBO(bw, bh, false);
    this.bloomB = this._createFBO(bw, bh, false);
    this.bloomReady = !!(this.sceneFBO && this.bloomA && this.bloomB);
  }

  _initStarfield(count) {
    const gl = this.gl;
    const arr = [];
    for (let i = 0; i < count; i++) {
      let x = rand(-88, 88);
      let y = rand(-40, 56);
      if (Math.abs(x) < 12 && Math.abs(y) < 9) x += (x < 0 ? -15 : 15);
      const z = rand(0, 240);
      const t = Math.random();
      const col = t < 0.25 ? [1.0, 0.88, 0.65] : t < 0.62 ? [0.74, 0.92, 1.0] : [0.96, 0.98, 1.0];
      arr.push(x, y, z, 0, col[0], col[1], col[2]);
      arr.push(x, y, z, 1, col[0], col[1], col[2]);
    }
    this.starCount = count * 2;
    this.starVbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.starVbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);
  }

  // Bakes a lush 5-octave procedural Nebula + Milky Way + Star Clusters sky texture ONCE per region!
  bakeRegionSky(skyConfig) {
    if (!this.skyFBO) return;
    if (this._lastSkySeed === skyConfig.seed) return;
    this._lastSkySeed = skyConfig.seed;

    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.skyFBO.fbo);
    gl.viewport(0, 0, this.skyFBO.w, this.skyFBO.h);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);

    gl.useProgram(this.bakeProg);
    gl.uniform3fv(this.bakeLoc.uBgColor, skyConfig.bg);
    gl.uniform3fv(this.bakeLoc.uNebulaA, skyConfig.nebulaA);
    gl.uniform3fv(this.bakeLoc.uNebulaB, skyConfig.nebulaB);
    gl.uniform3fv(this.bakeLoc.uNebulaC, skyConfig.nebulaC);
    gl.uniform1f(this.bakeLoc.uSeed, skyConfig.seed);
    gl.uniform1f(this.bakeLoc.uStarDensity, skyConfig.starDensity || 1.0);

    this._setAttribs(1);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVbo);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
  }

  resize(w, h, rawDpr) {
    this.width = Math.max(1, w);
    this.height = Math.max(1, h);
    const cap = this.quality === 'high' ? 1.75 : this.quality === 'medium' ? 1.35 : 1.0;
    this.dpr = Math.min(rawDpr || 1, cap);
    const cw = Math.max(1, Math.floor(this.width * this.dpr));
    const ch = Math.max(1, Math.floor(this.height * this.dpr));
    if (this.canvas.width !== cw || this.canvas.height !== ch) {
      this.canvas.width = cw;
      this.canvas.height = ch;
      this._rebuildPostFBOs();
    }
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  beginFrame(env, camPos, viewMat, viewProj, fovRad, aspect, warpFlash = 0) {
    const gl = this.gl;
    this._currentViewProj = viewProj;
    this._currentCamPos = camPos;
    this._currentEnv = env;
    this.billCount = 0;

    // Extract camera basis vectors directly from column-major viewMat
    this._camRight[0] = viewMat[0]; this._camRight[1] = viewMat[4]; this._camRight[2] = viewMat[8];
    this._camUp[0]    = viewMat[1]; this._camUp[1]    = viewMat[5]; this._camUp[2]    = viewMat[9];
    this._camFwd[0]   = -viewMat[2]; this._camFwd[1]  = -viewMat[6]; this._camFwd[2]  = -viewMat[10];

    if (this.bloomReady) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneFBO.fbo);
      gl.viewport(0, 0, this.sceneFBO.w, this.sceneFBO.h);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    gl.depthMask(true);
    gl.clearColor(env.fog[0], env.fog[1], env.fog[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 1. Draw Baked Deep-Space Nebula Skybox + Live Solar Corona
    if (this.skyFBO) {
      gl.depthMask(false);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.useProgram(this.skyProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.skyFBO.tex);
      gl.uniform1i(this.skyLoc.uSkyTex, 0);
      gl.uniform3fv(this.skyLoc.uCamRight, this._camRight);
      gl.uniform3fv(this.skyLoc.uCamUp, this._camUp);
      gl.uniform3fv(this.skyLoc.uCamFwd, this._camFwd);
      gl.uniform1f(this.skyLoc.uTanHalfFov, Math.tan(fovRad * 0.5));
      gl.uniform1f(this.skyLoc.uAspect, aspect);
      gl.uniform3fv(this.skyLoc.uSunDir, env.sunDir || env.lightDir);
      gl.uniform3fv(this.skyLoc.uSunColor, env.sunTint || env.lightCol);
      gl.uniform1f(this.skyLoc.uWarpFlash, warpFlash);
      this._setAttribs(1);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVbo);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.depthMask(true);
    }

    // Prepare main PBR-lite mesh program
    this._useMeshProgram(env, camPos, viewProj);
  }

  _useMeshProgram(env, camPos, viewProj) {
    const gl = this.gl;
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
    this._setAttribs(4);
  }

  setFogRange(near, far) {
    this.gl.useProgram(this.meshProg);
    this.gl.uniform1f(this.mLoc.uFogNear, near);
    this.gl.uniform1f(this.mLoc.uFogFar, far);
  }

  setBlendMode(additive = false) {
    const gl = this.gl;
    if (additive) {
      gl.depthMask(false);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    } else {
      gl.depthMask(true);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
  }

  drawMesh(mesh, modelMat, tint = [1, 1, 1], flash = 0, alpha = 1, damage = 0) {
    const gl = this.gl;
    const loc = this.mLoc;
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
    const stride = 48;
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 12);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, stride, 24);
    gl.vertexAttribPointer(3, 3, gl.FLOAT, false, stride, 36);

    Mat4.normalMat3(this._normalMat, modelMat);
    gl.uniformMatrix4fv(loc.uModel, false, modelMat);
    gl.uniformMatrix3fv(loc.uNormalMat, false, this._normalMat);
    gl.uniform3fv(loc.uTint, tint);
    gl.uniform1f(loc.uFlash, flash);
    gl.uniform1f(loc.uAlpha, alpha);
    gl.uniform1f(loc.uDamage, damage);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
  }

  drawPlanet(modelMat, colA, colB, atmoCol, type, time) {
    const gl = this.gl;
    gl.useProgram(this.planetProg);
    this._setAttribs(2);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.smoothSphere.vbo);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);

    Mat4.normalMat3(this._normalMat, modelMat);
    gl.uniformMatrix4fv(this.pLoc.uModel, false, modelMat);
    gl.uniformMatrix4fv(this.pLoc.uViewProj, false, this._currentViewProj);
    gl.uniformMatrix3fv(this.pLoc.uNormalMat, false, this._normalMat);
    gl.uniform3fv(this.pLoc.uCamPos, this._currentCamPos);
    gl.uniform3fv(this.pLoc.uLightDir, this._currentEnv.lightDir);
    gl.uniform3fv(this.pLoc.uColA, colA);
    gl.uniform3fv(this.pLoc.uColB, colB);
    gl.uniform3fv(this.pLoc.uAtmoCol, atmoCol);
    gl.uniform1f(this.pLoc.uType, type);
    gl.uniform1f(this.pLoc.uTime, time);
    gl.drawArrays(gl.TRIANGLES, 0, this.smoothSphere.count);

    // Restore mesh program
    this._useMeshProgram(this._currentEnv, this._currentCamPos, this._currentViewProj);
  }

  drawShieldDome(modelMat, color, alpha, time, hitDir, hitWave) {
    if (alpha <= 0.01) return;
    const gl = this.gl;
    gl.depthMask(false);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.useProgram(this.shieldProg);
    this._setAttribs(2);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.shieldSphere.vbo);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);

    Mat4.normalMat3(this._normalMat, modelMat);
    gl.uniformMatrix4fv(this.shLoc.uModel, false, modelMat);
    gl.uniformMatrix4fv(this.shLoc.uViewProj, false, this._currentViewProj);
    gl.uniformMatrix3fv(this.shLoc.uNormalMat, false, this._normalMat);
    gl.uniform3fv(this.shLoc.uCamPos, this._currentCamPos);
    gl.uniform3fv(this.shLoc.uColor, color);
    gl.uniform1f(this.shLoc.uAlpha, alpha);
    gl.uniform1f(this.shLoc.uTime, time);
    gl.uniform3fv(this.shLoc.uHitDir, hitDir);
    gl.uniform1f(this.shLoc.uHitWave, hitWave);
    gl.drawArrays(gl.TRIANGLES, 0, this.shieldSphere.count);

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(true);
    this._useMeshProgram(this._currentEnv, this._currentCamPos, this._currentViewProj);
  }

  drawStars(travel, streak) {
    const gl = this.gl;
    gl.depthMask(false);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.useProgram(this.starProg);
    this._setAttribs(3);
    gl.uniformMatrix4fv(this.sLoc.uViewProj, false, this._currentViewProj);
    gl.uniform1f(this.sLoc.uTravel, travel);
    gl.uniform1f(this.sLoc.uStreak, streak);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.starVbo);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 28, 0);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 28, 12);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 28, 16);
    gl.drawArrays(gl.LINES, 0, this.starCount);

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(true);
    this._useMeshProgram(this._currentEnv, this._currentCamPos, this._currentViewProj);
  }

  // Queue a glowing 3D additive particle/flash sprite into the single-draw-call batch
  pushBillboard(x, y, z, size, r, g, b, a) {
    if (this.billCount >= MAX_BILLBOARDS) return;
    let o = this.billCount * 60;
    const d = this.billData;
    const corners = [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1];
    for (let i = 0; i < 6; i++) {
      d[o++] = x; d[o++] = y; d[o++] = z;
      d[o++] = corners[i * 2]; d[o++] = corners[i * 2 + 1];
      d[o++] = size;
      d[o++] = r; d[o++] = g; d[o++] = b; d[o++] = a;
    }
    this.billCount++;
  }

  flushBillboards() {
    if (this.billCount === 0) return;
    const gl = this.gl;
    gl.depthMask(false);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.useProgram(this.billProg);
    this._setAttribs(4);

    gl.uniformMatrix4fv(this.bLoc.uViewProj, false, this._currentViewProj);
    gl.uniform3fv(this.bLoc.uCamRight, this._camRight);
    gl.uniform3fv(this.bLoc.uCamUp, this._camUp);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.billVbo);
    const vertCount = this.billCount * 6;
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.billData.subarray(0, vertCount * 10));
    const stride = 40;
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 12);
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, stride, 20);
    gl.vertexAttribPointer(3, 4, gl.FLOAT, false, stride, 24);
    gl.drawArrays(gl.TRIANGLES, 0, vertCount);

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(true);
    this._useMeshProgram(this._currentEnv, this._currentCamPos, this._currentViewProj);
  }

  // Draw a continuous glowing 3D wingtip / missile contrail ribbon
  drawRibbon(points, count, halfWidth, color, alpha = 0.72) {
    if (count < 2) return;
    const maxPts = Math.min(count, MAX_RIBBON_VERTS >> 1);
    const d = this.ribbonData;
    let o = 0;
    for (let i = 0; i < maxPts; i++) {
      const pt = points[i];
      const t = 1 - i / (maxPts - 1); // 1 at ship tip -> 0 at tail
      const w = halfWidth * t;
      const a = alpha * t * t;
      // Left edge
      d[o++] = pt.x - w; d[o++] = pt.y; d[o++] = pt.z;
      d[o++] = color[0]; d[o++] = color[1]; d[o++] = color[2]; d[o++] = a;
      // Right edge
      d[o++] = pt.x + w; d[o++] = pt.y; d[o++] = pt.z;
      d[o++] = color[0]; d[o++] = color[1]; d[o++] = color[2]; d[o++] = a;
    }

    const gl = this.gl;
    gl.depthMask(false);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.useProgram(this.ribbonProg);
    this._setAttribs(2);
    gl.uniformMatrix4fv(this.rLoc.uViewProj, false, this._currentViewProj);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.ribbonVbo);
    const vCount = maxPts * 2;
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, d.subarray(0, vCount * 7));
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 28, 0);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 28, 12);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vCount);

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(true);
    this._useMeshProgram(this._currentEnv, this._currentCamPos, this._currentViewProj);
  }

  // Finalize frame: flush additive billboards + Selective Half-Res FBO Bloom + ACES Tone Mapping
  endFrame(bloomStrength = 0.65, chromatic = 0) {
    this.flushBillboards();
    if (!this.bloomReady) return;

    const gl = this.gl;
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    this._setAttribs(1);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVbo);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // 1. Bright extract -> bloomA
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomA.fbo);
    gl.viewport(0, 0, this.bloomA.w, this.bloomA.h);
    gl.useProgram(this.brightProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneFBO.tex);
    gl.uniform1i(this.brLoc.uTex, 0);
    gl.uniform1f(this.brLoc.uThreshold, 0.68);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // 2. Horizontal Gaussian blur -> bloomB
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomB.fbo);
    gl.useProgram(this.blurProg);
    gl.bindTexture(gl.TEXTURE_2D, this.bloomA.tex);
    gl.uniform1i(this.blLoc.uTex, 0);
    gl.uniform2f(this.blLoc.uDir, 1.35 / this.bloomA.w, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // 3. Vertical Gaussian blur -> bloomA
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomA.fbo);
    gl.bindTexture(gl.TEXTURE_2D, this.bloomB.tex);
    gl.uniform2f(this.blLoc.uDir, 0, 1.35 / this.bloomA.h);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // 4. Composite Scene + Bloom -> Screen with ACES Filmic Tone Mapping
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.compProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneFBO.tex);
    gl.uniform1i(this.coLoc.uScene, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.bloomA.tex);
    gl.uniform1i(this.coLoc.uBloom, 1);
    gl.uniform1f(this.coLoc.uBloomStrength, bloomStrength);
    gl.uniform1f(this.coLoc.uChromatic, chromatic);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.activeTexture(gl.TEXTURE0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
  }
}
