import * as THREE from 'three';

export async function createStage({ canvas, tier, reducedMotion }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const maxDpr = tier === 'high' ? 2 : 1.5;

  const scene = new THREE.Scene();
  // Fog matches the paper, so depth reads as distance rather than haze over a
  // void. There is no bloom in the light design: additive glow on a near-white
  // ground just washes to white. Depth comes from lighting and contrast.
  // Fog takes the ground's colour so depth reads as distance into the world
  // rather than a grey haze; main.js retints it as the ground shifts.
  scene.fog = new THREE.FogExp2(0x0c1220, 0.03);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  camera.position.set(0, 1.7, 15);

  // Lighting for a light room: bright sky fill, a soft key from above-front,
  // and a cool bounce standing in for light coming back off the paper.
  scene.add(new THREE.HemisphereLight(0xbcd2ff, 0x0a0d14, 0.75));

  const key = new THREE.DirectionalLight(0xfff4ec, 1.5);
  key.position.set(5, 9, 8);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xff8a5c, 0.7);
  rim.position.set(-8, 2, -6);
  scene.add(rim);

  function setSize() {
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
    renderer, scene, camera, setSize, reducedMotion,

    // `rect` is a slot in CSS pixels ({left, top, width, height}); the render
    // is scissored to it so 3D never draws over the copy. No rect means the
    // frame is skipped entirely rather than filling the page.
    render(rect) {
      renderer.setScissorTest(false);
      renderer.clear();
      if (!rect || rect.width < 8 || rect.height < 8) return;
      const y = (canvas.clientHeight || innerHeight) - (rect.top + rect.height);
      renderer.setViewport(rect.left, y, rect.width, rect.height);
      renderer.setScissor(rect.left, y, rect.width, rect.height);
      renderer.setScissorTest(true);
      if (camera.aspect !== rect.width / rect.height) {
        camera.aspect = rect.width / rect.height;
        camera.updateProjectionMatrix();
      }
      renderer.render(scene, camera);
    },
    dispose() {
      removeEventListener('resize', setSize);
      renderer.dispose();
    },
  };
}
