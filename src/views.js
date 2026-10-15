// Отрисовка сцен: пицца сверху, застолье, титульный город.
import { R, shade, paint, shadow, glow, noise, dgrad, text3, text5, ell, rect, rrect, B4, hash, rng, person, scooter, drawTopAny, reduce } from './gfx.js';
import { SPOTS } from './data.js';
import { sliceOfSpot } from './sim.js';

const TAU = Math.PI * 2;
export const spotAngle = (i, rot) => TAU * (i + 0.5) / SPOTS + rot * TAU / SPOTS;
export const spotRadius = (i, Rr) => (i % 2 ? 0.46 : 0.7) * Rr;

// Пицца сверху. eaten — множество съеденных кусков, taken — взятых (в руках у гостей).
export function renderPizza(ctx, cx, cy, Rr, pizza, o = {}) {
  const rot = o.rotation || 0, n = pizza.cuts, eaten = o.eaten || new Set();
  const cw = Math.max(2, Math.round(Rr * 0.13));
  const sliceAt = (x, y) => { let a = Math.atan2(y, x) - rot * TAU / SPOTS; a = ((a % TAU) + TAU) % TAU; return Math.floor(a / (TAU / n)); };
  if (o.shadow !== false) shadow(ctx, cx + 2, cy + 3, Rr + 1, Rr, 0.35);
  const thick = pizza.dough === 'thick', thin = pizza.dough === 'thin';
  for (let y = -Rr; y <= Rr; y++) for (let x = -Rr; x <= Rr; x++) {
    const d0 = Math.hypot(x, y); if (d0 > Rr) continue;
    const s = sliceAt(x, y); if (eaten.has(s)) continue;
    const d = Rr - d0, h = hash(x + 500, y + 500, 1);
    const lit = (-x * 0.55 - y * 0.85) / Rr, t = B4[(cy + y) & 3][(cx + x) & 3] * 0.4;
    let c;
    const cwx = thick ? cw + 1 : thin ? cw - 1 : cw;
    if (d < 1) c = '#6d3a14';
    else if (d < cwx) {
      c = lit > 0.25 + t ? '#f0b968' : (lit < -0.25 + t ? '#a8642a' : '#d8913f');
      if (d < cwx * 0.45 && lit > -0.1) c = '#f6cd85';
      if (h % 23 === 0) c = '#8a4a1c';
      if (pizza.crust === 'cheese' && d > cwx * 0.5 && h % 4 === 0) c = '#ffe17a';
      if (pizza.crust === 'garlic' && h % 6 === 0) c = '#f6f0d8';
    } else if (d < cwx + 1.2) c = h % 3 ? '#c8442a' : '#a8341f';
    else {
      c = lit > 0.35 + t ? '#fde08a' : (lit < -0.4 + t ? '#e6a83a' : '#f6c84c');
      const b = hash(Math.floor((x + 600) / 3), Math.floor((y + 600) / 3), 9) % 100;
      if (b < 9) c = '#fff0b0'; else if (b < 13) c = '#e7952f'; else if (b < 15) c = '#d4672a';
      if (n > 1) {
        const ang = Math.atan2(y, x) - rot * TAU / SPOTS, sec = TAU / n;
        const f = ((ang % sec) + sec) % sec, dd = Math.min(f, sec - f) * d0;
        if (dd < 0.6 && d0 > 1.5) c = '#b9782c';
      }
    }
    R(ctx, cx + x, cy + y, 1, 1, c);
  }
  pizza.spots.forEach((id, i) => {
    const s = sliceOfSpot(i, n); if (eaten.has(s)) return;
    const a = spotAngle(i, rot), rr = spotRadius(i, Rr);
    const x = Math.round(cx + Math.cos(a) * rr), y = Math.round(cy + Math.sin(a) * rr);
    if (o.showSpots && !id) { R(ctx, x, y, 2, 2, 'rgba(150,70,20,.55)'); if (o.hover === i) { R(ctx, x - 2, y - 2, 5, 5, 'rgba(246,196,69,.55)'); } }
    if (id) drawTopAny(ctx, id, x, y);
    if (o.hover === i && id) { ctx.strokeStyle = '#f6c445'; ctx.strokeRect(x - 4.5, y - 4.5, 9, 9); }
  });
  if (o.labels) o.labels.forEach((v, s) => {
    if (eaten.has(s)) return;
    const a = (s + 0.5) * TAU / n + rot * TAU / SPOTS, rr = Rr * (n > 8 ? 0.84 : 0.22);
    const str = String(Math.round(v));
    text3(ctx, str, Math.round(cx + Math.cos(a) * rr - str.length * 2), Math.round(cy + Math.sin(a) * rr - 2), '#ffffff', '#3a1a08');
  });
}

export function pickSpot(mx, my, cx, cy, Rr, rot) {
  let best = -1, bd = 7.5;
  for (let i = 0; i < SPOTS; i++) {
    const a = spotAngle(i, rot), rr = spotRadius(i, Rr);
    const d = Math.hypot(mx - (cx + Math.cos(a) * rr), my - (cy + Math.sin(a) * rr));
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}

// Кухонная доска под пиццей
export function boardBg(W, H) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const g = Math.sin((y + Math.sin(x * 0.05) * 4) * 0.5 + hash(0, y, 4) % 3) * 0.5 + 0.5, t = B4[y & 3][x & 3];
    R(ctx, x, y, 1, 1, g + t * 0.3 > 0.7 ? '#a87444' : (g + t * 0.3 > 0.3 ? '#94643a' : '#7e5230'));
  }
  noise(ctx, 0, 0, W, H, ['#f4ece0', '#e8dcc8'], 0.012, 5);
  return c;
}

/* ---------- Застолье ---------- */
export const TABLE = { W: 320, H: 200, cx: 160, cy: 124, rx: 80, ry: 44, pr: 40, sy: 0.6 };

export function roomBg() {
  const { W, H, cx, cy, rx, ry } = TABLE;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const b = c.getContext('2d');
  // обои в полоску
  for (let y = 0; y < 60; y++) for (let x = 0; x < W; x++) R(b, x, y, 1, 1, (x % 12 < 6) ? '#6a4a6a' : '#5e405e');
  noise(b, 0, 0, W, 60, ['#7a5a7a', '#523652'], 0.05, 2);
  for (let x = 3; x < W; x += 12) for (let y = 4; y < 60; y += 10) R(b, x, y, 2, 2, '#8a6a8a');
  // окно с ночным городом
  paint(b, 20, 6, 56, 44, rect(56, 44), '#d8d0c0', { ol: '#5a4a3a', hi: '#f2ece0' });
  dgrad(b, 24, 10, 48, 36, ['#141028', '#24183a', '#3a2449']);
  for (let i = 0; i < 6; i++) { const h = 8 + hash(i, 1, 3) % 16; R(b, 24 + i * 8, 46 - h, 7, h, '#1a1426'); for (let k = 0; k < 3; k++) if (hash(i, k, 5) % 2) R(b, 26 + i * 8, 48 - h + k * 4, 2, 2, '#f6c45a'); }
  R(b, 47, 10, 2, 36, '#d8d0c0'); R(b, 24, 27, 48, 2, '#d8d0c0');
  // ковёр на стене (а как же)
  paint(b, 214, 6, 84, 44, rect(84, 44), '#8a1c24', { ol: '#3a0a0e', hi: '#b02c34' });
  for (let y = 0; y < 36; y++) for (let x = 0; x < 76; x++) { const u = Math.abs(x - 38), v = Math.abs(y - 18); if ((u + v) % 10 < 2) R(b, 218 + x, 10 + y, 1, 1, '#e6b04a'); else if ((u * v) % 17 === 3) R(b, 218 + x, 10 + y, 1, 1, '#2a5a8a'); }
  for (let x = 214; x < 298; x += 3) { R(b, x, 50, 1, 3, '#e6b04a'); R(b, x, 3, 1, 3, '#e6b04a'); }
  // плинтус и паркет
  R(b, 0, 60, W, 3, '#3a2418');
  for (let y = 63; y < H; y++) for (let x = 0; x < W; x++) { const row = Math.floor((y - 63) / 5), off = row % 2 ? 9 : 0; const seam = (y - 63) % 5 === 4 || (x + off) % 18 === 0; R(b, x, y, 1, 1, seam ? '#5a3a22' : ['#9a6a3a', '#8a5e32', '#a4744a'][hash(Math.floor((x + off) / 18), row, 3) % 3]); }
  // тень от стола
  shadow(b, cx + 4, cy + ry + 14, rx + 4, 10, 0.35);
  return c;
}

export function drawTableTop(ctx) {
  const { cx, cy, rx, ry } = TABLE;
  // ножки
  paint(ctx, cx - rx + 18, cy + 10, 6, ry + 6, rect(6, ry + 6), '#6a4026', { ol: '#2a160c' });
  paint(ctx, cx + rx - 24, cy + 10, 6, ry + 6, rect(6, ry + 6), '#6a4026', { ol: '#2a160c' });
  // столешница с клетчатой скатертью
  paint(ctx, cx - rx, cy - ry + 6, rx * 2, ry * 2, ell(rx * 2, ry * 2), '#7a4a2a', { ol: '#2a160c', hi: '#9a6a3a' });
  for (let y = -ry; y < ry; y++) for (let x = -rx; x < rx; x++) {
    const u = x / (rx - 3), v = y / (ry - 3); if (u * u + v * v > 1) continue;
    const check = (Math.floor((x + 200) / 8) + Math.floor((y + 200) / 5)) % 2;
    const edge = u * u + v * v > 0.86;
    let c = check ? '#f2ece4' : '#e2dcd2';
    if (edge) c = check ? '#d8483a' : '#f2ece4';
    if ((x + 200) % 8 === 0 || (y + 200) % 5 === 0) c = edge ? '#b83428' : '#d8cfc2';
    const lit = (-u * 0.4 - v * 0.8); if (lit < -0.55 && B4[(y + 200) & 3][(x + 200) & 3] > -0.1) c = shade(c, -0.12);
    R(ctx, cx + x, cy + y, 1, 1, c);
  }
  // тарелка
  paint(ctx, cx - 47, cy - 29, 94, 58, ell(94, 58), '#f8f6f2', { ol: '#9a948a', hi: '#ffffff', lo: '#e2ded6' });
}

// Проекция угла на стол: где сидит гость и где центр куска
export function seatXY(angle) { const s = Math.sin(angle); return [TABLE.cx + Math.cos(angle) * (TABLE.rx + 16), TABLE.cy + s * (TABLE.ry + (s < 0 ? 4 : 20))]; }
export function sliceXY(angle, k = 0.55) { return [TABLE.cx + Math.cos(angle) * TABLE.pr * k, TABLE.cy + Math.sin(angle) * TABLE.pr * k * TABLE.sy]; }

const pizzaBuf = typeof document !== 'undefined' ? document.createElement('canvas') : null;
export function drawPizzaOnTable(ctx, pizza, rotation, eaten) {
  const S = TABLE.pr * 2 + 6; pizzaBuf.width = S; pizzaBuf.height = S;
  const p = pizzaBuf.getContext('2d'); p.clearRect(0, 0, S, S);
  renderPizza(p, S >> 1, S >> 1, TABLE.pr, pizza, { rotation, eaten, shadow: false });
  ctx.drawImage(pizzaBuf, TABLE.cx - (S >> 1), TABLE.cy - Math.round((S >> 1) * TABLE.sy), S, Math.round(S * TABLE.sy));
}

export function drawSliceInHand(ctx, x, y, frac) {
  const w = Math.max(2, Math.round(8 * (1 - frac * 0.8)));
  paint(ctx, x, y, w, 6, (a, b) => a <= b * 1.4 + 1 && b < 6, '#f6c84c', { ol: '#8a5a10', hi: '#fde08a' });
  R(ctx, x, y, 2, 6, '#d8913f');
}

export function bubble(ctx, x, y, kind) {
  if (kind === 'heart') { paint(ctx, x, y, 9, 8, (a, b) => ell(5, 5)(a, b) || ell(5, 5)(a - 4, b) || (b >= 2 && Math.abs(a - 4) <= 6 - b), '#e2513b', { ol: '#6a140c', hi: '#ff9a86' }); return; }
  paint(ctx, x, y, 10, 10, rrect(10, 10, 2), '#ffffff', { ol: '#2a2a30' });
  if (kind === 'angry') { R(ctx, x + 4, y + 2, 2, 4, '#e2513b'); R(ctx, x + 4, y + 7, 2, 1, '#e2513b'); }
  if (kind === 'yuck') { R(ctx, x + 2, y + 3, 2, 1, '#3f9a4c'); R(ctx, x + 6, y + 3, 2, 1, '#3f9a4c'); R(ctx, x + 3, y + 6, 4, 1, '#3f9a4c'); R(ctx, x + 2, y + 7, 1, 1, '#3f9a4c'); R(ctx, x + 7, y + 7, 1, 1, '#3f9a4c'); }
  if (kind === 'wait') { R(ctx, x + 2, y + 5, 1, 1, '#555'); R(ctx, x + 5, y + 5, 1, 1, '#555'); R(ctx, x + 8, y + 5, 1, 1, '#555'); }
  if (kind === 'shield') { paint(ctx, x + 2, y + 2, 6, 6, ell(6, 6), '#f6c445', { ol: '#8a5a10' }); }
}

/* ---------- Титульная сцена ---------- */
export function cityScene(canvas) {
  const ctx = canvas.getContext('2d'); const W = canvas.width, H = canvas.height;
  const r = rng(42);
  const bg = document.createElement('canvas'); bg.width = W; bg.height = H; const b = bg.getContext('2d');
  dgrad(b, 0, 0, W, 96, ['#0c0918', '#151028', '#221838', '#352349', '#5a2f55', '#8a4258']);
  for (let i = 0; i < 70; i++) R(b, Math.floor(r() * W), Math.floor(r() * 60), 1, 1, r() < 0.2 ? '#ffffff' : '#8f84b4');
  paint(b, W - 66, 12, 20, 20, ell(20, 20), '#f4e8bc', { ol: '#c9b98a', hi: '#fffbe6', lo: '#d9c991', lx: -0.8, ly: -0.4 });
  glow(b, W - 56, 22, 40, 'rgba(255,240,190,A)', 0.12);
  const layer = (seed, y0, minH, maxH, col, win, stp) => {
    const L = document.createElement('canvas'); L.width = W * 2; L.height = H; const l = L.getContext('2d'); const q = rng(seed);
    for (let x = 0; x < W * 2;) {
      const w = 14 + Math.floor(q() * 26), h = minH + Math.floor(q() * (maxH - minH)), top = y0 - h;
      paint(l, x, top, w, h + 40, rect(w, h + 40), col, { ol: shade(col, -0.4), hi: shade(col, 0.12), lo: shade(col, -0.15), lx: -1, ly: 0 });
      if (q() < 0.4) { R(l, x + 3, top - 6, 1, 6, shade(col, 0.2)); R(l, x + 1, top - 6, 5, 1, shade(col, 0.2)); }
      for (let wy = top + 4; wy < y0 + 30; wy += stp) for (let wx = x + 3; wx < x + w - 3; wx += 4) {
        const hv = hash(wx, wy, seed);
        if (hv % win === 0) { const warm = hv % 3 !== 0; R(l, wx, wy, 2, 3, warm ? '#f6c45a' : '#9fd0ff'); R(l, wx, wy, 2, 1, warm ? '#ffe7a0' : '#d8f0ff'); }
      }
      if (q() < 0.22) { R(l, x + 2, top + 6, w - 4, 7, '#14101c'); R(l, x + 3, top + 7, w - 6, 5, '#e2513b'); R(l, x + 4, top + 8, w - 8, 3, '#ff9d86'); }
      x += w + (q() < 0.5 ? 0 : 2);
    }
    return L;
  };
  const far = layer(5, 96, 24, 56, '#2a1f3e', 4, 5), mid = layer(9, 108, 34, 72, '#1b1528', 3, 6);
  let raf = 0;
  function frame(t) {
    ctx.drawImage(bg, 0, 0);
    const s1 = reduce ? 0 : (t * 0.006) % W, s2 = reduce ? 0 : (t * 0.016) % W;
    ctx.drawImage(far, -Math.floor(s1), 0); ctx.drawImage(far, W * 2 - Math.floor(s1), 0);
    ctx.drawImage(mid, -Math.floor(s2), 0); ctx.drawImage(mid, W * 2 - Math.floor(s2), 0);
    R(ctx, 0, 108, W, 8, '#4a4252'); R(ctx, 0, 116, W, 2, '#7a7088');
    dgrad(ctx, 0, 118, W, H - 118, ['#2a2532', '#211d28', '#1a1720']);
    const dash = reduce ? 0 : Math.floor(t * 0.09) % 24; for (let x = -dash; x < W; x += 24) { R(ctx, x, 131, 12, 2, '#d8c46a'); }
    for (let k = 0; k < 3; k++) {
      const lp = reduce ? 60 + k * 130 : ((k * 140 - (t * 0.04)) % (W + 60) + W + 60) % (W + 60) - 30;
      glow(ctx, lp + 3, 58, 28, 'rgba(255,230,150,A)', 0.25);
      ctx.fillStyle = 'rgba(255,236,160,.07)'; ctx.beginPath(); ctx.moveTo(lp, 60); ctx.lineTo(lp - 18, 118); ctx.lineTo(lp + 24, 118); ctx.lineTo(lp + 6, 60); ctx.fill();
      paint(ctx, lp + 1, 58, 3, 58, rect(3, 58), '#4a4256', { ol: '#1a1622' }); paint(ctx, lp - 3, 55, 11, 4, rrect(11, 4, 1), '#4a4256', { ol: '#1a1622' }); R(ctx, lp - 1, 59, 7, 1, '#fff3b8');
    }
    const bob = reduce ? 0 : (Math.floor(t / 160) % 2);
    scooter(ctx, Math.round(W / 2 - 30), 84 + bob, t);
    if (!reduce) raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}

export function portrait(seed, look, w = 18, h = 34) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; c.className = 'px';
  const x = c.getContext('2d'); R(x, 0, 0, w, h, '#120d18'); person(x, 1, 3, seed, look || {});
  return c;
}
