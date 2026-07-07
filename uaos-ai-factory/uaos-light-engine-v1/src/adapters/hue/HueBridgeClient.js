const http = require("http");

class HueBridgeClient {
  constructor(config) {
    this.config = config || {};
    this.lastStateCache = new Map();
  }

  static rgbToXy(r, g, b) {
    r = Number(r || 0); g = Number(g || 0); b = Number(b || 0);
    if (r > 1 || g > 1 || b > 1) { r /= 255; g /= 255; b /= 255; }
    r = Math.max(0, Math.min(1, r));
    g = Math.max(0, Math.min(1, g));
    b = Math.max(0, Math.min(1, b));
    r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    const X = r * 0.664511 + g * 0.154324 + b * 0.162028;
    const Y = r * 0.283881 + g * 0.668433 + b * 0.047685;
    const Z = r * 0.000088 + g * 0.072310 + b * 0.986039;
    const sum = X + Y + Z;
    if (!sum || !isFinite(sum)) return [0.4, 0.4];
    return [Math.max(0, Math.min(1, X / sum)), Math.max(0, Math.min(1, Y / sum))];
  }

  request(method, path, body) {
    const ip = this.config.ip;
    if (!ip) return Promise.resolve({ ok: false, error: "BRIDGE_IP_MISSING" });
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: ip,
      port: 80,
      path,
      method,
      timeout: 1200,
      headers: payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {}
    };
    return new Promise((resolve) => {
      const start = Date.now();
      const req = http.request(options, (res) => {
        let data = "";
        res.on("data", chunk => data += chunk);
        res.on("end", () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, latencyMs: Date.now() - start, data }));
      });
      req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "TIMEOUT", latencyMs: Date.now() - start }); });
      req.on("error", err => resolve({ ok: false, error: err.message, latencyMs: Date.now() - start }));
      if (payload) req.write(payload);
      req.end();
    });
  }

  async pair() {
    return await this.request("POST", "/api", { devicetype: "uaos_light_engine#safe_rebuild" });
  }

  async getLights() {
    if (!this.config.username) return { ok: false, error: "USERNAME_MISSING" };
    return await this.request("GET", `/api/${this.config.username}/lights`);
  }

  async setLightState(id, state, isEmergency = false) {
    if (!this.config.username) return { ok: false, error: "USERNAME_MISSING", lightId: id };
    const stateStr = JSON.stringify(state);
    if (!isEmergency && this.lastStateCache.get(String(id)) === stateStr) {
      return { ok: true, skipped: true, lightId: id };
    }
    const res = await this.request("PUT", `/api/${this.config.username}/lights/${id}/state`, state);
    if (res.ok) this.lastStateCache.set(String(id), stateStr);
    return { ...res, skipped: false, lightId: id };
  }

  async setLightStateImmediate(id, state) {
    return await this.setLightState(id, state, true);
  }
}
module.exports = HueBridgeClient;
