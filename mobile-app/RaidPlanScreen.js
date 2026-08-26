// ─────────────────────────────────────────────────────────
// 💣 РЕЙД-КАЛЬК (Legacy) — три экрана по макетам references:
//   RaidPlanScreen   — план: табы «Рекомендуется / Без ВБ 3»,
//                      строки построек с лучшим боеприпасом,
//                      Итого, сырые компоненты, калькулятор нод;
//   EcoRaidScreen    — эко-рейд: лучший инструмент (удары +
//                      время), табы «Рекомендуется / Самый быстрый»;
//   CustomRaidScreen — кастом: выбираешь боеприпас сверху,
//                      «+ Добавить» бьёт по строению, полоска ХП.
// Пикер строений общий: поиск + стена/фундамент/пол/крыша всех
// тиров, двери, ящик, своё HP.
// Все цифры ≈ ванильные (rusthelp/rustlabs-стиль), урон зависит
// от материала и патчей — значения правятся в таблицах ниже.
// ─────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Image } from 'react-native';
import { colors, eventPalette } from './theme';
import { GlassCard } from './ui';

const fmtTh = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// ── Боеприпасы: сера за 1 шт, нужен ли верстак 3, ≈ урон по материалу ──
const AMMO = [
  { id: 'c4',      ic: '💣', icon: '../docs/items/ammo.rifle.explosive.png', ru: 'C4',             en: 'C4',              sulfur: 2200, wb: 3, dmg: { wood: 275, stone: 275, metal: 275, hqm: 275 } },
  { id: 'rocket',  ic: '🚀', icon: '../docs/items/ammo.rocket.basic.png', ru: 'Ракета',          en: 'Rocket',          sulfur: 1400, wb: 2, dmg: { wood: 320, stone: 137, metal: 137, hqm: 137 } },
  { id: 'hv',      ic: '🧨', icon: '../docs/items/ammo.rocket.hv.png', ru: 'HV ракета',       en: 'HV Rocket',       sulfur: 900,  wb: 2, dmg: { wood: 110, stone: 110, metal: 110, hqm: 110 } },
  { id: 'satchel', ic: '🎒', icon: '../docs/items/ammo.grenadelauncher.smoke.png', ru: 'Сатчел',          en: 'Satchel',         sulfur: 480,  wb: 1, dmg: { wood: 139, stone: 50, metal: 92, hqm: 46 } },
  { id: 'beancan', ic: '🥫', icon: '../docs/items/ammo.grenadelauncher.he.png', ru: 'Бобовая бомба',   en: 'Beancan Grenade', sulfur: 180,  wb: 1, dmg: { wood: 65, stone: 20, metal: 30, hqm: 15 } },
  { id: 'explo',   ic: '🔵', icon: '../docs/items/ammo.rifle.explosive.png', ru: 'Разрывные 5.56',  en: 'Explosive 5.56',  sulfur: 25,   wb: 2, dmg: { wood: 30, stone: 3, metal: 3, hqm: 2 } },
];

const ammoById = (id) => AMMO.find((a) => a.id === id);

// ── Строения: тиры × части + двери/ящик/своё. HP тира одинаково
//    для стены/фундамента/пола/крыши (≈ ваниль) ──
const MATS = [
  { id: 'wood',    ru: 'дерева',        en: 'Wood',     hp: 250 },
  { id: 'stone',   ru: 'камня',         en: 'Stone',    hp: 500 },
  { id: 'metal',   ru: 'металла',       en: 'Metal',    hp: 1000 },
  { id: 'armored', ru: 'броне-металла', en: 'Armored',  hp: 2000 },
];
const PARTS = [
  { id: 'wall',       ic: '🧱', ru: 'Стена',     en: 'Wall' },
  { id: 'foundation', ic: '⬛', ru: 'Фундамент', en: 'Foundation' },
  { id: 'floor',      ic: '▭',  ru: 'Пол',       en: 'Floor' },
  { id: 'roof',       ic: '🏠', ru: 'Крыша',     en: 'Roof' },
];

const ALL_BUILDINGS = [];
MATS.forEach((m) => {
  const icon = m.id === 'wood' ? '../docs/walls/twig-wall.avif' : m.id === 'stone' ? '../docs/walls/stone-wall.avif' : m.id === 'metal' ? '../docs/walls/metal-wall.avif' : '../docs/walls/armored-wall.avif';
  PARTS.forEach((p) => {
    ALL_BUILDINGS.push({
      id: p.id + '_' + m.id,
      ic: p.ic,
      wallIcon: icon,
      hp: m.hp,
      mat: m.id === 'armored' ? 'hqm' : m.id,
      name: { ru: p.ru + ' из ' + m.ru, en: m.en + ' ' + p.en },
    });
  });
});
[
  { id: 'woodDoor',    ic: '🚪', hp: 200, mat: 'wood',  name: { ru: 'Деревянная дверь',      en: 'Wooden Door' } },
  { id: 'sheetDoor',   ic: '🚪', hp: 250, mat: 'metal', wallIcon: '../docs/walls/metal-wall-doorway.avif', name: { ru: 'Дверь (лист. металл)',  en: 'Sheet Metal Door' } },
  { id: 'garageDoor',  ic: '🚪', hp: 600, mat: 'metal', wallIcon: '../docs/walls/metal-wall-doorway.avif', name: { ru: 'Гаражная дверь',        en: 'Garage Door' } },
  { id: 'armoredDoor', ic: '🚪', hp: 800, mat: 'hqm',   name: { ru: 'Бронированная дверь',   en: 'Armored Door' } },
  { id: 'box',         ic: '📦', hp: 100, mat: 'wood',  name: { ru: 'Деревянный ящик',       en: 'Wooden Box' } },
  { id: 'custom',      ic: '📏', hp: 500, mat: 'stone', custom: true, name: { ru: 'Своё (ввести HP)', en: 'Custom (enter HP)' } },
].forEach((b) => ALL_BUILDINGS.push(b));

const bById = (id) => ALL_BUILDINGS.find((b) => b.id === id);

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

// ── Эко-рейд: инструменты (≈ урон за удар по материалу + мах/удар,
//    жёсткая сторона). POWER — только во вкладке «Самый быстрый» ──
const ECO_TOOLS = [
  { id: 'rock',      ic: '🪨', icon: '../docs/items/barricade.stone.png', ru: 'Камень',           en: 'Rock',              swing: 1.0, dmg: { wood: 4,  stone: 1,  metal: 1,  hqm: 1 } },
  { id: 'sthatchet', ic: '🪓', icon: '../docs/items/box.wooden.json', ru: 'Каменный топор',   en: 'Stone Hatchet',     swing: 1.0, dmg: { wood: 10, stone: 3,  metal: 2,  hqm: 1 } },
  { id: 'hatchet',   ic: '🪓', icon: '../docs/items/box.wooden.large.component.charcoal.skin.png', ru: 'Топор',            en: 'Hatchet',           swing: 1.0, dmg: { wood: 15, stone: 4,  metal: 3,  hqm: 2 } },
  { id: 'stpick',    ic: '⛏️', ru: 'Каменная кирка',   en: 'Stone Pickaxe',     swing: 1.0, dmg: { wood: 6,  stone: 6,  metal: 3,  hqm: 2 } },
  { id: 'pick',      ic: '⛏️', ru: 'Кирка',            en: 'Pickaxe',           swing: 1.0, dmg: { wood: 8,  stone: 12, metal: 5,  hqm: 3 } },
  { id: 'sicepick',  ic: '⛏️', ru: 'Самод. ледоруб',   en: 'Salvaged Icepick',  swing: 0.9, dmg: { wood: 10, stone: 16, metal: 7,  hqm: 4 } },
  { id: 'shammer',   ic: '🔨', ru: 'Самод. молот',     en: 'Salvaged Hammer',   swing: 1.0, dmg: { wood: 12, stone: 5,  metal: 6,  hqm: 3 } },
  { id: 'ssword',    ic: '🗡️', ru: 'Самод. меч',       en: 'Salvaged Sword',    swing: 0.7, dmg: { wood: 18, stone: 4,  metal: 3,  hqm: 2 } },
  { id: 'mace',      ic: '🏏', ru: 'Булава',           en: 'Mace',              swing: 1.1, dmg: { wood: 15, stone: 8,  metal: 5,  hqm: 3 } },
  { id: 'knife',     ic: '🔪', ru: 'Костяной нож',     en: 'Bone Knife',        swing: 0.6, dmg: { wood: 8,  stone: 2,  metal: 2,  hqm: 1 } },
];
const ECO_POWER = [
  { id: 'jackhammer', ic: '🔨', ru: 'Отбойный молоток', en: 'Jackhammer', swing: 0.35, dmg: { wood: 20, stone: 25, metal: 12, hqm: 8 } },
];

function bestEcoTool(b, hp, fast) {
  let best = null;
  ECO_TOOLS.concat(fast ? ECO_POWER : []).forEach((tool) => {
    const hits = Math.ceil(hp / tool.dmg[b.mat]);
    const time = hits * tool.swing;
    if (!best || time < best.time || (time === best.time && hits < best.hits)) {
      best = { tool, hits, time };
    }
  });
  return best;
}

// 5438 → «1ч 30м 38с» / «1h 30m 38s»
function fmtDurLong(sec, lang) {
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const u = lang === 'ru' ? ['ч', 'м', 'с'] : ['h', 'm', 's'];
  const parts = [];
  if (h) parts.push(h + u[0]);
  if (m) parts.push(m + u[1]);
  if (s || !parts.length) parts.push(s + u[2]);
  return parts.join(' ');
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

/* ══════════════ Общий пикер строений (с поиском) ══════════════ */

function BuildingPicker({ lang, onPick, hideCustom }) {
  const [q, setQ] = useState('');
  const list = ALL_BUILDINGS.filter((b) => {
    if (hideCustom && b.custom) return false;
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return (lang === 'ru' ? b.name.ru : b.name.en).toLowerCase().includes(needle);
  });
  return (
    <View style={st.palette}>
      <TextInput
        style={st.searchInput}
        value={q}
        onChangeText={setQ}
        placeholder={lang === 'ru' ? 'Поиск строения…' : 'Search structures…'}
        placeholderTextColor="rgba(255,255,255,0.35)"
      />
      <View style={st.palGrid}>
        {list.map((b) => (
          <TouchableOpacity key={b.id} style={st.palChip} onPress={() => onPick(b.id)}>
            <Text style={{ fontSize: 13 }}>{b.ic}</Text>
            <Text style={st.palTxt} numberOfLines={1}>{lang === 'ru' ? b.name.ru : b.name.en}</Text>
          </TouchableOpacity>
        ))}
        {!list.length && (
          <Text style={st.totalEmpty}>{lang === 'ru' ? 'ничего не нашлось' : 'nothing found'}</Text>
        )}
      </View>
    </View>
  );
}

/* ══════════════ 1. План (основной экран) ══════════════ */

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
          {Object.entries(totals).map(([id, n]) => {
            const a = ammoById(id);
            return (
              <Text key={id} style={st.totalItem}>
                {a.icon ? <Image source={require(a.icon)} style={{ width: 16, height: 16, borderRadius: 4, resizeMode: 'contain', marginRight: 2 }} /> : a.ic}
                {' ×' + fmtTh(n)}
              </Text>
            );
          })}
        </ScrollView>
        {!!sulfurTotal && (
          <Text style={st.sulfurLine}>≈ {fmtTh(sulfurTotal)} {lang === 'ru' ? 'серы' : 'sulfur'}</Text>
        )}
      </View>

      {/* строки построек */}
      {calc.map((r, idx) => (
        <View key={r.bid + idx} style={st.row}>
          <View style={st.rowLeft}>
            {r.b.wallIcon ? (
              <Image source={require(r.b.wallIcon)} style={{ width: 26, height: 26, borderRadius: 6, resizeMode: 'contain' }} />
            ) : (
              <Text style={st.rowIc}>{r.b.ic}</Text>
            )}
            <Text style={st.rowN}>{'×' + r.n}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.rowName} numberOfLines={1}>{t(r.b.name)}</Text>
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
                {(lang === 'ru' ? 'Лучший вариант: ' : 'Best option: ')}
                {r.best.ammo.icon ? <Image source={require(r.best.ammo.icon)} style={{ width: 14, height: 14, borderRadius: 3, resizeMode: 'contain', marginRight: 2 }} /> : r.best.ammo.ic}
                {' ×' + fmtTh(r.best.count * r.n) + '  ≈' + fmtTh(r.best.cost * r.n) + ' 🟡'}
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
        <TouchableOpacity style={[st.addBigBtn, pickerOpen && st.backListBtn]} onPress={() => setPickerOpen(!pickerOpen)}>
          <Text style={[st.addBigTxt, pickerOpen && st.backListTxt]}>
            {(pickerOpen ? '↓ ' : '⊕ ') + (pickerOpen
              ? (lang === 'ru' ? 'НАЗАД К СПИСКУ' : 'BACK TO LIST')
              : (lang === 'ru' ? 'ДОБАВИТЬ СТРОЕНИЯ' : 'ADD BUILDINGS'))}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.resetBigBtn} onPress={() => setRows([])}>
          <Text style={st.resetBigTxt}>🗑 {lang === 'ru' ? 'СБРОС' : 'RESET'}</Text>
        </TouchableOpacity>
      </View>

      {/* выбор постройки */}
      {pickerOpen && (
        <BuildingPicker lang={lang} onPick={addBuilding} />
      )}

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
  const usedAmmo = Object.entries(totals).filter(([, n]) => n > 0);
  const raw = {}; const addRaw = (k, n) => { raw[k] = (raw[k] || 0) + n; };
  const expand = (k, n) => { if (SUB_RECIPES && SUB_RECIPES[k]) { SUB_RECIPES[k].forEach((ing) => expand(ing.k, ing.n * n)); } else { addRaw(k, n); } };
  usedAmmo.forEach(([id, n]) => { (RECIPES[id] || RECIPES.explo) && (RECIPES[id] || []).forEach((ing) => expand(ing.k, ing.n * n)); });
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
          <View key={id} style={st.treeRoot}>
            {/* корень — боеприпас */}
            <View style={st.treeNode}>
              <View style={st.treeIconWrap}><Image source={require(a.icon || '../docs/items/ammo.rifle.explosive.png')} style={{ width: 36, height: 36, borderRadius: 8, resizeMode: 'contain' }} /></View>
              <View style={{ flex: 1 }}>
                <Text style={st.treeName}>{(lang === 'ru' ? a.ru : a.en) + ' ×' + fmtTh(n)}</Text>
                <Text style={st.treeLine}>{lang === 'ru' ? 'крафт →' : 'craft →'}</Text>
              </View>
            </View>
            {/* ветки первого уровня */}
            <View style={st.treeBranches}>
              {rec.map((ing) => (
                <View key={ing.k} style={st.treeBranch}>
                  <View style={{ width: 3, backgroundColor: eventPalette.orange, borderRadius: 2 }} />
                  <Image source={require(ING[ing.k].icon || '../docs/items/component.box.sulfur.large.png')} style={{ width: 28, height: 28, borderRadius: 6, resizeMode: 'contain', marginLeft: 6 }} />
                  <Text style={st.branchTxt}>{ing.n + '× ' + (lang === 'ru' ? ING[ing.k].ru : ING[ing.k].en) + (ing.k === 'explo' ? ' → ' + (lang === 'ru' ? 'порох + сера + лезвие + мусор' : 'powder+ sulfur+ blade+ trash') : '')}</Text>
                </View>
              ))}
            </View>
            {/* развёрнуто взрывчатка */}
            {id === 'c4' && (
              <View style={st.treeSub}>
                <Text style={st.subHead}>{lang === 'ru' ? '→ Взрывчатка разворачивается:' : '→ Explosives expand to:'}</Text>
                {RECIPES.explo.map((ing) => (
                  <View key={ing.k} style={st.subRow}>
                    <Text style={st.subN}>{ing.n + '×'}</Text>
                    <Image source={require(ING[ing.k].icon || '../docs/items/component.box.sulfur.large.png')} style={{ width: 22, height: 22, borderRadius: 5, resizeMode: 'contain', marginRight: 6 }} />
                    <Text style={st.subName}>{lang === 'ru' ? ING[ing.k].ru : ING[ing.k].en}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}

      {/* итоговое сырье */}
      {!!usedAmmo.length && (
        <View style={st.rawTotals}>
          <Text style={st.groupTitle}>{lang === 'ru' ? 'ИТОГО СЫРЬЯ (≈)' : 'RAW TOTALS (≈)'}</Text>
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
              <Text style={st.toolName} numberOfLines={1}>
                {tool.icon ? <Image source={require(tool.icon)} style={{ width: 14, height: 14, borderRadius: 3, resizeMode: 'contain', marginRight: 3 }} /> : null}
                {lang === 'ru' ? tool.ru : tool.en}
              </Text>
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

/* ══════════════ 2. Эко-рейд ══════════════ */

export function EcoRaidScreen({ lang = 'ru' }) {
  const [tab, setTab] = useState('rec'); // rec | fast
  const [rows, setRows] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const fast = tab === 'fast';
  const calc = rows.map((r) => {
    const b = bById(r.bid);
    const hp = Math.max(1, Number(r.hp) || b.hp);
    return { ...r, b, hp, best: bestEcoTool(b, hp, fast) };
  });

  const addBuilding = (bid) => {
    const i = rows.findIndex((r) => r.bid === bid);
    if (i >= 0) {
      const next = [...rows];
      next[i] = { ...next[i], n: next[i].n + 1 };
      setRows(next);
      return;
    }
    setRows([...rows, { bid, n: 1 }]);
  };
  const changeN = (idx, d) => {
    const next = [...rows];
    const n = next[idx].n + d;
    if (n <= 0) next.splice(idx, 1); else next[idx] = { ...next[idx], n };
    setRows(next);
  };

  return (
    <GlassCard>
      {/* табы */}
      <View style={st.tabRow}>
        {[['rec', lang === 'ru' ? 'Рекомендуется' : 'Recommended'], ['fast', lang === 'ru' ? 'Самый быстрый' : 'Fastest']].map(([id, label]) => (
          <TouchableOpacity key={id} style={st.tabBtn} onPress={() => setTab(id)}>
            <Text style={[st.tabTxt, tab === id && st.tabTxtActive]}>{label}</Text>
            {tab === id && <View style={st.tabLine} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* строки построек */}
      {calc.length === 0 && (
        <Text style={st.totalEmpty}>{lang === 'ru' ? 'Добавь постройки — подберём инструмент 🔨' : 'Add buildings — we\'ll pick a tool 🔨'}</Text>
      )}
      {calc.map((r, idx) => (
        <View key={r.bid + idx} style={st.row}>
          <View style={st.rowLeft}>
            {r.b.wallIcon ? (
              <Image source={require(r.b.wallIcon)} style={{ width: 26, height: 26, borderRadius: 6, resizeMode: 'contain' }} />
            ) : (
              <Text style={st.rowIc}>{r.b.ic}</Text>
            )}
            <Text style={st.rowN}>{'×' + r.n}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.rowName} numberOfLines={1}>{lang === 'ru' ? r.b.name.ru : r.b.name.en}</Text>
            {!!r.best && (
              <Text style={st.rowBest}>
                {(lang === 'ru' ? 'Лучший вариант: ' : 'Best option: ')}
                {r.best.tool.icon ? <Image source={require(r.best.tool.icon)} style={{ width: 14, height: 14, borderRadius: 3, resizeMode: 'contain', marginRight: 2 }} /> : r.best.tool.ic}
                {' ×' + fmtTh(r.best.hits * r.n) + '  (' + fmtDurLong(r.best.time * r.n, lang) + ')'}
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

      {/* добавить / сброс */}
      <View style={st.bottomRow}>
        <TouchableOpacity style={[st.addBigBtn, pickerOpen && st.backListBtn]} onPress={() => setPickerOpen(!pickerOpen)}>
          <Text style={[st.addBigTxt, pickerOpen && st.backListTxt]}>
            {(pickerOpen ? '↓ ' : '⊕ ') + (pickerOpen
              ? (lang === 'ru' ? 'НАЗАД К СПИСКУ' : 'BACK TO LIST')
              : (lang === 'ru' ? 'ДОБАВИТЬ СТРОЕНИЯ' : 'ADD BUILDINGS'))}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.resetBigBtn} onPress={() => setRows([])}>
          <Text style={st.resetBigTxt}>🗑 {lang === 'ru' ? 'СБРОС' : 'RESET'}</Text>
        </TouchableOpacity>
      </View>

      {pickerOpen && (
        <BuildingPicker lang={lang} onPick={addBuilding} />
      )}

      <Text style={st.disclaimer}>
        {lang === 'ru'
          ? '≈ Жёсткая сторона, ваниль: удары = ХП ÷ урон инструмента, время = удары × размах. «Самый быстрый» добавляет отбойный молоток. Урон по мягкой стороне выше — числа ориентировочные, правятся в коде.'
          : '≈ Hard side, vanilla: hits = HP ÷ tool damage, time = hits × swing. "Fastest" adds the jackhammer. Soft-side damage is higher — figures are rough and editable in code.'}
      </Text>
    </GlassCard>
  );
}

/* ══════════════ 3. Кастом (боумы по строениям, живое ХП) ══════════════ */

export function CustomRaidScreen({ lang = 'ru' }) {
  const [ammoId, setAmmoId] = useState('c4');
  const [rows, setRows] = useState([]); // [{bid, hpLeft, uses}]
  const [pickerOpen, setPickerOpen] = useState(false);

  const ammo = ammoById(ammoId);

  const addBuilding = (bid) => {
    if (rows.some((r) => r.bid === bid)) return;
    const b = bById(bid);
    setRows([...rows, { bid, hpLeft: b.hp, uses: 0 }]);
  };
  const removeAt = (idx) => {
    const next = [...rows];
    next.splice(idx, 1);
    setRows(next);
  };
  // один удар выбранным боеприпасом по строению
  const applyHit = (idx) => {
    const next = [...rows];
    const r = next[idx];
    const b = bById(r.bid);
    const dmg = ammo.dmg[b.mat];
    next[idx] = { ...r, hpLeft: Math.max(0, r.hpLeft - dmg), uses: r.uses + 1 };
    setRows(next);
  };
  const resetHp = () => setRows(rows.map((r) => ({ ...r, hpLeft: bById(r.bid).hp, uses: 0 })));

  return (
    <GlassCard>
      {/* выбор боеприпаса для всех строений */}
      <View style={st.custHeadBar}>
        <Text style={st.custHeadTxt}>
          {lang === 'ru' ? 'Добавить бумы к каждому строению' : 'Apply explosives to every structure'}
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.ammoChipsRow}>
        {AMMO.map((a) => (
          <TouchableOpacity
            key={a.id}
            style={[st.ammoChip, ammoId === a.id && st.ammoChipActive]}
            onPress={() => setAmmoId(a.id)}
          >
            <Text style={{ fontSize: 15 }}>{a.ic}</Text>
            <Text style={[st.ammoChipTxt, ammoId === a.id && st.ammoChipTxtActive]}>
              {lang === 'ru' ? a.ru : a.en}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* строки строений с живым ХП */}
      {rows.length === 0 && (
        <Text style={st.totalEmpty}>{lang === 'ru' ? 'Добавь строения ↓ и жми «+ Добавить» по каждому.' : 'Add structures ↓ and tap "+ Apply" on each.'}</Text>
      )}
      {rows.map((r, idx) => {
        const b = bById(r.bid);
        const dead = r.hpLeft <= 0;
        const pct = Math.max(0, Math.round((r.hpLeft / b.hp) * 100));
        const fillColor = dead ? 'rgba(255,255,255,0.14)' : pct > 50 ? '#66bb6a' : pct > 25 ? '#e0a800' : '#ef4444';
        return (
          <View key={r.bid} style={st.custRow}>
            <View style={st.custTop}>
              <View style={st.rowLeft}>
                <Text style={st.rowIc}>{b.ic}</Text>
                <Text style={st.rowN}>{'×' + r.uses}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.rowName} numberOfLines={1}>{lang === 'ru' ? b.name.ru : b.name.en}</Text>
              </View>
              {!dead ? (
                <TouchableOpacity style={st.plusBtn} onPress={() => applyHit(idx)}>
                  <Text style={st.plusIc}>＋</Text>
                  <Text style={st.plusLbl}>{lang === 'ru' ? 'Добавить' : 'Apply'}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={st.delBtn} onPress={() => removeAt(idx)}>
                <Text style={st.delTxt}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={st.hpTrack}>
              <View style={[st.hpFill, { width: pct + '%', backgroundColor: fillColor }]} />
              <Text style={st.hpCenterTxt}>
                {dead
                  ? (lang === 'ru' ? '💥 Разрушено' : '💥 Destroyed')
                  : (lang === 'ru' ? 'Осталось ХП: ' : 'HP left: ') + fmtTh(r.hpLeft) + ' (' + pct + '%)'}
              </Text>
            </View>
          </View>
        );
      })}

      {/* добавить / сброс */}
      <View style={st.bottomRow}>
        <TouchableOpacity style={[st.addBigBtn, pickerOpen && st.backListBtn]} onPress={() => setPickerOpen(!pickerOpen)}>
          <Text style={[st.addBigTxt, pickerOpen && st.backListTxt]}>
            {(pickerOpen ? '↓ ' : '⊕ ') + (pickerOpen
              ? (lang === 'ru' ? 'НАЗАД К СПИСКУ' : 'BACK TO LIST')
              : (lang === 'ru' ? 'ДОБАВИТЬ СТРОЕНИЯ' : 'ADD BUILDINGS'))}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.resetBigBtn} onPress={resetHp}>
          <Text style={st.resetBigTxt}>🗑 {lang === 'ru' ? 'СБРОС' : 'RESET'}</Text>
        </TouchableOpacity>
      </View>

      {pickerOpen && (
        <BuildingPicker lang={lang} onPick={addBuilding} hideCustom />
      )}

      <Text style={st.disclaimer}>
        {lang === 'ru'
          ? '≈ Урон боеприпаса зависит от материала строения (жёсткая сторона, ваниль). «СБРОС» восстанавливает всем строкам полное ХП и счётчик, ✕ убирает строку. Тап «＋» — один боеприпас.'
          : '≈ Ammo damage depends on structure material (hard side, vanilla). RESET restores full HP and counters for all rows, ✕ removes a row. Each "+" tap applies one explosive.'}
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

  // пикер строений
  palette: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
  },
  searchInput: {
    color: colors.textPrimary,
    fontSize: 13,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  palGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
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
  bottomRow: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  addBigBtn: {
    flex: 2,
    alignItems: 'center',
    backgroundColor: '#f2b39a',
    borderRadius: 12,
    paddingVertical: 13,
  },
  addBigTxt: { color: '#3a2418', fontSize: 12.5, fontWeight: '900', letterSpacing: 0.3 },
  backListBtn: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  backListTxt: { color: colors.textPrimary },
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

  // кастомный рейд
  custHeadBar: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 8,
  },
  custHeadTxt: { color: colors.textSecondary, fontSize: 12.5, fontWeight: '600' },
  ammoChipsRow: { marginBottom: 10 },
  ammoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 6,
  },
  ammoChipActive: { borderColor: eventPalette.orange, backgroundColor: 'rgba(251,146,60,0.16)' },
  ammoChipTxt: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  ammoChipTxtActive: { color: eventPalette.orange },
  custRow: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 9,
    marginBottom: 8,
  },
  custTop: { flexDirection: 'row', alignItems: 'center' },
  plusBtn: { alignItems: 'center', marginRight: 8 },
  plusIc: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
    width: 34,
    height: 34,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  plusLbl: { color: colors.textSecondary, fontSize: 9, marginTop: 2 },
  hpTrack: {
    marginTop: 8,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(102,187,106,0.18)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  hpFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 6,
  },
  hpCenterTxt: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 10.5,
    fontWeight: '800',
  },

  disclaimer: {
    color: colors.textMuted,
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 8,
  },
  treeRoot: { marginBottom: 14, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  treeNode: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  treeIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(251,146,60,0.12)', justifyContent: 'center', alignItems: 'center' },
  treeName: { color: colors.textPrimary, fontSize: 13, fontWeight: '800' },
  treeLine: { color: colors.textMuted, fontSize: 10 },
  treeBranches: { marginTop: 8, paddingLeft: 6 },
  treeBranch: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  branchTxt: { color: colors.textSecondary, fontSize: 11, flex: 1 },
  treeSub: { marginTop: 6, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: eventPalette.orange, borderRadius: 4 },
  subHead: { color: eventPalette.orange, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  subRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  subN: { color: colors.textSecondary, fontSize: 10, fontWeight: '700', width: 32 },
  subName: { color: colors.textPrimary, fontSize: 11 },
});
