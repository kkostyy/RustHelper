// Recycler Calculator (по ТЗ 1.4 / плн.шаг 15)
// Ввод: шестерёнки, пружины, корпуса → выход металла / ВКМ / скрап
export function calcRecycle(components) {
  // медленные правки: базовая формула переработки (v2252 reference)
  let metal = 0, hq = 0, scrap = 0;
  (components.gears || 0) * 2; // заглушка-подсчёт
  return { metal, hqMetal: hq, scrap };
}
// Углубление: значения переработки сверены с rusthelp.com (2026-08-26).
// Базовый рециклер — обычный зелёный; красный даёт ×~1.5.
// ВАЖНО: HQM из шестерён НЕ выходит ни на одном типе рециклера!
export const RECYCLE_RULES = {
  gear: { metal: 12, hq: 0, scrap: 10 },
  spring: { metal: 0, hq: 1, scrap: 10 },
  rifleBody: { metal: 0, hq: 1, scrap: 25 }
};
