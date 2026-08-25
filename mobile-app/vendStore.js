// ─────────────────────────────────────────────────────────
// Торговые автоматы: избранное по предметам + уведомления
// о появлении товара («перезакладка»). Избранное — список
// itemId строкой в AsyncStorage rc_vend_fav_v1; хранилище
// модульное, как notifStore/lookup-трекинг.
// Вотчер useVendingWatcher(vending) ставится один раз в App.js
// (вне вкладок — должен работать на любом экране): сравнивает
// снимки lv.vending и если любимый предмет появился в автомате,
// где его раньше не было — пушит kind:'shop' в центр уведомлений.
// Первый снимок после старта запоминается молча (иначе спам всем
// каталогом при каждом подключении).
// ─────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pushNotif } from './notifStore';
import { itemName } from './data/itemNames';

const FAV_KEY = 'rc_vend_fav_v1';

let favs = null; // кэш вне React: ['1253', ...] (itemId строкой)
const favListeners = new Set();

function emitFavs() {
  const snap = favs || [];
  favListeners.forEach((fn) => {
    try {
      fn(snap);
    } catch (e) {}
  });
}

export async function loadVendFavs() {
  if (favs) return favs;
  try {
    const raw = await AsyncStorage.getItem(FAV_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    favs = Array.isArray(parsed) ? parsed.map(String) : [];
  } catch (e) {
    favs = [];
  }
  return favs;
}

function saveFavs() {
  try {
    AsyncStorage.setItem(FAV_KEY, JSON.stringify(favs || [])).catch(() => {});
  } catch (e) {}
}

export async function toggleVendFav(itemId) {
  const id = String(itemId);
  await loadVendFavs();
  if ((favs || []).indexOf(id) >= 0) favs = favs.filter((x) => x !== id);
  else favs = [id, ...(favs || [])].slice(0, 50); // потолок — чтобы поиск не превращался в свалка
  saveFavs();
  emitFavs();
}

export function isVendFavSync(itemId) {
  return !!(favs && favs.indexOf(String(itemId)) >= 0);
}

// Подписка для UI (карточка «Избранное» на Карте)
export function useVendFavs() {
  const [list, setList] = useState(favs || []);
  useEffect(() => {
    const fn = (s) => setList([...s]);
    favListeners.add(fn);
    loadVendFavs().then(() => fn(favs || []));
    return () => {
      favListeners.delete(fn);
    };
  }, []);
  return list;
}

// ── Вотчер перезакладок ──
// prevSnapshot: Map «id автомата» → Set(itemIds). Сравнение по
// содержимому, а не по ссылкам — Firebase-поллинг даёт новые
// объекты каждые ~4 с при том же наборе товаров.
const prevSnapRef = { current: null };

function snapshotVending(vending) {
  const snap = new Map();
  for (const m of vending || []) {
    if (!m || m.id == null) continue;
    const set = new Set();
    for (const o of m.orders || []) {
      if (o && o.itemId != null) set.add(String(o.itemId));
    }
    snap.set(String(m.id), set);
  }
  return snap;
}

export function useVendingWatcher(vending, lang) {
  useEffect(() => {
    if (!Array.isArray(vending)) return;
    let alive = true;
    loadVendFavs().then((favList) => {
      if (!alive) return;
      const curr = snapshotVending(vending);
      const prev = prevSnapRef.current;
      prevSnapRef.current = curr;
      // Любимое пустое или это первый снимок — только запомнить
      if (!prev || !favList.length) return;
      for (const itemId of favList) {
        for (const [mid, set] of curr.entries()) {
          if (!set.has(itemId)) continue;
          const before = prev.get(mid);
          if (before && before.has(itemId)) continue; // уже лежал — не новость
          const m = (vending || []).find((x) => String(x.id) === mid);
          const order = m && (m.orders || []).find((o) => String(o.itemId) === itemId);
          if (!m || !order) continue;
          const nmRu = itemName(itemId, 'ru');
          const nmEn = itemName(itemId, 'en');
          const cur = order.currencyId != null ? itemName(order.currencyId, lang) : '';
          const where = m.name ? '«' + m.name + '»' : '';
          pushNotif({
            kind: 'shop',
            important: false,
            title: { ru: 'В продаже: ' + nmRu, en: 'In stock: ' + nmEn },
            body: {
              ru: (where || 'автомат') + ' · ' + order.amount + ' шт по ' + order.cost + ' ' + cur,
              en: (where || 'machine') + ' · x' + order.amount + ' for ' + order.cost + ' ' + cur,
            },
          });
        }
      }
    });
    return () => {
      alive = false;
    };
  }, [vending, lang]);
}
