export class UAOSPerformanceMode {
  constructor(bus, timeline, arranger, midi, audio){
    this.bus = bus;
    this.timeline = timeline;
    this.arranger = arranger;
    this.midi = midi;
    this.audio = audio;
    this.enabled = false;
  }

  async start(){
    this.enabled = true;

    try{
      await this.midi?.start?.();
    }catch{}

    try{
      await this.audio?.start?.();
    }catch{}

    this.arranger?.start?.();

    const ev = this.bus.emit("performance.start", {
      mode:"one-click"
    });

    this.timeline.add(ev);
  }

  stop(){
    this.enabled = false;
    this.arranger?.stop?.();

    const ev = this.bus.emit("performance.stop", {});
    this.timeline.add(ev);
  }
}
