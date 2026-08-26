export class LoopRecorder {
  constructor(){ this.recording = false; this.events = []; }
  start(){ this.recording = true; this.events = []; return this.status(); }
  stop(){ this.recording = false; return this.status(); }
  add(event){
    if(this.recording) this.events.push({ ...event, at: Date.now() });
    return this.status();
  }
  status(){ return { ok:true, recording:this.recording, count:this.events.length, events:this.events }; }
}