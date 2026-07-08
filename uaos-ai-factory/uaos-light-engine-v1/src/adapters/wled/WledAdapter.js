class WledAdapter {
  constructor(config = {}) {
    this.config = config;
    this.enabled = config.enabled === true;
  }
  getStatus() {
    return {
      enabled: this.enabled,
      outputActive: false,
      modes: ["json_api", "ddp", "e131_sacn", "artnet"],
      note: "Placeholder only. Real WLED output disabled by default."
    };
  }
  render() {
    if (!this.enabled) return { ok:false, skipped:true, reason:"WLED_DISABLED" };
    return { ok:false, skipped:true, reason:"REAL_WLED_OUTPUT_NOT_IMPLEMENTED" };
  }
}
module.exports = WledAdapter;
