// ─────────────────────────────────────────────────────────
// ЭКРАН УВЕДОМЛЕНИЙ (открывается колокольчиком в шапке).
// Фильтры Все / События / Алармы / Команда / Трекинг / Торговля
// + поиск по тексту. Открытие экрана помечает всё прочитанным.
// Через ⚙ — настройки: каждую категорию можно выключить совсем,
// повторяющиеся заголовки режутся антиспамом (раз в минуту).
// ─────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { gradientColors, colors, eventPalette } from './theme';
import { useNotifs, markAllSeen, clearNotifs, setKindEnabled } from './notifStore';
import { hhmm } from './live';

const KIND_META = {
  alarm: { icon: '🚨', color: eventPalette.red, label: { ru: 'Алармы', en: 'Alarms' } },
  team: { icon: '👥', color: eventPalette.green, label: { ru: 'Команда', en: 'Team' } },
  track: { icon: '🎯', color: eventPalette.purple, label: { ru: 'Трекинг', en: 'Tracking' } },
  event: { icon: '🎮', color: eventPalette.orange, label: { ru: 'События', en: 'Events' } },
  shop: { icon: '🛒', color: eventPalette.blue, label: { ru: 'Торговля', en: 'Vending' } },
};

const FILTERS = ['all', 'event', 'alarm', 'team', 'track', 'shop'];
const CFG_ORDER = ['alarm', 'event', 'team', 'track', 'shop'];

function pad2(n) {
  return n < 10 ? '0' + n : '' + n;
}
function when(ts, lang) {
  try {
    const d = new Date(ts);
    const day = pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1);
    return lang === 'ru' ? `${day} в ${hhmm(ts)}` : `${day} at ${hhmm(ts)}`;
  } catch (e) {
    return '';
  }
}

export default function NotificationsScreen({ lang, onClose }) {
  const { notifs, cfg } = useNotifs();
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [showCfg, setShowCfg] = useState(false);

  // Открыл экран — всё прочитано (бейдж на колокольчике гаснет)
  useEffect(() => {
    markAllSeen();
  }, []);

  const ql = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    return notifs.filter((n) => {
      if (filter !== 'all' && n.kind !== filter) return false;
      if (!ql) return true;
      const t = n.title || {};
      return (
        (t.ru || '').toLowerCase().includes(ql) ||
        (t.en || '').toLowerCase().includes(ql) ||
        ((n.body && (n.body.ru || n.body.en)) || '').toLowerCase().includes(ql)
      );
    });
  }, [notifs, filter, ql]);

  const filterLabel = (f) => {
    if (f === 'all') return lang === 'ru' ? 'Все' : 'All';
    const m = KIND_META[f];
    return lang === 'ru' ? m.label.ru : m.label.en;
  };

  return (
    <LinearGradient colors={gradientColors} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        {/* Шапка */}
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <Text style={styles.backTxt}>← {lang === 'ru' ? 'Назад' : 'Back'}</Text>
          </TouchableOpacity>
          <View style={styles.topRight}>
            <TouchableOpacity
              style={[styles.gearBtn, showCfg && styles.gearBtnActive]}
              onPress={() => setShowCfg(!showCfg)}
            >
              <Text style={[styles.gearTxt, showCfg && styles.gearTxtActive]}>⚙</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearNotifs}>
              <Text style={styles.clearTxt}>{lang === 'ru' ? 'Очистить' : 'Clear all'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.title}>{lang === 'ru' ? 'Уведомления' : 'Notifications'}</Text>

        {/* Фильтры */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsRow}>
          {FILTERS.map((f) => {
            const active = filter === f;
            const meta = f === 'all' ? null : KIND_META[f];
            return (
              <TouchableOpacity
                key={f}
                style={[styles.chip, active && { backgroundColor: 'rgba(96,165,250,0.22)', borderColor: 'rgba(96,165,250,0.5)' }]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.chipTxt, active && styles.chipTxtActive]}>{filterLabel(f)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Поиск */}
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={lang === 'ru' ? 'Поиск по уведомлениям' : 'Search notifications'}
          placeholderTextColor="rgba(255,255,255,0.3)"
          style={styles.search}
        />

        {/* Настройки категорий (⚙ в шапке) */}
        {showCfg && (
          <View style={styles.cfgCard}>
            <Text style={styles.cfgTitle}>
              {lang === 'ru' ? 'Какие уведомления показывать' : 'Which notifications to show'}
            </Text>
            {CFG_ORDER.map((k) => {
              const meta = KIND_META[k];
              const on = !(cfg && cfg[k] === false);
              return (
                <View key={k} style={styles.cfgRow}>
                  <View style={[styles.cfgIcon, { borderColor: meta.color + '55', backgroundColor: meta.color + '1f' }]}>
                    <Text style={{ fontSize: 14 }}>{meta.icon}</Text>
                  </View>
                  <Text style={styles.cfgLabel}>{lang === 'ru' ? meta.label.ru : meta.label.en}</Text>
                  <Switch
                    value={on}
                    onValueChange={(v) => setKindEnabled(k, v)}
                    trackColor={{ false: 'rgba(255,255,255,0.15)', true: meta.color + '77' }}
                    thumbColor={on ? meta.color : '#888'}
                    ios_backgroundColor="rgba(255,255,255,0.15)"
                  />
                </View>
              );
            })}
            <Text style={styles.cfgHint}>
              {lang === 'ru'
                ? 'Выключенная категория не пишется в центр вовсе. Одинаковые уведомления подряд проходят не чаще раза в минуту.'
                : 'A disabled category is never written to the feed. Identical notifications in a row are limited to once per minute.'}
            </Text>
          </View>
        )}

        {/* Лента */}
        <ScrollView style={styles.list} contentContainerStyle={styles.listInner} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <Text style={styles.empty}>
              {notifs.length === 0
                ? lang === 'ru'
                  ? 'Пока пусто. Уведомления появятся, когда подключён живой источник: тревоги, события, состав команды и трекинг игроков.'
                  : 'Nothing yet. Notifications appear once a live source is connected: alarms, events, team changes and player tracking.'
                : lang === 'ru'
                ? 'Ничего не найдено.'
                : 'Nothing found.'}
            </Text>
          ) : (
            filtered.map((n) => {
              const meta = KIND_META[n.kind] || KIND_META.event;
              return (
                <View key={n.id} style={[styles.row, n.important && styles.rowImportant]}>
                  <View style={[styles.iconWrap, { borderColor: meta.color + '55', backgroundColor: meta.color + '1f' }]}>
                    <Text style={{ fontSize: 15 }}>{meta.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle} numberOfLines={2}>
                      {lang === 'ru' ? n.title.ru : n.title.en || n.title.ru}
                    </Text>
                    {!!n.body && (
                      <Text style={styles.rowBody} numberOfLines={2}>
                        {lang === 'ru' ? n.body.ru : n.body.en || n.body.ru}
                      </Text>
                    )}
                  </View>
                  <View style={styles.rightCol}>
                    <View style={[styles.timeChip, { borderColor: meta.color + '44', backgroundColor: meta.color + '18' }]}>
                      <Text style={[styles.timeTxt, { color: meta.color }]}>{when(n.ts, lang)}</Text>
                    </View>
                    {n.silent && <Text style={styles.silentTxt}>🌙</Text>}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backTxt: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gearBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  gearBtnActive: {
    backgroundColor: 'rgba(96,165,250,0.2)',
    borderColor: 'rgba(96,165,250,0.45)',
  },
  gearTxt: { fontSize: 15, color: colors.textSecondary },
  gearTxtActive: { color: '#fff' },
  cfgCard: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 13,
  },
  cfgTitle: { color: colors.textPrimary, fontSize: 12.5, fontWeight: '700', marginBottom: 10 },
  cfgRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  cfgIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cfgLabel: { flex: 1, color: colors.textPrimary, fontSize: 12.5, fontWeight: '600' },
  cfgHint: { color: colors.textMuted, fontSize: 10.5, lineHeight: 15, marginTop: 4 },
  clearTxt: { color: eventPalette.red, fontSize: 12, fontWeight: '600', padding: 8 },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', paddingHorizontal: 16, marginTop: 12, marginBottom: 10 },
  chipsScroll: { flexGrow: 0 },
  chipsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 4 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  chipTxt: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  chipTxtActive: { color: '#fff' },
  search: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 13,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  list: { flex: 1 },
  listInner: { padding: 16, paddingTop: 8 },
  empty: { color: colors.textMuted, fontSize: 12, lineHeight: 18, paddingTop: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  rowImportant: {
    backgroundColor: 'rgba(248,113,113,0.10)',
    borderColor: 'rgba(248,113,113,0.3)',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  rowBody: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  rightCol: { alignItems: 'flex-end', gap: 4 },
  timeChip: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  timeTxt: { fontSize: 10, fontWeight: '700' },
  silentTxt: { fontSize: 10 },
});
