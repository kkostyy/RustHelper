// ─────────────────────────────────────────────────────────
// Слой живых данных — перенос из веб-версии RustCompanion.jsx.
// Три источника: демо / Firebase RTDB по REST / прямой Rust+
// (WebSocket + самодельный protobuf-кодек без зависимостей).
// Отличия от браузера учтены: свои UTF-8 и base64 хелперы
// (в Hermes нет гарантированных TextEncoder/btoa),
// AsyncStorage вместо localStorage, эмодзи вместо svg-иконок.
// Выбор источника и язык хранятся в AsyncStorage.
// ─────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { eventPalette } from './theme';
import { pushNotif } from './notifStore';

const SOURCE_KEY = 'rc_source_v1';
const LANG_KEY = 'rc_lang_v1';
const RUSTPLUS_TOKEN_KEY = 'rc_rustplus_token_v1';
const RUSTPLUS_PLAYER_KEY = 'rc_rustplus_player_v1';

export async function loadRustPlusToken() {
  try {
    return await AsyncStorage.getItem(RUSTPLUS_TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export async function storeRustPlusToken(token) {
  try {
    await AsyncStorage.setItem(RUSTPLUS_TOKEN_KEY, token);
  } catch (e) {
    /* приватный режим */
  }
}

export async function loadRustPlusPlayer() {
  try {
    return await AsyncStorage.getItem(RUSTPLUS_PLAYER_KEY);
  } catch (e) {
    return null;
  }
}

export async function storeRustPlusPlayer(playerId) {
  try {
    await AsyncStorage.setItem(RUSTPLUS_PLAYER_KEY, playerId);
  } catch (e) {
    /* приватный режим */
  }
}

export async function clearRustPlusAuth() {
  try {
    await AsyncStorage.multiRemove([RUSTPLUS_TOKEN_KEY, RUSTPLUS_PLAYER_KEY]);
  } catch (e) {
    /* не критично */
  }
}

export async function loadStoredSource() {
  try {
    const raw = await AsyncStorage.getItem(SOURCE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.mode ? parsed : null;
  } catch (e) {
    return null;
  }
}

export async function storeSource(src) {
  try {
    await AsyncStorage.setItem(SOURCE_KEY, JSON.stringify(src));
  } catch (e) {
    /* приватный режим — просто не сохраняем */
  }
}

export async function loadStoredLang() {
  try {
    const raw = await AsyncStorage.getItem(LANG_KEY);
    return raw === 'en' ? 'en' : 'ru';
  } catch (e) {
    return 'ru';
  }
}

export async function storeLang(lang) {
  try {
    await AsyncStorage.setItem(LANG_KEY, lang);
  } catch (e) {
    /* не критично */
  }
}

// ── Кастомизация: фон приложения (своё фото + затемнение) ──
// Фото берём из image-picker сразу в base64 (уменьшенное до 1440px,
// jpeg q0.7 — ~200-500 КБ), иначе content:// URI протухнет после
// перезапуска приложения. Храним как data-URI в AsyncStorage.
const BG_KEY = 'rc_bg_v1';
export async function loadStoredBg() {
  try {
    const raw = await AsyncStorage.getItem(BG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.uri ? parsed : null; // { uri, dim: 0..0.85 }
  } catch (e) {
    return null;
  }
}
export async function storeBg(bg) {
  try {
    await AsyncStorage.setItem(BG_KEY, JSON.stringify(bg));
  } catch (e) {
    /* крупная картинка может не влезть в AsyncStorage — фон просто
       не переживёт перезапуск, но работать будет */
  }
}
export async function clearStoredBg() {
  try {
    await AsyncStorage.removeItem(BG_KEY);
  } catch (e) {}
}

// ── Конструктор главного экрана: какие виджеты показывать ──
const DASH_KEY = 'rc_dash_v1';
export const DEFAULT_DASH = { minimap: true, team: true, feed: true };
export async function loadStoredDash() {
  try {
    const raw = await AsyncStorage.getItem(DASH_KEY);
    if (!raw) return { ...DEFAULT_DASH };
    const parsed = JSON.parse(raw);
    // недостающие ключи добираем дефолтом — старые сохранения остаются валидными
    return { ...DEFAULT_DASH, ...(parsed || {}) };
  } catch (e) {
    return { ...DEFAULT_DASH };
  }
}
export async function storeDash(dash) {
  try {
    await AsyncStorage.setItem(DASH_KEY, JSON.stringify(dash));
  } catch (e) {}
}

// Время ЧЧ:ММ без Intl — в старых сборках Hermes его может не быть.
// Формат 24ч/12ч/авто выбирается в Настройках ('24' | '12' | 'auto',
// авто = 24ч) и хранится в AsyncStorage.
const TIMEFMT_KEY = 'rc_timefmt_v1';
let timeFmt = '24';
export const getTimeFmt = () => timeFmt;
export async function loadStoredTimeFmt() {
  try {
    const v = await AsyncStorage.getItem(TIMEFMT_KEY);
    if (v === '12' || v === '24' || v === 'auto') timeFmt = v;
  } catch (e) {
    /* дефолт 24ч */
  }
}
export async function storeTimeFmt(v) {
  timeFmt = v === '12' ? '12' : v === 'auto' ? 'auto' : '24';
  try {
    await AsyncStorage.setItem(TIMEFMT_KEY, timeFmt);
  } catch (e) {
    /* не критично */
  }
}

const pad2 = (n) => (n < 10 ? '0' + n : '' + n);
export const hhmm = (ts) => {
  try {
    const d = new Date(ts);
    const m = pad2(d.getMinutes());
    const h = d.getHours();
    if (timeFmt === '12') {
      const ap = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 === 0 ? 12 : h % 12;
      return h12 + ':' + m + ' ' + ap;
    }
    return pad2(h) + ':' + m;
  } catch (e) {
    return '';
  }
};

// Единый стиль игровых событий для обоих провайдеров (иконка — эмодзи)
export const EVENT_STYLE = {
  patrol_helicopter: { color: eventPalette.red, icon: '🚁', label: { ru: 'Патрульный вертолёт', en: 'Patrol Helicopter' } },
  cargo_ship: { color: eventPalette.teal, icon: '🚢', label: { ru: 'Cargo Ship', en: 'Cargo Ship' } },
  ch47: { color: eventPalette.orange, icon: '✈️', label: { ru: 'Чинук', en: 'Chinook' } },
  crate: { color: eventPalette.yellow, icon: '📦', label: { ru: 'Крейт', en: 'Locked Crate' } },
};

// ── Лог смертей тиммейтов (модуль 3) ──
// Оба провайдера опрашивают состав команды; сравнивая isAlive между
// соседними опросами, ловим смерти и респавны. Координаты — последние
// известные (у мёртвого они замирают на месте гибели).
export function teamLifeEvents(curr, prev) {
  if (!prev || !prev.length) return [];
  const byId = new Map(prev.map((m) => [String(m.steamId), m]));
  const out = [];
  for (const m of curr) {
    const was = byId.get(String(m.steamId));
    if (!was) continue;
    if (was.isAlive && m.isAlive === false) out.push({ kind: 'death', name: m.name, x: m.x, y: m.y });
    else if (was.isAlive === false && m.isAlive === true) out.push({ kind: 'respawn', name: m.name, x: m.x, y: m.y });
  }
  return out;
}

function prependLifeEvents(setLog, events) {
  if (!events || !events.length) return;
  const now = Date.now();
  // Смерти/респавны дублируются в центр уведомлений (смерть — важная)
  events.forEach((e) => {
    pushNotif({
      kind: 'team',
      important: e.kind === 'death',
      title:
        e.kind === 'death'
          ? { ru: e.name + ' погиб', en: e.name + ' died' }
          : { ru: e.name + ' возродился', en: e.name + ' respawned' },
    });
  });
  setLog((dlog) =>
    [
      ...events.map((e, i) => ({
        id: now + '-' + i + '-' + Math.random(),
        ts: now,
        time: hhmm(now),
        kind: e.kind,
        name: e.name,
        x: e.x,
        y: e.y,
      })),
      ...dlog,
    ].slice(0, 50)
  );
}

// Вход/выход тиммейтов — только в центр уведомлений, в лог смертей
// их не пишем (там места гибели, а не состав команды).
export function teamMembershipEvents(curr, prev) {
  if (!prev || !prev.length) return [];
  const prevIds = new Set(prev.map((m) => String(m.steamId)));
  const currIds = new Set(curr.map((m) => String(m.steamId)));
  const out = [];
  for (const m of curr) {
    if (m.steamId && !prevIds.has(String(m.steamId))) out.push({ kind: 'join', name: m.name });
  }
  for (const m of prev) {
    if (m.steamId && !currIds.has(String(m.steamId))) out.push({ kind: 'leave', name: m.name });
  }
  return out;
}

function notifyMembership(events) {
  (events || []).forEach((e) => {
    pushNotif({
      kind: 'team',
      important: false,
      title:
        e.kind === 'join'
          ? { ru: e.name + ' вошёл в команду', en: e.name + ' joined the team' }
          : { ru: e.name + ' вышел из команды', en: e.name + ' left the team' },
    });
  });
}

// ── Мини-кодек protobuf: подмножество rustplus.proto ──
// Номера полей зафиксированы протоколом Rust+, менять нельзя.
// uint64 (steamId/playerId) считаем через BigInt — они больше 2^53.

function pbVarintBytes(value) {
  let v = typeof value === 'bigint' ? value : BigInt(Math.trunc(Number(value) || 0));
  const out = [];
  do {
    let b = Number(v & 0x7fn);
    v >>= 7n;
    if (v > 0n) b |= 0x80;
    out.push(b);
  } while (v > 0n);
  return out;
}

function pbFieldVarint(num, value) {
  return [...pbVarintBytes((num << 3) | 0), ...pbVarintBytes(value)];
}

function pbFieldLen(num, bytes) {
  const arr = bytes instanceof Uint8Array ? Array.from(bytes) : bytes;
  return [...pbVarintBytes((num << 3) | 2), ...pbVarintBytes(arr.length), ...arr];
}

// UTF-8 вручную: TextEncoder/TextDecoder в Hermes не гарантированы
function utf8Bytes(str) {
  const out = [];
  for (let i = 0; i < str.length; i++) {
    let cp = str.codePointAt(i);
    if (cp > 0xffff) i++; // вторая половина суррогатной пары
    if (cp < 0x80) out.push(cp);
    else if (cp < 0x800) out.push(0xc0 | (cp >> 6), 0x80 | (cp & 63));
    else if (cp < 0x10000) out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
    else out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
  }
  return new Uint8Array(out);
}

function utf8ToStr(u8) {
  let out = '';
  let i = 0;
  while (i < u8.length) {
    const b = u8[i];
    let cp;
    if (b < 0x80) {
      cp = b;
      i += 1;
    } else if (b < 0xe0) {
      cp = ((b & 0x1f) << 6) | (u8[i + 1] & 0x3f);
      i += 2;
    } else if (b < 0xf0) {
      cp = ((b & 0x0f) << 12) | ((u8[i + 1] & 0x3f) << 6) | (u8[i + 2] & 0x3f);
      i += 3;
    } else {
      cp = ((b & 0x07) << 18) | ((u8[i + 1] & 0x3f) << 12) | ((u8[i + 2] & 0x3f) << 6) | (u8[i + 3] & 0x3f);
      i += 4;
    }
    if (cp > 0xffff) {
      cp -= 0x10000;
      out += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
    } else {
      out += String.fromCharCode(cp);
    }
  }
  return out;
}

function pbFieldStr(num, str) {
  return pbFieldLen(num, utf8Bytes(str));
}

// Разбор буфера в список полей { num, wire, varint?, bytes? }
function pbDecode(buf) {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const fields = [];
  let i = 0;
  const readVarint = () => {
    let val = 0n;
    let shift = 0n;
    for (;;) {
      if (i >= u8.length) throw new Error('protobuf: unexpected end');
      const b = u8[i++];
      val |= BigInt(b & 0x7f) << shift;
      if (!(b & 0x80)) return val;
      shift += 7n;
    }
  };
  while (i < u8.length) {
    const key = readVarint();
    const num = Number(key >> 3n);
    const wire = Number(key & 7n);
    if (wire === 0) {
      fields.push({ num, wire, varint: readVarint() });
    } else if (wire === 2) {
      const len = Number(readVarint());
      if (i + len > u8.length) throw new Error('protobuf: bad length');
      fields.push({ num, wire, bytes: u8.subarray(i, i + len) });
      i += len;
    } else if (wire === 5) {
      fields.push({ num, wire, bytes: u8.subarray(i, i + 4) });
      i += 4;
    } else if (wire === 1) {
      fields.push({ num, wire, bytes: u8.subarray(i, i + 8) });
      i += 8;
    } else {
      throw new Error('protobuf: wire type ' + wire);
    }
  }
  return fields;
}

function pbFind(fields, num) {
  for (const f of fields) if (f.num === num) return f;
  return null;
}
function pbFindAll(fields, num) {
  return fields.filter((f) => f.num === num);
}
function pbSub(fields, num) {
  const f = pbFind(fields, num);
  return f && f.bytes ? pbDecode(f.bytes) : [];
}
function pbAsStr(fields, num) {
  const f = pbFind(fields, num);
  return f && f.bytes ? utf8ToStr(f.bytes) : '';
}
function pbAsBig(fields, num) {
  const f = pbFind(fields, num);
  return f && f.varint != null ? f.varint : 0n;
}
function pbAsBool(fields, num) {
  const f = pbFind(fields, num);
  return !!(f && f.varint != null && f.varint > 0n);
}
function pbAsFlt(fields, num) {
  const f = pbFind(fields, num);
  if (!f || !f.bytes || f.bytes.length < 4) return 0;
  return new DataView(f.bytes.buffer, f.bytes.byteOffset, f.bytes.byteLength).getFloat32(0, true);
}

// base64 вручную: btoa в Hermes может отсутствовать, а карта приходит JPG-байтами
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function bytesToB64(u8) {
  let out = '';
  for (let i = 0; i < u8.length; i += 3) {
    const b0 = u8[i];
    const b1 = u8[i + 1];
    const b2 = u8[i + 2];
    out += B64_CHARS[b0 >> 2];
    out += B64_CHARS[((b0 & 3) << 4) | ((b1 == null ? 0 : b1) >> 4)];
    out += b1 == null ? '=' : B64_CHARS[((b1 & 15) << 2) | ((b2 == null ? 0 : b2) >> 6)];
    out += b2 == null ? '=' : B64_CHARS[b2 & 63];
  }
  return out;
}

// Номера полей верхнего уровня (rustplus.proto): AppRequest / AppResponse / AppBroadcast
const RP_FIELD = {
  // AppRequest
  seq: 1, playerId: 2, playerToken: 3, entityId: 4,
  getInfo: 8, getMap: 10, getTeamInfo: 11, getTeamChat: 12, sendTeamMessage: 13,
  getEntityInfo: 14, setEntityValue: 15, getTime: 16, setSubscription: 17, getMapMarkers: 18,
  // AppResponse
  resSeq: 1, success: 4, error: 5, info: 6, map: 8, teamInfo: 9, teamChat: 10,
  entityInfo: 11, mapMarkers: 13,
  // AppBroadcast
  bcTeamChanged: 4, bcTeamMessage: 5, bcEntityChanged: 6,
};

// Типы маркеров карты (AppMarkerType) → ключ события в EVENT_STYLE.
// 2 = торговый автомат (VendingMachine) — обрабатывается отдельно в /vending.
const RP_MARKER_TYPE = { 4: 'ch47', 5: 'cargo_ship', 6: 'crate', 8: 'patrol_helicopter' };
const RP_MARKER_VENDING = 2;

// Игровое время (AppTime{day=1, time=2 float-часы}) в человекочастный вид
export function formatGameTime(gameDay, gameTimeH) {
  if (gameDay == null || gameTimeH == null) return null;
  const h = Math.floor(gameTimeH % 24);
  const m = Math.floor(((gameTimeH % 24) - h) * 60);
  const dayNight = gameTimeH >= 7 && gameTimeH < 19 ? '☀️' : '🌙';
  return { day: gameDay, hhmm: pad2(h) + ':' + pad2(m), icon: dayNight };
}

// ── Провайдер: прямой Rust+ через WebSocket ──
// Каждый запрос несёт seq + playerId + playerToken (отдельного handshake нет).
// Запросы сериализуются с паузой ≥1100 мс — сервер рейтлимитит частые запросы.
function useRustPlusDirect(enabled, cfg) {
  const [status, setStatus] = useState('idle'); // idle|connecting|connected|error
  const [error, setError] = useState(null);
  const [server, setServer] = useState(null);
  const [team, setTeam] = useState([]);
  const [mapData, setMapData] = useState(null);
  const [activeEvents, setActiveEvents] = useState([]);
  const [alarmLog, setAlarmLog] = useState([]);
  const [devices, setDevices] = useState({});
  const [chat, setChat] = useState([]);
  const [deathLog, setDeathLog] = useState([]);
  const [vending, setVending] = useState([]);

  const wsRef = useRef(null);
  const seqRef = useRef(0);
  const pendRef = useRef(new Map()); // seq -> {resolve, reject}
  const gateRef = useRef(Promise.resolve());
  const sendRef = useRef(null); // (pairs, entityId) => Promise<AppResponse>
  const markersRef = useRef(null);
  const prevValRef = useRef({});
  const prevTeamRef = useRef(null); // прошлый срез команды для диффа смертей
  const entitiesRef = useRef([]);
  const mapGotRef = useRef(false);

  // Подключённый пользователь (из TeamInfo) — для диагностики совпадения SteamID
  const [mySteamId, setMySteamId] = useState(null);

  useEffect(() => {
    const steamIdStr = String((cfg && cfg.steamId) || '').trim();
    const tokenStr = String((cfg && cfg.token) || '').trim();
    if (!enabled || !cfg || !cfg.ip || !/^\d+$/.test(steamIdStr) || !tokenStr) {
      setStatus('idle');
      setError(null);
      return undefined;
    }

    // Этот steamIdStr — из настроек; после коннекта сравним с реальным из TeamInfo
    const configuredSteamId = steamIdStr;

    let disposed = false;
    const timers = [];
    markersRef.current = null;
    mapGotRef.current = false;
    prevValRef.current = {};
    prevTeamRef.current = null;

    let entities = [];
    try {
      entities = JSON.parse(cfg.entitiesJson || '[]');
    } catch (e) {
      entities = [];
    }
    entitiesRef.current = Array.isArray(entities) ? entities.filter((en) => en && en.id != null) : [];

    setStatus('connecting');
    setError(null);

    let steamIdBig;
    try {
      steamIdBig = BigInt(steamIdStr);
    } catch (e) {
      setStatus('error');
      setError('SteamID должен быть числом (SteamID64)');
      return undefined;
    }
    const tokenBig = BigInt(parseInt(tokenStr, 10) || 0);

    let ws;
    try {
      ws = new WebSocket('ws://' + cfg.ip + ':' + (cfg.port || 28082));
    } catch (e) {
      setStatus('error');
      setError('Не удалось открыть WebSocket: ' + (e && e.message ? e.message : e));
      return undefined;
    }
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    const pushLog = (textRu, textEn, important) => {
      if (disposed) return;
      setAlarmLog((prev) =>
        [
          {
            id: Date.now() + '-' + Math.random(),
            ts: Date.now(),
            time: hhmm(Date.now()),
            important: !!important,
            text: { ru: textRu, en: textEn },
          },
          ...prev,
        ].slice(0, 50)
      );
    };

    // AppTeamInfo{leaderSteamId=1, members=2}; Member{steamId=1,name=2,x=3,y=4,isOnline=5,isAlive=7}
    const applyTeamInfo = (tf) => {
      const leader = pbAsBig(tf, 1).toString();
      const palette = [eventPalette.blue, eventPalette.green, eventPalette.purple, eventPalette.orange, eventPalette.teal, eventPalette.yellow];
      const members = pbFindAll(tf, 2).map((mf, idx) => {
        const m = pbDecode(mf.bytes);
        const sid = pbAsBig(m, 1).toString();
        return {
          steamId: sid,
          name: pbAsStr(m, 2),
          x: pbAsFlt(m, 3),
          y: pbAsFlt(m, 4),
          isOnline: pbAsBool(m, 5),
          isAlive: pbAsBool(m, 7),
          color: palette[idx % palette.length],
          leader: sid === leader,
        };
      });
      if (!disposed) {
        const prev = prevTeamRef.current;
        prevTeamRef.current = members;
        setTeam(members);
        prependLifeEvents(setDeathLog, teamLifeEvents(members, prev));
        notifyMembership(teamMembershipEvents(members, prev));

        // Находим себя в команде (по configuredSteamId) и сохраняем mySteamId для диагностики
        const me = members.find((m) => m.steamId === configuredSteamId);
        if (me && me.steamId) {
          setMySteamId(me.steamId);
        }
      }
    };

    // AppInfo{name=1,mapSize=5,wipeTime=6,players=7,maxPlayers=8,queuedPlayers=9,seed=10}
    const applyInfo = (inf) => {
      if (disposed) return;
      setServer({
        name: pbAsStr(inf, 1),
        playersN: Number(pbAsBig(inf, 7)),
        maxPlayers: Number(pbAsBig(inf, 8)),
        queued: Number(pbAsBig(inf, 9)),
        mapSizeM: Number(pbAsBig(inf, 5)),
        wipeTime: Number(pbAsBig(inf, 6)),
        seed: pbFind(inf, 10) ? String(Number(pbAsBig(inf, 10))) : '',
      });
    };

    // AppTeamMessage{steamId=1,name=2,message=3,color=4,time=5}
    const pushChatMsgs = (msgFields) => {
      if (disposed || !msgFields) return;
      const add = msgFields
        .map((mf) => {
          const m = pbDecode(mf.bytes);
          const sid = pbAsBig(m, 1).toString();
          return {
            key: sid + ':' + pbAsBig(m, 5) + ':' + pbAsStr(m, 3),
            steamId: sid,
            author: pbAsStr(m, 2),
            text: pbAsStr(m, 3),
            mine: sid === steamIdStr,
            ts: Number(pbAsBig(m, 5)) * 1000,
          };
        })
        .filter((c) => c.text);
      if (!add.length) return;
      setChat((prev) => {
        const seen = new Set(prev.map((c) => c.key));
        return [...prev, ...add.filter((c) => !seen.has(c.key))].slice(-100);
      });
    };

    // AppEntityPayload{value=1,items=2,capacity=3,hasProtection=4,protectionExpiry=5}
    const handleEntityPayload = (entId, pf) => {
      const conf = entitiesRef.current.find((e) => String(e.id) === String(entId));
      const key = String(entId);
      const nowOn = pbAsBool(pf, 1);
      const wasOn = prevValRef.current[key] === true;
      prevValRef.current[key] = nowOn;
      const items = pbFindAll(pf, 2).map((itf) => {
        const it = pbDecode(itf.bytes); // Item{itemId=1,quantity=2,itemIsBlueprint=3}
        return { itemId: Number(pbAsBig(it, 1)), quantity: Number(pbAsBig(it, 2)), isBlueprint: pbAsBool(it, 3) };
      });
      if (!disposed) {
        setDevices((prev) => ({
          ...prev,
          [key]: {
            id: key,
            name: (conf && conf.name) || (prev[key] && prev[key].name) || 'Устройство ' + entId,
            type: (conf && conf.type) || (prev[key] && prev[key].type) || 'switch',
            value: nowOn,
            capacity: Number(pbAsBig(pf, 3)) || null,
            hasProtection: pbAsBool(pf, 4),
            protectionExpiry: Number(pbAsBig(pf, 5)) || 0,
            items,
          },
        }));
      }
      if (conf && conf.type === 'alarm' && nowOn && !wasOn) {
        pushLog('Тревога «' + conf.name + '» сработала', 'Alarm "' + conf.name + '" triggered', true);
        pushNotif({
          kind: 'alarm',
          important: true,
          title: { ru: 'Тревога «' + conf.name + '» сработала', en: 'Alarm "' + conf.name + '" triggered' },
        });
      }
    };

    // AppMapMarkers{markers=1}; AppMarker{id=1,type=2,x=3,y=4,...,name=10,sellOrders=11}
    // — diff событий как в pc-client; заодно собираем торговые автоматы (type=2)
    // в live.vending: { id, name, x, y, orders:[{itemId,amount,currencyId,cost}] }
    const applyMarkers = (mf) => {
      const current = new Map();
      const vendingList = [];
      pbFindAll(mf, 1).forEach((mkf) => {
        const mk = pbDecode(mkf.bytes);
        const t = Number(pbAsBig(mk, 2));
        if (RP_MARKER_TYPE[t]) current.set(Number(pbAsBig(mk, 1)), { type: t, x: pbAsFlt(mk, 3), y: pbAsFlt(mk, 4) });
        if (t === RP_MARKER_VENDING) {
          vendingList.push({
            id: String(pbAsBig(mk, 1)),
            name: pbAsStr(mk, 10),
            x: pbAsFlt(mk, 3),
            y: pbAsFlt(mk, 4),
            orders: pbFindAll(mk, 11).map((of) => {
              const o = pbDecode(of.bytes); // AppSellOrder{itemId=1,amount=2,currencyId=3,cost=4}
              return {
                itemId: Number(pbAsBig(o, 1)),
                amount: Number(pbAsBig(o, 2)),
                currencyId: Number(pbAsBig(o, 3)),
                cost: Number(pbAsBig(o, 4)),
              };
            }),
          });
        }
      });
      if (!disposed) setVending(vendingList);
      const styleOf = (t) => EVENT_STYLE[RP_MARKER_TYPE[t]] || {};
      const activeList = Array.from(current.entries()).map(([id, m]) => ({
        id,
        key: RP_MARKER_TYPE[m.type],
        worldX: m.x,
        worldY: m.y,
        ...styleOf(m.type),
      }));
      if (!disposed) setActiveEvents(activeList);
      const prev = markersRef.current;
      if (prev) {
        current.forEach((m, id) => {
          if (!prev.has(id)) {
            const s = styleOf(m.type);
            // хели и карго — важные (подсветка в ленте), остальное — обычные
            const important = m.type === 8 || m.type === 5;
            if (s.label) {
              pushLog(s.label.ru + ' появился на карте', s.label.en + ' appeared', important);
              pushNotif({
                kind: 'event',
                important,
                title: { ru: s.label.ru + ' появился на карте', en: s.label.en + ' appeared' },
              });
            }
          }
        });
        prev.forEach((m, id) => {
          if (!current.has(id)) {
            const s = styleOf(m.type);
            if (s.label) {
              pushLog(s.label.ru + ' исчез с карты', s.label.en + ' disappeared', false);
              pushNotif({
                kind: 'event',
                important: false,
                title: { ru: s.label.ru + ' исчез с карты', en: s.label.en + ' disappeared' },
              });
            }
          }
        });
      }
      markersRef.current = current;
    };

    // Отправка с рейтлимитом: цепочка промисов, пауза 1100 мс после каждого запроса
    const rpSendRaw = (pairs, entityId) =>
      new Promise((resolve, reject) => {
        const w = wsRef.current;
        if (!w || w.readyState !== 1) {
          reject(new Error('нет подключения'));
          return;
        }
        const seq = ++seqRef.current;
        let body = [
          ...pbFieldVarint(RP_FIELD.seq, seq),
          ...pbFieldVarint(RP_FIELD.playerId, steamIdBig),
          ...pbFieldVarint(RP_FIELD.playerToken, tokenBig),
        ];
        if (entityId != null) body = body.concat(pbFieldVarint(RP_FIELD.entityId, entityId));
        pairs.forEach(([num, bytes]) => {
          body = body.concat(pbFieldLen(num, bytes));
        });
        pendRef.current.set(seq, { resolve, reject });
        setTimeout(() => {
          if (pendRef.current.has(seq)) {
            pendRef.current.delete(seq);
            reject(new Error('сервер не ответил (таймаут)'));
          }
        }, 15000);
        try {
          w.send(new Uint8Array(body));
        } catch (e) {
          pendRef.current.delete(seq);
          reject(e);
        }
      });

    const rpSend = (pairs, entityId) => {
      const run = gateRef.current.then(() => rpSendRaw(pairs, entityId));
      const pause = new Promise((r) => setTimeout(r, 1100));
      gateRef.current = run.then(
        () => pause,
        () => pause
      );
      return run;
    };
    sendRef.current = rpSend;

    const fetchMapOnce = async () => {
      if (mapGotRef.current) return;
      try {
        const r = await rpSend([[RP_FIELD.getMap, []]]);
        const mfF = pbFind(r, RP_FIELD.map);
        if (!mfF || !mfF.bytes || disposed) return;
        const mp = pbDecode(mfF.bytes); // AppMap{width=1,height=2,jpgImage=3,monuments=5}
        const img = pbFind(mp, 3);
        const monuments = pbFindAll(mp, 5).map((mo) => {
          const o = pbDecode(mo.bytes); // Monument{token=1,x=2,y=3}
          return { token: pbAsStr(o, 1), x: pbAsFlt(o, 2), y: pbAsFlt(o, 3) };
        });
        if (img && img.bytes && img.bytes.length) {
          setMapData({
            image: 'data:image/jpeg;base64,' + bytesToB64(img.bytes),
            width: Number(pbAsBig(mp, 1)) || 3000,
            height: Number(pbAsBig(mp, 2)) || 3000,
            monuments,
          });
          mapGotRef.current = true;
        }
      } catch (e) {
        /* повторим на следующем тике info */
      }
    };

    ws.onopen = () => {
      if (disposed) return;
      setStatus('connected');

      (async () => {
        try {
          const r = await rpSend([[RP_FIELD.getInfo, []]]);
          const f = pbSub(r, RP_FIELD.info);
          if (f.length) applyInfo(f);
        } catch (e) {
          /* нет инфо — не критично */
        }
        await fetchMapOnce();
        try {
          const r = await rpSend([[RP_FIELD.getTeamChat, []]]);
          const tc = pbSub(r, RP_FIELD.teamChat);
          if (tc.length) pushChatMsgs(pbFindAll(tc, 1));
        } catch (e) {
          /* чат может быть пуст */
        }
        for (const en of entitiesRef.current) {
          try {
            await rpSend([[RP_FIELD.setSubscription, pbFieldVarint(1, 1)]], Number(en.id));
          } catch (e) {
            /* пропускаем */
          }
          try {
            const r = await rpSend([[RP_FIELD.getEntityInfo, []]], Number(en.id));
            const ei = pbSub(r, RP_FIELD.entityInfo);
            const pf = ei.length ? pbFind(ei, 3) : null;
            if (pf && pf.bytes) handleEntityPayload(en.id, pbDecode(pf.bytes));
          } catch (e) {
            /* пропускаем */
          }
        }
        try {
          const r = await rpSend([[RP_FIELD.getTeamInfo, []]]);
          const tf = pbSub(r, RP_FIELD.teamInfo);
          if (tf.length) applyTeamInfo(tf);
        } catch (e) {
          /* придёт по таймеру */
        }
      })();

      timers.push(
        setInterval(async () => {
          try {
            const r = await rpSend([[RP_FIELD.getTeamInfo, []]]);
            const tf = pbSub(r, RP_FIELD.teamInfo);
            if (tf.length) applyTeamInfo(tf);
          } catch (e) {
            /* пропущенный тик */
          }
        }, 5000)
      );
      timers.push(
        setInterval(async () => {
          try {
            const r = await rpSend([[RP_FIELD.getMapMarkers, []]]);
            const mf = pbSub(r, RP_FIELD.mapMarkers);
            if (mf.length) applyMarkers(mf);
          } catch (e) {
            /* пропущенный тик */
          }
        }, 15000)
      );
      timers.push(
        setInterval(async () => {
          try {
            const r = await rpSend([[RP_FIELD.getInfo, []]]);
            const inf = pbSub(r, RP_FIELD.info);
            if (inf.length) applyInfo(inf);
          } catch (e) {
            /* пропущенный тик */
          }
          await fetchMapOnce();
        }, 60000)
      );
      // Игровое время: AppResponse.time=14 → AppTime{day=1,time=2 float}
      timers.push(
        setInterval(async () => {
          try {
            const r = await rpSend([[RP_FIELD.getTime, []]]);
            if (disposed) return;
            const tf = pbFind(r, 14);
            if (!tf || !tf.bytes) return;
            const t = pbDecode(tf.bytes);
            setServer((prev) =>
              prev
                ? { ...prev, gameDay: Number(pbAsBig(t, 1)) || 0, gameTimeH: pbAsFlt(t, 2) }
                : prev
            );
          } catch (e) {
            /* пропущенный тик */
          }
        }, 300000)
      );
    };

    ws.onmessage = (ev) => {
      let msg;
      try {
        msg = pbDecode(new Uint8Array(ev.data));
      } catch (e) {
        return;
      }
      // AppMessage{response=1, broadcast=2}
      const respF = pbFind(msg, 1);
      if (respF && respF.bytes) {
        const r = pbDecode(respF.bytes);
        const seq = Number(pbAsBig(r, RP_FIELD.resSeq));
        const p = pendRef.current.get(seq);
        if (p) {
          pendRef.current.delete(seq);
          const errF = pbFind(r, RP_FIELD.error);
          if (errF && errF.bytes) p.reject(new Error(pbAsStr(pbDecode(errF.bytes), 1)));
          else p.resolve(r);
        }
      }
      const bcastF = pbFind(msg, 2);
      if (bcastF && bcastF.bytes) {
        const b = pbDecode(bcastF.bytes);
        const tch = pbFind(b, RP_FIELD.bcTeamChanged);
        if (tch && tch.bytes) {
          const teamChanged = pbDecode(tch.bytes); // AppTeamChanged{playerId=1,teamInfo=2}
          const tf = pbFind(teamChanged, 2);
          if (tf && tf.bytes) applyTeamInfo(pbDecode(tf.bytes));
        }
        const tm = pbFind(b, RP_FIELD.bcTeamMessage);
        if (tm && tm.bytes) {
          const nm = pbDecode(tm.bytes); // AppNewTeamMessage{message=1}
          const mf = pbFind(nm, 1);
          if (mf && mf.bytes) pushChatMsgs([mf]);
        }
        const ec = pbFind(b, RP_FIELD.bcEntityChanged);
        if (ec && ec.bytes) {
          const ech = pbDecode(ec.bytes); // AppEntityChanged{entityId=1,payload=2}
          const entId = Number(pbAsBig(ech, 1));
          const pf = pbFind(ech, 2);
          if (pf && pf.bytes) handleEntityPayload(entId, pbDecode(pf.bytes));
        }
      }
    };

    ws.onclose = () => {
      if (disposed) return;
      setStatus('error');
      setError('Соединение с сервером закрылось. Проверь IP/порт и что сервер доступен.');
    };
    ws.onerror = () => {
      /* детали придут через onclose */
    };

    return () => {
      disposed = true;
      timers.forEach(clearInterval);
      pendRef.current.forEach((p) => p.reject(new Error('отключено')));
      pendRef.current.clear();
      sendRef.current = null;
      try {
        ws.onclose = null;
        ws.close();
      } catch (e) {
        /* уже закрыт */
      }
      wsRef.current = null;
    };
  }, [enabled, cfg && cfg.ip, cfg && cfg.port, cfg && cfg.steamId, cfg && cfg.token, cfg && cfg.entitiesJson]);

  const toggleSwitch = async (entityId, value) => {
    const key = String(entityId);
    setDevices((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key], value } } : prev));
    if (!sendRef.current) throw new Error('нет подключения');
    await sendRef.current([[RP_FIELD.setEntityValue, pbFieldVarint(1, value ? 1 : 0)]], Number(entityId)).catch(() => {});
  };

  const sendChat = async (text) => {
    if (!sendRef.current) throw new Error('нет подключения');
    await sendRef.current([[RP_FIELD.sendTeamMessage, pbFieldStr(1, String(text).slice(0, 128))]]);
  };

  return {
    modeTag: 'rustplus',
    status,
    error,
    server,
    team,
    mapData,
    activeEvents,
    alarmLog,
    devices,
    chat,
    deathLog,
    vending,
    mySteamId, // SteamID подключённого пользователя (из TeamInfo) — для диагностики
    actions: { toggleSwitch, sendChat, refreshMap: async () => {} },
  };
}

// ── Провайдер: Firebase Realtime Database по REST ──
// Читает те же узлы, что пишет pc-client; команды шлёт POST в /commands.
function useFirebaseLive(enabled, cfg) {
  const base = enabled && cfg && cfg.fbUrl ? String(cfg.fbUrl).trim().replace(/\/+$/, '') : '';
  const q = cfg && cfg.fbAuth ? 'auth=' + encodeURIComponent(String(cfg.fbAuth).trim()) : '';

  const [status, setStatus] = useState(enabled && base ? 'connecting' : 'idle');
  const [error, setError] = useState(null);
  const [server, setServer] = useState(null);
  const [team, setTeam] = useState([]);
  const [mapData, setMapData] = useState(null);
  const [activeEvents, setActiveEvents] = useState([]);
  const [alarmLog, setAlarmLog] = useState([]);
  const [devices, setDevices] = useState({});
  const [chat, setChat] = useState([]);
  const [deathLog, setDeathLog] = useState([]);
  const [vending, setVending] = useState([]);

  const prevTeamFbRef = useRef(null); // прошлый срез команды для диффа смертей
  const deviceAlarmsRef = useRef([]);
  const devicePrevValsRef = useRef({});
  const eventSeenRef = useRef(null); // ключи уже известных событий — пушим только новые
  const mySteamId = String((cfg && cfg.steamId) || '').trim();

  useEffect(() => {
    if (!enabled || !base) {
      setStatus('idle');
      setError(null);
      return undefined;
    }
    let disposed = false;
    const timers = [];
    prevTeamFbRef.current = null;
    deviceAlarmsRef.current = [];
    devicePrevValsRef.current = {};
    eventSeenRef.current = null;
    setStatus('connecting');
    setError(null);

    const getj = async (path) => {
      const res = await fetch(base + path + '.json' + (q ? '?' + q : '') + (q ? '&' : '?') + '_=' + Date.now());
      if (res.status === 401 || res.status === 403) {
        throw new Error('Доступ запрещён правилами базы. Открой правила чтения для теста или впиши секрет базы в поле Auth.');
      }
      if (!res.ok) throw new Error('HTTP ' + res.status + ' от Firebase');
      return res.json();
    };

    const tick = async () => {
      try {
        const [st, tm, dv, ev, sv, ch, vn] = await Promise.all([
          getj('/client_status'),
          getj('/team'),
          getj('/devices'),
          getj('/events'),
          getj('/server_info').catch(() => null),
          getj('/chat').catch(() => null),
          getj('/vending').catch(() => null),
        ]);
        if (disposed) return;

        if (!st || !st.status) {
          setStatus('offline');
          setError('pc-client не отвечает: /client_status пуст. Проверь, что pc-client запущен и пишет в эту базу.');
        } else {
          setStatus(st.status === 'connected' ? 'connected' : 'offline');
          setError(st.status === 'connected' ? null : 'pc-client виден, но не подключён к серверу игры (статус ' + st.status + ').');
        }

        // Команда
        const members = tm && Array.isArray(tm.members) ? tm.members : [];
        const palette = [eventPalette.blue, eventPalette.green, eventPalette.purple, eventPalette.orange, eventPalette.teal, eventPalette.yellow];
        const mapped = members.map((m, idx) => ({
          steamId: String(m.steamId == null ? '' : m.steamId),
          name: m.name || '?',
          x: m.x || 0,
          y: m.y || 0,
          isOnline: !!m.isOnline,
          isAlive: m.isAlive !== false,
          color: palette[idx % palette.length],
          leader: String(tm.leaderSteamId == null ? '' : tm.leaderSteamId) === String(m.steamId == null ? '' : m.steamId),
        }));
        if (!disposed) {
          const prev = prevTeamFbRef.current;
          prevTeamFbRef.current = mapped;
          setTeam(mapped);
          prependLifeEvents(setDeathLog, teamLifeEvents(mapped, prev));
          notifyMembership(teamMembershipEvents(mapped, prev));
        }

        // Инфо о сервере (пишет pc-client в /server_info)
        if (sv) {
          setServer({
            name: sv.name || '',
            playersN: sv.players || 0,
            maxPlayers: sv.maxPlayers || 0,
            queued: sv.queuedPlayers || 0,
            mapSizeM: sv.mapSize || 3000,
            wipeTime: sv.wipeTime || 0,
            seed: sv.seed != null ? String(sv.seed) : '',
            gameDay: sv.gameTime && sv.gameTime.day != null ? Number(sv.gameTime.day) : null,
            gameTimeH: sv.gameTime && sv.gameTime.time != null ? Number(sv.gameTime.time) : null,
          });
        }

        // Торговые автоматы (пишет pc-client в /vending из маркеров карты)
        setVending(
          vn && Array.isArray(vn.machines)
            ? vn.machines
                .filter((m) => m && m.id != null)
                .map((m) => ({
                  id: String(m.id),
                  name: m.name || '',
                  x: m.x || 0,
                  y: m.y || 0,
                  orders: Array.isArray(m.sellOrders) ? m.sellOrders : [],
                }))
            : []
        );

        // События: активные маркеры + лента появлений/исчезновений
        const entries =
          ev && typeof ev === 'object'
            ? Object.entries(ev)
                .map(([k, v]) => ({ key: k, ...(v || {}) }))
                .filter((e) => e.type)
            : [];
        entries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        // Новые события (по ключам узла) дублируем в центр уведомлений.
        // Первый тик — бэкфилл: принимаем всё накопленное без пушей.
        const seenKeys = new Set(entries.map((e) => e.key));
        if (eventSeenRef.current) {
          entries.forEach((e) => {
            if (eventSeenRef.current.has(e.key) || !EVENT_STYLE[e.type]) return;
            const important = (e.type === 'patrol_helicopter' || e.type === 'cargo_ship') && e.action === 'spawn';
            pushNotif({
              kind: 'event',
              important,
              title: {
                ru: (e.action === 'spawn' ? 'Появление: ' : 'Исчезло: ') + EVENT_STYLE[e.type].label.ru,
                en: (e.action === 'spawn' ? 'Spawned: ' : 'Gone: ') + EVENT_STYLE[e.type].label.en,
              },
            });
          });
        }
        eventSeenRef.current = seenKeys;
        const latest = {};
        entries.forEach((e) => {
          if (latest[e.type] == null) latest[e.type] = e;
        });
        setActiveEvents(
          Object.values(latest)
            .filter((e) => e.action === 'spawn' && EVENT_STYLE[e.type])
            .map((e) => ({ id: e.key, key: e.type, worldX: e.x || 0, worldY: e.y || 0, ...EVENT_STYLE[e.type] }))
        );
        const evLogs = entries
          .slice(0, 30)
          .filter((e) => EVENT_STYLE[e.type])
          .map((e) => ({
            id: 'ev-' + e.key,
            ts: e.timestamp || 0,
            time: hhmm(e.timestamp || Date.now()),
            important: false,
            src: 'event',
            text: {
              ru: (e.action === 'spawn' ? 'Появление: ' : 'Исчезло: ') + EVENT_STYLE[e.type].label.ru,
              en: (e.action === 'spawn' ? 'Spawned: ' : 'Gone: ') + EVENT_STYLE[e.type].label.en,
            },
          }));

        // Устройства + дифф значений тревог между поллами
        const dObj = dv && typeof dv === 'object' ? dv : {};
        Object.values(dObj).forEach((d) => {
          if (!d || d.id == null) return;
          const k = 'd' + d.id;
          const was = devicePrevValsRef.current[k] === true;
          const now = d.value === true;
          devicePrevValsRef.current[k] = now;
          if (d.type === 'alarm' && now && !was) {
            deviceAlarmsRef.current = [
              {
                id: k + '-' + (d.updatedAt || Date.now()),
                ts: d.updatedAt || Date.now(),
                time: hhmm(d.updatedAt || Date.now()),
                important: true,
                src: 'device',
                text: { ru: 'Тревога «' + (d.name || d.id) + '» сработала', en: 'Alarm "' + (d.name || d.id) + '" triggered' },
              },
              ...deviceAlarmsRef.current,
            ].slice(0, 50);
            pushNotif({
              kind: 'alarm',
              important: true,
              title: { ru: 'Тревога «' + (d.name || d.id) + '» сработала', en: 'Alarm "' + (d.name || d.id) + '" triggered' },
            });
          }
        });
        setDevices(dObj);
        setAlarmLog([...evLogs, ...deviceAlarmsRef.current].sort((a, b) => b.ts - a.ts).slice(0, 50));

        // Чат команды (/chat пишет pc-client)
        const chArr = ch && typeof ch === 'object' ? Object.entries(ch).map(([k, v]) => ({ key: k, ...(v || {}) })) : [];
        chArr.sort((a, b) => (a.time || 0) - (b.time || 0));
        setChat(
          chArr.slice(-100).map((c) => ({
            key: c.key,
            steamId: String(c.steamId == null ? '' : c.steamId),
            author: c.name || '?',
            text: c.message || '',
            mine: String(c.steamId == null ? '' : c.steamId) === mySteamId,
            ts: (c.time || 0) * 1000,
          }))
        );
      } catch (err) {
        if (disposed) return;
        setStatus('error');
        setError(err && err.message ? err.message : String(err));
      }
    };

    const fetchMap = async () => {
      try {
        const mp = await getj('/map');
        if (disposed) return;
        setMapData(mp && mp.image ? { image: mp.image, width: mp.width || 3000, height: mp.height || 3000, monuments: mp.monuments || [] } : null);
      } catch (e) {
        /* карта подтянется на следующем цикле */
      }
    };

    tick();
    fetchMap();
    timers.push(setInterval(tick, 4000));
    timers.push(setInterval(fetchMap, 120000));

    return () => {
      disposed = true;
      timers.forEach(clearInterval);
    };
  }, [enabled, base, q, mySteamId]);

  const postCommand = async (body) => {
    const res = await fetch(base + '/commands.json' + (q ? '?' + q : ''), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Не удалось отправить команду (' + res.status + ')');
  };

  const toggleSwitch = async (entityId, value) => {
    const key = String(entityId);
    setDevices((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key], value } } : prev)); // оптимистично
    await postCommand({ action: 'toggle_switch', entityId: Number(entityId), value, requestedAt: Date.now() });
  };

  const sendChat = async (text) => {
    await postCommand({ action: 'send_team_message', text: String(text).slice(0, 128), requestedAt: Date.now() });
  };

  const refreshMap = async () => {
    if (!base) return;
    try {
      const res = await fetch(base + '/map.json' + (q ? '?' + q : '') + (q ? '&' : '?') + '_=' + Date.now());
      if (!res.ok) return;
      const mp = await res.json();
      setMapData(mp && mp.image ? { image: mp.image, width: mp.width || 3000, height: mp.height || 3000, monuments: mp.monuments || [] } : null);
    } catch (e) {
      /* оставляем прошлую карту */
    }
  };

  return {
    modeTag: 'firebase',
    status,
    error,
    server,
    team,
    mapData,
    activeEvents,
    alarmLog,
    devices,
    chat,
    deathLog,
    vending,
    actions: { toggleSwitch, sendChat, refreshMap },
  };
}

// ── Демо-источник: статичные моки для показа без сети ──
const MOCK_LIVE = {
  modeTag: 'mock',
  status: 'idle',
  error: null,
  server: { name: 'Demo Server', playersN: 87, maxPlayers: 200, queued: 4, mapSizeM: 3500, wipeTime: 0, seed: '12345', gameDay: 3, gameTimeH: 14.5 },
  team: [
    { steamId: '1', name: 'Vasyan', x: 1200, y: 800, isOnline: true, isAlive: true, color: eventPalette.blue, leader: true },
    { steamId: '2', name: 'Kolyan', x: 2400, y: 2100, isOnline: true, isAlive: true, color: eventPalette.green, leader: false },
    { steamId: '3', name: 'Sanya', x: 900, y: 2600, isOnline: false, isAlive: false, color: eventPalette.purple, leader: false },
  ],
  mapData: null,
  activeEvents: [
    { id: 'm1', key: 'patrol_helicopter', worldX: 1800, worldY: 1500, ...EVENT_STYLE.patrol_helicopter },
    { id: 'm2', key: 'crate', worldX: 2900, worldY: 900, ...EVENT_STYLE.crate },
  ],
  alarmLog: [
    { id: 'a1', ts: Date.now(), time: hhmm(Date.now()), important: true, text: { ru: 'Тревога «Вход» сработала', en: 'Alarm "Entrance" triggered' } },
    { id: 'a2', ts: Date.now() - 300000, time: hhmm(Date.now() - 300000), important: false, text: { ru: 'Появление: Cargo Ship', en: 'Spawned: Cargo Ship' } },
  ],
  devices: {
    d1: { id: 'd1', name: 'Свет на ферме', type: 'switch', value: false },
    d2: { id: 'd2', name: 'Сигнализация — вход', type: 'alarm', value: false },
    d3: {
      id: 'd3',
      name: 'Шкаф (TC)',
      type: 'storage_monitor',
      capacity: 48,
      hasProtection: true,
      protectionExpiry: Math.floor(Date.now() / 1000) + 86400 * 2,
      items: [],
    },
    // Печь-монитор с рудой — чтобы эвристика переплавки была видна в демо
    d4: {
      id: 'd4',
      name: 'Печь у базы',
      type: 'storage_monitor',
      capacity: 30,
      hasProtection: false,
      protectionExpiry: 0,
      items: [
        // ID — из дампа игровых данных v2252 (см. data/lootCats.js)
        { itemId: -151838493, quantity: 3000, isBlueprint: false },
        { itemId: -4031221, quantity: 6000, isBlueprint: false },
        { itemId: -1157596551, quantity: 1500, isBlueprint: false },
      ],
    },
    // Снаряжение в ящиках — чтобы лут-радар был виден в демо
    d5: {
      id: 'd5',
      name: 'Ящик у выхода',
      type: 'storage_monitor',
      capacity: 48,
      hasProtection: true,
      protectionExpiry: Math.floor(Date.now() / 1000) + 86400 * 3,
      items: [
        { itemId: -1211166256, quantity: 512, isBlueprint: false },
        { itemId: 785728077, quantity: 256, isBlueprint: false },
        { itemId: 1248356124, quantity: 4, isBlueprint: false },
        { itemId: -1878475007, quantity: 6, isBlueprint: false },
        { itemId: -932201673, quantity: 2100, isBlueprint: false },
        { itemId: 479143914, quantity: 12, isBlueprint: false },
      ],
    },
  },
  deathLog: [
    { id: 'dl1', ts: Date.now() - 12 * 60000, time: hhmm(Date.now() - 12 * 60000), kind: 'death', name: 'Sanya', x: 1450, y: 2300 },
    { id: 'dl2', ts: Date.now() - 47 * 60000, time: hhmm(Date.now() - 47 * 60000), kind: 'respawn', name: 'Sanya', x: 900, y: 2600 },
    { id: 'dl3', ts: Date.now() - 95 * 60000, time: hhmm(Date.now() - 95 * 60000), kind: 'death', name: 'Kolyan', x: 2500, y: 1900 },
  ],
  vending: [
    {
      id: 'v1',
      name: 'Магазин у аванпоста',
      x: 1200,
      y: 1500,
      orders: [
        { itemId: -151838493, amount: 1000, currencyId: -932201673, cost: 150 },
        { itemId: -4031221, amount: 500, currencyId: -932201673, cost: 90 },
      ],
    },
    {
      id: 'v2',
      name: 'Ферма на юге',
      x: 2200,
      y: 2800,
      orders: [{ itemId: -265876753, amount: 300, currencyId: -932201673, cost: 200 }],
    },
  ],
  chat: [
    { key: 'c1', steamId: '1', author: 'Vasyan', text: 'Хели на карте!', mine: false, ts: Date.now() - 60000 },
    { key: 'c2', steamId: '2', author: 'Kolyan', text: 'вижу, иду к крейту', mine: false, ts: Date.now() - 30000 },
  ],
  actions: { toggleSwitch: async () => {}, sendChat: async () => {}, refreshMap: async () => {} },
};

// ── Единая точка данных для экранов ──
export function useDataSource(mode, cfg) {
  // Оба хука вызываем безусловно — правила хуков React
  const fb = useFirebaseLive(mode === 'firebase', cfg);
  const rp = useRustPlusDirect(mode === 'rustplus', cfg);
  const live = mode === 'firebase' ? fb : mode === 'rustplus' ? rp : MOCK_LIVE;
  return {
    mode: live.modeTag,
    status: live.status,
    error: live.error,
    server: live.server,
    team: live.team,
    map: live.mapData,
    activeEvents: live.activeEvents,
    alarmLog: live.alarmLog,
    devices: live.devices,
    chat: live.chat,
    deathLog: live.deathLog || [],
    vending: live.vending || [],
    actions: live.actions,
  };
}

// Приведение live-данных к процентам экрана (Y инвертирован — как в MapScreen.js)
function worldToPct(v, worldSize) {
  return worldSize > 0 ? (v / worldSize) * 100 : 0;
}

// Готовый вид для отрисовки карты: тиммейты + события в процентах.
// Работает и для демо (моки дают те же поля), и для живых источников.
export function buildLiveView(live) {
  if (!live) return null;
  const worldSize = (live.map && live.map.width) || (live.server && live.server.mapSizeM) || 3000;
  return {
    image: live.map ? live.map.image : null,
    width: live.map ? live.map.width : worldSize,
    monuments: live.map ? live.map.monuments || [] : [],
    members: live.team.map((m) => ({
      id: m.steamId,
      name: m.name,
      color: m.color || eventPalette.blue,
      x: worldToPct(m.x, worldSize),
      y: 100 - worldToPct(m.y, worldSize),
      online: m.isOnline,
      alive: m.isAlive,
    })),
    events: live.activeEvents
      .filter((ev) => ev.icon)
      .map((ev) => ({
        id: ev.id,
        icon: ev.icon,
        label: ev.label,
        color: ev.color,
        x: worldToPct(ev.worldX, worldSize),
        y: 100 - worldToPct(ev.worldY, worldSize),
      })),
    // Смерти тиммейтов за сессию — красные крестики на карте (heatmap)
    deaths: (live.deathLog || [])
      .filter((d) => d.kind === 'death')
      .slice(0, 30)
      .map((d) => ({
        id: d.id,
        x: worldToPct(d.x, worldSize),
        y: 100 - worldToPct(d.y, worldSize),
        time: d.time,
      })),
    // Торговые автоматы — жёлтые чипы 🏪 на карте (координаты в %)
    vending: (live.vending || []).map((v) => ({
      id: String(v.id),
      name: v.name || '',
      x: worldToPct(v.x, worldSize),
      y: 100 - worldToPct(v.y, worldSize),
    })),
  };
}

// G6+ — Связка с Google аккаунтом для подписки (клиентская часть)
const GOOGLE_LINK_KEY = 'rc_google_link_v1';
export async function loadGoogleLink() { try { return await AsyncStorage.getItem(GOOGLE_LINK_KEY); } catch(e){ return null; } }
export async function storeGoogleLink(val) { try { await AsyncStorage.setItem(GOOGLE_LINK_KEY, val); } catch(e){} }
export async function clearGoogleLink() { try { await AsyncStorage.removeItem(GOOGLE_LINK_KEY); } catch(e){} }
