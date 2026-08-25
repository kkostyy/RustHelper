// ─────────────────────────────────────────────────────────
// Общие мелкие компоненты мобильной версии (аналог GlassCard /
// SectionHeader / Segmented / TeammateRow из веб-версии).
// ─────────────────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, glassCard, eventPalette } from './theme';
import Avatar from './Avatar';

// t({ru,en}) с зафиксированным языком — как хелпер t() в веб-версии
export const makeT = (lang) => (o) => {
  if (o == null) return '';
  if (typeof o === 'string') return o;
  return lang === 'en' ? o.en || o.ru : o.ru;
};

export function GlassCard({ children, style, onPress }) {
  const body = (
    <View style={[glassCard, { padding: 16, marginBottom: 12 }, style]}>{children}</View>
  );
  if (!onPress) return body;
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      {body}
    </TouchableOpacity>
  );
}

export function SectionHeader({ icon, color = colors.accent, title, right }) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerLeft}>
        <View style={[styles.iconChip, { backgroundColor: (color || colors.accent) + '26' }]}>
          <Text style={styles.iconChipText}>{icon}</Text>
        </View>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

// Сегментный переключатель (выбор источника, пресеты и т.п.)
export function Segmented({ options, value, onChange, color = colors.accentStrong }) {
  return (
    <View style={styles.segWrap}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <TouchableOpacity
            key={String(o.value)}
            style={[styles.segBtn, active && { backgroundColor: color + '38' }]}
            onPress={() => onChange(o.value)}
          >
            <Text
              style={[styles.segTxt, { color: active ? '#fff' : colors.textMuted }, active && { fontWeight: '700' }]}
              numberOfLines={1}
            >
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Строка тимейта: аватар (с аватаркой из Firebase, если есть) + статус
export function TeammateRow({ m, t }) {
  return (
    <View style={styles.tmRow}>
      <Avatar name={m.name} avatarUrl={m.avatarUrl || null} isOnline={!!m.online} isAlive={m.alive !== false} size={40} />
      <View style={styles.tmInfo}>
        <Text style={styles.tmName} numberOfLines={1}>
          {m.name}
          {m.leader ? ' 👑' : ''}
        </Text>
        <Text style={styles.tmMeta}>
          {(m.online ? t({ ru: 'В сети', en: 'Online' }) : t({ ru: 'Не в сети', en: 'Offline' })) +
            ' · ' +
            (m.alive ? t({ ru: 'Жив', en: 'Alive' }) : t({ ru: 'Умер', en: 'Dead' }))}
        </Text>
      </View>
      <View
        style={[
          styles.tmDot,
          { backgroundColor: m.online && m.alive ? eventPalette.green : m.online ? eventPalette.red : 'rgba(255,255,255,0.25)' },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  iconChip: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  iconChipText: { fontSize: 15 },
  headerTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },
  segWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
    padding: 3,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 999,
    alignItems: 'center',
  },
  segTxt: { fontSize: 12, fontWeight: '600' },
  tmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  tmInfo: { flex: 1, marginLeft: 12 },
  tmName: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  tmMeta: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  tmDot: { width: 8, height: 8, borderRadius: 4 },
});
