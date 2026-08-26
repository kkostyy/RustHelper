// ─────────────────────────────────────────────────────────
// КАЛЬКУЛЯТОР ГНИЕНИЯ («Другое → Инструменты → Гниение»)
// По макету из references: чипы материалов, ввод текущего ХП,
// живой обратный отсчёт до полного гниения и время «готов к рейду»,
// переключатель 24ч/12ч и кнопка-напоминание.
//
// Значения — ванильные (сверены с rusthelp.com, см.
// rusthelp-reference.txt): вне зоны действия шкафа все ярусы,
// кроме ветки, сгнивают полностью за ≈5 часов; веточка — за ≈1 час.
// После патчей баланса перепроверить!
// ─────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, eventPalette } from './theme';
import { GlassCard } from './ui';
import { pushNotif } from './notifStore';

const FMT_KEY = 'rc_timefmt_v1'; // общий с настройками формат времени ('24'|'12'|'auto')

const MATERIALS = {
  // hours = время полного гниения с максимального ХП (ваниль, вне шкафа)
  twig:     { ru: 'Веточка', en: 'Twig',        icon: '🌿', hp: 10,   hours: 1 },
  wood:     { ru: 'Дерево',  en: 'Wood',        icon: '🪵', hp: 250,  hours: 5 },
  stone:    { ru: 'Камень',  en: 'Stone',       icon: '🪨', hp: 500,  hours: 5 },
  sheet:    { ru: 'Металл',  en: 'Sheet Metal', icon: '⚙️', hp: 1000, hours: 5 },
  armored:  { ru: 'Бронь',   en: 'Armored',     icon: '🛡️', hp: 2000, hours: 5 },
};

const p2 = (x) => String(x).padStart(2, '0');

// Часы с секундами; 12-часовой формат — с AM/PM (Hermes без Intl)
function fmtClock(ms, use24) {
  const d = new Date(ms);
  let h = d.getHours();
  let suf = '';
  if (!use24) {
    suf = h < 12 ? ' AM' : ' PM';
    h = h % 12 || 12;
  }
  return `${p2(h)}:${p2(d.getMinutes())}:${p2(d.getSeconds())}${suf}`;
}

export default function DecayCalcScreen({ lang = 'ru' }) {
  const [mat, setMat] = useState('twig');
  const [hpInput, setHpInput] = useState('10');
  // «якорь» отсчёта: сколько ХП было при последнем изменении и когда
  const [anchor, setAnchor] = useState({ hp: 10, ts: Date.now() });
  const [use24, setUse24] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [remindAt, setRemindAt] = useState(null);
  const remindRef = useRef(null);

  const m = MATERIALS[mat];
  const fullSec = m.hours * 3600;

  // Живой тикающий секундомер
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Формат времени берём из общих настроек (rc_timefmt_v1)
  useEffect(() => {
    AsyncStorage.getItem(FMT_KEY)
      .then((v) => { if (v === '12') setUse24(false); })
      .catch(() => {});
  }, []);

  // Снять таймер напоминания при уходе с экрана
  useEffect(() => () => { if (remindRef.current) clearTimeout(remindRef.current); }, []);

  const applyHp = (text) => {
    setHpInput(text);
    const v = Math.max(0, Math.min(m.hp, Number(text) || 0));
    setAnchor({ hp: v, ts: Date.now() });
  };

  const pickMat = (k) => {
    setMat(k);
    setHpInput(String(MATERIALS[k].hp));
    setAnchor({ hp: MATERIALS[k].hp, ts: Date.now() });
  };

  const resetHp = () => {
    setHpInput(String(m.hp));
    setAnchor({ hp: m.hp, ts: Date.now() });
  };

  // Сколько осталось (сек) от якоря — тикает вместе с `now`
  const leftSec = Math.max(
    0,
    Math.round((anchor.hp / m.hp) * fullSec - (now - anchor.ts) / 1000),
  );
  const hpLeft = Math.max(0, Math.round((leftSec / fullSec) * m.hp));
  const pct = Math.round((hpLeft / m.hp) * 100);
  const readyMs = now + leftSec * 1000;
  const cdH = Math.floor(leftSec / 3600);
  const cdM = Math.floor((leftSec % 3600) / 60);
  const cdS = leftSec % 60;

  const toggleFmt = () => {
    const next = !use24;
    setUse24(next);
    AsyncStorage.setItem(FMT_KEY, next ? '24' : '12').catch(() => {});
  };

  const toggleRemind = () => {
    if (remindAt) {
      if (remindRef.current) clearTimeout(remindRef.current);
      remindRef.current = null;
      setRemindAt(null);
      return;
    }
    if (leftSec <= 0) return;
    const fireIn = leftSec * 1000;
    setRemindAt(readyMs);
    remindRef.current = setTimeout(() => {
      remindRef.current = null;
      setRemindAt(null);
      pushNotif({
        kind: 'event',
        title: {
          ru: '⏰ Строение полностью сгнило',
          en: '⏰ Building fully decayed',
        },
        body: {
          ru: `${lang === 'ru' ? m.ru : m.en}: ХП = 0 — можно рейдить!`,
          en: `${lang === 'ru' ? m.ru : m.en}: HP = 0 — raid time!`,
        },
        important: true,
      });
    }, fireIn);
  };

  const armedLabel = remindAt
    ? (lang === 'ru' ? 'Напоминание в ' : 'Reminder at ') + fmtClock(remindAt, use24)
    : lang === 'ru' ? '⏰ Напомнить' : '⏰ Remind me';

  return (
    <GlassCard>
      <Text style={st.screenTitle}>
        {lang === 'ru' ? 'КАЛЬКУЛЯТОР ГНИЕНИЯ' : 'DECAY CALCULATOR'}
      </Text>
      <Text style={st.subtitle}>
        {lang === 'ru'
          ? 'Узнай, когда строение полностью сгниёт — и бей в нужный момент!'
          : 'Find out when a building fully decays — strike at the right moment!'}
      </Text>

      {/* ── Материал ── */}
      <View style={st.matRow}>
        {Object.entries(MATERIALS).map(([k, v]) => (
          <TouchableOpacity key={k} style={[st.matBtn, mat === k && st.matBtnActive]} onPress={() => pickMat(k)}>
            <Text style={st.matIcon}>{v.icon}</Text>
            <Text style={[st.matTxt, mat === k && st.matTxtActive]}>
              {lang === 'ru' ? v.ru : v.en}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── ХП ── */}
      <View style={st.hpRow}>
        <View style={{ flex: 1 }}>
          <Text style={st.label}>
            {(lang === 'ru' ? 'Макс. ХП: ' : 'Max HP: ') + m.hp}
          </Text>
          <TextInput
            style={st.input}
            value={String(hpInput)}
            onChangeText={applyHp}
            keyboardType="number-pad"
          />
        </View>
        <TouchableOpacity style={st.btnReset} onPress={resetHp}>
          <Text style={st.btnResetTxt}>{lang === 'ru' ? 'Сброс' : 'Reset'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Полоска остатка ── */}
      <Text style={st.barText}>
        {(lang === 'ru' ? 'Осталось ХП: ' : 'HP left: ') + hpLeft + ' (' + pct + '%)'}
      </Text>
      <View style={st.track}>
        <View style={[st.fill, { width: pct + '%' }]} />
      </View>

      {/* ── Отсчёт ── */}
      <Text style={[st.label, { marginTop: 14 }]}>
        {lang === 'ru' ? 'Время до гниения:' : 'Time until decay:'}
      </Text>
      <Text style={st.big}>
        {cdH + 'h ' + p2(cdM) + 'm ' + p2(cdS) + 's'}
      </Text>

      <Text style={[st.label, { marginTop: 10 }]}>
        {lang === 'ru' ? 'Будет готов к рейду в:' : 'Ready for raid at:'}
      </Text>
      <Text style={st.big}>{fmtClock(readyMs, use24)}</Text>

      {/* ── Формат и напоминание ── */}
      <View style={st.btnRow}>
        <TouchableOpacity style={st.btnOrange} onPress={toggleFmt}>
          <Text style={st.btnOrangeTxt}>
            {(lang === 'ru' ? 'Формат времени: ' : 'Time format: ') + (use24 ? '24ч' : '12ч')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[st.btnOrange, remindAt && st.btnArmed]}
          onPress={toggleRemind}
        >
          <Text style={[st.btnOrangeTxt, remindAt && { color: '#ffd54f' }]}>
            {armedLabel}
          </Text>
        </TouchableOpacity>
      </View>

      {!!remindAt && (
        <Text style={st.remindNote}>
          {lang === 'ru'
            ? 'Напоминание сработает, пока приложение открыто.'
            : 'The reminder fires while the app stays open.'}
        </Text>
      )}

      <Text style={st.disclaimer}>
        {lang === 'ru'
          ? '≈ Ванильные значения вне зоны шкафа: веточка ~1 ч, остальные ярусы ~5 ч до полного гниения. После патчей баланса перепроверь.'
          : '≈ Vanilla values outside TC range: twig ~1 h, other tiers ~5 h to full decay. Re-check after balance patches.'}
      </Text>
    </GlassCard>
  );
}

const st = StyleSheet.create({
  screenTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: colors.textMuted, fontSize: 11.5, lineHeight: 16, marginBottom: 14 },
  matRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  matBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(251,146,60,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.45)',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  matBtnActive: {
    backgroundColor: 'rgba(102,187,106,0.22)',
    borderColor: '#66bb6a',
  },
  matIcon: { fontSize: 15, marginBottom: 2 },
  matTxt: { color: '#ffb27a', fontSize: 11, fontWeight: '700' },
  matTxtActive: { color: '#8fe39a' },
  hpRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  input: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 5,
  },
  btnReset: {
    backgroundColor: '#a06a35',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginLeft: 8,
    marginBottom: 1,
  },
  btnResetTxt: { color: '#fff', fontSize: 12.5, fontWeight: '700' },
  barText: { color: colors.textSecondary, fontSize: 12, marginBottom: 6 },
  track: {
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 999, backgroundColor: '#8a7a4e' },
  big: { color: eventPalette.orange, fontSize: 22, fontWeight: '800', marginTop: 3 },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  btnOrange: {
    backgroundColor: '#c96f2e',
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  btnOrangeTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  btnArmed: { backgroundColor: 'rgba(255,213,79,0.18)', borderWidth: 1, borderColor: '#ffd54f' },
  remindNote: { color: colors.textMuted, fontSize: 10.5, marginTop: 8 },
  disclaimer: {
    color: colors.textMuted,
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 8,
  },
});
