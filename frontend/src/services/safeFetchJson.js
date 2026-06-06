export async function safeFetchJson(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      const text = await response.text();

      return {
        ok: false,
        status: response.status,
        offline: true,
        error: 'Service returned HTML or non-JSON response',
        preview: text.slice(0, 140),
      };
    }

    const data = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      data,
      error: response.ok ? '' : data?.error || 'Request failed',
    };
  } catch (error) {
    return {
      ok: false,
      offline: true,
      error: error.message || 'Network unavailable',
    };
  }
}

export function getApiBase() {
  return import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';
}
