let ambientEffects = [];
let favorites = [];
let activeEffectId = "lantern";
let startupApplied = false;
let audioCtx, analyser, dataArray, source;
let lastFrameTime = 0;
const FRAME_MIN_TIME = 100;

const defaultAmbient = {
  speed: "slow",
  brightness: 45,
  intensity: 0.45,
  warmth: 0.85,
  motion: 0.35,
  brightnessCap: 45,
  room: "full"
};

const ambientOrder = ["lantern", "candle", "fireplace", "embers", "sunset", "romantic", "night", "sleep"];
const effectCaps = { candle: 45, fireplace: 55, lantern: 50, night: 15, sleep: 12 };
const cleanLabels = {
  lantern: "Lantern Warm",
  candle: "Candle Flicker",
  fireplace: "Fireplace",
  embers: "Embers Glow",
  sunset: "Sunset Flow",
  romantic: "Romantic Glow",
  night: "Night Warm",
  sleep: "Sleep Fade"
};

const favoriteBar = [
  { slot: 1, key: "F1", name: "Candle", effectId: "candle" },
  { slot: 2, key: "F2", name: "Fireplace", effectId: "fireplace" },
  { slot: 3, key: "F3", name: "Lantern", effectId: "lantern" },
  { slot: 4, key: "F4", name: "Embers", effectId: "embers" },
  { slot: 5, key: "F5", name: "Sunset", effectId: "sunset" },
  { slot: 6, key: "F6", name: "Night", effectId: "night" },
  { slot: 7, key: "F7", name: "Sleep", effectId: "sleep" },
  { slot: 8, key: "F8", name: "Turn Off", action: "turnOff" },
  { slot: 9, key: "F9", name: "Emergency Stop", action: "emergencyStop" }
];

function qs(id) {
  return document.getElementById(id);
}

async function api(endpoint, method = "GET", body = null) {
  const options = { method, headers: { "Content-Type": "application/json" } };
  if (body) options.body = JSON.stringify(body);
  try {
    const res = await fetch(endpoint, options);
    return await res.json().catch(() => ({}));
  } catch (err) {
    return { status: "error", message: err.message };
  }
}

function capForEffect(effectId) {
  return effectCaps[effectId] || 55;
}

function setControl(id, value) {
  const input = qs(id);
  if (input) input.value = String(value);
}

function applyCapsForEffect(effectId) {
  const cap = capForEffect(effectId);
  const brightness = qs("brightness");
  const brightnessCap = qs("brightnessCap");
  if (brightness) {
    brightness.max = String(cap);
    if (Number(brightness.value) > cap) brightness.value = String(cap);
  }
  if (brightnessCap) {
    brightnessCap.max = String(cap);
    if (Number(brightnessCap.value) > cap) brightnessCap.value = String(cap);
  }
  if (effectId === "night") {
    setControl("brightness", 15);
    setControl("brightnessCap", 15);
    setControl("motion", 10);
  }
  if (effectId === "sleep") {
    setControl("brightness", 12);
    setControl("brightnessCap", 12);
    setControl("motion", 10);
  }
  updateReadouts();
}

function controlValues(extra = {}) {
  const effectId = extra.effectId || activeEffectId;
  const cap = capForEffect(effectId);
  const brightness = qs("brightness") ? Math.min(Number(qs("brightness").value), cap) : defaultAmbient.brightness;
  const brightnessCap = qs("brightnessCap") ? Math.min(Number(qs("brightnessCap").value), cap) : defaultAmbient.brightnessCap;
  return {
    ...defaultAmbient,
    speed: qs("speed") ? qs("speed").value : defaultAmbient.speed,
    intensity: Math.max(0.01, brightness / 100),
    warmth: qs("warmth") ? Number(qs("warmth").value) / 100 : defaultAmbient.warmth,
    motion: qs("motion") ? Number(qs("motion").value) / 100 : defaultAmbient.motion,
    brightnessCap,
    room: qs("room") ? qs("room").value : defaultAmbient.room,
    ...extra
  };
}

function updateReadouts() {
  [["brightness", "%"], ["warmth", "%"], ["motion", "%"], ["brightnessCap", "%"]].forEach(([id, suffix]) => {
    const input = qs(id);
    const output = qs(id + "Value");
    if (input && output) output.textContent = input.value + suffix;
  });
}

function setActiveLabel(text) {
  const label = qs("active-scene-name");
  if (label) label.textContent = text || "Idle";
}

async function loadStartupConfig() {
  const config = await api("/src/config/startup-v10.json");
  return {
    defaultUi: "v10",
    defaultPanel: "ambient",
    startupEffect: "lantern",
    openUiOnStartup: true,
    startEngineOnStartup: true,
    safeMode: true,
    ...(config || {})
  };
}

async function loadAmbient() {
  const list = await api("/api/v10/ambient/list");
  ambientEffects = list.items || [];
  renderAmbientCards();
  renderFavoriteBar();

  const fav = await api("/api/v10/ambient/favorites");
  favorites = fav.slots || [];
  renderFavorites();

  const status = await api("/api/v10/ambient/status");
  if (status.activeAmbientEffect) setActiveLabel(status.activeAmbientEffect.name);

  const startup = await loadStartupConfig();
  if (!startupApplied && startup.defaultPanel === "ambient") {
    startupApplied = true;
    activeEffectId = startup.startupEffect || "lantern";
    applyCapsForEffect(activeEffectId);
    if (startup.openUiOnStartup && startup.startEngineOnStartup && startup.safeMode) {
      await runAmbient(activeEffectId, { speed: "slow", brightnessCap: capForEffect(activeEffectId) });
    }
  }
}

function sortedAmbientEffects() {
  return ambientEffects
    .filter(effect => ambientOrder.includes(effect.id))
    .sort((a, b) => ambientOrder.indexOf(a.id) - ambientOrder.indexOf(b.id));
}

function renderAmbientCards() {
  const grid = qs("ambient-grid");
  if (!grid) return;
  grid.innerHTML = "";

  sortedAmbientEffects().forEach(effect => {
    const card = document.createElement("article");
    card.className = effect.favorite ? "ambient-card owner" : "ambient-card";
    const label = cleanLabels[effect.id] || effect.name;
    card.innerHTML = `
      <div>
        <p class="ambient-name">${label}</p>
        <p class="ambient-desc">${effect.description}</p>
      </div>
      <div class="card-actions">
        <button type="button" onclick="runAmbient('${effect.id}')">Run</button>
        <button type="button" class="ghost" onclick="saveFavorite('${effect.id}')">Favorite</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function renderFavoriteBar() {
  const grid = qs("favorite-bar");
  if (!grid) return;
  grid.innerHTML = "";
  favoriteBar.forEach(item => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = item.action === "emergencyStop" ? "favorite danger" : item.action === "turnOff" ? "favorite off" : "favorite";
    btn.innerHTML = `<span>${item.key}</span><strong>${item.name}</strong>`;
    btn.onclick = () => runFavorite(item.slot);
    grid.appendChild(btn);
  });
}

function renderFavorites() {
  const grid = qs("favorite-grid");
  if (!grid) return;
  grid.innerHTML = "";

  favoriteBar.forEach(item => {
    const saved = favorites.find(fav => Number(fav.slot) === item.slot);
    const label = item.action ? item.name : (saved ? saved.name : item.name);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = item.action === "emergencyStop" ? "favorite danger" : item.action === "turnOff" ? "favorite off" : "favorite";
    btn.innerHTML = `<span>${item.key}</span><strong>${label}</strong>`;
    btn.onclick = () => runFavorite(item.slot);
    grid.appendChild(btn);
  });
}

async function runAmbient(effectId, overrides = {}) {
  activeEffectId = effectId || activeEffectId;
  applyCapsForEffect(activeEffectId);
  const result = await api("/api/v10/ambient/run", "POST", controlValues({ effectId: activeEffectId, ...overrides }));
  setActiveLabel(result.activeAmbientEffect ? result.activeAmbientEffect.name : (cleanLabels[activeEffectId] || activeEffectId));
}

async function applyActive() {
  await runAmbient(activeEffectId);
}

async function stopAmbient() {
  await api("/api/v10/ambient/stop", "POST", {});
  setActiveLabel("Idle");
}

async function saveFavorite(effectId = activeEffectId) {
  const slot = Number(qs("favoriteSlot") ? qs("favoriteSlot").value : 3);
  if (slot === 8 || slot === 9) {
    renderFavorites();
    return;
  }
  const effect = ambientEffects.find(item => item.id === effectId);
  const payload = controlValues({
    slot,
    effectId,
    name: effect ? (cleanLabels[effect.id] || effect.name) : "Ambient"
  });
  await api("/api/v10/ambient/favorites/save", "POST", payload);
  const fav = await api("/api/v10/ambient/favorites");
  favorites = fav.slots || [];
  renderFavorites();
}

async function runFavorite(slot) {
  if (slot === 8) return turnOffLights();
  if (slot === 9) return emergencyStop();
  const saved = favorites.find(item => Number(item.slot) === slot);
  const fallback = favoriteBar.find(item => item.slot === slot);
  const effectId = saved ? saved.effectId : fallback.effectId;
  if (effectId) await runAmbient(effectId, saved || {});
}

async function runEffect(id) {
  const ambientIds = ["candle", "fireplace", "lantern", "embers", "sunset", "romantic", "night", "sleep", "clouds", "oriental_lantern"];
  if (ambientIds.includes(id)) return runAmbient(id);
  await api("/api/v10/effects/run", "POST", { id });
  setActiveLabel(String(id || "").toUpperCase());
}

async function turnOffLights() {
  await api("/api/v5/lights/off", "POST", {});
  setActiveLabel("All Lights Off");
}

async function emergencyStop() {
  await api("/api/v4/emergency-stop", "POST", {});
  setActiveLabel("Emergency Stop");
}

async function initAudio(type) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let stream;
    if (type === "mic") {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } else {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      if (!stream.getAudioTracks().length) {
        const err = qs("audio-error");
        if (err) err.textContent = "System audio needs a shared tab or microphone mode.";
        return;
      }
    }
    source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    await api("/api/v10/music/start", "POST", { input: type, mode: "music_party" });
    requestAnimationFrame(musicLoop);
  } catch (err) {
    const out = qs("audio-error");
    if (out) out.textContent = err.message;
  }
}

async function stopAudio() {
  try { if (source) source.disconnect(); } catch {}
  source = null;
  analyser = null;
  await api("/api/v10/music/stop", "POST", {});
}

function musicLoop(time) {
  if (!analyser) return;
  requestAnimationFrame(musicLoop);
  if (time - lastFrameTime < FRAME_MIN_TIME) return;
  lastFrameTime = time;

  analyser.getByteFrequencyData(dataArray);
  const bass = (dataArray[2] || 0) / 255;
  const mid = (dataArray[10] || 0) / 255;
  const treble = (dataArray[30] || 0) / 255;
  const level = Math.min(1, (bass + mid + treble) / 3);
  const beat = bass > 0.72;

  fetch("/api/v10/music/frame", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "music_party", bass, mid, treble, level, beat, timestamp: Date.now() })
  });
}

function runDiag() {
  fetch("/api/v10/diagnostics/run").then(r => r.json()).then(d => {
    const out = qs("diag-output");
    if (out) out.textContent = JSON.stringify(d, null, 2);
  });
}

document.addEventListener("keydown", event => {
  if (!/^F[1-9]$/.test(event.key)) return;
  event.preventDefault();
  runFavorite(Number(event.key.slice(1)));
});

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("input[type=range], select").forEach(input => input.addEventListener("input", updateReadouts));
  updateReadouts();
  applyCapsForEffect("lantern");
  loadAmbient();
});
