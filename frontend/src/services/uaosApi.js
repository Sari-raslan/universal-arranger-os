const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

async function parseJson(response) {
  const data = await response.json();

  if (!response.ok || data.ok === false) {
    throw new Error(data.error || 'UAOS request failed');
  }

  return data;
}

export async function postJson(path, payload) {
  const response = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {})
  });

  return parseJson(response);
}

export async function getJson(path) {
  const response = await fetch(`${API}${path}`);
  return parseJson(response);
}
