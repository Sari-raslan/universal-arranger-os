export function detectRuntimeFeatures(globalObject = globalThis) {
  const nav = globalObject.navigator;
  const win = globalObject.window || globalObject;
  const mediaDevices = nav?.mediaDevices;

  return {
    secureContext: Boolean(win.isSecureContext || globalObject.location?.protocol === "https:" || globalObject.location?.hostname === "localhost" || globalObject.location?.hostname === "127.0.0.1"),
    microphone: Boolean(mediaDevices?.getUserMedia),
    mediaRecorder: typeof win.MediaRecorder !== "undefined",
    webMidi: Boolean(nav?.requestMIDIAccess),
    audioContext: Boolean(win.AudioContext || win.webkitAudioContext),
    localStorage: hasLocalStorage(globalObject),
    electronBridge: Boolean(win.uaosMidi)
  };
}

export function hasLocalStorage(globalObject = globalThis) {
  try {
    const storage = globalObject.localStorage;
    if (!storage) return false;
    const key = "__uaos_storage_check__";
    storage.setItem(key, "1");
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function runtimeStatus(features = detectRuntimeFeatures()) {
  const blocked = [];
  if (!features.secureContext) blocked.push("Microphone and MIDI permissions require HTTPS or localhost.");
  if (!features.microphone) blocked.push("Microphone capture is unsupported in this browser.");
  if (!features.mediaRecorder) blocked.push("Audio recording is unsupported in this browser.");
  if (!features.webMidi && !features.electronBridge) blocked.push("MIDI requires WebMIDI support or the desktop bridge.");
  if (!features.localStorage) blocked.push("Local session persistence is unavailable.");
  return { ok: blocked.length === 0, blocked };
}

