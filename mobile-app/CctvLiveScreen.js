import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
export default function CctvLiveScreen({ lang='ru' }) {
  return <View style={s.fill}><Text style={s.title}>{lang==='ru'?'CCTV Live':'CCTV Live'}</Text><Text style={s.sub}>Depth frames → WebRTC/HLS плеер. Коды камер уже в справочнике (F4). Фолбэк: честная ошибка, если поток недоступен.</Text>
  <TouchableOpacity style={s.btn}><Text style={s.btnTxt}>▶ {lang==='ru'?'Смотреть':'Watch'}</Text></TouchableOpacity>
  </View>;
}
const s=StyleSheet.create({fill:{flex:1,padding:20,backgroundColor:'#0f1a2e'},title:{color:'#fff',fontSize:20,fontWeight:'700'},sub:{color:'#aaa',fontSize:13,marginTop:8},btn:{backgroundColor:'#fb8c00',borderRadius:999,padding:12,marginTop:14,alignSelf:'flex-start'},btnTxt:{color:'#fff',fontWeight:'700'}});
