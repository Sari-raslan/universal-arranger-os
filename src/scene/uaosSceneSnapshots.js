export class UAOSSceneSnapshots {
  constructor(bus,timeline,arranger,midi){ this.bus=bus; this.timeline=timeline; this.arranger=arranger; this.midi=midi; this.key="uaos.v119.scenes"; this.scenes=JSON.parse(localStorage.getItem(this.key)||"[]"); }
  save(){ localStorage.setItem(this.key,JSON.stringify(this.scenes)); }
  create(name="Scene"){ const scene={id:"scene-"+Date.now(),name,createdAt:new Date().toISOString(),arranger:this.arranger?.state?.(),midiProfile:this.midi?.profile?.()}; this.scenes.push(scene); this.save(); const ev=this.bus.emit("scene.created",scene); this.timeline.add(ev); return scene; }
  recall(id){ const scene=this.scenes.find(s=>s.id===id); if(!scene)return false; const a=scene.arranger||{}; if(a.bpm)this.arranger.setBpm(a.bpm); if(a.chord)this.arranger.setChord(a.chord); if(a.section)this.arranger.setSection(a.section); if(a.patternKey)this.arranger.setPattern(a.patternKey); const ev=this.bus.emit("scene.recalled",scene); this.timeline.add(ev); return true; }
}
