import * as THREE from 'three';
import { vert, frag } from '../shaders/points.js';
import { lerp } from '../util/lerp.js';

let points, material, geometry;
const pointer = { x: 0, y: 0 };

function onPointer(e) {
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = (e.clientY / innerHeight) * 2 - 1;
}

export default {
  id: 'hero',

  init({ scene, tier, budget }) {
    const n = budget;
    const pos = new Float32Array(n * 3);
    const tgt = new Float32Array(n * 3);
    const seed = new Float32Array(n);

    for (let i = 0; i < n; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;

      // Target: a swirled manifold — a latent space, not a sphere.
      const t = Math.random() * Math.PI * 2;
      const r = 3 + Math.random() * 5;
      const h = (Math.random() - 0.5) * 6;
      tgt[i * 3]     = Math.cos(t + h * 0.4) * r;
      tgt[i * 3 + 1] = h;
      tgt[i * 3 + 2] = Math.sin(t + h * 0.4) * r;

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
        uResolve: { value: 0 },
        uSize: { value: tier === 'high' ? 2.2 : 3.0 },
        uColorA: { value: new THREE.Color('#38bdf8') },
        uColorB: { value: new THREE.Color('#e64d2e') },
      },
    });

    points = new THREE.Points(geometry, material);
    points.name = 'hero:latentField';
    scene.add(points);
    addEventListener('pointermove', onPointer, { passive: true });
    return points;
  },

  update(dt, progress) {
    material.uniforms.uTime.value += dt;
    material.uniforms.uResolve.value =
      Math.min(1, material.uniforms.uResolve.value + dt * 0.6);
    points.rotation.y += dt * 0.05;
    points.rotation.x = lerp(points.rotation.x, pointer.y * 0.15, 0.05);
    points.position.y = progress * 4;
  },

  dispose() {
    removeEventListener('pointermove', onPointer);
    geometry.dispose();
    material.dispose();
    points.parent?.remove(points);
  },
};
