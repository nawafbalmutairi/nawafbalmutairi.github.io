// A project's journey, stage by stage.
//
// The DOM list is the real thing: it is always built, always readable, and
// works with no JavaScript beyond this module, no WebGL, and a screen reader.
// The 3D layer is an enhancement painted on top of it — lazily loaded, only
// when the journey is actually on screen, and torn down when it is not.

const NBSP = ' ';

/* Decided once, before anything is built. Revealing the band later would push
   the whole journey down after layout — a visible jump, and a layout shift the
   page does not otherwise have. */
function wants3D() {
  return innerWidth >= 760 && !matchMedia('(prefers-reduced-motion: reduce)').matches;
}

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

/**
 * Builds the journey for one project.
 * @param {{accent:string,title:string,stages:Array}} pipe
 * @returns {HTMLElement}
 */
let seq = 0;

export function buildJourney(pipe, { id = 'journey' } = {}) {
  let active = 0;
  const uid = `${id}-${++seq}`;
  const root = h('section', { class: 'pj', data: { accent: pipe.accent }, 'aria-label': 'Project journey' });

  const stageCount = pipe.stages.length;

  // ── the 3D band (decorative; every word in it also exists in the DOM) ──
  const use3D = wants3D();
  const canvas = use3D ? h('canvas', { class: 'pj-canvas', 'aria-hidden': 'true' }) : null;
  const band = use3D ? h('div', { class: 'pj-band' }, canvas) : null;

  // ── the stage rail: the accessible, clickable list of stages ──
  // A real tab pattern: the stages are tabs and the detail below is their
  // panel. An earlier pass used aria-pressed toggles inside role="tablist",
  // which is invalid — a tablist may only contain tabs.
  const chips = pipe.stages.map((s, i) =>
    h('button', {
      class: 'pj-chip', type: 'button', role: 'tab',
      id: `${uid}-tab-${i}`,
      'aria-selected': String(i === 0),
      'aria-controls': `${uid}-panel`,
      tabindex: i === 0 ? '0' : '-1',
      onclick: () => select(i),
    }, h('span', { class: 'pj-chip-n', text: s.n }), h('span', { text: s.k })));

  const rail = h('div', { class: 'pj-rail', role: 'tablist', 'aria-label': 'Stages' }, chips);

  // ── the detail for the selected stage ──
  const dName = h('h4', { class: 'pj-name' });
  const dBody = h('p', { class: 'pj-body' });
  const dStat = h('div', { class: 'pj-stat' });
  const dNote = h('div', { class: 'pj-note' });
  const dStep = h('div', { class: 'pj-step' });

  const prev = h('button', { class: 'pj-nav', type: 'button', 'aria-label': 'Previous stage',
    onclick: () => select(active - 1) }, '←');
  const next = h('button', { class: 'pj-nav', type: 'button', 'aria-label': 'Next stage',
    onclick: () => select(active + 1) }, '→');

  const detail = h('div', {
    class: 'pj-detail', role: 'tabpanel', id: `${uid}-panel`,
    'aria-labelledby': `${uid}-tab-0`, tabindex: '0',
  },
    h('div', { class: 'pj-detail-head' }, dStep, h('div', { class: 'pj-navs' }, prev, next)),
    dName, dBody,
    h('div', { class: 'pj-figs' }, dStat, dNote));

  root.append(
    h('div', { class: 'pj-head' },
      h('div', { class: 't-label', text: 'The journey' }),
      h('h3', { class: 'pj-title', text: pipe.title })),
    band, rail, detail);

  let scene = null;   // the 3D layer, once (and if) it loads

  function select(i) {
    active = Math.max(0, Math.min(stageCount - 1, i));
    const s = pipe.stages[active];
    dStep.textContent = `Stage ${active + 1} of ${stageCount}${NBSP}·${NBSP}${s.k}`;
    dName.textContent = s.name;
    dBody.textContent = s.d;
    dStat.textContent = s.stat;
    dNote.textContent = s.note;
    prev.disabled = active === 0;
    next.disabled = active === stageCount - 1;
    chips.forEach((c, n) => {
      c.setAttribute('aria-selected', String(n === active));
      c.tabIndex = n === active ? 0 : -1;      // roving focus across the tabs
      if (n < active) c.dataset.done = ''; else delete c.dataset.done;
      if (n === active) c.dataset.on = ''; else delete c.dataset.on;
    });
    detail.setAttribute('aria-labelledby', `${uid}-tab-${active}`);
    chips[active].scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    if (scene) scene.focus(active);
    // The detail text changes height, which changes how far this destination
    // has to pan — the scroll track is measured from real content.
    dispatchEvent(new Event('pj:resize'));
  }

  root.addEventListener('keydown', e => {
    let to = null;
    if (e.key === 'ArrowRight') to = active + 1;
    else if (e.key === 'ArrowLeft') to = active - 1;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = stageCount - 1;
    if (to == null) return;
    e.preventDefault();
    select(to);
    if (document.activeElement?.closest('.pj-rail')) chips[active].focus();
  });

  select(0);

  // ── the 3D layer loads only when the journey is actually looked at ──
  let booted = false;
  const io = new IntersectionObserver(entries => {
    for (const en of entries) {
      if (en.isIntersecting && !booted) {
        booted = true;
        boot();
      } else if (scene) {
        scene.setRunning(en.isIntersecting);
      }
    }
  }, { rootMargin: '120px' });
  io.observe(root);

  async function boot() {
    // Never on a narrow screen, and never against the user's stated preference:
    // the DOM journey is complete on its own.
    if (!use3D) return;
    try {
      const mod = await import('./pipeline3d.js');
      scene = await mod.createPipelineScene({ canvas, pipe, onPick: select });
      if (scene) { root.dataset.gl = ''; scene.focus(active); }
    } catch {
      // CDN unreachable, WebGL refused, anything at all: the DOM journey
      // is already on the page and loses nothing.
    }
  }

  root.destroy = () => { io.disconnect(); if (scene) scene.dispose(); };
  return root;
}
