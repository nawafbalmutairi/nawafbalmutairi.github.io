// Builds the room from /content. No copy, figure or link is written here —
// everything comes from the data modules, which are the single source of truth.

import { profile, contact, destinations } from '../content/site.js';
import { cases, further } from '../content/work.js';
import { groups, journey, certificates } from '../content/stack-journey.js';
import * as WQ from '../content/water-quality.js';
import { panel, initParallax, initEnvironment } from '../spatial/panel.js';
import { makeDraggable } from '../spatial/drag.js';
import { pipelines } from '../content/pipelines.js';
import { buildJourney } from '../spatial/pipeline.js';
import { initTravel } from './travel.js';
import { buildGallery } from '../spatial/gallery.js';
import { itemFor } from '../spatial/faceitem.js';
import { buildSpatialExperience } from './spatial-experience.js';
import { buildProjectStory } from './project-story.js';

// The three projects that produced a real artefact. Module scope because both
// the gallery panels and the project overlay need it.
const ART = {
  'water-quality': './assets/case-water-4x3.webp',
  'nvidia-bi':     './assets/case-nvidia-4x3.webp',
  'US Retail Sales Analysis': './assets/case-retail.webp',
};

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

  // The room is a place, so its panels can be picked up and moved.
  for (const el of [bio, intent, status]) makeDraggable(el);

  s.append(bio, intent, status);
  return s;
}

/* ═══ 02 — WORK ════════════════════════════════════════════════════
   Each case leads with its own artefact, per the reference: the thing
   the project actually produced, not an abstract stand-in. */
function sceneWork() {
  const s = h('section', { class: 'scene', data: { id: 'work' }, 'aria-label': 'Work' });

  s.append(h('div', { class: 'sig sig-work' },
    h('h2', { class: 't-h1' }, 'Three systems,', h('span', { class: 'l2' }, 'measured.'))));

  // Everything shippable, in one gallery: the three case studies lead, the six
  // further projects follow. Figures that exist are used as textures; the two
  // projects with no figure of their own are drawn from their numbers.
  const HEX = { teal: '#5fe0cc', ochre: '#f0b357', violet: '#b49cff', ember: '#ff8a4c' };
  // The rail needs a name, not the headline — the full title is in the detail.
  const SHORT = {
    'water-quality': 'Water quality',
    'nvidia-bi': 'NVIDIA supply chain',
    'face-classifier': 'Face classification',
  };

  // Each project carries exactly what its own face draws — nine faces, nine
  // compositions, every number from that project's entry in /content.
  const items = [
    ...cases.map(c => ({
      id: c.id, index: c.index, kind: c.kind.split(' · ')[0],
      kicker: c.kind.split(' · ')[0], short: SHORT[c.id],
      title: c.title, lede: c.lede, brief: c.lede,
      stat: c.figures[0].v, statLabel: c.figures[0].k,
      tags: c.stack.slice(0, 4),
      accent: c.accent, hex: HEX[c.accent],
      face: c.face, art: ART[c.id],
      metrics: c.figures, configs: c.configs,
      models: WQ.models,
      targets: WQ.targets.map(t => t.key),
      matrix: WQ.results.map(r => r.map(v => v.r2)),
      best: WQ.best,
      open: c.id,
    })),
    ...further.map((fw, i) => ({
      id: fw.title, index: String(i + 4).padStart(2, '0'), kind: fw.y,
      kicker: fw.y, title: fw.title, lede: fw.note, brief: fw.note,
      stat: fw.tags[0], statLabel: 'built with',
      tags: fw.tags, accent: 'ember', hex: HEX.ember,
      face: fw.face, figs: fw.figures, art: ART[fw.title],
      href: fw.href, open: fw.title,
    })),
  ];

  const p = panel({ plane: 'near' });
  p.id = 'p-gallery';
  p.content.append(buildGallery(items, { onOpen: openStudy }));
  s.append(p);
  return s;
}

/* ═══ 03 — STACK ═══════════════════════════════════════════════════
   Browse disciplines, then inspect the projects where they were applied. */
function experienceScene(kind, entries) {
 const s=h('section',{class:'scene',data:{id:kind},'aria-label':kind==='stack'?'Stack':'Journey'});
 const p=panel({plane:'near'});p.classList.add('experience-panel');
 p.content.append(buildSpatialExperience({kind,entries,onProject:openStudy,certificates:certificates.items}));s.append(p);return s;
}
function evidence(ids){return ids.map(id=>({id,title:itemFor(id).short||itemFor(id).title}));}
function sceneStack(){
 const projects=[['water-quality','nvidia-bi','US Retail Sales Analysis'],['water-quality','face-classifier'],['Conference Microservices'],['UCD Work-Life App','ITIL Config Management']];
 const descriptions=['I turn raw records into comparable data, then into decisions: cleaning in Python, modelling with SQL and DAX, and communicating through Power BI.','I build reproducible comparisons: consistent preparation, explicit evaluation, and reporting failures alongside the strongest results.','I explore how systems fit together: service boundaries, interfaces, storage and deployment. These tools support my software architecture coursework.','I connect implementation to people and operations: research and prototypes in UCD, configuration management with ITIL, and version control throughout.'];
 const names=['Data / BI','Machine learning','Architecture','Process / design'];
 return experienceScene('stack',groups.map((g,i)=>({label:names[i],sceneLabel:names[i].toUpperCase(),title:g.label,eyebrow:g.note,description:descriptions[i],tools:g.tools.map(t=>t.n),projects:evidence(projects[i])})));
}
function sceneJourney(){
 const projects=[[],['US Retail Sales Analysis'],['face-classifier'],['nvidia-bi'],['Conference Microservices','ITIL Config Management','UCD Work-Life App'],['water-quality'],[],[]];
 const facts=[null,['2,121','transactions analysed'],['86.67%','real-time inference accuracy'],['96.4%','forecast accuracy'],['3','connected coursework disciplines'],['20','model × target experiments'],null,null];
 return experienceScene('journey',journey.map((j,i)=>({label:j.t,title:j.title,eyebrow:j.kind==='edu'?'Education':j.kind==='now'?'The next chapter':'Applied learning',description:j.d,projects:evidence(projects[i]),fact:facts[i],showCertificates:i===6})));
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
/* ═══ CASE STUDY OVERLAY ═══════════════════════════════════════════ */
let study, studyPanel, lastFocus, studyArtFrame = 0;

let studyAside, studyMain, studyShell;

function buildStudy() {
  study = h('div', { class: 'study', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Project' });
  studyAside = h('div', { class: 'study-aside' });
  studyMain = h('div', { class: 'study-main' });
  studyShell = h('div', { class: 'study-shell' }, studyAside, studyMain);
  studyPanel = studyShell;          // what openStudy fills; kept for the old name
  study.append(studyShell,
    h('button', { class: 'study-close', type: 'button', 'aria-label': 'Close project',
      onclick: closeStudy, html: '&times;' }));
  study.addEventListener('click', e => { if (e.target === study) closeStudy(); });
  return study;
}

/** One shape for the overlay, whichever kind of project it is.
 *
 *  The three cases carry prose, a stack and measured figures; the six further
 *  projects carry a note, tags and a small figures object. The overlay reads
 *  from whichever exists rather than inventing the missing half. */
function studySubject(key) {
  const c = cases.find(x => x.id === key);
  if (c) {
    return {
      c, title: c.title, lede: c.lede, href: c.href, accent: c.accent,
      // The year lives inside meta ("KV6013 · 2026 · Final-year project").
      // Pulled out rather than restated, so there is one source for it.
      year: (c.meta.match(/\b(20\d{2})\b/) || [])[1] || null,
      badge: c.kind.split(' · ')[0],
      art: ART[c.id] || null,
    };
  }
  const fw = further.find(f => f.title === key);
  if (!fw) return null;
  return {
    fw, title: fw.title, lede: fw.note, href: fw.href, accent: 'ember',
    year: fw.y,
    // A further project has no discipline field; its leading tag is the
    // nearest true thing, so that is what the second pill shows.
    badge: fw.tags[0],
    art: ART[fw.title] || null,
  };
}

/** The figures object on a further project, rendered as what it is. */
function furtherFigures(figs) {
  const rows = Object.entries(figs || {}).filter(([, v]) => v != null);
  if (!rows.length) return null;
  return h('dl', { class: 'study-facts' },
    rows.map(([k, v]) => [
      h('dt', { text: k.replace(/([a-z])([A-Z])/g, '$1 $2') }),
      h('dd', { text: Array.isArray(v) ? v.join(' · ') : String(v) }),
    ]).flat());
}

function openStudy(id) {
  const s = studySubject(id);
  if (!s) return;
  const c = s.c;
  cancelAnimationFrame(studyArtFrame);
  lastFocus = document.activeElement;
  study.dataset.accent = s.accent;

  // Project header above the full-width artwork and details.
  studyAside.replaceChildren(...[
    h('h2', { class: 'study-title', text: s.title }),
    h('p', { class: 'study-lede', text: s.lede }),
    h('div', { class: 'study-meta' },
      h('a', { class: 'study-out', href: s.href, target: '_blank', rel: 'noopener',
        'aria-label': `Open ${s.title} in a new tab` }, '↗'),
      s.year ? h('span', { class: 'study-pill', text: s.year }) : null,
      s.badge ? h('span', { class: 'study-pill', text: s.badge }) : null),
  ].filter(Boolean));

  studyMain.replaceChildren(buildProjectStory(itemFor(id), s));
  if (c?.id === 'water-quality') {
    const evaluation = h('section', { class: 'story-evaluation' }, studyWaterQuality());
    studyMain.querySelector('.project-story').insertBefore(evaluation, studyMain.querySelector('.project-story').lastElementChild);
  }

  studyMain.scrollTop = 0;
  studyShell.scrollTop = 0;
  study.dataset.open = '';
  // The page is a scroll track now, so the wheel would travel the room behind
  // the overlay. Lock it while the study is open; scrollY is preserved.
  document.documentElement.style.overflow = 'hidden';
  document.querySelector('.study-close').focus();
  addEventListener('keydown', onStudyKey);
}

function studyWaterQuality() {
  // The pipeline strip that used to sit here is now the interactive journey
  // above, which carries the same stages in more detail.
  return h('div', { style: 'margin-bottom:22px' },
    h('div', { class: 't-label', style: 'margin-bottom:4px', text: 'Evaluation — all 20 runs' }),
    h('p', { class: 't-small', style: 'margin:0 0 12px;max-width:70ch',
      text: 'R² below zero means the model did worse than predicting the mean. ' +
            'Nine of twenty combinations fall there; they are shown because they are the result.' }),
    fullMatrix());
}

function closeStudy() {
  cancelAnimationFrame(studyArtFrame);
  delete study.dataset.open;
  dispatchEvent(new Event('study:close'));
  document.documentElement.style.overflow = '';
  removeEventListener('keydown', onStudyKey);
  if (lastFocus) lastFocus.focus();
}
// aria-modal="true" is a promise that focus cannot leave the dialog. It was
// not being kept: with the overlay open, 19 of 24 Tab presses walked straight
// out into the rail, the dock and the gallery behind it. Escape alone is not
// a focus trap.
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), ' +
                  'select:not([disabled]), textarea:not([disabled]), ' +
                  '[tabindex]:not([tabindex="-1"])';

function onStudyKey(e) {
  if (e.key === 'Escape') { closeStudy(); return; }
  if (e.key !== 'Tab') return;

  // getClientRects() rather than offsetParent: everything in here descends
  // from a position:fixed overlay, where offsetParent is never null and so
  // would count hidden controls as focusable.
  const items = [...study.querySelectorAll(FOCUSABLE)]
    .filter(el => el.getClientRects().length > 0);
  if (!items.length) return;

  const first = items[0], last = items[items.length - 1];
  const at = document.activeElement;
  const outside = !study.contains(at);
  if (e.shiftKey ? (at === first || outside) : (at === last || outside)) {
    e.preventDefault();
    (e.shiftKey ? last : first).focus();
  }
}

/* ═══ NAVIGATION ═══════════════════════════════════════════════════
   Destinations are addressable, back/forward works, and the rail is a
   real set of buttons so the keyboard reaches every one. */
/* Absolutely positioned panels contribute scrollable overflow, but the
   container's padding-bottom does not extend past them — so the lowest panel
   ended up ~24px short of reachable. An in-flow spacer sized to the real
   content height fixes that exactly, without guessing. */
function fitScene(scene) {
  if (!scene) return;
  let low = 0;
  for (const el of scene.querySelectorAll('.panel, .sig')) {
    low = Math.max(low, el.offsetTop + el.offsetHeight);
  }
  scene.style.setProperty('--tail', low + 28 + 'px');
  // Told once, at the foot of the destination, only when there is more below.
  requestAnimationFrame(() => {
    if (scene.scrollHeight > scene.clientHeight + 4) scene.dataset.overflow = '';
    else delete scene.dataset.overflow;
  });
}

function fitActive() { fitScene(field.querySelector('.scene[data-active]')); }
addEventListener('resize', fitActive, { passive: true });

let travel = null;

/** Marks a destination current. Does not move anything — see go(). */
function mark(id, push = true) {
  if (!destinations.some(d => d.id === id)) id = destinations[0].id;
  active = id;
  for (const s of field.children) {
    if (s.dataset.id === id) s.dataset.active = '';
    else delete s.dataset.active;
  }
  railButtons.forEach((b, k) => b.setAttribute('aria-current', String(k === id)));
  if (push && location.hash.slice(1) !== id) history.replaceState({ id }, '', '#' + id);
  document.title = `${destinations.find(d => d.id === id).label} — Nawaf Almutairi`;
}

/** Goes to a destination. On a wide screen that means scrolling there, so the
    rail and the scrollbar always agree about where you are. */
function go(id, push = true) {
  const i = destinations.findIndex(d => d.id === id);
  if (travel && travel.enabled && i >= 0) {
    travel.goTo(i);
    return;
  }
  mark(id, push);
  const sc = field.querySelector('.scene[data-active]');
  if (sc) { sc.scrollTop = 0; fitScene(sc); }
}

addEventListener('popstate', () => go(location.hash.slice(1) || destinations[0].id, false));
// The journey's own panels change height as stages are picked.
addEventListener('pj:resize', () => travel?.remeasure());

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

const scenes = [...field.children];

// One cue, at the start, that leaves as soon as you move.
document.body.append(h('div', { class: 'travel-cue' }, 'Scroll to travel', h('span', {}, '↓')));
addEventListener('scroll', () => {
  if (scrollY > 40) document.documentElement.dataset.scrolled = '';
  else delete document.documentElement.dataset.scrolled;
}, { passive: true });

// A hash on load lands you at that destination rather than at the top.
const startId = location.hash.slice(1) || destinations[0].id;
const startAt = Math.max(0, destinations.findIndex(d => d.id === startId));

travel = initTravel({
  field, scenes, destinations,
  env: document.getElementById('env'),
  onEnter: id => mark(id, true),
  startIndex: startAt,
});

mark(startId, false);

const env = document.getElementById('env');
initEnvironment(env, {
  lqip: 'data:image/webp;base64,UklGRowCAABXRUJQVlA4WAoAAAAwAAAAFwAADQAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZBTFBISwAAAAFPoKhtIzanPG8h2QQvIuJTuCAAimLbSoYGWoEEtqeCFrAMNJAGEPj/FQEi+k8gaXMT7DGoRhDfB1BkWBuYqt4HHPfn8Ea8Hf2EAABWUDggSgAAAPADAJ0BKhgADgA+tUqhSqckIyGwCADgFoljAABbhHuMJJKm2fNvVqAA/vXIuUrF+j0rb/ZU8m/wHzS03L9Hq6L9HJnlHE+T3IAA',
  srcset: './assets/env-800.webp 800w, ./assets/env-1280.webp 1280w, ' +
          './assets/env-1920.webp 1920w, ./assets/env-2560.webp 2560w',
  sizes: '100vw',
});
initParallax({ env });
