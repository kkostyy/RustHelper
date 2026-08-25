// ─────────────────────────────────────────────────────────
// Центр уведомлений приложения. Единая точка, куда пишутся:
// тревоги устройств, спавны/исчезновения игровых событий,
// смерти/респавны/входы/выходы тиммейтов, алерт очереди и
// срабатывания трекинга игроков из «Пробива».
// Хранилище модульное (вне React): провайдеры live.js пушат
// в него без хуков, экраны читают через useNotifs().
// Последние ~120 уведомлений живут в AsyncStorage, непрочитанные
// считаются по метке последнего просмотра. «Не беспокоить» не
// удаляет уведомления, а помечает их сразу прочитанными.
// Дополнительно: каждая категория отключается отдельно
// (rc_notifcfg_v1), а повторяющийся заголовок одной категории
// проходит антиспам-фильтр — не чаще раза в минуту.
// ─────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIF_KEY = 'rc_notif_v1';
const SEEN_KEY = 'rc_notif_seen_v1';
const DND_KEY = 'rc_dnd_v1';
const CFG_KEY = 'rc_notifcfg_v1';
const MAX_NOTIFS = 120;
const ANTI_SPAM_MS = 60000; // тот же заголовок того же типа не чаще

// kind: 'alarm' | 'team' | 'track' | 'event' | 'shop'
let notifs = [];
let seenTs = 0;
let dnd = false;
let loaded = false;
const listeners = new Set();

// Включённость категорий (по умолчанию все); хранится целиком.
const DEFAULT_CFG = { alarm: true, team: true, track: true, event: true, shop: true };
let kindCfg = { ...DEFAULT_CFG };
// Антиспам: ключ «тип|заголовок» → время последнего пропуска
const lastPushAt = {};

function unreadCount() {
  return notifs.filter((n) => !n.silent && n.ts > seenTs).length;
}

function emit() {
  const snap = { notifs, unread: unreadCount(), dnd, cfg: kindCfg };
  listeners.forEach((fn) => {
    try {
      fn(snap);
    } catch (e) {
      /* слушатель умер — не роняем остальных */
    }
  });
}

function persist() {
  try {
    AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(notifs.slice(0, MAX_NOTIFS))).catch(() => {});
  } catch (e) {
    /* приватный режим */
  }
}

// Загружаем сохранённые уведомления и настройки один раз при старте
export async function loadNotifStore() {
  if (loaded) return;
  loaded = true;
  try {
    const [rawN, rawS, rawD, rawC] = await Promise.all([
      AsyncStorage.getItem(NOTIF_KEY),
      AsyncStorage.getItem(SEEN_KEY),
      AsyncStorage.getItem(DND_KEY),
      AsyncStorage.getItem(CFG_KEY),
    ]);
    if (rawN) {
      const parsed = JSON.parse(rawN);
      if (Array.isArray(parsed)) notifs = parsed.filter((n) => n && n.id && n.ts);
    }
    if (rawS) seenTs = Number(rawS) || 0;
    if (rawD === '1') dnd = true;
    if (rawC) {
      try {
        const parsed = JSON.parse(rawC);
        if (parsed && typeof parsed === 'object') {
          for (const k of Object.keys(DEFAULT_CFG)) {
            if (typeof parsed[k] === 'boolean') kindCfg[k] = parsed[k];
          }
        }
      } catch (e) {}
    }
    emit();
  } catch (e) {
    /* битые данные — начинаем с пустого центра */
  }
}

// Пуш нового уведомления. title/body — {ru,en}; important подсвечивает
// строку в ленте (тревоги, хели/карго). При включённом «Не беспокоить»
// уведомление сохраняется, но сразу помечено прочитанным.
// Гейт на входе: категория выключена в настройках → не сохраняется
// вовсе; тот же заголовок той же категории чаще раза в минуту → дроп
// (антиспам от мигающих свитчей и частых спавнов).
export function pushNotif({ kind, title, body, important }) {
  const k = kind || 'event';
  if (kindCfg[k] === false) return false;
  const now = Date.now();
  const spamKey = k + '|' + ((title && (title.ru || title.en)) || '');
  if (lastPushAt[spamKey] && now - lastPushAt[spamKey] < ANTI_SPAM_MS) return false;
  lastPushAt[spamKey] = now;
  const silent = dnd;
  notifs = [
    {
      id: now + '-' + Math.random().toString(36).slice(2, 8),
      ts: now,
      kind: k,
      title: title || { ru: '', en: '' },
      body: body || null,
      important: !!important,
      silent,
    },
    ...notifs,
  ].slice(0, MAX_NOTIFS);
  persist();
  emit();
  return true;
}

export function markAllSeen() {
  seenTs = Date.now();
  try {
    AsyncStorage.setItem(SEEN_KEY, String(seenTs)).catch(() => {});
  } catch (e) {}
  emit();
}

export function clearNotifs() {
  notifs = [];
  persist();
  emit();
}

export function setDnd(v) {
  dnd = !!v;
  try {
    AsyncStorage.setItem(DND_KEY, dnd ? '1' : '0').catch(() => {});
  } catch (e) {}
  emit();
}

// ── Включённость категорий (экран уведомлений → ⚙) ──
export function getNotifCfg() {
  return { ...kindCfg };
}

export function setKindEnabled(kind, v) {
  if (!(kind in DEFAULT_CFG)) return;
  kindCfg = { ...kindCfg, [kind]: !!v };
  // Выключили категорию — сбрасываем её антиспам-ключи, чтобы при
  // повторном включении не молчало лишнее
  if (!v) {
    for (const key of Object.keys(lastPushAt)) {
      if (key.indexOf(kind + '|') === 0) delete lastPushAt[key];
    }
  }
  try {
    AsyncStorage.setItem(CFG_KEY, JSON.stringify(kindCfg)).catch(() => {});
  } catch (e) {}
  emit();
}

// React-хук для экранов: перерисовка при каждом пуше/просмотре
export function useNotifs() {
  const [snap, setSnap] = useState(() => ({ notifs, unread: unreadCount(), dnd, cfg: kindCfg }));
  useEffect(() => {
    const fn = (s) => setSnap({ notifs: s.notifs, unread: s.unread, dnd: s.dnd, cfg: s.cfg });
    listeners.add(fn);
    fn({ notifs, unread: unreadCount(), dnd });
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return snap;
}
