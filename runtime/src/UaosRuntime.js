export class UaosRuntime {
  constructor() {
    this.state = { playing:false, section:"variation1", tempo:120, chord:null, tick:0 };
  }
  start(){ this.state.playing = true; return this.snapshot(); }
  stop(){ this.state.playing = false; return this.snapshot(); }
  setTempo(bpm){ this.state.tempo = Number(bpm) || 120; return this.snapshot(); }
  setChord(chord){ this.state.chord = chord; return this.snapshot(); }
  triggerSection(section){ this.state.section = section || "variation1"; return this.snapshot(); }
  nextTick(){ this.state.tick += 1; return this.snapshot(); }
  snapshot(){ return { ...this.state }; }
}
