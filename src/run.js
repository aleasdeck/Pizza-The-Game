// Состояние забега: неделя, доска заказов, деньги, рейтинг, награды. Без DOM.
import { SPOTS, TOPPINGS, TOPPING_IDS, DOUGHS, CRUSTS, ARCH, DISTRICTS, BOSSES, EVENTS, FIRST, DAY_START, DAY_END, REVIEWS } from './data.js';

export function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const pick = (r, a) => a[Math.floor(r() * a.length)];
const between = (r, [a, b]) => a + Math.floor(r() * (b - a + 1));

export const UPGRADES = {
  oven:    { name: 'Дровяная печь',     max: 3, cost: [1500, 3000, 4500], text: lvl => `Пицца стартует на +${10 * lvl}° горячее` },
  storage: { name: 'Склад',             max: 3, cost: [1250, 2500, 3750], text: lvl => `+${lvl} топинг на старте недели` },
  call:    { name: 'Колл-центр',        max: 1, cost: [4000],           text: () => '+1 заказ на доске каждый раз' },
  union:   { name: 'Профсоюз',          max: 2, cost: [2000, 4000],      text: lvl => `Штрафы −${25 * lvl}%` },
  pr:      { name: 'PR-отдел',          max: 2, cost: [2000, 4000],      text: lvl => `Стартовый рейтинг +${(0.1 * lvl).toFixed(1)}★` },
  garage:  { name: 'Гараж: мопед «Альфа»', max: 1, cost: [4500],        text: () => 'Дальние заказы на 1 час короче' },
  dough:   { name: 'Пекарня',           max: 1, cost: [3000],           text: () => 'Пышное тесто с первого дня' },
  crust:   { name: 'Сырный цех',        max: 1, cost: [3000],           text: () => 'Сырный бортик с первого дня' },
};

export function newMeta() { return { pension: 0, weeks: 0, best: 0, up: {}, fame: [] }; }
export const lvl = (meta, k) => meta.up[k] || 0;

export function createRun(meta, seed = Date.now()) {
  const r = rng(seed);
  const start = ['pep', 'pep', 'pep', 'tomato', 'tomato', 'mozz', 'basil', 'mush'];
  for (let i = 0; i < lvl(meta, 'storage'); i++) start.push(pick(r, TOPPING_IDS.filter(id => TOPPINGS[id].rarity <= 2)));
  const spots = Array(SPOTS).fill(null);
  start.forEach((id, i) => { spots[Math.floor(i * SPOTS / start.length)] = id; });
  const run = {
    seed, rs: Math.floor(r() * 1e9), day: 0, hour: DAY_START, money: 300,
    rating: 4.8 + 0.1 * lvl(meta, 'pr'),
    pizza: { dough: lvl(meta, 'dough') ? 'thick' : 'classic', crust: lvl(meta, 'crust') ? 'cheese' : 'plain', cuts: 8, spots },
    owned: { dough: ['thin', 'classic'].concat(lvl(meta, 'dough') ? ['thick'] : []), crust: ['plain'].concat(lvl(meta, 'crust') ? ['cheese'] : []) },
    inventory: [], ordersToday: 0, earned: 0, tips: 0, fines: 0, served: 0, stars: [],
    mods: {}, board: [], bossDone: false, over: false, fired: false, dayLog: [],
    up: { ...meta.up },
  };
  run.board = makeBoard(run);
  return run;
}

export function R(run) { const r = rng(run.rs); run.rs = Math.floor(r() * 4294967295) + 1; return r; }

function guestSpec(r, arch, day, name, extra = {}) {
  const a = ARCH[arch];
  const hunger = Math.round(between(r, a.hunger) * (1 + 0.22 * day) * (extra.hungerMul || 1));
  return { arch, name: name || pick(r, FIRST), hunger, seed: Math.floor(r() * 1e6), ...extra };
}

// Имена внутри одного заказа не повторяются
function uniqueNames(r, guests) {
  const seen = new Set();
  for (const g of guests) {
    if (seen.has(g.name)) { const free = FIRST.filter(n => !seen.has(n)); if (free.length) g.name = pick(r, free); }
    seen.add(g.name);
  }
  return guests;
}

export function makeOrder(run, r) {
  const d = run.day;
  const district = pick(r, DISTRICTS);
  const minG = 1 + Math.floor(d / 3), maxG = 3 + Math.floor(d / 2);
  const n = between(r, [minG, Math.min(6, maxG)]);
  const guests = uniqueNames(r, Array.from({ length: n }, () => guestSpec(r, pick(r, district.pool), d)));
  let hours = district.hours; if (hours >= 3 && lvl(run, 'garage')) hours -= 1;
  const pay = Math.round((120 + 55 * n) * district.pay * (1 + 0.1 * d) / 10) * 10;
  return { kind: 'order', title: titleFor(r, district, guests), district: district.name, hours, pay, guests, seatOffset: r() * Math.PI * 2 };
}

function titleFor(r, district, guests) {
  if (guests.length === 1) return `${guests[0].name}, ${district.name}`;
  const a = ARCH[guests[0].arch].name.toLowerCase();
  const kinds = { student: 'Общага', office: 'Офис', babushka: 'Бабушкин двор', jock: 'Качалка', vegan: 'Эко-лофт', gourmet: 'Дегустация', kid: 'Детская', rich: 'Пентхаус', hipster: 'Коворкинг', gamer: 'Стрим-хата' };
  return `${kinds[guests[0].arch] || a}, ${district.name}`;
}

export function makeBoss(run, r) {
  const b = BOSSES[run.day];
  const guests = uniqueNames(r, b.guests.map(([arch, name, extra]) => guestSpec(r, arch, run.day, name, { hungerMul: 0.85, ...(extra || {}) })));
  return { kind: 'boss', title: b.title, district: 'Банкетный зал', hours: b.hours, pay: Math.round((150 + 70 * guests.length) * b.pay / 10) * 10, guests, text: b.text, seatOffset: r() * Math.PI * 2 };
}

export const hoursLeft = run => DAY_END - run.hour;
export const isBossDay = run => !!BOSSES[run.day];

export function makeBoard(run) {
  const r = R(run);
  const cards = [];
  const left = hoursLeft(run);
  if (isBossDay(run) && !run.bossDone) {
    const boss = makeBoss(run, r);
    if (left < boss.hours + 1) return [boss];
    cards.push(boss);
  }
  const n = 3 + lvl(run, 'call');
  for (let i = 0; i < n; i++) { const o = makeOrder(run, r); if (o.hours <= left) cards.push(o); }
  if (left >= 1) cards.push({ kind: 'shop', title: 'Оптовка', hours: 1, text: 'Топинги, тесто и бортики' });
  if (left >= 1 && run.rating < 5) cards.push({ kind: 'rest', title: 'Перекур на лавочке', hours: 1, text: '+0,1★ и случайная встреча' });
  return cards;
}

export function dayOver(run) {
  if (isBossDay(run) && !run.bossDone) return false;
  return hoursLeft(run) < 1;
}

export function spendHours(run, h) { run.hour = Math.min(DAY_END, run.hour + h); }

export function rollEvent(run) {
  const r = R(run);
  if (r() > 0.55) return null;
  return pick(r, EVENTS);
}

export function applyEffect(run, eff) {
  const out = { heat: 0 };
  if (!eff) return out;
  if (eff.heat) out.heat += eff.heat;
  if (eff.hours) spendHours(run, eff.hours);
  if (eff.money) run.money = Math.max(0, run.money + eff.money);
  if (eff.rating) run.rating = clampRating(run.rating + eff.rating);
  if (eff.tipsMul) run.mods.tipsMul = (run.mods.tipsMul || 1) * eff.tipsMul;
  if (eff.patience) run.mods.patienceBonus = (run.mods.patienceBonus || 0) + eff.patience;
  if (eff.topping) { const id = eff.topping === 'random' ? pick(R(run), TOPPING_IDS) : eff.topping; run.inventory.push(id); out.gained = id; }
  if (eff.lose) {
    for (let k = 0; k < eff.lose; k++) {
      const placed = run.pizza.spots.map((id, i) => id ? i : -1).filter(i => i >= 0);
      if (run.inventory.length) out.lost = run.inventory.pop();
      else if (placed.length) { const i = pick(R(run), placed); out.lost = run.pizza.spots[i]; run.pizza.spots[i] = null; }
    }
  }
  return out;
}

export const clampRating = x => Math.max(0, Math.min(5, Math.round(x * 100) / 100));

export function startHeat(run, order) { return 100 + 10 * lvl(run, 'oven') - order.hours * 5; }

export function applyResult(run, res) {
  run.money += res.total;
  run.earned += res.total;
  run.tips += res.tips; run.fines += res.fine; run.served++;
  run.stars.push(res.stars);
  run.rating = clampRating(run.rating + res.rating);
  run.ordersToday++;
  run.mods = {};
  if (run.rating < 3.5) { run.over = true; run.fired = true; }
}

export function rewardChoices(run, n = 3) {
  const r = R(run);
  const maxR = run.day >= 4 ? 3 : run.day >= 2 ? 2 : 1;
  const pool = TOPPING_IDS.filter(id => TOPPINGS[id].rarity <= maxR + (r() < 0.2 ? 1 : 0));
  const out = new Set();
  while (out.size < n && out.size < pool.length) out.add(pick(r, pool));
  return [...out];
}

export function shopOffers(run) {
  const r = R(run);
  const mul = 1.5 * (1 + 0.08 * run.day);
  const tops = Array.from({ length: 5 }, () => { const id = pick(r, TOPPING_IDS); return { type: 'top', id, price: Math.round(TOPPINGS[id].price * mul / 5) * 5 }; });
  const bases = [];
  for (const [k, d] of Object.entries(DOUGHS)) if (!run.owned.dough.includes(k)) bases.push({ type: 'dough', id: k, price: d.price });
  for (const [k, c] of Object.entries(CRUSTS)) if (!run.owned.crust.includes(k)) bases.push({ type: 'crust', id: k, price: c.price });
  return tops.concat(bases);
}

export function buy(run, offer) {
  if (run.money < offer.price || offer.sold) return false;
  run.money -= offer.price; offer.sold = true;
  if (offer.type === 'top') run.inventory.push(offer.id);
  if (offer.type === 'dough') { run.owned.dough.push(offer.id); run.pizza.dough = offer.id; }
  if (offer.type === 'crust') { run.owned.crust.push(offer.id); run.pizza.crust = offer.id; }
  return true;
}

export function nextDay(run) {
  run.dayLog.push({ day: run.day, money: run.money, rating: run.rating });
  run.day++; run.hour = DAY_START; run.ordersToday = 0; run.bossDone = false; run.mods = {};
  if (run.day >= 7) { run.over = true; return; }
  run.board = makeBoard(run);
}

export function pension(run) {
  const p = Math.round(run.money * 0.6 + run.earned * 0.25);
  return run.fired ? Math.round(p / 2) : p;
}

export function reviewText(r, stars) { return pick(r, REVIEWS[stars]); }
