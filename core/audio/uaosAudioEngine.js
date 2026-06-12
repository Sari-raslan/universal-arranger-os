export class UAOSAudioEngine {
  constructor(bus, timeline){
    this.bus = bus;
    this.timeline = timeline;
    this.ctx = null;
    this.analyser = null;
  }

  async start(){
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.ctx = new AudioContext();
    const src = this.ctx.createMediaStreamSource(stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    src.connect(this.analyser);
    this.bus.emit("audio.started", {});
    this.loop();
  }

  loop(){
    if(!this.analyser) return;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    const level = data.reduce((a,b)=>a+b,0) / data.length;
    const ev = { level, time: performance.now() };
    this.bus.emit("audio.level", ev);
    this.timeline?.add("audio.level", ev);
    requestAnimationFrame(()=>this.loop());
  }
}
