// ─────────────────────────────────────────────────────────
// ЭКРАН 3: УСТРОЙСТВА (бывший «Умный дом»). Три раздела —
// выключатели, сигнализация, хранилище — переключаются
// сегментом сверху; в «Хранилище» живёт и эвристика переплавки.
// Управление через actions.toggleSwitch (оптимистично, с
// индикатором «в процессе»). Порт SmartHome.
// ТЗ 2.2: мультивыбор выключателей + групповое вкл/выкл — в планах.
// ─────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, eventPalette } from './theme';
import { GlassCard, SectionHeader, Segmented } from './ui';
import { analyzeSmelting } from './smeltCalc';
import { LOOT_CATS, lootInfo } from './data/lootCats';

// ТЗ 2.2: мультивыбор выключателей + групповое вкл/выкл — заглушка функции
function toggleGroupSwitches(switchIds, value) {
  // Групповое управление: переключить все выбранные выключатели одновременно
  return; // заглушка для будущей реализации
}
function fmtDuration(sec) {
  if (!sec || sec <= 0) return '—';
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}д ${h}ч`;
  if (h > 0) return `${h}ч ${m}м`;
  return `${m}м`;
}

function sublineFor(dev, lang) {
  if (dev.type === 'storage_monitor') {
    const n = (dev.items || []).length;
    const secsLeft = dev.hasProtection ? (dev.protectionExpiry || 0) - Math.floor(Date.now() / 1000) : 0;
    const prot = dev.hasProtection && secsLeft > 0 ? ' · 🛡 ' + fmtDuration(secsLeft) : '';
    return lang === 'ru'
      ? `${n}${dev.capacity ? '/' + dev.capacity : ''} слотов${prot}`
      : `${n}${dev.capacity ? '/' + dev.capacity : ''} slots${prot}`;
  }
  if (dev.type === 'alarm') {
    return dev.value
      ? lang === 'ru'
        ? 'Сработала!'
        : 'Triggered!'
      : lang === 'ru'
      ? 'Спокойно'
      : 'Idle';
  }
  return dev.value
    ? lang === 'ru'
      ? 'Включено'
      : 'On'
    : lang === 'ru'
    ? 'Выключено'
    : 'Off';
}

const FILTERS = [
  { value: 'all', label: 'Все' },
  { value: 'switch', label: 'Выключатели' },
  { value: 'alarm', label: 'Сигнализация' },
  { value: 'storage', label: 'Хранилище' },
];

// Лут-радар (модуль 14): глобальный тумблер карточки, rc_lootradar_v1
function useLootRadarOn() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    AsyncStorage.getItem('rc_lootradar_v1')
      .then((v) => {
        if (v === '0') setOn(false);
      })
      .catch(() => {});
  }, []);
  return [
    on,
    (v) => {
      setOn(v);
      AsyncStorage.setItem('rc_lootradar_v1', v ? '1' : '0').catch(() => {});
    },
  ];
}

export default function DevicesScreen({ lang, t, live }) {
  const isLive = !!(live && live.mode !== 'mock');
  const [pendingIds, setPendingIds] = useState({});
  const [filter, setFilter] = useState('switch'); // по ТЗ: не показывать все подряд
  const [selectedIds, setSelectedIds] = useState([]); // многовыбор для группового управления

  // Лут-радар: тумблер + фильтр категории + поиск + развёрнутая строка
  const [radarOn, setRadarOn] = useLootRadarOn();
  const [lootCat, setLootCat] = useState('all');
  const [lootQ, setLootQ] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const devices = Object.values(live.devices || {});
  const switches = devices.filter((d) => d.type === 'switch');
  const alarms = devices.filter((d) => d.type === 'alarm');
  const monitors = devices.filter((d) => d.type === 'storage_monitor');
  // Мониторы, в которых лежит руда — для секции переплавки
  const smeltRows = monitors
    .map((dev) => ({ dev, s: analyzeSmelting(dev.items) }))
    .filter((r) => r.s);

  // Агрегация лута по всем мониторам: itemId → {qty, boxes[]}
  const lootRows = useMemo(() => {
    const map = new Map();
    monitors.forEach((dev) => {
      (dev.items || []).forEach((it) => {
        if (!it || it.isBlueprint) return;
        const id = String(it.itemId);
        let row = map.get(id);
        if (!row) {
          row = { id, info: lootInfo(id), qty: 0, boxes: [] };
          map.set(id, row);
        }
        row.qty += it.quantity || 0;
        const box = row.boxes.find((b) => b.id === String(dev.id));
        if (box) box.qty += it.quantity || 0;
        else row.boxes.push({ id: String(dev.id), name: dev.name, qty: it.quantity || 0 });
      });
    });
    return [...map.values()].sort((a, b) => b.qty - a.qty);
  }, [monitors]);

  const hasUnknownLoot = lootRows.some((r) => !r.info);
  const lootChips = [
    { key: 'all', icon: '📦', ru: 'Все', en: 'All' },
    ...LOOT_CATS,
    ...(hasUnknownLoot ? [{ key: 'other', icon: '❓', ru: 'Прочее', en: 'Other' }] : []),
  ];
  const visibleLoot = lootRows.filter((r) => {
    if (lootCat !== 'all') {
      const c = r.info ? r.info.cat : 'other';
      if (c !== lootCat) return false;
    }
    const q = lootQ.trim().toLowerCase();
    if (!q) return true;
    const nm = r.info ? `${r.info.ru} ${r.info.en}`.toLowerCase() : '';
    return nm.includes(q) || r.id.includes(q);
  });

  const showSwitches = (filter === 'all' || filter === 'switch') && switches.length > 0;
  const showAlarms = (filter === 'all' || filter === 'alarm') && alarms.length > 0;
  const showMonitors = (filter === 'all' || filter === 'storage') && monitors.length > 0;
  const showSmelt = (filter === 'all' || filter === 'storage') && smeltRows.length > 0;
  const storageContext = filter === 'all' || filter === 'storage';

  const toggleDevice = async (dev) => {
    const id = String(dev.id);
    setPendingIds((p) => ({ ...p, [id]: true }));
    try {
      await live.actions.toggleSwitch(id, !dev.value);
    } catch (e) {
      /* статус ошибки виден на Мейне */
    }
    // снимаем «в процессе» по подтверждению следующим поллом/бродкастом
    setTimeout(() => setPendingIds((p) => ({ ...p, [id]: false })), 6000);
  };

  if (devices.length === 0) {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <GlassCard>
          <SectionHeader icon="🎛" color={eventPalette.yellow} title={lang === 'ru' ? 'Устройства' : 'Devices'} />
          <Text style={styles.empty}>
            {lang === 'ru'
              ? 'Устройств нет. В живом режиме список задаётся entities.json (Firebase) или полем «Устройства» в настройках источника (Rust+).'
              : 'No devices. In live mode the list comes from entities.json (Firebase) or the "Devices" field of the source settings (Rust+).'}
          </Text>
        </GlassCard>
      </ScrollView>
    );
  }

  const renderRow = (dev) => (
    <View key={String(dev.id)} style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{dev.name}</Text>
        <Text
          style={[
            styles.meta,
            dev.type === 'alarm' && dev.value && { color: eventPalette.red, fontWeight: '700' },
          ]}
        >
          {sublineFor(dev, lang)}
        </Text>
      </View>
      {dev.type === 'switch' ? (
        pendingIds[String(dev.id)] ? (
          <ActivityIndicator color={eventPalette.green} />
        ) : (
          <Switch
            value={!!dev.value}
            onValueChange={() => toggleDevice(dev)}
            trackColor={{ false: '#333', true: '#2f7d4f' }}
            thumbColor={dev.value ? eventPalette.green : '#888'}
          />
        )
      ) : (
        <View style={[styles.statusDot, { backgroundColor: dev.value ? eventPalette.red : eventPalette.green }]} />
      )}
    </View>
  );

  // Подписи фильтров bilingual: сегмент рисует label напрямую
  const filterLabel = (f) => {
    if (lang === 'en') {
      return { all: 'All', switch: 'Switches', alarm: 'Alarms', storage: 'Storage' }[f.value];
    }
    return f.label;
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <GlassCard>
        <SectionHeader icon="🎛" color={eventPalette.yellow} title={lang === 'ru' ? 'Устройства' : 'Devices'} />
        {!isLive && (
          <Text style={styles.note}>
            {lang === 'ru'
              ? 'Демо-устройства. Подключи живой источник, чтобы управлять настоящими.'
              : 'Demo devices. Connect a live source to control real ones.'}
          </Text>
        )}
        <Segmented
          value={filter}
          onChange={setFilter}
          color={eventPalette.yellow}
          options={FILTERS.map((f) => ({ value: f.value, label: filterLabel(f) }))}
        />

        {showSwitches && (
          <>
            <Text style={styles.section}>{lang === 'ru' ? 'ВЫКЛЮЧАТЕЛИ' : 'SWITCHES'}</Text>
            {switches.map(renderRow)}
          </>
        )}
        {showAlarms && (
          <>
            <Text style={styles.section}>{lang === 'ru' ? 'СИГНАЛИЗАЦИИ' : 'ALARMS'}</Text>
            {alarms.map(renderRow)}
          </>
        )}
        {showMonitors && (
          <>
            <Text style={styles.section}>{lang === 'ru' ? 'ХРАНИЛИЩЕ / TC' : 'STORAGE / TC'}</Text>
            {monitors.map(renderRow)}
          </>
        )}
        {showSmelt && (
          <>
            <Text style={styles.section}>{lang === 'ru' ? 'ПЕРЕПЛАВКА (≈ ЭВРИСТИКА)' : 'SMELTING ESTIMATE'}</Text>
            <Text style={[styles.note, { marginBottom: 8 }]}>
              {lang === 'ru'
                ? 'Прикидка по руде и дереву в мониторе при ванильных скоростях печи; сервер может их менять.'
                : 'Estimate from ore and wood in the monitor at vanilla furnace speeds; servers may change them.'}
            </Text>
            {smeltRows.map(({ dev, s }) => {
              const parts = [];
              if (s.counts.metal) parts.push(`🪙 ${s.counts.metal}`);
              if (s.counts.sulfur) parts.push(`🟡 ${s.counts.sulfur}`);
              if (s.counts.hqm) parts.push(`💎 ${s.counts.hqm}`);
              return (
                <View key={`smelt-${dev.id}`} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>🔥 {dev.name}</Text>
                    <Text style={styles.meta}>{parts.join('  ·  ')}</Text>
                    <Text
                      style={[
                        styles.meta,
                        !s.enoughWood && { color: eventPalette.orange, fontWeight: '700' },
                      ]}
                    >
                      ⏱ ≈{fmtDuration(s.oreSec)}{' '}
                      {lang === 'ru' ? 'переплавки' : 'to smelt'}
                      {' · '}
                      {lang === 'ru' ? 'дров на' : 'wood for'} ≈{fmtDuration(s.woodSec)}
                    </Text>
                    {!s.enoughWood && (
                      <Text style={[styles.meta, { color: eventPalette.orange }]}>
                        ⚠️ {lang === 'ru' ? 'дрова кончатся раньше руды — докинь дерево' : 'wood runs out before the ore — add more'}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        )}
        {/* Выбран раздел, в котором пусто — честно скажем */}
        {!showSwitches && !showAlarms && !showMonitors && !showSmelt && (
          <Text style={styles.empty}>
            {lang === 'ru' ? 'В этом разделе устройств нет.' : 'No devices in this section.'}
          </Text>
        )}

        {/* ЛУТ-РАДАР (модуль 14): сводка по всем Storage Monitor'ам.
            Тумблер живёт в шапке, чтобы радар можно было выключить
            и снова включить не уходя с экрана. */}
        {storageContext && monitors.length > 0 && lootRows.length > 0 && (
          <>
            <View style={styles.radarHeader}>
              <Text style={styles.section}>
                {lang === 'ru' ? '📦 ЛУТ-РАДАР' : '📦 LOOT RADAR'}
              </Text>
              <Switch
                value={radarOn}
                onValueChange={setRadarOn}
                trackColor={{ false: '#333', true: '#2f7d4f' }}
                thumbColor={radarOn ? eventPalette.green : '#888'}
              />
            </View>
            {radarOn && (
              <>
                <Text style={[styles.note, { marginBottom: 8 }]}>
                  {lang === 'ru'
                    ? 'Что лежит на базе, по содержимому всех Storage Monitor\'ов. Словарь покрывает ходовые предметы — остальное подписано #id.'
                    : 'What your base holds, from every Storage Monitor. The dictionary covers common items — the rest is labeled #id.'}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 8 }}
                  contentContainerStyle={styles.lootChips}
                >
                  {lootChips.map((c) => {
                    const active = lootCat === c.key;
                    return (
                      <TouchableOpacity key={c.key} onPress={() => setLootCat(c.key)} activeOpacity={0.7}>
                        <Text
                          style={[
                            styles.lootChip,
                            active && styles.lootChipActive,
                          ]}
                        >
                          {c.icon} {lang === 'ru' ? c.ru : c.en}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <TextInput
                  value={lootQ}
                  onChangeText={setLootQ}
                  placeholder={lang === 'ru' ? 'Поиск по луту...' : 'Search loot...'}
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  style={styles.lootSearch}
                />
                {visibleLoot.map((r) => {
                  const name = r.info ? (lang === 'ru' ? r.info.ru : r.info.en) : `#${r.id}`;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      onPress={() => setExpandedId(expandedId === r.id ? null : r.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.name}>{name}</Text>
                          <Text style={styles.meta}>
                            {expandedId === r.id
                              ? r.boxes.map((b) => `${b.name}: ${b.qty}`).join(' · ')
                              : lang === 'ru'
                              ? `${r.boxes.length} ${r.boxes.length === 1 ? 'ящик' : 'ящик.'}`
                              : `${r.boxes.length} box${r.boxes.length > 1 ? 'es' : ''}`}
                          </Text>
                        </View>
                        <Text style={styles.lootQty}>{r.qty}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {visibleLoot.length === 0 && (
                  <Text style={styles.empty}>
                    {lang === 'ru' ? 'Ничего не найдено.' : 'Nothing found.'}
                  </Text>
                )}
              </>
            )}
          </>
        )}
      </GlassCard>

      {/* Камеры: в вебе и мобиле живого эфира нет — честная заглушка */}
      {(filter === 'all' || filter === 'alarm') && (
        <GlassCard>
          <SectionHeader icon="📷" color={eventPalette.blue} title={lang === 'ru' ? 'Камеры Rust+' : 'Rust+ Cameras'} />
          <Text style={styles.empty}>
            {lang === 'ru'
              ? 'Прямой эфир камер недоступен — смотри коды CCTV в разделе «Другое → Полезная информация».'
              : 'Live camera feeds are not available — see CCTV codes under Other → Useful Info.'}
          </Text>
        </GlassCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  note: { color: colors.textMuted, fontSize: 11, marginBottom: 10 },
  empty: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  section: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  name: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  meta: { color: colors.textSecondary, fontSize: 11.5, marginTop: 2 },
  statusDot: { width: 11, height: 11, borderRadius: 6 },
  radarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lootChips: { flexDirection: 'row', gap: 6, paddingRight: 8 },
  lootChip: {
    color: colors.textSecondary,
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  lootChipActive: {
    color: '#fff',
    backgroundColor: 'rgba(96,165,250,0.25)',
    borderColor: 'rgba(96,165,250,0.45)',
    fontWeight: '700',
  },
  lootSearch: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 12.5,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 8,
  },
  lootQty: { color: eventPalette.blue, fontSize: 13, fontWeight: '700', marginLeft: 10 },
});
