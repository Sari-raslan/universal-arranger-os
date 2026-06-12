export const UAOS_SECTIONS = ["INTRO","VAR_A","VAR_B","FILL","BREAK","ENDING"];

export class UAOSArrangerEngine {
  constructor(bus, timeline){
    this.bus = bus;
    this.timeline = timeline;
    this.section = "VAR_A";
    this.chord = "C";
  }

  setSection(section){
    this.section = section;
    this.bus.emit("arranger.section", { section });
    this.timeline?.add("arranger.section", { section });
  }

  setChord(chord){
    this.chord = chord;
    this.bus.emit("arranger.chord", { chord });
    this.timeline?.add("arranger.chord", { chord });
  }

  state(){
    return { section: this.section, chord: this.chord };
  }
}
