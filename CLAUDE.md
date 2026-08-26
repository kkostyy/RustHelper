# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A Rust game companion system in three independent pieces:

1. **`RustCompanion.jsx`** (repo root) — a single-file React **web app** of the whole system ("Liquid Glass" design). No build tooling, no package.json — it's meant to be previewed in a JSX playground (e.g. babel standalone / vite-playground), not built here. It has three selectable data sources (stored in localStorage `rc_source_v1`, chosen in the connect modal / Настройки): **demo** (static mock data), **Firebase** (REST polling of the same RTDB paths the mobile-app reads — works on https playgrounds), and **direct Rust+** (hand-rolled protobuf-over-WebSocket to the game server, no pc-client needed — blocked by mixed content on https pages, so it only works when the file is opened locally; requests are serialized ≥1100 ms apart because the companion server rate-limits).
2. **`pc-client/`** — a Node.js bridge that connects to a Rust server's official Rust+ API (`@liamcottle/rustplus.js`) and mirrors live state into a Firebase Realtime Database.
3. **`mobile-app/`** — a React Native (0.74, bare CLI, not Expo) app named **S-eye viewer** that mirrors the web version: the same 6 tabs (Мейн/Карта/Устройства/Пробив/Другое/Настройки), team chat, a notification center (`mobile-app/notifStore.js` — module-level store + `useNotifs()` hook, bell button in the header), and the same three data sources (demo / Firebase REST polling / direct Rust+ over WebSocket+protobuf). No `@react-native-firebase` and no google-services.json — Firebase is plain REST (`fetch`), Rust+ is a hand-rolled port of the web codec in `mobile-app/live.js`. Shared animations live in `mobile-app/motion.js` (core `Animated` with `useNativeDriver` only — no reanimated/gesture-handler; map pinch-zoom is a hand-rolled `PanResponder`). **RN 0.74 hazard: transform values must be numbers — `translateX: '-50%'` passes DEV validation? no: it throws in DEV, and in release the string reaches native and crashes (that was the map crash). Percent strings are only valid for layout props (left/top/width).** AsyncStorage keys: `rc_source_v1` / `rc_lang_v1`, plus feature keys `rc_bg_v1` (custom background photo as data-URI + dim), `rc_dash_v1` (main-screen widget toggles), `rc_map_grid_v1`, `rc_queue_alert_v1`, `rc_notif_v1`/`rc_notif_seen_v1`/`rc_dnd_v1` (notification center), `rc_notifcfg_v1` (per-kind notification toggles, anti-spam 60 s same-title cooldown lives in `pushNotif`), `rc_timefmt_v1` ('24'|'12'|'auto', read by `hhmm()` in live.js), `rc_track_v1` (Пробив tracking list), `rc_vend_fav_v1` (vending item favorites; `vendStore.js` watcher lives in App.js and pushes kind:'shop' when a favorited item appears in any machine — first snapshot is silent), `rc_chat_macros_v1` (user chat macros, ＋ adds from draft / long-press deletes, defaults are built-in), `rc_cctv_fav_v1` (`cctvStore.js`, favorite CCTV camera codes pinned atop the catalog), `rc_doorcodes_v1` (Code Breaker door-code vault: array of found 4-digit codes, persisted across restarts), `rc_admin_v1`/`rc_yt_v1` (Админ-панель: admin-rights flag + YouTuber list, local-only until the accounts system lands), `rc_farm_v1` (Crossbreeding farm: saved {clones:[{id,genes,count}], target} snapshot via Сохранить/Загрузить), `rc_lootradar_v1` (loot-radar card toggle on Устройства), `rc_srvhist_v1` (24 h players/queue samples every 5 min — `srvHist.js`, sparkline on Пробив «Сервер», restart alert via wipeTime change + connection lost/restored alerts; watcher also in App.js), `rc_bmkey_v1` (optional BattleMetrics API key), `rc_sound_v1`/`rc_native_v1` (reserved toggles, not wired yet). Other module-level stores with watchers in App.js: `smeltWatch.js` («furnace done» notification when ore in a storage monitor has been there ≥ its smelt time; shared math with DevicesScreen lives in `smeltCalc.js`), `deathStats.js` (pure aggregation of the session death log: by hour / dangerous map cells A1–J10 / per player — rendered under the death log on Карта). Firebase-mode settings backup (модуль 1): SettingsScreen «Облако» PUTs/GETs `/users/<steamId>/settings.json` (`{keys:{<asyncStorageKey>:<rawValue>}, savedAt}`) for rc_lang/timefmt/dash/notifcfg/track/vend_fav keys — bg photo deliberately excluded. Player lookup data sources (mobile-app/lookup.js): Steam Community XML (keyless), Steam profile HTML (`fetchSteamExtras` — level, ban counts + days since last ban, games/groups counters; regex-parsed, public profiles only), **RustLookup** (`https://rust-stats.onrender.com/api/player?player=<id64>` — free keyless combat stats sourced from BattleMetrics; **as of 2026-08-25 the Render instance is suspended by its owner** — the code stays and shows an honest error; if it returns: 502/503 on cold start, 60 s fetch timeout, `steam_hours.playtime_forever` is already in hours), BattleMetrics API (403 without a paid key). ruststats.com is dead (parked domain); ruststats.io is alive but hands out API keys manually via Discord; ruststats.cc / rustclash.com block non-browser clients with Cloudflare. Item IDs (`mobile-app/data/lootCats.js`, `itemNames.js`, `smeltCalc.js`) were verified against the game data dump v2252 (github.com/Ryan-J-D/Rust-Item-IDs) on 2026-08-25 — older guides list different (wrong) IDs, so don't copy them blindly. The pc-client chat bot has access rights: `CHAT_BOT_ACCESS=everyone|admins|owner` + `CHAT_BOT_ADMINS` (comma-separated SteamID64).

The long-term product vision is a 16-module spec (`ROADMAP.md`, from 2026-08-24) — new features should be checked against its feasibility tiers (offline content → live modules over the existing pipeline → infra/UI → API-limited) before implementation.

Data flow (web and mobile are independent consumers): `Rust server ⇄ pc-client (index.js) ⇄ Firebase RTDB ⇄ {mobile-app | RustCompanion.jsx}`; in direct mode both skip pc-client entirely. The APK is built by **GitHub Actions** (`.github/workflows/android-apk.yml`) because this machine has no Node/JDK/SDK — the workflow unpacks the official RN 0.74 template straight from the npm tarball (`react-native init` dies in CI on the pod-install step), copies `mobile-app/**/*.js` over it, installs the pinned native deps from `mobile-app/package.json` (async-storage, clipboard, linear-gradient, image-picker), patches the manifest (`usesCleartextTraffic` for ws:// direct mode + `READ_MEDIA_IMAGES`/`READ_EXTERNAL_STORAGE maxSdk=32` for the background photo picker), copies `mobile-app/android-res/mipmap-*` over the template res and rewrites `app_name` to "S-eye viewer" (the template's literal "Hello App Display Name" has a `moduleConfig="true"` attribute — the sed matches both forms), then builds `assembleRelease` (self-contained JS bundle, debug-signed) as artifact `RustCompanion-apk`.

## Commands

There are **no lint/test/build commands anywhere** in this repo.

```bash
# pc-client
cd pc-client
npm install
copy .env.example .env        # fill RUST_SERVER_IP/PORT, RUST_PLAYER_ID/TOKEN, FIREBASE_*
npm start                     # node index.js

# mobile-app — no android/ios project is committed; either build via GitHub
# Actions (push to main → workflow artifact RustCompanion-debug-apk) or scaffold locally:
npx react-native@0.74 init RustCompanionMobile   # then copy mobile-app/*.js + data/*.js over
cd RustCompanionMobile && npm install \
  @react-native-async-storage/async-storage @react-native-clipboard/clipboard react-native-linear-gradient
npm start                     # metro
npm run android
```

**Node.js is not installed on this machine** — JS/JSX syntax cannot be checked with esbuild/tsc/npx locally. Verify changes by structural greps and targeted reads instead.

## Architecture notes (the non-obvious parts)

### Firebase is one of two transports (the other is direct Rust+)
- PC → phone: `/team`, `/client_status` (`connected|disconnected|offline`), `/map`, `/devices/{entityId}`, `/events/{pushId}`, `/vending` (vending machines from map markers type 2, with sellOrders — rewritten only when changed), `/chat` (team chat messages `{steamId,name,message,color,time}` — from `broadcast.teamMessage` pushes plus periodic `getTeamChat` backfill, trimmed to last 100), `/server_info` (`getInfo` + `getTime` polled every 60s: name/players/maxPlayers/queuedPlayers/mapSize/wipeTime/seed/gameTime).
- Phone/web → PC: `/commands/{pushId}` — app writes `{action:'toggle_switch', entityId, value, requestedAt}` or `{action:'send_team_message', text, requestedAt}` (text sliced to 128 chars); pc-client consumes on `child_added`, executes, then **deletes** the command node. Any new phone→PC action must follow this write-then-delete contract.
- pc-client also runs an optional chat bot (`!help` / `!time` / `!online` in team chat, disabled via `CHAT_BOT=off` in `.env`). It answers **only** fresh `teamMessage` broadcasts — never the `getTeamChat` backfill (old messages would fire on startup) and never messages from its own steamId (infinite loop). Keep both guards when extending the command set.
- Game events (cargo ship, patrol helicopter, chinook, airdrop crate) have **no Rust+ API** — pc-client derives them by diffing consecutive `getMapMarkers()` snapshots every `EVENTS_POLL_INTERVAL_MS`. Marker type ids: 4=ch47, 5=cargo_ship, 6=crate, 8=heli.
- Map image is fetched **once per session** (`getMap` → base64 `jpgImage`), optionally replaced by a prettier RustMaps.com render when `RUSTMAPS_API_KEY` is set (HTTP 202 = still generating → keep the fallback).

### Pairing / credentials
- `RUST_PLAYER_ID` + `RUST_PLAYER_TOKEN` come from pairing the official Rust+ app with the server (FCM listener procedure described in `pc-client/README.md`). Without them nothing runs.
- Real `pc-client/.env`, `serviceAccountKey.json`, and `entities.json` are local-only secrets — only their `.example` templates are in the repo. Never hardcode or commit real values.

### Coordinate conversion (maps)
All renderers map X directly but **invert Y** (`top = 100 - (y/worldSize)*100` in percent). In the mobile app this lives in `buildLiveView`/`MapCanvas` (`mobile-app/live.js`, `mobile-app/MapScreen.js`) — keep the inversion consistent in any new map rendering (the web version does the same inside its `MapCanvas`).

## Conventions

- **Bilingual UI**: text lives in `{ ru: "...", en: "..." }` objects rendered through a `t(obj)` helper / `lang` prop (`"ru"` default). New strings must carry both languages.
- **Theming**: mobile palette is centralized in `mobile-app/theme.js` (`gradientColors`, `glassCard`) — change colors there, not per-screen. The root mockup keeps its own equivalent tokens (`accent`, `glassStyle`) at the top of `RustCompanion.jsx`.
- Root mockup navigation is a fixed **6-tab bottom bar**: Мейн / Карта / Умный дом / Пробив / Другое / Настройки. «Другое» is a submenu container (Бинды, Про-конфиги игроков, Полезная информация, Инструменты). Tools use editable inputs and «≈» markers where values are approximations rather than inventing authoritative constants.
- Comments and UI copy are in Russian; reference data (raid costs, loot tables) carries a disclaimer that numbers match vanilla balance at time of writing and should be re-checked after balance patches.

## Windows environment hazard

This shell is Windows PowerShell 5.1 with cp1251 as the system codepage. `Get-Content`/`Out-File` without explicit encoding silently corrupt UTF-8 Cyrillic into mojibake. For any file operation involving Russian text use `[IO.File]::ReadAllText($p, [Text.Encoding]::UTF8)` / `[IO.File]::WriteAllText($p, $c, (New-Object Text.UTF8Encoding($false)))`, or prefer the Read/Write/Edit tools. Files >~50 KB should be written in parts and concatenated with explicit UTF-8 encoding.
