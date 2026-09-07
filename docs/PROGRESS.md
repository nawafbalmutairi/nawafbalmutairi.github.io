# PROGRESS

Task: port the reference site's *motion and grid geometry* onto our own visual
identity. Reference: https://jesperlandberg.com/. Zero identity bleed.

## Current phase
Phase 1 — specs. Agent A (inspector) re-running after a rate-limit kill.
Theme audit being written in-session rather than by Agent B (see D3).

## Next single action
Finish `docs/theme-spec.md` in-session, then revert the nav bar (surface 1) to the
`8bf87dd` declarations and re-run `identity.mjs` until it reports 0 differences.

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
_(none yet)_

## Open blockers
_(none yet)_
