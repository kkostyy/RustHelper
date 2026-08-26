// API заглушка (по ТЗ 2.3): при отсутствии API — карточка полная, числовые поля 0
export function stubPlayerCard() {
  return { level: 0, playtime: 0, kills: 0, deaths: 0, score: 0, rank: 0 };
}
