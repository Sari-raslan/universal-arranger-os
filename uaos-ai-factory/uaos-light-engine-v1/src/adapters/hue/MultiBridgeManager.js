class MultiBridgeManager {
  constructor(config) {
    this.config = config || {};
    this.bridges = (config.hue && config.hue.bridges) || [];
    this.bridge2 = (config.hue && config.hue.bridge2) || null;
  }

  getStatus() {
    return {
      activeBridgeCount: this.bridges.length,
      bridge2Ready: !!this.bridge2,
      currentMode: "Bridge 1 only",
      futureMode: "Bridge 1 PRIMARY_SYNC_10, Bridge 2 AMBIENT_8 or extra sync group"
    };
  }

  assignLights() {
    return {
      bridge1: {
        role: "primary_current",
        primarySyncLights: ["10","11","12","13","14","15","16","17","18","19"],
        ambientLights: ["20","21","22","23","24","25","26","27"]
      },
      bridge2: {
        role: "future_secondary",
        enabled: false
      }
    };
  }
}
module.exports = MultiBridgeManager;
