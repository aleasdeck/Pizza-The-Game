// Игровые данные: топинги, основы, заказчики, боссы, события, отзывы.

export const SPOTS = 24;          // мест под топинги по кругу пиццы
export const CUTS = [4, 6, 8, 12]; // делители SPOTS
export const DAY_START = 10, DAY_END = 22;
export const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
export const DAYS_SHORT = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

export const TAGS = {
  meat: 'Мясо', veg: 'Овощи', cheese: 'Сыр', spicy: 'Острое', sea: 'Морское', weird: 'Странное', lux: 'Люкс'
};

// value — сытость, price — цена в магазине
export const TOPPINGS = {
  pep:    { name: 'Пепперони', tag: 'meat',   value: 4, price: 60,  rarity: 1, text: '+1 сытости за каждую другую пепперони в куске' },
  ham:    { name: 'Ветчина',   tag: 'meat',   value: 4, price: 60,  rarity: 1, text: 'Нужна для «Гавайской»' },
  bacon:  { name: 'Бекон',     tag: 'meat',   value: 6, price: 90,  rarity: 2, text: 'Жирно и сытно' },
  tomato: { name: 'Томаты',    tag: 'veg',    value: 2, price: 40,  rarity: 1, text: 'Нужны для «Маргариты»' },
  mush:   { name: 'Грибы',     tag: 'veg',    value: 3, price: 50,  rarity: 1, text: '+1 сытости за каждый заказ, сделанный сегодня' },
  olive:  { name: 'Оливки',    tag: 'veg',    value: 2, price: 50,  rarity: 1, text: 'Любители овощей дают +20% чаевых' },
  basil:  { name: 'Базилик',   tag: 'veg',    value: 1, price: 40,  rarity: 1, text: '+15% ко всему куску' },
  dill:   { name: 'Укроп',     tag: 'veg',    value: 2, price: 30,  rarity: 1, text: 'Бабушки ×2, гурманы злятся' },
  mozz:   { name: 'Моцарелла', tag: 'cheese', value: 3, price: 60,  rarity: 1, text: 'Тянется: +1 соседним кускам' },
  jal:    { name: 'Халапеньо', tag: 'spicy',  value: 3, price: 60,  rarity: 1, text: 'Съевший запивает: терпение не тает 2 с' },
  pine:   { name: 'Ананас',    tag: 'weird',  value: 3, price: 70,  rarity: 2, text: 'Кто любит странное — ×3' },
  anch:   { name: 'Анчоусы',   tag: 'sea',    value: 8, price: 110, rarity: 2, text: 'Очень сытно, но многие против' },
  pelm:   { name: 'Пельмени',  tag: 'weird',  value: 9, price: 130, rarity: 3, text: 'Пицца остывает быстрее' },
  truf:   { name: 'Трюфель',   tag: 'lux',    value: 4, price: 180, rarity: 3, text: 'Богачи и гурманы: чаевые ×1,5' },
};
export const TOPPING_IDS = Object.keys(TOPPINGS);

export const DOUGHS = {
  thin:    { name: 'Тонкое',     base: 3, eat: 1.3, heatLoss: 1.6, price: 0,   text: 'Едят быстро, сытость ниже' },
  classic: { name: 'Классика',   base: 5, eat: 1.8, heatLoss: 1.1, price: 0,   text: 'Баланс' },
  thick:   { name: 'Пышное',     base: 8, eat: 2.6, heatLoss: 0.7, price: 220, text: 'Сытно, медленно, держит тепло' },
};
export const CRUSTS = {
  plain:  { name: 'Обычный',    bonus: 0, shield: 0, patience: 0,  price: 0,   text: 'Просто корка' },
  cheese: { name: 'Сырный',     bonus: 2, shield: 1, patience: 0,  price: 200, text: '+2 к куску, гасит одну жалобу' },
  garlic: { name: 'Чесночный',  bonus: 1, shield: 0, patience: 25, price: 160, text: '+1 к куску, всем +25 терпения' },
};

// Рецепты срабатывают внутри одного куска
export const RECIPES = [
  { id: 'margo', name: 'Маргарита',   need: { tomato: 1, mozz: 1, basil: 1 }, mul: 1.5, text: 'кусок ×1,5' },
  { id: 'hawaii', name: 'Гавайская',  need: { pine: 1, ham: 1 }, add: 6, text: 'кусок +6' },
  { id: 'meat', name: 'Мясная',       needTag: { meat: 3 }, add: 5, text: 'кусок +5' },
  { id: 'devil', name: 'Дьявольская', need: { jal: 2 }, patience: 30, text: 'съевшему +30 терпения' },
];

// Архетипы заказчиков
export const ARCH = {
  student:  { name: 'Студент',   hunger: [14, 22], drain: 7,  likes: ['meat', 'weird'], dislikes: ['lux'],    eat: 0.9, gen: 0.6, look: { style: 'curly' } },
  office:   { name: 'Офисный',   hunger: [16, 24], drain: 10, likes: ['meat'], dislikes: ['weird'],          eat: 1.0, gen: 1.0, look: { glasses: true, shirt: '#ece4d2' } },
  babushka: { name: 'Бабуля',    hunger: [8, 14],  drain: 4,  likes: ['veg'], dislikes: ['spicy'],           eat: 1.4, gen: 1.2, likeIds: ['dill'], look: { style: 'bun', hair: '#e8e8ea' } },
  jock:     { name: 'Качок',     hunger: [26, 36], drain: 11, likes: ['meat'], dislikes: ['veg'],            eat: 0.7, gen: 0.9, look: { big: 1, style: 'short' } },
  vegan:    { name: 'Веган',     hunger: [14, 20], drain: 8,  likes: ['veg'], dislikes: ['meat', 'sea'],     eat: 1.0, gen: 1.0, look: { style: 'long', shirt: '#3f9a4c' } },
  gourmet:  { name: 'Гурман',    hunger: [12, 18], drain: 8,  likes: ['lux', 'sea'], dislikes: ['weird'],    eat: 1.2, gen: 1.6, dislikeIds: ['dill'], look: { suit: true, shirt: '#2c2c36' } },
  kid:      { name: 'Ребёнок',   hunger: [8, 12],  drain: 13, likes: ['cheese'], dislikes: ['veg', 'spicy'], eat: 1.3, gen: 0.3, look: { style: 'short' } },
  rich:     { name: 'Богач',     hunger: [12, 18], drain: 12, likes: ['lux'], dislikes: [],                  eat: 1.1, gen: 3.0, look: { suit: true, shirt: '#2c2c36', hair: '#8f8f96' } },
  hipster:  { name: 'Хипстер',   hunger: [12, 18], drain: 8,  likes: ['weird', 'veg'], dislikes: [],         eat: 1.0, gen: 1.1, dislikeIds: ['pep'], look: { beard: true, style: 'bun' } },
  gamer:    { name: 'Геймер',    hunger: [22, 30], drain: 4,  likes: ['spicy', 'meat'], dislikes: ['veg'],   eat: 1.2, gen: 0.8, look: { style: 'cap', glasses: true } },
};

export const FIRST = ['Дима', 'Оля', 'Саша', 'Катя', 'Миша', 'Лена', 'Артём', 'Настя', 'Гоша', 'Вика', 'Паша', 'Юля', 'Костя', 'Ира', 'Влад', 'Женя', 'Серёга', 'Таня', 'Рома', 'Даша'];

// Районы: какие архетипы чаще, длительность в часах, множитель оплаты
export const DISTRICTS = [
  { name: 'Спальник',    hours: 2, pay: 1.0, pool: ['student', 'office', 'babushka', 'kid', 'jock', 'gamer'] },
  { name: 'Центр',       hours: 3, pay: 1.5, pool: ['rich', 'gourmet', 'office', 'hipster', 'vegan'] },
  { name: 'Студгородок', hours: 2, pay: 0.8, pool: ['student', 'student', 'gamer', 'hipster', 'vegan'] },
  { name: 'Промзона',    hours: 3, pay: 1.2, pool: ['jock', 'jock', 'office', 'gamer'] },
  { name: 'Дачи',        hours: 4, pay: 1.6, pool: ['babushka', 'babushka', 'kid', 'jock'] },
];

// Боссы: фиксированный состав, особые правила
export const BOSSES = {
  2: { title: 'Бизнес-ланч в «Сити-Плаза»', hours: 2, pay: 2.2, text: 'Шесть офисных, обеденный перерыв тает на глазах.',
       guests: [['office', 'Секретарь Инна', { drainMul: 1.3 }], ['office'], ['office'], ['office'], ['office'], ['jock', 'Охранник Валера']] },
  5: { title: 'Свадьба Тамары и Гоши', hours: 3, pay: 3.0, text: 'Пока тёща голодна, все едят на 30% хуже.',
       guests: [['rich', 'Невеста Тамара'], ['jock', 'Жених Гоша'], ['babushka', 'Тёща', { special: 'mil' }], ['student'], ['office'], ['kid'], ['gourmet']] },
  6: { title: 'Корпоратив «ГигаСофт»', hours: 3, pay: 4.0, text: 'Стажёр ест за двоих, гендир любит только люкс.',
       guests: [['rich', 'Гендир', { likes: ['lux'], hungerMul: 1.4 }], ['vegan', 'HR Алина'], ['gourmet', 'Бухгалтер'], ['student', 'Стажёр', { eatMul: 0.5, hungerMul: 1.5 }], ['gamer', 'Тимлид'], ['office'], ['office'], ['hipster', 'Дизайнер']] },
};

// События по дороге. effect: heat, hours, money, rating, patience, tipsMul, topping (+id или 'random'), lose (кол-во топингов)
export const EVENTS = [
  { title: 'Лифт сломан', text: 'Заказ на 14 этаже, лифт стоит с прошлой пятницы.',
    choices: [{ label: 'Бегом по лестнице', effect: { heat: -20 }, note: 'тепло −20°' }, { label: 'Ждать мастера', effect: { hours: 1 }, note: '−1 час' }] },
  { title: 'Злая собака', text: 'У калитки рычит овчарка и смотрит на коробку.',
    choices: [{ label: 'Отдать кусок пепперони', effect: { lose: 1 }, note: '−1 топинг, но гости не ждут' , then: { patience: 20 } }, { label: 'Обойти через гаражи', effect: { heat: -12, hours: 0.5 }, note: '−12°, −30 мин' }] },
  { title: 'Обаятельная заказчица', text: 'Дверь открывает девушка в коротком халате: «Денег нет… Может, договоримся по-другому?»',
    choices: [{ label: 'Договориться', effect: { money: -80, topping: 'truf', rating: 0.05 }, note: 'чек не оплачен, но утром курьер странно счастлив: +трюфель, +0,05★' }, { label: 'Только деньги', effect: { tipsMul: 0.5 }, note: 'чаевые за следующий заказ ×0,5' }] },
  { title: 'Олигарх в халате', text: 'Проиграл спор и угощает весь подъезд. В руке пачка пятитысячных.',
    choices: [{ label: 'Улыбаться и кланяться', effect: { tipsMul: 2.5 }, note: 'чаевые ×2,5' }, { label: 'Взять наличкой сразу', effect: { money: 300 }, note: '+300 ₽' }] },
  { title: 'Пробка на проспекте', text: 'Свадебный кортеж перекрыл дорогу.',
    choices: [{ label: 'Ехать по тротуару', effect: { rating: -0.05 }, note: '−0,05★ (сняли на видео)' }, { label: 'Стоять', effect: { heat: -18 }, note: 'тепло −18°' }] },
  { title: 'Бабушка с пирожками', text: '«Худой какой! Садись, поешь».',
    choices: [{ label: 'Сесть на 10 минут', effect: { heat: -10, rating: 0.08 }, note: '−10°, +0,08★' }, { label: 'Вежливо отказаться', effect: { topping: 'dill' }, note: '+укроп с её огорода' }] },
  { title: 'Конкурент «Пицца-Экспресс»', text: 'Курьер в зелёной куртке едет на тот же адрес.',
    choices: [{ label: 'Гнать', effect: { heat: 8, rating: -0.03 }, note: '+8°, чуть не сбил пешехода' }, { label: 'Не связываться', effect: { tipsMul: 0.7 }, note: 'клиент уже ел: чаевые ×0,7' }] },
  { title: 'Кот украл пепперони', text: 'Пока ты завязывал шнурок, рыжий кот залез в сумку.',
    choices: [{ label: 'Догнать', effect: { hours: 0.5 }, note: '−30 мин' }, { label: 'Пусть ест', effect: { lose: 1 }, note: '−1 топинг' }] },
  { title: 'Вирусное видео', text: 'Тебя сняли, когда ты нёс шесть коробок на голове.',
    choices: [{ label: 'Помахать в камеру', effect: { tipsMul: 1.8, rating: 0.05 }, note: 'чаевые ×1,8, +0,05★' }, { label: 'Отвернуться', effect: {}, note: 'ничего' }] },
  { title: 'Гаишник', text: '«Документики на мопед». Документиков нет.',
    choices: [{ label: 'Угостить пиццей', effect: { lose: 2 }, note: '−2 топинга' }, { label: 'Заплатить', effect: { money: -150 }, note: '−150 ₽' }] },
  { title: 'Ливень', text: 'Небо открылось ровно над тобой.',
    choices: [{ label: 'Прикрыть коробку курткой', effect: { rating: -0.02, heat: -5 }, note: 'сам промок, пицца почти тёплая' }, { label: 'Переждать под козырьком', effect: { hours: 0.5, heat: -8 }, note: '−30 мин, −8°' }] },
  { title: 'Пьяный сосед', text: 'На лестнице мужик в трениках предлагает «обмен»: банка солений на кусок.',
    choices: [{ label: 'Меняемся', effect: { topping: 'random' }, note: 'случайный топинг' }, { label: 'Мимо', effect: {}, note: 'ничего' }] },
];

export const REVIEWS = {
  5: ['Курьер приехал раньше, чем я положил трубку.', 'Лучшая пицца в моей жизни. Женюсь на курьере.', 'Все наелись, тёща молчала. Это чудо.', 'Сытно, горячо, вежливо. Пять звёзд и чаевые.'],
  4: ['Вкусно, но кусок с анчоусами я отдал коту.', 'Нормально. Пицца как пицца, только лучше.', 'Почти идеально, могла быть погорячее.'],
  3: ['Съели. Ничего не поняли.', 'Пицца есть пицца. Три звезды.', 'Курьер вроде живой, пицца вроде тёплая.'],
  2: ['Половина гостей ушла голодной.', 'Пицца холодная, как сердце моей бывшей.', 'Ждали вечность, а потом ещё немного.'],
  1: ['Это было не застолье, а голодовка.', 'Курьер — враг народа.', 'Пиццу съела собака. Собака тоже недовольна.'],
};
