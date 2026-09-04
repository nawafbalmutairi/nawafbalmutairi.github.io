# Three.js Portfolio — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the portfolio homepage as an AI/data-themed Three.js experience that degrades to a fully readable static page.

**Architecture:** One fixed WebGL canvas behind DOM content. Scroll position drives a registry of scene modules; exactly one scene updates per frame. All text lives in DOM. No build step — Three.js arrives via CDN import map.

**Tech Stack:** Three.js r169 (jsDelivr, ESM), vanilla ES modules, plain CSS custom properties, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-04-threejs-portfolio-rebuild-design.md`

## Global Constraints

- No build step, no npm, no CI. Every file is served as authored.
- Three.js pinned to exactly `0.169.0` via import map. Never use a bare unpinned specifier.
- All copy lives in DOM. Nothing readable may exist only inside WebGL.
- Canvas is always `aria-hidden="true"` and `pointer-events: none`.
- Palette tokens, verbatim: `--bg #05070a`, `--ink #e8eaf0`, `--ember #e64d2e`, `--cyan #38bdf8`, `--violet #a78bfa`.
- Fonts unchanged: Newsreader (serif), Inter (sans), JetBrains Mono (mono).
- Confirmed figures, use exactly: **8.3M** samples, **96.4%** forecast accuracy, **86.7%** DenseNet accuracy, **15+** projects shipped, **R² 0.79** (XGBoost × water temp), four models (Ridge, Random Forest, MLP, XGBoost).
- Never call `dispose()` on a scene merely because it left the viewport — pause it.
- The repo is inside a OneDrive-synced folder. Commit after every task.

## Testing Approach

There is no test runner, by design — adding one would violate the no-build constraint. Instead:

- **Pure logic** (`util/`, `scroll.js`) gets real assertions in `tests/smoke.html`, a dependency-free harness opened in a browser. These are genuine pass/fail tests.
- **Visual/GPU behaviour** is verified by observation against stated expected output.

Run the harness with:

```bash
python -m http.server 8000
```

then open `http://localhost:8000/tests/smoke.html`.

---

### Task 1: Test harness, tokens, and pure utilities

**Files:**
- Create: `tests/smoke.html`, `tests/smoke.js`
- Create: `src/util/lerp.js`, `src/util/capabilities.js`, `src/util/reducedMotion.js`
- Create: `styles/tokens.css`

**Interfaces:**
- Produces: `clamp(v,min,max)`, `lerp(a,b,t)`, `smoothstep(e0,e1,x)` from `lerp.js`; `detectTier(env) -> 'none'|'low'|'high'`, `pointBudget(tier) -> number`, `readEnvironment() -> {hasWebGL2,isMobile,deviceMemory}` from `capabilities.js`; `prefersReducedMotion() -> boolean` from `reducedMotion.js`.

- [ ] **Step 1: Write the failing tests**

`tests/smoke.js`:

```js
import { clamp, lerp, smoothstep } from '../src/util/lerp.js';
import { detectTier, pointBudget } from '../src/util/capabilities.js';

const results = [];
function check(name, fn) {
  try { fn(); results.push(['PASS', name]); }
  catch (e) { results.push(['FAIL', name + ' — ' + e.message]); }
}
function eq(a, b) {
  if (a !== b) throw new Error(`expected ${b}, got ${a}`);
}

check('clamp bounds low', () => eq(clamp(-5, 0, 1), 0));
check('clamp bounds high', () => eq(clamp(5, 0, 1), 1));
check('clamp passes through', () => eq(clamp(0.5, 0, 1), 0.5));
check('lerp midpoint', () => eq(lerp(0, 10, 0.5), 5));
check('smoothstep clamps below', () => eq(smoothstep(0, 1, -1), 0));
check('smoothstep clamps above', () => eq(smoothstep(0, 1, 2), 1));

check('tier none without webgl', () =>
  eq(detectTier({ hasWebGL2: false, isMobile: false, deviceMemory: 8 }), 'none'));
check('tier low on mobile', () =>
  eq(detectTier({ hasWebGL2: true, isMobile: true, deviceMemory: 8 }), 'low'));
check('tier low on small memory', () =>
  eq(detectTier({ hasWebGL2: true, isMobile: false, deviceMemory: 2 }), 'low'));
check('tier high on desktop', () =>
  eq(detectTier({ hasWebGL2: true, isMobile: false, deviceMemory: 8 }), 'high'));
check('budget scales with tier', () => {
  if (!(pointBudget('high') > pointBudget('low'))) throw new Error('high must exceed low');
  eq(pointBudget('none'), 0);
});

function render() {
  const out = document.getElementById('out');
  out.textContent = results.map(([s, n]) => `${s}  ${n}`).join('\n');
  const failed = results.filter(r => r[0] === 'FAIL').length;
  document.getElementById('summary').textContent =
    `${results.length - failed}/${results.length} passing`;
  document.title = failed ? `FAIL (${failed})` : 'ALL PASS';
}
render();
```

`tests/smoke.html`:

```html
<!doctype html>
<meta charset="utf-8">
<title>smoke</title>
<style>body{background:#05070a;color:#e8eaf0;font:14px ui-monospace,monospace;padding:24px}
h1{font-size:16px;color:#38bdf8}pre{line-height:1.6}</style>
<h1 id="summary">running…</h1>
<pre id="out"></pre>
<script type="module" src="./smoke.js"></script>
```

- [ ] **Step 2: Run tests to verify they fail**

Run `python -m http.server 8000`, open `http://localhost:8000/tests/smoke.html`.
Expected: summary still reads `running…`, console shows a module resolution error for `../src/util/lerp.js`.

- [ ] **Step 3: Write minimal implementations**

`src/util/lerp.js`:

```js
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
```

`src/util/capabilities.js`:

```js
const BUDGETS = { none: 0, low: 12000, high: 60000 };

export function detectTier({ hasWebGL2, isMobile, deviceMemory }) {
  if (!hasWebGL2) return 'none';
  if (isMobile) return 'low';
  if (typeof deviceMemory === 'number' && deviceMemory <= 4) return 'low';
  return 'high';
}

export function pointBudget(tier) {
  return BUDGETS[tier] ?? 0;
}

export function readEnvironment() {
  let hasWebGL2 = false;
  try {
    const c = document.createElement('canvas');
    hasWebGL2 = !!c.getContext('webgl2');
  } catch { hasWebGL2 = false; }
  return {
    hasWebGL2,
    isMobile: matchMedia('(max-width: 767px), (pointer: coarse)').matches,
    deviceMemory: navigator.deviceMemory,
  };
}
```

`src/util/reducedMotion.js`:

```js
export function prefersReducedMotion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

`styles/tokens.css`:

```css
:root{
  --bg:#05070a; --bg-2:#0b0f16; --ink:#e8eaf0; --ink-2:#9aa3b2; --mute:#5d6675;
  --line:rgba(232,234,240,.12);
  --ember:#e64d2e; --cyan:#38bdf8; --violet:#a78bfa;
  --serif:'Newsreader',Georgia,serif;
  --sans:'Inter',-apple-system,sans-serif;
  --mono:'JetBrains Mono',ui-monospace,monospace;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Reload `http://localhost:8000/tests/smoke.html`.
Expected: `11/11 passing`, tab title `ALL PASS`.

- [ ] **Step 5: Commit**

```bash
git add tests src/util styles/tokens.css
git commit -m "test: add smoke harness; feat: add tier detection and math utils"
```

---

### Task 2: Static page — full DOM content, zero JavaScript

Ships on its own. If every later task were abandoned, this is still a complete, working portfolio.

**Files:**
- Create: `styles/base.css`, `styles/sections.css`
- Modify: `index.html` (full replacement)
- Reference: previous version recoverable via `git show HEAD:index.html`

**Interfaces:**
- Consumes: `styles/tokens.css` (Task 1).
- Produces: DOM section ids consumed by Task 4 — `#hero`, `#statement`, `#impact`, `#case-01`, `#case-02`, `#case-03`, `#contact`. These exact ids are the contract.

- [ ] **Step 1: Extract existing copy**

```bash
git show HEAD:index.html > /tmp/old-index.html
```

Carry over verbatim, changing no wording: the biography ("I'm Nawaf — a BSc Computer Science graduate of Northumbria University, based in Riyadh…"), the statement of intent ("I don't believe in dashboards that just report numbers…"), the `problem → system → outcome` throughline, the three case narratives including the deprecated-API story, the Riyadh / `24.71°N · 46.67°E` / UTC+3 detail, "Open · August 2026 graduate roles", Claude Builder Club membership, `NawafBAlmutairi@outlook.sa`, `+966501649447`, and the existing links to all 9 subpages.

- [ ] **Step 2: Build the page shell**

`index.html`:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nawaf Almutairi — Data · BI · Machine Learning</title>
<meta name="description" content="Nawaf Almutairi — BSc Computer Science graduate, Northumbria University. Data analysis, business intelligence, and machine learning. Open to August 2026 graduate roles.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="./styles/tokens.css">
<link rel="stylesheet" href="./styles/base.css">
<link rel="stylesheet" href="./styles/sections.css">
</head>
<body>
<canvas id="gl" aria-hidden="true"></canvas>
<main>
  <section id="hero">…</section>
  <section id="statement">…</section>
  <section id="impact">…</section>
  <section id="case-01">…</section>
  <section id="case-02">…</section>
  <section id="case-03">…</section>
  <section id="contact">…</section>
</main>
</body>
</html>
```

The impact section uses the confirmed figures as static text — no counter animation, no JS dependency:

```html
<section id="impact">
  <div class="imp-cell"><p class="imp-fn">01 / ML Dissertation</p>
    <p class="imp-num">8.3<span class="sm">M</span></p>
    <p class="imp-label">Samples benchmarked across four models.</p></div>
  <div class="imp-cell"><p class="imp-fn">02 / NVIDIA BI Dashboard</p>
    <p class="imp-num">96.4<span class="sm">%</span></p>
    <p class="imp-label">Forecast accuracy, AI-GPU supply chain.</p></div>
  <div class="imp-cell"><p class="imp-fn">03 / Face Classifier</p>
    <p class="imp-num">86.7<span class="sm">%</span></p>
    <p class="imp-label">DenseNet test accuracy, real-time inference.</p></div>
  <div class="imp-cell"><p class="imp-fn">Cumulative</p>
    <p class="imp-num">15<span class="sm">+</span></p>
    <p class="imp-label">Projects shipped — data, ML, BI, software.</p></div>
</section>
```

- [ ] **Step 3: Write the canvas and fallback CSS**

`styles/base.css` — the canvas must be invisible until JS opts in, so a JS failure leaves a clean page:

```css
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--ink);font-family:var(--sans);
  -webkit-font-smoothing:antialiased;overflow-x:hidden}
img{max-width:100%;display:block}
a{color:inherit}
:focus-visible{outline:2px solid var(--cyan);outline-offset:3px}
::selection{background:var(--ember);color:var(--bg)}

#gl{position:fixed;inset:0;width:100%;height:100%;
  z-index:0;pointer-events:none;display:none}
html.webgl-active #gl{display:block}
main{position:relative;z-index:1}

@media (prefers-reduced-motion: reduce){
  html{scroll-behavior:auto}
  *{animation:none!important;transition:none!important}
}
```

`styles/sections.css` holds per-section layout. Each `<section>` gets
`min-height:100vh` and generous padding so scenes have scroll range to animate across.

- [ ] **Step 4: Verify the static page**

Open `http://localhost:8000/`.
Expected: complete dark portfolio, all seven sections readable, all subpage links working, no canvas visible, **zero console errors**.

Then confirm content parity:

```bash
git show HEAD:index.html | sed 's/<[^>]*>/ /g' | tr -s ' \n' ' \n' | sort -u > /tmp/old-words.txt
sed 's/<[^>]*>/ /g' index.html | tr -s ' \n' ' \n' | sort -u > /tmp/new-words.txt
comm -23 /tmp/old-words.txt /tmp/new-words.txt | head -40
```

Expected: only styling/markup tokens dropped. **Any missing prose word is a defect — restore it.**

- [ ] **Step 5: Commit**

```bash
git add index.html styles
git commit -m "feat: rebuild homepage as static dark page with full content"
```

---

### Task 3: Stage and render loop with hard fallback

**Files:**
- Create: `src/stage.js`, `src/main.js`
- Modify: `index.html` (add import map + module script)

**Interfaces:**
- Consumes: `readEnvironment`, `detectTier`, `pointBudget` (Task 1); `prefersReducedMotion` (Task 1).
- Produces: `createStage({canvas, tier, reducedMotion}) -> { renderer, scene, camera, setSize(), render(), dispose() }`.

- [ ] **Step 1: Add the import map**

In `index.html`, immediately before `</body>`:

```html
<script type="importmap">
{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/"
}}
</script>
<script type="module" src="./src/main.js"></script>
```

- [ ] **Step 2: Write the stage**

`src/stage.js`:

```js
import * as THREE from 'three';

export function createStage({ canvas, tier, reducedMotion }) {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: tier === 'high', alpha: true, powerPreference: 'high-performance',
  });
  const maxDpr = tier === 'high' ? 2 : 1.5;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  camera.position.set(0, 0, 12);

  function setSize() {
    const w = innerWidth, h = innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio, maxDpr));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  setSize();
  addEventListener('resize', setSize, { passive: true });

  return {
    renderer, scene, camera, setSize,
    render() { renderer.render(scene, camera); },
    dispose() {
      removeEventListener('resize', setSize);
      renderer.dispose();
    },
  };
}
```

- [ ] **Step 3: Write the bootstrap with fallback**

`src/main.js` — the entire 3D path is wrapped so that a CDN failure, a missing WebGL2 context, or any thrown error leaves the static page intact:

```js
import { readEnvironment, detectTier, pointBudget } from './util/capabilities.js';
import { prefersReducedMotion } from './util/reducedMotion.js';

const env = readEnvironment();
const tier = detectTier(env);
const reduced = prefersReducedMotion();

async function boot() {
  if (tier === 'none') return;
  try {
    const canvas = document.getElementById('gl');
    const { createStage } = await import('./stage.js');
    const stage = createStage({ canvas, tier, reducedMotion: reduced });
    document.documentElement.classList.add('webgl-active');

    if (reduced) { stage.render(); return; }

    let last = performance.now();
    requestAnimationFrame(function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      stage.render();
      requestAnimationFrame(frame);
    });
  } catch {
    document.documentElement.classList.remove('webgl-active');
  }
}

if (document.readyState === 'complete') queueMicrotask(boot);
else addEventListener('load', boot, { once: true });
```

`boot()` runs only after `load`, so text paints before any 3D work begins.
The `try/catch` is what turns a jsDelivr outage into a clean static page
rather than a blank screen.

- [ ] **Step 4: Verify all three paths**

1. Normal: open the site. Expected: `html.webgl-active` present in the inspector, page fully readable, no console errors.
2. CDN blocked: DevTools → Network → block request URL `cdn.jsdelivr.net`, reload. Expected: **static page renders normally**, no blank screen, no visible error.
3. Reduced motion: DevTools → Rendering → emulate `prefers-reduced-motion: reduce`, reload. Expected: one frame rendered, no ongoing RAF activity in a Performance recording.

All three must be observed before committing.

- [ ] **Step 5: Commit**

```bash
git add src/stage.js src/main.js index.html
git commit -m "feat: add WebGL stage with static-page fallback on any failure"
```

---

### Task 4: Scroll driver and scene lifecycle

**Files:**
- Create: `src/scroll.js`
- Modify: `src/main.js`, `tests/smoke.js`

**Interfaces:**
- Consumes: `clamp` (Task 1); stage from Task 3.
- Produces: `sectionProgress(scrollY, viewportH, top, height) -> 0..1`; `activeIndex(scrollY, viewportH, rects) -> number|-1`; `createScrollDriver(ids) -> { measure(), read() }`.
- Produces the **scene contract** every later task implements: a module default-exporting `{ id, init(ctx), update(dt, progress), dispose() }` where `ctx = { scene, camera, renderer, tier, budget }`.

- [ ] **Step 1: Write the failing tests**

Insert into `tests/smoke.js` — import at top, checks before `render()`:

```js
import { sectionProgress, activeIndex } from '../src/scroll.js';

check('progress 0 before section', () => eq(sectionProgress(0, 800, 1600, 800), 0));
check('progress 1 after section', () => eq(sectionProgress(4000, 800, 1600, 800), 1));
check('progress mid', () => eq(sectionProgress(1600, 800, 1600, 800), 0.5));
check('activeIndex picks overlapping', () =>
  eq(activeIndex(0, 800, [{top:0,height:800},{top:800,height:800}]), 0));
check('activeIndex second section', () =>
  eq(activeIndex(900, 800, [{top:0,height:800},{top:800,height:800}]), 1));
check('activeIndex none past end', () =>
  eq(activeIndex(9000, 800, [{top:0,height:800}]), -1));
```

- [ ] **Step 2: Run tests to verify they fail**

Reload `tests/smoke.html`. Expected: module resolution error for `../src/scroll.js`.

- [ ] **Step 3: Implement**

`src/scroll.js`:

```js
import { clamp } from './util/lerp.js';

export function sectionProgress(scrollY, viewportH, top, height) {
  const start = top - viewportH;
  const span = height + viewportH;
  return clamp((scrollY - start) / span, 0, 1);
}

export function activeIndex(scrollY, viewportH, rects) {
  const mid = scrollY + viewportH / 2;
  for (let i = 0; i < rects.length; i++) {
    const { top, height } = rects[i];
    if (mid >= top && mid < top + height) return i;
  }
  return -1;
}

export function createScrollDriver(ids) {
  const els = ids.map(id => document.getElementById(id));
  let rects = [];
  function measure() {
    rects = els.map(el => {
      const r = el.getBoundingClientRect();
      return { top: r.top + scrollY, height: r.height };
    });
  }
  measure();
  addEventListener('resize', measure, { passive: true });
  return {
    measure,
    read() {
      const i = activeIndex(scrollY, innerHeight, rects);
      if (i === -1) return { index: -1, id: null, progress: 0 };
      const { top, height } = rects[i];
      return { index: i, id: ids[i], progress: sectionProgress(scrollY, innerHeight, top, height) };
    },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Reload `tests/smoke.html`. Expected: `17/17 passing`, title `ALL PASS`.

- [ ] **Step 5: Wire lifecycle into main.js**

Scenes initialise on first entry, pause when not active, and are disposed only on teardown — per spec §6. Add to `main.js`:

```js
import { createScrollDriver } from './scroll.js';

const SECTIONS = ['hero','statement','impact','case-01','case-02','case-03','contact'];
const registry = new Map();   // id -> scene module
const live = new Map();       // id -> initialised module

function syncScenes(driver, ctx, dt) {
  const { id, progress } = driver.read();
  if (!id) return;
  const mod = registry.get(id);
  if (!mod) return;
  if (!live.has(id)) { mod.init(ctx); live.set(id, mod); }
  mod.update(dt, progress);          // only the active scene updates
}
```

In `boot()`, build `ctx = { scene: stage.scene, camera: stage.camera, renderer: stage.renderer, tier, budget: pointBudget(tier) }`, create the driver with `SECTIONS`, and call `syncScenes(driver, ctx, dt)` inside the frame loop before `stage.render()`.

- [ ] **Step 6: Commit**

```bash
git add src/scroll.js src/main.js tests/smoke.js
git commit -m "feat: add scroll driver and scene lifecycle"
```

---

### Task 5: Hero scene — latent embedding field

**Files:**
- Create: `src/scenes/latentField.js`, `src/shaders/points.js`
- Modify: `src/main.js` (register into `registry`)

**Interfaces:**
- Consumes: scene contract and `ctx` (Task 4); `lerp` (Task 1).
- Produces: default export `{ id:'hero', init, update, dispose }`.

- [ ] **Step 1: Write the shaders**

`src/shaders/points.js` — points start as noise and resolve into a manifold as `uResolve` goes 0→1:

```js
export const vert = /* glsl */`
uniform float uTime, uResolve, uSize;
attribute vec3 aTarget;
attribute float aSeed;
varying float vDepth;
void main(){
  vec3 p = mix(position, aTarget, uResolve);
  p.y += sin(uTime * 0.5 + aSeed * 6.283) * 0.06;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vDepth = -mv.z;
  gl_PointSize = uSize * (12.0 / vDepth);
  gl_Position = projectionMatrix * mv;
}`;

export const frag = /* glsl */`
precision mediump float;
uniform vec3 uColorA, uColorB;
varying float vDepth;
void main(){
  vec2 d = gl_PointCoord - 0.5;
  float a = smoothstep(0.5, 0.15, length(d));
  if (a < 0.01) discard;
  vec3 c = mix(uColorA, uColorB, clamp(vDepth / 24.0, 0.0, 1.0));
  gl_FragColor = vec4(c, a * 0.85);
}`;
```

- [ ] **Step 2: Implement the scene**

`src/scenes/latentField.js`:

```js
import * as THREE from 'three';
import { vert, frag } from '../shaders/points.js';
import { lerp } from '../util/lerp.js';

let points, material, geometry;
const pointer = { x: 0, y: 0 };

function onPointer(e) {
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = (e.clientY / innerHeight) * 2 - 1;
}

export default {
  id: 'hero',
  init({ scene, tier, budget }) {
    const n = budget;
    const pos = new Float32Array(n * 3);
    const tgt = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 40;
      pos[i*3+1] = (Math.random() - 0.5) * 40;
      pos[i*3+2] = (Math.random() - 0.5) * 40;
      const t = Math.random() * Math.PI * 2;
      const r = 3 + Math.random() * 5;
      const h = (Math.random() - 0.5) * 6;
      tgt[i*3]   = Math.cos(t + h * 0.4) * r;
      tgt[i*3+1] = h;
      tgt[i*3+2] = Math.sin(t + h * 0.4) * r;
      seed[i] = Math.random();
    }
    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute('aTarget', new THREE.BufferAttribute(tgt, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    material = new THREE.ShaderMaterial({
      vertexShader: vert, fragmentShader: frag,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 }, uResolve: { value: 0 },
        uSize: { value: tier === 'high' ? 2.2 : 3.0 },
        uColorA: { value: new THREE.Color('#38bdf8') },
        uColorB: { value: new THREE.Color('#e64d2e') },
      },
    });
    points = new THREE.Points(geometry, material);
    scene.add(points);
    addEventListener('pointermove', onPointer, { passive: true });
  },

  update(dt, progress) {
    material.uniforms.uTime.value += dt;
    material.uniforms.uResolve.value =
      Math.min(1, material.uniforms.uResolve.value + dt * 0.6);
    points.rotation.y += dt * 0.05;
    points.rotation.x = lerp(points.rotation.x, pointer.y * 0.15, 0.05);
    points.position.y = progress * 4;
  },

  dispose() {
    removeEventListener('pointermove', onPointer);
    geometry.dispose(); material.dispose();
    points.parent?.remove(points);
  },
};
```

Register in `main.js`: `registry.set('hero', latentField)`.

- [ ] **Step 3: Verify visually**

Open the site. Expected: on load, points resolve out of scattered noise into a rotating swirled manifold, cyan in front fading to ember with depth; moving the mouse tilts it; scrolling lifts it.

Check the frame budget: DevTools → Performance → record 5s while scrolling the hero. Expected: **no frame over 16.7ms**. If exceeded, lower `pointBudget('high')` from 60000 until it holds, and record the value used.

- [ ] **Step 4: Verify degradation**

Emulate a mobile viewport and reload. Expected: visibly fewer points (12000 budget), still smooth. Then re-run the reduced-motion and CDN-blocked checks from Task 3 — both must still produce a clean readable page.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/latentField.js src/shaders/points.js src/main.js
git commit -m "feat: add hero latent-field scene"
```

---

### Task 6: Statement scene — neural lattice

**Files:**
- Create: `src/scenes/network.js`
- Modify: `src/main.js` (register `statement`)

**Interfaces:**
- Consumes: scene contract (Task 4).
- Produces: default export `{ id:'statement', init, update, dispose }`.

- [ ] **Step 1: Implement**

A 4-layer MLP — 6→10→10→4 nodes — with edges that pulse. The layer widths are literal: it is a diagram of a model, not an abstract mesh.

```js
import * as THREE from 'three';

const LAYERS = [6, 10, 10, 4];
let group, edges, edgeMat, nodeMesh;

export default {
  id: 'statement',
  init({ scene, tier }) {
    group = new THREE.Group();
    const nodes = [];
    LAYERS.forEach((count, li) => {
      for (let i = 0; i < count; i++) {
        nodes.push(new THREE.Vector3(
          (li - (LAYERS.length - 1) / 2) * 4.5,
          (i - (count - 1) / 2) * 1.1,
          0));
      }
    });

    const nodeGeo = new THREE.SphereGeometry(0.09, 12, 12);
    const nodeMat = new THREE.MeshBasicMaterial({ color: '#e8eaf0' });
    nodeMesh = new THREE.InstancedMesh(nodeGeo, nodeMat, nodes.length);
    const m = new THREE.Matrix4();
    nodes.forEach((p, i) => { m.setPosition(p); nodeMesh.setMatrixAt(i, m); });
    nodeMesh.instanceMatrix.needsUpdate = true;
    group.add(nodeMesh);

    const verts = [];
    let offset = 0;
    for (let li = 0; li < LAYERS.length - 1; li++) {
      const aCount = LAYERS[li], bCount = LAYERS[li + 1];
      const aStart = offset, bStart = offset + aCount;
      for (let a = 0; a < aCount; a++)
        for (let b = 0; b < bCount; b++)
          verts.push(...nodes[aStart + a].toArray(), ...nodes[bStart + b].toArray());
      offset += aCount;
    }
    const eGeo = new THREE.BufferGeometry();
    eGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    edgeMat = new THREE.LineBasicMaterial({
      color: '#38bdf8', transparent: true, opacity: tier === 'high' ? 0.22 : 0.3 });
    edges = new THREE.LineSegments(eGeo, edgeMat);
    group.add(edges);
    scene.add(group);
  },

  update(dt, progress) {
    group.rotation.y = -0.5 + progress * 1.0;
    edgeMat.opacity = 0.12 + Math.abs(Math.sin(performance.now() * 0.0012)) * 0.18;
  },

  dispose() {
    nodeMesh.geometry.dispose(); nodeMesh.material.dispose();
    edges.geometry.dispose(); edgeMat.dispose();
    group.parent?.remove(group);
  },
};
```

- [ ] **Step 2: Verify**

Scroll to the statement section. Expected: a 6→10→10→4 lattice rotating with scroll, edges pulsing cyan. Confirm 30 nodes and four visibly distinct layers.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/network.js src/main.js
git commit -m "feat: add neural lattice scene"
```

---

### Task 7: Impact scene — real figures as 3D bars

**Files:**
- Create: `src/scenes/bars.js`
- Modify: `src/main.js` (register `impact`)

**Interfaces:**
- Consumes: `smoothstep` (Task 1); scene contract (Task 4).
- Produces: default export `{ id:'impact', init, update, dispose }`.

- [ ] **Step 1: Implement with the confirmed values**

Bar heights are normalised from the real figures verified in the existing site. Do not substitute placeholders.

```js
import * as THREE from 'three';
import { smoothstep } from '../util/lerp.js';

const BARS = [
  { label: 'samples',  value: 8.3,  max: 10,  color: '#38bdf8' },
  { label: 'forecast', value: 96.4, max: 100, color: '#e64d2e' },
  { label: 'densenet', value: 86.7, max: 100, color: '#a78bfa' },
  { label: 'projects', value: 15,   max: 20,  color: '#e8eaf0' },
];

let group, meshes = [];

export default {
  id: 'impact',
  init({ scene }) {
    group = new THREE.Group();
    meshes = BARS.map((b, i) => {
      const geo = new THREE.BoxGeometry(1.1, 1, 1.1);
      geo.translate(0, 0.5, 0);            // grow upward from the base
      const mat = new THREE.MeshBasicMaterial({
        color: b.color, transparent: true, opacity: 0.55 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((i - 1.5) * 2.0, -3, 0);
      mesh.scale.y = 0.001;
      group.add(mesh);
      return mesh;
    });
    group.rotation.x = 0.25;
    scene.add(group);
  },

  update(dt, progress) {
    BARS.forEach((b, i) => {
      const stagger = smoothstep(i * 0.12, i * 0.12 + 0.45, progress);
      meshes[i].scale.y = Math.max(0.001, (b.value / b.max) * 6 * stagger);
    });
    group.rotation.y = (progress - 0.5) * 0.6;
  },

  dispose() {
    meshes.forEach(m => { m.geometry.dispose(); m.material.dispose(); });
    group.parent?.remove(group);
    meshes = [];
  },
};
```

- [ ] **Step 2: Verify against the DOM**

Scroll to impact. Expected: four bars rise in sequence. Relative heights must match the printed text — 96.4% tallest, 86.7% slightly shorter, 8.3M at 83% of its scale, 15+ at 75%. **The 3D must not contradict the numbers beside it.**

- [ ] **Step 3: Commit**

```bash
git add src/scenes/bars.js src/main.js
git commit -m "feat: add impact bars driven by verified figures"
```

---

### Task 8: Case 01 scene — water-quality model manifold

**Files:**
- Create: `src/scenes/manifold.js`
- Modify: `src/main.js` (register `case-01`)

**Interfaces:**
- Consumes: scene contract (Task 4).
- Produces: default export `{ id:'case-01', init, update, dispose }`.

- [ ] **Step 1: Implement**

Four clusters, one per benchmarked model, positioned by R². XGBoost sits highest at 0.79 — the spread encodes the actual dissertation result.

```js
import * as THREE from 'three';

const MODELS = [
  { name: 'Ridge',         r2: 0.09, color: '#5d6675' },
  { name: 'MLP',           r2: 0.31, color: '#a78bfa' },
  { name: 'Random Forest', r2: 0.58, color: '#38bdf8' },
  { name: 'XGBoost',       r2: 0.79, color: '#e64d2e' },
];

let group, clouds = [];

export default {
  id: 'case-01',
  init({ scene, budget }) {
    group = new THREE.Group();
    const per = Math.max(500, Math.floor(budget / 8));
    clouds = MODELS.map((mdl, i) => {
      const pos = new Float32Array(per * 3);
      const spread = 1.6 * (1 - mdl.r2 * 0.7);   // better model = tighter cluster
      for (let p = 0; p < per; p++) {
        pos[p*3]   = (i - 1.5) * 3.4 + (Math.random() - 0.5) * spread * 2;
        pos[p*3+1] = mdl.r2 * 6 - 3 + (Math.random() - 0.5) * spread * 2;
        pos[p*3+2] = (Math.random() - 0.5) * spread * 2;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        color: mdl.color, size: 0.045, transparent: true,
        opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending });
      const pts = new THREE.Points(geo, mat);
      group.add(pts);
      return pts;
    });
    scene.add(group);
  },

  update(dt, progress) {
    group.rotation.y = -0.4 + progress * 0.8;
    group.position.y = (0.5 - progress) * 2;
  },

  dispose() {
    clouds.forEach(c => { c.geometry.dispose(); c.material.dispose(); });
    group.parent?.remove(group);
    clouds = [];
  },
};
```

- [ ] **Step 2: Verify the encoding is truthful**

Expected: four clusters at increasing heights left to right, XGBoost highest in ember and visibly tightest, Ridge lowest and most diffuse — matching the case text stating R² 0.79 for XGBoost. **If the visual ordering disagrees with the written result, the scene is wrong, not the text.**

- [ ] **Step 3: Commit**

```bash
git add src/scenes/manifold.js src/main.js
git commit -m "feat: add water-quality model manifold scene"
```

---

### Task 9: Case 02 scene — supply-chain network

**Files:**
- Create: `src/scenes/graph.js`
- Modify: `src/main.js` (register `case-02`)

**Interfaces:**
- Consumes: scene contract (Task 4).
- Produces: default export `{ id:'case-02', init, update, dispose }`.

- [ ] **Step 1: Implement**

Two supply nodes (H100, H200) feeding a hub feeding two regions (EMEA, North America), plus a rotating causal-loop ring — the structures named in the NVIDIA case study.

```js
import * as THREE from 'three';

let group, ring, flowMat, flow;

const NODES = [
  { p: [-5,  1.6, 0] }, { p: [-5, -1.6, 0] },   // H100, H200 supply
  { p: [ 0,  0,   0] },                          // hub
  { p: [ 5,  1.6, 0] }, { p: [ 5, -1.6, 0] },   // EMEA, North America
];
const EDGES = [[0,2],[1,2],[2,3],[2,4]];

export default {
  id: 'case-02',
  init({ scene }) {
    group = new THREE.Group();

    const nodeGeo = new THREE.IcosahedronGeometry(0.28, 1);
    const nodeMat = new THREE.MeshBasicMaterial({ color: '#e8eaf0', wireframe: true });
    NODES.forEach(n => {
      const m = new THREE.Mesh(nodeGeo, nodeMat);
      m.position.set(...n.p);
      group.add(m);
    });

    const verts = [];
    EDGES.forEach(([a, b]) => verts.push(...NODES[a].p, ...NODES[b].p));
    const eGeo = new THREE.BufferGeometry();
    eGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    flowMat = new THREE.LineBasicMaterial({
      color: '#38bdf8', transparent: true, opacity: 0.5 });
    flow = new THREE.LineSegments(eGeo, flowMat);
    group.add(flow);

    ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.2, 0.015, 8, 128),
      new THREE.MeshBasicMaterial({ color: '#e64d2e', transparent: true, opacity: 0.45 }));
    ring.rotation.x = Math.PI / 2.4;
    group.add(ring);

    scene.add(group);
  },

  update(dt, progress) {
    ring.rotation.z += dt * 0.35;
    flowMat.opacity = 0.3 + Math.abs(Math.sin(performance.now() * 0.002)) * 0.35;
    group.rotation.y = (progress - 0.5) * 0.7;
  },

  dispose() {
    group.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
    group.parent?.remove(group);
  },
};
```

- [ ] **Step 2: Verify**

Expected: five wireframe nodes in a supply→hub→region topology, cyan flow lines pulsing, an ember causal-loop ring rotating around them.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/graph.js src/main.js
git commit -m "feat: add supply-chain network scene"
```

---

### Task 10: Case 03 scene — DenseNet vs ResNet paths

**Files:**
- Create: `src/scenes/convnet.js`
- Modify: `src/main.js` (register `case-03`)

**Interfaces:**
- Consumes: scene contract (Task 4).
- Produces: default export `{ id:'case-03', init, update, dispose }`.

- [ ] **Step 1: Implement**

Two stacks of feature-map planes. DenseNet is drawn in ember because it won at 86.7%; ResNet in muted grey. Shrinking plane sizes represent downsampling through the network.

```js
import * as THREE from 'three';

let group, planesA = [], planesB = [];
const DEPTH = 6;

function stack(x, color, opacity) {
  const out = [];
  for (let i = 0; i < DEPTH; i++) {
    const s = 3.2 - i * 0.42;
    const geo = new THREE.PlaneGeometry(s, s);
    const mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity, side: THREE.DoubleSide, wireframe: true });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, 0, -i * 1.15);
    out.push(m);
  }
  return out;
}

export default {
  id: 'case-03',
  init({ scene }) {
    group = new THREE.Group();
    planesA = stack(-2.6, '#e64d2e', 0.6);   // DenseNet — the winner, 86.7%
    planesB = stack( 2.6, '#5d6675', 0.32);  // ResNet — baseline
    [...planesA, ...planesB].forEach(m => group.add(m));
    group.rotation.x = 0.15;
    scene.add(group);
  },

  update(dt, progress) {
    group.rotation.y = -0.6 + progress * 1.1;
    planesA.forEach((m, i) => {
      m.position.z = -i * 1.15 + Math.sin(performance.now() * 0.001 + i) * 0.06;
    });
  },

  dispose() {
    group.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
    group.parent?.remove(group);
    planesA = []; planesB = [];
  },
};
```

- [ ] **Step 2: Verify**

Expected: two receding stacks of wireframe planes, the ember DenseNet stack visibly brighter than the grey ResNet stack, both rotating with scroll.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/convnet.js src/main.js
git commit -m "feat: add convnet comparison scene"
```

---

### Task 11: Contact scene — dispersal back to noise

Spec §5 lists this scene; without it the `#contact` section registers nothing and the site ends abruptly.

**Files:**
- Create: `src/scenes/disperse.js`
- Modify: `src/main.js` (register `contact`)

**Interfaces:**
- Consumes: `vert`/`frag` (Task 5), scene contract (Task 4).
- Produces: default export `{ id:'contact', init, update, dispose }`.

- [ ] **Step 1: Implement**

The inverse of the hero: the manifold is the starting state and `uResolve`
is driven backwards by scroll, scattering the points as the page ends.

```js
import * as THREE from 'three';
import { vert, frag } from '../shaders/points.js';

let points, material, geometry;

export default {
  id: 'contact',
  init({ scene, tier, budget }) {
    const n = Math.floor(budget / 2);
    const pos = new Float32Array(n * 3);   // scattered end state
    const tgt = new Float32Array(n * 3);   // coherent start state
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 48;
      pos[i*3+1] = (Math.random() - 0.5) * 48;
      pos[i*3+2] = (Math.random() - 0.5) * 48;
      const t = Math.random() * Math.PI * 2;
      const r = 2.5 + Math.random() * 3.5;
      tgt[i*3]   = Math.cos(t) * r;
      tgt[i*3+1] = (Math.random() - 0.5) * 5;
      tgt[i*3+2] = Math.sin(t) * r;
      seed[i] = Math.random();
    }
    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute('aTarget', new THREE.BufferAttribute(tgt, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    material = new THREE.ShaderMaterial({
      vertexShader: vert, fragmentShader: frag,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 }, uResolve: { value: 1 },
        uSize: { value: tier === 'high' ? 2.0 : 2.8 },
        uColorA: { value: new THREE.Color('#e64d2e') },
        uColorB: { value: new THREE.Color('#38bdf8') },
      },
    });
    points = new THREE.Points(geometry, material);
    scene.add(points);
  },

  update(dt, progress) {
    material.uniforms.uTime.value += dt;
    material.uniforms.uResolve.value = 1 - progress;   // scroll scatters it
    points.rotation.y += dt * 0.03;
  },

  dispose() {
    geometry.dispose(); material.dispose();
    points.parent?.remove(points);
  },
};
```

Register in `main.js`: `registry.set('contact', disperse)`.

- [ ] **Step 2: Verify**

Scroll to the contact section. Expected: a coherent ring of points at the
section's start that scatters outward as you scroll to the page bottom,
ember fading to cyan. Contact details stay fully readable over it — check
the email and phone links are still clickable.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/disperse.js src/main.js
git commit -m "feat: add contact dispersal scene"
```

---

### Task 12: Bloom pass, desktop tier only

**Files:**
- Modify: `src/stage.js`, `src/main.js`

**Interfaces:**
- Modifies: `createStage` becomes async and its return gains `composer` (nullable). `render()` uses the composer when present, otherwise renders directly. `main.js` changes only at the call site, which must now `await createStage(...)`.

- [ ] **Step 1: Implement**

Per spec §6: bloom on desktop only; mobile and reduced-motion render straight to canvas. The addon imports must be **dynamic**, so mobile never downloads them:

```js
// inside createStage, after camera/setSize setup:
let composer = null;
if (tier === 'high' && !reducedMotion) {
  const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }] = await Promise.all([
    import('three/addons/postprocessing/EffectComposer.js'),
    import('three/addons/postprocessing/RenderPass.js'),
    import('three/addons/postprocessing/UnrealBloomPass.js'),
  ]);
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(
    new THREE.Vector2(innerWidth, innerHeight), 0.55, 0.6, 0.85));
}
```

This makes `createStage` async — change it to `export async function createStage(...)`, add `composer?.setSize(w, h)` inside `setSize()`, and update the call site in `main.js` to `const stage = await createStage({...})`. It is already inside an `async` function with a `try/catch`, so an addon fetch failure falls back cleanly.

`render()` becomes:

```js
render() { composer ? composer.render() : renderer.render(scene, camera); }
```

- [ ] **Step 2: Verify both tiers**

Desktop: expected soft glow on ember/cyan elements. Mobile emulation: expected no bloom, and confirm in the Network panel that the three `postprocessing/` modules are **not** requested. Reduced motion: no bloom, single frame.

- [ ] **Step 3: Commit**

```bash
git add src/stage.js src/main.js
git commit -m "feat: add desktop-only bloom pass"
```

---

### Task 13: Full verification pass

**Files:** none — this task changes no code. It proves the spec's §8 and §9 claims.

- [ ] **Step 1: Run every failure case**

Record the observed result for each. Every row must pass before this ships.

| # | Condition | How | Expected |
|---|---|---|---|
| 1 | Normal desktop | Load site | All scenes render, no console errors |
| 2 | Mobile 375px | DevTools device toolbar, reload | Reduced points, no bloom, smooth scroll |
| 3 | No WebGL | Disable WebGL in the browser, reload | Static dark page, all content readable, no visible error |
| 4 | Reduced motion | DevTools → Rendering → emulate reduce | Single frame, no animation |
| 5 | CDN blocked | Network → block `cdn.jsdelivr.net` | Static page, no blank screen |
| 6 | Smoke tests | Open `tests/smoke.html` | `17/17 passing` |
| 7 | Keyboard | Tab through the page | Every link reachable, focus ring visible |
| 8 | Screen reader | Inspect the canvas element | `aria-hidden="true"` present |

- [ ] **Step 2: Lighthouse**

Run Lighthouse (mobile preset) against `http://localhost:8000/`.
Expected: Accessibility ≥ 95, SEO ≥ 95, Performance ≥ 80. If Performance is below 80, reduce `pointBudget('high')` and re-measure — do not ship a slower number and report otherwise.

- [ ] **Step 3: Confirm content parity one final time**

```bash
git show <task-1-commit>:index.html | sed 's/<[^>]*>/ /g' | tr -s ' \n' ' \n' | sort -u > /tmp/orig.txt
sed 's/<[^>]*>/ /g' index.html | tr -s ' \n' ' \n' | sort -u > /tmp/final.txt
comm -23 /tmp/orig.txt /tmp/final.txt
```

Expected: no prose words missing.

- [ ] **Step 4: Commit, then push**

```bash
git add -A
git commit -m "docs: record Phase 1 verification results"
```

Push via GitHub Desktop, then confirm the live site at
`https://nawafbalmutairi.github.io` renders correctly — Pages takes about a
minute. Verification on localhost is not verification of production.
