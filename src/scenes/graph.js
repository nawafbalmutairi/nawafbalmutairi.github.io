import * as THREE from 'three';

// H100 + H200 supply -> hub -> EMEA + North America, wrapped by a causal-loop
// ring: the three structures named in the NVIDIA case study.
const NODES = [
  { p: [-5,  1.6, 0] }, { p: [-5, -1.6, 0] },
  { p: [ 0,  0,   0] },
  { p: [ 5,  1.6, 0] }, { p: [ 5, -1.6, 0] },
];
const EDGES = [[0, 2], [1, 2], [2, 3], [2, 4]];

let group, ring, flowMat, flow;

export default {
  id: 'case-02',

  init({ scene }) {
    group = new THREE.Group();
    group.name = 'case-02:graph';

    const nodeGeo = new THREE.IcosahedronGeometry(0.28, 1);
    const nodeMat = new THREE.MeshBasicMaterial({ color: '#e8eaf0', wireframe: true });
    NODES.forEach(n => {
      const m = new THREE.Mesh(nodeGeo, nodeMat);
      m.position.set(...n.p);
      group.add(m);
    });

    const verts = [];
    EDGES.forEach(([a, b]) => verts.push(...NODES[a].p, ...NODES[b].p));
    const eGeo = new THREE.BufferGeometry();
    eGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    flowMat = new THREE.LineBasicMaterial({
      color: '#38bdf8', transparent: true, opacity: 0.5 });
    flow = new THREE.LineSegments(eGeo, flowMat);
    group.add(flow);

    ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.2, 0.015, 8, 128),
      new THREE.MeshBasicMaterial({ color: '#e64d2e', transparent: true, opacity: 0.45 }));
    ring.rotation.x = Math.PI / 2.4;
    group.add(ring);

    scene.add(group);
    return group;
  },

  update(dt, progress) {
    ring.rotation.z += dt * 0.35;
    flowMat.opacity = 0.3 + Math.abs(Math.sin(performance.now() * 0.002)) * 0.35;
    group.rotation.y = (progress - 0.5) * 0.7;
  },

  dispose() {
    group.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
    group.parent?.remove(group);
  },
};
