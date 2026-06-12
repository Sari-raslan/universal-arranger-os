export class UAOSPanic {
  constructor(bus, timeline, midi){
    this.bus = bus;
    this.timeline = timeline;
    this.midi = midi;
  }

  allNotesOff(){
    const output = this.midi?.output?.();
    if(!output) return false;

    for(let ch=0; ch<16; ch++){
      output.send([0xB0 + ch, 123, 0]);
      output.send([0xB0 + ch, 120, 0]);
      for(let n=0; n<128; n++){
        output.send([0x80 + ch, n, 0]);
      }
    }

    const ev = this.bus.emit("midi.panic", {
      action:"all-notes-off"
    });

    this.timeline.add(ev);

    return true;
  }
}
