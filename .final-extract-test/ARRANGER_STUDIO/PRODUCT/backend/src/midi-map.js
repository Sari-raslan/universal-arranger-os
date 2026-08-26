export class MidiMap {
  constructor(){
    this.map = {
      startStop: 64,
      fill: 65,
      variationA: 66,
      variationB: 67,
      ending: 68,
      panic: 123
    };
  }
  set(key, cc){ this.map[key] = Number(cc); return this.status(); }
  status(){ return { ok:true, map:this.map }; }
}