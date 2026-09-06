// A project's own face, at the head of its own page.
//
// The composition you clicked in the Work gallery is the one that greets you
// here — drawn from the same data by the same code, so the two can never drift
// apart. It carries the standing curve and bends with scroll velocity like
// every other surface in this world.
//
// The page is untouched if this never runs: the band is created by script and
// nothing on the page depends on it.

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const VERT = `
uniform float uVel;
uniform float uHover;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  float bend = sin(uv.x * 3.14159265);
  // Bows away from the camera, so the curve never grows outside the band.
  p.z -= bend * (0.30 + abs(uVel) * 1.9) * (1.0 - uHover * 0.7);
  p.y += (uv.x - 0.5) * uVel * 0.26;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

const FRAG = `
uniform sampler2D uTex;
uniform vec3 uHue;
uniform float uHover;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(uTex, vUv).rgb;
  c *= 0.90 + uHover * 0.10;
  float edge = smoothstep(0.0, 0.008, vUv.x) * smoothstep(1.0, 0.992, vUv.x)
             * smoothstep(0.0, 0.013, vUv.y) * smoothstep(1.0, 0.987, vUv.y);
  c = mix(uHue * 0.40, c, edge);
  gl_FragColor = vec4(c, 1.0);
}`;

const HUE = {
  teal:   [0.37, 0.88, 0.80],
  ochre:  [0.94, 0.70, 0.34],
  violet: [0.71, 0.61, 1.00],
  ember:  [1.00, 0.54, 0.30],
};

const FACE_W = 1400, FACE_H = 880;
const PLANE_W = 4.3, PLANE_H = PLANE_W * FACE_H / FACE_W;

export async function mountHero(host, item, drawFace) {
  const THREE = await import(/* @vite-ignore */ THREE_URL);
  const dpr = Math.min(devicePixelRatio || 1, 2);

  const canvas = document.createElement('canvas');
  canvas.className = 'hero-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 2, 0.1, 60);
  camera.position.z = 4.42;

  const tex = new THREE.CanvasTexture(drawFace(item, null, dpr));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;

  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG,
    uniforms: {
      uTex: { value: tex },
      uHue: { value: new THREE.Vector3(...(HUE[item.accent] || HUE.ember)) },
      uVel: { value: 0 }, uHover: { value: 0 },
    },
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(PLANE_W, PLANE_H, 40, 26), mat);
  scene.add(mesh);

  let raf = 0, running = true, lastY = scrollY, vel = 0, hover = 0;
  let lastT = performance.now();

  function size() {
    const w = host.clientWidth || 900, h = host.clientHeight || 380;
    if (canvas.width === Math.round(w * dpr) && canvas.height === Math.round(h * dpr)) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // Fit to the tighter axis, so the composition is never cropped.
    const vh = 2 * Math.tan((camera.fov / 2) * Math.PI / 180) * camera.position.z;
    const vw = vh * camera.aspect;
    mesh.scale.setScalar(Math.min(vw / PLANE_W, vh / PLANE_H) * 0.98);
  }

  function frame() {
    raf = 0;
    const now = performance.now();
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    size();

    const dy = scrollY - lastY;
    lastY = scrollY;
    const want = Math.max(-1, Math.min(1, dy / 55));
    // Time-based, so the bend behaves the same on any refresh rate.
    const rate = Math.abs(want) > Math.abs(vel) ? 24 : 7;
    vel += (want - vel) * (1 - Math.exp(-dt * rate));
    if (Math.abs(vel) < 0.002) vel = 0;

    mat.uniforms.uVel.value = vel;
    mat.uniforms.uHover.value += (hover - mat.uniforms.uHover.value) * (1 - Math.exp(-dt * 9));

    renderer.render(scene, camera);
    if (running && (vel !== 0 || Math.abs(hover - mat.uniforms.uHover.value) > 0.004)) {
      raf = requestAnimationFrame(frame);
    }
  }
  const kick = () => { if (running && !raf) raf = requestAnimationFrame(frame); };

  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', () => { size(); kick(); }, { passive: true });
  host.addEventListener('pointerenter', () => { hover = 1; kick(); });
  host.addEventListener('pointerleave', () => { hover = 0; kick(); });
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) kick();
  });

  size();
  renderer.render(scene, camera);
  host.dataset.gl = '';

  return {
    dispose() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      tex.dispose(); mat.dispose(); mesh.geometry.dispose(); renderer.dispose();
    },
  };
}
