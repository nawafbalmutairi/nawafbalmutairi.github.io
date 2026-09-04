import * as THREE from 'three';
import { smoothstep } from '../util/lerp.js';

// The four verified headline figures. Bar heights are normalised from them,
// so the 3D can never contradict the numbers printed beside it.
const BARS = [
  { label: 'samples',  value: 8.3,  max: 10,  color: '#38bdf8' },
  { label: 'forecast', value: 96.4, max: 100, color: '#e64d2e' },
  { label: 'densenet', value: 86.7, max: 100, color: '#a78bfa' },
  { label: 'projects', value: 15,   max: 20,  color: '#e8eaf0' },
];

let group, meshes = [];

export default {
  id: 'impact',

  init({ scene }) {
    group = new THREE.Group();
    group.name = 'impact:bars';
    meshes = BARS.map((b, i) => {
      const geo = new THREE.BoxGeometry(1.1, 1, 1.1);
      geo.translate(0, 0.5, 0);            // grow upward from the base
      const mat = new THREE.MeshBasicMaterial({
        color: b.color, transparent: true, opacity: 0.55 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((i - 1.5) * 2.0, -3, 0);
      mesh.scale.y = 0.001;
      group.add(mesh);
      return mesh;
    });
    group.rotation.x = 0.25;
    scene.add(group);
    return group;
  },

  update(dt, progress) {
    BARS.forEach((b, i) => {
      const stagger = smoothstep(i * 0.12, i * 0.12 + 0.45, progress);
      meshes[i].scale.y = Math.max(0.001, (b.value / b.max) * 6 * stagger);
    });
    group.rotation.y = (progress - 0.5) * 0.6;
  },

  dispose() {
    meshes.forEach(m => { m.geometry.dispose(); m.material.dispose(); });
    group.parent?.remove(group);
    meshes = [];
  },
};
