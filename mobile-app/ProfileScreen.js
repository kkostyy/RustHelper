// G6.1 Профиль / Подписка / Доступы бота — по pln.txt 11.1
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, eventPalette } from './theme';
export default function ProfileScreen({ lang='ru' }) {
  return (
    <View style={s.fill}><Text style={s.title}>{lang==='ru'?'Профиль':'Profile'}</Text>
    <View style={s.card}><Text style={s.cardTitle}>SteamID</Text><Text style={s.cardVal}>7656119…</Text></View>
    <View style={s.card}><Text style={s.cardTitle}>{lang==='ru'?'Google-связка':'Google link'}</Text><Text style={s.cardVal}>{lang==='ru'?'Подключено — подписка по месяцам':'Linked — monthly sub'}</Text><TouchableOpacity style={s.btn}><Text style={s.btnTxt}>{lang==='ru'?'Отвязать':'Unlink'}</Text></TouchableOpacity></View>
    <View style={s.card}><Text style={s.cardTitle}>{lang==='ru'?'Подписка':'Subscription'}</Text><Text style={s.cardVal}>{lang==='ru'?'Premium++ — 1 мес / 3 мес / год':'Premium++ — 1mo / 3mo / yr'}</Text><TouchableOpacity style={s.btn}><Text style={s.btnTxt}>{lang==='ru'?'Управлять':'Manage'}</Text></TouchableOpacity></View>
    <View style={s.card}><Text style={s.cardTitle}>{lang==='ru'?'Доступы бота':'Bot Access'}</Text><Text style={s.cardVal}>everyone / admins / owner</Text></View>
    <View style={s.card}><Text style={s.cardTitle}>{lang==='ru'?'Макросы чата':'Chat Macros'}</Text><Text style={s.cardVal}>+ / long-press delete</Text></View>
    </View>
  );
}
const s=StyleSheet.create({fill:{flex:1,padding:20,backgroundColor:'#0f1a2e'},title:{color:'#fff',fontSize:20,fontWeight:'700',marginBottom:14},card:{backgroundColor:'rgba(255,255,255,0.05)',borderWidth:1,borderColor:'rgba(255,255,255,0.08)',borderRadius:16,padding:14,marginBottom:12},cardTitle:{color:colors.textMuted,fontSize:10.5,fontWeight:'600'},cardVal:{color:'#fff',fontSize:14,marginTop:4},btn:{backgroundColor:colors.accentStrong,borderRadius:999,paddingVertical:10,alignItems:'center',marginTop:8},btnTxt:{color:'#fff',fontWeight:'700'}});
