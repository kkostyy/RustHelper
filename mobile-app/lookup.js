// ─────────────────────────────────────────────────────────
// ПРОБИВ — источники данных без серверной части:
//
// 1. Steam Community XML (steamcommunity.com/profiles/<id64>/?xml=1)
//    — работает без ключей: ник, аватар, онлайн, VAC/трейд-бан,
//    дата регистрации, часы за 2 недели, приватность профиля.
//    XML парсим регулярками — DOMParser в React Native нет.
// 2. BattleMetrics API — только с платной подпиской (без ключа
//    API отвечает 403). Ключ вводится в Настройках; без него
//    секция честно показывает, что нужен ключ.
// 3. RustLookup (бэкенд rust-stats.onrender.com за сайтом
//    rustlookup.com) — бесплатный пробив боевой статистики без
//    ключей: K/D, точность, хедшоты, часы, ресурсы, топ-серверы.
//    Первоисточник — BattleMetrics (статистику отдают серверы,
//    подключённые к BM), поэтому приватность зависит от профиля.
//    Хостинг бесплатный: после простоя инстанс просыпается
//    30–60 сек (503) — повтор через полминуты обычно помогает.
//    (ruststats.com мёртв — домен на продажу; ruststats.io жив,
//    но API-ключи выдаёт вручную через их Discord.)
// 5. RustWho (https://www.rustwho.com/) — парсинг профилей через сайт
//    (без официального API, HTML-парсинг). Заглушка: функция fetchRustWho.
// TODO: интеграция при появлении стабильного эндпоинта.
const RUSTWHO_URL = 'https://www.rustwho.com';

// ТЗ 3.2: заглушка для RustWho (парсинг HTML с rustwho.com)
export async function fetchRustWho(playerName) {
  // Заглушка: интеграция при появлении стабильного эндпоинта
  return { name: playerName, source: 'rustwho', status: 'stub' };
}
//
// Трекинг: список игроков в AsyncStorage, поллинг раз в 2 минуты,
// смена онлайн-статуса = уведомление в центр (notifStore).
// ─────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pushNotif } from './notifStore';

const TRACK_KEY = 'rc_track_v1';
const BM_KEY_STORE = 'rc_bmkey_v1';
const TRACK_POLL_MS = 120000;

// ── fetch с таймаутом (AbortController; если недоступен — без таймаута) ──
async function fetchTimeout(url, opts = {}, ms = 12000) {
  let ac = null;
  try {
    if (typeof AbortController !== 'undefined') {
      ac = new AbortController();
      opts.signal = ac.signal;
    }
  } catch (e) {
    ac = null;
  }
  const timer = ac
    ? setTimeout(() => {
        try {
          ac.abort();
        } catch (e) {}
      }, ms)
    : null;
  try {
    return await fetch(url, opts);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// ── Одна XML-переменная (с CDATA или без) ──
function xmlTag(xml, tag) {
  const re = new RegExp('<' + tag + '>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</' + tag + '>');
  const m = xml.match(re);
  return m ? m[1].trim() : '';
}

// ── Резолв ввода пользователя → steamid64 или ванильное имя ──
// Понимает: ID64, STEAM_0:X:Y, [U:1:N], ссылку /profiles/<id64>,
// ссылку /id/<vanity> и просто ванильное имя.
const ID64_BASE = 76561197960265728n;

export function parseSteamInput(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  // Чистый SteamID64
  if (/^\d{17}$/.test(s)) return { kind: 'id64', id64: s };
  // Ссылка на профиль
  const mProfile = s.match(/steamcommunity\.com\/profiles\/(\d{17})/i);
  if (mProfile) return { kind: 'id64', id64: mProfile[1] };
  const mVanityUrl = s.match(/steamcommunity\.com\/id\/([^/?#\s]+)/i);
  if (mVanityUrl) return { kind: 'vanity', vanity: decodeURIComponent(mVanityUrl[1]) };
  // STEAM_0:X:Y → ID64
  const mLegacy = s.match(/^STEAM_(\d):([01]):(\d+)$/i);
  if (mLegacy) {
    const id = ID64_BASE + BigInt(mLegacy[3]) * 2n + BigInt(mLegacy[2]);
    return { kind: 'id64', id64: id.toString() };
  }
  // [U:1:N] → ID64
  const mS3 = s.match(/^\[U:1:(\d+)\]$/i);
  if (mS3) return { kind: 'id64', id64: (ID64_BASE + BigInt(mS3[1])).toString() };
  // Иначе считаем ввод ванильным именем
  return { kind: 'vanity', vanity: s };
}

// Обратная конвертация для показа: ID64 → STEAM_0:X:Y
export function id64ToLegacy(id64) {
  try {
    const v = BigInt(id64) - ID64_BASE;
    const y = v % 2n;
    const z = (v - y) / 2n;
    return 'STEAM_0:' + (y === 0n ? '0' : '1') + ':' + z.toString();
  } catch (e) {
    return '';
  }
}

// memberSince из XML ("July 24, 2023") → возраст аккаунта в днях (≈)
const MONTHS_RU = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};
export function accountAgeDays(memberSince) {
  const m = String(memberSince || '').match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (!m) return null;
  const mon = MONTHS_RU[m[1].toLowerCase()];
  if (mon == null) return null;
  const ts = new Date(Number(m[3]), mon, Number(m[2])).getTime();
  if (Number.isNaN(ts)) return null;
  return Math.max(0, Math.floor((Date.now() - ts) / 86400000));
}

// ── Профиль Steam: XML → плоский объект ──
export async function fetchSteamProfile(id64) {
  const res = await fetchTimeout(
    'https://steamcommunity.com/profiles/' + id64 + '/?xml=1',
    { headers: { Accept: 'text/xml' } }
  );
  if (!res.ok) throw new Error('HTTP ' + res.status + ' от Steam');
  const xml = await res.text();
  if (xmlTag(xml, 'error')) throw new Error(xmlTag(xml, 'error'));
  if (!xmlTag(xml, 'steamID64')) throw new Error('Профиль не найден');
  const privacy = xmlTag(xml, 'privacyState') || 'public';
  return {
    id64: xmlTag(xml, 'steamID64'),
    name: xmlTag(xml, 'steamID') || id64,
    onlineState: xmlTag(xml, 'onlineState') || 'offline',
    stateMessage: xmlTag(xml, 'stateMessage'),
    privacy,
    avatar: xmlTag(xml, 'avatarFull') || xmlTag(xml, 'avatarMedium') || xmlTag(xml, 'avatarIcon'),
    vacBanned: xmlTag(xml, 'vacBanned') === '1',
    tradeBanState: xmlTag(xml, 'tradeBanState') || 'None',
    limited: xmlTag(xml, 'isLimitedAccount') === '1',
    memberSince: xmlTag(xml, 'memberSince'),
    hours2wk: xmlTag(xml, 'hoursPlayed2Wk'),
    location: xmlTag(xml, 'location'),
    customURL: xmlTag(xml, 'customURL'),
  };
}

// Ванильное имя → ID64 (тот же XML-эндпоинт понимает /id/<vanity>)
export async function resolveVanity(vanity) {
  const res = await fetchTimeout(
    'https://steamcommunity.com/id/' + encodeURIComponent(vanity) + '/?xml=1',
    { headers: { Accept: 'text/xml' } }
  );
  if (!res.ok) throw new Error('HTTP ' + res.status + ' от Steam');
  const xml = await res.text();
  const id64 = xmlTag(xml, 'steamID64');
  if (!id64) throw new Error('Профиль с таким именем не найден');
  return id64;
}

// ── Доп. данные со страницы профиля (HTML, без ключей) ──
// XML уровня Steam, числа банов с давностью и счётчиков игр/групп
// не отдаёт — берём их из открытой HTML-страницы профиля регулярками.
// Работает только для публичных профилей (у приватных вернётся пусто).
export async function fetchSteamExtras(id64) {
  const res = await fetchTimeout(
    'https://steamcommunity.com/profiles/' + id64,
    { headers: { Accept: 'text/html' } }
  );
  if (!res.ok) throw new Error('HTTP ' + res.status + ' от Steam');
  const html = await res.text();
  const num = (re) => {
    const m = html.match(re);
    return m ? Number(m[1]) : null;
  };
  const counter = (label) =>
    num(
      new RegExp(
        'count_link_label">\\s*' + label + '\\s*</span>\\s*&nbsp;\\s*<span class="profile_count_link_total">\\s*(\\d+)',
        'i'
      )
    );
  return {
    level: num(/friendPlayerLevelNum">(\d+)/),
    vacBanCount: num(/(\d+) VAC bans? on record/i),
    gameBanCount: num(/(\d+) game bans? on record/i),
    daysSinceBan: num(/(\d+) days?\(s\)? since last ban/i),
    games: counter('Games'),
    groups: counter('Groups'),
  };
}

// ── Риск-скор (≈ эвристика, не официальный рейтинг) ──
// VAC и трейд-бан весят больше всего, дальше — возраст аккаунта,
// ограниченность и скрытый профиль. Сумма обрезается до 100.
export function riskScore(p) {
  if (!p) return null;
  let score = 0;
  if (p.vacBanned) score += 45;
  if (p.tradeBanState && p.tradeBanState !== 'None') score += 25;
  if (p.limited) score += 15;
  const age = accountAgeDays(p.memberSince);
  if (age != null && age < 180) score += 15;
  if (p.privacy && p.privacy !== 'public') score += 10;
  return Math.min(100, score);
}
export function riskLabel(score, lang) {
  if (score == null) return { ru: '—', en: '—' };
  if (score < 25) return { ru: 'Игрок выглядит надёжным', en: 'Player looks reliable' };
  if (score < 55) return { ru: 'Есть подозрительные признаки', en: 'Some suspicious signs' };
  return { ru: 'Игрок не очень надёжный', en: 'Player is not very reliable' };
}

// ── Skill Rose (6 осей: Aim / PvP / PvE / Farm / Build / Survival) ──
// Данные из BattleMetrics или RustLookup (если есть ключ / API). Без ключа — эвристика по K/D, точности.
// Заглушка API: при отсутствии данных — поля 0
export function apiStubZero() { return { headshotPct: 0, kdRatio: 0, killRate: 0, pveScore: 0, resourceGather: 0, buildScore: 0, survivalScore: 0 }; }

export function skillRose(p, lang = 'ru') {
  if (!p) return null;
  const axes = {
    aim: Math.min(100, Math.round((p.headshotPct || 0) * 1.2 + (p.akRatio || 0) * 10)),
    pvp: Math.min(100, Math.round((p.kdRatio || 0) * 12 + (p.killRate || 0) * 5)),
    pve: Math.min(100, Math.round((p.pveScore || 0) || 40)),
    farm: Math.min(100, Math.round((p.resourceGather || 0) * 10 + 30)),
    build: Math.min(100, Math.round((p.buildScore || 0) || 35)),
    survival: Math.min(100, Math.round((p.survivalScore || 0) || 30)),
  };
  const main = Object.entries(axes).sort((a, b) => b[1] - a[1])[0];
  const classes = {
    aim: { ru: 'Снайпер', en: 'Sniper' },
    pvp: { ru: 'PvP-игрок', en: 'PvP player' },
    pve: { ru: 'Выживальщик', en: 'Survivor' },
    farm: { ru: 'Фермер', en: 'Farmer' },
    build: { ru: 'Строитель', en: 'Builder' },
    survival: { ru: 'Выживальщик', en: 'Survivor' },
  };
  return { axes, mainAxis: main[0], mainClass: classes[main[0]] ? classes[main[0]][lang] : classes.aim[lang], score: main[1] };
}

// ── BattleMetrics: только с ключом подписки (иначе 403) ──
export async function loadBmKey() {
  try {
    return (await AsyncStorage.getItem(BM_KEY_STORE)) || '';
  } catch (e) {
    return '';
  }
}
export async function storeBmKey(k) {
  try {
    if (k) await AsyncStorage.setItem(BM_KEY_STORE, k);
    else await AsyncStorage.removeItem(BM_KEY_STORE);
  } catch (e) {}
}

export async function bmSearchPlayer(id64, apiKey) {
  const res = await fetchTimeout(
    'https://api.battlemetrics.com/players?filter[search]=' + encodeURIComponent(id64),
    { headers: { Authorization: 'Bearer ' + apiKey } }
  );
  if (res.status === 401 || res.status === 403) {
    throw new Error('BattleMetrics отклонил ключ (нужна активная подписка API)');
  }
  if (!res.ok) throw new Error('BattleMetrics HTTP ' + res.status);
  const j = await res.json();
  const p = j && j.data && j.data[0];
  if (!p) return null;
  return {
    id: p.id,
    name: (p.attributes && p.attributes.name) || '',
    playtimeH: p.attributes && p.attributes.playtime != null ? Math.round(p.attributes.playtime / 3600) : null,
    firstLogin: (p.attributes && p.attributes.firstLoginTime) || null,
    lastLogin: (p.attributes && p.attributes.lastLoginTime) || null,
    rank: p.attributes && p.attributes.rank != null ? p.attributes.rank : null,
  };
}

export async function bmSearchServers(query, apiKey) {
  const res = await fetchTimeout(
    'https://api.battlemetrics.com/servers?filter[game]=rust&page[size]=10&filter[search]=' +
      encodeURIComponent(query),
    { headers: { Authorization: 'Bearer ' + apiKey } }
  );
  if (res.status === 401 || res.status === 403) {
    throw new Error('BattleMetrics отклонил ключ (нужна активная подписка API)');
  }
  if (!res.ok) throw new Error('BattleMetrics HTTP ' + res.status);
  const j = await res.json();
  return ((j && j.data) || []).map((s) => ({
    id: s.id,
    name: (s.attributes && s.attributes.name) || '',
    players: s.attributes && s.attributes.players,
    maxPlayers: s.attributes && s.attributes.maxPlayers,
    status: s.attributes && s.attributes.status,
    rank: s.attributes && s.attributes.rank,
    ip: s.attributes && s.attributes.ip,
    port: s.attributes && s.attributes.port,
    details: (s.attributes && s.attributes.details) || {},
  }));
}

// ── RustLookup: бесплатная боевая статистика без ключей ──
// Ответ /api/player: { player_id, steam_profile:{personaname, avatarfull,
// communityvisibilitystate, timecreated, loccountrycode, ...},
// stats:{kill_player, deaths, headshot, wounded, Accuracy, HSP,
// bullet_fired, bullet_hit_player, harvested_wood, ...},
// steam_hours:{playtime_forever, playtime_2weeks, risk},
// bans:{NumberOfVACBans, NumberOfGameBans, DaysSinceLastBan, ...},
// private, stats_private }. Ошибки приходят как {detail}.
const RL_API = 'https://rust-stats.onrender.com';

export async function fetchRustLookup(id64) {
  const res = await fetchTimeout(
    RL_API + '/api/player?player=' + encodeURIComponent(id64),
    {},
    60000 // Render бесплатный: холодный старт бывает длинным
  );
  if (res.status === 502 || res.status === 503) {
    throw new Error(
      'RustLookup сейчас недоступен (бесплатный хостинг: инстанс приостановлен или просыпается) — боевая статистика появится, когда сервис вернётся. Профиль Steam при этом работает.'
    );
  }
  if (!res.ok) throw new Error('RustLookup HTTP ' + res.status);
  const j = await res.json();
  if (j && j.detail) throw new Error(String(j.detail));
  if (!j || !j.steam_profile) throw new Error('RustLookup: пустой ответ');
  return j;
}

// Топ серверов игрока (вкладка «серверы» на rustlookup): [{id, name,
// firstSeen, lastSeen, timePlayed, sessions, players, maxPlayers, rank, country}]
export async function fetchRustLookupServers(id64) {
  try {
    const res = await fetchTimeout(
      RL_API + '/api/servers?player=' + encodeURIComponent(id64),
      {},
      60000
    );
    if (!res.ok) return [];
    const j = await res.json();
    return (j && j.servers) || [];
  } catch (e) {
    return []; // серверы — необязательная вкладка, молча пропускаем
  }
}

// ── Пробив сервера по IP без ключей: Steam GetServersAtAddress ──
export async function fetchServersAtIP(ip) {
  const clean = String(ip || '').trim();
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(clean)) {
    throw new Error('Нужен IPv4-адрес, например 185.44.80.20');
  }
  const res = await fetchTimeout(
    'https://api.steampowered.com/ISteamApps/GetServersAtAddress/v1/?addr=' + clean
  );
  if (!res.ok) throw new Error('HTTP ' + res.status + ' от Steam');
  const j = await res.json();
  const list = (j && j.response && j.response.servers) || [];
  return list
    .filter((s) => String(s.appid) === '252490')
    .map((s) => ({
      name: s.name || '',
      addr: s.addr || clean,
      players: s.players,
      maxPlayers: s.max_players,
      map: s.map || '',
      env: s.env || '',
    }));
}

// ── Трекинг игроков ──
// [{ id64, name, avatar, online: 'online'|'offline', addedTs }]
let tracked = null; // кэш вне React

export async function loadTracking() {
  if (tracked) return tracked;
  try {
    const raw = await AsyncStorage.getItem(TRACK_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    tracked = Array.isArray(parsed) ? parsed.filter((p) => p && p.id64) : [];
  } catch (e) {
    tracked = [];
  }
  return tracked;
}

function saveTracking() {
  try {
    AsyncStorage.setItem(TRACK_KEY, JSON.stringify(tracked || [])).catch(() => {});
  } catch (e) {}
}

export async function addTracked(profile) {
  await loadTracking();
  if ((tracked || []).some((p) => p.id64 === profile.id64)) return false;
  tracked = [
    {
      id64: profile.id64,
      name: profile.name,
      avatar: profile.avatar || '',
      online: profile.onlineState === 'online' ? 'online' : 'offline',
      addedTs: Date.now(),
    },
    ...(tracked || []),
  ].slice(0, 20);
  saveTracking();
  emitTracked();
  return true;
}

export async function removeTracked(id64) {
  await loadTracking();
  tracked = (tracked || []).filter((p) => p.id64 !== id64);
  saveTracking();
  emitTracked();
}

// Подписка для UI (список трекинга на экране Пробива)
const trackListeners = new Set();
function emitTracked() {
  const snapshot = tracked || [];
  trackListeners.forEach((fn) => {
    try {
      fn(snapshot);
    } catch (e) {}
  });
}
export function useTracking() {
  const [list, setList] = useState(tracked || []);
  useEffect(() => {
    const fn = (s) => setList([...s]);
    trackListeners.add(fn);
    loadTracking().then(() => fn(tracked || []));
    return () => {
      trackListeners.delete(fn);
    };
  }, []);
  return list;
}

// Поллер трекинга: раз в 2 минуты проверяет онлайн-статус всех
// отслеживаемых; смена статуса = уведомление. Вешается один раз в App.
export function useTrackingPoller() {
  const busyRef = useRef(false);
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        const list = await loadTracking();
        for (const p of list) {
          if (!alive) return;
          try {
            const prof = await fetchSteamProfile(p.id64);
            const nowSt = prof.onlineState === 'online' ? 'online' : 'offline';
            if (p.online && nowSt !== p.online) {
              pushNotif({
                kind: 'track',
                important: nowSt === 'online',
                title:
                  nowSt === 'online'
                    ? {
                        ru: p.name + ' появился в Steam',
                        en: p.name + ' is now online',
                      }
                    : {
                        ru: p.name + ' вышел из Steam',
                        en: p.name + ' went offline',
                      },
              });
            }
            p.online = nowSt;
            p.name = prof.name || p.name;
            p.avatar = prof.avatar || p.avatar;
          } catch (e) {
            /* пропускаем этот цикл для игрока */
          }
        }
        saveTracking();
        emitTracked();
      } finally {
        busyRef.current = false;
      }
    };
    const iv = setInterval(tick, TRACK_POLL_MS);
    tick();
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, []);
}
// RustWho интеграция (по ТЗ 2.3): https://www.rustwho.com/ — парсинг данных игрока
// Auto-detect clan tags + alts via RustWho + Steam API (lookup integration)
