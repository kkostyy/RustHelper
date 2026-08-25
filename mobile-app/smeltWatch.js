// ─────────────────────────────────────────────────────────
// Вотчер «печь доплавилась» (модуль 2 спецификации).
// Ставится один раз в App.js: смотрит storage-мониторы с рудой,
// запоминает момент появления каждой закладки (сигнатура = состав
// руды+дерева) и когда прошло ≈oreSec — пушит kind:'event'
// important в центр уведомлений. Смена состава сбрасывает таймер.
// Устройства приходят через ref (массив пересоздаётся каждый
// рендер — интервал не должен пересобираться). Хранение
// сессионное (Map вне React): после перезапуска приложения
// отсчёт начнётся заново от первого опроса — честнее не делать
// вид, что знаем момент закладки раньше.
// Точность ограничена частотой поллинга устройств (~15 c) и
// ванильными скоростями; сервер может менять скорости плавки.
// ─────────────────────────────────────────────────────────
import { useEffect, useRef } from 'react';
import { pushNotif } from './notifStore';
import { analyzeSmelting } from './smeltCalc';

// deviceId → { sig, startedTs, notified }
const watch = new Map();

function oreLabel(counts, lang) {
  const isRu = lang === 'ru';
  const parts = [];
  if (counts.metal) parts.push(isRu ? 'металл' : 'metal');
  if (counts.sulfur) parts.push(isRu ? 'сера' : 'sulfur');
  if (counts.hqm) parts.push(isRu ? 'МВК' : 'HQM');
  return parts.join(' + ');
}

export function useSmeltWatcher(devices, lang) {
  const devRef = useRef(devices);
  devRef.current = devices;
  const langRef = useRef(lang);
  langRef.current = lang;

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const isRu = langRef.current === 'ru';
      for (const dev of devRef.current || []) {
        if (!dev || dev.type !== 'storage_monitor') continue;
        const s = analyzeSmelting(dev.items);
        const id = String(dev.id);
        if (!s) {
          watch.delete(id); // руда кончилась/убрана — забываем таймер
          continue;
        }
        const sig =
          s.counts.metal + '|' + s.counts.sulfur + '|' + s.counts.hqm + '|' + s.counts.wood;
        let w = watch.get(id);
        if (!w || w.sig !== sig) {
          w = { sig, startedTs: now, notified: false };
          watch.set(id, w);
          continue; // закладка новая — ждём
        }
        if (w.notified) continue;
        const elapsedSec = (now - w.startedTs) / 1000;
        if (elapsedSec >= s.oreSec) {
          w.notified = true;
          const nm = dev.name || (isRu ? 'монитор' : 'monitor');
          pushNotif({
            kind: 'event',
            important: true,
            title: {
              ru: '🔥 ' + nm + ': руда доплавилась',
              en: '🔥 ' + nm + ': ore finished smelting',
            },
            body: {
              ru:
                oreLabel(s.counts, 'ru') +
                ' · ждали ≈' +
                Math.round(s.oreSec / 60) +
                ' мин' +
                (s.enoughWood ? '' : ' · дерева могло не хватить'),
              en:
                oreLabel(s.counts, 'en') +
                ' · waited ≈' +
                Math.round(s.oreSec / 60) +
                ' min' +
                (s.enoughWood ? '' : ' · wood may have run out'),
            },
          });
        }
      }
    };
    tick();
    const iv = setInterval(tick, 15000);
    return () => clearInterval(iv);
  }, []);
}
