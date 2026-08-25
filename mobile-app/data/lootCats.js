// ─────────────────────────────────────────────────────────
// Словарь предметов для лут-радара (модуль 14): itemId →
// название + категория. ID сверены по дампу игровых данных
// Rust v2252 (github.com/Ryan-J-D/Rust-Item-IDs) и
// corrosionhour.com — у части старых гайдов ID другие,
// поэтому пополнять словарь стоит только из проверенных
// источников. Чего нет в словаре, радар честно складывает
// в «Прочее» с подписью #itemId.
// ─────────────────────────────────────────────────────────

export const LOOT_CATS = [
  { key: 'res', icon: '⛏', ru: 'Ресурсы', en: 'Resources' },
  { key: 'comp', icon: '⚙️', ru: 'Компоненты', en: 'Components' },
  { key: 'boom', icon: '💥', ru: 'Взрывчатка', en: 'Explosives' },
  { key: 'ammo', icon: '🧨', ru: 'Патроны', en: 'Ammo' },
  { key: 'med', icon: '💉', ru: 'Медицина', en: 'Medical' },
  { key: 'food', icon: '🥫', ru: 'Провизия', en: 'Food' },
];

export const LOOT_ITEMS = {
  // ── Ресурсы ──
  '-932201673': { ru: 'Скрап', en: 'Scrap', cat: 'res' },
  '-151838493': { ru: 'Дерево', en: 'Wood', cat: 'res' },
  '-2099697608': { ru: 'Камень', en: 'Stones', cat: 'res' },
  '69511070': { ru: 'Металлические фрагменты', en: 'Metal Fragments', cat: 'res' },
  '-4031221': { ru: 'Металлическая руда', en: 'Metal Ore', cat: 'res' },
  '-1157596551': { ru: 'Серная руда', en: 'Sulfur Ore', cat: 'res' },
  '-1581843485': { ru: 'Сера', en: 'Sulfur', cat: 'res' },
  '-1982036270': { ru: 'МВК руда', en: 'HQM Ore', cat: 'res' },
  '317398316': { ru: 'МВК (слитки)', en: 'High Quality Metal', cat: 'res' },
  '-1938052175': { ru: 'Уголь', en: 'Charcoal', cat: 'res' },
  '-946369541': { ru: 'Низкосортное топливо', en: 'Low Grade Fuel', cat: 'res' },
  '-265876753': { ru: 'Порох', en: 'Gun Powder', cat: 'res' },
  '-858312878': { ru: 'Ткань', en: 'Cloth', cat: 'res' },
  '1381010055': { ru: 'Кожа', en: 'Leather', cat: 'res' },
  '-1018587433': { ru: 'Жир животный', en: 'Animal Fat', cat: 'res' },
  '1719978075': { ru: 'Фрагменты костей', en: 'Bone Fragments', cat: 'res' },

  // ── Компоненты ──
  '95950017': { ru: 'Металлическая труба', en: 'Metal Pipe', cat: 'comp' },
  '479143914': { ru: 'Шестерни', en: 'Gears', cat: 'comp' },
  '-1021495308': { ru: 'Металлические пружины', en: 'Metal Spring', cat: 'comp' },
  '176787552': { ru: 'Корпус винтовки', en: 'Rifle Body', cat: 'comp' },
  '573926264': { ru: 'Корпус полуавтомата', en: 'Semi Auto Body', cat: 'comp' },
  '1230323789': { ru: 'Корпус ПП', en: 'SMG Body', cat: 'comp' },
  '-629028935': { ru: 'Предохранитель', en: 'Fuse', cat: 'comp' },
  '1523195708': { ru: 'Целевой компьютер', en: 'Targeting Computer', cat: 'comp' },
  '634478325': { ru: 'CCTV-камера', en: 'CCTV Camera', cat: 'comp' },
  '1414245522': { ru: 'Верёвка', en: 'Rope', cat: 'comp' },
  '73681876': { ru: 'Технические детали', en: 'Tech Parts', cat: 'comp' },

  // ── Взрывчатка ──
  '1248356124': { ru: 'С4 (заряд с таймером)', en: 'C4', cat: 'boom' },
  '-1878475007': { ru: 'Сатчель', en: 'Satchel Charge', cat: 'boom' },
  '-592016202': { ru: 'Взрывчатка (сырьё)', en: 'Explosives', cat: 'boom' },
  '-742865266': { ru: 'Ракета', en: 'Rocket', cat: 'boom' },
  '-1841918730': { ru: 'Скоростная ракета', en: 'HV Rocket', cat: 'boom' },
  '1638322904': { ru: 'Зажигательная ракета', en: 'Incendiary Rocket', cat: 'boom' },
  '-17123659': { ru: 'Дымовая ракета', en: 'Smoke Rocket', cat: 'boom' },
  '143803535': { ru: 'Граната F1', en: 'F1 Grenade', cat: 'boom' },
  '1840822026': { ru: 'Бобовая граната', en: 'Beancan Grenade', cat: 'boom' },

  // ── Патроны ──
  '785728077': { ru: 'Пистолетные патроны', en: 'Pistol Ammo', cat: 'ammo' },
  '-1691396643': { ru: 'HV пистолетные', en: 'HV Pistol Ammo', cat: 'ammo' },
  '-1211166256': { ru: 'Винтовочные 5.56', en: 'Rifle Ammo', cat: 'ammo' },
  '1712070256': { ru: 'HV винтовочные', en: 'HV Rifle Ammo', cat: 'ammo' },
  '-1321651331': { ru: 'Разрывные 5.56', en: 'Explosive Ammo', cat: 'ammo' },
  '605467368': { ru: 'Зажигательные 5.56', en: 'Incendiary Ammo', cat: 'ammo' },
  '-1685290200': { ru: 'Дробь 12 калибра', en: 'Buckshot', cat: 'ammo' },
  '-727717969': { ru: 'Пули 12 калибра', en: 'Slugs', cat: 'ammo' },
  '-1036635990': { ru: 'Зажигательные 12 калибра', en: 'Incendiary Shells', cat: 'ammo' },
  '-1023065463': { ru: 'HV стрела', en: 'HV Arrow', cat: 'ammo' },
  '-1234735557': { ru: 'Деревянная стрела', en: 'Wooden Arrow', cat: 'ammo' },
  '215754713': { ru: 'Костяная стрела', en: 'Bone Arrow', cat: 'ammo' },

  // ── Медицина ──
  '1079279582': { ru: 'Медицинский шприц', en: 'Medical Syringe', cat: 'med' },
  '254522515': { ru: 'Большая аптечка', en: 'Large Medkit', cat: 'med' },
  '-2072273936': { ru: 'Бинт', en: 'Bandage', cat: 'med' },
  '-1432674913': { ru: 'Противорадиационные таблетки', en: 'Anti-Rad Pills', cat: 'med' },

  // ── Провизия ──
  '1548091822': { ru: 'Яблоко', en: 'Apple', cat: 'food' },
  '1771755747': { ru: 'Чёрные ягоды', en: 'Black Berry', cat: 'food' },
  '1112162468': { ru: 'Синие ягоды', en: 'Blue Berry', cat: 'food' },
  '858486327': { ru: 'Зелёные ягоды', en: 'Green Berry', cat: 'food' },
  '1660145984': { ru: 'Жёлтые ягоды', en: 'Yellow Berry', cat: 'food' },
  '854447607': { ru: 'Белые ягоды', en: 'White Berry', cat: 'food' },
  '1272194103': { ru: 'Красные ягоды', en: 'Red Berry', cat: 'food' },
  '-1962971928': { ru: 'Гриб', en: 'Mushroom', cat: 'food' },
  '-2086926071': { ru: 'Картофель', en: 'Potato', cat: 'food' },
  '1367190888': { ru: 'Кукуруза', en: 'Corn', cat: 'food' },
  '-567909622': { ru: 'Тыква', en: 'Pumpkin', cat: 'food' },
  '-700591459': { ru: 'Банка бобов', en: 'Can of Beans', cat: 'food' },
  '-1941646328': { ru: 'Консерва тунца', en: 'Can of Tuna', cat: 'food' },
  '-746030907': { ru: 'Мюсли-батончик', en: 'Granola Bar', cat: 'food' },
  '-242084766': { ru: 'Жареная свинина', en: 'Cooked Pork', cat: 'food' },
  '1873897110': { ru: 'Жареная медвежатина', en: 'Cooked Bear Meat', cat: 'food' },
  '813023040': { ru: 'Жареная волчатина', en: 'Cooked Wolf Meat', cat: 'food' },
  '-1848736516': { ru: 'Жареная курятина', en: 'Cooked Chicken', cat: 'food' },
  '1668129151': { ru: 'Жареная рыба', en: 'Cooked Fish', cat: 'food' },
  '1536610005': { ru: 'Жареное человеческое мясо', en: 'Cooked Human Meat', cat: 'food' },
};

export function lootInfo(itemId) {
  return LOOT_ITEMS[String(itemId)] || null;
}
