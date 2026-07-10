const DEFAULTS = {
  speed: "slow",
  intensity: 0.45,
  warmth: 0.85,
  motion: 0.35,
  brightnessCap: 45,
  room: "full"
};

const SPEEDS = {
  slow: 1.25,
  medium: 0.9,
  fast: 0.72
};

const EFFECTS = [
  { id: "candle", name: "Candle Flicker", description: "Warm yellow, amber, and soft white with small organic movement.", cap: 45, interval: [1800, 3000] },
  { id: "fireplace", name: "Fireplace", description: "Orange, red, and gold flame movement with a wider room wash.", cap: 55, interval: [1800, 2800] },
  { id: "lantern", name: "Lantern Warm", description: "Golden warm white with a very soft room pulse.", cap: 50, interval: [3500, 5000] },
  { id: "embers", name: "Embers", description: "Deep red, dark orange, and dim gold glowing coal motion.", cap: 35, interval: [4500, 6500] },
  { id: "sunset", name: "Sunset Flow", description: "Gold to orange to soft pink, smooth and flicker-free.", cap: 55, interval: [8000, 15000] },
  { id: "romantic", name: "Romantic Glow", description: "Warm pink and amber slow breathing.", cap: 45, interval: [4500, 7000] },
  { id: "night", name: "Night Warm", description: "Very low warm light, almost still and safe.", cap: 15, interval: [9000, 15000] },
  { id: "sleep", name: "Sleep Fade", description: "Warm low light that slowly fades toward a night state.", cap: 12, interval: [10000, 20000] },
  { id: "clouds", name: "Soft Clouds", description: "Warm white and pale gold drifting slowly.", cap: 40, interval: [6000, 11000] },
  { id: "oriental_lantern", name: "Oriental Lantern", description: "Owner favorite: gold, amber, and red-orange smooth lantern glow.", cap: 55, interval: [3500, 5500], favorite: true }
];

const EFFECT_MAP = Object.fromEntries(EFFECTS.map(effect => [effect.id, effect]));

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(items, index) {
  return items[Math.abs(index) % items.length];
}

function wave(step, lightIndex, motion) {
  return (Math.sin(step * motion + lightIndex * 0.61) + 1) / 2;
}

function bri(percent) {
  return Math.max(1, Math.min(204, Math.round(254 * (percent / 100))));
}

function normalizeOptions(input, effect) {
  const options = { ...DEFAULTS, ...(input || {}) };
  const effectCap = effect ? effect.cap : 45;
  const cap = clamp(options.brightnessCap ?? options.brightness, 1, 80, effectCap);
  const hardCap = Math.min(cap, effectCap, 80);
  const room = ["full", "primary", "ambient"].includes(options.room) ? options.room : "full";
  const speed = SPEEDS[String(options.speed || "").toLowerCase()] ? String(options.speed).toLowerCase() : DEFAULTS.speed;

  return {
    speed,
    intensity: clamp(options.intensity, 0.1, 1, DEFAULTS.intensity),
    warmth: clamp(options.warmth, 0.1, 1, DEFAULTS.warmth),
    motion: clamp(options.motion, 0.1, 1, DEFAULTS.motion),
    brightnessCap: hardCap,
    room
  };
}

function roomLights(room, primary, ambient) {
  if (room === "primary") return primary;
  if (room === "ambient") return ambient;
  return [...primary, ...ambient];
}

function capBrightness(percent, options) {
  return Math.max(1, Math.min(options.brightnessCap, percent));
}

function buildState(effectId, lightId, index, step, options, isPrimary) {
  const motion = 0.22 + options.motion * 0.65;
  const warmth = options.warmth;
  const pulse = wave(step, index, motion);
  const jitter = (Math.random() - 0.5) * options.motion;
  const soft = Math.max(0, Math.min(1, pulse + jitter));

  if (effectId === "candle") {
    const pct = capBrightness(16 + options.intensity * 16 + soft * 12, options);
    const ct = rand(Math.round(430 + warmth * 20), 500);
    return { on: true, bri: bri(pct), ct, transitiontime: rand(18, 30) };
  }

  if (effectId === "fireplace") {
    const palette = isPrimary ? [[0.67, 0.32], [0.61, 0.36], [0.55, 0.40]] : [[0.60, 0.36], [0.53, 0.42], [0.68, 0.30], [0.48, 0.44]];
    const pct = capBrightness(22 + options.intensity * 20 + soft * 15, options);
    return { on: true, bri: bri(pct), xy: pick(palette, step + index + rand(0, 2)), transitiontime: rand(18, 28) };
  }

  if (effectId === "lantern") {
    const pct = capBrightness(24 + options.intensity * 14 + soft * 8, options);
    return { on: true, bri: bri(pct), xy: [0.50 + warmth * 0.05, 0.41], transitiontime: rand(35, 50) };
  }

  if (effectId === "embers") {
    const palette = [[0.67, 0.30], [0.62, 0.34], [0.55, 0.38], [0.48, 0.42]];
    const pct = capBrightness(8 + options.intensity * 12 + soft * 13, options);
    return { on: true, bri: bri(pct), xy: pick(palette, step + index), transitiontime: rand(45, 65) };
  }

  if (effectId === "sunset") {
    const palette = [[0.52, 0.42], [0.58, 0.36], [0.48, 0.31]];
    const pct = capBrightness(28 + options.intensity * 18, options);
    return { on: true, bri: bri(pct), xy: pick(palette, step + Math.floor(index / 6)), transitiontime: rand(80, 150) };
  }

  if (effectId === "romantic") {
    const pct = capBrightness(18 + options.intensity * 16 + pulse * 10, options);
    return { on: true, bri: bri(pct), xy: pulse > 0.5 ? [0.50, 0.24] : [0.57, 0.35], transitiontime: rand(45, 70) };
  }

  if (effectId === "night") {
    const pct = capBrightness(4 + options.intensity * 7, { ...options, brightnessCap: Math.min(options.brightnessCap, 15) });
    return { on: true, bri: bri(pct), ct: 500, transitiontime: rand(90, 150) };
  }

  if (effectId === "sleep") {
    const fade = Math.max(0.25, 1 - step * 0.04);
    const pct = capBrightness((4 + options.intensity * 8) * fade, { ...options, brightnessCap: Math.min(options.brightnessCap, 12) });
    return { on: true, bri: bri(pct), ct: 500, transitiontime: rand(120, 200) };
  }

  if (effectId === "clouds") {
    const palette = [[0.44, 0.40], [0.48, 0.42], [0.40, 0.38]];
    const pct = capBrightness(18 + options.intensity * 12 + pulse * 8, options);
    return { on: true, bri: bri(pct), xy: pick(palette, step + Math.floor(index / 3)), transitiontime: rand(60, 110) };
  }

  const pct = capBrightness(18 + options.intensity * 18 + pulse * 12, options);
  const palette = [[0.54, 0.42], [0.59, 0.36], [0.65, 0.32], [0.50, 0.38]];
  return { on: true, bri: bri(pct), xy: pick(palette, step + index), transitiontime: rand(35, 55) };
}

class AmbientMagicEngine {
  constructor({ setLight, primary, ambient, onScene }) {
    this.setLight = setLight;
    this.primary = primary;
    this.ambient = ambient;
    this.onScene = onScene || (() => {});
    this.timer = null;
    this.activeAmbientEffect = null;
    this.runningFrame = false;
    this.droppedFrames = 0;
    this.lastSuccessCount = 0;
    this.lastFailCount = 0;
    this.step = 0;
  }

  list() {
    return { status: "success", items: EFFECTS };
  }

  status() {
    return {
      status: "success",
      activeAmbientEffect: this.activeAmbientEffect,
      running: !!this.timer || !!this.activeAmbientEffect,
      droppedFrames: this.droppedFrames,
      lastSuccessCount: this.lastSuccessCount,
      lastFailCount: this.lastFailCount
    };
  }

  stop(reason = "ambient_stop") {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const stopped = this.activeAmbientEffect;
    this.activeAmbientEffect = null;
    this.runningFrame = false;
    return { ok: true, status: "success", stopped: !!stopped, reason, previous: stopped };
  }

  async run(request = {}) {
    const effectId = String(request.effectId || request.id || "candle").toLowerCase();
    const effect = EFFECT_MAP[effectId];
    if (!effect) return { ok: false, status: "error", error: "UNKNOWN_AMBIENT_EFFECT", effectId };

    this.stop("replace");
    const options = normalizeOptions(request, effect);
    this.activeAmbientEffect = { ...effect, options, startedAt: new Date().toISOString() };
    this.step = 0;
    this.onScene("ambient_" + effectId);
    await this.tick();
    return {
      ok: true,
      status: "success",
      activeAmbientEffect: this.activeAmbientEffect,
      successCount: this.lastSuccessCount,
      failCount: this.lastFailCount
    };
  }

  nextDelay() {
    const effect = this.activeAmbientEffect;
    if (!effect) return 3000;
    const factor = SPEEDS[effect.options.speed] || SPEEDS.slow;
    return Math.round(rand(effect.interval[0], effect.interval[1]) * factor);
  }

  schedule() {
    if (!this.activeAmbientEffect) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.tick(), this.nextDelay());
  }

  async tick() {
    if (!this.activeAmbientEffect) return;
    if (this.runningFrame) {
      this.droppedFrames++;
      this.schedule();
      return;
    }

    this.runningFrame = true;
    const effect = this.activeAmbientEffect;
    const lights = roomLights(effect.options.room, this.primary, this.ambient);
    this.step++;
    const results = [];

    try {
      for (let i = 0; i < lights.length; i++) {
        const id = lights[i];
        const state = buildState(effect.id, id, i, this.step, effect.options, this.primary.includes(id));
        results.push(await this.setLight(id, state));
      }
      this.lastSuccessCount = results.filter(item => item && item.ok).length;
      this.lastFailCount = results.filter(item => !item || !item.ok).length;
    } finally {
      this.runningFrame = false;
      this.schedule();
    }
  }
}

AmbientMagicEngine.EFFECTS = EFFECTS;
AmbientMagicEngine.normalizeOptions = normalizeOptions;

module.exports = AmbientMagicEngine;
