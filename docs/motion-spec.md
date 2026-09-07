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
- Status: **complete** — all nine required sections plus a "could not measure" section
- Scope: **landing route only.** Project subpages, the full index and the newsletter flow were not inspected.

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

### Structure: a full-viewport frame, not a bar

**[confirmed]** The nav is *not* a strip. It is one element covering the whole viewport:

```
position: fixed; inset: 0; z-index: 40;
display: flex; flex-direction: column; justify-content: space-between;
padding: 4rem 8rem   (desktop)  /  2.5rem 4rem  (mobile)
pointer-events: none;            ← the shell never blocks the gallery
```
Inside it are two rows (top and bottom), each `display:flex; justify-content:space-between`.
Only the individual links/buttons get `pointer-events: auto`. Four items sit in the four
corners; the middle of the screen is untouched and fully draggable.

| Corner | Item | Role |
|---|---|---|
| top-left | wordmark | home link |
| top-right | toggle button | opens a centred overlay; **its own label changes to `Close` and `aria-expanded` flips to `true`** [confirmed] |
| bottom-left | two route links separated by a `/` | section switch, `router-link-active` drives the styling |
| bottom-right | toggle button | opens the second centred overlay |

### Fixed / sticky / hide-on-scroll

**It never hides. There is no scroll threshold and no direction logic.** **[confirmed]**

Evidence: the nav shell's computed `transform` stayed `none` and `opacity` stayed `1`
across every scroll burst I fired; there is no scroll container to observe (§5); and the
stylesheet contains **zero `@keyframes`** and no transform transition on the shell.

> This is a real design decision worth noting: because the page is scroll-jacked and never
> exceeds one viewport, there is nothing for the nav to get out of the way of.

### Hover — the whole hover system is two rules

**[confirmed]** I enumerated all 287 CSS rules in both (same-origin, inlined) stylesheets.
The complete set of hover declarations on the entire site is:

| Rule | Declaration |
|---|---|
| `…:hover` | `opacity: 1` |
| `…:hover` | `opacity: 0.6` |

That is all. **No transform on hover. No scale. No colour change. No underline. No letter-spacing.
No background.** Hover is opacity and nothing else.

Both are gated behind `@media (hover: hover) and (pointer: fine)` **[confirmed]** — the
stylesheet also carries the complementary `(hover: none) or (pointer: coarse)` query, so
touch devices get an explicitly different branch rather than sticky hover states.

### Per-item nav behaviour — exact values

| Item | Rest opacity | Hover opacity | Duration | Easing |
|---|---:|---:|---:|---|
| wordmark (top-left) | 1 | *no hover rule at all* | — | — |
| overlay toggle (top-right) | 1 | **0.6** | **0.3 s** | `cubic-bezier(0, 0, 0.2, 1)` |
| overlay toggle (bottom-right) | 1 | **0.6** | **0.3 s** | `cubic-bezier(0, 0, 0.2, 1)` |
| route link — **active** | **1** | 1 | **0.5 s** | `cubic-bezier(0, 0, 0.2, 1)` |
| route link — **inactive** | **0.5** | **1** | **0.5 s** | `cubic-bezier(0, 0, 0.2, 1)` |
| `/` separator | 1 | none | — | — |

**All rows `[confirmed]`** from `getComputedStyle` on the live elements plus the enumerated
CSS rules. `cubic-bezier(0, 0, 0.2, 1)` is a pure ease-out (no overshoot, instant start).

Note the deliberate split: **buttons transition in 0.3 s, route links in 0.5 s.** The slower
curve on the route links reads as "state", the faster one as "affordance".

### Active-link treatment

Active = `opacity: 1`, inactive = `opacity: 0.5`. Nothing else changes — no weight, no colour,
no underline, no indicator. **[confirmed]** The 0.5→1 delta *is* the active state.

### Hit-area expansion — steal this

**[confirmed]** Every interactive nav item carries an invisible `::before` pseudo-element that
extends the clickable box **1.5 rem beyond the text on all sides** (≈14.4 px at a 1440px
viewport, scaling fluidly). The text is only ~13 px tall, so without this the targets would be
unusable.

The two route links use an **asymmetric** expansion so their hit areas meet cleanly at the `/`
without overlapping:

```
left link :  ::before { inset-block: -1.5rem; left: -1.5rem; right: -0.2rem; }
right link:  ::before { inset-block: -1.5rem; left: -0.2rem; right: -1.5rem; }
```
**[confirmed]** — the outer edge gets the full 1.5 rem, the inner edge gets 0.2 rem.
This is the kind of detail that separates a careful build from a sloppy one, and it costs
nothing to reproduce.

### Mobile menu choreography

**There is no mobile menu. [confirmed]**

At 390 × 844 the nav renders the *same four corner items* — I measured their positions:
wordmark at (40, 25), top-right toggle at (306, 25), the two route links at (40, 805) and
(110, 805), bottom-right toggle at (278, 805). No hamburger, no drawer, no backdrop, no
item stagger, because there is no menu to open.

The only thing that changes below 650px is the padding: `4rem 8rem` → `2.5rem 4rem`
(in the mobile root unit, i.e. 25 × 40 CSS px at 390 width). **[confirmed]**

**Therefore: no mobile-menu duration, easing, stagger or backdrop treatment exists to
specify.** If we want one for our five destinations we are designing it, not porting it.

### Load entry animation for the nav

**Could not measure** — see §3 and §10. The nav's entry is part of the rAF-driven intro
sequence, which did not run in my pane. What I *can* say: the nav items have **no CSS
transition on transform and no `@keyframes`**, so whatever entry they have is written
frame-by-frame by the JS ticker, most likely as an opacity and/or `translateY` **[inferred]**.

---

## 3. LANDING / HERO

### There is no hero. This is the finding.

**[confirmed]** The landing route has **no visible headline, no tagline, no intro paragraph,
no scroll cue.** The `<h1>` and every descriptive paragraph live inside a `.sr-only`
container measured at **1 × 1 px at (−1, −1) with `overflow: hidden`** — a screen-reader-only
block. It contains the h1, three descriptive paragraphs, an `<h2>` + list of the eight
projects, and a second `<h2>` + list of outbound links.

So the accessible document is complete and well-structured, and **none of it is painted**.

What a sighted visitor actually sees on load, in full:

1. the WebGL filmstrip of eight project cells,
2. four small uppercase labels in the four corners (§2),
3. during load, three small centred bars.

That is the entire landing composition. **[confirmed]** — census of `data-gl="text"` proxies
returns 10, and **all 10 are inside the two overlay panels**, none on the landing itself.

> **Consequence for us.** Our brief has five destinations with real copy. We cannot copy this
> structure. What we *can* take is the discipline: the landing carries one idea (the work),
> and the words live one interaction away. And the `.sr-only` mirror is a genuinely good
> pattern — a complete, ordered, linkable text version of a WebGL page, which is what makes
> a canvas-driven site navigable and indexable.

### Load sequence — order and timing

**[confirmed]** from `performance.getEntriesByType('resource')` and the navigation entry:

| # | Step | Timing |
|---|---|---|
| 1 | HTML + single JS chunk; **zero external stylesheets** (CSS inlined) | — |
| 2 | Route payload JSON (~8.3 KB) | 365 ms |
| 3 | Variable font, one `.woff2` file, one family | early, preloaded |
| 4 | **`textures/manifest.json` (~1.4 KB)** — the full texture list, fetched *before* any texture | 251 ms |
| 5 | Basis/KTX2 transcoder: `.js` (~15 KB) then `.wasm` (~232 KB) | 480 ms / 712 ms |
| 6 | ~45 `.ktx2` compressed textures, heavily parallel | 150–560 ms each |
| 7 | Video streams (`.mp4`) for the cells that are video | 100–1160 ms |
| 8 | One `.glb` model | 481 ms |
| 9 | Prefetch of per-project route payloads (§8) | trailing |
| — | `DOMContentLoaded` | **2251 ms** |
| — | `load` | **2253 ms** |
| — | total requests | **87** |

The manifest-before-textures ordering is the important part: it gives the progress indicator a
**real denominator**, so the three bars can show honest progress rather than a fake timed sweep.

### The loading indicator

**[confirmed]** Three elements, `data-gl="bar"`, each **48 × 5 CSS px** with a **9.6 px (1 rem)**
gap, centred in the viewport by a `fixed inset-0 flex items-center justify-center` wrapper.
Their computed `background-color` is **`rgba(0, 0, 0, 0)` — fully transparent** — yet they
render as visible bars on screen. **This is direct proof of the DOM-proxy model (§7): the box
is DOM, the paint is WebGL.**

**[inferred]** They are a three-segment determinate progress meter fed by the texture manifest
count. Method: they are the only thing visible before content, they are centred and
transparent-in-DOM, and a manifest is fetched first. I could not watch them fill because the
intro is rAF-driven and rAF was throttled (§1).

### Text reveal mechanism

**Not applicable on the landing** (no visible text). For the **overlay** text, which is the
only revealed copy on this route:

- The copy sits at `opacity: 0` in the closed state with **`transition-duration: 0s` and
  `transition-property: all`** — i.e. **no CSS transition drives it**. **[confirmed]**
- There is **no clip-path** (`clip-path: none` on every overlay child) and **no mask**.
  **[confirmed]** So it is *not* a clip/mask wipe.
- There is **no per-line or per-character wrapper** — each paragraph is a single text node
  inside one `<p>`. **[confirmed]** So it is *not* a line-split or char-split stagger.
- Therefore the reveal is an **opacity (and possibly small `translateY`) fade written by the
  JS ticker**, applied to whole paragraph blocks. **[inferred, high confidence — method: the
  absence of every alternative mechanism is confirmed, so only the ticker remains.]**

**Stagger interval: could not measure.** I clicked the toggle and sampled computed opacity at
t = 0, 16, 55, 102, 209, 364, 612, 1000 and 1609 ms. **Every sample read `opacity: 0`** while
`aria-expanded` had already flipped to `true` and the button label had already changed to
`Close`. The DOM state change is synchronous; the motion is rAF-driven and rAF was dead. I
will not invent a stagger number from that. **[confirmed measurement, null result]**

### Scroll-out, parallax, pointer-reactive motion

- **Scroll-out: does not exist.** The landing never leaves; there is no second screen to
  scroll to (§5). **[confirmed]**
- **Parallax factors: could not measure.** With a single flat filmstrip and one canvas plate,
  there are no differentiated depth layers in the DOM to compare. Any parallax is inside the
  shader. **No estimate given.**
- **Pointer-reactive motion: could not measure** (needs frame sampling). **No estimate given.**

---

## 4. GRID

### It is not a grid. It is a variable-width filmstrip.

**[confirmed]** There is no CSS Grid on the gallery and there are no columns. The gallery is
a single flex line of 8 cells with:

- **uniform height** for every cell,
- **width derived from each cell's own media aspect ratio**,
- **one constant gap**,
- **no wrapping** on desktop, **full stack** on mobile.

`aspect-ratio` is set as an inline style on each cell from the intrinsic pixel dimensions of
its media (values observed range from ~1.33:1 to ~1.84:1) **[confirmed]**. That is what makes
each cell a different width.

### The single sizing rule (this is the whole geometry)

```
desktop (≥ ~650px):
    cell.height = min( 43.5 * svh_unit , 55rem )      // svh = small-viewport-height
    cell.width  = cell.height * cell.aspectRatio      // implicit, via width:auto + aspect-ratio
    gap         = 1rem
    track       = position:absolute; top:50%; translateY(-50%)   // vertically centred
mobile (< ~650px):
    cell.width  = 100% of (viewport - 2rem side padding)
    cell.height = cell.width / cell.aspectRatio       // no cap
    gap         = 2rem (row gap)
    track       = position:absolute; top:0; flex-direction:column
```

`43.5` and `55rem` and `1rem` are **[confirmed]** — measured exact at every breakpoint below.

### The fluid root font-size (measured, not guessed)

| Viewport width | `html` computed font-size | Formula check |
|---:|---:|---|
| 390 | **10.000 px** | 390 / 39 = 10.000 ✓ |
| 641 | **16.436 px** | 641 / 39 = 16.436 ✓ |
| 645 | **16.538 px** | 645 / 39 = 16.538 ✓ |
| 648 | **16.615 px** | 648 / 39 = 16.615 ✓ |
| 650 | **5.000 px** | 650 / 150 = 4.333 → **clamped to 5** |
| 670 | **5.000 px** | 670 / 150 = 4.467 → clamped |
| 700 | **5.000 px** | 700 / 150 = 4.667 → clamped |
| 749 | **5.000 px** | 749 / 150 = 4.993 → clamped |
| 768 | **5.120 px** | 768 / 150 = 5.120 ✓ |
| 1024 | **6.827 px** | 1024 / 150 = 6.827 ✓ |
| 1280 | **8.533 px** | 1280 / 150 = 8.533 ✓ |
| 1440 | **9.600 px** | 1440 / 150 = 9.600 ✓ |
| 1920 | **12.800 px** | 1920 / 150 = 12.800 ✓ |

**All rows `[confirmed]`** by `getComputedStyle(document.documentElement).fontSize`.

The recovered rule — **[confirmed], the formula fits all 13 samples exactly:**

```
below breakpoint:  html { font-size: calc(100vw / 39)  }        ≈ 2.564vw
at/above:          html { font-size: max(5px, 100vw / 150) }    ≈ 0.667vw, floor 5px
```

Note the **deliberate discontinuity at the breakpoint**: root drops from ~16.6px to 5px.
Everything on the page halves-and-then-some at the moment the layout turns horizontal. This is
not a bug; it is how they fit a horizontal filmstrip into a narrow-but-landscape viewport.

### Breakpoint

**`s:` fires between 648px and 650px [confirmed by bracketing]** — at 648 the track is
`flex-direction: column`, at 650 it is `row`. Almost certainly **650px** exactly
**[inferred, ±2px]**. There is exactly **one** layout breakpoint on this page; 768 / 1024 /
1280 / 1440 / 1920 produce *no* structural change, only fluid scaling.

### Measured geometry table

| Viewport | root | Cells/line | Cell height | Cell widths (min…max) | Gap | Track padding | Nav padding (V × H) | Body font | Label font |
|---:|---:|---:|---:|---|---:|---|---|---:|---:|
| 390 × 844 | 10.000 | 1 (stacked) | **varies** 190.4–262.5 | 350 (all equal, = 100%) | 20.0 (row) | 0 × 20 | 25 × 40 | 14.00 | 10.00 |
| 768 × 1024 | 5.120 | 8 in one line | **281.6** (cap binds) | 375.5 … 517.7 | 5.12 | 0 | 20.48 × 40.96 | 7.17 | 5.12 |
| 1024 × 768 | 6.827 | 8 in one line | **334.1** | 445.4 … 614.2 | 6.83 | 0 | 27.31 × 54.61 | 9.56 | 6.83 |
| 1280 × 800 | 8.533 | 8 in one line | **348.0** | 464.0 … 639.8 | 8.53 | 0 | 34.13 × 68.27 | 11.95 | 8.53 |
| 1440 × 900 | 9.600 | 8 in one line | **391.5** | 522.0 … 719.7 | 9.60 | 0 | 38.40 × 76.80 | 13.44 | 9.60 |
| 1920 × 1080 | 12.800 | 8 in one line | **469.8** | 626.4 … 863.7 | 12.80 | 0 | 51.20 × 102.40 | 17.92 | 12.80 |

All values in CSS px, all **[confirmed]** from `getBoundingClientRect()` / `getComputedStyle`.

### Ratios, expressed so they survive a redesign

| Ratio | Value | Confidence |
|---|---|---|
| Cell height ÷ viewport height (desktop, uncapped) | **0.435** exactly | [confirmed] — 391.5/900, 348/800, 469.8/1080 all = 0.435 |
| Cell height cap | **55rem** = 5.5 × (root × 10) | [confirmed] — binds only at 768w (cap 281.6px) |
| Gap ÷ root | **1.000 rem** at every breakpoint | [confirmed] — 5.12/5.12, 6.83/6.83, 9.6/9.6, 12.8/12.8 |
| Gap ÷ cell height | 0.0182 → 0.0272 (varies, because gap tracks *width* and height tracks *height*) | [confirmed] |
| Nav side margin ÷ root | **8 rem** desktop, **4 rem** mobile | [confirmed] |
| Nav vertical margin ÷ root | **4 rem** desktop, **2.5 rem** mobile | [confirmed] |
| Nav side margin ÷ viewport width | **0.0533** (5.33vw) desktop | [confirmed] — 76.8/1440, 102.4/1920, 68.27/1280 |
| Mobile side padding | **2 rem** = 20px at 390w | [confirmed] |
| Track vertical placement | `top: 50%` + `translateY(-50%)` — exact centring | [confirmed] — e.g. at 1920: top 540px, transform −234.898px = −469.797/2 |

### Span rules and reflow

- **Span rules: none.** No cell spans anything; each is `flex: 0 0 auto`. **[confirmed]**
- **Reflow at the breakpoint** is a hard swap, not a fluid rearrangement: `flex-direction`
  row→column, `top` 50%→0, the centring `translateY(-50%)` is dropped, side padding 0→2rem,
  gap switches from column-gap 1rem to row-gap 2rem, and the height cap is removed so cells
  become full-bleed-width with natural heights. **[confirmed]**
- **Cells never wrap.** Overflow is handled by the transform loop (§5), not by `flex-wrap`.

### What to take for our 5-destination page

Our brief is a grid, not a filmstrip, so do **not** copy the layout. Take these three:
1. **Fluid root font-size with a floor** so one set of `rem` numbers drives every breakpoint —
   it removes almost all media queries. Our own divisor, our own floor.
2. **One breakpoint, not five.** They ship a single structural break at ~650px and let
   everything else scale. That is a defensible amount of responsive work for a portfolio.
3. **`aspect-ratio` set per item from intrinsic media dimensions**, so cells size themselves
   and never need a hardcoded height table.

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

### The global picture

**[confirmed]** across the whole site:

- **`@keyframes` rules in the stylesheet: 0.**
- **`document.getAnimations()` length: 0**, at every sample, in every state.
- **CSS transitions in the stylesheet: 6 distinct declarations**, listed in full below.
- Everything else is a JS ticker writing inline `transform` / `opacity`.

So the motion system is: **a tiny, deliberate set of CSS transitions for UI affordances, and
one rAF ticker for everything expressive.** No animation library keyframes, no scroll-trigger
timeline, no CSS animation whatsoever.

### The complete CSS transition inventory

Every transition rule that exists on the site **[confirmed — full enumeration of 287 rules]**:

| # | Applies to | Property | Duration | Easing | Delay |
|---|---|---|---:|---|---:|
| 1 | base utility | `color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter` | **0.15 s** | **`cubic-bezier(0.23, 1, 0.32, 1)`** | 0 |
| 2 | opacity-only utility | `opacity` | **0.15 s** | **`cubic-bezier(0.23, 1, 0.32, 1)`** | 0 |
| 3 | duration modifier | — | **0.3 s** | (inherits) | 0 |
| 4 | duration modifier | — | **0.5 s** | (inherits) | 0 |
| 5–6 | autofill suppression on the one text input | `background-color` | 0 s | ease | **999999 s** |

Plus the easing override actually applied to the nav (**[confirmed]** from computed style):
**`cubic-bezier(0, 0, 0.2, 1)`** — a plain ease-out.

**Two easing curves exist on this entire site:**

| Curve | Shape | Where used |
|---|---|---|
| `cubic-bezier(0.23, 1, 0.32, 1)` | very strong ease-out, near-instant start, long tail | the default utility (0.15 s) |
| `cubic-bezier(0, 0, 0.2, 1)` | standard ease-out | the nav items (0.3 s / 0.5 s) |

Both are **ease-out with zero incoming ease and no overshoot**. There is **no ease-in-out and
no spring/back curve anywhere.** That consistency is the single most copyable thing in this
section — it is a *policy*, not a value.

### Live element census for those transitions

**[confirmed]** On the landing route: `.transition-opacity` matches **4** elements,
`duration-300` matches **2**, `duration-500` matches **2**. That is the total surface area of
CSS-driven motion on the page — four nav items. Everything else you see move is the ticker.

### Per-animation table

| Animation | Trigger | Duration | Easing | Stagger | Transform props | Entry → Exit |
|---|---|---|---|---|---|---|
| Nav toggle-button hover | pointer, gated `(hover:hover) and (pointer:fine)` | **0.3 s** [confirmed] | `cubic-bezier(0,0,0.2,1)` [confirmed] | n/a | none — opacity only [confirmed] | 1 → 0.6 |
| Route-link hover | same | **0.5 s** [confirmed] | `cubic-bezier(0,0,0.2,1)` [confirmed] | n/a | none — opacity only [confirmed] | 0.5 → 1 |
| Route-link active-state change | route change | **0.5 s** [confirmed] | `cubic-bezier(0,0,0.2,1)` [confirmed] | n/a | none | 0.5 ↔ 1 |
| Gallery transport | wheel / drag / keys | continuous, no duration | exponential lerp | n/a | `translate3d(x,0,0)` per cell [confirmed] | n/a — never rests at a keyframe |
| Cell recycle (wrap) | position crosses modulus | instantaneous | none | n/a | `translate3d` jump [confirmed] | invisible by construction |
| Overlay open/close | button click | **could not measure** | **could not measure** | **could not measure** | opacity (+ likely `translateY`) [inferred] | 0 → 1 |
| Preloader bars | texture manifest progress | **could not measure** | **could not measure** | 3 segments [confirmed] | WebGL-painted [confirmed] | — |
| Intro / first paint | page load | **could not measure** | **could not measure** | **could not measure** | — | — |

### Discrete opacity values in use

**[confirmed]** The stylesheet uses exactly six opacity values: **0, 0.3, 0.4, 0.5, 0.6, 1**.
Everything dim on this site is one of those. There is no continuous opacity ramp in CSS.

### Border radii in use

**[confirmed]** Exactly four: **1.5 rem, 2 rem, `inherit`, and `999px`** (full pill). The pill
is used for the form control and the preloader bars.

### Letter-spacing (tracking) values in use

**[confirmed]** Exactly three negative values: **−0.02 em** (body copy), **−0.035 em**,
**−0.05 em** (cell captions). Uppercase labels use **`normal`** — i.e. they deliberately do
*not* add positive tracking to small caps, which is unusual and is a stylistic signature (§9).

### What our project should adopt from §6

1. **Two ease-out curves, no more.** Pick one "UI" ease-out and one "expressive" ease-out and
   never introduce a third. No ease-in-out, no springs.
2. **Two durations for UI: a fast one (~0.3 s) for affordances and a slower one (~0.5 s) for
   state.** Consistently applied, this reads as intentional design.
3. **Hover = opacity only.** This is a strict rule that will make our page feel calmer than
   any amount of hover-transform cleverness.
4. **Gate hover behind `(hover: hover) and (pointer: fine)`** and give coarse pointers an
   explicit branch.
5. **Quantise opacity to a small set** rather than picking ad-hoc values per component.

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

### Cursor — there is no custom cursor

This is worth stating plainly because the visual style leads you to expect one.

**[confirmed]**

- `document.querySelectorAll('body *')` filtered to `cursor: none` returns **0 elements**.
  There is no element hiding the system cursor, therefore there can be no custom cursor
  follower.
- `getComputedStyle(document.documentElement).cursor` is **`grab`**, and the root element
  carries a state class indicating grab-ability.
- `<main>` computed cursor is **`grab`**.
- Each gallery cell is `cursor: pointer`.
- **[inferred, high confidence]** the root cursor flips to `grabbing` while the pointer is
  held down — the standard pairing, and the state class on `<html>` implies a JS-toggled
  class. I could not hold a press and read the computed style in the same call, so this one
  is not confirmed.

So the cursor system is: **three native cursor keywords, no DOM follower, no lerped dot, no
magnetic hover.** Given how much of the web copies the custom-cursor trope, this restraint is
itself the design decision.

One related note: the stylesheet defines a **`mix-blend-mode: difference`** utility
**[confirmed]**, but it matches **zero elements on the landing route** **[confirmed]**. So the
technique is available in their system and simply unused here — probably reserved for
subpages. Do not assume the landing has blend-mode chrome; it does not.

### Page transitions

**[confirmed]**

- Nuxt 3 SPA with client-side routing. Route links carry `router-link-active` /
  `router-link-exact-active` classes, which is what drives the 0.5 s opacity state change (§2).
- **Route payloads are prefetched as JSON before navigation.** I observed `_payload.json`
  fetches for the top-level routes *and* for individual project routes while still on the
  landing page. Each gallery cell carries a `data-id` whose value is the project's route slug,
  so the cell is the link and the payload for its destination is already in memory when you
  click. **This is the transition strategy: make the destination free, so the transition can be
  purely visual.**
- Each cell is an `<article>` with `cursor: pointer` — the whole cell is the target, not a
  caption link.

**Transition choreography itself: could not measure.** Navigating requires the rAF ticker to
run the transition, and it does not run in this pane (§1). I did not observe a page transition
complete, so I cannot give its duration, easing, or whether it is a shared-element / flip
transition between the gallery cell and the project hero. **[No estimate given.]**

**[inferred, low confidence]** — offered only as a hypothesis to verify, not as a finding: the
combination of (a) a persistent single canvas that survives route changes, (b) per-cell
`data-id` matching the route slug, and (c) payload prefetch, is the standard setup for a
**shared-element transition where the clicked cell's mesh animates into the next page's hero
position without a teardown**. Verify before building.

### Overlay ("modal") behaviour

**[confirmed]** Two centred overlay panels exist, both `position: fixed; left:50%; top:50%`
with `translate(-50%, -50%)` centring, at `z-index: 40`, width **576 px = 60 rem** at a 1440px
viewport. Both are `pointer-events: none` when closed and their content sits at `opacity: 0`
with **no CSS transition**.

Opening is a **pure state toggle in the DOM** — `aria-expanded` flips to `true` and the
trigger button's own label swaps — followed by rAF-driven motion. **[confirmed]** I verified
the state flip happens synchronously on click while opacity remained 0 for 1.6 s of sampling.

**Backdrop treatment: there is none.** **[confirmed]** No overlay element, no
`backdrop-filter`, no dimming layer appears in the DOM in either state — the panels sit
directly over the WebGL layer. The `data-gl-shield` attribute on both panels' content wrappers
**[confirmed]** is very likely how legibility is achieved instead, by having the GL layer dim
or mask behind the shield rect **[inferred]** — but I could not read the shader to confirm it.

---

## 9. `IDENTITY — DO NOT COPY`

**This section is a REJECTION LIST.** It exists so the implementer can recognise these things
and *refuse* them. Everything below belongs to the reference site's owner. None of it is a
spec item. If any of it shows up in our build, that is a bug.

### Reject: the palette

**[confirmed]** The site's entire used colour set is **five values**:

| Value | Role there |
|---|---|
| `#000000` | page ground |
| `#FFFFFF` | all text, inverted button fill |
| `rgba(0,0,0,0)` | transparent proxy boxes |
| `#EEEEEE` | one utility (unused on this route) |
| `#D9A445` | one accent utility (unused on this route) |

**Refuse:** pure-black ground with pure-white type as *the* identity. It is theirs, it is
instantly recognisable as theirs, and it is also the single most imitated portfolio palette on
the awards circuit. Our portfolio must pick its own ground and its own ink. If we land on a
dark theme, it should not be `#000` and the type should not be `#FFF` — offsetting both away
from the extremes is enough to stop reading as a clone.

### Reject: the typeface and its treatment

**[confirmed]** One `@font-face`: a **single variable font, weight axis `200 1000`,
`font-display: swap`**, aliased in CSS under a generic family name, served as one `.woff2`.
The file is a licensed commercial grotesque (the "Diatype" family, by ABC Dinamo).

**Refuse:**
- The typeface itself — it is licensed to them. We have no right to it and it is a large part
  of the site's fingerprint.
- The *treatment*: **uppercase, weight 500, at exactly `1 rem` (= the root size), with
  `letter-spacing: normal`.** Small uppercase labels with *no* positive tracking is a
  deliberate, unusual, and highly identifiable choice. Refuse it specifically.
- The negative tracking ladder **−0.02 em / −0.035 em / −0.05 em** applied to display copy.

**Keep instead:** the *technique* of one variable font with a wide weight axis, one file, one
family, `font-display: swap`. That is good engineering and belongs to nobody.

### Reject: the wordmark treatment

**[confirmed]** The wordmark is the owner's **personal name set as a plain uppercase text
link at the same 1 rem label size as every other nav item**, top-left, linking to `/`, with
**no hover state at all** while every neighbouring item has one.

**Refuse:** a personal name rendered as an undifferentiated nav label, and specifically the
"wordmark is just another label" move. Our identity destination should look like an identity,
not like nav furniture.

### Reject: the nav copy and labels

**[confirmed]** Their exact nav vocabulary:

| Position | Label |
|---|---|
| top-left | *their personal name* |
| top-right | `Profile` → toggles to `Close` |
| bottom-left | `Featured` `/` `Full` |
| bottom-right | `Newsletter` |

**Refuse all four strings.** Our five destinations are Identity, Work, Stack, Journey,
Contact — a different information architecture entirely. In particular do not adopt:
- the `Featured / Full` pair as a work-index switch,
- `Profile` as the label for an about overlay,
- the slash-separated two-link nav pattern with the asymmetric hit areas *as a signature*
  (the asymmetric-hit-area **technique** in §2 is fine to reuse; the visible `A / B` slash
  pattern is theirs).

### Reject: content and voice

**[confirmed present, deliberately not reproduced here]** the site's copy includes a
self-description as a design engineer, an awards tally, a project list, and a newsletter
pitch. **Refuse the awards-tally-as-hero-copy move** in particular — a numeric trophy count
presented as the primary bio line is a strong personal signature and would read as direct
imitation. Write our own bio in our own voice.

Project names, the client list, and all imagery are theirs. Obviously none of it transfers.

### Reject: stylistic signatures (the composite look)

These are the moves that, taken together, make the site identifiable at a glance. Each is
individually reusable; **adopting the full set is copying.**

1. Black ground, white type, zero chrome, zero borders.
2. **A landing page with no visible words except four tiny corner labels.**
3. All body copy hidden in a `.sr-only` block.
4. Full-viewport nav frame with items in exactly the four corners.
5. Uppercase 1 rem labels with no tracking as the *only* typographic voice in the chrome.
6. A horizontal infinite filmstrip as the primary and only navigation of work.
7. Hover expressed exclusively as opacity, at exactly 0.5/0.6/1.
8. Three centred pill bars as the loading state.
9. Native `grab`/`grabbing` cursor with no custom cursor.

**Rule of thumb for the implementer:** we may take **the mechanics** — fluid root font-size,
DOM-proxy WebGL layout, single-breakpoint responsive strategy, two-ease-out policy, hit-area
expansion, texture-manifest-first loading, `.sr-only` document mirror, hover-gating media
queries. We may **not** take the surface — palette, typeface, wordmark, copy, label
vocabulary, corner-nav composition, or the filmstrip-as-whole-site structure.

### Reject: their vendor stack (not for IP reasons — for fit)

**[confirmed]** Nuxt 3 SPA, a headless CMS for content, a video-streaming CDN for the cell
videos, KTX2/Basis compressed textures with a ~232 KB WASM transcoder.

Our brief is **plain HTML/CSS/ES modules, no build step, three.js lazily loaded from a CDN**.
A WASM transcoder and a CMS are the opposite of that. **Refuse the pipeline.** If we want
compressed textures later that is a separate, deliberate decision — not something to inherit
because the reference had it.

---

## 10. Could not measure

Recorded honestly, with the reason, so nobody mistakes silence for absence.

### Blocked by the throttled `requestAnimationFrame` in the inspection pane

This one cause blocks everything time-based. Over a 13-second window with four real wheel
bursts I captured **11 rAF callbacks in total**, and the page's own ticker stopped between
them. Because *all* expressive motion on this site is ticker-driven (§6), none of it plays.

| Not measured | What I would have needed |
|---|---|
| **Smooth-scroll damping factor** (best effort + raw samples given in §5) | 60 clean frames of a free decay after a single wheel tick |
| **Intro / first-paint sequence order and timing** | the ticker running through load |
| **Nav load-entry animation** | same |
| **Overlay open/close duration, easing, item stagger** | same — I sampled 9 times over 1.6 s and got `opacity: 0` at every one |
| **Preloader bar fill behaviour and timing** | same |
| **Page-transition choreography** (shared-element or not) | same |
| **Pointer-reactive motion / mouse-follow lag** | frame sampling of a pointer-driven uniform |
| **Scroll-velocity shader distortion magnitude** | frame sampling + shader access |
| **Any stagger interval anywhere on the site** | frame sampling |

**How to unblock:** re-run the `MutationObserver` recorder from §5 in a normal, focused
browser window with DevTools, not an automation pane. Roughly two minutes of work, and it
would convert most of this table into confirmed numbers.

### Not observable from outside the page at all

| Not measured | Why |
|---|---|
| **Camera type and FOV** | The camera lives in module scope in a minified bundle; there is no global handle. As anticipated in the brief, **FOV is not externally readable. No estimate is given anywhere in this document.** |
| **Exact mesh count** | No renderer handle. A lower bound of **21** is confirmed from the DOM-proxy census (§7); the true count may be higher (background/effect meshes). |
| **Shader source, uniforms, effect magnitudes** | Compiled programs are not enumerable without a renderer handle; `WEBGL_debug_shaders` is not exposed. |
| **Whether the gallery is curved/cylindrical** | My screenshots were too low-resolution to detect projection curvature. DOM rects and painted positions agreed at that resolution, which weakly argues against strong curvature. **[inferred, low confidence]** |
| **DPR cap on the drawing buffer** | The pane reports `devicePixelRatio = 1`, so I could not observe whether they clamp the buffer at 1.5×, 2×, etc. |
| **`grabbing` cursor confirmation** | Requires holding a press and reading computed style in the same call; the tooling does not allow it. Marked `[inferred]` in §8. |
| **Subpage behaviour** | Everything in this document is the **landing route only**. The project routes, the full index, and the newsletter flow were not inspected. The `mix-blend-difference` utility and the `.glb` model both exist but render on neither the landing route nor anything I saw — they belong to pages I did not measure. |

### Tool calls that failed outright

- `document.getAnimations()` — did not fail, but returned `[]` at every sample. Reported as a
  finding, not an error (§1).
- One `javascript_tool` call timed out at 45 s because it awaited an rAF promise that never
  settled. Reworked into `setTimeout`-bounded sampling thereafter.
- No network response, DOM read, or `getComputedStyle` sweep failed.

### Deliberately not collected

Their CSS, JS, shader, font, image and video assets were not copied, saved, or reproduced.
Rules were enumerated only to extract behavioural numbers (durations, easings, ratios,
breakpoints), which is what this document contains.

---

## Appendix — the numbers most worth carrying forward

| # | Number | Confidence |
|---|---|---|
| 1 | Root font-size: `100vw / 39` below the breakpoint, `max(5px, 100vw / 150)` at and above it — fits all 13 measured samples exactly | [confirmed] |
| 2 | Exactly **one** structural breakpoint: `@media (min-width: 650px)` | [confirmed] |
| 3 | Cell height = **0.435 × viewport height**, capped at **55 rem**; width from intrinsic `aspect-ratio`; gap **1 rem** | [confirmed] |
| 4 | UI motion = **0.3 s** (affordance) and **0.5 s** (state), both `cubic-bezier(0, 0, 0.2, 1)`; site-wide default `0.15s cubic-bezier(0.23, 1, 0.32, 1)` | [confirmed] |
| 5 | Hover is **opacity only**, values quantised to **0.5 / 0.6 / 1**, gated behind `(hover: hover) and (pointer: fine)` | [confirmed] |
| 6 | Nav margins: **8 rem** horizontal (5.33 vw), **4 rem** vertical; hit areas expanded **1.5 rem** on all sides | [confirmed] |
| 7 | Scroll is fully synthetic: `html`/`body` `position: fixed; overflow: hidden`; transport is one `translate3d` per cell with modular wrap | [confirmed] |
| 8 | Damping factor **k ≈ 0.06–0.12** per 60 fps frame | **[inferred, ±100%]** |
