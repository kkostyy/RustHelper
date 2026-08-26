// ─────────────────────────────────────────────────────────
// S-eye viewer Bridge — service worker (ТЗ 2.3).
// Цепочка: Расширение → Сервер на ПК (pc-client) → Телефон.
//
// Что делает:
//  1. Принимает от контент-скрипта/страницы регистрации сообщение
//     {type:'SEYE_REG', token, steamId, name} и сохраняет токен
//     в chrome.storage.local.
//  2. По кнопке из popup отправляет сохранённое на сервер ПК
//     (POST /extension/push). Адрес ПК-сервера хранится там же.
//
// Серверная часть — точка входа в pc-client (index.js): принять
// POST /extension/push, положить данные в Firebase RTDB
// (/users/<steamId>/ext), откуда их читает приложение.
// ─────────────────────────────────────────────────────────

const DEFAULT_SERVER = 'http://127.0.0.1:28015';

// Приём данных регистрации со страницы (content script → сюда)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'SEYE_REG' && msg.token) {
    chrome.storage.local.set(
      {
        token: msg.token,
        steamId: msg.steamId || null,
        name: msg.name || null,
        capturedAt: Date.now(),
      },
      () => sendResponse({ ok: true }),
    );
    return true; // async sendResponse
  }
});

// Отправка на ПК-сервер по кнопке из popup
async function pushToServer() {
  const st = await chrome.storage.local.get(['token', 'steamId', 'name']);
  const cfg = await chrome.storage.local.get(['serverUrl']);
  const url = (cfg.serverUrl || DEFAULT_SERVER) + '/extension/push';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: st.token,
        steamId: st.steamId,
        name: st.name,
        sentAt: Date.now(),
      }),
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    // ПК-сервер недоступен (нет pc-client на этом компьютере)
    return { ok: false, error: String(e) };
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'SEYE_PUSH') {
    pushToServer().then(sendResponse);
    return true;
  }
});
