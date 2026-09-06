// The Work gallery: a WebGL scene with a readable, keyboard-driven layer.
//
// The planes are the presentation; this DOM is the content. Every project is a
// real button here with its title and headline figure in text, so the section
// works with no WebGL, on a phone, under reduced motion, and with a screen
// reader — the canvas is what you get on top when the machine can afford it.

function h(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'data') Object.assign(e.dataset, v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null) e.append(kid.nodeType ? kid : document.createTextNode(kid));
  return e;
}

const wants3D = () =>
  innerWidth >= 900 && !matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * @param {Array} items  {id, kicker, title, lede, stat, statLabel, accent, hex,
 *                        image?, href?, open?}
 */
export function buildGallery(items, { onOpen }) {
  let active = 0;
  const root = h('section', { class: 'gal', 'aria-label': 'Work' });

  const use3D = wants3D();
  const canvas = use3D ? h('canvas', { class: 'gal-canvas', 'aria-hidden': 'true' }) : null;
  const stageEl = use3D ? h('div', { class: 'gal-stage' }, canvas,
    h('div', { class: 'gal-hint', 'aria-hidden': 'true' }, 'drag · scroll · click to open')) : null;

  // Every project, as a real button.
  const tabs = items.map((it, i) =>
    h('button', {
      class: 'gal-tab', type: 'button', role: 'tab',
      'aria-selected': String(i === 0),
      tabindex: i === 0 ? '0' : '-1',
      onclick: () => select(i, true),
      ondblclick: () => open(i),
    }, h('span', { class: 'gal-tab-n', text: it.kicker }), h('span', { text: it.short || it.title })));

  const rail = h('div', { class: 'gal-rail', role: 'tablist', 'aria-label': 'Projects' }, tabs);

  const dKick = h('div', { class: 'gal-kick' });
  const dTitle = h('h3', { class: 'gal-title' });
  const dLede = h('p', { class: 'gal-lede' });
  const dStat = h('div', { class: 'gal-stat' });
  const dLabel = h('div', { class: 'gal-statlabel' });
  const openBtn = h('button', { class: 'gal-open', type: 'button', onclick: () => open(active) });

  const prev = h('button', { class: 'gal-nav', type: 'button', 'aria-label': 'Previous project',
    onclick: () => select(active - 1, true) }, '←');
  const next = h('button', { class: 'gal-nav', type: 'button', 'aria-label': 'Next project',
    onclick: () => select(active + 1, true) }, '→');

  const detail = h('div', { class: 'gal-detail' },
    h('div', { class: 'gal-detail-head' }, dKick, h('div', { class: 'gal-navs' }, prev, next)),
    dTitle, dLede,
    h('div', { class: 'gal-foot' },
      h('div', { class: 'gal-figs' }, dStat, dLabel), openBtn));

  root.append(stageEl, rail, detail);

  let scene = null;

  /** Where a project actually goes, once the travel has landed. */
  function arrive(i) {
    const it = items[i];
    if (!it) return;
    if (it.open) onOpen(it.open);
    else if (it.href) window.open(it.href, '_blank', 'noopener');
  }

  /** Asking to open: the scene flies into the project first, if it can. */
  function open(i) {
    if (scene) scene.open(i);
    else arrive(i);
  }

  function select(i, drive = false) {
    active = Math.max(0, Math.min(items.length - 1, i));
    const it = items[active];
    dKick.textContent = `${active + 1} / ${items.length} · ${it.kicker}`;
    dTitle.textContent = it.title;
    dLede.textContent = it.lede;
    dStat.textContent = it.stat || '';
    dLabel.textContent = it.statLabel || '';
    openBtn.textContent = it.openLabel || (it.open ? 'Open case study →' : 'Read study ↗');
    prev.disabled = active === 0;
    next.disabled = active === items.length - 1;
    root.dataset.accent = it.accent;
    tabs.forEach((t, n) => {
      t.setAttribute('aria-selected', String(n === active));
      t.tabIndex = n === active ? 0 : -1;
      if (n === active) t.dataset.on = ''; else delete t.dataset.on;
    });
    tabs[active].scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    if (drive && scene) scene.focus(active);
  }

  root.addEventListener('keydown', e => {
    let to = null;
    if (e.key === 'ArrowRight') to = active + 1;
    else if (e.key === 'ArrowLeft') to = active - 1;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = items.length - 1;
    else if ((e.key === 'Enter' || e.key === ' ') && document.activeElement?.classList.contains('gal-tab')) {
      e.preventDefault(); open(active); return;
    }
    if (to == null) return;
    e.preventDefault();
    select(to, true);
    if (document.activeElement?.closest('.gal-rail')) tabs[active].focus();
  });

  select(0);

  let booted = false;
  const io = new IntersectionObserver(es => {
    for (const e of es) {
      if (e.isIntersecting && !booted) { booted = true; boot(); }
      else if (scene) scene.setRunning(e.isIntersecting);
    }
  }, { rootMargin: '150px' });
  io.observe(root);

  async function boot() {
    if (!use3D) return;
    try {
      const mod = await import('./gallery3d.js');
      scene = await mod.createGallery({
        canvas, items,
        onFocus: (i, fromScene) => { if (fromScene) select(i); else select(i, true); },
        onOpen: arrive,          // called when the fly-in lands
      });
      if (scene) { root.dataset.gl = ''; scene.focus(active); }
    } catch {
      // No WebGL, no CDN, no problem: the rail and the detail are the section.
    }
  }

  root.destroy = () => { io.disconnect(); if (scene) scene.dispose(); };
  return root;
}
