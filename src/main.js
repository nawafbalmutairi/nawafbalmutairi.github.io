import { readEnvironment, detectTier, pointBudget } from './util/capabilities.js';
import { prefersReducedMotion } from './util/reducedMotion.js';
import { createScrollDriver } from './scroll.js';

const SECTIONS = ['hero', 'statement', 'impact', 'case-01', 'case-02', 'case-03', 'contact'];

const env = readEnvironment();
const tier = detectTier(env);
const reduced = prefersReducedMotion();

const registry = new Map();   // id -> scene module
const live = new Map();       // id -> { mod, root }

function syncScenes(driver, ctx, dt) {
  const { id, progress } = driver.read();

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
}

async function boot() {
  if (tier === 'none') return;
  try {
    const canvas = document.getElementById('gl');
    const { createStage } = await import('./stage.js');
    const stage = createStage({ canvas, tier, reducedMotion: reduced });
    document.documentElement.classList.add('webgl-active');

    const ctx = {
      scene: stage.scene,
      camera: stage.camera,
      renderer: stage.renderer,
      tier,
      budget: pointBudget(tier),
      dt: 0,
    };
    const driver = createScrollDriver(SECTIONS);
    window.__driver = driver;   // read by the verification step

    if (reduced) {
      syncScenes(driver, ctx, 0);
      stage.render();
      return;
    }

    let last = performance.now();
    requestAnimationFrame(function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.dt = dt;
      syncScenes(driver, ctx, dt);
      stage.render();
      requestAnimationFrame(frame);
    });
  } catch (err) {
    // CDN unreachable, WebGL init threw, anything at all:
    // fall back to the static page rather than a blank screen.
    document.documentElement.classList.remove('webgl-active');
  }
}

if (document.readyState === 'complete') queueMicrotask(boot);
else addEventListener('load', boot, { once: true });
