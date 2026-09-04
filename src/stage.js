import * as THREE from 'three';

export async function createStage({ canvas, tier, reducedMotion }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: tier === 'high',
    alpha: true,
    powerPreference: 'high-performance',
  });
  const maxDpr = tier === 'high' ? 2 : 1.5;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  camera.position.set(0, 0, 12);

  // Bloom is desktop-only. The addons are imported dynamically so mobile and
  // reduced-motion visitors never download the postprocessing modules at all.
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
      new THREE.Vector2(innerWidth, innerHeight), 0.55, 0.6, 0.85));
  }

  function setSize() {
    // Size from the canvas's own box, not innerWidth: a visible scrollbar makes
    // the two differ and the render comes out horizontally stretched.
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
    renderer, scene, camera, composer, setSize,
    reducedMotion,
    render() { composer ? composer.render() : renderer.render(scene, camera); },
    dispose() {
      removeEventListener('resize', setSize);
      composer?.dispose?.();
      renderer.dispose();
    },
  };
}
