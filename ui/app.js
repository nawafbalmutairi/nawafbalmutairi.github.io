// Builds the room from /content. No copy, figure or link is written here —
// everything comes from the data modules, which are the single source of truth.

import { profile, contact, destinations } from '../content/site.js';
import { cases, further } from '../content/work.js';
import { groups, journey, certificates } from '../content/stack-journey.js';
import * as WQ from '../content/water-quality.js';
import { panel, initParallax, initEnvironment } from '../spatial/panel.js';

/* ── tiny DOM helper ─────────────────────────────────────────────── */
function h(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'data') Object.assign(e.dataset, v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null) continue;
    e.append(kid.nodeType ? kid : document.createTextNode(kid));
  }
  return e;
}

const stage = document.getElementById('stage');
const field = h('div', { class: 'field', id: 'stage-content' });

/* ═══ CHROME ═══════════════════════════════════════════════════════
   The rail and the dock float nearest the camera and persist through
   every destination — they are objects in the room, not page furniture. */

let active = destinations[0].id;
const railButtons = new Map();

function buildRail() {
  const p = panel({ plane: 'near', tag: 'nav', className: 'chrome rail' });
  p.setAttribute('aria-label', 'Destinations');
  p.content.append(
    h('div', { class: 'rail-mark' },
      h('b', { text: 'Nawaf Almutairi' }),
      h('span', { text: 'NA' })),
    h('ol', {},
      destinations.map(d => {
        const b = h('button', {
          type: 'button',
          'aria-current': String(d.id === active),
          onclick: () => go(d.id),
        }, h('span', { class: 'n', text: d.index }), h('span', { text: d.label }));
        railButtons.set(d.id, b);
        return h('li', {}, b);
      })),
  );
  return p;
}

function buildDock() {
  const p = panel({ plane: 'near', className: 'chrome dock' });
  p.setAttribute('aria-label', 'Contact');
  // The dock is a row of links, so it does not use the padded inner surface.
  p.content.remove();
  contact.forEach((c, i) => {
    if (i) p.append(h('span', { class: 'sep', 'aria-hidden': 'true' }));
    p.append(h('a', {
      href: c.href, text: c.label,
      rel: c.href.startsWith('http') ? 'noopener' : null,
      target: c.href.startsWith('http') ? '_blank' : null,
      title: c.hint,
    }));
  });
  return p;
}

/* ═══ 01 — IDENTITY ════════════════════════════════════════════════ */
function sceneIdentity() {
  const s = h('section', { class: 'scene', data: { id: 'identity' }, 'aria-label': 'Identity' });

  // Display type set into the room itself, overlapped by the panels.
  s.append(h('div', { class: 'sig' },
    h('h1', { class: 't-display' },
      'Nawaf',
      h('span', { class: 'l2' }, 'Almutairi')),
    h('div', { class: 'disc', text: profile.discipline })));

  const bio = panel({ plane: 'near', tilt: -3 });
  bio.id = 'p-identity';
  bio.content.append(
    h('div', { class: 't-label', text: 'Identity' }),
    h('h2', { class: 't-h2', style: 'margin:10px 0 14px', text: profile.statement }),
    ...profile.bio.map(t => h('p', { class: 't-body', style: 'margin:0 0 12px', text: t })),
  );

  const intent = panel({ plane: 'mid', tilt: 2, rot: -0.5 });
  intent.id = 'p-intent';
  intent.content.append(
    h('div', { class: 't-label', text: 'Statement of intent' }),
    h('p', { class: 't-lede', style: 'margin:12px 0 0', text: profile.intent }),
  );

  const status = panel({ plane: 'mid', tilt: 4 });
  status.id = 'p-status';
  status.content.append(
    h('div', { class: 'kv' },
      h('div', {}, h('div', { class: 'k', text: 'Availability' }),
        h('div', { class: 'v live', text: profile.availability })),
      h('div', {}, h('div', { class: 'k', text: 'Based' }),
        h('div', { class: 'v', text: profile.location })),
      h('div', {}, h('div', { class: 'k', text: 'Community' }),
        h('div', { class: 'v', text: profile.affiliation }))),
  );

  s.append(bio, intent, status);
  return s;
}

/* ═══ 02 — WORK ════════════════════════════════════════════════════
   Each case leads with its own artefact, per the reference: the thing
   the project actually produced, not an abstract stand-in. */
function caseTile(c) {
  const visual = h('div', { class: 'case-visual', data: { accent: c.accent } });
  if (c.visual.kind === 'figure') {
    visual.append(h('img', {
      src: c.visual.src, alt: c.visual.alt, loading: 'lazy', decoding: 'async',
    }));
  } else if (c.visual.kind === 'matrix') {
    visual.append(miniMatrix());
  } else {
    visual.append(archMini(c));
  }

  return h('article', {
    class: 'case', tabindex: '0', role: 'button',
    'aria-label': `${c.title} — open case study`,
    onclick: () => openStudy(c.id),
    onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openStudy(c.id); } },
  },
    h('div', { class: 't-label' }, `${c.index} · ${c.kind}`),
    visual,
    h('div', {},
      h('h3', { class: 't-h3', style: 'margin-bottom:6px', text: c.title }),
      h('p', { class: 't-small', text: c.lede })),
    h('div', { class: 'case-figs' },
      c.figures.slice(0, 3).map(f =>
        h('div', { class: 'fig-chip' },
          h('b', { class: 't-num', text: f.v }),
          h('span', { text: f.k })))),
  );
}

function sceneWork() {
  const s = h('section', { class: 'scene', data: { id: 'work' }, 'aria-label': 'Work' });

  // The heading is signage in the room, like the name on Identity — not a
  // title bar bolted to the top of a panel.
  s.append(h('div', { class: 'sig sig-work' },
    h('h2', { class: 't-h1' }, 'Three systems,', h('span', { class: 'l2' }, 'measured.')),
    h('div', { class: 'disc', text: 'Every figure measured, not estimated' })));

  const depth = [
    { plane: 'near', tilt: -3, rot: -0.4 },
    { plane: 'mid',  tilt: 3,  rot: 0.6 },
    { plane: 'mid',  tilt: -5, rot: 0 },
  ];

  cases.forEach((c, i) => {
    const p = panel({ ...depth[i], interactive: true, tag: 'article' });
    p.id = 'p-case-' + i;
    p.setAttribute('role', 'button');
    p.setAttribute('aria-label', `${c.title} — open case study`);
    p.addEventListener('click', () => openStudy(c.id));
    p.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openStudy(c.id); }
    });
    p.content.append(caseBody(c));
    s.append(p);
  });

  const fw = panel({ plane: 'far', tilt: 4 });
  fw.id = 'p-further';
  fw.content.append(
    h('div', { class: 't-label', text: 'Further work · six projects' }),
    h('div', { class: 'further' },
      further.map(f => h('a', { href: f.href, target: '_blank', rel: 'noopener' },
        h('span', { class: 'y', text: f.y }),
        h('span', { class: 't', text: f.title })))),
  );
  s.append(fw);
  return s;
}

function caseBody(c) {
  const visual = h('div', { class: 'case-visual', data: { accent: c.accent } });
  if (c.visual.kind === 'figure') {
    visual.append(h('img', { src: c.visual.src, alt: c.visual.alt, loading: 'lazy', decoding: 'async' }));
  } else if (c.visual.kind === 'matrix') {
    visual.append(miniMatrix());
  } else {
    visual.append(archMini(c));
  }

  return h('div', { class: 'case' },
    h('div', { class: 't-label' }, `${c.index} · ${c.kind}`),
    visual,
    h('h3', { class: 't-h3', text: c.title }),
    h('p', { class: 't-small', style: 'margin:0', text: c.lede }),
    h('div', { class: 'case-figs' },
      c.figures.slice(0, 3).map(f =>
        h('div', { class: 'fig-chip' },
          h('b', { class: 't-num', text: f.v }),
          h('span', { text: f.k })))),
    h('div', { class: 'open-hint t-label', text: 'Open case study →' }),
  );
}

/* ═══ 03 — STACK ═══════════════════════════════════════════════════
   Four clusters at four depths. Weight comes from the data, so the
   tools used daily are literally nearer the camera. */
function sceneStack() {
  const s = h('section', { class: 'scene', data: { id: 'stack' }, 'aria-label': 'Stack' });
  const place = [
    { id: 'p-stack-a', plane: 'near', tilt: -4 },
    { id: 'p-stack-b', plane: 'mid',  tilt: 3, rot: 0.8 },
    { id: 'p-stack-c', plane: 'mid',  tilt: -2 },
    { id: 'p-stack-d', plane: 'far',  tilt: 5, rot: -1 },
  ];
  groups.forEach((g, i) => {
    const cfg = place[i];
    const p = panel({ plane: cfg.plane, tilt: cfg.tilt, rot: cfg.rot });
    p.id = cfg.id;
    p.content.append(
      h('div', { class: 't-label', text: `0${i + 1} · ${g.note}` }),
      h('h3', { class: 't-h3', style: 'margin-top:8px', text: g.label }),
      h('div', { class: 'tools' },
        g.tools.map(t => h('span', { class: 'tool', data: { w: String(t.w) }, text: t.n }))),
    );
    s.append(p);
  });
  return s;
}

/* ═══ 04 — JOURNEY ═════════════════════════════════════════════════ */
function sceneJourney() {
  const s = h('section', { class: 'scene', data: { id: 'journey' }, 'aria-label': 'Journey' });
  const p = panel({ plane: 'near' });
  p.id = 'p-journey';
  p.content.append(
    h('div', {},
      h('div', { class: 't-label', text: 'Journey' }),
      h('h2', { class: 't-h1', style: 'margin-top:8px', text: 'Sep 2023 → now.' })),
    h('div', { class: 'track-wrap' },
      h('span', { class: 'track-hint', text: 'scroll →' }),
      h('div', { class: 'track', tabindex: '0', role: 'group', 'aria-label': 'Timeline, scrolls horizontally' },
      journey.map(j =>
        h('article', { class: 'stop', data: { kind: j.kind } },
          h('div', { class: 't', text: j.t }),
          h('h3', { text: j.title }),
          h('p', { class: 't-small', style: 'margin:0', text: j.d }))),
      )),
  );

  // Certificates are a different kind of fact from a dated milestone, so they
  // sit as their own object rather than as one more stop on the track.
  const c = panel({ plane: 'mid', tilt: 4 });
  c.id = 'p-certs';
  c.content.append(
    h('div', { class: 't-label', text: certificates.note }),
    h('h3', { class: 't-h3', style: 'margin:8px 0 10px', text: certificates.label }),
    h('div', { class: 'tags' },
      certificates.items.map(i => h('span', { class: 'tag', text: i }))),
  );

  s.append(p, c);
  return s;
}

/* ═══ 05 — CONTACT ═════════════════════════════════════════════════ */
function sceneContact() {
  const s = h('section', { class: 'scene', data: { id: 'contact' }, 'aria-label': 'Contact' });

  const p = panel({ plane: 'near', tilt: -2 });
  p.id = 'p-contact';
  p.content.append(
    h('div', { class: 't-label', text: 'Contact' }),
    h('h2', { class: 't-display', style: 'margin-top:14px' }, 'Let’s build', h('br'), 'something.'),
    h('p', { class: 't-lede', style: 'margin:20px 0 0;max-width:34ch',
      text: profile.availability + ' · ' + profile.location }),
  );

  const r = panel({ plane: 'mid', tilt: 4 });
  r.id = 'p-reach';
  r.content.append(
    h('div', { class: 't-label', text: 'Reach' }),
    h('div', { class: 'reach' },
      contact.map(c => h('a', {
        href: c.href,
        target: c.href.startsWith('http') ? '_blank' : null,
        rel: c.href.startsWith('http') ? 'noopener' : null,
      }, h('span', { text: c.label }), h('span', { class: 'h', text: c.hint })))),
  );

  s.append(p, r);
  return s;
}

/* ═══ THE WATER-QUALITY SURFACE ════════════════════════════════════
   Twenty model × target combinations. Negative R² means the model did
   worse than predicting the mean — those are half the result and they
   are rendered, never hidden. Built in DOM: 20 cells do not need WebGL. */
function r2Colour(r) {
  if (r > 0) {
    const t = Math.min(r / 0.8, 1);
    return `rgba(95, 224, 204, ${0.1 + t * 0.5})`;
  }
  const t = Math.min(Math.abs(r) / 3.6, 1);
  return `rgba(255, 122, 106, ${0.08 + t * 0.36})`;
}

function miniMatrix() {
  const g = h('div', {
    style: 'display:grid;grid-template-columns:repeat(4,1fr);gap:2px;padding:8px;height:100%',
  });
  WQ.results.forEach((row, ti) =>
    row.forEach((cell, mi) => {
      const isBest = ti === WQ.best.target && mi === WQ.best.model;
      g.append(h('div', {
        style: `border-radius:3px;background:${isBest ? 'var(--accent)' : r2Colour(cell.r2)}`,
      }));
    }));
  return g;
}

function fullMatrix() {
  const wrap = h('div', { style: 'overflow-x:auto' });
  const t = h('table', {
    style: 'border-collapse:separate;border-spacing:3px;width:100%;min-width:520px',
  });
  t.append(h('thead', {}, h('tr', {},
    h('th', { class: 't-label', style: 'text-align:left;padding:6px 8px', text: 'Target' }),
    WQ.models.map(m => h('th', { class: 't-label', style: 'padding:6px 8px', text: m })))));

  const tb = h('tbody');
  WQ.targets.forEach((tg, ti) => {
    const tr = h('tr', {},
      h('th', { scope: 'row', style: 'text-align:left;padding:8px;font-weight:400;font-size:.86rem;color:var(--ink-2)' },
        tg.key, tg.unit ? h('span', { style: 'color:var(--ink-4)', text: ' ' + tg.unit }) : null));
    WQ.results[ti].forEach((c, mi) => {
      const isBest = ti === WQ.best.target && mi === WQ.best.model;
      tr.append(h('td', {
        style: `padding:8px 10px;border-radius:8px;text-align:right;background:${isBest ? 'rgba(255,138,76,.26)' : r2Colour(c.r2)};` +
               (isBest ? 'box-shadow:inset 0 0 0 1px var(--accent);' : ''),
        title: `${tg.key} × ${WQ.models[mi]} — R² ${c.r2.toFixed(3)}, RMSE ${c.rmse}, MAE ${c.mae}`,
      },
        h('div', { class: 't-num', style: 'font-size:.94rem', text: (c.r2 > 0 ? '+' : '') + c.r2.toFixed(3) }),
        h('div', { style: 'font-size:.64rem;color:var(--ink-3);font-variant-numeric:tabular-nums',
          text: `RMSE ${c.rmse} · MAE ${c.mae}` })));
    });
    tb.append(tr);
  });
  t.append(tb);
  wrap.append(t);
  return wrap;
}

// The face-classifier panel has no figure in its repo, so it renders the
// architecture comparison from the numbers instead of a screenshot.
function archMini() {
  const g = h('div', { style: 'display:grid;place-items:center;height:100%;gap:6px' });
  g.append(
    h('div', { class: 't-num', style: 'font-size:1.6rem;color:var(--violet)', text: '86.7%' }),
    h('div', { class: 't-label', text: 'DenseNet · test' }),
  );
  return g;
}

/* ═══ CASE STUDY OVERLAY ═══════════════════════════════════════════ */
let study, studyPanel, lastFocus;

function buildStudy() {
  study = h('div', { class: 'study', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Case study' });
  studyPanel = panel({ plane: 'near' });
  study.append(studyPanel,
    h('button', { class: 'study-close', type: 'button', 'aria-label': 'Close case study',
      onclick: closeStudy, html: '&times;' }));
  study.addEventListener('click', e => { if (e.target === study) closeStudy(); });
  return study;
}

function openStudy(id) {
  const c = cases.find(x => x.id === id);
  if (!c) return;
  lastFocus = document.activeElement;
  studyPanel.content.replaceChildren(
    h('div', { class: 't-label' }, `${c.index} · ${c.kind} · ${c.meta}`),
    h('h2', { class: 't-h1', style: 'margin:10px 0 14px', text: c.title }),
    h('p', { class: 't-lede', style: 'margin:0 0 10px', text: c.lede }),
    h('p', { class: 't-body', style: 'margin:0 0 18px;max-width:74ch', text: c.body }),
    h('div', { class: 'tags', style: 'margin-bottom:22px' },
      c.stack.map(t => h('span', { class: 'tag', text: t }))),

    // Figures first: this is a portfolio of measurements.
    h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px' },
      c.figures.map(f => h('div', { class: 'fig-chip', style: 'padding:10px 14px' },
        h('b', { class: 't-num', style: 'font-size:1.3rem', text: f.v }),
        h('span', { text: f.k }),
        h('span', { style: 'text-transform:none;letter-spacing:0;color:var(--ink-4)', text: f.n })))),

    c.id === 'water-quality' ? studyWaterQuality() : null,
    c.visual.kind === 'figure' ? h('figure', { style: 'margin:0 0 18px' },
      h('img', { src: c.visual.src, alt: c.visual.alt, loading: 'lazy',
        style: 'width:100%;height:auto;border-radius:12px;display:block' }),
      h('figcaption', { class: 't-small', style: 'margin-top:8px', text: c.visual.cap })) : null,

    c.note ? h('p', { class: 't-small', style: 'margin:0 0 18px;color:var(--ink-3)', text: c.note }) : null,
    h('a', { class: 'tag', href: c.href, target: '_blank', rel: 'noopener',
      style: 'display:inline-block;padding:11px 18px;font-size:.9rem',
      text: 'Read the full case study ↗' }),
  );
  study.dataset.open = '';
  document.querySelector('.study-close').focus();
  addEventListener('keydown', onStudyKey);
}

function studyWaterQuality() {
  return h('div', { style: 'margin-bottom:22px' },
    h('div', { class: 't-label', style: 'margin-bottom:10px', text: 'Pipeline' }),
    h('div', { style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:24px' },
      WQ.pipeline.map(p => h('div', {
        style: 'padding:12px;border-radius:12px;background:rgba(255,255,255,.05)',
      },
        h('div', { class: 't-label', text: `${p.n} · ${p.k}` }),
        h('div', { class: 't-num', style: 'font-size:1.05rem;margin:4px 0 3px', text: p.v }),
        h('div', { class: 't-small', style: 'font-size:.76rem', text: p.d })))),
    h('div', { class: 't-label', style: 'margin-bottom:4px', text: 'Evaluation — all 20 runs' }),
    h('p', { class: 't-small', style: 'margin:0 0 12px;max-width:70ch',
      text: 'R² below zero means the model did worse than predicting the mean. ' +
            'Nine of twenty combinations fall there; they are shown because they are the result.' }),
    fullMatrix());
}

function closeStudy() {
  delete study.dataset.open;
  removeEventListener('keydown', onStudyKey);
  if (lastFocus) lastFocus.focus();
}
function onStudyKey(e) { if (e.key === 'Escape') closeStudy(); }

/* ═══ NAVIGATION ═══════════════════════════════════════════════════
   Destinations are addressable, back/forward works, and the rail is a
   real set of buttons so the keyboard reaches every one. */
function go(id, push = true) {
  if (!destinations.some(d => d.id === id)) id = destinations[0].id;
  active = id;
  for (const s of field.children) {
    if (s.dataset.id === id) s.dataset.active = '';
    else delete s.dataset.active;
  }
  railButtons.forEach((b, k) => b.setAttribute('aria-current', String(k === id)));
  if (push && location.hash.slice(1) !== id) history.pushState({ id }, '', '#' + id);
  document.title = `${destinations.find(d => d.id === id).label} — Nawaf Almutairi`;
}

addEventListener('popstate', () => go(location.hash.slice(1) || destinations[0].id, false));

// Arrow keys move between destinations when focus is not in a control.
addEventListener('keydown', e => {
  if (study?.dataset.open !== undefined) return;
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  const i = destinations.findIndex(d => d.id === active);
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    if (i < destinations.length - 1) { e.preventDefault(); go(destinations[i + 1].id); }
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    if (i > 0) { e.preventDefault(); go(destinations[i - 1].id); }
  }
});

/* ═══ BOOT ═════════════════════════════════════════════════════════ */
field.append(sceneIdentity(), sceneWork(), sceneStack(), sceneJourney(), sceneContact());
stage.append(buildRail(), field, buildDock());
document.body.append(buildStudy());

go(location.hash.slice(1) || destinations[0].id, false);

const env = document.getElementById('env');
initEnvironment(env, {
  lqip: 'data:image/webp;base64,UklGRowCAABXRUJQVlA4WAoAAAAwAAAAFwAADQAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZBTFBISwAAAAFPoKhtIzanPG8h2QQvIuJTuCAAimLbSoYGWoEEtqeCFrAMNJAGEPj/FQEi+k8gaXMT7DGoRhDfB1BkWBuYqt4HHPfn8Ea8Hf2EAABWUDggSgAAAPADAJ0BKhgADgA+tUqhSqckIyGwCADgFoljAABbhHuMJJKm2fNvVqAA/vXIuUrF+j0rb/ZU8m/wHzS03L9Hq6L9HJnlHE+T3IAA',
  srcset: './assets/env-800.webp 800w, ./assets/env-1280.webp 1280w, ' +
          './assets/env-1920.webp 1920w, ./assets/env-2560.webp 2560w',
  sizes: '100vw',
});
initParallax({ env });
