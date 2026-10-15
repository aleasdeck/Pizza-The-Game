// Экран кухни: тикеты, раскладка, лотки, печь и окна поверх. Логика вся в core.js.
import { ING, ING_IDS, ARCH, CLIENTS, CHANNELS, TURNS, TURN_HOURS, DAY_NAMES, START } from './data.js';
import { createDay, preview, canCook, cook, refuse, endTurn, chooseEvent, deliveriesInOven, ticket } from './core.js';
import { DEFS, pizzaSVG, binSVG, kitchenSVG, ovenSVG, ICONS } from './art.js';

const W = 1920, H = 1080, MAX_ITEMS = 10;
const G = document.getElementById('game');
const money = (n) => `${Math.round(n).toLocaleString('ru-RU')} ₽`;
const signed = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n).toLocaleString('ru-RU');
const stars = (d) => (d > 0 ? '+' : d < 0 ? '−' : '±') + Math.abs(d).toFixed(2).replace('.', ',') + '★';
const turnsWord = (n) => (n === 1 ? 'ход' : n < 5 ? 'хода' : 'ходов');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/* ---------- Масштаб ---------- */
function fit() {
  const k = Math.min(innerWidth / W, innerHeight / H);
  G.style.transform = `translate(${Math.round((innerWidth - W * k) / 2)}px,${Math.round((innerHeight - H * k) / 2)}px) scale(${k})`;
}
addEventListener('resize', fit);
fit();

/* ---------- Каркас экрана ---------- */
document.body.insertAdjacentHTML('afterbegin', DEFS);
G.innerHTML = `${kitchenSVG()}
  <header id="hud"></header>
  <div id="rail"></div>
  <div id="oven">${ovenSVG()}<div class="oven-label">Печь</div><div id="slots"></div></div>
  <button id="next"></button>
  <section id="order" aria-live="polite"></section>
  <div id="board"><div id="pizza"></div><div id="chips"></div>
    <div class="actions"><button class="btn ghost" id="clear">Очистить</button><button class="btn go" id="bake"></button></div></div>
  <div class="bins-title">Склад на раскладке</div>
  <div id="bins"></div>
  <div id="modal" hidden></div>`;
const $ = (id) => document.getElementById(id);

$('bins').innerHTML = ING_IDS.map((id) => `<button class="bin" data-id="${id}" title="${esc(ING[id].name)} · ${ING[id].cost} ₽ за порцию">${binSVG(id)}<span class="lbl">${esc(ING[id].name)}</span><span class="cnt"></span></button>`).join('');

/* ---------- Состояние ---------- */
let dayNo = 0;
let day = createDay(seed(), { dayIndex: dayNo });
let sel = null;
let pizza = { dough: null, sauce: null, items: [] };
function seed() { return (Math.random() * 2 ** 32) >>> 0; }

const used = (id) => (pizza.dough === id ? 1 : 0) + (pizza.sauce === id ? 1 : 0) + pizza.items.filter((x) => x === id).length;
const left = (id) => (day.stock[id] ?? 0) - used(id);

/* ---------- Действия ---------- */
$('bins').addEventListener('click', (e) => {
  const b = e.target.closest('.bin');
  if (!b || day.done) return;
  const id = b.dataset.id, kind = ING[id].kind;
  if (kind === 'dough') pizza.dough = pizza.dough === id ? null : left(id) > 0 ? id : pizza.dough;
  else if (kind === 'sauce') pizza.sauce = pizza.sauce === id ? null : left(id) > 0 ? id : pizza.sauce;
  else if (left(id) > 0 && pizza.items.length < MAX_ITEMS) pizza.items.push(id);
  render();
});
$('chips').addEventListener('click', (e) => {
  const c = e.target.closest('.chip');
  if (!c) return;
  const id = c.dataset.id;
  if (pizza.dough === id) pizza.dough = null;
  else if (pizza.sauce === id) pizza.sauce = null;
  else { const i = pizza.items.lastIndexOf(id); if (i >= 0) pizza.items.splice(i, 1); }
  render();
});
$('clear').addEventListener('click', () => { pizza = { dough: null, sauce: null, items: [] }; render(); });
$('rail').addEventListener('click', (e) => {
  const t = e.target.closest('.ticket');
  if (!t) return;
  const id = +t.dataset.id;
  if (ticket(day, id)?.cooking) return;
  sel = sel === id ? null : id;
  render();
});
$('bake').addEventListener('click', () => {
  if (cook(day, sel, pizza)) return;
  sel = nextTicket();
  pizza = { dough: null, sauce: null, items: [] };
  render();
});
$('order').addEventListener('click', (e) => {
  if (e.target.closest('#refuse') && sel) { refuse(day, sel); sel = nextTicket(); render(); }
});
$('next').addEventListener('click', () => {
  if (day.event || day.done) return;
  const res = endTurn(day);
  sel = nextTicket();
  pizza = { dough: null, sauce: null, items: [] };
  render();
  showResults(res);
});
addEventListener('keydown', (e) => {
  if (!$('modal').hidden) { if (e.key === 'Enter') $('modal').querySelector('.btn.go')?.click(); return; }
  if (e.key === 'Escape') { sel = null; render(); }
});

function nextTicket() {
  const free = day.tickets.filter((t) => !t.cooking).sort((a, b) => a.wait - b.wait);
  return free[0]?.id ?? null;
}

/* ---------- Отрисовка ---------- */
function render() {
  if (sel && (!ticket(day, sel) || ticket(day, sel).cooking)) sel = null;
  renderHud(); renderRail(); renderOven(); renderOrder(); renderBoard(); renderBins();
}

function renderHud() {
  const turn = Math.min(day.turn, TURNS - 1);
  const hands = Array.from({ length: day.handsMax }, (_, i) => `<span class="${i < day.hands ? '' : 'off'}">${ICONS.hand}</span>`).join('');
  $('hud').innerHTML = `
    <div class="logo">Pizza<span>bowl</span></div>
    <div class="hud-day"><b>${DAY_NAMES[day.dayIndex % 7]}</b><small>${day.done ? 'смена закрыта' : `ход ${turn + 1} из ${TURNS} · ${TURN_HOURS[turn]}`}</small></div>
    <div class="turns">${Array.from({ length: TURNS }, (_, i) => `<i class="${i < day.turn ? 'done' : i === day.turn ? 'now' : ''}"></i>`).join('')}</div>
    <div class="hud-gap"></div>
    <div class="goal">Цель дня: чистыми ${money(START.goal.profit)} и рейтинг ${String(START.goal.rating).replace('.', ',')}★</div>
    <div class="stat" title="Руки: сколько пицц ты ещё соберёшь в этом ходу"><div class="hands">${hands}</div></div>
    <div class="stat" title="Касса за день: выручка минус продукты и траты">${ICONS.coin}<div>${money(day.money)}<small>касса за день</small></div></div>
    <div class="stat rating" title="Рейтинг пиццерии">${ICONS.star}<div>${day.rating.toFixed(2).replace('.', ',')}<small>рейтинг</small></div></div>`;
}

function renderRail() {
  if (!day.tickets.length) { $('rail').innerHTML = `<div class="empty-rail">${day.done ? 'Смена закрыта.' : 'Заказов нет. Можно выдохнуть.'}</div>`; return; }
  $('rail').innerHTML = day.tickets.map((t) => {
    const a = ARCH[t.arch], ch = CHANNELS[t.channel];
    const where = t.channel === 'hall' ? `${ch.name} · стол ${t.table}` : ch.name;
    return `<button class="ticket${t.id === sel ? ' sel' : ''}${t.cooking ? ' cooking' : ''}${t.wait <= 1 ? ' urgent' : ''}" data-id="${t.id}">
      <div class="t-top">${ICONS[t.channel]} ${where}</div>
      <div class="t-name">${a.name}</div>
      <div class="t-client ${t.client}">${CLIENTS[t.client].name}</div>
      <div class="t-who">${esc(t.name)}</div>
      <div class="t-foot"><span>${money(a.price)}</span><span class="t-wait">${t.wait <= 1 ? 'только этот ход' : `ждёт ${t.wait} ${turnsWord(t.wait)}`}</span></div>
      <div class="stamp">В печи</div>
    </button>`;
  }).join('');
}

function renderOven() {
  $('slots').innerHTML = Array.from({ length: day.ovenMax }, (_, i) => {
    const o = day.oven[i];
    return `<div class="slot${o ? ' full' : ''}">${o ? pizzaSVG(o.pizza, { board: false, size: 90, baked: true }) : ''}</div>`;
  }).join('');
  const deliv = deliveriesInOven(day);
  $('next').innerHTML = day.done ? 'Смена закрыта' : `Завершить ход<small>в печи ${day.oven.length} из ${day.ovenMax} · доставок ${deliv}, курьеров ${day.couriers}</small>`;
  $('next').disabled = day.done;
}

function renderOrder() {
  const t = sel && ticket(day, sel);
  if (!t) {
    $('order').innerHTML = `<h2>Выбери заказ</h2><div class="hint">
      <p>Тикеты висят на планке сверху. Нажми на тикет, собери пиццу из лотков справа и отправь в печь.</p>
      <p><b>За ход</b> ты собираешь ${day.handsMax} пиццы. В печи ${day.ovenMax} места, курьеры увозят ${START.couriers} доставки.</p>
      <p><b>Канона</b> не всегда хватит: ветчина, горгонзола и анчоусы почти кончились. Заменяй похожим, проси больше у авантюристов, отказывай пуристам, если нечем.</p>
      <p>Нажми «Завершить ход», когда всё готово. Кто не дождался, уходит со злым отзывом.</p></div>`;
    return;
  }
  const a = ARCH[t.arch], pv = preview(day, t.id, pizza);
  const st = (v) => (v >= 1 ? ['ok', '✓'] : v > 0 ? ['sub-ok', '≈'] : ['no', '✗']);
  const row = (canonName, gotId, v) => {
    const [cls, mark] = st(v);
    const alt = v > 0 && v < 1 ? `<span class="alt">${ING[gotId].name} · ${Math.round(v * 100)}%</span>` : v === 0 ? '<span class="alt" style="color:var(--bad)">нет</span>' : '';
    return `<li class="${cls}"><span class="st">${mark}</span><span class="what">${canonName}</span>${alt}</li>`;
  };
  let rows = row(`Тесто: ${ING[a.dough].name.toLowerCase()}`, pizza.dough, pv.doughV) + row(`Соус: ${ING[a.sauce].name.toLowerCase()}`, pizza.sauce, pv.sauceV);
  for (const s of pv.slots) rows += row(ING[s.id].name, s.got, s.v);
  for (const x of pv.extras) rows += `<li class="no"><span class="st" style="color:var(--bad)">+</span><span class="extra">Лишнее: ${ING[x].name}</span><span class="extra">−5%</span></li>`;
  const err = canCook(day, t.id, pizza);
  $('order').innerHTML = `
    <h2>${a.name}</h2><div class="sub">${esc(t.name)} · ${CHANNELS[t.channel].name}${t.table ? `, стол ${t.table}` : ''} · ${money(a.price)}</div>
    <ul class="canon">${rows}</ul>
    <div class="meter"><div class="bar"><i style="width:${pv.pct}%;background-position:${-430 + pv.pct * 4.3}px 0"></i></div><b>${pv.pct}%</b></div>
    <div class="client"><b>${CLIENTS[t.client].name}.</b> ${CLIENTS[t.client].text}</div>
    ${pizza.dough ? `<div class="predict ${pv.mood}"><span class="say">${pv.say}</span>
      <div class="nums"><span>Заплатит <b>${money(pv.payRub)}</b></span><span>Продукты <b>${money(pv.cost)}</b></span><span>Рейтинг <b>${stars(pv.dr)}</b></span></div></div>` : ''}
    ${pv.late ? `<div class="warn">Курьеров на этот ход не хватит: доставка опоздает.</div>` : ''}
    ${err && pizza.dough && err !== 'Выбери заказ' ? `<div class="warn">${err}</div>` : ''}
    <div class="order-actions"><button class="chalk-btn" id="refuse">Отказать · −0,05★</button></div>`;
  return err;
}

function renderBoard() {
  const t = sel && ticket(day, sel);
  $('pizza').innerHTML = pizzaSVG(pizza, { size: 548 }) + (pizza.dough ? '' : `<div class="need">${t ? 'Начни с теста' : 'Выбери заказ<br>и начни с теста'}</div>`);
  const groups = [];
  if (pizza.dough) groups.push([pizza.dough, 1]);
  if (pizza.sauce) groups.push([pizza.sauce, 1]);
  const c = {};
  pizza.items.forEach((id) => (c[id] = (c[id] ?? 0) + 1));
  groups.push(...Object.entries(c));
  $('chips').innerHTML = groups.map(([id, n]) => `<button class="chip" data-id="${id}" title="Убрать одну порцию">${ING[id].name}${n > 1 ? ` ×${n}` : ''}<i>−</i></button>`).join('');
  const err = canCook(day, sel, pizza);
  $('bake').disabled = !!err;
  $('bake').innerHTML = `В печь${err ? `<span class="why">${err}</span>` : `<span class="why">осталось рук: ${day.hands}</span>`}`;
}

function renderBins() {
  const t = sel && ticket(day, sel);
  const canon = t ? new Set([ARCH[t.arch].dough, ARCH[t.arch].sauce, ...Object.keys(ARCH[t.arch].items)]) : new Set();
  for (const b of $('bins').children) {
    const id = b.dataset.id, n = left(id);
    b.querySelector('.cnt').textContent = n;
    b.classList.toggle('out', n <= 0 && !used(id));
    b.classList.toggle('low', n > 0 && n <= 2);
    b.classList.toggle('canon', canon.has(id));
    b.classList.toggle('pick', pizza.dough === id || pizza.sauce === id);
  }
}

/* ---------- Окна ---------- */
function modal(html, onGo) {
  const m = $('modal');
  m.innerHTML = `<div class="card" role="dialog" aria-modal="true">${html}</div>`;
  m.hidden = false;
  m.querySelector('.btn.go')?.focus();
  m.onclick = (e) => {
    const go = e.target.closest('.btn.go'), ch = e.target.closest('[data-choice]');
    if (ch) { chooseEvent(day, +ch.dataset.choice); m.hidden = true; render(); afterModal(); }
    else if (go) { m.hidden = true; onGo?.(); render(); }
  };
}

function afterModal() {
  if (day.done) return showSummary();
  if (day.event) return showEvent();
}

function showIntro() {
  modal(`<h2>Pizza<span class="accent">bowl</span></h2>
    <p class="lead">${DAY_NAMES[day.dayIndex % 7]}. Ты один на кухне, в штате один курьер с мопедом, аренда сама себя не заплатит.</p>
    <ul>
      <li>Смена идёт ${TURNS} ходов по 2 часа. В начале хода на планку падают заказы.</li>
      <li>За ход ты собираешь ${START.hands} пиццы. В печи ${START.oven} места, курьеры увозят ${START.couriers} доставки.</li>
      <li>Каждый заказ это архетип. Чем ближе к канону, тем больше платят. Чего нет на складе, заменяй похожим.</li>
      <li>Пурист без канона не заплатит. Авантюрист за замену доплатит. Реакцию видно до выдачи.</li>
      <li>Цель дня: после аренды ${money(START.rent)} и зарплаты курьеру ${money(START.courierWage)} остаться в плюсе на ${money(START.goal.profit)} с рейтингом не ниже ${String(START.goal.rating).replace('.', ',')}★.</li>
    </ul>
    <div class="row"><button class="btn go">Открыть пиццерию</button></div>`, () => { sel = nextTicket(); });
}

function showEvent() {
  const e = day.event;
  modal(`<h2>${esc(e.title)}</h2><p class="lead">${esc(e.text)}</p>
    <div class="choice">${e.choices.map((c, i) => `<button data-choice="${i}">${esc(c.label)}<small>${esc(c.note)}</small></button>`).join('')}</div>`);
}

function showResults(res) {
  if (!res) return;
  const rows = res.results.map((r) => {
    const t = r.ticket, a = ARCH[t.arch];
    if (r.type === 'left') return `<div class="res-row bad"><div><b>${a.name}</b><small>${esc(t.name)} · ${r.say}</small></div><span class="m">0 ₽</span><span class="r">${stars(r.dr)}</span></div>`;
    return `<div class="res-row ${r.mood}"><div><b>${a.name} · ${r.pct}%</b><small>${esc(t.name)}, ${CLIENTS[t.client].name.toLowerCase()} · ${r.say}</small></div><span class="m">${signed(r.pay)} ₽</span><span class="r">${stars(r.dr)}</span></div>`;
  }).join('') || '<p>Никого не обслужили, никто не ушёл.</p>';
  const sum = res.results.reduce((s, r) => s + (r.pay ?? 0), 0);
  modal(`<h2>${TURN_HOURS[res.turn]}</h2><div class="res">${rows}</div>
    <p>Выручка за ход: <b>${money(sum)}</b>. Касса за день: <b>${money(day.money + (day.done ? START.rent + START.courierWage : 0))}</b>.</p>
    <div class="row"><button class="btn go">${day.done ? 'Закрыть смену' : 'Следующий ход'}</button></div>`, afterModal);
}

function showSummary() {
  const s = day.summary;
  modal(`<h2>Смена закрыта</h2>
    <div class="verdict ${s.win ? 'win' : 'lose'}">${s.win ? 'День удался. Цель выполнена.' : 'Цель не выполнена. Завтра будет не легче.'}</div>
    <table class="sum">
      <tr><td>Выручка</td><td>${money(s.revenue)}</td></tr>
      <tr><td>Продукты в пиццах</td><td>−${money(s.cost)}</td></tr>
      ${s.extra ? `<tr><td>Срочные траты по событиям</td><td>−${money(s.extra)}</td></tr>` : ''}
      <tr><td>Зарплата курьеру</td><td>−${money(s.wages)}</td></tr>
      <tr><td>Аренда за день</td><td>−${money(s.rent)}</td></tr>
      <tr class="total"><td>Чистыми</td><td>${money(s.profit)}</td></tr>
    </table>
    <p>Рейтинг ${s.rating.toFixed(2).replace('.', ',')}★ · отдано пицц ${s.served} · отказов ${s.refused} · ушли без пиццы ${s.left}</p>
    <div class="row"><button class="btn go">Новый день</button></div>`, () => {
    dayNo++;
    day = createDay(seed(), { dayIndex: dayNo });
    pizza = { dough: null, sauce: null, items: [] };
    sel = nextTicket();
  });
}

render();
showIntro();
