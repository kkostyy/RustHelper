import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
export default function PumpjackScreen({ lang='ru' }) {
  const [diesel, setDiesel] = useState('1');
  const n = Math.max(0, Number(diesel||0));
  return (
    <View style={s.fill}><Text style={s.title}>{lang==='ru'?'Насос':'Pumpjack'}</Text>
    <TextInput style={s.in} value={String(diesel)} onChangeText={setDiesel} keyboardType="number-pad" />
    <Text style={s.res}>Crude Oil: {n*60}</Text><Text style={s.res}>Time: {Math.floor(n*130/60)}m {n*130%60}s</Text>
    </View>
  );
}
const s=StyleSheet.create({fill:{flex:1,padding:20,backgroundColor:'#0f1a2e'},title:{color:'#fff',fontSize:20,fontWeight:'700'},in:{backgroundColor:'rgba(255,255,255,0.06)',color:'#fff',borderRadius:10,padding:10,fontSize:16,borderWidth:1,borderColor:'rgba(255,255,255,0.12)',marginVertical:10},res:{color:'#fb8c00',fontSize:16,fontWeight:'700',marginVertical:4}});
