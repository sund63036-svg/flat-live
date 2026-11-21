# flat-live — GitHub repo setup sheet

Everything you need to paste when creating the repo tomorrow. All fields are copy-paste ready.

---

## 1. Repository basics

| Field | Value |
| --- | --- |
| **Repository name** | `flat-live` |
| **Description** | `A zero-dependency 2D portrait animation engine. Breathe, blink, glance, lip-sync from a single illustration — WebGL2, no Cubism, MIT.` |
| **Visibility** | Public |
| **Initialize with** | Do NOT add a README / LICENSE / .gitignore (this repo already has all three) |
| **Default branch** | `main` |
| **License (GitHub picker)** | MIT License |

## 2. Topics / tags (paste these)

```
2d-animation, webgl2, character-animation, live2d-alternative, avatar,
vanilla-javascript, zero-dependency, frontend, graphics, lip-sync,
procedural-animation, indie-dev, mit-license
```

## 3. First commit message

```
feat: initial release of flat-live 2D portrait animation engine

- WebGL2 fragment-level deformation renderer (shader.js)
- Decoupled behavioral scheduler: breathing/blink/gaze/nod/tilt/lipsync (driver.js)
- Parameterized rig calibration, character-agnostic (renderer.js)
- Procedural royalty-free sample art + demo page
- Dual license: MIT code / author-original demo character shown with permission
```

## 4. git commands (run from the flat-live folder)

```bash
cd flat-live
git init -b main
git add .
git status                      # verify _private/ is NOT listed (git-ignored)
git commit -m "feat: initial release of flat-live 2D portrait animation engine"
git remote add origin https://github.com/sund63036-svg/flat-live.git
git branch -M main
git push -u origin main
```

> ⚠️ Before committing, check `git status` does NOT list `_private/` (Yinzi raw PNGs). The repo intentionally ships no character art — only the promo videos.

## 5. Suggested GitHub README badge line (optional)

Add under the title in README.md if you want a quick status strip:

```markdown
![license](https://img.shields.io/badge/license-MIT-blue)
![deps](https://img.shields.io/badge/dependencies-zero-green)
![webgl](https://img.shields.io/badge/renderer-WebGL2-purple)
```

## 6. Things to double-check before going public

- [ ] Repo URL is `https://github.com/sund63036-svg/flat-live` — placeholders already filled in, no action needed.
- [ ] LICENSE copyright line — currently `Sun Dasheng`. Change to the name you want public.
- [ ] `_private/` is git-ignored (no raw character art in repo); promo videos + ASSET_LICENSE.md present.
- [ ] No screenshots / credentials / `.env` files staged (gitignore now blocks `截屏*.png`, `*.pem`, `*.key`, `.env`).
- [ ] No personal paths / API keys in code (already checked — clean).
- [ ] README English + Chinese switch links both work.
- [ ] Yinzi appears only in promo videos (author's original art, shown with permission). Raw images stay local in `_private/`. See ASSET_LICENSE.md.
