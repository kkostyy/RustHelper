import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
export default function CrossbreedingScreen({ lang='ru' }) {
  return (
    <View style={s.fill}><Text style={s.title}>{lang==='ru'?'Ферма и селекция':'Crossbreeding Lab'}</Text>
    <Text style={s.sub}>6 генов: G/Y/H/W/X/— | Цель: G-G-Y-Y-Y-Y | Клоны: __</Text>
    <Text style={s.hint}>Матрица 4×4, сравнение с целевым, рекомендации плана посадки.</Text>
    </View>
  );
}
const s=StyleSheet.create({fill:{flex:1,padding:20,backgroundColor:'#0f1a2e'},title:{color:'#fff',fontSize:20,fontWeight:'700'},sub:{color:'#ddd',fontSize:13,marginTop:12},hint:{color:'#aaa',fontSize:11,marginTop:8}});
