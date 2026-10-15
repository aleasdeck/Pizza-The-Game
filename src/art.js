// Векторная графика: общие градиенты и куски ингредиентов, пицца, лотки, кухня, печь.
// Всё рисуется SVG, без пикселей: экран 1920×1080 масштабируется целиком.
import { ING } from './data.js';

const frac = (x) => x - Math.floor(x);
const hash = (n) => frac(Math.sin(n * 127.1 + 311.7) * 43758.5453);

/* ---------- Общие определения: вставляются в документ один раз ---------- */
export const DEFS = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <radialGradient id="g-pep" cx=".4" cy=".35"><stop offset="0" stop-color="#d4462c"/><stop offset=".7" stop-color="#a82b17"/><stop offset="1" stop-color="#7a190c"/></radialGradient>
  <radialGradient id="g-salami" cx=".4" cy=".35"><stop offset="0" stop-color="#b33a48"/><stop offset=".8" stop-color="#8e2633"/><stop offset="1" stop-color="#6a1824"/></radialGradient>
  <linearGradient id="g-ham" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7bcbc"/><stop offset="1" stop-color="#dd848e"/></linearGradient>
  <linearGradient id="g-chicken" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3d9a8"/><stop offset="1" stop-color="#cf9a58"/></linearGradient>
  <linearGradient id="g-pine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset=".5" stop-color="#f8d046"/><stop offset="1" stop-color="#e9b02a"/></linearGradient>
  <linearGradient id="g-peach" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc06a"/><stop offset="1" stop-color="#e57a2c"/></linearGradient>
  <linearGradient id="g-anch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cbb8a6"/><stop offset=".5" stop-color="#8d6c5a"/><stop offset="1" stop-color="#5e4234"/></linearGradient>
  <linearGradient id="g-basil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#64b04a"/><stop offset="1" stop-color="#2c6a22"/></linearGradient>
  <radialGradient id="g-tomato" cx=".45" cy=".4"><stop offset="0" stop-color="#f06a50"/><stop offset="1" stop-color="#c8321f"/></radialGradient>
  <linearGradient id="g-mush" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3e6d0"/><stop offset="1" stop-color="#d8c09c"/></linearGradient>
  <radialGradient id="g-crust-classic" r=".5"><stop offset="0" stop-color="#f3d8a2"/><stop offset=".8" stop-color="#ecc685"/><stop offset=".9" stop-color="#d69a52"/><stop offset=".97" stop-color="#b9743a"/><stop offset="1" stop-color="#9a5a28"/></radialGradient>
  <radialGradient id="g-crust-thin" r=".5"><stop offset="0" stop-color="#f1d49a"/><stop offset=".9" stop-color="#e8bf7a"/><stop offset=".96" stop-color="#c88440"/><stop offset="1" stop-color="#a0602a"/></radialGradient>
  <radialGradient id="g-crust-thick" r=".5"><stop offset="0" stop-color="#f4dcaa"/><stop offset=".68" stop-color="#eecb8c"/><stop offset=".8" stop-color="#e3ad66"/><stop offset=".92" stop-color="#c98742"/><stop offset="1" stop-color="#9c5b26"/></radialGradient>
  <radialGradient id="g-sauce-tomatoS" r=".5"><stop offset="0" stop-color="#d84a2c"/><stop offset=".85" stop-color="#bd331b"/><stop offset="1" stop-color="#9c2512"/></radialGradient>
  <radialGradient id="g-sauce-cream" r=".5"><stop offset="0" stop-color="#fbf4e2"/><stop offset=".85" stop-color="#efe2c2"/><stop offset="1" stop-color="#ddc79c"/></radialGradient>
  <radialGradient id="g-wood" r=".5"><stop offset="0" stop-color="#b98550"/><stop offset=".85" stop-color="#9c6a3a"/><stop offset="1" stop-color="#7c4f28"/></radialGradient>
  <radialGradient id="g-doughball" cx=".38" cy=".32"><stop offset="0" stop-color="#fff3d8"/><stop offset=".7" stop-color="#ecd09c"/><stop offset="1" stop-color="#c9a066"/></radialGradient>
  <radialGradient id="g-mozzball" cx=".38" cy=".32"><stop offset="0" stop-color="#ffffff"/><stop offset=".75" stop-color="#f3eee2"/><stop offset="1" stop-color="#cfc6b2"/></radialGradient>
  <linearGradient id="g-steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef1f3"/><stop offset=".5" stop-color="#c3cacf"/><stop offset="1" stop-color="#8c959c"/></linearGradient>
  <linearGradient id="g-steel-in" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b6369"/><stop offset=".25" stop-color="#7d868c"/><stop offset="1" stop-color="#a7b0b6"/></linearGradient>
  <filter id="f-melt" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" result="b"/><feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="g"/><feComposite in="SourceGraphic" in2="g" operator="atop"/></filter>
  <filter id="f-soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="1.6" flood-color="#3a1a08" flood-opacity=".45"/></filter>

  <g id="p-pep"><circle r="15" fill="url(#g-pep)"/><circle r="14.2" fill="none" stroke="#6e150a" stroke-width="1.6" opacity=".55"/><circle cx="-5" cy="-3" r="2.2" fill="#ec8a70" opacity=".7"/><circle cx="4" cy="5" r="1.8" fill="#ec8a70" opacity=".7"/><circle cx="6" cy="-6" r="1.4" fill="#ec8a70" opacity=".6"/><circle cx="-3" cy="7" r="1.5" fill="#ec8a70" opacity=".6"/><path d="M-9 -9 Q-2 -14 7 -11" stroke="#fff" stroke-width="2.2" fill="none" opacity=".22" stroke-linecap="round"/></g>
  <g id="p-salami"><circle r="16" fill="url(#g-salami)"/><circle r="15.2" fill="none" stroke="#e8c8b8" stroke-width="1.5" opacity=".8"/><g fill="#f4d0cc" opacity=".9"><ellipse cx="-6" cy="-5" rx="2.4" ry="1.6"/><ellipse cx="5" cy="-7" rx="1.8" ry="1.3"/><ellipse cx="7" cy="3" rx="2.2" ry="1.5"/><ellipse cx="-2" cy="6" rx="1.7" ry="1.2"/><ellipse cx="-9" cy="3" rx="1.5" ry="1.1"/><ellipse cx="1" cy="-1" rx="1.4" ry="1"/></g></g>
  <g id="p-ham"><path d="M-17 -9 Q0 -15 17 -8 Q20 0 15 10 Q0 14 -16 9 Q-20 0 -17 -9Z" fill="url(#g-ham)" stroke="#c46e7a" stroke-width="1"/><path d="M-12 -5 Q0 -9 12 -4" stroke="#ffe0e0" stroke-width="2.4" fill="none" opacity=".7" stroke-linecap="round"/><path d="M-10 5 Q2 8 11 4" stroke="#d27884" stroke-width="1.2" fill="none" opacity=".6"/></g>
  <g id="p-bacon"><path d="M-21 -6 C-13 -11 -6 -2 0 -6 C6 -10 13 -2 21 -6 L21 5 C13 9 6 0 0 5 C-6 9 -13 0 -21 5Z" fill="#a83a2e"/><path d="M-21 -1 C-13 -6 -6 3 0 -1 C6 -5 13 3 21 -1 L21 1.8 C13 6 6 -3 0 1.8 C-6 6 -13 -2 -21 1.8Z" fill="#f4cdb2"/><path d="M-21 -6 C-13 -11 -6 -2 0 -6 C6 -10 13 -2 21 -6" stroke="#d65a46" stroke-width="1.4" fill="none"/></g>
  <g id="p-chicken"><path d="M-12 -8 Q-2 -14 10 -9 Q15 0 9 9 Q-2 13 -11 8 Q-16 0 -12 -8Z" fill="url(#g-chicken)" stroke="#b8803e" stroke-width=".8"/><path d="M-8 -6 L4 8 M-2 -9 L9 3" stroke="#7a4a1e" stroke-width="2.2" opacity=".55" stroke-linecap="round"/></g>
  <g id="p-pine"><path d="M-14 -10 Q0 -12 14 -10 L9 10 Q0 11 -9 10Z" fill="url(#g-pine)" stroke="#d29a1c" stroke-width="1"/><path d="M-13 -9 Q0 -11 13 -9" stroke="#fff8c8" stroke-width="2.2" fill="none" opacity=".8"/><path d="M-6 -7 L-4 8 M0 -7 L0 8 M6 -7 L4 8" stroke="#e3a81e" stroke-width=".9" opacity=".7"/></g>
  <g id="p-peach"><path d="M-15 5 A16 16 0 0 1 15 5 Q0 -4 -15 5Z" fill="url(#g-peach)" stroke="#c9641e" stroke-width=".9"/><path d="M-10 -1 Q0 -9 10 -1" stroke="#ffd9a0" stroke-width="1.8" fill="none" opacity=".7"/></g>
  <g id="p-jal"><circle r="10.5" fill="#3d8a2c" stroke="#24601a" stroke-width="1.2"/><circle r="7" fill="#d8eaa8"/><g fill="#f6f2cc"><ellipse cx="-2.5" cy="-1" rx="1.4" ry="2"/><ellipse cx="2.5" cy="1.5" rx="1.4" ry="2"/><ellipse cx="0" cy="-3.6" rx="1.2" ry="1.6"/></g></g>
  <g id="p-anch"><path d="M-23 0 Q-10 -4.5 17 -2.5 L23 -4 L21 0 L23 4 L17 2.5 Q-10 4.5 -23 0Z" fill="url(#g-anch)"/><path d="M-19 -.6 Q0 -2 17 -.8" stroke="#ece4dc" stroke-width="1" fill="none" opacity=".9"/></g>
  <g id="p-capers"><circle cx="-4" cy="-2" r="4.2" fill="#6b8c3a"/><circle cx="4" cy="-1" r="3.8" fill="#5d7e30"/><circle cx="0" cy="5" r="4" fill="#71923e"/><g fill="#d4e8a8" opacity=".75"><circle cx="-5.2" cy="-3.4" r="1.1"/><circle cx="3" cy="-2.4" r="1"/><circle cx="-1.2" cy="3.6" r="1"/></g></g>
  <g id="p-olive"><circle r="7" fill="none" stroke="#211c1a" stroke-width="5.2"/><path d="M-6 -4 A7 7 0 0 1 3 -7" stroke="#6a625c" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>
  <g id="p-tomato"><circle r="13" fill="url(#g-tomato)" stroke="#a82814" stroke-width="1.2"/><g fill="#f8a48e"><ellipse cx="0" cy="-6" rx="3.6" ry="4.4"/><ellipse cx="5.6" cy="3.4" rx="3.6" ry="4.4" transform="rotate(120 5.6 3.4)"/><ellipse cx="-5.6" cy="3.4" rx="3.6" ry="4.4" transform="rotate(240 -5.6 3.4)"/></g><g fill="#f6e3a2"><circle cx="0" cy="-6" r="1"/><circle cx="5.4" cy="3.2" r="1"/><circle cx="-5.4" cy="3.2" r="1"/></g><circle r="2.4" fill="#f07a62"/></g>
  <g id="p-mush"><path d="M-13 0 Q-13 -12 0 -12 Q13 -12 13 0 Q8 1.5 5 0 L5 9 Q0 11 -5 9 L-5 0 Q-8 1.5 -13 0Z" fill="url(#g-mush)" stroke="#8c6a48" stroke-width="1.2"/><path d="M-9 -3 Q0 -6 9 -3" stroke="#b8946c" stroke-width="1" fill="none"/></g>
  <g id="p-basil"><path d="M0 -17 C11 -10 11 8 0 17 C-11 8 -11 -10 0 -17Z" fill="url(#g-basil)"/><path d="M0 -14 L0 14 M0 -4 L6 -8 M0 3 L-6 -1 M0 8 L5 5" stroke="#a6d88a" stroke-width="1" opacity=".55" fill="none"/></g>
  <g id="p-oregano" fill="#5a7a2a">${Array.from({ length: 14 }, (_, i) => `<ellipse cx="${((hash(i) - 0.5) * 34).toFixed(1)}" cy="${((hash(i + 40) - 0.5) * 34).toFixed(1)}" rx="1.6" ry="1" transform="rotate(${(hash(i + 9) * 180) | 0} ${((hash(i) - 0.5) * 34).toFixed(1)} ${((hash(i + 40) - 0.5) * 34).toFixed(1)})" fill="${i % 3 ? '#5a7a2a' : '#7e9c3e'}"/>`).join('')}</g>
</defs></svg>`;

const PIECES = { pep: 4, salami: 3, ham: 3, bacon: 2, chicken: 3, pine: 3, peach: 3, jal: 4, anch: 2, capers: 3, olive: 4, tomato: 3, mush: 3, basil: 2, oregano: 1 };
const CHEESE = {
  mozz: { fill: '#fdf3d2', hi: '#fffdf4' },
  sulg: { fill: '#f7e3a8', hi: '#fff4cc' },
  gorg: { fill: '#f1efe2', hi: '#ffffff', vein: '#6f8f86' },
  parm: { fill: '#f0d78a', hi: '#fff0b8', shred: true },
};

// Точки, равномерно покрывающие круг даже при малом числе (последовательность R2).
const spot = (k, rmax, off = 0) => {
  const a = 2 * Math.PI * frac(0.5698402910 * (k + off) + 0.13);
  const r = rmax * Math.sqrt(0.06 + 0.94 * frac(0.7548776662 * (k + off) + 0.41));
  return [Math.cos(a) * r, Math.sin(a) * r];
};

function wobbly(r, n, amp, seed) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, rr = r + (hash(seed + i) - 0.5) * 2 * amp;
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  let d = '';
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % n];
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    d += i === 0 ? `M${mx.toFixed(1)} ${my.toFixed(1)}` : '';
    const [x2, y2] = pts[(i + 2) % n];
    d += ` Q${x1.toFixed(1)} ${y1.toFixed(1)} ${((x1 + x2) / 2).toFixed(1)} ${((y1 + y2) / 2).toFixed(1)}`;
  }
  return d + 'Z';
}

const DOUGH = { classic: { r: 172, sauce: 142 }, thin: { r: 172, sauce: 156 }, thick: { r: 176, sauce: 128 } };

/* ---------- Пицца сверху ---------- */
export function pizzaSVG(pizza, { board = true, size = 400, baked = false } = {}) {
  let s = `<svg viewBox="-200 -200 400 400" width="${size}" height="${size}" class="pz${baked ? ' baked' : ''}">`;
  if (board) {
    s += `<circle r="196" fill="url(#g-wood)"/><circle r="196" fill="none" stroke="#5e3a1c" stroke-width="3" opacity=".6"/>`;
    for (let i = 0; i < 7; i++) s += `<path d="M-190 ${-150 + i * 50} Q0 ${-160 + i * 50 + (i % 2 ? 18 : -12)} 190 ${-150 + i * 50}" stroke="#7a4c24" stroke-width="1.4" fill="none" opacity=".35"/>`;
    for (let i = 0; i < 40; i++) { const [x, y] = spot(i, 185, 300); s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.8 + hash(i) * 1.8).toFixed(1)}" fill="#f6ead2" opacity=".45"/>`; }
  }
  if (!pizza.dough) return s + '</svg>';
  const D = DOUGH[pizza.dough];
  s += `<circle r="${D.r + 3}" fill="#3a1d08" opacity=".25" cy="5"/>`;
  s += `<path d="${wobbly(D.r, 28, 3, 11)}" fill="url(#g-crust-${pizza.dough})"/>`;
  // подпалины и пузыри на бортике
  for (let i = 0; i < 26; i++) {
    const a = hash(i + 70) * Math.PI * 2, rr = D.sauce + (D.r - D.sauce) * (0.35 + hash(i + 90) * 0.5);
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr, big = hash(i + 110) > 0.6;
    s += big
      ? `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(3 + hash(i) * 4).toFixed(1)}" ry="${(2 + hash(i + 3) * 2).toFixed(1)}" fill="#7a3f14" opacity="${baked ? 0.55 : 0.18}" transform="rotate(${(a * 57.3) | 0} ${x.toFixed(1)} ${y.toFixed(1)})"/>`
      : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.5 + hash(i + 5) * 3).toFixed(1)}" fill="#fff4d8" opacity=".35"/>`;
  }
  if (pizza.sauce) {
    s += `<path d="${wobbly(D.sauce, 22, 4, 31)}" fill="url(#g-sauce-${pizza.sauce})"/>`;
    if (pizza.sauce === 'tomatoS') for (let i = 0; i < 18; i++) { const [x, y] = spot(i, D.sauce - 10, 500); s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.3" fill="#6d1a0c" opacity=".35"/>`; }
  }
  const cheeses = pizza.items.filter(id => ING[id].kind === 'cheese');
  const tops = pizza.items.filter(id => ING[id].kind === 'top');
  if (cheeses.length) {
    const lim = D.sauce - 8;
    let blobs = '', extra = '', k = 0;
    cheeses.forEach((id, ci) => {
      const c = CHEESE[id];
      if (c.shred) {
        for (let i = 0; i < 26; i++) { const [x, y] = spot(k++, lim, 900); const a = hash(k + ci * 31) * 180; extra += `<rect x="${(x - 6).toFixed(1)}" y="${(y - 1.4).toFixed(1)}" width="12" height="2.8" rx="1.4" fill="${c.fill}" stroke="#d4b25a" stroke-width=".5" transform="rotate(${a | 0} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; }
        return;
      }
      for (let i = 0; i < 13; i++) {
        const [x, y] = spot(k++, lim - 10, 700);
        const r = 10 + hash(k + ci * 13) * 9;
        blobs += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${c.fill}"/>`;
        if (c.vein) for (let v = 0; v < 4; v++) extra += `<circle cx="${(x + (hash(k * 7 + v) - 0.5) * r).toFixed(1)}" cy="${(y + (hash(k * 11 + v) - 0.5) * r).toFixed(1)}" r="${(1.2 + hash(v + k) * 1.6).toFixed(1)}" fill="${c.vein}" opacity=".8"/>`;
        else extra += `<ellipse cx="${(x - r * 0.25).toFixed(1)}" cy="${(y - r * 0.3).toFixed(1)}" rx="${(r * 0.35).toFixed(1)}" ry="${(r * 0.18).toFixed(1)}" fill="${c.hi}" opacity=".7"/>`;
      }
    });
    s += `<g filter="url(#f-melt)" opacity=".93">${blobs}</g>${extra}`;
    if (baked) for (let i = 0; i < 14; i++) { const [x, y] = spot(i, lim, 1200); s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(3 + hash(i + 2) * 5).toFixed(1)}" fill="#d9a44a" opacity=".45"/>`; }
  }
  let k = 0;
  const lim = D.sauce - 18;
  for (const id of tops) {
    for (let i = 0; i < (PIECES[id] ?? 2); i++) {
      const [x, y] = spot(k, lim, 3);
      const rot = (hash(k + 17) * 360) | 0, sc = (0.92 + hash(k + 29) * 0.18).toFixed(2);
      s += `<use href="#p-${id}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot}) scale(${sc})" filter="url(#f-soft)"/>`;
      k++;
    }
  }
  return s + '</svg>';
}

/* ---------- Лоток с ингредиентом ---------- */
export function binSVG(id) {
  const kind = ING[id].kind;
  let inner = '';
  if (kind === 'dough') {
    if (id === 'thin') inner = `<ellipse cx="60" cy="50" rx="38" ry="15" fill="url(#g-doughball)" stroke="#c49a5c"/><ellipse cx="60" cy="47" rx="30" ry="10" fill="#fff3d8" opacity=".5"/><rect x="88" y="28" width="22" height="6" rx="3" fill="#a87442" transform="rotate(25 99 31)"/>`;
    else if (id === 'thick') inner = `<circle cx="60" cy="48" r="27" fill="url(#g-doughball)"/><ellipse cx="51" cy="38" rx="9" ry="5" fill="#fff" opacity=".45"/>`;
    else inner = `<circle cx="42" cy="50" r="18" fill="url(#g-doughball)"/><circle cx="78" cy="50" r="18" fill="url(#g-doughball)"/><circle cx="60" cy="38" r="16" fill="url(#g-doughball)"/>`;
    inner += Array.from({ length: 12 }, (_, i) => `<circle cx="${20 + hash(i + 5) * 80}" cy="${22 + hash(i + 9) * 50}" r="1.2" fill="#fff" opacity=".7"/>`).join('');
  } else if (kind === 'sauce') {
    const col = id === 'cream' ? '#f3e8cc' : '#c3341c', hi = id === 'cream' ? '#fffaf0' : '#e2563a';
    inner = `<ellipse cx="60" cy="48" rx="44" ry="26" fill="${col}"/><ellipse cx="50" cy="41" rx="22" ry="8" fill="${hi}" opacity=".6"/><path d="M78 44 Q92 20 112 12" stroke="#b9c1c6" stroke-width="6" stroke-linecap="round" fill="none"/><ellipse cx="74" cy="48" rx="11" ry="7" fill="#9aa3a9"/><ellipse cx="74" cy="47" rx="8" ry="4.5" fill="${col}"/>`;
  } else if (id === 'mozz') {
    inner = `<circle cx="38" cy="52" r="15" fill="url(#g-mozzball)"/><circle cx="66" cy="54" r="16" fill="url(#g-mozzball)"/><circle cx="54" cy="34" r="14" fill="url(#g-mozzball)"/><circle cx="86" cy="40" r="13" fill="url(#g-mozzball)"/>`;
  } else if (id === 'sulg') {
    inner = Array.from({ length: 26 }, (_, i) => `<rect x="${24 + hash(i) * 66}" y="${26 + hash(i + 50) * 40}" width="14" height="3.4" rx="1.7" fill="${i % 3 ? '#f7e3a8' : '#fff1c4'}" transform="rotate(${(hash(i + 7) * 180) | 0} ${30 + hash(i) * 66} ${28 + hash(i + 50) * 40})"/>`).join('');
  } else if (id === 'gorg') {
    inner = `<path d="M22 64 L98 64 L84 26 Z" fill="#f2f0e2" stroke="#d4cdb4"/><path d="M84 26 L98 64 L102 58 L88 22Z" fill="#dcd6bc"/>` + Array.from({ length: 12 }, (_, i) => `<circle cx="${44 + hash(i) * 44}" cy="${44 + hash(i + 20) * 16}" r="${1.4 + hash(i + 3) * 1.8}" fill="#6f8f86"/>`).join('');
  } else if (id === 'parm') {
    inner = `<path d="M18 66 L70 66 L58 24 Z" fill="#efd27c" stroke="#c9a848"/><path d="M58 24 L70 66 L76 60 L64 20Z" fill="#c69a3a"/>` + Array.from({ length: 16 }, (_, i) => `<rect x="${74 + hash(i) * 26}" y="${40 + hash(i + 50) * 26}" width="9" height="2.4" rx="1.2" fill="#f2da8c" transform="rotate(${(hash(i + 7) * 180) | 0} ${78 + hash(i) * 26} ${41 + hash(i + 50) * 26})"/>`).join('');
  } else {
    const n = { anch: 4, bacon: 4, basil: 5, oregano: 3 }[id] ?? 6;
    for (let i = 0; i < n; i++) {
      const x = 26 + (i % 3) * 34 + hash(i + 3) * 10, y = 30 + Math.floor(i / 3) * 26 + hash(i + 8) * 8;
      inner += `<use href="#p-${id}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(hash(i + 1) * 360) | 0}) scale(${id === 'oregano' ? 1.1 : 0.95})"/>`;
    }
  }
  return `<svg viewBox="0 0 120 90" class="bin-art"><rect x="2" y="4" width="116" height="84" rx="10" fill="url(#g-steel)"/><rect x="9" y="11" width="102" height="70" rx="6" fill="url(#g-steel-in)"/><rect x="9" y="11" width="102" height="6" rx="3" fill="#000" opacity=".18"/>${inner}</svg>`;
}

/* ---------- Кухня: фон 1920×1080 ---------- */
export function kitchenSVG() {
  return `<svg viewBox="0 0 1920 1080" width="1920" height="1080" class="bg" preserveAspectRatio="none">
  <defs>
    <pattern id="tiles" width="96" height="48" patternUnits="userSpaceOnUse">
      <rect width="96" height="48" fill="#cdbfa6"/>
      <rect x="2" y="2" width="92" height="20" rx="3" fill="url(#tileG)"/>
      <rect x="-46" y="26" width="92" height="20" rx="3" fill="url(#tileG)"/>
      <rect x="50" y="26" width="92" height="20" rx="3" fill="url(#tileG)"/>
    </pattern>
    <linearGradient id="tileG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf6ec"/><stop offset="1" stop-color="#e7dcc8"/></linearGradient>
    <linearGradient id="wallShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1608" stop-opacity=".55"/><stop offset=".5" stop-color="#2a1608" stop-opacity=".05"/><stop offset="1" stop-color="#2a1608" stop-opacity=".35"/></linearGradient>
    <radialGradient id="ovenLight" cx="1650" cy="300" r="900" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ff9a3c" stop-opacity=".42"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>
    <radialGradient id="lamp" cx="760" cy="300" r="760" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff2c8" stop-opacity=".35"/><stop offset="1" stop-color="#fff2c8" stop-opacity="0"/></radialGradient>
    <linearGradient id="counter" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b98a58"/><stop offset=".25" stop-color="#a77746"/><stop offset="1" stop-color="#7c5230"/></linearGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c1a10"/><stop offset="1" stop-color="#4a2e1c"/></linearGradient>
    <linearGradient id="railG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f6f7"/><stop offset=".5" stop-color="#9aa3a8"/><stop offset="1" stop-color="#5f676c"/></linearGradient>
    <radialGradient id="vign" cx="960" cy="560" r="1150" gradientUnits="userSpaceOnUse"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#tiles)"/>
  <rect width="1920" height="380" fill="url(#wallShade)"/>
  <rect width="1920" height="92" fill="url(#beam)"/>
  ${Array.from({ length: 9 }, (_, i) => `<rect x="${i * 220 - 20}" y="0" width="4" height="92" fill="#1c0f07" opacity=".5"/>`).join('')}
  <rect y="88" width="1920" height="6" fill="#1a0e06" opacity=".6"/>
  <!-- полка с банками -->
  <rect x="40" y="96" width="0" height="0"/>
  <!-- планка для тикетов -->
  <rect x="24" y="112" width="1340" height="12" rx="6" fill="url(#railG)"/>
  <rect x="24" y="124" width="1340" height="4" fill="#000" opacity=".15"/>
  <!-- столешница -->
  <rect y="352" width="1920" height="728" fill="url(#counter)"/>
  ${Array.from({ length: 7 }, (_, i) => `<rect y="${470 + i * 100}" width="1920" height="2" fill="#5e3c20" opacity=".45"/>`).join('')}
  ${Array.from({ length: 34 }, (_, i) => { const y = 380 + hash(i) * 680, x = hash(i + 9) * 1700; return `<path d="M${x.toFixed(0)} ${y.toFixed(0)} q60 ${(hash(i + 3) * 8 - 4).toFixed(1)} 160 0 t160 0" stroke="#6e4626" stroke-width="1.2" fill="none" opacity=".35"/>`; }).join('')}
  <rect y="344" width="1920" height="16" fill="#c99a66"/>
  <rect y="358" width="1920" height="6" fill="#5a381c" opacity=".55"/>
  ${Array.from({ length: 90 }, (_, i) => `<circle cx="${(480 + hash(i + 200) * 640).toFixed(0)}" cy="${(380 + hash(i + 400) * 640).toFixed(0)}" r="${(1 + hash(i) * 2).toFixed(1)}" fill="#fbf1dc" opacity=".35"/>`).join('')}
  <rect width="1920" height="1080" fill="url(#ovenLight)"/>
  <rect width="1920" height="1080" fill="url(#lamp)"/>
  <rect width="1920" height="1080" fill="url(#vign)"/>
</svg>`;
}

/* ---------- Печь ---------- */
export function ovenSVG() {
  let bricks = '';
  for (let row = 0; row < 12; row++) {
    const y = 40 + row * 26, off = row % 2 ? 0 : 30;
    for (let x = -60 + off; x < 520; x += 60) {
      const t = hash(row * 31 + x);
      bricks += `<rect x="${x + 2}" y="${y + 2}" width="56" height="22" rx="3" fill="${t > 0.66 ? '#b45a36' : t > 0.33 ? '#a24e2e' : '#c06640'}"/>`;
    }
  }
  return `<svg viewBox="0 0 500 400" width="500" height="400" class="oven-art">
  <defs>
    <clipPath id="dome"><path d="M10 400 L10 210 Q10 30 250 26 Q490 30 490 210 L490 400Z"/></clipPath>
    <radialGradient id="fire" cx="250" cy="330" r="200" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffe9a0"/><stop offset=".3" stop-color="#ffb347"/><stop offset=".65" stop-color="#d9531e"/><stop offset="1" stop-color="#2a0c04"/></radialGradient>
    <linearGradient id="stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8d8378"/><stop offset="1" stop-color="#5d554d"/></linearGradient>
    <radialGradient id="domeShade" cx="250" cy="150" r="320" gradientUnits="userSpaceOnUse"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>
  </defs>
  <g clip-path="url(#dome)"><rect width="500" height="400" fill="#7a3a22"/>${bricks}<rect width="500" height="400" fill="url(#domeShade)"/></g>
  <path d="M10 400 L10 210 Q10 30 250 26 Q490 30 490 210 L490 400" fill="none" stroke="#5a2a16" stroke-width="6"/>
  <rect x="196" y="0" width="108" height="34" rx="4" fill="#4a2a1a"/><rect x="208" y="-6" width="84" height="12" fill="#2e1a10"/>
  <path d="M86 372 L86 250 Q86 156 250 152 Q414 156 414 250 L414 372Z" fill="#3a1608"/>
  <path d="M100 372 L100 254 Q100 172 250 168 Q400 172 400 254 L400 372Z" fill="url(#fire)"/>
  <g opacity=".9"><path d="M140 372 Q130 320 160 290 Q156 330 180 340 Q176 300 210 270 Q206 320 236 330 Q240 290 266 268 Q262 316 290 330 Q300 296 330 286 Q320 330 352 340 Q364 316 372 300 Q380 340 360 372Z" fill="#ffcf5c" opacity=".75"/><path d="M180 372 Q176 340 200 320 Q204 346 226 350 Q230 320 254 304 Q256 340 280 350 Q296 330 320 326 Q312 352 330 372Z" fill="#fff1b0" opacity=".8"/></g>
  <path d="M60 372 L440 372 L456 400 L44 400Z" fill="url(#stone)"/>
  <path d="M86 250 Q86 156 250 152 Q414 156 414 250" fill="none" stroke="#e0a070" stroke-width="3" opacity=".5"/>
</svg>`;
}

/* ---------- Мелкие иконки ---------- */
export const ICONS = {
  hand: `<svg viewBox="0 0 24 24" class="ico"><path d="M7 11V5.5a1.5 1.5 0 0 1 3 0V10m0-5.5V4a1.5 1.5 0 0 1 3 0v6m0-5a1.5 1.5 0 0 1 3 0v6m0-3.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L3.6 15.6a1.6 1.6 0 0 1 2.5-2L7 14.6V11" fill="currentColor" stroke="#2a1608" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  star: `<svg viewBox="0 0 24 24" class="ico"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" fill="currentColor"/></svg>`,
  coin: `<svg viewBox="0 0 24 24" class="ico"><circle cx="12" cy="12" r="10" fill="#f2c14e" stroke="#9c6a12" stroke-width="1.6"/><text x="12" y="16.5" text-anchor="middle" font-size="12" font-weight="700" fill="#7a4e08" font-family="Golos Text, sans-serif">₽</text></svg>`,
  hall: `<svg viewBox="0 0 24 24" class="ico"><path d="M4 10h16M6 10v9M18 10v9M8 10V6h8v4" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>`,
  pickup: `<svg viewBox="0 0 24 24" class="ico"><path d="M5 8h14l-1.5 12h-11zM9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linejoin="round"/></svg>`,
  delivery: `<svg viewBox="0 0 24 24" class="ico"><circle cx="6" cy="17" r="3" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="18" cy="17" r="3" stroke="currentColor" stroke-width="2" fill="none"/><path d="M6 17h7l3-7h-4M16 10l2 7M3 11h7v4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" class="ico"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.2" fill="none"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>`,
};
