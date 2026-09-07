# PROGRESS

Task: port the reference site's *motion and grid geometry* onto our own visual
identity. Reference: https://jesperlandberg.com/. Zero identity bleed.

## Current phase
All four surfaces implemented, reviewed, and the review acted on. Agent D
REJECTED with one blocking finding (B1) and five observations; all six are fixed
in `4795803`. Nothing is in flight.

## Next single action
Re-run Agent D against `4795803` for a second opinion on the fixes, or stop —
the acceptance criteria are met except the ones listed under "Blockers", which
need a human decision rather than more work.

## Ground truth established before spawning
- Repo: `nawafbalmutairi.github.io` (4-repo GitHub Pages portfolio, this is the main one).
- **No build step.** Plain HTML + CSS + ES modules, no bundler, no TypeScript, no lint
  config (`package.json`, `tsconfig.json`, `.eslintrc*` all absent — verified by `ls`).
  The "build passes / no TS or lint errors" criterion has no build to run; it is
  substituted with: every touched JS parses under `node --check`, CSS parses in the
  browser with no console errors, and the full Chrome regression battery is green.
  This substitution is a reported deviation, not a silent one.
- **The drift is localised to one commit**, `6a30424` ("Work: a room you stand in, and
  chrome at the scale of chrome"), made earlier in this same session.
  - `ui/layout.css` — a new `@media (min-width: 1101px)` block stripped the glass from
    `.rail`/`.dock`, shrank them to 0.66rem uppercase, and moved `--gutter-l` from
    `clamp(252px, 19vw, 296px)` to `clamp(196px, 15vw, 234px)`.
  - `ui/gallery.css` + `ui/app.js` — `#p-gallery-sig` shrank the Work `t-h1` to
    `clamp(1.5rem, 2.5vw, 2.1rem)` and moved it into the room.
  - This is exactly the identity layer the task says to restore.
- **`8bf87dd` is the last clean identity state** and is the contract Agent B documents.
  Retrieve any pre-drift file with `git show 8bf87dd:<path>`.

## Decisions
- **D1.** Earlier this session the user explicitly asked for the small/transparent
  reference-style chrome; they have now called that identity drift. Treated as a
  reversal of that request, not a contradiction to argue with. Nav and landing
  styling revert to `8bf87dd`; the *motion* work from `6a30424` is kept. Logged
  because the git history will otherwise look like a pointless round trip.
- **D3.** Agents A and B were both killed mid-flight by a session rate limit before
  either wrote a file. On resume, A is re-spawned (inspecting a live external site is
  real parallel work) but B's job is done in-session: this codebase is already in
  context, a cold agent would re-derive it at high cost, and the budget has just been
  proven finite. A is also instructed to write its spec incrementally so a second kill
  leaves partial results rather than nothing.
- **D2.** Agents A and B are genuinely parallel (A needs the browser and the public
  site, B needs only the repo) so they run concurrently. C and D are strictly
  sequential behind them. No perf agent yet — the WebGL layer already has measured
  numbers from this session (no long tasks at 4x CPU throttle); a perf agent is
  spawned only if C changes the render path.

## Instruments built (reusable by the reviewer)
- `scratchpad/baseline/` — the tree at `8bf87dd`, extracted with `git archive` so no
  git state is touched. Served on **:8792**. Working tree is served on **:8791**.
- `scratchpad/harness/identity.mjs` — **the identity contract test.** Compares the
  computed style of every element in the nav rail, the contact dock and the Identity
  destination between :8792 and :8791, across two viewports, plus the resolved value
  of every design token. Prints each differing property with was/now. Exit 0 only at
  zero differences. A pixel diff was rejected as the instrument: the Work room changed
  legitimately, and antialiasing noise would swamp small real regressions.
  - **Baseline run before any revert: 630 differences.** That number is the revert
    checklist, measured rather than eyeballed, and it is the metric surface 1 and 2
    must drive to 0.

## Completed surfaces
- **Surface 1 — nav bar** and **Surface 2 — landing page**, commit `603618b`.
  Reverted the drift: the `@media (min-width: 1101px)` chrome-override block,
  `--gutter-l`, the `#p-gallery-sig` off-scale heading override, and a literal
  `z-index: 6` that pushed chrome below its own `--z-chrome` token.
  **`identity.mjs`: 630 differences -> 0** at 1440x900 and 1280x720.
  Contrast 171 runs / min 5.11:1 / 0 AA failures. Diff greps clean for new hex,
  new font-family, `text-transform` on chrome, and reference-site strings.
  Motion work from `6a30424` deliberately retained.
- **Focus trap**, commit `ed579ae`. Not a surface, a criterion: the case-study
  dialog declared `aria-modal="true"` but held no focus. 24 tabs -> 5 inside /
  19 escaped, now 24 inside / 0 escaped. Found by measuring a criterion I had
  previously asserted without testing.

- **Surface 3 — grid geometry**, commit `b3c2559`. `motion-spec.md` §4 gives two
  `[confirmed]` ratios: cell height / viewport height = **0.435** (exact at 1280,
  1440, 1920) and gap / cell height = **0.0182-0.0272**. Both solved for our
  geometry rather than eyeballed: fov 55 -> **60.7** (2*atan(6.271/(2*5.35)),
  where 6.271 = our 2.728-unit plane / 0.435), STEP factor 0.96 -> **0.966**
  (9.5px gap, ratio 0.0243, mid-band; the curve is steep — 0.96 gives 6.5px and
  1.00 gives 26px). Measured with a new instrument `grid.mjs` that derives the
  plane's projected height from the declared camera contract, because a
  screenshot measures the curved bounding box plus the accent glow — a different
  quantity that would have shown this passing while it was not.
  Result 0.435 at all four viewports; the spec's own table reads 348.0 at
  1280x800 and 391.5 at 1440x900, we land within 0.1%.
- **Surface 4 — motion policy**, commit `332e5f5`. §6 `[confirmed]`: the
  reference gates its whole hover system behind `(hover: hover) and (pointer:
  fine)`. Ours had 21 hover rules and zero gates, so a tap on a touch screen
  applied `:hover` and it stuck. 20 moved into the gate; two rules that paired
  `:hover` with `:focus-visible` were split so keyboard focus stays ungated.
  Verified fine -> hover applies, coarse -> does not, focus ring present in both.

- **Review round 1**, commit `4795803`. Agent D rejected the state at `603618b`.
  - **B1 (blocking, real):** the restored 212px glass rail stood on the focused
    face at ~1101-1300px and on 5:4 displays. Mechanism the review caught and I
    had missed: the stage bleeds `calc(var(--gutter-l) * -1)` from a box that
    already starts at `--gutter-l`, so **the two cancel and the drum is centred
    on the window at every width** — restoring the gutter bought zero clearance.
    `OFFSET` had been tuned against the 152px transparent rail, and my own
    comment beside it asserted the collision was impossible. Independently
    re-measured (-34px at 1101x820, -38px at 1280x1024), then solved per layout
    in `reoffset()` against the rail's real rect. All viewports now clear >=36px.
  - **N2/N3:** the uppercase-tracked-transparent drift signature was still live
    on the Work project list at 10.24px, on the keyboard-only route. Removed;
    only the list's position is overridden now.
  - **N4/N5:** two factual errors in `theme-spec.md`, both mine. Corrected.
  - **N1:** `identity.mjs` was cited as proof at coverage that did not justify
    it. Widened to ~55 properties, both pseudo-elements, eight viewports.
  - Two of my own instruments were wrong and were fixed, not worked around:
    `identity.mjs` sampled an infinite keyframe at different phases; `contrast.mjs`
    read the ground behind glyphs an ancestor clips away.

## Criteria measured so far (evidence, not assertion)
| Criterion | Result | Instrument |
|---|---|---|
| Nav + landing identity unchanged | **0 differences** (from 630) | `identity.mjs` — ~55 props incl. pseudo-elements, **8 viewports**, + all tokens |
| Zero colours/fonts outside tokens | 0 new hex, 0 new `font-family`, 0 `text-transform` on chrome | grep over `git diff` |
| No reference-site code/copy/assets | 0 matches | grep over `git diff` |
| Contrast | 135 painted runs, min **5.11:1**, 0 AA failures | `contrast.mjs`, composited + hit-tested |
| Contrast, project list when painted | active **11.45:1**, inactive 7.26-7.73:1 | `focustab.mjs` |
| Rail never stands on a face | >=36px clearance at 10 viewports | `collide.mjs` |
| Grid ratio | **0.435** at 4 viewports, width inside the reference band | `grid.mjs` |
| Hover gated on a hover-capable pointer | fine: applies, coarse: does not, focus ring in both | `hover.mjs` |
| 60fps desktop | **0 frames over 16.7ms** during a 40-step drag (n=445, median 2.60ms, p95 2.70ms) | `a11y.mjs` §4. Headless: a budget check, not a display-rate claim |
| No long tasks | 0 under 4x CPU throttle | `perf.mjs` |
| `prefers-reduced-motion` | hero opacity 1 @ 118.08px, 3 panels, rail navigates both ways | `rm.mjs` |
| Keyboard + focus visible | outline `solid 2px` on `.rail button` and `.dock a` | `a11y.mjs` §1 |
| Focus trap when open | 24/24 inside, Escape closes | `a11y.mjs` §2 |
| Degrades gracefully | reduced motion / WebGL blocked / 1024 / 390 / no-JS / `#work` deep link all behave | `reg.mjs` |
| Panel uncropped | 1280x720 -> 1920x1080, min margin 120px | `fit.mjs` |
| Build / TS / lint | **N/A — no build step exists.** Substituted: `node --check` on touched JS, 0 console errors | see "Ground truth" above |

## Our current motion + grid numbers (for numeric diffing against Agent A's spec)
Recorded now so surface 3 is a comparison, not a rediscovery.
- **Work drum:** plane 4.34 x 2.728 world units; radius 5.2; angular step `(PW/R)*0.96`
  = 0.801 rad = 45.9deg; camera perspective fov 55, z 5.35, y 0.05; group offset x -0.55,
  y +0.22. Panel occupies 46-51% of frame width, 63-66% of height across six viewports.
- **Floor:** `GridHelper(120, 240)` = 0.5-unit cells, y -2.05; fog 9 -> 26.
- **Advance:** one project per gesture, `STEP_PX` 96, `QUIET_MS` 280 gate.
- **Follow:** time-based exponential `shown += d * (1 - exp(-dt * 5.0))`; velocity decay
  `exp(-dt * 9)`.
- **Destination travel:** segment `innerHeight * 0.42`; depth out 190px / in 230px;
  crossfade ramps `(0.02, 0.52)` out and `(0.46, 0.98)` in.
- **Pointer parallax:** max 16px at the near plane, damping `0.075`/frame, env at 0.42x.

## Blockers / deliberately not adopted
None are code defects. Each is a scope or fidelity call, listed as the brief asks.

1. **The spec's nav and hero choreography are null results, so they cannot be
   ported.** Agent A found `requestAnimationFrame` hard-throttled in the
   inspection pane — 11 callbacks in 13 seconds — and because *all* expressive
   motion on the reference is ticker-driven, none of it played. That single cause
   blocks the intro sequence, nav entry animation, overlay choreography,
   preloader fill, page transitions, pointer reaction and **every stagger
   interval on the site**. Agent A logged them as measured-and-empty rather than
   inventing values, which is right. **Consequence: the acceptance criterion
   "same reveal sequence and stagger as spec" has no spec to match against.** It
   is not implemented and must not be claimed. Fix costs ~2 minutes in a normal
   focused browser (§10 has the recipe).
2. **Scroll damping factor is `[inferred, +/-100%]`** (k ~ 0.06-0.12), same cause.
   Our gallery already uses the dt-normalised exponential lerp that §5 says is
   the part worth copying, so the architecture matches even though the constant
   cannot be checked.
3. **Fluid root font-size (`100vw/150`) — rejected, not deferred.** The brief
   names type and spacing scale as identity. Ours is `clamp()`-based and already
   fluid inside our own tokens; adopting their divisor would replace the type
   scale wholesale. This is the correct call, not a gap.
4. **One breakpoint at 650px — not adopted.** Ours are 1101 / 820 / 380 and each
   marks a real change of layout mode (the 3D room needs >=1101). Rewriting the
   responsive strategy late in the task is high risk for a stylistic gain.
5. **Variable-width cells from intrinsic `aspect-ratio` — not adopted.** All nine
   faces are drawn at 1400x880 by `spatial/faces.js`; variable aspect means
   redrawing nine bespoke compositions. Uniform height is matched; variable width
   is a content change, and it needs a decision, not a guess.
6. **Their easing `cubic-bezier(0, 0, 0.2, 1)` — policy adopted, value not.**
   Our `--ease` is already an ease-out with no overshoot and `--dur: 520ms` is
   within 4% of their 0.5s state duration. One `ease-in-out` remains, on the
   decorative `.travel-cue` ping-pong; a symmetric loop wants symmetric easing
   and it is already `animation: none` under `prefers-reduced-motion`. Kept
   deliberately.
7. **Camera FOV of the reference is not observable from outside the page.** No
   estimate was given anywhere and none was invented. Our 60.7 is derived from
   the measured cell ratio, not copied.
