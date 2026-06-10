class StylePlayer {
  constructor(){
    this.currentStyle = null;
    this.currentVariation = "A";
    this.tempo = 120;
    this.playing = false;

    this.sections = {
      intro:false,
      variationA:true,
      variationB:false,
      variationC:false,
      variationD:false,
      fill:false,
      ending:false
    };
  }

  loadStyle(name){
    this.currentStyle = {
      name,
      loaded:true
    };

    return this.status();
  }

  start(){
    this.playing = true;
    return this.status();
  }

  stop(){
    this.playing = false;
    return this.status();
  }

  setTempo(bpm){
    this.tempo = bpm;
    return this.status();
  }

  setVariation(v){
    this.currentVariation = v;
    return this.status();
  }

  triggerFill(){
    this.sections.fill = true;

    setTimeout(()=>{
      this.sections.fill = false;
    },1000);

    return this.status();
  }

  status(){
    return {
      ok:true,
      style:this.currentStyle,
      variation:this.currentVariation,
      tempo:this.tempo,
      playing:this.playing,
      sections:this.sections
    };
  }
}

module.exports = { StylePlayer };
