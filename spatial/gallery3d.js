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

/** The project's NAME, drawn white on transparent, to hang under its panel.
 *
 *  Separate from the face texture on purpose: the face already carries the
 *  project's HEADLINE at its top-left ("Four models, five parameters..."),
 *  which is a different thing from its name. The reference labels each panel
 *  with the name and nothing else, so that is what this draws. Keeping it off
 *  the face also means it can never collide with a composition. */
const LABEL_FONT = '"Instrument Sans", system-ui, -apple-system, sans-serif';
const LABEL_PX = 56;

/** A small circled arrow, drawn to hang at a panel's edge.
 *
 *  Purely indicative: it points and guides, it is not a control. It lives
 *  inside the canvas, which is aria-hidden, so it is invisible to assistive
 *  tech and unreachable by keyboard by construction — which is exactly what a
 *  decoration should be. Moving between projects is the wheel, a drag, the
 *  arrow keys, or the project list. */
function arrowCanvas(dir, dpr) {
  const S = 68;
  const c = document.createElement('canvas');
  c.width = c.height = Math.round(S * dpr);
  const x = c.getContext('2d');
  x.scale(dpr, dpr);
  x.strokeStyle = 'rgba(255,255,255,0.42)';
  x.lineWidth = 1.4;
  x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 3, 0, 7); x.stroke();
  x.strokeStyle = 'rgba(255,255,255,0.86)';
  x.lineWidth = 1.8;
  x.lineCap = 'round'; x.lineJoin = 'round';
  const m = S / 2, r = 9 * dir;
  x.beginPath();
  x.moveTo(m - r, m); x.lineTo(m + r, m);
  x.moveTo(m + r - 6 * dir, m - 6); x.lineTo(m + r, m); x.lineTo(m + r - 6 * dir, m + 6);
  x.stroke();
  return { canvas: c, s: S };
}

function labelCanvas(text, dpr) {
  const c = document.createElement('canvas');
  const probe = c.getContext('2d');
  probe.font = `500 ${LABEL_PX}px ${LABEL_FONT}`;
  const pad = 10;
  const w = Math.ceil(probe.measureText(text).width) + pad * 2;
  const h = Math.ceil(LABEL_PX * 1.42);
  c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
  const x = c.getContext('2d');
  x.scale(dpr, dpr);
  x.font = `500 ${LABEL_PX}px ${LABEL_FONT}`;
  x.textBaseline = 'middle';
  // A soft drop so the name holds over a light artefact as well as a dark one.
  x.shadowColor = 'rgba(0,0,0,0.55)'; x.shadowBlur = 14; x.shadowOffsetY = 2;
  x.fillStyle = 'rgba(255,255,255,0.97)';
  x.fillText(text, pad, h / 2);
  return { canvas: c, w, h };
}

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
uniform vec2  uPan;
uniform float uZoom;
uniform sampler2D uTex;
uniform vec3  uHue;
uniform float uFocus;
uniform float uHover;
uniform float uFade;
varying vec2 vUv;
void main() {
  // Ken Burns. The reference's panels are never still because each one plays a
  // looping video of the project; we have no video and no honest way to make
  // one, so the face is sampled through a window that slowly pans and breathes
  // instead. uZoom > 1 leaves margin so the pan can never expose an edge.
  vec2 uv = (vUv - 0.5) / uZoom + 0.5 + uPan;
  vec3 c = texture2D(uTex, uv).rgb;
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
  // Re-solved when the plane went 4:3. docs/motion-spec.md §4 measures the
  // reference's cell at 0.435 × viewport height, confirmed to three decimals at
  // 1280/1440/1920. Our plane is now 3.255 world units tall (was 2.728), so the
  // frame has to be 3.255 / 0.435 = 7.483 units and at a camera distance of
  // 5.35 that is 2·atan(7.483 / (2·5.35)) = 69.9°. Wide, deliberately: it is
  // what puts the floor across the bottom third the way the reference does.
  const camera = new THREE.PerspectiveCamera(69.9, 2, 0.1, 120);
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
  const PW = 4.34, PH = PW * 3 / 4;   // 4:3, per docs/work-redesign-plan.md
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
  const labels = [];
  const arrows = [];
  const group = new THREE.Group();
  group.position.x = -OFFSET;
  // Lifted just clear of the readable strip along the foot of the room, so the
  // face's own bottom line is never hidden behind it.
  group.position.y = 0.22;
  scene.add(group);

  // Three projects lead with a real artefact, so those three images are waited
  // for. A failed load is not fatal: that project falls back to its drawn
  // composition, which is what every other project uses anyway.
  const art = await Promise.all(items.map(it => new Promise(res => {
    if (!it.art) return res(null);
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = it.art;
  })));

  items.forEach((item, i) => {
    const face = drawFace(item, art[i], dpr);
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
        uPan: { value: new THREE.Vector2(0, 0) }, uZoom: { value: 1.03 },
      },
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH, 44, 26), mat);
    mesh.userData.index = i;
    mesh.renderOrder = 2;
    group.add(mesh);
    planes[i] = mesh;

    // The name hangs just under the panel's lower-left corner and is parented
    // to the panel, so it turns with the drum instead of floating in screen
    // space. One face pixel is PW / 1400 world units, which is what keeps the
    // label the same optical size as type drawn onto the face.
    const lab = labelCanvas(item.short || item.title, dpr);
    const ltex = new THREE.CanvasTexture(lab.canvas);
    ltex.colorSpace = THREE.SRGBColorSpace;
    ltex.anisotropy = 4;
    const U = PW / 1400;
    const lw = lab.w * U, lh = lab.h * U;
    const lmesh = new THREE.Mesh(
      new THREE.PlaneGeometry(lw, lh),
      new THREE.MeshBasicMaterial({ map: ltex, transparent: true, depthWrite: false }));
    lmesh.position.set(-PW / 2 + lw / 2 + U * 26, -PH / 2 - lh * 0.62, 0.02);
    lmesh.renderOrder = 3;
    mesh.add(lmesh);
    labels[i] = lmesh;

    // one guide at each edge, pointing the way the drum turns
    arrows[i] = [-1, 1].map(dir => {
      const a = arrowCanvas(dir, dpr);
      const t = new THREE.CanvasTexture(a.canvas);
      t.colorSpace = THREE.SRGBColorSpace;
      const size = a.s * U;
      const am = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
      am.position.set(dir * (PW / 2 - size * 0.78), -PH / 2 + size * 1.05, 0.02);
      am.renderOrder = 3;
      mesh.add(am);
      return am;
    });
  });

  // Every panel drifts, all the time, not only the one you are pointing at —
  // which is what the reference actually does, once you park the cursor away
  // from it and watch. Each gets its own phase so the wall never moves in
  // lockstep. Off entirely under reduced motion, where it would be exactly the
  // kind of unrequested perpetual movement that setting exists to stop.
  const DRIFT = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Budgeted against the face's own margin, not picked by eye. The
  // compositions are drawn with PAD = 74 of 1400, so content starts 5.29% in.
  // A zoom of Z crops (1 - 1/Z)/2 per side, so at the top of the breath
  // (1.055) that is 2.61%, plus 1.0% of pan = 3.6% — clear of 5.29% with room
  // to spare. At 1.075 + 2.0% it was 5.49% and it was slicing the headline
  // figure off the bottom-left of every face.
  const PAN_X = 0.010, PAN_Y = 0.008;
  const ZOOM_MID = 1.030, ZOOM_SWING = 0.025;   // breathes 1.005 … 1.055
  const phase = items.map((_, i) => i * 2.399963);   // golden angle, in radians

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
      if (DRIFT) {
        const t = clock + phase[i];
        u.uPan.value.set(Math.sin(t * 0.11) * PAN_X, Math.cos(t * 0.083) * PAN_Y);
        u.uZoom.value = ZOOM_MID + Math.sin(t * 0.067) * ZOOM_SWING;
        if (i === Math.round(shown)) {
          // exposed so the drift can be measured rather than eyeballed
          const z = u.uZoom.value, pan = u.uPan.value;
          window.__galDbg = {
            zoom: +z.toFixed(4),
            panX: +pan.x.toFixed(4), panY: +pan.y.toFixed(4),
            cropPct: +(((1 - 1 / z) / 2 + Math.max(Math.abs(pan.x), Math.abs(pan.y))) * 100).toFixed(2),
            padPct: +(74 / 1400 * 100).toFixed(2),
          };
        }
      }
      u.uFocus.value = Math.max(0, 1 - d * 0.55);
      u.uVel.value = vel;
      u.uHover.value = hovered === i ? 1 : 0;
      u.uOpen.value = isOpening ? openT : 0;
      // Everything except the project you chose falls away.
      u.uFade.value = (isOpening ? 1 : facing * (opening < 0 ? 1 : 1 - openT));
      m.visible = (facing > 0.004) || isOpening;

      const lab = labels[i];
      if (lab) {
        // The name reads only for the project you are actually at; the ones
        // turning away would otherwise stack up into a row of floating words.
        lab.material.opacity = u.uFade.value * Math.max(0, 1 - d * 1.6);
        lab.visible = lab.material.opacity > 0.01;
      }

      const pair = arrows[i];
      if (pair) {
        // Only on the project you are at, and only towards a project that
        // exists — a guide pointing at the end of the drum is a lie.
        const near = Math.max(0, 1 - d * 2.4) * u.uFade.value;
        pair[0].material.opacity = i > 0 ? near : 0;
        pair[1].material.opacity = i < items.length - 1 ? near : 0;
        pair[0].visible = pair[0].material.opacity > 0.01;
        pair[1].visible = pair[1].material.opacity > 0.01;
      }
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
  let lastAt = 0, lastT = performance.now(), clock = 0;
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
    clock += dt;
    if (DRIFT) dirty = true;

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

    // With drift on, the room is never at rest while it is on screen — but the
    // IntersectionObserver still parks the whole loop the moment you travel to
    // another destination, so nothing renders for a section you cannot see.
    if (running && (DRIFT || opening >= 0
        || Math.abs(target - shown) > 0.0005 || Math.abs(vel) > 0.0005)) {
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
      labels.forEach(l => {
        if (!l) return;
        l.material.map?.dispose(); l.material.dispose(); l.geometry.dispose();
      });
      arrows.flat().forEach(a => {
        if (!a) return;
        a.material.map?.dispose(); a.material.dispose(); a.geometry.dispose();
      });
      grid.geometry.dispose(); grid.material.dispose();
      renderer.dispose();
    },
  };
}
