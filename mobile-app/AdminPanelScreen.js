// ─────────────────────────────────────────────────────────
// АДМИН-ПАНЕЛЬ («Другое → Админ-панель», по ТЗ 2.4):
//  • выдача прав администратора текущему профилю;
//  • управление настройками ютуберов (список + активность).
// Всё локально в AsyncStorage — серверной авторизации пока нет,
// панель честно помечает это в дисклеймере.
// Ключи: rc_admin_v1 ({isAdmin, name, grantedAt}), rc_yt_v1
// ([{id, name, url, active}]).
// ─────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import { colors, eventPalette } from './theme';
import { GlassCard } from './ui';

const ADMIN_KEY = 'rc_admin_v1';
const YT_KEY = 'rc_yt_v1';

// Hermes без Intl может не знать toLocaleDateString — форматируем вручную
function fmtDate(ts) {
  const d = new Date(ts);
  const p = (x) => String(x).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function AdminPanelScreen({ lang }) {
  const [admin, setAdmin] = useState(null); // {isAdmin, name, grantedAt}
  const [name, setName] = useState('');
  const [ytList, setYtList] = useState([]);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  // Загрузка состояния при открытии панели
  useEffect(() => {
    (async () => {
      try {
        const a = await AsyncStorage.getItem(ADMIN_KEY);
        if (a) setAdmin(JSON.parse(a));
        const y = await AsyncStorage.getItem(YT_KEY);
        if (y) setYtList(JSON.parse(y));
      } catch (e) {}
    })();
  }, []);

  const persistAdmin = async (next) => {
    setAdmin(next);
    try {
      await AsyncStorage.setItem(ADMIN_KEY, JSON.stringify(next));
    } catch (e) {}
  };

  const persistYt = async (next) => {
    setYtList(next);
    try {
      await AsyncStorage.setItem(YT_KEY, JSON.stringify(next));
    } catch (e) {}
  };

  const grantAdmin = () => {
    if (!name.trim()) return;
    persistAdmin({ isAdmin: true, name: name.trim(), grantedAt: Date.now() });
  };

  const revokeAdmin = () => {
    Alert.alert(
      lang === 'ru' ? 'Снять права?' : 'Revoke admin?',
      lang === 'ru'
        ? 'Права администратора будут сняты с текущего профиля.'
        : 'Admin rights will be removed from this profile.',
      [
        { text: lang === 'ru' ? 'Отмена' : 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: () => persistAdmin(null) },
      ],
    );
  };

  const addYt = () => {
    if (!newName.trim()) return;
    persistYt([
      ...ytList,
      { id: String(Date.now()), name: newName.trim(), url: newUrl.trim(), active: true },
    ]);
    setNewName('');
    setNewUrl('');
  };

  return (
    <GlassCard>
      <Text style={styles.screenTitle}>
        {lang === 'ru' ? '🛡️ Админ-панель' : '🛡️ Admin Panel'}
      </Text>
      <Text style={styles.disclaimer}>
        {lang === 'ru'
          ? 'Права и список ютуберов хранятся локально на устройстве. Серверная проверка прав появится вместе с системой аккаунтов (ТЗ 2.4).'
          : 'Rights and the YouTuber list are stored locally on this device. Server-side verification arrives with the accounts system (spec 2.4).'}
      </Text>

      {/* ── Права администратора ── */}
      <Text style={styles.groupTitle}>
        {lang === 'ru' ? 'ПРАВА АДМИНИСТРАТОРА' : 'ADMIN RIGHTS'}
      </Text>
      {admin && admin.isAdmin ? (
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>✅ {admin.name}</Text>
            <Text style={styles.rowMeta}>
              {lang === 'ru' ? 'права выданы' : 'granted'}
              {admin.grantedAt ? ` · ${fmtDate(admin.grantedAt)}` : ''}
            </Text>
          </View>
          <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={revokeAdmin}>
            <Text style={styles.btnTxtDanger}>
              {lang === 'ru' ? 'Снять' : 'Revoke'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ marginBottom: 12 }}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={
              lang === 'ru' ? 'Имя / ник текущего профиля' : 'Current profile name'
            }
            placeholderTextColor="rgba(255,255,255,0.3)"
          />
          <TouchableOpacity style={styles.btn} onPress={grantAdmin}>
            <Text style={styles.btnTxt}>
              {lang === 'ru' ? 'Выдать права этому профилю' : 'Grant admin to this profile'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Настройки ютуберов ── */}
      <Text style={[styles.groupTitle, { marginTop: 14 }]}>
        {lang === 'ru' ? 'ЮТУБЕРЫ' : 'YOU TUBERS'}
      </Text>
      {ytList.length === 0 && (
        <Text style={styles.empty}>
          {lang === 'ru'
            ? 'Список пуст — добавь канал ниже.'
            : 'Empty — add a channel below.'}
        </Text>
      )}
      {ytList.map((yt) => (
        <View key={yt.id} style={styles.row}>
          <TouchableOpacity
            style={styles.dotBtn}
            onPress={() =>
              persistYt(
                ytList.map((x) =>
                  x.id === yt.id ? { ...x, active: !x.active } : x,
                ),
              )
            }
          >
            <Text style={{ fontSize: 14 }}>{yt.active ? '🟢' : '⚪️'}</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, !yt.active && { opacity: 0.5 }]}>
              {yt.name}
            </Text>
            {!!yt.url && (
              <TouchableOpacity
                onPress={() => Clipboard.setString(yt.url)}
                onLongPress={() => Clipboard.setString(yt.url)}
              >
                <Text style={styles.rowMeta} numberOfLines={1}>
                  🔗 {yt.url} · {lang === 'ru' ? 'тап — копировать' : 'tap to copy'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.delBtn}
            onPress={() =>
              Alert.alert(
                lang === 'ru' ? 'Удалить?' : 'Remove?',
                yt.name,
                [
                  { text: lang === 'ru' ? 'Отмена' : 'Cancel', style: 'cancel' },
                  {
                    text: 'OK',
                    onPress: () => persistYt(ytList.filter((x) => x.id !== yt.id)),
                  },
                ],
              )
            }
          >
            <Text style={{ fontSize: 13 }}>🗑️</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Добавление ютубера */}
      <TextInput
        style={styles.input}
        value={newName}
        onChangeText={setNewName}
        placeholder={lang === 'ru' ? 'Название канала' : 'Channel name'}
        placeholderTextColor="rgba(255,255,255,0.3)"
      />
      <TextInput
        style={[styles.input, { marginBottom: 10 }]}
        value={newUrl}
        onChangeText={setNewUrl}
        placeholder={lang === 'ru' ? 'Ссылка (необязательно)' : 'URL (optional)'}
        placeholderTextColor="rgba(255,255,255,0.3)"
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.btn} onPress={addYt}>
        <Text style={styles.btnTxt}>＋ {lang === 'ru' ? 'Добавить ютубера' : 'Add YouTuber'}</Text>
      </TouchableOpacity>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  screenTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  groupTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  disclaimer: {
    color: colors.textMuted,
    fontSize: 10.5,
    lineHeight: 15,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 11,
    marginBottom: 6,
  },
  rowTitle: { color: colors.textPrimary, fontSize: 13.5, fontWeight: '600' },
  rowMeta: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  empty: { color: colors.textMuted, fontSize: 11, marginBottom: 8 },
  input: {
    color: '#fff',
    fontSize: 12.5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 8,
  },
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(96,165,250,0.22)',
    borderWidth: 1,
    borderColor: eventPalette.blue + '55',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  btnTxt: { color: eventPalette.blue, fontSize: 12, fontWeight: '700' },
  btnDanger: {
    backgroundColor: 'rgba(239,68,68,0.18)',
    borderColor: eventPalette.red + '55',
  },
  btnTxtDanger: { color: eventPalette.red, fontSize: 12, fontWeight: '700' },
  dotBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  delBtn: { paddingHorizontal: 8, paddingVertical: 4 },
});
