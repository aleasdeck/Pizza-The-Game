// Экраны игры: один игровой экран 480×270 (как в Punch Club), сцены, HUD и окна поверх.
import { TOPPINGS, DOUGHS, CRUSTS, CUTS, ARCH, TAGS, DAYS, DAYS_SHORT, BOSSES, DAY_START, DAY_END } from './data.js';
import { createRun, newMeta, makeBoard, spendHours, rollEvent, applyEffect, startHeat, applyResult, rewardChoices, shopOffers, buy, nextDay, pension, hoursLeft, isBossDay, UPGRADES, lvl, reviewText, R as runR, clampRating } from './run.js';
import { describeSlices, sliceValue, createBattle, step, score, firstPicks, seatAngle, sliceAngle } from './sim.js';
import { iconAny, person, R, text3, reduce } from './gfx.js';
import { renderPizza, pickSpot, roomBg, drawTableTop, drawPizzaOnTable, seatXY, sliceXY, drawSliceInHand, bubble, cityScene, portrait, TABLE, ico, face, cityMap, MAP, mapScooter, kitchenBg, baseIcon } from './views.js';

const W = 480, H = 270;
const $ = (s, el = document) => el.querySelector(s);
const G = $('#game'), scene = $('#scene'), hud = $('#hud'), layer = $('#layer'), tip = $('#tip');
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c));
  return el;
};
const at = (x, y, w, hh) => `left:${x}px;top:${y}px;` + (w ? `width:${w}px;` : '') + (hh ? `height:${hh}px;` : '');
const money = n => `${Math.round(n).toLocaleString('ru-RU')} ₽`;
const clock = x => `${String(Math.floor(x)).padStart(2, '0')}:${x % 1 >= 0.5 ? '30' : '00'}`;

/* ---------- Масштаб экрана ---------- */
let K = 1;
function fit() {
  const vw = innerWidth, vh = innerHeight;
  let k = Math.min(vw / W, vh / H); const ki = Math.floor(k);
  if (ki >= 2 && ki / k > 0.82) k = ki;
  K = k; G.style.transform = `translate(${Math.round((vw - W * k) / 2)}px,${Math.round((vh - H * k) / 2)}px) scale(${k})`;
}
addEventListener('resize', fit); fit();
const gp = e => { const r = G.getBoundingClientRect(); return [(e.clientX - r.left) / K, (e.clientY - r.top) / K]; };

/* ---------- Подсказки ---------- */
function placeTip(e) { const [x, y] = gp(e); const w = tip.offsetWidth, hh = tip.offsetHeight; tip.style.left = Math.max(2, Math.min(W - w - 2, x + 8)) + 'px'; tip.style.top = (y + 14 + hh > H ? Math.max(2, y - hh - 6) : y + 14) + 'px'; }
function showTip(text, e) { if (!text) { tip.hidden = true; return; } if (tip.textContent !== text) tip.textContent = text; tip.hidden = false; placeTip(e); }
G.addEventListener('pointerover', e => { const t = e.target.closest?.('[data-tip]'); if (t) showTip(t.dataset.tip, e); });
G.addEventListener('pointermove', e => { if (!tip.hidden) placeTip(e); });
G.addEventListener('pointerout', e => { const t = e.target.closest?.('[data-tip]'); if (t && !t.contains(e.relatedTarget)) tip.hidden = true; });

/* ---------- Сохранения ---------- */
const META_KEY = 'pizza-week-meta', RUN_KEY = 'pizza-week-run';
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } };
let meta = Object.assign(newMeta(), load(META_KEY, {}));
let run = load(RUN_KEY, null);
const saveRun = () => save(RUN_KEY, run);
const saveMeta = () => save(META_KEY, meta);

/* ---------- Сцены и окна ---------- */
let stop = null, escAction = null;
function setScene(...kids) {
  if (stop) { stop(); stop = null; }
  closeWin(); tip.hidden = true; escAction = null;
  scene.replaceChildren(...kids.flat().filter(k => k != null && k !== false));
}
function openWin(cls, ...kids) {
  layer.className = /dialog/.test(cls) ? 'clear' : '';
  layer.replaceChildren(h('div', { class: 'win ' + cls, role: 'dialog', 'aria-modal': 'true' }, ...kids.flat().filter(k => k != null && k !== false)));
  layer.hidden = false; tip.hidden = true;
  layer.querySelector('button:not([disabled])')?.focus({ preventScroll: true });
}
function closeWin() { layer.hidden = true; layer.replaceChildren(); }
const winOpen = () => !layer.hidden;
function toast(msg) { const t = h('div', { class: 'toast', role: 'status' }, msg); G.append(t); setTimeout(() => t.remove(), 2200); }
addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const w = layer.firstChild;
  if (w && w.classList.contains('closable')) closeWin();
  else if (!w && escAction) escAction();
});

/* ---------- HUD ---------- */
function bar(f, cls = '', mark) {
  const b = h('span', { class: 'bar ' + cls }, h('i', { style: `width:${Math.max(0, Math.min(1, f)) * 100}%` }));
  if (mark) b.append(h('u', { style: `left:${mark * 100}%` }));
  return b;
}
function updateHud(hr = run?.hour) {
  if (!run) { hud.hidden = true; return; }
  hud.hidden = false;
  const bad = run.rating < 3.8;
  hud.replaceChildren(
    h('div', { class: 'hud-days' }, DAYS_SHORT.map((d, i) => h('span', { class: (i === run.day ? 'now' : i < run.day ? 'done' : '') + (BOSSES[i] ? ' boss' : ''), 'data-tip': DAYS[i] + (BOSSES[i] ? `\nБанкет: ${BOSSES[i].title}` : '') }, d))),
    h('div', { class: 'hud-clock', 'data-tip': `Смена с ${DAY_START}:00 до ${DAY_END}:00` }, ico('clock'), h('b', {}, clock(hr)), bar((hr - DAY_START) / (DAY_END - DAY_START), 'time')),
    h('div', { class: 'hud-money', 'data-tip': 'Деньги. На неделю и на пенсию' }, ico('coin'), h('b', { class: 'y' }, money(run.money))),
    h('div', { class: 'hud-rate', 'data-tip': `Рейтинг ${run.rating.toFixed(2)}★\nНиже 3,5★ уволят` }, ico('star'), h('b', { class: bad ? 'r' : '' }, run.rating.toFixed(2)), bar(run.rating / 5, bad ? 'bad' : 'good', 0.7)),
    h('button', { class: 'hud-menu', 'aria-label': 'Меню', 'data-tip': 'Пауза и меню', onclick: pauseMenu }, '≡'));
}

function looks(g) { return { ...(ARCH[g.arch].look || {}), crown: /Невеста|Гендир/.test(g.name || '') }; }
function tastes(g) {
  const a = ARCH[g.arch];
  return {
    likes: (g.likes || a.likes).map(t => TAGS[t]).concat((a.likeIds || []).map(id => TOPPINGS[id].name)),
    dis: a.dislikes.map(t => TAGS[t]).concat((a.dislikeIds || []).map(id => TOPPINGS[id].name)),
  };
}
function guestTip(g) {
  const { likes, dis } = tastes(g);
  return `${g.name} · ${ARCH[g.arch].name}\nГолод ${g.hunger}` + (likes.length ? `\nЛюбит: ${likes.join(', ')}` : '') + (dis.length ? `\nНе ест: ${dis.join(', ')}` : '');
}
function tasteTags(guests) {
  const likes = [...new Set(guests.flatMap(g => tastes(g).likes))], dis = [...new Set(guests.flatMap(g => tastes(g).dis))];
  return h('div', { class: 'tags' }, likes.map(t => h('span', { class: 'tag g' }, ico('heart'), t)), dis.map(t => h('span', { class: 'tag r' }, ico('cross'), t)));
}

/* ---------- Титул ---------- */
function title() {
  run = load(RUN_KEY, null); hud.hidden = true;
  const cv = h('canvas', { class: 'px full', width: 240, height: 135 });
  const cont = run && !run.over;
  const item = (label, fn) => h('button', { class: 'mi', onclick: fn }, label);
  setScene(cv,
    h('div', { class: 'logo', style: at(18, 14) }, 'ПИЦЦА:', h('br'), h('span', {}, 'ПОСЛЕДНЯЯ НЕДЕЛЯ')),
    h('nav', { class: 'menu', style: at(14, 136) },
      cont ? item(`Продолжить: ${DAYS[run.day].toLowerCase()}`, () => mapScreen()) : null,
      item(cont ? 'Новая неделя' : 'Начать неделю', newWeek),
      item('Пиццерия', pizzeria),
      item('Как играть', howTo)),
    h('div', { class: 'foot', style: at(16, 254) }, `Пенсионный фонд: ${money(meta.pension)} · отработано недель: ${meta.weeks}`));
  stop = cityScene(cv);
}
function newWeek() { run = createRun(meta, Date.now() >>> 0); saveRun(); mapScreen(); toast('Неделя до пенсии. Выбирай заказы на карте'); }

function howTo() {
  openWin('center w340 closable',
    h('h2', {}, 'Как играть'),
    h('p', {}, h('b', { class: 'y' }, '1. Карта. '), 'Метки на карте — заказы. Нажми на метку, посмотри гостей и бери заказ. Дорога тратит часы смены.'),
    h('p', {}, h('b', { class: 'y' }, '2. Кухня. '), 'Выбери топинг на полке и нажимай на точки пиццы. Нарезка решает, что попадёт в каждый кусок.'),
    h('p', {}, h('b', { class: 'y' }, '3. Застолье. '), 'Гости сидят вокруг стола и едят ближайший свободный кусок. Крути пиццу, чтобы любимое оказалось перед нужным гостем, и жми «Подать».'),
    h('p', {}, h('b', { class: 'y' }, '4. Рейтинг. '), 'Сытые гости дают чаевые, голодные жалуются. Ниже 3,5★ — увольнение.'),
    h('p', {}, h('b', { class: 'y' }, '5. Неделя. '), 'В среду, субботу и воскресенье ждут банкеты. После воскресенья — пенсия и прокачка пиццерии.'),
    h('button', { class: 'b', onclick: closeWin }, 'Понятно'));
}
function pauseMenu() {
  openWin('center w200 closable',
    h('h2', {}, 'Пауза'),
    h('div', { class: 'col' },
      h('button', { class: 'b', onclick: closeWin }, 'Продолжить'),
      h('button', { class: 'b alt', onclick: howTo }, 'Как играть'),
      h('button', { class: 'b alt', onclick: title }, 'Главное меню')));
}

/* ---------- Пиццерия (мета) ---------- */
let kitchenCache = null;
const kitchenCanvas = () => { const bg = h('canvas', { class: 'px full', width: W, height: H }); bg.getContext('2d').drawImage(kitchenCache || (kitchenCache = kitchenBg()), 0, 0); return bg; };
function pizzeria() {
  hud.hidden = true;
  const tiles = Object.entries(UPGRADES).map(([k, u]) => {
    const l = lvl(meta, k), maxed = l >= u.max, cost = u.cost[l];
    return h('div', { class: 'ut' },
      h('b', {}, u.name),
      h('span', { class: 'pips' }, '■'.repeat(l) + '□'.repeat(u.max - l)),
      h('span', { class: 'xs' + (l ? '' : ' dim') }, u.text(Math.max(1, l))),
      maxed ? h('span', { class: 'tag g' }, 'Максимум') :
        h('button', { class: 'b sm', disabled: meta.pension < cost, onclick: () => { meta.pension -= cost; meta.up[k] = l + 1; saveMeta(); pizzeria(); } }, money(cost)));
  });
  setScene(kitchenCanvas(), h('div', { class: 'win', style: at(14, 12, 452, 246) },
    h('div', { class: 'row' }, h('h2', {}, 'Пиццерия «Последний кусок»'), h('span', { class: 'tag y push' }, ico('coin'), 'Фонд: ' + money(meta.pension))),
    h('p', { class: 'sm dim' }, 'Каждая покупка действует с начала следующей недели.'),
    h('div', { class: 'upg' }, tiles),
    h('div', { class: 'row', style: 'margin-top:6px' },
      h('button', { class: 'b', onclick: title }, '← Назад'),
      h('button', { class: 'b alt', onclick: fame }, 'Стена славы'))));
  escAction = title;
}
function fame() {
  const list = meta.fame.slice(-8).reverse();
  openWin('center w300 closable', h('h2', {}, 'Стена славы'),
    list.length ? list.map(f => h('div', { class: 'rrow' }, h('span', {}, f.fired ? 'Уволен' : 'На пенсии'), h('span', { class: 'dim' }, `${f.served} зак. · ${f.avg}★`), h('b', { class: 'y' }, money(f.pension)))) : h('p', { class: 'dim' }, 'Пока пусто. Отработай первую неделю.'),
    h('button', { class: 'b', onclick: closeWin }, 'Закрыть'));
}

/* ---------- Карта города ---------- */
let mapCache = null;
const getMap = () => mapCache || (mapCache = cityMap());
const darkness = hr => hr <= 15 ? 0 : Math.min(0.85, (hr - 15) / 7 * 0.85);
function routeOf(to) { const [dx, dy] = MAP.depot; return [[dx, dy], [dx, 130], [to[0], 130], [to[0], to[1] + 6]]; }
function along(pts, f) {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  let d = f * segs.reduce((a, b) => a + b, 0);
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) { const k = segs[i] ? Math.min(1, d / segs[i]) : 1, a = pts[i], b = pts[i + 1]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, Math.sign(b[0] - a[0]) || 1]; }
    d -= segs[i];
  }
}

function mapScreen(drive = null) {
  if (!run) return title();
  if (run.over) return retire();
  updateHud(drive ? drive.fromHour : run.hour);
  const M = getMap();
  const cv = h('canvas', { class: 'px full', width: W, height: H });
  const ctx = cv.getContext('2d');
  let sel = null, raf = 0, shownHour = -1, lastDir = 1;
  const pins = h('div', { class: 'pins', hidden: !!drive });
  const side = h('div', { class: 'win side', hidden: true });
  const forced = run.board.length === 1 && run.board[0].kind === 'boss';
  const hint = h('div', { class: 'hintbox', style: at(6, 250) },
    drive ? `В пути: ${drive.order.title}` : forced ? 'Смена кончается. Остался банкет.' : isBossDay(run) && !run.bossDone ? `Сегодня банкет: ${BOSSES[run.day].title}` : 'Выбери заказ на карте');

  const used = {};
  const where = c => {
    const key = c.kind === 'order' ? c.district : c.kind === 'home' ? 'pizzeria' : c.kind;
    const base = MAP.loc[key], k = used[key] = (used[key] || 0) + 1;
    const off = [[0, 0], [-26, 14], [26, 14], [0, 28]][(k - 1) % 4];
    return [base[0] + off[0], base[1] + off[1]];
  };
  const items = run.board.map(c => ({ c, xy: where(c) })).concat([{ c: { kind: 'home' }, xy: MAP.loc.pizzeria }]);
  for (const it of items) {
    const c = it.c; let cls = 'pin', label, tp;
    if (c.kind === 'order') { label = [ico('guest'), String(c.guests.length), ico('clock'), `${c.hours}ч`]; tp = `${c.title}\n${money(c.pay)} · ${c.hours} ч`; }
    if (c.kind === 'boss') { cls += ' boss'; label = [ico('crown'), 'БАНКЕТ']; tp = c.title; }
    if (c.kind === 'shop') { cls += ' alt'; label = [ico('cart'), 'Оптовка']; tp = 'Топинги, тесто, бортики · 1 ч'; }
    if (c.kind === 'rest') { cls += ' alt'; label = [ico('bench'), 'Перекур']; tp = '+0,1★ и случайная встреча · 1 ч'; }
    if (c.kind === 'home') { cls += ' home'; label = [ico('home'), 'Смена']; tp = 'Пиццерия. Закончить смену'; }
    it.el = h('button', { class: cls, style: at(it.xy[0], it.xy[1]), 'data-tip': tp, onclick: () => select(it) }, label);
    pins.append(it.el);
  }

  function unselect() { sel = null; side.hidden = true; items.forEach(i => i.el.classList.remove('on')); }
  function select(it) {
    sel = it; items.forEach(i => i.el.classList.toggle('on', i === it));
    const c = it.c; c.xy = it.xy;
    const close = h('button', { class: 'x', 'aria-label': 'Закрыть', onclick: unselect }, '✕');
    if (c.kind === 'order' || c.kind === 'boss') {
      const need = c.guests.reduce((a, g) => a + g.hunger, 0);
      side.replaceChildren(close,
        h('span', { class: 'tag ' + (c.kind === 'boss' ? 'r' : '') }, c.kind === 'boss' ? 'БАНКЕТ ДНЯ' : c.district),
        h('h3', {}, c.title),
        c.text ? h('p', { class: 'sm dim' }, c.text) : null,
        h('div', { class: 'faces' }, c.guests.map(g => { const p = portrait(g.seed, looks(g)); p.dataset.tip = guestTip(g); return p; })),
        tasteTags(c.guests),
        h('div', { class: 'kv' }, ico('coin'), h('span', {}, 'Оплата'), h('b', { class: 'y' }, money(c.pay))),
        h('div', { class: 'kv' }, ico('clock'), h('span', {}, 'Дорога'), h('b', {}, `${c.hours} ч`)),
        h('div', { class: 'kv' }, ico('guest'), h('span', {}, 'Голод гостей'), h('b', {}, need)),
        h('button', { class: 'b big wide', onclick: () => kitchen(c) }, 'Взять заказ'));
    } else if (c.kind === 'shop') {
      side.replaceChildren(close, h('h3', {}, 'Оптовка'), h('p', { class: 'sm' }, 'Топинги на склад, новое тесто и бортики. Дорога туда и обратно — 1 час.'),
        h('button', { class: 'b big wide', onclick: () => { spendHours(run, 1); saveRun(); updateHud(); shop(); } }, 'Поехать'));
    } else if (c.kind === 'rest') {
      side.replaceChildren(close, h('h3', {}, 'Перекур на лавочке'), h('p', { class: 'sm' }, 'Час в парке. Рейтинг +0,1★, и может случиться что угодно.'),
        h('button', { class: 'b big wide', onclick: rest }, 'Посидеть'));
    } else {
      const locked = isBossDay(run) && !run.bossDone;
      side.replaceChildren(close, h('h3', {}, 'Пиццерия'),
        h('div', { class: 'kv' }, h('span', {}, 'Заказов сегодня'), h('b', {}, run.ordersToday)),
        h('div', { class: 'kv' }, h('span', {}, 'До конца смены'), h('b', {}, `${hoursLeft(run)} ч`)),
        h('p', { class: 'sm dim' }, locked ? 'Сегодня нельзя уйти, пока не отработан банкет.' : 'Можно закончить смену раньше. Оставшиеся часы сгорят.'),
        h('button', { class: 'b big wide', disabled: locked, onclick: endDay }, 'Закончить смену'));
    }
    side.hidden = false;
  }

  function frame(t) {
    let hr = run.hour, pos = null;
    if (drive) {
      drive.t0 ??= t;
      const k = reduce ? 1 : Math.min(1, (t - drive.t0) / drive.dur);
      hr = drive.fromHour + (run.hour - drive.fromHour) * k;
      pos = along(routeOf(drive.order.xy), k);
      if (pos[0] !== drive.px) { lastDir = Math.sign(pos[0] - (drive.px ?? pos[0])) || lastDir; drive.px = pos[0]; }
      if (k >= 1 && !drive.arrived) { drive.arrived = true; setTimeout(drive.onArrive, 250); }
    }
    ctx.drawImage(M.day, 0, 0);
    const dk = darkness(hr); if (dk > 0) { ctx.globalAlpha = dk; ctx.drawImage(M.night, 0, 0); ctx.globalAlpha = 1; }
    for (const [x, y] of M.chimneys) for (let i = 0; i < 4; i++) {
      const p = reduce ? i / 4 : ((t / 1600) + i / 4) % 1;
      ctx.fillStyle = `rgba(220,220,230,${(0.65 * (1 - p)).toFixed(2)})`; ctx.fillRect(Math.round(x + p * 8 + Math.sin(p * 6 + i) * 1.5), Math.round(y - p * 20), 3 + Math.round(p * 2), 3);
    }
    const target = drive ? drive.order.xy : sel && sel.c.kind !== 'home' ? sel.xy : null;
    if (target) {
      ctx.save(); ctx.strokeStyle = '#f6c445'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.lineDashOffset = reduce ? 0 : -t / 60;
      ctx.beginPath(); routeOf(target).forEach(([x, y], i) => i ? ctx.lineTo(x + 0.5, y + 0.5) : ctx.moveTo(x + 0.5, y + 0.5)); ctx.stroke(); ctx.restore();
    }
    if (pos) mapScooter(ctx, pos[0], pos[1], lastDir, t);
    else mapScooter(ctx, MAP.depot[0] + 8, MAP.depot[1], 1, t);
    if (drive && Math.floor(hr * 2) !== shownHour) { shownHour = Math.floor(hr * 2); updateHud(shownHour / 2); }
    raf = requestAnimationFrame(frame);
  }
  setScene(cv, pins, side, hint);
  escAction = () => sel && unselect();
  raf = requestAnimationFrame(frame);
  stop = () => cancelAnimationFrame(raf);
}

function rest() {
  spendHours(run, 1); run.rating = clampRating(run.rating + 0.1); saveRun(); updateHud();
  const ev = rollEvent(run);
  if (ev) return showEvent(ev, () => afterCard());
  toast('Покурил, выдохнул. +0,1★'); afterCard();
}

function afterCard() {
  saveRun();
  if (run.over) return retire();
  if (hoursLeft(run) < 1 && !(isBossDay(run) && !run.bossDone)) return endDay();
  run.board = makeBoard(run); saveRun(); mapScreen();
}

/* ---------- Оптовка ---------- */
function shop() {
  const offers = shopOffers(run);
  const render = () => {
    updateHud();
    openWin('center w340',
      h('div', { class: 'row' }, h('h2', {}, 'Оптовка'), h('span', { class: 'tag y push' }, ico('coin'), money(run.money))),
      h('p', { class: 'sm dim' }, 'Топинги идут на склад. Тесто и бортик сразу ставятся на пиццу.'),
      h('div', { class: 'picks' }, offers.map(o => {
        const name = o.type === 'top' ? TOPPINGS[o.id].name : o.type === 'dough' ? `Тесто «${DOUGHS[o.id].name}»` : `Бортик «${CRUSTS[o.id].name}»`;
        const text = o.type === 'top' ? `${TAGS[TOPPINGS[o.id].tag]} · сытость ${TOPPINGS[o.id].value}\n${TOPPINGS[o.id].text}` : o.type === 'dough' ? DOUGHS[o.id].text : CRUSTS[o.id].text;
        const ic = o.type === 'top' ? iconAny(o.id) : baseIcon(o.type);
        return h('button', { class: 'pick', 'data-tip': text, disabled: o.sold || run.money < o.price, onclick: () => { if (buy(run, o)) { saveRun(); render(); } } },
          ic, h('b', {}, name), h('span', { class: 'p' }, o.sold ? 'Куплено' : money(o.price)));
      })),
      h('button', { class: 'b', onclick: () => { closeWin(); afterCard(); } }, 'Уехать'));
  };
  render();
}

/* ---------- События в дороге ---------- */
function showEvent(ev, done) {
  const seed = [...ev.title].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const por = portrait(seed % 100000, /заказчица/.test(ev.title) ? { style: 'long', shirt: '#d0567e' } : {});
  por.className = 'px por';
  openWin('dialog',
    por,
    h('div', {}, h('span', { class: 'tag bl' }, 'Случай в пути'), h('h3', {}, ev.title), h('p', {}, ev.text)),
    h('div', { class: 'choices' }, ev.choices.map(c => h('button', { class: 'b alt', onclick: () => {
      const out = applyEffect(run, c.effect); if (c.then) applyEffect(run, c.then);
      closeWin();
      let msg = c.note; if (out.gained) msg += ` (+${TOPPINGS[out.gained].name})`; if (out.lost) msg += ` (−${TOPPINGS[out.lost].name})`;
      toast(msg); updateHud(); saveRun(); done(out);
    } }, c.label, h('small', {}, c.note)))));
}

/* ---------- Кухня ---------- */
function kitchen(order) {
  updateHud();
  const P = run.pizza; let sel = null, hover = -1;
  const PW = 140, cx = 70, cy = 70, Rr = 60;
  const cv = h('canvas', { class: 'px pizza-cv', width: PW, height: PW, style: at(170, 58, PW, PW), 'aria-label': 'Пицца: нажми на точку, чтобы положить или снять топинг' });
  const ctx = cv.getContext('2d');
  const env = { heat: startHeat(run, order), ordersToday: run.ordersToday };
  const meter = h('div', { class: 'win meter', style: at(166, 200, 148) });
  function draw() {
    ctx.clearRect(0, 0, PW, PW);
    const slices = describeSlices(P);
    const labels = slices.map(sl => sliceValue(P, sl, null, env).value);
    renderPizza(ctx, cx, cy, Rr, P, { showSpots: true, hover, labels });
    const total = Math.round(labels.reduce((a, b) => a + b, 0)), need = order.guests.reduce((a, g) => a + g.hunger, 0);
    const rec = [...new Set(slices.flatMap(s => s.recipes.map(r => r.name)))];
    meter.replaceChildren(
      h('div', { class: 'kv' }, h('span', {}, 'Сытость пиццы'), h('b', { class: total >= need ? 'g' : 'r' }, `${total} / ${need}`)),
      bar(total / Math.max(1, need), total >= need ? 'good' : 'bad'));
    meter.dataset.tip = rec.length ? `Рецепты: ${rec.join(', ')}` : 'Рецептов нет.\nМаргарита: томаты + моцарелла + базилик в одном куске';
  }
  const shelf = h('div', { class: 'shelf', style: at(8, 222, 360, 44) });
  function renderInv() {
    const counts = {}; run.inventory.forEach(id => counts[id] = (counts[id] || 0) + 1);
    const ids = Object.keys(counts);
    shelf.replaceChildren(...ids.map(id => h('button', {
      class: 'slot' + (sel === id ? ' on' : ''), 'aria-label': TOPPINGS[id].name,
      'data-tip': `${TOPPINGS[id].name} · ${TAGS[TOPPINGS[id].tag]}\nСытость ${TOPPINGS[id].value}\n${TOPPINGS[id].text}`,
      onclick: () => { sel = sel === id ? null : id; renderInv(); },
    }, iconAny(id), counts[id] > 1 ? h('i', {}, counts[id]) : null)));
    if (!ids.length) shelf.append(h('span', { class: 'empty' }, 'Полка пуста. Нажми на топинг на пицце, чтобы снять его.'));
  }
  const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * PW, (e.clientY - r.top) / r.height * PW]; };
  cv.addEventListener('pointermove', e => {
    const [x, y] = pos(e); const s = pickSpot(x, y, cx, cy, Rr, 0);
    if (s !== hover) { hover = s; draw(); }
    showTip(s >= 0 ? (P.spots[s] ? `${TOPPINGS[P.spots[s]].name}\nНажми, чтобы снять` : sel ? `Положить: ${TOPPINGS[sel].name}` : 'Выбери топинг на полке') : '', e);
  });
  cv.addEventListener('pointerleave', () => { hover = -1; tip.hidden = true; draw(); });
  cv.addEventListener('click', e => {
    const [x, y] = pos(e); const s = pickSpot(x, y, cx, cy, Rr, 0); if (s < 0) return;
    if (P.spots[s]) { run.inventory.push(P.spots[s]); P.spots[s] = null; }
    else if (sel) { const k = run.inventory.indexOf(sel); if (k >= 0) { run.inventory.splice(k, 1); P.spots[s] = sel; if (!run.inventory.includes(sel)) sel = null; } }
    else { toast('Сначала выбери топинг на полке'); return; }
    renderInv(); draw(); saveRun();
  });
  const opts = h('div', { class: 'win opts', style: at(330, 68, 142, 120) });
  const chipRow = (items, cur, onPick, tipOf) => h('div', { class: 'opt-row' }, items.map(([k, name]) => h('button', { class: 'b alt sm' + (k == cur ? ' on' : ''), 'aria-pressed': k == cur, 'data-tip': tipOf?.(k) || null, onclick: () => { onPick(k); rebuild(); } }, name)));
  function rebuild() {
    opts.replaceChildren(
      h('h3', {}, 'Нарезка'), chipRow(CUTS.map(c => [c, String(c)]), P.cuts, k => P.cuts = +k, k => `${k} кусков`),
      h('h3', {}, 'Тесто'), chipRow(run.owned.dough.map(k => [k, DOUGHS[k].name]), P.dough, k => P.dough = k, k => DOUGHS[k].text),
      h('h3', {}, 'Бортик'), chipRow(run.owned.crust.map(k => [k, CRUSTS[k].name]), P.crust, k => P.crust = k, k => CRUSTS[k].text));
    draw(); saveRun();
  }
  const ticket = h('div', { class: 'paper ticket', style: at(8, 26, 150, 190) },
    h('div', { class: 'tk-h' }, h('span', {}, order.kind === 'boss' ? 'БАНКЕТ' : 'ЗАКАЗ'), h('span', {}, money(order.pay))),
    h('div', { class: 'tk-t' }, order.title),
    order.guests.map(g => {
      const { likes, dis } = tastes(g);
      return h('div', { class: 'gl', 'data-tip': guestTip(g) }, face(g.seed, looks(g)),
        h('div', {}, h('b', {}, g.name), h('span', { class: 'n' }, `голод ${g.hunger}`),
          h('div', { class: 'lk' }, likes.length ? h('span', { class: 'g' }, '+ ' + likes.join(', ')) : null, ' ', dis.length ? h('span', { class: 'r' }, '− ' + dis.join(', ')) : null)));
    }));
  setScene(kitchenCanvas(), ticket, cv, meter, opts, shelf,
    h('button', { class: 'b big go', style: at(376, 222, 96, 26), onclick: () => depart(order) }, 'В дорогу ▶'),
    h('button', { class: 'b alt sm', style: at(376, 250, 96, 14), onclick: () => mapScreen() }, '← На карту'));
  escAction = () => mapScreen();
  renderInv(); rebuild();
}

function depart(order) {
  const fromHour = run.hour;
  spendHours(run, order.hours);
  let heat = startHeat(run, order);
  const ev = rollEvent(run);
  saveRun();
  const go = out => { heat += (out && out.heat) || 0; table(order, heat); };
  mapScreen({ order, fromHour, dur: 900 + order.hours * 350, onArrive: () => ev ? showEvent(ev, go) : go() });
}

/* ---------- Застолье ---------- */
function table(order, heat) {
  updateHud();
  const { W: TW, H: TH } = TABLE;
  const cv = h('canvas', { class: 'px', width: TW, height: TH, style: at(4, 24, TW, TH), 'aria-label': 'Стол с пиццей и гостями' });
  const ctx = cv.getContext('2d'); const bg = roomBg();
  let rotation = 0, battle = null, speed = 1, floaters = [], bubbles = {}, last = 0, raf = 0, ended = false;
  const env = () => ({ heat, rotation, seatOffset: order.seatOffset, ordersToday: run.ordersToday, patienceBonus: run.mods.patienceBonus || 0 });
  const n = order.guests.length;
  const seats = order.guests.map((g, i) => seatAngle(i, n, order.seatOffset));
  const logLine = h('div', { class: 'logline', 'aria-live': 'polite' }, 'Жёлтые линии: кто какой кусок съест первым');
  const log = (txt, cls = '') => { logLine.className = 'logline ' + cls; logLine.textContent = txt; };
  const heatEl = h('b', {}, `${Math.round(heat)}°`);
  const rows = order.guests.map(g => {
    const hb = h('i', { style: 'width:0%' }), pb = h('i', { style: 'width:100%' });
    const el = h('div', { class: 'grow', 'data-tip': guestTip(g) }, face(g.seed, looks(g)),
      h('div', {}, h('b', {}, g.name), h('span', { class: 'bar good thin' }, hb), h('span', { class: 'bar pat thin' }, pb)));
    return { el, hb, pb };
  });
  const panel = h('div', { class: 'win gpanel', style: at(328, 24, 148, 202) },
    h('div', { class: 'kv' }, ico('fire'), h('span', {}, 'Пицца'), heatEl),
    h('div', { class: 'xs legend' }, h('span', { class: 'g' }, '■ сытость'), ' ', h('span', { class: 'bl' }, '■ терпение')),
    rows.map(r => r.el));

  function drawScene(t) {
    ctx.drawImage(bg, 0, 0);
    const people = order.guests.map((g, i) => { const [x, y] = seatXY(seats[i]); return { g, i, x, y }; }).sort((a, b) => a.y - b.y);
    const drawGuest = p => {
      const st = battle ? battle.guests[p.i] : null;
      const mood = st ? (st.fed ? 'happy' : st.mood === 'angry' ? 'angry' : undefined) : undefined;
      const px = Math.round(p.x - 8), py = Math.round(p.y - 30);
      person(ctx, px, py, p.g.seed, { ...looks(p.g), mood });
      if (st && st.eating) drawSliceInHand(ctx, px + 12, py + 17, st.eating.t / st.eating.dur);
      const bb = bubbles[p.i]; if (bb && bb.until > t) bubble(ctx, px + 12, py - 12, bb.kind);
    };
    people.filter(p => p.y < TABLE.cy).forEach(drawGuest);
    drawTableTop(ctx);
    const eaten = new Set(battle ? battle.slices.filter(s => s.takenBy !== null).map(s => s.s) : []);
    drawPizzaOnTable(ctx, run.pizza, rotation, eaten);
    if (!battle) {
      firstPicks(run.pizza, n, env()).forEach((s, i) => {
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
  }
  function syncPanel() {
    heatEl.textContent = `${Math.round(battle ? battle.heat : heat)}°`;
    if (!battle) return;
    battle.guests.forEach((st, i) => {
      rows[i].hb.style.width = `${Math.max(0, 1 - st.hunger / st.hungerMax) * 100}%`;
      rows[i].pb.style.width = `${Math.max(0, Math.min(1, st.patience / 100)) * 100}%`;
      rows[i].el.classList.toggle('fed', !!st.fed);
      rows[i].el.classList.toggle('angry', !st.fed && st.patience < 35);
    });
  }
  function loop(ts) {
    const dt = Math.min(0.05, (ts - (last || ts)) / 1000) * speed; last = ts;
    if (battle && !battle.over && !winOpen()) for (const e of step(battle, dt)) handle(e, ts);
    drawScene(ts); syncPanel();
    if (battle && battle.over && !ended) { ended = true; setTimeout(finish, 800); }
    raf = requestAnimationFrame(loop);
  }
  function handle(e, ts) {
    const g = order.guests[e.g];
    const [x, y] = e.g != null ? seatXY(seats[e.g]) : [0, 0];
    if (e.type === 'ate') { floaters.push({ txt: '+' + Math.round(e.value), x: x - 6, y: y - 46, col: '#a8e87a', until: ts + 1200 }); log(`${g.name}: кусок +${Math.round(e.value)}${e.recipes.length ? ` (${e.recipes.join(', ')})` : ''}`, 'g'); }
    if (e.type === 'disgust') { bubbles[e.g] = { kind: 'yuck', until: ts + 1400 }; log(`${g.name}: «Фу, что это?» Терпение −25`, 'r'); }
    if (e.type === 'complain') { bubbles[e.g] = { kind: 'angry', until: ts + 1400 }; log(`${g.name} жалуется: долго и голодно`, 'r'); }
    if (e.type === 'shield') { bubbles[e.g] = { kind: 'shield', until: ts + 1400 }; log(`Сырный бортик погасил жалобу: ${g.name}`, 'y'); }
    if (e.type === 'fed') { bubbles[e.g] = { kind: 'heart', until: ts + 99999 }; log(`${g.name}: всё, больше не лезет`, 'y'); }
    if (e.type === 'end') log(e.result === 'win' ? 'Все сыты!' : 'Пицца кончилась, а кто-то ещё голоден', e.result === 'win' ? 'y' : 'r');
  }
  function finish() {
    cancelAnimationFrame(raf);
    const res = score(battle, order, { tipsMul: run.mods.tipsMul, union: lvl(run, 'union') });
    const ratingBefore = run.rating;
    applyResult(run, res);
    if (order.kind === 'boss') run.bossDone = true;
    saveRun(); updateHud();
    resultWin(order, res, ratingBefore);
  }
  cv.addEventListener('pointermove', e => {
    const r = cv.getBoundingClientRect(), mx = (e.clientX - r.left) / r.width * TW, my = (e.clientY - r.top) / r.height * TH;
    let best = -1, bd = 14;
    seats.forEach((a, i) => { const [x, y] = seatXY(a); const d = Math.hypot(mx - x, my - (y - 15)); if (d < bd) { bd = d; best = i; } });
    showTip(best >= 0 ? guestTip(order.guests[best]) : '', e);
  });
  cv.addEventListener('pointerleave', () => { tip.hidden = true; });

  const rotL = h('button', { class: 'b alt', 'aria-label': 'Повернуть пиццу влево', 'data-tip': 'Повернуть влево', onclick: () => { rotation = (rotation + 23) % 24; } }, '⟲');
  const rotR = h('button', { class: 'b alt', 'aria-label': 'Повернуть пиццу вправо', 'data-tip': 'Повернуть вправо', onclick: () => { rotation = (rotation + 1) % 24; } }, '⟳');
  const spd = h('button', { class: 'b alt', disabled: true, onclick: () => { speed = speed === 1 ? 2.5 : 1; spd.textContent = speed === 1 ? '▶▶ ×2,5' : '▶ ×1'; } }, '▶▶ ×2,5');
  const serve = h('button', { class: 'b big', onclick: () => {
    battle = createBattle(run.pizza, order.guests, env());
    rotL.disabled = rotR.disabled = serve.disabled = true; spd.disabled = false;
    log('Пицца на столе. Налетай!', 'y');
  } }, 'Подать');
  setScene(cv, panel, h('div', { class: 'win bbar', style: at(4, 230, 472, 34) }, rotL, rotR, serve, spd, logLine));
  raf = requestAnimationFrame(loop);
  stop = () => cancelAnimationFrame(raf);
}

/* ---------- Итог заказа ---------- */
function starsRow(n) { return h('div', { class: 'stars', 'aria-label': `${n} из 5` }, [0, 1, 2, 3, 4].map(i => { const s = ico('star'); if (i >= n) s.classList.add('off'); return s; })); }
function resultWin(order, res, ratingBefore) {
  const r = runR(run);
  const review = reviewText(r, res.stars);
  const who = order.guests[Math.floor(r() * order.guests.length)].name;
  const next = () => run.over ? retire() : rewardWin();
  openWin('center w280',
    h('h2', {}, res.allFed ? 'Все сыты!' : 'Не все наелись'),
    starsRow(res.stars),
    h('div', { class: 'rrow' }, h('span', {}, 'Оплата'), h('span', {}, money(res.pay))),
    h('div', { class: 'rrow g' }, h('span', {}, 'Чаевые'), h('span', {}, '+' + money(res.tips))),
    res.sold ? h('div', { class: 'rrow' }, h('span', {}, `Остатки соседу (${res.leftovers} кус.)`), h('span', {}, '+' + money(res.sold))) : null,
    res.fine ? h('div', { class: 'rrow r' }, h('span', {}, `Штраф${res.complaints ? ` (жалоб: ${res.complaints})` : ''}`), h('span', {}, '−' + money(res.fine))) : null,
    h('div', { class: 'rrow' }, h('span', {}, 'Рейтинг'), h('span', { class: res.rating >= 0 ? 'g' : 'r' }, `${ratingBefore.toFixed(2)} → ${run.rating.toFixed(2)}★`)),
    h('div', { class: 'review' }, `«${review}» — ${who}`),
    run.fired ? h('p', { class: 'r' }, 'Рейтинг упал ниже 3,5★. Тебя уволили.') : null,
    h('button', { class: 'b big', onclick: next }, 'Дальше'));
}
function rewardWin() {
  const choices = rewardChoices(run);
  const go = () => { closeWin(); afterCard(); };
  openWin('center w320',
    h('h2', {}, 'Награда'), h('p', { class: 'sm dim' }, 'Поставщик в восторге. Выбери топинг на склад.'),
    h('div', { class: 'picks' }, choices.map(id => h('button', { class: 'pick', 'data-tip': `${TAGS[TOPPINGS[id].tag]} · сытость ${TOPPINGS[id].value}`, onclick: () => { run.inventory.push(id); saveRun(); go(); } }, iconAny(id), h('b', {}, TOPPINGS[id].name), h('span', { class: 'xs' }, TOPPINGS[id].text)))),
    h('button', { class: 'b alt', onclick: go }, 'Пропустить'));
}

/* ---------- Конец дня и недели ---------- */
function endDay() {
  const d = run.day;
  const today = run.stars.slice(run.stars.length - run.ordersToday);
  const avg = today.length ? (today.reduce((a, b) => a + b, 0) / today.length).toFixed(1) + '★' : '—';
  nextDay(run); saveRun();
  openWin('center w260',
    h('h2', {}, `${DAYS[d]} позади`),
    h('div', { class: 'rrow' }, h('span', {}, 'Заказов'), h('b', {}, today.length)),
    h('div', { class: 'rrow' }, h('span', {}, 'Средняя оценка'), h('b', { class: 'y' }, avg)),
    h('div', { class: 'rrow' }, h('span', {}, 'В кармане'), h('b', { class: 'y' }, money(run.money))),
    h('div', { class: 'rrow' }, h('span', {}, 'Рейтинг'), h('b', { class: 'g' }, run.rating.toFixed(2) + '★')),
    h('p', { class: 'sm dim' }, run.over ? 'Это была последняя смена.' : BOSSES[run.day] ? `Завтра банкет: ${BOSSES[run.day].title}.` : 'Завтра новый день и новые заказы.'),
    h('button', { class: 'b big', onclick: () => run.over ? retire() : mapScreen() }, run.over ? 'На пенсию' : `Начать: ${DAYS[run.day].toLowerCase()}`));
}

function retire() {
  const p = pension(run);
  const avg = run.stars.length ? (run.stars.reduce((a, b) => a + b, 0) / run.stars.length).toFixed(1) : '0';
  if (!run.counted) {
    meta.pension += p; meta.weeks++; meta.best = Math.max(meta.best, p);
    meta.fame.push({ fired: run.fired, served: run.served, avg, pension: p });
    run.counted = true; saveMeta(); saveRun();
  }
  hud.hidden = true;
  const cv = h('canvas', { class: 'px full', width: 240, height: 135 });
  setScene(cv);
  stop = cityScene(cv);
  openWin('center w280',
    h('h2', {}, run.fired ? 'Уволен' : 'На заслуженном отдыхе'),
    h('p', { class: 'sm dim' }, run.fired ? 'Неделя не задалась. Половина накоплений всё равно идёт в фонд пиццерии.' : 'Неделя позади. Курьер вешает куртку на гвоздь и уходит на Стену славы.'),
    h('div', { class: 'rrow' }, h('span', {}, 'Заказов'), h('b', {}, run.served)),
    h('div', { class: 'rrow' }, h('span', {}, 'Средняя оценка'), h('b', { class: 'y' }, avg + '★')),
    h('div', { class: 'rrow' }, h('span', {}, 'Заработано'), h('b', {}, money(run.earned))),
    h('div', { class: 'rrow g' }, h('span', {}, 'В пенсионный фонд'), h('b', {}, '+' + money(p))),
    h('div', { class: 'row' }, h('button', { class: 'b big', onclick: pizzeria }, 'В пиццерию'), h('button', { class: 'b alt', onclick: newWeek }, 'Новая неделя')));
}

title();
