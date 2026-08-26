export class SongArranger {
  constructor(){
    this.song = [
      { section:"Intro", bars:4, chord:"Cm" },
      { section:"Main A", bars:8, chord:"Cm" },
      { section:"Main B", bars:8, chord:"Ab" },
      { section:"Fill", bars:1, chord:"G" },
      { section:"Ending", bars:4, chord:"Cm" }
    ];
  }
  generate(style="Oriental Pop"){
    this.song = [
      { section:"Intro", bars:4, chord:"Cm", style },
      { section:"Main A", bars:8, chord:"Cm", style },
      { section:"Main B", bars:8, chord:"Ab", style },
      { section:"Break", bars:2, chord:"Bb", style },
      { section:"Ending", bars:4, chord:"Cm", style }
    ];
    return this.status();
  }
  status(){ return { ok:true, song:this.song }; }
}