// Figures as WebGL surfaces, in place.
//
// Each figure stays exactly where the prose explains it. One shared canvas is
// fixed over the page and each figure gets a plane that tracks its own <img>'s
// position on screen — the standard way to put WebGL over a document without
// giving every image its own context. Four figures cost one context, not four.
//
// The image underneath is never touched: same markup, same alt text, same
// layout, same click target. The canvas draws over it, so if anything here
// fails the figure is simply the figure.
//
// The plane carries a standing curve and bends further with scroll velocity,
// so a figure reacts as you travel past it. Nothing animates at rest.

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const HUE = {
  teal:   [0.37, 0.88, 0.80],
  ochre:  [0.94, 0.70, 0.34],
  violet: [0.71, 0.61, 1.00],
  ember:  [1.00, 0.54, 0.30],
};

const VERT = `
uniform float uVel;
uniform float uHover;
uniform vec2  uSize;      // the figure's size in CSS pixels
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  float bend = sin(uv.x * 3.14159265);
  // A standing curve, deeper while the page is moving, and easing nearly flat
  // as the figure is looked at directly so it can be read.
  // Bows AWAY from the camera, not toward it. Bent forward, the centre grew
  // under perspective and the plane escaped its own frame — at speed it
  // covered the paragraph above and the heading below. Receding, the curve is
  // just as legible and can never overlap the prose around it.
  // The geometry is a 1x1 plane scaled to the figure's pixel size, so a
  // displacement written in local space gets multiplied by that size. Only z
  // is safe (its scale is 1); x and y must be divided by the size or a 34px
  // shear becomes 34 * height and the figure shears off the screen.
  p.z -= bend * (46.0 + abs(uVel) * 330.0) * (1.0 - uHover * 0.72);
  // The trailing edge lags the leading one, which is what actually reads as
  // bending rather than merely as depth.
  p.y += (uv.x - 0.5) * uVel * 46.0 / max(uSize.y, 1.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

const FRAG = `
uniform sampler2D uTex;
uniform vec3  uHue;
uniform float uHover;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(uTex, vUv).rgb;
  // Seated into the room, lifted to full when you look at it — the same
  // treatment the static figures already had in CSS.
  c *= 0.86 + uHover * 0.14;
  float edge = smoothstep(0.0, 0.010, vUv.x) * smoothstep(1.0, 0.990, vUv.x)
             * smoothstep(0.0, 0.016, vUv.y) * smoothstep(1.0, 0.984, vUv.y);
  c = mix(uHue * (0.30 + uHover * 0.35), c, edge);
  gl_FragColor = vec4(c, 1.0);
}`;

export async function mountFigures(blocks, accent) {
  const THREE = await import(/* @vite-ignore */ THREE_URL);
  const dpr = Math.min(devicePixelRatio || 1, 2);

  const canvas = document.createElement('canvas');
  canvas.className = 'figgl-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Each figure is clipped to its own frame. Two reasons: a deep bend would
  // otherwise reach outside the figure and cover the prose around it, and a
  // native scroll moves the page on the compositor between reading the rect
  // and painting — so the plane can lag a frame behind its <img>. Clipping
  // means neither can ever paint over a paragraph.
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  // A perspective camera positioned so one world unit is one CSS pixel at z=0,
  // which lets a plane sit exactly where its <img> sits.
  const FOV = 45;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 6000);
  function frameCamera() {
    const h = innerHeight;
    camera.fov = FOV;
    camera.aspect = innerWidth / h;
    camera.position.z = (h / 2) / Math.tan((FOV / 2) * Math.PI / 180);
    camera.updateProjectionMatrix();
  }

  const loader = new THREE.TextureLoader();
  const hue = new THREE.Vector3(...(HUE[accent] || HUE.ember));
  const items = [];

  for (const b of blocks) {
    const img = b.querySelector('img');
    if (!img) continue;
    // right, left, bottom, top — kept in world space, refreshed every frame
    const clip = [
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0),
      new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),
      new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
    ];
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, transparent: true,
      clipping: true, clippingPlanes: clip,
      uniforms: {
        uTex: { value: null }, uHue: { value: hue },
        uVel: { value: 0 }, uHover: { value: 0 },
        uSize: { value: new THREE.Vector2(1, 1) },
      },
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 36, 22), mat);
    mesh.visible = false;
    scene.add(mesh);

    const it = { img, mesh, mat, clip, hover: 0, ready: false };
    items.push(it);

    loader.load(img.currentSrc || img.src, tex => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      mat.uniforms.uTex.value = tex;
      it.ready = true;
      // Hand the pixels over only once the texture is up, so the figure never
      // blinks out of existence while it loads.
      img.style.opacity = '0';
      dirty = true; kick();
    }, undefined, () => { /* texture failed: the <img> stays as it is */ });

    const over = () => { it.hover = 1; dirty = true; kick(); };
    const out  = () => { it.hover = 0; dirty = true; kick(); };
    b.addEventListener('pointerenter', over);
    b.addEventListener('pointerleave', out);
  }

  let raf = 0, dirty = true, running = true;
  let lastY = scrollY, vel = 0;

  function place() {
    const W = innerWidth, H = innerHeight;
    for (const it of items) {
      const r = it.img.getBoundingClientRect();
      const on = it.ready && r.bottom > -80 && r.top < H + 80 && r.width > 4;
      it.mesh.visible = on;
      if (!on) continue;
      it.mesh.scale.set(r.width, r.height, 1);
      it.mesh.position.set(
        r.left + r.width / 2 - W / 2,
        -(r.top + r.height / 2 - H / 2),
        0,
      );
      // the figure's own box, in the same pixel-world the planes live in
      const l = r.left - W / 2, rt = r.right - W / 2;
      const t = -(r.top - H / 2), bt = -(r.bottom - H / 2);
      it.clip[0].constant = rt;    // x <= right
      it.clip[1].constant = -l;    // x >= left
      it.clip[2].constant = -bt;   // y >= bottom
      it.clip[3].constant = t;     // y <= top

      it.mat.uniforms.uSize.value.set(r.width, r.height);
      it.mat.uniforms.uVel.value = vel;
      it.mat.uniforms.uHover.value += (it.hover - it.mat.uniforms.uHover.value) * 0.18;
    }
  }

  function size() {
    const w = innerWidth, h = innerHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      renderer.setSize(w, h, false);
      frameCamera();
      dirty = true;
    }
  }

  function frame() {
    raf = 0;
    size();
    const dy = scrollY - lastY;
    lastY = scrollY;
    const want = Math.max(-1, Math.min(1, dy / 55));
    // Builds quickly, eases out slowly: at the old rate the curve had already
    // collapsed by the time the eye reached it.
    vel += (want - vel) * (Math.abs(want) > Math.abs(vel) ? 0.34 : 0.12);
    if (Math.abs(vel) < 0.002) vel = 0;

    const settling = items.some(it =>
      Math.abs(it.hover - it.mat.uniforms.uHover.value) > 0.004);

    place();
    renderer.render(scene, camera);
    dirty = false;

    if (running && (vel !== 0 || settling)) raf = requestAnimationFrame(frame);
  }
  function kick() { if (running && !raf) raf = requestAnimationFrame(frame); }

  addEventListener('scroll', () => { dirty = true; kick(); }, { passive: true });
  addEventListener('resize', () => { dirty = true; kick(); }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) kick();
  });

  size();
  place();
  renderer.render(scene, camera);

  return {
    dispose() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      for (const it of items) {
        it.img.style.opacity = '';
        it.mat.uniforms.uTex.value?.dispose();
        it.mat.dispose(); it.mesh.geometry.dispose();
      }
      renderer.dispose();
      canvas.remove();
    },
  };
}
