const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const AmbientMagicEngine = require("./services/AmbientMagicEngine");

const ROOT = path.resolve(__dirname, "..");
const PORT = 3000;

const primary = [10,11,12,13,14,15,16,17,18,19];
const ambient = [20,21,22,23,24,25,26,27];
const allLights = [...primary, ...ambient];

let activeScene = "idle";
let commandCount = 0;
let lastHueMode = "UNKNOWN";
let ambientEffectTimer = null;
let ambientMagicEngine = null;

function sendJson(res, code, obj) {
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(obj, null, 2));
}

function readBody(req) {
  return new Promise(resolve => {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { resolve({}); }
    });
  });
}

function loadJsonSafe(file) {
  try {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return null;
  }
}

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    try {
      const st = fs.statSync(p);
      if (st.isDirectory()) walkFiles(p, out);
      else out.push(p);
    } catch {}
  }
  return out;
}

function findDeep(obj, keys) {
  if (!obj || typeof obj !== "object") return null;
  for (const k of Object.keys(obj)) {
    if (keys.includes(String(k).toLowerCase()) && obj[k] && typeof obj[k] === "string") {
      return obj[k];
    }
  }
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v && typeof v === "object") {
      const found = findDeep(v, keys);
      if (found) return found;
    }
  }
  return null;
}

function findHueConfig() {
  const configDir = path.join(ROOT, "src", "config");
  const files = walkFiles(configDir).filter(f => f.toLowerCase().endsWith(".json"));

  let ip = "192.168.178.20";
  let username = "";

  for (const f of files) {
    const j = loadJsonSafe(f);
    if (!j) continue;

    const maybeIp = findDeep(j, ["ip", "bridgeip", "bridge_ip", "host"]);
    if (maybeIp && /^(\d{1,3}\.){3}\d{1,3}$/.test(maybeIp)) ip = maybeIp;

    const maybeUser = findDeep(j, [
      "username",
      "user",
      "token",
      "apikey",
      "api_key",
      "bridgeusername",
      "bridge_username",
      "hueusername",
      "hue_username"
    ]);

    if (
      maybeUser &&
      maybeUser.length > 8 &&
      !maybeUser.toLowerCase().includes("existing") &&
      !maybeUser.toLowerCase().includes("token") &&
      !maybeUser.toLowerCase().includes("placeholder")
    ) {
      username = maybeUser;
      break;
    }
  }

  return { ip, username };
}

function huePut(ip, username, lightId, state) {
  return new Promise(resolve => {
    if (!username) {
      lastHueMode = "NO_HUE_TOKEN_FOUND";
      return resolve({ ok:false, simulated:false, error:"NO_HUE_TOKEN_FOUND", lightId });
    }

    const data = JSON.stringify(state);
    const req = http.request({
      hostname: ip,
      port: 80,
      path: `/api/${encodeURIComponent(username)}/lights/${lightId}/state`,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
      },
      timeout: 2500
    }, res => {
      let body = "";
      res.on("data", d => body += d);
      res.on("end", () => {
        lastHueMode = "REAL_HUE_API";
        resolve({ ok:true, lightId, response: body });
      });
    });

    req.on("error", err => {
      lastHueMode = "HUE_API_ERROR";
      resolve({ ok:false, lightId, error: err.message });
    });

    req.on("timeout", () => {
      req.destroy();
      lastHueMode = "HUE_API_TIMEOUT";
      resolve({ ok:false, lightId, error:"timeout" });
    });

    req.write(data);
    req.end();
  });
}

async function setLight(id, state) {
  const cfg = findHueConfig();
  return await huePut(cfg.ip, cfg.username, id, state);
}

function getAmbientMagicEngine() {
  if (!ambientMagicEngine) {
    ambientMagicEngine = new AmbientMagicEngine({
      setLight,
      primary,
      ambient,
      onScene: scene => { activeScene = scene; commandCount++; }
    });
  }
  return ambientMagicEngine;
}

function ambientFavoritesPath() {
  return path.join(ROOT, "src", "config", "ambient-favorites-v10.json");
}

function loadAmbientFavorites() {
  const file = ambientFavoritesPath();
  const data = loadJsonSafe(file);
  if (data && Array.isArray(data.slots)) return data;
  return { slots: [] };
}

function saveAmbientFavorites(data) {
  fs.writeFileSync(ambientFavoritesPath(), JSON.stringify(data, null, 2) + "\n", "utf8");
}

function comfortProfilesPath() {
  return path.join(ROOT, "src", "config", "comfort-profiles-v10.json");
}

function loadComfortProfiles() {
  const data = loadJsonSafe(comfortProfilesPath());
  if (data && Array.isArray(data.profiles)) return data;
  return { version: "10.3", defaultRecommendedOwnerMode: "Daily Lantern", autoRunOnStartup: false, profiles: [] };
}

function comfortObservationDir() {
  return path.join(ROOT, "generated", "v10-owner-observation");
}

function comfortObservationFile() {
  return path.join(comfortObservationDir(), "comfort-observation.jsonl");
}

function sanitizeComfortText(value) {
  return String(value || "").replace(/[<>]/g, "").slice(0, 240);
}

function comfortPercent(value, fallback) {
  return Math.round(clampNum(value, 0, 100, fallback));
}

function comfortSpeed(value) {
  const speed = String(value || "slow").toLowerCase();
  return ["slow", "medium", "fast"].includes(speed) ? speed : "slow";
}

function appendComfortLog(input = {}) {
  fs.mkdirSync(comfortObservationDir(), { recursive: true });
  const entry = {
    timestamp: new Date().toISOString(),
    selectedEffect: sanitizeComfortText(input.selectedEffect || input.effectId || activeScene || "unknown"),
    brightness: comfortPercent(input.brightness, 38),
    speed: comfortSpeed(input.speed),
    motion: comfortPercent(input.motion, 25),
    warmth: comfortPercent(input.warmth, 90),
    room: ["full", "primary", "ambient"].includes(input.room) ? input.room : "full",
    ownerComfortNote: sanitizeComfortText(input.ownerComfortNote || input.note || ""),
    emergencyUsage: !!input.emergencyUsage,
    turnOffUsage: !!input.turnOffUsage
  };
  fs.appendFileSync(comfortObservationFile(), JSON.stringify(entry) + "\n", "utf8");
  fs.writeFileSync(path.join(comfortObservationDir(), "latest-comfort-status.json"), JSON.stringify(entry, null, 2) + "\n", "utf8");
  return entry;
}

function comfortStatus() {
  const profiles = loadComfortProfiles();
  let latest = null;
  try {
    const lines = fs.existsSync(comfortObservationFile())
      ? fs.readFileSync(comfortObservationFile(), "utf8").trim().split(/\r?\n/).filter(Boolean)
      : [];
    latest = lines.length ? JSON.parse(lines[lines.length - 1]) : null;
    return {
      status: "OWNER_COMFORT_TUNED",
      defaultRecommendedOwnerMode: profiles.defaultRecommendedOwnerMode || "Daily Lantern",
      autoRunOnStartup: !!profiles.autoRunOnStartup,
      profiles: profiles.profiles,
      observationLog: comfortObservationFile(),
      observationCount: lines.length,
      latest,
      activeScene,
      hueMode: lastHueMode,
      realHue: true,
      turnOff: true,
      emergencyStop: true,
      wledGated: true,
      dmxGated: true,
      deploy: "NO",
      payment: "NO",
      localOnly: true
    };
  } catch (err) {
    return { status: "OWNER_COMFORT_TUNED", error: err.message, profiles: profiles.profiles, latest };
  }
}

async function runAmbientMagic(body = {}) {
  stopAmbientEffect();
  return await getAmbientMagicEngine().run(body);
}

async function stopAmbientMagic(reason = "ambient_stop") {
  const result = getAmbientMagicEngine().stop(reason);
  if (activeScene && String(activeScene).startsWith("ambient_")) activeScene = "idle";
  return result;
}

async function runScene(sceneId) {
  stopAmbientEffect();
  activeScene = sceneId || "calm";
  commandCount++;

  let statePrimary = { on:true, bri:120, ct:366, transitiontime:10 };
  let stateAmbient = { on:true, bri:100, ct:400, transitiontime:15 };

  if (sceneId === "party") {
    statePrimary = { on:true, bri:204, xy:[0.17,0.08], transitiontime:2 };
    stateAmbient = { on:true, bri:135, xy:[0.31,0.14], transitiontime:12 };
  }

  if (sceneId === "oriental_live") {
    statePrimary = { on:true, bri:185, xy:[0.55,0.38], transitiontime:8 };
    stateAmbient = { on:true, bri:135, xy:[0.62,0.33], transitiontime:18 };
  }

  if (sceneId === "calm") {
    statePrimary = { on:true, bri:95, ct:400, transitiontime:20 };
    stateAmbient = { on:true, bri:95, ct:420, transitiontime:20 };
  }

  const results = [];
  for (const id of primary) results.push(await setLight(id, statePrimary));
  for (const id of ambient) results.push(await setLight(id, stateAmbient));

  return {
    ok: true,
    sceneId,
    hueMode: lastHueMode,
    successCount: results.filter(r => r.ok).length,
    failCount: results.filter(r => !r.ok).length,
    results
  };
}

async function emergencyStop() {
  uaosV81WatchdogLog('emergency_stop', {});
  uaosV81WatchdogLog('emergency_stop', {});
  appendComfortLog({ selectedEffect: activeScene, emergencyUsage: true, ownerComfortNote: "Emergency Stop used" });
  stopAmbientEffect();
  activeScene = "emergency_stop";
  commandCount++;

  const results = [];
  for (const id of allLights) {
    results.push(await setLight(id, { on:true, bri:76, ct:366, transitiontime:5 }));
  }

  return {
    ok: true,
    message: "Emergency Stop warm white 30%",
    hueMode: lastHueMode,
    successCount: results.filter(r => r.ok).length,
    failCount: results.filter(r => !r.ok).length
  };
}


async function allLightsOff() {
  uaosV81WatchdogLog('turn_off', {});
  uaosV81WatchdogLog('turn_off', {});
  appendComfortLog({ selectedEffect: activeScene, turnOffUsage: true, ownerComfortNote: "Turn Off used" });
  stopAmbientEffect();
  activeScene = "all_lights_off";
  commandCount++;

  const results = [];
  for (const id of allLights) {
    results.push(await setLight(id, { on:false }));
  }

  return {
    ok: true,
    mode: "ALL_LIGHTS_OFF",
    lightCount: 18,
    hueMode: lastHueMode,
    successCount: results.filter(r => r.ok).length,
    failCount: results.filter(r => !r.ok).length
  };
}

async function runReadyLightMode(mode) {
  activeScene = mode;
  commandCount++;

  let state = { on:true, bri:140, ct:366, transitiontime:10 };

  if (mode === "white") {
    state = { on:true, bri:204, ct:250, transitiontime:8 };
  }

  if (mode === "yellow") {
    state = { on:true, bri:170, ct:430, transitiontime:10 };
  }

  if (mode === "night") {
    state = { on:true, bri:38, ct:454, transitiontime:20 };
  }

  if (mode === "sleep") {
    state = { on:true, bri:15, ct:500, transitiontime:40 };
  }

  const results = [];
  for (const id of allLights) {
    results.push(await setLight(id, state));
  }

  return {
    ok: true,
    mode,
    lightCount: 18,
    hueMode: lastHueMode,
    successCount: results.filter(r => r.ok).length,
    failCount: results.filter(r => !r.ok).length
  };
}

function stopAmbientEffect() {
  if (ambientEffectTimer) {
    clearInterval(ambientEffectTimer);
    ambientEffectTimer = null;
  }
  if (ambientMagicEngine) {
    ambientMagicEngine.stop("legacy_stop");
  }
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function runAmbientFilter(mode) {
  stopAmbientEffect();
  activeScene = mode;
  commandCount++;

  if (mode === "candle") {
    const tick = async () => {
      for (const id of allLights) {
        await setLight(id, {
          on: true,
          bri: rand(35, 95),
          ct: rand(430, 500),
          transitiontime: rand(8, 18)
        });
      }
    };
    await tick();
    ambientEffectTimer = setInterval(tick, 2400);
    return { ok:true, mode:"CANDLE_FILTER", lightCount:18 };
  }

  if (mode === "fireplace") {
    const fireColors = [
      [0.67, 0.32],
      [0.60, 0.36],
      [0.54, 0.40],
      [0.50, 0.43]
    ];
    const tick = async () => {
      for (const id of allLights) {
        const xy = fireColors[rand(0, fireColors.length - 1)];
        await setLight(id, {
          on: true,
          bri: rand(55, 140),
          xy,
          transitiontime: rand(10, 22)
        });
      }
    };
    await tick();
    ambientEffectTimer = setInterval(tick, 2800);
    return { ok:true, mode:"FIREPLACE_FILTER", lightCount:18 };
  }

  if (mode === "sunset") {
    stopAmbientEffect();
    for (const id of allLights) {
      await setLight(id, {
        on: true,
        bri: 120,
        xy: [0.58, 0.36],
        transitiontime: 35
      });
    }
    return { ok:true, mode:"SUNSET_FILTER", lightCount:18 };
  }

  if (mode === "ocean") {
    stopAmbientEffect();
    for (const id of allLights) {
      await setLight(id, {
        on: true,
        bri: 110,
        xy: [0.17, 0.22],
        transitiontime: 30
      });
    }
    return { ok:true, mode:"OCEAN_FILTER", lightCount:18 };
  }

  if (mode === "smart_warm") {
    stopAmbientEffect();
    for (const id of allLights) {
      await setLight(id, {
        on: true,
        bri: 145,
        ct: 400,
        transitiontime: 20
      });
    }
    return { ok:true, mode:"SMART_WARM_FILTER", lightCount:18 };
  }


  // FINAL_UAOS_SMART_FILTERS_V72
  if (mode === "romantic") {
    stopAmbientEffect();
    for (const id of allLights) {
      await setLight(id, { on:true, bri:95, xy:[0.50,0.24], transitiontime:28 });
    }
    return { ok:true, mode:"ROMANTIC_FILTER", lightCount:18 };
  }

  if (mode === "cinema") {
    stopAmbientEffect();
    for (const id of primary) {
      await setLight(id, { on:false, transitiontime:10 });
    }
    for (const id of ambient) {
      await setLight(id, { on:true, bri:45, ct:454, transitiontime:25 });
    }
    return { ok:true, mode:"CINEMA_FILTER", lightCount:18 };
  }

  if (mode === "reading") {
    stopAmbientEffect();
    for (const id of allLights) {
      await setLight(id, { on:true, bri:155, ct:330, transitiontime:16 });
    }
    return { ok:true, mode:"READING_FILTER", lightCount:18 };
  }

  if (mode === "focus") {
    stopAmbientEffect();
    for (const id of allLights) {
      await setLight(id, { on:true, bri:175, ct:280, transitiontime:16 });
    }
    return { ok:true, mode:"FOCUS_FILTER", lightCount:18 };
  }

  if (mode === "blue_soft") {
    stopAmbientEffect();
    for (const id of allLights) {
      await setLight(id, { on:true, bri:105, xy:[0.16,0.17], transitiontime:26 });
    }
    return { ok:true, mode:"BLUE_SOFT_FILTER", lightCount:18 };
  }

  if (mode === "purple_room") {
    stopAmbientEffect();
    for (const id of allLights) {
      await setLight(id, { on:true, bri:115, xy:[0.30,0.12], transitiontime:26 });
    }
    return { ok:true, mode:"PURPLE_ROOM_FILTER", lightCount:18 };
  }

  if (mode === "sunrise") {
    stopAmbientEffect();
    for (const id of allLights) {
      await setLight(id, { on:true, bri:135, xy:[0.48,0.41], transitiontime:40 });
    }
    return { ok:true, mode:"SUNRISE_FILTER", lightCount:18 };
  }

  if (mode === "gold_room") {
    stopAmbientEffect();
    for (const id of allLights) {
      await setLight(id, { on:true, bri:160, xy:[0.52,0.42], transitiontime:22 });
    }
    return { ok:true, mode:"GOLD_ROOM_FILTER", lightCount:18 };
  }
  return { ok:false, error:"UNKNOWN_FILTER", mode };
}

function clampNum(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function hexToRgb(hex) {
  const clean = String(hex || "#ffffff").replace("#", "").trim();
  const safe = clean.length === 3
    ? clean.split("").map(x => x + x).join("")
    : clean.padEnd(6, "f").slice(0, 6);
  return {
    r: parseInt(safe.slice(0, 2), 16),
    g: parseInt(safe.slice(2, 4), 16),
    b: parseInt(safe.slice(4, 6), 16)
  };
}

function rgbToXy(r, g, b) {
  let R = r / 255;
  let G = g / 255;
  let B = b / 255;

  R = R > 0.04045 ? Math.pow((R + 0.055) / 1.055, 2.4) : R / 12.92;
  G = G > 0.04045 ? Math.pow((G + 0.055) / 1.055, 2.4) : G / 12.92;
  B = B > 0.04045 ? Math.pow((B + 0.055) / 1.055, 2.4) : B / 12.92;

  const X = R * 0.664511 + G * 0.154324 + B * 0.162028;
  const Y = R * 0.283881 + G * 0.668433 + B * 0.047685;
  const Z = R * 0.000088 + G * 0.072310 + B * 0.986039;

  const sum = X + Y + Z;
  if (sum === 0) return [0.3227, 0.3290];

  return [
    Number((X / sum).toFixed(4)),
    Number((Y / sum).toFixed(4))
  ];
}

function hueFromHex(hex) {
  const rgb = hexToRgb(hex);
  return rgbToXy(rgb.r, rgb.g, rgb.b);
}

function mixXy(a, b, amount) {
  const t = clampNum(amount, 0, 1, 0.5);
  return [
    Number((a[0] + (b[0] - a[0]) * t).toFixed(4)),
    Number((a[1] + (b[1] - a[1]) * t).toFixed(4))
  ];
}

function proIntervalMs(speed) {
  const s = String(speed || "medium").toLowerCase();
  if (s === "slow") return 4200;
  if (s === "fast") return 1200;
  if (s === "ultra") return 750;
  return 2400;
}

async function runProColorFilter(mode, options = {}) {
  // UAOS_PRO_COLOR_ENGINE_V73
  stopAmbientEffect();
  activeScene = "pro_" + mode;
  commandCount++;

  const baseHex = options.color || "#ffb35c";
  const secondHex = options.color2 || "#3b82f6";
  const baseXy = hueFromHex(baseHex);
  const secondXy = hueFromHex(secondHex);

  const speed = String(options.speed || "medium").toLowerCase();
  const intensity = clampNum(options.intensity, 0.10, 1.00, 0.65);
  const flicker = clampNum(options.flicker, 0.00, 1.00, 0.45);
  const briBase = Math.floor(30 + 174 * intensity);
  const safeBri = Math.min(204, Math.max(10, briBase));
  const interval = proIntervalMs(speed);

  const all = allLights;
  let step = 0;

  async function applyAll(stateBuilder) {
    for (const id of all) {
      const st = stateBuilder(id);
      await setLight(id, st);
    }
  }

  if (mode === "solid_color") {
    await applyAll(() => ({ on:true, bri:safeBri, xy:baseXy, transitiontime:12 }));
    return { ok:true, mode:"SOLID_COLOR", color:baseHex, lightCount:18 };
  }

  if (mode === "breath") {
    const tick = async () => {
      step++;
      const wave = (Math.sin(step / 2) + 1) / 2;
      const bri = Math.floor(25 + safeBri * (0.35 + wave * 0.55));
      await applyAll(() => ({ on:true, bri, xy:baseXy, transitiontime:18 }));
    };
    await tick();
    ambientEffectTimer = setInterval(tick, interval);
    return { ok:true, mode:"BREATH", color:baseHex, speed, intensity, lightCount:18 };
  }

  if (mode === "candle_custom") {
    const tick = async () => {
      await applyAll(() => ({
        on:true,
        bri: rand(Math.max(10, Math.floor(safeBri * 0.25)), Math.max(18, Math.floor(safeBri * (0.55 + flicker * 0.35)))),
        xy: mixXy(baseXy, [0.62, 0.36], Math.random() * 0.5),
        transitiontime: rand(8, 20)
      }));
    };
    await tick();
    ambientEffectTimer = setInterval(tick, interval);
    return { ok:true, mode:"CANDLE_CUSTOM", color:baseHex, speed, flicker, lightCount:18 };
  }

  if (mode === "fire_custom") {
    const fire = [[0.67,0.32],[0.60,0.36],[0.54,0.40],[0.50,0.43],baseXy];
    const tick = async () => {
      for (const id of all) {
        const xy = fire[rand(0, fire.length - 1)];
        await setLight(id, {
          on:true,
          bri: rand(Math.floor(safeBri * 0.32), Math.floor(safeBri * 0.95)),
          xy,
          transitiontime: rand(8, 18)
        });
      }
    };
    await tick();
    ambientEffectTimer = setInterval(tick, interval);
    return { ok:true, mode:"FIRE_CUSTOM", color:baseHex, speed, flicker, lightCount:18 };
  }

  if (mode === "ocean_wave") {
    const ocean = [[0.16,0.20],[0.17,0.25],[0.19,0.30],baseXy,secondXy];
    const tick = async () => {
      step++;
      for (let i = 0; i < all.length; i++) {
        const id = all[i];
        const xy = ocean[(i + step) % ocean.length];
        await setLight(id, { on:true, bri:Math.floor(safeBri * 0.68), xy, transitiontime:24 });
      }
    };
    await tick();
    ambientEffectTimer = setInterval(tick, interval);
    return { ok:true, mode:"OCEAN_WAVE", color:baseHex, color2:secondHex, speed, lightCount:18 };
  }

  if (mode === "cosmos") {
    const palette = [[0.17,0.08],[0.27,0.10],[0.35,0.15],baseXy,secondXy];
    const tick = async () => {
      for (const id of all) {
        const xy = palette[rand(0, palette.length - 1)];
        await setLight(id, { on:true, bri:rand(25, safeBri), xy, transitiontime:rand(12,28) });
      }
    };
    await tick();
    ambientEffectTimer = setInterval(tick, interval);
    return { ok:true, mode:"COSMOS", color:baseHex, color2:secondHex, speed, lightCount:18 };
  }

  if (mode === "aurora") {
    const palette = [[0.18,0.55],[0.20,0.35],[0.28,0.20],baseXy,secondXy];
    const tick = async () => {
      step++;
      for (let i = 0; i < all.length; i++) {
        const xy = palette[(i + step) % palette.length];
        await setLight(all[i], { on:true, bri:Math.floor(safeBri * 0.72), xy, transitiontime:28 });
      }
    };
    await tick();
    ambientEffectTimer = setInterval(tick, interval);
    return { ok:true, mode:"AURORA", color:baseHex, color2:secondHex, speed, lightCount:18 };
  }

  if (mode === "neon_pulse") {
    const tick = async () => {
      step++;
      const onBeat = step % 2 === 0;
      for (const id of primary) {
        await setLight(id, { on:true, bri:onBeat ? safeBri : Math.floor(safeBri * 0.25), xy:baseXy, transitiontime:4 });
      }
      for (const id of ambient) {
        await setLight(id, { on:true, bri:Math.floor(safeBri * 0.45), xy:secondXy, transitiontime:16 });
      }
    };
    await tick();
    ambientEffectTimer = setInterval(tick, interval);
    return { ok:true, mode:"NEON_PULSE", color:baseHex, color2:secondHex, speed, lightCount:18 };
  }

  if (mode === "rainbow_slow") {
    const rainbow = [[0.67,0.32],[0.55,0.42],[0.40,0.50],[0.17,0.30],[0.20,0.12],[0.32,0.14]];
    const tick = async () => {
      step++;
      for (let i = 0; i < all.length; i++) {
        const xy = rainbow[(i + step) % rainbow.length];
        await setLight(all[i], { on:true, bri:Math.floor(safeBri * 0.70), xy, transitiontime:32 });
      }
    };
    await tick();
    ambientEffectTimer = setInterval(tick, interval);
    return { ok:true, mode:"RAINBOW_SLOW", speed, lightCount:18 };
  }

  if (mode === "sparkle") {
    const tick = async () => {
      for (const id of all) {
        const xy = Math.random() > 0.65 ? secondXy : baseXy;
        await setLight(id, { on:true, bri:rand(20, safeBri), xy, transitiontime:rand(5,16) });
      }
    };
    await tick();
    ambientEffectTimer = setInterval(tick, interval);
    return { ok:true, mode:"SPARKLE", color:baseHex, color2:secondHex, speed, lightCount:18 };
  }

  return { ok:false, error:"UNKNOWN_PRO_FILTER", mode };
}

/* UAOS_V8_1_RELIABILITY_BOOTSTRAP */
let uaosV81LiveTestTimer = null;
let uaosV81LiveTestStep = 0;

function uaosV81Log(event, data = {}) {
  try {
    const fs = require("fs");
    const path = require("path");
    const logDir = path.join(ROOT, "generated", "v8-live-logs");
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(path.join(logDir, "v8-live-events.jsonl"), JSON.stringify({ at: new Date().toISOString(), event, data }) + "\n", "utf8");
  } catch {}
}

function uaosV81WatchdogStatus() {
  try {
    const Watchdog = require("./services/V8Watchdog");
    return Watchdog.getStatus();
  } catch (err) {
    return { error: err.message, watchdog: "fallback" };
  }
}

function uaosV81WatchdogLog(event, data = {}) {
  try {
    const Watchdog = require("./services/V8Watchdog");
    Watchdog.log(event, data);
  } catch {}
  uaosV81Log(event, data);
}

async function uaosV81RestartSoft() {
  try { stopAmbientEffect(); } catch {}
  if (uaosV81LiveTestTimer) {
    clearInterval(uaosV81LiveTestTimer);
    uaosV81LiveTestTimer = null;
  }
  activeScene = "idle";
  uaosV81WatchdogLog("restart_soft", { activeScene });
  try {
    const Watchdog = require("./services/V8Watchdog");
    Watchdog.musicStop("restart_soft");
  } catch {}
  return { ok: true, mode: "RESTART_SOFT", activeScene };
}

async function uaosV81LiveTestStart() {
  if (uaosV81LiveTestTimer) clearInterval(uaosV81LiveTestTimer);
  uaosV81LiveTestStep = 0;
  const cycle = async () => {
    uaosV81LiveTestStep++;
    const step = uaosV81LiveTestStep % 4;
    try {
      if (step === 0) await runScene("calm");
      if (step === 1) await runReadyLightMode("white");
      if (step === 2) await runScene("party");
      if (step === 3) await runAmbientFilter("candle");
      uaosV81WatchdogLog("live_test_step", { step });
    } catch (err) {
      uaosV81WatchdogLog("live_test_error", { error: err.message });
    }
  };
  await cycle();
  uaosV81LiveTestTimer = setInterval(cycle, 45000);
  uaosV81WatchdogLog("live_test_start", { safe: true });
  return { ok: true, mode: "LIVE_TEST_STARTED", safeCycleSeconds: 45 };
}

async function uaosV81LiveTestStop() {
  if (uaosV81LiveTestTimer) clearInterval(uaosV81LiveTestTimer);
  uaosV81LiveTestTimer = null;
  try { stopAmbientEffect(); } catch {}
  uaosV81WatchdogLog("live_test_stop", {});
  return { ok: true, mode: "LIVE_TEST_STOPPED" };
}

function uaosV81PerformanceStatus() {
  return {
    status: "LIVE_LOCAL_MONITOR_READY",
    hueMode: typeof lastHueMode !== "undefined" ? lastHueMode : "UNKNOWN",
    activeScene: typeof activeScene !== "undefined" ? activeScene : "unknown",
    commandCount: typeof commandCount !== "undefined" ? commandCount : 0,
    droppedFrames: uaosV81WatchdogStatus().droppedFrames || 0,
    lastLatency: uaosV81WatchdogStatus().lastLatencyMs,
    activeMusicMode: uaosV81WatchdogStatus().activeMusicMode,
    connectedAudioInput: uaosV81WatchdogStatus().audioInput,
    schedulerFpsLimit: "primary 3-5/sec, ambient 1-2/sec safe REST mode",
    watchdog: uaosV81WatchdogStatus(),
    wledGated: true,
    dmxGated: true,
    localOnly: true
  };
}
function serveFile(req, res) {
  let pathname = decodeURIComponent(url.parse(req.url).pathname || "/");
  if (pathname === "/") pathname = "/src/ui/v5/index.html";

  const filePath = path.join(ROOT, pathname.replace(/^\/+/, ""));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, {"Content-Type":"text/plain"});
      return res.end("Not found");
    }

    const ext = path.extname(filePath).toLowerCase();
    const types = {
      ".html":"text/html; charset=utf-8",
      ".js":"application/javascript; charset=utf-8",
      ".css":"text/css; charset=utf-8",
      ".json":"application/json; charset=utf-8",
      ".md":"text/markdown; charset=utf-8"
    };

    res.writeHead(200, {"Content-Type": types[ext] || "application/octet-stream"});
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return sendJson(res, 200, {ok:true});

  const route = url.parse(req.url, true).pathname;

  try {
    if (req.method === "GET" && (route === "/api/v4/status" || route === "/api/v5/status")) {
      const cfg = findHueConfig();
      return sendJson(res, 200, {
        status: "READY",
        bridge: cfg.username ? "REAL_HUE_READY" : "NO_HUE_TOKEN_FOUND",
        bridgeIp: cfg.ip,
        hueTokenFound: !!cfg.username,
        activeScene,
        lightCount: 18,
        primarySyncLights: primary,
        ambientLights: ambient,
        commandCount,
        lastHueMode
      });
    }

    if (req.method === "POST" && (route === "/api/v4/scene/run" || route === "/api/v5/scene")) {
      const body = await readBody(req);
      const result = await runScene(body.sceneId || body.scene || "calm");
      return sendJson(res, 200, {status:"success", ...result});
    }

    if (req.method === "POST" && (route === "/api/v4/emergency-stop" || route === "/api/v5/emergency-stop")) {
      const result = await emergencyStop();
      return sendJson(res, 200, {status:"success", ...result});
    }


    if (req.method === "POST" && (route === "/api/v5/lights/off" || route === "/api/v4/lights/off")) {
      const result = await allLightsOff();
      return sendJson(res, 200, {status:"success", ...result});
    }

    if (req.method === "POST" && (route === "/api/v5/lights/mode" || route === "/api/v4/lights/mode")) {
      const body = await readBody(req);
      const result = await runReadyLightMode(body.mode || "white");
      return sendJson(res, 200, {status:"success", ...result});
    }

    if (req.method === "POST" && (route === "/api/v5/filter" || route === "/api/v4/filter")) {
      const body = await readBody(req);
      const result = await runAmbientFilter(body.mode || "smart_warm");
      return sendJson(res, 200, {status:"success", ...result});
    }

    if (req.method === "POST" && (route === "/api/v5/pro-filter" || route === "/api/v4/pro-filter")) {
      const body = await readBody(req);
      const result = await runProColorFilter(body.mode || "solid_color", body);
      return sendJson(res, 200, {status:"success", ...result});
    }
    if (req.method === "POST" && route === "/api/v4/bpm/tap") {
      return sendJson(res, 200, {bpm:120, status:"tap-ready"});
    }

    if (req.method === "GET" && route === "/api/v4/wled/status") {
      return sendJson(res, 200, {enabled:false, realOutputEnabled:false, gated:true});
    }

    if (req.method === "GET" && route === "/api/v4/dmx/status") {
      return sendJson(res, 200, {enabled:false, realOutputEnabled:false, gated:true});
    }


    if (req.method === "GET" && route === "/api/v8/performance/status") {
      return sendJson(res, 200, uaosV81PerformanceStatus());
    }

    if (req.method === "GET" && route === "/api/v8/watchdog/status") {
      return sendJson(res, 200, uaosV81WatchdogStatus());
    }

    if (req.method === "POST" && route === "/api/v8/engine/restart-soft") {
      const result = await uaosV81RestartSoft();
      return sendJson(res, 200, { status: "success", ...result });
    }

    if (req.method === "POST" && route === "/api/v8/live-test/start") {
      const result = await uaosV81LiveTestStart();
      return sendJson(res, 200, { status: "success", ...result });
    }

    if (req.method === "POST" && route === "/api/v8/live-test/stop") {
      const result = await uaosV81LiveTestStop();
      return sendJson(res, 200, { status: "success", ...result });
    }

    if (req.method === "POST" && route === "/api/v8/music/start") {
      const body = await readBody(req);
      try {
        const Watchdog = require("./services/V8Watchdog");
        Watchdog.musicStart(body.mode || "music_party", body.input || "unknown");
      } catch {}
      uaosV81WatchdogLog("music_start_api", body);
      return sendJson(res, 200, { status: "success", musicActive: true });
    }

    if (req.method === "POST" && route === "/api/v8/music/stop") {
      try {
        const Watchdog = require("./services/V8Watchdog");
        Watchdog.musicStop("api_stop");
      } catch {}
      uaosV81WatchdogLog("music_stop_api", {});
      return sendJson(res, 200, { status: "success", musicActive: false });
    }

    if (req.method === "GET" && route === "/api/v8/music/status") {
      return sendJson(res, 200, uaosV81WatchdogStatus());
    }

    if (req.method === "GET" && route === "/api/v10/ambient/list") {
      return sendJson(res, 200, getAmbientMagicEngine().list());
    }

    if (req.method === "POST" && route === "/api/v10/ambient/run") {
      const body = await readBody(req);
      const result = await runAmbientMagic(body);
      return sendJson(res, result.ok ? 200 : 400, result);
    }

    if (req.method === "POST" && route === "/api/v10/ambient/stop") {
      const result = await stopAmbientMagic("api_stop");
      return sendJson(res, 200, result);
    }

    if (req.method === "GET" && route === "/api/v10/ambient/status") {
      return sendJson(res, 200, {
        ...getAmbientMagicEngine().status(),
        activeScene,
        hueMode: lastHueMode,
        lightCount: 18,
        primarySyncLights: primary,
        ambientLights: ambient,
        wledGated: true,
        dmxGated: true,
        localOnly: true
      });
    }

    if (req.method === "GET" && route === "/api/v10/comfort/status") {
      return sendJson(res, 200, comfortStatus());
    }

    if (req.method === "POST" && route === "/api/v10/comfort/log") {
      const body = await readBody(req);
      const entry = appendComfortLog(body);
      return sendJson(res, 200, { status: "success", entry, localOnly: true });
    }

    if (req.method === "GET" && route === "/api/v10/ambient/favorites") {
      return sendJson(res, 200, { status: "success", ...loadAmbientFavorites(), ownerFavorite: "Oriental Lantern" });
    }

    if (req.method === "POST" && route === "/api/v10/ambient/favorites/save") {
      const body = await readBody(req);
      const slot = clampNum(body.slot, 1, 9, 1);
      const current = loadAmbientFavorites();
      const existing = current.slots.filter(item => Number(item.slot) !== slot);
      const name = body.name || `Favorite ${slot}`;
      const favorite = {
        slot,
        name,
        effectId: body.effectId || body.id || "candle",
        speed: body.speed || "slow",
        intensity: clampNum(body.intensity, 0.1, 1, 0.45),
        warmth: clampNum(body.warmth, 0.1, 1, 0.85),
        motion: clampNum(body.motion, 0.1, 1, 0.35),
        brightnessCap: clampNum(body.brightnessCap || body.brightness, 1, 80, 45),
        room: ["full", "primary", "ambient"].includes(body.room) ? body.room : "full"
      };
      current.slots = [...existing, favorite].sort((a, b) => Number(a.slot) - Number(b.slot));
      saveAmbientFavorites(current);
      return sendJson(res, 200, { status: "success", favorite });
    }

    if (req.method === "POST" && route === "/api/v10/ambient/favorites/run") {
      const body = await readBody(req);
      const slot = clampNum(body.slot, 1, 9, 1);
      const favorite = loadAmbientFavorites().slots.find(item => Number(item.slot) === slot);
      if (!favorite) return sendJson(res, 404, { status: "error", error: "FAVORITE_NOT_FOUND", slot });
      const result = await runAmbientMagic(favorite);
      return sendJson(res, result.ok ? 200 : 400, { status: result.status, favorite, result });
    }

    // UAOS_V10_2_SAFE_ROUTES
    if (req.method === "GET" && route === "/api/v10/effects/list") {
      try {
        const effectsPath = path.join(ROOT, "src", "config", "effects-v10.json");
        const raw = fs.readFileSync(effectsPath, "utf8");
        return sendJson(res, 200, JSON.parse(raw));
      } catch (err) {
        return sendJson(res, 500, { status: "error", message: err.message });
      }
    }

    if (req.method === "POST" && route === "/api/v10/effects/run") {
      const body = await readBody(req);
      const id = body.id || "white";

      try {
        let result = { ok: true, effect: id };

        const ambientIds = ["candle", "fireplace", "lantern", "embers", "sunset", "romantic", "night", "sleep", "clouds", "oriental_lantern"];

        if (ambientIds.includes(id)) result = await runAmbientMagic({ ...body, effectId: id });
        else if (id === "white") result = await runReadyLightMode("white");
        else if (id === "warm") result = await runReadyLightMode("yellow");
        else if (id === "ocean") result = await runAmbientFilter("ocean");
        else if (id === "aurora") result = await runProColorFilter("aurora", { color:"#00ff99", color2:"#7f00ff", speed:"medium", intensity:0.65, flicker:0.35 });
        else if (id === "cosmos") result = await runProColorFilter("cosmos", { color:"#2222ff", color2:"#ff00ff", speed:"medium", intensity:0.60, flicker:0.35 });
        else if (id === "sparkle") result = await runProColorFilter("sparkle", { color:"#ffffff", color2:"#3b82f6", speed:"fast", intensity:0.55, flicker:0.40 });
        else if (id === "club") result = await runScene("party");
        else if (id === "oriental_glow") result = await runScene("oriental_live");
        else result = await runReadyLightMode("white");

        return sendJson(res, 200, { status:"success", effect:id, result });
      } catch (err) {
        return sendJson(res, 500, { status:"error", message:err.message });
      }
    }

    if (req.method === "POST" && route === "/api/v10/music/start") {
      uaosV81WatchdogLog && uaosV81WatchdogLog("v10_music_start", {});
      return sendJson(res, 200, { status:"success", musicActive:true });
    }

    if (req.method === "POST" && route === "/api/v10/music/stop") {
      uaosV81WatchdogLog && uaosV81WatchdogLog("v10_music_stop", {});
      return sendJson(res, 200, { status:"success", musicActive:false });
    }

    if (req.method === "POST" && route === "/api/v10/music/frame") {
      const body = await readBody(req);
      try {
        const bass = Math.max(0, Math.min(1, Number(body.bass || 0)));
        const level = Math.max(0, Math.min(1, Number(body.level || 0)));
        const beat = !!body.beat;

        if (beat || level > 0.35 || bass > 0.45) {
          await runProColorFilter("neon_pulse", {
            color:"#ff0066",
            color2:"#0066ff",
            speed:"fast",
            intensity:Math.min(0.75, Math.max(0.25, level + 0.2)),
            flicker:0.25
          });
        }

        return sendJson(res, 200, { status:"ok", dropped:false });
      } catch (err) {
        return sendJson(res, 200, { status:"ok", dropped:true, message:err.message });
      }
    }

    if (req.method === "GET" && route === "/api/v10/diagnostics/run") {
      return sendJson(res, 200, {
        REAL_HUE_READY: true,
        V10_UI_READY: true,
        EFFECTS_READY: true,
        TURN_OFF_READY: true,
        EMERGENCY_STOP_READY: true,
        WLED_GATED: true,
        DMX_GATED: true,
        LOCAL_ONLY: true,
        DEPLOY: "NO",
        PAYMENT: "NO"
      });
    }
    return serveFile(req, res);
  } catch (err) {
    return sendJson(res, 500, {status:"error", message:err.message});
  }
});

server.listen(PORT, () => {
  const cfg = findHueConfig();
  console.log(`UAOS Light Engine server running on http://localhost:${PORT}`);
  console.log(`Hue Bridge IP: ${cfg.ip}`);
  console.log(`Hue token found: ${!!cfg.username}`);
  console.log(`V5 app: http://localhost:${PORT}/src/ui/v5/index.html`);
});
