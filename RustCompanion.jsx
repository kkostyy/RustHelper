import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Map as MapIcon,
  Database,
  MessageSquare,
  Bell,
  Clock,
  Globe,
  Send,
  Calculator,
  Minus,
  Plus,
  LayoutGrid,
  Lightbulb,
  RotateCw,
  Sliders,
  BookOpen,
  Coffee,
  Key,
  Power,
  Video,
  Radio,
  Store,
  RefreshCw,
  Layers,
  Wifi,
  WifiOff,
  ScrollText,
  Hammer,
  FlaskConical,
  ShoppingBag,
  Activity,
  Terminal,
  Crosshair,
  Copy,
  Check,
  AlarmClock,
  ChevronLeft,
  ChevronRight,
  Home,
  Ship,
  Plane,
  Package,
  Fuel,
  Sprout,
  Lock,
  Flame,
} from "lucide-react";

// ─────────────────────────────────────────────────────────
// DESIGN TOKENS — Apple-widget style liquid glass
// soft frosted cards, colored icon chips, system typography
// ─────────────────────────────────────────────────────────
const accent = {
  blue: "#0A84FF",
  orange: "#FF9F0A",
  green: "#30D158",
  red: "#FF453A",
  purple: "#BF5AF2",
  teal: "#64D2FF",
  yellow: "#FFD60A",
  pink: "#FF375F",
  gray: "#98989D",
};

const fontStack =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Inter', ui-sans-serif, system-ui, sans-serif";

const pageStyle = {
  minHeight: "100vh",
  width: "100%",
  color: "#f2f2f7",
  fontFamily: fontStack,
  background:
    "radial-gradient(circle at 20% -10%, rgba(10,132,255,0.16) 0%, transparent 42%), radial-gradient(circle at 90% 10%, rgba(191,90,242,0.10) 0%, transparent 40%), radial-gradient(circle at 50% 120%, rgba(48,209,88,0.08) 0%, transparent 45%), linear-gradient(180deg, #101014 0%, #08080b 60%, #050506 100%)",
};

const glassStyle = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.07)",
  backdropFilter: "blur(28px)",
  WebkitBackdropFilter: "blur(28px)",
  boxShadow: "0 16px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)",
};

function GlassCard({ children, className = "", style = {}, ...rest }) {
  return (
    <div {...rest} style={{ ...glassStyle, ...style }} className={"rounded-[28px] " + className}>
      {children}
    </div>
  );
}

function IconChip({ icon: Icon, color = accent.blue, size = 34 }) {
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        background: `linear-gradient(160deg, ${color}, ${color}cc)`,
        boxShadow: `0 4px 12px ${color}55`,
      }}
    >
      <Icon size={size * 0.52} color="#fff" strokeWidth={2.2} />
    </div>
  );
}

function SectionHeader({ icon, title, color = accent.blue }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <IconChip icon={icon} color={color} size={28} />
      <span className="text-[15px] font-semibold tracking-tight" style={{ color: "rgba(242,242,247,0.94)" }}>
        {title}
      </span>
    </div>
  );
}

// small reusable "copy to clipboard" pill used by Binds & Pro Configs
function CopyPill({ value, copied, onCopy, lang }) {
  return (
    <button
      onClick={() => onCopy(value)}
      className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10.5px] font-semibold transition-all"
      style={{
        background: copied ? "rgba(48,209,88,0.16)" : "rgba(255,255,255,0.07)",
        border: copied ? `1px solid ${accent.green}` : "1px solid rgba(255,255,255,0.12)",
        color: copied ? accent.green : "rgba(255,255,255,0.65)",
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? (lang === "ru" ? "Скопировано" : "Copied") : (lang === "ru" ? "Копировать" : "Copy")}
    </button>
  );
}

// generic segmented control (raid modes, resources, furnace counts...)
function Segmented({ options, value, onChange, color = accent.blue }) {
  return (
    <div className="flex gap-2">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className="flex-1 py-1.5 px-2 rounded-full text-xs font-medium transition-all whitespace-nowrap"
            style={{
              background: active ? `${color}26` : "rgba(255,255,255,0.04)",
              border: `1px solid ${active ? color : "rgba(255,255,255,0.08)"}`,
              color: active ? color : "rgba(255,255,255,0.6)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function StepperButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="w-7 h-7 rounded-full flex items-center justify-center bg-white/8"
      style={{ border: "1px solid rgba(255,255,255,0.1)" }}
    >
      {children}
    </button>
  );
}

// labeled numeric input used by calculators (rates, fuel, hours...)
function NumField({ label, value, onChange, suffix = "", step = 1, min = 0, color = accent.blue }) {
  return (
    <div className="flex-1 min-w-[110px]">
      <p className="text-[10px] mb-1" style={{ color: "rgba(242,242,247,0.45)" }}>{label}</p>
      <div className="flex items-center gap-1.5 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          onChange={(e) => onChange(Number(e.target.value))}
          className="bg-transparent outline-none w-full text-sm font-semibold"
          style={{ color }}
        />
        {suffix && <span className="text-[10px] shrink-0" style={{ color: "rgba(242,242,247,0.4)" }}>{suffix}</span>}
      </div>
    </div>
  );
}

function fmtDuration(sec) {
  if (sec < 90) return `${Math.round(sec)} сек`;
  const m = Math.round(sec / 60);
  if (m < 90) return `${m} мин`;
  const h = sec / 3600;
  if (h < 36) return `${h.toFixed(1)} ч`;
  return `${(h / 24).toFixed(1)} сут`;
}

// ─────────────────────────────────────────────────────────
// Данные
// ─────────────────────────────────────────────────────────
const serverInfo = {
  name: "Rustoria.co — EU East Long",
  players: "175/200",
  queue: 0,
  time: "12:07",
  lastWipe: { ru: "12 дней назад", en: "12 days ago" },
  seed: "procedural_4750_eKKZRx0kWn0Nfr3I",
  mapSize: "5K",
};

// тимейты: координаты x/y используются мини-картой и полной картой
const teamMembers = [
  { id: 1, name: "Boris", color: accent.blue, x: 38, y: 34, online: true, alive: true },
  { id: 2, name: "Sanya_Rust", color: accent.green, x: 57, y: 58, online: true, alive: true },
  { id: 3, name: "Kirill", color: accent.purple, x: 30, y: 74, online: false, alive: true },
];

const mapEvents = [
  { id: "heli", icon: Crosshair, label: { ru: "Патрульный вертолёт", en: "Patrol Helicopter" }, x: 68, y: 22, color: accent.red },
  { id: "cargo", icon: Ship, label: { ru: "Cargo Ship", en: "Cargo Ship" }, x: 24, y: 70, color: accent.teal },
  { id: "chinook", icon: Plane, label: { ru: "Чинук", en: "Chinook" }, x: 52, y: 46, color: accent.orange },
  { id: "drop", icon: Package, label: { ru: "Аирдроп", en: "Airdrop" }, x: 80, y: 62, color: accent.yellow },
];

const chatLog = [
  { author: "Boris", ru: "видел кого-то у карьера камня", en: "saw someone at rock quarry", mine: false },
  { author: "Sanya_Rust", ru: "принял, иду проверить", en: "copy, going to check", mine: false },
];

const sampleAlarms = [
  { id: 1, time: "11:42", important: true, text: { ru: "Сработал Smart Alarm на базе (сектор G4)", en: "Smart Alarm triggered at Base (sector G4)" } },
  { id: 2, time: "09:15", important: false, text: { ru: "Турель #1 перезаряжена", en: "Turret #1 reloaded" } },
  { id: 3, time: "08:03", important: false, text: { ru: "Cargo Ship прибыл на карту", en: "Cargo Ship entered the map" } },
];

const raidTargets = [
  { id: "wooden_door", name: { ru: "Деревянная дверь", en: "Wooden Door" }, hp: 250, c4: 1, rockets: 2, satchels: 5, ammo: 90 },
  { id: "stone_wall", name: { ru: "Каменная стена", en: "Stone Wall" }, hp: 500, c4: 2, rockets: 4, satchels: 10, ammo: 180 },
  { id: "sheet_wall", name: { ru: "Металлическая стена", en: "Sheet Metal Wall" }, hp: 500, c4: 4, rockets: 8, satchels: 22, ammo: 400 },
  { id: "armored_wall", name: { ru: "Бронированная стена", en: "Armored Wall" }, hp: 1000, c4: 8, rockets: 15, satchels: 46, ammo: 800 },
  { id: "garage_door", name: { ru: "Гаражные ворота", en: "Garage Door" }, hp: 600, c4: 1, rockets: 3, satchels: 9, ammo: 150 },
];

// Эко-рейд: мягкая сторона инструментами (значения ≈, зависят от апдейтов)
const ecoMethods = {
  wooden_door: { tool: { ru: "Топор / копьё по мягкой стороне", en: "Hatchet / spear on soft side" }, time: "~2 мин" },
  stone_wall: { tool: { ru: "Джекхаммер / кирка по мягкой стороне", en: "Jackhammer / pickaxe on soft side" }, time: "~15 мин" },
  sheet_wall: { tool: { ru: "Джекхаммер (много топлива)", en: "Jackhammer (fuel-hungry)" }, time: "~35 мин" },
  armored_wall: { tool: { ru: "Эко не вывозит — только C4/ракеты", en: "Eco won't cut it — C4/rockets only" }, time: "—" },
  garage_door: { tool: { ru: "Сатчели или джекхаммер", en: "Satchels or jackhammer" }, time: "~9 сатчелов" },
};

// Кастомный рейд: примерный урон по постройкам (зависит от материала)
const explosiveTypes = [
  { id: "c4", label: "C4", dmg: 550, color: accent.red },
  { id: "rocket", label: { ru: "Ракета", en: "Rocket" }, dmg: 350, color: accent.orange },
  { id: "sat", label: { ru: "Сатчел", en: "Satchel" }, dmg: 90, color: accent.green },
  { id: "bean", label: { ru: "Бинкан", en: "Beancan" }, dmg: 60, color: accent.teal },
  { id: "ammo", label: { ru: "Взр. патроны", en: "Expl. ammo" }, dmg: 30, color: accent.blue },
];

const recyclerItems = [
  { id: "gears", name: { ru: "Шестерня (Gears)", en: "Gears" }, scrap: 10, metal: 25 },
  { id: "pipes", name: { ru: "Металлическая труба (Metal Pipe)", en: "Metal Pipe" }, scrap: 5, metal: 10 },
  { id: "spring", name: { ru: "Пружина (Spring)", en: "Spring" }, scrap: 10, HQM: 1, metal: 15 },
  { id: "smg_body", name: { ru: "Корпус SMG (SMG Body)", en: "SMG Body" }, scrap: 15, HQM: 2, metal: 50 },
  { id: "rif_body", name: { ru: "Корпус винтовки (Rifle Body)", en: "Rifle Body" }, scrap: 25, HQM: 2, metal: 75 },
  { id: "blades", name: { ru: "Лезвия (Metal Blades)", en: "Metal Blades" }, scrap: 2, metal: 15 },
  { id: "tech_trash", name: { ru: "Техно-мусор (Tech Trash)", en: "Tech Trash" }, scrap: 8, HQM: 1, metal: 20 },
];

const initialSmartDevices = [
  { id: 1, name: "Auto Turret #1 (Compound)", type: "turret", active: true, ammo: 120 },
  { id: 2, name: "Main Door Switch", type: "switch", active: true, power: "10 rWm" },
  { id: 3, name: "Alarm Siren (Core)", type: "alarm", active: false, power: "5 rWm" },
];

const initialCameras = [
  { id: 1, name: "База — ворота", online: true },
  { id: 2, name: "Ядро — сейфовая комната", online: true },
  { id: 3, name: "Ферма — крыша", online: false },
];

const queueHistory = [
  { h: "00:00", queue: 0, ping: 38 },
  { h: "04:00", queue: 0, ping: 35 },
  { h: "08:00", queue: 3, ping: 41 },
  { h: "12:00", queue: 22, ping: 52 },
  { h: "16:00", queue: 47, ping: 60 },
  { h: "18:00", queue: 61, ping: 58 },
  { h: "20:00", queue: 38, ping: 49 },
  { h: "23:00", queue: 9, ping: 40 },
];

const restartSchedule = [
  { label: { ru: "Плановый вайп-рестарт", en: "Scheduled wipe restart" }, when: { ru: "Четверг, 19:00 МСК", en: "Thursday, 19:00 MSK" }, tag: { ru: "Плановый", en: "Scheduled" }, color: accent.blue },
  { label: { ru: "Форс-вайп (античит апдейт)", en: "Force wipe (anti-cheat update)" }, when: { ru: "По объявлению админов", en: "Announced by admins" }, tag: { ru: "Возможный", en: "Possible" }, color: accent.orange },
];

const queueAlertPresets = [10, 20, 50];

const rustBindsCategories = [
  {
    id: "audio",
    title: { ru: "Аудио и хедшоты", en: "Audio & Headshots" },
    color: accent.teal,
    binds: [
      { cmd: "audio.game 0.22", desc: { ru: "Снизить общую громкость игры", en: "Lower overall game volume" } },
      { cmd: "audio.master 1.5", desc: { ru: "Поднять общую громкость вывода", en: "Boost master output volume" } },
      { cmd: "audio.ambient 0", desc: { ru: "Отключить фоновые звуки окружения", en: "Mute ambient background sound" } },
      { cmd: "audio.footsteps.volume 3", desc: { ru: "Усилить звук шагов противников", en: "Boost enemy footstep volume" } },
    ],
  },
  {
    id: "zoom",
    title: { ru: "Зум и прицеливание", en: "Zoom & Aiming" },
    color: accent.blue,
    binds: [
      { cmd: "bind mouse3 +zoom.in", desc: { ru: "Бинд быстрого приближения экрана", en: "Bind quick screen zoom-in" } },
      { cmd: "graphics.hud_reticle_scale 0.8", desc: { ru: "Уменьшить размер прицела", en: "Shrink crosshair size" } },
      { cmd: "bind h holster", desc: { ru: "Скрыть худ при прицеливании", en: "Hide HUD while aiming" } },
    ],
  },
  {
    id: "fps",
    title: { ru: "Оптимизация FPS", en: "FPS Optimization" },
    color: accent.orange,
    binds: [
      { cmd: "graphics.drawdistance 2500", desc: { ru: "Ограничить дальность прорисовки", en: "Limit draw distance" } },
      { cmd: "grass.on false", desc: { ru: "Временно отключить траву", en: "Disable grass temporarily" } },
      { cmd: "effects.maxgibs -1", desc: { ru: "Отключить лишние частицы разрушений", en: "Disable extra gib particles" } },
      { cmd: "gc.collect", desc: { ru: "Принудительная очистка памяти", en: "Force garbage collection" } },
    ],
  },
  {
    id: "utility",
    title: { ru: "Управление и обзор", en: "Controls & Utility" },
    color: accent.purple,
    binds: [
      { cmd: "client.lookatradius 2.5", desc: { ru: "Радиус взаимодействия с объектами", en: "Interaction reach radius" } },
      { cmd: "bind f1 consoletoggle", desc: { ru: "Быстрый доступ к консоли/комбатлогу", en: "Quick access to console/combatlog" } },
      { cmd: "bind k \"kill;respawn_sleepingbag\"", desc: { ru: "Мгновенный респавн на спальнике", en: "Instant respawn on sleeping bag" } },
    ],
  },
];

// ВАЖНО: значения ниже — примерный шаблон карточки для наполнения
// реальными настройками; это НЕ подтверждённые официальные данные.
const proConfigs = [
  { name: "Shatskov", sens: "3.1", dpi: "800", fov: "90", res: "1920x1080" },
  { name: "Боб3", sens: "2.4", dpi: "400", fov: "95", res: "2560x1440" },
  { name: "Кавик", sens: "4.0", dpi: "800", fov: "90", res: "1920x1080" },
  { name: "Держидверь", sens: "3.6", dpi: "400", fov: "100", res: "1920x1080" },
  { name: "Чизи", sens: "2.9", dpi: "800", fov: "90", res: "1920x1080" },
  { name: "Cryharder", sens: "3.3", dpi: "400", fov: "95", res: "2560x1440" },
  { name: "Shked", sens: "2.7", dpi: "800", fov: "90", res: "1920x1080" },
  { name: "Kano", sens: "3.8", dpi: "400", fov: "90", res: "1920x1080" },
];

// Лут с ящиков и контейнеров (для «Полезной информации»)
const crateLoot = [
  { name: { ru: "Военный ящик", en: "Military Crate" }, tag: { ru: "Тир 3", en: "Tier 3" }, loot: { ru: "LR-300, SAR, M39, MP5, 8x зум, патроны, HQM, техно-мусор", en: "LR-300, SAR, M39, MP5, 8x scope, ammo, HQM, tech trash" } },
  { name: { ru: "Элитный ящик", en: "Elite Crate" }, tag: { ru: "Тир 3", en: "Tier 3" }, loot: { ru: "Броня, оружие, фрагменты чертежей, взрывчатка", en: "Armor, weapons, blueprint fragments, explosives" } },
  { name: { ru: "Ящики подводных лабораторий", en: "Underwater Lab crates" }, tag: { ru: "Тир 3", en: "Tier 3" }, loot: { ru: "Как военные + уникальные предметы лабораторий", en: "Military-grade + lab-exclusive items" } },
  { name: { ru: "Ящик с инструментами", en: "Tool Box" }, tag: { ru: "Тир 1", en: "Tier 1" }, loot: { ru: "Инструменты, гвоздомет, компоненты, скрап", en: "Tools, nailgun, components, scrap" } },
  { name: { ru: "Бочки и обычные ящики", en: "Barrels & basic crates" }, tag: { ru: "Тир 0", en: "Tier 0" }, loot: { ru: "Трубы, шестерни, верёвки, еда, скрап", en: "Pipes, gears, rope, food, scrap" } },
];

const npcLoot = [
  { name: { ru: "Учёные (нефтяные вышки)", en: "Oil Rig scientists" }, loot: { ru: "Лучший пул: винтовки, броня, техно-мусор", en: "Best pool: rifles, armor, tech trash" } },
  { name: { ru: "Учёные (монументы)", en: "Monument scientists" }, loot: { ru: "Патроны, медпомощь, скрап, иногда SMG", en: "Ammo, meds, scrap, occasional SMG" } },
  { name: { ru: "Бандиты (лагерь)", en: "Bandit Camp NPCs" }, loot: { ru: "Скрап, еда, дешёвое оружие", en: "Scrap, food, cheap weapons" } },
  { name: { ru: "Туннельный житель", en: "Tunnel Dweller" }, loot: { ru: "Скрап, патроны, инструменты", en: "Scrap, ammo, tools" } },
];

const monumentsData = [
  { name: { ru: "Нефтяная вышка (Большая)", en: "Large Oil Rig" }, rad: "Medium", cards: "Blue / Red" },
  { name: { ru: "Космодром (Launch Site)", en: "Launch Site" }, rad: "High", cards: "Green / Blue / Red" },
  { name: { ru: "Электростанция (Power Plant)", en: "Power Plant" }, rad: "Low", cards: "Green / Blue" },
];

const teaRecipes = [
  { name: { ru: "Чистый чай на руду", en: "Pure Ore Tea" }, effect: "+50% Yield", ingredients: "4x Red Berry + 2x Yellow Berry" },
  { name: { ru: "Чистый чай на металл", en: "Pure Scrap Tea" }, effect: "+50% Scrap", ingredients: "4x Yellow Berry + 2x Blue Berry" },
  { name: { ru: "Чистый чай на здоровье", en: "Pure Max Health Tea" }, effect: "+100 Max HP", ingredients: "4x White Berry + 2x Red Berry" },
];

const accessCardsInfo = [
  { color: { ru: "Зеленая карта", en: "Green Card" }, location: { ru: "Магазины, Заправка, Маяк", en: "Supermarket, Gas Station, Lighthouse" } },
  { color: { ru: "Синяя карта", en: "Blue Card" }, location: { ru: "Покупается у ученых в лагере / Водные объекты", en: "Bought from Bandit Camp / Water Monuments" } },
  { color: { ru: "Красная карта", en: "Red Card" }, location: { ru: "Финальные комнаты монументов (Launch Site, Oil Rig)", en: "High tier monument loot rooms" } },
];

// Магазины мирных зон — что продаётся у NPC
const safeZoneShops = [
  {
    store: { ru: "Аутпост — Стол исследований", en: "Outpost — Research Table" },
    items: [
      { name: { ru: "Гвоздомет (Nailgun)", en: "Nailgun" }, price: "75 Scrap" },
      { name: { ru: "Ремонтный верстак (Workbench T1 части)", en: "Workbench T1 parts" }, price: "50 Scrap" },
    ],
  },
  {
    store: { ru: "Бандитский лагерь — Стол исследований", en: "Bandit Camp — Research Table" },
    items: [
      { name: { ru: "Миникоптер (Minicopter)", en: "Minicopter" }, price: "750 Scrap" },
      { name: { ru: "Лодочный мотор (Boat)", en: "Boat" }, price: "150 Scrap" },
      { name: { ru: "Двойной дробовик (DB)", en: "Double Barrel Shotgun" }, price: "75 Scrap" },
    ],
  },
  {
    store: { ru: "Торговые автоматы мирных зон (NPC-вендоры)", en: "Safe-zone Vending NPCs" },
    items: [
      { name: { ru: "Электрический кабель / Твел", en: "Hose / Wire" }, price: "10 Scrap" },
      { name: { ru: "Чертежи по доставке дроном", en: "Blueprints via Drone Delivery" }, price: { ru: "цена предмета + скрап на исследование + 20 скрап доставка", en: "item price + research scrap + 20 scrap delivery" } },
    ],
  },
];

const workbenchLevels = [
  { level: 1, req: { ru: "Требований нет — крафтится сразу из дерева и металла", en: "No requirement — craft right away from wood & metal" } },
  { level: 2, req: { ru: "5x Обычный фрагмент чертежа + 500 дерева + 20 HQM", en: "5x Basic Blueprint Fragment + 500 Wood + 20 HQM" } },
  { level: 3, req: { ru: "5x Улучшенный фрагмент чертежа + 500 дерева + 50 HQM", en: "5x Advanced Blueprint Fragment + 500 Wood + 50 HQM" } },
];

const fragmentSources = [
  { name: { ru: "Военные и подземные ящики", en: "Military & underwater crates" }, tag: { ru: "Обычный", en: "Basic" } },
  { name: { ru: "Пазл-комнаты зелёных/синих карт", en: "Green / blue keycard puzzle rooms" }, tag: { ru: "Обычный", en: "Basic" } },
  { name: { ru: "Средние и крупные монументы", en: "Medium & large monuments" }, tag: { ru: "Обычный", en: "Basic" } },
  { name: { ru: "Аирдропы, элитные и запертые ящики", en: "Airdrops, elite & locked crates" }, tag: { ru: "Улучшенный", en: "Advanced" } },
  { name: { ru: "20x Обычных → 1 Улучшенный (обмен)", en: "20x Basic → 1 Advanced (conversion)" }, tag: { ru: "Обмен", en: "Trade-in" } },
];

// Карьер: усреднённые профили добычи в час (≈, зависит от карты)
const quarryProfiles = [
  { id: "stone", label: { ru: "Камень", en: "Stone" }, rate: 5200, color: accent.gray },
  { id: "metal", label: { ru: "Металл", en: "Metal ore" }, rate: 2100, color: accent.orange },
  { id: "sulfur", label: { ru: "Сера", en: "Sulfur ore" }, rate: 1900, color: accent.yellow },
];

// Гены растений для фермы скрещивания (описание упрощённое)
const GENES = ["G", "H", "Y", "W", "X"];
const geneInfo = {
  G: { label: { ru: "Урожайность", en: "Yield" }, desc: { ru: "Растение даёт больше ресурсов", en: "Plant yields more resources" }, color: accent.green },
  H: { label: { ru: "Выносливость", en: "Hardiness" }, desc: { ru: "Лучше переносит холод", en: "Tolerates cold better" }, color: accent.orange },
  Y: { label: { ru: "Скорость роста", en: "Growth" }, desc: { ru: "Быстрее проходит цикл роста", en: "Completes growth cycle faster" }, color: accent.yellow },
  W: { label: { ru: "Вода", en: "Water" }, desc: { ru: "Меньше потребляет воды", en: "Consumes less water" }, color: accent.teal },
  X: { label: { ru: "Пустой", en: "Empty" }, desc: { ru: "Без заметного эффекта", en: "No notable effect" }, color: accent.gray },
};


// ─────────────────────────────────────────────────────────
// ЖИВЫЕ ДАННЫЕ: Firebase RTDB (REST) и прямой Rust+ (WebSocket)
// Экраны получают единый live-объект; без живого источника — мок выше.
// Выбор источника хранится в localStorage под ключом SOURCE_KEY.
// ─────────────────────────────────────────────────────────
const SOURCE_KEY = "rc_source_v1";

function loadStoredSource() {
  try {
    const raw = window.localStorage.getItem(SOURCE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.mode ? parsed : null;
  } catch (e) {
    return null;
  }
}

function storeSource(src) {
  try { window.localStorage.setItem(SOURCE_KEY, JSON.stringify(src)); } catch (e) { /* приватный режим — просто не сохраняем */ }
}

const hhmm = (ts) => {
  try { return new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; }
};

// Единый стиль игровых событий для обоих провайдеров
const EVENT_STYLE = {
  patrol_helicopter: { color: accent.red, icon: Crosshair, label: { ru: "Патрульный вертолёт", en: "Patrol Helicopter" } },
  cargo_ship: { color: accent.teal, icon: Ship, label: { ru: "Cargo Ship", en: "Cargo Ship" } },
  ch47: { color: accent.orange, icon: Plane, label: { ru: "Чинук", en: "Chinook" } },
  crate: { color: accent.yellow, icon: Package, label: { ru: "Крейт", en: "Locked Crate" } },
};

// ── Мини-кодек protobuf: подмножество rustplus.proto ──
// Номера полей зафиксированы протоколом Rust+, менять нельзя.
// uint64 (steamId/playerId) считаем через BigInt — они больше 2^53.

function pbVarintBytes(value) {
  let v = typeof value === "bigint" ? value : BigInt(Math.trunc(Number(value) || 0));
  const out = [];
  do {
    let b = Number(v & 0x7fn);
    v >>= 7n;
    if (v > 0n) b |= 0x80;
    out.push(b);
  } while (v > 0n);
  return out;
}

function pbFieldVarint(num, value) { return [...pbVarintBytes((num << 3) | 0), ...pbVarintBytes(value)]; }

function pbFieldLen(num, bytes) {
  const arr = bytes instanceof Uint8Array ? Array.from(bytes) : bytes;
  return [...pbVarintBytes((num << 3) | 2), ...pbVarintBytes(arr.length), ...arr];
}

function pbFieldStr(num, str) { return pbFieldLen(num, new TextEncoder().encode(str)); }

// Разбор буфера в список полей { num, wire, varint?, bytes? }
function pbDecode(buf) {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const fields = [];
  let i = 0;
  const readVarint = () => {
    let val = 0n;
    let shift = 0n;
    for (;;) {
      if (i >= u8.length) throw new Error("protobuf: unexpected end");
      const b = u8[i++];
      val |= BigInt(b & 0x7f) << shift;
      if (!(b & 0x80)) return val;
      shift += 7n;
    }
  };
  while (i < u8.length) {
    const key = readVarint();
    const num = Number(key >> 3n);
    const wire = Number(key & 7n);
    if (wire === 0) {
      fields.push({ num, wire, varint: readVarint() });
    } else if (wire === 2) {
      const len = Number(readVarint());
      if (i + len > u8.length) throw new Error("protobuf: bad length");
      fields.push({ num, wire, bytes: u8.subarray(i, i + len) });
      i += len;
    } else if (wire === 5) {
      fields.push({ num, wire, bytes: u8.subarray(i, i + 4) });
      i += 4;
    } else if (wire === 1) {
      fields.push({ num, wire, bytes: u8.subarray(i, i + 8) });
      i += 8;
    } else {
      throw new Error("protobuf: wire type " + wire);
    }
  }
  return fields;
}

function pbFind(fields, num) { for (const f of fields) if (f.num === num) return f; return null; }
function pbFindAll(fields, num) { return fields.filter((f) => f.num === num); }
function pbSub(fields, num) { const f = pbFind(fields, num); return f && f.bytes ? pbDecode(f.bytes) : []; }
function pbAsStr(fields, num) { const f = pbFind(fields, num); return f && f.bytes ? new TextDecoder().decode(f.bytes) : ""; }
function pbAsBig(fields, num) { const f = pbFind(fields, num); return f && f.varint != null ? f.varint : 0n; }
function pbAsBool(fields, num) { const f = pbFind(fields, num); return !!(f && f.varint != null && f.varint > 0n); }
function pbAsFlt(fields, num) {
  const f = pbFind(fields, num);
  if (!f || !f.bytes || f.bytes.length < 4) return 0;
  return new DataView(f.bytes.buffer, f.bytes.byteOffset, f.bytes.byteLength).getFloat32(0, true);
}

// Номера полей верхнего уровня (rustplus.proto): AppRequest / AppResponse / AppBroadcast
const RP_FIELD = {
  // AppRequest
  seq: 1, playerId: 2, playerToken: 3, entityId: 4,
  getInfo: 8, getMap: 10, getTeamInfo: 11, getTeamChat: 12, sendTeamMessage: 13,
  getEntityInfo: 14, setEntityValue: 15, setSubscription: 17, getMapMarkers: 18,
  // AppResponse
  resSeq: 1, success: 4, error: 5, info: 6, map: 8, teamInfo: 9, teamChat: 10,
  entityInfo: 11, mapMarkers: 13,
  // AppBroadcast
  bcTeamChanged: 4, bcTeamMessage: 5, bcEntityChanged: 6,
};

// Типы маркеров карты (AppMarkerType) → ключ события в EVENT_STYLE
const RP_MARKER_TYPE = { 4: "ch47", 5: "cargo_ship", 6: "crate", 8: "patrol_helicopter" };

// ── Провайдер: прямой Rust+ через WebSocket ──
// Каждый запрос несёт seq + playerId + playerToken (отдельного handshake нет).
// Запросы сериализуются с паузой ≥1100 мс — сервер рейтлимитит частые запросы.
function useRustPlusDirect(enabled, cfg) {
  const [status, setStatus] = useState("idle"); // idle|connecting|connected|error
  const [error, setError] = useState(null);
  const [server, setServer] = useState(null);
  const [team, setTeam] = useState([]);
  const [mapData, setMapData] = useState(null);
  const [activeEvents, setActiveEvents] = useState([]);
  const [alarmLog, setAlarmLog] = useState([]);
  const [devices, setDevices] = useState({});
  const [chat, setChat] = useState([]);

  const wsRef = useRef(null);
  const seqRef = useRef(0);
  const pendRef = useRef(new Map()); // seq -> {resolve, reject}
  const gateRef = useRef(Promise.resolve());
  const sendRef = useRef(null); // (pairs, entityId) => Promise<AppResponse>
  const markersRef = useRef(null);
  const prevValRef = useRef({});
  const entitiesRef = useRef([]);
  const mapGotRef = useRef(false);

  useEffect(() => {
    const steamIdStr = String((cfg && cfg.steamId) || "").trim();
    const tokenStr = String((cfg && cfg.token) || "").trim();
    if (!enabled || !cfg || !cfg.ip || !/^\d+$/.test(steamIdStr) || !tokenStr) {
      setStatus("idle");
      setError(null);
      return undefined;
    }

    let disposed = false;
    const timers = [];
    markersRef.current = null;
    mapGotRef.current = false;
    prevValRef.current = {};

    let entities = [];
    try { entities = JSON.parse(cfg.entitiesJson || "[]"); } catch (e) { entities = []; }
    entitiesRef.current = Array.isArray(entities) ? entities.filter((en) => en && en.id != null) : [];

    setStatus("connecting");
    setError(null);

    let steamIdBig;
    try { steamIdBig = BigInt(steamIdStr); } catch (e) {
      setStatus("error");
      setError("SteamID должен быть числом (SteamID64)");
      return undefined;
    }
    const tokenBig = BigInt(parseInt(tokenStr, 10) || 0);

    let ws;
    try {
      ws = new WebSocket("ws://" + cfg.ip + ":" + (cfg.port || 28082));
    } catch (e) {
      setStatus("error");
      setError(
        window.location && window.location.protocol === "https:"
          ? "Браузер заблокировал ws:// со страницы https (mixed content). Сохрани файл и открой его локально или через localhost."
          : "Не удалось открыть WebSocket: " + (e && e.message ? e.message : e)
      );
      return undefined;
    }
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    const pushLog = (textRu, textEn, important) => {
      if (disposed) return;
      setAlarmLog((prev) =>
        [
          { id: Date.now() + "-" + Math.random(), ts: Date.now(), time: hhmm(Date.now()), important: !!important, text: { ru: textRu, en: textEn } },
          ...prev,
        ].slice(0, 50)
      );
    };

    // AppTeamInfo{leaderSteamId=1, members=2}; Member{steamId=1,name=2,x=3,y=4,isOnline=5,isAlive=7}
    const applyTeamInfo = (tf) => {
      const leader = pbAsBig(tf, 1).toString();
      const palette = [accent.blue, accent.green, accent.purple, accent.orange, accent.teal, accent.yellow];
      const members = pbFindAll(tf, 2).map((mf, idx) => {
        const m = pbDecode(mf.bytes);
        const sid = pbAsBig(m, 1).toString();
        return {
          steamId: sid,
          name: pbAsStr(m, 2),
          x: pbAsFlt(m, 3),
          y: pbAsFlt(m, 4),
          isOnline: pbAsBool(m, 5),
          isAlive: pbAsBool(m, 7),
          color: palette[idx % palette.length],
          leader: sid === leader,
        };
      });
      if (!disposed) setTeam(members);
    };

    // AppInfo{name=1,mapSize=5,wipeTime=6,players=7,maxPlayers=8,queuedPlayers=9,seed=10}
    const applyInfo = (inf) => {
      if (disposed) return;
      setServer({
        name: pbAsStr(inf, 1),
        playersN: Number(pbAsBig(inf, 7)),
        maxPlayers: Number(pbAsBig(inf, 8)),
        queued: Number(pbAsBig(inf, 9)),
        mapSizeM: Number(pbAsBig(inf, 5)),
        wipeTime: Number(pbAsBig(inf, 6)),
        seed: pbFind(inf, 10) ? String(Number(pbAsBig(inf, 10))) : "",
      });
    };

    // AppTeamMessage{steamId=1,name=2,message=3,color=4,time=5}
    const pushChatMsgs = (msgFields) => {
      if (disposed || !msgFields) return;
      const add = msgFields.map((mf) => {
        const m = pbDecode(mf.bytes);
        const sid = pbAsBig(m, 1).toString();
        return {
          key: sid + ":" + pbAsBig(m, 5) + ":" + pbAsStr(m, 3),
          steamId: sid,
          author: pbAsStr(m, 2),
          text: pbAsStr(m, 3),
          mine: sid === steamIdStr,
          ts: Number(pbAsBig(m, 5)) * 1000,
        };
      }).filter((c) => c.text);
      if (!add.length) return;
      setChat((prev) => {
        const seen = new Set(prev.map((c) => c.key));
        return [...prev, ...add.filter((c) => !seen.has(c.key))].slice(-100);
      });
    };

    // AppEntityPayload{value=1,items=2,capacity=3,hasProtection=4,protectionExpiry=5}
    const handleEntityPayload = (entId, pf) => {
      const conf = entitiesRef.current.find((e) => String(e.id) === String(entId));
      const key = String(entId);
      const nowOn = pbAsBool(pf, 1);
      const wasOn = prevValRef.current[key] === true;
      prevValRef.current[key] = nowOn;
      const items = pbFindAll(pf, 2).map((itf) => {
        const it = pbDecode(itf.bytes); // Item{itemId=1,quantity=2,itemIsBlueprint=3}
        return { itemId: Number(pbAsBig(it, 1)), quantity: Number(pbAsBig(it, 2)), isBlueprint: pbAsBool(it, 3) };
      });
      if (!disposed) {
        setDevices((prev) => ({
          ...prev,
          [key]: {
            id: key,
            name: (conf && conf.name) || (prev[key] && prev[key].name) || "Устройство " + entId,
            type: (conf && conf.type) || (prev[key] && prev[key].type) || "switch",
            value: nowOn,
            capacity: Number(pbAsBig(pf, 3)) || null,
            hasProtection: pbAsBool(pf, 4),
            protectionExpiry: Number(pbAsBig(pf, 5)) || 0,
            items,
          },
        }));
      }
      if (conf && conf.type === "alarm" && nowOn && !wasOn) {
        pushLog("Тревога «" + conf.name + "» сработала", 'Alarm "' + conf.name + '" triggered', true);
      }
    };

    // AppMapMarkers{markers=1}; AppMarker{id=1,type=2,x=3,y=4} — diff как в pc-client
    const applyMarkers = (mf) => {
      const current = new Map();
      pbFindAll(mf, 1).forEach((mkf) => {
        const mk = pbDecode(mkf.bytes);
        const t = Number(pbAsBig(mk, 2));
        if (RP_MARKER_TYPE[t]) current.set(Number(pbAsBig(mk, 1)), { type: t, x: pbAsFlt(mk, 3), y: pbAsFlt(mk, 4) });
      });
      const styleOf = (t) => EVENT_STYLE[RP_MARKER_TYPE[t]] || {};
      const activeList = Array.from(current.entries()).map(([id, m]) => ({
        id,
        key: RP_MARKER_TYPE[m.type],
        worldX: m.x,
        worldY: m.y,
        ...(styleOf(m.type)),
      }));
      if (!disposed) setActiveEvents(activeList);
      const prev = markersRef.current;
      if (prev) {
        current.forEach((m, id) => {
          if (!prev.has(id)) {
            const s = styleOf(m.type);
            if (s.label) pushLog(s.label.ru + " появился на карте", s.label.en + " appeared", false);
          }
        });
        prev.forEach((m, id) => {
          if (!current.has(id)) {
            const s = styleOf(m.type);
            if (s.label) pushLog(s.label.ru + " исчез с карты", s.label.en + " disappeared", false);
          }
        });
      }
      markersRef.current = current;
    };

    const bytesToBase64 = (u8) => {
      let bin = "";
      const CH = 0x8000;
      for (let i = 0; i < u8.length; i += CH) bin += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
      return btoa(bin);
    };

    // Отправка с рейтлимитом: цепочка промисов, пауза 1100 мс после каждого запроса
    const rpSendRaw = (pairs, entityId) =>
      new Promise((resolve, reject) => {
        const w = wsRef.current;
        if (!w || w.readyState !== 1) {
          reject(new Error("нет подключения"));
          return;
        }
        const seq = ++seqRef.current;
        let body = [
          ...pbFieldVarint(RP_FIELD.seq, seq),
          ...pbFieldVarint(RP_FIELD.playerId, steamIdBig),
          ...pbFieldVarint(RP_FIELD.playerToken, tokenBig),
        ];
        if (entityId != null) body = body.concat(pbFieldVarint(RP_FIELD.entityId, entityId));
        pairs.forEach(([num, bytes]) => {
          body = body.concat(pbFieldLen(num, bytes));
        });
        pendRef.current.set(seq, { resolve, reject });
        setTimeout(() => {
          if (pendRef.current.has(seq)) {
            pendRef.current.delete(seq);
            reject(new Error("сервер не ответил (таймаут)"));
          }
        }, 15000);
        try {
          w.send(new Uint8Array(body));
        } catch (e) {
          pendRef.current.delete(seq);
          reject(e);
        }
      });

    const rpSend = (pairs, entityId) => {
      const run = gateRef.current.then(() => rpSendRaw(pairs, entityId));
      const pause = new Promise((r) => setTimeout(r, 1100));
      gateRef.current = run.then(() => pause, () => pause);
      return run;
    };
    sendRef.current = rpSend;

    const fetchMapOnce = async () => {
      if (mapGotRef.current) return;
      try {
        const r = await rpSend([[RP_FIELD.getMap, []]]);
        const mfF = pbFind(r, RP_FIELD.map);
        if (!mfF || !mfF.bytes || disposed) return;
        const mp = pbDecode(mfF.bytes); // AppMap{width=1,height=2,jpgImage=3,monuments=5}
        const img = pbFind(mp, 3);
        const monuments = pbFindAll(mp, 5).map((mo) => {
          const o = pbDecode(mo.bytes); // Monument{token=1,x=2,y=3}
          return { token: pbAsStr(o, 1), x: pbAsFlt(o, 2), y: pbAsFlt(o, 3) };
        });
        if (img && img.bytes && img.bytes.length) {
          setMapData({
            image: "data:image/jpeg;base64," + bytesToBase64(img.bytes),
            width: Number(pbAsBig(mp, 1)) || 3000,
            height: Number(pbAsBig(mp, 2)) || 3000,
            monuments,
          });
          mapGotRef.current = true;
        }
      } catch (e) { /* повторим на следующем тике info */ }
    };

    ws.onopen = () => {
      if (disposed) return;
      setStatus("connected");

      (async () => {
        try {
          const r = await rpSend([[RP_FIELD.getInfo, []]]);
          const f = pbSub(r, RP_FIELD.info);
          if (f.length) applyInfo(f);
        } catch (e) { /* нет инфо — не критично */ }
        await fetchMapOnce();
        try {
          const r = await rpSend([[RP_FIELD.getTeamChat, []]]);
          const tc = pbSub(r, RP_FIELD.teamChat);
          if (tc.length) pushChatMsgs(pbFindAll(tc, 1));
        } catch (e) { /* чат может быть пуст */ }
        for (const en of entitiesRef.current) {
          try { await rpSend([[RP_FIELD.setSubscription, pbFieldVarint(1, 1)]], Number(en.id)); } catch (e) { /* пропускаем */ }
          try {
            const r = await rpSend([[RP_FIELD.getEntityInfo, []]], Number(en.id));
            const ei = pbSub(r, RP_FIELD.entityInfo);
            const pf = ei.length ? pbFind(ei, 3) : null;
            if (pf && pf.bytes) handleEntityPayload(en.id, pbDecode(pf.bytes));
          } catch (e) { /* пропускаем */ }
        }
        try {
          const r = await rpSend([[RP_FIELD.getTeamInfo, []]]);
          const tf = pbSub(r, RP_FIELD.teamInfo);
          if (tf.length) applyTeamInfo(tf);
        } catch (e) { /* придёт по таймеру */ }
      })();

      timers.push(setInterval(async () => {
        try {
          const r = await rpSend([[RP_FIELD.getTeamInfo, []]]);
          const tf = pbSub(r, RP_FIELD.teamInfo);
          if (tf.length) applyTeamInfo(tf);
        } catch (e) { /* пропущенный тик */ }
      }, 5000));
      timers.push(setInterval(async () => {
        try {
          const r = await rpSend([[RP_FIELD.getMapMarkers, []]]);
          const mf = pbSub(r, RP_FIELD.mapMarkers);
          if (mf.length) applyMarkers(mf);
        } catch (e) { /* пропущенный тик */ }
      }, 15000));
      timers.push(setInterval(async () => {
        try {
          const r = await rpSend([[RP_FIELD.getInfo, []]]);
          const inf = pbSub(r, RP_FIELD.info);
          if (inf.length) applyInfo(inf);
        } catch (e) { /* пропущенный тик */ }
        await fetchMapOnce();
      }, 60000));
    };

    ws.onmessage = (ev) => {
      let msg;
      try { msg = pbDecode(new Uint8Array(ev.data)); } catch (e) { return; }
      // AppMessage{response=1, broadcast=2}
      const respF = pbFind(msg, 1);
      if (respF && respF.bytes) {
        const r = pbDecode(respF.bytes);
        const seq = Number(pbAsBig(r, RP_FIELD.resSeq));
        const p = pendRef.current.get(seq);
        if (p) {
          pendRef.current.delete(seq);
          const errF = pbFind(r, RP_FIELD.error);
          if (errF && errF.bytes) p.reject(new Error(pbAsStr(pbDecode(errF.bytes), 1)));
          else p.resolve(r);
        }
      }
      const bcastF = pbFind(msg, 2);
      if (bcastF && bcastF.bytes) {
        const b = pbDecode(bcastF.bytes);
        const tch = pbFind(b, RP_FIELD.bcTeamChanged);
        if (tch && tch.bytes) {
          const teamChanged = pbDecode(tch.bytes); // AppTeamChanged{playerId=1,teamInfo=2}
          const tf = pbFind(teamChanged, 2);
          if (tf && tf.bytes) applyTeamInfo(pbDecode(tf.bytes));
        }
        const tm = pbFind(b, RP_FIELD.bcTeamMessage);
        if (tm && tm.bytes) {
          const nm = pbDecode(tm.bytes); // AppNewTeamMessage{message=1}
          const mf = pbFind(nm, 1);
          if (mf && mf.bytes) pushChatMsgs([mf]);
        }
        const ec = pbFind(b, RP_FIELD.bcEntityChanged);
        if (ec && ec.bytes) {
          const ech = pbDecode(ec.bytes); // AppEntityChanged{entityId=1,payload=2}
          const entId = Number(pbAsBig(ech, 1));
          const pf = pbFind(ech, 2);
          if (pf && pf.bytes) handleEntityPayload(entId, pbDecode(pf.bytes));
        }
      }
    };

    ws.onclose = () => {
      if (disposed) return;
      setStatus("error");
      setError("Соединение с сервером закрылось. Проверь IP/порт и что сервер доступен.");
    };
    ws.onerror = () => { /* детали придут через onclose */ };

    return () => {
      disposed = true;
      timers.forEach(clearInterval);
      pendRef.current.forEach((p) => p.reject(new Error("отключено")));
      pendRef.current.clear();
      sendRef.current = null;
      try {
        ws.onclose = null;
        ws.close();
      } catch (e) { /* уже закрыт */ }
      wsRef.current = null;
    };
  }, [enabled, cfg && cfg.ip, cfg && cfg.port, cfg && cfg.steamId, cfg && cfg.token, cfg && cfg.entitiesJson]);

  const toggleSwitch = async (entityId, value) => {
    const key = String(entityId);
    setDevices((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key], value } } : prev));
    if (!sendRef.current) throw new Error("нет подключения");
    await sendRef.current([[RP_FIELD.setEntityValue, pbFieldVarint(1, value ? 1 : 0)]], Number(entityId)).catch(() => {});
  };

  const sendChat = async (text) => {
    if (!sendRef.current) throw new Error("нет подключения");
    await sendRef.current([[RP_FIELD.sendTeamMessage, pbFieldStr(1, String(text).slice(0, 128))]]);
  };

  return { modeTag: "rustplus", status, error, server, team, mapData, activeEvents, alarmLog, devices, chat, actions: { toggleSwitch, sendChat, refreshMap: async () => {} } };
}

// ── Провайдер: Firebase Realtime Database по REST ──
// Читает те же узлы, что и мобильное приложение; команды шлёт POST в /commands.
function useFirebaseLive(enabled, cfg) {
  const base = enabled && cfg && cfg.fbUrl ? String(cfg.fbUrl).trim().replace(/\/+$/, "") : "";
  const q = cfg && cfg.fbAuth ? "auth=" + encodeURIComponent(String(cfg.fbAuth).trim()) : "";

  const [status, setStatus] = useState(enabled && base ? "connecting" : "idle");
  const [error, setError] = useState(null);
  const [server, setServer] = useState(null);
  const [team, setTeam] = useState([]);
  const [mapData, setMapData] = useState(null);
  const [activeEvents, setActiveEvents] = useState([]);
  const [alarmLog, setAlarmLog] = useState([]);
  const [devices, setDevices] = useState({});
  const [chat, setChat] = useState([]);

  const deviceAlarmsRef = useRef([]);
  const devicePrevValsRef = useRef({});
  const mySteamId = String((cfg && cfg.steamId) || "").trim();

  useEffect(() => {
    if (!enabled || !base) {
      setStatus("idle");
      setError(null);
      return undefined;
    }
    let disposed = false;
    const timers = [];
    deviceAlarmsRef.current = [];
    devicePrevValsRef.current = {};
    setStatus("connecting");
    setError(null);

    const getj = async (path) => {
      const res = await fetch(base + path + ".json" + (q ? "?" + q : "") + (q ? "&" : "?") + "_=" + Date.now());
      if (res.status === 401 || res.status === 403) {
        throw new Error("Доступ запрещён правилами базы. Открой правила чтения для теста или впиши секрет базы в поле Auth.");
      }
      if (!res.ok) throw new Error("HTTP " + res.status + " от Firebase");
      return res.json();
    };

    const tick = async () => {
      try {
        const [st, tm, dv, ev, sv, ch] = await Promise.all([
          getj("/client_status"),
          getj("/team"),
          getj("/devices"),
          getj("/events"),
          getj("/server_info").catch(() => null),
          getj("/chat").catch(() => null),
        ]);
        if (disposed) return;

        if (!st || !st.status) {
          setStatus("offline");
          setError("pc-client не отвечает: /client_status пуст. Проверь, что pc-client запущен и пишет в эту базу.");
        } else {
          setStatus(st.status === "connected" ? "connected" : "offline");
          setError(st.status === "connected" ? null : "pc-client виден, но не подключён к серверу игры (статус " + st.status + ").");
        }

        // Команда
        const members = tm && Array.isArray(tm.members) ? tm.members : [];
        const palette = [accent.blue, accent.green, accent.purple, accent.orange, accent.teal, accent.yellow];
        setTeam(
          members.map((m, idx) => ({
            steamId: String(m.steamId == null ? "" : m.steamId),
            name: m.name || "?",
            x: m.x || 0,
            y: m.y || 0,
            isOnline: !!m.isOnline,
            isAlive: m.isAlive !== false,
            color: palette[idx % palette.length],
            leader: String((tm.leaderSteamId == null ? "" : tm.leaderSteamId)) === String(m.steamId == null ? "" : m.steamId),
          }))
        );

        // Инфо о сервере (пишет pc-client в /server_info)
        if (sv) {
          setServer({
            name: sv.name || "",
            playersN: sv.players || 0,
            maxPlayers: sv.maxPlayers || 0,
            queued: sv.queuedPlayers || 0,
            mapSizeM: sv.mapSize || 3000,
            wipeTime: sv.wipeTime || 0,
            seed: sv.seed != null ? String(sv.seed) : "",
          });
        }

        // События: активные маркеры + лента появлений/исчезновений
        const entries =
          ev && typeof ev === "object"
            ? Object.entries(ev).map(([k, v]) => ({ key: k, ...(v || {}) })).filter((e) => e.type)
            : [];
        entries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        const latest = {};
        entries.forEach((e) => {
          if (latest[e.type] == null) latest[e.type] = e;
        });
        setActiveEvents(
          Object.values(latest)
            .filter((e) => e.action === "spawn" && EVENT_STYLE[e.type])
            .map((e) => ({ id: e.key, key: e.type, worldX: e.x || 0, worldY: e.y || 0, ...(EVENT_STYLE[e.type]) }))
        );
        const evLogs = entries
          .slice(0, 30)
          .filter((e) => EVENT_STYLE[e.type])
          .map((e) => ({
            id: "ev-" + e.key,
            ts: e.timestamp || 0,
            time: hhmm(e.timestamp || Date.now()),
            important: false,
            src: "event",
            text: {
              ru: (e.action === "spawn" ? "Появление: " : "Исчезло: ") + EVENT_STYLE[e.type].label.ru,
              en: (e.action === "spawn" ? "Spawned: " : "Gone: ") + EVENT_STYLE[e.type].label.en,
            },
          }));

        // Устройства + дифф значений тревог между поллами
        const dObj = dv && typeof dv === "object" ? dv : {};
        Object.values(dObj).forEach((d) => {
          if (!d || d.id == null) return;
          const k = "d" + d.id;
          const was = devicePrevValsRef.current[k] === true;
          const now = d.value === true;
          devicePrevValsRef.current[k] = now;
          if (d.type === "alarm" && now && !was) {
            deviceAlarmsRef.current = [
              {
                id: k + "-" + (d.updatedAt || Date.now()),
                ts: d.updatedAt || Date.now(),
                time: hhmm(d.updatedAt || Date.now()),
                important: true,
                src: "device",
                text: { ru: "Тревога «" + (d.name || d.id) + "» сработала", en: 'Alarm "' + (d.name || d.id) + '" triggered' },
              },
              ...deviceAlarmsRef.current,
            ].slice(0, 50);
          }
        });
        setDevices(dObj);
        setAlarmLog([...evLogs, ...deviceAlarmsRef.current].sort((a, b) => b.ts - a.ts).slice(0, 50));

        // Чат команды (/chat пишет pc-client)
        const chArr = ch && typeof ch === "object" ? Object.entries(ch).map(([k, v]) => ({ key: k, ...(v || {}) })) : [];
        chArr.sort((a, b) => (a.time || 0) - (b.time || 0));
        setChat(
          chArr.slice(-100).map((c) => ({
            key: c.key,
            steamId: String(c.steamId == null ? "" : c.steamId),
            author: c.name || "?",
            text: c.message || "",
            mine: String(c.steamId == null ? "" : c.steamId) === mySteamId,
            ts: (c.time || 0) * 1000,
          }))
        );
      } catch (err) {
        if (disposed) return;
        setStatus("error");
        setError(err && err.message ? err.message : String(err));
      }
    };

    const fetchMap = async () => {
      try {
        const mp = await getj("/map");
        if (disposed) return;
        setMapData(mp && mp.image ? { image: mp.image, width: mp.width || 3000, height: mp.height || 3000, monuments: mp.monuments || [] } : null);
      } catch (e) { /* карта подтянется на следующем цикле */ }
    };

    tick();
    fetchMap();
    timers.push(setInterval(tick, 4000));
    timers.push(setInterval(fetchMap, 120000));

    return () => {
      disposed = true;
      timers.forEach(clearInterval);
    };
  }, [enabled, base, q, mySteamId]);

  const postCommand = async (body) => {
    const res = await fetch(base + "/commands.json" + (q ? "?" + q : ""), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Не удалось отправить команду (" + res.status + ")");
  };

  const toggleSwitch = async (entityId, value) => {
    const key = String(entityId);
    setDevices((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key], value } } : prev)); // оптимистично
    await postCommand({ action: "toggle_switch", entityId: Number(entityId), value, requestedAt: Date.now() });
  };

  const sendChat = async (text) => {
    await postCommand({ action: "send_team_message", text: String(text).slice(0, 128), requestedAt: Date.now() });
  };

  const refreshMap = async () => {
    if (!base) return;
    try {
      const res = await fetch(base + "/map.json" + (q ? "?" + q : "") + (q ? "&" : "?") + "_=" + Date.now());
      if (!res.ok) return;
      const mp = await res.json();
      setMapData(mp && mp.image ? { image: mp.image, width: mp.width || 3000, height: mp.height || 3000, monuments: mp.monuments || [] } : null);
    } catch (e) { /* оставляем прошлую карту */ }
  };

  return { modeTag: "firebase", status, error, server, team, mapData, activeEvents, alarmLog, devices, chat, actions: { toggleSwitch, sendChat, refreshMap } };
}

// ── Единая точка данных для экранов ──
function useDataSource(mode, cfg) {
  const fb = useFirebaseLive(mode === "firebase", cfg);
  const rp = useRustPlusDirect(mode === "rustplus", cfg);
  const live =
    mode === "firebase"
      ? fb
      : mode === "rustplus"
      ? rp
      : { modeTag: "mock", status: "idle", error: null, server: null, team: [], mapData: null, activeEvents: [], alarmLog: [], devices: {}, chat: [], actions: { toggleSwitch: async () => {}, sendChat: async () => {}, refreshMap: async () => {} } };
  return {
    mode: live.modeTag,
    status: live.status,
    error: live.error,
    server: live.server,
    team: live.team,
    map: live.mapData,
    activeEvents: live.activeEvents,
    alarmLog: live.alarmLog,
    devices: live.devices,
    chat: live.chat,
    actions: live.actions,
  };
}

// Приведение live-данных к виду мок-компонентов (проценты экрана, Y инвертирован — как в MapScreen.js)
function worldToPct(v, worldSize) { return worldSize > 0 ? (v / worldSize) * 100 : 0; }

function buildLiveView(live) {
  if (!live || live.mode === "mock") return null;
  const worldSize = (live.map && live.map.width) || (live.server && live.server.mapSizeM) || 3000;
  return {
    image: live.map ? live.map.image : null,
    members: live.team.map((m) => ({
      id: m.steamId,
      name: m.name,
      color: m.color || accent.blue,
      x: worldToPct(m.x, worldSize),
      y: 100 - worldToPct(m.y, worldSize),
      online: m.isOnline,
      alive: m.isAlive,
    })),
    events: live.activeEvents
      .filter((ev) => ev.icon)
      .map((ev) => ({
        id: ev.id,
        icon: ev.icon,
        label: ev.label,
        color: ev.color,
        x: worldToPct(ev.worldX, worldSize),
        y: 100 - worldToPct(ev.worldY, worldSize),
      })),
  };
}


// ─────────────────────────────────────────────────────────
// Общие мелкие компоненты
// ─────────────────────────────────────────────────────────
function AvatarBubble({ name, color = accent.blue, size = 34, dim = false }) {
  return (
    <div
      className="shrink-0 flex items-center justify-center font-bold text-white"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.34,
        fontSize: size * 0.38,
        background: `linear-gradient(160deg, ${color}, ${color}aa)`,
        opacity: dim ? 0.45 : 1,
      }}
    >
      {name.charAt(0)}
    </div>
  );
}

function TeammateRow({ m, lang }) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <AvatarBubble name={m.name} color={m.color} dim={!m.online} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white/90 truncate">{m.name}</p>
        <p className="text-[10px]" style={{ color: "rgba(242,242,247,0.4)" }}>
          {(m.online ? (lang === "ru" ? "В сети" : "Online") : (lang === "ru" ? "Не в сети" : "Offline")) +
            " · " +
            (m.alive ? (lang === "ru" ? "Жив" : "Alive") : (lang === "ru" ? "Умер" : "Dead"))}
        </p>
      </div>
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: m.online && m.alive ? accent.green : m.online ? accent.red : "rgba(255,255,255,0.25)" }}
      />
    </div>
  );
}

// Сетка карты: тимейты точками + ивенты (вертолёт, cargo, чинук, крейт).
// liveView — приведённые к процентам живые данные (см. buildLiveView);
// если есть картинка сервера, она ложится фоном вместо сетки.
function MapCanvas({ height = 280, compact = false, lang = "ru", liveView = null }) {
  const members = liveView ? liveView.members : teamMembers;
  const events = liveView ? liveView.events : mapEvents;
  return (
    <div
      className="relative overflow-hidden"
      style={{
        height,
        borderRadius: 22,
        backgroundColor: "#0a0a0e",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px), radial-gradient(circle at 50% 30%, rgba(191,90,242,0.16), transparent 70%)",
        backgroundSize: "40px 40px, 40px 40px, 100% 100%",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {liveView && liveView.image && (
        <img
          src={liveView.image}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      )}
      {members.map((m) => (
        <div
          key={m.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ left: `${m.x}%`, top: `${m.y}%` }}
        >
          <div
            className="w-3.5 h-3.5 rounded-full"
            style={{ background: m.color, boxShadow: `0 0 10px ${m.color}`, opacity: m.online ? 1 : 0.35 }}
          />
          {!compact && (
            <span
              className="text-[9px] mt-1 whitespace-nowrap px-1 rounded"
              style={{
                color: m.online ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.32)",
                textShadow: liveView ? "0 1px 2px rgba(0,0,0,0.8)" : "none",
                background: liveView ? "rgba(0,0,0,0.35)" : "transparent",
              }}
            >
              {m.name}
            </span>
          )}
        </div>
      ))}
      {events.map((ev) => {
        const Icon = ev.icon;
        return (
          <div
            key={ev.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ left: `${ev.x}%`, top: `${ev.y}%` }}
          >
            <div
              className="p-1.5 rounded-full animate-pulse"
              style={{
                background: `${ev.color}22`,
                border: `1px solid ${ev.color}66`,
                backdropFilter: "blur(2px)",
                WebkitBackdropFilter: "blur(2px)",
              }}
            >
              <Icon size={compact ? 11 : 13} color={ev.color} />
            </div>
            {!compact && (
              <span
                className="text-[8.5px] mt-1 whitespace-nowrap px-1 rounded"
                style={{
                  color: `${ev.color}cc`,
                  textShadow: liveView ? "0 1px 2px rgba(0,0,0,0.8)" : "none",
                  background: liveView ? "rgba(0,0,0,0.35)" : "transparent",
                }}
              >
                {lang === "ru" ? ev.label.ru : ev.label.en}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Модалка выбора источника данных: демо / Firebase / прямой Rust+
function ConnectModal({ lang, initial, liveStatusText, liveError, onClose, onSave }) {
  const cfg0 = (initial && initial.cfg) || {};
  const startMode = initial && initial.mode === "firebase" ? "firebase" : initial && initial.mode === "rustplus" ? "rustplus" : "demo";
  const [modeChoice, setModeChoice] = useState(startMode);
  const [fbUrl, setFbUrl] = useState(cfg0.fbUrl || "");
  const [fbAuth, setFbAuth] = useState(cfg0.fbAuth || "");
  const [fbSteamId, setFbSteamId] = useState(cfg0.steamId || "");
  const [ip, setIp] = useState(cfg0.ip || "");
  const [port, setPort] = useState(cfg0.port || "28082");
  const [steamId, setSteamId] = useState(cfg0.steamId || "");
  const [token, setToken] = useState(cfg0.token || "");
  const [entitiesJson, setEntitiesJson] = useState(
    cfg0.entitiesJson || '[\n  { "id": 123456, "name": "Свет на ферме", "type": "switch" }\n]'
  );

  const tr = (ru, en) => (lang === "ru" ? ru : en);

  let canSave = true;
  if (modeChoice === "firebase") canSave = /^https?:\/\//.test(fbUrl.trim());
  if (modeChoice === "rustplus") canSave = ip.trim() !== "" && /^\d+$/.test(steamId.trim()) && token.trim() !== "";

  const save = () => {
    if (!canSave) return;
    if (modeChoice === "demo") onSave({ mode: "mock", linked: true, cfg: {} });
    else if (modeChoice === "firebase")
      onSave({ mode: "firebase", linked: true, cfg: { fbUrl: fbUrl.trim(), fbAuth: fbAuth.trim(), steamId: steamId.trim() } });
    else onSave({ mode: "rustplus", linked: true, cfg: { ip: ip.trim(), port: port.trim() || "28082", steamId: steamId.trim(), token: token.trim(), entitiesJson } });
  };

  const inputCls = "w-full rounded-xl px-3.5 py-2.5 text-xs bg-white/5 outline-none placeholder-white/30";
  const inputStyle = { border: "1px solid rgba(255,255,255,0.1)" };
  const labelCls = "text-[11px] font-medium mb-1 block";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
    >
      <GlassCard className="w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <SectionHeader icon={Radio} color={accent.orange} title={tr("Источник данных", "Data source")} />

        <div className="mb-4">
          <Segmented
            color={accent.blue}
            value={modeChoice}
            onChange={setModeChoice}
            options={[
              { value: "demo", label: tr("Демо", "Demo") },
              { value: "firebase", label: "Firebase" },
              { value: "rustplus", label: "Rust+" },
            ]}
          />
        </div>

        {modeChoice === "demo" && (
          <p className="text-[11px] mb-4" style={{ color: "rgba(242,242,247,0.45)" }}>
            {tr(
              "Демо-режим со статичными примерами. Живые данные приходят через Firebase (нужен запущенный pc-client) или напрямую из Rust+ по WebSocket.",
              "Demo mode with static samples. Live data comes via Firebase (needs a running pc-client) or straight from Rust+ over WebSocket."
            )}
          </p>
        )}

        {modeChoice === "firebase" && (
          <div className="space-y-3 mb-4">
            <p className="text-[11px]" style={{ color: "rgba(242,242,247,0.45)" }}>
              {tr(
                "Страница читает те же данные, что и мобильное приложение: /team, /map, /devices, /events. Нужен запущенный pc-client.",
                "The page reads the same data as the mobile app: /team, /map, /devices, /events. A running pc-client is required."
              )}
            </p>
            <div>
              <label className={labelCls} style={{ color: "rgba(242,242,247,0.45)" }}>
                URL базы данных (Realtime Database, не Firestore!)
              </label>
              <input
                type="text"
                placeholder="https://your-project-default-rtdb.firebaseio.com"
                value={fbUrl}
                onChange={(e) => setFbUrl(e.target.value)}
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelCls} style={{ color: "rgba(242,242,247,0.45)" }}>
                {tr("Секрет базы / auth (опционально)", "Database secret / auth (optional)")}
              </label>
              <input type="password" placeholder="—" value={fbAuth} onChange={(e) => setFbAuth(e.target.value)} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={{ color: "rgba(242,242,247,0.45)" }}>
                {tr("Твой SteamID64 (для своих сообщений в чате)", "Your SteamID64 (to mark your own chat messages)")}
              </label>
              <input type="text" placeholder="76561198..." value={steamId} onChange={(e) => setSteamId(e.target.value)} className={inputCls} style={inputStyle} />
            </div>
          </div>
        )}

        {modeChoice === "rustplus" && (
          <div className="space-y-3 mb-4">
            <p className="text-[11px]" style={{ color: "rgba(242,242,247,0.45)" }}>
              {tr(
                window.location && window.location.protocol === "https:"
                  ? "Страница открыта по https — браузер скорее всего заблокирует ws:// подключение. Надёжнее открыть файл локально."
                  : "Прямое подключение к companion-серверу игры. Токен — как при спаривании официального Rust+ (Pair with Server).",
                window.location && window.location.protocol === "https:"
                  ? "This page is served over https — the browser will likely block ws:// connections. Opening the file locally is more reliable."
                  : "Direct connection to the game's companion server. Token is the same one used to pair the official Rust+ app."
              )}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className={labelCls} style={{ color: "rgba(242,242,247,0.45)" }}>
                  {tr("IP сервера", "Server IP")}
                </label>
                <input type="text" placeholder="192.168.1.100" value={ip} onChange={(e) => setIp(e.target.value)} className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={{ color: "rgba(242,242,247,0.45)" }}>
                  App Port
                </label>
                <input type="text" value={port} onChange={(e) => setPort(e.target.value.replace(/\D/g, ""))} className={inputCls} style={inputStyle} />
              </div>
            </div>
            <div>
              <label className={labelCls} style={{ color: "rgba(242,242,247,0.45)" }}>
                SteamID64
              </label>
              <input type="text" placeholder="76561198..." value={steamId} onChange={(e) => setSteamId(e.target.value.replace(/\D/g, ""))} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={{ color: "rgba(242,242,247,0.45)" }}>
                Player Token
              </label>
              <input type="password" placeholder={tr("Токен спаривания...", "Pairing token...")} value={token} onChange={(e) => setToken(e.target.value.trim())} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={{ color: "rgba(242,242,247,0.45)" }}>
                {tr("Устройства (формат entities.json)", "Devices (entities.json format)")}
              </label>
              <textarea rows={3} value={entitiesJson} onChange={(e) => setEntitiesJson(e.target.value)} className={inputCls + " font-mono"} style={inputStyle} />
            </div>
          </div>
        )}

        {(liveStatusText || liveError) && (
          <p className="text-[10.5px] mb-3" style={{ color: liveError ? accent.red : accent.green }}>
            {liveError ? "⚠ " + liveError : liveStatusText}
          </p>
        )}

        <button
          onClick={save}
          disabled={!canSave}
          className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ background: accent.blue, color: "#fff", boxShadow: `0 6px 18px ${accent.blue}55` }}
        >
          <Wifi size={15} />
          {tr("Подключиться", "Connect")}
        </button>
        <button onClick={onClose} className="w-full mt-2 py-2.5 text-xs" style={{ color: "rgba(242,242,247,0.4)" }}>
          {tr("Отмена", "Cancel")}
        </button>
      </GlassCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ЭКРАН 1: МЕЙН
// ─────────────────────────────────────────────────────────
function HomeScreen({ lang, t, connected, onOpenConnect, goTo, live }) {
  const isLive = !!(live && live.mode !== "mock");
  const lv = buildLiveView(live);
  const srv = isLive ? live.server : null;
  return (
    <>
      {/* Блок инфы о сервере / кнопка Подключить */}
      {!connected ? (
        <GlassCard className="p-5 mb-4">
          <div className="flex flex-col items-center py-6 gap-3">
            <IconChip icon={Radio} color={accent.orange} size={46} />
            <p className="text-[13px] font-medium text-white/70 mt-1">
              {lang === "ru" ? "Сервер не подключён" : "No server connected"}
            </p>
            <button
              onClick={onOpenConnect}
              className="mt-2 px-6 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2"
              style={{ background: accent.blue, color: "#fff", boxShadow: `0 6px 18px ${accent.blue}55` }}
            >
              <Wifi size={15} />
              {lang === "ru" ? "Подключить" : "Connect"}
            </button>
            <p className="text-[10.5px]" style={{ color: "rgba(242,242,247,0.35)" }}>
              {lang === "ru" ? "Вход через Rust+" : "Sign in with Rust+"}
            </p>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="p-0 mb-4 overflow-hidden">
          <div
            className="h-24 relative flex items-end p-5"
            style={{
              background:
                "linear-gradient(135deg, rgba(10,132,255,0.28), rgba(10,10,14,0.4)), radial-gradient(circle at 80% 10%, rgba(191,90,242,0.25), transparent 60%)",
            }}
          >
            <div>
              <p className="text-[11px] font-medium mb-0.5" style={{ color: "rgba(242,242,247,0.6)" }}>
                {lang === "ru" ? "Сервер" : "Server"}
              </p>
              <p className="text-[18px] font-semibold leading-tight tracking-tight">{serverInfo.name}</p>
            </div>
          </div>
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center gap-2">
              <IconChip icon={Users} color={accent.blue} size={22} />
              <span className="text-[13px] text-white/75">
                {srv
                  ? `${srv.playersN}/${srv.maxPlayers} ${lang === "ru" ? "игроков" : "players"}${
                      srv.queued > 0 ? ` · +${srv.queued} ${lang === "ru" ? "в очереди" : "queued"}` : ""
                    }`
                  : `${serverInfo.players} ${lang === "ru" ? "игроков" : "players"}`}
              </span>
            </div>
            <span className="flex items-center gap-1.5 text-[10px]" style={{ color: accent.green }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent.green }} />
              {lang === "ru" ? "В сети" : "Online"}
            </span>
          </div>
          <button
            onClick={() => goTo("intel")}
            className="w-full py-3 text-xs font-semibold flex items-center justify-center gap-1.5"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(10,132,255,0.08)", color: accent.blue }}
          >
            {lang === "ru" ? "Инфо о сервере" : "Server info"}
            <ChevronRight size={13} />
          </button>
        </GlassCard>
      )}

      {isLive && live.error && (
        <GlassCard className="p-4 mb-4">
          <p className="text-[11px]" style={{ color: accent.red }}>⚠ {live.error}</p>
        </GlassCard>
      )}

      {/* Мини-карта → полная карта */}
      <GlassCard
        className="p-4 mb-4 cursor-pointer transition-all active:opacity-80"
        onClick={() => goTo("map")}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <IconChip icon={MapIcon} color={accent.purple} size={26} />
            <span className="text-[13px] font-semibold tracking-tight" style={{ color: "rgba(242,242,247,0.94)" }}>
              {lang === "ru" ? "Мини-карта" : "Mini-map"}
            </span>
          </div>
          <span className="flex items-center gap-0.5 text-[11px] font-medium" style={{ color: accent.purple }}>
            {lang === "ru" ? "Открыть карту" : "Open map"}
            <ChevronRight size={12} />
          </span>
        </div>
        <MapCanvas height={140} compact lang={lang} liveView={lv} />
      </GlassCard>

      {/* Мои тимейты */}
      <GlassCard className="p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <IconChip icon={Users} color={accent.green} size={26} />
            <span className="text-[13px] font-semibold tracking-tight" style={{ color: "rgba(242,242,247,0.94)" }}>
              {lang === "ru" ? "Мои тимейты" : "My teammates"}
            </span>
          </div>
          <button
            onClick={() => goTo("map")}
            className="flex items-center gap-0.5 text-[11px] font-medium"
            style={{ color: accent.green }}
          >
            {lang === "ru" ? "Все" : "All"}
            <ChevronRight size={12} />
          </button>
        </div>
        <div className="space-y-2">
          {isLive && lv.members.length === 0 ? (
            <p className="text-[12px] py-3" style={{ color: "rgba(242,242,247,0.35)" }}>
              {lang === "ru" ? "Нет данных о команде." : "No team data yet."}
            </p>
          ) : (
            (isLive ? lv.members : teamMembers).map((m) => (
              <TeammateRow key={m.id} m={m} lang={lang} />
            ))
          )}
        </div>
      </GlassCard>

      {/* Лог тревог и событий */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <IconChip icon={Bell} color={accent.red} size={26} />
            <span className="text-[13px] font-semibold tracking-tight" style={{ color: "rgba(242,242,247,0.94)" }}>
              {lang === "ru" ? "Лог тревог и событий" : "Alarms & Events"}
            </span>
          </div>
          <span
            className="text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(242,242,247,0.5)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: connected ? accent.green : "rgba(255,255,255,0.3)" }}
            />
            {connected ? (lang === "ru" ? "В сети" : "Online") : (lang === "ru" ? "Офлайн" : "Offline")}
          </span>
        </div>
        {connected ? (
          <div className="space-y-2.5">
            {(isLive ? live.alarmLog : sampleAlarms).length === 0 && isLive && (
              <p className="text-[12px] py-3" style={{ color: "rgba(242,242,247,0.35)" }}>
                {lang === "ru" ? "Пока тихо — событий нет." : "All quiet — no events yet."}
              </p>
            )}
            {(isLive ? live.alarmLog : sampleAlarms).map((al) => (
              <div
                key={al.id}
                className="rounded-2xl p-3.5 text-xs flex flex-col gap-1"
                style={{
                  background: al.important ? "rgba(255,69,58,0.10)" : "rgba(255,255,255,0.04)",
                  border: al.important ? "1px solid rgba(255,69,58,0.28)" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="flex justify-between text-[10px]" style={{ color: "rgba(242,242,247,0.4)" }}>
                  <span>Rust+ Push</span>
                  <span>{al.time}</span>
                </div>
                <p className="text-white/90">{t(al.text)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] py-3" style={{ color: "rgba(242,242,247,0.35)" }}>
            {lang === "ru"
              ? "Подключитесь через Rust+, чтобы получать тревоги и события."
              : "Connect via Rust+ to receive alarms and events."}
          </p>
        )}
      </GlassCard>
    </>
  );
}

// ─────────────────────────────────────────────────────────
// ЭКРАН 2: КАРТА (карта + список тимейтов + чат команды)
// ─────────────────────────────────────────────────────────
function ChatCard({ lang, t, live }) {
  const isLive = !!(live && live.mode !== "mock");
  const [draft, setDraft] = useState("");
  const [mockMsgs, setMockMsgs] = useState(chatLog);
  const [pendingLocal, setPendingLocal] = useState([]);

  const send = async () => {
    const txt = draft.trim();
    if (!txt) return;
    if (isLive) {
      const k = "loc-" + Date.now() + "-" + Math.random();
      setPendingLocal((p) => [...p, { author: lang === "ru" ? "Вы" : "You", text: txt, mine: true, key: k }]);
      try {
        await live.actions.sendChat(txt);
      } catch (e) {
        // ошибка уйдёт в общий статус источника на Мейне
      }
      setTimeout(() => setPendingLocal((p) => p.filter((x) => x.key !== k)), 8000);
    } else {
      setMockMsgs([...mockMsgs, { author: lang === "ru" ? "Вы" : "You", ru: txt, en: txt, mine: true }]);
    }
    setDraft("");
  };

  const msgs = isLive
    ? [
        ...live.chat.map((c) => ({ author: c.author, text: c.text, mine: c.mine, key: c.key })),
        ...pendingLocal,
      ]
    : mockMsgs;

  return (
    <GlassCard className="p-5">
      <SectionHeader icon={MessageSquare} color={accent.green} title={lang === "ru" ? "Чат команды" : "Team Chat"} />
      <div className="space-y-3 mb-3 pr-1 max-h-[40vh] overflow-y-auto">
        {msgs.length === 0 && (
          <p className="text-[12px] py-3" style={{ color: "rgba(242,242,247,0.35)" }}>
            {lang === "ru" ? "Сообщений пока нет." : "No messages yet."}
          </p>
        )}
        {msgs.map((c, i) => (
          <div key={c.key || i} className={"flex " + (c.mine ? "justify-end" : "justify-start")}>
            <div
              className="max-w-[75%] rounded-2xl px-3.5 py-2.5"
              style={{
                background: c.mine ? "rgba(10,132,255,0.22)" : "rgba(255,255,255,0.07)",
                border: c.mine ? "1px solid rgba(10,132,255,0.4)" : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {!c.mine && (
                <p className="text-[10px] mb-0.5" style={{ color: accent.green }}>
                  {c.author}
                </p>
              )}
              <p className="text-[13px] text-white/90">{isLive ? c.text : t(c)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={lang === "ru" ? "Сообщение команде..." : "Message the team..."}
          className="flex-1 rounded-full px-4 py-2.5 text-sm bg-white/5 outline-none placeholder-white/30"
          style={{ border: "1px solid rgba(255,255,255,0.12)" }}
        />
        <button
          onClick={send}
          className="rounded-full p-2.5"
          style={{ background: accent.blue, boxShadow: `0 4px 14px ${accent.blue}66` }}
        >
          <Send size={16} className="text-white" />
        </button>
      </div>
    </GlassCard>
  );
}

function MapScreenFull({ lang, t, live }) {
  const isLive = !!(live && live.mode !== "mock");
  const lv = buildLiveView(live);
  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <SectionHeader icon={MapIcon} color={accent.purple} title={lang === "ru" ? "Карта мира" : "World Map"} />
        {isLive && live.status !== "connected" && (
          <p className="text-[11px] mb-2" style={{ color: accent.red }}>⚠ {live.error || (lang === "ru" ? "Нет связи с источником данных." : "No connection to the data source.")}</p>
        )}
        <MapCanvas height={280} lang={lang} liveView={lv} />
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
          {[
            { c: accent.blue, l: { ru: "Тимейты", en: "Teammates" } },
            { c: accent.red, l: { ru: "Вертолёт", en: "Heli" } },
            { c: accent.teal, l: "Cargo Ship" },
            { c: accent.orange, l: { ru: "Чинук", en: "Chinook" } },
            { c: accent.yellow, l: { ru: "Аирдроп", en: "Airdrop" } },
          ].map((lg, i) => (
            <span key={i} className="flex items-center gap-1.5 text-[10px]" style={{ color: "rgba(242,242,247,0.55)" }}>
              <span className="w-2 h-2 rounded-full" style={{ background: lg.c }} />
              {t(lg.l)}
            </span>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <SectionHeader icon={Users} color={accent.green} title={lang === "ru" ? "Тимейты в команде" : "Team members"} />
        <div className="space-y-2">
          {isLive && lv.members.length === 0 ? (
            <p className="text-[12px] py-3" style={{ color: "rgba(242,242,247,0.35)" }}>
              {lang === "ru" ? "Нет данных о команде." : "No team data yet."}
            </p>
          ) : (
            (isLive ? lv.members : teamMembers).map((m) => (
              <TeammateRow key={m.id} m={m} lang={lang} />
            ))
          )}
        </div>
      </GlassCard>

      <ChatCard lang={lang} t={t} live={live} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ЭКРАН 3: УМНЫЙ ДОМ (устройства + камеры Rust+)
// ─────────────────────────────────────────────────────────
function SmartHomeScreen({ lang, live }) {
  const isLive = !!(live && live.mode !== "mock");
  const [mockDevices, setMockDevices] = useState(initialSmartDevices);
  const [cameras, setCameras] = useState(initialCameras);
  const [activeCam, setActiveCam] = useState(null);
  const [pendingIds, setPendingIds] = useState({});

  const toggleDevice = async (dev) => {
    if (isLive) {
      const id = String(dev.id);
      setPendingIds((p) => ({ ...p, [id]: true }));
      try {
        await live.actions.toggleSwitch(id, !dev.value);
      } catch (e) { /* статус источника покажет проблему */ }
      setTimeout(() => {
        setPendingIds((p) => {
          const next = { ...p };
          delete next[id];
          return next;
        });
      }, 6000);
    } else {
      setMockDevices(mockDevices.map((d) => (d.id === dev.id ? { ...d, active: !d.active } : d)));
    }
  };

  // Живые устройства приходят из Rust+ (switch/alarm/storage_monitor)
  const devices = isLive
    ? Object.values(live.devices).map((d) => ({
        id: String(d.id),
        name: d.name,
        type: d.type,
        value: !!d.value,
        capacity: d.capacity || null,
        hasProtection: !!d.hasProtection,
        protectionExpiry: d.protectionExpiry || 0,
        items: Array.isArray(d.items) ? d.items : [],
      }))
    : mockDevices;

  const sublineFor = (dev) => {
    if (!isLive) return dev.type === "turret" ? `Ammo: ${dev.ammo}` : `Power: ${dev.power}`;
    if (dev.type === "alarm") return lang === "ru" ? (dev.value ? "Сработала!" : "Тишина") : dev.value ? "Triggered!" : "Silent";
    if (dev.type === "storage_monitor") {
      const secsLeft = dev.protectionExpiry - Date.now() / 1000;
      const prot = dev.hasProtection && secsLeft > 0 ? " · 🛡 " + fmtDuration(secsLeft) : "";
      return `${dev.items.length}/${dev.capacity == null ? "?" : dev.capacity} ${lang === "ru" ? "слотов" : "slots"}${prot}`;
    }
    return lang === "ru" ? "Умный переключатель" : "Smart switch";
  };

  return (
    <div className="space-y-4">
      <GlassCard className="p-5">
        <SectionHeader icon={Lightbulb} color={accent.yellow} title={lang === "ru" ? "Устройства Rust+" : "Rust+ Devices"} />
        <div className="space-y-2.5">
          {devices.length === 0 && isLive && (
            <p className="text-[12px] py-3" style={{ color: "rgba(242,242,247,0.35)" }}>
              {lang === "ru"
                ? "Устройства не найдены. Проверь список entityId в источнике данных."
                : "No devices found. Check the entityId list in the data source."}
            </p>
          )}
          {devices.map((dev) => {
            const isSwitch = isLive ? dev.type === "switch" : true;
            const active = isLive ? dev.value : dev.active;
            const busy = isLive && !!pendingIds[String(dev.id)];
            return (
              <div
                key={dev.id}
                className="flex items-center justify-between rounded-2xl px-4 py-3"
                style={{
                  background: dev.type === "alarm" && active ? "rgba(255,69,58,0.10)" : active ? "rgba(255,214,10,0.10)" : "rgba(255,255,255,0.04)",
                  border:
                    dev.type === "alarm" && active
                      ? "1px solid rgba(255,69,58,0.3)"
                      : active
                      ? "1px solid rgba(255,214,10,0.3)"
                      : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-medium text-white/90 truncate">{dev.name}</p>
                  <p className="text-[10px] text-white/35">{sublineFor(dev)}</p>
                </div>
                {isSwitch ? (
                  <button
                    onClick={() => toggleDevice(dev)}
                    disabled={busy}
                    className="px-3.5 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                    style={{
                      background: active ? accent.yellow : "rgba(255,255,255,0.08)",
                      color: active ? "#1a1400" : "rgba(255,255,255,0.55)",
                    }}
                  >
                    <Power size={12} />
                    {busy
                      ? "…"
                      : active
                      ? lang === "ru"
                        ? "ВКЛ"
                        : "ON"
                      : lang === "ru"
                      ? "ВЫКЛ"
                      : "OFF"}
                  </button>
                ) : (
                  <span
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0"
                    style={{
                      background: active ? "rgba(255,69,58,0.16)" : "rgba(255,255,255,0.06)",
                      color: active ? accent.red : "rgba(255,255,255,0.4)",
                    }}
                  >
                    {active ? (lang === "ru" ? "ТРЕВОГА" : "ALARM") : lang === "ru" ? "ТИХО" : "OK"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[10.5px] mt-3" style={{ color: "rgba(242,242,247,0.35)" }}>
          {isLive
            ? lang === "ru"
              ? "Переключение отправляется в игру; состояние обновится после подтверждения от сервера."
              : "Toggle commands go to the game; state updates after the server confirms."
            : lang === "ru"
            ? "Переключатели и турели подтягиваются автоматически после подключения Rust+."
            : "Switches and turrets sync automatically after Rust+ pairing."}
        </p>
      </GlassCard>

      <GlassCard className="p-5">
        <SectionHeader icon={Video} color={accent.teal} title={lang === "ru" ? "Камеры (CCTV)" : "Cameras (CCTV)"} />
        <div className="space-y-2.5 mb-3">
          {cameras.map((cam) => (
            <div
              key={cam.id}
              className="flex items-center justify-between rounded-2xl px-4 py-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: cam.online ? accent.green : "rgba(255,255,255,0.25)" }}
                />
                <p className="text-xs font-medium text-white/90 truncate">{cam.name}</p>
              </div>
              <button
                onClick={() => setActiveCam(activeCam === cam.id ? null : cam.id)}
                disabled={!cam.online}
                className="px-3.5 py-1.5 rounded-full text-[11px] font-semibold shrink-0 disabled:opacity-30"
                style={{
                  background: activeCam === cam.id ? "rgba(255,69,58,0.16)" : "rgba(255,255,255,0.08)",
                  color: activeCam === cam.id ? accent.red : "rgba(255,255,255,0.65)",
                }}
              >
                {activeCam === cam.id ? (lang === "ru" ? "Закрыть" : "Close") : (lang === "ru" ? "Смотреть" : "View")}
              </button>
            </div>
          ))}
        </div>

        {activeCam && (
          <div
            className="relative rounded-2xl overflow-hidden mb-2"
            style={{ height: 170, background: "radial-gradient(circle at 50% 40%, rgba(100,210,255,0.10), #060608 75%)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <div className="absolute top-2.5 left-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent.red }} />
              <span className="text-[9px] font-bold tracking-widest" style={{ color: accent.red }}>REC</span>
            </div>
            <div className="absolute bottom-2.5 left-3 text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
              {cameras.find((c) => c.id === activeCam)?.name}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Video size={28} color="rgba(255,255,255,0.18)" />
            </div>
          </div>
        )}
        <p className="text-[10.5px]" style={{ color: "rgba(242,242,247,0.35)" }}>
          {isLive
            ? lang === "ru"
              ? "Прямой эфир камер недоступен в веб-версии — смотри мобильное приложение."
              : "Live camera streams aren't available in the web version — use the mobile app."
            : lang === "ru"
            ? "Камеры подключаются по CCTV ID из Rust+. Офлайн-камеры нельзя открыть."
            : "Cameras pair via CCTV ID from Rust+. Offline cameras can't be opened."}
        </p>
      </GlassCard>
    </div>
  );
}


// ─────────────────────────────────────────────────────────
// ЭКРАН 4: ПРОБИВ (инфа о сервере: очередь, пинг, рестарты)
// ─────────────────────────────────────────────────────────
function IntelScreen({ lang, t, live }) {
  const [alertThreshold, setAlertThreshold] = useState(20);
  const [alertOn, setAlertOn] = useState(true);

  const isLive = !!(live && live.mode !== "mock");
  const srv = isLive ? live.server : null;
  const wipeDays = srv && srv.wipeTime ? Math.max(0, Math.floor((Date.now() / 1000 - srv.wipeTime) / 86400)) : null;

  const maxQueue = Math.max(...queueHistory.map((q) => q.queue), 1);
  const currentQueue = queueHistory[queueHistory.length - 2].queue;
  const currentPing = queueHistory[queueHistory.length - 2].ping;

  const summary = [
    {
      icon: Users,
      color: accent.blue,
      value: srv ? `${srv.playersN}/${srv.maxPlayers}` : serverInfo.players,
      label: { ru: "Игроков онлайн", en: "Players online" },
    },
    {
      icon: Clock,
      color: accent.orange,
      value: srv ? "—" : serverInfo.time,
      label: srv ? { ru: "Время (нет в Rust+ API)", en: "Time (not in Rust+ API)" } : { ru: "Время на сервере", en: "Server time" },
    },
    {
      icon: RotateCw,
      color: accent.green,
      value: wipeDays != null ? `${wipeDays} ${lang === "ru" ? "дн. назад" : "days ago"}` : t(serverInfo.lastWipe),
      label: { ru: "Последний вайп", en: "Last wipe" },
    },
    {
      icon: MapIcon,
      color: accent.purple,
      value: srv ? `${Math.max(1, Math.round(srv.mapSizeM / 1000))}K` : serverInfo.mapSize,
      label: { ru: "Размер карты", en: "Map size" },
      seed: srv ? (srv.seed ? "seed " + srv.seed : "") : serverInfo.seed,
    },
  ];

  return (
    <div className="space-y-4">
      <GlassCard className="p-5">
        <SectionHeader icon={Activity} color={accent.blue} title={lang === "ru" ? "Пробив сервера" : "Server Intel"} />
        {isLive && (
          <p className="text-[10px] mb-3 flex items-center gap-1.5" style={{ color: srv ? accent.green : accent.red }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: srv ? accent.green : accent.red }} />
            {srv
              ? lang === "ru"
                ? "Живые данные Rust+ · онлайн и очередь обновляются автоматически"
                : "Live Rust+ data · online and queue refresh automatically"
              : live.error || (lang === "ru" ? "Нет живых данных сервера." : "No live server data.")}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-2xl p-3.5 col-span-2" style={{ background: "rgba(10,132,255,0.10)", border: `1px solid ${accent.blue}44` }}>
            <p className="text-[14px] font-semibold leading-tight">{srv && srv.name ? srv.name : serverInfo.name}</p>
            <p className="text-[9px] text-white/25 mt-1 truncate">
              {srv && srv.seed ? "seed " + srv.seed : serverInfo.seed}
            </p>
          </div>
          {summary.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="rounded-2xl p-3.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <IconChip icon={Icon} color={s.color} size={24} />
                <p className="mt-2 text-[15px] font-semibold leading-none tracking-tight">{s.value}</p>
                <p className="mt-1 text-[10px]" style={{ color: "rgba(242,242,247,0.45)" }}>{t(s.label)}</p>
              </div>
            );
          })}
        </div>

        {/* Очередь за 24ч */}
        <p className="text-[11px] text-white/40 mb-2">{lang === "ru" ? "Очередь за последние 24 часа" : "Queue over last 24h"}</p>
        <div className="flex items-end gap-1.5 h-20 mb-1.5">
          {queueHistory.map((q, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
              <div
                className="w-full rounded-t-md"
                style={{
                  height: `${Math.max(6, (q.queue / maxQueue) * 100)}%`,
                  background: `linear-gradient(180deg, ${accent.blue}, ${accent.blue}55)`,
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 mb-4">
          {queueHistory.map((q, i) => (
            <span key={i} className="flex-1 text-center text-[8.5px] text-white/30">{q.h}</span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-3.5" style={{ background: "rgba(10,132,255,0.10)", border: `1px solid ${accent.blue}44` }}>
            <p className="text-[20px] font-bold" style={{ color: accent.blue }}>{srv ? srv.queued : currentQueue}</p>
            <p className="text-[10.5px] text-white/45 mt-0.5">{lang === "ru" ? "Сейчас в очереди" : "In queue now"}</p>
          </div>
          <div className="rounded-2xl p-3.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-[20px] font-bold text-white/90">{currentPing} ms</p>
            <p className="text-[10.5px] text-white/45 mt-0.5">{lang === "ru" ? "Средний пинг" : "Average ping"}</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        {/* Алерт на очередь */}
        <div className="rounded-2xl p-3.5 mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs text-white/70 flex items-center gap-1.5">
              <Bell size={13} style={{ color: accent.yellow }} />
              {lang === "ru" ? "Алерт при снижении очереди ниже" : "Alert when queue drops below"}
            </span>
            <button
              onClick={() => setAlertOn(!alertOn)}
              className="px-3 py-1 rounded-full text-[10px] font-semibold"
              style={{
                background: alertOn ? "rgba(255,214,10,0.18)" : "rgba(255,255,255,0.06)",
                color: alertOn ? accent.yellow : "rgba(255,255,255,0.4)",
              }}
            >
              {alertOn ? (lang === "ru" ? "ВКЛ" : "ON") : (lang === "ru" ? "ВЫКЛ" : "OFF")}
            </button>
          </div>
          <Segmented
            color={accent.yellow}
            value={alertThreshold}
            onChange={setAlertThreshold}
            options={queueAlertPresets.map((v) => ({ value: v, label: `< ${v}` }))}
          />
        </div>

        {/* Рестарты */}
        <p className="text-[11px] text-white/40 mb-2 flex items-center gap-1.5">
          <AlarmClock size={12} />
          {lang === "ru" ? "Плановые рестарты" : "Restart schedule"}
        </p>
        <div className="space-y-2">
          {restartSchedule.map((r, i) => (
            <div key={i} className="flex items-center justify-between rounded-2xl px-3.5 py-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div>
                <p className="text-xs text-white/85">{t(r.label)}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{t(r.when)}</p>
              </div>
              <span className="text-[9.5px] font-semibold px-2 py-1 rounded-full shrink-0" style={{ background: `${r.color}22`, color: r.color }}>
                {t(r.tag)}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ЭКРАН 5: ДРУГОЕ (подвыбор разделов)
// ─────────────────────────────────────────────────────────
const otherSections = [
  { id: "binds", icon: Terminal, color: accent.teal, title: { ru: "Бинды", en: "Binds" }, desc: { ru: "Полезные команды консоли для копирования", en: "Useful console commands to copy" } },
  { id: "pros", icon: Crosshair, color: accent.pink, title: { ru: "Настройки про игроков", en: "Pro Settings" }, desc: { ru: "Сенса, DPI, FOV известных игроков", en: "Sens, DPI, FOV of known players" } },
  { id: "info", icon: BookOpen, color: accent.orange, title: { ru: "Полезная информация", en: "Useful Info" }, desc: { ru: "Лут с ящиков, ботов, мирки, чертежи, карты", en: "Crate loot, bots, shops, blueprints, cards" } },
  { id: "tools", icon: Calculator, color: accent.red, title: { ru: "Инструменты", en: "Tools" }, desc: { ru: "Рейд, коды, карьеры, нефтекачка, ферма, переработка", en: "Raid, codes, quarries, oil pump, farm, recycler" } },
];

function OtherScreen({ lang, t }) {
  const [sub, setSub] = useState(null);

  if (!sub) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {otherSections.map((sec) => {
          const Icon = sec.icon;
          return (
            <button
              key={sec.id}
              onClick={() => setSub(sec.id)}
              className="text-left rounded-[22px] p-4 transition-all active:opacity-80"
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                background: `linear-gradient(160deg, ${sec.color}18, rgba(255,255,255,0.05))`,
                boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
              }}
            >
              <IconChip icon={Icon} color={sec.color} size={34} />
              <p className="mt-3 text-[13px] font-semibold leading-snug tracking-tight">{t(sec.title)}</p>
              <p className="mt-1 text-[10px] leading-snug" style={{ color: "rgba(242,242,247,0.45)" }}>{t(sec.desc)}</p>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setSub(null)}
        className="mb-4 flex items-center gap-1 text-xs font-medium rounded-full px-3 py-2"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)" }}
      >
        <ChevronLeft size={13} />
        {lang === "ru" ? "Назад" : "Back"}
      </button>
      {sub === "binds" && <BindsScreen lang={lang} />}
      {sub === "pros" && <ProConfigsScreen lang={lang} />}
      {sub === "info" && <InfoScreen lang={lang} t={t} />}
      {sub === "tools" && <ToolsScreen lang={lang} t={t} />}
    </>
  );
}

// ───── Другое → Бинды ─────
function BindsScreen({ lang }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const handleCopy = (key, value) => {
    try {
      navigator.clipboard?.writeText(value);
    } catch (e) {
      // clipboard may be unavailable in sandboxed preview — fail silently
    }
    setCopiedKey(key);
    window.clearTimeout(handleCopy._t);
    handleCopy._t = window.setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <GlassCard className="p-5">
      <SectionHeader icon={Terminal} color={accent.teal} title={lang === "ru" ? "Полезные бинды" : "Useful Binds"} />
      <div className="space-y-4">
        {rustBindsCategories.map((cat) => (
          <div key={cat.id}>
            <p className="text-[11px] font-semibold mb-2" style={{ color: cat.color }}>
              {lang === "ru" ? cat.title.ru : cat.title.en}
            </p>
            <div className="space-y-2">
              {cat.binds.map((b, i) => {
                const key = `${cat.id}-${i}`;
                return (
                  <div key={key} className="rounded-2xl p-3 flex items-center justify-between gap-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="min-w-0">
                      <p className="text-[11px] font-mono text-white/85 truncate">{b.cmd}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">{lang === "ru" ? b.desc.ru : b.desc.en}</p>
                    </div>
                    <CopyPill value={b.cmd} copied={copiedKey === key} onCopy={(v) => handleCopy(key, v)} lang={lang} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ───── Другое → Настройки про игроков ─────
function ProConfigsScreen({ lang }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const handleCopy = (key, value) => {
    try {
      navigator.clipboard?.writeText(value);
    } catch (e) {}
    setCopiedKey(key);
    window.clearTimeout(handleCopy._t);
    handleCopy._t = window.setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <GlassCard className="p-5">
      <SectionHeader icon={Crosshair} color={accent.pink} title={lang === "ru" ? "Настройки про-игроков" : "Pro Player Settings"} />
      <p className="text-[11px] mb-3" style={{ color: "rgba(242,242,247,0.4)" }}>
        {lang === "ru"
          ? "Шаблон карточек для наполнения — значения нужно заменить на подтверждённые настройки авторов."
          : "Card template to fill in — replace values with confirmed creator settings."}
      </p>
      <div className="space-y-2.5">
        {proConfigs.map((p, i) => {
          const key = `pro-${i}`;
          const configString = `sens ${p.sens}; dpi ${p.dpi}; fov ${p.fov}; res ${p.res}`;
          return (
            <div key={key} className="rounded-2xl p-3.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-white/90">{p.name}</p>
                <CopyPill value={configString} copied={copiedKey === key} onCopy={(v) => handleCopy(key, v)} lang={lang} />
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: "Sens", value: p.sens },
                  { label: "DPI", value: p.dpi },
                  { label: "FOV", value: p.fov },
                  { label: lang === "ru" ? "Разр." : "Res", value: p.res },
                ].map((f, j) => (
                  <div key={j} className="rounded-xl py-1.5" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <p className="text-[11px] font-bold" style={{ color: accent.pink }}>{f.value}</p>
                    <p className="text-[8.5px] text-white/35 mt-0.5">{f.label}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ───── Другое → Полезная информация ─────
function InfoScreen({ lang, t }) {
  return (
    <div className="space-y-4">
      {/* Лут с ящиков */}
      <GlassCard className="p-5">
        <SectionHeader icon={Package} color={accent.red} title={lang === "ru" ? "Лут с ящиков и контейнеров" : "Crate & Container Loot"} />
        <div className="space-y-2.5">
          {crateLoot.map((c, i) => (
            <div key={i} className="rounded-2xl p-3.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between mb-1 gap-2">
                <p className="text-xs font-semibold text-white/90">{t(c.name)}</p>
                <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: `${accent.red}22`, color: accent.red }}>
                  {t(c.tag)}
                </span>
              </div>
              <p className="text-[11px] leading-snug" style={{ color: "rgba(242,242,247,0.55)" }}>{t(c.loot)}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Лут с ботов */}
      <GlassCard className="p-5">
        <SectionHeader icon={Crosshair} color={accent.teal} title={lang === "ru" ? "Лут с ботов (NPC)" : "NPC Loot"} />
        <div className="space-y-2.5">
          {npcLoot.map((n, i) => (
            <div key={i} className="rounded-2xl p-3.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs font-semibold text-white/90 mb-0.5">{t(n.name)}</p>
              <p className="text-[11px] leading-snug" style={{ color: "rgba(242,242,247,0.55)" }}>{t(n.loot)}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Мирки: что продаётся */}
      <GlassCard className="p-5">
        <SectionHeader icon={ShoppingBag} color={accent.orange} title={lang === "ru" ? "Что продаётся в мирках" : "Safe Zone Shops"} />
        <div className="space-y-3">
          {safeZoneShops.map((shop, i) => (
            <div key={i} className="rounded-2xl p-3.5" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: accent.orange }}>{t(shop.store)}</p>
              <div className="space-y-1.5">
                {shop.items.map((it, j) => (
                  <div key={j} className="flex items-center justify-between text-xs gap-3">
                    <span className="text-white/80">{t(it.name)}</span>
                    <span className="text-right shrink-0" style={{ color: accent.yellow }}>
                      {typeof it.price === "object" ? t(it.price) : it.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <SectionHeader icon={Store} color={accent.pink} title={lang === "ru" ? "Ещё в мирных зонах" : "More in Safe Zones"} />
        <div className="space-y-1.5">
          {[
            { name: { ru: "Аутпост — общий ассортимент", en: "Outpost — general stock" } },
            { name: { ru: "Бандитский лагерь — Колесо удачи, AirWolf", en: "Bandit Camp — Wheel of Misfortune, AirWolf" } },
            { name: { ru: "Апартаменты — аренда комнат и частные магазины", en: "Apartment Complex — rentable rooms & player shops" } },
          ].map((row, i) => (
            <div key={i} className="text-xs text-white/70 py-1.5">{t(row.name)}</div>
          ))}
        </div>
      </GlassCard>

      {/* Чертежи и верстак */}
      <GlassCard className="p-5">
        <SectionHeader icon={Hammer} color={accent.blue} title={lang === "ru" ? "Чертежи и верстак" : "Blueprints & Workbench"} />
        <div className="space-y-2">
          {workbenchLevels.map((wb) => (
            <div key={wb.level} className="flex items-start gap-3 rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: accent.blue, color: "#fff" }}>
                {wb.level}
              </span>
              <p className="text-[12px] text-white/80 pt-1">{t(wb.req)}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Фрагменты */}
      <GlassCard className="p-5">
        <SectionHeader icon={FlaskConical} color={accent.teal} title={lang === "ru" ? "Где искать фрагменты чертежей" : "Where to find Blueprint Fragments"} />
        <div className="space-y-2">
          {fragmentSources.map((f, i) => (
            <div key={i} className="flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="text-white/80">{t(f.name)}</span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: t(f.tag) === (lang === "ru" ? "Улучшенный" : "Advanced") ? "rgba(255,159,10,0.18)" : "rgba(100,210,255,0.18)",
                  color: t(f.tag) === (lang === "ru" ? "Улучшенный" : "Advanced") ? accent.orange : accent.teal,
                }}
              >
                {t(f.tag)}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Чаи */}
      <GlassCard className="p-5">
        <SectionHeader icon={Coffee} color={accent.green} title={lang === "ru" ? "Рецепты чайных баффов" : "Tea Buff Recipes"} />
        <div className="space-y-2.5">
          {teaRecipes.map((tea, i) => (
            <div key={i} className="rounded-2xl p-3.5" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-white/85">{t(tea.name)}</p>
                <span className="text-xs font-bold" style={{ color: accent.green }}>{tea.effect}</span>
              </div>
              <p className="text-[11px] text-white/40">{tea.ingredients}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Карты доступа */}
      <GlassCard className="p-5">
        <SectionHeader icon={Key} color={accent.teal} title={lang === "ru" ? "Карты доступа и где их искать" : "Access Cards Guide"} />
        <div className="space-y-2.5">
          {accessCardsInfo.map((card, i) => (
            <div key={i} className="rounded-2xl p-3.5" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
              <p className="text-xs font-medium mb-0.5" style={{ color: accent.teal }}>{t(card.color)}</p>
              <p className="text-[11px] text-white/60">{t(card.location)}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Монументы */}
      <GlassCard className="p-5">
        <SectionHeader icon={ScrollText} color={accent.red} title={lang === "ru" ? "Монументы и радиация" : "Monuments & Radiation"} />
        <div className="space-y-2">
          {monumentsData.map((mon, i) => (
            <div key={i} className="flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="font-medium">{t(mon.name)}</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px]" style={{ color: accent.red }}>Rad: {mon.rad}</span>
                <span className="text-[10px]" style={{ color: accent.teal }}>{mon.cards}</span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}


// ─────────────────────────────────────────────────────────
// ЭКРАН 5 (продолжение): ИНСТРУМЕНТЫ
// ─────────────────────────────────────────────────────────
// Рейд-калькулятор: Обычный / Эко / Кастомный
function RaidTool({ lang, t }) {
  const [mode, setMode] = useState("normal");
  const [selectedTarget, setSelectedTarget] = useState(raidTargets[0]);
  const [targetCount, setTargetCount] = useState(1);
  const [customCounts, setCustomCounts] = useState({ c4: 0, rocket: 0, sat: 0, bean: 0, ammo: 0 });

  const statColors = [accent.red, accent.orange, accent.green, accent.blue];
  const customDamage = explosiveTypes.reduce((sum, ex) => sum + ex.dmg * (customCounts[ex.id] || 0), 0);
  const customHp = selectedTarget.hp * targetCount;
  const customPct = Math.min(100, Math.round((customDamage / customHp) * 100));

  return (
    <GlassCard className="p-5">
      <SectionHeader icon={Calculator} color={accent.red} title={lang === "ru" ? "Калькулятор рейда" : "Raid Calculator"} />
      <Segmented
        color={accent.red}
        value={mode}
        onChange={(v) => { setMode(v); setSelectedTarget(raidTargets[0]); }}
        options={[
          { value: "normal", label: lang === "ru" ? "Обычный" : "Standard" },
          { value: "eco", label: lang === "ru" ? "Эко" : "Eco" },
          { value: "custom", label: lang === "ru" ? "Кастомный" : "Custom" },
        ]}
      />

      {/* ── Обычный: таблица взрывчатки ── */}
      {mode === "normal" && (
        <>
          <div className="grid grid-cols-2 gap-2 mt-4 mb-3">
            {raidTargets.map((rt) => (
              <button
                key={rt.id}
                onClick={() => setSelectedTarget(rt)}
                className="p-3 rounded-2xl text-left text-xs transition-all"
                style={{
                  background: selectedTarget.id === rt.id ? "rgba(255,69,58,0.14)" : "rgba(255,255,255,0.04)",
                  border: selectedTarget.id === rt.id ? `1px solid ${accent.red}` : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <p className="font-medium truncate">{t(rt.name)}</p>
                <p className="text-[10px] text-white/40">HP: {rt.hp}</p>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-xs text-white/60">{lang === "ru" ? "Количество блоков:" : "Amount:"}</span>
            <div className="flex items-center gap-2">
              <StepperButton onClick={() => setTargetCount(Math.max(1, targetCount - 1))}><Minus size={14} /></StepperButton>
              <span className="text-sm font-semibold w-6 text-center">{targetCount}</span>
              <StepperButton onClick={() => setTargetCount(targetCount + 1)}><Plus size={14} /></StepperButton>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: "C4", count: selectedTarget.c4 * targetCount },
              { label: { ru: "Ракеты", en: "Rockets" }, count: selectedTarget.rockets * targetCount },
              { label: "Satchels", count: selectedTarget.satchels * targetCount },
              { label: { ru: "Патроны", en: "Expl. Ammo" }, count: selectedTarget.ammo * targetCount },
            ].map((res, i) => (
              <div key={i} className="rounded-2xl p-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-base font-bold" style={{ color: statColors[i] }}>{res.count}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{typeof res.label === "object" ? t(res.label) : res.label}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Эко: мягкая сторона инструментами ── */}
      {mode === "eco" && (
        <>
          <p className="text-[11px] mt-4 mb-3" style={{ color: "rgba(242,242,247,0.45)" }}>
            {lang === "ru"
              ? "Эко-рейд через мягкую сторону инструментами. Значения примерные."
              : "Eco raiding via soft side with tools. Values are approximate."}
          </p>
          <div className="space-y-2">
            {raidTargets.map((rt) => {
              const em = ecoMethods[rt.id];
              if (!em) return null;
              return (
                <div key={rt.id} className="rounded-2xl p-3.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-xs font-semibold text-white/90">{t(rt.name)}</p>
                  <div className="flex items-center justify-between mt-1 gap-2">
                    <p className="text-[11px] text-white/55">{t(em.tool)}</p>
                    <span className="text-[10px] font-semibold shrink-0" style={{ color: accent.orange }}>{em.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Кастомный: свой запас взрывчатки ── */}
      {mode === "custom" && (
        <>
          <div className="flex flex-wrap gap-2 mt-4 mb-3">
            {raidTargets.map((rt) => (
              <button
                key={rt.id}
                onClick={() => setSelectedTarget(rt)}
                className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-all"
                style={{
                  background: selectedTarget.id === rt.id ? "rgba(255,69,58,0.14)" : "rgba(255,255,255,0.04)",
                  border: selectedTarget.id === rt.id ? `1px solid ${accent.red}` : "1px solid rgba(255,255,255,0.08)",
                  color: selectedTarget.id === rt.id ? accent.red : "rgba(255,255,255,0.6)",
                }}
              >
                {t(rt.name)}
              </button>
            ))}
          </div>

          <div className="space-y-2 mb-4">
            {explosiveTypes.map((ex) => (
              <div key={ex.id} className="flex items-center justify-between rounded-2xl px-3.5 py-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div>
                  <p className="text-xs font-medium text-white/90">{typeof ex.label === "object" ? t(ex.label) : ex.label}</p>
                  <p className="text-[10px] text-white/35">≈ {ex.dmg} {lang === "ru" ? "урона" : "dmg"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StepperButton onClick={() => setCustomCounts({ ...customCounts, [ex.id]: Math.max(0, (customCounts[ex.id] || 0) - 1) })}><Minus size={14} /></StepperButton>
                  <span className="text-sm font-semibold w-6 text-center">{customCounts[ex.id] || 0}</span>
                  <StepperButton onClick={() => setCustomCounts({ ...customCounts, [ex.id]: (customCounts[ex.id] || 0) + 1 })}><Plus size={14} /></StepperButton>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-3.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-white/50">{lang === "ru" ? "Суммарный урон против HP цели" : "Total damage vs target HP"}</span>
              <span className="font-bold" style={{ color: accent.red }}>{customDamage} / {customHp}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${customPct}%`, background: customPct >= 100 ? accent.green : accent.red }} />
            </div>
            <p className="text-[11px] mt-2 font-medium" style={{ color: customPct >= 100 ? accent.green : accent.red }}>
              {customPct >= 100
                ? (lang === "ru" ? "Хватит с запасом" : "Enough, with spare")
                : (lang === "ru" ? `Не хватает ≈ ${customHp - customDamage} урона` : `≈ ${customHp - customDamage} damage short`)}
            </p>
            <p className="text-[9.5px] mt-1.5 text-white/30">
              {lang === "ru" ? "Урон по постройкам примерный и зависит от материала." : "Structure damage is approximate and varies by material."}
            </p>
          </div>
        </>
      )}
    </GlassCard>
  );
}

// Взлом дверных кодов: оценка числа комбинаций и времени
function CodesTool({ lang }) {
  const [known, setKnown] = useState([]);
  const [fixedPos, setFixedPos] = useState(0);
  const [attemptSec, setAttemptSec] = useState(2);

  const unknownSlots = Math.max(0, 4 - fixedPos);
  const pool = Math.max(1, 10 - known.length);
  const combos = Math.pow(pool, unknownSlots);
  const seconds = combos * attemptSec;

  const toggleDigit = (d) => setKnown(known.includes(d) ? known.filter((x) => x !== d) : [...known, d]);

  return (
    <GlassCard className="p-5">
      <SectionHeader icon={Lock} color={accent.purple} title={lang === "ru" ? "Взлом дверных кодов" : "Door Code Cracker"} />
      <p className="text-[11px] mb-3" style={{ color: "rgba(242,242,247,0.45)" }}>
        {lang === "ru"
          ? "Отметьте цифры, которые точно есть в коде (подсмотрели следы/звуки), и известные позиции."
          : "Mark digits you know are in the code (watched presses/heard clicks) and known positions."}
      </p>

      <div className="grid grid-cols-5 gap-2 mb-4">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
          const on = known.includes(d);
          return (
            <button
              key={d}
              onClick={() => toggleDigit(d)}
              className="py-2 rounded-xl text-sm font-bold transition-all"
              style={{
                background: on ? "rgba(191,90,242,0.18)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${on ? accent.purple : "rgba(255,255,255,0.08)"}`,
                color: on ? accent.purple : "rgba(255,255,255,0.55)",
              }}
            >
              {d}
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-white/50 mb-1.5">{lang === "ru" ? "Известно позиций точно:" : "Positions known exactly:"}</p>
      <Segmented
        color={accent.purple}
        value={fixedPos}
        onChange={setFixedPos}
        options={[0, 1, 2, 3].map((v) => ({ value: v, label: String(v) }))}
      />

      <p className="text-[11px] text-white/50 mb-1.5 mt-4">{lang === "ru" ? "Время на одну попытку:" : "Time per attempt:"}</p>
      <Segmented
        color={accent.purple}
        value={attemptSec}
        onChange={setAttemptSec}
        options={[1, 2, 3, 5].map((v) => ({ value: v, label: `${v} сек` }))}
      />

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-2xl p-3.5 text-center" style={{ background: "rgba(191,90,242,0.10)", border: `1px solid ${accent.purple}44` }}>
          <p className="text-lg font-bold" style={{ color: accent.purple }}>{combos.toLocaleString()}</p>
          <p className="text-[10px] text-white/45 mt-0.5">{lang === "ru" ? "комбинаций" : "combinations"}</p>
        </div>
        <div className="rounded-2xl p-3.5 text-center" style={{ background: "rgba(255,69,58,0.10)", border: `1px solid ${accent.red}44` }}>
          <p className="text-lg font-bold" style={{ color: accent.red }}>{fmtDuration(seconds)}</p>
          <p className="text-[10px] text-white/45 mt-0.5">{lang === "ru" ? "худший случай" : "worst case"}</p>
        </div>
      </div>
    </GlassCard>
  );
}

// Карьер: добыча в час × часы, топливо
function QuarryTool({ lang }) {
  const [rates, setRates] = useState(Object.fromEntries(quarryProfiles.map((p) => [p.id, p.rate])));
  const [resId, setResId] = useState(quarryProfiles[0].id);
  const [hours, setHours] = useState(8);
  const fuelPerHour = 900;
  const [fuelHave, setFuelHave] = useState(7200);

  const profile = quarryProfiles.find((p) => p.id === resId);
  const rate = rates[resId];
  const total = Math.round(rate * hours);
  const fuelNeed = fuelPerHour * hours;
  const fuelHours = fuelHave / fuelPerHour;

  return (
    <GlassCard className="p-5">
      <SectionHeader icon={Layers} color={accent.gray} title={lang === "ru" ? "Калькулятор карьера" : "Quarry Calculator"} />
      <Segmented
        color={accent.orange}
        value={resId}
        onChange={setResId}
        options={quarryProfiles.map((p) => ({ value: p.id, label: p.label[lang] }))}
      />

      <div className="flex gap-2 mt-4 mb-4">
        <NumField
          label={lang === "ru" ? "Добыча в час (≈)" : "Yield per hour (approx)"}
          value={rate}
          onChange={(v) => setRates({ ...rates, [resId]: v })}
          suffix="/ч"
          step={100}
          color={profile.color}
        />
        <NumField
          label={lang === "ru" ? "Есть топлива" : "Fuel available"}
          value={fuelHave}
          onChange={setFuelHave}
          suffix="LGF"
          step={100}
          color={accent.yellow}
        />
      </div>

      <div className="flex justify-between text-xs text-white/60 mb-1">
        <span>{lang === "ru" ? "Часов работы:" : "Hours of work:"}</span>
        <span className="font-semibold" style={{ color: accent.orange }}>{hours} ч</span>
      </div>
      <input
        type="range"
        min="1"
        max="24"
        step="1"
        value={hours}
        onChange={(e) => setHours(Number(e.target.value))}
        className="w-full cursor-pointer mb-4"
        style={{ accentColor: accent.orange }}
      />

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl p-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-base font-bold" style={{ color: profile.color }}>{total.toLocaleString()}</p>
          <p className="text-[10px] text-white/40 mt-0.5">{lang === "ru" ? "ресурсов всего" : "total resources"}</p>
        </div>
        <div className="rounded-2xl p-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-base font-bold" style={{ color: accent.yellow }}>{fuelNeed.toLocaleString()}</p>
          <p className="text-[10px] text-white/40 mt-0.5">LGF {lang === "ru" ? "нужно" : "needed"}</p>
        </div>
        <div className="rounded-2xl p-2.5" style={{ background: fuelHours >= hours ? "rgba(48,209,88,0.10)" : "rgba(255,69,58,0.10)", border: `1px solid ${fuelHours >= hours ? accent.green : accent.red}44` }}>
          <p className="text-base font-bold" style={{ color: fuelHours >= hours ? accent.green : accent.red }}>{fuelHours.toFixed(1)} ч</p>
          <p className="text-[10px] text-white/40 mt-0.5">{lang === "ru" ? "топлива хватит на" : "fuel lasts"}</p>
        </div>
      </div>
      <p className="text-[9.5px] mt-2.5 text-white/30">
        {lang === "ru" ? "Расход ≈ 900 LGF/ч (1 низкосортное на ~4 сек). Профили усреднённые — поправьте под свою точку." : "Burn ≈ 900 LGF/h (1 low grade per ~4s). Profiles are averages — adjust to your spot."}
      </p>
    </GlassCard>
  );
}

// Биг карьер — Гигантский экскаватор
function ExcavatorTool({ lang }) {
  const profiles = [
    ...quarryProfiles,
    { id: "hqm", label: { ru: "HQM", en: "HQM" }, rate: 110, color: accent.teal },
  ];
  const [resId, setResId] = useState("sulfur");
  const [mult, setMult] = useState(15);
  const [minutes, setMinutes] = useState(3);

  const profile = profiles.find((p) => p.id === resId);
  const perHour = profile.rate * mult;
  const total = Math.round((perHour / 60) * minutes);

  return (
    <GlassCard className="p-5">
      <SectionHeader icon={Hammer} color={accent.teal} title={lang === "ru" ? "Биг карьер (экскаватор)" : "Big Quarry (Excavator)"} />
      <p className="text-[11px] mb-3" style={{ color: "rgba(242,242,247,0.45)" }}>
        {lang === "ru"
          ? "Экскаватор копает один выбранный ресурс. Скорость считаем как карьер × множитель."
          : "The excavator digs one chosen resource. Speed is modeled as quarry × multiplier."}
      </p>
      <Segmented
        color={accent.teal}
        value={resId}
        onChange={setResId}
        options={profiles.map((p) => ({ value: p.id, label: p.label[lang] }))}
      />

      <div className="flex gap-2 mt-4 mb-4">
        <NumField label={lang === "ru" ? "Множитель скорости" : "Speed multiplier"} value={mult} onChange={setMult} suffix="x" color={accent.teal} />
      </div>

      <div className="flex justify-between text-xs text-white/60 mb-1">
        <span>{lang === "ru" ? "Минут копания:" : "Minutes digging:"}</span>
        <span className="font-semibold" style={{ color: accent.teal }}>{minutes} мин</span>
      </div>
      <input
        type="range"
        min="1"
        max="15"
        step="1"
        value={minutes}
        onChange={(e) => setMinutes(Number(e.target.value))}
        className="w-full cursor-pointer mb-4"
        style={{ accentColor: accent.teal }}
      />

      <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(100,210,255,0.10)", border: `1px solid ${accent.teal}44` }}>
        <p className="text-xl font-bold" style={{ color: accent.teal }}>{total.toLocaleString()}</p>
        <p className="text-[10.5px] text-white/45 mt-0.5">
          {profile.label[lang]} · {lang === "ru" ? "за этот заход" : "for this run"}
        </p>
      </div>
      <p className="text-[9.5px] mt-2.5 text-white/30">
        {lang === "ru" ? "Значения ориентировочные — сверьте со своим сервером." : "Values are estimates — verify on your server."}
      </p>
    </GlassCard>
  );
}

// Нефтекачка: сырая нефть → низкосортное топливо
function OilTool({ lang }) {
  const [crudeRate, setCrudeRate] = useState(1000);
  const [hours, setHours] = useState(12);

  const crudeTotal = Math.round(crudeRate * hours);
  const lgf = crudeTotal * 3;

  return (
    <GlassCard className="p-5">
      <SectionHeader icon={Fuel} color={accent.yellow} title={lang === "ru" ? "Калькулятор нефтекачки" : "Oil Pump Calculator"} />
      <div className="mb-4">
        <NumField label={lang === "ru" ? "Добыча нефти в час (≈)" : "Crude oil per hour (approx)"} value={crudeRate} onChange={setCrudeRate} suffix="/ч" step={100} color={accent.yellow} />
      </div>

      <div className="flex justify-between text-xs text-white/60 mb-1">
        <span>{lang === "ru" ? "Часов работы:" : "Hours of work:"}</span>
        <span className="font-semibold" style={{ color: accent.yellow }}>{hours} ч</span>
      </div>
      <input
        type="range"
        min="1"
        max="48"
        step="1"
        value={hours}
        onChange={(e) => setHours(Number(e.target.value))}
        className="w-full cursor-pointer mb-4"
        style={{ accentColor: accent.yellow }}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-3.5 text-center" style={{ background: "rgba(255,214,10,0.10)", border: `1px solid ${accent.yellow}44` }}>
          <p className="text-lg font-bold" style={{ color: accent.yellow }}>{crudeTotal.toLocaleString()}</p>
          <p className="text-[10px] text-white/45 mt-0.5">{lang === "ru" ? "сырой нефти" : "crude oil"}</p>
        </div>
        <div className="rounded-2xl p-3.5 text-center" style={{ background: "rgba(48,209,88,0.10)", border: `1px solid ${accent.green}44` }}>
          <p className="text-lg font-bold" style={{ color: accent.green }}>{lgf.toLocaleString()}</p>
          <p className="text-[10px] text-white/45 mt-0.5">LGF ({lang === "ru" ? "после переработки 1→3" : "after refining 1→3"})</p>
        </div>
      </div>
    </GlassCard>
  );
}

// Ферма скрещивания: гены родителей и пул потомка
function FarmTool({ lang, t }) {
  const [parentA, setParentA] = useState(["X", "X", "X", "X", "X", "X"]);
  const [parentB, setParentB] = useState(["G", "G", "G", "G", "G", "H"]);

  const slotClick = (setter) => (idx) =>
    setter((prev) => prev.map((g, i) => (i === idx ? GENES[(GENES.indexOf(g) + 1) % GENES.length] : g)));

  const applyPreset = (setter, genes) => setter([...genes]);

  const GeneRow = ({ title, genes, onSlot, onPreset }) => (
    <div className="rounded-2xl p-3.5 mb-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold text-white/70">{title}</p>
        <div className="flex gap-1.5">
          <button
            onClick={() => onPreset(["G", "G", "G", "G", "G", "G"])}
            className="px-2 py-1 rounded-full text-[9px] font-bold"
            style={{ background: `${accent.green}22`, color: accent.green }}
          >
            GGGGGG
          </button>
          <button
            onClick={() => onPreset(["G", "G", "H", "H", "G", "G"])}
            className="px-2 py-1 rounded-full text-[9px] font-bold"
            style={{ background: `${accent.orange}22`, color: accent.orange }}
          >
            GG HH GG
          </button>
        </div>
      </div>
      <div className="flex gap-1.5">
        {genes.map((g, i) => (
          <button
            key={i}
            onClick={() => onSlot(i)}
            className="flex-1 h-9 rounded-xl text-xs font-bold transition-all"
            style={{
              background: `${geneInfo[g].color}22`,
              border: `1px solid ${geneInfo[g].color}`,
              color: geneInfo[g].color,
            }}
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  );

  // пул генов потомка: сколько каждого гена у двух родителей
  const pool = {};
  [...parentA, ...parentB].forEach((g) => { pool[g] = (pool[g] || 0) + 1; });

  return (
    <GlassCard className="p-5">
      <SectionHeader icon={Sprout} color={accent.green} title={lang === "ru" ? "Ферма скрещивания" : "Crossbreeding Farm"} />
      <p className="text-[11px] mb-3" style={{ color: "rgba(242,242,247,0.45)" }}>
        {lang === "ru" ? "Нажимайте на клетку, чтобы сменить ген." : "Tap a slot to cycle the gene."}
      </p>

      <GeneRow title={lang === "ru" ? "Родитель 1" : "Parent 1"} genes={parentA} onSlot={slotClick(setParentA)} onPreset={(g) => applyPreset(setParentA, g)} />
      <GeneRow title={lang === "ru" ? "Родитель 2" : "Parent 2"} genes={parentB} onSlot={slotClick(setParentB)} onPreset={(g) => applyPreset(setParentB, g)} />

      <div className="rounded-2xl p-3.5 mb-4" style={{ background: "rgba(48,209,88,0.08)", border: `1px solid ${accent.green}33` }}>
        <p className="text-[11px] font-semibold mb-2" style={{ color: accent.green }}>
          {lang === "ru" ? "Пул генов потомка (из обоих родителей)" : "Offspring gene pool (from both parents)"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(pool).sort().map(([g, n]) => (
            <span
              key={g}
              className="px-2 py-1 rounded-lg text-[10px] font-bold"
              style={{ background: `${geneInfo[g].color}22`, border: `1px solid ${geneInfo[g].color}66`, color: geneInfo[g].color }}
            >
              {g} ×{n}
            </span>
          ))}
        </div>
        <p className="text-[10px] mt-2 text-white/40">
          {lang === "ru"
            ? "Каждый ген родителя передаётся с шансом ≈50%. Держите нужные гены в одинаковых слотах обоих родителей."
            : "Each parent gene passes down at ≈50% chance. Keep desired genes in matching slots on both parents."}
        </p>
      </div>

      <p className="text-[11px] font-semibold text-white/60 mb-2">{lang === "ru" ? "Справка по генам" : "Gene reference"}</p>
      <div className="space-y-1.5">
        {GENES.map((g) => (
          <div key={g} className="flex items-center gap-3 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.03)" }}>
            <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: `${geneInfo[g].color}22`, color: geneInfo[g].color }}>
              {g}
            </span>
            <div>
              <p className="text-[11px] font-medium text-white/85 leading-none">{t(geneInfo[g].label)}</p>
              <p className="text-[10px] text-white/40 mt-0.5">{t(geneInfo[g].desc)}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[9.5px] mt-2.5 text-white/30">
        {lang === "ru" ? "Описание генов упрощённое — детали зависят от версии игры." : "Gene descriptions simplified — details vary by game version."}
      </p>
    </GlassCard>
  );
}

// Предпросмотр переработки
function RecyclerTool({ lang, t }) {
  const [recItem, setRecItem] = useState(recyclerItems[0]);
  const [recCount, setRecCount] = useState(1);

  return (
    <GlassCard className="p-5">
      <SectionHeader icon={RefreshCw} color={accent.green} title={lang === "ru" ? "Предпросмотр переработки" : "Recycler Prediction"} />
      <div className="grid grid-cols-2 gap-2 mb-3">
        {recyclerItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setRecItem(item)}
            className="p-3 rounded-2xl text-left text-xs transition-all"
            style={{
              background: recItem.id === item.id ? "rgba(48,209,88,0.14)" : "rgba(255,255,255,0.04)",
              border: recItem.id === item.id ? `1px solid ${accent.green}` : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <p className="font-medium truncate">{t(item.name)}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-xs text-white/60">{lang === "ru" ? "Количество предметов:" : "Item count:"}</span>
        <div className="flex items-center gap-2">
          <StepperButton onClick={() => setRecCount(Math.max(1, recCount - 1))}><Minus size={14} /></StepperButton>
          <span className="text-sm font-semibold w-6 text-center">{recCount}</span>
          <StepperButton onClick={() => setRecCount(recCount + 1)}><Plus size={14} /></StepperButton>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl p-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-base font-bold" style={{ color: accent.orange }}>{recItem.scrap * recCount}</p>
          <p className="text-[10px] text-white/40 mt-0.5">Scrap</p>
        </div>
        {recItem.HQM !== undefined && (
          <div className="rounded-2xl p-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-base font-bold" style={{ color: accent.blue }}>{recItem.HQM * recCount}</p>
            <p className="text-[10px] text-white/40 mt-0.5">HQM</p>
          </div>
        )}
        <div className="rounded-2xl p-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-base font-bold" style={{ color: accent.green }}>{recItem.metal * recCount}</p>
          <p className="text-[10px] text-white/40 mt-0.5">{lang === "ru" ? "Металл" : "Metal frags"}</p>
        </div>
      </div>
    </GlassCard>
  );
}

// Распределитель печей
function FurnaceTool({ lang }) {
  const [totalOre, setTotalOre] = useState(1000);
  const [furnacesCount, setFurnacesCount] = useState(4);

  const orePerFurnace = Math.floor(totalOre / furnacesCount);
  const woodNeeded = Math.ceil(orePerFurnace / 2);

  return (
    <GlassCard className="p-5">
      <SectionHeader icon={Flame} color={accent.purple} title={lang === "ru" ? "Распределитель печей" : "Furnace Splitter"} />

      <div className="space-y-3 mb-4">
        <div>
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span>{lang === "ru" ? "Количество руды:" : "Total Ore:"}</span>
            <span className="font-semibold" style={{ color: accent.purple }}>{totalOre}</span>
          </div>
          <input
            type="range"
            min="100"
            max="5000"
            step="100"
            value={totalOre}
            onChange={(e) => setTotalOre(Number(e.target.value))}
            className="w-full cursor-pointer"
            style={{ accentColor: accent.purple }}
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span>{lang === "ru" ? "Количество печей:" : "Furnaces count:"}</span>
            <span className="font-semibold" style={{ color: accent.orange }}>{furnacesCount}</span>
          </div>
          <Segmented
            color={accent.orange}
            value={furnacesCount}
            onChange={setFurnacesCount}
            options={[1, 2, 4, 6].map((num) => ({ value: num, label: lang === "ru" ? `${num} шт.` : String(num) }))}
          />
        </div>
      </div>

      <div className="rounded-2xl p-3.5 text-xs space-y-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex justify-between">
          <span className="text-white/50">{lang === "ru" ? "Руды на 1 печь:" : "Ore per furnace:"}</span>
          <span className="font-bold" style={{ color: accent.purple }}>{orePerFurnace}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">{lang === "ru" ? "Дерева на 1 печь (~):" : "Wood per furnace (~):"}</span>
          <span className="font-bold" style={{ color: accent.orange }}>{woodNeeded}</span>
        </div>
      </div>
    </GlassCard>
  );
}

const toolList = [
  { id: "raid", icon: Calculator, label: { ru: "Рейд", en: "Raid" } },
  { id: "codes", icon: Lock, label: { ru: "Коды дверей", en: "Door codes" } },
  { id: "quarry", icon: Layers, label: { ru: "Карьер", en: "Quarry" } },
  { id: "excavator", icon: Hammer, label: { ru: "Биг карьер", en: "Excavator" } },
  { id: "oil", icon: Fuel, label: { ru: "Нефтекачка", en: "Oil pump" } },
  { id: "farm", icon: Sprout, label: { ru: "Скрещивание", en: "Breeding" } },
  { id: "recycler", icon: RefreshCw, label: { ru: "Переработка", en: "Recycler" } },
  { id: "furnace", icon: Flame, label: { ru: "Печи", en: "Furnaces" } },
];

function ToolsScreen({ lang, t }) {
  const [tool, setTool] = useState("raid");
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1 mb-3 -mx-1 px-1">
        {toolList.map((tl) => {
          const Icon = tl.icon;
          const active = tool === tl.id;
          return (
            <button
              key={tl.id}
              onClick={() => setTool(tl.id)}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all"
              style={{
                background: active ? "rgba(255,159,10,0.16)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${active ? accent.orange : "rgba(255,255,255,0.1)"}`,
                color: active ? accent.orange : "rgba(255,255,255,0.6)",
              }}
            >
              <Icon size={13} />
              {t(tl.label)}
            </button>
          );
        })}
      </div>
      {tool === "raid" && <RaidTool lang={lang} t={t} />}
      {tool === "codes" && <CodesTool lang={lang} />}
      {tool === "quarry" && <QuarryTool lang={lang} />}
      {tool === "excavator" && <ExcavatorTool lang={lang} />}
      {tool === "oil" && <OilTool lang={lang} />}
      {tool === "farm" && <FarmTool lang={lang} t={t} />}
      {tool === "recycler" && <RecyclerTool lang={lang} t={t} />}
      {tool === "furnace" && <FurnaceTool lang={lang} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ЭКРАН 6: НАСТРОЙКИ
// ─────────────────────────────────────────────────────────
function SettingsScreen({ lang, setLang, t, live, source, onOpenSource }) {
  const isLive = !!(live && live.mode !== "mock");
  const statusMap = {
    connected: { ru: "Подключено", en: "Connected", c: accent.green },
    connecting: { ru: "Подключение...", en: "Connecting...", c: accent.yellow },
    offline: { ru: "Нет данных от pc-client", en: "No data from pc-client", c: accent.orange },
    error: { ru: "Ошибка", en: "Error", c: accent.red },
    idle: { ru: "Не подключено", en: "Not connected", c: "rgba(255,255,255,0.35)" },
  };
  const st = statusMap[isLive ? live.status : source.mode === "mock" && source.linked ? "connected" : "idle"] || statusMap.idle;
  const modeName =
    source.mode === "firebase"
      ? { ru: "Firebase (живые данные)", en: "Firebase (live data)" }
      : source.mode === "rustplus"
      ? { ru: "Rust+ напрямую", en: "Direct Rust+" }
      : { ru: "Демо-данные", en: "Demo data" };

  return (
    <div className="space-y-4">
      <GlassCard className="p-5">
        <SectionHeader icon={Database} color={accent.teal} title={lang === "ru" ? "Источник данных" : "Data Source"} />
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[13px] font-medium text-white/90">{t(modeName)}</p>
            <p className="text-[11px] mt-0.5 flex items-center gap-1.5" style={{ color: st.c }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.c }} />
              {t(st)}
            </p>
          </div>
          <IconChip icon={isLive ? Wifi : Radio} color={st.c} size={30} />
        </div>
        {isLive && live.error && (
          <p className="text-[11px] mb-3" style={{ color: accent.red }}>⚠ {live.error}</p>
        )}
        <button
          onClick={onOpenSource}
          className="w-full py-2.5 rounded-2xl text-xs font-semibold"
          style={{ background: accent.blue, color: "#fff" }}
        >
          {lang === "ru" ? "Изменить источник" : "Change source"}
        </button>
        <p className="text-[10.5px] mt-3" style={{ color: "rgba(242,242,247,0.35)" }}>
          {lang === "ru"
            ? "Firebase — те же данные, что у мобильного приложения (нужен запущенный pc-client). Rust+ — прямое подключение по WebSocket, работает вне https."
            : "Firebase — same data as the mobile app (needs a running pc-client). Rust+ — direct WebSocket connection, works outside https."}
        </p>
      </GlassCard>

      <GlassCard className="p-5">
        <SectionHeader icon={Sliders} color={accent.gray} title={lang === "ru" ? "Настройки интерфейса" : "Interface"} />
        <div>
          <p className="text-white/60 mb-2 text-[13px]">{lang === "ru" ? "Язык интерфейса" : "Interface Language"}</p>
          <button
            onClick={() => setLang(lang === "ru" ? "en" : "ru")}
            className="rounded-full px-4 py-2.5 text-xs font-semibold flex items-center gap-2"
            style={{ background: accent.blue, color: "#fff" }}
          >
            <Globe size={14} />
            {lang === "ru" ? "Русский (Сменить на English)" : "English (Switch to Russian)"}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// НАВИГАЦИЯ: ровно 6 вкладок снизу
// ─────────────────────────────────────────────────────────
const mainTabs = [
  { id: "home", icon: Home, color: accent.blue, label: { ru: "Мейн", en: "Main" } },
  { id: "map", icon: MapIcon, color: accent.purple, label: { ru: "Карта", en: "Map" } },
  { id: "smart", icon: Lightbulb, color: accent.yellow, label: { ru: "Умный дом", en: "Smart Home" } },
  { id: "intel", icon: Crosshair, color: accent.orange, label: { ru: "Пробив", en: "Intel" } },
  { id: "other", icon: LayoutGrid, color: accent.teal, label: { ru: "Другое", en: "Other" } },
  { id: "settings", icon: Sliders, color: accent.gray, label: { ru: "Настройки", en: "Settings" } },
];

export default function LiquidGlassDashboard() {
  const [lang, setLang] = useState("ru");
  const [tab, setTab] = useState("home");
  const [connectOpen, setConnectOpen] = useState(false);
  const [source, setSource] = useState(() => loadStoredSource() || { mode: "mock", linked: false, cfg: {} });

  useEffect(() => {
    storeSource(source);
  }, [source]);

  const live = useDataSource(
    source.mode === "firebase" ? "firebase" : source.mode === "rustplus" ? "rustplus" : "mock",
    source.cfg || {}
  );
  const connected =
    source.mode === "mock" ? !!source.linked : live.status === "connected";

  const t = (obj) => (typeof obj === "string" ? obj : obj[lang]);
  const activeTabInfo = mainTabs.find((x) => x.id === tab);

  const goTo = (id) => setTab(id);

  const liveStatusTextMap = {
    connected: lang === "ru" ? "Подключено к живым данным" : "Connected to live data",
    connecting: lang === "ru" ? "Подключение..." : "Connecting...",
    offline: lang === "ru" ? "Источник есть, данных нет" : "Source configured, no data",
    error: lang === "ru" ? "Ошибка подключения" : "Connection error",
    idle: "",
  };
  const liveStatusText =
    source.mode === "mock"
      ? source.linked
        ? lang === "ru"
          ? "Демо-режим активен"
          : "Demo mode active"
        : ""
      : liveStatusTextMap[live.status] || "";

  return (
    <div style={pageStyle}>
      <div className="mx-auto max-w-md px-4 pb-32 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[11px] font-medium mb-0.5" style={{ color: "rgba(242,242,247,0.45)" }}>
              {activeTabInfo?.label[lang]}
            </p>
            <h1 className="text-[26px] font-semibold tracking-tight">Rust Companion</h1>
          </div>
          <button
            onClick={() => setLang(lang === "ru" ? "en" : "ru")}
            style={glassStyle}
            className="flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-xs font-semibold"
          >
            <Globe size={14} />
            {lang.toUpperCase()}
          </button>
        </div>

        {tab === "home" && (
          <HomeScreen lang={lang} t={t} connected={connected} onOpenConnect={() => setConnectOpen(true)} goTo={goTo} live={live} />
        )}
        {tab === "map" && <MapScreenFull lang={lang} t={t} live={live} />}
        {tab === "smart" && <SmartHomeScreen lang={lang} live={live} />}
        {tab === "intel" && <IntelScreen lang={lang} t={t} live={live} />}
        {tab === "other" && <OtherScreen lang={lang} t={t} />}
        {tab === "settings" && (
          <SettingsScreen lang={lang} setLang={setLang} t={t} live={live} source={source} onOpenSource={() => setConnectOpen(true)} />
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0">
        <div className="mx-auto max-w-md px-4 pb-6">
          <div style={glassStyle} className="rounded-[28px] px-2 py-2 flex items-stretch">
            {mainTabs.map((tItem) => {
              const Icon = tItem.icon;
              const active = tab === tItem.id;
              return (
                <button
                  key={tItem.id}
                  onClick={() => setTab(tItem.id)}
                  className="flex-1 flex flex-col items-center gap-1 py-1.5 px-1 rounded-2xl transition-all"
                  style={active ? { background: `${tItem.color}26` } : {}}
                >
                  <Icon size={18} color={active ? tItem.color : "rgba(255,255,255,0.42)"} strokeWidth={active ? 2.4 : 2} />
                  <span
                    className="text-[8px] font-semibold leading-none truncate max-w-full"
                    style={{ color: active ? tItem.color : "rgba(255,255,255,0.38)" }}
                  >
                    {tItem.label[lang]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {connectOpen && (
        <ConnectModal
          lang={lang}
          initial={source}
          liveStatusText={liveStatusText}
          liveError={source.mode === "mock" ? null : live.error}
          onClose={() => setConnectOpen(false)}
          onSave={(src) => {
            setSource(src);
            setConnectOpen(false);
          }}
        />
      )}
    </div>
  );
}
