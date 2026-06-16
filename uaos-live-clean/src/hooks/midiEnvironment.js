const DEFAULT_MIDI_MAP_KEY = "uaos_v1_midi_mappings";

export function getMidiNavigator(globalObject = globalThis) {
  if (typeof globalObject === "undefined") return null;
  const navigatorLike = globalObject.navigator;
  if (!navigatorLike || typeof navigatorLike.requestMIDIAccess !== "function") {
    return null;
  }
  return navigatorLike;
}

export function isWebMidiAvailable(globalObject = globalThis) {
  return Boolean(getMidiNavigator(globalObject));
}

export function readMidiMappings(storage = globalThis?.localStorage, key = DEFAULT_MIDI_MAP_KEY) {
  try {
    const raw = storage?.getItem?.(key) || "{}";
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function writeMidiMappings(storage = globalThis?.localStorage, key = DEFAULT_MIDI_MAP_KEY, mappings = {}) {
  try {
    storage?.setItem?.(key, JSON.stringify(mappings));
    return true;
  } catch {
    return false;
  }
}
