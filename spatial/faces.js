// The face of each project, drawn to a canvas and used as a texture.
//
// Every project gets its own composition rather than a shared card template,
// and the motif on each one is drawn from that project's own data — the
// water-quality face plots the real R² grid, the supply-chain face draws the
// actual flow it modelled, the classifier face wires DenseNet against ResNet.
// A project that has a figure of its own leads with it; the rest are built
// from their numbers.

const FONT = '"Instrument Sans", system-ui, -apple-system, sans-serif';

function wrap(x, text, max, size, weight, lineH) {
  x.font = `${weight} ${size}px ${FONT}`;
  const out = [];
  let line = '';
  for (const w of text.split(' ')) {
    if (x.measureText(line + w).width > max && line) { out.push(line.trim()); line = w + ' '; }
    else line += w + ' ';
  }
  if (line.trim()) out.push(line.trim());
  return out;
}

function ground(x, W, H, hex) {
  const g = x.createLinearGradient(0, 0, W * 0.75, H);
  g.addColorStop(0, '#131a23');
  g.addColorStop(1, '#0a0e14');
  x.fillStyle = g; x.fillRect(0, 0, W, H);

  const glow = x.createRadialGradient(W * 0.82, H * 0.12, 0, W * 0.82, H * 0.12, H * 0.95);
  glow.addColorStop(0, hex + '22');
  glow.addColorStop(1, hex + '00');
  x.fillStyle = glow; x.fillRect(0, 0, W, H);

  x.fillStyle = hex; x.fillRect(0, 0, W, 6);
}

/* ── motif 01 · the R² grid, from the published values ─────────────── */
function motifMatrix(x, X, Y, W, H, data) {
  const rows = data.length, cols = data[0].length;
  const cw = W / cols, ch = H / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = data[r][c];
      const t = Math.min(Math.abs(v) / (v > 0 ? 0.8 : 3.6), 1);
      x.fillStyle = v > 0
        ? `rgba(95,224,204,${0.14 + t * 0.62})`
        : `rgba(255,122,106,${0.10 + t * 0.44})`;
      x.beginPath();
      x.roundRect(X + c * cw + 3, Y + r * ch + 3, cw - 6, ch - 6, 4);
      x.fill();
    }
  }
  // the one pairing that cleared the bar
  x.strokeStyle = '#ff8a4c'; x.lineWidth = 3;
  x.beginPath();
  x.roundRect(X + 3 * cw + 2, Y + 2 * ch + 2, cw - 4, ch - 4, 5);
  x.stroke();
}

/* ── motif 02 · the supply flow it modelled ────────────────────────── */
function motifFlow(x, X, Y, W, H, hex) {
  const nodes = [
    [0.06, 0.50], [0.30, 0.20], [0.30, 0.80], [0.58, 0.50], [0.86, 0.24], [0.86, 0.76],
  ].map(([a, b]) => [X + a * W, Y + b * H]);
  const edges = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5]];

  x.lineWidth = 2;
  for (const [a, b] of edges) {
    const [x1, y1] = nodes[a], [x2, y2] = nodes[b];
    const g = x.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, hex + '00'); g.addColorStop(0.5, hex + 'cc'); g.addColorStop(1, hex + '33');
    x.strokeStyle = g;
    x.beginPath();
    x.moveTo(x1, y1);
    x.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + (y2 - y1) * 0.35, x2, y2);
    x.stroke();
  }
  nodes.forEach(([cx, cy], i) => {
    const r = i === 3 ? 16 : 10;
    x.fillStyle = i === 3 ? hex : '#dbe4ee';
    x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
    if (i === 3) {
      x.strokeStyle = hex + '55'; x.lineWidth = 10;
      x.beginPath(); x.arc(cx, cy, r + 9, 0, 7); x.stroke();
    }
  });
}

/* ── motif 03 · dense connectivity against residual shortcuts ──────── */
function motifWiring(x, X, Y, W, H, hex) {
  const L = 5;
  const left = Array.from({ length: L }, (_, i) => [X + W * 0.22, Y + H * (0.12 + i * 0.19)]);
  const right = Array.from({ length: L }, (_, i) => [X + W * 0.78, Y + H * (0.12 + i * 0.19)]);

  x.lineWidth = 1.4;
  // dense: every earlier layer feeds every later one
  x.strokeStyle = hex + '66';
  for (let i = 0; i < L; i++) for (let j = i + 1; j < L; j++) {
    x.beginPath(); x.moveTo(...left[i]); x.lineTo(left[j][0] + 0, left[j][1]); x.stroke();
  }
  x.strokeStyle = hex + 'aa';
  for (let i = 0; i < L; i++) for (let j = i + 1; j < L; j++) {
    x.beginPath();
    x.moveTo(left[i][0], left[i][1]);
    x.quadraticCurveTo(X + W * 0.5, (left[i][1] + left[j][1]) / 2, left[j][0], left[j][1]);
    x.stroke();
  }
  // residual: identity shortcuts only
  x.strokeStyle = 'rgba(219,227,236,0.5)';
  for (let i = 0; i < L - 1; i++) {
    x.beginPath(); x.moveTo(...right[i]); x.lineTo(...right[i + 1]); x.stroke();
  }
  for (let i = 0; i < L - 2; i += 2) {
    x.beginPath();
    x.moveTo(right[i][0], right[i][1]);
    x.quadraticCurveTo(right[i][0] + W * 0.13, (right[i][1] + right[i + 2][1]) / 2,
      right[i + 2][0], right[i + 2][1]);
    x.stroke();
  }
  for (const set of [left, right]) {
    for (const [cx, cy] of set) {
      x.fillStyle = set === left ? hex : '#dbe4ee';
      x.beginPath(); x.arc(cx, cy, 7, 0, 7); x.fill();
    }
  }
  x.font = `600 20px ${FONT}`;
  x.fillStyle = hex;                x.fillText('DENSENET', X + W * 0.10, Y + H + 34);
  x.fillStyle = 'rgba(219,227,236,0.66)'; x.fillText('RESNET', X + W * 0.66, Y + H + 34);
}

/* ── motif 04 · a quiet field for the further work ─────────────────── */
function motifField(x, X, Y, W, H, hex) {
  x.strokeStyle = 'rgba(255,255,255,0.06)'; x.lineWidth = 1;
  for (let i = 0; i <= 8; i++) {
    x.beginPath(); x.moveTo(X, Y + (H / 8) * i); x.lineTo(X + W, Y + (H / 8) * i); x.stroke();
  }
  for (let i = 0; i <= 10; i++) {
    x.beginPath(); x.moveTo(X + (W / 10) * i, Y); x.lineTo(X + (W / 10) * i, Y + H); x.stroke();
  }
  x.fillStyle = hex + '2a';
  x.beginPath(); x.roundRect(X + W * 0.06, Y + H * 0.5, W * 0.34, H * 0.42, 6); x.fill();
  x.fillStyle = hex + '55';
  x.beginPath(); x.roundRect(X + W * 0.46, Y + H * 0.24, W * 0.2, H * 0.68, 6); x.fill();
  x.fillStyle = hex + '22';
  x.beginPath(); x.roundRect(X + W * 0.72, Y + H * 0.62, W * 0.22, H * 0.3, 6); x.fill();
}

/**
 * Draws one project's face.
 * @param {object} item  {index, kind, title, brief, stat, statLabel, tags, hex,
 *                        motif, matrix?, image?}
 * @param {HTMLImageElement|null} img  a decoded figure, if the project has one
 */
export function drawFace(item, img, dpr = 2) {
  const W = 1400, H = 880;
  const c = document.createElement('canvas');
  c.width = W * dpr; c.height = H * dpr;
  const x = c.getContext('2d');
  x.scale(dpr, dpr);
  const hex = item.hex;

  ground(x, W, H, hex);

  const PAD = 74;
  let y = 128;

  x.font = `600 24px ${FONT}`;
  x.fillStyle = hex;
  x.fillText(item.index, PAD, y);
  x.fillStyle = 'rgba(214,223,234,0.72)';
  x.fillText(item.kind.toUpperCase(), PAD + 60, y);

  y += 74;
  x.fillStyle = 'rgba(255,255,255,0.97)';
  const titleLines = wrap(x, item.title, W * 0.52, 62, 500, 70);
  for (const line of titleLines) { x.fillText(line, PAD, y); y += 70; }

  y += 12;
  x.fillStyle = 'rgba(233,238,245,0.78)';
  const briefLines = wrap(x, item.brief, W * 0.46, 25, 400, 38).slice(0, 4);
  for (const line of briefLines) { x.fillText(line, PAD, y); y += 38; }

  // the project's own motif, right-hand side
  const MX = W * 0.545, MY = 190, MW = W - MX - PAD, MH = 380;
  if (img) {
    // A project with a real artefact leads with it, seated on a plate.
    const ar = img.width / img.height;
    let w = MW, h = w / ar;
    if (h > MH) { h = MH; w = h * ar; }
    const ix = MX + (MW - w) / 2, iy = MY + (MH - h) / 2;
    x.save();
    x.beginPath(); x.roundRect(ix - 10, iy - 10, w + 20, h + 20, 12);
    x.fillStyle = 'rgba(255,255,255,0.05)'; x.fill();
    x.clip();
    x.globalAlpha = 0.94;
    x.drawImage(img, ix, iy, w, h);
    x.restore();
    x.strokeStyle = hex + '55'; x.lineWidth = 2;
    x.beginPath(); x.roundRect(ix - 10, iy - 10, w + 20, h + 20, 12); x.stroke();
  } else if (item.motif === 'matrix') {
    motifMatrix(x, MX, MY, MW, MH, item.matrix);
  } else if (item.motif === 'flow') {
    motifFlow(x, MX, MY, MW, MH, hex);
  } else if (item.motif === 'wiring') {
    motifWiring(x, MX, MY, MW, MH - 40, hex);
  } else {
    motifField(x, MX, MY, MW, MH, hex);
  }

  // the headline figure
  x.font = `600 96px ${FONT}`;
  x.fillStyle = hex;
  x.fillText(item.stat, PAD, H - 148);
  x.font = `600 22px ${FONT}`;
  x.fillStyle = 'rgba(214,223,234,0.74)';
  x.fillText((item.statLabel || '').toUpperCase(), PAD, H - 108);

  // tags
  let tx = PAD;
  x.font = `500 20px ${FONT}`;
  for (const t of (item.tags || []).slice(0, 5)) {
    const w = x.measureText(t).width + 28;
    x.fillStyle = 'rgba(255,255,255,0.07)';
    x.beginPath(); x.roundRect(tx, H - 74, w, 36, 18); x.fill();
    x.fillStyle = 'rgba(219,227,236,0.8)';
    x.fillText(t, tx + 14, H - 50);
    tx += w + 8;
  }

  // the affordance
  x.font = `600 20px ${FONT}`;
  x.fillStyle = hex;
  x.fillText('OPEN →', W - PAD - x.measureText('OPEN →').width, H - 50);

  return c;
}
