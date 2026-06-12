export class UAOSTimelinePlayer {
  constructor(bus, timeline, midi){
    this.bus = bus;
    this.timeline = timeline;
    this.midi = midi;
    this.running = false;
    this.timer = null;
    this.index = 0;
  }

  play(){
    const items = this.timeline.load();
    if(!items.length) return false;

    this.running = true;
    this.index = 0;

    const ev = this.bus.emit("timeline.play.start", { count:items.length });
    this.timeline.add(ev);

    this.schedule(items);
    return true;
  }

  stop(){
    this.running = false;
    if(this.timer) clearTimeout(this.timer);
    const ev = this.bus.emit("timeline.play.stop", {});
    this.timeline.add(ev);
  }

  schedule(items){
    if(!this.running || this.index >= items.length){
      this.running = false;
      this.bus.emit("timeline.play.done", {});
      return;
    }

    const ev = items[this.index];
    const prev = this.index === 0 ? ev : items[this.index - 1];
    const delay = Math.max(0, Math.min(1000, (ev.time || 0) - (prev.time || 0)));

    this.timer = setTimeout(()=>{
      this.replayEvent(ev);
      this.index++;
      this.schedule(items);
    }, delay);
  }

  replayEvent(ev){
    this.bus.emit("timeline.replay.event", { type:ev.type, payload:ev.payload });

    if(ev.type === "midi.noteon"){
      this.midi?.sendNote(ev.payload.note, ev.payload.velocity || 90, 180, ev.payload.channel || 1);
    }

    if(ev.type === "arranger.step"){
      this.midi?.sendNote(ev.payload.note, 88, 160, 1);
    }

    if(ev.type === "voice.midi.draft"){
      this.midi?.sendNote(ev.payload.midi, ev.payload.velocity || 80, 180, 1);
    }
  }
}
