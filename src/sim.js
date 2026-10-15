// Симуляция «Застолья»: пицца в центре стола, гости вокруг, каждый берёт ближайший к себе свободный кусок.
// Модуль без DOM, чтобы его можно было гонять в тестах под Node.
import { SPOTS, TOPPINGS, DOUGHS, CRUSTS, RECIPES, ARCH } from './data.js';

const TAU = Math.PI * 2;
export const angDist = (a, b) => { const d = Math.abs(((a - b) % TAU + TAU) % TAU); return Math.min(d, TAU - d); };

export function sliceOfSpot(spot, cuts) { return Math.floor(spot / (SPOTS / cuts)); }
export function sliceAngle(s, cuts, rotation) { return TAU * ((s + 0.5) * (SPOTS / cuts)) / SPOTS + rotation * TAU / SPOTS; }
export function seatAngle(g, n, offset) { return offset + TAU * g / n; }

// Состав каждого куска: топинги, сработавшие рецепты, соседняя моцарелла
export function describeSlices(pizza) {
  const { cuts } = pizza;
  const slices = Array.from({ length: cuts }, (_, s) => ({ s, tops: [], count: {}, tagCount: {}, recipes: [], mozzNear: 0 }));
  pizza.spots.forEach((id, i) => {
    if (!id) return;
    const sl = slices[sliceOfSpot(i, cuts)];
    sl.tops.push(id); sl.count[id] = (sl.count[id] || 0) + 1;
    const tag = TOPPINGS[id].tag; sl.tagCount[tag] = (sl.tagCount[tag] || 0) + 1;
  });
  slices.forEach((sl, s) => {
    const prev = slices[(s - 1 + cuts) % cuts], next = slices[(s + 1) % cuts];
    sl.mozzNear = cuts > 1 ? (prev.count.mozz || 0) + (cuts > 2 ? (next.count.mozz || 0) : 0) : 0;
    for (const r of RECIPES) {
      const okIds = !r.need || Object.entries(r.need).every(([k, v]) => (sl.count[k] || 0) >= v);
      const okTags = !r.needTag || Object.entries(r.needTag).every(([k, v]) => (sl.tagCount[k] || 0) >= v);
      if (okIds && okTags) sl.recipes.push(r);
    }
  });
  return slices;
}

// Сытость куска для конкретного гостя. guest может быть null — тогда без вкусов.
export function sliceValue(pizza, sl, guest, env) {
  const dough = DOUGHS[pizza.dough], crust = CRUSTS[pizza.crust];
  let v = dough.base + crust.bonus + sl.mozzNear;
  let disgust = false;
  for (const id of sl.tops) {
    const t = TOPPINGS[id];
    let tv = t.value;
    if (id === 'pep') tv += (sl.count.pep || 1) - 1;
    if (id === 'mush') tv += env.ordersToday || 0;
    if (guest) {
      const likes = guest.likes, dislikes = guest.dislikes;
      if (dislikes.includes(t.tag) || (guest.dislikeIds || []).includes(id)) { tv = 0; disgust = true; }
      else if ((guest.likeIds || []).includes(id)) tv *= 2;
      else if (likes.includes(t.tag)) tv *= t.tag === 'weird' ? 3 : 1.5;
    }
    v += tv;
  }
  v *= 1 + 0.15 * (sl.count.basil || 0);
  for (const r of sl.recipes) { if (r.mul) v *= r.mul; if (r.add) v += r.add; }
  const heatMul = 0.5 + Math.max(0, Math.min(120, env.heat)) / 200;
  v *= heatMul;
  return { value: Math.round(v * 10) / 10, disgust };
}

export function makeGuest(spec, i) {
  const a = ARCH[spec.arch];
  return {
    i, name: spec.name, arch: spec.arch, seed: spec.seed,
    hungerMax: spec.hunger, hunger: spec.hunger,
    patience: 100, drain: a.drain * (spec.drainMul || 1), eatMul: a.eat * (spec.eatMul || 1),
    likes: spec.likes || a.likes, dislikes: a.dislikes, likeIds: a.likeIds || [], dislikeIds: a.dislikeIds || [],
    gen: a.gen, special: spec.special || null,
    eating: null, fed: false, complaints: 0, pause: 0, ate: 0, overfeed: 0, mood: 'idle',
  };
}

export function createBattle(pizza, guestSpecs, env) {
  const slices = describeSlices(pizza);
  const crust = CRUSTS[pizza.crust];
  const guests = guestSpecs.map(makeGuest);
  guests.forEach(g => { g.patience = 100 + crust.patience + (env.patienceBonus || 0); g.angle = seatAngle(g.i, guests.length, env.seatOffset); });
  return {
    pizza, env: { ...env }, slices: slices.map(sl => ({ ...sl, angle: sliceAngle(sl.s, pizza.cuts, env.rotation), takenBy: null, eaten: false })),
    guests, heat: env.heat, shield: crust.shield, t: 0, over: false, result: null, log: [],
  };
}

// Какой кусок гость возьмёт первым (для подсказки при повороте пиццы)
export function firstPicks(pizza, guestCount, env) {
  const taken = new Set(), picks = [];
  for (let g = 0; g < guestCount; g++) {
    const ga = seatAngle(g, guestCount, env.seatOffset);
    let best = -1, bd = 9;
    for (let s = 0; s < pizza.cuts; s++) { if (taken.has(s)) continue; const d = angDist(ga, sliceAngle(s, pizza.cuts, env.rotation)); if (d < bd - 1e-9) { bd = d; best = s; } }
    if (best >= 0) taken.add(best);
    picks.push(best);
  }
  return picks;
}

export function step(b, dt) {
  if (b.over) return [];
  const ev = [];
  const dough = DOUGHS[b.pizza.dough];
  const pelm = b.pizza.spots.filter(x => x === 'pelm').length;
  b.t += dt;
  b.heat = Math.max(0, b.heat - (dough.heatLoss + pelm * 0.4) * dt);
  const milHungry = b.guests.some(g => g.special === 'mil' && !g.fed);
  for (const g of b.guests) {
    if (g.fed) continue;
    if (g.eating) {
      g.eating.t += dt;
      if (g.eating.t >= g.eating.dur) {
        const sl = b.slices[g.eating.s];
        let { value, disgust } = sliceValue(b.pizza, sl, g, { ...b.env, heat: b.heat });
        if (milHungry && g.special !== 'mil') value = Math.round(value * 7) / 10;
        sl.eaten = true;
        const got = Math.min(g.hunger, value);
        g.overfeed += value - got; g.hunger -= got; g.ate += 1;
        if (disgust) { g.patience -= 25; ev.push({ type: 'disgust', g: g.i, s: sl.s }); }
        for (const r of sl.recipes) if (r.patience) g.patience = Math.min(130, g.patience + r.patience);
        if (sl.count.jal) g.pause = 2;
        ev.push({ type: 'ate', g: g.i, s: sl.s, value, recipes: sl.recipes.map(r => r.name) });
        g.eating = null;
        if (g.hunger <= 0.01) { g.hunger = 0; g.fed = true; g.mood = 'happy'; ev.push({ type: 'fed', g: g.i }); continue; }
      } else {
        g.patience = Math.min(100, g.patience + 2 * dt);
      }
    }
    if (!g.eating) {
      let best = null, bd = 9;
      for (const sl of b.slices) { if (sl.takenBy !== null) continue; const d = angDist(g.angle, sl.angle); if (d < bd - 1e-9) { bd = d; best = sl; } }
      if (best) { best.takenBy = g.i; g.eating = { s: best.s, t: 0, dur: dough.eat * g.eatMul }; g.mood = 'eat'; ev.push({ type: 'take', g: g.i, s: best.s }); }
      else g.mood = 'wait';
    }
    if (!g.eating && !g.fed) {
      if (g.pause > 0) g.pause -= dt;
      else g.patience -= g.drain * dt;
      if (g.patience <= 0) {
        if (b.shield > 0) { b.shield--; ev.push({ type: 'shield', g: g.i }); }
        else { g.complaints++; g.mood = 'angry'; ev.push({ type: 'complain', g: g.i }); }
        g.patience = 60;
      }
    }
  }
  const allFed = b.guests.every(g => g.fed);
  const anyEating = b.guests.some(g => g.eating);
  const noSlices = b.slices.every(sl => sl.takenBy !== null);
  if (allFed || (!anyEating && noSlices) || b.t > 120) {
    b.over = true;
    b.result = allFed ? 'win' : 'out';
    ev.push({ type: 'end', result: b.result });
  }
  return ev;
}

export function runToEnd(b, dt = 0.1) { const all = []; while (!b.over) all.push(...step(b, dt)); return all; }

const TIP = { 5: 0.35, 4: 0.18, 3: 0.05, 2: 0, 1: 0 };
const FINE = { 5: 0, 4: 0, 3: 0, 2: 0.15, 1: 0.35 };
const RATE = { 5: 0.05, 4: 0.02, 3: 0, 2: -0.1, 1: -0.25 };

export function score(b, order, mods = {}) {
  const tot = b.guests.reduce((a, g) => a + g.hungerMax, 0);
  const got = b.guests.reduce((a, g) => a + (g.hungerMax - g.hunger), 0);
  const fedFrac = tot ? got / tot : 1;
  const complaints = b.guests.reduce((a, g) => a + g.complaints, 0);
  const allFed = b.guests.every(g => g.fed);
  let s = 1 + 4 * fedFrac - 0.35 * complaints + (allFed ? 0.3 : 0);
  const stars = Math.max(1, Math.min(5, Math.round(s)));
  const gen = b.guests.reduce((a, g) => a + g.gen, 0) / b.guests.length;
  const spots = b.pizza.spots;
  let tipMul = (mods.tipsMul || 1);
  if (spots.includes('truf') && b.guests.some(g => g.arch === 'rich' || g.arch === 'gourmet')) tipMul *= 1.5;
  if (spots.includes('olive') && b.guests.some(g => g.likes.includes('veg'))) tipMul *= 1.2;
  const overfeed = b.guests.reduce((a, g) => a + g.overfeed, 0);
  const tips = Math.round(order.pay * TIP[stars] * gen * tipMul + overfeed * 2);
  const fine = Math.round(order.pay * FINE[stars] * (1 - 0.25 * (mods.union || 0)));
  const leftovers = b.slices.filter(sl => sl.takenBy === null).length;
  const sold = leftovers * 10;
  const rating = RATE[stars] - 0.03 * complaints;
  return { stars, fedFrac, complaints, allFed, pay: order.pay, tips, fine, sold, leftovers, rating, total: order.pay + tips - fine + sold };
}
