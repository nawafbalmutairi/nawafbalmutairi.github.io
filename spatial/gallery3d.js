// The Work gallery, rendered in WebGL.
//
// The projects are textured planes on an arc in the same room the rest of the
// site lives in — the canvas is transparent, so the environment plate behind it
// is the backdrop of the scene rather than a picture behind a widget.
//
// Each plane is bent by a vertex shader: a standing cylindrical curve, plus
// extra curvature and twist proportional to how fast you are moving through the
// gallery. Nothing animates at rest; the loop runs only while something moves.
//
// three.js is imported here and nowhere else on this path, so it is fetched
// only when the gallery is actually reached.

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const HUE = {
  teal:   [0.37, 0.88, 0.80],
  ochre:  [0.94, 0.70, 0.34],
  violet: [0.71, 0.61, 1.00],
  ember:  [1.00, 0.54, 0.30],
};

const VERT = `
uniform float uVel;
uniform float uFocus;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  // A standing curve, so every plane reads as a surface in space rather than
  // a flat card floating in front of one.
  float bend = sin(uv.x * 3.14159265);
  p.z += bend * 0.46;
  // Speed bends it further and twists it — the gallery deforms as it moves.
  p.z += bend * uVel * 1.15;
  p.y += (uv.x - 0.5) * uVel * 0.42;
  p.x -= bend * abs(uVel) * 0.10;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

const FRAG = `
uniform sampler2D uTex;
uniform vec3  uHue;
uniform float uFocus;
uniform float uHover;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(uTex, vUv).rgb;
  // A bright screenshot has to sit in a dim room; focus and hover lift it back.
  c *= 0.56 + uFocus * 0.34 + uHover * 0.16;
  // a lit rim in the project's own hue
  float edge = smoothstep(0.0, 0.028, vUv.x) * smoothstep(1.0, 0.972, vUv.x)
             * smoothstep(0.0, 0.045, vUv.y) * smoothstep(1.0, 0.955, vUv.y);
  c = mix(uHue * (0.32 + uFocus * 0.5), c, edge);
  float v = smoothstep(1.05, 0.32, length(vUv - 0.5));
  c *= 0.72 + 0.28 * v;
  gl_FragColor = vec4(c, 0.94 * (0.5 + uFocus * 0.5));
}`;

/** A card drawn in 2D for items that have no figure of their own. */
function cardTexture(THREE, item, dpr) {
  const W = 900, H = 560;
  const c = document.createElement('canvas');
  c.width = W * dpr; c.height = H * dpr;
  const x = c.getContext('2d');
  x.scale(dpr, dpr);

  const g = x.createLinearGradient(0, 0, W * 0.7, H);
  g.addColorStop(0, '#151b24');
  g.addColorStop(1, '#0d1219');
  x.fillStyle = g; x.fillRect(0, 0, W, H);

  const hue = item.hex || '#ff8a4c';
  x.fillStyle = hue;
  x.fillRect(0, 0, W, 5);

  x.font = '600 22px "Instrument Sans", system-ui, sans-serif';
  x.fillStyle = 'rgba(214,223,234,0.74)';
  x.fillText((item.kicker || '').toUpperCase(), 54, 92);

  x.font = '500 58px "Instrument Sans", system-ui, sans-serif';
  x.fillStyle = 'rgba(255,255,255,0.97)';
  let line = '', y = 190;
  for (const w of item.title.split(' ')) {
    if (x.measureText(line + w).width > W - 108) { x.fillText(line.trim(), 54, y); line = w + ' '; y += 66; }
    else line += w + ' ';
  }
  x.fillText(line.trim(), 54, y);

  if (item.stat) {
    x.font = '600 76px "Instrument Sans", system-ui, sans-serif';
    x.fillStyle = hue;
    x.fillText(item.stat, 54, H - 96);
    x.font = '600 20px "Instrument Sans", system-ui, sans-serif';
    x.fillStyle = 'rgba(214,223,234,0.7)';
    x.fillText((item.statLabel || '').toUpperCase(), 54, H - 58);
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export async function createGallery({ canvas, items, onFocus, onOpen }) {
  const THREE = await import(/* @vite-ignore */ THREE_URL);
  const dpr = Math.min(devicePixelRatio || 1, 2);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 2, 0.1, 120);
  camera.position.set(0, 0, 6.1);

  const R = 11.5;          // radius of the arc the planes stand on
  const STEP = 0.30;       // radians between neighbours
  // The focused plane sits left of centre so the rest of the gallery has room
  // to recede: centred, the whole left half of the stage was empty.
  const OFFSET = 2.5;

  const loader = new THREE.TextureLoader();
  const planes = [];

  items.forEach((item, i) => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, side: THREE.DoubleSide,
      uniforms: {
        uTex:   { value: null },
        uHue:   { value: new THREE.Vector3(...(HUE[item.accent] || HUE.ember)) },
        uVel:   { value: 0 },
        uFocus: { value: i === 0 ? 1 : 0 },
        uHover: { value: 0 },
      },
    });

    if (item.image) {
      loader.load(item.image, tex => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        mat.uniforms.uTex.value = tex;
        dirty = true; kick();
      }, undefined, () => {
        mat.uniforms.uTex.value = cardTexture(THREE, item, dpr);   // figure missing
        dirty = true; kick();
      });
    } else {
      mat.uniforms.uTex.value = cardTexture(THREE, item, dpr);
    }

    const geo = new THREE.PlaneGeometry(4.3, 2.68, 40, 24);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.index = i;
    scene.add(mesh);
    planes.push(mesh);
  });

  let target = 0, shown = 0, vel = 0, running = true, raf = 0, dirty = true;
  let hovered = -1;

  function layout(pos) {
    for (let i = 0; i < planes.length; i++) {
      const a = (i - pos) * STEP;
      const m = planes[i];
      m.position.x = Math.sin(a) * R - OFFSET;
      m.position.z = Math.cos(a) * R - R;
      m.rotation.y = -a;
      const d = Math.abs(i - pos);
      const focus = Math.max(0, 1 - d * 0.85);
      m.material.uniforms.uFocus.value = focus;
      m.material.uniforms.uVel.value = vel;
      m.material.uniforms.uHover.value = hovered === i ? 1 : 0;
      m.visible = d < 4.5;
    }
  }

  function size() {
    const w = canvas.clientWidth || 900, h = canvas.clientHeight || 420;
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
    const h = ray.intersectObjects(planes.filter(p => p.visible), false)[0];
    return h ? h.object.userData.index : -1;
  }

  let dragging = false, dragX = 0, moved = 0;

  canvas.addEventListener('pointerdown', ev => {
    dragging = true; moved = 0; dragX = ev.clientX;
    canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener('pointermove', ev => {
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
    if (moved < 6) {
      const i = hit(ev);
      // A click on the focused plane opens it; on any other, travels to it.
      if (i >= 0) (Math.abs(i - target) < 0.5 ? onOpen : onFocus)(i);
    } else {
      target = clamp(Math.round(target));
      kick();
    }
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  canvas.addEventListener('wheel', ev => {
    const d = Math.abs(ev.deltaX) > Math.abs(ev.deltaY) ? ev.deltaX : ev.deltaY;
    const next = target + d / 420;
    // Only take the wheel while the gallery still has somewhere to go, so the
    // page can still be scrolled from either end of it.
    if (next < -0.02 || next > items.length - 0.98) return;
    ev.preventDefault();
    target = clamp(next);
    kick();
  }, { passive: false });

  const clamp = v => Math.min(Math.max(v, 0), items.length - 1);

  /* ── the loop: only while something moves ──────────────────────── */
  let lastAt = 0;
  function frame() {
    raf = 0;
    size();
    const d = target - shown;
    if (Math.abs(d) > 0.0005) {
      shown += d * 0.11;
      vel = Math.max(-1, Math.min(1, d * 0.55));
      dirty = true;
    } else if (Math.abs(vel) > 0.0005) {
      shown = target; vel *= 0.82; dirty = true;
    } else { vel = 0; }

    if (dirty) { layout(shown); renderer.render(scene, camera); dirty = false; }

    const at = Math.round(shown);
    if (at !== lastAt) { lastAt = at; onFocus(at, true); }

    if (running && (Math.abs(target - shown) > 0.0005 || Math.abs(vel) > 0.0005)) {
      raf = requestAnimationFrame(frame);
    }
  }
  function kick() { if (running && !raf) raf = requestAnimationFrame(frame); }

  addEventListener('resize', () => { dirty = true; kick(); }, { passive: true });

  layout(0); size(); renderer.render(scene, camera);
  canvas.style.cursor = 'grab';

  return {
    focus(i) { target = clamp(i); kick(); },
    setRunning(v) {
      running = v;
      if (!v && raf) { cancelAnimationFrame(raf); raf = 0; }
      else if (v) kick();
    },
    dispose() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      planes.forEach(m => {
        m.material.uniforms.uTex.value?.dispose();
        m.material.dispose(); m.geometry.dispose();
      });
      renderer.dispose();
    },
  };
}
