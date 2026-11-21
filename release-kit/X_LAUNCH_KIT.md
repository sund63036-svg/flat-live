# X (Twitter) launch kit — flat-live

All copy is in English (X's main audience for devtools), with Chinese versions below for reference. Paste-ready.

> **Video assets** (`release-kit/videos/`) — exactly two clips ship in this repo:
> - `demo-yinzi-quickcut-silent.mp4` — 7s, 540×760, **silent / black background**, fast jump-cut of the light-interaction driver. This is the engine output; use it for the public launch. Cover: `poster-yinzi-quickcut.png`.
> - `demo-yinzi-square.mp4` — 9.8s, 1080×1080, moonlit-garden square clip from the **earlier predecessor prototype**, with its original audio. Do **not** describe it as flat-live engine output. Cover: `poster-yinzi-square.png`.
> - Both show the author's original character "Yinzi" with permission. Add credit when posting: "Character art © the author, shown for demo only." Her raw images are not in the repo.
> - The quick-cut clip can be regenerated from the real engine via `demo/record.html` (then strip the audio) — see RECURRING_RELEASE.md.
>
> **Editorial hold:** the separate four-expression study is **not** part of the public set; its expressions need a later pass.

---

## 1. Account setup (you do this — needs your phone / consent)

| Field | Value |
| --- | --- |
| **Display name** | `flat-live · dasheng` |
| **Handle (@)** | Suggest: `@flatlive_dev` or `@dasheng_builds` (check availability) |
| **Bio (EN)** | `Building flat-live: a zero-dependency 2D portrait animation engine. WebGL2, no Cubism. Making characters breathe, blink & talk from one illustration. Open source, independent dev.` |
| **Bio (中文备选)** | `做 flat-live：零依赖的平面立绘驱动引擎。一张图让角色呼吸、眨眼、说话。独立开发 / 开源。` |
| **Location** | Beijing, China |
| **Link** | `https://github.com/sund63036-svg/flat-live` |
| **Avatar** | Use a clean logo, or the Yinzi art with the author's permission (she IS the author's own character; a simple avatar use is fine). If in doubt, use the procedural sample. |
| **Header** | A screenshot of the demo UI + one line: "One illustration. Alive in the browser." |

## 2. Pinned post (paste after you have the repo link)

```
I built a lightweight 2D portrait animation engine: one illustration → a character that breathes, blinks, glances, nods and lip-syncs in real time.

Zero dependencies. WebGL2. No Cubism, no .moc3, no paid API.

MIT open source 👇
https://github.com/sund63036-svg/flat-live
```

## 3. Launch thread (6 posts, post as a connected thread)

**1/6 — Hook + the result**
```
What if one static illustration could breathe, blink, follow your cursor, and talk — without Live2D, without a .moc3 file, and without a single dependency?

Meet flat-live. 🧵
[attach: release-kit/videos/demo-yinzi-quickcut-silent.mp4 — 7s silent quick cut, black background]
```

**2/6 — What it does**
```
Fragment-level 2D deformation + a behavior scheduler:

• breathing anchored low, so the face never stretches
• auto + manual blink
• gaze follow + slight head coupling
• nod / tilt with C2 easing
• volume-driven lip-sync on the original lip line
• smile, shy, delayed hair sway
```

**3/6 — The architecture (the part devs care about)**
```
Two decoupled layers:

driver.js → pose (motion / expression / lips)
renderer.js → WebGL2 uniforms
shader.js → local inverse sampling

All rig coordinates live in one config. New character = new config, no code changes.
```

**4/6 — Honest about the limits**
```
Being real about it:

❌ Not Cubism / no layered binding
❌ No big head turns or hand gestures
❌ Not a chatbot — lip-sync is volume-driven
✅ Built on LivLiv's pose contract (Apache-2.0), reimplemented dependency-free

Lightweight and controllable, not a Cubism replacement.
```

**5/6 — The hard-won lessons (this is the real value)**
```
Things I learned the hard way:

• smile param ≠ visible smile — check the face
• premultiplied alpha or edges get a white plate
• lip-sync must override smile while talking
• ease curves, never hard cuts
• mask needs 3×3 erosion + smoothing
```

**6/6 — Repo + CTA**
```
Repo (MIT):
https://github.com/sund63036-svg/flat-live

Demo character: author's original art, shown with permission. Code is MIT; character is not for reuse.

More motion research here. Follow along. 👀
```

## 4. Hashtags (append to launch posts, keep to 2–4)

```
#WebGL2 #Live2D #indiedev #opensource #frontend #avatar
```

## 5. Post scheduling suggestion

| When | What |
| --- | --- |
| Day 0 (repo live) | Pinned post + launch thread 1/6 |
| Day 0 + 2h | Thread 2/6–6/6 (or all at once as a thread) |
| Day 1 | Re-cut the 14s master into a 10s clip, or post a different segment (blink / tilt / lip-sync close-up). |
| Day 3 | "Under the hood" single post: the rig calibration diagram / code snippet |
| Day 5 | **Moonlit garden** related-work post — attach `demo-yinzi-square.mp4`, from the predecessor prototype (do not call it flat-live output). The engine-output lab #01 post uses `demo-yinzi-quickcut-silent.mp4`. |
| Day 7 | Retrospective: what broke, what's next |

## 6. 中文参考（若发中文圈/X 中文受众）

**首发单条**
```
写了一个轻量的 2D 立绘驱动引擎：一张静态图 → 实时呼吸、眨眼、视线跟随、点头歪头、说话口型。

零依赖、WebGL2、不用 Cubism、不用 .moc3、无付费 API。沿用 LivLiv 的 pose 参数契约，实现部分已重写。

MIT 开源 👇
https://github.com/sund63036-svg/flat-live
```

> Note: X posts have a character limit (280 for free tier). The longer threads above are already split into post-sized chunks; the Chinese one-liner is within limit. Trim if your account has a smaller limit.
