// Scroll response for the document pages.
//
// The case studies and further-work pages already scroll — they are ordinary
// documents — but nothing answered the scroll: the room sat behind them like
// wallpaper, and the template's `.fade-in` was a load-time animation, so every
// block on the page had already played its entrance before you reached it.
//
// Here the room drifts as you read, and each block arrives out of the depth
// when it actually comes into view. Everything is opt-in from JS: with no
// script, no WebGL and no IntersectionObserver, the page is simply the page,
// fully visible.

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
const env = document.querySelector('.env');

/* ── the room drifts, and a hairline reports how far through you are ── */
const bar = document.createElement('div');
bar.className = 'read-progress';
bar.setAttribute('aria-hidden', 'true');
document.body.appendChild(bar);

let raf = 0;
function onScroll() { if (!raf) raf = requestAnimationFrame(apply); }

function apply() {
  raf = 0;
  const max = root.scrollHeight - innerHeight;
  const g = max > 0 ? Math.min(Math.max(scrollY / max, 0), 1) : 0;
  root.style.setProperty('--progress', g.toFixed(4));
  // A long document travels further through the room than a short one, but
  // never so far that the plate's overscan runs out.
  if (env && !reduced) env.style.setProperty('--travel', (-g * 44).toFixed(2) + 'px');
}

addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll, { passive: true });
apply();

/* ── blocks arrive out of the depth as they come into view ───────────
   Reveal is added by script, so a page without it starts visible rather
   than starting hidden and hoping something turns it on. */
if (!reduced && 'IntersectionObserver' in window) {
  const SELECTOR = [
    'main > section', '.fig-block', '.card', '.chart-card', '.kpi-card',
    '.stat', '.pj', '.keystats', '.diss-meta-grid', '.insight-grid',
    '.g5', '.g4', '.g3', '.g2', '.sl', '.code-block', '.metrics-table',
  ].join(',');

  const targets = [...document.querySelectorAll(SELECTOR)]
    // A block already on screen at load should not animate in behind itself.
    .filter(el => el.getBoundingClientRect().top > innerHeight * 0.9);

  if (targets.length) {
    root.dataset.reveal = '';
    for (const el of targets) el.classList.add('rv');

    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.dataset.in = '';
        io.unobserve(e.target);          // arrives once; never replays
      }
      // Triggered BEFORE the block reaches the fold, not after it is 10%
      // inside: a reader scrolling fast would otherwise outrun the reveal and
      // meet an empty stretch of page.
    }, { rootMargin: '0px 0px 18% 0px', threshold: 0 });

    for (const el of targets) io.observe(el);
  }
}
