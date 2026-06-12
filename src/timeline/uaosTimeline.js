export class UAOSTimeline {
  constructor(){
    this.key = "uaos.v112.timeline";
    this.items = JSON.parse(localStorage.getItem(this.key) || "[]");
    this.recording = true;
  }

  add(ev){
    if(!this.recording) return;
    this.items.push(ev);
    if(this.items.length > 8000) this.items = this.items.slice(-8000);
    this.save();
  }

  save(){
    localStorage.setItem(this.key, JSON.stringify(this.items));
  }

  load(){
    return this.items;
  }

  clear(){
    this.items = [];
    this.save();
  }

  setRecording(v){
    this.recording = !!v;
  }

  exportJson(){
    return JSON.stringify({
      product: "UAOS",
      version: "1.12-timeline-style-export",
      exportedAt: new Date().toISOString(),
      events: this.items
    }, null, 2);
  }
}

export const uaosTimeline = new UAOSTimeline();
