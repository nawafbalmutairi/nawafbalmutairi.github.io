import { clamp } from './util/lerp.js';

export function sectionProgress(scrollY, viewportH, top, height) {
  const start = top - viewportH;
  const span = height + viewportH;
  return clamp((scrollY - start) / span, 0, 1);
}

export function activeIndex(scrollY, viewportH, rects) {
  const mid = scrollY + viewportH / 2;
  for (let i = 0; i < rects.length; i++) {
    const { top, height } = rects[i];
    if (mid >= top && mid < top + height) return i;
  }
  return -1;
}

export function createScrollDriver(ids) {
  const els = ids.map(id => document.getElementById(id));
  let rects = [];

  function measure() {
    rects = els.map(el => {
      if (!el) return { top: 0, height: 0 };
      const r = el.getBoundingClientRect();
      return { top: r.top + scrollY, height: r.height };
    });
  }
  measure();
  addEventListener('resize', measure, { passive: true });
  // Fonts land after first paint and shift every section down.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  return {
    measure,
    read() {
      const i = activeIndex(scrollY, innerHeight, rects);
      if (i === -1) return { index: -1, id: null, progress: 0 };
      const { top, height } = rects[i];
      return {
        index: i,
        id: ids[i],
        progress: sectionProgress(scrollY, innerHeight, top, height),
      };
    },
  };
}
