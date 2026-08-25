// ─────────────────────────────────────────────────────────
// ЭКРАН 4: ПРОБИВ — два режима:
//  «Игрок»   — пробив по SteamID64 / ссылке / нику. Данные:
//              1) Steam Community XML (ник, аватар, онлайн, VAC
//              и трейд-баны, возраст аккаунта) — без ключей;
//              2) RustLookup (бесплатный бэкенд rustlookup.com,
//              первоисточник BattleMetrics) — боевая статистика
//              как на референс-скриншоте: K/D, точность, хедшоты,
//              часы, ресурсы, топ серверов; инстанс бесплатный,
//              просыпается до минуты после простоя;
//              3) BattleMetrics API — опционально, платный ключ
//              из Настроек. Плюс ≈риск-скор и кнопка
//              «Отслеживать» (поллинг раз в 2 мин, смена
//              статуса — в центр уведомлений).
//  «Сервер»  — живые плитки нашего сервера (Rust+/Firebase) +
//              алерт очереди + история онлайна/очереди за 24 ч
//              (спарклайн srvHist.js, срез раз в 5 минут) +
//              алерты рестарта и потери связи + пробив чужого
//              сервера по IP (Steam GetServersAtAddress, без
//              ключей) или по имени (ключ BattleMetrics).
// ─────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, eventPalette } from './theme';
import { GlassCard, SectionHeader, Segmented } from './ui';
import { PulsingDot, PopIn } from './motion';
import { formatGameTime } from './live';
import { pushNotif } from './notifStore';
import { SrvHistoryCard } from './srvHist';
import {
  parseSteamInput,
  resolveVanity,
  fetchSteamProfile,
  fetchSteamExtras,
  fetchServersAtIP,
  fetchRustLookup,
  fetchRustLookupServers,
  bmSearchPlayer,
  bmSearchServers,
  loadBmKey,
  accountAgeDays,
  id64ToLegacy,
  riskScore,
  riskLabel,
  addTracked,
  removeTracked,
  useTracking,
} from './lookup';

const QUEUE_ALERT_KEY = 'rc_queue_alert_v1';

// ── Форматирование чисел без Intl (Hermes): 1234567 → «1 234 567» ──
function fmtInt(n) {
  const v = Number(n);
  if (n == null || Number.isNaN(v)) return '—';
  return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Цвет K/D: ≥1.1 — зелёный, ≥0.75 — жёлтый, ниже — красный
function kdColor(kd) {
  if (kd == null || Number.isNaN(Number(kd))) return colors.textMuted;
  const v = Number(kd);
  if (v >= 1.1) return eventPalette.green;
  if (v >= 0.75) return eventPalette.yellow;
  return eventPalette.red;
}

// Риск от RustLookup: 'Low' | 'Moderate' | 'High' | 'Unknown'
function rlRiskLabel(risk, lang) {
  const map = {
    Low: { ru: 'Низкий', en: 'Low' },
    Moderate: { ru: 'Средний', en: 'Moderate' },
    High: { ru: 'Высокий', en: 'High' },
  };
  return (risk && map[risk]) || null;
}

// Полоска-показатель (точность / хедшоты): число + заполненная полоса
function StatBar({ label, value, color, max = 100 }) {
  const v = Number(value);
  const ok = value != null && !Number.isNaN(v);
  const w = ok ? Math.max(0, Math.min(100, (v / max) * 100)) : 0;
  return (
    <View style={{ marginBottom: 9 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={[styles.barValue, { color: ok ? color : colors.textMuted }]}>
          {ok ? v.toFixed(1) + '%' : '—'}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: w + '%', backgroundColor: ok ? color : 'rgba(255,255,255,0.15)' }]} />
      </View>
    </View>
  );
}

// ── Алерт очереди: уведомим, когда очередь упала до порога ──
function QueueAlertSection({ lang, queued }) {
  const [thr, setThr] = useState(null); // null = выключено
  const [fired, setFired] = useState(false);
  const prevRef = useRef(queued);

  useEffect(() => {
    AsyncStorage.getItem(QUEUE_ALERT_KEY)
      .then((v) => {
        if (v != null && !Number.isNaN(Number(v))) setThr(Number(v));
      })
      .catch(() => {});
  }, []);

  const setThreshold = (v) => {
    setThr(v);
    setFired(false);
    prevRef.current = queued;
    try {
      if (v == null) AsyncStorage.removeItem(QUEUE_ALERT_KEY);
      else AsyncStorage.setItem(QUEUE_ALERT_KEY, String(v));
    } catch (e) {
      /* приватный режим */
    }
  };

  // Грань перехода: было выше порога → стало не выше. Поднялась снова — сброс.
  useEffect(() => {
    if (thr == null || queued == null) return;
    if (prevRef.current > thr && queued <= thr) {
      setFired(true);
      pushNotif({
        kind: 'event',
        important: true,
        title: {
          ru: 'Очередь ' + queued + ' — пора заходить!',
          en: 'Queue ' + queued + ' — time to join!',
        },
      });
    }
    if (queued > thr) setFired(false);
    prevRef.current = queued;
  }, [queued, thr]);

  const presets = [5, 10, 20];

  return (
    <View>
      <View style={styles.chipRow}>
        <TouchableOpacity
          style={[styles.chip, thr == null && styles.chipActive]}
          onPress={() => setThreshold(null)}
        >
          <Text style={[styles.chipTxt, thr == null && styles.chipTxtActive]}>
            {lang === 'ru' ? 'Выкл' : 'Off'}
          </Text>
        </TouchableOpacity>
        {presets.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.chip, thr === p && styles.chipActive]}
            onPress={() => setThreshold(p)}
          >
            <Text style={[styles.chipTxt, thr === p && styles.chipTxtActive]}>≤{p}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.hint}>
        {lang === 'ru'
          ? 'Проверяется по живым данным каждые несколько секунд.'
          : 'Checked against live data every few seconds.'}
      </Text>
      {fired && (
        <PopIn style={styles.queueFired}>
          <Text style={styles.queueFiredTxt}>
            🎉{' '}
            {lang === 'ru'
              ? `Очередь ${queued ?? '—'} — пора заходить!`
              : `Queue ${queued ?? '—'} — time to join!`}
          </Text>
        </PopIn>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// РЕЖИМ «ИГРОК»
// ═══════════════════════════════════════════════════════════
function PlayerLookup({ lang }) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [prof, setProf] = useState(null);
  // RustLookup: rl — ответ /api/player, rlSrv — топ серверов
  const [rl, setRl] = useState(null);
  const [rlSrv, setRlSrv] = useState([]);
  const [rlErr, setRlErr] = useState(null);
  const [rlBusy, setRlBusy] = useState(false);
  // extras — уровень Steam / баны / счётчики из HTML профиля (всегда без ключей)
  const [extras, setExtras] = useState(null);
  const [bmKey, setBmKey] = useState('');
  const [bm, setBm] = useState(null);
  const [bmErr, setBmErr] = useState(null);
  const [bmBusy, setBmBusy] = useState(false);
  const tracked = useTracking();

  useEffect(() => {
    loadBmKey().then(setBmKey);
  }, []);

  const isTracked = prof ? tracked.some((p) => p.id64 === prof.id64) : false;

  const doSearch = async () => {
    setErr(null);
    setProf(null);
    setRl(null);
    setRlSrv([]);
    setRlErr(null);
    setExtras(null);
    setBm(null);
    setBmErr(null);
    setLoading(true);
    try {
      const parsed = parseSteamInput(q);
      if (!parsed) throw new Error(lang === 'ru' ? 'Введи SteamID64, ссылку на профиль или ник' : 'Enter a SteamID64, profile link or nickname');
      const id64 = parsed.kind === 'id64' ? parsed.id64 : await resolveVanity(parsed.vanity);
      const p = await fetchSteamProfile(id64);
      setProf(p);
      // Всё остальное — параллельно, карточку не блокируем
      fetchSteamExtras(id64)
        .then(setExtras)
        .catch(() => {}); // уровень/счётчики необязательны
      setRlBusy(true);
      fetchRustLookup(id64)
        .then((r) => {
          setRl(r);
          return fetchRustLookupServers(id64);
        })
        .then((srv) => setRlSrv(Array.isArray(srv) ? srv : []))
        .catch((e) => setRlErr((e && e.message) || 'RustLookup error'))
        .finally(() => setRlBusy(false));
      if (bmKey) {
        setBmBusy(true);
        bmSearchPlayer(id64, bmKey)
          .then((r) => {
            setBm(r);
            if (!r) setBmErr(lang === 'ru' ? 'BattleMetrics: игрок не найден' : 'BattleMetrics: player not found');
          })
          .catch((e) => setBmErr(e && e.message ? e.message : 'BM error'))
          .finally(() => setBmBusy(false));
      }
    } catch (e) {
      setErr((e && e.message) || (lang === 'ru' ? 'Не удалось получить профиль' : 'Failed to fetch profile'));
    }
    setLoading(false);
  };

  const toggleTrack = async () => {
    if (!prof) return;
    try {
      if (isTracked) await removeTracked(prof.id64);
      else await addTracked(prof);
    } catch (e) {}
  };

  const score = prof ? riskScore(prof) : null;
  const scoreLbl = riskLabel(score, lang);
  const ageDays = prof ? accountAgeDays(prof.memberSince) : null;

  // Производные RustLookup (всё опционально — сервис бывает недоступен)
  const s = rl && rl.stats ? rl.stats : null;
  const sh = rl && rl.steam_hours ? rl.steam_hours : null;
  const bans = rl && rl.bans ? rl.bans : null;
  const hasCombat = !!s && (s.KD != null || s.kill_player != null || s.bullet_fired != null);
  const statsHidden = !!rl && rl.stats_private === true;
  const rlRisk = rlRiskLabel(sh && sh.risk, lang);
  const vacBans =
    bans && bans.NumberOfVACBans != null
      ? Number(bans.NumberOfVACBans)
      : extras && extras.vacBanCount != null
        ? extras.vacBanCount
        : prof && prof.vacBanned
          ? 1
          : null;
  const vacDays =
    bans && bans.DaysSinceLastBan != null
      ? Number(bans.DaysSinceLastBan)
      : extras && extras.daysSinceBan != null
        ? extras.daysSinceBan
        : null;
  const res = s || {};
  const resRows = [
    { icon: '🪵', v: res.harvested_wood, label: { ru: 'Дерево', en: 'Wood' } },
    { icon: '🪨', v: res.harvested_stones, label: { ru: 'Камень', en: 'Stones' } },
    { icon: '⛏️', v: res.acquired_metal_ore, label: { ru: 'Мет. руда', en: 'Metal ore' } },
    { icon: '🔧', v: res.acquired_scrap, label: { ru: 'Скрап', en: 'Scrap' } },
    { icon: '🛢️', v: res.destroyed_barrels, label: { ru: 'Бочки', en: 'Barrels' } },
  ].filter((r) => r.v != null);

  return (
    <View>
      {/* Поисковая строка */}
      <GlassCard>
        <SectionHeader icon="🔎" color={eventPalette.orange} title={lang === 'ru' ? 'Пробив игрока' : 'Player lookup'} />
        <View style={styles.searchRow}>
          <TextInput
            value={q}
            onChangeText={setQ}
            onSubmitEditing={doSearch}
            placeholder="76561198... / steamcommunity.com/id/... / ник"
            placeholderTextColor="rgba(255,255,255,0.3)"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />
          <TouchableOpacity style={styles.goBtn} onPress={doSearch} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontSize: 15 }}>🔍</Text>}
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>
          {lang === 'ru'
            ? 'Понимает SteamID64, ссылки steamcommunity.com (profiles и id), STEAM_0:X:Y и ванильные ники. Профиль — открытый XML Steam, боевая статистика — бесплатный RustLookup (первоисточник BattleMetrics).'
            : 'Accepts SteamID64, steamcommunity.com links (profiles and id), STEAM_0:X:Y and vanity names. Profile — public Steam XML, combat stats — free RustLookup (source: BattleMetrics).'}
        </Text>
        {!!err && <Text style={styles.errTxt}>⚠ {err}</Text>}
      </GlassCard>

      {/* Карточка профиля */}
      {prof && (
        <GlassCard>
          <View style={styles.profHead}>
            {prof.avatar ? (
              <Image source={{ uri: prof.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPh]}><Text style={{ fontSize: 22 }}>👤</Text></View>
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.profName} numberOfLines={1}>{prof.name}</Text>
              <Text style={styles.profId} numberOfLines={1}>{prof.id64}</Text>
              <View style={styles.onlineRow}>
                <PulsingDot size={6} color={prof.onlineState === 'online' ? eventPalette.green : 'rgba(255,255,255,0.3)'} />
                <Text style={{ color: prof.onlineState === 'online' ? eventPalette.green : colors.textMuted, fontSize: 11, fontWeight: '600' }}>
                  {prof.onlineState === 'online'
                    ? lang === 'ru' ? 'В сети' : 'Online'
                    : lang === 'ru' ? 'Не в сети' : 'Offline'}
                  {prof.privacy !== 'public' ? (lang === 'ru' ? ' · скрытый профиль' : ' · private profile') : ''}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.trackBtn, isTracked && styles.trackBtnOn]}
              onPress={toggleTrack}
            >
              <Text style={[styles.trackBtnTxt, isTracked && styles.trackBtnTxtOn]}>
                {isTracked
                  ? lang === 'ru' ? '✓ Отслеживается' : '✓ Tracked'
                  : lang === 'ru' ? '👁 Отслеживать' : '👁 Track'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Баннеры-предупреждения */}
          {(prof.vacBanned || (vacBans != null && vacBans > 0)) && (
            <View style={[styles.banner, styles.bannerRed]}>
              <Text style={styles.bannerTitle}>
                ⛔ {lang === 'ru' ? 'Обнаружена VAC-блокировка' : 'VAC ban detected'}
                {vacBans != null && vacBans > 0 ? ` · ${lang === 'ru' ? 'банов' : 'bans'}: ${vacBans}` : ''}
              </Text>
              {vacDays != null && (
                <Text style={styles.bannerSub}>
                  {lang === 'ru' ? `Аккаунт в блоке ${fmtInt(vacDays)} дн.` : `Account banned ${fmtInt(vacDays)} days ago`}
                </Text>
              )}
            </View>
          )}
          {prof.tradeBanState && prof.tradeBanState !== 'None' && (
            <View style={[styles.banner, styles.bannerRed]}>
              <Text style={styles.bannerTitle}>
                ⛔ {lang === 'ru' ? 'Трейд-бан: ' : 'Trade ban: '}{prof.tradeBanState}
              </Text>
            </View>
          )}
          {prof.limited && (
            <View style={[styles.banner, styles.bannerAmber]}>
              <Text style={styles.bannerTitle}>
                ⚠️ {lang === 'ru' ? 'Ограниченный аккаунт Steam' : 'Limited Steam account'}
              </Text>
            </View>
          )}

          {/* Риск-скор: локальная эвристика + оценка RustLookup (если пришла) */}
          <View style={[styles.banner, score != null && score >= 55 ? styles.bannerRed : score != null && score >= 25 ? styles.bannerAmber : styles.bannerGreen]}>
            <Text style={styles.bannerTitle}>
              {lang === 'ru' ? 'Риск-скор ≈ ' : 'Risk score ≈ '}{score}
              {' · '}
              {lang === 'ru' ? scoreLbl.ru : scoreLbl.en}
              {rlRisk ? `\nRustLookup: ${lang === 'ru' ? rlRisk.ru : rlRisk.en}` : ''}
            </Text>
          </View>

          {/* Общая статистика (как на референсе) */}
          <Text style={styles.subHead}>{lang === 'ru' ? 'ОБЩАЯ СТАТИСТИКА' : 'GENERAL STATS'}</Text>
          <View style={styles.tileGrid}>
            <View style={styles.tile}>
              <Text style={styles.tileValue}>{sh && sh.playtime_forever != null ? fmtInt(sh.playtime_forever) + (lang === 'ru' ? ' ч' : 'h') : '—'}</Text>
              <Text style={styles.tileLabel}>{lang === 'ru' ? 'Часов в Rust' : 'Hours in Rust'}</Text>
            </View>
            <View style={styles.tile}>
              <Text style={styles.tileValue}>
                {sh && sh.playtime_2weeks != null
                  ? fmtInt(sh.playtime_2weeks) + (lang === 'ru' ? ' ч' : 'h')
                  : prof.hours2wk
                    ? prof.hours2wk
                    : '—'}
              </Text>
              <Text style={styles.tileLabel}>{lang === 'ru' ? 'За 2 недели' : 'Past 2 weeks'}</Text>
            </View>
            <View style={styles.tile}>
              <Text style={styles.tileValue}>{prof.memberSince || '—'}</Text>
              <Text style={styles.tileLabel}>
                {lang === 'ru' ? 'Регистрация' : 'Registered'}
                {ageDays != null ? ` · ≈${Math.floor(ageDays / 30)} ${lang === 'ru' ? 'мес' : 'mo'}` : ''}
              </Text>
            </View>
            <View style={styles.tile}>
              <Text style={styles.tileValue}>
                {prof.privacy === 'public'
                  ? lang === 'ru' ? 'Публичный' : 'Public'
                  : lang === 'ru' ? 'Скрытый' : 'Private'}
              </Text>
              <Text style={styles.tileLabel}>{lang === 'ru' ? 'Тип профиля' : 'Profile type'}</Text>
            </View>
            <View style={styles.tile}>
              <Text style={styles.tileValue} numberOfLines={1}>{prof.location || '—'}</Text>
              <Text style={styles.tileLabel}>{lang === 'ru' ? 'Локация' : 'Location'}</Text>
            </View>
            <View style={styles.tile}>
              <Text style={styles.tileValue}>{extras && extras.level != null ? extras.level : '—'}</Text>
              <Text style={styles.tileLabel}>{lang === 'ru' ? 'Уровень Steam' : 'Steam level'}</Text>
            </View>
            <View style={styles.tile}>
              <Text style={styles.tileValue}>{extras && extras.games != null ? extras.games : '—'}</Text>
              <Text style={styles.tileLabel}>{lang === 'ru' ? 'Игр в библиотеке' : 'Games owned'}</Text>
            </View>
            <View style={styles.tile}>
              <Text style={styles.tileValue} numberOfLines={1}>{id64ToLegacy(prof.id64) || '—'}</Text>
              <Text style={styles.tileLabel}>STEAM_0</Text>
            </View>
          </View>

          {/* Боевая статистика из RustLookup (K/D, точность, хедшоты) */}
          <Text style={styles.subHead}>{lang === 'ru' ? 'БОЕВАЯ СТАТИСТИКА' : 'COMBAT STATS'}</Text>
          {rlBusy && (
            <View style={{ alignItems: 'center', paddingVertical: 14 }}>
              <ActivityIndicator color={eventPalette.orange} />
              <Text style={styles.hint}>
                {lang === 'ru'
                  ? 'RustLookup отвечает (бесплатный хостинг — до минуты после простоя)…'
                  : 'RustLookup is responding (free hosting — up to a minute after idle)…'}
              </Text>
            </View>
          )}
          {!rlBusy && !!rlErr && (
            <Text style={styles.errTxt}>⚠ {rlErr}</Text>
          )}
          {!rlBusy && !rlErr && rl && !hasCombat && !statsHidden && (
            <Text style={styles.hint}>
              {lang === 'ru'
                ? 'Боевой статистики нет: игрок не замечён на серверах, отдающих данные BattleMetrics.'
                : 'No combat stats: the player has not been seen on servers reporting to BattleMetrics.'}
            </Text>
          )}
          {!rlBusy && !rlErr && statsHidden && (
            <Text style={styles.hint}>
              {lang === 'ru'
                ? 'Статистика скрыта: приватный профиль Steam.'
                : 'Stats are hidden: private Steam profile.'}
            </Text>
          )}
          {!rlBusy && hasCombat && (
            <View>
              <View style={styles.kdRow}>
                <Text style={[styles.kdValue, { color: kdColor(s.KD) }]}>
                  {s.KD != null ? Number(s.KD).toFixed(2) : '—'}
                </Text>
                <Text style={styles.kdLabel}>{lang === 'ru' ? 'Убийства к смертям (K/D)' : 'Kills to deaths (K/D)'}</Text>
              </View>
              <StatBar
                label={lang === 'ru' ? 'Общая точность' : 'Overall accuracy'}
                value={s.Accuracy}
                color={eventPalette.orange}
              />
              <StatBar
                label={lang === 'ru' ? 'Точность в голову' : 'Headshot accuracy'}
                value={s.HSP}
                color={eventPalette.red}
              />
              <View style={styles.tileGrid}>
                <View style={styles.tile}>
                  <Text style={styles.tileValue}>{fmtInt(s.kill_player)}</Text>
                  <Text style={styles.tileLabel}>{lang === 'ru' ? 'Убийства' : 'Kills'}</Text>
                </View>
                <View style={styles.tile}>
                  <Text style={styles.tileValue}>{fmtInt(s.deaths)}</Text>
                  <Text style={styles.tileLabel}>{lang === 'ru' ? 'Смерти' : 'Deaths'}</Text>
                </View>
                <View style={styles.tile}>
                  <Text style={styles.tileValue}>{fmtInt(s.headshot)}</Text>
                  <Text style={styles.tileLabel}>{lang === 'ru' ? 'В голову' : 'Headshots'}</Text>
                </View>
                <View style={styles.tile}>
                  <Text style={styles.tileValue}>{fmtInt(s.wounded)}</Text>
                  <Text style={styles.tileLabel}>{lang === 'ru' ? 'Ранения' : 'Wounded'}</Text>
                </View>
                <View style={styles.tile}>
                  <Text style={styles.tileValue}>{fmtInt(s.bullet_fired)}</Text>
                  <Text style={styles.tileLabel}>{lang === 'ru' ? 'Выстрелов' : 'Shots fired'}</Text>
                </View>
                <View style={styles.tile}>
                  <Text style={styles.tileValue}>{fmtInt(s.bullet_hit_player)}</Text>
                  <Text style={styles.tileLabel}>{lang === 'ru' ? 'Попаданий в игроков' : 'Hits on players'}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Ресурсы (если статистика их отдала) */}
          {hasCombat && resRows.length > 0 && (
            <View>
              <Text style={styles.subHead}>{lang === 'ru' ? 'СТАТИСТИКА ПО РЕСУРСАМ' : 'RESOURCES'}</Text>
              <View style={styles.tileGrid}>
                {resRows.map((r, i) => (
                  <View key={i} style={styles.tile}>
                    <Text style={styles.tileValue}>{fmtInt(r.v)}</Text>
                    <Text style={styles.tileLabel}>{lang === 'ru' ? r.label.ru : r.label.en}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Топ серверов игрока (RustLookup / BattleMetrics) */}
          {!rlBusy && !rlErr && rlSrv.length > 0 && (
            <View>
              <Text style={styles.subHead}>{lang === 'ru' ? 'ТОП СЕРВЕРОВ ИГРОКА' : 'TOP SERVERS'}</Text>
              {rlSrv.slice(0, 5).map((sv, i) => {
                const sess = Array.isArray(sv.sessions) ? sv.sessions.length : sv.sessions;
                return (
                  <View key={i} style={styles.srvRow}>
                    <Text style={styles.srvName} numberOfLines={1}>
                      {i + 1}. {sv.name || '—'}
                    </Text>
                    <Text style={styles.srvMeta} numberOfLines={1}>
                      {sv.timePlayed != null ? `≈${fmtInt(Number(sv.timePlayed) / 3600)}${lang === 'ru' ? ' ч' : 'h'} · ` : ''}
                      {sess != null ? `${lang === 'ru' ? 'заходов' : 'sessions'}: ${sess}` : ''}
                      {sv.rank ? ` · #${sv.rank}` : ''}
                      {sv.lastSeen ? ` · ${String(sv.lastSeen).slice(0, 10)}` : ''}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* BattleMetrics: только с ключом подписки */}
          <View style={styles.bmBox}>
            <Text style={styles.bmTitle}>BattleMetrics</Text>
            {!bmKey ? (
              <Text style={styles.bmNote}>
                {lang === 'ru'
                  ? 'API BattleMetrics работает только с платной подпиской. Ключ можно вписать в Настройках — тогда здесь появится время игры и логины.'
                  : 'The BattleMetrics API requires a paid subscription. Add a key in Settings to see playtime and logins here.'}
              </Text>
            ) : bmBusy ? (
              <ActivityIndicator color={eventPalette.blue} style={{ marginVertical: 8 }} />
            ) : bm ? (
              <View>
                {!!bm.name && <Text style={styles.bmLine}>🎮 {bm.name}</Text>}
                {bm.playtimeH != null && (
                  <Text style={styles.bmLine}>
                    ⏱ ≈{bm.playtimeH} {lang === 'ru' ? 'ч в играх BM' : 'h in BM games'}
                  </Text>
                )}
                {bm.lastLogin && (
                  <Text style={styles.bmLine}>
                    🕐 {lang === 'ru' ? 'Последний логин' : 'Last login'}: {String(bm.lastLogin).slice(0, 10)}
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.bmNote}>{bmErr || (lang === 'ru' ? 'Нет данных.' : 'No data.')}</Text>
            )}
          </View>

          <Text style={styles.disclaimer}>
            {lang === 'ru'
              ? 'Боевая статистика (K/D, точность, хедшоты) — через RustLookup (rustlookup.com), первоисточник BattleMetrics; на 25.08.2026 их бесплатный бэкенд приостановлен владельцем, поэтому секция может быть недоступна — профиль Steam при этом работает. Ruststats.com закрылся, ruststats.io жив, но выдаёт API-ключи вручную через Discord. Риск-скор ≈ — локальная эвристика по банам и возрасту аккаунта, не официальный рейтинг.'
              : 'Combat stats (K/D, accuracy, headshots) come via RustLookup (rustlookup.com), sourced from BattleMetrics; as of 25.08.2026 their free backend is suspended by its owner, so this section may be unavailable — the Steam profile still works. Ruststats.com is dead; ruststats.io is alive but issues API keys manually via Discord. Risk score ≈ is a local heuristic, not an official rating.'}
          </Text>
        </GlassCard>
      )}

      {/* Список отслеживаемых */}
      <GlassCard>
        <SectionHeader icon="🎯" color={eventPalette.purple} title={lang === 'ru' ? 'Отслеживание' : 'Tracking'} />
        {tracked.length === 0 ? (
          <Text style={styles.hint}>
            {lang === 'ru'
              ? 'Никого не отслеживаем. Найди игрока и нажми «Отслеживать» — приложение будет проверять его онлайн раз в 2 минуты и уведомит, когда он появится или уйдёт.'
              : 'Nobody tracked yet. Find a player and tap "Track" — the app checks them every 2 minutes and notifies when they come online or leave.'}
          </Text>
        ) : (
          tracked.map((p) => (
            <View key={p.id64} style={styles.trackRow}>
              {p.avatar ? (
                <Image source={{ uri: p.avatar }} style={styles.trackAvatar} />
              ) : (
                <View style={[styles.trackAvatar, styles.avatarPh]}><Text style={{ fontSize: 12 }}>👤</Text></View>
              )}
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.trackName} numberOfLines={1}>{p.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <PulsingDot size={5} color={p.online === 'online' ? eventPalette.green : 'rgba(255,255,255,0.3)'} />
                  <Text style={{ color: p.online === 'online' ? eventPalette.green : colors.textMuted, fontSize: 10.5 }}>
                    {p.online === 'online' ? (lang === 'ru' ? 'в сети' : 'online') : lang === 'ru' ? 'не в сети' : 'offline'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => removeTracked(p.id64)}>
                <Text style={styles.trackRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </GlassCard>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// РЕЖИМ «СЕРВЕР»
// ═══════════════════════════════════════════════════════════
function ServerLookup({ lang, live }) {
  const isLive = !!(live && live.mode !== 'mock');
  const srv = isLive ? live.server : null;
  const wipeDays = srv && srv.wipeTime ? Math.max(0, Math.floor((Date.now() / 1000 - srv.wipeTime) / 86400)) : null;
  const gt = srv && srv.gameTimeH != null ? formatGameTime(srv.gameDay, srv.gameTimeH) : null;

  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [results, setResults] = useState([]);
  const [bmKey, setBmKey] = useState('');

  useEffect(() => {
    loadBmKey().then(setBmKey);
  }, []);

  const doSearch = async () => {
    setErr(null);
    setResults([]);
    const query = q.trim();
    if (!query) return;
    setLoading(true);
    try {
      if (/^\d{1,3}(\.\d{1,3}){3}/.test(query)) {
        const ip = (query.match(/\d{1,3}(\.\d{1,3}){3}/) || [query])[0];
        const list = await fetchServersAtIP(ip);
        setResults(list.map((s) => ({ ...s, src: 'steam' })));
        if (!list.length) setErr(lang === 'ru' ? 'Rust-серверов на этом адресе Steam не видит.' : 'Steam sees no Rust servers at this address.');
      } else if (bmKey) {
        const list = await bmSearchServers(query, bmKey);
        setResults(
          list.map((s) => ({
            name: s.name,
            addr: s.ip ? s.ip + (s.port ? ':' + s.port : '') : '—',
            players: s.players,
            maxPlayers: s.maxPlayers,
            map: s.details && s.details.map ? s.details.map : '',
            src: 'bm',
          }))
        );
        if (!list.length) setErr(lang === 'ru' ? 'BattleMetrics: ничего не найдено.' : 'BattleMetrics: nothing found.');
      } else {
        throw new Error(
          lang === 'ru'
            ? 'Поиск по имени работает только через BattleMetrics (платный API-ключ — в Настройках). Поиск по IP бесплатный: введи адрес вида 185.44.80.20'
            : 'Name search requires BattleMetrics (paid API key — see Settings). IP search is free: enter an address like 185.44.80.20'
        );
      }
    } catch (e) {
      setErr((e && e.message) || (lang === 'ru' ? 'Ошибка запроса' : 'Request failed'));
    }
    setLoading(false);
  };

  const summary = [
    {
      icon: '👥',
      value: srv ? `${srv.playersN}/${srv.maxPlayers}` : '—',
      label: { ru: 'Онлайн', en: 'Players' },
    },
    {
      icon: gt ? gt.icon : '🕐',
      value: gt ? gt.hhmm : '—',
      label: gt ? { ru: `День ${gt.day}`, en: `Day ${gt.day}` } : { ru: 'Время', en: 'Time' },
    },
    {
      icon: '🔄',
      value: wipeDays != null ? `${wipeDays}${lang === 'ru' ? ' дн' : 'd'}` : '—',
      label: { ru: 'Вайп', en: 'Wipe' },
    },
    {
      icon: '🗺️',
      value: srv ? `${Math.max(1, Math.round(srv.mapSizeM / 1000))}K` : '—',
      label: { ru: 'Карта', en: 'Map' },
    },
  ];

  return (
    <View>
      {/* Наш сервер: живые плитки + очередь */}
      <GlassCard>
        <SectionHeader icon="📡" color={eventPalette.blue} title={lang === 'ru' ? 'Наш сервер' : 'Our server'} />
        {isLive && !!srv && (
          <Text style={styles.serverName} numberOfLines={1}>
            {srv.name}
            {!!srv.seed ? ` · seed ${srv.seed}` : ''}
          </Text>
        )}
        {!isLive && (
          <Text style={styles.hint}>
            {lang === 'ru'
              ? 'Живые цифры появятся после подключения Firebase или прямого Rust+. Демо-данные не показываем.'
              : 'Live numbers appear after connecting Firebase or direct Rust+. No demo data here.'}
          </Text>
        )}
        <View style={styles.tileGrid}>
          {summary.map((s, i) => (
            <View key={i} style={styles.tile}>
              <Text style={{ fontSize: 15 }}>{s.icon}</Text>
              <Text style={styles.tileValue}>{s.value}</Text>
              <Text style={styles.tileLabel}>{lang === 'ru' ? s.label.ru : s.label.en}</Text>
            </View>
          ))}
        </View>

        {/* Очередь сейчас + алерт (модуль 9) */}
        <View style={styles.queueRow}>
          <Text style={styles.queueNow}>
            ⏳ {srv ? srv.queued : '—'} {lang === 'ru' ? 'в очереди' : 'queued'}
          </Text>
        </View>
        <QueueAlertSection lang={lang} queued={srv ? srv.queued : null} />

        {/* История онлайна/очереди за 24 ч + алерты рестарта/связи */}
        <View style={styles.histDivider} />
        <SectionHeader icon="📈" color={eventPalette.teal} title={lang === 'ru' ? 'История (24 ч)' : 'History (24 h)'} />
        <SrvHistoryCard lang={lang} />
      </GlassCard>

      {/* Чужой сервер: по IP (Steam, бесплатно) или по имени (BM) */}
      <GlassCard>
        <SectionHeader icon="🌐" color={eventPalette.teal} title={lang === 'ru' ? 'Пробив сервера' : 'Server lookup'} />
        <View style={styles.searchRow}>
          <TextInput
            value={q}
            onChangeText={setQ}
            onSubmitEditing={doSearch}
            placeholder={lang === 'ru' ? 'IP сервера или название' : 'Server IP or name'}
            placeholderTextColor="rgba(255,255,255,0.3)"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />
          <TouchableOpacity style={styles.goBtn} onPress={doSearch} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontSize: 15 }}>🔍</Text>}
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>
          {lang === 'ru'
            ? 'По IP — открытый эндпоинт Steam (без ключей): онлайн, карта, название всех Rust-серверов на адресе. По имени — только через BattleMetrics (ключ в Настройках).'
            : 'By IP — open Steam endpoint (no key): name, map and players of every Rust server at the address. By name — BattleMetrics only (key in Settings).'}
        </Text>
        {!!err && <Text style={styles.errTxt}>⚠ {err}</Text>}
        {results.map((s, i) => (
          <View key={i} style={styles.shopCard}>
            <Text style={styles.shopName}>{s.name || '—'}</Text>
            <Text style={styles.shopOrder}>
              👥 {s.players ?? '—'}/{s.maxPlayers ?? '—'}
              {!!s.map ? ` · 🗺 ${s.map}` : ''}
              {` · ${s.addr}`}
              {s.src === 'bm' ? ' · BattleMetrics' : ''}
            </Text>
          </View>
        ))}
      </GlassCard>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
export default function IntelScreen({ lang, live }) {
  const [mode, setMode] = useState('player');
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <GlassCard>
        <Segmented
          value={mode}
          onChange={setMode}
          color={eventPalette.orange}
          options={[
            { value: 'player', label: lang === 'ru' ? 'Игрок' : 'Player' },
            { value: 'server', label: lang === 'ru' ? 'Сервер' : 'Server' },
          ]}
        />
      </GlassCard>
      {mode === 'player' ? <PlayerLookup lang={lang} /> : <ServerLookup lang={lang} live={live} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.textMuted, fontSize: 10, lineHeight: 15, marginTop: 8 },
  errTxt: { color: eventPalette.red, fontSize: 11, marginTop: 8, lineHeight: 15 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 13,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  goBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: eventPalette.blue,
  },
  profHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 64, height: 64, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)' },
  avatarPh: { alignItems: 'center', justifyContent: 'center' },
  profName: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  profId: { color: colors.textMuted, fontSize: 10.5, marginTop: 2 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  trackBtn: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: 'rgba(167,139,250,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.45)',
    maxWidth: 110,
  },
  trackBtnOn: { backgroundColor: 'rgba(52,211,153,0.16)', borderColor: 'rgba(52,211,153,0.45)' },
  trackBtnTxt: { color: '#b9a4ff', fontSize: 10.5, fontWeight: '700' },
  trackBtnTxtOn: { color: eventPalette.green },
  banner: { borderRadius: 12, padding: 11, marginBottom: 8, borderWidth: 1 },
  bannerRed: { backgroundColor: 'rgba(248,113,113,0.12)', borderColor: 'rgba(248,113,113,0.35)' },
  bannerAmber: { backgroundColor: 'rgba(251,191,36,0.10)', borderColor: 'rgba(251,191,36,0.35)' },
  bannerGreen: { backgroundColor: 'rgba(52,211,153,0.10)', borderColor: 'rgba(52,211,153,0.3)' },
  bannerTitle: { color: colors.textPrimary, fontSize: 12, fontWeight: '600', lineHeight: 16 },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  tile: {
    width: '47%',
    flexGrow: 1,
    borderRadius: 14,
    padding: 11,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tileValue: { color: colors.textPrimary, fontSize: 13.5, fontWeight: '700', marginTop: 4 },
  tileLabel: { color: colors.textMuted, fontSize: 9.5, marginTop: 3 },
  bmBox: {
    borderRadius: 14,
    padding: 11,
    backgroundColor: 'rgba(96,165,250,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.22)',
    marginBottom: 8,
  },
  bmTitle: { color: eventPalette.blue, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  bmLine: { color: colors.textSecondary, fontSize: 11.5, marginTop: 2 },
  bmNote: { color: colors.textMuted, fontSize: 10.5, lineHeight: 15 },
  disclaimer: { color: colors.textMuted, fontSize: 10, fontStyle: 'italic', lineHeight: 14 },
  subHead: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 12,
    marginBottom: 8,
  },
  bannerSub: { color: colors.textSecondary, fontSize: 10.5, marginTop: 3, lineHeight: 14 },
  barLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  barValue: { fontSize: 11.5, fontWeight: '700' },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  barFill: { height: 6, borderRadius: 3 },
  kdRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 10 },
  kdValue: { fontSize: 30, fontWeight: '800' },
  kdLabel: { color: colors.textMuted, fontSize: 10.5, flex: 1 },
  srvRow: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 7,
  },
  srvName: { color: colors.textPrimary, fontSize: 12.5, fontWeight: '600' },
  srvMeta: { color: colors.textMuted, fontSize: 10.5, marginTop: 3 },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
  },
  trackAvatar: { width: 36, height: 36, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.08)' },
  trackName: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  trackRemove: { color: eventPalette.red, fontSize: 15, paddingHorizontal: 8 },
  serverName: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  queueRow: { marginTop: 4, marginBottom: 6 },
  queueNow: { color: colors.textSecondary, fontSize: 12.5, fontWeight: '600' },
  histDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  chipActive: {
    backgroundColor: 'rgba(45,212,191,0.16)',
    borderColor: 'rgba(45,212,191,0.45)',
  },
  chipTxt: { color: colors.textSecondary, fontSize: 12 },
  chipTxtActive: { color: eventPalette.teal, fontWeight: '700' },
  queueFired: {
    marginTop: 10,
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(52,211,153,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.4)',
  },
  queueFiredTxt: { color: eventPalette.green, fontSize: 13, fontWeight: '700' },
  shopCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 11,
    marginBottom: 8,
  },
  shopName: { color: colors.textPrimary, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  shopOrder: { color: colors.textSecondary, fontSize: 11.5, marginTop: 2 },
});
