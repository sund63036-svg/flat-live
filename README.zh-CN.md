# flat-live

> 简体中文 | [English](./README.md)

**平面立绘驱动引擎** —— 用一张静态立绘 + 一张闭眼参考图，让角色在浏览器里实时呼吸、眨眼、转眼、点头、歪头、说话。

纯 JavaScript + WebGL2，零运行时依赖、零付费调用，全部在本地运行。引擎与在线演示**零素材依赖**——演示页使用程序化生成的无版权示例；仓库内两支宣传视频使用作者的原创形象「银紫」（经授权展示）。

## 宣传视频（两支）

**1. 快剪版 —— 静音、黑底（7 秒）**

<video src="./release-kit/videos/demo-yinzi-quickcut-silent.mp4" controls width="420" poster="./release-kit/videos/poster-yinzi-quickcut.png"></video>

轻互动驱动的快速跳切：呼吸 → 眨眼 → 视线跟随 → 歪头 → 点头 → 说话口型。刻意做成**静音 + 纯黑底**，让动作本身成为焦点。

**2. 月夜花房 —— 方形、含原始声音（9.8 秒，1080×1080）**

<video src="./release-kit/videos/demo-yinzi-square.mp4" controls width="420" poster="./release-kit/videos/poster-yinzi-square.png"></video>

来自更早的月夜花房原型（本引擎的前身工程）的方形场景片段，带原始音轨，作为相关研究一并展示。它**不是**本零依赖引擎的录制。

> 两支视频中的「银紫」均为作者原创形象，经授权展示——**仅供观看，形象本身不可另作他用**（见 [ASSET_LICENSE.zh-CN.md](./ASSET_LICENSE.zh-CN.md)）。她的原始图片不在本仓库；在线演示使用无版权程序化示例。

> **剪辑说明：** 另一条四表情研究素材**暂不进入公开演示集**，表情会在后续再调整。

## 它是什么 / 不是什么

**是**：一套 **2D 片元级形变渲染器 + 行为调度器**。核心思路是对原画做局部逆向采样变形，用参数驱动眨眼、视线、头部轻旋转、口型、表情。

**不是**：
- ❌ 不是 Live2D / Cubism 模型，不读 `.moc3`，没有官方分层绑定。
- ❌ 不能做大角度转头、举手握拳、完整手势——原画里没有的侧面/手掌不会被“生”出来。
- ❌ 不是聊天机器人。它只负责“让形象动起来”；说话开合由外部音量驱动，接什么 TTS / LLM 由你决定。

如果你要的是专业级多姿态角色，请用 Cubism；如果你要的是**轻量、免费、可控的平面形象动效**，这个够用。

## 特性

- 呼吸缩放（下半身支点，不拉伸脸）
- 自动 + 手动眨眼（眼睑形变 + 闭眼图混合）
- 视线跟随（瞳孔局部位移）与头部轻微联动
- 点头、歪头（C2 连续缓动包络，不硬截断）
- 口型（沿原唇线张合 + 口腔/牙齿/舌头程序合成，由音量驱动）
- 微笑、害羞（局部上色与光泽，不改五官比例）
- 发梢延迟跟随（0.16 秒滞后的自然摆动）
- 后台/停止后完全复位，无迟到动作或语音残留

所有动作参数集中在 `driver.js`，所有形变坐标集中在 `renderer.js` 的 `DEFAULT_RIG`，两者解耦。

## 价值与用法

一份诚实的价值评估（包括和 Cubism / LivLiv / PNGTuber 比**哪里没有优势**）以及四条接入路径——从"直接体验"到"改 shader"——见 [WHY_AND_HOW.md](./WHY_AND_HOW.md)（含中文）。

## 快速开始

只需 Python（标准库，无需 pip install）：

```bash
python3 serve.py --port 8820
# 打开 http://127.0.0.1:8820/
```

在线演示页使用 `src/sample-art.js` 程序化生成的**无版权示例形象**——代码包里不含任何角色素材，无需担心版权。点右侧按钮即可体验各项动作。

仓库内两支宣传视频（`release-kit/videos/demo-yinzi-quickcut-silent.mp4` 和 `demo-yinzi-square.mp4`）展示作者原创形象「银紫」——她**只出现在视频/封面，不在技术包内**。本地若想预览，把素材放进 `_private/assets/`（git 忽略），用 `?asset=real` 打开演示页；或用 `demo/record.html?asset=real` 录制新视频。见 [ASSET_LICENSE.zh-CN.md](./ASSET_LICENSE.zh-CN.md)。

## 接入你自己的角色

### 1. 准备三张同尺寸 PNG

| 文件 | 说明 |
| --- | --- |
| `portrait` | 睁眼原画。**不能带背景**，人物轮廓外必须透明。 |
| `blink` | 闭眼参考图，尺寸、取景、脸型必须与 `portrait` 完全一致，只改眼睛。 |
| `mask` | 轮廓 alpha 参考（通常用 `portrait` 的 alpha 通道另存）。用于形变后修边缘。 |

三张必须**像素级同尺寸、同取景**。这是最常见的翻车点。

### 2. 标定 rig

在 `src/renderer.js` 的 `DEFAULT_RIG` 里，按你的原图像素坐标（y 向下）填写：

```js
{
  width, height,          // 原图像素尺寸
  headPivot:  [x, y],     // 头部旋转中心，约在颈部
  torsoPivot: [x, y],     // 躯干旋转中心，约在胸口
  breathPivot:[x, y],     // 呼吸缩放支点，约在腰/下摆
  neckBand:   [rigTop, rigBottom, blendEnd], // 头部刚性区下沿 → 颈部过渡 → 衣服
  eyeL: [x, y], eyeR: [x, y],   // 左右眼中心
  eyeRadius: [rx, ry],          // 眼部形变椭圆半径
  mouth: [x, y],                // 嘴中心
  blushL, blushR,               // 腮红中心
  headRollMax: 0.07854,         // 歪头时实际弧度（约 4.5°）
  ...
}
```

换成新角色（或换画布尺寸）**必须重新标定**——坐标是逐角色手调的，不能照搬。

### 3. 接线

```js
import { Driver } from './src/driver.js';
import { Renderer } from './src/renderer.js';

const driver = new Driver();
const renderer = new Renderer(myRig);
renderer.attach(canvas);
await renderer.load({ portrait: blob1, blink: blob2, mask: blob3 });

function frame(now) {
  const dt = (now - last) / 1000;
  const pose = driver.update(dt, now / 1000);
  renderer.render(canvas, pose, canvas.clientWidth, canvas.clientHeight, dt);
  requestAnimationFrame(frame);
}
```

说话时把音量（0~1）喂给 `driver.feedMouth(level)` 即可驱动口型；`driver.speak(true/false)` 标记状态。切角色、停止或切后台时调用 `driver.reset()` 清空状态。

## 避坑清单（来自真实踩坑）

1. **先看静态还原**：关掉所有动作，参数归中，对齐原画。脸型/五官已变形就先修素材和标定，别急着叠动作。
2. **参数非零 ≠ 画面可见**：`smile=1` 不代表看得到笑容。一定要看原尺寸和脸部近景。
3. **口型别被笑容抵消**：说话时让口型主导开合，句末再缓回笑容。
4. **alpha 用预乘**：透明像素不能留白底；mask 需 3×3 腐蚀后再平滑，避免形变后边缘白边。
5. **别用硬截断做动作曲线**：用缓入—停留—缓回，避免和回正动作抢同一参数。
6. **幅度受原画信息限制**：没有侧面和手掌，就别靠整张脸横移冒充转头。
7. **换声/换脸要克制**：表情优化≠换脸；口型是音量包络，不是精准音素同步。

## 目录结构

```
flat-live/
├── index.html          # 演示页
├── demo/
│   ├── record.html     # 录制页（captureStream + Web Audio 原创配乐）
│       ├── portrait.png / blink.png / mask.png
├── release-kit/        # GitHub/X 发布与长期运营物料
│   └── videos/         # 只有两支宣传 MP4：静音快剪版 + 月夜花房方形版（含各自封面）
├── serve.py            # 本地静态服务（标准库）
├── src/
│   ├── shader.js       # WebGL2 形变着色器（技术内核）
│   ├── renderer.js     # 渲染器 + 默认 rig 标定
│   ├── driver.js       # 行为调度器（动作/表情/口型状态机）
│   └── sample-art.js   # 程序化原创示例立绘（无版权 fallback）
└── README.md / README.zh-CN.md / LICENSE / ASSET_LICENSE.md / ASSET_LICENSE.zh-CN.md
```

## 致谢与技术溯源

本项目**并非完全从零自研**。它借鉴了 [LivLiv Player](https://github.com/livliv-dev/player)（Apache-2.0）的 pose 参数契约与"Body 渲染器 + Player 调度器"架构思想，并把两者**重新实现为零依赖版本**；底层 2D 形变算法来自我们此前基于 LivLiv Body 接口搭建的前置角色工程。完整的"哪些是 ours、哪些不是"诚实披露见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。

## 许可（重要：代码、溯源与素材分开）

- **我们原创的源代码**：MIT —— 见 [LICENSE](./LICENSE)，可自由使用、修改、商用；第三方技术溯源见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。
- **演示形象「银紫」**：作者原创、**仅在宣传视频中经授权展示** —— 见 [ASSET_LICENSE.zh-CN.md](./ASSET_LICENSE.zh-CN.md)。原始图片不在本仓库（`_private/` 已 git 忽略）；在线演示使用无版权程序化示例。不可自行复制、商用或二次使用该形象。
