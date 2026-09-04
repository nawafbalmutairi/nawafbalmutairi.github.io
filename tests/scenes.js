import * as THREE from 'three';
import latentPortfolio from '../src/scenes/latentPortfolio.js';
import network from '../src/scenes/network.js';
import r2matrix from '../src/scenes/rSquaredMatrix.js';
import supplySystem from '../src/scenes/supplySystem.js';
import architectures from '../src/scenes/architectures.js';
import disperse from '../src/scenes/disperse.js';

const results = [];
function check(name, fn) {
  try { fn(); results.push(['PASS', name]); }
  catch (e) { results.push(['FAIL', name + ' — ' + e.message]); }
}
function eq(a, b) { if (a !== b) throw new Error(`expected ${b}, got ${a}`); }
function ok(c, m) { if (!c) throw new Error(m || 'expected truthy'); }

const ALL = [latentPortfolio, network, r2matrix, supplySystem, architectures, disperse];
// 'impact' intentionally has no scene: the DOM already states those four
// figures in 86px type, so a 3D restatement would be pure decoration.
const IDS = ['hero', 'statement', 'case-01', 'case-02', 'case-03', 'contact'];

function ctxFor(scene) {
  return { scene, camera: new THREE.PerspectiveCamera(), renderer: null, tier: 'high', budget: 4000, dt: 0.016 };
}

// ── Contract: every scene declares an id, returns its root, and cleans up ──
check('all seven scene ids present and unique', () => {
  eq(ALL.length, 6);
  eq(new Set(ALL.map(s => s.id)).size, 6);
  IDS.forEach(id => ok(ALL.some(s => s.id === id), 'missing scene for ' + id));
});

ALL.forEach(mod => {
  check(`${mod.id}: init returns a root attached to the scene`, () => {
    const scene = new THREE.Scene();
    const root = mod.init(ctxFor(scene));
    ok(root instanceof THREE.Object3D, 'init must return an Object3D');
    eq(root.parent, scene);
    mod.dispose();
  });

  check(`${mod.id}: update runs across the full progress range`, () => {
    const scene = new THREE.Scene();
    mod.init(ctxFor(scene));
    for (const p of [0, 0.25, 0.5, 0.75, 1]) mod.update(0.016, p);
    mod.dispose();
  });

  check(`${mod.id}: dispose detaches the root`, () => {
    const scene = new THREE.Scene();
    const root = mod.init(ctxFor(scene));
    eq(scene.children.length, 1);
    mod.dispose();
    eq(root.parent, null);
    eq(scene.children.length, 0);
  });

  check(`${mod.id}: root.visible toggles (lifecycle can pause it)`, () => {
    const scene = new THREE.Scene();
    const root = mod.init(ctxFor(scene));
    eq(root.visible, true);
    root.visible = false;
    eq(root.visible, false);
    mod.dispose();
  });
});

// ── Meaning: the 3D must not contradict the printed figures ──
check('hero embeds 15 projects across 4 domains', () => {
  const scene = new THREE.Scene();
  const root = latentPortfolio.init(ctxFor(scene));
  const nodes = root.children.filter(c => c.isMesh && c.userData && c.userData.name);
  eq(nodes.length, 15);
  const pts = root.children.filter(c => c.isPoints);
  eq(pts.length, 1);
  latentPortfolio.dispose();
});

check('neural lattice has 30 nodes in 6-10-10-4 layers', () => {
  const scene = new THREE.Scene();
  const root = network.init(ctxFor(scene));
  const inst = root.children.find(c => c.isInstancedMesh);
  ok(inst, 'expected an InstancedMesh of nodes');
  eq(inst.count, 30);
  network.dispose();
});

check('supply system carries backorders and flowing volume', () => {
  const scene = new THREE.Scene();
  const root = supplySystem.init(ctxFor(scene));
  const pts = root.children.filter(c => c.isPoints);
  eq(pts.length, 1);                       // volume in transit
  ok(pts[0].geometry.attributes.position.count > 50, 'expected flowing particles');
  supplySystem.update(0.016, 1);
  const grown = root.children.filter(c => c.isMesh && c.userData && c.userData.full);
  eq(grown.length, 2);                     // one backorder column per region
  ok(grown.every(b => b.scale.y > 0.5), 'backorder columns must rise with progress');
  supplySystem.dispose();
});

check('DenseNet is wired more densely than ResNet, and wins on accuracy', () => {
  const scene = new THREE.Scene();
  const root = architectures.init(ctxFor(scene));
  const lines = root.children.filter(c => c.isLineSegments);
  eq(lines.length, 2);
  const counts = lines.map(l => l.geometry.attributes.position.count / 2);
  ok(counts[0] > counts[1],
     'dense connectivity must have more edges than residual shortcuts');
  eq(counts[0], 15);                       // every layer to every later layer
  architectures.update(0.016, 1);
  const accs = root.children.filter(c => c.isMesh && c.userData && c.userData.full);
  eq(accs.length, 2);
  ok(accs[0].scale.y > accs[1].scale.y, 'DenseNet 0.867 must exceed ResNet 0.80');
  architectures.dispose();
});

check('contact scene scatters as progress increases', () => {
  const scene = new THREE.Scene();
  const root = disperse.init(ctxFor(scene));
  disperse.update(0.016, 0);
  const atStart = root.material.uniforms.uResolve.value;
  disperse.update(0.016, 1);
  const atEnd = root.material.uniforms.uResolve.value;
  eq(atStart, 1);
  eq(atEnd, 0);
  disperse.dispose();
});



check('R² matrix renders all 20 combinations, negatives included', () => {
  const scene = new THREE.Scene();
  const root = r2matrix.init(ctxFor(scene));
  r2matrix.update(0.016, 1);
  const bars = root.children.filter(c => c.isMesh && c.userData && c.userData.model);
  eq(bars.length, 20);
  const grown = bars.filter(b => Math.abs(b.scale.y) > 0.05);
  eq(grown.length, 20);
  const neg = bars.filter(b => b.userData.r < 0);
  eq(neg.length, 9);
  ok(neg.every(b => b.scale.y < -0.05),
     'negative R² must grow downward through the zero plane, not be clamped flat');
  const win = bars.find(b => b.userData.isWinner);
  ok(win.scale.y > 0, 'winner must be positive');
  r2matrix.dispose();
});

check('R² matrix uses the published values unchanged', () => {
  const scene = new THREE.Scene();
  const root = r2matrix.init(ctxFor(scene));
  const bars = root.children.filter(c => c.isMesh && c.userData && c.userData.model);
  const get = (model, target) =>
    bars.find(b => b.userData.model === model && b.userData.target === target).userData.r;
  eq(get('XGBoost', 'Water Temp'), 0.79);
  eq(get('MLP', 'Water Temp'), -3.61);
  eq(get('Random Forest', 'BOD: 5 Day ATU'), -3.49);
  eq(get('Ridge', 'Dissolved O₂'), 0.36);
  r2matrix.dispose();
});

const out = document.getElementById('out');
out.textContent = results.map(([s, n]) => `${s}  ${n}`).join('\n');
const failed = results.filter(r => r[0] === 'FAIL').length;
document.getElementById('summary').textContent =
  `${results.length - failed}/${results.length} passing`;
document.title = failed ? `FAIL (${failed})` : 'ALL PASS';
