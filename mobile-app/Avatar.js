import React, { useState } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

// Стабильный цвет по строке — чтобы у одного и того же игрока
// всегда была одна и та же "заглушка"-цвет, даже без фото.
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 42%)`;
}

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const second = parts.length > 1 ? parts[1][0] : parts[0]?.[1] || '';
  return (first + second).toUpperCase();
}

/**
 * props:
 *  - name: string
 *  - avatarUrl?: string | null
 *  - isOnline: boolean
 *  - isAlive: boolean
 *  - size?: number (default 44)
 */
export default function Avatar({ name, avatarUrl, isOnline, isAlive, size = 44 }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!avatarUrl && !imgFailed;
  const bgColor = stringToColor(name || 'unknown');
  const ringColor = isOnline ? '#3ddc84' : '#555';
  const badgeSize = Math.max(14, Math.round(size * 0.4));

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: ringColor,
          },
        ]}
      >
        {showImage ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <View
            style={[
              styles.fallback,
              {
                width: size - 4,
                height: size - 4,
                borderRadius: (size - 4) / 2,
                backgroundColor: bgColor,
              },
            ]}
          >
            <Text style={[styles.initialsText, { fontSize: size * 0.34 }]}>{initials(name)}</Text>
          </View>
        )}
      </View>

      {!isAlive && (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              right: -2,
              bottom: -2,
            },
          ]}
        >
          <Text style={{ fontSize: badgeSize * 0.62 }}>💀</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
  },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initialsText: { color: '#fff', fontWeight: '700' },
  badge: {
    position: 'absolute',
    backgroundColor: '#1a1a1a',
    borderWidth: 1.5,
    borderColor: '#c0392b',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
