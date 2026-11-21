/**
 * flat-live / sample-art.js
 * 程序化生成的原创示例立绘——三张 Canvas → Blob：portrait / blink / mask。
 *
 * 目的：让仓库零素材依赖、开箱即跑，且不涉及任何第三方角色版权。
 * 这是刻意画得简单的“占位脸”，只用于演示形变驱动；真实项目请替换为自己的原画。
 * 生成尺寸与 DEFAULT_RIG 对齐（1086×1448）。
 */

const W = 1086, H = 1448;

function makeCanvas() {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  return c;
}

// 画一张脸。blink=true 时画闭眼。所有坐标与 DEFAULT_RIG 的标定一致。
function drawFace(ctx, blink) {
  ctx.clearRect(0, 0, W, H);

  // ---- 肩颈与衣服 ----
  ctx.fillStyle = '#e9e3f5';
  ctx.beginPath();
  ctx.moveTo(230, 1448);
  ctx.bezierCurveTo(235, 1180, 360, 1090, 470, 1060);
  ctx.lineTo(616, 1060);
  ctx.bezierCurveTo(726, 1090, 851, 1180, 856, 1448);
  ctx.closePath();
  ctx.fill();
  // 领口
  ctx.fillStyle = '#cfc4e8';
  ctx.beginPath();
  ctx.moveTo(470, 1060);
  ctx.quadraticCurveTo(543, 1120, 616, 1060);
  ctx.lineTo(600, 1040);
  ctx.quadraticCurveTo(543, 1085, 486, 1040);
  ctx.closePath();
  ctx.fill();
  // 脖子（上端伸进脸内，避免脸下缘与脖子之间露底）
  ctx.fillStyle = '#f6d9cd';
  ctx.fillRect(505, 740, 76, 335);

  // ---- 后发（大块，盖住脸两侧与肩） ----
  ctx.fillStyle = '#b9a7d6';
  ctx.beginPath();
  ctx.moveTo(360, 300);
  ctx.bezierCurveTo(330, 620, 300, 900, 330, 1240);
  ctx.lineTo(400, 1240);
  ctx.bezierCurveTo(380, 900, 400, 620, 420, 380);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(726, 300);
  ctx.bezierCurveTo(756, 620, 786, 900, 756, 1240);
  ctx.lineTo(686, 1240);
  ctx.bezierCurveTo(706, 900, 686, 620, 666, 380);
  ctx.closePath();
  ctx.fill();

  // ---- 脸 ----
  ctx.fillStyle = '#fdeade';
  ctx.beginPath();
  ctx.ellipse(543, 560, 190, 230, 0, 0, Math.PI * 2);
  ctx.fill();

  // ---- 眼睛 ----
  const eyes = [[463, 372], [637, 365]];
  for (const [ex, ey] of eyes) {
    if (blink) {
      ctx.strokeStyle = '#5b4a6b';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ex - 42, ey + 2);
      ctx.quadraticCurveTo(ex, ey + 20, ex + 42, ey - 3);
      ctx.stroke();
    } else {
      // 眼白
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(ex, ey, 46, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      // 虹膜
      ctx.fillStyle = '#6a5fa8';
      ctx.beginPath();
      ctx.arc(ex, ey, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2d2447';
      ctx.beginPath();
      ctx.arc(ex, ey, 10, 0, Math.PI * 2);
      ctx.fill();
      // 高光
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex - 7, ey - 8, 6, 0, Math.PI * 2);
      ctx.fill();
      // 上眼睑线
      ctx.strokeStyle = '#5b4a6b';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(ex, ey, 46, 26, 0, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
    }
  }

  // ---- 眉毛 ----
  ctx.strokeStyle = '#a08fbe';
  ctx.lineWidth = 6;
  for (const [ex, ey] of [[463, 330], [637, 324]]) {
    ctx.beginPath();
    ctx.moveTo(ex - 30, ey);
    ctx.quadraticCurveTo(ex, ey - 14, ex + 30, ey);
    ctx.stroke();
  }

  // ---- 鼻、嘴 ----
  ctx.fillStyle = '#d9a98f';
  ctx.beginPath();
  ctx.arc(543, 450, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b96b78';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(526, 496);
  ctx.quadraticCurveTo(543, 503, 560, 496);
  ctx.stroke();

  // ---- 前发/刘海 ----
  ctx.fillStyle = '#c4b3de';
  ctx.beginPath();
  ctx.moveTo(355, 470);
  ctx.bezierCurveTo(350, 250, 430, 205, 543, 205);
  ctx.bezierCurveTo(656, 205, 736, 250, 731, 470);
  ctx.bezierCurveTo(700, 360, 660, 320, 610, 320);
  ctx.bezierCurveTo(600, 380, 560, 420, 543, 430);
  ctx.bezierCurveTo(520, 380, 480, 350, 455, 330);
  ctx.bezierCurveTo(420, 360, 385, 410, 355, 470);
  ctx.closePath();
  ctx.fill();
}

function toBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

/** 生成三张素材 Blob。mask 用同一张脸的 alpha 轮廓（这里直接用睁眼图，shader 取其 alpha）。 */
export async function createSampleAssets() {
  const open = makeCanvas();
  drawFace(open.getContext('2d'), false);
  const closed = makeCanvas();
  drawFace(closed.getContext('2d'), true);

  const [portrait, blink, mask] = await Promise.all([
    toBlob(open), toBlob(closed), toBlob(open),
  ]);
  return { portrait, blink, mask };
}

export default createSampleAssets;
