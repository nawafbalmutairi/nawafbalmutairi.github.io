import { readEnvironment, detectTier, pointBudget } from './util/capabilities.js';
import { prefersReducedMotion } from './util/reducedMotion.js';
import { createScrollDriver } from './scroll.js';
import { initUI } from './ui.js';
import { initDrag } from './drag.js';
import { initGround, currentGround } from './ground.js';

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
// The world is full-bleed now: the graphics own the screen and the copy sits
// in a column over them. The slot elements survive only as drag handles.
function fullRect(canvas) {
  const w = canvas.clientWidth || innerWidth;
  const h = canvas.clientHeight || innerHeight;
  return { left: 0, top: 0, width: w, height: h };
}

function syncScenes(driver, ctx, dt) {
  const { id, progress } = driver.read();
  // Scenes read ctx.rect to place their labels; it is the whole canvas now.
  ctx.rect = ctx.fullRect;

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
      fullRect: fullRect(canvas),
    };
    addEventListener('resize', () => { ctx.isWide = innerWidth >= 980; }, { passive: true });
    const driver = createScrollDriver(SECTIONS);

    if (reduced) {
      ctx.fullRect = fullRect(canvas);
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
        ctx.fullRect = fullRect(canvas);

        // The fog is the world's air: retint it as the ground colour moves, or
        // distant geometry hazes toward a colour the page is no longer wearing.
        const g = currentGround();
        stage.scene.fog.color.setRGB(g[0] / 255, g[1] / 255, g[2] / 255);

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
initGround();
initUI(SECTIONS);
initDrag(SECTIONS);

if (document.readyState === 'complete') queueMicrotask(boot);
else addEventListener('load', boot, { once: true });
