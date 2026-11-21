# Recurring release system — shipping new motions

A reusable system so every future motion you research can be published in ~15 minutes instead of rewriting copy from scratch.

---

## 1. The per-motion post template (single post)

Copy this, fill the `[ ]` fields. English primary.

```
New motion: [NAME]

[hook: what it looks like / why it's hard]

• Does: [behavior]
• Driven by: [param / envelope / input]
• Tricky part: [bug solved]
• Limit: [honest boundary]

MIT: https://github.com/sund63036-svg/flat-live
Character art © author, demo only.
#[TAG1] #[TAG2]
```

Attach when posting: a 5–10s clip showing only this motion.

Chinese version:

```
新动作上线：[动作名]

[一句话钩子：效果 / 难点]

• 效果：[一句话行为]
• 驱动方式：[参数 / 包络 / 输入源]
• 踩的坑：[解决的关键问题]
• 边界：[诚实说明限制]

开源地址（MIT）：https://github.com/sund63036-svg/flat-live
[附上：这个动作的 5-10 秒短片]

#[标签1] #[标签2]
```

### Ready-made example: flat-live lab #01 — quick-cut light interaction

This one is already recorded (`release-kit/videos/demo-yinzi-quickcut-silent.mp4`, 7s, silent). Post as-is:

> Note: the separate four-expression montage source is held back for a later expression pass. Use this reviewed quick-cut clip, not that unreleased take.

```
flat-live lab #01: quick-cut light interaction

Breathing → blink → gaze → tilt → nod → lip-sync, cut fast so every motion reads.

Silent and on a plain black plate — the motion is the whole point.
Limit: volume-driven lip-sync, not phoneme-accurate.

Art © author, shown with permission. #WebGL2
```

Attach when posting: `release-kit/videos/demo-yinzi-quickcut-silent.mp4`.

中文版：

```
flat-live lab #01：轻互动快剪

呼吸 → 眨眼 → 视线跟随 → 歪头 → 点头 → 口型，快速跳切让每个动作都看得清。

• 效果：静音、纯黑底，动作就是全部焦点
• 驱动：driver.js 行为调度 + WebGL2 片元级局部形变
• 坑：笑容会抵消说话口型，动作曲线不能硬截断
• 边界：口型由音量包络驱动，不是精准音素同步

形象经作者授权展示，每周更新研究成果。
[附上：release-kit/videos/demo-yinzi-quickcut-silent.mp4]
```

> The other shipped clip, `demo-yinzi-square.mp4`, is from the predecessor moonlit-garden prototype — post it as related work, not as flat-live output.

## 2. The "deep dive" thread template (for bigger research)

Use when a motion involved real R&D (e.g. a new deformation method, a rig breakthrough).

```
1/ The problem: [what looked wrong / what was missing]

2/ First attempt (failed): [what you tried and why it didn't work]
   [attach: the bad version — failures get engagement]

3/ Root cause: [the actual reason, e.g. "the blend band crossed the chin"]

4/ The fix: [what changed, with a code snippet or diagram]

5/ Result: [clip] + honest remaining limits

6/ It's in the repo (MIT): [link] — follow for the next one.
```

## 3. Asset checklist (prepare BEFORE drafting the post)

Every motion post needs these. Keep a folder per motion:

```
release-kit/motions/<motion-name>/
├── clip.mp4          # 5-10s, loopable, shows ONLY this motion
├── still.png         # one frame at the motion's peak
├── notes.md          # filled-in template fields above
└── version.json      # optional: which commit / rig / params produced it
```

Clip rules:
- 5–10 seconds, seamless loop if possible
- Background plain/dark so the motion is the focus
- No audio needed for silent clips (X autoplays muted)
- If showing lip-sync, include a simple waveform overlay so the sync is verifiable

### How to record a clip from the actual engine (no ffmpeg editing needed for most cases)

The repo ships `demo/record.html` — it captures the real canvas via `canvas.captureStream()` and mixes in an original Web Audio soundtrack, then exports a WebM with video+audio. Steps:

1. Open `http://127.0.0.1:8820/demo/record.html?dur=10` (add `&asset=real` to record the Yinzi character — the author may use her freely for project promo).
2. The action timeline is the `beats` array in that file — edit the timestamps/functions to showcase your new motion, set `headRollMax`/etc. in the `Renderer` config for amplitude.
3. It records automatically for `dur` seconds, then exposes the WebM as `window.__REC_DONE__` (bytes). Save via Playwright or the browser console.
4. Convert to MP4 + fix duration + add solid background (removes VP9 alpha edge noise):
   ```bash
   ffmpeg -y -i raw.webm -f lavfi -i "color=c=0x14121b:s=540x760:d=10" \
     -filter_complex "[1:v][0:v]overlay=0:0:format=auto,format=yuv420p[v]" \
     -map "[v]" -map 0:a -c:v libx264 -crf 20 -c:a aac -movflags +faststart -t 10 out.mp4
   ```
5. Either character can be shown publicly for this project: the Yinzi version (`&asset=real`) is the author's own art shown with permission; the procedural version (`?asset=procedural`, the default) is royalty-free. Add a short credit line if posting the Yinzi clip.

## 4. Naming convention (keeps the series coherent)

```
flat-live lab #<NN>: <Motion Name>
e.g. "flat-live lab #01: Delayed Hair Sway"
     "flat-live lab #02: Eye Contact + Micro Smile"
```

Numbering the series makes people follow along and gives accumulate value to each post.

## 5. Suggested cadence

| Rhythm | Effort | What to publish |
| --- | --- | --- |
| Weekly (recommended) | ~15 min/post | One motion or one fix, single post + clip |
| Bi-weekly deep dive | ~1 hr | One "deep dive" thread on a harder problem |
| Monthly roundup | ~20 min | "This month in flat-live" — collect clips + links |

Consistency beats volume. One solid clip a week is enough to grow a dev audience.

## 6. Standard hashtag pool (rotate 2–4 per post)

```
#WebGL2 #Live2D #indiedev #opensource #frontend #avatar
#procedural #animation #gamedev #shaders #MIT
```

## 7. Cross-posting to other platforms (optional, same assets)

| Platform | Adaptation |
| --- | --- |
| GitHub Discussions | Post as "Idea/Show and tell" with the notes.md content |
| Reddit r/webdev / r/gamedev | Lead with the failure/root-cause, link repo (no pure promo) |
| 公众号 / 知乎 | Use the Chinese template, add a code snippet + the "是什么/不是什么" boundary |
| Bilibili | 3–5 min: clip + screen-record the code + explain the pitfall |

---

## Quick-start: your next motion in 5 steps

1. Make a folder `release-kit/motions/<name>/`
2. Record a 5–10s clip + grab one still
3. Fill `notes.md` with the 5 template fields
4. Post with `flat-live lab #<NN>` naming + 2–4 hashtags
5. Commit the motion to the repo (add an entry to CHANGELOG.md if you keep one)
