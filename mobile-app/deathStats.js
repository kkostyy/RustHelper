// ─────────────────────────────────────────────────────────
// Аналитика смертей тиммейтов (модуль 3 спецификации,
// loss-report-lite). Источник — live.deathLog, который копится
// за сессию из смен статусов команды (Rust+ не отдаёт причину
// смерти и убийцу — поэтому честные разрезы: время суток,
// игрок, опасные квадраты сетки карты).
// Агрегация чистая (aggregateDeaths) — удобно переиспользовать;
// карточка DeathStatsSection рендерится на Карте под логом.
// ─────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { colors, eventPalette } from './theme';

const GRID_COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

// Текстовая сводка для «Скопировать» — удобно кинуть в Discord клана
export function deathsSummaryText(agg, isRu) {
  const lines = [`${isRu ? '💀 Смертей за сессию' : '💀 Deaths this session'}: ${agg.total}`];
  const hours = agg.byHour
    .map((n, h) => ({ h, n }))
    .filter((x) => x.n > 0)
    .map((x) => `${('0' + x.h).slice(-2)}:00 — ${x.n}`);
  if (hours.length) {
    lines.push(`${isRu ? 'По часам' : 'By hour'}: ${hours.join(', ')}`);
  }
  if (agg.cells.length) {
    lines.push(
      `${isRu ? 'Опасные квадраты' : 'Dangerous areas'}: ` +
        agg.cells.map((c) => `${c.label} ×${c.count} (≈${Math.round(c.x)}, ${Math.round(c.y)})`).join(', '),
    );
  }
  if (agg.players.length) {
    lines.push(`${isRu ? 'По игрокам' : 'By player'}: ${agg.players.map((p) => `${p.name} — ${p.count}`).join(', ')}`);
  }
  return lines.join('\n');
}

// rows: [{id, ts, kind:'death'|'respawn', name, x, y}]
// worldSize — размер мира в метрах (квадрат сетки = worldSize/10,
// как букво-цифровая сетка на самой карте)
export function aggregateDeaths(rows, worldSize = 3000) {
  const deaths = (rows || []).filter((d) => d && d.kind === 'death');
  const byHour = new Array(24).fill(0);
  const byPlayer = {};
  const byCell = {};

  for (const d of deaths) {
    const h = new Date(d.ts || Date.now()).getHours();
    byHour[h] += 1;
    if (d.name) byPlayer[d.name] = (byPlayer[d.name] || 0) + 1;
    if (d.x != null && d.y != null && worldSize > 0) {
      const col = Math.min(9, Math.max(0, Math.floor((d.x / worldSize) * 10)));
      // строки сетки считаются с севера, у нас Y растёт к югу → инверсия
      const row = Math.min(9, Math.max(0, Math.floor(((worldSize - d.y) / worldSize) * 10)));
      const label = GRID_COLS[col] + (row + 1);
      const c = byCell[label] || { count: 0, x: 0, y: 0 };
      c.count += 1;
      c.x += d.x;
      c.y += d.y;
      byCell[label] = c;
    }
  }

  const players = Object.entries(byPlayer)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const cells = Object.entries(byCell)
    .map(([label, c]) => ({
      label,
      count: c.count,
      x: Math.round(c.x / c.count),
      y: Math.round(c.y / c.count),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return { total: deaths.length, players: players.slice(0, 6), byHour, cells };
}

export function DeathStatsSection({ lang, live }) {
  const isRu = lang === 'ru';
  const [copied, setCopied] = useState(false);
  const rows = (live && live.deathLog) || [];
  const worldSize =
    (live && live.map && live.map.width) ||
    (live && live.server && live.server.mapSizeM) ||
    3000;
  const agg = aggregateDeaths(rows, worldSize);
  const maxHour = Math.max(1, ...agg.byHour);
  const maxPlayer = agg.players.length ? agg.players[0].count : 1;

  const copySummary = () => {
    Clipboard.setString(deathsSummaryText(agg, isRu));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  if (!agg.total) {
    return (
      <Text style={styles.empty}>
        {isRu
          ? 'Статистика появится после первых смертей в логе.'
          : 'Stats appear after the first deaths hit the log.'}
      </Text>
    );
  }

  return (
    <View>
      <View style={styles.summaryRow}>
        <Text style={[styles.summary, { flex: 1, marginBottom: 0 }]}>
          💀 {agg.total}{' '}
          {isRu
            ? agg.total === 1
              ? 'смерть за сессию'
              : 'смертей за сессию'
            : agg.total === 1
            ? 'death this session'
            : 'deaths this session'}
          {' · '}
          {agg.players.length} {isRu ? 'игрок(ов)' : 'player(s)'}
        </Text>
        <TouchableOpacity style={styles.copyBtn} onPress={copySummary} activeOpacity={0.7}>
          <Text style={styles.copyBtnTxt}>{copied ? '✓' : '📋'}</Text>
        </TouchableOpacity>
      </View>

      {/* По часам суток: 24 мини-бара, подписаны 00/06/12/18 */}
      <Text style={styles.subHead}>{isRu ? 'ПО ЧАСАМ СУТОК' : 'BY HOUR OF DAY'}</Text>
      <View style={styles.hourRow}>
        {agg.byHour.map((n, h) => (
          <View key={h} style={styles.hourCol}>
            {!!n && (
              <Text style={styles.hourNum}>
                {n > 9 ? '9' : n}
              </Text>
            )}
            <View style={[styles.hourBar, n ? { height: 4 + (n / maxHour) * 26 } : null]} />
            {h % 6 === 0 && <Text style={styles.hourLbl}>{('0' + h).slice(-2)}</Text>}
          </View>
        ))}
      </View>

      {/* Опасные квадраты: топ по числу смертей, координаты центра */}
      {agg.cells.length > 0 && (
        <View>
          <Text style={styles.subHead}>{isRu ? 'ОПАСНЫЕ КВАДРАТЫ' : 'DANGEROUS AREAS'}</Text>
          <View style={styles.cellRow}>
            {agg.cells.map((c) => (
              <View key={c.label} style={styles.cellChip}>
                <Text style={styles.cellLabel}>{c.label}</Text>
                <Text style={styles.cellCount}>
                  {c.count} {isRu ? (c.count === 1 ? 'смерть' : 'смертей') : c.count === 1 ? 'death' : 'deaths'}
                </Text>
                <Text style={styles.cellCoord}>
                  ≈{Math.round(c.x)}, {Math.round(c.y)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* По игрокам */}
      {agg.players.length > 1 && (
        <View>
          <Text style={styles.subHead}>{isRu ? 'ПО ИГРОКАМ' : 'BY PLAYER'}</Text>
          {agg.players.map((p) => (
            <View key={p.name} style={styles.pRow}>
              <Text style={styles.pName} numberOfLines={1}>
                {p.name}
              </Text>
              <View style={styles.pTrack}>
                <View style={[styles.pFill, { width: `${Math.round((p.count / maxPlayer) * 100)}%` }]} />
              </View>
              <Text style={styles.pCount}>{p.count}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.disclaimer}>
        {isRu
          ? 'Rust+ не передаёт убийцу и причину смерти — только факт, место и время. Лог копится за сессию.'
          : 'Rust+ does not expose the killer or cause of death — only the fact, place and time. The log accumulates per session.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.textMuted, fontSize: 11.5 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  summary: { color: colors.textPrimary, fontSize: 12.5, fontWeight: '700', marginBottom: 8 },
  copyBtn: {
    backgroundColor: 'rgba(248,113,113,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  copyBtnTxt: { fontSize: 13 },
  subHead: {
    color: colors.textMuted,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 8,
    marginBottom: 6,
  },
  hourRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  hourCol: { flex: 1, alignItems: 'center' },
  hourNum: { color: eventPalette.red, fontSize: 7.5, fontWeight: '700', marginBottom: 1 },
  hourBar: { width: '100%', height: 3, backgroundColor: 'rgba(248,113,113,0.25)', borderRadius: 1 },
  hourLbl: { color: colors.textMuted, fontSize: 7, marginTop: 2 },
  cellRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 2 },
  cellChip: {
    backgroundColor: 'rgba(248,113,113,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.28)',
    borderRadius: 11,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  cellLabel: { color: colors.textPrimary, fontSize: 12, fontWeight: '800' },
  cellCount: { color: eventPalette.red, fontSize: 9.5, fontWeight: '600', marginTop: 1 },
  cellCoord: { color: colors.textMuted, fontSize: 9 },
  pRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  pName: { width: 90, color: colors.textPrimary, fontSize: 11.5, fontWeight: '600' },
  pTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  pFill: { height: 6, borderRadius: 3, backgroundColor: eventPalette.red },
  pCount: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', width: 20, textAlign: 'right' },
  disclaimer: { color: colors.textMuted, fontSize: 9.5, fontStyle: 'italic', marginTop: 8, lineHeight: 13 },
});
