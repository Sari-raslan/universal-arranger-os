export class UAOSLaneRouter {
  constructor(bus,timeline,midi){ this.bus=bus; this.timeline=timeline; this.midi=midi; this.key="uaos.v120.laneRouter"; this.routes=JSON.parse(localStorage.getItem(this.key)||"null")||{drums:{enabled:true,channel:10,octave:0,velocity:110},bass:{enabled:true,channel:2,octave:-2,velocity:95},chord:{enabled:true,channel:3,octave:0,velocity:80},pad:{enabled:true,channel:4,octave:1,velocity:70},lead:{enabled:true,channel:1,octave:0,velocity:100}}; }
  save(){ localStorage.setItem(this.key,JSON.stringify(this.routes)); }
  update(name,patch){ this.routes[name]={...this.routes[name],...patch}; this.save(); const ev=this.bus.emit("lane.router.update",{name,route:this.routes[name]}); this.timeline.add(ev); }
  send(name,note,duration=180){ const r=this.routes[name]; if(!r||!r.enabled)return false; const finalNote=Math.max(0,Math.min(127,note+(r.octave*12))); this.midi?.sendNote?.(finalNote,r.velocity,duration,r.channel); const ev=this.bus.emit("lane.router.send",{name,note:finalNote,route:r}); this.timeline.add(ev); return true; }
}
