export class UAOSTimeline {
  constructor(){
    this.key = "uaos.v110.timeline";
    this.items = JSON.parse(localStorage.getItem(this.key) || "[]");
  }

  add(ev){
    this.items.push(ev);
    if(this.items.length > 3000) this.items = this.items.slice(-3000);
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
      version: "1.10-music-intelligence",
      exportedAt: new Date().toISOString(),
      events: this.items
    }, null, 2);
  }
}

export const uaosTimeline = new UAOSTimeline();
