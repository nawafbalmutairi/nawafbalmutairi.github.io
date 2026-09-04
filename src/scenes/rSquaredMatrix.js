import * as THREE from 'three';
import { createLabelLayer } from '../labels.js';
import { smoothstep, clamp } from '../util/lerp.js';

// The dissertation result, as an object rather than a decoration.
// 4 models x 5 targets = the 20 combinations actually benchmarked.
const MODELS = ['Ridge', 'Random Forest', 'MLP', 'XGBoost'];
const TARGETS = ['Nitrate as N', 'BOD: 5 Day ATU', 'Water Temp', 'Dissolved O₂', 'pH'];

// R² by [target][model] — the published values, unchanged.
const R2 = [
  [-0.01, -0.32, -1.42, +0.02],
  [-0.01, -3.49, -0.07, -0.27],
  [+0.11, +0.73, -3.61, +0.79],
  [+0.36, +0.18, +0.46, +0.50],
  [-0.01, +0.16, +0.08, +0.23],
];
const WINNER = { t: 2, m: 3 };   // XGBoost x Water Temp, +0.79

const COL = {
  positive: 0x38bdf8,   // beat the mean
  negative: 0x39414f,   // worse than predicting the mean
  winner:   0xe64d2e,   // the only pairing that actually worked
};

const STEP_X = 2.05;
const STEP_Z = 2.05;

// Cube-root scale: -3.61 and +0.79 have to share one axis without the
// failures burying the result. Non-linear, so it is labelled as such.
const scaleR2 = r => Math.sign(r) * Math.cbrt(Math.abs(r)) * 2.0;

let group, labels, bars = [];
let raycaster, pointerNDC, hovered = null, readout = null;
let canvasEl = null;
const pointer = { x: 0, y: 0, has: false };

function onPointer(e) {
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = (e.clientY / innerHeight) * 2 - 1;
  pointer.has = true;
}

export default {
  id: 'case-01',

  init({ scene, camera, isWide }) {
    group = new THREE.Group();
    group.name = 'case-01:r2matrix';
    labels = createLabelLayer();
    bars = [];

    const w = (MODELS.length - 1) * STEP_X;
    const d = (TARGETS.length - 1) * STEP_Z;

    // ── zero plane: the line between "useful" and "worse than the mean" ──
    const grid = new THREE.GridHelper(Math.max(w, d) + 4, 9, 0x4a6076, 0x24303e);
    grid.position.y = 0;
    grid.material.transparent = true;
    grid.material.opacity = 0.55;
    group.add(grid);

    // Deliberately near-transparent and never depth-writing: nine of the
    // twenty models score below zero, and an opaque zero plane hides exactly
    // the half of the finding that says "worse than predicting the mean".
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(w + 3, d + 3),
      new THREE.MeshBasicMaterial({
        color: 0x0d1621, transparent: true, opacity: 0.16,
        side: THREE.DoubleSide, depthWrite: false }));
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.01;
    plane.renderOrder = -1;
    group.add(plane);

    // ── the 20 bars ──
    for (let t = 0; t < TARGETS.length; t++) {
      for (let m = 0; m < MODELS.length; m++) {
        const r = R2[t][m];
        const h = scaleR2(r);
        const isWinner = t === WINNER.t && m === WINNER.m;
        const positive = r > 0;

        const geo = new THREE.BoxGeometry(0.86, 1, 0.86);
        geo.translate(0, 0.5, 0);   // grow from the zero plane

        const color = isWinner ? COL.winner : positive ? COL.positive : COL.negative;
        const mat = new THREE.MeshStandardMaterial({
          color,
          metalness: 0.25,
          roughness: isWinner ? 0.25 : 0.55,
          transparent: true,
          opacity: positive ? 1 : 0.3,
          depthWrite: positive,
          emissive: new THREE.Color(color),
          emissiveIntensity: isWinner ? 0.55 : positive ? 0.18 : 0.04,
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(m * STEP_X - w / 2, 0, t * STEP_Z - d / 2);
        mesh.scale.y = 0.001;
        mesh.userData = { r, h, model: MODELS[m], target: TARGETS[t], isWinner, base: color,
                          baseOpacity: positive ? 1 : 0.3 };
        // Edges give every bar definition against the dark ground; the
        // failures especially need an outline or they read as empty space.
        const edge = new THREE.LineSegments(
          new THREE.EdgesGeometry(geo),
          new THREE.LineBasicMaterial({
            color: isWinner ? 0xffb59e : positive ? 0x7fd4ff : 0x8494a8,
            transparent: true, opacity: positive ? 0.5 : 0.95 }));
        mesh.add(edge);
        edge.scale.set(1, 1, 1);

        group.add(mesh);
        bars.push(mesh);

        if (isWinner) {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.78, 0.022, 8, 48),
            new THREE.MeshBasicMaterial({ color: COL.winner, transparent: true, opacity: 0.9 }));
          ring.rotation.x = -Math.PI / 2;
          ring.position.copy(mesh.position);
          ring.position.y = 0.02;
          group.add(ring);
        }
      }
    }

    // ── axis labels: models along the front, targets down the side ──
    MODELS.forEach((name, m) => {
      labels.add(name, new THREE.Vector3(m * STEP_X - w / 2, -0.15, d / 2 + 1.5), 'axis', group);
    });
    TARGETS.forEach((name, t) => {
      labels.add(name, new THREE.Vector3(-w / 2 - 2.4, -0.15, t * STEP_Z - d / 2), 'axis', group);
    });

    // ── the headline, anchored to the bar it describes ──
    const win = bars.find(b => b.userData.isWinner);
    labels.add('R² +0.79  ★', new THREE.Vector3(
      win.position.x, scaleR2(0.79) + 0.75, win.position.z), 'win', group);
    labels.add('cube-root scale', new THREE.Vector3(w / 2 + 1.2, 0.1, d / 2 + 1.5), 'note', group);

    readout = labels.add('', new THREE.Vector3(0, 0, 0), 'readout', group);
    readout.visible = false;

    this._offsetX = isWide ? 2.6 : 0;      // composed beside the text, not behind it
    group.position.x = this._offsetX;
    group.position.y = -0.4;
    group.position.z = 1.5;
    group.scale.setScalar(isWide ? 0.86 : 0.66);
    group.rotation.y = -0.62;
    group.rotation.x = 0.06;
    scene.add(group);

    raycaster = new THREE.Raycaster();
    pointerNDC = new THREE.Vector2();
    canvasEl = document.getElementById('gl');
    addEventListener('pointermove', onPointer, { passive: true });

    this._camera = camera;
    return group;
  },

  update(dt, progress) {
    // Bars rise target-row by target-row as the case scrolls in.
    bars.forEach(b => {
      const row = (b.position.z + (TARGETS.length - 1) * STEP_Z / 2) / STEP_Z;
      const t0 = 0.06 + row * 0.055;
      const g = smoothstep(t0, t0 + 0.34, progress);
      // Keep the sign: a negative R² must grow DOWNWARD through the zero
      // plane. Clamping with Math.max would flatten every failing model.
      const v = b.userData.h * g;
      b.scale.y = Math.abs(v) < 0.001 ? 0.001 : v;
    });

    // Slow presentation turn, nudged by the pointer — it reads as an object
    // being shown to you, not a spinning logo.
    const target = -0.62 + (pointer.has ? pointer.x * 0.28 : 0) + (progress - 0.5) * 0.5;
    group.rotation.y += (target - group.rotation.y) * Math.min(1, dt * 2.2);
    group.rotation.x = 0.06 + (pointer.has ? clamp(pointer.y, -1, 1) * 0.05 : 0);

    // Hover readout: name the bar and its real value.
    if (pointer.has && raycaster && this._camera) {
      pointerNDC.set(pointer.x, -pointer.y);
      raycaster.setFromCamera(pointerNDC, this._camera);
      const hit = raycaster.intersectObjects(bars, false)[0];
      const obj = hit ? hit.object : null;
      if (obj !== hovered) {
        if (hovered) hovered.material.emissiveIntensity =
          hovered.userData.isWinner ? 0.55 : hovered.userData.r > 0 ? 0.18 : 0.04;
        hovered = obj;
        if (hovered) hovered.material.emissiveIntensity = 0.8;
      }
      if (hovered) {
        const u = hovered.userData;
        readout.el.textContent =
          `${u.model} × ${u.target}  ·  R² ${u.r > 0 ? '+' : ''}${u.r.toFixed(2)}`;
        readout.anchor.position.set(
          hovered.position.x, hovered.scale.y + 0.55, hovered.position.z);
        readout.visible = true;
      } else {
        readout.visible = false;
      }
    }

    // Fade out past the halfway mark: the deeper reading gets full width.
    const fade = smoothstep(0.05, 0.25, progress) * (1 - smoothstep(0.52, 0.72, progress));
    bars.forEach(b => { b.material.opacity = b.userData.baseOpacity * fade; });
    group.visible = fade > 0.02;
    group.position.x = (this._offsetX ?? 0) + (1 - fade) * 2.5;

    labels.setOpacity(fade);
    if (canvasEl) labels.update(this._camera, canvasEl);
  },

  dispose() {
    removeEventListener('pointermove', onPointer);
    labels?.destroy();
    group.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
    group.parent?.remove(group);
    bars = []; hovered = null; readout = null;
  },
};
