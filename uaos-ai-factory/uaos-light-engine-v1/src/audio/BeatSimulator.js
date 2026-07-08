class BeatSimulator {
  constructor(bpm = 120, intensity = 0.75) {
    this.bpm = bpm;
    this.intensity = intensity;
    this.tick = 0;
  }
  nextFrame() {
    const beat = this.tick % 4 === 0;
    this.tick++;
    return {
      bass: beat ? this.intensity : this.intensity * 0.35,
      mid: this.intensity * 0.55,
      treble: this.intensity * 0.45,
      rms: beat ? this.intensity : this.intensity * 0.4,
      beat
    };
  }
}
module.exports = BeatSimulator;
