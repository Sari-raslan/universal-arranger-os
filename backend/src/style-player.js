export class StylePlayer {
  constructor(){
    this.playing = false;
    this.style = "Oriental Pop";
    this.bar = 1;
  }
  play(style=this.style){
    this.playing = true;
    this.style = style;
    return this.status();
  }
  stop(){
    this.playing = false;
    return this.status();
  }
  tick(){
    if(this.playing) this.bar++;
    return this.status();
  }
  status(){
    return { ok:true, playing:this.playing, style:this.style, bar:this.bar };
  }
}