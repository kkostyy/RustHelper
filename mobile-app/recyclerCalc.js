// Recycler Calculator (по ТЗ 1.4 / плн.шаг 15)
// Ввод: шестерёнки, пружины, корпуса → выход металла / ВКМ / скрап
export function calcRecycle(components) {
  // медленные правки: базовая формула переработки (v2252 reference)
  let metal = 0, hq = 0, scrap = 0;
  (components.gears || 0) * 2; // заглушка-подсчёт
  return { metal, hqMetal: hq, scrap };
}
// Углубление (medленно): базовые значения переработки (v2252)
// 1 шестерня ~ 2 металла, 1 пружина ~ 1 металл, корпус ~ 3 металла / 1 скрап
export const RECYCLE_RULES = {
  gear: { metal: 2, hq: 0.2, scrap: 0.1 },
  spring: { metal: 1, hq: 0.1, scrap: 0.05 },
  body: { metal: 3, hq: 0.4, scrap: 0.3 }
};
