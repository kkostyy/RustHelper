import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, eventPalette } from './theme';
import { GlassCard } from './ui';
import { SHOP_CATS } from './shops/shopRef';
import { STORE_LINKS } from './shops/storeRefs';
import { VEND_PRICES } from './shops/prices';

export default function ShopScreen({ lang = 'ru' }) {
  const t = (o) => (lang === 'ru' ? o.ru : o.en);
  return (
    <GlassCard>
      <Text style={s.title}>{lang === 'ru' ? '🏪 Магазины / Вендоры' : '🏪 Shops / Vendors'}</Text>
      <Text style={s.sub}>{lang === 'ru' ? 'Референсы, категории, ссылки на папки docs/' : 'References, categories, links to docs/ folders'}</Text>

      <ScrollView>
        <Text style={s.h2}>{lang === 'ru' ? 'Категории вендоров' : 'Vending categories'}</Text>
        <View style={s.rowWrap}>
          {Object.entries(SHOP_CATS).map(([k, v]) => (
            <View key={k} style={s.chip}><Text style={s.chipTxt}>{t(v)}</Text></View>
          ))}
        </View>

        <Text style={s.h2}>{lang === 'ru' ? 'Монументы / папки' : 'Monuments / folders'}</Text>
        {STORE_LINKS.map((l) => (
          <View key={l.monument} style={s.linkRow}>
            <Text style={s.linkName}>{t({ ru: l.ru, en: l.en })}</Text>
            <Text style={s.linkPath}>{l.folder}</Text>
          </View>
        ))}

        <Text style={s.h2}>{lang === 'ru' ? 'Цены ≈ (пример)' : 'Prices ≈ (example)'}</Text>
        {Object.entries(VEND_PRICES).map(([k, v]) => (
          <View key={k} style={s.pRow}>
            <Text style={s.pName}>{v.ru}</Text>
            <Text style={s.pPrice}>{v.price}</Text>
          </View>
        ))}
      </ScrollView>
    </GlassCard>
  );
}

const s = StyleSheet.create({
  title: { color: eventPalette.orange, fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  sub: { color: colors.textMuted, fontSize: 11, textAlign: 'center', marginBottom: 10 },
  h2: { color: colors.textPrimary, fontWeight: '700', fontSize: 12, marginTop: 8, marginBottom: 4 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: 'rgba(251,146,60,0.12)', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8, borderWidth: 1, borderColor: 'rgba(251,146,60,0.25)' },
  chipTxt: { color: colors.textPrimary, fontSize: 11, fontWeight: '600' },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.08)' },
  linkName: { color: colors.textSecondary, fontSize: 11 },
  linkPath: { color: colors.textMuted, fontSize: 9 },
  pRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  pName: { color: colors.textSecondary, fontSize: 11 },
  pPrice: { color: eventPalette.orange, fontWeight: '700', fontSize: 11 },
});
