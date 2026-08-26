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
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
// CODE BREAKER — взлом дверных кодов (макет из reference):
// клавиатура ввода + копилка найденных кодов с сохранением в
// AsyncStorage (rc_doorcodes_v1) — коды живут между перезапусками.
// Ниже — прежний авто-счётчик перебора (0000–9999).
// ═══════════════════════════════════════════════════════════
const DOOR_CODES_KEY = 'rc_doorcodes_v1';

export function CodeBreakerScreen({ lang }) {
  const [entry, setEntry] = useState('');
  const [codes, setCodes] = useState([]);
  // прежний счётчик перебора
  const [code, setCode] = useState(0);
  const [autoOn, setAutoOn] = useState(false);
  const [speedMs, setSpeedMs] = useState(800);
  const intervalRef = useRef(null);

  // Загрузка копилки кодов при открытии
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DOOR_CODES_KEY);
        if (raw) setCodes(JSON.parse(raw));
      } catch (e) {}
    })();
  }, []);

  const persistCodes = (next) => {
    setCodes(next);
    AsyncStorage.setItem(DOOR_CODES_KEY, JSON.stringify(next)).catch(() => {});
  };

  const tapKey = (d) => setEntry((e) => (e + d).slice(0, 4));

  const addCode = () => {
    if (entry.length < 4) return;
    persistCodes([...codes, entry]);
    setEntry('');
  };

  // «Добавить и новый случайный»: найденный код — в копилку,
  // в дисплей подставляется новый случайный кандидат на попробовать
  const addAndRandom = () => {
    const next = entry.length === 4 ? [...codes, entry] : codes;
    const rnd = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    persistCodes(next);
    setEntry(rnd);
  };

  const resetAll = () => {
    if (codes.length === 0) return;
    Alert.alert(
      lang === 'ru' ? 'Сбросить все коды?' : 'Reset all codes?',
      lang === 'ru' ? `В копилке ${codes.length} шт.` : `${codes.length} saved.`,
      [
        { text: lang === 'ru' ? 'Отмена' : 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: () => persistCodes([]) },
      ],
    );
  };

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
      <Text style={styles.screenTitle}>
        {lang === 'ru' ? '🔢 Взлом дверных кодов' : '🔢 Door Code Breaker'}
      </Text>
      <Text style={styles.disclaimer}>
        {lang === 'ru'
          ? 'Коды сохраняются в приложении даже после перезапуска. Набрал код с замка — «Добавить» в копилку; «Добавить и новый случайный» — сохранит и подставит случайный кандидат.'
          : 'Codes are saved in the app across restarts. Type a code from a lock — "Add" keeps it; "Add + random" saves it and puts a random candidate in the display.'}
      </Text>

      {/* Дисплей ввода + добавить/случайный */}
      <View style={styles.kbTopRow}>
        <View style={styles.kbDisplay}>
          <Text style={styles.kbDisplayTxt}>
            {entry || '····'}
          </Text>
        </View>
        <TouchableOpacity style={styles.kbRandomBtn} onPress={addAndRandom}>
          <Text style={styles.kbRandomTxt}>
            {lang === 'ru' ? 'Добавить\nи новый\nслучайный' : 'Add\nand new\nrandom'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Клавиатура 1-9, C, 0, Добавить */}
      <View style={styles.kbGrid}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <TouchableOpacity key={d} style={styles.kbKey} onPress={() => tapKey(d)}>
            <Text style={styles.kbKeyTxt}>{d}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.kbKey, styles.kbKeyC]} onPress={() => setEntry('')}>
          <Text style={styles.kbKeyTxt}>C</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.kbKey} onPress={() => tapKey('0')}>
          <Text style={styles.kbKeyTxt}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.kbKey, styles.kbKeyAdd, entry.length < 4 && { opacity: 0.45 }]}
          onPress={addCode}
        >
          <Text style={styles.kbKeyAddTxt}>{lang === 'ru' ? 'Добавить' : 'Add'}</Text>
        </TouchableOpacity>
      </View>

      {/* Копилка найденных кодов */}
      <View style={styles.codesRow}>
        {codes.length === 0 ? (
          <Text style={styles.codesEmpty}>
            {lang === 'ru' ? 'Пока пусто — коды появятся здесь.' : 'Empty — codes will appear here.'}
          </Text>
        ) : (
          codes.map((c, i) => (
            <TouchableOpacity
              key={`${c}-${i}`}
              style={styles.codeChip}
              onLongPress={() => persistCodes(codes.filter((_, j) => j !== i))}
            >
              <Text style={styles.codeChipTxt}>{c}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
      {codes.length > 0 && (
        <Text style={styles.codesHint}>
          {lang === 'ru' ? 'Тап по коду — копировать, долгий тап — удалить один.' : 'Tap a code to copy, long-press to remove one.'}
        </Text>
      )}

      {/* Сброс копилки */}
      <TouchableOpacity
        style={[styles.kbResetBtn, codes.length === 0 && { opacity: 0.45 }]}
        onPress={resetAll}
      >
        <Text style={styles.kbResetTxt}>
          {lang === 'ru' ? `СБРОС: ${codes.length} КОДОВ` : `RESET: ${codes.length} CODES`}
        </Text>
      </TouchableOpacity>

      {/* ── Прежний авто-счётчик перебора ── */}
      <Text style={styles.subsection}>
        {lang === 'ru' ? 'СЧЁТЧИК ПЕРЕБОРА' : 'BRUTE-FORCE COUNTER'}
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

// ═══════════════════════════════════════════════════════════
// ФЕРМА / СКРЕЩИВАНИЕ (макет из reference): список клонов
// (6 генов + количество физических копий в грядке), целевая
// цепочка и рекомендованные пары для скрещивания, отсортированные
// по совпадению с целью. Список и цель сохраняются в AsyncStorage
// (rc_farm_v1: СОХРАНИТЬ/ЗАГРУЗИТЬ). Ниже — прежний калькулятор
// пары родителей.
// ═══════════════════════════════════════════════════════════
const FARM_KEY = 'rc_farm_v1';
const GENE_GOOD = ['G', 'Y', 'H']; // «хорошие» гены — зелёные чипы
const GENE_BAD = ['W', 'X']; // «плохие» — красные чипы

// Лучший потомок пары: в каждом слоте сильнейший ген (G>Y>H>W>X)
function bestChild(a, b) {
  return a
    .split('')
    .map((g, i) => (GENE_RANK[g] >= GENE_RANK[b[i]] ? g : b[i]))
    .join('');
}

// Насколько пара подходит под цель: совпадений слотов + резерв
// (слоты, где ОБА родителя дали целевой ген — запас прочности)
function planScore(a, b, target) {
  const child = bestChild(a, b);
  let match = 0;
  let redundancy = 0;
  for (let i = 0; i < 6; i++) {
    if (child[i] === target[i]) {
      match++;
      if (a[i] === target[i] && b[i] === target[i]) redundancy++;
    }
  }
  return { child, match, redundancy };
}

function GeneChip({ g, small }) {
  const good = GENE_GOOD.indexOf(g) >= 0;
  return (
    <View
      style={[
        styles.gChip,
        small && styles.gChipSmall,
        good ? styles.gChipGood : styles.gChipBad,
      ]}
    >
      <Text style={[styles.gChipTxt, small && { fontSize: 11 }]}>{g}</Text>
    </View>
  );
}

function GeneChipsRow({ genes, small }) {
  return (
    <View style={styles.gChipRow}>
      {genes.split('').map((g, i) => (
        <GeneChip key={`${g}-${i}`} g={g} small={small} />
      ))}
    </View>
  );
}

export function GenesScreen({ lang }) {
  const [clones, setClones] = useState([]); // [{id, genes, count}]
  const [geneIn, setGeneIn] = useState('');
  const [cntIn, setCntIn] = useState('1');
  const [target, setTarget] = useState('');
  const [editTarget, setEditTarget] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  // Загрузка последнего сохранения фермы
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(FARM_KEY);
        if (raw) {
          const st = JSON.parse(raw);
          if (Array.isArray(st.clones)) setClones(st.clones);
          if (typeof st.target === 'string') setTarget(st.target);
        }
      } catch (e) {}
    })();
  }, []);

  const saveFarm = () => {
    AsyncStorage.setItem(FARM_KEY, JSON.stringify({ clones, target })).catch(() => {});
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  };
  const loadFarm = async () => {
    try {
      const raw = await AsyncStorage.getItem(FARM_KEY);
      if (!raw) return;
      const st = JSON.parse(raw);
      if (Array.isArray(st.clones)) setClones(st.clones);
      if (typeof st.target === 'string') setTarget(st.target);
    } catch (e) {}
  };

  const addClone = () => {
    if (geneIn.length !== 6) return;
    setClones((c) => [
      ...c,
      { id: String(Date.now()), genes: geneIn, count: Math.max(1, parseNum(cntIn, 1)) },
    ]);
    setGeneIn('');
    setCntIn('1');
  };

  const tapGene = (g) => setGeneIn((v) => sanitizeGenes(v + g));
  const tapTargetGene = (g) => setTarget((v) => sanitizeGenes(v + g).slice(0, 6));

  // Рекомендованные пары: все сочетания клонов, сортировка по
  // совпадению с целью → резерву → суммарному количеству копий
  const plans = [];
  if (target.length === 6) {
    for (let i = 0; i < clones.length; i++) {
      for (let j = i + 1; j < clones.length; j++) {
        const a = clones[i];
        const b = clones[j];
        const s = planScore(a.genes, b.genes, target);
        plans.push({ a, b, ...s, copies: a.count + b.count });
      }
    }
    plans.sort(
      (x, y) =>
        y.match - x.match ||
        y.redundancy - x.redundancy ||
        y.copies - x.copies,
    );
  }
  const topPlans = plans.slice(0, 8);
  const perfect = plans.filter((p) => p.match === 6).length;

  return (
    <GlassCard>
      <Text style={styles.screenTitle}>
        {lang === 'ru' ? '🌱 Скрещивание (ферма)' : '🌱 Crossbreeding (Farm)'}
      </Text>

      {/* Шапка: список клонов + сохранить/загрузить */}
      <View style={styles.farmHeader}>
        <Text style={styles.farmHeaderLbl}>
          {lang === 'ru' ? 'Список клонов' : 'Clone list'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.farmIoBtn} onPress={saveFarm}>
            <Text style={styles.farmIoTxt}>
              {savedFlash ? '✓' : lang === 'ru' ? 'Сохранить' : 'Save'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.farmIoBtn} onPress={loadFarm}>
            <Text style={styles.farmIoTxt}>{lang === 'ru' ? 'Загрузить' : 'Load'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.disclaimer}>
        {lang === 'ru'
          ? 'Добавьте шесть генов каждого клона и количество копий. Каждое количество считается отдельными физическими клонами в грядке.'
          : 'Enter six genes per clone and the number of copies. Each copy counts as a separate physical clone in the plot.'}
      </Text>
      <Text style={styles.geneLegend}>
        {lang === 'ru'
          ? 'G — урожайность · H — выносливость · Y — скорость роста · W — экономия воды · X — пустой'
          : 'G — yield · H — hardiness · Y — growth speed · W — less water · X — empty'}
      </Text>

      {/* Чипы генов: тап добавляет букву в поле */}
      <View style={styles.gChipRow}>
        {['G', 'Y', 'H', 'W', 'X'].map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.gChip, GENE_GOOD.indexOf(g) >= 0 ? styles.gChipGood : styles.gChipBad]}
            onPress={() => tapGene(g)}
          >
            <Text style={styles.gChipTxt}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Ввод: гены + количество */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <TextInput
          style={[styles.inputMono, { flex: 1 }]}
          value={geneIn}
          onChangeText={(v) => setGeneIn(sanitizeGenes(v))}
          placeholder="GGYYYY"
          placeholderTextColor="rgba(255,255,255,0.3)"
          autoCapitalize="characters"
        />
        <TextInput
          style={[styles.inputMono, { width: 64, textAlign: 'center' }]}
          value={cntIn}
          onChangeText={(v) => setCntIn(v.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          placeholder="1"
          placeholderTextColor="rgba(255,255,255,0.3)"
        />
      </View>

      {/* Добавить клон (оранжевая, как в макете) */}
      <TouchableOpacity
        style={[styles.addCloneBtn, geneIn.length !== 6 && { opacity: 0.5 }]}
        onPress={addClone}
      >
        <Text style={styles.addCloneTxt}>
          ＋ {lang === 'ru' ? 'Добавить клон' : 'Add clone'}
        </Text>
      </TouchableOpacity>

      {/* Список клонов / пустое состояние */}
      {clones.length === 0 ? (
        <View style={styles.emptyDashed}>
          <Text style={styles.emptyTitle}>
            {lang === 'ru' ? 'Клоны еще не добавлены.' : 'No clones yet.'}
          </Text>
          <Text style={styles.emptyHint}>
            {lang === 'ru'
              ? 'Попробуйте добавить что-то вроде GGYWYX или YGYGYH.'
              : 'Try adding something like GGYWYX or YGYGYH.'}
          </Text>
        </View>
      ) : (
        clones.map((c) => (
          <View key={c.id} style={styles.cloneRow}>
            <GeneChipsRow genes={c.genes} small />
            <Text style={styles.cloneCnt}>×{c.count}</Text>
            <TouchableOpacity
              style={styles.cloneDel}
              onPress={() => setClones((cs) => cs.filter((x) => x.id !== c.id))}
            >
              <Text style={{ fontSize: 12 }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Цель */}
      <View style={styles.targetCard}>
        <View style={styles.targetHead}>
          <Text style={styles.targetLbl}>
            {lang === 'ru' ? 'Ваша цель' : 'Your target'}
          </Text>
          <TouchableOpacity onPress={() => setEditTarget((v) => !v)}>
            <Text style={styles.targetEdit}>
              {editTarget
                ? lang === 'ru' ? 'готово' : 'done'
                : lang === 'ru' ? 'Изменить' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>
        {editTarget ? (
          <View>
            <View style={styles.gChipRow}>
              {['G', 'Y', 'H', 'W', 'X'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.gChip, GENE_GOOD.indexOf(g) >= 0 ? styles.gChipGood : styles.gChipBad]}
                  onPress={() => tapTargetGene(g)}
                >
                  <Text style={styles.gChipTxt}>{g}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.gChip, styles.gChipBad]}
                onPress={() => setTarget((v) => v.slice(0, -1))}
              >
                <Text style={styles.gChipTxt}>⌫</Text>
              </TouchableOpacity>
            </View>
            <GeneChipsRow genes={target || '······'} small />
          </View>
        ) : (
          <GeneChipsRow genes={target || '······'} small />
        )}
        <Text style={styles.targetNote}>
          {lang === 'ru'
            ? 'Рекомендованные планы отсортированы по оценочному совпадению с этими шестью генами.'
            : 'Recommended plans are sorted by estimated match with these six genes.'}
        </Text>
      </View>

      {/* Рекомендованные планы */}
      <View style={styles.farmHeader}>
        <Text style={styles.farmHeaderLbl}>
          {lang === 'ru' ? 'Рекомендованные планы' : 'Recommended plans'}
        </Text>
        <View style={styles.variantChip}>
          <Text style={styles.variantTxt}>
            {target.length === 6
              ? `${perfect} ${lang === 'ru' ? (perfect === 1 ? 'вариант 6/6' : 'вариантов 6/6') : perfect === 1 ? 'variant 6/6' : 'variants 6/6'}`
              : lang === 'ru' ? '0 — задай цель' : '0 — set a target'}
          </Text>
        </View>
      </View>

      {target.length === 6 && clones.length >= 2 ? (
        topPlans.map((p, idx) => (
          <View key={`plan-${idx}`} style={styles.planCard}>
            <View style={styles.planPairCol}>
              <View style={styles.planRow}>
                <GeneChipsRow genes={p.a.genes} small />
                <Text style={styles.cloneCnt}>×{p.a.count}</Text>
              </View>
              <View style={styles.planRow}>
                <GeneChipsRow genes={p.b.genes} small />
                <Text style={styles.cloneCnt}>×{p.b.count}</Text>
              </View>
            </View>
            <View style={styles.planResultCol}>
              <Text style={styles.planArrow}>→</Text>
              <GeneChipsRow genes={p.child} small />
              <Text
                style={[
                  styles.planMatch,
                  p.match === 6 ? { color: eventPalette.green } : { color: eventPalette.orange },
                ]}
              >
                {p.match}/6{p.redundancy > 0 ? ` · +${p.redundancy}` : ''}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyDashed}>
          <Text style={{ fontSize: 26, textAlign: 'center' }}>🌰</Text>
        </View>
      )}

      {/* ── Прежний калькулятор пары ── */}
      <Text style={styles.subsection}>
        {lang === 'ru' ? 'КАЛЬКУЛЯТОР ПАРЫ' : 'PAIR CALCULATOR'}
      </Text>
      <PairCalc lang={lang} />
    </GlassCard>
  );
}

// Прежний расчёт «родитель A + родитель B → лучший потомок»
function PairCalc({ lang }) {
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
    <View>
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
    </View>
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

// ═══════════════════════════════════════════════════════════
// СПРАВОЧНИК ПЕРЕРАБОТКИ (Recycler Calculator)
// Вводишь найденные компоненты — считаем выход металла/ВКМ/скрапа.
// Значения ≈ ванильные и редактируемые (репо-конвенция: никаких
// «авторитетных» констант — рециклер правят патчами).
// ═══════════════════════════════════════════════════════════
export function RecyclerCalcScreen({ lang }) {
  // [металл, ВКМ, скрап] с одного компонента на рециклере ≈
  const [rules, setRules] = useState({
    gears: { ic: '⚙️', name: { ru: 'Шестерни', en: 'Gears' }, out: ['13', '3', '0'] },
    springs: { ic: '🪃', name: { ru: 'Пружины', en: 'Springs' }, out: ['30', '1', '0'] },
    pipes: { ic: '🔧', name: { ru: 'Трубы', en: 'Metal Pipes' }, out: ['5', '1', '0'] },
    sheet: { ic: '📃', name: { ru: 'Листовой металл', en: 'Sheet Metal' }, out: ['8', '0', '2'] },
    smgBody: { ic: '🔩', name: { ru: 'Корпус SMG', en: 'SMG Body' }, out: ['4', '2', '4'] },
    rifleBody: { ic: '🔫', name: { ru: 'Корпус винтовки', en: 'Rifle Body' }, out: ['4', '3', '6'] },
  });
  const [qty, setQty] = useState({});

  const totals = { mf: 0, hqm: 0, scrap: 0 };
  Object.keys(rules).forEach((k) => {
    const n = parseNum(qty[k], 0);
    totals.mf += n * parseNum(rules[k].out[0], 0);
    totals.hqm += n * parseNum(rules[k].out[1], 0);
    totals.scrap += n * parseNum(rules[k].out[2], 0);
  });

  return (
    <GlassCard>
      <Text style={styles.screenTitle}>{lang === 'ru' ? '♻️ Переработка' : '♻️ Recycler Calculator'}</Text>
      <Text style={styles.disclaimer}>
        {lang === 'ru'
          ? '≈ Выход с одного компонента на рециклере, значения редактируемые — баланс переработки разработчики двигают патчами. Сверяй после апдейтов.'
          : '≈ Output per component at the recycler, editable values — recycling balance is patched regularly. Re-check after updates.'}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        {[['mf', lang === 'ru' ? 'Металл' : 'Metal'], ['hqm', 'ВКМ'], ['scrap', 'Scrap']].map(([k, lbl]) => (
          <View key={k} style={{ flex: 1 }}>
            <TextInput
              style={[styles.inputMono, { fontSize: 14 }]}
              value={String(totals[k])}
              editable={false}
            />
            <Text style={styles.unitLbl}>{lbl}</Text>
          </View>
        ))}
      </View>
      {Object.keys(rules).map((k) => (
        <View key={k} style={styles.copyRow}>
          <Text style={{ fontSize: 15, marginRight: 6 }}>{rules[k].ic}</Text>
          <Text style={[styles.copyDesc, { flex: 1 }]}>
            {lang === 'ru' ? rules[k].name.ru : rules[k].name.en}
          </Text>
          <TextInput
            style={[styles.inputMono, { width: 56, textAlign: 'center', paddingVertical: 4 }]}
            value={qty[k] || ''}
            onChangeText={(v) => setQty((q) => ({ ...q, [k]: v.replace(/[^0-9]/g, '') }))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="rgba(255,255,255,0.3)"
          />
        </View>
      ))}
      <Text style={styles.disclaimerNoBox}>
        {lang === 'ru'
          ? '≈ Рециклер делит выход на стак: считай поштучно. Правила переработки также лежат в mobile-app/recyclerCalc.js.'
          : '≈ The recycler splits output per stack: count items individually. Rules also live in mobile-app/recyclerCalc.js.'}
      </Text>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════
// КАЛЬКУЛЯТОР ЭЛЕКТРОНИКИ (Electricity Planner)
// Мощность источников против нагрузки базы: ничего не отрубится.
// Все цифры ≈ и редактируемые (rWm — единицы Rust-электрики).
// ═══════════════════════════════════════════════════════════
export function ElectricityScreen({ lang }) {
  // Источники: [штук, rWm каждый]
  const [src, setSrc] = useState({
    wind: { ic: '🌬️', name: { ru: 'Ветряк (сред.)', en: 'Wind Turbine (avg)' }, n: '1', rw: '150' },
    gen: { ic: '⛽', name: { ru: 'Генератор', en: 'Small Generator' }, n: '0', rw: '20' },
    battery: { ic: '🔋', name: { ru: 'Большая батарея', en: 'Large Battery' }, n: '1', rw: '100' },
  });
  // Нагрузка: [штук, rWm потребление]
  const [load, setLoad] = useState({
    turret: { ic: '🔫', name: { ru: 'Турели', en: 'Auto Turrets' }, n: '0', rw: '10' },
    light: { ic: '💡', name: { ru: 'Лампы', en: 'Lights' }, n: '0', rw: '2' },
    door: { ic: '🚪', name: { ru: 'Электро-двери/замки', en: 'Door controllers' }, n: '0', rw: '1' },
    other: { ic: '🔌', name: { ru: 'Прочее', en: 'Other devices' }, n: '0', rw: '5' },
  });

  const sum = (obj) =>
    Object.keys(obj).reduce(
      (acc, k) => acc + parseNum(obj[k].n, 0) * parseNum(obj[k].rw, 0),
      0,
    );
  const totalW = sum(src);
  const loadW = sum(load);
  const surplus = totalW - loadW;
  const ok = surplus >= 0;

  return (
    <GlassCard>
      <Text style={styles.screenTitle}>{lang === 'ru' ? '⚡ Планировщик электрики' : '⚡ Electricity Planner'}</Text>
      <Text style={styles.disclaimer}>
        {lang === 'ru'
          ? '≈ Единицы Rust-электрики (rWm). Ветряк плавает от погоды — среднее значение; батарея сглаживает проседания. Цифры редактируемые, сверяй на своём сервере.'
          : '≈ Rust electric units (rWm). Wind output floats with weather — average shown; a battery smooths dips. Editable values, verify on your server.'}
      </Text>

      <View style={[styles.totalBox, !ok && styles.totalBoxOver]}>
        <Text style={styles.totalLabel}>{lang === 'ru' ? 'Баланс мощности' : 'Power balance'}</Text>
        <Text style={styles.totalVal}>
          {fmtNum(totalW)} − {fmtNum(loadW)} ={' '}
          <Text style={{ color: ok ? eventPalette.green : eventPalette.red }}>
            {ok ? '+' : ''}{fmtNum(surplus)}
          </Text>
        </Text>
        <Text style={[styles.totalSub, { color: ok ? eventPalette.green : eventPalette.red }]}>
          {ok
            ? lang === 'ru' ? '✓ запас есть — ничего не отключится' : '✓ headroom left — nothing shuts off'
            : lang === 'ru' ? '⚠️ не хватает — при нагрузке отрубит' : '⚠️ short — brownouts under load'}
        </Text>
      </View>

      <Text style={styles.subsection}>{lang === 'ru' ? 'ИСТОЧНИКИ' : 'SOURCES'}</Text>
      {Object.keys(src).map((k) => (
        <View key={k} style={styles.copyRow}>
          <Text style={{ fontSize: 15, marginRight: 6 }}>{src[k].ic}</Text>
          <Text style={[styles.copyDesc, { flex: 1 }]}>
            {lang === 'ru' ? src[k].name.ru : src[k].name.en}
          </Text>
          <TextInput
            style={[styles.inputMono, { width: 40, textAlign: 'center', paddingVertical: 4 }]}
            value={src[k].n}
            onChangeText={(v) => setSrc((s) => ({ ...s, [k]: { ...s[k], n: v.replace(/[^0-9]/g, '') } }))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="rgba(255,255,255,0.3)"
          />
          <Text style={styles.unitLbl}>×</Text>
          <TextInput
            style={[styles.inputMono, { width: 48, textAlign: 'center', paddingVertical: 4 }]}
            value={src[k].rw}
            onChangeText={(v) => setSrc((s) => ({ ...s, [k]: { ...s[k], rw: v.replace(/[^0-9]/g, '') } }))}
            keyboardType="number-pad"
          />
          <Text style={styles.unitLbl}>rWm</Text>
        </View>
      ))}

      <Text style={styles.subsection}>{lang === 'ru' ? 'НАГРУЗКА' : 'LOAD'}</Text>
      {Object.keys(load).map((k) => (
        <View key={k} style={styles.copyRow}>
          <Text style={{ fontSize: 15, marginRight: 6 }}>{load[k].ic}</Text>
          <Text style={[styles.copyDesc, { flex: 1 }]}>
            {lang === 'ru' ? load[k].name.ru : load[k].name.en}
          </Text>
          <TextInput
            style={[styles.inputMono, { width: 40, textAlign: 'center', paddingVertical: 4 }]}
            value={load[k].n}
            onChangeText={(v) => setLoad((l) => ({ ...l, [k]: { ...l[k], n: v.replace(/[^0-9]/g, '') } }))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="rgba(255,255,255,0.3)"
          />
          <Text style={styles.unitLbl}>×</Text>
          <TextInput
            style={[styles.inputMono, { width: 48, textAlign: 'center', paddingVertical: 4 }]}
            value={load[k].rw}
            onChangeText={(v) => setLoad((l) => ({ ...l, [k]: { ...l[k], rw: v.replace(/[^0-9]/g, '') } }))}
            keyboardType="number-pad"
          />
          <Text style={styles.unitLbl}>rWm</Text>
        </View>
      ))}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  screenTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  // ── Code Breaker: клавиатура и копилка кодов (макет reference) ──
  kbTopRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  kbDisplay: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  kbDisplayTxt: { color: colors.textPrimary, fontSize: 26, letterSpacing: 6, fontFamily: 'monospace' },
  kbRandomBtn: {
    width: 118,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  kbRandomTxt: { color: colors.textPrimary, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  kbGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kbKey: {
    width: '30%',
    flexGrow: 1,
    minHeight: 52,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  kbKeyTxt: { color: colors.textPrimary, fontSize: 17 },
  kbKeyC: { backgroundColor: 'rgba(169,124,111,0.4)' },
  kbKeyAdd: { backgroundColor: 'rgba(46,92,60,0.75)', borderColor: 'rgba(120,200,140,0.35)' },
  kbKeyAddTxt: { color: '#dff2e4', fontSize: 13, fontWeight: '700' },
  codesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 6,
    padding: 10,
    marginTop: 12,
    minHeight: 44,
    alignItems: 'center',
  },
  codeChip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  codeChipTxt: { color: colors.textPrimary, fontSize: 14, fontFamily: 'monospace', letterSpacing: 1 },
  codesEmpty: { color: colors.textMuted, fontSize: 11 },
  codesHint: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  kbResetBtn: {
    backgroundColor: 'rgba(169,124,111,0.4)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  kbResetTxt: { color: colors.textPrimary, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  // ── Ферма / скрещивание (макет reference) ──
  farmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  farmHeaderLbl: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    flex: 1,
  },
  farmIoBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  farmIoTxt: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  gChipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginVertical: 6 },
  gChip: {
    width: 52,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  gChipSmall: { width: 34, height: 32, borderRadius: 8 },
  gChipGood: { backgroundColor: 'rgba(74,140,90,0.35)', borderColor: 'rgba(120,200,140,0.5)' },
  gChipBad: { backgroundColor: 'rgba(140,60,60,0.3)', borderColor: 'rgba(200,120,120,0.4)' },
  gChipTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  addCloneBtn: {
    backgroundColor: '#e8703a',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginVertical: 12,
  },
  addCloneTxt: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  emptyDashed: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 22,
    alignItems: 'center',
    marginVertical: 8,
  },
  emptyTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  emptyHint: { color: colors.textMuted, fontSize: 12, marginTop: 6, textAlign: 'center', lineHeight: 17 },
  cloneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
  },
  cloneCnt: { color: colors.textPrimary, fontSize: 13, fontWeight: '700', marginHorizontal: 8 },
  cloneDel: { paddingHorizontal: 6, paddingVertical: 4 },
  targetCard: {
    borderWidth: 1,
    borderColor: 'rgba(232,150,130,0.45)',
    borderRadius: 14,
    padding: 14,
    marginVertical: 12,
    backgroundColor: 'rgba(232,150,130,0.05)',
  },
  targetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  targetLbl: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  targetEdit: { color: '#e8968a', fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  targetNote: { color: colors.textMuted, fontSize: 11.5, lineHeight: 16, marginTop: 8 },
  variantChip: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  variantTxt: { color: colors.textPrimary, fontSize: 11.5, fontWeight: '600' },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  planPairCol: { flex: 1 },
  planRow: { flexDirection: 'row', alignItems: 'center' },
  planResultCol: { alignItems: 'center', marginLeft: 10 },
  planArrow: { color: colors.textMuted, fontSize: 14, marginBottom: 2 },
  planMatch: { fontSize: 12, fontWeight: '800', marginTop: 4 },
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
