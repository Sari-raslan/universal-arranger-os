const DEFAULT_PATTERNS = {
  POP_8BEAT: { name:"Pop 8 Beat Draft", steps:[0,1,2,1,0,1,2,1] },
  ORIENTAL_BALADI: { name:"Oriental Baladi Draft", steps:[0,0,2,1,0,2,1,1] },
  SLOW_6_8: { name:"Slow 6/8 Draft", steps:[0,2,1,0,2,1] }
};

const CHORDS = {
  C:[60,64,67], Dm:[62,65,69], Em:[64,67,71], F:[65,69,72],
  G:[67,71,74], Am:[69,72,76], A:[69,73,76], E:[64,68,71], D:[62,66,69],
  "C7":[60,64,67,70], "G7":[67,71,74,77], "Am7":[69,72,76,79]
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
    this.patterns = JSON.parse(localStorage.getItem("uaos.v113.patterns") || "null") || DEFAULT_PATTERNS;
    this.sectionMemory = JSON.parse(localStorage.getItem("uaos.v113.sectionMemory") || "null") || {};
  }

  save(){
    localStorage.setItem("uaos.v113.patterns", JSON.stringify(this.patterns));
    localStorage.setItem("uaos.v113.sectionMemory", JSON.stringify(this.sectionMemory));
  }

  importStyleJson(text){
    const data = JSON.parse(text);
    if(data.patterns) this.patterns = data.patterns;
    if(data.sectionMemory) this.sectionMemory = data.sectionMemory;
    if(data.bpm) this.bpm = data.bpm;
    if(data.activeChord) this.chord = data.activeChord;
    if(data.activeSection) this.section = data.activeSection;
    if(data.activePattern) this.patternKey = data.activePattern;
    this.save();

    const ev = this.bus.emit("style.imported", { version:data.version || "unknown" });
    this.timeline.add(ev);
    return true;
  }

  learnFromMidi(notes){
    if(!notes || !notes.length) return false;
    const base = notes.slice(-16);
    const mapped = base.map(n => Math.abs(n.note % 3));
    const key = "MIDI_PATTERN_" + Date.now();

    this.patterns[key] = {
      name: "Recorded MIDI Pattern " + new Date().toLocaleTimeString(),
      steps: mapped.length ? mapped : [0,1,2,1]
    };

    this.patternKey = key;
    this.save();

    const ev = this.bus.emit("pattern.learned.from-midi", { key, pattern:this.patterns[key] });
    this.timeline.add(ev);
    return true;
  }

  memorizeSection(){
    this.sectionMemory[this.section] = {
      chord:this.chord,
      patternKey:this.patternKey,
      bpm:this.bpm
    };
    this.save();

    const ev = this.bus.emit("section.memory.saved", { section:this.section, memory:this.sectionMemory[this.section] });
    this.timeline.add(ev);
  }

  recallSection(section){
    const mem = this.sectionMemory[section];
    if(!mem) return false;
    this.section = section;
    this.chord = mem.chord || this.chord;
    this.patternKey = mem.patternKey || this.patternKey;
    this.bpm = mem.bpm || this.bpm;

    const ev = this.bus.emit("section.memory.recalled", { section, memory:mem });
    this.timeline.add(ev);
    return true;
  }

  setPattern(key){
    this.patternKey = key;
    const ev = this.bus.emit("pattern.selected", { key, pattern:this.patterns[key] });
    this.timeline.add(ev);
  }

  setSection(section){
    this.section = section;
    this.midi?.sendSection(section);
    const ev = this.bus.emit("arranger.section", { section });
    this.timeline.add(ev);
  }

  setChord(chord){
    if(chord && chord.chord) chord = chord.chord;
    this.chord = CHORDS[chord] ? chord : "C";
    const ev = this.bus.emit("arranger.chord", { chord:this.chord });
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
    this.midi?.transportStart();
    this.tick();
  }

  stop(){
    this.running = false;
    if(this.timer) clearTimeout(this.timer);
    this.midi?.transportStop();
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
      section:this.section,
      chord:this.chord,
      pattern:pattern.name,
      step:this.step,
      note,
      bpm:this.bpm
    });
    this.timeline.add(ev);

    this.step++;
    this.timer = setTimeout(()=>this.tick(), Math.round(60000 / this.bpm / 2));
  }

  exportStyle(){
    return JSON.stringify({
      product:"UAOS",
      version:"1.13-style-json",
      exportedAt:new Date().toISOString(),
      bpm:this.bpm,
      activeSection:this.section,
      activeChord:this.chord,
      activePattern:this.patternKey,
      patterns:this.patterns,
      sectionMemory:this.sectionMemory
    }, null, 2);
  }

  state(){
    return {
      section:this.section,
      chord:this.chord,
      bpm:this.bpm,
      running:this.running,
      patternKey:this.patternKey,
      patterns:this.patterns,
      sectionMemory:this.sectionMemory
    };
  }
}
