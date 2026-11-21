# Third-party notices & technical provenance

> 简体中文 / English（本文件含中英两个完整版本）

This project is **not written from scratch**. It stands on the shoulders of existing work. This file honestly discloses every external technical influence so there is no ambiguity about what is ours and what is not.

---

## 简体中文

### 我们实际用了什么别人的东西

| 内容 | 来源 | 许可 | 我们做了什么 |
| --- | --- | --- | --- |
| **pose 参数契约**（`angleX`/`angleY`/`angleZ`/`eyeLOpen`/`eyeBallX`/`mouthOpen`/`smile`/`vowel`/`breath`/`move` 这一整套字段命名与取值范围） | [LivLiv Player](https://github.com/livliv-dev/player) 的 `params` 模块 | Apache-2.0 | `driver.js` 沿用这套字段名以保持兼容；这是接口契约层面的借鉴 |
| **"Body 渲染器 + Player 行为调度"的分层架构思想** | [LivLiv Player](https://github.com/livliv-dev/player) 的公开 `Body` interface | Apache-2.0 | 我们把这一架构**重新实现为零依赖版本**：自研 `driver.js` 替代 `BodyPlayer`，自研 `renderer.js` 替代其加载/渲染管线 |
| **2D 片元逆向采样形变的具体算法**（眼睑形变函数、口型沿唇线张合、腮红与闭眼图混合、mask 腐蚀修边、呼吸缩放支点等） | 本项目前置工程 `silver-body.js`（基于 LivLiv Body 接口实现的银紫角色变形器） | 前置工程自有积累 | 我们把角色专属硬编码坐标抽成 `rig` 配置，重写为通用 shader，并补充发梢延迟的独立实现 |
| **平滑缓动函数**（`t*t*t*(t*(t*6-15)+10)` 等） | 通用图形学惯例（Perlin smootherstep / smoothstep 家族） | 公共数学方法 | 直接采用 |
| 录制与配乐 | Web 原生 API（`canvas.captureStream`、`MediaRecorder`、`Web Audio`） | 平台标准 | 全部自行编写 |

### 必须讲清楚的三点

1. **LivLiv 的 Apache-2.0 要求**：其许可允许使用、修改、再分发，但要求保留版权与许可声明。本项目**没有复制 LivLiv 的代码文件**，只沿用了参数命名与架构思想（接口契约与思想通常不受版权保护，但署名是应有的尊重）。为稳妥起见，在此明确致谢并附官方链接与许可。

2. **底层形变算法来自前置工程**：那些让画面"自然"的细节（下颌刚性区、颈部过渡、口型不被笑容抵消、alpha 预乘白边处理等）是前面调试银紫角色时积累的，不是这次从零想出来的。我们的原创工作在**参数化、去依赖、文档化、避坑知识沉淀**。

3. **本项目 MIT 许可只覆盖我们原创的部分**（`driver.js`、`renderer.js` 的重写、`shader.js` 的通用化改造、`sample-art.js`、`record.html`、文档）。LivLiv 相关权利归其原作者所有；LICENSE 中的 Copyright 仅指本项目作者的原创贡献。

### 致谢

- **LivLiv Player** — https://github.com/livliv-dev/player （Apache-2.0），启发了本项目的角色接口与行为调度分层。
- **前置银紫角色工程** — 提供了 2D 形变算法的实践积累与原型验证。

---

## English

### What we actually used from others

| Item | Source | License | What we did |
| --- | --- | --- | --- |
| **The pose parameter contract** (`angleX`/`angleY`/`angleZ`/`eyeLOpen`/`eyeBallX`/`mouthOpen`/`smile`/`vowel`/`breath`/`move` — the field names and ranges) | [LivLiv Player](https://github.com/livliv-dev/player), `params` module | Apache-2.0 | `driver.js` keeps these field names for compatibility; an interface-contract-level reference |
| **The "Body renderer + Player scheduler" layered architecture** | [LivLiv Player](https://github.com/livliv-dev/player), public `Body` interface | Apache-2.0 | We **re-implemented the architecture as a zero-dependency version**: our own `driver.js` replaces `BodyPlayer`, our own `renderer.js` replaces its load/render pipeline |
| **Specific 2D fragment inverse-sampling deformation algorithms** (eyelid warp, lip-line mouth opening, blush/closed-eye blending, mask erosion edge fix, breathing anchor, etc.) | The predecessor project `silver-body.js` (a character deformation rig built on LivLiv's Body interface) | Predecessor project's own work | We abstracted the character-specific hardcoded coordinates into a `rig` config, rewrote it as a general-purpose shader, and added our own delayed hair-follow implementation |
| **Smoothing functions** (`t*t*t*(t*(t*6-15)+10)`, etc.) | Common graphics practice (Perlin smootherstep / smoothstep family) | Public mathematical method | Adopted as-is |
| Recording & soundtrack | Web platform APIs (`canvas.captureStream`, `MediaRecorder`, `Web Audio`) | Platform standards | Written entirely by us |

### Three things that must be clear

1. **LivLiv's Apache-2.0 terms**: the license permits use, modification, and redistribution, but requires retaining copyright and license notices. This project **did not copy any LivLiv source files** — it only follows the parameter naming and architectural idea (interface contracts and ideas are generally not copyrightable, but crediting is the right thing to do). We therefore acknowledge it explicitly here with the official link and license.

2. **The underlying deformation algorithms come from the predecessor project**: the details that make the image look natural (rigid jaw region, neck blend band, lip-sync not cancelled by smile, premultiplied-alpha white-edge handling, etc.) were accumulated while building the predecessor character, not invented from zero here. Our original work is the **parameterization, de-dependency, documentation, and distillation of the pitfalls**.

3. **This project's MIT License covers only our original parts** (`driver.js`, the rewrite in `renderer.js`, the generalized `shader.js`, `sample-art.js`, `record.html`, docs). LivLiv-related rights belong to their original authors; the Copyright line in LICENSE refers only to this project's author's original contributions.

### Credits

- **LivLiv Player** — https://github.com/livliv-dev/player (Apache-2.0) — inspired the character interface and behavioral-scheduling layering of this project.
- **Predecessor "Yinzi" character project** — provided the practical accumulation and prototype validation of the 2D deformation algorithms.
