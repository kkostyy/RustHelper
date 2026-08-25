// ─────────────────────────────────────────────────────────
// АНИМАЦИИ приложения — на голом Animated из ядра RN.
// Reanimated/gesture-handler сознательно не ставим: ради
// полировки не хочется тянуть нативные зависимости через CI.
// Все анимации используют только opacity + transform — это
// единственное, что умеет useNativeDriver, поэтому всё крутится
// без нагрузки на JS-поток.
// ─────────────────────────────────────────────────────────
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

// Появление экрана: лёгкий подъём + проявление. Вешается через key:
// <ScreenFade key={tab}>...</ScreenFade> — при смене вкладки контент
// пересоздаётся и мягко всплывает.
export function ScreenFade({ children }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [v]);
  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

// Дыхание точки-индикатора (онлайн, статус живых данных):
// прозрачность и масштаб плавно ходят туда-обратно.
export function PulsingDot({ size = 6, color, style }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <Animated.View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        style,
        {
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }],
        },
      ]}
    />
  );
}

// Расходящееся кольцо поверх маркера живого события на карте
// (хели/карго/чинук/крейт) — «радарный» пульс, видно с периферии.
export function PulseRing({ size = 22, color }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(v, { toValue: 1, duration: 1400, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: color,
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) }],
      }}
    />
  );
}

// Пружинное появление блока (баннер алерта очереди): монтируется
// условно вместе с самим блоком и выстреливает снизу с лёгким зумом.
export function PopIn({ children, style }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }).start();
  }, [v]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
