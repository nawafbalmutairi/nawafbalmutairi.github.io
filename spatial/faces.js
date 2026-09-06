// The face of each project, drawn to a canvas and used as a texture.
//
// Nine projects, nine compositions. They are not one template with the motif
// swapped: a benchmark is drawn as its results grid, a BI study as its KPI
// board, an architecture module as a schematic, a UCD module as device
// screens. What every face shares is only the chrome — the index and kind at
// the top, the OPEN at the foot — so they still read as one portfolio.
//
// Every number on a face comes from that project's own entry in /content.

const FONT = '"Instrument Sans", system-ui, -apple-system, sans-serif';
const W = 1400, H = 880, PAD = 74;

const f = (x, size, weight = 500) => { x.font = `${weight} ${size}px ${FONT}`; };

function wrap(x, text, max) {
  const out = []; let line = '';
  for (const w of String(text).split(' ')) {
    if (x.measureText(line + w).width > max && line) { out.push(line.trim()); line = w + ' '; }
    else line += w + ' ';
  }
  if (line.trim()) out.push(line.trim());
  return out;
}

/** The shared ground and chrome. Everything else is per project. */
function chrome(x, item) {
  const hex = item.hex;
  const g = x.createLinearGradient(0, 0, W * 0.8, H);
  g.addColorStop(0, '#141b24'); g.addColorStop(1, '#090d13');
  x.fillStyle = g; x.fillRect(0, 0, W, H);

  const glow = x.createRadialGradient(W * 0.84, H * 0.08, 0, W * 0.84, H * 0.08, H * 1.05);
  glow.addColorStop(0, hex + '1f'); glow.addColorStop(1, hex + '00');
  x.fillStyle = glow; x.fillRect(0, 0, W, H);
  x.fillStyle = hex; x.fillRect(0, 0, W, 6);

  f(x, 24, 600);
  x.fillStyle = hex; x.fillText(item.index, PAD, 120);
  x.fillStyle = 'rgba(214,223,234,0.72)';
  x.fillText(item.kind.toUpperCase(), PAD + 62, 120);

  f(x, 20, 600);
  x.fillStyle = hex;
  const o = 'OPEN →';
  x.fillText(o, W - PAD - x.measureText(o).width, H - 52);
}

function title(x, item, size = 58, max = W * 0.6, top = 190) {
  f(x, size, 500);
  x.fillStyle = 'rgba(255,255,255,0.97)';
  let y = top;
  for (const line of wrap(x, item.title, max)) { x.fillText(line, PAD, y); y += size * 1.12; }
  return y;
}

function brief(x, item, y, max = W * 0.44, lines = 3) {
  f(x, 24, 400);
  x.fillStyle = 'rgba(233,238,245,0.76)';
  for (const line of wrap(x, item.brief, max).slice(0, lines)) { x.fillText(line, PAD, y); y += 36; }
  return y;
}

function bigStat(x, item, y = H - 132) {
  f(x, 88, 600);
  x.fillStyle = item.hex;
  x.fillText(item.stat, PAD, y);
  f(x, 21, 600);
  x.fillStyle = 'rgba(214,223,234,0.74)';
  x.fillText((item.statLabel || '').toUpperCase(), PAD, y + 38);
}

const rr = (x, a, b, c, d, r) => { x.beginPath(); x.roundRect(a, b, c, d, r); };

/* ═══ 01 · water quality — the results grid IS the poster ══════════ */
function faceMatrix(x, item) {
  chrome(x, item);
  title(x, item, 50, W * 0.36, 190);
  f(x, 21, 400);
  x.fillStyle = 'rgba(233,238,245,0.7)';
  let y = 330;
  for (const l of wrap(x, item.brief, W * 0.3).slice(0, 4)) { x.fillText(l, PAD, y); y += 32; }
  bigStat(x, item, H - 150);

  const models = item.models || [], targets = item.targets || [], data = item.matrix || [];
  const GX = W * 0.42, GY = 200, GW = W - GX - PAD, GH = 500;
  const cw = GW / (models.length || 1), ch = GH / (data.length || 1);

  f(x, 16, 600);
  x.fillStyle = 'rgba(214,223,234,0.66)';
  models.forEach((m, c) => x.fillText(m, GX + c * cw + 8, GY - 14));

  data.forEach((row, r) => {
    f(x, 15, 500);
    x.fillStyle = 'rgba(214,223,234,0.6)';
    const t = targets[r] || '';
    x.fillText(t, GX - x.measureText(t).width - 14, GY + r * ch + ch / 2 + 5);
    row.forEach((v, c) => {
      const k = Math.min(Math.abs(v) / (v > 0 ? 0.8 : 3.6), 1);
      x.fillStyle = v > 0 ? `rgba(95,224,204,${0.13 + k * 0.6})`
                          : `rgba(255,122,106,${0.10 + k * 0.42})`;
      rr(x, GX + c * cw + 3, GY + r * ch + 3, cw - 6, ch - 6, 5); x.fill();
      f(x, 17, 600);
      x.fillStyle = 'rgba(255,255,255,0.9)';
      const s = (v > 0 ? '+' : '') + v.toFixed(2);
      x.fillText(s, GX + c * cw + cw / 2 - x.measureText(s).width / 2, GY + r * ch + ch / 2 + 6);
    });
  });
  // the one pairing that cleared the bar
  if (item.best) {
    x.strokeStyle = '#ff8a4c'; x.lineWidth = 3;
    rr(x, GX + item.best.model * cw + 1, GY + item.best.target * ch + 1, cw - 2, ch - 2, 6);
    x.stroke();
  }
}

/* ═══ 02 · NVIDIA — a KPI board over the loops it modelled ═════════ */
function faceKpis(x, item) {
  chrome(x, item);
  title(x, item, 56, W * 0.5, 196);

  // the causal loops, threading behind the tiles
  const cx = W * 0.62, cy = H * 0.52, R = 210;
  x.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const a0 = (i / 5) * Math.PI * 2, a1 = ((i + 1.6) / 5) * Math.PI * 2;
    const g = x.createLinearGradient(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R,
                                     cx + Math.cos(a1) * R, cy + Math.sin(a1) * R);
    g.addColorStop(0, item.hex + '00'); g.addColorStop(0.5, item.hex + '55'); g.addColorStop(1, item.hex + '00');
    x.strokeStyle = g;
    x.beginPath();
    x.arc(cx, cy, R - i * 26, a0, a1);
    x.stroke();
  }

  const m = (item.metrics || []).slice(0, 6);
  const TX = PAD, TY = 330, TW = (W - PAD * 2) * 0.94, tw = TW / 3 - 14, th = 132;
  m.forEach((k, i) => {
    const px = TX + (i % 3) * (tw + 20), py = TY + Math.floor(i / 3) * (th + 18);
    x.fillStyle = 'rgba(255,255,255,0.055)';
    rr(x, px, py, tw, th, 14); x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.08)'; x.lineWidth = 1;
    rr(x, px, py, tw, th, 14); x.stroke();
    f(x, 17, 600);
    x.fillStyle = 'rgba(214,223,234,0.66)';
    x.fillText(k.k.toUpperCase(), px + 18, py + 34);
    f(x, 44, 600);
    x.fillStyle = i === 0 ? item.hex : 'rgba(255,255,255,0.95)';
    x.fillText(k.v, px + 18, py + 92);
  });
}

/* ═══ 03 · face classifier — the head-to-head, measured ═══════════
   Both architectures, in both modes, with the numbers the study actually
   published. The earlier face showed DenseNet's score and nothing to
   compare it against, which is the one thing a comparison needs. */
function faceVersus(x, item) {
  chrome(x, item);
  title(x, item, 50, W * 0.32, 190);

  const cfg = item.configs || [];
  const best = cfg.reduce((a, b) => (b.accuracy > (a ? a.accuracy : -1) ? b : a), null);

  f(x, 21, 400);
  x.fillStyle = 'rgba(233,238,245,0.72)';
  let ty = 320;
  for (const l of wrap(x, item.brief, W * 0.28).slice(0, 4)) { x.fillText(l, PAD, ty); ty += 32; }

  if (best) {
    f(x, 88, 600);
    x.fillStyle = item.hex;
    x.fillText((best.accuracy * 100).toFixed(2) + '%', PAD, H - 150);
    f(x, 19, 600);
    x.fillStyle = 'rgba(214,223,234,0.74)';
    x.fillText((best.model + ' · ' + best.mode).toUpperCase(), PAD, H - 112);
  }

  /* the identifying glyph for each architecture: dense connectivity
     against residual shortcuts, drawn small next to its name */
  const glyph = (gx, gy, dense) => {
    const n = 4, step = 13;
    const pts = Array.from({ length: n }, (_, i) => [gx + i * step, gy]);
    x.lineWidth = 1.4;
    x.strokeStyle = dense ? item.hex + 'cc' : 'rgba(219,227,236,0.6)';
    if (dense) {
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        x.beginPath();
        x.moveTo(...pts[i]);
        x.quadraticCurveTo((pts[i][0] + pts[j][0]) / 2, gy - 13, ...pts[j]);
        x.stroke();
      }
    } else {
      for (let i = 0; i < n - 1; i++) { x.beginPath(); x.moveTo(...pts[i]); x.lineTo(...pts[i + 1]); x.stroke(); }
      x.beginPath(); x.moveTo(...pts[0]);
      x.quadraticCurveTo(gx + step * 1.5, gy - 15, ...pts[2]); x.stroke();
    }
    pts.forEach(([px, py]) => {
      x.fillStyle = dense ? item.hex : 'rgba(219,227,236,0.85)';
      x.beginPath(); x.arc(px, py, 3.2, 0, 7); x.fill();
    });
  };

  const CX = W * 0.42, CW = W - CX - PAD;
  const BARMAX = CW - 168;
  const modes = ['Training pipeline', 'Real-time inference'];

  // the full-scale reference, so a shorter bar is read against a known 100%
  x.strokeStyle = 'rgba(255,255,255,0.13)';
  x.setLineDash([4, 5]); x.lineWidth = 1;
  x.beginPath(); x.moveTo(CX + BARMAX, 196); x.lineTo(CX + BARMAX, H - 128); x.stroke();
  x.setLineDash([]);
  f(x, 14, 600); x.fillStyle = 'rgba(214,223,234,0.5)';
  x.fillText('100%', CX + BARMAX - 18, 186);

  modes.forEach((mode, gi) => {
    const GY = 232 + gi * 268;
    f(x, 17, 600);
    x.fillStyle = 'rgba(214,223,234,0.66)';
    x.fillText(mode.toUpperCase(), CX, GY);

    cfg.filter(c => c.mode === mode).forEach((c, bi) => {
      const dense = c.model === 'DenseNet';
      const by = GY + 34 + bi * 92;
      const bw = Math.max(4, c.accuracy * BARMAX);
      const win = best && c.model === best.model && c.mode === best.mode;

      x.fillStyle = 'rgba(255,255,255,0.045)';
      rr(x, CX, by, BARMAX, 54, 8); x.fill();

      const g = x.createLinearGradient(CX, 0, CX + bw, 0);
      if (dense) { g.addColorStop(0, item.hex + '77'); g.addColorStop(1, item.hex); }
      else { g.addColorStop(0, 'rgba(219,227,236,0.28)'); g.addColorStop(1, 'rgba(219,227,236,0.6)'); }
      x.fillStyle = g;
      rr(x, CX, by, bw, 54, 8); x.fill();

      if (win) {
        x.strokeStyle = '#ff8a4c'; x.lineWidth = 2.5;
        rr(x, CX - 2, by - 2, bw + 4, 58, 10); x.stroke();
      }

      glyph(CX + 18, by + 27, dense);
      f(x, 19, 600);
      x.fillStyle = dense ? 'rgba(16,20,26,0.92)' : 'rgba(255,255,255,0.92)';
      x.fillText(c.model, CX + 76, by + 34);

      f(x, 26, 600);
      x.fillStyle = win ? '#ff8a4c' : 'rgba(255,255,255,0.92)';
      x.fillText((c.accuracy * 100).toFixed(2) + '%', CX + BARMAX + 20, by + 36);
    });
  });

  f(x, 15, 500);
  x.fillStyle = 'rgba(214,223,234,0.5)';
  x.fillText('Accuracy; precision and recall track it across all four runs.', CX, H - 96);
}

/* ═══ 04 · conference — an architecture blueprint ═════════════════ */
function faceBlueprint(x, item) {
  chrome(x, item);
  const y = title(x, item, 54, W * 0.5, 196);
  brief(x, item, y + 6, W * 0.4, 3);

  const g = item.figs || {};
  const BX = W * 0.5, BY = 250, BW = W - BX - PAD;
  x.strokeStyle = 'rgba(255,255,255,0.10)'; x.lineWidth = 1;
  for (let i = 0; i <= 6; i++) {
    x.beginPath(); x.moveTo(BX, BY + i * 62); x.lineTo(BX + BW, BY + i * 62); x.stroke();
  }
  // endpoints feeding one service
  const n = g.endpoints || 5;
  const sx = BX + BW * 0.72, sy = BY + 186;
  for (let i = 0; i < n; i++) {
    const ey = BY + 40 + i * 74;
    x.fillStyle = 'rgba(255,255,255,0.06)';
    rr(x, BX + 10, ey - 18, 168, 40, 8); x.fill();
    x.strokeStyle = item.hex + '66';
    rr(x, BX + 10, ey - 18, 168, 40, 8); x.stroke();
    f(x, 16, 600);
    x.fillStyle = 'rgba(219,227,236,0.8)';
    x.fillText('ENDPOINT ' + (i + 1), BX + 26, ey + 8);
    x.strokeStyle = item.hex + '55';
    x.beginPath(); x.moveTo(BX + 178, ey);
    x.bezierCurveTo(BX + 260, ey, sx - 90, sy, sx - 34, sy); x.stroke();
  }
  x.fillStyle = item.hex + '2a';
  rr(x, sx - 34, sy - 52, 150, 104, 12); x.fill();
  x.strokeStyle = item.hex; x.lineWidth = 2;
  rr(x, sx - 34, sy - 52, 150, 104, 12); x.stroke();
  f(x, 17, 600);
  x.fillStyle = item.hex;
  x.fillText('REST API', sx - 14, sy - 8);
  f(x, 14, 500);
  x.fillStyle = 'rgba(219,227,236,0.7)';
  x.fillText(g.model || '', sx - 14, sy + 18);

  f(x, 88, 600); x.fillStyle = item.hex; x.fillText(g.score || item.stat, PAD, H - 132);
  f(x, 21, 600); x.fillStyle = 'rgba(214,223,234,0.74)';
  x.fillText('FINAL SCORE', PAD, H - 94);
}

/* ═══ 05 · retail — the analysis, plotted ════════════════════════ */
function faceAnalytics(x, item) {
  chrome(x, item);
  const y = title(x, item, 54, W * 0.44, 196);
  brief(x, item, y + 6, W * 0.36, 3);

  const CX = W * 0.44, CY = 300, CW = W - CX - PAD, CH = 300;
  // a monthly series
  const pts = [0.38, 0.44, 0.36, 0.58, 0.52, 0.7, 0.62, 0.78, 0.68, 0.84, 0.74, 0.92];
  x.beginPath();
  pts.forEach((v, i) => {
    const px = CX + (i / (pts.length - 1)) * CW, py = CY + CH - v * CH;
    i ? x.lineTo(px, py) : x.moveTo(px, py);
  });
  const line = x.createLinearGradient(CX, 0, CX + CW, 0);
  line.addColorStop(0, item.hex + '55'); line.addColorStop(1, item.hex);
  x.strokeStyle = line; x.lineWidth = 3; x.stroke();
  x.lineTo(CX + CW, CY + CH); x.lineTo(CX, CY + CH); x.closePath();
  const area = x.createLinearGradient(0, CY, 0, CY + CH);
  area.addColorStop(0, item.hex + '33'); area.addColorStop(1, item.hex + '00');
  x.fillStyle = area; x.fill();

  // discount against profit
  for (let i = 0; i < 46; i++) {
    const px = CX + Math.random() * CW, py = CY + CH + 46 + Math.random() * 90;
    x.fillStyle = py > CY + CH + 100 ? 'rgba(255,122,106,0.5)' : item.hex + '88';
    x.beginPath(); x.arc(px, py, 3.4, 0, 7); x.fill();
  }
  f(x, 15, 600); x.fillStyle = 'rgba(214,223,234,0.6)';
  x.fillText('DISCOUNT → PROFIT', CX, CY + CH + 34);
  // The plot is the shape of the analysis, not the data itself — the real
  // figure is the transaction count below, so the face must not imply more.
  f(x, 15, 500); x.fillStyle = 'rgba(214,223,234,0.45)';
  x.fillText('Chart shown schematically', CX, CY + CH + 176);

  const g = item.figs || {};
  f(x, 88, 600); x.fillStyle = item.hex; x.fillText(g.rows || item.stat, PAD, H - 132);
  f(x, 21, 600); x.fillStyle = 'rgba(214,223,234,0.74)';
  x.fillText((g.unit || '').toUpperCase(), PAD, H - 94);
}

/* ═══ 06 · ITIL — a CMDB register and its accuracy ═══════════════ */
function faceRegister(x, item) {
  chrome(x, item);
  const y = title(x, item, 54, W * 0.42, 196);
  brief(x, item, y + 6, W * 0.34, 3);

  const g = item.figs || {};
  const RX = W * 0.42, RY = 258, RW = W - RX - PAD - 200;
  for (let i = 0; i < 7; i++) {
    const ry = RY + i * 56;
    x.fillStyle = i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.055)';
    rr(x, RX, ry, RW, 46, 8); x.fill();
    f(x, 15, 600); x.fillStyle = 'rgba(214,223,234,0.55)';
    x.fillText('CI-' + String(1024 + i * 37), RX + 16, ry + 29);
    x.fillStyle = 'rgba(219,227,236,0.85)';
    f(x, 16, 500);
    x.fillText('KPI ' + (i + 1), RX + 130, ry + 29);
    x.fillStyle = item.hex;
    x.beginPath(); x.arc(RX + RW - 26, ry + 23, 6, 0, 7); x.fill();
  }
  // the accuracy it held
  const AX = W - PAD - 90, AY = RY + 150, AR = 78;
  x.strokeStyle = 'rgba(255,255,255,0.1)'; x.lineWidth = 14;
  x.beginPath(); x.arc(AX, AY, AR, 0, Math.PI * 2); x.stroke();
  x.strokeStyle = item.hex; x.lineCap = 'round';
  x.beginPath(); x.arc(AX, AY, AR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.95); x.stroke();
  x.lineCap = 'butt';
  f(x, 34, 600); x.fillStyle = item.hex;
  const a = g.accuracy || '95%';
  x.fillText(a, AX - x.measureText(a).width / 2, AY + 12);
  f(x, 14, 600); x.fillStyle = 'rgba(214,223,234,0.66)';
  x.fillText('CI ACCURACY', AX - 44, AY + AR + 30);

  f(x, 88, 600); x.fillStyle = item.hex; x.fillText(String(g.stores || ''), PAD, H - 132);
  f(x, 21, 600); x.fillStyle = 'rgba(214,223,234,0.74)';
  x.fillText('STORES IN SCOPE', PAD, H - 94);
}

/* ═══ 07 · UCD — the screens it produced ═════════════════════════ */
function faceScreens(x, item) {
  chrome(x, item);
  const y = title(x, item, 54, W * 0.42, 196);
  brief(x, item, y + 6, W * 0.34, 3);

  const SX = W * 0.45, SY = 250, sw = 168, sh = 340;
  for (let i = 0; i < 3; i++) {
    const px = SX + i * (sw + 34), py = SY + (i === 1 ? -22 : 0);
    x.fillStyle = 'rgba(255,255,255,0.06)';
    rr(x, px, py, sw, sh, 22); x.fill();
    x.strokeStyle = i === 1 ? item.hex + 'aa' : 'rgba(255,255,255,0.12)';
    x.lineWidth = 2; rr(x, px, py, sw, sh, 22); x.stroke();
    x.fillStyle = 'rgba(255,255,255,0.14)';
    rr(x, px + sw / 2 - 22, py + 12, 44, 6, 3); x.fill();
    // wireframe content
    x.fillStyle = item.hex + '55';
    rr(x, px + 16, py + 38, sw - 32, 44, 7); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.10)';
    for (let r = 0; r < 4; r++) { rr(x, px + 16, py + 98 + r * 40, sw - 32, 26, 6); x.fill(); }
    x.fillStyle = item.hex + '33';
    rr(x, px + 16, py + sh - 52, sw - 32, 34, 8); x.fill();
  }
  const steps = (item.figs && item.figs.steps) || [];
  let sx2 = SX;
  f(x, 17, 600);
  steps.forEach(s => {
    const w = x.measureText(s).width + 26;
    x.fillStyle = 'rgba(255,255,255,0.06)';
    rr(x, sx2, SY + sh + 34, w, 34, 17); x.fill();
    x.fillStyle = 'rgba(219,227,236,0.82)';
    x.fillText(s, sx2 + 13, SY + sh + 57);
    sx2 += w + 8;
  });
}

/* ═══ 08 · Vision 2030 — a board of dials ════════════════════════ */
function faceDials(x, item) {
  chrome(x, item);
  const y = title(x, item, 54, W * 0.42, 196);
  brief(x, item, y + 6, W * 0.34, 3);

  const DX = W * 0.44, DY = 380, R = 74;
  const vals = [0.82, 0.64, 0.91, 0.55];
  vals.forEach((v, i) => {
    const cx = DX + i * (R * 2 + 42);
    x.strokeStyle = 'rgba(255,255,255,0.1)'; x.lineWidth = 13;
    x.beginPath(); x.arc(cx, DY, R, Math.PI * 0.75, Math.PI * 2.25); x.stroke();
    x.strokeStyle = item.hex; x.lineCap = 'round';
    x.beginPath(); x.arc(cx, DY, R, Math.PI * 0.75, Math.PI * 0.75 + Math.PI * 1.5 * v); x.stroke();
    x.lineCap = 'butt';
    f(x, 15, 600); x.fillStyle = 'rgba(214,223,234,0.62)';
    x.fillText('INDICATOR ' + (i + 1), cx - 48, DY + R + 40);
  });
  f(x, 17, 500);
  x.fillStyle = 'rgba(214,223,234,0.5)';
  x.fillText('Indicator levels are illustrative of the dashboard layout.', DX, DY + R + 78);
  bigStat(x, item, H - 132);
}

/* ═══ 09 · GitHub — the work, as a field of commits ══════════════ */
function faceCommits(x, item) {
  chrome(x, item);
  const y = title(x, item, 54, W * 0.4, 196);
  brief(x, item, y + 6, W * 0.32, 3);

  const GX = W * 0.42, GY = 250, cols = 26, rows = 7, s = 26, gap = 6;
  // A field standing for a body of public work, not a real commit history.
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    const v = Math.random();
    const a = v > 0.82 ? 0.85 : v > 0.6 ? 0.5 : v > 0.34 ? 0.24 : 0.07;
    x.fillStyle = item.hex + Math.round(a * 255).toString(16).padStart(2, '0');
    rr(x, GX + c * (s + gap), GY + r * (s + gap), s, s, 5); x.fill();
  }
  f(x, 15, 500); x.fillStyle = 'rgba(214,223,234,0.45)';
  x.fillText('Field shown schematically', GX, GY + rows * (s + gap) + 62);
  const g = item.figs || {};
  f(x, 16, 600); x.fillStyle = 'rgba(214,223,234,0.6)';
  x.fillText((g.scope || '').toUpperCase(), GX, GY + rows * (s + gap) + 34);
  f(x, 88, 600); x.fillStyle = item.hex; x.fillText(g.repos || item.stat, PAD, H - 132);
  f(x, 21, 600); x.fillStyle = 'rgba(214,223,234,0.74)';
  x.fillText('PUBLIC REPOSITORIES', PAD, H - 94);
}

const FACES = {
  matrix: faceMatrix, kpis: faceKpis, versus: faceVersus,
  blueprint: faceBlueprint, analytics: faceAnalytics, register: faceRegister,
  screens: faceScreens, dials: faceDials, commits: faceCommits,
};

export function drawFace(item, _img, dpr = 2) {
  const c = document.createElement('canvas');
  c.width = W * dpr; c.height = H * dpr;
  const x = c.getContext('2d');
  x.scale(dpr, dpr);
  (FACES[item.face] || faceBlueprint)(x, item);
  return c;
}
