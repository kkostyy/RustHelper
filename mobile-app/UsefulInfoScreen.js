// ─────────────────────────────────────────────────────────
// 📘 ПОЛЕЗНАЯ ИНФОРМАЦИЯ (обновлено 2026-08-26)
// Ванильные данные, расходы, ссылки — всё ≈, сверяй на сервере.
// ─────────────────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { colors, eventPalette } from './theme';
import { GlassCard } from './ui';

export default function UsefulInfoScreen({ lang = 'ru' }) {
  const t = (o) => (lang === 'ru' ? o.ru : o.en);
  return (
    <GlassCard>
      <Text style={s.title}>{lang === 'ru' ? '📘 Полезная информация' : '📘 Useful Info'}</Text>
      <Text style={s.sub}>{lang === 'ru' ? 'Обновлено 2026-08-26 · данные ≈ ваниль (rusthelp / ruststats)' : 'Updated 2026-08-26 · ≈ vanilla (rusthelp / ruststats)'}</Text>

      <ScrollView>
        <Section title={t({ ru: 'ID предметов', en: 'Item IDs' })}>
          <Text style={s.body}>{lang === 'ru'
            ? 'Проверено против dump v2252 (github.com/Ryan-J-D/Rust-Item-IDs) 2026-08-25. Старые гайды содержат разные ID — не копируй слепо. Сера: компонент серной руды (45) / коробка серы (50). Стены: дерево 78, камень 79, металл 80, броня 81.'
            : 'Verified against dump v2252 (github.com/Ryan-J-D/Rust-Item-IDs) 2026-08-25. Old guides list different IDs — don\'t copy blindly. Sulfur: ore 45 / box 50. Walls: wood 78, stone 79, metal 80, armored 81.'}</Text>
        </Section>

        <Section title={t({ ru: 'Гниение (Decay)', en: 'Decay' })}>
          <Text style={s.body}>{lang === 'ru'
            ? 'Ветка 1 ч, дерево 250 HP / 5 ч, камень 500 / 5 ч, листовый металл 1000 / 5 ч, броня 2000 / 5 ч. Ветку легко починить — другие тира требуют ресурсов.'
            : 'Twig 1 h (10 HP), wood 250 / 5 h, stone 500 / 5 h, sheet metal 1000 / 5 h, armored 2000 / 5 h. Twig easy to repair — higher tiers need resources.'}</Text>
        </Section>

        <Section title={t({ ru: 'Рециркулятор (Recycling)', en: 'Recycling' })}>
          <Text style={s.body}>{lang === 'ru'
            ? 'Шестерни → металл + скрап (NO HQM). Жёлтый < зелёный < powered < красный. HQM даёт пружина/корпус; шестерни — только металл/скрап. Значения ≈ ваниль rusthelp.com (авг. 2026).'
            : 'Gears → metal + scrap (NO HQM). Yellow < green < powered < red. HQM from spring/body only; gears never yield HQM. ≈ vanilla rusthelp (Aug 2026).'}</Text>
        </Section>

        <Section title={t({ ru: 'Поиск игроков (Player lookup)', en: 'Player lookup' })}>
          <Text style={s.body}>{lang === 'ru'
            ? 'Steam XML — без ключа (ник, онлайн, VAC/трейд-бан, возраст). Steam HTML — уровень, баны (regex, публичные). RustLookup (rust-stats.onrender.com) — бесплатная статистика боя (K/D, хед, часы); как 2026-08-25 — Render приостановлен (502/503), показывает честную ошибку. BattleMetrics требует платный ключ (403 без него). ruststats.com мёртв; ruststats.io — ключи вручную через Discord; ruststats.cc / rustclash.com блокируют неклиентов (Cloudflare).'
            : 'Steam XML — keyless (name, online, VAC/trade bans, age). Steam HTML — level, bans (regex, public only). RustLookup (rust-stats.onrender.com) — free combat stats; as of 2026-08-25 Render suspended → honest error. BattleMetrics needs paid key (403). ruststats.com dead; ruststats.io — manual Discord keys; ruststats.cc / rustclash.com block non-browser clients.'}</Text>
        </Section>

        <Section title={t({ ru: 'Сервер / общие', en: 'Server / general' })}>
          <Text style={s.body}>{lang === 'ru'
            ? 'Firebase RTDB — /team, /map, /devices, /events, /chat, /server_info, /commands (write-then-delete). pc-client зеркалит Rust+ API (RUST_PLAYER_ID + TOKEN из сопряжения). APK собирается GitHub Actions (.github/workflows/android-apk.yml) — нет Node/JDK локально.'
            : 'Firebase RTDB — /team, /map, /devices, /events, /chat, /server_info, /commands (write-then-delete). pc-client mirrors Rust+ API (RUST_PLAYER_ID + TOKEN from pairing). APK built by GitHub Actions (.github/workflows/android-apk.yml) — no local Node/JDK.'}</Text>
        </Section>

        <Section title={t({ ru: 'Ссылки', en: 'Links' })}>
          <LinkText url="https://rusthelp.com">rusthelp.com</LinkText>
          <LinkText url="https://github.com/Ryan-J-D/Rust-Item-IDs">Rust Item IDs (v2252)</LinkText>
          <LinkText url="https://rust-stats.onrender.com">RustLookup (suspended)</LinkText>
        </Section>
      </ScrollView>
    </GlassCard>
  );
}

function Section({ title, children }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.card}>{children}</View>
    </View>
  );
}

function LinkText({ url }) {
  return (
    <Text style={s.link} onPress={() => Linking.openURL(url)}>
      ↗ {url}
    </Text>
  );
}

const s = StyleSheet.create({
  title: { color: eventPalette.orange, fontSize: 15, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  sub: { color: colors.textMuted, fontSize: 11, textAlign: 'center', marginBottom: 10 },
  sectionTitle: { color: colors.textPrimary, fontSize: 12.5, fontWeight: '800', marginBottom: 4 },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10 },
  body: { color: colors.textSecondary, fontSize: 11, lineHeight: 16 },
  link: { color: eventPalette.blue, fontSize: 11, fontWeight: '600', marginTop: 2 },
});
