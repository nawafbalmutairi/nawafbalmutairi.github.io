// Turns a project key into the item its face needs.
//
// One place builds this, so a project's face is identical wherever it appears —
// on the Work gallery and at the head of its own page. Everything comes from
// /content; nothing is restated here.

import { cases, further } from '../content/work.js';
import * as WQ from '../content/water-quality.js';

const HEX = { teal: '#5fe0cc', ochre: '#f0b357', violet: '#b49cff', ember: '#ff8a4c' };
const SHORT = {
  'water-quality': 'Water quality',
  'nvidia-bi': 'NVIDIA supply chain',
  'face-classifier': 'Face classification',
};

/** @param {string} key a case id, or a further-work title */
export function itemFor(key) {
  const c = cases.find(x => x.id === key);
  if (c) {
    return {
      id: c.id, index: c.index, kind: c.kind.split(' · ')[0],
      kicker: c.kind.split(' · ')[0], short: SHORT[c.id],
      title: c.title, lede: c.lede, brief: c.lede,
      stat: c.figures[0].v, statLabel: c.figures[0].k,
      tags: c.stack.slice(0, 4),
      accent: c.accent, hex: HEX[c.accent],
      face: c.face, metrics: c.figures, configs: c.configs,
      models: WQ.models,
      targets: WQ.targets.map(t => t.key),
      matrix: WQ.results.map(r => r.map(v => v.r2)),
      best: WQ.best,
    };
  }

  const i = further.findIndex(f => f.title === key);
  if (i < 0) return null;
  const fw = further[i];
  return {
    id: fw.title, index: String(i + 4).padStart(2, '0'), kind: fw.y,
    kicker: fw.y, title: fw.title, lede: fw.note, brief: fw.note,
    stat: fw.tags[0], statLabel: 'built with',
    tags: fw.tags, accent: 'ember', hex: HEX.ember,
    face: fw.face, figs: fw.figures,
  };
}
