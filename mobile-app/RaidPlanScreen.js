// ─────────────────────────────────────────────────────────
// 💣 РЕЙД КАЛЬК (по макетам references) — три вида:
//   план      — табы «Рекомендуется / Без ВБ 3», строки построек,
//               «лучший вариант» боеприпаса, итоговая строка;
//   raw       — «Сырые компоненты»: во что разворачивается счёт
//               (C4 = 20 взрывчатки + 5 лезвий + 2 тех. мусора…);
//   nodes     — «Калькулятор нод»: удары по ноде инструментами
//               и добыча с ноды с бонусом чая (+0/10/20/30%).
// Все цифры ≈ ванильные (rusthelp.com + общепринятые таблицы),
// урон зависит от материала и патчей — сверяй на своём сервере.
// ─────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { colors, eventPalette } from './theme';
import { GlassCard } from './ui';

const fmtTh = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// ── Боеприпасы: сера за 1 шт, нужен ли верстак 3, ≈ урон по материалу ──
const AMMO = [
  { id: 'c4',      ic: '💣', ru: 'C4',             en: 'C4',              sulfur: 2200, wb: 3, dmg: { wood: 275, stone: 275, metal: 275, hqm: 275 } },
  { id: 'rocket',  ic: '🚀', ru: 'Ракета',          en: 'Rocket',          sulfur: 1400, wb: 2, dmg: { wood: 320, stone: 137, metal: 137, hqm: 137 } },
  { id: 'hv',      ic: '🧨', ru: 'HV ракета',       en: 'HV Rocket',       sulfur: 900,  wb: 2, dmg: { wood: 110, stone: 110, metal: 110, hqm: 110 } },
  { id: 'satchel', ic: '🎒', ru: 'Сатчел',          en: 'Satchel',         sulfur: 480,  wb: 1, dmg: { wood: 139, stone: 50, metal: 92, hqm: 46 } },
  { id: 'beancan', ic: '🥫', ru: 'Бобовая бомба',   en: 'Beancan Grenade', sulfur: 180,  wb: 1, dmg: { wood: 65, stone: 20, metal: 30, hqm: 15 } },
  { id: 'explo',   ic: '🔵', ru: 'Разрывные 5.56',  en: 'Explosive 5.56',  sulfur: 25,   wb: 2, dmg: { wood: 30, stone: 3, metal: 3, hqm: 2 } },
];

const ammoById = (id) => AMMO.find((a) => a.id === id);

// ── Постройки: HP и материал (жёсткая сторона, ≈ ваниль) ──
const BUILDINGS = [
  { id: 'woodDoor',    ic: '🚪', ru: 'Деревянная дверь',     en: 'Wooden Door',     hp: 200,  mat: 'wood' },
  { id: 'sheetDoor',   ic: '🚪', ru: 'Дверь (лист. металл)', en: 'Sheet Metal Door', hp: 250,  mat: 'metal' },
  { id: 'garage',      ic: '🚪', ru: 'Гаражная дверь',       en: 'Garage Door',     hp: 600,  mat: 'metal' },
  { id: 'woodWall',    ic: '🪵', ru: 'Стена деревянная',     en: 'Wood Wall',       hp: 250,  mat: 'wood' },
  { id: 'stoneWall',   ic: '🧱', ru: 'Стена каменная',       en: 'Stone Wall',      hp: 500,  mat: 'stone' },
  { id: 'metalWall',   ic: '🧱', ru: 'Стена металлическая',  en: 'Metal Wall',      hp: 1000, mat: 'metal' },
  { id: 'armoredWall', ic: '🧱', ru: 'Стена бронированная',  en: 'Armored Wall',    hp: 2000, mat: 'hqm' },
  { id: 'custom',      ic: '📏', ru: 'Своё (ввести HP)',     en: 'Custom (enter HP)', hp: 500, mat: 'stone', custom: true },
];

const bById = (id) => BUILDINGS.find((b) => b.id === id);

// Лучший боеприпас для постройки: минимум серы, при равенстве — меньше штук
function bestAmmo(b, hp, allowWb3) {
  let best = null;
  AMMO.forEach((a) => {
    if (!allowWb3 && a.wb >= 3) return;
    const count = Math.ceil(hp / a.dmg[b.mat]);
    const cost = count * a.sulfur;
    if (!best || cost < best.cost || (cost === best.cost && count < best.count)) {
      best = { ammo: a, count, cost };
    }
  });
  return best;
}

// ── Рецепты крафта (≈ ваниль, за 1 шт) для «сырых компонентов» ──
const ING = {
  explo:  { ic: '🧱', ru: 'Взрывчатка',        en: 'Explosives' },
  gp:     { ic: '⚪️', ru: 'Порох',             en: 'Gun Powder' },
  sulfur: { ic: '🟡', ru: 'Сера',              en: 'Sulfur' },
  beancan:{ ic: '🥫', ru: 'Бобовая бомба',     en: 'Beancan Grenade' },
  blade:  { ic: '🔪', ru: 'Металл. лезвие',    en: 'Metal Blade' },
  tech:   { ic: '🟩', ru: 'Тех. мусор',        en: 'Tech Trash' },
  pipe:   { ic: '🔧', ru: 'Металл. труба',     en: 'Metal Pipe' },
  smoke:  { ic: '💨', ru: 'Дымовая граната',   en: 'Smoke Grenade' },
  rope:   { ic: '🪢', ru: 'Верёвка',           en: 'Rope' },
  stash:  { ic: '📦', ru: 'Малый тайник',      en: 'Small Stash' },
  mf:     { ic: '⚙️', ru: 'Металл. фрагменты', en: 'Metal Fragments' },
  lg:     { ic: '🧪', ru: 'Низкосорт. топливо', en: 'Low Grade Fuel' },
  cloth:  { ic: '🧵', ru: 'Ткань',             en: 'Cloth' },
};
const RECIPES = {
  c4:      [{ k: 'explo', n: 20 }, { k: 'blade', n: 5 }, { k: 'tech', n: 2 }],
  rocket:  [{ k: 'gp', n: 100 }, { k: 'explo', n: 1 }, { k: 'pipe', n: 2 }],
  hv:      [{ k: 'gp', n: 150 }, { k: 'pipe', n: 2 }, { k: 'smoke', n: 1 }],
  satchel: [{ k: 'beancan', n: 4 }, { k: 'rope', n: 1 }, { k: 'stash', n: 1 }],
  beancan: [{ k: 'gp', n: 60 }, { k: 'mf', n: 20 }],
  explo:   [{ k: 'gp', n: 50 }, { k: 'sulfur', n: 10 }, { k: 'mf', n: 1 }, { k: 'lg', n: 1 }],
};
// промежуточные ингредиенты, у которых есть свой рецепт (разворачиваются)
const SUB_RECIPES = { explo: RECIPES.explo, beancan: RECIPES.beancan };

// ── Калькулятор нод: чай (+% добычи) и инструменты (≈ ударов на ноду) ──
const TEAS = [
  { id: 'none',  label: 'NO TEA', pct: 0 },
  { id: 'basic', label: 'BASIC',  pct: 10 },
  { id: 'adv',   label: 'ADV.',   pct: 20 },
  { id: 'pure',  label: 'PURE',   pct: 30 },
];
const NODES = [
  { id: 'sulfur', ic: '🟡', ru: 'Серная нода', en: 'Sulfur Node', base: 30 },
  { id: 'stone',  ic: '🪨', ru: 'Каменная нода', en: 'Stone Node', base: 50 },
];
const TOOLS = [
  { ic: '🔨', ru: 'Отбойный молоток',   en: 'Jackhammer',      hits: 9 },
  { ic: '⛏️', ru: 'Самод. ледоруб',     en: 'Salvaged Icepick', hits: 11 },
  { ic: '⛏️', ru: 'Кирка',              en: 'Pickaxe',          hits: 12 },
  { ic: '⛏️', ru: 'Каменная кирка',     en: 'Stone Pickaxe',    hits: 16 },
  { ic: '🔨', ru: 'Самод. молот',       en: 'Salvaged Hammer',  hits: 20 },
  { ic: '🪓', ru: 'Топор',              en: 'Hatchet',          hits: 15 },
  { ic: '🪓', ru: 'Каменный топор',     en: 'Stone Hatchet',    hits: 24 },
  { ic: '🦴', ru: 'Костяная дубина',    en: 'Bone Club',        hits: 34 },
];

/* ══════════════ Основной экран ══════════════ */

export function RaidPlanScreen({ lang = 'ru' }) {
  const [view, setView] = useState('main'); // main | raw | nodes
  const [tab, setTab] = useState('rec');    // rec | nowb3
  const [rows, setRows] = useState([]);     // [{bid, n, hp?}] — hp для custom
  const [pickerOpen, setPickerOpen] = useState(false);

  const allowWb3 = tab === 'rec';

  // расчёт по каждой строке + итоги
  const calc = rows.map((r) => {
    const b = bById(r.bid);
    const hp = Math.max(1, Number(r.hp) || b.hp);
    return { ...r, b, hp, best: bestAmmo(b, hp, allowWb3) };
  });
  const totals = {};
  let sulfurTotal = 0;
  calc.forEach((r) => {
    if (!r.best) return;
    const n = r.best.count * r.n;
    totals[r.best.ammo.id] = (totals[r.best.ammo.id] || 0) + n;
    sulfurTotal += r.best.cost * r.n;
  });

  const addBuilding = (bid) => {
    const i = rows.findIndex((r) => r.bid === bid);
    if (i >= 0) {
      const next = [...rows];
      next[i] = { ...next[i], n: next[i].n + 1 };
      setRows(next);
      return;
    }
    setRows([...rows, { bid, n: 1, hp: String(bById(bid).hp) }]);
  };
  const changeN = (idx, d) => {
    const next = [...rows];
    const n = next[idx].n + d;
    if (n <= 0) next.splice(idx, 1); else next[idx] = { ...next[idx], n };
    setRows(next);
  };
  const setHp = (idx, text) => {
    const next = [...rows];
    next[idx] = { ...next[idx], hp: text.replace(/[^0-9]/g, '') };
    setRows(next);
  };

  const t = (o) => (lang === 'ru' ? o.ru : o.en);

  /* ── Вид: сырые компоненты ── */
  if (view === 'raw') {
    return <RawView lang={lang} totals={totals} sulfurTotal={sulfurTotal} back={() => setView('main')} />;
  }
  /* ── Вид: калькулятор нод ── */
  if (view === 'nodes') {
    return <NodesView lang={lang} back={() => setView('main')} />;
  }

  /* ── Вид: план ── */
  return (
    <GlassCard>
      {/* табы */}
      <View style={st.tabRow}>
        {[['rec', lang === 'ru' ? 'Рекомендуется' : 'Recommended'], ['nowb3', lang === 'ru' ? 'Без ВБ 3' : 'No WB 3']].map(([id, label]) => (
          <TouchableOpacity key={id} style={st.tabBtn} onPress={() => setTab(id)}>
            <Text style={[st.tabTxt, tab === id && st.tabTxtActive]}>{label}</Text>
            {tab === id && <View style={st.tabLine} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* итоговая строка */}
      <View style={st.totalStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Text style={st.totalLbl}>{lang === 'ru' ? 'Итого:' : 'Total:'}</Text>
          {Object.keys(totals).length === 0 && (
            <Text style={st.totalEmpty}>{lang === 'ru' ? 'добавь постройки ↓' : 'add buildings ↓'}</Text>
          )}
          {Object.entries(totals).map(([id, n]) => (
            <Text key={id} style={st.totalItem}>{ammoById(id).ic + ' ×' + fmtTh(n)}</Text>
          ))}
        </ScrollView>
        {!!sulfurTotal && (
          <Text style={st.sulfurLine}>≈ {fmtTh(sulfurTotal)} {lang === 'ru' ? 'серы' : 'sulfur'}</Text>
        )}
      </View>

      {/* строки построек */}
      {calc.map((r, idx) => (
        <View key={r.bid + idx} style={st.row}>
          <View style={st.rowLeft}>
            <Text style={st.rowIc}>{r.b.ic}</Text>
            <Text style={st.rowN}>{'×' + r.n}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.rowName} numberOfLines={1}>{t(r.b)}</Text>
            {r.b.custom && (
              <View style={st.hpRow}>
                <Text style={st.hpLbl}>HP:</Text>
                <TextInput
                  style={st.hpInput}
                  value={r.hp}
                  onChangeText={(v) => setHp(idx, v)}
                  keyboardType="number-pad"
                />
              </View>
            )}
            {!!r.best && (
              <Text style={st.rowBest}>
                {(lang === 'ru' ? 'Лучший вариант: ' : 'Best option: ')
                  + r.best.ammo.ic + ' ×' + fmtTh(r.best.count * r.n)
                  + '  ≈' + fmtTh(r.best.cost * r.n) + ' 🟡'}
              </Text>
            )}
          </View>
          <View style={st.rowCtrl}>
            <TouchableOpacity style={st.miniBtn} onPress={() => changeN(idx, 1)}><Text style={st.miniTxt}>＋</Text></TouchableOpacity>
            <TouchableOpacity style={st.miniBtn} onPress={() => changeN(idx, -1)}><Text style={st.miniTxt}>－</Text></TouchableOpacity>
            <TouchableOpacity style={st.delBtn} onPress={() => changeN(idx, -r.n)}><Text style={st.delTxt}>✕</Text></TouchableOpacity>
          </View>
        </View>
      ))}

      {/* выбор постройки */}
      {pickerOpen && (
        <View style={st.palette}>
          {BUILDINGS.map((b) => (
            <TouchableOpacity key={b.id} style={st.palChip} onPress={() => addBuilding(b.id)}>
              <Text style={{ fontSize: 13 }}>{b.ic}</Text>
              <Text style={st.palTxt} numberOfLines={1}>{t(b)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* переключение видов */}
      <View style={st.viewRow}>
        <TouchableOpacity style={st.viewBtn} onPress={() => setView('raw')}>
          <Text style={st.viewTxt}>⬆ {lang === 'ru' ? 'Сырые компоненты' : 'Raw components'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.viewBtn} onPress={() => setView('nodes')}>
          <Text style={st.viewTxt}>⛏ {lang === 'ru' ? 'Калькулятор нод' : 'Node calculator'}</Text>
        </TouchableOpacity>
      </View>

      {/* добавить / сброс */}
      <View style={st.bottomRow}>
        <TouchableOpacity style={st.addBigBtn} onPress={() => setPickerOpen(!pickerOpen)}>
          <Text style={st.addBigTxt}>⊕ {lang === 'ru' ? 'ДОБАВИТЬ СТРОЕНИЯ' : 'ADD BUILDINGS'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.resetBigBtn} onPress={() => setRows([])}>
          <Text style={st.resetBigTxt}>🗑 {lang === 'ru' ? 'СБРОС' : 'RESET'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={st.disclaimer}>
        {lang === 'ru'
          ? '≈ Жёсткая сторона, ванильный баланс (rusthelp, авг. 2026). «Без ВБ 3» исключает C4 (нужен верстак 3). Реальный расход зависит от угла попадания и патчей — бери 1–2 про запас.'
          : '≈ Hard side, vanilla balance (rusthelp, Aug 2026). "No WB 3" excludes C4 (needs workbench 3). Real usage depends on hit angle and patches — take 1–2 spare.'}
      </Text>
    </GlassCard>
  );
}

/* ══════════════ Сырые компоненты ══════════════ */

function RawView({ lang, totals, sulfurTotal, back }) {
  // разворачиваем промежуточные ингредиенты (взрывчатка, бобовая) в сырье
  const raw = {};
  const addRaw = (k, n) => { raw[k] = (raw[k] || 0) + n; };
  const expand = (k, n) => {
    if (SUB_RECIPES[k]) {
      SUB_RECIPES[k].forEach((ing) => expand(ing.k, ing.n * n));
    } else {
      addRaw(k, n);
    }
  };
  const usedAmmo = Object.entries(totals).filter(([, n]) => n > 0);

  return (
    <GlassCard>
      <Text style={st.viewTitle}>{lang === 'ru' ? '⬆ СЫРЫЕ КОМПОНЕНТЫ' : '⬆ RAW COMPONENTS'}</Text>
      {usedAmmo.length === 0 && (
        <Text style={st.totalEmpty}>{lang === 'ru' ? 'План пуст — вернись и добавь постройки.' : 'Plan is empty — go back and add buildings.'}</Text>
      )}
      {usedAmmo.map(([id, n]) => {
        const a = ammoById(id);
        const rec = RECIPES[id];
        if (!rec) return null;
        return (
          <View key={id} style={st.rawCard}>
            <Text style={st.rawName}>{a.ic + ' ' + (lang === 'ru' ? a.ru : a.en) + ' ×' + fmtTh(n)}</Text>
            <Text style={st.rawLine}>
              {lang === 'ru' ? 'крафт: ' : 'craft: '}
              {rec.map((ing) => ing.n + '× ' + (lang === 'ru' ? ING[ing.k].ru : ING[ing.k].en)).join(' + ')}
            </Text>
            <Text style={st.rawLine}>
              {lang === 'ru' ? 'итого: ' : 'total: '}
              {rec.map((ing) => ing.n * n + '× ' + (lang === 'ru' ? ING[ing.k].ru : ING[ing.k].en)).join(' · ')}
            </Text>
          </View>
        );
      })}

      {/* итоговое сырье (промежуточные развернуты) */}
      {!!usedAmmo.length && (
        <View style={st.rawTotals}>
          <Text style={st.groupTitle}>{lang === 'ru' ? 'ИТОГО СЫРЬЯ (≈)' : 'RAW TOTALS (≈)'}</Text>
          {usedAmmo.forEach(([id, n]) => { RECIPES[id] && RECIPES[id].forEach((ing) => expand(ing.k, ing.n * n)); })}
          {Object.entries(raw).map(([k, n]) => (
            <View key={k} style={st.rawRow}>
              <Text style={st.rawRowName}>{ING[k].ic + '  ' + (lang === 'ru' ? ING[k].ru : ING[k].en)}</Text>
              <Text style={st.rawRowN}>{fmtTh(n)}</Text>
            </View>
          ))}
          <View style={st.rawRow}>
            <Text style={st.rawRowName}>🟡  {lang === 'ru' ? 'Сера (плановая, стандартная таблица)' : 'Sulfur (planning, standard table)'}</Text>
            <Text style={st.rawRowN}>{fmtTh(sulfurTotal)}</Text>
          </View>
          <Text style={st.rawNote}>
            {lang === 'ru'
              ? '≈ Порох варится из серы и угля (30 серы + 20 угля → 10 пороха); уголь остаётся от переплавки серной руды и дерева, поэтому плановая сера считается по стандартной таблице (C4 ≈ 2200), а не как сумма строк рецептов.'
              : '≈ Gun powder cooks from sulfur and charcoal (30 + 20 → 10 powder); charcoal is a byproduct of smelting sulfur ore and wood, so planning sulfur follows the standard table (C4 ≈ 2200), not the raw sum of recipe lines.'}
          </Text>
        </View>
      )}

      <TouchableOpacity style={st.backBtn2} onPress={back}>
        <Text style={st.backTxt2}>← {lang === 'ru' ? 'К плану' : 'Back to plan'}</Text>
      </TouchableOpacity>
      <Text style={st.disclaimer}>
        {lang === 'ru'
          ? '≈ Рецепты ванильные; выход пороха 30 серы + 20 угля → 10 пороха. На модифицированных серверах рецепты другие.'
          : '≈ Vanilla recipes; gun powder: 30 sulfur + 20 charcoal → 10 powder. Modded servers use different recipes.'}
      </Text>
    </GlassCard>
  );
}

/* ══════════════ Калькулятор нод ══════════════ */

function NodesView({ lang, back }) {
  const [tea, setTea] = useState(TEAS[0]);
  const [node, setNode] = useState(NODES[0]);

  return (
    <GlassCard>
      <View style={st.nodesHead}>
        <Text style={st.viewTitle}>{lang === 'ru' ? '⛏ КАЛЬКУЛЯТОР НОД' : '⛏ NODE CALCULATOR'}</Text>
        <Text style={st.teaPct}>+{tea.pct}% {lang === 'ru' ? 'дополнительный ресурс' : 'extra resources'}</Text>
      </View>

      {/* чай */}
      <View style={st.teaRow}>
        {TEAS.map((tp) => (
          <TouchableOpacity key={tp.id} style={[st.teaChip, tea.id === tp.id && st.teaChipActive]} onPress={() => setTea(tp)}>
            <Text style={[st.teaTxt, tea.id === tp.id && st.teaTxtActive]}>{tp.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* тип ноды */}
      <View style={st.nodeRow}>
        {NODES.map((nd) => (
          <TouchableOpacity key={nd.id} style={[st.nodeChip, node.id === nd.id && st.nodeChipActive]} onPress={() => setNode(nd)}>
            <Text style={st.nodeTxt}>{nd.ic + '  ' + (lang === 'ru' ? nd.ru : nd.en)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* инструменты сеткой 2 колонки */}
      <View style={st.toolGrid}>
        {TOOLS.map((tool) => {
          const yieldN = Math.round(node.base * (1 + tea.pct / 100));
          return (
            <View key={tool.ru} style={st.toolCard}>
              <Text style={st.toolName} numberOfLines={1}>{tool.ic + ' ' + (lang === 'ru' ? tool.ru : tool.en)}</Text>
              <View style={st.toolChips}>
                <View style={st.toolChip}>
                  <Text style={st.toolChipTxt}>
                    {lang === 'ru' ? 'ударов ≈' : 'hits ≈'} {tool.hits}
                  </Text>
                </View>
                <View style={st.toolChip}>
                  <Text style={st.toolChipTxt}>{node.ic + ' ×' + yieldN}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <TouchableOpacity style={st.backBtn2} onPress={back}>
        <Text style={st.backTxt2}>← {lang === 'ru' ? 'К плану' : 'Back to plan'}</Text>
      </TouchableOpacity>
      <Text style={st.disclaimer}>
        {lang === 'ru'
          ? '≈ Удары — для полной добычи ноды (зависит от сервера). Чай (Basic/Adv/Pure) даёт ≈ +10/20/30% добычи на ванили. Цифры правятся в коде — сверяй по факту.'
          : '≈ Hits are for fully harvesting a node (server-dependent). Teas give ≈ +10/20/30% yield on vanilla. Edit values in code — verify in game.'}
      </Text>
    </GlassCard>
  );
}

const st = StyleSheet.create({
  // табы
  tabRow: { flexDirection: 'row', marginBottom: 10 },
  tabBtn: { flex: 1, alignItems: 'center', paddingBottom: 8 },
  tabTxt: { color: colors.textMuted, fontSize: 13.5, fontWeight: '600' },
  tabTxtActive: { color: eventPalette.orange, fontWeight: '800' },
  tabLine: { position: 'absolute', bottom: 0, left: '18%', right: '18%', height: 2, backgroundColor: eventPalette.orange, borderRadius: 2 },

  // итоговая строка
  totalStrip: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  totalLbl: { color: colors.textPrimary, fontSize: 13, fontWeight: '800', marginRight: 8 },
  totalItem: { color: '#ffd54f', fontSize: 13, fontWeight: '700', marginRight: 10 },
  totalEmpty: { color: colors.textMuted, fontSize: 12 },
  sulfurLine: { color: eventPalette.orange, fontSize: 11.5, fontWeight: '700', marginTop: 4 },

  // строки построек
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 9,
    marginBottom: 7,
  },
  rowLeft: { alignItems: 'center', marginRight: 10, minWidth: 40 },
  rowIc: { fontSize: 21 },
  rowN: { color: '#fff', fontSize: 12, fontWeight: '800', marginTop: 1 },
  rowName: { color: colors.textPrimary, fontSize: 12.5, fontWeight: '700' },
  rowBest: { color: colors.textSecondary, fontSize: 11.5, marginTop: 2 },
  hpRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  hpLbl: { color: colors.textMuted, fontSize: 11 },
  hpInput: {
    color: eventPalette.orange,
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 6,
    width: 64,
    textAlign: 'center',
    paddingVertical: 2,
  },
  rowCtrl: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  miniBtn: {
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 8,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },
  delBtn: {
    backgroundColor: 'rgba(239,68,68,0.85)',
    borderRadius: 999,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 3,
  },
  delTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // палитра построек
  palette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
  },
  palChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    maxWidth: '47%',
  },
  palTxt: { color: colors.textPrimary, fontSize: 10.5, fontWeight: '600' },

  // нижние кнопки
  viewRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  viewBtn: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 10,
    paddingVertical: 10,
  },
  viewTxt: { color: colors.textPrimary, fontSize: 11.5, fontWeight: '700' },
  bottomRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  addBigBtn: {
    flex: 2,
    alignItems: 'center',
    backgroundColor: '#f2b39a',
    borderRadius: 12,
    paddingVertical: 13,
  },
  addBigTxt: { color: '#3a2418', fontSize: 12.5, fontWeight: '900', letterSpacing: 0.3 },
  resetBigBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#b04a3a',
    borderRadius: 12,
    paddingVertical: 13,
  },
  resetBigTxt: { color: '#fff', fontSize: 12.5, fontWeight: '900', letterSpacing: 0.3 },

  groupTitle: { color: colors.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 6 },

  // сырые компоненты
  viewTitle: { color: eventPalette.orange, fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  rawCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: 9,
    marginTop: 8,
  },
  rawName: { color: colors.textPrimary, fontSize: 12.5, fontWeight: '800' },
  rawLine: { color: colors.textSecondary, fontSize: 11, lineHeight: 15, marginTop: 3 },
  rawTotals: { marginTop: 12 },
  rawRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rawRowName: { color: colors.textPrimary, fontSize: 12 },
  rawRowN: { color: '#ffd54f', fontSize: 12.5, fontWeight: '800' },
  rawNote: { color: colors.textMuted, fontSize: 10.5, lineHeight: 15, marginTop: 8 },
  backBtn2: {
    alignSelf: 'flex-start',
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  backTxt2: { color: colors.textPrimary, fontSize: 12, fontWeight: '700' },

  // калькулятор нод
  nodesHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  teaPct: { color: eventPalette.orange, fontSize: 11, fontWeight: '700' },
  teaRow: { flexDirection: 'row', gap: 6, marginTop: 10, marginBottom: 8 },
  teaChip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingVertical: 7,
  },
  teaChipActive: { backgroundColor: '#e8703a', borderColor: '#e8703a' },
  teaTxt: { color: colors.textSecondary, fontSize: 10.5, fontWeight: '800' },
  teaTxtActive: { color: '#fff' },
  nodeRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  nodeChip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 10,
    paddingVertical: 8,
  },
  nodeChipActive: { borderColor: '#66bb6a', backgroundColor: 'rgba(102,187,106,0.18)' },
  nodeTxt: { color: colors.textPrimary, fontSize: 11.5, fontWeight: '700' },
  toolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  toolCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 12,
    padding: 9,
  },
  toolName: { color: colors.textPrimary, fontSize: 12, fontWeight: '800', marginBottom: 6 },
  toolChips: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  toolChip: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  toolChipTxt: { color: '#ffd54f', fontSize: 10.5, fontWeight: '700' },

  disclaimer: {
    color: colors.textMuted,
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 8,
  },
});
