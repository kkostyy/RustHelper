import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from './theme';
export default function QuarryScreen({ lang='ru' }) {
  const [type, setType] = useState('stone');
  const [diesel, setDiesel] = useState('10');
  const n = Math.max(0, Number(diesel||0));
  const rates = { stone: { name: 'Stone Quarry', out: { Stones: n*5000, Metal: n*1000 } }, sulfur: { name: 'Sulfur Quarry', out: { Sulfur: n*2000, Metal: n*500 } }, hqm: { name: 'HQM Quarry', out: { HQM: n*100, Metal: n*200 } } };
  const r = rates[type];
  return (
    <View style={s.fill}><Text style={s.title}>{lang==='ru'?'Калькулятор карьера':'Quarry Calculator'}</Text>
    <View style={s.row}>{['stone','sulfur','hqm'].map(k=><TouchableOpacity key={k} style={[s.btnSmall, type===k&&s.btnActive]} onPress={()=>setType(k)}><Text style={s.btnTxt}>{r.name}</Text></TouchableOpacity>)}</View>
    <Text style={s.inp}>Diesel: {n}</Text>
    <View style={s.table}>{Object.entries(r.out).map(([k,v])=><View key={k} style={s.row2}><Text style={s.cell}>{k}</Text><Text style={s.cell}>{v}</Text></View>)}</View>
    </View>
  );
}
const s=StyleSheet.create({fill:{flex:1,padding:20,backgroundColor:'#0f1a2e'},title:{color:'#fff',fontSize:20,fontWeight:'700',marginBottom:14},row:{flexDirection:'row',gap:8,marginBottom:14},btnSmall:{backgroundColor:'rgba(255,255,255,0.08)',borderRadius:10,padding:10,borderWidth:1,borderColor:'rgba(255,255,255,0.1)'},btnActive:{borderColor:'#fb8c00',backgroundColor:'rgba(251,140,0,0.15)'},btnTxt:{color:'#fff',fontWeight:'600'},inp:{color:'#ddd',fontSize:14,marginBottom:8},table:{marginTop:8},row2:{flexDirection:'row',paddingVertical:4,borderBottomWidth:1,borderColor:'rgba(255,255,255,0.08)'},cell:{color:'#fff',fontSize:13,flex:1}});
