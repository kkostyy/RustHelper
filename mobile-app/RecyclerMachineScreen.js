// ─────────────────────────────────────────────────────────
// ♻️ РЕЦИКЛЕР — интерфейс «как в игре»: панель ВХОДа на 6 слотов,
// выбор типа рециклера, запуск с поштучной анимацией и панель
// ВЫХОДа (металл / ВКМ / скрап / ткань).
// Значения выхода ≈ ванильные (rusthelp.com, rusthelp-reference.txt):
// шестерни дают 12 металла + 10 скрапа и НЕ дают ВКМ; пружина/корпус
// дают ВКМ. Тонкая настройка базы — редактируемая (репо-конвенция).
// ─────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { colors, eventPalette } from './theme';
import { GlassCard } from './ui';
import {
  RECYCLE_ITEMS,
  RECYCLER_TYPES,
  TYPE_OVERRIDES,
  unitOutput,
  calcBatch,
} from './recyclerCalc';

const SLOTS = 6; // у игрового рециклера 6 ячеек входа

function itemName(it, lang) {
  return lang === 'ru' ? it.name.ru : it.name.en;
}

export default function RecyclerMachineScreen({ lang = 'ru' }) {
  const [slots, setSlots] = useState(Array(SLOTS).fill(null)); // {id,n} | null
  const [typeId, setTypeId] = useState('green');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [totalUnits, setTotalUnits] = useState(0);
  const [out, setOut] = useState({ mf: 0, hqm: 0, scrap: 0, cloth: 0 });
  const [advOpen, setAdvOpen] = useState(false);
  // редактируемая база зелёного рециклера: {itemId: ['12','0','10','0']}
  const [baseOv, setBaseOv] = useState({});
  const timerRef = useRef(null);

  // остановить анимацию при уходе с экрана
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const byId = (id) => RECYCLE_ITEMS.find((x) => x.id === id);
  const effOut = (id) => baseOv[id] || byId(id).out.map(String);

  const busy = running;

  // сброс прогресса прошлой прогонки при любом изменении входа
  const resetProgress = () => { setProcessed(0); setTotalUnits(0); };

  // ── Слоты ──
  const addItem = (id) => {
    if (busy) return;
    const i = slots.findIndex((s) => s && s.id === id);
    if (i >= 0) {
      const next = [...slots];
      next[i] = { id, n: next[i].n + 1 };
      setSlots(next);
      resetProgress();
      return;
    }
    const free = slots.findIndex((s) => !s);
    if (free < 0) {
      Alert.alert(
        lang === 'ru' ? 'Слоты заполнены' : 'Slots full',
        lang === 'ru'
          ? 'У рециклера всего 6 ячеек входа — убери что-нибудь.'
          : 'The recycler has only 6 input slots — remove something.',
      );
      return;
    }
    const next = [...slots];
    next[free] = { id, n: 1 };
    setSlots(next);
    resetProgress();
  };

  // тап по занятому слоту — убрать 1 шт; долгий тап — выкинуть стак
  const slotTap = (i) => {
    if (busy) return;
    const s = slots[i];
    if (!s) return;
    const next = [...slots];
    next[i] = s.n > 1 ? { id: s.id, n: s.n - 1 } : null;
    setSlots(next);
    resetProgress();
  };
  const slotClear = (i) => {
    if (busy) return;
    const next = [...slots];
    next[i] = null;
    setSlots(next);
    resetProgress();
  };

  const pickType = (id) => {
    if (busy) return;
    setTypeId(id);
    resetProgress();
  };

  const clearAll = () => {
    if (busy) return;
    setSlots(Array(SLOTS).fill(null));
    setOut({ mf: 0, hqm: 0, scrap: 0, cloth: 0 });
    resetProgress();
  };

  // ── Запуск «машины»: поштучно, пачками до ~16 тиков ──
  const startRun = () => {
    if (busy) return;
    const flat = [];
    slots.forEach((s) => { if (s) for (let i = 0; i < s.n; i++) flat.push(s.id); });
    if (!flat.length) return;

    const acc = { mf: 0, hqm: 0, scrap: 0, cloth: 0 };
    let idx = 0;
    const perTick = Math.max(1, Math.ceil(flat.length / 16));
    setTotalUnits(flat.length);
    setProcessed(0);
    setOut({ mf: 0, hqm: 0, scrap: 0, cloth: 0 });
    setRunning(true);

    timerRef.current = setInterval(() => {
      for (let k = 0; k < perTick && idx < flat.length; k++, idx++) {
        const u = unitOutput(flat[idx], typeId, baseOv);
        acc.mf += u.mf; acc.hqm += u.hqm; acc.scrap += u.scrap; acc.cloth += u.cloth;
      }
      setOut({ ...acc });
      setProcessed(idx);
      if (idx >= flat.length) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setRunning(false);
      }
    }, 90);
  };

  const t = RECYCLER_TYPES.find((x) => x.id === typeId);
  const progress = totalUnits ? Math.min(1, processed / totalUnits) : 0;
  // ВЫХОД: во время прогонки — накопленный out; в покое — живой расчёт
  // по текущим слотам (после правки входа панель сразу честная)
  const filled = slots.filter(Boolean);
  const expect = calcBatch(filled, typeId, baseOv);
  const shown = running || processed > 0 ? out : expect;
  const outCells = [
    { ic: '⚙️', key: 'mf', ru: 'Металл', en: 'Metal' },
    { ic: '🟧', key: 'hqm', ru: 'ВКМ', en: 'HQM' },
    { ic: '🟡', key: 'scrap', ru: 'Скрап', en: 'Scrap' },
    { ic: '🧵', key: 'cloth', ru: 'Ткань', en: 'Cloth' },
  ];

  return (
    <GlassCard>
      <Text style={st.title}>{lang === 'ru' ? '♻️ Рециклер' : '♻️ Recycler'}</Text>
      <Text style={st.subtitle}>
        {lang === 'ru'
          ? 'Положи компоненты во вход — рециклер выдаст ресурсы, как в игре.'
          : 'Put components in — the recycler spits resources out, just like in game.'}
      </Text>

      {/* ── Тип рециклера ── */}
      <View style={st.typeRow}>
        {RECYCLER_TYPES.map((tp) => (
          <TouchableOpacity
            key={tp.id}
            style={[st.typeBtn, typeId === tp.id && st.typeBtnActive]}
            onPress={() => pickType(tp.id)}
          >
            <Text style={st.typeIc}>{tp.ic}</Text>
            <Text style={[st.typeTxt, typeId === tp.id && st.typeTxtActive]}>
              {lang === 'ru' ? tp.name.ru : tp.name.en}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Панель ВХОДА ── */}
      <View style={st.panel}>
        <Text style={st.panelLbl}>
          {lang === 'ru' ? 'ВХОД' : 'INPUT'}
          <Text style={st.panelHint}>
            {lang === 'ru'
              ? '  тап −1 · долгий тап — выкинуть стак'
              : '  tap −1 · long-press drops the stack'}
          </Text>
        </Text>
        <View style={st.slotGrid}>
          {slots.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={[st.slot, s && st.slotFull]}
              onPress={() => slotTap(i)}
              onLongPress={() => slotClear(i)}
              activeOpacity={s ? 0.6 : 1}
            >
              {s ? (
                <View style={st.slotInner}>
                  <Text style={st.slotN}>{'×' + s.n}</Text>
                  <Text style={st.slotIc}>{byId(s.id).ic}</Text>
                  <Text style={st.slotName} numberOfLines={1}>
                    {itemName(byId(s.id), lang)}
                  </Text>
                </View>
              ) : (
                <Text style={st.slotEmpty}>·</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* палитра компонентов */}
        {!busy && (
          <TouchableOpacity style={st.addBtn} onPress={() => setPaletteOpen(!paletteOpen)}>
            <Text style={st.addBtnTxt}>
              {(paletteOpen ? '▲ ' : '▼ ') + (lang === 'ru' ? 'Положить предмет' : 'Insert item')}
            </Text>
          </TouchableOpacity>
        )}
        {paletteOpen && !busy && (
          <View style={st.palette}>
            {RECYCLE_ITEMS.map((it) => (
              <TouchableOpacity key={it.id} style={st.palChip} onPress={() => addItem(it.id)}>
                <Text style={{ fontSize: 13 }}>{it.ic}</Text>
                <Text style={st.palTxt} numberOfLines={1}>{itemName(it, lang)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* ── Кнопки управления ── */}
      <View style={st.ctrlRow}>
        <TouchableOpacity
          style={[st.startBtn, !filled.length && st.startDisabled]}
          onPress={startRun}
          disabled={busy || !filled.length}
        >
          <Text style={st.startTxt}>
            {running
              ? (lang === 'ru' ? 'Крутится…' : 'Running…')
              : (lang === 'ru' ? '▶ Запустить' : '▶ Start')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.clearBtn} onPress={clearAll}>
          <Text style={st.clearTxt}>{lang === 'ru' ? '🗑 Очистить' : '🗑 Clear'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Прогресс ── */}
      {!!totalUnits && (
        <View style={{ marginBottom: 10 }}>
          <View style={st.track}>
            <View style={[st.fill, { width: Math.round(progress * 100) + '%' }]} />
          </View>
          <Text style={st.progressTxt}>
            {(lang === 'ru' ? 'Перерабатываю: ' : 'Recycling: ') + processed + '/' + totalUnits +
              (!running ? (lang === 'ru' ? ' ✓ готово' : ' ✓ done') : '')}
          </Text>
        </View>
      )}

      {/* ── Панель ВЫХОДА ── */}
      <View style={st.panel}>
        <Text style={st.panelLbl}>{lang === 'ru' ? 'ВЫХОД' : 'OUTPUT'}</Text>
        <View style={st.outRow}>
          {outCells.map((c) => (
            <View key={c.key} style={[st.outCell, !shown[c.key] && { opacity: 0.35 }]}>
              <Text style={{ fontSize: 14 }}>{c.ic}</Text>
              <Text style={st.outN}>{String(shown[c.key])}</Text>
              <Text style={st.outLbl}>{lang === 'ru' ? c.ru : c.en}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Разбор по предметам ── */}
      {!running && !!filled.length && (
        <View style={{ marginTop: 10 }}>
          <Text style={st.groupTitle}>
            {(lang === 'ru'
              ? 'Разбор · '
              : 'Breakdown · ') + (lang === 'ru' ? t.name.ru : t.name.en)}
          </Text>
          {filled.map((s) => {
            const it = byId(s.id);
            const u = unitOutput(s.id, typeId, baseOv);
            const parts = [
              u.mf ? u.mf * s.n + ' ⚙️' : '',
              u.hqm ? u.hqm * s.n + ' 🟧' : '',
              u.scrap ? u.scrap * s.n + ' 🟡' : '',
              u.cloth ? u.cloth * s.n + ' 🧵' : '',
            ].filter(Boolean);
            const exact = (TYPE_OVERRIDES[s.id] || {})[typeId];
            return (
              <View key={s.id} style={st.perRow}>
                <Text style={st.perName}>{it.ic + ' ' + itemName(it, lang) + ' ×' + s.n}</Text>
                <Text style={st.perOut}>{parts.join('  +  ') || '—'}{exact ? '' : ' ≈'}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* ── Тонкая настройка (≈ зелёный) ── */}
      <TouchableOpacity style={st.advToggle} onPress={() => setAdvOpen(!advOpen)}>
        <Text style={st.advToggleTxt}>
          {(advOpen ? '▲ ' : '▼ ') + (lang === 'ru'
            ? '≈ Выход зелёного рециклера (правится)'
            : '≈ Green recycler output (editable)')}
        </Text>
      </TouchableOpacity>
      {advOpen && (
        <View>
          <Text style={st.advHead}>
            {lang === 'ru' ? 'предмет · металл / ВКМ / скрап / ткань' : 'item · metal / HQM / scrap / cloth'}
          </Text>
          {RECYCLE_ITEMS.map((it) => {
            const cur = effOut(it.id);
            const setCell = (ci, v) => {
              const arr = [...cur];
              arr[ci] = v.replace(/[^0-9]/g, '');
              setBaseOv({ ...baseOv, [it.id]: arr });
            };
            return (
              <View key={it.id} style={st.advRow}>
                <Text style={st.advName} numberOfLines={1}>{it.ic + ' ' + itemName(it, lang)}</Text>
                {[0, 1, 2, 3].map((ci) => (
                  <TextInput
                    key={ci}
                    style={st.advInput}
                    value={cur[ci]}
                    onChangeText={(v) => setCell(ci, v)}
                    keyboardType="number-pad"
                  />
                ))}
              </View>
            );
          })}
          <Text style={st.disclaimer}>
            {lang === 'ru'
              ? '≈ Шестерни/пружины/корпуса — точные значения rusthelp.com для всех типов рециклеров; остальное — база зелёного с множителем типа (🟡×0.83, ⚡×1.22, 🔴×1.5). Баланс двигают патчами — перепроверяй.'
              : '≈ Gears/springs/bodies are exact rusthelp.com values for every recycler type; the rest is the green base scaled by type (🟡×0.83, ⚡×1.22, 🔴×1.5). Balance moves with patches — re-check.'}
          </Text>
        </View>
      )}
    </GlassCard>
  );
}

const st = StyleSheet.create({
  title: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: colors.textMuted, fontSize: 11.5, lineHeight: 16, marginBottom: 12 },
  groupTitle: { color: colors.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 6 },

  // тип рециклера
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 5,
  },
  typeBtnActive: { borderColor: '#66bb6a', backgroundColor: 'rgba(102,187,106,0.18)' },
  typeIc: { fontSize: 11 },
  typeTxt: { color: colors.textSecondary, fontSize: 11.5, fontWeight: '700' },
  typeTxtActive: { color: '#8fe39a' },

  // панели как игровые контейнеры
  panel: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.13)',
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.32)',
    padding: 10,
    marginBottom: 10,
  },
  panelLbl: {
    color: eventPalette.orange,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  panelHint: { color: colors.textMuted, fontWeight: '400', fontSize: 9.5, letterSpacing: 0 },

  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  slot: {
    width: '31%',
    flexGrow: 1,
    aspectRatio: 1,
    maxWidth: '31%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotFull: {
    borderStyle: 'solid',
    borderColor: 'rgba(251,146,60,0.55)',
    backgroundColor: 'rgba(251,146,60,0.1)',
  },
  slotInner: { alignItems: 'center', width: '100%', padding: 3 },
  slotN: {
    position: 'absolute',
    top: -6,
    right: 2,
    color: '#ffd54f',
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  slotIc: { fontSize: 19 },
  slotName: { color: colors.textSecondary, fontSize: 8.5, marginTop: 2 },
  slotEmpty: { color: 'rgba(255,255,255,0.18)', fontSize: 18 },

  addBtn: {
    alignSelf: 'flex-start',
    marginTop: 9,
    backgroundColor: 'rgba(96,165,250,0.18)',
    borderColor: eventPalette.blue + '55',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addBtnTxt: { color: eventPalette.blue, fontSize: 11.5, fontWeight: '700' },
  palette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  palChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
    maxWidth: '48%',
  },
  palTxt: { color: colors.textPrimary, fontSize: 10.5, fontWeight: '600' },

  ctrlRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  startBtn: {
    flex: 1,
    backgroundColor: '#3e8e41',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  startDisabled: { opacity: 0.45 },
  startTxt: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  clearBtn: {
    backgroundColor: '#a06a35',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  clearTxt: { color: '#fff', fontSize: 12.5, fontWeight: '700' },

  track: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 999, backgroundColor: '#66bb6a' },
  progressTxt: { color: colors.textMuted, fontSize: 10.5, marginTop: 4 },

  outRow: { flexDirection: 'row', gap: 7 },
  outCell: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingVertical: 7,
  },
  outN: { color: '#ffd54f', fontSize: 14, fontWeight: '800', marginTop: 2 },
  outLbl: { color: colors.textMuted, fontSize: 9 },

  perRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  perName: { color: colors.textPrimary, fontSize: 11.5, flex: 1 },
  perOut: { color: colors.textSecondary, fontSize: 11, marginLeft: 8 },

  advToggle: { alignSelf: 'flex-start', marginTop: 10, paddingVertical: 4 },
  advToggleTxt: { color: eventPalette.blue, fontSize: 11.5, fontWeight: '700' },
  advHead: { color: colors.textMuted, fontSize: 10, marginBottom: 6 },
  advRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  advName: { color: colors.textPrimary, fontSize: 10.5, flex: 1 },
  advInput: {
    color: '#fff',
    fontSize: 11,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 6,
    width: 38,
    textAlign: 'center',
    paddingVertical: 3,
  },
  disclaimer: {
    color: colors.textMuted,
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 8,
  },
});
