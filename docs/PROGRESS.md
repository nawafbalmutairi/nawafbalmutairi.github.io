# PROGRESS

Task: port the reference site's *motion and grid geometry* onto our own visual
identity. Reference: https://jesperlandberg.com/. Zero identity bleed.

## Current phase
Phase 2 done. Surfaces 1 and 2 (nav bar, landing page) committed as `603618b`;
a focus-trap fix found while measuring the criteria committed as `ed579ae`.
Agent A still inspecting the reference for `docs/motion-spec.md`.
Agent D reviewing surfaces 1-2 adversarially. Both still running.

## Next single action
When `docs/motion-spec.md` lands, diff its GRID and SCROLL MODEL sections against
what `spatial/gallery3d.js` and `ui/travel.js` already do, and close any numeric gap
(surface 3). Do not touch the identity layer again — `identity.mjs` must stay at 0.

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

## Criteria measured so far (evidence, not assertion)
| Criterion | Result | Instrument |
|---|---|---|
| Nav + landing identity unchanged | **0 differences** (from 630) | `identity.mjs`, 2 viewports, computed style + tokens |
| Zero colours/fonts outside tokens | 0 new hex, 0 new `font-family`, 0 `text-transform` on chrome | grep over `git diff` |
| No reference-site code/copy/assets | 0 matches | grep over `git diff` |
| Contrast | 171 runs, min **5.11:1**, 0 AA failures | `contrast.mjs`, composited sampling |
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

## Open blockers
_(none yet)_
