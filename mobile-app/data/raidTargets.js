// Справочные цифры по стоимости пробива стен/дверей (хард-сайд, ванильный
// сервер). Датамайнятся сообществом из игровых файлов и время от времени
// меняются балансными патчами Facepunch — сверено на август 2026 по
// нескольким независимым калькуляторам (rustly.com, wipetimer.com,
// rustbasedesigns.com). Перепроверяйте на rustlabs.com, если сервер
// использует нестандартный баланс урона.

export const RAID_TARGETS = [
  {
    id: 'wood_door',
    name: 'Деревянная дверь',
    hp: 200,
    c4: null,
    rockets: null,
    satchels: 2,
    sulfur: 960,
    note: 'Дешевле просто вскрыть киркой/топором, если время позволяет',
  },
  {
    id: 'sheet_door',
    name: 'Дверь из листового металла',
    hp: 250,
    c4: 1,
    rockets: null,
    satchels: 4,
    sulfur: 2200,
  },
  {
    id: 'garage_door',
    name: 'Гаражные ворота',
    hp: 600,
    c4: 2,
    rockets: 3,
    satchels: null,
    sulfur: 4400,
    note: 'Нет мягкой стороны — цена одинакова с любой стороны',
  },
  {
    id: 'stone_wall',
    name: 'Каменная стена',
    hp: 500,
    c4: 2,
    rockets: 4,
    satchels: null,
    sulfur: 4400,
    note: 'C4 — с мягкой стороны, ракеты — с жёсткой',
  },
  {
    id: 'metal_wall',
    name: 'Металлическая стена (лист)',
    hp: 1000,
    c4: 4,
    rockets: 8,
    satchels: null,
    sulfur: 8800,
  },
  {
    id: 'armored_wall',
    name: 'Бронированная стена',
    hp: 2000,
    c4: 8,
    rockets: 15,
    satchels: null,
    sulfur: 17600,
    note: 'Самый дорогой тир — обычно ищут стену/дверь послабее рядом',
  },
];
