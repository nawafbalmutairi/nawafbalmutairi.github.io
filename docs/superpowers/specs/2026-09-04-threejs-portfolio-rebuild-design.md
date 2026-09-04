# Three.js Portfolio Rebuild — Design

- **Date:** 2026-09-04
- **Repo:** nawafbalmutairi/nawafbalmutairi.github.io
- **Status:** Approved, pending implementation plan

## 1. Context

The live site is a single 170KB `index.html` in an editorial/print style
(cream `#f5f1ea`, ember `#e64d2e`, Newsreader + Inter + JetBrains Mono,
paper grain, hand-drawn NA monogram). It has no WebGL, no canvas, no build
step, and no dependencies — only inline vanilla JS.

Nine project subpages exist, each its own `index.html`. They do **not**
share a design system: `ml-benchmarking` uses the cream editorial tokens,
`Astro-Dash` uses a dark game palette (`#0a0c10`, green/amber/blue), and
`nvidia-bi-dashboard` uses a third structure. The site is already
visually inconsistent between pages.

Owner positioning: BSc Computer Science (Northumbria), based in Riyadh,
data / BI / ML, open to August 2026 graduate roles, member of the Claude
Builder Club by Anthropic.

## 2. Goals

- Rebuild the homepage as a genuine Three.js experience with an AI/data theme.
- Every 3D scene must encode real information about real work — no decoration.
- Preserve all existing written content and the `problem → system → outcome` throughline.
- Never break for a recruiter: full functionality without WebGL, without motion, on mobile.
- Keep the repo editable by the owner with no toolchain installed.

## 3. Non-goals

- Arcade or game aesthetics. Explicitly rejected by the owner.
- Any build step, npm dependency, or CI pipeline.
- Replacing written case studies with 3D-only content.
- Changing the type system. Newsreader / Inter / JetBrains Mono are kept.

## 4. Decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | Full rebuild, not an add-on 3D layer | Owner's explicit instruction |
| 2 | AI/data-driven 3D, not arcade | Owner's explicit instruction; fits target roles |
| 3 | Phase 1 homepage, Phase 2 unify the 9 subpages | Ship value early; fixes existing inconsistency |
| 4 | No build step — CDN import map + plain ES modules | Fewest failure points between commit and live site |
| 5 | Ship via GitHub Desktop → Push → Pages | Owner has GitHub Desktop; no Node required |

## 5. Concept — "Latent Space"

One continuous WebGL canvas fixed behind the DOM. Scroll position drives a
sequence of scenes. Each scene is an AI/data structure carrying meaning.

| Section | Scene | Encodes |
|---|---|---|
| Hero | Embedding cloud, ~60k GPU points resolving from noise into a manifold; mouse parallax | Latent space |
| Statement | Layered neural lattice, signal pulses along edges | "The system behind the numbers" |
| Impact | Instanced 3D bars driven by real figures | Headline results |
| Case 01 | Scatter manifold, four model clusters coloured by R² | Ridge / RF / MLP / XGBoost benchmark on 8.3M water-quality samples |
| Case 02 | Node-and-flow network, EMEA ↔ NA, causal-loop rings | NVIDIA H100/H200 supply-chain BI, 6 KPIs |
| Case 03 | Stacked convolution planes, two diverging paths | DenseNet vs ResNet, 86.67% real-time inference |
| Contact | Cloud disperses back to noise | Closing |

**Figures to source from the existing pages rather than assumed:** train/test
row counts (rendered as animated counters in current markup, exact values
unconfirmed), NVIDIA forecast-accuracy percentage, cumulative project count.
Confirmed: 8.3M samples, four models, best R² 0.79 (XGBoost × water temp),
DenseNet 86.67%.

## 6. Architecture

```
index.html          DOM content + import map
styles/
  tokens.css        colour, type, spacing custom properties
  base.css          reset, typography, layout primitives
  sections.css      per-section layout
src/
  main.js           bootstrap, single RAF loop, scene registry
  stage.js          renderer, camera, resize, bloom pass
  scroll.js         scroll position → normalised scene progress
  scenes/
    latentField.js  network.js  bars.js
    manifold.js     graph.js    convnet.js
  shaders/          GLSL as JS template strings
  util/
    capabilities.js WebGL2 + device tier detection
    reducedMotion.js
    lerp.js
```

**Scene contract.** Every scene module exports `init(ctx)`, `update(dt, progress)`,
and `dispose()`. `main.js` owns the only `requestAnimationFrame` loop and calls
`update` on the active scene only. Lifecycle is explicit: a scene is
initialised when it enters a one-viewport pre-load margin, paused (GPU buffers
retained, `update` not called) when it leaves the viewport, and `dispose()`d
only on teardown or device-tier downgrade. One renderer, one canvas, one
loop — this is what holds 60fps.

**Post-processing.** A single unreal-bloom pass on the ember/cyan accents,
loaded from `three/addons/` via the same import map. Desktop tier only;
mobile and reduced-motion render straight to the canvas with no composer.

## 7. Palette and type

Dark, retaining ember for brand continuity with the previous site.

```
--bg      #05070a
--ink     #e8eaf0
--ember   #e64d2e   (signature accent, carried over)
--cyan    #38bdf8   (data series)
--violet  #a78bfa   (third series)
```

Type unchanged: Newsreader (serif), Inter (sans), JetBrains Mono (mono).

## 8. Accessibility and failure behaviour

Non-negotiable; designed in, not bolted on.

| Condition | Behaviour |
|---|---|
| All text | Lives in DOM, never in WebGL. Canvas is `aria-hidden="true"` |
| No WebGL2 / init throws / CDN unreachable | `<html class="no-webgl">`, canvas hidden, clean static dark page, fully functional |
| `prefers-reduced-motion: reduce` | One composed static frame, zero animation |
| Mobile | Particle counts cut ~5×, DPR capped at 1.5, bloom disabled |
| Page load | Render loop starts only after content paints; text never blocked by 3D |

CDN failure is handled explicitly: the Three.js import is attempted inside a
`try/catch` around a dynamic import, and any rejection sets the `no-webgl`
fallback path rather than leaving a blank page.

## 9. Verification

No test framework applies to a static site. Verification is by forced failure:

1. Serve locally (`python -m http.server`) and confirm the page renders.
2. Check at 375px and at desktop width.
3. Lighthouse pass — performance, accessibility, SEO.
4. Disable WebGL → confirm the static fallback renders and all content is readable.
5. Enable `prefers-reduced-motion` → confirm no animation runs.
6. Block the CDN → confirm the fallback path triggers, no blank page.

Each of 4–6 must be observed, not assumed.

## 10. Phasing

- **Phase 1** — Homepage rebuild per this document. Ships independently.
- **Phase 2** — Convert all 9 case pages onto the Phase 1 design system,
  preserving every word and image.

## 11. Risks

| Risk | Mitigation |
|---|---|
| 3D hurts readability for recruiters | All content in DOM; 3D is background only |
| Performance on low-end laptops/phones | Device tiering, single active scene, capped DPR |
| jsDelivr outage | Explicit fallback path; can switch to vendored Three.js without redesign |
| Repo lives in a OneDrive-synced folder | Sync conflicts possible during editing; commit often |
| Scope creep from Phase 2 into Phase 1 | Phase 1 ships before subpages are touched |
