import * as THREE from 'three';

// One cluster per benchmarked model, positioned by its average R².
// XGBoost sits highest and tightest because it actually won.
const MODELS = [
  { name: 'Ridge',         r2: 0.09, color: '#5d6675' },
  { name: 'MLP',           r2: 0.31, color: '#a78bfa' },
  { name: 'Random Forest', r2: 0.58, color: '#38bdf8' },
  { name: 'XGBoost',       r2: 0.79, color: '#e64d2e' },
];

let group, clouds = [];

export default {
  id: 'case-01',

  init({ scene, budget }) {
    group = new THREE.Group();
    group.name = 'case-01:manifold';
    const per = Math.max(500, Math.floor(budget / 8));

    clouds = MODELS.map((mdl, i) => {
      const pos = new Float32Array(per * 3);
      const spread = 1.6 * (1 - mdl.r2 * 0.7);   // better model = tighter cluster
      for (let p = 0; p < per; p++) {
        pos[p * 3]     = (i - 1.5) * 3.4 + (Math.random() - 0.5) * spread * 2;
        pos[p * 3 + 1] = mdl.r2 * 6 - 3 + (Math.random() - 0.5) * spread * 2;
        pos[p * 3 + 2] = (Math.random() - 0.5) * spread * 2;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        color: mdl.color, size: 0.045, transparent: true,
        opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending });
      const pts = new THREE.Points(geo, mat);
      pts.name = 'model:' + mdl.name;
      group.add(pts);
      return pts;
    });

    scene.add(group);
    return group;
  },

  update(dt, progress) {
    group.rotation.y = -0.4 + progress * 0.8;
    group.position.y = (0.5 - progress) * 2;
  },

  dispose() {
    clouds.forEach(c => { c.geometry.dispose(); c.material.dispose(); });
    group.parent?.remove(group);
    clouds = [];
  },
};
