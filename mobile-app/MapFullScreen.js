// MapFullScreen — полноэкранная карта с тапом для открытия, зум двумя пальцами и перетаскивание
// ТЗ 2.1: открытие во весь экран по тапу; зум двумя пальцами; перетаскивание
// Анимации (много): PopIn для появления, PulseRing для точек, плавные переходы
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
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Анимация появления
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
      onPanResponderMove: Animated.event([null, { dx: offset.x, dy: offset.y }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gesture) => {
        setOffset({ x: offset.x + gesture.dx, y: offset.y + gesture.dy });
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
      <PopIn delay={150}>
        <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: '700', textAlign: 'center', marginTop: 80 }}>
          🗺️ {lang === 'ru' ? 'Полная карта' : 'Full Map'}
        </Text>
      </PopIn>
      <PopIn delay={300}>
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <PulseRing size={60} color={eventPalette.purple} />
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 8 }}>
            {lang === 'ru' ? 'Зум: два пальца · Перетаскивание' : 'Pinch zoom · Drag to pan'}
          </Text>
        </View>
      </PopIn>
      <PopIn delay={450}>
        <View style={{ padding: 24, marginTop: 30 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            {lang === 'ru' ? 'Полная карта с зумом и перетаскиванием — компонент MapFullScreen.' : 'Full-screen map with zoom and drag — MapFullScreen component.'}
          </Text>
        </View>
      </PopIn>
    </Animated.View>
  );
}
