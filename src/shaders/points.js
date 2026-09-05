export const vert = /* glsl */`
uniform float uTime, uResolve, uSize;
attribute vec3 aTarget;
attribute float aSeed;
varying float vDepth;
void main(){
  vec3 p = mix(position, aTarget, uResolve);
  p.y += sin(uTime * 0.5 + aSeed * 6.283) * 0.06;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vDepth = -mv.z;
  gl_PointSize = uSize * (12.0 / max(vDepth, 0.001));
  gl_Position = projectionMatrix * mv;
}`;

export const frag = /* glsl */`
precision mediump float;
uniform vec3 uColorA, uColorB;
varying float vDepth;
void main(){
  vec2 d = gl_PointCoord - 0.5;
  float a = smoothstep(0.5, 0.15, length(d));
  if (a < 0.01) discard;
  vec3 c = mix(uColorA, uColorB, clamp(vDepth / 24.0, 0.0, 1.0));
  // Near-opaque: on a light ground a point reads by contrast, not by glow.
  gl_FragColor = vec4(c, a * 0.95);
}`;
