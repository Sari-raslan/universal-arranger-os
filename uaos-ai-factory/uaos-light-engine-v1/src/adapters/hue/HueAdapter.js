const fs = require("fs");
const path = require("path");
const HueBridgeClient = require("./HueBridgeClient");
const HueScheduler = require("./HueScheduler");

class HueAdapter {
  constructor(hueConfig) {
    this.config = hueConfig || {};
    this.emergencyStopActive = false;
    this.schedulers = new Map();
    this.refreshSchedulers();
  }

  updateConfig(hueConfig) {
    this.config = hueConfig || {};
    this.refreshSchedulers();
  }

  refreshSchedulers() {
    for (const b of (this.config.bridges || [])) {
      const bridgeId = String(b.id || b.name || b.ip || "main");
      if (!this.schedulers.has(bridgeId)) {
        this.schedulers.set(bridgeId, new HueScheduler(new HueBridgeClient(b), this.config.scheduler || {}));
      } else {
        this.schedulers.get(bridgeId).client.config = b;
      }
    }
  }

  getAllConfiguredSelectedLightRefs() {
    const refs = [];
    (this.config.bridges || []).forEach((b, index) => {
      const bridgeId = String(b.id || b.name || b.ip || `bridge_${index}`);
      (b.selectedLights || []).forEach(lightId => refs.push({ bridgeId, bridgeIp: b.ip, lightId: String(lightId), bridgeRealOutputEnabled: b.realOutputEnabled === true }));
    });
    return refs;
  }

  findBridge(bridgeId) {
    return (this.config.bridges || []).find(b => String(b.id) === String(bridgeId) || String(b.name) === String(bridgeId) || String(b.ip) === String(bridgeId));
  }

  getOneLightTestGateStatus(bridgeId, lightId) {
    const allRefs = this.getAllConfiguredSelectedLightRefs();
    const bridge = this.findBridge(bridgeId);
    const exactOneLight = allRefs.length === 1 && String(allRefs[0].lightId) === String(lightId) && (String(allRefs[0].bridgeId) === String(bridgeId) || String(allRefs[0].bridgeIp) === String(bridgeId));

    const status = {
      allowed: false,
      profileValid: this.config.rolloutProfile === "LIMITED_3",
      globalRealOutput: this.config.realOutputEnabled === true,
      bridgeRealOutput: bridge && bridge.realOutputEnabled === true,
      exactOneLight,
      fullRoomBlocked: this.config.allowFullRoomOutput === false,
      emergencyStopActive: !!this.emergencyStopActive,
      selectedLightCount: allRefs.length,
      blockingReasons: []
    };

    if (!status.profileValid) status.blockingReasons.push("PROFILE_NOT_LIMITED_3");
    if (!status.globalRealOutput) status.blockingReasons.push("GLOBAL_REAL_OUTPUT_DISABLED");
    if (!status.bridgeRealOutput) status.blockingReasons.push("BRIDGE_REAL_OUTPUT_DISABLED");
    if (!status.exactOneLight) status.blockingReasons.push("SELECTED_COUNT_NOT_ONE_OR_MISMATCH");
    if (!status.fullRoomBlocked) status.blockingReasons.push("FULL_ROOM_TOGGLE_MUST_BE_OFF");
    if (status.emergencyStopActive) status.blockingReasons.push("EMERGENCY_STOP_ACTIVE");
    status.allowed = status.blockingReasons.length === 0;
    return status;
  }

  getRolloutStatus() {
    const selected = this.getAllConfiguredSelectedLightRefs();
    const schedulerMetricsByBridge = {};
    this.schedulers.forEach((scheduler, id) => schedulerMetricsByBridge[id] = scheduler.getMetrics());
    return {
      profileName: this.config.rolloutProfile || "DRY_RUN",
      dryRun: (this.config.rolloutProfile || "DRY_RUN") === "DRY_RUN",
      physicalOutputAllowed: false,
      globalRealOutputEnabled: this.config.realOutputEnabled === true,
      allowFullRoomOutput: this.config.allowFullRoomOutput === true,
      selectedLightCount: selected.length,
      emergencyStopActive: this.emergencyStopActive,
      schedulerMetricsByBridge
    };
  }

  async runOneLightSequence(bridgeId, lightId, type) {
    const gate = this.getOneLightTestGateStatus(bridgeId, lightId);
    if (!gate.allowed) throw new Error(`Safety Block: ${gate.blockingReasons.join(", ")}`);
    const scheduler = this.schedulers.get(String(bridgeId));
    if (!scheduler) throw new Error(`Scheduler not found for bridge: ${bridgeId}`);
    const client = scheduler.client;
    const sequences = {
      "warm-white": [{ on: true, bri: 77, ct: 366, transitiontime: 0 }],
      "bass-pulse": [{ on: true, bri: 51, transitiontime: 0 }, { on: true, bri: 114, transitiontime: 1 }, { on: true, bri: 51, transitiontime: 4 }],
      "color-sweep": [{ on: true, xy: [0.55, 0.41], bri: 90, transitiontime: 10 }, { on: true, xy: [0.15, 0.05], bri: 90, transitiontime: 10 }, { on: true, bri: 77, ct: 366, transitiontime: 10 }]
    };
    const steps = sequences[type] || sequences["warm-white"];
    const results = [];
    for (const state of steps) {
      const res = await client.setLightStateImmediate(lightId, state);
      results.push(res);
      if (steps.length > 1) await new Promise(r => setTimeout(r, 600));
    }
    this.logTestResult(bridgeId, lightId, type, results);
    return results;
  }

  async emergencyStop() {
    this.emergencyStopActive = true;
    this.schedulers.forEach(s => { s.stop(); s.clear(); });
    const refs = this.getAllConfiguredSelectedLightRefs().filter(r => r.bridgeRealOutputEnabled);
    const tasks = refs.map(ref => {
      const scheduler = this.schedulers.get(String(ref.bridgeId));
      if (!scheduler) return Promise.resolve({ ok: false, error: "SCHEDULER_MISSING", lightId: ref.lightId });
      return scheduler.client.setLightStateImmediate(ref.lightId, { on: true, bri: 76, ct: 366, transitiontime: 0 });
    });
    return await Promise.allSettled(tasks);
  }

  clearEmergency() {
    this.emergencyStopActive = false;
    return { ok: true, emergencyStopActive: false };
  }

  logTestResult(bridgeId, lightId, type, results) {
    const dir = path.join(process.cwd(), "generated");
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, "one-light-test-results-v1.4.2.json");
    let data = [];
    if (fs.existsSync(filePath)) { try { data = JSON.parse(fs.readFileSync(filePath, "utf8")); } catch { data = []; } }
    data.push({ timestamp: new Date().toISOString(), bridgeId, lightId, type, success: results.every(r => r.ok), details: results });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
}
module.exports = HueAdapter;
