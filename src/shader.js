/**
 * flat-live / shader.js
 * WebGL2 片元着色器：对一张平面立绘做局部网格（片元级）形变。
 *
 * 这是本项目的技术内核——用片元逆向采样代替真正的网格绑定：
 *  1. 呼吸缩放（围绕下半身支点）
 *  2. 头部刚性旋转 + 颈部过渡（脸/耳/整块下颌保持刚性）
 *  3. 自由发梢延迟跟随
 *  4. 眨眼（眼睑形变 + 闭眼参考图混合）
 *  5. 视线（瞳孔/虹膜局部位移）
 *  6. 口型（沿原唇线张合 + 口腔/牙齿/舌头程序合成）
 *  7. 腮红与微笑光泽
 *
 * 所有角色相关坐标都通过 uniform 传入（见 renderer.js 的 DEFAULT_RIG），
 * 换角色只需提供新配置，不改 shader、不改 js。
 *
 * 重要边界：这是 2D 逆向采样形变，不是 Cubism 分层绑定，
 * 没有真实侧面/遮挡补全/独立手臂手掌，不能做大幅转头或复杂手势。
 */

export const VERT = `#version 300 es
in vec2 pos;
out vec2 uv;
void main(){
  uv = vec2((pos.x + 1.0) * 0.5, (1.0 - pos.y) * 0.5);
  gl_Position = vec4(pos, 0.0, 1.0);
}`;

export const FRAG = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 color;

uniform sampler2D uPortrait;   // 睁眼原图
uniform sampler2D uBlink;      // 闭眼参考图（同尺寸）
uniform sampler2D uMask;       // alpha 轮廓参考（同尺寸）

uniform vec4 uFrame;     // 取样窗口 x,y,w,h（源图像素坐标）
uniform vec2 uSize;      // 源图尺寸 w,h

// 姿态参数（来自 driver.js）
uniform vec4 uAngles;    // angleX, angleY, angleZ, bodyX
uniform vec4 uEyes;      // eyeLOpen, eyeROpen, eyeBallX, eyeBallY
uniform vec4 uMotion;    // move.x, move.y, breath, 0
uniform vec4 uFace;      // mouthOpen, vowel, smile, shy
uniform vec3 uTilt;      // headRoll, shoulderRoll, hairLagRoll（弧度）

// 角色标定（像素坐标，单位=源图）
uniform vec2 uHeadPivot;   // 头部旋转中心
uniform vec2 uTorsoPivot;  // 躯干旋转中心
uniform vec2 uBreathPivot; // 呼吸缩放支点
uniform vec3 uNeckBand;    // 颈部刚性→过渡的 y 区间 (rigTop, rigBottom, blendEnd)
uniform vec2 uEyeL;        // 左眼中心
uniform vec2 uEyeR;        // 右眼中心
uniform vec2 uEyeRadius;   // 眼权重椭圆半径 x,y
uniform vec2 uMouth;       // 嘴中心
uniform vec2 uBlushL;      // 左腮红中心
uniform vec2 uBlushR;      // 右腮红中心
uniform vec2 uEyePatch;    // 闭眼混合斑块半径 x,y（左右共用）
uniform float uHeadRollMax;    // angleZ=1 时的头部弧度
uniform float uShoulderRollMax;// angleZ=1 时的肩部弧度
uniform float uHairLag;        // 发梢延迟强度
uniform float uBreathScale;    // breath=1 时的缩放比例增量
uniform float uEyeLookX;       // 视线横向像素幅度
uniform float uEyeLookY;       // 视线纵向像素幅度

float patchWeight(vec2 p, vec2 c, vec2 r){
  return 1.0 - smoothstep(0.72, 1.0, length((p - c) / r));
}
float eyeWeight(vec2 p, vec2 c){
  float d = length((p - c) / uEyeRadius);
  return pow(max(0.0, 1.0 - d * d), 2.0);
}
// 眼睑形变：把眼部像素重映射到闭合曲线；blink=1 完全闭眼。
float blinkY(vec2 p, vec2 c, float blink){
  float k = blink * (1.0 - smoothstep(uEyeRadius.x * 0.86, uEyeRadius.x * 1.39, abs(p.x - c.x)));
  float x = clamp((p.x - c.x) / uEyeRadius.x, -1.0, 1.0);
  float upper  = c.y - uEyeRadius.y * 0.74 + x * x * uEyeRadius.y * 0.55;
  float lower  = c.y + uEyeRadius.y * 0.74 - x * x * uEyeRadius.y * 0.44;
  float top    = c.y - uEyeRadius.y * 1.63;
  float bottom = c.y + uEyeRadius.y * 1.55;
  float u = mix(upper, c.y + uEyeRadius.y * 0.67, k);
  float l = mix(lower, c.y + uEyeRadius.y * 0.78, k);
  if(p.y < top || p.y > bottom) return p.y;
  if(p.y < u) return mix(top, upper, (p.y - top) / max(0.001, u - top));
  if(p.y < l) return mix(upper, lower, (p.y - u) / max(0.001, l - u));
  return mix(lower, bottom, (p.y - l) / max(0.001, bottom - l));
}

void main(){
  vec2 p = uFrame.xy + uv * uFrame.zw;

  // 1) 呼吸缩放（围绕下半身支点）。
  p = (p - uBreathPivot) / (1.0 + uMotion.z * uBreathScale) + uBreathPivot;
  // 整体位移（move.y 向上为正）。
  p.y += uMotion.y * uSize.y;
  p.x -= uMotion.x * uSize.x;

  // 2) 肩部微跟随：围绕躯干支点的小幅逆旋转，向下递减。
  float torsoWeight = 1.0 - smoothstep(uNeckBand.z * 0.6, uNeckBand.z, p.y);
  float torsoRoll = uTilt.y * torsoWeight;
  vec2 td = p - uTorsoPivot;
  p = vec2(cos(torsoRoll) * td.x + sin(torsoRoll) * td.y,
          -sin(torsoRoll) * td.x + cos(torsoRoll) * td.y) + uTorsoPivot;
  vec2 rest = p;

  // 3) 头部刚性旋转：脸/耳/整块下颌一起转，只在颈部以下渐变混合。
  float neckWeight = 1.0 - smoothstep(uNeckBand.x, uNeckBand.y, p.y);
  vec2 d = rest - uHeadPivot;
  float roll = uTilt.x;
  vec2 rotated = vec2(cos(roll) * d.x + sin(roll) * d.y,
                      -sin(roll) * d.x + cos(roll) * d.y) + uHeadPivot;
  rotated.x -= uAngles.x * 0.23;
  rotated.y -= uAngles.y * 0.10;
  p = mix(rest, rotated, neckWeight);

  // 4) 自由发梢延迟：仅头部下方的发丝跟随，发根不动。
  float hairSide = smoothstep(uEyeRadius.x * 1.8, uEyeRadius.x * 3.4, abs(rest.x - uHeadPivot.x));
  float freeHair = hairSide * smoothstep(uNeckBand.y, uNeckBand.z, rest.y);
  p.x += (uTilt.z - uTilt.x) * (rest.y - uHeadPivot.y) * freeHair * uHairLag;

  vec2 q = p;

  // 5) 眨眼 + 6) 视线。
  vec2 ec = p.x < uSize.x * 0.5 ? uEyeL : uEyeR;
  float blink = p.x < uSize.x * 0.5 ? 1.0 - uEyes.x : 1.0 - uEyes.y;
  q.y = blinkY(p, ec, blink);
  q -= uEyes.zw * vec2(uEyeLookX, uEyeLookY) * eyeWeight(q, ec) * (1.0 - blink);

  // 7) 口型：沿原唇线张合，口腔内部程序合成（保留原唇轮廓）。
  float mouth = clamp(uFace.x, 0.0, 1.0);
  float halfWidth = uEyeRadius.x * 0.82 + uFace.y * uEyeRadius.x * 0.10 + uFace.z * uEyeRadius.x * 0.04;
  float nx = (p.x - uMouth.x) / max(1.0, halfWidth);
  float arch = pow(max(0.0, 1.0 - nx * nx), 0.7);
  float line = uMouth.y + 3.0 * max(0.0, 1.0 - nx * nx) - 0.035 * (p.x - uMouth.x);
  float gap = mouth * (15.0 - uFace.y * 3.0) * arch;
  float upper = line - gap * 0.25;
  float lower = line + gap * 0.75;
  float localMask = (1.0 - smoothstep(halfWidth * 0.95, halfWidth * 1.5, abs(p.x - uMouth.x)))
                  * (1.0 - smoothstep(15.0, 36.0, abs(p.y - line)));
  float shifted = p.y < line ? p.y + gap * 0.25 : p.y - gap * 0.75;
  q.y = mix(q.y, shifted, localMask);

  vec4 a = texture(uPortrait, q / uSize);
  vec4 b = texture(uBlink, p / uSize);
  // 闭眼图只替换眼部斑块；其余像素仍来自原画。
  float bm = max(patchWeight(p, uEyeL, uEyePatch), patchWeight(p, uEyeR, uEyePatch));
  a = mix(a, b, smoothstep(0.78, 1.0, blink) * bm);

  // 口腔内部：暗腔 + 舌头 + 牙齿，仅在张口区域合成。
  if(abs(nx) < 1.0 && gap > 0.2){
    float inside = smoothstep(upper - 0.6, upper + 0.6, p.y) * (1.0 - smoothstep(lower - 0.6, lower + 0.6, p.y));
    float fy = clamp((p.y - upper) / max(gap, 0.01), 0.0, 1.0);
    vec3 cavity = mix(vec3(0.22, 0.065, 0.12), vec3(0.46, 0.16, 0.23), fy);
    float tongue = smoothstep(0.57, 0.90, fy) * (1.0 - smoothstep(0.45, 0.90, abs(nx)));
    cavity = mix(cavity, vec3(0.71, 0.32, 0.40), tongue * 0.8);
    float teeth = (1.0 - smoothstep(0.12, 0.26, fy)) * (1.0 - smoothstep(0.55, 0.82, abs(nx))) * smoothstep(4.0, 9.0, gap);
    cavity = mix(cavity, vec3(0.94, 0.86, 0.85), teeth * 0.9);
    a.rgb = mix(a.rgb, cavity, inside);
  }

  // 腮红与微笑光泽（不改变五官比例）。
  float blush = max(patchWeight(p, uBlushL, vec2(uEyeRadius.x * 1.25, uEyeRadius.y * 1.2)),
                    patchWeight(p, uBlushR, vec2(uEyeRadius.x * 1.18, uEyeRadius.y * 1.16)));
  a.rgb = mix(a.rgb, vec3(1.0, 0.46, 0.60), blush * uFace.w * 0.16);
  a.rgb += vec3(0.012, 0.001, 0.003) * uFace.z * blush;

  // alpha：从参考 mask 取轮廓，3x3 腐蚀后再平滑，避免形变后边缘白边。
  vec2 auv = q / uSize;
  float alpha = texture(uMask, auv).a;
  for(int x = -1; x <= 1; x++) for(int y = -1; y <= 1; y++){
    alpha = min(alpha, texture(uMask, auv + vec2(float(x), float(y)) * 1.15 / uSize).a);
  }
  alpha = smoothstep(0.18, 0.86, alpha);
  alpha *= step(0.0, q.x) * step(q.x, uSize.x) * step(0.0, q.y) * step(q.y, uSize.y);

  // 画布预乘 alpha：透明像素不能留白底。
  color = vec4(a.rgb * alpha, alpha);
}`;

export default { VERT, FRAG };
