let ambientEffects = [];
let favorites = [];
let activeEffectId = "candle";
let audioCtx, analyser, dataArray, source;
let lastFrameTime = 0;
const FRAME_MIN_TIME = 100;

const defaultAmbient = {
  speed: "slow",
  intensity: 0.45,
  warmth: 0.85,
  motion: 0.35,
  brightnessCap: 45,
  room: "full"
};

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

function controlValues(extra = {}) {
  return {
    ...defaultAmbient,
    speed: qs("speed") ? qs("speed").value : defaultAmbient.speed,
    intensity: qs("intensity") ? Number(qs("intensity").value) / 100 : defaultAmbient.intensity,
    warmth: qs("warmth") ? Number(qs("warmth").value) / 100 : defaultAmbient.warmth,
    motion: qs("motion") ? Number(qs("motion").value) / 100 : defaultAmbient.motion,
    brightnessCap: qs("brightnessCap") ? Number(qs("brightnessCap").value) : defaultAmbient.brightnessCap,
    room: qs("room") ? qs("room").value : defaultAmbient.room,
    ...extra
  };
}

function updateReadouts() {
  [["intensity", "%"], ["warmth", "%"], ["motion", "%"], ["brightnessCap", "%"]].forEach(([id, suffix]) => {
    const input = qs(id);
    const output = qs(id + "Value");
    if (input && output) output.textContent = input.value + suffix;
  });
}

function setActiveLabel(text) {
  const label = qs("active-scene-name");
  if (label) label.textContent = text || "Idle";
}

async function loadAmbient() {
  const list = await api("/api/v10/ambient/list");
  ambientEffects = list.items || [];
  renderAmbientCards();

  const fav = await api("/api/v10/ambient/favorites");
  favorites = fav.slots || [];
  renderFavorites();

  const status = await api("/api/v10/ambient/status");
  if (status.activeAmbientEffect) setActiveLabel(status.activeAmbientEffect.name);
}

function renderAmbientCards() {
  const grid = qs("ambient-grid");
  if (!grid) return;
  grid.innerHTML = "";

  ambientEffects.forEach(effect => {
    const card = document.createElement("article");
    card.className = effect.favorite ? "ambient-card owner" : "ambient-card";
    card.innerHTML = `
      <div>
        <p class="ambient-name">${effect.name}</p>
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

function renderFavorites() {
  const grid = qs("favorite-grid");
  if (!grid) return;
  grid.innerHTML = "";

  for (let slot = 1; slot <= 9; slot++) {
    const fav = favorites.find(item => Number(item.slot) === slot) || { slot, name: "Empty", effectId: "candle" };
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = fav.ownerFavorite ? "favorite owner" : "favorite";
    btn.innerHTML = `<span>${slot}</span><strong>${fav.name}</strong>`;
    btn.onclick = () => runFavorite(slot);
    grid.appendChild(btn);
  }
}

async function runAmbient(effectId, overrides = {}) {
  activeEffectId = effectId || activeEffectId;
  const result = await api("/api/v10/ambient/run", "POST", controlValues({ effectId: activeEffectId, ...overrides }));
  setActiveLabel(result.activeAmbientEffect ? result.activeAmbientEffect.name : activeEffectId);
}

async function applyActive() {
  await runAmbient(activeEffectId);
}

async function stopAmbient() {
  await api("/api/v10/ambient/stop", "POST", {});
  setActiveLabel("Idle");
}

async function saveFavorite(effectId = activeEffectId) {
  const slot = Number(qs("favoriteSlot") ? qs("favoriteSlot").value : 9);
  const effect = ambientEffects.find(item => item.id === effectId);
  const payload = controlValues({
    slot,
    effectId,
    name: effect ? effect.name.replace(" Flicker", "").replace(" Warm", "").replace(" Flow", "").replace(" Glow", "").replace(" Fade", "") : "Ambient"
  });
  await api("/api/v10/ambient/favorites/save", "POST", payload);
  const fav = await api("/api/v10/ambient/favorites");
  favorites = fav.slots || [];
  renderFavorites();
}

async function runFavorite(slot) {
  const response = await api("/api/v10/ambient/favorites/run", "POST", { slot });
  if (response.favorite) {
    activeEffectId = response.favorite.effectId;
    setActiveLabel(response.favorite.name);
  }
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

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("input[type=range], select").forEach(input => input.addEventListener("input", updateReadouts));
  updateReadouts();
  loadAmbient();
});
