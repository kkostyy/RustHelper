// MapFullScreen — полноэкранная карта с тапом для открытия, зум двумя пальцами и перетаскивание
// ТЗ 2.1: открытие во весь экран по тапу; зум двумя пальцами; перетаскивание
// Анимации временно отключены (motion.js сейчас — статичные заглушки), для диагностики серого экрана.
import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Dimensions, Animated, PanResponder,
} from 'react-native';
import { colors, eventPalette } from './theme';
import { PopIn, PulseRing } from './motion';

const SCREEN_W = Dimensions.get('window').width;
const SCREEN_H = Dimensions.get('window').height;

export default function MapFullScreen({ lang, lv, onClose }) {
  const [scale, setScale] = useState(1);
  // ИСПРАВЛЕНО: раньше здесь было useState({x,y}) + Animated.event на обычные
  // числа — Animated.event требует Animated.Value(XY), иначе краш при первом
  // жесте перетаскивания. Теперь offset — сам Animated.ValueXY.
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Анимация появления (оставлена на голом Animated из ядра RN — это не
  // компоненты из motion.js, поэтому продолжает работать даже пока
  // motion.js временно отключён).
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.extractOffset();
      },
    })
  ).current;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0, left: 0, width: SCREEN_W, height: SCREEN_H,
        backgroundColor: '#050d18',
        opacity: opacityAnim,
        transform: [{ scale: scaleAnim }],
      }}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity style={{ position: 'absolute', top: 48, right: 20, zIndex: 10 }} onPress={onClose}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>✕</Text>
      </TouchableOpacity>
      <PopIn>
        <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: '700', textAlign: 'center', marginTop: 80 }}>
          🗺️ {lang === 'ru' ? 'Полная карта' : 'Full Map'}
        </Text>
      </PopIn>
      <PopIn>
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <PulseRing size={60} color={eventPalette.purple} />
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 8 }}>
            {lang === 'ru' ? 'Зум: два пальца · Перетаскивание' : 'Pinch zoom · Drag to pan'}
          </Text>
        </View>
      </PopIn>
      <PopIn>
        <View style={{ padding: 24, marginTop: 30 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            {lang === 'ru' ? 'Полная карта с зумом и перетаскиванием — компонент MapFullScreen.' : 'Full-screen map with zoom and drag — MapFullScreen component.'}
          </Text>
        </View>
      </PopIn>
    </Animated.View>
  );
}
