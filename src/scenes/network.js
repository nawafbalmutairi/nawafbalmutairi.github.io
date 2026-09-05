import * as THREE from 'three';

// A literal 6 -> 10 -> 10 -> 4 MLP. The layer widths are the diagram.
const LAYERS = [6, 10, 10, 4];
let group, edges, edgeMat, nodeMesh;

export default {
  id: 'statement',

  init({ scene, tier }) {
    group = new THREE.Group();
    group.name = 'statement:network';

    const nodes = [];
    LAYERS.forEach((count, li) => {
      for (let i = 0; i < count; i++) {
        nodes.push(new THREE.Vector3(
          (li - (LAYERS.length - 1) / 2) * 4.5,
          (i - (count - 1) / 2) * 1.1,
          0));
      }
    });

    const nodeGeo = new THREE.SphereGeometry(0.09, 12, 12);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: '#2b3440', metalness: 0.15, roughness: 0.45 });
    nodeMesh = new THREE.InstancedMesh(nodeGeo, nodeMat, nodes.length);
    const m = new THREE.Matrix4();
    nodes.forEach((p, i) => { m.setPosition(p); nodeMesh.setMatrixAt(i, m); });
    nodeMesh.instanceMatrix.needsUpdate = true;
    group.add(nodeMesh);

    const verts = [];
    let offset = 0;
    for (let li = 0; li < LAYERS.length - 1; li++) {
      const aCount = LAYERS[li], bCount = LAYERS[li + 1];
      const aStart = offset, bStart = offset + aCount;
      for (let a = 0; a < aCount; a++)
        for (let b = 0; b < bCount; b++)
          verts.push(...nodes[aStart + a].toArray(), ...nodes[bStart + b].toArray());
      offset += aCount;
    }
    const eGeo = new THREE.BufferGeometry();
    eGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    edgeMat = new THREE.LineBasicMaterial({
      color: '#8d99a8', transparent: true, opacity: tier === 'high' ? 0.5 : 0.6 });
    edges = new THREE.LineSegments(eGeo, edgeMat);
    group.add(edges);

    scene.add(group);
    return group;
  },

  update(dt, progress) {
    group.rotation.y = -0.5 + progress * 1.0;
    edgeMat.opacity = 0.3 + Math.abs(Math.sin(performance.now() * 0.0012)) * 0.22;
  },

  dispose() {
    nodeMesh.geometry.dispose(); nodeMesh.material.dispose();
    edges.geometry.dispose(); edgeMat.dispose();
    group.parent?.remove(group);
  },
};
