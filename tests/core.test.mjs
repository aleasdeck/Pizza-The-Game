import test from 'node:test';
import assert from 'node:assert/strict';
import { match, react, similar, createDay, cook, endTurn, chooseEvent, refuse, preview, canCook } from '../src/core.js';
import { ARCH, TURNS } from '../src/data.js';
import { playDay } from './bot.mjs';

const canon = (id) => { const a = ARCH[id]; return { dough: a.dough, sauce: a.sauce, items: Object.entries(a.items).flatMap(([k, n]) => Array(n).fill(k)) }; };

test('канон даёт 100%', () => {
  for (const id of Object.keys(ARCH)) assert.equal(match(canon(id), id).pct, 100, id);
});

test('замена внутри тега снижает процент, пустой слот сильнее', () => {
  const p = canon('hawaii');
  const sub = { ...p, items: p.items.map(x => (x === 'ham' ? 'bacon' : x)) };
  const empty = { ...p, items: p.items.filter(x => x !== 'ham') };
  const a = match(sub, 'hawaii').pct, b = match(empty, 'hawaii').pct;
  assert.ok(a < 100 && a > b, `${a} > ${b}`);
});

test('лишняя начинка штрафует', () => {
  const p = canon('margo');
  assert.equal(match({ ...p, items: [...p.items, 'anch'] }, 'margo').pct, 95);
});

test('сходство симметрично', () => {
  assert.equal(similar('ham', 'bacon'), similar('bacon', 'ham'));
  assert.equal(similar('pep', 'pine'), 0);
});

test('реакции по порогам', () => {
  assert.equal(react('purist', 94, false).pay, 0);
  assert.ok(react('purist', 95, false).pay > 1);
  assert.equal(react('adv', 75, false).pay, 1.2);
  assert.equal(react('normal', 75, false).pay, 0.75);
  assert.equal(react('normal', 40, false).pay, 0.5);
  assert.ok(react('normal', 100, true).pay < 1);
});

test('готовка тратит руки, печь и склад', () => {
  const d = createDay(7);
  const t = d.tickets[0];
  const before = d.stock.classic;
  assert.equal(cook(d, t.id, canon('margo')), null);
  assert.equal(d.hands, d.handsMax - 1);
  assert.equal(d.stock.classic, before - 1);
  assert.equal(d.oven.length, 1);
  assert.equal(canCook(d, t.id, canon('margo')), 'Выбери заказ');
});

test('без теста в печь нельзя', () => {
  const d = createDay(7);
  assert.equal(canCook(d, d.tickets[0].id, { dough: null, sauce: 'tomatoS', items: [] }), 'Нужно тесто');
});

test('конец хода выдаёт пиццу и платит по превью', () => {
  const d = createDay(11);
  const t = d.tickets[0];
  const p = canon(t.arch);
  const pv = preview(d, t.id, p);
  cook(d, t.id, p);
  const money = d.money;
  const { results } = endTurn(d);
  const r = results.find(x => x.type === 'served');
  assert.equal(r.pay, pv.payRub);
  assert.equal(d.money, money + pv.payRub);
});

test('заказ, которого не дождались, уходит', () => {
  const d = createDay(3);
  const n = d.tickets.length;
  for (let i = 0; i < 2 && !d.done; i++) { if (d.event) chooseEvent(d, 1); endTurn(d); }
  assert.ok(d.stats.left >= n);
});

test('отказ снижает рейтинг', () => {
  const d = createDay(5);
  refuse(d, d.tickets[0].id);
  assert.equal(d.rating, 3.95);
});

test('день заканчивается после всех ходов', () => {
  const d = createDay(9);
  let turns = 0;
  while (!d.done) { if (d.event) chooseEvent(d, 0); endTurn(d); turns++; }
  assert.equal(turns, TURNS);
  assert.ok(d.summary);
});

test('бот доигрывает день детерминированно', () => {
  const a = playDay(createDay(42)), b = playDay(createDay(42));
  assert.deepEqual(a, b);
});
