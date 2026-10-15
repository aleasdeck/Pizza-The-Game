// Экраны игры и связка с логикой забега.
import { TOPPINGS, DOUGHS, CRUSTS, CUTS, ARCH, TAGS, DAYS, DAYS_SHORT, BOSSES, RECIPES } from './data.js';
import { createRun, newMeta, makeBoard, spendHours, rollEvent, applyEffect, startHeat, applyResult, rewardChoices, shopOffers, buy, nextDay, pension, hoursLeft, isBossDay, UPGRADES, lvl, reviewText, R as runR, clampRating } from './run.js';
import { describeSlices, sliceValue, createBattle, step, score, firstPicks, seatAngle, sliceAngle } from './sim.js';
import { iconAny, person, R, text3, reduce } from './gfx.js';
import { renderPizza, pickSpot, boardBg, roomBg, drawTableTop, drawPizzaOnTable, seatXY, sliceXY, drawSliceInHand, bubble, cityScene, portrait, TABLE } from './views.js';

const $ = (s, el = document) => el.querySelector(s);
const app = $('#app'), hud = $('#hud'), modal = $('#modal'), mbox = $('.modal-box', modal);
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v; else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c));
  return el;
};
const money = n => `${Math.round(n).toLocaleString('ru-RU')} ₽`;
const clock = x => `${String(Math.floor(x)).padStart(2, '0')}:${x % 1 ? '30' : '00'}`;
const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);

/* ---------- Сохранения ---------- */
const META_KEY = 'pizza-week-meta', RUN_KEY = 'pizza-week-run';
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } };
let meta = Object.assign(newMeta(), load(META_KEY, {}));
let run = load(RUN_KEY, null);
const saveRun = () => save(RUN_KEY, run);
const saveMeta = () => save(META_KEY, meta);

let stopScene = null;
function clear() { if (stopScene) { stopScene(); stopScene = null; } app.replaceChildren(); closeModal(); window.scrollTo(0, 0); }
function openModal(...kids) { mbox.replaceChildren(...kids.flat().filter(k => k != null && k !== false)); modal.hidden = false; const f = mbox.querySelector('button'); if (f) f.focus(); }
function closeModal() { modal.hidden = true; mbox.replaceChildren(); }
function toast(msg) { const t = h('div', { class: 'toast', role: 'status' }, msg); document.body.append(t); setTimeout(() => t.remove(), 1800); }

function updateHud() {
  if (!run) { hud.hidden = true; return; }
  hud.hidden = false;
  $('#hud-day').textContent = `${DAYS[run.day] || 'Пенсия'}`;
  $('#hud-time').textContent = `${clock(run.hour)} · осталось ${hoursLeft(run)} ч`;
  const r = $('#hud-rating'); r.textContent = `★ ${run.rating.toFixed(2)}`; r.className = run.rating < 3.8 ? 'r' : 'g';
  $('#hud-money').textContent = money(run.money);
}

function looks(g) { return { ...(ARCH[g.arch].look || {}), crown: /Невеста|Гендир/.test(g.name || '') }; }

/* ---------- Титул ---------- */
function title() {
  clear(); run = load(RUN_KEY, null); updateHud(); hud.hidden = true;
  const cv = h('canvas', { class: 'px', width: 384, height: 144, 'aria-label': 'Курьер на мопеде едет по ночному городу' });
  const wrap = h('div', { class: 'title-wrap' },
    h('div', { class: 'logo' }, 'ПИЦЦА: ', h('span', {}, 'ПОСЛЕДНЯЯ'), ' НЕДЕЛЯ'),
    h('div', { class: 'scene' }, cv),
    h('p', { class: 'lead' }, 'Неделя до пенсии. Собирай пиццу, выбирай заказы и рассаживай гостей вокруг неё так, чтобы каждому достался его кусок. В воскресенье вечером — на покой.'),
    h('div', { class: 'row' },
      run && !run.over ? h('button', { class: 'btn grn', onclick: () => board() }, `Продолжить: ${DAYS[run.day]}`) : null,
      h('button', { class: 'btn', onclick: () => { run = createRun(meta, Date.now() >>> 0); saveRun(); board(); } }, run && !run.over ? 'Новая неделя' : 'Начать неделю'),
      h('button', { class: 'btn alt', onclick: pizzeria }, 'Пиццерия'),
      h('button', { class: 'btn alt', onclick: howTo }, 'Как играть')),
    h('p', { class: 'sm dim' }, `Пенсионный фонд: ${money(meta.pension)} · отработано недель: ${meta.weeks}`));
  app.append(wrap);
  document.fonts?.ready.then(() => { stopScene = cityScene(cv); });
}

function howTo() {
  openModal(
    h('h2', {}, 'Как играть'),
    h('p', {}, '1. Утром на доске заказов выбираешь, куда ехать. Каждый заказ тратит часы смены.'),
    h('p', {}, '2. На кухне кладёшь топинги на пиццу и выбираешь нарезку. Линии нарезки решают, что попадёт в каждый кусок.'),
    h('p', {}, '3. За столом гости сидят вокруг пиццы. Каждый ест ближайший к себе свободный кусок. Поворачивай пиццу, чтобы любимое оказалось перед нужным человеком.'),
    h('p', {}, '4. Сытость кусков против терпения гостей. Голодные жалуются, сытые дают чаевые. Рейтинг ниже 3,5★ — увольнение.'),
    h('p', {}, '5. В среду, субботу и воскресенье ждут большие компании. После воскресенья — пенсия и прокачка пиццерии.'),
    h('button', { class: 'btn', onclick: closeModal }, 'Понятно'));
}

/* ---------- Пиццерия (мета) ---------- */
function pizzeria() {
  clear(); hud.hidden = true;
  const list = h('div', { class: 'upg' });
  for (const [k, u] of Object.entries(UPGRADES)) {
    const l = lvl(meta, k), maxed = l >= u.max, cost = u.cost[l];
    list.append(h('div', { class: 'box' },
      h('h3', {}, u.name, ' ', h('span', { class: 'dim sm' }, `${l}/${u.max}`)),
      h('div', { class: 'sm' }, l ? u.text(l) : h('span', { class: 'dim' }, u.text(1))),
      maxed ? h('span', { class: 'chip g' }, 'Максимум') :
        h('button', { class: 'btn alt', disabled: meta.pension < cost, onclick: () => { meta.pension -= cost; meta.up[k] = l + 1; saveMeta(); pizzeria(); } }, `Купить за ${money(cost)}`)));
  }
  const fame = meta.fame.slice(-8).reverse();
  app.append(
    h('h1', {}, 'Пиццерия «Последний кусок»'),
    h('p', { class: 'dim' }, `Пенсионный фонд: `, h('b', { class: 'y' }, money(meta.pension)), '. Каждое улучшение действует с начала следующей недели.'),
    list,
    h('h2', { style: 'margin-top:22px' }, 'Стена славы'),
    fame.length ? h('div', { class: 'guestlist' }, fame.map(f => h('div', { class: 'box sm' }, `${f.fired ? 'Уволен' : 'На пенсии'} · ${f.served} заказов · средняя оценка ${f.avg}★ · пенсия ${money(f.pension)}`))) : h('p', { class: 'dim' }, 'Пока пусто. Отработай первую неделю.'),
    h('div', { class: 'row', style: 'margin-top:18px' }, h('button', { class: 'btn', onclick: title }, 'Назад')));
}

/* ---------- Доска заказов ---------- */
function board() {
  clear(); updateHud();
  if (run.over) return retire();
  const bar = h('div', { class: 'daybar' }, DAYS_SHORT.map((d, i) => h('span', { class: (i === run.day ? 'now' : i < run.day ? 'done' : '') + (BOSSES[i] ? ' boss' : '') }, d)));
  const grid = h('div', { class: 'board' });
  for (const c of run.board) grid.append(cardEl(c));
  const forced = run.board.length === 1 && run.board[0].kind === 'boss';
  app.append(bar,
    h('h1', {}, `${DAYS[run.day]}, ${clock(run.hour)}`),
    h('p', { class: 'dim' }, forced ? 'Смена подходит к концу. Остался главный заказ дня.' : isBossDay(run) && !run.bossDone ? 'Сегодня большой заказ. Успей подготовиться, пока есть время.' : 'Выбери, куда ехать. Каждая карточка тратит часы смены.'),
    grid,
    h('div', { class: 'row', style: 'margin-top:16px' },
      !isBossDay(run) || run.bossDone ? h('button', { class: 'btn alt', onclick: endDay }, 'Закончить смену') : null,
      h('button', { class: 'btn alt', onclick: title }, 'Меню')));
}

function cardEl(c) {
  const el = h('button', { class: 'card' + (c.kind === 'boss' ? ' boss' : ''), onclick: () => takeCard(c) });
  if (c.kind === 'order' || c.kind === 'boss') {
    const p = h('div', { class: 'portraits' }, c.guests.map(g => portrait(g.seed, looks(g))));
    const likes = [...new Set(c.guests.flatMap(g => ARCH[g.arch].likes))].slice(0, 3);
    const dis = [...new Set(c.guests.flatMap(g => ARCH[g.arch].dislikes))].slice(0, 2);
    el.append(...[
      c.kind === 'boss' ? h('span', { class: 'chip r', style: 'align-self:flex-start' }, 'БОСС') : null,
      h('h3', {}, c.title), p,
      h('div', { class: 'meta' }, `${c.district} · ${c.guests.length} чел. · ${c.hours} ч`),
      c.text ? h('div', { class: 'sm' }, c.text) : null,
      h('div', { class: 'chips' }, h('span', { class: 'chip y' }, money(c.pay)), likes.map(t => h('span', { class: 'chip g' }, '♥ ' + TAGS[t])), dis.map(t => h('span', { class: 'chip r' }, '✕ ' + TAGS[t])))].filter(Boolean));
  } else {
    el.append(h('h3', {}, c.title), h('div', { class: 'meta' }, `${c.hours} ч`), h('div', { class: 'sm' }, c.text));
  }
  return el;
}

function takeCard(c) {
  if (c.kind === 'shop') { spendHours(run, c.hours); return shop(); }
  if (c.kind === 'rest') {
    spendHours(run, c.hours); run.rating = clampRating(run.rating + 0.1);
    const ev = rollEvent(run);
    if (ev) return showEvent(ev, () => afterCard());
    toast('Покурил, выдохнул. +0,1★'); return afterCard();
  }
  kitchen(c);
}

function afterCard() {
  saveRun();
  if (run.over) return retire();
  if (hoursLeft(run) < 1 && !(isBossDay(run) && !run.bossDone)) return endDay();
  run.board = makeBoard(run); saveRun(); board();
}

/* ---------- Магазин ---------- */
function shop() {
  const offers = shopOffers(run);
  const render = () => {
    updateHud();
    openModal(
      h('h2', {}, 'Оптовка'),
      h('p', { class: 'dim sm' }, 'Купленные топинги попадают на склад, тесто и бортик сразу ставятся на пиццу.'),
      h('div', { class: 'picks' }, offers.map(o => {
        const name = o.type === 'top' ? TOPPINGS[o.id].name : o.type === 'dough' ? `Тесто: ${DOUGHS[o.id].name}` : `Бортик: ${CRUSTS[o.id].name}`;
        const text = o.type === 'top' ? TOPPINGS[o.id].text : o.type === 'dough' ? DOUGHS[o.id].text : CRUSTS[o.id].text;
        const ic = o.type === 'top' ? iconAny(o.id) : h('span', { style: 'font-size:26px' }, o.type === 'dough' ? '🥖' : '🧀');
        return h('button', { class: 'pick', disabled: o.sold || run.money < o.price, onclick: () => { if (buy(run, o)) { saveRun(); render(); } } },
          ic, h('div', {}, h('b', {}, name), h('div', { class: 'sm dim' }, text), h('div', { class: 'sm y' }, o.sold ? 'Куплено' : money(o.price))));
      })),
      h('button', { class: 'btn', onclick: () => { closeModal(); afterCard(); } }, 'Уехать'));
  };
  render();
}

/* ---------- События ---------- */
function showEvent(ev, done) {
  openModal(
    h('div', { class: 'chip b', style: 'justify-self:start' }, 'Случай в пути'),
    h('h2', {}, ev.title), h('p', {}, ev.text),
    h('div', { class: 'choices' }, ev.choices.map(c => h('button', { class: 'btn alt', onclick: () => {
      const out = applyEffect(run, c.effect); if (c.then) applyEffect(run, c.then);
      closeModal();
      let msg = c.note; if (out.gained) msg += ` (+${TOPPINGS[out.gained].name})`; if (out.lost) msg += ` (−${TOPPINGS[out.lost].name})`;
      toast(msg); updateHud(); done(out);
    } }, h('div', {}, c.label), h('div', { class: 'sm dim' }, c.note)))));
}

/* ---------- Кухня ---------- */
function kitchen(order) {
  clear(); updateHud();
  const P = run.pizza; let sel = null, hover = -1;
  const W = 140, cx = 70, cy = 70, Rr = 60;
  const cv = h('canvas', { class: 'px pizza-cv', width: W, height: W, 'aria-label': 'Пицца: нажми на место, чтобы положить или убрать топинг' });
  const ctx = cv.getContext('2d'); const bg = boardBg(W, W);
  const env = { heat: startHeat(run, order), ordersToday: run.ordersToday };
  const info = h('div', { class: 'info' });
  function draw() {
    ctx.drawImage(bg, 0, 0);
    const slices = describeSlices(P);
    const labels = slices.map(sl => sliceValue(P, sl, null, env).value);
    renderPizza(ctx, cx, cy, Rr, P, { showSpots: true, hover, labels });
    const total = labels.reduce((a, b) => a + b, 0), need = order.guests.reduce((a, g) => a + g.hunger, 0);
    const rec = slices.flatMap(s => s.recipes.map(r => r.name));
    info.replaceChildren(
      h('div', {}, 'Сытость пиццы: ', h('b', { class: total >= need ? 'g' : 'r' }, Math.round(total)), ` · голод гостей: ${need}`),
      h('div', { class: 'sm dim' }, rec.length ? `Рецепты: ${[...new Set(rec)].join(', ')}` : 'Рецептов нет. Маргарита: томаты + моцарелла + базилик в одном куске.'));
  }
  const invEl = h('div', { class: 'inv' });
  function renderInv() {
    const counts = {}; run.inventory.forEach(id => counts[id] = (counts[id] || 0) + 1);
    invEl.replaceChildren(...Object.entries(counts).map(([id, n]) => {
      const b = h('button', { class: sel === id ? 'sel' : '', title: `${TOPPINGS[id].name}: ${TOPPINGS[id].text}`, 'aria-label': TOPPINGS[id].name, onclick: () => { sel = sel === id ? null : id; renderInv(); } }, iconAny(id), n > 1 ? h('span', {}, '×' + n) : null);
      return b;
    }));
    if (!run.inventory.length) invEl.append(h('span', { class: 'hint', style: 'grid-column:1/-1' }, 'Склад пуст. Нажми на топинг на пицце, чтобы вернуть его сюда.'));
  }
  const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * W]; };
  cv.addEventListener('pointermove', e => { const [x, y] = pos(e); const s = pickSpot(x, y, cx, cy, Rr, 0); if (s !== hover) { hover = s; draw(); } });
  cv.addEventListener('pointerleave', () => { hover = -1; draw(); });
  cv.addEventListener('click', e => {
    const [x, y] = pos(e); const s = pickSpot(x, y, cx, cy, Rr, 0); if (s < 0) return;
    if (P.spots[s]) { run.inventory.push(P.spots[s]); P.spots[s] = null; }
    else if (sel) { const k = run.inventory.indexOf(sel); if (k >= 0) { run.inventory.splice(k, 1); P.spots[s] = sel; if (!run.inventory.includes(sel)) sel = null; } }
    else { toast('Сначала выбери топинг на складе'); return; }
    renderInv(); draw(); saveRun();
  });
  const chipRow = (items, cur, onPick, label) => h('div', { class: 'chips' }, items.map(([k, name]) => h('button', { class: 'chip' + (k == cur ? ' on' : ''), 'aria-pressed': k == cur, title: label?.(k) || '', onclick: () => { onPick(k); rebuild(); } }, name)));
  const opts = h('div', { class: 'opts' });
  function rebuild() {
    opts.replaceChildren(
      h('span', { class: 'dim' }, 'Нарезка'), chipRow(CUTS.map(c => [c, `${c} кус.`]), P.cuts, k => P.cuts = +k),
      h('span', { class: 'dim' }, 'Тесто'), chipRow(run.owned.dough.map(k => [k, DOUGHS[k].name]), P.dough, k => P.dough = k, k => DOUGHS[k].text),
      h('span', { class: 'dim' }, 'Бортик'), chipRow(run.owned.crust.map(k => [k, CRUSTS[k].name]), P.crust, k => P.crust = k, k => CRUSTS[k].text));
    draw(); saveRun();
  }
  const guests = h('div', { class: 'guestlist' }, order.guests.map(g => guestRow(g)));
  app.append(
    h('h1', {}, order.title),
    h('p', { class: 'dim' }, `${order.district} · ${order.guests.length} чел. · ${money(order.pay)}${order.text ? ' · ' + order.text : ''}`),
    h('div', { class: 'kitchen' },
      h('div', { class: 'box' }, cv, info),
      h('div', { style: 'display:grid;gap:12px;align-content:start;min-width:0' },
        h('div', { class: 'box' }, h('h3', {}, 'Гости'), guests),
        h('div', { class: 'box' }, opts),
        h('div', { class: 'box' }, h('h3', {}, 'Склад'), h('p', { class: 'hint' }, 'Выбери топинг и нажми на точку на пицце. Цифры — сытость каждого куска без учёта вкусов.'), invEl),
        h('div', { class: 'row' },
          h('button', { class: 'btn', onclick: () => depart(order) }, 'Везти заказ'),
          h('button', { class: 'btn alt', onclick: board }, 'Назад к доске')))));
  renderInv(); rebuild();
}

function guestRow(g) {
  const a = ARCH[g.arch];
  const likes = a.likes.map(t => TAGS[t]).concat((a.likeIds || []).map(id => TOPPINGS[id].name));
  const dis = a.dislikes.map(t => TAGS[t]).concat((a.dislikeIds || []).map(id => TOPPINGS[id].name));
  return h('div', { class: 'guest' }, portrait(g.seed, looks(g)),
    h('div', { class: 'sm' }, h('b', {}, g.name), ` · ${a.name} · голод ${g.hunger}`, h('br'),
      likes.length ? h('span', { class: 'g' }, '♥ ' + likes.join(', ')) : null, likes.length && dis.length ? ' ' : null,
      dis.length ? h('span', { class: 'r' }, '✕ ' + dis.join(', ')) : null));
}

function depart(order) {
  spendHours(run, order.hours);
  let heat = startHeat(run, order);
  const ev = rollEvent(run);
  const go = out => { heat += (out && out.heat) || 0; table(order, heat); };
  saveRun(); updateHud();
  if (ev) showEvent(ev, go); else go();
}

/* ---------- Застолье ---------- */
function table(order, heat) {
  clear(); updateHud();
  const { W, H } = TABLE;
  const cv = h('canvas', { class: 'px', width: W, height: H, 'aria-label': 'Стол с пиццей и гостями' });
  const ctx = cv.getContext('2d'); const bg = roomBg();
  let rotation = 0, battle = null, speed = 1, floaters = [], bubbles = {}, last = 0, raf = 0, ended = false;
  const logEl = h('div', { class: 'log', 'aria-live': 'polite' });
  const log = (txt, cls = '') => { logEl.prepend(h('div', { class: cls }, txt)); };
  const env = () => ({ heat, rotation, seatOffset: order.seatOffset, ordersToday: run.ordersToday, patienceBonus: run.mods.patienceBonus || 0 });
  const n = order.guests.length;
  const seats = order.guests.map((g, i) => seatAngle(i, n, order.seatOffset));

  function drawScene(t) {
    ctx.drawImage(bg, 0, 0);
    const people = order.guests.map((g, i) => { const [x, y] = seatXY(seats[i]); return { g, i, x, y }; }).sort((a, b) => a.y - b.y);
    const drawGuest = p => {
      const st = battle ? battle.guests[p.i] : null;
      const mood = st ? (st.fed ? 'happy' : st.mood === 'angry' ? 'angry' : undefined) : undefined;
      const px = Math.round(p.x - 8), py = Math.round(p.y - 30);
      person(ctx, px, py, p.g.seed, { ...looks(p.g), mood });
      if (st && st.eating) drawSliceInHand(ctx, px + 12, py + 17, st.eating.t / st.eating.dur);
      const hb = st ? st.hunger / st.hungerMax : 1, pb = st ? Math.max(0, Math.min(1, st.patience / 100)) : 1;
      if (!st || !st.fed) { R(ctx, px, py - 9, 16, 8, '#0d0912'); R(ctx, px + 1, py - 8, Math.round(14 * hb), 2, '#74c34f'); R(ctx, px + 1, py - 4, Math.round(14 * pb), 2, pb < 0.35 ? '#e2513b' : '#55a8e0'); }
      const bb = bubbles[p.i]; if (bb && bb.until > t) bubble(ctx, px + 12, py - 20, bb.kind);
    };
    people.filter(p => p.y < TABLE.cy).forEach(drawGuest);
    drawTableTop(ctx);
    const eaten = new Set(battle ? battle.slices.filter(s => s.takenBy !== null).map(s => s.s) : []);
    drawPizzaOnTable(ctx, run.pizza, rotation, eaten);
    if (!battle) {
      // стрелки: какой кусок гость возьмёт первым
      const picks = firstPicks(run.pizza, n, env());
      picks.forEach((s, i) => {
        if (s < 0) return;
        const [sx, sy] = sliceXY(sliceAngle(s, run.pizza.cuts, rotation), 0.62);
        const [gx, gy] = seatXY(seats[i]);
        ctx.strokeStyle = 'rgba(246,196,69,.85)'; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(gx, gy - 12); ctx.lineTo(sx, sy); ctx.stroke(); ctx.setLineDash([]);
        R(ctx, Math.round(sx) - 1, Math.round(sy) - 1, 3, 3, '#f6c445');
      });
    }
    people.filter(p => p.y >= TABLE.cy).forEach(drawGuest);
    floaters = floaters.filter(f => f.until > t);
    floaters.forEach(f => { const k = 1 - (f.until - t) / 1200; text3(ctx, f.txt, Math.round(f.x), Math.round(f.y - k * 12), f.col, '#120d18'); });
    text3(ctx, `${Math.round(battle ? battle.heat : heat)}°`, 4, 4, '#f6c445', '#120d18');
  }

  function loop(ts) {
    const dt = Math.min(0.05, (ts - (last || ts)) / 1000) * speed; last = ts;
    if (battle && !battle.over) {
      const evs = step(battle, dt);
      for (const e of evs) handle(e, ts);
    }
    drawScene(ts);
    if (battle && battle.over && !ended) { ended = true; setTimeout(() => finish(), 700); }
    raf = requestAnimationFrame(loop);
  }
  function handle(e, ts) {
    const g = order.guests[e.g], st = battle.guests[e.g];
    const [x, y] = e.g != null ? seatXY(seats[e.g]) : [0, 0];
    if (e.type === 'ate') {
      floaters.push({ txt: '+' + Math.round(e.value), x: x - 6, y: y - 46, col: '#a8e87a', until: ts + 1200 });
      log(`${g.name} съел кусок: +${Math.round(e.value)} сытости${e.recipes.length ? ` (${e.recipes.join(', ')})` : ''}`, 'g');
    }
    if (e.type === 'disgust') { bubbles[e.g] = { kind: 'yuck', until: ts + 1400 }; log(`${g.name}: «Фу, что это?» Терпение −25`, 'r'); }
    if (e.type === 'complain') { bubbles[e.g] = { kind: 'angry', until: ts + 1400 }; log(`${g.name} жалуется: долго и голодно`, 'r'); }
    if (e.type === 'shield') { bubbles[e.g] = { kind: 'shield', until: ts + 1400 }; log(`Сырный бортик погасил жалобу ${g.name}`, 'y'); }
    if (e.type === 'fed') { bubbles[e.g] = { kind: 'heart', until: ts + 99999 }; log(`${g.name} наелся`, 'y'); }
    if (e.type === 'end') log(e.result === 'win' ? 'Все сыты!' : 'Пицца кончилась, а кто-то ещё голоден', e.result === 'win' ? 'y' : 'r');
  }
  function finish() {
    cancelAnimationFrame(raf);
    const res = score(battle, order, { tipsMul: run.mods.tipsMul, union: lvl(run, 'union') });
    const ratingBefore = run.rating;
    applyResult(run, res);
    if (order.kind === 'boss') run.bossDone = true;
    saveRun(); updateHud();
    resultModal(order, res, ratingBefore);
  }

  const rotL = h('button', { class: 'btn alt', 'aria-label': 'Повернуть пиццу влево', onclick: () => { rotation = (rotation + 23) % 24; } }, '⟲');
  const rotR = h('button', { class: 'btn alt', 'aria-label': 'Повернуть пиццу вправо', onclick: () => { rotation = (rotation + 1) % 24; } }, '⟳');
  const serve = h('button', { class: 'btn', onclick: () => {
    battle = createBattle(run.pizza, order.guests, env());
    rotL.disabled = rotR.disabled = serve.disabled = true; spd.disabled = false;
    log('Пицца на столе. Налетай!', 'y');
  } }, 'Подать');
  const spd = h('button', { class: 'btn alt', disabled: true, onclick: () => { speed = speed === 1 ? 2.5 : 1; spd.textContent = speed === 1 ? 'Быстрее ×2,5' : 'Обычная скорость'; } }, 'Быстрее ×2,5');
  app.append(
    h('h1', {}, order.title),
    h('p', { class: 'dim' }, 'Каждый гость возьмёт ближайший к себе свободный кусок. Жёлтые линии показывают, кто что съест первым. Поверни пиццу и подавай.'),
    h('div', { class: 'table-wrap' },
      h('div', { class: 'scene' }, cv),
      h('div', { class: 'row' }, rotL, rotR, serve, spd),
      h('div', { class: 'box' }, h('div', { class: 'guestlist' }, order.guests.map(guestRow))),
      logEl));
  raf = requestAnimationFrame(loop);
  stopScene = () => cancelAnimationFrame(raf);
}

/* ---------- Итог заказа ---------- */
function resultModal(order, res, ratingBefore) {
  const r = runR(run);
  const review = reviewText(r, res.stars);
  const who = order.guests[Math.floor(r() * order.guests.length)].name;
  const choices = run.over ? [] : rewardChoices(run);
  const go = () => { closeModal(); afterCard(); };
  openModal(
    h('h2', {}, res.allFed ? 'Все сыты' : 'Не все наелись'),
    h('div', { class: 'stars', 'aria-label': `${res.stars} из 5` }, stars(res.stars)),
    h('div', {},
      h('div', { class: 'rrow' }, h('span', {}, 'Оплата'), h('span', {}, money(res.pay))),
      h('div', { class: 'rrow g' }, h('span', {}, 'Чаевые'), h('span', {}, '+' + money(res.tips))),
      res.sold ? h('div', { class: 'rrow' }, h('span', {}, `Остатки соседу (${res.leftovers} кус.)`), h('span', {}, '+' + money(res.sold))) : null,
      res.fine ? h('div', { class: 'rrow r' }, h('span', {}, 'Штраф'), h('span', {}, '−' + money(res.fine))) : null,
      h('div', { class: 'rrow' }, h('span', {}, 'Рейтинг'), h('span', { class: res.rating >= 0 ? 'g' : 'r' }, `${ratingBefore.toFixed(2)} → ${run.rating.toFixed(2)}★`)),
      res.complaints ? h('div', { class: 'rrow r' }, h('span', {}, 'Жалобы'), h('span', {}, res.complaints)) : null),
    h('div', { class: 'review' }, `«${review}» — ${who}`),
    run.fired ? h('p', { class: 'r' }, 'Рейтинг упал ниже 3,5★. Тебя уволили.') : null,
    choices.length ? h('div', {}, h('h3', {}, 'Награда: выбери топинг'), h('div', { class: 'picks' }, choices.map(id => h('button', { class: 'pick', onclick: () => { run.inventory.push(id); saveRun(); go(); } }, iconAny(id), h('div', {}, h('b', {}, TOPPINGS[id].name), h('div', { class: 'sm dim' }, TOPPINGS[id].text)))))) : null,
    h('button', { class: 'btn alt', onclick: go }, choices.length ? 'Пропустить награду' : 'Дальше'));
}

/* ---------- Конец дня и недели ---------- */
function endDay() {
  const d = run.day;
  const today = run.stars.slice(-run.ordersToday);
  nextDay(run); saveRun();
  clear(); updateHud();
  app.append(
    h('h1', {}, `${DAYS[d]} закончен`),
    h('div', { class: 'box', style: 'max-width:520px' },
      h('div', { class: 'rrow' }, h('span', {}, 'Заказов за день'), h('span', {}, today.length)),
      h('div', { class: 'rrow' }, h('span', {}, 'Средняя оценка'), h('span', { class: 'y' }, today.length ? (today.reduce((a, b) => a + b, 0) / today.length).toFixed(1) + '★' : '—')),
      h('div', { class: 'rrow' }, h('span', {}, 'В кармане'), h('span', { class: 'y' }, money(run.money))),
      h('div', { class: 'rrow' }, h('span', {}, 'Рейтинг'), h('span', { class: 'g' }, run.rating.toFixed(2) + '★'))),
    h('p', { class: 'dim', style: 'margin-top:12px' }, run.over ? 'Это была последняя смена.' : BOSSES[run.day] ? `Завтра большой заказ: ${BOSSES[run.day].title}.` : 'Завтра новый день и новые заказы.'),
    h('button', { class: 'btn', onclick: () => run.over ? retire() : board() }, run.over ? 'На пенсию' : `Начать: ${DAYS[run.day]}`));
}

function retire() {
  clear(); updateHud(); hud.hidden = true;
  const p = pension(run);
  const avg = run.stars.length ? (run.stars.reduce((a, b) => a + b, 0) / run.stars.length).toFixed(1) : '0';
  if (!run.counted) {
    meta.pension += p; meta.weeks++; meta.best = Math.max(meta.best, p);
    meta.fame.push({ fired: run.fired, served: run.served, avg, pension: p });
    run.counted = true; saveMeta(); saveRun();
  }
  app.append(
    h('h1', {}, run.fired ? 'Уволен' : 'На заслуженном отдыхе'),
    h('p', { class: 'dim' }, run.fired ? 'Неделя не задалась. Половина накоплений всё равно идёт в фонд пиццерии.' : 'Неделя позади. Курьер вешает куртку на гвоздь и уходит на Стену славы.'),
    h('div', { class: 'box', style: 'max-width:520px' },
      h('div', { class: 'rrow' }, h('span', {}, 'Заказов'), h('span', {}, run.served)),
      h('div', { class: 'rrow' }, h('span', {}, 'Средняя оценка'), h('span', { class: 'y' }, avg + '★')),
      h('div', { class: 'rrow' }, h('span', {}, 'Заработано за неделю'), h('span', {}, money(run.earned))),
      h('div', { class: 'rrow g' }, h('span', {}, 'В пенсионный фонд'), h('span', {}, '+' + money(p)))),
    h('div', { class: 'row', style: 'margin-top:16px' },
      h('button', { class: 'btn', onclick: pizzeria }, 'В пиццерию'),
      h('button', { class: 'btn alt', onclick: () => { run = createRun(meta, Date.now() >>> 0); saveRun(); board(); } }, 'Новая неделя')));
}

title();
