# Rust Companion — PC Client

Держит соединение с Rust+ (WebSocket/Protobuf) и синхронизирует статус
команды в Firebase Realtime Database, откуда его читает Android-пульт.

## 1. Установка

```bash
cd pc-client
npm install
cp .env.example .env
```

## 2. Получение `RUST_PLAYER_ID` и `RUST_PLAYER_TOKEN`

Это **не** ваш обычный SteamID и не пароль — это данные пары (pairing),
которые Rust+ выдаёт при подключении к серверу через мобильное приложение
Rust Companion от Facepunch. Без них подключиться к Rust+ API нельзя.

Самый простой способ получить их для разработки:

1. Установите официальное приложение **Rust+** от Facepunch на телефон
   и привяжите Steam-аккаунт.
2. Зайдите на сервер в игре и нажмите "Pair with Server" в игровом меню (F1 → `Server Info` → значок Rust+).
3. Запустите локальный FCM-listener (например, утилиту `rustplus.js`
   из пакета `@liamcottle/rustplus.js` — там есть готовый скрипт
   `example/fcm-listen.js`), который перехватит push-уведомление о
   привязке и покажет `playerId`, `playerToken`, `server ip/port`.
4. Впишите эти значения в `.env`.

Это разовая процедура на новый вайп/сервер.

## 3. Аватарки тиммейтов (опционально)

Чтобы в приложении подтягивались настоящие фото профиля Steam:

1. Получите бесплатный ключ на https://steamcommunity.com/dev/apikey
2. Впишите его в `.env` → `STEAM_API_KEY`.

Без ключа приложение всё равно будет работать — вместо фото покажется
цветной кружок с инициалами игрока (у каждого — свой стабильный цвет).

## 4. Умные устройства (выключатели, сигнализации, TC upkeep)

1. В игре привяжите нужные устройства к Rust+ — посмотрите на
   выключатель / сигнализацию / storage monitor и в контекстном меню
   выберите "Pair with Rust+" (тот же принцип, что и пейринг сервера).
   Игра пришлёт `entityId` через тот же FCM-listener, что использовался
   для получения `RUST_PLAYER_ID`/`RUST_PLAYER_TOKEN`.
2. Скопируйте `entities.example.json` в `entities.json` и впишите
   реальные `id`, понятные `name` и `type` (`switch`, `alarm` или
   `storage_monitor`).
3. Перезапустите клиент — устройства появятся в Firebase (`/devices`)
   и сразу же в приложении на вкладке "Устройства".

Для мониторов хранилищ, привязанных рядом со шкафом (TC), Rust+ сам
отдаёт `hasProtection` и `protectionExpiry` — это и есть время, когда
сгниёт постройка. Отдельно ничего настраивать не нужно.

Включение/выключение свитча с телефона работает через очередь команд:
приложение пишет в `/commands`, клиент подхватывает, дёргает Rust+ и
удаляет обработанную команду.

## 5. Карта: RustMaps.com вместо встроенной (опционально)

По умолчанию карта берётся напрямую из Rust+ (`getMap`) — работает
всегда, без доп. настройки. Если хотите более качественную, аккуратно
отрисованную карту:

1. Получите бесплатный ключ на https://rustmaps.com/dashboard
2. Впишите его в `.env` → `RUSTMAPS_API_KEY`.

ПК-клиент сам узнает seed и размер карты сервера через Rust+ и запросит
готовую картинку у RustMaps. Если RustMaps ещё не сгенерировал эту
карту (бывает для свежего сида) или запрос не удался — автоматически
используется встроенная карта из Rust+, без разрывов в работе.

⚠️ У RustMaps есть лимиты запросов на бесплатном тарифе — это не
проблема для нас, так как карта запрашивается один раз за сессию
клиента, а не при каждом обновлении.

## 6. Настройка Firebase

1. Создайте проект на https://console.firebase.google.com
2. Включите **Realtime Database** (не Firestore) в тестовом режиме.
3. Project Settings → Service accounts → **Generate new private key**,
   сохраните файл как `serviceAccountKey.json` рядом с `index.js`.
4. Скопируйте URL базы данных (вида
   `https://<project-id>-default-rtdb.<region>.firebasedatabase.app`)
   в `.env` → `FIREBASE_DATABASE_URL`.

## 7. Запуск

```bash
npm start
```

При успешном подключении в консоли появится `[RustPlus] Подключено к Rust+`,
а в Firebase Realtime Database — узел `team` со списком участников
команды, обновляемый каждые `POLL_INTERVAL_MS` (по умолчанию 5 сек)
и мгновенно при событии смены состава команды.

## 8. Чат-бот (!команды)

Бот отвечает на `!help` / `!time` / `!online` в чате команды от имени
аккаунта pc-client — только на свежие сообщения (бэкфилл старых при
старте игнорируется), сам себе не отвечает. Выключается `CHAT_BOT=off`.

Права настраиваются в `.env`:

```
CHAT_BOT_ACCESS=everyone   # everyone | admins | owner
CHAT_BOT_ADMINS=76561...,76561...   # SteamID64 через запятую
```

- `everyone` — команды доступны всем тиммейтам;
- `admins` — только владельцу аккаунта pc-client и списку `CHAT_BOT_ADMINS`;
- `owner` — только владельцу аккаунта pc-client.

## Структура данных в Firebase

```
/team
  leaderSteamId: "7656119..."
  updatedAt: 1737320000000
  members: [
    {
      steamId: "7656119...",
      name: "Имя игрока",
      isOnline: true,
      isAlive: true,
      avatarUrl: "https://avatars.steamstatic.com/....jpg",
      x: 1234.5,
      y: 987.6,
      lastUpdated: 1737320000000
    },
    ...
  ]

/client_status
  status: "connected" | "disconnected" | "offline"
  updatedAt: 1737320000000

/map
  width: 4500
  height: 4500
  oceanMargin: 500
  monuments: [{ token: "harbor_2", x: 1200.3, y: 3400.1 }, ...]
  image: "https://cdn.rustmaps.com/..." | "data:image/jpeg;base64,..."
  source: "rustmaps" | "rustplus"
  updatedAt: 1737320000000

/devices/{entityId}
  id, name, type: "switch" | "alarm" | "storage_monitor"
  # switch/alarm:
  value: true | false
  # storage_monitor:
  hasProtection: true
  protectionExpiry: 1737400000   # unix-время в секундах
  capacity: 24
  items: [{ itemId, quantity, isBlueprint }]

/commands/{pushId}   # пишет мобильное приложение, ПК-клиент удаляет после обработки
  action: "toggle_switch"
  entityId: 123456
  value: true

/events/{pushId}
  type: "cargo_ship" | "ch47" | "patrol_helicopter" | "crate"
  label: "Грузовой корабль"
  action: "spawn" | "despawn"
  x, y
  timestamp: 1737320000000
```

Карта скачивается один раз при подключении (она не меняется до
следующего вайпа), координаты тиммейтов обновляются вместе с `/team`.

