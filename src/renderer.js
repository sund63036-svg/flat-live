/**
 * flat-live / renderer.js
 * WebGL2 渲染器：接收 driver 产出的 pose + 一份角色标定 rig，画出平面立绘。
 *
 * 与 driver.js 完全解耦：本文件不产生任何动作，只执行“把 pose 映射成 uniform 并绘制”。
 * 换角色 = 换素材 + 换 rig 标定，无需改本文件或 shader。
 */

import { VERT, FRAG } from './shader.js';

// 示例角色的默认标定。坐标单位=源图像素，y 向下。
// 注意：这些是“占位示例值”，配默认程序化立绘；真实角色必须重新标定（见 README）。
export const DEFAULT_RIG = {
  width: 1086, height: 1448,
  headPivot:  [543, 590],
  torsoPivot: [551, 990],
  breathPivot:[543, 1050],
  neckBand:   [588, 651, 1350],  // rigTop, rigBottom, blendEnd
  eyeL:       [463, 372],
  eyeR:       [637, 365],
  eyeRadius:  [49, 27],
  mouth:      [554, 496],
  blushL:     [437, 428],
  blushR:     [657, 421],
  eyePatch:   [76, 45],
  headRollMax: 0.07854,      // 约 4.5°
  shoulderRollMax: 0.00785,  // 约 0.45°
  hairLag: 0.28,
  breathScale: 0.012,
  eyeLookX: 7.0,
  eyeLookY: 3.5,
  zoom: false,               // true=放大到上半身特写
};

export class Renderer {
  constructor(rig = {}) {
    this.rig = { ...DEFAULT_RIG, ...rig };
    this.time = 0;
    this.program = null;
    this._rollHist = []; // 头部旋转历史，用于发梢延迟跟随
  }

  attach(canvas) {
    this.gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: true,
    });
    if (!this.gl) throw new Error('flat-live 需要浏览器支持 WebGL2');
    return this;
  }

  async load({ portrait, blink, mask }) {
    const gl = this.gl;
    if (!gl) throw new Error('请先调用 attach(canvas)');
    const files = { portrait, blink, mask };
    const images = await Promise.all(['portrait', 'blink', 'mask'].map(async (name) => {
      const blob = files[name];
      if (!blob) throw new Error('缺少素材：' + name);
      const bmp = await createImageBitmap(blob, {
        premultiplyAlpha: 'none',
        colorSpaceConversion: 'none',
      });
      return bmp;
    }));
    const { width, height } = this.rig;
    if (images.some((im) => im.width !== width || im.height !== height)) {
      throw new Error(`素材尺寸必须与 rig 的 width/height 一致（${width}×${height}）`);
    }

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        throw new Error('shader 编译失败：' + gl.getShaderInfoLog(s));
      }
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    this.program = gl.createProgram();
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      throw new Error('shader 链接失败：' + gl.getProgramInfoLog(this.program));
    }

    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(this.program, 'pos');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);

    this.textures = images.map((im, i) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
      for (const k of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR);
      for (const k of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE);
      im.close();
      return t;
    });

    const names = [
      'uPortrait', 'uBlink', 'uMask', 'uFrame', 'uSize',
      'uAngles', 'uEyes', 'uMotion', 'uFace', 'uTilt',
      'uHeadPivot', 'uTorsoPivot', 'uBreathPivot', 'uNeckBand',
      'uEyeL', 'uEyeR', 'uEyeRadius', 'uMouth', 'uBlushL', 'uBlushR', 'uEyePatch',
      'uHeadRollMax', 'uShoulderRollMax', 'uHairLag', 'uBreathScale', 'uEyeLookX', 'uEyeLookY',
    ];
    this.loc = Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(this.program, n)]));
    return this;
  }

  render(canvas, pose, w, h, dt = 0) {
    if (!this.program) return;
    const gl = this.gl;
    const r = this.rig;
    const p = pose.params;
    this.time += dt;

    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.SCISSOR_TEST);
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    this.textures.forEach((t, i) => {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, t);
    });
    gl.uniform1i(this.loc.uPortrait, 0);
    gl.uniform1i(this.loc.uBlink, 1);
    gl.uniform1i(this.loc.uMask, 2);

    // 取景：按画布比例包住立绘；zoom 模式放大到上半身。
    const sourceAspect = r.width / r.height;
    const viewAspect = w / h;
    let fw, fh;
    if (r.zoom) {
      fw = r.width * 0.68;
      fh = fw / viewAspect;
      if (fh > r.height * 0.72) { fh = r.height * 0.72; fw = fh * viewAspect; }
      gl.uniform4f(this.loc.uFrame, r.headPivot[0] - fw / 2, Math.max(0, r.headPivot[1] - fh * 0.62), fw, fh);
    } else {
      if (viewAspect > sourceAspect) { fh = r.height; fw = fh * viewAspect; }
      else { fw = r.width; fh = fw / viewAspect; }
      gl.uniform4f(this.loc.uFrame, r.width / 2 - fw / 2, r.height / 2 - fh / 2, fw, fh);
    }
    gl.uniform2f(this.loc.uSize, r.width, r.height);

    gl.uniform4f(this.loc.uAngles, p.angleX, p.angleY, p.angleZ, p.bodyX);
    gl.uniform4f(this.loc.uEyes, p.eyeLOpen, p.eyeROpen, p.eyeBallX, p.eyeBallY);
    gl.uniform4f(this.loc.uMotion, pose.move.x, pose.move.y, p.breath, 0);
    gl.uniform4f(this.loc.uFace, p.mouthOpen, p.vowel, Math.max(p.smile, pose.expr.smile || 0), pose.expr.shy || 0);

    // 把 driver 的归一化动作量映射为实际弧度（与 LivLiv 的 angleZ 单位无关）。
    const z = p.angleZ;
    const headRoll = z * r.headRollMax;
    const shoulderRoll = z * r.shoulderRollMax;
    // 发梢用约 0.16 秒前的头部旋转量，形成自然滞后；发根仍与头部同步。
    this._rollHist.push(headRoll);
    if (this._rollHist.length > 32) this._rollHist.shift();
    const lagFrames = Math.max(1, Math.round(0.16 / Math.max(dt, 1 / 60)));
    const hairRoll = this._rollHist[Math.max(0, this._rollHist.length - 1 - lagFrames)] ?? headRoll;
    gl.uniform3f(this.loc.uTilt, headRoll, shoulderRoll, hairRoll);

    gl.uniform2fv(this.loc.uHeadPivot, r.headPivot);
    gl.uniform2fv(this.loc.uTorsoPivot, r.torsoPivot);
    gl.uniform2fv(this.loc.uBreathPivot, r.breathPivot);
    gl.uniform3f(this.loc.uNeckBand, r.neckBand[0], r.neckBand[1], r.neckBand[2]);
    gl.uniform2fv(this.loc.uEyeL, r.eyeL);
    gl.uniform2fv(this.loc.uEyeR, r.eyeR);
    gl.uniform2fv(this.loc.uEyeRadius, r.eyeRadius);
    gl.uniform2fv(this.loc.uMouth, r.mouth);
    gl.uniform2fv(this.loc.uBlushL, r.blushL);
    gl.uniform2fv(this.loc.uBlushR, r.blushR);
    gl.uniform2fv(this.loc.uEyePatch, r.eyePatch);
    gl.uniform1f(this.loc.uHeadRollMax, r.headRollMax);
    gl.uniform1f(this.loc.uShoulderRollMax, r.shoulderRollMax);
    gl.uniform1f(this.loc.uHairLag, r.hairLag);
    gl.uniform1f(this.loc.uBreathScale, r.breathScale);
    gl.uniform1f(this.loc.uEyeLookX, r.eyeLookX);
    gl.uniform1f(this.loc.uEyeLookY, r.eyeLookY);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose() {
    const gl = this.gl;
    if (!gl) return;
    for (const t of this.textures || []) gl.deleteTexture(t);
    if (this.buffer) gl.deleteBuffer(this.buffer);
    if (this.vao) gl.deleteVertexArray(this.vao);
    if (this.program) gl.deleteProgram(this.program);
    this.program = null;
  }
}

export default Renderer;
