// G3.1 Калькулятор гниения — по макету из references/photo_1
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { colors, eventPalette } from './theme';
const MATERIALS = { twig: { ru: 'Веточка', en: 'Twig', hp: 10, hours: 1 }, wood: { ru: 'Дерево', en: 'Wood', hp: 250, hours: 2 }, stone: { ru: 'Камень', en: 'Stone', hp: 500, hours: 5 }, sheet: { ru: 'Металл', en: 'Sheet Metal', hp: 1000, hours: 8 }, armored: { ru: 'Бронь', en: 'Armored', hp: 2000, hours: 12 } };
export default function DecayCalcScreen({ lang = 'ru' }) {
  const [mat, setMat] = useState('wood');
  const [currentHP, setCurrentHP] = useState('250');
  const m = MATERIALS[mat];
  const hpVal = Math.max(0, Math.min(m.hp, Number(currentHP || 0)));
  const pct = Math.round((hpVal / m.hp) * 100);
  const leftSec = Math.round((hpVal / m.hp) * m.hours * 3600);
  const h = Math.floor(leftSec / 3600); const min = Math.floor((leftSec % 3600) / 60); const s = leftSec % 60;
  const readyTime = new Date(Date.now() + leftSec * 1000).toLocaleTimeString('ru-RU', { hour12: false });
  return (
    <View style={s.fill}><Text style={s.title}>{lang === 'ru' ? 'Калькулятор гниения' : 'Decay Calculator'}</Text>
    <View style={s.matRow}>{Object.entries(MATERIALS).map(([k, v]) => (
      <TouchableOpacity key={k} style={[s.matBtn, mat === k && s.matBtnActive]} onPress={() => setMat(k)}><Text style={s.matBtnTxt}>{lang === 'ru' ? v.ru : v.en}</Text></TouchableOpacity>
    ))}</View>
    <Text style={s.label}>{lang === 'ru' ? 'Макс. ХП: ' + m.hp : 'Max HP: ' + m.hp}</Text>
    <TextInput style={s.input} value={String(currentHP)} onChangeText={setCurrentHP} keyboardType="number-pad" />
    <TouchableOpacity style={s.btnReset} onPress={() => setCurrentHP(String(m.hp))}><Text style={s.btnTxt}>{lang === 'ru' ? 'Сброс' : 'Reset'}</Text></TouchableOpacity>
    <Text style={s.barText}>{lang === 'ru' ? 'Осталось ХП: ' + hpVal + ' (' + pct + '%)' : 'HP left: ' + hpVal + ' (' + pct + '%)'}</Text>
    <Text style={s.big}>{h + 'h ' + min + 'm ' + s + 's'}</Text>
    <Text style={s.bigGray}>{lang === 'ru' ? 'Готово к рейду: ' + readyTime : 'Ready for raid: ' + readyTime}</Text>
    </View>
  );
}
const s = StyleSheet.create({ fill: { flex: 1, padding: 20, backgroundColor: '#0f1a2e' }, title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 14 }, matRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }, matBtn: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10 }, matBtnActive: { borderColor: '#fb8c00', backgroundColor: 'rgba(251,140,0,0.15)' }, matBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '600' }, label: { color: '#aaa', fontSize: 11, marginTop: 6 }, input: { backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff', borderRadius: 10, padding: 10, fontSize: 16, marginTop: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }, btnReset: { backgroundColor: '#fb8c00', borderRadius: 10, padding: 10, marginTop: 8, alignSelf: 'flex-start' }, btnTxt: { color: '#fff', fontWeight: '600' }, barText: { color: '#ddd', marginTop: 14, fontSize: 13 }, big: { color: '#fb8c00', fontSize: 24, fontWeight: '700', marginTop: 6 }, bigGray: { color: '#aaa', fontSize: 14, marginTop: 4 } });
