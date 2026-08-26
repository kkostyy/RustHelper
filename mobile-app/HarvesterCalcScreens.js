// ─────────────────────────────────────────────────────────
// КАЛЬКУЛЯТОРЫ ДОБЫЧИ (по макетам references):
//   ExcavatorCalcScreen — гигантский экскаватор (степпер дизеля);
//   QuarryCalcScreen    — карьер (камень/сера/ВКМ, дизель ↔ ресурс);
//   PumpjackCalcScreen  — нефтекачка (дизель ↔ нефть).
// Выход за 1 дизель ≈ ваниль (сверено с макетом и rusthelp):
// экскаватор 100 ВКМ / 2000 серы / 5000 металла / 10000 камня,
// каменный карьер 5000 камня + 1000 металла, качка 60 нефти.
// Значения правятся в разделе «≈ выход» — баланс двигают патчами.
// ─────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { colors, eventPalette } from './theme';
import { GlassCard } from './ui';

const DIESEL_MAX = 1000; // в бак экскаватора влезает до 1000 дизеля

// Ресурсы: иконки/имена + дефолтный выход за 1 дизель (≈ ваниль)
const R = {
  hqm:    { ic: '🟣', ru: 'ВКМ руда',     en: 'HQM Ore' },
  sulfur: { ic: '🟡', ru: 'Серная руда',  en: 'Sulfur Ore' },
  metal:  { ic: '⚙️', ru: 'Металл. руда', en: 'Metal Ore' },
  stones: { ic: '🪨', ru: 'Камни',        en: 'Stones' },
  crude:  { ic: '🛢️', ru: 'Нефть',        en: 'Crude Oil' },
};

const EXCAVATOR_RES = [
  { key: 'hqm', per: 100 },
  { key: 'sulfur', per: 2000 },
  { key: 'metal', per: 5000 },
  { key: 'stones', per: 10000 },
];

const QUARRY_TYPES = [
  {
    id: 'stone', ru: 'Каменный', en: 'Stone',
    res: [{ key: 'stones', per: 5000 }, { key: 'metal', per: 1000 }],
  },
  {
    id: 'sulfur', ru: 'Серный', en: 'Sulfur',
    res: [{ key: 'sulfur', per: 3000 }, { key: 'metal', per: 500 }],
  },
  {
    id: 'hqm', ru: 'ВКМ', en: 'HQM',
    res: [{ key: 'hqm', per: 100 }, { key: 'stones', per: 500 }],
  },
];

const PUMP_RES = [{ key: 'crude', per: 60 }];

// 12345 → «12 345»
const fmtTh = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// 130 → «2 мин 10 с» / «2m 10s»
function fmtDur(sec, lang) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const u = lang === 'ru' ? ['ч', 'мин', 'с'] : ['h', 'm', 's'];
  const parts = [];
  if (h) parts.push(h + ' ' + u[0]);
  if (m) parts.push(m + ' ' + u[1]);
  if (s || !parts.length) parts.push(s + ' ' + u[2]);
  return parts.join(' ');
}

// эффективный выход за 1 дизель с учётом правок «≈ значений»
function effPer(row, cust) {
  const v = cust[row.key];
  const n = Number(v);
  return v !== undefined && v !== '' && !Number.isNaN(n) ? n : row.per;
}

/* ── Общие куски трёх экранов ── */

function TimeLine({ lang, sec }) {
  return (
    <Text style={st.timeLine}>
      {(lang === 'ru' ? 'Общее время работы: ' : 'Total run time: ') + fmtDur(sec, lang)}
    </Text>
  );
}

function ResTable({ lang, rows }) {
  return (
    <View style={st.table}>
      <View style={st.thead}>
        <Text style={st.th}>{lang === 'ru' ? 'Предмет' : 'Item'}</Text>
        <Text style={st.th}>{lang === 'ru' ? 'Количество' : 'Amount'}</Text>
      </View>
      {rows.map((r) => (
        <View key={r.key} style={st.trow}>
          <Text style={st.tdName}>{R[r.key].ic + '  ' + (lang === 'ru' ? R[r.key].ru : R[r.key].en)}</Text>
          <Text style={st.tdN}>{fmtTh(r.n)}</Text>
        </View>
      ))}
    </View>
  );
}

function ResetBtn({ lang, onPress }) {
  return (
    <TouchableOpacity style={st.resetBtn} onPress={onPress}>
      <Text style={st.resetTxt}>
        {lang === 'ru' ? 'СБРОСИТЬ ВВОД' : 'RESET INPUT'}
      </Text>
    </TouchableOpacity>
  );
}

// сворачиваемый редактор «выход за 1 дизель»
function AdvEditor({ lang, rows, cust, setCust }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity style={st.advToggle} onPress={() => setOpen(!open)}>
        <Text style={st.advToggleTxt}>
          {(open ? '▲ ' : '▼ ') + (lang === 'ru'
            ? '≈ Выход за 1 дизель (правится)'
            : '≈ Yield per diesel (editable)')}
        </Text>
      </TouchableOpacity>
      {open && (
        <View>
          {rows.map((row) => (
            <View key={row.key} style={st.advRow}>
              <Text style={st.advName} numberOfLines={1}>
                {R[row.key].ic + ' ' + (lang === 'ru' ? R[row.key].ru : R[row.key].en)}
              </Text>
              <TextInput
                style={st.advInput}
                value={cust[row.key] !== undefined ? cust[row.key] : String(row.per)}
                onChangeText={(v) => setCust({ ...cust, [row.key]: v.replace(/[^0-9]/g, '') })}
                keyboardType="number-pad"
              />
            </View>
          ))}
          <Text style={st.disclaimer}>
            {lang === 'ru'
              ? '≈ Значения для ванильного сервера. Модифицированные серверы и патчи баланса меняют выход — сверяй по факту.'
              : '≈ Vanilla server values. Modded servers and balance patches change yields — verify in game.'}
          </Text>
        </View>
      )}
    </View>
  );
}

/* ── 1. Гигантский экскаватор ── */

export function ExcavatorCalcScreen({ lang = 'ru' }) {
  const [diesel, setDiesel] = useState(1);
  const [cust, setCust] = useState({});

  const step = (d) => setDiesel(Math.max(0, Math.min(DIESEL_MAX, diesel + d)));
  const rows = EXCAVATOR_RES.map((r) => ({ key: r.key, n: effPer(r, cust) * diesel }));

  return (
    <GlassCard>
      <Text style={st.title}>
        {(lang === 'ru' ? 'Калькулятор гигантского экскаватора' : 'Giant Excavator Calculator').toUpperCase()}
      </Text>
      <Text style={st.subtitle}>
        {lang === 'ru'
          ? 'Измените количество дизельного топлива и смотрите результаты ниже.'
          : 'Change the amount of diesel and see the results below.'}
      </Text>

      {/* степпер дизеля: −10 −1 [🛢 N] +1 +10 */}
      <View style={st.stepRow}>
        <TouchableOpacity style={st.stepBtn} onPress={() => step(-10)}>
          <Text style={st.stepTxt}>−10</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.stepBtn} onPress={() => step(-1)}>
          <Text style={st.stepTxt}>−1</Text>
        </TouchableOpacity>
        <View style={st.stepVal}>
          <Text style={{ fontSize: 18 }}>🛢️</Text>
          <Text style={st.stepNum}>{String(diesel)}</Text>
        </View>
        <TouchableOpacity style={st.stepBtn} onPress={() => step(1)}>
          <Text style={st.stepTxt}>+1</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.stepBtn} onPress={() => step(10)}>
          <Text style={st.stepTxt}>+10</Text>
        </TouchableOpacity>
      </View>

      <TimeLine lang={lang} sec={diesel * 120} />
      <ResTable lang={lang} rows={rows} />
      <ResetBtn lang={lang} onPress={() => setDiesel(1)} />
      <AdvEditor lang={lang} rows={EXCAVATOR_RES} cust={cust} setCust={setCust} />
    </GlassCard>
  );
}

/* ── 2. Карьер (камень / сера / ВКМ) ── */

export function QuarryCalcScreen({ lang = 'ru' }) {
  const [qtype, setQtype] = useState(QUARRY_TYPES[0]);
  const [diesel, setDiesel] = useState('1');   // дизель, строка ввода
  const [resource, setResource] = useState('5000'); // главный ресурс
  const [cust, setCust] = useState({});

  const per = (row) => effPer(row, cust);
  const main = qtype.res[0];

  const onDiesel = (text) => {
    setDiesel(text);
    const n = Number(text);
    setResource(text !== '' && !Number.isNaN(n) ? String(Math.round(n * per(main))) : '');
  };
  const onResource = (text) => {
    setResource(text);
    const n = Number(text);
    setDiesel(text !== '' && !Number.isNaN(n) ? String(Math.ceil(n / per(main))) : '');
  };
  const pickType = (tp) => {
    setQtype(tp);
    const n = Number(diesel);
    setResource(diesel !== '' && !Number.isNaN(n) ? String(Math.round(n * per(tp.res[0]))) : '');
  };
  const reset = () => { setDiesel('1'); onDiesel('1'); };

  const dNum = Math.max(0, Number(diesel) || 0);
  const rows = qtype.res.map((r) => ({ key: r.key, n: per(r) * dNum }));

  return (
    <GlassCard>
      <Text style={st.title}>
        {(lang === 'ru' ? 'Калькулятор карьера' : 'Mining Quarry Calculator').toUpperCase()}
      </Text>
      <Text style={st.subtitle}>
        {lang === 'ru'
          ? 'Выберите карьер и введите количество дизеля или нужное количество ресурса.'
          : 'Pick a quarry and enter the amount of diesel or the resource amount you need.'}
      </Text>

      {/* тип карьера */}
      <View style={st.chipRow}>
        {QUARRY_TYPES.map((tp) => (
          <TouchableOpacity
            key={tp.id}
            style={[st.chip, qtype.id === tp.id && st.chipActive]}
            onPress={() => pickType(tp)}
          >
            <Text style={[st.chipTxt, qtype.id === tp.id && st.chipTxtActive]}>
              {lang === 'ru' ? tp.ru : tp.en}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* дизель ↔ главный ресурс */}
      <View style={st.ioRow}>
        <View style={st.ioCol}>
          <Text style={st.ioLbl}>{lang === 'ru' ? 'Дизель' : 'Diesel'}</Text>
          <TextInput
            style={st.ioInput}
            value={diesel}
            onChangeText={onDiesel}
            keyboardType="number-pad"
          />
        </View>
        <View style={st.ioCol}>
          <Text style={st.ioLbl}>{lang === 'ru' ? R[main.key].ru : R[main.key].en}</Text>
          <TextInput
            style={st.ioInput}
            value={resource}
            onChangeText={onResource}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <TimeLine lang={lang} sec={dNum * 120} />
      <ResTable lang={lang} rows={rows} />
      <ResetBtn lang={lang} onPress={reset} />
      <AdvEditor lang={lang} rows={qtype.res} cust={cust} setCust={setCust} />
      <Text style={st.footnote}>
        {lang === 'ru'
          ? '💡 Водяной насос — тот же принцип без дизеля: ставится на пресную воду и питает спринклеры через трубы.'
          : '💡 Water pump works the same without diesel: place on fresh water to feed sprinklers through pipes.'}
      </Text>
    </GlassCard>
  );
}

/* ── 3. Нефтекачка (Pump Jack) ── */

export function PumpjackCalcScreen({ lang = 'ru' }) {
  const [diesel, setDiesel] = useState('1');
  const [oil, setOil] = useState('60');
  const [cust, setCust] = useState({});
  const per = effPer(PUMP_RES[0], cust);

  const onDiesel = (text) => {
    setDiesel(text);
    const n = Number(text);
    setOil(text !== '' && !Number.isNaN(n) ? String(Math.round(n * per)) : '');
  };
  const onOil = (text) => {
    setOil(text);
    const n = Number(text);
    setDiesel(text !== '' && !Number.isNaN(n) ? String(Math.ceil(n / per)) : '');
  };
  const reset = () => { setDiesel('1'); onDiesel('1'); };

  const dNum = Math.max(0, Number(diesel) || 0);

  return (
    <GlassCard>
      <Text style={st.title}>
        {(lang === 'ru' ? 'Калькулятор насоса' : 'Pump Jack Calculator').toUpperCase()}
      </Text>
      <Text style={st.subtitle}>
        {lang === 'ru'
          ? 'Введите дизель или количество нефти.'
          : 'Enter diesel or the amount of crude oil.'}
      </Text>

      <View style={st.ioRow}>
        <View style={st.ioCol}>
          <Text style={st.ioLbl}>{lang === 'ru' ? 'Дизель' : 'Diesel'}</Text>
          <TextInput
            style={st.ioInput}
            value={diesel}
            onChangeText={onDiesel}
            keyboardType="number-pad"
          />
        </View>
        <View style={st.ioCol}>
          <Text style={st.ioLbl}>{lang === 'ru' ? 'Нефть' : 'Crude Oil'}</Text>
          <TextInput
            style={st.ioInput}
            value={oil}
            onChangeText={onOil}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <TimeLine lang={lang} sec={dNum * 130} />
      <ResTable lang={lang} rows={[{ key: 'crude', n: per * dNum }]} />
      <ResetBtn lang={lang} onPress={reset} />
      <AdvEditor lang={lang} rows={PUMP_RES} cust={cust} setCust={setCust} />
    </GlassCard>
  );
}

const st = StyleSheet.create({
  title: { color: eventPalette.orange, fontSize: 15, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  subtitle: { color: colors.textMuted, fontSize: 11.5, lineHeight: 16, textAlign: 'center', marginBottom: 14 },

  // степпер экскаватора
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 },
  stepBtn: {
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 11,
  },
  stepTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },
  stepVal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  stepNum: { color: '#fff', fontSize: 17, fontWeight: '700', minWidth: 26, textAlign: 'right' },

  // чипы типов карьера
  chipRow: { flexDirection: 'row', gap: 7, marginBottom: 14 },
  chip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#c96f2e',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 4,
  },
  chipActive: { backgroundColor: '#f2b39a' },
  chipTxt: { color: '#fff', fontSize: 11.5, fontWeight: '700' },
  chipTxtActive: { color: '#3a2418' },

  // пара инпутов дизель ↔ ресурс
  ioRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  ioCol: { flex: 1 },
  ioLbl: {
    color: colors.textPrimary,
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  ioInput: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },

  timeLine: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 14,
  },

  // таблица Предмет / Количество
  table: { marginBottom: 14 },
  thead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 7,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.14)',
  },
  th: { color: colors.textPrimary, fontSize: 13.5, fontWeight: '800' },
  trow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  tdName: { color: colors.textPrimary, fontSize: 13 },
  tdN: { color: colors.textPrimary, fontSize: 13.5, fontWeight: '600' },

  resetBtn: {
    alignItems: 'center',
    backgroundColor: '#8a6a55',
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 8,
  },
  resetTxt: { color: '#f5e9e2', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },

  advToggle: { alignSelf: 'flex-start', paddingVertical: 4, marginBottom: 4 },
  advToggleTxt: { color: eventPalette.blue, fontSize: 11.5, fontWeight: '700' },
  advRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  advName: { color: colors.textPrimary, fontSize: 11.5, flex: 1 },
  advInput: {
    color: '#fff',
    fontSize: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 6,
    width: 70,
    textAlign: 'center',
    paddingVertical: 4,
  },
  footnote: { color: colors.textMuted, fontSize: 10.5, lineHeight: 15, marginTop: 8 },
  disclaimer: {
    color: colors.textMuted,
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 8,
  },
});
