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

/* ---------- Иконки 8×8 для интерфейса ---------- */
const PAL = { k: '#120d18', y: '#f6c445', Y: '#fff0a0', o: '#b8761c', w: '#ffffff', r: '#e2513b', R: '#ff9a86', g: '#74c34f', b: '#55a8e0', s: '#f4d3b5', n: '#8a5a3a', d: '#a995b5' };
const ICONS = {
  coin:  ['..kkkk..', '.kyyyyk.', 'kyYyyyok', 'kyYkyyok', 'kyYkyyok', 'kyyyyook', '.kyoook.', '..kkkk..'],
  clock: ['..kkkk..', '.kwwwwk.', 'kwwkwwwk', 'kwwkwwwk', 'kwwkkkwk', 'kwwwwwwk', '.kwwwwk.', '..kkkk..'],
  guest: ['...kk...', '..kssk..', '..kssk..', '...kk...', '.kbbbbk.', 'kbbbbbbk', 'kbbbbbbk', 'kkkkkkkk'],
  star:  ['...kk...', '..kyyk..', 'kkkyykkk', 'kyyYyyyk', '.kyyyyk.', '..kyyk..', '.kyokyk.', '.kk..kk.'],
  heart: ['.kk..kk.', 'kRrkkrrk', 'kRrrrrrk', 'krrrrrrk', '.krrrrk.', '..krrk..', '...kk...', '........'],
  cross: ['kk....kk', 'krk..krk', '.krkkrk.', '..krrk..', '..krrk..', '.krkkrk.', 'krk..krk', 'kk....kk'],
  fire:  ['...k....', '..krk...', '..krrk.k', '.krryrkk', '.kryYyrk', 'kryYYyrk', 'kryYYyrk', '.kkkkkk.'],
  home:  ['...kk...', '..krrk..', '.krrrrk.', 'krrrrrrk', '.kwwwwk.', '.kwkkwk.', '.kwknwk.', '.kkkkkk.'],
  cart:  ['k.......', 'kkkkkkkk', '.kbbbbk.', '.kbbbbk.', '..kkkk..', '........', '.kk..kk.', '.kk..kk.'],
  bench: ['........', 'kkkkkkkk', 'knnnnnnk', 'kkkkkkkk', 'knnnnnnk', 'kkkkkkkk', '.k....k.', '.k....k.'],
  crown: ['........', 'k..kk..k', 'kykyykyk', 'kyyyyyyk', 'kyrYyryk', 'kyyyyyyk', 'kkkkkkkk', '........'],
};
export function ico(name) {
  const c = document.createElement('canvas'); c.width = 8; c.height = 8; c.className = 'ico px';
  const x = c.getContext('2d');
  (ICONS[name] || []).forEach((row, y) => [...row].forEach((ch, i) => { if (PAL[ch]) R(x, i, y, 1, 1, PAL[ch]); }));
  return c;
}

// Лицо гостя крупным планом (голова без туловища)
export function face(seed, look) {
  const c = document.createElement('canvas'); c.width = 16; c.height = 14; c.className = 'px';
  person(c.getContext('2d'), 0, 1, seed, { ...(look || {}), crown: false });
  return c;
}

const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

/* ---------- Карта города ---------- */
export const MAP = {
  loc: { 'Спальник': [90, 50], 'Центр': [306, 44], 'Студгородок': [82, 150], 'Промзона': [432, 146], 'Дачи': [430, 46], boss: [213, 76], pizzeria: [268, 136], shop: [326, 200], rest: [210, 190] },
  depot: [244, 176],
};
const riverX = y => 170 + Math.sin(y / 37) * 8 - (y - 135) * 0.05;

function bld(b, x, y, w, d, hh, o, wins) {
  b.fillStyle = 'rgba(0,0,0,.28)'; b.fillRect(x + 3, y + 3, w, d + hh);
  paint(b, x, y + d, w, hh, rect(w, hh), o.wall, { ol: shade(o.wall, -0.5), hi: shade(o.wall, 0.12) });
  const sx = o.wx || 4, sy = o.wy || 4;
  for (let wy = y + d + 2; wy + 2 < y + d + hh - 1; wy += sy) for (let wx = x + 2; wx + 2 <= x + w - 2; wx += sx) { R(b, wx, wy, 2, 2, o.win); wins.push([wx, wy]); }
  paint(b, x, y, w, d, rect(w, d), o.roof, { ol: shade(o.roof, -0.5), hi: shade(o.roof, 0.18) });
  if (o.door !== false) R(b, x + (w >> 1) - 1, y + d + hh - 4, 3, 3, '#2a1a10');
}
function tree(b, x, y, s) {
  shadow(b, x + 2, y + s + 1, s, 2, 0.3);
  R(b, x, y + s - 1, 2, 3, '#5a3a1a');
  paint(b, x - s + 1, y - s, s * 2, s * 2, ell(s * 2, s * 2), '#3f8a3a', { ol: '#1e4a1e', hi: '#6ac25a', lo: '#2f6e2c' });
}
function lot(b, x, y, w, h) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) R(b, x + i, y + j, 1, 1, B4[j & 3][i & 3] > 0.3 ? '#9a9488' : '#8e887c');
  b.strokeStyle = '#6a665c'; b.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

export function cityMap() {
  const Wd = 480, Ht = 270, day = mk(Wd, Ht), b = day.getContext('2d');
  const wins = [], chimneys = [], lamps = [];
  for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) {
    const n = hash(x >> 2, y >> 2, 3) % 100 + B4[y & 3][x & 3] * 40;
    R(b, x, y, 1, 1, n > 62 ? '#5d9c47' : n > 20 ? '#53913f' : '#4a8639');
  }
  noise(b, 0, 0, Wd, Ht, ['#6fb455', '#3f7a32'], 0.03, 11);
  for (let y = 0; y < Ht; y++) {
    const c = Math.round(riverX(y));
    for (let x = c - 11; x <= c + 11; x++) {
      const d = Math.abs(x - c);
      R(b, x, y, 1, 1, d > 9 ? (hash(x, y, 2) % 5 ? '#c8b47a' : '#b8a46a') : d > 8 ? '#2a5a8a' : hash(x, y >> 1, 4) % 23 === 0 ? '#8ac0ea' : (y + (x >> 2)) % 9 === 0 ? '#4a86c0' : '#3a72b0');
    }
  }
  const ROAD = '#56525e', EDGE = '#3a3640';
  const hroad = (x0, x1, y) => { R(b, x0, y - 3, x1 - x0, 7, ROAD); R(b, x0, y - 4, x1 - x0, 1, EDGE); R(b, x0, y + 4, x1 - x0, 1, EDGE); for (let x = x0; x < x1; x += 6) R(b, x, y, 3, 1, '#d8c46a'); for (let x = x0 + 14; x < x1; x += 44) lamps.push([x, y - 6]); };
  const vroad = (x, y0, y1) => { R(b, x - 3, y0, 7, y1 - y0, ROAD); R(b, x - 4, y0, 1, y1 - y0, EDGE); R(b, x + 4, y0, 1, y1 - y0, EDGE); for (let y = y0; y < y1; y += 6) R(b, x, y, 1, 3, '#d8c46a'); for (let y = y0 + 14; y < y1; y += 44) lamps.push([x + 6, y]); };
  hroad(0, Wd, 130); vroad(240, 18, Ht); vroad(384, 18, Ht); hroad(240, 388, 248);
  R(b, 236, 127, 9, 7, ROAD); R(b, 380, 127, 9, 7, ROAD); R(b, 236, 245, 9, 7, ROAD); R(b, 380, 245, 9, 7, ROAD);
  { const c = Math.round(riverX(130)); R(b, c - 13, 125, 27, 1, '#c8a46a'); R(b, c - 13, 135, 27, 1, '#c8a46a'); for (let x = c - 13; x <= c + 13; x += 4) { R(b, x, 124, 1, 2, '#8a6a3a'); R(b, x, 134, 1, 2, '#8a6a3a'); } }
  // Спальник
  lot(b, 28, 52, 124, 70);
  for (const [x, y] of [[34, 56], [94, 56], [34, 88], [94, 88]]) bld(b, x, y, 52, 9, 18, { roof: '#7a7680', wall: '#c8bca8', win: '#3a4458' }, wins);
  // Центр
  lot(b, 254, 40, 122, 82);
  for (const [x, w, d, hh] of [[258, 20, 10, 52], [282, 24, 12, 64], [310, 18, 10, 44], [332, 26, 12, 56], [362, 12, 8, 30]]) bld(b, x, 118 - d - hh, w, d, hh, { roof: '#2a3442', wall: '#4a6a8a', win: '#9fd0ff', wy: 5 }, wins);
  // Банкетный зал
  lot(b, 192, 76, 42, 46);
  bld(b, 196, 82, 34, 12, 22, { roof: '#c8a040', wall: '#e8dcc8', win: '#5a3a2a', wx: 6, wy: 6 }, wins);
  for (let i = 0; i < 6; i++) R(b, 197 + i * 6, 96, 2, 16, '#fff8e8');
  R(b, 210, 112, 6, 10, '#b8261a');
  // Дачи
  for (let i = 0; i < 6; i++) R(b, 396, 72 + i * 4, 30, 2, i % 2 ? '#6a4a2a' : '#7a5a2a');
  for (let i = 0; i < 6; i++) R(b, 444, 102 + i * 3, 26, 1, '#3f7a2a');
  [[398, 46, '#b8402a'], [428, 52, '#3a7a4a'], [454, 44, '#b8402a'], [404, 96, '#3a7a4a'], [436, 84, '#b8402a']].forEach(([x, y, roof]) => bld(b, x, y, 16, 8, 8, { roof, wall: '#e8d8b0', win: '#4a3a2a', wx: 6 }, wins));
  b.fillStyle = '#c8b48a'; for (let x = 392; x < 476; x += 3) { b.fillRect(x, 40, 1, 2); b.fillRect(x, 118, 1, 2); }
  // Студгородок
  lot(b, 20, 146, 120, 100);
  for (const x of [24, 62, 100]) bld(b, x, 150, 34, 10, 22, { roof: '#5a3a30', wall: '#b8583a', win: '#f2e2b8' }, wins);
  paint(b, 28, 194, 104, 46, ell(104, 46), '#b8503a', { ol: '#6a2a1a' });
  paint(b, 38, 200, 84, 34, ell(84, 34), '#4f9a3f', { ol: '#e8e0d0' });
  R(b, 79, 201, 1, 32, '#e8e0d0');
  // Промзона
  lot(b, 392, 140, 84, 112);
  bld(b, 396, 152, 42, 14, 16, { roof: '#8a8a92', wall: '#a0a0a8', win: '#3a4048', wx: 6, wy: 6 }, wins);
  for (let x = 396; x < 438; x += 6) for (let k = 0; k < 4; k++) R(b, x + k, 155 - k, 1, k + 1, '#b8b8c0');
  paint(b, 446, 132, 7, 36, rect(7, 36), '#a84a3a', { ol: '#4a1a10', hi: '#c86a5a' }); R(b, 446, 138, 7, 2, '#f2f2f2'); R(b, 446, 146, 7, 2, '#f2f2f2'); chimneys.push([447, 130]);
  bld(b, 396, 196, 32, 12, 14, { roof: '#6a7a6a', wall: '#8a948a', win: '#3a4048', wx: 6 }, wins);
  [[436, 200, '#c8502a'], [450, 200, '#3a6aa8'], [436, 208, '#3f8a3a'], [450, 208, '#c8a02a'], [436, 228, '#3a6aa8'], [452, 232, '#c8502a']].forEach(([x, y, c]) => paint(b, x, y, 13, 7, rect(13, 7), c, { ol: shade(c, -0.5), hi: shade(c, 0.2) }));
  // Пиццерия
  lot(b, 246, 134, 46, 42);
  bld(b, 250, 138, 38, 12, 18, { roof: '#7a2a1e', wall: '#f2e8d4', win: '#3a2a1a', wx: 5, wy: 6 }, wins);
  for (let x = 250; x < 288; x++) R(b, x, 152, 1, 3, Math.floor((x - 250) / 3) % 2 ? '#f2f2f2' : '#d23a2a');
  text5(b, 'ПИЦЦА', 254, 140, '#f6c445', '#3a0a06');
  // Оптовка
  lot(b, 296, 196, 80, 46);
  bld(b, 300, 200, 52, 14, 14, { roof: '#3a6a9a', wall: '#c8c0b0', win: '#4a4a52', wx: 8, wy: 6 }, wins);
  for (let x = 302; x < 352; x += 3) R(b, x, 201, 1, 12, '#2e5a86');
  [[358, 222], [366, 222], [358, 214]].forEach(([x, y]) => paint(b, x, y, 8, 8, rect(8, 8), '#b8844a', { ol: '#5a3a1a', hi: '#d8a46a' }));
  // Парк с лавочкой
  paint(b, 190, 178, 42, 30, ell(42, 30), '#c8b48a', { ol: '#a8946a' });
  paint(b, 194, 182, 34, 22, ell(34, 22), '#5d9c47', { ol: false });
  paint(b, 204, 186, 14, 10, ell(14, 10), '#9a9aa2', { ol: '#5a5a62' }); paint(b, 207, 188, 8, 6, ell(8, 6), '#5aa0e0', { ol: false }); R(b, 210, 189, 2, 2, '#d8f0ff');
  R(b, 202, 210, 14, 2, '#8a5a3a'); R(b, 202, 208, 14, 1, '#6a4026'); R(b, 203, 212, 1, 2, '#3a2010'); R(b, 214, 212, 1, 2, '#3a2010');
  [[190, 172], [230, 174], [186, 214], [232, 212], [210, 228], [196, 236], [226, 236]].forEach(([x, y]) => tree(b, x, y, 4));
  // Деревья по пустырям
  const lots = [[22, 46, 134, 82], [250, 34, 130, 92], [188, 70, 50, 56], [390, 36, 88, 92], [16, 140, 128, 112], [388, 136, 92, 120], [242, 130, 54, 50], [292, 192, 88, 54], [182, 166, 56, 80]];
  const blocked = (x, y) => y < 22 || Math.abs(x - riverX(y)) < 15 || Math.abs(y - 130) < 10 || Math.abs(x - 240) < 10 || Math.abs(x - 384) < 10 || (Math.abs(y - 248) < 10 && x > 230 && x < 392) || lots.some(([lx, ly, lw, lh]) => x > lx - 6 && x < lx + lw + 4 && y > ly - 8 && y < ly + lh + 4);
  const r = rng(77), trees = [];
  for (let i = 0; i < 260 && trees.length < 70; i++) { const x = 4 + Math.floor(r() * 472), y = 24 + Math.floor(r() * 240); if (!blocked(x, y) && trees.every(([a, c]) => Math.hypot(a - x, c - y) > 9)) trees.push([x, y]); }
  trees.sort((a, c) => a[1] - c[1]).forEach(([x, y]) => tree(b, x, y, 3 + (hash(x, y, 1) % 3)));

  const night = mk(Wd, Ht), n = night.getContext('2d');
  n.drawImage(day, 0, 0); n.fillStyle = 'rgba(16,14,48,.72)'; n.fillRect(0, 0, Wd, Ht);
  wins.forEach(([x, y]) => { if (hash(x, y, 9) % 10 < 6) R(n, x, y, 2, 2, hash(x, y, 2) % 4 ? '#f6c45a' : '#ffe7a0'); });
  lamps.forEach(([x, y]) => { glow(n, x, y, 10, 'rgba(255,220,140,A)', 0.35); R(n, x, y, 1, 1, '#fff3b8'); });
  glow(n, 269, 143, 24, 'rgba(255,90,60,A)', 0.4); text5(n, 'ПИЦЦА', 254, 140, '#ff7a5a', '#3a0a06');
  return { day, night, chimneys };
}

// Маленький курьер на мопеде для карты. (x, y) — точка на дороге, dir — направление
export function mapScooter(ctx, x, y, dir, t) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (dir < 0) ctx.scale(-1, 1);
  const bob = reduce ? 0 : Math.floor(t / 120) % 2;
  shadow(ctx, 0, 1, 7, 2, 0.35);
  paint(ctx, -6, -4, 4, 4, ell(4, 4), '#25252c', { ol: '#08080a' }); paint(ctx, 3, -4, 4, 4, ell(4, 4), '#25252c', { ol: '#08080a' });
  paint(ctx, -5, -7 - bob, 11, 4, rrect(11, 4, 1), '#d23a2a', { ol: '#6a140c', hi: '#ff7a62' });
  R(ctx, 4, -12 - bob, 1, 5, '#a82a1c'); R(ctx, 3, -12 - bob, 3, 1, '#2c2c34');
  paint(ctx, -2, -12 - bob, 4, 5, rect(4, 5), '#3a6bb8', { ol: '#15284a' });
  paint(ctx, -2, -16 - bob, 5, 4, ell(5, 4), '#e0402e', { ol: '#5a120a', hi: '#ff8a72' });
  paint(ctx, -7, -12 - bob, 5, 5, rect(5, 5), '#c63a2a', { ol: '#5a120a' }); R(ctx, -6, -10 - bob, 2, 1, '#f6c84c');
  ctx.restore();
}

/* ---------- Кухня пиццерии ---------- */
export function kitchenBg() {
  const Wd = 480, Ht = 270, c = mk(Wd, Ht), b = c.getContext('2d');
  const WALL = 56;
  for (let y = 0; y < WALL; y++) for (let x = 0; x < Wd; x++) {
    const tx = (x + (Math.floor(y / 8) % 2) * 5) % 10, ty = y % 8;
    R(b, x, y, 1, 1, tx === 0 || ty === 0 ? '#b8aa90' : (B4[y & 3][x & 3] + (ty < 3 ? 0.3 : 0) > 0.25 ? '#f6eedc' : '#ebe0c8'));
  }
  // полка с банками
  R(b, 168, 46, 106, 3, '#6a4026'); R(b, 168, 49, 106, 1, '#3a2010');
  ['#d8392a', '#f6c84c', '#3f9a49', '#a8643a', '#f2e8cf', '#4b3020', '#e6a83a'].forEach((col, i) => { const x = 172 + i * 14; paint(b, x, 32, 11, 14, rrect(11, 14, 2), '#cfe0e8', { ol: '#5a6a72', hi: '#ffffff' }); R(b, x + 2, 37, 7, 8, col); R(b, x + 1, 30, 9, 3, '#8a5a3a'); });
  // неоновая вывеска и часы
  glow(b, 316, 36, 40, 'rgba(255,80,60,A)', 0.22);
  paint(b, 282, 26, 64, 20, rrect(64, 20, 3), '#2a1a20', { ol: '#0e0a12' });
  text5(b, 'ПИЦЦА', 300, 32, '#ff6a50', '#5a120a');
  paint(b, 354, 26, 20, 20, ell(20, 20), '#f8f6f2', { ol: '#3a2a1a', hi: '#ffffff' }); R(b, 363, 29, 1, 8, '#1a1220'); R(b, 363, 36, 6, 1, '#1a1220'); R(b, 363, 36, 2, 2, '#e2513b');
  // печь
  paint(b, 384, 4, 92, WALL - 4, rect(92, WALL - 4), '#9a4a2a', { ol: '#3a160c' });
  for (let y = 4; y < WALL; y += 5) for (let x = 384 + ((y / 5) % 2) * 6; x < 476; x += 12) { R(b, x, y, 1, 5, '#6a2a16'); R(b, x, y, 12, 1, '#6a2a16'); }
  paint(b, 404, 22, 52, 34, (a, c2) => ell(52, 40)(a, c2) || c2 > 20, '#1a0c08', { ol: '#3a160c' });
  glow(b, 430, 52, 28, 'rgba(255,140,40,A)', 0.55);
  for (let i = 0; i < 8; i++) { const fx = 408 + i * 6, fh = 6 + hash(i, 1, 7) % 8; paint(b, fx, WALL - fh, 5, fh, (a, c2) => Math.abs(a - 2) <= c2 * 0.4, i % 2 ? '#f6c445' : '#e2733b', { ol: false }); }
  // край столешницы и сама столешница
  R(b, 0, WALL, Wd, 6, '#4a2a16'); R(b, 0, WALL, Wd, 1, '#7a4a2a');
  const top = WALL + 6;
  for (let y = top; y < Ht; y++) for (let x = 0; x < Wd; x++) {
    const row = Math.floor((y - top) / 12), seam = (y - top) % 12 === 11 || (x + row * 37) % 96 === 0;
    const base = ['#a8743f', '#9a683a', '#b07c48'][row % 3];
    const grain = Math.sin(x * 0.07 + row * 3 + Math.sin(x * 0.013) * 4) > 0.82;
    R(b, x, y, 1, 1, seam ? '#5a3a22' : grain ? shade(base, -0.12) : B4[y & 3][x & 3] > 0.4 ? shade(base, 0.05) : base);
  }
  // мука и разделочная доска под пиццей (пицца стоит в 170,58 размером 140)
  noise(b, 150, 60, 180, 150, ['#f4ece0', '#e8dcc8'], 0.04, 8);
  paint(b, 168, 56, 144, 144, ell(144, 144), '#c8925a', { ol: '#5a3418', hi: '#e0b07a', lo: '#a87440' });
  paint(b, 310, 122, 18, 10, rrect(18, 10, 3), '#c8925a', { ol: '#5a3418', hi: '#e0b07a' }); R(b, 320, 126, 3, 2, '#5a3418');
  return c;
}

// Иконки 16×16 для теста и бортика в магазине
export function baseIcon(kind) {
  const c = mk(16, 16); c.className = 'px'; const x = c.getContext('2d');
  if (kind === 'dough') { paint(x, 1, 3, 14, 11, ell(14, 11), '#f2dcae', { ol: '#8a6a3a', hi: '#fff4d8', lo: '#d8bc88' }); R(x, 5, 6, 2, 1, '#fff8e8'); }
  else { paint(x, 1, 1, 14, 14, (a, b) => ell(14, 14)(a, b) && !ell(8, 8)(a - 3, b - 3), '#d8913f', { ol: '#6d3a14', hi: '#f6cd85' }); [[3, 5], [10, 3], [12, 10], [4, 11]].forEach(([a, b]) => R(x, a, b, 1, 1, '#ffe17a')); }
  return c;
}
