# Work section redesign — agreed plan

Settled through a Q&A pass on 2026-09-07. Reference: jesperlandberg.com.
Rule throughout: **their design and their animation, our theme.**

Nothing here is built yet. This document is the thing to check.

---

## The two surfaces

| | What it is |
|---|---|
| **Surface A — the carousel** | The index. All nine projects on the drum. (User's image 1.) |
| **Surface B — the project overlay** | What opens when you click a project. (User's image 2.) |

Built in that order. A ships and is reviewed before B starts.

---

## Settled decisions

### Theme — ours, not theirs
The reference is pure black. **We are not going black.** The Work destination keeps the
environment plate and the glass — the visionOS room the rest of the site lives in.

**Consequence, stated plainly:** Surface A will not look identical to image 1. A large
part of that image's impact comes from panels lit against pure black. On a photographic
plate they will read softer. This is a deliberate trade the user chose; it is not a
defect to be "fixed" later by creeping toward black.

Concrete change: the Work stage currently paints an **opaque** near-black radial ground
(`ui/gallery.css`, `html[data-travel] #p-gallery .gal[data-gl] .gal-stage`). That was
added to fake the reference's black. It comes out. The plate shows through, **dimmed to
roughly a third** under Work only, so the floor grid still reads (Q6b).

### Panels
- **Aspect 4:3** — exactly the reference's proportion. Down from our current 1.59.
- **Nine panels**, hard ends, no infinite wrap (Q9). At either end the wheel is released
  to the page so Stack / Journey / Contact stay reachable. This is the one place we
  deliberately break from "same animation": their carousel wraps forever because their
  whole site *is* the carousel. Ours is one destination of five.
- **Grid floor stays**, over the dimmed plate.

### What is on each panel
Hybrid (Q2 "mix", Q7). Three photographic, six drawn — all reformatted to 4:3.

| Project | Face | Source |
|---|---|---|
| Water quality | photographic | `r2-heatmap.png` 1847×1297 or a Power BI page |
| NVIDIA supply chain | photographic | `dashboard.png` 1482×834 |
| US Retail Sales | photographic | **to be captured** — live Chart.js dashboard, 10 canvases |
| Face classification | drawn | `faceVersus` |
| Conference Microservices | drawn | existing |
| ITIL Config Management | drawn | `faceRegister` |
| UCD Work-Life App | drawn | `faceScreens` |
| Vision 2030 KPI Tracker | drawn | `faceDials` |
| GitHub Portfolio | drawn | `faceCommits` |

The six drawn faces are **reformatted, not redesigned** (Q13a) — same nine compositions
in `spatial/faces.js`, re-laid-out from 1400×880 to 1400×1050, using the extra vertical
room for breathing space.

### Panel motion — Ken Burns, not video
**Finding, measured:** the reference's panels are not animating on hover. Each plays a
**looping `high.mp4` decoded into a WebGL texture** (7 video requests, 0 `<video>`
elements, 56 `.ktx2` compressed thumbnails). Verified by parking the cursor far from
every panel and shooting 5 s apart — the panels still changed. What reads as a hover
response is just playback continuing.

We have **no video and no honest way to make it** — six of the nine subpages render our
own template, so screen recordings would look like each other, not like distinct projects.

So: **slow Ken Burns drift on all nine faces** (Q20b). A continuous pan and scale across
the face texture, so every panel changes constantly, inventing nothing. Off under
`prefers-reduced-motion`.

*Not layered:* cross-fading between a project's multiple images. Water-quality (3) and
NVIDIA (4) could support it; the user chose plain (b). Available later if wanted.

### Titles
Adopt the reference's treatment (Q3). Large **white sentence-case title at each panel's
lower-left**, anchored in 3D so it travels with the panel — roughly 3× its current size.

**Our bottom caption strip is deleted.** Its accessible content (kicker, lede, open
button) stays in the DOM, visually hidden and revealed on focus, the way the project
list already works.

### Arrows
Present as **decorative guides only** (Q10 + Q14 — "nothing, just pointing and guiding,
no effect"). Therefore `aria-hidden`, not focusable, no click handler. Clicking the
panel is what opens a project.

### Hover
The panel keeps our existing 8 px lift and brighten — theme, not animation. The
continuous change the user wanted comes from the Ken Burns drift, which runs regardless
of hover, matching what the reference actually does.

---

## Surface B — the project overlay

Opens **in-page for all nine** (Q8a). Rises and fades in over ~0.4 s; the room dims
behind it and never unmounts, so closing returns you to the exact panel, still focused.
The wheel scrolls the overlay's content, not the room. Escape and the round × both close.
Focus trap and scroll lock already exist and are reused.

Layout follows the reference (Q11), in our dark theme:

- **Left column** — project title, large. One-line lede beneath it. Then the metadata row.
- **Metadata row** — kept minimal, matching theirs in count (Q12 "not too much info"):
  a circular ↗ button, then two pills: **year** and **discipline**. The headline figure
  and the stack tags live further down, not in this row.
- **Right column** — **one designed hero block per project, then that project's real
  content below it** (Q16b). Full fidelity — three or four bespoke blocks per project
  across all nine — was considered and rejected as 27–36 designed surfaces.
- **Round × top-right.**

The existing subpages stay as the deep, linkable long-form version, reached from the ↗.

---

## Mobile and no-WebGL (Q19)

Below 1101 px, or with WebGL blocked, there is no room and nothing is simulated:
a plain vertical stack of project cards, each showing its face as a flat image plus
title and discipline. Tapping opens the same overlay as a **single scrolling column**.

---

## Applied without asking — not style choices

- `prefers-reduced-motion` disables the Ken Burns drift and the overlay's rise.
- The render loop still spins only while something is actually moving; a drifting panel
  keeps it alive, at rest it stops.
- Decorative arrows are `aria-hidden` and unfocusable.
- Every value comes from the token set in `docs/theme-spec.md`. No new hex, no second
  typeface.
- The identity contract test (`identity.mjs`, 8 viewports) must stay at 0 differences —
  the nav rail and landing page are not in scope and must not move.

---

## Known costs and risks

1. **Six faces reformatted to 4:3.** Mechanical but not trivial; each composition's
   internal layout has to be re-fitted.
2. **One screenshot to capture** — the retail dashboard, from its live page.
3. **Nine hero blocks to design** for the overlay, plus content layout beneath each.
4. **The plate-vs-black trade** (above). The biggest expectation risk in the whole plan.
5. **`assets/case-loops.webp`** (1200×675) is referenced nowhere. Left alone unless asked.

## Explicitly not doing

- Video textures — no content exists.
- Infinite wrap — would trap the wheel in Work.
- Pure black — user rejected.
- Curating to three projects — considered, rejected; all nine stay.
- Cross-fading multiple images per project — user chose plain Ken Burns.
