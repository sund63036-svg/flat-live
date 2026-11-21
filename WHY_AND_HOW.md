# Why flat-live? Honest value assessment & how to use it

> 简体中文 | [English](./WHY_AND_HOW.md)

An honest look at where this project does and does not create value — written for potential users and for the launch thread.

---

## 简体中文

### 一、老实说：这类技术多不多？

**多，而且很成熟。** 说清楚竞争格局，免得你被我的演示晃了眼：

| 方案 | 定位 | 我们的对比 |
|---|---|---|
| **Live2D Cubism** | 商业标杆，专业分层绑定，付费编辑器 + 私有 `.moc3` 格式 | 我们免费、无私有格式，但做不了它的精细动作 |
| **LivLiv Player**（我们的技术来源） | 30KB 零依赖 WebGL2 播放器，支持 LivLiv/VRM/PNGTuber 三种格式，带口型/面捕 | 它更完整、star 更多；我们更"裸"、更偏引擎内核 |
| **VRM / three-vrm** | 3D 虚拟形象标准 | 完全另一个赛道 |
| **PNGTuber** | 两张图切换，极简 | 比我们还简单，但只能张嘴闭嘴 |

**结论：让立绘"动起来"本身不是稀缺技术。** 别指望靠这个概念本身惊艳到人。

### 二、那我们的价值到底在哪？

说三条**真实**的，不吹：

**1. 素材门槛可能是最低的之一**
LivLiv 要一个角色包（`model.json` + 多张分层贴图），Cubism 要专业建模。我们**只要 3 张同尺寸 PNG**（睁眼图、闭眼图、alpha 遮罩）。对一个"手里只有一张立绘"的创作者或小程序开发者，这个门槛是真低——有图就能让角色活起来。

**2. 是引擎内核，不是成品播放器**
我们刻意没做播放器：没有角色包格式、没有 UI、没有聊天。给的是 `driver → pose → renderer → shader` 这条干净的链路和 `rig` 参数化标定。想自己掌控交互（接自己的 TTS、自己的 LLM、自己的手势逻辑）的开发者，能直接拿去改。LivLiv 更像"开箱即用的播放器"，我们更像"可拆装的发动机"。

**3. 避坑知识是被低估的部分**
代码和文档里那些细节——下颌刚性区剪切、口型被笑容抵消、alpha 预乘白边、参数非零不等于画面可见、发梢延迟——都是真踩出来的。这部分价值不在于代码行数，而在于**让别人少走弯路**。对教学、对团队内部沉淀，比对终端用户更有价值。

**诚实的总体判断**：技术新颖性**低**（逆向采样形变是成熟做法），工程实用性**中上**（零依赖、三张图即可用），教学/避坑价值**高**（真实踩坑记录），社区差异化**中等**（LivLiv 珠玉在前）。

**这不是一个会爆火的项目，但作为一份开源技术作品、一张"我能做 2D 角色动效引擎"的能力名片，是合格且有说服力的**——尤其配上那段带音乐的动态视频。

### 三、别人怎么用我们的技术？（四条路径，门槛从低到高）

**路径 A：直接体验（零门槛）**
```bash
python3 serve.py --port 8820
# 打开 http://127.0.0.1:8820/ 点按钮
```
适合：先看看效果再决定要不要用。

**路径 B：换上自己的立绘（创作者，不改代码）
1. 准备 3 张同尺寸透明 PNG：睁眼、闭眼、alpha 遮罩
2. 放进 `demo/assets/`（自己新建，git 忽略即可）覆盖，或用 `?asset=real` 时放进 `_private/assets/`
3. 按 README 的"标定 rig"章节，量一量眼睛/嘴/头的位置，填进 `DEFAULT_RIG`
4. 刷新看效果，微调坐标

适合：手里有立绘的画师、VTuber、想做吉祥物的运营。

**路径 C：嵌进自己的网页（开发者）**
```js
import { Driver } from './src/driver.js';
import { Renderer } from './src/renderer.js';
const driver = new Driver();
const renderer = new Renderer(myRig);
renderer.attach(canvas);
await renderer.load({ portrait, blink, mask });
// 你的渲染循环里：
const pose = driver.update(dt, now/1000);
renderer.render(canvas, pose, w, h, dt);
```
说话时把音量喂给 `driver.feedMouth(level)`；接 Web Audio 做真口型，接 TTS/LLM 做对话（这部分我们不做，留给你）。

适合：想给页面里的角色加轻量动效的前端开发者。

**路径 D：改内核做研究（进阶）**
`shader.js` 里的形变函数是纯 GLSL，可以直接改——加新的形变区域、改眼睑曲线、加表情通道。`driver.js` 的动作包络也可以自由扩展。改完用 `demo/record.html` 录一段视频验证。

适合：想研究 2D 形变、想加新动作的人。

**一句话总结给别人听**：
> "给一张立绘，几行代码，就能让它在网页里呼吸眨眼说话。零依赖、MIT、不用 Cubism。"

---

## English

### 1. Honestly: are there already a lot of these?

**Yes, and they're mature.** The competitive landscape, so the demo doesn't blind anyone:

| Approach | Positioning | vs. us |
|---|---|---|
| **Live2D Cubism** | Commercial standard, pro layered binding, paid editor + proprietary `.moc3` | We're free and format-free, but can't match its fine motion |
| **LivLiv Player** (our technical ancestor) | 30KB zero-dependency WebGL2 player, 3 character formats, lip-sync + face tracking | More complete, more stars; ours is barer, more of an engine core |
| **VRM / three-vrm** | 3D avatar standard | Different track entirely |
| **PNGTuber** | Two-image swap, minimal | Even simpler than us, but only mouth open/closed |

**Bottom line: making a portrait move is not scarce technology.** Don't expect the concept alone to amaze people.

### 2. So where is our actual value?

Three **real** points, no hype:

**1. Possibly the lowest asset barrier**
LivLiv needs a character package (`model.json` + layered textures); Cubism needs professional modeling. We need **3 same-sized PNGs** (open eyes, closed eyes, alpha mask). For a creator or small-app developer holding a single illustration, that barrier is genuinely low.

**2. An engine core, not a finished player**
We deliberately didn't build a player: no character package format, no UI, no chat. What we give is a clean `driver → pose → renderer → shader` chain with parameterized `rig` calibration. Developers who want control over interaction (own TTS, own LLM, own gesture logic) can take it and modify it. LivLiv is more "out-of-the-box player"; we're more "a disassemblable engine".

**3. The pitfall knowledge is underrated**
The details in the code and docs — rigid jaw-band shearing, lip-sync cancelled by smile, premultiplied-alpha white edges, non-zero parameter ≠ visible result, delayed hair-follow — were all learned the hard way. The value isn't line count; it's **letting others avoid the same traps**. More useful for teaching and team knowledge capture than for end users.

**Honest overall assessment**: technical novelty **low** (inverse-sampling deformation is established), engineering practicality **upper-mid** (zero-dependency, 3 images and go), teaching/pitfall value **high** (real recorded failures), community differentiation **medium** (LivLiv precedes us).

**This won't be a viral project, but as an open-source technical work and as a "I can build a 2D character animation engine" credential, it's solid and convincing** — especially with the music-backed demo video.

### 3. How can others use it? (four paths, low to high barrier)

**Path A: Just try it (zero barrier)**
```bash
python3 serve.py --port 8820
# open http://127.0.0.1:8820/ and click the buttons
```

**Path B: Swap in your own art (creators, no code)**
1. Prepare 3 same-sized transparent PNGs: open eyes, closed eyes, alpha mask
2. Drop them into `demo/assets/` (create it yourself, git-ignore if needed) or into `_private/assets/` for the `?asset=real` preview
3. Measure eye/mouth/head positions and fill `DEFAULT_RIG` per README
4. Refresh, fine-tune coordinates

**Path C: Embed in your web app (developers)**
```js
import { Driver } from './src/driver.js';
import { Renderer } from './src/renderer.js';
const driver = new Driver();
const renderer = new Renderer(myRig);
renderer.attach(canvas);
await renderer.load({ portrait, blink, mask });
// in your render loop:
const pose = driver.update(dt, now/1000);
renderer.render(canvas, pose, w, h, dt);
```
Feed audio volume into `driver.feedMouth(level)` for lip-sync; wire up Web Audio for real sync, TTS/LLM for conversation (we deliberately don't do this part).

**Path D: Modify the core (researchers)**
The deformation functions in `shader.js` are pure GLSL — add deformation regions, tweak eyelid curves, add expression channels. The motion envelopes in `driver.js` are extensible too. Verify changes by recording a clip with `demo/record.html`.

**One-line pitch to tell others**:
> "Give it one illustration and a few lines of code, and it breathes, blinks and talks in your web page. Zero dependencies, MIT, no Cubism."
