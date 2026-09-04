import * as THREE from 'three';
import { createLabelLayer } from '../labels.js';
import { lerp, smoothstep, clamp } from '../util/lerp.js';

// The portfolio as an embedding: fifteen shipped projects positioned by the
// four domains the stack section already names. The clusters are the point —
// this is what the work looks like when you step back from it.
const DOMAINS = [
  { key: 'Data & BI',            color: 0x38bdf8, c: [-4.6, 1.3, 0.6] },
  { key: 'Machine learning',     color: 0xe64d2e, c: [4.3, 1.9, -0.8] },
  { key: 'Software architecture', color: 0xa78bfa, c: [3.2, -2.4, 1.4] },
  { key: 'Process & design',     color: 0x7d8b9c, c: [-3.9, -2.6, -1.1] },
];

const PROJECTS = [
  ['NVIDIA supply-chain BI', 0], ['US retail sales analysis', 0],
  ['Furniture sales dashboard', 0], ['Vision 2030 KPI tracker', 0],
  ['Water-quality ML benchmark', 1], ['AI face recognition', 1],
  ['ML experimentation template', 1], ['Azure ML pipelines', 1],
  ['Conference microservices', 2], ['REST API · 5 endpoints', 2],
  ['Kubernetes on AWS', 2],
  ['ITIL configuration management', 3], ['UCD work-life app', 3],
  ['Astro-Dash', 3], ['Portfolio · this site', 3],
];

let group, labels, field, fieldMat, fieldGeo, nodes = [];
let canvasEl = null, camera = null;
const pointer = { x: 0, y: 0, has: false };
let resolve = 0;

function onPointer(e) {
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = (e.clientY / innerHeight) * 2 - 1;
  pointer.has = true;
}

export default {
  id: 'hero',

  init({ scene, camera: cam, tier, budget }) {
    camera = cam;
    group = new THREE.Group();
    group.name = 'hero:latentPortfolio';
    labels = createLabelLayer();
    nodes = [];
    resolve = 0;

    // ── ambient latent field, tinted toward the nearest cluster ──
    const n = Math.max(4000, Math.floor(budget * 0.6));
    const pos = new Float32Array(n * 3);
    const tgt = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const tmp = new THREE.Color();

    for (let i = 0; i < n; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 46;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 46;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 46;

      const d = DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
      // Gaussian-ish spread so clusters have soft edges, like a real embedding.
      const s = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2.1;
      tgt[i * 3]     = d.c[0] + s();
      tgt[i * 3 + 1] = d.c[1] + s();
      tgt[i * 3 + 2] = d.c[2] + s();

      tmp.setHex(d.color);
      const dim = 0.35 + Math.random() * 0.5;
      col[i * 3] = tmp.r * dim; col[i * 3 + 1] = tmp.g * dim; col[i * 3 + 2] = tmp.b * dim;
    }

    fieldGeo = new THREE.BufferGeometry();
    fieldGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    fieldGeo.setAttribute('aTarget', new THREE.BufferAttribute(tgt, 3));
    fieldGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    fieldMat = new THREE.PointsMaterial({
      size: tier === 'high' ? 0.045 : 0.07,
      vertexColors: true, transparent: true, opacity: 0.85,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    field = new THREE.Points(fieldGeo, fieldMat);
    group.add(field);

    // ── the fifteen projects themselves, as solid points in that space ──
    const nodeGeo = new THREE.SphereGeometry(0.11, 12, 12);
    PROJECTS.forEach((p, i) => {
      const d = DOMAINS[p[1]];
      const m = new THREE.Mesh(nodeGeo, new THREE.MeshStandardMaterial({
        color: d.color, metalness: 0.3, roughness: 0.35,
        emissive: new THREE.Color(d.color), emissiveIntensity: 0.55,
      }));
      const a = (i / PROJECTS.length) * Math.PI * 2;
      m.position.set(
        d.c[0] + Math.cos(a * 3.1) * 1.5,
        d.c[1] + Math.sin(a * 2.3) * 1.2,
        d.c[2] + Math.cos(a * 1.7) * 1.2);
      m.userData.name = p[0];
      group.add(m);
      nodes.push(m);
    });

    DOMAINS.forEach(d => {
      labels.add(d.key, new THREE.Vector3(d.c[0], d.c[1] + 3.1, d.c[2]), 'axis', group);
    });
    labels.add('15 shipped projects · 4 domains',
      new THREE.Vector3(0, -5.6, 0), 'note', group);

    group.position.set(0, 0.4, 0);
    scene.add(group);

    canvasEl = document.getElementById('gl');
    addEventListener('pointermove', onPointer, { passive: true });
    return group;
  },

  update(dt, progress) {
    // Resolve out of noise into the clustered structure.
    resolve = Math.min(1, resolve + dt * 0.5);
    const e = smoothstep(0, 1, resolve);
    const p = fieldGeo.attributes.position.array;
    const t = fieldGeo.attributes.aTarget.array;
    if (resolve < 1) {
      for (let i = 0; i < p.length; i++) p[i] = lerp(p[i], t[i], e * 0.06);
      fieldGeo.attributes.position.needsUpdate = true;
    }

    const now = performance.now() * 0.001;
    nodes.forEach((m, i) => {
      m.material.emissiveIntensity = 0.4 + Math.abs(Math.sin(now * 0.9 + i)) * 0.45;
    });

    group.rotation.y += dt * 0.035;
    if (pointer.has) {
      group.rotation.x = lerp(group.rotation.x, clamp(pointer.y, -1, 1) * 0.12, 0.04);
    }
    group.position.y = 0.4 + progress * 3.2;

    const fade = (1 - smoothstep(0.45, 0.8, progress)) * e;
    fieldMat.opacity = 0.85 * fade;
    // Labels hold back until the headline has scrolled clear, so the name
    // owns the first screen uncontested.
    const named = smoothstep(0.16, 0.4, progress);
    labels.setOpacity(clamp(fade * named * smoothstep(0.15, 0.6, resolve), 0, 1));
    if (canvasEl && camera) labels.update(camera, canvasEl);
  },

  dispose() {
    removeEventListener('pointermove', onPointer);
    labels?.destroy();
    fieldGeo.dispose(); fieldMat.dispose();
    group.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
    group.parent?.remove(group);
    nodes = [];
  },
};
