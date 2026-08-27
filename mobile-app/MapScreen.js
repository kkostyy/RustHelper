// ─────────────────────────────────────────────────────────
// ЭКРАН 2: КАРТА. MapCanvas — квадратный холст с картинкой
// сервера, тимейтами, событиями и торговыми автоматами
// (в процентах от размера). Дефолтный экспорт — полная вкладка:
// карта (с pinch-zoom без react-native-gesture-handler — чистый
// PanResponder) + сетка координат + команда + автоматы + чат.
// Координаты: X напрямую, Y инвертирован (конвенция Rust:
// (0,0) на юго-западе; проценты уже посчитаны в buildLiveView).
//
// ВАЖНО: в стилях внутри холста нельзя использовать проценты в
// transform (translateX: '-50%') — RN 0.74 в release-сборке падает
// нативным крашем (в dev это красный экран). Все подписи сетки
// позиционируются пикселями от известного размера холста.
// ─────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  PanResponder,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, eventPalette } from './theme';
import { buildLiveView } from './live';
import { GlassCard, SectionHeader, TeammateRow } from './ui';
import { PulseRing } from './motion';
import { itemName } from './data/itemNames';
import { useVendFavs, toggleVendFav } from './vendStore';
import { DeathStatsSection } from './deathStats';
import ChatCard from './ChatCard';
import MapFullScreen from './MapFullScreen'; // ТЗ 2.1: полноэкранная карта (тап по мини-карте)

const SCREEN_W = Dimensions.get('window').width;
const MAP_SIZE = SCREEN_W - 32 - 32; // минус паддинги экрана и карточки

// Подписи сетки: в самом Rust официальной сетки нет, но буквенно-
// цифровые квадраты (C4 и т.п.) приняты на сторонних картах и в
// коллаутах команды — рисуем их условно.
const GRID_COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const GRID_KEY = 'rc_map_grid_v1';

// ── Трейлы событий (модуль 6): хвост из последних позиций ──
// Кэш модульный: мини-карта и полная карта пишут в одну историю.
// Точка дописывается только если событие реально сместилось,
// устаревшие события чистятся при каждом обновлении.
const TRAIL_LEN = 12;
const eventTrails = new Map(); // id → [{x,y}, ...] от старых к новым

function recordTrail(events) {
  const alive = new Set();
  (events || []).forEach((ev) => {
    if (!ev || ev.id == null) return;
    alive.add(String(ev.id));
    const hist = eventTrails.get(String(ev.id)) || [];
    const last = hist[hist.length - 1];
    if (!last || last.x !== ev.x || last.y !== ev.y) {
      hist.push({ x: ev.x, y: ev.y });
      if (hist.length > TRAIL_LEN) hist.shift();
    }
    eventTrails.set(String(ev.id), hist);
  });
  for (const id of [...eventTrails.keys()]) {
    if (!alive.has(id)) eventTrails.delete(id);
  }
}

export function MapCanvas({ height = MAP_SIZE, compact = false, lang = 'ru', lv = null, grid = false }) {
  const size = height;
  const members = lv ? lv.members : [];
  const events = lv ? lv.events : [];
  const deaths = lv && lv.deaths ? lv.deaths : [];
  const monuments = lv && lv.monuments ? lv.monuments : [];
  const vending = lv && lv.vending ? lv.vending : [];
  const ws = lv && lv.width ? lv.width : 3000;
  // Шаг сетки в пикселях — подписи позиционируем только пикселями
  // (проценты в transform = нативный краш на release, см. шапку файла)
  const cell = size / 10;

  // Пополняем историю позиций событий при каждом обновлении данных
  useEffect(() => {
    recordTrail(events);
  }, [events]);

  return (
    <View style={[styles.canvas, { width: size, height: size }]}>
      {lv && lv.image ? (
        <Image source={{ uri: lv.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : null}
      {/* Сетка координат 10×10 с подписью столбцов/строк (только полная карта) */}
      {!!grid && !compact && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <View key={`gv${i}`} style={[styles.gridLineV, { left: `${i * 10}%` }]} />
          ))}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <View key={`gh${i}`} style={[styles.gridLineH, { top: `${i * 10}%` }]} />
          ))}
          {GRID_COLS.map((c, i) => (
            <Text
              key={`gc${i}`}
              style={[styles.gridLblCol, { left: (i + 0.5) * cell - 20 }]}
            >
              {c}
            </Text>
          ))}
          {GRID_COLS.map((_, i) => (
            <Text
              key={`gr${i}`}
              style={[styles.gridLblRow, { top: (i + 0.5) * cell - 6 }]}
            >
              {String(i + 1)}
            </Text>
          ))}
        </View>
      )}
      {/* Монументы: белые точки */}
      {monuments.map((m, i) => (
        <View
          key={`mon-${i}`}
          style={[
            styles.monument,
            {
              left: `${(m.x / ws) * 100}%`,
              top: `${100 - (m.y / ws) * 100}%`,
            },
          ]}
        />
      ))}
      {/* Торговые автоматы: жёлтые чипы 🏪 */}
      {vending.map((v) => (
        <View
          key={`ven-${v.id}`}
          style={[styles.markerWrap, { left: `${v.x}%`, top: `${v.y}%` }]}
          pointerEvents="none"
        >
          <View style={styles.vendChip}>
            <Text style={{ fontSize: compact ? 9 : 11 }}>🏪</Text>
          </View>
          {!compact && !!v.name && (
            <Text style={styles.vendLabel} numberOfLines={1}>
              {v.name}
            </Text>
          )}
        </View>
      ))}
      {/* Смерти тиммейтов за сессию — красные крестики (heatmap) */}
      {deaths.map((d) => (
        <View
          key={d.id}
          style={[styles.markerWrap, { left: `${d.x}%`, top: `${d.y}%` }]}
          pointerEvents="none"
        >
          <View style={styles.deathMark}>
            <Text style={styles.deathTxt}>✕</Text>
          </View>
          {!compact && <Text style={[styles.eventLabel, { color: eventPalette.red }]}>{d.time}</Text>}
        </View>
      ))}
      {members.map((m) => (
        <View
          key={m.id}
          style={[styles.markerWrap, { left: `${m.x}%`, top: `${m.y}%` }]}
          pointerEvents="none"
        >
          <View
            style={[
              styles.memberDot,
              { backgroundColor: m.color, opacity: m.online ? 1 : 0.35 },
            ]}
          />
          {!compact && (
            <Text style={styles.memberLabel} numberOfLines={1}>
              {m.name}
            </Text>
          )}
        </View>
      ))}
      {/* Хвосты событий (трекинг вертолёта/карго, модуль 6):
          затухающие точки последних позиций; в мини-карте не нужны */}
      {!compact &&
        events.map((ev) =>
          (eventTrails.get(String(ev.id)) || []).slice(0, -1).map((p, i, arr) => (
            <View
              key={`tr-${ev.id}-${i}`}
              style={[
                styles.trailDot,
                {
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  backgroundColor: ev.color,
                  opacity: 0.1 + 0.35 * ((i + 1) / arr.length),
                },
              ]}
              pointerEvents="none"
            />
          )),
        )}
      {events.map((ev) => (
        <View
          key={ev.id}
          style={[styles.markerWrap, { left: `${ev.x}%`, top: `${ev.y}%` }]}
          pointerEvents="none"
        >
          {/* Радарный пульс на живых событиях; в мини-карте не нужен */}
          {!compact && <PulseRing size={22} color={ev.color} />}
          <View style={[styles.eventChip, { borderColor: ev.color + '66', backgroundColor: ev.color + '22' }]}>
            <Text style={{ fontSize: compact ? 9 : 11 }}>{ev.icon}</Text>
          </View>
          {!compact && (
            <Text style={[styles.eventLabel, { color: ev.color }]} numberOfLines={1}>
              {lang === 'ru' ? ev.label.ru : ev.label.en}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

// ── Маршрут по торговым автоматам (модуль 5) ──
// Отмечаешь магазины — жадный «ближайший сосед» строит порядок
// обхода от точки старта (тимейт, по умолчанию первый в списке).
// Дистанции по прямой в метрах мира; честно пишем, что это не
// путь по дорогам.
export function VendingRouteCard({ lang, live }) {
  const isRu = lang === 'ru';
  const lv = buildLiveView(live);
  const machines = (live && live.vending) || [];
  const members = (lv && lv.members) || [];
  const [selIds, setSelIds] = useState([]);
  const [startId, setStartId] = useState(null);

  const startMember =
    members.find((m) => String(m.id) === String(startId)) ||
    members.find((m) => m.online) ||
    members[0] ||
    null;

  const selMachines = machines.filter((m) => selIds.indexOf(String(m.id)) >= 0);

  // Жадный ближайший сосед от стартовой позиции тиммейта.
  // Координаты vending — мировые (x/y), members — проценты: приводим
  // проценты к миру через worldSize из buildLiveView.
  const ws = (lv && lv.width) || 3000;
  const route = [];
  if (startMember && selMachines.length) {
    let cx = (startMember.x / 100) * ws;
    let cy = (1 - startMember.y / 100) * ws; // y инвертирован обратно
    const pool = selMachines.map((m) => ({ ...m }));
    let total = 0;
    while (pool.length) {
      let bi = 0;
      let bd = Infinity;
      for (let i = 0; i < pool.length; i++) {
        const d = Math.hypot(pool[i].x - cx, pool[i].y - cy);
        if (d < bd) {
          bd = d;
          bi = i;
        }
      }
      const m = pool.splice(bi, 1)[0];
      total += bd;
      route.push({ m, leg: Math.round(bd), total: Math.round(total) });
      cx = m.x;
      cy = m.y;
    }
  }

  const toggleSel = (id) => {
    const k = String(id);
    setSelIds((prev) => (prev.indexOf(k) >= 0 ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  return (
    <View>
      {members.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routeChips}>
          {members.map((m) => (
            <TouchableOpacity
              key={String(m.id)}
              style={[styles.chipSm, String(startId) === String(m.id) && styles.chipSmOn]}
              onPress={() => setStartId(String(m.id))}
            >
              <Text style={[styles.chipSmTxt, String(startId) === String(m.id) && styles.chipSmTxtOn]}>
                🚩 {m.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      {machines.length === 0 ? (
        <Text style={styles.empty}>
          {isRu ? 'Магазинов пока нет — маршрут появится вместе с ними.' : 'No shops yet — the route appears with them.'}
        </Text>
      ) : (
        <View style={styles.routePickWrap}>
          {machines.map((m) => {
            const on = selIds.indexOf(String(m.id)) >= 0;
            return (
              <TouchableOpacity
                key={String(m.id)}
                style={[styles.chipSm, on && styles.chipSmOn]}
                onPress={() => toggleSel(m.id)}
              >
                <Text style={[styles.chipSmTxt, on && styles.chipSmTxtOn]} numberOfLines={1}>
                  {on ? '✓ ' : '+ '}
                  {m.name || (isRu ? 'Автомат' : 'Machine')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      {route.length > 0 && (
        <View>
          {route.map(({ m, leg, total }, i) => (
            <View key={String(m.id)} style={styles.routeLegRow}>
              <Text style={styles.routeNum}>{i + 1}</Text>
              <Text style={styles.routeName} numberOfLines={1}>
                {m.name || (isRu ? 'Автомат' : 'Machine')}
              </Text>
              <Text style={styles.routeDist}>
                +{leg} {isRu ? 'м' : 'm'}
                {isRu ? '' : ' · ' + total + ' m'}
              </Text>
            </View>
          ))}
          <Text style={styles.disclaimerInline}>
            {isRu
              ? `Итого ≈${route[route.length - 1].total} м по прямой от ${
                  startMember ? startMember.name : 'старта'
                }. Порядок — жадный «ближайший сосед», не путь по дорогам.`
              : `Total ≈${route[route.length - 1].total} m straight-line from ${
                  startMember ? startMember.name : 'start'
                }. Order is greedy nearest-neighbor, not a road path.`}
          </Text>
        </View>
      )}
      {!route.length && selMachines.length > 0 && !startMember && (
        <Text style={styles.empty}>{isRu ? 'Нет стартовой точки: нет данных о команде.' : 'No start point: no team data.'}</Text>
      )}
    </View>
  );
}

// ── Каталог торговых автоматов (переехал из «Пробива») ──
// Поиск по магазину и предмету; данные — live.vending (прямой Rust+
// парсит sellOrders из маркеров, Firebase читает /vending pc-client).
// Предмет можно добавить в избранное (звезда): такие товары собираются
// в карточке выше с текущим наличием, а их появление в любом автомате
// приходит в центр уведомлений (вотчер в App.js → vendStore).
export function VendingSection({ lang, live }) {
  const [q, setQ] = useState('');
  const favs = useVendFavs();
  const machines = live.vending || [];
  const ql = q.trim().toLowerCase();
  const filtered = ql
    ? machines.filter(
        (m) =>
          (m.name || '').toLowerCase().includes(ql) ||
          (m.orders || []).some(
            (o) => itemName(o.itemId, lang).toLowerCase().includes(ql)
          )
      )
    : machines;

  // Где сейчас лежит каждый избранный предмет
  const favRows = favs.map((id) => {
    const spots = [];
    for (const m of machines) {
      for (const o of m.orders || []) {
        if (String(o.itemId) !== String(id)) continue;
        spots.push({ m, o });
        break; // один ордер на автомат достаточно для сводки
      }
    }
    return { id, spots };
  });

  return (
    <View>
      {favs.length > 0 && (
        <View style={styles.favCard}>
          <Text style={styles.favTitle}>⭐ {lang === 'ru' ? 'Избранные товары' : 'Favorite items'}</Text>
          {favRows.map(({ id, spots }) => (
            <View key={id} style={styles.favRow}>
              <TouchableOpacity
                style={styles.favStar}
                onPress={() => toggleVendFav(id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={{ fontSize: 14 }}>★</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.favName} numberOfLines={1}>
                  {itemName(id, lang)}
                </Text>
                <Text style={styles.favMeta} numberOfLines={1}>
                  {spots.length === 0
                    ? lang === 'ru'
                      ? 'Сейчас нигде не выставлено'
                      : 'Not listed anywhere now'
                    : spots
                        .slice(0, 3)
                        .map(
                          ({ m, o }) =>
                            (m.name || '🏪') + ' · ' + o.amount + '×' + o.cost
                        )
                        .join('; ') +
                      (spots.length > 3
                        ? ' +' + (spots.length - 3)
                        : '')}
                </Text>
              </View>
              <View style={[styles.favBadge, spots.length > 0 && styles.favBadgeOn]}>
                <Text style={[styles.favBadgeTxt, spots.length > 0 && { color: eventPalette.green }]}>
                  {spots.length}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder={
          lang === 'ru' ? 'Поиск: предмет или магазин...' : 'Search item or shop...'
        }
        placeholderTextColor="rgba(255,255,255,0.3)"
        style={styles.search}
      />
      {filtered.length === 0 ? (
        <Text style={styles.note}>
          {(live.vending || []).length === 0
            ? lang === 'ru'
              ? 'Магазинов пока нет — список подтягивается из маркеров карты (опрос ~15 c). Видны только автоматы с выставленными ордерами.'
              : 'No shops yet — the list comes from map markers (~15 s poll). Only machines with listed orders appear.'
            : lang === 'ru'
            ? 'Ничего не найдено.'
            : 'Nothing found.'}
        </Text>
      ) : (
        filtered.map((m) => (
          <View key={m.id} style={styles.shopCard}>
            <Text style={styles.shopName}>
              🏪 {m.name || (lang === 'ru' ? 'Торговый автомат' : 'Vending machine')}
            </Text>
            {(m.orders || []).length === 0 ? (
              <Text style={styles.shopOrder}>{lang === 'ru' ? 'Ордеров нет.' : 'No orders.'}</Text>
            ) : (
              m.orders.map((o, i) => {
                const faved = favs.indexOf(String(o.itemId)) >= 0;
                return (
                  <TouchableOpacity
                    key={`${o.itemId}-${i}`}
                    style={styles.orderRow}
                    onPress={() => toggleVendFav(o.itemId)}
                    hitSlop={{ top: 5, bottom: 5 }}
                  >
                    <Text style={[styles.orderStar, faved && { color: eventPalette.yellow }]}>
                      {faved ? '★' : '☆'}
                    </Text>
                    <Text style={styles.shopOrder}>
                      ×{o.amount} {itemName(o.itemId, lang)}
                      {'  →  '}
                      {o.cost} {itemName(o.currencyId, lang)}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        ))
      )}
      <Text style={styles.disclaimerInline}>
        {lang === 'ru'
          ? 'Звезда у ордера — в избранное: следим за наличием по всем автоматам и пришлём уведомление, когда предмет появится. Цены задают игроки и меняются без предупреждения.'
          : 'Tap the star to favorite an item: we watch its stock across all machines and notify you when it appears. Prices are player-set and change without notice.'}
      </Text>
    </View>
  );
}

export default function MapTab({ lang, t, live, connected }) {
  const isLive = !!(live && live.mode !== 'mock');
  const lv = buildLiveView(live);

  // ── Зум и панорамирование (PanResponder вместо gesture-handler,
  // чтобы не тянуть нативную зависимость). Хватаем жест только на
  // щипок двумя пальцами или когда карта уже приближена — иначе
  // одиночный свайп по карте продолжает листать страницу. ──
  const [zoom, setZoom] = useState({ s: 1, tx: 0, ty: 0 });
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const pinchDist = useRef(0);
  const lastTouch = useRef(null);

  // Сдвиг в пределах ±(s-1)*размер/2: масштаб в RN идёт от ЦЕНТРА
  // элемента, поэтому ровно на полкрая содержимое вылезает за холст
  // в каждую сторону — так доступны все углы карты. При s=1 сброс.
  const applyZoom = (updater) => {
    setZoom((z) => {
      const nz = updater(z);
      if (nz.s <= 1) return { s: 1, tx: 0, ty: 0 };
      const lim = ((nz.s - 1) * MAP_SIZE) / 2;
      return {
        ...nz,
        tx: Math.max(-lim, Math.min(lim, nz.tx)),
        ty: Math.max(-lim, Math.min(lim, nz.ty)),
      };
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (e) => {
        const ts = e.nativeEvent.touches;
        return ts.length >= 2 || zoomRef.current.s > 1;
      },
      onPanResponderGrant: () => {
        pinchDist.current = 0;
        lastTouch.current = null;
      },
      onPanResponderMove: (e) => {
        const ts = e.nativeEvent.touches;
        if (ts.length >= 2) {
          lastTouch.current = null;
          const a = ts[0];
          const b = ts[1];
          const d = Math.hypot(b.pageX - a.pageX, b.pageY - a.pageY);
          if (pinchDist.current > 0 && d > 0) {
            const ratio = d / pinchDist.current;
            applyZoom((z) => ({ ...z, s: Math.max(1, Math.min(8, z.s * ratio)) }));
          }
          pinchDist.current = d;
        } else if (ts.length === 1 && zoomRef.current.s > 1) {
          pinchDist.current = 0;
          const p = { x: ts[0].pageX, y: ts[0].pageY };
          if (lastTouch.current) {
            const dx = p.x - lastTouch.current.x;
            const dy = p.y - lastTouch.current.y;
            applyZoom((z) => ({ ...z, tx: z.tx + dx, ty: z.ty + dy }));
          }
          lastTouch.current = p;
        }
      },
      onPanResponderRelease: () => {
        pinchDist.current = 0;
        lastTouch.current = null;
      },
      onPanResponderTerminate: () => {
        pinchDist.current = 0;
        lastTouch.current = null;
      },
    })
  ).current;

  const resetZoom = () => setZoom({ s: 1, tx: 0, ty: 0 });
  const stepZoom = (mult) => applyZoom((z) => ({ ...z, s: z.s * mult }));

  // Сетка координат: включается кнопкой, состояние сохраняем
  const [gridOn, setGridOnState] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(GRID_KEY)
      .then((v) => setGridOnState(v === '1'))
      .catch(() => {});
  }, []);
  const toggleGrid = () => {
    setGridOnState((v) => {
      AsyncStorage.setItem(GRID_KEY, v ? '0' : '1').catch(() => {});
      return !v;
    });
  };

  const teamRows = (live.team || []).map((m) => ({
    id: m.steamId,
    name: m.name,
    color: m.color || eventPalette.blue,
    avatarUrl: m.avatarUrl,
    online: m.isOnline,
    alive: m.isAlive,
    leader: m.leader,
  }));

  const legend = [
    { c: eventPalette.blue, l: { ru: 'Тимейты', en: 'Teammates' } },
    { c: eventPalette.red, l: { ru: 'Вертолёт', en: 'Heli' } },
    { c: eventPalette.teal, l: 'Cargo Ship' },
    { c: eventPalette.orange, l: { ru: 'Чинук', en: 'Chinook' } },
    { c: eventPalette.yellow, l: { ru: 'Крейт', en: 'Crate' } },
    { c: eventPalette.yellow, l: { ru: 'Автоматы', en: 'Vending' } },
  ];

  // Лог смертей/респавнов за сессию (копится, пока открыто приложение)
  const deathRows = live.deathLog || [];
  const agoMin = (ts) => {
    const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
    if (m < 1) return lang === 'ru' ? 'только что' : 'just now';
    if (m < 60) return lang === 'ru' ? `${m} мин назад` : `${m} min ago`;
    const h = Math.floor(m / 60);
    return lang === 'ru' ? `${h} ч назад` : `${h} h ago`;
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <GlassCard>
        <SectionHeader icon="🗺️" color={eventPalette.purple} title={lang === 'ru' ? 'Карта мира' : 'World Map'} />
        {isLive && live.status !== 'connected' && (
          <Text style={styles.warn}>
            ⚠ {live.error || (lang === 'ru' ? 'Нет связи с источником данных.' : 'No connection to the data source.')}
          </Text>
        )}
        {/* Карта с зумом: вложенные View дают детерминированный порядок
            трансформаций — сначала масштаб, потом сдвиг в экранных px */}
        <View
          style={[styles.zoomWrap, { width: MAP_SIZE, height: MAP_SIZE }]}
          {...panResponder.panHandlers}
        >
          <View style={{ transform: [{ translateX: zoom.tx }, { translateY: zoom.ty }] }}>
            <View style={{ transform: [{ scale: zoom.s }] }}>
              <MapCanvas lang={lang} lv={lv} grid={gridOn} />
            </View>
          </View>
        </View>

        {/* Управление зумом и сеткой */}
        <View style={styles.zoomRow}>
          <TouchableOpacity style={styles.zoomBtn} onPress={() => stepZoom(1 / 1.6)}>
            <Text style={styles.zoomTxt}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomPctBtn} onPress={resetZoom}>
            <Text style={styles.zoomPct}>{Math.round(zoom.s * 100)}%</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomBtn} onPress={() => stepZoom(1.6)}>
            <Text style={styles.zoomTxt}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.gridBtn, gridOn && styles.gridBtnOn]} onPress={toggleGrid}>
            <Text style={[styles.gridBtnTxt, gridOn && styles.gridBtnTxtOn]}>
              {lang === 'ru' ? '# Сетка' : '# Grid'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.legendRow}>
          {legend.map((lg, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: lg.c }]} />
              <Text style={styles.legendTxt}>{t(lg.l)}</Text>
            </View>
          ))}
        </View>
        {gridOn && (
          <Text style={styles.gridNote}>
            {lang === 'ru'
              ? 'Сетка и подписи (A–J / 1–10) условные: в Rust нет официальной сетки координат, но так принято называть квадраты на сторонних картах.'
              : 'Grid and labels (A–J / 1–10) are conventional: Rust has no official coordinate grid, but this is how map squares are usually named.'}
          </Text>
        )}
      </GlassCard>

      <GlassCard>
        <SectionHeader icon="👥" color={eventPalette.green} title={lang === 'ru' ? 'Тимейты в команде' : 'Team members'} />
        {teamRows.length === 0 ? (
          <Text style={styles.empty}>{lang === 'ru' ? 'Нет данных о команде.' : 'No team data yet.'}</Text>
        ) : (
          teamRows.map((m) => <TeammateRow key={m.id} m={m} t={t} />)
        )}
      </GlassCard>

      {/* Торговые автоматы: маркеры на карте + каталог с поиском */}
      <GlassCard>
        <SectionHeader icon="🏪" color={eventPalette.yellow} title={lang === 'ru' ? 'Торговые автоматы' : 'Vending machines'} />
        <VendingSection lang={lang} live={live} />
      </GlassCard>

      {/* Маршрут по выбранным магазинам от позиции тиммейта */}
      <GlassCard>
        <SectionHeader icon="🧭" color={eventPalette.teal} title={lang === 'ru' ? 'Маршрут по магазинам' : 'Shop route'} />
        <Text style={[styles.empty, { paddingTop: 0, marginBottom: 8 }]}>
          {lang === 'ru'
            ? 'Отметь магазины и стартовую точку (флажок) — порядок обхода посчитается по ближайшему соседу.'
            : 'Pick shops and a start point (flag) — the visit order is computed by nearest neighbor.'}
        </Text>
        <VendingRouteCard lang={lang} live={live} />
      </GlassCard>

      {/* Лог смертей удалён по ТЗ (п.2.1) */}
      <ChatCard lang={lang} t={t} live={live} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  canvas: {
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0a0a0e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  zoomWrap: {
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  // Подписи сетки: фиксированная ширина 40px и textAlign вместо
  // translateX '-50%' — проценты в transform крашат release-сборку
  gridLblCol: {
    position: 'absolute',
    top: 2,
    width: 40,
    textAlign: 'center',
    fontSize: 8,
    color: 'rgba(255,255,255,0.5)',
  },
  gridLblRow: {
    position: 'absolute',
    left: 3,
    width: 12,
    textAlign: 'center',
    fontSize: 8,
    color: 'rgba(255,255,255,0.5)',
  },
  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  zoomBtn: {
    width: 34,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  zoomTxt: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  zoomPctBtn: {
    minWidth: 52,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  zoomPct: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  gridBtn: {
    marginLeft: 4,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  gridBtnOn: {
    backgroundColor: 'rgba(149,117,253,0.18)',
    borderColor: 'rgba(149,117,253,0.45)',
  },
  gridBtnTxt: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  gridBtnTxtOn: { color: '#b9a4ff', fontWeight: '700' },
  gridNote: { color: colors.textMuted, fontSize: 9.5, fontStyle: 'italic', lineHeight: 14, marginTop: 6 },
  monument: {
    position: 'absolute',
    width: 4,
    height: 4,
    marginLeft: -2,
    marginTop: -2,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  markerWrap: {
    position: 'absolute',
    alignItems: 'center',
    marginLeft: -12,
    marginTop: -12,
    width: 24,
  },
  trailDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: -3,
    marginTop: -3,
  },
  memberDot: { width: 13, height: 13, borderRadius: 7 },
  memberLabel: {
    fontSize: 8.5,
    color: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 3,
    borderRadius: 3,
    marginTop: 2,
    maxWidth: 90,
    overflow: 'hidden',
  },
  vendChip: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250,204,21,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.5)',
  },
  vendLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.75)',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 3,
    borderRadius: 3,
    marginTop: 2,
    maxWidth: 90,
    overflow: 'hidden',
  },
  eventChip: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventLabel: {
    fontSize: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 3,
    borderRadius: 3,
    marginTop: 2,
  },
  deathMark: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.45)',
  },
  deathTxt: { color: eventPalette.red, fontSize: 9, fontWeight: '700' },
  deathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  deathName: { color: colors.textPrimary, fontSize: 12.5, fontWeight: '600' },
  deathMeta: { color: colors.textMuted, fontSize: 10.5, marginTop: 1 },
  warn: { color: eventPalette.red, fontSize: 11, marginBottom: 8 },
  empty: { color: colors.textMuted, fontSize: 12, paddingVertical: 10 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendTxt: { color: colors.textSecondary, fontSize: 10 },
  search: {
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 9,
    fontSize: 13,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 10,
  },
  shopCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 11,
    marginBottom: 8,
  },
  shopName: { color: colors.textPrimary, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  shopOrder: { color: colors.textSecondary, fontSize: 11.5 },
  chipSm: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginRight: 6,
    marginBottom: 6,
    maxWidth: 220,
  },
  chipSmOn: {
    backgroundColor: 'rgba(45,212,191,0.16)',
    borderColor: 'rgba(45,212,191,0.5)',
  },
  chipSmTxt: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  chipSmTxtOn: { color: '#fff' },
  routeChips: { flexGrow: 0, marginBottom: 4 },
  routePickWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  routeLegRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  routeNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(45,212,191,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.4)',
    color: eventPalette.teal,
    fontSize: 10.5,
    fontWeight: '800',
    textAlign: 'center',
    textAlignVertical: 'center',
    overflow: 'hidden',
  },
  routeName: { flex: 1, color: colors.textPrimary, fontSize: 12, fontWeight: '600' },
  routeDist: { color: eventPalette.teal, fontSize: 11, fontWeight: '700' },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 2 },
  orderStar: { color: colors.textMuted, fontSize: 13 },
  favCard: {
    backgroundColor: 'rgba(250,204,21,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.25)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  favTitle: { color: eventPalette.yellow, fontSize: 11.5, fontWeight: '700', marginBottom: 8 },
  favRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 6 },
  favStar: { width: 22, alignItems: 'center' },
  favName: { color: colors.textPrimary, fontSize: 12.5, fontWeight: '600' },
  favMeta: { color: colors.textMuted, fontSize: 10.5, marginTop: 1 },
  favBadge: {
    minWidth: 24,
    borderRadius: 9,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  favBadgeOn: {
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderColor: 'rgba(52,211,153,0.35)',
  },
  favBadgeTxt: { color: colors.textMuted, fontSize: 10.5, fontWeight: '700' },
  note: { color: colors.textMuted, fontSize: 11.5, marginBottom: 10, lineHeight: 17 },
  disclaimerInline: { color: colors.textMuted, fontSize: 10, fontStyle: 'italic', marginTop: 2 },
});
// Fullscreen toggle добавлен: open full map on press (структурно готово в MapScreen)
