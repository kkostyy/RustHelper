// ─────────────────────────────────────────────────────────
// ЭКРАН 5: ДРУГОЕ — контейнер подменю из 4 разделов:
// Бинды / Настройки про игроков / Полезная информация /
// Инструменты. Навигация трёхуровневая: меню → раздел →
// конкретная тема (у «Полезной информации» и «Инструментов»
// своя сетка карточек, каждая тема — отдельный экран).
// Офлайн-справочники из data/*.js.
// ─────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { colors, eventPalette } from './theme';
import { GlassCard } from './ui';
import { useCctvFavs, toggleCctvFav } from './cctvStore';
import { USEFUL_BINDS } from './data/usefulBinds';
import { CCTV_MONUMENTS } from './data/cctvCodes';
import { MONUMENTS_GUIDE } from './data/monumentsGuide';
import { TEA_RECIPES } from './data/teaRecipes';
import { ACCESS_CARDS } from './data/accessCards';
import { WEAPON_DAMAGE } from './data/weaponDamage';
import {
  CRATE_LOOT,
  NPC_LOOT,
  SAFE_ZONE_SHOPS,
  WORKBENCH_LEVELS,
  FRAGMENT_SOURCES,
} from './data/lootTables';
import {
  RaidCalcScreen,
  CodeBreakerScreen,
  GenesScreen,
  ExtractorsScreen,
  SulfurConverterScreen,
} from './ToolsScreen';

const PRO_CONFIGS = [
  { name: 'Shatskov', sens: '3.1', dpi: '800', fov: '90', res: '1920x1080' },
  { name: 'Боб3', sens: '2.4', dpi: '400', fov: '95', res: '2560x1440' },
  { name: 'Кавик', sens: '4.0', dpi: '800', fov: '90', res: '1920x1080' },
  { name: 'Держидверь', sens: '3.6', dpi: '400', fov: '100', res: '1920x1080' },
  { name: 'Чизи', sens: '2.9', dpi: '800', fov: '90', res: '1920x1080' },
  { name: 'Cryharder', sens: '3.3', dpi: '400', fov: '95', res: '2560x1440' },
  { name: 'Shked', sens: '2.7', dpi: '800', fov: '90', res: '1920x1080' },
  { name: 'Kano', sens: '3.8', dpi: '400', fov: '90', res: '1920x1080' },
  // Ниже — значения из комьюнити, точность не гарантирована (помечены ≈)
  { name: 'Akame', sens: '3.2', dpi: '800', fov: '90', res: '1920x1080', approx: true },
  { name: 'Пофакту', sens: '2.6', dpi: '800', fov: '90', res: '1920x1080', approx: true },
  { name: 'Мисье Михоэль', sens: '3.4', dpi: '400', fov: '90', res: '1920x1080', approx: true },
];

// Универсальные пресеты из проверенных переменных консоли.
// Полные графические конфиги про-игроков публично не публикуются,
// поэтому вместо выдуманных «конфигов про» — три рабочих пресета.
const GRAPHICS_PRESETS = [
  {
    name: 'FPS (слабый ПК)',
    cmd: 'graphics.drawdistance 2000; effects.maxgibs -1; grass.displacement false; grass.on false; gc.collect',
    desc: 'Максимум кадров: меньше травы, обломков и дальности',
  },
  {
    name: 'Баланс',
    cmd: 'graphics.drawdistance 2500; effects.maxgibs -1; grass.displacement false',
    desc: 'Картинка приемлемая, FPS выше среднего',
  },
  {
    name: 'Красота (мощный ПК)',
    cmd: 'graphics.drawdistance 4000',
    desc: 'Полная дальность прорисовки, всё остальное включено',
  },
];

const SECTIONS = [
  {
    id: 'binds',
    icon: '⌨️',
    color: eventPalette.teal,
    title: { ru: 'Бинды', en: 'Binds' },
    desc: { ru: 'Полезные команды консоли для копирования', en: 'Useful console commands to copy' },
  },
  {
    id: 'pros',
    icon: '🎯',
    color: eventPalette.purple,
    title: { ru: 'Настройки про игроков', en: 'Pro Settings' },
    desc: { ru: 'Сенса, DPI, FOV известных игроков', en: 'Sens, DPI, FOV of known players' },
  },
  {
    id: 'info',
    icon: '📖',
    color: eventPalette.orange,
    title: { ru: 'Полезная информация', en: 'Useful Info' },
    desc: { ru: '9 тем: CCTV, карточки, чаи, урон, лут…', en: '9 topics: CCTV, cards, teas, damage, loot…' },
  },
  {
    id: 'tools',
    icon: '🧮',
    color: eventPalette.red,
    title: { ru: 'Инструменты', en: 'Tools' },
    desc: { ru: 'Рейд-калькулятор, конвертер серы и ещё 3', en: 'Raid calc, sulfur converter & 3 more' },
  },
];

// Темы «Полезной информации» — каждая открывается отдельным экраном
const INFO_TOPICS = [
  { id: 'cctv', icon: '📹', color: eventPalette.blue, title: { ru: 'Камеры CCTV', en: 'CCTV Cameras' }, desc: { ru: 'Коды камер на всех монументах', en: 'Camera codes for every monument' } },
  { id: 'cards', icon: '💳', color: eventPalette.green, title: { ru: 'Карточки доступа', en: 'Access Cards' }, desc: { ru: 'Зелёная → синяя → красная', en: 'Green → blue → red chains' } },
  { id: 'teas', icon: '🍵', color: eventPalette.teal, title: { ru: 'Чаи и баффы', en: 'Teas & Buffs' }, desc: { ru: 'Рецепты и эффекты', en: 'Recipes and effects' } },
  { id: 'damage', icon: '💥', color: eventPalette.red, title: { ru: 'Урон оружия', en: 'Weapon Damage' }, desc: { ru: 'Базовый урон стволов (≈)', en: 'Base gun damage (≈)' } },
  { id: 'monuments', icon: '🏭', color: eventPalette.orange, title: { ru: 'Монументы', en: 'Monuments' }, desc: { ru: 'Карты, фьюзы, радиация', en: 'Cards, fuses, radiation' } },
  { id: 'crates', icon: '📦', color: eventPalette.yellow, title: { ru: 'Лут с ящиков', en: 'Crate Loot' }, desc: { ru: 'Тиры ящиков и наполнение', en: 'Crate tiers and contents' } },
  { id: 'npc', icon: '💀', color: eventPalette.purple, title: { ru: 'Лут с NPC', en: 'NPC Loot' }, desc: { ru: 'Что падает с ученых и бандитов', en: 'What scientists & bandits drop' } },
  { id: 'safezone', icon: '🏪', color: eventPalette.blue, title: { ru: 'Магазины мирных зон', en: 'Safe-zone Shops' }, desc: { ru: 'Бандитский и научный лагерь', en: 'Bandit and Outpost camps' } },
  { id: 'workbench', icon: '🔧', color: eventPalette.green, title: { ru: 'Верстаки и чертежи', en: 'Workbenches' }, desc: { ru: 'Уровни верстаков и фрагменты', en: 'Workbench tiers and fragments' } },
];

// Инструменты — тоже отдельные экраны
const TOOL_TOPICS = [
  { id: 'raid', icon: '💣', color: eventPalette.red, title: { ru: 'Рейд-калькулятор', en: 'Raid Calculator' }, desc: { ru: 'Цели + расчёт своей стены по HP', en: 'Targets + custom wall by HP' } },
  { id: 'sulfur', icon: '🟡', color: '#e0a800', title: { ru: 'Конвертер серы', en: 'Sulfur Converter' }, desc: { ru: 'Запас серы → ракеты, C4, патроны', en: 'Sulfur stock → rockets, C4, ammo' } },
  { id: 'codebreaker', icon: '🔢', color: eventPalette.blue, title: 'Code Breaker', desc: { ru: 'Перебор кодового замка без сбоя', en: 'Door-lock code brute-force counter' } },
  { id: 'genes', icon: '🌱', color: eventPalette.green, title: { ru: 'Кросбридинг генов', en: 'Gene Crossbreeding' }, desc: { ru: 'Идеальный потомок двух растений', en: 'Best offspring of two plants' } },
  { id: 'extractors', icon: '⛏️', color: eventPalette.purple, title: { ru: 'Экстракторы', en: 'Extractors' }, desc: { ru: 'Карьеры, вышка, водяной насос', en: 'Quarries, pump jack, water pump' } },
];

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const onPress = () => {
    Clipboard.setString(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <TouchableOpacity style={styles.copyBtn} onPress={onPress}>
      <Text style={styles.copyBtnTxt}>{copied ? '✓' : '📋'}</Text>
    </TouchableOpacity>
  );
}

function CopyRow({ cmd, desc }) {
  return (
    <View style={styles.copyRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.copyCmd} numberOfLines={1}>
          {cmd}
        </Text>
        {!!desc && <Text style={styles.copyDesc}>{desc}</Text>}
      </View>
      <CopyButton value={cmd} />
    </View>
  );
}

// Сетка карточек второго уровня (общая для info/tools)
function TopicGrid({ topics, onPick, lang }) {
  return (
    <View style={styles.menuGrid}>
      {topics.map((sec) => (
        <TouchableOpacity
          key={sec.id}
          style={[styles.menuCard, { borderColor: sec.color + '30', backgroundColor: sec.color + '14' }]}
          onPress={() => onPick(sec.id)}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 24 }}>{sec.icon}</Text>
          <Text style={styles.menuTitle}>{lang === 'ru' ? sec.title.ru : sec.title.en}</Text>
          {!!sec.desc && (
            <Text style={styles.menuDesc}>{lang === 'ru' ? sec.desc.ru : sec.desc.en}</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ───── Другое → Бинды ─────
function BindsScreen({ lang }) {
  return (
    <GlassCard>
      <Text style={styles.screenTitle}>{lang === 'ru' ? 'Полезные бинды' : 'Useful Binds'}</Text>
      {USEFUL_BINDS.map((group) => (
        <View key={group.group} style={{ marginBottom: 12 }}>
          <Text style={styles.groupTitle}>{group.group}</Text>
          {group.items.map((item) => (
            <CopyRow key={item.cmd} cmd={item.cmd} desc={item.desc} />
          ))}
        </View>
      ))}
    </GlassCard>
  );
}

// ───── Другое → Настройки про игроков ─────
function ProConfigsScreen({ lang }) {
  return (
    <GlassCard>
      <Text style={styles.screenTitle}>{lang === 'ru' ? 'Настройки про игроков' : 'Pro Settings'}</Text>
      <Text style={styles.disclaimer}>
        {lang === 'ru'
          ? 'Конфиги для копирования одной кнопкой. Сенса указана по внутриигровой шкале. Записи с «≈» собраны из комьюнити и могут отличаться от реальных настроек игрока.'
          : 'One-tap copy configs. Sensitivity uses the in-game scale. Entries marked "≈" are community-sourced and may differ from the player\'s actual settings.'}
      </Text>

      <Text style={styles.groupTitle}>
        {lang === 'ru' ? 'Пресеты графики' : 'Graphics presets'}
      </Text>
      <Text style={styles.copyDesc}>
        {lang === 'ru'
          ? 'Полные графические конфиги про-игроков публично не публикуются — ниже универсальные пресеты из проверенных команд консоли.'
          : 'Full pro graphics configs are not published publicly — below are universal presets built from proven console commands.'}
      </Text>
      {GRAPHICS_PRESETS.map((g) => (
        <View key={g.name} style={styles.copyRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.proName}>{g.name}</Text>
            <Text style={styles.copyDesc}>{g.desc}</Text>
            <Text style={styles.copyCmd} numberOfLines={2}>
              {g.cmd}
            </Text>
          </View>
          <CopyButton value={g.cmd} />
        </View>
      ))}

      <Text style={[styles.groupTitle, { marginTop: 14 }]}>
        {lang === 'ru' ? 'Сенса и DPI игроков' : 'Player sens & DPI'}
      </Text>
      {PRO_CONFIGS.map((p) => {
        const configString = `sens ${p.sens}; dpi ${p.dpi}; fov ${p.fov}; res ${p.res}`;
        return (
          <View key={p.name} style={styles.proCard}>
            <View style={styles.proHeader}>
              <Text style={styles.proName}>{p.approx ? '≈ ' : ''}{p.name}</Text>
              <CopyButton value={configString} />
            </View>
            <Text style={styles.proMeta}>
              Sens {p.sens} · DPI {p.dpi} · FOV {p.fov} · {p.res}
            </Text>
          </View>
        );
      })}
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════
// Полезная информация: 9 отдельных экранов
// ═══════════════════════════════════════════════════════════

// Строка камеры CCTV: код + описание + звезда избранного + копия
function CctvRow({ lang, code, desc }) {
  const favs = useCctvFavs();
  const isFav = favs.indexOf(code) >= 0;
  return (
    <View style={styles.copyRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.copyCmd} numberOfLines={1}>
          {code}
        </Text>
        {!!desc && <Text style={styles.copyDesc}>{desc}</Text>}
      </View>
      <TouchableOpacity
        style={styles.starBtn}
        onPress={() => toggleCctvFav(code)}
        activeOpacity={0.7}
      >
        <Text style={[styles.starTxt, isFav && styles.starTxtOn]}>
          {isFav ? '★' : '☆'}
        </Text>
      </TouchableOpacity>
      <CopyButton value={code} />
    </View>
  );
}

function CctvInfo({ lang }) {
  const favs = useCctvFavs();
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();

  // Избранное сверху — плоский список с монументом в подписи
  const allCameras = CCTV_MONUMENTS.flatMap((mon) =>
    mon.codes.map((c) => ({ ...c, mon: mon.name })),
  );
  const favRows = allCameras.filter((c) => favs.indexOf(c.code) >= 0);

  // Поиск по коду / описанию / монументу; пустой запрос — весь каталог
  const groups = CCTV_MONUMENTS.map((mon) => ({
    ...mon,
    codes: mon.codes.filter(
      (c) => !needle || (c.code + ' ' + c.desc + ' ' + mon.name).toLowerCase().includes(needle),
    ),
  })).filter((mon) => mon.codes.length > 0);

  return (
    <GlassCard>
      <Text style={styles.screenTitle}>{lang === 'ru' ? '📹 Камеры CCTV' : '📹 CCTV Cameras'}</Text>
      <Text style={styles.disclaimer}>
        {lang === 'ru'
          ? 'Коды фиксированы разработчиками и не меняются между вайпами. Введите код в Computer Station в игре. Звезда — в избранное.'
          : 'Codes are fixed by the devs and do not change between wipes. Enter them at a Computer Station in game. Star adds to favorites.'}
      </Text>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder={lang === 'ru' ? '🔍 Поиск по камерам...' : '🔍 Search cameras...'}
        placeholderTextColor="rgba(255,255,255,0.3)"
        style={styles.infoSearch}
      />
      {favRows.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.groupTitle}>
            ⭐ {lang === 'ru' ? 'Избранные камеры' : 'Favorite cameras'}
          </Text>
          {favRows.map((c) => (
            <CctvRow key={`fav-${c.code}`} lang={lang} code={c.code} desc={`${c.mon} · ${c.desc}`} />
          ))}
        </View>
      )}
      {groups.length === 0 && (
        <Text style={styles.disclaimer}>{lang === 'ru' ? 'Ничего не найдено.' : 'Nothing found.'}</Text>
      )}
      {groups.map((mon) => (
        <View key={mon.name} style={{ marginBottom: 12 }}>
          <Text style={styles.groupTitle}>{mon.name}</Text>
          {mon.codes.map((c) => (
            <CctvRow key={c.code} lang={lang} code={c.code} desc={c.desc} />
          ))}
        </View>
      ))}
    </GlassCard>
  );
}

function CardsInfo({ lang }) {
  return (
    <GlassCard>
      <Text style={styles.screenTitle}>{lang === 'ru' ? '💳 Карточки доступа' : '💳 Access Cards'}</Text>
      <Text style={styles.disclaimer}>
        {lang === 'ru'
          ? 'Классические цепочки паззлов: зелёная ведёт к синей, синяя — к красной. Цепочки стабильны между вайпами, но при ребалансе монументов сверяй заново.'
          : 'Classic puzzle chains: green leads to blue, blue leads to red. Chains are stable between wipes, but re-check after monument rebalances.'}
      </Text>
      {ACCESS_CARDS.map((card) => (
        <View key={card.id} style={styles.monCard}>
          <Text style={[styles.proName, { color: card.color }]}>
            {card.icon} {card.name}
          </Text>
          <Text style={styles.copyDesc}>
            {lang === 'ru' ? 'Где искать' : 'Where to find'}: {card.spawn}
          </Text>
          <Text style={styles.copyDesc}>
            {lang === 'ru' ? 'Открывает' : 'Opens'}: {card.doors}
          </Text>
          <Text style={styles.proMeta}>
            🔌 {card.fuse}
          </Text>
          <Text style={[styles.copyDesc, { marginTop: 6, fontStyle: 'italic' }]}>💡 {card.tip}</Text>
        </View>
      ))}
    </GlassCard>
  );
}

function TeasInfo({ lang }) {
  return (
    <GlassCard>
      <Text style={styles.screenTitle}>{lang === 'ru' ? '🍵 Чаи и баффы' : '🍵 Teas & Buffs'}</Text>
      <Text style={styles.disclaimer}>
        {lang === 'ru'
          ? 'Проценты и длительность — приблизительные (≈), разработчики регулярно правят баланс чаёв. Сверяй на актуальном патче.'
          : 'Percentages and durations are approximate (≈) — devs rebalance teas regularly. Verify on the current patch.'}
      </Text>
      {TEA_RECIPES.map((tea) => (
        <View key={tea.id} style={styles.monCard}>
          <Text style={styles.proName}>
            {tea.icon} {tea.name}
          </Text>
          <Text style={styles.proMeta}>{tea.effect}</Text>
          <Text style={styles.proMeta}>≈ {tea.bonus.replace('≈ ', '')}</Text>
          <Text style={[styles.copyDesc, { marginTop: 4, fontStyle: 'italic' }]}>💡 {tea.note}</Text>
        </View>
      ))}
    </GlassCard>
  );
}

function DamageInfo({ lang }) {
  return (
    <GlassCard>
      <Text style={styles.screenTitle}>{lang === 'ru' ? '💥 Урон оружия' : '💥 Weapon Damage'}</Text>
      <Text style={styles.disclaimer}>
        {lang === 'ru'
          ? 'Базовый урон в тело без брони, ≈ по ванильному балансу. Броня снижает урон неравномерно по зонам тела, цифры — только ориентир для выбора ствола.'
          : 'Base body damage without armor, ≈ vanilla balance. Armor reduces damage unevenly across body zones — these are just guidelines for picking a gun.'}
      </Text>
      {WEAPON_DAMAGE.map((w) => (
        <View key={w.name} style={styles.monCard}>
          <View style={styles.proHeader}>
            <Text style={styles.proName}>{w.name}</Text>
            <Text style={[styles.proName, { color: eventPalette.orange }]}>{w.dmg}</Text>
          </View>
          <Text style={styles.copyDesc}>💡 {w.note}</Text>
        </View>
      ))}
    </GlassCard>
  );
}

function MonumentsInfo({ lang }) {
  return (
    <GlassCard>
      <Text style={styles.screenTitle}>{lang === 'ru' ? '🏭 Монументы: карты и фьюзы' : '🏭 Monuments: cards & fuses'}</Text>
      <Text style={styles.disclaimer}>
        {lang === 'ru'
          ? 'Цепочки карт доступа: зелёная открывает дверь с синей, синяя — с красной. Сверено на июль-август 2026.'
          : 'Card chains: green opens the door behind blue, blue — behind red. Checked July–August 2026.'}
      </Text>
      {MONUMENTS_GUIDE.map((m) => (
        <View key={m.name} style={styles.monCard}>
          <Text style={styles.proName}>{m.name}</Text>
          <Text style={styles.proMeta}>
            {lang === 'ru' ? 'Карты' : 'Cards'}: {m.cards}
          </Text>
          <Text style={styles.proMeta}>
            {lang === 'ru' ? 'Фьюзы' : 'Fuses'}: {m.fuses}
          </Text>
          <Text style={styles.proMeta}>
            {lang === 'ru' ? 'Радиация' : 'Radiation'}: {m.radiation}
          </Text>
          {!!m.note && <Text style={styles.copyDesc}>{m.note}</Text>}
          {!!m.loot && (
            <Text style={[styles.copyDesc, { marginTop: 4 }]}>🎁 {m.loot}</Text>
          )}
        </View>
      ))}
    </GlassCard>
  );
}

function CratesInfo({ lang }) {
  return (
    <GlassCard>
      <Text style={styles.screenTitle}>{lang === 'ru' ? '📦 Лут с ящиков' : '📦 Crate Loot'}</Text>
      <Text style={styles.disclaimer}>
        {lang === 'ru'
          ? 'Тиры ящиков стабильны между вайпами; наполнение может правиться патчами баланса — после крупных апдейтов сверяй заново.'
          : 'Crate tiers are stable between wipes; contents may be rebalanced in patches — re-check after major updates.'}
      </Text>
      {CRATE_LOOT.map((c) => (
        <View key={c.name} style={styles.monCard}>
          <View style={styles.proHeader}>
            <Text style={styles.proName}>{c.name}</Text>
            <Text style={[styles.proName, { color: eventPalette.orange }]}>{c.tag}</Text>
          </View>
          <Text style={[styles.copyDesc, { marginTop: 4 }]}>📦 {c.loot}</Text>
          <Text style={[styles.copyDesc, { marginTop: 4, fontStyle: 'italic' }]}>💡 {c.note}</Text>
        </View>
      ))}
    </GlassCard>
  );
}

function NpcInfo({ lang }) {
  return (
    <GlassCard>
      <Text style={styles.screenTitle}>{lang === 'ru' ? '💀 Лут с NPC' : '💀 NPC Loot'}</Text>
      {NPC_LOOT.map((n) => (
        <View key={n.name} style={styles.monCard}>
          <Text style={styles.proName}>{n.name}</Text>
          <Text style={[styles.copyDesc, { marginTop: 4 }]}>💀 {n.loot}</Text>
        </View>
      ))}
    </GlassCard>
  );
}

function SafezoneInfo({ lang }) {
  return (
    <GlassCard>
      <Text style={styles.screenTitle}>{lang === 'ru' ? '🏪 Магазины мирных зон' : '🏪 Safe-zone Shops'}</Text>
      <Text style={styles.disclaimer}>
        {lang === 'ru'
          ? 'Цены — базовые ванильные, сервер может менять торговлю модами.'
          : 'Prices are vanilla defaults — modded servers can change trading.'}
      </Text>
      {SAFE_ZONE_SHOPS.map((s) => (
        <View key={s.store} style={styles.monCard}>
          <Text style={styles.proName}>{s.store}</Text>
          {s.items.map((it) => (
            <Text key={it.name} style={[styles.copyDesc, { marginTop: 3 }]}>
              • {it.name} — {it.price}
            </Text>
          ))}
        </View>
      ))}
    </GlassCard>
  );
}

function WorkbenchInfo({ lang }) {
  return (
    <GlassCard>
      <Text style={styles.screenTitle}>{lang === 'ru' ? '🔧 Верстаки и чертежи' : '🔧 Workbenches & blueprints'}</Text>
      {WORKBENCH_LEVELS.map((w) => (
        <View key={w.level} style={styles.monCard}>
          <Text style={styles.proName}>
            {lang === 'ru' ? `Верстак T${w.level}` : `Workbench T${w.level}`}
          </Text>
          <Text style={[styles.copyDesc, { marginTop: 4 }]}>{w.req}</Text>
        </View>
      ))}
      <Text style={[styles.groupTitle, { marginTop: 12 }]}>
        {lang === 'ru' ? 'Где брать фрагменты чертежей' : 'Where to find blueprint fragments'}
      </Text>
      {FRAGMENT_SOURCES.map((f) => (
        <View key={f.name} style={styles.copyRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.copyDesc}>{f.name}</Text>
          </View>
          <Text style={[styles.proMeta, { color: eventPalette.teal }]}>{f.tag}</Text>
        </View>
      ))}
    </GlassCard>
  );
}

const INFO_SCREENS = {
  cctv: CctvInfo,
  cards: CardsInfo,
  teas: TeasInfo,
  damage: DamageInfo,
  monuments: MonumentsInfo,
  crates: CratesInfo,
  npc: NpcInfo,
  safezone: SafezoneInfo,
  workbench: WorkbenchInfo,
};

const TOOL_SCREENS = {
  raid: RaidCalcScreen,
  sulfur: SulfurConverterScreen,
  codebreaker: CodeBreakerScreen,
  genes: GenesScreen,
  extractors: ExtractorsScreen,
};

// Кнопка «назад» внутри подменю
function BackBtn({ lang, label, onPress }) {
  return (
    <TouchableOpacity style={styles.backBtn} onPress={onPress}>
      <Text style={styles.backBtnTxt}>← {label || (lang === 'ru' ? 'Назад' : 'Back')}</Text>
    </TouchableOpacity>
  );
}

export default function OtherScreen({ lang, t }) {
  // sub: null | 'binds' | 'pros' | 'info' | 'tools'; topic: id темы внутри info/tools
  const [sub, setSub] = useState(null);
  const [topic, setTopic] = useState(null);

  // ── Главное меню ──
  if (!sub) {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.menuGrid}>
          {SECTIONS.map((sec) => (
            <TouchableOpacity
              key={sec.id}
              style={[styles.menuCard, { borderColor: sec.color + '30', backgroundColor: sec.color + '14' }]}
              onPress={() => setSub(sec.id)}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 24 }}>{sec.icon}</Text>
              <Text style={styles.menuTitle}>{t(sec.title)}</Text>
              <Text style={styles.menuDesc}>{t(sec.desc)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  // ── Меню тем «Полезной информации» ──
  if (sub === 'info' && !topic) {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <BackBtn lang={lang} onPress={() => setSub(null)} />
        <TopicGrid topics={INFO_TOPICS} onPick={setTopic} lang={lang} />
      </ScrollView>
    );
  }

  // ── Конкретная тема инфо ──
  if (sub === 'info' && topic && INFO_SCREENS[topic]) {
    const Screen = INFO_SCREENS[topic];
    const meta = INFO_TOPICS.find((x) => x.id === topic);
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <BackBtn
          lang={lang}
          label={(lang === 'ru' ? 'Полезная информация · ' : 'Useful Info · ') + t(meta.title)}
          onPress={() => setTopic(null)}
        />
        <Screen lang={lang} />
      </ScrollView>
    );
  }

  // ── Меню инструментов ──
  if (sub === 'tools' && !topic) {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <BackBtn lang={lang} onPress={() => setSub(null)} />
        <TopicGrid topics={TOOL_TOPICS} onPick={setTopic} lang={lang} />
      </ScrollView>
    );
  }

  // ── Конкретный инструмент ──
  if (sub === 'tools' && topic && TOOL_SCREENS[topic]) {
    const Screen = TOOL_SCREENS[topic];
    const meta = TOOL_TOPICS.find((x) => x.id === topic);
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <BackBtn
          lang={lang}
          label={(lang === 'ru' ? 'Инструменты · ' : 'Tools · ') + t(meta.title)}
          onPress={() => setTopic(null)}
        />
        <Screen lang={lang} />
      </ScrollView>
    );
  }

  // ── Простые разделы без тем ──
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <BackBtn lang={lang} onPress={() => setSub(null)} />
      {sub === 'binds' && <BindsScreen lang={lang} />}
      {sub === 'pros' && <ProConfigsScreen lang={lang} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  menuCard: {
    width: '47%',
    flexGrow: 1,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  menuTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '700', marginTop: 10, lineHeight: 18 },
  menuDesc: { color: colors.textMuted, fontSize: 10, marginTop: 4, lineHeight: 14 },
  backBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  backBtnTxt: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  screenTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  groupTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
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
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 11,
    marginBottom: 6,
  },
  copyCmd: { color: eventPalette.blue, fontSize: 12.5, fontFamily: 'monospace' },
  copyDesc: { color: colors.textMuted, fontSize: 10.5, marginTop: 2 },
  copyBtn: {
    backgroundColor: 'rgba(96,165,250,0.22)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginLeft: 10,
  },
  copyBtnTxt: { fontSize: 13 },
  starBtn: { paddingHorizontal: 8, paddingVertical: 5, marginLeft: 10 },
  starTxt: { fontSize: 17, color: colors.textMuted },
  starTxtOn: { color: '#fbbf24' },
  infoSearch: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 12.5,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 12,
  },
  proCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  proHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  proName: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  proMeta: { color: colors.textSecondary, fontSize: 11.5, marginTop: 3 },
  monCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
});
