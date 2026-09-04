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
