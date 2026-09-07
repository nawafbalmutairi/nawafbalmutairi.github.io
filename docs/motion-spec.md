# Motion Spec — behavioural reference derived from jesperlandberg.com

> **What this is.** A *behavioural* specification: numbers describing how motion behaves,
> written so it can be reimplemented from scratch with our own design tokens, our own
> markup and our own easing library. It contains no source, CSS, JS, asset, font or
> colour taken from the reference site for reuse. The final section is an explicit
> **rejection list** — things that are theirs and must not be copied.
>
> **Every finding is labelled `[confirmed]` or `[inferred]`.**
> `[confirmed]` = read out of the live DOM, `getComputedStyle`, `document.getAnimations()`,
> a network response, or an rAF / PerformanceObserver measurement actually run.
> `[inferred]` = deduced from observed motion or screenshots. Inferred numbers carry a
> method and an error bar. Estimates are never presented as fact.

- Reference target: `https://jesperlandberg.com/`
- Inspected: 2026-09-07
- Status: **in progress — sections appended as measured**

---

## 1. Method + reliability

### What was run

| Instrument | Used for | Worked? |
|---|---|---|
| `javascript_tool` → `getComputedStyle` sweeps | transition durations, easings, padding, font metrics, geometry | yes |
| `javascript_tool` → `getBoundingClientRect()` sweeps | grid geometry, cell aspect ratios, per-breakpoint layout | yes |
| `javascript_tool` → `document.getAnimations()` | WAAPI durations/easings | **returned `[]` at every sample** — see below |
| `javascript_tool` → rAF sampling loops | damping factor of the virtual scroll, transform recovery | yes |
| `performance.getEntriesByType('resource')` | library + texture inventory | yes |
| WebGL context introspection | drawing buffer, extensions, program count | partial |
| `resize_window` at 390 / 768 / 1024 / 1280 / 1440 / 1920 | responsive geometry table | yes |
| `computer` screenshot / scroll / hover | visual confirmation, easing shape sanity checks | yes |

### The single most important reliability caveat

`document.getAnimations()` returned an **empty array on every sample** — during load, during
hover, during overlay open, during scroll. **[confirmed]**

That is not a failure; it is a finding. It means essentially **none** of this site's motion is
CSS keyframes or WAAPI. Motion is driven by a JS ticker writing inline `transform` /
`opacity` values frame-by-frame, plus a WebGL render loop. The consequence for this spec:

- Durations and easings of *JS-driven* motion cannot be read out of a browser API. They must
  be **recovered by sampling** (which I did, and label `[confirmed — sampled]` with raw
  numbers and a sample rate) or **estimated** (labelled `[inferred]` with error bars).
- Only a small set of genuine **CSS transitions** exists (nav opacity, a few hover states).
  Those *are* readable and are labelled `[confirmed]` with exact values.

The bundle is a single minified Nuxt chunk. I did not read it as a source of design; where a
number below is exact it came from a live measurement, not from their code.

### Architecture in one paragraph (all `[confirmed]`)

Nuxt 3 SPA, single JS chunk, **zero external stylesheets** (CSS is inlined). `html` and `body`
are both `position: fixed; overflow: hidden; height: 100%`, and `document.documentElement.scrollHeight`
equals the viewport height. **There is no native scroll anywhere on this site.** A `<main>` is
`fixed inset-0 overflow-hidden`; inside it a horizontal track of `<article>` cells is moved by
inline transforms. A separate `fixed` layer at `z-index: 10` holds one full-viewport `<canvas>`
with `pointer-events: none`; the DOM chrome (nav, overlays) sits above it at `z-index: 40`.
So the WebGL layer is a **single flat plate behind all DOM**, not interleaved.

**The DOM cells are proxies, not pictures.** Elements carry a `data-gl="…"` attribute; their
`getBoundingClientRect()` is read each frame and used to place a corresponding mesh on the
canvas. The visible imagery is WebGL; the DOM holds invisible boxes plus real text. This is
the load-bearing architectural idea and it is worth reproducing conceptually — it is what makes
a WebGL gallery accessible and responsive without duplicating layout logic.

### The fluid root font-size (this explains every number in this document)

`getComputedStyle(document.documentElement).fontSize` = **9.6px at a 1440px viewport**
**[confirmed]**. Every spacing and type utility on the site is expressed in `0.1rem` units,
so *all* spacing and *all* type scale continuously with viewport width. There are no
"jumps" at breakpoints for size — only for layout direction. Measured root sizes per width
are in §4. Treat this as the site's core layout mechanic.

> Implementation note for us: this is `html { font-size: <fluid> }` with everything downstream
> in `rem`. It is a technique, not their property. We can adopt the technique with our own
> scale and our own clamp bounds.

---

## 2. NAV

_pending_

---

## 3. LANDING / HERO

_pending_

---

## 4. GRID

_pending_

---

## 5. SCROLL MODEL

### Classification: fully scroll-jacked, horizontal, infinite

**[confirmed]** — every claim in this block is read out of the live DOM:

| Property | Value | How confirmed |
|---|---|---|
| Native scroll exists? | **No.** | `html` and `body` both `position: fixed; overflow: hidden`; `document.documentElement.scrollHeight === innerHeight` (900 === 900) |
| Scrollbar | none, structurally impossible | as above |
| Axis (desktop) | **horizontal** | track is `display:flex; flex-direction:row`; only `translate3d(x,0,0)` values ever change |
| Axis (mobile) | **vertical** | below the `s:` breakpoint the same track is `flex-direction: column` |
| Transport | inline `transform: translate3d(Npx, 0, 0)` written per-cell | read from each cell's `style` attribute |
| Wrapping | **infinite / modular** | observed cell `nathan-riley` teleport from `-499.18px` to `+4527.38px` in one step while its neighbours stayed near 0 — a recycle, not a jump |
| Drag to scroll | yes | `html { cursor: grab }` and `<html class="grabbable">` **[confirmed]**; cursor flips to `grabbing` on press **[inferred — standard pairing, I could not hold a press and read the style simultaneously]** |
| Scroll-linked vs time-based | **scroll-linked (position-driven)** everywhere in the gallery; overlays are time-based CSS transitions | see §2 and §6 |

### The wrap rule (reproducible)

Total content width measured at 1440px viewport: **5218.73px** = sum of 8 cell widths
(5151.53px) + 7 flex gaps (7 × 9.6px = 67.2px) **[confirmed]**.
The observed teleport distance was **≈5563px** **[confirmed as an observation, but contaminated]** —
the discrepancy is because rAF was throttled in my pane and I sampled a partially-updated
frame where different cells carried transforms written on different ticks. Do not treat
5563 as the constant.

**The rule to implement, not the number:**

```
for each cell i:
    x_i = (baseOffset_i - scroll) mod L        // L = total track length incl. one seam gap
    if x_i > L - leadIn  then x_i -= L         // keep it in [-cellWidth, viewport]
```
Cells recycle position-modulo-L. Nothing is cloned; the same 8 DOM nodes are reused.
**[confirmed]** — there are exactly 8 `<article data-gl="card">` nodes and no duplicates,
yet the strip scrolls indefinitely.

### Damping factor — **partially measured, low confidence**

I attempted the rAF-sampling recovery you asked for. **It failed in this environment and I
am not going to invent the number.**

- `requestAnimationFrame` is hard-throttled in the inspection pane: over a 13-second window
  with four real wheel bursts I captured **11 rAF callbacks total**, at irregular 5.2–13.2 ms
  intervals, and the page's own ticker (which is rAF-driven) stopped between bursts. **[confirmed]**
- I therefore have exactly **one clean consecutive triplet** of cell-x values, captured via a
  `MutationObserver` on the `style` attribute (timestamps are `performance.now()` at
  observer-callback time, so they carry sub-millisecond batching error):

  | t (ms) | x (px) | Δx (px) | Δt (ms) |
  |---|---|---|---|
  | 261167.3 | −453.37 | — | — |
  | 261173.8 | −481.21 | −27.84 | 6.5 |
  | 261177.5 | −499.18 | −17.97 | 3.7 |

- Naive per-step ratio `Δ₂/Δ₁ = 17.97 / 27.84 = 0.645`, which for `pos += (target−pos)·k` at
  **fixed** dt would give **k ≈ 0.355**. But dt was *not* fixed (6.5 vs 3.7 ms), and when I
  solved the two-unknown dt-normalised model `a = 1 − e^(−λ·dt)` for a constant target, **no
  positive λ satisfies both equations** — meaning the target was still moving (wheel deltas
  still arriving) during the sample. So the constant-target model is not identifiable here.

**Verdict [inferred, wide error bars]:** a first-order exponential lerp with a per-60fps-frame
factor in the range **k ≈ 0.06 – 0.12** (i.e. a settle time of roughly 350–700 ms to 99%).
Method: visual settle-time estimate from screenshots plus the single triplet above as an
upper bound. **Error bar: ±100%.** Treat this as "somewhere in the normal smooth-scroll
band", nothing more.

> **How to get this properly if we want it:** run the same MutationObserver recorder in a
> real, focused browser window (not an automation pane) where rAF runs at 60 Hz, fire one
> wheel tick, then read the settle tail with no further input. 60 clean samples of a free
> decay make λ trivially recoverable. That measurement is ~2 minutes of work in a normal browser.

### What to copy conceptually

The *architecture* is worth taking; the numbers are not measurable. Specifically:
1. One scalar `target` advanced by wheel/drag/keyboard deltas.
2. One scalar `current` chased by an exponential lerp, **normalised by dt** so behaviour is
   frame-rate independent.
3. `velocity = current − previous`, exposed as a uniform to the WebGL layer (see §7).
4. All DOM writes are a single `translate3d` per cell, applied in one pass at the end of the tick.

---

## 6. MOTION (all other)

_pending_

---

## 7. WEBGL LAYER

### Placement — it sits *behind* the DOM, it does not interleave

**[confirmed]** One `<canvas>` inside `div.gl`, which is `position: fixed; inset: 0;
z-index: 10; pointer-events: none`, with `overflow: clip` on the canvas. Every piece of
DOM chrome (nav, overlays, the accessible text tree) is at `z-index: 40`. There is exactly
one canvas on the page. So the compositing model is a **single flat plate at z=10 with all
UI painted above it** — not a per-section interleave.

Consequence: the WebGL layer can never receive a pointer event directly. Interaction is
routed through the DOM proxies (below), which is also why the cells are `<article>` elements
with `cursor: pointer` rather than canvas hit-testing.

### Context parameters — all `[confirmed]` from `getContextAttributes()` / `getParameter()`

| Parameter | Value |
|---|---|
| API | **WebGL 2.0** (`WebGL GLSL ES 3.00`) |
| `alpha` | `true` |
| `antialias` | `true` |
| `depth` | `true` |
| `stencil` | `false` |
| `premultipliedAlpha` | `true` |
| `preserveDrawingBuffer` | `false` |
| `powerPreference` | `"high-performance"` |
| `desynchronized` | `false` |
| `drawingBufferWidth × Height` | 1440 × 900 at `devicePixelRatio = 1` |
| Canvas `width`/`height` attrs | 1440 × 900, CSS size 1440 × 900 |

`alpha: true` + the canvas sitting on a black page background means the WebGL layer is
**composited over the page**, not painting its own opaque background. At DPR 1 the buffer is
1:1 with CSS pixels; I could not test a DPR cap because the inspection pane reports DPR 1
(**see §10**).

### The `data-gl` proxy system — the load-bearing idea

**[confirmed]** DOM elements carry a `data-gl` attribute naming their mesh role. Live census
at 1440px on the landing route:

| `data-gl` value | Count | What it is |
|---|---|---|
| `card` | 8 | the gallery cells — each also carries `data-id` (a route slug) and an inline `aspect-ratio` taken from the source media's intrinsic size |
| `text` | 10 | overlay copy that gets GL treatment (see §6) |
| `bar` | 3 | three small centred rounded rects, `48 × 5 px`, `gap 9.6px`, all with `background-color: rgba(0,0,0,0)` — i.e. **the DOM box is transparent and the visible bar is drawn in WebGL** |

A separate attribute `data-gl-shield` (2 instances, on the overlay content wrappers) marks
regions the GL layer must treat specially — **[inferred]**: almost certainly a mask/occlusion
region so the GL imagery is dimmed or cut behind overlay text. I could not read the shader to
confirm.

**The mapping rule [confirmed by construction]:** the mesh's screen rect is the proxy's
`getBoundingClientRect()`. Evidence: the transparent `bar` elements have real layout boxes
(`48×5` at fixed positions) but no paint of their own, and the cells have `aspect-ratio` set
from intrinsic media dimensions so the *DOM* box already has the correct shape for the texture.
CSS does the layout; WebGL does the paint. This is the single most reusable idea on the site.

### Asset pipeline — all `[confirmed]` from `performance.getEntriesByType('resource')`

- **Textures are KTX2 / Basis-compressed.** `basis_transcoder.js` (≈15 KB) plus
  `basis_transcoder.wasm` (≈232 KB) are fetched, then ~45 `.ktx2` files. This is GPU-native
  compressed texture upload, not `<img>` decode.
- **A texture manifest is fetched first** (`manifest.json`, ~1.4 KB) before any texture — so
  the loader knows the full set up front and can drive a determinate progress value.
- **Video textures** stream as `.mp4` from a video CDN — at least 6 distinct streams fetched
  on the landing route, i.e. several gallery cells are *video* meshes, not stills.
- **One `.glb` model** is fetched (`/models/award.glb`). **[inferred]** it is a 3D object used
  in an awards-related moment; I never saw it render, so I cannot describe its motion.
- 87 resources total on first load; `DOMContentLoaded` at **2251 ms**, `load` at **2253 ms**
  (SPA — the real content arrives after, via the texture pipeline).
- Route data is prefetched as JSON payloads per project **before** navigation (§8).

### Camera, mesh count, shader effects

**Not observable from outside the page. I am not going to guess numbers here.**

- **Camera FOV / camera type: could not measure.** The renderer's camera lives in module
  scope inside a minified bundle; there is no global handle. As you anticipated, FOV is not
  externally readable. **No estimate given.**
- **Mesh count: not directly readable**, but a lower bound of **21 meshes** on the landing
  route is **[confirmed]** from the proxy census (8 cards + 10 texts + 3 bars), assuming a
  1:1 proxy→mesh mapping.
- **Scroll-velocity distortion: [inferred, medium confidence].** The scroll model computes a
  velocity scalar (§5) and the gallery is the only animated content; a velocity-driven
  skew/curvature uniform is the conventional use. I could not read the uniform. Do not
  present this as measured.
- **Hover displacement: [inferred]** — see §6 for what I could actually observe on hover.
- **Curvature: could not confirm.** At 1440 × 900 the cells' DOM rects and their apparent
  painted positions agreed to within screenshot resolution, which argues *against* a strong
  curved-drum projection on this route — but my screenshots were too low-resolution to be
  decisive. **[inferred, low confidence]**
- **Pointer reaction: could not measure** (rAF throttling meant I could not sample a
  pointer-driven uniform's effect over frames).

### What we should take from this section

Our project already lazily loads three.js and already has a curved-drum gallery. The two
ideas here that we do **not** already have and that are worth adopting are:
1. **DOM-proxy layout** — let CSS lay out invisible boxes, read their rects each frame, place
   meshes from them. It gives responsive WebGL for free and keeps the page accessible.
2. **A texture manifest fetched before the textures**, so the loader has a real denominator
   and the progress indicator is honest rather than faked.

---

## 8. CURSOR + PAGE TRANSITIONS

_pending_

---

## 9. IDENTITY — DO NOT COPY

_pending_

---

## 10. Could not measure

_pending_
