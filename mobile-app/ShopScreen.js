import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { colors, eventPalette } from './theme';
import { GlassCard } from './ui';
import { VEND_PRICES } from './shops/prices';

const items = Object.entries(VEND_PRICES).map(([k, v]) => ({ key: k, ...v }));

export default function ShopScreen({ lang = 'ru' }) {
  const [sel, setSel] = useState({}); // { key: count }
  const total = items.reduce((s, it) => s + (sel[it.key] || 0) * it.price, 0);

  const inc = (k) => setSel((p) => ({ ...p, [k]: (p[k] || 0) + 1 }));
  const dec = (k) => setSel((p) => { const n = (p[k] || 0) - 1; if (n <= 0) { const { [k]: _, ...rest } = p; return rest; } return { ...p, [k]: n }; });

  return (
    <GlassCard>
      <Text style={s.title}>{lang === 'ru' ? '🏪 Магазины — выбор товаров' : '🏪 Shops — pick items'}</Text>
      <Text style={s.sub}>{lang === 'ru' ? 'Выбирай несколько → сумма снизу' : 'Select several → total below'}</Text>

      <ScrollView>
        <View style={s.grid}>
          {items.map((it) => {
            const n = sel[it.key] || 0;
            return (
              <View key={it.key} style={s.card}>
                <Image source={{ uri: 'https://placehold.co/64x64/251/146/60/png?text=' + encodeURIComponent(it.ru.slice(0, 2)) }} style={{ width: 48, height: 48, borderRadius: 8, resizeMode: 'contain', backgroundColor: 'rgba(251,146,60,0.12)' }} />
                <Text style={s.name}>{it.ru}</Text>
                <Text style={s.price}>{it.price}  ₽≤≈</Text>
                <View style={s.ctrl}>
                  <TouchableOpacity onPress={() => dec(it.key)} style={[s.btn, n <= 0 && s.btnDis]}><Text style={sbtn}>−</Text></TouchableOpacity>
                  <Text style={s.count}>{n}</Text>
                  <TouchableOpacity onPress={() => inc(it.key)} style={s.btn}><Text style={sbtn}>+</Text></TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={s.totalBox}>
        <Text style={s.totalLabel}>{lang === 'ru' ? 'ИТОГО' : 'TOTAL'}</Text>
        <Text style={s.totalNum}>{total}  ₽≤≈</Text>
      </View>
    </GlassCard>
  );
}

const s = StyleSheet.create({
  title: { color: eventPalette.orange, fontSize: 15, fontWeight: '800', textAlign: 'center', marginBottom: 2 },
  sub: { color: colors.textMuted, fontSize: 11, textAlign: 'center', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  card: { width: '48%', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 8, alignItems: 'center' },
  name: { color: colors.textPrimary, fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 4, height: 28 },
  price: { color: eventPalette.orange, fontWeight: '800', fontSize: 12, marginVertical: 2 },
  ctrl: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  btn: { width: 28, height: 28, borderRadius: 6, backgroundColor: 'rgba(251,146,60,0.2)', justifyContent: 'center', alignItems: 'center' },
  btnDis: { opacity: 0.35 },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },
  count: { color: colors.textPrimary, fontWeight: '700', fontSize: 13, minWidth: 22, textAlign: 'center' },
  totalBox: { marginTop: 10, padding: 10, borderRadius: 10, backgroundColor: 'rgba(251,146,60,0.12)', borderWidth: 1, borderColor: 'rgba(251,146,60,0.3)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: eventPalette.orange, fontWeight: '800', fontSize: 13 },
  totalNum: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
});
