import * as THREE from 'three';

// The slot is the frame now: a scene that is too big is simply clipped, and one
// that is too small floats in white space. Rather than hand-tuning a scale per
// scene — which drifts the moment the layout changes — measure the content and
// fit it to the camera's frustum at the slot's current aspect.
export function fitToCamera(group, camera, { margin = 0.86, box = null } = {}) {
  group.updateMatrixWorld(true);
  const b = box || new THREE.Box3().setFromObject(group);
  if (b.isEmpty()) return;

  const sphere = b.getBoundingSphere(new THREE.Sphere());
  if (!(sphere.radius > 0)) return;

  const dist = Math.max(0.001, camera.position.distanceTo(sphere.center));
  const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * dist;
  const halfW = halfH * (camera.aspect || 1);
  const k = (Math.min(halfH, halfW) * margin) / sphere.radius;

  group.scale.multiplyScalar(k);

  // Scaling happens about the group's own origin, so the content centre moves.
  // Put it back on the camera axis, or the fit is off-centre in the frame.
  const centred = sphere.center.clone().sub(group.position).multiplyScalar(k).add(group.position);
  group.position.x -= centred.x;
  group.position.y -= centred.y;
}
