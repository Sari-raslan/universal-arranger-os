class SamplerEngine {
  constructor(){
    this.loadedKits = [];
    this.activeVoices = [];
    this.masterVolume = 1.0;
  }

  loadKit(name){
    const kit = { id:"kit_" + Date.now(), name, loaded:true };
    this.loadedKits.push(kit);
    return this.status();
  }

  trigger(sample="default", note=60, velocity=100){
    const voice = { id:"voice_" + Date.now(), sample, note, velocity, startedAt:Date.now(), active:true };
    this.activeVoices.push(voice);
    return voice;
  }

  stopAll(){
    this.activeVoices = [];
    return this.status();
  }

  setVolume(value){
    this.masterVolume = Number(value);
    return this.status();
  }

  status(){
    return {
      ok:true,
      module:"sampler",
      loadedKits:this.loadedKits,
      activeVoices:this.activeVoices.slice(-20),
      masterVolume:this.masterVolume
    };
  }
}

module.exports = { SamplerEngine };
