export class UAOSMidiLearn {
  constructor(bus,timeline){ this.bus=bus; this.timeline=timeline; this.learningTarget=null; this.map=JSON.parse(localStorage.getItem("uaos.v118.midiLearn")||"{}"); }
  learn(target){ this.learningTarget=target; const ev=this.bus.emit("midi.learn.start",{target}); this.timeline.add(ev); }
  capture(message){ if(!this.learningTarget)return null; const key=[message.status,message.note,message.velocity].join(":"); this.map[this.learningTarget]=key; localStorage.setItem("uaos.v118.midiLearn",JSON.stringify(this.map)); const ev=this.bus.emit("midi.learn.captured",{target:this.learningTarget,key}); this.timeline.add(ev); this.learningTarget=null; return key; }
  resolve(message){ const key=[message.status,message.note,message.velocity].join(":"); const found=Object.entries(this.map).find(([t,k])=>k===key); return found ? found[0] : null; }
}
