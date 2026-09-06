// Mounts a project's face at the head of its own page.
//
// The page names itself with data-project on <body>. If that names nothing, or
// the screen is small, or motion is not wanted, nothing happens at all and the
// page is exactly as it was.

import { itemFor } from './faceitem.js';
import { drawFace } from './faces.js';

const key = document.body.dataset.project;
const wants = innerWidth >= 900 && !matchMedia('(prefers-reduced-motion: reduce)').matches;

if (key && wants) {
  const item = itemFor(key);
  const anchor = document.querySelector(
    '.diss-hero, .w > header, .wrapper > header, main > header, main > section');

  if (item && anchor) {
    const band = document.createElement('figure');
    band.className = 'hero-band';
    band.dataset.accent = item.accent;
    // Decorative: every word drawn on the face is already written on the page.
    band.setAttribute('aria-hidden', 'true');
    anchor.insertAdjacentElement('afterend', band);

    const io = new IntersectionObserver(async (entries, obs) => {
      if (!entries.some(e => e.isIntersecting)) return;
      obs.disconnect();
      try {
        const { mountHero } = await import('./hero.js');
        await mountHero(band, item, drawFace);
      } catch {
        band.remove();          // no WebGL, no CDN: leave no empty box behind
      }
    }, { rootMargin: '250px' });
    io.observe(band);
  }
}
