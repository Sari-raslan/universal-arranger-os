const fs = require("fs");
const path = require("path");

class V8Watchdog {
  constructor() {
    this.reset();
    this.logDir = path.join(__dirname, "..", "..", "generated", "v8-live-logs");
    fs.mkdirSync(this.logDir, { recursive: true });
  }

  reset() {
    this.startedAt = new Date().toISOString();
    this.lastMusicFrameAt = null;
    this.lastErrorAt = null;
    this.hueFailureCount = 0;
    this.serverErrorCount = 0;
    this.droppedFrames = 0;
    this.musicActive = false;
    this.activeMusicMode = "none";
    this.audioInput = "none";
    this.lastLatencyMs = null;
    this.lastEvent = "reset";
  }

  log(event, data = {}) {
    const row = { at: new Date().toISOString(), event, data };
    this.lastEvent = event;
    try {
      fs.appendFileSync(path.join(this.logDir, "v8-live-events.jsonl"), JSON.stringify(row) + "\n", "utf8");
    } catch {}
    return row;
  }

  musicStart(mode = "music_party", input = "unknown") {
    this.musicActive = true;
    this.activeMusicMode = mode;
    this.audioInput = input;
    this.lastMusicFrameAt = Date.now();
    return this.log("music_start", { mode, input });
  }

  musicFrame(frame = {}) {
    this.musicActive = true;
    this.activeMusicMode = frame.mode || this.activeMusicMode || "music_party";
    this.lastMusicFrameAt = Date.now();
  }

  musicStop(reason = "manual") {
    this.musicActive = false;
    this.activeMusicMode = "none";
    return this.log("music_stop", { reason });
  }

  hueFailure(err = "unknown") {
    this.hueFailureCount++;
    this.lastErrorAt = new Date().toISOString();
    this.log("hue_failure", { err: String(err), hueFailureCount: this.hueFailureCount });
  }

  serverError(err = "unknown") {
    this.serverErrorCount++;
    this.lastErrorAt = new Date().toISOString();
    this.log("server_error", { err: String(err), serverErrorCount: this.serverErrorCount });
  }

  dropFrame(reason = "throttle") {
    this.droppedFrames++;
    this.log("frame_dropped", { reason, droppedFrames: this.droppedFrames });
  }

  setLatency(ms) {
    this.lastLatencyMs = ms;
  }

  shouldStopMusic() {
    if (!this.musicActive) return false;
    if (!this.lastMusicFrameAt) return false;
    const silenceMs = Date.now() - this.lastMusicFrameAt;
    if (silenceMs > 3000) {
      this.log("watchdog_no_music_frames", { silenceMs });
      return true;
    }
    if (this.hueFailureCount >= 15) {
      this.log("watchdog_many_hue_failures", { hueFailureCount: this.hueFailureCount });
      return true;
    }
    return false;
  }

  getStatus() {
    const now = Date.now();
    const silenceMs = this.lastMusicFrameAt ? now - this.lastMusicFrameAt : null;
    return {
      startedAt: this.startedAt,
      musicActive: this.musicActive,
      activeMusicMode: this.activeMusicMode,
      audioInput: this.audioInput,
      lastMusicFrameAt: this.lastMusicFrameAt ? new Date(this.lastMusicFrameAt).toISOString() : null,
      silenceMs,
      hueFailureCount: this.hueFailureCount,
      serverErrorCount: this.serverErrorCount,
      droppedFrames: this.droppedFrames,
      lastLatencyMs: this.lastLatencyMs,
      lastErrorAt: this.lastErrorAt,
      lastEvent: this.lastEvent,
      unstable: this.shouldStopMusic()
    };
  }
}

module.exports = new V8Watchdog();