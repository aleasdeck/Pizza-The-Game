// Бот играет недели: берёт первый заказ, ставит лучший поворот, награду берёт первую. Печатает звёзды по дням.
import { createRun, newMeta, makeBoard, spendHours, startHeat, applyResult, rewardChoices, nextDay, hoursLeft, R, rollEvent } from '../src/run.js';
import { createBattle, runToEnd, score } from '../src/sim.js';
import { SPOTS } from '../src/data.js';
const bestRot = (run, o, heat) => { let best = 0, bs = -1; for (let r = 0; r < SPOTS; r++) { const b = createBattle(run.pizza, o.guests, { heat, rotation: r, seatOffset: o.seatOffset, ordersToday: run.ordersToday }); runToEnd(b); const s = score(b, o); const v = s.stars * 10 + s.fedFrac; if (v > bs) { bs = v; best = r; } } return best; };
const W = +process.argv[2] || 20; const tally = Array.from({ length: 7 }, () => []); let fired = 0;
for (let w = 0; w < W; w++) {
  const run = createRun(newMeta(), 1000 + w);
  while (!run.over) {
    const card = run.board.find(c => c.kind === 'boss') || run.board.find(c => c.kind === 'order');
    if (!card) { nextDay(run); continue; }
    spendHours(run, card.hours);
    const heat = startHeat(run, card);
    const rot = bestRot(run, card, heat);
    const b = createBattle(run.pizza, card.guests, { heat, rotation: rot, seatOffset: card.seatOffset, ordersToday: run.ordersToday });
    runToEnd(b); const s = score(b, card); applyResult(run, s); tally[run.day].push(s.stars);
    if (card.kind === 'boss') run.bossDone = true;
    const rw = rewardChoices(run); const free = run.pizza.spots.indexOf(null); if (free >= 0) run.pizza.spots[free] = rw[0];
    if (run.over) { fired++; break; }
    if (hoursLeft(run) < 1 && !(run.board.some(c=>c.kind==='boss') && !run.bossDone)) nextDay(run); else run.board = makeBoard(run);
  }
}
console.log('fired', fired, '/', W);
tally.forEach((t, d) => console.log('day', d, 'n', t.length, 'avg★', (t.reduce((a, b) => a + b, 0) / (t.length || 1)).toFixed(2)));
