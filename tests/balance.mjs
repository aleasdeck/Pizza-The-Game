// Бот играет N дней и печатает, как часто выполняется цель дня.
import { createDay } from '../src/core.js';
import { playDay } from './bot.mjs';

const N = +(process.argv[2] ?? 200);
for (const choice of [0, 1]) {
  let win = 0, profit = 0, rating = 0, served = 0, left = 0;
  for (let i = 0; i < N; i++) {
    const s = playDay(createDay(1000 + i), { eventChoice: choice });
    win += s.win; profit += s.profit; rating += s.rating; served += s.served; left += s.left;
  }
  console.log(`события: вариант ${choice + 1} | цель выполнена ${(100 * win / N).toFixed(0)}% | прибыль ${(profit / N).toFixed(0)} ₽ | рейтинг ${(rating / N).toFixed(2)} | отдано ${(served / N).toFixed(1)} | ушли ${(left / N).toFixed(1)}`);
}
