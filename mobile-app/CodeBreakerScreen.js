// G3.2 Взлом дверных кодов — по references/photo_2
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from './theme';
const KEY = 'rc_codebreaker_v1';
const TOP100 = ['0000','1234','1111','9999','0001','1000','7777','2222','3333','4444','5555','6666','8888','1212','6969','9876','4321','2024','2025','3652','5566','9870','5678','8765','1210','1313','1414','1515','7771','8881','9998','7778','3331','5551','1112','2221','1230','1001','1002','1010','1100','1011','1101','1110','2000','3000','4000','5000','6000','7000','8000','9000','0123','0124','0125','0126','0127','0128','0129','0130'];
export default function CodeBreakerScreen({ lang = 'ru' }) {
  const [input, setInput] = useState('');
  const [saved, setSaved] = useState([]);
  useEffect(() => { (async () => { try { const r = await AsyncStorage.getItem(KEY); setSaved(r ? JSON.parse(r) : []); } catch(e){} })(); }, []);
  const persist = async (arr) => { try { await AsyncStorage.setItem(KEY, JSON.stringify(arr)); } catch(e){} setSaved(arr); };
  const add = () => { if (input.length === 4 && !saved.includes(input)) persist([...saved, input]); setInput(''); };
  const addRandom = () => { const r = String(Math.floor(Math.random()*10000)).padStart(4,'0'); add(); setInput(r); };
  const clearAll = () => persist([]);
  const keys = ['1','2','3','4','5','6','7','8','9','0'];
  return (
    <View style={s.fill}><Text style={s.title}>{lang === 'ru' ? 'Взлом дверных кодов' : 'Code Breaker'}</Text>
    <View style={s.display}><Text style={s.displayTxt}>{input || '____'}</Text></View>
    <View style={s.grid}>{keys.map(k => (
      <TouchableOpacity key={k} style={s.keyBtn} onPress={() => setInput(input + k)}><Text style={s.keyTxt}>{k}</Text></TouchableOpacity>
    ))}
    <TouchableOpacity style={[s.keyBtn, s.keyRed]} onPress={() => setInput('')}><Text style={s.keyTxt}>C</Text></TouchableOpacity>
    <TouchableOpacity style={[s.keyBtn, s.keyGreen]} onPress={add}><Text style={s.keyTxt}>{lang === 'ru' ? 'Добавить' : 'Add'}</Text></TouchableOpacity>
    <TouchableOpacity style={[s.keyBtn, s.keyGreen]} onPress={addRandom}><Text style={s.keyTxt}>{lang === 'ru' ? 'Новый случайный' : 'Random new'}</Text></TouchableOpacity>
    </View>
    <Text style={s.sub}>{lang === 'ru' ? 'Top-100 частых кодов: ' : 'Top-100 common: '}{TOP100.slice(0,10).join(', ')}…</Text>
    <Text style={s.sub}>Saved ({saved.length}): {saved.join(', ') || '—'}</Text>
    <TouchableOpacity style={s.btnClear} onPress={clearAll}><Text style={s.btnClearTxt}>{lang === 'ru' ? 'Сброс: ' + saved.length + ' кодов' : 'Reset: ' + saved.length}</Text></TouchableOpacity>
    </View>
  );
}
const s = StyleSheet.create({ fill: { flex: 1, padding: 20, backgroundColor: '#0f1a2e' }, title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 14 }, display: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }, displayTxt: { color: '#fff', fontSize: 24, letterSpacing: 6, fontWeight: '700' }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }, keyBtn: { width: 64, height: 56, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }, keyRed: { backgroundColor: 'rgba(255,59,48,0.2)', borderColor: 'rgba(255,59,48,0.5)' }, keyGreen: { backgroundColor: 'rgba(52,199,89,0.2)', borderColor: 'rgba(52,199,89,0.5)' }, keyTxt: { color: '#fff', fontSize: 16, fontWeight: '700' }, sub: { color: '#aaa', fontSize: 11, marginTop: 6, lineHeight: 16 }, btnClear: { backgroundColor: '#8e8e93', borderRadius: 10, padding: 12, marginTop: 8, alignSelf: 'flex-start' }, btnClearTxt: { color: '#fff', fontWeight: '600' } });
