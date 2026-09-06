// The Panel primitive and the depth system.
//
// One function builds every surface on this site. Sections choose a plane and
// an offset; they never style a panel themselves. That is the whole point of
// the primitive — depth stays consistent because it is decided in one place.

export const PLANES = ['far', 'mid', 'near'];

/**
 * @param {object} o
 * @param {'far'|'mid'|'near'} o.plane   depth plane
 * @param {number} [o.x]      horizontal offset, px
 * @param {number} [o.y]      vertical offset, px
 * @param {number} [o.rot]    in-plane rotation, degrees
 * @param {number} [o.tilt]   rotation about Y, degrees — reads as facing
 * @param {number} [o.scale]  size multiplier
 * @param {boolean} [o.interactive]
 * @param {string} [o.tag]    element to build (section, article, aside…)
 */
export function panel(o = {}) {
  const el = document.createElement(o.tag || 'div');
  el.className = 'panel' + (o.className ? ' ' + o.className : '');
  el.dataset.plane = o.plane || 'mid';

  const s = el.style;
  if (o.x)     s.setProperty('--p-x', o.x + 'px');
  if (o.y)     s.setProperty('--p-y', o.y + 'px');
  if (o.rot)   s.setProperty('--p-rot', o.rot + 'deg');
  if (o.tilt)  s.setProperty('--p-tilt', o.tilt + 'deg');
  if (o.scale) s.setProperty('--p-scale', String(o.scale));

  if (o.interactive) {
    el.dataset.interactive = '';
    if (!o.href) el.tabIndex = 0;
  }

  // Depth parallax factor: nearer surfaces travel further under the pointer.
  el.dataset.depth = ({ far: 0.18, mid: 0.45, near: 0.8 })[el.dataset.plane];

  const inner = document.createElement('div');
  inner.className = 'panel-in';
  el.appendChild(inner);
  el.content = inner;      // sections fill this, never the panel itself
  return el;
}

/**
 * Pointer parallax. The room and everything in it shift by a few pixels
 * against the pointer, scaled by depth. This is the only ambient motion in
 * the build, it is capped hard, and it never runs on its own.
 */
export function initParallax({ env, root = document.body, strength = 1 } = {}) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return { stop() {} };

  // Coarse pointers have no hover to parallax against, and the effect costs
  // compositing on exactly the devices that can least afford it.
  if (matchMedia('(pointer: coarse)').matches) return { stop() {} };

  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, running = true;
  const MAX = 16 * strength;          // px of travel at the nearest plane

  function onMove(e) {
    const nx = (e.clientX / innerWidth - 0.5) * 2;
    const ny = (e.clientY / innerHeight - 0.5) * 2;
    tx = -nx * MAX;
    ty = -ny * MAX * 0.6;
    if (!raf && running) raf = requestAnimationFrame(tick);
  }

  const panels = () => root.querySelectorAll('.panel[data-depth]');

  function tick() {
    raf = 0;
    // Critically damped follow: the room settles, it never springs or bounces.
    cx += (tx - cx) * 0.075;
    cy += (ty - cy) * 0.075;

    if (env) env.style.transform = `translate3d(${cx * 0.42}px, ${cy * 0.42}px, 0) scale(1.02)`;
    for (const p of panels()) {
      const d = +p.dataset.depth;
      p.style.setProperty('--p-x', (cx * d).toFixed(2) + 'px');
      p.style.setProperty('--p-y', (cy * d).toFixed(2) + 'px');
    }

    if (running && (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05)) {
      raf = requestAnimationFrame(tick);
    }
  }

  addEventListener('pointermove', onMove, { passive: true });

  // Nothing renders while the tab is hidden.
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running && !raf) raf = requestAnimationFrame(tick);
  });

  return {
    stop() {
      running = false;
      removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    },
  };
}

/**
 * Loads the environment plate: LQIP first so the room is never a blank hole,
 * the full plate swapped in once decoded. Content is readable throughout —
 * nothing waits on this.
 */
export function initEnvironment(el, { lqip, srcset, sizes }) {
  el.style.backgroundImage = `url("${lqip}")`;

  const img = new Image();
  img.decoding = 'async';
  img.sizes = sizes;
  img.srcset = srcset;
  img.onload = () => {
    const url = img.currentSrc || img.src;
    el.style.backgroundImage = `url("${url}"), url("${lqip}")`;
    el.dataset.loaded = '';
  };
  // A plate that fails to load leaves the LQIP and the scrim: still a room.
  img.onerror = () => { el.dataset.failed = ''; };
  img.src = './assets/env-1280.webp';
}
