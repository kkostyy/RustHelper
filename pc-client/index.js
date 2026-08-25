require('dotenv').config();
const RustPlus = require('@liamcottle/rustplus.js');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ---------- Настройка Firebase ----------
const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`[Firebase] Не найден файл сервисного аккаунта: ${serviceAccountPath}`);
  console.error('Скачайте его в консоли Firebase: Project Settings -> Service Accounts -> Generate new private key');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.database();
const teamRef = db.ref('team');
const statusRef = db.ref('client_status');
const mapRef = db.ref('map');
const devicesRef = db.ref('devices');
const commandsRef = db.ref('commands');
const eventsRef = db.ref('events');
const vendingRef = db.ref('vending');

let mapAlreadyFetched = false;

// ---------- Настройка Rust+ ----------
const {
  RUST_SERVER_IP,
  RUST_SERVER_PORT,
  RUST_PLAYER_ID,
  RUST_PLAYER_TOKEN,
  POLL_INTERVAL_MS,
  STEAM_API_KEY,
  RUSTMAPS_API_KEY,
} = process.env;

if (!RUST_SERVER_IP || !RUST_PLAYER_ID || !RUST_PLAYER_TOKEN) {
  console.error('[Config] Заполните RUST_SERVER_IP / RUST_PLAYER_ID / RUST_PLAYER_TOKEN в .env');
  process.exit(1);
}

const pollInterval = parseInt(POLL_INTERVAL_MS, 10) || 5000;
const eventsPollInterval = parseInt(process.env.EVENTS_POLL_INTERVAL_MS, 10) || 15000;

// ---------- Чат-бот (!команды в чате команды) ----------
// Отвечает на !help / !time / !online тем же аккаунтом, что и pc-client.
// Выключается через CHAT_BOT=off в .env.
// Права (CHAT_BOT_ACCESS): everyone — отвечать всем; admins — только
// владельцу и списку CHAT_BOT_ADMINS; owner — только владельцу аккаунта
// pc-client. Гарды «свежий broadcast» и «не свои сообщения» стоят отдельно.
const CHAT_BOT_ENABLED = process.env.CHAT_BOT !== 'off';
const CHAT_BOT_ACCESS = ['everyone', 'admins', 'owner'].includes(process.env.CHAT_BOT_ACCESS)
  ? process.env.CHAT_BOT_ACCESS
  : 'everyone';
const CHAT_BOT_ADMINS = (process.env.CHAT_BOT_ADMINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const lastInfoCache = { players: null, maxPlayers: null, queuedPlayers: null };
let botLastReplyAt = 0;

// ---------- Discord-мост ----------
// Если задан DISCORD_WEBHOOK_URL — дублирует туда спавны событий,
// срабатывания сигнализаций и смерти тиммейтов.
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';

async function postToDiscord(content) {
  if (!DISCORD_WEBHOOK_URL) return;
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: String(content).slice(0, 1900) }),
    });
  } catch (err) {
    console.error('[Discord] Ошибка отправки:', err.message);
  }
}

// ---------- Умные устройства ----------
// Список привязанных устройств задаётся вручную в entities.json
// (см. entities.example.json) — entityId выдаётся игрой при пейринге
// устройства через Rust+ (аналогично пейрингу с сервером).
const ENTITIES_CONFIG_PATH = path.resolve(process.env.ENTITIES_CONFIG_PATH || './entities.json');
let entitiesConfig = [];

if (fs.existsSync(ENTITIES_CONFIG_PATH)) {
  try {
    entitiesConfig = JSON.parse(fs.readFileSync(ENTITIES_CONFIG_PATH, 'utf-8'));
  } catch (err) {
    console.error('[Config] Не удалось прочитать entities.json:', err.message);
  }
} else {
  console.warn(`[Config] Файл ${ENTITIES_CONFIG_PATH} не найден — умные устройства работать не будут.`);
  console.warn('Скопируйте entities.example.json в entities.json и впишите свои entityId.');
}

const rustplus = new RustPlus(
  RUST_SERVER_IP,
  RUST_SERVER_PORT || 28083,
  RUST_PLAYER_ID,
  RUST_PLAYER_TOKEN
);

let pollTimer = null;
let eventsPollTimer = null;
let chatTimer = null;
let serverInfoTimer = null;

// ---------- Аватарки (Steam Web API) ----------
// steamId -> { url, fetchedAt }
const avatarCache = new Map();
const AVATAR_TTL_MS = 60 * 60 * 1000; // раз в час обновляем на случай смены авы

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function ensureAvatars(steamIds) {
  if (!STEAM_API_KEY) return; // без ключа просто не заполняем avatarUrl — мобильное приложение подставит заглушку

  const now = Date.now();
  const stale = steamIds.filter((id) => {
    const cached = avatarCache.get(id);
    return !cached || now - cached.fetchedAt > AVATAR_TTL_MS;
  });
  if (stale.length === 0) return;

  for (const batch of chunk(stale, 100)) {
    try {
      const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${batch.join(',')}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error('[Steam API] HTTP', res.status);
        continue;
      }
      const data = await res.json();
      const players = data?.response?.players || [];
      for (const p of players) {
        avatarCache.set(p.steamid, {
          url: p.avatarfull || p.avatarmedium || p.avatar || null,
          fetchedAt: now,
        });
      }
    } catch (err) {
      console.error('[Steam API] Ошибка запроса аватаров:', err.message);
    }
  }
}

function mapMember(member) {
  // member: { steamId, name, x, y, isOnline, spawnTime, isAlive, deathTime, ... }
  const steamId = member.steamId?.toString?.() ?? String(member.steamId);
  return {
    steamId,
    name: member.name,
    isOnline: !!member.isOnline,
    isAlive: !!member.isAlive,
    avatarUrl: avatarCache.get(steamId)?.url || null,
    x: member.x,
    y: member.y,
    lastUpdated: Date.now(),
  };
}

// Срез команды для Discord-диффа смертей (см. fetchAndPushTeamInfo)
let prevTeamForDiscord = null;

function fetchAndPushTeamInfo() {
  rustplus.sendRequest({ getTeamInfo: {} }, async (message) => {
    if (message.response?.error) {
      console.error('[RustPlus] Ошибка getTeamInfo:', message.response.error.error);
      return;
    }

    const teamInfo = message.response?.teamInfo;
    if (!teamInfo) return;

    const rawMembers = teamInfo.members || [];
    const steamIds = rawMembers.map((m) => m.steamId?.toString?.() ?? String(m.steamId));
    await ensureAvatars(steamIds);

    const members = rawMembers.map(mapMember);
    // Discord: смерти и респавны тиммейтов (по смене isAlive между опросами)
    if (DISCORD_WEBHOOK_URL && prevTeamForDiscord) {
      for (const m of members) {
        const was = prevTeamForDiscord.find((p) => p.steamId === m.steamId);
        if (!was) continue;
        if (was.isAlive && !m.isAlive) postToDiscord(`💀 **${m.name}** погиб (${m.x != null ? `${Math.round(m.x)}, ${Math.round(m.y)}` : 'координаты неизвестны'})`);
        else if (!was.isAlive && m.isAlive) postToDiscord(`🔄 **${m.name}** возродился`);
      }
    }
    prevTeamForDiscord = members;
    const payload = {
      leaderSteamId: teamInfo.leaderSteamId?.toString?.() ?? String(teamInfo.leaderSteamId),
      members,
      updatedAt: Date.now(),
    };

    try {
      await teamRef.set(payload);
      console.log(`[Sync] Обновлено ${members.length} участников команды`);
    } catch (err) {
      console.error('[Firebase] Ошибка записи team info:', err.message);
    }
  });
}

// ---------- Чат команды (/chat) и инфо о сервере (/server_info) ----------
// Веб-версия компаньона читает чат и онлайн сервера из Firebase, как и
// мобильное приложение. Новые сообщения приходят бродкастом teamMessage,
// периодический getTeamChat догоняет всё, что было пока мы были оффлайн.
const chatRef = db.ref('chat');
const serverInfoRef = db.ref('server_info');
const seenChatKeys = new Set(); // "steamId:time" — защита от дублей между бродкастом и опросом
let chatPushes = 0;

async function pushChatMessages(messages) {
  for (const msg of messages || []) {
    const key = `${msg.steamId}:${msg.time}`;
    if (seenChatKeys.has(key)) continue;
    seenChatKeys.add(key);
    if (seenChatKeys.size > 500) {
      // не даём сету расти бесконечно — выкидываем старую половину
      const it = seenChatKeys.values();
      for (let i = 0; i < 250; i++) seenChatKeys.delete(it.next().value);
    }
    try {
      await chatRef.push({
        steamId: msg.steamId?.toString?.() ?? String(msg.steamId),
        name: msg.name,
        message: msg.message,
        color: msg.color || '',
        time: msg.time,
        updatedAt: Date.now(),
      });
      chatPushes += 1;
      // Раз в ~20 сообщений оставляем только последние 100 записей
      if (chatPushes % 20 === 0) {
        const snapshot = await chatRef.orderByChild('time').once('value');
        const all = [];
        snapshot.forEach((child) => all.push(child.key));
        const toRemove = all.slice(0, Math.max(0, all.length - 100));
        await Promise.all(toRemove.map((key2) => chatRef.child(key2).remove()));
      }
    } catch (err) {
      console.error('[Firebase] Ошибка записи сообщения чата:', err.message);
    }
  }
}

async function fetchAndPushTeamChat() {
  try {
    const message = await rustplus.sendRequestAsync({ getTeamChat: {} });
    if (message.response?.error) {
      console.error('[RustPlus] Ошибка getTeamChat:', message.response.error.error);
      return;
    }
    await pushChatMessages(message.response?.teamChat?.messages);
  } catch (err) {
    console.error('[RustPlus] Ошибка запроса чата:', err.message);
  }
}

async function fetchAndPushServerInfo() {
  try {
    const message = await rustplus.sendRequestAsync({ getInfo: {} });
    if (message.response?.error) {
      console.error('[RustPlus] Ошибка getInfo:', message.response.error.error);
      return;
    }
    const info = message.response?.info;
    if (!info) return;
    lastInfoCache.players = info.players;
    lastInfoCache.maxPlayers = info.maxPlayers;
    lastInfoCache.queuedPlayers = info.queuedPlayers;

    // Игровое время (AppTime{ day=1, time=2 float-часы }) — для плитки
    // «Время» в приложении. Отдельный запрос, при ошибке просто пропускаем.
    let gameTime = null;
    try {
      const timeMessage = await rustplus.sendRequestAsync({ getTime: {} });
      const t = timeMessage.response?.time;
      if (t) gameTime = { day: t.day ?? null, time: t.time ?? null };
    } catch (err) {
      /* время не критично */
    }

    await serverInfoRef.set({
      name: info.name,
      players: info.players,
      maxPlayers: info.maxPlayers,
      queuedPlayers: info.queuedPlayers,
      mapSize: info.mapSize,
      wipeTime: info.wipeTime,
      seed: info.seed ?? null,
      gameTime,
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.error('[Firebase] Ошибка записи инфо о сервере:', err.message);
  }
}

// ---------- Карта: RustMaps.com (опционально) ----------
// Даёт готовую, красиво отрисованную карту вместо сырого JPG из Rust+.
// Официальная документация: https://rustmaps.com/docs/index.html
async function fetchRustMapsImage(seed, size) {
  if (!RUSTMAPS_API_KEY) return null;

  try {
    const url = `https://api.rustmaps.com/v4/maps/${size}/${seed}`;
    const res = await fetch(url, { headers: { 'X-API-Key': RUSTMAPS_API_KEY } });

    if (res.status === 202) {
      console.log('[RustMaps] Карта ещё генерируется на их стороне, используем карту из Rust+ пока что');
      return null;
    }
    if (!res.ok) {
      console.error('[RustMaps] HTTP', res.status);
      return null;
    }

    const data = await res.json();
    // Поле может называться по-разному в зависимости от версии ответа API —
    // проверьте актуальную схему в документации, если ссылка не подтянется.
    const imageUrl = data?.data?.imageUrl || data?.imageUrl || null;
    return imageUrl;
  } catch (err) {
    console.error('[RustMaps] Ошибка запроса:', err.message);
    return null;
  }
}

async function fetchAndPushMapOnce() {
  if (mapAlreadyFetched) return;

  try {
    const mapMessage = await rustplus.sendRequestAsync({ getMap: {} });
    if (mapMessage.response?.error) {
      console.error('[RustPlus] Ошибка getMap:', mapMessage.response.error.error);
      return;
    }

    const mapData = mapMessage.response?.map;
    if (!mapData) return;

    const monuments = (mapData.monuments || []).map((m) => ({
      token: m.token,
      x: m.x,
      y: m.y,
    }));

    // По умолчанию — сырая картинка из Rust+ (jpgImage приходит байтами,
    // кодируем в base64 data URI для прямого использования в <Image>).
    let image = mapData.jpgImage
      ? `data:image/jpeg;base64,${Buffer.from(mapData.jpgImage).toString('base64')}`
      : null;
    let source = 'rustplus';

    if (RUSTMAPS_API_KEY) {
      try {
        const infoMessage = await rustplus.sendRequestAsync({ getInfo: {} });
        const info = infoMessage.response?.info;
        if (info?.seed) {
          const rustMapsUrl = await fetchRustMapsImage(info.seed, info.mapSize || mapData.width);
          if (rustMapsUrl) {
            image = rustMapsUrl;
            source = 'rustmaps';
          }
        } else {
          console.log('[RustMaps] У сервера нет seed (кастомная карта) — используем Rust+ картинку');
        }
      } catch (err) {
        console.error('[RustMaps] Не удалось получить seed/размер карты:', err.message);
      }
    }

    const payload = {
      width: mapData.width,
      height: mapData.height,
      oceanMargin: mapData.oceanMargin,
      monuments,
      image,
      source,
      updatedAt: Date.now(),
    };

    await mapRef.set(payload);
    mapAlreadyFetched = true;
    console.log(`[Sync] Карта загружена (${monuments.length} монументов, источник: ${source})`);
  } catch (err) {
    console.error('[Firebase] Ошибка записи карты:', err.message);
  }
}

// ---------- Умные устройства: получение состояния и подписка ----------

function buildDevicePayload(config, payload) {
  const base = {
    id: config.id,
    name: config.name,
    type: config.type,
    updatedAt: Date.now(),
  };

  if (config.type === 'switch' || config.type === 'alarm') {
    return { ...base, value: !!payload?.value };
  }

  if (config.type === 'storage_monitor') {
    const items = (payload?.items || []).map((it) => ({
      itemId: it.itemId,
      quantity: it.quantity,
      isBlueprint: !!it.itemIsBlueprint,
    }));
    const protectionExpiry = payload?.protectionExpiry || 0;
    return {
      ...base,
      capacity: payload?.capacity ?? null,
      hasProtection: !!payload?.hasProtection,
      // protectionExpiry — unix-время (сек), когда закончится защита ТС (сгниёт).
      // Отдаём как есть, время до истечения мобильное приложение считает само,
      // чтобы не зависеть от рассинхрона часов.
      protectionExpiry,
      items,
    };
  }

  return base;
}

async function refreshEntity(config) {
  try {
    const message = await rustplus.sendRequestAsync({ getEntityInfo: {}, entityId: config.id });
    if (message.response?.error) {
      console.error(`[RustPlus] Ошибка getEntityInfo для "${config.name}":`, message.response.error.error);
      return;
    }
    const payload = message.response?.entityInfo?.payload;
    const devicePayload = buildDevicePayload(config, payload);
    await devicesRef.child(String(config.id)).set(devicePayload);
  } catch (err) {
    console.error(`[Firebase] Ошибка обновления устройства "${config.name}":`, err.message);
  }
}

async function initDevices() {
  if (entitiesConfig.length === 0) return;

  for (const config of entitiesConfig) {
    // Подписка нужна, чтобы дальше получать мгновенные push-обновления
    // через broadcast entityChanged, без постоянного опроса.
    try {
      await rustplus.sendRequestAsync({ setSubscription: { value: true }, entityId: config.id });
    } catch (err) {
      console.error(`[RustPlus] Не удалось подписаться на "${config.name}" (id ${config.id}):`, err.message);
    }
    await refreshEntity(config);
  }

  console.log(`[Sync] Устройства инициализированы: ${entitiesConfig.length}`);
}

function findEntityConfig(entityId) {
  return entitiesConfig.find((e) => String(e.id) === String(entityId));
}

// entityChanged приходит при любом изменении состояния устройства
// (переключение свитча, срабатывание сигнализации, изменение содержимого монитора)
const deviceValsCache = new Map(); // entityId -> прошлое value (для детекта on-перехода)

function handleEntityChanged(entityChanged) {
  const config = findEntityConfig(entityChanged.entityId);
  if (!config) return; // устройство не из нашего списка — игнорируем

  const devicePayload = buildDevicePayload(config, entityChanged.payload);

  // Discord: сигнализация сработала (переход выкл → вкл)
  if (DISCORD_WEBHOOK_URL && config.type === 'alarm') {
    const was = deviceValsCache.get(String(config.id)) === true;
    const now = entityChanged.payload?.value === true;
    if (now && !was) postToDiscord(`🔔 **Тревога «${config.name}»** сработала`);
    deviceValsCache.set(String(config.id), now);
  }

  devicesRef
    .child(String(config.id))
    .set(devicePayload)
    .then(() => console.log(`[Sync] Обновлено устройство "${config.name}"`))
    .catch((err) => console.error(`[Firebase] Ошибка обновления "${config.name}":`, err.message));
}

// ---------- Команды с телефона (вкл/выкл свитчей) ----------
function listenForCommands() {
  commandsRef.on('child_added', async (snapshot) => {
    const command = snapshot.val();
    const commandKey = snapshot.key;

    try {
      if (command?.action === 'toggle_switch') {
        const config = findEntityConfig(command.entityId);
        if (!config || config.type !== 'switch') {
          console.warn('[Commands] Неизвестный или неверный switch id:', command.entityId);
        } else {
          await rustplus.sendRequestAsync({
            setEntityValue: { value: !!command.value },
            entityId: config.id,
          });
          console.log(`[Commands] "${config.name}" -> ${command.value ? 'ВКЛ' : 'ВЫКЛ'}`);
          await refreshEntity(config);
        }
      } else if (command?.action === 'send_team_message') {
        const text = String(command.text || '').trim().slice(0, 128);
        if (!text) {
          console.warn('[Commands] Пустой текст send_team_message');
        } else {
          await rustplus.sendRequestAsync({ sendTeamMessage: { message: text } });
          console.log('[Commands] Сообщение отправлено в чат команды');
        }
      }
    } catch (err) {
      console.error('[Commands] Ошибка выполнения команды:', err.message);
    } finally {
      // Команда одноразовая — убираем из очереди после обработки
      await commandsRef.child(commandKey).remove().catch(() => {});
    }
  });
}

// ---------- Чат-бот: разбор !команд из чата команды ----------
// Срабатывает ТОЛЬКО на свежие broadcast teamMessage (не на бэкфилл
// getTeamChat при старте — иначе бот ответил бы на старые сообщения).

function pad2(n) {
  return n < 10 ? '0' + n : '' + n;
}

async function botReply(text) {
  const now = Date.now();
  if (now - botLastReplyAt < 2000) return; // не спамим чаще раза в 2 секунды
  botLastReplyAt = now;
  try {
    await rustplus.sendRequestAsync({ sendTeamMessage: { message: String(text).slice(0, 128) } });
    console.log('[Bot] Ответ в чат:', text);
  } catch (err) {
    console.error('[Bot] Ошибка отправки ответа:', err.message);
  }
}

async function handleChatCommand(msg) {
  if (!CHAT_BOT_ENABLED || !msg) return;
  const sid = msg.steamId?.toString?.() ?? String(msg.steamId);
  // Свои же сообщения игнорируем — иначе бот отвечает сам себе в бесконечном цикле
  if (sid === String(RUST_PLAYER_ID)) return;

  // Разграничение прав: кому доступны !команды
  const isOwner = sid === String(RUST_PLAYER_ID);
  if (!isOwner) {
    if (CHAT_BOT_ACCESS === 'owner') return;
    if (CHAT_BOT_ACCESS === 'admins' && !CHAT_BOT_ADMINS.includes(sid)) return;
  }

  const text = String(msg.message || '').trim();
  if (!text.startsWith('!')) return;
  const cmd = text.split(/\s+/)[0].toLowerCase();

  try {
    if (cmd === '!help') {
      await botReply('Команды: !help — список, !time — игровое время, !online — онлайн сервера');
    } else if (cmd === '!time') {
      const m = await rustplus.sendRequestAsync({ getTime: {} });
      const t = m.response?.time; // AppTime{ day=1, time=2 (float, часы суток) }
      if (!t) {
        await botReply('Не смог узнать игровое время');
        return;
      }
      const hours = Math.floor(t.time || 0);
      const mins = Math.floor(((t.time || 0) - hours) * 60);
      await botReply(`Игровое время: день ${t.day ?? '?'}, ${pad2(hours)}:${pad2(mins)}`);
    } else if (cmd === '!online') {
      const c = lastInfoCache;
      if (c.players == null) {
        await botReply('Ещё не знаю онлайн — подожди минуту');
      } else {
        const q = c.queuedPlayers > 0 ? `, очередь ${c.queuedPlayers}` : '';
        await botReply(`Онлайн: ${c.players}/${c.maxPlayers}${q}`);
      }
    }
    // Неизвестные !команды молча игнорируем
  } catch (err) {
    console.error('[Bot] Ошибка обработки команды:', err.message);
  }
}

// ---------- Игровые события (вертолёт, карго, чинук, крейт) ----------
// Rust+ не шлёт эти события напрямую — вместо этого мы периодически
// опрашиваем getMapMarkers и сравниваем с прошлым снимком, чтобы понять,
// что появилось (спавн) или исчезло (деспавн/уничтожение) с карты.
// Типы маркеров зафиксированы в rustplus.proto (AppMarkerType).
const MARKER_TYPES = {
  5: { key: 'cargo_ship', label: 'Грузовой корабль' },
  4: { key: 'ch47', label: 'Chinook 47' },
  8: { key: 'patrol_helicopter', label: 'Патрульный вертолёт' },
  6: { key: 'crate', label: 'Запертый ящик (крейт)' },
};

let previousMarkers = new Map(); // markerId -> { type, x, y }
let eventsCount = 0;
let lastVendingJson = ''; // чтобы не перезаписывать /vending каждые 15 сек без изменений

// AppMarkerType: 2 = VendingMachine. Собираем их с ордерами в /vending
// для каталога магазинов в приложении (поиск по предмету/цене).
async function syncVendingMachines(markers) {
  if (!markers || markers.length === 0) return;
  const machines = [];
  for (const marker of markers) {
    if (marker.type !== 2) continue;
    machines.push({
      id: String(marker.id),
      name: marker.name || '',
      x: marker.x,
      y: marker.y,
      sellOrders: (marker.sellOrders || []).map((o) => ({
        itemId: o.itemId,
        amount: o.amount,
        currencyId: o.currencyId,
        cost: o.cost,
      })),
    });
  }

  try {
    const json = JSON.stringify(machines);
    if (json === lastVendingJson) return; // ничего не изменилось
    lastVendingJson = json;
    await vendingRef.set({ machines, updatedAt: Date.now() });
    console.log(`[Sync] Торговые автоматы обновлены: ${machines.length}`);
  } catch (err) {
    console.error('[Firebase] Ошибка записи торговых автоматов:', err.message);
  }
}

async function pushEvent(typeInfo, action, x, y) {
  try {
    await eventsRef.push({
      type: typeInfo.key,
      label: typeInfo.label,
      action, // 'spawn' | 'despawn'
      x: x ?? null,
      y: y ?? null,
      timestamp: Date.now(),
    });
    eventsCount += 1;

    // Спавны событий дублируем в Discord (если настроен вебхук)
    if (action === 'spawn') {
      postToDiscord(
        `🚨 **${typeInfo.label}** появился на карте${x != null ? ` (${Math.round(x)}, ${Math.round(y)})` : ''}`
      );
    }

    // Лёгкая уборка, чтобы список не рос бесконечно — раз в ~20 событий
    // оставляем только последние 150.
    if (eventsCount % 20 === 0) {
      const snapshot = await eventsRef.orderByChild('timestamp').once('value');
      const all = [];
      snapshot.forEach((child) => all.push(child.key));
      const toRemove = all.slice(0, Math.max(0, all.length - 150));
      await Promise.all(toRemove.map((key) => eventsRef.child(key).remove()));
    }
  } catch (err) {
    console.error('[Firebase] Ошибка записи события:', err.message);
  }
}

async function fetchAndDiffEvents() {
  try {
    const message = await rustplus.sendRequestAsync({ getMapMarkers: {} });
    if (message.response?.error) {
      console.error('[RustPlus] Ошибка getMapMarkers:', message.response.error.error);
      return;
    }

    const markers = message.response?.mapMarkers?.markers || [];
    const currentMarkers = new Map();

    // Торговые автоматы уходят в /vending, а не в ленту событий
    syncVendingMachines(markers);

    for (const marker of markers) {
      const typeInfo = MARKER_TYPES[marker.type];
      if (!typeInfo) continue; // игроки и вендоры нас тут не интересуют
      currentMarkers.set(marker.id, { type: marker.type, x: marker.x, y: marker.y });
    }

    // Новые маркеры — те, что появились впервые
    for (const [id, m] of currentMarkers) {
      if (!previousMarkers.has(id)) {
        const typeInfo = MARKER_TYPES[m.type];
        await pushEvent(typeInfo, 'spawn', m.x, m.y);
        console.log(`[Events] Появление: ${typeInfo.label}`);
      }
    }

    // Пропавшие маркеры — те, что были раньше, но исчезли сейчас
    for (const [id, m] of previousMarkers) {
      if (!currentMarkers.has(id)) {
        const typeInfo = MARKER_TYPES[m.type];
        await pushEvent(typeInfo, 'despawn', m.x, m.y);
        console.log(`[Events] Исчезновение: ${typeInfo.label}`);
      }
    }

    previousMarkers = currentMarkers;
  } catch (err) {
    console.error('[RustPlus] Ошибка опроса карт-маркеров:', err.message);
  }
}

async function setClientStatus(status) {
  try {
    await statusRef.set({ status, updatedAt: Date.now() });
  } catch (err) {
    console.error('[Firebase] Ошибка записи статуса клиента:', err.message);
  }
}

rustplus.on('connecting', () => {
  console.log('[RustPlus] Подключение к серверу...');
});

rustplus.on('connected', () => {
  console.log('[RustPlus] Подключено к Rust+');
  setClientStatus('connected');

  fetchAndPushMapOnce();
  fetchAndPushTeamInfo();
  initDevices();
  fetchAndDiffEvents();
  fetchAndPushServerInfo();
  fetchAndPushTeamChat();
  pollTimer = setInterval(fetchAndPushTeamInfo, pollInterval);
  eventsPollTimer = setInterval(fetchAndDiffEvents, eventsPollInterval);
  serverInfoTimer = setInterval(fetchAndPushServerInfo, 60000);
  chatTimer = setInterval(fetchAndPushTeamChat, pollInterval);
});

// Событие приходит от сервера, когда состав/статус команды меняется -
// дополнительно к периодическому опросу реагируем мгновенно
rustplus.on('message', (message) => {
  if (message.broadcast?.teamChanged) {
    fetchAndPushTeamInfo();
  }
  if (message.broadcast?.teamMessage) {
    // Новое сообщение в чате команды — пишем сразу, не дожидаясь опроса getTeamChat.
    // Бот вызывается только здесь: периодический бэкфилл getTeamChat его не триггерит,
    // чтобы при старте не отвечать на давно отправленные !команды.
    pushChatMessages([message.broadcast.teamMessage]);
    handleChatCommand(message.broadcast.teamMessage);
  }
  if (message.broadcast?.entityChanged) {
    handleEntityChanged(message.broadcast.entityChanged);
  }
});

rustplus.on('disconnected', () => {
  console.warn('[RustPlus] Отключено. Повтор через 5 секунд...');
  setClientStatus('disconnected');
  if (pollTimer) clearInterval(pollTimer);
  if (eventsPollTimer) clearInterval(eventsPollTimer);
  if (chatTimer) clearInterval(chatTimer);
  if (serverInfoTimer) clearInterval(serverInfoTimer);
  setTimeout(() => rustplus.connect(), 5000);
});

rustplus.on('error', (error) => {
  console.error('[RustPlus] Ошибка соединения:', error);
});

process.on('SIGINT', async () => {
  console.log('\n[Shutdown] Завершение работы...');
  await setClientStatus('offline');
  process.exit(0);
});

console.log('=== Rust Companion PC Client ===');
listenForCommands();
rustplus.connect();
