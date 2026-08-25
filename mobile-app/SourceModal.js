// ─────────────────────────────────────────────────────────
// SourceModal — выбор и настройка источника данных
// (демо / Firebase / прямой Rust+). RN-порт ConnectModal из
// веб-версии. Рендерится внутри <Modal> в App.js.
// Плюс визард «Как добавить сервер?»: 4 шага сопряжения
// официального Rust+. Автоперехват параметров из Steam
// (как расширение rustplusplus в Chrome) на Android
// невозможен — ОС не даёт читать чужие приложения, поэтому
// SteamID/токен вставляются руками один раз и хранятся.
// ─────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Linking,
  Alert,
  Clipboard,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { gradientColors, colors, eventPalette } from './theme';
import { Segmented } from './ui';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Официальный Rust+ от Facepunch: веб-портал со входом через Steam и
// пакет в Play Market (глубокой схемы rust+:// у приложения нет —
// открываем страницу магазина, там же кнопка «Открыть», если стоит).
const RUSTPLUS_WEB_LOGIN = 'https://companion-rust.facepunch.com/login';
const RUSTPLUS_PACKAGE = 'com.facepunch.rust.companion';
const RUSTPLUS_TOKEN_KEY = 'rc_rustplus_token_v1';
const RUSTPLUS_PLAYER_KEY = 'rc_rustplus_player_v1';

// Шаг 1 сопряжения: кнопки в официальный Rust+ (веб/магазин) + подсказка
function RustPlusHelper({ lang }) {
  const openWeb = async () => {
    try {
      await Linking.openURL(RUSTPLUS_WEB_LOGIN);
    } catch (e) {}
  };
  const openStore = async () => {
    try {
      await Linking.openURL('market://details?id=' + RUSTPLUS_PACKAGE);
    } catch (e) {
      try {
        await Linking.openURL('https://play.google.com/store/apps/details?id=' + RUSTPLUS_PACKAGE);
      } catch (e2) {}
    }
  };
  return (
    <View style={styles.pairBox}>
      <Text style={styles.pairTitle}>
        {lang === 'ru' ? 'Шаг 1 · Сопряжение через официальный Rust+' : 'Step 1 · Pair via official Rust+'}
      </Text>
      <View style={styles.pairBtnRow}>
        <TouchableOpacity style={styles.pairBtn} onPress={openWeb}>
          <Text style={styles.pairBtnTxt}>🌐 {lang === 'ru' ? 'Веб Rust+ (Steam)' : 'Rust+ web (Steam)'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pairBtn} onPress={openStore}>
          <Text style={styles.pairBtnTxt}>📲 Rust+ {lang === 'ru' ? 'в Play Market' : 'in Play Store'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>
        {lang === 'ru'
          ? 'Эти кнопки — на будущее: веб-портал НЕ обязателен. Если при входе пишет «Failed to send login message to the Rust+ app» — портал шлёт подтверждение в мобильный Rust+, а его нет. Для S-eye viewer сопряжение делается иначе: в игре ESC → Rust+ → Pair with Server → Стим пришлёт сообщение с параметрами (шаги ниже).'
          : 'These buttons are for later: the web portal is NOT required. If login says "Failed to send login message to the Rust+ app" — the portal sends a confirmation to the mobile Rust+ app, which you do not have. For S-eye viewer pair differently: in game ESC → Rust+ → Pair with Server → Steam will deliver the message with the details (steps below).'}
      </Text>
    </View>
  );
}

// Шаги визарда сопряжения (по мотивам официального клиента Rust+)
const WIZARD_STEPS = [
  {
    icon: '🎮',
    title: { ru: 'Зайди на сервер', en: 'Join the server' },
    text: {
      ru: 'Зайди на игровой сервер в Rust и нажми ESC — откроется игровое меню.',
      en: 'Join the game server in Rust and press ESC — the in-game menu opens.',
    },
  },
  {
    icon: '🧩',
    title: { ru: 'Выбери «Rust+»', en: 'Choose "Rust+"' },
    text: {
      ru: 'В меню слева найди пункт Rust+ и нажми его.',
      en: 'In the left-hand menu find the Rust+ entry and tap it.',
    },
  },
  {
    icon: '🔗',
    title: { ru: 'Нажми «Pair with Server»', en: 'Tap "Pair with Server"' },
    text: {
      ru: 'Сервер должен поддерживать Rust+ (иконка молнии рядом с названием в списке серверов). После нажатия сервер пришлёт параметры сопряжения.',
      en: 'The server must support Rust+ (a lightning icon next to its name in the server list). After tapping, the server sends pairing details.',
    },
  },
  {
    icon: '📋',
    title: { ru: 'Вставь SteamID и токен сюда', en: 'Paste SteamID & token here' },
    text: {
      ru: 'Параметры приходят в стиме (уведомление Rust+ Friend). Скопируй оттуда SteamID и Player Token в форму ниже — они сохранятся, повторное сопряжение не потребуется.',
      en: 'The details arrive on Steam (the Rust+ Friend notification). Copy the SteamID and Player Token into the form below — they persist, no re-pairing needed.',
    },
  },
];

export default function SourceModal({
  lang = 'ru',
  initial,
  liveStatusText,
  liveError,
  liveMySteamId, // mySteamId из live.js для диагностики
  onClose,
  onSave,
}) {
  const cfg0 = (initial && initial.cfg) || {};
  const [mode, setMode] = useState((initial && initial.mode) || 'mock');
  const [fbUrl, setFbUrl] = useState(cfg0.fbUrl || '');
  const [fbAuth, setFbAuth] = useState(cfg0.fbAuth || '');
  const [steamId, setSteamId] = useState(cfg0.steamId || '');
  const [ip, setIp] = useState(cfg0.ip || '');
  const [port, setPort] = useState(cfg0.port || '28082');
  const [token, setToken] = useState(cfg0.token || '');
  const [entitiesJson, setEntitiesJson] = useState(
    cfg0.entitiesJson ||
      '[\n  { "id": 123456, "name": "Свет на ферме", "type": "switch" }\n]'
  );

  // Состояния визарда паринга
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0); // 0-3 для 4 шагов
  const [pairingMode, setPairingMode] = useState(false); // true = авто-режим паринга
  const [diagOpen, setDiagOpen] = useState(false); // модалка диагностики SteamID
  const [diagMessage, setDiagMessage] = useState('');

  // При первом открытии Rust+ режима — если токенов нет в AsyncStorage, открываем визард
  useEffect(() => {
    if (mode === 'rustplus' && !steamId && !token) {
      checkStoredAuthAndMaybeOpenWizard();
    }
  }, [mode, steamId, token]);

  const checkStoredAuthAndMaybeOpenWizard = async () => {
    try {
      const [storedToken, storedPlayer] = await Promise.all([
        AsyncStorage.getItem(RUSTPLUS_TOKEN_KEY),
        AsyncStorage.getItem(RUSTPLUS_PLAYER_KEY),
      ]);
      if (storedToken && storedPlayer) {
        // Есть сохранённые — автозаполняем форму
        setToken(storedToken);
        setSteamId(storedPlayer);
      } else {
        // Нет сохранённых — открываем визард паринга
        setWizardOpen(true);
        setWizardStep(0);
        setPairingMode(true);
      }
    } catch (e) {
      // ignore
    }
  };

  let canSave = true;
  if (mode === 'firebase') canSave = /^https?:\/\//.test(fbUrl.trim());
  if (mode === 'rustplus') {
    canSave =
      !!ip.trim() &&
      /^\d+$/.test(String(steamId).trim()) &&
      !!String(token).trim();
  }

  const save = () => {
    if (!canSave) return;
    if (mode === 'mock') return onSave({ mode: 'mock', linked: true, cfg: {} });
    if (mode === 'firebase') {
      return onSave({
        mode: 'firebase',
        linked: true,
        cfg: { fbUrl: fbUrl.trim().replace(/\/+$/, ''), fbAuth: fbAuth.trim(), steamId: String(steamId).trim() },
      });
    }
    // Rust+ режим — сохраняем токены в AsyncStorage
    if (mode === 'rustplus') {
      const cfg = {
        ip: ip.trim(),
        port: String(parseInt(port, 10) || 28082),
        steamId: String(steamId).trim(),
        token: String(token).trim(),
        entitiesJson,
      };
      AsyncStorage.setItem(RUSTPLUS_TOKEN_KEY, cfg.token);
      AsyncStorage.setItem(RUSTPLUS_PLAYER_KEY, cfg.steamId);
      return onSave({ mode: 'rustplus', linked: true, cfg });
    }
  };

  const handleWizardNext = () => {
    if (wizardStep < WIZARD_STEPS.length - 1) {
      setWizardStep(wizardStep + 1);
    } else {
      // Последний шаг — закрываем визард, фокус на полях ввода
      setWizardOpen(false);
      setPairingMode(false);
    }
  };

  const handleWizardPrev = () => {
    if (wizardStep > 0) {
      setWizardStep(wizardStep - 1);
    }
  };

  const runDiagnostics = () => {
    const configured = String(steamId).trim();
    const actual = liveMySteamId;
    if (!configured || !actual) {
      setDiagMessage(
        lang === 'ru'
          ? 'Недостаточно данных для диагностики. Подключитесь к серверу (статус «Подключено») и введите SteamID в настройках.'
          : 'Not enough data for diagnostics. Connect to the server (status "Connected") and enter SteamID in settings.'
      );
    } else if (configured === actual) {
      setDiagMessage(
        lang === 'ru'
          ? `✅ SteamID совпадает!\nНастроенный: ${configured}\nПодключённый: ${actual}\n\nПривязка корректна.`
          : `✅ SteamID matches!\nConfigured: ${configured}\nConnected: ${actual}\n\nPairing is correct.`
      );
    } else {
      setDiagMessage(
        lang === 'ru'
          ? `⚠️ SteamID НЕ СОВПАДАЕТ!\nНастроенный: ${configured}\nПодключённый: ${actual}\n\nЭто значит: вы привязали Rust+ на другом аккаунте, либо в настройках указан чужой SteamID.\n\nНажмите «Сбросить привязку» — очистит сохранённые токены и откроет визард заново.`
          : `⚠️ SteamID MISMATCH!\nConfigured: ${configured}\nConnected: ${actual}\n\nThis means: you paired Rust+ on a different account, or the settings have someone else's SteamID.\n\nPress "Reset pairing" — clears stored tokens and reopens the wizard.`
      );
    }
    setDiagOpen(true);
  };

  const resetPairing = async () => {
    await AsyncStorage.multiRemove([RUSTPLUS_TOKEN_KEY, RUSTPLUS_PLAYER_KEY]);
    setToken('');
    setSteamId('');
    setWizardOpen(true);
    setWizardStep(0);
    setPairingMode(true);
    setDiagOpen(false);
  };

  const copyToClipboard = async (text, label) => {
    try {
      await Clipboard.setString(text);
      Alert.alert(
        lang === 'ru' ? 'Скопировано' : 'Copied',
        lang === 'ru' ? `${label} скопирован в буфер обмена` : `${label} copied to clipboard`
      );
    } catch (e) {}
  };

  return (
    <LinearGradient colors={gradientColors} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{lang === 'ru' ? 'Источник данных' : 'Data Source'}</Text>

          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: 'mock', label: lang === 'ru' ? 'Демо' : 'Demo' },
              { value: 'firebase', label: 'Firebase' },
              { value: 'rustplus', label: lang === 'ru' ? 'Rust+' : 'Rust+' },
            ]}
          />

          <TouchableOpacity style={styles.wizardBtn} onPress={() => { setWizardOpen(true); setWizardStep(0); setPairingMode(false); }}>
            <Text style={styles.wizardBtnTxt}>
              ❓ {lang === 'ru' ? 'Как добавить сервер?' : 'How to add a server?'}
            </Text>
          </TouchableOpacity>

          {mode === 'mock' && (
            <View style={styles.card}>
              <Text style={styles.hint}>
                {lang === 'ru'
                  ? 'Демо-режим показывает интерфейс на статичных данных: команда, события, устройства и чат — всё как в живом режиме, только ничего не подключается.'
                  : 'Demo mode shows the UI on static data: team, events, devices and chat — everything like live mode, but nothing connects.'}
              </Text>
            </View>
          )}

          {mode === 'firebase' && (
            <View style={styles.card}>
              <Text style={styles.label}>Database URL</Text>
              <TextInput
                style={styles.input}
                value={fbUrl}
                onChangeText={setFbUrl}
                placeholder="https://your-project-default-rtdb.firebaseio.com"
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <Text style={styles.label}>{lang === 'ru' ? 'Секрет базы (database secret)' : 'Database secret'}</Text>
              <TextInput
                style={styles.input}
                value={fbAuth}
                onChangeText={setFbAuth}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="••••••••"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
              <Text style={styles.label}>SteamID</Text>
              <TextInput
                style={styles.input}
                value={steamId}
                onChangeText={(v) => setSteamId(v.replace(/\D/g, ''))}
                keyboardType="number-pad"
                placeholder="7656119..."
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
              <Text style={styles.hint}>
                {lang === 'ru'
                  ? 'Те же значения, что и в pc-client/.env: FIREBASE_DB_URL и FIREBASE_DB_SECRET. Приложение читает базу REST-поллингом (~4 с) и пишет команды в /commands.'
                  : 'Same values as in pc-client/.env: FIREBASE_DB_URL and FIREBASE_DB_SECRET. The app reads the DB via REST polling (~4s) and writes commands to /commands.'}
              </Text>
            </View>
          )}

          {mode === 'rustplus' && (
            <View style={styles.card}>
              <RustPlusHelper lang={lang} />

              <Text style={styles.label}>IP {lang === 'ru' ? 'сервера' : 'of the server'}</Text>
              <TextInput
                style={styles.input}
                value={ip}
                onChangeText={setIp}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="numbers-and-punctuation"
                placeholder="192.168.1.50"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
              <View style={styles.rowTwo}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{lang === 'ru' ? 'Порт App' : 'App Port'}</Text>
                  <TextInput
                    style={styles.input}
                    value={port}
                    onChangeText={(v) => setPort(v.replace(/\D/g, ''))}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={styles.label}>SteamID</Text>
                  <TextInput
                    style={styles.input}
                    value={steamId}
                    onChangeText={(v) => setSteamId(v.replace(/\D/g, ''))}
                    keyboardType="number-pad"
                    placeholder="7656119..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                  />
                </View>
              </View>
              <Text style={styles.label}>Player Token</Text>
              <TextInput
                style={styles.input}
                value={token}
                onChangeText={setToken}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="••••••••"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
              <Text style={styles.label}>
                {lang === 'ru' ? 'Устройства (JSON, entities.json)' : 'Devices (JSON, entities.json)'}
              </Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                value={entitiesJson}
                onChangeText={setEntitiesJson}
                multiline
              />
              <Text style={styles.hint}>
                {lang === 'ru'
                  ? 'Токен и SteamID — от сопряжения официального Rust+ с сервером. Телефон подключается напрямую к серверу игры: он должен быть доступен по сети (тот же Wi-Fi или проброс порта 28082). Список устройств задаётся вручную тем же JSON, что и entities.json у pc-client.'
                  : 'Token and SteamID come from pairing the official Rust+ app with the server. The phone connects directly to the game server: it must be reachable over the network (same Wi-Fi or port-forwarded 28082). The device list is the same JSON as pc-client\'s entities.json.'}
              </Text>

              {/* Диагностика SteamID — видна только если подключено и есть liveMySteamId */}
              {(liveStatusText && (liveStatusText.includes('Подключено') || liveStatusText.includes('Connected'))) && liveMySteamId && (
                <View style={styles.diagBox}>
                  <Text style={styles.diagTitle}>
                    {lang === 'ru' ? '🔍 Диагностика SteamID' : '🔍 SteamID Diagnostics'}
                  </Text>
                  <View style={styles.diagRow}>
                    <View style={styles.diagItem}>
                      <Text style={styles.diagLabel}>{lang === 'ru' ? 'В настройках' : 'In settings'}</Text>
                      <Text style={styles.diagValue} numberOfLines={1}>{steamId || (lang === 'ru' ? '— не задан' : '— not set')}</Text>
                    </View>
                    <View style={styles.diagItem}>
                      <Text style={styles.diagLabel}>{lang === 'ru' ? 'Подключённый' : 'Connected'}</Text>
                      <Text style={styles.diagValue} numberOfLines={1}>{liveMySteamId}</Text>
                    </View>
                  </View>
                  <View style={styles.diagBtnRow}>
                    <TouchableOpacity style={styles.diagBtn} onPress={runDiagnostics}>
                      <Text style={styles.diagBtnTxt}>{lang === 'ru' ? 'Проверить совпадение' : 'Check match'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.diagBtn, styles.diagBtnDanger]} onPress={resetPairing}>
                      <Text style={styles.diagBtnTxt}>{lang === 'ru' ? 'Сбросить привязку' : 'Reset pairing'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Статус/ошибка текущего подключения */}
          {(!!liveStatusText || !!liveError) && (
            <Text style={styles.statusLine}>
              {!!liveError ? `⚠ ${liveError}` : `${lang === 'ru' ? 'Сейчас' : 'Now'}: ${liveStatusText}`}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, !canSave && styles.btnDisabled]}
            onPress={save}
            disabled={!canSave}
          >
            <Text style={styles.primaryBtnTxt}>
              {lang === 'ru' ? 'Подключиться' : 'Connect'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelTxt}>{lang === 'ru' ? 'Отмена' : 'Cancel'}</Text>
          </TouchableOpacity>

          {/* Визард сопряжения Rust+ (4 шага — интерактивный степпер) */}
          <Modal visible={wizardOpen} animationType="slide" onRequestClose={() => setWizardOpen(false)}>
            <LinearGradient colors={gradientColors} style={styles.fill}>
              <SafeAreaView style={styles.fill}>
                <View style={styles.wizTop}>
                  <TouchableOpacity style={styles.wizBackBtn} onPress={() => setWizardOpen(false)}>
                    <Text style={styles.cancelTxt}>← {lang === 'ru' ? 'Назад' : 'Back'}</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
                  {/* Прогресс-бар шагов */}
                  <View style={styles.wizProgressWrap}>
                    {WIZARD_STEPS.map((s, i) => (
                      <View key={i} style={styles.wizProgressStep}>
                        <View
                          style={[
                            styles.wizProgressDot,
                            i < wizardStep ? styles.wizProgressDone : i === wizardStep ? styles.wizProgressActive : null,
                          ]}
                        >
                          {i < wizardStep && <Text style={styles.wizProgressCheck}>✓</Text>}
                          {i >= wizardStep && <Text style={styles.wizProgressNum}>{i + 1}</Text>}
                        </View>
                        {i < WIZARD_STEPS.length - 1 && (
                          <View
                            style={[
                              styles.wizProgressLine,
                              i < wizardStep ? styles.wizProgressLineDone : null,
                            ]}
                          />
                        )}
                      </View>
                    ))}
                  </View>

                  <Text style={styles.title}>{lang === 'ru' ? 'Как добавить сервер?' : 'How to add a server?'}</Text>

                  {/* Текущий шаг — крупно */}
                  <View style={styles.card}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                      <Text style={styles.wizBigIcon}>{WIZARD_STEPS[wizardStep].icon}</Text>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={styles.wizStepTitle}>{lang === 'ru' ? WIZARD_STEPS[wizardStep].title.ru : WIZARD_STEPS[wizardStep].title.en}</Text>
                        <Text style={styles.wizStepSubtitle}>
                          {lang === 'ru' ? `Шаг ${wizardStep + 1} из ${WIZARD_STEPS.length}` : `Step ${wizardStep + 1} of ${WIZARD_STEPS.length}`}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.wizStepText}>{lang === 'ru' ? WIZARD_STEPS[wizardStep].text.ru : WIZARD_STEPS[wizardStep].text.en}</Text>

                    {/* На последнем шаге — кнопки копирования SteamID/токена (если уже есть в буфере обмена пользователе) */}
                    {wizardStep === WIZARD_STEPS.length - 1 && (
                      <View style={styles.wizLastStepActions}>
                        <TouchableOpacity style={styles.wizCopyBtn} onPress={() => copyToClipboard(steamId || '', lang === 'ru' ? 'SteamID' : 'SteamID')}>
                          <Text style={styles.wizCopyBtnTxt}>📋 {lang === 'ru' ? 'Вставить SteamID' : 'Paste SteamID'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.wizCopyBtn} onPress={() => copyToClipboard(token || '', lang === 'ru' ? 'Токен' : 'Token')}>
                          <Text style={styles.wizCopyBtnTxt}>📋 {lang === 'ru' ? 'Вставить токен' : 'Paste token'}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Навигация по шагам */}
                  <View style={styles.wizNav}>
                    {wizardStep > 0 && (
                      <TouchableOpacity style={styles.wizNavBtn} onPress={handleWizardPrev}>
                        <Text style={styles.wizNavBtnTxt}>{lang === 'ru' ? '← Назад' : '← Back'}</Text>
                      </TouchableOpacity>
                    )}
                    {wizardStep < WIZARD_STEPS.length - 1 ? (
                      <TouchableOpacity style={styles.wizNavBtnPrimary} onPress={handleWizardNext}>
                        <Text style={styles.wizNavBtnTxtPrimary}>{lang === 'ru' ? 'Далее →' : 'Next →'}</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.wizNavBtnPrimary} onPress={handleWizardNext}>
                        <Text style={styles.wizNavBtnTxtPrimary}>{lang === 'ru' ? 'Готово' : 'Done'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={[styles.card, { borderColor: 'rgba(251,191,36,0.35)', backgroundColor: 'rgba(251,191,36,0.08)' }]}>
                    <Text style={styles.hint}>
                      💡{' '}
                      {lang === 'ru'
                        ? 'Почему нельзя «нажал — и само подключилось»: некоторые помощники в Chrome перехватывают параметры входа Steam расширением браузера. На Android приложение не имеет права читать чужие окна и уведомления без специальных разрешений, поэтому SteamID и токен вставляются вручную один раз.'
                        : 'Why no one-tap magic: some Chrome helpers capture the Steam login via a browser extension. Android apps are not allowed to read other apps\' windows or notifications without special permissions, so the SteamID and token are pasted manually once.'}
                    </Text>
                  </View>
                </ScrollView>
              </SafeAreaView>
            </LinearGradient>
          </Modal>

          {/* Модалка диагностики */}
          <Modal visible={diagOpen} animationType="slide" onRequestClose={() => setDiagOpen(false)}>
            <LinearGradient colors={gradientColors} style={styles.fill}>
              <SafeAreaView style={styles.fill}>
                <View style={styles.wizTop}>
                  <TouchableOpacity style={styles.wizBackBtn} onPress={() => setDiagOpen(false)}>
                    <Text style={styles.cancelTxt}>← {lang === 'ru' ? 'Закрыть' : 'Close'}</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
                  <View style={styles.card}>
                    <Text style={styles.diagTitle}>
                      {lang === 'ru' ? 'Результат диагностики' : 'Diagnostics Result'}
                    </Text>
                    <Text style={{ color: colors.textPrimary, fontSize: 13, lineHeight: 20, whiteSpace: 'pre-wrap' }}>{diagMessage}</Text>
                  </View>
                  {diagMessage.includes('НЕ СОВПАДАЕТ') || diagMessage.includes('MISMATCH') ? (
                    <TouchableOpacity style={[styles.primaryBtn, styles.diagBtnDanger, { marginTop: 12 }]} onPress={resetPairing}>
                      <Text style={styles.primaryBtnTxt}>{lang === 'ru' ? 'Сбросить привязку' : 'Reset pairing'}</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => setDiagOpen(false)}>
                    <Text style={styles.primaryBtnTxt}>{lang === 'ru' ? 'Ок' : 'OK'}</Text>
                  </TouchableOpacity>
                </ScrollView>
              </SafeAreaView>
            </LinearGradient>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { flex: 1 },
  inner: { padding: 20, paddingBottom: 40 },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 14 },
  card: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 13,
  },
  label: { color: colors.textMuted, fontSize: 10.5, fontWeight: '600', marginBottom: 5, marginTop: 8 },
  input: {
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 13,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  multiline: { height: 90, textAlignVertical: 'top' },
  rowTwo: { flexDirection: 'row', gap: 10 },
  hint: { color: colors.textMuted, fontSize: 10.5, lineHeight: 15, marginTop: 12 },
  statusLine: { color: eventPalette.red, fontSize: 11, marginTop: 14, lineHeight: 16 },
  primaryBtn: {
    marginTop: 18,
    backgroundColor: colors.accentStrong,
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  primaryBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 14 },
  cancelTxt: { color: colors.textMuted, fontSize: 13 },
  wizardBtn: {
    marginTop: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(96,165,250,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.35)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  wizardBtnTxt: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  wizTop: { paddingHorizontal: 20, paddingTop: 10 },
  wizBackBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  wizStepNum: {
    color: eventPalette.blue,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 8,
    backgroundColor: 'rgba(96,165,250,0.15)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  wizStepTitle: { color: colors.textPrimary, fontSize: 13.5, fontWeight: '700', marginLeft: 8 },
  pairBox: {
    backgroundColor: 'rgba(96,165,250,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.28)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 6,
  },
  pairTitle: { color: eventPalette.blue, fontSize: 11.5, fontWeight: '700', marginBottom: 10 },
  pairBtnRow: { flexDirection: 'row', gap: 8 },
  pairBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(96,165,250,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.45)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  pairBtnTxt: { color: colors.textPrimary, fontSize: 11.5, fontWeight: '700' },

  // Новые стили для интерактивного визарда
  wizProgressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  wizProgressStep: { flex: 1, alignItems: 'center' },
  wizProgressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizProgressActive: {
    borderColor: eventPalette.blue,
    backgroundColor: 'rgba(96,165,250,0.15)',
  },
  wizProgressDone: {
    borderColor: eventPalette.green,
    backgroundColor: 'rgba(52,199,89,0.15)',
  },
  wizProgressCheck: { color: eventPalette.green, fontSize: 14, fontWeight: '700' },
  wizProgressNum: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  wizProgressLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: -4,
  },
  wizProgressLineDone: {
    backgroundColor: eventPalette.green,
  },
  wizBigIcon: { fontSize: 28 },
  wizStepSubtitle: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  wizStepText: { color: colors.textSecondary, fontSize: 12.5, lineHeight: 18, marginTop: 6 },
  wizLastStepActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  wizCopyBtn: {
    backgroundColor: 'rgba(96,165,250,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.35)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  wizCopyBtnTxt: { color: colors.textPrimary, fontSize: 11.5, fontWeight: '600' },
  wizNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  wizNavBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  wizNavBtnTxt: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  wizNavBtnPrimary: {
    backgroundColor: colors.accentStrong,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  wizNavBtnTxtPrimary: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Диагностика
  diagBox: {
    marginTop: 14,
    backgroundColor: 'rgba(96,165,250,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.28)',
    borderRadius: 14,
    padding: 12,
  },
  diagTitle: { color: eventPalette.blue, fontSize: 11.5, fontWeight: '700', marginBottom: 8 },
  diagRow: { flexDirection: 'row', gap: 12 },
  diagItem: { flex: 1 },
  diagLabel: { color: colors.textMuted, fontSize: 9.5, fontWeight: '600', marginBottom: 2 },
  diagValue: { color: colors.textPrimary, fontSize: 11.5, fontFamily: 'monospace' },
  diagBtnRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  diagBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(96,165,250,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.35)',
    borderRadius: 12,
    paddingVertical: 9,
  },
  diagBtnDanger: {
    backgroundColor: 'rgba(255,59,48,0.18)',
    borderColor: 'rgba(255,59,48,0.35)',
  },
  diagBtnTxt: { color: colors.textPrimary, fontSize: 11.5, fontWeight: '600' },
});