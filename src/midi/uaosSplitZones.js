export class UAOSSplitZones {
  constructor(bus, timeline){
    this.bus = bus;
    this.timeline = timeline;
    this.key = "uaos.v117.splitZones";
    this.zones = JSON.parse(localStorage.getItem(this.key) || "null") || [
      { id:"left", name:"Left Bass", min:0, max:59, channel:2, transpose:-12 },
      { id:"right", name:"Right Lead", min:60, max:127, channel:1, transpose:0 }
    ];
  }

  save(){
    localStorage.setItem(this.key, JSON.stringify(this.zones));
  }

  addZone(){
    this.zones.push({
      id:"zone-" + Date.now(),
      name:"New Zone",
      min:60,
      max:72,
      channel:1,
      transpose:0
    });
    this.save();
  }

  updateZone(i, patch){
    this.zones[i] = { ...this.zones[i], ...patch };
    this.save();
  }

  removeZone(i){
    this.zones.splice(i,1);
    this.save();
  }

  route(note){
    return this.zones.find(z => note >= z.min && note <= z.max) || null;
  }

  exportZones(){
    return JSON.stringify({
      product:"UAOS",
      version:"1.17-split-zones",
      exportedAt:new Date().toISOString(),
      zones:this.zones
    }, null, 2);
  }
}
