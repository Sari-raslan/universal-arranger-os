export const SECTIONS = ["INTRO","VAR_A","VAR_B","FILL","BREAK","ENDING"];

const CHORDS = {
  C:[60,64,67], Dm:[62,65,69], Em:[64,67,71], F:[65,69,72],
  G:[67,71,74], Am:[69,72,76], A:[69,73,76], E:[64,68,71],
  D:[62,66,69], C7:[60,64,67,70], G7:[67,71,74,77], Am7:[69,72,76,79]
};

const DEFAULT_PATTERNS = {
  POP_8BEAT:{name:"Pop 8 Beat",steps:[0,1,2,1,0,1,2,1]},
  ORIENTAL_BALADI:{name:"Oriental Baladi",steps:[0,0,2,1,0,2,1,1]},
  SLOW_6_8:{name:"Slow 6/8",steps:[0,2,1,0,2,1]}
};

export class UAOSArranger {
  constructor(bus,timeline,midi){
    this.bus=bus;
    this.timeline=timeline;
    this.midi=midi;
    this.section="VAR_A";
    this.chord="C";
    this.bpm=100;
    this.running=false;
    this.step=0;
    this.patterns=JSON.parse(localStorage.getItem("uaos.patterns") || "null") || DEFAULT_PATTERNS;
    this.patternKey="POP_8BEAT";
    this.scenes=JSON.parse(localStorage.getItem("uaos.scenes") || "[]");
  }

  save(){
    localStorage.setItem("uaos.patterns",JSON.stringify(this.patterns));
    localStorage.setItem("uaos.scenes",JSON.stringify(this.scenes));
  }

  setSection(section){
    this.section=section;
    this.timeline.add(this.bus.emit("arranger.section",{section}));
  }

  setChord(chord){
    this.chord = CHORDS[chord] ? chord : "C";
    this.timeline.add(this.bus.emit("arranger.chord",{chord:this.chord}));
  }

  setBpm(bpm){
    if(bpm>=60 && bpm<=200){
      this.bpm=bpm;
      this.timeline.add(this.bus.emit("arranger.bpm",{bpm}));
    }
  }

  setPattern(k){
    if(this.patterns[k]) this.patternKey=k;
  }

  learnPattern(){
    const key="USER_PATTERN_"+Date.now();
    this.patterns[key]={name:"User Pattern "+new Date().toLocaleTimeString(),steps:[0,1,2,1,2,0,1,2]};
    this.patternKey=key;
    this.save();
    this.timeline.add(this.bus.emit("pattern.learned",{key}));
  }

  saveScene(){
    const scene={id:"scene-"+Date.now(),section:this.section,chord:this.chord,bpm:this.bpm,patternKey:this.patternKey};
    this.scenes.push(scene);
    this.save();
    this.timeline.add(this.bus.emit("scene.saved",scene));
  }

  recallScene(id){
    const s=this.scenes.find(x=>x.id===id);
    if(!s) return;
    this.setSection(s.section);
    this.setChord(s.chord);
    this.setBpm(s.bpm);
    this.setPattern(s.patternKey);
  }

  start(){
    this.running=true;
    this.tick();
  }

  stop(){
    this.running=false;
    clearTimeout(this.timer);
    this.timeline.add(this.bus.emit("arranger.stopped",{}));
  }

  tick(){
    if(!this.running) return;
    const p=this.patterns[this.patternKey] || DEFAULT_PATTERNS.POP_8BEAT;
    const notes=CHORDS[this.chord] || CHORDS.C;
    const idx=p.steps[this.step % p.steps.length] % notes.length;
    const note=notes[idx];
    this.midi?.sendNote(note,90,150,1);
    this.timeline.add(this.bus.emit("arranger.step",{section:this.section,chord:this.chord,bpm:this.bpm,note,step:this.step,pattern:p.name}));
    this.step++;
    this.timer=setTimeout(()=>this.tick(), Math.round(60000/this.bpm/2));
  }

  exportStyle(){
    return JSON.stringify({
      product:"UAOS",
      version:"final-style",
      exportedAt:new Date().toISOString(),
      bpm:this.bpm,
      section:this.section,
      chord:this.chord,
      patternKey:this.patternKey,
      patterns:this.patterns,
      scenes:this.scenes
    },null,2);
  }

  state(){
    return {section:this.section,chord:this.chord,bpm:this.bpm,running:this.running,patternKey:this.patternKey,patterns:this.patterns,scenes:this.scenes};
  }
}
