// Простой жадный бот: собирает лучшее, что может, из того, что есть на складе.
import { ARCH, ING_IDS } from '../src/data.js';
import { similar, preview, cook, endTurn, chooseEvent, refuse } from '../src/core.js';

export function bestPizza(day, archId) {
  const a = ARCH[archId], left = { ...day.stock };
  const take = (id) => (left[id] > 0 ? (left[id]--, id) : null);
  const pizza = { dough: take(a.dough) ?? take('classic') ?? take('thin') ?? take('thick'), sauce: take(a.sauce) ?? take('tomatoS') ?? take('cream'), items: [] };
  for (const [id, n] of Object.entries(a.items)) for (let i = 0; i < n; i++) {
    let got = take(id);
    if (!got) {
      const alt = ING_IDS.filter(x => left[x] > 0 && similar(id, x) > 0).sort((x, y) => similar(id, y) - similar(id, x))[0];
      if (alt) got = take(alt);
    }
    if (got) pizza.items.push(got);
  }
  return pizza;
}

export function playDay(day, { eventChoice = 0 } = {}) {
  while (!day.done) {
    if (day.event) chooseEvent(day, Math.min(eventChoice, day.event.choices.length - 1));
    const order = [...day.tickets].filter(t => !t.cooking).sort((x, y) => x.wait - y.wait || ARCH[y.arch].price - ARCH[x.arch].price);
    for (const t of order) {
      if (day.hands <= 0 || day.oven.length >= day.ovenMax) break;
      const p = bestPizza(day, t.arch);
      const pv = preview(day, t.id, p);
      if (!pv) continue;
      if (pv.payRub <= 0) { refuse(day, t.id); continue; }
      cook(day, t.id, p);
    }
    endTurn(day);
  }
  return day.summary;
}
