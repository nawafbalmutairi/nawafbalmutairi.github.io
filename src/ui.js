import { activeIndex } from './scroll.js';

// Chrome that must survive a WebGL failure: it imports nothing from three,
// so it still runs when the 3D never loads.
export function initUI(sections) {
  const nav = document.getElementById('nav');
  const steps = [...document.querySelectorAll('.hud-steps li')];
  const els = sections.map(id => document.getElementById(id));
  let rects = [];

  function measure() {
    rects = els.map(el => {
      if (!el) return { top: 0, height: 0 };
      const r = el.getBoundingClientRect();
      return { top: r.top + scrollY, height: r.height };
    });
  }

  let ticking = false;
  function frame() {
    ticking = false;
    if (nav) nav.classList.toggle('scrolled', scrollY > 24);

    const i = activeIndex(scrollY, innerHeight, rects);
    steps.forEach((li, n) => {
      li.classList.toggle('on', n === i);
      li.classList.toggle('done', i > -1 && n < i);
    });
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }

  measure();
  frame();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { measure(); frame(); }, { passive: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { measure(); frame(); });
  }
}
