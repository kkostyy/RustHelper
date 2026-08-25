// ─────────────────────────────────────────────────────────
// Чат команды: живой режим читает live.chat и шлёт через
// actions.sendChat, демо — локальный стейт (порт ChatCard).
// Свои макросы (модуль 10) живут в rc_chat_macros_v1:
// «＋» добавляет набранный текст, долгий тап по своему чипу
// удаляет его. Плюс поиск по истории сообщений.
// ─────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, eventPalette } from './theme';
import { GlassCard, SectionHeader } from './ui';

// Быстрые макросы — вставляются в поле ввода одним тапом (можно
// поправить перед отправкой). Неудаляемые, идут первыми.
const CHAT_MACROS = [
  { ru: 'Нужна помощь!', en: 'Need help!' },
  { ru: 'Иду на базу', en: 'Heading home' },
  { ru: 'Все на рейд!', en: 'Everyone raid!' },
  { ru: 'Вижу хели', en: 'Spotted heli' },
  { ru: 'Ок', en: 'Ok' },
];

const MACROS_KEY = 'rc_chat_macros_v1';
const MAX_USER_MACROS = 20;

export default function ChatCard({ lang, t, live }) {
  const isLive = !!(live && live.mode !== 'mock');
  const [draft, setDraft] = useState('');
  const [mockMsgs, setMockMsgs] = useState(live.chat || []);
  const [pendingLocal, setPendingLocal] = useState([]);
  const listRef = useRef(null);
  // Свои макросы и форма добавления
  const [userMacros, setUserMacros] = useState([]);
  const [addingMacro, setAddingMacro] = useState(false);
  const [macroDraft, setMacroDraft] = useState('');
  // Поиск по истории чата
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(MACROS_KEY)
      .then((raw) => {
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) setUserMacros(parsed.filter((m) => typeof m === 'string'));
      })
      .catch(() => {});
  }, []);

  const saveMacros = (list) => {
    setUserMacros(list);
    AsyncStorage.setItem(MACROS_KEY, JSON.stringify(list)).catch(() => {});
  };

  const addUserMacro = () => {
    const txt = macroDraft.trim();
    if (!txt) return;
    if (!userMacros.includes(txt)) saveMacros([...userMacros, txt].slice(-MAX_USER_MACROS));
    setMacroDraft('');
    setAddingMacro(false);
  };

  const removeUserMacro = (txt) => {
    Alert.alert(
      lang === 'ru' ? 'Удалить макрос?' : 'Delete macro?',
      txt,
      [
        { text: lang === 'ru' ? 'Удалить' : 'Delete', style: 'destructive', onPress: () => saveMacros(userMacros.filter((m) => m !== txt)) },
        { text: lang === 'ru' ? 'Отмена' : 'Cancel', style: 'cancel' },
      ],
    );
  };

  const send = async () => {
    const txt = draft.trim();
    if (!txt) return;
    if (isLive) {
      const k = 'loc-' + Date.now() + '-' + Math.random();
      setPendingLocal((p) => [...p, { author: lang === 'ru' ? 'Вы' : 'You', text: txt, mine: true, key: k }]);
      try {
        await live.actions.sendChat(txt);
      } catch (e) {
        // ошибка уйдёт в общий статус источника на Мейне
      }
      setTimeout(() => setPendingLocal((p) => p.filter((x) => x.key !== k)), 8000);
    } else {
      setMockMsgs([...mockMsgs, { key: 'm-' + Date.now(), author: lang === 'ru' ? 'Вы' : 'You', text: txt, mine: true }]);
    }
    setDraft('');
  };

  const msgs = isLive
    ? [
        ...(live.chat || []).map((c) => ({ author: c.author, text: c.text, mine: c.mine, key: c.key })),
        ...pendingLocal,
      ]
    : mockMsgs;

  // Поиск по подстроке без регистра; пустой запрос — обычный вид
  const q = searchQ.trim().toLowerCase();
  const visibleMsgs = q ? msgs.filter((c) => (c.text || '').toLowerCase().includes(q)) : msgs;

  // Держим последний элемент на экране (когда поиск не активен)
  useEffect(() => {
    if (!q && listRef.current) {
      setTimeout(() => listRef.current && listRef.current.scrollToEnd({ animated: false }), 50);
    }
  }, [msgs.length]);

  return (
    <GlassCard>
      <SectionHeader icon="💬" color={eventPalette.green} title={lang === 'ru' ? 'Чат команды' : 'Team Chat'} />
      <TextInput
        value={searchQ}
        onChangeText={setSearchQ}
        placeholder={lang === 'ru' ? '🔍 Поиск по чату...' : '🔍 Search chat...'}
        placeholderTextColor="rgba(255,255,255,0.3)"
        style={styles.search}
      />
      <View style={styles.list}>
        {visibleMsgs.length === 0 && (
          <Text style={styles.empty}>
            {q
              ? lang === 'ru'
                ? 'Ничего не найдено.'
                : 'Nothing found.'
              : lang === 'ru'
              ? 'Сообщений пока нет.'
              : 'No messages yet.'}
          </Text>
        )}
        {visibleMsgs.map((c, i) => (
          <View key={c.key || i} style={[styles.row, { justifyContent: c.mine ? 'flex-end' : 'flex-start' }]}>
            <View
              style={[
                styles.bubble,
                c.mine ? styles.bubbleMine : styles.bubbleTheirs,
              ]}
            >
              {!c.mine && <Text style={styles.author}>{c.author}</Text>}
              <Text style={styles.msgText}>{isLive ? c.text : c.text}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.macroRow}>
        {CHAT_MACROS.map((m) => (
          <TouchableOpacity
            key={m.ru}
            style={styles.macroChip}
            onPress={() => setDraft(lang === 'ru' ? m.ru : m.en)}
            activeOpacity={0.7}
          >
            <Text style={styles.macroTxt}>{lang === 'ru' ? m.ru : m.en}</Text>
          </TouchableOpacity>
        ))}
        {userMacros.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.macroChip, styles.macroChipMine]}
            onPress={() => setDraft(m)}
            onLongPress={() => removeUserMacro(m)}
            activeOpacity={0.7}
          >
            <Text style={[styles.macroTxt, styles.macroTxtMine]} numberOfLines={1}>
              {m}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.macroAddChip}
          onPress={() => setAddingMacro(!addingMacro)}
          activeOpacity={0.7}
        >
          <Text style={styles.macroTxt}>{addingMacro ? '✕' : '＋'}</Text>
        </TouchableOpacity>
      </View>
      {addingMacro && (
        <View style={styles.macroAddRow}>
          <TextInput
            value={macroDraft}
            onChangeText={setMacroDraft}
            onSubmitEditing={addUserMacro}
            placeholder={lang === 'ru' ? 'Текст нового макроса...' : 'New macro text...'}
            placeholderTextColor="rgba(255,255,255,0.3)"
            maxLength={64}
            style={styles.macroInput}
          />
          <TouchableOpacity style={styles.macroOk} onPress={addUserMacro} activeOpacity={0.7}>
            <Text style={{ color: '#fff', fontSize: 13 }}>✓</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={send}
          placeholder={lang === 'ru' ? 'Сообщение команде...' : 'Message the team...'}
          placeholderTextColor="rgba(255,255,255,0.3)"
          maxLength={128}
          style={styles.input}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={send}>
          <Text style={{ color: '#fff', fontSize: 15 }}>➤</Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  search: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    fontSize: 12.5,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 8,
  },
  list: { maxHeight: 320, marginBottom: 10 },
  empty: { color: colors.textMuted, fontSize: 12, paddingVertical: 10 },
  row: { flexDirection: 'row', marginBottom: 8 },
  bubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9 },
  bubbleMine: {
    backgroundColor: 'rgba(96,165,250,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.4)',
  },
  bubbleTheirs: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  author: { color: eventPalette.green, fontSize: 10, marginBottom: 2 },
  msgText: { color: colors.textPrimary, fontSize: 13 },
  macroRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  macroChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.3)',
    maxWidth: 160,
  },
  macroChipMine: {
    backgroundColor: 'rgba(96,165,250,0.14)',
    borderColor: 'rgba(96,165,250,0.35)',
  },
  macroTxt: { color: eventPalette.green, fontSize: 11 },
  macroTxtMine: { color: eventPalette.blue },
  macroAddChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  macroAddRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  macroInput: {
    flex: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    fontSize: 12.5,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.4)',
  },
  macroOk: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: eventPalette.green,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: eventPalette.blue,
  },
});
