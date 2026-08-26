export class Mixer {
  constructor(){
    this.tracks = [
      { name:"Drums", volume:85, mute:false, solo:false },
      { name:"Bass", volume:80, mute:false, solo:false },
      { name:"Chord", volume:75, mute:false, solo:false },
      { name:"Lead", volume:70, mute:false, solo:false },
      { name:"Pad", volume:65, mute:false, solo:false }
    ];
  }
  set(name, patch){
    const t = this.tracks.find(x=>x.name===name);
    if(t) Object.assign(t, patch);
    return this.status();
  }
  status(){ return { ok:true, tracks:this.tracks }; }
}