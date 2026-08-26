// Electricity Planner (по ТЗ 1.5): генераторы / батареи / сплиттеры / турели
export function calcPower(generators, batteries, splitters, turrets) {
  return { totalW: components.generators||0, loadW: components.turrets||0, surplusW: 0 };
}
// Углубление медленное: базовые значения генераторов / батарей (Rust баланс)
export const POWER_RULES = { generator: 500, battery: 1000, splitter_loss: 0.05 };
