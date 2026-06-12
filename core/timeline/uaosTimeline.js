export class UAOSTimeline {
  constructor(){ this.items = JSON.parse(localStorage.getItem("uaos.timeline") || "[]"); }
  add(type, payload){
    const item = { id: crypto.randomUUID(), type, payload, time: performance.now(), ts: Date.now() };
    this.items.push(item);
    this.save();
    return item;
  }
  save(){ localStorage.setItem("uaos.timeline", JSON.stringify(this.items)); }
  load(){ return this.items; }
  clear(){ this.items = []; this.save(); }
}
export const uaosTimeline = new UAOSTimeline();
