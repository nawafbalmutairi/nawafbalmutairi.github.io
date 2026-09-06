// The Work gallery, rendered in WebGL.
//
// Projects stand on an arc in a dark space over a receding grid floor. Each
// plane is bent by a vertex shader — a standing cylindrical curve, plus extra
// curvature and twist proportional to how fast you are moving through the
// gallery — and each face is a composition drawn for that project from its own
// data (see faces.js), not a shared card template.
//
// Clicking the focused project travels into it: the plane comes forward, the
// rest of the room falls away, and the case study opens at the end of the move.
//
// Nothing animates at rest. The loop runs only while something is moving.

import { drawFace } from './faces.js';

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const HUE = {
  teal:   [0.37, 0.88, 0.80],
  ochre:  [0.94, 0.70, 0.34],
  violet: [0.71, 0.61, 1.00],
  ember:  [1.00, 0.54, 0.30],
};

const VERT = `
uniform float uVel;
uniform float uOpen;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  float bend = sin(uv.x * 3.14159265);
  // The standing curve relaxes as a project opens, so you end up looking at a
  // flat page rather than a bent one.
  p.z += bend * 0.46 * (1.0 - uOpen);
  p.z += bend * uVel * 1.15;
  p.y += (uv.x - 0.5) * uVel * 0.42;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

const FRAG = `
uniform sampler2D uTex;
uniform vec3  uHue;
uniform float uFocus;
uniform float uHover;
uniform float uFade;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(uTex, vUv).rgb;
  c *= 0.62 + uFocus * 0.30 + uHover * 0.14;
  float edge = smoothstep(0.0, 0.012, vUv.x) * smoothstep(1.0, 0.988, vUv.x)
             * smoothstep(0.0, 0.019, vUv.y) * smoothstep(1.0, 0.981, vUv.y);
  c = mix(uHue * (0.30 + uFocus * 0.45), c, edge);
  float v = smoothstep(1.15, 0.30, length(vUv - 0.5));
  c *= 0.74 + 0.26 * v;
  gl_FragColor = vec4(c, uFade * (0.42 + uFocus * 0.58));
}`;

export async function createGallery({ canvas, items, onFocus, onOpen }) {
  const THREE = await import(/* @vite-ignore */ THREE_URL);
  const dpr = Math.min(devicePixelRatio || 1, 2);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  // Depth cue for the floor: the grid dissolves rather than ending at an edge.
  scene.fog = new THREE.Fog(0x090d12, 11, 30);

  const camera = new THREE.PerspectiveCamera(42, 2, 0.1, 120);
  const CAM_Z = 6.1, CAM_Y = 0.1;
  camera.position.set(0, CAM_Y, CAM_Z);

  /* ── the floor: a grid running away under the work ──────────────── */
  const grid = new THREE.GridHelper(64, 64, 0x2a3542, 0x1a212b);
  grid.position.y = -2.35;
  grid.material.transparent = true;
  grid.material.opacity = 0.55;
  grid.material.fog = true;
  scene.add(grid);

  const R = 11.5, STEP = 0.30, OFFSET = 2.5;

  const planes = [];
  const group = new THREE.Group();
  group.position.x = -OFFSET;
  scene.add(group);

  // Every face is drawn from the project's own data, so there is nothing to
  // wait on: no figure is fetched here any more.
  items.forEach((item, i) => {
    const face = drawFace(item, null, dpr);
    const tex = new THREE.CanvasTexture(face);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, side: THREE.DoubleSide, depthWrite: false,
      uniforms: {
        uTex:   { value: tex },
        uHue:   { value: new THREE.Vector3(...(HUE[item.accent] || HUE.ember)) },
        uVel:   { value: 0 }, uFocus: { value: i === 0 ? 1 : 0 },
        uHover: { value: 0 }, uFade: { value: 1 }, uOpen: { value: 0 },
      },
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 2.7, 44, 26), mat);
    mesh.userData.index = i;
    mesh.renderOrder = 2;
    group.add(mesh);
    planes[i] = mesh;
  });

  let target = 0, shown = 0, vel = 0, hovered = -1;
  let running = true, raf = 0, dirty = true;
  let opening = -1, openT = 0;

  const clamp = v => Math.min(Math.max(v, 0), items.length - 1);

  function layout(pos) {
    for (let i = 0; i < planes.length; i++) {
      const m = planes[i];
      if (!m) continue;
      const a = (i - pos) * STEP;
      const d = Math.abs(i - pos);
      const isOpening = i === opening;

      m.position.x = Math.sin(a) * R;
      m.position.z = Math.cos(a) * R - R + (isOpening ? openT * 3.4 : 0);
      m.position.y = -d * 0.1;
      m.rotation.y = -a * (1 - (isOpening ? openT : 0));
      const s = 1 - Math.min(d * 0.055, 0.28) + (isOpening ? openT * 0.16 : 0);
      m.scale.setScalar(s);

      const u = m.material.uniforms;
      u.uFocus.value = Math.max(0, 1 - d * 0.85);
      u.uVel.value = vel;
      u.uHover.value = hovered === i ? 1 : 0;
      u.uOpen.value = isOpening ? openT : 0;
      // Everything except the project you chose falls away.
      u.uFade.value = opening < 0 ? 1 : (isOpening ? 1 : 1 - openT);
      m.visible = d < 4.5 || isOpening;
    }
    grid.material.opacity = 0.55 * (opening < 0 ? 1 : 1 - openT);
  }

  function size() {
    const w = canvas.clientWidth || 900, h = canvas.clientHeight || 460;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      dirty = true;
    }
  }

  /* ── input ─────────────────────────────────────────────────────── */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  function hit(ev) {
    const r = canvas.getBoundingClientRect();
    ndc.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects(planes.filter(p => p && p.visible), false)[0];
    return h ? h.object.userData.index : -1;
  }

  let dragging = false, dragX = 0, moved = 0;

  canvas.addEventListener('pointerdown', ev => {
    if (opening >= 0) return;
    dragging = true; moved = 0; dragX = ev.clientX;
    canvas.setPointerCapture(ev.pointerId);
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointermove', ev => {
    if (opening >= 0) return;
    if (dragging) {
      const dx = ev.clientX - dragX;
      dragX = ev.clientX;
      moved += Math.abs(dx);
      target = clamp(target - dx / 190);
      kick();
    } else {
      const i = hit(ev);
      if (i !== hovered) { hovered = i; dirty = true; kick(); }
      canvas.style.cursor = i >= 0 ? 'pointer' : 'grab';
    }
  }, { passive: true });

  const endDrag = ev => {
    if (!dragging) return;
    dragging = false;
    try { canvas.releasePointerCapture(ev.pointerId); } catch {}
    canvas.style.cursor = 'grab';
    if (moved < 6) {
      const i = hit(ev);
      if (i >= 0) (Math.abs(i - target) < 0.5 ? travelInto : onFocus)(i);
    } else {
      target = clamp(Math.round(target));
      kick();
    }
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  canvas.addEventListener('wheel', ev => {
    if (opening >= 0) return;
    const d = Math.abs(ev.deltaX) > Math.abs(ev.deltaY) ? ev.deltaX : ev.deltaY;
    const next = target + d / 420;
    if (next < -0.02 || next > items.length - 0.98) return;   // let the page scroll on
    ev.preventDefault();
    target = clamp(next);
    kick();
  }, { passive: false });

  /* ── travelling into a project ─────────────────────────────────── */
  function travelInto(i) {
    if (opening >= 0) return;
    opening = i; openT = 0;
    canvas.style.cursor = 'default';
    kick();
  }

  /* ── the loop ──────────────────────────────────────────────────── */
  let lastAt = 0, lastT = performance.now();
  const OPEN_SECONDS = 0.62;
  function frame() {
    raf = 0;
    size();

    // Everything below is driven by elapsed time, not by frame count. Counting
    // frames made the travel twice as fast on a 120Hz screen and nearly
    // instant on a machine rendering at 300fps.
    const now = performance.now();
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;

    if (opening >= 0) {
      openT = Math.min(1, openT + dt / OPEN_SECONDS);
      camera.position.z = CAM_Z - openT * 2.1;
      dirty = true;
      if (openT >= 1) {
        const which = opening;
        opening = -1; openT = 0;
        camera.position.z = CAM_Z;
        layout(shown);
        renderer.render(scene, camera);
        onOpen(which);              // the case study opens as the move lands
        return;
      }
    } else {
      const d = target - shown;
      if (Math.abs(d) > 0.0005) {
        // Exponential follow, frame-rate independent: heavier than a snap, so
        // the carousel carries its own weight.
        shown += d * (1 - Math.exp(-dt * 6.2));
        vel = Math.max(-1, Math.min(1, d * 0.55));
        dirty = true;
      } else if (Math.abs(vel) > 0.0005) {
        shown = target;
        vel *= Math.exp(-dt * 9);
        dirty = true;
      } else vel = 0;
    }

    if (dirty) { layout(shown); renderer.render(scene, camera); dirty = false; }

    const at = Math.round(shown);
    if (at !== lastAt && opening < 0) { lastAt = at; onFocus(at, true); }

    if (running && (opening >= 0 || Math.abs(target - shown) > 0.0005 || Math.abs(vel) > 0.0005)) {
      raf = requestAnimationFrame(frame);
    }
  }
  function kick() { if (running && !raf) raf = requestAnimationFrame(frame); }

  addEventListener('resize', () => { dirty = true; kick(); }, { passive: true });

  layout(0); size(); renderer.render(scene, camera);
  canvas.style.cursor = 'grab';

  return {
    focus(i) { target = clamp(i); kick(); },
    open(i) { travelInto(i); },
    setRunning(v) {
      running = v;
      if (!v && raf) { cancelAnimationFrame(raf); raf = 0; }
      else if (v) kick();
    },
    dispose() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      planes.forEach(m => {
        if (!m) return;
        m.material.uniforms.uTex.value?.dispose();
        m.material.dispose(); m.geometry.dispose();
      });
      grid.geometry.dispose(); grid.material.dispose();
      renderer.dispose();
    },
  };
}
