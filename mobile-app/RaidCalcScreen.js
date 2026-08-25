import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors } from './theme';
const TARGETS=[{id:1,name:'HQM Wall',hp:2000,reg:{c4:7,rocket:1,sulfur:16800,charcoal:22950,lgf:450,metalFrag:1550,cloth:140,fat:315,tech:14}}];
export default function RaidCalcScreen({ lang='ru' }) {
  const [t, setT] = useState(TARGETS[0]);
  const mode = 'reg';
  return (
    <ScrollView style={s.fill}><Text style={s.title}>{lang==='ru'?'💣 Рейд-калькулятор':'💣 Raid Calculator'}</Text>
    {TARGETS.map(tg=>(
      <TouchableOpacity key={tg.id} style={[s.card, t.id===tg.id&&s.cardActive]} onPress={()=>setT(tg)}>
        <Text style={s.cardTitle}>{tg.name}</Text><Text style={s.cardHp}>{tg.hp} HP</Text>
      </TouchableOpacity>
    ))}
    <View style={s.result}><Text style={s.resultLabel}>{lang==='ru'?'Рекомендуется — С4':'Regular — C4'}</Text>
    <Text style={s.resultVal}>C4 × {t.reg.c4} + R × {t.reg.rocket}</Text>
    <Text style={s.resultVal}>Sulf: {t.reg.sulfur.toLocaleString()} · Coal: {t.reg.charcoal.toLocaleString()}</Text></View>
    </ScrollView>
  );
}
const s=StyleSheet.create({fill:{flex:1,backgroundColor:'#0f1a2e'},title:{color:'#fff',fontSize:22,fontWeight:'700',padding:20},card:{backgroundColor:'rgba(255,255,255,0.05)',borderWidth:1,borderColor:'rgba(255,255,255,0.08)',borderRadius:14,padding:14,marginHorizontal:20,marginVertical:6},cardActive:{borderColor:'#fb8c00'},cardTitle:{color:'#fff',fontSize:15,fontWeight:'700'},cardHp:{color:'#fb8c00',fontSize:12},result:{backgroundColor:'rgba(255,255,255,0.05)',borderRadius:14,padding:14,margin:20,borderWidth:1,borderColor:'rgba(255,255,255,0.1)'},resultLabel:{color:'#aaa',fontSize:11,fontWeight:'600'},resultVal:{color:'#fff',fontSize:14,marginTop:4}});
