// Drag-to-turn, scoped to a pad over each instrument rather than the whole
// canvas. A page-wide grab handler would fight text selection and scrolling;
// a pad only exists where an instrument actually is, and only on desktop.
const state = new Map();

export function dragFor(id) {
  return state.get(id) || { x: 0, y: 0 };
}

export function initDrag(ids) {
  if (!matchMedia('(min-width: 980px)').matches) return;
  if (matchMedia('(pointer: coarse)').matches) return;

  ids.forEach(id => {
    const section = document.getElementById(id);
    if (!section) return;
    const pad = section.querySelector('.stage-slot');
    if (!pad) return;

    state.set(id, { x: 0, y: 0 });

    let on = false, lx = 0, ly = 0;

    pad.addEventListener('pointerdown', e => {
      on = true; lx = e.clientX; ly = e.clientY;
      pad.setPointerCapture(e.pointerId);
      pad.classList.add('grabbing');
    });
    const end = e => {
      on = false;
      pad.classList.remove('grabbing');
      try { pad.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    pad.addEventListener('pointerup', end);
    pad.addEventListener('pointercancel', end);
    pad.addEventListener('pointermove', e => {
      if (!on) return;
      const s = state.get(id);
      s.x += (e.clientX - lx) * 0.006;
      s.y = Math.max(-0.3, Math.min(0.5, s.y + (e.clientY - ly) * 0.003));
      lx = e.clientX; ly = e.clientY;
    });
  });
}
