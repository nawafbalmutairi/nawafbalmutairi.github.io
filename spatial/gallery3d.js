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
  c *= 0.52 + uFocus * 0.44 + uHover * 0.10;
  float edge = smoothstep(0.0, 0.012, vUv.x) * smoothstep(1.0, 0.988, vUv.x)
             * smoothstep(0.0, 0.019, vUv.y) * smoothstep(1.0, 0.981, vUv.y);
  c = mix(uHue * (0.30 + uFocus * 0.45), c, edge);
  float v = smoothstep(1.15, 0.30, length(vUv - 0.5));
  c *= 0.74 + 0.26 * v;
  gl_FragColor = vec4(c, uFade);
}`;

export async function createGallery({ canvas, items, onFocus, onOpen }) {
  const THREE = await import(/* @vite-ignore */ THREE_URL);
  const dpr = Math.min(devicePixelRatio || 1, 2);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  // Depth cue for the floor: the grid dissolves rather than ending at an edge.
  scene.fog = new THREE.Fog(0x090d12, 9, 26);

  // Close, and wide. Distance is what makes the perspective steep, so the
  // camera stays near the drum; the field is what decides how much of the room
  // comes with it. At 46° one panel took three quarters of the frame and was
  // cropped by the stage.
  //
  // 60.7° is not a taste call — it is docs/motion-spec.md §4 solved for our
  // geometry. The reference's cell height is 0.435 × viewport height, confirmed
  // to three decimals at 1280/1440/1920. Our plane is 2.728 world units, so the
  // frame has to be 2.728 / 0.435 = 6.271 units tall, and at a camera distance
  // of 5.35 that is 2·atan(6.271 / (2·5.35)) = 60.7°. At 55° the plane was
  // 0.490 of the frame — 13% oversized against the spec.
  const camera = new THREE.PerspectiveCamera(60.7, 2, 0.1, 120);
  const CAM_Z = 5.35, CAM_Y = 0.05;
  camera.position.set(0, CAM_Y, CAM_Z);

  /* ── the floor: a grid running away under the work ──────────────── */
  // Half-unit cells over a wide floor. The cell size is what sells the depth:
  // at 3.4 units a cell was 600px across and read as a backdrop, not a floor.
  // Fog dissolves the far rows, so the grid ends in air rather than at an edge
  // — and it thins out about a sixth of the way down the frame, which is where
  // a real horizon would sit for an eye 2.1 units above the ground.
  const grid = new THREE.GridHelper(120, 240, 0x44536a, 0x2b3646);
  grid.position.y = -2.05;
  grid.material.transparent = true;
  grid.material.opacity = 0.78;
  grid.material.fog = true;
  scene.add(grid);

  // A drum you stand inside, not an arc you look at from across a room.
  //
  // The radius is barely larger than a panel, so one turn of the drum is about
  // 46° — the neighbour is hard on its edge and steeply foreshortened, and the
  // two panels meet with a few pixels between them instead of floating apart
  // with empty room in between. STEP a shade under the plane's own angular
  // width (PW / R) is what closes that last gap once perspective is applied.
  //
  // The 0.966 is solved, not chosen. docs/motion-spec.md §4 gives the one
  // gap ratio that survives a redesign: gap ÷ cell height = 0.0182–0.0272.
  // Against a cell height of 0.435 × 900 = 391.5px that is a 7.1–10.6px gap at
  // 1440×900. Projecting the neighbour's near edge through the camera puts
  // 0.966 at 9.5px (ratio 0.0243), mid-band. The curve is steep — 0.96 gives
  // 6.5px and 1.00 gives 26px — so this is worth carrying as a solved number
  // rather than an eyeballed one.
  const PW = 4.34, PH = PW * 880 / 1400;
  const R = 5.2;
  const STEP = (PW / R) * 0.966;
  // Left of centre, so the project turning in has the right of the frame.
  //
  // This used to be a bare 0.55 with a comment claiming the rail could never
  // stand on a face. That claim was false the moment the rail went back to its
  // real size: 0.55 was tuned against a 152px transparent rail, and the real
  // one is 212px of glass. Worse, the stage bleeds by calc(var(--gutter-l) * -1)
  // from a box that already starts at --gutter-l, so the two cancel and the
  // drum is centred on the WINDOW at every width — widening the gutter bought
  // exactly zero clearance. Measured overlap: -34px at 1101x820, -38px at
  // 1280x1024. It is aspect-driven, so no single constant fixes it.
  //
  // So it is solved per layout instead, in size(): the focused plane's left
  // edge must clear the rail's right edge by RAIL_GAP. See reoffset().
  const OFFSET = 0.55;          // the composition we want when there is room
  const RAIL_GAP = 26;          // px of daylight between the rail and a face

  const planes = [];
  const group = new THREE.Group();
  group.position.x = -OFFSET;
  // Lifted just clear of the readable strip along the foot of the room, so the
  // face's own bottom line is never hidden behind it.
  group.position.y = 0.22;
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
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH, 44, 26), mat);
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

      const turn = Math.abs(a);

      m.position.x = Math.sin(a) * R;
      m.position.z = Math.cos(a) * R - R + (isOpening ? openT * 3.4 : 0);
      m.position.y = 0;
      m.rotation.y = -a * (1 - (isOpening ? openT : 0));
      // Every panel is the same size on the drum. Shrinking the neighbours as
      // well as turning them made them read as small cards at a distance;
      // perspective alone is what should be doing that work.
      m.scale.setScalar(1 + (isOpening ? openT * 0.16 : 0));

      // A panel leaves by turning past you, not by shrinking into the dark:
      // it holds full strength until it is 54° over and is gone by 74°, before
      // it can present its own back. Three panels are in the room at rest —
      // the one you are at, the one turning away, the one turning in.
      const facing = Math.max(0, Math.min(1, (1.30 - turn) / 0.35));

      const u = m.material.uniforms;
      u.uFocus.value = Math.max(0, 1 - d * 0.55);
      u.uVel.value = vel;
      u.uHover.value = hovered === i ? 1 : 0;
      u.uOpen.value = isOpening ? openT : 0;
      // Everything except the project you chose falls away.
      u.uFade.value = (isOpening ? 1 : facing * (opening < 0 ? 1 : 1 - openT));
      m.visible = (facing > 0.004) || isOpening;
    }
    grid.material.opacity = 0.78 * (opening < 0 ? 1 : 1 - openT);
  }

  // The rail is a solid object standing in the same window the drum is centred
  // on, so how far left the drum may sit depends on where the rail actually
  // ends — which changes with viewport width (it is a clamp()) and with aspect
  // ratio (which decides how many pixels a world unit is worth). Reading the
  // real rect beats hardcoding either.
  const railEl = () => document.querySelector('.rail');
  function reoffset() {
    let off = OFFSET;
    const r = railEl()?.getBoundingClientRect();
    const c = canvas.getBoundingClientRect();
    if (r && r.width > 0 && c.width > 0 && c.height > 0) {
      const visH = 2 * Math.tan(camera.fov * Math.PI / 360) * CAM_Z;
      const k = c.width / (visH * (c.width / c.height));   // px per world unit
      // panelLeft = c.x + c.width/2 + (-off - PW/2) * k  >=  r.right + RAIL_GAP
      const max = (c.x + c.width / 2 - (PW / 2) * k - (r.right + RAIL_GAP)) / k;
      off = Math.max(-0.5, Math.min(OFFSET, max));
    }
    if (Math.abs(-off - group.position.x) > 0.001) {
      group.position.x = -off;
      dirty = true;
    }
    // Exposed so the collision test can measure the offset actually in force
    // rather than assume the constant.
    window.__galOffset = off;
  }

  function size() {
    const w = canvas.clientWidth || 900, h = canvas.clientHeight || 460;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // Only here, not every frame: this reads layout, and the rail's edge can
      // only move when the viewport does.
      reoffset();
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

  // Scrolling advances the drum one project at a time. A continuous mapping
  // let you sit halfway between two projects looking at neither; a step lands
  // you on one, and the follow below is what makes the step a move rather than
  // a cut. Trackpad inertia arrives as a long tail of small deltas, so a step
  // closes the gate until the wheel has been quiet for a moment.
  let acc = 0, gate = 0;
  // 96px so one notch of a discrete mouse wheel (100–120px) is one project,
  // while a trackpad's opening few pixels still are not.
  const STEP_PX = 96, QUIET_MS = 280;

  canvas.addEventListener('wheel', ev => {
    if (opening >= 0) return;
    const d = Math.abs(ev.deltaX) > Math.abs(ev.deltaY) ? ev.deltaX : ev.deltaY;
    const at = Math.round(target);
    const dir = Math.sign(d);
    // At either end the gallery has nowhere to go, so the event belongs to the
    // page and the room scrolls on to the next destination.
    if ((at <= 0 && dir < 0) || (at >= items.length - 1 && dir > 0)) { acc = 0; return; }
    ev.preventDefault();

    const now = performance.now();
    if (now < gate) return;               // still riding out the last flick
    if (Math.sign(acc) !== dir) acc = 0;  // a reversal starts its own gesture
    acc += d;
    if (Math.abs(acc) < STEP_PX) return;

    acc = 0;
    gate = now + QUIET_MS;
    target = clamp(at + dir);
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
        shown += d * (1 - Math.exp(-dt * 5.0));
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

  layout(0); size(); reoffset(); layout(shown); renderer.render(scene, camera);
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
