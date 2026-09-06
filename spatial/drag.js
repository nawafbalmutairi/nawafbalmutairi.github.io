// Panels you can pick up and move.
//
// The room is a place, so the things in it should be movable. Dragging writes
// to its own pair of custom properties rather than to the transform, because
// pointer parallax is already writing --p-x/--p-y every frame — the two have
// to compose, not overwrite each other.
//
// A drag never starts on a link, a button or selected text: those still do
// what they always did.

const NO_DRAG = 'a, button, input, textarea, select, [role="button"], .scroller';

export function makeDraggable(el, { onMove } = {}) {
  // Touch scrolls the page; a coarse pointer has no spare gesture for this.
  if (matchMedia('(pointer: coarse)').matches) return () => {};

  let id = null, sx = 0, sy = 0, ox = 0, oy = 0;
  let x = 0, y = 0, vx = 0, vy = 0, raf = 0, last = 0;

  const set = () => {
    el.style.setProperty('--p-dx', x.toFixed(1) + 'px');
    el.style.setProperty('--p-dy', y.toFixed(1) + 'px');
  };

  function glide() {
    raf = 0;
    // A little weight on release, then it settles where you left it.
    x += vx; y += vy;
    vx *= 0.90; vy *= 0.90;
    set();
    if (Math.abs(vx) > 0.05 || Math.abs(vy) > 0.05) raf = requestAnimationFrame(glide);
  }

  function down(e) {
    if (e.button !== 0 || e.target.closest(NO_DRAG)) return;
    if (getSelection && String(getSelection()).length) return;
    id = e.pointerId;
    sx = e.clientX; sy = e.clientY; ox = x; oy = y;
    vx = vy = 0;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    el.setPointerCapture(id);
    el.dataset.dragging = '';
  }

  function move(e) {
    if (id !== e.pointerId) return;
    const nx = ox + (e.clientX - sx);
    const ny = oy + (e.clientY - sy);
    const now = performance.now();
    const dt = Math.max(now - last, 1);
    vx = (nx - x) / dt * 12;
    vy = (ny - y) / dt * 12;
    last = now;
    x = nx; y = ny;
    set();
    onMove?.(x, y);
  }

  function up(e) {
    if (id !== e.pointerId) return;
    try { el.releasePointerCapture(id); } catch {}
    id = null;
    delete el.dataset.dragging;
    vx = Math.max(-40, Math.min(40, vx));
    vy = Math.max(-40, Math.min(40, vy));
    if (Math.abs(vx) > 0.05 || Math.abs(vy) > 0.05) glide();
  }

  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move, { passive: true });
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.dataset.draggable = '';

  return function reset() {
    if (raf) cancelAnimationFrame(raf);
    x = y = vx = vy = 0;
    set();
  };
}
