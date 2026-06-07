// UAOS_ANDROID_BRAIN_STORAGE_V1
const UAOS_CACHE_PREFIX = "uaos_cache_";

export function uaosCacheSet(key, value) {
  try {
    localStorage.setItem(UAOS_CACHE_PREFIX + key, JSON.stringify({ value, savedAt: Date.now() }));
    return true;
  } catch (error) {
    console.warn("UAOS cache set failed:", error);
    return false;
  }
}

export function uaosCacheGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(UAOS_CACHE_PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw).value;
  } catch (error) {
    console.warn("UAOS cache get failed:", error);
    return fallback;
  }
}

export function uaosCacheRemove(key) {
  try {
    localStorage.removeItem(UAOS_CACHE_PREFIX + key);
    return true;
  } catch {
    return false;
  }
}