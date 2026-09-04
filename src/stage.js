import * as THREE from 'three';

export function createStage({ canvas, tier, reducedMotion }) {
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

  function setSize() {
    // Size from the canvas's own box, not innerWidth: a visible scrollbar makes
    // the two differ and the render comes out horizontally stretched.
    const w = canvas.clientWidth || innerWidth;
    const h = canvas.clientHeight || innerHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio, maxDpr));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  setSize();
  addEventListener('resize', setSize, { passive: true });

  return {
    renderer, scene, camera, setSize,
    reducedMotion,
    render() { renderer.render(scene, camera); },
    dispose() {
      removeEventListener('resize', setSize);
      renderer.dispose();
    },
  };
}
