// ─────────────────────────────────────────────────────────
// ЭКРАН 1: МЕЙН — сервер-карточка, мини-карта, тиммейты, лента
// событий (порт HomeScreen из веб-версии).
// ─────────────────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, eventPalette } from './theme';
import { buildLiveView, formatGameTime } from './live';
import { GlassCard, SectionHeader, TeammateRow } from './ui';
import { PulsingDot } from './motion';
import { MapCanvas } from './MapScreen';

export default function HomeScreen({ lang, t, connected, onOpenConnect, goTo, live, dash }) {
  const isLive = !!(live && live.mode !== 'mock');
  const lv = buildLiveView(live);
  const srv = isLive ? live.server : null;

  // Конструктор главного экрана: недостающие ключи = показывать
  const showMinimap = !dash || dash.minimap !== false;
  const showTeam = !dash || dash.team !== false;
  const showFeed = !dash || dash.feed !== false;

  // Строки тимейтов: единый live-объект и в демо, и в живом режиме
  const teamRows = (live.team || []).map((m) => ({
    id: m.steamId,
    name: m.name,
    color: m.color || eventPalette.blue,
    avatarUrl: m.avatarUrl,
    online: m.isOnline,
    alive: m.isAlive,
    leader: m.leader,
  }));

  const feed = live.alarmLog || [];
  const gt = srv && srv.gameTimeH != null ? formatGameTime(srv.gameDay, srv.gameTimeH) : null;

  return (
    <View>
      {/* Блок инфы о сервере / кнопка Подключить */}
      {!connected ? (
        <GlassCard>
          <View style={styles.connectBox}>
            <Text style={{ fontSize: 30 }}>📡</Text>
            <Text style={styles.connectTitle}>
              {lang === 'ru' ? 'Сервер не подключён' : 'No server connected'}
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={onOpenConnect}>
              <Text style={styles.primaryBtnTxt}>{lang === 'ru' ? 'Подключить' : 'Connect'}</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>
              {lang === 'ru' ? 'Демо / Firebase / прямой Rust+' : 'Demo / Firebase / direct Rust+'}
            </Text>
          </View>
        </GlassCard>
      ) : (
        <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
          <View style={styles.srvBanner}>
            <View>
              <Text style={styles.srvLabel}>{lang === 'ru' ? 'Сервер' : 'Server'}</Text>
              <Text style={styles.srvName} numberOfLines={1}>
                {(srv && srv.name) || (lang === 'ru' ? 'Без названия' : 'Unnamed')}
              </Text>
            </View>
          </View>
          <View style={styles.srvRow}>
            <Text style={styles.srvPlayers}>
              {srv
                ? `${srv.playersN}/${srv.maxPlayers} ${lang === 'ru' ? 'игроков' : 'players'}${
                    srv.queued > 0 ? ` · +${srv.queued} ${lang === 'ru' ? 'в очереди' : 'queued'}` : ''
                  }`
                : lang === 'ru'
                ? '— игроков'
                : '— players'}
            </Text>
            <View style={styles.srvChips}>
              {gt && (
                <View style={styles.onlineChip}>
                  <Text style={{ fontSize: 11 }}>{gt.icon}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '600' }}>
                    {gt.hhmm}
                  </Text>
                </View>
              )}
              <View style={styles.onlineChip}>
                <PulsingDot size={6} color={eventPalette.green} />
                <Text style={{ color: eventPalette.green, fontSize: 10 }}>
                  {isLive && live.status !== 'connected'
                    ? lang === 'ru'
                      ? 'Нет связи'
                      : 'No link'
                    : lang === 'ru'
                    ? 'В сети'
                    : 'Online'}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.srvMore} onPress={() => goTo('intel')}>
            <Text style={{ color: eventPalette.blue, fontSize: 12, fontWeight: '600' }}>
              {lang === 'ru' ? 'Инфо о сервере →' : 'Server info →'}
            </Text>
          </TouchableOpacity>
        </GlassCard>
      )}

      {/* Ошибка источника данных */}
      {isLive && !!live.error && (
        <GlassCard>
          <Text style={styles.errorTxt}>⚠ {live.error}</Text>
        </GlassCard>
      )}

      {/* Мини-карта → полная карта (скрывается в конструкторе экрана) */}
      {showMinimap && (
      <GlassCard onPress={() => goTo('map')}>
        <SectionHeader
          icon="🗺️"
          color={eventPalette.purple}
          title={lang === 'ru' ? 'Мини-карта' : 'Mini-map'}
          right={
            <Text style={{ color: eventPalette.purple, fontSize: 11 }}>
              {lang === 'ru' ? 'Открыть карту →' : 'Open map →'}
            </Text>
          }
        />
        <MapCanvas height={220} compact lang={lang} lv={lv} style={{ width: '100%' }} />
      </GlassCard>
      )}

      {/* Мои тимейты (скрывается в конструкторе экрана) */}
      {showTeam && (
      <GlassCard>
        <SectionHeader
          icon="👥"
          color={eventPalette.green}
          title={lang === 'ru' ? 'Мои тимейты' : 'My teammates'}
          right={
            <TouchableOpacity onPress={() => goTo('map')}>
              <Text style={{ color: eventPalette.green, fontSize: 11 }}>
                {lang === 'ru' ? 'Все →' : 'All →'}
              </Text>
            </TouchableOpacity>
          }
        />
        {teamRows.length === 0 ? (
          <Text style={styles.empty}>
            {lang === 'ru' ? 'Нет данных о команде.' : 'No team data yet.'}
          </Text>
        ) : (
          teamRows.map((m) => <TeammateRow key={m.id} m={m} t={t} />)
        )}
      </GlassCard>
      )}

      {/* Лог тревог и событий (скрывается в конструкторе экрана) */}
      {showFeed && (
      <GlassCard>
        <SectionHeader
          icon="🔔"
          color={eventPalette.red}
          title={lang === 'ru' ? 'Лог тревог и событий' : 'Alarms & Events'}
          right={
            <View style={styles.statusChip}>
              <View
                style={[styles.dot, { backgroundColor: connected ? eventPalette.green : 'rgba(255,255,255,0.3)' }]}
              />
              <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                {connected ? (lang === 'ru' ? 'В сети' : 'Online') : lang === 'ru' ? 'Офлайн' : 'Offline'}
              </Text>
            </View>
          }
        />
        {!connected ? (
          <Text style={styles.empty}>
            {lang === 'ru'
              ? 'Подключитесь к источнику данных, чтобы получать тревоги и события.'
              : 'Connect to a data source to receive alarms and events.'}
          </Text>
        ) : feed.length === 0 && isLive ? (
          <Text style={styles.empty}>
            {lang === 'ru' ? 'Пока тихо — событий нет.' : 'All quiet — no events yet.'}
          </Text>
        ) : (
          feed.map((al) => (
            <View
              key={al.id}
              style={[
                styles.feedItem,
                al.important ? styles.feedItemImportant : styles.feedItemNormal,
              ]}
            >
              <View style={styles.feedMetaRow}>
                <Text style={styles.feedMeta}>Rust+ Push</Text>
                <Text style={styles.feedMeta}>{al.time}</Text>
              </View>
              <Text style={styles.feedText}>{t(al.text)}</Text>
            </View>
          ))
        )}
      </GlassCard>
      )}

      {/* Если все виджеты выключены — честно скажем, где их вернуть */}
      {!showMinimap && !showTeam && !showFeed && (
        <Text style={styles.empty}>
          {lang === 'ru'
            ? 'Все виджеты скрыты — включить их можно в Настройках («Главный экран»).'
            : 'All widgets are hidden — re-enable them in Settings ("Main Screen").'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  connectBox: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  connectTitle: { color: colors.textSecondary, fontSize: 13, fontWeight: '500', marginTop: 4 },
  primaryBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: eventPalette.blue,
  },
  primaryBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  hint: { color: colors.textMuted, fontSize: 10.5 },
  srvBanner: {
    height: 88,
    justifyContent: 'flex-end',
    padding: 18,
    backgroundColor: 'rgba(96,165,250,0.16)',
  },
  srvLabel: { color: colors.textSecondary, fontSize: 11, marginBottom: 2 },
  srvName: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  srvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  srvPlayers: { color: colors.textSecondary, fontSize: 13 },
  onlineChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  srvChips: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  srvMore: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(96,165,250,0.08)',
  },
  errorTxt: { color: eventPalette.red, fontSize: 11 },
  empty: { color: colors.textMuted, fontSize: 12, paddingVertical: 10 },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  feedItem: { borderRadius: 18, padding: 12, marginBottom: 8 },
  feedItemImportant: {
    backgroundColor: 'rgba(248,113,113,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.28)',
  },
  feedItemNormal: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  feedMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  feedMeta: { color: colors.textMuted, fontSize: 10 },
  feedText: { color: colors.textPrimary, fontSize: 12.5 },
});
