class ArtNetAdapter {
  constructor(config = {}) {
    this.config = config;
    this.enabled = config.enabled === true;
  }
  getStatus() {
    return {
      enabled: this.enabled,
      outputActive: false,
      fixtureTypes: ["par_rgb", "led_bar", "moving_head_basic", "wash", "strobe_safe"],
      note: "Placeholder only. Real DMX/Art-Net output disabled by default."
    };
  }
  render() {
    if (!this.enabled) return { ok:false, skipped:true, reason:"DMX_DISABLED" };
    return { ok:false, skipped:true, reason:"REAL_DMX_OUTPUT_NOT_IMPLEMENTED" };
  }
}
module.exports = ArtNetAdapter;
