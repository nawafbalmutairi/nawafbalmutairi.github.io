# theme-spec.md — the identity contract

**Status:** written in-session (Agent B was killed by a rate limit before it wrote
anything; see `PROGRESS.md` D3). Every value below is quoted from a real file at a
real path. Where a value is only at one commit and not the other, that is stated.

**This file is the contract.** Motion and grid geometry may be ported from the
reference site. Styling may not. If a value is not in this file, it does not ship.

Two states are documented and must not be blended:

- **OURS** = commit `8bf87dd`. The clean identity. This is what surface 1 and 2 restore to.
- **DRIFTED** = commit `6a30424` (current HEAD). What must be reverted in the identity layer.

---

## 1. Token set — single source of truth

### 1.1 Ink (`ui/base.css:1`, `:root`)

| Token | Value |
|---|---|
| `--ink` | `rgba(255, 255, 255, 0.97)` |
| `--ink-2` | `rgba(233, 238, 245, 0.82)` |
| `--ink-3` | `rgba(219, 227, 236, 0.70)` |
| `--ink-4` | `rgba(212, 222, 234, 0.63)` |

The alphas carry a comment recording that they were set by measurement: at `0.38` the
label ink resolved to ~`rgb(90,95,100)` over the panel tint — 2.8:1, under AA — so
hierarchy is carried by size, tracking and case instead. **Do not lower these alphas
to buy visual hierarchy.** That is the exact mistake the comment exists to prevent.

### 1.2 Panel material

| Token | Value |
|---|---|
| `--panel` | `rgba(16, 22, 30, 0.56)` |
| `--panel-near` | `rgba(18, 24, 33, 0.66)` |
| `--panel-far` | `rgba(14, 19, 26, 0.42)` |
| `--panel-edge` | `rgba(255, 255, 255, 0.18)` |
| `--panel-lip` | `rgba(255, 255, 255, 0.34)` |
| `--panel-line` | `rgba(255, 255, 255, 0.10)` |

### 1.3 Accent + case hues

| Token | Value | Role |
|---|---|---|
| `--accent` | `#ff8a4c` | the site accent (ember) |
| `--accent-dim` | `rgba(255, 138, 76, 0.16)` | accent wash |
| `--teal` | `#5fe0cc` | case hue — water quality |
| `--ochre` | `#f0b357` | case hue — NVIDIA BI |
| `--violet` | `#b49cff` | case hue — face classification |

`ui/subpage.css` additionally defines `--ember: #ff8a4c` (the same value under a
second name, for per-page `--hue`) and `--ember-d: #ffc3a3`.

**CORRECTION (raised by review — the earlier claim here was wrong).** These five are
the *tokenised* hues, not the whole vocabulary. Enumerated across every `ui/*.css` and
`spatial/*.css` at the clean baseline `8bf87dd`, the site already contains **16** hex
literals:

```
#0e141b #10141a #5fe0cc #7df0dc #8ff0c8 #97a1ac #a9d8ff #b49cff
#e8eef5 #f0b357 #ff8a4c #ff9d6b #ff9d90 #ffc3a3 #ffc98a #fff
```

As first written, §6.1 ("reject any hex not in the list") would have rejected the clean
baseline and sent the next reviewer chasing eleven false positives. The correct test is
not membership of a five-item list — it is **whether the diff ADDS a hex**.

The measured baseline for that test: the hex set in `ui/` + `spatial/` at HEAD is
**byte-identical to the set at `8bf87dd`** — sixteen in, sixteen out, none added across
the whole task. Reproduce with:

```
for f in $(git ls-tree -r --name-only 8bf87dd | grep -E '^(ui|spatial)/.*\.css$'); do
  git show "8bf87dd:$f" | grep -oE "#[0-9a-fA-F]{3,8}"; done | sort -u
grep -rhoE "#[0-9a-fA-F]{3,8}" ui/*.css spatial/*.css | sort -u
```

### 1.4 Type

Font stack (`--sans`, `ui/base.css`):
```
'Instrument Sans', ui-sans-serif, system-ui, -apple-system,
'Segoe UI', Roboto, Helvetica, Arial, sans-serif
```
Self-hosted OFL, loaded via `fonts/instrument-sans.css`. `ui/subpage.css` aliases
`--serif: var(--sans)` — the retired serif role points at the one shipped face — and
defines `--mono: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono',
Menlo, monospace` for code only. **There is no second downloaded typeface and must not be.**

Scale (`ui/base.css:79–99`), root `font-size: 16px` on `body`:

| Role | Declaration |
|---|---|
| `.t-display` | `clamp(3.4rem, 8.2vw, 8.2rem)` · weight 500 · ls `-0.045em` · lh `0.92` |
| `.t-h1` | `clamp(2.1rem, 3.6vw, 3.4rem)` · ls `-0.036em` |
| `.t-h2` | `clamp(1.5rem, 2.2vw, 2.1rem)` · ls `-0.03em` |
| `.t-h3` | `1.14rem` · weight 600 · ls `-0.02em` |
| `.t-lede` | `clamp(1.02rem, 1.35vw, 1.22rem)` · lh 1.5 · `--ink-2` |
| `.t-body` | `0.98rem` · lh 1.62 · `--ink-2` |
| `.t-small` | `0.86rem` · lh 1.5 · `--ink-3` |
| `.t-label` | `0.66rem` · weight 600 · ls `0.19em` · uppercase · `--ink-4` |

`.t-label` is **the only uppercase-tracked role on the scale.** It is `0.66rem` at
weight 600 in `--ink-4`. Nav and dock are NOT labels and must not borrow this treatment.

### 1.5 Radii, easing, depth

| Token | Value |
|---|---|
| `--r-lg` | `26px` |
| `--r-md` | `18px` |
| `--r-sm` | `12px` |
| `--ease` | `cubic-bezier(0.22, 0.61, 0.36, 1)` |
| `--dur` | `520ms` |
| `--z-env / --z-far / --z-mid / --z-near / --z-chrome` | `0 / 10 / 20 / 30 / 40` |

### 1.6 Gutters (`ui/layout.css`, `:root`)

| Token | OURS (`8bf87dd`) | DRIFTED (HEAD) |
|---|---|---|
| `--gutter-l` | `clamp(252px, 19vw, 296px)` | `clamp(196px, 15vw, 234px)` ← revert |
| `--gutter-r` | `clamp(24px, 3vw, 64px)` | unchanged |
| `--gutter-t` | `clamp(24px, 4vh, 52px)` | unchanged |
| `--gutter-b` | `clamp(92px, 11vh, 124px)` | unchanged |

### 1.7 Untokenised values already in use (pre-existing — not new leakage)

So the reviewer can tell old raw values from new ones. These exist at `8bf87dd`:

- `spatial/material.css` panel `box-shadow` uses raw rgba stops
  (`rgba(255, 236, 214, 0.13)`, `rgba(0,0,0,0.55)`, `rgba(255,255,255,0.055)`,
  `0 2px 6px -2px rgba(0,0,0,0.5)`, `0 24px 48px -22px rgba(0,0,0,0.75)`).
  This is the material recipe; it is deliberately literal.
- `.env` / `.env::after` scrim gradients use raw `rgba(6,10,14,·)` and `rgba(0,0,0,·)` stops.
- Scrollbar colours `rgba(255,255,255,0.22 | 0.2)`.
- `--p-blur` values `22px / 18px / 16px / 14px`.

**Rule for the implementer:** you inherit these. You may not add new ones.

---

## 2. Component patterns

### 2.1 The `panel` primitive — `spatial/panel.js`

One function builds every surface. Sections choose a plane and an offset; **they never
style a panel themselves.** Signature: `panel({ plane, x, y, rot, tilt, scale,
interactive, tag, className })`. Writes `--p-x`, `--p-y`, `--p-rot`, `--p-tilt`,
`--p-scale` as inline custom properties, sets `data-plane`, and creates a `.panel-in`
child exposed as `el.content`. **Sections fill `el.content`, never the panel itself.**

Parallax depth factors by plane (`el.dataset.depth`): `far 0.18`, `mid 0.45`, `near 0.8`.

### 2.2 The glass — `spatial/material.css`

```
.panel {
  --p-tint: var(--panel);  --p-blur: 22px;  --p-lift: 0px;
  --p-rot: 0deg;  --p-tilt: 0deg;  --p-scale: 1;  --p-dim: 0;
  border-radius: var(--r-lg);
  background: var(--p-tint);
  backdrop-filter: blur(var(--p-blur)) saturate(1.35);
}
```
Plus a four-part `box-shadow` recipe: a lit lip on the top edge, a bright rim on the
light side (the plate lights from upper-right), a dark underside for thickness, and a
soft contact shadow. **This glass is the identity.** Stripping it from a surface — which
is exactly what `6a30424` did to `.rail` and `.dock` — is the drift.

`.panel-in { padding: clamp(22px, 2.4vw, 38px); }` (`ui/layout.css:184`)

### 2.3 Pointer parallax — `initParallax` in `spatial/panel.js`

`MAX = 16px` of travel at the nearest plane; damped follow `c += (t - c) * 0.075` per
frame; the env plate moves at `0.42 ×` the panel amount and is scaled `1.02` to hide its
edge. Disabled entirely under `prefers-reduced-motion` and on coarse pointers.

### 2.4 The `.sig` signage pattern (`ui/layout.css:200`)

```
.sig { position: absolute; left: 0; top: 2%; z-index: 1;
       pointer-events: none; max-width: 60%; }
.sig .t-display .l2 { display: block; padding-left: clamp(16px, 4vw, 64px); }
```
Display type set **into the room**, overlapped by the panels — deliberately not a
centred block floating over a backdrop (the comment at `ui/layout.css:196` says so).

---

## 3. NAV BAR — OURS, at `8bf87dd`

### 3.1 Markup — `buildRail()` in `ui/app.js`

```js
const p = panel({ plane: 'near', tag: 'nav', className: 'chrome rail' });
p.setAttribute('aria-label', 'Destinations');
p.content.append(
  h('div', { class: 'rail-mark' },
    h('b',    { text: 'Nawaf Almutairi' }),
    h('span', { text: 'NA' })),
  h('ol', {}, destinations.map(d => {
    const b = h('button', { type: 'button',
      'aria-current': String(d.id === active), onclick: () => go(d.id) },
      h('span', { class: 'n', text: d.index }),
      h('span', { text: d.label }));
    railButtons.set(d.id, b); return h('li', {}, b);
  })));
```

**It is a `panel({ plane: 'near' })`.** The rail is a real object in the room on the
nearest depth plane — not a bar. That is the single most important fact in this file.

### 3.2 Wordmark and labels — verbatim, `content/site.js:51`

Wordmark: **`Nawaf Almutairi`** (`<b>`) + monogram **`NA`** (`<span>`), sentence case.

| index | label |
|---|---|
| `01` | `Identity` |
| `02` | `Work` |
| `03` | `Stack` |
| `04` | `Journey` |
| `05` | `Contact` |

**Sentence case, not uppercase.** Uppercasing these is identity bleed.

### 3.3 Styling — OURS

```
.rail { left: clamp(18px, 2.4vw, 40px); top: 50%; transform: translateY(-50%);
        padding: 12px; border-radius: 22px; width: 212px; }
.rail-mark { display: flex; align-items: baseline; gap: 8px;
             padding: 10px 12px 14px; border-bottom: 1px solid var(--panel-line);
             margin-bottom: 8px; }
.rail-mark b    { font-weight: 600; font-size: 0.94rem; color: var(--ink);
                  letter-spacing: -0.02em; }
.rail-mark span { font-size: 0.62rem; letter-spacing: 0.16em;
                  text-transform: uppercase; color: var(--ink-4); }
.rail ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.rail button { width: 100%; display: grid; grid-template-columns: 26px 1fr;
               align-items: center; gap: 6px; padding: 10px 12px; border: 0;
               border-radius: 13px; background: transparent; color: var(--ink-3);
               font: inherit; font-size: 0.92rem; text-align: left; cursor: pointer;
               transition: background-color 240ms var(--ease), color 240ms var(--ease); }
.rail button .n { font-size: 0.62rem; letter-spacing: 0.1em; color: var(--ink-4);
                  font-variant-numeric: tabular-nums; }
.rail button:hover { background: rgba(255,255,255,0.06); color: var(--ink-2); }
.rail button[aria-current='true'] { background: rgba(255,255,255,0.1); color: var(--ink);
                                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.16); }
.rail button[aria-current='true'] .n { color: var(--accent); }
```
Progress indicator: `.rail { overflow: hidden }` + `.rail::after` — a `2px` bar,
`background: var(--accent)`, `transform: scaleY(var(--progress))` from `transform-origin: top`,
`opacity: 0.85`, `transition: transform 120ms linear`. Hidden when `html:not([data-travel])`.

**Current-destination cue is the filled pill** (`rgba(255,255,255,0.1)` + inset lip),
with the index in `--accent`. Not a colour-only change.

Responsive: at `≤1100px` `.rail { width: 168px; padding: 9px }`, buttons `0.86rem`,
`padding: 9px 10px`. At `≤820px` the rail becomes a full-width bottom bar
(`top:auto; left:0; right:0; bottom:0; width:100%; border-radius:0`), `.rail-mark`
hidden, `ol` switches to `grid-auto-flow: column`, buttons centre-justified at `0.7rem`
with `border-radius: 11px`. **The bottom bar keeps its panel background** — content
scrolls under it.

### 3.4 Contact dock — OURS

```
.dock { left: 50%; bottom: clamp(16px, 2.6vh, 30px); transform: translateX(-50%);
        display: flex; align-items: center; gap: 2px; padding: 7px; border-radius: 999px; }
.dock a { padding: 9px 18px; border-radius: 999px; font-size: 0.88rem;
          color: var(--ink-2); white-space: nowrap;
          transition: background-color 220ms var(--ease), color 220ms var(--ease); }
.dock a:hover { background: rgba(255,255,255,0.1); color: var(--ink); }
.dock .sep { width: 1px; height: 18px; background: var(--panel-line); margin: 0 4px; }
```
Also a `panel({ plane: 'near' })`. Links: `GitHub`, `LinkedIn`, `Email`, `Phone` —
sentence case. On mobile the dock moves to the **top** and the rail to the bottom, so
thumbs reach destinations and contact stays one tap away.

---

## 4. LANDING / HERO (Identity destination) — OURS, at `8bf87dd`

### 4.1 Structure — `sceneIdentity()` in `ui/app.js`

`.sig` (display signage) + three panels: `bio` `panel({plane:'near', tilt:-3})` id
`p-identity`; `intent` `panel({plane:'mid', tilt:2, rot:-0.5})` id `p-intent`;
`status` `panel({plane:'mid', tilt:4})` id `p-status`. All three are passed through
`makeDraggable()` — "the room is a place, so its panels can be picked up and moved."

### 4.2 Copy — verbatim, `content/site.js`

- Display: **`Nawaf`** / **`Almutairi`** (second line in `.l2`, indented).
- Discipline strap: **`AI × Data × Engineering`** (note: `×`, not `x`).
- Statement (`.t-h2`): **`I build the system behind the numbers.`**
- Bio ¶1: *"BSc Computer Science graduate of Northumbria University, based in Riyadh. I work at the intersection of data analysis, business intelligence and machine learning, with methodology at the centre of everything I build."*
- Bio ¶2: *"I think a lot about AI as a productivity tool, but I think more about the person holding it. The model is impressive; the operator decides whether the output is worth anything. Knowing what to ask, what to trust, and what to throw away is the actual job."*
- Intent (`.t-lede`): *"A dashboard is a decision tool, not wallpaper. Every project here is structured the same way: read the problem, design the system, then measure what changed."*
- Status keys/values: `Availability` → `Open · August 2026 graduate roles`;
  `Based` → `Riyadh, KSA · UTC+3`; `Community` → `Member of the Claude Builder Club by Anthropic`.

**British spelling (`centre`), `·` middots and `×` are ours.** Do not normalise them.

---

## 5. Revert checklist — what `6a30424` changed in the identity layer

Measured, not eyeballed: `scratchpad/harness/identity.mjs` compares the computed style
of every element in the rail, the dock and the Identity scene between `:8792` (baseline
`8bf87dd`) and `:8791` (working tree), across 1440×900 and 1280×720.

**Baseline run before any revert: 630 differing properties.** Target: 0.

The whole regression is one added block in `ui/layout.css` plus one token:

1. **Delete the entire `@media (min-width: 1101px)` block** headed
   `/* ─── chrome at the scale of chrome ─── */` (~58 lines, `ui/layout.css:86`).
   It sets `.rail, .dock { background: none; backdrop-filter: none; box-shadow: none;
   border-radius: 0 }` — i.e. it removes the glass — then rebuilds both as small
   uppercase text: `.rail { width: 152px; padding: 0 }`, `.rail .panel-in, .dock
   .panel-in { padding: 0 }`, `.rail button { font-size: 0.66rem; letter-spacing:
   0.15em; text-transform: uppercase; padding: 7px 0; border-radius: 0 }`,
   `.rail button:hover { background: none }`, `.rail button[aria-current='true']
   { background: none; box-shadow: none }`, `.rail::after { left: -11px; width: 1px }`,
   `.rail { overflow: visible }`, `.dock a { font-size: 0.66rem; letter-spacing: 0.15em;
   text-transform: uppercase }`, `.dock .sep { height: 10px }`.
2. **`--gutter-l`** back to `clamp(252px, 19vw, 296px)`.
3. **`#p-gallery-sig`** in `ui/gallery.css` — the Work `.t-h1` was overridden to
   `clamp(1.5rem, 2.5vw, 2.1rem)` and the heading absolutely positioned into the room.
   The Work heading is a `t-h1` on our scale; the override is off-scale and goes.
   The `id` added in `ui/app.js` goes with it.

Measured deltas confirming the above (sample from the harness):
`.rail button[0]` `fontSize 14.72px → 10.56px`, `fontWeight 400 → 500`,
`letterSpacing normal → 1.584px`, `padding 10px 12px → 7px 0px`, `gap 6px → 9px`;
`.rail li[n]` `width 126.562px → 152px`, `height 42.8125px → 30.3594px`.

**Motion work from `6a30424` is kept** — `spatial/gallery3d.js`, `ui/travel.js`, the
`spatial/gallery.js` `null`-append fix, the `.scene::before` mobile spacer fix, **and
the `ui/gallery.css` full-bleed room rework (+120 lines, the largest retained hunk —
this was missing from the list when review checked it)**. Only the identity layer reverts.

Five untokenised `rgba()` values arrived with that room rework and survive at HEAD:
`ui/gallery.css` `rgba(11,15,21,1)` / `rgba(6,9,13,1)` / `rgba(4,6,9,1)` (the room's
radial ground), `rgba(255,255,255,0.08)` (nav button), `rgba(6,9,13,0.66)` (the detail
scrim, replacing the baseline's `rgba(9,13,18,0.72)`); plus two WebGL grid colours in
`spatial/gallery3d.js` (`0x44536a`, `0x2b3646`, replacing `0x2a3542` / `0x1a212b`).
They are part of the ported room, which §1.7's licence covers, but they are listed here
rather than left for someone to find.

---

## 6. Rejection list — what counts as identity bleed here

Reject on sight, at review:

1. **Any hex literal the diff ADDS.** Not membership of a short list — see the
   correction in §1.3. The baseline set is 16 and is enumerated there; compare sets,
   don't spot-check. Likewise any `rgba()` the diff adds beyond §1.7.
2. **Any `font-family` that is not `var(--sans)` / `var(--mono)`.** No second webfont.
3. **Uppercase + tracked + transparent chrome.** Our chrome is glass panels with
   sentence-case labels. `text-transform: uppercase` on `.rail button` or `.dock a` is
   the drift signature.
4. **Stripping `backdrop-filter` / `box-shadow` / `border-radius` from `.rail` or `.dock`.**
   They are `panel({plane:'near'})`; the glass is the identity.
5. **Nav copy that is not** `Identity / Work / Stack / Journey / Contact`, or a wordmark
   that is not `Nawaf Almutairi` + `NA`.
6. **Any `font-size` not on the §1.4 scale**, in `rem` or otherwise, on an identity-layer
   element. Off-scale sizes are how the drift got in.
7. **Reference-site copy, asset names, class names or palette anywhere in the diff.**
8. Lowering `--ink-*` alphas to create hierarchy (see §1.1).
