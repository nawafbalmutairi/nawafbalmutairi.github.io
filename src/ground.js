// The ground colour IS the journey: scrolling the pipeline walks through deep
// versions of each project's hue. It runs on scroll position alone — no WebGL,
// no canvas — so the world still changes for a visitor whose 3D never loads.
// Pure so it can be tested without a browser: the environments this runs in
// cannot always be scrolled, and a colour ramp that silently sticks on its
// first stop is exactly the kind of bug that hides behind that.
export function groundAt(y, marks) {
  if (!marks || marks.length === 0) return [0, 0, 0];
  if (marks.length === 1) return marks[0].rgb.slice();
  if (y <= marks[0].y) return marks[0].rgb.slice();
  const last = marks[marks.length - 1];
  if (y >= last.y) return last.rgb.slice();

  for (let i = 0; i < marks.length - 1; i++) {
    const a = marks[i], b = marks[i + 1];
    if (y >= a.y && y <= b.y) {
      const t = (y - a.y) / Math.max(1, b.y - a.y);
      const e = t * t * (3 - 2 * t);   // ease so the change never snaps
      return [0, 1, 2].map(k => Math.round(a.rgb[k] + (b.rgb[k] - a.rgb[k]) * e));
    }
  }
  return last.rgb.slice();
}

let current = [12, 18, 32];

export function currentGround() { return current; }

const STOPS = [
  ['hero',      '--g-raw'],
  ['journey',   '--g-method'],
  ['case-01',   '--g-model'],
  ['case-02',   '--g-system'],
  ['case-03',   '--g-inference'],
  ['contact',   '--g-decision'],
];

function readRGB(varName) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  const h = v.replace('#', '');
  const n = h.length === 3
    ? h.split('').map(c => parseInt(c + c, 16))
    : [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)].map(x => parseInt(x, 16));
  return n.some(Number.isNaN) ? [12, 18, 32] : n;
}

export function initGround() {
  const root = document.documentElement;
  const stops = STOPS
    .map(([id, v]) => ({ el: document.getElementById(id), rgb: readRGB(v) }))
    .filter(s => s.el);
  if (stops.length < 2) return;

  let marks = [];
  function measure() {
    marks = stops.map(s => {
      const r = s.el.getBoundingClientRect();
      // Anchor on each section's middle: the colour has fully arrived when the
      // section owns the screen, and is mid-blend on the way in.
      return { y: r.top + scrollY + r.height / 2, rgb: s.rgb };
    });
  }

  function paint() {
    if (marks.length < 2) return;
    const rgb = groundAt(scrollY + innerHeight / 2, marks);
    current = rgb;
    root.style.setProperty('--bg', `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`);
  }

  function onScroll() {
    const now = performance.now();
    if (now - last < 16) return;
    last = now;
    paint();
  }

  measure();
  paint();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { measure(); paint(); }, { passive: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { measure(); paint(); });
  }

  // Scroll can fire before rAF ever runs in some environments; paint on a
  // timer for the first second so the ground is never stuck on the first stop.
  let n = 0;
  const settle = setInterval(() => { measure(); paint(); if (++n > 8) clearInterval(settle); }, 120);
}
