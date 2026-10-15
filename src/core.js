// Логика смены без DOM: сравнение с каноном, реакции клиентов, ходы, итог дня.
import { ING, ARCH, PAIRS, SAME_TAG, DOUGH_SWAP, SAUCE_SWAP, CLIENTS, CLIENT_WEIGHTS, CHANNELS, CHANNEL_WEIGHTS,
  ARCH_WEIGHTS, TICKETS_PER_TURN, TURNS, START, NAMES, EVENTS } from './data.js';

/* ---------- Случайность с зерном ---------- */
export function rng(state) {
  // mulberry32 поверх объекта, чтобы состояние сохранялось в дне
  let t = (state.s = (state.s + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pickW = (st, weights) => {
  const e = Object.entries(weights), sum = e.reduce((a, [, w]) => a + w, 0);
  let r = rng(st) * sum;
  for (const [k, w] of e) if ((r -= w) < 0) return k;
  return e[e.length - 1][0];
};
const randInt = (st, a, b) => a + Math.floor(rng(st) * (b - a + 1));

/* ---------- Сходство ингредиентов ---------- */
export function similar(a, b) {
  if (a === b) return 1;
  const p = PAIRS[`${a}|${b}`] ?? PAIRS[`${b}|${a}`];
  if (p != null) return p;
  const A = ING[a], B = ING[b];
  return A && B && A.tag && A.tag === B.tag ? SAME_TAG : 0;
}

/* ---------- Канон ----------
   pizza = { dough, sauce, items: [id, id, ...] } — items это порции сыров и начинок.
   Возвращает процент и разбор по слотам канона. */
export const EXTRA_PENALTY = 0.05;
export function match(pizza, archId) {
  const a = ARCH[archId];
  const slots = [];
  for (const [id, n] of Object.entries(a.items)) for (let i = 0; i < n; i++) slots.push({ id, w: ING[id].kind === 'cheese' ? 1.5 : 2, got: null, v: 0 });
  const doughV = !pizza.dough ? 0 : pizza.dough === a.dough ? 1 : DOUGH_SWAP;
  const sauceV = !pizza.sauce ? 0 : pizza.sauce === a.sauce ? 1 : SAUCE_SWAP;
  const pool = [...pizza.items];
  for (const s of slots) {
    const i = pool.indexOf(s.id);
    if (i >= 0) { s.got = s.id; s.v = 1; pool.splice(i, 1); }
  }
  for (const s of [...slots].sort((x, y) => y.w - x.w)) {
    if (s.got) continue;
    let best = -1, bv = 0;
    pool.forEach((id, i) => { const v = similar(s.id, id); if (v > bv) { bv = v; best = i; } });
    if (best >= 0) { s.got = pool[best]; s.v = bv; pool.splice(best, 1); }
  }
  const total = 1 + 1.5 + slots.reduce((x, s) => x + s.w, 0);
  const score = doughV + 1.5 * sauceV + slots.reduce((x, s) => x + s.w * s.v, 0);
  const raw = score / total - EXTRA_PENALTY * pool.length;
  const pct = Math.max(0, Math.min(100, Math.round(raw * 100)));
  return { pct, slots, extras: pool, doughV, sauceV };
}

export function pizzaCost(pizza) {
  return [pizza.dough, pizza.sauce, ...pizza.items].filter(Boolean).reduce((s, id) => s + ING[id].cost, 0);
}

/* ---------- Реакция клиента ----------
   Видна игроку до выдачи: никаких скрытых бросков. */
export function react(client, pct, late, archName = 'пицца') {
  let pay, dr, mood, say;
  if (client === 'purist') {
    if (pct >= 95) { pay = 1.15; dr = 0.05; mood = 'good'; say = '«Наконец-то настоящая». Чаевые 15%'; }
    else { pay = 0; dr = -0.15; mood = 'bad'; say = `«Это не ${archName.toLowerCase()}!» Скандал, не платит`; }
  } else if (client === 'adv') {
    if (pct >= 90) { pay = 1; dr = 0.02; mood = 'mid'; say = '«Ну, классика». Платит без восторга'; }
    else if (pct >= 60) { pay = 1.2; dr = 0.05; mood = 'good'; say = '«О, интересный твист!» +20%'; }
    else { pay = 0.7; dr = -0.05; mood = 'bad'; say = '«Это уже перебор». −30%'; }
  } else {
    if (pct >= 90) { pay = 1; dr = 0.05; mood = 'good'; say = '«Отлично». Полная цена'; }
    else if (pct >= 60) { pay = pct / 100; dr = 0; mood = 'mid'; say = `«Ну, съедобно». Платит ${pct}%`; }
    else { pay = 0.5; dr = -0.1; mood = 'bad'; say = '«Что это вообще?» Жалоба, половина цены'; }
  }
  if (late && pay > 0) { pay *= 0.7; dr -= 0.05; say += '. Опоздали: −30%'; if (mood === 'good') mood = 'mid'; }
  return { pay, dr, mood, say };
}

/* ---------- День ---------- */
export function createDay(seed = Date.now() >>> 0, opts = {}) {
  const day = {
    seed, r: { s: seed >>> 0 }, dayIndex: opts.dayIndex ?? 0,
    turn: 0, money: 0, rating: START.rating,
    stock: { ...START.stock },
    hands: START.hands, handsMax: START.hands, ovenMax: START.oven,
    couriers: START.couriers, oven: [], tickets: [], nextId: 1,
    event: null, log: [], done: false,
    stats: { revenue: 0, cost: 0, served: 0, refused: 0, left: 0, extra: 0 },
  };
  startTurn(day);
  return day;
}

function makeTicket(day, archId) {
  const st = day.r;
  const arch = archId ?? pickW(st, ARCH_WEIGHTS);
  const client = pickW(st, CLIENT_WEIGHTS);
  const channel = pickW(st, CHANNEL_WEIGHTS);
  const [w0, w1] = CHANNELS[channel].wait;
  const t = {
    id: day.nextId++, arch, client, channel, wait: randInt(st, w0, w1),
    name: NAMES[Math.floor(rng(st) * NAMES.length)],
    table: channel === 'hall' ? randInt(st, 1, 8) : null, cooking: false, turnIn: day.turn,
  };
  day.tickets.push(t);
  return t;
}

export function startTurn(day) {
  day.hands = day.handsMax;
  day.couriers = START.couriers;
  for (let i = 0; i < TICKETS_PER_TURN[day.turn]; i++) makeTicket(day);
  const ev = EVENTS[day.turn];
  day.event = ev ? { ...ev, turn: day.turn } : null;
}

export function chooseEvent(day, idx) {
  if (!day.event) return;
  const e = day.event.choices[idx].effect;
  if (e.money) { day.money += e.money; day.stats.extra -= e.money; }
  if (e.stock) for (const [id, n] of Object.entries(e.stock)) day.stock[id] = (day.stock[id] ?? 0) + n;
  if (e.couriers != null) day.couriers = e.couriers;
  if (e.extra) for (const [id, n] of Object.entries(e.extra)) for (let i = 0; i < n; i++) makeTicket(day, id);
  day.log.push({ type: 'event', title: day.event.title, choice: day.event.choices[idx].label });
  day.event = null;
}

const counts = (pizza) => {
  const c = {};
  for (const id of [pizza.dough, pizza.sauce, ...pizza.items]) if (id) c[id] = (c[id] ?? 0) + 1;
  return c;
};
export function hasStock(day, pizza) {
  return Object.entries(counts(pizza)).every(([id, n]) => (day.stock[id] ?? 0) >= n);
}

// Сколько доставок уже стоит в печи — курьеров на всех может не хватить.
export const deliveriesInOven = (day) => day.oven.filter(o => ticket(day, o.ticketId)?.channel === 'delivery').length;
export const ticket = (day, id) => day.tickets.find(t => t.id === id);

export function preview(day, ticketId, pizza) {
  const t = ticket(day, ticketId);
  if (!t) return null;
  const m = match(pizza, t.arch);
  const late = t.channel === 'delivery' && deliveriesInOven(day) >= day.couriers;
  const r = react(t.client, m.pct, late, ARCH[t.arch].name);
  const cost = pizzaCost(pizza);
  const pay = Math.round(ARCH[t.arch].price * r.pay);
  return { ...m, ...r, late, cost, payRub: pay, profit: pay - cost };
}

export function canCook(day, ticketId, pizza) {
  const t = ticket(day, ticketId);
  if (day.done || day.event) return 'Сначала разберись с событием';
  if (!t || t.cooking) return 'Выбери заказ';
  if (!pizza.dough) return 'Нужно тесто';
  if (day.hands <= 0) return 'Руки заняты до следующего хода';
  if (day.oven.length >= day.ovenMax) return 'Печь полная';
  if (!hasStock(day, pizza)) return 'Не хватает продуктов';
  return null;
}

export function cook(day, ticketId, pizza) {
  const err = canCook(day, ticketId, pizza);
  if (err) return err;
  for (const [id, n] of Object.entries(counts(pizza))) day.stock[id] -= n;
  const t = ticket(day, ticketId);
  t.cooking = true;
  const cost = pizzaCost(pizza);
  day.stats.cost += cost;
  day.money -= cost;
  day.hands--;
  day.oven.push({ ticketId, pizza: { dough: pizza.dough, sauce: pizza.sauce, items: [...pizza.items] }, cost });
  return null;
}

export function refuse(day, ticketId) {
  const t = ticket(day, ticketId);
  if (!t || t.cooking) return;
  day.tickets = day.tickets.filter(x => x !== t);
  day.rating = clampRating(day.rating - 0.05);
  day.stats.refused++;
  day.log.push({ type: 'refuse', id: t.id });
}

export const clampRating = (r) => Math.max(1, Math.min(5, Math.round(r * 100) / 100));

// Конец хода: печь отдаёт пиццы, курьеры развозят, ждущие теряют терпение.
export function endTurn(day) {
  if (day.done || day.event) return null;
  const results = [];
  let couriersUsed = 0;
  for (const o of day.oven) {
    const t = ticket(day, o.ticketId);
    let late = false;
    if (t.channel === 'delivery') { if (couriersUsed >= day.couriers) late = true; else couriersUsed++; }
    const m = match(o.pizza, t.arch);
    const r = react(t.client, m.pct, late, ARCH[t.arch].name);
    const pay = Math.round(ARCH[t.arch].price * r.pay);
    day.money += pay;
    day.stats.revenue += pay;
    day.stats.served++;
    day.rating = clampRating(day.rating + r.dr);
    results.push({ type: 'served', ticket: t, pct: m.pct, pay, cost: o.cost, dr: r.dr, mood: r.mood, say: r.say, late, pizza: o.pizza });
  }
  const served = new Set(day.oven.map(o => o.ticketId));
  day.oven = [];
  day.tickets = day.tickets.filter(t => !served.has(t.id));
  for (const t of [...day.tickets]) {
    t.wait--;
    if (t.wait <= 0) {
      day.tickets = day.tickets.filter(x => x !== t);
      day.rating = clampRating(day.rating - 0.1);
      day.stats.left++;
      results.push({ type: 'left', ticket: t, dr: -0.1, say: 'Не дождался и ушёл. Отзыв злой.' });
    }
  }
  const turn = day.turn;
  day.turn++;
  if (day.turn >= TURNS) finishDay(day); else startTurn(day);
  return { turn, results };
}

function finishDay(day) {
  day.done = true;
  const wages = START.courierWage, rent = START.rent;
  day.money -= wages + rent;
  const leftover = day.tickets.length;
  day.summary = {
    revenue: day.stats.revenue, cost: day.stats.cost, extra: day.stats.extra, wages, rent,
    profit: day.money, rating: day.rating,
    served: day.stats.served, refused: day.stats.refused, left: day.stats.left + leftover,
    win: day.money >= START.goal.profit && day.rating >= START.goal.rating,
  };
  day.tickets = [];
}
