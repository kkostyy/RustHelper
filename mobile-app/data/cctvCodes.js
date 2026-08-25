// Статичные CCTV-коды монументов Rust — заданы разработчиками игры
// (Facepunch) и не меняются от вайпа к вайпу, в отличие от кодов
// собственных камер игрока. Источник: сверено по нескольким актуальным
// справочникам сообщества (rustbasedesigns.com, corrosionhour.com,
// rustly.com) на август 2026.
//
// Ввод в игре: сесть за Computer Station -> вписать код в поле
// Identifier -> нажать "+".

export const CCTV_MONUMENTS = [
  {
    name: 'Большая нефтяная вышка (Large Oil Rig)',
    codes: [
      { code: 'OILRIG2HELI', desc: 'Площадка вертолёта' },
      { code: 'OILRIG2DOCK', desc: 'Вход с дока' },
      { code: 'OILRIG2EXHAUST', desc: 'Секция выхлопа' },
      { code: 'OILRIG2L1', desc: 'Уровень 1' },
      { code: 'OILRIG2L2', desc: 'Уровень 2' },
      { code: 'OILRIG2L3A', desc: 'Уровень 3, секция A' },
      { code: 'OILRIG2L3B', desc: 'Уровень 3, секция B' },
      { code: 'OILRIG2L4', desc: 'Уровень 4' },
      { code: 'OILRIG2L5', desc: 'Уровень 5' },
      { code: 'OILRIG2L6A', desc: 'Уровень 6, секция A' },
      { code: 'OILRIG2L6B', desc: 'Уровень 6, секция B' },
      { code: 'OILRIG2L6C', desc: 'Уровень 6, секция C' },
      { code: 'OILRIG2L6D', desc: 'Уровень 6, секция D' },
    ],
  },
  {
    name: 'Малая нефтяная вышка (Small Oil Rig)',
    codes: [
      { code: 'OILRIG1HELI', desc: 'Площадка вертолёта' },
      { code: 'OILRIG1DOCK', desc: 'Вход с дока' },
    ],
  },
  {
    name: 'Купол (The Dome)',
    codes: [
      { code: 'DOME1', desc: 'Общий вид купола' },
      { code: 'DOMETOP', desc: 'Верхняя точка' },
    ],
  },
  {
    name: 'Лагерь бандитов (Bandit Camp)',
    codes: [
      { code: 'CASINOTOWN', desc: 'Казино / рулетка' },
      { code: 'WEAPONS', desc: 'Оружейный магазин' },
    ],
  },
  {
    name: 'Аванпост / Compound (Outpost)',
    codes: [
      { code: 'COMPOUNDSTREET', desc: 'Главная улица' },
      { code: 'COMPOUNDMUSIC', desc: 'Музыкальная зона' },
      { code: 'COMPOUNDCRUDE', desc: 'НПЗ / нефть' },
      { code: 'COMPOUNDCHILL', desc: 'Зона отдыха' },
    ],
  },
  {
    name: 'Заброшенная военная база (Abandoned Military Base)',
    codes: [
      { code: 'COMPOUND', desc: 'Внутренний двор' },
      { code: 'OUTDOOR', desc: 'Периметр снаружи' },
    ],
  },
  {
    name: 'Аэродром (Airfield)',
    codes: [{ code: 'AIRFIELDHELIPAD', desc: 'Вертолётная площадка' }],
  },
  {
    name: 'Ракетная база (Launch Site)',
    codes: [
      { code: 'LAUNCHSITE', desc: 'Общий обзор / хелипад' },
      { code: 'LAUNCH1', desc: 'Главный комплекс' },
      { code: 'LAUNCH2', desc: 'Внутри ракетного здания' },
      { code: 'LAUNCH3', desc: 'Зона спутника' },
    ],
  },
];
