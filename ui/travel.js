// Scroll as travel through the room.
//
// Before this, the page had a scroll hint and about 76px to scroll: the wheel
// technically moved something, and nothing happened. Scrolling is now the way
// you move through the five destinations, and it is a real scrollbar — the
// window scrolls a track whose height is computed from the actual content, so
// native scroll, the scrollbar, Page Up/Down, Home/End and find-in-page all
// behave, and scroll position maps monotonically to progress. Nothing is
// hijacked; the mapping is just made to mean something.
//
// Each destination gets a stretch of track:
//   PAN   — as much as its content overflows the frame; the room holds still
//           and the panels rise past you.
//   TRAVEL— a fixed run where this destination recedes into the distance and
//           the next one comes forward out of it.

const DEPTH_OUT = 620;   // px the leaving destination falls back
const DEPTH_IN  = 700;   // px the arriving one starts in front of its resting place

/** Eased ramp from a to b. */
function ramp(a, b, x) {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
}

export function initTravel({ field, scenes, destinations, env, onEnter, startIndex = 0 }) {
  const wide = matchMedia('(min-width: 1101px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const track = document.createElement('div');
  track.className = 'scroll-track';
  track.setAttribute('aria-hidden', 'true');
  document.body.appendChild(track);

  let segs = [];
  let total = 0;
  let current = -1;
  let enabled = false;
  let raf = 0;

  // A deep link has to survive three things: the browser restoring scroll on
  // load, the track height not being final until fonts and images settle, and
  // our own remeasures. So the target is re-applied after every measure until
  // the reader takes over or it has clearly landed.
  let pending = startIndex > 0 ? startIndex : null;
  if (pending != null && 'scrollRestoration' in history) history.scrollRestoration = 'manual';

  function applyPending() {
    if (pending == null) return;
    const want = offsetOf(pending);
    if (Math.abs(scrollY - want) > 2) scrollTo({ top: want, behavior: 'instant' });
  }
  addEventListener('wheel', () => { pending = null; }, { passive: true, once: true });
  addEventListener('pointerdown', () => { pending = null; }, { passive: true, once: true });
  setTimeout(() => { pending = null; }, 2500);

  const frameH = () => scenes[0].clientHeight || innerHeight;

  /** How far the lowest panel sits below the top of the scene. */
  function contentBottom(scene) {
    let low = 0;
    for (const el of scene.querySelectorAll('.panel, .sig')) {
      low = Math.max(low, el.offsetTop + el.offsetHeight);
    }
    return low;
  }

  function measure() {
    const h = frameH();
    const travel = Math.round(innerHeight * 0.9);
    let acc = 0;
    segs = scenes.map((sc, i) => {
      const pan = Math.max(0, contentBottom(sc) - h + 24);
      const hold = i < scenes.length - 1 ? travel : Math.round(innerHeight * 0.3);
      const seg = { start: acc, pan, hold, len: pan + hold };
      acc += seg.len;
      return seg;
    });
    total = acc + innerHeight;
    track.style.height = total + 'px';
  }

  /** Where a destination begins on the track — what the rail scrolls to. */
  function offsetOf(i) { return segs[i] ? segs[i].start : 0; }

  function apply() {
    raf = 0;
    const y = scrollY;

    // find the segment we are in
    let i = segs.length - 1;
    for (let n = 0; n < segs.length; n++) {
      if (y < segs[n].start + segs[n].len) { i = n; break; }
    }
    const seg = segs[i];
    const local = y - seg.start;

    const pan = Math.min(Math.max(local, 0), seg.pan);
    // t: 0 while reading this destination, 0→1 while travelling to the next
    const t = seg.hold > 0 ? Math.min(Math.max((local - seg.pan) / seg.hold, 0), 1) : 0;

    // The two destinations overlap only briefly, and both dim through the
    // middle: you pass through the depth of the room rather than watching one
    // panel wall dissolve into another. An even crossfade read as mud.
    const out = ramp(0.10, 0.70, t);
    const inn = ramp(0.30, 0.90, t);
    const eased = t * t * (3 - 2 * t);

    for (let n = 0; n < scenes.length; n++) {
      const sc = scenes[n];
      if (n === i) {
        show(sc, -pan, -out * DEPTH_OUT, 1 - out);
      } else if (n === i + 1 && t > 0) {
        // the next destination arrives out of the depth of the room
        show(sc, 0, (1 - inn) * DEPTH_IN, inn);
      } else {
        hide(sc);
      }
    }

    // the room itself drifts as you travel, so the space moves with you
    if (env && !reduced.matches) {
      const g = total > innerHeight ? y / (total - innerHeight) : 0;
      env.style.setProperty('--travel', (-g * 34).toFixed(2) + 'px');
    }

    const nowAt = eased > 0.5 ? Math.min(i + 1, scenes.length - 1) : i;
    if (nowAt !== current) {
      current = nowAt;
      onEnter(destinations[nowAt].id, nowAt);
    }
    document.documentElement.style.setProperty(
      '--progress', total > innerHeight ? (y / (total - innerHeight)).toFixed(4) : '0');
  }

  function show(sc, panPx, zPx, opacity) {
    sc.style.visibility = 'visible';
    sc.style.opacity = String(opacity);
    sc.style.transform = reduced.matches
      ? `translate3d(0, ${panPx}px, 0)`
      : `translate3d(0, ${panPx}px, ${zPx}px)`;
    sc.style.pointerEvents = opacity > 0.6 ? 'auto' : 'none';
  }

  function hide(sc) {
    sc.style.visibility = 'hidden';
    sc.style.opacity = '0';
    sc.style.pointerEvents = 'none';
  }

  function onScroll() { if (!raf) raf = requestAnimationFrame(apply); }

  function enable() {
    if (enabled) return;
    enabled = true;
    document.documentElement.dataset.travel = '';
    measure();
    applyPending();
    apply();
    addEventListener('scroll', onScroll, { passive: true });
  }

  function disable() {
    if (!enabled) return;
    enabled = false;
    delete document.documentElement.dataset.travel;
    removeEventListener('scroll', onScroll);
    track.style.height = '0px';
    for (const sc of scenes) {
      sc.style.cssText = '';                 // hand control back to the CSS modes
    }
    if (env) env.style.removeProperty('--travel');
  }

  function sync() { (wide.matches ? enable : disable)(); }

  wide.addEventListener('change', sync);
  addEventListener('resize', () => { if (enabled) { measure(); apply(); } }, { passive: true });
  // Fonts and images settle after first layout and change the content height.
  if (document.fonts?.ready) document.fonts.ready.then(() => {
    if (enabled) { measure(); applyPending(); apply(); }
  });
  addEventListener('load', () => {
    if (enabled) { measure(); applyPending(); apply(); }
  });

  sync();

  return {
    get enabled() { return enabled; },
    goTo(i, smooth = true) {
      if (!enabled) return false;
      scrollTo({ top: offsetOf(i), behavior: smooth && !reduced.matches ? 'smooth' : 'instant' });
      return true;
    },
    remeasure() { if (enabled) { measure(); apply(); } },
  };
}
