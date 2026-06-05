const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export async function saveTasteProfile(formData) {
  const response = await fetch(`${API}/api/music-taste/profile`, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Failed to save taste profile');
  }

  return data;
}

export async function listTasteProfiles() {
  const response = await fetch(`${API}/api/music-taste/profiles`);
  return response.json();
}
