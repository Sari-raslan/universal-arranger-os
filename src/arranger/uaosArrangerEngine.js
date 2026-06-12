const DEFAULT_PATTERNS = {
  POP_8BEAT: {
    name: "Pop 8 Beat Draft",
    steps: [0,1,2,1,0,1,2,1]
  },
  ORIENTAL_BALADI: {
    name: "Oriental Baladi Draft",
    steps: [0,0,2,1,0,2,1,1]
  },
  SLOW_6_8: {
    name: "Slow 6/8 Draft",
    steps: [0,2,1,0,2,1]
  }
};

const CHORDS = {
  C: [60,64,67],
  Dm: [62,65,69],
  Em: [64,67,71],
  F: [65,69,72],
  G: [67,71,74],
  Am: [69,72,76],
  A: [69,73,76],
  E: [64,68,71],
  D: [62,66,69]
};

export const UAOS_SECTIONS = ["INTRO","VAR_A","VAR_B","FILL","BREAK","ENDING"];

export class UAOSArrangerEngine {
  constructor(bus, timeline, midi){
    this.bus = bus;
    this.timeline = timeline;
    this.midi = midi;
    this.section = "VAR_A";
    this.chord = "C";
    this.running = false;
    this.step = 0;
    this.timer = null;
    this.bpm = 100;
    this.patternKey = "POP_8BEAT";
    this.patterns = JSON.parse(localStorage.getItem("uaos.v111.patterns") || "null") || DEFAULT_PATTERNS;
  }

  savePatterns(){
    localStorage.setItem("uaos.v111.patterns", JSON.stringify(this.patterns));
  }

  learnCurrentPattern(){
    const key = "USER_PATTERN_" + Date.now();
    this.patterns[key] = {
      name: "User Pattern " + new Date().toLocaleTimeString(),
      steps: [0,1,2,1,0,2,1,2]
    };
    this.patternKey = key;
    this.savePatterns();

    const ev = this.bus.emit("pattern.learned", {
      key,
      pattern: this.patterns[key]
    });

    this.timeline.add(ev);
  }

  setPattern(key){
    this.patternKey = key;
    const ev = this.bus.emit("pattern.selected", {
      key,
      pattern: this.patterns[key]
    });
    this.timeline.add(ev);
  }

  setSection(section){
    this.section = section;
    const ev = this.bus.emit("arranger.section", { section });
    this.timeline.add(ev);
  }

  setChord(chord){
    if(chord && chord.chord) chord = chord.chord;
    this.chord = CHORDS[chord] ? chord : "C";
    const ev = this.bus.emit("arranger.chord", { chord: this.chord });
    this.timeline.add(ev);
  }

  setBpm(bpm){
    if(bpm && bpm >= 60 && bpm <= 200){
      this.bpm = bpm;
      const ev = this.bus.emit("arranger.bpm", { bpm });
      this.timeline.add(ev);
    }
  }

  start(){
    this.running = true;
    this.midi?.styleStart();
    this.tick();
  }

  stop(){
    this.running = false;
    if(this.timer) clearTimeout(this.timer);
    this.midi?.styleStop();
    const ev = this.bus.emit("arranger.stopped", {});
    this.timeline.add(ev);
  }

  tick(){
    if(!this.running) return;

    const pattern = this.patterns[this.patternKey] || DEFAULT_PATTERNS.POP_8BEAT;
    const notes = CHORDS[this.chord] || CHORDS.C;
    const index = pattern.steps[this.step % pattern.steps.length] % notes.length;
    const note = notes[index];

    this.midi?.sendNote(note, 88, 140, 1);

    const ev = this.bus.emit("arranger.step", {
      section: this.section,
      chord: this.chord,
      pattern: pattern.name,
      step: this.step,
      note,
      bpm: this.bpm
    });

    this.timeline.add(ev);

    this.step++;

    const interval = Math.round(60000 / this.bpm / 2);
    this.timer = setTimeout(()=>this.tick(), interval);
  }

  state(){
    return {
      section: this.section,
      chord: this.chord,
      bpm: this.bpm,
      running: this.running,
      patternKey: this.patternKey,
      patterns: this.patterns
    };
  }
}
