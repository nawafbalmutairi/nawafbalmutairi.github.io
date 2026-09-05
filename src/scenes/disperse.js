import * as THREE from 'three';
import { vert, frag } from '../shaders/points.js';

// The inverse of the hero: coherent at the section's start, scattering back to
// noise as the page ends.
let points, material, geometry;

export default {
  id: 'contact',

  init({ scene, tier, budget }) {
    const n = Math.max(400, Math.floor(budget / 2));
    const pos = new Float32Array(n * 3);   // scattered end state
    const tgt = new Float32Array(n * 3);   // coherent start state
    const seed = new Float32Array(n);

    for (let i = 0; i < n; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 48;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 48;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 48;

      const t = Math.random() * Math.PI * 2;
      const r = 2.5 + Math.random() * 3.5;
      tgt[i * 3]     = Math.cos(t) * r;
      tgt[i * 3 + 1] = (Math.random() - 0.5) * 5;
      tgt[i * 3 + 2] = Math.sin(t) * r;

      seed[i] = Math.random();
    }

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute('aTarget', new THREE.BufferAttribute(tgt, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

    material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uResolve: { value: 1 },
        uSize: { value: tier === 'high' ? 2.0 : 2.8 },
        uColorA: { value: new THREE.Color('#ff6a3d') },
        uColorB: { value: new THREE.Color('#8fa6c4') },
      },
    });

    points = new THREE.Points(geometry, material);
    points.name = 'contact:disperse';
    scene.add(points);
    return points;
  },

  update(dt, progress) {
    material.uniforms.uTime.value += dt;
    material.uniforms.uResolve.value = 1 - progress;   // scroll scatters it
    points.rotation.y += dt * 0.03;
  },

  dispose() {
    geometry.dispose();
    material.dispose();
    points.parent?.remove(points);
  },
};
