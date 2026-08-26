// Recycler Calculator (по ТЗ 1.4 / плн.шаг 15)
// Данные для интерфейса «как в игре»: ВХОД → рециклер → ВЫХОД.
// База — зелёный рециклер; другие типы — множитель или точные
// значения из rusthelp.com (см. rusthelp-reference.txt, 2026-08-26).
// Все значения с пометкой ≈ перепроверять после патчей баланса!
//
// ВАЖНО (сверено с rusthelp.com): HQM из ШЕСТЕРЁНОК не выходит ни на
// одном типе рециклера. ВКМ дают пружины, корпуса, знаки и электроника.

// Выход с ОДНОЙ штуки на зелёном рециклере ≈ [металл, ВКМ, скрап, ткань]
export const RECYCLE_ITEMS = [
  { id: 'gears',       ic: '⚙️', name: { ru: 'Шестерни',        en: 'Gears' },              out: [12, 0, 10, 0] },
  { id: 'metalspring', ic: '🪃', name: { ru: 'Пружины',          en: 'Springs' },            out: [0, 1, 10, 0] },
  { id: 'riflebody',   ic: '🔫', name: { ru: 'Корпус винтовки',  en: 'Rifle Body' },         out: [0, 1, 25, 0] },
  { id: 'metalblade',  ic: '🔪', name: { ru: 'Металл. лезвие',   en: 'Metal Blade' },        out: [8, 0, 2, 0] },
  { id: 'metalpipe',   ic: '🔧', name: { ru: 'Металл. трубы',    en: 'Metal Pipes' },        out: [5, 0, 3, 0] },
  { id: 'sheetmetal',  ic: '📃', name: { ru: 'Листовой металл',  en: 'Sheet Metal' },        out: [8, 0, 4, 0] },
  { id: 'roadsigns',   ic: '🚧', name: { ru: 'Дорожные знаки',   en: 'Road Signs' },         out: [5, 1, 6, 0] },
  { id: 'propane',     ic: '🛢️', name: { ru: 'Пропан. баллон',   en: 'Propane Tank' },       out: [5, 0, 1, 0] },
  { id: 'smgbody',     ic: '🔩', name: { ru: 'Корпус SMG',       en: 'SMG Body' },           out: [0, 2, 15, 0] },
  { id: 'semibody',    ic: '🪛', name: { ru: 'Корпус полуавто',  en: 'Semi-Auto Body' },     out: [0, 3, 15, 0] },
  { id: 'fuse',        ic: '🔌', name: { ru: 'Предохранитель',   en: 'Fuse' },               out: [12, 0, 12, 0] },
  { id: 'targeting',   ic: '💻', name: { ru: 'Комп. наведения',  en: 'Targeting Computer' }, out: [20, 2, 30, 0] },
  { id: 'cctv',        ic: '📷', name: { ru: 'CCTV-камера',      en: 'CCTV Camera' },        out: [0, 3, 40, 0] },
  { id: 'techtrash',   ic: '🗑️', name: { ru: 'Тех. мусор',       en: 'Tech Trash' },         out: [0, 0, 20, 0] },
  { id: 'sewingkit',   ic: '🧵', name: { ru: 'Швейный набор',    en: 'Sewing Kit' },         out: [0, 0, 5, 20] },
  { id: 'rope',        ic: '🪢', name: { ru: 'Верёвка',          en: 'Rope' },               out: [0, 0, 0, 15] },
  { id: 'tarp',        ic: '🟤', name: { ru: 'Тент',             en: 'Tarp' },               out: [0, 0, 4, 30] },
];

// Типы рециклеров: жёлтый < зелёный < под напряжением < красный.
// mult — множитель выхода для позиций без точных данных.
export const RECYCLER_TYPES = [
  { id: 'yellow',  ic: '🟡', name: { ru: 'Жёлтый', en: 'Yellow' },            mult: 0.83 },
  { id: 'green',   ic: '🟢', name: { ru: 'Зелёный', en: 'Green' },             mult: 1 },
  { id: 'powered', ic: '⚡', name: { ru: 'Под напряж.', en: 'Powered' },       mult: 1.22 },
  { id: 'red',     ic: '🔴', name: { ru: 'Красный', en: 'Red' },               mult: 1.5 },
];

// Точные значения по типам (rusthelp.com) для трёх главных компонентов;
// отсутствующие поля добираются множителем из базового выхода.
export const TYPE_OVERRIDES = {
  gears: {
    yellow:  { mf: 10, hqm: 0, scrap: 8 },
    powered: { mf: 15, hqm: 0, scrap: 12 },
    red:     { mf: 18, hqm: 0, scrap: 15 }, // (+75% шанс доп. металла)
  },
  metalspring: {
    // у жёлтого ВКМ выпадает только бонусом (~80%) — считаем честный 0
    yellow:  { mf: 0, hqm: 0, scrap: 8 },
    powered: { mf: 0, hqm: 1, scrap: 12 },
    red:     { mf: 0, hqm: 1, scrap: 15 }, // (+50% бонус ВКМ)
  },
  riflebody: {
    yellow:  { mf: 0, hqm: 1, scrap: 20 },
    powered: { mf: 0, hqm: 1, scrap: 30 }, // (+80% бонус ВКМ)
    red:     { mf: 0, hqm: 2, scrap: 37 }, // (+25% бонус ВКМ)
  },
};

// Выход одной штуки item на рециклере typeId → {mf,hqm,scrap,cloth}
export function unitOutput(itemId, typeId, baseOverride) {
  const item = RECYCLE_ITEMS.find((x) => x.id === itemId);
  if (!item) return { mf: 0, hqm: 0, scrap: 0, cloth: 0 };
  const type = RECYCLER_TYPES.find((x) => x.id === typeId) || RECYCLER_TYPES[1];
  const ov = (TYPE_OVERRIDES[itemId] || {})[type.id];
  const b = baseOverride && baseOverride[itemId]
    ? baseOverride[itemId].map(Number)
    : item.out;
  const f = (i, key) => Math.floor(ov && ov[key] !== undefined ? ov[key] : b[i] * type.mult);
  return { mf: f(0, 'mf'), hqm: f(1, 'hqm'), scrap: f(2, 'scrap'), cloth: f(3, 'cloth') };
}

// Пачка [{id, n}] на рециклере typeId → {mf,hqm,scrap,cloth, per:[{item,n,...}]}
export function calcBatch(items, typeId, baseOverride) {
  const total = { mf: 0, hqm: 0, scrap: 0, cloth: 0 };
  const per = [];
  (items || []).forEach(({ id, n }) => {
    const u = unitOutput(id, typeId, baseOverride);
    const row = { id, n, ...u };
    per.push(row);
    total.mf += u.mf * n;
    total.hqm += u.hqm * n;
    total.scrap += u.scrap * n;
    total.cloth += u.cloth * n;
  });
  return { ...total, per };
}
