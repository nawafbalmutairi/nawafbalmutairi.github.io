// Figures stay where their prose explains them.
//
// An earlier pass consolidated a study's artefacts into one plate gallery. It
// browsed well, but it pulled the causal-loop diagram away from the paragraph
// about causal loops — in a case study the figure belongs beside the sentence
// that argues from it. So each figure stays in place and is enhanced where it
// sits, by one shared WebGL context rather than a gallery.
//
// Nothing is moved, hidden or renumbered. If this never runs, the page is the
// page it always was.

const wants3D = () =>
  innerWidth >= 900 && !matchMedia('(prefers-reduced-motion: reduce)').matches;

const blocks = [...document.querySelectorAll('.fig-block')]
  .filter(b => b.querySelector('img'));

// Undo the previous build: any figure hidden in favour of the plate gallery
// comes back, and the gallery itself goes.
for (const b of blocks) b.hidden = false;
document.querySelector('.fig-gallery')?.remove();

if (blocks.length && wants3D()) {
  const io = new IntersectionObserver(async (entries, obs) => {
    if (!entries.some(e => e.isIntersecting)) return;
    obs.disconnect();
    try {
      const mod = await import('./figuresgl.js');
      await mod.mountFigures(blocks, document.body.dataset.hue || 'ember');
    } catch {
      // No WebGL, no CDN, no problem: the figures are already on the page.
    }
  }, { rootMargin: '300px' });
  for (const b of blocks) io.observe(b);
}
