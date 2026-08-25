import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
export default function TurretScreen({ lang='ru' }) {
  return <View style={s.fill}><Text style={s.title}>{lang==='ru'?'Автопилот турелей':'Turret Autopilot'}</Text><Text style={s.sub}>Управление списками авторизации турелей (добавить/удалить SteamID64) — требуется канал /commands set_turret_config.</Text></View>;
}
const s=StyleSheet.create({fill:{flex:1,padding:20,backgroundColor:'#0f1a2e'},title:{color:'#fff',fontSize:20,fontWeight:'700'},sub:{color:'#aaa',fontSize:13,marginTop:8}});
