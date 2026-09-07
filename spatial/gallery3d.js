// Full-width project ribbon. Each project has its own designed composition.
// GPU deformation keeps animation light; a matching proxy is updated only for picking.
import { drawGalleryFace } from './galleryfaces.js';

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const VERT = `
uniform float uCenter;
uniform float uVel;
uniform float uOpen;
uniform float uLift;
uniform float uExpand;
uniform vec2 uSize;
uniform float uHalfWidth;
uniform float uHover;
varying vec2 vUv;
varying float vDepth;
void main() {
  vUv = uv;
  vec3 p = vec3(position.xy * uSize, 0.0);
  p.x += uCenter;
  float across = p.x / uHalfWidth;
  float q = across * 1.15 - 0.2;
  float envelope = exp(-q*q);
  float wave = sin(3.14159265*q)*envelope;
  float slope = (3.14159265*cos(3.14159265*q)-2.0*q*sin(3.14159265*q))*envelope;
  float speed = abs(uVel);
  float roll = (-0.16*slope/3.14159265 + 1.8*speed*smoothstep(0.3,0.9,abs(across))*sign(across))*(1.0-uOpen);
  float bankY = p.y;
  p.y = bankY*cos(roll);
  float ramp = clamp(across,-1.0,1.0);
  ramp = ramp*(1.5-0.5*ramp*ramp);
  float rear = (1.0-smoothstep(-1.0,0.3,across))*speed;
  float depth = -uHalfWidth*0.2*(1.0+1.1*speed)*wave;
  p.z = bankY*sin(roll) + (depth-uHalfWidth*0.12*ramp+uHalfWidth*0.2*rear)*(1.0-uOpen);
  p.y += (0.03*p.x+uHalfWidth*0.1*rear)*(1.0-uOpen);
  vec2 dome = 1.0-pow(uv*2.0-1.0,vec2(2.0));
  p.z -= dome.x*dome.y*uHover*uSize.y*0.07*(1.0-uOpen);
  vDepth = clamp((uHalfWidth*0.2-depth)/(uHalfWidth*0.4),0.0,1.0)*(1.0-uOpen);
  vec4 clip = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  vec2 expanded = (uv - 0.5) * vec2(1.868, 1.904);
  clip.xy = mix(clip.xy, expanded * clip.w, uExpand);
  gl_Position = clip;
}`;
const FRAG = `
uniform sampler2D uTex;
uniform float uFocus;
uniform float uHover;
uniform float uFade;
uniform float uOpen;
uniform vec2 uSize;
varying vec2 vUv;
varying float vDepth;
void main() {
  float ratio = uSize.y / uSize.x;
  vec2 p = abs((vUv - 0.5) * vec2(1.0, ratio)) - vec2(0.465, ratio*0.5-0.035);
  float d = length(max(p, 0.0)) + min(max(p.x, p.y), 0.0) - 0.035;
  float alpha = (1.0 - smoothstep(-0.0015, 0.0015, d)) * uFade;
  if (alpha < 0.01) discard;
  vec3 c = texture2D(uTex, vUv).rgb * (1.0-vDepth*0.28);
  c = mix(c, vec3(1.0), smoothstep(0.15, 0.9, uOpen));
  gl_FragColor = vec4(c, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;


export async function createGallery({ canvas, items, onFocus, onOpen }) {
  const THREE = await import(/* @vite-ignore */ THREE_URL);
  const dpr = Math.min(devicePixelRatio || 1, 2);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  // Depth cue for the floor: the grid dissolves rather than ending at an edge.
  scene.fog = new THREE.Fog(0x000000, 8, 28);

  // Match the reference ribbon height against the full viewport.
  const camera = new THREE.PerspectiveCamera(53.4, 2, 0.1, 120);
  const CAM_Z = 6.5, CAM_Y = 0;
  camera.position.set(0, CAM_Y, CAM_Z);

  /* ── the floor: a grid running away under the work ──────────────── */
  const grid = new THREE.GridHelper(100, 100, 0x282727, 0x282727);
  grid.position.y = -2.08;
  grid.rotation.y = 0.13;
  grid.material.transparent = true;
  grid.material.opacity = 0.65;
  grid.material.fog = true;
  scene.add(grid);

  const aspects = {matrix:1.6,kpis:1.78,versus:1.33,blueprint:1.7,analytics:1.6,register:1.45,screens:1.33,dials:1.78,commits:1.65};
  let PH = 3, halfWidth = 6, trackLength = 0;
  let centers = [], widths = [], gap = 0.08;
  const planes = [];
  const group = new THREE.Group();
  group.position.x = 0;
  group.position.y = 0;
  scene.add(group);

  await document.fonts.ready;

  function paint(item, time = 0, existing = null) {
    const face = drawGalleryFace(item, 1, time, existing);
    const x = face.getContext('2d'), w = face.width, h = face.height;
    x.resetTransform();
    x.textAlign = 'left';
    const shade = x.createLinearGradient(0, h * 0.68, 0, h);
    shade.addColorStop(0, 'rgba(0,0,0,0)'); shade.addColorStop(1, 'rgba(0,0,0,0.78)');
    x.fillStyle = shade; x.fillRect(0, h * 0.68, w, h * 0.32);
    x.font = '500 ' + (w * 0.035) + 'px "Instrument Sans", sans-serif';
    x.fillStyle = '#fff'; x.textBaseline = 'middle';
    x.fillText(item.short || item.title, w * 0.04, h * 0.944, w * 0.78);
    const ax = w * 0.942, ay = h * 0.938;
    x.fillStyle = '#050505'; x.beginPath(); x.arc(ax, ay, w * 0.027, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = (w * 0.021) + 'px sans-serif'; x.fillText('↗', ax, ay);
    return face;
  }
  items.forEach((item, i) => {
    const face = paint(item);
    const tex = new THREE.CanvasTexture(face);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, side: THREE.DoubleSide, depthWrite: false,
      uniforms: {
        uTex:   { value: tex },
        uVel:   { value: 0 }, uFocus: { value: i === 0 ? 1 : 0 },
        uHover: { value: 0 }, uFade: { value: 1 }, uOpen: { value: 0 },
        uCenter: { value: 0 }, uLift: { value: 0 },
        uExpand: { value: 0 },
        uSize: { value: new THREE.Vector2(1,1) }, uHalfWidth: { value: 6 },
      },
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 80, 12), mat);
    mesh.userData.index = i;
    mesh.frustumCulled = false; // The shader moves vertices beyond the base bounds.
    mesh.renderOrder = 2;
    group.add(mesh);
    planes[i] = mesh;


  });

  let target = 0, shown = 0, vel = 0, hovered = -1;
  let coast = 0, pointerTime = 0;
  let running = true, raf = 0, dirty = true;
  let opening = -1, openT = 0;
  let closing = false, delivered = false;
  let transitionStart = 0, closeFrom = 1;
  let elapsed = 0, lastPaint = -1;
  const animated = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sceneElement = canvas.closest('.scene');
  const isVisible = () => !document.hidden && (!sceneElement || sceneElement.hasAttribute('data-active'));

  const wrap = v => (v % items.length + items.length) % items.length;
  const relative = v => v - Math.round(v / items.length) * items.length;
  function scrollPosition(pos) {
    const whole = Math.floor(pos), i = wrap(whole), cycle = Math.floor(whole/items.length);
    const next = i === items.length-1 ? centers[0]+trackLength : centers[i+1];
    return centers[i]+cycle*trackLength+(next-centers[i])*(pos-whole);
  }
  // Convert actual travel back into project coordinates, including unequal widths.
  function shiftPixels(pos, pixels) {
    let distance = scrollPosition(pos) + pixels * (2 * halfWidth / canvas.clientWidth);
    const cycle = Math.floor((distance-centers[0])/trackLength);
    distance -= cycle*trackLength;
    let i = centers.length-1;
    for (let j=0;j<centers.length-1;j++) {
      if (distance < centers[j+1]) { i=j; break; }
    }
    const end = i===centers.length-1 ? centers[0]+trackLength : centers[i+1];
    return cycle*items.length+i+(distance-centers[i])/(end-centers[i]);
  }

  function layout(pos, dt = 1) {
    for (let i = 0; i < planes.length; i++) {
      const m = planes[i];
      if (!m) continue;
      const distance = relative(i - pos);
      const d = Math.abs(distance);
      const isOpening = i === opening;
      let center = centers[i]-scrollPosition(pos);
      center -= Math.round(center/trackLength)*trackLength;
      center -= halfWidth*0.08;
      const facing = d < 2.6 ? 1 : 0;
      const u = m.material.uniforms;
      u.uSize.value.set(widths[i],PH);
      u.uHalfWidth.value = halfWidth;
      u.uFocus.value = Math.max(0, 1 - d * 0.55);
      u.uVel.value = vel;
      u.uHover.value += ((hovered === i ? 1 : 0) - u.uHover.value) * (1 - Math.exp(-dt * 12));
      const easedOpen = openT * openT * (3 - 2 * openT);
      u.uOpen.value = isOpening ? easedOpen : 0;
      u.uExpand.value = isOpening ? easedOpen : 0;
      u.uCenter.value = center;
      u.uLift.value = 0;
      // Everything except the project you chose falls away.
      u.uFade.value = isOpening ? 1 : facing * (1 - openT * 0.7);
      m.renderOrder = isOpening ? 3 : 2;
      m.visible = (facing > 0.004) || isOpening;

    }
    grid.material.opacity = 0.65 * (opening < 0 ? 1 : 1 - openT);
  }


  function size() {
    const w = canvas.clientWidth || 900, h = canvas.clientHeight || 460;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const worldHeight = 2*Math.tan(camera.fov*Math.PI/360)*CAM_Z;
      halfWidth = worldHeight*w/h/2;
      const root = Math.max(5,w/150);
      PH = Math.min(h*0.435,55*root)*worldHeight/h;
      gap = root*worldHeight/h;
      widths = items.map(it=>PH*(aspects[it.face]||1.6));
      let offset = 0;
      centers = widths.map(width=>{ const center=offset+width/2; offset+=width+gap; return center; });
      trackLength = offset;
      grid.position.y = -PH/2-worldHeight*0.06;
      dirty = true;
    }
  }

  /* ── input ─────────────────────────────────────────────────────── */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pickGeometry = new THREE.PlaneGeometry(1, 1, 80, 12);
  const pickOriginal = pickGeometry.attributes.position.array.slice();
  const pickMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const pickMesh = new THREE.Mesh(pickGeometry, pickMaterial);
  pickMesh.position.y = group.position.y;
  pickMesh.updateMatrixWorld();

  function hit(ev) {
    const r = canvas.getBoundingClientRect();
    ndc.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    let h = null, index = -1;
    // Mirror the vertex shader on one reusable mesh, only when the pointer
    // needs a hit. The animation itself never uploads vertex buffers.
    for (const plane of planes) {
      if (!plane.visible) continue;
      const u = plane.material.uniforms;
      const p = pickGeometry.attributes.position;
      for (let v = 0; v < p.count; v++) {
        const x = pickOriginal[v * 3]*u.uSize.value.x + u.uCenter.value;
        const y = pickOriginal[v*3+1]*u.uSize.value.y;
        const flatten = 1 - u.uOpen.value;
        const a=x/halfWidth,q=a*1.15-0.2,e=Math.exp(-q*q),sin=Math.sin(Math.PI*q);
        const smooth=(l,r,z)=>{const t=Math.max(0,Math.min(1,(z-l)/(r-l)));return t*t*(3-2*t);};
        const speed=Math.abs(u.uVel.value);
        const roll=(-0.16*(Math.PI*Math.cos(Math.PI*q)-2*q*sin)*e/Math.PI+1.8*speed*smooth(0.3,0.9,Math.abs(a))*Math.sign(a))*flatten;
        const r=Math.max(-1,Math.min(1,a)),ramp=r*(1.5-0.5*r*r);
        const rear=(1-smooth(-1,0.3,a))*speed;
        const dent=(1-4*pickOriginal[v*3]**2)*(1-4*pickOriginal[v*3+1]**2)*u.uHover.value*u.uSize.value.y*0.07*flatten;
        p.setXYZ(v,x,y*Math.cos(roll)+(0.03*x+halfWidth*0.1*rear)*flatten,
          y*Math.sin(roll)+(-halfWidth*0.2*(1+1.1*speed)*sin*e-halfWidth*0.12*ramp+halfWidth*0.2*rear)*flatten-dent);
      }
      pickGeometry.computeBoundingSphere();
      const candidate = ray.intersectObject(pickMesh, false)[0];
      if (candidate && (!h || candidate.distance < h.distance)) { h = candidate; index = plane.userData.index; }
    }
    if (!h) return -1;
    const px = Math.abs(h.uv.x - 0.5) - 0.465;
    const ratio = PH/widths[index];
    const py = Math.abs(h.uv.y - 0.5)*ratio-(ratio*0.5-0.035);
    const corner = Math.hypot(Math.max(px, 0), Math.max(py, 0)) + Math.min(Math.max(px, py), 0);
    return corner <= 0.035 ? index : -1;
  }

  let dragging = false, dragX = 0, moved = 0;
  const events = new AbortController();
  const listen = (type, handler, options = {}) =>
    canvas.addEventListener(type, handler, { ...options, signal: events.signal });

  listen('pointerdown', ev => {
    if (opening >= 0 || ev.button !== 0) return;
    dragging = true; moved = 0; dragX = ev.clientX;
    coast = 0; pointerTime = performance.now();
    canvas.setPointerCapture(ev.pointerId);
    canvas.style.cursor = 'grabbing';
  });
  listen('pointermove', ev => {
    if (opening >= 0) return;
    if (dragging) {
      const dx = ev.clientX - dragX;
      dragX = ev.clientX;
      moved += Math.abs(dx);
      const now = performance.now();
      const elapsed = Math.max((now - pointerTime) / 1000, 0.008);
      const shift = shiftPixels(target, -dx) - target;
      target += shift;
      coast += (Math.max(-5, Math.min(5, shift / elapsed)) - coast) * (1 - Math.exp(-elapsed * 22));
      pointerTime = now;
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
      if (i >= 0) travelInto(i);
    } else {
      if (performance.now() - pointerTime > 100) coast = 0;
      kick();
    }
  };
  listen('pointerup', endDrag);
  listen('pointercancel', () => { dragging = false; coast = 0; kick(); });
  listen('pointerleave', () => { hovered = -1; dirty = true; kick(); });

  // Preserve every trackpad delta, including its native inertial tail.
  listen('wheel', ev => {
    if (opening >= 0) return;
    const unit = ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? canvas.clientHeight : 1;
    const d = (Math.abs(ev.deltaX) > Math.abs(ev.deltaY) ? ev.deltaX : ev.deltaY) * unit;
    ev.preventDefault();
    coast = 0;
    target = shiftPixels(target, d);
    kick();
  }, { passive: false });

  /* ── travelling into a project ─────────────────────────────────── */
  function travelInto(i) {
    if (opening >= 0) return;
    coast = 0;
    target = shown;
    opening = i; openT = 0;
    closing = false; delivered = false;
    transitionStart = performance.now();
    document.documentElement.dataset.galleryOpening = '';
    canvas.style.cursor = 'default';
    kick();
  }

  /* ── the loop ──────────────────────────────────────────────────── */
  let lastAt = 0, lastT = performance.now();
  const OPEN_SECONDS = 1;
  function frame() {
    raf = 0;
    size();

    // Everything below is driven by elapsed time, not by frame count. Counting
    // frames made the travel twice as fast on a 120Hz screen and nearly
    // instant on a machine rendering at 300fps.
    const now = performance.now();
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    elapsed += dt;

    if (opening >= 0) {
      const progress = (now - transitionStart) / (OPEN_SECONDS * 1000);
      openT = closing ? Math.max(0, closeFrom - progress) : Math.min(1, progress);
      dirty = true;
      if (!closing && !delivered && openT >= 0.55) {
        delivered = true;
        onOpen(opening); // Crossfade the project page over the expanding surface.
      }
      if (closing && openT <= 0) {
        opening = -1; closing = false; delivered = false;
        delete document.documentElement.dataset.galleryOpening;
      }
    } else {
      if (!dragging && Math.abs(coast) > 0.001) {
        const decay = Math.exp(-dt * 5.5);
        target += coast * (1 - decay) / 5.5;
        coast *= decay;
      }
      const d = target - shown;
      if (Math.abs(d) > 0.00001) {
        // Exponential follow, frame-rate independent: heavier than a snap, so
        // the carousel carries its own weight.
        const before = shown;
        shown += d * (1 - Math.exp(-dt * (dragging ? 15 : 7)));
        const speed = (scrollPosition(shown)-scrollPosition(before)) / Math.max(dt, 0.001) * canvas.clientWidth/(2*halfWidth);
        const response = Math.tanh(speed/550);
        vel += (response*Math.abs(response) - vel) * (1 - Math.exp(-dt * 9));
        dirty = true;
      } else if (Math.abs(vel) > 0.0005) {
        shown = target;
        vel *= Math.exp(-dt * 9);
        dirty = true;
      } else vel = 0;
    }

    const hoverMoving = planes.some(p => Math.abs(p.material.uniforms.uHover.value - (hovered === p.userData.index ? 1 : 0)) > 0.001);
    if (animated && isVisible() && opening < 0 && elapsed - lastPaint >= 1 / 24) {
      lastPaint = elapsed;
      for (const mesh of planes) {
        if (!mesh.visible) continue;
        const texture = mesh.material.uniforms.uTex.value;
        paint(items[mesh.userData.index], elapsed + mesh.userData.index * 0.7, texture.image);
        texture.needsUpdate = true;
      }
      dirty = true;
    }
    if (dirty || hoverMoving) { layout(shown, dt); renderer.render(scene, camera); dirty = false; }

    const at = wrap(Math.round(shown));
    if (at !== lastAt && opening < 0) { lastAt = at; onFocus(at, true); }

    if (running && isVisible() && !(delivered && !closing && openT === 1) && (animated || opening >= 0 || hoverMoving || Math.abs(coast) > 0.001
        || Math.abs(target - shown) > 0.00001 || Math.abs(vel) > 0.0005)) {
      raf = requestAnimationFrame(frame);
    }
  }
  function kick() { if (running && !raf) { lastT = performance.now(); raf = requestAnimationFrame(frame); } }

  addEventListener('resize', () => { dirty = true; kick(); }, { passive: true, signal: events.signal });
  addEventListener('study:close', () => {
    if (opening < 0) return;
    closeFrom = openT; transitionStart = performance.now(); closing = true; kick();
  }, { signal: events.signal });
  document.addEventListener('visibilitychange', () => { if (isVisible()) kick(); }, { signal: events.signal });
  const visibility = new MutationObserver(() => { if (isVisible()) kick(); });
  if (sceneElement) visibility.observe(sceneElement, { attributes: true, attributeFilter: ['data-active'] });

  size(); layout(shown); renderer.render(scene, camera);
  canvas.style.cursor = 'grab';

  return {
    focus(i) { coast = 0; target = shown + relative(i - shown); kick(); },
    open(i) { travelInto(i); },
    setRunning(v) {
      running = v;
      if (!v && raf) { cancelAnimationFrame(raf); raf = 0; }
      else if (v) kick();
    },
    dispose() {
      running = false;
      events.abort();
      visibility.disconnect();
      if (raf) cancelAnimationFrame(raf);
      planes.forEach(m => {
        if (!m) return;
        m.material.uniforms.uTex.value?.dispose();
        m.material.dispose(); m.geometry.dispose();
      });
      grid.geometry.dispose(); grid.material.dispose();
      pickGeometry.dispose(); pickMaterial.dispose();
      renderer.dispose();
    },
  };
}
