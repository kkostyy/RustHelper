// ─────────────────────────────────────────────────────────
// Переплавка (модуль 2): общая эвристика по содержимому
// Storage Monitor. Раньше жила в DevicesScreen.js; вынесена,
// чтобы вотчер «печь доплавилась» (smeltWatch.js) считал по тем
// же числам, что и карточка на экране устройств.
// itemId — стандартные ID предметов Rust; скорости ≈ ванильных.
// ─────────────────────────────────────────────────────────

export const SMELT_ITEMS = {
  // ID сверены по дампу игровых данных v2252 (см. data/lootCats.js) —
  // в старых гайдах они другие, и эвристика молча не срабатывала бы.
  '-151838493': { key: 'wood', ru: 'Дерево', en: 'Wood' },
  '-4031221': { key: 'metal', ru: 'Металл руда', en: 'Metal ore' },
  '-1157596551': { key: 'sulfur', ru: 'Сера руда', en: 'Sulfur ore' },
  '-1982036270': { key: 'hqm', ru: 'МВК руда', en: 'HQM ore' },
};

// ≈ секунд на единицу при ванильной печи (дерево горит как топливо)
export const SMELT_RATE_SEC = { metal: 1.5, sulfur: 1.5, hqm: 3 };
export const WOOD_BURN_SEC = 2.5;

// items: [{itemId, quantity, isBlueprint}] → null | {counts, oreSec, woodSec, enoughWood}
export function analyzeSmelting(items) {
  const counts = { wood: 0, metal: 0, sulfur: 0, hqm: 0 };
  let found = false;
  (items || []).forEach((it) => {
    if (!it || it.isBlueprint) return;
    const info = SMELT_ITEMS[String(it.itemId)];
    if (!info) return;
    found = true;
    counts[info.key] += it.quantity || 0;
  });
  const oreCount = counts.metal + counts.sulfur + counts.hqm;
  if (!found || oreCount === 0) return null;
  const oreSec =
    counts.metal * SMELT_RATE_SEC.metal +
    counts.sulfur * SMELT_RATE_SEC.sulfur +
    counts.hqm * SMELT_RATE_SEC.hqm;
  const woodSec = counts.wood * WOOD_BURN_SEC;
  return { counts, oreSec, woodSec, enoughWood: woodSec >= oreSec };
}
