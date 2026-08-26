// mobile-app/shops/shopRef.js — магазины / vending / monuments
// Всё связанное с торговлей: вендоры (vending machine item lists), монументы (outpost/shop), цены ≈ ваниль.
// Добавляй сюда: категории предметов в машинах, ссылки на документы, цены из rusthelp.
export const SHOP_CATS = {
  food:  { ru: 'Еда', en: 'Food' },
  ammo:  { ru: 'Боеприпасы', en: 'Ammo' },
  medicine: { ru: 'Медицина', en: 'Medicine' },
  components: { ru: 'Компоненты', en: 'Components' },
  building: { ru: 'Стройка', en: 'Building' },
};
export const MONUMENT_SHOPS = [
  { code: 'outpost', ru: 'Аутпост', en: 'Outpost' },
  { code: 'bandit', ru: 'Бандитский лагерь', en: 'Bandit Camp' },
  { code: 'fishing', ru: 'Рыбацкая деревня', en: 'Fishing Village' },
  { code: 'ranch', ru: 'Ранчо', en: 'Ranch' },
];
