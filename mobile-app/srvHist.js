// ─────────────────────────────────────────────────────────
// История сервера (модуль 9 спецификации): скользящие срезы
// онлайн/очереди за 24 часа, спарклайн и два алерта:
//  • рестарт/вайп — wipeTime от сервера изменился вверх;
//  • потеря связи — статус был connected и перестал им быть
//    (+ отдельное тихое уведомление о восстановлении).
// Сэмплы пишет useServerHistory (висит в App.js, работает на
// любой вкладке): не чаще раза в 5 минут, окно 24 ч, максимум
// 288 точек в AsyncStorage rc_srvhist_v1. Спарклайн — чистые
// View-бары без SVG-зависимостей.
// ─────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pushNotif } from './notifStore';
import { colors, eventPalette } from './theme';

const HIST_KEY = 'rc_srvhist_v1';
const SAMPLE_MS = 5 * 60000; // срез раз в 5 минут
const WINDOW_MS = 24 * 3600000; // помним сутки

// hist вне React: { samples:[{t,p,q}], wipeTime } — t=ms, p=онлайн,
// q=очередь; wipeTime — последний виденный unix-время вайпа (сек).
let hist = { samples: [], wipeTime: 0 };
let loaded = false;
const listeners = new Set();

export async function loadSrvHist() {
  if (loaded) return hist;
  loaded = true;
  try {
    const raw = await AsyncStorage.getItem(HIST_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && Array.isArray(p.samples)) {
        hist = {
          samples: p.samples.filter((s) => s && s.t && s.p != null).slice(-300),
          wipeTime: p.wipeTime || 0,
        };
      }
    }
  } catch (e) {
    /* битые данные — начинаем заново */
  }
  return hist;
}

function persist() {
  try {
    AsyncStorage.setItem(HIST_KEY, JSON.stringify(hist)).catch(() => {});
  } catch (e) {}
}

function emit() {
  listeners.forEach((fn) => {
    try {
      fn(hist);
    } catch (e) {}
  });
}

function addSample(p, q) {
  const now = Date.now();
  hist = { ...hist, samples: [...hist.samples, { t: now, p, q }] };
  const cutoff = now - WINDOW_MS;
  while (hist.samples.length && hist.samples[0].t < cutoff) {
    hist = { ...hist, samples: hist.samples.slice(1) };
  }
  persist();
  emit();
}

// Подписка для UI (карточка истории на Пробиве)
export function useSrvHist() {
  const [snap, setSnap] = useState(hist);
  useEffect(() => {
    const fn = (h) => setSnap({ ...h });
    listeners.add(fn);
    loadSrvHist().then(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return snap;
}

// ── Вотчер: сэмплирование + алерты. Ставится один раз в App.js ──
export function useServerHistory(live) {
  const lastSampleAtRef = React.useRef(0);
  const prevStatusRef = React.useRef(null);

  // Срезы онлайна/очереди + детект рестарта по wipeTime
  useEffect(() => {
    if (!live || live.mode === 'mock' || live.status !== 'connected') return;
    const srv = live.server;
    if (!srv || !srv.maxPlayers) return;
    const now = Date.now();
    if (now - lastSampleAtRef.current < SAMPLE_MS) return;
    lastSampleAtRef.current = now;
    loadSrvHist().then((h) => {
      addSample(srv.playersN || 0, srv.queued || 0);
      const wt = Number(srv.wipeTime) || 0;
      if (wt && h.wipeTime && wt > h.wipeTime + 60) {
        pushNotif({
          kind: 'event',
          important: true,
          title: { ru: '🔄 Сервер перезапущен', en: '🔄 Server restarted' },
          body: {
            ru: 'wipeTime изменился — сервер поднимался или вайпнулся.',
            en: 'wipeTime changed — the server went down or wiped.',
          },
        });
      }
      if (wt && wt !== h.wipeTime) {
        h.wipeTime = wt;
        persist();
        emit();
      }
    });
  }, [live && live.server, live && live.status]);

  // Потеря связи / восстановление
  useEffect(() => {
    if (!live || live.mode === 'mock') return;
    const st = live.status;
    const prev = prevStatusRef.current;
    prevStatusRef.current = st;
    if (prev == null || prev === st) return;
    if (prev === 'connected' && st !== 'connected') {
      pushNotif({
        kind: 'event',
        important: true,
        title: { ru: '⚠️ Связь с сервером потеряна', en: '⚠️ Lost server connection' },
        body: {
          ru: 'Онлайн, события и устройства больше не обновляются.',
          en: 'Players, events and devices are no longer updating.',
        },
      });
    } else if (prev !== 'connecting' && st === 'connected') {
      pushNotif({
        kind: 'event',
        title: { ru: '✅ Связь восстановлена', en: '✅ Connection restored' },
      });
    }
  }, [live && live.status]);
}

// ── Спарклайн: бары онлайна за 24 ч, оранжевый кончик — очередь ──
// Бакетизация: N корзин по WINDOW_MS/N, в корзине — последний срез.
export function SrvSparkline({ samples, height = 52, bars = 36 }) {
  const now = Date.now();
  const bucketMs = WINDOW_MS / bars;
  const buckets = new Array(bars).fill(null);
  for (const s of samples || []) {
    const age = now - s.t;
    if (age < 0 || age > WINDOW_MS) continue;
    const i = bars - 1 - Math.floor(age / bucketMs);
    buckets[i] = s; // позже — важнее
  }
  const maxP = Math.max(1, ...(samples || []).map((s) => s.p || 0));
  const maxQ = Math.max(1, ...(samples || []).map((s) => s.q || 0));

  return (
    <View style={[styles.sparkWrap, { height }]}>
      {buckets.map((s, i) => {
        if (!s) {
          return <View key={i} style={styles.sparkEmpty} />;
        }
        const ph = Math.max(3, Math.round(((s.p || 0) / maxP) * height));
        const qh = s.q ? Math.max(2, Math.round((Math.min(s.q, maxQ) / maxP) * height)) : 0;
        return (
          <View key={i} style={styles.sparkCol}>
            {!!qh && <View style={[styles.sparkQ, { height: Math.min(qh, height - ph) }]} />}
            <View style={[styles.sparkP, { height: Math.min(ph, height) }]} />
          </View>
        );
      })}
    </View>
  );
}

export function SrvHistoryCard({ lang }) {
  const { samples } = useSrvHist();
  const isRu = lang === 'ru';
  let peak = 0;
  let peakQ = 0;
  for (const s of samples || []) {
    if ((s.p || 0) > peak) peak = s.p;
    if ((s.q || 0) > peakQ) peakQ = s.q;
  }
  const cur = samples && samples.length ? samples[samples.length - 1] : null;
  const hoursCovered =
    samples && samples.length > 1
      ? Math.min(24, Math.round((samples[samples.length - 1].t - samples[0].t) / 3600000))
      : 0;

  return (
    <View>
      {!samples.length ? (
        <Text style={styles.hint}>
          {isRu
            ? 'Срезы появятся через ~5 минут после подключения живого источника и накопятся за сутки.'
            : 'Samples start ~5 minutes after connecting a live source and build up over 24 hours.'}
        </Text>
      ) : (
        <View>
          <SrvSparkline samples={samples} />
          <View style={styles.histLegendRow}>
            <Text style={styles.histStat}>
              👥 {cur ? cur.p : '—'}
              {isRu ? ' сейчас' : ' now'}
            </Text>
            <Text style={styles.histStat}>
              📈 {isRu ? 'пик' : 'peak'} {peak}
            </Text>
            <Text style={styles.histStat}>
              ⏳ {isRu ? 'очередь макс' : 'queue max'} {peakQ}
            </Text>
          </View>
          <Text style={styles.hint}>
            {isRu
              ? 'Срез раз в 5 минут, окно 24 ч (сейчас ' + hoursCovered + ' ч). Оранжевый кончик бара — очередь.'
              : 'A sample every 5 minutes, 24 h window (' + hoursCovered + ' h so far). Orange bar tip is the queue.'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.textMuted, fontSize: 10.5, lineHeight: 15 },
  sparkWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginVertical: 10 },
  sparkCol: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  sparkP: { backgroundColor: eventPalette.blue, borderRadius: 1, minHeight: 2, opacity: 0.85 },
  sparkQ: { backgroundColor: eventPalette.orange, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  sparkEmpty: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 1, alignSelf: 'flex-end' },
  histLegendRow: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  histStat: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
});
