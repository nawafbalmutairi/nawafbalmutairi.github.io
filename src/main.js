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
  } catch (err) {
    // CDN unreachable, WebGL init threw, anything at all:
    // fall back to the static page rather than a blank screen.
    document.documentElement.classList.remove('webgl-active');
  }
}

if (document.readyState === 'complete') queueMicrotask(boot);
else addEventListener('load', boot, { once: true });
