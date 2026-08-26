// ─────────────────────────────────────────────────────────
// ЭКРАН 6: НАСТРОЙКИ S-eye viewer.
// Сверху — профиль (SteamID из настроек источника; если это
// ID64, подтягиваем ник и аватар открытым XML-эндпоинтом
// Steam Community), затем источник данных, интерфейс
// (язык + формат времени), уведомления (не беспокоить,
// звуковые эффекты, нативные пуши — последние два честно
// помечены как зарезервированные), ключ BattleMetrics
// (опциональная платная подписка для Пробива), фон
// приложения и конструктор главного экрана.
// ─────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Image, TextInput, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors, eventPalette } from './theme';
import { GlassCard, SectionHeader } from './ui';
import { getTimeFmt, storeTimeFmt } from './live';
import { useNotifs, setDnd, setKindEnabled } from './notifStore';
import { fetchSteamProfile, loadBmKey, storeBmKey } from './lookup';
import { AdminPanelScreen } from './AdminPanelScreen';

const SOUND_KEY = 'rc_sound_v1';
const NATIVE_NOTIF_KEY = 'rc_native_v1';

const MODE_NAME = {
  mock: { ru: 'Демо-данные', en: 'Demo data' },
  firebase: { ru: 'Firebase (живые данные)', en: 'Firebase (live data)' },
  rustplus: { ru: 'Rust+ напрямую', en: 'Direct Rust+' },
};

// Переключатель с хранением в AsyncStorage («1»/«0»)
function useStoredSwitch(key, defValue = false) {
  const [v, setV] = useState(defValue);
  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((x) => setV(x == null ? defValue : x === '1'))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const toggle = () => {
    const n = !v;
    setV(n);
    AsyncStorage.setItem(key, n ? '1' : '0').catch(() => {});
  };
  return [v, toggle];
}

// Строка-настройка с переключателем (стиль списка с фото)
function ToggleRow({ icon, label, value, onChange }) {
  return (
    <View style={styles.dashRow}>
      <Text style={{ fontSize: 14 }}>{icon}</Text>
      <Text style={styles.dashLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(45,212,191,0.5)' }}
        thumbColor="#fff"
      />
    </View>
  );
}

// ── Профиль игрока: SteamID из источника (+ник/аватар из Steam XML) ──
function ProfileCard({ lang, source, onOpenSource }) {
  const steamId = String((source && source.cfg && source.cfg.steamId) || '').trim();
  const okId64 = /^\d{17}$/.test(steamId);
  const [prof, setProf] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setProf(null);
    if (!okId64) return undefined;
    setLoading(true);
    fetchSteamProfile(steamId)
      .then((p) => {
        if (alive) setProf(p);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [steamId, okId64]);

  return (
    <View style={styles.srcCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {prof && prof.avatar ? (
          <Image source={{ uri: prof.avatar }} style={styles.avatarImg} />
        ) : (
          <View style={[styles.avatarImg, styles.avatarPh]}>
            <Text style={{ fontSize: 24 }}>{okId64 ? '' : '👤'}</Text>
            {okId64 && loading && <ActivityIndicator color={eventPalette.blue} />}
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.profileName} numberOfLines={1}>
            {prof ? prof.name : lang === 'ru' ? 'Игрок' : 'Player'}
          </Text>
          <Text style={styles.profileSub} numberOfLines={1}>
            {steamId ? steamId : lang === 'ru' ? 'SteamID не указан' : 'No SteamID set'}
          </Text>
          {!!prof && prof.onlineState === 'online' && (
            <Text style={[styles.profileSub, { color: eventPalette.green }]}>
              ● {lang === 'ru' ? 'в сети' : 'online'}
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.btn} onPress={onOpenSource}>
        <Text style={styles.btnTxt}>
          🔑 {lang === 'ru' ? 'Изменить Steam / сервер' : 'Change Steam / server'}
        </Text>
      </TouchableOpacity>
      {!steamId && (
        <Text style={styles.hint}>
          {lang === 'ru'
            ? 'SteamID вводится в настройках источника (Firebase или Rust+) — он же используется командами бота.'
            : 'The SteamID lives in the data-source settings (Firebase or Rust+) — bots use it too.'}
        </Text>
      )}
    </View>
  );
}

// ── Формат времени: 24ч / 12ч / Авто ──
function TimeFormatRow({ lang }) {
  const cur = getTimeFmt(); // '24' | '12' | 'auto'
  const [val, setVal] = useState(cur);
  const opts = [
    { v: '24', label: lang === 'ru' ? '24 ч' : '24h' },
    { v: '12', label: lang === 'ru' ? '12 ч' : '12h' },
    { v: 'auto', label: lang === 'ru' ? 'Авто' : 'Auto' },
  ];
  const pick = (v) => {
    setVal(v);
    storeTimeFmt(v);
  };
  return (
    <View style={styles.langRow}>
      <Text style={styles.langLabel}>{lang === 'ru' ? 'Формат времени' : 'Time format'}</Text>
      <View style={styles.segWrap}>
        {opts.map((o) => (
          <TouchableOpacity key={o.v} style={[styles.segBtn, val === o.v && styles.segBtnActive]} onPress={() => pick(o.v)}>
            <Text style={[styles.segBtnTxt, val === o.v && styles.segBtnTxtActive]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Ключ BattleMetrics для Пробива (опционально) ──
function BmKeySection({ lang }) {
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    loadBmKey().then(setKey);
  }, []);
  const save = async () => {
    await storeBmKey(key.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };
  return (
    <View>
      <TextInput
        style={styles.keyInput}
        value={key}
        onChangeText={setKey}
        placeholder={lang === 'ru' ? 'Ключ API BattleMetrics (необязательно)' : 'BattleMetrics API key (optional)'}
        placeholderTextColor="rgba(255,255,255,0.3)"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity style={[styles.btn, { marginTop: 10 }]} onPress={save}>
        <Text style={styles.btnTxt}>{saved ? (lang === 'ru' ? '✓ Сохранено' : '✓ Saved') : lang === 'ru' ? 'Сохранить ключ' : 'Save key'}</Text>
      </TouchableOpacity>
      <Text style={styles.hint}>
        {lang === 'ru'
          ? 'API BattleMetrics работает только с платной подпиской. Без ключа Пробив использует открытые данные Steam — этого достаточно для профиля, VAC и трекинга.'
          : 'The BattleMetrics API requires a paid subscription. Without a key, Intel uses open Steam data — enough for profiles, VAC and tracking.'}
      </Text>
    </View>
  );
}

// ── Фон приложения: своё фото из галереи + уровень затемнения ──
// Фото сразу конвертируем в уменьшенный base64-jpeg: content:// URI
// из пикера теряет доступ после перезапуска, а data-URI живёт в
// AsyncStorage вечно. Размытие не делаем честно: настоящий blur на
// Android дорогой — вместо него затемнение поверх фото.
const DIM_PRESETS = [
  { v: 0.3, label: '30%' },
  { v: 0.45, label: '45%' },
  { v: 0.6, label: '60%' },
  { v: 0.75, label: '75%' },
];

function BackgroundSection({ lang, bg, onChangeBg }) {
  const [busy, setBusy] = useState(false);
  const hasBg = !!(bg && bg.uri);
  const dim = hasBg && bg.dim != null ? bg.dim : 0.55;

  const pickPhoto = () => {
    setBusy(true);
    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: true,
        maxWidth: 1440, // ужимаем заранее: меньше память и AsyncStorage
        maxHeight: 1440,
        quality: 0.7,
      },
      (res) => {
        setBusy(false);
        const a = res && res.assets && res.assets[0];
        if (!res.didCancel && res.errorCode == null && a && a.base64) {
          onChangeBg({ uri: `data:${a.type || 'image/jpeg'};base64,${a.base64}`, dim });
        }
      }
    );
  };

  return (
    <View>
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.btnFlex} onPress={pickPhoto} disabled={busy}>
          <Text style={styles.btnTxt}>{busy ? '...' : lang === 'ru' ? '🖼 Выбрать фото' : '🖼 Pick photo'}</Text>
        </TouchableOpacity>
        {hasBg && (
          <TouchableOpacity style={[styles.btnFlex, styles.btnDanger]} onPress={() => onChangeBg(null)}>
            <Text style={styles.btnTxt}>{lang === 'ru' ? 'Сбросить' : 'Reset'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {hasBg && (
        <>
          <Text style={styles.subLabel}>{lang === 'ru' ? 'Затемнение' : 'Dimming'}</Text>
          <View style={styles.chipRow}>
            {DIM_PRESETS.map((p) => (
              <TouchableOpacity
                key={p.v}
                style={[styles.chip, Math.abs(dim - p.v) < 0.01 && styles.chipActive]}
                onPress={() => onChangeBg({ uri: bg.uri, dim: p.v })}
              >
                <Text style={[styles.chipTxt, Math.abs(dim - p.v) < 0.01 && styles.chipTxtActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.hint}>
            {lang === 'ru'
              ? 'Размытие (blur) на Android дорогое — вместо него фото приглушается затемнением. Фото хранится только на телефоне.'
              : 'Real blur is expensive on Android — the photo is dimmed instead. The photo stays on your phone only.'}
          </Text>
        </>
      )}
    </View>
  );
}

// ── Конструктор главного экрана: какие виджеты показывать на «Мейне» ──
// Карточку сервера нельзя выключить — она же кнопка подключения.
function DashboardSection({ lang, dash, onChangeDash }) {
  const rows = [
    { key: 'minimap', icon: '🗺️', label: { ru: 'Мини-карта', en: 'Mini-map' } },
    { key: 'team', icon: '👥', label: { ru: 'Тимейты', en: 'Teammates' } },
    { key: 'feed', icon: '🔔', label: { ru: 'Лог тревог и событий', en: 'Alarms & Events' } },
  ];
  return (
    <View>
      {rows.map((r) => (
        <ToggleRow
          key={r.key}
          icon={r.icon}
          label={lang === 'ru' ? r.label.ru : r.label.en}
          value={dash[r.key] !== false}
          onChange={(v) => onChangeDash({ ...dash, [r.key]: v })}
        />
      ))}
      <Text style={styles.hint}>
        {lang === 'ru'
          ? 'Карточка сервера видна всегда — она же кнопка подключения.'
          : 'The server card is always visible — it doubles as the connect button.'}
      </Text>
    </View>
  );
}

// ── Облачный бэкап настроек (модуль 1 спецификации) ──
// Только в Firebase-режиме: настройки пишутся в ту же базу,
// узел /users/<steamId>/settings. Что бэкапим: язык, формат
// времени, виджеты главного экрана, категории уведомлений,
// трекинг Пробива и vending-избранное. Фон-фото НЕ бэкапим —
// data-URI раздувает базу (и её лимиты). Язык/виджеты/категории
// применяются сразу, остальное — после перезапуска приложения
// (модульные сторы кэшируются в памяти).
const BACKUP_KEYS = [
  'rc_lang_v1',
  'rc_timefmt_v1',
  'rc_dash_v1',
  'rc_notifcfg_v1',
  'rc_track_v1',
  'rc_vend_fav_v1',
];

function CloudBackupSection({ lang, source, onChangeDash, setLang }) {
  const isRu = lang === 'ru';
  const [busy, setBusy] = useState(null); // 'up' | 'down' | null
  const [msg, setMsg] = useState(null); // { ok, txt }
  const cfg = (source && source.cfg) || {};
  const okId = /^\d{17}$/.test(String(cfg.steamId || '').trim());
  const okUrl = /^https?:\/\//.test(String(cfg.fbUrl || '').trim());
  const ready = source && source.mode === 'firebase' && okId && okUrl;
  const base = String(cfg.fbUrl || '').replace(/\/+$/, '') + '/users/' + String(cfg.steamId || '').trim() + '/settings.json';
  const url = cfg.fbAuth ? base + '?auth=' + encodeURIComponent(cfg.fbAuth) : base;

  const upload = async () => {
    setBusy('up');
    setMsg(null);
    try {
      const vals = await Promise.all(BACKUP_KEYS.map((k) => AsyncStorage.getItem(k)));
      const keys = {};
      BACKUP_KEYS.forEach((k, i) => {
        if (vals[i] != null) keys[k] = vals[i];
      });
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys, savedAt: Date.now() }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setMsg({ ok: true, txt: isRu ? '✓ Копия сохранена в базу' : '✓ Backup saved to the database' });
    } catch (e) {
      setMsg({ ok: false, txt: '⚠ ' + ((e && e.message) || 'error') });
    }
    setBusy(null);
  };

  const download = async () => {
    setBusy('down');
    setMsg(null);
    try {
      const res = await fetch(url);
      if (res.status === 404 || res.status === 401 || res.status === 403) {
        throw new Error(isRu ? 'Копия не найдена (или нет доступа)' : 'No backup found (or access denied)');
      }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json();
      const keys = j && j.keys;
      if (!keys || typeof keys !== 'object') throw new Error(isRu ? 'В базе нет сохранённых ключей' : 'No saved keys in the database');
      await Promise.all(
        Object.keys(keys)
          .filter((k) => BACKUP_KEYS.indexOf(k) >= 0 && keys[k] != null)
          .map((k) => AsyncStorage.setItem(k, String(keys[k])))
      );
      // Что можно применить сразу — применяем через сеттеры
      try {
        if (keys.rc_lang_v1 === 'ru' || keys.rc_lang_v1 === 'en') setLang(keys.rc_lang_v1);
        if (keys.rc_dash_v1) onChangeDash(JSON.parse(keys.rc_dash_v1));
        if (keys.rc_notifcfg_v1) {
          const c = JSON.parse(keys.rc_notifcfg_v1);
          Object.keys(c).forEach((k) => setKindEnabled(k, c[k] !== false));
        }
        if (keys.rc_timefmt_v1) storeTimeFmt(keys.rc_timefmt_v1);
      } catch (e) {}
      setMsg({
        ok: true,
        txt: isRu
          ? '✓ Восстановлено. Трекинг и vending-избранное полностью подхватятся после перезапуска приложения.'
          : '✓ Restored. Tracking and vending favorites fully apply after an app restart.',
      });
    } catch (e) {
      setMsg({ ok: false, txt: '⚠ ' + ((e && e.message) || 'error') });
    }
    setBusy(null);
  };

  if (!source || source.mode !== 'firebase') return null;
  return (
    <GlassCard>
      <SectionHeader icon="☁️" color={eventPalette.blue} title={isRu ? 'Облако: копия настроек' : 'Cloud: settings backup'} />
      {!ready ? (
        <Text style={styles.hint}>
          {isRu
            ? 'Нужны URL базы и SteamID в настройках источника — копия хранится в /users/<SteamID>/settings той же базы.'
            : 'Needs the database URL and a SteamID in the source settings — the copy is stored at /users/<SteamID>/settings of the same database.'}
        </Text>
      ) : (
        <View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={[styles.btnFlex, styles.btnRestore]} onPress={upload} disabled={!!busy}>
              {busy === 'up' ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnTxt}>☁️↑ {isRu ? 'Сохранить копию' : 'Save backup'}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnFlex, styles.btnRestore]} onPress={download} disabled={!!busy}>
              {busy === 'down' ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnTxt}>☁️↓ {isRu ? 'Восстановить' : 'Restore'}</Text>
              )}
            </TouchableOpacity>
          </View>
          {!!msg && <Text style={[styles.backupMsg, { color: msg.ok ? eventPalette.green : eventPalette.red }]}>{msg.txt}</Text>}
          <Text style={styles.hint}>
            {isRu
              ? 'В копию входят: язык, формат времени, главный экран, категории уведомлений, трекинг Пробива, vending-избранное. Фон-фото не переносится — он слишком большой для базы.'
              : 'Included: language, time format, main-screen widgets, notification categories, Intel tracking, vending favorites. The background photo is not synced — too large for the database.'}
          </Text>
        </View>
      )}
    </GlassCard>

    {/* Подраздел: Аккаунты */}
    <GlassCard>
      <Text style={styles.screenTitle}>{lang === 'ru' ? '👤 Аккаунт' : '👤 Account'}</Text>
      <Text style={styles.subsection}>{lang === 'ru' ? 'Создание / вход — локально (AsyncStorage)' : 'Create / sign in — local (AsyncStorage)'}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 11 }}>
        {lang === 'ru' ? 'Имя / SteamID / пароль не хранятся на сервере — только в устройстве. Для реальной авторизации подключи Firebase Auth или Steam OAuth.'
         : 'Name / SteamID / password stay on device only. For real auth, connect Firebase Auth or Steam OAuth later.'}
      </Text>
      <Text style={{ color: eventPalette.blue, fontSize: 12, fontWeight: '700', marginTop: 4 }}>{lang === 'ru' ? '→ Регистрация / вход пока заглушка; реальные аккаунты — в следующем обновлении.' : '→ Registration / login stub only; real accounts in next update.'}</Text>
    </GlassCard>

    {/* Подраздел: Админ-панель */}
    <GlassCard>
      <Text style={styles.screenTitle}>{lang === 'ru' ? '🔐 Админ-панель' : '🔐 Admin Panel'}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 11, marginBottom: 6 }}>
        {lang === 'ru' ? 'Локальные права. Пока нет системы аккаунтов — флаг в Настройках (rc_admin_v1).' : 'Local rights. No accounts system yet — flag in Settings (rc_admin_v1).'}
      </Text>
      <AdminPanelScreen lang={lang} />
    </GlassCard>
  );
}

export default function SettingsScreen({
  lang,
  setLang,
  t,
  live,
  source,
  onOpenSource,
  bg,
  onChangeBg,
  dash,
  onChangeDash,
  onLogout,
}) {
  const isLive = !!(live && live.mode !== 'mock');
  const mockLinked = !!(source && source.mode === 'mock' && source.linked);

  // Уведомления: DND живёт в notifStore, звуки и нативные пуши — пока флаги
  const { dnd } = useNotifs();
  const [sound, toggleSound] = useStoredSwitch(SOUND_KEY);
  const [nativeN, toggleNativeN] = useStoredSwitch(NATIVE_NOTIF_KEY);

  const statusMap = {
    connected: { txt: { ru: 'Подключено', en: 'Connected' }, color: eventPalette.green },
    connecting: { txt: { ru: 'Подключение…', en: 'Connecting…' }, color: eventPalette.yellow },
    disconnected: { txt: { ru: 'Отключено', en: 'Disconnected' }, color: eventPalette.red },
    offline: { txt: { ru: 'Нет сети / сервер недоступен', en: 'Offline / server unreachable' }, color: eventPalette.red },
    idle: { txt: { ru: 'Не подключено', en: 'Not connected' }, color: colors.textMuted },
  };
  const st = statusMap[isLive ? live.status : mockLinked ? 'connected' : 'idle'] || statusMap.idle;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Профиль (photo_3) */}
      <GlassCard>
        <SectionHeader icon="👤" color={eventPalette.blue} title={lang === 'ru' ? 'Профиль' : 'Profile'} />
        <ProfileCard lang={lang} source={source} onOpenSource={onOpenSource} />
      </GlassCard>

      {/* Источник данных */}
      <GlassCard>
        <SectionHeader icon="🔌" color={eventPalette.blue} title={lang === 'ru' ? 'Источник данных' : 'Data Source'} />

        <View style={styles.srcCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.modeName}>{t(MODE_NAME[source && source.mode] || MODE_NAME.mock)}</Text>
            <View style={[styles.dot, { backgroundColor: st.color }]} />
          </View>
          <Text style={[styles.statusTxt, { color: st.color }]}>{t(st.txt)}</Text>
          {isLive && !!live.error && <Text style={styles.errTxt}>⚠ {live.error}</Text>}

          <TouchableOpacity style={styles.btn} onPress={onOpenSource}>
            <Text style={styles.btnTxt}>
              ⚙ {lang === 'ru' ? 'Изменить источник' : 'Change source'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.footnote}>
            {lang === 'ru'
              ? 'Демо — статичные данные для знакомства с интерфейсом. Firebase читает ту же базу, что и ПК-клиент (нужен URL и секрет базы). Прямой Rust+ подключается к серверу игры с телефона без ПК-клиента — сервер должен быть доступен по сети.'
              : 'Demo is static data for exploring the UI. Firebase reads the same database as the PC client (needs URL and database secret). Direct Rust+ connects to the game server from the phone without the PC client — the server must be reachable over the network.'}
          </Text>
        </View>
      </GlassCard>

      {/* Интерфейс: язык + формат времени */}
      <GlassCard>
        <SectionHeader icon="🌐" color={eventPalette.purple} title={lang === 'ru' ? 'Интерфейс' : 'Interface'} />
        <View style={styles.langRow}>
          <Text style={styles.langLabel}>{lang === 'ru' ? 'Язык' : 'Language'}</Text>
          <View style={styles.segWrap}>
            <TouchableOpacity
              style={[styles.segBtn, lang === 'ru' && styles.segBtnActive]}
              onPress={() => setLang('ru')}
            >
              <Text style={[styles.segBtnTxt, lang === 'ru' && styles.segBtnTxtActive]}>Русский</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segBtn, lang === 'en' && styles.segBtnActive]}
              onPress={() => setLang('en')}
            >
              <Text style={[styles.segBtnTxt, lang === 'en' && styles.segBtnTxtActive]}>English</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TimeFormatRow lang={lang} />
      </GlassCard>

      {/* Уведомления */}
      <GlassCard>
        <SectionHeader icon="🔔" color={eventPalette.red} title={lang === 'ru' ? 'Уведомления' : 'Notifications'} />
        <ToggleRow
          icon="🌙"
          label={lang === 'ru' ? 'Не беспокоить' : 'Do not disturb'}
          value={dnd}
          onChange={() => setDnd(!dnd)}
        />
        <ToggleRow
          icon="🔊"
          label={lang === 'ru' ? 'Звуковые эффекты' : 'Sound effects'}
          value={sound}
          onChange={toggleSound}
        />
        <ToggleRow
          icon="📲"
          label={lang === 'ru' ? 'Нативные уведомления' : 'Native push notifications'}
          value={nativeN}
          onChange={toggleNativeN}
        />
        <Text style={styles.hint}>
          {lang === 'ru'
            ? '«Не беспокоить» глушит центр уведомлений (новые записи помечаются 🌙). Звук и системные пуши сейчас не задействованы — переключатели сохраняются на будущее.'
            : '"Do not disturb" silences the notification center (new entries get 🌙). Sounds and system push are not wired yet — toggles persist for future updates.'}
        </Text>
      </GlassCard>

      {/* Ключ BattleMetrics */}
      <GlassCard>
        <SectionHeader icon="🛰" color={eventPalette.orange} title="BattleMetrics" />
        <BmKeySection lang={lang} />
      </GlassCard>

      {/* Модуль 11: кастомизация */}
      <GlassCard>
        <SectionHeader icon="🖼" color={eventPalette.purple} title={lang === 'ru' ? 'Фон приложения' : 'App Background'} />
        <BackgroundSection lang={lang} bg={bg} onChangeBg={onChangeBg} />
      </GlassCard>

      {/* Конструктор главного экрана */}
      <GlassCard>
        <SectionHeader
          icon="🧩"
          color={eventPalette.teal}
          title={lang === 'ru' ? 'Главный экран' : 'Main Screen'}
        />
        <DashboardSection lang={lang} dash={dash} onChangeDash={onChangeDash} />
      </GlassCard>

      {/* Модуль 1: облачный бэкап настроек (только Firebase) */}
      <CloudBackupSection
        lang={lang}
        source={source}
        onChangeDash={onChangeDash}
        setLang={setLang}
      />

      {/* Выход из аккаунта: сброс источника на демо */}
      <GlassCard>
        <TouchableOpacity style={[styles.btnFlex, styles.btnDanger]} onPress={onLogout}>
          <Text style={styles.btnTxt}>🚪 {lang === 'ru' ? 'Выйти (сбросить источник)' : 'Log out (reset source)'}</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>
          {lang === 'ru'
            ? 'Отключает текущий источник и возвращает демо-данные. Настройки внешнего вида останутся.'
            : 'Disconnects the current source and returns demo data. Appearance settings stay.'}
        </Text>
      </GlassCard>

      <Text style={styles.version}>S-eye viewer · v0.4.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  srcCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 13,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modeName: { color: colors.textPrimary, fontSize: 14.5, fontWeight: '700', flex: 1 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  statusTxt: { fontSize: 11.5, marginTop: 4, fontWeight: '600' },
  errTxt: { color: eventPalette.red, fontSize: 10.5, marginTop: 6, lineHeight: 15 },
  btn: {
    marginTop: 12,
    backgroundColor: 'rgba(96,165,250,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.4)',
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnTxt: { color: colors.textPrimary, fontSize: 12.5, fontWeight: '600' },
  footnote: { color: colors.textMuted, fontSize: 10, lineHeight: 15, marginTop: 12 },
  btnRow: { flexDirection: 'row', gap: 8 },
  btnFlex: {
    flex: 1,
    backgroundColor: 'rgba(149,117,253,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(149,117,253,0.4)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnDanger: {
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderColor: 'rgba(248,113,113,0.35)',
  },
  btnRestore: {
    backgroundColor: 'rgba(96,165,250,0.14)',
    borderColor: 'rgba(96,165,250,0.4)',
  },
  backupMsg: { fontSize: 11, fontWeight: '600', marginTop: 10, lineHeight: 15 },
  subLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 14 },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  chipActive: {
    backgroundColor: 'rgba(149,117,253,0.2)',
    borderColor: 'rgba(149,117,253,0.5)',
  },
  chipTxt: { color: colors.textSecondary, fontSize: 12 },
  chipTxtActive: { color: '#b9a4ff', fontWeight: '700' },
  hint: { color: colors.textMuted, fontSize: 10, lineHeight: 15, marginTop: 10 },
  dashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  dashLabel: { flex: 1, color: colors.textPrimary, fontSize: 13.5 },
  langRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  langLabel: { color: colors.textPrimary, fontSize: 13.5 },
  segWrap: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 999, padding: 3 },
  segBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  segBtnActive: { backgroundColor: 'rgba(96,165,250,0.25)' },
  segBtnTxt: { color: colors.textSecondary, fontSize: 11.5, fontWeight: '600' },
  segBtnTxtActive: { color: '#fff' },
  avatarImg: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)' },
  avatarPh: { alignItems: 'center', justifyContent: 'center' },
  profileName: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  profileSub: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  keyInput: {
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 12.5,
    fontFamily: 'monospace',
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  version: { color: colors.textMuted, fontSize: 10, textAlign: 'center', marginTop: 6 },
});
