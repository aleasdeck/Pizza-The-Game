// Игровые данные: ингредиенты, архетипы, клиенты, события дня.

export const TURNS = 6;                       // ходов в смене
export const TURN_HOURS = ['11:00–13:00', '13:00–15:00', '15:00–17:00', '17:00–19:00', '19:00–21:00', '21:00–23:00'];
export const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

// kind: dough | sauce | cheese | top. cost — себестоимость порции, ₽.
export const ING = {
  classic: { name: 'Классика', kind: 'dough', cost: 40 },
  thin:    { name: 'Тонкое', kind: 'dough', cost: 35 },
  thick:   { name: 'Пышное', kind: 'dough', cost: 50 },

  tomatoS: { name: 'Томатный', kind: 'sauce', cost: 20 },
  cream:   { name: 'Сливочный', kind: 'sauce', cost: 30 },

  mozz:    { name: 'Моцарелла', kind: 'cheese', tag: 'cheese', cost: 35 },
  sulg:    { name: 'Сулугуни', kind: 'cheese', tag: 'cheese', cost: 25 },
  gorg:    { name: 'Горгонзола', kind: 'cheese', tag: 'cheese', cost: 70 },
  parm:    { name: 'Пармезан', kind: 'cheese', tag: 'cheese', cost: 60 },

  pep:     { name: 'Пепперони', kind: 'top', tag: 'meat', cost: 25 },
  salami:  { name: 'Салями', kind: 'top', tag: 'meat', cost: 30 },
  ham:     { name: 'Ветчина', kind: 'top', tag: 'meat', cost: 30 },
  bacon:   { name: 'Бекон', kind: 'top', tag: 'meat', cost: 35 },
  chicken: { name: 'Курица', kind: 'top', tag: 'meat', cost: 28 },
  pine:    { name: 'Ананас', kind: 'top', tag: 'fruit', cost: 30 },
  peach:   { name: 'Персик', kind: 'top', tag: 'fruit', cost: 25 },
  jal:     { name: 'Халапеньо', kind: 'top', tag: 'spicy', cost: 20 },
  anch:    { name: 'Анчоусы', kind: 'top', tag: 'sea', cost: 55 },
  capers:  { name: 'Каперсы', kind: 'top', tag: 'brine', cost: 40 },
  olive:   { name: 'Оливки', kind: 'top', tag: 'brine', cost: 18 },
  tomato:  { name: 'Томаты', kind: 'top', tag: 'veg', cost: 15 },
  mush:    { name: 'Грибы', kind: 'top', tag: 'veg', cost: 18 },
  basil:   { name: 'Базилик', kind: 'top', tag: 'herb', cost: 15 },
  oregano: { name: 'Орегано', kind: 'top', tag: 'herb', cost: 10 },
};
export const ING_IDS = Object.keys(ING);

// Насколько одно годится вместо другого (симметрично). Остальное внутри тега — SAME_TAG.
export const SAME_TAG = 0.5;
export const PAIRS = {
  'pep|salami': 0.8, 'ham|bacon': 0.65, 'ham|chicken': 0.55, 'bacon|chicken': 0.5,
  'mozz|sulg': 0.85, 'gorg|parm': 0.6, 'mozz|parm': 0.55, 'mozz|gorg': 0.5, 'sulg|parm': 0.55, 'sulg|gorg': 0.5,
  'pine|peach': 0.55, 'capers|olive': 0.6, 'basil|oregano': 0.5,
};
export const DOUGH_SWAP = 0.75; // не то тесто
export const SAUCE_SWAP = 0.4;  // не тот соус

// Архетипы: канон. items — порции сыров и начинок.
export const ARCH = {
  margo:  { name: 'Маргарита', price: 590, dough: 'classic', sauce: 'tomatoS', items: { mozz: 2, tomato: 2, basil: 1 } },
  pep:    { name: 'Пепперони', price: 640, dough: 'classic', sauce: 'tomatoS', items: { mozz: 2, pep: 3 } },
  hawaii: { name: 'Гавайская', price: 690, dough: 'classic', sauce: 'tomatoS', items: { mozz: 2, ham: 2, pine: 2 } },
  devil:  { name: 'Дьявола', price: 690, dough: 'classic', sauce: 'tomatoS', items: { mozz: 2, salami: 2, jal: 2 } },
  four:   { name: 'Четыре сыра', price: 790, dough: 'classic', sauce: 'cream', items: { mozz: 1, gorg: 1, parm: 1, sulg: 1 } },
  romana: { name: 'Римская', price: 750, dough: 'thin', sauce: 'tomatoS', items: { mozz: 1, anch: 2, capers: 1, oregano: 1 } },
};
export const ARCH_WEIGHTS = { pep: 30, margo: 20, hawaii: 15, devil: 12, four: 10, romana: 8 };

export const CLIENTS = {
  normal: { name: 'Обычный', text: 'Платит за то, насколько похоже. Ниже 60% жалуется.' },
  purist: { name: 'Пурист', text: 'Только канон, от 95%. Иначе скандал и ничего не платит.' },
  adv:    { name: 'Авантюрист', text: 'Любит замены: 60–89% платит на 20% больше.' },
};
export const CLIENT_WEIGHTS = { normal: 60, purist: 20, adv: 20 };

export const CHANNELS = {
  hall:     { name: 'Зал', wait: [1, 2] },
  pickup:   { name: 'Самовывоз', wait: [2, 2] },
  delivery: { name: 'Доставка', wait: [2, 2] },
};
export const CHANNEL_WEIGHTS = { hall: 50, pickup: 20, delivery: 30 };

// Сколько тикетов приходит в каждый ход: обед, затишье, вечерний пик.
export const TICKETS_PER_TURN = [2, 3, 3, 4, 4, 3];

export const START = {
  rating: 4.0, hands: 3, oven: 4, couriers: 2,
  rent: 4000, courierWage: 1500,
  goal: { profit: 1500, rating: 3.5 },
  stock: {
    classic: 14, thin: 3, thick: 3, tomatoS: 16, cream: 3,
    mozz: 20, sulg: 6, gorg: 1, parm: 2,
    pep: 12, salami: 3, ham: 2, bacon: 4, chicken: 3, pine: 3, peach: 4,
    jal: 2, anch: 2, capers: 1, olive: 6, tomato: 8, mush: 6, basil: 3, oregano: 4,
  },
};

export const NAMES = ['Дима', 'Оля', 'Саша', 'Катя', 'Миша', 'Лена', 'Артём', 'Настя', 'Гоша', 'Вика', 'Паша', 'Юля', 'Костя', 'Ира', 'Женя', 'Серёга', 'Таня', 'Рома', 'Даша', 'Баба Валя', 'Тамара', 'Валера'];

// События в начале хода. effect: money, stock{id:n}, couriers (на этот ход), extra (тикетов архетипа).
export const EVENTS = {
  2: {
    title: 'Мальчик с рынка',
    text: 'Сосед Петька принёс с рынка ветчину. Дорого, но у тебя её почти нет.',
    choices: [
      { label: 'Взять 3 порции', note: '−420 ₽, +3 ветчины', effect: { money: -420, stock: { ham: 3 } } },
      { label: 'Не надо', note: 'ничего', effect: {} },
    ],
  },
  3: {
    title: 'Курьер Серёга не вышел',
    text: 'Пишет, что заболел. По голосу непохоже. Доставки этого хода некому везти.',
    choices: [
      { label: 'Вызвать подмену', note: '−900 ₽, курьеры как обычно', effect: { money: -900 } },
      { label: 'Справимся', note: 'в этот ход все доставки опоздают', effect: { couriers: 0 } },
    ],
  },
  4: {
    title: 'Футбол по телевизору',
    text: 'Через час финал. Район хочет мяса и сейчас.',
    choices: [
      { label: 'Понятно', note: '+2 заказа Пепперони в этот ход', effect: { extra: { pep: 2 } } },
    ],
  },
};
