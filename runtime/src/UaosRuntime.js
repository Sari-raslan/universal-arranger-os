export class UaosRuntime {
  constructor() {
    this.state = { playing: false, section: "variation1", tempo: 120, chord: null };
  }
  setTempo(bpm) { this.state.tempo = bpm; return this.state; }
  setChord(chord) { this.state.chord = chord; return this.state; }
  triggerSection(section) { this.state.section = section; return this.state; }
  start() { this.state.playing = true; return this.state; }
  stop() { this.state.playing = false; return this.state; }
}
