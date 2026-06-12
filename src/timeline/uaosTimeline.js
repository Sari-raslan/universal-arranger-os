export class UAOSTimeline {
  constructor(){
    this.key = "uaos.v111.timeline";
    this.items = JSON.parse(localStorage.getItem(this.key) || "[]");
  }

  add(ev){
    this.items.push(ev);
    if(this.items.length > 5000) this.items = this.items.slice(-5000);
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

  exportJson(){
    return JSON.stringify({
      product: "UAOS",
      version: "1.11-chord-voice-style",
      exportedAt: new Date().toISOString(),
      events: this.items
    }, null, 2);
  }
}

export const uaosTimeline = new UAOSTimeline();
