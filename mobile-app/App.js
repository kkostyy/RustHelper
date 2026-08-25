import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Modal,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { gradientColors, colors, glassPill, eventPalette } from './theme';
import { ScreenFade } from './motion';
import {
  useDataSource,
  loadStoredSource,
  storeSource,
  loadStoredLang,
  storeLang,
  loadStoredBg,
  storeBg,
  clearStoredBg,
  loadStoredDash,
  storeDash,
  loadStoredTimeFmt,
} from './live';
import { makeT } from './ui';
import { loadNotifStore, useNotifs } from './notifStore';
import { useVendingWatcher } from './vendStore';
import { useServerHistory } from './srvHist';
import { useSmeltWatcher } from './smeltWatch';
import { useTrackingPoller } from './lookup';
import HomeScreen from './HomeScreen';
import MapTab from './MapScreen';
import DevicesScreen from './DevicesScreen';
import IntelScreen from './IntelScreen';
import OtherScreen from './OtherScreen';
import SettingsScreen from './SettingsScreen';
import SourceModal from './SourceModal';
import NotificationsScreen from './NotificationsScreen';

// Ровно 6 вкладок снизу — как в веб-версии
const TABS = [
  { id: 'home', icon: '🏠', label: { ru: 'Мейн', en: 'Main' }, color: eventPalette.blue },
  { id: 'map', icon: '🗺️', label: { ru: 'Карта', en: 'Map' }, color: eventPalette.purple },
  { id: 'smart', icon: '🎛', label: { ru: 'Устройства', en: 'Devices' }, color: eventPalette.yellow },
  { id: 'intel', icon: '🎯', label: { ru: 'Пробив', en: 'Intel' }, color: eventPalette.orange },
  { id: 'other', icon: '🧰', label: { ru: 'Другое', en: 'Other' }, color: eventPalette.teal },
  { id: 'settings', icon: '⚙️', label: { ru: 'Настройки', en: 'Settings' }, color: '#98989d' },
];

export default function App() {
  const [lang, setLang] = useState('ru');
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('home');
  const [sourceOpen, setSourceOpen] = useState(false);
  const [source, setSource] = useState(null); // загружается из AsyncStorage
  const [bg, setBgState] = useState(null); // { uri, dim } — фон из своего фото
  const [dash, setDashState] = useState(null); // виджеты главного экрана
  const [notifOpen, setNotifOpen] = useState(false); // центр уведомлений
  const { unread } = useNotifs();

  // Поллер трекинга Пробива: раз в 2 мин проверяет отслеживаемых игроков
  useTrackingPoller();

  useEffect(() => {
    (async () => {
      const [s, l, b, d] = await Promise.all([
        loadStoredSource(),
        loadStoredLang(),
        loadStoredBg(),
        loadStoredDash(),
        loadNotifStore(), // центр уведомлений из AsyncStorage
        loadStoredTimeFmt(), // формат времени для hhmm()
      ]);
      setSource(s || { mode: 'mock', linked: false, cfg: {} });
      setLang(l);
      setBgState(b);
      setDashState(d);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (source) storeSource(source);
  }, [source]);

  // Обёртки с сохранением: настройки меняют через них
  const setBg = (next) => {
    setBgState(next);
    if (next) storeBg(next);
    else clearStoredBg();
  };
  const setDash = (next) => {
    setDashState({ ...next });
    storeDash(next);
  };

  const effMode = !source || source.mode === 'mock' ? 'mock' : source.mode;
  const live = useDataSource(effMode, (source && source.cfg) || {});

  // Вотчер избранного vending: следит за live.vending на любой вкладке
  // и пушит kind:'shop', когда избранный предмет появился в автомате
  useVendingWatcher(live ? live.vending : null, lang);

  // История сервера: срезы онлайн/очереди раз в 5 минут + алерты
  // рестарта (wipeTime) и потери связи — тоже вне вкладок
  useServerHistory(live);

  // «Печь доплавилась»: следит за рудой в storage-мониторах
  useSmeltWatcher(Object.values((live && live.devices) || {}), lang);

  const t = makeT(lang);
  const isLive = !!(live && live.mode !== 'mock');
  const connected = source ? (source.mode === 'mock' ? !!source.linked : live.status === 'connected') : false;

  const statusTextMap = {
    connected: { ru: 'Подключено', en: 'Connected' },
    connecting: { ru: 'Подключение...', en: 'Connecting...' },
    offline: { ru: 'Нет данных от pc-client', en: 'No data from pc-client' },
    error: { ru: 'Ошибка', en: 'Error' },
    idle: { ru: 'Не подключено', en: 'Not connected' },
  };
  const statusKey = isLive ? live.status : source && source.mode === 'mock' && source.linked ? 'connected' : 'idle';
  const liveStatusText = t(statusTextMap[statusKey] || statusTextMap.idle);

  const changeLang = (l) => {
    setLang(l);
    storeLang(l);
  };

  // Скользящий индикатор активной вкладки: кнопки равные (flex:1),
  // ширина известна заранее — пружиним translateX, цвет меняем сразу.
  const TAB_BTN_W = (Dimensions.get('window').width - 20) / TABS.length; // минус marginHorizontal бара
  const underlineX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const i = TABS.findIndex((x) => x.id === tab);
    Animated.spring(underlineX, {
      toValue: i * TAB_BTN_W + (TAB_BTN_W - 16) / 2,
      friction: 7,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [tab, underlineX, TAB_BTN_W]);
  const activeTabColor = (TABS.find((x) => x.id === tab) || TABS[0]).color;

  if (!ready || !source || !dash) {
    return (
      <LinearGradient colors={gradientColors} style={styles.gradient}>
        <SafeAreaView style={[styles.container, styles.center]}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          <Text style={{ color: colors.textMuted }}>{lang === 'ru' ? 'Загрузка...' : 'Loading...'}</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={gradientColors} style={styles.gradient}>
      {/* Свой фон: фото поверх градиента + затемнение вместо blur
          (реальный blur на Android дорогой — имитируем прозрачностью) */}
      {bg && !!bg.uri && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Image source={{ uri: bg.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(10,10,18,${bg.dim == null ? 0.55 : bg.dim})` }]}
          />
        </View>
      )}
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.title}>👁 S-eye viewer</Text>
          </View>
          {/* Колокольчик центра уведомлений с бейджем непрочитанных */}
          <TouchableOpacity style={styles.bellBtn} onPress={() => setNotifOpen(true)}>
            <Text style={{ fontSize: 17 }}>🔔</Text>
            {unread > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeTxt}>{unread > 99 ? '99+' : unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenFade key={tab}>
            {tab === 'home' && (
              <HomeScreen
                lang={lang}
                t={t}
                connected={connected}
                onOpenConnect={() => setSourceOpen(true)}
                goTo={setTab}
                live={live}
                dash={dash}
              />
            )}
            {tab === 'map' && <MapTab lang={lang} t={t} live={live} connected={connected} />}
            {tab === 'smart' && <DevicesScreen lang={lang} t={t} live={live} />}
            {tab === 'intel' && <IntelScreen lang={lang} t={t} live={live} />}
            {tab === 'other' && <OtherScreen lang={lang} t={t} />}
            {tab === 'settings' && (
              <SettingsScreen
                lang={lang}
                setLang={changeLang}
                t={t}
                live={live}
                source={source}
                onOpenSource={() => setSourceOpen(true)}
                bg={bg}
                onChangeBg={setBg}
                dash={dash}
                onChangeDash={setDash}
                onLogout={() => {
                  setSource({ mode: 'mock', linked: false, cfg: {} });
                  setTab('home');
                }}
              />
            )}
          </ScreenFade>
        </ScrollView>

        {/* Нижний бар: ровно 6 кнопок + один скользящий индикатор */}
        <View style={[styles.tabBar, glassPill]}>
          <Animated.View
            pointerEvents="none"
            style={[styles.tabIndicator, { backgroundColor: activeTabColor, transform: [{ translateX: underlineX }] }]}
          />
          {TABS.map((tb) => {
            const active = tab === tb.id;
            return (
              <TouchableOpacity key={tb.id} style={styles.tabBtn} onPress={() => setTab(tb.id)}>
                <Text style={[styles.tabIcon, { opacity: active ? 1 : 0.55 }]}>{tb.icon}</Text>
                <Text style={[styles.tabLabel, { color: active ? tb.color : colors.textMuted }]} numberOfLines={1}>
                  {t(tb.label)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Modal visible={sourceOpen} animationType="slide" onRequestClose={() => setSourceOpen(false)}>
          <SourceModal
            lang={lang}
            initial={source}
            liveStatusText={liveStatusText}
            liveError={isLive ? live.error : null}
            liveMySteamId={isLive ? live.mySteamId : null}
            onClose={() => setSourceOpen(false)}
            onSave={(src) => {
              setSource(src);
              setSourceOpen(false);
            }}
          />
        </Modal>

        {/* Центр уведомлений (полноэкранный, как в вебе) */}
        <Modal visible={notifOpen} animationType="slide" onRequestClose={() => setNotifOpen(false)}>
          <NotificationsScreen lang={lang} onClose={() => setNotifOpen(false)} />
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: eventPalette.red,
    borderWidth: 1.5,
    borderColor: '#101c30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeTxt: { color: '#fff', fontSize: 9, fontWeight: '800' },
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 8 },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 10,
    marginBottom: 8,
    paddingTop: 6,
    paddingBottom: 6,
  },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  tabIcon: { fontSize: 17 },
  tabLabel: { fontSize: 9.5, fontWeight: '600', marginTop: 2 },
  tabIndicator: {
    position: 'absolute',
    left: 0,
    bottom: 4,
    width: 16,
    height: 2,
    borderRadius: 1,
  },
});
