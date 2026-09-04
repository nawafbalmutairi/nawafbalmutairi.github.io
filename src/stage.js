import * as THREE from 'three';

export async function createStage({ canvas, tier, reducedMotion }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: tier === 'high',
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const maxDpr = tier === 'high' ? 2 : 1.5;

  const scene = new THREE.Scene();
  // Fog gives real depth instead of flat cut-outs floating on black.
  scene.fog = new THREE.FogExp2(0x05070a, 0.035);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  camera.position.set(0, 1.6, 15);

  // Lighting rig: cool ambient fill, warm key, cyan rim. Materials are
  // Standard, not Basic, so geometry actually reads as solid.
  const hemi = new THREE.HemisphereLight(0x8fb6ff, 0x0a0d14, 0.55);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff1e8, 1.35);
  key.position.set(6, 9, 7);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x38bdf8, 0.85);
  rim.position.set(-8, 3, -6);
  scene.add(rim);

  const warm = new THREE.PointLight(0xe64d2e, 0.7, 45);
  warm.position.set(-4, -2, 6);
  scene.add(warm);

  let composer = null;
  if (tier === 'high' && !reducedMotion) {
    const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }] = await Promise.all([
      import('three/addons/postprocessing/EffectComposer.js'),
      import('three/addons/postprocessing/RenderPass.js'),
      import('three/addons/postprocessing/UnrealBloomPass.js'),
    ]);
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(
      new THREE.Vector2(innerWidth, innerHeight), 0.42, 0.75, 0.92));
  }

  function setSize() {
    const w = canvas.clientWidth || innerWidth;
    const h = canvas.clientHeight || innerHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio, maxDpr));
    renderer.setSize(w, h, false);
    composer?.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  setSize();
  addEventListener('resize', setSize, { passive: true });

  return {
    renderer, scene, camera, composer, setSize, reducedMotion,
    render() { composer ? composer.render() : renderer.render(scene, camera); },
    dispose() {
      removeEventListener('resize', setSize);
      composer?.dispose?.();
      renderer.dispose();
    },
  };
}
