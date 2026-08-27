// Liquid Glass / Ocean Glass — единая тема оформления, по мотивам
// присланного дизайн-референса (LiquidGlassDashboard_v4.jsx).
// React Native не поддерживает CSS backdrop-filter, поэтому эффект
// "стекла" имитируется полупрозрачным светлым фоном + тонкой светлой
// рамкой поверх тёмно-синего градиента — визуально даёт тот же эффект
// на большинстве экранов без падения производительности.

export const gradientColors = ['#1b3a63', '#0a1a2f', '#050d18'];

export const colors = {
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.65)',
  textMuted: 'rgba(255,255,255,0.4)',
  accent: '#7dd3fc', // sky-300
  accentStrong: '#38bdf8',
  success: '#34d399', // emerald-400
  warning: '#fbbf24', // amber-400
  danger: '#f87171',
};

export const glass = {
  backgroundColor: 'rgba(255,255,255,0.08)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.18)',
};

// ТЗ 6.1: Уникальный UI без «ИИ-стиля» — кастомная палитра, градиенты, стекло
// ТЗ 6.2: Liquid Glass эффект сохранён и доработан (полупрозрачный фон + рамка)
export const glassCard = {
  ...glass,
  borderRadius: 22,
};

export const glassPill = {
  ...glass,
  borderRadius: 999,
};

// Палитра для живых данных: цвета тиммейтов и игровых событий
// (используется в live.js и на экранах с картой/лентой)
export const eventPalette = {
  blue: '#60a5fa', // sky-ish
  green: '#34d399',
  purple: '#a78bfa',
  orange: '#fb923c',
  teal: '#2dd4bf',
  yellow: '#facc15',
  red: '#f87171',
};
