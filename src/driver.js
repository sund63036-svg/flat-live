/**
 * flat-live / driver.js
 * 行为调度器：把“要表达什么”翻译成每一帧的姿态参数（pose）。
 *
 * 纯 JavaScript，无依赖。不碰 WebGL、不碰 DOM、不加载素材。
 * 渲染器（renderer.js）只负责把 pose 画出来——两者完全解耦。
 *
 * 设计要点（来自踩坑经验）：
 *  - 所有动作走缓动包络，不做硬截断，不在回正时和别的动作抢同一参数。
 *  - 眨眼、视线、口型各有独立状态，可叠加、可打断，切换/停止后能复位。
 *  - “参数非零”不等于“画面可见”；这里只产参数，视觉效果由渲染器与人工验收负责。
 */

// C2 连续缓动：起止速度都为 0，用于动作包络，避免突兀启停。
export const ease = (t) => {
  t = Math.max(0, Math.min(1, t));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

// 线性插值与带上限的指数趋近（帧率无关的平滑跟随）。
const mix = (a, b, t) => a + (b - a) * t;
const approach = (cur, target, dt, speed) =>
  mix(cur, target, 1 - Math.exp(-Math.max(0, Math.min(dt, 0.1)) * speed));

const DEFAULTS = {
  blinkMinGap: 2.2,        // 自动眨眼最小间隔（秒）
  blinkMaxGap: 5.6,        // 自动眨眼最大间隔（秒）
  blinkDuration: 0.28,     // 一次眨眼总时长
  breathRate: 0.55,        // 呼吸频率（Hz）
  breathAmount: 1.0,       // 呼吸幅度系数
  gazeSpeed: 3.0,          // 视线跟随速度
  mouthAttack: 0.035,      // 口型起音
  mouthRelease: 0.055,     // 口型收音
  nodDuration: 0.9,        // 点头时长
  tiltDuration: 2.8,       // 歪头时长
  idleSwayAmount: 1.0,     // 待机微摆动幅度
};

export class Driver {
  constructor(options = {}) {
    this.opt = { ...DEFAULTS, ...options };
    this.time = 0;

    // 视线目标（-1..1），外部可调；内部 gaze 平滑趋近。
    this.gazeTarget = { x: 0, y: 0 };
    this.gaze = { x: 0, y: 0 };

    // 眨眼：下次自动眨眼的时刻、当前眨眼起始时刻。
    this.nextBlink = this._rollBlinkGap();
    this.blinkStart = -100;

    // 动作：各自独立的起始时刻，互不覆盖（作用于不同参数或加权混合）。
    this.nodStart = -100;
    this.tiltStart = -100;
    this.jumpStart = -100;

    // 口型：外部音量驱动；speakLevel 是已平滑的开度，speaking 仅作状态标记。
    this.speakLevel = 0;
    this.speaking = false;

    // 表情。
    this.exprTarget = { smile: 0, shy: 0 };
    this.expr = { smile: 0, shy: 0 };

    this._pose = this._blankPose();
  }

  _blankPose() {
    return {
      params: {
        angleX: 0, angleY: 0, angleZ: 0, bodyX: 0,
        eyeLOpen: 1, eyeROpen: 1,
        eyeBallX: 0, eyeBallY: 0,
        mouthOpen: 0, vowel: 0,
        breath: 0, smile: 0, shy: 0,
      },
      move: { x: 0, y: 0 },
      expr: { smile: 0, shy: 0 },
    };
  }

  _rollBlinkGap() {
    const { blinkMinGap, blinkMaxGap } = this.opt;
    return this.time + blinkMinGap + Math.random() * (blinkMaxGap - blinkMinGap);
  }

  // ---- 外部控制 API ----------------------------------------------------

  blink() { this.blinkStart = this.time; }

  look(x = 0, y = 0) {
    this.gazeTarget.x = Math.max(-1, Math.min(1, x));
    this.gazeTarget.y = Math.max(-1, Math.min(1, y));
  }

  nod() { this.nodStart = this.time; }
  tilt() { this.tiltStart = this.time; }
  jump() { this.jumpStart = this.time; }

  // 说话开关只标记状态；真正开合由 feedMouth(level) 的音量包络驱动。
  speak(on) {
    this.speaking = !!on;
    if (!on) this.speakLevel = 0;
  }

  // 音量 0..1 → 口型开度，带 attack/release，避免抖动。
  feedMouth(level) {
    const target = Math.max(0, Math.min(1, level));
    const rate = target > this.speakLevel ? this.opt.mouthAttack : this.opt.mouthRelease;
    this.speakLevel = approach(this.speakLevel, target, 1 / 60, 1 / rate);
  }

  setExpression(name, weight = 1) {
    if (name === null || name === undefined) {
      this.exprTarget.smile = 0;
      this.exprTarget.shy = 0;
      return;
    }
    if (name in this.exprTarget) this.exprTarget[name] = Math.max(0, Math.min(1, weight));
  }

  // 后台/停止：清掉所有进行中的状态，避免迟到的动作或眨眼残留。
  reset() {
    this.blinkStart = -100;
    this.nodStart = -100;
    this.tiltStart = -100;
    this.jumpStart = -100;
    this.speakLevel = 0;
    this.speaking = false;
    this.gazeTarget = { x: 0, y: 0 };
    this.exprTarget = { smile: 0, shy: 0 };
    this.nextBlink = this._rollBlinkGap();
  }

  // ---- 每帧推进 --------------------------------------------------------

  update(dt, nowSec) {
    if (Number.isFinite(nowSec)) this.time = nowSec;
    else this.time += Math.max(0, Math.min(dt, 0.1));

    const p = this._pose.params;
    const { opt } = this;

    // 呼吸：正弦，慢速。
    p.breath = Math.sin(this.time * Math.PI * 2 * opt.breathRate) * opt.breathAmount;

    // 视线平滑跟随。
    this.gaze.x = approach(this.gaze.x, this.gazeTarget.x, dt, opt.gazeSpeed);
    this.gaze.y = approach(this.gaze.y, this.gazeTarget.y, dt, opt.gazeSpeed);
    p.eyeBallX = this.gaze.x;
    p.eyeBallY = this.gaze.y;
    p.angleX = this.gaze.x * 5; // 头随视线轻微转动，幅度由渲染器解释

    // 自动眨眼触发。
    if (this.time >= this.nextBlink) {
      this.blink();
      this.nextBlink = this._rollBlinkGap();
    }
    const blinkPhase = (this.time - this.blinkStart) / opt.blinkDuration;
    const blinkVal = blinkPhase >= 0 && blinkPhase <= 1
      ? Math.sin(Math.PI * blinkPhase) ** 1.3
      : 0;
    p.eyeLOpen = 1 - blinkVal;
    p.eyeROpen = 1 - blinkVal;

    // 歪头包络：缓入 → 停留 → 缓回正。
    const tiltPhase = this.time - this.tiltStart;
    let tiltEnv = 0;
    if (tiltPhase >= 0 && tiltPhase < opt.tiltDuration) {
      const T = opt.tiltDuration;
      if (tiltPhase < T * 0.2) tiltEnv = ease(tiltPhase / (T * 0.2));
      else if (tiltPhase < T * 0.55) tiltEnv = 1;
      else tiltEnv = 1 - ease((tiltPhase - T * 0.55) / (T * 0.45));
    }
    p.angleZ = tiltEnv; // 渲染器把它映射到实际弧度

    // 点头包络：一次完整来回。
    const nodPhase = (this.time - this.nodStart) / opt.nodDuration;
    p.angleY = nodPhase >= 0 && nodPhase <= 1 ? Math.sin(Math.PI * nodPhase) : 0;

    // 轻跳：整体上下位移。
    const jumpPhase = (this.time - this.jumpStart) / 0.7;
    this._pose.move.y = jumpPhase >= 0 && jumpPhase <= 1
      ? Math.sin(Math.PI * jumpPhase) * 0.02
      : 0;

    // 待机微摆（呼吸之外的极轻微横向漂移）。
    this._pose.move.x = Math.sin(this.time * 0.37) * 0.004 * opt.idleSwayAmount;

    // 口型：外部音量包络 + 说话时的极轻微附加动作。
    p.mouthOpen = this.speakLevel;
    p.vowel = 0; // 预留：外部可写 0..1 切换元音口型
    if (this.speaking) p.bodyX = this.speakLevel * 0.15;
    else p.bodyX = approach(p.bodyX, 0, dt, 8);

    // 表情平滑趋近，避免瞬间切换。
    this.expr.smile = approach(this.expr.smile, this.exprTarget.smile, dt, 6);
    this.expr.shy = approach(this.expr.shy, this.exprTarget.shy, dt, 6);
    p.smile = this.expr.smile;
    p.shy = this.expr.shy;
    this._pose.expr.smile = this.expr.smile;
    this._pose.expr.shy = this.expr.shy;

    return this._pose;
  }
}

export default Driver;
