const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') ||
  'http://localhost:3001';

export async function askUaosAssistant(message) {
  const response = await fetch(`${API_BASE}/api/uaos-assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: localStorage.getItem('uaos_user_id') || 'local-user',
      message
    })
  });

  const data = await response.json().catch(() => ({
    ok: false,
    reply: 'لم أستطع قراءة رد الخادم الآن.'
  }));

  if (!response.ok || !data.ok) {
    throw new Error(data.error || data.reply || 'UAOS Assistant request failed.');
  }

  return data;
}
