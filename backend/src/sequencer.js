export class Sequencer {
  constructor(){
    this.steps = Array.from({length:16}, (_,i)=>({ step:i+1, kick:i%4===0, snare:i%8===4, hat:i%2===0, bass:null }));
    this.position = 0;
    this.running = false;
  }
  start(){ this.running = true; return this.status(); }
  stop(){ this.running = false; return this.status(); }
  toggle(track, step){
    const s = this.steps[step-1];
    if(!s || !(track in s)) return this.status();
    s[track] = !s[track];
    return this.status();
  }
  tick(){
    if(this.running) this.position = (this.position % 16) + 1;
    return this.status();
  }
  status(){ return { ok:true, running:this.running, position:this.position, steps:this.steps }; }
}