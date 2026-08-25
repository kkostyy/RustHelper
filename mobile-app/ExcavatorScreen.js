// G3.3 Калькулятор экскаватора
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { colors } from './theme';
export default function ExcavatorScreen({ lang='ru' }) {
  const [diesel, setDiesel] = useState('1');
  const n = Math.max(0, Number(diesel||0));
  return (
    <View style={s.fill}><Text style={s.title}>{lang==='ru'?'Гигантский экскаватор':'Giant Excavator'}</Text>
    <View style={s.row}><TouchableOpacity style={s.btnSmall} onPress={()=>setDiesel(String(Math.max(0,n-10)))}><Text style={s.btnTxt}>-10</Text></TouchableOpacity>
    <TouchableOpacity style={s.btnSmall} onPress={()=>setDiesel(String(Math.max(0,n-1)))}><Text style={s.btnTxt}>-1</Text></TouchableOpacity>
    <TextInput style={s.in} value={String(diesel)} onChangeText={setDiesel} keyboardType="number-pad" />
    <TouchableOpacity style={s.btnSmall} onPress={()=>setDiesel(String(n+1))}><Text style={s.btnTxt}>+1</Text></TouchableOpacity>
    <TouchableOpacity style={s.btnSmall} onPress={()=>setDiesel(String(n+10))}><Text style={s.btnTxt}>+10</Text></TouchableOpacity></View>
    <Text style={s.time}>Time: {n*2} min</Text>
    <View style={s.table}><Text style={s.hdr}>{lang==='ru'?'Предмет':'Item'}</Text><Text style={s.hdr}>{lang==='ru'?'Количество':'Qty'}</Text></View>
    {[
      {name:'HQM Ore',q:n*100},{name:'Sulfur Ore',q:n*2000},{name:'Metal Ore',q:n*5000},{name:'Stones Ore',q:n*10000}
    ].map(i=><View key={i.name} style={s.row2}><Text style={s.cell}>{i.name}</Text><Text style={s.cell}>{i.q}</Text></View>)}
    </View>
  );
}
const s=StyleSheet.create({fill:{flex:1,padding:20,backgroundColor:'#0f1a2e'},title:{color:'#fff',fontSize:20,fontWeight:'700',marginBottom:14},row:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:14},btnSmall:{backgroundColor:'rgba(255,255,255,0.08)',borderRadius:10,paddingVertical:10,paddingHorizontal:12,borderWidth:1,borderColor:'rgba(255,255,255,0.1)'},btnTxt:{color:'#fff',fontWeight:'600'},in:{backgroundColor:'rgba(255,255,255,0.06)',color:'#fff',borderRadius:10,padding:10,width:80,textAlign:'center',borderWidth:1,borderColor:'rgba(255,255,255,0.12)',fontSize:16},time:{color:'#fb8c00',fontSize:16,fontWeight:'700',marginBottom:14},table:{flexDirection:'row',borderBottomWidth:1,borderColor:'rgba(255,255,255,0.12)',paddingBottom:6,marginBottom:6},hdr:{color:'#aaa',fontWeight:'600',flex:1},row2:{flexDirection:'row',paddingVertical:4},cell:{color:'#fff',fontSize:13,flex:1}});
