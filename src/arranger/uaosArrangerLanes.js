export class UAOSArrangerLanes {
  constructor(bus, timeline, midi){
    this.bus = bus;
    this.timeline = timeline;
    this.midi = midi;
    this.key = "uaos.v117.lanes";
    this.lanes = JSON.parse(localStorage.getItem(this.key) || "null") || {
      drums:{ enabled:true, channel:10, note:36, velocity:100 },
      bass:{ enabled:true, channel:2, note:36, velocity:92 },
      pad:{ enabled:true, channel:3, note:60, velocity:70 }
    };
  }

  save(){
    localStorage.setItem(this.key, JSON.stringify(this.lanes));
  }

  updateLane(name, patch){
    this.lanes[name] = { ...this.lanes[name], ...patch };
    this.save();

    const ev = this.bus.emit("lane.updated", {
      name,
      lane:this.lanes[name]
    });

    this.timeline.add(ev);
  }

  triggerAll(){
    Object.entries(this.lanes).forEach(([name,lane])=>{
      if(lane.enabled){
        this.midi?.sendNote(lane.note, lane.velocity, 140, lane.channel);
      }
    });

    const ev = this.bus.emit("lane.trigger", this.lanes);
    this.timeline.add(ev);
  }
}
