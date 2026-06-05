const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export async function personalizeArrangement(payload) {
  const response = await fetch(`${API}/api/arranger/personalize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Failed to personalize arrangement');
  }

  return data;
}
