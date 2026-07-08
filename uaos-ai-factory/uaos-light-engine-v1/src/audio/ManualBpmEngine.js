class ManualBpmEngine {
  constructor(bpm = 120) {
    this.bpm = bpm;
    this.intervalMs = Math.max(120, Math.round(60000 / bpm));
  }
  getIntervalMs() { return this.intervalMs; }
}
module.exports = ManualBpmEngine;
