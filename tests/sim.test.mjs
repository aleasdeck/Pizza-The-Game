import test from 'node:test';
import assert from 'node:assert/strict';
import { SPOTS, CUTS } from '../src/data.js';
import { sliceOfSpot, describeSlices, sliceValue, createBattle, runToEnd, score, firstPicks } from '../src/sim.js';
import { createRun, newMeta, makeBoard, nextDay, applyResult, startHeat, spendHours, hoursLeft } from '../src/run.js';

const pizza = (spots = {}) => ({ dough: 'classic', crust: 'plain', cuts: 8, spots: Array.from({ length: SPOTS }, (_, i) => spots[i] || null) });
const g = (arch, hunger, extra = {}) => ({ arch, name: arch, hunger, seed: 1, ...extra });

test('каждое место на пицце попадает ровно в один кусок при любой нарезке', () => {
  for (const c of CUTS) {
    const seen = new Set();
    for (let i = 0; i < SPOTS; i++) { const s = sliceOfSpot(i, c); assert.ok(s >= 0 && s < c); seen.add(s); }
    assert.equal(seen.size, c);
  }
});

test('рецепт «Маргарита» срабатывает только когда всё в одном куске', () => {
  const together = describeSlices(pizza({ 0: 'tomato', 1: 'mozz', 2: 'basil' }));
  assert.deepEqual(together[0].recipes.map(r => r.id), ['margo']);
  const apart = describeSlices(pizza({ 0: 'tomato', 1: 'mozz', 3: 'basil' }));
  assert.equal(apart[0].recipes.length, 0);
});

test('нелюбимый топинг обнуляет свою сытость и вызывает отвращение', () => {
  const p = pizza({ 0: 'pep' });
  const sl = describeSlices(p)[0];
  const env = { heat: 100, ordersToday: 0 };
  const vegan = { likes: ['veg'], dislikes: ['meat'], likeIds: [], dislikeIds: [] };
  const jock = { likes: ['meat'], dislikes: ['veg'], likeIds: [], dislikeIds: [] };
  const a = sliceValue(p, sl, vegan, env), b = sliceValue(p, sl, jock, env);
  assert.equal(a.disgust, true);
  assert.ok(b.value > a.value);
});

test('первые куски у всех гостей разные, поворот меняет выбор', () => {
  const p = pizza();
  const picks = firstPicks(p, 4, { rotation: 0, seatOffset: 0.3 });
  assert.equal(new Set(picks).size, 4);
  const moved = firstPicks(p, 4, { rotation: 3, seatOffset: 0.3 });
  assert.notDeepEqual(picks, moved);
});

test('застолье всегда заканчивается, оценка от 1 до 5', () => {
  for (let k = 0; k < 30; k++) {
    const p = pizza({ 0: 'pep', 4: 'mush', 8: 'tomato', 12: 'jal', 16: 'anch' });
    const b = createBattle(p, [g('jock', 30 + k), g('kid', 10), g('vegan', 15)], { heat: 90, rotation: k % 24, seatOffset: k * 0.2, ordersToday: 0 });
    runToEnd(b);
    assert.ok(b.over);
    const s = score(b, { pay: 300 });
    assert.ok(s.stars >= 1 && s.stars <= 5);
    assert.ok(Number.isFinite(s.total));
  }
});

test('маленький голод при большой пицце — пять звёзд и чаевые', () => {
  const b = createBattle(pizza({ 0: 'pep', 3: 'pep', 6: 'pep' }), [g('babushka', 5)], { heat: 100, rotation: 0, seatOffset: 0, ordersToday: 0 });
  runToEnd(b);
  const s = score(b, { pay: 200 });
  assert.equal(s.stars, 5);
  assert.ok(s.tips > 0);
});

test('неделя проходит до конца, доска не пустая', () => {
  const run = createRun(newMeta(), 7);
  for (let d = 0; d < 7; d++) {
    assert.ok(run.board.length > 0, `пустая доска в день ${d}`);
    const order = run.board.find(c => c.kind === 'order' || c.kind === 'boss');
    assert.ok(order);
    spendHours(run, order.hours);
    const b = createBattle(run.pizza, order.guests, { heat: startHeat(run, order), rotation: 0, seatOffset: order.seatOffset, ordersToday: 0 });
    runToEnd(b); applyResult(run, score(b, order));
    run.rating = 4.8;
    nextDay(run);
  }
  assert.equal(run.over, true);
});

test('в день босса доска в конце смены предлагает только босса', () => {
  const run = createRun(newMeta(), 3);
  run.day = 2; run.hour = 20;
  const b = makeBoard(run);
  assert.equal(b.length, 1);
  assert.equal(b[0].kind, 'boss');
});
