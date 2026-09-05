import { readEnvironment, detectTier, pointBudget } from './util/capabilities.js';
import { prefersReducedMotion } from './util/reducedMotion.js';
import { createScrollDriver } from './scroll.js';
import { initUI } from './ui.js';
import { initDrag } from './drag.js';

// Order matters twice over: the scene lifecycle reads it, and the pipeline
// HUD maps its steps to these by index. 'journey' and 'impact' carry no
// scene - the DOM already says what they say.
const SECTIONS = ['hero', 'journey', 'statement', 'case-01', 'case-02', 'case-03', 'contact'];

const NARROW = 820;   // below this the case-study tables carry the content
const reduced = prefersReducedMotion();

const registry = new Map();   // id -> scene module
const live = new Map();       // id -> { mod, root }

// The hero's slot is a real box in the layout; every other section carries an
// absolutely-positioned one. Returning null means "draw nothing this frame".
function slotRect(id) {
  if (!id) return null;
  const el = id === 'hero'
    ? document.querySelector('#hero .stage-frame')
    : document.querySelector('#' + CSS.escape(id) + ' .stage-slot');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight || r.width < 8) return null;
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

function syncScenes(driver, ctx, dt) {
  const { id, progress } = driver.read();
  // Scenes read ctx.rect to place their labels; the renderer scissors to it.
  ctx.rect = slotRect(id);

  // Init on first entry; keep the root handle so visibility can be gated.
  if (id && registry.has(id) && !live.has(id)) {
    const mod = registry.get(id);
    const root = mod.init(ctx);
    live.set(id, { mod, root });
  }

  // Exactly one scene is visible and updated. The rest are paused, not disposed:
  // gating only update() would leave every visited scene rendering at once.
  for (const [liveId, entry] of live) {
    const active = liveId === id;
    if (entry.root) entry.root.visible = active;
    if (active) entry.mod.update(dt, progress);
  }
  return id;
}

async function boot() {
  // Decided here, not at module-execution time: innerWidth is not reliable
  // until layout has settled, and reading it once would lock the decision in
  // for the life of the page (a phone rotation would never be reconsidered).
  const tier = detectTier(readEnvironment());
  if (tier === 'none') return;
  try {
    const canvas = document.getElementById('gl');
    const { createStage } = await import('./stage.js');

    // Scenes are imported dynamically, never statically: they pull in three
    // from the CDN, and a static import would break main.js itself before the
    // catch below could fall back to the static page.
    const scenes = await Promise.all([
      import('./scenes/latentPortfolio.js'),
      import('./scenes/network.js'),
      import('./scenes/rSquaredMatrix.js'),
      import('./scenes/supplySystem.js'),
      import('./scenes/architectures.js'),
      import('./scenes/disperse.js'),
    ]);
    scenes.forEach(m => registry.set(m.default.id, m.default));

    const stage = await createStage({ canvas, tier, reducedMotion: reduced });
    document.documentElement.classList.add('webgl-active');

    const ctx = {
      scene: stage.scene,
      camera: stage.camera,
      renderer: stage.renderer,
      tier,
      budget: pointBudget(tier),
      isWide: innerWidth >= 980,
      dt: 0,
    };
    addEventListener('resize', () => { ctx.isWide = innerWidth >= 980; }, { passive: true });
    const driver = createScrollDriver(SECTIONS);

    if (reduced) {
      syncScenes(driver, ctx, 0);
      stage.render(ctx.rect);
      return;
    }

    let last = performance.now();
    requestAnimationFrame(function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // Crossing the threshold mid-session (rotation, window resize) stops the
      // 3D rather than leaving a cramped instrument on a narrow screen.
      const narrow = innerWidth < NARROW;
      document.documentElement.classList.toggle('webgl-active', !narrow);
      if (!narrow) {
        ctx.dt = dt;
        ctx.isWide = innerWidth >= 980;
        syncScenes(driver, ctx, dt);
        stage.render(ctx.rect);
      }
      requestAnimationFrame(frame);
    });
  } catch (err) {
    // CDN unreachable, WebGL init threw, anything at all:
    // fall back to the static page rather than a blank screen.
    document.documentElement.classList.remove('webgl-active');
  }
}

// Chrome first, and unconditionally: the pipeline HUD and nav state must work
// even if WebGL never starts.
initUI(SECTIONS);
initDrag(SECTIONS);

if (document.readyState === 'complete') queueMicrotask(boot);
else addEventListener('load', boot, { once: true });
