export class UAOSLatencyMonitor {
  constructor(bus, timeline){
    this.bus = bus;
    this.timeline = timeline;
    this.samples = [];
    this.last = performance.now();
    this.running = false;
  }

  start(){
    this.running = true;
    this.loop();
  }

  stop(){
    this.running = false;
  }

  loop(){
    if(!this.running) return;

    const now = performance.now();
    const delta = now - this.last;
    this.last = now;

    const latency = Math.round(Math.max(0, delta - 16.67));

    this.samples.push(latency);
    if(this.samples.length > 60) this.samples.shift();

    const avg = Math.round(this.samples.reduce((a,b)=>a+b,0) / this.samples.length);

    const ev = this.bus.emit("latency.monitor", {
      latency,
      average: avg
    });

    this.timeline.add(ev);

    requestAnimationFrame(()=>this.loop());
  }
}
