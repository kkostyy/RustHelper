// Popup: статус токена, адрес ПК-сервера, кнопка отправки (ТЗ 2.3)
const $ = (id) => document.getElementById(id);

chrome.storage.local.get(['token', 'steamId', 'serverUrl'], (st) => {
  $('status').textContent = st.token
    ? `token: ${String(st.token).slice(0, 8)}…\nsteamId: ${st.steamId || '—'}`
    : 'токен не захвачен — зайди на страницу регистрации';
  if (st.serverUrl) $('srv').value = st.serverUrl;
});

$('srv').addEventListener('change', () => {
  chrome.storage.local.set({ serverUrl: $('srv').value.trim() });
});

$('push').addEventListener('click', async () => {
  const srv = $('srv').value.trim();
  if (srv) chrome.storage.local.set({ serverUrl: srv });
  const res = await chrome.runtime.sendMessage({ type: 'SEYE_PUSH' });
  $('out').textContent = res && res.ok
    ? '✓ отправлено на ПК'
    : '✗ не отправлено: ' + ((res && (res.error || res.status)) || 'нет ответа');
});
