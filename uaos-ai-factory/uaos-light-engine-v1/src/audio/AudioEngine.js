class AudioEngine {
  constructor(mode = "BeatSimulator") {
    this.mode = mode;
    this.running = false;
  }
  start() { this.running = true; }
  stop() { this.running = false; }
  getStatus() { return { mode: this.mode, running: this.running, systemAudioReady: false }; }
}
module.exports = AudioEngine;
