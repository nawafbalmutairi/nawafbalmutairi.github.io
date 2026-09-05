import * as THREE from 'three';
import { createLabelLayer } from '../labels.js';
import { fitToCamera } from '../util/fit.js';
import { lerp, smoothstep, clamp } from '../util/lerp.js';

// The portfolio as an embedding: fifteen shipped projects positioned by the
// four domains the stack section already names. The clusters are the point —
// this is what the work looks like when you step back from it.
const DOMAINS = [
  { key: 'Data & BI',             color: 0x0d7d74, c: [-4.6, 1.3, 0.6] },
  { key: 'Machine learning',      color: 0x9a6212, c: [4.3, 1.9, -0.8] },
  { key: 'Software architecture', color: 0x6d4bd6, c: [3.2, -2.4, 1.4] },
  { key: 'Process & design',      color: 0x5c6672, c: [-3.9, -2.6, -1.1] },
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
let canvasEl = null, camera = null, sceneCtx = null;
const pointer = { x: 0, y: 0, has: false };
let resolve = 0, startedAt = 0, settled = false;

function onPointer(e) {
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = (e.clientY / innerHeight) * 2 - 1;
  pointer.has = true;
}

export default {
  id: 'hero',

  init(ctx) {
    const { scene, camera: cam, tier, budget, isWide } = ctx;
    sceneCtx = ctx;
    camera = cam;
    group = new THREE.Group();
    group.name = 'hero:latentPortfolio';
    labels = createLabelLayer();
    nodes = [];
    resolve = 0;
    settled = false;
    startedAt = performance.now();

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
      // Darken rather than lighten: on paper a point reads by being darker
      // than the ground, the opposite of the dark build's additive glow.
      const dim = 0.55 + Math.random() * 0.45;
      col[i * 3] = tmp.r * dim; col[i * 3 + 1] = tmp.g * dim; col[i * 3 + 2] = tmp.b * dim;
    }

    fieldGeo = new THREE.BufferGeometry();
    fieldGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    fieldGeo.setAttribute('aTarget', new THREE.BufferAttribute(tgt, 3));
    fieldGeo.setAttribute('aStart', new THREE.BufferAttribute(pos.slice(), 3));
    fieldGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    fieldMat = new THREE.PointsMaterial({
      size: tier === 'high' ? 0.05 : 0.075,
      vertexColors: true, transparent: true, opacity: 0.9,
      depthWrite: false, blending: THREE.NormalBlending,
    });
    field = new THREE.Points(fieldGeo, fieldMat);
    group.add(field);

    // ── the fifteen projects themselves, as solid points in that space ──
    const nodeGeo = new THREE.SphereGeometry(0.11, 12, 12);
    PROJECTS.forEach((p, i) => {
      const d = DOMAINS[p[1]];
      const m = new THREE.Mesh(nodeGeo, new THREE.MeshStandardMaterial({
        color: d.color, metalness: 0.15, roughness: 0.42,
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

    // Held to the right on wide screens so the name and bio keep a clean
    // column; a cloud behind body copy is the wallpaper this design avoids.
    group.position.set(0, 0.4, 0);
    scene.add(group);

    // Fit the settled layout, not the noise the points start in: measuring the
    // scattered state would shrink the clusters to nothing once they resolve.
    const settledBox = new THREE.Box3();
    const t = fieldGeo.attributes.aTarget.array;
    const v = new THREE.Vector3();
    for (let i = 0; i < t.length; i += 3) settledBox.expandByPoint(v.set(t[i], t[i + 1], t[i + 2]));
    settledBox.expandByScalar(1.2);   // room for the cluster labels above each group
    fitToCamera(group, cam, { box: settledBox, margin: 0.82 });

    canvasEl = document.getElementById('gl');
    addEventListener('pointermove', onPointer, { passive: true });
    return group;
  },

  update(dt, progress) {
    // Resolve out of noise into the clustered structure.
    // Driven by elapsed wall-clock time, not accumulated frames: on a slow
    // device a frame-counted resolve would leave the viewer staring at an
    // unresolved starfield for seconds.
    resolve = clamp((performance.now() - startedAt) / 1400, 0, 1);
    const e = smoothstep(0, 1, resolve);
    // Keep writing until the final frame is actually committed: guarding on
    // `resolve < 1` drops the last write whenever frames are sparse enough to
    // step straight past 1, leaving the cloud permanently unresolved.
    if (!settled) {
      // Interpolated from the stored start positions by absolute progress,
      // never accumulated per frame: an accumulating lerp converges at
      // whatever rate the device happens to render, so a slow machine would
      // sit on an unresolved starfield - the decoration this design avoids.
      const p = fieldGeo.attributes.position.array;
      const a = fieldGeo.attributes.aStart.array;
      const t = fieldGeo.attributes.aTarget.array;
      for (let i = 0; i < p.length; i++) p[i] = lerp(a[i], t[i], e);
      fieldGeo.attributes.position.needsUpdate = true;
      if (resolve >= 1) settled = true;
    }

    const now = performance.now() * 0.001;
    // Lit, not emissive: a glowing dot on white reads as a rendering bug.
    nodes.forEach((m, i) => {
      m.scale.setScalar(1 + Math.abs(Math.sin(now * 0.9 + i)) * 0.16);
    });

    group.rotation.y += dt * 0.035;
    if (pointer.has) {
      group.rotation.x = lerp(group.rotation.x, clamp(pointer.y, -1, 1) * 0.12, 0.04);
    }
    group.position.y = 0.4 + progress * 3.2;

    const fade = (1 - smoothstep(0.45, 0.8, progress)) * e;
    fieldMat.opacity = 0.9 * fade;
    // Labels hold back until the headline has scrolled clear, so the name
    // owns the first screen uncontested.
    const named = smoothstep(0.16, 0.4, progress);
    labels.setOpacity(clamp(fade * named * smoothstep(0.15, 0.6, resolve), 0, 1));
    labels.update(camera, sceneCtx && sceneCtx.rect);
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
