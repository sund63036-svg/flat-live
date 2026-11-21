# flat-live

> [简体中文](./README.zh-CN.md) | English

**A 2D portrait animation engine** — Turn a single static illustration (plus one closed-eye reference) into a character that breathes, blinks, glances, nods, tilts, and talks in real time, right in the browser.

Pure JavaScript + WebGL2. Zero runtime dependencies, zero paid API calls, runs entirely offline. The engine and the live demo need **no bundled artwork at all** — the demo uses a procedurally generated, royalty-free sample. The two promo videos feature the author's original character "Yinzi" (shown with permission).

## Promo videos (two clips)

**1. Quick cut — silent, black background (7s)**

<video src="./release-kit/videos/demo-yinzi-quickcut-silent.mp4" controls width="420" poster="./release-kit/videos/poster-yinzi-quickcut.png"></video>

A fast jump-cut of the light-interaction driver: breathing → blink → gaze → tilt → nod → lip-sync. Deliberately **silent** and on a plain black plate so the motion itself is the focus.

**2. Moonlit garden — square, with original audio (9.8s, 1080×1080)**

<video src="./release-kit/videos/demo-yinzi-square.mp4" controls width="420" poster="./release-kit/videos/poster-yinzi-square.png"></video>

A square-format scene clip from the earlier moonlit-garden prototype (the predecessor project this engine grew out of), included as related work with its original audio. It is **not** a capture of this zero-dependency engine.

> Both clips show the author's original character "Yinzi", with permission — **view only; the character itself is not for reuse** (see [ASSET_LICENSE.md](./ASSET_LICENSE.md)). Her raw images are not in this repository. The live demo itself uses the royalty-free procedural sample.

> **Editorial note:** a separate four-expression study is **not part of the reviewed public set** and is held back for a later revision pass.

---

## What it is / what it is not

**It is** a **2D fragment-level deformation renderer plus a behavioral scheduler**. The core idea is local inverse-sampling deformation of the source artwork, with parameters driving blinking, gaze, subtle head rotation, lip-sync, and expressions.

**It is not**:
- ❌ Not a Live2D / Cubism model — no `.moc3`, no official layered binding.
- ❌ No large-angle head turns, waving, fist clenches, or full hand gestures — side views and hands that don't exist in the source art cannot be invented.
- ❌ Not a chatbot. It only makes the character move; lip movement is driven by external audio volume. Which TTS or LLM you plug in is up to you.

If you need a professional multi-pose character, use Cubism. If you need **lightweight, free, controllable 2D character animation**, this is enough.

## Features

- Breathing scale (anchored at the lower body, so the face is not stretched)
- Automatic + manual blinking (eyelid deformation + closed-eye image blend)
- Gaze following (local pupil shift) with subtle head coupling
- Nodding and head tilt (C2-continuous easing envelopes, no hard cuts)
- Lip-sync (opens along the original lip line + procedural mouth cavity / teeth / tongue, volume-driven)
- Smile and shy (local tint and sheen, without changing facial proportions)
- Delayed hair-follow (natural sway with a 0.16 s lag)
- Full reset on background / stop — no late motions or lingering audio state

All motion parameters live in `driver.js`; all deformation coordinates live in `DEFAULT_RIG` in `renderer.js`. The two are fully decoupled.

## Why this exists / how to use it

An honest value assessment (including where it does *not* add value versus Cubism / LivLiv / PNGTuber) and four integration paths — from "just try the demo" to "modify the shader" — are in [WHY_AND_HOW.md](./WHY_AND_HOW.md).

## Quick start

Only Python is needed (standard library, no `pip install`):

```bash
python3 serve.py --port 8820
# open http://127.0.0.1:8820/
```

The live demo runs on the **procedurally generated, royalty-free sample** from `src/sample-art.js` — no character assets ship with the code, so there is nothing to worry about licensing-wise. Click the buttons to try each motion.

The two promo clips (`release-kit/videos/demo-yinzi-quickcut-silent.mp4` and `demo-yinzi-square.mp4`) show the author's original "Yinzi" — **in videos/cover art only, never in the technical package**. To preview her locally, drop your own images into `_private/assets/` (git-ignored) and open the demo with `?asset=real`, or use `demo/record.html?asset=real` to record new clips. See [ASSET_LICENSE.md](./ASSET_LICENSE.md).

## Bring your own character

### 1. Prepare three same-sized PNGs

| File | Description |
| --- | --- |
| `portrait` | Open-eye artwork. **No background** — everything outside the character silhouette must be transparent. |
| `blink` | Closed-eye reference. Size, framing, and face shape must match `portrait` exactly; only the eyes differ. |
| `mask` | Silhouette alpha reference (usually saved from the `portrait` alpha channel). Used to clean edges after deformation. |

All three must be **pixel-for-pixel identical in size and framing**. This is the most common source of failure.

### 2. Calibrate the rig

In `DEFAULT_RIG` in `src/renderer.js`, fill in pixel coordinates from your artwork (y points downward):

```js
{
  width, height,          // source image pixel size
  headPivot:  [x, y],     // head rotation center, around the neck
  torsoPivot: [x, y],     // torso rotation center, around the chest
  breathPivot:[x, y],     // breathing anchor, around the waist/hem
  neckBand:   [rigTop, rigBottom, blendEnd], // rigid head bottom -> neck blend -> clothing
  eyeL: [x, y], eyeR: [x, y],   // eye centers
  eyeRadius: [rx, ry],          // eye deformation ellipse radii
  mouth: [x, y],                // mouth center
  blushL, blushR,               // blush centers
  headRollMax: 0.07854,         // actual radians at full tilt (~4.5 degrees)
  ...
}
```

Switching characters (or canvas size) **requires recalibration** — coordinates are hand-tuned per character and cannot be copied over.

### 3. Wire it up

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

For speech, feed audio volume (0–1) into `driver.feedMouth(level)` to drive the lips; `driver.speak(true/false)` marks the state. Call `driver.reset()` when switching characters, stopping, or backgrounding to clear all state.

## Pitfall checklist (from real experience)

1. **Check the static restoration first**: disable all motion, center the parameters, and align with the original art. If the face shape or features are already distorted, fix the assets and calibration before stacking motion.
2. **Non-zero parameter ≠ visible on screen**: `smile=1` doesn't mean a smile is visible. Always check at full size and with a close-up of the face.
3. **Don't let the smile cancel the lip-sync**: during speech, let the mouth open/close take priority, then ease back to the smile at the end of the sentence.
4. **Use premultiplied alpha**: transparent pixels must not leave a white plate; the mask needs a 3×3 erosion then smoothing to avoid white edges after deformation.
5. **No hard cuts in motion curves**: use ease-in → hold → ease-out, and avoid two motions fighting over the same parameter on the way back.
6. **Amplitude is limited by the source art**: with no side view or hands, don't fake a head turn by shifting the whole face sideways.
7. **Be restrained with voice/face changes**: expression tuning ≠ face swapping; lip-sync is a volume envelope, not precise phoneme synchronization.

## Project structure

```
flat-live/
├── index.html          # demo page
├── demo/
│   ├── record.html     # recorder (captureStream + Web Audio soundtrack)
│       ├── portrait.png / blink.png / mask.png
├── release-kit/        # GitHub/X launch & recurring-release materials
│   └── videos/         # exactly two promo MP4s: silent quick-cut + square garden clip (+ their covers)
├── serve.py            # minimal local static server (stdlib)
├── src/
│   ├── shader.js       # WebGL2 deformation shader (core)
│   ├── renderer.js     # renderer + default rig calibration
│   ├── driver.js       # behavioral scheduler (motion/expression/lip state machine)
│   └── sample-art.js   # procedural original sample art (royalty-free fallback)
└── README.md / README.zh-CN.md / LICENSE / ASSET_LICENSE.md
```

## Acknowledgments / technical provenance

This project is **not written entirely from scratch**. It builds on [LivLiv Player](https://github.com/livliv-dev/player) (Apache-2.0) — we follow its pose parameter contract and its "Body renderer + Player scheduler" architecture, but re-implemented both as a zero-dependency version. The underlying 2D deformation algorithms come from a predecessor character project we built on LivLiv's Body interface.

See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) for the full, honest disclosure of what is ours and what is not.

## License (important: code, provenance and assets are separate)

- **Our original source code**: MIT — see [LICENSE](./LICENSE). Free to use, modify, and commercialize. Provenance and third-party influences are disclosed in [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
- **Sample character "Yinzi"**: the author's original art, **shown with permission in promo videos only** — see [ASSET_LICENSE.md](./ASSET_LICENSE.md). Her raw images are NOT in this repository (`_private/` is git-ignored); the live demo uses the royalty-free procedural sample. You may not reuse the character yourself.
