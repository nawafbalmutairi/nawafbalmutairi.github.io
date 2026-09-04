import * as THREE from 'three';

// Two receding stacks of feature-map planes. DenseNet is ember because it won
// at 86.7%; ResNet is muted. Shrinking planes represent downsampling.
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
    group.name = 'case-03:convnet';
    planesA = stack(-2.6, '#e64d2e', 0.6);   // DenseNet - the winner, 86.7%
    planesB = stack(2.6, '#5d6675', 0.32);   // ResNet - baseline
    [...planesA, ...planesB].forEach(m => group.add(m));
    group.rotation.x = 0.15;
    scene.add(group);
    return group;
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
