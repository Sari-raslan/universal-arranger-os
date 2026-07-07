class HueScheduler {
  constructor(bridgeClient, config = {}) {
    this.client = bridgeClient;
    this.maxRequestsPerSecond = config.maxRequestsPerSecondPerBridge || 12;
    this.tokens = this.maxRequestsPerSecond;
    this.lastRefill = Date.now();
    this.queue = new Map();
    this.timer = null;
    this.metrics = { sent: 0, dropped: 0, backpressure: 0, avgLatency: 0 };
    this.priorities = { BEAT: 100, BASS: 90, PRIORITY_MAIN: 80, MID: 70, TREBLE: 60, AMBIENT: 20, BACKGROUND: 10 };
  }

  enqueue(lightId, state, priorityName = "BACKGROUND") {
    const priority = this.priorities[priorityName] || 10;
    const existing = this.queue.get(String(lightId));
    if (!existing || priority >= existing.priority) this.queue.set(String(lightId), { state, priority });
  }

  refill() {
    const now = Date.now();
    const delta = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxRequestsPerSecond, this.tokens + (delta * this.maxRequestsPerSecond));
    this.lastRefill = now;
  }

  tick() {
    this.refill();
    if (this.queue.size > 20) this.flushLowPriority();
    const allowed = Math.min(4, Math.floor(this.tokens), this.queue.size);
    if (allowed <= 0) return;
    const sorted = Array.from(this.queue.entries()).sort((a, b) => b[1].priority - a[1].priority);
    for (let i = 0; i < allowed; i++) {
      const [id, item] = sorted[i];
      const start = Date.now();
      this.client.setLightState(id, item.state).then(() => {
        const latency = Date.now() - start;
        this.metrics.avgLatency = (this.metrics.avgLatency * 0.9) + (latency * 0.1);
      });
      this.queue.delete(id);
      this.tokens--;
      this.metrics.sent++;
    }
    this.metrics.backpressure = this.queue.size;
  }

  flushLowPriority() {
    for (const [id, cmd] of this.queue.entries()) {
      if (cmd.priority <= 20) { this.queue.delete(id); this.metrics.dropped++; }
    }
  }

  start() { if (!this.timer) this.timer = setInterval(() => this.tick(), 1000 / 12); }
  stop() { if (this.timer) clearInterval(this.timer); this.timer = null; }
  clear() { this.queue.clear(); }
  getMetrics() {
    return { maxRequestsPerSecond: this.maxRequestsPerSecond, tokens: Math.floor(this.tokens), queueSize: this.queue.size, sent: this.metrics.sent, dropped: this.metrics.dropped, backpressure: this.metrics.backpressure, avgLatency: Math.round(this.metrics.avgLatency), timerRunning: !!this.timer };
  }
}
module.exports = HueScheduler;
