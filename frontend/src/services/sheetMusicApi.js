const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') ||
  'http://localhost:3001';

export async function uploadSheetMusic(file) {
  const form = new FormData();
  form.append('sheet', file);

  const response = await fetch(`${API_BASE}/api/omr/upload-sheet`, {
    method: 'POST',
    body: form
  });

  const data = await response.json().catch(() => ({
    ok: false,
    error: 'Server returned invalid response'
  }));

  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Sheet music analysis failed');
  }

  return data;
}
