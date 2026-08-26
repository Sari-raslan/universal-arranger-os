export class ArrangerEngine {
  constructor(){
    this.section = "Intro";
    this.tempo = 120;
  }
  setSection(section="Main A"){
    this.section = section;
    return { ok:true, section:this.section, tempo:this.tempo };
  }
  setTempo(tempo=120){
    this.tempo = tempo;
    return { ok:true, section:this.section, tempo:this.tempo };
  }
}