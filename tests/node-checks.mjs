// Pure-logic checks that need no browser.
//   node tests/node-checks.mjs
//
// These exist because the environments this site gets driven in cannot always
// scroll or run animation frames, and the failures that hides — a colour ramp
// stuck on its first stop, a tier decided from a stale viewport — are silent.

import { clamp, lerp, smoothstep } from '../src/util/lerp.js';
import { detectTier, pointBudget } from '../src/util/capabilities.js';
import { sectionProgress, activeIndex } from '../src/scroll.js';
import { groundAt } from '../src/ground.js';

let pass = 0, fail = 0;
const eq = (a, b, n) => {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A === B) pass++; else { fail++; console.log(`FAIL ${n}: expected ${B}, got ${A}`); }
};
const ok = (c, n) => { if (c) pass++; else { fail++; console.log('FAIL ' + n); } };

// ── maths ────────────────────────────────────────────────────────────
eq(clamp(-5, 0, 1), 0, 'clamp low');
eq(clamp(5, 0, 1), 1, 'clamp high');
eq(lerp(0, 10, 0.5), 5, 'lerp midpoint');
eq(smoothstep(0, 1, -1), 0, 'smoothstep clamps low');
eq(smoothstep(0, 1, 2), 1, 'smoothstep clamps high');

// ── device tier ──────────────────────────────────────────────────────
eq(detectTier({ hasWebGL2: false, isMobile: false, deviceMemory: 8 }), 'none', 'no webgl');
eq(detectTier({ hasWebGL2: true, isMobile: false, deviceMemory: 8, viewportWidth: 700 }), 'none', 'narrow viewport');
eq(detectTier({ hasWebGL2: true, isMobile: false, deviceMemory: 8, viewportWidth: 1400 }), 'high', 'wide desktop');
eq(detectTier({ hasWebGL2: true, isMobile: true, deviceMemory: 8, viewportWidth: 1400 }), 'low', 'coarse pointer');
eq(detectTier({ hasWebGL2: true, isMobile: false, deviceMemory: 2, viewportWidth: 1400 }), 'low', 'low memory');
eq(pointBudget('none'), 0, 'no budget without webgl');
ok(pointBudget('high') > pointBudget('low'), 'budget scales with tier');

// ── scroll mapping ───────────────────────────────────────────────────
eq(sectionProgress(0, 800, 1600, 800), 0, 'progress before section');
eq(sectionProgress(4000, 800, 1600, 800), 1, 'progress after section');
eq(sectionProgress(1600, 800, 1600, 800), 0.5, 'progress at midpoint');
eq(activeIndex(0, 800, [{ top: 0, height: 800 }, { top: 800, height: 800 }]), 0, 'first section active');
eq(activeIndex(900, 800, [{ top: 0, height: 800 }, { top: 800, height: 800 }]), 1, 'second section active');
eq(activeIndex(9000, 800, [{ top: 0, height: 800 }]), -1, 'none active past the end');

// ── the ground ramp ──────────────────────────────────────────────────
const marks = [{ y: 0, rgb: [0, 0, 0] }, { y: 100, rgb: [100, 100, 100] }, { y: 200, rgb: [200, 0, 0] }];
eq(groundAt(-50, marks), [0, 0, 0], 'ground clamps below the first stop');
eq(groundAt(100, marks), [100, 100, 100], 'ground hits the middle stop exactly');
eq(groundAt(999, marks), [200, 0, 0], 'ground clamps past the last stop');
eq(groundAt(50, marks), [50, 50, 50], 'ground eases to the midpoint');
eq(groundAt(0, []), [0, 0, 0], 'ground survives empty marks');
eq(groundAt(50, [{ y: 0, rgb: [9, 9, 9] }]), [9, 9, 9], 'ground survives a single mark');

const seen = new Set();
for (let y = 0; y <= 200; y += 10) seen.add(groundAt(y, marks).join(','));
ok(seen.size >= 10, `ground ramps continuously (${seen.size} distinct colours)`);

let prev = -1, mono = true;
for (let y = 0; y <= 100; y += 10) { const v = groundAt(y, marks)[0]; if (v < prev) mono = false; prev = v; }
ok(mono, 'ground rises monotonically along a leg');

console.log(`\n${pass}/${pass + fail} passing`);
process.exit(fail ? 1 : 0);
