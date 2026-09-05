import * as THREE from 'three';
import { createLabelLayer } from '../labels.js';
import { dragFor } from '../drag.js';
import { fitToCamera } from '../util/fit.js';
import { smoothstep, clamp } from '../util/lerp.js';

// The NVIDIA case as a working system, not a diagram of one.
// Constrained supply (TSMC advanced node, CoWoS packaging) feeds one planning
// hub, which serves two regions. Published figures drive the geometry.
const HUB = { x: 0, y: 0, z: 0 };
const SUPPLY = [
  { name: 'TSMC · advanced node', x: -6.2, y: 1.9, z: 0, cap: 0.62 },
  { name: 'CoWoS packaging',      x: -6.2, y: -1.9, z: 0, cap: 0.44 },
];
const REGIONS = [
  { name: 'EMEA',          x: 6.2, y: 1.9, z: 0, inv: 127.9, back: 21.1 },
  { name: 'North America', x: 6.2, y: -1.9, z: 0, inv: 127.9, back: 21.1 },
];

const COL = {
  flow: 0xe8a33d,
  node: 0xdbe4ee,
  strain: 0xff6a3d,
  loop: 0xffc98a,
};

let group, labels, particles, pMat, pGeo, edges = [];
let backorderBars = [], ringR, ringB, hubMesh;
let canvasEl = null, camera = null, sceneCtx = null;
const PARTICLES_PER_EDGE = 26;

function edgeList() {
  const out = [];
  SUPPLY.forEach(s => out.push({ from: s, to: HUB, rate: s.cap }));
  REGIONS.forEach(r => out.push({ from: HUB, to: r, rate: 0.55 }));
  return out;
}

export default {
  id: 'case-02',

  init(ctx) {
    const { scene, camera: cam, isWide } = ctx;
    sceneCtx = ctx;
    camera = cam;
    group = new THREE.Group();
    group.name = 'case-02:supplySystem';
    labels = createLabelLayer();
    edges = edgeList();
    backorderBars = [];

    const nodeMat = new THREE.MeshStandardMaterial({
      color: COL.node, metalness: 0.35, roughness: 0.4,
      emissive: new THREE.Color(COL.node), emissiveIntensity: 0.16,
    });

    // ── the planning hub: the actor the dashboard exists to support ──
    hubMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.72, 1), nodeMat.clone());
    hubMesh.material.color.set(COL.flow);
    hubMesh.material.emissive.set(COL.flow);
    hubMesh.material.emissiveIntensity = 0.45;
    hubMesh.position.set(HUB.x, HUB.y, HUB.z);
    group.add(hubMesh);
    labels.add('NVIDIA ops & planning', new THREE.Vector3(0, -1.25, 0), 'axis', group);

    // ── constrained upstream: radius encodes remaining capacity ──
    SUPPLY.forEach(s => {
      const m = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.26 + s.cap * 0.34, 1), nodeMat.clone());
      m.position.set(s.x, s.y, s.z);
      group.add(m);
      labels.add(s.name, new THREE.Vector3(s.x, s.y + 0.95, s.z), 'axis', group);
      labels.add(Math.round(s.cap * 100) + '% capacity',
        new THREE.Vector3(s.x, s.y - 0.95, s.z), 'note', group);
    });

    // ── regions, each carrying its own backorder column ──
    REGIONS.forEach(r => {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), nodeMat.clone());
      m.position.set(r.x, r.y, r.z);
      group.add(m);
      labels.add(r.name, new THREE.Vector3(r.x, r.y + 1.0, r.z), 'axis', group);

      // Backorders are the visible failure of the system: 21.1K per region.
      const geo = new THREE.BoxGeometry(0.42, 1, 0.42);
      geo.translate(0, 0.5, 0);
      const bar = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        color: COL.strain, metalness: 0.2, roughness: 0.45, transparent: true,
        opacity: 0.95, emissive: new THREE.Color(COL.strain), emissiveIntensity: 0.45,
      }));
      bar.position.set(r.x + 1.5, r.y - 0.5, r.z);
      bar.scale.y = 0.001;
      bar.userData.full = r.back / 21.1 * 2.4;
      group.add(bar);
      backorderBars.push(bar);
      labels.add(r.back.toFixed(1) + 'K backorders',
        new THREE.Vector3(r.x + 1.5, r.y - 0.5 + 2.9, r.z), 'note', group);
    });

    // ── flow lines ──
    const verts = [];
    edges.forEach(e => verts.push(e.from.x, e.from.y, e.from.z, e.to.x, e.to.y, e.to.z));
    const eGeo = new THREE.BufferGeometry();
    eGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    group.add(new THREE.LineSegments(eGeo, new THREE.LineBasicMaterial({
      color: COL.flow, transparent: true, opacity: 0.4 })));

    // ── volume actually moving through the system ──
    const total = edges.length * PARTICLES_PER_EDGE;
    const pos = new Float32Array(total * 3);
    const off = new Float32Array(total);
    let i = 0;
    edges.forEach((e, ei) => {
      for (let k = 0; k < PARTICLES_PER_EDGE; k++) {
        pos[i * 3] = e.from.x; pos[i * 3 + 1] = e.from.y; pos[i * 3 + 2] = e.from.z;
        off[i] = (k / PARTICLES_PER_EDGE) + ei * 0.13;
        i++;
      }
    });
    pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pMat = new THREE.PointsMaterial({
      color: COL.flow, size: 0.13, transparent: true, opacity: 0.95,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    particles = new THREE.Points(pGeo, pMat);
    particles.userData = { off };
    group.add(particles);

    // ── the two loop families the case study identifies ──
    ringR = new THREE.Mesh(
      new THREE.TorusGeometry(3.15, 0.016, 8, 140),
      new THREE.MeshBasicMaterial({ color: COL.strain, transparent: true, opacity: 0.5 }));
    ringR.rotation.x = Math.PI / 2.3;
    group.add(ringR);

    ringB = new THREE.Mesh(
      new THREE.TorusGeometry(4.15, 0.012, 8, 140),
      new THREE.MeshBasicMaterial({ color: COL.loop, transparent: true, opacity: 0.36 }));
    ringB.rotation.x = Math.PI / 2.9;
    group.add(ringB);

    labels.add('R · reinforcing', new THREE.Vector3(0, 0.1, 3.35), 'note', group);
    labels.add('B · balancing', new THREE.Vector3(0, 0.1, -4.35), 'note', group);
    labels.add('96.4% forecast accuracy', new THREE.Vector3(0, 2.0, 0), 'win', group);

    this._offsetX = 0;   // the slot composes it; the scene just centres
    group.position.set(this._offsetX, -0.2, 1.2);
    group.scale.setScalar(isWide ? 0.82 : 0.58);
    group.rotation.set(0.12, -0.5, 0);
    scene.add(group);
    fitToCamera(group, cam, { margin: 0.52 });
    group.position.x += cam.aspect > 1.2 ? 3.4 : 0;   // clear of the copy

    canvasEl = document.getElementById('gl');
    return group;
  },

  update(dt, progress) {
    const t = performance.now() * 0.001;

    // Volume flows supply -> hub -> regions, paced by each edge's rate.
    const arr = pGeo.attributes.position.array;
    const off = particles.userData.off;
    let i = 0;
    for (let ei = 0; ei < edges.length; ei++) {
      const e = edges[ei];
      for (let k = 0; k < PARTICLES_PER_EDGE; k++) {
        const u = (t * (0.14 + e.rate * 0.22) + off[i]) % 1;
        arr[i * 3]     = e.from.x + (e.to.x - e.from.x) * u;
        arr[i * 3 + 1] = e.from.y + (e.to.y - e.from.y) * u;
        arr[i * 3 + 2] = e.from.z + (e.to.z - e.from.z) * u;
        i++;
      }
    }
    pGeo.attributes.position.needsUpdate = true;

    backorderBars.forEach((b, n) => {
      const g = smoothstep(0.12 + n * 0.07, 0.55 + n * 0.07, progress);
      b.scale.y = Math.max(0.001, b.userData.full * g);
    });

    hubMesh.rotation.y += dt * 0.5;
    hubMesh.rotation.x += dt * 0.22;
    ringR.rotation.z += dt * 0.3;
    ringB.rotation.z -= dt * 0.19;

    const d = dragFor('case-02');
    group.rotation.y = -0.5 + d.x + (progress - 0.5) * 0.5;
    group.rotation.x = 0.12 + d.y;

    const fade = smoothstep(0.05, 0.24, progress) * (1 - smoothstep(0.52, 0.72, progress));
    pMat.opacity = 0.95 * fade;
    group.visible = fade > 0.02;
    group.position.x = (this._offsetX ?? 0) + (1 - fade) * 2.4;
    labels.setOpacity(clamp(fade, 0, 1));
    labels.update(camera, sceneCtx && sceneCtx.rect);
  },

  dispose() {
    labels?.destroy();
    group.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
    group.parent?.remove(group);
    backorderBars = []; edges = [];
  },
};
