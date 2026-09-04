import { clamp, lerp, smoothstep } from '../src/util/lerp.js';
import { detectTier, pointBudget } from '../src/util/capabilities.js';
import { sectionProgress, activeIndex } from '../src/scroll.js';

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
check('tier none on narrow viewport - tables carry mobile', () =>
  eq(detectTier({ hasWebGL2: true, isMobile: false, deviceMemory: 8, viewportWidth: 700 }), 'none'));
check('tier survives a wide viewport', () =>
  eq(detectTier({ hasWebGL2: true, isMobile: false, deviceMemory: 8, viewportWidth: 1400 }), 'high'));
check('budget scales with tier', () => {
  if (!(pointBudget('high') > pointBudget('low'))) throw new Error('high must exceed low');
  eq(pointBudget('none'), 0);
});

check('progress 0 before section', () => eq(sectionProgress(0, 800, 1600, 800), 0));
check('progress 1 after section', () => eq(sectionProgress(4000, 800, 1600, 800), 1));
check('progress mid', () => eq(sectionProgress(1600, 800, 1600, 800), 0.5));
check('activeIndex picks overlapping', () =>
  eq(activeIndex(0, 800, [{top:0,height:800},{top:800,height:800}]), 0));
check('activeIndex second section', () =>
  eq(activeIndex(900, 800, [{top:0,height:800},{top:800,height:800}]), 1));
check('activeIndex none past end', () =>
  eq(activeIndex(9000, 800, [{top:0,height:800}]), -1));

function render() {
  const out = document.getElementById('out');
  out.textContent = results.map(([s, n]) => `${s}  ${n}`).join('\n');
  const failed = results.filter(r => r[0] === 'FAIL').length;
  document.getElementById('summary').textContent =
    `${results.length - failed}/${results.length} passing`;
  document.title = failed ? `FAIL (${failed})` : 'ALL PASS';
}
render();
