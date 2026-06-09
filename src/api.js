export const API_BASE = import.meta.env.VITE_UAOS_API || "http://localhost:8080";

export async function apiHealth(){
  try {
    const r = await fetch(`${API_BASE}/health`);
    return await r.json();
  } catch {
    return { ok:false, offline:true };
  }
}