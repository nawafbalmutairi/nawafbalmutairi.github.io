import * as THREE from 'three';
import latentField from '../src/scenes/latentField.js';
import network from '../src/scenes/network.js';
import bars from '../src/scenes/bars.js';
import manifold from '../src/scenes/manifold.js';
import graph from '../src/scenes/graph.js';
import convnet from '../src/scenes/convnet.js';
import disperse from '../src/scenes/disperse.js';

const results = [];
function check(name, fn) {
  try { fn(); results.push(['PASS', name]); }
  catch (e) { results.push(['FAIL', name + ' — ' + e.message]); }
}
function eq(a, b) { if (a !== b) throw new Error(`expected ${b}, got ${a}`); }
function ok(c, m) { if (!c) throw new Error(m || 'expected truthy'); }

const ALL = [latentField, network, bars, manifold, graph, convnet, disperse];
const IDS = ['hero', 'statement', 'impact', 'case-01', 'case-02', 'case-03', 'contact'];

function ctxFor(scene) {
  return { scene, camera: new THREE.PerspectiveCamera(), renderer: null, tier: 'high', budget: 4000, dt: 0.016 };
}

// ── Contract: every scene declares an id, returns its root, and cleans up ──
check('all seven scene ids present and unique', () => {
  eq(ALL.length, 7);
  eq(new Set(ALL.map(s => s.id)).size, 7);
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
check('impact bars rank in the same order as the published numbers', () => {
  const scene = new THREE.Scene();
  const root = bars.init(ctxFor(scene));
  bars.update(0.016, 1);
  const h = root.children.map(m => m.scale.y);
  // 8.3/10=0.83, 96.4/100=0.964, 86.7/100=0.867, 15/20=0.75
  ok(h[1] > h[2], 'forecast 96.4% must exceed densenet 86.7%');
  ok(h[2] > h[0], 'densenet 0.867 must exceed samples 0.83');
  ok(h[0] > h[3], 'samples 0.83 must exceed projects 0.75');
  bars.dispose();
});

check('impact bars start collapsed at progress 0', () => {
  const scene = new THREE.Scene();
  const root = bars.init(ctxFor(scene));
  bars.update(0.016, 0);
  ok(root.children.every(m => m.scale.y < 0.01), 'bars must not be grown at progress 0');
  bars.dispose();
});

check('model clusters are ordered by R², XGBoost highest', () => {
  const scene = new THREE.Scene();
  const root = manifold.init(ctxFor(scene));
  const y = root.children.map(c => c.geometry.attributes.position.array[1]);
  const names = root.children.map(c => c.name);
  eq(names[3], 'model:XGBoost');
  ok(y[3] > y[0], 'XGBoost must sit above Ridge');
  manifold.dispose();
});

check('neural lattice has 30 nodes in 6-10-10-4 layers', () => {
  const scene = new THREE.Scene();
  const root = network.init(ctxFor(scene));
  const inst = root.children.find(c => c.isInstancedMesh);
  ok(inst, 'expected an InstancedMesh of nodes');
  eq(inst.count, 30);
  network.dispose();
});

check('supply-chain graph has 5 nodes plus flows and causal ring', () => {
  const scene = new THREE.Scene();
  const root = graph.init(ctxFor(scene));
  const meshes = root.children.filter(c => c.isMesh);
  const lines = root.children.filter(c => c.isLineSegments);
  eq(lines.length, 1);
  eq(meshes.length, 6);   // 5 nodes + causal-loop ring
  graph.dispose();
});

check('convnet has two stacks of six planes', () => {
  const scene = new THREE.Scene();
  const root = convnet.init(ctxFor(scene));
  eq(root.children.length, 12);
  convnet.dispose();
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

check('hero resolves out of noise over time', () => {
  const scene = new THREE.Scene();
  const root = latentField.init(ctxFor(scene));
  eq(root.material.uniforms.uResolve.value, 0);
  for (let i = 0; i < 200; i++) latentField.update(0.016, 0);
  eq(root.material.uniforms.uResolve.value, 1);
  latentField.dispose();
});

const out = document.getElementById('out');
out.textContent = results.map(([s, n]) => `${s}  ${n}`).join('\n');
const failed = results.filter(r => r[0] === 'FAIL').length;
document.getElementById('summary').textContent =
  `${results.length - failed}/${results.length} passing`;
document.title = failed ? `FAIL (${failed})` : 'ALL PASS';
