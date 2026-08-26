export class MidiClock {
  constructor(){ this.running=false; this.bpm=120; this.pulses=0; }
  start(bpm=120){ this.running=true; this.bpm=bpm; return this.status(); }
  stop(){ this.running=false; return this.status(); }
  tick(){ if(this.running) this.pulses++; return this.status(); }
  status(){ return { ok:true, running:this.running, bpm:this.bpm, pulses:this.pulses }; }
}