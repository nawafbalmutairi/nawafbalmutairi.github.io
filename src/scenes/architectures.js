import * as THREE from 'three';
import { createLabelLayer } from '../labels.js';
import { dragFor } from '../drag.js';
import { fitToCamera } from '../util/fit.js';
import { smoothstep, clamp } from '../util/lerp.js';

// The two architectures drawn as what actually distinguishes them.
// DenseNet: every layer feeds every later layer. ResNet: identity shortcuts
// that skip two at a time. The wiring IS the comparison — and DenseNet is
// ember because it won at 0.867 on the held-out set.
const LAYERS = 6;
const COL = {
  dense: 0x6d4bd6,
  res: 0x9aa3af,
  signal: 0x0d7d74,
};

let group, labels, canvasEl = null, camera = null, sceneCtx = null;
let denseNodes = [], resNodes = [], denseLines, resLines;
let accBars = [];

function column(x, color, emissive) {
  const nodes = [];
  const geo = new THREE.SphereGeometry(0.17, 14, 14);
  const mat = new THREE.MeshStandardMaterial({
    color, metalness: 0.3, roughness: 0.4,
    emissive: new THREE.Color(color), emissiveIntensity: emissive,
  });
  for (let i = 0; i < LAYERS; i++) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, 2.6 - i * 1.05, 0);
    nodes.push(m);
  }
  return nodes;
}

function linesFor(nodes, pairs, color, opacity) {
  const v = [];
  pairs.forEach(([a, b]) => {
    v.push(nodes[a].position.x, nodes[a].position.y, nodes[a].position.z);
    v.push(nodes[b].position.x, nodes[b].position.y, nodes[b].position.z);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  return new THREE.LineSegments(g, new THREE.LineBasicMaterial({
    color, transparent: true, opacity }));
}

export default {
  id: 'case-03',

  init(ctx) {
    const { scene, camera: cam, isWide } = ctx;
    sceneCtx = ctx;
    camera = cam;
    group = new THREE.Group();
    group.name = 'case-03:architectures';
    labels = createLabelLayer();

    denseNodes = column(-2.5, COL.dense, 0.12);
    resNodes = column(2.5, COL.res, 0);
    denseNodes.forEach(n => group.add(n));
    resNodes.forEach(n => group.add(n));

    // Dense connectivity: every layer to every subsequent layer.
    const densePairs = [];
    for (let a = 0; a < LAYERS; a++)
      for (let b = a + 1; b < LAYERS; b++) densePairs.push([a, b]);
    denseLines = linesFor(denseNodes, densePairs, COL.dense, 0.4);
    group.add(denseLines);

    // Residual: sequential path plus identity shortcuts skipping two.
    const resPairs = [];
    for (let a = 0; a < LAYERS - 1; a++) resPairs.push([a, a + 1]);
    for (let a = 0; a + 2 < LAYERS; a += 2) resPairs.push([a, a + 2]);
    resLines = linesFor(resNodes, resPairs, COL.res, 0.55);
    group.add(resLines);

    labels.add('DenseNet', new THREE.Vector3(-2.5, 3.35, 0), 'axis', group);
    labels.add('ResNet', new THREE.Vector3(2.5, 3.35, 0), 'axis', group);
    labels.add(densePairs.length + ' connections',
      new THREE.Vector3(-2.5, -3.55, 0), 'note', group);
    labels.add(resPairs.length + ' connections',
      new THREE.Vector3(2.5, -3.55, 0), 'note', group);

    // Held-out accuracy, as bars beneath the architecture that produced it.
    [[-2.5, 0.867, COL.dense], [2.5, 0.80, COL.res]].forEach(([x, acc, color], i) => {
      const geo = new THREE.BoxGeometry(1.15, 1, 0.5);
      geo.translate(0, 0.5, 0);
      const bar = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        color, metalness: 0.25, roughness: 0.45, transparent: true, opacity: 0.92,
        emissive: new THREE.Color(color), emissiveIntensity: i === 0 ? 0.12 : 0,
      }));
      bar.position.set(x, -4.6, 0);
      bar.scale.y = 0.001;
      bar.userData.full = acc * 3.0;
      group.add(bar);
      accBars.push(bar);
      labels.add(acc.toFixed(3).replace(/0$/, ''),
        new THREE.Vector3(x, -4.6 + acc * 3.0 + 0.5, 0), i === 0 ? 'win' : 'axis', group);
    });
    labels.add('real-time inference · 30 unseen photos',
      new THREE.Vector3(0, -5.35, 0), 'note', group);

    this._offsetX = 0;   // the slot composes it; the scene just centres
    group.position.set(this._offsetX, 0.9, 1.0);
    group.scale.setScalar(isWide ? 0.72 : 0.52);
    group.rotation.set(0.05, -0.35, 0);
    scene.add(group);
    fitToCamera(group, cam);

    canvasEl = document.getElementById('gl');
    return group;
  },

  update(dt, progress) {
    const t = performance.now() * 0.001;

    // Signal strength: the denser wiring carries more, which is the point.
    denseLines.material.opacity = 0.22 + Math.abs(Math.sin(t * 1.1)) * 0.3;
    resLines.material.opacity = 0.28 + Math.abs(Math.sin(t * 1.1 + 1.6)) * 0.14;

    denseNodes.forEach((n, i) => {
      n.material.emissiveIntensity = 0.06 + Math.abs(Math.sin(t * 1.6 - i * 0.5)) * 0.16;
    });

    accBars.forEach((b, i) => {
      const g = smoothstep(0.16 + i * 0.08, 0.6 + i * 0.08, progress);
      b.scale.y = Math.max(0.001, b.userData.full * g);
    });

    const d = dragFor('case-03');
    group.rotation.y = -0.35 + d.x + (progress - 0.5) * 0.7;
    group.rotation.x = 0.05 + d.y;

    const fade = smoothstep(0.05, 0.24, progress) * (1 - smoothstep(0.52, 0.72, progress));
    group.visible = fade > 0.02;
    group.position.x = (this._offsetX ?? 0) + (1 - fade) * 2.4;
    labels.setOpacity(clamp(fade, 0, 1));
    labels.update(camera, sceneCtx && sceneCtx.rect);
  },

  dispose() {
    labels?.destroy();
    group.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
    group.parent?.remove(group);
    denseNodes = []; resNodes = []; accBars = [];
  },
};
