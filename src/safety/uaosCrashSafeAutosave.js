export class UAOSCrashSafeAutosave {
  constructor(bus, timeline, arranger){
    this.bus = bus;
    this.timeline = timeline;
    this.arranger = arranger;
    this.key = "uaos.v116.autosave";
    this.timer = null;
  }

  start(){
    this.timer = setInterval(()=>{
      this.save();
    }, 3000);

    window.addEventListener("beforeunload", ()=>this.save());

    const ev = this.bus.emit("autosave.start", {});
    this.timeline.add(ev);
  }

  save(){
    const snapshot = {
      savedAt: new Date().toISOString(),
      timeline: this.timeline.load(),
      arrangerState: this.arranger.state()
    };

    localStorage.setItem(this.key, JSON.stringify(snapshot));

    this.bus.emit("autosave.saved", {
      events: snapshot.timeline.length,
      section: snapshot.arrangerState.section,
      chord: snapshot.arrangerState.chord
    });
  }

  restore(){
    const raw = localStorage.getItem(this.key);
    if(!raw) return null;
    return JSON.parse(raw);
  }
}
