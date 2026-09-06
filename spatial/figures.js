// The figure gallery for a case-study page.
//
// A case study's artefacts — the Power BI pages, the rich picture, the causal
// loop — were static images at thumbnail size, scattered down the document.
// They are the evidence for the whole study, so they become the same WebGL
// gallery the homepage uses: curved planes you drag through, each with its own
// caption as the readable detail beneath.
//
// The gallery is announced as a plate section and placed BEFORE the section
// holding the first figure, not inside it: dropped at the first figure's own
// position it split that section's prose in half.
//
// The original figure blocks are replaced in place. If this never runs — no
// modules, no WebGL, no network — they stay exactly as they were.

import { buildGallery } from './gallery.js';

const blocks = [...document.querySelectorAll('.fig-block')]
  .filter(b => b.querySelector('img') && !b.hidden);

if (blocks.length >= 2) {
  const accent = document.body.dataset.hue || 'ember';

  // The caption is two spans: the full sentence, which begins with the page's
  // own figure number, and the tool it was made with. An earlier pass read the
  // tool as the title — so two figures both showed "Power BI" — and renumbered
  // the figures from one, contradicting the numbering in the prose.
  const shorten = (t, max = 24) => {
    const words = t.split(/\s+/);
    let out = '';
    for (const w of words) {
      if ((out + ' ' + w).trim().length > max) break;
      out = (out + ' ' + w).trim();
    }
    return out || t.slice(0, max);
  };

  const seen = new Set();
  const items = blocks.map((b, i) => {
    const img = b.querySelector('img');
    const spans = [...b.querySelectorAll('.fig-cap span')].map(s => s.textContent.trim());
    const full = spans[0] || '';
    const tool = spans[1] || '';

    const m = full.match(/^(Fig\.?\s*\d+)\s*[—–-]\s*([\s\S]+)$/i);
    const kicker = m ? m[1].replace(/\s+/g, ' ') : `Fig. ${String(i + 1).padStart(2, '0')}`;
    const desc = (m ? m[2] : full).trim();
    const title = desc.split(/(?<=\.)\s/)[0] || desc;

    // Cut at the sentence, not mid-clause, and never end on a stray symbol.
    let short = shorten(title.replace(/\.$/, ''))
      .replace(/[\s×—–·,;:.-]+$/, '');
    if (seen.has(short)) short = `${short} (${kicker.replace(/Fig\.?\s*/i, '')})`;
    seen.add(short);

    const [toolName, toolSpec] = tool.split('·').map(t => t && t.trim());

    return {
      kicker, short, title,
      // The alt text is written to describe the figure, so it is the best
      // sentence on the page about what you are actually looking at.
      lede: img.getAttribute('alt') || desc,
      stat: toolName || '', statLabel: toolSpec || '',
      accent,
      image: img.currentSrc || img.src,
      href: img.currentSrc || img.src,
      openLabel: 'Open full size ↗',
    };
  });

  const wrap = document.createElement('section');
  wrap.className = 'fig-gallery';
  const head = document.createElement('div');
  head.className = 'fig-gallery-head';
  head.innerHTML = '<div class="fig-gallery-label"></div><h2 class="fig-gallery-title"></h2>';
  head.querySelector('.fig-gallery-label').textContent = 'The artefacts';
  head.querySelector('.fig-gallery-title').textContent =
    `${items.length} figures from this study`;
  wrap.append(head);

  const gallery = buildGallery(items, { onOpen: () => {} });
  gallery.classList.add('gal-figures');
  wrap.append(gallery);

  const anchor = blocks[0].closest('section') || blocks[0];
  anchor.parentNode.insertBefore(wrap, anchor);
  for (const b of blocks) b.hidden = true;      // superseded by the gallery
}
