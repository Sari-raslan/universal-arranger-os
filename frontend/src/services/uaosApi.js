export const UAOS_API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

function uaosApiUrl(path) {
  const base = UAOS_API_BASE.replace(/\/$/, '');
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (base.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    normalizedPath = normalizedPath.slice(4);
  }

  return `${base}${normalizedPath}`;
}

export async function safeJsonFetch(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      const text = await response.text();
      return {
        ok: false,
        offline: true,
        error: 'Service returned non-JSON response',
        status: response.status,
        preview: text.slice(0, 160)
      };
    }

    const data = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      data,
      error: response.ok ? '' : data?.error || 'Request failed'
    };
  } catch (error) {
    return {
      ok: false,
      offline: true,
      error: error.message || 'Backend unavailable'
    };
  }
}

async function requestJson(path, options = {}) {
  const result = await safeJsonFetch(uaosApiUrl(path), options);

  if (!result.ok || result.data?.ok === false) {
    throw new Error(result.error || result.data?.error || 'UAOS request failed');
  }

  return result.data;
}

export async function postJson(path, payload) {
  return requestJson(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {})
  });
}

export async function getJson(path) {
  return requestJson(path);
}

export async function checkUaosBackend() {
  return safeJsonFetch(uaosApiUrl('/health'));
}
