export class UAOSSampler {
  constructor(){
    this.ctx=null;
    this.buffers=[];
    this.master=null;
  }

  async init(){
    this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.master || this.ctx.createGain();
    this.master.gain.value = 0.85;
    this.master.connect(this.ctx.destination);
  }

  async loadMap(samples){
    await this.init();
    this.buffers=[];
    for(const s of samples){
      try{
        const r=await fetch("http://127.0.0.1:5199"+s.url);
        const arr=await r.arrayBuffer();
        const buf=await this.ctx.decodeAudioData(arr);
        this.buffers.push({...s,buffer:buf});
      }catch(e){
        console.warn("Sample load failed",s,e);
      }
    }
  }

  playNote(note=60, velocity=100){
    if(!this.ctx) return;
    const hit = this.buffers.find(s=>note>=s.lowNote && note<=s.highNote && velocity>=s.velocityMin && velocity<=s.velocityMax);
    if(hit){
      const src=this.ctx.createBufferSource();
      const gain=this.ctx.createGain();
      gain.gain.value=Math.max(0.05,velocity/127);
      src.buffer=hit.buffer;
      src.connect(gain).connect(this.master);
      src.start();
      return;
    }

    const osc=this.ctx.createOscillator();
    const gain=this.ctx.createGain();
    osc.frequency.value=440*Math.pow(2,(note-69)/12);
    gain.gain.value=0.12*(velocity/127);
    osc.connect(gain).connect(this.master);
    osc.start();
    osc.stop(this.ctx.currentTime+0.25);
  }

  playPattern(pattern){
    this.init();
    for(const n of pattern.notes || []){
      setTimeout(()=>this.playNote(n.note,n.velocity), n.time * (60000/(pattern.tempo||120))/480);
    }
  }
}
