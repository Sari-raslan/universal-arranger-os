
class TimingEngine {
  constructor(){
    this.bpm = 120;
    this.ppq = 24;
    this.running = false;
    this.tick = 0;
    this.startedAt = null;
  }

  start(){
    this.running = true;
    this.startedAt = Date.now();
    this.tick = 0;
    return this.status();
  }

  stop(){
    this.running = false;
    return this.status();
  }

  setBpm(bpm){
    this.bpm = Number(bpm);
    return this.status();
  }

  advance(ticks=1){
    this.tick += Number(ticks);
    return this.status();
  }

  status(){
    return {
      ok:true,
      module:"timing",
      running:this.running,
      bpm:this.bpm,
      ppq:this.ppq,
      tick:this.tick,
      startedAt:this.startedAt
    };
  }
}

module.exports = { TimingEngine };
