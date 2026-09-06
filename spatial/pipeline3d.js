// The 3D layer of the project journey.
//
// Stages sit along a path that recedes to either side of the one you are on,
// so the pipeline reads as something you travel rather than a row of boxes.
// It renders only while something is moving — there is no idle animation, no
// rotation, and nothing spins on its own.
//
// three.js is imported here and nowhere else, so it is fetched only when a
// journey actually comes on screen.

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const ACCENT = {
  teal:   { hot: 0x5fe0cc, cool: 0x1d4a48 },
  ochre:  { hot: 0xf0b357, cool: 0x4a3a1d },
  violet: { hot: 0xb49cff, cool: 0x342c52 },
  ember:  { hot: 0xff8a4c, cool: 0x4a2a18 },
};

/** Draws a stage's face to a 2D canvas — crisp text without loading a font into WebGL. */
function faceTexture(THREE, stage, colours, dpr) {
  const W = 512, H = 320;
  const c = document.createElement('canvas');
  c.width = W * dpr; c.height = H * dpr;
  const x = c.getContext('2d');
  x.scale(dpr, dpr);

  const r = 26;
  x.beginPath();
  x.roundRect(2, 2, W - 4, H - 4, r);
  x.fillStyle = 'rgba(16, 22, 30, 0.93)';
  x.fill();
  x.lineWidth = 2;
  x.strokeStyle = 'rgba(255,255,255,0.16)';
  x.stroke();

  // the lit top edge, so the card reads as lit by the same room
  const g = x.createLinearGradient(0, 0, 0, 90);
  g.addColorStop(0, 'rgba(255,255,255,0.16)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.beginPath(); x.roundRect(2, 2, W - 4, 90, [r, r, 0, 0]); x.fillStyle = g; x.fill();

  const hex = '#' + colours.hot.toString(16).padStart(6, '0');

  x.font = '600 26px "Instrument Sans", system-ui, sans-serif';
  x.fillStyle = hex;
  x.fillText(stage.n, 36, 66);

  x.font = '600 22px "Instrument Sans", system-ui, sans-serif';
  x.fillStyle = 'rgba(214,223,234,0.72)';
  x.fillText(stage.k.toUpperCase(), 82, 66);

  x.font = '500 40px "Instrument Sans", system-ui, sans-serif';
  x.fillStyle = 'rgba(255,255,255,0.97)';
  const words = stage.name.split(' ');
  let line = '', y = 150;
  for (const w of words) {
    if (x.measureText(line + w).width > W - 76) { x.fillText(line.trim(), 36, y); line = w + ' '; y += 46; }
    else line += w + ' ';
  }
  x.fillText(line.trim(), 36, y);

  x.font = '600 34px "Instrument Sans", system-ui, sans-serif';
  x.fillStyle = hex;
  x.fillText(stage.stat, 36, H - 52);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export async function createPipelineScene({ canvas, pipe, onPick }) {
  const THREE = await import(/* @vite-ignore */ THREE_URL);

  const colours = ACCENT[pipe.accent] || ACCENT.ember;
  const dpr = Math.min(devicePixelRatio || 1, 2);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 2, 0.1, 100);
  camera.position.set(0, 0.1, 5.3);

  scene.add(new THREE.HemisphereLight(0xbcd2ff, 0x0a0d14, 1.1));
  const key = new THREE.DirectionalLight(0xfff2e6, 1.25);
  key.position.set(3, 5, 6);
  scene.add(key);

  // ── the stages ──
  const GAP = 3.05, DEPTH = 1.5;
  const cards = [];
  const group = new THREE.Group();
  // The focused stage sits left of centre so the road ahead has room to show:
  // centred, the whole left third of the band was empty.
  group.position.x = -1.75;
  scene.add(group);

  pipe.stages.forEach((s, i) => {
    const tex = faceTexture(THREE, s, colours, dpr);
    const geo = new THREE.PlaneGeometry(2.6, 1.62);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.index = i;
    group.add(mesh);
    cards.push(mesh);
  });

  // ── the line that joins them: the pipeline itself ──
  const lineMat = new THREE.LineBasicMaterial({ color: colours.hot, transparent: true, opacity: 0.55 });
  const lineGeo = new THREE.BufferGeometry();
  const linePos = new Float32Array(pipe.stages.length * 3);
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  const line = new THREE.Line(lineGeo, lineMat);
  line.position.x = group.position.x;
  scene.add(line);

  // ── layout: everything is a pure function of the focused index ──
  let focus = 0, shown = 0, running = true, raf = 0, dirty = true;

  function layout(f) {
    for (let i = 0; i < cards.length; i++) {
      const d = i - f;                       // signed distance from the focus
      const a = Math.abs(d);
      const m = cards[i];
      m.position.x = d * GAP;
      m.position.z = -a * DEPTH;
      m.position.y = -a * 0.1;
      m.rotation.y = -d * 0.34;              // cards turn to face the traveller
      m.scale.setScalar(1 - Math.min(a * 0.06, 0.3));
      m.material.opacity = Math.max(0.16, 1 - a * 0.32);
      linePos[i * 3] = m.position.x;
      linePos[i * 3 + 1] = m.position.y - 1.0;
      linePos[i * 3 + 2] = m.position.z;
    }
    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.computeBoundingSphere();
  }

  function size() {
    const w = canvas.clientWidth || 800;
    const h = canvas.clientHeight || 260;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      dirty = true;
    }
  }

  // ── picking ──
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  function pick(ev) {
    const r = canvas.getBoundingClientRect();
    ndc.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(cards, false)[0];
    return hit ? hit.object.userData.index : -1;
  }

  canvas.addEventListener('click', ev => {
    const i = pick(ev);
    if (i >= 0 && i !== focus) onPick(i);
  });
  canvas.addEventListener('pointermove', ev => {
    canvas.style.cursor = pick(ev) >= 0 ? 'pointer' : 'default';
  }, { passive: true });

  // ── the loop: runs only while something is actually moving ──
  function frame() {
    raf = 0;
    size();
    const delta = focus - shown;
    if (Math.abs(delta) > 0.001) {
      shown += delta * 0.16;
      if (Math.abs(focus - shown) <= 0.001) shown = focus;
      dirty = true;
    }
    if (dirty) {
      layout(shown);
      renderer.render(scene, camera);
      dirty = false;
    }
    if (running && (Math.abs(focus - shown) > 0.001)) raf = requestAnimationFrame(frame);
  }
  function kick() { if (running && !raf) raf = requestAnimationFrame(frame); }

  addEventListener('resize', () => { dirty = true; kick(); }, { passive: true });

  layout(0);
  size();
  renderer.render(scene, camera);

  return {
    focus(i) { focus = i; kick(); },
    setRunning(v) {
      running = v;
      if (!v && raf) { cancelAnimationFrame(raf); raf = 0; }
      else if (v) kick();
    },
    dispose() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      cards.forEach(m => { m.material.map.dispose(); m.material.dispose(); m.geometry.dispose(); });
      lineGeo.dispose(); lineMat.dispose();
      renderer.dispose();
    },
  };
}
