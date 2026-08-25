// ─────────────────────────────────────────────────────────
// Избранные камеры CCTV (модуль 16): список кодов строкой в
// AsyncStorage rc_cctv_fav_v1. Хранилище модульное — копия
// паттерна vendStore.js: экран читает через useCctvFavs(),
// звезда в справочнике «Другое → Камеры CCTV» тогглит.
// ─────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAV_KEY = 'rc_cctv_fav_v1';

let favs = null; // кэш вне React: ['OILRIG2DOCK', ...]
const favListeners = new Set();

function emitFavs() {
  const snap = favs || [];
  favListeners.forEach((fn) => {
    try {
      fn(snap);
    } catch (e) {}
  });
}

export async function loadCctvFavs() {
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

export async function toggleCctvFav(code) {
  const id = String(code);
  await loadCctvFavs();
  if ((favs || []).indexOf(id) >= 0) favs = favs.filter((x) => x !== id);
  else favs = [id, ...(favs || [])].slice(0, 30); // потолок — избранное должно быть избранным
  saveFavs();
  emitFavs();
}

export function isCctvFavSync(code) {
  return !!(favs && favs.indexOf(String(code)) >= 0);
}

export function useCctvFavs() {
  const [list, setList] = useState(favs || []);
  useEffect(() => {
    const fn = (s) => setList([...s]);
    favListeners.add(fn);
    loadCctvFavs().then(() => fn(favs || []));
    return () => {
      favListeners.delete(fn);
    };
  }, []);
  return list;
}
