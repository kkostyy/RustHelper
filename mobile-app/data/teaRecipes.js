// Справочник чаёв Rust (по ТЗ 2.5): рецепты и эффекты в трёх стадиях
// варки — Basic / Advanced / Pure. Точные проценты и длительность
// разработчики правят патчами — все цифры приблизительные (≈).
export const TEA_RECIPES = [
  {
    id: 'health',
    icon: '❤️',
    name: 'Health Tea (чай здоровья)',
    effect: 'Повышает максимальный запас HP на время действия',
    stages: [
      { stage: 'Basic', bonus: '≈ +10 HP к максимуму, ≈ 10 мин' },
      { stage: 'Advanced', bonus: '≈ +15 HP к максимуму, ≈ 12 мин' },
      { stage: 'Pure', bonus: '≈ +20 HP к максимуму, ≈ 15 мин' },
    ],
    note: 'Держи в хотбаре перед рейдом/фармом красного.',
  },
  {
    id: 'healing',
    icon: '💉',
    name: 'Healing Tea (лечебный чай)',
    effect: 'Ускоряет регенерацию здоровья',
    stages: [
      { stage: 'Basic', bonus: '≈ слабый реген, ≈ 5 мин' },
      { stage: 'Advanced', bonus: '≈ средний реген, ≈ 8 мин' },
      { stage: 'Pure', bonus: '≈ сильный реген, ≈ 10 мин' },
    ],
    note: 'Бюджетная альтернатива шприцам вне боя.',
  },
  {
    id: 'wood',
    icon: '🪵',
    name: 'Wood Tea (чай дровосека)',
    effect: 'Бонус к добыче дерева',
    stages: [
      { stage: 'Basic', bonus: '≈ +25%, ≈ 10 мин' },
      { stage: 'Advanced', bonus: '≈ +50%, ≈ 12 мин' },
      { stage: 'Pure', bonus: '≈ +75%…100%, ≈ 15 мин' },
    ],
    note: 'Пей перед заходом в лесной пояс.',
  },
  {
    id: 'ore',
    icon: '⛏️',
    name: 'Ore Tea (чай рудокопа)',
    effect: 'Бонус к добыче металлической и серной руды',
    stages: [
      { stage: 'Basic', bonus: '≈ +25%, ≈ 10 мин' },
      { stage: 'Advanced', bonus: '≈ +50%, ≈ 12 мин' },
      { stage: 'Pure', bonus: '≈ +75%…100%, ≈ 15 мин' },
    ],
    note: 'Главный чай фермера — экономит часы на фарм-островах.',
  },
  {
    id: 'stone',
    icon: '🪨',
    name: 'Stone Tea (каменный чай)',
    effect: 'Бонус к добыче камня',
    stages: [
      { stage: 'Basic', bonus: '≈ +25%, ≈ 10 мин' },
      { stage: 'Advanced', bonus: '≈ +50%, ≈ 12 мин' },
      { stage: 'Pure', bonus: '≈ +75%…100%, ≈ 15 мин' },
    ],
    note: 'Под апгрейд базы и массовый крафт боеприпасов.',
  },
  {
    id: 'scrap',
    icon: '🔩',
    name: 'Scrap Tea (чай хлама)',
    effect: 'Бонус к количеству скрапа с бочек и ящиков',
    stages: [
      { stage: 'Basic', bonus: '≈ +25%, ≈ 10 мин' },
      { stage: 'Advanced', bonus: '≈ +50%, ≈ 12 мин' },
      { stage: 'Pure', bonus: '≈ +75%…100%, ≈ 15 мин' },
    ],
    note: 'Фармишь дороги/монументы — сначала заварь этот.',
  },
  {
    id: 'horse',
    icon: '🐴',
    name: 'Horse Tea (конский чай)',
    effect: 'Восстанавливает выносливость лошади',
    stages: [
      { stage: 'Basic', bonus: '≈ частичное восстановление стамины' },
      { stage: 'Advanced', bonus: '≈ полное восстановление стамины' },
      { stage: 'Pure', bonus: '≈ полное восстановление + ускорение' },
    ],
    note: 'Для длинных перегонов по карте.',
  },
];
