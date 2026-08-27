// ─────────────────────────────────────────────────────────
// АНИМАЦИИ ВРЕМЕННО ОТКЛЮЧЕНЫ (диагностика серого экрана).
// Компоненты сохраняют те же имена и пропсы, что и раньше,
// поэтому App.js / HomeScreen.js / IntelScreen.js / MapScreen.js /
// MapFullScreen.js менять не нужно — просто ничего не анимируют.
// ─────────────────────────────────────────────────────────
import React from 'react';
import { View } from 'react-native';

// Было: подъём + проявление при смене вкладки.
export function ScreenFade({ children }) {
  return <View style={{ flex: 1 }}>{children}</View>;
}

// Было: дышащая точка-индикатор.
export function PulsingDot({ size = 6, color, style }) {
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        style,
      ]}
    />
  );
}

// Было: расходящееся кольцо на карте. Пока просто ничего не рендерим —
// это декоративный элемент, без него ничего не ломается.
export function PulseRing() {
  return null;
}

// Было: пружинное появление блока.
export function PopIn({ children, style }) {
  return <View style={style}>{children}</View>;
}
