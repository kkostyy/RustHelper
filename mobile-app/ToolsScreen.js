// ─────────────────────────────────────────────────────────
import DecayCalcScreen from "./DecayCalcScreen";
import ExcavatorScreen from "./ExcavatorScreen";
import QuarryScreen from "./QuarryScreen";
import PumpjackScreen from "./PumpjackScreen";
import CrossbreedingScreen from "./CrossbreedingScreen";
// ИНСТРУМЕНТЫ («Другое → Инструменты»). Каждый инструмент —
// отдельный под-экран (меню рисует OtherScreen):
//   RaidCalcScreen     — рейд-калькулятор по целям + расчёт
//                        своей стены по HP (≈ урон боеприпаса
//                        редактируемый — цифры зависят от
//                        материала и патчей);
//   CodeBreakerScreen  — счётчик перебора кодовых замков;
//   GenesScreen        — кросбридинг генов растений;
//   ExtractorsScreen   — справочник по экстракторам;
//   SulfurConverter    — конвертер серы: сколько чего взорвёшь/
//                        накрафтишь на свой запас, план рейда
//                        с итогом по сере. Цены ≈ ванильные,
//                        редактируемые.
// Рендерится внутри чужого ScrollView — своего скролла нет.
// ─────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { colors, eventPalette } from './theme';
import { GlassCard } from './ui';
import { RAID_TARGETS } from './data/raidTargets';

function fmtNum(n) {
  // ручная группировка разрядов: Hermes без Intl не знает toLocaleString
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function parseNum(v, fallback) {
  const n = Number(String(v).replace(/[^0-9]/g, ''));
  return Number.isFinite(n) && String(v).trim() !== '' ? n : fallback;
}

// ═══════════════════════════════════════════════════════════
// РЕЙД-КАЛЬКУЛЯТОР
// ═══════════════════════════════════════════════════════════
export function RaidCalcScreen({ lang }) {
  const [hp, setHp] = useState('1000');
  // ≈ урон по цели на ванильном балансе; материал стены и патчи меняют цифры
  const [dmg, setDmg] = useState({ c4: '550', rocket: '350', satchel: '90' });

  const hpN = parseNum(hp, 0);
  const est = {
    c4: Math.ceil(hpN / Math.max(1, parseNum(dmg.c4, 550))),
    rocket: Math.ceil(hpN / Math.max(1, parseNum(dmg.rocket, 350))),
    satchel: Math.ceil(hpN / Math.max(1, parseNum(dmg.satchel, 90))),
  };

  return (
    <GlassCard>
      <Text style={styles.screenTitle}>{lang === 'ru' ? '💣 Рейд-калькулятор' : '💣 Raid Calculator'}</Text>

      {/* Готовые цели */}
      <Text style={styles.subsection}>{lang === 'ru' ? 'ТИПОВЫЕ ЦЕЛИ' : 'COMMON TARGETS'}</Text>
      <Text style={styles.disclaimer}>
        {lang === 'ru'
          ? 'Цифры для жёсткой стороны на ванильном балансе, сверены на август 2026. Сервер может использовать другой баланс урона — если числа не сходятся в игре, доверяйте своему опыту на конкретном сервере.'
          : 'Numbers for the hard side on vanilla balance, checked August 2026. A server may use different damage scaling — if the numbers don\'t add up in game, trust your experience on that server.'}
      </Text>
      {RAID_TARGETS.map((tg) => (
        <View key={tg.id} style={styles.raidCard}>
          <View style={styles.raidHeaderRow}>
            <Text style={styles.raidTitle}>{tg.name}</Text>
            <Text style={styles.raidHp}>{tg.hp} HP</Text>
          </View>
          <View style={styles.raidStatsRow}>
            {tg.c4 != null && <Text style={styles.raidStat}>💣 C4 ×{tg.c4}</Text>}
            {tg.rockets != null && <Text style={styles.raidStat}>🚀 ×{tg.rockets}</Text>}
            {tg.satchels != null && (
              <Text style={styles.raidStat}>🎒 ×{tg.satchels}</Text>
            )}
          </View>
          <Text style={styles.raidSulfur}>~{fmtNum(tg.sulfur)} {lang === 'ru' ? 'серы' : 'sulfur'}</Text>
          {!!tg.note && <Text style={styles.raidNote}>{tg.note}</Text>}
        </View>
      ))}

      {/* Своя цель: HP → количество боеприпасов */}
      <Text style={styles.subsection}>{lang === 'ru' ? 'СВОЯ ЦЕЛЬ ПО HP' : 'CUSTOM TARGET BY HP'}</Text>
      <View style={styles.calcBox}>
        <Text style={styles.label}>{lang === 'ru' ? 'HP цели' : 'Target HP'}</Text>
        <TextInput
          style={[styles.inputMono, { color: eventPalette.orange }]}
          value={hp}
          onChangeText={(v) => setHp(v.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          placeholder="1000"
          placeholderTextColor="rgba(255,255,255,0.3)"
        />
        <Text style={styles.label}>{lang === 'ru' ? '≈ урон одного боеприпаса (можно править)' : '≈ damage per explosive (editable)'}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[['c4', '💣'], ['rocket', '🚀'], ['satchel', '🎒']].map(([k, ic]) => (
            <View key={k} style={{ flex: 1 }}>
              <TextInput
                style={[styles.inputMono, { fontSize: 14, letterSpacing: 0 }]}
                value={dmg[k]}
                onChangeText={(v) => setDmg((d) => ({ ...d, [k]: v.replace(/[^0-9]/g, '') }))}
                keyboardType="number-pad"
              />
              <Text style={styles.unitLbl}>{ic} {dmg[k] || '—'} {lang === 'ru' ? 'урона' : 'dmg'}</Text>
            </View>
          ))}
        </View>

        <View style={styles.estGrid}>
          <View style={styles.estCell}>
            <Text style={styles.estVal}>×{fmtNum(est.c4)}</Text>
            <Text style={styles.estLbl}>C4</Text>
          </View>
          <View style={styles.estCell}>
            <Text style={styles.estVal}>×{fmtNum(est.rocket)}</Text>
            <Text style={styles.estLbl}>{lang === 'ru' ? 'ракет' : 'rockets'}</Text>
          </View>
          <View style={styles.estCell}>
            <Text style={styles.estVal}>×{fmtNum(est.satchel)}</Text>
            <Text style={styles.estLbl}>{lang === 'ru' ? 'сатчелов' : 'satchels'}</Text>
          </View>
        </View>
        <Text style={styles.disclaimerNoBox}>
          {lang === 'ru'
            ? '≈ Округление вверх; реальный расход зависит от материала стены, угла попадания и патчей — бери 1–2 про запас.'
            : '≈ Rounded up; real usage depends on wall material, hit angle and patches — take 1–2 spare.'}
        </Text>
      </View>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════
// CODE BREAKER
// ═══════════════════════════════════════════════════════════
export function CodeBreakerScreen({ lang }) {
  const [code, setCode] = useState(0);
  const [autoOn, setAutoOn] = useState(false);
  const [speedMs, setSpeedMs] = useState(800);
  const intervalRef = useRef(null);

  const formatted = String(code % 10000).padStart(4, '0');

  const step = (delta) => {
    setCode((c) => (((c + delta) % 10000) + 10000) % 10000);
  };

  useEffect(() => {
    if (autoOn) {
      intervalRef.current = setInterval(() => step(1), speedMs);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => intervalRef.current && clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOn, speedMs]);

  return (
    <GlassCard>
      <Text style={styles.screenTitle}>🔢 CODE BREAKER</Text>
      <Text style={styles.disclaimer}>
        {lang === 'ru'
          ? 'Просто счётчик для систематического перебора кода на кодовом замке (0000–9999) — Rust+ не даёт доступа к самим дверям, это чисто вспомогательный инструмент, чтобы не сбиться со счёта вручную.'
          : 'Just a counter for systematically trying lock codes (0000–9999) — Rust+ gives no access to doors themselves; this only helps you keep count by hand.'}
      </Text>

      <View style={styles.codeDisplay}>
        <Text style={styles.codeText}>{formatted}</Text>
      </View>

      <View style={styles.codeRow}>
        {[-100, -10, -1, 1, 10, 100].map((d) => (
          <TouchableOpacity key={d} style={styles.codeBtn} onPress={() => step(d)}>
            <Text style={styles.codeBtnText}>{d > 0 ? `+${d}` : d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.codeRow}>
        <TouchableOpacity
          style={[styles.codeBtnWide, autoOn && styles.codeBtnWideActive]}
          onPress={() => setAutoOn((v) => !v)}
        >
          <Text style={styles.codeBtnText}>{autoOn ? '⏸' : '▶'} {autoOn ? (lang === 'ru' ? 'Стоп' : 'Stop') : lang === 'ru' ? 'Авто-перебор' : 'Auto-try'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.codeBtnWide} onPress={() => setCode(0)}>
          <Text style={styles.codeBtnText}>{lang === 'ru' ? 'Сброс' : 'Reset'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.speedRow}>
        {[1500, 800, 400].map((ms) => (
          <TouchableOpacity
            key={ms}
            style={[styles.speedBtn, speedMs === ms && styles.speedBtnActive]}
            onPress={() => setSpeedMs(ms)}
          >
            <Text style={styles.speedBtnText}>
              {ms === 1500 ? (lang === 'ru' ? 'Медленно' : 'Slow') : ms === 800 ? (lang === 'ru' ? 'Средне' : 'Medium') : lang === 'ru' ? 'Быстро' : 'Fast'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════
// КРОССБРИДИНГ ГЕНОВ
// ═══════════════════════════════════════════════════════════
// Порядок «силы» генов: X < W < H < Y < G
const GENE_RANK = { X: 0, W: 1, H: 2, Y: 3, G: 4 };

function sanitizeGenes(v) {
  return v.toUpperCase().replace(/[^GYHWX]/g, '').slice(0, 6);
}

export function GenesScreen({ lang }) {
  const [parentA, setParentA] = useState('GGHYYX');
  const [parentB, setParentB] = useState('YYHHXX');
  const ok = parentA.length === 6 && parentB.length === 6;
  const child = ok
    ? parentA
        .split('')
        .map((g, i) => (GENE_RANK[g] >= GENE_RANK[parentB[i]] ? g : parentB[i]))
        .join('')
    : null;

  return (
    <GlassCard>
      <Text style={styles.screenTitle}>{lang === 'ru' ? '🌱 Кросбридинг генов' : '🌱 Gene Crossbreeding'}</Text>
      <Text style={styles.disclaimer}>
        {lang === 'ru'
          ? 'Механика скрещивания: в каждом из 6 слотов потомок получает сильнейший ген из двух родителей (G > Y > H > W > X). Введи генные цепочки родителей — получишь идеального потомка от этой пары.'
          : 'Breeding mechanic: for each of the 6 slots the child takes the strongest gene from either parent (G > Y > H > W > X). Enter both parent gene strings to get their best possible offspring.'}
      </Text>

      <Text style={styles.geneLegend}>
        {lang === 'ru'
          ? 'G — урожайность · H — выносливость (холод) · Y — скорость роста · W — экономия воды · X — пустой'
          : 'G — yield · H — hardiness (cold) · Y — growth speed · W — less water · X — empty'}
      </Text>

      <Text style={styles.label}>{lang === 'ru' ? 'Родитель A' : 'Parent A'}</Text>
      <TextInput
        style={[styles.inputMono, { color: eventPalette.blue }]}
        value={parentA}
        onChangeText={(v) => setParentA(sanitizeGenes(v))}
        placeholder="GGHYYX"
        placeholderTextColor="rgba(255,255,255,0.3)"
        autoCapitalize="characters"
      />
      <Text style={styles.label}>{lang === 'ru' ? 'Родитель B' : 'Parent B'}</Text>
      <TextInput
        style={[styles.inputMono, { color: eventPalette.purple }]}
        value={parentB}
        onChangeText={(v) => setParentB(sanitizeGenes(v))}
        placeholder="YYHHXX"
        placeholderTextColor="rgba(255,255,255,0.3)"
        autoCapitalize="characters"
      />

      <View style={styles.geneResult}>
        <Text style={styles.geneResultLabel}>{lang === 'ru' ? 'Лучший потомок' : 'Best offspring'}</Text>
        <Text style={[styles.geneResultText, !ok && styles.geneResultEmpty]}>
          {ok ? child : lang === 'ru' ? '— введи по 6 генов у обоих —' : '— enter 6 genes for both —'}
        </Text>
        {ok && (
          <TouchableOpacity
            style={styles.copyBtn}
            onPress={() => Clipboard.setString(child)}
          >
            <Text style={{ fontSize: 13 }}>📋</Text>
          </TouchableOpacity>
        )}
      </View>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════
// ЭКСТРАКТОРЫ
// ═══════════════════════════════════════════════════════════
const EXTRACTORS = [
  {
    icon: '🪨',
    name: 'Карьер (камень)',
    gives: 'камень + МВК-камень',
    rate: '≈5 200 камня/ч',
    fuel: 'Дизель',
    note: 'Ставится на каменных месторождениях, продукт сыпется в ящик рядом.',
  },
  {
    icon: '⛏️',
    name: 'Карьер (сера)',
    gives: 'серная руда + камень',
    rate: '≈1 900 серной руды/ч',
    fuel: 'Дизель',
    note: 'Тот же принцип; сера — приоритет для боеприпасов.',
  },
  {
    icon: '🛢️',
    name: 'Нефтяная вышка (Pump Jack)',
    gives: 'сырая нефть',
    rate: null,
    fuel: 'Дизель',
    note: 'Один тип точки на карте; нефть перерабатывается в НПЗ или рефайнери.',
  },
  {
    icon: '💧',
    name: 'Водяной насос',
    gives: 'вода в систему орошения',
    rate: null,
    fuel: 'Не нужен',
    note: 'Ставится на пресную воду; питает спринклеры через трубы.',
  },
];

export function ExtractorsScreen({ lang }) {
  return (
    <GlassCard>
      <Text style={styles.screenTitle}>{lang === 'ru' ? '⛏️ Экстракторы' : '⛏️ Extractors'}</Text>
      <Text style={styles.disclaimer}>
        {lang === 'ru'
          ? 'Точные расценки добычи разработчики патчат регулярно — здесь только устройство и логика каждого экстрактора. Сколько в час — смотри по факту на своём сервере.'
          : 'Extraction rates are patched regularly — this covers what each extractor is and how it works. Check actual per-hour output on your server.'}
      </Text>
      {EXTRACTORS.map((ex) => (
        <View key={ex.name} style={styles.extractCard}>
          <Text style={styles.proName}>
            {ex.icon} {ex.name}
          </Text>
          <Text style={styles.proMeta}>
            {lang === 'ru' ? 'Даёт' : 'Produces'}: {ex.gives}
          </Text>
          <Text style={styles.proMeta}>
            {lang === 'ru' ? 'Топливо' : 'Fuel'}: {ex.fuel}
          </Text>
          {!!ex.rate && <Text style={[styles.proMeta, { color: '#e0a800', fontWeight: '600' }]}>≈ {ex.rate.replace('≈ ', '')}</Text>}
          <Text style={[styles.copyDesc, { marginTop: 4, fontStyle: 'italic' }]}>💡 {ex.note}</Text>
        </View>
      ))}
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════
// КОНВЕРТЕР СЕРЫ
// Запас серы → сколько чего можно сделать. Цены ≈ ванильные
// (сера внутри рецептов через порох/взрывчатку), редактируемые:
// модифицированные серверы часто меняют рецепты.
// ═══════════════════════════════════════════════════════════
const SULFUR_ITEMS = [
  { id: 'rocket', icon: '🚀', name: { ru: 'Ракета', en: 'Rocket' }, defCost: 1400 },
  { id: 'c4', icon: '💣', name: { ru: 'C4', en: 'C4' }, defCost: 2200 },
  { id: 'satchel', icon: '🎒', name: { ru: 'Сатчел', en: 'Satchel' }, defCost: 480 },
  { id: 'ammo', icon: '🔫', name: { ru: 'Патроны (rifle)', en: 'Rifle ammo' }, defCost: 10 },
];

export function SulfurConverterScreen({ lang }) {
  const [stock, setStock] = useState('');
  const [costs, setCosts] = useState({});
  const [plan, setPlan] = useState({}); // план рейда: сколько штук хотим

  const costOf = (id, def) => parseNum(costs[id], def) || def;
  const stockN = parseNum(stock, 0);

  const plannedSulfur = SULFUR_ITEMS.reduce(
    (sum, it) => sum + parseNum(plan[it.id], 0) * costOf(it.id, it.defCost),
    0
  );
  const enough = stockN >= plannedSulfur;

  return (
    <GlassCard>
      <Text style={styles.screenTitle}>{lang === 'ru' ? '🟡 Конвертер серы' : '🟡 Sulfur Converter'}</Text>
      <Text style={styles.disclaimer}>
        {lang === 'ru'
          ? 'Цены ≈ ванильные (сера через порох и взрывчатку), редактируются тапом: модовые серверы часто меняют рецепты. «Есть запас» показывает максимум каждого предмета; «План рейда» суммирует выбранное и сверяет с запасом.'
          : 'Costs are ≈ vanilla (sulfur via gunpowder & explosives) and tappable-editable: modded servers often change recipes. "Stock" shows the max of each item; "Raid plan" totals your picks against the stock.'}
      </Text>

      {/* Запас серы */}
      <Text style={styles.label}>{lang === 'ru' ? 'Запас серы' : 'Sulfur stock'}</Text>
      <TextInput
        style={[styles.inputMono, { color: '#e0a800', fontSize: 20 }]}
        value={stock}
        onChangeText={(v) => setStock(v.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor="rgba(255,255,255,0.3)"
      />
      {/* Быстрые пресеты запаса */}
      <View style={styles.speedRow}>
        {[5000, 10000, 30000].map((n) => (
          <TouchableOpacity key={n} style={styles.speedBtn} onPress={() => setStock(String(n))}>
            <Text style={styles.speedBtnText}>{fmtNum(n)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Максимум из запаса + редактор цен */}
      <Text style={styles.subsection}>{lang === 'ru' ? 'ХВАТИТ НА' : 'STOCK BUYS'}</Text>
      {SULFUR_ITEMS.map((it) => {
        const c = costOf(it.id, it.defCost);
        const maxN = Math.floor(stockN / Math.max(1, c));
        return (
          <View key={it.id} style={styles.convRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.proName}>{it.icon} {lang === 'ru' ? it.name.ru : it.name.en}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Text style={[styles.copyDesc, { marginRight: 6 }]}>≈</Text>
                <TextInput
                  style={styles.costInput}
                  value={String(costs[it.id] != null ? costs[it.id] : it.defCost)}
                  onChangeText={(v) => setCosts((s) => ({ ...s, [it.id]: v.replace(/[^0-9]/g, '') }))}
                  keyboardType="number-pad"
                />
                <Text style={[styles.copyDesc, { marginLeft: 6 }]}>
                  {lang === 'ru' ? 'серы/шт' : 'sulfur/ea'}
                </Text>
              </View>
            </View>
            <View style={styles.maxChip}>
              <Text style={styles.maxTxt}>×{fmtNum(maxN)}</Text>
            </View>
          </View>
        );
      })}

      {/* План рейда */}
      <Text style={styles.subsection}>{lang === 'ru' ? 'ПЛАН РЕЙДА' : 'RAID PLAN'}</Text>
      {SULFUR_ITEMS.map((it) => {
        const c = costOf(it.id, it.defCost);
        const q = parseNum(plan[it.id], 0);
        return (
          <View key={`plan-${it.id}`} style={styles.planRow}>
            <Text style={[styles.proName, { flex: 1 }]}>
              {it.icon} {lang === 'ru' ? it.name.ru : it.name.en}
            </Text>
            <TextInput
              style={styles.qtyInput}
              value={plan[it.id] != null ? String(plan[it.id]) : ''}
              onChangeText={(v) => setPlan((p) => ({ ...p, [it.id]: v.replace(/[^0-9]/g, '') }))}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
            <Text style={[styles.copyDesc, { width: 96, textAlign: 'right' }]}>
              = {fmtNum(q * c)}
            </Text>
          </View>
        );
      })}

      <View style={[styles.totalBox, !enough && stockN > 0 && styles.totalBoxOver]}>
        <Text style={styles.totalLabel}>{lang === 'ru' ? 'Нужно серы' : 'Sulfur needed'}</Text>
        <Text style={styles.totalVal}>{fmtNum(plannedSulfur)}</Text>
        {stockN > 0 && (
          <Text style={[styles.totalSub, { color: enough ? eventPalette.green : eventPalette.red }]}>
            {enough
              ? lang === 'ru'
                ? `✓ хватает (запас ${fmtNum(stockN - plannedSulfur)})`
                : `✓ enough (${fmtNum(stockN - plannedSulfur)} spare)`
              : lang === 'ru'
              ? `⚠️ не хватает ${fmtNum(plannedSulfur - stockN)}`
              : `⚠️ short by ${fmtNum(plannedSulfur - stockN)}`}
          </Text>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  screenTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  subsection: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 8,
  },
  disclaimer: {
    color: colors.textMuted,
    fontSize: 10.5,
    lineHeight: 15,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 8,
  },
  disclaimerNoBox: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 10,
    fontStyle: 'italic',
  },
  raidCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  raidHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  raidTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  raidHp: { color: colors.textMuted, fontSize: 11.5 },
  raidStatsRow: { flexDirection: 'row', gap: 14, marginTop: 7 },
  raidStat: { color: colors.textSecondary, fontSize: 12.5 },
  raidSulfur: { color: '#e0a800', fontSize: 11.5, marginTop: 6, fontWeight: '600' },
  raidNote: { color: colors.textMuted, fontSize: 10.5, marginTop: 4, fontStyle: 'italic' },
  calcBox: {
    backgroundColor: 'rgba(251,146,60,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.22)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  label: { color: colors.textMuted, fontSize: 10.5, fontWeight: '600', marginBottom: 5, marginTop: 8 },
  inputMono: {
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'monospace',
    letterSpacing: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  unitLbl: { color: colors.textMuted, fontSize: 9.5, marginTop: 4 },
  estGrid: { flexDirection: 'row', gap: 8, marginTop: 12 },
  estCell: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 12,
    paddingVertical: 10,
  },
  estVal: { color: eventPalette.orange, fontSize: 17, fontFamily: 'monospace', fontWeight: '700' },
  estLbl: { color: colors.textMuted, fontSize: 10, marginTop: 3 },
  codeDisplay: {
    backgroundColor: '#0a1a2f',
    borderRadius: 14,
    paddingVertical: 26,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.22)',
  },
  codeText: { color: eventPalette.green, fontSize: 44, fontFamily: 'monospace', fontWeight: '700', letterSpacing: 6 },
  codeRow: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  codeBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    minWidth: 50,
  },
  codeBtnWide: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
  },
  codeBtnWideActive: { backgroundColor: '#2f7d4f' },
  codeBtnText: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  speedRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  speedBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  speedBtnActive: { backgroundColor: 'rgba(96,165,250,0.22)' },
  speedBtnText: { color: colors.textSecondary, fontSize: 11 },
  geneLegend: {
    color: colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 15,
    marginBottom: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 8,
    borderRadius: 8,
  },
  geneResult: {
    marginTop: 14,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#0a1a2f',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.25)',
  },
  geneResultLabel: { color: colors.textMuted, fontSize: 10.5, marginBottom: 6 },
  geneResultText: {
    color: eventPalette.green,
    fontSize: 24,
    fontFamily: 'monospace',
    letterSpacing: 6,
    fontWeight: '700',
  },
  geneResultEmpty: { color: colors.textMuted, fontSize: 12, letterSpacing: 0 },
  extractCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  copyBtn: {
    backgroundColor: 'rgba(96,165,250,0.22)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 10,
  },
  proName: { color: colors.textPrimary, fontSize: 13.5, fontWeight: '600' },
  proMeta: { color: colors.textSecondary, fontSize: 11.5, marginTop: 3 },
  copyDesc: { color: colors.textMuted, fontSize: 10.5, marginTop: 2 },
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 11,
    marginBottom: 8,
  },
  costInput: {
    width: 64,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 12.5,
    fontFamily: 'monospace',
    color: '#e0a800',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 4,
  },
  maxChip: {
    minWidth: 74,
    alignItems: 'center',
    backgroundColor: 'rgba(224,168,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(224,168,0,0.35)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  maxTxt: { color: '#e0a800', fontSize: 14, fontFamily: 'monospace', fontWeight: '700' },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  qtyInput: {
    width: 64,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
    fontFamily: 'monospace',
    textAlign: 'center',
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  totalBox: {
    marginTop: 12,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(52,211,153,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.28)',
  },
  totalBoxOver: {
    backgroundColor: 'rgba(248,113,113,0.10)',
    borderColor: 'rgba(248,113,113,0.32)',
  },
  totalLabel: { color: colors.textMuted, fontSize: 10.5, marginBottom: 4 },
  totalVal: { color: '#e0a800', fontSize: 24, fontFamily: 'monospace', fontWeight: '700' },
  totalSub: { fontSize: 11, fontWeight: '600', marginTop: 5 },
});
